import { Node, Edge, WorkflowConfig, LogEntry, TaskNode, AgentNode } from '../types';

type LogCallback = (log: LogEntry) => void;

function getCurrentTimestamp(): string {
    return new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export class WorkflowRunner {
    private nodes: Node[];
    private edges: Edge[];
    private config: WorkflowConfig;
    private logCallback: LogCallback;
    private isRunning: boolean = false;
    private timeoutId: number | null = null;

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

    private getTopologicalOrder(): TaskNode[] {
        const taskNodes = this.nodes.filter(n => n.type === 'task') as TaskNode[];
        const adj: { [key: string]: string[] } = {};
        const inDegree: { [key: string]: number } = {};

        taskNodes.forEach(task => {
            adj[task.id] = [];
            inDegree[task.id] = 0;
        });

        this.edges.forEach(edge => {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (source?.type === 'task' && target?.type === 'task') {
                adj[source.id].push(target.id);
                inDegree[target.id]++;
            }
        });

        const queue = taskNodes.filter(task => inDegree[task.id] === 0);
        const order: TaskNode[] = [];

        while (queue.length > 0) {
            const currentId = queue.shift()!.id;
            const currentNode = taskNodes.find(t => t.id === currentId)!;
            order.push(currentNode);

            (adj[currentId] || []).forEach(neighborId => {
                inDegree[neighborId]--;
                if (inDegree[neighborId] === 0) {
                    queue.push(taskNodes.find(t => t.id === neighborId)!);
                }
            });
        }
        
        if (order.length !== taskNodes.length) {
            this.log('error', 'Cycle detected in workflow graph. Cannot determine execution order.');
            return []; // Cycle detected
        }
        return order;
    }

    public async run() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.log('info', 'Workflow run started.');

        const orderedTasks = this.getTopologicalOrder();

        if (orderedTasks.length === 0 && this.nodes.some(n => n.type === 'task')) {
             this.log('error', 'Could not determine task execution order. Check for cycles or disconnected tasks.');
             this.isRunning = false;
             return;
        }

        try {
            for (const task of orderedTasks) {
                if (!this.isRunning) {
                    this.log('info', 'Workflow execution was stopped.');
                    return;
                }

                this.log('info', `Executing task: "${task.label}"...`);
                await this.sleep(1000);

                const agentNode = this.getAgentForTask(task.id);
                if (agentNode) {
                    this.log('info', `Agent "${agentNode.label}" is performing the task.`);
                    await this.sleep(1500);
                } else {
                    this.log('error', `Task "${task.label}" has no assigned agent. Skipping.`);
                    continue;
                }
                
                this.log('output', `Task "${task.label}" completed with output: ${task.data.expected_output}`);
                await this.sleep(500);
            }
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
