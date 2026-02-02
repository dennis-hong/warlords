import type { DuelChoice, BattleUnit } from '../../types';

interface DuelPanelProps {
  player: BattleUnit;
  enemy: BattleUnit;
  onSelect: (choice: DuelChoice) => void;
}

export function DuelPanel({ player, enemy, onSelect }: DuelPanelProps) {
  const choices: { id: DuelChoice; name: string; emoji: string; desc: string; btnClass: string }[] = [
    { id: 'power', name: '강공', emoji: '💪', desc: '필살기에 이김', btnClass: 'btn-war' },
    { id: 'counter', name: '견제', emoji: '🤺', desc: '강공에 이김', btnClass: 'btn-peace' },
    { id: 'special', name: '필살기', emoji: '⚡', desc: '견제에 이김', btnClass: 'btn-gold' }
  ];

  return (
    <div className="dynasty-card rounded-xl p-6 text-center animate-scale-in">
      <h2 className="text-2xl font-bold mb-4 text-gold title-glow">⚔️ 일기토 ⚔️</h2>
      
      {/* 대결 구도 */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center peace-card rounded-lg p-3">
          <span className="text-4xl block mb-1">{player.general.portrait}</span>
          <div className="font-bold text-silk">{player.general.nameKo}</div>
          <div className="text-sm text-crimson-light font-medium">武 {player.general.might}</div>
        </div>
        <div className="text-3xl font-bold text-gold animate-pulse">VS</div>
        <div className="text-center war-card rounded-lg p-3">
          <span className="text-4xl block mb-1">{enemy.general.portrait}</span>
          <div className="font-bold text-silk">{enemy.general.nameKo}</div>
          <div className="text-sm text-crimson-light font-medium">武 {enemy.general.might}</div>
        </div>
      </div>

      {/* 선택지 */}
      <div className="text-sm text-silk/60 mb-3">행동을 선택하세요:</div>
      <div className="grid grid-cols-3 gap-3">
        {choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onSelect(choice.id)}
            className={`${choice.btnClass} py-4 px-2 rounded-lg`}
          >
            <div className="text-2xl mb-1">{choice.emoji}</div>
            <div className="text-sm">{choice.name}</div>
            <div className="text-xs opacity-70 mt-1">{choice.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-silk/40">
        같은 선택 시 무력이 높은 쪽이 승리!
      </div>
    </div>
  );
}
