import React, { useState } from 'react';
import { MisstatementItem, MisstatementStatus } from '../types';
import {
  ListOrdered,
  JapaneseYen,
  TriangleAlert,
  CheckCircle,
  Download,
  Search,
  Plus,
  Link as LinkIcon,
  X,
  FileText,
} from 'lucide-react';

interface MisstatementSummaryProps {
  items: MisstatementItem[];
  onUpdateItems: (newItems: MisstatementItem[]) => void;
  onOpenWorkingPaper: (paperCode: string) => void;
  globalSearchQuery?: string;
}

export const MisstatementSummary: React.FC<MisstatementSummaryProps> = ({
  items,
  onUpdateItems,
  onOpenWorkingPaper,
  globalSearchQuery = '',
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [severityFilter, setSeverityFilter] = useState<string>('全部');
  const [subjectFilter, setSubjectFilter] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Misstatement Form State
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState<number>(100000);
  const [newSeverity, setNewSeverity] = useState<'高' | '中' | '低'>('中');
  const [newPaperRef, setNewPaperRef] = useState('AP-AR-001');

  // Combined Search Query
  const effectiveSearch = (searchQuery || globalSearchQuery).trim().toLowerCase();

  // Filtered List
  const filteredItems = items.filter((item) => {
    if (statusFilter !== '全部' && item.status !== statusFilter) return false;
    if (severityFilter !== '全部' && item.severity !== severityFilter) return false;
    if (subjectFilter !== '全部' && item.subject !== subjectFilter) return false;
    if (effectiveSearch) {
      const matchCode = item.code.toLowerCase().includes(effectiveSearch);
      const matchDesc = item.description.toLowerCase().includes(effectiveSearch);
      const matchSub = item.subject.toLowerCase().includes(effectiveSearch);
      if (!matchCode && !matchDesc && !matchSub) return false;
    }
    return true;
  });

  // Calculate stats
  const totalCount = items.length;
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const highRiskCount = items.filter((i) => i.severity === '高').length;
  const adjustedCount = items.filter((i) => i.status === '已调整').length;

  const totalAmountFormatted = totalAmount.toLocaleString('zh-CN');
  const highRiskRatio = totalCount > 0 ? ((highRiskCount / totalCount) * 100).toFixed(1) : '0';
  const adjustedRatio = totalCount > 0 ? ((adjustedCount / totalCount) * 100).toFixed(1) : '0';

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Subject options
  const subjects = Array.from(new Set(items.map((i) => i.subject)));

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newDescription) return;

    const newCode = `ME-2024-${String(items.length + 1).padStart(3, '0')}`;
    const newItem: MisstatementItem = {
      id: Date.now().toString(),
      code: newCode,
      subject: newSubject,
      description: newDescription,
      amount: Number(newAmount),
      severity: newSeverity,
      status: '未调整',
      paperRef: newPaperRef || 'AP-AR-001',
    };

    onUpdateItems([newItem, ...items]);
    setShowAddModal(false);
    setNewDescription('');
    setNewAmount(100000);
  };

  // Quick Change Status
  const handleStatusChange = (id: string, newStatus: MisstatementStatus) => {
    const updated = items.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
    onUpdateItems(updated);
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['错报编号', '科目/项目', '性质描述', '金额(元)', '严重程度', '状态', '关联底稿'];
    const rows = filteredItems.map((i) => [
      i.code,
      i.subject,
      `"${i.description}"`,
      i.amount,
      i.severity,
      i.status,
      i.paperRef,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orlumi_错报汇总_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-auto p-6 font-sans">
      {/* Page Title Bar */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-bold text-[#1b1b1e] flex items-center">
          汇总情况
          <span className="ml-2 text-[10px] font-normal text-[#75777c]">
            共计产生错报{totalCount}笔
          </span>
        </h2>
        <div className="flex items-center space-x-2 text-[10px]">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#1890ff] text-white hover:bg-blue-600 rounded-md font-medium transition-colors flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> 新增错报
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Card 1: 错报笔数 */}
        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xl font-bold text-[#ff4d4f] flex items-center">
                {totalCount}
                <span className="text-[10px] ml-1">↑</span>
              </div>
              <div className="text-[10px] text-[#44474c] font-medium mt-1">错报笔数</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#fff2f0] text-[#ff4d4f] flex items-center justify-center text-[15px]">
              <ListOrdered className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[9px] text-[#75777c] mt-auto pt-2 border-t border-[#c5c6cc]/50">
            与上期 <span className="text-[#ff4d4f] font-semibold">+5</span>
          </div>
        </div>

        {/* Card 2: 错报金额 */}
        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xl font-bold text-[#faad14]">{totalAmountFormatted}</div>
              <div className="text-[10px] text-[#44474c] font-medium mt-1">错报金额 (元)</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#fffbe6] text-[#faad14] flex items-center justify-center text-[15px]">
              <JapaneseYen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[9px] text-[#75777c] mt-auto pt-2 border-t border-[#c5c6cc]/50">
            占调整比 <span className="text-[#faad14] font-semibold">64.9%</span>
          </div>
        </div>

        {/* Card 3: 高风险错报 */}
        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xl font-bold text-[#1890ff] flex items-center">
                {highRiskCount}
                <span className="text-[10px] ml-1">↓</span>
              </div>
              <div className="text-[10px] text-[#44474c] font-medium mt-1">高风险错报</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#e6f7ff] text-[#1890ff] flex items-center justify-center text-[15px]">
              <TriangleAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[9px] text-[#75777c] mt-auto pt-2 border-t border-[#c5c6cc]/50">
            占错报笔数 <span className="text-[#1890ff] font-semibold">{highRiskRatio}%</span>
          </div>
        </div>

        {/* Card 4: 已调整错报 */}
        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xl font-bold text-[#52c41a]">{adjustedCount}</div>
              <div className="text-[10px] text-[#44474c] font-medium mt-1">已调整错报</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f6ffed] text-[#52c41a] flex items-center justify-center text-[15px]">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-[9px] text-[#75777c] mt-auto pt-2 border-t border-[#c5c6cc]/50">
            占错报笔数 <span className="text-[#52c41a] font-semibold">{adjustedRatio}%</span>
          </div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col">
        {/* Filter & Action Toolbar */}
        <div className="p-4 border-b border-[#c5c6cc] flex flex-wrap gap-4 justify-between items-center bg-[#f9f9ff] rounded-t-lg">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status Filter */}
            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">状态:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                <option>未调整</option>
                <option>部分调整</option>
                <option>已调整</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">严重程度:</span>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                <option>高</option>
                <option>中</option>
                <option>低</option>
              </select>
            </div>

            {/* Subject Filter */}
            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">科目/项目:</span>
              <select
                value={subjectFilter}
                onChange={(e) => {
                  setSubjectFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#75777c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="搜索错报编号/描述"
                className="pl-8 pr-3 py-1 text-[10px] border border-[#c5c6cc] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1890ff] focus:border-[#1890ff] w-56"
              />
            </div>
          </div>

          <div>
            <button
              onClick={handleExport}
              className="bg-[#1890ff] text-white px-3 py-1.5 rounded text-[10px] font-medium hover:bg-blue-600 transition-colors flex items-center shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5" /> 导出
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c]">
                <th className="py-3 px-4 font-medium w-32">错报编号</th>
                <th className="py-3 px-4 font-medium w-32">科目/项目</th>
                <th className="py-3 px-4 font-medium w-56">性质描述</th>
                <th className="py-3 px-4 font-medium text-right w-36">金额 (元)</th>
                <th className="py-3 px-4 font-medium text-center w-24">严重程度</th>
                <th className="py-3 px-4 font-medium text-center w-28">状态</th>
                <th className="py-3 px-4 font-medium w-32">关联底稿</th>
                <th className="py-3 px-4 font-medium text-center w-24">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cc] text-[#1b1b1e]">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#75777c]">
                    没有找到符合条件的错报记录
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f1f3fd] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#f9f9ff]/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">{item.code}</td>
                    <td className="py-3 px-4">{item.subject}</td>
                    <td className="py-3 px-4 truncate max-w-[220px]" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      {item.amount.toLocaleString('zh-CN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium border ${
                          item.severity === '高'
                            ? 'bg-[#fff2f0] text-[#ff4d4f] border-[#ff4d4f]/20'
                            : item.severity === '中'
                            ? 'bg-[#fffbe6] text-[#faad14] border-[#faad14]/20'
                            : 'bg-[#f6ffed] text-[#52c41a] border-[#52c41a]/20'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as MisstatementStatus)
                        }
                        className={`text-[9px] font-medium bg-transparent border-0 focus:ring-0 cursor-pointer ${
                          item.status === '未调整'
                            ? 'text-[#ff4d4f]'
                            : item.status === '部分调整'
                            ? 'text-[#faad14]'
                            : 'text-[#52c41a]'
                        }`}
                      >
                        <option value="未调整">未调整</option>
                        <option value="部分调整">部分调整</option>
                        <option value="已调整">已调整</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onOpenWorkingPaper(item.paperRef)}
                        className="text-[#1890ff] hover:underline flex items-center cursor-pointer text-[9px] font-medium"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" /> {item.paperRef}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-center text-[#1890ff]">
                      <button
                        onClick={() => onOpenWorkingPaper(item.paperRef)}
                        title="查看关联底稿详情"
                        className="p-1 hover:bg-blue-50 rounded text-[#1890ff] transition-colors"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#c5c6cc] flex flex-wrap justify-between items-center text-[10px] text-[#44474c] bg-white rounded-b-lg">
          <div>共 {filteredItems.length} 条</div>
          <div className="flex items-center space-x-2">
            <span>跳至</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-12 text-center border border-[#c5c6cc] rounded py-1 text-[10px] focus:ring-[#1890ff] focus:border-[#1890ff]"
            />
            <span>页</span>

            <div className="flex border border-[#c5c6cc] rounded overflow-hidden ml-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="px-2.5 py-1 bg-[#f1f3fd] text-[#75777c] disabled:opacity-40 cursor-pointer"
              >
                &lt;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-[9px] font-medium ${
                    currentPage === page
                      ? 'bg-[#1890ff] text-white border-r border-l border-[#c5c6cc]'
                      : 'bg-white hover:bg-[#f1f3fd] border-r border-[#c5c6cc]'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="px-2.5 py-1 bg-white hover:bg-[#f1f3fd] disabled:opacity-40 cursor-pointer"
              >
                &gt;
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 ml-2 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Misstatement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-[13px] text-[#1b1b1e]">录入新错报项目</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-4 text-[10px]">
              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">
                  科目/项目 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="例如：应收账款 / 存货 / 营业收入"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff] focus:border-[#1890ff]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">
                  错报性质描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="请输入错报的具体事实与金额计算依据"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff] focus:border-[#1890ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-[#44474c] mb-1">
                    金额 (元) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff] focus:border-[#1890ff]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#44474c] mb-1">严重程度</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff] focus:border-[#1890ff]"
                  >
                    <option value="高">高 (重大风险)</option>
                    <option value="中">中 (一般风险)</option>
                    <option value="低">低 (低风险)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">关联底稿编号</label>
                <input
                  type="text"
                  value={newPaperRef}
                  onChange={(e) => setNewPaperRef(e.target.value)}
                  placeholder="AP-AR-001"
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff] focus:border-[#1890ff]"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1890ff] text-white rounded font-medium hover:bg-blue-600"
                >
                  提交录入
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
