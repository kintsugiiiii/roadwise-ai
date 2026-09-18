import React from 'react';
import { NavView } from '../types';
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  FileSearch,
  ArrowRight,
} from 'lucide-react';

interface RiskInspectionProps {
  onNavigate: (view: NavView) => void;
}

export const RiskInspection: React.FC<RiskInspectionProps> = ({ onNavigate }) => {
  const riskSignals = [
    {
      code: 'RS-INV-01',
      subject: '存货跌价准备',
      level: '高风险',
      reason: '期末存货周转率大幅下降，部分库龄超2年的呆滞产成品未计提跌价',
      amount: '1,250,000 元',
      paperRef: 'AP-INV-001',
    },
    {
      code: 'RS-AR-02',
      subject: '应收账款账龄',
      level: '高风险',
      reason: '代理商账龄迁徙率异常升高，坏账准备按历史组合比例计提可能严重不足',
      amount: '860,000 元',
      paperRef: 'AP-AR-002',
    },
    {
      code: 'RS-REV-03',
      subject: '营业收入截止性',
      level: '中风险',
      reason: '12月最后3天集中确认发货收入 520 万元，验收单签署日期跨至次年1月',
      amount: '520,000 元',
      paperRef: 'AP-REV-010',
    },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 font-sans space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[15px] font-bold text-[#1b1b1e] flex items-center">
            <ShieldAlert className="w-5 h-5 mr-2 text-[#ff4d4f]" /> 风险信号预警与智能排查
          </h2>
          <p className="text-[9px] text-[#75777c] mt-1">系统基于财务指标异常模型与行业对比模型自动生成的预警信号</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <span className="text-[9px] font-bold text-red-600 flex items-center">
            <Flame className="w-4 h-4 mr-1" /> 重大错报风险信号
          </span>
          <p className="text-xl font-extrabold text-red-700 mt-2">2 项</p>
          <p className="text-[9px] text-red-500 mt-1">集中于存货与应收账款减值准备</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <span className="text-[9px] font-bold text-amber-700 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" /> 一般观察信号
          </span>
          <p className="text-xl font-extrabold text-amber-800 mt-2">5 项</p>
          <p className="text-[9px] text-amber-600 mt-1">收入截止性与折旧费率计算</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <span className="text-[9px] font-bold text-blue-700 flex items-center">
            <FileSearch className="w-4 h-4 mr-1" /> 已排查并生成错报
          </span>
          <p className="text-xl font-extrabold text-blue-800 mt-2">28 笔</p>
          <p className="text-[9px] text-blue-600 mt-1">已自动推送到错报汇总模块</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#c5c6cc] shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-[#f9f9ff] font-bold text-[10px] text-[#1b1b1e]">
          高风险信号明细与关联审计底稿
        </div>
        <div className="divide-y divide-[#c5c6cc] text-[9px]">
          {riskSignals.map((rs) => (
            <div key={rs.code} className="p-4 hover:bg-gray-50 flex justify-between items-center">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-[#1890ff]">{rs.code}</span>
                  <span className="font-bold text-[#1b1b1e]">{rs.subject}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-600 font-bold">
                    {rs.level}
                  </span>
                </div>
                <p className="text-[#44474c]">{rs.reason}</p>
              </div>

              <div className="text-right space-y-1">
                <p className="font-bold text-[#1b1b1e] text-[10px]">{rs.amount}</p>
                <button
                  onClick={() => onNavigate('misstatement')}
                  className="text-[#1890ff] hover:underline font-semibold flex items-center justify-end"
                >
                  去错报汇总查看 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
