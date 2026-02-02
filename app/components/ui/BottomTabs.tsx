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
    <div className="fixed bottom-0 left-0 right-0 tab-bar safe-area-bottom">
      <div className="flex items-center">
        {/* 탭 버튼들 */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 py-3 flex flex-col items-center gap-1
              tab-item transition-all
              ${activeTab === tab.id ? 'active' : ''}
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
        
        {/* 턴 종료 버튼 */}
        <button
          onClick={onEndTurn}
          className={`
            flex-1 py-3 flex flex-col items-center gap-1 relative
            transition-all
            ${actionsRemaining === 0 
              ? 'text-jade-light animate-pulse' 
              : 'text-silk/50 hover:text-silk/80'
            }
          `}
        >
          <span className="text-xl">⏭️</span>
          <span className="text-xs font-medium">턴 종료</span>
          {actionsRemaining > 0 && (
            <span className="absolute top-1 right-1/4 bg-gold text-wood text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
              {actionsRemaining}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
