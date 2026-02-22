import type { Region, RegionId, FactionId, Faction } from '../../types';
import { REGION_POSITIONS } from '../../constants/worldData';

interface WorldMapProps {
  regions: Record<RegionId, Region>;
  factions: Record<FactionId, Faction>;
  selectedRegion: RegionId | null;
  playerFaction: FactionId;
  onSelectRegion: (regionId: RegionId) => void;
}

export function WorldMap({ 
  regions, 
  factions, 
  selectedRegion, 
  playerFaction,
  onSelectRegion 
}: WorldMapProps) {
  const regionList = Object.values(regions);

  return (
    <div className="relative w-full h-[calc(100vh-220px)] min-h-[350px] max-h-[500px] rounded-lg border-2 border-wood overflow-hidden">
      {/* 지도 배경 */}
      <div className="absolute inset-0">
        <img src="/images/map-bg.png" alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* 연결선 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {regionList.map(region => 
          region.adjacent.map(adjId => {
            const adj = regions[adjId];
            if (!adj) return null;
            const pos1 = REGION_POSITIONS[region.id];
            const pos2 = REGION_POSITIONS[adjId];
            if (!pos1 || !pos2 || region.id > adjId) return null;
            return (
              <line
                key={`${region.id}-${adjId}`}
                x1={`${pos1.x}%`}
                y1={`${pos1.y}%`}
                x2={`${pos2.x}%`}
                y2={`${pos2.y}%`}
                stroke="rgba(255, 240, 200, 0.7)"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
            );
          })
        )}
      </svg>

      {/* 지역 노드 */}
      {regionList.map(region => {
        const pos = REGION_POSITIONS[region.id];
        if (!pos) return null;
        const faction = factions[region.owner];
        const isPlayer = region.owner === playerFaction;
        const isSelected = selectedRegion === region.id;

        return (
          <button
            key={region.id}
            onClick={() => onSelectRegion(region.id)}
            className={`
              absolute transform -translate-x-1/2 -translate-y-1/2
              flex flex-col items-center gap-0.5
              transition-all duration-200 active:scale-90
              ${isSelected ? 'scale-110 z-10' : ''}
            `}
            style={{ 
              left: `${pos.x}%`, 
              top: `${pos.y}%`,
              // 최소 44px 터치 영역
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            {/* 성 아이콘 - 더 큰 터치 타겟 */}
            <div
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center text-xl
                shadow-lg transition-all
                ${isPlayer
                  ? 'border-[3px] border-gold'
                  : 'border-2 border-wood shadow-wood/30'}
                ${isPlayer && !isSelected ? 'player-territory-glow' : ''}
                ${isSelected ? 'ring-2 ring-gold ring-offset-1 ring-offset-dynasty-black animate-pulse-gold' : ''}
              `}
              style={{ backgroundColor: faction?.color || '#666' }}
            >
              🏯
            </div>
            {/* 지역명 */}
            <span className={`
              text-[11px] font-bold px-1.5 py-0.5 rounded shadow-sm leading-none
              ${isPlayer
                ? 'bg-jade/90 text-gold-light border border-gold/40'
                : 'bg-wood/90 text-parchment'}
            `}>
              {region.nameKo}
            </span>
            {/* 병력 표시 */}
            <span className={`text-[10px] font-bold leading-none px-1 py-0.5 rounded ${isPlayer ? 'bg-jade/80 text-gold-light border border-gold/30' : 'bg-wood/80 text-parchment'}`}>
              ⚔️{(region.troops / 1000).toFixed(0)}k
            </span>
          </button>
        );
      })}

      {/* 범례 */}
      <div className="absolute bottom-2 left-2 bg-wood/90 rounded px-2 py-1 text-[10px] shadow-lg border border-gold/30">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded border-2 border-gold player-territory-glow" style={{ backgroundColor: factions[playerFaction]?.color }} />
          <span className="text-gold-light font-bold">내 영토</span>
        </div>
      </div>
    </div>
  );
}
