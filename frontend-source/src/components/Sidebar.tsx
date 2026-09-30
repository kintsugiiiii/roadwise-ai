import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  MessageSquare, 
  BriefcaseBusiness, 
  PlusCircle, 
  Handshake, 
  ChevronUp, 
  ChevronDown, 
  Bot,
  Search,
  Settings,
  ImagePlus,
  ShieldCheck,
  LogOut,
  MoreHorizontal,
  MoreVertical,
  KeyRound,
} from 'lucide-react';
import { Project } from '../types';
import { AgentSVGAvatar } from './AgentSVGAvatar';

interface SidebarProps {
  currentTab: 'chat' | 'work';
  setTab: (tab: 'chat' | 'work') => void;
  activeView: 'workbench' | 'collaboration' | 'assistant' | 'direct-chat' | 'annual-report-audit' | 'hr-management' | 'agent-generic' | 'chat-home';
  setActiveView: (view: 'workbench' | 'collaboration' | 'assistant' | 'direct-chat' | 'annual-report-audit' | 'hr-management' | 'agent-generic' | 'chat-home') => void;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  selectedMemberName: string;
  setSelectedMemberName: (name: string) => void;
  projects: Project[];
  chatMembers: any[];
  chatSessions: Array<{ id: string; title: string; time: string }>;
  selectedChatSessionId: string | null;
  setSelectedChatSessionId: (id: string | null) => void;
  onPinChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  onNewProject: () => void;
  onOpenProjectDetail: (projectId: string) => void;
  digitalAgents: any[];
  setDigitalAgents: React.Dispatch<React.SetStateAction<any[]>>;
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  selectedSubItemId: string | null;
  setSelectedSubItemId: (id: string | null) => void;
  openAgent: (id: string) => void;
}

type SessionContextMenu =
  | { kind: 'chat'; id: string; x: number; y: number }
  | { kind: 'agent'; agentId: string; subItemId: string; x: number; y: number }
  | { kind: 'project'; id: string; x: number; y: number }
  | { kind: 'member'; name: string; x: number; y: number }
  | null;

type SessionMenuTarget =
  | { kind: 'chat'; id: string }
  | { kind: 'agent'; agentId: string; subItemId: string }
  | { kind: 'project'; id: string }
  | { kind: 'member'; name: string };

type SidebarMenuAction = 'pin' | 'rename' | 'delete' | 'details';

interface SidebarPins {
  projectIds: string[];
  memberNames: string[];
}

const sidebarPinsStorageKey = 'roadwise-sidebar-pins-v1';

const readSidebarPins = (): SidebarPins => {
  if (typeof window === 'undefined') return { projectIds: [], memberNames: [] };
  try {
    const parsed = JSON.parse(localStorage.getItem(sidebarPinsStorageKey) ?? '{}');
    return {
      projectIds: Array.isArray(parsed.projectIds) ? parsed.projectIds : [],
      memberNames: Array.isArray(parsed.memberNames) ? parsed.memberNames : [],
    };
  } catch {
    return { projectIds: [], memberNames: [] };
  }
};

const orderPinnedItems = <Item,>(items: Item[], pinnedKeys: string[], getKey: (item: Item) => string) => {
  const pinnedOrder = new Map(pinnedKeys.map((key, index) => [key, index]));
  return items.map((item, index) => ({ item, index })).sort((first, second) => {
    const firstPin = pinnedOrder.get(getKey(first.item));
    const secondPin = pinnedOrder.get(getKey(second.item));
    if (firstPin !== undefined && secondPin !== undefined) return firstPin - secondPin;
    if (firstPin !== undefined) return -1;
    if (secondPin !== undefined) return 1;
    return first.index - second.index;
  }).map(({ item }) => item);
};

export default function Sidebar({
  currentTab,
  setTab,
  activeView,
  setActiveView,
  selectedProjectId,
  setSelectedProjectId,
  selectedMemberName,
  setSelectedMemberName,
  projects,
  chatMembers,
  chatSessions,
  selectedChatSessionId,
  setSelectedChatSessionId,
  onPinChat,
  onRenameChat,
  onDeleteChat,
  onNewChat,
  onNewProject,
  onOpenProjectDetail,
  digitalAgents,
  setDigitalAgents,
  selectedAgentId,
  setSelectedAgentId,
  selectedSubItemId,
  setSelectedSubItemId,
  openAgent,
}: SidebarProps) {
  const [projectCollapse, setProjectCollapse] = useState(false);
  const [sessionCollapse, setSessionCollapse] = useState(false);
  const [chatCollapse, setChatCollapse] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState('');
  const [settingsModel, setSettingsModel] = useState('deepseek-v4-flash');
  const [settingsStatus, setSettingsStatus] = useState('');
  const [agentConnected, setAgentConnected] = useState(() => localStorage.getItem('roadwise-agent-configured') === '1');
  const [usage, setUsage] = useState({ requests: 0, totalTokensEstimated: 0 });
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [editingAgentSessionId, setEditingAgentSessionId] = useState<string | null>(null);
  const [editingAgentSessionName, setEditingAgentSessionName] = useState('');
  const [sessionContextMenu, setSessionContextMenu] = useState<SessionContextMenu>(null);
  const [sidebarPins, setSidebarPins] = useState<SidebarPins>(readSidebarPins);

  const agentKeywordMap: Record<string, string> = {
    'agent-shebao': '材料 证据 访谈 风险 诊断 智能体会话',
    'agent-人事': '团队 协作 SOP 流程 复盘',
    'agent-年报': '阶段 任务 材料 评审 下一步',
    'agent-会计': '数据 预算 假设 风险 分析',
  };

  const normalizedAgentSearch = agentSearch.trim().toLowerCase();
  const filteredDigitalAgents = digitalAgents
    .map(agent => {
      if (!normalizedAgentSearch) return agent;
      const agentMatches = `${agent.name} ${agent.role} ${agent.avatarText} ${agentKeywordMap[agent.id] || ''}`.toLowerCase().includes(normalizedAgentSearch);
      const matchingSubItems = agent.subItems.filter(subItem => subItem.name.toLowerCase().includes(normalizedAgentSearch));
      if (agentMatches) return agent;
      if (matchingSubItems.length > 0) return { ...agent, subItems: matchingSubItems, expanded: true };
      return null;
    })
    .filter(Boolean);

  const filteredProjects = orderPinnedItems(
    projects.filter(project => project.name.toLowerCase().includes(projectSearch.toLowerCase())),
    sidebarPins.projectIds,
    project => project.id,
  );
  const filteredChatMembers = orderPinnedItems(
    chatMembers.filter(member => (
      member.name.toLowerCase().includes(memberSearch.toLowerCase())
      || member.role.toLowerCase().includes(memberSearch.toLowerCase())
    )),
    sidebarPins.memberNames,
    member => member.name,
  );

  useEffect(() => {
    localStorage.setItem(sidebarPinsStorageKey, JSON.stringify(sidebarPins));
  }, [sidebarPins]);

  const toggleProjectPin = (projectId: string) => {
    setSidebarPins(current => ({
      ...current,
      projectIds: current.projectIds.includes(projectId)
        ? current.projectIds.filter(id => id !== projectId)
        : [projectId, ...current.projectIds],
    }));
  };

  const toggleMemberPin = (memberName: string) => {
    setSidebarPins(current => ({
      ...current,
      memberNames: current.memberNames.includes(memberName)
        ? current.memberNames.filter(name => name !== memberName)
        : [memberName, ...current.memberNames],
    }));
  };

  const renameAgentSession = (agentId: string, subItemId: string, name: string) => {
    const nextName = name.trim();
    if (!nextName) return;
    setDigitalAgents(prev => prev.map(agent => (
      agent.id === agentId
        ? {
            ...agent,
            subItems: agent.subItems.map(subItem => (
              subItem.id === subItemId ? { ...subItem, name: nextName } : subItem
            )),
          }
        : agent
    )));
  };

  const openSessionContextMenu = (
    event: React.MouseEvent,
    menu: Exclude<SessionContextMenu, null>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setProfileMenuOpen(false);
    setSessionContextMenu(menu);
  };

  const openSessionActionMenu = (
    event: React.MouseEvent<HTMLButtonElement>,
    menu: SessionMenuTarget
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const isSidebarEntry = menu.kind === 'project' || menu.kind === 'member';
    setProfileMenuOpen(false);
    setSessionContextMenu({
      ...menu,
      x: isSidebarEntry ? Math.max(8, rect.right - 132) : Math.max(8, rect.left - 132 - 4),
      y: isSidebarEntry ? rect.bottom + 2 : Math.max(8, rect.top),
    });
  };

  const pinAgentSession = (agentId: string, subItemId: string) => {
    setDigitalAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      const target = agent.subItems.find(subItem => subItem.id === subItemId);
      if (!target) return agent;
      return {
        ...agent,
        subItems: [target, ...agent.subItems.filter(subItem => subItem.id !== subItemId)],
      };
    }));
  };

  const deleteAgentSession = (agentId: string, subItemId: string) => {
    setDigitalAgents(prev => prev.map(agent => {
      if (agent.id !== agentId) return agent;
      const subItems = agent.subItems.filter(subItem => subItem.id !== subItemId);
      return {
        ...agent,
        unreadCount: subItems.reduce((sum, item) => sum + item.unreadCount, 0),
        subItems,
      };
    }));
    if (selectedSubItemId === subItemId) {
      setSelectedAgentId(agentId);
      setSelectedSubItemId(null);
    }
  };

  const beginChatRename = (id: string) => {
    const session = chatSessions.find(item => item.id === id);
    if (!session) return;
    setEditingAgentSessionId(null);
    setEditingAgentSessionName('');
    setEditingChatId(id);
    setEditingChatTitle(session.title);
  };

  const beginAgentSessionRename = (agentId: string, subItemId: string) => {
    const agent = digitalAgents.find(item => item.id === agentId);
    const subItem = agent?.subItems.find(item => item.id === subItemId);
    if (!subItem) return;
    setEditingChatId(null);
    setEditingChatTitle('');
    setEditingAgentSessionId(subItemId);
    setEditingAgentSessionName(subItem.name);
  };

  const handleSessionMenuAction = (action: SidebarMenuAction) => {
    if (!sessionContextMenu) return;
    const menu = sessionContextMenu;
    setSessionContextMenu(null);

    if (menu.kind === 'project') {
      if (action === 'pin') toggleProjectPin(menu.id);
      if (action === 'details') onOpenProjectDetail(menu.id);
      return;
    }

    if (menu.kind === 'member') {
      if (action === 'pin') toggleMemberPin(menu.name);
      return;
    }

    if (menu.kind === 'chat') {
      if (action === 'pin') onPinChat(menu.id);
      if (action === 'rename') beginChatRename(menu.id);
      if (action === 'delete') onDeleteChat(menu.id);
      return;
    }

    if (action === 'pin') pinAgentSession(menu.agentId, menu.subItemId);
    if (action === 'rename') beginAgentSessionRename(menu.agentId, menu.subItemId);
    if (action === 'delete') deleteAgentSession(menu.agentId, menu.subItemId);
  };

  const sidebarMenuItems = (() => {
    if (!sessionContextMenu) return [];
    if (sessionContextMenu.kind === 'project') {
      return [
        { label: sidebarPins.projectIds.includes(sessionContextMenu.id) ? '取消置顶' : '置顶', action: 'pin' as const },
        { label: '查看项目详情', action: 'details' as const },
      ];
    }
    if (sessionContextMenu.kind === 'member') {
      return [{ label: sidebarPins.memberNames.includes(sessionContextMenu.name) ? '取消置顶' : '置顶', action: 'pin' as const }];
    }
    return [
      { label: '置顶', action: 'pin' as const },
      { label: '重命名', action: 'rename' as const },
      { label: '删除', action: 'delete' as const },
    ];
  })();

  return (
    <aside 
      className="w-64 h-full bg-[#fbfbff] border-r border-[#dfe2ed] flex flex-col shrink-0 select-none"
      id="left-sidebar"
    >
      {/* Main Mode Tabs */}
      <div className="px-4 pt-4 mb-3">
        <div className="bg-[#ebedf9] p-1 rounded-xl flex shadow-inner">
          <button 
            id="tab-chat"
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-300 ${
              currentTab === 'chat' 
                ? 'bg-white text-[#7d62d9] shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setTab('chat')}
          >
            <span>Chat</span>
          </button>
          <button 
            id="tab-work"
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-300 ${
              currentTab === 'work' 
                ? 'bg-white text-[#0052d9] shadow-sm font-bold' 
                : 'text-gray-500 hover:text-gray-800'
            }`}
            onClick={() => setTab('work')}
          >
            <span>Work</span>
          </button>
        </div>
      </div>

      {/* Primary Create Button */}
      <div className="px-4 mb-4">
        <button 
          id="btn-new-project"
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer shadow-sm border bg-[#eeeafb] hover:bg-[#e7e2f8] border-[#e4def7] ${currentTab === 'chat' ? 'text-[#6f57c8]' : 'text-[#0052d9]'}`}
          onClick={currentTab === 'chat' ? onNewChat : onNewProject}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{currentTab === 'chat' ? '新建会话' : '新建项目'}</span>
        </button>
      </div>

      {/* Navigation Links Area */}
      <nav className="flex-1 px-2 space-y-1.5 overflow-y-auto custom-scrollbar">
        {currentTab === 'work' ? (
          <>
            {/* Workbench */}
            <div className="space-y-0.5">
              <button
                type="button"
                id="nav-workbench"
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left shadow-none outline-none transition-colors duration-150 ${activeView === 'workbench' ? 'bg-[#f5f2fc] font-bold text-[#0052d9]' : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setActiveView('workbench')}
              >
                <BriefcaseBusiness className="w-4 h-4" />
                <span className="flex-1 text-xs font-semibold">工作台</span>
              </button>
            </div>

            {/* Project Collaboration Section */}
            <div className="space-y-0.5">
              <div 
                className="flex items-center justify-between px-3.5 py-2 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer"
                onClick={() => setProjectCollapse(!projectCollapse)}
              >
                <div className="flex items-center gap-3">
                  <Handshake className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold tracking-wide">项目协作</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden text-[10px] bg-gray-200/60 px-1.5 py-0.2 rounded-md font-semibold text-gray-500">
                    {projects.length}
                  </span>
                  {projectCollapse ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Project Subfolder List */}
              {false && !projectCollapse && (
                <div className="mt-1 pl-3.5">
                  {/* Project Search Bar */}
                  <div className="px-1.5 mb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                      <input 
                        type="text" 
                        placeholder="检索项目群..." 
                        className="w-full pl-7 pr-2.5 py-1 bg-gray-100 border border-transparent rounded-lg text-[10px] text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0052d9] transition-all font-semibold"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredProjects.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold py-1.5 px-3.5 text-center">无匹配项目群</p>
                  ) : (
                    filteredProjects
                      .map((project, index) => {
                        const isActive = activeView === 'collaboration' && selectedProjectId === project.id;
                        const isPinned = sidebarPins.projectIds.includes(project.id);
                        const previousIsPinned = index > 0 && sidebarPins.projectIds.includes(filteredProjects[index - 1].id);
                        const nextIsPinned = index < filteredProjects.length - 1 && sidebarPins.projectIds.includes(filteredProjects[index + 1].id);
                        const pinnedShape = isPinned
                          ? `rounded-none ${previousIsPinned ? '' : 'rounded-t-xl'} ${nextIsPinned ? '' : 'rounded-b-xl'}`
                          : 'mt-1 rounded-xl';
                        return (
                          <div
                            key={project.id}
                            id={`project-${project.id}`}
                            className={`group flex items-center justify-between px-3.5 py-2 cursor-pointer transition-all duration-200 text-xs font-medium ${pinnedShape} ${
                              isActive
                                ? 'bg-[#f5f2fc] text-[#0052d9] font-bold shadow-sm'
                                : isPinned
                                  ? 'bg-[#f7f5fb] text-gray-700 hover:bg-[#f1eef8]'
                                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setActiveView('collaboration');
                            }}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <BriefcaseBusiness className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#7d62d9]' : 'text-gray-500'}`} />
                              <span className="truncate pr-1">{project.name}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {project.unreadCount ? (
                                <span className="h-4 min-w-4 flex items-center justify-center text-[9px] bg-[#ba1a1a] text-white rounded-full font-bold px-1 animate-pulse">
                                  {project.unreadCount}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                title="项目群操作"
                                aria-label={`${project.name}操作`}
                                onClick={(event) => openSessionActionMenu(event, { kind: 'project', id: project.id })}
                                className={`grid h-5 w-5 place-items-center rounded-md transition-colors hover:bg-blue-50 ${isPinned ? 'text-[#0052d9]' : 'text-gray-400'}`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>

            {/* Direct Messages Section inside Work Tab */}
            <div className="pt-2 space-y-0.5">
              <div 
                className="flex items-center justify-between px-3.5 py-2 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer"
                onClick={() => setChatCollapse(!chatCollapse)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold tracking-wide">单聊成员</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="hidden text-[10px] bg-gray-200/60 px-1.5 py-0.2 rounded-md font-semibold text-gray-500">{chatMembers.length}</span>
                  {chatCollapse ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Members List */}
              {false && !chatCollapse && (
                <div className="mt-1 pl-2">
                  {/* Member Search Bar */}
                  <div className="px-1.5 mb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                      <input 
                        type="text" 
                        placeholder="检索联系人..." 
                        className="w-full pl-7 pr-2.5 py-1 bg-gray-100 border border-transparent rounded-lg text-[10px] text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-[#0052d9] transition-all font-semibold"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredChatMembers.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold py-1.5 px-3.5 text-center">无匹配联系人</p>
                  ) : (
                    filteredChatMembers
                      .map((member, index) => {
                        const isActive = activeView === 'direct-chat' && selectedMemberName === member.name;
                        const isPinned = sidebarPins.memberNames.includes(member.name);
                        const previousIsPinned = index > 0 && sidebarPins.memberNames.includes(filteredChatMembers[index - 1].name);
                        const nextIsPinned = index < filteredChatMembers.length - 1 && sidebarPins.memberNames.includes(filteredChatMembers[index + 1].name);
                        const pinnedShape = isPinned
                          ? `rounded-none ${previousIsPinned ? '' : 'rounded-t-xl'} ${nextIsPinned ? '' : 'rounded-b-xl'}`
                          : 'mt-1 rounded-xl';
                        return (
                          <div
                            key={member.name}
                            id={`chat-member-work-${member.name}`}
                            className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-200 text-xs font-medium ${pinnedShape} ${
                              isActive
                                ? 'bg-[#f5f2fc] text-[#0052d9] font-bold shadow-sm'
                                : isPinned
                                  ? 'bg-[#f7f5fb] text-gray-700 hover:bg-[#f1eef8]'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                            onClick={() => {
                              setSelectedMemberName(member.name);
                              setActiveView('direct-chat');
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative shrink-0">
                                <div className="w-7 h-7 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[11px] text-[#0052d9] font-bold shadow-sm">
                                  {member.avatarText}
                                </div>
                                <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                                  member.status === '在线' 
                                    ? 'bg-emerald-500' 
                                    : 'bg-gray-400'
                                }`} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold">{member.name}</p>
                                <p className="text-[9px] text-gray-400 truncate">{member.role}</p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {member.unreadCount ? (
                                <span className="h-4 min-w-4 flex items-center justify-center text-[9px] bg-[#ba1a1a] text-white rounded-full font-bold px-1 animate-pulse shrink-0">
                                  {member.unreadCount}
                                </span>
                              ) : null}
                              <button
                                type="button"
                                title="成员操作"
                                aria-label={`${member.name}操作`}
                                onClick={(event) => openSessionActionMenu(event, { kind: 'member', name: member.name })}
                                className={`grid h-5 w-5 place-items-center rounded-md transition-colors hover:bg-blue-50 ${isPinned ? 'text-[#0052d9]' : 'text-gray-400'}`}
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 1. 会话 Section */}
            <div className="space-y-0.5">
              <div
                className="flex items-center justify-between px-3.5 py-2 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer"
                onClick={() => setSessionCollapse(!sessionCollapse)}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold tracking-wide">会话</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-gray-200/60 px-1.5 py-0.2 rounded-md font-semibold text-gray-500">{chatSessions.length}</span>
                  {sessionCollapse ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>
              {!sessionCollapse && chatSessions.length === 0 ? (
                <p className="px-3.5 py-1.5 text-[10px] leading-relaxed font-semibold text-gray-400">
                  暂无会话，点击上方新建会话开始。
                </p>
              ) : !sessionCollapse && (
                <div className="space-y-1 px-1">
                  {chatSessions.map((session) => {
                    const isSelected = activeView === 'chat-home' && selectedChatSessionId === session.id;
                    const isEditing = editingChatId === session.id;
                    const commitRename = () => {
                      const nextTitle = editingChatTitle.trim();
                      if (nextTitle) onRenameChat(session.id, nextTitle);
                      setEditingChatId(null);
                      setEditingChatTitle('');
                    };
                    return (
                      <div
                        key={session.id}
                        onContextMenu={(event) => openSessionContextMenu(event, {
                          kind: 'chat',
                          id: session.id,
                          x: event.clientX,
                          y: event.clientY,
                        })}
                        onClick={() => {
                          setSessionContextMenu(null);
                          setSelectedChatSessionId(session.id);
                          setActiveView('chat-home');
                          setSelectedSubItemId(null);
                        }}
                        className={`mx-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#f5f2fc] text-[#6f57c8]'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editingChatTitle}
                              onChange={(event) => setEditingChatTitle(event.target.value)}
                              onClick={(event) => event.stopPropagation()}
                              onBlur={commitRename}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                  event.preventDefault();
                                  commitRename();
                                }
                                if (event.key === 'Escape') {
                                  event.preventDefault();
                                  setEditingChatId(null);
                                  setEditingChatTitle('');
                                }
                              }}
                              className="min-w-0 flex-1 bg-white/80 border border-[#d9d2ff] rounded-md px-1.5 py-0.5 text-[11px] font-bold text-gray-700 outline-none"
                            />
                          ) : (
                            <span
                              onDoubleClick={(event) => {
                                event.stopPropagation();
                                setEditingChatId(session.id);
                                setEditingChatTitle(session.title);
                              }}
                              className="min-w-0 flex-1 text-[11px] font-bold truncate"
                              title="双击重命名"
                            >
                              {session.title}
                            </span>
                          )}
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] font-semibold text-gray-400">{session.time}</span>
                            <button
                              type="button"
                              aria-label="会话操作"
                              onClick={(event) => openSessionActionMenu(event, {
                                kind: 'chat',
                                id: session.id,
                              })}
                              className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white hover:text-[#6f57c8]"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. 数字员工 Section */}
            {false && (
            <div className="pt-2 space-y-0.5">
              <div 
                className="flex items-center justify-between px-3.5 py-2 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer"
                onClick={() => setChatCollapse(!chatCollapse)}
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold tracking-wide">数字员工</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-gray-200/60 px-1.5 py-0.2 rounded-md font-semibold text-gray-500">{digitalAgents.length}</span>
                  {chatCollapse ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Digital Agents List */}
              {!chatCollapse && (
                <div className="space-y-1.5 mt-1">
                  <div className="px-1.5 mb-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="检索智能体..."
                        className="w-full pl-7 pr-2.5 py-1 bg-gray-100 border border-transparent rounded-lg text-[10px] text-gray-700 placeholder-gray-400 outline-none focus:bg-white focus:border-[#8b74db] transition-all font-semibold"
                        value={agentSearch}
                        onChange={(e) => setAgentSearch(e.target.value)}
                      />
                    </div>
                  </div>

                  {filteredDigitalAgents.length === 0 ? (
                    <p className="text-[10px] text-gray-400 font-bold py-2 px-3.5 text-center">无匹配智能体</p>
                  ) : filteredDigitalAgents.map((agent) => {
                    const isAgentSelected = selectedAgentId === agent.id;
                    return (
                      <div key={agent.id} className="space-y-1">
                        {/* Parent Agent Row */}
                        <div
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 text-xs font-medium ${
                            isAgentSelected && !selectedSubItemId
                              ? 'bg-[#f5f2fc] text-[#0052d9] font-bold shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                          }`}
                          onClick={() => {
                            openAgent(agent.id);
                            setDigitalAgents(prev => prev.map(a => (
                              a.id === agent.id
                                ? {
                                    ...a,
                                    expanded: a.subItems.length > 0 ? !a.expanded : a.expanded,
                                  }
                                : a
                            )));
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar Circle */}
                            <div className="relative shrink-0">
                              <AgentSVGAvatar id={agent.id} size="sm" />
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[11px]">{agent.name}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Unread badge matching Project Collaboration red badge style! */}
                            {agent.unreadCount > 0 && (
                              <span className="h-4 min-w-4 flex items-center justify-center text-[9px] bg-[#ba1a1a] text-white rounded-full font-bold px-1 animate-pulse shrink-0">
                                {agent.unreadCount}
                              </span>
                            )}
                            {agent.subItems.length > 0 && (
                              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${agent.expanded ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </div>

                        {/* Indented Sub-items */}
                        {agent.expanded && agent.subItems.length > 0 && (
                          <div className="space-y-1 px-1">
                            {agent.subItems.map((subItem) => {
                              const isSubItemSelected = selectedSubItemId === subItem.id;
                              const isEditingAgentSession = editingAgentSessionId === subItem.id;
                              const commitAgentSessionRename = () => {
                                renameAgentSession(agent.id, subItem.id, editingAgentSessionName);
                                setEditingAgentSessionId(null);
                                setEditingAgentSessionName('');
                              };
                              return (
                                <div
                                  key={subItem.id}
                                  onContextMenu={(event) => openSessionContextMenu(event, {
                                    kind: 'agent',
                                    agentId: agent.id,
                                    subItemId: subItem.id,
                                    x: event.clientX,
                                    y: event.clientY,
                                  })}
                                  className={`mx-1.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 ${
                                    isSubItemSelected
                                      ? 'bg-[#f5f2fc] text-[#6f57c8]'
                                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent triggering parent row click
                                    setSessionContextMenu(null);
                                    setSelectedAgentId(agent.id);
                                    setSelectedSubItemId(subItem.id);

                                    if (agent.id === 'agent-年报') {
                                      setActiveView('annual-report-audit');
                                    } else if (agent.id === 'agent-会计') {
                                      setActiveView('assistant');
                                    } else {
                                      setActiveView('agent-generic');
                                    }

                                    // Clear Unread
                                    setDigitalAgents(prev => prev.map(a => {
                                      if (a.id === agent.id) {
                                        const updatedSubItems = a.subItems.map(si => 
                                          si.id === subItem.id ? { ...si, unreadCount: 0 } : si
                                        );
                                        const nextUnread = updatedSubItems.reduce((sum, item) => sum + item.unreadCount, 0);
                                        return {
                                          ...a,
                                          unreadCount: nextUnread,
                                          subItems: updatedSubItems
                                        };
                                      }
                                      return a;
                                    }));
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    {isEditingAgentSession ? (
                                      <input
                                        autoFocus
                                        value={editingAgentSessionName}
                                        onChange={(event) => setEditingAgentSessionName(event.target.value)}
                                        onClick={(event) => event.stopPropagation()}
                                        onBlur={commitAgentSessionRename}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter') {
                                            event.preventDefault();
                                            commitAgentSessionRename();
                                          }
                                          if (event.key === 'Escape') {
                                            event.preventDefault();
                                            setEditingAgentSessionId(null);
                                            setEditingAgentSessionName('');
                                          }
                                        }}
                                        className="min-w-0 flex-1 bg-white/80 border border-[#d9d2ff] rounded-md px-1.5 py-0.5 text-[11px] font-bold text-gray-700 outline-none"
                                      />
                                    ) : (
                                      <span
                                        onDoubleClick={(event) => {
                                          event.stopPropagation();
                                          setEditingAgentSessionId(subItem.id);
                                          setEditingAgentSessionName(subItem.name);
                                        }}
                                        className="min-w-0 flex-1 text-[11px] font-bold truncate"
                                        title="双击重命名"
                                      >
                                        {subItem.name}
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {subItem.unreadCount > 0 ? (
                                        <span className="h-4 min-w-4 flex items-center justify-center text-[9px] bg-[#ba1a1a] text-white rounded-full font-bold px-1 animate-pulse">
                                          {subItem.unreadCount}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-semibold text-gray-400">刚刚</span>
                                      )}
                                      <button
                                        type="button"
                                        aria-label="数字员工会话操作"
                                        onClick={(event) => openSessionActionMenu(event, {
                                          kind: 'agent',
                                          agentId: agent.id,
                                          subItemId: subItem.id,
                                        })}
                                        className="flex h-5 w-5 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-white hover:text-[#6f57c8]"
                                      >
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* 3. 工具箱 Section */}
            {false && (
            <div className="pt-2 space-y-0.5">
              <div className="flex items-center justify-between px-3.5 py-2 text-gray-500 hover:text-gray-800 rounded-lg cursor-pointer">
                <div className="flex items-center gap-3">
                  <BriefcaseBusiness className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-bold tracking-wide">工具箱</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-gray-200/60 px-1.5 py-0.2 rounded-md font-semibold text-gray-500">4</span>
                </div>
              </div>
            </div>
            )}
          </>
        )}
      </nav>

      {sessionContextMenu && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSessionContextMenu(null)} />
          <div
            className="fixed z-50 w-[132px] overflow-hidden rounded-xl border border-[#e3e7f0] bg-white py-1.5 shadow-xl"
            style={{ left: sessionContextMenu.x, top: sessionContextMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            {sidebarMenuItems.map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => handleSessionMenuAction(item.action)}
                className={`w-full px-3 py-2 text-left text-xs font-bold transition-colors ${
                  item.action === 'delete'
                    ? 'text-[#ba1a1a] hover:bg-red-50'
                    : 'text-gray-700 hover:bg-[#f5f7ff]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}

      {/* Bottom User Profile */}
      <div className="relative p-3 border-t border-[#dfe2ed] bg-[#fbfbff]">
        {profileMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setProfileMenuOpen(false)} />
            <div className="absolute left-2 bottom-[64px] z-30 w-[214px] rounded-xl border border-gray-200/80 bg-white/92 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="p-3 flex items-center gap-2.5 border-b border-gray-100">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[11px] text-[#0052d9] font-bold shadow-sm">
                    符
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-gray-800 truncate leading-none">符金雨</p>
                  <p className="text-[10px] text-gray-400 font-semibold truncate mt-1">huaan</p>
                </div>
                <span className="max-w-[78px] truncate rounded-md bg-gray-100 px-2 py-1 text-[9px] font-bold text-gray-500">
                  {agentConnected ? 'Agent 已连接' : 'Agent 未连接'}
                </span>
              </div>
              <div className="py-1.5">
                {[
                  { label: '设置', icon: Settings },
                  { label: 'API Key 配置', icon: KeyRound },
                  { label: '更换头像', icon: ImagePlus },
                  { label: '账号安全', icon: ShieldCheck },
                  { label: '退出登录', icon: LogOut },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={async () => {
                        setProfileMenuOpen(false);
                        if (item.label !== 'API Key 配置') return;
                        setSettingsOpen(true);
                        setSettingsStatus('读取配置中…');
                        try {
                          const [configResponse, usageResponse] = await Promise.all([
                            fetch('http://127.0.0.1:4000/api/project-agent/config'),
                            fetch('http://127.0.0.1:4000/api/project-agent/usage'),
                          ]);
                          const config = await configResponse.json();
                          const currentUsage = await usageResponse.json();
                          setSettingsModel(config.model || 'deepseek-v4-flash');
                          setUsage({ requests: currentUsage.requests || 0, totalTokensEstimated: currentUsage.totalTokensEstimated || 0 });
                          setSettingsStatus(config.configured ? '后端已连接，API Key 已配置' : '尚未配置 API Key');
                        } catch {
                          setSettingsStatus('无法连接后端，请先启动 Python Agent 服务');
                        }
                      }}
                      className="w-full px-3 py-2.5 flex items-center gap-3 text-xs font-bold text-gray-700 hover:bg-[#f5f2fc] transition-colors text-left"
                    >
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={() => setProfileMenuOpen(prev => !prev)}
          className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-gray-50 transition-colors text-left"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[11px] text-[#0052d9] font-bold shadow-sm">
              符
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white bg-emerald-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-800 truncate leading-none">符金雨</p>
            <p className="text-[10px] text-gray-400 font-semibold truncate mt-1">huaan</p>
          </div>
        </button>
        {settingsOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/20 p-6" onClick={() => setSettingsOpen(false)}>
            <div className="w-[420px] rounded-2xl border border-white bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-black text-[#253858]">API Key 配置</h2>
                <button type="button" onClick={() => setSettingsOpen(false)} className="text-xl text-gray-400">×</button>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-gray-500">API Key 只发送给本机后端服务使用，不会写入前端代码或后端代码。</p>
              <label className="mt-5 block text-xs font-bold text-gray-600">DeepSeek API Key</label>
              <input type="password" value={settingsApiKey} onChange={(event) => setSettingsApiKey(event.target.value)} placeholder="sk-..." className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-400" />
              <label className="mt-4 block text-xs font-bold text-gray-600">Agent 底层模型</label>
              <select value={settingsModel} onChange={(event) => setSettingsModel(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-400">
                <option value="deepseek-v4-flash">DeepSeek V4 Flash（推荐）</option>
                <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
              </select>
              <div className="mt-4 rounded-xl bg-[#f5f7fb] p-3 text-xs text-[#64748b]">
                <div className="font-bold text-[#315fb6]">LangGraph Agent：{settingsStatus}</div>
                <div className="mt-2 flex gap-5"><span>请求次数：{usage.requests}</span><span>估算 Token：{usage.totalTokensEstimated}</span></div>
              </div>
              <button type="button" onClick={async () => {
                if (!settingsApiKey.trim()) { setSettingsStatus('请输入 API Key'); return; }
                setSettingsStatus('保存中…');
                const response = await fetch('http://127.0.0.1:4000/api/project-agent/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: settingsApiKey, model: settingsModel }) });
                if (response.ok) {
                  setSettingsStatus('保存成功，Agent 已可调用');
                  setSettingsApiKey('');
                  setAgentConnected(true);
                  localStorage.setItem('roadwise-agent-configured', '1');
                  window.setTimeout(() => setSettingsOpen(false), 350);
                } else {
                  setSettingsStatus('保存失败，请检查 API Key');
                }
              }} className="mt-5 h-10 w-full rounded-lg border border-[#b9ccef] bg-white text-sm font-bold text-[#315fb6] shadow-sm hover:border-[#8eabe0] hover:bg-[#f5f8ff]">保存并连接</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
