import React, { useState } from 'react';
import { WorkingPaperItem, ChatMessage } from '../types';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Paperclip,
  History,
  AlertCircle,
  Bot,
  Send,
  Download,
  Sparkles,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
} from 'lucide-react';

interface WorkingPaperDetailProps {
  paper: WorkingPaperItem;
  onBack: () => void;
  onUpdatePaper: (updated: WorkingPaperItem) => void;
}

export const WorkingPaperDetail: React.FC<WorkingPaperDetailProps> = ({
  paper,
  onBack,
  onUpdatePaper,
}) => {
  const [activeTab, setActiveTab] = useState<
    'content' | 'attachments' | 'review' | 'doubts'
  >('content');

  // AI Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '您好！我是 RoadwiseLab 审计 AI 助手。已为您对《AP-AR-001 应收账款函证程序》完成自动化扫描。\n发现关注项：\n1. 未回函金额 200,000 元（占 1.6%），建议补充期后回款替代测试；\n2. 客户 A 回函差异 50,000 元，需追查日后回款账单。',
      timestamp: '10:30',
    },
  ]);

  const [inputChat, setInputChat] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string[]>([
    '未回函金额 200,000 元（占发函总额 1.60%），建议补充替代测试程序，如检查期后凭证与银行回款单。',
    '回函不符金额 50,000 元（占发函总额 0.40%），建议进一步追查差异原因，确认是否属于截止性错报。',
    '发函覆盖率达到 100%，回函率 98.40%，审计证据收集充分。',
  ]);

  // Edit instruction state
  const [isEditingInstruction, setIsEditingInstruction] = useState(false);
  const [instructionText, setInstructionText] = useState(paper.contentInstruction);

  // New doubt state
  const [newDoubtText, setNewDoubtText] = useState('');

  // Handle AI Chat Submit
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputChat.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputChat,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    const textToSend = inputChat;
    setInputChat('');
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/ai/audit-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: {
            paperCode: paper.code,
            paperName: paper.name,
            results: paper.executionResults,
          },
        }),
      });

      const data = await res.json();
      const replyText = data.reply || '分析完成。';

      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: replyText,
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '针对未回函的 200,000 元，标准替代程序为：1. 检查期后银行收款对账单；2. 抽查销售发票与出库单凭证；3. 向管理层了解发货验收记录。',
          timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Trigger Gemini Auto Re-Analysis
  const handleReAnalyze = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-working-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.name,
          code: paper.code,
          author: paper.author,
          content: paper.contentInstruction,
          executionResults: paper.executionResults,
        }),
      });

      const data = await res.json();
      if (data.analysis && Array.isArray(data.analysis)) {
        setAiAnalysis(data.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const saveInstruction = () => {
    setIsEditingInstruction(false);
    onUpdatePaper({ ...paper, contentInstruction: instructionText });
  };

  const handleAddDoubt = () => {
    if (!newDoubtText.trim()) return;
    const updatedDoubts = [...(paper.doubts || []), newDoubtText];
    onUpdatePaper({ ...paper, doubts: updatedDoubts });
    setNewDoubtText('');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden font-sans bg-[#f9f9ff]">
      {/* Top Breadcrumb & Paper Header */}
      <div className="bg-white border-b border-[#c5c6cc] p-5 shadow-xs flex-shrink-0">
        <button
          onClick={onBack}
          className="text-[#1890ff] hover:underline text-[9px] font-semibold flex items-center mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 返回底稿列表
        </button>

        <div className="flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-[15px] font-bold text-[#1b1b1e]">
                {paper.code} {paper.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] font-bold bg-[#f6ffed] text-[#52c41a] border border-[#52c41a]/20">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {paper.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center space-x-6 text-[9px] text-[#75777c] mt-2">
              <span>编制人：<strong className="text-[#44474c]">{paper.author}</strong></span>
              <span>编制日期：<strong className="text-[#44474c]">{paper.date}</strong></span>
              <span>复核人：<strong className="text-[#44474c]">{paper.reviewer}</strong></span>
              <span>复核日期：<strong className="text-[#44474c]">{paper.reviewDate}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[9px]">
            <button
              onClick={() => alert('已导出当前底稿 PDF 标准文档')}
              className="px-3 py-1.5 border border-[#c5c6cc] rounded bg-white hover:bg-gray-50 text-[#44474c] font-medium flex items-center shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> 导出 PDF
            </button>
            <button
              onClick={() => alert('已将底稿链接复制到剪贴板')}
              className="px-3 py-1.5 bg-[#1890ff] text-white rounded font-medium hover:bg-blue-600 flex items-center shadow-xs cursor-pointer"
            >
              分享 / 导出
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid Area */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Area (Tabs & Paper Body) */}
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#c5c6cc] shadow-xs overflow-hidden">
          {/* Tabs Bar */}
          <div className="flex border-b border-[#c5c6cc] bg-[#f9f9ff] text-[9px] font-semibold">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-5 py-3 flex items-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'border-[#1890ff] text-[#1890ff] bg-white'
                  : 'border-transparent text-[#75777c] hover:text-[#1b1b1e]'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" /> 底稿内容
            </button>

            <button
              onClick={() => setActiveTab('attachments')}
              className={`px-5 py-3 flex items-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'attachments'
                  ? 'border-[#1890ff] text-[#1890ff] bg-white'
                  : 'border-transparent text-[#75777c] hover:text-[#1b1b1e]'
              }`}
            >
              <Paperclip className="w-4 h-4 mr-2" /> 附件 (
              {paper.attachments ? paper.attachments.length : 0})
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`px-5 py-3 flex items-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'review'
                  ? 'border-[#1890ff] text-[#1890ff] bg-white'
                  : 'border-transparent text-[#75777c] hover:text-[#1b1b1e]'
              }`}
            >
              <History className="w-4 h-4 mr-2" /> 复核记录 (
              {paper.reviewRecords ? paper.reviewRecords.length : 0})
            </button>

            <button
              onClick={() => setActiveTab('doubts')}
              className={`px-5 py-3 flex items-center border-b-2 transition-colors cursor-pointer ${
                activeTab === 'doubts'
                  ? 'border-[#1890ff] text-[#1890ff] bg-white'
                  : 'border-transparent text-[#75777c] hover:text-[#1b1b1e]'
              }`}
            >
              <AlertCircle className="w-4 h-4 mr-2" /> 疑点补充 (
              {paper.doubts ? paper.doubts.length : 0})
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[10px]">
            {activeTab === 'content' && (
              <>
                {/* Section 1: 程序说明 */}
                <div className="p-4 bg-[#f9f9ff] border border-[#c5c6cc] rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[10px] text-[#1b1b1e]">程序说明</h3>
                    {!isEditingInstruction ? (
                      <button
                        onClick={() => setIsEditingInstruction(true)}
                        className="text-[#1890ff] hover:underline text-[9px] flex items-center cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3 mr-1" /> 编辑
                      </button>
                    ) : (
                      <button
                        onClick={saveInstruction}
                        className="text-green-600 hover:underline text-[9px] font-bold cursor-pointer"
                      >
                        保存说明
                      </button>
                    )}
                  </div>

                  {!isEditingInstruction ? (
                    <p className="text-[9px] text-[#44474c] leading-relaxed">
                      {paper.contentInstruction}
                    </p>
                  ) : (
                    <textarea
                      rows={3}
                      value={instructionText}
                      onChange={(e) => setInstructionText(e.target.value)}
                      className="w-full text-[9px] border border-[#1890ff] rounded p-2 focus:outline-none bg-white"
                    />
                  )}
                </div>

                {/* Section 2: 执行结果数据表格 */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-[10px] text-[#1b1b1e]">执行结果与数据分析表</h3>
                    <span className="text-[9px] text-[#75777c]">货币单位：人民币 (元)</span>
                  </div>

                  <div className="border border-[#c5c6cc] rounded-lg overflow-hidden">
                    <table className="w-full text-left text-[9px]">
                      <thead>
                        <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c] font-semibold">
                          <th className="py-2.5 px-4">项目名称</th>
                          <th className="py-2.5 px-4 text-right">金额 (元)</th>
                          <th className="py-2.5 px-4 text-right">占比 (%)</th>
                          <th className="py-2.5 px-4 text-center">风险提示</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c5c6cc]">
                        {paper.executionResults.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-4 font-medium">{row.item}</td>
                            <td className="py-2.5 px-4 text-right tabular-nums font-semibold">
                              {row.amount.toLocaleString('zh-CN')}
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums">{row.ratio}%</td>
                            <td className="py-2.5 px-4 text-center">
                              {row.item.includes('未回函') || row.item.includes('不符') ? (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold">
                                  需关注
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold">
                                  正常
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'attachments' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="font-bold text-[10px]">底稿归档附件列表</h3>
                  <button
                    onClick={() => alert('已打开附件上传窗体')}
                    className="px-2.5 py-1 bg-[#1890ff] text-white rounded text-[9px]"
                  >
                    + 上传新附件
                  </button>
                </div>
                {paper.attachments && paper.attachments.length > 0 ? (
                  paper.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 text-[9px]"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-[#1890ff]" />
                        <div>
                          <p className="font-semibold text-[#1b1b1e]">{att.name}</p>
                          <p className="text-[10px] text-[#75777c]">
                            {att.size} | 上传人: {att.uploader} | 上传时间: {att.uploadDate}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`正在预览 ${att.name}`)}
                        className="text-[#1890ff] font-medium hover:underline"
                      >
                        在线预览
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-[#75777c]">暂无附件</p>
                )}
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[10px]">二级复核记录轨迹</h3>
                {paper.reviewRecords && paper.reviewRecords.length > 0 ? (
                  <div className="space-y-3 relative border-l-2 border-[#1890ff] pl-4">
                    {paper.reviewRecords.map((rr) => (
                      <div key={rr.id} className="p-3 bg-gray-50 rounded border text-[9px]">
                        <div className="flex justify-between font-bold text-[#1b1b1e] mb-1">
                          <span>
                            {rr.reviewer} ({rr.action})
                          </span>
                          <span className="text-[10px] text-[#75777c]">{rr.date}</span>
                        </div>
                        <p className="text-[#44474c]">{rr.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-[#75777c]">暂无复核记录</p>
                )}
              </div>
            )}

            {activeTab === 'doubts' && (
              <div className="space-y-4">
                <h3 className="font-bold text-[10px]">审计疑点与后续跟进</h3>
                <div className="space-y-2">
                  {(paper.doubts || []).map((doubt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-amber-50 border border-amber-200 rounded text-[9px] text-[#1b1b1e] flex justify-between items-center"
                    >
                      <p>• {doubt}</p>
                      <button
                        onClick={() => {
                          const updated = (paper.doubts || []).filter((_, i) => i !== idx);
                          onUpdatePaper({ ...paper, doubts: updated });
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="新增审计疑点或跟进备注..."
                      value={newDoubtText}
                      onChange={(e) => setNewDoubtText(e.target.value)}
                      className="flex-1 border rounded p-2 text-[9px] focus:ring-[#1890ff]"
                    />
                    <button
                      onClick={handleAddDoubt}
                      className="px-3 py-1.5 bg-[#1890ff] text-white rounded text-[9px] font-semibold"
                    >
                      添加疑点
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Area (Metadata + Interactive AI Audit Assistant) */}
        <div className="w-80 flex flex-col space-y-4 flex-shrink-0">
          {/* Side Card 1: 底稿元信息 */}
          <div className="bg-white p-4 rounded-lg border border-[#c5c6cc] shadow-xs text-[9px] space-y-2">
            <h3 className="font-bold text-[10px] text-[#1b1b1e] border-b pb-2 mb-2">底稿基本属性</h3>
            <div className="flex justify-between">
              <span className="text-[#75777c]">状态</span>
              <span className="font-semibold text-green-600">{paper.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#75777c]">重要程度</span>
              <span className="font-semibold text-[#1890ff]">{paper.importance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#75777c]">关联科目</span>
              <span className="font-semibold">{paper.associatedAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#75777c]">索引号</span>
              <span className="font-mono text-[#1b1b1e]">{paper.indexCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#75777c]">类型</span>
              <span>{paper.type}</span>
            </div>
          </div>

          {/* Side Card 2: AI 审计助手 (Gemini Powered) */}
          <div className="flex-1 bg-white rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col overflow-hidden">
            {/* AI Assistant Header */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-[#c5c6cc] flex justify-between items-center">
              <div className="flex items-center space-x-1.5 text-[9px] font-bold text-[#1890ff]">
                <Sparkles className="w-4 h-4 text-[#1890ff]" />
                <span>AI 智能风险检测</span>
              </div>
              <button
                onClick={handleReAnalyze}
                disabled={isAiLoading}
                className="text-[11px] text-[#1890ff] hover:underline flex items-center cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isAiLoading ? 'animate-spin' : ''}`} />
                重新分析
              </button>
            </div>

            {/* AI Audit Observations */}
            <div className="p-3 bg-blue-50/40 border-b border-[#c5c6cc] text-[11px] space-y-1.5">
              <p className="font-bold text-[#1b1b1e]">智能扫描建议：</p>
              {aiAnalysis.map((obs, i) => (
                <div key={i} className="flex items-start text-[#44474c] leading-tight">
                  <span className="text-[#1890ff] font-bold mr-1">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>

            {/* Interactive Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-[9px] bg-gray-50/50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2.5 rounded-lg leading-relaxed shadow-2xs ${
                      msg.role === 'user'
                        ? 'bg-[#1890ff] text-white rounded-tr-none'
                        : 'bg-white border border-[#c5c6cc] text-[#1b1b1e] rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 opacity-70 text-[9px]">
                      <span className="font-bold flex items-center">
                        {msg.role === 'assistant' && <Bot className="w-3 h-3 mr-1 text-[#1890ff]" />}
                        {msg.role === 'user' ? '提问' : 'RoadwiseLab AI'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start text-[9px] text-[#75777c] animate-pulse">
                  <Bot className="w-4 h-4 mr-1 text-[#1890ff]" /> AI 正在分析准则与底稿数据...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-2 border-t border-[#c5c6cc] bg-white flex space-x-1.5">
              <input
                type="text"
                placeholder="向 AI 咨询审计疑点或替代程序..."
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                className="flex-1 text-[9px] border border-[#c5c6cc] rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1890ff]"
              />
              <button
                type="submit"
                disabled={isAiLoading || !inputChat.trim()}
                className="bg-[#1890ff] text-white p-1.5 rounded hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
