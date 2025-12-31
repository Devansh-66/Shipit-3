import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Custom paragraph to handle images and simple text formatting
 */
const CustomParagraph = ({ children }: any) => {
  return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
};

/**
 * Custom code block with collapse/copy buttons.
 */
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const codeText = String(children).replace(/\n$/, "");
  
  const handleCopy = () => {
    navigator.clipboard.writeText(codeText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // SyntaxHighlighter Custom Style overrides
  const syntaxHighlighterStyle = {
    ...vscDarkPlus,
    'pre[class*="language-"]': {
      ...vscDarkPlus['pre[class*="language-"]'],
      backgroundColor: 'transparent',
      padding: '1rem',
      margin: 0,
    },
    'code[class*="language-"]': {
      ...vscDarkPlus['code[class*="language-"]'],
      background: 'transparent',
    },
  };

  return !inline && match ? (
    <div className="my-4 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/5">
        <span className="text-xs text-gray-400 font-mono capitalize">
          {match[1]}
        </span>
        <div className="flex items-center gap-2">
            <button
                onClick={toggleCollapse}
                className="p-1 px-2 rounded hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
                {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                {isCollapsed ? "Expand" : "Collapse"}
            </button>
            <button
                onClick={handleCopy}
                className="p-1 px-2 rounded hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
                {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                {isCopied ? "Copied!" : "Copy"}
            </button>
        </div>
      </div>
      <div 
        className={`transition-all duration-300 ease-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'} overflow-auto`}
      >
        <SyntaxHighlighter
          style={syntaxHighlighterStyle}
          language={match[1]}
          PreTag="div"
          wrapLines
          wrapLongLines
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  ) : (
    <span className="inline-flex items-center align-middle relative -top-[1px]">
        <SyntaxHighlighter
        language={match ? match[1] : 'javascript'}
        style={vscDarkPlus}
        PreTag="span"
        customStyle={{
            margin: 0,
            padding: '0.2rem 0.4rem',
            borderRadius: '0.375rem',
            fontSize: '0.85em',
            backgroundColor: '#1e1e1e',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'inline-block',
            lineHeight: '1.4',
            verticalAlign: 'baseline',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
        codeTagProps={{
            style: { fontFamily: 'inherit' }
        }}
        {...props}
        >
        {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
    </span>
  );
};

export default function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  return (
    <div className="prose prose-sm max-w-none prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          p: CustomParagraph,
          pre: ({ children }: any) => <>{children}</>,
          code: CodeBlock,
          ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>,
          table: ({ children }) => <div className="overflow-x-auto my-4 border border-white/10 rounded-lg"><table className="min-w-full divide-y divide-white/10 text-sm text-left">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-white/5 font-medium text-gray-200">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-3 text-xs uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 text-gray-300">{children}</td>,
          hr: () => <hr className="my-6 border-white/10" />,
          h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-white pb-2 border-b border-white/10">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-100">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-200">{children}</h3>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
