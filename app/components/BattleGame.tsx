'use client';

import { useBattleState } from '../hooks';
import { UnitCard, BattleLog, ActionButtons, DuelPanel } from './ui';

export default function BattleGame() {
  const {
    battle,
    isClient,
    charge,
    defend,
    useStratagem,
    startDuel,
    selectDuelChoice,
    resetBattle
  } = useBattleState();

  // 로딩
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <div className="text-xl text-gray-400">전투 준비 중...</div>
        </div>
      </div>
    );
  }

  const isGameOver = battle.phase === 'victory' || battle.phase === 'defeat';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-3xl font-bold text-yellow-400 mb-1">⚔️ 삼국지 전투 ⚔️</h1>
        <div className="text-gray-400">
          라운드 {battle.round} / {battle.maxRounds}
        </div>
      </header>

      {/* 전투 유닛 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <UnitCard unit={battle.player} isPlayer />
        <UnitCard unit={battle.enemy} />
      </div>

      {/* VS 표시 */}
      <div className="text-center mb-4">
        <span className="text-2xl font-bold text-yellow-400">⚡ VS ⚡</span>
      </div>

      {/* 전투 로그 */}
      <div className="mb-4">
        <BattleLog logs={battle.logs} />
      </div>

      {/* 액션 영역 */}
      <div className="mb-4">
        {battle.phase === 'selection' && (
          <ActionButtons
            player={battle.player}
            onCharge={charge}
            onDefend={defend}
            onStratagem={useStratagem}
            onDuel={startDuel}
          />
        )}

        {battle.phase === 'duel' && (
          <DuelPanel
            player={battle.player}
            enemy={battle.enemy}
            onSelect={selectDuelChoice}
          />
        )}

        {isGameOver && (
          <div className="text-center">
            <div className={`text-4xl font-bold mb-4 ${battle.phase === 'victory' ? 'text-green-400' : 'text-red-400'}`}>
              {battle.phase === 'victory' ? '🎉 승리!' : '💀 패배...'}
            </div>
            <div className="text-gray-400 mb-4">
              {battle.phase === 'victory' 
                ? `${battle.enemy.general.nameKo}을(를) 물리쳤습니다!`
                : `${battle.player.general.nameKo}이(가) 패주했습니다...`
              }
            </div>
            <button
              onClick={resetBattle}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              🔄 다시 싸우기
            </button>
          </div>
        )}
      </div>

      {/* 도움말 */}
      {!isGameOver && battle.phase === 'selection' && (
        <div className="text-center text-xs text-gray-500 mt-4">
          <p>💡 사기가 0이 되면 패주합니다!</p>
          <p>👊 일기토로 적 사기를 크게 떨어뜨릴 수 있습니다</p>
        </div>
      )}
    </div>
  );
}
