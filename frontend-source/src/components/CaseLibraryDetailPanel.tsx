import { X } from "lucide-react";

export type CaseLibraryProject = { id: string; name: string; client: string };

const flows: Record<string, string[]> = {
  "Roadwise 用户需求验证": ["目标与假设", "用户访谈", "问卷数据", "需求优先级", "MVP验证", "阶段复盘"],
  "社区共享自习室验证": ["市场规模", "场景观察", "用户画像", "竞品拆解", "方案实验", "转化验证"],
  "团队研究流程 SOP": ["流程目标", "现状基线", "信息源接入", "指标口径", "SOP试运行", "质量复盘"],
};
const descriptions: Record<string, string> = {
  "目标与假设": "目标：验证用户是否愿意为结构化项目指导持续使用 Roadwise。假设：每周使用 2 次以上的用户，阶段任务完成率会提升 20%。",
  "用户访谈": "渠道：半结构化访谈 12 人，覆盖学生、独立创作者和项目负责人；记录原话、行为频率、当前替代方案和付费阻力。",
  "问卷数据": "渠道：线上问卷 N=86，有效样本 79 份；重点指标包括需求选择率、痛点频率、任务中断率和可接受价格区间。",
  "需求优先级": "采用 RICE 评分：Reach、Impact、Confidence、Effort 四项量化排序，首版聚焦阶段任务拆解和材料诊断。",
  "MVP验证": "上线 2 周 MVP，跟踪激活率、首个任务完成率、7 日留存和关键路径转化；通过条件为首个任务完成率 ≥60%。",
  "阶段复盘": "对比验证前后数据，确认假设是否成立，记录未解决问题，并决定继续投入、调整方案或停止该方向。",
};
const summaries: Record<string, string> = {
  "Roadwise 用户需求验证": "围绕项目负责人在立项、调研和阶段推进中的真实需求，验证 Roadwise 是否能帮助用户把模糊想法拆解为可执行任务，并通过证据和指标完成阶段决策。目标是验证 MVP 的核心使用价值，提升首个任务完成率和项目持续推进率。",
};

export default function CaseLibraryDetailPanel({ project, highlightedFlow, onClose }: { project: CaseLibraryProject; highlightedFlow?: string | null; onClose: () => void }) {
  const items = flows[project.name] ?? [];
  const kind = project.client || "项目案例";
  return <aside className="absolute right-4 top-4 z-20 flex w-[430px] max-h-[calc(100%-32px)] flex-col overflow-hidden rounded-xl border border-[#dce3ed] bg-white shadow-xl">
    <header className="flex shrink-0 items-start justify-between border-b border-[#e4e8ef] px-6 py-5"><div><div className="text-[14px] font-bold text-[#7d899a]">{kind} · {project.name === "Roadwise 用户需求验证" ? "MVP验证" : "项目节点"}</div><h3 className="mt-2 text-[21px] font-black text-[#2f405a]">{project.name}</h3></div><button type="button" onClick={onClose} aria-label="关闭标签详情" className="text-2xl leading-none text-[#7d899b]">×</button></header>
    <div className="min-h-0 flex-1 overflow-y-auto p-6"><div className="flex gap-2"><span className="rounded-md bg-[#7b61c9] px-3 py-2 text-[14px] font-black text-white">{kind}</span><span className="rounded-md border border-[#dce3ed] px-3 py-2 text-[14px] font-bold text-[#66758b]">项目案例</span></div>
      <h4 className="mt-7 border-b border-[#e7ebf0] pb-3 text-[15px] font-black text-[#586982]">案例信息</h4><div className="mt-4 rounded-xl bg-[#f5f7fa] p-5 text-[14px] font-bold leading-6 text-[#6d7b90]">{summaries[project.name] ?? "该案例围绕明确的问题开展研究，通过信息收集、方案验证和阶段评审，形成可复用的项目方法与成果。"}</div>
      <h4 className="mt-7 border-b border-[#e7ebf0] pb-3 text-[15px] font-black text-[#586982]">节点环节</h4><div className="mt-4 space-y-3">{items.map((flow, index) => <div key={flow} className={`flex gap-3 rounded-xl border p-4 ${highlightedFlow === flow ? "border-[#315ca9] bg-[#edf3fc] ring-2 ring-[#315ca9]/15" : "border-[#e1e7ef] bg-white"}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf3fc] text-[16px] font-black text-[#315ca9]">{index + 1}</span><div><strong className="block text-[15px] font-black text-[#40536f]">{flow}</strong><p className="mt-2 text-[14px] font-bold leading-6 text-[#8491a4]">{descriptions[flow] ?? "记录该节点的关键输入、执行过程、判断依据和阶段产出。"}</p></div></div>)}</div>
    </div></aside>;
}
