import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { 
  Paperclip, 
  Smile, 
  Send, 
  RotateCw, 
  MoreHorizontal, 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  Loader2,
  Check,
  Search,
  Image,
  Video,
  Link,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCheck,
  Wifi
} from 'lucide-react';
import { RecentFile } from '../types';

interface DirectChatViewProps {
  memberName: string;
  memberRole: string;
  recentFiles: RecentFile[];
  memberStatus?: string;
}

export default function DirectChatView({
  memberName,
  memberRole,
  recentFiles,
  memberStatus = '在线',
}: DirectChatViewProps) {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{
    sender: 'me' | 'other';
    text: string;
    time: string;
    isRead?: boolean;
  }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load realistic chat history for each member to show "已读" and "未读" states
  useEffect(() => {
    const historyMap: { [key: string]: { sender: 'me' | 'other', text: string, time: string, isRead?: boolean }[] } = {
      '吴立松': [
        { sender: 'other', text: '符工，华安审计项目的一审底稿你看了吗？', time: '昨天 10:30' },
        { sender: 'me', text: '看了，整体框架没问题，但风控模块的数额有些出入，正在重新核对。', time: '昨天 10:45', isRead: true },
        { sender: 'other', text: '好的，需要我把最新的财务报表xlsx导出一份给你吗？', time: '昨天 10:48' },
        { sender: 'me', text: '可以的，你发在这儿就行，我今天上午拉智能体一起跑一下分析。', time: '昨天 11:00', isRead: true },
        { sender: 'other', text: '没问题，文件我已经上传到项目空间了，名称是 审计进度汇报表_20250628.xlsx。', time: '昨天 11:22' },
        { sender: 'me', text: '收到，我这就去下载核对。', time: '今天 09:15', isRead: true },
        { sender: 'me', text: '对了一审那边的截止时间是这周五对吧？', time: '今天 09:30', isRead: false },
      ],
      '汪欣': [
        { sender: 'other', text: '符经理，测试环境的数据库指引文档我已经上传了，在右侧文件列表可以下载。', time: '昨天 14:10' },
        { sender: 'me', text: '收到，我看到最近文件里有 PDF 了，等下让报告助理跑个总结。', time: '昨天 14:15', isRead: true },
        { sender: 'other', text: '好的，另外测试环境的联调有遇到什么接口权限问题吗？', time: '昨天 14:20' },
        { sender: 'me', text: '目前还比较顺利，智能体的底稿匹配率比我们想象的要高。', time: '今天 10:00', isRead: true },
        { sender: 'me', text: '下午两点的联调会议，你那边准备得怎么样了？', time: '今天 11:45', isRead: false },
      ],
      'RoadwiseLab 主控': [
        { sender: 'other', text: '您好，我是您的智能审计主控助理，已为您准备好华安云审计工作台。', time: '今天 08:30' },
        { sender: 'me', text: 'RoadwiseLab，帮我查一下底稿归集培训演示视频在哪？', time: '今天 08:35', isRead: true },
        { sender: 'other', text: '已为您在右侧文件列表中整理出【底稿归集培训演示视频.mp4】。您可以点击直接进行下载和查看。', time: '今天 08:36' },
        { sender: 'me', text: '好的，辛苦了，今天有什么紧急任务吗？', time: '今天 08:40', isRead: false },
      ]
    };

    setMessages(historyMap[memberName] || [
      { sender: 'other', text: `您好！我是 ${memberName}。很高兴能与您在这个项目合作。`, time: '今天 10:00' },
      { sender: 'me', text: '你好！接下来让我们一起高效推进项目。', time: '今天 10:05', isRead: true }
    ]);
  }, [memberName]);

  // Recent files section state
  const [fileSearch, setFileSearch] = useState('');
  const [recentFileTab, setRecentFileTab] = useState<'media' | 'file' | 'link' | 'date'>('media');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
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

  const handleDownload = (filename: string) => {
    setDownloadingFile(filename);
    setTimeout(() => {
      setDownloadingFile(null);
      setDownloadSuccess(filename);
      setTimeout(() => setDownloadSuccess(null), 2000);
    }, 1200);
  };

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
        className="flex items-center justify-between p-2.5 hover:bg-white border border-gray-100/50 hover:border-gray-200/80 rounded-xl transition-all cursor-pointer group bg-white/60 shadow-xs"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
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
              <Image className="w-3.5 h-3.5" />
            ) : f.type === 'video' ? (
              <Video className="w-3.5 h-3.5" />
            ) : f.type === 'link' ? (
              <Link className="w-3.5 h-3.5" />
            ) : f.extension === 'xlsx' ? (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-700 truncate group-hover:text-[#0052d9] transition-colors">
              {f.name}
            </p>
            <p className="text-[8px] text-gray-400 font-bold mt-0.5">
              {isLink ? '点击访问链接' : `${f.size || ''} • ${f.time}`}
            </p>
          </div>
        </div>
        {isLink ? (
          <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-sky-500 shrink-0" />
        ) : (
          <button className="shrink-0">
            {downloadingFile === f.name ? (
              <Loader2 className="w-3 h-3 text-[#0052d9] animate-spin" />
            ) : downloadSuccess === f.name ? (
              <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
            ) : (
              <Download className="w-3 h-3 text-gray-300 group-hover:text-[#0052d9]" />
            )}
          </button>
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
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const userText = inputText;
    setMessages(prev => [...prev, { 
      sender: 'me', 
      text: userText, 
      time: '今天 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false 
    }]);
    setInputText('');
    
    // Simulate message becoming read after 1.2 seconds
    setTimeout(() => {
      setMessages(prev => 
        prev.map(m => m.text === userText && m.sender === 'me' ? { ...m, isRead: true } : m)
      );
    }, 1200);

    // Simulate other member typing and replying
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      let replyText = `收到！我刚看完关于您发送的信息，目前我正在跟进相关的模块中，稍后我们就具体指标碰一下。`;
      if (userText.includes('排期') || userText.includes('计划')) {
        replyText = `好滴，关于排期计划，我已经在项目排期表中填了我的研发工时预估，可以随时核对！`;
      } else if (userText.includes('底稿') || userText.includes('报告')) {
        replyText = `底稿第一版我已经归集得差不多了，已经提交给 RoadwiseLab 主控核对了，看看一审还需要什么材料。`;
      }
      setMessages(prev => [...prev, { 
        sender: 'other', 
        text: replyText, 
        time: '今天 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      }]);
    }, 2500);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* Middle Chat Area */}
      <main className="flex-1 bg-[#f6f8ff] flex flex-col h-full border-r border-[#dfe2ed]">
        {/* Header */}
        <header className="h-16 border-b border-[#dfe2ed] flex items-center justify-between px-6 bg-white/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 font-bold text-xs border border-white shadow-sm">
                {memberName.charAt(0)}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
                memberStatus === '在线' ? 'bg-emerald-500 animate-pulse' : memberStatus === '忙碌' ? 'bg-amber-500' : 'bg-gray-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-gray-800 leading-tight">{memberName}</h1>
                <span className={`px-1.5 py-0.2 text-[8px] rounded font-extrabold border flex items-center gap-0.5 select-none ${
                  memberStatus === '在线' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : memberStatus === '忙碌'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-gray-50 text-gray-500 border-gray-100'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${
                    memberStatus === '在线' ? 'bg-emerald-500 animate-pulse' : memberStatus === '忙碌' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <span>{memberStatus}</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{memberRole}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[11px] rounded-xl border border-emerald-100 flex items-center gap-1.5 font-bold shadow-sm">
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

        {/* Dynamic chat area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
          {messages.length === 0 ? (
            /* Empty Chat State (Direct copy of HTML 2 landing design!) */
            <div className="flex-1 h-full flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500">
              <div className="relative mb-6 select-none">
                <div className="w-48 h-48 bg-blue-500/5 rounded-full blur-2xl absolute inset-0 -z-10" />
                <div className="w-36 h-36 bg-white rounded-[24px] shadow-lg flex items-center justify-center border border-gray-100/40 relative">
                  <div className="space-y-2.5 w-2/3">
                    <div className="h-2.5 bg-blue-100 rounded-full w-full" />
                    <div className="h-2.5 bg-blue-50 rounded-full w-2/3" />
                    <div className="h-2.5 bg-gray-50 rounded-full w-3/4" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-[#0052d9] rounded-2xl shadow-md flex items-center justify-center border-4 border-white text-white">
                    <Send className="w-4.5 h-4.5 rotate-45 text-white fill-white" />
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-black text-gray-800 mb-1.5">准备发送给 {memberName}</h3>
              <p className="text-[11px] text-gray-400 font-bold max-w-xs leading-normal">
                发送第一条消息后，这里会变成你们的固定直聊。高效沟通，从现在开始。
              </p>
            </div>
          ) : (
            /* Dialogue Messages list */
            <div className="space-y-5">
              {messages.map((msg, idx) => {
                const isMe = msg.sender === 'me';
                return (
                  <div 
                    key={idx}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-start gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0 border border-white shadow-sm">
                        {isMe ? '符' : memberName.charAt(0)}
                      </div>
                      <div className="space-y-0.5">
                        <div className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed border shadow-sm ${
                          isMe 
                            ? 'bg-white rounded-tr-none border-[#dfe2ed]' 
                            : 'bg-[#fbfbff] rounded-tl-none border-[#dfe2ed]'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[8px] text-gray-400 font-bold leading-none">{msg.time}</span>
                          {isMe && (
                            msg.isRead ? (
                              <span className="text-[9px] text-[#0052d9] font-black flex items-center gap-0.5 select-none leading-none">
                                <CheckCheck className="w-3 h-3 stroke-[3]" />
                                <span>已读</span>
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-400 font-bold flex items-center gap-0.5 select-none leading-none">
                                <Check className="w-2.5 h-2.5 stroke-[2]" />
                                <span>未读</span>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0 border border-white shadow-sm animate-pulse">
                    {memberName.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-2xl rounded-tl-none border border-gray-100 shadow-sm text-xs text-gray-400 font-bold">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0052d9]" />
                    <span>{memberName} 正在输入...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message Input Box */}
        <div className="p-4 pt-0 shrink-0">
          <div className="glass-card rounded-2xl p-2.5 flex flex-col gap-2 shadow-sm bg-white">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 resize-none text-xs h-12 outline-none placeholder:text-gray-400 custom-scrollbar font-medium text-[#181c23]" 
              placeholder={`发送消息给 ${memberName}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <div className="flex items-center justify-between mt-1 border-t border-gray-100 pt-1.5 shrink-0">
              <div className="flex items-center gap-1.5 text-gray-400">
                <button className="p-1.5 hover:text-[#0052d9] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" title="附件">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:text-[#0052d9] rounded-lg hover:bg-gray-50 transition-colors font-extrabold text-xs leading-none cursor-pointer" title="提及">
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
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-72 border-l border-[#dfe2ed] bg-[#fbfbff] shrink-0 p-4 space-y-4 overflow-y-auto custom-scrollbar select-none flex flex-col">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-gray-800">最近文件</h3>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input 
            type="text" 
            placeholder="搜索名称或链接..." 
            className="w-full pl-7.5 pr-2.5 py-1.5 bg-white border border-[#dfe2ed] rounded-xl text-[10px] text-gray-700 placeholder-gray-300 outline-none focus:border-[#0052d9] transition-all font-semibold shadow-xs"
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
              className={`flex-1 py-1 rounded-md text-[9px] font-black transition-all ${
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
        <div className={`flex-1 space-y-2 pr-0.5 ${recentFileTab !== 'date' ? 'overflow-y-auto custom-scrollbar' : ''}`}>
          {renderRecentFiles()}
        </div>
      </aside>
    </div>
  );
}
