import { useState } from 'react';
import { X } from 'lucide-react';
export type CaseLibraryDetailRow = { id:string; label:string; kind:string; stage:string; color:string; version:string; owner:string; projects:string; updated:string; summary?:string; flows?:string[]; descriptions?:Record<string,string>; highlightedFlow?:string; tasks?:Record<string,string[]> };
type DetailActions = { onEditFlow?: (flow:string,next:string)=>void; onDeleteFlow?: (flow:string)=>void; onEditTask?: (flow:string,index:number,next:string)=>void; onDeleteTask?: (flow:string,index:number)=>void; onAddTask?: (flow:string,task:string)=>void };
const defaultTasks: Record<string,string[]> = {
 '市场规模':['统计商圈客流','分析地图热力','估算首批市场容量'],
 '场景观察':['观察入场时段','记录座位偏好','统计高峰期占座率'],
 '用户画像':['建立用户画像','整理核心任务','确认付费触发点'],
 '竞品拆解':['整理竞品定价','对比座位密度与服务','提炼差异化机会'],
 '方案实验':['设计预约方案','运行 A/B 测试','记录到店转化'],
 '转化验证':['跟踪预约漏斗','验证到店率','测算月卡续费率'],
 '目标与假设':['明确三类目标用户','验证持续使用意愿','定义完成率提升 20%','建立假设验证表'],
 '用户访谈':['招募 12 名用户','完成项目背景访谈','追问推进卡点与替代方案','整理用户画像与问题标签'],
 '问卷数据':['设计用户基本信息模块','收集项目执行现状评分','测试功能需求','清洗无效样本并输出分析'],
 '需求优先级':['建立 12 项功能池','计算 RICE 评分','确定 MVP 首版范围','输出用户流程'],
 'MVP验证':['招募 20—30 名测试用户','创建项目并输入目标','生成首个任务','记录激活、完成与留存'],
 '阶段复盘':['对比验证前后数据','确认关键假设','记录未解决问题','决定下一轮投入'],
 '流程目标':['梳理立项流程','测算项目周期','设定材料完整率'],
 '现状基线':['盘点项目耗时','统计返工次数','记录材料缺失点'],
 '信息源接入':['接入项目文档','接入访谈与问卷','建立结论溯源'],
 '指标口径':['统一完成率口径','统一材料完整率','统一评审标准'],
 'SOP试运行':['选择试运行项目','记录流程卡点','统计 Agent 采纳率'],
 '质量复盘':['对比试运行指标','删除低价值步骤','输出 SOP 变更记录'],
};
export default function CaseLibraryProjectDetail({row,onClose,onReference,onEditFlow,onDeleteFlow,onEditTask,onDeleteTask,onAddTask}: {row:CaseLibraryDetailRow; onClose:()=>void; onReference:(value:string)=>void} & DetailActions) {
 const flows=row.flows??[row.stage]; const resolvedTasks = flows.reduce<Record<string, string[]>>((result, flow) => { result[flow] = row.tasks?.[flow] ?? defaultTasks[flow] ?? ['明确该节点目标', '完成节点执行与记录', '输出阶段成果并提交评审']; return result; }, {}); const [editing,setEditing]=useState<{kind:'flow'|'task';flow:string;index?:number}|null>(null); const [draft,setDraft]=useState('');
 const save=()=>{if(!editing)return;const v=draft.trim();if(v){editing.kind==='flow'?onEditFlow?.(editing.flow,v):onEditTask?.(editing.flow,editing.index??0,v)}setEditing(null)};
 const input=(kind:'flow'|'task',flow:string,index:number|undefined,value:string)=><input autoFocus value={draft} onChange={e=>setDraft(e.target.value)} onBlur={save} onKeyDown={e=>{if(e.key==='Enter')save();if(e.key==='Escape')setEditing(null)}} className="min-w-0 flex-1 rounded border border-[#9bb4df] px-2 py-1 outline-none"/>;
 return <aside className="absolute right-0 top-0 bottom-0 z-20 flex w-[430px] flex-col border-l border-[#dce3ed] bg-white shadow-[-6px_0_16px_rgba(40,57,88,.08)]"><header className="flex items-start justify-between border-b border-[#e4e8ef] px-6 py-5"><div><span className="text-[14px] font-bold text-[#7d899a]">{row.kind} · {row.stage}</span><h3 className="mt-2 text-[21px] font-black text-[#2f405a]">{row.label}</h3></div><button type="button" onClick={onClose}><X className="h-5 w-5 text-[#7d899b]"/></button></header><div className="min-h-0 flex-1 overflow-y-auto p-6"><div className="rounded-xl bg-[#f5f7fa] p-5 text-[14px] font-bold leading-6 text-[#6d7b90]">{row.summary??'该案例围绕明确的问题开展研究，通过信息收集、方案验证和阶段评审，形成可复用的方法与成果。'}</div><h4 className="mt-7 border-b border-[#e7ebf0] pb-3 text-[15px] font-black text-[#586982]">节点环节</h4><div className="mt-4 space-y-3">{flows.map((flow,index)=>{const tasks=resolvedTasks[flow]??[];return <div key={`${flow}-${index}`} className="rounded-xl border border-[#e5eaf1] bg-white p-4"><div className="flex items-center gap-2"><span className="text-[#315ca9]">●</span>{editing?.kind==='flow'&&editing.flow===flow?input('flow',flow,undefined,flow):<strong className="min-w-0 flex-1 text-[15px] text-[#40536f]">{flow}</strong>}<button type="button" className="text-[11px] font-black text-[#315ca9]" onClick={()=>{setEditing({kind:'flow',flow});setDraft(flow)}}>编辑</button>{onDeleteFlow&&<button type="button" className="text-[11px] text-[#c84b5b]" onClick={()=>onDeleteFlow(flow)}>删除</button>}</div><p className="mt-2 text-[13px] leading-6 text-[#8491a4]">{row.descriptions?.[flow]??'记录该节点的关键输入、执行过程、判断依据和阶段产出。'}</p>{tasks.map((task,taskIndex)=><div key={`${flow}-${taskIndex}`} className="mt-2 flex items-center gap-2 text-[13px] text-[#64748b]"><span>•</span>{editing?.kind==='task'&&editing.flow===flow&&editing.index===taskIndex?input('task',flow,taskIndex,task):<span className="min-w-0 flex-1">{task}</span>}<button type="button" className="text-[10px] font-black text-[#315ca9]" onClick={()=>{setEditing({kind:'task',flow,index:taskIndex});setDraft(task)}}>编辑</button>{onDeleteTask&&<button type="button" className="text-[10px] text-[#c84b5b]" onClick={()=>onDeleteTask(flow,taskIndex)}>删除</button>}</div>)}{onAddTask&&<button type="button" className="mt-2 text-[12px] font-black text-[#315ca9]" onClick={()=>{const v=window.prompt('新增任务')?.trim();if(v)onAddTask(flow,v)}}>＋ 新增任务</button>}</div>})}</div></div></aside>;
}
