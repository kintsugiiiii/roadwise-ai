import { useEffect, useState } from 'react';
import { Calendar, Check, ChevronDown, ChevronLeft, Maximize2, PanelRight, PanelTop, Plus, PlusCircle, Search, X } from 'lucide-react';
import WorkbenchView from './components/WorkbenchView';
import { initialProjects } from './data';
import { Project } from './types';
import huaxiaoanLogo from './assets/huaxiaoan-logo.png?inline';

const emptyProjectForm = { name: '', code: '', client: '', startDate: '2026/06/30', endDate: '', manager: '符金雨', department: 'huaxiaoan-test', primaryType: '', detailType: '', amount: '', requiresReport: true, summary: '' };
const memberOptions = [
  ['张华轩', '张', '项目成员'], ['邱条芬', '邱', '项目成员'], ['ceshi4', 'A', '项目成员'], ['ceshi3', 'A', '项目成员'], ['ceshi2', 'A', '项目成员'], ['ceshi', '测', '项目成员'], ['蔡宇豪', '蔡', '产品经理'], ['陈华', '陈', '开发工程师'], ['陈嘉妍', '陈', '测试工程师'],
];
const defaultMembers = ['张华轩', '邱条芬', 'ceshi4', 'ceshi3', 'ceshi2', 'ceshi'];
const employeeOptions = [
  ['agent-shebao', '社保专项审计', '社', '社保稽核专项审计助手'], ['agent-人事', '行政人事管理', '人', '行政人事合同管理助手'], ['agent-年报', '事业单位年报审计', '审', '事业单位年报审计助手'], ['agent-会计', '财务助手', '财', '专业财务合规助手'],
];

const goHome = (suffix = '') => {
  const homePage = window.location.protocol === 'file:' ? './华小安智能工作台完整.html' : './';
  window.location.href = `${homePage}${suffix}`;
};

export default function StandaloneWorkbenchApp() {
  const params = new URLSearchParams(window.location.search);
  const detailId = params.get('detail');
  const [scale, setScale] = useState(1);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(defaultMembers);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  const closeNewProject = () => {
    setShowNewProject(false);
    setProjectForm(emptyProjectForm);
    setSelectedMembers(defaultMembers);
    setSelectedEmployees([]);
    setMemberSearch('');
    setEmployeeSearch('');
  };

  const createProject = () => {
    if (!projectForm.name.trim()) return;
    const project = {
      id: `proj-proj-${Date.now()}`,
      name: projectForm.name.trim(),
      shortName: projectForm.name.trim(),
      logoChar: projectForm.name.trim().slice(0, 1),
      client: projectForm.client.trim() || '待补充客户',
      projectType: projectForm.detailType || projectForm.primaryType || '专项审计',
      owner: '符金雨',
      todo: 0,
      due: projectForm.endDate || undefined,
      stage: 1,
      membersCount: 1 + selectedMembers.length,
      aiCount: 1 + selectedEmployees.length,
      status: '进行中',
      unreadCount: 0,
      progress: 0,
      reportCount: '0/1',
      members: [],
      agents: [],
      messages: [],
      reportTimeline: [],
      timeline: [],
    } as Project;
    setProjects((current) => [project, ...current]);
    closeNewProject();
  };

  useEffect(() => {
    const fitToViewport = () => {
      setScale(Math.min(window.innerWidth / 1376, window.innerHeight / 960));
    };

    fitToViewport();
    window.addEventListener('resize', fitToViewport);
    return () => window.removeEventListener('resize', fitToViewport);
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#eaecef] antialiased">
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden"
        style={{ width: `${1376 * scale}px`, height: `${960 * scale}px` }}
      >
        <div
          className="absolute left-0 top-0 flex h-[960px] w-[1376px] shrink-0 flex-col overflow-hidden rounded-3xl border border-gray-200/50 bg-[#f3f5f8] shadow-2xl"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#d8dbe5] bg-[#f0f1f7]/92 px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <PanelTop className="h-4 w-4 text-gray-500" />
              <img src={huaxiaoanLogo} alt="华小安" className="h-8 w-8 object-contain" />
              <button type="button" onClick={() => goHome()} className="grid h-7 w-7 place-items-center rounded-lg text-gray-500 transition-colors hover:bg-white/70 hover:text-gray-700" aria-label="返回华小安">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => goHome()} className="h-8 px-3 text-[11px] font-bold text-[#4166bd] hover:text-[#244ea8]">返回工作首页</button>
              <button type="button" className="grid h-8 w-8 place-items-center text-gray-400" aria-label="适配窗口"><Maximize2 className="h-3.5 w-3.5" /></button>
              <button type="button" className="grid h-8 w-8 place-items-center text-gray-700" aria-label="切换分栏"><PanelRight className="h-4 w-4" /></button>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <WorkbenchView
              tasks={[]}
              contracts={[]}
              projects={projects}
              onOpenProject={(projectId) => goHome(`?project=${encodeURIComponent(projectId)}`)}
              onAuditTask={() => undefined}
              onNewProject={() => setShowNewProject(true)}
              openProjectDetailId={detailId}
            />
          </div>
          {showNewProject && (
            <div className="absolute inset-0 z-50 grid place-items-center bg-[#182238]/45 p-6" onMouseDown={closeNewProject}>
              <section role="dialog" aria-modal="true" aria-labelledby="new-cpa-project-title" className="flex max-h-[880px] w-full max-w-[760px] flex-col overflow-hidden rounded-xl bg-[#f8f9fc] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
                <header className="flex items-start justify-between border-b border-[#e3e7ee] px-5 py-4">
                  <div><h2 id="new-cpa-project-title" className="text-base font-black text-[#263a59]">新建项目</h2><p className="mt-1 text-[10px] font-semibold text-[#8491a4]">创建后直接加入 CPA 工作台</p></div>
                  <button type="button" onClick={closeNewProject} aria-label="关闭" className="grid h-8 w-8 place-items-center rounded-md text-[#7b8798] hover:bg-[#edf0f4]"><X className="h-4 w-4" /></button>
                </header>
                <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-4 gap-y-4 overflow-y-auto px-5 py-5 custom-scrollbar">
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">项目名称<input autoFocus value={projectForm.name} onChange={(event) => setProjectForm((form) => ({ ...form, name: event.target.value }))} className="h-10 rounded-lg border border-[#d9e0e9] bg-white px-3 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="例如：金利集团年度审计" /></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">项目编号<input value={projectForm.code} onChange={(event) => setProjectForm((form) => ({ ...form, code: event.target.value }))} className="h-10 rounded-lg border border-[#d9e0e9] bg-white px-3 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="不填则自动生成" /></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">计划开始日期<div className="relative"><input value={projectForm.startDate} onChange={(event) => setProjectForm((form) => ({ ...form, startDate: event.target.value }))} className="h-10 w-full rounded-lg border border-[#d9e0e9] bg-white px-3 pr-9 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" /><Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-500" /></div></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">计划结束日期<div className="relative"><input value={projectForm.endDate} onChange={(event) => setProjectForm((form) => ({ ...form, endDate: event.target.value }))} className="h-10 w-full rounded-lg border border-[#d9e0e9] bg-white px-3 pr-9 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="年 / 月 / 日" /><Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-500" /></div></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">委托方<input value={projectForm.client} onChange={(event) => setProjectForm((form) => ({ ...form, client: event.target.value }))} className="h-10 rounded-lg border border-[#d9e0e9] bg-white px-3 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="例如：金利集团有限公司" /></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">项目经理<span className="flex h-10 items-center justify-between rounded-lg border border-[#d9e0e9] bg-white px-3"><span className="flex items-center gap-2"><b className="grid h-7 w-7 place-items-center rounded-full bg-gray-200 text-xs">符</b>{projectForm.manager}</span><small className="text-[9px] text-gray-400">当前创建人</small></span></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">所属部门<div className="relative"><input value={projectForm.department} onChange={(event) => setProjectForm((form) => ({ ...form, department: event.target.value }))} className="h-10 w-full rounded-lg border border-[#d9e0e9] bg-white px-3 pr-9 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" /><ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" /></div></label>

                  <div className="col-span-2 grid gap-2"><div className="flex items-end justify-between"><div><b className="text-[11px] text-[#4d5f78]">业务类型</b><p className="mt-1 text-[9px] font-semibold text-gray-500">选择一级业务类型和项目详细类型。</p></div><button type="button" className="flex h-8 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-bold text-gray-600"><PlusCircle className="h-3.5 w-3.5" />添加业务类型</button></div><div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-[#f5f6f9] p-3"><label className="grid gap-1.5 text-[10px] font-bold text-[#4d5f78]">业务类型 1（主）<select value={projectForm.primaryType} onChange={(event) => setProjectForm((form) => ({ ...form, primaryType: event.target.value }))} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700"><option value="">请选择项目类型</option><option>审计服务</option><option>税务服务</option><option>咨询服务</option></select></label><label className="grid gap-1.5 text-[10px] font-bold text-[#4d5f78]">项目详细类型<select value={projectForm.detailType} onChange={(event) => setProjectForm((form) => ({ ...form, detailType: event.target.value }))} className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700"><option value="">请选择详细类型</option><option>专项审计</option><option>年报审计</option><option>财务审计</option><option>内部审计</option><option>社保审计</option></select></label></div></div>

                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">项目协议金额<input value={projectForm.amount} onChange={(event) => setProjectForm((form) => ({ ...form, amount: event.target.value }))} className="h-10 rounded-lg border border-[#d9e0e9] bg-white px-3 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="例如：100000" /></label>
                  <label className="grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">报告要求<button type="button" onClick={() => setProjectForm((form) => ({ ...form, requiresReport: !form.requiresReport }))} className="flex h-10 items-center gap-2 rounded-lg border border-[#d9e0e9] bg-white px-3 text-xs font-bold text-gray-700"><span className={`grid h-4 w-4 place-items-center rounded ${projectForm.requiresReport ? 'bg-[#0f8bdc] text-white' : 'border border-gray-300 text-transparent'}`}><Check className="h-3 w-3" /></span>出具报告</button></label>
                  <label className="col-span-2 grid gap-1.5 text-[11px] font-bold text-[#4d5f78]">项目概况<textarea value={projectForm.summary} onChange={(event) => setProjectForm((form) => ({ ...form, summary: event.target.value }))} className="h-20 resize-none rounded-lg border border-[#d9e0e9] bg-white px-3 py-2 text-xs font-semibold text-[#30445f] outline-none focus:border-[#6f8fd4]" placeholder="补充项目背景、范围或关键事项" /></label>

                  <div className="col-span-2 grid gap-2"><div className="flex items-center justify-between"><b className="text-[11px] text-[#4d5f78]">项目成员</b><label className="relative w-56"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" /><input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} className="h-8 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-2 text-[10px]" placeholder="搜索项目成员" /></label></div><div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 custom-scrollbar">{memberOptions.filter(([name, , role]) => `${name} ${role}`.toLowerCase().includes(memberSearch.toLowerCase())).map(([name, avatar, role]) => { const selected = selectedMembers.includes(name); return <button type="button" key={name} onClick={() => setSelectedMembers((items) => selected ? items.filter((item) => item !== name) : [...items, name])} className={`flex h-9 items-center gap-2 rounded-lg px-2 text-left ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}><span className="grid h-7 w-7 place-items-center rounded-full bg-gray-200 text-[10px] font-black">{avatar}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] text-gray-700">{name}</b><small className="text-[8px] text-gray-400">{role}</small></span>{selected && <Check className="h-3.5 w-3.5 text-[#0052d9]" />}</button>; })}</div></div>

                  <div className="col-span-2 grid gap-2"><div className="flex items-end justify-between"><div><b className="text-[11px] text-[#4d5f78]">数字员工</b><p className="mt-1 text-[9px] font-semibold text-gray-500">默认不添加，可从线上智能体中选择。</p></div><span className="text-[10px] font-semibold text-gray-500">已选 {selectedEmployees.length}</span></div><div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3"><label className="relative"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" /><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} className="h-8 w-full rounded-lg border border-gray-200 pl-8 pr-2 text-[10px]" placeholder="搜索线上智能体" /></label><div className="grid grid-cols-2 gap-2">{employeeOptions.filter(([, name, , desc]) => `${name} ${desc}`.toLowerCase().includes(employeeSearch.toLowerCase())).map(([id, name, avatar, desc]) => { const selected = selectedEmployees.includes(id); return <button type="button" key={id} onClick={() => setSelectedEmployees((items) => selected ? items.filter((item) => item !== id) : [...items, id])} className={`flex items-center gap-2 rounded-lg p-2 text-left ${selected ? 'bg-blue-50 ring-1 ring-blue-100' : 'hover:bg-gray-50'}`}><span className="grid h-8 w-8 place-items-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">{avatar}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px] text-gray-700">{name}</b><small className="block truncate text-[8px] text-gray-400">{desc}</small></span><span className={selected ? 'text-[#0052d9]' : 'text-gray-400'}>+</span></button>; })}</div></div></div>
                </div>
                <footer className="flex items-center justify-end gap-2 border-t border-[#e3e7ee] bg-white px-5 py-3">
                  <button type="button" onClick={closeNewProject} className="h-9 rounded-lg px-4 text-xs font-bold text-[#69778b] hover:bg-[#f1f3f6]">取消</button>
                  <button type="button" disabled={!projectForm.name.trim()} onClick={createProject} className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1f5eea] px-4 text-xs font-black text-white hover:bg-[#174fc9] disabled:bg-[#cbd3df]"><Plus className="h-4 w-4" />创建项目</button>
                </footer>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
