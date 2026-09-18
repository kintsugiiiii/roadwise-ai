import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck2,
  ReceiptText,
  Send,
  Upload,
  Users,
  X,
} from 'lucide-react';
import auditWorkspace from '../assets/generated/audit-workspace.png';
import '../project-actions.css';

export type ProjectActionKind = 'dispatch' | 'upload' | 'approve';
export type ProjectActionStatus = 'pending' | 'done' | 'returned';
export type ProjectActionState = Record<ProjectActionKind, ProjectActionStatus>;

interface TimelineNode {
  nodeId: number;
  title: string;
  role: string;
  status: 'completed' | 'active' | 'pending';
}

interface ProjectDetail {
  id: string;
  name: string;
  status: string;
  progress: number;
  reportCount: string;
  membersCount: number;
  reportTimeline: TimelineNode[];
  client?: string;
  owner?: string;
}

interface ProjectActionDrawerProps {
  project: ProjectDetail;
  actionState: ProjectActionState;
  onActionStateChange: (next: ProjectActionState) => void;
  onClose: () => void;
  onEnterProject: () => void;
}

type DetailTab = 'chain' | 'todo' | 'receipt' | 'invoice';
type FinanceActionKind = 'plan' | 'receipt' | 'receipt-detail' | 'invoice-apply' | 'invoice-review' | 'invoice-issue';
type InvoiceStatus = '未申请' | '待财务审核' | '待开票' | '已退回' | '已开票';

interface FinanceRow {
  id: string;
  projectName: string;
  contract: string;
  amount: number;
  received: number;
  invoiced: number;
  next: string;
  nextDate: string;
  receiptCount: number;
  lastReceipt?: { amount: number; date: string; serialNo: string; note: string };
  invoiceStatus: InvoiceStatus;
  pendingInvoiceAmount: number;
  invoiceNo?: string;
  invoiceFileName?: string;
}

const actions = [
  { kind: 'dispatch' as const, title: '派发底稿', desc: '货币资金循环审计底稿待派发', icon: Send, due: '今天 18:00' },
  { kind: 'upload' as const, title: '上传合同', desc: '补充盖章扫描件并提交复核', icon: Upload, due: '明天' },
  { kind: 'approve' as const, title: '审批合同', desc: '审计服务补充协议待一审', icon: ClipboardCheck, due: '7月23日' },
];

const contracts = [
  { id: 'HT-2026-0718', name: '年度审计服务合同', amount: '¥ 680,000', stage: 4, status: '审核中', signed: '2026-07-18' },
  { id: 'HT-2026-0720', name: '内控专项补充协议', amount: '¥ 160,000', stage: 2, status: '待提交', signed: '2026-07-20' },
  { id: 'HT-2026-0721', name: '税务咨询服务合同', amount: '¥ 120,000', stage: 6, status: '已生效', signed: '2026-07-21' },
];

const contractStages = ['拟合同上传', '项目经理提交', '合同一审', '合同二审', '签章确认', '合同生效'];

const initialFinanceRows: FinanceRow[] = [
  { id: 'JL-01', projectName: '金利集团有限公司', contract: '专项咨询与内控服务合同', amount: 4000000, received: 1000000, invoiced: 0, next: '二期款', nextDate: '2026-09-30', receiptCount: 1, lastReceipt: { amount: 1000000, date: '2026-07-01', serialNo: 'BK20260701008', note: '首期回款' }, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'JL-02', projectName: '金利集团有限公司', contract: '2026年度财务审计服务合同', amount: 6000000, received: 2000000, invoiced: 0, next: '报告出具前款', nextDate: '2026-10-15', receiptCount: 1, lastReceipt: { amount: 2000000, date: '2026-07-08', serialNo: 'BK20260708006', note: '首期回款' }, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'CDX-01', projectName: 'Codex-E2E-CPA-20260623', contract: '专项复核补充合同', amount: 400, received: 0, invoiced: 0, next: '合同生效后 7 日', nextDate: '2026-07-01', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'CDX-02', projectName: 'Codex-E2E-CPA-20260623', contract: '年度审计主合同', amount: 600, received: 0, invoiced: 0, next: '合同生效后 7 日', nextDate: '2026-06-30', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'WLS4-01', projectName: 'wls测试4', contract: '运维支持合同', amount: 8000, received: 0, invoiced: 0, next: '验收后 7 日', nextDate: '2026-06-28', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'WLS4-02', projectName: 'wls测试4', contract: '实施服务合同', amount: 12000, received: 0, invoiced: 0, next: '验收后 7 日', nextDate: '2026-06-27', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'WLS2-01', projectName: 'wls测试项目2', contract: '成果交付补充合同', amount: 5000, received: 0, invoiced: 0, next: '交付后 7 日', nextDate: '2026-06-26', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
  { id: 'WLS2-02', projectName: 'wls测试项目2', contract: '项目执行合同', amount: 15000, received: 0, invoiced: 0, next: '交付后 7 日', nextDate: '2026-06-25', receiptCount: 0, invoiceStatus: '未申请', pendingInvoiceAmount: 0 },
];

const formatMoney = (amount: number) => amount > 0 ? `¥ ${amount.toLocaleString()}` : '—';
const contractSignedDates: Record<string, string> = {
  'JL-01': '2026-06-28', 'JL-02': '2026-06-25', 'CDX-01': '2026-06-24', 'CDX-02': '2026-06-23',
  'WLS4-01': '2026-06-21', 'WLS4-02': '2026-06-20', 'WLS2-01': '2026-06-19', 'WLS2-02': '2026-06-18',
};

export const createProjectActionState = (): ProjectActionState => ({ dispatch: 'pending', upload: 'pending', approve: 'pending' });

function Flow({ nodes, compact = false }: { nodes: TimelineNode[]; compact?: boolean }) {
  return <div className={`pd-flow ${compact ? 'compact' : ''}`}>{nodes.map((node, index) => <div className={`pd-node ${node.status}`} key={node.nodeId}>
    <div className="pd-node-track">{index > 0 && <i className="before" />}<b>{node.status === 'completed' ? <Check /> : index + 1}</b>{index < nodes.length - 1 && <i className="after" />}</div>
    <strong>{node.title}</strong><small>{node.status === 'active' ? '当前节点' : node.status === 'completed' ? '已完成' : node.role}</small>
  </div>)}</div>;
}

export default function ProjectActionDrawer({ project, actionState, onActionStateChange, onClose, onEnterProject }: ProjectActionDrawerProps) {
  const [tab, setTab] = useState<DetailTab>('chain');
  const [contractIndex, setContractIndex] = useState(0);
  const [activeAction, setActiveAction] = useState<ProjectActionKind | null>(null);
  const [notice, setNotice] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [approvalComment, setApprovalComment] = useState('合同主体、服务范围及金额核对无误，同意进入下一审批节点。');
  const [financeData, setFinanceData] = useState<FinanceRow[]>(initialFinanceRows);
  const [financeAction, setFinanceAction] = useState<{ kind: FinanceActionKind; rowIndex: number } | null>(null);
  const [financeAmount, setFinanceAmount] = useState('');
  const [financeDate, setFinanceDate] = useState('2026-07-21');
  const [financeSerialNo, setFinanceSerialNo] = useState('');
  const [financeNote, setFinanceNote] = useState('');
  const [financeReviewComment, setFinanceReviewComment] = useState('合同与购方信息核对无误，同意开票。');
  const [financeInvoiceNo, setFinanceInvoiceNo] = useState('');
  const [financeInvoiceFile, setFinanceInvoiceFile] = useState<File | null>(null);
  const [financeSearch, setFinanceSearch] = useState('');
  const activeContract = contracts[contractIndex];
  const financeTotals = financeData.reduce((total, row) => ({ amount: total.amount + row.amount, received: total.received + row.received, invoiced: total.invoiced + row.invoiced }), { amount: 0, received: 0, invoiced: 0 });
  const activeFinanceRow = financeAction ? financeData[financeAction.rowIndex] : undefined;
  const groupedFinanceRows = useMemo(() => {
    const groups = new Map<string, Array<{ row: FinanceRow; rowIndex: number }>>();
    financeData.forEach((row, rowIndex) => {
      if (!`${row.projectName} ${row.contract}`.toLowerCase().includes(financeSearch.trim().toLowerCase())) return;
      const current = groups.get(row.projectName) ?? [];
      current.push({ row, rowIndex });
      groups.set(row.projectName, current);
    });
    return [...groups.entries()];
  }, [financeData, financeSearch]);
  const pendingCount = Object.values(actionState).filter((status) => status !== 'done').length;
  const contractTimeline = useMemo(() => contractStages.map((title, index) => ({
    nodeId: index + 1,
    title,
    role: index > activeContract.stage - 1 ? '待处理' : '经办人已完成',
    status: (index < activeContract.stage - 1 ? 'completed' : index === activeContract.stage - 1 ? 'active' : 'pending') as TimelineNode['status'],
  })), [activeContract]);

  const finishAction = (kind: ProjectActionKind, message: string, status: ProjectActionStatus = 'done') => {
    onActionStateChange({ ...actionState, [kind]: status });
    setNotice(message);
    setActiveAction(null);
    setUploadFile(null);
  };

  const openFinanceAction = (kind: FinanceActionKind, rowIndex: number) => {
    const row = financeData[rowIndex];
    setFinanceAmount(kind === 'invoice-apply' ? String(Math.max(0, row.received - row.invoiced) || row.amount - row.invoiced) : '');
    setFinanceDate('2026-07-21');
    setFinanceSerialNo(`BK${Date.now().toString().slice(-10)}`);
    setFinanceNote('');
    setFinanceReviewComment('合同与购方信息核对无误，同意开票。');
    setFinanceInvoiceNo(`FP${Date.now().toString().slice(-10)}`);
    setFinanceInvoiceFile(null);
    setFinanceAction({ kind, rowIndex });
  };

  const submitFinanceAction = () => {
    if (!financeAction || !activeFinanceRow) return;
    const amount = Number(financeAmount.replace(/,/g, ''));
    setFinanceData((current) => current.map((row, index) => {
      if (index !== financeAction.rowIndex) return row;
      if (financeAction.kind === 'receipt' && amount > 0) return {
        ...row,
        received: Math.min(row.amount, row.received + amount),
        receiptCount: row.receiptCount + 1,
        lastReceipt: { amount, date: financeDate, serialNo: financeSerialNo, note: financeNote || '未填写备注' },
      };
      if (financeAction.kind === 'plan') return { ...row, next: financeNote || row.next, nextDate: financeDate };
      if (financeAction.kind === 'invoice-apply' && amount > 0) return { ...row, pendingInvoiceAmount: Math.min(amount, row.amount - row.invoiced), invoiceStatus: '待财务审核' };
      if (financeAction.kind === 'invoice-review') return { ...row, invoiceStatus: '待开票' };
      if (financeAction.kind === 'invoice-issue' && financeInvoiceFile && financeInvoiceNo.trim()) return {
        ...row,
        invoiced: Math.min(row.amount, row.invoiced + row.pendingInvoiceAmount),
        pendingInvoiceAmount: 0,
        invoiceStatus: '已开票',
        invoiceNo: financeInvoiceNo.trim(),
        invoiceFileName: financeInvoiceFile.name,
      };
      return row;
    }));
    const messages: Record<FinanceActionKind, string> = {
      plan: '收款节点已更新，项目负责人可按节点跟进。',
      receipt: `已登记实际到账 ${formatMoney(amount)}，收款与开票台账已同步。`,
      'receipt-detail': '已查看收款明细。',
      'invoice-apply': `开票申请 ${formatMoney(amount)} 已提交财务审核。`,
      'invoice-review': '财务审核已通过，申请进入待开票。',
      'invoice-issue': `发票 ${financeInvoiceNo.trim()} 已上传，已开票金额已回写。`,
    };
    setNotice(messages[financeAction.kind]);
    setFinanceAction(null);
  };

  const rejectInvoice = () => {
    if (!financeAction) return;
    setFinanceData((current) => current.map((row, index) => index === financeAction.rowIndex ? { ...row, invoiceStatus: '已退回' } : row));
    setNotice(`开票申请已退回：${financeReviewComment || '请补充申请资料'}。`);
    setFinanceAction(null);
  };

  return createPortal(<>
    <div className="pd-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <main className="pd-page" aria-label={`${project.name}项目详情`}>
        <header className="pd-topbar">
          <button type="button" onClick={onClose} aria-label="返回项目列表"><ArrowLeft /></button>
          <div><span>项目管理</span><ChevronRight /><b>项目详情</b></div>
          <button type="button" onClick={onClose} aria-label="关闭项目详情"><X /></button>
        </header>

        <section className="pd-hero">
          <img src={auditWorkspace} alt="整齐摆放的审计项目资料与文件夹" />
          <div className="pd-hero-content">
            <h1>{project.name}</h1>
            <p>{project.client ?? '金利集团有限公司'} · {project.id} · 项目负责人 {project.owner ?? '符金雨'}</p>
            <dl>
              <div><dt>项目进度</dt><dd>{project.progress}%</dd></div>
              <div><dt>当前节点</dt><dd>{project.reportTimeline.find((node) => node.status === 'active')?.title ?? '报告编制'}</dd></div>
              <div><dt>合同</dt><dd>{contracts.length} 份</dd></div>
              <div><dt>待我处理</dt><dd>{pendingCount} 项</dd></div>
            </dl>
          </div>
        </section>

        <nav className="pd-tabs" aria-label="项目详情视图">
          {([
            ['chain', '项目链路', FileCheck2],
            ['todo', `待我处理 ${pendingCount}`, ClipboardCheck],
            ['receipt', '合同 & 收款', CircleDollarSign],
            ['invoice', '合同 & 开票', ReceiptText],
          ] as const).map(([key, label, Icon]) => <button type="button" className={tab === key ? 'active' : ''} onClick={() => setTab(key)} key={key}><Icon />{label}</button>)}
        </nav>

        <div className="pd-body">
          {tab === 'chain' && <div className="pd-chain-layout">
            <div className="pd-chain-main">
              <section className="pd-section">
                <div className="pd-section-head"><div><span className="pd-kicker">项目链路</span><h2>报告交付主流程</h2></div><p><b>当前：</b>{project.reportTimeline.find((node) => node.status === 'active')?.title ?? '报告编制'}</p></div>
                <div className="pd-scroll-flow"><Flow nodes={project.reportTimeline} /></div>
              </section>

              <section className="pd-section pd-contract-section">
                <div className="pd-section-head"><div><span className="pd-kicker">合同链路</span><h2>项目下合同</h2></div><p>{contracts.length} 份合同 · 可切换查看</p></div>
                <div className="pd-contract-switcher" role="tablist" aria-label="切换合同">
                  {contracts.map((contract, index) => <button type="button" role="tab" aria-selected={contractIndex === index} className={contractIndex === index ? 'active' : ''} onClick={() => setContractIndex(index)} key={contract.id}><span>{index + 1}</span><div><b>{contract.name}</b><small>{contract.id} · {contract.amount}</small></div><em>{contract.status}</em></button>)}
                </div>
                <div className="pd-contract-meta"><span><small>签署日期</small><b>{activeContract.signed}</b></span><span><small>合同金额</small><b>{activeContract.amount}</b></span><span><small>当前节点</small><b>{contractStages[activeContract.stage - 1]}</b></span></div>
                <div className="pd-scroll-flow"><Flow nodes={contractTimeline} compact /></div>
              </section>

              <section className="pd-section">
                <div className="pd-section-head"><div><span className="pd-kicker">打印赋码版后并行</span><h2>交付与归档并行推进</h2></div><p>从“打印赋码版”节点自动分流</p></div>
                <div className="pd-branches">
                  <div><span><b>客户交付</b><small>待发给被审计单位</small></span><em>待处理</em></div>
                  <div><span><b>报告归档</b><small>归档申请 → 归档审批 → 行政归档</small></span><em>未开始</em></div>
                  <div><span><b>合同结算</b><small>尾款确认 → 开票 → 到账核销</small></span><em>进行中</em></div>
                </div>
              </section>
            </div>

            <aside className="pd-side-summary">
              <section>
                <div className="pd-section-head"><div><span className="pd-kicker">待我处理</span><h2>优先事项</h2></div><button type="button" onClick={() => setTab('todo')}>全部</button></div>
                <div className="pd-mini-todos">{actions.slice(0, 2).map(({ kind, title, desc, due }) => <button type="button" onClick={() => setActiveAction(kind)} key={kind}><span><b>{title}</b><small>{desc}</small></span><em>{actionState[kind] === 'done' ? '已完成' : due}</em></button>)}</div>
              </section>
              <section>
                <div className="pd-section-head"><div><span className="pd-kicker">被审计单位 / 报告进度</span><h2>交付概览</h2></div></div>
                <div className="pd-audit-progress"><div><span><Building2 />被审计单位</span><b>{project.client ?? '金利集团有限公司'}</b><small>资料完整度 78% · 待补 6 项</small></div><div><span><FileCheck2 />报告进度</span><b>{project.progress}%</b><i><em style={{ width: `${project.progress}%` }} /></i><small>预计 2026-08-01 出具</small></div></div>
              </section>
              <section>
                <div className="pd-section-head"><div><span className="pd-kicker">合同摘要</span><h2>收款与开票</h2></div></div>
                <dl className="pd-finance-summary"><div><dt>合同总额</dt><dd>{formatMoney(financeTotals.amount)}</dd></div><div><dt>已收款</dt><dd>{formatMoney(financeTotals.received)}</dd></div><div><dt>已开票</dt><dd>{formatMoney(financeTotals.invoiced)}</dd></div><div><dt>待收款</dt><dd className="warn">{formatMoney(financeTotals.amount - financeTotals.received)}</dd></div></dl>
              </section>
            </aside>
          </div>}

          {tab === 'todo' && <section className="pd-single-view"><div className="pd-view-title"><div><span className="pd-kicker">待我处理</span><h2>当前项目的处理事项</h2><p>处理结果会同步更新项目与合同链路。</p></div><span>{pendingCount} 项待处理</span></div>{notice && <div className="pd-notice"><CheckCircle2 />{notice}</div>}<div className="pd-action-list">{actions.map(({ kind, title, desc, icon: Icon, due }) => { const status = actionState[kind]; return <article key={kind}><i className={status}><Icon /></i><div><h3>{title}</h3><p>{desc}</p><small>{status === 'done' ? '已完成并同步流程' : status === 'returned' ? '已退回，可重新处理' : `截止 ${due}`}</small></div><button type="button" disabled={status === 'done'} onClick={() => setActiveAction(kind)}>{status === 'done' ? <><Check />已完成</> : <>{title}<ArrowRight /></>}</button></article>; })}</div></section>}

          {(tab === 'receipt' || tab === 'invoice') && <section className="pd-single-view">
            <div className="pd-view-title"><div><span className="pd-kicker">{tab === 'receipt' ? '合同 & 收款' : '合同 & 开票'}</span><h2>{tab === 'receipt' ? '全部合同 & 收款' : '全部合同 & 开票'}</h2><p>{tab === 'receipt' ? '放大查看完整合同金额与到账记录。' : '项目负责人按合同提交开票申请并查看处理进度。'}</p></div><label className="pd-finance-search"><input aria-label="检索项目或合同" value={financeSearch} onChange={(event) => setFinanceSearch(event.target.value)} placeholder="检索项目 / 合同" /><span>{financeData.length} 份合同</span></label></div>
            {notice && <div className="pd-notice"><CheckCircle2 />{notice}</div>}
            {tab === 'receipt' && <div className="pd-grouped-finance"><div className="head"><span>项目 / 合同</span><span>签订日期</span><span>合同额</span><span>已收款</span><span>未收款</span><span>最近收款</span><span>操作</span></div>{groupedFinanceRows.map(([projectName, entries]) => {
              const totalAmount = entries.reduce((sum, entry) => sum + entry.row.amount, 0);
              const totalReceived = entries.reduce((sum, entry) => sum + entry.row.received, 0);
              return <div className="group" key={projectName}><div className="project-row"><span><b>{projectName}</b><small>{entries.length} 份合同</small></span><span>—</span><span>{formatMoney(totalAmount)}</span><span>{formatMoney(totalReceived)}</span><span>{formatMoney(totalAmount - totalReceived)}</span><span /><span>{entries.length} 份合同</span></div>{entries.map(({ row, rowIndex }) => <div className="contract-row" key={row.id}><span><i /> <b>{row.contract}</b></span><span>{contractSignedDates[row.id]}</span><span>{formatMoney(row.amount)}</span><span>{formatMoney(row.received)}</span><span>{formatMoney(row.amount - row.received)}</span><span>{row.lastReceipt ? <><b>{formatMoney(row.lastReceipt.amount)}</b><small>{row.lastReceipt.date} · {row.lastReceipt.serialNo}</small><button type="button" onClick={() => openFinanceAction('receipt-detail', rowIndex)}>查看</button></> : <small>暂无到账</small>}</span><span><button type="button" className="primary" onClick={() => openFinanceAction('receipt', rowIndex)}>登记</button></span></div>)}</div>;
            })}</div>}
            {tab === 'invoice' && <div className="pd-grouped-finance"><div className="head"><span>项目 / 合同</span><span>签订日期</span><span>合同额</span><span>已开票</span><span>未开票</span><span>关联收款</span><span>操作</span></div>{groupedFinanceRows.map(([projectName, entries]) => {
              const totalAmount = entries.reduce((sum, entry) => sum + entry.row.amount, 0);
              const totalInvoiced = entries.reduce((sum, entry) => sum + entry.row.invoiced, 0);
              const totalReceived = entries.reduce((sum, entry) => sum + entry.row.received, 0);
              const totalReceipts = entries.reduce((sum, entry) => sum + entry.row.receiptCount, 0);
              return <div className="group" key={projectName}><div className="project-row"><span><b>{projectName}</b><small>{entries.length} 份合同</small></span><span>—</span><span>{formatMoney(totalAmount)}</span><span>{formatMoney(totalInvoiced)}</span><span>{formatMoney(totalAmount - totalInvoiced)}</span><span>{formatMoney(totalReceived)} · {totalReceipts} 笔</span><span>{entries.length} 份合同</span></div>{entries.map(({ row, rowIndex }) => <div className="contract-row" key={row.id}><span><i /> <b>{row.contract}</b></span><span>{contractSignedDates[row.id]}</span><span>{formatMoney(row.amount)}</span><span>{formatMoney(row.invoiced)}</span><span>{formatMoney(row.amount - row.invoiced)}</span><span><b>{formatMoney(row.received)} · {row.receiptCount} 笔</b>{row.receiptCount > 0 && <button type="button" onClick={() => openFinanceAction('receipt-detail', rowIndex)}>查看</button>}</span><span>{row.invoiceStatus === '待财务审核' ? <button type="button" className="warning" onClick={() => openFinanceAction('invoice-review', rowIndex)}>财务审核</button> : row.invoiceStatus === '待开票' ? <button type="button" className="primary" onClick={() => openFinanceAction('invoice-issue', rowIndex)}>上传发票</button> : <button type="button" className="primary" disabled={row.invoiced >= row.amount} onClick={() => openFinanceAction('invoice-apply', rowIndex)}>{row.invoiceStatus === '已退回' ? '重新申请' : row.invoiced >= row.amount ? '已开齐' : '申请开票'}</button>}</span></div>)}</div>;
            })}</div>}
          </section>}
        </div>

        <footer className="pd-footer"><span><Users />{project.membersCount} 名项目成员在线协作</span><button type="button" onClick={onEnterProject}>进入项目群<ArrowRight /></button></footer>
      </main>
    </div>

    {financeAction && activeFinanceRow && <div className="pd-modal" role="dialog" aria-modal="true" aria-label="合同收款开票处理"><form className={financeAction.kind === 'invoice-apply' ? 'pd-invoice-application' : ''} onSubmit={(event) => { event.preventDefault(); submitFinanceAction(); }}><header><div><span>{financeAction.kind.startsWith('invoice') ? '合同 & 开票' : '合同 & 收款'}</span><h2>{{ plan: '维护收款节点', receipt: `登记 (${activeFinanceRow.projectName})`, 'receipt-detail': '收款明细', 'invoice-apply': `申请开票 (${activeFinanceRow.projectName})`, 'invoice-review': '财务审核', 'invoice-issue': '上传发票' }[financeAction.kind]}</h2><p>{financeAction.kind === 'invoice-apply' ? '先上传凭证，OCR 自动带入字段；申请人最终确认后提交财务审核。' : `${activeFinanceRow.contract} · ${formatMoney(activeFinanceRow.amount)}`}</p></div><button type="button" onClick={() => setFinanceAction(null)} aria-label="关闭"><X /></button></header><div className="pd-modal-body">
      {financeAction.kind !== 'invoice-apply' && <div className="pd-contract-check"><span><small>合同金额</small><b>{formatMoney(activeFinanceRow.amount)}</b></span><span><small>{financeAction.kind.startsWith('invoice') ? '已开票' : '已收款'}</small><b>{formatMoney(financeAction.kind.startsWith('invoice') ? activeFinanceRow.invoiced : activeFinanceRow.received)}</b></span></div>}
      {financeAction.kind === 'plan' && <><label>节点名称 / 条件<input type="text" value={financeNote} placeholder={activeFinanceRow.next} onChange={(event) => setFinanceNote(event.target.value)} /></label><label>计划收款日期<input type="date" value={financeDate} onChange={(event) => setFinanceDate(event.target.value)} /></label></>}
      {financeAction.kind === 'receipt' && <><label>本次到账金额<input type="number" min="0.01" max={activeFinanceRow.amount - activeFinanceRow.received} value={financeAmount} onChange={(event) => setFinanceAmount(event.target.value)} placeholder="请输入实际到账金额" /></label><label>到账日期<input type="date" value={financeDate} onChange={(event) => setFinanceDate(event.target.value)} /></label><label>银行流水号<input type="text" value={financeSerialNo} onChange={(event) => setFinanceSerialNo(event.target.value)} /></label><label>备注<textarea rows={3} value={financeNote} onChange={(event) => setFinanceNote(event.target.value)} placeholder="例如：首期款、部分回款、尾款…" /></label><label className="pd-upload"><input type="file" accept=".pdf,image/*" /><Upload /><b>上传收款凭证</b><small>银行回单或流水截图</small></label></>}
      {financeAction.kind === 'receipt-detail' && (activeFinanceRow.lastReceipt ? <div className="pd-receipt-detail"><span><small>本次到账</small><b>{formatMoney(activeFinanceRow.lastReceipt.amount)}</b></span><span><small>收款日期</small><b>{activeFinanceRow.lastReceipt.date}</b></span><span><small>银行流水</small><b>{activeFinanceRow.lastReceipt.serialNo}</b></span><span><small>备注</small><b>{activeFinanceRow.lastReceipt.note}</b></span></div> : <p className="pd-empty">暂无收款记录</p>)}
      {financeAction.kind === 'invoice-apply' && <><div className="pd-invoice-stats"><span><small>合同额</small><b>{formatMoney(activeFinanceRow.amount)}</b></span><span><small>已收款</small><b>{formatMoney(activeFinanceRow.received)}</b></span><span><small>已开票</small><b>{formatMoney(activeFinanceRow.invoiced)}</b></span><span><small>未收款</small><b>{formatMoney(activeFinanceRow.amount - activeFinanceRow.received)}</b></span></div><section className="pd-invoice-form"><h3>开票信息确认</h3><div><label>合同编号<input type="text" defaultValue={activeFinanceRow.id === 'JL-01' ? 'JL-CPA-20260625' : activeFinanceRow.id} /></label><label>客户名称<input type="text" defaultValue={activeFinanceRow.projectName} /></label><label>本次开票金额<input type="number" min="0.01" max={activeFinanceRow.amount - activeFinanceRow.invoiced} value={financeAmount} onChange={(event) => setFinanceAmount(event.target.value)} /></label><label>发票类型<select defaultValue="专票"><option>专票</option><option>普票</option></select></label><label>购方名称<input type="text" defaultValue={activeFinanceRow.projectName} /></label><label>纳税人识别号<input type="text" defaultValue="91310000MA1KJL2026" /></label><label>开票内容 / 税率<input type="text" defaultValue="审计服务费 / 6%" /></label><label>开户银行<input type="text" defaultValue="招商银行上海分行营业部" /></label><label>银行账号<input type="text" defaultValue="3109 0000 2607 0108" /></label><label>联系电话<input type="text" defaultValue="021-6899 2026" /></label><label className="wide">注册地址<input type="text" defaultValue="上海市浦东新区世纪大道 88 号金利中心 26 层" /></label><label>收款日期<input type="text" defaultValue={activeFinanceRow.lastReceipt?.date || '待关联收款'} /></label><label>收款金额<input type="text" defaultValue={formatMoney(activeFinanceRow.received)} /></label><label>发票接收方式<select defaultValue="电子发票"><option>电子发票</option><option>纸质发票</option></select></label><label>接收邮箱 / 邮寄地址<input type="text" defaultValue="finance@jinli.com" /></label><label>申请人 / 申请日期<input type="text" defaultValue="汪欣 / 2026-07-03" /></label><label className="wide">备注<input type="text" value={financeNote} onChange={(event) => setFinanceNote(event.target.value)} placeholder="本次按已到账金额申请开票，提交财务复核。" /></label></div></section>{Number(financeAmount) > activeFinanceRow.received && <p className="pd-risk">其中 {formatMoney(Number(financeAmount) - activeFinanceRow.received)} 为先票后款，财务审核时将重点确认。</p>}</>}
      {financeAction.kind === 'invoice-review' && <><div className="pd-invoice-link"><span><small>申请金额</small><b>{formatMoney(activeFinanceRow.pendingInvoiceAmount)}</b></span><span><small>关联收款</small><b>{formatMoney(Math.min(activeFinanceRow.received, activeFinanceRow.pendingInvoiceAmount))}</b></span></div><label>审批意见<textarea rows={4} value={financeReviewComment} onChange={(event) => setFinanceReviewComment(event.target.value)} /></label></>}
      {financeAction.kind === 'invoice-issue' && <><label>发票号码<input type="text" value={financeInvoiceNo} onChange={(event) => setFinanceInvoiceNo(event.target.value)} /></label><label>开票日期<input type="date" value={financeDate} onChange={(event) => setFinanceDate(event.target.value)} /></label><label className="pd-upload"><input type="file" accept=".pdf,image/*" onChange={(event) => setFinanceInvoiceFile(event.target.files?.[0] ?? null)} /><Upload />{financeInvoiceFile ? <><b>{financeInvoiceFile.name}</b><small>发票文件已选择</small></> : <><b>选择发票文件</b><small>支持 PDF 或图片</small></>}</label></>}
    </div><footer>{financeAction.kind === 'invoice-review' && <button type="button" className="reject" onClick={rejectInvoice}>退回补充</button>}<span /><button type="button" onClick={() => setFinanceAction(null)}>{financeAction.kind === 'receipt-detail' ? '关闭' : '取消'}</button>{financeAction.kind !== 'receipt-detail' && <button type="submit" className="primary" disabled={(financeAction.kind === 'receipt' || financeAction.kind === 'invoice-apply') && (!financeAmount || Number(financeAmount) <= 0) || financeAction.kind === 'invoice-issue' && (!financeInvoiceFile || !financeInvoiceNo.trim())}>{financeAction.kind === 'invoice-review' ? '通过审核' : financeAction.kind === 'invoice-issue' ? '完成开票' : '确认提交'}</button>}</footer></form></div>}

    {activeAction && <div className="pd-modal" role="dialog" aria-modal="true" aria-label={actions.find((action) => action.kind === activeAction)?.title}><form onSubmit={(event) => { event.preventDefault(); if (activeAction === 'dispatch') finishAction('dispatch', '底稿已派发给吴立松，截止时间为 2026-07-25。'); if (activeAction === 'upload' && uploadFile) finishAction('upload', `合同“${uploadFile.name}”已上传并提交审核。`); if (activeAction === 'approve') finishAction('approve', '合同已审批通过，并流转至下一审批节点。'); }}><header><div><span>处理事项</span><h2>{actions.find((action) => action.kind === activeAction)?.title}</h2><p>{project.name} · {project.id}</p></div><button type="button" onClick={() => setActiveAction(null)} aria-label="关闭"><X /></button></header><div className="pd-modal-body">
      {activeAction === 'dispatch' && <><label>底稿任务<select><option>货币资金循环审计底稿</option><option>收入与成本循环审计底稿</option></select></label><label>执行成员<select><option>吴立松</option><option>汪欣</option><option>蔡宇豪</option></select></label><label>截止时间<input type="date" defaultValue="2026-07-25" /></label></>}
      {activeAction === 'upload' && <label className="pd-upload"><input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /><Upload />{uploadFile ? <><b>{uploadFile.name}</b><small>已完成文件校验</small></> : <><b>选择合同文件</b><small>支持 PDF、Word，单个文件不超过 20MB</small></>}</label>}
      {activeAction === 'approve' && <><div className="pd-contract-check"><span><small>合同名称</small><b>{activeContract.name}</b></span><span><small>合同金额</small><b>{activeContract.amount}</b></span></div><label>审批意见<textarea value={approvalComment} onChange={(event) => setApprovalComment(event.target.value)} rows={4} /></label></>}
    </div><footer>{activeAction === 'approve' && <button type="button" className="reject" onClick={() => finishAction('approve', '合同已退回经办人补充材料。', 'returned')}>退回补充</button>}<span /><button type="button" onClick={() => setActiveAction(null)}>取消</button><button type="submit" className="primary" disabled={activeAction === 'upload' && !uploadFile}>确认提交</button></footer></form></div>}
  </>, document.body);
}
