import React, { useState } from 'react';
import { TrialBalanceRow } from '../types';
import {
  Scale,
  Search,
  Download,
  ListFilter,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface TrialBalanceProps {
  rows: TrialBalanceRow[];
  globalSearchQuery?: string;
}

export const TrialBalance: React.FC<TrialBalanceProps> = ({
  rows,
  globalSearchQuery = '',
}) => {
  const [period, setPeriod] = useState('2024年度');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEntriesModal, setShowEntriesModal] = useState(false);

  const effectiveSearch = (searchQuery || globalSearchQuery).trim().toLowerCase();

  const filteredRows = rows.filter((r) => {
    if (!effectiveSearch) return true;
    return (
      r.accountCode.toLowerCase().includes(effectiveSearch) ||
      r.accountName.toLowerCase().includes(effectiveSearch)
    );
  });

  // Calculate totals
  const totalBeforeDebit = rows.reduce((s, r) => s + (r.beforeDebit || 0), 0);
  const totalBeforeCredit = rows.reduce((s, r) => s + (r.beforeCredit || 0), 0);
  const totalAdjDebit = rows.reduce((s, r) => s + (r.adjDebit || 0), 0);
  const totalAdjCredit = rows.reduce((s, r) => s + (r.adjCredit || 0), 0);
  const totalAfterDebit = rows.reduce((s, r) => s + (r.afterDebit || 0), 0);
  const totalAfterCredit = rows.reduce((s, r) => s + (r.afterCredit || 0), 0);

  const handleExport = () => {
    const headers = [
      '科目编码',
      '科目名称',
      '调整前借方',
      '调整前贷方',
      '调整借方',
      '调整贷方',
      '调整后借方',
      '调整后贷方',
    ];
    const csvRows = filteredRows.map((r) => [
      r.accountCode,
      r.accountName,
      r.beforeDebit || 0,
      r.beforeCredit || 0,
      r.adjDebit || 0,
      r.adjCredit || 0,
      r.afterDebit || 0,
      r.afterCredit || 0,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...csvRows.map((cr) => cr.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orlumi_TB_试算平衡表_${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-auto p-6 font-sans">
      {/* Header Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce3ed] pb-4">
        <div className="flex items-center gap-3">
          <h2 className="flex items-center text-[15px] font-bold text-[#1b1b1e]">
            <Scale className="w-5 h-5 mr-2 text-[#1890ff]" />
            TB 调整后试算平衡表
          </h2>
          <span className="flex items-center rounded bg-green-50 px-2 py-1 text-[9px] font-bold text-green-700">
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> 借贷平衡
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[9px]">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border border-[#c5c6cc] rounded py-1.5 px-3 bg-white font-medium focus:ring-[#1890ff]"
          >
            <option>2024年度</option>
            <option>2023年度</option>
          </select>

          <button
            onClick={() => setShowEntriesModal(true)}
            className="px-3 py-1.5 border border-[#c5c6cc] bg-white hover:bg-gray-50 text-[#44474c] rounded font-medium transition-colors flex items-center shadow-xs cursor-pointer"
          >
            <ListFilter className="w-3.5 h-3.5 mr-1.5 text-[#1890ff]" /> 分录汇总
          </button>

          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-[#1890ff] text-white rounded font-medium hover:bg-blue-600 transition-colors flex items-center shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> 导出试算表 (Excel)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-[#c5c6cc] shadow-xs">
          <span className="text-[9px] text-[#75777c]">调整前合计</span>
          <div className="text-[15px] font-bold text-[#1b1b1e] mt-1">
            {totalBeforeDebit.toLocaleString('zh-CN')}
          </div>
          <span className="text-[10px] text-gray-500">借贷双方对应相等</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#c5c6cc] shadow-xs">
          <span className="text-[9px] text-[#75777c]">调整分录影响金额</span>
          <div className="text-[15px] font-bold text-[#faad14] mt-1">
            {totalAdjDebit.toLocaleString('zh-CN')}
          </div>
          <span className="text-[10px] text-amber-600 font-semibold">共计 28 笔审计调整分录</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#c5c6cc] shadow-xs">
          <span className="text-[9px] text-[#75777c]">调整后合计</span>
          <div className="text-[15px] font-bold text-[#1890ff] mt-1">
            {totalAfterDebit.toLocaleString('zh-CN')}
          </div>
          <span className="text-[10px] text-blue-600">更新最终报表数据</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[#c5c6cc] shadow-xs">
          <span className="text-[9px] text-[#75777c]">试算平衡状态</span>
          <div className="text-[15px] font-bold text-[#52c41a] mt-1">0.00 元</div>
          <span className="text-[10px] text-green-600 font-semibold">借贷方向无差额</span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col">
        <div className="p-4 border-b border-[#c5c6cc] flex justify-between items-center bg-[#f9f9ff] rounded-t-lg">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-[#75777c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="按科目编码或名称筛选..."
              className="pl-8 pr-3 py-1 text-[9px] border border-[#c5c6cc] rounded bg-white w-64 focus:ring-[#1890ff]"
            />
          </div>
          <span className="text-[9px] text-[#75777c]">显示 {filteredRows.length} 科目条目</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[9px]">
            <thead>
              <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c] font-semibold">
                <th className="py-2.5 px-4 w-28">科目编码</th>
                <th className="py-2.5 px-4 w-40">科目名称</th>
                <th className="py-2.5 px-4 text-right bg-blue-50/30">调整前借方</th>
                <th className="py-2.5 px-4 text-right bg-blue-50/30 border-r">调整前贷方</th>
                <th className="py-2.5 px-4 text-right bg-amber-50/30">调整分录借方</th>
                <th className="py-2.5 px-4 text-right bg-amber-50/30 border-r">调整分录贷方</th>
                <th className="py-2.5 px-4 text-right bg-green-50/30">调整后借方</th>
                <th className="py-2.5 px-4 text-right bg-green-50/30">调整后贷方</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cc] text-[#1b1b1e]">
              {filteredRows.map((r) => (
                <tr key={r.accountCode} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-[#1890ff]">{r.accountCode}</td>
                  <td className="py-2.5 px-4 font-medium">{r.accountName}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">
                    {r.beforeDebit ? r.beforeDebit.toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums border-r">
                    {r.beforeCredit ? r.beforeCredit.toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-[#faad14]">
                    {r.adjDebit ? r.adjDebit.toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-semibold text-[#faad14] border-r">
                    {r.adjCredit ? r.adjCredit.toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-bold text-[#1890ff]">
                    {r.afterDebit ? r.afterDebit.toLocaleString('zh-CN') : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums font-bold text-[#1890ff]">
                    {r.afterCredit ? r.afterCredit.toLocaleString('zh-CN') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#f9f9ff] font-extrabold border-t-2 border-[#c5c6cc] text-[#1b1b1e]">
                <td colSpan={2} className="py-3 px-4 text-right">
                  全表合计:
                </td>
                <td className="py-3 px-4 text-right tabular-nums">
                  {totalBeforeDebit.toLocaleString('zh-CN')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums border-r">
                  {totalBeforeCredit.toLocaleString('zh-CN')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-[#faad14]">
                  {totalAdjDebit.toLocaleString('zh-CN')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-[#faad14] border-r">
                  {totalAdjCredit.toLocaleString('zh-CN')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-[#1890ff]">
                  {totalAfterDebit.toLocaleString('zh-CN')}
                </td>
                <td className="py-3 px-4 text-right tabular-nums text-[#1890ff]">
                  {totalAfterCredit.toLocaleString('zh-CN')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Adjustment Entries Modal */}
      {showEntriesModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-[10px] text-[#1b1b1e] flex items-center">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-[#1890ff]" />
                审计调整分录清单 (已审核生效)
              </h3>
              <button
                onClick={() => setShowEntriesModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto text-[9px]">
              <div className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between font-bold mb-1">
                  <span>分录 #01 (ME-2024-001) - 补提存货跌价准备</span>
                  <span className="text-[#1890ff]">1,250,000 元</span>
                </div>
                <p className="text-gray-600">借：资产减值损失 - 存货跌价损失 1,250,000</p>
                <p className="text-gray-600">贷：存货跌价准备 1,250,000</p>
              </div>

              <div className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between font-bold mb-1">
                  <span>分录 #02 (ME-2024-002) - 补提坏账准备</span>
                  <span className="text-[#1890ff]">860,000 元</span>
                </div>
                <p className="text-gray-600">借：信用减值损失 - 应收账款 860,000</p>
                <p className="text-gray-600">贷：坏账准备 860,000</p>
              </div>

              <div className="p-3 border rounded bg-gray-50">
                <div className="flex justify-between font-bold mb-1">
                  <span>分录 #03 (ME-2024-004) - 调整固定资产折旧错误</span>
                  <span className="text-[#1890ff]">315,000 元</span>
                </div>
                <p className="text-gray-600">借：管理费用 - 折旧费 315,000</p>
                <p className="text-gray-600">贷：累计折旧 315,000</p>
              </div>
            </div>
            <div className="p-3 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowEntriesModal(false)}
                className="px-4 py-1.5 bg-[#1890ff] text-white text-[9px] font-bold rounded"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
