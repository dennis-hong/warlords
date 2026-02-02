interface MoraleBarProps {
  morale: number;
  maxMorale?: number;
}

export function MoraleBar({ morale, maxMorale = 100 }: MoraleBarProps) {
  const percentage = (morale / maxMorale) * 100;
  
  let fillClass = 'progress-fill jade';
  if (percentage < 30) fillClass = 'progress-fill crimson health-critical';
  else if (percentage < 60) fillClass = 'progress-fill gold';
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-silk/60">사기</span>
        <span className={`font-bold ${percentage < 30 ? 'text-crimson-light' : 'text-silk'}`}>
          {morale}
        </span>
      </div>
      <div className="progress-bar h-2">
        <div
          className={fillClass}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
