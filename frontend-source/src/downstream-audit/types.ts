export type NavView =
  | 'graph'
  | 'overview'
  | 'risk-inspection'
  | 'ap-cc'
  | 'misstatement'
  | 'compliance'
  | 'working-papers'
  | 'paper-detail'
  | 'trial-balance'
  | 'completion'
  | 'report-signoff'
  | 'owner-review';

export type GraphLayerType = 'scope' | 'rs' | 'and' | 'ct' | 'ap' | 'cc' | 'human';

export interface GraphNode {
  id: string;
  code: string;
  title: string;
  layer: GraphLayerType;
  layerNum: 1 | 2 | 3 | 4 | 5;
  x: number;
  y: number;
  status?: string;
  detail?: string;
  isTriggered?: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  type?: 'solid' | 'dashed' | 'orange' | 'purple';
}


export type SeverityLevel = '高' | '中' | '低' | '重大' | '一般';

export type MisstatementStatus = '未调整' | '部分调整' | '已调整';

export interface MisstatementItem {
  id: string;
  code: string;
  subject: string;
  description: string;
  amount: number;
  severity: '高' | '中' | '低';
  status: MisstatementStatus;
  paperRef: string;
}

export type ComplianceStatus = '未提交' | '审批中' | '已提交';

export interface ComplianceIssueItem {
  id: string;
  code: string;
  category: string;
  description: string;
  lawBasis: string;
  severity: '重大' | '一般' | '低';
  status: ComplianceStatus;
}

export type PaperStatus = '已复核' | '编制中' | '未开始';

export interface ExecutionResultRow {
  item: string;
  amount: number;
  ratio: number;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  uploader: string;
}

export interface ReviewRecordItem {
  id: string;
  reviewer: string;
  date: string;
  action: string;
  comment: string;
}

export interface WorkingPaperItem {
  id: string;
  sourceTagId?: string;
  sourceTagLabel?: string;
  code: string;
  name: string;
  author: string;
  date: string;
  reviewer: string;
  reviewDate: string;
  status: PaperStatus;
  folderPath: string;
  importance: '重要' | '一般' | '次要';
  associatedAccount: string;
  indexCode: string;
  type: string;
  contentInstruction: string;
  executionResults: ExecutionResultRow[];
  attachments?: AttachmentItem[];
  reviewRecords?: ReviewRecordItem[];
  doubts?: string[];
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  beforeDebit: number | null;
  beforeCredit: number | null;
  adjDebit: number | null;
  adjCredit: number | null;
  afterDebit: number | null;
  afterCredit: number | null;
}

export type ProcedureStatus = '已完成' | '进行中' | '未开始';

export interface CompletionProcedureItem {
  id: string;
  code: string;
  name: string;
  executor: string;
  date: string;
  reviewer: string;
  status: ProcedureStatus;
  stepCategory: 1 | 2 | 3 | 4;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
