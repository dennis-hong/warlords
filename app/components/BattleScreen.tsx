'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BattleInitData, BattleOutcome, BattleState, BattleUnit, BattleLog, DuelChoice, RegionId, Region } from '../types';
import { GENERALS, GAME_CONFIG, MORALE_CHANGES } from '../constants/gameData';
import {
  calculateDamage,
  resolveDuel,
  applyMoraleChange,
  applyTroopDamage,
  selectEnemyAction,
  selectEnemyDuelChoice,
  applyStratagem,
  checkRout
} from '../utils/battle';
import { UnitCard, BattleLog as BattleLogPanel, ActionButtons, DuelPanel } from './ui';

interface BattleScreenProps {
  battleData: BattleInitData;
  regions: Record<RegionId, Region>;
  onBattleEnd: (outcome: BattleOutcome) => void;
}

export default function BattleScreen({ battleData, regions, onBattleEnd }: BattleScreenProps) {
  // 전투 상태 초기화
  const initBattle = useCallback((): BattleState => {
    // 플레이어 주장 찾기
    const commanderUnit = battleData.playerUnits.find(u => u.isCommander) || battleData.playerUnits[0];
    const commanderGeneral = GENERALS[commanderUnit.generalId];
    const totalPlayerTroops = battleData.playerUnits.reduce((sum, u) => sum + u.troops, 0);

    // 적 장수 (첫 번째 또는 기본)
    const enemyGeneralId = battleData.enemyGeneralIds[0] || 'xiaohoudun';
    const enemyGeneral = GENERALS[enemyGeneralId] || GENERALS.xiaohoudun;

    // 적 병력
    const enemyTroops = battleData.enemyTroops || regions[battleData.enemyRegionId]?.troops || 5000;

    // 주장 병종
    const troopType = commanderUnit.troopType;

    return {
      round: 1,
      maxRounds: 5,
      player: {
        general: commanderGeneral,
        troops: totalPlayerTroops,
        maxTroops: totalPlayerTroops,
        morale: GAME_CONFIG.INITIAL_MORALE,
        troopType,
        usedStratagems: []
      },
      enemy: {
        general: enemyGeneral,
        troops: enemyTroops,
        maxTroops: enemyTroops,
        morale: GAME_CONFIG.INITIAL_MORALE,
        troopType: 'infantry',
        usedStratagems: []
      },
      logs: [{
        round: 0,
        message: `⚔️ 전투 개시! ${commanderGeneral.nameKo} vs ${enemyGeneral.nameKo}`,
        type: 'info'
      }],
      phase: 'selection'
    };
  }, [battleData, regions]);

  const [battle, setBattle] = useState<BattleState>(initBattle);

  // 초기 병력 저장 (결과 계산용)
  const [initialTroops] = useState({
    player: battleData.playerUnits.reduce((sum, u) => sum + u.troops, 0),
    enemy: battleData.enemyTroops || regions[battleData.enemyRegionId]?.troops || 5000
  });

  // 전투 종료 체크
  const checkBattleEnd = useCallback((player: BattleUnit, enemy: BattleUnit, round: number, maxRounds: number): 'victory' | 'defeat' | null => {
    if (checkRout(enemy) || enemy.troops <= 0) return 'victory';
    if (checkRout(player) || player.troops <= 0) return 'defeat';
    if (round > maxRounds) {
      return player.morale > enemy.morale ? 'victory' : 'defeat';
    }
    return null;
  }, []);

  // 전투 결과 처리
  useEffect(() => {
    if (battle.phase === 'victory' || battle.phase === 'defeat') {
      const outcome: BattleOutcome = {
        winner: battle.phase === 'victory' ? 'player' : 'enemy',
        playerTroopsLost: initialTroops.player - battle.player.troops,
        enemyTroopsLost: initialTroops.enemy - battle.enemy.troops,
        capturedGenerals: [],
        conqueredRegion: battle.phase === 'victory'
      };
      // 약간의 딜레이 후 결과 전달
      const timer = setTimeout(() => {
        onBattleEnd(outcome);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [battle.phase, battle.player.troops, battle.enemy.troops, initialTroops, onBattleEnd]);

  // 돌격
  const charge = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      const enemyAction = selectEnemyAction(prev.enemy, prev.player);
      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      const playerDamage = calculateDamage(player, enemy, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER);
      enemy.troops = applyTroopDamage(enemy, playerDamage);
      logs.push({ round: prev.round, message: `⚔️ ${player.general.nameKo} 돌격! 적 ${playerDamage}명 피해!`, type: 'damage' });

      if (enemyAction.action === 'charge') {
        const enemyDamage = calculateDamage(enemy, player, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER);
        player.troops = applyTroopDamage(player, enemyDamage);
        logs.push({ round: prev.round, message: `⚔️ ${enemy.general.nameKo} 반격! 아군 ${enemyDamage}명 피해!`, type: 'damage' });
      } else if (enemyAction.action === 'defend') {
        logs.push({ round: prev.round, message: `🛡️ ${enemy.general.nameKo}이(가) 수비 태세!`, type: 'info' });
      } else if (enemyAction.action === 'stratagem' && enemyAction.stratagem) {
        const result = applyStratagem(enemyAction.stratagem, enemy, player);
        enemy = result.caster;
        player = result.target;
        logs.push({ round: prev.round, message: result.message, type: 'stratagem' });
      }

      if (playerDamage > 0) {
        enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.ROUND_LOSE);
        player.morale = applyMoraleChange(player, MORALE_CHANGES.ROUND_WIN);
      }

      const newRound = prev.round + 1;
      const battleEnd = checkBattleEnd(player, enemy, newRound, prev.maxRounds);

      return {
        ...prev,
        round: newRound,
        player,
        enemy,
        logs: [...prev.logs, ...logs],
        phase: battleEnd || 'selection'
      };
    });
  }, [checkBattleEnd]);

  // 수비
  const defend = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      const enemyAction = selectEnemyAction(prev.enemy, prev.player);
      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      logs.push({ round: prev.round, message: `🛡️ ${player.general.nameKo} 수비 태세!`, type: 'info' });

      if (enemyAction.action === 'charge') {
        const enemyDamage = Math.round(calculateDamage(enemy, player) * GAME_CONFIG.DEFEND_DAMAGE_REDUCTION);
        player.troops = applyTroopDamage(player, enemyDamage);
        logs.push({ round: prev.round, message: `⚔️ ${enemy.general.nameKo} 공격! (수비로 감소) 아군 ${enemyDamage}명 피해!`, type: 'damage' });
      } else if (enemyAction.action === 'defend') {
        logs.push({ round: prev.round, message: `🛡️ ${enemy.general.nameKo}도 수비 태세! 교착 상태...`, type: 'info' });
      } else if (enemyAction.action === 'stratagem' && enemyAction.stratagem) {
        const result = applyStratagem(enemyAction.stratagem, enemy, player);
        enemy = result.caster;
        player = result.target;
        logs.push({ round: prev.round, message: result.message, type: 'stratagem' });
      }

      const newRound = prev.round + 1;
      const battleEnd = checkBattleEnd(player, enemy, newRound, prev.maxRounds);

      return {
        ...prev,
        round: newRound,
        player,
        enemy,
        logs: [...prev.logs, ...logs],
        phase: battleEnd || 'selection'
      };
    });
  }, [checkBattleEnd]);

  // 계략
  const useStratagem = useCallback((stratagemId: string) => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      const result = applyStratagem(stratagemId, player, enemy);
      player = result.caster;
      enemy = result.target;
      logs.push({ round: prev.round, message: result.message, type: 'stratagem' });

      const enemyAction = selectEnemyAction(enemy, player);
      if (enemyAction.action === 'charge') {
        const enemyDamage = calculateDamage(enemy, player, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER);
        player.troops = applyTroopDamage(player, enemyDamage);
        logs.push({ round: prev.round, message: `⚔️ ${enemy.general.nameKo} 돌격! 아군 ${enemyDamage}명 피해!`, type: 'damage' });
        player.morale = applyMoraleChange(player, MORALE_CHANGES.ROUND_LOSE);
      }

      const newRound = prev.round + 1;
      const battleEnd = checkBattleEnd(player, enemy, newRound, prev.maxRounds);

      return {
        ...prev,
        round: newRound,
        player,
        enemy,
        logs: [...prev.logs, ...logs],
        phase: battleEnd || 'selection'
      };
    });
  }, [checkBattleEnd]);

  // 일기토 시작
  const startDuel = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;
      return { ...prev, phase: 'duel', duelInProgress: {} };
    });
  }, []);

  // 일기토 선택
  const selectDuelChoice = useCallback((choice: DuelChoice) => {
    setBattle(prev => {
      if (prev.phase !== 'duel') return prev;

      const enemyChoice = selectEnemyDuelChoice();
      const result = resolveDuel(choice, enemyChoice, prev.player, prev.enemy);

      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      const choiceNames: Record<DuelChoice, string> = {
        power: '강공',
        counter: '견제',
        special: '필살기'
      };

      logs.push({
        round: prev.round,
        message: `👊 일기토! ${player.general.nameKo}(${choiceNames[choice]}) vs ${enemy.general.nameKo}(${choiceNames[enemyChoice]})`,
        type: 'duel'
      });

      if (result.winner === 'player') {
        enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.DUEL_LOSE);
        player.morale = applyMoraleChange(player, MORALE_CHANGES.DUEL_WIN);
        logs.push({ round: prev.round, message: `🎉 ${player.general.nameKo} 일기토 승리! 적 사기 대폭 하락!`, type: 'duel' });
      } else if (result.winner === 'enemy') {
        player.morale = applyMoraleChange(player, MORALE_CHANGES.DUEL_LOSE);
        enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.DUEL_WIN);
        logs.push({ round: prev.round, message: `💀 ${enemy.general.nameKo} 일기토 승리! 아군 사기 대폭 하락!`, type: 'duel' });
      } else {
        logs.push({ round: prev.round, message: `⚖️ 일기토 무승부!`, type: 'duel' });
      }

      const newRound = prev.round + 1;
      const battleEnd = checkBattleEnd(player, enemy, newRound, prev.maxRounds);

      return {
        ...prev,
        round: newRound,
        player,
        enemy,
        logs: [...prev.logs, ...logs],
        phase: battleEnd || 'selection',
        duelInProgress: undefined
      };
    });
  }, [checkBattleEnd]);

  const isGameOver = battle.phase === 'victory' || battle.phase === 'defeat';
  const targetRegion = regions[battleData.enemyRegionId];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* 헤더 */}
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-yellow-400 mb-1">
          ⚔️ {targetRegion?.nameKo} 공략전 ⚔️
        </h1>
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
        <BattleLogPanel logs={battle.logs} />
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
                ? `${targetRegion?.nameKo}을(를) 점령합니다!`
                : '아군이 퇴각합니다...'
              }
            </div>
            <div className="text-sm text-gray-500">
              잠시 후 맵으로 돌아갑니다...
            </div>
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
