import type { General, Stratagem } from '../types';

// 핵심 장수 데이터
export const GENERALS: Record<string, General> = {
  guanyu: {
    id: 'guanyu',
    name: '關羽',
    nameKo: '관우',
    might: 97,
    intellect: 75,
    politics: 62,
    charisma: 93,
    portrait: '🗡️'
  },
  xiaohoudun: {
    id: 'xiaohoudun',
    name: '夏侯惇',
    nameKo: '하후돈',
    might: 83,
    intellect: 50,
    politics: 45,
    charisma: 72,
    portrait: '👁️'
  },
  zhangfei: {
    id: 'zhangfei',
    name: '張飛',
    nameKo: '장비',
    might: 98,
    intellect: 32,
    politics: 22,
    charisma: 68,
    portrait: '😤'
  },
  zhaoyun: {
    id: 'zhaoyun',
    name: '趙雲',
    nameKo: '조운',
    might: 96,
    intellect: 76,
    politics: 68,
    charisma: 85,
    portrait: '🐴'
  },
  zhugeliang: {
    id: 'zhugeliang',
    name: '諸葛亮',
    nameKo: '제갈량',
    might: 55,
    intellect: 100,
    politics: 95,
    charisma: 92,
    portrait: '🪭'
  },
  caocao: {
    id: 'caocao',
    name: '曹操',
    nameKo: '조조',
    might: 91,
    intellect: 95,
    politics: 96,
    charisma: 96,
    portrait: '👑'
  },
  simayi: {
    id: 'simayi',
    name: '司馬懿',
    nameKo: '사마의',
    might: 72,
    intellect: 98,
    politics: 92,
    charisma: 80,
    portrait: '🦊'
  },
  lvbu: {
    id: 'lvbu',
    name: '呂布',
    nameKo: '여포',
    might: 100,
    intellect: 25,
    politics: 15,
    charisma: 35,
    portrait: '🔱'
  },
  zhouyu: {
    id: 'zhouyu',
    name: '周瑜',
    nameKo: '주유',
    might: 72,
    intellect: 96,
    politics: 86,
    charisma: 93,
    portrait: '🔥'
  },
  zhangLiao: {
    id: 'zhangliao',
    name: '張遼',
    nameKo: '장료',
    might: 89,
    intellect: 68,
    politics: 51,
    charisma: 78,
    portrait: '⚔️'
  }
};

// 계략 목록
export const STRATAGEMS: Record<string, Stratagem> = {
  fireAttack: {
    id: 'fireAttack',
    name: '火攻',
    nameKo: '화공',
    requiredIntellect: 70,
    effect: '적 병력 30% 피해',
    damagePercent: 30,
    moraleImpact: -15,
    cooldown: 3
  },
  ambush: {
    id: 'ambush',
    name: '伏兵',
    nameKo: '매복',
    requiredIntellect: 60,
    effect: '다음 공격 2배 피해',
    moraleImpact: -10,
    cooldown: 2
  },
  discord: {
    id: 'discord',
    name: '離間',
    nameKo: '이간',
    requiredIntellect: 80,
    effect: '적 1턴 행동 불가',
    moraleImpact: -20,
    cooldown: 4
  },
  lure: {
    id: 'lure',
    name: '誘引',
    nameKo: '유인',
    requiredIntellect: 50,
    effect: '적 돌격 유도, 반격 2배',
    moraleImpact: -5,
    cooldown: 2
  },
  confusion: {
    id: 'confusion',
    name: '混亂',
    nameKo: '혼란',
    requiredIntellect: 75,
    effect: '적 사기 -30',
    moraleImpact: -30,
    cooldown: 3
  },
  rally: {
    id: 'rally',
    name: '激勵',
    nameKo: '격려',
    requiredIntellect: 40,
    effect: '아군 사기 +20',
    moraleImpact: 20,
    cooldown: 1
  },
  smoke: {
    id: 'smoke',
    name: '煙幕',
    nameKo: '연막',
    requiredIntellect: 55,
    effect: '이번 턴 피해 무효화',
    moraleImpact: 0,
    cooldown: 3
  },
  surprise: {
    id: 'surprise',
    name: '奇襲',
    nameKo: '기습',
    requiredIntellect: 65,
    effect: '선제 공격 (반격 없음)',
    moraleImpact: -10,
    cooldown: 2
  }
};

// 병종 상성
export const TROOP_ADVANTAGE: Record<string, string> = {
  infantry: 'archer',   // 보병 > 궁병
  cavalry: 'infantry',  // 기병 > 보병
  archer: 'cavalry'     // 궁병 > 기병
};

// 게임 설정
export const GAME_CONFIG = {
  INITIAL_MORALE: 100,
  MAX_MORALE: 100,
  FLEE_MORALE: 0,
  TROOP_ADVANTAGE_BONUS: 1.2,
  BASE_DAMAGE_RATE: 0.1,
  DUEL_BASE_DAMAGE: 20,
  CHARGE_DAMAGE_MULTIPLIER: 1.5,
  DEFEND_DAMAGE_REDUCTION: 0.5,
  RANDOM_MIN: 0.8,
  RANDOM_MAX: 1.2
};

// 사기 변화
export const MORALE_CHANGES = {
  ROUND_WIN: 10,
  ROUND_LOSE: -15,
  DUEL_WIN: 20,
  DUEL_LOSE: -40,
  STRATAGEM_SUCCESS: 10,
  GENERAL_DEATH: -50,
  ENEMY_GENERAL_DEATH: 30
};
