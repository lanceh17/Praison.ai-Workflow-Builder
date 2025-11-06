
import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import { Node, Edge, Point } from '../types';
import NodeComponent from './Node';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  onCanvasClick: () => void;
  onNodePositionChange: (nodeId: string, position: Point) => void;
  onConnect: (source: string, target: string) => void;
  view: { x: number; y: number; zoom: number };
  setView: React.Dispatch<React.SetStateAction<{ x: number; y: number; zoom: number }>>;
}

const getEdgePath = (sourceNode: Node, targetNode: Node): string => {
  const nodeWidth = 192; // w-48
  const nodeHeight = 80;
  
  const sourcePos = {
    x: sourceNode.position.x + nodeWidth,
    y: sourceNode.position.y + nodeHeight / 2
  };
  const targetPos = {
    x: targetNode.position.x,
    y: targetNode.position.y + nodeHeight / 2
  };

  const c1x = sourcePos.x + Math.abs(targetPos.x - sourcePos.x) * 0.5;
  const c1y = sourcePos.y;
  const c2x = targetPos.x - Math.abs(targetPos.x - sourcePos.x) * 0.5;
  const c2y = targetPos.y;

  return `M ${sourcePos.x} ${sourcePos.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${targetPos.x} ${targetPos.y}`;
};


const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onNodeClick,
  onEdgeClick,
  onCanvasClick,
  onNodePositionChange,
  onConnect,
  view,
  setView,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [dragState, setDragState] = useState<{
    type: 'pan' | 'drag_node' | 'draw_edge';
    id?: string;
    startPoint: Point;
    initialView?: Point;
    initialNodePos?: Point;
  } | null>(null);

  const [drawingEdgeEnd, setDrawingEdgeEnd] = useState<Point | null>(null);

  const clientToWorld = useCallback((p: Point): Point => {
    if (!canvasRef.current) return p;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (p.x - rect.left - view.x) / view.zoom,
      y: (p.y - rect.top - view.y) / view.zoom,
    };
  }, [view.x, view.y, view.zoom]);

  const handleMouseDown = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const handleEl = target.closest('[data-handle-pos="right"]');
    const nodeEl = target.closest('[data-node-id]');

    if (handleEl && nodeEl) { // Draw Edge
        e.stopPropagation();
        const nodeId = nodeEl.getAttribute('data-node-id');
        if (nodeId) {
            setDragState({ type: 'draw_edge', id: nodeId, startPoint: { x: e.clientX, y: e.clientY } });
        }
    } else if (nodeEl) { // Drag Node
        e.stopPropagation();
        const nodeId = nodeEl.getAttribute('data-node-id');
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            setDragState({ type: 'drag_node', id: nodeId, startPoint: { x: e.clientX, y: e.clientY }, initialNodePos: node.position });
        }
    } else { // Pan
        setDragState({ type: 'pan', startPoint: { x: e.clientX, y: e.clientY }, initialView: { x: view.x, y: view.y } });
        if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    }
  }, [nodes, view]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    const dx = e.clientX - dragState.startPoint.x;
    const dy = e.clientY - dragState.startPoint.y;

    if (dragState.type === 'pan' && dragState.initialView) {
      setView(v => ({ ...v, x: dragState.initialView!.x + dx, y: dragState.initialView!.y + dy }));
    } else if (dragState.type === 'drag_node' && dragState.id && dragState.initialNodePos) {
      const newPos = {
        x: dragState.initialNodePos.x + dx / view.zoom,
        y: dragState.initialNodePos.y + dy / view.zoom,
      };
      onNodePositionChange(dragState.id, newPos);
    } else if (dragState.type === 'draw_edge') {
      setDrawingEdgeEnd(clientToWorld({ x: e.clientX, y: e.clientY }));
    }
  }, [dragState, view.zoom, setView, onNodePositionChange, clientToWorld]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (dragState?.type === 'draw_edge') {
      const target = e.target as HTMLElement;
      const targetHandle = target.closest('[data-handle-pos="left"]');
      const targetNodeEl = target.closest('[data-node-id]');
      if (targetHandle && targetNodeEl) {
        const sourceId = dragState.id;
        const targetId = targetNodeEl.getAttribute('data-node-id');
        if (sourceId && targetId && sourceId !== targetId) {
          onConnect(sourceId, targetId);
        }
      }
    }
    
    if (dragState?.type === 'pan' && canvasRef.current) {
        canvasRef.current.style.cursor = 'grab';
    }

    setDragState(null);
    setDrawingEdgeEnd(null);
  }, [dragState, onConnect]);

  useEffect(() => {
    if (!dragState) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, handleMouseMove, handleMouseUp]);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scroll = e.deltaY * -0.001;
    const newZoom = Math.max(0.2, Math.min(2, view.zoom + scroll));

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const newX = mouseX - (mouseX - view.x) * (newZoom / view.zoom);
    const newY = mouseY - (mouseY - view.y) * (newZoom / view.zoom);

    setView({ x: newX, y: newY, zoom: newZoom });
  }, [view, setView]);
  
  const handleCanvasClick = (e: ReactMouseEvent) => {
    if (e.target === canvasRef.current) {
        onCanvasClick();
    }
  }

  const sourceNodeForDrawing = dragState?.type === 'draw_edge' ? nodes.find(n => n.id === dragState.id) : null;
  
  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-slate-900/95 relative overflow-hidden cursor-grab bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px]"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      <div
        className="absolute top-0 left-0"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`, transformOrigin: 'top left' }}
      >
        {/* Render nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            data-node-id={node.id}
            className="absolute"
            style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)`, cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); onNodeClick(node.id); }}
          >
            <NodeComponent
              node={node}
              isSelected={selectedNodeId === node.id}
              onHandleMouseDown={(e) => { /* handled by parent */ }}
              sourceNodeForDrawing={sourceNodeForDrawing}
            />
          </div>
        ))}
      </div>
      
      {/* SVG for edges */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,7 L10,3.5 z" fill="#475569" />
            </marker>
             <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,7 L10,3.5 z" fill="#facc15" />
            </marker>
        </defs>
        <g style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          {edges.map(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            
            const isSelected = selectedEdgeId === edge.id;
            const path = getEdgePath(sourceNode, targetNode);

            return (
              <g key={edge.id} className="pointer-events-auto cursor-pointer" onClick={(e) => { e.stopPropagation(); onEdgeClick(edge.id); }}>
                {/* A wider, transparent path for easier clicking */}
                <path d={path} stroke="transparent" strokeWidth="12" fill="none" />
                <path
                  d={path}
                  stroke={isSelected ? '#facc15' : '#475569'}
                  strokeWidth="2"
                  fill="none"
                  markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                />
              </g>
            );
          })}
          {sourceNodeForDrawing && drawingEdgeEnd && (
            <path
              d={getEdgePath(sourceNodeForDrawing, { id: 'temp', type: 'task', position: drawingEdgeEnd, label: 'temp', data: {description: '', expected_output: ''}})}
              stroke="#06b6d4"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
            />
          )}
        </g>
      </svg>
    </div>
  );
};

export default WorkflowCanvas;
