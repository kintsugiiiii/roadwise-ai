import React, { useEffect, useMemo, useRef, useState } from "react";
import SourceDownstreamAuditWorkflow from "../downstream-audit/App";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Filter,
  GitBranch,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";

type RuleType = "风险信号" | "审计程序" | "合规检查" | "内控测试";
type RuleStatus = "生效中" | "待复核" | "草稿";
type AuditTaskDecision = "通过" | "无问题关闭" | "退回补充资料" | "已发起补充" | "资料已补充";
type AuditTaskDecisionMap = Record<string, AuditTaskDecision>;
type AuditMaterialRequestMap = Record<string, boolean>;

interface CandidateDecisionRecord {
  action: "调整" | "排除";
  threshold?: string;
  priority?: "高" | "正常" | "低";
  humanReview?: boolean;
  riskLevel?: "高风险" | "中风险" | "低风险";
  review?: "项目负责人复核" | "质量复核人复核" | "无需额外复核";
  reason: string;
  updatedBy: string;
  updatedAt: string;
}

type CandidateDecisionDetailsByProject = Record<
  string,
  Record<string, CandidateDecisionRecord>
>;
type ManualCandidateTagsByProject = Record<string, string[]>;

const readStoredRecord = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const formatAuditTimestamp = () =>
  new Date().toLocaleString("zh-CN", { hour12: false });

const initialAuditMaterialRequests: AuditMaterialRequestMap = {
  rs2: true,
  rs3: true,
  ct2: true,
  ap3: true,
  cc1: true,
};

interface AuditRule {
  id: string;
  name: string;
  type: RuleType;
  cycle: string;
  executor: string;
  status: RuleStatus;
  version: string;
  description: string;
  upstream: string[];
  downstream: string[];
}

const rules: AuditRule[] = [
  {
    id: "RS-REV-001",
    name: "收入增速异常",
    type: "风险信号",
    cycle: "销售与收款",
    executor: "规则引擎",
    status: "生效中",
    version: "v1.3",
    description:
      "营业收入增速高于行业均值 2 倍且绝对增速超过 20%，触发收入相关专项程序。",
    upstream: ["利润表", "行业数据库"],
    downstream: ["CT-REV-001", "AP-REV-001", "AP-REV-002"],
  },
  {
    id: "RS-AR-001",
    name: "应收账龄恶化",
    type: "风险信号",
    cycle: "销售与收款",
    executor: "规则引擎",
    status: "生效中",
    version: "v1.1",
    description:
      "一年以上应收账款占比上升超过 20 个百分点，提示坏账或虚增收入风险。",
    upstream: ["应收账龄表"],
    downstream: ["CT-AR-001", "AP-AR-001", "AP-AR-002"],
  },
  {
    id: "CT-REV-001",
    name: "出货审批控制",
    type: "内控测试",
    cycle: "销售与收款",
    executor: "AI 初筛 + 人工",
    status: "生效中",
    version: "v2.0",
    description:
      "抽取销售出库单，测试出货是否按授权审批；结论自动调整截止性测试样本量。",
    upstream: ["RS-REV-001"],
    downstream: ["AP-REV-001"],
  },
  {
    id: "AP-REV-001",
    name: "收入截止性测试",
    type: "审计程序",
    cycle: "销售与收款",
    executor: "大模型",
    status: "生效中",
    version: "v1.8",
    description: "核查资产负债表日前后收入凭证的签收日与入账日，识别跨期确认。",
    upstream: ["RS-REV-001", "CT-REV-001"],
    downstream: ["AP-REV-003", "COMP-001"],
  },
  {
    id: "AP-AR-002",
    name: "应收账款函证",
    type: "审计程序",
    cycle: "销售与收款",
    executor: "人工执行",
    status: "待复核",
    version: "v0.9",
    description: "向客户直接发函确认账款余额，差异超过阈值时触发收入专项调查。",
    upstream: ["RS-AR-001", "CT-AR-001"],
    downstream: ["AP-REV-010"],
  },
  {
    id: "CT-INV-001",
    name: "存货盘点控制",
    type: "内控测试",
    cycle: "生产与存货",
    executor: "人工执行",
    status: "生效中",
    version: "v1.2",
    description: "观察被审计单位实物盘点程序，失效时增加监盘抽检数量。",
    upstream: ["RS-INV-001"],
    downstream: ["AP-INV-001", "AP-INV-002"],
  },
  {
    id: "CC-REL-001",
    name: "关联方披露检查",
    type: "合规检查",
    cycle: "关联方",
    executor: "大模型",
    status: "生效中",
    version: "v1.5",
    description: "检查关联方范围及交易是否按准则完整披露，结论进入合规清单。",
    upstream: ["关联方清单", "合同库"],
    downstream: ["COMP-003"],
  },
  {
    id: "CC-GOV-001",
    name: "三重一大检查",
    type: "合规检查",
    cycle: "通用",
    executor: "AI 初筛 + 人工",
    status: "草稿",
    version: "v0.3",
    description: "国企项目适用，核查重大事项是否履行集体决策程序。",
    upstream: ["会议纪要", "项目配置"],
    downstream: ["合规清单"],
  },
];

const typeTone: Record<RuleType, string> = {
  风险信号: "bg-amber-50 text-amber-700 border-amber-200",
  审计程序: "bg-emerald-50 text-emerald-700 border-emerald-200",
  合规检查: "bg-violet-50 text-violet-700 border-violet-200",
  内控测试: "bg-blue-50 text-blue-700 border-blue-200",
};

const executorDisplay: Record<
  string,
  { label: string; flow: string; tone: string }
> = {
  规则引擎: {
    label: "规则自动执行",
    flow: "自动判定 · 无人工待办",
    tone: "text-emerald-700",
  },
  大模型: {
    label: "大模型自动分析",
    flow: "自动分析 · 异常转人工",
    tone: "text-violet-700",
  },
  "AI 初筛 + 人工": {
    label: "AI分析＋人工复核",
    flow: "AI初筛 → CPA确认",
    tone: "text-blue-700",
  },
  人工执行: {
    label: "人工执行",
    flow: "生成待办 → 人员完成",
    tone: "text-slate-700",
  },
};

const graphColumns = [
  {
    title: "风险信号",
    caption: "识别异常",
    type: "风险信号" as RuleType,
    items: ["RS-REV-001", "RS-AR-001"],
  },
  {
    title: "控制测试",
    caption: "验证控制",
    type: "内控测试" as RuleType,
    items: ["CT-REV-001", "CT-INV-001"],
  },
  {
    title: "程序 / 检查",
    caption: "执行响应",
    type: "审计程序" as RuleType,
    items: ["AP-REV-001", "AP-AR-002", "CC-REL-001"],
  },
  {
    title: "完成与结论",
    caption: "汇总结论",
    type: "合规检查" as RuleType,
    items: ["COMP-001", "COMP-003"],
  },
];

function WorkflowOverview({
  onNewProject,
  onNavigate,
  onReference,
}: {
  onNewProject: () => void;
  onNavigate: (view: "library" | "graph" | "review" | "execution") => void;
  onReference: (value: string) => void;
}) {
  const stages = [
    {
      step: "01",
      name: "创建审计项目",
      input: "客户、审计期间、业务范围与材料",
      graph: "建立项目空间，尚未生成关系",
      owner: "项目经理",
      status: "已完成",
      action: "查看项目",
      target: "new" as const,
    },
    {
      step: "02",
      name: "确认重要性参数",
      input: "结构化报表计算＋非结构化资料建议",
      graph: "写入项目配置节点，供全部标签引用",
      owner: "项目经理",
      status: "待确认",
      action: "确认参数",
      target: "review" as const,
    },
    {
      step: "03",
      name: "执行 Scope 筛选",
      input: "全所标签池 173 条＋项目 Scope",
      graph: "保留适用标签，不建立标签关系",
      owner: "规则程序",
      status: "已完成",
      action: "查看标签池",
      target: "graph" as const,
    },
    {
      step: "04",
      name: "审核候选标注集",
      input: "Scope 结果＋Graph RAG 关联推荐",
      graph: "16 个候选标签，0 条关系",
      owner: "项目经理",
      status: "待审核",
      action: "审核候选集",
      target: "review" as const,
    },
    {
      step: "05",
      name: "冻结并启动 DAG",
      input: "项目经理确认后的 16 个标签",
      graph: "16 个标签节点，建立 22 条有向关系",
      owner: "系统编排",
      status: "待启动",
      action: "查看候选图谱",
      target: "graph" as const,
    },
    {
      step: "06",
      name: "分层执行与人工审核",
      input: "规则结果、模型结论、客户补充资料",
      graph: "节点状态与上下游发现持续更新",
      owner: "负责人／项目经理",
      status: "未开始",
      action: "进入审核工作台",
      target: "execution" as const,
    },
  ];
  return (
    <div className="mt-4 space-y-3">
      <section className="overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e2e7ef]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="p-4">
            <h2 className="text-base font-black text-[#2a3a56]">
              从标签池到项目知识图谱
            </h2>
            <p className="mt-1 text-[11px] font-bold text-[#75839a]">
              标签先经过项目筛选与人工确认，冻结后才建立
              DAG；执行发现沿关系传递，需要人工判断的事项进入审核工作台。
            </p>
          </div>
          <button
            type="button"
            onClick={onNewProject}
            className="mx-4 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#2459c4] px-5 text-[10px] font-black text-white hover:bg-[#194db3]"
          >
            <Plus className="h-3.5 w-3.5" />
            开始新审计项目
          </button>
        </div>
        <div className="grid grid-cols-4 divide-x divide-[#e3e8ef] border-y border-[#e3e8ef] bg-[#fafbfc] py-3">
          {[
            ["全所标签池", "173"],
            ["候选标签", "16"],
            ["标签节点", "16"],
            ["DAG 关系", "22"],
          ].map(([label, value]) => (
            <div key={label} className="px-4">
              <span className="text-[9px] font-bold text-[#7f8c9f]">
                {label}
              </span>
              <strong className="ml-2 text-[14px] font-black text-[#354b69]">
                {value}
              </strong>
            </div>
          ))}
        </div>
        <div>
          <div className="grid grid-cols-[52px_150px_minmax(180px,1fr)_minmax(190px,1fr)_100px_80px_118px] gap-3 bg-white px-4 py-2.5 text-[9px] font-black text-[#7b8799]">
            <span>阶段</span>
            <span>流程节点</span>
            <span>输入与判断</span>
            <span>知识图谱变化</span>
            <span>责任人</span>
            <span>状态</span>
            <span>下一步</span>
          </div>
          {stages.map((stage) => (
            <button
              type="button"
              key={stage.step}
              onClick={() => {
                if (stage.target === "new") onNewProject();
                else onNavigate(stage.target);
                onReference(`${stage.name}｜${stage.input}`);
              }}
              className="grid w-full grid-cols-[52px_150px_minmax(180px,1fr)_minmax(190px,1fr)_100px_80px_118px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3 text-left hover:bg-[#f7f9fd]"
            >
              <span className="font-mono text-[9px] font-black text-[#8a96a8]">
                {stage.step}
              </span>
              <strong className="text-[11px] font-black text-[#35445e]">
                {stage.name}
              </strong>
              <span className="text-[9px] font-bold leading-relaxed text-[#66758b]">
                {stage.input}
              </span>
              <span className="text-[9px] font-bold leading-relaxed text-[#52698f]">
                {stage.graph}
              </span>
              <span className="text-[9px] font-bold text-[#596982]">
                {stage.owner}
              </span>
              <span
                className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${stage.status === "已完成" ? "bg-emerald-50 text-emerald-700" : stage.status === "待确认" || stage.status === "待审核" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}
              >
                {stage.status}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-black text-[#4164aa]">
                {stage.action}
                <ChevronRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
        <div className="overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e2e7ef]">
          <header className="flex items-center justify-between border-b border-[#e8ecf2] px-4 py-3">
            <div>
              <h2 className="text-xs font-black text-[#30405c]">
                进行中的审计项目
              </h2>
              <p className="mt-1 text-[8px] font-bold text-[#929daf]">
                项目阶段、候选标签和执行进度
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("review")}
              className="text-[9px] font-black text-[#4265ae]"
            >
              查看全部
            </button>
          </header>
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(220px,1fr)_110px_110px_95px_120px] gap-3 bg-[#fafbfc] px-4 py-2.5 text-[8px] font-black text-[#8a96a8]">
              <span>项目</span>
              <span>当前阶段</span>
              <span>标签进度</span>
              <span>负责人</span>
              <span>下一步</span>
            </div>
            {[
              [
                "华东智造有限公司2026年度审计",
                "候选审核",
                "126 / 173",
                "符金雨",
                "继续审核",
              ],
              [
                "金利集团有限公司专项审计",
                "分配执行",
                "84 / 112",
                "陈华",
                "查看执行",
              ],
              [
                "新城建设集团年报审计",
                "动态触发",
                "96 / 128",
                "刘敏",
                "处理新增程序",
              ],
              [
                "启明科技财务审计",
                "知识回流",
                "102 / 102",
                "王倩",
                "提交专家审核",
              ],
            ].map((row, index) => (
              <button
                type="button"
                key={row[0]}
                onClick={() => {
                  onReference(`${row[0]}｜${row[1]}｜标签进度 ${row[2]}`);
                  onNavigate(index === 0 ? "review" : "execution");
                }}
                className="grid w-full grid-cols-[minmax(220px,1fr)_110px_110px_95px_120px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3 text-left hover:bg-[#f7f9fd]"
              >
                <span>
                  <strong className="block truncate text-[10px] font-black text-[#33435d]">
                    {row[0]}
                  </strong>
                  <small className="mt-1 block text-[8px] font-bold text-[#95a0b1]">
                    制造业 · 年度审计
                  </small>
                </span>
                <span
                  className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${index === 0 ? "bg-amber-50 text-amber-700" : index === 3 ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"}`}
                >
                  {row[1]}
                </span>
                <span className="text-[9px] font-black text-[#52647e]">
                  {row[2]}
                </span>
                <span className="text-[9px] font-bold text-[#596982]">
                  {row[3]}
                </span>
                <span className="flex items-center gap-1 text-[9px] font-black text-[#4164aa]">
                  {row[4]}
                  <ChevronRight className="h-3 w-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-4 outline outline-1 outline-[#e2e7ef]">
          <h2 className="text-xs font-black text-[#30405c]">我的待办</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["待确认", "18", "amber"],
              ["进行中", "26", "blue"],
              ["待补充资料", "7", "rose"],
              ["待复核", "12", "violet"],
            ].map(([name, count, tone]) => (
              <button
                type="button"
                key={name}
                onClick={() =>
                  onNavigate(name === "待确认" ? "review" : "execution")
                }
                className="rounded-lg border border-[#e6eaf0] p-3 text-left hover:bg-[#fafbfc]"
              >
                <span className="text-[8px] font-bold text-[#8591a4]">
                  {name}
                </span>
                <strong
                  className={`mt-1 block text-xl font-black ${tone === "amber" ? "text-amber-600" : tone === "rose" ? "text-rose-600" : tone === "violet" ? "text-violet-600" : "text-blue-600"}`}
                >
                  {count}
                </strong>
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-[#f4f7fd] p-3">
            <p className="text-[9px] font-black text-[#45619a]">
              知识回流待审批 5 条
            </p>
            <p className="mt-1 text-[8px] font-bold leading-relaxed text-[#7c8ba3]">
              项目专属标签经 CPA 专家审核后，才能升级为全所公共标签。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function WorkspaceViewTabs({
  active,
  onList,
  onGraph,
}: {
  active: "list" | "graph";
  onList: () => void;
  onGraph: () => void;
}) {
  return (
    <div className="mt-4 flex h-11 items-center gap-5 border-b border-[#e3e8ef] bg-white px-4 outline outline-1 outline-[#e2e7ef]">
      <button
        type="button"
        onClick={onList}
        className={`h-full border-b-2 text-[10px] font-black ${active === "list" ? "border-[#2e65c7] text-[#2e5fb4]" : "border-transparent text-[#78869b]"}`}
      >
        列表视图
      </button>
      <button
        type="button"
        onClick={onGraph}
        className={`h-full border-b-2 text-[10px] font-black ${active === "graph" ? "border-[#2e65c7] text-[#2e5fb4]" : "border-transparent text-[#78869b]"}`}
      >
        图谱视图
      </button>
    </div>
  );
}

function CandidateReview({
  stage,
  onStageChange,
  onGraph,
  onGraphReady,
}: {
  stage: "parameters" | "candidates";
  onStageChange: (stage: "parameters" | "candidates") => void;
  onGraph: () => void;
  onGraphReady: () => void;
}) {
  const [decisions, setDecisions] = useState<
    Record<string, "待确认" | "调整" | "排除">
  >({});
  const candidates: AuditRule[] = graphStudioNodes.map((node, index) => {
    const type: RuleType =
      node.kind === "风险信号" || node.kind === "复合风险"
        ? "风险信号"
        : node.kind === "内控测试"
          ? "内控测试"
          : node.kind === "审计程序"
            ? "审计程序"
            : "合规检查";
    const executor =
      node.kind === "风险信号" || node.kind === "项目配置"
        ? "规则引擎"
        : node.kind === "人工节点"
          ? "人工执行"
          : node.kind === "审计程序" || node.kind === "合规检查"
            ? "AI 初筛 + 人工"
          : index % 2 === 0
            ? "大模型"
            : "AI 初筛 + 人工";
    return {
      id: node.id,
      name: node.label,
      type,
      cycle: node.kind,
      executor,
      status: "待复核",
      version: "v1.0",
      description: `${node.label}项目候选节点`,
      upstream: graphStudioEdges
        .filter(([, to]) => to === node.id)
        .map(([from]) => graphStudioNodes.find((item) => item.id === from)?.label ?? from),
      downstream: graphStudioEdges
        .filter(([from]) => from === node.id)
        .map(([, to]) => graphStudioNodes.find((item) => item.id === to)?.label ?? to),
    };
  });
  if (stage === "parameters")
    return (
      <>
        <WorkspaceViewTabs active="list" onList={() => {}} onGraph={onGraph} />
        <section className="mt-3 overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e2e7ef]">
          <header className="flex flex-col gap-3 border-b border-[#e7ebf1] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-[#2c3c58]">
                  华东智造有限公司2026年度审计
                </h2>
                <span className="rounded bg-amber-50 px-2 py-1 text-[8px] font-black text-amber-700">
                  待项目经理确认
                </span>
              </div>
              <p className="mt-1 text-[9px] font-bold text-[#8794a7]">
                项目准备 · 第 1 步 / 2 · 重要性参数确认
              </p>
            </div>
            <div className="flex rounded-lg border border-[#d7dfeb] bg-[#f7f9fc] p-1">
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-[8px] font-black text-[#315ca9] shadow-sm"
              >
                重要性参数
              </button>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-md px-3 py-2 text-[8px] font-bold text-[#a1aab8]"
              >
                候选标注集 · 未解锁
              </button>
            </div>
          </header>
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h3 className="text-xs font-black text-[#34445e]">
                规则引擎计算结果
              </h3>
              <p className="mt-1 text-[9px] font-bold text-[#8794a7]">
                请核对计算基准、比例和财务数据。确认后参数锁定，系统再生成候选标注集。
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["整体重要性", "$materiality", "150 万元"],
                  ["实际执行重要性", "$performance_materiality", "112.5 万元"],
                  ["明显微小错报", "$trivial_threshold", "7.5 万元"],
                ].map(([label, code, value]) => (
                  <div
                    key={code}
                    className="rounded-lg border border-[#dfe5ee] p-4"
                  >
                    <span className="text-[9px] font-black text-[#506079]">
                      {label}
                    </span>
                    <code className="mt-1 block text-[7px] font-bold text-[#929daf]">
                      {code}
                    </code>
                    <strong className="mt-3 block text-xl font-black text-[#2e4f91]">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-lg bg-[#f4f7fd] p-4">
                <h4 className="text-[9px] font-black text-[#40557b]">
                  本次计算依据
                </h4>
                <dl className="mt-3 grid gap-3 text-[9px] sm:grid-cols-2">
                  {[
                    ["计算基准", "税前利润"],
                    ["适用比例", "5%"],
                    ["税前利润", "3,000 万元"],
                    ["利润率", "5%（超过 3%）"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="font-bold text-[#8c98aa]">{label}</dt>
                      <dd className="mt-1 font-black text-[#485872]">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 border-t border-[#dfe6f1] pt-3 text-[8px] font-bold leading-relaxed text-[#6f7f98]">
                  规则：税前利润为正且利润率超过 3%，整体重要性 = 税前利润 ×
                  5%；实际执行重要性 = 整体重要性 × 75%；明显微小错报 =
                  整体重要性 × 5%。
                </p>
              </div>
            </div>
            <aside className="rounded-lg border border-[#e0e5ed] bg-[#fbfcfd] p-4">
              <h3 className="text-[10px] font-black text-[#3e4f69]">
                项目经理确认
              </h3>
              <div className="mt-3 space-y-2">
                {[
                  "客户及审计期间正确",
                  "财务数据与报表一致",
                  "计算基准和比例适当",
                ].map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-[8px] font-bold text-[#5c6c84]"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#2459c4]"
                    />
                    {item}
                  </label>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-amber-50 p-3 text-[8px] font-bold leading-relaxed text-amber-800">
                确认后参数将锁定。需要调整时必须填写理由并生成新版本。
              </div>
              <button
                type="button"
                onClick={() => onStageChange("candidates")}
                className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2459c4] text-[9px] font-black text-white"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                确认并锁定参数
              </button>
            </aside>
          </div>
        </section>
      </>
    );
  return (
    <>
      <WorkspaceViewTabs active="list" onList={() => {}} onGraph={onGraph} />
      <section className="mt-3 overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e2e7ef]">
        <header className="flex flex-col gap-3 border-b border-[#e7ebf1] p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-[#2c3c58]">
                华东智造有限公司2026年度审计
              </h2>
              <span className="rounded bg-amber-50 px-2 py-1 text-[8px] font-black text-amber-700">
                候选审核
              </span>
              <span className="rounded bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">
                重要性参数已锁定
              </span>
            </div>
            <p className="mt-1 text-[9px] font-bold text-[#8794a7]">
              项目准备 · 第 2 步 / 2 · Scope 规则匹配 173 条候选标注
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#d7dfeb] bg-[#f7f9fc] p-1">
              <button
                type="button"
                onClick={() => onStageChange("parameters")}
                className="rounded-md px-3 py-2 text-[8px] font-bold text-[#7a879a]"
              >
                重要性参数
              </button>
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-[8px] font-black text-[#315ca9] shadow-sm"
              >
                候选标注集
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                onGraphReady();
                onGraph();
              }}
              className="h-9 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white"
            >
              冻结候选集并启动 DAG
            </button>
          </div>
        </header>
        <div className="grid grid-cols-2 gap-2 border-b border-[#edf0f4] bg-[#fafbfc] p-3 sm:grid-cols-4">
          {[
            ["待确认", "18"],
            ["默认纳入", "142"],
            ["已排除", "9"],
            ["待补充", "4"],
          ].map(([name, count]) => (
            <div
              key={name}
              className="rounded-lg bg-white px-3 py-2 outline outline-1 outline-[#e6eaf0]"
            >
              <span className="text-[8px] font-bold text-[#8995a7]">
                {name}
              </span>
              <strong className="ml-2 text-sm font-black text-[#3c4d69]">
                {count}
              </strong>
            </div>
          ))}
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[850px]">
            <div className="grid grid-cols-[110px_minmax(190px,1fr)_105px_120px_minmax(150px,1fr)_168px] gap-3 bg-[#fafbfc] px-4 py-2.5 text-[8px] font-black text-[#8a96a8]">
              <span>编号</span>
              <span>候选标签</span>
              <span>类型</span>
              <span>推荐来源</span>
              <span>推荐理由</span>
              <span>人工决定</span>
            </div>
            {candidates.map((rule) => {
              const decision = decisions[rule.id] ?? "待确认";
              return (
                <div
                  key={rule.id}
                  className="grid grid-cols-[110px_minmax(190px,1fr)_105px_120px_minmax(150px,1fr)_168px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3"
                >
                  <span className="font-mono text-[8px] font-black text-[#5c6d86]">
                    {rule.id}
                  </span>
                  <span>
                    <strong className="block text-[10px] font-black text-[#34445f]">
                      {rule.name}
                    </strong>
                    <small className="mt-1 block truncate text-[8px] font-bold text-[#929daf]">
                      {rule.cycle}
                    </small>
                  </span>
                  <span
                    className={`justify-self-start rounded border px-1.5 py-1 text-[8px] font-black ${typeTone[rule.type]}`}
                  >
                    {rule.type}
                  </span>
                  <span className="text-[8px] font-bold text-[#67768d]">
                    {rule.id.startsWith("CC") ? "Scope 强制" : "Graph RAG"}
                  </span>
                  <span className="truncate text-[8px] font-bold text-[#77859a]">
                    {rule.upstream.join(" + ")} 关联推荐
                  </span>
                  <span className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setDecisions((prev) => ({ ...prev, [rule.id]: "调整" }))}
                      className={`h-7 rounded-md px-2 text-[8px] font-black ${decision === "调整" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}
                    >
                      调整
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDecisions((prev) => ({ ...prev, [rule.id]: "排除" }))
                      }
                      className={`h-7 rounded-md px-2 text-[8px] font-black ${decision === "排除" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700"}`}
                    >
                      排除
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function ExecutionCenter() {
  const [mode, setMode] = useState<"标签" | "人员">("标签");
  return (
    <section className="mt-4 overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e2e7ef]">
      <header className="flex flex-col gap-3 border-b border-[#e7ebf1] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-[#2c3c58]">分配与执行中心</h2>
          <p className="mt-1 text-[9px] font-bold text-[#8794a7]">
            华东智造有限公司2026年度审计 · 方案 v1.0
          </p>
        </div>
        <div className="flex h-9 rounded-lg border border-[#d7dfeb] bg-white p-1">
          {(["标签", "人员"] as const).map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-md px-4 text-[9px] font-black ${mode === item ? "bg-[#eaf0ff] text-[#315db4]" : "text-[#748197]"}`}
            >
              按{item}查看
            </button>
          ))}
        </div>
      </header>
      {mode === "标签" ? (
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[110px_minmax(180px,1fr)_90px_95px_95px_100px_80px] gap-3 bg-[#fafbfc] px-4 py-2.5 text-[8px] font-black text-[#8b97a8]">
              <span>编号</span>
              <span>执行标签</span>
              <span>负责人</span>
              <span>复核人</span>
              <span>状态</span>
              <span>截止时间</span>
              <span>进度</span>
            </div>
            {rules.slice(0, 7).map((rule, index) => {
              const states = ["进行中", "待补充资料", "待复核", "已完成"];
              const state = states[index % states.length];
              return (
                <div
                  key={rule.id}
                  className="grid grid-cols-[110px_minmax(180px,1fr)_90px_95px_95px_100px_80px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3 text-[9px]"
                >
                  <span className="font-mono text-[8px] font-black text-[#596a83]">
                    {rule.id}
                  </span>
                  <strong className="truncate text-[10px] font-black text-[#35455f]">
                    {rule.name}
                  </strong>
                  <span className="font-bold text-[#596982]">
                    {["陈华", "蔡宇豪", "王磊"][index % 3]}
                  </span>
                  <span className="font-bold text-[#596982]">符金雨</span>
                  <span
                    className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${state === "进行中" ? "bg-blue-50 text-blue-700" : state === "待补充资料" ? "bg-rose-50 text-rose-700" : state === "待复核" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {state}
                  </span>
                  <span className="font-bold text-[#6d7b90]">
                    2026-08-{12 + index}
                  </span>
                  <span className="font-black text-[#4564a3]">
                    {[45, 20, 80, 100][index % 4]}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["陈华", "18", "6", "2"],
            ["蔡宇豪", "16", "4", "1"],
            ["王磊", "14", "5", "3"],
            ["符金雨", "12", "3", "0"],
          ].map(([name, total, doing, overdue]) => (
            <button
              type="button"
              key={name}
              className="rounded-xl border border-[#e1e6ee] p-4 text-left hover:border-[#aabbd9]"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf0ff] text-xs font-black text-[#4063aa]">
                  {name.slice(0, 1)}
                </span>
                <div>
                  <strong className="text-xs font-black text-[#34445e]">
                    {name}
                  </strong>
                  <p className="mt-1 text-[8px] font-bold text-[#8e99aa]">
                    审计项目成员
                  </p>
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2">
                <div>
                  <dt className="text-[8px] text-[#929dae]">负责</dt>
                  <dd className="mt-1 text-sm font-black text-[#3d4e69]">
                    {total}
                  </dd>
                </div>
                <div>
                  <dt className="text-[8px] text-[#929dae]">进行中</dt>
                  <dd className="mt-1 text-sm font-black text-blue-600">
                    {doing}
                  </dd>
                </div>
                <div>
                  <dt className="text-[8px] text-[#929dae]">逾期</dt>
                  <dd className="mt-1 text-sm font-black text-rose-600">
                    {overdue}
                  </dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function AgentOrchestration({
  onNavigate,
}: {
  onNavigate: (view: "library" | "graph" | "review" | "execution") => void;
}) {
  const agents = [
    {
      id: "scope",
      name: "Scope 匹配 Agent",
      role: "项目范围识别",
      color: "bg-blue-500",
      status: "运行中",
      task: "根据客户信息筛选候选标签",
    },
    {
      id: "graph",
      name: "图谱检索 Agent",
      role: "Graph RAG",
      color: "bg-violet-500",
      status: "运行中",
      task: "补齐跨循环关联标签",
    },
    {
      id: "plan",
      name: "审计方案 Agent",
      role: "方案编排",
      color: "bg-emerald-500",
      status: "等待确认",
      task: "生成保留、排除和调整建议",
    },
    {
      id: "assign",
      name: "执行协调 Agent",
      role: "分配与进度",
      color: "bg-cyan-500",
      status: "待命",
      task: "按角色与负荷建议负责人",
    },
    {
      id: "evidence",
      name: "证据资料 Agent",
      role: "资料核验",
      color: "bg-amber-500",
      status: "待命",
      task: "识别缺失资料并发起补充",
    },
    {
      id: "review",
      name: "质量复核 Agent",
      role: "结论复核",
      color: "bg-rose-500",
      status: "待命",
      task: "检查证据充分性与结论一致性",
    },
    {
      id: "learn",
      name: "知识回流 Agent",
      role: "经验沉淀",
      color: "bg-indigo-500",
      status: "待命",
      task: "提炼项目专属标签升级建议",
    },
  ];
  const [activeId, setActiveId] = useState("scope");
  const [running, setRunning] = useState(false);
  const active = agents.find((agent) => agent.id === activeId) ?? agents[0];
  return (
    <section className="mt-4 grid min-h-[610px] overflow-hidden rounded-xl bg-white outline outline-1 outline-[#dfe5ee] lg:grid-cols-[210px_minmax(0,1fr)_280px]">
      <aside className="border-b border-[#e6eaf0] bg-[#f8f9fb] lg:border-b-0 lg:border-r">
        <div className="border-b border-[#e5e9ef] p-4">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#345db1]" />
            <h2 className="text-xs font-black text-[#30405b]">AI Agent 团队</h2>
          </div>
          <p className="mt-1 text-[8px] font-bold text-[#8d98aa]">
            7 个专业 Agent · CPA 全程监督
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-2 lg:grid-cols-1">
          {agents.map((agent) => (
            <button
              type="button"
              key={agent.id}
              onClick={() => setActiveId(agent.id)}
              className={`rounded-lg p-2.5 text-left ${activeId === agent.id ? "bg-white outline outline-1 outline-[#cbd7eb]" : "hover:bg-white/70"}`}
            >
              <span className="flex items-start gap-2">
                <span
                  className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${agent.color}`}
                />
                <span className="min-w-0">
                  <strong className="block truncate text-[9px] font-black text-[#35445e]">
                    {agent.name}
                  </strong>
                  <small className="mt-1 block truncate text-[8px] font-bold text-[#8a96a8]">
                    {agent.role}
                  </small>
                </span>
              </span>
            </button>
          ))}
        </div>
      </aside>
      <main className="min-w-0 bg-white">
        <header className="flex items-center justify-between border-b border-[#e7ebf1] px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${active.color}`} />
              <h2 className="text-xs font-black text-[#2f405d]">
                {active.name}
              </h2>
              <span className="rounded bg-emerald-50 px-1.5 py-1 text-[7px] font-black text-emerald-700">
                {running ? "正在执行" : active.status}
              </span>
            </div>
            <p className="mt-1 text-[8px] font-bold text-[#8a96a8]">
              华东智造有限公司2026年度审计 · 当前任务：{active.task}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRunning((current) => !current)}
            className={`h-8 rounded-lg px-3 text-[8px] font-black text-white ${running ? "bg-[#52647e]" : "bg-[#2459c4]"}`}
          >
            {running ? "暂停运行" : "运行 Agent"}
          </button>
        </header>
        <div className="space-y-3 p-4">
          <div className="rounded-lg bg-[#f5f7fa] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black text-[#65748b]">
                项目经理指令
              </span>
              <span className="text-[7px] font-bold text-[#9aa4b3]">10:32</span>
            </div>
            <p className="mt-2 text-[9px] font-bold leading-relaxed text-[#3f4f69]">
              请基于客户所属制造业、民营企业、年度审计和现有财务资料，生成候选标注集，并说明每条标签的推荐原因。高风险标签进入人工确认。
            </p>
          </div>
          <div className="rounded-lg border border-[#dfe6f2] p-3">
            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 place-items-center rounded-full text-white ${active.color}`}
              >
                <Bot className="h-3.5 w-3.5" />
              </span>
              <div>
                <span className="text-[9px] font-black text-[#3a4a65]">
                  {active.name}
                </span>
                <p className="mt-0.5 text-[7px] font-bold text-[#929dae]">
                  已读取项目 Scope 与公共标签库 v2026.08
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-[9px] font-bold leading-relaxed text-[#53627a]">
              <p>
                已完成实体类型、行业、业态和业务类型硬过滤，从 286
                条公共标签中筛选出 154 条直接适用标签。
              </p>
              <p>
                Graph RAG 发现 19 条关联标签，其中 7 条来自跨循环风险关系，12
                条来自强制程序和完成阶段依赖。
              </p>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["候选标签", "173"],
                ["平均置信度", "91%"],
                ["需人工确认", "18"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-[#f3f6fb] p-2">
                  <span className="block text-[7px] font-bold text-[#8793a6]">
                    {label}
                  </span>
                  <strong className="mt-1 block text-sm font-black text-[#38578f]">
                    {value}
                  </strong>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate("review")}
                className="h-8 rounded-md bg-[#2459c4] px-3 text-[8px] font-black text-white"
              >
                进入候选审核
              </button>
              <button
                type="button"
                onClick={() => onNavigate("graph")}
                className="h-8 rounded-md border border-[#cdd7e6] px-3 text-[8px] font-black text-[#506893]"
              >
                查看推荐图谱
              </button>
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#dce3ed] px-3">
            <input
              className="min-w-0 flex-1 bg-transparent text-[9px] font-bold text-[#43516a] outline-none"
              placeholder={`给 ${active.name} 补充指令…`}
            />
            <button
              type="button"
              className="rounded-md bg-[#293b58] px-3 py-2 text-[8px] font-black text-white"
            >
              发送
            </button>
          </label>
        </div>
      </main>
      <aside className="border-t border-[#e6eaf0] bg-[#fbfcfd] lg:border-l lg:border-t-0">
        <header className="border-b border-[#e6eaf0] p-4">
          <h2 className="text-xs font-black text-[#32425d]">运行详情</h2>
          <p className="mt-1 text-[8px] font-bold text-[#8d98a9]">
            证据、工具调用与人工交接
          </p>
        </header>
        <div className="space-y-4 p-4">
          <div>
            <h3 className="text-[8px] font-black text-[#76849a]">
              本次使用的数据
            </h3>
            <div className="mt-2 space-y-1.5">
              {[
                "项目 Scope 配置",
                "公共标签库 v2026.08",
                "客户财务报表",
                "历史制造业项目 23 个",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-md bg-white px-2.5 py-2 text-[8px] font-bold text-[#586880] outline outline-1 outline-[#e7eaf0]"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[8px] font-black text-[#76849a]">
              工具调用轨迹
            </h3>
            <div className="mt-2 space-y-2">
              {[
                ["Scope Filter", "286 → 154"],
                ["Graph Retrieve", "补充 19 条"],
                ["Risk Ranker", "高风险 12 条"],
                ["Explanation", "生成 173 条理由"],
              ].map(([tool, result], index) => (
                <div key={tool} className="flex items-start gap-2">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e9effb] text-[7px] font-black text-[#4064ad]">
                    {index + 1}
                  </span>
                  <div>
                    <strong className="block text-[8px] font-black text-[#4a5a73]">
                      {tool}
                    </strong>
                    <small className="mt-0.5 block text-[7px] font-bold text-[#929cac]">
                      {result}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              人工确认边界
            </div>
            <p className="mt-2 text-[8px] font-bold leading-relaxed text-amber-800">
              Agent
              可以筛选、推荐和生成调整建议；排除强制标签、冻结方案和修改公共标签必须由
              CPA 确认。
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}

type GraphWorkspaceTab =
  "list" | "graph" | "risk" | "review" | "execution" | "layout";

type CreatedAuditProject = {
  id: string;
  name: string;
  client: string;
  period: string;
};

function MaterialityReviewPanel({
  confirmed,
  onConfirm,
}: {
  confirmed: boolean;
  onConfirm: () => void;
}) {
  const [overrideReason, setOverrideReason] = useState("");
  const [materiality, setMateriality] = useState("150");
  const [performanceMateriality, setPerformanceMateriality] = useState("112.5");
  const [trivialThreshold, setTrivialThreshold] = useState("7.5");
  const [aiDecision, setAiDecision] = useState<
    "pending" | "accepted" | "rejected" | "manual"
  >("pending");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [calculatedAt, setCalculatedAt] = useState("2026-08-07 11:18");
  const parameterValuesAreValid = [
    materiality,
    performanceMateriality,
    trivialThreshold,
  ].every((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  const needsOverrideReason = aiDecision === "manual";
  const canConfirm =
    parameterValuesAreValid &&
    (!needsOverrideReason || Boolean(overrideReason.trim()));
  const updateMateriality = (value: string) => {
    setAiDecision("manual");
    setMateriality(value);
    const amount = Number(value);
    if (Number.isFinite(amount)) {
      setPerformanceMateriality(String(Math.round(amount * 75) / 100));
      setTrivialThreshold(String(Math.round(amount * 5) / 100));
    }
  };
  const parameterCards = [
    {
      label: "整体重要性",
      code: "$materiality",
      value: materiality,
      formula: "税前利润 × 5%",
      onChange: updateMateriality,
    },
    {
      label: "实际执行重要性",
      code: "$performance_materiality",
      value: performanceMateriality,
      formula: "整体重要性 × 75%",
      onChange: (value: string) => {
        setAiDecision("manual");
        setPerformanceMateriality(value);
      },
    },
    {
      label: "明显微小错报",
      code: "$trivial_threshold",
      value: trivialThreshold,
      formula: "整体重要性 × 5%",
      onChange: (value: string) => {
        setAiDecision("manual");
        setTrivialThreshold(value);
      },
    },
  ];
  return (
    <section>
      <header className="px-1 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-[#364760]">
              重要性参数确认
            </h3>
            <span
              className={`rounded px-2 py-1 text-[8px] font-black ${confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
            >
              {confirmed ? "已确认并锁定" : "待项目经理确认"}
            </span>
          </div>
          <p className="mt-1 text-[9px] font-bold text-[#74839a]">
            核对财务数据、计算基准和适用比例；必要时覆盖参数并填写理由。
          </p>
        </div>
        <div className="mt-3 flex items-center gap-3 text-[8px] font-bold text-[#8b97aa]">
          {!confirmed && (
            <button
              type="button"
              onClick={() => setCalculatedAt("2026-08-07 12:42")}
              className="h-8 rounded-md border border-[#cad5e7] px-3 text-[9px] font-black text-[#49649a]"
            >
              重新计算
            </button>
          )}
          <div>
            <span className="block">2026年度 · MAT-2026.08</span>
            <span className="mt-1 block">计算时间 {calculatedAt}</span>
          </div>
        </div>
      </header>
      <div className="space-y-5 p-5">
        <div className="min-w-0 space-y-5">
          <div className="space-y-4 border-b border-[#e1e6ed] pb-5">
            <div>
              <h4 className="text-[10px] font-black text-[#40516b]">
                程序计算 · 输入与规则匹配
              </h4>
              <div className="mt-2 space-y-2">
                {[
                  ["税前利润", "3,000 万元", "2026年度利润表 · 已校验"],
                  ["营业收入", "60,000 万元", "2026年度利润表 · 已校验"],
                  ["总资产", "85,000 万元", "2026-12-31资产负债表 · 已校验"],
                ].map(([label, value, source]) => (
                  <div key={label} className="rounded-md bg-[#f7f9fc] px-3 py-3">
                    <span className="text-[8px] font-bold text-[#8591a4]">
                      {label}
                    </span>
                    <strong className="mt-1 block text-[12px] font-black text-[#354963]">
                      {value}
                    </strong>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-md bg-[#f1f5fb] p-3">
                <GitBranch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4268b0]" />
                <p className="text-[8px] font-bold leading-relaxed text-[#60728f]">
                  <strong className="text-[#3f5d96]">命中规则：</strong>
                  税前利润为正，利润率 5% ＞ 3%，因此采用“税前利润 ×
                  5%”作为整体重要性计算路径。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen((current) => !current)}
                className="mt-2 text-[9px] font-black text-[#315ca9]"
              >
                {detailsOpen ? "收起详细依据与说明" : "查看详细依据与说明"} ›
              </button>
              {detailsOpen && (
                <div className="mt-2 rounded-md bg-[#f7f9fc] p-3 text-[9px] font-bold leading-relaxed text-[#66768d]">
                  <p>
                    数据来源：2026年度已校验利润表、2026年12月31日资产负债表；币种为人民币，单位已统一换算为万元。
                  </p>
                  <p className="mt-1.5">
                    规则判断：税前利润 3,000 万元为正；利润率 = 3,000 ÷ 60,000 =
                    5%，高于 3% 分界值，因此不采用营业收入或总资产基准。
                  </p>
                  <p className="mt-1.5">
                    派生过程：3,000 × 5% = 150；150 × 75% = 112.5；150 × 5% =
                    7.5。
                  </p>
                </div>
              )}
            </div>
            <div className="pt-2">
              <h4 className="text-[10px] font-black text-[#40516b]">
                程序计算 · 输出参数
              </h4>
              <div className="mt-2 space-y-2">
                {[
                  ["整体重要性", "150 万元"],
                  ["实际执行重要性", "112.5 万元"],
                  ["明显微小错报", "7.5 万元"],
                ].map(([label, value]) => (
                  <span
                    key={label}
                    className="block rounded-md bg-[#f7f9fc] px-3 py-3 text-[9px] font-bold text-[#75839a]"
                  >
                    <span className="block">{label}</span>
                    <b className="mt-1 block text-[13px] font-black text-[#365992]">
                      {value}
                    </b>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-[#f7f9fc] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="flex items-center gap-1.5 text-[10px] font-black text-[#36527f]">
                  <Bot className="h-3.5 w-3.5 text-[#416bc0]" />
                  大模型调整建议
                </h4>
                <p className="mt-1 text-[8px] font-bold text-[#74839a]">
                  分析非结构化客户资料，只提出建议，不直接覆盖程序计算值。
                </p>
              </div>
              <span className="rounded bg-white px-2 py-1 text-[8px] font-black text-[#526b98]">
                已引用 4 份资料
              </span>
            </div>
            <div className="mt-3">
              <div>
                <div className="grid grid-cols-[70px_minmax(0,1fr)] gap-2 rounded-md bg-white p-3">
                  <strong className="text-[8px] font-black text-[#52637b]">
                    分析依据
                  </strong>
                  <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                    {[
                      "管理层访谈纪要",
                      "董事会会议纪要",
                      "客户经营情况说明",
                      "行业风险简报·2026Q2",
                    ].map((source) => (
                      <span
                        key={source}
                        className="text-[8px] font-bold text-[#61728c] after:ml-1.5 after:text-[#b0bccd] after:content-['·'] last:after:content-none"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-[70px_minmax(0,1fr)] gap-2 rounded-md bg-white p-3">
                  <strong className="text-[8px] font-black text-[#52637b]">
                    风险发现
                  </strong>
                  <ul className="space-y-1.5 text-[9px] font-bold leading-relaxed text-[#566981]">
                    <li>
                      • 客户本期存在业绩承诺和新增融资安排，管理层业绩压力上升。
                    </li>
                    <li>
                      • 制造业主要原材料价格波动扩大，毛利率判断不确定性增加。
                    </li>
                    <li>• 新生产线投产导致存货和固定资产估计事项增加。</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="mt-2 text-[8px] font-black text-[#315ca9]"
                >
                  查看引用原文与分析依据 ›
                </button>
              </div>
              <div className="mt-4 rounded-md bg-white p-3">
                <span className="mb-2 block text-[8px] font-black text-[#52637b]">
                  建议输出
                </span>
                <span className="text-[8px] font-black text-[#6b7b92]">
                  建议采用更谨慎水平
                </span>
                <strong className="mt-1 block text-xl font-black text-[#315ca9]">
                  120 万元
                </strong>
                <p className="mt-1 text-[8px] font-bold text-[#77869b]">
                  较程序结果下调 20%
                </p>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMateriality("120");
                      setPerformanceMateriality("90");
                      setTrivialThreshold("6");
                      setAiDecision("accepted");
                    }}
                    className={`h-8 rounded-md text-[8px] font-black ${aiDecision === "accepted" ? "bg-[#2459c4] text-white" : "bg-[#eaf0fb] text-[#315ca9]"}`}
                  >
                    采纳建议
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMateriality("150");
                      setPerformanceMateriality("112.5");
                      setTrivialThreshold("7.5");
                      setAiDecision("rejected");
                    }}
                    className={`h-8 rounded-md text-[8px] font-black ${aiDecision === "rejected" ? "bg-[#52647e] text-white" : "bg-[#eef1f5] text-[#65748b]"}`}
                  >
                    不采纳
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[10px] font-black text-[#40516b]">
                  项目经理最终参数
                </h4>
                <span className="text-[8px] font-bold text-[#7d899b]">
                  {aiDecision === "accepted"
                    ? "已采纳 AI 建议"
                    : aiDecision === "rejected"
                      ? "采用程序计算结果"
                      : aiDecision === "manual"
                        ? "项目经理手工调整"
                        : "等待项目经理判断"}
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {parameterCards.map(
                  ({ label, code, value, formula, onChange }) => (
                    <div
                      key={code}
                      className={`rounded-md p-3 ${confirmed ? "bg-[#f7f9fc]" : "bg-[#f7f9fc]"}`}
                    >
                      <span className="text-[9px] font-black text-[#4b5d77]">
                        {label}
                      </span>
                      <code className="mt-1 block text-[7px] font-bold text-[#8d99aa]">
                        {code}
                      </code>
                      <label className="mt-3 flex items-center gap-1 border-b border-[#dbe3ef] pb-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={value}
                          disabled={confirmed}
                          onChange={(event) => onChange(event.target.value)}
                          aria-label={`${label}（万元）`}
                          className="min-w-0 flex-1 bg-transparent text-lg font-black text-[#2e55a0] outline-none disabled:cursor-default"
                        />
                        <span className="text-[9px] font-black text-[#718097]">
                          万元
                        </span>
                      </label>
                      <p className="mt-2 text-[7px] font-bold text-[#8491a4]">
                        {formula}
                      </p>
                    </div>
                  ),
                )}
              </div>
              {!confirmed && (
                <p className="mt-2 text-[8px] font-bold text-[#718097]">
                  可直接编辑。修改整体重要性时，系统按 75% 和 5%
                  联动重算后两项；也可继续单独调整派生参数。
                </p>
              )}
            </div>
            <div>
              <h4 className="text-[10px] font-black text-[#40516b]">
                参数用途说明
              </h4>
              <div className="mt-2 space-y-2">
                {[
                  [
                    "整体重要性",
                    "判断错报是否可能影响财务报表使用者决策，也是错报汇总监控基准。",
                  ],
                  [
                    "实际执行重要性",
                    "设计审计程序范围、抽样规模和重点项目筛选阈值。",
                  ],
                  [
                    "明显微小错报",
                    "低于该金额的问题通常无需累计；超过后进入错报处理流程。",
                  ],
                ].map(([label, description]) => (
                  <div key={label} className="rounded-md bg-[#f7f9fc] px-3 py-3">
                    <strong className="text-[9px] font-black text-[#405574]">
                      {label}
                    </strong>
                    <p className="mt-1.5 text-[8px] font-bold leading-relaxed text-[#74839a]">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-2 rounded-md bg-[#f1f5fb] p-3 text-[8px] font-bold text-[#60728f]">
                锁定后写入项目配置层，后续所有规则、步骤参数和 threshold
                统一引用这三个变量。
              </p>
            </div>
          </div>
          {aiDecision !== "pending" && !confirmed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[9px] font-black text-amber-900">
                  参数调整留痕
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setMateriality("150");
                    setPerformanceMateriality("112.5");
                    setTrivialThreshold("7.5");
                    setOverrideReason("");
                    setAiDecision("pending");
                  }}
                  className="text-[8px] font-black text-amber-800"
                >
                  恢复规则计算值
                </button>
              </div>
              <p className="mt-2 text-[8px] font-bold text-amber-800">
                原值：150 / 112.5 / 7.5 万元　→　新值：{materiality || "—"} /{" "}
                {performanceMateriality || "—"} / {trivialThreshold || "—"} 万元
              </p>
              <label className="mt-3 grid gap-1 text-[8px] font-black text-amber-900">
                项目经理判断理由{needsOverrideReason ? "（手工调整时必填）" : "（选填）"}
                <textarea
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                  className="h-16 resize-none rounded-md border border-amber-200 bg-white p-2 text-[9px] font-bold outline-none focus:border-amber-500"
                  placeholder="说明采纳、拒绝或另行调整的依据，以及采用的职业判断…"
                />
              </label>
            </div>
          )}
        </div>
        <aside className="rounded-lg border border-[#dce3ec] bg-[#fafbfc] p-4">
          <h4 className="text-[10px] font-black text-[#3f506a]">
            对后续审计的影响
          </h4>
          <div className="mt-3 space-y-2">
            {[
              [
                "收入截止测试",
                "抽样阈值",
                `${Math.round((Number(materiality) || 0) * 10) / 100} 万元`,
                "$materiality × 10%",
              ],
              [
                "应收账款函证",
                "重点关注",
                `单笔 ＞ ${performanceMateriality || "—"} 万元`,
                "$performance_materiality",
              ],
              [
                "错报汇总监控",
                "预警标准",
                `累计错报 ÷ ${materiality || "—"} 万元`,
                "$materiality",
              ],
            ].map(([name, label, value, variable]) => (
              <div
                key={name}
                className="rounded-md bg-white p-3"
              >
                <strong className="text-[9px] font-black text-[#40516b]">
                  {name}
                </strong>
                <p className="mt-1 text-[8px] font-bold text-[#77859a]">
                  {label}：<b className="text-[#315ca9]">{value}</b>
                </p>
                <code className="mt-1 block text-[7px] font-bold text-[#929dae]">
                  引用 {variable}
                </code>
              </div>
            ))}
          </div>
          <div className="my-4 h-2" />
          <h4 className="text-[10px] font-black text-[#3f506a]">
            项目经理确认
          </h4>
          <div className="mt-3 space-y-2">
            {[
              "客户与审计期间正确",
              "财务数据与报表一致",
              "计算基准和比例适当",
              "三个参数与项目风险匹配",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center gap-2 rounded-md bg-white px-3 py-2.5 text-[8px] font-bold text-[#596a83]"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="accent-[#2459c4]"
                  disabled={confirmed}
                />
                {item}
              </label>
            ))}
          </div>
          {confirmed ? (
            <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-center gap-2 text-[9px] font-black text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                参数已锁定
              </div>
              <dl className="mt-2 space-y-1 text-[8px] font-bold text-emerald-800">
                <div className="flex justify-between">
                  <dt>确认人</dt>
                  <dd>符金雨 · 项目经理</dd>
                </div>
                <div className="flex justify-between">
                  <dt>确认时间</dt>
                  <dd>2026-08-07 11:21</dd>
                </div>
                <div className="flex justify-between">
                  <dt>版本</dt>
                  <dd>v1.0</dd>
                </div>
              </dl>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={!canConfirm}
                onClick={onConfirm}
                aria-describedby={!canConfirm ? "materiality-confirm-hint" : undefined}
                className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2459c4] text-[9px] font-black text-white transition-colors hover:bg-[#1d4ca9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2459c4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#cbd3df]"
              >
                确认并锁定参数
              </button>
              {!canConfirm && (
                <p
                  id="materiality-confirm-hint"
                  className="mt-2 text-[8px] font-bold leading-relaxed text-[#6b7890]"
                  role="status"
                >
                  {!parameterValuesAreValid
                      ? "三个参数都必须是大于 0 的有效数值。"
                      : "手工调整了参数，请填写项目经理判断理由后再锁定。"}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}

function LibraryTagListPanel({
  nodes,
  onReference,
}: {
  nodes: Array<{ id: string; label: string; kind: string; color: string }>;
  onReference: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("全部类型");
  const [status, setStatus] = useState("全部状态");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const kinds = ["全部类型", "风险信号", "内控测试", "审计程序", "合规检查"];
  const statuses = ["全部状态", "生效中", "待复核", "草稿"];
  const rows = nodes.map((node, index) => ({
    ...node,
    code: `${node.kind === "风险信号" ? "RS" : node.kind === "内控测试" ? "CT" : node.kind === "审计程序" ? "AP" : "CC"}-${String(nodes.slice(0, index + 1).filter((item) => item.kind === node.kind).length).padStart(3, "0")}`,
    status:
      (index * 73) % 173 < 147
        ? "生效中"
        : (index * 73) % 173 < 163
          ? "待复核"
          : "草稿",
    version: `v${1 + (index % 3)}.${index % 10}`,
    owner: ["审计方法组", "财务审计组", "内控与合规组"][index % 3],
    projects: 2 + ((index * 7) % 43),
    updated: `2026-0${5 + (index % 3)}-${String(8 + (index % 20)).padStart(2, "0")}`,
  }));
  const filtered = rows.filter(
    (row) =>
      (kind === "全部类型" || row.kind === kind) &&
      (status === "全部状态" || row.status === status) &&
      `${row.code}${row.label}${row.owner}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const active = rows.find((row) => row.id === activeId);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(1), [query, kind, status]);
  const toggleAll = () =>
    setSelected(
      pageRows.every((row) => selected.includes(row.id))
        ? selected.filter((id) => !pageRows.some((row) => row.id === id))
        : Array.from(new Set([...selected, ...pageRows.map((row) => row.id)])),
    );
  return (
    <div className="relative flex h-full min-h-0 bg-[#f7f9fc]">
      <main className="min-w-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="mx-auto max-w-[1180px]">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-black text-[#2f405b]">
                全所标签资产
              </h2>
              <p className="mt-1 text-[10px] font-bold text-[#718097]">
                统一查看、维护和发布全所公共标签；项目只引用已生效版本。
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="h-9 rounded-md border border-[#cdd7e6] bg-white px-3 text-[10px] font-black text-[#506893]"
              >
                导出清单
              </button>
              <button
                type="button"
                onClick={() => onReference("新建全所标签")}
                className="flex h-9 items-center gap-1.5 rounded-md bg-[#2459c4] px-4 text-[10px] font-black text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                新建标签
              </button>
            </div>
          </header>

          <section className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#dfe5ed] bg-[#dfe5ed] sm:grid-cols-4">
            {[
              ["标签总数", "173", "全所公共资产"],
              ["生效中", "147", "可被项目引用"],
              ["待复核", "16", "等待方法组审批"],
              ["草稿", "10", "尚未发布"],
            ].map(([label, value, note]) => (
              <div key={label} className="bg-white px-4 py-3">
                <span className="text-[9px] font-bold text-[#7e8b9f]">
                  {label}
                </span>
                <div className="mt-1 flex items-end gap-2">
                  <strong className="text-xl font-black text-[#334761]">
                    {value}
                  </strong>
                  <small className="pb-0.5 text-[8px] font-bold text-[#929daf]">
                    {note}
                  </small>
                </div>
              </div>
            ))}
          </section>

          <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#e7ebf1] p-3">
              <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-md border border-[#d7dfeb] px-3">
                <Search className="h-3.5 w-3.5 text-[#8491a4]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索编号、标签名称或负责人"
                  className="min-w-0 flex-1 bg-transparent text-[10px] font-bold text-[#43536c] outline-none placeholder:text-[#929dae]"
                />
              </label>
              {[
                { value: kind, set: setKind, options: kinds },
                { value: status, set: setStatus, options: statuses },
              ].map((filter, index) => (
                <label key={index} className="relative">
                  <select
                    value={filter.value}
                    onChange={(event) => filter.set(event.target.value)}
                    className="h-9 appearance-none rounded-md border border-[#d7dfeb] bg-white pl-3 pr-8 text-[10px] font-black text-[#56667e] outline-none focus:border-[#7394ce]"
                  >
                    {filter.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3 w-3 text-[#8491a4]" />
                </label>
              ))}
              <span className="ml-auto text-[9px] font-bold text-[#8794a7]">
                当前显示 {filtered.length} / 173
              </span>
            </div>
            {selected.length > 0 && (
              <div className="flex h-10 items-center gap-3 border-b border-[#dce5f3] bg-[#f3f7fd] px-4 text-[9px] font-bold text-[#526b98]">
                <span>已选择 {selected.length} 条</span>
                <button type="button" className="font-black text-[#315ca9]">
                  批量提交复核
                </button>
                <button type="button" className="font-black text-[#315ca9]">
                  批量导出
                </button>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="ml-auto text-[#77869b]"
                >
                  取消选择
                </button>
              </div>
            )}
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[950px]">
                <div className="grid grid-cols-[32px_92px_minmax(180px,1.3fr)_100px_100px_105px_110px_90px_105px] items-center gap-3 bg-[#fafbfc] px-4 py-2.5 text-[9px] font-black text-[#7d899b]">
                  <input
                    type="checkbox"
                    checked={
                      pageRows.length > 0 &&
                      pageRows.every((row) => selected.includes(row.id))
                    }
                    onChange={toggleAll}
                    className="accent-[#2459c4]"
                  />
                  <span>标签编号</span>
                  <span>标签名称</span>
                  <span>类型</span>
                  <span>状态</span>
                  <span>当前版本</span>
                  <span>维护负责人</span>
                  <span>项目引用</span>
                  <span>最近更新</span>
                </div>
                {pageRows.map((row) => (
                  <button
                    type="button"
                    key={row.id}
                    onClick={() => setActiveId(row.id)}
                    className="grid w-full grid-cols-[32px_92px_minmax(180px,1.3fr)_100px_100px_105px_110px_90px_105px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3 text-left hover:bg-[#f7f9fd]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(row.id)
                            ? current.filter((id) => id !== row.id)
                            : [...current, row.id],
                        )
                      }
                      className="accent-[#2459c4]"
                    />
                    <span className="font-mono text-[9px] font-black text-[#5d6d84]">
                      {row.code}
                    </span>
                    <span>
                      <strong className="block text-[11px] font-black text-[#34445f]">
                        {row.label.replace(/\s\d+$/, "")}
                      </strong>
                      <small className="mt-1 block truncate text-[9px] font-bold text-[#8b97a8]">
                        {row.kind === "风险信号"
                          ? "识别项目异常并触发审计响应"
                          : row.kind === "内控测试"
                            ? "评价关键控制设计与执行有效性"
                            : row.kind === "审计程序"
                              ? "形成充分、适当的审计证据"
                              : "核查法规与制度遵循情况"}
                      </small>
                    </span>
                    <span
                      className="justify-self-start rounded border px-2 py-1 text-[9px] font-black"
                      style={{
                        color: row.color,
                        borderColor: `${row.color}55`,
                        background: `${row.color}10`,
                      }}
                    >
                      {row.kind}
                    </span>
                    <span
                      className={`justify-self-start rounded px-2 py-1 text-[9px] font-black ${row.status === "生效中" ? "bg-emerald-50 text-emerald-700" : row.status === "待复核" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}
                    >
                      {row.status}
                    </span>
                    <span className="text-[10px] font-black text-[#53647d]">
                      {row.version}
                    </span>
                    <span className="text-[9px] font-bold text-[#65748b]">
                      {row.owner}
                    </span>
                    <span className="text-[10px] font-black text-[#3f63a5]">
                      {row.projects} 个
                    </span>
                    <span className="text-[9px] font-bold text-[#7c899c]">
                      {row.updated}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <footer className="flex items-center justify-between border-t border-[#e7ebf1] px-4 py-3 text-[9px] font-bold text-[#7d899b]">
              <span>共 {filtered.length} 条结果 · 每页 20 条</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="h-7 rounded-md border border-[#d7dfeb] px-2.5 font-black text-[#536b98] disabled:text-[#b5becb]"
                >
                  上一页
                </button>
                <span>
                  第 {page} / {totalPages} 页
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="h-7 rounded-md border border-[#d7dfeb] px-2.5 font-black text-[#536b98] disabled:text-[#b5becb]"
                >
                  下一页
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>
      {active && (
        <aside className="flex w-[270px] shrink-0 flex-col border-l border-[#dce3ed] bg-white shadow-[-6px_0_16px_rgba(40,57,88,.08)]">
          <header className="flex items-start justify-between border-b border-[#e4e8ef] px-4 py-3">
            <div>
              <span className="font-mono text-[8px] font-black text-[#7d899a]">
                {active.code}
              </span>
              <h3 className="mt-1 text-[13px] font-black text-[#2f405a]">
                {active.label.replace(/\s\d+$/, "")}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              aria-label="关闭标签详情"
              className="grid h-7 w-7 place-items-center rounded-md hover:bg-[#f1f3f6]"
            >
              <X className="h-3.5 w-3.5 text-[#7d899b]" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-wrap gap-1.5">
            <span
              className="rounded px-2 py-1 text-[8px] font-black text-white"
              style={{ background: active.color }}
            >
              {active.kind}
            </span>
            <span className="rounded border border-[#dce3ed] px-2 py-1 text-[8px] font-bold text-[#66758b]">
              全所标签
            </span>
          </div>
          <p className="mt-3 text-[10px] font-bold leading-[1.7] text-[#607089]">该标签由全所方法组统一维护，项目 Scope 命中后进入候选集，并在人工确认后参与项目 DAG 构建。</p>
          <div className="mt-5"><h4 className="border-b border-[#e7ebf0] pb-2 text-[9px] font-black text-[#586982]">标签状态</h4><div className="mt-3 rounded-md bg-[#f5f7fa] p-3 text-[9px] font-bold leading-relaxed text-[#6d7b90]">该标签尚未进入具体项目，因此没有上下游关系。创建项目后由 Scope 规则筛选并建立 DAG 关系。</div></div>
          <dl className="mt-4 divide-y divide-[#e8ecf1] border-y border-[#e8ecf1] text-[9px]">
            {[
              ["当前版本", active.version],
              ["维护负责人", active.owner],
              ["被项目引用", `${active.projects} 个项目`],
              ["最近更新", active.updated],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between py-3"
              >
                <dt className="font-bold text-[#8995a7]">{label}</dt>
                <dd className="font-black text-[#41516b]">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 border-t border-[#e5e9ef] pt-4">
            <h4 className="text-[9px] font-black text-[#586982]">可执行操作</h4>
            <button
              type="button"
              onClick={() => onReference(`查看版本历史｜${active.label}`)}
              className="mt-2 h-8 w-full rounded-md border border-[#b9c9e3] bg-white text-[8px] font-black text-[#315ca9] hover:bg-[#f3f6fb]"
            >
              查看版本历史
            </button>
            <button
              type="button"
              onClick={() => onReference(`编辑全所标签｜${active.label}`)}
              className="mt-2 h-8 w-full rounded-md bg-[#315ca9] text-[8px] font-black text-white hover:bg-[#264f96]"
            >
              编辑标签
            </button>
          </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function GraphWorkspacePanel({
  tab,
  materialityConfirmed,
  projectGraphReady,
  decisions,
  onDecision,
  onConfirmMateriality,
  onStartDag,
  onViewGraph,
  onReference,
  nodeAssignments,
  setNodeAssignments,
  taskDecisions,
  setTaskDecisions,
  materialRequests,
  setMaterialRequests,
  projectId,
  onOpenDownstream,
  onHandoffDownstream,
  downstreamProgressByProject,
  candidateNodes = graphStudioNodes,
  onAddManualTags = () => {},
  decisionDetails = {},
  onSaveDecision = () => {},
}: {
  tab: Exclude<GraphWorkspaceTab, "graph">;
  materialityConfirmed: boolean;
  projectGraphReady: boolean;
  decisions: Record<string, "调整" | "排除">;
  onDecision: (id: string, decision: "调整" | "排除") => void;
  onConfirmMateriality: () => void;
  onStartDag: () => void;
  onViewGraph: (nodeId?: string) => void;
  onReference: (value: string) => void;
  nodeAssignments: Record<string, string>;
  setNodeAssignments: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  taskDecisions: AuditTaskDecisionMap;
  setTaskDecisions: React.Dispatch<React.SetStateAction<AuditTaskDecisionMap>>;
  materialRequests: AuditMaterialRequestMap;
  setMaterialRequests: React.Dispatch<React.SetStateAction<AuditMaterialRequestMap>>;
  projectId: string;
  onOpenDownstream: (projectId: string) => void;
  onHandoffDownstream: (projectId: string) => void;
  downstreamProgressByProject: Record<string, number>;
  candidateNodes?: Array<(typeof graphStudioNodes)[number]>;
  onAddManualTags?: (ids: string[]) => void;
  decisionDetails?: Record<string, CandidateDecisionRecord>;
  onSaveDecision?: (id: string, decision: CandidateDecisionRecord) => void;
}) {
  const candidates: AuditRule[] = candidateNodes.map((node, index) => {
    const type: RuleType =
      node.kind === "风险信号" || node.kind === "复合风险"
        ? "风险信号"
        : node.kind === "内控测试"
          ? "内控测试"
          : node.kind === "审计程序"
            ? "审计程序"
            : "合规检查";
    return {
      id: node.id,
      name: node.label,
      type,
      cycle: node.kind,
      executor:
        node.kind === "风险信号" || node.kind === "项目配置"
          ? "规则引擎"
          : node.kind === "人工节点"
            ? "人工执行"
            : node.kind === "审计程序" || node.kind === "合规检查"
              ? "AI 初筛 + 人工"
            : index % 2 === 0
              ? "大模型"
              : "AI 初筛 + 人工",
      status: "待复核",
      version: "v1.0",
      description: `${node.label}项目候选节点`,
      upstream: node.id.startsWith("library-")
        ? ["人工添加"]
        : graphStudioEdges
            .filter(([, to]) => to === node.id)
            .map(([from]) => graphStudioNodes.find((item) => item.id === from)?.label ?? from),
      downstream: graphStudioEdges
        .filter(([from]) => from === node.id)
        .map(([, to]) => graphStudioNodes.find((item) => item.id === to)?.label ?? to),
    };
  });
  const [reviewAction, setReviewAction] = useState<{
    id: string;
    action: "调整" | "排除";
  } | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [reviewThreshold, setReviewThreshold] = useState("15 万元");
  const [reviewPriority, setReviewPriority] = useState<"高" | "正常" | "低">("正常");
  const [reviewNeedsHuman, setReviewNeedsHuman] = useState(false);
  const [tagPoolOpen, setTagPoolOpen] = useState(false);
  const [tagPoolDetailId, setTagPoolDetailId] = useState<string | null>(null);
  const [candidateDetailId, setCandidateDetailId] = useState<string | null>(null);
  const [candidateDetailAdjustId, setCandidateDetailAdjustId] = useState<string | null>(null);
  const [tagPoolSearch, setTagPoolSearch] = useState("");
  const [tagPoolType, setTagPoolType] = useState<"全部" | RuleType>("全部");
  const [selectedPoolTags, setSelectedPoolTags] = useState<string[]>([]);
  const [taskFilter, setTaskFilter] = useState<"review" | "material">(
    "review",
  );
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [supplementTaskId, setSupplementTaskId] = useState<string | null>(null);
  const [supplementDeadline, setSupplementDeadline] = useState("2026-08-14");
  const [supplementNote, setSupplementNote] = useState("");
  const [supplementFiles, setSupplementFiles] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      graphStudioNodes.map((node, index) => [
        node.id,
        ["符金雨", "李敏", "符金雨", "赵宁"][index % 4],
      ]),
    ),
  );
  const [assignmentSource, setAssignmentSource] = useState<"manual" | "ai">(
    "manual",
  );
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false);
  const [nodeSearch, setNodeSearch] = useState("");
  const openReviewAction = (id: string, action: "调整" | "排除") => {
    const saved = decisionDetails?.[id];
    setTagPoolDetailId(null);
    setCandidateDetailId(null);
    setReviewAction({ id, action });
    setReviewReason(saved?.action === action ? saved.reason : "");
    setReviewThreshold(
      saved?.threshold && saved.threshold !== "$materiality × 10%"
        ? saved.threshold
        : "15 万元",
    );
    setReviewPriority(saved?.priority ?? "正常");
    setReviewNeedsHuman(saved?.humanReview ?? false);
  };
  const normalizedTagPoolSearch = tagPoolSearch.trim().toLocaleLowerCase();
  const formatTagCode = (id: string) => id
    .replace(/^library-/i, "")
    .replace(/-(\d+)$/, (_match, number) => `-${String(number).padStart(3, "0")}`)
    .toUpperCase();
  const candidateIds = new Set(candidateNodes.map((node) => node.id));
  const tagPoolResults = libraryTagNodes.filter(
    (node) =>
      (tagPoolType === "全部" || node.kind === tagPoolType) &&
      (!normalizedTagPoolSearch ||
        [node.id, node.label, node.kind].some((value) =>
          value.toLocaleLowerCase().includes(normalizedTagPoolSearch),
        )),
  );
  if (tab === "list" && projectGraphReady) {
    const nodeCode: Record<string, string> = {
      scope: "CFG-SCOPE-001",
      rs1: "RS-REV-001",
      rs2: "RS-AR-001",
      rs3: "RS-INV-001",
      rs4: "RS-CAS-001",
      and1: "RS-FRAUD-001",
      ct1: "CT-REV-001",
      ct2: "CT-INV-001",
      ap1: "AP-REV-001",
      ap2: "AP-REV-002",
      ap3: "AP-AR-002",
      ap4: "AP-INV-001",
      cc1: "CC-REL-001",
      human: "HUM-REV-001",
      evidence: "EV-SUM-001",
      complete: "CP-CLOSE-001",
    };
    const nodeExecutor = (kind: string) =>
      kind === "风险信号" || kind === "复合风险" || kind === "项目配置"
        ? executorDisplay["规则引擎"]
        : kind === "内控测试" || kind === "人工节点" || kind === "审计程序" || kind === "合规检查"
          ? executorDisplay["AI 初筛 + 人工"]
          : executorDisplay["人工执行"];
    const normalizedNodeSearch = nodeSearch.trim().toLocaleLowerCase();
    const nodeGroup = (kind: string) =>
      kind === "项目配置"
        ? "项目配置"
        : kind === "风险信号" || kind === "复合风险"
          ? "第一层 · RS 风险信号"
          : kind === "内控测试"
            ? "第二层 · CT 控制测试"
            : kind === "审计程序" || kind === "合规检查"
              ? "第三层 · AP / CC 程序与检查"
              : "流程节点 · 人工确认与结果汇总";
    const visibleGraphNodes = graphStudioNodes.filter((node, index) => {
      if (!normalizedNodeSearch) return true;
      const executor = nodeExecutor(node.kind);
      const upstream = graphStudioEdges.filter(
        ([, to]) => to === node.id,
      ).length;
      const downstream = graphStudioEdges.filter(
        ([from]) => from === node.id,
      ).length;
      return [
        nodeCode[node.id] ?? node.id.toUpperCase(),
        node.label,
        node.kind,
        executor.label,
        executor.flow,
        nodeAssignments[node.id],
        `上游 ${upstream}`,
        `下游 ${downstream}`,
        getNodeAnnotationStatus(index),
      ].some((value) =>
        value.toLocaleLowerCase().includes(normalizedNodeSearch),
      );
    });
    return (
      <div className="h-full overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-3 custom-scrollbar">
        <div className="mx-auto w-full min-w-0 max-w-[1180px]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-[#2f405b]">
                项目 DAG 节点列表
              </h2>
              <p className="mt-1 text-[11px] font-bold text-[#75839a]">
                审计标签按 RS、CT、AP/CC 分层排列；项目配置、人工确认和结果汇总单独归为流程节点。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAssignmentConfirmed(true)}
                className="h-9 rounded-md bg-[#315ca9] px-3 text-[11px] font-black text-white"
              >
                确认负责人
              </button>
              <button
                type="button"
                onClick={onViewGraph}
                className="h-9 rounded-md border border-[#bfcde4] bg-white px-3 text-[11px] font-black text-[#3f61a2]"
              >
                查看知识图谱
              </button>
            </div>
          </header>
          <div className="mt-3 flex items-center gap-5 border-y border-[#e0e5ec] bg-white px-4 py-2 text-[10px] font-bold text-[#718097]">
            <span>
              审计标签 <b className="text-[14px] text-[#344962]">12</b>
            </span>
            <span>
              流程节点 <b className="text-[14px] text-[#344962]">4</b>
            </span>
            <span>
              DAG 节点 <b className="text-[14px] text-[#344962]">16</b>
            </span>
            <span>
              图谱关系 <b className="text-[14px] text-[#344962]">22</b>
            </span>
            <span
              className={
                assignmentConfirmed ? "text-emerald-700" : "text-amber-700"
              }
            >
              {assignmentConfirmed
                ? `负责人已确认 · ${assignmentSource === "ai" ? "AI建议后人工复核" : "人工分配"}`
                : assignmentSource === "ai"
                  ? "AI建议待人工复核"
                  : "人工分配待确认"}
            </span>
            <span className="ml-auto text-emerald-700">DAG 运行中</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-[#ccd5e2] bg-white px-3 focus-within:border-[#7183a1]">
              <Search className="h-4 w-4 shrink-0 text-[#69778c]" />
              <input
                value={nodeSearch}
                onChange={(event) => setNodeSearch(event.target.value)}
                placeholder="搜索任意列：编号、名称、类型、执行链路、负责人、关系或状态"
                aria-label="搜索知识图谱节点列表的任意字段"
                className="min-w-0 flex-1 bg-transparent text-[11px] font-bold text-[#35455f] outline-none placeholder:text-[#69778c]"
              />
              {nodeSearch && (
                <button
                  type="button"
                  onClick={() => setNodeSearch("")}
                  aria-label="清空搜索"
                  className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#69778c] hover:bg-[#eef1f5]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>
            <span className="shrink-0 text-[10px] font-bold text-[#65748b]">
              {nodeSearch
                ? `找到 ${visibleGraphNodes.length} 个节点`
                : "支持跨全部列搜索"}
            </span>
          </div>
          <section className="mt-2 overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
            <div className="grid grid-cols-[96px_150px_90px_220px_104px_112px_100px] justify-between bg-[#fafbfc] px-3 py-2.5 text-[10px] font-black text-[#68768a]">
              <span>标签 / 节点编号</span>
              <span>标签 / 节点名称</span>
              <span>节点类型</span>
              <span>执行链路</span>
              <button
                type="button"
                onClick={() =>
                  onReference(
                    "负责人分配｜请根据全部知识图谱节点的类型、执行链路、专业能力和当前工作负荷给出负责人分配建议，项目经理将逐项复核。",
                  )
                }
                className="justify-self-start font-black text-[#4b628a] underline decoration-[#aab6c8] underline-offset-2 hover:text-[#263f71]"
                title="引用到 Agent，请其建议负责人分配"
              >
                负责人
              </button>
              <span>图谱关系</span>
              <span>状态</span>
            </div>
            {visibleGraphNodes.map((node, visibleIndex) => {
              const index = graphStudioNodes.findIndex(
                (item) => item.id === node.id,
              );
              const annotationStatus = getNodeAnnotationStatus(index);
              const executor = nodeExecutor(node.kind);
              const upstream = graphStudioEdges.filter(
                ([, to]) => to === node.id,
              ).length;
              const downstream = graphStudioEdges.filter(
                ([from]) => from === node.id,
              ).length;
              const group = nodeGroup(node.kind);
              const previousGroup = visibleIndex > 0
                ? nodeGroup(visibleGraphNodes[visibleIndex - 1].kind)
                : null;
              return (
                <React.Fragment key={node.id}>
                {group !== previousGroup && (
                  <div className="border-t border-[#dfe5ed] bg-[#eef2f7] px-3 py-2 text-[9px] font-black text-[#40516c]">
                    {group}
                  </div>
                )}
                <div
                  key={node.id}
                  className="grid w-full grid-cols-[96px_150px_90px_220px_104px_112px_100px] items-center justify-between border-t border-[#edf0f4] px-3 py-2 text-left hover:bg-[#f8fafc]"
                >
                  <button
                    type="button"
                    onClick={() => onViewGraph(node.id)}
                    className="truncate text-left font-mono text-[10px] font-black text-[#596a83] hover:underline"
                    title="在知识图谱中定位此标签节点"
                  >
                    {nodeCode[node.id] ?? node.id.toUpperCase()}
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewGraph(node.id)}
                    className="truncate text-left text-[11px] font-black text-[#35455f] hover:underline"
                    title="在知识图谱中定位此标签节点"
                  >
                    {node.label}
                  </button>
                  <span
                    className="justify-self-start whitespace-nowrap rounded border px-2 py-1 text-[9px] font-black"
                    style={{
                      color: node.color,
                      borderColor: `${node.color}55`,
                      background: `${node.color}10`,
                    }}
                  >
                    {node.kind}
                  </span>
                  <span>
                    <strong
                      className={`block text-[10px] font-black ${executor.tone}`}
                    >
                      {executor.label}
                    </strong>
                    <small className="mt-0.5 block text-[9px] font-bold leading-tight text-[#6f7c8f]">
                      {executor.flow}
                    </small>
                  </span>
                  <select
                    value={nodeAssignments[node.id]}
                    onChange={(event) => {
                      setNodeAssignments((current) => ({
                        ...current,
                        [node.id]: event.target.value,
                      }));
                      setAssignmentSource("manual");
                      setAssignmentConfirmed(false);
                    }}
                    className="h-8 min-w-0 rounded border border-[#cbd5e2] bg-white px-1.5 text-[10px] font-black text-[#44536b] outline-none focus:border-[#7183a1]"
                  >
                    <option>陈华</option>
                    <option>李敏</option>
                    <option>王晨</option>
                    <option>赵宁</option>
                    <option>符金雨</option>
                  </select>
                  <span className="whitespace-nowrap text-[10px] font-bold text-[#65748b]">
                    上游 {upstream} · 下游 {downstream}
                  </span>
                  <span
                    className={`justify-self-start whitespace-nowrap rounded px-2 py-1 text-[9px] font-black ${
                      annotationStatus === "进行中"
                        ? "bg-blue-50 text-blue-700"
                        : annotationStatus === "已完成"
                          ? "bg-emerald-50 text-emerald-700"
                          : annotationStatus === "待补充资料"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {annotationStatus}
                  </span>
                </div>
                </React.Fragment>
              );
            })}
            {visibleGraphNodes.length === 0 && (
              <div className="border-t border-[#edf0f4] px-4 py-8 text-center text-[11px] font-bold text-[#65748b]">
                没有匹配的节点，请更换关键词或清空搜索。
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }
  if (tab === "list")
    return (
      <div className="relative h-full overflow-hidden bg-[#f7f8fb]">
        <div className="h-full overflow-y-auto p-5 custom-scrollbar">
        <div className="mx-auto max-w-[1240px] space-y-4">
          <header className="border-b border-[#dfe5ed] pb-4">
            <div>
              <h2 className="text-base font-black text-[#2f405b]">
                项目准备审核
              </h2>
              <p className="mt-1 text-[10px] font-bold text-[#75839a]">
                先确认重要性参数，再审核 Scope 生成的候选标注。
              </p>
            </div>
          </header>
          {!materialityConfirmed ? (
            <MaterialityReviewPanel
              confirmed={materialityConfirmed}
              onConfirm={onConfirmMateriality}
            />
          ) : (
            <section>
              <header className="flex items-center justify-between gap-4 px-1 py-3">
                <div>
                  <h3 className="text-xs font-black text-[#364760]">
                    候选标注集审核
                  </h3>
                  <p className="mt-1 text-[9px] font-bold text-[#74839a]">
                    共 {candidates.length} 条候选标注，与候选图谱及 DAG 节点保持一致；候选标签默认纳入，仅在需要时调整或排除。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!projectGraphReady && (
                    <button
                      type="button"
                      disabled={!materialityConfirmed}
                      onClick={() => setTagPoolOpen((current) => !current)}
                      className="h-9 rounded-lg border border-[#9fb5d8] bg-white px-4 text-[9px] font-black text-[#315ca9] hover:bg-[#f3f6fb] disabled:border-[#dfe4eb] disabled:text-[#a5afbd]"
                    >
                      {tagPoolOpen ? "收起标签池" : "＋ 从标签池添加"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!materialityConfirmed}
                    onClick={onViewGraph}
                    className="h-9 rounded-lg border border-[#bfcde4] bg-white px-4 text-[9px] font-black text-[#3f61a2] disabled:border-[#dfe4eb] disabled:text-[#a5afbd]"
                  >
                    {projectGraphReady ? "查看知识图谱" : "查看候选标注集视图"}
                  </button>
                  {projectGraphReady ? (
                    <span className="rounded bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">
                      已冻结并启动 DAG
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!materialityConfirmed}
                      onClick={onStartDag}
                      className="h-9 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white disabled:bg-[#cbd3df]"
                    >
                      冻结候选集并启动 DAG
                    </button>
                  )}
                </div>
              </header>
              {tagPoolOpen && !projectGraphReady && (
                <section className="border-y border-[#dfe5ed] bg-white px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h4 className="text-[11px] font-black text-[#354760]">从全所标签池添加</h4>
                      <p className="mt-1 text-[8px] font-bold text-[#66758a]">人工补充的标签将与 Scope 候选集一起进入图谱和后续 DAG。</p>
                    </div>
                    <div className="flex min-w-0 flex-1 gap-2 lg:max-w-[520px]">
                      <input
                        value={tagPoolSearch}
                        onChange={(event) => setTagPoolSearch(event.target.value)}
                        placeholder="搜索标签名称、类型或编号"
                        className="h-9 min-w-0 flex-1 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none placeholder:text-[#68768a] focus:border-[#6585bc]"
                      />
                      <select
                        value={tagPoolType}
                        onChange={(event) => setTagPoolType(event.target.value as "全部" | RuleType)}
                        className="h-9 w-[118px] rounded-md border border-[#ccd6e5] bg-white px-2 text-[9px] font-bold text-[#52637b] outline-none"
                      >
                        {(["全部", "风险信号", "内控测试", "审计程序", "合规检查"] as const).map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex max-h-[330px] overflow-visible rounded-lg border border-[#dce3ec] bg-white">
                    <div className="min-w-0 flex-1 overflow-auto custom-scrollbar">
                      <div className="sticky top-0 z-10 grid min-w-[720px] grid-cols-[42px_112px_minmax(180px,1fr)_100px_90px_92px] items-center border-b border-[#e4e9f0] bg-[#f8fafc] px-3 py-2.5 text-[8px] font-black text-[#718098]">
                        <input
                          type="checkbox"
                          aria-label="选择当前筛选下的全部可添加标签"
                          checked={tagPoolResults.some((node) => !candidateIds.has(node.id)) && tagPoolResults.filter((node) => !candidateIds.has(node.id)).every((node) => selectedPoolTags.includes(node.id))}
                          onChange={(event) => {
                            const availableIds = tagPoolResults.filter((node) => !candidateIds.has(node.id)).map((node) => node.id);
                            setSelectedPoolTags((current) => event.target.checked ? Array.from(new Set([...current, ...availableIds])) : current.filter((id) => !availableIds.includes(id)));
                          }}
                          className="h-3.5 w-3.5 accent-[#315ca9]"
                        />
                        <span>标签编号</span><span>标签名称</span><span>类型</span><span>状态</span><span>当前版本</span>
                      </div>
                      {tagPoolResults.map((node, index) => {
                        const alreadyAdded = candidateIds.has(node.id);
                        const checked = selectedPoolTags.includes(node.id);
                        const version = `v${index % 3 + 1}.0`;
                        return (
                          <div
                            key={node.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => { setCandidateDetailId(null); setReviewAction(null); setTagPoolDetailId(node.id); }}
                            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCandidateDetailId(null); setReviewAction(null); setTagPoolDetailId(node.id); } }}
                            className={`grid min-w-[720px] cursor-pointer grid-cols-[42px_112px_minmax(180px,1fr)_100px_90px_92px] items-center border-b border-[#edf0f4] px-3 py-2.5 text-left last:border-0 hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8ea9dc] ${tagPoolDetailId === node.id ? "bg-[#f1f5fc]" : "bg-white"}`}
                          >
                            <input
                              type="checkbox"
                              aria-label={`选择${node.label}`}
                              disabled={alreadyAdded}
                              checked={alreadyAdded || checked}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => setSelectedPoolTags((current) => event.target.checked ? [...current, node.id] : current.filter((id) => id !== node.id))}
                              className="h-3.5 w-3.5 accent-[#315ca9] disabled:cursor-not-allowed"
                            />
                            <span className="font-mono text-[9px] font-black text-[#5a6a83]">{formatTagCode(node.id)}</span>
                            <span className="min-w-0 pr-3"><strong className="block truncate text-[9px] font-black text-[#33445f]">{node.label}</strong><small className="mt-0.5 block truncate text-[7px] font-bold text-[#8793a5]">识别项目异常并触发审计响应</small></span>
                            <span className="justify-self-start rounded border px-2 py-1 text-[8px] font-black" style={{ color: node.color, borderColor: `${node.color}55`, background: `${node.color}10` }}>{node.kind}</span>
                            {alreadyAdded ? <span className="justify-self-start rounded bg-[#eef1f5] px-2 py-1 text-[8px] font-black text-[#68768a]">已加入</span> : <span className="justify-self-start rounded bg-[#eaf8f2] px-2 py-1 text-[8px] font-black text-[#16765a]">生效中</span>}
                            <span className="text-[9px] font-black text-[#506078]">{version}</span>
                          </div>
                        );
                      })}
                    </div>
                    {tagPoolDetailId && (() => {
                      const detailNode = libraryTagNodes.find((node) => node.id === tagPoolDetailId);
                      if (!detailNode) return null;
                      const detailIndex = libraryTagNodes.findIndex((node) => node.id === tagPoolDetailId);
                      const detailAlreadyAdded = candidateIds.has(detailNode.id);
                      return (
                        <aside className="fixed bottom-[56px] right-0 top-[246px] z-50 flex w-[270px] flex-col border-l border-[#dce3ed] bg-white shadow-[-6px_0_16px_rgba(40,57,88,.08)]">
                          <header className="flex items-start justify-between border-b border-[#e4e8ef] px-4 py-3"><div><span className="font-mono text-[8px] font-black text-[#7d899a]">{detailNode.id.toUpperCase()}</span><h3 className="mt-1 text-[13px] font-black text-[#2f405a]">{detailNode.label}</h3></div><button type="button" onClick={() => setTagPoolDetailId(null)} aria-label="关闭标签详情" className="grid h-7 w-7 place-items-center rounded-md text-[#7d899b] hover:bg-[#f1f3f6]"><X className="h-3.5 w-3.5" /></button></header>
                          <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <div className="flex flex-wrap gap-1.5"><span className="rounded px-2 py-1 text-[8px] font-black text-white" style={{ background: detailNode.color }}>{detailNode.kind}</span><span className="rounded border border-[#dce3ed] px-2 py-1 text-[8px] font-bold text-[#66758b]">全所标签</span></div>
                            <p className="mt-3 text-[10px] font-bold leading-[1.7] text-[#607089]">{detailNode.label}达到项目阈值时输出风险等级，并激活相关控制测试或审计程序。</p>
                            <div className="mt-5"><h4 className="border-b border-[#e7ebf0] pb-2 text-[9px] font-black text-[#586982]">标签状态</h4><div className="mt-3 rounded-md bg-[#f5f7fa] p-3 text-[9px] font-bold leading-relaxed text-[#6d7b90]">该标签尚未进入具体项目，因此没有上下游关系。创建项目后由 Scope 规则筛选并建立 DAG 关系。</div></div>
                            <dl className="mt-4 divide-y divide-[#e8ecf1] border-y border-[#e8ecf1] text-[9px]"><div className="flex justify-between py-3"><dt className="font-bold text-[#8995a7]">当前版本</dt><dd className="font-black text-[#41516b]">v{detailIndex % 3 + 1}.0</dd></div><div className="flex justify-between py-3"><dt className="font-bold text-[#8995a7]">维护负责人</dt><dd className="font-black text-[#41516b]">审计方法组</dd></div><div className="flex justify-between py-3"><dt className="font-bold text-[#8995a7]">被项目引用</dt><dd className="font-black text-[#41516b]">{detailIndex % 5 + 2} 个项目</dd></div><div className="flex justify-between py-3"><dt className="font-bold text-[#8995a7]">最近更新</dt><dd className="font-black text-[#41516b]">2026-05-{String(detailIndex % 20 + 8).padStart(2,"0")}</dd></div></dl>
                            <div className="mt-5 border-t border-[#e5e9ef] pt-4"><h4 className="text-[9px] font-black text-[#586982]">可执行操作</h4><button type="button" disabled={detailAlreadyAdded} onClick={() => setSelectedPoolTags((current) => current.includes(detailNode.id) ? current : [...current, detailNode.id])} className="mt-2 h-8 w-full rounded-md bg-[#eef3ff] text-[8px] font-black text-[#315ca9] hover:bg-[#e3ebfb] disabled:cursor-not-allowed disabled:text-[#8995a7]">{detailAlreadyAdded ? "已加入当前项目候选集" : selectedPoolTags.includes(detailNode.id) ? "已勾选，等待加入" : "加入当前项目候选集"}</button><button type="button" onClick={() => onReference(`查看标签版本历史｜${detailNode.label}`)} className="mt-2 h-8 w-full rounded-md border border-[#b9c9e3] bg-white text-[8px] font-black text-[#315ca9] hover:bg-[#f3f6fb]">查看版本历史</button><button type="button" onClick={() => onReference(`编辑标签｜${detailNode.label}`)} className="mt-2 h-8 w-full rounded-md bg-[#315ca9] text-[8px] font-black text-white hover:bg-[#264f96]">编辑标签</button></div>
                          </div>
                        </aside>
                      );
                    })()}
                  </div>
                  <footer className="mt-3 flex items-center justify-between gap-3 border-t border-[#e7ebf0] pt-3">
                    <span className="text-[8px] font-bold text-[#66758a]">共 {tagPoolResults.length} 条标签 · 已选择 <b className="text-[#315ca9]">{selectedPoolTags.length}</b> 条</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setTagPoolOpen(false); setSelectedPoolTags([]); }} className="h-8 rounded-md px-3 text-[8px] font-black text-[#66758b] hover:bg-[#f2f4f7]">取消</button>
                      <button
                        type="button"
                        disabled={selectedPoolTags.length === 0}
                        onClick={() => {
                          const addedCount = selectedPoolTags.length;
                          onAddManualTags(selectedPoolTags);
                          setSelectedPoolTags([]);
                          setTagPoolOpen(false);
                          onReference(`已从标签池添加 ${addedCount} 条标签`);
                        }}
                        className="h-8 rounded-md bg-[#2459c4] px-4 text-[8px] font-black text-white hover:bg-[#194db3] disabled:cursor-not-allowed disabled:bg-[#b9c5d8]"
                      >
                        加入候选集
                      </button>
                    </div>
                  </footer>
                </section>
              )}
              {materialityConfirmed ? (
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="flex min-w-[820px] items-center gap-5 border-b border-[#e7ebf1] bg-[#fafbfc] px-4 py-2.5">
                    <span className="shrink-0 text-[8px] font-black text-[#65748b]">
                      执行方式
                    </span>
                    {Object.values(executorDisplay).map((executor) => (
                      <span key={executor.label} className="min-w-0">
                        <strong
                          className={`block text-[8px] font-black ${executor.tone}`}
                        >
                          {executor.label}
                        </strong>
                        <small className="mt-0.5 block whitespace-nowrap text-[7px] font-bold text-[#929dae]">
                          {executor.flow}
                        </small>
                      </span>
                    ))}
                  </div>
                  <div className="min-w-[820px]">
                    <div className="grid grid-cols-[105px_minmax(170px,1fr)_100px_145px_minmax(140px,1fr)_160px] gap-3 bg-[#fafbfc] px-4 py-2.5 text-[8px] font-black text-[#8a96a8]">
                      <span>编号</span>
                      <span>候选标注</span>
                      <span>类型</span>
                      <span>执行方式与链路</span>
                      <span>推荐理由</span>
                      <span>人工决定</span>
                    </div>
                    {candidates.map((rule) => (
                      <React.Fragment key={rule.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => { setTagPoolDetailId(null); setReviewAction(null); setCandidateDetailId(rule.id); }}
                          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setTagPoolDetailId(null); setReviewAction(null); setCandidateDetailId(rule.id); } }}
                          className={`grid cursor-pointer grid-cols-[105px_minmax(170px,1fr)_100px_145px_minmax(140px,1fr)_160px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3.5 text-left hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#8ea9dc] ${candidateDetailId === rule.id ? "bg-[#f1f5fc]" : ""}`}
                        >
                          <span className="font-mono text-[10px] font-black text-[#5c6d86]">
                            {rule.id}
                          </span>
                          <span>
                            <strong className="block text-[12px] font-black text-[#34445f]">
                              {rule.name}
                            </strong>
                            <small className="mt-1 block text-[9px] font-bold text-[#7e8b9e]">
                              {rule.cycle}
                            </small>
                          </span>
                          <span
                            className={`justify-self-start rounded border px-1.5 py-1 text-[8px] font-black ${typeTone[rule.type]}`}
                          >
                            {rule.type}
                          </span>
                          <span>
                            <strong
                              className={`block text-[9px] font-black ${executorDisplay[rule.executor]?.tone ?? "text-[#526178]"}`}
                            >
                              {executorDisplay[rule.executor]?.label ??
                                rule.executor}
                            </strong>
                            <small className="mt-1 block text-[7px] font-bold text-[#8794a7]">
                              {executorDisplay[rule.executor]?.flow}
                            </small>
                          </span>
                          <span className="truncate text-[8px] font-bold text-[#77859a]">
                            {rule.id.startsWith("library-") ? "人工从标签池添加" : `${rule.upstream.join(" + ")} 关联推荐`}
                          </span>
                          <span className="flex gap-1">
                            {(["调整", "排除"] as const).map(
                              (action) => (
                                <button
                                  type="button"
                                  key={action}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (action === "调整") {
                                      const saved = decisionDetails?.[rule.id];
                                      setTagPoolDetailId(null);
                                      setReviewAction(null);
                                      setCandidateDetailId(rule.id);
                                      setCandidateDetailAdjustId(rule.id);
                                      setReviewReason(saved?.reason ?? "");
                                      setReviewThreshold(
                                        saved?.threshold && saved.threshold !== "$materiality × 10%"
                                          ? saved.threshold
                                          : "15 万元",
                                      );
                                      setReviewPriority(saved?.priority ?? "正常");
                                      setReviewNeedsHuman(saved?.humanReview ?? false);
                                    } else {
                                      openReviewAction(rule.id, action);
                                    }
                                  }}
                                  className={`h-7 rounded-md px-2 text-[8px] font-black ${decisions[rule.id] === action || (reviewAction?.id === rule.id && reviewAction.action === action) ? "bg-[#315ca9] text-white" : "bg-[#f2f5f9] text-[#607089]"}`}
                                >
                                  {action}
                                </button>
                              ),
                            )}
                          </span>
                        </div>
                        {reviewAction?.id === rule.id && (
                          <div className="border-t border-[#dfe5ed] bg-[#fafbfc] px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <strong className="text-[10px] font-black text-[#3d4e68]">
                                  {reviewAction.action === "调整"
                                    ? `调整「${rule.name}」的项目参数`
                                    : `排除「${rule.name}」`}
                                </strong>
                                <p className="mt-1 text-[8px] font-bold text-[#7c899c]">
                                  {reviewAction.action === "调整"
                                    ? "只可调整当前项目阈值、优先级和人工复核要求；执行方式由全所标签定义，不可在项目内修改。"
                                    : "排除后该标签不会进入项目 DAG；系统会阻止排除强制标签。"}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setReviewAction(null)}
                                className="text-[8px] font-black text-[#6d7b90]"
                              >
                                取消
                              </button>
                            </div>
                            {reviewAction.action === "调整" && (
                              <>
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                  <div className="grid gap-1 text-[8px] font-black text-[#596a83]">
                                    实际执行链路（标签定义）
                                    <div className="flex min-h-8 items-center justify-between gap-2 border-b border-[#d6deea] px-1 py-1 text-[9px] font-bold text-[#43536c]">
                                      <span>
                                        <b
                                          className={`block ${executorDisplay[rule.executor]?.tone ?? "text-[#43536c]"}`}
                                        >
                                          {executorDisplay[rule.executor]
                                            ?.label ?? rule.executor}
                                        </b>
                                        <small className="mt-0.5 block text-[7px] text-[#8794a7]">
                                          {executorDisplay[rule.executor]?.flow}
                                        </small>
                                      </span>
                                      <span className="text-[7px] font-bold text-[#8b97a8]">
                                        项目内不可修改
                                      </span>
                                    </div>
                                  </div>
                                  <label className="grid gap-1 text-[8px] font-black text-[#596a83]">
                                    项目阈值
                                    <input
                                      value={reviewThreshold}
                                      onChange={(event) => setReviewThreshold(event.target.value)}
                                      className="h-8 rounded-md border border-[#d6deea] bg-white px-2 text-[9px] font-bold outline-none"
                                    />
                                  </label>
                                  <label className="grid gap-1 text-[8px] font-black text-[#596a83]">
                                    执行优先级
                                    <select
                                      value={reviewPriority}
                                      onChange={(event) => setReviewPriority(event.target.value as "高" | "正常" | "低")}
                                      className="h-8 rounded-md border border-[#d6deea] bg-white px-2 text-[9px] font-bold outline-none"
                                    >
                                      <option>高</option>
                                      <option>正常</option>
                                      <option>低</option>
                                    </select>
                                  </label>
                                </div>
                                <label className="mt-2 flex items-center gap-2 text-[8px] font-bold text-[#596a83]">
                                  <input
                                    type="checkbox"
                                    checked={reviewNeedsHuman}
                                    onChange={(event) => setReviewNeedsHuman(event.target.checked)}
                                    className="accent-[#315ca9]"
                                  />
                                  本项目增加人工复核节点（不改变原执行方式）
                                </label>
                              </>
                            )}
                            <label className="mt-3 grid gap-1 text-[8px] font-black text-[#596a83]">
                              {reviewAction.action === "调整"
                                ? "调整理由（必填）"
                                : "排除理由（必填）"}
                              <textarea
                                value={reviewReason}
                                onChange={(event) =>
                                  setReviewReason(event.target.value)
                                }
                                placeholder={
                                  reviewAction.action === "调整"
                                    ? "说明项目特征、职业判断及调整依据…"
                                    : "说明不适用原因及支持证据…"
                                }
                                className="h-14 resize-none rounded-md border border-[#d6deea] bg-white p-2 text-[9px] font-bold outline-none focus:border-[#6f8fc5]"
                              />
                            </label>
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                disabled={!reviewReason.trim()}
                                onClick={() => {
                                  onDecision(rule.id, reviewAction.action);
                                  onSaveDecision(rule.id, {
                                    action: reviewAction.action,
                                    threshold: reviewAction.action === "调整" ? reviewThreshold : undefined,
                                    priority: reviewAction.action === "调整" ? reviewPriority : undefined,
                                    humanReview: reviewAction.action === "调整" ? reviewNeedsHuman : undefined,
                                    reason: reviewReason.trim(),
                                    updatedBy: "符金雨",
                                    updatedAt: formatAuditTimestamp(),
                                  });
                                  setReviewAction(null);
                                  setReviewReason("");
                                }}
                                className={`h-8 rounded-md px-4 text-[9px] font-black text-white disabled:bg-[#cbd3df] ${reviewAction.action === "排除" ? "bg-[#b64b55]" : "bg-[#315ca9]"}`}
                              >
                                {reviewAction.action === "调整"
                                  ? "保存项目调整"
                                  : "确认排除"}
                              </button>
                            </div>
                          </div>
                        )}
                        {reviewAction?.id !== rule.id && decisionDetails[rule.id] && (
                          <div className="flex items-center justify-between border-t border-[#e4e9f0] bg-[#fafbfc] px-4 py-2 text-[8px] font-bold text-[#66758a]">
                            <span>{decisionDetails[rule.id].action}已保存 · {decisionDetails[rule.id].updatedBy}</span>
                            <span>{decisionDetails[rule.id].updatedAt}</span>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  {candidateDetailId && (() => {
                    const detailRule = candidates.find((rule) => rule.id === candidateDetailId);
                    if (!detailRule) return null;
                    const detailNode = candidateNodes.find((node) => node.id === candidateDetailId);
                    const detailColor = detailNode?.color ?? "#36b9c3";
                    const detailLayer = detailNode?.kind === "项目配置" || detailNode?.kind === "风险信号" || detailNode?.kind === "复合风险" ? 1 : detailNode?.kind === "内控测试" ? 2 : detailNode?.kind === "审计程序" || detailNode?.kind === "合规检查" ? 3 : 4;
                    const detailDescription = detailNode?.kind === "风险信号" ? `${detailRule.name}达到项目阈值时输出风险等级，并激活相关控制测试或审计程序。` : detailNode?.kind === "复合风险" ? "由两个或多个风险信号同时命中形成，满足 AND 条件后跨层触发专项审计程序。" : detailNode?.kind === "内控测试" ? `${detailRule.name}用于判断相关控制是否有效，结论将调整下游 AP 的样本量、期间或执行深度。` : detailNode?.kind === "审计程序" ? `${detailRule.name}执行实质性核查并形成审计证据；发现异常时可继续触发下游程序。` : detailNode?.kind === "合规检查" ? `${detailRule.name}依据法规与制度判断业务行为是否合规，结论进入合规问题清单。` : `${detailRule.name}是当前项目 DAG 中的${detailNode?.kind ?? detailRule.type}节点。`;
                    const detailCode: Record<string, string> = { scope: "PROJECT-SCOPE", rs1: "RS-REV-001", rs2: "RS-AR-001", rs3: "RS-INV-001", rs4: "RS-CAS-001", and1: "RS-FRAUD-001", ct1: "CT-REV-001", ct2: "CT-INV-001", ap1: "AP-REV-001", ap2: "AP-REV-002", ap3: "AP-AR-002", ap4: "AP-INV-001", cc1: "CC-REL-001", human: "HUMAN-REVIEW", evidence: "AUDIT-EVIDENCE", complete: "COMP-001" };
                    // 候选阶段图谱尚未建立 DAG 边，列表详情与图谱详情保持同一数据口径。
                    const connections: Array<{ direction: string; label: string }> = [];
                    return (
                      <aside className="fixed bottom-[56px] right-0 top-[246px] z-50 flex w-[270px] flex-col border-l border-[#dce3ed] bg-white shadow-[-6px_0_16px_rgba(40,57,88,.08)]">
                        <header className="flex items-start justify-between border-b border-[#e4e8ef] px-4 py-3"><div><span className="font-mono text-[8px] font-black uppercase text-[#7d899a]">{detailCode[detailRule.id] ?? detailRule.id}</span><h3 className="mt-1 text-[13px] font-black text-[#2f405a]">{detailRule.name}</h3></div><button type="button" onClick={() => setCandidateDetailId(null)} aria-label="关闭节点详情" className="grid h-7 w-7 place-items-center rounded-md text-[#7d899b] hover:bg-[#f1f3f6]"><X className="h-3.5 w-3.5" /></button></header>
                        <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                          <div className="flex flex-wrap gap-1.5"><span className="rounded px-2 py-1 text-[8px] font-black text-white" style={{ background: detailColor }}>{detailNode?.kind ?? detailRule.type}</span><span className="rounded border border-[#dce3ed] px-2 py-1 text-[8px] font-bold text-[#66758b]">第{detailLayer}层</span></div>
                          <p className="mt-3 text-[10px] font-bold leading-[1.7] text-[#607089]">{detailDescription}</p>
                          <div className="mt-5"><h4 className="border-b border-[#e7ebf0] pb-2 text-[9px] font-black text-[#586982]">上下游关系 · {connections.length}</h4>{connections.length > 0 && <div className="mt-2 space-y-2">{connections.map((connection, index) => <div key={`${connection.direction}-${connection.label}-${index}`} className="flex items-start gap-2 rounded-md bg-[#f7f9fc] p-2.5"><i className="mt-1 h-2 w-2 shrink-0 rounded-sm" style={{ background: detailColor }} /><div className="min-w-0"><strong className="block text-[9px] font-black text-[#43536c]">{connection.direction} · {connection.label}</strong><span className="mt-1 block text-[8px] font-bold text-[#8a96a7]">关联推荐</span></div></div>)}</div>}</div>
                          <div className="mt-5 border-t border-[#e5e9ef] pt-4"><h4 className="text-[9px] font-black text-[#586982]">可执行操作</h4><div className="mt-2 grid grid-cols-2 gap-1.5">{(["调整", "排除"] as const).map((action) => <button type="button" key={action} onClick={() => { if (action === "调整") { setCandidateDetailAdjustId((current) => current === detailRule.id ? null : detailRule.id); } else { setCandidateDetailId(null); setCandidateDetailAdjustId(null); openReviewAction(detailRule.id, action); } }} className={`h-8 rounded-md border text-[8px] font-black ${action === "调整" && candidateDetailAdjustId === detailRule.id ? "border-[#315ca9] bg-[#315ca9] text-white" : action === "调整" ? "border-[#b9c9e3] bg-white text-[#315ca9] hover:bg-[#f3f6fb]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>{action}</button>)}</div>
                          {candidateDetailAdjustId === detailRule.id && <div className="mt-3 border-y border-[#dfe5ed] bg-[#f8fafc] py-3"><div className="flex items-start justify-between gap-2"><div><strong className="text-[10px] font-black text-[#354760]">调整当前项目参数</strong><p className="mt-1 text-[8px] font-bold leading-relaxed text-[#66758a]">不修改全所标签定义。</p></div><button type="button" onClick={() => setCandidateDetailAdjustId(null)} className="text-[8px] font-black text-[#6e7d92]">收起</button></div><label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">项目阈值<input value={reviewThreshold} onChange={(event) => setReviewThreshold(event.target.value)} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]" /><small className="font-bold leading-relaxed text-[#8491a4]">整体重要性 150 万元 × 10% = 15 万元</small></label><label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">执行优先级<select value={reviewPriority} onChange={(event) => setReviewPriority(event.target.value as "高" | "正常" | "低")} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none"><option>高</option><option>正常</option><option>低</option></select></label><label className="mt-3 flex items-center gap-2 text-[8px] font-bold text-[#596a83]"><input type="checkbox" checked={reviewNeedsHuman} onChange={(event) => setReviewNeedsHuman(event.target.checked)} className="accent-[#315ca9]" />增加人工复核节点</label><label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">调整理由<textarea value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} rows={3} placeholder="说明调整原因及职业判断依据…" className="resize-none rounded-md border border-[#ccd6e5] bg-white px-3 py-2 text-[9px] font-bold leading-relaxed outline-none focus:border-[#5f80bc]" /></label><button type="button" disabled={!reviewReason.trim()} onClick={() => { const record: CandidateDecisionRecord = { action: "调整", reason: reviewReason.trim(), threshold: reviewThreshold, priority: reviewPriority, humanReview: reviewNeedsHuman, updatedBy: "符金雨", updatedAt: formatAuditTimestamp() }; onSaveDecision?.(detailRule.id, record); onDecision(detailRule.id, "调整"); setCandidateDetailAdjustId(null); onReference(`已保存调整｜${detailRule.name}`); }} className="mt-3 h-9 w-full rounded-md bg-[#2459c4] text-[9px] font-black text-white hover:bg-[#194db3] disabled:cursor-not-allowed disabled:bg-[#b9c5d8]">保存项目调整</button></div>}
                          </div>
                        </div>
                      </aside>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-8 text-center text-[9px] font-bold text-[#8a96a8]">
                  请先确认并锁定重要性参数，候选标注集将自动解锁。
                </div>
              )}
            </section>
          )}
        </div>
        </div>
      </div>
    );
  if (tab === "risk")
    return (
      <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 custom-scrollbar">
        <div className="mx-auto max-w-[980px]">
          <h2 className="text-sm font-black text-[#2f405b]">风险分析</h2>
          <p className="mt-1 text-[9px] font-bold text-[#8794a7]">
            基于当前项目财务数据运行 36 条定量与定性风险信号。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["高风险", "6", "收入、应收"],
              ["中风险", "11", "存货、费用"],
              ["低风险", "14", "资金、负债"],
              ["待人工判断", "5", "舞弊与管理层解释"],
            ].map(([label, count, note], index) => (
              <div
                key={label}
                className="rounded-lg border border-[#dfe5ed] bg-white p-4"
              >
                <span className="text-[9px] font-bold text-[#7f8c9f]">
                  {label}
                </span>
                <strong
                  className={`mt-2 block text-2xl font-black ${index === 0 ? "text-rose-600" : index === 1 ? "text-amber-600" : "text-[#315ca9]"}`}
                >
                  {count}
                </strong>
                <p className="mt-2 text-[8px] font-bold text-[#8c98aa]">
                  {note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (tab === "review")
    return (
      <div className="h-full overflow-auto bg-white custom-scrollbar">
        <div className="min-w-[820px]">
          <div className="grid grid-cols-[105px_minmax(180px,1fr)_100px_120px_minmax(150px,1fr)_160px] gap-3 bg-[#fafbfc] px-4 py-3 text-[8px] font-black text-[#8a96a8]">
            <span>编号</span>
            <span>候选标注</span>
            <span>类型</span>
            <span>推荐来源</span>
            <span>推荐理由</span>
            <span>人工决定</span>
          </div>
          {candidates.map((rule) => (
            <div
              key={rule.id}
              className="grid grid-cols-[105px_minmax(180px,1fr)_100px_120px_minmax(150px,1fr)_160px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3"
            >
              <span className="font-mono text-[8px] font-black text-[#5c6d86]">
                {rule.id}
              </span>
              <span>
                <strong className="block text-[10px] font-black text-[#34445f]">
                  {rule.name}
                </strong>
                <small className="mt-1 block text-[8px] font-bold text-[#929daf]">
                  {rule.cycle}
                </small>
              </span>
              <span
                className={`justify-self-start rounded border px-1.5 py-1 text-[8px] font-black ${typeTone[rule.type]}`}
              >
                {rule.type}
              </span>
              <span className="text-[8px] font-bold text-[#67768d]">
                Scope 规则
              </span>
              <span className="truncate text-[8px] font-bold text-[#77859a]">
                {rule.upstream.join(" + ")} 关联推荐
              </span>
              <span className="flex gap-1">
                {(["调整", "排除"] as const).map((action) => (
                  <button
                    type="button"
                    key={action}
                    onClick={() => onDecision(rule.id, action)}
                    className={`h-7 rounded-md px-2 text-[8px] font-black ${decisions[rule.id] === action ? "bg-[#315ca9] text-white" : "bg-[#f2f5f9] text-[#607089]"}`}
                  >
                    {action}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  if (tab === "execution" && !projectGraphReady)
    return (
      <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 custom-scrollbar">
        <div className="mx-auto max-w-[1180px]">
          <header>
            <h2 className="text-base font-black text-[#2f405b]">审核工作台</h2>
            <p className="mt-1 text-[11px] font-bold text-[#75839a]">
              当前项目尚未启动
              DAG，因此还没有执行期人工复核或补充资料待办。
            </p>
          </header>
          <div className="mt-4 border-y border-[#dfe5ed] bg-white px-5 py-8">
            <strong className="text-[13px] font-black text-[#3d4e68]">
              {materialityConfirmed
                ? "候选标注集正在审核"
                : "重要性参数尚未确认"}
            </strong>
            <p className="mt-2 text-[10px] font-bold text-[#74839a]">
              {materialityConfirmed
                ? "请先完成候选标签的调整与排除确认，冻结候选集并启动 DAG 后，人工待办将在这里生成。"
                : "请先在列表视图完成重要性参数确认，再执行 Scope 筛选和候选标注集审核。"}
            </p>
          </div>
        </div>
      </div>
    );
  if (tab === "execution") {
    const taskNodeCode: Record<string, string> = {
      rs1: "AP-REV-001",
      rs2: "AP-AR-002",
      rs3: "AP-INV-001",
      rs4: "CC-REL-001",
      and1: "AP-REV-002",
      ct1: "AP-REV-001",
      ct2: "AP-INV-001",
      ap1: "AP-REV-001",
      ap2: "AP-REV-002",
      ap3: "AP-AR-002",
      ap4: "AP-INV-001",
      cc1: "CC-REL-001",
    };
    const reviewableTagKinds = new Set([
      "风险信号",
      "复合风险",
      "内控测试",
      "审计程序",
      "合规检查",
    ]);
    const layerTaskNodes = graphStudioNodes.filter(
      (node) => reviewableTagKinds.has(node.kind),
    );
    const materialTaskCount = layerTaskNodes.filter(
      (node) => materialRequests[node.id],
    ).length;
    const reviewTaskCount = layerTaskNodes.filter(
      (node) =>
        !materialRequests[node.id] &&
        taskDecisions[node.id] !== "通过" &&
        taskDecisions[node.id] !== "无问题关闭",
    ).length;
    const confirmedTaskCount = layerTaskNodes.filter(
      (node) =>
        taskDecisions[node.id] === "通过" ||
        taskDecisions[node.id] === "无问题关闭",
    ).length;
    const allTaskConclusionsConfirmed =
      materialTaskCount === 0 && confirmedTaskCount === layerTaskNodes.length;
    const projectAlreadyHandedOff =
      (downstreamProgressByProject[projectId] ?? -1) >= 0;
    const taskNodes = layerTaskNodes.filter((node) =>
      taskFilter === "review"
        ? !materialRequests[node.id] && taskDecisions[node.id] !== "无问题关闭"
        : Boolean(materialRequests[node.id]),
    );
    const tracePath: Record<string, string> = {
      rs1: "RS1 收入异常 → 激活 CT1 / AP1 / AP2",
      rs2: "RS2 账龄恶化 → 激活 CT1 / AP3",
      rs3: "RS3 存货增长 → 激活 CT2 → 调参 AP4",
      rs4: "RS4 资金异常 → 激活 CC1",
      and1: "RS1 + RS2 → AND1 → 激活 AP1 / AP2",
      ct1: "RS1 / RS2 → CT1 → 调参 AP1 / AP3",
      ct2: "RS3 → CT2 → 调参 AP4",
      ap1: "AP1 异常 → 回溯 CT1 / AND1 / RS1",
      ap2: "AP2 异常 → 回溯 AND1 / RS1 / RS2",
      ap3: "AP3 异常 → 回溯 CT1 / RS2",
      ap4: "AP4 异常 → 回溯 CT2 / RS3",
      cc1: "CC1 异常 → 回溯 RS4 与项目 Scope",
    };
    const taskReason = (
      node: (typeof graphStudioNodes)[number],
      index: number,
    ) => {
      const reasons: Record<
        string,
        {
          summary: string;
          detail: string;
          evidence: string;
          handling: string;
          materialSummary?: string;
          materialDetail?: string;
        }
      > = {
        rs1: {
          summary: "收入增速明显高于行业水平，增长幅度异常",
          detail:
            "本期收入增长 28%，明显高于同行业约 11% 的增速，并且增长主要集中在少数新增客户。需要人工判断这是正常业务增长，还是收入确认存在异常。",
          evidence: "利润表、收入明细、行业风险简报·2026Q2、管理层访谈纪要",
          handling:
            "核对新增客户与合同，确认增长原因，并决定保留、调整或推翻高风险结论。",
        },
        rs2: {
          summary: "长期未收回的应收款明显增加，可能存在坏账风险",
          detail:
            "一年以上应收账款占比由 18% 上升至 41%，且目前没有提供期后回款明细。系统无法判断这些款项能否收回，需要补充回款资料并由人工确认坏账风险。",
          evidence: "应收账款账龄表、客户余额明细；缺少期后回款流水",
          handling:
            "补充期后回款资料，复核坏账风险等级，并确认是否触发函证与减值测试。",
          materialSummary: "缺少期后回款流水和客户余额明细",
          materialDetail:
            "补充这些资料后，系统才能核对长期应收款是否已经收回，并判断是否需要计提坏账准备。",
        },
        rs3: {
          summary: "存货增长过快，但缺少明细，无法判断是否积压",
          detail:
            "存货增长 32%，明显快于收入增长，但目前没有分仓库库存、库龄和呆滞品清单。系统无法确认增长是否正常，也无法判断是否存在积压或减值。",
          evidence: "资产负债表、存货总账；缺少分仓库库存与库龄清单",
          handling:
            "发起资料补充，资料齐全后重新运行风险判断，并由负责人确认结论。",
          materialSummary: "缺少分仓库库存、库龄和呆滞品清单",
          materialDetail:
            "补充这些资料后，系统才能判断存货增长来自正常备货还是库存积压，并测算是否存在减值。",
        },
        rs4: {
          summary: "多笔资金往来金额和发生时间异常集中",
          detail:
            "系统发现期末前后存在多笔大额资金往来，交易对手和摘要高度相似。需要人工判断这些交易是否具有真实商业目的，以及是否涉及未识别的关联方。",
          evidence: "银行流水、资金往来明细、交易对手信息",
          handling:
            "核对异常资金往来的业务背景，判断是否属于关联交易、资金占用或其他高风险事项。",
        },
        and1: {
          summary: "多项收入异常同时出现，存在虚增收入风险",
          detail:
            "系统同时发现收入增幅异常、期末交易集中和应收账款增长，多个风险信号共同指向收入可能被提前确认或虚构。需要人工结合业务实际判断风险是否成立。",
          evidence: "收入明细、期末交易清单、应收账款变动分析",
          handling:
            "判断异常收入属于正常业务波动、提前确认还是虚构交易，并确认是否扩大收入截止测试和细节测试范围。",
        },
        ct1: {
          summary: "收入审批控制存在例外，控制可能未有效执行",
          detail:
            "系统抽查发现部分收入交易缺少规定的审批记录，且审批时间晚于入账时间。需要人工判断这是偶发操作遗漏还是控制失效。",
          evidence: "收入审批记录、销售订单、入账时间记录",
          handling:
            "判断收入审批控制是否有效；如控制失效，调整收入审计程序的样本量和执行深度。",
        },
        ap1: {
          summary: "抽查交易的收入确认时间与履约时间不一致",
          detail:
            "系统发现部分收入在客户签收或履约完成前已经入账，存在提前确认收入的迹象。需要人工判断差异是否构成错报。",
          evidence: "销售合同、出库单、签收单、收入凭证",
          handling:
            "逐笔判断异常交易的正确确认期间，并确认是否需要提出审计调整。",
        },
        ap2: {
          summary: "期末收入集中度明显异常，存在跨期确认风险",
          detail:
            "系统发现期末最后数日确认的收入显著高于正常水平，且部分交易在期后发生退货或冲销。需要人工判断是否存在跨期确认。",
          evidence: "期末收入明细、期后退货与冲销记录、发货签收记录",
          handling:
            "判断相关收入应归属的会计期间，并确认是否扩大截止测试范围或提出调整。",
        },
        ap4: {
          summary: "部分存货账面数量与盘点结果存在较大差异",
          detail:
            "系统比对盘点结果后发现多项存货差异超过项目容许范围。需要人工判断差异来自记录错误、盘点错误还是存货损失。",
          evidence: "存货台账、盘点记录、差异调整记录",
          handling:
            "查明盘点差异原因，判断是否需要扩大抽盘范围、调整存货余额或识别控制缺陷。",
        },
        ct2: {
          summary: "盘点控制的执行结果与制度要求不一致",
          detail:
            "系统发现部分仓库未按规定完成盘点复核，需要人工判断该控制是否有效。",
          evidence: "盘点制度、盘点记录、盘点差异处理单",
          handling: "复核盘点执行情况，并确认是否需要扩大存货监盘范围。",
          materialSummary: "缺少盘点记录和盘点差异处理单",
          materialDetail:
            "补充这些资料后，系统才能确认盘点控制是否实际执行，以及发现的差异是否已妥善处理。",
        },
        ap3: {
          summary: "部分大额应收账款尚未取得外部确认",
          detail:
            "函证执行结果不完整，需要确认未回函余额是否存在异常。",
          evidence: "应收账款函证回函、替代测试资料、期后回款凭证",
          handling: "补齐回函或替代测试资料后，确认应收账款余额是否可靠。",
          materialSummary: "缺少未回函客户的替代测试资料",
          materialDetail:
            "需要补充销售合同、发票、签收单和期后回款凭证，用于验证未回函客户的应收账款是否真实。",
        },
        cc1: {
          summary: "关联方交易信息与账面记录存在不一致",
          detail:
            "系统比对后发现关联方清单与交易明细无法完全对应，需要确认是否存在遗漏披露。",
          evidence: "关联方清单、关联交易明细、董事会决议与合同",
          handling: "补齐关联方资料后，确认关联交易是否完整披露并符合审批要求。",
          materialSummary: "缺少完整关联方清单和关联交易合同",
          materialDetail:
            "补充这些资料后，系统才能核对账面交易是否均已识别为关联交易，并检查审批和披露是否完整。",
        },
      };
      return (
        reasons[node.id] ?? {
          summary:
            index % 3 === 0
              ? "系统检查结果出现异常，需要人工判断原因"
              : index % 3 === 1
                ? "缺少判断该事项所需的关键资料"
                : "检查结果与预期不一致，需要人工判断原因",
          detail: `系统在检查“${node.label}”时发现结果偏离预期，需要项目人员结合业务情况判断异常原因，并确认是否形成审计问题。`,
          evidence: `${node.label}执行记录、上游节点发现及客户支持材料`,
          handling:
            "查看节点证据与上游发现，确认或推翻系统结论；如调整，必须填写职业判断理由。",
        }
      );
    };
    return (
      <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 custom-scrollbar">
        <div className="mx-auto max-w-[1180px]">
          <header>
            <h2 className="text-base font-black text-[#2f405b]">审核工作台</h2>
            <p className="mt-1 text-[11px] font-bold text-[#75839a]">
              所有异常事项均保留，统一挂接到最终 AP/CC 节点；问题、缺失材料及 RS → CT → AP/CC 关系由知识图谱推导。
            </p>
          </header>
          <div className="mt-4 flex items-center gap-1 border-y border-[#e0e5ec] bg-white px-3 py-1.5 text-[10px] font-bold text-[#718097]">
            {(
              [
                ["review", "待人工复核", String(reviewTaskCount)],
                ["material", "待补充资料", String(materialTaskCount)],
              ] as const
            ).map(([filter, label, count]) => (
              <button
                type="button"
                key={filter}
                onClick={() => setTaskFilter(filter)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-black ${taskFilter === filter ? "bg-[#eaf0fb] text-[#315ca9]" : "text-[#718097] hover:bg-[#f3f5f8]"}`}
              >
                {label} {count}
              </button>
            ))}
            <span className="ml-auto">全部人工事项 {layerTaskNodes.length}</span>
          </div>
          <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
            <div className="grid grid-cols-[96px_minmax(150px,1fr)_100px_130px_120px_130px] gap-4 bg-[#fafbfc] px-4 py-3 text-[10px] font-black text-[#68768a]">
              <span>AP / CC 节点编号</span>
              <span>待办事项</span>
              <span>负责人</span>
              <span>触发 / 调参 / 追溯</span>
              <span>资料状态</span>
              <span>处理</span>
            </div>
            {taskNodes.map((node, index) => {
              const needsMaterial = Boolean(materialRequests[node.id]);
              const reason = taskReason(node, index);
              const taskSummary = needsMaterial
                ? reason.materialSummary ?? `缺少${reason.evidence}`
                : reason.summary;
              const taskDetail = needsMaterial
                ? reason.materialDetail ??
                  `需要补充${reason.evidence}，用于完成“${node.label}”的判断。`
                : reason.detail;
              const decision = taskDecisions[node.id];
              const owner = nodeAssignments[node.id] ?? "待分配";
              const canProcess = owner === "符金雨";
              return (
                <React.Fragment key={node.id}>
                <div
                  key={node.id}
                  className="grid grid-cols-[96px_minmax(150px,1fr)_100px_130px_120px_130px] items-center gap-4 border-t border-[#edf0f4] px-4 py-3"
                >
                  <span className="truncate font-mono text-[9px] font-black text-[#596a83]">
                    {taskNodeCode[node.id] ?? node.id.toUpperCase()}
                  </span>
                  <span>
                    <strong className="block text-[11px] font-black text-[#35455f]">
                      {node.label}
                    </strong>
                    <small className="mt-1 block text-[9px] font-bold text-[#7f8c9f]">
                      {node.kind} ·{" "}
                      {node.kind === "风险信号" || node.kind === "复合风险"
                        ? "判断风险结论"
                        : node.kind === "内控测试"
                          ? "复核控制测试"
                          : "复核执行结果与结论"}
                    </small>
                  </span>
                  <span className="text-[10px] font-black text-[#526178]">
                    {owner}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTaskId((current) =>
                        current === node.id ? null : node.id,
                      );
                      if (needsMaterial && canProcess) setSupplementTaskId(node.id);
                    }}
                    className="text-left text-[9px] font-bold leading-relaxed text-[#52698f] hover:underline"
                  >
                    {taskSummary}
                    <small className="mt-1 block text-[8px] font-black text-[#315ca9]">
                      {tracePath[node.id] ?? "查看节点上下游关系"}
                    </small>
                  </button>
                  <span
                    aria-label={`资料状态：${needsMaterial ? "待补充资料" : "资料齐全"}`}
                    className={`justify-self-start rounded px-2 py-1.5 text-[9px] font-black ${needsMaterial ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}
                  >
                    {needsMaterial ? "待补充资料" : "资料齐全"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTaskId((current) =>
                        current === node.id ? null : node.id,
                      )
                    }
                    className="h-8 rounded-md border border-[#bcc9dc] bg-white px-3 text-[9px] font-black text-[#405b89] hover:bg-[#f3f6fa]"
                  >
                    {decision ?? (canProcess ? (needsMaterial ? "查看并催办" : "查看并处理") : "只读查看")}
                  </button>
                  {activeTaskId === node.id && (
                    <div className="col-span-6 mt-1 border-t border-[#e5e9ef] bg-[#fafbfc] px-5 py-4">
                      <div className="max-w-[820px] space-y-4">
                        <div className="grid grid-cols-[88px_1fr] gap-4">
                          <h4 className="text-[10px] font-black text-[#35455f]">
                            {needsMaterial ? "需要补什么" : "发现什么异常"}
                          </h4>
                          <div>
                            <strong className="block text-[11px] font-black text-[#35455f]">
                              {taskSummary}
                            </strong>
                            <p className="mt-1 text-[10px] font-bold leading-[1.7] text-[#64738a]">
                              {taskDetail}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-[88px_1fr] gap-4">
                          <h4 className="text-[10px] font-black text-[#35455f]">
                            如何得出
                          </h4>
                          <div>
                            <p className="text-[10px] font-bold leading-[1.7] text-[#53647d]">
                              知识图谱沿三层关系推导：{tracePath[node.id] ?? "由上游风险和控制测试结果，定位到当前 AP/CC 节点"}。
                            </p>
                            <p className="mt-1 text-[9px] font-bold leading-relaxed text-[#7a8799]">
                              依据资料：{reason.evidence}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-[88px_1fr] gap-4">
                          <h4 className="text-[10px] font-black text-[#35455f]">
                            {needsMaterial ? "补充后做什么" : "需要人工判断"}
                          </h4>
                          <p className="text-[10px] font-black leading-[1.7] text-[#405b89]">
                            {reason.handling}
                          </p>
                        </div>
                      </div>
                      {supplementTaskId === node.id && canProcess && (
                        <div className="mt-5 rounded-lg bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="text-[10px] font-black text-[#35455f]">
                                补充资料
                              </h4>
                              <p className="mt-1 text-[8px] font-bold text-[#7b8799]">
                                发出请求后模拟资料回传并重新运行；仍有异常的事项进入待人工复核，无问题的事项自动关闭。
                              </p>
                            </div>
                            <span className="rounded bg-amber-50 px-2 py-1 text-[8px] font-black text-amber-800">
                              {reason.evidence}
                            </span>
                          </div>
                          <div className="mt-4 space-y-3">
                            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-[#bfcbe0] bg-[#fafbfc] px-4 py-3 hover:border-[#829aca]">
                              <input
                                type="file"
                                multiple
                                className="sr-only"
                                onChange={(event) => {
                                  const files = event.currentTarget.files;
                                  if (!files) return;
                                  setSupplementFiles((current) =>
                                    Array.from(
                                      new Set([
                                        ...current,
                                        ...Array.from(files, (file) => (file as File).name),
                                      ]),
                                    ),
                                  );
                                  event.currentTarget.value = "";
                                }}
                              />
                              <span>
                                <strong className="block text-[9px] font-black text-[#405b89]">
                                  上传并关联已有资料
                                </strong>
                                <small className="mt-1 block text-[8px] font-bold text-[#8793a7]">
                                  支持多选或分次添加，不限制文件类型
                                </small>
                              </span>
                              <Plus className="h-4 w-4 text-[#4969a8]" />
                            </label>
                            {supplementFiles.length > 0 && (
                              <ul className="grid grid-cols-2 gap-2">
                                {supplementFiles.map((fileName) => (
                                  <li key={fileName} className="flex min-w-0 items-center gap-2 rounded-md bg-[#f4f6f9] px-3 py-2 text-[8px] font-bold text-[#566981]">
                                    <span className="min-w-0 flex-1 truncate">{fileName}</span>
                                    <button type="button" aria-label={`移除 ${fileName}`} onClick={() => setSupplementFiles((current) => current.filter((name) => name !== fileName))}>
                                      <X className="h-3 w-3" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                              <label className="grid gap-1 text-[8px] font-black text-[#536179]">
                                补充人
                                <span className="flex h-9 items-center rounded-md border border-[#d5deea] bg-white px-3 text-[9px] font-bold text-[#40516c]">
                                  符金雨
                                </span>
                              </label>
                              <label className="grid gap-1 text-[8px] font-black text-[#536179]">
                                截止日期
                                <input type="date" value={supplementDeadline} onChange={(event) => setSupplementDeadline(event.target.value)} className="h-9 rounded-md border border-[#d5deea] bg-white px-3 text-[9px] font-bold" />
                              </label>
                            </div>
                            <label className="grid gap-1 text-[8px] font-black text-[#536179]">
                              补充要求
                              <textarea value={supplementNote} onChange={(event) => setSupplementNote(event.target.value)} placeholder="说明需要补充的资料、期间、口径及用途…" className="h-20 resize-none rounded-md border border-[#d5deea] bg-white p-3 text-[9px] font-bold outline-none focus:border-[#829aca]" />
                            </label>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setSupplementTaskId(null)} className="h-8 rounded-md px-3 text-[9px] font-black text-[#6c7a8f]">取消</button>
                              <button
                                type="button"
                                disabled={!supplementNote.trim() && supplementFiles.length === 0}
                                onClick={() => {
                                  const rerunStillNeedsReview = ["rs2", "ap3", "cc1"].includes(node.id);
                                  setTaskDecisions((current) => ({
                                    ...current,
                                    [node.id]: rerunStillNeedsReview ? "资料已补充" : "无问题关闭",
                                  }));
                                  setMaterialRequests((current) => ({
                                    ...current,
                                    [node.id]: false,
                                  }));
                                  setSupplementTaskId(null);
                                  setActiveTaskId(null);
                                  setSupplementNote("");
                                  setSupplementFiles([]);
                                }}
                                className="h-8 rounded-md border border-[#b8c7dd] bg-white px-4 text-[9px] font-black text-[#405b89] disabled:cursor-not-allowed disabled:text-[#a5afbd]"
                              >
                                发补充请求
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="col-span-3 flex flex-wrap justify-end gap-2 border-t border-[#e5e9ef] pt-3">
                        <button
                          type="button"
                          onClick={() => onViewGraph(node.id)}
                          className="h-8 rounded-md border border-[#bcc9dc] bg-white px-3 text-[9px] font-black text-[#405b89]"
                        >
                          查看节点与证据
                        </button>
                        {canProcess && !needsMaterial && (
                          <button
                            type="button"
                            onClick={() =>
                              setTaskDecisions((current) => ({
                                ...current,
                                [node.id]: "通过",
                              }))
                            }
                            className="h-8 rounded-md bg-[#315ca9] px-3 text-[9px] font-black text-white"
                          >
                            确认结论
                          </button>
                        )}
                        {canProcess && (
                          <button
                            type="button"
                            onClick={() => {
                              setSupplementTaskId(node.id);
                            }}
                            className="h-8 rounded-md border border-[#d8c48e] bg-white px-3 text-[9px] font-black text-[#8a6718]"
                          >
                            {needsMaterial ? "补充资料" : "退回补充资料"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                </React.Fragment>
              );
            })}
            {taskNodes.length === 0 && (
              <div className="border-t border-[#edf0f4] px-4 py-8 text-center text-[10px] font-bold text-[#7b8799]">
                当前层级没有此类待办。
              </div>
            )}
          </section>
          <section className="mt-4 flex items-center justify-between gap-5 border-y border-[#dfe5ed] bg-white px-5 py-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-[#64738a]">
                <span>已确认结论 <b className="text-[#315ca9]">{confirmedTaskCount}/{layerTaskNodes.length}</b></span>
                <span>待补充资料 <b className={materialTaskCount ? "text-amber-700" : "text-emerald-700"}>{materialTaskCount}</b></span>
              </div>
              <p className="mt-1 text-[9px] font-bold text-[#8491a4]">
                {projectAlreadyHandedOff
                  ? "本次执行结果已锁定并移交后续审计。"
                  : allTaskConclusionsConfirmed
                    ? "全部 AP/CC 结论已确认，可以锁定执行版本并生成后续审计事项。"
                    : "完成全部人工复核并补齐资料后，才能移交后续审计。"}
              </p>
            </div>
            <button
              type="button"
              disabled={!allTaskConclusionsConfirmed && !projectAlreadyHandedOff}
              onClick={() =>
                projectAlreadyHandedOff
                  ? onOpenDownstream(projectId)
                  : onHandoffDownstream(projectId)
              }
              className="h-9 shrink-0 rounded-md bg-[#315ca9] px-4 text-[9px] font-black text-white hover:bg-[#264f96] disabled:cursor-not-allowed disabled:bg-[#cbd3df]"
            >
              {projectAlreadyHandedOff ? "进入后续审计" : "确认全部结论并移交后续审计"}
            </button>
          </section>
        </div>
      </div>
    );
  }
  if (tab === "layout")
    return (
      <div className="h-full overflow-auto bg-[#f8fafc] p-4 custom-scrollbar">
        <div className="mx-auto min-w-[980px] max-w-[1180px]">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-[#2f405b]">
                标签责任分配与执行
              </h2>
              <p className="mt-1 text-[9px] font-bold text-[#75839a]">
                执行方式决定系统如何处理；负责人对资料完整性、异常处理和最终结果负责。每个标签必须分配到人。
              </p>
            </div>
            <span
              className={`rounded px-2 py-1 text-[8px] font-black ${projectGraphReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
            >
              {projectGraphReady ? "DAG 已启动" : "等待 DAG 启动"}
            </span>
          </header>
          <div className="mt-4 grid grid-cols-4 divide-x divide-[#e2e7ee] border-y border-[#e2e7ee] bg-white py-3">
            {[
              ["已分配", "7 / 7"],
              ["系统自动执行", "3"],
              ["必须人工复核", "2"],
              [
                "资料待补充",
                String(Object.values(materialRequests).filter(Boolean).length),
              ],
            ].map(([label, value]) => (
              <div key={label} className="px-4">
                <span className="text-[8px] font-bold text-[#8491a4]">
                  {label}
                </span>
                <strong className="mt-1 block text-lg font-black text-[#3d506c]">
                  {value}
                </strong>
              </div>
            ))}
          </div>
          <section className="mt-3 overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
            <div className="grid grid-cols-[100px_minmax(150px,1fr)_170px_120px_100px_145px_105px] gap-3 bg-[#fafbfc] px-4 py-3 text-[8px] font-black text-[#7d899b]">
              <span>节点</span>
              <span>标签任务</span>
              <span>系统执行链路</span>
              <span>负责人</span>
              <span>复核人</span>
              <span>资料状态</span>
              <span>执行状态</span>
            </div>
            {rules.slice(0, 7).map((rule, index) => {
              const executor = executorDisplay[rule.executor];
              const needsReview =
                rule.executor === "AI 初筛 + 人工" ||
                rule.executor === "大模型";
              const needsMaterial = Boolean(materialRequests[rule.id]);
              return (
                <div
                  key={rule.id}
                  className="grid grid-cols-[100px_minmax(150px,1fr)_170px_120px_100px_145px_105px] items-center gap-3 border-t border-[#edf0f4] px-4 py-3 text-[9px]"
                >
                  <span className="font-mono text-[8px] font-black text-[#596a83]">
                    {rule.id}
                  </span>
                  <span>
                    <strong className="block text-[10px] text-[#35455f]">
                      {rule.name}
                    </strong>
                    <small className="mt-1 block text-[8px] font-bold text-[#929daf]">
                      {rule.cycle}
                    </small>
                  </span>
                  <span>
                    <strong
                      className={`block text-[9px] font-black ${executor?.tone ?? "text-[#526178]"}`}
                    >
                      {executor?.label ?? rule.executor}
                    </strong>
                    <small className="mt-1 block text-[7px] font-bold text-[#8794a7]">
                      {executor?.flow}
                    </small>
                  </span>
                  <select
                    value={assignments[rule.id]}
                    onChange={(event) =>
                      setAssignments((current) => ({
                        ...current,
                        [rule.id]: event.target.value,
                      }))
                    }
                    className="h-8 rounded-md border border-[#d8e0eb] bg-white px-2 text-[9px] font-black text-[#43536c] outline-none"
                  >
                    <option>陈华</option>
                    <option>李敏</option>
                    <option>王晨</option>
                    <option>赵宁</option>
                  </select>
                  <span className="text-[9px] font-bold text-[#596a83]">
                    {needsReview ? "符金雨" : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setMaterialRequests((current) => ({
                        ...current,
                        [rule.id]: !current[rule.id],
                      }))
                    }
                    className={`min-h-8 rounded-md px-2 text-[8px] font-black ${needsMaterial ? "bg-amber-50 text-amber-700" : "border border-[#d8e0eb] text-[#5f7088]"}`}
                  >
                    {needsMaterial ? "待负责人补充资料" : "发起补充资料"}
                  </button>
                  <span
                    className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${needsMaterial ? "bg-amber-50 text-amber-700" : index < 2 && projectGraphReady ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                  >
                    {needsMaterial
                      ? "资料阻塞"
                      : index < 2 && projectGraphReady
                        ? "执行中"
                        : "待执行"}
                  </span>
                </div>
              );
            })}
          </section>
          <p className="mt-3 text-[8px] font-bold text-[#7d899b]">
            规则自动执行也必须指定负责人：负责人处理异常、补充资料并确认结果；大模型与混合执行节点按标签定义进入人工复核队列。
          </p>
        </div>
      </div>
    );
  return (
    <div className="h-full overflow-y-auto bg-[#f8fafc] p-4 custom-scrollbar">
      <div className="mx-auto max-w-[760px] rounded-lg border border-[#dfe5ed] bg-white p-5">
        <h2 className="text-sm font-black text-[#2f405b]">布局设置</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["节点排列", "分层布局"],
            ["连线样式", "按关系类型着色"],
            ["节点密度", "标准"],
            ["标签显示", "编号 + 名称"],
          ].map(([label, value]) => (
            <label
              key={label}
              className="grid gap-2 text-[9px] font-black text-[#526178]"
            >
              {label}
              <select className="h-9 rounded-lg border border-[#dce3ed] bg-white px-3 text-[9px] font-bold text-[#526178]">
                <option>{value}</option>
              </select>
            </label>
          ))}
        </div>
        <button
          type="button"
          className="mt-5 h-9 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white"
        >
          应用布局
        </button>
      </div>
    </div>
  );
}

const graphStudioNodes = [
  {
    id: "scope",
    label: "项目 Scope",
    kind: "项目配置",
    x: 48,
    y: 280,
    r: 25,
    color: "#253b66",
  },
  {
    id: "rs1",
    label: "收入异常",
    kind: "风险信号",
    x: 220,
    y: 80,
    r: 23,
    color: "#36b9c3",
  },
  {
    id: "rs2",
    label: "账龄恶化",
    kind: "风险信号",
    x: 235,
    y: 178,
    r: 19,
    color: "#36b9c3",
  },
  {
    id: "rs3",
    label: "存货增长",
    kind: "风险信号",
    x: 205,
    y: 370,
    r: 21,
    color: "#36b9c3",
  },
  {
    id: "rs4",
    label: "资金异常",
    kind: "风险信号",
    x: 245,
    y: 505,
    r: 18,
    color: "#36b9c3",
  },
  {
    id: "and1",
    label: "虚增收入",
    kind: "复合风险",
    x: 390,
    y: 108,
    r: 26,
    color: "#d95b63",
  },
  {
    id: "ct1",
    label: "出货审批",
    kind: "内控测试",
    x: 405,
    y: 285,
    r: 21,
    color: "#55c83e",
  },
  {
    id: "ct2",
    label: "盘点控制",
    kind: "内控测试",
    x: 380,
    y: 455,
    r: 19,
    color: "#55c83e",
  },
  {
    id: "ap1",
    label: "截止测试",
    kind: "审计程序",
    x: 570,
    y: 80,
    r: 22,
    color: "#c5b62f",
  },
  {
    id: "ap2",
    label: "三单一致",
    kind: "审计程序",
    x: 605,
    y: 170,
    r: 18,
    color: "#c5b62f",
  },
  {
    id: "ap3",
    label: "应收函证",
    kind: "审计程序",
    x: 560,
    y: 300,
    r: 24,
    color: "#c5b62f",
  },
  {
    id: "ap4",
    label: "存货监盘",
    kind: "审计程序",
    x: 590,
    y: 440,
    r: 21,
    color: "#c5b62f",
  },
  {
    id: "cc1",
    label: "关联披露",
    kind: "合规检查",
    x: 515,
    y: 510,
    r: 19,
    color: "#8a63d2",
  },
  {
    id: "human",
    label: "CPA 确认",
    kind: "人工节点",
    x: 730,
    y: 135,
    r: 27,
    color: "#151f36",
  },
  {
    id: "evidence",
    label: "审计证据",
    kind: "执行结果",
    x: 730,
    y: 330,
    r: 23,
    color: "#4b607f",
  },
  {
    id: "complete",
    label: "完成结论",
    kind: "完成阶段",
    x: 730,
    y: 505,
    r: 25,
    color: "#33445f",
  },
];

const graphStudioEdges = [
  ["scope", "rs1"],
  ["scope", "rs2"],
  ["scope", "rs3"],
  ["scope", "rs4"],
  ["rs1", "and1"],
  ["rs2", "and1"],
  ["rs1", "ct1"],
  ["rs2", "ct1"],
  ["rs3", "ct2"],
  ["and1", "ap1"],
  ["and1", "ap2"],
  ["ct1", "ap1"],
  ["ct1", "ap3"],
  ["ct2", "ap4"],
  ["rs4", "cc1"],
  ["ap1", "human"],
  ["ap2", "human"],
  ["ap3", "human"],
  ["ap4", "evidence"],
  ["cc1", "complete"],
  ["human", "evidence"],
  ["evidence", "complete"],
] as const;

const getNodeAnnotationStatus = (index: number) => {
  if (index < 3) return "进行中";
  if (index < 5) return "待补充资料";
  if (index < 8) return "已完成";
  return "待确认";
};

const libraryTagGroups = [
  {
    prefix: "RS",
    kind: "风险信号",
    count: 36,
    color: "#36b9c3",
    start: [48, 82],
    columns: 6,
    gap: [54, 30],
    names: [
      "收入异常",
      "账龄恶化",
      "存货增长",
      "资金异常",
      "毛利波动",
      "费用突增",
      "关联交易",
      "现金异常",
    ],
  },
  {
    prefix: "CT",
    kind: "内控测试",
    count: 31,
    color: "#55c83e",
    start: [450, 82],
    columns: 6,
    gap: [52, 30],
    names: [
      "出货审批",
      "盘点控制",
      "收款控制",
      "采购审批",
      "付款复核",
      "合同授权",
      "系统权限",
      "凭证复核",
    ],
  },
  {
    prefix: "AP",
    kind: "审计程序",
    count: 84,
    color: "#c5b62f",
    start: [48, 350],
    columns: 11,
    gap: [32, 25],
    names: [
      "截止测试",
      "应收函证",
      "存货监盘",
      "细节测试",
      "分析程序",
      "重新计算",
      "合同检查",
      "替代程序",
    ],
  },
  {
    prefix: "CC",
    kind: "合规检查",
    count: 22,
    color: "#8a63d2",
    start: [462, 360],
    columns: 6,
    gap: [48, 42],
    names: [
      "关联披露",
      "税务合规",
      "资金合规",
      "三重一大",
      "招待费",
      "采购合规",
      "环保合规",
      "信息披露",
    ],
  },
] as const;

const libraryTagNodes = libraryTagGroups.flatMap((group, groupIndex) =>
  Array.from({ length: group.count }, (_, index) => {
    const column = index % group.columns;
    const row = Math.floor(index / group.columns);
    const jitterX = ((index * 17 + groupIndex * 11) % 7) - 3;
    const jitterY = ((index * 13 + groupIndex * 5) % 5) - 2;
    return {
      id: `library-${group.prefix.toLowerCase()}-${index + 1}`,
      label: `${group.names[index % group.names.length]} ${String(index + 1).padStart(2, "0")}`,
      kind: group.kind,
      x: group.start[0] + column * group.gap[0] + jitterX,
      y: group.start[1] + row * group.gap[1] + jitterY,
      r: 6,
      color: group.color,
    };
  }),
);

function KnowledgeGraphStudio({ onAgent }: { onAgent: () => void }) {
  const [selectedId, setSelectedId] = useState("and1");
  const [search, setSearch] = useState("");
  const [activeKind, setActiveKind] = useState("全部");
  const selectedNode =
    graphStudioNodes.find((node) => node.id === selectedId) ??
    graphStudioNodes[0];
  const visibleNodes = graphStudioNodes.filter(
    (node) =>
      (activeKind === "全部" || node.kind === activeKind) &&
      node.label.includes(search.trim()),
  );
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  return (
    <section className="mt-4 grid h-[650px] min-h-0 overflow-hidden rounded-xl bg-white outline outline-1 outline-[#dce3ec] lg:grid-cols-[190px_minmax(0,1fr)_275px]">
      <aside className="min-h-0 border-b border-[#e5e9ef] bg-[#f8f9fb] lg:border-b-0 lg:border-r">
        <header className="border-b border-[#e4e8ee] p-3">
          <h2 className="text-[10px] font-black text-[#31415d]">知识实体</h2>
          <label className="mt-2 flex h-8 items-center gap-2 rounded-md border border-[#dce2ea] bg-white px-2">
            <Search className="h-3 w-3 text-[#8b97a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[8px] font-bold outline-none"
              placeholder="搜索节点…"
            />
          </label>
        </header>
        <div className="space-y-1 p-2">
          {[
            ["全部", 16, "#63738d"],
            ["项目配置", 1, "#253b66"],
            ["风险信号", 4, "#e5a33b"],
            ["复合风险", 1, "#d95b63"],
            ["内控测试", 2, "#497cd1"],
            ["审计程序", 4, "#2fa77c"],
            ["合规检查", 1, "#8a63d2"],
            ["人工节点", 1, "#151f36"],
            ["执行结果", 1, "#4b607f"],
            ["完成阶段", 1, "#33445f"],
          ].map(([kind, count, color]) => (
            <button
              type="button"
              key={String(kind)}
              onClick={() => setActiveKind(String(kind))}
              className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left ${activeKind === kind ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
            >
              <span className="flex items-center gap-2 text-[8px] font-black text-[#506078]">
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ background: String(color) }}
                />
                {kind}
              </span>
              <span className="text-[7px] font-bold text-[#9aa4b3]">
                {count}
              </span>
            </button>
          ))}
        </div>
        <div className="mx-3 mt-2 border-t border-[#e1e6ed] pt-3">
          <span className="text-[7px] font-black text-[#8b97a8]">当前图谱</span>
          <p className="mt-1 text-[8px] font-black text-[#41516c]">
            制造业年度审计
          </p>
          <p className="mt-1 text-[7px] font-bold text-[#95a0b0]">
            16 节点 · 22 条关系
          </p>
        </div>
      </aside>
      <main className="relative min-h-0 min-w-0 overflow-hidden bg-[#fbfcfd]">
        <header className="absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between border-b border-[#e7ebf0] bg-white/95 px-3">
          <div>
            <h2 className="text-[10px] font-black text-[#2f405c]">
              项目知识图谱
            </h2>
            <p className="mt-0.5 text-[7px] font-bold text-[#929dae]">
              华东智造有限公司2026年度审计
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md border border-[#e0e5ec] text-[11px] font-black text-[#65748b]"
            >
              −
            </button>
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md border border-[#e0e5ec] text-[11px] font-black text-[#65748b]"
            >
              +
            </button>
            <button
              type="button"
              className="h-7 rounded-md border border-[#e0e5ec] px-2 text-[7px] font-black text-[#65748b]"
            >
              适配画布
            </button>
            <button
              type="button"
              onClick={onAgent}
              className="flex h-7 items-center gap-1 rounded-md bg-[#253f72] px-2.5 text-[7px] font-black text-white"
            >
              <Bot className="h-3 w-3" />
              询问 Agent
            </button>
          </div>
        </header>
        <div className="absolute inset-0 top-12 overflow-hidden">
          <svg
            viewBox="0 0 780 570"
            className="h-full w-full"
            role="img"
            aria-label="审计标签知识图谱"
          >
            <defs>
              <marker
                id="graph-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L7,3 z" fill="#9eabbd" />
              </marker>
            </defs>
            {graphStudioEdges.map(([from, to]) => {
              const a = graphStudioNodes.find((node) => node.id === from)!;
              const b = graphStudioNodes.find((node) => node.id === to)!;
              if (!visibleIds.has(from) || !visibleIds.has(to)) return null;
              const active = from === selectedId || to === selectedId;
              return (
                <line
                  key={`${from}-${to}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={active ? "#5578b9" : "#c8d0dc"}
                  strokeWidth={active ? 2 : 1}
                  strokeOpacity={active ? 0.9 : 0.58}
                  markerEnd="url(#graph-arrow)"
                />
              );
            })}
            {visibleNodes.map((node) => (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(node.id)}
                onKeyDown={(event) =>
                  event.key === "Enter" && setSelectedId(node.id)
                }
                className="cursor-pointer outline-none"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 7}
                  fill={node.color}
                  opacity={selectedId === node.id ? 0.16 : 0.06}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={node.color}
                  stroke={selectedId === node.id ? "#17243c" : "#fff"}
                  strokeWidth={selectedId === node.id ? 3 : 2}
                />
                <text
                  x={node.x}
                  y={node.y + 3}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="9"
                  fontWeight="700"
                >
                  {node.label}
                </text>
                <text
                  x={node.x}
                  y={node.y + node.r + 15}
                  textAnchor="middle"
                  fill="#75839a"
                  fontSize="7"
                  fontWeight="600"
                >
                  {node.kind}
                </text>
              </g>
            ))}
          </svg>
        </div>
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 rounded-md border border-[#e0e5ec] bg-white px-2.5 py-2 shadow-sm">
          <span className="text-[7px] font-black text-[#738198]">关系</span>
          <span className="flex items-center gap-1 text-[7px] font-bold text-[#7e8b9e]">
            <i className="h-px w-4 bg-[#9eabbd]" />
            触发
          </span>
          <span className="flex items-center gap-1 text-[7px] font-bold text-[#7e8b9e]">
            <i className="h-px w-4 border-t border-dashed border-[#5578b9]" />
            参数调整
          </span>
        </div>
      </main>
      <aside className="min-h-0 overflow-y-auto border-t border-[#e5e9ef] bg-white custom-scrollbar lg:border-l lg:border-t-0">
        <header className="flex items-center justify-between border-b border-[#e6eaf0] px-4 py-3">
          <div>
            <span className="text-[7px] font-black text-[#97a1b0]">
              节点详情
            </span>
            <h2 className="mt-1 text-xs font-black text-[#2f405c]">
              {selectedNode.label}
            </h2>
          </div>
          <span
            className="rounded-md px-2 py-1 text-[7px] font-black text-white"
            style={{ background: selectedNode.color }}
          >
            {selectedNode.kind}
          </span>
        </header>
        <div className="space-y-4 p-4">
          <div>
            <span className="font-mono text-[7px] font-black text-[#8b96a7]">
              RS-FRAUD-001 · v1.3
            </span>
            <p className="mt-2 text-[8px] font-bold leading-[1.7] text-[#5d6d84]">
              收入增速异常与应收账龄恶化同时命中时，识别为虚增收入复合风险，触发收入专项审计程序。
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-[8px]">
            <div>
              <dt className="font-bold text-[#98a2b1]">执行方式</dt>
              <dd className="mt-1 font-black text-[#44546e]">规则引擎</dd>
            </div>
            <div>
              <dt className="font-bold text-[#98a2b1]">置信度</dt>
              <dd className="mt-1 font-black text-emerald-700">94%</dd>
            </div>
            <div>
              <dt className="font-bold text-[#98a2b1]">上游节点</dt>
              <dd className="mt-1 font-black text-[#44546e]">2 个</dd>
            </div>
            <div>
              <dt className="font-bold text-[#98a2b1]">下游节点</dt>
              <dd className="mt-1 font-black text-[#44546e]">3 个</dd>
            </div>
          </dl>
          <div>
            <h3 className="text-[8px] font-black text-[#66758b]">关联路径</h3>
            <div className="mt-2 space-y-1.5">
              {[
                "收入异常 → 虚增收入",
                "账龄恶化 → 虚增收入",
                "虚增收入 → 截止测试",
              ].map((path) => (
                <button
                  type="button"
                  key={path}
                  className="flex w-full items-center justify-between rounded-md bg-[#f5f7fa] px-2.5 py-2 text-[8px] font-bold text-[#56667d]"
                >
                  {path}
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-[#f0f4fb] p-3">
            <div className="flex items-center gap-1.5 text-[8px] font-black text-[#405f99]">
              <Bot className="h-3.5 w-3.5" />
              图谱检索 Agent
            </div>
            <p className="mt-2 text-[8px] font-bold leading-relaxed text-[#63738c]">
              该节点由两条风险信号共同构成，建议保留并提交 CPA 确认。
            </p>
            <button
              type="button"
              onClick={onAgent}
              className="mt-2 text-[8px] font-black text-[#315cae]"
            >
              继续询问 Agent →
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-8 flex-1 rounded-md border border-[#d6deea] text-[8px] font-black text-[#596a84]"
            >
              编辑关系
            </button>
            <button
              type="button"
              className="h-8 flex-1 rounded-md bg-[#263f71] text-[8px] font-black text-white"
            >
              查看标签
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}

function AuditGraphWorkspace({
  onNewProject,
  preparationRequest,
  preparationProjectId,
  createdProjects,
  onReference,
  onNavigate,
  onOpenDownstream,
  onHandoffDownstream,
  downstreamProgressByProject,
  taskDecisionsByProject,
  setTaskDecisionsByProject,
  materialRequestsByProject,
  setMaterialRequestsByProject,
  onOpenReview,
  onConfirmMateriality,
  onStartDag,
  materialityConfirmed,
  projectGraphReady,
  nodeAssignments,
  setNodeAssignments,
  initialSource = "library",
}: {
  onNewProject: () => void;
  preparationRequest: number;
  preparationProjectId: string | null;
  createdProjects: CreatedAuditProject[];
  onReference: (value: string) => void;
  onNavigate: (view: "review" | "execution" | "downstream") => void;
  onOpenDownstream: (projectId: string) => void;
  onHandoffDownstream: (projectId: string) => void;
  downstreamProgressByProject: Record<string, number>;
  taskDecisionsByProject: Record<string, AuditTaskDecisionMap>;
  setTaskDecisionsByProject: React.Dispatch<
    React.SetStateAction<Record<string, AuditTaskDecisionMap>>
  >;
  materialRequestsByProject: Record<string, AuditMaterialRequestMap>;
  setMaterialRequestsByProject: React.Dispatch<
    React.SetStateAction<Record<string, AuditMaterialRequestMap>>
  >;
  onOpenReview: (stage: "parameters" | "candidates") => void;
  onConfirmMateriality: () => void;
  onStartDag: () => void;
  materialityConfirmed: boolean;
  projectGraphReady: boolean;
  nodeAssignments: Record<string, string>;
  setNodeAssignments: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  initialSource?: "library" | "project";
}) {
  const [graphSource, setGraphSource] = useState<"library" | "project">(
    "project",
  );
  const [selectedProjectId, setSelectedProjectId] = useState("audit-handoff");
  const [projectStageOverrides, setProjectStageOverrides] = useState<
    Record<string, "pre_scope" | "candidate" | "dag">
  >({});
  const auditProjects = [
    {
      id: "audit-handoff",
      name: "远川制造 · 已移交",
      client: "远川智能制造有限公司",
      stage: "dag" as const,
    },
    {
      id: "huadong",
      name: "华东智造 · 2026 年审",
      client: "华东智造有限公司",
      stage: "pre_scope" as const,
    },
    {
      id: "jinli",
      name: "金利集团 · 专项审计",
      client: "金利集团有限公司",
      stage: "dag" as const,
    },
    {
      id: "xincheng",
      name: "新城建设 · 2026 年审",
      client: "新城建设集团",
      stage: "candidate" as const,
    },
    ...createdProjects.map((project) => ({
      ...project,
      stage: "pre_scope" as const,
    })),
  ];
  const selectedProject =
    auditProjects.find((project) => project.id === selectedProjectId) ??
    auditProjects[0];
  const selectedTaskDecisions =
    taskDecisionsByProject[selectedProject.id] ?? {};
  const selectedMaterialRequests =
    materialRequestsByProject[selectedProject.id] ?? initialAuditMaterialRequests;
  const setSelectedTaskDecisions: React.Dispatch<
    React.SetStateAction<AuditTaskDecisionMap>
  > = (update) =>
    setTaskDecisionsByProject((currentByProject) => {
      const current = currentByProject[selectedProject.id] ?? {};
      const next = typeof update === "function" ? update(current) : update;
      return { ...currentByProject, [selectedProject.id]: next };
    });
  const setSelectedMaterialRequests: React.Dispatch<
    React.SetStateAction<AuditMaterialRequestMap>
  > = (update) =>
    setMaterialRequestsByProject((currentByProject) => {
      const current =
        currentByProject[selectedProject.id] ?? initialAuditMaterialRequests;
      const next = typeof update === "function" ? update(current) : update;
      return { ...currentByProject, [selectedProject.id]: next };
    });
  const [workspaceTab, setWorkspaceTab] = useState<GraphWorkspaceTab>("graph");
  const [manualTagsByProject, setManualTagsByProject] = useState<ManualCandidateTagsByProject>(() =>
    readStoredRecord("huaan-manual-candidate-tags-v1", {}),
  );
  const [decisionDetailsByProject, setDecisionDetailsByProject] = useState<CandidateDecisionDetailsByProject>(() =>
    readStoredRecord("huaan-candidate-decisions-v1", {}),
  );
  useEffect(() => {
    try {
      localStorage.setItem(
        "huaan-manual-candidate-tags-v1",
        JSON.stringify(manualTagsByProject),
      );
    } catch {
      // The in-memory state still works when a file:// browser blocks storage.
    }
  }, [manualTagsByProject]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "huaan-candidate-decisions-v1",
        JSON.stringify(decisionDetailsByProject),
      );
    } catch {
      // The in-memory state still works when a file:// browser blocks storage.
    }
  }, [decisionDetailsByProject]);
  const projectProfiles: Record<string, { candidateNodes: number; dagNodes: number; dagEdges: number }> = {
    "audit-handoff": { candidateNodes: 16, dagNodes: 16, dagEdges: 22 },
    huadong: { candidateNodes: 13, dagNodes: 13, dagEdges: 15 },
    jinli: { candidateNodes: 14, dagNodes: 14, dagEdges: 18 },
    xincheng: { candidateNodes: 16, dagNodes: 16, dagEdges: 22 },
  };
  const selectedProjectProfile = projectProfiles[selectedProject.id] ?? {
    candidateNodes: 12,
    dagNodes: 12,
    dagEdges: 14,
  };
  const projectStage =
    projectStageOverrides[selectedProject.id] ?? selectedProject.stage;
  const selectedDownstreamProgress =
    downstreamProgressByProject[selectedProject.id] ?? -1;
  const projectNodeCount =
    projectStage === "dag"
      ? selectedProjectProfile.dagNodes
      : selectedProjectProfile.candidateNodes;
  const manualTagIds = manualTagsByProject[selectedProject.id] ?? [];
  const manualTagNodes = manualTagIds
    .map((id) => libraryTagNodes.find((node) => node.id === id))
    .filter((node): node is (typeof libraryTagNodes)[number] => Boolean(node));
  const projectGraphNodes = [
    ...graphStudioNodes.slice(0, projectNodeCount),
    ...manualTagNodes,
  ];
  const projectGraphNodeIds = new Set(projectGraphNodes.map((node) => node.id));
  const projectGraphEdges = graphStudioEdges
    .filter(
      ([from, to]) => projectGraphNodeIds.has(from) && projectGraphNodeIds.has(to),
    )
    .slice(0, selectedProjectProfile.dagEdges);
  const projectUsesPool =
    graphSource === "project" && projectStage === "pre_scope";
  const combinedNodePositions = Object.fromEntries(
    [...libraryTagNodes, ...graphStudioNodes].map((node) => [
      node.id,
      { x: node.x, y: node.y },
    ]),
  );
  const [activeLayer, setActiveLayer] = useState<"all" | "1" | "2" | "3" | "4">(
    "all",
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [nodeActionView, setNodeActionView] = useState<
    "records" | "parameters" | null
  >(null);
  const [candidateActionDraft, setCandidateActionDraft] = useState<{
    id: string;
    action: "调整" | "排除";
    riskLevel: "高风险" | "中风险" | "低风险";
    threshold: string;
    review: "项目负责人复核" | "质量复核人复核" | "无需额外复核";
    reason: string;
  } | null>(null);
  useEffect(() => {
    if (preparationRequest === 0) return;
    setGraphSource("project");
    setSelectedProjectId(preparationProjectId ?? "huadong");
    setWorkspaceTab("list");
    setDetailOpen(false);
    setNodeActionView(null);
  }, [preparationProjectId, preparationRequest]);
  const [selectedId, setSelectedId] = useState(
    initialSource === "project" && materialityConfirmed
      ? "and1"
      : libraryTagNodes[0].id,
  );
  const [activeKind, setActiveKind] = useState("全部节点");
  const [search, setSearch] = useState("");
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [graphDecisions, setGraphDecisions] = useState<
    Record<string, "调整" | "排除">
  >({});
  const selectedDecisionDetails: Record<string, CandidateDecisionRecord> =
    decisionDetailsByProject[selectedProject.id] ?? {};
  const saveSelectedDecision = (nodeId: string, decision: CandidateDecisionRecord) => {
    setDecisionDetailsByProject((current) => ({
      ...current,
      [selectedProject.id]: {
        ...(current[selectedProject.id] ?? {}),
        [nodeId]: decision,
      },
    }));
    setGraphDecisions((current) => ({ ...current, [nodeId]: decision.action }));
  };
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >(() => combinedNodePositions);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);
  const canvasPanRef = useRef<{
    start: { x: number; y: number };
    pan: { x: number; y: number };
    pointerId: number;
  } | null>(null);
  const allCurrentNodes =
    graphSource === "library" || projectUsesPool
      ? libraryTagNodes
      : projectGraphNodes;
  const selectedNode =
    allCurrentNodes.find((node) => node.id === selectedId) ??
    allCurrentNodes[0];
  const selectedLibraryIndex = Math.max(
    0,
    libraryTagNodes.findIndex((node) => node.id === selectedNode.id),
  );
  const projectKinds = [
    ["全部节点", projectGraphNodes.length, "#64748b"],
    ["项目配置", projectGraphNodes.filter((node) => node.kind === "项目配置").length, "#253b66"],
    ["风险信号", projectGraphNodes.filter((node) => node.kind === "风险信号" || node.kind === "复合风险").length, "#36b9c3"],
    ["内控测试", projectGraphNodes.filter((node) => node.kind === "内控测试").length, "#55c83e"],
    ["审计程序", projectGraphNodes.filter((node) => node.kind === "审计程序").length, "#c5b62f"],
    ["合规检查", projectGraphNodes.filter((node) => node.kind === "合规检查").length, "#8460c7"],
    ["执行结果", projectGraphNodes.filter((node) => node.kind === "执行结果").length, "#52637a"],
  ] as const;
  const libraryKinds = libraryTagGroups.map(
    (group) => [group.kind, group.count, group.color] as const,
  );
  const kinds =
    graphSource === "library" || projectUsesPool
      ? [["全部节点", 173, "#64748b"] as const, ...libraryKinds]
      : projectKinds;
  const nodeLayer = (kind: string) =>
    kind === "风险信号" || kind === "复合风险"
      ? "1"
      : kind === "内控测试"
        ? "2"
        : kind === "审计程序" || kind === "合规检查"
          ? "3"
          : kind === "人工节点" || kind === "执行结果" || kind === "完成阶段"
            ? "4"
            : "0";
  const visibleNodes = allCurrentNodes.filter((node) => {
    const kindMatches = activeKind === "全部节点" || node.kind === activeKind;
    const layerMatches =
      graphSource === "library" ||
      projectUsesPool ||
      activeLayer === "all" ||
      nodeLayer(node.kind) === activeLayer;
    return kindMatches && layerMatches && node.label.includes(search.trim());
  });
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const libraryPositions = Object.fromEntries(
    libraryTagNodes.map((node) => [node.id, { x: node.x, y: node.y }]),
  );
  useEffect(() => {
    if (graphSource !== "project") return;
    setPositions(combinedNodePositions);
    setSelectedId(
      projectStage === "pre_scope" ? libraryTagNodes[0].id : "and1",
    );
    setActiveKind("全部节点");
    setActiveLayer("all");
    setDetailOpen(false);
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [graphSource, projectStage]);
  const selectNode = (node: { id: string; label: string; kind: string }) => {
    setSelectedId(node.id);
    setDetailOpen(true);
    onReference(`${node.kind}｜${node.label}`);
  };
  const resetLayout = () => setPositions(combinedNodePositions);
  const switchGraphSource = (source: "library" | "project") => {
    setGraphSource(source);
    setActiveLayer("all");
    setDetailOpen(false);
    const usePool = source === "library" || projectStage === "pre_scope";
    setSelectedId(usePool ? libraryTagNodes[0].id : "and1");
    setPositions(combinedNodePositions);
  };
  const pointInGraph = (event: React.PointerEvent<SVGGElement>) => {
    const svg = event.currentTarget.ownerSVGElement!;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const canvasPoint = point.matrixTransform(svg.getScreenCTM()!.inverse());
    return {
      x: (canvasPoint.x - pan.x) / scale,
      y: (canvasPoint.y - pan.y) / scale,
    };
  };
  const pointInCanvas = (
    svg: SVGSVGElement,
    clientX: number,
    clientY: number,
  ) => {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(svg.getScreenCTM()!.inverse());
  };
  const zoomAt = (nextScale: number, anchor = { x: 390, y: 285 }) => {
    const clamped = Math.min(2.2, Math.max(0.45, nextScale));
    const ratio = clamped / scale;
    setPan((current) => ({
      x: anchor.x - (anchor.x - current.x) * ratio,
      y: anchor.y - (anchor.y - current.y) * ratio,
    }));
    setScale(clamped);
  };
  const shortNodeLabel = (kind: string) =>
    ({
      项目配置: "项目",
      风险信号: "RS",
      复合风险: "风险",
      内控测试: "CT",
      审计程序: "AP",
      合规检查: "CC",
      人工节点: "CPA",
      执行结果: "证据",
      完成阶段: "结论",
    })[kind] ?? "节点";
  const projectEdgeStyle = (from: string, to: string) => {
    if (from === "scope")
      return {
        color: "#aab5c5",
        width: 1,
        dash: undefined,
        label: "Scope 筛选",
      };
    if (from.startsWith("rs") && to === "and1")
      return {
        color: "#d9901f",
        width: 1.8,
        dash: undefined,
        label: "AND 依赖",
      };
    if (from.startsWith("rs") && to.startsWith("ct"))
      return {
        color: "#7d899a",
        width: 1.4,
        dash: undefined,
        label: "激活 CT",
      };
    if (from === "and1")
      return {
        color: "#dc4e55",
        width: 2.4,
        dash: undefined,
        label: "AND 跨层触发",
      };
    if (from.startsWith("rs") && to.startsWith("ap"))
      return {
        color: "#e4792b",
        width: 1.8,
        dash: undefined,
        label: "跨层激活 AP",
      };
    if (from.startsWith("ct"))
      return {
        color: "#4b8bd8",
        width: 1.5,
        dash: "5 4",
        label: "调整 AP 参数",
      };
    if (to === "human")
      return {
        color: "#596b86",
        width: 1.4,
        dash: undefined,
        label: "提交人工确认",
      };
    if (from === "human")
      return {
        color: "#33445f",
        width: 1.6,
        dash: undefined,
        label: "确认后形成证据",
      };
    return {
      color: "#66758b",
      width: 1.3,
      dash: undefined,
      label: "汇入完成层",
    };
  };
  const nodeCode: Record<string, string> = {
    scope: "PROJECT-SCOPE",
    rs1: "RS-REV-001",
    rs2: "RS-AR-001",
    rs3: "RS-INV-001",
    rs4: "RS-CAS-001",
    and1: "RS-FRAUD-001",
    ct1: "CT-REV-001",
    ct2: "CT-INV-001",
    ap1: "AP-REV-001",
    ap2: "AP-REV-002",
    ap3: "AP-AR-002",
    ap4: "AP-INV-001",
    cc1: "CC-REL-001",
    human: "HUMAN-REVIEW",
    evidence: "AUDIT-EVIDENCE",
    complete: "COMP-001",
  };
  const nodeSurface = (kind: string) =>
    ({
      项目配置: "#eef2f8",
      风险信号: "#dff7f8",
      复合风险: "#ffb34d",
      内控测试: "#bdf7a8",
      审计程序: "#fffde2",
      合规检查: "#f1e9ff",
      人工节点: "#eef1f5",
      执行结果: "#eef1f5",
      完成阶段: "#fffde2",
    })[kind] ?? "#f5f7fa";
  const libraryCode = (node: { id: string; kind: string }) => {
    const number = (node.id.split("-").slice(-1)[0] ?? "1").padStart(3, "0");
    const prefix =
      node.kind === "风险信号"
        ? "RS"
        : node.kind === "内控测试"
          ? "CT"
          : node.kind === "审计程序"
            ? "AP"
            : "CC";
    return `${prefix}-${number}`;
  };
  const libraryNodeWidth = (kind: string) =>
    kind === "审计程序" ? 28 : kind === "合规检查" ? 40 : 46;
  const nodeDescription = (node: { label: string; kind: string }) =>
    node.kind === "风险信号"
      ? `${node.label}达到项目阈值时输出风险等级，并激活相关控制测试或审计程序。`
      : node.kind === "复合风险"
        ? "由两个或多个风险信号同时命中形成，满足 AND 条件后跨层触发专项审计程序。"
        : node.kind === "内控测试"
          ? `${node.label}用于判断相关控制是否有效，结论将调整下游 AP 的样本量、期间或执行深度。`
          : node.kind === "审计程序"
            ? `${node.label}执行实质性核查并形成审计证据；发现异常时可继续触发下游程序。`
            : node.kind === "合规检查"
              ? `${node.label}依据法规与制度判断业务行为是否合规，结论进入合规问题清单。`
              : node.kind === "完成阶段"
                ? "汇总项目执行结果、未调整错报与完成阶段事项，形成最终审计结论。"
                : `${node.label}是当前项目 DAG 中的${node.kind}节点。`;
  const selectedConnections =
    graphSource === "project" && projectStage === "dag"
      ? projectGraphEdges
          .filter(
            ([from, to]) => from === selectedNode.id || to === selectedNode.id,
          )
          .map(([from, to]) => {
            const otherId = from === selectedNode.id ? to : from;
            const other = graphStudioNodes.find((node) => node.id === otherId)!;
            return {
              direction: from === selectedNode.id ? "下游" : "上游",
              node: other,
              style: projectEdgeStyle(from, to),
            };
          })
      : [];
  const relationFocusActive =
    detailOpen && graphSource === "project" && projectStage === "dag";
  const focusedNodeIds = new Set([
    selectedNode.id,
    ...selectedConnections.map((connection) => connection.node.id),
  ]);
  return (
    <section className="audit-graph-workspace -mx-4 -mb-4 mt-0 flex min-h-0 flex-1 overflow-hidden border-t border-[#e2e7ee] bg-white md:-mx-5 md:-mb-5 2xl:-mx-6 2xl:-mb-6">
      <aside className="h-full w-[205px] shrink-0 overflow-y-auto border-r border-[#e2e7ee] bg-[#f8f9fb] custom-scrollbar">
        <div className="border-b border-[#e2e7ee] p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="shrink-0 whitespace-nowrap text-[10px] font-black text-[#30415c]">
              标签图谱
            </h2>
            <button
              type="button"
              onClick={onNewProject}
              className="h-7 shrink-0 whitespace-nowrap rounded-full bg-[#f5f5f5] px-2.5 text-[8px] font-black text-[#30415c] hover:bg-[#eeeeee]"
            >
              ＋ 新建审计项目
            </button>
          </div>
          <p className="mt-1 text-[8px] font-bold text-[#929daf]">
            按类型查看审计节点
          </p>
          <label className="mt-3 flex h-8 items-center gap-2 rounded-md border border-[#dce3ed] bg-white px-2">
            <Search className="h-3 w-3 text-[#8895a8]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索节点"
              className="min-w-0 flex-1 bg-transparent text-[8px] font-bold outline-none"
            />
          </label>
        </div>
        <div className="border-b border-[#e0e5ec] p-2 font-bold text-[#8a96a7]">
          <p className="px-2.5 pb-1 text-[11px] font-black text-[#46566f]">
            全所标签池
          </p>
          <button
            type="button"
            onClick={() => {
              switchGraphSource("library");
              setWorkspaceTab("list");
            }}
            className={`mb-2 w-full px-3 py-2.5 text-left transition-opacity ${graphSource === "library" ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
          >
            <strong className="block text-[12px] leading-tight text-[#3f506a]">
              公共标签资产
            </strong>
            <span className="audit-sidebar-meta mt-1 block leading-relaxed text-[#718097]">
              173 条标签 · 统一维护与版本管理
            </span>
          </button>
          <p className="px-2.5 pb-2 text-[11px] font-black text-[#46566f]">
            审计项目
          </p>
          {auditProjects.map((project) => {
            const stage = projectStageOverrides[project.id] ?? project.stage;
            const downstreamProgress =
              downstreamProgressByProject[project.id] ?? -1;
            const profile = projectProfiles[project.id] ?? {
              candidateNodes: 12,
              dagNodes: 12,
              dagEdges: 14,
            };
            const active =
              graphSource === "project" && selectedProjectId === project.id;
            return (
              <button
                type="button"
                key={project.id}
                onClick={() => {
                  setSelectedProjectId(project.id);
                  switchGraphSource("project");
                }}
                className={`mb-1 w-full px-3 py-3 text-left transition-opacity ${active ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
              >
                <strong className="block text-[12px] leading-tight text-[#3f506a]">
                  {project.name}
                </strong>
                <span className="audit-sidebar-meta mt-1 block leading-relaxed text-[#718097]">
                  {downstreamProgress >= 7
                    ? `已归档 · ${profile.dagNodes} 个节点 · ${profile.dagEdges} 条关系`
                    : downstreamProgress >= 0
                      ? `后续审计中 · 第 ${downstreamProgress + 1} / 7 步`
                      : stage === "pre_scope"
                    ? "Scope 前 · 173 条标签"
                    : stage === "candidate"
                      ? `候选集 · ${profile.candidateNodes + (manualTagsByProject[project.id]?.length ?? 0)} 个节点 · 0 条关系`
                      : `DAG 运行中 · ${profile.dagNodes} 个节点 · ${profile.dagEdges} 条关系`}
                </span>
              </button>
            );
          })}
        </div>
        {graphSource === "project" && projectStage !== "dag" && (
          <div className="border-b border-[#e0e5ec] p-2">
            <p className="px-2.5 pb-2 text-[11px] font-black text-[#3c4d67]">
              项目准备
            </p>
            <button
              type="button"
              onClick={() => setWorkspaceTab("list")}
              className={`mb-1 flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-opacity ${workspaceTab === "list" && projectStage === "pre_scope" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            >
              <span className="min-w-0">
                <strong className="block text-[12px] leading-tight text-[#2f405a]">
                  重要性参数确认
                </strong>
                <small className="mt-1 block text-[10px] font-bold leading-relaxed text-[#66768d]">
                  项目经理确认并锁定
                </small>
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[7px] font-black ${projectStage !== "pre_scope" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
              >
                {projectStage !== "pre_scope" ? "已确认" : "待确认"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("list")}
              className={`flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition-opacity ${workspaceTab === "list" && projectStage === "candidate" ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            >
              <span className="min-w-0">
                <strong className="block text-[12px] leading-tight text-[#2f405a]">
                  候选标注集审核
                </strong>
                <small className="mt-1 block text-[10px] font-bold leading-relaxed text-[#66768d]">
                  默认纳入；支持调整或排除
                </small>
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[7px] font-black ${projectStage === "dag" ? "bg-emerald-50 text-emerald-700" : projectStage === "candidate" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}
              >
                {projectStage === "dag"
                  ? "已冻结"
                  : projectStage === "candidate"
                    ? "待审核"
                    : "未解锁"}
              </span>
            </button>
          </div>
        )}
        <nav className="p-2" aria-label="图谱节点类型">
          {kinds.map(([kind, count, color]) => (
            <button
              type="button"
              key={kind}
              onClick={() => setActiveKind(kind)}
              className={`mb-1 flex w-full items-center justify-between px-2.5 py-2.5 text-left transition-opacity ${activeKind === kind ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
            >
              <span className="flex items-center gap-2 text-[9px] font-black text-[#526178]">
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ background: color }}
                />
                {kind}
              </span>
              <span className="text-[8px] font-bold text-[#9aa4b3]">
                {count}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex h-11 items-center justify-between border-b border-[#e3e8ef] px-3">
          <div className="flex h-full items-center gap-5">
            {(
              [
                ["list", "列表视图"],
                ["graph", "图谱视图"],
                ["execution", "审核工作台"],
              ] as const
            ).map(([tab, label]) => (
              <button
                type="button"
                key={tab}
                onClick={() => setWorkspaceTab(tab)}
                className={`h-full border-b-2 text-[9px] ${workspaceTab === tab ? "border-[#2e65c7] font-black text-[#2e5fb4]" : "border-transparent font-bold text-[#78869b] hover:text-[#2e5fb4]"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[8px] font-bold text-[#8b97a8]">
            {graphSource === "library"
              ? "全所标签池 · 无项目关系"
              : selectedDownstreamProgress >= 7
                ? `${selectedProject.name} · 项目已归档`
                : selectedDownstreamProgress >= 0
                  ? `${selectedProject.name} · 后续审计第 ${selectedDownstreamProgress + 1} / 7 步`
              : projectStage === "pre_scope"
                ? `${selectedProject.name} · Scope 筛选前`
                : projectStage === "candidate"
                  ? `${selectedProject.name} · 候选标注集 · 尚未建立关系`
                  : `${selectedProject.name} · 项目 DAG 运行中`}
          </span>
        </div>
        {workspaceTab === "graph" ? (
          <>
            {graphSource === "project" && projectStage !== "pre_scope" && (
              <div className="flex h-9 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#e7ebf0] bg-[#f8fafc] px-3 custom-scrollbar">
                <span className="mr-1 shrink-0 text-[8px] font-black text-[#7b889b]">
                  按层查看
                </span>
                {(
                  [
                    ["all", "全部"],
                    ["1", "第一层 RS"],
                    ["2", "第二层 CT"],
                    ["3", "第三层 AP/CC"],
                    ["4", "第四层 完成"],
                  ] as const
                ).map(([layer, label]) => (
                  <button
                    type="button"
                    key={layer}
                    onClick={() => setActiveLayer(layer)}
                    className={`h-7 shrink-0 whitespace-nowrap rounded-md border px-2.5 text-[8px] font-black ${activeLayer === layer ? "border-[#9eb2d4] bg-[#eaf0fb] text-[#315ca9]" : "border-[#dfe5ed] bg-white text-[#6d7b90]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
            <div className="graph-toolbar flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[#e7ebf0] bg-[#fbfcfd] px-3 custom-scrollbar">
              <button
                type="button"
                className="h-7 rounded-md border border-[#dfe5ed] bg-white px-2.5 text-[8px] font-black text-[#5e6e85]"
              >
                点选模式
              </button>
              <button
                type="button"
                className="h-7 rounded-md px-2.5 text-[8px] font-bold text-[#738197] hover:bg-white"
              >
                框选模式
              </button>
              <button
                type="button"
                className="h-7 rounded-md px-2.5 text-[8px] font-bold text-[#738197] hover:bg-white"
              >
                筛选关系
              </button>
              <span className="mx-1 h-4 w-px bg-[#dfe4eb]" />
              <button
                type="button"
                onClick={() => zoomAt(scale - 0.1)}
                className="grid h-7 w-7 place-items-center rounded-md text-[12px] font-black text-[#65758c] hover:bg-white"
              >
                −
              </button>
              <span className="w-9 text-center text-[8px] font-black text-[#68778d]">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => zoomAt(scale + 0.1)}
                className="grid h-7 w-7 place-items-center rounded-md text-[12px] font-black text-[#65758c] hover:bg-white"
              >
                ＋
              </button>
              <button
                type="button"
                onClick={() => {
                  setScale(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="h-7 rounded-md px-2.5 text-[8px] font-bold text-[#738197] hover:bg-white"
              >
                适配画布
              </button>
              <button
                type="button"
                onClick={resetLayout}
                className="h-7 rounded-md px-2.5 text-[8px] font-bold text-[#738197] hover:bg-white"
              >
                自动排布
              </button>
              <div className="ml-auto flex shrink-0 items-center gap-2 whitespace-nowrap text-[8px] font-bold text-[#76859a]">
                <CircleDot className="h-3 w-3 text-[#2f9c78]" />
                {graphSource === "library"
                  ? "公共标签资产，未进入具体项目"
                  : projectStage === "pre_scope"
                    ? "待确认重要性参数并执行 Scope 筛选"
                    : projectStage === "candidate"
                      ? "候选标签已选出，冻结后建立关系"
                      : "DAG 已启动，标签关系已建立"}
              </div>
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-[#fcfdfe]">
              <svg
                viewBox="0 0 780 570"
                className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
                role="img"
                aria-label="审计标签关系图谱"
                onWheel={(event) => {
                  event.preventDefault();
                  const anchor = pointInCanvas(
                    event.currentTarget,
                    event.clientX,
                    event.clientY,
                  );
                  zoomAt(scale * (event.deltaY > 0 ? 0.9 : 1.1), anchor);
                }}
                onPointerDown={(event) => {
                  if ((event.target as Element).closest('[role="button"]'))
                    return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  canvasPanRef.current = {
                    start: pointInCanvas(
                      event.currentTarget,
                      event.clientX,
                      event.clientY,
                    ),
                    pan,
                    pointerId: event.pointerId,
                  };
                }}
                onPointerMove={(event) => {
                  const state = canvasPanRef.current;
                  if (!state || state.pointerId !== event.pointerId) return;
                  const point = pointInCanvas(
                    event.currentTarget,
                    event.clientX,
                    event.clientY,
                  );
                  setPan({
                    x: state.pan.x + point.x - state.start.x,
                    y: state.pan.y + point.y - state.start.y,
                  });
                }}
                onPointerUp={(event) => {
                  if (canvasPanRef.current?.pointerId === event.pointerId) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                    canvasPanRef.current = null;
                  }
                }}
              >
                <defs>
                  <marker
                    id="audit-arrow"
                    markerWidth="11"
                    markerHeight="11"
                    refX="9"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M0,0 L0,8 L9,4 z" fill="context-stroke" />
                  </marker>
                </defs>
                <g transform={`translate(${pan.x} ${pan.y}) scale(${scale})`}>
                  {(graphSource === "library" || projectUsesPool) && (
                    <g className="audit-cluster-regions">
                      {[
                        {
                          x: 18,
                          y: 14,
                          w: 350,
                          h: 252,
                          color: "#36b9c3",
                          title: "RS 风险信号 · 36",
                          note: "识别哪里可能有风险｜输出风险等级与触发建议",
                        },
                        {
                          x: 412,
                          y: 14,
                          w: 350,
                          h: 252,
                          color: "#55c83e",
                          title: "CT 内控测试 · 31",
                          note: "判断控制是否有效｜调整审计程序范围与样本量",
                        },
                        {
                          x: 18,
                          y: 282,
                          w: 390,
                          h: 272,
                          color: "#c5b62f",
                          title: "AP 审计程序 · 84",
                          note: "核查财务数据是否存在错报｜形成证据与结论",
                        },
                        {
                          x: 426,
                          y: 282,
                          w: 336,
                          h: 272,
                          color: "#8a63d2",
                          title: "CC 合规检查 · 22",
                          note: "判断业务行为是否合规｜形成合规问题清单",
                        },
                      ].map((region) => (
                        <g key={region.title}>
                          <circle
                            cx={region.x + 18}
                            cy={region.y + 21}
                            r="5"
                            fill={region.color}
                          />
                          <text
                            className="audit-cluster-title"
                            x={region.x + 30}
                            y={region.y + 25}
                            fill="#2f4058"
                            fontWeight="800"
                          >
                            {region.title}
                          </text>
                          <text
                            className="audit-cluster-note"
                            x={region.x + 16}
                            y={region.y + 44}
                            fill="#6f7e92"
                            fontWeight="600"
                          >
                            {region.note}
                          </text>
                        </g>
                      ))}
                    </g>
                  )}
                  {graphSource === "project" &&
                    projectStage === "dag" &&
                    projectGraphEdges.map(([from, to]) => {
                      const a = positions[from];
                      const b = positions[to];
                      if (!visibleIds.has(from) || !visibleIds.has(to))
                        return null;
                      const active = from === selectedId || to === selectedId;
                      const style = projectEdgeStyle(from, to);
                      const dx = b.x - a.x;
                      const dy = b.y - a.y;
                      const targetOffset = Math.min(
                        45 / Math.max(Math.abs(dx), 0.001),
                        20 / Math.max(Math.abs(dy), 0.001),
                      );
                      const endX = b.x - dx * targetOffset;
                      const endY = b.y - dy * targetOffset;
                      return (
                        <g key={`${from}-${to}`}>
                          {relationFocusActive && active && (
                            <line
                              x1={a.x}
                              y1={a.y}
                              x2={endX}
                              y2={endY}
                              stroke="#ffffff"
                              strokeWidth={style.width + 6}
                              strokeOpacity="0.95"
                            />
                          )}
                          <line
                            x1={a.x}
                            y1={a.y}
                            x2={endX}
                            y2={endY}
                            stroke={style.color}
                            strokeWidth={
                              active ? style.width + 0.8 : style.width
                            }
                            strokeDasharray={style.dash}
                            strokeOpacity={
                              relationFocusActive
                                ? active
                                  ? 1
                                  : 0.12
                                : active
                                  ? 1
                                  : 0.72
                            }
                            markerEnd="url(#audit-arrow)"
                          />
                          <text
                            className="audit-edge-label"
                            x={(a.x + b.x) / 2}
                            y={(a.y + b.y) / 2 - 5}
                            textAnchor="middle"
                            fill={active ? "#35455f" : "#68768a"}
                            fontWeight={active ? "800" : "600"}
                            opacity={relationFocusActive && !active ? 0.14 : 1}
                          >
                            {style.label}
                          </text>
                        </g>
                      );
                    })}
                  {visibleNodes.map((node) => (
                    <g
                      key={node.id}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragRef.current = { id: node.id, moved: false };
                      }}
                      onPointerMove={(event) => {
                        if (dragRef.current?.id !== node.id) return;
                        const point = pointInGraph(event);
                        dragRef.current.moved = true;
                        setPositions((current) => ({
                          ...current,
                          [node.id]: {
                            x: Math.max(38, Math.min(742, point.x)),
                            y: Math.max(38, Math.min(525, point.y)),
                          },
                        }));
                      }}
                      onPointerUp={(event) => {
                        event.currentTarget.releasePointerCapture(
                          event.pointerId,
                        );
                        const moved = dragRef.current?.moved;
                        dragRef.current = null;
                        if (!moved) selectNode(node);
                      }}
                      onKeyDown={(event) =>
                        event.key === "Enter" && selectNode(node)
                      }
                      className="cursor-grab outline-none active:cursor-grabbing"
                      style={{
                        opacity:
                          relationFocusActive && !focusedNodeIds.has(node.id)
                            ? 0.2
                            : 1,
                        transition: "opacity 180ms ease-out",
                      }}
                    >
                      <title>
                        {node.kind} · {node.label}
                      </title>
                      {graphSource === "library" || projectUsesPool ? (
                        <>
                          <rect
                            x={
                              positions[node.id].x -
                              libraryNodeWidth(node.kind) / 2
                            }
                            y={positions[node.id].y - 10}
                            width={libraryNodeWidth(node.kind)}
                            height="21"
                            rx="3"
                            fill={nodeSurface(node.kind)}
                            stroke={
                              selectedId === node.id ? "#17243c" : "#4d5663"
                            }
                            strokeWidth={selectedId === node.id ? 1.8 : 1}
                          />
                          <text
                            className="audit-library-code"
                            x={positions[node.id].x}
                            y={positions[node.id].y - 2}
                            textAnchor="middle"
                            fill="#263548"
                            fontWeight="800"
                          >
                            {libraryCode(node)}
                          </text>
                          <text
                            className="audit-library-label"
                            x={positions[node.id].x}
                            y={positions[node.id].y + 7}
                            textAnchor="middle"
                            fill="#263548"
                            fontWeight="700"
                          >
                            {node.label
                              .replace(/\s\d+$/, "")
                              .slice(0, node.kind === "审计程序" ? 2 : 4)}
                          </text>
                        </>
                      ) : (
                        <>
                          {relationFocusActive &&
                            focusedNodeIds.has(node.id) && (
                              <rect
                                x={positions[node.id].x - 50}
                                y={positions[node.id].y - 25}
                                width="100"
                                height="50"
                                rx="9"
                                fill="none"
                                stroke={
                                  selectedId === node.id
                                    ? "#2459c4"
                                    : node.color
                                }
                                strokeWidth={selectedId === node.id ? "6" : "4"}
                                opacity={
                                  selectedId === node.id ? "0.24" : "0.18"
                                }
                              />
                            )}
                          <rect
                            x={positions[node.id].x - 45}
                            y={positions[node.id].y - 20}
                            width="90"
                            height="40"
                            rx="5"
                            fill={nodeSurface(node.kind)}
                            stroke={
                              selectedId === node.id ? "#17243c" : "#4b535f"
                            }
                            strokeWidth={
                              selectedId === node.id
                                ? 3.2
                                : relationFocusActive &&
                                    focusedNodeIds.has(node.id)
                                  ? 2.2
                                  : 1.4
                            }
                          />
                          <text
                            className="audit-node-code"
                            x={positions[node.id].x}
                            y={positions[node.id].y - 4}
                            textAnchor="middle"
                            fill="#233247"
                            fontWeight="800"
                          >
                            {nodeCode[node.id] ?? shortNodeLabel(node.kind)}
                          </text>
                          <text
                            className="audit-node-type"
                            x={positions[node.id].x}
                            y={positions[node.id].y + 11}
                            textAnchor="middle"
                            fill="#182536"
                            fontWeight="800"
                          >
                            {node.label}
                          </text>
                        </>
                      )}
                    </g>
                  ))}
                </g>
              </svg>
              {detailOpen && (
                <aside className="absolute inset-y-0 right-0 z-20 flex w-[270px] flex-col border-l border-[#dce3ed] bg-white shadow-[-6px_0_16px_rgba(40,57,88,.08)]">
                  <header className="flex items-start justify-between border-b border-[#e4e8ef] px-4 py-3">
                    <div>
                      <span className="font-mono text-[8px] font-black text-[#7d899a]">
                        {nodeCode[selectedNode.id] ??
                          selectedNode.id.toUpperCase()}
                      </span>
                      <h3 className="mt-1 text-[13px] font-black text-[#2f405a]">
                        {selectedNode.label}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailOpen(false)}
                      aria-label="关闭节点详情"
                      className="grid h-7 w-7 place-items-center rounded-md text-[#7d899b] hover:bg-[#f1f3f6]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="rounded px-2 py-1 text-[8px] font-black text-white"
                        style={{ background: selectedNode.color }}
                      >
                        {selectedNode.kind}
                      </span>
                      <span className="rounded border border-[#dce3ed] px-2 py-1 text-[8px] font-bold text-[#66758b]">
                        {graphSource === "project"
                          ? `第${nodeLayer(selectedNode.kind)}层`
                          : "全所标签"}
                      </span>
                    </div>
                    {graphSource === "project" && projectStage === "dag" && (
                      <dl className="mt-3 grid grid-cols-2 border-y border-[#e5e9ef] py-3">
                        <div>
                          <dt className="text-[8px] font-bold text-[#7b8799]">
                            负责人
                          </dt>
                          <dd className="mt-1 text-[11px] font-black text-[#35455f]">
                            {nodeAssignments[selectedNode.id] ?? "待分配"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[8px] font-bold text-[#7b8799]">
                            标注状态
                          </dt>
                          <dd className="mt-1 text-[11px] font-black text-[#35455f]">
                            {getNodeAnnotationStatus(
                              graphStudioNodes.findIndex(
                                (node) => node.id === selectedNode.id,
                              ),
                            )}
                          </dd>
                        </div>
                      </dl>
                    )}
                    <p className="mt-3 text-[10px] font-bold leading-[1.7] text-[#607089]">
                      {nodeDescription(selectedNode)}
                    </p>
                    <div className="mt-5">
                      <h4 className="border-b border-[#e7ebf0] pb-2 text-[9px] font-black text-[#586982]">
                        {graphSource === "project"
                          ? `上下游关系 · ${selectedConnections.length}`
                          : "标签状态"}
                      </h4>
                      {graphSource === "project" ? (
                        <div className="mt-2 space-y-2">
                          {selectedConnections.map((connection, index) => (
                            <div
                              key={`${connection.node.id}-${index}`}
                              className="flex items-start gap-2 rounded-md bg-[#f7f9fc] p-2.5"
                            >
                              <i
                                className="mt-1 h-2 w-2 shrink-0 rounded-sm"
                                style={{ background: connection.style.color }}
                              />
                              <div className="min-w-0">
                                <strong className="block text-[9px] font-black text-[#43536c]">
                                  {connection.direction} ·{" "}
                                  {connection.node.label}
                                </strong>
                                <span className="mt-1 block text-[8px] font-bold text-[#8a96a7]">
                                  {connection.style.label}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 rounded-md bg-[#f5f7fa] p-3 text-[9px] font-bold leading-relaxed text-[#6d7b90]">
                          该标签尚未进入具体项目，因此没有上下游关系。创建项目后由
                          Scope 规则筛选并建立 DAG 关系。
                        </div>
                      )}
                    </div>
                    {graphSource === "library" && (
                      <dl className="mt-4 divide-y divide-[#e8ecf1] border-y border-[#e8ecf1] text-[9px]">
                        {[
                          ["当前版本", `v${1 + (selectedLibraryIndex % 3)}.${selectedLibraryIndex % 10}`],
                          ["维护负责人", ["审计方法组", "财务审计组", "内控与合规组"][selectedLibraryIndex % 3]],
                          ["被项目引用", `${2 + ((selectedLibraryIndex * 7) % 43)} 个项目`],
                          ["最近更新", `2026-0${5 + (selectedLibraryIndex % 3)}-${String(8 + (selectedLibraryIndex % 20)).padStart(2, "0")}`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between py-3">
                            <dt className="font-bold text-[#8995a7]">{label}</dt>
                            <dd className="font-black text-[#41516b]">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <div className="mt-5 border-t border-[#e5e9ef] pt-4">
                      <h4 className="text-[9px] font-black text-[#586982]">
                        可执行操作
                      </h4>
                      {graphSource === "library" ? (
                        <div className="mt-2 grid gap-2">
                          <button type="button" onClick={() => onReference(`查看版本历史｜${selectedNode.label}`)} className="h-8 w-full rounded-md border border-[#b9c9e3] bg-white text-[8px] font-black text-[#315ca9] hover:bg-[#f3f6fb]">查看版本历史</button>
                          <button type="button" onClick={() => onReference(`编辑全所标签｜${selectedNode.label}`)} className="h-8 w-full rounded-md bg-[#315ca9] text-[8px] font-black text-white hover:bg-[#264f96]">编辑标签</button>
                        </div>
                      ) : graphSource === "project" &&
                      projectStage === "candidate" ? (
                        <div className="mt-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            {(["调整", "排除"] as const).map((action) => (
                              <button
                                type="button"
                                key={action}
                                onClick={() => {
                                  const saved = selectedDecisionDetails[selectedNode.id];
                                  setCandidateActionDraft({
                                    id: selectedNode.id,
                                    action,
                                    riskLevel: saved?.riskLevel ?? "高风险",
                                    threshold:
                                      saved?.threshold &&
                                      saved.threshold !== "同时命中 2 个风险信号"
                                        ? saved.threshold
                                        : "15 万元",
                                    review: saved?.review ?? "项目负责人复核",
                                    reason: saved?.action === action
                                      ? saved.reason
                                      : action === "调整"
                                        ? "根据项目实际情况调整风险判断参数"
                                        : "与项目范围不相关",
                                  });
                                }}
                                className={`h-8 rounded-md border text-[8px] font-black transition-colors ${candidateActionDraft?.id === selectedNode.id && candidateActionDraft.action === action || selectedDecisionDetails[selectedNode.id]?.action === action ? action === "调整" ? "border-[#315ca9] bg-[#315ca9] text-white" : "border-rose-600 bg-rose-600 text-white" : action === "调整" ? "border-[#b9c9e3] bg-white text-[#315ca9] hover:bg-[#f3f6fb]" : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
                              >
                                {action}
                              </button>
                            ))}
                          </div>

                          {candidateActionDraft?.id === selectedNode.id && (
                            candidateActionDraft.action === "调整" ? (
                              <div className="mt-3 border-y border-[#dfe5ed] bg-[#f8fafc] py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <strong className="text-[10px] font-black text-[#354760]">调整当前项目参数</strong>
                                    <p className="mt-1 text-[8px] font-bold leading-relaxed text-[#66758a]">仅修改当前项目中的节点配置，不影响全所标签定义。</p>
                                  </div>
                                  <button type="button" onClick={() => setCandidateActionDraft(null)} className="text-[8px] font-black text-[#6e7d92]">取消</button>
                                </div>
                                <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">
                                  项目风险等级
                                  <select value={candidateActionDraft.riskLevel} onChange={(event) => setCandidateActionDraft((current) => current ? { ...current, riskLevel: event.target.value as "高风险" | "中风险" | "低风险" } : current)} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]">
                                    <option>高风险</option><option>中风险</option><option>低风险</option>
                                  </select>
                                </label>
                                <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">
                                  触发阈值
                                  <input value={candidateActionDraft.threshold} onChange={(event) => setCandidateActionDraft((current) => current ? { ...current, threshold: event.target.value } : current)} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]" />
                                  <small className="font-bold leading-relaxed text-[#8491a4]">整体重要性 150 万元 × 10% = 15 万元</small>
                                </label>
                                <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">
                                  复核要求
                                  <select value={candidateActionDraft.review} onChange={(event) => setCandidateActionDraft((current) => current ? { ...current, review: event.target.value as "项目负责人复核" | "质量复核人复核" | "无需额外复核" } : current)} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]">
                                    <option>项目负责人复核</option><option>质量复核人复核</option><option>无需额外复核</option>
                                  </select>
                                </label>
                                <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">
                                  调整说明
                                  <textarea value={candidateActionDraft.reason} onChange={(event) => setCandidateActionDraft((current) => current ? { ...current, reason: event.target.value } : current)} rows={3} className="resize-none rounded-md border border-[#ccd6e5] bg-white px-3 py-2 text-[9px] font-bold leading-relaxed outline-none focus:border-[#5f80bc]" />
                                </label>
                                <button
                                  type="button"
                                  disabled={!candidateActionDraft.reason.trim()}
                                  onClick={() => {
                                    saveSelectedDecision(selectedNode.id, {
                                      action: "调整",
                                      riskLevel: candidateActionDraft.riskLevel,
                                      threshold: candidateActionDraft.threshold,
                                      review: candidateActionDraft.review,
                                      reason: candidateActionDraft.reason.trim(),
                                      updatedBy: "符金雨",
                                      updatedAt: formatAuditTimestamp(),
                                    });
                                    setCandidateActionDraft(null);
                                    onReference(`已保存调整｜${selectedNode.label}`);
                                  }}
                                  className="mt-3 h-9 w-full rounded-md bg-[#2459c4] text-[9px] font-black text-white hover:bg-[#194db3] disabled:cursor-not-allowed disabled:bg-[#b9c5d8]"
                                >保存调整</button>
                              </div>
                            ) : (
                              <div className="mt-3 border-y border-rose-100 bg-rose-50/60 py-3">
                                <strong className="text-[10px] font-black text-rose-800">确认排除此节点？</strong>
                                <p className="mt-1 text-[8px] font-bold leading-relaxed text-rose-700">排除后该节点不会进入当前项目 DAG，全所标签定义不会改变。</p>
                                <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#75505a]">
                                  排除原因
                                  <select value={candidateActionDraft.reason} onChange={(event) => setCandidateActionDraft((current) => current ? { ...current, reason: event.target.value } : current)} className="h-9 rounded-md border border-rose-200 bg-white px-3 text-[9px] font-bold outline-none focus:border-rose-400">
                                    <option>与项目范围不相关</option><option>已由其他审计程序覆盖</option><option>不适用于本项目</option><option>其他原因</option>
                                  </select>
                                </label>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button type="button" onClick={() => setCandidateActionDraft(null)} className="h-9 rounded-md border border-[#ccd6e5] bg-white text-[8px] font-black text-[#607089]">取消</button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      saveSelectedDecision(selectedNode.id, {
                                        action: "排除",
                                        reason: candidateActionDraft.reason,
                                        updatedBy: "符金雨",
                                        updatedAt: formatAuditTimestamp(),
                                      });
                                      setCandidateActionDraft(null);
                                      onReference(`已确认排除｜${selectedNode.label}`);
                                    }}
                                    className="h-9 rounded-md bg-rose-600 text-[8px] font-black text-white hover:bg-rose-700"
                                  >确认排除</button>
                                </div>
                              </div>
                            )
                          )}

                          {!candidateActionDraft && selectedDecisionDetails[selectedNode.id] && (
                            <div className="mt-3 border-y border-[#dfe5ed] bg-[#f8fafc] py-3">
                              <div className="flex items-center justify-between gap-2">
                                <span>
                                  <strong className={`text-[9px] font-black ${selectedDecisionDetails[selectedNode.id].action === "排除" ? "text-rose-700" : "text-[#315ca9]"}`}>
                                    {selectedDecisionDetails[selectedNode.id].action === "排除" ? "已排除" : "调整已保存"}
                                  </strong>
                                  <small className="mt-1 block text-[7px] font-bold text-[#66758a]">{selectedDecisionDetails[selectedNode.id].updatedBy} · {selectedDecisionDetails[selectedNode.id].updatedAt}</small>
                                </span>
                                <span className="rounded bg-white px-2 py-1 text-[7px] font-black text-[#66758b]">已写入项目</span>
                              </div>
                              {selectedDecisionDetails[selectedNode.id].action === "调整" && (
                                <dl className="mt-3 grid gap-2 text-[8px]">
                                  <div className="flex justify-between gap-3"><dt className="font-bold text-[#66758a]">风险等级</dt><dd className="font-black text-[#465972]">{selectedDecisionDetails[selectedNode.id].riskLevel}</dd></div>
                                  <div className="flex justify-between gap-3"><dt className="font-bold text-[#66758a]">触发阈值</dt><dd className="text-right font-black text-[#465972]">{selectedDecisionDetails[selectedNode.id].threshold}</dd></div>
                                  <div className="flex justify-between gap-3"><dt className="font-bold text-[#66758a]">复核要求</dt><dd className="font-black text-[#465972]">{selectedDecisionDetails[selectedNode.id].review}</dd></div>
                                </dl>
                              )}
                              <p className="mt-3 text-[8px] font-bold leading-relaxed text-[#65758b]">处理说明：{selectedDecisionDetails[selectedNode.id].reason}</p>
                            </div>
                          )}
                        </div>
                      ) : graphSource === "project" &&
                        projectStage === "dag" ? (
                        <>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setNodeActionView("records")}
                              className="h-8 rounded-md border border-[#cbd6e7] text-[8px] font-black text-[#4a6291] hover:bg-[#f3f6fb]"
                            >
                              查看执行记录
                            </button>
                            <button
                              type="button"
                              onClick={() => setNodeActionView((current) => current === "parameters" ? null : "parameters")}
                              className={`h-8 rounded-md border text-[8px] font-black ${nodeActionView === "parameters" ? "border-[#315ca9] bg-[#315ca9] text-white" : "border-[#cbd6e7] text-[#4a6291] hover:bg-[#f3f6fb]"}`}
                            >
                              调整节点参数
                            </button>
                          </div>
                          {nodeActionView === "parameters" && (
                            <div className="mt-3 border-y border-[#dfe5ed] bg-[#f8fafc] py-3">
                              <div className="flex items-start justify-between gap-2">
                                <div><strong className="text-[10px] font-black text-[#354760]">调整节点参数</strong><p className="mt-1 text-[8px] font-bold leading-relaxed text-[#66758a]">仅修改当前项目的执行参数。</p></div>
                                <button type="button" onClick={() => setNodeActionView(null)} className="text-[8px] font-black text-[#6e7d92]">收起</button>
                              </div>
                              <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">抽样数量<input defaultValue="25" type="number" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]" /></label>
                              <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">异常判断阈值<input defaultValue="15 万元" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none focus:border-[#5f80bc]" /><small className="font-bold leading-relaxed text-[#8491a4]">整体重要性 150 万元 × 10% = 15 万元</small></label>
                              <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">执行期间<select defaultValue="全年，重点检查期末一个月" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-2 text-[8px] font-bold outline-none"><option>全年，重点检查期末一个月</option><option>全年，重点检查期末三个月</option><option>仅检查期末一个月</option></select></label>
                              <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">执行深度<select defaultValue="增强" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none"><option>标准</option><option>增强</option><option>全面</option></select></label>
                              <label className="mt-3 grid gap-1.5 text-[8px] font-black text-[#596b83]">调整理由<textarea rows={3} placeholder="说明调整原因及职业判断依据…" className="resize-none rounded-md border border-[#ccd6e5] bg-white px-3 py-2 text-[9px] font-bold leading-relaxed outline-none focus:border-[#5f80bc]" /></label>
                              <button type="button" onClick={() => { onReference(`已调整节点参数｜${selectedNode.label}`); setNodeActionView(null); }} className="mt-3 h-9 w-full rounded-md bg-[#2459c4] text-[9px] font-black text-white hover:bg-[#194db3]">保存并重新执行</button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenDownstream(selectedProject.id)}
                            className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[#315ca9] text-[9px] font-black text-white hover:bg-[#264f96] focus:outline-none focus:ring-2 focus:ring-[#c8d7f1]"
                          >
                            查看对应错报底稿
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onReference(`加入候选集｜${selectedNode.label}`);
                          }}
                          className="mt-2 h-8 w-full rounded-md bg-[#eef3ff] text-[8px] font-black text-[#3e62aa]"
                        >
                          加入当前项目候选集
                        </button>
                      )}
                    </div>
                  </div>
                </aside>
              )}
              {nodeActionView === "records" && (
                <section className="absolute inset-y-0 right-0 z-30 flex w-[380px] max-w-full flex-col border-l border-[#dce3ed] bg-[#f8fafc] shadow-[-6px_0_16px_rgba(40,57,88,.08)]">
                  <header className="border-b border-[#dfe5ed] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setNodeActionView(null)}
                        className="h-8 rounded-md border border-[#ccd6e5] px-3 text-[9px] font-black text-[#526681] hover:bg-[#f4f6f9]"
                      >
                        返回节点
                      </button>
                      <div>
                        <span className="font-mono text-[8px] font-black text-[#7b8799]">
                          {nodeCode[selectedNode.id] ?? selectedNode.id.toUpperCase()}
                        </span>
                        <h3 className="mt-0.5 text-[14px] font-black text-[#2f405a]">
                          {nodeActionView === "records"
                            ? `执行记录 · ${selectedNode.label}`
                            : `节点参数 · ${selectedNode.label}`}
                        </h3>
                      </div>
                    </div>
                  </header>
                  <div className="min-h-0 flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <div>
                      {nodeActionView === "records" ? (
                        <>
                          <div className="grid grid-cols-3 border-y border-[#dfe5ed] bg-white py-3">
                            {[
                              ["当前状态", "待人工复核"],
                              ["最近执行", "2026-08-10 14:18"],
                              ["本次耗时", "2 分 36 秒"],
                            ].map(([label, value]) => (
                              <div key={label} className="px-4">
                                <span className="text-[8px] font-bold text-[#8390a3]">{label}</span>
                                <strong className="mt-1 block text-[9px] font-black text-[#3b4d67]">{value}</strong>
                              </div>
                            ))}
                          </div>
                          <div className="mt-5">
                            <h4 className="text-[10px] font-black text-[#43536c]">本次执行过程</h4>
                            <div className="mt-2 bg-white">
                              {[
                                ["14:15:42", "读取上游节点", "已读取相关 RS、CT 结论及项目 Scope 参数。", "完成"],
                                ["14:16:08", "执行节点程序", `按当前参数运行“${selectedNode.label}”，完成数据筛选与异常识别。`, "完成"],
                                ["14:17:31", "生成分析结果", "发现执行结果偏离预期，已生成异常明细和判断依据。", "异常"],
                                ["14:18:18", "转人工复核", `事项已分配给 ${nodeAssignments[selectedNode.id] ?? "项目负责人"}，等待确认结论。`, "待处理"],
                              ].map(([time, title, detail, status], index) => (
                                <div key={time} className={`grid grid-cols-[64px_1fr_52px] items-start gap-2 px-3 py-3 ${index ? "border-t border-[#edf0f4]" : ""}`}>
                                  <span className="font-mono text-[9px] font-bold text-[#7d899a]">{time}</span>
                                  <strong className="text-[10px] font-black text-[#3b4d67]">{title}</strong>
                                  <span className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${status === "异常" ? "bg-rose-50 text-rose-700" : status === "待处理" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{status}</span>
                                  <p className="col-start-2 col-end-4 text-[9px] font-bold leading-relaxed text-[#66758b]">{detail}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-5 flex justify-end">
                            <button type="button" onClick={() => onNavigate("execution")} className="h-9 rounded-md bg-[#315ca9] px-4 text-[9px] font-black text-white">
                              前往人工复核
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="border-y border-[#dfe5ed] bg-white px-5 py-4">
                            <h4 className="text-[10px] font-black text-[#3c4d67]">当前执行参数</h4>
                            <p className="mt-1 text-[8px] font-bold text-[#7d899a]">仅调整当前项目中的执行范围，不修改全所标签定义。</p>
                            <div className="mt-4 grid gap-y-4">
                              <label className="grid gap-1.5 text-[9px] font-black text-[#596a82]">
                                抽样数量
                                <input defaultValue="25" type="number" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[10px] font-bold outline-none focus:border-[#6c8cc3]" />
                              </label>
                              <label className="grid gap-1.5 text-[9px] font-black text-[#596a82]">
                                异常判断阈值
                                <input defaultValue="15 万元" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[10px] font-bold outline-none focus:border-[#6c8cc3]" />
                                <small className="font-bold leading-relaxed text-[#8491a4]">整体重要性 150 万元 × 10% = 15 万元</small>
                              </label>
                              <label className="grid gap-1.5 text-[9px] font-black text-[#596a82]">
                                执行期间
                                <select defaultValue="全年，重点检查期末一个月" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none">
                                  <option>全年，重点检查期末一个月</option>
                                  <option>全年，重点检查期末三个月</option>
                                  <option>仅检查期末一个月</option>
                                </select>
                              </label>
                              <label className="grid gap-1.5 text-[9px] font-black text-[#596a82]">
                                执行深度
                                <select defaultValue="增强" className="h-9 rounded-md border border-[#ccd6e5] bg-white px-3 text-[9px] font-bold outline-none">
                                  <option>标准</option><option>增强</option><option>全面</option>
                                </select>
                              </label>
                            </div>
                          </div>
                          <div className="mt-4 border-y border-[#dfe5ed] bg-white px-5 py-4">
                            <h4 className="text-[10px] font-black text-[#3c4d67]">本次参数为什么被调整</h4>
                            <p className="mt-2 text-[9px] font-bold leading-[1.8] text-[#607089]">上游风险信号和控制测试结果提高了该节点的执行强度：样本量由 15 调整为 25，检查重点由全年均匀抽样调整为期末交易。</p>
                            <p className="mt-1 text-[8px] font-bold text-[#7f8b9d]">推导关系：RS 异常 → CT 结果 → 调整当前 AP/CC 的样本量、期间与执行深度</p>
                          </div>
                          <label className="mt-4 grid gap-1.5 text-[9px] font-black text-[#596a82]">
                            人工调整理由（必填）
                            <textarea placeholder="说明调整原因及职业判断依据…" className="h-20 resize-none rounded-md border border-[#ccd6e5] bg-white p-3 text-[9px] font-bold outline-none focus:border-[#6c8cc3]" />
                          </label>
                          <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => setNodeActionView(null)} className="h-9 rounded-md border border-[#ccd6e5] bg-white px-4 text-[9px] font-black text-[#596a82]">取消</button>
                            <button type="button" onClick={() => { onReference(`已调整节点参数｜${selectedNode.label}`); setNodeActionView(null); }} className="h-9 rounded-md bg-[#315ca9] px-4 text-[9px] font-black text-white">保存并重新执行</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </section>
              )}
              <div className="absolute bottom-3 left-3 rounded-md border border-[#e0e5ec] bg-white px-3 py-2 text-[8px] font-bold text-[#68778d] shadow-sm">
                已选：<b className="text-[#365c9f]">{selectedNode.label}</b>
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-3 rounded-md border border-[#e0e5ec] bg-white px-3 py-2 text-[8px] font-bold text-[#78869a] shadow-sm">
                <span>
                  {graphSource === "library" || projectUsesPool
                    ? `展示 ${visibleNodes.length} / 173`
                    : `节点 ${visibleNodes.length}`}
                </span>
                <span>
                  关系{" "}
                  {graphSource === "project" && projectStage === "dag"
                    ? projectGraphEdges.length
                    : 0}
                </span>
              </div>
            </div>
            <div className="flex min-h-[52px] shrink-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#e2e7ee] bg-[#f8fafc] px-3 py-2 text-[8px] font-bold text-[#6d7b90]">
              <span className="font-black text-[#43536c]">节点</span>
              {[
                ["#36b9c3", "RS 风险信号"],
                ["#d95b63", "AND 复合"],
                ["#55c83e", "CT 控制测试"],
                ["#c5b62f", "AP 程序"],
                ["#8b7f1f", "AP 强制"],
                ["#8a63d2", "CC 合规"],
                ["#33445f", "完成阶段"],
              ].map(([color, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <i
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: color }}
                  />
                  {label}
                </span>
              ))}
              <span className="h-4 w-px bg-[#d5dce6]" />
              <span className="font-black text-[#43536c]">关系</span>
              {[
                ["#d9901f", "RS / AND"],
                ["#7d899a", "激活 CT"],
                ["#dc4e55", "跨层触发"],
                ["#4b8bd8", "参数调整"],
                ["#66758b", "汇入完成"],
              ].map(([color, label], index) => (
                <span key={label} className="flex items-center gap-1.5">
                  <i
                    className={`h-px w-6 ${index === 3 ? "border-t border-dashed" : ""}`}
                    style={
                      index === 3
                        ? { borderColor: color }
                        : { background: color }
                    }
                  />
                  {label}
                </span>
              ))}
            </div>
          </>
        ) : workspaceTab === "list" && graphSource === "library" ? (
          <LibraryTagListPanel
            nodes={libraryTagNodes}
            onReference={onReference}
          />
        ) : (
          <GraphWorkspacePanel
            tab={workspaceTab}
            candidateNodes={projectGraphNodes}
            onAddManualTags={(ids) =>
              setManualTagsByProject((current) => ({
                ...current,
                [selectedProject.id]: Array.from(
                  new Set([...(current[selectedProject.id] ?? []), ...ids]),
                ),
              }))
            }
            decisionDetails={selectedDecisionDetails}
            onSaveDecision={saveSelectedDecision}
            materialityConfirmed={projectStage !== "pre_scope"}
            projectGraphReady={projectStage === "dag"}
            decisions={{
              ...Object.fromEntries(
                Object.entries(selectedDecisionDetails).map(([id, detail]) => [id, detail.action]),
              ),
              ...graphDecisions,
            }}
            onDecision={(id, decision) =>
              setGraphDecisions((current) => ({ ...current, [id]: decision }))
            }
            onConfirmMateriality={() => {
              setProjectStageOverrides((current) => ({
                ...current,
                [selectedProject.id]: "candidate",
              }));
              onConfirmMateriality();
            }}
            onStartDag={() => {
              setProjectStageOverrides((current) => ({
                ...current,
                [selectedProject.id]: "dag",
              }));
              onStartDag();
              setWorkspaceTab("graph");
              setGraphSource("project");
            }}
            onViewGraph={(nodeId) => {
              if (nodeId) {
                setSelectedId(nodeId);
                setDetailOpen(true);
              }
              setWorkspaceTab("graph");
            }}
            onReference={onReference}
            nodeAssignments={nodeAssignments}
            setNodeAssignments={setNodeAssignments}
            taskDecisions={selectedTaskDecisions}
            setTaskDecisions={setSelectedTaskDecisions}
            materialRequests={selectedMaterialRequests}
            setMaterialRequests={setSelectedMaterialRequests}
            projectId={selectedProject.id}
            onOpenDownstream={onOpenDownstream}
            onHandoffDownstream={onHandoffDownstream}
            downstreamProgressByProject={downstreamProgressByProject}
          />
        )}
      </div>
    </section>
  );
}

function AgentDock({
  open,
  onToggle,
  panelWidth,
  onWidthChange,
  reference,
  onClearReference,
  agent,
  onAgentChange,
  onNewRule,
  onNewProject,
}: {
  open: boolean;
  onToggle: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
  reference: string;
  onClearReference: () => void;
  agent: string;
  onAgentChange: (agent: string) => void;
  onNewRule: () => void;
  onNewProject: () => void;
}) {
  const [historyCollapsed, setHistoryCollapsed] = useState(true);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { role: "user", text: "解释当前选中的“虚增收入”节点为什么被推荐。" },
    {
      role: "agent",
      text: "该节点由“收入异常”与“账龄恶化”共同命中形成。两条信号同时出现时，虚增收入风险显著上升。建议保留，并由 CPA 确认是否启动收入专项程序。",
    },
  ]);
  const sendMessage = () => {
    const value = message.trim();
    if (!value) return;
    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: reference ? `引用「${reference}」：${value}` : value,
      },
      {
        role: "agent",
        text: "已结合当前页面与引用内容进行分析。该请求将作为建议保留，涉及方案冻结的操作仍需 CPA 确认。",
      },
    ]);
    setMessage("");
    onClearReference();
  };
  if (!open) return null;
  const toggleHistory = () => {
    setHistoryCollapsed((current) => {
      const next = !current;
      if (!next && panelWidth < 520) onWidthChange(520);
      return next;
    });
  };
  const startResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = panelWidth;
    const move = (moveEvent: PointerEvent) =>
      onWidthChange(
        Math.min(
          680,
          Math.max(
            historyCollapsed ? 300 : 480,
            startWidth + startX - moveEvent.clientX,
          ),
        ),
      );
    const stop = () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", stop);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", stop);
  };
  return (
    <aside
      style={{ width: panelWidth }}
      className="fixed bottom-0 right-0 top-[54px] z-[60] flex border-l border-[#dce3ed] bg-white text-[#40506a] shadow-[-8px_0_20px_rgba(38,58,92,.10)]"
    >
      <button
        type="button"
        onPointerDown={startResize}
        aria-label="左右拖动调整 Agent 面板宽度"
        className="group absolute inset-y-0 -left-1.5 z-20 w-3 cursor-col-resize"
      >
        <span className="absolute left-1/2 top-1/2 h-16 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#515965] opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      <section
        className={`flex shrink-0 flex-col border-r border-[#e1e6ee] bg-[#f7f9fc] transition-[width] duration-200 ${historyCollapsed ? "w-10" : "w-[180px]"}`}
      >
        <header
          className={`flex h-11 items-center border-b border-[#e1e6ee] ${historyCollapsed ? "justify-center" : "justify-between px-3"}`}
        >
          {!historyCollapsed && (
            <h2 className="text-[10px] font-black text-[#33445f]">全部对话</h2>
          )}
          <button
            type="button"
            onClick={toggleHistory}
            aria-label={historyCollapsed ? "展开对话列表" : "折叠对话列表"}
            className="grid h-7 w-7 place-items-center rounded bg-[#eaf0fb] text-[#4268b0] hover:bg-[#dfe8f8]"
          >
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${historyCollapsed ? "rotate-180" : ""}`}
            />
          </button>
        </header>
        {!historyCollapsed && (
          <>
            <div className="p-2">
              <label className="flex h-8 items-center gap-2 rounded-md border border-[#e0e5ed] bg-white px-2">
                <Search className="h-3 w-3 text-[#8a96a8]" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-[8px] font-bold text-[#4e5e76] outline-none"
                  placeholder="搜索会话…"
                />
              </label>
              <button
                type="button"
                className="mt-2 flex h-8 w-full items-center justify-between rounded-md border border-[#dce3ed] bg-white px-2 text-[8px] font-bold text-[#68778e]"
              >
                <span>按项目浏览</span>
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2 custom-scrollbar">
              {[
                ["分析当前知识图谱", "刚刚"],
                ["制造业 Scope 匹配", "10分钟前"],
                ["候选标签调整建议", "昨天"],
                ["金利集团执行复核", "昨天"],
                ["知识回流审批", "周一"],
              ].map(([title, time], index) => (
                <button
                  type="button"
                  key={title}
                  className={`mb-1 w-full rounded-md px-2 py-2.5 text-left ${index === 0 ? "bg-[#eaf0fb]" : "hover:bg-white"}`}
                >
                  <strong className="block truncate text-[8px] font-black text-[#40516c]">
                    {title}
                  </strong>
                  <small className="mt-1 block text-[7px] font-bold text-[#8b97a8]">
                    {time}
                  </small>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="m-2 flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#d8e0eb] bg-white text-[8px] font-black text-[#536b99]"
            >
              <Plus className="h-3 w-3" />
              新建对话
            </button>
          </>
        )}
      </section>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-[#e1e6ee] bg-white px-3">
          <div className="flex h-full items-center gap-4">
            <button
              type="button"
              className="h-full border-b-2 border-[#4268b0] text-[10px] font-black text-[#2f405c]"
            >
              对话
            </button>
            <button
              type="button"
              className="h-full text-[10px] font-bold text-[#8b97a8]"
            >
              运行记录
            </button>
          </div>
          <button
            type="button"
            aria-label="新建对话"
            className="grid h-7 w-7 place-items-center rounded text-[#7d899b] hover:bg-[#f0f3f8] hover:text-[#315ca9]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </header>
        <div className="shrink-0 border-b border-[#e6eaf0] bg-[#fbfcfd] p-3">
          <label className="block text-[8px] font-black text-[#8793a6]">
            当前 Agent
          </label>
          <select
            value={agent}
            onChange={(event) => onAgentChange(event.target.value)}
            className="mt-2 h-8 w-full rounded-md border border-[#dce3ed] bg-white px-2 text-[9px] font-black text-[#40516b] outline-none"
          >
            <option>图谱检索 Agent</option>
            <option>Scope 匹配 Agent</option>
            <option>审计方案 Agent</option>
            <option>执行协调 Agent</option>
            <option>证据资料 Agent</option>
            <option>质量复核 Agent</option>
            <option>知识回流 Agent</option>
          </select>
          <div className="mt-2 flex items-center gap-1.5 text-[7px] font-bold text-[#7f8c9f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#42b982]" />
            已关联当前项目与页面上下文
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3 py-4 custom-scrollbar">
          <div className="mb-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
            >
              <span className="text-[9px] font-black text-[#596a82]">
                当前任务
              </span>
              <ChevronRight className="h-3 w-3 rotate-90 text-[#8c98a9]" />
            </button>
            <div className="mt-2 rounded-md bg-[#f2f5f9] px-3 py-2.5">
              <strong className="block text-[9px] font-black text-[#3c4d67]">
                分析当前知识图谱
              </strong>
              <p className="mt-1 text-[8px] font-bold leading-relaxed text-[#8591a4]">
                华东智造有限公司2026年度审计
              </p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onNewRule}
              className="flex h-8 items-center gap-1 rounded-full bg-[#f5f7fa] px-3 text-[9px] font-bold text-[#526078] hover:bg-[#edf1f6] focus:outline-none focus:ring-2 focus:ring-[#d7e1f2]"
            >
              新建标注
              <ChevronRight className="h-3 w-3 text-[#9aa5b5]" />
            </button>
            <button
              type="button"
              onClick={onNewProject}
              className="flex h-8 items-center gap-1 rounded-full bg-[#f5f7fa] px-3 text-[9px] font-bold text-[#526078] hover:bg-[#edf1f6] focus:outline-none focus:ring-2 focus:ring-[#d7e1f2]"
            >
              新建审计项目
              <ChevronRight className="h-3 w-3 text-[#9aa5b5]" />
            </button>
          </div>
          <div className="space-y-4">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={
                  item.role === "user" ? "ml-6 rounded-lg bg-[#edf2fa] p-3" : ""
                }
              >
                {item.role === "agent" && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#4168b3] text-white">
                      <Bot className="h-3 w-3" />
                    </span>
                    <span className="text-[8px] font-black text-[#52637d]">
                      {agent}
                    </span>
                  </div>
                )}
                <p
                  className={`text-[9px] font-bold leading-[1.7] ${item.role === "user" ? "text-[#40516b]" : "text-[#596982]"}`}
                >
                  {item.text}
                </p>
                {item.role === "agent" && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="text-[7px] font-black text-[#4268b0]"
                    >
                      查看关联路径
                    </button>
                    <button
                      type="button"
                      className="text-[7px] font-black text-[#4268b0]"
                    >
                      加入候选审核
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#e1e6ee] bg-[#fafbfc] p-3">
          {reference && (
            <div className="mb-2 flex items-center gap-2 rounded-md border border-[#cddbf2] bg-[#eef4ff] px-2.5 py-2 text-[8px] font-black text-[#365c9f]">
              <span className="min-w-0 flex-1 truncate">引用：{reference}</span>
              <button
                type="button"
                onClick={onClearReference}
                aria-label="移除引用"
                className="grid h-5 w-5 place-items-center rounded hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="rounded-xl border border-[#d6deea] bg-white p-2.5 focus-within:border-[#8098c5] focus-within:ring-2 focus-within:ring-[#e9effa]">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              className="h-20 w-full resize-none bg-transparent text-[10px] font-bold leading-relaxed text-[#40516b] outline-none placeholder:text-[#9aa5b5]"
              placeholder={
                reference ? "针对引用内容提问…" : "询问当前项目、标签或图谱…"
              }
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8390a3]">
                <Plus className="h-3.5 w-3.5" />
                <span className="text-[7px] font-bold">当前页面</span>
                <span className="text-[7px] font-bold">项目数据</span>
              </div>
              <button
                type="button"
                onClick={sendMessage}
                aria-label="发送"
                className="grid h-7 w-7 place-items-center rounded-full bg-[#315ca9] text-white hover:bg-[#264f96]"
              >
                <ArrowRight className="h-3.5 w-3.5 -rotate-90" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[7px] font-bold text-[#8b97a8]">
            <span>Enter 发送 · Shift+Enter 换行</span>
            <span>CPA supervised</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DownstreamAuditWorkflow() {
  const [activePage, setActivePage] = useState<
    "overview" | "misstatements" | "compliance" | "workpapers" | "workpaperDetail" | "tb" | "completion"
  >("misstatements");
  const [selectedCompliance, setSelectedCompliance] = useState<number | null>(null);
  const [selectedWorkpaper, setSelectedWorkpaper] = useState(0);
  const [findingSearch, setFindingSearch] = useState("");
  const [downstreamNavSearch, setDownstreamNavSearch] = useState("");
  const [workflowView, setWorkflowView] = useState<"graph" | "execution">("execution");
  const [workflowScale, setWorkflowScale] = useState(.75);
  const [selectedWorkflowNode, setSelectedWorkflowNode] = useState("");
  const [downstreamProgress, setDownstreamProgress] = useState(0);
  const findingType = activePage === "compliance" ? "compliance" : "misstatement";
  const pages = [
    ["overview", "流程总览"],
    ["misstatements", "错报汇总"],
    ["compliance", "合规问题"],
    ["workpapers", "底稿"],
    ["tb", "TB 与调整"],
    ["completion", "完成程序"],
  ] as const;
  const misstatements = [
    ["ME-2026-001", "收入跨期确认", "AP-REV-001", "营业收入", "86.0 万", "未调整", "高"],
    ["ME-2026-002", "应收账款减值不足", "AP-AR-002", "应收账款", "48.2 万", "待确认", "中"],
    ["ME-2026-003", "存货盘亏未入账", "AP-INV-001", "存货", "18.6 万", "已调整", "中"],
    ["ME-2026-004", "固定资产折旧期间错误", "AP-FA-001", "固定资产", "12.4 万", "已调整", "低"],
  ];
  const complianceIssues = [
    ["CI-2026-001", "新增关联方未纳入清单", "CC-REL-001", "关联方披露", "重大", "待管理层确认"],
    ["CI-2026-002", "大额资金支付审批滞后", "CC-FND-002", "资金管理制度", "一般", "整改中"],
    ["CI-2026-003", "部分采购合同授权不完整", "CC-PUR-001", "合同授权制度", "一般", "已反馈"],
  ];
  const workpapers = [
    ["AP-AR-001", "应收账款函证程序", "张三", "2026-12-15", "李敏", "2026-12-18", "已复核"],
    ["AP-AR-002", "应收账款分析程序", "张三", "2026-12-15", "李敏", "2026-12-18", "已复核"],
    ["AP-AR-003", "坏账准备计提测试", "张三", "2026-12-16", "李敏", "2026-12-19", "待复核"],
    ["AP-AR-004", "应收账款账龄测试", "王晨", "2026-12-16", "赵宁", "2026-12-19", "编制中"],
    ["AP-AR-005", "应收账款期后回款", "王晨", "2026-12-17", "—", "—", "编制中"],
  ];
  const completionItems = [
    ["PC-001", "期后事项复核", "陈华", "李敏", "已完成", "无重大期后事项"],
    ["PC-002", "持续经营评估", "王晨", "赵宁", "已完成", "不存在重大不确定性"],
    ["PC-003", "关联方最终汇总", "张三", "李敏", "待处理", "1项合规问题未关闭"],
    ["PC-004", "管理层声明书", "陈华", "赵宁", "待执行", "等待管理层签署"],
    ["PC-005", "未调整错报总体评价", "陈华", "赵宁", "阻塞", "ME-2026-001尚未处置"],
    ["PC-006", "审计意见匹配检查", "李敏", "赵宁", "未开始", "前置程序未完成"],
    ["PC-007", "最终分析程序", "王晨", "李敏", "待执行", "等待调整后财务报表"],
    ["PC-008", "诉讼与或有事项检查", "张三", "赵宁", "进行中", "律师函尚有1项待回函"],
    ["PC-009", "会计估计与重大判断复核", "陈华", "李敏", "待复核", "减值模型等待项目经理复核"],
    ["PC-010", "舞弊风险最终评价", "陈华", "赵宁", "待执行", "需结合未调整错报完成评价"],
    ["PC-011", "独立性与伦理合规确认", "项目组", "赵宁", "已完成", "未发现独立性冲突"],
    ["PC-012", "与治理层沟通", "陈华", "赵宁", "未开始", "等待重大事项清单定稿"],
  ];
  const workflowNodes = [
    { id: "findings", x: 20, y: 170, code: "AP / CC", title: "执行发现", meta: "12 项异常", status: "7 待复核", tone: "#36a7b4", page: "overview" as const },
    { id: "evidence", x: 185, y: 170, code: "EV", title: "证据充分性", meta: "补充程序与索引", status: "3 项待补证", tone: "#45a786", page: "workpapers" as const },
    { id: "misstatements", x: 350, y: 65, code: "ME", title: "错报处置", meta: "4 项 · 165.2 万", status: "1 项未调整", tone: "#d05b68", page: "misstatements" as const },
    { id: "compliance", x: 350, y: 275, code: "CI / IC", title: "合规与内控缺陷", meta: "3 项问题", status: "1 项重大", tone: "#9a6bc5", page: "compliance" as const },
    { id: "workpapers", x: 515, y: 170, code: "WP", title: "底稿复核闭环", meta: "18 / 23 已完成", status: "2 份待复核", tone: "#4d79bd", page: "workpapers" as const },
    { id: "tb", x: 680, y: 65, code: "TB", title: "TB 与调整", meta: "3 笔已确认", status: "1 笔待确认", tone: "#c28a30", page: "tb" as const },
    { id: "statements", x: 680, y: 275, code: "FS", title: "报表最终核对", meta: "TB、报表与附注", status: "等待调整完成", tone: "#b99032", page: "tb" as const },
    { id: "completion", x: 845, y: 170, code: "PC", title: "完成程序", meta: "3 / 12 已完成", status: "2 项阻塞", tone: "#52647e", page: "completion" as const },
    { id: "quality", x: 1010, y: 65, code: "QR", title: "项目质量复核", meta: "经理／合伙人／EQR", status: "尚未开始", tone: "#596b86", page: "completion" as const },
    { id: "report", x: 1010, y: 275, code: "OUT", title: "报告审批签发", meta: "意见、审批与盖章", status: "尚未解锁", tone: "#718097", page: "completion" as const },
    { id: "archive", x: 1175, y: 170, code: "ARC", title: "归档与知识回流", meta: "归档锁定与留痕", status: "尚未解锁", tone: "#82908f", page: "completion" as const },
  ];
  const workflowEdges = [
    ["findings", "evidence"], ["evidence", "misstatements"], ["evidence", "compliance"],
    ["misstatements", "workpapers"], ["compliance", "workpapers"],
    ["workpapers", "tb"], ["workpapers", "statements"], ["tb", "statements"],
    ["statements", "completion"], ["completion", "quality"],
    ["completion", "report"], ["quality", "report"], ["report", "archive"],
  ];
  const downstreamStages = [
    { title: "错报汇总审核", action: "确认错报汇总审核", page: "misstatements" as const },
    { title: "合规问题审核", action: "确认合规问题审核", page: "compliance" as const },
    { title: "证据与底稿复核", action: "完成底稿复核", page: "workpapers" as const },
    { title: "调整及报表锁定", action: "确认调整并锁定报表", page: "tb" as const },
    { title: "完成程序", action: "完成全部程序", page: "completion" as const },
    { title: "项目质量复核", action: "提交并通过质量复核", page: "completion" as const },
    { title: "报告审批签发", action: "批准并签发报告", page: "completion" as const },
    { title: "项目归档", action: "完成项目归档", page: "completion" as const },
  ];
  const workflowNodeStage: Record<string, number> = {
    findings: 0, misstatements: 0, compliance: 1, evidence: 2,
    workpapers: 2, tb: 3, statements: 3, completion: 4,
    quality: 5, report: 6, archive: 7,
  };
  const getWorkflowNodeStatus = (node: (typeof workflowNodes)[number]) => {
    const stage = workflowNodeStage[node.id] ?? 0;
    if (downstreamProgress > stage) return "已完成";
    if (downstreamProgress === stage) return "进行中";
    return "未解锁";
  };
  const advanceDownstream = () => {
    if (downstreamProgress >= downstreamStages.length) return;
    const nextProgress = downstreamProgress + 1;
    setDownstreamProgress(nextProgress);
    if (nextProgress < downstreamStages.length) {
      setActivePage(downstreamStages[nextProgress].page);
    }
  };
  const activeWorkflowNode = workflowNodes.find((node) => node.id === selectedWorkflowNode) ?? workflowNodes[0];
  return (
    <section className="audit-graph-workspace -mx-4 -mb-4 mt-0 flex min-h-0 flex-1 overflow-hidden border-t border-[#e2e7ee] bg-white md:-mx-5 md:-mb-5 2xl:-mx-6 2xl:-mb-6">
        <aside className="h-full w-[205px] shrink-0 overflow-y-auto border-r border-[#e2e7ee] bg-[#f8f9fb] custom-scrollbar">
          <div className="border-b border-[#e2e7ee] p-3">
            <h2 className="text-[15px] font-black leading-tight text-[#30415c]">后续审计流程</h2>
            <label className="mt-3 flex h-8 items-center gap-2 rounded-md border border-[#dce3ed] bg-white px-2">
              <Search className="h-3 w-3 text-[#8895a8]" />
              <input value={downstreamNavSearch} onChange={(event) => setDownstreamNavSearch(event.target.value)} placeholder="搜索节点" className="min-w-0 flex-1 bg-transparent text-[8px] font-bold outline-none" />
            </label>
          </div>
          <div className="border-b border-[#e0e5ec] p-2 font-bold text-[#8a96a7]">
            <p className="px-2.5 pb-2 text-[11px] font-black text-[#46566f]">审计项目</p>
            {[
              ["华东智造 · 2026 年审", downstreamProgress >= downstreamStages.length ? "已归档 · 11 个节点 · 13 条关系" : `${downstreamStages[Math.min(downstreamProgress, downstreamStages.length - 1)].title} · 11 个节点 · 13 条关系`, true],
              ["金利集团 · 专项审计", "完成程序 · 6 个节点 · 7 条关系", false],
              ["新城建设 · 2026 年审", "底稿复核中 · 5 个节点 · 6 条关系", false],
            ].map(([name, meta, active]) => (
              <button type="button" key={String(name)} onClick={() => { setActivePage("misstatements"); setWorkflowView("execution"); }} className={`mb-1 w-full px-3 py-3 text-left transition-opacity ${active ? "opacity-100" : "opacity-55 hover:opacity-100"}`}>
                <strong className="block text-[12px] leading-tight text-[#3f506a]">{name}</strong>
                <span className="audit-sidebar-meta mt-1 block leading-relaxed text-[#718097]">{meta}</span>
              </button>
            ))}
          </div>
          <div className="border-b border-[#e0e5ec] p-2">
            <p className="px-2.5 pb-2 text-[11px] font-black text-[#3c4d67]">后续准备</p>
            {[
              ["证据与底稿完整性校验", "检查底稿索引及附件"],
            ].map(([title, note]) => (
              <div key={title} className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left">
                <span className="min-w-0"><strong className="block text-[11px] leading-tight text-[#2f405a]">{title}</strong><small className="mt-1 block text-[9px] font-bold leading-relaxed text-[#66768d]">{note}</small></span>
                <span className="shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[7px] font-black text-emerald-700">已完成</span>
              </div>
            ))}
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-[#e3e8ef] px-3">
            <div className="flex h-full items-center gap-5">
              {pages.filter(([id]) => id !== "overview").map(([id, label]) => (
                <button key={id} type="button" onClick={() => { setActivePage(id); setWorkflowView("execution"); }} className={`h-full border-b-2 text-[10px] ${activePage === id && workflowView === "execution" ? "border-[#2e65c7] font-black text-[#2e5fb4]" : "border-transparent font-bold text-[#78869b] hover:text-[#2e5fb4]"}`}>{label}</button>
              ))}
            </div>
            <span className="text-[9px] font-bold text-[#8b97a8]">{downstreamProgress >= downstreamStages.length ? "项目已归档" : downstreamStages[downstreamProgress].title}</span>
          </div>
          <main className={`relative min-h-0 min-w-0 flex-1 bg-[#f8fafc] ${workflowView === "graph" ? "overflow-hidden" : "overflow-y-auto p-5 custom-scrollbar"}`}>

      {workflowView === "execution" && downstreamProgress >= 2 && (
        <section className="mb-4 border border-[#dce3ed] bg-white px-4 py-3" aria-label="流程推进控制">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`grid h-5 w-5 place-items-center rounded-full text-[9px] font-black text-white ${downstreamProgress >= downstreamStages.length ? "bg-emerald-600" : "bg-[#315ca9]"}`}>{downstreamProgress >= downstreamStages.length ? "✓" : downstreamProgress + 1}</span>
                <strong className="text-[11px] font-black text-[#35455f]">{downstreamProgress >= downstreamStages.length ? "后续审计流程已完成" : `当前步骤：${downstreamStages[downstreamProgress].title}`}</strong>
              </div>
              <p className="mt-1 pl-7 text-[9px] font-bold text-[#7d899b]">{downstreamProgress >= downstreamStages.length ? "报告已签发，项目已归档并完成知识回流。" : `完成当前页面的处理后，点击“${downstreamStages[downstreamProgress].action}”推进流程。`}</p>
            </div>
            {downstreamProgress < downstreamStages.length && <button type="button" onClick={advanceDownstream} className="h-9 shrink-0 rounded-md bg-[#315ca9] px-4 text-[9px] font-black text-white hover:bg-[#264f96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315ca9] focus-visible:ring-offset-2">{downstreamStages[downstreamProgress].action}</button>}
          </div>
          <div className="mt-3 flex items-center gap-1" aria-label={`流程进度 ${downstreamProgress}/${downstreamStages.length}`}>
            {downstreamStages.map((stage, index) => <button type="button" key={stage.title} disabled={index > downstreamProgress} onClick={() => { setActivePage(stage.page); setWorkflowView("execution"); }} title={stage.title} className={`h-1.5 flex-1 rounded-full ${index < downstreamProgress ? "bg-emerald-500" : index === downstreamProgress ? "bg-[#315ca9]" : "bg-[#dfe5ed]"}`} />)}
          </div>
        </section>
      )}

      {workflowView === "graph" && (
        <section className="relative h-full min-h-[560px] overflow-hidden bg-[#f8fafc]" aria-label="后续审计流程图谱">
          <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md border border-[#dbe2ec] bg-white p-1 shadow-sm">
            <button type="button" className="h-7 rounded bg-[#eaf0fb] px-3 text-[9px] font-black text-[#315ca9]">点选模式</button>
            <button type="button" className="h-7 rounded px-3 text-[9px] font-bold text-[#718097] hover:bg-[#f3f5f8]">筛选关系</button>
          </div>
          <div className="absolute right-3 top-3 z-10 flex items-center rounded-md border border-[#dbe2ec] bg-white p-1 shadow-sm">
            <button type="button" aria-label="缩小流程图" onClick={() => setWorkflowScale((value) => Math.max(.5, value - .1))} className="grid h-7 w-7 place-items-center text-sm font-black text-[#607089]">−</button>
            <span className="w-12 text-center text-[8px] font-black text-[#607089]">{Math.round(workflowScale * 100)}%</span>
            <button type="button" aria-label="放大流程图" onClick={() => setWorkflowScale((value) => Math.min(1.25, value + .1))} className="grid h-7 w-7 place-items-center text-sm font-black text-[#607089]">＋</button>
            <button type="button" onClick={() => setWorkflowScale(.75)} className="h-7 border-l border-[#e1e6ed] px-3 text-[8px] font-black text-[#49649a]">适配画布</button>
          </div>
          <div className={`absolute inset-y-0 left-0 transition-[right] duration-200 ${selectedWorkflowNode ? "right-[286px]" : "right-0"}`}>
            <div className="absolute left-1/2 top-1/2 h-[430px] w-[1345px] origin-center -translate-x-1/2 -translate-y-1/2 transition-transform duration-200" style={{ transform: `translate(-50%, -50%) scale(${workflowScale})` }}>
              <svg viewBox="0 0 1345 430" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                <defs><marker id="downstream-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#9aa8bb" /></marker></defs>
                {workflowEdges.map(([from, to]) => {
                  const source = workflowNodes.find((node) => node.id === from)!;
                  const target = workflowNodes.find((node) => node.id === to)!;
                  return <path key={`${from}-${to}`} d={`M${source.x + 150} ${source.y + 42} C${source.x + 190} ${source.y + 42}, ${target.x - 40} ${target.y + 42}, ${target.x} ${target.y + 42}`} fill="none" stroke="#aab6c7" strokeWidth="1.5" markerEnd="url(#downstream-arrow)" />;
                })}
              </svg>
              {workflowNodes.map((node) => (
                <button key={node.id} type="button" onClick={() => setSelectedWorkflowNode(node.id)} onDoubleClick={() => { if ((workflowNodeStage[node.id] ?? 0) <= downstreamProgress) { setActivePage(node.page); setWorkflowView("execution"); } }} className={`absolute z-10 w-[150px] rounded-lg bg-white p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315ca9] ${selectedWorkflowNode === node.id ? "outline outline-2 outline-[#315ca9]" : "outline outline-1 outline-[#dce3ed] hover:bg-[#f7faff]"} ${(workflowNodeStage[node.id] ?? 0) > downstreamProgress ? "opacity-45" : "opacity-100"}`} style={{ left: node.x, top: node.y }}>
                  <span className="flex items-center justify-between"><code className="text-[8px] font-black" style={{ color: node.tone }}>{node.code}</code><i className="h-2 w-2 rounded-full" style={{ background: node.tone }} /></span>
                  <strong className="mt-2 block text-[12px] font-black text-[#35455f]">{node.title}</strong>
                  <small className="mt-1 block text-[8px] font-bold text-[#7c899c]">{node.meta}</small>
                  <span className={`mt-2 block border-t border-[#edf0f4] pt-2 text-[8px] font-black ${getWorkflowNodeStatus(node) === "已完成" ? "text-emerald-700" : getWorkflowNodeStatus(node) === "进行中" ? "text-[#315ca9]" : "text-[#9aa5b5]"}`}>{getWorkflowNodeStatus(node)}</span>
                </button>
              ))}
            </div>
          </div>
          {selectedWorkflowNode && <aside className="absolute inset-y-0 right-0 z-20 w-[270px] border-l border-[#dce3ed] bg-white p-5">
            <div className="flex items-start justify-between"><div><code className="text-[9px] font-black" style={{ color: activeWorkflowNode.tone }}>{activeWorkflowNode.code}</code><h3 className="mt-1 text-[15px] font-black text-[#30415c]">{activeWorkflowNode.title}</h3></div><button type="button" onClick={() => setSelectedWorkflowNode("")} aria-label="关闭节点详情"><X className="h-4 w-4 text-[#7d899b]" /></button></div>
            <div className="mt-5 border-y border-[#e5e9ef] py-4"><span className="text-[9px] font-bold text-[#8793a5]">当前进度</span><strong className="mt-2 block text-[18px] font-black text-[#40516b]">{activeWorkflowNode.meta}</strong><p className={`mt-1 text-[9px] font-black ${getWorkflowNodeStatus(activeWorkflowNode) === "已完成" ? "text-emerald-700" : getWorkflowNodeStatus(activeWorkflowNode) === "进行中" ? "text-[#315ca9]" : "text-[#9aa5b5]"}`}>{getWorkflowNodeStatus(activeWorkflowNode)}</p></div>
            <dl className="mt-5 space-y-3 text-[9px]"><div className="flex justify-between"><dt className="font-bold text-[#8995a6]">所属项目</dt><dd className="font-black text-[#43536c]">华东智造 · 2026 年审</dd></div><div className="flex justify-between"><dt className="font-bold text-[#8995a6]">上游证据</dt><dd className="font-black text-[#43536c]">已关联</dd></div><div className="flex justify-between"><dt className="font-bold text-[#8995a6]">责任角色</dt><dd className="font-black text-[#43536c]">CPA 项目组</dd></div></dl>
            <button type="button" disabled={(workflowNodeStage[activeWorkflowNode.id] ?? 0) > downstreamProgress} onClick={() => { setActivePage(activeWorkflowNode.page); setWorkflowView("execution"); }} className="mt-6 h-9 w-full rounded-md bg-[#315ca9] text-[9px] font-black text-white hover:bg-[#264f96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315ca9] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#cbd3df]">{(workflowNodeStage[activeWorkflowNode.id] ?? 0) > downstreamProgress ? "完成前置步骤后解锁" : "进入节点处理"}</button>
            <p className="mt-3 text-[8px] font-bold leading-relaxed text-[#8491a4]">单击选择节点并查看详情，双击可直接进入对应执行页面。</p>
          </aside>}
          {selectedWorkflowNode && <div className="absolute bottom-3 left-3 rounded-md border border-[#dfe5ed] bg-white px-3 py-2 text-[8px] font-bold text-[#68778d] shadow-sm">已选：<b className="text-[#315ca9]">{activeWorkflowNode.title}</b></div>}
        </section>
      )}

      {workflowView === "execution" && activePage === "overview" && (
        <section className="mt-4">
          <div className="grid grid-cols-6 divide-x divide-[#e2e7ee] border-y border-[#e2e7ee] bg-white py-4">
            {[
              ["AP/CC异常", "12", "7待复核 · 5待资料"],
              ["错报", "4", "累计165.2万元"],
              ["合规问题", "3", "1项重大"],
              ["底稿", "18/23", "2份待复核"],
              ["完成程序", "3/12", "2项阻塞 · 7项待处理"],
            ].map(([label, value, note], index) => (
              <div key={label} className={`px-5 ${index === 0 ? "col-span-2" : ""}`}>
                <span className="text-[10px] font-bold text-[#8491a4]">{label}</span>
                <strong className={`mt-1 block font-black text-[#3d506c] ${index === 0 ? "text-3xl" : "text-2xl"}`}>{value}</strong>
                <small className="mt-1.5 block text-[10px] font-bold text-[#8794a7]">{note}</small>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <h3 className="text-[14px] font-black text-[#3b4d67]">当前流程</h3>
            {[
              ["第三层", "AP/CC执行与发现", "12项异常均已进入人工处理", "查看错报汇总", "misstatements"],
              ["第四层", "错报、合规问题与底稿", "1项重大合规问题、2份底稿待复核", "处理发现与底稿", "workpapers"],
              ["第五层", "TB与审计调整", "3笔调整已入账，1笔错报待决定", "查看TB与调整", "tb"],
              ["完成阶段", "完成程序与报告", "4项程序未完成，暂不能完成项目", "查看完成程序", "completion"],
            ].map(([step, title, note, action, target], index) => (
              <div key={step} className={`grid grid-cols-[100px_minmax(200px,1fr)_minmax(280px,1.4fr)_140px] items-center gap-5 px-5 ${index === 0 ? "mt-3 bg-[#eef3fb] py-6" : "border-t border-[#e6eaf0] py-4"}`}>
                <span className={`font-black ${index === 0 ? "text-[12px] text-[#315ca9]" : "text-[10px] text-[#7e8a9c]"}`}>{step}</span>
                <strong className={`${index === 0 ? "text-[15px]" : "text-[13px]"} font-black text-[#35455f]`}>{title}</strong>
                <span className="text-[11px] font-bold leading-relaxed text-[#68778d]">{note}</span>
                <button type="button" onClick={() => setActivePage(target as typeof activePage)} className="h-9 rounded-md border border-[#c7d3e5] bg-white text-[10px] font-black text-[#466393]">{action}</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {workflowView === "execution" && (activePage === "misstatements" || activePage === "compliance") && (
        <section className={`mt-4 ${selectedCompliance !== null && activePage === "compliance" ? "pr-[305px]" : ""}`}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-[16px] font-black text-[#30415c]">{findingType === "misstatement" ? "错报汇总清单" : "合规问题清单"}</h2>
              <p className="mt-1 text-[10px] font-bold text-[#8390a3]">{findingType === "misstatement" ? "共计产生错报 28 笔，当前展示影响项目结论的重点事项" : "汇总 AP / CC 执行识别的法规、制度与流程合规问题"}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="h-8 rounded-md border border-[#bfcde4] bg-white px-3 text-[9px] font-black text-[#3f61a2] hover:bg-[#f4f7fd]">查看趋势</button>
              {activePage === "misstatements" && (downstreamProgress > 0 ? <span className="rounded bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700">错报汇总已确认</span> : <button type="button" onClick={advanceDownstream} className="h-8 rounded-md bg-[#315ca9] px-3 text-[9px] font-black text-white hover:bg-[#264f96]">确认错报汇总审核</button>)}
              {activePage === "compliance" && (downstreamProgress > 1 ? <span className="rounded bg-emerald-50 px-3 py-2 text-[9px] font-black text-emerald-700">合规问题已确认</span> : <button type="button" disabled={downstreamProgress < 1} onClick={advanceDownstream} className="h-8 rounded-md bg-[#315ca9] px-3 text-[9px] font-black text-white hover:bg-[#264f96] disabled:cursor-not-allowed disabled:bg-[#cbd3df]">{downstreamProgress < 1 ? "请先确认错报汇总" : "确认合规问题审核"}</button>)}
            </div>
          </div>
          <div className="mb-4 grid grid-cols-4 gap-3">
            {(findingType === "misstatement"
              ? [["错报笔数","28","与上期 +5"],["错报金额","324.5万","占可容忍错报 64.9%"],["高风险错报","8","占错报笔数 28.6%"],["已调整错报","12","占错报笔数 42.9%"]]
              : [["合规问题数","16","与上期 +2"],["重大问题","6","占问题数 37.5%"],["一般问题","8","占问题数 50.0%"],["低风险问题","2","占问题数 12.5%"]]
            ).map(([label,value,note], index) => (
              <div key={label} className={`rounded-lg border border-[#dfe5ed] px-4 py-4 ${index === 0 ? "bg-[#fff7f7]" : "bg-white"}`}>
                <span className="text-[10px] font-bold text-[#7f8b9e]">{label}</span>
                <strong className={`mt-1 block text-2xl font-black ${index === 0 ? "text-rose-600" : "text-[#344761]"}`}>{value}</strong>
                <small className="mt-1 block text-[9px] font-bold text-[#8a96a7]">{note}</small>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-[#dfe5ed] bg-white px-3 py-3">
            {(findingType === "misstatement" ? ["状态：全部","严重程度：全部","科目/项目：全部"] : ["问题类型：全部","严重程度：全部","状态：全部"]).map((filter) => <button type="button" key={filter} className="h-8 rounded-md border border-[#d3dce9] bg-white px-3 text-[9px] font-bold text-[#617089]">{filter}⌄</button>)}
            <label className="ml-auto flex h-8 w-52 items-center gap-2 rounded-md border border-[#d3dce9] bg-white px-3 text-[#8a96a7]">
              <Search className="h-3.5 w-3.5" />
              <input value={findingSearch} onChange={(event) => setFindingSearch(event.target.value)} placeholder={findingType === "misstatement" ? "搜索错报编号/描述" : "搜索问题编号/描述"} className="min-w-0 flex-1 bg-transparent text-[9px] font-bold text-[#526178] outline-none" />
            </label>
            <button type="button" className="h-8 rounded-md bg-[#315ca9] px-3 text-[9px] font-black text-white hover:bg-[#264f96]">导出</button>
          </div>
          <div className="overflow-hidden rounded-b-lg border border-[#dfe5ed] bg-white">
            {findingType === "misstatement" ? (
              <>
                <div className="grid grid-cols-[105px_minmax(180px,1fr)_110px_120px_100px_90px_60px] gap-3 bg-[#fafbfc] px-5 py-3 text-[10px] font-black text-[#77859a]">
                  <span>错报编号</span><span>错报事项</span><span>来源节点</span><span>涉及科目</span><span>错报金额</span><span>处置</span><span>影响</span>
                </div>
                {misstatements.map((row) => (
                  <div key={row[0]} className="grid grid-cols-[105px_minmax(180px,1fr)_110px_120px_100px_90px_60px] items-center gap-3 border-t border-[#edf0f4] px-5 py-4 text-[11px] font-bold text-[#526178]">
                    <code className="font-black">{row[0]}</code><strong>{row[1]}</strong><span className="text-[#315ca9]">{row[2]}</span><span>{row[3]}</span><span className="font-black">{row[4]}</span><span>{row[5]}</span><span>{row[6]}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="grid grid-cols-[105px_minmax(200px,1fr)_110px_150px_80px_110px] gap-3 bg-[#fafbfc] px-5 py-3 text-[10px] font-black text-[#77859a]">
                  <span>问题编号</span><span>合规问题</span><span>来源节点</span><span>法规/制度领域</span><span>严重程度</span><span>状态</span>
                </div>
                {complianceIssues.map((row, index) => (
                  <button type="button" onClick={() => setSelectedCompliance(index)} key={row[0]} className="grid w-full grid-cols-[105px_minmax(200px,1fr)_110px_150px_80px_110px] items-center gap-3 border-t border-[#edf0f4] px-5 py-4 text-left text-[11px] font-bold text-[#526178] hover:bg-[#f8faff]">
                    <code className="font-black">{row[0]}</code><strong>{row[1]}</strong><span className="text-[#315ca9]">{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><span>{row[5]}</span>
                  </button>
                ))}
              </>
            )}
          </div>
          {selectedCompliance !== null && activePage === "compliance" && (
            <aside className="absolute inset-y-0 right-0 z-20 w-[290px] overflow-y-auto border-l border-[#dfe5ed] bg-white p-5 shadow-[-6px_0_14px_rgba(40,57,88,.06)] custom-scrollbar">
              <div className="flex items-start justify-between gap-3"><div><code className="text-[10px] font-black text-[#526178]">{complianceIssues[selectedCompliance][0]}</code><h3 className="mt-2 text-[15px] font-black text-[#30415b]">{complianceIssues[selectedCompliance][1]}</h3></div><button type="button" onClick={() => setSelectedCompliance(null)} className="text-[15px] text-[#7e8a9c]">×</button></div>
              <div className="mt-5 border-y border-[#e5e9ef] py-4"><span className="text-[9px] font-bold text-[#8793a5]">问题描述</span><p className="mt-2 text-[11px] font-bold leading-[1.8] text-[#526178]">系统在审计执行过程中识别到该事项与适用制度要求不一致，需要项目人员确认影响范围并跟踪整改。</p></div>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-[10px]"><div><dt className="font-bold text-[#8a96a7]">问题类型</dt><dd className="mt-1 font-black text-[#40516b]">{complianceIssues[selectedCompliance][3]}</dd></div><div><dt className="font-bold text-[#8a96a7]">严重程度</dt><dd className="mt-1 font-black text-rose-600">{complianceIssues[selectedCompliance][4]}</dd></div><div><dt className="font-bold text-[#8a96a7]">涉及节点</dt><dd className="mt-1 font-black text-[#315ca9]">{complianceIssues[selectedCompliance][2]}</dd></div><div><dt className="font-bold text-[#8a96a7]">当前状态</dt><dd className="mt-1 font-black text-[#40516b]">{complianceIssues[selectedCompliance][5]}</dd></div></dl>
              <div className="mt-5"><h4 className="text-[10px] font-black text-[#40516b]">建议措施</h4><ol className="mt-2 space-y-2 text-[10px] font-bold leading-relaxed text-[#65748a]"><li>1. 核对适用制度与业务事实。</li><li>2. 明确整改责任人和完成期限。</li><li>3. 评估是否同时形成财务错报。</li></ol></div>
              <button type="button" className="mt-6 h-9 w-full rounded-md bg-[#315ca9] text-[10px] font-black text-white">发起整改</button>
            </aside>
          )}
        </section>
      )}

      {workflowView === "execution" && activePage === "workpapers" && (
        <section className="grid min-h-[560px] grid-cols-[205px_minmax(0,1fr)] overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
          <aside className="border-r border-[#e1e6ee] bg-[#fbfcfe] px-3 py-4">
            <div className="flex items-center justify-between px-2"><h3 className="text-[11px] font-black text-[#3b4d67]">底稿目录</h3><span className="text-[13px] text-[#78869b]">×</span></div>
            <label className="mt-3 flex h-8 items-center gap-2 rounded-md border border-[#d8e0eb] bg-white px-2.5"><Search className="h-3.5 w-3.5 text-[#8a96a7]"/><input placeholder="搜索底稿目录…" className="min-w-0 flex-1 bg-transparent text-[9px] font-bold outline-none"/></label>
            <div className="mt-3 space-y-1 text-[10px] font-bold text-[#637188]">
              {["▸ 01 计划阶段","▸ 02 风险评估","▸ 03 内控测试","▾ 04 实质性程序","　▸ 收入","　▾ 应收账款","　▸ 存货","　▸ 固定资产","　▸ 应付账款","　▸ 费用","▸ 05 完成阶段"].map((item,index) => <button type="button" key={item} className={`block w-full rounded px-2 py-1.5 text-left ${index === 5 ? "bg-[#e9f0ff] font-black text-[#315ca9]" : "hover:bg-[#f3f5f8]"}`}>{item}</button>)}
            </div>
          </aside>
          <div className="min-w-0 p-5">
            <div className="flex items-center justify-between">
              <div><h3 className="text-[15px] font-black text-[#3b4d67]">应收账款底稿</h3><p className="mt-1 text-[10px] font-bold text-[#7e8b9e]">共 5 份 · 点击底稿名称查看内容与 AI 建议</p></div>
              <div className="flex gap-2"><button type="button" className="h-8 rounded-md bg-[#315ca9] px-3 text-[9px] font-black text-white"><Plus className="mr-1 inline h-3 w-3"/>新建底稿</button><button type="button" className="h-8 rounded-md border border-[#cad5e5] px-3 text-[9px] font-black text-[#526681]">上传文件</button><button type="button" className="h-8 rounded-md border border-[#cad5e5] px-3 text-[9px] font-black text-[#526681]">批量操作⌄</button></div>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-[#dfe5ed] bg-white">
              <div className="grid grid-cols-[100px_minmax(170px,1fr)_70px_90px_70px_90px_72px] gap-3 bg-[#fafbfc] px-4 py-3 text-[9px] font-black text-[#77859a]"><span>底稿编号</span><span>底稿名称</span><span>编制人</span><span>编制日期</span><span>复核人</span><span>复核日期</span><span>状态</span></div>
              {workpapers.map((row, index) => <button type="button" onClick={() => { setSelectedWorkpaper(index); setActivePage("workpaperDetail"); }} key={row[0]} className="grid w-full grid-cols-[100px_minmax(170px,1fr)_70px_90px_70px_90px_72px] items-center gap-3 border-t border-[#edf0f4] px-4 py-4 text-left text-[10px] font-bold text-[#526178] hover:bg-[#f6f9fe]"><code className="font-black">{row[0]}</code><strong className="text-[11px] text-[#315ca9]">{row[1]}</strong><span>{row[2]}</span><span>{row[3]}</span><span>{row[4]}</span><span>{row[5]}</span><span className={`justify-self-start rounded px-2 py-1 text-[8px] font-black ${row[6] === "已复核" ? "bg-emerald-50 text-emerald-700" : row[6] === "待复核" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{row[6]}</span></button>)}
            </div>
          </div>
        </section>
      )}

      {workflowView === "execution" && activePage === "workpaperDetail" && (
        <section className="min-h-[560px]">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-[#dfe5ed] bg-white px-5 py-4">
            <div><button type="button" onClick={() => setActivePage("workpapers")} className="mb-2 text-[9px] font-black text-[#315ca9]">← 返回底稿列表</button><div className="flex items-center gap-2"><h2 className="text-[16px] font-black text-[#30415c]">{workpapers[selectedWorkpaper][0]} {workpapers[selectedWorkpaper][1]}</h2><span className="rounded bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">{workpapers[selectedWorkpaper][6]}</span></div><p className="mt-2 text-[9px] font-bold text-[#7d899b]">编制人：{workpapers[selectedWorkpaper][2]}　编制日期：{workpapers[selectedWorkpaper][3]}　复核人：{workpapers[selectedWorkpaper][4]}　复核日期：{workpapers[selectedWorkpaper][5]}</p></div>
            <div className="flex gap-2"><button type="button" className="h-8 rounded-md border border-[#cad5e5] px-3 text-[9px] font-black text-[#526681]">编辑</button><button type="button" className="h-8 rounded-md border border-[#cad5e5] px-3 text-[9px] font-black text-[#526681]">更多操作⌄</button></div>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-4">
            <article className="min-h-[440px] rounded-lg border border-[#dfe5ed] bg-white p-5"><div className="flex gap-5 border-b border-[#e5e9ef] pb-3 text-[9px] font-black text-[#6d7b90]"><span className="text-[#315ca9]">底稿内容</span><span>附件（3）</span><span>复核记录</span><span>疑点补充</span></div><div className="mx-auto mt-6 max-w-[620px]"><h3 className="text-center text-[15px] font-black text-[#30415c]">应收账款函证程序</h3><h4 className="mt-7 text-[11px] font-black text-[#40516b]">一、程序说明</h4><p className="mt-2 text-[10px] font-bold leading-7 text-[#5d6c82]">获取被审计单位应收账款明细表，复核加计是否正确，并与总账数和明细账合计数核对是否相符；结合坏账准备科目与报表数核对是否相符。</p><h4 className="mt-6 text-[11px] font-black text-[#40516b]">二、执行结果</h4><div className="mt-3 overflow-hidden border border-[#dfe5ed]">{[["项目","金额（元）","比例（%）"],["发函总额","12,500,000","100.00"],["回函总额","12,300,000","98.40"],["未回函金额","200,000","1.60"],["回函不符总额","50,000","0.40"]].map((row,index)=><div key={row[0]} className={`grid grid-cols-[1fr_150px_110px] ${index ? "border-t border-[#e8ecf2]" : "bg-[#fafbfc]"}`}>{row.map((cell,i)=><span key={cell} className={`px-3 py-2.5 text-[9px] ${index ? "font-bold text-[#526178]" : "font-black text-[#6f7d91]"} ${i ? "text-right" : ""}`}>{cell}</span>)}</div>)}</div></div></article>
            <aside className="space-y-4"><div className="rounded-lg border border-[#dfe5ed] bg-white p-4"><h3 className="text-[11px] font-black text-[#40516b]">底稿信息</h3><dl className="mt-3 space-y-3 text-[9px]">{[["底稿状态","已复核"],["重要性","重要"],["关联科目","应收账款"],["底稿索引","BS-AR-001"],["底稿类型","实质性程序"]].map(([k,v])=><div key={k} className="flex justify-between gap-3"><dt className="font-bold text-[#8995a6]">{k}</dt><dd className="font-black text-[#43536c]">{v}</dd></div>)}</dl></div><div className="rounded-lg border border-[#dfe5ed] bg-[#f8fafc] p-4"><h3 className="text-[11px] font-black text-[#40516b]">AI 助手</h3><p className="mt-3 text-[9px] font-bold leading-6 text-[#607089]">发现未回函金额 200,000 元，建议补充期后收款等替代测试程序；回函不符金额 50,000 元，建议进一步追查差异原因。</p><button type="button" className="mt-4 h-8 w-full rounded-md border border-[#bfcde4] bg-white text-[9px] font-black text-[#315ca9]">重新分析</button></div></aside>
          </div>
        </section>
      )}

      {workflowView === "execution" && activePage === "tb" && (
        <section className="mt-4">
          <div className="grid grid-cols-[1.35fr_1fr_1fr_1.35fr] divide-x divide-[#e2e7ee] border-y border-[#e2e7ee] bg-white py-4">
            {[["账面余额","12,500.0万"],["已确认调整","116.6万"],["待确认调整","48.2万"],["调整后余额","12,616.6万"]].map(([label,value], index) => <div key={label} className={`px-5 ${index === 3 ? "bg-[#f3f7ff]" : ""}`}><span className="text-[10px] font-bold text-[#8491a4]">{label}</span><strong className={`mt-1 block font-black text-[#3d506c] ${index === 0 || index === 3 ? "text-2xl" : "text-xl"}`}>{value}</strong></div>)}
          </div>
          <div className="mt-4 overflow-hidden border-y border-[#dfe5ed] bg-white">
            <div className="grid grid-cols-[80px_minmax(130px,1fr)_110px_110px_110px_110px_110px] gap-3 bg-[#fafbfc] px-5 py-3 text-[10px] font-black text-[#77859a]"><span>科目</span><span>科目名称</span><span>账面余额</span><span>调整借方</span><span>调整贷方</span><span>调整后余额</span><span>错报来源</span></div>
            {[["1001","库存现金","50.0万","—","—","50.0万","—"],["1122","应收账款","1,250.0万","—","48.2万","1,201.8万","ME-2026-002"],["1405","存货","800.0万","18.6万","—","818.6万","ME-2026-003"],["6001","营业收入","8,600.0万","86.0万","—","8,686.0万","ME-2026-001"]].map((row) => <div key={row[0]} className="grid grid-cols-[80px_minmax(130px,1fr)_110px_110px_110px_110px_110px] items-center gap-3 border-t border-[#edf0f4] px-5 py-4 text-[11px] font-bold text-[#526178]"><code>{row[0]}</code>{row.slice(1).map((cell,index) => <span key={`${row[0]}-${index}`} className={index === 5 ? "font-black text-[#315ca9]" : ""}>{cell}</span>)}</div>)}
          </div>
          <p className="mt-3 text-[10px] font-bold text-[#7e8b9e]">只有经CPA确认的错报调整才能写入调整后TB；点击错报编号可反向查看AP/CC节点与底稿证据。</p>
          <div className="mt-5 border-y border-[#dfe5ed] bg-white px-5 py-4">
            <div className="flex items-center justify-between"><div><h3 className="text-[13px] font-black text-[#3b4d67]">财务报表最终核对</h3><p className="mt-1 text-[9px] font-bold text-[#7e8b9e]">调整后 TB、财务报表、附注及底稿数字必须保持一致。</p></div><span className="rounded bg-amber-50 px-2 py-1 text-[8px] font-black text-amber-700">等待调整完成</span></div>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
              {[["调整分录审批","已完成"],["调整后 TB 重新汇总","已完成"],["TB 与财务报表勾稽","待复核"],["报表附注完整性检查","待执行"],["财务报表与底稿数字核对","待执行"],["最终版财务报表锁定","未解锁"]].map(([item,status]) => <div key={item} className="flex items-center justify-between border-t border-[#edf0f4] pt-3 text-[10px]"><span className="font-bold text-[#526178]">{item}</span><span className={`font-black ${status === "已完成" ? "text-emerald-700" : status === "未解锁" ? "text-[#9aa5b5]" : "text-amber-700"}`}>{status}</span></div>)}
            </div>
          </div>
        </section>
      )}

      {workflowView === "execution" && activePage === "completion" && (
        <section className="mt-4 grid grid-cols-[minmax(0,1fr)_260px] gap-4">
          <div className="min-w-0">
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[["期后事项","已完成"],["持续经营评估","已完成"],["错报及合规汇总","进行中"],["管理层声明","待执行"],["最终分析程序","待执行"],["项目质量复核","未开始"],["报告审批签发","未解锁"],["项目归档","未解锁"]].map(([title,status],index) => (
              <div key={title} className="bg-white px-3 py-4">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-black ${index < 2 ? "bg-emerald-100 text-emerald-700" : index === 2 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>{index + 1}</span>
                <strong className="mt-3 block text-[11px] font-black text-[#40516b]">{title}</strong>
                <small className="mt-1 block text-[9px] font-bold text-[#8491a4]">{status}</small>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-y border-amber-200 bg-amber-50 px-4 py-3">
            <div><strong className="text-[13px] font-black text-amber-900">当前暂不能进入报告签发</strong><p className="mt-1 text-[10px] font-bold text-amber-800">仍有重大合规问题、未处置错报、未决复核事项及完成程序未关闭。</p></div>
            <button type="button" aria-disabled="true" className="h-9 cursor-default rounded-md bg-[#cbd3df] px-5 text-[10px] font-black text-white">完成项目</button>
          </div>
          <div className="mt-4 overflow-hidden border-y border-[#dfe5ed] bg-white">
            <div className="grid grid-cols-[90px_minmax(190px,1fr)_90px_90px_90px_minmax(180px,1fr)] gap-3 bg-[#fafbfc] px-5 py-3 text-[10px] font-black text-[#77859a]"><span>编号</span><span>完成程序</span><span>执行人</span><span>复核人</span><span>状态</span><span>结论/阻塞原因</span></div>
            {completionItems.map((row) => <div key={row[0]} className="grid grid-cols-[90px_minmax(190px,1fr)_90px_90px_90px_minmax(180px,1fr)] items-center gap-3 border-t border-[#edf0f4] px-5 py-4 text-[11px] font-bold text-[#526178]"><code className="font-black">{row[0]}</code><strong className="text-[12px]">{row[1]}</strong><span>{row[2]}</span><span>{row[3]}</span><span className={row[4] === "阻塞" ? "font-black text-rose-700" : ""}>{row[4]}</span><span>{row[5]}</span></div>)}
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[["项目质量复核","未开始","经理、合伙人及必要时 EQR 复核"],["审计报告","等待完成程序","意见形成、审批、签字与盖章"],["管理建议书","生成中","汇总合规问题与控制缺陷"],["项目归档","未开始","归档锁定、修改留痕与知识回流"]].map(([title,status,note], index) => <div key={title} className={`bg-white px-5 ${index === 1 ? "py-6" : "py-4"}`}><span className="text-[10px] font-black text-[#7e8b9e]">{status}</span><strong className={`${index === 1 ? "text-[16px]" : "text-[13px]"} mt-1 block font-black text-[#35455f]`}>{title}</strong><p className="mt-2 text-[10px] font-bold text-[#7b8799]">{note}</p></div>)}
          </div>
          </div>
          <aside className="flex min-h-[560px] flex-col rounded-lg border border-[#dfe5ed] bg-white p-5">
            <h3 className="text-[13px] font-black text-[#30415c]">完成程序情况</h3>
            <div className="mx-auto mt-16 grid h-40 w-40 place-items-center rounded-full" style={{ background: "conic-gradient(#315ca9 0 25%, #dce5f3 25% 100%)" }}>
              <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><span className="text-[9px] font-bold text-[#7c899b]">整体完成<strong className="mt-1 block text-3xl font-black text-[#315ca9]">25%</strong></span></div>
            </div>
            <dl className="mt-10 space-y-4 text-[10px] font-bold text-[#526178]">
              {[["已完成","3","bg-[#315ca9]"],["进行中／待处理","7","bg-[#91afe6]"],["阻塞／未开始","2","bg-[#dce3ed]"]].map(([label,value,tone])=><div key={label} className="flex items-center"><span className={`mr-2 h-2 w-2 rounded-full ${tone}`}/><dt>{label}</dt><dd className="ml-auto font-black">{value}</dd></div>)}
            </dl>
            <div className="mt-auto space-y-2"><button type="button" className="h-9 w-full rounded-md bg-[#315ca9] text-[10px] font-black text-white hover:bg-[#264f96]">生成报告</button><button type="button" className="h-9 w-full rounded-md border border-[#c7d3e5] bg-white text-[10px] font-black text-[#466393]">提交复核</button></div>
          </aside>
        </section>
      )}
          </main>
        </div>
    </section>
  );
}

export default function AuditTagSystemView({
  onBack,
  agentPanelOpen = false,
  onToggleAgentPanel,
}: {
  onBack?: () => void;
  agentPanelOpen?: boolean;
  onToggleAgentPanel?: () => void;
}) {
  const [view, setView] = useState<
    "overview" | "agents" | "library" | "graph" | "review" | "execution" | "downstream"
  >("graph");
  const [reference, setReference] = useState("");
  const [agent, setAgent] = useState("图谱检索 Agent");
  const [agentPanelWidth, setAgentPanelWidth] = useState(340);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"全部" | RuleType>("全部");
  const [selected, setSelected] = useState<AuditRule>(rules[0]);
  const [showCreate, setShowCreate] = useState(false);
  const [showProject, setShowProject] = useState(false);
  const [projectStep, setProjectStep] = useState(1);
  const [projectGraphReady, setProjectGraphReady] = useState(false);
  const [materialityConfirmed, setMaterialityConfirmed] = useState(false);
  const [preparationRequest, setPreparationRequest] = useState(0);
  const [preparationProjectId, setPreparationProjectId] = useState<
    string | null
  >(null);
  const [createdProjects, setCreatedProjects] = useState<CreatedAuditProject[]>(
    [],
  );
  const [projectForm, setProjectForm] = useState({
    name: "华东智造有限公司2026年度审计",
    client: "华东智造有限公司",
    period: "2026年度",
  });
  const [financialUploads, setFinancialUploads] = useState<
    Record<string, string[]>
  >({});
  const [clientUploads, setClientUploads] = useState<string[]>([]);
  const [latestCreatedProjectId, setLatestCreatedProjectId] = useState<
    string | null
  >(null);
  const [reviewStage, setReviewStage] = useState<"parameters" | "candidates">(
    "parameters",
  );
  const [downstreamProjectId, setDownstreamProjectId] = useState("audit-handoff");
  const [downstreamProgressByProject, setDownstreamProgressByProject] = useState<
    Record<string, number>
  >({ "audit-handoff": 5, huadong: -1, jinli: -1, xincheng: -1 });
  const [taskDecisionsByProject, setTaskDecisionsByProject] = useState<
    Record<string, AuditTaskDecisionMap>
  >({
    "audit-handoff": Object.fromEntries(
      ["rs1", "rs2", "rs3", "rs4", "and1", "ct1", "ct2", "ap1", "ap2", "ap3", "ap4", "cc1"].map((id) => [id, "通过"]),
    ) as AuditTaskDecisionMap,
  });
  const [materialRequestsByProject, setMaterialRequestsByProject] = useState<
    Record<string, AuditMaterialRequestMap>
  >({
    "audit-handoff": {},
    jinli: initialAuditMaterialRequests,
  });
  const [nodeAssignments, setNodeAssignments] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        graphStudioNodes.map((node, index) => [
          node.id,
          ["符金雨", "李敏", "符金雨", "赵宁"][index % 4],
        ]),
      ),
  );

  const openProjectReview = (stage: "parameters" | "candidates") => {
    setReviewStage(
      stage === "candidates" && !materialityConfirmed ? "parameters" : stage,
    );
    setView("review");
  };

  const filtered = useMemo(
    () =>
      rules.filter((rule) => {
        const matchesQuery = `${rule.id}${rule.name}${rule.cycle}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
        return matchesQuery && (type === "全部" || rule.type === type);
      }),
    [query, type],
  );

  return (
    <div
      id="workbench-view-root"
      style={{
        paddingRight: agentPanelOpen ? agentPanelWidth + 16 : undefined,
      }}
      className={`min-w-0 flex-1 bg-[#f7f8fc] p-4 select-none custom-scrollbar transition-[padding-right] duration-200 md:p-5 2xl:p-6 ${view === "graph" || view === "downstream" ? "flex flex-col overflow-hidden" : "overflow-y-auto"}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#e5e9f1] pb-3">
        <div className="mr-auto flex min-w-0 items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="返回项目工作台"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dfe5ee] bg-white text-[#53647d] hover:border-[#bfcbe0] hover:text-[#2459c4] focus:outline-none focus:ring-2 focus:ring-[#cbd9f6]"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <h1 className="truncate text-[22px] font-black text-[#202d55]">
            审计标注系统
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setView("graph")}
            aria-current={view === "graph" ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#d7e1f2] ${view === "graph" ? "bg-[#edf2ff] text-[#2859c4]" : "bg-white text-[#64748a]"}`}
          >
            知识图谱
            <ChevronRight className="h-3.5 w-3.5 text-[#7895d0]" />
          </button>
          <button
            type="button"
            onClick={() => setView("downstream")}
            aria-current={view === "downstream" ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-[#d7e1f2] ${view === "downstream" ? "bg-[#edf2ff] text-[#2859c4]" : "bg-white text-[#64748a]"}`}
          >
            后续审计流程
            <ChevronRight className="h-3.5 w-3.5 text-[#7895d0]" />
          </button>
        </div>
      </header>

      <section className={view === "downstream" ? "audit-graph-workspace -mx-4 -mb-4 mt-0 min-h-0 flex-1 overflow-hidden border-t border-[#e2e7ee] md:-mx-5 md:-mb-5 2xl:-mx-6 2xl:-mb-6" : "hidden"}>
        <SourceDownstreamAuditWorkflow
          initialProjectId={downstreamProjectId}
          workflowProgressByProject={downstreamProgressByProject}
          nodeAssignments={nodeAssignments}
          taskDecisionsByProject={taskDecisionsByProject}
          onWorkflowProgressChange={(projectId, progress) =>
            setDownstreamProgressByProject((current) => ({
              ...current,
              [projectId]: progress,
            }))
          }
        />
      </section>

      {view === "downstream" ? null : view === "overview" ? (
        <WorkflowOverview
          onNewProject={() => {
            setProjectStep(1);
            setShowProject(true);
          }}
          onNavigate={setView}
          onReference={setReference}
        />
      ) : view === "agents" ? (
        <AgentOrchestration onNavigate={setView} />
      ) : view === "graph" ? (
        <AuditGraphWorkspace
          onNewProject={() => {
            setProjectStep(1);
            setShowProject(true);
          }}
          preparationRequest={preparationRequest}
          preparationProjectId={preparationProjectId}
          createdProjects={createdProjects}
          initialSource={projectGraphReady ? "project" : "library"}
          materialityConfirmed={materialityConfirmed}
          projectGraphReady={projectGraphReady}
          nodeAssignments={nodeAssignments}
          setNodeAssignments={setNodeAssignments}
          onOpenReview={openProjectReview}
          onConfirmMateriality={() => setMaterialityConfirmed(true)}
          onStartDag={() => setProjectGraphReady(true)}
          onReference={setReference}
          onNavigate={setView}
          onOpenDownstream={(projectId) => {
            setDownstreamProjectId(projectId);
            setView("downstream");
          }}
          onHandoffDownstream={(projectId) => {
            setDownstreamProgressByProject((current) => ({
              ...current,
              [projectId]: 0,
            }));
            setDownstreamProjectId(projectId);
            setView("downstream");
          }}
          downstreamProgressByProject={downstreamProgressByProject}
          taskDecisionsByProject={taskDecisionsByProject}
          setTaskDecisionsByProject={setTaskDecisionsByProject}
          materialRequestsByProject={materialRequestsByProject}
          setMaterialRequestsByProject={setMaterialRequestsByProject}
        />
      ) : view === "review" ? (
        <CandidateReview
          stage={reviewStage}
          onStageChange={(stage) => {
            if (stage === "candidates") setMaterialityConfirmed(true);
            setReviewStage(stage);
          }}
          onGraph={() => setView("graph")}
          onGraphReady={() => setProjectGraphReady(true)}
        />
      ) : view === "execution" ? (
        <ExecutionCenter />
      ) : (
        <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                ["风险信号", "36", "8 条本月更新"],
                ["审计程序", "84", "6 条待复核"],
                ["合规检查", "22", "覆盖 9 类实体"],
                ["内控测试", "31", "12 个业务循环"],
              ].map(([label, value, note]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    setType(label as RuleType);
                    setView("library");
                  }}
                  className="min-w-0 rounded-xl bg-white p-3.5 text-left outline outline-1 outline-[#e3e8f1] hover:outline-[#b9c7df] focus:ring-2 focus:ring-[#cfdbf5]"
                >
                  <span className="block text-[10px] font-bold text-[#71809a]">
                    {label}
                  </span>
                  <strong className="mt-1 block text-[21px] font-black leading-none text-[#263653]">
                    {value}
                  </strong>
                  <small className="mt-2 block truncate text-[9px] font-bold text-[#9aa5b7]">
                    {note}
                  </small>
                </button>
              ))}
            </div>

            <div className="mt-3 overflow-hidden rounded-xl bg-white outline outline-1 outline-[#e3e8f1]">
              <div className="flex flex-col gap-2.5 border-b border-[#e8ecf3] p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-[#3a63bf]" />
                  <h2 className="text-xs font-black text-[#2d3b57]">
                    {view === "library" ? "全所标注库" : "规则触发关系"}
                  </h2>
                  <span className="text-[9px] font-bold text-[#98a3b4]">
                    {view === "library"
                      ? `${filtered.length} 条示例规则`
                      : "点击节点查看上下游"}
                  </span>
                </div>
                {view === "library" && (
                  <div className="flex min-w-0 gap-2">
                    <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#dfe5ee] px-2.5 sm:w-56">
                      <Search className="h-3.5 w-3.5 shrink-0 text-[#8793a7]" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="min-w-0 flex-1 bg-transparent text-[10px] font-bold text-[#43516a] outline-none"
                        placeholder="搜索编号、名称、业务循环"
                      />
                    </label>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-[#dfe5ee] text-[#697991] hover:bg-[#f5f7fb]"
                      aria-label="更多筛选"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {view === "library" ? (
                <>
                  <div className="flex gap-1.5 overflow-x-auto border-b border-[#edf0f5] px-3 py-2 custom-scrollbar">
                    {(
                      [
                        "全部",
                        "风险信号",
                        "审计程序",
                        "合规检查",
                        "内控测试",
                      ] as const
                    ).map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => setType(item)}
                        className={`h-7 shrink-0 rounded-md px-2.5 text-[9px] font-black ${type === item ? "bg-[#eaf0ff] text-[#2859c4]" : "text-[#718096] hover:bg-[#f3f5f8]"}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-[112px_minmax(180px,1fr)_130px_120px_78px_64px] gap-3 bg-[#fafbfc] px-4 py-2.5 text-[9px] font-black text-[#8995a8]">
                      <span>标注编号</span>
                      <span>名称</span>
                      <span>业务循环</span>
                      <span>执行方式</span>
                      <span>状态</span>
                      <span>版本</span>
                    </div>
                    <div className="max-h-[430px] overflow-y-auto custom-scrollbar">
                      {filtered.map((rule) => (
                        <button
                          type="button"
                          key={rule.id}
                          onClick={() => setSelected(rule)}
                          className={`grid w-full grid-cols-[112px_minmax(180px,1fr)_130px_120px_78px_64px] items-center gap-3 border-t border-[#edf0f5] px-4 py-3 text-left hover:bg-[#f8faff] ${selected.id === rule.id ? "bg-[#f1f5ff]" : ""}`}
                        >
                          <span className="font-mono text-[9px] font-black text-[#4d6080]">
                            {rule.id}
                          </span>
                          <span className="truncate text-[10px] font-black text-[#2f3e59]">
                            {rule.name}
                          </span>
                          <span className="truncate text-[9px] font-bold text-[#718096]">
                            {rule.cycle}
                          </span>
                          <span className="text-[9px] font-bold text-[#5d6d86]">
                            {rule.executor}
                          </span>
                          <span
                            className={`justify-self-start rounded px-1.5 py-1 text-[8px] font-black ${rule.status === "生效中" ? "bg-emerald-50 text-emerald-700" : rule.status === "待复核" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {rule.status}
                          </span>
                          <span className="text-[9px] font-bold text-[#7f8da2]">
                            {rule.version}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="overflow-x-auto p-4 custom-scrollbar">
                  <div className="grid min-h-[430px] min-w-[760px] grid-cols-4 gap-5 rounded-lg bg-[#f8fafc] p-4">
                    {graphColumns.map((column, columnIndex) => (
                      <div key={column.title} className="relative min-w-0">
                        <div className="mb-4">
                          <h3 className="text-[10px] font-black text-[#34435d]">
                            {column.title}
                          </h3>
                          <p className="mt-0.5 text-[8px] font-bold text-[#9aa5b5]">
                            {column.caption}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {column.items.map((id) => {
                            const rule = rules.find((item) => item.id === id);
                            const name =
                              rule?.name ??
                              (id === "COMP-001"
                                ? "期后事项"
                                : "关联方最终汇总");
                            return (
                              <button
                                type="button"
                                key={id}
                                onClick={() => rule && setSelected(rule)}
                                className={`relative z-10 w-full rounded-lg border bg-white p-3 text-left ${rule ? typeTone[rule.type] : "border-slate-200 text-slate-700"} ${selected.id === id ? "ring-2 ring-[#8fa9e6]" : ""}`}
                              >
                                <span className="block font-mono text-[8px] font-black opacity-70">
                                  {id}
                                </span>
                                <strong className="mt-1 block text-[10px] font-black">
                                  {name}
                                </strong>
                                {columnIndex < 3 && (
                                  <ArrowRight className="absolute -right-[19px] top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9baccc]" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="min-w-0 rounded-xl bg-white outline outline-1 outline-[#e3e8f1] lg:sticky lg:top-0 lg:self-start">
            {view === "graph" && (
              <div className="border-b border-[#e8ecf3] bg-[#f4f7fd] p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-[#3f5d99]">
                    <Bot className="h-3.5 w-3.5" />
                    图谱检索 Agent
                  </span>
                  <button
                    type="button"
                    onClick={() => setView("agents")}
                    className="text-[8px] font-black text-[#4568b0]"
                  >
                    查看运行详情
                  </button>
                </div>
                <p className="mt-2 text-[8px] font-bold leading-relaxed text-[#74839b]">
                  正在解释当前节点的推荐路径、上下游依赖和项目适用原因。
                </p>
              </div>
            )}
            <div className="border-b border-[#e8ecf3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[9px] font-black text-[#6d7c94]">
                    {selected.id}
                  </span>
                  <h2 className="mt-1 text-sm font-black text-[#273650]">
                    {selected.name}
                  </h2>
                </div>
                <span
                  className={`rounded-md border px-2 py-1 text-[8px] font-black ${typeTone[selected.type]}`}
                >
                  {selected.type}
                </span>
              </div>
              <p className="mt-3 text-[10px] font-bold leading-[1.7] text-[#65748b]">
                {selected.description}
              </p>
            </div>
            <div className="space-y-4 p-4">
              <dl className="grid grid-cols-2 gap-3 text-[9px]">
                <div>
                  <dt className="font-bold text-[#98a3b4]">业务循环</dt>
                  <dd className="mt-1 font-black text-[#42516a]">
                    {selected.cycle}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#98a3b4]">执行方式</dt>
                  <dd className="mt-1 flex items-center gap-1 font-black text-[#42516a]">
                    <Bot className="h-3 w-3 text-[#486fc7]" />
                    {selected.executor}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#98a3b4]">当前状态</dt>
                  <dd className="mt-1 font-black text-emerald-700">
                    {selected.status}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-[#98a3b4]">版本</dt>
                  <dd className="mt-1 font-black text-[#42516a]">
                    {selected.version}
                  </dd>
                </div>
              </dl>
              <div>
                <h3 className="flex items-center gap-1.5 text-[10px] font-black text-[#3b4961]">
                  <CircleDot className="h-3.5 w-3.5 text-[#4c70c7]" />
                  Scope 适用范围
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["年报审计", "制造业", "民营 / 国企"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#f2f4f8] px-2 py-1 text-[8px] font-black text-[#64748a]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-[#3b4961]">
                  上游输入
                </h3>
                <div className="mt-2 space-y-1.5">
                  {selected.upstream.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-md bg-[#f7f8fa] px-2.5 py-2 text-[9px] font-bold text-[#607089]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8ba1ca]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-[#3b4961]">
                  下游触发
                </h3>
                <div className="mt-2 space-y-1.5">
                  {selected.downstream.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className="flex w-full items-center justify-between rounded-md bg-[#eef3ff] px-2.5 py-2 text-[9px] font-black text-[#4465ad]"
                    >
                      <span>{item}</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#cad5e8] text-[9px] font-black text-[#4864a1] hover:bg-[#f4f7fd]"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                查看版本与审批记录
              </button>
            </div>
          </aside>
        </section>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-[70] flex justify-end bg-[#17213a]/35"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowCreate(false)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="新建标注"
            className="h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-xl custom-scrollbar"
          >
            <header className="flex items-center justify-between border-b border-[#e7eaf0] px-5 py-4">
              <div>
                <h2 className="text-sm font-black text-[#293a57]">
                  新建审计标注
                </h2>
                <p className="mt-1 text-[9px] font-bold text-[#8c98aa]">
                  先定义专业判断，再配置执行方式与触发关系
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#7a8799] hover:bg-[#f1f3f6]"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="space-y-4 p-5">
              <label className="block">
                <span className="text-[10px] font-black text-[#526078]">
                  标注类型
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      "风险信号",
                      "审计程序",
                      "合规检查",
                      "内控测试",
                    ] as RuleType[]
                  ).map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={`h-9 rounded-lg border text-[9px] font-black ${item === "风险信号" ? "border-[#8ea9e4] bg-[#eef3ff] text-[#365cad]" : "border-[#e0e5ed] text-[#697990]"}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-[#526078]">
                  标注名称
                </span>
                <input
                  className="mt-2 h-9 w-full rounded-lg border border-[#dfe5ed] px-3 text-[10px] font-bold outline-none focus:border-[#8ca5da]"
                  placeholder="例如：收入增速异常"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="text-[10px] font-black text-[#526078]">
                    业务循环
                  </span>
                  <select className="mt-2 h-9 w-full rounded-lg border border-[#dfe5ed] bg-white px-3 text-[10px] font-bold text-[#526078]">
                    <option>销售与收款</option>
                    <option>生产与存货</option>
                    <option>货币资金</option>
                  </select>
                </label>
                <label>
                  <span className="text-[10px] font-black text-[#526078]">
                    执行方式
                  </span>
                  <select className="mt-2 h-9 w-full rounded-lg border border-[#dfe5ed] bg-white px-3 text-[10px] font-bold text-[#526078]">
                    <option>规则引擎</option>
                    <option>大模型</option>
                    <option>AI + 人工</option>
                    <option>人工执行</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-black text-[#526078]">
                  适用范围 Scope
                </span>
                <div className="mt-2 rounded-lg border border-[#dfe5ed] p-3">
                  <div className="flex items-center gap-2 text-[9px] font-bold text-[#63728a]">
                    <Filter className="h-3.5 w-3.5 text-[#4b70c4]" />
                    实体类型、行业、业务类型与审计阶段
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["年报审计", "制造业", "全部实体"].map((item) => (
                      <span
                        key={item}
                        className="rounded bg-[#eef3ff] px-2 py-1 text-[8px] font-black text-[#4867aa]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </label>
              <label className="block">
                <span className="text-[10px] font-black text-[#526078]">
                  判断说明
                </span>
                <textarea
                  className="mt-2 h-24 w-full resize-none rounded-lg border border-[#dfe5ed] p-3 text-[10px] font-bold outline-none focus:border-[#8ca5da]"
                  placeholder="描述在什么情况下检查什么、如何判断结论…"
                />
              </label>
              <div className="rounded-lg bg-[#f1f5ff] p-3">
                <div className="flex items-center gap-2 text-[9px] font-black text-[#405f9f]">
                  <Sparkles className="h-3.5 w-3.5" />
                  华小安可根据描述生成条件表达式和字段草稿
                </div>
              </div>
            </div>
            <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-[#e7eaf0] bg-white px-5 py-4">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 rounded-lg px-4 text-[9px] font-black text-[#748197] hover:bg-[#f2f4f7]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white"
              >
                <Check className="h-3.5 w-3.5" />
                保存为草稿
              </button>
            </footer>
          </section>
        </div>
      )}

      {showProject && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-[#17213a]/32 p-6"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setShowProject(false)
          }
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="新建审计项目"
            className="audit-project-dialog flex h-[min(88vh,800px)] min-h-[640px] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_18px_50px_rgba(31,45,72,0.22)]"
          >
            <header className="border-b border-[#e5e9f0] px-7 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-[-0.01em] text-[#263754]">
                    新建审计项目
                  </h2>
                  <p className="mt-1.5 text-xs font-bold text-[#748299]">
                    完成基础资料录入，创建后再执行参数计算与 Scope 匹配
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProject(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-[#7b889c] hover:bg-[#f1f3f6]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-6 grid grid-cols-4">
                {[
                  ["1", "项目资料"],
                  ["2", "财务报表"],
                  ["3", "客户材料"],
                  ["4", "确认创建"],
                ].map(([number, label], index) => (
                  <li key={number} className="relative text-center">
                    {index < 3 && (
                      <span
                        className={`absolute left-1/2 top-[14px] h-px w-full ${projectStep > index + 1 ? "bg-[#2459c4]" : "bg-[#dce3ed]"}`}
                      />
                    )}
                    <span
                      className={`relative z-10 mx-auto grid h-7 w-7 place-items-center rounded-full text-[10px] font-black ${projectStep > index + 1 ? "bg-[#2459c4] text-white" : projectStep === index + 1 ? "border-[5px] border-[#2459c4] bg-white text-transparent" : "border border-[#cdd6e4] bg-white text-[#8995a8]"}`}
                    >
                      {projectStep > index + 1 ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        number
                      )}
                    </span>
                    <span
                      className={`mt-2 block text-[10px] font-black ${projectStep === index + 1 ? "text-[#315cb3]" : "text-[#7f8ca0]"}`}
                    >
                      {label}
                    </span>
                  </li>
                ))}
              </ol>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-7 custom-scrollbar">
              {projectStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-[#2e3e59]">
                      项目与客户资料
                    </h3>
                    <p className="mt-1 text-[9px] font-bold text-[#8d98aa]">
                      这些信息用于完成第一层 Scope 过滤。
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="col-span-2">
                      <span className="text-[10px] font-black text-[#536179]">
                        项目名称
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                        value={projectForm.name}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        客户名称
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                        value={projectForm.client}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            client: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        审计期间
                      </span>
                      <input
                        type="text"
                        className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                        value={projectForm.period}
                        onChange={(event) =>
                          setProjectForm((current) => ({
                            ...current,
                            period: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        业务类型
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>财务报表审计 audit</option>
                        <option>财务报表审阅 review</option>
                        <option>商定程序 agreed_procedures</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        实体类型
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>民营企业</option>
                        <option>国有企业</option>
                        <option>上市公司</option>
                        <option>拟上市公司</option>
                        <option>金融机构</option>
                        <option>行政事业单位</option>
                        <option>非营利组织</option>
                        <option>境外企业</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        所属行业
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>制造业</option>
                        <option>批发和零售业</option>
                        <option>建筑业</option>
                        <option>房地产业</option>
                        <option>金融业</option>
                        <option>信息技术与软件</option>
                        <option>能源与矿业</option>
                        <option>交通运输与物流</option>
                        <option>医药与医疗健康</option>
                        <option>教育</option>
                        <option>农林牧渔业</option>
                        <option>住宿和餐饮业</option>
                        <option>文化、体育和娱乐业</option>
                        <option>公共事业</option>
                        <option>其他行业</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        项目负责人
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>符金雨</option>
                        <option>陈华</option>
                        <option>李敏</option>
                        <option>王晨</option>
                        <option>赵宁</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        统一社会信用代码
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                        defaultValue="91310000MA1K3X8G6P"
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        注册地
                      </span>
                      <input
                        className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                        defaultValue="上海市"
                      />
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        财务报告准则
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>企业会计准则</option>
                        <option>小企业会计准则</option>
                        <option>政府会计准则</option>
                        <option>国际财务报告准则 IFRS</option>
                        <option>香港财务报告准则 HKFRS</option>
                        <option>美国公认会计原则 US GAAP</option>
                      </select>
                    </label>
                    <label>
                      <span className="text-[10px] font-black text-[#536179]">
                        项目属性
                      </span>
                      <select className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] bg-white px-3 text-[11px] font-bold text-[#536179]">
                        <option>单体审计</option>
                        <option>集团审计（集团主审）</option>
                        <option>组成部分审计</option>
                        <option>首次承接审计</option>
                        <option>连续审计</option>
                        <option>专项审计</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}
              {projectStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-black text-[#2e3e59]">
                      财务报表上传与解析
                    </h3>
                    <p className="mt-1 text-[9px] font-bold text-[#8d98aa]">
                      上传结构化财务文件，由本地程序解析字段；解析结果需要人工核对。
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      [
                        "statements",
                        "财务报表",
                        "资产负债表、利润表、现金流量表",
                      ],
                      ["balance", "科目余额表", "期初、本期发生额与期末余额"],
                    ].map(([key, title, note]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-dashed border-[#c7d2e3] bg-[#fafbfc] p-4 transition-colors hover:border-[#8ea6cf]"
                      >
                        <label className="block cursor-pointer rounded focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#6687c7]">
                          <input
                            type="file"
                            multiple
                            accept=".xlsx,.xls,.csv,.pdf"
                            className="sr-only"
                            onChange={(event) => {
                              const selectedFiles = event.currentTarget.files;
                              const names = selectedFiles
                                ? Array.from(selectedFiles, (file) =>
                                    (file as File).name,
                                  )
                                : [];
                              if (!names.length) return;
                              setFinancialUploads((current) => ({
                                ...current,
                                [key]: Array.from(
                                  new Set([...(current[key] ?? []), ...names]),
                                ),
                              }));
                              event.target.value = "";
                            }}
                          />
                          <span className="text-[10px] font-black text-[#40516c]">
                            ＋ 上传{title}
                          </span>
                        </label>
                        <small className="mt-1 block text-[8px] font-bold text-[#8793a7]">
                          {note} · 支持多选或分次添加
                        </small>
                        <div className="mt-3 border-t border-[#e4e8ef] pt-2">
                          {(financialUploads[key]?.length ?? 0) > 0 ? (
                            <ul className="space-y-1.5" aria-label={`已选择的${title}`}>
                              {financialUploads[key].map((fileName) => (
                                <li
                                  key={fileName}
                                  className="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-[8px] font-black text-emerald-700"
                                >
                                  <span className="min-w-0 flex-1 truncate">{fileName}</span>
                                  <button
                                    type="button"
                                    aria-label={`移除 ${fileName}`}
                                    onClick={() =>
                                      setFinancialUploads((current) => ({
                                        ...current,
                                        [key]: (current[key] ?? []).filter(
                                          (name) => name !== fileName,
                                        ),
                                      }))
                                    }
                                    className="grid h-5 w-5 shrink-0 place-items-center rounded text-[#8491a5] hover:bg-[#eef1f5] hover:text-[#40516c] focus:outline focus:outline-2 focus:outline-[#6687c7]"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="block text-[8px] font-black text-[#8a96a8]">
                              尚未选择文件
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-y border-[#e2e7ee] px-2 py-2 text-[9px] font-bold text-[#64738a]">
                    <span>
                      本地解析：表头识别、期间校验、单位换算、勾稽关系检查
                    </span>
                    <span
                      className={`font-black ${financialUploads.statements?.length && financialUploads.balance?.length ? "text-emerald-700" : "text-amber-700"}`}
                    >
                      {financialUploads.statements?.length &&
                      financialUploads.balance?.length
                        ? `已选择 ${financialUploads.statements.length + financialUploads.balance.length} 个文件 · 待人工核对`
                        : "请先上传两个必需文件"}
                    </span>
                  </div>
                  <h4 className="text-[10px] font-black text-[#40516c]">
                    已提取关键字段
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      ["税前利润（万元）", "3,000"],
                      ["营业收入（万元）", "60,000"],
                      ["总资产（万元）", "85,000"],
                    ].map(([label, value]) => (
                      <label key={label}>
                        <span className="text-[10px] font-black text-[#536179]">
                          {label}
                        </span>
                        <input
                          className="mt-2 h-10 w-full rounded-lg border border-[#dce3ed] px-3 text-[11px] font-bold outline-none focus:border-[#839ed6]"
                          defaultValue={value}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {projectStep === 3 && (
                <div className="space-y-5">
                  <div className="max-w-[620px]">
                    <h3 className="text-sm font-black text-[#2e3e59]">
                      客户材料上传
                    </h3>
                    <p className="mt-1 text-[9px] font-bold text-[#8d98aa]">
                      可上传访谈纪要、会议材料、业务说明或其他项目资料。此步骤为可选，不限制资料类型。
                    </p>
                  </div>
                  <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#b9c8dc] bg-[#fafbfc] px-6 py-5 text-center transition-colors hover:border-[#7895c5] hover:bg-[#f7f9fd] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#6687c7]">
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const selectedFiles = event.currentTarget.files;
                        const names = selectedFiles
                          ? Array.from(selectedFiles, (file) =>
                              (file as File).name,
                            )
                          : [];
                        if (!names.length) return;
                        setClientUploads((current) =>
                          Array.from(new Set([...current, ...names])),
                        );
                        event.currentTarget.value = "";
                      }}
                    />
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eef9] text-[#315ca9]">
                      <Plus className="h-4 w-4" />
                    </span>
                    <strong className="mt-2 text-[10px] font-black text-[#40516c]">
                      选择客户资料
                    </strong>
                    <small className="mt-1 text-[8px] font-bold text-[#8793a7]">
                      支持任意文件类型，可一次多选或分次添加
                    </small>
                  </label>

                  <section aria-labelledby="uploaded-materials-title">
                    <div className="flex items-center justify-between border-b border-[#e2e7ee] pb-2">
                      <h4
                        id="uploaded-materials-title"
                        className="text-[10px] font-black text-[#40516c]"
                      >
                        已添加资料
                        <span className="ml-1.5 font-bold text-[#8793a7]">
                          {clientUploads.length}
                        </span>
                      </h4>
                      <span className="text-[8px] font-bold text-[#8793a7]">
                        Scope 匹配将在项目创建后执行
                      </span>
                    </div>
                    {clientUploads.length ? (
                      <ul className="mt-2 grid grid-cols-2 gap-2">
                        {clientUploads.map((fileName) => (
                          <li
                            key={fileName}
                            className="flex min-w-0 items-center gap-2 rounded-lg bg-[#f7f9fc] px-3 py-2.5"
                          >
                            <span className="min-w-0 flex-1 truncate text-[9px] font-black text-[#536179]">
                              {fileName}
                            </span>
                            <button
                              type="button"
                              aria-label={`移除 ${fileName}`}
                              onClick={() =>
                                setClientUploads((current) =>
                                  current.filter((name) => name !== fileName),
                                )
                              }
                              className="grid h-6 w-6 shrink-0 place-items-center rounded text-[#8793a7] hover:bg-white hover:text-[#40516c] focus:outline focus:outline-2 focus:outline-[#6687c7]"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="py-5 text-center text-[9px] font-bold text-[#9aa4b3]">
                        暂未添加资料，可直接进入下一步
                      </p>
                    )}
                  </section>
                </div>
              )}
              {projectStep === 4 && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black text-[#2e3e59]">
                        确认项目信息
                      </h3>
                      <p className="mt-1 text-[9px] font-bold text-[#8d98aa]">
                        请核对基础信息与文件数量。创建项目不会直接启动 DAG。
                      </p>
                    </div>
                    <span className="rounded-md bg-[#eef2f8] px-2 py-1 text-[8px] font-black text-[#66758b]">
                      待创建
                    </span>
                  </div>
                  <section className="overflow-hidden rounded-xl border border-[#dfe5ee]">
                    <div className="border-b border-[#e8ecf2] bg-[#fafbfc] px-4 py-3">
                      <h4 className="text-xs font-black text-[#30415e]">
                        {projectForm.name}
                      </h4>
                      <p className="mt-1 text-[8px] font-bold text-[#8d98aa]">
                        {projectForm.period} · 年度审计
                      </p>
                    </div>
                    <dl className="grid grid-cols-2 divide-x divide-y divide-[#edf0f4] text-[9px]">
                      {[
                        ["客户", projectForm.client],
                        ["项目负责人", "符金雨"],
                        ["客户类型与行业", "民营企业 · 制造业"],
                        [
                          "财务文件",
                          `${(financialUploads.statements?.length ?? 0) + (financialUploads.balance?.length ?? 0)} 个`,
                        ],
                        ["客户资料", `${clientUploads.length} 个（可选）`],
                        ["DAG 状态", "未启动"],
                      ].map(([label, value]) => (
                        <div key={label} className="min-h-14 px-4 py-3">
                          <dt className="font-bold text-[#909bad]">{label}</dt>
                          <dd className="mt-1 font-black text-[#455570]">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <section className="rounded-xl bg-[#f4f7fd] p-4">
                    <h4 className="text-[10px] font-black text-[#3d5278]">
                      创建项目后
                    </h4>
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[
                        [
                          "参数计算",
                          "系统计算重要性参数，提交项目经理确认",
                        ],
                        ["Scope 匹配", "依据项目资料生成候选标注集"],
                        [
                          "人工审核与启动",
                          "候选集确认并冻结后，才启动 DAG",
                        ],
                      ].map(([title, note], index) => (
                        <div key={title} className="flex items-start gap-2">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-[8px] font-black text-[#315ca9]">
                            {index + 1}
                          </span>
                          <p className="text-[8px] font-bold leading-relaxed text-[#71809a]">
                            <strong className="text-[9px] text-[#40516c]">
                              {title}
                            </strong>
                            <br />
                            {note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
              {projectStep === 5 && (
                <div className="flex min-h-[430px] flex-col items-center justify-center text-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-7 w-7" />
                  </span>
                  <h3 className="mt-4 text-base font-black text-[#2b3d5a]">
                    项目已创建
                  </h3>
                  <p className="mt-2 max-w-[360px] text-[9px] font-bold leading-relaxed text-[#7d8ba1]">
                    下一步由项目经理确认并锁定重要性参数，确认后自动进入候选标注集人工审核。
                  </p>
                  <div className="mt-5 grid w-full max-w-[420px] grid-cols-3 gap-2">
                    {[
                      ["项目空间", "已创建"],
                      ["重要性参数", "待确认"],
                      ["审计 DAG", "未启动"],
                    ].map(([label, status]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-[#e0e6ee] px-3 py-3"
                      >
                        <span className="block text-[8px] font-bold text-[#8b97aa]">
                          {label}
                        </span>
                        <strong
                          className={`mt-1 block text-[10px] font-black ${status === "已创建" ? "text-emerald-700" : "text-amber-700"}`}
                        >
                          {status}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <footer className="flex items-center justify-between border-t border-[#e5e9f0] bg-[#fafbfc] px-7 py-4">
              {projectStep < 5 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      projectStep === 1
                        ? setShowProject(false)
                        : setProjectStep((step) => step - 1)
                    }
                    className="h-9 rounded-lg px-4 text-[9px] font-black text-[#687890] hover:bg-[#eef1f5]"
                  >
                    {projectStep === 1 ? "取消" : "上一步"}
                  </button>
                  <button
                    type="button"
                    disabled={
                      (projectStep === 1 &&
                        (!projectForm.name.trim() ||
                          !projectForm.client.trim() ||
                          !projectForm.period.trim())) ||
                      (projectStep === 2 &&
                        (!financialUploads.statements?.length ||
                          !financialUploads.balance?.length))
                    }
                    onClick={() => {
                      if (projectStep !== 4) {
                        setProjectStep((step) => step + 1);
                        return;
                      }
                      const id = `project-${Date.now()}`;
                      setCreatedProjects((current) => [
                        ...current,
                        { id, ...projectForm },
                      ]);
                      setLatestCreatedProjectId(id);
                      setProjectStep(5);
                    }}
                    className="flex h-9 min-w-[132px] items-center justify-center gap-1.5 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white hover:bg-[#194db3] disabled:cursor-not-allowed disabled:bg-[#b9c5d8]"
                  >
                    {projectStep === 4 ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        确认创建项目
                      </>
                    ) : (
                      <>
                        下一步
                        <ChevronRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowProject(false)}
                    className="h-9 rounded-lg px-4 text-[9px] font-black text-[#687890] hover:bg-[#eef1f5]"
                  >
                    稍后处理
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProject(false);
                      setMaterialityConfirmed(false);
                      setProjectGraphReady(false);
                      setView("graph");
                      setPreparationProjectId(latestCreatedProjectId);
                      setPreparationRequest((request) => request + 1);
                    }}
                  className="flex h-9 min-w-[132px] items-center justify-center gap-1.5 rounded-lg bg-[#2459c4] px-4 text-[9px] font-black text-white hover:bg-[#194db3]"
                  >
                    确认重要性参数
                  </button>
                </>
              )}
            </footer>
          </section>
        </div>
      )}
      <AgentDock
        open={agentPanelOpen}
        onToggle={() => onToggleAgentPanel?.()}
        panelWidth={agentPanelWidth}
        onWidthChange={setAgentPanelWidth}
        reference={reference}
        onClearReference={() => setReference("")}
        agent={agent}
        onAgentChange={setAgent}
        onNewRule={() => setShowCreate(true)}
        onNewProject={() => {
          setProjectStep(1);
          setShowProject(true);
        }}
      />
    </div>
  );
}
