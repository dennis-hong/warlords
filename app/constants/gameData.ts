import type { General, Stratagem } from '../types';

// ============================================
// 장수 데이터 (50명)
// ============================================

export const GENERALS: Record<string, General> = {
  // ===== 위 (Wei) =====
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
  xiahouyuan: {
    id: 'xiahouyuan',
    name: '夏侯淵',
    nameKo: '하후연',
    might: 82,
    intellect: 52,
    politics: 40,
    charisma: 60,
    portrait: '🏹'
  },
  zhangliao: {
    id: 'zhangliao',
    name: '張遼',
    nameKo: '장료',
    might: 89,
    intellect: 68,
    politics: 51,
    charisma: 78,
    portrait: '⚔️'
  },
  xuhuang: {
    id: 'xuhuang',
    name: '徐晃',
    nameKo: '서황',
    might: 86,
    intellect: 55,
    politics: 42,
    charisma: 65,
    portrait: '🪓'
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
  xunyu: {
    id: 'xunyu',
    name: '荀彧',
    nameKo: '순욱',
    might: 55,
    intellect: 96,
    politics: 98,
    charisma: 92,
    portrait: '📜'
  },
  guojia: {
    id: 'guojia',
    name: '郭嘉',
    nameKo: '곽가',
    might: 42,
    intellect: 97,
    politics: 89,
    charisma: 85,
    portrait: '🧠'
  },

  // ===== 촉 (Shu) =====
  liubei: {
    id: 'liubei',
    name: '劉備',
    nameKo: '유비',
    might: 72,
    intellect: 65,
    politics: 78,
    charisma: 99,
    portrait: '🐉'
  },
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
  machao: {
    id: 'machao',
    name: '馬超',
    nameKo: '마초',
    might: 94,
    intellect: 52,
    politics: 35,
    charisma: 78,
    portrait: '🐎'
  },
  huangzhong: {
    id: 'huangzhong',
    name: '黃忠',
    nameKo: '황충',
    might: 92,
    intellect: 58,
    politics: 48,
    charisma: 72,
    portrait: '🎯'
  },
  pangtong: {
    id: 'pangtong',
    name: '龐統',
    nameKo: '방통',
    might: 45,
    intellect: 98,
    politics: 88,
    charisma: 76,
    portrait: '🦅'
  },

  // ===== 오 (Wu) =====
  sunquan: {
    id: 'sunquan',
    name: '孫權',
    nameKo: '손권',
    might: 70,
    intellect: 78,
    politics: 88,
    charisma: 95,
    portrait: '🐯'
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
  luxun: {
    id: 'luxun',
    name: '陸遜',
    nameKo: '육손',
    might: 68,
    intellect: 95,
    politics: 90,
    charisma: 85,
    portrait: '📚'
  },
  ganning: {
    id: 'ganning',
    name: '甘寧',
    nameKo: '감녕',
    might: 90,
    intellect: 55,
    politics: 40,
    charisma: 72,
    portrait: '🏴‍☠️'
  },
  taishici: {
    id: 'taishici',
    name: '太史慈',
    nameKo: '태사자',
    might: 91,
    intellect: 48,
    politics: 35,
    charisma: 80,
    portrait: '🏹'
  },
  lvmeng: {
    id: 'lvmeng',
    name: '呂蒙',
    nameKo: '여몽',
    might: 82,
    intellect: 88,
    politics: 72,
    charisma: 75,
    portrait: '📖'
  },
  huanggai: {
    id: 'huanggai',
    name: '黃蓋',
    nameKo: '황개',
    might: 78,
    intellect: 68,
    politics: 55,
    charisma: 70,
    portrait: '🔥'
  },
  zhoutai: {
    id: 'zhoutai',
    name: '周泰',
    nameKo: '주태',
    might: 85,
    intellect: 42,
    politics: 30,
    charisma: 65,
    portrait: '🛡️'
  },

  // ===== 원소군 =====
  yuanshao: {
    id: 'yuanshao',
    name: '袁紹',
    nameKo: '원소',
    might: 65,
    intellect: 55,
    politics: 68,
    charisma: 88,
    portrait: '🏛️'
  },
  yanliang: {
    id: 'yanliang',
    name: '顏良',
    nameKo: '안량',
    might: 90,
    intellect: 35,
    politics: 25,
    charisma: 55,
    portrait: '⚔️'
  },
  wenchou: {
    id: 'wenchou',
    name: '文醜',
    nameKo: '문추',
    might: 88,
    intellect: 32,
    politics: 22,
    charisma: 52,
    portrait: '⚔️'
  },
  zhanghe: {
    id: 'zhanghe',
    name: '張郃',
    nameKo: '장합',
    might: 85,
    intellect: 72,
    politics: 55,
    charisma: 68,
    portrait: '🛡️'
  },
  gaolan: {
    id: 'gaolan',
    name: '高覽',
    nameKo: '고람',
    might: 78,
    intellect: 45,
    politics: 35,
    charisma: 50,
    portrait: '⚔️'
  },
  tianfeng: {
    id: 'tianfeng',
    name: '田豐',
    nameKo: '전풍',
    might: 35,
    intellect: 90,
    politics: 88,
    charisma: 72,
    portrait: '📚'
  },

  // ===== 동탁군 =====
  dongzhuo: {
    id: 'dongzhuo',
    name: '董卓',
    nameKo: '동탁',
    might: 88,
    intellect: 42,
    politics: 35,
    charisma: 25,
    portrait: '👹'
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
  liru: {
    id: 'liru',
    name: '李儒',
    nameKo: '이유',
    might: 32,
    intellect: 92,
    politics: 78,
    charisma: 45,
    portrait: '🐍'
  },
  huaxiong: {
    id: 'huaxiong',
    name: '華雄',
    nameKo: '화웅',
    might: 88,
    intellect: 35,
    politics: 25,
    charisma: 50,
    portrait: '💀'
  },
  zhangji: {
    id: 'zhangji',
    name: '張濟',
    nameKo: '장제',
    might: 72,
    intellect: 42,
    politics: 38,
    charisma: 45,
    portrait: '⚔️'
  },

  // ===== 유표군 =====
  liubiao: {
    id: 'liubiao',
    name: '劉表',
    nameKo: '유표',
    might: 52,
    intellect: 72,
    politics: 85,
    charisma: 78,
    portrait: '🎭'
  },
  huangzu: {
    id: 'huangzu',
    name: '黃祖',
    nameKo: '황조',
    might: 68,
    intellect: 45,
    politics: 52,
    charisma: 48,
    portrait: '⚔️'
  },
  caimao: {
    id: 'caimao',
    name: '蔡瑁',
    nameKo: '채모',
    might: 55,
    intellect: 62,
    politics: 68,
    charisma: 45,
    portrait: '⛵'
  },
  wenpin: {
    id: 'wenpin',
    name: '文聘',
    nameKo: '문빙',
    might: 78,
    intellect: 58,
    politics: 52,
    charisma: 65,
    portrait: '⚔️'
  },

  // ===== 유장군 =====
  liuzhang: {
    id: 'liuzhang',
    name: '劉璋',
    nameKo: '유장',
    might: 48,
    intellect: 55,
    politics: 62,
    charisma: 60,
    portrait: '🏔️'
  },
  yanyan: {
    id: 'yanyan',
    name: '嚴顏',
    nameKo: '엄안',
    might: 82,
    intellect: 55,
    politics: 48,
    charisma: 70,
    portrait: '⚔️'
  },
  zhangRen: {
    id: 'zhangren',
    name: '張任',
    nameKo: '장임',
    might: 78,
    intellect: 62,
    politics: 45,
    charisma: 55,
    portrait: '⚔️'
  },
  huangquan: {
    id: 'huangquan',
    name: '黃權',
    nameKo: '황권',
    might: 58,
    intellect: 78,
    politics: 75,
    charisma: 68,
    portrait: '📜'
  },

  // ===== 공손찬군 =====
  gongsunzan: {
    id: 'gongsunzan',
    name: '公孫瓚',
    nameKo: '공손찬',
    might: 80,
    intellect: 45,
    politics: 52,
    charisma: 68,
    portrait: '🐴'
  },
  zhaoyunYoung: {
    id: 'zhaoyunYoung',
    name: '趙雲',
    nameKo: '조운(젊음)',
    might: 88,
    intellect: 65,
    politics: 55,
    charisma: 78,
    portrait: '🐴'
  },
  tianyujing: {
    id: 'tianyujing',
    name: '田豫',
    nameKo: '전예',
    might: 72,
    intellect: 75,
    politics: 68,
    charisma: 62,
    portrait: '⚔️'
  },

  // ===== 황건적 =====
  zhangjiao: {
    id: 'zhangjiao',
    name: '張角',
    nameKo: '장각',
    might: 42,
    intellect: 88,
    politics: 72,
    charisma: 95,
    portrait: '☯️'
  },
  zhangbao: {
    id: 'zhangbao',
    name: '張寶',
    nameKo: '장보',
    might: 62,
    intellect: 72,
    politics: 48,
    charisma: 68,
    portrait: '☯️'
  },
  zhangliang: {
    id: 'zhangliang',
    name: '張梁',
    nameKo: '장량',
    might: 68,
    intellect: 65,
    politics: 45,
    charisma: 62,
    portrait: '☯️'
  },
  bocai: {
    id: 'bocai',
    name: '波才',
    nameKo: '파재',
    might: 72,
    intellect: 42,
    politics: 28,
    charisma: 55,
    portrait: '⚔️'
  },
  zhangmancheng: {
    id: 'zhangmancheng',
    name: '張曼成',
    nameKo: '장만성',
    might: 75,
    intellect: 38,
    politics: 25,
    charisma: 58,
    portrait: '⚔️'
  }
};

// ============================================
// 계략 목록
// ============================================

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

// ============================================
// 게임 설정
// ============================================

export const TROOP_ADVANTAGE: Record<string, string> = {
  infantry: 'archer',
  cavalry: 'infantry',
  archer: 'cavalry'
};

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
  RANDOM_MAX: 1.2,
  START_YEAR: 190,
  START_MONTH: 1
};

export const MORALE_CHANGES = {
  ROUND_WIN: 10,
  ROUND_LOSE: -15,
  DUEL_WIN: 20,
  DUEL_LOSE: -40,
  STRATAGEM_SUCCESS: 10,
  GENERAL_DEATH: -50,
  ENEMY_GENERAL_DEATH: 30
};
