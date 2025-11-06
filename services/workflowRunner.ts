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

    constructor(nodes: Node[], edges: Edge[], config: WorkflowConfig, logCallback: LogCallback) {
        this.nodes = nodes;
        this.edges = edges;
        this.config = config;
        this.logCallback = logCallback;
    }

    private log(type: LogEntry['type'], message: string) {
        this.logCallback({ type, message, timestamp: getCurrentTimestamp() });
    }

    private getAgentForTask(taskId: string): AgentNode | undefined {
        const agentEdge = this.edges.find(e => e.target === taskId && this.nodes.find(n => n.id === e.source)?.type === 'agent');
        if (!agentEdge) return undefined;
        return this.nodes.find(n => n.id === agentEdge.source) as AgentNode | undefined;
    }

    private getTopologicalOrder(): SequenceNode[] {
        const sequenceNodes = this.nodes.filter(n => n.type === 'task' || n.type === 'wait') as SequenceNode[];
        const adj: { [key: string]: string[] } = {};
        const inDegree: { [key: string]: number } = {};

        sequenceNodes.forEach(node => {
            adj[node.id] = [];
            inDegree[node.id] = 0;
        });

        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            const isSourceSequence = source?.type === 'task' || source?.type === 'wait' || source?.type === 'trigger';
            const isTargetSequence = target?.type === 'task' || target?.type === 'wait';
            
            if (source && target && isSourceSequence && isTargetSequence) {
                adj[source.id] = adj[source.id] || [];
                adj[source.id].push(target.id);
                inDegree[target.id]++;
            }
        });

        // Trigger nodes provide the starting points
        const triggerEdges = this.edges.filter(e => this.nodes.find(n => n.id === e.source)?.type === 'trigger');
        triggerEdges.forEach(edge => {
             const targetNode = sequenceNodes.find(n => n.id === edge.target);
             // Start from triggers, but don't assume inDegree is 0
        });

        const queue = sequenceNodes.filter(node => inDegree[node.id] === 0);
        const order: SequenceNode[] = [];

        while (queue.length > 0) {
            const current = queue.shift()!;
            order.push(current);

            this.edges.forEach(edge => {
                if(edge.source === current.id) {
                    const neighbor = sequenceNodes.find(n => n.id === edge.target);
                    if (neighbor) {
                        inDegree[neighbor.id]--;
                        if(inDegree[neighbor.id] === 0) {
                            queue.push(neighbor);
                        }
                    }
                }
            });
        }
        
        if (order.length !== sequenceNodes.length) {
            this.log('error', 'Cycle detected in workflow graph. Cannot determine execution order.');
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
                    const { type, filename } = outputNode.data;
                    let message = '';
                    if (type === 'SaveToFile') {
                        message = `(Save to File: ${filename || 'output.txt'}): ${sourceTaskOutput}`;
                    } else {
                        message = `(Display): ${sourceTaskOutput}`;
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
             this.log('error', 'Could not determine execution order. Check for cycles or disconnected nodes.');
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