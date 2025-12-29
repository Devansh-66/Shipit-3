import React, { useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
        onUpload(droppedFile);
      } else {
        alert("Please upload a PDF or Image file.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onUpload(selectedFile);
    }
  };

  return (
    <div 
      className={clsx(
        "relative w-full max-w-xl mx-auto h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300",
        dragActive ? "border-[#00f2ff] bg-[#00f2ff]/5 scale-105" : "border-white/20 hover:border-white/40",
        isLoading && "opacity-50 pointer-events-none"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleChange}
        accept=".pdf,image/*"
      />
      
      {isLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#00f2ff] animate-spin" />
          <p className="text-gray-400 animate-pulse">Analyzing Asset...</p>
        </div>
      ) : file ? (
        <div className="flex flex-col items-center gap-4">
          <FileText className="w-12 h-12 text-[#00f2ff]" />
          <div className="text-center">
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <p className="text-xs text-emerald-400">Ready to Audit</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">Drop your Resume or Portfolio</p>
            <p className="text-sm text-gray-400 mt-1">Supports PDF, PNG, JPG</p>
          </div>
        </div>
      )}
    </div>
  );
};
