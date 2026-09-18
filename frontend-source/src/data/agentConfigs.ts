export interface Message {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  avatarText?: string;
  time: string;
  content: string;
  files?: { name: string; size: string; type: string }[];
  identifiedInfo?: {
    scope: string;
    period: string;
    target: string;
    status: string;
  };
  generatedDocs?: {
    title: string;
    status: string;
    desc: string;
    progress: number;
  }[];
}

export interface AgentGenericViewProps {
  agentId: string;
  agentName: string;
  agentRole: string;
  avatarText: string;
  selectedSubItemId?: string | null;
}

export interface AgentConfig {
  summary: string;
  project: string;
  importFiles: { name: string }[];
  planItems: { id: number; text: string; status: string }[];
  deliverables: string[];
  placeholder: string;
  messages: Message[];
  welcomeTitle: string;
  welcomeSubtitle: string;
  pills: string[];
  executionLabel: string;
  breadcrumbs: string[];
  cardLeft: {
    iconType: 'scale' | 'shield-alert' | 'spreadsheet' | 'search' | 'calculator' | 'face' | 'plus' | 'archive';
    title: string;
    action: string;
    desc: string;
    userPrompt: string;
    agentResponse: string;
    identifiedInfo?: Message['identifiedInfo'];
    generatedDocs?: Message['generatedDocs'];
  };
  cardRight: {
    iconType: 'shield-check' | 'plus' | 'archive' | 'heart' | 'signature' | 'bell';
    title: string;
    action: string;
    desc: string;
    userPrompt: string;
    agentResponse: string;
    identifiedInfo?: Message['identifiedInfo'];
    generatedDocs?: Message['generatedDocs'];
  };
}

export const agentConfigurations: Record<string, AgentConfig> = {
  'agent-shebao': {
    summary: '已关联 2 份社保缴存账目，正在执行二路个税工资基数偏差比对',
    project: '2025年度社保专项审计比对项目',
    importFiles: [
      { name: '2025年社保缴费明细表.xlsx' },
      { name: '2025年个税申报工资发放明细.xlsx' }
    ],
    planItems: [
      { id: 1, text: '比对各部门参保覆盖人数', status: '已完成' },
      { id: 2, text: '测算缴存基数与个税发放基数偏差', status: '进行中' },
      { id: 3, text: '自动筛选疑似超标与漏缴名单', status: '待办' },
      { id: 4, text: '生成社保审计调整分录底稿', status: '待办' }
    ],
    deliverables: ['社保差异明细表', '审计调整分录底稿'],
    placeholder: '请补充：异常样本员工的工资补差口径、调账依据等...',
    welcomeTitle: '你好，我是社保专项审计智能体',
    welcomeSubtitle: '我将协助您对账社保公积金申报明细与工资计税总额，一键比对两路基数偏差，并导出审计调整分录底稿。',
    pills: ['2025年社保最新标准', '上海市代扣比例基准', '补缴审计核算口径'],
    executionLabel: '社保核算',
    breadcrumbs: ['导入对账单', '基数智能对撞', '差异自动标记', '输出调整分录'],
    cardLeft: {
      iconType: 'plus',
      title: '新建项目',
      action: '创建社保专项审计',
      desc: '从零建档，选择输出目录并上传立案审批表、营业执照、身份证等基础资料。',
      userPrompt: '选择：新建社保专项审计项目',
      agentResponse: '好的，我们先创建社保专项审计项目。请按下面的引导依次确认输出目录、上传建档资料，并核对系统识别出的投标人、被投诉单位、审计期间和报告字号。',
      identifiedInfo: {
        scope: '社保专项审计项目建档',
        period: '2026 年度',
        target: '张蓉娟 - 上海前锦众程人力资源有限公司',
        status: '等待确认建档资料'
      },
      generatedDocs: undefined
    },
    cardRight: {
      iconType: 'archive',
      title: '进入已有项目',
      action: '继续 report_ready 项目',
      desc: '从已有项目列表选择可继续处理的项目，查看资料数量、待校对数量和最近更新时间。',
      userPrompt: '选择：进入已有 report_ready 项目',
      agentResponse: '已为您读取已有社保专项审计项目。请选择要继续处理的项目；进入后我会引导您完成资料上传、工资校对、附件生成和报告审核。',
      identifiedInfo: {
        scope: '已有社保专项审计项目列表',
        period: '2026 年度',
        target: '张蓉娟 - 上海前锦众程人力资源有限公司',
        status: '2 个项目可继续处理'
      },
      generatedDocs: undefined
    },
    messages: []
  },
  'agent-人事': {
    summary: '花名册与假勤打卡记录已加载，发现 3 份劳动合同临近到期',
    project: '上海大学日常行政人事管理与合规审查',
    importFiles: [
      { name: '上海大学员工花名册_2026.xlsx' },
      { name: '本期考勤系统打卡明细.xlsx' }
    ],
    planItems: [
      { id: 1, text: '核实各教研室出勤与假勤单据匹配', status: '已完成' },
      { id: 2, text: '预警 30天内到期劳动合同人员', status: '已完成' },
      { id: 3, text: '自动起草续签意向书及提醒函', status: '进行中' }
    ],
    deliverables: ['合同续签提醒函', '假勤异常核对表'],
    placeholder: '请输入您想调整的个人合同期限、续签偏好，或直接上传模板合同...',
    welcomeTitle: '你好，我是行政人事合同助手',
    welcomeSubtitle: '先选择合同审查或合同生成，上传模板或填写用工信息后，我会帮你检查风险、整理依据并生成合同草稿。',
    pills: ['更新基础劳动法', '劳动合同示范本', '更新最新条款'],
    executionLabel: '合同流程',
    breadcrumbs: ['上传文件', '自动识别', '风险扫描', '人工确认'],
    cardLeft: {
      iconType: 'shield-alert',
      title: '合同审查',
      action: '上传合同模板',
      desc: '检查劳动合同条款、风险说明和法规依据，评估在试用期、加班、竞业等条款的合规漏洞。',
      userPrompt: '帮我审查一下新起草的教职工用工合同，检查可能存在的法律及争议漏洞。',
      agentResponse: '好的，教职工合同合规审查程序已启动！我将基于我国《劳动合同法》及上海市最新地方法规，从试用期期限、工作职责重叠、解除合同补偿及竞业金设定等多个关键法条进行风险穿透并帮您标红漏洞。',
      identifiedInfo: {
        scope: '用工合同标准条文合规检索',
        period: '2026 年度',
        target: '上海大学教职工聘用合同模板',
        status: '发现 1 处高风险条款，已智能标红'
      },
      generatedDocs: [
        { title: '合同条款合规报告', status: '已生成', desc: '列示涉诉、免责等不合理法条审查', progress: 100 },
        { title: '合同修改建议批注', status: '已生成', desc: '给出规范替换词与法学界主流意见', progress: 100 }
      ]
    },
    cardRight: {
      iconType: 'plus',
      title: '合同生成',
      action: '选择已发布模板',
      desc: '说清楚岗位、期限、薪酬、竞业限制等用工信息，一键套用学校官方模板生成合同草稿。',
      userPrompt: '帮我看一下这个月有哪些人的劳动合同快到期了，生成一个续签提醒单。',
      agentResponse: '收到指令！已为您检索花名册合同记录，当前有 **3 名** 员工的劳动合同将在 30 天内到期：\n1. **陈华** (研发部): 2026年7月31日到期 (剩余 31 天)\n2. **陈嘉妍** (测试部): 2026年7月28日到期 (剩余 28 天)\n3. **吴宜松** (测试部): 2026年8月05日到期 (剩余 36 天)\n\n我已自动帮您起草了这三位员工的《劳动合同续签意向书.docx》，并存放于交付物中，您可以随时下载打印。',
      identifiedInfo: {
        scope: '全校在册教职工合同大排查',
        period: '2026年 7-8月',
        target: '劳动合同续签合规排查',
        status: '意向书已自动起草，待确认'
      },
      generatedDocs: [
        { title: '合同续签提醒单', status: '已生成', desc: '列明人员、部门、到期日与提醒状态', progress: 100 },
        { title: '续签意向书起草', status: '已生成', desc: '按规定模板批量填充个人基础要素', progress: 100 }
      ]
    },
    messages: []
  },
  'agent-年报': {
    summary: '财务三张报表已平衡映射，序时账 analysis 发现 12 项潜在截止期跨期差异',
    project: '上海大学 2025 年度财务报告法定审计项目',
    importFiles: [
      { name: '序时账.xlsx' },
      { name: '科目余额表.xlsx' },
      { name: '财务报表.xlsx' }
    ],
    planItems: [
      { id: 1, text: '自动核算科目余额并执行账账核对', status: '已完成' },
      { id: 2, text: '执行试算平衡（TB）表格自动映射', status: '进行中' },
      { id: 3, text: '筛选往来账项函证异常与跨期交易', status: '待办' },
      { id: 4, text: '生成实质性审计底稿包Excel', status: '待办' }
    ],
    deliverables: ['综合性底稿', '实质性底稿', 'TB试算表'],
    placeholder: '请补充：项目重要性水平（PM）、财务分类标准或需重点核查往来款科目...',
    welcomeTitle: '你好，我是年报审计智能体',
    welcomeSubtitle: '支持一键导入序时账、科目余额表和财务报表，自动化比对勾稽关系，测算大额往来疑点并打包输出符合执业准则的底稿包。',
    pills: ['2025执业审计指南', '重要性水平测算表', 'TB标准映射字典'],
    executionLabel: '年报审计',
    breadcrumbs: ['导入原始数据', '账账勾稽核对', '试算平衡映射', '打包底稿输出'],
    cardLeft: {
      iconType: 'spreadsheet',
      title: '智能分析核对',
      action: '一键读取解析数据',
      desc: '读取 Excel 序时账，校验财务报表期末数与期初数勾稽是否完全一致，抓取潜在错报项。',
      userPrompt: '帮我做一个上海大学的2025年年报审计，导入以下财务信息并做初步勾稽平衡校验。',
      agentResponse: '收到上海大学2025年年报审计项目。系统已成功读取您上传的科目余额表与序时账。我正通过勾稽分析程序对资产、负债、权益各大科目进行借贷对冲校验。试算平衡结果显示报表结构良好，账目相符率达 100%。',
      identifiedInfo: {
        scope: '全科目账账勾稽与对账校验',
        period: '2025 年度',
        target: '上海大学 2025 财务年报勾稽核查',
        status: '对账平衡，发现 0 处逻辑硬伤'
      },
      generatedDocs: [
        { title: '报表勾稽对比单', status: '已生成', desc: '自动验证期初期末勾稽一致性', progress: 100 },
        { title: '序时账借贷比对表', status: '已生成', desc: '筛查序时账凭证中无对应借贷的条目', progress: 100 }
      ]
    },
    cardRight: {
      iconType: 'archive',
      title: '生成底稿包',
      action: '输出审计交付物',
      desc: '自动编制综合性底稿（重要性、分析程序）与货币资金、往来等实质性底稿，并输出TB表。',
      userPrompt: '帮我编制上海大学2025年标准的实质性底稿包 and 试算平衡（TB）表。',
      agentResponse: '开始为您自动生成底稿初稿！我已按中国注册会计师执业准则要求，为您套用了高校标准审计底稿模板。正在计算‘综合性底稿’与‘实质性底稿’。主要计算内容包括折旧测算、函证往来比对以及跨期截止测试，结果已存放在右侧目录。',
      identifiedInfo: {
        scope: '执业底稿标准化自动编译',
        period: '2025 年度',
        target: '上海大学财务实质性程序底稿',
        status: '底稿初稿已生成，待补充口径'
      },
      generatedDocs: [
        { title: '综合性底稿生成', status: '已生成', desc: '包括初步业务活动、审计计划、重要性水平测算', progress: 100 },
        { title: '实质性程序底稿包', status: '已生成', desc: '包含银行存款对账、固定资产折旧及往来函证底稿', progress: 100 },
        { title: 'TB 试算平衡表', status: '已生成', desc: '支持重分类调整与未更正错报汇总映射', progress: 100 }
      ]
    },
    messages: []
  },
  'agent-文档': {
    summary: '目录智能扫描已完成，识别到 12 份未分类合同与 45 份影像发票',
    project: '上海大学 2025 财务审计材料智能归档',
    importFiles: [
      { name: '未归档合同扫描件.zip' },
      { name: '增值税影像发票合集.zip' }
    ],
    planItems: [
      { id: 1, text: '执行合同扫描件 OCR 语义分析', status: '已完成' },
      { id: 2, text: '提取合同关键要素（金额、对方、期限）', status: '进行中' },
      { id: 3, text: '发票自动关联对账凭证', status: '待办' }
    ],
    deliverables: ['合同结构化归档索引', '发票对账流水单'],
    placeholder: '请补充：归档分类层级（按部门/按季度/按项目）、特定提取词...',
    welcomeTitle: '你好，我是智能文档管家',
    welcomeSubtitle: '支持批量导入杂乱的文件影像件。我将自动进行多模态OCR提取，并分析合同及发票要素，实现自动智能分类与目录重组。',
    pills: ['数字影像归档目录规范', '发票OCR识别模板', '保密合规红线'],
    executionLabel: '文档归档',
    breadcrumbs: ['拖入临时夹', '影像扫描解析', '要素深度提取', '自动分类归档'],
    cardLeft: {
      iconType: 'search',
      title: '要素智能提取',
      action: '多模态OCR识别提取',
      desc: '高精提取合同或发票中的签约对方、合作金额、到期时间、发票代码等关键要素，并归类为Excel索引。',
      userPrompt: '把最近新上传的合同扫描件批量提取要素，自动提取对方签约名称、金额和付款节点。',
      agentResponse: '已成功解压并扫描 `/上海大学2025/未分类合同/` 目录。通过文档深度聚类和要素智能OCR，我对 12 份新上传合同完成了分类和数据提取。\n\n**整理报告如下**:\n- 8 份销售合同已归类至 `[项目/销售合同/2025Q2]`\n- 4 份采购合同已归类至 `[项目/采购合同/2025Q2]`\n- 各合同的签约主体、合作金额及收付款节点已自动形成结构化Excel索引表。',
      identifiedInfo: {
        scope: '未归档目录智能多模态识别',
        period: '2025 年度',
        target: '上海大学财务合同合规归类',
        status: '归档完毕，索引表已生成'
      },
      generatedDocs: [
        { title: '合同结构化索引表', status: '已生成', desc: '列示所有合同的主体、金额、核心条款', progress: 100 },
        { title: '多维聚类目录划分', status: '已生成', desc: '按项目和收付方向自动创建子文件夹', progress: 100 }
      ]
    },
    cardRight: {
      iconType: 'heart',
      title: '多模态聚类重构',
      action: '混乱文件夹一键编排',
      desc: '分析图片、PDF等多格式杂乱文档属性，识别其属于发票、合同还是流水账单，一键归档为清晰层级。',
      userPrompt: '一键将财务临时接收到的各类发票、账单影像件按照业务属性与月份进行重构分类。',
      agentResponse: '文档编排引擎启动。已为您全盘理清接收盘中45份杂乱扫描影像：我已将发票划归‘报销影像单’，银行回单划归‘对账单’。相关时间戳已匹配至2025Q4对应月份归集，为您免除海量手工拖放痛苦。',
      identifiedInfo: {
        scope: '财务影像全科目聚类编排',
        period: '2025 年度',
        target: '财务杂档库一键分级规整',
        status: '整理结束，发现 0 个无法归类文档'
      },
      generatedDocs: [
        { title: '分类层级文件夹树', status: '已生成', desc: '按业务流程、合同、回单多极划分文件夹', progress: 100 },
        { title: '数据影像分类校验清单', status: '已生成', desc: '对发票、合同一致性匹配验证', progress: 100 }
      ]
    },
    messages: []
  },
  'agent-会计': {
    summary: '针对新租赁准则（CAS 21）答疑完成，已按合同执行使用权折旧计算',
    project: '新租赁准则科目衔接与凭证试算',
    importFiles: [
      { name: '新租赁准则应用指引.pdf' },
      { name: '上海大学租赁合同及付款计划表.xlsx' }
    ],
    planItems: [
      { id: 1, text: '租赁负债折现值测算', status: '已完成' },
      { id: 2, text: '测算各月使用权资产计提折旧额', status: '进行中' },
      { id: 3, text: '编制衔接差异调整科目表', status: '待办' }
    ],
    deliverables: ['使用权折旧测算表', '新准则调账分录表'],
    placeholder: '请输入折现率设置比例、租赁资产重估参数...',
    welcomeTitle: '你好，我是新准则会计专家',
    welcomeSubtitle: '特别针对新租赁准则（CAS 21）、新收入准则，提供最权威的专业咨询、计算模型搭建和自动财务折旧、折现分录凭证测算。',
    pills: ['新租赁准则指引', '新收入准则五步法', '调账科目衔接表'],
    executionLabel: '财务折算',
    breadcrumbs: ['条款录入', '现值计算', '摊销折旧测算', '输出记账凭证'],
    cardLeft: {
      iconType: 'calculator',
      title: '租赁准则（CAS 21）测算',
      action: '使用权资产与租赁负债折现',
      desc: '一键折现各期租赁付款额，生成全周期租赁负债未确认融资费用摊销与使用权资产折旧测算表。',
      userPrompt: '上海大学新租赁准则下的使用权资产折旧如何处理？需要试算月折旧分录。',
      agentResponse: '根据新租赁准则（CAS 21）规定：\n1. **入账基准**: 承租人应当在租赁期开始日，按照租赁付款额的折现现值确认租赁负债和使用权资产。\n2. **折旧政策**: 承租人应当在租赁期与租赁资产剩余使用寿命两者孰短的期间内计提折旧。\n3. **试算成果**: 结合您上传的租赁合同明细，我已按 4.35% 折现率对首期租赁合同进行了试算，本期应计提月折旧共计 **12,450.00 元**。已生成完整的月折旧计算书和调整分录凭证。',
      identifiedInfo: {
        scope: 'CAS 21 新租赁准则测算',
        period: '2025 年度',
        target: '上海大学大宗租赁业务衔接',
        status: '试算完成，折旧表已输出'
      },
      generatedDocs: [
        { title: '使用权折旧测算书', status: '已生成', desc: '逐月计算折旧及未确认融资费用摊销', progress: 100 },
        { title: '衔接调账分录凭证', status: '已生成', desc: '新旧准则转换下的科目对冲分录', progress: 100 }
      ]
    },
    cardRight: {
      iconType: 'signature',
      title: '复杂收入合同评估',
      action: '五步法履约义务解析',
      desc: '解析软件授权、硬件交付、维保混合的多重履约合同，按单独售价比例分摊交易价格，生成分期凭证分录。',
      userPrompt: '分析含有软硬件销售与后续 3 年维保的综合采购合同，测算应如何在履约义务中分拆确认各期收入。',
      agentResponse: '收到新收入准则 (CAS 14) 收入分拆评估指令。系统已通过自然语言分析，将该综合合同智能拆解为‘硬件控制权转移（时点确认）’与‘3年技术维保（时段分摊）’两项独立履约义务，并按各自单项售价对100万总合同价进行折算公允比例。',
      identifiedInfo: {
        scope: 'CAS 14 收入五步法对冲分摊',
        period: '2025 年度',
        target: '高校混合商品采购收入分摊',
        status: '分摊就绪，分期分录计算中'
      },
      generatedDocs: [
        { title: '合同履约义务评估书', status: '已生成', desc: '拆解混合销售及服务摊销模式', progress: 100 },
        { title: '交易价格单独售价分摊表', status: '已生成', desc: '计算各履约义务的分摊入账比率', progress: 100 }
      ]
    },
    messages: []
  },
  'agent-报销': {
    summary: '部门餐费报销额度深度审计，2 人餐补额度超 90% 红线预警中',
    project: '上海大学日常办公与差旅报销合规控制项目',
    importFiles: [
      { name: '餐费报销核销总表.xlsx' },
      { name: '本期餐费额度明细库.xlsx' }
    ],
    planItems: [
      { id: 1, text: '过滤重复/假发票与OCR文字审查', status: '已完成' },
      { id: 2, text: '检测部门各成员超支比率', status: '进行中' },
      { id: 3, text: '推送超标预警及提示信息', status: '待办' }
    ],
    deliverables: ['报销合规审查底稿', '超额预警通知书'],
    placeholder: '请输入您想核查的报销账单月份、超限额度，或拖拽发票扫描件...',
    welcomeTitle: '你好，我是智能报销助手',
    welcomeSubtitle: '帮您智能审查餐费、差旅费影像。自动筛查发票重复报销、跨期、假发票疑点，并实时监控部门/个人额度超限。',
    pills: ['全校餐费定额规范', '差旅贴补代扣标准', '发票真伪查验接口'],
    executionLabel: '报销风控',
    breadcrumbs: ['导入发票影像', '影像高精OCR', '防重真伪校验', '超额报警推送'],
    cardLeft: {
      iconType: 'face',
      title: '发票合规查验',
      action: '影像件查重及真伪核验',
      desc: '一键OCR批量识别发票，自动检索历史数据库杜绝“一票多报”，直连税局底账验真伪及抬头合规。',
      userPrompt: '帮我查验本批新申报的餐费发票影像件，审查是否有重复报销或者发票真伪异常。',
      agentResponse: '发票防重及验真比对就绪！正在扫描本批增值税发票。通过解析发票代码与号码，系统历史报销库比对中。真伪查验引擎已调起。稍后我将为您标记出任何疑似重复或写错抬头（如未写上海大学税号）的异常发票。',
      identifiedInfo: {
        scope: '增值税影像票据防重校验',
        period: '2026年 6月期',
        target: '上海大学行政报销发票校验',
        status: '扫描完毕，暂未发现违规发票'
      },
      generatedDocs: [
        { title: '发票验真查实清单', status: '已生成', desc: '直连税局核对影像金额与真伪', progress: 100 },
        { title: '报销抬头白名单校验', status: '已生成', desc: '确认全称、纳税人识别号100%匹配', progress: 100 }
      ]
    },
    cardRight: {
      iconType: 'bell',
      title: '额度监控预警',
      action: '团队报销限额测算',
      desc: '实时汇总监控各教职工或部门已报销余额。额度超出 90% 警戒线自动通知提醒。',
      userPrompt: '帮我查一下我们部门餐费超额预警名单，以及我个人的剩余余额。',
      agentResponse: '收到报销审查指令！已为您完成实时筛查：\n\n**1. 个人餐费余额 (符金雨)**:\n- **核定额度**: 1,000.00 元\n- **已报销**: 240.00 元\n- **剩余可用**: **760.00 元** (状态: 正常)\n\n**2. 部门餐费超额预警 (超 90% 红线)**:\n- **吴立松** (产品负责人): 已报 950.00 元 / 1,000.00 元 (超 95%，已亮红灯预警)\n- **蔡宇豪** (项目成员): 已报 920.00 元 / 1,000.00 元 (超 92%，预警状态)\n\n相关差异报告与预警通知单已写入右侧交付物。',
      identifiedInfo: {
        scope: '餐费核算凭证自动查验比对',
        period: '2026年 6月周期',
        target: '上海大学审计项目组餐补控制',
        status: '超支红灯已亮起，报告已出'
      },
      generatedDocs: [
        { title: '差旅与餐费报销底稿', status: '已生成', desc: '全员月度报销额度与发票真伪审查', progress: 100 },
        { title: '超支限额预警单', status: '已生成', desc: '自动标红超出限额成员及违规风险点', progress: 100 }
      ]
    },
    messages: []
  }
};
