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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 safe-area-pb">
      <div className="flex items-center">
        {/* 탭 버튼들 */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 py-3 flex flex-col items-center gap-1
              transition-colors
              ${activeTab === tab.id 
                ? 'text-yellow-400 bg-gray-700/50' 
                : 'text-gray-400 hover:text-gray-200'
              }
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
        
        {/* 턴 종료 버튼 */}
        <button
          onClick={onEndTurn}
          className={`
            flex-1 py-3 flex flex-col items-center gap-1
            transition-colors
            ${actionsRemaining === 0 
              ? 'text-green-400 bg-green-900/30 animate-pulse' 
              : 'text-gray-400 hover:text-gray-200'
            }
          `}
        >
          <span className="text-xl">⏭️</span>
          <span className="text-xs">턴 종료</span>
          {actionsRemaining > 0 && (
            <span className="absolute -top-1 right-1/4 bg-yellow-500 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {actionsRemaining}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
