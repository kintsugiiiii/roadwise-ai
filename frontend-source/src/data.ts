import { Project, WorkTask, ContractItem, RecentFile, QuickPrompt } from './types';

const createMockProjectGroup = (
  id: string,
  name: string,
  owner: string,
  status: Project['status'],
  progress: number,
  index: number,
): Project => ({
  id,
  name,
  membersCount: 3 + (index % 4),
  aiCount: 1,
  status,
  unreadCount: index % 5 === 0 ? 1 : 0,
  progress,
  reportCount: progress === 100 ? '1/1' : '0/1',
  members: [
    { name: owner, avatarText: owner.slice(0, 1), role: '项目经理', isMe: owner === '符金雨' },
    { name: '陈华', avatarText: '陈', role: '项目成员' },
    { name: '蔡宇豪', avatarText: '蔡', role: '项目成员' },
  ],
  agents: [{
    name: '报告助理',
    avatarIcon: 'ClipboardCheck',
    role: '数字员工',
    description: '项目进度跟踪、底稿与报告协作',
    avatarBg: 'bg-emerald-600',
  }],
  messages: [{
    id: `${id}-welcome`,
    sender: { name: owner, avatarText: owner.slice(0, 1) },
    time: '今天 09:30',
    content: `${name}协作群已同步，当前项目进度为 ${progress}%，请按计划推进待办事项。`,
  }],
});

const projectGroupOrder = [
  'jinli-group',
  'codex-e2e',
  'wls-3',
  'wls-4',
  'test-1',
  'huaxiao-internal',
  'xx-finance',
  'yy-annual',
  'huabei-annual',
  'yuanhang-special',
  'qiming-finance',
  'xinghe-annual',
  'haiyue-internal',
  'zhituo-special',
  'boyuan-finance',
  'xincheng-annual',
] as const;

// Initial Project Collaboration Data (matches HTML 1 & 2 details)
export const initialProjects: Project[] = ([
  {
    id: 'wls-3',
    name: 'WLS测试项目3',
    membersCount: 5,
    aiCount: 2,
    status: '进行中',
    unreadCount: 0,
    progress: 25,
    reportCount: '0/1',
    members: [
      { name: '符金雨', avatarText: '符', role: '项目经理', isMe: true },
      { name: '吴立松', avatarText: '吴', role: '产品负责人' },
      { name: '汪欣', avatarText: '汪', role: '测试负责人' },
      { name: 'orcus1', avatarText: 'o', role: '开发工程师' },
      { name: '吴宜松', avatarText: '吴', role: '测试工程师' },
    ],
    agents: [
      {
        name: 'RoadwiseLab 主控',
        avatarIcon: 'Bot',
        role: '主控',
        description: '统领其他智能体，执行指令与决策',
        avatarBg: 'bg-indigo-600',
      },
      {
        name: '报告助理',
        avatarIcon: 'ClipboardCheck',
        role: '数字员工',
        description: '报告生成、数据整理与汇总',
        avatarBg: 'bg-emerald-600',
      },
    ],
    messages: [
      {
        id: 'msg-1',
        sender: { name: '符金雨', avatarText: '符' },
        time: '11:20',
        content: '@RoadwiseLab 主控 请帮我汇总一下项目当前的风险点，并生成一份日报',
      },
      {
        id: 'msg-2',
        sender: {
          name: 'RoadwiseLab 主控',
          avatarIcon: 'Bot',
          avatarBg: 'bg-indigo-600',
          isAi: true,
          aiRole: '主控智能体',
        },
        time: '11:20',
        content: '收到指令！正在协调相关智能体处理您的请求，请稍候。',
        plan: {
          text: '正在协调相关智能体处理您的请求，请稍候。',
          items: [
            { id: 'item-1', text: '1. 分析项目风险数据', status: 'done' },
            { id: 'item-2', text: '2. 收集进度与异常信息', status: 'done' },
            { id: 'item-3', text: '3. 生成项目日报', status: 'processing' },
          ],
          assignments: [
            { role: '风险分析师', agentName: 'RoadwiseLab 主控', status: 'completed' },
            { role: '进度分析师', agentName: '报告助理', status: 'processing' },
            { role: '报告助理', agentName: '报告助理', status: 'pending' },
          ],
        },
      },
      {
        id: 'msg-3',
        sender: {
          name: '报告助理',
          avatarIcon: 'ClipboardCheck',
          avatarBg: 'bg-emerald-600',
          isAi: true,
          aiRole: '数字员工',
        },
        time: '11:22',
        content: '项目日报已生成，请查看附件。',
        file: {
          name: 'wls测试3_项目日报_20250628.pdf',
          size: '2.4 MB',
          type: 'pdf',
        },
      },
      {
        id: 'msg-4',
        sender: {
          name: 'RoadwiseLab 主控',
          avatarIcon: 'Bot',
          avatarBg: 'bg-indigo-600',
          isAi: true,
          aiRole: '主控智能体',
        },
        time: '11:22',
        content: '日报已生成并提交到项目空间，更多详情请查看右侧「项目看板」。',
      },
    ],
  },
  {
    id: 'wls-4',
    name: 'WLS测试项目4',
    membersCount: 4,
    aiCount: 1,
    status: '已完成',
    unreadCount: 1,
    progress: 100,
    reportCount: '1/1',
    members: [
      { name: '符金雨', avatarText: '符', role: '项目经理', isMe: true },
      { name: '吴立松', avatarText: '吴', role: '产品负责人' },
      { name: '汪欣', avatarText: '汪', role: '测试负责人' },
      { name: '蔡宇豪', avatarText: '蔡', role: '产品经理' },
    ],
    agents: [
      {
        name: 'RoadwiseLab 主控',
        avatarIcon: 'Bot',
        role: '主控',
        description: '智能工作助理',
        avatarBg: 'bg-indigo-600',
      },
    ],
    messages: [
      {
        id: 'w4-msg-1',
        sender: { name: '吴立松', avatarText: '吴' },
        time: '昨天 15:30',
        content: 'wls测试4项目已经进入第二阶段，请大家及时同步报告底稿。',
      },
    ],
  },
  {
    id: 'jinli-group',
    name: '金利集团有限公司专项审计',
    membersCount: 3,
    aiCount: 1,
    status: '进行中',
    unreadCount: 0,
    progress: 65,
    reportCount: '0/1',
    members: [
      { name: '符金雨', avatarText: '符', role: '项目经理', isMe: true },
      { name: '陈华', avatarText: '陈', role: '开发工程师' },
    ],
    agents: [
      {
        name: '报告助理',
        avatarIcon: 'ClipboardCheck',
        role: '数字员工',
        description: '报告生成专家',
        avatarBg: 'bg-emerald-600',
      },
    ],
    messages: [
      {
        id: 'jinli-msg-1',
        sender: { name: '陈华', avatarText: '陈' },
        time: '06-24 10:15',
        content: '金利集团专项审计已进入写报告阶段，请同步检查底稿和合同材料。',
      },
    ],
  },
  {
    id: 'test-1',
    name: '测试项目1',
    membersCount: 6,
    aiCount: 2,
    status: '进行中',
    progress: 10,
    reportCount: '0/1',
    members: [],
    agents: [],
    messages: [],
  },
  {
    id: 'codex-e2e',
    name: 'Codex-E2E-CPA-20260623',
    membersCount: 8,
    aiCount: 2,
    status: '审核中',
    progress: 45,
    reportCount: '0/1',
    members: [],
    agents: [],
    messages: [],
  },
  createMockProjectGroup('roadwise-internal', 'RoadwiseLab 内部审计2026', '张婷婷', '审核中', 55, 1),
  createMockProjectGroup('xx-finance', 'XX公司财务审计项目', '李明', '进行中', 30, 2),
  createMockProjectGroup('yy-annual', 'YY集团年报审计2026', '赵丽', '已完成', 100, 3),
  createMockProjectGroup('huabei-annual', '华北制造有限公司年报审计', '刘敏', '进行中', 42, 4),
  createMockProjectGroup('yuanhang-special', '远航供应链专项审计', '周宁', '审核中', 58, 5),
  createMockProjectGroup('qiming-finance', '启明科技财务审计', '王倩', '进行中', 35, 6),
  createMockProjectGroup('xinghe-annual', '星河教育集团审计', '李岩', '进行中', 70, 7),
  createMockProjectGroup('haiyue-internal', '海岳咨询内部审计', '孙悦', '审核中', 20, 8),
  createMockProjectGroup('zhituo-special', '智拓信息专项审计', '吴晨', '进行中', 48, 9),
  createMockProjectGroup('boyuan-finance', '博远商贸财务审计', '郑凯', '进行中', 15, 10),
  createMockProjectGroup('xincheng-annual', '新城建设年报审计', '钱静', '审核中', 62, 11),
] as Project[]).sort((first, second) => projectGroupOrder.indexOf(first.id as typeof projectGroupOrder[number]) - projectGroupOrder.indexOf(second.id as typeof projectGroupOrder[number]));

// Tasks for the Workbench (matches HTML 2 detail)
export const initialWorkTasks: WorkTask[] = [
  {
    id: 'task-1',
    priority: 'P0 高',
    priorityColor: 'text-rose-700 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400',
    title: '审核报告（三审）',
    projectName: 'Codex-E2E-CPA-报告-20260623',
    deadline: '2026-06-28',
    confirmTime: '今天 18:00',
    status: '逾期风险',
    statusColor: 'bg-amber-100 text-amber-800 border border-amber-200',
    type: 'audit',
  },
  {
    id: 'task-2',
    priority: 'P1 中',
    priorityColor: 'text-[#0052d9] bg-blue-50 border-blue-100/60',
    title: '审核报告（三审）',
    projectName: 'wls测试项目2',
    deadline: '2026-07-02',
    confirmTime: '明天 12:00',
    status: '正常推进',
    statusColor: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    type: 'confirm',
  },
];

// Contracts & Invoicing Data (matches HTML 2 table)
export const initialContracts: ContractItem[] = [
  {
    id: 'c-1',
    projectName: 'Codex-E2E-CPA-20260623',
    amount: '¥ 1,000',
    received: '--',
    pending: '¥ 1,000',
    invoiced: '--',
  },
  {
    id: 'c-2',
    projectName: 'wls测试4',
    amount: '¥ 2.0万',
    received: '--',
    pending: '¥ 2.0万',
    invoiced: '--',
  },
  {
    id: 'c-3',
    projectName: 'wls测试项目2',
    amount: '¥ 2.0万',
    received: '--',
    pending: '¥ 2.0万',
    invoiced: '--',
  },
];

// Recent Files in Right Sidebar / Assistant Panel (matches HTML 3)
export const initialRecentFiles: RecentFile[] = [
  {
    id: 'f-1',
    name: '产品需求文档 V2.1.docx',
    time: '今天 14:30',
    type: 'docx',
    size: '1.2 MB',
  },
  {
    id: 'f-2',
    name: '项目排期计划表.xlsx',
    time: '昨天 16:45',
    type: 'xlsx',
    size: '850 KB',
  },
  {
    id: 'f-3',
    name: '用户调研报告.pdf',
    time: '6月24日 10:20',
    type: 'pdf',
    size: '4.7 MB',
  },
];

// Quick Start Prompts for Accounting Assistant (matches HTML 3 cards)
export const initialQuickPrompts: QuickPrompt[] = [
  {
    id: 'qp-1',
    title: '财务报表分析',
    description: '解析财务报表，洞察企业经营状况',
  },
  {
    id: 'qp-2',
    title: '税务合规咨询',
    description: '解答税务问题，降低合规风险',
  },
  {
    id: 'qp-3',
    title: '成本核算优化',
    description: '分析成本结构，优化成本控制',
  },
  {
    id: 'qp-4',
    title: '预算与预测',
    description: '制定预算方案，预测财务趋势',
  },
];

// Single Chat members (matches both work and chat modes)
export const chatMembers = [
  { name: '蔡宇豪', avatarText: '蔡', role: '产品经理', status: '在线', email: 'cai.yuhao@huaan.com' },
  { name: '陈华', avatarText: '陈', role: '开发工程师', status: '离线', email: 'chen.hua@huaan.com' },
  { name: '陈嘉妍', avatarText: '陈', role: '测试工程师', status: '忙碌', email: 'chen.jiayan@huaan.com' },
];
