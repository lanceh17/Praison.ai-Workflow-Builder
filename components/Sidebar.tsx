import React, { useState } from 'react';
import { NodeType, WorkflowTemplate, WorkflowConfig, WorkflowStatus } from '../types';
import Modal from './Modal'; // Import Modal

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

const nodeButtonConfig: Record<NodeType, string> = {
    trigger: '⚡',
    agent: '🤖',
    task: '📋',
    tool: '🛠️',
    wait: '⏳',
    output: '📤',
};

const nodeButtonColors: Record<NodeType, string> = {
    trigger: 'bg-green-600 hover:bg-green-500',
    agent: 'bg-amber-600 hover:bg-amber-500',
    task: 'bg-cyan-600 hover:bg-cyan-500',
    tool: 'bg-purple-600 hover:bg-purple-500',
    wait: 'bg-indigo-600 hover:bg-indigo-500',
    output: 'bg-rose-600 hover:bg-rose-500',
};

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
    config
}) => {
    const [prompt, setPrompt] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
    const [isExpandLoading, setIsExpandLoading] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);


    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        await onGenerateFromPrompt(prompt);
        setIsGenerating(false);
        setIsGenerateModalOpen(false); // Close modal on success
    };

    const handleGetSuggestions = async () => {
        setIsSuggestionsLoading(true);
        setSuggestions([]); // Clear old ones
        const suggs = await onGetSuggestions();
        setSuggestions(suggs);
        setIsSuggestionsLoading(false);
    };

    const handleExpand = async () => {
        if (!prompt.trim()) return;
        setIsExpandLoading(true);
        const expanded = await onExpandPrompt(prompt);
        setPrompt(expanded);
        setIsExpandLoading(false);
    };
    
    const nodeTypes: NodeType[] = ['trigger', 'agent', 'task', 'tool', 'wait', 'output'];

    const handleTemplateSelect = (template: WorkflowTemplate) => {
        onLoadTemplate(template);
        setIsTemplateModalOpen(false);
    }

    return (
        <>
            <aside className="w-80 bg-slate-800 p-4 border-r border-slate-700 flex flex-col space-y-6 overflow-y-auto">
                {/* Controls */}
                <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Controls</h2>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={onRun} disabled={status === 'running'} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-teal-900 disabled:text-slate-400 rounded-md font-semibold transition-colors">
                            <span>▶️</span>
                            <span>Run</span>
                        </button>
                        <button onClick={onStop} disabled={status !== 'running'} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:text-slate-500 rounded-md font-semibold transition-colors">
                            <span>⏹️</span>
                            <span>Stop</span>
                        </button>
                        <button onClick={onSaveAsTemplate} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">
                            <span>💾</span>
                            <span>Save</span>
                        </button>
                        <button onClick={onClearCanvas} className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-md font-semibold transition-colors">
                            <span>🗑️</span>
                            <span>Clear</span>
                        </button>
                    </div>
                </div>

                {/* AI Assistant */}
                <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">AI Assistant</h2>
                    <button onClick={() => setIsGenerateModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors">
                        ✨ Auto-generate Workflow...
                    </button>
                </div>

                {/* Add Nodes */}
                <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Nodes</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {nodeTypes.map(type => (
                            <button 
                                key={type} 
                                onClick={() => onAddNode(type)} 
                                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold capitalize transition-colors text-white ${nodeButtonColors[type]}`}
                            >
                                <span className="text-lg">{nodeButtonConfig[type]}</span>
                                <span>{type}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Templates */}
                 <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Templates</h2>
                    <button onClick={() => setIsTemplateModalOpen(true)} className="w-full px-4 py-2 bg-teal-800 hover:bg-teal-700 rounded-md text-sm font-semibold transition-colors">
                        Load a Template...
                    </button>
                </div>


                {/* Config */}
                <div>
                    <h2 className="text-lg font-bold text-slate-100 mb-3 border-b border-slate-700 pb-2">Config</h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label htmlFor="process-mode" className="text-sm text-slate-300">Process Mode</label>
                            <select
                                id="process-mode"
                                value={config.process}
                                onChange={(e) => onConfigChange({ process: e.target.value as 'sequential' | 'hierarchical' })}
                                className="bg-slate-700 border border-slate-600 rounded-md p-1 text-sm focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                            >
                                <option value="sequential">Sequential</option>
                                <option value="hierarchical">Hierarchical</option>
                            </select>
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="verbose-mode" className="text-sm text-slate-300">Verbose Logs</label>
                            <input
                                id="verbose-mode"
                                type="checkbox"
                                checked={config.verbose}
                                onChange={(e) => onConfigChange({ verbose: e.target.checked })}
                                 className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                </div>
            </aside>
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)}>
                <h2 className="text-2xl font-bold text-white mb-6">Load a Workflow Template</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {templates.length > 0 ? templates.map(template => (
                         <div 
                            key={template.name} 
                            onClick={() => handleTemplateSelect(template)} 
                            className="bg-teal-900/80 p-4 rounded-lg cursor-pointer hover:bg-teal-800/80 ring-1 ring-teal-700 hover:ring-cyan-500 transition-all"
                        >
                            <p className="font-bold text-md text-slate-100">{template.name}</p>
                            <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                        </div>
                    )) : <p className="text-sm text-slate-500 col-span-2">No templates saved yet.</p>}
                </div>
            </Modal>

            <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)}>
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-white">Generate Workflow from Prompt</h2>
                    <div>
                        <label htmlFor="prompt-input" className="block text-sm font-medium text-slate-400 mb-1">Your Prompt</label>
                        <textarea
                            id="prompt-input"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., Create a research team to write a report on the impact of AI on climate change."
                            rows={5}
                            className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button onClick={handleGetSuggestions} disabled={isSuggestionsLoading} className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 rounded-md font-semibold transition-colors disabled:bg-teal-900 disabled:text-slate-400">
                           {isSuggestionsLoading ? 'Getting...' : 'Get Suggestions'}
                        </button>
                        <button onClick={handleExpand} disabled={isExpandLoading} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors disabled:bg-teal-900 disabled:text-slate-400">
                           {isExpandLoading ? 'Expanding...' : 'Expand Prompt'}
                        </button>
                    </div>
                     {suggestions.length > 0 && (
                        <div className="space-y-1 text-xs mt-2 border-t border-slate-700 pt-3">
                            <p className="font-semibold text-slate-400 mb-1">Suggestions:</p>
                            {suggestions.map((s, i) => (
                                <p key={i} className="p-2 bg-slate-700/50 rounded cursor-pointer hover:bg-slate-700" onClick={() => setPrompt(s)}>{s}</p>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                        <button onClick={() => setIsGenerateModalOpen(false)} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-md font-semibold">Cancel</button>
                        <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold disabled:bg-teal-900 disabled:text-slate-400">
                           {isGenerating ? 'Generating...' : 'Generate Workflow'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Sidebar;