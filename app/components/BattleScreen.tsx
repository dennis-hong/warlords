'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleInitData, BattleOutcome, BattleState, BattleUnit, BattleLog, DuelChoice, RegionId, Region, GeneralFate, DuelHealth } from '../types';
import { GENERALS, GAME_CONFIG, MORALE_CHANGES, findGeneral } from '../constants/gameData';
import {
  calculateDamage,
  resolveDuel,
  applyMoraleChange,
  applyTroopDamage,
  selectEnemyAction,
  selectEnemyDuelChoice,
  applyStratagem,
  checkRout,
  determineBattleFate,
  checkDuelDeath
} from '../utils/battle';
import { UnitCard, BattleLog as BattleLogPanel, ActionButtons, DuelPanel } from './ui';

// 애니메이션 상태 타입
type AnimState = 'idle' | 'attacking' | 'hit' | 'dead';

// 액션 이펙트 타입
type ActionEffect = 'none' | 'charge' | 'defend' | 'stratagem' | 'fire';

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
    const commanderGeneral = findGeneral(commanderUnit.generalId) || GENERALS.xiaohoudun;
    const totalPlayerTroops = battleData.playerUnits.reduce((sum, u) => sum + u.troops, 0);

    // 적 장수 (첫 번째 또는 기본)
    const enemyGeneralId = battleData.enemyGeneralIds[0] || 'xiaohoudun';
    const enemyGeneral = findGeneral(enemyGeneralId) || GENERALS.xiaohoudun;

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

  // 일기토 HP 상태 (장수 생존 판정용)
  const [duelHealth, setDuelHealth] = useState<DuelHealth>({ player: 100, enemy: 100 });
  
  // 장수 사망 기록
  const [generalDeaths, setGeneralDeaths] = useState<{player: boolean, enemy: boolean}>({ player: false, enemy: false });

  // 애니메이션 상태
  const [playerAnim, setPlayerAnim] = useState<AnimState>('idle');
  const [enemyAnim, setEnemyAnim] = useState<AnimState>('idle');
  const [playerDamage, setPlayerDamage] = useState<number | null>(null);
  const [enemyDamage, setEnemyDamage] = useState<number | null>(null);
  const [showClash, setShowClash] = useState(false);
  
  // 강화된 애니메이션 상태
  const [showIntro, setShowIntro] = useState(true);
  const [screenShake, setScreenShake] = useState<'none' | 'light' | 'strong'>('none');
  const [playerEffect, setPlayerEffect] = useState<ActionEffect>('none');
  const [enemyEffect, setEnemyEffect] = useState<ActionEffect>('none');
  const [isCriticalDamage, setIsCriticalDamage] = useState(false);
  const [vsIntense, setVsIntense] = useState(false);

  // 실시간 중계 모드
  const [autoPlay, setAutoPlay] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 3x
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // 인트로 애니메이션 종료
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 화면 흔들림 리셋
  useEffect(() => {
    if (screenShake !== 'none') {
      const timer = setTimeout(() => setScreenShake('none'), 600);
      return () => clearTimeout(timer);
    }
  }, [screenShake]);

  // VS 인텐스 모드 (사기가 낮을 때)
  useEffect(() => {
    const isIntense = battle.player.morale < 30 || battle.enemy.morale < 30;
    setVsIntense(isIntense);
  }, [battle.player.morale, battle.enemy.morale]);

  // 애니메이션 실행 함수 (강화)
  const playAnimation = useCallback((
    type: 'playerAttack' | 'enemyAttack' | 'clash' | 'duel',
    damage?: { player?: number; enemy?: number },
    action?: 'charge' | 'defend' | 'stratagem' | 'fire'
  ) => {
    // 크리티컬 데미지 판정 (2000 이상)
    const isCritical = (damage?.player && damage.player >= 2000) || (damage?.enemy && damage.enemy >= 2000);
    setIsCriticalDamage(isCritical || false);

    // 화면 흔들림
    if (type === 'clash' || type === 'duel' || isCritical) {
      setScreenShake('strong');
    } else if (type === 'playerAttack' || type === 'enemyAttack') {
      setScreenShake('light');
    }

    // 충돌 이펙트
    if (type === 'clash' || type === 'duel') {
      setShowClash(true);
      setPlayerAnim('attacking');
      setEnemyAnim('attacking');
      setPlayerEffect('charge');
      setEnemyEffect('charge');
      setTimeout(() => setShowClash(false), 500);
    }

    if (type === 'playerAttack' || type === 'clash') {
      setPlayerAnim('attacking');
      setEnemyAnim('hit');
      if (damage?.enemy) setEnemyDamage(damage.enemy);
      
      // 액션 이펙트
      if (action === 'charge') setPlayerEffect('charge');
      else if (action === 'defend') setPlayerEffect('defend');
      else if (action === 'fire') {
        setPlayerEffect('fire');
        setEnemyEffect('fire');
      }
      else if (action === 'stratagem') setPlayerEffect('stratagem');
    }

    if (type === 'enemyAttack') {
      setEnemyAnim('attacking');
      setPlayerAnim('hit');
      if (damage?.player) setPlayerDamage(damage.player);
      
      if (action === 'charge') setEnemyEffect('charge');
      else if (action === 'defend') setEnemyEffect('defend');
      else if (action === 'fire') {
        setEnemyEffect('fire');
        setPlayerEffect('fire');
      }
    }

    // 애니메이션 리셋
    setTimeout(() => {
      setPlayerAnim('idle');
      setEnemyAnim('idle');
      setPlayerDamage(null);
      setEnemyDamage(null);
      setPlayerEffect('none');
      setEnemyEffect('none');
      setIsCriticalDamage(false);
    }, 800);
  }, []);

  // 자동 진행 처리
  useEffect(() => {
    if (autoPlay && battle.phase === 'selection') {
      autoPlayRef.current = setTimeout(() => {
        // 랜덤 액션 선택 (자동 플레이)
        const actions = ['charge', 'defend', 'duel'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        if (randomAction === 'charge') charge();
        else if (randomAction === 'defend') defend();
        else startDuel();
      }, 2000 / playSpeed);
    }
    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [autoPlay, battle.phase, playSpeed]);

  // 일기토 자동 진행
  useEffect(() => {
    if (autoPlay && battle.phase === 'duel') {
      autoPlayRef.current = setTimeout(() => {
        const choices: DuelChoice[] = ['power', 'counter', 'special'];
        selectDuelChoice(choices[Math.floor(Math.random() * choices.length)]);
      }, 1000 / playSpeed);
    }
    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [autoPlay, battle.phase, playSpeed]);

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
      const isPlayerWinner = battle.phase === 'victory';
      
      // 플레이어 장수들의 운명 결정
      const playerGeneralFates: GeneralFate[] = battleData.playerUnits.map(unit => {
        const general = findGeneral(unit.generalId);
        // 일기토에서 죽은 경우
        if (generalDeaths.player && unit.isCommander) {
          return {
            generalId: unit.generalId,
            fate: 'dead' as const,
            message: `💀 ${general?.nameKo || unit.generalId}이(가) 전사했습니다!`
          };
        }
        // 패배한 경우 포로/탈출 판정
        if (!isPlayerWinner && general) {
          return determineBattleFate(general, unit.isCommander, true);
        }
        return { generalId: unit.generalId, fate: 'alive' as const };
      });

      // 적 장수들의 운명 결정
      const enemyGeneralFates: GeneralFate[] = battleData.enemyGeneralIds.map((genId, idx) => {
        const general = findGeneral(genId);
        // 일기토에서 죽은 경우 (첫 번째 장수가 주장)
        if (generalDeaths.enemy && idx === 0) {
          return {
            generalId: genId,
            fate: 'dead' as const,
            message: `💀 ${general?.nameKo || genId}이(가) 전사했습니다!`
          };
        }
        // 패배한 경우 포로/탈출 판정
        if (isPlayerWinner && general) {
          return determineBattleFate(general, idx === 0, true);
        }
        return { generalId: genId, fate: 'alive' as const };
      });

      const outcome: BattleOutcome = {
        winner: isPlayerWinner ? 'player' : 'enemy',
        playerTroopsLost: initialTroops.player - battle.player.troops,
        enemyTroopsLost: initialTroops.enemy - battle.enemy.troops,
        capturedGenerals: enemyGeneralFates.filter(f => f.fate === 'captured').map(f => f.generalId),
        conqueredRegion: isPlayerWinner,
        playerGeneralFates,
        enemyGeneralFates
      };
      
      // 약간의 딜레이 후 결과 전달
      const timer = setTimeout(() => {
        onBattleEnd(outcome);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [battle.phase, battle.player.troops, battle.enemy.troops, initialTroops, onBattleEnd, battleData, generalDeaths]);

  // 돌격
  const charge = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;

      const enemyAction = selectEnemyAction(prev.enemy, prev.player);
      let player = { ...prev.player };
      let enemy = { ...prev.enemy };
      const logs: BattleLog[] = [];

      const playerDmg = calculateDamage(player, enemy, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER, battleData.playerTraining || 50);
      enemy.troops = applyTroopDamage(enemy, playerDmg);
      logs.push({ round: prev.round, message: `⚔️ ${player.general.nameKo} 돌격! 적 ${playerDmg}명 피해!`, type: 'damage' });

      let enemyDmg = 0;
      if (enemyAction.action === 'charge') {
        enemyDmg = calculateDamage(enemy, player, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER, battleData.enemyTraining || 50);
        player.troops = applyTroopDamage(player, enemyDmg);
        logs.push({ round: prev.round, message: `⚔️ ${enemy.general.nameKo} 반격! 아군 ${enemyDmg}명 피해!`, type: 'damage' });
        // 쌍방 충돌 애니메이션
        playAnimation('clash', { player: enemyDmg, enemy: playerDmg }, 'charge');
      } else {
        // 플레이어만 공격
        playAnimation('playerAttack', { enemy: playerDmg }, 'charge');
        if (enemyAction.action === 'defend') {
          logs.push({ round: prev.round, message: `🛡️ ${enemy.general.nameKo}이(가) 수비 태세!`, type: 'info' });
        } else if (enemyAction.action === 'stratagem' && enemyAction.stratagem) {
          const result = applyStratagem(enemyAction.stratagem, enemy, player);
          enemy = result.caster;
          player = result.target;
          logs.push({ round: prev.round, message: result.message, type: 'stratagem' });
        }
      }

      if (playerDmg > 0) {
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
  }, [checkBattleEnd, playAnimation]);

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
        const enemyDmg = Math.round(calculateDamage(enemy, player, 1, battleData.enemyTraining || 50) * GAME_CONFIG.DEFEND_DAMAGE_REDUCTION);
        player.troops = applyTroopDamage(player, enemyDmg);
        logs.push({ round: prev.round, message: `⚔️ ${enemy.general.nameKo} 공격! (수비로 감소) 아군 ${enemyDmg}명 피해!`, type: 'damage' });
        playAnimation('enemyAttack', { player: enemyDmg }, 'charge');
        setPlayerEffect('defend'); // 수비 이펙트도 표시
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
  }, [checkBattleEnd, playAnimation]);

  // 계략
  const useStratagem = useCallback((stratagemId: string) => {
    // 화공이면 특별 이펙트
    if (stratagemId === 'fireAttack') {
      playAnimation('playerAttack', { enemy: 0 }, 'fire');
    } else {
      playAnimation('playerAttack', { enemy: 0 }, 'stratagem');
    }

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
        const enemyDamage = calculateDamage(enemy, player, GAME_CONFIG.CHARGE_DAMAGE_MULTIPLIER, battleData.enemyTraining || 50);
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
  }, [checkBattleEnd, playAnimation]);

  // 일기토 시작
  const startDuel = useCallback(() => {
    setBattle(prev => {
      if (prev.phase !== 'selection') return prev;
      return { ...prev, phase: 'duel', duelInProgress: {} };
    });
  }, []);

  // 일기토 선택
  const selectDuelChoice = useCallback((choice: DuelChoice) => {
    // 일기토 애니메이션
    playAnimation('duel');

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

      // HP 감소 처리
      let newPlayerHp = duelHealth.player;
      let newEnemyHp = duelHealth.enemy;

      if (result.winner === 'player') {
        enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.DUEL_LOSE);
        player.morale = applyMoraleChange(player, MORALE_CHANGES.DUEL_WIN);
        newEnemyHp = Math.max(0, duelHealth.enemy - result.damage);
        logs.push({ round: prev.round, message: `🎉 ${player.general.nameKo} 일기토 승리! 적 사기 대폭 하락! (적 HP: ${newEnemyHp})`, type: 'duel' });
        
        // 적 장수 HP 0 체크 - 사망 판정
        if (newEnemyHp <= 0) {
          const deathCheck = checkDuelDeath(enemy.general, false);
          if (deathCheck.fate === 'dead') {
            logs.push({ round: prev.round, message: deathCheck.message!, type: 'duel' });
            enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.GENERAL_DEATH);
            player.morale = applyMoraleChange(player, MORALE_CHANGES.ENEMY_GENERAL_DEATH);
            setGeneralDeaths(prev => ({ ...prev, enemy: true }));
          } else {
            logs.push({ round: prev.round, message: `⚠️ ${enemy.general.nameKo}이(가) 부상으로 퇴각!`, type: 'duel' });
          }
        }
      } else if (result.winner === 'enemy') {
        player.morale = applyMoraleChange(player, MORALE_CHANGES.DUEL_LOSE);
        enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.DUEL_WIN);
        newPlayerHp = Math.max(0, duelHealth.player - result.damage);
        logs.push({ round: prev.round, message: `💀 ${enemy.general.nameKo} 일기토 승리! 아군 사기 대폭 하락! (아군 HP: ${newPlayerHp})`, type: 'duel' });
        
        // 아군 장수 HP 0 체크 - 사망 판정
        if (newPlayerHp <= 0) {
          const deathCheck = checkDuelDeath(player.general, false);
          if (deathCheck.fate === 'dead') {
            logs.push({ round: prev.round, message: deathCheck.message!, type: 'duel' });
            player.morale = applyMoraleChange(player, MORALE_CHANGES.GENERAL_DEATH);
            enemy.morale = applyMoraleChange(enemy, MORALE_CHANGES.ENEMY_GENERAL_DEATH);
            setGeneralDeaths(prev => ({ ...prev, player: true }));
          } else {
            logs.push({ round: prev.round, message: `⚠️ ${player.general.nameKo}이(가) 부상으로 퇴각!`, type: 'duel' });
          }
        }
      } else {
        logs.push({ round: prev.round, message: `⚖️ 일기토 무승부!`, type: 'duel' });
      }

      // HP 상태 업데이트
      setDuelHealth({ player: newPlayerHp, enemy: newEnemyHp });

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
  }, [checkBattleEnd, playAnimation, duelHealth]);

  const isGameOver = battle.phase === 'victory' || battle.phase === 'defeat';
  const isVictory = battle.phase === 'victory';
  const isDefeat = battle.phase === 'defeat';
  const targetRegion = regions[battleData.enemyRegionId];

  // 화면 흔들림 클래스
  const shakeClass = screenShake === 'strong' ? 'screen-shake-strong' : screenShake === 'light' ? 'screen-shake' : '';
  
  // 액션 이펙트 클래스
  const getEffectClass = (effect: ActionEffect) => {
    switch (effect) {
      case 'charge': return 'charge-effect';
      case 'defend': return 'defend-effect';
      case 'stratagem': return 'stratagem-effect';
      case 'fire': return 'fire-effect';
      default: return '';
    }
  };

  return (
    <div className={`min-h-screen p-4 battle-atmosphere ${shakeClass} ${isDefeat ? 'defeat-overlay defeat-vignette' : ''}`}>
      {/* 전투 시작 인트로 오버레이 */}
      {showIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 battle-intro">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-float">⚔️</div>
            <h2 className="text-4xl font-bold text-gold title-glow mb-2">전투 개시!</h2>
            <p className="text-xl text-silk/70">{targetRegion?.nameKo} 공략전</p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="text-center mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gold mb-2 title-fancy">
          ⚔️ {targetRegion?.nameKo} 공략전 ⚔️
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="dynasty-card px-4 py-2 rounded-lg">
            <span className="text-silk/60 text-sm">라운드</span>
            <span className="text-2xl font-bold text-gold ml-2 round-indicator" key={battle.round}>{battle.round}</span>
            <span className="text-silk/40 text-sm"> / {battle.maxRounds}</span>
          </div>
          {autoPlay && (
            <span className="bg-crimson text-silk text-xs px-3 py-1 rounded-full font-bold animate-pulse shadow-lg">
              🔴 LIVE
            </span>
          )}
        </div>
      </header>

      {/* 실시간 중계 컨트롤 */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
            autoPlay 
              ? 'btn-war' 
              : 'btn-peace'
          }`}
        >
          {autoPlay ? '⏸️ 멈춤' : '▶️ 자동 진행'}
        </button>
        <div className="flex gap-1">
          {[1, 2, 3].map(speed => (
            <button
              key={speed}
              onClick={() => setPlaySpeed(speed)}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition ${
                playSpeed === speed 
                  ? 'btn-gold' 
                  : 'btn-wood'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* 전투 유닛 */}
      <div className="grid grid-cols-2 gap-4 mb-4 relative">
        <div className={`unit-enter-left ${getEffectClass(playerEffect)}`}>
          <UnitCard 
            unit={battle.player} 
            isPlayer 
            animState={playerAnim}
            damageDisplay={playerDamage}
            isCritical={isCriticalDamage && playerDamage !== null}
          />
        </div>
        <div className={`unit-enter-right ${getEffectClass(enemyEffect)}`}>
          <UnitCard 
            unit={battle.enemy} 
            animState={enemyAnim}
            damageDisplay={enemyDamage}
            isCritical={isCriticalDamage && enemyDamage !== null}
          />
        </div>
        
        {/* 충돌 이펙트 */}
        {showClash && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-6xl clash-effect">💥</span>
          </div>
        )}
      </div>

      {/* VS 표시 */}
      <div className="text-center mb-4">
        <span className={`text-2xl font-bold text-gold ${showClash ? 'duel-clash' : vsIntense ? 'vs-intense' : 'vs-pulse'}`}>
          ⚡ VS ⚡
        </span>
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
          <div className={`dynasty-card rounded-xl p-6 text-center animate-scale-in relative overflow-hidden ${
            isVictory ? 'victory-celebration victory-rays' : ''
          }`}>
            {/* 승리 시 추가 파티클 */}
            {isVictory && (
              <>
                <div className="absolute top-0 left-1/4 text-3xl" style={{ animation: 'confetti 2s ease-out 0.2s infinite' }}>🎊</div>
                <div className="absolute top-0 right-1/4 text-3xl" style={{ animation: 'confetti 2s ease-out 0.7s infinite' }}>🎉</div>
                <div className="absolute top-0 left-1/3 text-2xl" style={{ animation: 'confetti 2s ease-out 1s infinite' }}>✨</div>
                <div className="absolute top-0 right-1/3 text-2xl" style={{ animation: 'confetti 2s ease-out 0.4s infinite' }}>🌟</div>
              </>
            )}
            
            <div className={`text-5xl font-bold mb-4 winner-bounce relative z-10 ${
              isVictory ? 'text-jade-light winner-glow' : 'text-crimson-light'
            }`}>
              {isVictory ? '🎉 대승리! 🎉' : '💀 패배...'}
            </div>
            <div className={`text-lg mb-4 relative z-10 ${isVictory ? 'text-gold' : 'text-silk/70'}`}>
              {isVictory
                ? `${targetRegion?.nameKo}을(를) 점령합니다!`
                : '아군이 퇴각합니다...'
              }
            </div>
            <div className="divider-gold my-4 relative z-10"></div>
            <div className="text-sm text-silk/60 space-y-2 relative z-10">
              <div className="flex justify-center gap-6">
                <div className="bg-jade/20 px-4 py-2 rounded-lg">
                  <span className="block text-xs text-silk/50">아군 피해</span>
                  <span className="text-jade-light font-bold text-lg">{(initialTroops.player - battle.player.troops).toLocaleString()}명</span>
                </div>
                <div className="bg-crimson/20 px-4 py-2 rounded-lg">
                  <span className="block text-xs text-silk/50">적군 피해</span>
                  <span className="text-crimson-light font-bold text-lg">{(initialTroops.enemy - battle.enemy.troops).toLocaleString()}명</span>
                </div>
              </div>
              
              {/* 장수 운명 표시 */}
              {generalDeaths.player && (
                <div className="text-crimson-light font-bold mt-3 animate-pulse">
                  💀 {battle.player.general.nameKo} 전사!
                </div>
              )}
              {generalDeaths.enemy && (
                <div className="text-jade-light font-bold mt-3 animate-pulse">
                  ⚔️ {battle.enemy.general.nameKo} 격파!
                </div>
              )}
              
              <div className="text-silk/30 mt-4 flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-gold rounded-full animate-pulse"></span>
                잠시 후 맵으로 돌아갑니다...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 도움말 */}
      {!isGameOver && battle.phase === 'selection' && (
        <div className="text-center text-xs text-silk/40 mt-4 space-y-1">
          <p>💡 사기가 0이 되면 패주합니다!</p>
          <p>👊 일기토로 적 사기를 크게 떨어뜨릴 수 있습니다</p>
        </div>
      )}
    </div>
  );
}
