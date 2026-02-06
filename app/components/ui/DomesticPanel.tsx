import type { Region, RegionId, DomesticAction, General } from '../../types';
import { DOMESTIC_COMMANDS } from '../../constants/worldData';
import { GeneralPortrait } from './GeneralPortrait';

interface DomesticPanelProps {
  region: Region;
  actionsRemaining: number;
  getGeneral: (id: string) => General | null;
  onExecute: (regionId: RegionId, action: DomesticAction) => void;
  onClose: () => void;
  playerRegionIds?: RegionId[];
  onNavigateRegion?: (regionId: RegionId) => void;
}

export function DomesticPanel({ region, actionsRemaining, getGeneral, onExecute, onClose, playerRegionIds, onNavigateRegion }: DomesticPanelProps) {
  const generals = region.generals
    .map(id => getGeneral(id))
    .filter((g): g is General => g !== null);

  return (
    <div className="silk-card rounded-lg overflow-hidden animate-slide-up">
      {/* 헤더 */}
      <div className="bg-wood px-3 py-2.5 flex justify-between items-center">
        {/* 이전 성 */}
        {playerRegionIds && playerRegionIds.length > 1 && onNavigateRegion ? (
          <button
            onClick={() => {
              const idx = playerRegionIds.indexOf(region.id);
              const prevIdx = (idx - 1 + playerRegionIds.length) % playerRegionIds.length;
              onNavigateRegion(playerRegionIds[prevIdx]);
            }}
            className="text-parchment/60 active:text-gold text-lg transition-colors w-9 h-9 flex items-center justify-center shrink-0 -ml-1"
          >
            ◀
          </button>
        ) : <div className="w-9 shrink-0 -ml-1" />}

        <div className="min-w-0 text-center flex-1">
          <h2 className="text-base font-bold text-gold flex items-center justify-center gap-1.5 truncate">
            🏯 {region.nameKo}
          </h2>
          <p className="text-[10px] text-parchment/70 truncate">{region.description}</p>
        </div>

        {/* 다음 성 */}
        {playerRegionIds && playerRegionIds.length > 1 && onNavigateRegion ? (
          <button
            onClick={() => {
              const idx = playerRegionIds.indexOf(region.id);
              const nextIdx = (idx + 1) % playerRegionIds.length;
              onNavigateRegion(playerRegionIds[nextIdx]);
            }}
            className="text-parchment/60 active:text-gold text-lg transition-colors w-9 h-9 flex items-center justify-center shrink-0"
          >
            ▶
          </button>
        ) : <div className="w-9 shrink-0" />}

        <button
          onClick={onClose}
          className="text-parchment/60 active:text-parchment text-xl transition-colors w-10 h-10 flex items-center justify-center shrink-0 -mr-1"
        >
          ✕
        </button>
      </div>

      {/* 지역 정보 */}
      <div className="p-3 border-b-2 border-parchment-dark">
        <div className="grid grid-cols-2 gap-2 text-sm">
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

        {/* 개발도 - 콤팩트 */}
        <div className="mt-3 space-y-1.5">
          {[
            { label: '농업', value: region.agriculture, cls: 'jade' },
            { label: '상업', value: region.commerce, cls: 'gold' },
            { label: '성벽', value: region.defense, cls: '' },
            { label: '훈련', value: region.training || 50, cls: 'crimson' }
          ].map(stat => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-[10px] text-dynasty-medium w-8">{stat.label}</span>
              <div className="flex-1 progress-bar h-2">
                <div 
                  className={`progress-fill ${stat.cls}`}
                  style={{ 
                    width: `${stat.value}%`,
                    ...(stat.cls === '' ? { background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)' } : {})
                  }}
                />
              </div>
              <span className={`text-[10px] font-bold w-8 text-right ${
                stat.cls === 'jade' ? 'text-jade' : 
                stat.cls === 'gold' ? 'text-gold' : 
                stat.cls === 'crimson' ? 'text-crimson-light' : 'text-blue-600'
              }`}>{stat.value}%</span>
            </div>
          ))}
        </div>

        {/* 예상 수입 - 콤팩트 */}
        <div className="mt-3 p-2.5 bg-dynasty-dark/30 rounded-lg">
          <h4 className="text-[10px] text-dynasty-medium mb-1.5">📊 턴당 예상 수입</h4>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-dynasty-medium">💰 금</span>
              <span className="text-gold font-bold">
                +{Math.floor(region.population * 0.1 * (region.commerce / 100)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">🌾 식량</span>
              <span className="text-jade font-bold">
                +{Math.floor(region.population * 0.2 * (region.agriculture / 100)).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">🍖 유지비</span>
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

      {/* 주둔 장수 */}
      <div className="px-3 py-2.5 border-b-2 border-parchment-dark">
        <h3 className="text-xs font-medium text-dynasty-medium mb-1.5">
          👤 주둔 장수
        </h3>
        {generals.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {generals.map(g => (
              <div 
                key={g.id}
                className="bg-wood text-parchment px-2 py-1 rounded text-xs flex items-center gap-1 shadow-sm"
              >
                <GeneralPortrait generalId={g.id} portrait={g.portrait || ''} size="sm" />
                <span className="font-medium">{g.nameKo}</span>
                <span className="text-[10px] text-parchment/60">
                  ({g.might}/{g.intellect}/{g.politics})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-parchment/50 text-xs">주둔 장수가 없습니다</p>
        )}
      </div>

      {/* 내정 명령 */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-medium text-dynasty-medium">📋 내정 명령</h3>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            actionsRemaining > 0 ? 'bg-gold/20 text-gold-dark' : 'bg-crimson/20 text-crimson'
          }`}>
            행동 {actionsRemaining}회
          </span>
        </div>
        
        <div className="space-y-1.5">
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
                  w-full min-h-[48px] p-2.5 rounded-lg text-left
                  flex items-center gap-2.5
                  transition-all active:scale-[0.98]
                  ${canAct 
                    ? 'bg-wood hover:bg-wood-light shadow-md' 
                    : 'bg-dynasty-light/30 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-xl shrink-0">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-parchment text-sm">{cmd.nameKo}</div>
                  <div className="text-[10px] text-parchment/60 truncate">{cmd.description}</div>
                </div>
                {/* 비용 표시 */}
                <div className="text-[10px] text-right text-parchment/70 shrink-0">
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
