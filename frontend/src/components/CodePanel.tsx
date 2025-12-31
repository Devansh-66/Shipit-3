import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Loader2, FileCode } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface CodePanelProps {
    fileName: string;
    fileContent: string | null;
    loading: boolean;
    repoUrl?: string; // Optional now, kept for prop compatibility if needed
    initialExplanation?: string | null; // Deprecated, kept for prop compatibility
}

export const CodePanel: React.FC<CodePanelProps> = ({ fileName, fileContent, loading }) => {
    const language = fileName.split('.').pop() || 'javascript';

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3e3e42] shrink-0">
                <div className="flex items-center gap-2 text-sm text-[#cccccc]">
                    <FileCode size={14} className="text-blue-400" />
                    <span>{fileName}</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e] relative scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1e1e1e]/80 z-10">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : (
                    <>
                        {fileContent && fileContent.startsWith('data:image') ? (
                            <div className="flex items-center justify-center min-h-full p-8">
                                <img 
                                    src={fileContent}
                                    alt={fileName}
                                    className="max-w-full max-h-[500px] object-contain shadow-2xl rounded-lg border border-white/10 bg-[url('https://transparenttextures.com/patterns/dark-matter.png')]"
                                />
                            </div>
                        ) : fileContent ? (
                            ['md', 'markdown'].includes(language) ? (
                                <div className="p-8 max-w-4xl mx-auto">
                                    <MarkdownRenderer content={fileContent} />
                                </div>
                            ) : (
                                <SyntaxHighlighter
                                    language={language}
                                    style={vscDarkPlus}
                                    customStyle={{
                                        margin: 0,
                                        padding: '1.5rem',
                                        height: '100%',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        backgroundColor: '#1e1e1e' 
                                    }}
                                    showLineNumbers={true}
                                    wrapLines={true}
                                >
                                    {fileContent}
                                </SyntaxHighlighter>
                            )
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <p>Unable to load content</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
