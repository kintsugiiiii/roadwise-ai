export type SharedAgentMessage = { role: 'user' | 'agent'; text: string; skills?: string[]; attachments?: { name: string; isFolder?: boolean; fileCount?: number }[]; result?: unknown };
const STORAGE_KEY = 'roadwise.shared-agent-session.v1';
const EVENT_NAME = 'roadwise-agent-session-updated';
const MIGRATION_KEY = 'roadwise.shared-agent-session.migrated-v2';
const SESSIONS_KEY = 'roadwise.agent-sessions.v1';
export type SharedAgentSession = { id: string; title: string; time: string; pinned?: boolean; started?: boolean };

export function readSharedAgentMessages(sessionId = 'shared-agent-session'): SharedAgentMessage[] {
  try {
    // 清理早期原型留下的测试会话；新会话会在用户首次发送消息时重新写入。
    if (!localStorage.getItem(MIGRATION_KEY)) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(MIGRATION_KEY, '1');
      return [];
    }
    const parsed = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.${sessionId}`) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
export function writeSharedAgentMessages(messages: SharedAgentMessage[], sessionId = 'shared-agent-session') {
  localStorage.setItem(`${STORAGE_KEY}.${sessionId}`, JSON.stringify(messages));
  window.dispatchEvent(new Event(EVENT_NAME));
}
export function subscribeSharedAgentMessages(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  return () => window.removeEventListener(EVENT_NAME, callback);
}
export function readSharedAgentSessions(): SharedAgentSession[] {
  try { const parsed = JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
export function writeSharedAgentSessions(sessions: SharedAgentSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(EVENT_NAME));
}
