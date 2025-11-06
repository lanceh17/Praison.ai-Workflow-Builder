// Fix: Define all necessary types for the application.
export type NodeType = 'agent' | 'task' | 'tool' | 'trigger';

export interface Point {
  x: number;
  y: number;
}

export interface BaseNode {
  id: string;
  type: NodeType;
  position: Point;
  label: string;
}

export interface AgentNodeData {
  role: string;
  goal: string;
  backstory: string;
  memory: boolean;
}
export interface AgentNode extends BaseNode {
  type: 'agent';
  data: AgentNodeData;
}

export interface TaskNodeData {
  description: string;
  expected_output: string;
}
export interface TaskNode extends BaseNode {
  type: 'task';
  data: TaskNodeData;
}

export interface ToolNodeData {
  name: string;
}
export interface ToolNode extends BaseNode {
  type: 'tool';
  data: ToolNodeData;
}

export interface TriggerNodeData {
  // FIX: Add 'Chat' to the union type to support chat-based workflows.
  type: 'Manual' | 'Schedule' | 'Webhook' | 'Chat';
  config?: {
    cron?: string;
    url?: string;
  };
}
export interface TriggerNode extends BaseNode {
  type: 'trigger';
  data: TriggerNodeData;
}

export type Node = AgentNode | TaskNode | ToolNode | TriggerNode;

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowConfig {
  process: 'sequential' | 'hierarchical';
  verbose: boolean;
}

export interface Workflow {
  nodes: Node[];
  edges: Edge[];
  config: WorkflowConfig;
}

export interface WorkflowTemplate {
    name: string;
    description: string;
    workflow: Workflow;
}

export type WorkflowStatus = 'idle' | 'running' | 'stopped' | 'error';

export interface LogEntry {
  timestamp: string;
  type: 'success' | 'error' | 'info' | 'output';
  message: string;
}