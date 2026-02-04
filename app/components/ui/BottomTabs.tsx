import type { GameTab } from '../../types';

interface BottomTabsProps {
  activeTab: GameTab;
  onTabChange: (tab: GameTab) => void;
  actionsRemaining: number;
  onEndTurn: () => void;
}

const TABS: { id: GameTab; icon: string; label: string }[] = [
  { id: 'map', icon: '🗺️', label: '지도' },
  { id: 'domestic', icon: '🏠', label: '내정' },
  { id: 'military', icon: '⚔️', label: '군사' },
  { id: 'diplomacy', icon: '🤝', label: '외교' }
];

export function BottomTabs({ activeTab, onTabChange, actionsRemaining, onEndTurn }: BottomTabsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 tab-bar safe-area-bottom z-50">
      <div className="flex items-stretch">
        {/* 탭 버튼들 */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5
              tab-item transition-all active:scale-95 active:opacity-70
              ${activeTab === tab.id ? 'active' : ''}
            `}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-[11px] font-medium leading-none">{tab.label}</span>
          </button>
        ))}
        
        {/* 턴 종료 버튼 */}
        <button
          onClick={onEndTurn}
          className={`
            flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 relative
            transition-all active:scale-95 active:opacity-70
            ${actionsRemaining === 0 
              ? 'text-jade-light' 
              : 'text-silk/50'
            }
          `}
        >
          <div className="relative">
            <span className="text-xl leading-none">⏭️</span>
            {actionsRemaining > 0 && (
              <span className="absolute -top-2 -right-3 bg-gold text-wood text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold shadow-lg leading-none">
                {actionsRemaining}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium leading-none">
            {actionsRemaining === 0 ? '턴 종료' : '턴 종료'}
          </span>
          {actionsRemaining === 0 && (
            <span className="absolute inset-0 rounded animate-pulse-gold opacity-30 pointer-events-none" />
          )}
        </button>
      </div>
    </div>
  );
}
