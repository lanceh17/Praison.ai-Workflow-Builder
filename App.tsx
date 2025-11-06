import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge, Workflow, WorkflowTemplate, Point, LogEntry, WorkflowStatus, WorkflowConfig, NodeType } from './types';
import Sidebar from './components/Sidebar';
import WorkflowCanvas from './components/WorkflowCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import LogPanel from './components/LogPanel';
import { templates as initialTemplates } from './templates';
import { generateWorkflowFromPrompt, generatePromptSuggestions, expandPrompt } from './services/geminiService';
import { WorkflowRunner } from './services/workflowRunner';
import Modal from './components/Modal';

const App: React.FC = () => {
    const [workflow, setWorkflow] = useState<Workflow>({ nodes: [], edges: [], config: { process: 'sequential', verbose: true } });
    const [allTemplates, setAllTemplates] = useState<WorkflowTemplate[]>(initialTemplates);
    // FIX: Added missing '=' to the useState declaration. This was causing numerous cascading parsing errors.
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
    const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [status, setStatus] = useState<WorkflowStatus>('idle');
    const [isSaveModalOpen, setSaveModalOpen] = useState(false);
    const [isClearModalOpen, setClearModalOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const runnerRef = useRef<WorkflowRunner | null>(null);

    const addLog = useCallback((log: LogEntry) => {
        setLogs(prev => [...prev, log]);
    }, []);

    const handleNodeClick = useCallback((nodeId: string) => {
        setSelectedNodeId(nodeId);
        setSelectedEdgeId(null);
    }, []);

    const handleEdgeClick = useCallback((edgeId: string) => {
        setSelectedEdgeId(edgeId);
        setSelectedNodeId(null);
    }, []);

    const handleCanvasClick = useCallback(() => {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
    }, []);

    const handleNodePositionChange = useCallback((nodeId: string, position: Point) => {
        setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, position: position } : n)
        }));
    }, []);
    
    const handleAddNode = (type: NodeType) => {
        const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type: type,
            position: { x: 200, y: 200 },
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            data: {} as any
        };
        
        switch(type) {
            case 'agent':
                newNode.data = { role: '', goal: '', backstory: '', memory: false };
                break;
            case 'task':
                newNode.data = { description: '', expected_output: '' };
                break;
            case 'tool':
                newNode.data = { name: 'duckduckgo_search' };
                break;
            case 'trigger':
                newNode.data = { type: 'Manual' };
                break;
            case 'output':
                newNode.data = { type: 'Display' };
                newNode.label = 'Final Output';
                break;
        }

        setWorkflow(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    };
    
    const handleConnect = useCallback((source: string, target: string) => {
        if (workflow.edges.some(e => e.source === source && e.target === target)) return;
        
        const newEdge: Edge = {
            id: `edge-${source}-${target}-${Date.now()}`,
            source,
            target
        };
        setWorkflow(prev => ({ ...prev, edges: [...prev.edges, newEdge] }));
    }, [workflow.edges]);

    const handleNodeChange = useCallback((nodeId: string, updatedNode: Node) => {
        setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => n.id === nodeId ? updatedNode : n)
        }));
    }, []);

    const handleDeleteNode = useCallback((nodeId: string) => {
        setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.filter(n => n.id !== nodeId),
            edges: prev.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
        }));
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
    }, [selectedNodeId]);

    const handleDeleteEdge = useCallback((edgeId: string) => {
        setWorkflow(prev => ({
            ...prev,
            edges: prev.edges.filter(e => e.id !== edgeId)
        }));
        if (selectedEdgeId === edgeId) {
            setSelectedEdgeId(null);
        }
    }, [selectedEdgeId]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedNodeId) {
                    handleDeleteNode(selectedNodeId);
                } else if (selectedEdgeId) {
                    handleDeleteEdge(selectedEdgeId);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeId, selectedEdgeId, handleDeleteNode, handleDeleteEdge]);

    const handleLoadTemplate = useCallback((template: WorkflowTemplate) => {
        setWorkflow(template.workflow);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setLogs([]);
        setStatus('idle');
    }, []);
    
    const handleGenerateFromPrompt = async (prompt: string) => {
        setStatus('running');
        addLog({ type: 'info', message: 'Generating workflow from prompt...', timestamp: new Date().toLocaleTimeString() });
        try {
            const newWorkflow = await generateWorkflowFromPrompt(prompt);
            setWorkflow(newWorkflow);
            addLog({ type: 'success', message: 'Workflow generated successfully!', timestamp: new Date().toLocaleTimeString() });
        } catch (error) {
            addLog({ type: 'error', message: `Failed to generate workflow: ${error instanceof Error ? error.message : String(error)}`, timestamp: new Date().toLocaleTimeString() });
        } finally {
            setStatus('idle');
        }
    };
    
    const handleRunWorkflow = useCallback(async () => {
        setLogs([]);
        setStatus('running');
        runnerRef.current = new WorkflowRunner(workflow.nodes, workflow.edges, workflow.config, addLog);
        await runnerRef.current.run();
        setStatus(prevStatus => (prevStatus === 'running' ? 'idle' : prevStatus));
    }, [addLog, workflow.nodes, workflow.edges, workflow.config]);

    const handleStopWorkflow = useCallback(() => {
        if (runnerRef.current) {
            runnerRef.current.stop();
            setStatus('stopped');
        }
    }, []);

    const handleConfigChange = (newConfig: Partial<WorkflowConfig>) => {
        setWorkflow(prev => ({ ...prev, config: { ...prev.config, ...newConfig }}));
    };

    const handleSaveAsTemplate = () => {
        if (!newTemplateName) return;
        const newTemplate: WorkflowTemplate = {
            name: newTemplateName,
            description: 'A user-saved custom workflow.',
            workflow: JSON.parse(JSON.stringify(workflow)) // Deep copy
        };
        setAllTemplates(prev => [...prev, newTemplate]);
        setNewTemplateName('');
        setSaveModalOpen(false);
    };
    
    const handleClearCanvas = () => {
        setWorkflow(prev => ({ ...prev, nodes: [], edges: [] }));
        setLogs([]);
        setStatus('idle');
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setClearModalOpen(false);
    };

    const selectedNode = workflow.nodes.find(n => n.id === selectedNodeId) || null;
    const selectedEdge = workflow.edges.find(e => e.id === selectedEdgeId) || null;

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-slate-100 font-sans">
            <Sidebar
                onAddNode={handleAddNode}
                onLoadTemplate={handleLoadTemplate}
                onGenerateFromPrompt={handleGenerateFromPrompt}
                onGetSuggestions={generatePromptSuggestions}
                onExpandPrompt={expandPrompt}
                onRun={handleRunWorkflow}
                onStop={handleStopWorkflow}
                onSaveAsTemplate={() => setSaveModalOpen(true)}
                onClearCanvas={() => setClearModalOpen(true)}
                onConfigChange={handleConfigChange}
                status={status}
                templates={allTemplates}
                config={workflow.config}
            />
            <div className="flex flex-col flex-1">
                <main className="flex-1 flex overflow-hidden">
                    <WorkflowCanvas
                        nodes={workflow.nodes}
                        edges={workflow.edges}
                        selectedNodeId={selectedNodeId}
                        selectedEdgeId={selectedEdgeId}
                        onNodeClick={handleNodeClick}
                        onEdgeClick={handleEdgeClick}
                        onCanvasClick={handleCanvasClick}
                        onNodePositionChange={handleNodePositionChange}
                        onConnect={handleConnect}
                        view={view}
                        setView={setView}
                    />
                    <PropertiesPanel
                        selectedNode={selectedNode}
                        selectedEdge={selectedEdge}
                        onNodeChange={handleNodeChange}
                        onDeleteNode={handleDeleteNode}
                        onDeleteEdge={handleDeleteEdge}
                    />
                </main>
                <LogPanel logs={logs} />
            </div>
            
            <Modal isOpen={isSaveModalOpen} onClose={() => setSaveModalOpen(false)}>
                <h3 className="text-xl font-bold mb-4 text-slate-100">Save as Template</h3>
                <p className="text-sm text-slate-400 mb-4">Save the current workflow as a new template in your library.</p>
                <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="Enter template name..."
                />
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={handleSaveAsTemplate}
                        disabled={!newTemplateName}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Save
                    </button>
                </div>
            </Modal>

            <Modal isOpen={isClearModalOpen} onClose={() => setClearModalOpen(false)}>
                <h3 className="text-xl font-bold mb-4 text-slate-100">Clear Canvas</h3>
                <p className="text-sm text-slate-400 mb-4">Are you sure you want to delete all nodes and edges? This action cannot be undone.</p>
                <div className="mt-6 flex justify-end space-x-2">
                    <button
                        onClick={() => setClearModalOpen(false)}
                        className="bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleClearCanvas}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                    >
                        Clear Canvas
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default App;