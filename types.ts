export interface Point {
  x: number;
  y: number;
}

export type NodeType = 'agent' | 'task' | 'tool' | 'trigger' | 'output' | 'wait';

// Node data interfaces
export interface BaseNodeData {
    [key: string]: any;
}

export interface AgentNodeData extends BaseNodeData {
    role: string;
    goal: string;
    backstory: string;
    memory: boolean;
}

export interface TaskNodeData extends BaseNodeData {
    description: string;
    expected_output: string;
}

export interface ToolNodeData extends BaseNodeData {
    name: 'duckduckgo_search' | 'google_search' | 'file_reader' | 'calculator' | string;
}

export type TriggerType = 'Manual' | 'Schedule' | 'Webhook' | 'Chat';

export interface TriggerNodeData extends BaseNodeData {
    type: TriggerType;
}

export type OutputType = 'Display' | 'SaveToFile';

export interface OutputNodeData extends BaseNodeData {
    type: OutputType;
    filename?: string;
}

export interface WaitNodeData extends BaseNodeData {
    duration: number; // in seconds
}

// Node interfaces
export interface BaseNode {
  id: string;
  type: NodeType;
  position: Point;
  label: string;
}

export interface AgentNode extends BaseNode {
  type: 'agent';
  data: AgentNodeData;
}

export interface TaskNode extends BaseNode {
  type: 'task';
  data: TaskNodeData;
}

export interface ToolNode extends BaseNode {
  type: 'tool';
  data: ToolNodeData;
}

export interface TriggerNode extends BaseNode {
  type: 'trigger';
  data: TriggerNodeData;
}

export interface OutputNode extends BaseNode {
  type: 'output';
  data: OutputNodeData;
}

export interface WaitNode extends BaseNode {
  type: 'wait';
  data: WaitNodeData;
}

export type Node = AgentNode | TaskNode | ToolNode | TriggerNode | OutputNode | WaitNode;

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowConfig {
  process: 'sequential' | 'hierarchical';
  verbose: boolean;
}

export type WorkflowStatus = 'idle' | 'running' | 'stopped' | 'error';

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

export interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'output';
  message: string;
}