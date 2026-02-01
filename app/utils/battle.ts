import type { BattleUnit, DuelChoice, Stratagem } from '../types';
import { GAME_CONFIG, TROOP_ADVANTAGE, STRATAGEMS } from '../constants/gameData';

// 랜덤 범위 값
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 병종 상성 체크
export function hasAdvantage(attacker: BattleUnit, defender: BattleUnit): boolean {
  return TROOP_ADVANTAGE[attacker.troopType] === defender.troopType;
}

// 기본 피해 계산
export function calculateDamage(attacker: BattleUnit, defender: BattleUnit, multiplier = 1): number {
  const baseDamage = attacker.troops * GAME_CONFIG.BASE_DAMAGE_RATE;
  const mightBonus = 1 + attacker.general.might / 100;
  const advantageBonus = hasAdvantage(attacker, defender) ? GAME_CONFIG.TROOP_ADVANTAGE_BONUS : 1;
  const randomFactor = random(GAME_CONFIG.RANDOM_MIN, GAME_CONFIG.RANDOM_MAX);
  
  return Math.round(baseDamage * mightBonus * advantageBonus * randomFactor * multiplier);
}

// 계략 성공률 계산
export function calculateStratagemSuccess(caster: BattleUnit, target: BattleUnit): number {
  const baseRate = 50;
  const intellectDiff = caster.general.intellect - target.general.intellect;
  return Math.min(100, Math.max(10, baseRate + intellectDiff));
}

// 계략 사용 가능 체크
export function canUseStratagem(unit: BattleUnit, stratagems: Stratagem): boolean {
  if (unit.general.intellect < stratagems.requiredIntellect) return false;
  if (unit.usedStratagems.includes(stratagems.id)) return false;
  return true;
}

// 사용 가능한 계략 목록
export function getAvailableStratagems(unit: BattleUnit): Stratagem[] {
  return Object.values(STRATAGEMS).filter(s => canUseStratagem(unit, s));
}

// 일기토 결과 계산
export function resolveDuel(
  playerChoice: DuelChoice,
  enemyChoice: DuelChoice,
  playerUnit: BattleUnit,
  enemyUnit: BattleUnit
): { winner: 'player' | 'enemy' | 'draw'; damage: number } {
  // 가위바위보 상성
  const matrix: Record<DuelChoice, DuelChoice> = {
    power: 'special',    // 강공은 필살기에 이김
    counter: 'power',    // 견제는 강공에 이김
    special: 'counter'   // 필살기는 견제에 이김
  };

  let winner: 'player' | 'enemy' | 'draw';
  
  if (playerChoice === enemyChoice) {
    // 같은 선택 - 무력 비교
    if (playerUnit.general.might > enemyUnit.general.might) {
      winner = 'player';
    } else if (playerUnit.general.might < enemyUnit.general.might) {
      winner = 'enemy';
    } else {
      winner = 'draw';
    }
  } else if (matrix[playerChoice] === enemyChoice) {
    winner = 'player';
  } else {
    winner = 'enemy';
  }

  // 피해 계산
  const mightDiff = Math.abs(playerUnit.general.might - enemyUnit.general.might);
  const damage = GAME_CONFIG.DUEL_BASE_DAMAGE + Math.floor(mightDiff / 2);

  return { winner, damage };
}

// 사기 변화 적용
export function applyMoraleChange(unit: BattleUnit, change: number): number {
  const newMorale = Math.max(0, Math.min(GAME_CONFIG.MAX_MORALE, unit.morale + change));
  return newMorale;
}

// 병력 피해 적용
export function applyTroopDamage(unit: BattleUnit, damage: number): number {
  return Math.max(0, unit.troops - damage);
}

// 패주 체크
export function checkRout(unit: BattleUnit): boolean {
  return unit.morale <= GAME_CONFIG.FLEE_MORALE;
}

// AI 행동 선택 (간단한 로직)
export function selectEnemyAction(enemy: BattleUnit, player: BattleUnit): {
  action: 'charge' | 'defend' | 'stratagem';
  stratagem?: string;
} {
  const roll = Math.random();
  
  // 사기가 낮으면 수비 확률 증가
  if (enemy.morale < 40 && roll < 0.4) {
    return { action: 'defend' };
  }
  
  // 지력이 높으면 계략 시도
  const availableStratagems = getAvailableStratagems(enemy);
  if (availableStratagems.length > 0 && enemy.general.intellect > 60 && roll < 0.3) {
    const stratagem = availableStratagems[Math.floor(Math.random() * availableStratagems.length)];
    return { action: 'stratagem', stratagem: stratagem.id };
  }
  
  // 기본적으로 돌격
  return { action: 'charge' };
}

// AI 일기토 선택
export function selectEnemyDuelChoice(): DuelChoice {
  const choices: DuelChoice[] = ['power', 'counter', 'special'];
  return choices[Math.floor(Math.random() * choices.length)];
}

// 계략 효과 적용
export function applyStratagem(
  stratagemeId: string,
  caster: BattleUnit,
  target: BattleUnit
): { caster: BattleUnit; target: BattleUnit; message: string } {
  const stratagem = STRATAGEMS[stratagemeId];
  const success = Math.random() * 100 < calculateStratagemSuccess(caster, target);
  
  let message = '';
  let updatedCaster = { ...caster, usedStratagems: [...caster.usedStratagems, stratagemeId] };
  let updatedTarget = { ...target };
  
  if (!success) {
    message = `${caster.general.nameKo}의 ${stratagem.nameKo} 실패!`;
    return { caster: updatedCaster, target: updatedTarget, message };
  }
  
  switch (stratagemeId) {
    case 'fireAttack':
      const fireDamage = Math.round(target.troops * 0.3);
      updatedTarget.troops = applyTroopDamage(target, fireDamage);
      updatedTarget.morale = applyMoraleChange(target, stratagem.moraleImpact);
      message = `🔥 ${caster.general.nameKo}의 화공! 적 ${fireDamage}명 피해!`;
      break;
    case 'confusion':
      updatedTarget.morale = applyMoraleChange(target, stratagem.moraleImpact);
      message = `🌀 ${caster.general.nameKo}의 혼란! 적 사기 -30!`;
      break;
    case 'rally':
      updatedCaster.morale = applyMoraleChange(caster, Math.abs(stratagem.moraleImpact));
      message = `📢 ${caster.general.nameKo}의 격려! 아군 사기 +20!`;
      break;
    default:
      updatedTarget.morale = applyMoraleChange(target, stratagem.moraleImpact);
      message = `✨ ${caster.general.nameKo}의 ${stratagem.nameKo} 성공!`;
  }
  
  return { caster: updatedCaster, target: updatedTarget, message };
}
