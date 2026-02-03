import type { Region, RegionId, General } from '../../types';

interface RegionListProps {
  regions: Region[];
  selectedRegion: RegionId | null;
  getGeneral: (id: string) => General | null;
  onSelectRegion: (regionId: RegionId) => void;
}

export function RegionList({ regions, selectedRegion, getGeneral, onSelectRegion }: RegionListProps) {
  if (regions.length === 0) {
    return (
      <div className="text-center text-silk/50 py-8 dynasty-card rounded-lg">
        <div className="text-4xl mb-3">🏯</div>
        소유한 지역이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
              w-full p-3 rounded-lg text-left
              transition-all animate-fade-in
              ${isSelected 
                ? 'peace-card scale-[1.02]' 
                : 'dynasty-card hover:scale-[1.01]'
              }
            `}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-bold text-gold">🏯 {region.nameKo}</span>
                <p className="text-xs text-silk/50">{region.description}</p>
              </div>
              <div className="text-right text-xs">
                <div className="text-crimson-light font-medium">⚔️ {region.troops.toLocaleString()}</div>
              </div>
            </div>

            {/* 자원 */}
            <div className="flex gap-4 text-xs mb-2">
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
                    className="bg-wood/80 text-parchment px-1.5 py-0.5 rounded text-xs shadow-sm"
                  >
                    {g.portrait} {g.nameKo}
                  </span>
                ))}
                {generals.length > 4 && (
                  <span className="text-xs text-silk/40">+{generals.length - 4}</span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
