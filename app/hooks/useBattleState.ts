'use client';

import { useState, useCallback } from 'react';
import type { BattleState, BattleUnit, BattleLog, DuelChoice } from '../types';
import { GENERALS, GAME_CONFIG, MORALE_CHANGES, STRATAGEMS } from '../constants/gameData';
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

// 초기 전투 상태 생성
function createInitialBattle(): BattleState {
  return {
    round: 1,
    maxRounds: 5,
    player: {
      general: GENERALS.guanyu,
      troops: 5000,
      maxTroops: 5000,
      morale: GAME_CONFIG.INITIAL_MORALE,
      troopType: 'cavalry',
      usedStratagems: []
    },
    enemy: {
      general: GENERALS.xiaohoudun,
      troops: 7000,
      maxTroops: 7000,
      morale: GAME_CONFIG.INITIAL_MORALE,
      troopType: 'infantry',
      usedStratagems: []
    },
    logs: [{ round: 0, message: '⚔️ 전투 개시! 관우 vs 하후돈', type: 'info' }],
    phase: 'selection'
  };
}

export function useBattleState() {
  const [battle, setBattle] = useState<BattleState>(createInitialBattle);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 확인
  useState(() => {
    setIsClient(true);
  });

  // 로그 추가
  const addLog = useCallback((log: Omit<BattleLog, 'round'>) => {
    setBattle(prev => ({
      ...prev,
      logs: [...prev.logs, { ...log, round: prev.round }]
    }));
  }, []);

  // 승패 체크
  const checkBattleEnd = useCallback((player: BattleUnit, enemy: BattleUnit, round: number, maxRounds: number): 'victory' | 'defeat' | null => {
    if (checkRout(enemy) || enemy.troops <= 0) return 'victory';
    if (checkRout(player) || player.troops <= 0) return 'defeat';
    if (round > maxRounds) {
      // 최대 라운드 초과 시 사기로 판정
      return player.morale > enemy.morale ? 'victory' : 'defeat';
    }
    return null;
  }, []);

  // 돌격 액션
  const charge = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      const enemyAction = selectEnemyAction(prev.enemy, prev.player);
      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      // 플레이어 돌격
      const playerDamage = calculateDamage(player, enemy, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER);
      enemy.troops = applyTroopDamage(enemy, playerDamage);
      logs.push({ round: prev.round, message: `⚔️ ${player.general.nameKo} 돌격! 적 ${playerDamage}명 피해!`, type: 'damage' });

      // 적 행동
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

      // 사기 변화
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

  // 수비 액션
  const defend = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      const enemyAction = selectEnemyAction(prev.enemy, prev.player);
      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      logs.push({ round: prev.round, message: `🛡️ ${player.general.nameKo} 수비 태세!`, type: 'info' });

      // 적 행동
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

  // 계략 사용
  const useStratagem = useCallback((stratagemId: string) => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      // 플레이어 계략
      const result = applyStratagem(stratagemId, player, enemy);
      player = result.caster;
      enemy = result.target;
      logs.push({ round: prev.round, message: result.message, type: 'stratagem' });

      // 적 행동
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
      return {
        ...prev,
        phase: 'duel',
        duelInProgress: {}
      };
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

  // 게임 리셋
  const resetBattle = useCallback(() => {
    setBattle(createInitialBattle());
  }, []);

  return {
    battle,
    isClient,
    charge,
    defend,
    useStratagem,
    startDuel,
    selectDuelChoice,
    resetBattle
  };
}
