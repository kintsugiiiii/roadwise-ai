import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Folder,
  FileSpreadsheet,
  FileText,
  Layers,
  Link2,
  LockKeyhole,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { AgentSVGAvatar } from './AgentSVGAvatar';

type HRScreen = 'home' | 'chat' | 'workbench';
type AbilityId =
  | 'roster'
  | 'contract'
  | 'probation'
  | 'leave'
  | 'certificate'
  | 'selfCheck'
  | 'bidQualification'
  | 'permission';

interface HRManagementAgentViewProps {
  selectedSubItemId: string | null;
  onOpenMainWorkbench: () => void;
}

interface HRSessionViewState {
  screen: HRScreen;
  selectedAbilityId: AbilityId;
  inputText: string;
}

interface AbilityConfig {
  id: AbilityId;
  title: string;
  scope: string;
  desc: string;
  icon: LucideIcon;
  accent: string;
  guideTitle: string;
  required: string[];
  starter: string;
  examples: string[];
  toolFlow: string[];
  outputs: string[];
  workbenchTitle: string;
}

const abilityConfigs: AbilityConfig[] = [
  {
    id: 'roster',
    title: '花名册管理',
    scope: '查询 / 新增 / 修改 / 字段校验',
    desc: '围绕正式员工、试用期员工、实习生、离职人员等 Sheet 做人员信息维护。',
    icon: Users,
    accent: 'bg-slate-900 text-white',
    guideTitle: '可以直接帮你处理这些花名册工作：',
    required: ['快速查人：按姓名、部门、状态查员工', '维护信息：新增员工、更新岗位和联系方式', '检查异常：发现合同日期、入离职日期缺失', '导出清单：生成在职、试用、实习、离职名单'],
    starter: '帮我查询业务三部在职员工，并检查合同终止日期是否缺失。',
    examples: [
      '把试用期员工里 2026 年 7 月入职的人员列出来',
      '帮我检查花名册里合同开始日期为空的人员',
      '新增一名实习生，字段我下一步补充',
    ],
    toolFlow: ['识别人员范围', '读取花名册 Sheet', '字段校验', '必要时写入变更记录'],
    outputs: ['人员清单', '异常字段提示', '可写回的变更草稿'],
    workbenchTitle: '花名册字段缺失确认',
  },
  {
    id: 'contract',
    title: '合同到期提醒',
    scope: '到期扫描 / 续签提醒 / 待办生成',
    desc: '根据合同开始日期、合同终止日期识别近期到期人员，并生成提醒事项。',
    icon: CalendarClock,
    accent: 'bg-rose-50 text-rose-700 border border-rose-100',
    guideTitle: '可以帮你盯住合同到期和续签事项：',
    required: ['扫描到期：找出 30/60 天内到期人员', '生成提醒：给 HR 或负责人创建续签待办', '核对缺失：发现合同起止日期为空的人员', '导出清单：输出合同到期人员明细'],
    starter: '帮我查 30 天内合同到期人员，并生成 HR 待办清单。',
    examples: [
      '扫描 60 天内合同到期的正式员工',
      '只看业务五部合同即将到期人员',
      '给合同到期人员生成续签提醒单',
    ],
    toolFlow: ['读取正式员工 Sheet', '计算合同终止日期', '过滤到期范围', '同步工作台待办'],
    outputs: ['合同到期清单', '续签提醒单', 'Work 工作台待办'],
    workbenchTitle: '确认 30 天内合同到期人员',
  },
  {
    id: 'probation',
    title: '试用期转正评估',
    scope: '到期提醒 / 超期风险 / 部门反馈',
    desc: '从试用期员工 Sheet 识别试用期到期人员，沉淀为待评估事项。',
    icon: ClipboardCheck,
    accent: 'bg-amber-50 text-amber-700 border border-amber-100',
    guideTitle: '可以帮你跟进试用期转正事项：',
    required: ['找待转正：列出本周、本月到期人员', '标超期风险：提示已过期未处理员工', '发起反馈：给部门负责人生成评估待办', '生成表单：输出转正评估清单'],
    starter: '帮我整理本月试用期到期人员，标出已超期风险，并生成部门反馈待办。',
    examples: [
      '查看本周试用期到期人员',
      '列出已经超过试用期但未处理的人',
      '给业务部门生成转正评估待办',
    ],
    toolFlow: ['读取试用期员工 Sheet', '匹配试用期到期日', '识别超期风险', '生成负责人反馈事项'],
    outputs: ['转正评估清单', '超期风险提示', '部门反馈待办'],
    workbenchTitle: '试用期转正评估提醒',
  },
  {
    id: 'leave',
    title: '年假额度核算',
    scope: '工龄规则 / 年中入职折算',
    desc: '根据入职日期、规则口径和人员范围计算年假额度。',
    icon: Calendar,
    accent: 'bg-blue-50 text-blue-700 border border-blue-100',
    guideTitle: '可以帮你核算和解释年假额度：',
    required: ['算额度：按入职日期和工龄计算年假', '做折算：处理年中入职、离职的年假', '查明细：查看个人或部门年假结果', '出说明：列出计算依据和待确认项'],
    starter: '按公司规则核算 2026 年年假额度，并标出年中入职需要折算的人。',
    examples: [
      '计算某员工 2026 年年假',
      '业务四部年假额度汇总',
      '按年中入职折算规则重新计算',
    ],
    toolFlow: ['读取入职日期', '应用工龄规则', '处理年中折算', '输出核算表'],
    outputs: ['年假额度表', '折算说明', '待人工确认项'],
    workbenchTitle: '年假规则口径确认',
  },
  {
    id: 'certificate',
    title: 'CPA 证照追踪',
    scope: 'CPA 年检 / 证照状态 / 资质清单',
    desc: '读取 CPA 详情，跟踪证书、连续执业年限、年检和投标资质。',
    icon: ShieldCheck,
    accent: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    guideTitle: '可以帮你管理 CPA 证照和资质信息：',
    required: ['查证照：查看 CPA 状态、年检和有效期', '做年检清单：列出待确认人员', '整理资质：生成投标可用人员清单', '保护隐私：证件号默认脱敏并留痕'],
    starter: '帮我查看 CPA 年检待确认人员，并生成投标可用资质清单。',
    examples: [
      '列出 CPA 连续执业年限超过 10 年人员',
      '生成投标资质清单',
      '查看某员工的 CPA 状态，证件号脱敏',
    ],
    toolFlow: ['读取 CPA 详情 Sheet', '识别证照状态', '敏感字段脱敏', '生成资质清单'],
    outputs: ['CPA 年检清单', '投标资质清单', '敏感字段访问日志'],
    workbenchTitle: 'CPA 证照年检清单复核',
  },
  {
    id: 'selfCheck',
    title: '自查报告生成',
    scope: '模板读取 / 字段填充 / 缺失确认',
    desc: '基于监管自查报告模板，从花名册和基础信息中自动预填字段。',
    icon: FileText,
    accent: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    guideTitle: '可以帮你把自查报告先填起来：',
    required: ['读模板：识别自查表需要填写的内容', '自动预填：从花名册带出人数和基础信息', '找缺口：列出系统填不了的项目', '生成待办：交给 HR 逐项确认'],
    starter: '读取自查报告模板，先帮我预填基础信息，并列出缺失项。',
    examples: [
      '生成自查报告基础信息表',
      '统计正式员工、试用期员工、实习生人数',
      '列出模板里无法自动填充的字段',
    ],
    toolFlow: ['读取自查报告模板', '映射花名册字段', '自动预填', '生成缺失确认待办'],
    outputs: ['预填报告草稿', '缺失字段清单', '工作台确认事项'],
    workbenchTitle: '监管自查报告基础信息填充',
  },
  {
    id: 'bidQualification',
    title: '投标资质清单',
    scope: '人员资质 / CPA / 可导出清单',
    desc: '面向投标场景汇总人员、证照、职级等可用资质信息。',
    icon: Layers,
    accent: 'bg-cyan-50 text-cyan-700 border border-cyan-100',
    guideTitle: '可以帮你快速整理投标可用资质：',
    required: ['匹配要求：按项目条件筛选人员', '汇总资质：合并 CPA、职级、证书信息', '生成材料：输出投标清单或说明表', '脱敏导出：去掉手机号、身份证等信息'],
    starter: '帮我按投标要求生成可用人员资质清单，先列出 CPA 和职级信息。',
    examples: [
      '生成投标可用 CPA 清单',
      '按职级和证书整理人员资质',
      '只导出不包含手机号和身份证的版本',
    ],
    toolFlow: ['解析投标要求', '读取 CPA 与职级表', '合并人员信息', '导出脱敏清单'],
    outputs: ['投标资质清单', '脱敏导出版', '缺失资质提示'],
    workbenchTitle: '投标资质清单缺失项确认',
  },
  {
    id: 'permission',
    title: '敏感字段权限',
    scope: '脱敏 / 授权 / 操作日志',
    desc: '对身份证、手机号、工资职级、证书编号等字段进行权限控制。',
    icon: LockKeyhole,
    accent: 'bg-pink-50 text-pink-700 border border-pink-100',
    guideTitle: '可以帮你控制敏感信息的查看和导出：',
    required: ['按角色放行：判断谁能看哪些字段', '自动脱敏：隐藏身份证、手机号等信息', '记录日志：保存查看、导出和修改痕迹', '导出合规版：生成不含敏感字段的清单'],
    starter: '帮我查看合同到期人员，但身份证和手机号只展示脱敏版本。',
    examples: [
      '导出不含敏感字段的合同到期清单',
      '查看工资职级需要记录操作日志',
      '普通员工只能看自己的哪些信息',
    ],
    toolFlow: ['识别账号角色', '匹配字段权限', '敏感信息脱敏', '记录操作日志'],
    outputs: ['脱敏清单', '权限说明', '操作日志'],
    workbenchTitle: '敏感字段查看申请',
  },
];

const connectedSources = ['花名册', '员工电子档案', '合同库', '自定义模板', 'OA系统'];

const hrDataViews = [
  {
    id: 'roster',
    title: '花名册',
    subtitle: '表格视图 · 分 Sheet · 权限字段',
    icon: Users,
    count: '8 个 Sheet',
    stats: ['在册 86 人', '新增 3 人', '修改 5 人'],
    details: ['正式员工、试用期员工、实习生、离职人员分 Sheet 查看', '支持搜索、筛选、排序和点击人员详情', '身份证、手机号、工资职级按权限脱敏展示'],
  },
  {
    id: 'contractArchive',
    title: '合同库',
    subtitle: '列表视图 · 原文 · 审查历史',
    icon: FileText,
    count: '124 份',
    stats: ['30 天到期 6 份', '待签署 3 份', '修订中 1 份'],
    details: ['按员工、合同类型、到期时间筛选', '点击查看合同原文、审查历史和续签记录', '合同确认后回写花名册并生成下一轮提醒'],
  },
  {
    id: 'selfCheckTemplate',
    title: '自查模板',
    subtitle: '预览下载 · 历史版本 · 字段映射',
    icon: ClipboardCheck,
    count: '7 月版',
    stats: ['5 张附表', '2 个缺失字段', '1 个新字段'],
    details: ['支持模板预览、下载和历史版本查看', '从花名册自动填充人数、部门、任职信息', '无法自动判定字段生成待办进入待办提醒'],
  },
  {
    id: 'employeeArchive',
    title: '员工电子档案',
    subtitle: '人员 -> 材料类型 · OCR 归档',
    icon: Folder,
    count: '312 份材料',
    stats: ['合同 124 份', '证照 68 份', '学历材料 42 份'],
    details: ['按人员和材料类型归档身份证明、学历证书、资格证书', '合同、实习协议等材料归档后写入消息动态', '查看、下载和导出均需权限控制并记录日志'],
  },
];

const hrWorkbenchTasks = [
  { id: 'T-10', title: '李四-合同即将到期，剩余 30 天', meta: 'OA 合同库到期 · 高风险置顶', tag: '合同到期', owner: 'HR', state: '待处理', button: '发起续签', risk: '高' },
  { id: 'T-13', title: 'CPA 年检即将到期（4 人）', meta: 'OA 证照库到期 · 批量待办', tag: '证照处理', owner: '授权人事', state: '待处理', button: '查看清单', risk: '中' },
  { id: 'T-05', title: '张三-合同续签待确认', meta: '同一人员待办已聚合 · 关联劳动合同', tag: '流程处理', owner: 'HR', state: '处理中', button: '确认采纳', risk: '中' },
  { id: 'T-02', title: '7 月自查报告待审核', meta: 'Agent 生成自查 · 2 个字段需人工核实', tag: '审核确认', owner: 'HR', state: '待确认', button: '确认提交', risk: '低' },
];

const hrDynamics = [
  { time: '15:30', text: '7 月自查报告已提交。提交时间: 2026-07-09 15:30。' },
  { time: '14:20', text: '花名册（7 月版）导入存在数据冲突: 3 处不一致已生成待办。' },
  { time: '14:18', text: '花名册（7 月版）已导入。变更: 新增 3 人，修改 5 人，离职 2 人。' },
  { time: '14:12', text: '自查报告模板（7 月）已更新。新模板新增字段: 政治面貌。' },
  { time: '13:56', text: '张三敏感字段已更新。变更: 基本工资。操作已记录审计日志。' },
];

const getAbilityById = (id: AbilityId) => abilityConfigs.find(item => item.id === id) || abilityConfigs[1];

export default function HRManagementAgentView({ selectedSubItemId, onOpenMainWorkbench }: HRManagementAgentViewProps) {
  const [screen, setScreen] = useState<HRScreen>('home');
  const [selectedAbilityId, setSelectedAbilityId] = useState<AbilityId>('contract');
  const [inputText, setInputText] = useState('');
  const [activeDataViewId, setActiveDataViewId] = useState(hrDataViews[0].id);
  const [workbenchTasks, setWorkbenchTasks] = useState(hrWorkbenchTasks);
  const [dynamicMessages, setDynamicMessages] = useState(hrDynamics);
  const sessionKey = selectedSubItemId || 'hr-home';
  const isFreshAgentSession = selectedSubItemId?.includes('-session-') ?? false;
  const sessionStateRef = useRef<Record<string, HRSessionViewState>>({});
  const activeSessionKeyRef = useRef(sessionKey);
  const skipNextPersistRef = useRef(false);

  const selectedAbility = getAbilityById(selectedAbilityId);

  useEffect(() => {
    if (activeSessionKeyRef.current === sessionKey) return;

    sessionStateRef.current[activeSessionKeyRef.current] = {
      screen,
      selectedAbilityId,
      inputText,
    };

    const savedState = sessionStateRef.current[sessionKey];
    const defaultState: HRSessionViewState = isFreshAgentSession
      ? { screen: 'home', selectedAbilityId: 'contract', inputText: '' }
      : selectedSubItemId
        ? { screen: 'chat', selectedAbilityId: 'roster', inputText: abilityConfigs[0].starter }
        : { screen: 'home', selectedAbilityId: 'contract', inputText: '' };
    const nextState = savedState || defaultState;

    skipNextPersistRef.current = true;
    activeSessionKeyRef.current = sessionKey;
    setScreen(nextState.screen);
    setSelectedAbilityId(nextState.selectedAbilityId);
    setInputText(nextState.inputText);
  }, [inputText, isFreshAgentSession, screen, selectedAbilityId, selectedSubItemId, sessionKey]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    sessionStateRef.current[sessionKey] = {
      screen,
      selectedAbilityId,
      inputText,
    };
  }, [inputText, screen, selectedAbilityId, sessionKey]);

  const handleAbilityClick = (ability: AbilityConfig) => {
    setSelectedAbilityId(ability.id);
    setInputText(ability.starter);
    setScreen('chat');
  };

  const activeDataView = hrDataViews.find(item => item.id === activeDataViewId) || hrDataViews[0];

  const moveTaskToDynamics = (taskId: string, action: 'done' | 'ignored') => {
    const task = workbenchTasks.find(item => item.id === taskId);
    if (!task) return;

    const actionText = action === 'done'
      ? `${task.title} 已完成，来源 ${task.id}，操作入口: 工作台。`
      : `${task.title} 已忽略，已记录忽略原因和操作人，来源 ${task.id}。`;
    setWorkbenchTasks(items => items.filter(item => item.id !== taskId));
    setDynamicMessages(items => [
      { time: '刚刚', text: actionText },
      ...items,
    ]);
  };

  return (
    <div className="h-full bg-[#f4f5f8] flex flex-col overflow-hidden text-[#181c23]">
      {screen === 'home' && (
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_50%_18%,rgba(219,232,255,0.95)_0%,rgba(244,247,252,0.9)_28%,#f6f8fb_70%)] px-5 py-4">
          <section className="max-w-[940px] mx-auto min-h-full -translate-y-8 flex flex-col items-center justify-center py-6">
            <div className="-translate-y-8 flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[conic-gradient(from_160deg,rgba(14,165,233,0.10),rgba(99,102,241,0.34),rgba(255,255,255,0.72),rgba(14,165,233,0.10))] blur-xl" />
                <div className="absolute -inset-2 rounded-full border border-white/80 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
                <div className="relative rounded-[22px] bg-white/70 p-1.5 shadow-[0_16px_36px_rgba(34,69,127,0.18)] ring-1 ring-white/90 backdrop-blur">
                  <AgentSVGAvatar id="agent-人事" size="hr" />
                </div>
                <span className="absolute right-0 bottom-2 w-7 h-7 rounded-xl bg-sky-600 border-[3px] border-white shadow-[0_8px_16px_rgba(2,132,199,0.22)] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </span>
              </div>
              <h1 className="mt-5 text-[29px] font-black tracking-tight text-gray-950">人事管理助手</h1>
              <h2 className="mt-2 text-[17px] font-black tracking-tight text-gray-700">有什么需要我协助吗？</h2>
              <p className="mt-2.5 text-[12px] font-bold text-gray-500 leading-relaxed">
                我可以帮你处理员工信息、合同管理、试用期提醒等各类人事工作
              </p>
            </div>

            <div className="mt-3 w-full rounded-xl border border-[#dfe2ed] bg-white shadow-[0_10px_28px_rgba(18,27,46,0.07)] overflow-hidden">
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="输入问题，或使用 / 调用能力"
                className="w-full h-[76px] resize-none bg-transparent px-4 py-3 outline-none text-[13px] font-semibold text-gray-800 placeholder:text-gray-400"
              />
              <div className="h-11 flex items-center justify-between gap-3 border-t border-gray-100 px-3">
                <div className="flex items-center gap-1 min-w-0 text-[11px] font-bold text-gray-500">
                  <button type="button" className="h-8 px-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 inline-flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    附加文件
                  </button>
                  <button type="button" className="h-8 px-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 inline-flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    选择连接
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button type="button" className="h-8 px-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 inline-flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    知识库
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button type="button" className="h-8 px-2 rounded-lg hover:bg-gray-50 hover:text-gray-800 inline-flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    Work in Folder
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[11px] font-black text-gray-600">
                  <button type="button" className="h-8 px-2 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#6266f1] text-white flex items-center justify-center text-[9px] font-black">D</span>
                    deepseek-v4-flash
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    title="发送"
                    onClick={() => setScreen('chat')}
                    className="w-8 h-8 rounded-full bg-gray-500 text-white hover:bg-gray-900 flex items-center justify-center"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </section>
        </main>
      )}

      {screen === 'chat' && (
        <main className="flex-1 min-h-0 grid grid-cols-[1fr_340px] overflow-hidden">
          <section className="min-w-0 flex flex-col bg-white">
            <div className="h-12 shrink-0 border-b border-gray-100 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                <MessageSquare className="w-4 h-4 text-gray-800" />
                人事管理助手会话
                <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-black">{selectedAbility.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setScreen('workbench')}
                className="h-7 px-2.5 rounded-md border border-gray-200 text-[10px] font-black text-gray-500 hover:text-gray-800"
              >
                查看工作台承接
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-6 space-y-5">
              <div className="flex justify-end">
                <div className="max-w-[620px] rounded-lg bg-gray-900 text-white px-4 py-3 text-sm font-semibold leading-relaxed">
                  我想处理：{selectedAbility.title}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-gray-900" />
                </div>
                <div className="max-w-[780px] space-y-3">
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                      {selectedAbility.guideTitle}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {selectedAbility.required.map(field => (
                        <div key={field} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                          <p className="text-[11px] font-bold text-gray-700 leading-relaxed">{field}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-[#f8f9fb] p-3">
                    <div className="flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-gray-700" />
                      <span className="text-[11px] font-black text-gray-900">可以直接这样说</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedAbility.examples.map(example => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setInputText(example)}
                          className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-[11px] font-bold text-gray-700 hover:border-gray-400 hover:text-gray-950"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-[120px_1fr_130px] bg-gray-50 px-3 py-2 text-[10px] font-black text-gray-400">
                      <span>处理对象</span>
                      <span>智能体动作</span>
                      <span>输出</span>
                    </div>
                    {selectedAbility.toolFlow.map((step, index) => (
                      <div key={step} className="grid grid-cols-[120px_1fr_130px] px-3 py-2.5 border-t border-gray-100 text-[11px] font-bold text-gray-700">
                        <span className="font-black text-gray-900">步骤 {index + 1}</span>
                        <span>{step}</span>
                        <span className="text-gray-500">{selectedAbility.outputs[index % selectedAbility.outputs.length]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-gray-100 p-4 bg-white">
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="补充范围、时间、人员或输出格式"
                  className="flex-1 bg-transparent outline-none text-sm font-semibold text-gray-800 placeholder:text-gray-400"
                />
                <button className="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          <aside className="border-l border-gray-200 bg-[#f7f8fa] p-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-xs font-black text-gray-900">能力路径</h3>
            <div className="mt-3 space-y-2">
              {[
                { icon: Sparkles, title: '意图识别', desc: selectedAbility.title },
                { icon: FileSpreadsheet, title: '表格解析', desc: '花名册 / 职级工资 / CPA 详情' },
                { icon: ShieldCheck, title: '权限判断', desc: '敏感字段脱敏与留痕' },
                { icon: Bell, title: '工作台承接', desc: selectedAbility.workbenchTitle },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-800" />
                      <span className="text-[11px] font-black text-gray-900">{item.title}</span>
                    </div>
                    <p className="mt-1 text-[10px] font-bold text-gray-400">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <h3 className="mt-5 text-xs font-black text-gray-900">本次可产出</h3>
            <div className="mt-3 space-y-2">
              {selectedAbility.outputs.map(doc => (
                <button key={doc} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-[11px] font-black text-gray-800 hover:border-gray-300 flex items-center justify-between">
                  <span>{doc}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span className="text-[11px] font-black text-amber-800">人工确认点</span>
              </div>
              <p className="mt-2 text-[11px] font-bold leading-relaxed text-amber-800">
                涉及修改、导出和敏感字段查看时，需要授权人事确认后再进入最终结果。
              </p>
            </div>
          </aside>
        </main>
      )}

      {screen === 'workbench' && (
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 bg-[#f4f5f8]">
          <section className="grid grid-cols-12 gap-5 items-stretch">
            <div className="col-span-12 lg:col-span-3 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col min-h-[620px] shadow-xs overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Data View</p>
                  <h2 className="mt-1 text-sm font-black text-[#24315f]">数据查看</h2>
                </div>
                <span className="px-2 py-1 rounded-lg bg-blue-50 text-[#0052d9] text-[9px] font-black">4 类数据</span>
              </div>

              <div className="mt-4 space-y-2">
                {hrDataViews.map(item => {
                  const Icon = item.icon;
                  const active = activeDataView.id === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveDataViewId(item.id)}
                      className={`w-full relative flex items-start gap-3 p-2.5 rounded-xl border transition-all text-left ${active ? 'bg-blue-50/80 border-blue-100/80 shadow-xs' : 'bg-gray-50/90 border-gray-100 hover:bg-white hover:border-gray-200'}`}
                    >
                      <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${active ? 'bg-white text-[#0052d9] border-blue-100' : 'bg-white text-gray-500 border-gray-100'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-black text-gray-800 truncate">{item.title}</p>
                          <span className={`shrink-0 text-[8px] font-black rounded px-1.5 py-0.5 ${active ? 'bg-white text-[#0052d9] border border-blue-100' : 'bg-gray-200/60 text-gray-500'}`}>{item.count}</span>
                        </div>
                        <p className="mt-0.5 text-[9px] font-bold text-gray-400 truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl bg-gray-50/90 border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-gray-500">{activeDataView.title}概览</span>
                  <span className="text-[9px] font-bold text-gray-400">今日</span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-1.5">
                  {activeDataView.stats.map(stat => (
                    <div key={stat} className="rounded-lg bg-white border border-gray-100 px-2.5 py-1.5 text-[10px] font-black text-gray-700">
                      {stat}
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  {activeDataView.details.map(detail => (
                    <p key={detail} className="text-[9px] font-bold leading-relaxed text-gray-500">{detail}</p>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-blue-50/80 border border-blue-100/60 p-3">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="w-4 h-4 text-[#0052d9]" />
                  <span className="text-[10px] font-black text-[#0052d9]">权限与日志</span>
                </div>
                <p className="mt-2 text-[11px] font-bold text-gray-700 leading-relaxed">
                  查看、编辑、导出和生成文档均记录操作人、时间、对象和字段；敏感字段默认脱敏。
                </p>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-9 grid grid-cols-1 lg:grid-cols-9 gap-4 min-h-0 auto-rows-min">
              <div className="lg:col-span-6 bg-white border border-[#dfe2ed]/60 rounded-2xl p-4 shadow-xs overflow-hidden flex flex-col h-[450px]">
                <div className="-mx-4 -mt-4 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-5 py-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                      <AlertTriangle className="w-4.5 h-4.5 text-[#4f68c8]" />
                    </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-[#24315f] leading-none">待办提醒</span>
                        <span className="w-4.5 h-4.5 rounded-full bg-[#e8e0ff] text-[#5f62b8] flex items-center justify-center text-[9px] font-black">{workbenchTasks.length}</span>
                      </div>
                      <span className="text-[9px] text-[#8c91aa] font-bold mt-1">高风险置顶 · 聚合展示 · 双入口同步</span>
                    </div>
                  </div>
                  <button type="button" className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5">
                    <span>全部</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3.5 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 min-h-0 flex-1">
                  {workbenchTasks.length === 0 ? (
                    <div className="h-full rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col items-center justify-center text-center px-6">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="mt-3 text-xs font-black text-gray-800">当前无待处理事项</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">已完成或忽略的事项会进入消息动态并保留日志。</p>
                    </div>
                  ) : workbenchTasks.map(task => (
                    <div key={task.title} className="p-2.5 bg-gray-50 hover:bg-[#f8f9ff]/50 border border-gray-100/80 rounded-xl flex flex-row items-center justify-between gap-3.5 transition-all">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-800 truncate leading-snug">{task.title}</span>
                          <span className="px-1.5 py-0.2 bg-white text-gray-400 border border-gray-100 rounded text-[8px] font-black whitespace-nowrap">{task.id}</span>
                          <span className="px-1.5 py-0.2 bg-gray-200/60 text-gray-500 border border-transparent rounded text-[8px] font-black whitespace-nowrap">{task.tag}</span>
                          {task.risk === '高' && (
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[8px] font-black whitespace-nowrap">高风险</span>
                          )}
                          {task.state === '待确认' && (
                            <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[8px] font-black whitespace-nowrap">需确认</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 font-bold truncate">{task.meta} · 责任人: {task.owner} · 状态: {task.state}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg font-bold text-[10px] transition-all whitespace-nowrap">
                          详情
                        </button>
                        {task.risk === '高' && (
                          <button
                            type="button"
                            onClick={() => moveTaskToDynamics(task.id, 'ignored')}
                            className="px-2.5 py-1 bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-lg font-bold text-[10px] transition-all whitespace-nowrap"
                          >
                            忽略
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => moveTaskToDynamics(task.id, 'done')}
                          className="px-3 py-1 bg-[#0052d9] text-white hover:bg-blue-700 rounded-lg font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm shadow-blue-500/20 whitespace-nowrap"
                        >
                          <span>{task.button}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 bg-white border border-[#dfe2ed]/60 rounded-2xl p-3.5 flex flex-col h-[450px] shadow-xs overflow-hidden">
                <div className="-mx-3.5 -mt-3.5 mb-3 flex justify-between items-center bg-gradient-to-r from-[#f7f5ff] via-[#fbfaff] to-[#f7fbff] border-b border-[#e6e8f2] px-4 py-4 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center border border-[#ddd4ff] shrink-0 shadow-inner">
                      <Calendar className="w-4 h-4 text-[#4f68c8]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-black text-[#24315f] leading-none truncate">消息动态</span>
                      <span className="text-[9px] text-[#8c91aa] font-bold mt-1 truncate">过程结果、同步日志和完成记录</span>
                    </div>
                  </div>
                  <button type="button" className="text-[#5f62b8] hover:text-[#0052d9] hover:underline font-bold text-[10px] flex items-center gap-0.5 shrink-0">
                    <span>全部</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-scroll custom-scrollbar visible-scrollbar pr-1 space-y-4">
                  <div className="space-y-4 relative pl-8 pt-1 pb-3">
                    <div className="absolute left-[13px] top-3 bottom-3 w-[1px] bg-gray-100" />
                    {dynamicMessages.map(item => (
                      <div key={`${item.time}-${item.text}`} className="relative flex items-start gap-2.5 min-w-0">
                        <div className="absolute -left-[27px] w-5.5 h-5.5 rounded-full bg-blue-50 border border-blue-100/40 flex items-center justify-center shrink-0 z-10 shadow-xs">
                          <Bell className="w-3 h-3 text-[#0052d9]" />
                        </div>
                        <div className="min-w-0 flex-1 leading-normal">
                          <div className="text-[10px] font-extrabold text-gray-800 leading-snug">{item.text}</div>
                          <span className="text-[8px] text-gray-400 font-bold block mt-0.5">{item.time} · 人事管理助手</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </section>
        </main>
      )}
    </div>
  );
}
