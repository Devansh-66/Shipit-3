import { InputHub } from './components/InputHub';
import { FileExplorer } from './components/FileExplorer';
import { CodePanel } from './components/CodePanel';
import { PreviewPanel } from './components/PreviewPanel';
import { UnifiedChat } from './components/UnifiedChat';
import { Loader2, ArrowLeft, Eye, EyeOff, PanelLeftClose, PanelLeftOpen, LayoutTemplate, GripVertical } from 'lucide-react';
import { useState, useEffect } from 'react';

function App() {
  const [visualData, setVisualData] = useState<any>(null);
  const [repoMeta, setRepoMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentRepo, setCurrentRepo] = useState('');
  
  // Selection State
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [analyzingFile, setAnalyzingFile] = useState(false);

  // UI State
  const [showPreview, setShowPreview] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isCodePanelOpen, setIsCodePanelOpen] = useState(false);
  const [defaultBranch, setDefaultBranch] = useState('main');
  
  // Layout State
  const [codePanelWidth, setCodePanelWidth] = useState(500); // Default slightly wider for code
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault(); 
  };
   // ... existing useEffect ...

  // (useEffect unchanged, omitted for brevity in search)


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX - 20; // 20px buffer/margin
      // Clamp values
      if (newWidth > 300 && newWidth < 800) {
        setCodePanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  const handleVisualize = async (repoUrl: string) => {
    setLoading(true);
    setCurrentRepo(repoUrl);
    setRepoMeta(null);
    setShowPreview(false);
    setSelectedFile(null);

    try {
        const response = await fetch('http://localhost:8787/visualize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl })
        });
        
        if (!response.ok) throw new Error("Failed to visualize");
        
        const data = await response.json();
        setVisualData(data);
        if (data.meta) {
            setRepoMeta(data.meta);
            if (data.meta.default_branch) {
                setDefaultBranch(data.meta.default_branch);
            }
        }
    } catch (e) {
        console.error(e);
        alert("Error connecting to Synapse Backend.");
    } finally {
        setLoading(false);
    }
  };

  const handleFileSelect = async (path: string) => {
      setSelectedFile(path);
      setFileContent(null);
      setAnalyzingFile(true);
      
      try {
        const response = await fetch('http://localhost:8787/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                repoUrl: currentRepo, 
                filePath: path,
                branch: defaultBranch 
            })
        });
        const result = await response.json();
        setFileContent(result.content);
      } catch (e) {
         console.error("Error fetching file content");
      } finally {
        setAnalyzingFile(false);
      }
  };

  return (
    <div className={`min-h-screen p-4 md:p-6 relative overflow-hidden bg-[#0a0a0a] text-white font-sans flex flex-col h-screen ${isResizing ? 'cursor-col-resize select-none' : ''}`}>
        {/* Background Gradients */}
        <div className="fixed -top-40 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full filter blur-[150px] pointer-events-none" />
        <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full filter blur-[150px] pointer-events-none" />
        
        {/* Main Layout */}
        <main className="relative z-10 w-full max-w-[95rem] mx-auto flex-1 flex flex-col min-h-0">
            
            {/* 1. Landing View */}
            {!visualData ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                     {!loading ? (
                        <InputHub onVisualize={handleVisualize} />
                     ) : (
                        <div className="text-center space-y-4">
                            <Loader2 className="animate-spin text-blue-500 mx-auto" size={48} />
                            <h2 className="text-2xl font-bold">Scanning Repository...</h2>
                            <p className="text-gray-400">Fetching file tree from GitHub</p>
                        </div>
                     )}
                 </div>
            ) : (
                /* 2. Workspace View */
                <div className="flex-1 flex flex-col h-full min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setVisualData(null)} 
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                title="Back to Home"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button 
                                onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                                className={`p-2 rounded-lg transition-colors ${isExplorerOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                {isExplorerOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                            </button>
                            <h1 className="text-xl font-bold truncate text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                {currentRepo.replace('https://github.com/', '')}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            {repoMeta && repoMeta.homepage && (
                                <button 
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${showPreview ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'}`}
                                >
                                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                    {showPreview ? 'Hide Preview' : 'Live Site'}
                                </button>
                            )}
                             <button 
                                onClick={() => setIsCodePanelOpen(!isCodePanelOpen)}
                                className={`p-2 rounded-lg transition-colors ${isCodePanelOpen ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                                title={isCodePanelOpen ? "Close Code Panel" : "Open Code Panel"}
                            >
                                <LayoutTemplate size={20} />
                            </button>
                        </div>
                    </div>

                    {/* 3-Pane Layout */}
                    <div className="flex-1 flex overflow-hidden gap-x-4 relative">
                        
                        {/* LEFT: File Explorer */}
                        {isExplorerOpen && (
                            <div className="w-64 flex flex-col border border-white/10 rounded-xl overflow-hidden glass-panel bg-black/40 backdrop-blur-xl shadow-2xl shrink-0 transition-all duration-300">
                                <FileExplorer 
                                    tree={visualData.tree} 
                                    onFileSelect={handleFileSelect} 
                                    selectedFile={selectedFile} 
                                />
                            </div>
                        )}
                        
                        {/* CENTER: Unified Chat (Flexible) */}
                        <div className="flex-1 flex flex-col border border-white/10 rounded-xl overflow-hidden glass-panel bg-black/40 backdrop-blur-xl shadow-2xl min-w-0">
                            <UnifiedChat 
                                repoUrl={currentRepo}
                                tree={visualData.tree}
                                attachedFile={selectedFile}
                                repoAnalysis={null}
                            />
                        </div>

                        {/* DRAG HANDLE */}
                        {isCodePanelOpen && (
                            <div 
                                className="w-4 -ml-2 cursor-col-resize flex items-center justify-center hover:bg-white/5 active:bg-blue-500/20 z-20 transition-colors"
                                onMouseDown={startResizing}
                            >
                                <div className="h-8 w-1 flex items-center justify-center">
                                    <GripVertical size={16} className="text-gray-600" />
                                </div>
                            </div>
                        )}

                        {/* RIGHT: Code View (Resizable) */}
                         {isCodePanelOpen && (
                            <div 
                                className="flex flex-col border border-white/10 rounded-xl overflow-hidden glass-panel bg-black/40 backdrop-blur-xl shadow-2xl shrink-0"
                                style={{ width: codePanelWidth }}
                            >
                                {selectedFile ? (
                                    <CodePanel 
                                        fileName={selectedFile} 
                                        fileContent={fileContent}
                                        loading={analyzingFile}
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                                        <LayoutTemplate size={48} className="opacity-20" />
                                        <p>Select a file to view code</p>
                                    </div>
                                )}
                            </div>
                         )}

                        {/* PREVIEW (Overlay) */}
                        {showPreview && repoMeta?.homepage && (
                            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-10">
                                <div className="w-full h-full max-w-6xl flex flex-col bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                    <div className="h-10 flex items-center justify-between px-4 bg-white/5 border-b border-white/10">
                                        <span className="text-sm font-bold text-white">Live Preview</span>
                                        <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-white"><EyeOff size={16} /></button>
                                    </div>
                                    <PreviewPanel url={repoMeta.homepage} onClose={() => setShowPreview(false)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    </div>
  );
}

export default App;
