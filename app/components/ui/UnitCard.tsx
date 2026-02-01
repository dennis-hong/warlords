import type { BattleUnit } from '../../types';
import { MoraleBar } from './MoraleBar';

interface UnitCardProps {
  unit: BattleUnit;
  isPlayer?: boolean;
}

export function UnitCard({ unit, isPlayer = false }: UnitCardProps) {
  const troopPercentage = (unit.troops / unit.maxTroops) * 100;
  
  return (
    <div className={`rounded-xl p-4 ${isPlayer ? 'bg-blue-900/50 border-blue-500' : 'bg-red-900/50 border-red-500'} border-2`}>
      {/* 장수 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{unit.general.portrait}</span>
        <div>
          <div className="text-lg font-bold">{unit.general.nameKo}</div>
          <div className="text-sm text-gray-400">{unit.general.name}</div>
        </div>
      </div>
      
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
          <span className="font-bold">{unit.troops.toLocaleString()} / {unit.maxTroops.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${isPlayer ? 'bg-blue-500' : 'bg-red-500'} transition-all duration-300`}
            style={{ width: `${troopPercentage}%` }}
          />
        </div>
      </div>
      
      {/* 사기 */}
      <MoraleBar morale={unit.morale} />
    </div>
  );
}
