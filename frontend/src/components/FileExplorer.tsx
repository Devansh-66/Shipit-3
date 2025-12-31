import React, { useState } from 'react';
import { 
    ChevronRight, 
    ChevronDown, 
    Box,
    Folder,
    FolderOpen
} from 'lucide-react';
import { getIcon } from 'material-file-icons';

interface FileNode {
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    children?: FileNode[];
}

interface FileExplorerProps {
    tree: FileNode[];
    onFileSelect: (path: string) => void;
    selectedFile: string | null;
}

const getFileIcon = (filename: string, isFolder: boolean, isOpen: boolean) => {
    if (isFolder) {
        return isOpen ? 
            <FolderOpen size={18} className="text-[#E0E0E0]" strokeWidth={1.5} /> : 
            <Folder size={18} className="text-[#E0E0E0]" strokeWidth={1.5} />;
    }

    const { svg } = getIcon(filename);
    
    return (
        <div 
            style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            dangerouslySetInnerHTML={{ __html: svg }} 
        />
    );
};

const buildTree = (items: any[]) => {
    const root: FileNode[] = [];
  
    // Sort: Folders first, then files
    items.sort((a, b) => {
        if (a.type === b.type) return a.path.localeCompare(b.path);
        return a.type === 'folder' ? 1 : -1;
    });
  
    const addNode = (path: string, type: 'blob' | 'tree') => {
        const parts = path.split('/');
        let currentLevel = root;
        
        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1 && type === 'blob';
            
            // Actually, we can just match on name in current level
            const existingByName = currentLevel.find(n => n.path.split('/').pop() === part);

            if (existingByName) {
                currentLevel = existingByName.children || [];
            } else {
                const newPath = parts.slice(0, index + 1).join('/');
                const newNode: FileNode = {
                    path: newPath,
                    type: isFile ? 'blob' : 'tree',
                    sha: '',
                    children: isFile ? undefined : []
                };
                currentLevel.push(newNode);
                if (!isFile) currentLevel = newNode.children!;
            }
        });
    };
  
    items.forEach(item => addNode(item.path, item.type === 'tree' ? 'tree' : 'blob'));
    
    // Sort logic
    const sortNodes = (nodes: FileNode[]) => {
        nodes.sort((a, b) => {
            const aName = a.path.split('/').pop() || '';
            const bName = b.path.split('/').pop() || '';
            if (a.type === b.type) return aName.localeCompare(bName);
            return a.type === 'tree' ? -1 : 1;
        });
        nodes.forEach(n => {
            if (n.children) sortNodes(n.children);
        });
    };
    
    sortNodes(root);
    return root;
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ tree, onFileSelect, selectedFile }) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [data, setData] = useState<FileNode[]>([]);

    React.useEffect(() => {
        if(tree) {
            setData(buildTree(tree));
        }
    }, [tree]);

    const toggleFolder = (path: string) => {
        const next = new Set(expandedFolders);
        if (next.has(path)) {
            next.delete(path);
        } else {
            next.add(path);
        }
        setExpandedFolders(next);
    };

    const renderTree = (nodes: FileNode[], depth = 0) => {
        return nodes.map((node) => {
            const isExpanded = expandedFolders.has(node.path);
            const isSelected = selectedFile === node.path;
            const fileName = node.path.split('/').pop() || '';

            if (node.type === 'tree') {
                return (
                    <div key={node.path}>
                        <div 
                            className={`flex items-center gap-1.5 py-1.5 px-2 hover:bg-white/5 cursor-pointer transition-colors text-sm text-gray-300 select-none group`}
                            style={{ paddingLeft: `${depth * 12 + 8}px` }}
                            onClick={() => toggleFolder(node.path)}
                        >
                            <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </span>
                            {getFileIcon(node.path, true, isExpanded)}
                            <span className="truncate">{fileName}</span>
                        </div>
                        <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                            <div className="overflow-hidden">
                                {node.children && renderTree(node.children, depth + 1)}
                            </div>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div 
                        key={node.path}
                        className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-all duration-200 text-sm border-l-2 ${isSelected ? 'bg-blue-600/10 border-blue-500 text-blue-200' : 'border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200'}`}
                        style={{ paddingLeft: `${depth * 12 + 24}px` }}
                        onClick={() => onFileSelect(node.path)}
                    >
                        {getFileIcon(fileName, false, false)}
                        <span className="truncate">{fileName}</span>
                    </div>
                );
            }
        });
    };

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500 space-y-2">
                <Box size={24} className="opacity-50" />
                <span className="text-xs">No files found</span>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {renderTree(data)}
        </div>
    );
};
