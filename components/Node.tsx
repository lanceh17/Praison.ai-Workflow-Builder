import React from 'react';
import { Node, NodeType as NodeTypeString, AgentNode, TaskNode, ToolNode, TriggerNode, OutputNode } from '../types';
import { AgentIcon } from './icons/AgentIcon';
import { TaskIcon } from './icons/TaskIcon';
import { ToolIcon } from './icons/ToolIcon';
import { TriggerIcon } from './icons/TriggerIcon';
import { OutputIcon } from './icons/OutputIcon';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onHandleMouseDown: (e: React.MouseEvent) => void;
  sourceNodeForDrawing: Node | null;
}

const nodeConfig: { [key in NodeTypeString]: { icon: React.FC<any>; color: string; bgColor: string; borderColor: string; } } = {
  agent: { icon: AgentIcon, color: 'text-amber-300', bgColor: 'bg-amber-900/50', borderColor: 'border-amber-500' },
  task: { icon: TaskIcon, color: 'text-cyan-300', bgColor: 'bg-cyan-900/50', borderColor: 'border-cyan-500' },
  tool: { icon: ToolIcon, color: 'text-purple-300', bgColor: 'bg-purple-900/50', borderColor: 'border-purple-500' },
  trigger: { icon: TriggerIcon, color: 'text-green-300', bgColor: 'bg-green-900/50', borderColor: 'border-green-500' },
  output: { icon: OutputIcon, color: 'text-rose-300', bgColor: 'bg-rose-900/50', borderColor: 'border-rose-500' },
};

const NodeComponent: React.FC<NodeComponentProps> = ({ node, isSelected, onHandleMouseDown, sourceNodeForDrawing }) => {
  const { icon: Icon, color, bgColor, borderColor } = nodeConfig[node.type];
  
  const selectionClass = isSelected ? `ring-2 ring-offset-2 ring-offset-slate-900 ring-yellow-400` : 'border-slate-600';

  const getNodeDetails = () => {
    const data = (node as any).data;
    switch (node.type) {
      case 'agent':
        return data.role || 'No role defined';
      case 'task':
        return data.description ? data.description.substring(0, 40) + (data.description.length > 40 ? '...' : '') : 'No description';
      case 'tool':
        return data.name || 'No tool selected';
      case 'trigger':
        return data.type || 'No type selected';
      case 'output':
        return data.type === 'SaveToFile' ? `Save to ${data.filename || 'file'}` : 'Display in UI';
      default:
        return '';
    }
  };
  
  const isConnectableTarget = (targetNode: Node) => {
    if (!sourceNodeForDrawing) return false;
    const source = sourceNodeForDrawing;
    
    if (source.id === targetNode.id) return false;

    switch (source.type) {
        case 'trigger':
            return targetNode.type === 'task';
        case 'agent':
            return targetNode.type === 'task';
        case 'task':
            return targetNode.type === 'task' || targetNode.type === 'output';
        case 'tool':
            return targetNode.type === 'agent';
        default:
            return false;
    }
  };

  const isTargetHighlight = sourceNodeForDrawing && isConnectableTarget(node);
  const showInput = node.type === 'agent' || node.type === 'task' || node.type === 'output';
  const showOutput = node.type !== 'output';


  return (
    <div
      className={`w-48 rounded-lg shadow-md border ${bgColor} ${selectionClass} ${isTargetHighlight ? 'ring-2 ring-green-500' : ''} transition-all duration-150 ease-in-out`}
    >
      <div className={`flex items-center gap-3 p-3 rounded-t-lg border-b ${borderColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
        <div className="flex-1 overflow-hidden">
            <p className="font-bold text-slate-100 truncate">{node.label}</p>
        </div>
      </div>
      <div className="p-3 text-xs text-slate-300 h-10 flex items-center">
        <p className="truncate">{getNodeDetails()}</p>
      </div>
      
      {/* Left (target) */}
      {showInput && (
        <div 
          data-handle-pos="left"
          className="absolute top-1/2 -left-2 w-4 h-4 -translate-y-1/2 bg-slate-600 rounded-full border-2 border-slate-900 hover:bg-cyan-400"
          style={{ zIndex: 10 }}
        />
      )}
      {/* Right (source) */}
      {showOutput && (
        <div
          data-handle-pos="right"
          className="absolute top-1/2 -right-2 w-4 h-4 -translate-y-1/2 bg-slate-600 rounded-full border-2 border-slate-900 hover:bg-cyan-400"
          style={{ zIndex: 10, cursor: 'crosshair' }}
          onMouseDown={onHandleMouseDown}
        />
      )}
    </div>
  );
};

export default NodeComponent;