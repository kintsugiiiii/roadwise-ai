import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Bot, 
  ClipboardCheck, 
  Plus, 
  Hash, 
  RotateCw, 
  ChevronRight, 
  Paperclip, 
  Smile, 
  Send, 
  CheckCircle, 
  Download, 
  UserPlus, 
  FileText, 
  MoreHorizontal,
  ChevronDown,
  Loader2,
  Check,
  Search,
  Image,
  Video,
  Link,
  ExternalLink,
  FileSpreadsheet,
  ChevronLeft,
  Calendar,
  Wifi,
} from 'lucide-react';
import { Project } from '../types';

interface ProjectCollaborationViewProps {
  project: Project;
  onBackToWorkbench: () => void;
  onSendMessage: (projectId: string, content: string) => void;
}

export default function ProjectCollaborationView({
  project,
  onBackToWorkbench,
  onSendMessage,
}: ProjectCollaborationViewProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [collapsedBoards, setCollapsedBoards] = useState<Record<string, boolean>>({});

  // Recent files section state
  const [fileSearch, setFileSearch] = useState('');
  const [recentFileTab, setRecentFileTab] = useState<'media' | 'file' | 'link' | 'date'>('media');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // June (0-indexed, so 5 is June)

  const fileItems = [
    { id: 'rf-1', name: '审计进度汇报表_20250628.xlsx', type: 'file', size: '2.4 MB', time: '11:22', dateGroup: '今天', extension: 'xlsx', date: '2026-06-30' },
    { id: 'rf-2', name: '产品设计效果图_一审确认.png', type: 'image', size: '1.8 MB', time: '10:15', dateGroup: '今天', extension: 'png', date: '2026-06-30' },
    { id: 'rf-3', name: '企业审计项目大纲.docx', type: 'file', size: '850 KB', time: '15:30', dateGroup: '昨天', extension: 'docx', date: '2026-06-29' },
    { id: 'rf-4', name: '产品需求文档 V2.1.docx', type: 'file', size: '1.2 MB', time: '14:30', dateGroup: '昨天', extension: 'docx', date: '2026-06-29' },
    { id: 'rf-5', name: '华安云审计工作台分享链接', type: 'link', time: '09:12', dateGroup: '昨天', linkUrl: 'https://audit.huaan.com/wls3-share', date: '2026-06-29' },
    { id: 'rf-6', name: '底稿归集培训演示视频.mp4', type: 'video', size: '15.4 MB', time: '16:00', dateGroup: '更早', extension: 'mp4', date: '2026-06-27' },
    { id: 'rf-7', name: '测试环境数据库指引文档.pdf', type: 'file', size: '3.1 MB', time: '10:00', dateGroup: '更早', extension: 'pdf', date: '2026-06-25' },
    { id: 'rf-8', name: '业务合规管理要求 Confluence', type: 'link', time: '11:30', dateGroup: '更早', linkUrl: 'https://confluence.huaan.com/compliance-rules', date: '2026-06-23' },
  ];

  const filteredFiles = fileItems.filter(f => 
    f.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
    (f.linkUrl && f.linkUrl.toLowerCase().includes(fileSearch.toLowerCase()))
  );

  const renderFileRow = (f: any) => {
    const isLink = f.type === 'link';
    return (
      <div 
        key={f.id}
        onClick={() => {
          if (isLink && f.linkUrl) {
            window.open(f.linkUrl, '_blank');
          } else {
            handleDownload(f.name);
          }
        }}
        className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 border border-gray-100/50 rounded-lg transition-all cursor-pointer group bg-white"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
            f.type === 'image' 
              ? 'bg-amber-50 text-amber-600' 
              : f.type === 'video'
                ? 'bg-purple-50 text-purple-600'
                : f.type === 'link'
                  ? 'bg-sky-50 text-sky-600'
                  : f.extension === 'xlsx'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600'
          }`}>
            {f.type === 'image' ? (
              <Image className="w-3 h-3" />
            ) : f.type === 'video' ? (
              <Video className="w-3 h-3" />
            ) : f.type === 'link' ? (
              <Link className="w-3 h-3" />
            ) : f.extension === 'xlsx' ? (
              <FileSpreadsheet className="w-3 h-3" />
            ) : (
              <FileText className="w-3 h-3" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-700 truncate group-hover:text-[#0052d9] transition-colors">
              {f.name}
            </p>
            <p className="text-[8px] text-gray-400 font-bold leading-tight">
              {isLink ? '点击访问链接' : `${f.size || ''} • ${f.time}`}
            </p>
          </div>
        </div>
        {isLink ? (
          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-sky-500 shrink-0" />
        ) : (
          <Download className="w-3 h-3 text-gray-300 group-hover:text-[#0052d9] shrink-0" />
        )}
      </div>
    );
  };

  // Calendar helpers
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    return day === 0 ? 6 : day - 1; // Monday = 0
  };

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDayIndex = getFirstDayOfMonth(calendarYear, calendarMonth);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const dateHasFiles = (dateStr: string) => {
    return fileItems.some(f => f.date === dateStr);
  };

  const renderRecentFiles = () => {
    let list = filteredFiles;
    if (recentFileTab === 'media') {
      list = filteredFiles.filter(f => f.type === 'image' || f.type === 'video');
    } else if (recentFileTab === 'file') {
      list = filteredFiles.filter(f => f.type === 'file');
    } else if (recentFileTab === 'link') {
      list = filteredFiles.filter(f => f.type === 'link');
    }

    if (recentFileTab === 'date') {
      // Filter list based on selected calendar date
      const displayList = selectedCalendarDate 
        ? filteredFiles.filter(f => f.date === selectedCalendarDate)
        : filteredFiles;

      // Group displayList by date
      const groups: { [key: string]: typeof fileItems } = {};
      displayList.forEach(f => {
        const key = f.date || '其他';
        if (!groups[key]) groups[key] = [];
        groups[key].push(f);
      });

      return (
        <div className="space-y-3.5">
          {/* Calendar style widget */}
          <div className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100/50 space-y-2 select-none">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#0052d9]" />
                选择日期
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-500" />
                </button>
                <span className="text-[10px] font-black text-gray-700 min-w-[64px] text-center">
                  {calendarYear}年 {calendarMonth + 1}月
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-white rounded-md border border-transparent hover:border-gray-200 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-[8px] text-gray-400 font-extrabold text-center">
              {['一', '二', '三', '四', '五', '六', '日'].map(w => (
                <div key={w}>{w}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-center">
              {calendarDays.map((d, idx) => {
                if (d === null) return <div key={`empty-${idx}`} />;
                
                const dayStr = String(d).padStart(2, '0');
                const monthStr = String(calendarMonth + 1).padStart(2, '0');
                const fullDate = `${calendarYear}-${monthStr}-${dayStr}`;
                const hasFiles = dateHasFiles(fullDate);
                const isSelected = selectedCalendarDate === fullDate;
                const isToday = fullDate === '2026-06-30'; // Hardcoded current local time matches June 30

                return (
                  <button
                    key={`day-${d}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCalendarDate(null);
                      } else {
                        setSelectedCalendarDate(fullDate);
                      }
                    }}
                    className={`h-6 w-full rounded-md flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0052d9] text-white shadow-xs font-black'
                        : hasFiles
                          ? 'bg-blue-50/80 text-[#0052d9] border border-blue-100/50 hover:bg-blue-100/60 font-black'
                          : isToday
                            ? 'border border-dashed border-[#0052d9] text-gray-700 hover:bg-gray-100'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <span>{d}</span>
                    {hasFiles && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#0052d9]/60" />
                    )}
                    {isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedCalendarDate && (
              <div className="flex items-center justify-between text-[8px] bg-blue-50/50 text-[#0052d9] font-bold px-2.5 py-1.5 rounded-lg border border-blue-100/50">
                <span>已筛选日期: {selectedCalendarDate}</span>
                <button 
                  onClick={() => setSelectedCalendarDate(null)}
                  className="hover:underline text-[#0052d9] cursor-pointer"
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>

          {/* Grouped file view under the calendar */}
          {Object.keys(groups).length === 0 ? (
            <div className="text-center py-4 text-[10px] text-gray-400 font-bold select-none">
              该日期无相关文件
            </div>
          ) : (
            <div className="space-y-2 pr-0.5">
              {Object.entries(groups).map(([date, items]) => (
                <div key={date} className="space-y-1">
                  <div className="text-[9px] font-black text-gray-400 px-1 select-none flex items-center justify-between">
                    <span>{date}</span>
                    <span className="text-[8px] font-bold text-gray-300">({items.length}个文件)</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map(item => renderFileRow(item))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="text-center py-6 text-[10px] text-gray-400 font-bold select-none">
          无符合条件的文件
        </div>
      );
    }

    return (
      <div className="space-y-1.5">
        {list.map(f => renderFileRow(f))}
      </div>
    );
  };

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project.messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(project.id, inputText);
    setInputText('');
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownload = (fileName: string) => {
    setDownloadingFile(fileName);
    setTimeout(() => {
      setDownloadingFile(null);
      setDownloadSuccess(fileName);
      setTimeout(() => {
        setDownloadSuccess(null);
      }, 3000);
    }, 2000);
  };

  const toggleBoard = (id: string) => {
    setCollapsedBoards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Middle Chat Flow Area */}
      <main className="flex-1 flex flex-col h-full border-r border-[#dfe2ed] relative overflow-hidden bg-white/22">
        {/* Chat Main Header */}
        <header className="h-16 border-b border-[#dfe2ed] flex items-center justify-between px-6 bg-white/70 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded bg-[#ebedf9] flex items-center justify-center mr-3 text-[#003da6]">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-800 leading-tight">{project.name}</h1>
              <div className="flex items-center text-[10px] text-gray-400 font-bold mt-0.5">
                <span>群聊 · {project.membersCount + project.aiCount}人（{project.membersCount}人 + {project.aiCount} 智能体）</span>
                <span className="mx-1.5">•</span>
                <span className="text-[#0052d9]">{project.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-xl border border-emerald-100 flex items-center gap-1.5 font-bold">
              <Wifi className="w-3 h-3" />
              <span>实时已连</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
              <RotateCw className="w-4 h-4" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sub-header bar: members & active agents list */}
        <div className="px-6 py-2.5 border-b border-[#dfe2ed] bg-white/35 backdrop-blur-sm flex flex-wrap items-center justify-between shrink-0 gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">项目成员</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {project.members.slice(0, 4).map((member, idx) => (
                <div 
                  key={idx} 
                  className="w-6 h-6 rounded-full bg-slate-100 border border-white flex items-center justify-center text-gray-600 text-[10px] font-bold shadow-sm"
                  title={member.name}
                >
                  {member.avatarText}
                </div>
              ))}
              {project.membersCount > 4 && (
                <div className="w-6 h-6 rounded-full border border-white bg-gray-200/80 flex items-center justify-center text-[9px] text-gray-500 font-bold shadow-sm">
                  +{project.membersCount - 4}
                </div>
              )}
            </div>
          </div>

          {/* AI Agents indicators */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">智能体</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#dbe1ff] rounded-lg border border-blue-200/10">
                <div className="w-4 h-4 bg-[#00a3ff] rounded flex items-center justify-center text-white shrink-0">
                  <Bot className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-extrabold text-[#00174b]">华小安主控</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-[#dbe1ff] rounded-lg border border-blue-200/10">
                <div className="w-4 h-4 bg-emerald-500 rounded flex items-center justify-center text-white shrink-0">
                  <ClipboardCheck className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-extrabold text-[#00174b]">报告助理</span>
              </div>
              <button className="w-5.5 h-5.5 border border-dashed border-[#dfe2ed] text-gray-400 rounded-full flex items-center justify-center text-xs hover:border-[#0052d9] hover:text-[#0052d9] hover:bg-white transition-all cursor-pointer">
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Notifications for download triggers */}
        {downloadSuccess && (
          <div className="bg-emerald-50 border-y border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 shrink-0 font-medium relative z-10">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>文件 {downloadSuccess} 已成功下载到您的本地设备！</span>
            </div>
            <button className="text-emerald-600 hover:underline font-bold" onClick={() => setDownloadSuccess(null)}>知道了</button>
          </div>
        )}

        {/* Message Flow content area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar relative z-10">
          {project.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
              <FileText className="w-10 h-10 text-gray-300" />
              <p className="text-xs text-gray-400 font-bold">暂无对话记录。开始向智能体发布指令吧！</p>
            </div>
          ) : (
            project.messages.map((message) => {
              const isMe = message.sender.name === '符金雨';
              return (
                <div 
                  key={message.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender Name and Badge */}
                  <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse mr-10' : 'ml-10'}`}>
                    <span className="text-[10px] font-black text-gray-500">{message.sender.name}</span>
                    {message.sender.isAi && (
                      <span className="px-1.5 py-0.2 bg-[#dbe1ff] text-[#00174b] text-[8px] rounded font-extrabold">
                        {message.sender.aiRole}
                      </span>
                    )}
                    <span className="text-[8px] text-gray-400 font-bold">{message.time}</span>
                  </div>

                  {/* Bubble content */}
                  <div className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    {isMe ? (
                      <div className="w-8 h-8 rounded-full bg-[#f1f3ff] flex items-center justify-center text-[#0052d9] text-xs font-bold shadow-sm border border-white">
                        符
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 mt-0.5 bg-sky-500`}>
                        {message.sender.avatarIcon === 'Bot' ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          <ClipboardCheck className="w-4 h-4" />
                        )}
                      </div>
                    )}

                    {/* Content text */}
                    <div className="space-y-3">
                      <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                        isMe 
                          ? 'bg-white rounded-tr-none border-[#dfe2ed] text-[#181c23]' 
                          : 'bg-[#fbfbff] rounded-tl-none border-[#dfe2ed] text-[#181c23]'
                      }`}>
                        {message.content}
                      </div>

                      {/* If message holds a Custom Plan (Execution plan template) */}
                      {message.plan && (
                        <div className="bg-white border border-[#dfe2ed] rounded-2xl shadow-sm overflow-hidden max-w-[480px]">
                          <div className="px-5 py-4">
                            <div className="grid grid-cols-2 gap-5">
                              {/* Execution steps */}
                              <div className="space-y-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">执行计划</p>
                                <div className="space-y-2">
                                  {message.plan.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center text-xs text-gray-600 font-semibold">
                                      {item.status === 'done' ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mr-1.5" />
                                      ) : item.status === 'processing' ? (
                                        <Loader2 className="w-3.5 h-3.5 text-[#0052d9] animate-spin shrink-0 mr-1.5" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 mr-1.5 shrink-0" />
                                      )}
                                      <span className={item.status === 'pending' ? 'text-gray-400 font-medium' : ''}>
                                        {item.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Task Assignment */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">任务分配</p>
                                  <ChevronDown className="w-3.5 h-3.5 text-gray-300" />
                                </div>
                                <div className="space-y-2">
                                  {message.plan.assignments.map((assign, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600 font-semibold truncate pr-1">
                                        {assign.role}
                                      </span>
                                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                        assign.status === 'completed'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : assign.status === 'processing'
                                            ? 'bg-blue-50 text-blue-700 font-extrabold animate-pulse'
                                            : 'bg-gray-100 text-gray-400'
                                      }`}>
                                        {assign.status === 'completed' ? '已完成' : assign.status === 'processing' ? '处理中' : '待处理'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* If message holds a Deliverable file */}
                      {message.file && (
                        <div className="bg-white border border-[#dfe2ed] rounded-2xl shadow-sm p-4 w-[280px] lg:w-[320px]">
                          <div className="flex items-center p-2.5 border border-gray-100 rounded-xl hover:border-blue-500/20 hover:bg-blue-50/20 transition-all cursor-pointer group bg-[#fbfbff]">
                            <div className="w-9 h-9 bg-rose-50 rounded-lg flex items-center justify-center shrink-0 mr-3 text-[#ba1a1a]">
                              <FileText className="w-5 h-5 text-[#ba1a1a]" />
                            </div>
                            <div className="flex-1 min-w-0 pr-1">
                              <p className="text-xs font-black text-gray-800 truncate">{message.file.name}</p>
                              <p className="text-[9px] text-gray-400 font-bold">{message.file.size}</p>
                            </div>
                            <button 
                              onClick={() => handleDownload(message.file!.name)}
                              className="p-1.5 text-gray-400 hover:text-[#0052d9] rounded-lg hover:bg-white transition-colors cursor-pointer"
                              disabled={downloadingFile === message.file.name}
                            >
                              {downloadingFile === message.file.name ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052d9]" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <footer className="p-4 bg-white/72 backdrop-blur-md border-t border-[#dfe2ed] shrink-0 relative z-10">
          <div className="relative bg-white border border-[#dfe2ed] rounded-2xl p-2.5 shadow-inner focus-within:border-[#0052d9] focus-within:ring-2 focus-within:ring-[#0052d9]/5 transition-all">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xs py-1.5 placeholder-gray-400 resize-none h-11 custom-scrollbar outline-none font-medium text-[#181c23]" 
              placeholder="输入消息，@成员或智能体发起指令..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <div className="flex items-center justify-between mt-2 border-t border-gray-100 pt-2 shrink-0">
              <div className="flex items-center space-x-2 text-gray-400">
                <button className="p-1.5 hover:text-[#0052d9] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" title="附件">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:text-[#0052d9] rounded-lg hover:bg-gray-50 transition-colors text-xs font-bold leading-none cursor-pointer" title="提及">
                  @
                </button>
                <button className="p-1.5 hover:text-[#0052d9] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" title="表情">
                  <Smile className="w-4 h-4" />
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!inputText.trim()}
                className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
                  inputText.trim() 
                    ? 'bg-[#0052d9] text-white hover:bg-blue-700' 
                    : 'bg-[#ebedf9] text-gray-400'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </footer>
      </main>

      {/* Right Information Panels */}
      <aside className="w-80 flex flex-col p-3 gap-2 overflow-y-auto custom-scrollbar shrink-0 select-none pb-3 relative bg-white/24">
        {/* Project Kanban Card */}
        <section className="rounded-xl border border-[#dfe2ed]/60 bg-white/86 backdrop-blur-sm shadow-sm overflow-hidden shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => toggleBoard('project')}
            className="w-full header-gradient px-3 py-2 border-b border-[#dfe2ed]/60 flex items-center justify-between shrink-0 cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-[#0052d9]">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-gray-800">项目看板</span>
            </div>
            {collapsedBoards.project ? (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {!collapsedBoards.project && (
          <div className="p-2.5 space-y-1.5 bg-white/50 text-[9px] font-semibold">
            {/* Project Manager badge row */}
            <div className="flex items-start gap-1.5">
              <div className="w-12 shrink-0 py-0.5 bg-gray-100 rounded text-center text-gray-500 font-bold">
                项目经理
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex items-center gap-1 font-bold shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  创建项目
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex items-center gap-1 font-bold shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  成员同步
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex items-center gap-1 font-bold shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  底稿计划
                </span>
                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-md flex items-center gap-1 shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  报告一审
                </span>
              </div>
            </div>

            {/* Project Members badge row */}
            <div className="flex items-start gap-1.5">
              <div className="w-12 shrink-0 py-0.5 bg-gray-100 rounded text-center text-gray-500 font-bold">
                项目成员
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-blue-50 text-[#0052d9] border border-blue-100 rounded-md flex items-center gap-1 font-extrabold shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-[#0052d9] rounded-full animate-pulse"></span>
                  写底稿
                </span>
                {['写报告', '报告二审', '上传报备信息表', '申请出具', '已出具'].map((badge, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-md flex items-center gap-1 shrink-0 leading-none">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Third Reviewers Section */}
            <div className="flex items-start gap-1.5">
              <div className="w-12 shrink-0 py-0.5 bg-gray-100 rounded text-center text-gray-500 font-bold">
                三审人员
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-md flex items-center gap-1 shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  报告三审
                </span>
              </div>
            </div>

            {/* Dept Manager Section */}
            <div className="flex items-start gap-1.5">
              <div className="w-12 shrink-0 py-0.5 bg-gray-100 rounded text-center text-gray-500 font-bold">
                部门经理
              </div>
              <div className="flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-md flex items-center gap-1 shrink-0 leading-none">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  部门经理审批
                </span>
              </div>
            </div>

            {/* Back to workbench */}
            <button 
              onClick={onBackToWorkbench}
              className="w-full py-1.5 mt-0.5 bg-blue-50/50 hover:bg-[#dbe1ff] border border-blue-100/50 text-[#0052d9] text-[10px] font-bold rounded-lg transition-all cursor-pointer text-center"
            >
              回工作台处理待办
            </button>
          </div>
          )}
        </section>

        {/* Members List */}
        <section className="rounded-xl border border-[#dfe2ed]/60 bg-white/86 backdrop-blur-sm shadow-sm overflow-hidden shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => toggleBoard('members')}
            className="w-full px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-[#dfe2ed]/60 flex items-center justify-between shrink-0 cursor-pointer text-left"
          >
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              成员 <span className="text-gray-300 ml-1 font-medium">({project.members.length})</span>
            </h3>
            <span className="flex items-center gap-2">
              <span
                onClick={(e) => e.stopPropagation()}
                className="text-[#0052d9] text-[10px] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                <span>邀请成员</span>
              </span>
              {collapsedBoards.members ? (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          </button>
          {!collapsedBoards.members && (
          <div className="p-2.5 space-y-2 bg-white/50">
            {project.members.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-gray-600 text-[10px] font-black border border-white shadow-sm">
                    {member.avatarText}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-700">{member.name}</span>
                    {member.isMe && (
                      <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-[#0052d9] text-[8px] rounded font-black uppercase">
                        我
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-gray-400 font-semibold">{member.role}</span>
              </div>
            ))}
          </div>
          )}
        </section>

        {/* Recent Files Module */}
        <section className="rounded-xl border border-[#dfe2ed]/60 bg-white/86 backdrop-blur-sm shadow-sm overflow-hidden shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => toggleBoard('files')}
            className="w-full px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-[#dfe2ed]/60 flex items-center justify-between shrink-0 cursor-pointer text-left"
          >
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              最近文件
            </h3>
            {collapsedBoards.files ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
          
          {!collapsedBoards.files && (
          <div className="p-2.5 space-y-2 bg-white/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
              <input 
                type="text" 
                placeholder="搜索名称或链接..." 
                className="w-full pl-6.5 pr-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] text-gray-700 placeholder-gray-300 outline-none focus:bg-white focus:border-[#0052d9] transition-all font-semibold"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
              />
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-gray-100 p-0.5 bg-gray-50/50 rounded-lg shrink-0 select-none">
              {[
                { id: 'media', label: '图频' },
                { id: 'file', label: '文件' },
                { id: 'link', label: '链接' },
                { id: 'date', label: '日期' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRecentFileTab(tab.id as any)}
                  className={`flex-1 py-0.5 rounded-md text-[9px] font-black transition-all ${
                    recentFileTab === tab.id 
                      ? 'bg-white text-[#0052d9] shadow-xs border border-gray-100' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Files List */}
            <div className="space-y-1.5 pr-0.5">
              {renderRecentFiles()}
            </div>
          </div>
          )}
        </section>

        {/* AI Agents List */}
        <section className="rounded-xl border border-[#dfe2ed]/60 bg-white/86 backdrop-blur-sm shadow-sm overflow-hidden shrink-0 relative z-10">
          <button
            type="button"
            onClick={() => toggleBoard('agents')}
            className="w-full px-3 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-[#dfe2ed]/60 flex items-center justify-between shrink-0 cursor-pointer text-left"
          >
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
              智能体 <span className="text-gray-300 ml-1 font-medium">({project.agents.length})</span>
            </h3>
            <span className="flex items-center gap-2">
              <span
                onClick={(e) => e.stopPropagation()}
                className="text-[#0052d9] text-[10px] font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>添加</span>
              </span>
              {collapsedBoards.agents ? (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </span>
          </button>
          {!collapsedBoards.agents && (
          <div className="p-2.5 space-y-2 bg-white/50">
            {project.agents.map((agent, idx) => (
              <div key={idx} className="flex items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mr-2 shadow-sm ${agent.avatarBg}`}>
                  {agent.avatarIcon === 'Bot' ? (
                    <Bot className="w-3.5 h-3.5" />
                  ) : (
                    <ClipboardCheck className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[11px] font-black text-gray-800">{agent.name}</span>
                    <span className={`px-1.5 py-0.2 text-[8px] rounded font-extrabold ${
                      agent.role === '主控' 
                        ? 'bg-blue-100 text-[#0052d9]' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {agent.role}
                    </span>
                  </div>
                  <p className="text-[8px] text-gray-400 mt-0.5 leading-tight font-medium">
                    {agent.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          )}
        </section>
      </aside>
    </div>
  );
}
