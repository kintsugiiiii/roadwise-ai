import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  initialProjects, 
  initialWorkTasks, 
  initialContracts, 
  initialRecentFiles, 
  chatMembers 
} from './data';
import { Project, WorkTask, Message, ProjectSeedPayload } from './types';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import WorkbenchView from './components/WorkbenchView';
import ProjectCollaborationView from './components/ProjectCollaborationView';
import AccountingAssistantView from './components/AccountingAssistantView';
import DirectChatView from './components/DirectChatView';
import AnnualReportAuditView from './components/AnnualReportAuditView';
import AgentGenericView from './components/AgentGenericView';
import ChatHomeView from './components/ChatHomeView';
import HRManagementAgentView from './components/HRManagementAgentView';
import { PlusCircle, X, Check, Calendar, ChevronDown, Search, ChevronLeft, ChevronRight, PanelTop, RefreshCw, Wifi, Plus, Maximize2, Minimize2, PanelLeft, PanelRight, Terminal, Globe2, Folder, MessageCircle } from 'lucide-react';
import huaxiaoanLogo from './assets/huaxiaoan-logo.png?inline';

type ActiveView = 'workbench' | 'collaboration' | 'assistant' | 'direct-chat' | 'annual-report-audit' | 'hr-management' | 'agent-generic' | 'chat-home';

interface NavigationSnapshot {
  tab: 'chat' | 'work';
  view: ActiveView;
  projectId: string;
  memberName: string;
  agentId: string;
  subItemId: string | null;
}

interface ProjectFormState {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  client: string;
  manager: string;
  department: string;
  primaryType: string;
  detailType: string;
  amount: string;
  requiresReport: boolean;
  summary: string;
}

interface ChatSession {
  id: string;
  title: string;
  time: string;
}

const emptyProjectForm: ProjectFormState = {
  name: '',
  code: '',
  startDate: '2026/06/30',
  endDate: '',
  client: '',
  manager: '符金雨',
  department: 'huaxiaoan-test',
  primaryType: '',
  detailType: '',
  amount: '',
  requiresReport: true,
  summary: '',
};

const projectMemberOptions = [
  { name: '张华轩', avatarText: '张', role: '项目成员' },
  { name: '邱条芬', avatarText: '邱', role: '项目成员' },
  { name: 'ceshi4', avatarText: 'A', role: '项目成员', avatarKind: 'bot' },
  { name: 'ceshi3', avatarText: 'A', role: '项目成员', avatarKind: 'bot' },
  { name: 'ceshi2', avatarText: 'A', role: '项目成员', avatarKind: 'bot' },
  { name: 'ceshi', avatarText: '测', role: '项目成员' },
  { name: '蔡宇豪', avatarText: '蔡', role: '产品经理' },
  { name: '陈华', avatarText: '陈', role: '开发工程师' },
  { name: '陈嘉妍', avatarText: '陈', role: '测试工程师' },
];

const defaultProjectMemberNames = ['张华轩', '邱条芬', 'ceshi4', 'ceshi3', 'ceshi2', 'ceshi'];

const digitalEmployeeDescriptions: Record<string, string> = {
  'agent-会计': '面向审计人员、会计师与项目组的专业财务助手',
  'agent-shebao': '面向华安社保稽核专项审计，辅助完成资料上传、解析确认',
  'agent-年报': '引导完成事业单位年报审计资料上传、解析确认和底稿生成',
  'agent-人事': '面向行政人事合同管理，辅助完成劳动合同和实务审查',
};

const quickAddMenuItems = [
  { label: '终端', shortcut: '', icon: Terminal },
  { label: '浏览器', shortcut: '⌘T', icon: Globe2 },
  { label: '文件', shortcut: '⌘P', icon: Folder },
  { label: '侧边聊天', shortcut: '⌥⌘S', icon: MessageCircle },
];

export default function App() {
  const [currentTab, setTab] = useState<'chat' | 'work'>('work');
  const [activeView, setActiveView] = useState<ActiveView>('workbench');
  
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('wls-3');
  const [projectDetailRequestId, setProjectDetailRequestId] = useState<string | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>('蔡宇豪');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedChatSessionId, setSelectedChatSessionId] = useState<string | null>(null);
  const [members, setMembers] = useState(() => 
    chatMembers.map(m => m.name === '蔡宇豪' ? { ...m, unreadCount: 1 } : { ...m, unreadCount: 0 })
  );

  // Digital Agents state
  const [digitalAgents, setDigitalAgents] = useState([
    {
      id: 'agent-shebao',
      name: '社保专项审计',
      avatarText: '社',
      role: '社保审计助手',
      unreadCount: 1,
      subItems: [
        { id: 'sb-1', name: '数字员工会话', unreadCount: 1 },
      ],
      expanded: true,
    },
    {
      id: 'agent-人事',
      name: '行政人事管理',
      avatarText: '人',
      role: '行政人事助手',
      unreadCount: 0,
      subItems: [
        { id: 'hr-1', name: '数字员工会话', unreadCount: 0 },
      ],
      expanded: true,
    },
    {
      id: 'agent-年报',
      name: '事业单位年报审计',
      avatarText: '审',
      role: '年报审计助手',
      unreadCount: 0,
      subItems: [
        { id: 'nb-1', name: '数字员工会话', unreadCount: 0 },
      ],
      expanded: true,
    },
    {
      id: 'agent-会计',
      name: '财务助手',
      avatarText: '财',
      role: '财务合规助手',
      unreadCount: 1,
      subItems: [
        { id: 'kj-1', name: '数字员工会话', unreadCount: 1 },
      ],
      expanded: true,
    },
  ]);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-年报');
  const [selectedSubItemId, setSelectedSubItemId] = useState<string | null>(null);
  const [navigationIndex, setNavigationIndex] = useState(0);
  const navigationHistoryRef = useRef<NavigationSnapshot[]>([{
    tab: 'work',
    view: 'workbench',
    projectId: 'wls-3',
    memberName: '蔡宇豪',
    agentId: 'agent-年报',
    subItemId: null,
  }]);
  const isRestoringNavigationRef = useRef(false);

  const selectProject = (id: string) => {
    setSelectedProjectId(id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, unreadCount: 0 } : p));
  };

  const selectMember = (name: string) => {
    setSelectedMemberName(name);
    setMembers(prev => prev.map(m => m.name === name ? { ...m, unreadCount: 0 } : m));
  };

  const createNewChatSession = () => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: '新会话',
      time: '刚刚',
    };
    setTab('chat');
    setActiveView('chat-home');
    setSelectedSubItemId(null);
    setSelectedChatSessionId(newSession.id);
    setChatSessions(prev => [newSession, ...prev]);
  };

  const renameChatSession = (id: string, title: string) => {
    setChatSessions(prev => prev.map(session => (
      session.id === id ? { ...session, title } : session
    )));
  };

  const pinChatSession = (id: string) => {
    setChatSessions(prev => {
      const target = prev.find(session => session.id === id);
      if (!target) return prev;
      return [target, ...prev.filter(session => session.id !== id)];
    });
  };

  const deleteChatSession = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
    setSelectedChatSessionId(prev => (prev === id ? null : prev));
  };

  useEffect(() => {
    const currentSnapshot: NavigationSnapshot = {
      tab: currentTab,
      view: activeView,
      projectId: selectedProjectId,
      memberName: selectedMemberName,
      agentId: selectedAgentId,
      subItemId: selectedSubItemId,
    };

    if (isRestoringNavigationRef.current) {
      isRestoringNavigationRef.current = false;
      return;
    }

    const history = navigationHistoryRef.current;
    const latest = history[navigationIndex];
    const isSameSnapshot = latest
      && latest.tab === currentSnapshot.tab
      && latest.view === currentSnapshot.view
      && latest.projectId === currentSnapshot.projectId
      && latest.memberName === currentSnapshot.memberName
      && latest.agentId === currentSnapshot.agentId
      && latest.subItemId === currentSnapshot.subItemId;

    if (isSameSnapshot) return;

    const nextHistory = history.slice(0, navigationIndex + 1);
    nextHistory.push(currentSnapshot);
    navigationHistoryRef.current = nextHistory;
    setNavigationIndex(nextHistory.length - 1);
  }, [activeView, currentTab, navigationIndex, selectedAgentId, selectedMemberName, selectedProjectId, selectedSubItemId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('newProject') === '1') {
      openBlankProjectForm();
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    const projectId = params.get('project');
    if (projectId && projects.some((project) => project.id === projectId)) {
      selectProject(projectId);
      setTab('work');
      setActiveView('collaboration');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const restoreNavigation = (targetIndex: number) => {
    const snapshot = navigationHistoryRef.current[targetIndex];
    if (!snapshot) return;
    isRestoringNavigationRef.current = true;
    setNavigationIndex(targetIndex);
    setTab(snapshot.tab);
    setActiveView(snapshot.view);
    setSelectedProjectId(snapshot.projectId);
    setSelectedMemberName(snapshot.memberName);
    setSelectedAgentId(snapshot.agentId);
    setSelectedSubItemId(snapshot.subItemId);
  };

  const canNavigateBack = navigationIndex > 0;
  const canNavigateForward = navigationIndex < navigationHistoryRef.current.length - 1;
  
  const [tasks, setTasks] = useState<WorkTask[]>(initialWorkTasks);
  const [contracts] = useState(initialContracts);
  const [recentFiles, setRecentFiles] = useState(initialRecentFiles);

  // New project modal state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [isQuickAddMenuOpen, setIsQuickAddMenuOpen] = useState(false);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isWorkbenchAgentOpen, setIsWorkbenchAgentOpen] = useState(false);
  const [isWorkspaceFocusMode, setIsWorkspaceFocusMode] = useState(false);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(emptyProjectForm);
  const [pendingProjectSeed, setPendingProjectSeed] = useState<ProjectSeedPayload | null>(null);
  const [projectMemberSearch, setProjectMemberSearch] = useState('');
  const [selectedProjectMemberNames, setSelectedProjectMemberNames] = useState<string[]>(defaultProjectMemberNames);
  const [digitalEmployeeSearch, setDigitalEmployeeSearch] = useState('');
  const [selectedDigitalEmployeeIds, setSelectedDigitalEmployeeIds] = useState<string[]>([]);
  
  // Custom global notification banners
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showBanner = (text: string, type: 'success' | 'info' = 'success') => {
    setNotification({ text, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      const widthScale = window.innerWidth / 1376;
      const heightScale = window.innerHeight / 960;
      // Scale down or up to fit exactly into the window viewport
      const newScale = Math.min(widthScale, heightScale);
      setScale(newScale);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isQuickAddMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsQuickAddMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickAddMenuOpen]);

  const getAttachmentType = (name: string, fallback?: string): 'pdf' | 'docx' | 'xlsx' | 'ppt' => {
    const extension = name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'docx' || extension === 'doc') return 'docx';
    if (extension === 'ppt' || extension === 'pptx') return 'ppt';
    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') return 'xlsx';
    if (fallback === 'pdf' || fallback === 'docx' || fallback === 'xlsx' || fallback === 'ppt') return fallback;
    return 'docx';
  };

  const openBlankProjectForm = () => {
    setPendingProjectSeed(null);
    setProjectForm(emptyProjectForm);
    setProjectMemberSearch('');
    setSelectedProjectMemberNames(defaultProjectMemberNames);
    setDigitalEmployeeSearch('');
    setSelectedDigitalEmployeeIds([]);
    setShowNewProjectModal(true);
  };

  const closeProjectForm = () => {
    setShowNewProjectModal(false);
    setPendingProjectSeed(null);
    setProjectForm(emptyProjectForm);
    setProjectMemberSearch('');
    setSelectedProjectMemberNames(defaultProjectMemberNames);
    setDigitalEmployeeSearch('');
    setSelectedDigitalEmployeeIds([]);
  };

  const handleCreateProjectFromSeed = (payload: ProjectSeedPayload) => {
    const sourceAgent = digitalAgents.find(agent => agent.name === payload.sourceAgentName);
    setPendingProjectSeed(payload);
    setProjectForm({
      ...emptyProjectForm,
      name: payload.projectName.replace(/_智能体底稿项目$/, ''),
      code: '',
      client: payload.generatedDocs[0]?.desc.includes('上海大学') ? '上海大学' : '',
      primaryType: '审计服务',
      detailType: '年报审计',
      amount: '',
      requiresReport: true,
      summary: [
        payload.userInstruction,
        '',
        `来源智能体：${payload.sourceAgentName}`,
        `已导入附件：${payload.files.length ? payload.files.map(file => file.name).join('、') : '无'}`,
        `已生成底稿：${payload.generatedDocs.length ? payload.generatedDocs.map(doc => doc.title).join('、') : '无'}`,
        '',
        payload.assistantSummary,
      ].join('\n'),
    });
    setProjectMemberSearch('');
    setSelectedProjectMemberNames(defaultProjectMemberNames);
    setDigitalEmployeeSearch('');
    setSelectedDigitalEmployeeIds(sourceAgent ? [sourceAgent.id] : []);
    setShowNewProjectModal(true);
    showBanner('已将智能体会话内容预填到新建项目表单，请确认后创建项目。', 'info');
  };

  const handleCreateProject = () => {
    if (!projectForm.name.trim()) return;

    const now = Date.now();
    const payload = pendingProjectSeed;
    const generatedFiles = (payload?.generatedDocs || []).map((doc, index) => ({
      name: `${projectForm.name}_${doc.title}.docx`,
      size: '自动生成',
      type: 'docx' as const,
      desc: doc.desc,
      index,
    }));
    const sourceFiles = (payload?.files || []).map(file => ({
      name: file.name,
      size: file.size || '已导入',
      type: getAttachmentType(file.name, file.type),
    }));
    const selectedMemberOptions = projectMemberOptions.filter(member => selectedProjectMemberNames.includes(member.name));
    const projectMembers = [
      { name: '符金雨', avatarText: '符', role: '项目经理', isMe: true },
      ...selectedMemberOptions.map(member => ({
        name: member.name,
        avatarText: member.avatarText,
        role: member.role,
      })),
    ];
    const selectedEmployees = digitalAgents.filter(agent => selectedDigitalEmployeeIds.includes(agent.id));

    const newProj: Project = {
      id: `${payload ? 'seed' : 'proj'}-proj-${now}`,
      name: projectForm.name,
      membersCount: projectMembers.length,
      aiCount: 1 + selectedEmployees.length,
      status: '进行中',
      unreadCount: 0,
      progress: payload ? 35 : 0,
      reportCount: `${generatedFiles.length}/1`,
      members: projectMembers,
      agents: [
        {
          name: '华小安主控',
          avatarIcon: 'Bot',
          role: '主控',
          description: payload ? '承接智能体会话并编排项目流转' : '企业智能管家',
          avatarBg: 'bg-indigo-600',
        },
        ...selectedEmployees.map(agent => ({
          name: agent.name,
          avatarIcon: 'ClipboardCheck',
          role: '数字员工',
          description: digitalEmployeeDescriptions[agent.id] || agent.role,
          avatarBg: 'bg-emerald-600',
        })),
      ],
      messages: payload
        ? [
            {
              id: `seed-user-${now}`,
              sender: { name: '符金雨', avatarText: '符' },
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: payload.userInstruction,
              file: sourceFiles[0]
                ? {
                    name: sourceFiles[0].name,
                    size: sourceFiles[0].size,
                    type: sourceFiles[0].type,
                  }
                : undefined,
            },
            {
              id: `seed-agent-${now}`,
              sender: {
                name: payload.sourceAgentName,
                avatarIcon: 'ClipboardCheck',
                avatarBg: 'bg-emerald-600',
                isAi: true,
                aiRole: '数字员工',
              },
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: `${payload.assistantSummary}\n\n已将会话内容、输入附件与生成底稿同步到项目空间，可继续分配成员、流转复核和提交报告。`,
              file: generatedFiles[0]
                ? {
                    name: generatedFiles[0].name,
                    size: generatedFiles[0].size,
                    type: generatedFiles[0].type,
                  }
                : undefined,
            },
            {
              id: `seed-controller-${now}`,
              sender: {
                name: '华小安主控',
                avatarIcon: 'Bot',
                avatarBg: 'bg-indigo-600',
                isAi: true,
                aiRole: '主控智能体',
              },
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: `项目【${projectForm.name}】已按新建项目表单创建。表单中已预填并确认：${sourceFiles.length} 个输入附件、${generatedFiles.length} 份生成底稿。`,
              plan: {
                text: '已根据智能体会话创建项目初始化计划。',
                items: [
                  { id: 'seed-1', text: '1. 迁移会话指令与输入附件', status: 'done' },
                  { id: 'seed-2', text: '2. 写入智能体生成底稿', status: 'done' },
                  { id: 'seed-3', text: '3. 等待项目成员复核与补充资料', status: 'processing' },
                ],
                assignments: [
                  { role: '项目主控', agentName: '华小安主控', status: 'completed' },
                  { role: '底稿撰写', agentName: payload.sourceAgentName, status: 'completed' },
                  { role: '项目复核', agentName: '人工成员', status: 'processing' },
                ],
              },
            },
          ]
        : [
            {
              id: `msg-new-${now}`,
              sender: {
                name: '华小安主控',
                avatarIcon: 'Bot',
                avatarBg: 'bg-indigo-600',
                isAi: true,
                aiRole: '主控智能体',
              },
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: `欢迎来到全新的项目：${projectForm.name}！我已经为您完成了工作空间的初始化。随时可以输入指令！`,
            },
          ],
    };

    setProjects(prev => [newProj, ...prev]);
    if (payload) {
      setRecentFiles(prev => [
        ...generatedFiles.map(file => ({
          id: `seed-doc-${now}-${file.index}`,
          name: file.name,
          time: '刚刚',
          type: file.type,
          size: file.size,
        })),
        ...sourceFiles.map((file, index) => ({
          id: `seed-src-${now}-${index}`,
          name: file.name,
          time: '刚刚',
          type: file.type,
          size: file.size,
        })),
        ...prev,
      ]);
    }
    setSelectedProjectId(newProj.id);
    setTab('work');
    setActiveView('collaboration');
    setShowNewProjectModal(false);
    setPendingProjectSeed(null);
    setProjectForm(emptyProjectForm);
    setProjectMemberSearch('');
    setSelectedProjectMemberNames(defaultProjectMemberNames);
    setDigitalEmployeeSearch('');
    setSelectedDigitalEmployeeIds([]);
    showBanner(`项目【${newProj.name}】已成功创建并进入协作群！`);
  };

  const handleSendMessage = (projectId: string, content: string) => {
    // 1. Append user message
    const userMsgId = `user-msg-${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const currentProj = projects.find(p => p.id === projectId);
    const totalMembersToRead = currentProj ? (currentProj.membersCount - 1) : 2;

    const newUserMsg: Message = {
      id: userMsgId,
      sender: { name: '符金雨', avatarText: '符' },
      time: timeStr,
      content: content,
      readCount: 0,
      unreadCount: totalMembersToRead,
    };

    setProjects(prevProjects => {
      return prevProjects.map(proj => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          messages: [...proj.messages, newUserMsg],
        };
      });
    });

    // Simulate other group members reading the message one by one:
    // Member 1 reads after 1.2 seconds
    setTimeout(() => {
      setProjects(prevProjects => {
        return prevProjects.map(proj => {
          if (proj.id !== projectId) return proj;
          return {
            ...proj,
            messages: proj.messages.map(m => {
              if (m.id === userMsgId) {
                return { ...m, readCount: 1, unreadCount: Math.max(0, totalMembersToRead - 1) };
              }
              return m;
            }),
          };
        });
      });
    }, 1200);

    // Member 2 reads after 2.5 seconds
    if (totalMembersToRead > 1) {
      setTimeout(() => {
        setProjects(prevProjects => {
          return prevProjects.map(proj => {
            if (proj.id !== projectId) return proj;
            return {
              ...proj,
              messages: proj.messages.map(m => {
                if (m.id === userMsgId) {
                  return { ...m, readCount: 2, unreadCount: Math.max(0, totalMembersToRead - 2) };
                }
                return m;
              }),
            };
          });
        });
      }, 2500);
    }

    // Everyone has read it after 4 seconds
    setTimeout(() => {
      setProjects(prevProjects => {
        return prevProjects.map(proj => {
          if (proj.id !== projectId) return proj;
          return {
            ...proj,
            messages: proj.messages.map(m => {
              if (m.id === userMsgId) {
                return { ...m, readCount: totalMembersToRead, unreadCount: 0 };
              }
              return m;
            }),
          };
        });
      });
    }, 4000);

    // 2. Multi-agent AI response flows if instruction asks for report/analysis/plan
    const normalizedContent = content.toLowerCase();
    const needsAgentAnalysis = 
      normalizedContent.includes('日报') || 
      normalizedContent.includes('分析') || 
      normalizedContent.includes('汇总') || 
      normalizedContent.includes('风险') ||
      normalizedContent.includes('底稿');

    if (needsAgentAnalysis) {
      // Stage 1: Main controller acknowledges & coordinates
      setTimeout(() => {
        const stage1Msg: Message = {
          id: `ai-stage1-${Date.now()}`,
          sender: {
            name: '华小安主控',
            avatarIcon: 'Bot',
            avatarBg: 'bg-indigo-600',
            isAi: true,
            aiRole: '主控智能体',
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: '收到指令！我正在启动底稿汇总与风控分析多智能体工作流，请稍候。',
          plan: {
            text: '我正在启动底稿汇总与风控分析多智能体工作流，请稍候。',
            items: [
              { id: 'p-1', text: '1. 分析底稿和合同合规点', status: 'done' },
              { id: 'p-2', text: '2. 抓取财务报表核对数额', status: 'processing' },
              { id: 'p-3', text: '3. 生成项目进度与风险报告', status: 'pending' },
            ],
            assignments: [
              { role: '风险分析师', agentName: '华小安主控', status: 'completed' },
              { role: '进度分析师', agentName: '报告助理', status: 'processing' },
              { role: '报告助理', agentName: '报告助理', status: 'pending' },
            ],
          },
        };

        setProjects(prevProjects => {
          return prevProjects.map(proj => {
            if (proj.id !== projectId) return proj;
            return {
              ...proj,
              messages: [...proj.messages, stage1Msg],
            };
          });
        });
      }, 1000);

      // Stage 2: Report assistant delivers file attachment
      setTimeout(() => {
        const projName = projects.find(p => p.id === projectId)?.name || '项目';
        const fileDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const deliverableFile = {
          name: `${projName}_智能审计合规报告_${fileDate}.pdf`,
          size: '3.1 MB',
          type: 'pdf' as const,
        };

        // Add to project files
        const newRecentFile = {
          id: `file-${Date.now()}`,
          name: deliverableFile.name,
          time: '今天 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'pdf' as const,
          size: deliverableFile.size,
        };
        setRecentFiles(prev => [newRecentFile, ...prev]);

        const stage2Msg: Message = {
          id: `ai-stage2-${Date.now()}`,
          sender: {
            name: '报告助理',
            avatarIcon: 'ClipboardCheck',
            avatarBg: 'bg-emerald-600',
            isAi: true,
            aiRole: '数字员工',
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: '通过提取主控审计底稿，我已归集完成相应的合规汇报与风险分析表，附件已生成！',
          file: deliverableFile,
        };

        setProjects(prevProjects => {
          return prevProjects.map(proj => {
            if (proj.id !== projectId) return proj;
            
            // Also update the active loading plan from the previous message
            const updatedMessages = proj.messages.map(m => {
              if (m.plan) {
                return {
                  ...m,
                  plan: {
                    ...m.plan,
                    items: m.plan.items.map(item => {
                      if (item.id === 'p-2') return { ...item, status: 'done' as const };
                      if (item.id === 'p-3') return { ...item, status: 'done' as const };
                      return item;
                    }),
                    assignments: m.plan.assignments.map(a => {
                      if (a.role === '进度分析师') return { ...a, status: 'completed' as const };
                      if (a.role === '报告助理') return { ...a, status: 'completed' as const };
                      return a;
                    }),
                  },
                };
              }
              return m;
            });

            return {
              ...proj,
              messages: [...updatedMessages, stage2Msg],
            };
          });
        });
      }, 3500);

      // Stage 3: Controller final confirmation
      setTimeout(() => {
        const stage3Msg: Message = {
          id: `ai-stage3-${Date.now()}`,
          sender: {
            name: '华小安主控',
            avatarIcon: 'Bot',
            avatarBg: 'bg-indigo-600',
            isAi: true,
            aiRole: '主控智能体',
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: '多智能体归集任务已完成，进度更新已提交。更多合规细则与出具状况，请查看看板。',
        };

        setProjects(prevProjects => {
          return prevProjects.map(proj => {
            if (proj.id !== projectId) return proj;
            return {
              ...proj,
              messages: [...proj.messages, stage3Msg],
            };
          });
        });
        showBanner('华小安智能体已成功为您归集数据包并刷新进度！');
      }, 5000);
    } else {
      // General random response from controller
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: `ai-fallback-${Date.now()}`,
          sender: {
            name: '华小安主控',
            avatarIcon: 'Bot',
            avatarBg: 'bg-indigo-600',
            isAi: true,
            aiRole: '主控智能体',
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: `收到您的消息！我已经记录并将其作为当前工作空间的信息沉淀。您也可以向我输入【风险】或【日报】来测试我的智能体合规报告自动编纂能力。`,
        };

        setProjects(prevProjects => {
          return prevProjects.map(proj => {
            if (proj.id !== projectId) return proj;
            return {
              ...proj,
              messages: [...proj.messages, fallbackMsg],
            };
          });
        });
      }, 1500);
    }
  };

  const handleAuditAction = (task: WorkTask) => {
    // Audit actions can remove the audited item or show completion
    setTasks(prev => prev.filter(t => t.id !== task.id));
    showBanner(`任务【${task.title}】（所属：${task.projectName}）已成功审核通过！`, 'success');
  };

  const openAgent = (agentId: string) => {
    setTab('chat');
    setSelectedAgentId(agentId);
    setSelectedSubItemId(null);
    if (agentId === 'agent-人事') {
      setActiveView('hr-management');
    } else {
      setActiveView('agent-generic');
    }
    setDigitalAgents(prev => prev.map(agent => (
      agent.id === agentId
        ? {
            ...agent,
            unreadCount: 0,
            subItems: agent.subItems.map(subItem => ({ ...subItem, unreadCount: 0 })),
          }
        : agent
    )));
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const activeMember = members.find(m => m.name === selectedMemberName) || members[0];

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#eaecef] overflow-hidden antialiased">
      <div 
        style={{ 
          width: `${1376 * scale}px`, 
          height: `${960 * scale}px`,
          position: 'relative'
        }}
        className="shrink-0 flex items-center justify-center overflow-hidden"
      >
        <div 
          style={{ 
            width: '1376px', 
            height: '960px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            left: 0,
            top: 0
          }} 
          className="flex flex-col overflow-hidden bg-[radial-gradient(circle_at_2%_7%,rgba(218,211,255,0.18)_0%,rgba(239,236,255,0.12)_24%,rgba(243,245,248,0.98)_50%,#f3f5f8_78%)] rounded-3xl shadow-2xl border border-gray-200/50 relative shrink-0"
        >
          <header className="h-[52px] shrink-0 border-b border-[#d8dbe5] bg-[#f0f1f7]/92 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <PanelTop className="w-4 h-4 text-gray-500" />
              <img src={huaxiaoanLogo} alt="华小安" className="w-8 h-8 object-contain" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => restoreNavigation(navigationIndex - 1)}
                  disabled={!canNavigateBack}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    canNavigateBack ? 'text-gray-500 hover:bg-white/70 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                  }`}
                  aria-label="返回上一步"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => restoreNavigation(navigationIndex + 1)}
                  disabled={!canNavigateForward}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                    canNavigateForward ? 'text-gray-500 hover:bg-white/70 hover:text-gray-700' : 'text-gray-300 cursor-not-allowed'
                  }`}
                  aria-label="前往下一步"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsQuickAddMenuOpen(prev => !prev)}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${
                  isQuickAddMenuOpen ? 'text-gray-800' : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="打开快速工具"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspaceFocusMode((current) => {
                    const next = !current;
                    setIsLeftSidebarCollapsed(next);
                    if (next) setIsWorkbenchAgentOpen(false);
                    return next;
                  });
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isWorkspaceFocusMode ? 'bg-[#eaf0fb] text-[#315ca9]' : 'text-gray-400 hover:bg-white/60 hover:text-gray-600'}`}
                aria-label={isWorkspaceFocusMode ? '退出中间区域放大' : '放大中间区域'}
                title={isWorkspaceFocusMode ? '退出中间区域放大' : '放大中间区域'}
              >
                {isWorkspaceFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsWorkspaceFocusMode(false);
                  setIsLeftSidebarCollapsed((current) => !current);
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isLeftSidebarCollapsed ? 'text-[#315ca9] bg-[#eaf0fb]' : 'text-gray-700 hover:text-gray-900 hover:bg-white/60'}`}
                aria-label={isLeftSidebarCollapsed ? '展开左侧栏' : '折叠左侧栏'}
                title={isLeftSidebarCollapsed ? '展开左侧栏' : '折叠左侧栏'}
              >
                <PanelLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeView !== 'workbench') return;
                  setIsWorkspaceFocusMode(false);
                  setIsWorkbenchAgentOpen((current) => !current);
                }}
                className={`w-8 h-8 flex items-center justify-center transition-colors ${activeView === 'workbench' && isWorkbenchAgentOpen ? 'text-[#315ca9] bg-[#eaf0fb] rounded-md' : 'text-gray-700 hover:text-gray-900'}`}
                aria-label={activeView === 'workbench' ? (isWorkbenchAgentOpen ? '折叠 Agent 面板' : '展开 Agent 面板') : '切换分栏'}
              >
                <PanelRight className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isQuickAddMenuOpen && (
                  <>
                    <motion.div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsQuickAddMenuOpen(false)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-[38px] z-50 w-[280px] rounded-2xl border border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(15,23,42,0.14)] py-2.5"
                    >
                      {quickAddMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => setIsQuickAddMenuOpen(false)}
                            className="w-full h-8 px-4 flex items-center justify-between gap-4 text-left text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-gray-500" />
                              <span>{item.label}</span>
                            </span>
                            {item.shortcut && (
                              <span className="text-[12px] font-medium text-gray-400">{item.shortcut}</span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </header>
          <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 1. Global Floating Banner Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-300 max-w-sm">
          <div className="bg-[#181c23] text-white p-3.5 rounded-2xl shadow-2xl border border-gray-800 flex items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{notification.text}</span>
            </div>
            <button className="text-gray-400 hover:text-white" onClick={() => setNotification(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Primary Navigation Left Sidebar */}
      {!isLeftSidebarCollapsed && <Sidebar 
        currentTab={currentTab}
        setTab={(tab) => {
          setTab(tab);
          if (tab === 'chat') {
            setActiveView('chat-home');
            setSelectedSubItemId(null);
          } else {
            setActiveView('workbench');
          }
        }}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={selectProject}
        selectedMemberName={selectedMemberName}
        setSelectedMemberName={selectMember}
        projects={projects}
        chatMembers={members}
        chatSessions={chatSessions}
        selectedChatSessionId={selectedChatSessionId}
        setSelectedChatSessionId={setSelectedChatSessionId}
        onPinChat={pinChatSession}
        onRenameChat={renameChatSession}
        onDeleteChat={deleteChatSession}
        onNewChat={createNewChatSession}
        onNewProject={openBlankProjectForm}
        onOpenProjectDetail={(projectId) => {
          setTab('work');
          setActiveView('workbench');
          setProjectDetailRequestId(projectId);
        }}
        digitalAgents={digitalAgents}
        setDigitalAgents={setDigitalAgents}
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
            selectedSubItemId={selectedSubItemId}
            setSelectedSubItemId={setSelectedSubItemId}
            openAgent={openAgent}
      />}

      {/* 3. Main Central Render View Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {activeView === 'workbench' && (
          <WorkbenchView
            projects={projects}
            tasks={tasks}
            contracts={contracts}
            onOpenProject={(id) => {
              selectProject(id);
              setActiveView('collaboration');
            }}
            onAuditTask={handleAuditAction}
            onNewProject={openBlankProjectForm}
            openProjectDetailId={projectDetailRequestId}
            onProjectDetailOpened={() => setProjectDetailRequestId(null)}
            agentPanelOpen={isWorkbenchAgentOpen}
            onToggleAgentPanel={() => setIsWorkbenchAgentOpen((current) => !current)}
          />
        )}

        {activeView === 'collaboration' && (
          <ProjectCollaborationView 
            project={activeProject}
            onBackToWorkbench={() => setActiveView('workbench')}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeView === 'assistant' && (
          <AccountingAssistantView 
            projects={projects}
            recentFiles={recentFiles}
          />
        )}

        {activeView === 'chat-home' && (
          <ChatHomeView
            agents={digitalAgents}
            onSelectAgent={openAgent}
          />
        )}

        {activeView === 'annual-report-audit' && (
          <AnnualReportAuditView onCreateProjectFromSeed={handleCreateProjectFromSeed} />
        )}

        {activeView === 'hr-management' && (
          <HRManagementAgentView
            selectedSubItemId={selectedSubItemId}
            onOpenMainWorkbench={() => {
              setTab('work');
              setActiveView('workbench');
            }}
          />
        )}

        {activeView === 'agent-generic' && (() => {
          const activeAgent = digitalAgents.find(a => a.id === selectedAgentId) || digitalAgents[0];
          return (
            <AgentGenericView 
              agentId={activeAgent.id}
              agentName={activeAgent.name}
              agentRole={activeAgent.role}
              avatarText={activeAgent.avatarText}
              selectedSubItemId={selectedSubItemId}
              onCreateProjectFromSeed={handleCreateProjectFromSeed}
            />
          );
        })()}

        {activeView === 'direct-chat' && (
          <DirectChatView 
            memberName={activeMember.name}
            memberRole={activeMember.role}
            recentFiles={recentFiles}
            memberStatus={activeMember.status}
          />
        )}
      </div>

      {/* 4. Overlay Modals: New Project Modal */}
      {showNewProjectModal && createPortal((
        <div
          className="fixed inset-0 bg-[#181c23]/45 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={closeProjectForm}
        >
          <div
            className="bg-[#f8f9fc] rounded-xl w-full max-w-[760px] max-h-[92vh] shadow-2xl border border-white/80 animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 shrink-0 flex items-start justify-between border-b border-gray-100 bg-[#f8f9fc]/95">
              <div>
                <h3 className="text-base font-black text-gray-900 leading-none">新建项目</h3>
                <p className="text-[11px] text-gray-500 font-semibold mt-3">
                  创建 CPA 项目，项目经理默认为当前创建人，完成后自动进入项目协作群。
                </p>
                {pendingProjectSeed && (
                  <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[10px] font-bold text-[#0052d9]">
                    已从【{pendingProjectSeed.sourceAgentName}】带入对话内容、附加文件和生成底稿；确认表单后再创建项目。
                  </div>
                )}
              </div>
              <button 
                onClick={closeProjectForm}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">项目名称</span>
                  <input
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：金利集团年度审计"
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">项目编号</span>
                  <input
                    value={projectForm.code}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="不填则自动生成"
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">计划开始日期</span>
                  <div className="relative">
                    <input
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-800 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                    />
                    <Calendar className="w-4 h-4 text-gray-700 absolute right-3 top-3" />
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">计划结束日期</span>
                  <div className="relative">
                    <input
                      value={projectForm.endDate}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                      placeholder="年 / 月 / 日"
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-800 placeholder-gray-500 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                    />
                    <Calendar className="w-4 h-4 text-gray-700 absolute right-3 top-3" />
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">委托方</span>
                  <input
                    value={projectForm.client}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, client: e.target.value }))}
                    placeholder="例如：金利集团有限公司"
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">项目经理</span>
                  <div className="h-10 rounded-lg border border-gray-200 bg-white px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-black">符</span>
                      <span className="text-sm font-bold text-gray-800">{projectForm.manager}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-400">当前创建人</span>
                  </div>
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">所属部门</span>
                  <div className="relative">
                    <input
                      value={projectForm.department}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-medium text-gray-800 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                    />
                    <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
                  </div>
                </label>

                <div className="col-span-2 pt-1">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">业务类型</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-1">
                        每一行选择一组父类型和详细类型，一级业务类型可以重复，项目详细类型不能重复。
                      </p>
                    </div>
                    <button className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5">
                      <PlusCircle className="w-4 h-4" />
                      添加业务类型
                    </button>
                  </div>
                  <div className="mt-2 rounded-lg border border-gray-200 bg-[#f5f6f9] p-2 grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-gray-800">业务类型 1（主）</span>
                      <div className="relative">
                        <input
                          value={projectForm.primaryType}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, primaryType: e.target.value }))}
                          placeholder="必选：请选择项目类型"
                          className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-bold text-gray-800 placeholder-gray-800 outline-none focus:border-[#0052d9]"
                        />
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
                      </div>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-bold text-gray-800">项目详细类型</span>
                      <div className="relative">
                        <input
                          value={projectForm.detailType}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, detailType: e.target.value }))}
                          placeholder="先选择项目类型"
                          className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm font-bold text-gray-800 placeholder-gray-800 outline-none focus:border-[#0052d9]"
                        />
                        <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3" />
                      </div>
                    </label>
                  </div>
                </div>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">项目协议金额</span>
                  <input
                    value={projectForm.amount}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="例如：100000"
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">报告要求</span>
                  <button
                    type="button"
                    onClick={() => setProjectForm(prev => ({ ...prev, requiresReport: !prev.requiresReport }))}
                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 flex items-center gap-2"
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center ${projectForm.requiresReport ? 'bg-[#0f8bdc] text-white' : 'border border-gray-300 bg-white text-transparent'}`}>
                      <Check className="w-3 h-3" />
                    </span>
                    <span>出具报告</span>
                  </button>
                </label>

                <label className="col-span-2 space-y-1.5">
                  <span className="text-xs font-bold text-gray-800">项目概况</span>
                  <textarea
                    value={projectForm.summary}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="补充项目背景、范围或关键事项"
                    className="w-full h-20 resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-[#0052d9] focus:ring-2 focus:ring-[#0052d9]/5"
                  />
                </label>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">项目成员</span>
                    <div className="relative w-56">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        value={projectMemberSearch}
                        onChange={(e) => setProjectMemberSearch(e.target.value)}
                        placeholder="搜索项目成员"
                        className="w-full h-8 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs font-semibold text-gray-700 placeholder-gray-400 outline-none focus:border-[#0052d9]"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white h-40 overflow-y-auto custom-scrollbar p-3 grid grid-cols-2 gap-x-10 gap-y-3">
                    {projectMemberOptions
                      .filter(member => `${member.name} ${member.role}`.toLowerCase().includes(projectMemberSearch.trim().toLowerCase()))
                      .map(member => {
                        const selected = selectedProjectMemberNames.includes(member.name);
                        return (
                          <button
                            type="button"
                            key={member.name}
                            onClick={() => {
                              setSelectedProjectMemberNames(prev => (
                                prev.includes(member.name)
                                  ? prev.filter(name => name !== member.name)
                                  : [...prev, member.name]
                              ));
                            }}
                            className={`h-9 rounded-lg px-2 flex items-center gap-3 text-left transition-colors ${
                              selected ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              member.avatarKind === 'bot'
                                ? 'bg-sky-100 text-sky-600'
                                : 'bg-gray-200 text-gray-700'
                            }`}>
                              {member.avatarKind === 'bot' ? '⌂' : member.avatarText}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 truncate">{member.name}</span>
                            {selected && <Check className="w-3.5 h-3.5 text-[#0052d9] ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">数字员工</p>
                      <p className="text-[10px] text-gray-500 font-semibold mt-1">
                        默认不添加，可以智能体广场的线上智能体中选择。
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">已选 {selectedDigitalEmployeeIds.length}</span>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-2 space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                      <input
                        value={digitalEmployeeSearch}
                        onChange={(e) => setDigitalEmployeeSearch(e.target.value)}
                        placeholder="搜索线上智能体"
                        className="w-full h-8 rounded-lg border border-gray-200 bg-white pl-8 pr-3 text-xs font-semibold text-gray-700 placeholder-gray-400 outline-none focus:border-[#0052d9]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {digitalAgents
                        .filter(agent => {
                          const query = digitalEmployeeSearch.trim().toLowerCase();
                          if (!query) return true;
                          return `${agent.name} ${agent.role} ${digitalEmployeeDescriptions[agent.id] || ''}`.toLowerCase().includes(query);
                        })
                        .map(agent => {
                          const selected = selectedDigitalEmployeeIds.includes(agent.id);
                          return (
                            <button
                              type="button"
                              key={agent.id}
                              onClick={() => {
                                setSelectedDigitalEmployeeIds(prev => (
                                  prev.includes(agent.id)
                                    ? prev.filter(id => id !== agent.id)
                                    : [...prev, agent.id]
                                ));
                              }}
                              className={`rounded-xl p-2 flex items-center gap-3 text-left transition-colors ${
                                selected ? 'bg-blue-50/80 ring-1 ring-blue-100' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0">
                                {agent.avatarText}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-black text-gray-800 truncate">{agent.name}</span>
                                <span className="block text-[10px] font-semibold text-gray-400 truncate">
                                  {digitalEmployeeDescriptions[agent.id] || agent.role}
                                </span>
                              </span>
                              <span className={`text-xs font-black ${selected ? 'text-[#0052d9]' : 'text-gray-400'}`}>+</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-white/90 backdrop-blur-sm flex items-center justify-between shrink-0">
              <div className={`h-8 flex-1 rounded-lg px-3 flex items-center text-xs font-bold ${
                projectForm.name.trim()
                  ? 'bg-blue-50 text-[#0052d9]'
                  : 'bg-orange-50 text-orange-700'
              }`}>
                {projectForm.name.trim()
                  ? pendingProjectSeed
                    ? '智能体内容已预填，请确认后创建项目'
                    : '项目名称已填写，可以创建项目'
                  : '请填写项目名称'}
              </div>
              <div className="flex items-center gap-2 ml-3">
              <button 
                onClick={closeProjectForm}
                className="h-9 px-4 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                取消
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={!projectForm.name.trim()}
                className={`h-9 px-4 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  projectForm.name.trim()
                    ? 'bg-gray-500 text-white hover:bg-gray-700 shadow-gray-500/10'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                创建项目
              </button>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
        </div>
      </div>
      </div>
    </div>
  );
}
