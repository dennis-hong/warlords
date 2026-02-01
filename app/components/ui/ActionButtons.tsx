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
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onCharge}
          disabled={disabled}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          ⚔️ 돌격
        </button>
        <button
          onClick={onDefend}
          disabled={disabled}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          🛡️ 수비
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowStratagems(!showStratagems)}
          disabled={disabled || availableStratagems.length === 0}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          🧠 계략 ({availableStratagems.length})
        </button>
        <button
          onClick={onDuel}
          disabled={disabled}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          👊 일기토
        </button>
      </div>

      {/* 계략 선택 */}
      {showStratagems && availableStratagems.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-2">
          <div className="text-sm text-gray-400 mb-2">사용 가능한 계략:</div>
          {availableStratagems.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onStratagem(s.id);
                setShowStratagems(false);
              }}
              className="w-full text-left bg-purple-800/50 hover:bg-purple-700/50 p-2 rounded-lg transition-colors"
            >
              <div className="font-bold">{s.nameKo} ({s.name})</div>
              <div className="text-xs text-gray-400">지력 {s.requiredIntellect}+ | {s.effect}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
