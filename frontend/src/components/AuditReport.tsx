import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, User, Briefcase, Layout } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  section_scores: {
    Visuals: number;
    Content: number;
    Impact: number;
    Grammar: number;
  };
  actionable_feedback: string[];
  role_fit: string;
}

interface AuditReportProps {
  data: AnalysisResult;
}

export const AuditReport: React.FC<AuditReportProps> = ({ data }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/50 shadow-emerald-500/20";
    if (score >= 70) return "text-yellow-400 border-yellow-500/50 shadow-yellow-500/20";
    return "text-red-400 border-red-500/50 shadow-red-500/20";
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 space-y-8 pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 flex flex-col md:flex-row items-center justify-between gap-8"
      >
        <div className="flex-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Audit Results
          </h2>
          <p className="text-gray-400 mt-2">{data.summary}</p>
          <div className="mt-4 flex gap-3">
             <span className="px-3 py-1 rounded-full bg-white/10 text-sm border border-white/10 flex items-center gap-2">
                <Briefcase size={14} /> {data.role_fit} Level
             </span>
          </div>
        </div>

        {/* Big Score Circle */}
        <div className={clsx(
          "relative w-32 h-32 rounded-full border-4 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0)]",
          getScoreColor(data.score)
        )}>
          <div className="text-center">
            <span className="text-4xl font-black block">{data.score}</span>
            <span className="text-xs uppercase tracking-wider opacity-70">Score</span>
          </div>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Scores */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Layout className="text-[#00f2ff]" size={20} /> Category Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(data.section_scores).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{key}</span>
                  <span className="font-mono">{value}/10</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00f2ff] to-[#7000ff]"
                    style={{ width: `${value * 10}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Strengths & Weaknesses */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6"
        >
           <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <User className="text-[#7000ff]" size={20} /> Key Takeaways
          </h3>
          <div className="space-y-6">
            <div>
              <p className="text-emerald-400 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} /> Strengths
              </p>
              <ul className="space-y-1">
                {data.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-gray-400">• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-red-400 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                <XCircle size={16} /> Weaknesses
              </p>
              <ul className="space-y-1">
                {data.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-400">• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Plan */}
      <motion.div 
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
         className="glass-panel p-8 border-l-4 border-l-[#00f2ff]"
      >
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-400" size={20} /> Action Plan
        </h3>
        <div className="grid gap-3">
          {data.actionable_feedback.map((tip, i) => (
            <div key={i} className="flex gap-4 p-3 bg-white/5 rounded-lg border border-white/5">
              <span className="font-mono text-[#00f2ff] font-bold">0{i + 1}</span>
              <p className="text-gray-300 text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
