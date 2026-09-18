import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  FileText, 
  Bell, 
  Receipt,
  ExternalLink,
  Check,
  CheckCircle2,
  ChevronDown,
  Upload,
  Sparkles,
  Search,
  X,
  Play,
  Clock,
  User,
  Users,
  CheckCheck,
  Info,
  Layers,
  FileSpreadsheet,
  Calendar,
  Dot,
  Plus,
  BarChart3,
  Grid2X2,
  List,
  Archive,
  SlidersHorizontal,
  Star,
  GitBranch,
  Download,
  Columns3,
  MessageSquare,
  ShieldCheck,
  Flag,
  Eye
} from 'lucide-react';
import { WorkTask, Project, ContractItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import ProjectActionDrawer, { createProjectActionState, ProjectActionState } from './ProjectActionDrawer';
import AuditTagSystemView from './AuditTagSystemView';

interface WorkbenchViewProps {
  tasks: WorkTask[];
  contracts: ContractItem[];
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onAuditTask: (task: WorkTask) => void;
  onNewProject?: () => void;
  openProjectDetailId?: string | null;
  onProjectDetailOpened?: () => void;
  agentPanelOpen?: boolean;
  onToggleAgentPanel?: () => void;
}

type TimelineKind = 'report' | 'parallel' | 'auditProgress' | 'contractFinance' | 'contract';
type OverviewPanelKind = 'projects' | 'tasks' | 'dynamics' | 'contracts';
type FinancePanelView = 'receipt' | 'invoice';

interface TimelineNode {
  nodeId: number;
  title: string;
  role: string;
  status: 'completed' | 'active' | 'pending';
}

interface ProjectData {
  id: string;
  name: string;
  shortName: string;
  logoChar: string;
  client?: string;
  projectType?: string;
  owner?: string;
  todo?: number;
  due?: string;
  stage?: number;
  status: '进行中' | '审核中' | '已完成';
  progress: number;
  reportCount: string;
  membersCount: number;
  reportTimeline: TimelineNode[];
  timeline: TimelineNode[];
}

interface PaymentMilestone {
  id: string;
  name: string;
  condition: string;
  dueDate: string;
  amount: number;
  received: number;
}

interface ReceiptRecord {
  id: string;
  date: string;
  amount: number;
  milestoneId: string;
  payer: string;
  serialNo: string;
  allocatedAmount: number;
  note?: string;
}

interface InvoiceRecord {
  id: string;
  date: string;
  amount: number;
  linkedReceiptIds: string[];
  status: '待财务审核' | '待开票' | '已退回' | '已开票' | '已开票未收款';
  applicant: string;
  reviewComment?: string;
  invoiceNo?: string;
  invoiceFileName?: string;
}

interface WorkbenchContract {
  id: string;
  projectName: string;
  projectId: string;
  signDate: string;
  amount: string;
  numericAmount: number;
  received: string;
  numericReceived: number;
  pending: string;
  numericPending: number;
  invoiced: string;
  numericInvoiced: number;
  paymentPlan: PaymentMilestone[];
  receiptRecords: ReceiptRecord[];
  invoiceRecords: InvoiceRecord[];
}

const reportMainTimeline: TimelineNode[] = [
  { nodeId: 1, title: '创建项目', role: '项目经理', status: 'completed' },
  { nodeId: 2, title: '成员同步', role: '项目经理', status: 'completed' },
  { nodeId: 3, title: '底稿计划', role: '项目经理', status: 'completed' },
  { nodeId: 4, title: '写底稿', role: '项目成员', status: 'completed' },
  { nodeId: 5, title: '写报告', role: '项目成员', status: 'active' },
  { nodeId: 6, title: '报告一审', role: '项目经理', status: 'pending' },
  { nodeId: 7, title: '报告二审', role: '项目成员', status: 'pending' },
  { nodeId: 8, title: '报告三审', role: '三审人员', status: 'pending' },
  { nodeId: 9, title: '上传报备信息表', role: '项目成员', status: 'pending' },
  { nodeId: 10, title: '申请出具', role: '项目成员', status: 'pending' },
];

const projectStageLabels = reportMainTimeline.map((node) => node.title);
const projectFavoritesStorageKey = 'huaxiaoan-react-workbench-favorites-v1';
const projectArchiveStorageKey = 'huaxiaoan-react-workbench-archive-v1';

const systemNotices = [
  { id: 'release-20260721', type: '版本更新', title: '华小安工作台 V2.6.0 已发布', detail: '项目详情新增多合同链路切换，并优化待处理操作体验。', time: '今天 15:30', tone: 'blue' },
  { id: 'maintenance-20260723', type: '系统维护', title: '7月23日凌晨进行例行维护', detail: '预计 02:00–03:00 短暂影响文件预览，项目数据不会受影响。', time: '今天 10:00', tone: 'amber' },
  { id: 'security-20260720', type: '安全提醒', title: '建议及时更新登录密码', detail: '检测到当前密码已使用超过 90 天，可前往账号安全进行更新。', time: '昨天', tone: 'green' },
] as const;

const getProjectStageLabelLines = (label: string) => (
  label === '上传报备信息表' ? ['上传报备', '信息表'] : [label]
);

const reportParallelBranches = [
  {
    title: '客户交付',
    nodes: [
      { nodeId: 101, title: '发给客户', role: '项目成员', status: 'pending' as const },
    ],
  },
  {
    title: '报告归档',
    nodes: [
      { nodeId: 102, title: '报告归档申请', role: '项目成员', status: 'pending' as const },
      { nodeId: 103, title: '归档审批', role: '部门经理', status: 'pending' as const },
      { nodeId: 104, title: '行政归档', role: '行政出具', status: 'pending' as const },
    ],
  },
];

const reportFinishNode: TimelineNode = { nodeId: 105, title: '完成', role: '项目成员', status: 'pending' };

const formatCurrency = (amount: number) => amount <= 0 ? '—' : `¥ ${amount.toLocaleString()}`;

const getMilestoneStatus = (milestone: PaymentMilestone) => {
  if (milestone.received >= milestone.amount) return '已收齐';
  if (milestone.received > 0) return '部分收款';
  return '待收款';
};

const getMilestoneStatusClass = (milestone: PaymentMilestone) => {
  const status = getMilestoneStatus(milestone);
  if (status === '已收齐') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === '部分收款') return 'bg-amber-50 text-amber-700 border-amber-100';
  return 'bg-gray-50 text-gray-500 border-gray-100';
};

function buildReportTimeline(activeNodeId: number): TimelineNode[] {
  return reportMainTimeline.map((node) => ({
    ...node,
    status: node.nodeId < activeNodeId ? 'completed' : node.nodeId === activeNodeId ? 'active' : 'pending',
  }));
}

const prototypeProjectSeeds = [
  ['jinli-group', '金利集团有限公司专项审计', '金利集团有限公司', '专项审计', '符金雨', 65, 2, '2026-08-01', '进行中', 5],
  ['codex-e2e', 'Codex-E2E-CPA-20260623', 'Codex有限公司', '年报审计', '陈华', 45, 1, '2026-07-25', '待处理', 6],
  ['wls-3', 'WLS测试项目3', 'WLS科技有限公司', '财务审计', '蔡宇豪', 25, 3, '2026-08-15', '进行中', 3],
  ['wls-4', 'WLS测试项目4', 'WLS科技有限公司', '社保审计', '陈嘉妍', 100, 0, '2026-07-10', '已完成', 10],
  ['test-1', '测试项目1', '测试有限公司', '财务审计', '王磊', 10, 1, '2026-08-30', '进行中', 2],
  ['huaxiao-internal', '华小安内部审计2026', '华小安科技', '内部审计', '张婷婷', 55, 2, '2026-07-28', '待处理', 6],
  ['xx-finance', 'XX公司财务审计项目', 'XX有限公司', '财务审计', '李明', 30, 0, '2026-08-10', '进行中', 3],
  ['yy-annual', 'YY集团年报审计2026', 'YY集团有限公司', '年报审计', '赵丽', 100, 0, '2026-06-30', '已完成', 10],
  ['huabei-annual', '华北制造有限公司年报审计', '华北制造有限公司', '年报审计', '刘敏', 42, 1, '2026-08-22', '进行中', 4],
  ['yuanhang-special', '远航供应链专项审计', '远航供应链有限公司', '专项审计', '周宁', 58, 2, '2026-08-18', '待处理', 5],
  ['qiming-finance', '启明科技财务审计', '启明科技有限公司', '财务审计', '王倩', 35, 3, '2026-09-05', '进行中', 3],
  ['xinghe-annual', '星河教育集团审计', '星河教育集团', '年报审计', '李岩', 70, 1, '2026-08-12', '进行中', 6],
  ['haiyue-internal', '海岳咨询内部审计', '海岳咨询有限公司', '内部审计', '孙悦', 20, 2, '2026-09-16', '待处理', 2],
  ['zhituo-special', '智拓信息专项审计', '智拓信息技术有限公司', '专项审计', '吴晨', 48, 1, '2026-08-28', '进行中', 4],
  ['boyuan-finance', '博远商贸财务审计', '博远商贸有限公司', '财务审计', '郑凯', 15, 4, '2026-09-20', '进行中', 1],
  ['xincheng-annual', '新城建设年报审计', '新城建设集团', '年报审计', '钱静', 62, 2, '2026-08-09', '待处理', 5],
] as const;

const prototypeContractTimeline: TimelineNode[] = [
  { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'completed' },
  { nodeId: 2, title: '提交审核', role: '项目成员', status: 'active' },
  { nodeId: 3, title: '合同一审', role: '部门经理', status: 'pending' },
  { nodeId: 4, title: '合同二审', role: '审批人', status: 'pending' },
];

const prototypeProjects: ProjectData[] = prototypeProjectSeeds.map(([
  id, name, client, projectType, owner, progress, todo, due, status, stage,
], index) => ({
  id,
  name,
  shortName: name,
  logoChar: name.slice(0, 1).toUpperCase(),
  client,
  projectType,
  owner,
  todo,
  due,
  stage,
  status: status === '待处理' ? '审核中' : status,
  progress,
  reportCount: progress === 100 ? '1/1' : '0/1',
  membersCount: 3 + (index % 5),
  reportTimeline: buildReportTimeline(Math.min(reportMainTimeline.length, Math.max(1, stage))),
  timeline: prototypeContractTimeline,
}));

function ReadyEmptyState({ message = '恭喜，今日所有待处理任务均已就绪！' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-3">
        <Check className="w-5 h-5 stroke-[3]" />
      </div>
      <p className="text-[11px] text-[#9aa1b5] font-bold">{message}</p>
    </div>
  );
}

function ProjectOverview({ projects, onOpenProject, onNewProject, onOpenTagSystem, openProjectDetailId, onProjectDetailOpened }: { projects: ProjectData[]; onOpenProject: (id: string) => void; onNewProject?: () => void; onOpenTagSystem: () => void; openProjectDetailId?: string | null; onProjectDetailOpened?: () => void }) {
  const [tab, setTab] = useState('全部项目');
  const [query, setQuery] = useState('');
  const [isList, setIsList] = useState(true);
  const [detail, setDetail] = useState<ProjectData | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ProjectData | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, ProjectActionState>>({});
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(projectFavoritesStorageKey) ?? '[]'));
    } catch {
      return new Set<string>();
    }
  });
  const [statusFilter, setStatusFilter] = useState('全部状态');
  const [archivedProjectIds, setArchivedProjectIds] = useState<Set<string>>(() => {
    try {
      return new Set<string>(JSON.parse(localStorage.getItem(projectArchiveStorageKey) ?? '[]'));
    } catch {
      return new Set<string>();
    }
  });
  const [typeFilter, setTypeFilter] = useState('全部类型');
  const [ownerFilter, setOwnerFilter] = useState('全部负责人');
  const [clientFilter, setClientFilter] = useState('全部客户');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minimumProgress, setMinimumProgress] = useState(0);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(() => new Set(['security-20260720']));
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const unreadNoticeCount = systemNotices.filter((notice) => !readNoticeIds.has(notice.id)).length;
  const allProjects = [
    ...prototypeProjects,
    ...projects.filter((project) => /^(proj|seed)-proj-/.test(project.id)),
  ];
  const activeProjects = allProjects.filter((project) => !archivedProjectIds.has(project.id));
  const today = new Date();
  const dueSoonCutoff = new Date(today);
  dueSoonCutoff.setDate(today.getDate() + 3);
  const isDueSoon = (project: ProjectData) => {
    if (!project.due || project.status === '已完成') return false;
    const dueDate = new Date(`${project.due}T23:59:59`);
    return dueDate >= today && dueDate <= dueSoonCutoff;
  };
  const completedProjects = activeProjects.filter((project) => project.status === '已完成');
  const inProgressProjects = activeProjects.filter((project) => project.status === '进行中');
  const pendingItemCount = activeProjects.reduce((sum, project) => sum + (project.todo ?? 0), 0);
  const dueSoonProjects = activeProjects.filter(isDueSoon);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const completedThisMonth = completedProjects.filter((project) => {
    if (!project.due) return false;
    const projectDate = new Date(`${project.due}T00:00:00`);
    return projectDate.getFullYear() === currentYear && projectDate.getMonth() === currentMonth;
  });
  const completedRatio = activeProjects.length === 0 ? 0 : (completedProjects.length / activeProjects.length) * 100;
  const inProgressRatio = activeProjects.length === 0 ? 0 : (inProgressProjects.length / activeProjects.length) * 100;

  useEffect(() => {
    if (!openProjectDetailId) return;
    const target = allProjects.find((project) => project.id === openProjectDetailId);
    if (target) setDetail(target);
    onProjectDetailOpened?.();
  }, [openProjectDetailId]);

  const visible = allProjects.filter((project) => {
    const displayStatus = project.status === '审核中' ? '待处理' : project.status;
    const isArchived = archivedProjectIds.has(project.id);
    const matchesActiveTab = tab === '全部项目'
      || (tab === '我的项目' && project.owner === '符金雨')
      || (tab === '我的关注' && favorites.has(project.id))
      || (tab === '待我处理' && project.status === '审核中')
      || (tab === '即将逾期' && isDueSoon(project))
      || (tab === '已完成' && project.status === '已完成');
    const matchesTab = tab === '归档' ? isArchived : !isArchived && matchesActiveTab;
    const searchText = `${project.name} ${project.id} ${project.client ?? ''} ${project.owner ?? ''}`.toLowerCase();
    return matchesTab
      && searchText.includes(query.trim().toLowerCase())
      && (statusFilter === '全部状态' || displayStatus === statusFilter)
      && (typeFilter === '全部类型' || project.projectType === typeFilter)
      && (ownerFilter === '全部负责人' || project.owner === ownerFilter)
      && (clientFilter === '全部客户' || project.client === clientFilter)
      && (!startDate || Boolean(project.due && project.due >= startDate))
      && (!endDate || Boolean(project.due && project.due <= endDate))
      && project.progress >= minimumProgress;
  });

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageProjects = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [tab, query, statusFilter, typeFilter, ownerFilter, clientFilter, startDate, endDate, minimumProgress]);

  useEffect(() => {
    sessionStorage.setItem('huaxiaoan-react-workbench', JSON.stringify({ tab, page: currentPage, isList }));
  }, [currentPage, isList, tab]);

  useEffect(() => {
    localStorage.setItem(projectFavoritesStorageKey, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(projectArchiveStorageKey, JSON.stringify([...archivedProjectIds]));
  }, [archivedProjectIds]);

  const toggleFavorite = (projectId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const confirmArchiveToggle = () => {
    if (!archiveTarget) return;
    setArchivedProjectIds((current) => {
      const next = new Set(current);
      if (next.has(archiveTarget.id)) next.delete(archiveTarget.id);
      else next.add(archiveTarget.id);
      return next;
    });
    setArchiveTarget(null);
  };

  const exportProjects = () => {
    const rows = [
      ['项目名称', '客户', '项目类型', '负责人', '进度', '待处理', '截止日期', '状态'],
      ...visible.map((project) => [project.name, project.client ?? '', project.projectType ?? '', project.owner ?? '', `${project.progress}%`, String(project.todo ?? 0), project.due ?? '', project.status === '审核中' ? '待处理' : project.status]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `华小安项目列表-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderStatus = (project: ProjectData) => {
    const displayStatus = project.status === '审核中' ? '待处理' : project.status;
    const tone = project.status === '已完成' ? 'bg-[#e4f7ec] text-[#159868]' : project.status === '审核中' ? 'bg-[#fff0dd] text-[#e48625]' : 'bg-[#eaf2ff] text-[#3572d6]';
    return <em className={`justify-self-start rounded-md px-1.5 py-1 text-[9px] font-black not-italic ${tone}`}>{displayStatus}</em>;
  };

  const renderTimeline = (project: ProjectData) => {
    const fallbackStage = Math.max(1, Math.round((project.progress / 100) * projectStageLabels.length));
    const currentStageIndex = project.status === '已完成'
      ? projectStageLabels.length
      : Math.min(projectStageLabels.length - 1, Math.max(0, (project.stage ?? fallbackStage) - 1));

    return <div className="flex w-full justify-between">{projectStageLabels.map((name, step) => <span key={name} className={`relative grid min-w-0 flex-1 grid-rows-[16px_auto] justify-items-center gap-1 text-center text-[7px] leading-[1.15] ${step === currentStageIndex ? 'font-bold text-[#356be7]' : 'text-[#97a4b6]'}`}>{step < projectStageLabels.length - 1 && <b aria-hidden="true" className={`absolute left-1/2 top-[7.5px] h-px w-full ${step < currentStageIndex ? 'bg-[#18b77b]' : 'bg-[#dce4ee]'}`} />}<i className={`relative z-10 block h-4 w-4 rounded-full border ${step < currentStageIndex ? 'border-[#18b77b] bg-[#18b77b]' : step === currentStageIndex ? 'border-[4px] border-[#356be7] bg-white' : 'border-[#cbd7e6] bg-white'}`} /><small title={name} className="min-h-[18px] max-w-[52px] text-[7px] leading-[1.15]">{getProjectStageLabelLines(name).map((line) => <span key={line} className="block whitespace-nowrap">{line}</span>)}</small></span>)}</div>;
  };

  return <>
    <div id="workbench-view-root" className="min-w-0 flex-1 overflow-y-auto bg-[#f7f8fc] p-4 select-none custom-scrollbar md:p-5 2xl:p-6">
      <header className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-baseline gap-5"><h1 className="text-[23px] font-black text-[#202d55]">工作台</h1><span className="text-xs font-bold text-[#76819c]">全部项目 <b className="text-[#5967b8]">{activeProjects.length.toLocaleString()}</b> 个</span></div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button type="button" onClick={onOpenTagSystem} className="flex h-9 items-center gap-2 rounded-lg border border-[#cfd9ea] bg-white px-3 text-[10px] font-black text-[#3d5f9f] hover:border-[#9eb2d8] hover:bg-[#f5f8ff]"><GitBranch className="h-3.5 w-3.5" />审计标注系统</button>
          <label className="compound-control flex h-9 w-full items-center gap-2 rounded-lg border border-[#dfe5f0] bg-white px-3 text-[#8492aa] sm:w-[345px]"><Search aria-hidden="true" className="h-4 w-4" /><input aria-label="搜索项目" name="project-search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-[#36496d] outline-none" placeholder="搜索项目名称、编号、客户、负责人…" /></label>
          <div className="relative">
            <button type="button" aria-label="系统通知" aria-expanded={isNoticeOpen} onClick={() => setIsNoticeOpen((open) => !open)} className={`relative grid h-9 w-9 place-items-center rounded-lg border bg-white text-[#60718c] ${isNoticeOpen ? 'border-[#9bb5ef] ring-2 ring-[#dce7ff]' : 'border-[#e0e6f0]'}`}><Bell className="h-4 w-4" />{unreadNoticeCount > 0 && <b className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#ed5263] px-1 text-[8px] text-white">{unreadNoticeCount}</b>}</button>
            {isNoticeOpen && <section aria-label="系统通知列表" className="absolute right-0 top-11 z-40 w-[390px] overflow-hidden rounded-lg border border-[#dce3ed] bg-white shadow-[0_8px_24px_rgba(34,52,78,.16)]">
              <header className="flex items-center justify-between border-b border-[#e8ecf2] px-4 py-3"><div><h2 className="text-sm font-black text-[#2c405c]">系统通知</h2><p className="mt-1 text-[10px] font-bold text-[#8b97a8]">{unreadNoticeCount > 0 ? `${unreadNoticeCount} 条未读` : '已全部阅读'}</p></div><div className="flex items-center gap-1"><button type="button" disabled={unreadNoticeCount === 0} onClick={() => setReadNoticeIds(new Set(systemNotices.map((notice) => notice.id)))} className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-black text-[#4169ce] hover:bg-[#f1f5ff] disabled:text-[#aab3c0]"><CheckCheck className="h-3.5 w-3.5" />全部已读</button><button type="button" aria-label="关闭系统通知" onClick={() => setIsNoticeOpen(false)} className="grid h-7 w-7 place-items-center rounded-md text-[#7b899d] hover:bg-[#f2f4f7]"><X className="h-3.5 w-3.5" /></button></div></header>
              <div>{systemNotices.map((notice) => { const isRead = readNoticeIds.has(notice.id); return <button type="button" key={notice.id} onClick={() => setReadNoticeIds((current) => new Set(current).add(notice.id))} className={`block min-h-[106px] w-full border-b border-[#edf0f4] px-4 py-4 text-left last:border-0 hover:bg-[#f4f6f9] ${isRead ? 'bg-white' : 'bg-[#f7f8fa]'}`}><span className="grid min-w-0 gap-2"><span className="flex h-5 items-center justify-between gap-3"><em className="rounded bg-[#eef1f5] px-1.5 py-0.5 text-[9px] font-black not-italic leading-5 text-[#667488]">{notice.type}</em><time className="text-[9px] font-bold leading-5 text-[#99a4b2]">{notice.time}</time></span><b className="block text-[12px] font-black leading-5 text-[#344a65]">{notice.title}</b><small className="block text-[10px] font-bold leading-4 text-[#7f8c9e]">{notice.detail}</small></span></button>; })}</div>
            </section>}
          </div>
          {onNewProject && <button id="btn-cpa-new-project" type="button" onClick={onNewProject} className="flex h-10 min-w-[140px] shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dcd4f5] bg-[#eeeafb] px-5 text-xs font-black text-[#0052d9] transition-colors hover:bg-[#e7e2f8] active:bg-[#ddd6f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9aceb] focus-visible:ring-offset-2"><Plus aria-hidden="true" className="h-[18px] w-[18px]" />新建项目</button>}
        </div>
      </header>

      <section className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{[
        [FileSpreadsheet, '全部项目', activeProjects.length.toLocaleString(), `当前显示 ${visible.length}`, 'bg-[#8165ed]'],
        [Clock, '进行中', inProgressProjects.length.toLocaleString(), `占比 ${inProgressRatio.toFixed(1)}%`, 'bg-[#2588eb]'],
        [Users, '待我处理', pendingItemCount.toLocaleString(), `涉及 ${activeProjects.filter((project) => (project.todo ?? 0) > 0).length} 个项目`, 'bg-[#ff972d]'],
        [Calendar, '即将逾期', dueSoonProjects.length.toLocaleString(), '3日内到期', 'bg-[#ef4d5b]'],
        [Check, '已完成', completedProjects.length.toLocaleString(), `占比 ${completedRatio.toFixed(1)}%`, 'bg-[#11bb78]'],
        [BarChart3, '本月完成', completedThisMonth.length.toLocaleString(), `${currentMonth + 1} 月完成`, 'bg-[#227ee6]'],
      ].map(([Icon, label, value, note, tone]) => { const MetricIcon = Icon as typeof FileText; return <article key={String(label)} className="flex items-center gap-3 rounded-xl border border-[#e1e6f0] bg-white p-3.5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${tone}`}><MetricIcon className="h-5 w-5" /></span><div><small className="block text-[11px] font-bold text-[#71809b]">{String(label)}</small><strong className="block text-xl font-black leading-tight text-[#273455]">{String(value)}</strong><em className="block text-[9px] font-bold not-italic text-[#8d99ad]">{String(note)}</em></div></article>; })}</section>

      <section className="project-overview-card overflow-hidden rounded-xl border border-[#dfe5ef] bg-white">
        <div className="flex gap-5 overflow-x-auto border-b border-[#e7ebf2] px-5">{['全部项目', '我的项目', '我的关注', '待我处理', '即将逾期', '已完成', '归档'].map((item) => <button type="button" key={item} onClick={() => setTab(item)} className={`h-11 shrink-0 border-b-2 px-0.5 text-xs font-bold ${tab === item ? 'border-[#416de4] text-[#2855bd]' : 'border-transparent text-[#74829c]'}`}>{item}</button>)}</div>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-[#e7ebf2] px-5 py-2.5">
          <select aria-label="项目状态" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-8 shrink-0 rounded-md border border-[#dde4ee] bg-white px-2 text-[11px] font-bold text-[#687994]"><option>全部状态</option><option>进行中</option><option>待处理</option><option>已完成</option></select>
          <select aria-label="项目类型" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-8 shrink-0 rounded-md border border-[#dde4ee] bg-white px-2 text-[11px] font-bold text-[#687994]"><option>全部类型</option>{['专项审计', '年报审计', '财务审计', '内部审计', '社保审计'].map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="负责人" value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} className="h-8 shrink-0 rounded-md border border-[#dde4ee] bg-white px-2 text-[11px] font-bold text-[#687994]"><option>全部负责人</option>{Array.from(new Set(allProjects.map((project) => project.owner).filter(Boolean))).map((value) => <option key={value}>{value}</option>)}</select>
          <select aria-label="客户" value={clientFilter} onChange={(event) => setClientFilter(event.target.value)} className="h-8 shrink-0 rounded-md border border-[#dde4ee] bg-white px-2 text-[11px] font-bold text-[#687994]"><option>全部客户</option>{Array.from(new Set(allProjects.map((project) => project.client).filter(Boolean))).map((value) => <option key={value}>{value}</option>)}</select>
          <label className="compound-control flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#dde4ee] bg-white px-2 text-[10px] font-bold text-[#687994]">开始时间<input aria-label="开始时间" name="project-start-date" autoComplete="off" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="bg-transparent text-[10px] outline-none" /></label>
          <label className="compound-control flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#dde4ee] bg-white px-2 text-[10px] font-bold text-[#687994]">截止时间<input aria-label="截止时间" name="project-end-date" autoComplete="off" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="bg-transparent text-[10px] outline-none" /></label>
          <button type="button" onClick={() => setShowMoreFilters((current) => !current)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-3 text-[11px] font-bold ${showMoreFilters ? 'border-[#b9caff] bg-[#f4f6ff] text-[#466ce0]' : 'border-[#dde4ee] bg-white text-[#687994]'}`}><SlidersHorizontal className="h-3.5 w-3.5" />更多筛选</button>
          <span className="flex-1" />
          <button type="button" aria-label="列表视图" onClick={() => setIsList(true)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border ${isList ? 'border-[#cdd9fb] bg-[#f4f6ff] text-[#4269dc]' : 'border-[#dde4ee] text-[#76849c]'}`}><List className="h-4 w-4" /></button>
          <button type="button" aria-label="网格视图" onClick={() => setIsList(false)} className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border ${!isList ? 'border-[#cdd9fb] bg-[#f4f6ff] text-[#4269dc]' : 'border-[#dde4ee] text-[#76849c]'}`}><Grid2X2 className="h-4 w-4" /></button>
          <button type="button" onClick={exportProjects} className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-[#b9caff] bg-white px-3 text-[11px] font-black text-[#466ce0]"><Upload className="h-3.5 w-3.5" />导出</button>
        </div>

        {showMoreFilters && <div className="flex items-center gap-3 border-b border-[#e7ebf2] bg-[#fafbfe] px-5 py-2.5"><label className="flex items-center gap-2 text-[10px] font-bold text-[#687994]">最低进度<input aria-label="最低进度" type="range" min="0" max="100" step="10" value={minimumProgress} onChange={(event) => setMinimumProgress(Number(event.target.value))} className="w-32 accent-[#416de4]" /><b className="w-8 text-[#416de4]">{minimumProgress}%</b></label><button type="button" onClick={() => { setStatusFilter('全部状态'); setTypeFilter('全部类型'); setOwnerFilter('全部负责人'); setClientFilter('全部客户'); setStartDate(''); setEndDate(''); setMinimumProgress(0); }} className="ml-auto text-[10px] font-black text-[#466ce0]">清除筛选</button></div>}

        {isList ? <div className="h-[736px] overflow-x-auto overflow-y-hidden">
          <div className="min-w-[1100px] xl:min-w-[1300px]">
            <div className="project-table-columns grid gap-3 bg-[#f7f9fc] px-5 py-3 text-[10px] font-bold text-[#8290a6]"><span className="pl-8">项目名称</span><span>客户</span><span>项目类型</span><span>项目负责人</span><span className="text-center">当前阶段</span><span>进度</span><span className="justify-self-center">待处理</span><span className="justify-self-center">截止日期</span><span className="justify-self-center">状态</span><span className="justify-self-center">操作</span></div>
            {pageProjects.map((project) => {
              const projectIndex = allProjects.findIndex((item) => item.id === project.id);
              const remainingDays = project.due ? Math.ceil((Date.parse(project.due) - Date.parse('2026-07-21')) / 86400000) : 0;
              return <div key={project.id} onClick={() => setDetail(project)} className="project-table-columns grid min-h-[78px] cursor-pointer items-center gap-3 border-t border-[#e9edf4] px-5 text-[10px] text-[#657691] hover:bg-[#fafcff]">
                <div className="flex min-w-0 items-center gap-2"><button type="button" aria-label={favorites.has(project.id) ? `取消收藏${project.name}` : `收藏${project.name}`} onClick={(event) => { event.stopPropagation(); toggleFavorite(project.id); }} className={favorites.has(project.id) ? 'text-[#f0a529]' : 'text-[#bcc7d8]'}><Star className="h-4 w-4" fill={favorites.has(project.id) ? 'currentColor' : 'none'} /></button><div className="min-w-0 text-left"><b className="block min-w-0 truncate text-[#375171]">{project.name}<small className="mt-1 block font-medium text-[#99a5b7]">PJ-2026-0623-{String(projectIndex + 1).padStart(3, '0')}</small></b></div></div>
                <span>{project.client ?? '待补充客户'}</span>
                <em className="justify-self-start rounded-md bg-[#eaf2ff] px-1.5 py-1 text-[9px] font-black not-italic text-[#3572d6]">{project.projectType ?? '专项审计'}</em>
                <span className="flex items-center gap-1.5"><b className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white bg-blue-100 text-[11px] font-bold text-[#0052d9] shadow-sm">{project.owner?.slice(0, 1) ?? project.logoChar}</b>{project.owner ?? '符金雨'}</span>
                {renderTimeline(project)}
                <div><b className="block text-[#324f74]">{project.progress}%</b><i className="mt-1 block h-1 w-14 overflow-hidden rounded bg-[#e2e8f2]"><b style={{ width: `${project.progress}%` }} className="block h-full rounded bg-[#285be0]" /></i></div>
                <b className={`justify-self-center ${(project.todo ?? 0) > 0 ? 'text-[#e44a55]' : ''}`}>{project.todo ?? 0} 项</b>
                <span className="justify-self-center text-center">{project.due ?? '待设置'}<small className="mt-1 block text-[#a1adbe]">{remainingDays >= 0 ? `剩余 ${remainingDays} 天` : `已逾期 ${Math.abs(remainingDays)} 天`}</small></span>
                <span className="justify-self-center">{renderStatus(project)}</span>
                <div className="flex items-center justify-self-center gap-1"><button type="button" onClick={(event) => { event.stopPropagation(); onOpenProject(project.id); }} className="h-7 min-w-[72px] whitespace-nowrap rounded-md border border-[#b5c8ff] px-2 text-[10px] font-black leading-none text-[#456de0]">进入项目群</button><button type="button" aria-label={`${project.name}${archivedProjectIds.has(project.id) ? '取消归档' : '归档'}`} title={archivedProjectIds.has(project.id) ? '取消归档' : '归档项目'} onClick={(event) => { event.stopPropagation(); setArchiveTarget(project); }} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#69778c] hover:bg-[#f0f3f8] hover:text-[#33445d]"><Archive className="h-3.5 w-3.5" /></button></div>
              </div>;
            })}
          </div>
        </div> : <div className="project-overview-grid grid gap-3 bg-[#f7f8fc] p-4">{pageProjects.map((project) => <article key={project.id} onClick={() => setDetail(project)} className="cursor-pointer rounded-lg border border-[#e0e6ef] bg-white p-4"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h3 className="truncate text-xs font-black text-[#375171]">{project.name}</h3><p className="mt-1 truncate text-[9px] font-bold text-[#91a0b3]">{project.client}</p></div><button type="button" aria-label={favorites.has(project.id) ? `取消收藏${project.name}` : `收藏${project.name}`} onClick={(event) => { event.stopPropagation(); toggleFavorite(project.id); }} className={favorites.has(project.id) ? 'text-[#f0a529]' : 'text-[#bcc7d8]'}><Star className="h-4 w-4" fill={favorites.has(project.id) ? 'currentColor' : 'none'} /></button></div><div className="mt-4 flex items-center justify-between text-[10px]"><span className="rounded-md bg-[#eaf2ff] px-2 py-1 font-black text-[#3572d6]">{project.projectType}</span>{renderStatus(project)}</div><div className="mt-4"><div className="flex justify-between text-[9px] font-bold text-[#71809b]"><span>项目进度</span><b>{project.progress}%</b></div><div className="mt-1.5 h-1.5 overflow-hidden rounded bg-[#e2e8f2]"><i className="block h-full rounded bg-[#285be0]" style={{ width: `${project.progress}%` }} /></div></div><button type="button" onClick={(event) => { event.stopPropagation(); onOpenProject(project.id); }} className="mt-4 h-8 w-full rounded-md border border-[#b5c8ff] text-[10px] font-black text-[#456de0]">进入项目群</button></article>)}</div>}

        {pageProjects.length === 0 && <div className="-mt-[736px] grid h-[736px] place-items-center text-xs font-bold text-[#8b98aa]">{tab === '我的关注' ? '暂无关注项目' : tab === '归档' ? '暂无归档项目' : '暂无项目'}</div>}

        <footer className="flex items-center justify-between gap-4 border-t border-[#e7ebf2] px-5 py-3 text-[11px] text-[#7688a3]"><span>共 {visible.length} 条</span><div className="flex items-center gap-1"><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid h-7 w-7 place-items-center disabled:opacity-30">‹</button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`grid h-7 w-7 place-items-center rounded-md ${currentPage === pageNumber ? 'bg-[#3867df] text-white' : 'text-[#687994]'}`}>{pageNumber}</button>)}<button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="grid h-7 w-7 place-items-center disabled:opacity-30">›</button></div><span>{pageSize} 条/页 · 第 {currentPage} 页</span></footer>
      </section>
    </div>

    {detail && <ProjectActionDrawer project={detail} actionState={actionStates[detail.id] ?? createProjectActionState()} onActionStateChange={(next) => setActionStates((current) => ({ ...current, [detail.id]: next }))} onClose={() => setDetail(null)} onEnterProject={() => onOpenProject(detail.id)} />}

    {archiveTarget && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#17213a]/45 p-4" onMouseDown={(event) => event.target === event.currentTarget && setArchiveTarget(null)}>
      <section role="dialog" aria-modal="true" aria-labelledby="archive-project-title" className="w-full max-w-[400px] rounded-xl bg-white p-5 shadow-xl">
        <div className="min-w-0"><h2 id="archive-project-title" className="text-sm font-black text-[#293e60]">{archivedProjectIds.has(archiveTarget.id) ? '是否取消归档该项目？' : '是否归档该项目？'}</h2><p className="mt-2 text-[11px] font-bold leading-relaxed text-[#7e8ca1]">{archiveTarget.name}</p></div>
        <footer className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setArchiveTarget(null)} className="h-8 rounded-md bg-[#f1f4f8] px-4 text-[10px] font-black text-[#65768d]">取消</button><button type="button" onClick={confirmArchiveToggle} className="h-8 rounded-md bg-[#195bd4] px-4 text-[10px] font-black text-white hover:bg-[#114fbf]">确定</button></footer>
      </section>
    </div>}
  </>;
}

export default function WorkbenchView({
  tasks,
  contracts,
  projects: propProjects,
  onOpenProject,
  onAuditTask,
  onNewProject,
  openProjectDetailId,
  onProjectDetailOpened,
  agentPanelOpen,
  onToggleAgentPanel,
}: WorkbenchViewProps) {
  // Local active project state initialized to "金利集团有限公司" (default matching screenshot)
  const [selectedProjId, setSelectedProjId] = useState('jinli-group');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [searchProjectQuery, setSearchProjectQuery] = useState('');

  // Local banners
  const [localBanner, setLocalBanner] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReceiptDetailModalOpen, setIsReceiptDetailModalOpen] = useState(false);
  const [isPaymentPlanModalOpen, setIsPaymentPlanModalOpen] = useState(false);
  const [financeInvoiceTarget, setFinanceInvoiceTarget] = useState<{ projectId: string; invoiceId: string; mode: 'review' | 'issue' } | null>(null);

  // Active interaction target data
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [approvalComment, setApprovalComment] = useState('经审核，金利集团一审合同内容合规，相关印章授权书完备，核对金额 ¥10,000,000.00 无误。同意流转至二审环节。');
  const [auditComment, setAuditComment] = useState('请重点核对应收账款披露金额，并补充期末收入确认的客户验收依据。');
  const [activeAuditIssue, setActiveAuditIssue] = useState(0);
  const [auditDocumentTab, setAuditDocumentTab] = useState<'report' | 'attachments' | 'history'>('report');
  const [auditReturnMode, setAuditReturnMode] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('10,000');
  const [receiptAmount, setReceiptAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState('2026-07-03');
  const [receiptNote, setReceiptNote] = useState('');
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>(['jinli-receipt-1']);
  const [invoiceAheadReason, setInvoiceAheadReason] = useState('客户付款流程要求先取得电子发票。');
  const [financeReviewComment, setFinanceReviewComment] = useState('申请信息与合同、收款记录一致，同意进入开票。');
  const [financeInvoiceNo, setFinanceInvoiceNo] = useState('');
  const [financeInvoiceFileName, setFinanceInvoiceFileName] = useState('');
  const [activeTimelineKind, setActiveTimelineKind] = useState<TimelineKind>('report');
  const [overviewPanel, setOverviewPanel] = useState<OverviewPanelKind | null>(null);
  const [financePanelView, setFinancePanelView] = useState<FinancePanelView>('receipt');
  const [selectedPlanProjectId, setSelectedPlanProjectId] = useState('jinli-group');
  const [selectedReceiptDetailProjectId, setSelectedReceiptDetailProjectId] = useState('jinli-group');
  const [pendingDeleteMilestoneId, setPendingDeleteMilestoneId] = useState<string | null>(null);
  const hrDataViews = [
    {
      id: 'roster',
      title: '花名册',
      subtitle: '表格视图 / 分 Sheet / 搜索筛选排序',
      icon: Users,
      count: '8 个 Sheet',
      stats: ['在册 86 人', '新增 3 人', '修改 5 人', '离职 2 人'],
      detail: '正式员工、试用期员工、实习生、离职人员分 Sheet 查看；点击人员可看详情，敏感字段按权限脱敏。',
    },
    {
      id: 'contract',
      title: '合同库',
      subtitle: '列表视图 / 原文 / 审查历史',
      icon: FileText,
      count: '124 份',
      stats: ['30 天到期 6 份', '待签署 3 份', '修订中 1 份'],
      detail: '支持按员工、合同类型、到期时间检索；点击查看合同原文、审查历史和续签记录。',
    },
    {
      id: 'template',
      title: '自查模板',
      subtitle: '预览下载 / 历史版本 / 字段映射',
      icon: FileSpreadsheet,
      count: '7 月版',
      stats: ['5 张附表', '2 个缺失字段', '1 个新字段'],
      detail: '模板字段可从花名册自动预填，无法自动判定项生成待办并进入待办提醒。',
    },
    {
      id: 'archive',
      title: '员工电子档案',
      subtitle: '人员 -> 材料类型 / OCR 归档',
      icon: Layers,
      count: '312 份材料',
      stats: ['合同 124 份', '证照 68 份', '学历材料 42 份'],
      detail: '按人员和材料类型归档合同、身份证明、学历证书、资格证书；查看下载均写入日志。',
    },
  ];
  const [activeHrDataViewId, setActiveHrDataViewId] = useState(hrDataViews[0].id);
  const [hrTodoItems, setHrTodoItems] = useState([
    { id: 'T-10', title: '李四-合同即将到期，剩余 30 天', type: '风险处理', source: 'OA 合同库到期', tag: '高风险', action: '发起续签' },
    { id: 'T-13', title: 'CPA 年检即将到期（4 人）', type: '证照处理', source: 'OA 证照库到期', tag: '批量待办', action: '查看清单' },
    { id: 'T-05', title: '张三-合同续签待确认', type: '流程处理', source: '合同到期 30 天', tag: '需确认', action: '确认采纳' },
    { id: 'T-02', title: '7 月自查报告待审核', type: '审核确认', source: 'Agent 生成自查', tag: '待审核', action: '确认提交' },
  ]);
  const [hrMessages, setHrMessages] = useState([
    { time: '15:30', category: '自查报告', text: '7 月自查报告已提交。提交时间: 2026-07-09 15:30。' },
    { time: '14:20', category: '花名册导入', text: '花名册（7 月版）导入存在数据冲突: 3 处不一致已生成待办。' },
    { time: '14:18', category: '花名册导入', text: '花名册（7 月版）已导入。变更: 新增 3 人，修改 5 人，离职 2 人。' },
    { time: '14:12', category: '知识库模板', text: '自查报告模板（7 月）已更新。新模板新增字段: 政治面貌。' },
    { time: '13:56', category: '敏感字段', text: '张三敏感字段已更新。变更: 基本工资。操作已记录审计日志。' },
  ]);
  const todoCategoryTags = ['全部', '审核确认', '文档处理', '流程处理', '证照处理', '风险处理', '异常核实', '文档导出'];
  const messageCategoryTags = ['全部', '入职归档', '花名册导入', '自查报告', '知识库模板', '敏感字段', '待办流转'];
  const [activeTodoCategory, setActiveTodoCategory] = useState('全部');
  const [activeMessageCategory, setActiveMessageCategory] = useState('全部');
  const previewSheets = {
    roster: {
      title: '花名册预览',
      subtitle: '员工基础信息 / 多 Sheet 合并视图',
      tabs: ['正式员工', '试用期员工', '实习生', '离职人员'],
      columns: ['姓名', '部门', '岗位', '入职日期', '合同状态', '更新'],
      rows: [
        ['张三', '审计一部', '高级审计员', '2024-03-18', '待续签', '基本工资'],
        ['李四', '综合管理部', '人事主管', '2023-09-05', '30 天到期', '合同期限'],
        ['王敏', '咨询事业部', '项目助理', '2026-07-01', '新签待归档', '新增人员'],
        ['陈晓', '审计二部', '审计员', '2025-11-12', '正常', '联系电话'],
      ],
    },
    contract: {
      title: '合同库预览',
      subtitle: '合同原文 / 审查历史 / 到期追踪',
      tabs: ['全部合同', '待签署', '即将到期', '审查历史'],
      columns: ['员工', '合同类型', '起止日期', '到期提醒', '审查状态', '归档'],
      rows: [
        ['李四', '劳动合同', '2023-08-01 至 2026-08-01', '剩余 30 天', '续签待确认', '已归档'],
        ['张三', '劳动合同', '2024-03-18 至 2027-03-17', '正常', '已审查', '已归档'],
        ['王敏', '实习协议', '2026-07-01 至 2026-12-31', '正常', '待签署', '待归档'],
        ['赵一', '补充协议', '2025-10-01 至 2027-09-30', '正常', '修订中', '待归档'],
      ],
    },
    template: {
      title: '自查模板预览',
      subtitle: '7 月版字段映射 / 附表填写状态',
      tabs: ['基础信息', '人员结构', '证照台账', '风险事项'],
      columns: ['附表', '字段', '来源数据', '填写状态', '待确认项', '更新时间'],
      rows: [
        ['表一', '人员总数', '花名册', '已预填', '0', '2026-07-09'],
        ['表二', '政治面貌', '花名册', '缺字段', '2', '2026-07-09'],
        ['表三', 'CPA 证照', '证照库', '已预填', '4', '2026-07-09'],
        ['表四', '社保缴纳', '社保记录', '待核实', '1', '2026-07-09'],
      ],
    },
    archive: {
      title: '员工电子档案预览',
      subtitle: '人员材料 / OCR 归档 / 审计日志',
      tabs: ['合同材料', '证照材料', '学历材料', '入职材料'],
      columns: ['员工', '材料类型', '文件名', 'OCR 状态', '权限', '最近访问'],
      rows: [
        ['张三', '劳动合同', '张三_劳动合同_2024.pdf', '已识别', '脱敏可见', '13:56'],
        ['李四', 'CPA 证书', '李四_CPA证书.jpg', '已识别', '授权可见', '14:02'],
        ['王敏', '入职材料', '王敏_入职登记表.pdf', '待复核', '仅人事', '14:18'],
        ['陈晓', '学历材料', '陈晓_学历证书.png', '已识别', '脱敏可见', '15:05'],
      ],
    },
  };

  // Hardcoded projects matching the screenshot and adding props projects to fallback
  const [workbenchProjects, setWorkbenchProjects] = useState<ProjectData[]>([
    {
      id: 'jinli-group',
      name: '金利集团有限公司',
      shortName: '金利集团...',
      logoChar: '金',
      status: '进行中',
      progress: 65,
      reportCount: '0/1',
      membersCount: 3,
      reportTimeline: buildReportTimeline(5),
      timeline: [
        { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'completed' },
        { nodeId: 2, title: '提交审核', role: '项目成员', status: 'completed' },
        { nodeId: 3, title: '合同一审', role: '部门经理', status: 'active' },
        { nodeId: 4, title: '合同二审', role: '张老师', status: 'pending' },
        { nodeId: 5, title: '打印合同', role: '项目成员', status: 'pending' },
        { nodeId: 6, title: '合同盖章', role: '行政', status: 'pending' },
        { nodeId: 7, title: '合同归档申请', role: '项目成员', status: 'pending' },
        { nodeId: 8, title: '合同归档审批', role: '部门经理', status: 'pending' },
        { nodeId: 9, title: '核对并归档', role: '行政', status: 'pending' },
      ]
    },
    {
      id: 'codex-e2e',
      name: 'Codex-E2E-CPA-20260623',
      shortName: 'Codex-E2E...',
      logoChar: 'C',
      status: '审核中',
      progress: 15,
      reportCount: '0/1',
      membersCount: 8,
      reportTimeline: buildReportTimeline(3),
      timeline: [
        { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'completed' },
        { nodeId: 2, title: '提交审核', role: '项目成员', status: 'completed' },
        { nodeId: 3, title: '合同一审', role: '部门经理', status: 'completed' },
        { nodeId: 4, title: '合同二审', role: '张老师', status: 'completed' },
        { nodeId: 5, title: '打印合同', role: '项目成员', status: 'completed' },
        { nodeId: 6, title: '合同盖章', role: '行政', status: 'active' },
        { nodeId: 7, title: '合同归档申请', role: '项目成员', status: 'pending' },
        { nodeId: 8, title: '合同归档审批', role: '部门经理', status: 'pending' },
        { nodeId: 9, title: '核对并归档', role: '行政', status: 'pending' },
      ]
    },
    {
      id: 'wls-3',
      name: 'wls测试3',
      shortName: 'wls测试3',
      logoChar: 'W',
      status: '进行中',
      progress: 75,
      reportCount: '1/2',
      membersCount: 5,
      reportTimeline: buildReportTimeline(6),
      timeline: [
        { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'completed' },
        { nodeId: 2, title: '提交审核', role: '项目成员', status: 'active' },
        { nodeId: 3, title: '合同一审', role: '部门经理', status: 'pending' },
        { nodeId: 4, title: '合同二审', role: '张老师', status: 'pending' },
        { nodeId: 5, title: '打印合同', role: '项目成员', status: 'pending' },
        { nodeId: 6, title: '合同盖章', role: '行政', status: 'pending' },
        { nodeId: 7, title: '合同归档申请', role: '项目成员', status: 'pending' },
        { nodeId: 8, title: '合同归档审批', role: '部门经理', status: 'pending' },
        { nodeId: 9, title: '核对并归档', role: '行政', status: 'pending' },
      ]
    },
    {
      id: 'wls-4',
      name: 'wls测试4',
      shortName: 'wls测试4',
      logoChar: 'W',
      status: '进行中',
      progress: 45,
      reportCount: '0/1',
      membersCount: 4,
      reportTimeline: buildReportTimeline(4),
      timeline: [
        { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'active' },
        { nodeId: 2, title: '提交审核', role: '项目成员', status: 'pending' },
        { nodeId: 3, title: '合同一审', role: '部门经理', status: 'pending' },
        { nodeId: 4, title: '合同二审', role: '张老师', status: 'pending' },
        { nodeId: 5, title: '打印合同', role: '项目成员', status: 'pending' },
        { nodeId: 6, title: '合同盖章', role: '行政', status: 'pending' },
        { nodeId: 7, title: '合同归档申请', role: '项目成员', status: 'pending' },
        { nodeId: 8, title: '合同归档审批', role: '部门经理', status: 'pending' },
        { nodeId: 9, title: '核对并归档', role: '行政', status: 'pending' },
      ]
    }
  ]);

  // Hardcoded initial tasks mapping to the layout in the screenshot
  const [workbenchTasks, setWorkbenchTasks] = useState([
    {
      id: 'wb-task-audit-1',
      title: '审核报告（三审）',
      projectName: '金利集团有限公司专项审计',
      projectId: 'jinli-group',
      tag: '报告三审',
      tag2: '高风险',
      type: 'audit',
      buttonText: '进入审核',
      isCompleted: false,
    },
    {
      id: 'wb-task-1',
      title: '修改并重新提交报告：1',
      projectName: '金利集团有限公司',
      projectId: 'jinli-group',
      tag: '提交报告',
      type: 'upload',
      buttonText: '上传报告',
      isCompleted: false,
    },
    {
      id: 'wb-task-2',
      title: '1', // Title is literally '1' matching the screenshot contract step approval name
      projectName: '金利集团有限公司',
      projectId: 'jinli-group',
      tag: '合同一审',
      tag2: '需确认',
      type: 'approve',
      buttonText: '审批合同',
      isCompleted: false,
    },
    {
      id: 'wb-task-3',
      title: '上传盖章合同扫描件',
      projectName: 'Codex-E2E-CPA-20260623',
      projectId: 'codex-e2e',
      tag: '合同盖章',
      type: 'upload',
      buttonText: '上传盖章件',
      isCompleted: false,
    },
    {
      id: 'wb-task-4',
      title: '补充一审工作底稿',
      projectName: 'wls测试3',
      projectId: 'wls-3',
      tag: '提交审核',
      type: 'upload',
      buttonText: '上传底稿',
      isCompleted: false,
    },
    {
      id: 'wb-task-hr-1',
      title: '确认 30 天内合同到期人员',
      projectName: '行政人事管理',
      projectId: 'hr-agent',
      tag: '人事助手',
      tag2: '需确认',
      type: 'agent',
      buttonText: '进入处理',
      isCompleted: false,
    },
    {
      id: 'wb-task-hr-2',
      title: '监管自查报告基础信息缺失项确认',
      projectName: '行政人事管理',
      projectId: 'hr-agent',
      tag: '自查报告',
      tag2: '待确认',
      type: 'agent',
      buttonText: '进入处理',
      isCompleted: false,
    }
  ]);

  // Contracts Table Data (with interactive payments and invoicing!)
  const [workbenchContracts, setWorkbenchContracts] = useState<WorkbenchContract[]>([
    {
      id: 'wc-1',
      projectName: '金利集团有限公司',
      projectId: 'jinli-group',
      signDate: '2026-06-25',
      amount: '¥ 10,000,000',
      numericAmount: 10000000,
      received: '¥ 3,000,000',
      numericReceived: 3000000,
      pending: '¥ 7,000,000',
      numericPending: 7000000,
      invoiced: '—',
      numericInvoiced: 0,
      paymentPlan: [
        { id: 'jinli-pay-1', name: '签约款', condition: '合同签订后 5 个工作日', dueDate: '2026-07-05', amount: 5000000, received: 3000000 },
        { id: 'jinli-pay-2', name: '出具前款', condition: '正式报告出具前', dueDate: '2026-07-20', amount: 4000000, received: 0 },
        { id: 'jinli-pay-3', name: '尾款', condition: '项目归档后 10 个工作日', dueDate: '2026-08-10', amount: 1000000, received: 0 },
      ],
      receiptRecords: [
        { id: 'jinli-receipt-1', date: '2026-07-01', amount: 3000000, milestoneId: 'jinli-pay-1', payer: '金利集团有限公司', serialNo: 'BK20260701008', allocatedAmount: 3000000 },
      ],
      invoiceRecords: [],
    },
    {
      id: 'wc-2',
      projectName: 'Codex-E2E-CPA-20260623',
      projectId: 'codex-e2e',
      signDate: '2026-06-23',
      amount: '¥ 1,000',
      numericAmount: 1000,
      received: '—',
      numericReceived: 0,
      pending: '¥ 1,000',
      numericPending: 1000,
      invoiced: '—',
      numericInvoiced: 0,
      paymentPlan: [],
      receiptRecords: [],
      invoiceRecords: [],
    },
    {
      id: 'wc-3',
      projectName: 'wls测试4',
      projectId: 'wls-4',
      signDate: '2026-06-20',
      amount: '¥ 20,000',
      numericAmount: 20000,
      received: '—',
      numericReceived: 0,
      pending: '¥ 20,000',
      numericPending: 20000,
      invoiced: '—',
      numericInvoiced: 0,
      paymentPlan: [],
      receiptRecords: [],
      invoiceRecords: [],
    },
    {
      id: 'wc-4',
      projectName: 'wls测试项目2',
      projectId: 'wls-2',
      signDate: '2026-06-18',
      amount: '¥ 20,000',
      numericAmount: 20000,
      received: '—',
      numericReceived: 0,
      pending: '¥ 20,000',
      numericPending: 20000,
      invoiced: '—',
      numericInvoiced: 0,
      paymentPlan: [],
      receiptRecords: [],
      invoiceRecords: [],
    }
  ]);

  // Selected node detailed view within the active project timeline
  const [selectedTimelineNode, setSelectedTimelineNode] = useState<TimelineNode | null>(null);

  // Trigger local banner
  const triggerBanner = (text: string, type: 'success' | 'info' = 'success') => {
    setLocalBanner({ text, type });
    setTimeout(() => {
      setLocalBanner(null);
    }, 4500);
  };

  const activeProj = workbenchProjects.find(p => p.id === selectedProjId) || workbenchProjects[0];
  const activeContract = workbenchContracts.find(c => c.projectId === selectedProjId) || workbenchContracts[0];
  const activeTimelineNodes = activeTimelineKind === 'contract' ? activeProj.timeline : activeProj.reportTimeline;
  const activeTimelineTitle = activeTimelineKind === 'report' ? '报告主链路' : activeTimelineKind === 'parallel' ? '打印赋码版后并行' : activeTimelineKind === 'auditProgress' ? '被审计单位 / 报告进度' : activeTimelineKind === 'contractFinance' ? '合同 & 收款 & 开票' : '合同链路';
  
  // Right-side overview cards show all projects. Only the report progress panel follows selectedProjId.
  const pendingTasks = workbenchTasks.filter(t => !t.isCompleted);
  const pendingUploadTasks = pendingTasks.filter(t => t.type === 'upload');
  const pendingApproveTasks = pendingTasks.filter(t => t.type === 'approve');
  const pendingAgentTasks = pendingTasks.filter(t => t.type === 'agent');

  const getProjectTasks = (projectId: string) => workbenchTasks.filter(task => task.projectId === projectId && !task.isCompleted);
  const getProjectContract = (projectId: string) => workbenchContracts.find(contract => contract.projectId === projectId);
  const getNextReceivable = (contract: WorkbenchContract) => (
    contract.paymentPlan.find(milestone => milestone.received < milestone.amount) || contract.paymentPlan[0]
  );
  const selectedPlanContract = workbenchContracts.find(contract => contract.projectId === selectedPlanProjectId) || activeContract;
  const pendingDeleteMilestone = selectedPlanContract.paymentPlan.find(milestone => milestone.id === pendingDeleteMilestoneId);
  const selectedReceiptDetailContract = workbenchContracts.find(contract => contract.projectId === selectedReceiptDetailProjectId) || activeContract;
  const financeInvoiceContract = financeInvoiceTarget
    ? workbenchContracts.find(contract => contract.projectId === financeInvoiceTarget.projectId)
    : undefined;
  const financeInvoiceRecord = financeInvoiceContract && financeInvoiceTarget
    ? financeInvoiceContract.invoiceRecords.find(record => record.id === financeInvoiceTarget.invoiceId)
    : undefined;
  const invoiceLinkedAmount = activeContract.receiptRecords
    .filter(record => selectedReceiptIds.includes(record.id))
    .reduce((sum, record) => sum + record.amount, 0);
  const invoiceRiskAmount = Math.max(0, parseFloat(invoiceAmount.replace(/,/g, '')) - invoiceLinkedAmount || 0);
  const openProjectDetail = (projectId: string) => {
    setSelectedProjId(projectId);
    setSelectedTimelineNode(null);
    setOverviewPanel(null);
    setIsDrawerOpen(true);
  };

  const openInvoiceModal = (contract: WorkbenchContract) => {
    setSelectedProjId(contract.projectId);
    const selectableReceiptIds = contract.receiptRecords.map(record => record.id);
    const defaultAmount = contract.receiptRecords.reduce((sum, record) => sum + record.amount, 0) || getNextReceivable(contract)?.amount || 0;
    setSelectedReceiptIds(selectableReceiptIds);
    setInvoiceAmount(defaultAmount ? defaultAmount.toLocaleString() : '');
    setIsInvoiceModalOpen(true);
  };

  const openFinanceInvoiceAction = (contract: WorkbenchContract, invoice: InvoiceRecord, mode: 'review' | 'issue') => {
    setSelectedProjId(contract.projectId);
    setFinanceReviewComment(invoice.reviewComment || '申请信息与合同、收款记录一致，同意进入开票。');
    setFinanceInvoiceNo(invoice.invoiceNo || `FP${Date.now().toString().slice(-10)}`);
    setFinanceInvoiceFileName(invoice.invoiceFileName || `${contract.projectName}-电子发票.pdf`);
    setFinanceInvoiceTarget({ projectId: contract.projectId, invoiceId: invoice.id, mode });
  };

  const openReceiptModal = (contract: WorkbenchContract) => {
    setSelectedProjId(contract.projectId);
    setReceiptAmount('');
    setReceiptDate('2026-07-03');
    setReceiptNote('');
    setIsReceiptModalOpen(true);
  };

  const openReceiptDetailModal = (contract: WorkbenchContract) => {
    setSelectedReceiptDetailProjectId(contract.projectId);
    setIsReceiptDetailModalOpen(true);
  };

  const openPaymentPlanModal = (contract: WorkbenchContract) => {
    setSelectedPlanProjectId(contract.projectId);
    setPendingDeleteMilestoneId(null);
    setIsPaymentPlanModalOpen(true);
  };

  const handleCreatePaymentMilestone = () => {
    setWorkbenchContracts(prev => prev.map(contract => {
      if (contract.projectId !== selectedPlanProjectId) return contract;
      return {
        ...contract,
        paymentPlan: [
          ...contract.paymentPlan,
          {
            id: `${contract.projectId}-pay-${Date.now()}`,
            name: '',
            condition: '',
            dueDate: '',
            amount: 0,
            received: 0,
          },
        ],
      };
    }));

    triggerBanner('已新增空白收款节点，请在列表中补充信息。', 'info');
  };

  const handleUpdatePaymentMilestone = (milestoneId: string, patch: Partial<PaymentMilestone>) => {
    setWorkbenchContracts(prev => prev.map(contract => {
      if (contract.projectId !== selectedPlanProjectId) return contract;
      return {
        ...contract,
        paymentPlan: contract.paymentPlan.map(milestone => (
          milestone.id === milestoneId ? { ...milestone, ...patch } : milestone
        )),
      };
    }));
  };

  const handleDeletePaymentMilestone = (milestoneId: string) => {
    const milestoneName = selectedPlanContract.paymentPlan.find(milestone => milestone.id === milestoneId)?.name || '该节点';

    setWorkbenchContracts(prev => prev.map(contract => {
      if (contract.projectId !== selectedPlanProjectId) return contract;
      return {
        ...contract,
        paymentPlan: contract.paymentPlan.filter(milestone => milestone.id !== milestoneId),
      };
    }));

    triggerBanner(`已删除收款节点：${milestoneName}。`, 'info');
    setPendingDeleteMilestoneId(null);
  };

  const openTaskAction = (task: typeof workbenchTasks[number]) => {
    setSelectedTaskForModal(task);
    setOverviewPanel(null);
    setAuditReturnMode(false);
    setActiveAuditIssue(0);
    setAuditDocumentTab('report');
    if (task.type === 'agent') {
      triggerBanner(`已定位到人事管理助手待办：${task.title}。`, 'info');
      return;
    }
    if (task.type === 'upload') {
      setIsUploadModalOpen(true);
      return;
    }
    setIsApprovalModalOpen(true);
  };

  const overviewTitleMap: Record<OverviewPanelKind, { title: string; subtitle: string }> = {
    projects: {
      title: '全部项目 & 报告进度',
      subtitle: '查看所有项目的报告数量、进度、当前节点和待办概览。',
    },
    tasks: {
      title: '全部待我处理',
      subtitle: '按项目汇总当前需要您处理的上传、审批和确认事项。',
    },
    dynamics: {
      title: '全部今日动态',
      subtitle: '按项目查看今日状态、报告进度和最新待办变化。',
    },
    contracts: {
      title: '全部合同 & 收款 & 开票',
      subtitle: '查看所有项目的合同金额、收款、未收款和开票情况。',
    },
  };

  // Upload simulation handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadingFile(e.dataTransfer.files[0]);
      simulateUpload();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingFile(e.target.files[0]);
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploadProgress(1);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25) + 5;
      });
    }, 200);
  };

  const completeUploadTask = () => {
    if (!selectedTaskForModal) return;
    
    // Complete task
    setWorkbenchTasks(prev => prev.map(t => t.id === selectedTaskForModal.id ? { ...t, isCompleted: true } : t));
    
    // If the task was for "修改并重新提交报告：1", update "我" section too
    triggerBanner(`文件【${uploadingFile?.name || '审计合规报告.pdf'}】上传成功！已完成该提交任务。`, 'success');
    
    // Clear modals
    setIsUploadModalOpen(false);
    setUploadingFile(null);
    setUploadProgress(0);
    setSelectedTaskForModal(null);
  };

  // Approval handler
  const handleApproveContract = () => {
    if (!selectedTaskForModal) return;

    // Complete approval task
    setWorkbenchTasks(prev => prev.map(t => t.id === selectedTaskForModal.id ? { ...t, isCompleted: true } : t));

    // Update the project's timeline node from node 3 to node 4
    setWorkbenchProjects(prevProjects => prevProjects.map(p => {
      if (p.id !== selectedTaskForModal.projectId) return p;
      return {
        ...p,
        timeline: p.timeline.map(node => {
          if (node.nodeId === 3) return { ...node, status: 'completed' as const };
          if (node.nodeId === 4) return { ...node, status: 'active' as const };
          return node;
        })
      };
    }));

    triggerBanner(`合同已成功通过一审，现已流转到下一节点【合同二审】！`, 'success');
    setIsApprovalModalOpen(false);
    setSelectedTaskForModal(null);
  };

  const handleApproveAudit = () => {
    if (!selectedTaskForModal) return;
    setWorkbenchTasks(prev => prev.map(task => task.id === selectedTaskForModal.id ? { ...task, isCompleted: true } : task));
    triggerBanner('报告三审已通过，任务已流转至【上传报备信息表】。', 'success');
    setIsApprovalModalOpen(false);
    setSelectedTaskForModal(null);
    setAuditReturnMode(false);
  };

  // Receipt and Invoicing Updates
  const handleApplyInvoice = () => {
    const amountNum = parseFloat(invoiceAmount.replace(/,/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) return;
    const currentLinkedReceiptIds = activeContract.receiptRecords
      .filter(record => selectedReceiptIds.includes(record.id))
      .map(record => record.id);
    const linkedAmount = activeContract.receiptRecords
      .filter(record => currentLinkedReceiptIds.includes(record.id))
      .reduce((sum, record) => sum + record.amount, 0);
    const riskAmount = Math.max(0, amountNum - linkedAmount);

    setWorkbenchContracts(prev => prev.map(c => {
      if (c.projectId !== selectedProjId) return c;
      return {
        ...c,
        invoiceRecords: [
          ...c.invoiceRecords,
          {
            id: `invoice-${Date.now()}`,
            date: new Date().toLocaleDateString('en-CA'),
            amount: amountNum,
            linkedReceiptIds: currentLinkedReceiptIds,
            status: '待财务审核',
            applicant: '汪欣',
            reviewComment: riskAmount > 0 ? `先票后款金额 ${formatCurrency(riskAmount)}：${invoiceAheadReason}` : undefined,
          },
        ],
      };
    }));

    triggerBanner(riskAmount > 0
      ? `已提交开票申请：¥ ${amountNum.toLocaleString()}，其中 ¥ ${riskAmount.toLocaleString()} 为先票后款风险。`
      : `已提交开票申请：¥ ${amountNum.toLocaleString()}，已关联到账记录并通知财务审核。`, 'success');
    setIsInvoiceModalOpen(false);
  };

  const handleReviewInvoice = (approved: boolean) => {
    if (!financeInvoiceTarget || !financeInvoiceRecord) return;
    setWorkbenchContracts(prev => prev.map(contract => {
      if (contract.projectId !== financeInvoiceTarget.projectId) return contract;
      return {
        ...contract,
        invoiceRecords: contract.invoiceRecords.map(record => record.id === financeInvoiceTarget.invoiceId ? {
          ...record,
          status: approved ? '待开票' : '已退回',
          reviewComment: financeReviewComment,
        } : record),
      };
    }));
    triggerBanner(approved
      ? `开票申请已通过财务审核，进入待开票：${formatCurrency(financeInvoiceRecord.amount)}。`
      : `开票申请已退回项目负责人补充：${financeReviewComment || '请补充申请资料'}。`, approved ? 'success' : 'info');
    setFinanceInvoiceTarget(null);
  };

  const handleCompleteInvoice = () => {
    if (!financeInvoiceTarget || !financeInvoiceRecord || !financeInvoiceNo.trim() || !financeInvoiceFileName.trim()) return;
    setWorkbenchContracts(prev => prev.map(contract => {
      if (contract.projectId !== financeInvoiceTarget.projectId) return contract;
      const target = contract.invoiceRecords.find(record => record.id === financeInvoiceTarget.invoiceId);
      if (!target || target.status !== '待开票') return contract;
      const linkedAmount = contract.receiptRecords
        .filter(receipt => target.linkedReceiptIds.includes(receipt.id))
        .reduce((sum, receipt) => sum + receipt.amount, 0);
      const newInvoicedAmount = contract.numericInvoiced + target.amount;
      return {
        ...contract,
        numericInvoiced: newInvoicedAmount,
        invoiced: formatCurrency(newInvoicedAmount),
        invoiceRecords: contract.invoiceRecords.map(record => record.id === target.id ? {
          ...record,
          status: target.amount > linkedAmount ? '已开票未收款' : '已开票',
          invoiceNo: financeInvoiceNo.trim(),
          invoiceFileName: financeInvoiceFileName.trim(),
        } : record),
      };
    }));
    triggerBanner(`发票 ${financeInvoiceNo.trim()} 已上传，${formatCurrency(financeInvoiceRecord.amount)} 已回写项目开票台账。`, 'success');
    setFinanceInvoiceTarget(null);
  };

  const handleApplyReceipt = () => {
    const amountNum = parseFloat(receiptAmount.replace(/,/g, ''));
    if (isNaN(amountNum) || amountNum <= 0) return;

    setWorkbenchContracts(prev => prev.map(c => {
      if (c.projectId !== selectedProjId) return c;
      const newReceivedNum = c.numericReceived + amountNum;
      const newPendingNum = Math.max(0, c.numericAmount - newReceivedNum);
      return {
        ...c,
        numericReceived: newReceivedNum,
        numericPending: newPendingNum,
        received: `¥ ${newReceivedNum.toLocaleString()}`,
        pending: newPendingNum === 0 ? '已结清' : `¥ ${newPendingNum.toLocaleString()}`,
        receiptRecords: [
          ...c.receiptRecords,
          {
            id: `receipt-${Date.now()}`,
            date: receiptDate,
            amount: amountNum,
            milestoneId: '',
            payer: c.projectName,
            serialNo: `BK${Date.now().toString().slice(-8)}`,
            allocatedAmount: amountNum,
            note: receiptNote,
          },
        ],
      };
    }));

    triggerBanner(`已登记：¥ ${amountNum.toLocaleString()}，到账日期 ${receiptDate}。`, 'success');
    setIsReceiptModalOpen(false);
  };

  const activeHrDataView = hrDataViews.find(item => item.id === activeHrDataViewId) || hrDataViews[0];
  const filteredHrTodoItems = activeTodoCategory === '全部'
    ? hrTodoItems
    : hrTodoItems.filter(item => item.type === activeTodoCategory);
  const filteredHrMessages = activeMessageCategory === '全部'
    ? hrMessages
    : hrMessages.filter(item => item.category === activeMessageCategory);
  const activePreviewSheet = previewSheets[activeHrDataView.id as keyof typeof previewSheets] || previewSheets.roster;
  const closeHrTodo = (todoId: string, ignored = false) => {
    const todo = hrTodoItems.find(item => item.id === todoId);
    if (!todo) return;
    setHrTodoItems(prev => prev.filter(item => item.id !== todoId));
    setHrMessages(prev => [
      {
        time: '刚刚',
        category: '待办流转',
        text: ignored
          ? `${todo.title} 已忽略，忽略原因和操作人已写入统一审计日志。`
          : `${todo.title} 已处理完成，待办状态已同步至 Agent 入口。`,
      },
      ...prev,
    ]);
  };

  const overviewProjects = [
    ...workbenchProjects,
    ...propProjects
      .filter((project) => !workbenchProjects.some((item) => item.id === project.id))
      .map((project) => ({
        id: project.id,
        name: project.name,
        shortName: project.name,
        logoChar: project.name.slice(0, 1).toUpperCase(),
        status: project.status,
        progress: project.progress,
        reportCount: project.reportCount,
        membersCount: project.membersCount,
        reportTimeline: buildReportTimeline(Math.min(8, Math.max(1, Math.round(project.progress / 12.5)))),
        timeline: [
          { nodeId: 1, title: '拟合同上传', role: '项目经理', status: 'active' as const },
          { nodeId: 2, title: '提交审核', role: '项目成员', status: 'pending' as const },
          { nodeId: 3, title: '合同一审', role: '部门经理', status: 'pending' as const },
        ],
      })),
  ];

  return <AuditTagSystemView agentPanelOpen={agentPanelOpen} onToggleAgentPanel={onToggleAgentPanel} />;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5 select-none relative" id="workbench-view-root">
      <AnimatePresence>
        {localBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4"
          >
            <div className="bg-gray-900 border border-gray-800 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{localBanner.text}</span>
              </div>
              <button onClick={() => setLocalBanner(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-5 items-stretch">
        <section className="col-span-12 lg:col-span-4 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col h-[690px] shadow-xs overflow-hidden">
          <div className="-mx-3.5 -mt-3.5 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                <FileSpreadsheet className="w-4.5 h-4.5 text-[#4f68c8]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-[#24315f] leading-none">数据查看</span>
                <span className="text-[9px] text-[#8c91aa] font-bold mt-1">花名册、合同库、自查模板、员工电子档案</span>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-[#0052d9] text-[9px] font-black">4 类数据</span>
          </div>

          <div className="space-y-2.5">
            {hrDataViews.map(item => {
              const Icon = item.icon;
              const active = item.id === activeHrDataView.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveHrDataViewId(item.id)}
                  className={`w-full p-3 rounded-xl border flex items-start gap-3 text-left transition-all ${
                    active ? 'bg-blue-50/80 border-blue-100/80 shadow-xs' : 'bg-gray-50 hover:bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${active ? 'bg-white text-[#0052d9] border-blue-100' : 'bg-white text-gray-500 border-gray-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-gray-800 truncate">{item.title}</span>
                      <span className="shrink-0 px-1.5 py-0.5 bg-white border border-gray-100 rounded text-[8px] font-black text-gray-500">{item.count}</span>
                    </div>
                    <p className="mt-1 text-[9px] text-gray-400 font-bold truncate">{item.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50/90 border border-gray-100 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-500">{activeHrDataView.title}概览</span>
              <button className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px]">查看</button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {activeHrDataView.stats.map(stat => (
                <div key={stat} className="rounded-lg bg-white border border-gray-100 px-2.5 py-2 text-[10px] font-black text-gray-700">
                  {stat}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed font-bold text-gray-500">{activeHrDataView.detail}</p>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-5 bg-white border border-[#dfe2ed]/60 rounded-2xl p-4 shadow-xs overflow-hidden flex flex-col h-[690px]">
          <div className="-mx-4 -mt-4 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                <AlertCircle className="w-4.5 h-4.5 text-[#4f68c8]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[#24315f] leading-none">待办提醒</span>
                  <span className="w-4.5 h-4.5 rounded-full bg-[#e8e0ff] text-[#5f62b8] flex items-center justify-center text-[9px] font-black">{hrTodoItems.length}</span>
                </div>
                <span className="text-[9px] text-[#8c91aa] font-bold mt-1">高风险置顶、批量待办、双入口同步</span>
              </div>
            </div>
            <button className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5">
              <span>全部</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5 shrink-0">
            {todoCategoryTags.map(tag => {
              const active = activeTodoCategory === tag;
              const count = tag === '全部' ? hrTodoItems.length : hrTodoItems.filter(item => item.type === tag).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTodoCategory(tag)}
                  className={`h-6 rounded-lg border px-2 text-[9px] font-black transition-all ${active ? 'bg-[#0052d9] text-white border-[#0052d9] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200 hover:text-[#0052d9]'}`}
                >
                  {tag}
                  <span className={`ml-1 ${active ? 'text-white/75' : 'text-gray-300'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3.5 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 min-h-0 flex-1">
            {filteredHrTodoItems.length === 0 ? (
              <ReadyEmptyState message="当前分类下暂无人事待办。" />
            ) : filteredHrTodoItems.map(todo => (
              <div key={todo.id} className="p-2.5 bg-gray-50 hover:bg-[#f8f9ff]/50 border border-gray-100/80 rounded-xl flex flex-row items-center justify-between gap-3.5 transition-all">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-800 truncate leading-snug">{todo.title}</span>
                    <span className="px-1.5 py-0.2 bg-white text-gray-400 border border-gray-100 rounded text-[8px] font-black whitespace-nowrap">{todo.id}</span>
                    <span className="px-1.5 py-0.2 bg-indigo-50 text-[#5f62b8] border border-indigo-100 rounded text-[8px] font-black whitespace-nowrap">{todo.type}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[8px] font-black whitespace-nowrap ${todo.tag === '高风险' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-gray-200/60 text-gray-500 border border-transparent'}`}>{todo.tag}</span>
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold truncate">{todo.type} · {todo.source}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {todo.tag === '高风险' && (
                    <button onClick={() => closeHrTodo(todo.id, true)} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-bold text-[10px] transition-all whitespace-nowrap">
                      忽略
                    </button>
                  )}
                  <button onClick={() => closeHrTodo(todo.id)} className="px-3 py-1 bg-[#0052d9] text-white hover:bg-blue-700 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm shadow-blue-500/20 whitespace-nowrap">
                    <span>{todo.action}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="col-span-12 lg:col-span-3 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col h-[690px] shadow-xs overflow-hidden">
          <div className="-mx-3.5 -mt-3.5 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-4 py-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                <Calendar className="w-4 h-4 text-[#4f68c8]" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-[#24315f] leading-none truncate">消息动态</span>
                <span className="text-[9px] text-[#8c91aa] font-bold mt-1 truncate">过程结果与同步日志</span>
              </div>
            </div>
            <button className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 shrink-0">
              <span>全部</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5 shrink-0">
            {messageCategoryTags.map(tag => {
              const active = activeMessageCategory === tag;
              const count = tag === '全部' ? hrMessages.length : hrMessages.filter(item => item.category === tag).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveMessageCategory(tag)}
                  className={`h-6 rounded-lg border px-2 text-[9px] font-black transition-all ${active ? 'bg-[#0052d9] text-white border-[#0052d9] shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200 hover:text-[#0052d9]'}`}
                >
                  {tag}
                  <span className={`ml-1 ${active ? 'text-white/75' : 'text-gray-300'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 space-y-4">
            <div className="space-y-4 relative pl-8 pt-1 pb-3">
              <div className="absolute left-[13px] top-3 bottom-3 w-[1px] bg-gray-100" />
              {filteredHrMessages.length === 0 ? (
                <div className="-ml-8 pt-8">
                  <ReadyEmptyState message="当前分类下暂无消息动态。" />
                </div>
              ) : filteredHrMessages.map(item => (
                <div key={`${item.time}-${item.text}`} className="relative flex items-start gap-2.5 min-w-0">
                  <div className="absolute -left-[27px] w-5.5 h-5.5 rounded-full bg-blue-50 border border-blue-100/40 flex items-center justify-center shrink-0 z-10 shadow-xs">
                    <Bell className="w-3 h-3 text-[#0052d9]" />
                  </div>
                  <div className="min-w-0 flex-1 leading-normal">
                    <span className="inline-flex mb-1 rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[8px] font-black text-[#5f62b8]">
                      {item.category}
                    </span>
                    <div className="text-[10px] font-extrabold text-gray-800 leading-snug">{item.text}</div>
                    <span className="text-[8px] text-gray-400 font-bold block mt-0.5">{item.time} · 人事工作台</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-white border border-[#dfe2ed]/60 rounded-2xl p-4 shadow-xs overflow-hidden">
        <div className="-mx-4 -mt-4 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
              <FileSpreadsheet className="w-4.5 h-4.5 text-[#4f68c8]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-[#24315f] leading-none">视图预览</span>
              <span className="text-[9px] text-[#8c91aa] font-bold mt-1">{activePreviewSheet.title} · 类 Excel 面板</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-7 px-2.5 rounded-lg bg-white border border-gray-100 text-[10px] font-black text-gray-500 hover:text-[#0052d9] hover:border-blue-100 transition-all">
              筛选
            </button>
            <button className="h-7 px-2.5 rounded-lg bg-[#0052d9] text-white text-[10px] font-black shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all">
              打开完整视图
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-gray-100 bg-white">
            <div className="min-w-0">
              <div className="text-xs font-black text-gray-800 truncate">{activePreviewSheet.title}</div>
              <div className="text-[9px] font-bold text-gray-400 mt-0.5 truncate">{activePreviewSheet.subtitle}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activePreviewSheet.tabs.map((tab, index) => (
                <button
                  key={tab}
                  className={`h-6 px-2 rounded-lg border text-[9px] font-black transition-all ${
                    index === 0 ? 'bg-[#0052d9] text-white border-[#0052d9]' : 'bg-white text-gray-500 border-gray-200 hover:text-[#0052d9] hover:border-blue-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full min-w-[820px] border-collapse bg-white">
              <thead>
                <tr className="bg-[#f8f9ff] border-b border-gray-100">
                  {activePreviewSheet.columns.map(column => (
                    <th key={column} className="px-3 py-2.5 text-left text-[9px] font-black text-gray-400 whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activePreviewSheet.rows.map((row, rowIndex) => (
                  <tr key={`${activePreviewSheet.title}-${rowIndex}`} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`} className="px-3 py-3 text-[10px] font-bold text-gray-600 whitespace-nowrap">
                        {cellIndex === 0 ? (
                          <span className="font-black text-gray-800">{cell}</span>
                        ) : cellIndex === row.length - 2 ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black ${
                            cell.includes('到期') || cell.includes('缺') || cell.includes('待') || cell.includes('续签')
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-t border-gray-100">
            <div className="text-[9px] font-bold text-gray-400">显示 4 条记录，共 {activeHrDataView.count}</div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500">
              <button className="h-6 px-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white transition-all">上一页</button>
              <span className="px-1">1 / 3</span>
              <button className="h-6 px-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-white transition-all">下一页</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3.5 select-none relative" id="workbench-view-root">
      
      {/* 1. Inside View Banners */}
      <AnimatePresence>
        {localBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-full px-4"
          >
            <div className="bg-gray-900 border border-gray-800 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{localBanner.text}</span>
              </div>
              <button onClick={() => setLocalBanner(null)} className="text-gray-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Three-column grid workspace */}
      <div className="grid grid-cols-12 gap-5 items-stretch">
        
        {/* ================= COLUMN 1: PROJECT & REPORT PROGRESS ================= */}
        <section className="col-span-12 lg:col-span-3 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col min-h-0 shadow-xs overflow-hidden">
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            {/* Box Header */}
            <div className="-mx-3.5 -mt-3.5 mb-1 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                  <FileSpreadsheet className="w-4 h-4 text-[#4f68c8]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[#24315f] leading-none">项目 & 报告进度</span>
                  <span className="text-[9px] text-[#8c91aa] font-bold mt-1">按项目展示报告流转状态</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverviewPanel('projects')}
                className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
              >
                <span>全部</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Interactive Dropdown Project Selector */}
            <div className="relative">
              <div 
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="p-3 bg-[#f8fafc] border border-gray-100 hover:border-blue-500/20 rounded-2xl shadow-sm flex items-center justify-between gap-2.5 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/40 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-[#0052d9]">{activeProj.logoChar}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-800 truncate block max-w-[100px]">{activeProj.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform shrink-0 ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                      {activeProj.reportCount} 份报告 · 进度 {activeProj.progress}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="px-1.5 py-0.5 bg-blue-50 text-[#0052d9] border border-blue-100/50 rounded text-[8px] font-black whitespace-nowrap">
                    {activeProj.status}
                  </span>
                </div>
              </div>

              {/* Dropdown overlay */}
              <AnimatePresence>
                {isProjectDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProjectDropdownOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 5, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200/80 rounded-2xl shadow-xl z-20 p-2 space-y-1.5"
                    >
                      <div className="relative px-1.5 py-1">
                        <Search className="w-3 h-3 text-gray-400 absolute left-3 top-2.5" />
                        <input 
                          type="text" 
                          placeholder="搜索项目..." 
                          className="w-full pl-6.5 pr-2.5 py-1 bg-gray-50 border border-transparent rounded-lg text-[9px] text-gray-700 outline-none focus:bg-white focus:border-[#0052d9] transition-all font-bold"
                          value={searchProjectQuery}
                          onChange={(e) => setSearchProjectQuery(e.target.value)}
                        />
                      </div>

                      <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-0.5">
                        {workbenchProjects
                          .filter(p => p.name.includes(searchProjectQuery))
                          .map((proj) => (
                            <div 
                              key={proj.id}
                              onClick={() => {
                                setSelectedProjId(proj.id);
                                setSelectedTimelineNode(null);
                                setIsProjectDropdownOpen(false);
                              }}
                              className={`p-2 rounded-xl text-[10px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                proj.id === selectedProjId 
                                  ? 'bg-[#f1f3ff] text-[#0052d9]' 
                                  : 'text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="truncate pr-2">{proj.name}</span>
                              <span className="text-[8px] opacity-70 whitespace-nowrap">{proj.status}</span>
                            </div>
                          ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick action buttons for the selected project */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setIsDrawerOpen(true)}
                className="py-1.5 text-[10px] font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/50 transition-all cursor-pointer"
              >
                项目详情
              </button>
              <button 
                onClick={() => onOpenProject(activeProj.id)}
                className="py-1.5 text-[10px] font-bold text-white bg-[#0052d9] hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-sm shadow-blue-500/20 text-center"
              >
                打开项目群
              </button>
            </div>

            <div className="flex flex-col flex-1 min-h-0 pt-2">
              <div className="mb-2 shrink-0 space-y-2 select-none">
                <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-[#0052d9]" />
                  <span>项目路线图</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#f6f7fb] border border-gray-100 p-1">
                  {([
                    { key: 'report' as const, label: '报告主链路' },
                    { key: 'parallel' as const, label: '打印赋码版后并行' },
                    { key: 'auditProgress' as const, label: '被审计单位 / 报告进度' },
                    { key: 'contractFinance' as const, label: '合同 & 收款 & 开票' },
                    { key: 'contract' as const, label: '合同链路' },
                  ]).map((item) => {
                    const isSelected = activeTimelineKind === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setActiveTimelineKind(item.key);
                          setSelectedTimelineNode(null);
                        }}
                        className={`h-7 rounded-lg px-1 text-[9px] font-black transition-all cursor-pointer leading-tight ${
                          isSelected
                            ? 'bg-white text-[#0052d9] shadow-sm border border-blue-100/70'
                            : 'text-gray-500 hover:text-[#0052d9] hover:bg-white/60 border border-transparent'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Vertical workflow timeline nodes */}
              <div className="flex-1 min-h-0 space-y-1.5 pl-1.5 overflow-y-auto custom-scrollbar pr-0.5 pb-1">
                {activeTimelineKind !== 'parallel' && activeTimelineKind !== 'auditProgress' && activeTimelineKind !== 'contractFinance' && activeTimelineNodes.map((node, index) => {
                  const isCompleted = node.status === 'completed';
                  const isActive = node.status === 'active';
                  const isPending = node.status === 'pending';

                  return (
                    <div 
                      key={node.nodeId} 
                      onClick={() => setSelectedTimelineNode(node)}
                      className={`relative flex items-start gap-3 p-2 rounded-xl transition-colors cursor-pointer select-none ${
                        isActive 
                          ? 'bg-blue-50/80 border border-blue-100/50' 
                          : isCompleted
                            ? 'bg-emerald-50/70 border border-emerald-100/50'
                            : 'bg-gray-50/80 hover:bg-gray-100/80 border border-gray-100/70'
                      }`}
                    >
                      {/* Visual Vertical line connector */}
                      {index < activeTimelineNodes.length - 1 && (
                        <div 
                          className={`absolute left-[15.5px] top-6 bottom-[-10px] w-[1.5px] ${
                            isCompleted 
                              ? 'bg-emerald-500' 
                              : isActive 
                                ? 'bg-[#0052d9]' 
                                : 'border-l border-dashed border-gray-200'
                          }`} 
                        />
                      )}

                      {/* Timeline Node Icon/Badge */}
                      <div className="relative z-10 shrink-0 mt-0.5">
                        {isCompleted ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : isActive ? (
                          <div className="w-5 h-5 rounded-full bg-white border-2 border-[#0052d9] flex items-center justify-center relative animate-pulse shadow-sm">
                            <span className="w-1.5 h-1.5 bg-[#0052d9] rounded-full" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          </div>
                        )}
                      </div>

                      {/* Node Metadata content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-black ${
                            isActive 
                              ? 'text-[#0052d9]' 
                              : isCompleted 
                                ? 'text-gray-700 font-bold' 
                                : 'text-gray-400'
                          }`}>
                            {node.title}
                          </span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          isActive 
                            ? 'bg-blue-100 text-[#0052d9]' 
                            : isCompleted 
                              ? 'bg-white/75 text-emerald-600' 
                              : 'bg-white/70 text-gray-400'
                        }`}>
                            {isActive ? '当前节点' : isCompleted ? '已完成' : '待处理'}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">角色: {node.role}</p>
                      </div>
                    </div>
                  );
                })}

                {activeTimelineKind === 'parallel' && (
                  <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2 select-none">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#6c8fc2] bg-blue-50 px-1.5 py-0.5 rounded">
                        打印赋码版后并行
                      </span>
                      <span className="text-[8px] font-black text-[#0052d9] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                        并行分支
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {reportParallelBranches.map((branch) => (
                        <div key={branch.title} className="rounded-xl bg-white/80 border border-gray-100 p-2 min-h-[126px]">
                          <div className="mb-2 flex items-center gap-1.5 text-[9px] font-black text-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                            <span>{branch.title}</span>
                          </div>

                          <div className="space-y-1.5">
                            {branch.nodes.map((node, index) => (
                              <div
                                key={node.nodeId}
                                onClick={() => setSelectedTimelineNode(node)}
                                className="relative flex items-start gap-2 rounded-lg bg-gray-50/90 hover:bg-gray-100/80 border border-gray-100 p-2 cursor-pointer transition-colors"
                              >
                                {index < branch.nodes.length - 1 && (
                                  <span className="absolute left-[13px] top-6 bottom-[-9px] border-l border-dashed border-gray-200" />
                                )}
                                <span className="relative z-10 mt-0.5 w-4.5 h-4.5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-1">
                                    <span className="text-[9px] font-black text-gray-400 truncate">{node.title}</span>
                                    <span className="text-[7px] font-bold text-gray-400 shrink-0">待处理</span>
                                  </span>
                                  <span className="block text-[8px] text-gray-400 font-bold mt-0.5">角色: {node.role}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="my-2 flex items-center gap-2 text-[8px] text-gray-400 font-black">
                      <span className="h-px bg-gray-200 flex-1" />
                      <span>汇合</span>
                      <span className="h-px bg-gray-200 flex-1" />
                    </div>

                    <div
                      onClick={() => setSelectedTimelineNode(reportFinishNode)}
                      className="relative flex items-start gap-3 p-2 rounded-xl bg-gray-50/90 hover:bg-gray-100/80 border border-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="relative z-10 shrink-0 mt-0.5 w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-black text-gray-400">{reportFinishNode.title}</span>
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded shrink-0 bg-white/70 text-gray-400">待处理</span>
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold mt-0.5">角色: {reportFinishNode.role}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTimelineKind === 'auditProgress' && (
                  <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5 select-none">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-500">被审计单位 / 报告进度</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0052d9] border border-blue-100 text-[8px] font-black">
                        进行中
                      </span>
                    </div>

                    <div className="rounded-xl bg-white/85 border border-gray-100 p-3 shadow-xs">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-black text-gray-800">1</span>
                        <span className="px-2 py-1 rounded-lg bg-blue-50 text-[#0052d9] text-[9px] font-black">
                          待报告
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[9px] font-bold text-gray-500">
                        <span>报告类型：<span className="text-gray-700">鉴证类</span></span>
                        <span>业务类型：<span className="text-gray-700">一般企业审计</span></span>
                        <span>负责人：<span className="text-gray-700">符金雨</span></span>
                        <span>二审人员：<span className="text-gray-700">符金雨</span></span>
                      </div>

                      <div className="mt-3 rounded-xl bg-blue-50/80 border border-blue-100/40 p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-[#0052d9]">待办消息</span>
                          <span className="text-[9px] font-bold text-gray-500">符金雨</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-bold text-gray-600">
                          <span className="px-1.5 py-0.5 rounded bg-white/75 text-gray-400">提交报告</span>
                          <span className="truncate">修改并重新提交报告：1</span>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-9 gap-1">
                        {['bg-emerald-500', 'bg-sky-500', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200'].map((color, index) => (
                          <span key={index} className={`h-1.5 rounded-full ${color}`} />
                        ))}
                      </div>
                      <div className="mt-1.5 grid grid-cols-9 gap-1">
                        {Array.from({ length: 9 }).map((_, index) => (
                          <span key={index} className="h-1 rounded-full bg-gray-200" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTimelineKind === 'contractFinance' && (
                  <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5 select-none">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-gray-500">合同 & 收款 & 开票</span>
                      <span className="text-[8px] font-black text-gray-400">{activeContract.signDate}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '合同额', value: activeContract.amount.replace(' ', ''), cls: 'text-[#0052d9]' },
                        { label: '已收款', value: activeContract.received, cls: activeContract.numericReceived > 0 ? 'text-emerald-600' : 'text-teal-600' },
                        { label: '未收款', value: activeContract.pending.replace(' ', ''), cls: 'text-amber-700' },
                        { label: '已开票', value: activeContract.invoiced, cls: activeContract.numericInvoiced > 0 ? 'text-indigo-600' : 'text-violet-700' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-white/85 border border-gray-100 p-2.5 min-h-[58px]">
                          <span className="block text-[9px] font-bold text-gray-400">{item.label}</span>
                          <span className={`block mt-1 text-[12px] font-black ${item.cls}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-white/85 border border-gray-100 p-2.5 min-h-[58px]">
                        <span className="block text-[10px] font-black text-gray-800">付款计划</span>
                        <div className="mt-1.5 space-y-1">
                          {activeContract.paymentPlan.slice(0, 3).map((milestone) => (
                            <div key={milestone.id} className="flex items-center justify-between gap-2 text-[9px] font-bold text-gray-500">
                              <span className="truncate">{milestone.name}</span>
                              <span className={`shrink-0 rounded-full border px-1.5 py-0.5 ${getMilestoneStatusClass(milestone)}`}>
                                {getMilestoneStatus(milestone)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white/85 border border-gray-100 p-2.5 min-h-[58px]">
                        <span className="block text-[10px] font-black text-gray-800">收款 / 开票记录</span>
                        <span className="block mt-1.5 text-[9px] font-bold text-gray-500">
                          收款 {activeContract.receiptRecords.length} 笔 · 开票 {activeContract.invoiceRecords.length} 笔
                        </span>
                        <span className="block mt-1 text-[9px] font-bold text-amber-600">
                          已开票未收款 {formatCurrency(Math.max(0, activeContract.numericInvoiced - activeContract.numericReceived))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline Node detail popover inside timeline to prevent jump pages */}
          <AnimatePresence>
            {selectedTimelineNode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-2xl space-y-2 text-[10px] text-gray-600 shrink-0"
              >
                <div className="flex justify-between items-center font-black text-gray-800">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#0052d9]" />
                    {selectedTimelineNode.title} 节点细则
                  </span>
                  <button onClick={() => setSelectedTimelineNode(null)} className="hover:text-gray-900">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 font-bold text-gray-500">
                  <p>● 负责人角色: <span className="text-gray-700">{selectedTimelineNode.role}</span></p>
                  <p>● 当前状态: <span className="text-gray-700">
                    {selectedTimelineNode.status === 'completed' ? '已通过并归档' : selectedTimelineNode.status === 'active' ? '处于进行中待审批' : '前续节点未就绪'}
                  </span></p>
                  {activeTimelineKind === 'contract' && selectedTimelineNode.nodeId === 3 && (
                    <p className="text-amber-700 bg-amber-50 p-1.5 rounded mt-1.5">
                      💡 提示：该步骤由您审核。您可以通过右侧待我处理中的 [审批合同] 按钮立即核准或驳回。
                    </p>
                  )}
                  {activeTimelineKind === 'report' && selectedTimelineNode.status === 'active' && (
                    <p className="text-blue-700 bg-blue-50 p-1.5 rounded mt-1.5">
                      当前展示的是{activeTimelineTitle}，该节点正在推进中。
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </section>

        {/* ================= COLUMN 2: TASKS, FOLLOWINGS, CONTRACTS TABLE ================= */}
        <section className="col-span-12 lg:col-span-9 grid grid-cols-1 lg:grid-cols-9 gap-4 min-h-0 auto-rows-min">

          {/* Task lists - "待我处理" */}
          <div className="lg:col-span-6 bg-white border border-[#dfe2ed]/60 rounded-2xl p-4 shadow-xs overflow-hidden flex flex-col h-[450px]">
            {/* Box Header */}
            <div className="-mx-4 -mt-4 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                  <AlertCircle className="w-4.5 h-4.5 text-[#4f68c8]" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#24315f] leading-none">待我处理</span>
                    {pendingTasks.length > 0 && (
                      <span className="w-4.5 h-4.5 rounded-full bg-[#e8e0ff] text-[#5f62b8] flex items-center justify-center text-[9px] font-black animate-pulse">
                        {pendingTasks.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-[#8c91aa] font-bold mt-1">
                    {pendingTasks.length > 0 ? `${pendingTasks.length} 个需要操作的任务` : '当前没有需要处理的任务'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverviewPanel('tasks')}
                className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
              >
                <span>全部</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tasks list */}
            <div className="space-y-3.5 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 min-h-0 flex-1">
              {pendingTasks.length === 0 ? (
                <ReadyEmptyState />
              ) : (
                pendingTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-2.5 bg-gray-50 hover:bg-[#f8f9ff]/50 border border-gray-100/80 rounded-xl flex flex-row items-center justify-between gap-3.5 transition-all"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-800 truncate leading-snug">
                          {task.title}
                        </span>
                        <span className="px-1.5 py-0.2 bg-gray-200/60 text-gray-500 border border-transparent rounded text-[8px] font-black whitespace-nowrap">
                          {task.tag}
                        </span>
                        {task.tag2 && (
                          <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[8px] font-black whitespace-nowrap">
                            {task.tag2}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold truncate">项目：{task.projectName}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => {
                          setSelectedTaskForModal(task);
                          setIsDrawerOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-bold text-[10px] transition-all cursor-pointer whitespace-nowrap"
                      >
                        详情
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedTaskForModal(task);
                          if (task.type === 'agent') {
                            triggerBanner(`已定位到人事管理助手待办：${task.title}。`, 'info');
                          } else if (task.type === 'upload') {
                            setIsUploadModalOpen(true);
                          } else {
                            setIsApprovalModalOpen(true);
                          }
                        }}
                        className="px-3 py-1 bg-[#0052d9] text-white hover:bg-blue-700 rounded-lg font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-blue-500/20 whitespace-nowrap"
                      >
                        <span>{task.buttonText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily dynamics - same row as pending tasks */}
          <div className="lg:col-span-3 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col h-[450px] shadow-xs overflow-hidden">
            <div className="-mx-3.5 -mt-3.5 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-4 py-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                  <Calendar className="w-4 h-4 text-[#4f68c8]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-[#24315f] leading-none truncate">今日动态</span>
                  <span className="text-[9px] text-[#8c91aa] font-bold mt-1 truncate">项目消息与成员待办</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOverviewPanel('dynamics')}
                className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer shrink-0"
              >
                <span>全部</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 space-y-4">
              {workbenchProjects.length === 0 && pendingTasks.length === 0 ? (
                <ReadyEmptyState message="恭喜，今日暂无项目动态需要处理！" />
              ) : (
                <>
                  {workbenchProjects.length > 0 && (
                    <div className="space-y-4 relative pl-8 pt-1 pb-3">
                      <div className="absolute left-[13px] top-3 bottom-3 w-[1px] bg-gray-100" />

                      {workbenchProjects.map((project) => (
                        <div key={project.id} className="relative flex items-center gap-2.5 min-w-0">
                          <div className="absolute -left-[27px] w-5.5 h-5.5 rounded-full bg-blue-50 border border-blue-100/40 flex items-center justify-center shrink-0 z-10 shadow-xs">
                            <Bell className="w-3 h-3 text-[#0052d9]" />
                          </div>
                          <div className="min-w-0 flex-1 leading-normal">
                            <div className="text-[10px] font-extrabold text-gray-800 truncate">{project.name}：{project.status}</div>
                            <span className="text-[8px] text-gray-400 font-bold block mt-0.5">项目 · 报告进度 {project.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3.5 pt-2 border-t border-gray-100/60">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-[10px] text-[#0052d9] font-black">
                            我
                          </div>
                          <span className="text-[10px] font-black text-gray-700">我</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold">
                          {pendingUploadTasks.length} 项
                        </span>
                      </div>

                      {pendingUploadTasks.length === 0 ? (
                        <ReadyEmptyState message="恭喜，暂无需要上传的项目材料！" />
                      ) : pendingUploadTasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskForModal(task);
                            setIsUploadModalOpen(true);
                          }}
                          className="p-2 bg-gray-50 hover:bg-blue-50/40 border border-gray-100 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <span className="text-[8px] font-black bg-gray-200/60 text-gray-500 px-1 py-0.5 rounded shrink-0">
                            {task.tag}
                          </span>
                          <span className="text-[9px] font-bold text-gray-700 truncate flex-1">
                            {task.projectName} · {task.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-gray-200 flex items-center justify-center text-[10px] text-gray-500 font-bold">
                            未
                          </div>
                          <span className="text-[10px] font-black text-gray-700">未指定成员</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold">
                          {pendingApproveTasks.length} 项
                        </span>
                      </div>

                      {pendingApproveTasks.length === 0 ? (
                        <ReadyEmptyState message="恭喜，暂无待审批的项目事项！" />
                      ) : pendingApproveTasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskForModal(task);
                            setIsApprovalModalOpen(true);
                          }}
                          className="p-2 bg-gray-50 hover:bg-blue-50/40 border border-gray-100 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <span className="text-[8px] font-black bg-rose-50 text-rose-700 border border-rose-100 px-1 py-0.5 rounded shrink-0">
                            {task.tag}
                          </span>
                          <span className="text-[9px] font-bold text-gray-700 truncate flex-1">
                            {task.projectName} · {task.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100/40">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center text-[10px] text-[#5f62b8] font-black">
                            人
                          </div>
                          <span className="text-[10px] font-black text-gray-700">人事管理助手</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold">
                          {pendingAgentTasks.length} 项
                        </span>
                      </div>

                      {pendingAgentTasks.length === 0 ? (
                        <ReadyEmptyState message="恭喜，暂无人事助手待办！" />
                      ) : pendingAgentTasks.map((task) => (
                        <div 
                          key={task.id}
                          onClick={() => triggerBanner(`已定位到人事管理助手待办：${task.title}。`, 'info')}
                          className="p-2 bg-gray-50 hover:bg-blue-50/40 border border-gray-100 rounded-xl flex items-center gap-2.5 cursor-pointer transition-colors"
                        >
                          <span className="text-[8px] font-black bg-violet-50 text-[#5f62b8] border border-violet-100 px-1 py-0.5 rounded shrink-0">
                            {task.tag}
                          </span>
                          <span className="text-[9px] font-bold text-gray-700 truncate flex-1">
                            {task.projectName} · {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Table section: "合同 & 收款 & 开票" */}
          <div className="lg:col-span-9 bg-white border border-[#dfe2ed]/60 rounded-2xl overflow-hidden shadow-xs flex flex-col h-[430px]">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                  <Receipt className="w-4.5 h-4.5 text-[#4f68c8]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-[#24315f]">合同 & 收款 & 开票</span>
                  <span className="text-[9px] text-[#8c91aa] font-bold mt-1">项目合同金额与已收、未收及开票回款情况</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 rounded-xl bg-white/80 border border-[#dfe2ed] p-0.5 flex items-center shadow-inner">
                  {[
                    { key: 'receipt' as const, label: '收款' },
                    { key: 'invoice' as const, label: '开票' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFinancePanelView(item.key)}
                      className={`h-7 px-3 rounded-lg text-[10px] font-black transition-all ${
                        financePanelView === item.key
                          ? 'bg-[#0052d9] text-white shadow-sm'
                          : 'text-gray-500 hover:text-[#0052d9]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOverviewPanel('contracts')}
                  className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 cursor-pointer"
                >
                  <span>查看全部</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table component with full local state capability */}
            <div className={`${financePanelView === 'receipt' ? 'overflow-y-scroll overflow-x-hidden' : 'overflow-y-scroll overflow-x-auto'} custom-scrollbar visible-scrollbar min-h-0 flex-1`}>
              {workbenchContracts.length === 0 ? (
                <ReadyEmptyState message="恭喜，当前暂无合同收款开票事项！" />
              ) : (
                <table className={`${financePanelView === 'receipt' ? 'w-full table-fixed [&_td]:overflow-hidden [&_th]:overflow-hidden' : 'w-full min-w-[640px]'} text-left border-collapse`}>
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className={`${financePanelView === 'receipt' ? 'w-[15%] pl-4 pr-2' : 'pl-5 pr-3 min-w-[150px]'} py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider`}>项目</th>
                      <th className={`${financePanelView === 'receipt' ? 'w-[12%] px-2' : 'px-3 min-w-[70px]'} py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider`}>签订日期</th>
                      <th className={`${financePanelView === 'receipt' ? 'w-[12%] px-2' : 'px-3 min-w-[80px]'} py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider`}>合同额</th>
                      {financePanelView === 'receipt' ? (
                        <>
                          <th className="w-[11%] px-2 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider">已收款</th>
                          <th className="w-[11%] px-2 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider">未收款</th>
                          <th className="w-[14%] px-2 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider">收款节点</th>
                          <th className="w-[15%] px-2 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider">最近收款</th>
                        </>
                      ) : (
                        <>
                          <th className="px-3 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider min-w-[80px]">已开票</th>
                          <th className="px-3 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider min-w-[80px]">未开票</th>
                          <th className="px-3 py-2 text-[10px] text-gray-400 font-black uppercase tracking-wider min-w-[105px]">关联收款</th>
                        </>
                      )}
                      <th className={`${financePanelView === 'receipt' ? 'w-[10%] pl-2 pr-4' : 'pl-3 pr-5 min-w-[120px]'} py-2 text-right text-[10px] text-gray-400 font-black uppercase tracking-wider`}>操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/60">
                    {workbenchContracts.map((contract) => {
                      const isSelected = contract.projectId === selectedProjId;
                      const nextReceivable = getNextReceivable(contract);
                      const hasPaymentPlan = contract.paymentPlan.length > 0;
                      const latestReceipt = contract.receiptRecords[contract.receiptRecords.length - 1];
                      const latestInvoice = contract.invoiceRecords[contract.invoiceRecords.length - 1];
                      const pendingFinanceReview = [...contract.invoiceRecords].reverse().find(record => record.status === '待财务审核');
                      const pendingInvoiceIssue = [...contract.invoiceRecords].reverse().find(record => record.status === '待开票');
                      const uninvoicedAmount = Math.max(0, contract.numericAmount - contract.numericInvoiced);
                      return (
                        <tr 
                          key={contract.id} 
                          className={`transition-colors text-[11px] ${
                            isSelected 
                              ? 'bg-blue-50/30 font-bold hover:bg-blue-50/50' 
                              : 'hover:bg-gray-50/40'
                          }`}
                        >
                          <td className={`${financePanelView === 'receipt' ? 'pl-4 pr-2' : 'pl-5 pr-3 max-w-[160px]'} py-2 font-black text-gray-800 truncate`}>
                            {contract.projectName}
                          </td>
                          <td className={`${financePanelView === 'receipt' ? 'px-2 whitespace-nowrap' : 'px-3 whitespace-nowrap'} py-2 text-gray-400 font-bold`}>
                            {contract.signDate}
                          </td>
                          <td className={`${financePanelView === 'receipt' ? 'px-2 truncate' : 'px-3 whitespace-nowrap'} py-2 text-gray-800 font-black`}>
                            {contract.amount}
                          </td>
                          {financePanelView === 'receipt' ? (
                            <>
                              <td className={`px-2 py-2 truncate font-extrabold ${
                                contract.numericReceived > 0 ? 'text-gray-800' : 'text-gray-400'
                              }`}>
                                {contract.received}
                              </td>
                              <td className={`px-2 py-2 truncate font-black ${
                                contract.numericPending > 0 ? 'text-rose-700' : 'text-gray-800'
                              }`}>
                                {contract.pending}
                              </td>
                              <td className="px-2 py-2">
                                <div className="min-w-0 flex items-center justify-between gap-2">
                                  {hasPaymentPlan && nextReceivable ? (
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-gray-800 truncate">{nextReceivable.name || '未命名节点'}</p>
                                      <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">
                                        {nextReceivable.dueDate || '未填时间'} · {formatCurrency(nextReceivable.amount)}
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-gray-800 truncate">未设置节点</p>
                                      <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">需填写收款计划</p>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => openPaymentPlanModal(contract)}
                                    className="shrink-0 text-[10px] font-black text-[#0052d9] hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    {hasPaymentPlan ? '查看' : '去填写'}
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                {latestReceipt ? (
                                  <div className="min-w-0 flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black text-gray-800 truncate">{formatCurrency(latestReceipt.amount)}</p>
                                      <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">{latestReceipt.date} · {latestReceipt.serialNo}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openReceiptDetailModal(contract)}
                                      className="shrink-0 text-[10px] font-black text-[#0052d9] hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                                    >
                                      查看
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-gray-400">暂无到账</span>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className={`px-3 py-2 whitespace-nowrap font-extrabold ${
                                contract.numericInvoiced > 0 ? 'text-indigo-600' : 'text-gray-400'
                              }`}>
                                <span>{contract.invoiced}</span>
                                {latestInvoice && <span className={`mt-0.5 block text-[9px] ${
                                  latestInvoice.status === '已退回' ? 'text-rose-600' : latestInvoice.status === '待财务审核' ? 'text-amber-600' : latestInvoice.status === '待开票' ? 'text-blue-600' : 'text-emerald-600'
                                }`}>{latestInvoice.status}</span>}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap font-black text-rose-700">
                                {formatCurrency(uninvoicedAmount)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <div className="min-w-0 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black text-gray-800">{formatCurrency(contract.numericReceived)}</p>
                                    <p className="mt-0.5 text-[9px] font-bold text-gray-400">{contract.receiptRecords.length} 笔可关联收款</p>
                                  </div>
                                  {contract.receiptRecords.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => openReceiptDetailModal(contract)}
                                      className="shrink-0 text-[10px] font-black text-[#0052d9] hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
                                    >
                                      查看
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                          <td className={`${financePanelView === 'receipt' ? 'pl-2 pr-4' : 'pl-3 pr-5'} py-2 text-right whitespace-nowrap`}>
                            <div className="flex items-center justify-end gap-1.5">
                              {isSelected ? (
                                <>
                                  {financePanelView === 'invoice' ? (
                                    pendingFinanceReview ? (
                                      <button
                                        onClick={() => openFinanceInvoiceAction(contract, pendingFinanceReview, 'review')}
                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-black cursor-pointer"
                                      >财务审核</button>
                                    ) : pendingInvoiceIssue ? (
                                      <button
                                        onClick={() => openFinanceInvoiceAction(contract, pendingInvoiceIssue, 'issue')}
                                        className="px-2 py-1 bg-[#0052d9] hover:bg-blue-700 text-white rounded-lg text-[9px] font-black cursor-pointer shadow-xs"
                                      >上传发票</button>
                                    ) : (
                                      <button 
                                        onClick={() => openInvoiceModal(contract)}
                                        className="px-2 py-1 bg-[#0052d9] hover:bg-blue-700 text-white rounded-lg text-[9px] font-black cursor-pointer shadow-xs"
                                      >申请开票</button>
                                    )
                                  ) : (
                                    <button 
                                      onClick={() => openReceiptModal(contract)}
                                      className="px-2 py-1 bg-[#0052d9] hover:bg-blue-700 text-white rounded-lg text-[9px] font-black cursor-pointer shadow-xs"
                                    >
                                      登记
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button 
                                  onClick={() => setSelectedProjId(contract.projectId)}
                                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-[9px] font-bold cursor-pointer"
                                >
                                  切换
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedProjId(contract.projectId);
                                  setIsDrawerOpen(true);
                                }}
                                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

      </div>

      <AnimatePresence>
        {overviewPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/45 backdrop-blur-[2px] p-5">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[1040px] max-h-[86vh] overflow-hidden rounded-3xl border border-white/70 bg-[#f8f9fc] shadow-2xl flex flex-col"
            >
              <div className="shrink-0 border-b border-[#e6e8f2] bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] px-5 py-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-[#1f2a4d] leading-none">{overviewTitleMap[overviewPanel].title}</h3>
                  <p className="mt-2 text-[11px] font-bold text-[#7d849a]">{overviewTitleMap[overviewPanel].subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOverviewPanel(null)}
                  className="h-8 w-8 rounded-xl bg-white/80 border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-white flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5">
                {overviewPanel === 'projects' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {workbenchProjects.map((project) => {
                      const currentNode = project.reportTimeline.find(node => node.status === 'active');
                      const projectTasks = getProjectTasks(project.id);
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => openProjectDetail(project.id)}
                          className="rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm hover:border-blue-200 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-sm font-black text-[#0052d9] shrink-0">
                                {project.logoChar}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-gray-900">{project.name}</p>
                                <p className="mt-1 text-[9px] font-bold text-gray-400">{project.membersCount} 人 · {project.reportCount} 份报告</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-[#0052d9] border border-blue-100 shrink-0">
                              {project.status}
                            </span>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-[10px] font-black">
                              <span className="text-gray-500">报告进度</span>
                              <span className="text-[#0052d9]">{project.progress}%</span>
                            </div>
                            <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full bg-[#0052d9]" style={{ width: `${project.progress}%` }} />
                            </div>
                          </div>
                          <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3">
                            <p className="text-[9px] font-bold text-gray-400">当前节点</p>
                            <p className="mt-1 text-[11px] font-black text-gray-800">{currentNode?.title || '暂无当前节点'}</p>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500">待处理 {projectTasks.length} 项</span>
                            <span className="text-[10px] font-black text-[#0052d9] flex items-center gap-1">
                              查看详情
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {overviewPanel === 'tasks' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workbenchProjects.map((project) => {
                      const projectTasks = getProjectTasks(project.id);
                      return (
                        <div key={project.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-[#0052d9] shrink-0">
                                {project.logoChar}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-black text-gray-900">{project.name}</p>
                                <p className="mt-1 text-[9px] font-bold text-gray-400">当前待处理 {projectTasks.length} 项</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openProjectDetail(project.id)}
                              className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-black text-gray-600 hover:bg-gray-100"
                            >
                              项目详情
                            </button>
                          </div>

                          <div className="mt-3 space-y-2">
                            {projectTasks.length === 0 ? (
                              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-[10px] font-bold text-emerald-700">
                                当前项目暂无待处理事项
                              </div>
                            ) : projectTasks.map((task) => (
                              <div key={task.id} className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-[11px] font-black text-gray-800">{task.title}</span>
                                    <span className="rounded bg-gray-200/70 px-1.5 py-0.5 text-[8px] font-black text-gray-500 shrink-0">{task.tag}</span>
                                  </div>
                                  <p className="mt-1 text-[9px] font-bold text-gray-400">{task.buttonText}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openTaskAction(task)}
                                  className="shrink-0 rounded-lg bg-[#0052d9] px-3 py-1.5 text-[10px] font-black text-white hover:bg-blue-700"
                                >
                                  处理
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {overviewPanel === 'dynamics' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {workbenchProjects.map((project) => {
                      const projectTasks = getProjectTasks(project.id);
                      const currentNode = project.reportTimeline.find(node => node.status === 'active');
                      return (
                        <div key={project.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-[#0052d9] shrink-0">
                                {project.logoChar}
                              </span>
                              <p className="truncate text-xs font-black text-gray-900">{project.name}</p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black text-[#0052d9] border border-blue-100 shrink-0">
                              {project.status}
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                              <p className="text-[9px] font-bold text-gray-400">今日进展</p>
                              <p className="mt-1 text-[11px] font-black text-gray-800">报告进度 {project.progress}%</p>
                              <p className="mt-1 text-[9px] font-bold text-gray-500">当前节点：{currentNode?.title || '暂无当前节点'}</p>
                            </div>
                            <div className="rounded-xl bg-blue-50/70 border border-blue-100 p-3">
                              <p className="text-[9px] font-black text-[#0052d9]">待办消息</p>
                              <p className="mt-1 text-[10px] font-bold text-gray-700">
                                {projectTasks[0] ? `${projectTasks[0].tag} · ${projectTasks[0].title}` : '暂无待办消息'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openProjectDetail(project.id)}
                            className="mt-4 w-full rounded-xl border border-blue-100 bg-blue-50/70 py-2 text-[10px] font-black text-[#0052d9] hover:bg-blue-100"
                          >
                            查看项目动态
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {overviewPanel === 'contracts' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {workbenchProjects.map((project) => {
                      const contract = getProjectContract(project.id);
                      return (
                        <div key={project.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xs font-black text-[#0052d9] shrink-0">
                              {project.logoChar}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-black text-gray-900">{project.name}</p>
                              <p className="mt-1 text-[9px] font-bold text-gray-400">{contract?.signDate || '暂无合同签订日期'}</p>
                            </div>
                          </div>

                          {contract ? (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              {[
                                { label: '合同额', value: contract.amount.replace(' ', ''), cls: 'text-[#0052d9]' },
                                { label: '已收款', value: contract.received, cls: contract.numericReceived > 0 ? 'text-emerald-600' : 'text-gray-400' },
                                { label: '未收款', value: contract.pending.replace(' ', ''), cls: contract.numericPending > 0 ? 'text-rose-700' : 'text-emerald-600' },
                                { label: '已开票', value: contract.invoiced, cls: contract.numericInvoiced > 0 ? 'text-indigo-600' : 'text-gray-400' },
                              ].map((item) => (
                                <div key={item.label} className="rounded-xl bg-gray-50 border border-gray-100 p-2.5">
                                  <p className="text-[9px] font-bold text-gray-400">{item.label}</p>
                                  <p className={`mt-1 text-[11px] font-black ${item.cls}`}>{item.value}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 p-3 text-[10px] font-bold text-gray-400">
                              暂无合同收款开票信息
                            </div>
                          )}

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setOverviewPanel(null);
                                if (contract) openInvoiceModal(contract);
                              }}
                              disabled={!contract}
                              className="rounded-xl border border-blue-100 bg-blue-50/80 py-2 text-[10px] font-black text-[#0052d9] hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              申请开票
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOverviewPanel(null);
                                if (contract) openReceiptModal(contract);
                              }}
                              disabled={!contract}
                              className="rounded-xl bg-[#0052d9] py-2 text-[10px] font-black text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              登记
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================================= */}
      {/* ================================= INTERACTIVE MODALS & DRAWERS ========================= */}
      {/* ========================================================================================= */}

      {/* 1. Project Detail Side Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Background Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-out Panel */}
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[720px] max-w-[92vw] bg-white z-50 p-6 shadow-2xl border-l border-gray-200/80 flex flex-col justify-between"
            >
              <div className="space-y-6 overflow-y-auto custom-scrollbar pr-1">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100/50 text-[#0052d9] font-black">
                      {activeProj.logoChar}
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-gray-800">{activeProj.name}</h2>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">项目标识 ID: {activeProj.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">交付进度</span>
                    <p className="mt-1 text-xl font-black text-gray-800">{activeProj.progress}%</p>
                    <span className="mt-1 inline-flex text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                      进度推进顺畅
                    </span>
                  </div>
                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">报告数量</span>
                    <p className="mt-1 text-xl font-black text-gray-800">{activeProj.reportCount}</p>
                    <span className="text-[9px] text-gray-400 font-bold">待报告状态同步</span>
                  </div>
                  <div className="bg-[#f8fafc] border border-gray-100 rounded-2xl p-4">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider">项目成员</span>
                    <p className="mt-1 text-xl font-black text-gray-800">{activeProj.membersCount}人</p>
                    <span className="text-[9px] text-gray-400 font-bold">项目经理 / 成员 / 审批人</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2]">
                      <span className="text-xs font-black text-[#24315f]">报告主链路</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {activeProj.reportTimeline.map((node) => (
                        <div key={node.nodeId} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          node.status === 'completed' ? 'bg-emerald-50/70 border-emerald-100/60' : node.status === 'active' ? 'bg-blue-50/80 border-blue-100/60' : 'bg-gray-50/80 border-gray-100'
                        }`}>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-black truncate ${node.status === 'active' ? 'text-[#0052d9]' : node.status === 'completed' ? 'text-gray-700' : 'text-gray-400'}`}>{node.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">角色: {node.role}</p>
                          </div>
                          <span className={`text-[8px] font-bold shrink-0 ${node.status === 'completed' ? 'text-emerald-600' : node.status === 'active' ? 'text-[#0052d9]' : 'text-gray-400'}`}>
                            {node.status === 'completed' ? '已完成' : node.status === 'active' ? '当前节点' : '待处理'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] flex items-center justify-between">
                      <span className="text-xs font-black text-[#24315f]">打印赋码版后并行</span>
                      <span className="text-[8px] font-black text-[#0052d9] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">并行分支</span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {reportParallelBranches.map((branch) => (
                          <div key={branch.title} className="rounded-xl bg-gray-50/80 border border-gray-100 p-3">
                            <p className="text-[10px] font-black text-gray-800 mb-2">{branch.title}</p>
                            <div className="space-y-2">
                              {branch.nodes.map((node) => (
                                <div key={node.nodeId} className="rounded-lg bg-white border border-gray-100 p-2 flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-black text-gray-500">{node.title}</span>
                                  <span className="text-[8px] font-bold text-gray-400">待处理</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-[8px] text-gray-400 font-black">
                        <span className="h-px bg-gray-200 flex-1" />
                        <span>汇合</span>
                        <span className="h-px bg-gray-200 flex-1" />
                      </div>
                      <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400">{reportFinishNode.title}</span>
                        <span className="text-[8px] font-bold text-gray-400">待处理</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] flex items-center justify-between">
                      <span className="text-xs font-black text-[#24315f]">被审计单位 / 报告进度</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0052d9] border border-blue-100 text-[8px] font-black">进行中</span>
                    </div>
                    <div className="p-4">
                      <div className="rounded-xl bg-gray-50/80 border border-gray-100 p-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-black text-gray-800">1</span>
                          <span className="px-2 py-1 rounded-lg bg-blue-50 text-[#0052d9] text-[9px] font-black">待报告</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-bold text-gray-500">
                          <span>报告类型：<span className="text-gray-700">鉴证类</span></span>
                          <span>业务类型：<span className="text-gray-700">一般企业审计</span></span>
                          <span>负责人：<span className="text-gray-700">符金雨</span></span>
                          <span>二审人员：<span className="text-gray-700">符金雨</span></span>
                        </div>
                        <div className="mt-3 rounded-xl bg-blue-50/80 border border-blue-100/40 p-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#0052d9]">待办消息</p>
                            <p className="mt-1 text-[9px] font-bold text-gray-600 truncate">提交报告　修改并重新提交报告：1</p>
                          </div>
                          <span className="text-[9px] font-bold text-gray-500 shrink-0">符金雨</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2]">
                      <span className="text-xs font-black text-[#24315f]">合同 & 收款 & 开票</span>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: '合同额', value: activeContract.amount.replace(' ', ''), cls: 'text-[#0052d9]' },
                          { label: '已收款', value: activeContract.received, cls: activeContract.numericReceived > 0 ? 'text-emerald-600' : 'text-teal-600' },
                          { label: '未收款', value: activeContract.pending.replace(' ', ''), cls: 'text-amber-700' },
                          { label: '已开票', value: activeContract.invoiced, cls: activeContract.numericInvoiced > 0 ? 'text-indigo-600' : 'text-violet-700' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5">
                            <span className="block text-[9px] font-bold text-gray-400">{item.label}</span>
                            <span className={`block mt-1 text-[12px] font-black ${item.cls}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5">
                          <span className="block text-[10px] font-black text-gray-800">付款计划</span>
                          <div className="mt-1.5 space-y-1">
                            {activeContract.paymentPlan.slice(0, 3).map((milestone) => (
                              <div key={milestone.id} className="flex items-center justify-between gap-2 text-[9px] font-bold text-gray-500">
                                <span className="truncate">{milestone.name}</span>
                                <span className={`shrink-0 rounded-full border px-1.5 py-0.5 ${getMilestoneStatusClass(milestone)}`}>
                                  {getMilestoneStatus(milestone)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-gray-50/90 border border-gray-100 p-2.5">
                          <span className="block text-[10px] font-black text-gray-800">收款 / 开票记录</span>
                          <span className="block mt-1.5 text-[9px] font-bold text-gray-500">收款 {activeContract.receiptRecords.length} 笔 · 开票 {activeContract.invoiceRecords.length} 笔</span>
                          <span className="block mt-1 text-[9px] font-bold text-amber-600">已开票未收款 {formatCurrency(Math.max(0, activeContract.numericInvoiced - activeContract.numericReceived))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2]">
                      <span className="text-xs font-black text-[#24315f]">合同链路</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-2">
                      {activeProj.timeline.map((node) => (
                        <div key={node.nodeId} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                          node.status === 'completed' ? 'bg-emerald-50/70 border-emerald-100/60' : node.status === 'active' ? 'bg-blue-50/80 border-blue-100/60' : 'bg-gray-50/80 border-gray-100'
                        }`}>
                          <div className="min-w-0">
                            <p className={`text-[10px] font-black truncate ${node.status === 'active' ? 'text-[#0052d9]' : node.status === 'completed' ? 'text-gray-700' : 'text-gray-400'}`}>{node.title}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">角色: {node.role}</p>
                          </div>
                          <span className={`text-[8px] font-bold shrink-0 ${node.status === 'completed' ? 'text-emerald-600' : node.status === 'active' ? 'text-[#0052d9]' : 'text-gray-400'}`}>
                            {node.status === 'completed' ? '已完成' : node.status === 'active' ? '当前节点' : '待处理'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer footer */}
              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenProject(activeProj.id);
                  }}
                  className="w-full py-2.5 bg-[#0052d9] hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  进入项目协作空间
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      {/* Payment plan nodes modal */}
      <AnimatePresence>
        {isPaymentPlanModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-[#0052d9]" />
                  <div>
                    <h3 className="text-sm font-black text-gray-800">收款节点 ({selectedPlanContract.projectName})</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">节点由人工填写，用于说明规定收款时间、金额和款项性质；实际到账仍在「登记」里记录。</p>
                  </div>
                </div>
                <button onClick={() => setIsPaymentPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '合同额', value: selectedPlanContract.amount, cls: 'text-[#0052d9]' },
                    { label: '已收款', value: selectedPlanContract.received, cls: 'text-emerald-600' },
                    { label: '未收款', value: selectedPlanContract.pending, cls: 'text-rose-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400">{item.label}</p>
                      <p className={`mt-1 text-sm font-black ${item.cls}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-gray-800">已设置节点</span>
                      <p className="mt-0.5 text-[9px] font-bold text-gray-400">可直接修改，删除后不影响已登记的实际到账记录。</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400">{selectedPlanContract.paymentPlan.length} 个</span>
                      <button
                        type="button"
                        title="新增节点"
                        onClick={handleCreatePaymentMilestone}
                        className="w-8 h-8 rounded-lg bg-[#0052d9] text-white hover:bg-blue-700 flex items-center justify-center cursor-pointer shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {selectedPlanContract.paymentPlan.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-xs font-black text-gray-700">还没有收款节点</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">点击右上角加号新增节点，再直接填写款项性质、规定收款时间和规定金额。</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedPlanContract.paymentPlan.map((milestone) => (
                        <div key={milestone.id} className="px-4 py-3 grid grid-cols-12 gap-2 items-end">
                          <label className="col-span-3 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 block">款项性质</span>
                            <input
                              value={milestone.name}
                              onChange={(e) => handleUpdatePaymentMilestone(milestone.id, { name: e.target.value })}
                              placeholder="如 签约款"
                              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-800 outline-none focus:border-[#0052d9]"
                            />
                          </label>
                          <label className="col-span-2 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 block">规定金额</span>
                            <input
                              value={milestone.amount ? String(milestone.amount) : ''}
                              onChange={(e) => {
                                const amountNum = parseFloat(e.target.value.replace(/,/g, ''));
                                handleUpdatePaymentMilestone(milestone.id, { amount: isNaN(amountNum) ? 0 : amountNum });
                              }}
                              placeholder="金额"
                              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-black text-rose-700 outline-none focus:border-[#0052d9]"
                            />
                          </label>
                          <label className="col-span-2 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 block">规定收款时间</span>
                            <input
                              value={milestone.dueDate}
                              onChange={(e) => handleUpdatePaymentMilestone(milestone.id, { dueDate: e.target.value })}
                              placeholder="YYYY-MM-DD"
                              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]"
                            />
                          </label>
                          <label className="col-span-4 space-y-1">
                            <span className="text-[9px] font-black text-gray-400 block">备注 / 条件</span>
                            <input
                              value={milestone.condition}
                              onChange={(e) => handleUpdatePaymentMilestone(milestone.id, { condition: e.target.value })}
                              placeholder="如 合同签订后"
                              className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]"
                            />
                          </label>
                          <div className="col-span-1 h-8 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setPendingDeleteMilestoneId(milestone.id)}
                              className="text-[9px] font-black text-gray-400 hover:text-rose-600 cursor-pointer"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment milestone delete confirm modal */}
      <AnimatePresence>
        {pendingDeleteMilestone && (
          <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl w-full max-w-sm border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-800">是否确认删除？</h3>
                <p className="mt-2 text-[11px] font-bold text-gray-500 leading-relaxed">
                  删除后，该收款节点将不再显示在项目收款计划中。
                </p>
              </div>
              <div className="px-5 py-4 bg-gray-50/70">
                <div className="rounded-xl bg-white border border-gray-100 p-3">
                  <p className="text-[10px] font-bold text-gray-400">待删除节点</p>
                  <p className="mt-1 text-xs font-black text-gray-800">{pendingDeleteMilestone.name || '未命名节点'}</p>
                </div>
              </div>
              <div className="px-5 py-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingDeleteMilestoneId(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-[10px] font-black text-gray-500 hover:bg-gray-50 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePaymentMilestone(pendingDeleteMilestone.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-[10px] font-black hover:bg-rose-700 cursor-pointer"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt details modal */}
      <AnimatePresence>
        {isReceiptDetailModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-3xl border border-gray-100 shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-black text-gray-800">收款明细 ({selectedReceiptDetailContract.projectName})</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">查看该项目每笔实际到账记录，登记收款后会自动汇总到这里。</p>
                  </div>
                </div>
                <button onClick={() => setIsReceiptDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '合同额', value: selectedReceiptDetailContract.amount, cls: 'text-[#0052d9]' },
                    { label: '已收款', value: selectedReceiptDetailContract.received, cls: 'text-emerald-600' },
                    { label: '收款笔数', value: `${selectedReceiptDetailContract.receiptRecords.length} 笔`, cls: 'text-gray-800' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-gray-50 border border-gray-100 p-3">
                      <p className="text-[10px] font-bold text-gray-400">{item.label}</p>
                      <p className={`mt-1 text-sm font-black ${item.cls}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-black text-gray-800">到账记录</span>
                    <span className="text-[10px] font-bold text-gray-400">按登记顺序展示</span>
                  </div>
                  {selectedReceiptDetailContract.receiptRecords.length === 0 ? (
                    <div className="p-5 text-center">
                      <p className="text-xs font-black text-gray-700">暂无收款记录</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">可以先在收款页点击“登记”录入实际到账。</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedReceiptDetailContract.receiptRecords.map((record) => {
                        const milestone = selectedReceiptDetailContract.paymentPlan.find(item => item.id === record.milestoneId);
                        return (
                          <div key={record.id} className="px-4 py-3 grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-3 min-w-0">
                              <p className="text-[11px] font-black text-emerald-600 truncate">{formatCurrency(record.amount)}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">本次到账金额</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[11px] font-black text-gray-800">{record.date}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-gray-400">收款日期</p>
                            </div>
                            <div className="col-span-3 min-w-0">
                              <p className="text-[11px] font-black text-gray-700 truncate">{record.serialNo}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-gray-400">银行流水号</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-[11px] font-black text-[#0052d9] truncate">{milestone?.name || '未指定'}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-gray-400">对应节点</p>
                            </div>
                            <div className="col-span-2 min-w-0">
                              <p className="text-[11px] font-black text-gray-700 truncate">{record.note || record.payer}</p>
                              <p className="mt-0.5 text-[9px] font-bold text-gray-400">备注</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Interactive Drag & Drop File Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Upload className="w-4.5 h-4.5 text-[#0052d9]" />
                  <h3 className="text-xs font-black text-gray-800">上传审计报告 / 交付文件</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadingFile(null);
                    setUploadProgress(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Task context header */}
              {selectedTaskForModal && (
                <div className="p-3 bg-blue-50/50 border border-blue-100/30 rounded-xl space-y-1">
                  <span className="text-[8px] font-black text-blue-500 uppercase">当前处理任务</span>
                  <p className="text-[10px] font-black text-gray-700">{selectedTaskForModal.title}</p>
                  <p className="text-[9px] text-gray-400 font-bold">归属项目: {selectedTaskForModal.projectName}</p>
                </div>
              )}

              {/* Drag zone container */}
              {!uploadingFile ? (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center space-y-3.5 transition-all relative ${
                    dragActive 
                      ? 'border-[#0052d9] bg-blue-50/20' 
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50/30'
                  }`}
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    className="hidden" 
                    accept=".pdf,.docx,.xlsx" 
                    onChange={handleFileSelect}
                  />
                  <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0052d9] flex items-center justify-center mx-auto shadow-inner border border-white">
                    <Upload className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-gray-700">
                      拖拽文件到此处，或{' '}
                      <label htmlFor="file-upload-input" className="text-[#0052d9] hover:underline cursor-pointer">
                        点击浏览器检索
                      </label>
                    </p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">支持扩展名: .pdf, .docx, .xlsx (大小不超过 20MB)</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-[#0052d9] shrink-0 border border-blue-100/40">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-gray-800 truncate">{uploadingFile.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{(uploadingFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setUploadingFile(null);
                        setUploadProgress(0);
                      }}
                      className="text-gray-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Progress bar info */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold">
                      <span>{uploadProgress < 100 ? '正在上传核对...' : '校验与杀毒已完成'}</span>
                      <span className="text-gray-700 font-black">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0052d9] rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setUploadingFile(null);
                    setUploadProgress(0);
                  }}
                  className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  取消
                </button>
                <button 
                  disabled={!uploadingFile || uploadProgress < 100}
                  onClick={completeUploadTask}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm ${
                    uploadingFile && uploadProgress >= 100
                      ? 'bg-[#0052d9] text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  确认提交
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. High Fidelity Approval Modal */}
      <AnimatePresence>
        {isApprovalModalOpen && (
          selectedTaskForModal?.type === 'audit' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/55 p-3">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="负责人报告审核"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-[920px] max-h-[calc(100vh-24px)] w-full max-w-[1348px] flex-col overflow-hidden rounded-2xl bg-[#f4f6f9] shadow-2xl"
            >
              <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e1e5ec] bg-white px-5">
                <button
                  type="button"
                  onClick={() => { setIsApprovalModalOpen(false); setSelectedTaskForModal(null); }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[#68758a] hover:bg-[#f1f3f7] hover:text-[#25324a] focus:outline-none focus:ring-2 focus:ring-[#7aa2ff]"
                  aria-label="关闭审核页面"
                ><X className="h-4 w-4" /></button>
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf3ff] text-[#245dcc]"><ShieldCheck className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h2 className="truncate text-sm font-black text-[#17233b]">金利集团 2026 年度专项审计报告</h2><span className="rounded-full bg-[#fff1f2] px-2 py-0.5 text-[9px] font-black text-[#c93649]">报告三审</span></div>
                  <p className="mt-0.5 text-[9px] font-bold text-[#758298]">PJ-2026-0811-006 · 陈华提交于今天 10:24 · 剩余 4 小时 26 分</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button type="button" onClick={() => triggerBanner('原始报告已加入下载任务。', 'info')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d9e0eb] bg-white px-3 text-[10px] font-black text-[#59677e] hover:bg-[#f7f8fa]"><Download className="h-3.5 w-3.5" />下载原稿</button>
                  <button type="button" onClick={() => triggerBanner('已开启 V3 与 V4 版本对比。', 'info')} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#cbd9fb] bg-[#eef4ff] px-3 text-[10px] font-black text-[#285bc5] hover:bg-[#e3edff]"><Columns3 className="h-3.5 w-3.5" />版本对比</button>
                </div>
              </header>

              <div className="flex min-h-0 flex-1">
                <aside className="flex w-[236px] shrink-0 flex-col border-r border-[#e1e5ec] bg-white">
                  <div className="border-b border-[#e8ebf0] px-4 py-4">
                    <div className="flex items-end justify-between"><div><p className="text-[10px] font-black text-[#7a879b]">AI 质检可信度</p><p className="mt-1 text-2xl font-black tracking-tight text-[#1c2b46]">78<span className="ml-1 text-[10px] text-[#7e8a9d]">/ 100</span></p></div><span className="rounded-full bg-[#fff5df] px-2 py-1 text-[9px] font-black text-[#a7650a]">需人工判断</span></div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full w-[78%] rounded-full bg-[#e59a2f]" /></div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-[#e8ebf0] py-3 text-center"><div><b className="block text-sm text-[#c93649]">2</b><span className="text-[9px] font-bold text-[#7c889a]">关键风险</span></div><div className="border-x border-[#e8ebf0]"><b className="block text-sm text-[#b16c0b]">3</b><span className="text-[9px] font-bold text-[#7c889a]">一般提示</span></div><div><b className="block text-sm text-[#1e805f]">8</b><span className="text-[9px] font-bold text-[#7c889a]">已核验</span></div></div>
                  <div className="flex items-center justify-between px-4 pb-2 pt-4"><h3 className="text-[11px] font-black text-[#26344c]">审核问题</h3><span className="text-[9px] font-bold text-[#8a95a6]">5 项</span></div>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
                    {[
                      { title: '正文与附注金额不一致', meta: '关键 · 财务数据', tone: 'bg-[#d83f50]', status: '待判断' },
                      { title: '收入确认凭证不完整', meta: '关键 · 审计证据', tone: 'bg-[#d83f50]', status: '待判断' },
                      { title: '管理层责任段落待更新', meta: '一般 · 文本规范', tone: 'bg-[#e59a2f]', status: '建议修改' },
                      { title: '页码引用存在两处偏移', meta: '一般 · 交叉索引', tone: 'bg-[#e59a2f]', status: '建议修改' },
                      { title: '签字日期晚于报告日', meta: '一般 · 日期逻辑', tone: 'bg-[#e59a2f]', status: '需确认' },
                    ].map((issue, index) => (
                      <button key={issue.title} type="button" onClick={() => setActiveAuditIssue(index)} className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${activeAuditIssue === index ? 'bg-[#edf3ff]' : 'hover:bg-[#f5f7fa]'}`}>
                        <div className="flex items-center gap-2"><i className={`h-1.5 w-1.5 rounded-full ${issue.tone}`} /><span className="min-w-0 flex-1 truncate text-[10px] font-black text-[#26344c]">{issue.title}</span></div>
                        <div className="mt-1.5 flex justify-between pl-3.5 text-[8px] font-bold text-[#8490a2]"><span>{issue.meta}</span><span>{issue.status}</span></div>
                      </button>
                    ))}
                  </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                  <nav className="flex h-11 shrink-0 items-center gap-5 border-b border-[#e1e5ec] bg-white px-5">
                    {([['report','报告正文'],['attachments','附件（4）'],['history','审核轨迹']] as const).map(([id,label]) => <button key={id} type="button" onClick={() => setAuditDocumentTab(id)} className={`h-11 border-b-2 px-1 text-[10px] font-black ${auditDocumentTab === id ? 'border-[#2f63d8] text-[#265cc9]' : 'border-transparent text-[#748196] hover:text-[#39485f]'}`}>{label}</button>)}
                    <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold text-[#7f8b9d]"><Eye className="h-3.5 w-3.5" />已自动定位至风险段落</span>
                  </nav>
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {auditDocumentTab === 'report' ? (
                      <article className="mx-auto min-h-[980px] max-w-[680px] bg-white px-16 py-14 shadow-md">
                        <h1 className="text-center text-lg font-black tracking-wide text-[#17233b]">专项审计报告</h1>
                        <p className="mt-2 text-center text-[10px] font-bold text-[#8590a2]">华小安审字〔2026〕第 0811 号</p>
                        <section className="mt-10 text-[12px] leading-7 text-[#344158]"><h3 className="mb-2 font-black text-[#1f2d45]">一、审计意见</h3><p>我们审计了金利集团有限公司财务报表，包括 2026 年 6 月 30 日的资产负债表、利润表、现金流量表以及相关财务报表附注。我们认为，后附的财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了金利集团的财务状况。</p></section>
                        <section className="mt-7 text-[12px] leading-7 text-[#344158]"><h3 className="mb-2 font-black text-[#1f2d45]">二、形成审计意见的基础</h3><p>我们按照中国注册会计师审计准则的规定执行了审计工作。我们独立于被审计单位，并履行了职业道德方面的其他责任。我们相信，我们获取的审计证据是充分、适当的，为发表审计意见提供了基础。</p></section>
                        <section className="mt-7 text-[12px] leading-7 text-[#344158]"><h3 className="mb-2 font-black text-[#1f2d45]">三、关键审计事项</h3><p>截至报告期末，应收账款账面余额为 <button type="button" onClick={() => setActiveAuditIssue(0)} className="rounded bg-[#ffe6e8] px-1 font-black text-[#a92b3a] ring-1 ring-[#f5b7be]">¥48,230,000</button>，管理层按照预期信用损失模型计提坏账准备。AI 质检发现该金额与附注五（3）披露的 <button type="button" onClick={() => setActiveAuditIssue(0)} className="rounded bg-[#fff1cc] px-1 font-black text-[#8a5909] ring-1 ring-[#efd994]">¥46,230,000</button> 存在差异，建议复核底稿索引 A12-04。</p><p className="mt-4">收入确认采用时点法。抽样检查显示 12 月最后五个工作日确认的服务收入中，有 <button type="button" onClick={() => setActiveAuditIssue(1)} className="rounded bg-[#fff1cc] px-1 font-black text-[#8a5909] ring-1 ring-[#efd994]">3 笔合同缺少客户验收单</button>，涉及金额 ¥1,280,000。</p></section>
                        <div className="mt-8 rounded-lg bg-[#f2f6ff] p-3 text-[9px] font-bold leading-5 text-[#526786]">证据来源：审计底稿 A12-04、收入截止性测试 C07-02、财务报表附注 V3。点击高亮内容可切换对应审核问题。</div>
                      </article>
                    ) : auditDocumentTab === 'attachments' ? (
                      <div className="mx-auto max-w-[720px] overflow-hidden rounded-xl border border-[#dfe4ec] bg-white"><div className="border-b border-[#e6eaf0] px-4 py-3 text-[11px] font-black text-[#27354c]">送审附件</div>{['财务报表附注_V3.pdf','应收账款底稿_A12-04.xlsx','收入截止性测试_C07-02.xlsx','管理层声明书.pdf'].map((file,index)=><button key={file} type="button" onClick={()=>triggerBanner(`已打开附件：${file}`,'info')} className="flex w-full items-center gap-3 border-b border-[#edf0f4] px-4 py-3 text-left last:border-0 hover:bg-[#f7f9fc]"><FileText className="h-4 w-4 text-[#4772d7]"/><span className="flex-1 text-[10px] font-black text-[#34425a]">{file}</span><span className="text-[9px] font-bold text-[#8792a3]">{index+1}.{index+2} MB</span><ChevronRight className="h-3.5 w-3.5 text-[#a1aab8]"/></button>)}</div>
                    ) : (
                      <div className="mx-auto max-w-[720px] rounded-xl border border-[#dfe4ec] bg-white p-5"><h3 className="text-[11px] font-black text-[#26344c]">审核轨迹</h3>{[['今天 10:24','陈华提交三审','已完成 AI 质检，识别 5 个问题'],['今天 09:42','蔡宇豪完成二审','修改关键审计事项与附注引用'],['昨天 17:36','陈嘉妍完成一审','补充收入截止性测试底稿']].map(([time,title,desc])=><div key={time} className="mt-4 flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-[#4c72d6]"/><div><p className="text-[10px] font-black text-[#334158]">{title}</p><p className="mt-1 text-[9px] font-bold text-[#8490a2]">{time} · {desc}</p></div></div>)}</div>
                    )}
                  </div>
                </main>

                <aside className="flex w-[300px] shrink-0 flex-col border-l border-[#e1e5ec] bg-white">
                  <div className="border-b border-[#e6eaf0] px-4 py-4"><div className="flex items-center gap-2"><Flag className={`h-4 w-4 ${activeAuditIssue < 2 ? 'text-[#cf3d4e]' : 'text-[#c27a18]'}`} /><h3 className="text-[11px] font-black text-[#26344c]">{['正文与附注金额不一致','收入确认凭证不完整','管理层责任段落待更新','页码引用存在两处偏移','签字日期晚于报告日'][activeAuditIssue]}</h3></div><p className="mt-2 text-[9px] font-bold leading-5 text-[#758196]">{activeAuditIssue === 0 ? '正文应收账款余额比附注高 ¥2,000,000，可能影响关键审计事项表述。' : activeAuditIssue === 1 ? '3 笔期末收入未关联客户验收单，需要确认是否满足收入确认条件。' : '该项不直接改变审计意见，但建议在出具前完成规范性修正。'}</p></div>
                  <div className="border-b border-[#e6eaf0] p-4"><div className="flex items-center justify-between"><h4 className="text-[10px] font-black text-[#344158]">证据对照</h4><span className="rounded-full bg-[#eaf6f1] px-2 py-0.5 text-[8px] font-black text-[#1f7b5e]">来源可信</span></div><div className="mt-3 space-y-2 rounded-lg bg-[#f6f8fb] p-3 text-[9px] font-bold leading-5 text-[#54647b]">{activeAuditIssue === 0 ? <><p>报告正文：<b className="text-[#a92b3a]">¥48,230,000</b></p><p>附注五（3）：<b className="text-[#875708]">¥46,230,000</b></p><p>底稿 A12-04：<b>¥46,230,000</b></p></> : <><p>底稿 C07-02：样本 18 / 21 / 24</p><p>合同状态：已签署</p><p>客户验收单：<b className="text-[#a92b3a]">未关联</b></p></>}</div><button type="button" onClick={()=>triggerBanner('已在右侧打开完整证据链。','info')} className="mt-2 w-full rounded-lg border border-[#dbe2ec] py-2 text-[9px] font-black text-[#52627a] hover:bg-[#f7f8fa]">查看完整证据链</button></div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4"><h4 className="flex items-center gap-1.5 text-[10px] font-black text-[#344158]"><MessageSquare className="h-3.5 w-3.5" />负责人审核意见</h4><textarea value={auditComment} onChange={(event)=>setAuditComment(event.target.value)} className="mt-3 h-28 w-full resize-none rounded-lg border border-[#dbe1e9] bg-white p-3 text-[10px] font-bold leading-5 text-[#42516a] outline-none placeholder:text-[#657289] focus:border-[#6d91e4] focus:ring-2 focus:ring-[#dbe7ff]" placeholder="记录审核判断、修改要求或通过依据"/><div className="mt-3 flex flex-wrap gap-1.5">{['核对披露金额','补充验收证据','修改后重新送审'].map(text=><button key={text} type="button" onClick={()=>setAuditComment(current=>`${current}${current?'\n':''}${text}`)} className="rounded-full bg-[#f1f4f8] px-2.5 py-1 text-[8px] font-black text-[#59677c] hover:bg-[#e7ebf1]">+ {text}</button>)}</div></div>
                  <footer className="border-t border-[#e1e5ec] bg-[#fafbfc] p-4">
                    {auditReturnMode ? <div><p className="mb-2 text-[9px] font-black text-[#a82d3c]">确认退回后，提交人将收到审核意见并重新进入送审流程。</p><div className="flex gap-2"><button type="button" onClick={()=>setAuditReturnMode(false)} className="h-9 flex-1 rounded-lg border border-[#dbe1e9] bg-white text-[10px] font-black text-[#66748a]">取消</button><button type="button" onClick={()=>{setWorkbenchTasks(prev=>prev.map(task=>task.id===selectedTaskForModal.id?{...task,title:'修改并重新提交报告：1',type:'upload',buttonText:'上传报告',tag:'提交报告',tag2:'已退回'}:task));triggerBanner('报告已退回修改，审核意见已同步给提交人。','info');setIsApprovalModalOpen(false);setSelectedTaskForModal(null);setAuditReturnMode(false)}} className="h-9 flex-[1.4] rounded-lg bg-[#c93649] text-[10px] font-black text-white hover:bg-[#b52f40]">确认退回修改</button></div></div> : <div className="grid grid-cols-[1fr_1.35fr] gap-2"><button type="button" onClick={()=>setAuditReturnMode(true)} className="h-9 rounded-lg border border-[#efb9c0] bg-white text-[10px] font-black text-[#bf3547] hover:bg-[#fff4f5]">退回修改</button><button type="button" onClick={handleApproveAudit} className="h-9 rounded-lg bg-[#2d61d4] text-[10px] font-black text-white hover:bg-[#2455bf] focus:outline-none focus:ring-2 focus:ring-[#8ba9ec]">审核通过</button></div>}
                  </footer>
                </aside>
              </div>
            </motion.section>
          </div>
          ) : (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 border border-gray-100 shadow-2xl space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CheckCheck className="w-4.5 h-4.5 text-[#0052d9]" />
                  <h3 className="text-xs font-black text-gray-800">合同审核 (一审流程审批)</h3>
                </div>
                <button 
                  onClick={() => {
                    setIsApprovalModalOpen(false);
                    setSelectedTaskForModal(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metadata Overview of Contract */}
              <div className="grid grid-cols-2 gap-3.5 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-[10px]">
                <div>
                  <span className="text-gray-400 font-bold block mb-0.5">合同项目名称</span>
                  <span className="text-gray-800 font-black truncate block">金利集团有限公司-审计服务合同</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-0.5">合同金额</span>
                  <span className="text-[#0052d9] font-black">¥ 10,000,000.00 元</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-0.5">拟稿部门/经办人</span>
                  <span className="text-gray-700 font-bold">财务部 / 汪欣</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block mb-0.5">签署主体</span>
                  <span className="text-gray-700 font-bold">上海金利实业集团有限公司</span>
                </div>
              </div>

              {/* Text Area comments */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">审批意见意见 (可修改)</label>
                <textarea 
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-[10px] border border-gray-200 focus:border-[#0052d9] rounded-xl outline-none font-bold text-gray-600 placeholder-gray-300 resize-none leading-relaxed"
                />
              </div>

              {/* Signature simulation */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">审批主管电子签名 (手动签章)</label>
                <div className="border border-dashed border-gray-200/80 bg-gray-50/50 rounded-2xl p-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-400 font-bold select-none text-[10px]">符金雨 已授权印章：</span>
                  <span className="px-5 py-2 border-2 border-[#ba1a1a]/40 text-[#ba1a1a] font-serif tracking-widest rounded-lg transform rotate-[-4deg] select-none font-black text-sm border-dashed">
                    符金雨
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={() => {
                    triggerBanner('审批拒绝。该合同已退回到上一环节补充材料。', 'info');
                    setIsApprovalModalOpen(false);
                  }}
                  className="px-4 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  拒绝并退回
                </button>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsApprovalModalOpen(false)}
                    className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleApproveContract}
                    className="px-5 py-2 bg-[#0052d9] hover:bg-blue-700 text-white font-black text-[10px] rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    确认同意审批
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
          )
        )}
      </AnimatePresence>

      {/* 4. Invoice Create Modal */}
      <AnimatePresence>
        {isInvoiceModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-6xl max-h-[96vh] overflow-hidden border border-gray-100 shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-[#0052d9]" />
                  <div>
                    <h3 className="text-sm font-black text-gray-800">申请开票 ({activeContract.projectName})</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">先上传凭证，OCR 自动带入字段；申请人最终确认后提交财务审核。</p>
                  </div>
                </div>
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar space-y-3">
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '合同额', value: activeContract.amount, cls: 'text-[#0052d9]' },
                    { label: '已收款', value: activeContract.received, cls: 'text-emerald-600' },
                    { label: '已开票', value: activeContract.invoiced, cls: 'text-indigo-600' },
                    { label: '未收款', value: activeContract.pending, cls: 'text-rose-700' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl bg-gray-50 border border-gray-100 p-2.5">
                      <p className="text-[10px] font-bold text-gray-400">{item.label}</p>
                      <p className={`mt-1 text-sm font-black ${item.cls}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 lg:col-span-4 rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-black text-gray-800">资料上传</h4>
                      <button
                        type="button"
                        className="h-7 px-3 rounded-lg bg-[#0052d9] text-white text-[9px] font-black hover:bg-blue-700 flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Upload className="w-3 h-3" />
                        上传
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { name: '合同扫描件.pdf', desc: '识别合同编号、客户名称、合同金额', status: '已识别' },
                        { name: '正式报告.pdf', desc: '识别项目名称、报告编号', status: '已识别' },
                        { name: '报备信息表.xlsx', desc: '识别购方抬头、税号、接收邮箱', status: '需核对' },
                      ].map((file) => (
                        <div key={file.name} className="rounded-xl bg-white border border-gray-100 p-3 flex items-center gap-3">
                          <FileText className="w-4 h-4 text-[#0052d9] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-gray-800 truncate">{file.name}</p>
                            <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">{file.desc}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black border ${
                            file.status === '需核对' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {file.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-8 rounded-2xl border border-gray-100 bg-white p-3.5">
                    <h4 className="text-xs font-black text-gray-800">开票信息确认</h4>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">合同编号</span>
                        <input value="JL-CPA-20260625" readOnly className="w-full h-8 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[11px] font-bold text-gray-700" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">客户名称</span>
                        <input value={activeContract.projectName} readOnly className="w-full h-8 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[11px] font-bold text-gray-700" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">本次开票金额</span>
                        <input 
                          type="text" 
                          value={invoiceAmount}
                          onChange={(e) => setInvoiceAmount(e.target.value)}
                          className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-black text-gray-800 outline-none focus:border-[#0052d9]"
                          placeholder="请输入本次开票金额"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">发票类型</span>
                        <div className="h-8 rounded-xl border border-gray-200 bg-gray-50 px-3 flex items-center gap-2 text-[10px] font-black text-gray-700">
                          <span className="rounded-md bg-[#0052d9] px-2 py-1 text-white">专票</span>
                          <span className="text-gray-400">普票</span>
                        </div>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">购方名称</span>
                        <input defaultValue="金利集团有限公司" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">纳税人识别号</span>
                        <input defaultValue="91310000MA1KJL2026" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">开票内容 / 税率</span>
                        <input defaultValue="审计服务费 / 6%" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">开户银行</span>
                        <input defaultValue="招商银行上海分行营业部" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">银行账号</span>
                        <input defaultValue="3109 0000 2607 0108" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">联系电话</span>
                        <input defaultValue="021-6899 2026" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1 md:col-span-2 xl:col-span-3">
                        <span className="text-[10px] font-black text-gray-400">注册地址</span>
                        <input defaultValue="上海市浦东新区世纪大道 88 号金利中心 26 层" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">收款日期</span>
                        <input defaultValue={activeContract.receiptRecords[0]?.date || '待关联收款'} className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">收款金额</span>
                        <input defaultValue={formatCurrency(invoiceLinkedAmount || activeContract.numericReceived)} className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">发票接收方式</span>
                        <div className="h-8 rounded-xl border border-gray-200 bg-gray-50 px-3 flex items-center gap-2 text-[10px] font-black text-gray-700">
                          <span className="rounded-md bg-[#0052d9] px-2 py-1 text-white">电子发票</span>
                          <span className="text-gray-400">纸质发票</span>
                        </div>
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">接收邮箱 / 邮寄地址</span>
                        <input defaultValue="finance@jinli.com" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400">申请人 / 申请日期</span>
                        <input value="汪欣 / 2026-07-03" readOnly className="w-full h-8 rounded-xl border border-gray-200 bg-gray-50 px-3 text-[11px] font-bold text-gray-700" />
                      </label>
                      <label className="space-y-1 xl:col-span-3">
                        <span className="text-[10px] font-black text-gray-400">备注</span>
                        <input defaultValue="本次按已到账金额申请开票，提交财务复核。" className="w-full h-8 rounded-xl border border-gray-200 bg-white px-3 text-[11px] font-bold text-gray-700 outline-none focus:border-[#0052d9]" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-black text-gray-800">关联收款记录</h4>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">开票可以关联一笔或多笔已到账记录；未覆盖部分会标记为先票后款。</p>
                    </div>
                    <div className="text-right text-[10px] font-black">
                      <p className="text-emerald-600">已关联 {formatCurrency(invoiceLinkedAmount)}</p>
                      <p className={invoiceRiskAmount > 0 ? 'text-amber-600 mt-1' : 'text-gray-400 mt-1'}>
                        先票后款 {formatCurrency(invoiceRiskAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {activeContract.receiptRecords.length > 0 ? activeContract.receiptRecords.map((record) => {
                      const milestone = activeContract.paymentPlan.find(item => item.id === record.milestoneId);
                      const checked = selectedReceiptIds.includes(record.id);
                      return (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => setSelectedReceiptIds(prev => prev.includes(record.id) ? prev.filter(id => id !== record.id) : [...prev, record.id])}
                          className={`rounded-xl border p-2.5 text-left transition-all ${checked ? 'border-[#0052d9] bg-blue-50/60' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-black text-gray-800">{record.date} 到账</span>
                            <span className="text-[11px] font-black text-emerald-600">{formatCurrency(record.amount)}</span>
                          </div>
                          <p className="mt-1 text-[9px] font-bold text-gray-400">核销：{milestone?.name || '未指定'} · 流水 {record.serialNo}</p>
                        </button>
                      );
                    }) : (
                      <div className="col-span-2 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-[10px] font-bold text-gray-400">
                        暂无收款记录，可以继续提交先票后款申请。
                      </div>
                    )}
                  </div>

                  {invoiceRiskAmount > 0 && (
                    <label className="mt-3 block space-y-1">
                      <span className="text-[10px] font-black text-amber-700">先票后款原因</span>
                      <input
                        value={invoiceAheadReason}
                        onChange={(e) => setInvoiceAheadReason(e.target.value)}
                        className="w-full h-9 rounded-xl border border-amber-100 bg-amber-50 px-3 text-[11px] font-bold text-amber-800 outline-none focus:border-amber-300"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-5 py-3 border-t border-gray-100 bg-gray-50/80 shrink-0">
                <button onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 text-[10px] text-gray-400 font-bold hover:text-gray-600 cursor-pointer">
                  取消
                </button>
                <button onClick={handleApplyInvoice} className="px-4 py-2 bg-[#0052d9] hover:bg-blue-700 text-white font-black text-[10px] rounded-xl cursor-pointer">
                  确认申请
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Finance review and invoice issuing modal */}
      <AnimatePresence>
        {financeInvoiceTarget && financeInvoiceContract && financeInvoiceRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label={financeInvoiceTarget.mode === 'review' ? '审核开票申请' : '上传发票'}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-[#0052d9]">
                    <Receipt className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-gray-900">{financeInvoiceTarget.mode === 'review' ? '财务审核开票申请' : '上传发票并完成开票'}</h3>
                    <p className="mt-1 truncate text-[10px] font-bold text-gray-500">{financeInvoiceContract.projectName} · {formatCurrency(financeInvoiceRecord.amount)}</p>
                  </div>
                </div>
                <button type="button" aria-label="关闭" onClick={() => setFinanceInvoiceTarget(null)} className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </header>

              <div className="space-y-4 px-5 py-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-gray-50 p-4 text-[10px] sm:grid-cols-4">
                  <div><dt className="font-bold text-gray-400">申请人</dt><dd className="mt-1 font-black text-gray-800">{financeInvoiceRecord.applicant}</dd></div>
                  <div><dt className="font-bold text-gray-400">申请日期</dt><dd className="mt-1 font-black text-gray-800">{financeInvoiceRecord.date}</dd></div>
                  <div><dt className="font-bold text-gray-400">关联收款</dt><dd className="mt-1 font-black text-emerald-700">{formatCurrency(financeInvoiceContract.receiptRecords.filter(record => financeInvoiceRecord.linkedReceiptIds.includes(record.id)).reduce((sum, record) => sum + record.amount, 0))}</dd></div>
                  <div><dt className="font-bold text-gray-400">当前状态</dt><dd className="mt-1 font-black text-[#0052d9]">{financeInvoiceRecord.status}</dd></div>
                </dl>

                {financeInvoiceTarget.mode === 'review' ? (
                  <label className="block space-y-1.5">
                    <span className="text-[10px] font-black text-gray-600">审批意见</span>
                    <textarea
                      name="finance-review-comment"
                      value={financeReviewComment}
                      onChange={(event) => setFinanceReviewComment(event.target.value)}
                      className="h-24 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 outline-none focus:border-[#8fa5c5] focus:ring-2 focus:ring-[#dfe7f2]"
                    />
                  </label>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black text-gray-600">发票号码</span>
                      <input
                        name="finance-invoice-number"
                        autoComplete="off"
                        value={financeInvoiceNo}
                        onChange={(event) => setFinanceInvoiceNo(event.target.value)}
                        className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-800 outline-none focus:border-[#8fa5c5] focus:ring-2 focus:ring-[#dfe7f2]"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-[10px] font-black text-gray-600">开票日期</span>
                      <input type="date" name="finance-invoice-date" defaultValue={new Date().toLocaleDateString('en-CA')} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs font-bold text-gray-800 outline-none focus:border-[#8fa5c5] focus:ring-2 focus:ring-[#dfe7f2]" />
                    </label>
                    <label className="block space-y-1.5 sm:col-span-2">
                      <span className="text-[10px] font-black text-gray-600">发票文件</span>
                      <span className="flex h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 text-[10px] font-bold text-gray-600 hover:border-blue-300 hover:bg-blue-50/40">
                        <span className="flex min-w-0 items-center gap-2"><Upload className="h-4 w-4 shrink-0 text-[#0052d9]" aria-hidden="true" /><span className="truncate">{financeInvoiceFileName || '选择 PDF 或图片发票文件'}</span></span>
                        <span className="shrink-0 text-[#0052d9]">选择文件</span>
                        <input type="file" accept=".pdf,image/*" className="sr-only" onChange={(event) => setFinanceInvoiceFileName(event.target.files?.[0]?.name || '')} />
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <footer className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3">
                {financeInvoiceTarget.mode === 'review' ? (
                  <button type="button" onClick={() => handleReviewInvoice(false)} className="h-9 rounded-lg px-3 text-[10px] font-black text-rose-600 hover:bg-rose-50">退回补充</button>
                ) : <span />}
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setFinanceInvoiceTarget(null)} className="h-9 rounded-lg px-3 text-[10px] font-black text-gray-500 hover:bg-gray-100">取消</button>
                  {financeInvoiceTarget.mode === 'review' ? (
                    <button type="button" onClick={() => handleReviewInvoice(true)} className="h-9 rounded-lg bg-[#0052d9] px-4 text-[10px] font-black text-white hover:bg-blue-700">通过审核</button>
                  ) : (
                    <button type="button" disabled={!financeInvoiceNo.trim() || !financeInvoiceFileName.trim()} onClick={handleCompleteInvoice} className="h-9 rounded-lg bg-[#0052d9] px-4 text-[10px] font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400">完成开票</button>
                  )}
                </div>
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Receipt Create Modal */}
      <AnimatePresence>
        {isReceiptModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-6 border border-gray-100 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4.5 h-4.5 text-[#0052d9]" />
                  <div>
                    <h3 className="text-xs font-black text-gray-800">登记 ({activeContract.projectName})</h3>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">填写本次实际到账金额和收款日期；款项说明放在备注里。</p>
                  </div>
                </div>
                <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-gray-600">
                  <p>● 未收款金额: <span className="text-rose-700 font-black">{formatCurrency(activeContract.numericPending)}</span></p>
                  <p className="mt-1">● 当前已收款: <span className="text-emerald-600 font-black">{formatCurrency(activeContract.numericReceived)}</span></p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-gray-400 block">本次到账金额 (元)</span>
                    <input 
                      type="text" 
                      value={receiptAmount}
                      onChange={(e) => setReceiptAmount(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none font-black text-xs focus:border-[#0052d9]"
                      placeholder="请输入本次到账金额"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-gray-400 block">收款日期</span>
                    <input 
                      type="text" 
                      value={receiptDate}
                      onChange={(e) => setReceiptDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none font-black text-xs focus:border-[#0052d9]"
                      placeholder="例如 2026-07-03"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[10px] font-black text-gray-400 block">银行流水号</span>
                    <input 
                      type="text" 
                      defaultValue="BK20260702001"
                      className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none font-black text-xs focus:border-[#0052d9]"
                    />
                  </label>
                </div>

                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-black text-gray-400 block">备注</span>
                  <textarea
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="例如：客户支付首笔款、对应报告出具前款、部分回款、尾款等"
                    className="w-full h-18 resize-none px-3.5 py-2 border border-gray-200 rounded-xl outline-none font-bold text-xs text-gray-700 placeholder-gray-400 focus:border-[#0052d9]"
                  />
                </label>

                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-black text-gray-400 block">收款凭证</span>
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500">银行回单 / 流水截图</span>
                    <span className="rounded-lg bg-white border border-gray-200 px-2 py-1 text-[9px] font-black text-[#0052d9]">上传</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setIsReceiptModalOpen(false)} className="px-4 py-2 text-[10px] text-gray-400 font-bold hover:text-gray-600 cursor-pointer">
                  取消
                </button>
                <button onClick={handleApplyReceipt} className="px-4 py-2 bg-[#0052d9] hover:bg-blue-700 text-white font-black text-[10px] rounded-xl cursor-pointer">
                  确认登记
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
