import React, { useState } from 'react';
import { ComplianceIssueItem, ComplianceStatus } from '../types';
import {
  ShieldAlert,
  Search,
  Plus,
  Download,
  X,
  FileCheck2,
  TrendingUp,
} from 'lucide-react';

interface ComplianceIssuesProps {
  items: ComplianceIssueItem[];
  onUpdateItems: (newItems: ComplianceIssueItem[]) => void;
  globalSearchQuery?: string;
}

export const ComplianceIssues: React.FC<ComplianceIssuesProps> = ({
  items,
  onUpdateItems,
  globalSearchQuery = '',
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');
  const [severityFilter, setSeverityFilter] = useState<string>('全部');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState<ComplianceIssueItem | null>(null);

  // New Issue Form
  const [newCategory, setNewCategory] = useState('税务合规');
  const [newDesc, setNewDesc] = useState('');
  const [newLawBasis, setNewLawBasis] = useState('《中华人民共和国税收征收管理法》');
  const [newSeverity, setNewSeverity] = useState<'重大' | '一般' | '低'>('一般');

  const effectiveSearch = (searchQuery || globalSearchQuery).trim().toLowerCase();

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== '全部' && item.category !== categoryFilter) return false;
    if (severityFilter !== '全部' && item.severity !== severityFilter) return false;
    if (statusFilter !== '全部' && item.status !== statusFilter) return false;
    if (effectiveSearch) {
      const matchCode = item.code.toLowerCase().includes(effectiveSearch);
      const matchDesc = item.description.toLowerCase().includes(effectiveSearch);
      const matchLaw = item.lawBasis.toLowerCase().includes(effectiveSearch);
      if (!matchCode && !matchDesc && !matchLaw) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalCount = items.length;
  const majorCount = items.filter((i) => i.severity === '重大').length;
  const generalCount = items.filter((i) => i.severity === '一般').length;
  const lowCount = items.filter((i) => i.severity === '低').length;

  const majorRatio = totalCount > 0 ? ((majorCount / totalCount) * 100).toFixed(1) : '0';
  const generalRatio = totalCount > 0 ? ((generalCount / totalCount) * 100).toFixed(1) : '0';
  const lowRatio = totalCount > 0 ? ((lowCount / totalCount) * 100).toFixed(1) : '0';

  const categories = Array.from(new Set(items.map((i) => i.category)));

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc) return;

    const newCode = `CI-2024-${String(items.length + 1).padStart(3, '0')}`;
    const newItem: ComplianceIssueItem = {
      id: Date.now().toString(),
      code: newCode,
      category: newCategory,
      description: newDesc,
      lawBasis: newLawBasis,
      severity: newSeverity,
      status: '未提交',
    };

    onUpdateItems([newItem, ...items]);
    setShowAddModal(false);
    setNewDesc('');
  };

  const handleStatusUpdate = (id: string, newStatus: ComplianceStatus) => {
    const updated = items.map((i) => (i.id === id ? { ...i, status: newStatus } : i));
    onUpdateItems(updated);
  };

  const handleExport = () => {
    const headers = ['问题编号', '类别', '性质描述', '法律法规依据', '严重程度', '状态'];
    const rows = filteredItems.map((i) => [
      i.code,
      i.category,
      `"${i.description}"`,
      `"${i.lawBasis}"`,
      i.severity,
      i.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orlumi_合规问题汇总_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-auto p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[15px] font-bold text-[#1b1b1e] flex items-center">
          合规情况
          <span className="ml-2 text-[10px] font-normal text-[#75777c]">
            共计发现合规问题{totalCount}项
          </span>
        </h2>
        <div className="flex items-center space-x-2 text-[10px]">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-[#1890ff] text-white hover:bg-blue-600 rounded-md font-medium transition-colors flex items-center shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> 新增合规问题
          </button>
        </div>
      </div>

      {/* Top Metric & Progress Cards */}
      <div className="bg-white p-6 rounded-lg border border-[#c5c6cc] shadow-xs mb-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Metric */}
        <div className="md:col-span-1 border-r border-[#c5c6cc] pr-6 flex flex-col justify-center">
          <div className="flex items-center space-x-2 text-[#75777c] text-[10px] mb-1 font-medium">
            <ShieldAlert className="w-4 h-4 text-[#ff4d4f]" />
            <span>合规问题总数</span>
          </div>
          <div className="text-4xl font-extrabold text-[#1b1b1e]">{totalCount}</div>
          <div className="text-[9px] text-[#75777c] mt-2 flex items-center">
            与上期对比 <span className="text-[#ff4d4f] font-bold ml-1">+2 项</span>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="md:col-span-3 space-y-3 flex flex-col justify-center">
          {/* Major */}
          <div>
            <div className="flex justify-between text-[9px] font-semibold mb-1">
              <span className="text-[#ff4d4f]">重大问题 ({majorCount} 项)</span>
              <span className="text-[#75777c]">{majorRatio}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#ff4d4f] h-full rounded-full transition-all duration-500"
                style={{ width: `${majorRatio}%` }}
              ></div>
            </div>
          </div>

          {/* General */}
          <div>
            <div className="flex justify-between text-[9px] font-semibold mb-1">
              <span className="text-[#faad14]">一般问题 ({generalCount} 项)</span>
              <span className="text-[#75777c]">{generalRatio}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#faad14] h-full rounded-full transition-all duration-500"
                style={{ width: `${generalRatio}%` }}
              ></div>
            </div>
          </div>

          {/* Low */}
          <div>
            <div className="flex justify-between text-[9px] font-semibold mb-1">
              <span className="text-[#52c41a]">低风险问题 ({lowCount} 项)</span>
              <span className="text-[#75777c]">{lowRatio}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#52c41a] h-full rounded-full transition-all duration-500"
                style={{ width: `${lowRatio}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col">
        {/* Filters Bar */}
        <div className="p-4 border-b border-[#c5c6cc] flex flex-wrap gap-4 justify-between items-center bg-[#f9f9ff] rounded-t-lg">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">类别:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">严重程度:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                <option>重大</option>
                <option>一般</option>
                <option>低</option>
              </select>
            </div>

            <div className="flex items-center text-[10px]">
              <span className="text-[#44474c] mr-2">状态:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-[#c5c6cc] rounded text-[10px] py-1 pl-2 pr-6 bg-white focus:ring-[#1890ff] focus:border-[#1890ff]"
              >
                <option>全部</option>
                <option>未提交</option>
                <option>审批中</option>
                <option>已提交</option>
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#75777c]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索合规编号/描述"
                className="pl-8 pr-3 py-1 text-[10px] border border-[#c5c6cc] rounded bg-white focus:outline-none focus:ring-1 focus:ring-[#1890ff] focus:border-[#1890ff] w-56"
              />
            </div>
          </div>

          <button
            onClick={handleExport}
            className="bg-[#1890ff] text-white px-3 py-1.5 rounded text-[10px] font-medium hover:bg-blue-600 transition-colors flex items-center shadow-xs"
          >
            <Download className="w-4 h-4 mr-1.5" /> 导出
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c]">
                <th className="py-3 px-4 font-medium w-32">问题编号</th>
                <th className="py-3 px-4 font-medium w-32">类别</th>
                <th className="py-3 px-4 font-medium w-64">性质描述</th>
                <th className="py-3 px-4 font-medium w-64">法律法规依据</th>
                <th className="py-3 px-4 font-medium text-center w-24">严重程度</th>
                <th className="py-3 px-4 font-medium text-center w-28">状态</th>
                <th className="py-3 px-4 font-medium text-center w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cc] text-[#1b1b1e]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#75777c]">
                    没有找到符合条件的合规问题记录
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f1f3fd] transition-colors ${
                      idx % 2 === 1 ? 'bg-[#f9f9ff]/50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-medium">{item.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-gray-100 text-[#44474c]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 truncate max-w-[240px]" title={item.description}>
                      {item.description}
                    </td>
                    <td className="py-3 px-4 text-[#75777c] truncate max-w-[240px]" title={item.lawBasis}>
                      {item.lawBasis}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-medium border ${
                          item.severity === '重大'
                            ? 'bg-[#fff2f0] text-[#ff4d4f] border-[#ff4d4f]/20'
                            : item.severity === '一般'
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
                          handleStatusUpdate(item.id, e.target.value as ComplianceStatus)
                        }
                        className={`text-[9px] font-medium bg-transparent border-0 focus:ring-0 cursor-pointer ${
                          item.status === '未提交'
                            ? 'text-gray-500'
                            : item.status === '审批中'
                            ? 'text-[#faad14]'
                            : 'text-[#52c41a]'
                        }`}
                      >
                        <option value="未提交">未提交</option>
                        <option value="审批中">审批中</option>
                        <option value="已提交">已提交</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedIssueDetail(item)}
                        className="text-[#1890ff] hover:underline text-[9px] font-medium"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Issue Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-[13px] text-[#1b1b1e]">录入新合规问题</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddItem} className="p-5 space-y-4 text-[10px]">
              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">合规类别</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                >
                  <option>税务合规</option>
                  <option>资金管理</option>
                  <option>合同管理</option>
                  <option>环保合规</option>
                  <option>劳动用工</option>
                  <option>网络安全</option>
                  <option>商业贿赂</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">
                  性质描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="详细说明发现的具体违规事实..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">法律法规依据</label>
                <input
                  type="text"
                  value={newLawBasis}
                  onChange={(e) => setNewLawBasis(e.target.value)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-[#44474c] mb-1">严重程度</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as any)}
                  className="w-full border border-[#c5c6cc] rounded p-2 focus:ring-[#1890ff]"
                >
                  <option value="重大">重大 (涉及重大行政处罚/诉讼)</option>
                  <option value="一般">一般 (内部控制缺失或流程漏洞)</option>
                  <option value="低">低 (轻微文档缺陷)</option>
                </select>
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

      {/* Issue Detail Modal */}
      {selectedIssueDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-md text-[#1b1b1e] flex items-center">
                <FileCheck2 className="w-5 h-5 text-[#1890ff] mr-2" />
                合规问题详情 - {selectedIssueDetail.code}
              </h3>
              <button
                onClick={() => setSelectedIssueDetail(null)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-[10px]">
              <div className="flex justify-between">
                <div>
                  <span className="text-[9px] text-[#75777c]">合规类别</span>
                  <p className="font-semibold text-[#1b1b1e]">{selectedIssueDetail.category}</p>
                </div>
                <div>
                  <span className="text-[9px] text-[#75777c]">严重程度</span>
                  <div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        selectedIssueDetail.severity === '重大'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {selectedIssueDetail.severity}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#75777c]">违规事实描述</span>
                <p className="p-3 bg-gray-50 rounded border text-[#1b1b1e] mt-1">
                  {selectedIssueDetail.description}
                </p>
              </div>

              <div>
                <span className="text-[9px] text-[#75777c]">适用法律法规及政策依据</span>
                <p className="p-3 bg-blue-50/50 rounded border border-blue-100 text-[#1890ff] font-medium mt-1">
                  {selectedIssueDetail.lawBasis}
                </p>
              </div>

              <div className="pt-2 border-t flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedIssueDetail(null)}
                  className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[9px] font-medium"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
