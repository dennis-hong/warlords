import type { Resources } from '../../types';

interface ResourceBarProps {
  resources: Resources;
  turn: number;
  season: string;
  seasonIcon: string;
  year: number;
}

export function ResourceBar({ resources, turn, season, seasonIcon, year }: ResourceBarProps) {
  return (
    <div className="status-bar px-3 py-2">
      {/* 단일 행: 턴/계절 + 자원 */}
      <div className="flex items-center justify-between gap-2">
        {/* 좌측: 턴/계절 - 콤팩트 */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-base">{seasonIcon}</span>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-parchment/60">{year}년 {season}</span>
            <span className="text-xs text-gold font-bold">턴 {turn}</span>
          </div>
        </div>
        
        {/* 구분선 */}
        <div className="w-px h-6 bg-parchment/20 shrink-0"></div>
        
        {/* 우측: 자원 - 한 줄 */}
        <div className="flex items-center gap-3 text-xs overflow-hidden">
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-sm">💰</span>
            <span className="text-gold-light font-bold tabular-nums">
              {resources.gold >= 10000 ? `${(resources.gold / 1000).toFixed(0)}k` : resources.gold.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-sm">🌾</span>
            <span className="text-jade-light font-bold tabular-nums">
              {resources.food >= 10000 ? `${(resources.food / 1000).toFixed(0)}k` : resources.food.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-sm">👥</span>
            <span className="text-blue-300 font-bold tabular-nums">
              {resources.population >= 10000 ? `${(resources.population / 1000).toFixed(0)}k` : resources.population.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <span className="text-sm">⚔️</span>
            <span className="text-crimson-light font-bold tabular-nums">
              {resources.troops >= 10000 ? `${(resources.troops / 1000).toFixed(0)}k` : resources.troops.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
