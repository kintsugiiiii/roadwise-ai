import React, { useState } from 'react';
import { NavView } from '../types';
import { Search } from 'lucide-react';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  misstatementCount: number;
  complianceCount: number;
  activeProjectId: string;
  onSelectProject: (projectId: string) => void;
  workflowProgress: number;
  workflowProgressByProject: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  misstatementCount,
  complianceCount,
  activeProjectId,
  onSelectProject,
  workflowProgress,
  workflowProgressByProject,
}) => {
  const [nodeSearch, setNodeSearch] = useState<string>('');

  const auditProjects = [
    {
      id: 'audit-handoff',
      name: '远川制造',
      title: '远川制造 · 已移交',
      subtext: '后续审计中 · 质量复核',
      view: 'owner-review' as NavView,
    },
    {
      id: 'huadong',
      name: '华东智造',
      title: '华东智造 · 2026 年审',
      subtext: 'Scope 前 · 173 条标签',
      view: 'misstatement' as NavView,
    },
    {
      id: 'jinli',
      name: '金利集团',
      title: '金利集团 · 专项审计',
      subtext: 'DAG 运行中 · 14 个节点 · 18 条关系',
      view: 'completion' as NavView,
    },
    {
      id: 'xincheng',
      name: '新城建设',
      title: '新城建设 · 2026 年审',
      subtext: '候选集 · 16 个节点 · 0 条关系',
      view: 'working-papers' as NavView,
    },
  ];

  const filteredProjects = auditProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(nodeSearch.toLowerCase()) ||
      p.subtext.toLowerCase().includes(nodeSearch.toLowerCase())
  );
  const preparationDefinitions: Array<{
    view: NavView;
    title: string;
    note: string;
    activeStatus: string;
  }> = [
    { view: 'working-papers', title: '证据与底稿完整性校验', note: '检查底稿索引、附件与复核记录', activeStatus: '待校验' },
    { view: 'misstatement', title: '错报汇总与重要性评估', note: '逐笔确认调整及未调整错报', activeStatus: '待审核' },
    { view: 'compliance', title: '合规风险与违规排查', note: '逐项确认问题、影响与整改要求', activeStatus: '待审核' },
    { view: 'trial-balance', title: 'TB 试算平衡表调整', note: '写入已确认调整并锁定报表', activeStatus: '待锁定' },
    { view: 'completion', title: '完成程序', note: '完成期后事项、持续经营与关联方程序', activeStatus: '待完成' },
    { view: 'report-signoff', title: '报告签发与归档', note: '批准报告、签发并完成项目归档', activeStatus: '待签发' },
  ];
  const preparationItems = preparationDefinitions.map((item, stage) => {
    const completed = workflowProgress > stage;
    const active = workflowProgress === stage;
    return {
      ...item,
      stage,
      status: completed ? '已完成' : active ? item.activeStatus : stage === 0 && workflowProgress < 0 ? '未启动' : '未解锁',
      tone: completed ? 'success' as const : active ? 'active' as const : 'neutral' as const,
      hasData: workflowProgress >= stage,
    };
  });

  return (
    <aside className="flex h-full w-[205px] flex-shrink-0 select-none flex-col overflow-y-auto border-r border-[#e2e7ee] bg-[#f8f9fb] font-sans text-[#1e293b] custom-scrollbar">
      <div className="flex-1">
        {/* Section 1: 后续审计流程 & Search */}
        <div className="border-b border-[#e2e7ee] p-3">
          <h2
            onClick={() => onSelectView('misstatement')}
            className="cursor-pointer shrink-0 whitespace-nowrap font-black text-[#30415c] hover:text-[#315ca9]"
          >
            后续审计流程
          </h2>

          <div className="relative mt-3">
            <Search className="absolute left-2 top-2.5 h-3 w-3 text-[#8895a8]" />
            <input
              type="text"
              placeholder="搜索节点"
              value={nodeSearch}
              onChange={(e) => setNodeSearch(e.target.value)}
              className="h-8 w-full rounded-md border border-[#dce3ed] bg-white pl-7 pr-2 text-[8px] font-bold text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#315ca9]"
            />
          </div>
        </div>

        {/* Section 2: 审计项目 */}
        <div className="border-b border-[#e0e5ec] p-2">
          <p className="px-2.5 pb-2 text-[11px] font-black text-[#46566f]">审计项目</p>

          <div>
            {filteredProjects.map((p) => {
              const isActive = activeProjectId === p.id;
              const projectProgress = workflowProgressByProject[p.id] ?? -1;
              const projectSubtext = projectProgress >= 6
                ? '已归档 · 后续审计流程已完成'
                : projectProgress >= 0
                  ? `后续审计中 · 第 ${projectProgress + 1} / 6 步`
                  : p.subtext;
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                  }}
                  className={`mb-1 w-full px-3 py-3 text-left transition-opacity ${isActive ? 'opacity-100' : 'opacity-55 hover:opacity-100'}`}
                >
                  <strong className="block text-[12px] font-black leading-tight text-[#3f506a]">
                    {p.title}
                  </strong>
                  <span className="audit-sidebar-meta mt-1 block font-bold leading-relaxed text-[#718097]">
                    {projectSubtext}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: 审核监控 */}
        <div className="border-b border-[#e0e5ec] p-2">
          <p className="px-2.5 pb-2 text-[11px] font-black text-[#3c4d67]">审核监控</p>
          <button
            type="button"
            onClick={() => onSelectView('owner-review')}
            className={`flex w-full items-start justify-between gap-2 px-3 py-3 text-left transition-opacity ${currentView === 'owner-review' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
          >
            <span className="min-w-0">
              <strong className="block text-[12px] leading-tight text-[#2f405a]">项目审核进度</strong>
              <small className="mt-1 block text-[10px] font-bold leading-relaxed text-[#66768d]">查看各负责人标签与后续流程进度</small>
            </span>
            <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[7px] font-black text-[#315ca9]">实时</span>
          </button>
        </div>

        {/* Section 4: 后续准备 */}
        <div className="p-2">
          <p className="px-2.5 pb-2 text-[11px] font-black text-[#3c4d67]">后续准备</p>
          <div>
            {preparationItems.map((item) => {
              const isActive = currentView === item.view || (item.view === 'working-papers' && currentView === 'paper-detail');
              const hasData = item.hasData;
              return <button type="button" key={item.stage} disabled={!hasData} onClick={() => onSelectView(item.view)} className={`flex w-full items-start justify-between gap-2 px-3 py-3 text-left transition-opacity ${!hasData ? 'cursor-not-allowed opacity-45' : isActive ? 'opacity-100' : 'opacity-55 hover:opacity-100'}`}>
                <span className="min-w-0"><small className="mb-1 block text-[8px] font-black text-[#7f8da2]">第 {item.stage + 1} 步</small><strong className="block text-[11px] leading-snug text-[#2f405a]">{item.title}</strong><small className="mt-1 block text-[9px] font-bold leading-relaxed text-[#66768d]">{item.note}</small></span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[7px] font-black ${item.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : item.tone === 'active' ? 'bg-blue-50 text-[#315ca9]' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
              </button>;
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
