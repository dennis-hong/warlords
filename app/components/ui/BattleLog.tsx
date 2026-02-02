import { useEffect, useRef } from 'react';
import type { BattleLog as BattleLogType } from '../../types';

interface BattleLogProps {
  logs: BattleLogType[];
}

export function BattleLog({ logs }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const typeColors: Record<string, string> = {
    info: 'text-gray-300',
    damage: 'text-red-400',
    morale: 'text-yellow-400',
    stratagem: 'text-purple-400',
    duel: 'text-orange-400',
    victory: 'text-green-400',
    defeat: 'text-red-500'
  };

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="bg-gray-900/80 rounded-xl p-4 h-48 overflow-y-auto">
      <div className="text-sm font-bold mb-2 text-gray-400">📜 전투 기록</div>
      <div className="space-y-1 text-sm">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`battle-log-entry ${typeColors[log.type] || 'text-gray-300'}`}
          >
            {log.round > 0 && <span className="text-gray-500">[{log.round}] </span>}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
