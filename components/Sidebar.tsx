import React, { useState } from 'react';
import { WorkflowTemplate, WorkflowStatus, WorkflowConfig } from '../types';
import { AgentIcon } from './icons/AgentIcon';
import { TaskIcon } from './icons/TaskIcon';
import { ToolIcon } from './icons/ToolIcon';
import { TriggerIcon } from './icons/TriggerIcon';
import Modal from './Modal';

interface SidebarProps {
  onAddNode: (type: 'agent' | 'task' | 'tool' | 'trigger') => void;
  onLoadTemplate: (template: WorkflowTemplate) => void;
  onGenerateFromPrompt: (prompt: string) => Promise<void>;
  onRun: () => void;
  onStop: () => void;
  onSaveAsTemplate: () => void;
  onConfigChange: (newConfig: Partial<WorkflowConfig>) => void;
  status: WorkflowStatus;
  templates: WorkflowTemplate[];
  config: WorkflowConfig;
}

const Sidebar: React.FC<SidebarProps> = ({
  onAddNode,
  onLoadTemplate,
  onGenerateFromPrompt,
  onRun,
  onStop,
  onSaveAsTemplate,
  onConfigChange,
  status,
  templates,
  config,
}) => {
  const [isTemplatesModalOpen, setTemplatesModalOpen] = useState(false);
  const [isPromptModalOpen, setPromptModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    await onGenerateFromPrompt(prompt);
    setIsGenerating(false);
    setPromptModalOpen(false);
    setPrompt('');
  };

  return (
    <aside className="w-72 bg-slate-800 p-4 border-r border-slate-700 flex flex-col space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">Controls</h2>
        <div className="flex gap-2">
          <button
            onClick={onRun}
            disabled={status === 'running'}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Run
          </button>
          <button
            onClick={onStop}
            disabled={status !== 'running'}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Stop
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">Nodes</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <NodeButton onClick={() => onAddNode('trigger')} icon={<TriggerIcon className="w-5 h-5" />} label="Trigger" />
          <NodeButton onClick={() => onAddNode('agent')} icon={<AgentIcon className="w-5 h-5" />} label="Agent" />
          <NodeButton onClick={() => onAddNode('task')} icon={<TaskIcon className="w-5 h-5" />} label="Task" />
          <NodeButton onClick={() => onAddNode('tool')} icon={<ToolIcon className="w-5 h-5" />} label="Tool" />
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">Generation</h2>
        <button
            onClick={() => setPromptModalOpen(true)}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
            Generate from Prompt
        </button>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-100 mb-4">Templates</h2>
        <div className="space-y-2">
            <button
              onClick={() => setTemplatesModalOpen(true)}
              className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
              Load a Template
            </button>
            <button
              onClick={onSaveAsTemplate}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                Save as Template
            </button>
        </div>
      </div>

      <div className="flex-grow">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Workflow Settings</h2>
        <div className="space-y-3">
            <div>
                <label htmlFor="process-select" className="block text-sm font-medium text-slate-400 mb-1">Process</label>
                <select 
                    id="process-select"
                    value={config.process}
                    onChange={(e) => onConfigChange({ process: e.target.value as 'sequential' | 'hierarchical' })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                    <option value="sequential">Sequential</option>
                    <option value="hierarchical">Hierarchical</option>
                </select>
            </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 mt-auto">
        <p>PraisonAI Workflow Builder</p>
      </div>
      
      {/* Modals */}
      <Modal isOpen={isTemplatesModalOpen} onClose={() => setTemplatesModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4 text-slate-100">Load a Workflow Template</h3>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {templates.map(template => (
            <div
              key={template.name}
              className="p-3 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600 transition-colors"
              onClick={() => {
                onLoadTemplate(template);
                setTemplatesModalOpen(false);
              }}
            >
              <p className="font-semibold text-slate-200">{template.name}</p>
              <p className="text-sm text-slate-400">{template.description}</p>
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isPromptModalOpen} onClose={() => setPromptModalOpen(false)}>
        <h3 className="text-xl font-bold mb-4 text-slate-100">Generate Workflow from Prompt</h3>
        <p className="text-sm text-slate-400 mb-4">Describe the workflow you want to create. For example: "Create a workflow to research a topic, write a blog post, and then have an editor review it."</p>
        <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            placeholder="Enter your prompt here..."
        />
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
            >
                {isGenerating ? 'Generating...' : 'Generate'}
            </button>
        </div>
      </Modal>
    </aside>
  );
};

const NodeButton: React.FC<{onClick: () => void; icon: React.ReactNode; label: string}> = ({ onClick, icon, label}) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors space-y-2">
        {icon}
        <span className="font-semibold">{label}</span>
    </button>
)

export default Sidebar;