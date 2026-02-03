import type { Region, RegionId, DomesticAction, General } from '../../types';
import { DOMESTIC_COMMANDS } from '../../constants/worldData';

interface DomesticPanelProps {
  region: Region;
  actionsRemaining: number;
  getGeneral: (id: string) => General | null;
  onExecute: (regionId: RegionId, action: DomesticAction) => void;
  onClose: () => void;
}

export function DomesticPanel({ region, actionsRemaining, getGeneral, onExecute, onClose }: DomesticPanelProps) {
  const generals = region.generals
    .map(id => getGeneral(id))
    .filter((g): g is General => g !== null);

  return (
    <div className="silk-card rounded-lg overflow-hidden animate-slide-up">
      {/* 헤더 */}
      <div className="bg-wood px-4 py-3 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gold flex items-center gap-2">
            🏯 {region.nameKo}
          </h2>
          <p className="text-xs text-parchment/70">{region.description}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-parchment/60 hover:text-parchment text-xl transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 지역 정보 */}
      <div className="p-4 border-b-2 border-parchment-dark">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-dynasty-medium">💰 금</span>
            <span className="text-gold font-bold">{region.gold.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dynasty-medium">🌾 식량</span>
            <span className="text-jade font-bold">{region.food.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dynasty-medium">👥 인구</span>
            <span className="text-blue-600 font-bold">{region.population.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-dynasty-medium">⚔️ 병력</span>
            <span className="text-crimson font-bold">{region.troops.toLocaleString()}</span>
          </div>
        </div>

        {/* 개발도 */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-dynasty-medium w-12">농업</span>
            <div className="flex-1 progress-bar h-2">
              <div 
                className="progress-fill jade"
                style={{ width: `${region.agriculture}%` }}
              />
            </div>
            <span className="text-xs text-jade font-bold w-10 text-right">{region.agriculture}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dynasty-medium w-12">상업</span>
            <div className="flex-1 progress-bar h-2">
              <div 
                className="progress-fill gold"
                style={{ width: `${region.commerce}%` }}
              />
            </div>
            <span className="text-xs text-gold font-bold w-10 text-right">{region.commerce}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dynasty-medium w-12">성벽</span>
            <div className="flex-1 progress-bar h-2">
              <div
                className="progress-fill"
                style={{
                  width: `${region.defense}%`,
                  background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                }}
              />
            </div>
            <span className="text-xs text-blue-600 font-bold w-10 text-right">{region.defense}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-dynasty-medium w-12">훈련</span>
            <div className="flex-1 progress-bar h-2">
              <div
                className="progress-fill crimson"
                style={{ width: `${region.training || 50}%` }}
              />
            </div>
            <span className="text-xs text-crimson-light font-bold w-10 text-right">{region.training || 50}%</span>
          </div>
        </div>

        {/* 예상 수입 */}
        <div className="mt-4 p-3 bg-dynasty-dark/30 rounded-lg">
          <h4 className="text-xs text-dynasty-medium mb-2">📊 턴당 예상 수입</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-dynasty-medium">💰 금 수입</span>
              <span className="text-gold font-bold">
                +{Math.floor(region.population * 0.1 * (region.commerce / 100)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">🌾 식량 수입</span>
              <span className="text-jade font-bold">
                +{Math.floor(region.population * 0.2 * (region.agriculture / 100)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">🍖 병력 유지비</span>
              <span className="text-crimson font-bold">
                -{Math.floor(region.troops * 0.05).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">📈 순 식량</span>
              <span className={`font-bold ${
                Math.floor(region.population * 0.2 * (region.agriculture / 100)) - Math.floor(region.troops * 0.05) >= 0
                  ? 'text-jade'
                  : 'text-crimson'
              }`}>
                {(Math.floor(region.population * 0.2 * (region.agriculture / 100)) - Math.floor(region.troops * 0.05)) >= 0 ? '+' : ''}
                {(Math.floor(region.population * 0.2 * (region.agriculture / 100)) - Math.floor(region.troops * 0.05)).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 주둔 장수 - 디버그: raw IDs 표시 */}
      <div className="p-4 border-b-2 border-parchment-dark">
        <h3 className="text-sm font-medium text-dynasty-medium mb-2">
          👤 주둔 장수
        </h3>
        {generals.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {generals.map(g => (
              <div 
                key={g.id}
                className="bg-wood text-parchment px-2 py-1 rounded text-sm flex items-center gap-1 shadow-sm"
              >
                <span>{g.portrait}</span>
                <span className="font-medium">{g.nameKo}</span>
                <span className="text-xs text-parchment/60">
                  ({g.might}/{g.intellect}/{g.politics})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-parchment/50 text-sm">주둔 장수가 없습니다</p>
        )}
      </div>

      {/* 내정 명령 */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-dynasty-medium">📋 내정 명령</h3>
          <span className="text-sm text-gold font-bold">
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
                    ? 'bg-wood hover:bg-wood-light active:translate-y-0.5 shadow-md' 
                    : 'bg-dynasty-light/30 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-2xl">{cmd.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-parchment">{cmd.nameKo}</div>
                  <div className="text-xs text-parchment/60">{cmd.description}</div>
                </div>
                {/* 비용 표시 */}
                <div className="text-xs text-right text-parchment/70">
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
