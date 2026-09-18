import React, { useState } from 'react';
import { NavView, GraphNode, GraphEdge } from '../types';
import {
  Search,
  Plus,
  Compass,
  Layers,
  Sparkles,
  MousePointer,
  BoxSelect,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  CheckCircle2,
  FolderKanban,
  FileText,
  AlertTriangle,
  ArrowRight,
  Info,
  X,
  ChevronRight,
} from 'lucide-react';

interface AuditGraphCanvasProps {
  onNavigate: (view: NavView) => void;
}

export const AuditGraphCanvas: React.FC<AuditGraphCanvasProps> = ({ onNavigate }) => {
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'graph' | 'list' | 'review'>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('RS-FRAUD-001');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [mode, setMode] = useState<'select' | 'box'>('select');

  // Node definitions exactly matching screenshot layout
  const nodes: GraphNode[] = [
    { id: 'SCOPE', code: 'PROJECT-SCOPE', title: '项目 Scope', layer: 'scope', layerNum: 1, x: 50, y: 310, detail: '金利集团2024年度专项审计范围 (存货、收入、应收、资金)' },
    
    // First Layer RS (Cyan)
    { id: 'RS-REV-001', code: 'RS-REV-001', title: '收入异常', layer: 'rs', layerNum: 1, x: 280, y: 110, detail: '12月收入增速对比行业均值偏离 +42%' },
    { id: 'RS-AR-001', code: 'RS-AR-001', title: '账龄恶化', layer: 'rs', layerNum: 1, x: 290, y: 260, detail: '1年以上应收账款占比增加 18.5%' },
    { id: 'RS-INV-001', code: 'RS-INV-001', title: '存货增长', layer: 'rs', layerNum: 1, x: 280, y: 430, detail: '库龄超1年呆滞产成品未计提跌价准备 125 万元' },
    { id: 'RS-CAS-001', code: 'RS-CAS-001', title: '资金异常', layer: 'rs', layerNum: 1, x: 290, y: 550, detail: '受限货币资金披露不充分 320 万元' },

    // First Layer AND Composite (Orange / Red)
    { id: 'RS-FRAUD-001', code: 'RS-FRAUD-001', title: '虚增收入', layer: 'and', layerNum: 1, x: 440, y: 180, isTriggered: true, detail: 'AND 复合规则计算得出高风险：收入高增长 + 账龄恶化双重判定' },

    // Second Layer CT (Mint Green)
    { id: 'CT-REV-001', code: 'CT-REV-001', title: '出货审批', layer: 'ct', layerNum: 2, x: 440, y: 360, detail: '发货单未附有客户签字签收记录占比 12%' },
    { id: 'CT-INV-001', code: 'CT-INV-001', title: '盘点控制', layer: 'ct', layerNum: 2, x: 440, y: 500, detail: '年终存货盘点记录存在涂改及事后补签' },

    // Third Layer AP / CC (Warm Yellow & Purple)
    { id: 'AP-REV-001', code: 'AP-REV-001', title: '截止测试', layer: 'ap', layerNum: 3, x: 620, y: 110, detail: '抽取12月最后5天及次年1月前5天发货凭证共 45 笔' },
    { id: 'AP-REV-002', code: 'AP-REV-002', title: '三单一致', layer: 'ap', layerNum: 3, x: 630, y: 240, detail: '合同、发票与出运单不一致差异 250 万元' },
    { id: 'AP-AR-002', code: 'AP-AR-002', title: '应收函证', layer: 'ap', layerNum: 3, x: 600, y: 380, detail: '发函比例 85%，回函相符率 92%' },
    { id: 'AP-INV-001', code: 'AP-INV-001', title: '存货监盘', layer: 'ap', layerNum: 3, x: 600, y: 500, detail: '现场监盘抽查覆盖率 75%' },
    { id: 'CC-REL-001', code: 'CC-REL-001', title: '关联披露', layer: 'cc', layerNum: 3, x: 570, y: 590, detail: '关联方资金占用及担保合规审查' },

    // CPA Review Node (Dark Navy)
    { id: 'HUMAN-REVIEW', code: 'HUMAN-REVIEW', title: 'CPA 确认', layer: 'human', layerNum: 4, x: 790, y: 180, detail: '签字注册会计师李四人工复核并确认最终底稿' },
  ];

  // Edges exactly matching screenshot diagram connections
  const edges: GraphEdge[] = [
    { id: 'e1', from: 'SCOPE', to: 'RS-REV-001', label: 'Scope 筛选', type: 'solid' },
    { id: 'e2', from: 'SCOPE', to: 'RS-AR-001', label: 'Scope 筛选', type: 'solid' },
    { id: 'e3', from: 'SCOPE', to: 'RS-INV-001', label: 'Scope 筛选', type: 'solid' },
    { id: 'e4', from: 'SCOPE', to: 'RS-CAS-001', label: 'Scope 筛选', type: 'solid' },

    { id: 'e5', from: 'RS-REV-001', to: 'RS-FRAUD-001', label: 'AND 依赖', type: 'orange' },
    { id: 'e6', from: 'RS-AR-001', to: 'RS-FRAUD-001', label: 'AND 依赖', type: 'orange' },
    { id: 'e7', from: 'RS-AR-001', to: 'CT-REV-001', label: '激活 CT', type: 'solid' },
    { id: 'e8', from: 'RS-INV-001', to: 'CT-INV-001', label: '激活 CT', type: 'solid' },

    { id: 'e9', from: 'RS-FRAUD-001', to: 'AP-REV-001', label: 'AND 跨层触发', type: 'orange' },
    { id: 'e10', from: 'RS-FRAUD-001', to: 'AP-REV-002', label: 'AND 跨层触发', type: 'orange' },

    { id: 'e11', from: 'CT-REV-001', to: 'AP-REV-001', label: '提交人工确认', type: 'solid' },
    { id: 'e12', from: 'CT-REV-001', to: 'AP-AR-002', label: '调整 AP 参数', type: 'dashed' },
    { id: 'e13', from: 'CT-INV-001', to: 'AP-INV-001', label: '调整 AP 参数', type: 'dashed' },

    { id: 'e14', from: 'RS-CAS-001', to: 'CC-REL-001', label: '汇入完成', type: 'solid' },

    { id: 'e15', from: 'AP-REV-001', to: 'HUMAN-REVIEW', label: '提交人工确认', type: 'solid' },
    { id: 'e16', from: 'AP-REV-002', to: 'HUMAN-REVIEW', label: '提交人工确认', type: 'solid' },
    { id: 'e17', from: 'AP-AR-002', to: 'HUMAN-REVIEW', label: '提交人工确认', type: 'solid' },
  ];

  const filteredNodes = nodes.filter((node) => {
    if (selectedLayerFilter === 'l1' && node.layerNum !== 1) return false;
    if (selectedLayerFilter === 'l2' && node.layerNum !== 2) return false;
    if (selectedLayerFilter === 'l3' && node.layerNum !== 3) return false;
    if (selectedLayerFilter === 'l4' && node.layerNum !== 4) return false;
    if (searchQuery) {
      return (
        node.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const selectedNodeObj = nodes.find((n) => n.id === selectedNodeId);

  // Helper to render node style according to node layer (cyan, orange, green, yellow, purple, dark)
  const getNodeStyles = (layer: string, isSelected: boolean) => {
    const base = 'px-3 py-2 rounded-lg border shadow-xs transition-all cursor-pointer font-sans select-none flex flex-col justify-center items-center text-center text-xs ';
    const ring = isSelected ? 'ring-2 ring-blue-500 scale-105 z-20 shadow-md ' : '';

    switch (layer) {
      case 'scope':
        return base + ring + 'bg-[#f0f2f5] border-[#8c8c8c] text-[#1f1f1f] font-bold';
      case 'rs':
        return base + ring + 'bg-[#e6f7ff] border-[#91d5ff] text-[#003a8c] font-bold hover:bg-[#bae7ff]';
      case 'and':
        return base + ring + 'bg-[#fff1f0] border-[#ffa39e] text-[#cf1322] font-extrabold hover:bg-[#ffccc7]';
      case 'ct':
        return base + ring + 'bg-[#f6ffed] border-[#b7eb8f] text-[#237804] font-bold hover:bg-[#d9f7be]';
      case 'ap':
        return base + ring + 'bg-[#fffbe6] border-[#ffe58f] text-[#ad6800] font-bold hover:bg-[#fff1b8]';
      case 'cc':
        return base + ring + 'bg-[#f9f0ff] border-[#d3ade6] text-[#531dab] font-bold hover:bg-[#efdbff]';
      case 'human':
        return base + ring + 'bg-[#262626] border-[#434343] text-white font-bold hover:bg-[#141414]';
      default:
        return base + ring + 'bg-white border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f6fa] text-[#1b1b1e] font-sans overflow-hidden min-w-0">
      {/* Top Section Header */}
      <div className="bg-white px-6 py-3 border-b border-[#e5e7eb] flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold tracking-tight text-[#1b1b1e]">审计标注系统</h1>
          <span className="text-xs text-[#75777c] font-medium hidden sm:inline">| 知识图谱与 DAG 流程图</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('overview')}
            className="px-3 py-1.5 rounded-full bg-blue-50 text-[#1890ff] hover:bg-blue-100 font-semibold text-xs flex items-center transition-colors cursor-pointer"
          >
            知识图谱 <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            onClick={() => onNavigate('completion')}
            className="px-3 py-1.5 rounded-full bg-gray-100 text-[#44474c] hover:bg-gray-200 font-semibold text-xs flex items-center transition-colors cursor-pointer"
          >
            后续审计流程 <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* View Switcher Bar & Status Context */}
      <div className="bg-white px-6 py-2 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-6 font-medium">
          <button
            onClick={() => onNavigate('overview')}
            className="text-[#75777c] hover:text-[#1890ff] py-1 cursor-pointer transition-colors"
          >
            列表视图
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className="text-[#1890ff] font-bold border-b-2 border-[#1890ff] py-1 cursor-pointer"
          >
            图谱视图
          </button>
          <button
            onClick={() => onNavigate('misstatement')}
            className="text-[#75777c] hover:text-[#1890ff] py-1 cursor-pointer transition-colors"
          >
            审核工作台
          </button>
        </div>

        <div className="text-[#75777c] text-[11px] font-medium flex items-center space-x-2">
          <span>金利集团 · 专项审计 · 项目 DAG 运行中</span>
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
        </div>
      </div>

      {/* DAG Filter & Tool Controls Bar */}
      <div className="bg-white px-6 py-2 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between text-xs gap-3">
        {/* Left Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          <span className="text-[#75777c] font-semibold mr-2 shrink-0">按层查看</span>
          <button
            onClick={() => setSelectedLayerFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedLayerFilter === 'all'
                ? 'bg-[#1890ff] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setSelectedLayerFilter('l1')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedLayerFilter === 'l1'
                ? 'bg-[#1890ff] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            第一层 RS
          </button>
          <button
            onClick={() => setSelectedLayerFilter('l2')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedLayerFilter === 'l2'
                ? 'bg-[#1890ff] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            第二层 CT
          </button>
          <button
            onClick={() => setSelectedLayerFilter('l3')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedLayerFilter === 'l3'
                ? 'bg-[#1890ff] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            第三层 AP/CC
          </button>
          <button
            onClick={() => setSelectedLayerFilter('l4')}
            className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
              selectedLayerFilter === 'l4'
                ? 'bg-[#1890ff] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            第四层 完成
          </button>
        </div>

        {/* Right Tools & Zoom Bar */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMode('select')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              mode === 'select' ? 'bg-blue-100 text-[#1890ff]' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="点选模式"
          >
            <MousePointer className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('box')}
            className={`p-1.5 rounded cursor-pointer transition-colors ${
              mode === 'box' ? 'bg-blue-100 text-[#1890ff]' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="框选模式"
          >
            <BoxSelect className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-300 my-auto"></div>
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 cursor-pointer"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-gray-700 w-10 text-center text-[11px] font-bold">
            {zoomLevel}%
          </span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 rounded text-gray-600 hover:bg-gray-100 cursor-pointer"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="px-2 py-1 rounded border text-gray-600 hover:bg-gray-100 text-[11px] font-medium cursor-pointer"
          >
            适配画布
          </button>
          <button
            onClick={() => alert('已完成自动拓扑排布！')}
            className="px-2 py-1 rounded border text-gray-600 hover:bg-gray-100 text-[11px] font-medium cursor-pointer flex items-center"
          >
            <RefreshCw className="w-3 h-3 mr-1" /> 自动排布
          </button>

          <div className="ml-2 pl-2 border-l border-gray-300 flex items-center text-green-700 font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-600" />
            DAG 已启动，标签关系已建立
          </div>
        </div>
      </div>

      {/* Main Canvas Body (Left Tag Panel + Graph Interactive View) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Floating Tag Pool Sidepane */}
        <div className="w-64 bg-white border-r border-[#e5e7eb] flex flex-col p-4 shadow-2xs z-10 hidden md:flex">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-xs text-[#1b1b1e]">标签图谱</h3>
            <button
              onClick={() => alert('点击新建审计项目')}
              className="text-[11px] text-[#1890ff] font-bold hover:underline flex items-center cursor-pointer"
            >
              + 新建审计项目
            </button>
          </div>

          <p className="text-[10px] text-[#75777c] mb-3">按类型查看审计节点</p>

          <div className="relative mb-4">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索节点"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-[#c5c6cc] rounded text-xs focus:outline-none focus:border-[#1890ff]"
            />
          </div>

          <div className="space-y-1.5 text-xs text-[#44474c] font-medium flex-1 overflow-y-auto">
            <div
              onClick={() => setSelectedLayerFilter('all')}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                selectedLayerFilter === 'all' ? 'bg-blue-50 text-[#1890ff] font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                全部节点
              </span>
              <span className="font-bold text-gray-500">14</span>
            </div>

            <div className="p-2 rounded hover:bg-gray-50 flex justify-between items-center cursor-pointer">
              <span className="flex items-center text-gray-600">
                <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                项目配置
              </span>
              <span className="text-gray-400">1</span>
            </div>

            <div
              onClick={() => setSelectedLayerFilter('l1')}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                selectedLayerFilter === 'l1' ? 'bg-cyan-50 text-cyan-800 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></span>
                风险信号
              </span>
              <span className="font-bold text-gray-500">4</span>
            </div>

            <div
              onClick={() => setSelectedLayerFilter('l2')}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                selectedLayerFilter === 'l2' ? 'bg-green-50 text-green-800 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                内控测试
              </span>
              <span className="font-bold text-gray-500">2</span>
            </div>

            <div
              onClick={() => setSelectedLayerFilter('l3')}
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                selectedLayerFilter === 'l3' ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                审计程序
              </span>
              <span className="font-bold text-gray-500">4</span>
            </div>

            <div className="p-2 rounded hover:bg-gray-50 flex justify-between items-center cursor-pointer">
              <span className="flex items-center text-purple-700">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                合规检查
              </span>
              <span className="font-bold text-gray-500">1</span>
            </div>

            <div className="p-2 rounded hover:bg-gray-50 flex justify-between items-center cursor-pointer">
              <span className="flex items-center text-slate-700">
                <span className="w-2 h-2 rounded-full bg-slate-700 mr-2"></span>
                执行结果
              </span>
              <span className="font-bold text-gray-500">1</span>
            </div>
          </div>
        </div>

        {/* Center Canvas Graph Area with SVG Connectors */}
        <div className="flex-1 relative overflow-auto bg-[#f8f9fc] p-6 flex items-center justify-center">
          <div
            className="relative transition-transform duration-200"
            style={{
              width: '950px',
              height: '660px',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top left',
            }}
          >
            {/* SVG Connector Lines Overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker
                  id="arrow-gray"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8c8c8c" />
                </marker>
                <marker
                  id="arrow-orange"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff4d4f" />
                </marker>
              </defs>

              {/* Draw Edges */}
              {edges.map((e) => {
                const sourceNode = nodes.find((n) => n.id === e.from);
                const targetNode = nodes.find((n) => n.id === e.to);
                if (!sourceNode || !targetNode) return null;

                const x1 = sourceNode.x + 60;
                const y1 = sourceNode.y + 20;
                const x2 = targetNode.x + 10;
                const y2 = targetNode.y + 20;

                const midX = (x1 + x2) / 2;
                const strokeColor = e.type === 'orange' ? '#ff4d4f' : '#a0a0a0';
                const dash = e.type === 'dashed' ? '4 4' : 'none';

                return (
                  <g key={e.id}>
                    <path
                      d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={e.type === 'orange' ? 2 : 1.5}
                      strokeDasharray={dash}
                      markerEnd={e.type === 'orange' ? 'url(#arrow-orange)' : 'url(#arrow-gray)'}
                    />
                    {e.label && (
                      <text
                        x={midX}
                        y={(y1 + y2) / 2 - 4}
                        fill={e.type === 'orange' ? '#cf1322' : '#595959'}
                        fontSize="9"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="font-sans select-none"
                      >
                        {e.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Nodes Render */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ left: `${node.x}px`, top: `${node.y}px` }}
                  className={`absolute w-32 ${getNodeStyles(node.layer, isSelected)}`}
                >
                  <span className="text-[10px] opacity-80 uppercase tracking-tight block font-mono">
                    {node.code}
                  </span>
                  <span className="text-xs font-extrabold mt-0.5 leading-tight">{node.title}</span>
                </div>
              );
            })}
          </div>

          {/* Floating Selected Node Info Card Drawer */}
          {selectedNodeObj && (
            <div className="absolute top-6 right-6 w-80 bg-white rounded-lg border border-[#c5c6cc] shadow-xl p-4 z-30 font-sans">
              <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-3">
                <div>
                  <span className="text-[10px] font-mono text-[#1890ff] font-bold">
                    {selectedNodeObj.code}
                  </span>
                  <h4 className="text-sm font-extrabold text-[#1b1b1e]">
                    {selectedNodeObj.title}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-gray-400 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-500 text-[11px]">所属层级：</span>
                  <span className="font-semibold text-gray-800 ml-1">
                    第 {selectedNodeObj.layerNum} 层 ({selectedNodeObj.layer.toUpperCase()})
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 text-[11px]">详情说明：</span>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1 text-[11px] leading-relaxed border border-gray-200">
                    {selectedNodeObj.detail}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <button
                  onClick={() => onNavigate('misstatement')}
                  className="w-full py-1.5 bg-[#1890ff] text-white rounded font-bold text-xs hover:bg-blue-600 transition-colors cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  查看对应错报底稿 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Floating Legend & Stats Bar */}
          <div className="absolute bottom-4 left-6 right-6 bg-white/90 backdrop-blur-xs border border-[#c5c6cc] rounded-lg p-2.5 shadow-md flex flex-wrap items-center justify-between text-[11px] text-[#44474c] z-20">
            {/* Color Dots Legend */}
            <div className="flex items-center space-x-3 overflow-x-auto py-0.5">
              <span className="font-bold text-gray-800 mr-1">节点:</span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mr-1"></span> RS 风险信号
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1"></span> AND 复合
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1"></span> CT 控制测试
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span> AP 程序
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mr-1"></span> CC 合规
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-1"></span> 完成阶段
              </span>
            </div>

            {/* Relations Legend */}
            <div className="flex items-center space-x-3 text-gray-500">
              <span className="font-bold text-gray-800">关系:</span>
              <span>— 激活 CT</span>
              <span className="text-red-500 font-semibold">— 跨层触发</span>
              <span>--- 参数调整</span>
              <span>— 汇入完成</span>
              <span className="bg-gray-100 px-2 py-0.5 rounded font-bold text-gray-700">
                节点 14  关系 18
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
