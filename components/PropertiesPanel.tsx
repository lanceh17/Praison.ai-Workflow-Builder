// Fix: Implement the PropertiesPanel component to view and edit node/edge details.
import React from 'react';
import { Node, Edge, AgentNodeData, TaskNodeData, ToolNodeData, TriggerNodeData } from '../types';

interface PropertiesPanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onNodeChange: (nodeId: string, data: any) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNode, 
  selectedEdge,
  onNodeChange,
  onDeleteNode,
  onDeleteEdge,
}) => {

  const handleDataChange = (field: string, value: any) => {
    if (!selectedNode) return;
    const newData = { ...selectedNode.data, [field]: value };
    onNodeChange(selectedNode.id, { ...selectedNode, data: newData });
  };
  
  const handleLabelChange = (value: string) => {
      if (!selectedNode) return;
      onNodeChange(selectedNode.id, { ...selectedNode, label: value });
  }

  const renderNodeProperties = () => {
    if (!selectedNode) return null;

    const data = (selectedNode as any).data;

    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-400 mb-1">Label</label>
          <input
            type="text"
            value={selectedNode.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          />
        </div>
        
        {selectedNode.type === 'agent' && (
          <AgentProperties data={data as AgentNodeData} onChange={handleDataChange} />
        )}
        {selectedNode.type === 'task' && (
          <TaskProperties data={data as TaskNodeData} onChange={handleDataChange} />
        )}
        {selectedNode.type === 'tool' && (
          <ToolProperties data={data as ToolNodeData} onChange={handleDataChange} />
        )}
        {selectedNode.type === 'trigger' && (
          <TriggerProperties data={data as TriggerNodeData} onChange={handleDataChange} />
        )}
        
        <button
            onClick={() => onDeleteNode(selectedNode.id)}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
            Delete Node
        </button>
      </>
    );
  };
  
  const renderEdgeProperties = () => {
      if (!selectedEdge) return null;
      
      return (
          <>
            <div className="mb-4">
                <p><span className="font-semibold text-slate-400">Source:</span> {selectedEdge.source}</p>
                <p><span className="font-semibold text-slate-400">Target:</span> {selectedEdge.target}</p>
            </div>
             <button
                onClick={() => onDeleteEdge(selectedEdge.id)}
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Delete Edge
            </button>
          </>
      )
  }

  return (
    <aside className="w-80 bg-slate-800 p-4 border-l border-slate-700 overflow-y-auto">
      <h2 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2">Properties</h2>
      {selectedNode && renderNodeProperties()}
      {selectedEdge && renderEdgeProperties()}
      {!selectedNode && !selectedEdge && (
        <p className="text-sm text-slate-400 text-center mt-8">Select a node or an edge to view its properties.</p>
      )}
    </aside>
  );
};

const AgentProperties: React.FC<{ data: AgentNodeData; onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
  <div className="space-y-4">
    <Input id="role" label="Role" value={data.role} onChange={onChange} />
    <Textarea id="goal" label="Goal" value={data.goal} onChange={onChange} />
    <Textarea id="backstory" label="Backstory" value={data.backstory} onChange={onChange} rows={4} />
    <Checkbox id="memory" label="Enable Memory" checked={data.memory} onChange={onChange} />
  </div>
);

const TaskProperties: React.FC<{ data: TaskNodeData; onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
  <div className="space-y-4">
    <Textarea id="description" label="Description" value={data.description} onChange={onChange} rows={4} />
    <Textarea id="expected_output" label="Expected Output" value={data.expected_output} onChange={onChange} rows={3} />
  </div>
);

const ToolProperties: React.FC<{ data: ToolNodeData; onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
    <div className="space-y-4">
        <Select id="name" label="Tool Name" value={data.name} onChange={onChange}>
            <option value="duckduckgo_search">DuckDuckGo Search</option>
            <option value="google_search">Google Search</option>
            <option value="file_reader">File Reader</option>
            <option value="calculator">Calculator</option>
        </Select>
    </div>
);


const TriggerProperties: React.FC<{ data: TriggerNodeData; onChange: (f: string, v: any) => void }> = ({ data, onChange }) => (
    <div className="space-y-4">
        <Select id="type" label="Trigger Type" value={data.type} onChange={onChange}>
            <option value="Manual">Manual</option>
            <option value="Schedule">Schedule</option>
            <option value="Webhook">Webhook</option>
            {/* FIX: Add 'Chat' as a selectable trigger type. */}
            <option value="Chat">Chat</option>
        </Select>
    </div>
);

// Form component helpers
const Input: React.FC<{id: string, label: string, value: string, onChange: (f: string, v: any) => void }> = ({ id, label, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input id={id} type="text" value={value || ''} onChange={(e) => onChange(id, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
    </div>
);

const Textarea: React.FC<{id: string, label: string, value: string, onChange: (f: string, v: any) => void, rows?: number }> = ({ id, label, value, onChange, rows=3 }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <textarea id={id} value={value || ''} onChange={(e) => onChange(id, e.target.value)} rows={rows} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
    </div>
);

const Checkbox: React.FC<{id: string, label: string, checked: boolean, onChange: (f: string, v: any) => void }> = ({ id, label, checked, onChange }) => (
    <div className="flex items-center">
        <input id={id} type="checkbox" checked={checked || false} onChange={(e) => onChange(id, e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"/>
        <label htmlFor={id} className="ml-2 block text-sm text-slate-300">{label}</label>
    </div>
);

const Select: React.FC<{id: string, label: string, value: string, onChange: (f: string, v: any) => void, children: React.ReactNode }> = ({ id, label, value, onChange, children }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <select id={id} value={value || ''} onChange={(e) => onChange(id, e.target.value)} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none">
            {children}
        </select>
    </div>
);


export default PropertiesPanel;