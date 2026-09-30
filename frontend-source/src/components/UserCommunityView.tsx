import { useState } from 'react';
import {
  ArrowLeft,
  BookOpenText,
  Bot,
  ChevronDown,
  ChevronRight,
  FileText,
  MessageSquareText,
  PlayCircle,
  Search,
  Sparkles,
  UsersRound,
} from 'lucide-react';

type CommunityMode = 'home' | 'user-doc';

const userGuideSections = [
  {
    title: '1. 进入 RoadwiseLab',
    body: '打开平台后，左侧可在 Chat 和 Work 之间切换。Chat 用于发起会话、选择数字员工；Work 用于查看项目、待办、风险和消息。',
  },
  {
    title: '2. 新建会话或项目',
    body: '在 Chat 中点击“新建会话”开始普通对话；在 Work 中点击“新建项目”创建项目空间。项目空间会承接成员协作、附件、底稿和报告流转。',
  },
  {
    title: '3. 使用数字员工',
    body: '在 Chat 的“数字员工”分组中选择智能体，再进入对应会话。数字员工会根据业务流程主动提问，引导上传材料、确认字段、生成结果。',
  },
  {
    title: '4. 查看工作台待办',
    body: 'Work 工作台会集中展示待我处理、风险提示、项目动态和消息通知。点击待办可以进入对应项目或数字员工处理页面。',
  },
  {
    title: '5. 管理历史会话',
    body: '会话列表和数字员工会话旁的三个点支持置顶、重命名和删除，便于保留重要过程和清理无效记录。',
  },
];

const employeeTutorials = [
  {
    name: '行政人事管理',
    role: '行政人事助手',
    tone: 'blue',
    steps: ['查询花名册、合同、证照和年假信息', '按提示确认敏感字段访问用途', '将合同到期、试用期、证照风险同步到工作台'],
  },
  {
    name: '社保专项审计',
    role: '社保审计助手',
    tone: 'violet',
    steps: ['新建或继续社保专项审计项目', '上传工资表、社保缴费明细和项目资料', '跟随会话完成字段校对、附件生成和报告审核'],
  },
  {
    name: '事业单位年报审计',
    role: '年报审计助手',
    tone: 'emerald',
    steps: ['选择年报审计项目', '上传报表、底稿和补充说明', '按提示核对差异、生成审计底稿和报告材料'],
  },
  {
    name: '财务助手',
    role: '会计与财务助手',
    tone: 'amber',
    steps: ['发起报销、开票或凭证相关咨询', '上传票据、合同或说明材料', '让助手提取字段、生成摘要并提示缺失材料'],
  },
];

const toneClassMap: Record<string, { icon: string; border: string; bg: string; text: string }> = {
  blue: {
    icon: 'bg-blue-100 text-blue-700',
    border: 'border-blue-100 hover:border-blue-200',
    bg: 'bg-blue-50/45',
    text: 'text-blue-700',
  },
  violet: {
    icon: 'bg-violet-100 text-violet-700',
    border: 'border-violet-100 hover:border-violet-200',
    bg: 'bg-violet-50/45',
    text: 'text-violet-700',
  },
  emerald: {
    icon: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-100 hover:border-emerald-200',
    bg: 'bg-emerald-50/45',
    text: 'text-emerald-700',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-700',
    border: 'border-amber-100 hover:border-amber-200',
    bg: 'bg-amber-50/45',
    text: 'text-amber-700',
  },
};

export default function UserCommunityView() {
  const [mode, setMode] = useState<CommunityMode>('home');
  const [employeeGuideOpen, setEmployeeGuideOpen] = useState(false);

  if (mode === 'user-doc') {
    return (
      <main className="h-full overflow-y-auto bg-[#f6f8ff] custom-scrollbar">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <button
            type="button"
            onClick={() => setMode('home')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfe5f2] bg-white px-3.5 py-2 text-xs font-bold text-gray-600 shadow-sm hover:bg-[#f8f9ff] hover:text-[#0052d9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回用户社区
          </button>

          <section className="mt-6 overflow-hidden rounded-3xl border border-[#e2e8f4] bg-white shadow-xl shadow-blue-950/5">
            <div className="border-b border-[#edf1f7] bg-gradient-to-r from-[#f1f6ff] to-white px-8 py-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0052d9] text-white shadow-lg shadow-blue-500/20">
                  <BookOpenText className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#0052d9]">用户使用教程</p>
                  <h1 className="mt-1 text-2xl font-black tracking-normal text-[#141824]">RoadwiseLab 平台基础使用文档</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-gray-600">
                本文档面向首次使用 RoadwiseLab 的用户，帮助快速理解 Chat、Work、数字员工、工作台待办和历史会话管理。
              </p>
            </div>

            <div className="grid gap-4 px-8 py-7">
              {userGuideSections.map((section) => (
                <article key={section.title} className="rounded-2xl border border-[#edf1f7] bg-[#fbfcff] p-5">
                  <h2 className="text-sm font-black text-[#172033]">{section.title}</h2>
                  <p className="mt-2 text-sm font-medium leading-7 text-gray-600">{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="h-full overflow-y-auto bg-[#f6f8ff] custom-scrollbar">
      <div className="max-w-6xl mx-auto px-8 py-8">
        <header className="rounded-3xl border border-[#e2e8f4] bg-white px-8 py-7 shadow-xl shadow-blue-950/5">
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-black text-[#0052d9]">
                <UsersRound className="h-3.5 w-3.5" />
                用户社区
              </div>
              <h1 className="mt-4 text-[30px] font-black leading-tight tracking-normal text-[#111827]">教程中心</h1>
              <p className="mt-2 text-sm font-semibold text-gray-500">集中查看平台使用文档和各数字员工的 Chat 使用教材。</p>
            </div>
            <div className="relative hidden w-72 md:block">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                readOnly
                value="搜索教程、数字员工、工作台"
                className="w-full rounded-2xl border border-[#e2e8f4] bg-[#f8faff] py-3 pl-10 pr-4 text-xs font-bold text-gray-400 outline-none"
              />
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('user-doc')}
            className="group text-left rounded-3xl border border-[#dfe7f5] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <FileText className="h-6 w-6" />
              </div>
              <ChevronRight className="mt-2 h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
            </div>
            <h2 className="mt-5 text-lg font-black text-[#172033]">用户使用教程</h2>
            <p className="mt-2 text-sm font-medium leading-7 text-gray-600">
              以文档形式查看平台基础操作，包括 Chat、Work、工作台待办、数字员工入口和会话管理。
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f1f6ff] px-3 py-1.5 text-xs font-black text-[#0052d9]">
              <BookOpenText className="h-3.5 w-3.5" />
              点击查看文档
            </div>
          </button>

          <div className="rounded-3xl border border-[#dfe7f5] bg-white p-6 shadow-sm">
            <button
              type="button"
              onClick={() => setEmployeeGuideOpen((open) => !open)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Bot className="h-6 w-6" />
                </div>
                <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f8fc] text-gray-500">
                  {employeeGuideOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </div>
              <h2 className="mt-5 text-lg font-black text-[#172033]">数字员工使用教程</h2>
              <p className="mt-2 text-sm font-medium leading-7 text-gray-600">
                展开后按 Chat 中的数字员工归集使用教材，便于用户直接找到对应业务助手的操作步骤。
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
                <MessageSquareText className="h-3.5 w-3.5" />
                {employeeGuideOpen ? '收起教材' : '展开教材'}
              </div>
            </button>
          </div>
        </section>

        {employeeGuideOpen && (
          <section className="mt-5 rounded-3xl border border-[#e2e8f4] bg-white p-6 shadow-xl shadow-blue-950/5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-[#0052d9]">Chat 数字员工教材归集</p>
                <h3 className="mt-1 text-xl font-black text-[#172033]">选择一个数字员工查看核心使用路径</h3>
              </div>
              <Sparkles className="h-5 w-5 text-blue-500" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {employeeTutorials.map((tutorial) => {
                const tone = toneClassMap[tutorial.tone];
                return (
                  <article key={tutorial.name} className={`rounded-2xl border ${tone.border} bg-white p-5 transition-colors`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tone.icon}`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-[#172033]">{tutorial.name}</h4>
                        <p className="text-[11px] font-bold text-gray-400">{tutorial.role}</p>
                      </div>
                    </div>
                    <div className={`mt-4 rounded-2xl ${tone.bg} p-4`}>
                      <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-black text-gray-500">
                        <PlayCircle className={`h-3.5 w-3.5 ${tone.text}`} />
                        推荐使用路径
                      </div>
                      <ol className="space-y-2.5">
                        {tutorial.steps.map((step, index) => (
                          <li key={step} className="flex gap-2 text-xs font-semibold leading-6 text-gray-600">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black ${tone.text}`}>
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
