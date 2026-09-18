import { useState, useRef, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Send, 
  Settings, 
  Plus, 
  CheckCircle2, 
  FolderOpen, 
  List, 
  Columns, 
  Layout, 
  Play, 
  Clock, 
  Check, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import type { ProjectSeedPayload } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  avatarText?: string;
  time: string;
  content: string;
  files?: { name: string; size: string; type: string }[];
  isCallout?: boolean;
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

interface AnnualReportAuditViewProps {
  onCreateProjectFromSeed?: (payload: ProjectSeedPayload) => void;
}

export default function AnnualReportAuditView({ onCreateProjectFromSeed }: AnnualReportAuditViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-user',
      sender: 'user',
      senderName: '符金雨',
      avatarText: '符',
      time: '14:30',
      content: '我要做一个上海大学的2025年年报审计，导入以下财务信息：',
      files: [
        { name: '序时账.xlsx', size: '14.2 MB', type: 'excel' },
        { name: '科目余额表.xlsx', size: '1.8 MB', type: 'excel' },
        { name: '财务报表.xlsx', size: '540 KB', type: 'excel' }
      ]
    },
    {
      id: 'init-agent',
      sender: 'agent',
      senderName: '年报审计智能体',
      time: '14:31',
      content: '已按这次理解开始处理：当前已读取三份模拟 Excel 财务数据，并按年报审计流程完成初步拆解。我会先生成可复写的底稿初稿，后续补齐审计范围、重要性水平和模板口径后，再写入正式底稿。',
      identifiedInfo: {
        scope: '三份 Excel 已完成初步读取',
        period: '2025 年度',
        target: '上海大学 2025 年度年报审计',
        status: '底稿初稿已生成，待补充口径'
      },
      generatedDocs: [
        { title: '综合性底稿生成', status: '已生成', desc: '项目基本情况、重要性、风险评估', progress: 100 },
        { title: '实质性底稿生成', status: '已生成', desc: '货币资金、收入、往来科目程序', progress: 100 },
        { title: 'TB 生成', status: '已生成', desc: '科目余额表映射与试算平衡', progress: 100 }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [planItems, setPlanItems] = useState([
    { id: 1, text: '生成初步业务活动底稿', status: '进行中' },
    { id: 2, text: '生成审计风险底稿', status: '待办' },
    { id: 3, text: '生成程序性底稿', status: '待办' },
    { id: 4, text: '生成实质性底稿', status: '待办' },
    { id: 5, text: '生成 TB 及试算平衡', status: '待办' }
  ]);

  const [recentFiles, setRecentFiles] = useState([
    { name: '序时账.xlsx', active: true },
    { name: '科目余额表.xlsx', active: true },
    { name: '财务报表.xlsx', active: true }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: '符金雨',
      avatarText: '符',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');

    // Simulate Agent response
    setTimeout(() => {
      const agentReply: Message = {
        id: `msg-reply-${Date.now()}`,
        sender: 'agent',
        senderName: '年报审计智能体',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: `收到您补充的信息：“${currentInput}”。我已将该参数导入大模型合规及分析链条：\n- **审计范围**已确定为主校区及附属单位；\n- **重要性水平**已设定为营业收入的 0.5%；\n- 正在执行**穿行测试**，并将数据写入交付物底稿中。`
      };

      setMessages(prev => [...prev, agentReply]);

      // Complete some plan items
      setPlanItems(prev => {
        return prev.map(item => {
          if (item.id === 1) return { ...item, status: '已完成' };
          if (item.id === 2) return { ...item, status: '进行中' };
          return item;
        });
      });
    }, 1500);
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

  const createProjectSeed = (agentMessage: Message): ProjectSeedPayload => {
    const lastUserMessage = [...messages].reverse().find(message => message.sender === 'user');
    const messageFiles = messages.flatMap(message => message.files || []);
    const projectTarget = agentMessage.identifiedInfo?.target || '上海大学 2025 年度年报审计';

    return {
      sourceAgentName: '年报审计智能体',
      projectName: `${projectTarget}_智能体底稿项目`,
      userInstruction: lastUserMessage?.content || '我要做一个上海大学的2025年年报审计，导入以下财务信息：',
      assistantSummary: agentMessage.content,
      files: messageFiles,
      generatedDocs: agentMessage.generatedDocs || [],
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f6fa] select-none" id="annual-report-view">
      {/* 1. Header */}
      <header className="h-14 border-b border-[#dfe2ed] bg-white px-5 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-black text-gray-800 tracking-tight">上海大学 2025 年报审计</h1>
          <span className="text-[10px] bg-blue-50 text-[#0052d9] font-bold px-2 py-0.5 rounded-full border border-blue-100/50">
            年报审计智能体
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* File location button */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f6fa] hover:bg-[#ebedf3] border border-gray-200 text-[11px] text-gray-600 font-bold rounded-lg transition-colors cursor-pointer">
            <span className="w-4 h-4 bg-[#0052d9] rounded flex items-center justify-center text-[10px] text-white font-black">F</span>
            <span>打开位置 File</span>
            <span className="text-gray-400 font-normal">▼</span>
          </button>

          {/* Icon control buttons */}
          <div className="h-7 w-px bg-gray-200 mx-1" />
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
            <List className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
            <Columns className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-[#0052d9] bg-blue-50 rounded-lg cursor-pointer">
            <Layout className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left main chat area */}
        <div className="flex-1 flex flex-col h-full relative border-r border-[#dfe2ed]">
          
          {/* Top Sticky summary bar */}
          <div className="px-5 py-2 bg-[#f4f6fa] flex justify-center shrink-0">
            <div className="bg-[#ebedf3] border border-white/60 text-[11px] text-gray-600 font-bold px-4 py-1.5 rounded-2xl shadow-sm flex items-center gap-2">
              <span className="bg-[#0052d9]/10 text-[#0052d9] px-1.5 py-0.5 rounded text-[9px] font-black uppercase">置顶摘要</span>
              <span>已导入 3 份财务数据，正在生成年报审计底稿包</span>
            </div>
          </div>

          {/* Chat scrolling log */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {msg.sender === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 text-xs font-bold border border-white shrink-0 shadow-sm">
                    {msg.avatarText}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 border border-[#dbe1ff] flex items-center justify-center text-[#0052d9] font-black text-xs shrink-0 shadow-sm">
                    审
                  </div>
                )}

                {/* Bubble message content */}
                <div className="space-y-1.5">
                  <div className={`flex items-center gap-2 text-[10px] text-gray-400 font-bold ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                    <span>{msg.senderName}</span>
                    <span>{msg.time}</span>
                    {msg.sender === 'agent' && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200/50 px-1 py-0.1 rounded font-bold">
                        已调用
                      </span>
                    )}
                  </div>

                  <div className={`p-4 rounded-2xl shadow-sm border ${
                    msg.sender === 'user' 
                      ? 'bg-white border-gray-100 rounded-tr-none text-xs text-gray-800 font-medium' 
                      : 'bg-white border-[#e5e9f5] rounded-tl-none space-y-3.5'
                  }`}>
                    {/* Plain Text Message */}
                    <p className="text-xs leading-relaxed text-gray-700 whitespace-pre-line font-medium">{msg.content}</p>

                    {/* Files if user uploaded */}
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

                    {/* Identified Info Box for Agent */}
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

                    {/* Generated Draft Cards */}
                    {msg.generatedDocs && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-extrabold text-gray-500 tracking-wide">生成如下底稿内容</p>
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
                              {/* Small progress bar */}
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

                    {/* Warning text box (matching screenshot layout) */}
                    {msg.generatedDocs && (
                      <div className="bg-amber-50 border border-amber-200/30 text-[10px] text-amber-800 font-bold p-3 rounded-xl flex items-center gap-2">
                        <span>💡</span>
                        <span>请继续补充项目信息：审计范围、重要性水平、底稿模板口径、项目联系人。</span>
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
                          className="shrink-0 px-3.5 py-2 rounded-xl text-[10px] font-black bg-[#0052d9] hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>新建项目</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Custom Chat Input Bar */}
          <div className="p-4 bg-[#f4f6fa] shrink-0 border-t border-[#dfe2ed]">
            <div className="bg-white border border-[#c9cedd] rounded-2xl p-2.5 flex items-center gap-2.5 shadow-sm focus-within:border-[#0052d9] focus-within:ring-2 focus-within:ring-[#0052d9]/5 transition-all">
              <button className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors shrink-0 cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>

              <span className="text-[10px] bg-blue-50 text-[#0052d9] border border-blue-100/50 font-bold px-2.5 py-1 rounded-full shrink-0">
                年报审计智能体
              </span>

              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="请补充：审计范围、重要性水平、底稿模板口径、项目联系人..."
                className="flex-1 bg-transparent border-none outline-none text-xs font-semibold text-gray-700 placeholder-gray-300 px-1"
              />

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-400 font-bold bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                  Agent
                </span>
                <button 
                  onClick={handleSend}
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

        {/* Right side environmental panel (25-30% of space) */}
        <div className="w-72 bg-white flex flex-col h-full overflow-y-auto border-l border-[#dfe2ed]/10 p-5 space-y-6 custom-scrollbar shrink-0 shadow-inner">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0">
            <h2 className="text-xs font-black text-gray-800 tracking-wider">环境信息</h2>
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Current Agent Info */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">当前 Agent</span>
            <div className="flex">
              <span className="text-[10px] bg-blue-50 text-[#0052d9] font-black px-2.5 py-1 rounded-md border border-blue-100/50 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0052d9] rounded-full animate-pulse" />
                年报审计智能体
              </span>
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">项目</span>
            <p className="text-xs font-black text-gray-800">上海大学 2025 年报审计</p>
          </div>

          {/* Imported Data Sources */}
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

          {/* Plan/Milestone Checklist */}
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
                      item.status === '已完成' ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}>
                      {item.text}
                    </span>
                  </div>
                  <div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.status === '已完成' 
                        ? 'bg-emerald-50 text-emerald-600' 
                        : item.status === '进行中' 
                          ? 'bg-blue-50 text-[#0052d9]' 
                          : 'bg-gray-50 text-gray-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Section */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">交付物</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                综合性底稿
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
              <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                实质性底稿
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
              <span className="text-[9px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                TB
                <ArrowUpRight className="w-2.5 h-2.5" />
              </span>
              <span className="text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/40 px-2 py-0.5 rounded-md">
                待复核
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
