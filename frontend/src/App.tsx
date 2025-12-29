import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AuditReport } from './components/AuditReport';
import { Sparkles, ArrowRight } from 'lucide-react';

function App() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // In development, the backend is on port 8787
      const response = await fetch('http://localhost:8787/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error(error);
      alert("Error analyzing file. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 relative overflow-x-hidden">
      
      {/* Navbar / Brand */}
      <nav className="flex justify-between items-center max-w-7xl mx-auto mb-16">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00f2ff] rounded-lg shadow-[0_0_15px_#00f2ff]" />
            <span className="text-xl font-bold tracking-tighter">CRITIC.AI</span>
         </div>
         <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Login</a>
      </nav>

      {/* Hero Section */}
      {!analysis && (
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00f2ff] mb-4">
             <Sparkles size={12} /> AI-POWERED CAREER AUDITOR
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Will your resume <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#7000ff]">
              survive the cut?
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your resume or portfolio. Our Multi-Agent AI (Recruiter + Designer + ATS) 
            will roast it, grade it, and tell you exactly how to fix it.
          </p>
        </div>
      )}

      {/* Main Interactive Area */}
      <main className="max-w-5xl mx-auto relative z-10">
        {!analysis ? (
             <FileUpload onUpload={handleUpload} isLoading={loading} />
        ) : (
            <>
                <div className="flex justify-center mb-8">
                     <button 
                        onClick={() => setAnalysis(null)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                     >
                        <ArrowRight className="rotate-180" size={16} /> Upload New File
                     </button>
                </div>
                <AuditReport data={analysis} />
            </>
        )}
      </main>

      {/* Background Decor */}
      <div className="fixed -bottom-40 -left-20 w-96 h-96 bg-[#7000ff] rounded-full filter blur-[128px] opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-[#00f2ff] rounded-full filter blur-[150px] opacity-10 pointer-events-none" />
    </div>
  );
}

export default App;
