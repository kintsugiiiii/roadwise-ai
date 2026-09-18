import React from 'react';
import { Archive, CheckCircle2, FileCheck2, History, PenLine } from 'lucide-react';

export const ReportSignoff: React.FC<{ workflowProgress: number }> = ({ workflowProgress }) => {
  const archived = workflowProgress >= 6;
  const checks = [
    ['报告终稿', '审计报告 v1.0', '已锁定'],
    ['签字审批', '项目合伙人、签字 CPA', archived ? '已签发' : '待签发'],
    ['归档清单', '底稿 18 份 · 附件 36 份', '校验通过'],
    ['知识回流', '标签结论与项目经验', archived ? '已回流' : '待归档后回流'],
  ];
  return (
    <div className="h-full flex-1 overflow-y-auto bg-[#f5f7fa] p-5 custom-scrollbar">
      <div className="mx-auto max-w-[1120px]">
        <header className="flex items-start justify-between gap-5 border-b border-[#dbe2ec] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-black text-[#253750]">报告签发与项目归档</h1>
              <span className="rounded bg-[#e7eefb] px-2 py-1 text-[8px] font-black text-[#315da8]">第 6 / 6 步</span>
            </div>
          </div>
          <span className={`rounded px-3 py-2 text-[9px] font-black ${archived ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-[#315ca9]'}`}>{archived ? '已归档' : '待签发'}</span>
        </header>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {checks.map(([title, value, status], index) => (
            <article key={title} className="border-y border-[#dce3ed] bg-white px-4 py-4">
              <div className="flex items-center justify-between">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-[#eef3fb] text-[#315ca9]">{index === 0 ? <FileCheck2 className="h-4 w-4" /> : index === 1 ? <PenLine className="h-4 w-4" /> : index === 2 ? <Archive className="h-4 w-4" /> : <History className="h-4 w-4" />}</span>
                <span className="text-[8px] font-black text-emerald-700">{status}</span>
              </div>
              <h2 className="mt-3 text-[11px] font-black text-[#34465f]">{title}</h2>
              <p className="mt-1 text-[9px] font-bold text-[#68768a]">{value}</p>
            </article>
          ))}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="overflow-hidden border border-[#dce3ec] bg-white">
            <header className="border-b border-[#e5eaf0] px-5 py-4"><h2 className="text-[12px] font-black text-[#30425b]">签发与归档检查清单</h2></header>
            {[
              ['重大审计事项已在报告中恰当反映', '通过'],
              ['未调整错报低于整体重要性', '通过'],
              ['关键底稿已完成编制与复核签字', '通过'],
              ['报告日期与期后事项检查期间一致', '通过'],
              ['电子底稿目录、附件和审计轨迹完整', '通过'],
              ['知识图谱节点结论已冻结并生成回流版本', archived ? '完成' : '待归档'],
            ].map(([item, status], index) => <div key={item} className={`flex items-center justify-between gap-4 px-5 py-4 ${index ? 'border-t border-[#edf0f4]' : ''}`}><span className="flex items-center gap-2 text-[10px] font-bold text-[#455872]"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />{item}</span><b className="shrink-0 text-[8px] text-emerald-700">{status}</b></div>)}
          </section>
          <aside className="border border-[#dce3ec] bg-white">
            <header className="border-b border-[#e5eaf0] px-5 py-4"><h2 className="text-[12px] font-black text-[#30425b]">签发信息</h2></header>
            <dl className="space-y-3 px-5 py-4 text-[9px]">
              {[
                ['项目负责人', '符金雨'],
                ['质量复核人', '李敏'],
                ['签字 CPA', '李敏'],
                ['报告版本', 'v1.0'],
                ['计划签发日', '2026-08-12'],
                ['归档期限', '签发后 60 日内'],
              ].map(([label, value]) => <div key={label} className="flex justify-between gap-3"><dt className="font-bold text-[#8995a7]">{label}</dt><dd className="font-black text-[#41516b]">{value}</dd></div>)}
            </dl>
            <div className="border-t border-[#e5eaf0] p-4"><button type="button" className="h-10 w-full rounded-md bg-[#315ca9] text-[9px] font-black text-white">{archived ? '查看归档包' : '批准报告并完成归档'}</button></div>
          </aside>
        </div>
      </div>
    </div>
  );
};
