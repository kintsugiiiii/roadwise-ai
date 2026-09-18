import { useMemo, useState } from 'react';
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Filter,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  Send,
  Upload,
  Users,
  X,
} from 'lucide-react';
import logo from './assets/huaxiaoan-logo.png';
import './project-leader.css';
import './project-actions.css';

type Status = '进行中' | '待处理' | '已完成';
type Project = {
  id: string;
  name: string;
  client: string;
  type: string;
  owner: string;
  progress: number;
  todo: number;
  due: string;
  status: Status;
  stage: number;
};
type ActionKind = 'dispatch' | 'upload' | 'approve';
type ActionStatus = 'pending' | 'done' | 'returned';
type ProjectActionState = Record<ActionKind, ActionStatus>;

const initial: Project[] = [
  { id: 'PJ-001', name: '金利集团有限公司', client: '金利集团有限公司', type: '专项审计', owner: '符金雨', progress: 68, todo: 2, due: '2026-07-30', status: '进行中', stage: 5 },
  { id: 'PJ-002', name: 'Codex-E2E-CPA-20260623', client: 'Codex有限公司', type: '年报审计', owner: '陈华', progress: 45, todo: 1, due: '2026-07-25', status: '待处理', stage: 6 },
  { id: 'PJ-003', name: 'WLS测试项目3', client: 'WLS科技有限公司', type: '财务审计', owner: '蔡宇豪', progress: 25, todo: 3, due: '2026-08-15', status: '进行中', stage: 3 },
  { id: 'PJ-004', name: 'WLS测试项目4', client: 'WLS科技有限公司', type: '社保审计', owner: '陈嘉妍', progress: 100, todo: 0, due: '2026-07-10', status: '已完成', stage: 8 },
  { id: 'PJ-005', name: '华小安内部审计2026', client: '华小安科技', type: '内部审计', owner: '张婷婷', progress: 55, todo: 2, due: '2026-07-28', status: '待处理', stage: 5 },
];

const tabs = ['全部项目', '我的项目', '待我处理', '即将逾期', '已完成', '归档'];
const stages = ['创建项目', '成员同步', '底稿计划', '写底稿', '写报告', '报告一审', '报告二审', '报告三审'];
const emptyActionState = (): ProjectActionState => ({ dispatch: 'pending', upload: 'pending', approve: 'pending' });

export default function ProjectLeaderApp() {
  const [projects, setProjects] = useState(initial);
  const [tab, setTab] = useState(tabs[0]);
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, ProjectActionState>>({});
  const [assignee, setAssignee] = useState('吴立松');
  const [workpaper, setWorkpaper] = useState('货币资金循环审计底稿');
  const [deadline, setDeadline] = useState('2026-07-25');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [approvalComment, setApprovalComment] = useState('合同主体、服务范围及金额核对无误，同意进入下一审批节点。');
  const [notice, setNotice] = useState('');

  const detail = projects.find((project) => project.id === detailId) ?? null;
  const detailActions = detail ? actionStates[detail.id] ?? emptyActionState() : emptyActionState();
  const visible = useMemo(() => projects.filter((project) => {
    const matchesTab = tab === '全部项目'
      || (tab === '我的项目' && project.owner === '符金雨')
      || (tab === '待我处理' && project.status === '待处理')
      || (tab === '即将逾期' && project.due < '2026-08-01')
      || (tab === '已完成' && project.status === '已完成');
    const matchesQuery = `${project.name}${project.client}${project.owner}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilters = Object.values(filters).every((value) => !value || value === '全部' || `${project.status}${project.type}${project.owner}${project.client}`.includes(String(value)));
    return matchesTab && matchesQuery && matchesFilters;
  }), [projects, tab, query, filters]);

  const createProject = () => {
    const name = prompt('项目名称');
    if (!name) return;
    setProjects((current) => [{ id: `PJ-${Date.now()}`, name, client: '待补充客户', type: '专项审计', owner: '符金雨', progress: 0, todo: 3, due: '2026-09-01', status: '进行中', stage: 0 }, ...current]);
  };

  const openDetail = (project: Project) => {
    setDetailId(project.id);
    setActiveAction(null);
    setNotice('');
  };

  const finishAction = (kind: ActionKind, message: string, status: ActionStatus = 'done') => {
    if (!detail) return;
    setActionStates((current) => ({
      ...current,
      [detail.id]: { ...(current[detail.id] ?? emptyActionState()), [kind]: status },
    }));
    if (status === 'done') {
      setProjects((current) => current.map((project) => project.id === detail.id
        ? { ...project, todo: Math.max(0, project.todo - 1), status: project.todo <= 1 && project.status === '待处理' ? '进行中' : project.status }
        : project));
    }
    setNotice(message);
    setActiveAction(null);
    setUploadFile(null);
  };

  const actionItems = [
    { kind: 'dispatch' as const, icon: Send, title: '派发底稿', description: '选择底稿、负责人和截止时间，派发后同步到成员待办。' },
    { kind: 'upload' as const, icon: Upload, title: '上传合同', description: '上传拟审合同或盖章扫描件，完成格式校验并提交。' },
    { kind: 'approve' as const, icon: ClipboardCheck, title: '审批合同', description: '核对合同关键信息，填写意见后同意或退回。' },
  ];

  return <div className="hx-app">
    <aside className="hx-side">
      <img src={logo} alt="华小安" />
      <div className="hx-mode"><button>Chat</button><button className="on">Work</button></div>
      {[['工作台', LayoutDashboard], ['项目协作', Users], ['项目日历', CalendarDays], ['我的待办', Check]].map(([name, IconValue]) => { const Icon = IconValue as typeof Bell; return <button className={name === '工作台' ? 'nav on' : 'nav'} key={String(name)}><Icon /> {String(name)}{name === '我的待办' && <b>42</b>}</button>; })}
      <div className="groups"><strong>项目分组</strong><button className="on"><FolderKanban /> 全部项目 <b>1248</b></button><button><FolderKanban /> 审计项目</button><button><FolderKanban /> 财务项目</button></div>
      <div className="hx-user"><i>符</i><span><b>符金雨</b><small>项目经理</small></span></div>
    </aside>
    <main className="hx-main">
      <header><div><h1>工作台</h1><small>全部项目 <b>1,248</b> 个</small></div><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索项目名称、编号、客户、负责人..." /></label><button className="bell" aria-label="通知"><Bell /><b>12</b></button><button className="primary" onClick={createProject}><Plus />新建项目<ChevronDown /></button></header>
      <section className="metrics">{[[FolderKanban, '全部项目', '1,248', 'violet'], [CalendarDays, '进行中', '386', 'blue'], [Users, '待我处理', '42', 'orange'], [CalendarDays, '即将逾期', '18', 'red'], [Check, '已完成', '802', 'green'], [BriefcaseBusiness, '本月完成', '126', 'blue']].map(([IconValue, name, value, color]) => { const Icon = IconValue as typeof Bell; return <article key={String(name)}><i className={String(color)}><Icon /></i><span>{String(name)}<b>{String(value)}</b><small>较昨日 +24</small></span></article>; })}</section>
      <section className="ledger">
        <nav>{tabs.map((item) => <button className={tab === item ? 'on' : ''} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav>
        <div className="filters">{[['项目状态', ['全部', '进行中', '待处理', '已完成']], ['项目类型', ['全部', '专项审计', '年报审计', '财务审计']], ['负责人', ['全部', '符金雨', '陈华', '蔡宇豪']], ['客户', ['全部', '金利集团有限公司', 'WLS科技有限公司']]].map(([name, options]) => <label key={String(name)}>{String(name)}<select onChange={(event) => setFilters((current) => ({ ...current, [String(name)]: event.target.value }))}>{(options as string[]).map((option) => <option key={option}>{option}</option>)}</select></label>)}<label>开始时间<input type="date" /></label><label>截止时间<input type="date" /></label><button><Filter />更多筛选</button></div>
        <div className="table"><div className="thead"><span>项目名称</span><span>客户</span><span>项目类型</span><span>负责人</span><span>当前阶段</span><span>进度</span><span>待处理</span><span>截止日期</span><span>状态</span><span>操作</span></div>{visible.map((project) => <div className="tr" key={project.id}><button className="name" onClick={() => openDetail(project)}>☆ <i><FileText /></i><b>{project.name}<small>{project.id}</small></b></button><span>{project.client}</span><em>{project.type}</em><span>{project.owner}</span><div className="steps">{Array.from({ length: 8 }, (_, index) => <i className={index < project.stage ? 'done' : index === project.stage ? 'now' : ''} key={index} />)}</div><span>{project.progress}%<b className="bar" style={{ width: `${project.progress}%` }} /></span><span className={project.todo ? 'urgent' : ''}>{project.todo} 项</span><span>{project.due}</span><em className={project.status}>{project.status}</em><button className="enter" onClick={() => openDetail(project)}>{project.status === '已完成' ? '查看详情' : '进入项目'}</button></div>)}</div>
      </section>
    </main>

    {detail && <div className="drawer" onMouseDown={(event) => event.target === event.currentTarget && setDetailId(null)}><section aria-label={`${detail.name}项目详情`}><button className="close" onClick={() => setDetailId(null)} aria-label="关闭项目详情"><X /></button><h2>{detail.name}</h2><small>项目 ID：{detail.id}</small><div className="detail-stats"><b>交付进度<strong>{detail.progress}%</strong></b><b>报告数量<strong>0/1</strong></b><b>项目成员<strong>3人</strong></b></div>
      <div className="detail-section-title"><div><h3>待我处理</h3><p>可直接在当前项目内完成操作，处理结果会同步到项目流程。</p></div><span>{Object.values(detailActions).filter((status) => status !== 'done').length} 项待处理</span></div>
      {notice && <div className="action-notice"><CheckCircle2 />{notice}</div>}
      <div className="project-actions">{actionItems.map(({ kind, icon: Icon, title, description }) => { const status = detailActions[kind]; return <article key={kind} className={status === 'done' ? 'completed' : status === 'returned' ? 'returned' : ''}><i><Icon /></i><div><h4>{title}</h4><p>{description}</p><small>{status === 'done' ? '已完成' : status === 'returned' ? '已退回，可重新处理' : '待处理'}</small></div><button disabled={status === 'done'} onClick={() => setActiveAction(kind)}>{status === 'done' ? <><Check />已完成</> : `${title} →`}</button></article>; })}</div>
      <h3>报告主链路</h3><div className="flow">{stages.map((stage, index) => <div className={index < detail.stage ? 'done' : index === detail.stage ? 'now' : ''} key={stage}>{stage}<small>{index < detail.stage ? '已完成' : index === detail.stage ? '当前节点' : '待处理'}</small></div>)}</div><button className="go" onClick={() => alert(`进入项目群：${detail.name}`)}>进入项目协作空间 →</button></section></div>}

    {activeAction && detail && <div className="action-modal" role="dialog" aria-modal="true" aria-label={actionItems.find((item) => item.kind === activeAction)?.title}><form onSubmit={(event) => { event.preventDefault(); if (activeAction === 'dispatch') finishAction('dispatch', `底稿已派发给${assignee}，截止时间为 ${deadline}。`); if (activeAction === 'upload' && uploadFile) finishAction('upload', `合同“${uploadFile.name}”已上传并提交审核。`); if (activeAction === 'approve') finishAction('approve', '合同已审批通过，并流转至下一审批节点。'); }}><header><div><i>{activeAction === 'dispatch' ? <Send /> : activeAction === 'upload' ? <Upload /> : <ClipboardCheck />}</i><span><h3>{actionItems.find((item) => item.kind === activeAction)?.title}</h3><small>{detail.name} · {detail.id}</small></span></div><button type="button" onClick={() => { setActiveAction(null); setUploadFile(null); }} aria-label="关闭"><X /></button></header>
      {activeAction === 'dispatch' && <div className="modal-fields"><label>底稿任务<select value={workpaper} onChange={(event) => setWorkpaper(event.target.value)}><option>货币资金循环审计底稿</option><option>收入与成本循环审计底稿</option><option>合同合规性复核底稿</option></select></label><label>执行成员<select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option>吴立松</option><option>汪欣</option><option>蔡宇豪</option></select></label><label>截止时间<input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} required /></label><label>任务说明<textarea defaultValue={`请按审计计划完成“${workpaper}”，上传支撑材料并提交复核。`} rows={3} /></label></div>}
      {activeAction === 'upload' && <div className="modal-fields"><div className="task-context"><b>上传合同文件</b><span>支持 PDF、Word，单个文件不超过 20MB</span></div><label className={`upload-zone ${uploadFile ? 'has-file' : ''}`}><input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} /><Upload />{uploadFile ? <><b>{uploadFile.name}</b><span>{(uploadFile.size / 1024 / 1024).toFixed(2)} MB · 已完成安全校验</span></> : <><b>点击选择合同，或拖拽到此处</b><span>合同原件、拟审稿或盖章扫描件</span></>}</label></div>}
      {activeAction === 'approve' && <div className="modal-fields"><div className="contract-summary"><span><small>合同项目</small><b>{detail.name}-审计服务合同</b></span><span><small>合同金额</small><b>¥ 1,000,000.00</b></span><span><small>经办人</small><b>{detail.owner}</b></span><span><small>签署主体</small><b>{detail.client}</b></span></div><label>审批意见<textarea value={approvalComment} onChange={(event) => setApprovalComment(event.target.value)} rows={4} required /></label><div className="signature"><span>审批人电子签名</span><b>符金雨</b></div></div>}
      <footer>{activeAction === 'approve' && <button type="button" className="reject" onClick={() => finishAction('approve', '合同已退回经办人补充材料，可在当前项目重新审批。', 'returned')}>拒绝并退回</button>}<span /><button type="button" className="cancel" onClick={() => { setActiveAction(null); setUploadFile(null); }}>取消</button><button type="submit" className="confirm" disabled={activeAction === 'upload' && !uploadFile}>{activeAction === 'dispatch' ? '确认派发' : activeAction === 'upload' ? '确认提交' : '确认同意审批'}</button></footer>
    </form></div>}
  </div>;
}
