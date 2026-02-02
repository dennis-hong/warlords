import type { BattleUnit } from '../../types';
import { MoraleBar } from './MoraleBar';

interface UnitCardProps {
  unit: BattleUnit;
  isPlayer?: boolean;
  animState?: 'idle' | 'attacking' | 'hit' | 'dead';
  damageDisplay?: number | null;
}

// 병사 아이콘 컴포넌트
function SoldierIcon({ isPlayer, animState = 'idle', count }: { isPlayer: boolean; animState: string; count: number }) {
  const icon = isPlayer ? '🗡️' : '🛡️';
  const soldierCount = Math.min(Math.ceil(count / 2000), 5); // 병력 2000당 아이콘 1개, 최대 5개
  
  return (
    <div className="flex gap-0.5 justify-center my-2">
      {Array.from({ length: soldierCount }).map((_, i) => (
        <span 
          key={i} 
          className={`soldier ${animState}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          {icon}
        </span>
      ))}
    </div>
  );
}

export function UnitCard({ unit, isPlayer = false, animState = 'idle', damageDisplay }: UnitCardProps) {
  const troopPercentage = (unit.troops / unit.maxTroops) * 100;
  const isCritical = troopPercentage < 30;
  
  return (
    <div className={`rounded-xl p-4 ${isPlayer ? 'bg-blue-900/50 border-blue-500' : 'bg-red-900/50 border-red-500'} border-2 relative`}>
      {/* 피해량 팝업 */}
      {damageDisplay && damageDisplay > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-red-400 font-bold text-lg damage-popup">
          -{damageDisplay}
        </div>
      )}
      
      {/* 장수 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-4xl ${animState === 'attacking' ? 'duel-attack-left' : animState === 'hit' ? 'duel-attack-right' : ''}`}>
          {unit.general.portrait}
        </span>
        <div>
          <div className="text-lg font-bold">{unit.general.nameKo}</div>
          <div className="text-sm text-gray-400">{unit.general.name}</div>
        </div>
      </div>
      
      {/* 병사 아이콘 */}
      <SoldierIcon isPlayer={isPlayer} animState={animState} count={unit.troops} />
      
      {/* 능력치 */}
      <div className="grid grid-cols-4 gap-1 text-xs mb-3">
        <div className="text-center">
          <div className="text-red-400">무력</div>
          <div className="font-bold">{unit.general.might}</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400">지력</div>
          <div className="font-bold">{unit.general.intellect}</div>
        </div>
        <div className="text-center">
          <div className="text-green-400">정치</div>
          <div className="font-bold">{unit.general.politics}</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400">매력</div>
          <div className="font-bold">{unit.general.charisma}</div>
        </div>
      </div>
      
      {/* 병력 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">병력</span>
          <span className={`font-bold ${isCritical ? 'text-red-400' : ''}`}>
            {unit.troops.toLocaleString()} / {unit.maxTroops.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${isPlayer ? 'bg-blue-500' : 'bg-red-500'} transition-all duration-300 ${isCritical ? 'health-critical' : ''}`}
            style={{ width: `${troopPercentage}%` }}
          />
        </div>
      </div>
      
      {/* 사기 */}
      <MoraleBar morale={unit.morale} />
    </div>
  );
}
