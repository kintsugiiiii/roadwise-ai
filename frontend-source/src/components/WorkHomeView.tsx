import { Project, WorkTask } from '../types';

interface WorkHomeViewProps {
  projects: Project[];
  tasks: WorkTask[];
  onOpenWorkbench: () => void;
  onOpenProject: (projectId: string) => void;
  onNewProject: () => void;
}

export default function WorkHomeView(_props: WorkHomeViewProps) {
  return (
    <main
      id="work-home-view-root"
      className="grid min-h-0 flex-1 place-items-center bg-[#f5f7fb] text-[#7b8799]"
    >
      <p className="text-sm font-semibold">开发中</p>
    </main>
  );
}
