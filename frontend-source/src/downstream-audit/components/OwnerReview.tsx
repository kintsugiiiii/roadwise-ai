import React, { useMemo, useState } from 'react';
import { Check, List, Network, Search } from 'lucide-react';

interface OwnerReviewProps {
  workflowProgress: number;
  projectName: string;
  nodeAssignments: Record<string, string>;
  taskDecisions: Record<string, string>;
}

type MonitorStatus = '已通过' | '处理中' | '待审核';

const monitoredTags = [
  { id: 'rs1', code: 'RS-01', label: '收入异常', kind: '风险信号', x: 95, y: 72, color: '#36b9c3' },
  { id: 'rs2', code: 'RS-02', label: '账龄恶化', kind: '风险信号', x: 95, y: 162, color: '#36b9c3' },
  { id: 'rs3', code: 'RS-03', label: '存货增长', kind: '风险信号', x: 95, y: 252, color: '#36b9c3' },
  { id: 'rs4', code: 'RS-04', label: '资金异常', kind: '风险信号', x: 95, y: 342, color: '#36b9c3' },
  { id: 'and1', code: 'AND-01', label: '虚增收入', kind: '复合风险', x: 265, y: 112, color: '#d95b63' },
  { id: 'ct1', code: 'CT-01', label: '出货审批', kind: '内控测试', x: 405, y: 182, color: '#55c83e' },
  { id: 'ct2', code: 'CT-02', label: '盘点控制', kind: '内控测试', x: 405, y: 302, color: '#55c83e' },
  { id: 'ap1', code: 'AP-01', label: '截止测试', kind: '审计程序', x: 565, y: 62, color: '#c5b62f' },
  { id: 'ap2', code: 'AP-02', label: '三单一致', kind: '审计程序', x: 565, y: 142, color: '#c5b62f' },
  { id: 'ap3', code: 'AP-03', label: '应收函证', kind: '审计程序', x: 565, y: 242, color: '#c5b62f' },
  { id: 'ap4', code: 'AP-04', label: '存货监盘', kind: '审计程序', x: 565, y: 332, color: '#c5b62f' },
  { id: 'cc1', code: 'CC-01', label: '关联披露', kind: '合规检查', x: 720, y: 342, color: '#8a63d2' },
] as const;

const monitoredEdges = [
  ['rs1', 'and1'], ['rs2', 'and1'], ['rs1', 'ct1'], ['rs2', 'ct1'],
  ['rs3', 'ct2'], ['and1', 'ap1'], ['and1', 'ap2'], ['ct1', 'ap1'],
  ['ct1', 'ap3'], ['ct2', 'ap4'], ['rs4', 'cc1'],
] as const;

const workflowStages = [
  { title: '证据与底稿完整性校验', note: '底稿索引、附件与复核记录完整' },
  { title: '错报汇总与重要性评估', note: '调整及未调整错报已完成评估' },
  { title: '合规风险与违规排查', note: '合规事项、影响与整改要求已确认' },
  { title: 'TB 试算平衡表调整', note: '已确认调整写入试算平衡表' },
  { title: '完成程序', note: '完成阶段程序与最终分析已执行' },
  { title: '报告签发与项目归档', note: '报告签发、归档与审计轨迹留存' },
];

const statusForDecision = (decision?: string): MonitorStatus => {
  if (decision === '通过' || decision === '无问题关闭') return '已通过';
  if (decision === '退回补充资料' || decision === '已发起补充' || decision === '资料已补充') return '处理中';
  return '待审核';
};

const statusTone = (status: MonitorStatus) =>
  status === '已通过'
    ? 'bg-emerald-50 text-emerald-700'
    : status === '处理中'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-[#f0f2f5] text-[#66758a]';

export const OwnerReview: React.FC<OwnerReviewProps> = ({
  workflowProgress,
  projectName,
  nodeAssignments,
  taskDecisions,
}) => {
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('全部负责人');
  const [statusFilter, setStatusFilter] = useState<'全部状态' | MonitorStatus>('全部状态');
  const [monitorView, setMonitorView] = useState<'graph' | 'list'>('graph');
  const [activeModule, setActiveModule] = useState<'tags' | 'workflow'>('tags');

  const tagRows = useMemo(
    () => monitoredTags.map((tag) => ({
      ...tag,
      owner: nodeAssignments[tag.id] ?? '待分配',
      decision: taskDecisions[tag.id],
      status: statusForDecision(taskDecisions[tag.id]),
    })),
    [nodeAssignments, taskDecisions],
  );
  const owners = useMemo(() => Array.from(new Set(tagRows.map((tag) => tag.owner))), [tagRows]);
  const visibleTagIds = useMemo(() => new Set(tagRows.filter((tag) => {
    const query = search.trim().toLowerCase();
    return (!query || `${tag.code}${tag.label}${tag.owner}`.toLowerCase().includes(query))
      && (ownerFilter === '全部负责人' || tag.owner === ownerFilter)
      && (statusFilter === '全部状态' || tag.status === statusFilter);
  }).map((tag) => tag.id)), [tagRows, search, ownerFilter, statusFilter]);
  const visibleTags = tagRows.filter((tag) => visibleTagIds.has(tag.id));
  const passedCount = tagRows.filter((tag) => tag.status === '已通过').length;

  return (
    <div className="h-full flex-1 overflow-auto bg-[#f5f7fa] p-4 custom-scrollbar">
      <section className="mx-auto flex min-h-[650px] max-w-[1220px] flex-col overflow-hidden rounded-xl bg-white outline outline-1 outline-[#dce3ec]">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b border-[#e5e9ef] px-4">
          <div>
            <h1 className="text-[14px] font-black text-[#2f405c]">审核监控</h1>
            <p className="mt-1 text-[8px] font-bold text-[#8793a5]">{projectName}</p>
          </div>
          <nav className="flex rounded-md bg-[#f0f2f5] p-0.5" aria-label="审核监控模块">
            <button type="button" aria-current={activeModule === 'tags' ? 'page' : undefined} onClick={() => setActiveModule('tags')} className={`h-8 rounded px-3 text-[9px] font-black transition-colors ${activeModule === 'tags' ? 'bg-white text-[#315ca9] shadow-sm' : 'text-[#66758a] hover:text-[#40516b]'}`}>标签审核系统</button>
            <button type="button" aria-current={activeModule === 'workflow' ? 'page' : undefined} onClick={() => setActiveModule('workflow')} className={`h-8 rounded px-3 text-[9px] font-black transition-colors ${activeModule === 'workflow' ? 'bg-white text-[#315ca9] shadow-sm' : 'text-[#66758a] hover:text-[#40516b]'}`}>后续审计流程</button>
          </nav>
          <div className="text-[8px] font-black">
            {activeModule === 'tags' ? <span className="rounded bg-emerald-50 px-2.5 py-1.5 text-emerald-700">{passedCount} / {tagRows.length} 个标签通过</span> : <span className="rounded bg-[#eef3fb] px-2.5 py-1.5 text-[#315ca9]">当前第 {Math.max(0, Math.min(workflowProgress + 1, 6))} / 6 步</span>}
          </div>
        </header>

        {activeModule === 'tags' ? <div className="grid min-h-0 flex-1 lg:grid-cols-[184px_minmax(0,1fr)]">
          <aside className="min-h-0 border-b border-[#e5e9ef] bg-[#f8f9fb] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#e4e8ee] p-3">
              <h2 className="text-[10px] font-black text-[#31415d]">负责人进度</h2>
              <label className="mt-2 flex h-8 items-center gap-2 rounded-md border border-[#dce2ea] bg-white px-2">
                <Search className="h-3 w-3 text-[#8b97a8]" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[8px] font-bold outline-none" placeholder="搜索标签或负责人" />
              </label>
            </div>
            <div className="px-3 py-2">
              {['全部负责人', ...owners].map((owner) => {
                const owned = owner === '全部负责人' ? tagRows : tagRows.filter((tag) => tag.owner === owner);
                const done = owned.filter((tag) => tag.status === '已通过').length;
                const progress = owned.length ? Math.round((done / owned.length) * 100) : 0;
                const selected = ownerFilter === owner;
                return (
                  <button key={owner} type="button" onClick={() => setOwnerFilter(owner)} className={`group w-full border-b border-[#e8ecf1] px-1 py-3 text-left transition-colors ${selected ? 'text-[#315ca9]' : 'text-[#506078] hover:text-[#315ca9]'}`}>
                    <span className="flex items-center justify-between gap-3">
                      <strong className="flex min-w-0 items-center gap-2 truncate text-[9px] font-black"><i className={`h-2 w-2 shrink-0 rounded-full ${selected ? 'bg-[#315ca9]' : progress === 100 ? 'bg-[#2d9a75]' : progress > 0 ? 'bg-[#d9952e]' : 'bg-[#b9c1cd]'}`} />{owner}</strong>
                      <small className={`shrink-0 text-[8px] font-black ${selected ? 'text-[#315ca9]' : 'text-[#8490a2]'}`}>{done} / {owned.length}</small>
                    </span>
                    <i className="mt-2.5 block h-0.5 overflow-hidden bg-[#dfe5ec]"><em className={`block h-full ${selected ? 'bg-[#315ca9]' : 'bg-[#2d9a75]'}`} style={{ width: `${progress}%` }} /></i>
                  </button>
                );
              })}
            </div>
            <div className="mx-3 mt-1 pt-2">
              {(['全部状态', '已通过', '处理中', '待审核'] as const).map((status) => (
                <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`mb-1 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[8px] font-black ${statusFilter === status ? 'bg-[#eaf0fa] text-[#315ca9]' : 'text-[#66758a] hover:bg-white'}`}>
                  {status}<span>{status === '全部状态' ? tagRows.length : tagRows.filter((tag) => tag.status === status).length}</span>
                </button>
              ))}
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col bg-[#fbfcfd]">
            <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[#e7ebf0] bg-white px-3">
              <div>
                <h2 className="text-[10px] font-black text-[#2f405c]">标签审核进度</h2>
                <p className="mt-0.5 text-[7px] font-bold text-[#929dae]">按知识图谱负责人同步审核结论</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-3 text-[7px] font-bold text-[#7e8b9e] xl:flex">
                  <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#2d9a75]" />已通过</span>
                  <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#d9952e]" />处理中</span>
                  <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#aab3c0]" />待审核</span>
                </div>
                <div className="flex rounded-md bg-[#f0f2f5] p-0.5" aria-label="切换标签审核视图">
                  <button type="button" aria-pressed={monitorView === 'graph'} onClick={() => setMonitorView('graph')} className={`flex h-7 items-center gap-1 rounded px-2 text-[8px] font-black transition-colors ${monitorView === 'graph' ? 'bg-white text-[#315ca9] shadow-sm' : 'text-[#6f7d90] hover:text-[#40516b]'}`}><Network className="h-3 w-3" />图谱</button>
                  <button type="button" aria-pressed={monitorView === 'list'} onClick={() => setMonitorView('list')} className={`flex h-7 items-center gap-1 rounded px-2 text-[8px] font-black transition-colors ${monitorView === 'list' ? 'bg-white text-[#315ca9] shadow-sm' : 'text-[#6f7d90] hover:text-[#40516b]'}`}><List className="h-3 w-3" />列表</button>
                </div>
              </div>
            </div>
            <div className="min-h-[330px] flex-1 overflow-hidden">
              {monitorView === 'graph' ? <svg viewBox="0 0 800 405" className="h-full w-full" role="img" aria-label="负责人标签审核进度图谱">
                <defs><marker id="monitor-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#aeb8c6" /></marker></defs>
                {monitoredEdges.map(([from, to]) => {
                  const a = monitoredTags.find((tag) => tag.id === from)!;
                  const b = monitoredTags.find((tag) => tag.id === to)!;
                  const visible = visibleTagIds.has(from) && visibleTagIds.has(to);
                  return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#b9c3d0" strokeWidth="1.2" strokeOpacity={visible ? .7 : .12} markerEnd="url(#monitor-arrow)" />;
                })}
                {tagRows.map((tag) => {
                  const visible = visibleTagIds.has(tag.id);
                  const stateColor = tag.status === '已通过' ? '#2d9a75' : tag.status === '处理中' ? '#d9952e' : '#aab3c0';
                  return (
                    <g key={tag.id} opacity={visible ? 1 : .16}>
                      <rect x={tag.x - 45} y={tag.y - 20} width="90" height="40" rx="5" fill={`${tag.color}18`} stroke="#4b535f" strokeWidth="1.4" />
                      <text x={tag.x} y={tag.y - 4} textAnchor="middle" fill="#233247" fontSize="8" fontWeight="800">{tag.code}</text>
                      <text x={tag.x} y={tag.y + 11} textAnchor="middle" fill="#182536" fontSize="10" fontWeight="800">{tag.label}</text>
                      <circle cx={tag.x + 40} cy={tag.y - 16} r="6" fill={stateColor} stroke="#fff" strokeWidth="2" />
                    </g>
                  );
                })}
              </svg> : (
                <div className="h-full overflow-auto bg-white custom-scrollbar">
                  <table className="w-full border-collapse text-left text-[8px]">
                    <thead className="sticky top-0 z-10 bg-[#f7f9fc] text-[#718097]">
                      <tr className="border-b border-[#dfe5ed]">
                        <th className="px-3 py-2.5 font-black">标签编号</th>
                        <th className="px-3 py-2.5 font-black">标签名称</th>
                        <th className="px-3 py-2.5 font-black">类型</th>
                        <th className="px-3 py-2.5 font-black">负责人</th>
                        <th className="px-3 py-2.5 font-black">审核结论</th>
                        <th className="px-3 py-2.5 text-right font-black">状态</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf0f4]">
                      {visibleTags.map((tag) => {
                        return (
                          <tr key={tag.id} className="bg-white transition-colors hover:bg-[#f6f8fb]">
                            <td className="px-3 py-3 font-mono font-black text-[#52647d]">{tag.code}</td>
                            <td className="px-3 py-3"><span className="flex items-center gap-2 font-black text-[#34465f]"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: tag.color }} />{tag.label}</span></td>
                            <td className="px-3 py-3 font-bold text-[#66758a]">{tag.kind}</td>
                            <td className="px-3 py-3 font-black text-[#465972]">{tag.owner}</td>
                            <td className="px-3 py-3 font-bold text-[#66758a]">{tag.decision ?? '尚未提交'}</td>
                            <td className="px-3 py-3 text-right"><span className={`inline-flex rounded px-2 py-1 font-black ${statusTone(tag.status)}`}>{tag.status}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {visibleTags.length === 0 && <div className="grid h-40 place-items-center text-[9px] font-bold text-[#8793a5]">没有符合当前筛选条件的标签</div>}
                </div>
              )}
            </div>
          </main>
        </div> : <WorkflowMonitor workflowProgress={workflowProgress} nodeAssignments={nodeAssignments} />}
      </section>
    </div>
  );
};

function WorkflowMonitor({
  workflowProgress,
  nodeAssignments,
}: {
  workflowProgress: number;
  nodeAssignments: Record<string, string>;
}) {
  const [selectedOwner, setSelectedOwner] = useState('全部负责人');
  const [selectedStage, setSelectedStage] = useState<number | 'all'>('all');
  const ownerOf = (nodeId: string) => nodeAssignments[nodeId] ?? '待分配';
  const stageTasks = [
    [
      { owner: ownerOf('ap1'), task: '收入截止底稿完整性校验' },
      { owner: ownerOf('ap3'), task: '应收函证底稿完整性校验' },
      { owner: ownerOf('ap4'), task: '存货监盘底稿完整性校验' },
    ],
    [
      { owner: ownerOf('rs1'), task: '收入错报汇总与评估' },
      { owner: ownerOf('rs2'), task: '应收错报汇总与评估' },
      { owner: ownerOf('rs3'), task: '存货错报汇总与评估' },
    ],
    [
      { owner: ownerOf('cc1'), task: '关联交易合规排查' },
      { owner: ownerOf('rs4'), task: '异常资金与违规事项排查' },
    ],
    [
      { owner: ownerOf('and1'), task: '调整分录汇总与写入' },
      { owner: '符金雨', task: 'TB 平衡复核与版本锁定' },
    ],
    [
      { owner: ownerOf('ap2'), task: '完成阶段程序执行' },
      { owner: ownerOf('ct2'), task: '存货完成事项收口' },
      { owner: '符金雨', task: '最终分析复核' },
    ],
    [
      { owner: ownerOf('human'), task: '审计报告编制与签发材料' },
      { owner: ownerOf('complete'), task: '项目档案整理与归档' },
      { owner: '符金雨', task: '报告签发复核' },
    ],
  ];
  const progressForTask = (stageIndex: number, taskIndex: number) => {
    if (workflowProgress > stageIndex) return 100;
    if (workflowProgress < stageIndex) return 0;
    return [78, 56, 34][taskIndex] ?? 45;
  };
  const allWorkflowTasks = stageTasks.flatMap((tasks, stageIndex) =>
    tasks.map((task, taskIndex) => ({
      ...task,
      stageIndex,
      stage: workflowStages[stageIndex],
      progress: progressForTask(stageIndex, taskIndex),
    })),
  );
  const workflowOwners = Array.from(new Set(allWorkflowTasks.map((task) => task.owner)));
  const filteredWorkflowTasks = allWorkflowTasks.filter((task) =>
    (selectedOwner === '全部负责人' || task.owner === selectedOwner)
    && (selectedStage === 'all' || task.stageIndex === selectedStage),
  );
  const ownerSummary = workflowOwners.filter((owner) => selectedOwner === '全部负责人' || owner === selectedOwner).map((owner) => {
    const ownedTasks = allWorkflowTasks.filter((task) =>
      task.owner === owner && (selectedStage === 'all' || task.stageIndex === selectedStage),
    );
    const progress = Math.round(ownedTasks.reduce((sum, task) => sum + task.progress, 0) / Math.max(ownedTasks.length, 1));
    const completed = ownedTasks.filter((task) => task.progress === 100).length;
    return { owner, progress, completed, total: ownedTasks.length };
  }).filter((item) => item.total > 0);
  const clearWorkflowFilters = () => {
    setSelectedOwner('全部负责人');
    setSelectedStage('all');
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#fbfcfd]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#e7ebf0] bg-white px-4">
        <div><h2 className="text-[11px] font-black text-[#2f405c]">后续审计流程进度</h2><p className="mt-1 text-[8px] font-bold text-[#8a96a7]">独立跟踪移交后的六步审核进度</p></div>
        <div className="flex items-center gap-3 text-[8px] font-bold text-[#66758a]"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#2d9a75]" />已完成</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#315ca9]" />进行中</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#b9c1cd]" />未开始</span></div>
      </header>

      <div className="min-h-0 flex-1 overflow-auto p-5 custom-scrollbar">
        <div className="mx-auto mb-4 flex max-w-[980px] flex-wrap items-center gap-2 border-b border-[#e3e8ef] pb-4">
          <span className="mr-1 text-[11px] font-black text-[#40516b]">筛选进度</span>
          <label className="flex h-9 items-center gap-2.5 rounded-md border border-[#dce3ed] bg-white px-3 text-[10px] font-bold text-[#65758b]">
            负责人
            <select aria-label="筛选后续审计负责人" value={selectedOwner} onChange={(event) => setSelectedOwner(event.target.value)} className="bg-transparent text-[11px] font-black text-[#40516b] outline-none">
              <option>全部负责人</option>
              {workflowOwners.map((owner) => <option key={owner}>{owner}</option>)}
            </select>
          </label>
          <label className="flex h-9 items-center gap-2.5 rounded-md border border-[#dce3ed] bg-white px-3 text-[10px] font-bold text-[#65758b]">
            流程步骤
            <select aria-label="筛选后续审计步骤" value={selectedStage === 'all' ? 'all' : String(selectedStage)} onChange={(event) => setSelectedStage(event.target.value === 'all' ? 'all' : Number(event.target.value))} className="max-w-[240px] bg-transparent text-[11px] font-black text-[#40516b] outline-none">
              <option value="all">全部步骤</option>
              {workflowStages.map((stage, index) => <option key={stage.title} value={index}>第 {index + 1} 步 · {stage.title}</option>)}
            </select>
          </label>
          {(selectedOwner !== '全部负责人' || selectedStage !== 'all') && <button type="button" onClick={clearWorkflowFilters} className="h-9 rounded-md px-3 text-[10px] font-black text-[#315ca9] hover:bg-[#edf3fc]">清除筛选</button>}
          <span className="ml-auto text-[10px] font-bold text-[#6f7e92]">显示 {filteredWorkflowTasks.length} 项</span>
        </div>

        <section className="mx-auto max-w-[980px]">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-black text-[#40516b]">负责人总览</h3><span className="text-[8px] font-bold text-[#8a96a7]">人员继承自知识图谱负责人分配</span></div>
          <div className="flex flex-wrap gap-2">
            {ownerSummary.map((item) => (
              <button type="button" key={item.owner} onClick={() => setSelectedOwner(item.owner)} className={`min-w-[180px] flex-1 rounded-lg border bg-white px-3 py-3 text-left transition-colors ${selectedOwner === item.owner ? 'border-[#8fa9d2] bg-[#f4f7fc]' : 'border-[#dfe5ed] hover:border-[#b8c7dc]'}`}>
                <div className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><i className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#eaf0fa] text-[9px] not-italic font-black text-[#315ca9]">{item.owner.slice(0, 1)}</i><strong className="truncate text-[9px] font-black text-[#40516b]">{item.owner}</strong></span><b className="text-[11px] font-black text-[#315ca9]">{item.progress}%</b></div>
                <i className="mt-3 block h-1.5 overflow-hidden rounded bg-[#e8ecf1]"><em className={`block h-full ${item.progress === 100 ? 'bg-[#2d9a75]' : 'bg-[#315ca9]'}`} style={{ width: `${item.progress}%` }} /></i>
                <span className="mt-2 block text-[7px] font-bold text-[#7b8799]">已完成 {item.completed} / {item.total} 项</span>
              </button>
            ))}
          </div>
        </section>

        <div className="relative mx-auto max-w-[980px] py-6">
          <i className="absolute left-[8.3%] right-[8.3%] top-[51px] h-px bg-[#ccd5e1]" />
          <div className="relative grid grid-cols-6 gap-3">
            {workflowStages.map((stage, index) => {
              const complete = workflowProgress > index;
              const active = workflowProgress === index;
              const locked = workflowProgress < index;
              return (
                <button type="button" key={stage.title} onClick={() => setSelectedStage(selectedStage === index ? 'all' : index)} className={`min-w-0 rounded-md px-1 py-1 text-center transition-opacity ${selectedStage !== 'all' && selectedStage !== index ? 'opacity-30' : 'opacity-100'}`}>
                  <span className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border-4 border-[#fbfcfd] text-[9px] font-black text-white ${complete ? 'bg-[#2d9a75]' : active ? 'bg-[#315ca9]' : 'bg-[#b9c1cd]'}`}>{complete ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
                  <strong className={`mt-3 block text-[9px] font-black leading-relaxed ${locked ? 'text-[#8d98a8]' : 'text-[#40516b]'}`}>{stage.title}</strong>
                  <span className={`mt-2 inline-flex rounded px-2 py-1 text-[7px] font-black ${complete ? 'bg-emerald-50 text-emerald-700' : active ? 'bg-blue-50 text-[#315ca9]' : 'bg-[#f0f2f5] text-[#7b8798]'}`}>{complete ? '已完成' : active ? '进行中' : '未开始'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-5 max-w-[980px] overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
          <div className="grid grid-cols-[54px_minmax(160px,1fr)_80px_minmax(190px,1.2fr)_130px_76px] bg-[#f7f9fc] px-4 py-3 text-[8px] font-black text-[#718097]"><span>步骤</span><span>流程阶段</span><span>负责人</span><span>负责事项</span><span>完成进度</span><span className="text-right">状态</span></div>
          {filteredWorkflowTasks.map((task) => {
            const progress = task.progress;
            const label = progress === 100 ? '已完成' : progress > 0 ? '进行中' : '未开始';
            return <div key={`${task.stage.title}-${task.owner}-${task.task}`} className="grid grid-cols-[54px_minmax(160px,1fr)_80px_minmax(190px,1.2fr)_130px_76px] items-center border-t border-[#edf0f4] px-4 py-3 text-[9px]"><span className="font-mono font-black text-[#7b8799]">{String(task.stageIndex + 1).padStart(2, '0')}</span><strong className="font-black text-[#40516b]">{task.stage.title}</strong><span className="font-black text-[#52647d]">{task.owner}</span><span className="font-bold text-[#718097]">{task.task}</span><span className="flex items-center gap-2"><i className="block h-1.5 min-w-0 flex-1 overflow-hidden rounded bg-[#e8ecf1]"><em className={`block h-full ${progress === 100 ? 'bg-[#2d9a75]' : 'bg-[#315ca9]'}`} style={{ width: `${progress}%` }} /></i><b className="w-7 text-right text-[8px] font-black text-[#52647d]">{progress}%</b></span><span className="text-right"><em className={`inline-flex rounded px-2 py-1 text-[8px] not-italic font-black ${progress === 100 ? 'bg-emerald-50 text-emerald-700' : progress > 0 ? 'bg-blue-50 text-[#315ca9]' : 'bg-[#f0f2f5] text-[#7b8798]'}`}>{label}</em></span></div>;
          })}
          {filteredWorkflowTasks.length === 0 && <div className="grid h-24 place-items-center border-t border-[#edf0f4] text-[9px] font-bold text-[#8793a5]">该负责人当前步骤没有负责事项</div>}
        </div>
      </div>
    </div>
  );
}
