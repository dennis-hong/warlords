import type { DuelChoice, BattleUnit } from '../../types';

interface DuelPanelProps {
  player: BattleUnit;
  enemy: BattleUnit;
  onSelect: (choice: DuelChoice) => void;
}

export function DuelPanel({ player, enemy, onSelect }: DuelPanelProps) {
  const choices: { id: DuelChoice; name: string; emoji: string; desc: string }[] = [
    { id: 'power', name: '강공', emoji: '💪', desc: '필살기에 이김' },
    { id: 'counter', name: '견제', emoji: '🤺', desc: '강공에 이김' },
    { id: 'special', name: '필살기', emoji: '⚡', desc: '견제에 이김' }
  ];

  return (
    <div className="bg-gray-900/90 rounded-xl p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">⚔️ 일기토 ⚔️</h2>
      
      {/* 대결 구도 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <span className="text-4xl">{player.general.portrait}</span>
          <div className="font-bold">{player.general.nameKo}</div>
          <div className="text-sm text-red-400">무력 {player.general.might}</div>
        </div>
        <div className="text-3xl font-bold text-yellow-400">VS</div>
        <div className="text-center">
          <span className="text-4xl">{enemy.general.portrait}</span>
          <div className="font-bold">{enemy.general.nameKo}</div>
          <div className="text-sm text-red-400">무력 {enemy.general.might}</div>
        </div>
      </div>

      {/* 선택지 */}
      <div className="text-sm text-gray-400 mb-3">행동을 선택하세요:</div>
      <div className="grid grid-cols-3 gap-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-2 rounded-lg transition-colors"
          >
            <div className="text-2xl mb-1">{choice.emoji}</div>
            <div>{choice.name}</div>
            <div className="text-xs text-orange-200">{choice.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        같은 선택 시 무력이 높은 쪽이 승리!
      </div>
    </div>
  );
}
