import { useEffect, useRef } from 'react';
import type { BattleLog as BattleLogType } from '../../types';

interface BattleLogProps {
  logs: BattleLogType[];
}

export function BattleLog({ logs }: BattleLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const typeColors: Record<string, string> = {
    info: 'text-silk/80',
    damage: 'text-crimson-light',
    morale: 'text-gold-light',
    stratagem: 'text-bronze',
    duel: 'text-gold',
    victory: 'text-jade-light',
    defeat: 'text-crimson'
  };

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={scrollRef} className="rounded-xl p-4 h-48 overflow-y-auto border border-silk/10 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(42,42,58,0.6) 0%, rgba(26,26,36,0.6) 100%)' }}>
      <div className="text-sm font-bold mb-3 text-gold flex items-center gap-2">
        📜 전투 기록
      </div>
      <div className="space-y-1.5 text-sm">
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`battle-log-entry ${typeColors[log.type] || 'text-silk/80'}`}
          >
            {log.round > 0 && (
              <span className="text-silk/40 mr-1">[{log.round}]</span>
            )}
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
