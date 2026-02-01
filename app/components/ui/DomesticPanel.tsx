import type { Region, RegionId, DomesticAction } from '../../types';
import { DOMESTIC_COMMANDS } from '../../constants/worldData';
import { GENERALS } from '../../constants/gameData';

interface DomesticPanelProps {
  region: Region;
  actionsRemaining: number;
  onExecute: (regionId: RegionId, action: DomesticAction) => void;
  onClose: () => void;
}

export function DomesticPanel({ region, actionsRemaining, onExecute, onClose }: DomesticPanelProps) {
  const generals = region.generals
    .map(id => GENERALS[id])
    .filter(Boolean);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-700 px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-yellow-400">🏯 {region.nameKo}</h2>
          <p className="text-xs text-gray-400">{region.description}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* 지역 정보 */}
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">💰 금</span>
            <span className="text-yellow-300">{region.gold.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">🌾 식량</span>
            <span className="text-green-300">{region.food.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">👥 인구</span>
            <span className="text-blue-300">{region.population.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">⚔️ 병력</span>
            <span className="text-red-300">{region.troops.toLocaleString()}</span>
          </div>
        </div>

        {/* 개발도 */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">농업</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${region.agriculture}%` }}
              />
            </div>
            <span className="text-xs text-green-400 w-8">{region.agriculture}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">상업</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${region.commerce}%` }}
              />
            </div>
            <span className="text-xs text-yellow-400 w-8">{region.commerce}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">성벽</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${region.defense}%` }}
              />
            </div>
            <span className="text-xs text-blue-400 w-8">{region.defense}%</span>
          </div>
        </div>
      </div>

      {/* 주둔 장수 */}
      {generals.length > 0 && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-2">👤 주둔 장수</h3>
          <div className="flex flex-wrap gap-2">
            {generals.map(g => (
              <div 
                key={g.id}
                className="bg-gray-700 px-2 py-1 rounded text-sm flex items-center gap-1"
              >
                <span>{g.portrait}</span>
                <span>{g.nameKo}</span>
                <span className="text-xs text-gray-400">
                  ({g.might}/{g.intellect}/{g.politics})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 내정 명령 */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-300">📋 내정 명령</h3>
          <span className="text-sm text-yellow-400">
            남은 행동: {actionsRemaining}회
          </span>
        </div>
        
        <div className="space-y-2">
          {DOMESTIC_COMMANDS.map(cmd => {
            const canAfford = 
              (cmd.cost.gold || 0) <= region.gold &&
              (cmd.cost.food || 0) <= region.food &&
              (cmd.cost.population || 0) <= region.population;
            const canAct = actionsRemaining > 0 && canAfford;

            return (
              <button
                key={cmd.id}
                onClick={() => canAct && onExecute(region.id, cmd.id)}
                disabled={!canAct}
                className={`
                  w-full p-3 rounded-lg text-left
                  flex items-center gap-3
                  transition-all
                  ${canAct 
                    ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500' 
                    : 'bg-gray-800 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-2xl">{cmd.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-white">{cmd.nameKo}</div>
                  <div className="text-xs text-gray-400">{cmd.description}</div>
                </div>
                {/* 비용 표시 */}
                <div className="text-xs text-right text-gray-400">
                  {cmd.cost.gold && <div>💰 {cmd.cost.gold}</div>}
                  {cmd.cost.food && <div>🌾 {cmd.cost.food}</div>}
                  {cmd.cost.population && <div>👥 {cmd.cost.population}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
