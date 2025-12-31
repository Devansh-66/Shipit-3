import React, { useState } from 'react';
import { ArrowRight, Github, FolderUp, Code } from 'lucide-react';
import { motion } from 'framer-motion';

interface InputHubProps {
  onVisualize: (repoUrl: string) => void;
}

export const InputHub: React.FC<InputHubProps> = ({ onVisualize }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'github' | 'local' | 'snippet'>('github');

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Synapse
        </h1>
        <p className="text-gray-400 text-lg">
          The AI-Powered Codebase Navigator
        </p>
      </div>

      <div className="glass-panel p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 pb-2 px-4 transition-colors ${
              activeTab === 'github' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Github size={20} /> GitHub
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 pb-2 px-4 transition-colors ${
              activeTab === 'local' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderUp size={20} /> Local
          </button>
           <button
            onClick={() => setActiveTab('snippet')}
            className={`flex items-center gap-2 pb-2 px-4 transition-colors ${
              activeTab === 'snippet' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code size={20} /> Snippet
          </button>
        </div>

        {/* GitHub Input */}
        {activeTab === 'github' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
            />
            <button
              onClick={() => onVisualize(repoUrl)}
              disabled={!repoUrl}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Analyze <ArrowRight size={18} />
            </button>
          </motion.div>
        )}
        
        {/* Placeholders for Future Features */}
        {activeTab === 'local' && (
            <div className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center text-gray-400">
                <FolderUp className="mx-auto mb-2 opacity-50 transition-transform hover:scale-110" size={32} />
                Drag & Drop folder coming soon
            </div>
        )}
         {activeTab === 'snippet' && (
            <div className="p-8 border-2 border-dashed border-white/10 rounded-lg text-center text-gray-400">
                <Code className="mx-auto mb-2 opacity-50 transition-transform hover:scale-110" size={32} />
                Snippet analysis coming soon
            </div>
        )}

      </div>
      
       <div className="flex justify-center gap-6 text-sm text-gray-500">
          <span>• 1M Token Context</span>
          <span>• Interactive Maps</span>
          <span>• Instant Explanations</span>
       </div>
    </div>
  );
};
