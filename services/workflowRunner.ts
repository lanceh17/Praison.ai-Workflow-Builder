import { Node, Edge, WorkflowConfig, LogEntry, TaskNode, AgentNode, OutputNode, WaitNode } from '../types';

type LogCallback = (log: LogEntry) => void;

function getCurrentTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

type SequenceNode = TaskNode | WaitNode;

export class WorkflowRunner {
    private nodes: Node[];
    private edges: Edge[];
    private config: WorkflowConfig;
    private logCallback: LogCallback;
    private isRunning: boolean = false;
    private timeoutId: number | null = null;
    private taskOutputs: Map<string, string> = new Map();
    private initialInput: string | null = null;

    constructor(nodes: Node[], edges: Edge[], config: WorkflowConfig, logCallback: LogCallback) {
        this.nodes = nodes;
        this.edges = edges;
        this.config = config;
        this.logCallback = logCallback;
    }

    private log(type: LogEntry['type'], message: string) {
        this.logCallback({ type, message, timestamp: getCurrentTimestamp() });
    }
    
    public setInitialInput(message: string) {
        this.initialInput = message;
    }

    private getAgentForTask(taskId: string): AgentNode | undefined {
        const agentEdge = this.edges.find(e => e.target === taskId && this.nodes.find(n => n.id === e.source)?.type === 'agent');
        if (!agentEdge) return undefined;
        return this.nodes.find(n => n.id === agentEdge.source) as AgentNode | undefined;
    }

    private getTopologicalOrder(): SequenceNode[] {
        const sequenceNodes = this.nodes.filter(
            n => n.type === 'task' || n.type === 'wait'
        ) as SequenceNode[];
        
        const adj: { [key: string]: string[] } = {};
        const inDegree: { [key:string]: number } = {};
        const nodeMap = new Map<string, SequenceNode>(sequenceNodes.map(n => [n.id, n]));

        // Initialize adjacency list and in-degree map
        sequenceNodes.forEach(node => {
            adj[node.id] = [];
            inDegree[node.id] = 0;
        });

        // Build the graph and in-degrees from edges between sequence nodes
        this.edges.forEach(edge => {
            const sourceExists = nodeMap.has(edge.source);
            const targetExists = nodeMap.has(edge.target);

            if (sourceExists && targetExists) {
                adj[edge.source].push(edge.target);
                inDegree[edge.target]++;
            }
        });

        // Initialize the queue with nodes that have an in-degree of 0
        const queue: SequenceNode[] = sequenceNodes.filter(node => inDegree[node.id] === 0);
        const order: SequenceNode[] = [];

        while (queue.length > 0) {
            const currentNode = queue.shift()!;
            order.push(currentNode);

            // For each neighbor, decrement its in-degree
            adj[currentNode.id]?.forEach(neighborId => {
                inDegree[neighborId]--;
                if (inDegree[neighborId] === 0) {
                    const neighborNode = nodeMap.get(neighborId);
                    if (neighborNode) {
                        queue.push(neighborNode);
                    }
                }
            });
        }

        if (order.length !== sequenceNodes.length) {
            const cycleNodes = sequenceNodes
                .filter(n => inDegree[n.id] > 0)
                .map(n => `"${n.label}"`)
                .join(', ');
            this.log('error', `Cycle detected in workflow graph involving nodes: ${cycleNodes}. Cannot determine execution order.`);
            return []; // Cycle detected
        }

        return order;
    }
    
    private processOutputs() {
        const outputNodes = this.nodes.filter(n => n.type === 'output') as OutputNode[];
        if (outputNodes.length === 0) {
            this.log('info', 'No output nodes defined. Workflow finished.');
            return;
        }

        outputNodes.forEach(outputNode => {
            const incomingEdge = this.edges.find(e => e.target === outputNode.id);
            if (incomingEdge) {
                const sourceTaskOutput = this.taskOutputs.get(incomingEdge.source);
                if (sourceTaskOutput !== undefined) {
                    const { type, filename, url } = outputNode.data;
                    let message = '';
                    switch (type) {
                        case 'SaveToFile':
                            message = `(Save to File: ${filename || 'output.txt'}): ${sourceTaskOutput}`;
                            break;
                        case 'Webhook':
                            this.log('info', `Simulating POST request to ${url || 'Not configured'}.`);
                            message = `(Webhook to ${url || 'N/A'}): ${sourceTaskOutput}`;
                            break;
                        case 'Display':
                        default:
                            message = `(Display): ${sourceTaskOutput}`;
                            break;
                    }
                    this.log('output', message);
                } else {
                    this.log('error', `Output node "${outputNode.label}" is connected to a node that produced no output.`);
                }
            } else {
                this.log('error', `Output node "${outputNode.label}" is not connected to any task.`);
            }
        });
    }

    public async run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.taskOutputs.clear();
        this.log('info', 'Workflow run started.');

        const orderedSequence = this.getTopologicalOrder();

        if (orderedSequence.length === 0 && this.nodes.some(n => n.type === 'task' || n.type === 'wait')) {
             // Error is logged inside getTopologicalOrder if it fails
             this.isRunning = false;
             return;
        }

        try {
            for (const node of orderedSequence) {
                if (!this.isRunning) {
                    this.log('info', 'Workflow execution was stopped.');
                    return;
                }

                if (node.type === 'task') {
                    this.log('info', `Executing task: "${node.label}"...`);
                    await this.sleep(1000);
                    
                    // Check for chat input on first task
                    const isFirstTask = !this.edges.some(e => e.target === node.id && (this.nodes.find(n => n.id === e.source)?.type === 'task' || this.nodes.find(n => n.id === e.source)?.type === 'wait'));
                    if (isFirstTask && this.initialInput) {
                        this.log('info', `Using chat input: "${this.initialInput}"`);
                    }


                    const agentNode = this.getAgentForTask(node.id);
                    if (agentNode) {
                        this.log('info', `Agent "${agentNode.label}" is performing the task.`);
                        await this.sleep(1500);
                    } else {
                        this.log('error', `Task "${node.label}" has no assigned agent. Skipping.`);
                        continue;
                    }
                    
                    const output = node.data.expected_output;
                    this.taskOutputs.set(node.id, output);
                    this.log('success', `Task "${node.label}" completed.`);
                    await this.sleep(500);

                } else if (node.type === 'wait') {
                    const duration = node.data.duration;
                    this.log('info', `Waiting for ${duration} seconds...`);
                    await this.sleep(duration * 1000);
                    this.log('success', `Wait finished.`);
                    this.taskOutputs.set(node.id, ''); // Wait nodes produce no output
                }
            }

            this.processOutputs();
            
            this.log('success', 'Workflow completed successfully.');
        } catch (error) {
            this.log('error', `Workflow failed: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            this.isRunning = false;
            this.initialInput = null; // Clear chat message after run
        }
    }

    public stop() {
        if (!this.isRunning) return;
        this.log('info', 'Stopping workflow...');
        this.isRunning = false;
        if(this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
    
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => {
            this.timeoutId = window.setTimeout(() => {
                this.timeoutId = null;
                resolve();
            }, ms);
        });
    }
}