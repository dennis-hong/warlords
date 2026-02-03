import { useState, useEffect, useRef } from 'react';

interface MoraleBarProps {
  morale: number;
  maxMorale?: number;
}

export function MoraleBar({ morale, maxMorale = 100 }: MoraleBarProps) {
  const percentage = (morale / maxMorale) * 100;
  const prevMoraleRef = useRef(morale);
  const [showChange, setShowChange] = useState<'up' | 'down' | null>(null);
  const [changeAmount, setChangeAmount] = useState(0);
  
  useEffect(() => {
    const diff = morale - prevMoraleRef.current;
    if (diff !== 0) {
      setChangeAmount(Math.abs(diff));
      setShowChange(diff > 0 ? 'up' : 'down');
      prevMoraleRef.current = morale;
      
      const timer = setTimeout(() => setShowChange(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [morale]);
  
  let fillClass = 'progress-fill jade troop-bar-animate';
  if (percentage < 30) fillClass = 'progress-fill crimson health-critical troop-bar-animate';
  else if (percentage < 60) fillClass = 'progress-fill gold troop-bar-animate';
  
  return (
    <div className="w-full relative">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-silk/60">사기</span>
        <span className={`font-bold transition-colors duration-300 ${percentage < 30 ? 'text-crimson-light animate-pulse' : 'text-silk'}`}>
          {morale}
          {/* 사기 변화 표시 */}
          {showChange && (
            <span className={`ml-1 text-xs ${showChange === 'up' ? 'text-jade-light' : 'text-crimson-light'}`}
                  style={{ animation: 'damagePopup 1s ease forwards' }}>
              {showChange === 'up' ? '+' : '-'}{changeAmount}
            </span>
          )}
        </span>
      </div>
      <div className="progress-bar h-2 overflow-hidden">
        <div
          className={`${fillClass} ${showChange ? 'morale-change' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
