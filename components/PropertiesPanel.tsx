
import React, { useState, useEffect } from 'react';
import { Node, Edge, BaseNodeData, AgentNode, TaskNode, ToolNode, TriggerNode, OutputNode, WaitNode, NodeType, TriggerType, OutputType } from '../types';
import { generateAgentDetails } from '../services/geminiService';

interface PropertiesPanelProps {
  node?: Node;
  edge?: Edge;
  onUpdateNode: (nodeId: string, data: Partial<BaseNodeData>, label?: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClose: () => void;
}

const commonTools = [
    'arxiv_search',
    'calculator',
    'directory_lister',
    'duckduckgo_search',
    'exa_search',
    'file_copier',
    'file_deleter',
    'file_reader',
    'file_writer',
    'github_search',
    'google_search',
    'hacker_news_search',
    'pubmed_search',
    'sec_search',
    'serper_dev_tool',
    'tavily_search',
    'web_browser',
    'website_scraper',
    'wikipedia_tool',
    'wolfram_alpha_search',
    'yahoo_finance_news',
    'youtube_search_tool',
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  node,
  edge,
  onUpdateNode,
  onDeleteNode,
  onDeleteEdge,
  onClose,
}) => {
  const [formData, setFormData] = useState<BaseNodeData>({});
  const [label, setLabel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData(node.data);
      setLabel(node.label);
    }
  }, [node]);

  const handleDataChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
  };
  
  const handleSave = () => {
    if (node) {
      onUpdateNode(node.id, formData, label);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
      (e.target as HTMLElement).blur(); // Remove focus
    }
  }

  const handleRoleBlur = async () => {
    handleSave(); // Save the role first

    if (node?.type === 'agent' && formData.role && formData.role !== 'New Agent') {
        const agentData = formData as AgentNode['data'];
        const isDefaultGoal = agentData.goal === 'Define a clear goal.' || !agentData.goal;
        const isDefaultBackstory = agentData.backstory === 'Provide some context.' || !agentData.backstory;

        if (isDefaultGoal && isDefaultBackstory) {
            setIsGenerating(true);
            try {
                const { goal, backstory } = await generateAgentDetails(agentData.role);
                const newData = { ...formData, goal, backstory };
                setFormData(newData);
                // Save the new data back to the app state
                onUpdateNode(node.id, newData, label); 
            } catch (error) {
                console.error("Failed to generate agent details:", error);
            } finally {
                setIsGenerating(false);
            }
        }
    }
  };

  const renderNodeForm = () => {
    if (!node) return null;

    const commonFields = (
        <div className="mb-4">
            <label className="block text-sm font-medium text-slate-400 mb-1">Label</label>
            <input
                type="text"
                value={label}
                onChange={handleLabelChange}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            />
        </div>
    );

    switch (node.type) {
      case 'agent':
        const agentData = formData as AgentNode['data'];
        return (
          <>
            {commonFields}
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                  <input 
                      type="text" 
                      value={agentData.role} 
                      onChange={e => handleDataChange('role', e.target.value)} 
                      onBlur={handleRoleBlur}
                      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" 
                  />
              </div>
              <InputField label="Agent ID" value={agentData.agentId} onChange={v => handleDataChange('agentId', v)} onSave={handleSave} />
              <TextAreaField label="Goal" value={agentData.goal} onChange={v => handleDataChange('goal', v)} onSave={handleSave} disabled={isGenerating} placeholder={isGenerating ? 'Generating...' : ''} />
              <TextAreaField label="Backstory" value={agentData.backstory} onChange={v => handleDataChange('backstory', v)} onSave={handleSave} disabled={isGenerating} placeholder={isGenerating ? 'Generating...' : ''}/>
              <CheckboxField label="Enable Memory" checked={agentData.memory} onChange={v => { handleDataChange('memory', v); handleSave(); }} />
            </div>
          </>
        );
      case 'task':
        const taskData = formData as TaskNode['data'];
        return (
          <>
            {commonFields}
            <div className="space-y-4">
                <TextAreaField label="Description" value={taskData.description} onChange={v => handleDataChange('description', v)} onSave={handleSave} rows={4} />
                <TextAreaField label="Expected Output" value={taskData.expected_output} onChange={v => handleDataChange('expected_output', v)} onSave={handleSave} rows={4} />
            </div>
          </>
        );
      case 'tool':
        const toolData = formData as ToolNode['data'];
        
        const handleToolChange = (newValue: string) => {
            const newToolData: ToolNode['data'] = { name: newValue };
            if (newValue === 'file_writer') {
                newToolData.filename = 'output.txt';
                newToolData.content = 'Hello, Praison!';
            } else if (newValue === 'file_reader') {
                newToolData.filename = 'input.txt';
            }
            // Immediately update the app state
            onUpdateNode(node.id, newToolData, label);
        };

        return (
          <>
            {commonFields}
            <div className="space-y-4">
              <SelectField label="Tool Name" value={toolData.name} onChange={handleToolChange} options={commonTools} allowCustom />
              
              {toolData.name === 'file_writer' && (
                <>
                  <InputField label="Filename" value={toolData.filename || ''} onChange={v => handleDataChange('filename', v)} onSave={handleSave} />
                  <TextAreaField label="Content" value={toolData.content || ''} onChange={v => handleDataChange('content', v)} onSave={handleSave} rows={5} />
                </>
              )}

              {toolData.name === 'file_reader' && (
                <InputField label="Filename" value={toolData.filename || ''} onChange={v => handleDataChange('filename', v)} onSave={handleSave} />
              )}
            </div>
          </>
        );
       case 'trigger':
        const triggerData = formData as TriggerNode['data'];
        const triggerTypes: TriggerType[] = ['Manual', 'Schedule', 'Webhook', 'Chat'];
        return (
          <>
            {commonFields}
            <SelectField 
              label="Trigger Type" 
              value={triggerData.type} 
              onChange={v => { handleDataChange('type', v); handleSave(); }} 
              options={triggerTypes} 
            />
          </>
        );
      case 'output':
        const outputData = formData as OutputNode['data'];
        const outputTypes: OutputType[] = ['Display', 'SaveToFile', 'Webhook'];
        return (
          <>
            {commonFields}
            <SelectField 
                label="Output Type" 
                value={outputData.type} 
                onChange={v => { handleDataChange('type', v); handleSave(); }} 
                options={outputTypes} 
            />
            {outputData.type === 'SaveToFile' && (
              <InputField label="Filename" value={outputData.filename || ''} onChange={v => handleDataChange('filename', v)} onSave={handleSave} />
            )}
            {outputData.type === 'Webhook' && (
              <InputField label="Webhook URL" value={outputData.url || ''} onChange={v => handleDataChange('url', v)} onSave={handleSave} />
            )}
          </>
        );
      case 'wait':
        const waitData = formData as WaitNode['data'];
        return (
            <>
                {commonFields}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Duration: {waitData.duration}s</label>
                    <input
                        type="range"
                        min="1"
                        max="120"
                        step="1"
                        value={waitData.duration}
                        onChange={e => handleDataChange('duration', Number(e.target.value))}
                        onMouseUp={handleSave}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
            </>
        );
      default:
        return <p>No properties available for this node type.</p>;
    }
  };

  const renderEdgeForm = () => {
    if (!edge) return null;
    return (
      <div>
        <p className="text-sm text-slate-400">Source: {edge.source}</p>
        <p className="text-sm text-slate-400">Target: {edge.target}</p>
      </div>
    );
  };

  if (!node && !edge) {
    return null;
  }

  const handleDelete = () => {
    if (node) {
        onDeleteNode(node.id);
    } else if (edge) {
        onDeleteEdge(edge.id);
    }
  }

  return (
    <aside className="w-80 bg-slate-800 p-4 border-l border-slate-700 flex flex-col space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100">{node ? 'Node Properties' : 'Edge Properties'}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          &times;
        </button>
      </div>
      
      <div className="flex-1">
        {node && renderNodeForm()}
        {edge && renderEdgeForm()}
      </div>

      <div className="pt-4 border-t border-slate-700">
        <button onClick={handleDelete} className="w-full px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-md transition-colors">
          Delete {node ? 'Node' : 'Edge'}
        </button>
      </div>
    </aside>
  );
};


// Form field components
const InputField: React.FC<{label: string, value: string, onChange: (v: string) => void, onSave: () => void, type?: string}> = ({label, value, onChange, onSave, type="text"}) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} onBlur={onSave} onKeyDown={e => e.key === 'Enter' && onSave()} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
    </div>
);

const TextAreaField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  rows?: number;
  disabled?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, onSave, rows = 3, disabled = false, placeholder = '' }) => (
    <div>
        <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
        <textarea 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            onBlur={onSave} 
            rows={rows} 
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed" 
        />
    </div>
);

const CheckboxField: React.FC<{label: string, checked: boolean, onChange: (v: boolean) => void}> = ({label, checked, onChange}) => (
    <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500" />
    </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  allowCustom?: boolean;
}> = ({ label, value, onChange, options, allowCustom = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
    >
      {options.map((opt, index) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={val + index} value={val}>
            {label}
          </option>
        );
      })}
      {allowCustom &&
        !options.some(
          (opt) => (typeof opt === 'string' ? opt : opt.value) === value
        ) && <option value={value}>{value}</option>}
    </select>
  </div>
);


export default PropertiesPanel;