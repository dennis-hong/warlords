import type { Region, RegionId, General } from '../../types';
import { GeneralPortrait } from './GeneralPortrait';

interface RegionListProps {
  regions: Region[];
  selectedRegion: RegionId | null;
  getGeneral: (id: string) => General | null;
  onSelectRegion: (regionId: RegionId) => void;
}

export function RegionList({ regions, selectedRegion, getGeneral, onSelectRegion }: RegionListProps) {
  if (regions.length === 0) {
    return (
      <div className="text-center text-silk/50 py-6 dynasty-card rounded-lg">
        <div className="text-3xl mb-2">🏯</div>
        <p className="text-sm">소유한 지역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {regions.map((region, idx) => {
        const generals = region.generals
          .map(id => getGeneral(id))
          .filter((g): g is General => g !== null);
        const isSelected = selectedRegion === region.id;

        return (
          <button
            key={region.id}
            onClick={() => onSelectRegion(region.id)}
            className={`
              w-full min-h-[56px] p-3 rounded-lg text-left
              transition-all animate-fade-in active:scale-[0.98]
              ${isSelected 
                ? 'peace-card' 
                : 'dynasty-card'
              }
            `}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-1.5">
              <div className="min-w-0">
                <span className="font-bold text-gold text-sm">🏯 {region.nameKo}</span>
                <p className="text-[10px] text-silk/50 truncate">{region.description}</p>
              </div>
              <div className="text-right text-xs shrink-0 ml-2">
                <div className="text-crimson-light font-medium">⚔️ {region.troops.toLocaleString()}</div>
              </div>
            </div>

            {/* 자원 */}
            <div className="flex gap-3 text-[11px] mb-1.5">
              <span className="text-gold-light">💰 {region.gold.toLocaleString()}</span>
              <span className="text-jade-light">🌾 {region.food.toLocaleString()}</span>
              <span className="text-blue-300">👥 {region.population.toLocaleString()}</span>
            </div>

            {/* 장수 */}
            {generals.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {generals.slice(0, 4).map(g => (
                  <span 
                    key={g.id}
                    className="bg-wood/80 text-parchment px-1.5 py-0.5 rounded text-[10px] shadow-sm"
                  >
                    <GeneralPortrait generalId={g.id} portrait={g.portrait || ''} size="sm" /> {g.nameKo}
                  </span>
                ))}
                {generals.length > 4 && (
                  <span className="text-[10px] text-silk/40">+{generals.length - 4}</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
