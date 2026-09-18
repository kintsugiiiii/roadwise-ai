export interface Member {
  name: string;
  avatarText: string;
  role: string;
  isMe?: boolean;
}

export interface Agent {
  name: string;
  avatarIcon: string; // lucide icon name
  role: string;
  description: string;
  avatarBg: string;
}

export interface PlanItem {
  id: string;
  text: string;
  status: 'done' | 'processing' | 'pending';
}

export interface TaskAssignment {
  role: string;
  agentName: string;
  status: 'completed' | 'processing' | 'pending';
}

export interface FileAttachment {
  name: string;
  size: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'ppt';
}

export interface Message {
  id: string;
  sender: {
    name: string;
    avatarText?: string;
    avatarIcon?: string; // lucide icon name
    avatarBg?: string;
    isAi?: boolean;
    aiRole?: string; // e.g. "主控智能体", "数字员工"
  };
  time: string;
  content: string;
  plan?: {
    text: string;
    items: PlanItem[];
    assignments: TaskAssignment[];
  };
  file?: FileAttachment;
  readCount?: number;
  unreadCount?: number;
}

export interface Project {
  id: string;
  name: string;
  membersCount: number;
  aiCount: number;
  status: '进行中' | '审核中' | '已完成';
  unreadCount?: number;
  progress: number;
  reportCount: string;
  members: Member[];
  agents: Agent[];
  messages: Message[];
}

export interface KanbanStage {
  id: string;
  role: '项目经理' | '项目成员' | '三审人员' | '部门经理';
  items: {
    id: string;
    text: string;
    status: 'completed' | 'processing' | 'pending';
  }[];
}

export interface WorkTask {
  id: string;
  priority: 'P0 高' | 'P1 中' | 'P2 低';
  priorityColor: string;
  title: string;
  projectName: string;
  deadline: string;
  confirmTime: string;
  status: string;
  statusColor: string;
  type: 'confirm' | 'audit' | 'normal';
}

export interface ContractItem {
  id: string;
  projectName: string;
  amount: string;
  received: string;
  pending: string;
  invoiced: string;
}

export interface RecentFile {
  id: string;
  name: string;
  time: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'ppt';
  size?: string;
}

export interface QuickPrompt {
  id: string;
  title: string;
  description: string;
}

export interface ProjectSeedPayload {
  sourceAgentName: string;
  projectName: string;
  userInstruction: string;
  assistantSummary: string;
  files: {
    name: string;
    size?: string;
    type?: string;
  }[];
  generatedDocs: {
    title: string;
    status: string;
    desc: string;
    progress: number;
  }[];
}
