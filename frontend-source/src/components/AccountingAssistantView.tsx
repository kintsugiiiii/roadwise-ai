import React, { useState, useRef, KeyboardEvent } from 'react';
import { 
  Paperclip, 
  Database, 
  BookOpen,
  Sparkles,
  Mic,
  ArrowUp,
  FolderOpen,
  MessageSquare,
  RefreshCw,
  Columns,
  ChevronDown,
  FileText,
  FileCode,
  FileSpreadsheet,
  Check,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { QuickPrompt, RecentFile, Project } from '../types';
import { initialQuickPrompts, initialRecentFiles } from '../data';

interface AccountingAssistantViewProps {
  projects: Project[];
  recentFiles: RecentFile[];
  onUploadFile?: (file: any) => void;
}

export default function AccountingAssistantView({
  projects,
  recentFiles,
}: AccountingAssistantViewProps) {
  const [queryText, setQueryText] = useState('');
  const [selectedModel, setSelectedModel] = useState('Qwen3.7 Plus');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedProjectContext, setSelectedProjectContext] = useState('wls测试3');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models = ['Qwen3.7 Plus', 'DeepSeek-R1', 'GPT-4o', 'Gemini 2.5 Pro'];

  const handlePromptClick = (prompt: QuickPrompt) => {
    setQueryText(`我想了解关于“${prompt.title}”的相关信息。`);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    if (!queryText.trim()) return;
    
    const userMsg = queryText;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setQueryText('');
    setLoadingResponse(true);

    // Simulate smart accountant answer
    setTimeout(() => {
      let aiResponse = '';
      if (userMsg.includes('财务报表分析')) {
        aiResponse = `分析报告已为您生成！

基于当前关联的 **${selectedProjectContext}** 项目的最新资产负债表与利润表：
1. **盈利能力评估**：本期净利润率环比上升了 2.4%，主要得益于运营费用的精细化控制。
2. **周转效率分析**：应收账款周转天数（DSO）从 42 天缩短至 38 天，说明催收力度和客户信用政策收效显著。
3. **潜在合规风险**：研发费用加计扣除的底稿凭证仍存在两项合规性缺口，已通过“报告助理”将补充任务派发给吴立松。

建议立即点击右侧的《产品需求文档 V2.1.docx》并上传对应的研发费用凭证，以便我们完成最终审计一审。`;
      } else if (userMsg.includes('税务合规')) {
        aiResponse = `您好！已为您调取国家税务总局关于高新技术企业（GR2025）的最新加计扣除政策。

针对您的项目，重点关注以下三项合规指标：
- **研发人员占比**：当前项目研发人员占比为 10.4%，刚好达到 10% 的红线，建议保持人员稳定性。
- **研发费用比例**：近三年研发费用占营业收入的平均比例为 5.2%（红线 5%），存在极小的下行波动风险。
- **归集辅助账**：建议查看最近文件中的“项目排期计划表.xlsx”，核对是否有跨期人工成本被误归集到非研发科目。`;
      } else {
        aiResponse = `您好！我是您的 **RoadwiseLab 助手**。

关于您咨询的财务问题，我已经结合当前项目 **${selectedProjectContext}** 的上下文进行了审计标准和数据准则比对：
- **当前执行标准**：企业会计准则第 14 号——收入（2025版）。
- **核对路径**：最近文件中的项目报告以及系统数据库底稿。

请问需要我为您编制对应的调整分录草稿，还是直接导出审计底稿核对表？`;
      }

      setChatHistory(prev => [...prev, { role: 'assistant', text: aiResponse }]);
      setLoadingResponse(false);
    }, 1500);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Middle Interactive Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header toolbar */}
        <header className="h-16 flex items-center justify-end px-6 bg-white/80 backdrop-blur-md border-b border-[#dfe2ed] shrink-0 z-40">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="刷新对话">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer" title="分栏显示">
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 custom-scrollbar">
          {chatHistory.length === 0 ? (
            /* Empty state (The Mascot Landing Design from HTML 3) */
            <div className="max-w-3xl mx-auto space-y-10 py-6">
              {/* Mascot header */}
              <div className="text-center space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative inline-block select-none">
                  <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md border border-gray-100">
                    <img 
                      className="w-full h-full rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4IjE57n9E371h0360v-es8IXzXnWAfuHrTU4MsIS7RVmuBm_JpVmdPiftLIvlcBGQfa3AIO8ah3NNXZEhCI-vwKfJf2UEk2ERVhLy62axYgAMM5zU4MhRbAlojM03vpJ77yLsPi2xctEK0u5uG6DqeY0nX1naoPcTIf9cNUVJNAL0FornesaR94v7QKNnKR5VQNvUkdBpR1t_tgk5lCfjWy283bLAgNe-i_-6rx3IndT2n29Ka-X4GAm2kKHmrcbyVTFZ_CwPkwM"
                      alt="Expert Avatar"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#0052d9]">
                    <span>RoadwiseLab</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </h2>
                  <p className="text-xs text-gray-400 font-bold tracking-wider">专业的财务分析与会计咨询助手</p>
                </div>
              </div>
            </div>
          ) : (
            /* Active chat logs */
            <div className="max-w-3xl mx-auto space-y-6">
              {chatHistory.map((chat, idx) => (
                <div 
                  key={idx}
                  className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex items-start gap-3.5 max-w-[85%] ${chat.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {chat.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-[#f1f3ff] flex items-center justify-center text-[#0052d9] text-xs font-black shadow-sm border border-white">
                        符
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-gray-100 shadow-sm shrink-0">
                        <img 
                          className="w-full h-full rounded-full object-cover" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4IjE57n9E371h0360v-es8IXzXnWAfuHrTU4MsIS7RVmuBm_JpVmdPiftLIvlcBGQfa3AIO8ah3NNXZEhCI-vwKfJf2UEk2ERVhLy62axYgAMM5zU4MhRbAlojM03vpJ77yLsPi2xctEK0u5uG6DqeY0nX1naoPcTIf9cNUVJNAL0FornesaR94v7QKNnKR5VQNvUkdBpR1t_tgk5lCfjWy283bLAgNe-i_-6rx3IndT2n29Ka-X4GAm2kKHmrcbyVTFZ_CwPkwM"
                          alt="AI Expert"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Speech bubble */}
                    <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed border shadow-sm whitespace-pre-wrap ${
                      chat.role === 'user'
                        ? 'bg-white rounded-tr-none border-[#dfe2ed] text-gray-800'
                        : 'bg-[#fbfbff] rounded-tl-none border-[#dfe2ed] text-gray-800 font-medium'
                    }`}>
                      {chat.text}
                    </div>
                  </div>
                </div>
              ))}

              {loadingResponse && (
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-full bg-white p-0.5 border border-gray-100 shadow-sm shrink-0">
                    <img 
                      className="w-full h-full rounded-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4IjE57n9E371h0360v-es8IXzXnWAfuHrTU4MsIS7RVmuBm_JpVmdPiftLIvlcBGQfa3AIO8ah3NNXZEhCI-vwKfJf2UEk2ERVhLy62axYgAMM5zU4MhRbAlojM03vpJ77yLsPi2xctEK0u5uG6DqeY0nX1naoPcTIf9cNUVJNAL0FornesaR94v7QKNnKR5VQNvUkdBpR1t_tgk5lCfjWy283bLAgNe-i_-6rx3IndT2n29Ka-X4GAm2kKHmrcbyVTFZ_CwPkwM"
                      alt="AI Expert Loading"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-xs text-gray-400 font-bold">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0052d9]" />
                    <span>RoadwiseLab 正在编制分析结论...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Start Grid (Always display if history is empty) */}
          {chatHistory.length === 0 && (
            <div className="max-w-3xl mx-auto space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider px-1">快速开始</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {initialQuickPrompts.map((prompt) => (
                  <div 
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt)}
                    className="glass-card rounded-2xl flex flex-col cursor-pointer hover:scale-[1.01] hover:border-blue-500/10 active:scale-[0.99]"
                  >
                    <div className="h-9 w-full rounded-t-2xl bg-gradient-to-r from-[#fbfbff] to-white border-b border-gray-100/30" />
                    <div className="p-3.5 space-y-1 flex-1">
                      <h4 className="text-xs font-black text-gray-800">{prompt.title}</h4>
                      <p className="text-[10px] text-gray-400 leading-normal font-bold">{prompt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Floating Input Box container */}
        <div className="p-6 pt-0 max-w-3xl w-full mx-auto shrink-0 space-y-4">
          <div className="glass-card rounded-[24px] p-2 border-blue-500/5 shadow-xl bg-white relative">
            <div className="p-3">
              <textarea 
                ref={textareaRef}
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full border-none focus:ring-0 bg-transparent text-xs leading-relaxed resize-none h-20 outline-none placeholder-gray-400 custom-scrollbar font-semibold text-[#181c23]" 
                placeholder="请输入您的财务问题或咨询需求..."
              />
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between p-2 border-t border-gray-100/80 shrink-0">
              <div className="flex items-center gap-1">
                <button className="p-2 text-gray-400 hover:text-[#0052d9] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" title="添加附件">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#0052d9] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" title="数据源">
                  <Database className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#0052d9] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" title="知识库">
                  <BookOpen className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#0052d9] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" title="智能提问">
                  <Sparkles className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-[#0052d9] rounded-xl hover:bg-gray-50 transition-colors cursor-pointer" title="语音提问">
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {/* Model selection and send button */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div 
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 text-[10px] bg-white font-black text-gray-700 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0" />
                    <span>{selectedModel}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                  </div>

                  {showModelDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 font-semibold text-xs text-gray-700">
                      {models.map((model) => (
                        <div 
                          key={model}
                          onClick={() => {
                            setSelectedModel(model);
                            setShowModelDropdown(false);
                          }}
                          className={`px-3 py-2 hover:bg-[#f1f3ff] hover:text-[#0052d9] cursor-pointer flex items-center justify-between ${selectedModel === model ? 'text-[#0052d9] font-bold bg-[#f1f3ff]/50' : ''}`}
                        >
                          <span>{model}</span>
                          {selectedModel === model && <Check className="w-3.5 h-3.5 text-[#0052d9]" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleSend}
                  disabled={!queryText.trim()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0 ${
                    queryText.trim() 
                      ? 'bg-[#0052d9] text-white hover:bg-blue-700 shadow-blue-500/10' 
                      : 'bg-[#ebedf9] text-gray-400'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Context Selectors bar below the box */}
          <div className="flex items-center justify-start gap-5 px-2.5">
            {/* Project Context selector */}
            <div className="relative">
              <div 
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-1.5 text-gray-400 hover:text-[#0052d9] text-[10px] font-black cursor-pointer transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-sky-500" />
                <span>选择当前项目: {selectedProjectContext}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>

              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1 text-xs text-gray-600 font-semibold">
                  {projects.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectContext(p.name);
                        setShowProjectDropdown(false);
                      }}
                      className={`px-3 py-2 hover:bg-[#f8f9ff] cursor-pointer ${selectedProjectContext === p.name ? 'text-[#0052d9] font-extrabold bg-[#f1f3ff]/30' : ''}`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Context feed */}
            <div className="flex items-center gap-1.5 text-gray-400 hover:text-[#0052d9] text-[10px] font-black cursor-pointer transition-colors">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>选择群聊记录</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side Recent Files panel */}
      <aside className="w-72 border-l border-[#dfe2ed] bg-[#fbfbff] shrink-0 p-4 space-y-4 overflow-y-auto custom-scrollbar select-none">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-800">最近文件</h3>
          <button className="text-[#0052d9] text-[10px] font-bold hover:underline cursor-pointer">查看全部</button>
        </div>

        <div className="space-y-3">
          {recentFiles.map((file) => (
            <div 
              key={file.id}
              className="flex items-center gap-3 p-3 bg-white border border-[#dfe2ed]/50 rounded-2xl hover:shadow-md transition-all cursor-pointer group"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                file.type === 'docx' 
                  ? 'bg-blue-50 border-blue-100/50 text-[#0052d9]' 
                  : file.type === 'xlsx'
                    ? 'bg-emerald-50 border-emerald-100/50 text-emerald-700'
                    : 'bg-rose-50 border-rose-100/50 text-rose-700'
              }`}>
                {file.type === 'docx' ? (
                  <FileText className="w-5 h-5" />
                ) : file.type === 'xlsx' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <FileCode className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-gray-800 truncate group-hover:text-[#0052d9] transition-colors">{file.name}</p>
                <p className="text-[9px] text-gray-400 font-bold mt-0.5">{file.time}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
