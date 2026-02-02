import type { BattleUnit, DuelChoice, Stratagem, GeneralFate, General } from '../types';
import { GAME_CONFIG, TROOP_ADVANTAGE, STRATAGEMS, FATE_CONFIG, INITIAL_LOYALTY } from '../constants/gameData';

// 랜덤 범위 값
export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// 병종 상성 체크
export function hasAdvantage(attacker: BattleUnit, defender: BattleUnit): boolean {
  return TROOP_ADVANTAGE[attacker.troopType] === defender.troopType;
}

// 기본 피해 계산
// training: 훈련도 (0-100), 기본값 50
export function calculateDamage(attacker: BattleUnit, defender: BattleUnit, multiplier = 1, training = 50): number {
  const baseDamage = attacker.troops * GAME_CONFIG.BASE_DAMAGE_RATE;
  const mightBonus = 1 + attacker.general.might / 100;
  const advantageBonus = hasAdvantage(attacker, defender) ? GAME_CONFIG.TROOP_ADVANTAGE_BONUS : 1;
  // 훈련도 보너스: 50이면 1.0, 100이면 1.25 (최대 25% 추가 데미지)
  const trainingBonus = 1 + (training - 50) / 200;
  const randomFactor = random(GAME_CONFIG.RANDOM_MIN, GAME_CONFIG.RANDOM_MAX);

  return Math.round(baseDamage * mightBonus * advantageBonus * trainingBonus * randomFactor * multiplier);
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

// ============================================
// 장수 사망/포로 판정
// ============================================

// 일기토 사망 판정 (HP가 0이 된 경우)
export function checkDuelDeath(general: General, isPrisoner: boolean = false): GeneralFate {
  const deathChance = isPrisoner 
    ? FATE_CONFIG.DUEL_DEATH_CHANCE_PRISONER 
    : FATE_CONFIG.DUEL_DEATH_CHANCE;
  
  const roll = Math.random() * 100;
  
  if (roll < deathChance) {
    return {
      generalId: general.id,
      fate: 'dead',
      message: `💀 ${general.nameKo}이(가) 일기토에서 전사했습니다!`
    };
  }
  
  return {
    generalId: general.id,
    fate: 'alive',
    message: `${general.nameKo}이(가) 부상을 입고 퇴각했습니다.`
  };
}

// 전투 패배 시 장수 운명 결정
export function determineBattleFate(
  general: General, 
  isCommander: boolean,
  isLoser: boolean
): GeneralFate {
  if (!isLoser) {
    // 승자 측은 안전
    return { generalId: general.id, fate: 'alive' };
  }
  
  // 패배 측 운명 판정
  const roll = Math.random() * 100;
  
  // 주장은 사망 확률 있음
  if (isCommander && roll < FATE_CONFIG.COMMANDER_DEATH_CHANCE) {
    return {
      generalId: general.id,
      fate: 'dead',
      message: `💀 주장 ${general.nameKo}이(가) 전사했습니다!`
    };
  }
  
  // 포로 판정
  if (roll < FATE_CONFIG.BATTLE_CAPTURE_CHANCE) {
    return {
      generalId: general.id,
      fate: 'captured',
      message: `⛓️ ${general.nameKo}이(가) 포로로 잡혔습니다!`
    };
  }
  
  // 탈출 성공
  return {
    generalId: general.id,
    fate: 'escaped',
    message: `${general.nameKo}이(가) 퇴각에 성공했습니다.`
  };
}

// 등용 성공률 계산
export function calculateRecruitSuccess(
  recruiterCharisma: number,
  targetLoyalty: number,
  recruitDifficulty: number = 0
): number {
  // 기본 50% + (매력 - 충성도) / 2 - 등용 난이도
  const successRate = FATE_CONFIG.BASE_RECRUIT_SUCCESS 
    + (recruiterCharisma - targetLoyalty) / 2 
    - recruitDifficulty;
  
  // 최소 5%, 최대 95%
  return Math.min(95, Math.max(5, successRate));
}

// 포로 등용 시도
export function attemptRecruit(
  recruiterCharisma: number,
  targetLoyalty: number,
  recruitDifficulty: number = 0
): { success: boolean; newLoyalty: number } {
  const successRate = calculateRecruitSuccess(recruiterCharisma, targetLoyalty, recruitDifficulty);
  const roll = Math.random() * 100;
  
  if (roll < successRate) {
    // 등용 성공 - 초기 충성도는 40~60 사이
    const newLoyalty = 40 + Math.floor(Math.random() * 20);
    return { success: true, newLoyalty };
  }
  
  return { success: false, newLoyalty: targetLoyalty };
}

// 장수 초기 충성도 가져오기
export function getInitialLoyalty(generalId: string): number {
  return INITIAL_LOYALTY[generalId] ?? 60; // 기본값 60
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
