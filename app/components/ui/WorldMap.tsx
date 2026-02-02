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
    <div className="relative w-full h-[400px] rounded-lg border-2 border-wood overflow-hidden">
      {/* 지도 배경 */}
      <div className="absolute inset-0 bg-gradient-to-b from-parchment-dark/40 via-parchment/30 to-jade-dark/20"></div>
      
      {/* 배경 그리드 */}
      <div className="absolute inset-0 opacity-5">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute w-full border-t border-wood" style={{ top: `${i * 10}%` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute h-full border-l border-wood" style={{ left: `${i * 10}%` }} />
        ))}
      </div>

      {/* 연결선 */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {regionList.map(region => 
          region.adjacent.map(adjId => {
            const adj = regions[adjId];
            if (!adj) return null;
            const pos1 = REGION_POSITIONS[region.id];
            const pos2 = REGION_POSITIONS[adjId];
            // 중복 방지: 알파벳순으로 앞선 것만 그림
            if (region.id > adjId) return null;
            return (
              <line
                key={`${region.id}-${adjId}`}
                x1={`${pos1.x}%`}
                y1={`${pos1.y}%`}
                x2={`${pos2.x}%`}
                y2={`${pos2.y}%`}
                stroke="rgba(61, 35, 20, 0.4)"
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
        const faction = factions[region.owner];
        const isPlayer = region.owner === playerFaction;
        const isSelected = selectedRegion === region.id;

        return (
          <button
            key={region.id}
            onClick={() => onSelectRegion(region.id)}
            className={`
              absolute transform -translate-x-1/2 -translate-y-1/2
              flex flex-col items-center gap-1
              transition-all duration-200
              ${isSelected ? 'scale-125 z-10' : 'hover:scale-110'}
            `}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            {/* 성 아이콘 */}
            <div
              className={`
                w-11 h-11 rounded-lg flex items-center justify-center text-xl
                border-2 shadow-lg transition-all
                ${isPlayer ? 'border-jade-light shadow-jade/30' : 'border-wood shadow-wood/30'}
                ${isSelected ? 'ring-2 ring-gold ring-offset-2 ring-offset-dynasty-black animate-pulse-gold' : ''}
              `}
              style={{ backgroundColor: faction?.color || '#666' }}
            >
              🏯
            </div>
            {/* 지역명 */}
            <span className={`
              text-xs font-bold px-1.5 py-0.5 rounded shadow-sm
              ${isPlayer 
                ? 'bg-jade/90 text-silk' 
                : 'bg-wood/90 text-parchment'}
            `}>
              {region.nameKo}
            </span>
            {/* 병력 표시 */}
            <span className={`text-xs font-medium ${isPlayer ? 'text-jade-light' : 'text-crimson-light'}`}>
              ⚔️{(region.troops / 1000).toFixed(0)}k
            </span>
          </button>
        );
      })}

      {/* 범례 */}
      <div className="absolute bottom-2 left-2 bg-wood/90 rounded-lg px-3 py-2 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded border border-jade-light" style={{ backgroundColor: factions[playerFaction]?.color }} />
          <span className="text-jade-light font-medium">내 영토</span>
        </div>
      </div>
    </div>
  );
}
