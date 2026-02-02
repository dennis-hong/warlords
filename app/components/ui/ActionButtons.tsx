'use client';

import { useState } from 'react';
import type { BattleUnit, Stratagem } from '../../types';
import { getAvailableStratagems } from '../../utils/battle';

interface ActionButtonsProps {
  player: BattleUnit;
  onCharge: () => void;
  onDefend: () => void;
  onStratagem: (id: string) => void;
  onDuel: () => void;
  disabled?: boolean;
}

export function ActionButtons({
  player,
  onCharge,
  onDefend,
  onStratagem,
  onDuel,
  disabled = false
}: ActionButtonsProps) {
  const [showStratagems, setShowStratagems] = useState(false);
  const availableStratagems = getAvailableStratagems(player);

  return (
    <div className="space-y-3">
      {/* 메인 액션 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCharge}
          disabled={disabled}
          className="btn-war py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-lg"
        >
          ⚔️ 돌격
        </button>
        <button
          onClick={onDefend}
          disabled={disabled}
          className="btn-peace py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-lg"
        >
          🛡️ 수비
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowStratagems(!showStratagems)}
          disabled={disabled || availableStratagems.length === 0}
          className="btn-bronze py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-lg"
        >
          🧠 계략 ({availableStratagems.length})
        </button>
        <button
          onClick={onDuel}
          disabled={disabled}
          className="btn-gold py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-lg"
        >
          👊 일기토
        </button>
      </div>

      {/* 계략 선택 */}
      {showStratagems && availableStratagems.length > 0 && (
        <div className="dynasty-card rounded-lg p-4 space-y-2 animate-fade-in">
          <div className="text-sm text-silk/60 mb-2 flex items-center gap-2">
            <span>🧠</span>
            사용 가능한 계략:
          </div>
          {availableStratagems.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onStratagem(s.id);
                setShowStratagems(false);
              }}
              className="w-full text-left bg-bronze/20 hover:bg-bronze/30 p-3 rounded-lg transition-colors border border-bronze/30"
            >
              <div className="font-bold text-gold">{s.nameKo} <span className="text-silk/50 text-sm">({s.name})</span></div>
              <div className="text-xs text-silk/60 mt-1">지력 {s.requiredIntellect}+ | {s.effect}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
