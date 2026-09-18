import React, { useEffect, useState } from 'react';
import { NavView, MisstatementItem, ComplianceIssueItem, WorkingPaperItem, CompletionProcedureItem } from './types';
import {
  initialMisstatements,
  initialComplianceIssues,
  initialWorkingPapers,
  initialTrialBalance,
  initialCompletionProcedures,
} from './data/mockData';

import { Sidebar } from './components/Sidebar';
import { MisstatementSummary } from './components/MisstatementSummary';
import { ComplianceIssues } from './components/ComplianceIssues';
import { WorkingPapers } from './components/WorkingPapers';
import { WorkingPaperDetail } from './components/WorkingPaperDetail';
import { TrialBalance } from './components/TrialBalance';
import { CompletionProcedures } from './components/CompletionProcedures';
import { ProjectOverview } from './components/ProjectOverview';
import { RiskInspection } from './components/RiskInspection';
import { AuditGraphCanvas } from './components/AuditGraphCanvas';
import { OwnerReview } from './components/OwnerReview';
import { ReportSignoff } from './components/ReportSignoff';

interface AppProps {
  initialProjectId?: string;
  workflowProgressByProject?: Record<string, number>;
  onWorkflowProgressChange?: (projectId: string, progress: number) => void;
  nodeAssignments?: Record<string, string>;
  taskDecisionsByProject?: Record<string, Record<string, string>>;
}

const workflowStages: Array<{ view: NavView; title: string; action: string }> = [
  { view: 'working-papers', title: '证据与底稿完整性校验', action: '确认底稿完整并完成复核' },
  { view: 'misstatement', title: '错报汇总与重要性评估', action: '确认错报汇总审核' },
  { view: 'compliance', title: '合规风险与违规排查', action: '确认合规问题审核' },
  { view: 'trial-balance', title: 'TB 试算平衡表调整', action: '确认调整并锁定报表' },
  { view: 'completion', title: '完成程序', action: '确认完成全部程序' },
  { view: 'report-signoff', title: '报告签发与项目归档', action: '批准报告并完成归档' },
];

const viewForProgress = (progress: number): NavView =>
  progress < 0 ? 'working-papers' : workflowStages[Math.min(progress, workflowStages.length - 1)].view;

export const App: React.FC<AppProps> = ({
  initialProjectId = 'audit-handoff',
  workflowProgressByProject = { 'audit-handoff': 5, huadong: -1, jinli: -1, xincheng: -1 },
  onWorkflowProgressChange,
  nodeAssignments = {} as Record<string, string>,
  taskDecisionsByProject = {},
}) => {
  const [currentView, setCurrentView] = useState<NavView>(() =>
    viewForProgress(workflowProgressByProject[initialProjectId] ?? -1)
  );
  const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
  const [localWorkflowProgress, setLocalWorkflowProgress] = useState<Record<string, number>>(workflowProgressByProject);
  const [misstatements, setMisstatements] = useState<MisstatementItem[]>(initialMisstatements);
  const [complianceIssues, setComplianceIssues] = useState<ComplianceIssueItem[]>(initialComplianceIssues);
  const ownerForPaper = (_code: string, _name = '', sourceTagId?: string) => {
    const graphNodeId = sourceTagId;
    return graphNodeId ? (nodeAssignments[graphNodeId] ?? '待分配') : '待分配';
  };
  const syncedWorkingPapers = () =>
    initialWorkingPapers.map((paper) => ({
      ...paper,
      author: ownerForPaper(paper.code, paper.name, paper.sourceTagId),
      reviewer: '符金雨',
      attachments: paper.attachments?.map((attachment) => ({
        ...attachment,
        uploader: ownerForPaper(paper.code, paper.name, paper.sourceTagId),
      })),
      reviewRecords: paper.reviewRecords?.map((record) => ({
        ...record,
        reviewer:
          record.action === '提交复核'
            ? ownerForPaper(paper.code, paper.name, paper.sourceTagId)
            : '符金雨',
      })),
    }));
  const [workingPapers, setWorkingPapers] = useState<WorkingPaperItem[]>(syncedWorkingPapers);
  const [trialBalanceRows] = useState(initialTrialBalance);
  const [completionProcedures, setCompletionProcedures] = useState<CompletionProcedureItem[]>(initialCompletionProcedures);

  const [selectedWorkingPaper, setSelectedWorkingPaper] = useState<WorkingPaperItem | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');

  useEffect(() => {
    setActiveProjectId(initialProjectId);
    setCurrentView(viewForProgress(workflowProgressByProject[initialProjectId] ?? -1));
    setSelectedWorkingPaper(null);
  }, [initialProjectId]);
  useEffect(() => {
    setWorkingPapers(syncedWorkingPapers());
  }, [nodeAssignments]);

  const projectNames: Record<string, string> = {
    'audit-handoff': '远川智能制造有限公司',
    huadong: '华东智造 · 2026 年审',
    jinli: '金利集团 · 专项审计',
    xincheng: '新城建设 · 2026 年审',
  };
  const effectiveProgressByProject = onWorkflowProgressChange
    ? workflowProgressByProject
    : localWorkflowProgress;
  const workflowProgress = effectiveProgressByProject[activeProjectId] ?? -1;
  const viewStage: Partial<Record<NavView, number>> = {
    'working-papers': 0,
    'paper-detail': 0,
    misstatement: 1,
    compliance: 2,
    'trial-balance': 3,
    completion: 4,
    'report-signoff': 5,
  };
  const requiredStage = viewStage[currentView];
  const currentViewHasData =
    currentView === 'graph' ||
    currentView === 'overview' ||
    currentView === 'risk-inspection' ||
    currentView === 'owner-review' ||
    (requiredStage !== undefined && workflowProgress >= requiredStage);
  const currentWorkflowStage =
    workflowProgress >= 0 && workflowProgress < workflowStages.length
      ? workflowStages[workflowProgress]
      : null;
  const displayedStage =
    currentView === 'owner-review' ? workflowProgress : requiredStage;
  const displayedWorkflowStage =
    displayedStage !== undefined ? workflowStages[displayedStage] : null;
  const isActiveWorkflowStage = displayedStage === workflowProgress;

  const updateWorkflowProgress = (nextProgress: number) => {
    if (onWorkflowProgressChange) {
      onWorkflowProgressChange(activeProjectId, nextProgress);
    } else {
      setLocalWorkflowProgress((current) => ({
        ...current,
        [activeProjectId]: nextProgress,
      }));
    }
  };

  const advanceWorkflow = () => {
    if (!currentWorkflowStage) return;
    const nextProgress = workflowProgress + 1;
    updateWorkflowProgress(nextProgress);
    setCurrentView(viewForProgress(nextProgress));
    setSelectedWorkingPaper(null);
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setCurrentView((current) =>
      current === 'owner-review'
        ? 'owner-review'
        : viewForProgress(effectiveProgressByProject[projectId] ?? -1)
    );
    setSelectedWorkingPaper(null);
  };

  // Handle opening a working paper directly (e.g., from misstatement list link)
  const handleOpenWorkingPaperByCode = (paperCode: string) => {
    const found = workingPapers.find((p) => p.code === paperCode);
    if (found) {
      setSelectedWorkingPaper(found);
      setCurrentView('paper-detail');
    } else {
      // Fallback if code isn't exact match, pick first paper or construct
      const fallback = workingPapers[0];
      setSelectedWorkingPaper(fallback);
      setCurrentView('paper-detail');
    }
  };

  const handleSelectPaper = (paper: WorkingPaperItem) => {
    setSelectedWorkingPaper(paper);
    setCurrentView('paper-detail');
  };

  const handleUpdatePaper = (updated: WorkingPaperItem) => {
    setWorkingPapers((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setSelectedWorkingPaper(updated);
  };

  const handleAddPaper = (newPaper: WorkingPaperItem) => {
    setWorkingPapers((prev) => [newPaper, ...prev]);
  };

  return (
    <div id="downstream-audit-root" className="flex h-full w-full overflow-hidden bg-[#f6f8fb] text-[#1b1b1e]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view !== 'paper-detail') {
            setSelectedWorkingPaper(null);
          }
        }}
        misstatementCount={misstatements.length}
        complianceCount={complianceIssues.length}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        workflowProgress={workflowProgress}
        workflowProgressByProject={effectiveProgressByProject}
      />

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {workflowProgress >= 0 && currentView !== 'owner-review' && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#dfe5ed] bg-[#f8fafc] px-5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-black text-white ${workflowProgress >= workflowStages.length ? 'bg-emerald-600' : 'bg-[#315ca9]'}`}>
                  {workflowProgress >= workflowStages.length ? '✓' : (displayedStage ?? workflowProgress) + 1}
                </span>
                <strong className="truncate text-[12px] font-black text-[#35455f]">
                  {workflowProgress >= workflowStages.length ? '后续审计流程已完成' : `第 ${(displayedStage ?? workflowProgress) + 1} / 6 步 · ${displayedWorkflowStage?.title}`}
                </strong>
              </div>
              {workflowProgress >= workflowStages.length && <p className="mt-1 pl-8 text-[9px] font-bold text-[#7d899b]">报告已签发 · 项目已归档</p>}
            </div>
            {currentWorkflowStage && isActiveWorkflowStage && (
              <button
                type="button"
                onClick={advanceWorkflow}
                className="h-9 shrink-0 rounded-md bg-[#315ca9] px-4 text-[9px] font-black text-white hover:bg-[#264f96] focus:outline-none focus:ring-2 focus:ring-[#c8d7f1]"
              >
                {currentWorkflowStage.action}
              </button>
            )}
          </div>
        )}
        {/* View Switcher */}
        <main className="flex-1 flex overflow-hidden relative">
          {!currentViewHasData && (
            <section className="flex h-full w-full items-center justify-center bg-white px-8 text-center">
              <div className="max-w-sm">
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f1f4f8] text-[18px] text-[#8a96a7]">—</div>
                <h2 className="mt-3 text-[13px] font-black text-[#3f506a]">
                  当前步骤暂无数据
                </h2>
                <p className="mt-2 text-[10px] font-bold leading-relaxed text-[#7b8799]">
                  {projectNames[activeProjectId] ?? '当前项目'}尚未收到审核工作台的已确认结论。请先完成全部人工复核并移交后续审计。
                </p>
              </div>
            </section>
          )}

          {currentViewHasData && currentView === 'graph' && (
            <AuditGraphCanvas onNavigate={setCurrentView} />
          )}

          {currentViewHasData && currentView === 'overview' && (
            <ProjectOverview onNavigate={setCurrentView} />
          )}

          {currentViewHasData && currentView === 'risk-inspection' && (
            <RiskInspection onNavigate={setCurrentView} />
          )}

          {currentViewHasData && currentView === 'misstatement' && (
            <MisstatementSummary
              items={misstatements}
              onUpdateItems={setMisstatements}
              onOpenWorkingPaper={handleOpenWorkingPaperByCode}
              globalSearchQuery={globalSearchQuery}
            />
          )}

          {currentViewHasData && currentView === 'compliance' && (
            <ComplianceIssues
              items={complianceIssues}
              onUpdateItems={setComplianceIssues}
              globalSearchQuery={globalSearchQuery}
            />
          )}

          {currentViewHasData && currentView === 'working-papers' && (
            <WorkingPapers
              papers={workingPapers}
              onSelectPaper={handleSelectPaper}
              onAddPaper={handleAddPaper}
              globalSearchQuery={globalSearchQuery}
              ownerForPaperCode={ownerForPaper}
            />
          )}

          {currentViewHasData && currentView === 'paper-detail' && selectedWorkingPaper && (
            <WorkingPaperDetail
              paper={selectedWorkingPaper}
              onBack={() => setCurrentView('working-papers')}
              onUpdatePaper={handleUpdatePaper}
            />
          )}

          {currentViewHasData && currentView === 'trial-balance' && (
            <TrialBalance
              rows={trialBalanceRows}
              globalSearchQuery={globalSearchQuery}
            />
          )}

          {currentViewHasData && currentView === 'completion' && (
            <CompletionProcedures
              procedures={completionProcedures}
              onUpdateProcedures={setCompletionProcedures}
            />
          )}

          {currentViewHasData && currentView === 'report-signoff' && (
            <ReportSignoff workflowProgress={workflowProgress} />
          )}

          {currentViewHasData && currentView === 'owner-review' && (
            <OwnerReview
              workflowProgress={workflowProgress}
              projectName={projectNames[activeProjectId] ?? '当前审计项目'}
              nodeAssignments={nodeAssignments}
              taskDecisions={taskDecisionsByProject[activeProjectId] ?? {}}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
