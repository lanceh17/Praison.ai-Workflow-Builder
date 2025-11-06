import React, { useState } from 'react';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="w-80 bg-slate-800 p-4 border-l border-slate-700 flex flex-col">
      <h2 className="text-lg font-bold text-slate-100 mb-4 border-b border-slate-700 pb-2">Chat Input</h2>
      <div className="flex-1 flex flex-col justify-end">
        <div className="space-y-2">
           <p className="text-sm text-slate-400">
                A "Chat" trigger is active in your workflow. Use this panel to provide input when you run the workflow.
            </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="w-full h-24 bg-slate-700 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            rows={4}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-teal-900 disabled:text-slate-400 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatPanel;