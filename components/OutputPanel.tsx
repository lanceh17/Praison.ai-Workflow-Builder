import React from 'react';

interface OutputPanelProps {
  output: string;
  onClose: () => void;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ output, onClose }) => {
  return (
    <aside className="w-80 bg-slate-800 p-4 border-l border-slate-700 flex flex-col space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100">Workflow Output</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          &times;
        </button>
      </div>
      
      <div className="flex-1 bg-slate-900/50 rounded-md p-3">
        <pre className="text-sm text-slate-200 whitespace-pre-wrap break-words font-sans">
          {output}
        </pre>
      </div>
    </aside>
  );
};

export default OutputPanel;
