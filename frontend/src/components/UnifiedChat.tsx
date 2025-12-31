import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send, Bot, User, Sparkles, Paperclip, Terminal, Copy, RefreshCw, Edit, ArrowDownCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { API_BASE_URL } from '../config';

interface UnifiedChatProps {
    repoUrl: string;
    tree: any[];
    attachedFile: string | null;
    repoAnalysis: string | null;
}

interface Source {
    url: string;
    icon?: string;
}

interface MessageVersion {
    content: string;
    sources: Source[];
}

interface Message {
    id: number;
    role: 'user' | 'model' | 'assistant'; // 'model' mapped to 'assistant'
    // For assistant:
    versions?: MessageVersion[];
    currentVersion?: number;
    // For user (or simple mode):
    text?: string;
    
    // Status
    isStreaming?: boolean;
    toolStatus?: string;
}

export const UnifiedChat: React.FC<UnifiedChatProps> = ({ repoUrl, tree, attachedFile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    // Editing / Regenerating State
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editingInput, setEditingInput] = useState("");
    const [regeneratingId, setRegeneratingId] = useState<number | null>(null);

    // Scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const isAtBottomRef = useRef(true);

    const suggestTopics = !messages.length ? [
        "Explain the Architecture",
        "Analyze Tech Stack", 
        "Key Features"
    ] : [];

    // Scroll Logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            scrollToBottom();
        }
    }, [messages, loading]);

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        isAtBottomRef.current = isAtBottom;
        setShowScrollToBottom(!isAtBottom);
    };

    // Actions
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleEdit = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditingInput(msg.text || (msg.versions && msg.versions[msg.currentVersion!].content) || "");
    };

    const handleSaveEdit = async () => {
        if (!editingInput.trim()) return;
        const msgIndex = messages.findIndex(m => m.id === editingMessageId);
        if (msgIndex === -1) return;

        // Truncate history up to this message
        const newHistory = messages.slice(0, msgIndex);
        setMessages(newHistory);
        setEditingMessageId(null);
        setEditingInput("");
        
        // Use user's input to essentially "Resend"
        // But we need to handle if it was an ASSISTANT message? Actually usually user edits THEIR message.
        // If user edits assistant message, maybe they are correcting it? 
        // Standard UX: User edits USER message. Assistant edits... usually not allowed or just creates new branch.
        // Let's assume User edit.
        await sendMessage(editingInput); 
    };

    const handleRegenerate = async (assistantMsgId: number) => {
        setRegeneratingId(assistantMsgId);
        const msgIndex = messages.findIndex(m => m.id === assistantMsgId);
        if (msgIndex === -1) return;

        // We need the history UP TO the message PRIOR to this assistant message
        // Typically assistant msg follows a user msg.
        const historyUpToUser = messages.slice(0, msgIndex);
        
        // Get the LAST user message content to re-send (conceptually)
        // But implementation-wise, we just call the API with `historyUpToUser` and no new user input?
        // Wait, `sendMessage` append user message.
        // We probably want a specialized `regenerate` function or adapt `sendMessage`.
        
        // Let's do this: 
        // 1. Add a new empty version to the assistant message.
        // 2. Call API with history.
        
        setLoading(true);

        const lastUserMsg = historyUpToUser[historyUpToUser.length - 1]; // Should be user
        if (!lastUserMsg) return; // Should not happen 

        const historyPayload = historyUpToUser.slice(0, -1).map(m => ({ // Exclude the very last user msg from history? NO.
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.text || (m.versions ? m.versions[m.currentVersion!].content : "")
        }));
        // We include the last user message as the "message" or last history item?
        // The endpoint expects `history` + `message`.
        // So history = all before last user msg. `message` = last user msg text.
        
        const assistantMsg = messages[msgIndex];
        const newVersionIndex = (assistantMsg.versions?.length || 0);
        
        // Update state to show we are streaming the NEW version
        setMessages(prev => prev.map(m => {
            if (m.id === assistantMsgId) {
                return {
                    ...m,
                    versions: [...(m.versions || []), { content: "", sources: [] }],
                    currentVersion: newVersionIndex,
                    isStreaming: true,
                    toolStatus: undefined
                };
            }
            return m;
        }));

        try {
            await streamResponse(
                historyPayload, 
                lastUserMsg.text || "", 
                assistantMsgId, // Target this ID for update
                newVersionIndex
            );
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRegeneratingId(null);
            setMessages(prev => prev.map(m => {
                if (m.id === assistantMsgId) {
                    return { ...m, isStreaming: false, toolStatus: undefined };
                }
                return m;
            }));
        }
    };

    const handleVersionSwitch = (msgId: number, direction: number) => {
        setMessages(prev => prev.map(m => {
            if (m.id === msgId && m.versions) {
                const next = (m.currentVersion || 0) + direction;
                if (next >= 0 && next < m.versions.length) {
                    return { ...m, currentVersion: next };
                }
            }
            return m;
        }));
    };

    // Main Send Logic
    const sendMessage = async (overrideText?: string) => {
        const text = overrideText !== undefined ? overrideText : input;
        if (!text.trim() || loading) return;

        // Clear inputs
        if (overrideText === undefined) {
             setInput('');
        }

        const userMsgId = Date.now();
        const userMsg: Message = { 
            id: userMsgId, 
            role: 'user', 
            text: text
        };

        const aiMsgId = Date.now() + 1;
        const initialAiMsg: Message = {
            id: aiMsgId,
            role: 'assistant', // Use 'assistant' for internal consistency
            versions: [{ content: '', sources: [] }],
            currentVersion: 0,
            isStreaming: true
        };

        setMessages(prev => [...prev, userMsg, initialAiMsg]);
        setLoading(true);

        const historyPayload = messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : m.role,
            content: m.text || (m.versions ? m.versions[m.currentVersion || 0].content : "")
        }));

        await streamResponse(historyPayload, text, aiMsgId, 0);
        
        setLoading(false);
        setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false, toolStatus: undefined } : m));
    };

    const streamResponse = async (history: any[], lastMessage: string, targetMsgId: number, versionIdx: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    repoUrl, 
                    filePath: attachedFile, 
                    tree,
                    history, 
                    message: lastMessage
                })
            });

            if (!response.body) throw new Error("No response body");
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            let aiText = "";
            let sources: Source[] = [];
            let toolStatus = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            if (data.type === 'content') {
                                aiText += data.content;
                            } else if (data.type === 'tool_start') {
                                toolStatus = `Using tool: ${data.tool}...`;
                            } else if (data.type === 'tool_result') {
                                toolStatus = ''; // Explicitly clear local var
                                if (data.url || data.source_url) {
                                    const exists = sources.find(s => s.url === (data.url || data.source_url));
                                    if (!exists) {
                                        sources.push({
                                            url: data.url || data.source_url,
                                            icon: data.favicon
                                        });
                                    }
                                }
                                // Force update state to clear toolStatus immediately in UI
                                setMessages(prev => prev.map(m => {
                                    if (m.id === targetMsgId) {
                                        return { ...m, toolStatus: undefined };
                                    }
                                    return m;
                                }));
                            } else if (data.type === 'result') {
                                // Final result logic if needed
                            } else if (data.type === 'error') {
                                aiText += `\n\n**Error:** ${data.content}`;
                            }

                            // Update State
                            setMessages(prev => prev.map(m => {
                                if (m.id === targetMsgId && m.versions) {
                                    const updatedVersions = [...m.versions];
                                    updatedVersions[versionIdx] = {
                                        content: aiText,
                                        sources: [...sources]
                                    };
                                    return {
                                        ...m,
                                        versions: updatedVersions,
                                        toolStatus: toolStatus || undefined
                                    };
                                }
                                return m;
                            }));

                        } catch (e) {
                            console.error("Parse error", e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => prev.map(m => {
                if (m.id === targetMsgId && m.versions) {
                    return {
                        ...m,
                        toolStatus: undefined,
                        versions: [{...m.versions[0], content: m.versions[0].content + "\n\n**Connection Error**"}] // Fallback
                    };
                }
                return m;
            }));
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent w-full md:w-full shrink-0 relative">
             {/* Header */}
             <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-transparent">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-sm text-white block">Synapse Agent</span>
                        <span className="text-[10px] text-gray-500 block leading-tight">{attachedFile ? 'File Context' : 'Repo Context'}</span>
                    </div>
                </div>
                {attachedFile && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300 max-w-[150px]">
                        <Paperclip size={12} className="text-blue-400" />
                        <span className="truncate">{attachedFile.split('/').pop()}</span>
                    </div>
                )}
             </div>

             {/* Messages */}
             <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-32"
             >
                 {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80 mt-10">
                         <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center border border-white/10">
                             <Bot size={32} className="text-purple-400" />
                         </div>
                         <div className="space-y-1">
                             <h3 className="text-lg font-medium text-white">How can I help?</h3>
                             <p className="text-sm text-gray-500">I can read files, search the web, and analyze code.</p>
                         </div>
                         <div className="grid gap-2 w-full max-w-xs">
                            {suggestTopics.map(t => (
                                <button key={t} onClick={() => sendMessage(t)} className="text-xs py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-center text-gray-300 transition-all duration-200">
                                    {t}
                                </button>
                            ))}
                         </div>
                     </div>
                 )}

                 {messages.map((msg) => {
                     const isUser = msg.role === 'user';
                     // Resolve content
                     const content = isUser ? msg.text : msg.versions?.[msg.currentVersion || 0]?.content;
                     const sources = !isUser ? msg.versions?.[msg.currentVersion || 0]?.sources : [];
                     const hasMultipleVersions = !isUser && (msg.versions?.length || 0) > 1;

                     return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group relative`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-md ${isUser ? 'bg-zinc-800 border border-zinc-700' : 'bg-gradient-to-br from-blue-600 to-purple-600'}`}>
                                {isUser ? <User size={14} className="text-gray-400" /> : <Sparkles size={14} className="text-white" />}
                            </div>

                            <div className={`flex-1 min-w-0 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                {/* Bubble */}
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[95%] ${isUser ? 'bg-[#2b2d31] text-gray-100 rounded-tr-sm' : 'bg-transparent border border-white/5 text-gray-300 px-0 py-0 w-full'}`}>
                                    
                                    {/* Edit Mode */}
                                    {editingMessageId === msg.id ? (
                                        <div className="flex flex-col gap-2 p-2 bg-zinc-900 rounded-lg w-full">
                                            <textarea 
                                                value={editingInput}
                                                onChange={e => setEditingInput(e.target.value)}
                                                className="bg-transparent text-white text-sm focus:outline-none resize-none p-2 min-h-[60px]"
                                            />
                                            <div className="flex justify-end gap-2 text-xs">
                                                <button onClick={() => setEditingMessageId(null)} className="px-2 py-1 hover:bg-white/10 rounded">Cancel</button>
                                                <button onClick={handleSaveEdit} className="px-2 py-1 bg-blue-600 rounded text-white">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Sources (Assistant Only) - AT TOP */}
                                            {!isUser && sources && sources.length > 0 && (
                                                <div className="flex items-center gap-2 mb-3 px-1">
                                                    {sources.map((s, idx) => (
                                                        <a key={idx} href={s.url} target="_blank" rel="noopener noreferrer" className="block w-5 h-5 rounded-sm overflow-hidden border border-white/10 hover:border-blue-400 transition-colors" title={s.url}>
                                                            <img 
                                                                src={s.icon || `https://www.google.com/s2/favicons?domain=${new URL(s.url).hostname}&sz=32`} 
                                                                alt="source" 
                                                                className="w-full h-full object-cover" 
                                                                onError={(e) => {
                                                                    // Fallback if google favicon fails (unlikely but possible)
                                                                    e.currentTarget.style.display = 'none';
                                                                    e.currentTarget.parentElement!.innerText = 'SRC';
                                                                    e.currentTarget.parentElement!.className += ' flex items-center justify-center text-[8px] text-gray-400 bg-white/10';
                                                                }} 
                                                            />
                                                        </a>
                                                    ))}
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-wilder font-semibold ml-1">Sources</span>
                                                </div>
                                            )}

                                            <div className={isUser ? "" : "prose-content"}>
                                                <MarkdownRenderer content={content || ""} />
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                {/* Tool Status */}
                                {msg.toolStatus && (
                                    <div className="flex items-center gap-2 mt-2 px-2 text-xs text-gray-500 animate-pulse">
                                        <Terminal size={12} />
                                        <span>{msg.toolStatus}</span>
                                    </div>
                                )}
                                
                                {/* Thinking Spinner if streaming but no content yet */}
                                {msg.isStreaming && !content && !msg.toolStatus && (
                                    <div className="flex items-center gap-2 mt-2 px-2 text-xs text-gray-400">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-0"></div>
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-100"></div>
                                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse delay-200"></div>
                                        <span className="ml-1">Thinking...</span>
                                    </div>
                                )}

                                {/* Actions Row */}
                                {!editingMessageId && !msg.isStreaming && (
                                    <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Versions Navigation */}
                                        {hasMultipleVersions && (
                                            <div className="flex items-center bg-white/5 rounded-full px-1.5 py-0.5 border border-white/5 mr-2">
                                                <button onClick={() => handleVersionSwitch(msg.id, -1)} disabled={(msg.currentVersion||0) === 0} className="p-1 hover:text-white text-gray-500 disabled:opacity-30"><ChevronLeft size={10}/></button>
                                                <span className="text-[10px] text-gray-400 mx-1">{(msg.currentVersion||0)+1}/{msg.versions?.length}</span>
                                                <button onClick={() => handleVersionSwitch(msg.id, 1)} disabled={(msg.currentVersion||0) === (msg.versions?.length||1)-1} className="p-1 hover:text-white text-gray-500 disabled:opacity-30"><ChevronRight size={10}/></button>
                                            </div>
                                        )}

                                        <button onClick={() => handleCopy(content || "")} className="p-1 text-gray-500 hover:text-white" title="Copy"><Copy size={12}/></button>
                                        
                                        {isUser ? (
                                            <button onClick={() => handleEdit(msg)} className="p-1 text-gray-500 hover:text-white" title="Edit"><Edit size={12}/></button>
                                        ) : (
                                            <button onClick={() => handleRegenerate(msg.id)} className="p-1 text-gray-500 hover:text-white" title="Regenerate" disabled={!!regeneratingId}>
                                                <RefreshCw size={12} className={regeneratingId === msg.id ? "animate-spin text-blue-400" : ""}/>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                     );
                 })}
                 <div ref={messagesEndRef} />
             </div>

             {/* Scroll To Bottom Button */}
             {showScrollToBottom && (
                <button 
                    onClick={scrollToBottom}
                    className="absolute bottom-24 right-6 z-20 p-2 bg-[#2b2d31] border border-white/10 rounded-full shadow-lg text-white hover:bg-white/10 transition-all"
                >
                    <ArrowDownCircle size={20} />
                </button>
             )}

             {/* Footer Input */}
             <div className="absolute bottom-4 left-4 right-4">
                 <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                    <div className="relative bg-[#1e1e1e] rounded-2xl flex items-center p-1.5 shadow-2xl border border-white/10">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder={`Message ${attachedFile ? 'about file...' : 'Synapse Agent...'}`}
                            disabled={loading}
                            className="flex-1 bg-transparent border-none text-sm text-white placeholder-gray-500 focus:outline-none px-3 py-2"
                        />
                        <button 
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-white transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16} />}
                        </button>
                    </div>
                 </div>
                 <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-600 font-medium">Powered by OpenRouter & Agentic Tools</span>
                 </div>
             </div>
        </div>
    );
};
