import React from 'react';
import { NavView } from '../types';
import {
  ClipboardList,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ApCcExecutionProps {
  onNavigate: (view: NavView) => void;
}

export const ApCcExecution: React.FC<ApCcExecutionProps> = ({ onNavigate }) => {
  const tasks = [
    { code: 'AP-AR-001', name: '应收账款函证程序', type: 'AP (分析程序)', status: '已完成', reviewer: '李四' },
    { code: 'AP-INV-001', name: '存货跌价准备测试', type: 'CC (控制测试)', status: '已完成', reviewer: '李四' },
    { code: 'AP-REV-010', name: '收入截止性测试', type: 'AP (分析程序)', status: '已完成', reviewer: '李四' },
    { code: 'CC-PAY-002', name: '付款审批内控抽查', type: 'CC (控制测试)', status: '进行中', reviewer: '张三' },
  ];

  return (
    <div className="flex-1 overflow-auto p-6 font-sans space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[15px] font-bold text-[#1b1b1e] flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-[#1890ff]" /> AP / CC 自动化执行与数据流转
          </h2>
          <p className="text-[9px] text-[#75777c] mt-1">分析程序 (AP) 与控制测试 (CC) 自动化引擎执行看板</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-[#c5c6cc] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1890ff] flex items-center justify-center font-bold">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-[#1b1b1e] text-[10px]">全量序时账数据解析引擎</h3>
            <p className="text-[9px] text-[#75777c]">已成功导入 142,500 条凭证分录，与业务系统同步完结</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('working-papers')}
          className="px-4 py-2 bg-[#1890ff] text-white rounded font-semibold text-[9px] hover:bg-blue-600 flex items-center shadow-xs cursor-pointer"
        >
          查看关联底稿 <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </button>
      </div>

      <div className="bg-white rounded-lg border border-[#c5c6cc] shadow-xs overflow-hidden">
        <div className="p-4 border-b bg-[#f9f9ff] font-bold text-[10px] text-[#1b1b1e]">
          AP/CC 任务流水与实时状态
        </div>
        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="bg-[#f9f9ff] border-b border-[#c5c6cc] text-[#44474c] font-semibold">
              <th className="py-2.5 px-4">程序编号</th>
              <th className="py-2.5 px-4">程序名称</th>
              <th className="py-2.5 px-4">程序类型</th>
              <th className="py-2.5 px-4">复核人</th>
              <th className="py-2.5 px-4 text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c5c6cc]">
            {tasks.map((t) => (
              <tr key={t.code} className="hover:bg-gray-50">
                <td className="py-2.5 px-4 font-mono font-bold text-[#1890ff]">{t.code}</td>
                <td className="py-2.5 px-4 font-medium">{t.name}</td>
                <td className="py-2.5 px-4 text-[#75777c]">{t.type}</td>
                <td className="py-2.5 px-4 text-[#44474c]">{t.reviewer}</td>
                <td className="py-2.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.status === '已完成'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
