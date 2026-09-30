import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CaseLibraryProjectDetail from "./CaseLibraryProjectDetail";

type Project = { id: string; name: string; client: string };
type Props = { projects: Project[]; selectedProjectId?: string; onSelectProject?: (id: string) => void };

const definitions: Record<string, { names: string[]; colors: string[]; tasks: string[][] }> = {
  "audit-handoff": { names: ["市场规模", "场景观察", "用户画像", "方案实验", "转化验证", "阶段复盘"], colors: ["#e6f7ff", "#fffbe6", "#fffbe6", "#f6ffed", "#f0f2f5", "#f9f0ff"], tasks: [["统计商圈客流", "分析地图热力", "估算首批市场容量"], ["观察入场时段", "记录座位偏好", "统计高峰期占座率"], ["建立用户画像", "整理核心任务", "确认付费触发点"], ["设计预约方案", "运行 A/B 测试", "记录到店转化"], ["跟踪预约漏斗", "验证到店率", "测算月卡续费率"], ["对比验证数据", "确认关键假设", "决定下一轮投入"]] },
  huadong: { names: ["目标与假设", "用户访谈", "问卷数据", "需求优先级", "MVP验证", "阶段复盘"], colors: ["#f0f2f5", "#e6f7ff", "#fffbe6", "#f6ffed", "#f0f2f5", "#f9f0ff"], tasks: [["明确三类目标用户", "验证持续使用意愿", "定义完成率提升 20%", "建立假设验证表"], ["招募 12 名用户", "完成项目背景访谈", "追问推进卡点与替代方案", "整理用户画像与问题标签"], ["设计用户基本信息模块", "收集项目执行现状评分", "测试功能需求", "清洗无效样本并输出分析"], ["建立 12 项功能池", "计算 RICE 评分", "确定 MVP 首版范围", "输出用户流程"], ["招募 20—30 名测试用户", "创建项目并输入目标", "生成首个任务", "记录激活、完成与留存"], ["对比验证前后数据", "判断核心假设", "分类问题", "输出 MVP 验证报告"]] },
  xincheng: { names: ["流程目标", "现状基线", "信息源接入", "指标口径", "SOP试运行", "质量复盘"], colors: ["#f0f2f5", "#e6f7ff", "#fffbe6", "#f6ffed", "#f0f2f5", "#f9f0ff"], tasks: [["梳理立项流程", "测算项目周期", "设定材料完整率"], ["盘点项目耗时", "统计返工次数", "记录材料缺失点"], ["接入项目文档", "接入访谈与问卷", "建立结论溯源"], ["统一完成率口径", "统一材料完整率", "统一评审标准"], ["选择试运行项目", "记录流程卡点", "统计 Agent 采纳率"], ["对比试运行指标", "删除低价值步骤", "输出 SOP 变更记录"]] },
};
const projectSummaries: Record<string,string> = {
 "社区共享自习室验证": "针对备考学生和远程办公者，研究社区共享自习室是否存在稳定需求，以及用户愿意为何种空间服务和价格付费。项目通过场景观察、竞品分析和小规模运营实验，验证从预约到到店再到月卡续费的商业转化路径。",
 "团队研究流程 SOP": "将团队现有的研究项目流程标准化，从立项、信息收集、证据整理到阶段评审建立统一工作方式。目标是减少重复返工和材料遗漏，让每个关键结论都能追溯到信息来源，并缩短项目从立项到复盘的周期。",
 "Roadwise 用户需求验证": "围绕项目负责人在立项、调研和阶段推进中的真实需求，验证 Roadwise 是否能帮助用户把模糊想法拆解为可执行任务，并通过证据和指标完成阶段决策。目标是验证 MVP 的核心使用价值，提升首个任务完成率和项目持续推进率。"
};

function ProjectNode({ data }: NodeProps) {
  return <div onClick={() => (data as any).onSelect?.(data.nodeId, "node")} className={`w-[220px] cursor-pointer rounded-lg border-2 px-4 py-3 shadow-sm transition-shadow ${data.selected ? "ring-4 ring-[#4f80d8]/25" : ""}`} style={{ background: data.color, borderColor: data.selected ? "#315ca9" : "#536174" }}><Handle id="main-target-top" type="target" position={Position.Top} /><Handle id="main-target-bottom" type="target" position={Position.Bottom} /><Handle id="main-target-left" type="target" position={Position.Left} /><Handle id="task-source-left" type="source" position={Position.Left} /><Handle id="task-source-right" type="source" position={Position.Right} /><Handle id="chain-source-bottom" type="source" position={Position.Bottom} /><Handle id="chain-source-top" type="source" position={Position.Top} /><Handle id="chain-source-right" type="source" position={Position.Right} /><div className="text-center text-[13px] font-black text-[#24344b]">{data.label}</div></div>;
}

function TaskNode({ data }: NodeProps) {
  return <div onClick={() => (data as any).onSelect?.(data.parentId, data.nodeId)} className={`w-[260px] cursor-pointer rounded-lg border-2 px-3 py-2.5 text-center text-[11px] font-bold leading-4 break-words shadow-sm transition-shadow ${data.selected ? "ring-4 ring-[#4f80d8]/30" : ""}`} style={{ background: data.color, borderColor: data.selected ? "#315ca9" : "#69778a", color: data.selected ? "#244f9d" : "#52647b" }}><Handle id="task-target-top" type="target" position={Position.Top} /><Handle id="task-target-left" type="target" position={Position.Left} /><Handle id="task-target-right" type="target" position={Position.Right} /><Handle id="task-source" type="source" position={Position.Bottom} /><Handle id="task-source-right" type="source" position={Position.Right} /><span>{data.label}</span></div>;
}

function ProjectTitleNode({ data }: NodeProps) {
  return <div className="pointer-events-none w-[420px] text-[15px] font-black tracking-wide text-[#405575]">{data.label}</div>;
}

const nodeTypes = { projectNode: ProjectNode, taskNode: TaskNode, projectTitle: ProjectTitleNode };

const defaultGeneratedNames = ["项目目标", "资料整理", "任务拆解", "方案验证", "阶段执行", "阶段复盘"];
const normalizeGeneratedGraph = (graph: any[]) => {
  const generated = graph.slice(0, 6);
  return {
    names: defaultGeneratedNames.map((fallback, index) => generated[index]?.name || generated[index]?.label || fallback),
    colors: defaultGeneratedNames.map((_, index) => ["#e6f7ff", "#fffbe6", "#fffbe6", "#f6ffed", "#f0f2f5", "#f9f0ff"][index]),
    tasks: defaultGeneratedNames.map((_, index) => Array.isArray(generated[index]?.tasks) ? generated[index].tasks : []),
  };
};

export default function ReactFlowCaseLibraryGraphView({ projects, selectedProjectId, onSelectProject }: Props) {
  const generatedProjectName = useMemo(() => {
    try {
      const state = JSON.parse(localStorage.getItem("roadwise.project-state.current-project.v1") || "null");
      return typeof state?.projectName === "string" ? state.projectName : "";
    } catch {
      return "";
    }
  }, [projects]);
  const normalizedProjects = useMemo(() => {
    const unique = Array.from(new Map(projects.map((project) => [project.name, project] as const)).values());
    return [...unique].sort((a, b) => {
      if (a.name === generatedProjectName) return 1;
      if (b.name === generatedProjectName) return -1;
      if (a.id === "current-project") return 1;
      if (b.id === "current-project") return -1;
      return 0;
    });
  }, [projects, generatedProjectName]);
  const [generatedProject, setGeneratedProject] = useState<{ name?: string; summary?: string; descriptions?: Record<string, string> }>({});
  const [editableDefinitions, setEditableDefinitions] = useState(() => {
    try {
      const state = JSON.parse(localStorage.getItem('roadwise.project-state.current-project.v1') || 'null');
      const graph = Array.isArray(state?.graph) ? state.graph : [];
      if (!graph.length && state?.projectName) {
        return { ...definitions, 'current-project': { names: ['项目目标', '资料整理', '任务拆解', '阶段评审'], colors: ['#f0f2f5', '#e6f7ff', '#f6ffed', '#f9f0ff'], tasks: [['明确项目目标', '确认成功标准'], ['收集项目资料', '整理关键信息'], ['拆解执行任务', '明确阶段产出'], ['复盘项目结果', '确定下一步行动']] } };
      }
      if (!graph.length) return definitions;
      return { ...definitions, 'current-project': normalizeGeneratedGraph(graph) };
    } catch { return definitions; }
  });
  useEffect(() => {
    const syncGeneratedGraph = () => {
      try {
        const state = JSON.parse(localStorage.getItem('roadwise.project-state.current-project.v1') || 'null');
        const graph = Array.isArray(state?.graph) ? state.graph : [];
        const summary = typeof state?.summary === 'string' ? state.summary : '';
        const descriptions = Object.fromEntries((Array.isArray(state?.graph) ? state.graph : []).map((item: any, index: number) => [item?.name || item?.label || `阶段${index + 1}`, item?.description || '暂无阶段说明。']));
        setGeneratedProject({ name: typeof state?.projectName === 'string' ? state.projectName : undefined, summary: summary || undefined, descriptions });
        if (!graph.length) return;
        setEditableDefinitions((current) => ({ ...current, 'current-project': normalizeGeneratedGraph(graph) }));
      } catch { /* keep existing graph */ }
    };
    syncGeneratedGraph();
    window.addEventListener('roadwise-project-state-updated', syncGeneratedGraph);
    return () => window.removeEventListener('roadwise-project-state-updated', syncGeneratedGraph);
  }, []);
  const [localSelection, setLocalSelection] = useState(
    selectedProjectId && selectedProjectId !== "all"
      ? selectedProjectId
      : projects[0]?.id ?? "all",
  );
  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== "all") setLocalSelection(selectedProjectId);
  }, [selectedProjectId]);
  const selection = localSelection || "all";
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const handleSelect = useCallback((nodeId: string, taskId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedTaskId(taskId === "node" ? null : taskId);
  }, []);
  const handleNodeClick = useCallback((node: Node) => {
    if (connectSource && connectSource !== node.id) {
      setEdges((current) => [...current, { id: `manual-${connectSource}-${node.id}-${Date.now()}`, source: connectSource, target: node.id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22 }, style: { stroke: "#315ca9", strokeWidth: 3 } }]);
      setConnectSource(null);
      return;
    }
    handleSelect((node.data as any).parentId ?? (node.data as any).nodeId, (node.data as any).parentId ? node.id : "node");
  }, [connectSource, handleSelect]);
  const visible = useMemo(() => selection !== "all" ? normalizedProjects.filter((p) => p.id === selection) : normalizedProjects, [normalizedProjects, selection]);
  const initial = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    visible.forEach((project, projectIndex) => {
      const definition = project.name === generatedProject.name
        ? editableDefinitions['current-project']
        : editableDefinitions[project.id] ?? editableDefinitions.huadong;
      const gridColumn = visible.length > 1 ? projectIndex % 2 : 0;
      const gridRow = visible.length > 1 ? Math.floor(projectIndex / 2) : 0;
      const baseX = 90 + gridColumn * 1400;
      const baseY = 120 + gridRow * 2400;
      const stageOffsets = [0, 1, 2].reduce<number[]>((offsets, groupIndex) => {
        if (groupIndex === 0) return [0];
        const previousTaskCount = Math.max(
          definition.tasks[groupIndex - 1]?.length ?? 0,
          definition.tasks[groupIndex + 2]?.length ?? 0,
          1,
        );
        offsets.push(offsets[groupIndex - 1] + previousTaskCount * 120 + 150);
        return offsets;
      }, []);
      definition.names.forEach((name, index) => {
        const mainId = `${project.id}-node-${index}`;
        const isRight = index >= 3;
        const x = baseX + (isRight ? 800 : 500);
        const y = baseY + stageOffsets[isRight ? index - 3 : index];
        nodes.push({ id: mainId, type: "projectNode", position: { x, y }, data: { label: name, description: project.name, color: definition.colors[index], nodeId: mainId, selected: selectedNodeId === mainId && !selectedTaskId, onSelect: handleSelect } });
        definition.tasks[index].forEach((task, taskIndex) => {
          const taskId = `${mainId}-task-${taskIndex}`;
          const taskX = isRight ? x + 280 : x - 280;
          // Use deterministic rows instead of centering around the parent node.
          // Centering plus a top clamp caused several long task cards to collapse
          // onto the same y-coordinate at the top of a project graph.
          const taskY = y + (taskIndex - (definition.tasks[index].length - 1) / 2) * 120;
          nodes.push({ id: taskId, type: "taskNode", position: { x: taskX, y: taskY }, data: { label: task, color: definition.colors[index], nodeId: taskId, parentId: mainId, selected: selectedTaskId === taskId, onSelect: handleSelect } });
          edges.push({
            id: `${mainId}-${taskId}`,
            source: mainId,
            sourceHandle: isRight ? "task-source-right" : "task-source-left",
            target: taskId,
            targetHandle: isRight ? "task-target-left" : "task-target-right",
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
            style: { stroke: "#7188a3", strokeWidth: 2.4 },
          });
          if (taskIndex > 0) edges.push({ id: `${mainId}-task-${taskIndex - 1}-${taskId}`, source: `${mainId}-task-${taskIndex - 1}`, sourceHandle: "task-source", target: taskId, targetHandle: "task-target-top", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { stroke: "#61758e", strokeWidth: 2.2 } });
        });
        if (index > 0) {
          const groupTransition = index === 3;
          edges.push({ id: `${project.id}-chain-${index}`, source: `${project.id}-node-${index - 1}`, sourceHandle: groupTransition ? "chain-source-right" : "chain-source-bottom", target: mainId, targetHandle: groupTransition ? "main-target-left" : "main-target-top", type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 22, height: 22 }, style: { stroke: "#405a78", strokeWidth: 3 } });
        }
      });
    });
    return { nodes, edges };
  }, [visible, selectedNodeId, selectedTaskId, handleSelect, editableDefinitions, generatedProjectName]);
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const flowInstance = useRef<any>(null);
  useEffect(() => { setNodes(initial.nodes); setEdges(initial.edges); }, [initial, setNodes, setEdges]);
  useEffect(() => {
    const timer = window.setTimeout(() => flowInstance.current?.fitView({ padding: 0.2, duration: 180 }), 0);
    return () => window.clearTimeout(timer);
  }, [selection, initial.nodes.length, initial.edges.length]);
  useEffect(() => { setSelectedNodeId(null); setSelectedTaskId(null); }, [selection]);
  const reset = useCallback(() => { setNodes(initial.nodes); setEdges(initial.edges); }, [initial, setNodes, setEdges]);
  const editNode = useCallback((node: Node) => {
    const nextLabel = window.prompt("编辑卡片文字", String((node.data as any).label ?? ""));
    if (!nextLabel?.trim()) return;
    setNodes((current) => current.map((item) => item.id === node.id ? { ...item, data: { ...item.data, label: nextLabel.trim() } } : item));
  }, [setNodes]);
  const addBranch = useCallback(() => {
    const parent = nodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.type === "projectNode");
    if (!parent) return;
    const label = window.prompt("新建分支卡片名称", "新任务");
    if (!label?.trim()) return;
    const id = `${parent.id}-manual-${Date.now()}`;
    const newNode: Node = { id, type: "taskNode", position: { x: parent.position.x + 280, y: parent.position.y + 100 }, data: { label: label.trim(), color: (parent.data as any).color ?? "#f0f2f5", nodeId: id, parentId: parent.id, selected: false, onSelect: handleSelect } };
    setNodes((current) => [...current, newNode]);
    setEdges((current) => [...current, { id: `manual-edge-${id}`, source: parent.id, target: id, type: "smoothstep", markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, style: { stroke: "#315ca9", strokeWidth: 2.5 } }]);
  }, [handleSelect, nodes, selectedNodeId, setEdges, setNodes]);
  const selectedDetail = useMemo(() => {
    for (const project of visible) {
      const definition = project.name === generatedProject.name
        ? editableDefinitions['current-project']
        : editableDefinitions[project.id] ?? editableDefinitions.huadong;
      const nodeIndex = definition.names.findIndex((_, index) => `${project.id}-node-${index}` === selectedNodeId);
      if (nodeIndex >= 0) return { project, name: definition.names[nodeIndex], color: definition.colors[nodeIndex], tasks: definition.tasks[nodeIndex] };
    }
    return null;
  }, [visible, selectedNodeId, editableDefinitions, generatedProject.name]);
  const updateDetailFlow = useCallback((flow: string, next: string) => { if (!selectedDetail) return; setEditableDefinitions((current) => { const definition = current[selectedDetail.project.id] ?? current.huadong; const index = definition.names.indexOf(flow); if (index < 0) return current; return { ...current, [selectedDetail.project.id]: { ...definition, names: definition.names.map((item, i) => i === index ? next : item) } }; }); }, [selectedDetail]);
  const updateDetailTask = useCallback((flow: string, index: number, next: string) => { if (!selectedDetail) return; setEditableDefinitions((current) => { const definition = current[selectedDetail.project.id] ?? current.huadong; const nodeIndex = definition.names.indexOf(flow); if (nodeIndex < 0) return current; return { ...current, [selectedDetail.project.id]: { ...definition, tasks: definition.tasks.map((items, i) => i === nodeIndex ? items.map((item, j) => j === index ? next : item) : items) } }; }); }, [selectedDetail]);
  const addDetailTask = useCallback((flow: string, task: string) => { if (!selectedDetail) return; setEditableDefinitions((current) => { const definition = current[selectedDetail.project.id] ?? current.huadong; const nodeIndex = definition.names.indexOf(flow); if (nodeIndex < 0) return current; return { ...current, [selectedDetail.project.id]: { ...definition, tasks: definition.tasks.map((items, i) => i === nodeIndex ? [...items, task] : items) } }; }); }, [selectedDetail]);
  const deleteDetailTask = useCallback((flow: string, index: number) => { if (!selectedDetail) return; setEditableDefinitions((current) => { const definition = current[selectedDetail.project.id] ?? current.huadong; const nodeIndex = definition.names.indexOf(flow); if (nodeIndex < 0) return current; return { ...current, [selectedDetail.project.id]: { ...definition, tasks: definition.tasks.map((items, i) => i === nodeIndex ? items.filter((_, j) => j !== index) : items) } }; }); }, [selectedDetail]);
  const deleteDetailFlow = useCallback((flow: string) => { if (!selectedDetail) return; setEditableDefinitions((current) => { const definition = current[selectedDetail.project.id] ?? current.huadong; const index = definition.names.indexOf(flow); if (index < 0) return current; return { ...current, [selectedDetail.project.id]: { ...definition, names: definition.names.filter((_, i) => i !== index), colors: definition.colors.filter((_, i) => i !== index), tasks: definition.tasks.filter((_, i) => i !== index) } }; }); setSelectedNodeId(null); }, [selectedDetail]);
  const detailDefinition = selectedDetail && (selectedDetail.project.name === generatedProject.name ? editableDefinitions['current-project'] : editableDefinitions[selectedDetail.project.id] ?? editableDefinitions.huadong);
  const detailRow = selectedDetail && detailDefinition && { id: selectedDetail.project.id, label: selectedDetail.project.name, kind: selectedDetail.project.client, stage: selectedDetail.project.id === "current-project" || selectedDetail.project.name === generatedProject.name ? "项目创建" : selectedDetail.project.id === "huadong" ? "MVP验证" : selectedDetail.project.id === "audit-handoff" ? "转化验证" : "SOP试运行", color: selectedDetail.project.client === "创业项目" ? "#36b9c8" : selectedDetail.project.client === "企业项目" ? "#56b96b" : "#7b61c9", version: "v1.0", owner: "项目负责人", projects: `${detailDefinition.names.length} 个节点`, updated: "2026-09-10", flows: detailDefinition.names, descriptions: selectedDetail.project.name === generatedProject.name ? generatedProject.descriptions : undefined, tasks: Object.fromEntries(detailDefinition.names.map((name, index) => [name, detailDefinition.tasks[index]])), summary: selectedDetail.project.name === generatedProject.name ? generatedProject.summary : projectSummaries[selectedDetail.project.name] };
  const layoutKey = initial.nodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join("|");
  return <div className="flex min-h-0 flex-1 flex-col"><div className="flex h-12 shrink-0 items-center gap-3 border-b border-[#e4e9f0] bg-[#fbfcfe] px-4"><strong className="text-[12px] text-[#344761]">项目案例库图谱</strong><select value={selection} onChange={(event) => { setLocalSelection(event.target.value); onSelectProject?.(event.target.value); }} className="rounded-lg border border-[#dce3ed] bg-white px-3 py-2 text-[11px] font-bold text-[#526178]"><option value="all">全部项目</option>{normalizedProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button type="button" onClick={() => { reset(); window.setTimeout(() => flowInstance.current?.fitView({ padding: 0.2, duration: 180 }), 0); }} className="ml-auto rounded-md px-3 py-2 text-[11px] font-bold text-[#718198] hover:bg-[#f1f4f8]">自动排布</button></div><div className="relative min-h-0 flex-1"><ReactFlow key={`${selection}-${layoutKey}`} onInit={(instance) => { flowInstance.current = instance; instance.fitView({ padding: 0.2 }); }} nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_, node) => handleNodeClick(node)} onNodeDoubleClick={(_, node) => editNode(node)} fitView fitViewOptions={{ padding: 0.2 }} minZoom={0.2} maxZoom={2}><Background color="#e6ebf2" gap={24} /><Controls /><MiniMap /></ReactFlow>{detailRow && <CaseLibraryProjectDetail row={detailRow} onClose={() => { setSelectedNodeId(null); setSelectedTaskId(null); }} onReference={() => undefined} onEditFlow={updateDetailFlow} onEditTask={updateDetailTask} onAddTask={addDetailTask} onDeleteTask={deleteDetailTask} onDeleteFlow={deleteDetailFlow} />}</div></div>;
}
