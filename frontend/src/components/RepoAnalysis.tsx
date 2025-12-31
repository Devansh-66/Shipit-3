import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Send, Bot, User, Sparkles, Map } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { API_BASE_URL } from '../config';

interface RepoAnalysisProps {
    repoUrl: string;
    tree: any[];
}

export const RepoAnalysis: React.FC<RepoAnalysisProps> = ({ repoUrl, tree }) => {
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'model', text: string }>>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const suggestedTopics = [
        "Explain the Architecture",
        "Analyze Tech Stack",
        "Key Features & Patterns"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (text: string) => {
        if (!text.trim() || loading) return;

        const newMessages = [...messages, { role: 'user', text } as const];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    repoUrl, 
                    filePath: null, // Repo-level chat
                    tree,
                    history: messages, // Send previous context
                    message: text 
                })
            });
            const result = await response.json();
            setMessages([...newMessages, { role: 'model', text: result.response }]);
        } catch (e) {
            console.error(e);
            setMessages([...newMessages, { role: 'model', text: "Sorry, I encountered an error connecting to the server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0a0a]">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <Map size={20} />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white">Repository Chat</h2>
                    <p className="text-xs text-gray-400">Ask about architecture, stack, or features</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                            <Sparkles size={32} className="text-blue-400" />
                        </div>
                        <div className="max-w-sm space-y-2">
                            <h3 className="text-lg font-medium text-white">Start the Conversation</h3>
                            <p className="text-sm text-gray-400">Select a topic below to analyze this repository's structure and code.</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
                            {suggestedTopics.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => handleSend(topic)}
                                    className="px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-sm text-gray-300 transition-all text-left flex items-center justify-between group"
                                >
                                    {topic}
                                    <Send size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600 shadow-lg shadow-blue-900/20' : 'bg-purple-600 shadow-lg shadow-purple-900/20'}`}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600/10 border border-blue-500/20 text-gray-200 rounded-tr-sm' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'}`}>
                             <div className="prose prose-invert prose-sm max-w-none">
                                <ReactMarkdown 
                                    components={{
                                        code({ node, inline, className, children, ...props }: any) {
                                            const match = /language-(\w+)/.exec(className || '');
                                            // INLINE CODE HIGHLIGHTING
                                            if (inline && !match) {
                                                return (
                                                    <code {...props} className="bg-white/10 px-1.5 py-0.5 rounded text-pink-300 border border-white/5 font-mono text-[11px]">
                                                        {children}
                                                    </code>
                                                );
                                            }
                                            // CODE BLOCK HIGHLIGHTING
                                            return !inline && match ? (
                                                <SyntaxHighlighter
                                                    {...props}
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    customStyle={{ margin: '0.8em 0', borderRadius: '0.75rem', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
                                                >
                                                    {String(children).replace(/\n$/, '')}
                                                </SyntaxHighlighter>
                                            ) : (
                                                <code {...props} className={className}>
                                                    {children}
                                                </code>
                                            );
                                        },
                                        ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="pl-1">{children}</li>,
                                        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <strong className="font-semibold text-white/90">{children}</strong>
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                
                {loading && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 animate-pulse">
                            <Bot size={14} />
                        </div>
                        <div className="flex items-center gap-1 h-8">
                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                             <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                        placeholder="Ask about the architecture..."
                        disabled={loading}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                    />
                    <button
                        onClick={() => handleSend(input)}
                        disabled={loading || !input.trim()}
                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
