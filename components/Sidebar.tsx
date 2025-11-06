import React, { useState } from 'react';
import { WorkflowTemplate, WorkflowConfig, WorkflowStatus, NodeType } from '../types';
import { AgentIcon } from './icons/AgentIcon';
import { TaskIcon } from './icons/TaskIcon';
import { ToolIcon } from './icons/ToolIcon';
import { TriggerIcon } from './icons/TriggerIcon';
import { OutputIcon } from './icons/OutputIcon';

interface SidebarProps {
  onAddNode: (type: NodeType) => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  onGenerateFromPrompt: (prompt: string) => void;
  onGetSuggestions: () => Promise<string[]>;
  onExpandPrompt: (prompt: string) => Promise<string>;
  onRun: () => void;
  onStop: () => void;
  onSaveAsTemplate: () => void;
  onClearCanvas: () => void;
  onConfigChange: (newConfig: Partial<WorkflowConfig>) => void;
  status: WorkflowStatus;
  templates: WorkflowTemplate[];
  config: WorkflowConfig;
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddNode,
  onLoadTemplate,
  onGenerateFromPrompt,
  onGetSuggestions,
  onExpandPrompt,
  onRun,
  onStop,
  onSaveAsTemplate,
  onClearCanvas,
  onConfigChange,
  status,
  templates,
  config,
}) => {
  const [prompt, setPrompt] = useState('');
  const [activeAccordion, setActiveAccordion] = useState<string | null>('controls');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);

  const handleGenerateClick = () => {
    if (prompt.trim()) {
      onGenerateFromPrompt(prompt);
    }
  };
  
  const handleGetSuggestions = async () => {
    setIsSuggesting(true);
    try {
      const result = await onGetSuggestions();
      setSuggestions(result);
    } catch (error) {
      console.error("Failed to get suggestions:", error);
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const handleExpandPrompt = async () => {
      if (!prompt.trim()) return;
      setIsExpanding(true);
      try {
          const expandedPrompt = await onExpandPrompt(prompt);
          setPrompt(expandedPrompt);
      } catch (error) {
          console.error("Failed to expand prompt:", error);
      } finally {
          setIsExpanding(false);
      }
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };
  
  const AccordionItem: React.FC<{ id: string, title: string, children: React.ReactNode }> = ({ id, title, children }) => (
    <div className="border-b border-slate-700">
      <button
        className="w-full text-left p-4 font-semibold text-slate-200 hover:bg-slate-700/50 flex justify-between items-center focus:outline-none"
        onClick={() => toggleAccordion(id)}
      >
        <span>{title}</span>
        <svg className={`w-4 h-4 transform transition-transform duration-200 ${activeAccordion === id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {activeAccordion === id && <div className="p-4 bg-slate-900">{children}</div>}
    </div>
  );

  return (
    <aside className="w-80 bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Crew AI Builder</h1>
        <p className="text-sm text-slate-400">Visual Workflow Designer</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <AccordionItem id="controls" title="Workflow Controls">
            <div className="space-y-2">
                <button
                    onClick={onRun}
                    disabled={status === 'running'}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    {status === 'running' ? 'Running...' : 'Run Workflow'}
                </button>
                <button
                    onClick={onStop}
                    disabled={status !== 'running'}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Stop Workflow
                </button>
                 <button
                    onClick={onSaveAsTemplate}
                    disabled={status === 'running'}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Save as Template
                </button>
                <button
                    onClick={onClearCanvas}
                    disabled={status === 'running'}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                    Clear Canvas
                </button>
            </div>
        </AccordionItem>
        
        <AccordionItem id="add-nodes" title="Add Nodes">
          <div className="grid grid-cols-2 gap-2 text-center">
            <NodeButton label="Agent" icon={<AgentIcon className="w-6 h-6 mx-auto mb-1 text-amber-300"/>} onClick={() => onAddNode('agent')} />
            <NodeButton label="Task" icon={<TaskIcon className="w-6 h-6 mx-auto mb-1 text-cyan-300"/>} onClick={() => onAddNode('task')} />
            <NodeButton label="Tool" icon={<ToolIcon className="w-6 h-6 mx-auto mb-1 text-purple-300"/>} onClick={() => onAddNode('tool')} />
            <NodeButton label="Trigger" icon={<TriggerIcon className="w-6 h-6 mx-auto mb-1 text-green-300"/>} onClick={() => onAddNode('trigger')} />
            <NodeButton label="Output" icon={<OutputIcon className="w-6 h-6 mx-auto mb-1 text-rose-300"/>} onClick={() => onAddNode('output')} />
          </div>
        </AccordionItem>

        <AccordionItem id="generate" title="Generate from Prompt">
           <div className="space-y-3">
            <div className="flex gap-2">
                <button onClick={handleGetSuggestions} disabled={isSuggesting} className="flex-1 text-xs bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white font-bold py-2 px-2 rounded-md transition-colors">
                    {isSuggesting ? '...' : 'Suggestions'}
                </button>
                <button onClick={handleExpandPrompt} disabled={isExpanding || !prompt.trim()} className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-2 px-2 rounded-md transition-colors">
                    {isExpanding ? '...' : 'Expand Prompt'}
                </button>
            </div>
            {suggestions.length > 0 && (
                <div className="space-y-1 p-2 bg-slate-700/50 rounded-md">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Click a suggestion to use it:</p>
                    {suggestions.map((s, i) => (
                        <button key={i} onClick={() => { setPrompt(s); setSuggestions([]); }} className="block w-full text-left text-xs p-1.5 rounded hover:bg-slate-600 transition-colors">
                           - {s}
                        </button>
                    ))}
                </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A research agent looks up a topic and a writer agent summarizes it."
              className="w-full h-24 bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              rows={4}
            />
            <button
              onClick={handleGenerateClick}
              disabled={!prompt.trim() || status === 'running'}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Generate Workflow
            </button>
           </div>
        </AccordionItem>
        
        <AccordionItem id="templates" title="Load Template">
           <div className="space-y-2 max-h-60 overflow-y-auto">
            {templates.map((template) => (
              <button
                key={template.name}
                onClick={() => onLoadTemplate(template)}
                className="w-full text-left p-2 rounded-md hover:bg-slate-700 transition-colors"
              >
                <p className="font-semibold text-slate-200">{template.name}</p>
                <p className="text-xs text-slate-400">{template.description}</p>
              </button>
            ))}
           </div>
        </AccordionItem>

        <AccordionItem id="config" title="Configuration">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Process</label>
                    <select
                        value={config.process}
                        onChange={(e) => onConfigChange({ process: e.target.value as 'sequential' | 'hierarchical' })}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                        <option value="sequential">Sequential</option>
                        <option value="hierarchical">Hierarchical</option>
                    </select>
                </div>
                <div className="flex items-center">
                    <input
                        id="verbose-mode"
                        type="checkbox"
                        checked={config.verbose}
                        onChange={(e) => onConfigChange({ verbose: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="verbose-mode" className="ml-2 block text-sm text-slate-300">Verbose Mode</label>
                </div>
            </div>
        </AccordionItem>
      </div>
    </aside>
  );
};

const NodeButton: React.FC<{ label: string, icon: React.ReactNode, onClick: () => void }> = ({ label, icon, onClick }) => (
    <button onClick={onClick} className="p-2 bg-slate-700/50 rounded-md hover:bg-slate-700 border border-slate-600 transition-colors">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

export default Sidebar;