import annualAgentAvatar from '../assets/annual-agent-avatar.jpg';
import financeAgentAvatar from '../assets/finance-agent-avatar.jpg';
import hrAgentAvatar from '../assets/hr-agent-avatar.jpg';
import shebaoAgentAvatar from '../assets/shebao-agent-avatar.jpg';

const avatarByAgentId: Record<string, string> = {
  'agent-shebao': shebaoAgentAvatar,
  'agent-人事': hrAgentAvatar,
  'agent-年报': annualAgentAvatar,
  'agent-会计': financeAgentAvatar,
};

const fallbackAvatar = annualAgentAvatar;

export function AgentSVGAvatar({ id, size = 'md' }: { id: string; size?: 'sm' | 'md' | 'hr' | 'lg' }) {
  const sizeClasses = size === 'sm'
    ? 'h-8 w-8'
    : size === 'md'
      ? 'h-10 w-10'
      : size === 'hr'
        ? 'h-20 w-20 md:h-24 md:w-24'
      : 'h-24 w-24 md:h-28 md:w-28';

  return (
    <span className={`${sizeClasses} block shrink-0 overflow-hidden rounded-full border-2 border-white bg-[#eef1f5] shadow-sm`}>
      <img
        src={avatarByAgentId[id] ?? fallbackAvatar}
        alt=""
        className="block h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}
