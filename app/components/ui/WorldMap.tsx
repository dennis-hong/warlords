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
    <div className="relative w-full h-[400px] bg-gradient-to-b from-amber-900/30 to-green-900/30 rounded-lg border border-gray-700 overflow-hidden">
      {/* 배경 그리드 */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute w-full border-t border-gray-500" style={{ top: `${i * 10}%` }} />
        ))}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute h-full border-l border-gray-500" style={{ left: `${i * 10}%` }} />
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
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                strokeDasharray="4,4"
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
                w-10 h-10 rounded-lg flex items-center justify-center text-xl
                border-2 shadow-lg
                ${isPlayer ? 'border-green-400' : 'border-gray-500'}
                ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900' : ''}
              `}
              style={{ backgroundColor: faction?.color || '#666' }}
            >
              🏯
            </div>
            {/* 지역명 */}
            <span className={`
              text-xs font-medium px-1 py-0.5 rounded
              ${isPlayer ? 'bg-green-900/80 text-green-200' : 'bg-gray-800/80 text-gray-300'}
            `}>
              {region.nameKo}
            </span>
            {/* 병력 표시 */}
            <span className="text-xs text-gray-400">
              ⚔️{(region.troops / 1000).toFixed(0)}k
            </span>
          </button>
        );
      })}

      {/* 범례 */}
      <div className="absolute bottom-2 left-2 bg-gray-900/80 rounded px-2 py-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: factions[playerFaction]?.color }} />
          <span className="text-green-300">내 영토</span>
        </div>
      </div>
    </div>
  );
}
