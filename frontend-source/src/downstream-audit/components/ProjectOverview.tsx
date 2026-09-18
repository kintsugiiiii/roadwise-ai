import React from 'react';
import { NavView } from '../types';
import {
  Building2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ProjectOverviewProps {
  onNavigate: (view: NavView) => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 overflow-auto p-6 font-sans space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded text-[9px] bg-white/20 text-blue-100 font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5 mr-1" /> 制造业重点项目
            </div>
            <h1 className="text-lg font-extrabold tracking-tight">
              示例制造有限公司 2024年度财务报表审计
            </h1>
            <p className="text-[9px] text-blue-200 mt-2 max-w-2xl leading-relaxed">
              本项目涵盖资产负债表、利润表及现金流量表的全面实质性测试与合规审查，当前进入完成阶段程序。
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('misstatement')}
              className="px-4 py-2 bg-white text-[#1890ff] font-bold rounded-lg text-[9px] shadow hover:bg-blue-50 transition-colors flex items-center cursor-pointer"
            >
              错报汇总 (28笔) <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
            <button
              onClick={() => onNavigate('working-papers')}
              className="px-4 py-2 bg-[#1890ff] text-white font-bold rounded-lg text-[9px] hover:bg-blue-600 transition-colors flex items-center cursor-pointer"
            >
              查阅底稿库 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate('misstatement')}
          className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs hover:border-[#1890ff] cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-bold text-[#75777c]">错报与调整状态</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-red-100 text-red-600 font-bold">
              8 笔高风险
            </span>
          </div>
          <p className="text-lg font-extrabold text-[#1b1b1e]">¥ 3,245,000</p>
          <p className="text-[9px] text-[#75777c] mt-1">错报总额，目前已调整 12 笔 (42.9%)</p>
        </div>

        <div
          onClick={() => onNavigate('compliance')}
          className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs hover:border-[#1890ff] cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-bold text-[#75777c]">合规排查结果</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">
              6 项重大
            </span>
          </div>
          <p className="text-lg font-extrabold text-[#1b1b1e]">16 项问题</p>
          <p className="text-[9px] text-[#75777c] mt-1">涵盖税务、资金、合同及环保合规性</p>
        </div>

        <div
          onClick={() => onNavigate('trial-balance')}
          className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs hover:border-[#1890ff] cursor-pointer transition-all"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-[9px] font-bold text-[#75777c]">试算平衡检验</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold">
              0 借贷差额
            </span>
          </div>
          <p className="text-lg font-extrabold text-[#1890ff]">¥ 128,245,000</p>
          <p className="text-[9px] text-[#75777c] mt-1">调整后资产负债表借贷平衡</p>
        </div>
      </div>

      {/* Audit Team & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs space-y-4">
          <h3 className="font-bold text-[10px] text-[#1b1b1e] flex items-center">
            <Users className="w-4 h-4 mr-2 text-[#1890ff]" /> 审计项目组分工
          </h3>
          <div className="space-y-3 text-[9px]">
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded">
              <div>
                <p className="font-bold text-[#1b1b1e]">李四 (项目合伙人 / 签字 CPA)</p>
                <p className="text-[#75777c]">负责总体质量控制与三级复核</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1890ff] font-bold">合伙人</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded">
              <div>
                <p className="font-bold text-[#1b1b1e]">张三 (现场项目经理)</p>
                <p className="text-[#75777c]">负责现场实质性测试、错报汇总及底稿编制</p>
              </div>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold">项目经理</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#c5c6cc] shadow-xs space-y-4">
          <h3 className="font-bold text-[10px] text-[#1b1b1e] flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-[#1890ff]" /> 审计关键节点里程碑
          </h3>
          <div className="space-y-2 text-[9px]">
            <div className="flex items-center justify-between text-green-600 font-medium">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> 预审与内控测试阶段</span>
              <span>2024-11-20 已完成</span>
            </div>
            <div className="flex items-center justify-between text-green-600 font-medium">
              <span className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" /> 函证发函与实质性测试</span>
              <span>2024-12-18 已完成</span>
            </div>
            <div className="flex items-center justify-between text-[#1890ff] font-bold">
              <span className="flex items-center"><Clock className="w-4 h-4 mr-2" /> 完成阶段程序与报告出具</span>
              <span>2024-12-25 进行中</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
