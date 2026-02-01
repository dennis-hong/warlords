interface MoraleBarProps {
  morale: number;
  maxMorale?: number;
}

export function MoraleBar({ morale, maxMorale = 100 }: MoraleBarProps) {
  const percentage = (morale / maxMorale) * 100;
  
  let colorClass = 'bg-green-500';
  if (percentage < 30) colorClass = 'bg-red-500';
  else if (percentage < 60) colorClass = 'bg-yellow-500';
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">사기</span>
        <span className="font-bold">{morale}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
