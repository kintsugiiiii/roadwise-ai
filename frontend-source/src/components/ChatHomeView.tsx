import { useMemo, useState } from 'react';
import {
  ArrowUp,
  Bot,
  ChevronDown,
  Database,
  Folder,
  Link2,
  Paperclip,
  Search,
  SquareLibrary,
} from 'lucide-react';
import { AgentSVGAvatar } from './AgentSVGAvatar';
import huaxiaoanLogo from '../assets/huaxiaoan-logo.png?inline';

interface ChatHomeAgent {
  id: string;
  name: string;
  role: string;
  avatarText: string;
}

interface ChatHomeViewProps {
  agents: ChatHomeAgent[];
  onSelectAgent: (id: string) => void;
}

const featuredAgentIds = [
  'agent-人事',
  'agent-shebao',
  'agent-年报',
  'agent-会计',
];

const agentKeywordMap: Record<string, string> = {
  'agent-shebao': '社保 公积金 缴费 基数 审计 智能体会话',
  'agent-人事': '行政 人事 合同 劳动合同 草稿 生成 审查 续签',
  'agent-年报': '事业单位 年报 审计 报告 报表 底稿',
  'agent-会计': '财务 助手 会计 合规 凭证 科目',
};

export default function ChatHomeView({ agents, onSelectAgent }: ChatHomeViewProps) {
  const [promptText, setPromptText] = useState('');
  const [agentSearch, setAgentSearch] = useState('');

  const query = (agentSearch || promptText.replace(/^\//, '')).trim().toLowerCase();
  const visibleAgents = useMemo(() => {
    const rankedAgents = featuredAgentIds
      .map(id => agents.find(agent => agent.id === id))
      .filter(Boolean) as ChatHomeAgent[];
    const remainingAgents = agents.filter(agent => !featuredAgentIds.includes(agent.id));
    const source = [...rankedAgents, ...remainingAgents];

    if (!query) return source;
    return source.filter(agent => {
      const haystack = `${agent.name} ${agent.role} ${agent.avatarText} ${agentKeywordMap[agent.id] || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [agents, query]);

  const handleSubmit = () => {
    if (visibleAgents.length > 0) {
      onSelectAgent(visibleAgents[0].id);
    }
  };

  return (
    <div className="flex-1 h-full overflow-hidden bg-[linear-gradient(135deg,#f2f1fb_0%,#f8fbfd_50%,#eef8f7_100%)] select-none">
      <div className="h-full flex flex-col items-center px-8 pt-24 pb-10">
        <div className="w-24 h-24 rounded-3xl bg-white/55 shadow-[0_18px_50px_rgba(82,94,120,0.12)] border border-white/70 flex items-center justify-center mb-7 overflow-hidden">
          <div className="w-[90px] h-[90px] rounded-[20px] bg-[#eaf4fb] border border-white/80 shadow-inner flex items-center justify-center overflow-hidden">
            <img src={huaxiaoanLogo} alt="华小安" className="w-full h-full object-cover scale-[1.16]" />
          </div>
        </div>

        <h1 className="text-[30px] leading-tight font-black text-[#111827] tracking-normal">你好，我是华小安</h1>
        <p className="mt-4 text-sm font-medium text-gray-500">直接开始对话，或先绑定来源、知识库和工作目录。</p>

        <div className="w-full max-w-[930px] mt-9 rounded-3xl bg-white/62 border border-white/80 shadow-[0_18px_60px_rgba(82,94,120,0.10)] overflow-hidden backdrop-blur-xl">
          <textarea
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="输入问题，或使用 / 调用能力"
            className="w-full h-[88px] resize-none bg-transparent px-5 py-4 text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          <div className="h-11 border-t border-gray-100/70 px-4 flex items-center justify-between">
            <div className="flex items-center gap-5 text-[11px] font-semibold text-gray-400">
              <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Paperclip className="w-4 h-4" />
                <span>附加文件</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Link2 className="w-4 h-4" />
                <span>选择连接</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Database className="w-4 h-4" />
                <span>知识库</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
                <Folder className="w-4 h-4" />
                <span>Work in Folder</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-800 transition-colors">
                <span className="w-3.5 h-3.5 rounded bg-indigo-500 text-[9px] text-white flex items-center justify-center font-black">D</span>
                <span>deepseek-v4-flash</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={handleSubmit}
                className="w-8 h-8 rounded-full bg-gray-400 hover:bg-gray-600 text-white flex items-center justify-center transition-colors"
                aria-label="发送"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[930px] mt-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Bot className="w-4 h-4" />
              <span>已有智能体</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  value={agentSearch}
                  onChange={(event) => setAgentSearch(event.target.value)}
                  placeholder="检索智能体..."
                  className="w-48 h-8 rounded-xl bg-white/58 border border-white/70 pl-8 pr-3 text-[11px] font-semibold text-gray-600 placeholder-gray-400 outline-none focus:bg-white focus:border-[#8b74db] transition-all"
                />
              </div>
              <button className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">
                <SquareLibrary className="w-4 h-4" />
                <span>智能体广场</span>
              </button>
            </div>
          </div>

          {visibleAgents.length === 0 ? (
            <div className="h-20 rounded-2xl bg-white/50 border border-white/70 flex items-center justify-center text-sm font-bold text-gray-400">
              未找到匹配的智能体
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {visibleAgents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className="h-14 rounded-2xl bg-white/58 border border-white/70 hover:bg-white hover:border-[#d9d2ff] hover:shadow-md transition-all px-3 flex items-center gap-3 text-left"
                >
                  <AgentSVGAvatar id={agent.id} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-gray-800">{agent.name}</p>
                    <p className="truncate text-[10px] font-semibold text-gray-400 mt-0.5">{agent.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
