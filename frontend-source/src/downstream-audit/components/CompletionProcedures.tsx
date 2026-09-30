import React, { useState } from 'react';
import { CompletionProcedureItem } from '../types';
import {
  CheckCheck,
  CheckCircle2,
  Clock,
  Circle,
  FileCheck2,
  FileText,
  Send,
  X,
} from 'lucide-react';

interface CompletionProceduresProps {
  procedures: CompletionProcedureItem[];
  onUpdateProcedures: (newProc: CompletionProcedureItem[]) => void;
}

export const CompletionProcedures: React.FC<CompletionProceduresProps> = ({
  procedures,
  onUpdateProcedures,
}) => {
  const [activeStep, setActiveStep] = useState<number>(4); // Step 4 is active
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  const steps = [
    { id: 1, title: '期后事项', count: '5/5 已完成', completed: true },
    { id: 2, title: '持续经营评估', count: '4/4 已完成', completed: true },
    { id: 3, title: '关联方最终汇总', count: '2/2 已完成', completed: true },
    { id: 4, title: '管理层声明书', count: '3/3 已完成', completed: true },
    { id: 5, title: '认定覆盖评价', count: '0/5 待完成', completed: false },
  ];

  const handleToggleStatus = (id: string) => {
    const updated = procedures.map((p) => {
      if (p.id === id) {
        const nextStatus = p.status === '已完成' ? '进行中' : '已完成';
        return { ...p, status: nextStatus as any };
      }
      return p;
    });
    onUpdateProcedures(updated);
  };

  return (
    <div className="flex-1 overflow-auto p-6 font-sans">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[15px] font-bold text-[#1b1b1e] flex items-center">
            <CheckCheck className="w-5 h-5 mr-2 text-[#1890ff]" /> 完成程序管理
          </h2>
          <p className="text-[9px] text-[#75777c] mt-1">项目：示例制造有限公司 2024年度审计</p>
        </div>
      </div>

      {/* Stepper Bar */}
      <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs mb-6">
        <div className="flex items-center justify-between relative">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div
                onClick={() => setActiveStep(s.id)}
                className={`flex items-center space-x-3 cursor-pointer group px-3 py-2 rounded-lg transition-colors ${
                  activeStep === s.id ? 'bg-[#e6f7ff]' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] shadow-2xs ${
                    s.completed
                      ? 'bg-[#52c41a] text-white'
                      : activeStep === s.id
                      ? 'bg-[#1890ff] text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s.completed ? <CheckCircle2 className="w-5 h-5" /> : s.id}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-[#1b1b1e]">{s.title}</p>
                  <p
                    className={`text-[10px] ${
                      s.completed ? 'text-[#52c41a] font-semibold' : 'text-[#75777c]'
                    }`}
                  >
                    {s.count}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-[#c5c6cc] mx-2"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-[#c5c6cc] shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#c5c6cc] bg-[#f9f9ff] flex justify-between items-center">
            <h3 className="font-bold text-[10px] text-[#1b1b1e]">具体审计程序清单</h3>
            <span className="text-[9px] text-[#75777c]">Step {activeStep} 对应程序</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[9px]">
              <thead>
                <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c] font-semibold">
                  <th className="py-2.5 px-4 w-24">编号</th>
                  <th className="py-2.5 px-4">程序名称</th>
                  <th className="py-2.5 px-4 w-20">执行人</th>
                  <th className="py-2.5 px-4 w-28">执行日期</th>
                  <th className="py-2.5 px-4 w-20">复核人</th>
                  <th className="py-2.5 px-4 text-center w-24">状态</th>
                  <th className="py-2.5 px-4 text-center w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c5c6cc]">
                {procedures.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#1890ff]">{p.code}</td>
                    <td className="py-2.5 px-4 font-medium">{p.name}</td>
                    <td className="py-2.5 px-4 text-[#44474c]">{p.executor}</td>
                    <td className="py-2.5 px-4 text-[#75777c]">{p.date}</td>
                    <td className="py-2.5 px-4 text-[#44474c]">{p.reviewer}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === '已完成'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {p.status === '已完成' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(p.id)}
                        className="text-[#1890ff] hover:underline font-semibold text-[11px]"
                      >
                        {p.status === '已完成' ? '标记进行' : '标记完成'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Stats & Report Launch Column */}
        <div className="space-y-6">
          {/* Progress Donut Widget */}
          <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs flex flex-col items-center">
            <h3 className="font-bold text-[10px] text-[#1b1b1e] self-start mb-4">整体完成进度</h3>

            {/* Circular Ring Graphic */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-4">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#f1f3fd"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="56"
                  stroke="#52c41a"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="351.8"
                  strokeDashoffset="35.18"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-extrabold text-[#1b1b1e]">90%</span>
                <span className="block text-[10px] text-[#75777c]">总体进度</span>
              </div>
            </div>

            <div className="w-full space-y-2 text-[9px] pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-[#44474c]">
                  <Circle className="w-2.5 h-2.5 fill-[#52c41a] text-[#52c41a] mr-2" />
                  已完成程序
                </span>
                <span className="font-bold text-[#1b1b1e]">12 项</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-[#44474c]">
                  <Circle className="w-2.5 h-2.5 fill-[#faad14] text-[#faad14] mr-2" />
                  进行中程序
                </span>
                <span className="font-bold text-[#1b1b1e]">2 项</span>
              </div>
            </div>
          </div>

          {/* Report Action Buttons */}
          <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs space-y-3">
            <h3 className="font-bold text-[10px] text-[#1b1b1e]">报告出具与复核提交</h3>
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full py-2.5 bg-[#1890ff] text-white rounded-lg font-bold text-[9px] hover:bg-blue-600 transition-colors flex items-center justify-center shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" /> 生成审计报告草案
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 border border-[#1890ff] text-[#1890ff] hover:bg-blue-50 rounded-lg font-bold text-[9px] transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2" /> 提交三级复核
            </button>
          </div>
        </div>
      </div>

      {/* Audit Report Draft Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-[#c5c6cc]">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="font-bold text-[10px] flex items-center text-[#1b1b1e]">
                <FileCheck2 className="w-4 h-4 mr-2 text-[#1890ff]" />
                标准无保留意见审计报告草案 (预览)
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-[#75777c] hover:text-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 text-[9px] text-[#1b1b1e] space-y-4 max-h-[420px] overflow-y-auto leading-relaxed">
              <div className="text-center font-bold text-[11px] border-b pb-2">审计报告</div>
              <p className="text-gray-500 text-right">报告编号：RoadwiseLab-AR-2024-0098</p>
              <p className="font-bold">示例制造有限公司全体股东：</p>
              <p className="indent-6">
                我们审计了示例制造有限公司（以下简称“贵公司”）财务报表，包括 2024 年 12 月 31 日的资产负债表，2024 年度的利润表、现金流量表、股东权益变动表以及相关财务报表附注。
              </p>
              <p className="font-bold pt-2">一、审计意见</p>
              <p className="indent-6">
                我们认为，后附的财务报表在所有重大方面按照企业会计准则的规定编制，公允反映了贵公司 2024 年 12 月 31 日的财务状况以及 2024 年度的经营成果和现金流量。
              </p>
              <p className="font-bold pt-2">二、形成审计意见的基础</p>
              <p className="indent-6">
                我们按照中国注册会计师审计准则的规定执行了审计工作...
              </p>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-1.5 border rounded text-[9px]"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  alert('报告草案已导出为 Word / PDF 格式！');
                  setShowReportModal(false);
                }}
                className="px-4 py-1.5 bg-[#1890ff] text-white text-[9px] font-bold rounded"
              >
                下载完整报告 (.docx)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-[#c5c6cc] p-5">
            <h3 className="font-bold text-[11px] mb-2 text-[#1b1b1e]">确认提交三级复核？</h3>
            <p className="text-[9px] text-[#75777c] leading-relaxed mb-4">
              提交后，该项目的全部底稿（共 28 份错报、16 份合规问题、试算平衡表）将移交至项目合伙人（李四）进行最终签发审阅。
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-1.5 border rounded text-[9px]"
              >
                取消
              </button>
              <button
                onClick={() => {
                  alert('项目已成功提交三级合伙人复核！');
                  setShowSubmitModal(false);
                }}
                className="px-4 py-1.5 bg-[#1890ff] text-white text-[9px] font-bold rounded"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
