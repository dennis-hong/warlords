import type { BattleUnit } from '../../types';
import { MoraleBar } from './MoraleBar';
import { useState, useEffect, useRef } from 'react';

interface UnitCardProps {
  unit: BattleUnit;
  isPlayer?: boolean;
  animState?: 'idle' | 'attacking' | 'hit' | 'dead';
  damageDisplay?: number | null;
  isCritical?: boolean;
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

export function UnitCard({ unit, isPlayer = false, animState = 'idle', damageDisplay, isCritical: isCriticalDamage }: UnitCardProps) {
  const troopPercentage = (unit.troops / unit.maxTroops) * 100;
  const isLowHealth = troopPercentage < 30;
  
  // 이전 병력 추적 (병력 변화 애니메이션용)
  const prevTroopsRef = useRef(unit.troops);
  const [troopChange, setTroopChange] = useState<'none' | 'decrease' | 'increase'>('none');
  
  useEffect(() => {
    if (unit.troops < prevTroopsRef.current) {
      setTroopChange('decrease');
    } else if (unit.troops > prevTroopsRef.current) {
      setTroopChange('increase');
    }
    prevTroopsRef.current = unit.troops;
    
    // 애니메이션 후 리셋
    const timer = setTimeout(() => setTroopChange('none'), 800);
    return () => clearTimeout(timer);
  }, [unit.troops]);

  // 초상화 애니메이션 클래스
  const portraitAnimClass = animState === 'attacking' 
    ? 'portrait-attack' 
    : animState === 'hit' 
      ? 'portrait-hurt' 
      : animState === 'idle' && !damageDisplay 
        ? 'portrait-ready' 
        : '';
  
  // 병력 바 애니메이션 클래스
  const troopBarAnimClass = troopChange === 'decrease' 
    ? 'troop-decrease' 
    : troopChange === 'increase' 
      ? 'troop-increase' 
      : '';
  
  return (
    <div className={`rounded-xl p-4 ${isPlayer ? 'peace-card' : 'war-card'} relative`}>
      {/* 피해량 팝업 - 크리티컬 강화 */}
      {damageDisplay && damageDisplay > 0 && (
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 font-bold z-20 ${
          isCriticalDamage 
            ? 'damage-critical text-2xl' 
            : damageDisplay >= 1000 
              ? 'damage-popup-large text-crimson-light' 
              : 'damage-popup text-lg text-crimson-light'
        }`}>
          -{damageDisplay.toLocaleString()}
          {isCriticalDamage && <span className="ml-1 text-xs">💥</span>}
        </div>
      )}
      
      {/* 장수 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-4xl ${portraitAnimClass}`}>
          {unit.general.portrait}
        </span>
        <div>
          <div className="text-lg font-bold text-silk">{unit.general.nameKo}</div>
          <div className="text-sm text-silk/50">{unit.general.nameKo}</div>
        </div>
      </div>
      
      {/* 병사 아이콘 */}
      <SoldierIcon isPlayer={isPlayer} animState={animState} count={unit.troops} />
      
      {/* 능력치 */}
      <div className="grid grid-cols-4 gap-1 text-xs mb-3">
        <div className="stat-badge might text-center">
          <div className="text-crimson-light">무</div>
          <div className="font-bold text-silk">{unit.general.might}</div>
        </div>
        <div className="stat-badge intellect text-center">
          <div className="text-blue-400">지</div>
          <div className="font-bold text-silk">{unit.general.intellect}</div>
        </div>
        <div className="stat-badge politics text-center">
          <div className="text-jade-light">정</div>
          <div className="font-bold text-silk">{unit.general.politics}</div>
        </div>
        <div className="stat-badge charisma text-center">
          <div className="text-gold-light">매</div>
          <div className="font-bold text-silk">{unit.general.charisma}</div>
        </div>
      </div>
      
      {/* 병력 */}
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-silk/60">병력</span>
          <span className={`font-bold transition-colors duration-300 ${
            isLowHealth ? 'text-crimson-light animate-pulse' : 'text-silk'
          }`}>
            {unit.troops.toLocaleString()} / {unit.maxTroops.toLocaleString()}
          </span>
        </div>
        <div className="progress-bar h-3 overflow-hidden">
          <div
            className={`progress-fill troop-bar-animate ${isPlayer ? 'jade' : 'crimson'} ${isLowHealth ? 'health-critical' : ''} ${troopBarAnimClass}`}
            style={{ width: `${troopPercentage}%` }}
          />
        </div>
      </div>
      
      {/* 사기 */}
      <MoraleBar morale={unit.morale} />
    </div>
  );
}
