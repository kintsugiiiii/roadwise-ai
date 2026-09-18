import React, { useState } from 'react';
import { WorkingPaperItem, PaperStatus } from '../types';
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  X,
} from 'lucide-react';

interface WorkingPapersProps {
  papers: WorkingPaperItem[];
  onSelectPaper: (paper: WorkingPaperItem) => void;
  onAddPaper: (paper: WorkingPaperItem) => void;
  globalSearchQuery?: string;
  ownerForPaperCode: (code: string, name?: string, sourceTagId?: string) => string;
}

export const WorkingPapers: React.FC<WorkingPapersProps> = ({
  papers,
  onSelectPaper,
  onAddPaper,
  globalSearchQuery = '',
  ownerForPaperCode,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('04 实质性程序/应收账款');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '04 实质性程序': true,
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [directoryCollapsed, setDirectoryCollapsed] = useState(false);

  // Form State
  const [newCode, setNewCode] = useState('AP-AR-006');
  const [newName, setNewName] = useState('');
  const [newAuthor, setNewAuthor] = useState(() => ownerForPaperCode('AP-AR-006'));
  const [newSourceTagId, setNewSourceTagId] = useState('rs2');

  const toggleFolder = (folderName: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };
  const folderGroups: Array<{ stage: string; children: string[] }> = [
    { stage: '01 计划阶段', children: ['审计计划', '重要性与 Scope'] },
    { stage: '02 风险评估', children: ['收入', '应收账款', '存货', '资金'] },
    { stage: '03 内控测试', children: ['销售与收款', '存货'] },
    { stage: '04 实质性程序', children: ['收入', '应收账款', '存货', '固定资产', '应付账款', '费用', '其他'] },
    { stage: '05 完成阶段', children: ['错报与合规汇总', '完成程序', '报告与归档'] },
  ];

  const effectiveSearch = (searchQuery || globalSearchQuery).trim().toLowerCase();

  // Filter papers
  const filteredPapers = papers.filter((p) => {
    if (effectiveSearch) {
      return (
        p.code.toLowerCase().includes(effectiveSearch) ||
        p.name.toLowerCase().includes(effectiveSearch) ||
        p.author.toLowerCase().includes(effectiveSearch)
      );
    }
    return p.folderPath === selectedFolder;
  });

  const handleCreatePaper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const sourceTagLabels: Record<string, string> = { rs1: '收入异常', rs2: '账龄恶化', rs3: '存货增长', rs4: '资金异常', and1: '虚增收入', ct1: '出货审批', ct2: '盘点控制', ap1: '截止测试', ap2: '三单一致', ap3: '应收函证', ap4: '存货监盘', cc1: '关联披露' };
    const inheritedAuthor = ownerForPaperCode(newCode, newName, newSourceTagId);
    const newPaper: WorkingPaperItem = {
      id: Date.now().toString(),
      sourceTagId: newSourceTagId,
      sourceTagLabel: sourceTagLabels[newSourceTagId],
      code: newCode || `AP-AR-00${papers.length + 1}`,
      name: newName,
      author: inheritedAuthor,
      date: new Date().toISOString().slice(0, 10),
      reviewer: '符金雨',
      reviewDate: '-',
      status: '编制中',
      folderPath: selectedFolder,
      importance: '一般',
      associatedAccount: '应收账款',
      indexCode: `BS-AR-00${papers.length + 1}`,
      type: '实质性程序',
      contentInstruction: '根据会计准则获取凭证样本并完成检查合规程序。',
      executionResults: [
        { item: '样本总额', amount: 5000000, ratio: 100 },
        { item: '测试通过额', amount: 5000000, ratio: 100 },
      ],
      attachments: [],
      reviewRecords: [],
      doubts: [],
    };

    onAddPaper(newPaper);
    setShowCreateModal(false);
    setNewName('');
  };

  return (
    <div className="flex-1 flex overflow-hidden font-sans">
      {/* Left Directory Tree Sidebar */}
      <div className={`${directoryCollapsed ? 'w-12' : 'w-64'} bg-[#f9f9ff] border-r border-[#c5c6cc] flex flex-col flex-shrink-0 select-none transition-[width] duration-200`}>
        <div className={`border-b border-[#c5c6cc] bg-white ${directoryCollapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center ${directoryCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {!directoryCollapsed && <h3 className="font-bold text-[10px] text-[#1b1b1e] flex items-center">
              <FolderOpen className="w-4 h-4 mr-2 text-[#1890ff]" /> 底稿目录树
            </h3>}
            <button type="button" onClick={() => setDirectoryCollapsed((current) => !current)} aria-label={directoryCollapsed ? '展开底稿目录树' : '收起底稿目录树'} title={directoryCollapsed ? '展开目录树' : '收起目录树'} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[#66758b] hover:bg-[#f1f4f8] hover:text-[#315ca9]">
              {directoryCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 rotate-90" />}
            </button>
          </div>
        </div>

        {directoryCollapsed ? (
          <button type="button" onClick={() => setDirectoryCollapsed(false)} title="展开底稿目录树" className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-md text-[#1890ff] hover:bg-[#e6f7ff]">
            <FolderOpen className="h-4 w-4" />
          </button>
        ) : <div className="p-3 overflow-y-auto space-y-1 text-[9px]">
          {folderGroups.map(({ stage, children }) => <div key={stage}>
            <div
              onClick={() => toggleFolder(stage)}
              className="flex items-center py-1.5 px-2 rounded hover:bg-gray-200/60 cursor-pointer text-[#1b1b1e] font-semibold"
            >
              {expandedFolders[stage] ? (
                <ChevronDown className="w-3.5 h-3.5 mr-1 text-[#75777c]" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 mr-1 text-[#75777c]" />
              )}
              {expandedFolders[stage] ? <FolderOpen className="w-4 h-4 mr-1.5 text-[#1890ff]" /> : <Folder className="w-4 h-4 mr-1.5 text-amber-500" />}
              <span>{stage}</span>
            </div>

            {expandedFolders[stage] && (
              <div className="ml-5 mt-1 space-y-0.5 border-l-2 border-[#c5c6cc]/50 pl-2">
                {children.map((sub) => {
                  const path = `${stage}/${sub}`;
                  const isActive = selectedFolder === path;
                  return (
                    <div
                      key={sub}
                      onClick={() => setSelectedFolder(path)}
                      className={`flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-[#e6f7ff] text-[#1890ff] font-bold'
                          : 'text-[#44474c] hover:bg-gray-200/50'
                      }`}
                    >
                      <Folder className={`w-3.5 h-3.5 mr-1.5 ${isActive ? 'text-[#1890ff]' : 'text-gray-400'}`} />
                      <span>{sub}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>)}
        </div>}
      </div>

      {/* Right File List Container */}
      <div className="flex-1 overflow-auto bg-white p-5 flex flex-col">
        {/* Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-[#c5c6cc]">
          <div>
            <h2 className="text-[13px] font-bold text-[#1b1b1e] flex items-center">
              {selectedFolder}
              <span className="ml-3 text-[9px] font-normal text-[#75777c]">
                共 {filteredPapers.length} 份底稿
              </span>
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#75777c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索底稿编码/名称"
                className="pl-8 pr-3 py-1.5 text-[9px] border border-[#c5c6cc] rounded bg-[#f9f9ff] focus:outline-none focus:ring-1 focus:ring-[#1890ff] focus:border-[#1890ff] w-52"
              />
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 border border-[#c5c6cc] bg-white hover:bg-gray-50 text-[#44474c] rounded text-[9px] font-medium transition-colors flex items-center shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1" /> 上传文件
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-[#1890ff] hover:bg-blue-600 text-white rounded text-[9px] font-medium transition-colors flex items-center shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> 新建底稿
            </button>
          </div>
        </div>

        {/* Paper Table */}
        <div className="overflow-x-auto rounded-lg border border-[#d9dfe8] bg-white">
          <table className="w-full min-w-[900px] table-fixed text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c] font-semibold">
                <th className="w-[110px] px-4 py-3">编号</th>
                <th className="w-[220px] px-4 py-3">底稿名称 / 来源标签</th>
                <th className="w-[92px] px-4 py-3">编制人<br /><small className="font-normal text-[#8a96a7]">图谱负责人</small></th>
                <th className="w-[106px] px-4 py-3">编制日期</th>
                <th className="w-[92px] px-4 py-3">复核人<br /><small className="font-normal text-[#8a96a7]">当前用户</small></th>
                <th className="w-[106px] px-4 py-3">复核日期</th>
                <th className="w-[86px] px-4 py-3 text-center">状态</th>
                <th className="w-[72px] px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cc] text-[#1b1b1e]">
              {filteredPapers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#75777c]">
                    该目录下暂无底稿文件
                  </td>
                </tr>
              ) : (
                filteredPapers.map((paper) => (
                  <tr
                    key={paper.id}
                    onClick={() => onSelectPaper(paper)}
                    className="hover:bg-[#e6f7ff]/40 transition-colors cursor-pointer group"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-[#1890ff] group-hover:underline">
                      <span className="flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-[#1890ff]" />
                      {paper.code}</span>
                    </td>
                    <td className="px-4 py-4 font-medium leading-relaxed text-[#1b1b1e]">{paper.name}<small className="mt-1 block font-bold text-[#667fb0]">来源：{paper.sourceTagLabel ?? '待关联标签'}</small></td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#44474c]">{paper.author}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#75777c]">{paper.date}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#44474c]">{paper.reviewer}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#75777c]">{paper.reviewDate}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          paper.status === '已复核'
                            ? 'bg-[#f6ffed] text-[#52c41a] border-[#52c41a]/20'
                            : 'bg-[#fffbe6] text-[#faad14] border-[#faad14]/20'
                        }`}
                      >
                        {paper.status === '已复核' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {paper.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPaper(paper);
                        }}
                        className="text-[#1890ff] hover:underline font-medium inline-flex items-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> 查看
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-[10px] text-[#1b1b1e]">新建底稿 - {selectedFolder}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePaper} className="p-4 space-y-3 text-[9px]">
              <div>
                <label className="block font-bold text-[#44474c] mb-1">底稿编号</label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => {
                    setNewCode(e.target.value);
                    setNewAuthor(ownerForPaperCode(e.target.value, newName, newSourceTagId));
                  }}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#44474c] mb-1">底稿名称</label>
                <input
                  type="text"
                  required
                  placeholder="例如：应收账款期后回款测试"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewAuthor(ownerForPaperCode(newCode, e.target.value, newSourceTagId));
                  }}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#44474c] mb-1">来源标签</label>
                <select value={newSourceTagId} onChange={(e) => { setNewSourceTagId(e.target.value); setNewAuthor(ownerForPaperCode(newCode, newName, e.target.value)); }} className="w-full border border-[#c5c6cc] rounded bg-white p-2">
                  <option value="rs1">收入异常</option><option value="rs2">账龄恶化</option><option value="rs3">存货增长</option><option value="rs4">资金异常</option><option value="and1">虚增收入</option><option value="ct1">出货审批</option><option value="ct2">盘点控制</option><option value="ap1">截止测试</option><option value="ap2">三单一致</option><option value="ap3">应收函证</option><option value="ap4">存货监盘</option><option value="cc1">关联披露</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#44474c] mb-1">编制人（继承知识图谱负责人）</label>
                <input
                  type="text"
                  value={newAuthor}
                  readOnly
                  className="w-full border border-[#c5c6cc] rounded bg-[#f5f7fa] p-2 text-[#526178]"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 border rounded text-gray-600"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1890ff] text-white rounded font-semibold hover:bg-blue-600"
                >
                  创建底稿
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-[#c5c6cc] p-5">
            <div className="flex justify-between items-center pb-3 border-b mb-4">
              <h3 className="font-bold text-[10px]">上传底稿文档 / 附件</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 hover:border-[#1890ff] rounded-lg p-8 text-center bg-gray-50/50 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-[#1890ff] mx-auto mb-2" />
              <p className="text-[9px] font-semibold text-gray-700">点击或拖拽文件到此处上传</p>
              <p className="text-[10px] text-gray-400 mt-1">支持 .xlsx, .docx, .pdf 格式文件</p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  alert('文件上传成功！已加入底稿附件库。');
                  setShowUploadModal(false);
                }}
                className="px-4 py-1.5 bg-[#1890ff] text-white rounded text-[9px] font-bold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
