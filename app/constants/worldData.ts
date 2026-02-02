import type { Region, RegionId, Faction, FactionId, DomesticCommand } from '../types';

// 세력 상세 정보 (타이틀/세력 선택용)
export interface FactionDetail {
  id: FactionId;
  displayName: string;       // 표시용 이름 (예: "촉 (蜀)")
  rulerName: string;         // 군주 이름
  rulerId: string;           // 군주 장수 ID
  capital: string;           // 본거지 이름
  difficulty: number;        // 난이도 (1~5)
  emoji: string;             // 세력 이모지
  color: string;             // 세력 색상
  slogan: string;            // 슬로건/한 줄 설명
  features: string[];        // 특징 (배열)
  keyGenerals: string[];     // 주요 장수 ID
}

export const FACTION_DETAILS: Record<FactionId, FactionDetail> = {
  liubei: {
    id: 'liubei',
    displayName: '촉 (蜀)',
    rulerName: '유비',
    rulerId: 'liubei',
    capital: '성도',
    difficulty: 3,
    emoji: '🐉',
    color: '#22c55e',
    slogan: '인덕으로 천하를 품으라',
    features: [
      '오호대장군 보유 (관우, 장비, 조운, 마초, 황충)',
      '제갈량의 뛰어난 지략',
      '초기 영토는 좁지만 인재 풍부',
      '의형제의 높은 충성도'
    ],
    keyGenerals: ['guanyu', 'zhangfei', 'zhaoyun', 'zhugeliang']
  },
  // player는 실제 플레이어가 선택한 세력을 나타내므로 FACTION_DETAILS에서 제외
  player: {
    id: 'player',
    displayName: '플레이어',
    rulerName: '',
    rulerId: '',
    capital: '',
    difficulty: 0,
    emoji: '👤',
    color: '#ffffff',
    slogan: '',
    features: [],
    keyGenerals: []
  },
  caocao: {
    id: 'caocao',
    displayName: '위 (魏)',
    rulerName: '조조',
    rulerId: 'caocao',
    capital: '허창',
    difficulty: 2,
    emoji: '🦅',
    color: '#3b82f6',
    slogan: '천하를 호령할 패업의 시작',
    features: [
      '최대 세력 - 넓은 영토와 풍부한 자원',
      '다양한 인재 보유 (문관, 무장 균형)',
      '초보자 추천 세력',
      '사마의, 순욱 등 명참모'
    ],
    keyGenerals: ['xiaohoudun', 'zhangliao', 'simayi', 'xunyu']
  },
  sunquan: {
    id: 'sunquan',
    displayName: '오 (吳)',
    rulerName: '손권',
    rulerId: 'sunquan',
    capital: '건업',
    difficulty: 3,
    emoji: '🐯',
    color: '#ef4444',
    slogan: '강동의 호랑이, 바다를 제패하라',
    features: [
      '수군 최강 - 수상전 보너스',
      '방어에 유리한 지형',
      '주유, 육손 등 뛰어난 지략가',
      '상업 발달로 부유함'
    ],
    keyGenerals: ['zhouyu', 'luxun', 'ganning', 'taishici']
  },
  yuanshao: {
    id: 'yuanshao',
    displayName: '원소',
    rulerName: '원소',
    rulerId: 'yuanshao',
    capital: '업',
    difficulty: 2,
    emoji: '🦁',
    color: '#a855f7',
    slogan: '사세삼공의 명문가 위엄',
    features: [
      '초기 병력 최다 보유',
      '명문가 출신으로 외교 유리',
      '넓은 북방 영토',
      '인재는 많으나 조조와 경쟁 필수'
    ],
    keyGenerals: ['yuanshao']
  },
  dongzhuo: {
    id: 'dongzhuo',
    displayName: '동탁',
    rulerName: '동탁',
    rulerId: 'dongzhuo',
    capital: '장안',
    difficulty: 4,
    emoji: '👹',
    color: '#6b7280',
    slogan: '천하를 혼란에 빠뜨린 폭군',
    features: [
      '여포 보유 - 최강 무력',
      '초기 외교 극히 불리 (반동탁 연합)',
      '폭정으로 민심 낮음',
      '고난이도 플레이어용'
    ],
    keyGenerals: ['lvbu']
  },
  liubiao: {
    id: 'liubiao',
    displayName: '유표',
    rulerName: '유표',
    rulerId: 'liubiao',
    capital: '형주',
    difficulty: 3,
    emoji: '🎋',
    color: '#f97316',
    slogan: '형주를 지키며 때를 기다려라',
    features: [
      '중앙에 위치 - 교통의 요지',
      '사방이 적 - 외교 중요',
      '비옥한 형주 - 식량 풍부',
      '유비에게 넘어갈 운명?'
    ],
    keyGenerals: ['liubiao']
  },
  liuzhang: {
    id: 'liuzhang',
    displayName: '유장',
    rulerName: '유장',
    rulerId: 'liuzhang',
    capital: '익주',
    difficulty: 4,
    emoji: '🏔️',
    color: '#84cc16',
    slogan: '험준한 촉 땅을 지켜라',
    features: [
      '험난한 지형 - 방어 유리',
      '인재 부족이 치명적',
      '고립된 위치 - 확장 어려움',
      '천연 요새 촉 땅'
    ],
    keyGenerals: ['liuzhang']
  },
  gongsunzan: {
    id: 'gongsunzan',
    displayName: '공손찬',
    rulerName: '공손찬',
    rulerId: 'gongsunzan',
    capital: '유주',
    difficulty: 4,
    emoji: '🐎',
    color: '#06b6d4',
    slogan: '백마장군의 북방 질주',
    features: [
      '기병 특화 - 백마의주',
      '조운 영입 가능 (재야)',
      '변방에 고립된 위치',
      '원소와의 경쟁 필수'
    ],
    keyGenerals: ['gongsunzan']
  },
  rebels: {
    id: 'rebels',
    displayName: '황건적',
    rulerName: '장각',
    rulerId: 'zhangjiao',
    capital: '낙양',
    difficulty: 5,
    emoji: '🌾',
    color: '#eab308',
    slogan: '창천이사 황천당립!',
    features: [
      '최고 난이도 - 사방이 적',
      '모든 세력이 적대적',
      '황건 병사 특수 능력',
      '오직 강자만을 위한 도전'
    ],
    keyGenerals: ['zhangjiao']
  }
};

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
    training: 50,
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
    training: 70,
    generals: ['caocao', 'xiaohoudun', 'zhangliao']
  },
  chengdu: {
    id: 'chengdu',
    name: '成都',
    nameKo: '성도',
    description: '유비의 본거지',
    adjacent: ['yizhou'],
    owner: 'liubei',
    gold: 6000,
    food: 15000,
    population: 45000,
    troops: 10000,
    commerce: 50,
    agriculture: 80,
    defense: 100,
    training: 60,
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
    training: 65,
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
    training: 55,
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
    training: 60,
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
    training: 45,
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
    training: 40,
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
    training: 50,
    generals: []
  }
};

// 세력 데이터
export const FACTIONS: Record<FactionId, Faction> = {
  player: {
    id: 'player',
    name: 'Player',
    nameKo: '플레이어',
    color: '#22c55e',  // 선택한 세력 색상으로 변경됨
    ruler: ''
  },
  liubei: {
    id: 'liubei',
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
    description: '병력 전투력 강화 (훈련도 +5%)',
    cost: { gold: 800, food: 500 },
    statRequired: 'might'
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
