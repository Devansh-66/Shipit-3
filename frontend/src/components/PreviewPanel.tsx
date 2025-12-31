import React from 'react';
import { ExternalLink, X, Globe } from 'lucide-react';

interface PreviewPanelProps {
    url: string | null;
    onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ url, onClose }) => {
    if (!url) return null;

    return (
        <div className="flex-1 flex flex-col w-full h-full bg-black">
             {/* Header */}
             <div className="h-14 border-b border-white/10 flex items-center px-6 justify-between bg-black/20">
                <div className="flex items-center gap-2 text-white font-mono text-sm">
                    <Globe size={16} className="text-blue-400"/>
                    <span className="truncate max-w-[400px]">{url}</span>
                </div>
                <div className="flex items-center gap-2">
                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        title="Open in new tab"
                    >
                        <ExternalLink size={16} />
                    </a>
                    <button 
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Iframe */}
            <div className="flex-1 bg-white relative">
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-0">
                    Loading Preview...
                 </div>
                <iframe 
                    src={url} 
                    className="w-full h-full border-none relative z-10"
                    title="Live Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
            </div>
        </div>
    );
};
