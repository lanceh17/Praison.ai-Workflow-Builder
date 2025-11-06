import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'yaml';
import Sidebar from './components/Sidebar';
import WorkflowCanvas from './components/WorkflowCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import LogPanel from './components/LogPanel';
import ChatPanel from './components/ChatPanel';
import OutputPanel from './components/OutputPanel';
import Modal from './components/Modal';
import { 
    Node, Edge, Point, Workflow, NodeType, BaseNodeData, WorkflowStatus, 
    LogEntry, WorkflowTemplate, AgentNodeData, TaskNodeData, ToolNodeData, TriggerNodeData, OutputNodeData, WaitNodeData, AgentNode, WorkflowConfig
} from './types';
import { initialTemplates } from './templates';
import { WorkflowRunner } from './services/workflowRunner';
import * as geminiService from './services/geminiService';

const getDefaultNodeData = (type: NodeType): AgentNodeData | TaskNodeData | ToolNodeData | TriggerNodeData | OutputNodeData | WaitNodeData => {
    switch (type) {
        case 'agent':
            return { role: 'New Agent', goal: 'Define a clear goal.', backstory: 'Provide some context.', memory: true, agentId: `agent_${uuidv4().substring(0, 8)}` };
        case 'task':
            return { description: 'Describe the task.', expected_output: 'Describe the expected outcome.' };
        case 'tool':
            return { name: 'duckduckgo_search' };
        case 'trigger':
            return { type: 'Manual' };
        case 'output':
            return { type: 'Display', filename: 'output.txt', url: 'https://example.com/webhook' };
        case 'wait':
            return { duration: 5 };
        default:
            const exhaustiveCheck: never = type;
            throw new Error(`Unhandled node type: ${exhaustiveCheck}`);
    }
};


const App: React.FC = () => {
    const [nodes, setNodes] = useState<Node[]>(initialTemplates[0].workflow.nodes);
    const [edges, setEdges] = useState<Edge[]>(initialTemplates[0].workflow.edges);
    const [config, setConfig] = useState(initialTemplates[0].workflow.config);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [status, setStatus] = useState<WorkflowStatus>('idle');
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [templates, setTemplates] = useState<WorkflowTemplate[]>(initialTemplates);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [newTemplateInfo, setNewTemplateInfo] = useState({ name: '', description: '' });
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [elementToDelete, setElementToDelete] = useState<{ type: 'node' | 'edge', id: string } | null>(null);
    const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
    const [workflowOutput, setWorkflowOutput] = useState<string | null>(null);
    
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const workflowRunnerRef = useRef<WorkflowRunner | null>(null);
    
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || undefined;
    const selectedEdge = edges.find(e => e.id === selectedEdgeId) || undefined;
    const isChatActive = nodes.some(n => n.type === 'trigger' && n.data.type === 'Chat');

    const addLog = (log: Omit<LogEntry, 'timestamp'>) => {
        const timestamp = new Date().toLocaleTimeString('en-US', {
            hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
        setLogs(prev => [...prev, { ...log, timestamp }]);
    };
    
    const handleRun = () => {
        setWorkflowOutput(null);
        setStatus('running');
        workflowRunnerRef.current = new WorkflowRunner(nodes, edges, config, (log) => addLog(log), setExecutingNodeId, setWorkflowOutput);
        workflowRunnerRef.current.run().finally(() => setStatus('idle'));
    };
    
    const handleSendMessage = (message: string) => {
        setWorkflowOutput(null);
        addLog({ type: 'info', message: `Chat input received: "${message}"` });
        setStatus('running');
        workflowRunnerRef.current = new WorkflowRunner(nodes, edges, config, (log) => addLog(log), setExecutingNodeId, setWorkflowOutput);
        workflowRunnerRef.current.setInitialInput(message);
        workflowRunnerRef.current.run().finally(() => setStatus('idle'));
    };

    const handleStop = () => {
        if (workflowRunnerRef.current) {
            workflowRunnerRef.current.stop();
        }
        setStatus('stopped');
    };

    const handleAddNode = (type: NodeType) => {
        const newNode = {
            id: `${type}-${uuidv4()}`,
            type,
            position: { x: 100 - view.x / view.zoom, y: 100 - view.y / view.zoom },
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            data: getDefaultNodeData(type),
        } as Node;
        setNodes(prev => [...prev, newNode]);
        setSelectedNodeId(newNode.id);
        setSelectedEdgeId(null);
    };

    const handleUpdateNode = (nodeId: string, data: Partial<BaseNodeData>, label?: string) => {
        setNodes(prev =>
            prev.map(n => {
                if (n.id === nodeId) {
                    const updatedNode = { ...n, data: { ...n.data, ...data } };
                    if (label !== undefined) {
                        updatedNode.label = label;
                    }
                    return updatedNode as Node;
                }
                return n;
            })
        );
    };

    const handleConfigChange = (newConfig: Partial<WorkflowConfig>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
    };

    const handleNodePositionChange = useCallback((nodeId: string, position: Point) => {
        setNodes(prev => prev.map(n => (n.id === nodeId ? { ...n, position } : n)));
    }, []);
    
    const handleConnect = (source: string, target: string) => {
        const newEdge = { id: `e-${source}-${target}-${uuidv4()}`, source, target };
        setEdges(prev => [...prev, newEdge]);
    };

    const handleConfirmDelete = (type: 'node' | 'edge', id: string) => {
        setElementToDelete({ type, id });
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (!elementToDelete) return;

        const { type, id } = elementToDelete;

        if (type === 'node') {
            setNodes(prev => prev.filter(n => n.id !== id));
            setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
            if (selectedNodeId === id) {
                setSelectedNodeId(null);
            }
        } else {
            setEdges(prev => prev.filter(e => e.id !== id));
            if (selectedEdgeId === id) {
                setSelectedEdgeId(null);
            }
        }
        setIsDeleteModalOpen(false);
        setElementToDelete(null);
    };

    const handleClearCanvas = () => {
        setNodes([]);
        setEdges([]);
        setLogs([]);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setWorkflowOutput(null);
        setIsClearModalOpen(false);
    };

    const handleSaveAsTemplate = () => {
        if (!newTemplateInfo.name.trim()) return;

        const newTemplate: WorkflowTemplate = {
            ...newTemplateInfo,
            workflow: { nodes, edges, config }
        };
        setTemplates(prev => [...prev, newTemplate]);
        setIsSaveModalOpen(false);
        setNewTemplateInfo({ name: '', description: '' });
    };

    const handleLoadTemplate = (template: WorkflowTemplate) => {
        setNodes(template.workflow.nodes);
        setEdges(template.workflow.edges);
        setConfig(template.workflow.config);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setWorkflowOutput(null);
    };

    const handleGenerateFromPrompt = async (prompt: string) => {
        addLog({type: 'info', message: `Generating workflow for prompt: "${prompt}"`});
        try {
            const result = await geminiService.generateWorkflowFromPrompt(prompt, {nodes, edges, config});
            setNodes(result.nodes);
            setEdges(result.edges);
            addLog({type: 'success', message: 'Workflow generated successfully.'});
        } catch (error) {
            console.error(error);
            addLog({type: 'error', message: 'Failed to generate workflow. Check console for details.'});
        }
    };
    
    const handleGetSuggestions = async () => {
        return await geminiService.getPromptSuggestions();
    };

    const handleExpandPrompt = async (prompt: string) => {
        return await geminiService.expandPrompt(prompt);
    };
    
    const handleExportYaml = async () => {
        addLog({ type: 'info', message: 'Generating praison.yaml...' });
        try {
            const yamlString = await geminiService.generatePraisonYaml({ nodes, edges, config });
            addLog({ type: 'output', message: `\n---\n# praison.yaml\n---\n${yamlString}` });
            addLog({ type: 'success', message: 'YAML configuration generated.' });
        } catch (error) {
            console.error(error);
            addLog({ type: 'error', message: 'Failed to generate YAML.' });
        }
    };

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Delete' || event.key === 'Backspace') {
            const activeElement = document.activeElement;
            if (activeElement && ['INPUT', 'TEXTAREA'].includes(activeElement.tagName)) {
                return; 
            }

            if (selectedNodeId) {
                handleConfirmDelete('node', selectedNodeId);
            } else if (selectedEdgeId) {
                handleConfirmDelete('edge', selectedEdgeId);
            }
        }
    }, [selectedNodeId, selectedEdgeId]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
    

    return (
        <div className="flex h-screen w-screen text-slate-200 overflow-hidden">
            <Sidebar 
                onAddNode={handleAddNode}
                onLoadTemplate={handleLoadTemplate}
                onGenerateFromPrompt={handleGenerateFromPrompt}
                onGetSuggestions={handleGetSuggestions}
                onExpandPrompt={handleExpandPrompt}
                onRun={handleRun}
                onStop={handleStop}
                onSaveAsTemplate={() => setIsSaveModalOpen(true)}
                onClearCanvas={() => setIsClearModalOpen(true)}
                status={status}
                templates={templates}
                config={config}
                onConfigChange={handleConfigChange}
            />
            <main className="flex-1 flex flex-col relative">
                <WorkflowCanvas
                    nodes={nodes}
                    edges={edges}
                    selectedNodeId={selectedNodeId}
                    selectedEdgeId={selectedEdgeId}
                    executingNodeId={executingNodeId}
                    onNodeClick={setSelectedNodeId}
                    onEdgeClick={setSelectedEdgeId}
                    onCanvasClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
                    onNodePositionChange={handleNodePositionChange}
                    onConnect={handleConnect}
                    view={view}
                    setView={setView}
                />
                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <button onClick={handleExportYaml} className="px-4 py-2 bg-teal-800 hover:bg-teal-700 rounded-md text-sm font-semibold transition-colors shadow-lg">
                        Export praison.yaml
                    </button>
                </div>
                <LogPanel logs={logs} />
            </main>
            
            {/* Right Panel */}
            <div className="flex flex-col">
                {(selectedNode || selectedEdge) ? (
                    <PropertiesPanel
                        node={selectedNode}
                        edge={selectedEdge}
                        onUpdateNode={handleUpdateNode}
                        onDeleteNode={(id) => handleConfirmDelete('node', id)}
                        onDeleteEdge={(id) => handleConfirmDelete('edge', id)}
                        onClose={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
                    />
                ) : workflowOutput ? (
                    <OutputPanel output={workflowOutput} onClose={() => setWorkflowOutput(null)} />
                ) : isChatActive ? (
                    <ChatPanel onSendMessage={handleSendMessage} />
                ) : null}
            </div>
            
            {/* Modals */}
            <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)}>
                 <h2 className="text-xl font-bold text-white mb-4">Clear Canvas</h2>
                 <p className="text-slate-400 mb-6">Are you sure you want to delete all nodes and edges? This action cannot be undone.</p>
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsClearModalOpen(false)} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-md font-semibold">Cancel</button>
                    <button onClick={handleClearCanvas} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold">Clear Canvas</button>
                 </div>
            </Modal>
            <Modal isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)}>
                 <h2 className="text-xl font-bold text-white mb-4">Save as Template</h2>
                 <div className="space-y-4">
                     <input type="text" placeholder="Template Name" value={newTemplateInfo.name} onChange={e => setNewTemplateInfo(p => ({...p, name: e.target.value}))} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                     <textarea placeholder="Template Description" value={newTemplateInfo.description} onChange={e => setNewTemplateInfo(p => ({...p, description: e.target.value}))} rows={3} className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none" />
                 </div>
                 <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setIsSaveModalOpen(false)} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-md font-semibold">Cancel</button>
                    <button onClick={handleSaveAsTemplate} disabled={!newTemplateInfo.name.trim()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold disabled:bg-teal-900 disabled:text-slate-400">Save Template</button>
                 </div>
            </Modal>
             <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
                 <h2 className="text-xl font-bold text-white mb-4">Confirm Deletion</h2>
                 <p className="text-slate-400 mb-6">Are you sure you want to delete this {elementToDelete?.type}? This action cannot be undone.</p>
                 <div className="flex justify-end gap-2">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-teal-700 hover:bg-teal-600 rounded-md font-semibold">Cancel</button>
                    <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold">Delete</button>
                 </div>
            </Modal>
        </div>
    );
};

export default App;