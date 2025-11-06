import React, { useRef, useEffect, useState } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [height, setHeight] = useState(200); // Initial height
  const isResizing = useRef(false);

  useEffect(() => {
    if (logContainerRef.current && !isHovered) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isHovered]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 100 && newHeight <= window.innerHeight - 200) {
      setHeight(newHeight);
    }
  };
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-slate-400';
      case 'output': return 'text-cyan-300';
      default: return 'text-slate-300';
    }
  };

  return (
    <div 
      className="bg-slate-800 border-t-2 border-slate-700 flex flex-col flex-shrink-0"
      style={{ height: `${height}px` }}
    >
      <div 
        className="w-full h-2 bg-slate-700 cursor-row-resize hover:bg-cyan-500 transition-colors"
        onMouseDown={handleMouseDown}
      />
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        <h3 className="text-lg font-semibold text-slate-200">Logs & Output</h3>
      </div>
      <div
        ref={logContainerRef}
        className="flex-grow p-4 overflow-y-auto font-mono text-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {logs.map((log, index) => (
          <div key={index} className="flex gap-4 mb-1">
            <span className="text-slate-500">{log.timestamp}</span>
            <span className={`${getLogColor(log.type)} whitespace-pre-wrap break-words`}>
                {log.type === 'output' && <strong className="text-cyan-200 mr-2">OUTPUT:</strong>}
                {log.message}
            </span>
          </div>
        ))}
         {logs.length === 0 && (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">Run a workflow to see the logs here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel;