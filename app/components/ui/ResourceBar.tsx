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
    <div className="status-bar px-4 py-3">
      {/* 상단: 턴/계절 정보 */}
      <div className="flex justify-between items-center mb-2 text-sm">
        <span className="text-parchment-dark flex items-center gap-2">
          <span className="text-lg">{seasonIcon}</span>
          <span>{year}년 {season}</span>
        </span>
        <span className="text-gold font-bold flex items-center gap-2">
          <span className="text-xs text-parchment/60">턴</span>
          <span className="text-lg">{turn}</span>
        </span>
      </div>
      
      {/* 구분선 */}
      <div className="divider-gold mb-2 opacity-30"></div>
      
      {/* 자원 표시 */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">💰</span>
          <span className="text-gold-light font-bold">
            {resources.gold.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🌾</span>
          <span className="text-jade-light font-bold">
            {resources.food.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">👥</span>
          <span className="text-blue-300 font-bold">
            {resources.population.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⚔️</span>
          <span className="text-crimson-light font-bold">
            {resources.troops.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
