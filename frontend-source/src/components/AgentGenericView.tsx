import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  FileSpreadsheet, 
  FileText, 
  Sparkles,
  ArrowUpRight,
  Plus,
  Check,
  Clock,
  CheckCircle2,
  Settings,
  List,
  Columns,
  Layout,
  Scale,
  ShieldCheck,
  ShieldAlert,
  FolderArchive,
  FileSearch,
  FolderHeart,
  Calculator,
  FileSignature,
  ScanFace,
  BellRing,
  RefreshCw,
  Database,
  BookOpen,
  Cpu,
  MessageSquare,
  ChevronRight,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import { AgentSVGAvatar } from './AgentSVGAvatar';
import type { ProjectSeedPayload } from '../types';
import { 
  agentConfigurations, 
  Message, 
  AgentGenericViewProps 
} from '../data/agentConfigs';

// Static branding configurations matching each specialized Digital Employee
const agentThemes: Record<string, {
  primary: string;
  bgGradient: string;
  borderAccent: string;
  accentText: string;
  accentBg: string;
  lightBg: string;
  badgeCls: string;
  leftBarCls: string;
  inputBorder: string;
  buttonBg: string;
  checkboxBorder: string;
  dotBg: string;
}> = {
  'agent-shebao': {
    primary: '#0052d9',
    bgGradient: 'from-blue-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-blue-400 hover:shadow-blue-500/5 hover:bg-white',
    accentText: 'text-[#0052d9]',
    accentBg: 'bg-blue-50/80 hover:bg-blue-100/50 text-[#0052d9]',
    lightBg: 'bg-blue-100/20',
    badgeCls: 'bg-blue-50/80 text-[#0052d9] border-blue-100/50',
    leftBarCls: 'border-l-4 border-l-[#0052d9]',
    inputBorder: 'focus-within:border-blue-500 focus-within:ring-blue-500/10',
    buttonBg: 'bg-[#0052d9] hover:bg-blue-700 text-white',
    checkboxBorder: 'border-blue-500',
    dotBg: 'bg-[#0052d9]'
  },
  'agent-人事': {
    primary: '#059669',
    bgGradient: 'from-emerald-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-emerald-400 hover:shadow-emerald-500/5 hover:bg-white',
    accentText: 'text-emerald-600',
    accentBg: 'bg-emerald-50/80 hover:bg-emerald-100/50 text-emerald-700',
    lightBg: 'bg-emerald-100/20',
    badgeCls: 'bg-emerald-50/80 text-emerald-700 border-emerald-100/50',
    leftBarCls: 'border-l-4 border-l-emerald-600',
    inputBorder: 'focus-within:border-emerald-500 focus-within:ring-emerald-500/10',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    checkboxBorder: 'border-emerald-500',
    dotBg: 'bg-emerald-600'
  },
  'agent-年报': {
    primary: '#7c3aed',
    bgGradient: 'from-purple-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-purple-400 hover:shadow-purple-500/5 hover:bg-white',
    accentText: 'text-purple-600',
    accentBg: 'bg-purple-50/80 hover:bg-purple-100/50 text-purple-700',
    lightBg: 'bg-purple-100/20',
    badgeCls: 'bg-purple-50/80 text-purple-700 border-purple-100/50',
    leftBarCls: 'border-l-4 border-l-purple-600',
    inputBorder: 'focus-within:border-purple-500 focus-within:ring-purple-500/10',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    checkboxBorder: 'border-purple-500',
    dotBg: 'bg-purple-600'
  },
  'agent-文档': {
    primary: '#d97706',
    bgGradient: 'from-amber-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-amber-400 hover:shadow-amber-500/5 hover:bg-white',
    accentText: 'text-amber-600',
    accentBg: 'bg-amber-50/80 hover:bg-amber-100/50 text-amber-700',
    lightBg: 'bg-amber-100/20',
    badgeCls: 'bg-amber-50/80 text-amber-700 border-amber-100/50',
    leftBarCls: 'border-l-4 border-l-amber-500',
    inputBorder: 'focus-within:border-amber-500 focus-within:ring-amber-500/10',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
    checkboxBorder: 'border-amber-500',
    dotBg: 'bg-amber-600'
  },
  'agent-会计': {
    primary: '#e11d48',
    bgGradient: 'from-rose-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-rose-400 hover:shadow-rose-500/5 hover:bg-white',
    accentText: 'text-rose-600',
    accentBg: 'bg-rose-50/80 hover:bg-rose-100/50 text-rose-700',
    lightBg: 'bg-rose-100/20',
    badgeCls: 'bg-rose-50/80 text-rose-700 border-rose-100/50',
    leftBarCls: 'border-l-4 border-l-rose-600',
    inputBorder: 'focus-within:border-rose-500 focus-within:ring-rose-500/10',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
    checkboxBorder: 'border-rose-500',
    dotBg: 'bg-rose-600'
  },
  'agent-报销': {
    primary: '#db2777',
    bgGradient: 'from-pink-50/40 via-slate-50/20 to-white',
    borderAccent: 'hover:border-pink-400 hover:shadow-pink-500/5 hover:bg-white',
    accentText: 'text-pink-600',
    accentBg: 'bg-pink-50/80 hover:bg-pink-100/50 text-pink-700',
    lightBg: 'bg-pink-100/20',
    badgeCls: 'bg-pink-50/80 text-pink-700 border-pink-100/50',
    leftBarCls: 'border-l-4 border-l-pink-600',
    inputBorder: 'focus-within:border-pink-500 focus-within:ring-pink-500/10',
    buttonBg: 'bg-pink-600 hover:bg-pink-700 text-white',
    checkboxBorder: 'border-pink-500',
    dotBg: 'bg-pink-600'
  }
};

const shebaoWorkflowSteps = [
  { id: 1, title: '首页入口', desc: '选择新建项目或进入已有项目' },
  { id: 2, title: '新建项目', desc: '确认输出目录、建档资料和基础字段' },
  { id: 3, title: '进入项目', desc: '从 report_ready 项目继续处理' },
  { id: 4, title: '资料上传', desc: '按资料类别上传、解析和校对' },
  { id: 5, title: '人工核验', desc: '核验 OCR 与表格识别结果' },
  { id: 6, title: '附件生成', desc: '生成年度分块与并入金额附件' },
  { id: 7, title: '报告审核', desc: '逐项确认核查条目并生成草稿' },
];

const shebaoFileGroups = [
  {
    id: 'salary',
    code: 'F004',
    title: '工资单流水资料',
    desc: '工资表 PDF、工资单照片、薪资明细截图',
    count: 1,
    status: '待人工核验',
  },
  {
    id: 'social',
    code: 'F001',
    title: '社保缴费资料',
    desc: '社保缴费明细、缴费基数核定表、参保缴费记录',
    count: 0,
    status: '待上传',
  },
  {
    id: 'wallet',
    code: 'F003',
    title: '微信支付宝转账资料',
    desc: '微信转账截图、支付宝账单截图、转账电子回单',
    count: 1,
    status: '已解析',
  },
  {
    id: 'bank',
    code: 'F002',
    title: '银行流水资料',
    desc: '银行流水 PDF、银行 App 截图、交易明细扫描件',
    count: 2,
    status: '已解析',
  },
];

const shebaoProjects = [
  {
    name: '张蓉娟-上海前锦众程人力资源有限公司-社保专项审计-副本',
    status: 'report_ready',
    meta: '104 条底稿记录 · 已上传 4 个文件 · 2026/07/01 15:25',
  },
  {
    name: '张蓉娟-上海前锦众程人力资源有限公司-社保专项审计',
    status: 'report_ready',
    meta: '104 条底稿记录 · 待校对 9 页工资单 · 2026/07/01 14:29',
  },
];

const shebaoReportItems = [
  { label: '年度', value: '2023', source: 'AI 填写' },
  { label: '案号', value: '沪社保稽字2023050001稽核案件相关情况专项审计报告', source: 'AI 填写' },
  { label: '出具日期', value: '待人工填写', source: '待确认' },
  { label: '投诉人姓名', value: '张蓉娟', source: 'AI 填写' },
  { label: '被投诉单位', value: '上海前锦众程人力资源有限公司', source: 'AI 填写' },
];

export default function AgentGenericView({ 
  agentId, 
  agentName, 
  agentRole, 
  avatarText,
  selectedSubItemId,
  onCreateProjectFromSeed,
}: AgentGenericViewProps & { onCreateProjectFromSeed?: (payload: ProjectSeedPayload) => void }) {
  
  // Choose config. Fallback to shebao if not explicitly matched
  const baseConfigKey = agentConfigurations[agentId] ? agentId : 'agent-shebao';
  const config = agentConfigurations[baseConfigKey];
  const theme = agentThemes[baseConfigKey] || agentThemes['agent-shebao'];

  // Dynamic States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [planItems, setPlanItems] = useState<{ id: number; text: string; status: string }[]>([]);
  const [recentFiles, setRecentFiles] = useState<{ name: string }[]>([]);
  const [shebaoStep, setShebaoStep] = useState(1);
  const [verifiedReportItems, setVerifiedReportItems] = useState<string[]>([]);
  
  // Toggle Guide vs Chat mode locally when user is inside selectedSubItemId === null
  const [localChatActive, setLocalChatActive] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Synchronize initial configuration when Agent or selectedSubItem shifts
  useEffect(() => {
    setLocalChatActive(false);
    setInputText('');
    setShebaoStep(1);
    setVerifiedReportItems([]);
    
    let loadedMessages: Message[] = [];
    
    // Custom subitem dialogue injections for maximum fidelity
    if (selectedSubItemId) {
      if (agentId === 'agent-报销') {
        if (selectedSubItemId === 'bx-1') {
          loadedMessages = [
            {
              id: 'bx-user-1',
              sender: 'user',
              senderName: '符金雨',
              avatarText: '符',
              time: '16:15',
              content: '餐费余额查询：帮我查一下我这个月的餐费剩余额度是多少。',
            },
            {
              id: 'bx-agent-1',
              sender: 'agent',
              senderName: '报销助手',
              time: '16:16',
              content: '【餐费额度查询】\n- **当前月份**: 2026年6月\n- **核定餐补额度**: 1,000.00 元\n- **已报销/核销**: 240.00 元\n- **剩余可用余额**: **760.00 元**\n\n未发现任何报销异常或跨期风险。您可以直接拖拽发票影像，以进行智能合规查验。',
              identifiedInfo: {
                scope: '个人差旅与餐费报销额度测算',
                period: '2026年 6月',
                target: '符金雨餐费定额报销',
                status: '额度宽裕，使用率 24%'
              }
            }
          ];
        } else if (selectedSubItemId === 'bx-2') {
          loadedMessages = [
            {
              id: 'bx-user-2',
              sender: 'user',
              senderName: '符金雨',
              avatarText: '符',
              time: '16:20',
              content: '餐费额度管理：查看一下我们部门餐费超额预警名单。',
            },
            {
              id: 'bx-agent-2',
              sender: 'agent',
              senderName: '报销助手',
              time: '16:21',
              content: '【部门餐费报销预警】\n当前财务周期发现 2 名员工餐补额度使用率超过 90%：\n1. **吴立松** (产品负责人): 已报销 950.00 元 (超额红线 1,000.00 元)，当前处于预警状态。\n2. **蔡宇豪** (项目成员): 已报销 920.00 元 (预警状态)。\n\n建议提醒相关人员合理调整本期餐费报销申报节奏，避免集中超支。',
              identifiedInfo: {
                scope: '全门及全团队餐补预算执行审核',
                period: '2026年 6月',
                target: '上海大学审计部餐费监控',
                status: '2 人超标，已自动亮红灯'
              }
            }
          ];
        }
      } else if (agentId === 'agent-shebao') {
        if (selectedSubItemId === 'sb-1') {
          loadedMessages = [
            {
              id: 'sb-u1',
              sender: 'user',
              senderName: '符金雨',
              avatarText: '符',
              time: '14:40',
              content: '帮我比对一下2025年度的社保公积金缴纳情况，看下和计税工资基数是否有偏差。',
              files: [
                { name: '2025年社保缴费明细表.xlsx', size: '5.8 MB', type: 'excel' },
                { name: '2025年个税申报工资发放明细.xlsx', size: '12.4 MB', type: 'excel' }
              ]
            },
            {
              id: 'sb-a1',
              sender: 'agent',
              senderName: '社保专项审计智能体',
              time: '14:41',
              content: '收到！已成功导入社保缴费明细与个税发放账目。我正通过二路比对算法，核对各员工的计税薪酬基数与实际公积金、社保申报基数的匹配情况。',
              identifiedInfo: {
                scope: '社保明细与个税扣缴账目比对完毕',
                period: '2025 年度',
                target: '上海大学 2025 年度社保专项审计',
                status: '差异初稿已生成，待人工补充核实'
              },
              generatedDocs: [
                { title: '基数偏差测算表', status: '已生成', desc: '社保缴存基数与计税工资对比', progress: 100 },
                { title: '疑似漏保漏缴明细', status: '已生成', desc: '按月份/按部门匹配异常人员', progress: 100 }
              ]
            }
          ];
        } else if (selectedSubItemId === 'sb-2') {
          loadedMessages = [
            {
              id: 'sb-user-2',
              sender: 'user',
              senderName: '符金雨',
              avatarText: '符',
              time: '14:45',
              content: '查一下上海2025年最新社保缴费比例标准，看系统里扣款比例设对了吗？',
            },
            {
              id: 'sb-agent-2',
              sender: 'agent',
              senderName: '社保专项审计智能体',
              time: '14:46',
              content: '为您查询到 **上海市 2025 年度社保缴费比例最新标准** 如下：\n- **养老保险**: 单位 16%, 个人 8%\n- **医疗保险 (含生育)**: 单位 9% (含生育 1%), 个人 2%\n- **失业保险**: 单位 0.5%, 个人 0.5%\n- **工伤保险**: 行业差别费率 (单位 0.16% - 1.52%), 个人不缴费\n\n当前检测到您的核算配置比例符合上海最新标准！未发现异常偏差。',
              identifiedInfo: {
                scope: '上海市2025年最新社保政策检索',
                period: '2025 年度',
                target: '缴费比例系统内参数校验',
                status: '核算配置参数校验100%通过'
              }
            }
          ];
        }
      } else if (agentId === 'agent-文档') {
        loadedMessages = [
          {
            id: 'wd-u1',
            sender: 'user',
            senderName: '符金雨',
            avatarText: '符',
            time: '10:25',
            content: '把最近新上传的未分类文档进行要素结构化提取，分析合同对方并分类归纳。',
            files: [
              { name: '未归档合同扫描件.zip', size: '45.8 MB', type: 'zip' }
            ]
          },
          {
            id: 'wd-a1',
            sender: 'agent',
            senderName: '文档管家',
            time: '10:26',
            content: '已成功解压并扫描 `/上海大学2025/未分类合同/` 目录。通过文档深度聚类和要素智能OCR，我对 12 份新上传合同完成了分类和数据提取。\n\n**整理报告如下**:\n- 8 份销售合同已归类至 `[项目/销售合同/2025Q2]`\n- 4 份采购合同已归类至 `[项目/采购合同/2025Q2]`\n- 各合同的签约主体、合作金额及收付款节点已自动形成结构化Excel索引表。',
            identifiedInfo: {
              scope: '未归档目录智能多模态识别',
              period: '2025 年度',
              target: '上海大学财务合同合规归类',
              status: '归档完毕，索引表已生成'
            },
            generatedDocs: [
              { title: '合同结构化索引表', status: '已生成', desc: '列示所有合同的主体、金额、核心条款', progress: 100 },
              { title: '多维聚类目录划分', status: '已生成', desc: '按项目 and 收付方向自动创建子文件夹', progress: 100 }
            ]
          }
        ];
      }
    } else {
      loadedMessages = [];
    }

    setMessages(loadedMessages);
    setPlanItems([...config.planItems]);
    setRecentFiles([...config.importFiles]);
  }, [agentId, selectedSubItemId, config]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle send message
  const handleSend = (textInputOverride?: string) => {
    const textToSend = textInputOverride || inputText;
    if (!textToSend.trim()) return;

    if (!selectedSubItemId && !localChatActive) {
      setLocalChatActive(true);
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: '符金雨',
      avatarText: '符',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textInputOverride) setInputText('');

    setTimeout(() => {
      const agentReply: Message = {
        id: `msg-reply-${Date.now()}`,
        sender: 'agent',
        senderName: agentName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `收到您发送的信息：“${textToSend}”。我已调取后台分析引擎展开语义理解与策略审计。具体进度已标记在右侧计划事项，相关文件也已实时刷新，您可以展开人工确认与二次调整。`
      };

      setMessages(prev => [...prev, agentReply]);

      setPlanItems(prev => {
        return prev.map(item => {
          if (item.status === '进行中') return { ...item, status: '已完成' };
          if (item.status === '待办') return { ...item, status: '进行中' };
          return item;
        });
      });
    }, 1100);
  };

  // User clicks on guide card: Triggers customized dialogue flow
  const handleCardClick = (side: 'left' | 'right') => {
    setLocalChatActive(true);
    const card = side === 'left' ? config.cardLeft : config.cardRight;
    if (isShebaoAgent) {
      setShebaoStep(side === 'left' ? 2 : 3);
    }

    const userMsg: Message = {
      id: `msg-card-${Date.now()}-user`,
      sender: 'user',
      senderName: '符金雨',
      avatarText: '符',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: card.userPrompt
    };

    const agentMsg: Message = {
      id: `msg-card-${Date.now()}-agent`,
      sender: 'agent',
      senderName: agentName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: card.agentResponse,
      identifiedInfo: card.identifiedInfo,
      generatedDocs: card.generatedDocs
    };

    setMessages([userMsg, agentMsg]);
  };

  const handleTogglePlan = (id: number) => {
    setPlanItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === '进行中' ? '已完成' : item.status === '已完成' ? '待办' : '进行中';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleReset = () => {
    setMessages([]);
    setLocalChatActive(false);
    setInputText('');
    setShebaoStep(1);
    setVerifiedReportItems([]);
    setPlanItems([...config.planItems]);
  };

  const pushShebaoChoice = (
    step: number,
    userChoice: string,
    reply: string,
    docs?: Message['generatedDocs']
  ) => {
    setLocalChatActive(true);
    setShebaoStep(step);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [
      ...prev,
      {
        id: `shebao-choice-${Date.now()}-user`,
        sender: 'user',
        senderName: '符金雨',
        avatarText: '符',
        time: now,
        content: userChoice,
      },
      {
        id: `shebao-choice-${Date.now()}-agent`,
        sender: 'agent',
        senderName: agentName,
        time: now,
        content: reply,
        identifiedInfo: {
          scope: '社保专项审计资料识别与校对',
          period: '2026 年度',
          target: '张蓉娟 - 上海前锦众程人力资源有限公司',
          status: shebaoWorkflowSteps[step - 1]?.title || '流程推进中',
        },
        generatedDocs: docs,
      },
    ]);
    setPlanItems(prev => prev.map(item => (
      item.id < Math.min(step, 4)
        ? { ...item, status: '已完成' }
        : item.id === Math.min(step, 4)
          ? { ...item, status: '进行中' }
          : item
    )));
  };

  const handleShebaoPrimaryAction = (action: 'new' | 'enter' | 'upload' | 'verify' | 'generate' | 'review') => {
    if (action === 'new') {
      pushShebaoChoice(
        2,
        '选择：新建社保专项审计项目',
        '已进入新建项目流程。请优先确认输出目录，并上传立案审批表、营业执照和可选身份证件；我会自动识别投标人、被投诉单位、审计期间、报告字号等字段，您只需要逐项确认。',
      );
      return;
    }

    if (action === 'enter') {
      pushShebaoChoice(
        3,
        '选择：进入已有 report_ready 项目',
        '已读取到 2 个可继续处理的社保专项审计项目。建议进入最近更新的项目继续校对，也可以复制项目生成副本后再处理。',
      );
      return;
    }

    if (action === 'upload') {
      pushShebaoChoice(
        4,
        '选择：进入资料上传与校对工作台',
        '工作台已按资料来源拆分为工资单流水、社保缴费、微信支付宝转账、银行流水四个处理区。每类资料都提供上传、解析、校对三个动作，请先处理带有“待人工核验”的工资单流水。',
      );
      return;
    }

    if (action === 'verify') {
      pushShebaoChoice(
        5,
        '选择：核验工资单识别结果',
        '已打开工资校对视图：左侧保留原始工资单页面，右侧列出 OCR/表格识别后的年月、单位应发、单位实发、奖金等字段。请确认当前第 4/9 页，核验通过后我会写入底稿记录。',
      );
      return;
    }

    if (action === 'generate') {
      pushShebaoChoice(
        6,
        '选择：生成专项附件',
        '附件已生成：系统已形成 9 个年度分块，微信支付宝并入金额为 0。您可以打开附件查看，下一步进入报告审核确认条目。',
        [
          { title: '年度分块附件', status: '已生成', desc: '按年度与资料来源拆分形成 9 个分块', progress: 100 },
          { title: '微信支付宝并入金额表', status: '已生成', desc: '本次核验并入金额为 0', progress: 100 },
        ],
      );
      return;
    }

    pushShebaoChoice(
      7,
      '选择：进入报告审核',
      '已进入报告审核工作台。左侧为报告草稿预览，右侧列出 24 个核查条目；AI 已填写 15 项，您可以逐项确认，也可以一键确认后生成报告草稿。',
      [
        { title: '稽核案件专项审计报告草稿', status: '待确认', desc: 'AI 已填写 15/24 项，待人工确认后生成', progress: 62 },
      ],
    );
  };

  const toggleReportItem = (label: string) => {
    setVerifiedReportItems(prev => (
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    ));
  };

  const createProjectSeed = (agentMessage: Message): ProjectSeedPayload => {
    const lastUserMessage = [...messages].reverse().find(message => message.sender === 'user');
    const messageFiles = messages.flatMap(message => message.files || []);
    const importedFiles = recentFiles.map(file => ({ name: file.name, size: '已关联', type: 'xlsx' }));
    const projectTarget = agentMessage.identifiedInfo?.target || config.project;
    const projectName = `${projectTarget}_智能体底稿项目`;

    return {
      sourceAgentName: agentName,
      projectName,
      userInstruction: lastUserMessage?.content || config.cardLeft.userPrompt,
      assistantSummary: agentMessage.content,
      files: [...messageFiles, ...importedFiles],
      generatedDocs: agentMessage.generatedDocs || [],
    };
  };

  const showWelcomeGuide = !selectedSubItemId && !localChatActive;
  const isShebaoAgent = agentId === 'agent-shebao';

  // Render Card Left / Right Icons
  const renderCardIcon = (type: string) => {
    const cls = "w-5 h-5";
    switch (type) {
      case 'scale': return <Scale className={`${cls} ${theme.accentText}`} />;
      case 'shield-alert': return <ShieldAlert className={`${cls} ${theme.accentText}`} />;
      case 'spreadsheet': return <FileSpreadsheet className={`${cls} ${theme.accentText}`} />;
      case 'search': return <FileSearch className={`${cls} ${theme.accentText}`} />;
      case 'calculator': return <Calculator className={`${cls} ${theme.accentText}`} />;
      case 'face': return <ScanFace className={`${cls} ${theme.accentText}`} />;
      case 'shield-check': return <ShieldCheck className={`${cls} ${theme.accentText}`} />;
      case 'plus': return <Plus className={`${cls} ${theme.accentText}`} />;
      case 'archive': return <FolderArchive className={`${cls} ${theme.accentText}`} />;
      case 'heart': return <FolderHeart className={`${cls} ${theme.accentText}`} />;
      case 'signature': return <FileSignature className={`${cls} ${theme.accentText}`} />;
      case 'bell': return <BellRing className={`${cls} ${theme.accentText}`} />;
      default: return <Sparkles className={`${cls} ${theme.accentText}`} />;
    }
  };

  const renderShebaoWorkflowPanel = () => {
    const reportVerifiedCount = verifiedReportItems.length;

    return (
      <div className="mt-3 bg-white border border-blue-100 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black text-[#0052d9] uppercase tracking-wide">社保专项流程</p>
            <h3 className="text-xs font-black text-slate-900 mt-1">请选择下一步，我会继续推进</h3>
          </div>
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#0052d9] border border-blue-100">
            第 {shebaoStep}/7 步
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {shebaoWorkflowSteps.map((step) => {
            const isActive = step.id === shebaoStep;
            const isDone = step.id < shebaoStep;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setShebaoStep(step.id)}
                className={`min-h-[58px] rounded-xl border px-2 py-2 text-left transition-all ${
                  isActive
                    ? 'border-[#0052d9] bg-blue-50 text-[#0052d9] shadow-sm'
                    : isDone
                      ? 'border-emerald-100 bg-emerald-50/60 text-emerald-700'
                      : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-blue-100 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${
                    isActive ? 'bg-[#0052d9] text-white' : isDone ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                  }`}>
                    {isDone ? <Check className="h-2.5 w-2.5" /> : step.id}
                  </span>
                  <span className="truncate text-[10px] font-black">{step.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { label: '新建项目', action: 'new' as const },
            { label: '进入项目', action: 'enter' as const },
            { label: '资料上传', action: 'upload' as const },
            { label: '核验工资单', action: 'verify' as const },
            { label: '生成附件', action: 'generate' as const },
            { label: '报告审核', action: 'review' as const },
          ].map((item) => (
            <button
              key={item.action}
              type="button"
              onClick={() => handleShebaoPrimaryAction(item.action)}
              className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[10px] font-black text-[#0052d9] transition-all hover:bg-[#0052d9] hover:text-white"
            >
              {item.label}
            </button>
          ))}
        </div>

        {shebaoStep <= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: '输出目录', value: '/Desktop/未命名文件夹', status: '已选择' },
              { title: '建档资料', value: '立案审批表、营业执照、身份证', status: '待确认' },
              { title: '基础字段', value: '投标人、被投诉单位、审计期间、字号', status: 'AI 识别' },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-700">{item.title}</span>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 text-[10px] font-semibold leading-relaxed text-slate-500">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {shebaoStep === 3 && (
          <div className="space-y-2">
            {shebaoProjects.map((project) => (
              <div key={project.name} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[11px] font-black text-slate-800">{project.name}</p>
                    <span className="shrink-0 text-[9px] font-black text-[#0052d9] bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5">
                      {project.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-slate-500">{project.meta}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleShebaoPrimaryAction('upload')}
                  className="shrink-0 rounded-lg bg-[#0052d9] px-3 py-1.5 text-[10px] font-black text-white hover:bg-blue-700"
                >
                  进入项目
                </button>
              </div>
            ))}
          </div>
        )}

        {shebaoStep >= 4 && shebaoStep <= 6 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {shebaoFileGroups.map((group) => (
              <div key={group.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-black text-[#0052d9]">{group.code}</p>
                    <h4 className="text-[11px] font-black text-slate-800">{group.title}</h4>
                    <p className="mt-1 text-[10px] font-semibold text-slate-500 leading-relaxed">{group.desc}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black border ${
                    group.status === '待人工核验'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : group.status === '待上传'
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}>
                    {group.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex-1 rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-[10px] font-black text-[#0052d9] hover:bg-blue-50">
                    上传
                  </button>
                  <button className="flex-1 rounded-lg border border-emerald-100 bg-white px-2 py-1.5 text-[10px] font-black text-emerald-700 hover:bg-emerald-50">
                    解析
                  </button>
                  <button
                    onClick={() => handleShebaoPrimaryAction('verify')}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-black text-slate-700 hover:bg-slate-100"
                  >
                    校对
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {shebaoStep === 5 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700">工资单原件预览</span>
                <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">第 4/9 页</span>
              </div>
              <div className="mt-3 h-36 rounded-xl bg-white border border-slate-100 p-3 text-[9px] text-slate-400 font-semibold leading-relaxed">
                工资单 PDF 页面缩略预览<br />
                已识别红章、年月、单位应发、单位实发、奖金字段。
              </div>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-700">识别结果</span>
                <button
                  type="button"
                  onClick={() => handleShebaoPrimaryAction('generate')}
                  className="rounded-lg bg-[#0052d9] px-3 py-1.5 text-[10px] font-black text-white hover:bg-blue-700"
                >
                  核验通过
                </button>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 text-[9px] font-bold">
                {['年月', '单位应发', '单位实发', '奖金', '201704', '6308.97', '5540.06', '-', '201705', '7194.18', '6336.75', '-', '201706', '5166.23', '4477.11', '-'].map((cell, idx) => (
                  <span key={`${cell}-${idx}`} className={`rounded-md px-1.5 py-1 ${idx < 4 ? 'bg-[#0052d9] text-white' : 'bg-white text-slate-600'}`}>
                    {cell}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {shebaoStep === 7 && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-3">
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-[10px] font-black text-amber-700">报告草稿预览</p>
              <h4 className="mt-3 text-sm font-black text-slate-900">稽核案件相关情况专项审计报告</h4>
              <div className="mt-4 space-y-2 text-[10px] font-semibold text-slate-600">
                <p className="bg-yellow-100 rounded px-2 py-1">沪社保稽字2023050001稽核案件相关情况专项审计报告</p>
                <p>年度：2023</p>
                <p>投诉人：张蓉娟</p>
                <p>被投诉单位：上海前锦众程人力资源有限公司</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-black text-slate-700">
                  <span className="text-amber-700">AI 填写 15/24</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-[#0052d9]">已核对 {reportVerifiedCount}/24</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifiedReportItems(shebaoReportItems.map(item => item.label))}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black text-white hover:bg-emerald-700"
                >
                  一键确认
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {shebaoReportItems.map((item) => {
                  const verified = verifiedReportItems.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleReportItem(item.label)}
                      className={`w-full rounded-xl border p-3 text-left transition-all ${
                        verified ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-white hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-slate-700">{item.label}</span>
                        <span className={`text-[9px] font-black rounded px-1.5 py-0.5 ${
                          verified ? 'bg-emerald-500 text-white' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {verified ? '已确认' : item.source}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">{item.value}</p>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => handleShebaoPrimaryAction('review')}
                className="mt-3 w-full rounded-xl bg-orange-500 px-3 py-2 text-[10px] font-black text-white hover:bg-orange-600"
              >
                生成报告草稿
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const shouldShowShebaoGuidance = (msg: Message, index: number) => {
    if (!isShebaoAgent || msg.sender !== 'agent') return false;
    const isLatestAgentMessage = messages.slice(index + 1).every(message => message.sender !== 'agent');
    return isLatestAgentMessage;
  };

  if (showWelcomeGuide) {
    return (
      <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_50%_18%,rgba(219,232,255,0.95)_0%,rgba(244,247,252,0.9)_28%,#f6f8fb_70%)] px-5 py-4 text-[#181c23] custom-scrollbar" id="agent-generic-view">
        <main className="mx-auto flex min-h-full max-w-[940px] -translate-y-8 flex-col items-center justify-center py-6">
          <div className="-translate-y-8 flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-[conic-gradient(from_160deg,rgba(14,165,233,0.10),rgba(99,102,241,0.34),rgba(255,255,255,0.72),rgba(14,165,233,0.10))] blur-xl" />
              <div className="absolute -inset-2 rounded-full border border-white/80 bg-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]" />
              <div className="relative rounded-[22px] bg-white/70 p-1.5 shadow-[0_16px_36px_rgba(34,69,127,0.18)] ring-1 ring-white/90 backdrop-blur">
                <AgentSVGAvatar id={agentId} size="hr" />
              </div>
              <span className="absolute bottom-2 right-0 flex h-7 w-7 items-center justify-center rounded-xl border-[3px] border-white bg-sky-600 shadow-[0_8px_16px_rgba(2,132,199,0.22)]">
                <Sparkles className="h-3 w-3 text-white" />
              </span>
            </div>
            <h1 className="mt-5 text-[29px] font-black tracking-tight text-gray-950">{agentName}</h1>
            <h2 className="mt-2 text-[17px] font-black tracking-tight text-gray-700">有什么需要我协助吗？</h2>
            <p className="mt-2.5 max-w-[680px] text-[12px] font-bold leading-relaxed text-gray-500">{config.welcomeSubtitle}</p>
          </div>

          <div className="mt-3 w-full overflow-hidden rounded-xl border border-[#dfe2ed] bg-white shadow-[0_10px_28px_rgba(18,27,46,0.07)]">
            <textarea value={inputText} onChange={event => setInputText(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(); } }} placeholder={config.placeholder} className="h-[76px] w-full resize-none bg-transparent px-4 py-3 text-[13px] font-semibold text-gray-800 outline-none placeholder:text-gray-400" />
            <div className="flex h-11 items-center justify-between gap-3 border-t border-gray-100 px-3">
              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-gray-50"><Paperclip className="h-3.5 w-3.5" />附加文件</button>
                <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-gray-50"><Database className="h-3.5 w-3.5" />选择连接<ChevronRight className="h-3 w-3 rotate-90" /></button>
                <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 hover:bg-gray-50"><BookOpen className="h-3.5 w-3.5" />知识库<ChevronRight className="h-3 w-3 rotate-90" /></button>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-black text-gray-600"><span className="rounded-md bg-gray-50 px-2 py-1">deepseek-v4-flash</span><button type="button" title="发送" onClick={() => handleSend()} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white hover:bg-gray-900"><Send className="h-3.5 w-3.5" /></button></div>
            </div>
          </div>

        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fc] select-none" id="agent-generic-view">
      
      {/* 1. Header (Dynamic visual styling across agents) */}
      <header className="h-16 border-b border-slate-200/60 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-black text-slate-800 tracking-tight">{agentName}</h1>
          <span className={`text-[10px] ${theme.badgeCls} font-bold px-2.5 py-0.5 rounded-full border`}>
            {agentRole}
          </span>
          {selectedSubItemId && (
            <span className="text-[9px] bg-slate-50 text-slate-500 border border-slate-200/50 font-bold px-2 py-0.5 rounded">
              当前会话
            </span>
          )}
          {!showWelcomeGuide && !selectedSubItemId && (
            <button 
              onClick={handleReset}
              className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              返回引导页
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Action location button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-bold rounded-lg transition-colors cursor-pointer">
            <span className={`w-4 h-4 ${theme.buttonBg} rounded flex items-center justify-center text-[10px] font-black`}>F</span>
            <span>打开位置 File</span>
          </button>

          <div className="h-7 w-px bg-slate-200 mx-1" />
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <List className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <Columns className="w-4 h-4" />
          </button>
          <button className={`p-2 rounded-lg ${theme.accentBg} cursor-pointer`}>
            <Layout className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Block */}
      {showWelcomeGuide ? (
        
        /* ==================== A: THE INITIAL GREETING / GUIDANCE SCREEN ==================== */
        <div className={`flex-1 overflow-y-auto px-6 py-10 md:py-14 bg-gradient-to-b ${theme.bgGradient} flex flex-col justify-between custom-scrollbar`}>
          
          {/* Upper Header Control Row */}
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-slate-400 text-xs font-bold border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-1 text-slate-700 cursor-pointer hover:text-slate-950">
              <span>智能体会话</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <button className="hover:text-slate-600 cursor-pointer"><Share2 className="w-4 h-4" /></button>
              <button className="hover:text-slate-600 cursor-pointer"><MoreHorizontal className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Centered Digital Employee Profile with soft halo background */}
          <div className="text-center space-y-5 max-w-2xl mx-auto my-auto">
            <div className="relative inline-block mx-auto">
              {/* Pulsing Concentric Aura Glow mapping to brand color */}
              <div className={`absolute -inset-2.5 rounded-full ${theme.lightBg} opacity-60 blur-sm animate-pulse`} />
              <div className="relative">
                <AgentSVGAvatar id={agentId} size="lg" />
                <span className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {config.welcomeTitle}
              </h2>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-semibold max-w-xl mx-auto">
                {config.welcomeSubtitle}
              </p>
            </div>
          </div>

          {/* Two Interactive Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full mt-8 md:mt-12">
            
            {/* Card Left: Action 1 */}
            <button
              type="button"
              onClick={() => handleCardClick('left')}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between ${theme.borderAccent} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden shadow-sm cursor-pointer text-left`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/10 rounded-full blur-2xl group-hover:bg-slate-100/20 transition-all duration-300" />
              
              <div className="space-y-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center border border-transparent transition-colors`}>
                  {renderCardIcon(config.cardLeft.iconType)}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1 group-hover:text-slate-950 transition-colors">
                    <span>{config.cardLeft.title}</span>
                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <div className={`text-[10px] ${theme.accentText} font-black tracking-wide uppercase`}>
                    {config.cardLeft.action}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {config.cardLeft.desc}
                </p>
              </div>
            </button>

            {/* Card Right: Action 2 */}
            <button
              type="button"
              onClick={() => handleCardClick('right')}
              className={`bg-white border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between ${theme.borderAccent} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group relative overflow-hidden shadow-sm cursor-pointer text-left`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/10 rounded-full blur-2xl group-hover:bg-slate-100/20 transition-all duration-300" />
              
              <div className="space-y-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${theme.accentBg} flex items-center justify-center border border-transparent transition-colors`}>
                  {renderCardIcon(config.cardRight.iconType)}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1 group-hover:text-slate-950 transition-colors">
                    <span>{config.cardRight.title}</span>
                    <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                  </h3>
                  <div className={`text-[10px] ${theme.accentText} font-black tracking-wide uppercase`}>
                    {config.cardRight.action}
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  {config.cardRight.desc}
                </p>
              </div>
            </button>

          </div>

          {/* Quick prompt pills */}
          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto w-full mt-8">
            {config.pills.map((pill, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(pill)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200/80 text-[10.5px] text-slate-600 hover:text-slate-800 rounded-full font-bold shadow-sm transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${theme.accentText}`} />
                <span>{pill}</span>
              </button>
            ))}
          </div>

          {/* Progress / Breadcrumbs tracker bar */}
          <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 border border-slate-200/40 p-3 rounded-2xl mt-8">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-500 font-extrabold rounded-lg hover:bg-slate-50 shadow-sm cursor-pointer shrink-0">
              <span>{config.executionLabel}</span>
              <ChevronRight className="w-3.5 h-3.5 rotate-90 text-slate-400" />
            </button>

            {/* Step flow */}
            <div className="flex flex-wrap items-center justify-center gap-1 text-[10.5px] text-slate-400 font-bold">
              {config.breadcrumbs.map((step, sIdx) => (
                <div key={sIdx} className="flex items-center">
                  <span className={`${sIdx === 0 ? `${theme.accentText} font-extrabold` : ''}`}>{step}</span>
                  {sIdx < config.breadcrumbs.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-300" />
                  )}
                </div>
              ))}
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-[10px] text-slate-500 font-bold rounded-lg hover:bg-slate-50 shadow-sm cursor-pointer shrink-0">
              <span>会话文件夹</span>
            </button>
          </div>

          {/* Bottom Custom Guidance input box */}
          <div className={`max-w-3xl mx-auto w-full mt-6 bg-white border border-slate-200 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md ${theme.inputBorder} transition-all`}>
            <textarea 
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isShebaoAgent ? '可补充特殊要求；也可以先选择新建项目或进入已有项目。' : '按 Shift + Return 换行，输入您具体的审计或审查要求...'}
              className="w-full bg-transparent border-none outline-none text-xs font-semibold text-slate-700 placeholder-slate-400 px-1 resize-none min-h-[50px]"
            />

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-1 sm:gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">附加文件</span>
                </button>
                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">数据连接</span>
                </button>
                <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">企业知识库</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[9.5px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md cursor-pointer hover:bg-slate-100">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  <span>deepseek-r1-model</span>
                  <ChevronRight className="w-2.5 h-2.5 rotate-90" />
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className={`p-2.5 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                    inputText.trim() 
                      ? `${theme.buttonBg} shadow-md text-white` 
                      : 'bg-slate-100 text-slate-300'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      ) : (

        /* ==================== B: THE ACTIVE CONVERSATION SCREEN ==================== */
        <div className="flex-1 flex overflow-hidden bg-[#f4f6fa]" id="active-conversation-screen">
          
          {/* Left Chat Messaging Workspace */}
          <div className="flex-1 flex flex-col h-full relative border-r border-[#dfe2ed]">
            
            {/* Top Sticky summary box */}
            <div className="px-5 py-2 bg-[#f4f6fa] flex justify-center shrink-0">
              <div className="bg-[#ebedf3] border border-white/60 text-[11px] text-gray-600 font-bold px-4 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
                <span className="bg-[#0052d9]/10 text-[#0052d9] px-1.5 py-0.5 rounded text-[9px] font-black uppercase">置顶摘要</span>
                <span>{config.summary}</span>
              </div>
            </div>

            {/* Scrollable messages log */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 custom-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 animate-pulse" />
                  <p className="text-xs font-bold">
                    {isShebaoAgent ? '请选择新建项目或进入已有项目开始处理' : '对话记录为空，请输入您想要审查的内容'}
                  </p>
                </div>
              ) : (
                messages.map((msg, msgIndex) => (
                  <div 
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    {msg.sender === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 text-xs font-bold border border-white shrink-0 shadow-sm">
                        {msg.avatarText || '符'}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-[#dbe1ff] flex items-center justify-center text-[#0052d9] font-black text-xs shrink-0 shadow-sm">
                        {avatarText || '审'}
                      </div>
                    )}

                    {/* Message Body Balloon */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className={`flex items-center gap-2 text-[10px] text-gray-400 font-bold ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        <span>{msg.senderName}</span>
                        <span>{msg.time}</span>
                        {msg.sender === 'agent' && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-1 py-0.1 rounded font-bold">
                            已调用
                          </span>
                        )}
                      </div>

                      {/* Chat balloon with standard gray & white styling */}
                      <div className={`p-4 rounded-2xl shadow-sm border ${
                        msg.sender === 'user' 
                          ? 'bg-white border-gray-100 rounded-tr-none text-xs text-gray-800 font-medium' 
                          : 'bg-white border-[#e5e9f5] rounded-tl-none space-y-3.5'
                      }`}>
                        {/* Body content */}
                        <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line font-medium">
                          {msg.content}
                        </p>

                        {/* Excel file widgets if attached */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5">
                            {msg.files.map((file, idx) => (
                              <div 
                                key={idx}
                                className="bg-[#fcfdfe] hover:bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-center gap-2.5 cursor-pointer shadow-inner transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                  <FileSpreadsheet className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-gray-700 truncate">{file.name}</p>
                                  <p className="text-[9px] text-gray-400">{file.size}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Identified parameters panel */}
                        {msg.identifiedInfo && (
                          <div className="bg-[#fcfcfd] border border-gray-100 rounded-xl p-3.5 space-y-2.5">
                            <div className="flex items-center gap-1.5 border-b border-gray-50 pb-2">
                              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-[10px] font-black text-gray-700">已识别信息</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
                              <div>
                                <span className="text-gray-400 font-bold block mb-0.5">数据范围</span>
                                <span className="text-gray-700 font-semibold">{msg.identifiedInfo.scope}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block mb-0.5">期间</span>
                                <span className="text-gray-700 font-semibold">{msg.identifiedInfo.period}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block mb-0.5">审计对象</span>
                                <span className="text-gray-700 font-semibold">{msg.identifiedInfo.target}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 font-bold block mb-0.5">状态</span>
                                <span className="text-gray-700 font-semibold text-amber-600 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {msg.identifiedInfo.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Generated deliverables list */}
                        {msg.generatedDocs && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-extrabold text-gray-500 tracking-wide">生成如下内容</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {msg.generatedDocs.map((doc, dIdx) => (
                                <div key={dIdx} className="bg-[#f6f8fc] border border-gray-100 rounded-xl p-3.5 space-y-3 shadow-inner hover:border-blue-100 transition-colors">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200/50 font-bold px-1.5 py-0.5 rounded">
                                      {doc.status}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-[11px] font-black text-gray-800">{doc.title}</h4>
                                    <p className="text-[9px] text-gray-400 mt-1 leading-snug line-clamp-2">{doc.desc}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${doc.progress}%` }} />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* System warm advice tip */}
                        {msg.generatedDocs && (
                          <div className="bg-amber-50 border border-amber-200/30 text-[10px] text-amber-800 font-bold p-3 rounded-xl flex items-center gap-2">
                            <span>💡</span>
                            <span>请继续补充项目信息，或导入更多关联底稿，以便我们完成多维审核。</span>
                          </div>
                        )}

                        {msg.generatedDocs && onCreateProjectFromSeed && (
                          <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-slate-800">底稿已完成，可直接建立项目</p>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1 leading-relaxed">
                                会话内容、附加文件和已生成底稿会自动预填到待建项目中。
                              </p>
                            </div>
                            <button
                              onClick={() => onCreateProjectFromSeed(createProjectSeed(msg))}
                              className={`shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black ${theme.buttonBg} shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5`}
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>新建项目</span>
                            </button>
                          </div>
                        )}

                        {shouldShowShebaoGuidance(msg, msgIndex) && renderShebaoWorkflowPanel()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Bottom active chat input box */}
            <div className="p-4 bg-[#f4f6fa] shrink-0 border-t border-[#dfe2ed]">
              <div className="bg-white border border-[#c9cedd] rounded-2xl p-2.5 flex items-center gap-2.5 shadow-sm focus-within:border-[#0052d9] focus-within:ring-2 focus-within:ring-[#0052d9]/5 transition-all">
                <button className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>

                <span className="text-[10px] bg-blue-50 text-[#0052d9] border border-blue-100/50 font-bold px-2.5 py-1 rounded-full shrink-0">
                  {agentName}
                </span>

                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isShebaoAgent ? '补充说明或异常口径；下一步操作可在智能体回复中选择。' : config.placeholder}
                  className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-gray-700 placeholder-gray-300 px-1"
                />

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                    Agent
                  </span>
                  <button 
                    onClick={() => handleSend()}
                    disabled={!inputText.trim()}
                    className={`p-2 rounded-xl flex items-center justify-center transition-all shadow-sm cursor-pointer ${
                      inputText.trim() 
                        ? 'bg-[#0052d9] text-white hover:bg-blue-700 hover:shadow-md active:scale-95' 
                        : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Environment parameters info panel */}
          <div className="w-72 bg-white flex flex-col h-full overflow-y-auto border-l border-[#dfe2ed]/10 p-5 space-y-6 custom-scrollbar shrink-0 shadow-inner">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
              <h2 className="text-xs font-black text-gray-800 tracking-wider">环境信息</h2>
              <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Current Active Worker badge */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">当前 Agent</span>
              <div className="flex">
                <span className="text-[10px] bg-blue-50 text-[#0052d9] font-black px-2.5 py-1 rounded-md border border-blue-100/50 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[#0052d9] rounded-full animate-pulse" />
                  {agentName}
                </span>
              </div>
            </div>

            {/* Current Project title */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">项目</span>
              <p className="text-xs font-black text-gray-800">{config.project}</p>
            </div>

            {isShebaoAgent && (
              <div className="space-y-2.5 rounded-2xl border border-blue-100 bg-blue-50/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-[#0052d9]">当前流程</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black text-[#0052d9] border border-blue-100">
                    {shebaoWorkflowSteps[shebaoStep - 1]?.title}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#0052d9]" style={{ width: `${(shebaoStep / 7) * 100}%` }} />
                </div>
                <p className="text-[10px] font-semibold leading-relaxed text-slate-600">
                  流程会在对话中逐步给出可选动作，输入框仅用于补充特殊审计口径。
                </p>
              </div>
            )}

            {/* Attached datasources list */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">导入数据</span>
              <div className="space-y-2">
                {recentFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-2.5 hover:border-blue-100/40 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold text-gray-700 truncate">{file.name}</span>
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Steps & Milestones checklist - fully interactive toggles! */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">计划事项</span>
              <div className="space-y-2">
                {planItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleTogglePlan(item.id)}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0">
                        {item.status === '已完成' ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : item.status === '进行中' ? (
                          <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-500 flex items-center justify-center text-[#0052d9]">
                            <span className="w-1.5 h-1.5 bg-[#0052d9] rounded-full animate-ping" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-gray-300" />
                        )}
                      </div>
                      <span className={`text-[10px] font-bold truncate ${
                        item.status === '已完成' ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}>
                        {item.text}
                      </span>
                    </div>
                    <div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        item.status === '已完成' 
                          ? 'bg-emerald-50/60 text-emerald-700 border-emerald-100' 
                          : item.status === '进行中' 
                            ? 'bg-blue-50 text-[#0052d9] border-blue-100' 
                            : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Deliverable tags */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">交付物</span>
              <div className="flex flex-wrap gap-1.5">
                {config.deliverables.map((del, idx) => (
                  <span key={idx} className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    {del}
                    <ArrowUpRight className="w-2.5 h-2.5" />
                  </span>
                ))}
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/40 px-2 py-0.5 rounded-md">
                  待复核
                </span>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
