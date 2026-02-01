import type { Region, RegionId, Faction, FactionId, DomesticCommand } from '../types';

// 9개 지역 데이터
export const REGIONS: Record<RegionId, Region> = {
  luoyang: {
    id: 'luoyang',
    name: '洛陽',
    nameKo: '낙양',
    description: '중앙의 황제 소재지',
    adjacent: ['changan', 'xuchang', 'jingzhou', 'ye'],
    owner: 'rebels',
    gold: 5000,
    food: 8000,
    population: 50000,
    troops: 8000,
    commerce: 60,
    agriculture: 50,
    defense: 100,
    generals: []
  },
  xuchang: {
    id: 'xuchang',
    name: '許昌',
    nameKo: '허창',
    description: '조조의 본거지',
    adjacent: ['luoyang', 'jingzhou', 'jianye', 'ye'],
    owner: 'caocao',
    gold: 8000,
    food: 12000,
    population: 60000,
    troops: 15000,
    commerce: 70,
    agriculture: 65,
    defense: 100,
    generals: ['caocao', 'xiaohoudun', 'zhangliao']
  },
  chengdu: {
    id: 'chengdu',
    name: '成都',
    nameKo: '성도',
    description: '유비의 본거지',
    adjacent: ['yizhou'],
    owner: 'player',
    gold: 6000,
    food: 15000,
    population: 45000,
    troops: 10000,
    commerce: 50,
    agriculture: 80,
    defense: 100,
    generals: ['guanyu', 'zhangfei', 'zhaoyun', 'zhugeliang']
  },
  jianye: {
    id: 'jianye',
    name: '建業',
    nameKo: '건업',
    description: '손권의 본거지',
    adjacent: ['jingzhou', 'xuchang'],
    owner: 'sunquan',
    gold: 10000,
    food: 10000,
    population: 55000,
    troops: 12000,
    commerce: 80,
    agriculture: 60,
    defense: 100,
    generals: ['zhouyu']
  },
  changan: {
    id: 'changan',
    name: '長安',
    nameKo: '장안',
    description: '서북 관문',
    adjacent: ['luoyang', 'jingzhou'],
    owner: 'dongzhuo',
    gold: 4000,
    food: 6000,
    population: 35000,
    troops: 10000,
    commerce: 45,
    agriculture: 40,
    defense: 100,
    generals: ['lvbu']
  },
  ye: {
    id: 'ye',
    name: '鄴',
    nameKo: '업',
    description: '북방 요충지',
    adjacent: ['luoyang', 'xuchang', 'youzhou'],
    owner: 'yuanshao',
    gold: 7000,
    food: 9000,
    population: 50000,
    troops: 18000,
    commerce: 55,
    agriculture: 55,
    defense: 100,
    generals: []
  },
  jingzhou: {
    id: 'jingzhou',
    name: '荊州',
    nameKo: '형주',
    description: '중부 요충지',
    adjacent: ['luoyang', 'xuchang', 'jianye', 'yizhou', 'changan'],
    owner: 'liubiao',
    gold: 5000,
    food: 11000,
    population: 40000,
    troops: 8000,
    commerce: 50,
    agriculture: 70,
    defense: 100,
    generals: []
  },
  yizhou: {
    id: 'yizhou',
    name: '益州',
    nameKo: '익주',
    description: '서남 내륙',
    adjacent: ['jingzhou', 'chengdu'],
    owner: 'liuzhang',
    gold: 4000,
    food: 8000,
    population: 30000,
    troops: 6000,
    commerce: 40,
    agriculture: 60,
    defense: 100,
    generals: []
  },
  youzhou: {
    id: 'youzhou',
    name: '幽州',
    nameKo: '유주',
    description: '북방 변경',
    adjacent: ['ye'],
    owner: 'gongsunzan',
    gold: 3000,
    food: 5000,
    population: 25000,
    troops: 7000,
    commerce: 35,
    agriculture: 45,
    defense: 100,
    generals: []
  }
};

// 세력 데이터
export const FACTIONS: Record<FactionId, Faction> = {
  player: {
    id: 'player',
    name: '劉備',
    nameKo: '유비',
    color: '#22c55e',  // green
    ruler: 'liubei'
  },
  caocao: {
    id: 'caocao',
    name: '曹操',
    nameKo: '조조',
    color: '#3b82f6',  // blue
    ruler: 'caocao'
  },
  sunquan: {
    id: 'sunquan',
    name: '孫權',
    nameKo: '손권',
    color: '#ef4444',  // red
    ruler: 'sunquan'
  },
  dongzhuo: {
    id: 'dongzhuo',
    name: '董卓',
    nameKo: '동탁',
    color: '#6b7280',  // gray
    ruler: 'dongzhuo'
  },
  yuanshao: {
    id: 'yuanshao',
    name: '袁紹',
    nameKo: '원소',
    color: '#a855f7',  // purple
    ruler: 'yuanshao'
  },
  liubiao: {
    id: 'liubiao',
    name: '劉表',
    nameKo: '유표',
    color: '#f97316',  // orange
    ruler: 'liubiao'
  },
  liuzhang: {
    id: 'liuzhang',
    name: '劉璋',
    nameKo: '유장',
    color: '#84cc16',  // lime
    ruler: 'liuzhang'
  },
  gongsunzan: {
    id: 'gongsunzan',
    name: '公孫瓚',
    nameKo: '공손찬',
    color: '#06b6d4',  // cyan
    ruler: 'gongsunzan'
  },
  rebels: {
    id: 'rebels',
    name: '黃巾賊',
    nameKo: '황건적',
    color: '#eab308',  // yellow
    ruler: 'rebel_leader'
  }
};

// 내정 명령 목록
export const DOMESTIC_COMMANDS: DomesticCommand[] = [
  {
    id: 'develop_farm',
    name: '開墾',
    nameKo: '개간',
    icon: '🌾',
    description: '농업 개발 (+5%), 식량 수입 증가',
    cost: { gold: 500 },
    statRequired: 'politics'
  },
  {
    id: 'develop_commerce',
    name: '商業',
    nameKo: '상업',
    icon: '💰',
    description: '상업 개발 (+5%), 금 수입 증가',
    cost: { gold: 500 },
    statRequired: 'politics'
  },
  {
    id: 'recruit',
    name: '徵兵',
    nameKo: '징병',
    icon: '🎖️',
    description: '인구를 병력으로 전환',
    cost: { gold: 1000, population: 1000 },
    statRequired: 'charisma'
  },
  {
    id: 'train',
    name: '訓練',
    nameKo: '훈련',
    icon: '⚔️',
    description: '병력 전투력 강화',
    cost: { gold: 800, food: 500 },
    statRequired: 'might'
  },
  {
    id: 'rest',
    name: '休息',
    nameKo: '휴식',
    icon: '😴',
    description: '행동 종료',
    cost: {},
    statRequired: 'politics'
  }
];

// 지역 좌표 (맵 표시용, 상대 좌표 0~100)
export const REGION_POSITIONS: Record<RegionId, { x: number; y: number }> = {
  youzhou:  { x: 70, y: 10 },
  ye:       { x: 65, y: 30 },
  changan:  { x: 25, y: 45 },
  luoyang:  { x: 50, y: 45 },
  xuchang:  { x: 70, y: 50 },
  jingzhou: { x: 50, y: 65 },
  jianye:   { x: 80, y: 70 },
  yizhou:   { x: 30, y: 75 },
  chengdu:  { x: 20, y: 85 }
};

// 계절별 이름
export const SEASONS = {
  spring: { name: '春', nameKo: '봄', icon: '🌸' },
  summer: { name: '夏', nameKo: '여름', icon: '☀️' },
  fall: { name: '秋', nameKo: '가을', icon: '🍂' },
  winter: { name: '冬', nameKo: '겨울', icon: '❄️' }
};
