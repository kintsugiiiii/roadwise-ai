import { useEffect, useRef, useState } from 'react';
import { ArrowUp, ChevronDown, ChevronLeft, ChevronRight, Folder, MoreHorizontal, Paperclip, MessageSquare, Plus, X } from 'lucide-react';
import roadwiseLogo from '../assets/roadwise-logo.png?inline';
import { readSharedAgentMessages, readSharedAgentSessions, writeSharedAgentMessages, writeSharedAgentSessions, subscribeSharedAgentMessages, SharedAgentMessage, SharedAgentSession } from '../lib/agentSession';

interface ChatHomeAgent {
  id: string;
  name: string;
  role: string;
  avatarText: string;
}

interface ChatHomeViewProps {
  agents: ChatHomeAgent[];
  onSelectAgent: (id: string) => void;
  showSessionHistory?: boolean;
  sessionId?: string | null;
  sessionTitleOverride?: string;
}

const quickPrompts = [
  { title: '建立你的专属项目', prompt: '请帮我建立一个新的个人项目，并生成项目环节、具体任务和知识图谱。' },
  { title: '询问具体意见', prompt: '请结合当前项目内容，给出具体、可执行的改进意见。' },
  { title: '编辑图谱', prompt: '请帮我编辑当前知识图谱，调整节点、任务和节点之间的关系。' },
  { title: '进行项目评审', prompt: '请根据当前项目图谱和我提供的成果，对项目进行结构化评审。' },
];
const skillSuggestions = [
  { name: 'project_create', description: '新建项目并生成环节、任务和图谱' },
  { name: 'project_edit', description: '编辑节点、任务和节点关系' },
  { name: 'project_review', description: '结合图谱与成果材料进行项目评审' },
  { name: 'grill-me', description: '严格挑战方案、假设、风险和实施可行性' },
];

const inferProjectType = (value: unknown): '个人项目' | '创业项目' | '企业项目' => {
  const text = typeof value === 'string' ? value : '';
  if (/创业|商业计划|商业化|市场验证|融资|客户付费|商业模式|平台|产品|资产管理|商业计划书/.test(text)) return '创业项目';
  if (/企业内部|组织流程|SOP|团队流程|部门协作/.test(text)) return '企业项目';
  return '个人项目';
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

function StructuredAgentText({ text }: { text: string }) {
  const blocks = text.replace(/\s+【/g, '\n【').replace(/；\s*/g, '；\n').replace(/(?<!\d)\s+(?=stage[-_]\d)/gi, '\n').split(/\n+/).map((item) => item.trim()).filter(Boolean);
  return <div className="space-y-2.5">{blocks.map((block, index) => {
    const section = block.match(/^【([^】]+)】[：:]?\s*(.*)$/s);
    const list = block.match(/^(\d+)[.、]\s*(.*)$/s);
    if (section) return <p key={index} className="leading-7"><strong className="mr-1 font-bold text-[#234b82]">{section[1]}</strong>{section[2]}</p>;
    if (list) return <p key={index} className="pl-1 leading-7"><span className="mr-1 font-semibold text-[#315fb6]">{list[1]}.</span>{list[2]}</p>;
    return <p key={index} className="leading-7">{block}</p>;
  })}</div>;
}

export default function ChatHomeView({ agents, onSelectAgent, showSessionHistory = true, sessionId = null, sessionTitleOverride }: ChatHomeViewProps) {
  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const fallback = sessionId || 'shared-agent-session';
    if (fallback !== 'shared-agent-session') return fallback;
    try {
      return localStorage.getItem('roadwise.active-agent-session.v1') || fallback;
    } catch {
      return fallback;
    }
  });
  const [displaySessionTitle, setDisplaySessionTitle] = useState('新会话');
  const activeSessionId = currentSessionId;
  const [promptText, setPromptText] = useState('');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [selectedSkillTag, setSelectedSkillTag] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(() => readSharedAgentMessages(activeSessionId).length > 0);
  const [model, setModel] = useState('deepseek-v4-flash');
  const [attachments, setAttachments] = useState<{ name: string; type: string; content?: string; dataUrl?: string; files?: unknown[]; isFolder?: boolean; fileCount?: number }[]>([]);
  const [sessionHistoryCollapsed, setSessionHistoryCollapsed] = useState(true);
  const [openSessionMenu, setOpenSessionMenu] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState('');
  const folderInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (sessionId) setCurrentSessionId(sessionId);
  }, [sessionId]);
  useEffect(() => {
    if (currentSessionId === 'new-chat-session') return;
    try {
      localStorage.setItem('roadwise.active-agent-session.v1', currentSessionId);
    } catch {
      // Ignore storage failures; the current component state remains usable.
    }
  }, [currentSessionId]);
  const [messages, setMessages] = useState<SharedAgentMessage[]>(() => readSharedAgentMessages(activeSessionId));
  const [sessions, setSessions] = useState<SharedAgentSession[]>(() => readSharedAgentSessions());
  const initializedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    const isFreshChat = activeSessionId === 'new-chat-session';
    const currentSessions = readSharedAgentSessions();
    const matchedSession = currentSessions.find((session) => session.id === activeSessionId);
    const isFirstLoad = initializedSessionRef.current !== activeSessionId;
    initializedSessionRef.current = activeSessionId;
    const shouldStartBlank = isFreshChat || (isFirstLoad && matchedSession?.title === '新会话' && matchedSession.started !== true);
    const sessionMessages = shouldStartBlank ? [] : readSharedAgentMessages(activeSessionId);
    if (shouldStartBlank) localStorage.removeItem(`roadwise.shared-agent-session.v1.${activeSessionId}`);
    setMessages(sessionMessages);
    setHasStartedConversation(sessionMessages.length > 0);
    const nextSessions = readSharedAgentSessions();
    setSessions(nextSessions);
    setDisplaySessionTitle(nextSessions.find((session) => session.id === activeSessionId)?.title || '新会话');
    return subscribeSharedAgentMessages(() => {
    setMessages(readSharedAgentMessages(activeSessionId));
    setSessions(readSharedAgentSessions());
    });
  }, [activeSessionId]);
  useEffect(() => {
    fetch('http://127.0.0.1:4000/api/project-agent/config').then((response) => response.json()).then((config) => {
      if (config.model) setModel(config.model);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    const input = folderInputRef.current;
    if (!input) return;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
  }, []);
  const firstUserMessage = messages.find((message) => message.role === 'user');
  const sessionTitle = firstUserMessage?.text.trim().slice(0, 24) || '新会话';
  const orderedSessions = [...sessions].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const currentSessionTitle = sessionTitleOverride || displaySessionTitle;
  const beginRename = (id: string, title: string) => {
    setEditingSessionId(id);
    setEditingSessionTitle(title);
    setOpenSessionMenu(null);
  };
  const finishRename = (id: string, fallback: string) => {
    const nextTitle = editingSessionTitle.trim() || fallback;
    writeSharedAgentSessions(readSharedAgentSessions().map((item) => item.id === id ? { ...item, title: nextTitle } : item));
    setSessions((current) => current.map((item) => item.id === id ? { ...item, title: nextTitle } : item));
    if (currentSessionId === id) setDisplaySessionTitle(nextTitle);
    setEditingSessionId(null);
  };

  const handleSubmit = async () => {
    const value = promptText.trim();
    if (!value || isSending) return;
    setHasStartedConversation(true);
    const currentSessions = readSharedAgentSessions();
    const existingSession = currentSessions.find((session) => session.id === activeSessionId);
    const autoTitle = value
      .replace(/^\/(project_create|project_edit|project_review)\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 24) || '新会话';
    const shouldAutoTitle = !existingSession || !existingSession.title || existingSession.title === '新会话';
    const currentSession = existingSession
      ? { ...existingSession, title: shouldAutoTitle ? autoTitle : existingSession.title, time: '刚刚', started: true }
      : { id: activeSessionId, title: autoTitle, time: '刚刚', started: true };
    writeSharedAgentSessions([currentSession, ...currentSessions.filter((session) => session.id !== activeSessionId)]);
    setSessions((current) => [currentSession, ...current.filter((session) => session.id !== activeSessionId)]);
    setDisplaySessionTitle(currentSession.title);
    const skillMatch = value.match(/^\/(project_create|project_edit|project_review|grill-me)\b/i);
    const selectedSkills = selectedSkillTag ? [selectedSkillTag] : skillMatch ? [skillMatch[1].toLowerCase()] : undefined;
    const agentAction = selectedSkills?.[0] === 'project_create' ? 'generate' : selectedSkills?.[0] === 'project_edit' ? 'update' : selectedSkills?.[0] === 'project_review' ? 'review' : 'chat';
    const nextMessages = [...readSharedAgentMessages(activeSessionId), { role: 'user' as const, text: value, skills: selectedSkills, attachments: attachments.map(({ name, isFolder, fileCount }) => ({ name, isFolder, fileCount })) }];
    writeSharedAgentMessages(nextMessages, activeSessionId);
    setPromptText('');
    setSelectedSkillTag(null);
    setAttachments([]);
    setIsSending(true);
    try {
      const response = await fetch('http://127.0.0.1:4000/api/project-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: agentAction, sessionId: activeSessionId, projectId: 'current-project', message: value.replace(/^\/(project_create|project_edit|project_review)\s*/i, ''), skills: selectedSkills, attachments }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.detail || `后端请求失败（${response.status}）`);
      if (selectedSkills?.[0]) {
        try {
          const stateKey = 'roadwise.project-state.current-project.v1';
          const previous = JSON.parse(localStorage.getItem(stateKey) || '{"projectId":"current-project","attachments":[],"graph":[],"reviews":[]}');
          const nextState = selectedSkills[0] === 'project_create'
            ? { ...previous, ...payload, projectId: `project-${Date.now()}`, client: ['个人项目', '创业项目', '企业项目'].includes(payload.projectType) ? payload.projectType : inferProjectType(`${value} ${payload.projectName || ''} ${payload.summary || ''} ${(attachments || []).map((item) => item.name).join(' ')}`), attachments: (payload.attachments || attachments).map((item: any) => ({ ...(attachments.find((source) => source.name === item.name) || {}), ...item })), userQuestions: [...(previous.userQuestions || []), value], materialAnalysis: payload.message || previous.materialAnalysis || '', reviewVersions: previous.reviewVersions || [] }
            : selectedSkills[0] === 'project_review'
              ? { ...previous, reviews: [...(previous.reviews || []), payload], attachments: [...(previous.attachments || []), ...attachments.filter((item) => !(previous.attachments || []).some((old: any) => old.name === item.name))], userQuestions: [...(previous.userQuestions || []), value], materialAnalysis: payload.message || previous.materialAnalysis || '', reviewVersions: [...(previous.reviewVersions || []), { version: `v${(previous.reviewVersions || []).length + 1}`, date: new Date().toISOString(), attachments: attachments.map((item) => item.name), result: payload }] }
              : { ...previous, ...payload, edits: [...(previous.edits || []), payload] };
          localStorage.setItem(stateKey, JSON.stringify(nextState));
          if (selectedSkills[0] === 'project_create' || selectedSkills[0] === 'project_review') {
            const collectionKey = 'roadwise.project-states.v1';
            const collection = JSON.parse(localStorage.getItem(collectionKey) || '[]');
            const nextCollection = Array.isArray(collection)
              ? [...collection.filter((item) => item.projectId !== nextState.projectId && item.projectName !== nextState.projectName), { ...nextState, projectName: nextState.projectName || previous.projectName || '当前项目' }]
              : [{ ...nextState, projectName: nextState.projectName || previous.projectName || '当前项目' }];
            localStorage.setItem(collectionKey, JSON.stringify(nextCollection));
          }
          window.dispatchEvent(new Event('roadwise-project-state-updated'));
        } catch {
          // Keep the chat usable if local project-state persistence is unavailable.
        }
      }
      writeSharedAgentMessages([...nextMessages, { role: 'agent', text: payload.message || 'Agent 已返回结果。', result: payload }], activeSessionId);
    } catch (error) {
      writeSharedAgentMessages([...nextMessages, { role: 'agent', text: `Agent 暂时无法响应：${error instanceof Error ? error.message : '未知错误'}` }], activeSessionId);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div onClick={() => setOpenSessionMenu(null)} className="flex h-full flex-1 overflow-hidden bg-[linear-gradient(135deg,#f2f1fb_0%,#f8fbfd_50%,#eef8f7_100%)] select-none">
      {showSessionHistory && <aside className={`${sessionHistoryCollapsed ? 'w-[48px]' : 'w-[156px]'} relative z-30 shrink-0 border-r border-white/80 bg-white/35 px-2 pt-5 backdrop-blur-md transition-[width] duration-200`}>
        <div className={`flex items-center ${sessionHistoryCollapsed ? 'justify-center' : 'justify-between'} px-1 text-[11px] font-black text-[#65738b]`}>
          {!sessionHistoryCollapsed && <span>会话</span>}
          {sessionHistoryCollapsed && <MessageSquare className="h-4 w-4 text-[#7b879a]" />}
          {!sessionHistoryCollapsed && <span className="rounded-md bg-[#e8eaf2] px-1.5 py-0.5 text-[9px] text-[#7b879a]">{orderedSessions.length}</span>}
        </div>
        {!sessionHistoryCollapsed && <button type="button" onClick={() => {
          const newSession = { id: `chat-${Date.now()}`, title: '新会话', time: '刚刚', started: false };
          writeSharedAgentSessions([newSession, ...readSharedAgentSessions()]);
          setCurrentSessionId(newSession.id);
          setDisplaySessionTitle(newSession.title);
          setMessages([]);
          setHasStartedConversation(false);
        }} className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-[#e4def5] bg-white/70 px-2 py-2 text-[10px] font-bold text-[#6f57c8] hover:bg-white">
          <Plus className="h-3.5 w-3.5" /> 新建会话
        </button>}
        {!sessionHistoryCollapsed && (orderedSessions.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {orderedSessions.map((session) => (
              <div key={session.id} onClick={(event) => { event.stopPropagation(); setCurrentSessionId(session.id); setDisplaySessionTitle(session.title); const sessionMessages = readSharedAgentMessages(session.id); const hasConversation = session.started === true || (session.title !== '新会话' && sessionMessages.length > 0); setMessages(hasConversation ? sessionMessages : []); setHasStartedConversation(hasConversation); }} className={`relative rounded-xl bg-[#f2effb] px-3 py-2.5 text-[10px] font-bold text-[#6f57c8] ${currentSessionId === session.id ? 'ring-1 ring-[#c9baf0]' : ''}`} title={session.title}>
                <div className="flex items-center gap-2">
                  {editingSessionId === session.id ? <input autoFocus value={editingSessionTitle} onChange={(event) => setEditingSessionTitle(event.target.value)} onBlur={() => finishRename(session.id, session.title)} onKeyDown={(event) => { if (event.key === 'Enter') finishRename(session.id, session.title); if (event.key === 'Escape') setEditingSessionId(null); }} className="min-w-0 flex-1 rounded border border-[#b9a9ec] bg-white px-1 text-[10px] font-normal text-[#4b5563] outline-none" /> : <div className="min-w-0 flex-1 truncate">{session.title}</div>}
                  <span className="shrink-0 text-[9px] font-semibold text-[#9a91bd]">{session.time}</span>
                  <button type="button" aria-label="会话操作" onClick={(event) => { event.stopPropagation(); setOpenSessionMenu((current) => current === session.id ? null : session.id); }} className="shrink-0 text-[#9a91bd] hover:text-[#6f57c8]"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                </div>
                {openSessionMenu === session.id && (
                  <div onClick={(event) => event.stopPropagation()} className="absolute left-[calc(100%+6px)] top-0 z-50 w-20 rounded-lg border border-[#e5e1f0] bg-white p-1 text-[9px] font-bold text-[#65738b] shadow-lg">
                    <button type="button" className="w-full rounded px-2 py-1.5 text-left hover:bg-[#f4f1fb]" onClick={() => {
                      writeSharedAgentSessions(readSharedAgentSessions().map((item) => item.id === session.id ? { ...item, pinned: !item.pinned } : item));
                      setOpenSessionMenu(null);
                    }}>{session.pinned ? '取消置顶' : '置顶'}</button>
                    <button type="button" className="w-full rounded px-2 py-1.5 text-left hover:bg-[#f4f1fb]" onClick={() => {
                      beginRename(session.id, session.title);
                    }}>重命名</button>
                    <button type="button" className="w-full rounded px-2 py-1.5 text-left text-red-500 hover:bg-red-50" onClick={() => {
                      writeSharedAgentSessions(readSharedAgentSessions().filter((item) => item.id !== session.id));
                      setOpenSessionMenu(null);
                    }}>删除</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 px-2 text-[9px] font-semibold leading-relaxed text-[#9aa5b6]">暂无会话</div>
        ))}
        <button
          type="button"
          onClick={() => setSessionHistoryCollapsed((collapsed) => !collapsed)}
          className="absolute right-[-11px] top-5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[#e2e5ed] bg-white text-[#7b879a] shadow-sm hover:text-[#5f4cc3]"
          aria-label={sessionHistoryCollapsed ? '展开会话记录' : '折叠会话记录'}
        >
          {sessionHistoryCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>}
      <div className={`relative h-full min-h-0 min-w-0 flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden px-4 ${hasStartedConversation ? 'pt-14' : 'pt-24'} pb-6 lg:px-8`}>
        {hasStartedConversation && <div className="absolute left-6 right-6 top-3 flex items-center gap-3 border-b border-[#e5e8ef] pb-3" title={currentSessionTitle}>
          {editingSessionId === activeSessionId ? <input autoFocus value={editingSessionTitle} onChange={(event) => setEditingSessionTitle(event.target.value)} onBlur={() => finishRename(activeSessionId, currentSessionTitle)} onKeyDown={(event) => { if (event.key === 'Enter') finishRename(activeSessionId, currentSessionTitle); if (event.key === 'Escape') setEditingSessionId(null); }} className="min-w-0 flex-1 rounded border border-[#b9a9ec] bg-white px-1 text-sm font-normal text-[#1f2937] outline-none" /> : <div className="truncate text-left text-sm font-normal text-[#1f2937]">{currentSessionTitle}</div>}
          <button type="button" aria-label="会话操作" onClick={(event) => { event.stopPropagation(); setOpenSessionMenu((current) => current === activeSessionId ? null : activeSessionId); }} className="relative shrink-0 text-[#8b95a5] hover:text-[#5f6b7d]"><MoreHorizontal className="h-5 w-5" />
            {openSessionMenu === activeSessionId && <div onClick={(event) => event.stopPropagation()} className="absolute left-0 top-6 z-50 w-20 rounded-lg border border-[#e5e1f0] bg-white p-1 text-[9px] font-bold text-[#65738b] shadow-lg">
              {(() => { const activeSession = sessions.find((session) => session.id === activeSessionId); return <>
                <button type="button" className="w-full rounded px-2 py-1.5 text-left hover:bg-[#f4f1fb]" onClick={() => { writeSharedAgentSessions(readSharedAgentSessions().map((item) => item.id === activeSessionId ? { ...item, pinned: !item.pinned } : item)); setOpenSessionMenu(null); }}>{activeSession?.pinned ? '取消置顶' : '置顶'}</button>
                <button type="button" className="w-full rounded px-2 py-1.5 text-left hover:bg-[#f4f1fb]" onClick={() => beginRename(activeSessionId, currentSessionTitle)}>重命名</button>
                <button type="button" className="w-full rounded px-2 py-1.5 text-left text-red-500 hover:bg-red-50" onClick={() => { writeSharedAgentSessions(readSharedAgentSessions().filter((item) => item.id !== activeSessionId)); setOpenSessionMenu(null); }}>删除</button>
              </>; })()}
            </div>}
          </button>
        </div>}
        {!hasStartedConversation && <>
          <img src={roadwiseLogo} alt="Roadwise" className="mb-4 h-auto w-[150px] object-contain" />
          <h1 className="text-[24px] leading-tight font-black tracking-normal text-[#111827]">你好！我是你的研创助手</h1>
          <p className="mt-3 text-xs font-medium text-gray-500">负责把个人项目拆解成可执行、可验收、可追溯的知识图谱，同时提供专业的项目管理和评审支持。</p>
        </>}

        {hasStartedConversation && <div className="mb-2 flex min-h-0 w-full max-w-[930px] flex-1 flex-col gap-3 overflow-y-auto pt-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[#dceeff] text-[#16365d]' : 'border border-white/80 bg-white/75 text-[#475569] shadow-sm'}`}>
                {message.skills?.length ? <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#7054c6]"><span>⬡</span><span>{message.skills.join(', ')}</span></div> : null}
                {message.attachments?.length ? <div className="mb-2 space-y-1.5">{message.attachments.map((attachment, attachmentIndex) => <div key={`${attachment.name}-${attachmentIndex}`} className="flex items-center gap-2 rounded-lg bg-white/65 px-2.5 py-2 text-xs"><span>{attachment.isFolder ? '📁' : '📎'}</span><span className="max-w-[220px] truncate">{attachment.name}</span>{attachment.isFolder && <span className="text-[10px] opacity-70">{attachment.fileCount} 个文件</span>}</div>)}</div> : null}
                {message.role === 'agent' ? <StructuredAgentText text={message.text} /> : message.text}
              </div>
            </div>
          ))}
          {isSending && <div className="self-start rounded-2xl bg-white/75 px-4 py-3 text-xs text-gray-400">Agent 正在处理…</div>}
        </div>}

        <div className={`sticky bottom-0 z-10 ${hasStartedConversation ? 'mt-2' : 'mt-8'} mb-2 box-border w-full max-w-[930px] min-w-0 shrink-0 rounded-3xl bg-white/85 px-1 border border-white/80 shadow-[0_18px_60px_rgba(82,94,120,0.10)] overflow-visible backdrop-blur-xl focus-within:border-white focus-within:ring-0`}>
          {selectedSkillTag && <div className="flex items-center gap-1.5 px-5 pt-3 text-sm font-semibold text-[#7054c6]"><span className="text-[15px] leading-none">⬡</span><span>{selectedSkillTag}</span><button type="button" aria-label="移除 skill" onClick={() => setSelectedSkillTag(null)} className="ml-1 text-base leading-none text-[#9b88d5] hover:text-[#7054c6]">×</button></div>}
          {attachments.length > 0 && <div className="flex gap-2 overflow-x-auto border-b border-gray-100/70 px-4 pt-3">
            {attachments.map((attachment, index) => <div key={`${attachment.name}-${index}`} className="flex min-w-[180px] shrink-0 items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-[11px] text-gray-600" title={attachment.name}>
              {attachment.isFolder ? <Folder className="h-5 w-5 shrink-0 text-[#64748b]" /> : <Paperclip className="h-5 w-5 shrink-0 text-[#64748b]" />}
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{attachment.name}</div><div className="text-[9px] text-gray-400">{attachment.isFolder ? `Folder · ${attachment.fileCount} 个文件` : 'File'}</div></div>
              <button type="button" aria-label="移除附件" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}><X className="h-4 w-4 text-gray-400 hover:text-gray-700" /></button>
            </div>)}
          </div>}
          <textarea
            value={promptText}
            onChange={(event) => { const next = event.target.value; setPromptText(next); setShowSkillSuggestions(/^\/\w*$/.test(next.trimStart())); }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="输入问题，或使用 / 调用能力"
            className="box-border w-full h-[88px] resize-none bg-transparent px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
            style={{ outline: 'none', border: 0, boxShadow: 'none' }}
          />
          {showSkillSuggestions && <div className="absolute bottom-[calc(100%-1px)] left-4 z-40 mb-2 w-[min(330px,calc(100%-2rem))] rounded-xl border border-[#dfe5ef] bg-white p-1.5 shadow-lg">{skillSuggestions.map((skill) => <button key={skill.name} type="button" onClick={() => { setSelectedSkillTag(skill.name); setPromptText(''); setShowSkillSuggestions(false); }} className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-[#f3f6fb]"><span className="text-xs font-bold text-[#315ca9]">/{skill.name}</span><span className="text-[10px] text-[#7d899b]">{skill.description}</span></button>)}</div>}
          <div className="h-11 border-t border-gray-100/70 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
              <input id="roadwise-chat-file" type="file" multiple className="hidden" onChange={async (event) => {
                const files = Array.from(event.target.files || []) as File[];
                if (!files.length) return;
                const nextAttachments = await Promise.all(files.map(async (file) => {
                  const isText = file.type.startsWith('text/') || /\.(md|txt|json|csv|xml|yaml|yml)$/i.test(file.name);
                  return { name: file.name, type: file.type || 'application/octet-stream', ...(isText ? { content: await file.text() } : { dataUrl: await readFileAsDataUrl(file) }) };
                }));
                setAttachments((current) => [...current, ...nextAttachments]);
                event.target.value = '';
              }} />
              <input ref={folderInputRef} id="roadwise-chat-folder" type="file" multiple className="hidden" onChange={async (event) => {
                const files = Array.from(event.target.files || []) as File[];
                if (!files.length) return;
                const firstPath = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath || files[0].name;
                const folderName = firstPath.split('/')[0];
                const folderFiles = await Promise.all(files.map(async (file) => {
                  const isText = file.type.startsWith('text/') || /\.(md|txt|json|csv|xml|yaml|yml)$/i.test(file.name);
                  return { name: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name, type: file.type || 'application/octet-stream', ...(isText ? { content: await file.text() } : { dataUrl: await readFileAsDataUrl(file) }) };
                }));
                setAttachments((current) => [...current, { name: folderName, type: 'folder', isFolder: true, fileCount: files.length, files: folderFiles }]);
                event.target.value = '';
              }} />
              <label htmlFor="roadwise-chat-file" aria-label="附加文件" title="选择文件" className="flex cursor-pointer items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Paperclip className="w-4 h-4" />
              </label>
              <label htmlFor="roadwise-chat-folder" aria-label="附加文件夹" title="选择文件夹" className="flex cursor-pointer items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Folder className="h-4 w-4" />
              </label>
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <select value={model} onChange={async (event) => {
                const nextModel = event.target.value;
                setModel(nextModel);
                await fetch('http://127.0.0.1:4000/api/project-agent/model', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: nextModel }) }).catch(() => undefined);
              }} className="min-w-0 w-[118px] max-w-[118px] truncate bg-transparent text-[11px] font-semibold text-gray-600 outline-none sm:w-[150px] sm:max-w-[150px]">
                <option value="deepseek-v4-flash">DeepSeek V4 Flash</option>
                <option value="deepseek-v4-pro">DeepSeek V4 Pro</option>
              </select>
              <button
                onClick={handleSubmit}
                disabled={isSending}
                className="h-8 w-8 shrink-0 rounded-full bg-gray-400 text-white flex items-center justify-center transition-colors hover:bg-gray-600 disabled:cursor-wait disabled:opacity-60"
                aria-label="发送"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {!hasStartedConversation && <div className="w-full max-w-[930px] mt-7">
          <div className="mb-3 text-xs font-bold text-gray-500">你可以这样开始</div>
          <div className="grid grid-cols-2 gap-3">
            {quickPrompts.map((item) => (
              <button key={item.title} type="button" onClick={() => setPromptText(item.prompt)} className="rounded-2xl border border-white/80 bg-white/58 px-4 py-3 text-left text-xs font-bold text-gray-600 transition-all hover:border-[#c9c0f4] hover:bg-white hover:shadow-md">
                {item.title}
                <span className="mt-1 block text-[10px] font-medium text-gray-400">{item.prompt}</span>
              </button>
            ))}
          </div>
        </div>}
      </div>
    </div>
  );
}
