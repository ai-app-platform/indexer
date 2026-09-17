import { create } from 'zustand';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
  jsonContent?: string;
  expanded?: boolean;
}

export interface ProjectInfo {
  name: string;
  repoUrl: string;
  branch: string;
  stack: string[];
  version: string;
  totalFiles: number;
  totalFolders: number;
  language: string;
  lastIndex: string;
}

export interface IndexStep {
  id: number;
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
}

export interface Branch {
  id: string;
  name: string;
  isCurrent: boolean;
  createdAt: string;
  lastUpdated: string;
  commitCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ProjectState {
  projectInfo: ProjectInfo | null;
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  isIndexing: boolean;
  indexSteps: IndexStep[];
  branches: Branch[];
  currentBranch: Branch | null;
  chatMessages: ChatMessage[];
  setProjectInfo: (info: ProjectInfo) => void;
  setFileTree: (tree: FileNode[]) => void;
  setSelectedFile: (file: FileNode | null) => void;
  setIsIndexing: (isIndexing: boolean) => void;
  setIndexSteps: (steps: IndexStep[] | ((prev: IndexStep[]) => IndexStep[])) => void;
  updateIndexStep: (stepId: number, updates: Partial<IndexStep>) => void;
  addBranch: (branch: Branch) => void;
  setCurrentBranch: (branch: Branch) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projectInfo: null,
  fileTree: [],
  selectedFile: null,
  isIndexing: false,
  indexSteps: [],
  branches: [],
  currentBranch: null,
  chatMessages: [],

  setProjectInfo: (info) => set({ projectInfo: info }),
  setFileTree: (tree) => set({ fileTree: tree }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setIsIndexing: (isIndexing) => set({ isIndexing }),
  setIndexSteps: (steps) => set((state) => ({
    indexSteps: typeof steps === 'function' ? steps(state.indexSteps) : steps,
  })),
  updateIndexStep: (stepId, updates) =>
    set((state) => ({
      indexSteps: state.indexSteps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    })),
  addBranch: (branch) =>
    set((state) => ({ branches: [...state.branches, branch] })),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChat: () => set({ chatMessages: [] }),
}));
