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
    <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 px-3 py-2">
      {/* 상단: 턴/계절 정보 */}
      <div className="flex justify-between items-center mb-1 text-xs">
        <span className="text-gray-400">
          {year}년 {seasonIcon} {season}
        </span>
        <span className="text-yellow-400 font-medium">
          턴 {turn}
        </span>
      </div>
      
      {/* 자원 표시 */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1">
          <span>💰</span>
          <span className="text-yellow-300 font-medium">
            {resources.gold.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>🌾</span>
          <span className="text-green-300 font-medium">
            {resources.food.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>👥</span>
          <span className="text-blue-300 font-medium">
            {resources.population.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>⚔️</span>
          <span className="text-red-300 font-medium">
            {resources.troops.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
