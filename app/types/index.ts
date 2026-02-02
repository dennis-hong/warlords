// ============================================
// 장수 시스템
// ============================================

export interface General {
  id: string;
  name: string;
  nameKo: string;
  might: number;      // 무력
  intellect: number;  // 지력
  politics: number;   // 정치
  charisma: number;   // 매력
  loyalty?: number;   // 충성도 (0~100) - optional, INITIAL_LOYALTY에서 관리
  portrait?: string;  // 이모지 or 이미지
}

// 포로 정보
export interface Prisoner {
  generalId: string;
  capturedTurn: number;
  capturedBy: FactionId;
  location: RegionId;
}

// 재야 장수 정보
export interface FreeGeneral {
  generalId: string;
  location: RegionId;
  recruitDifficulty: number; // 등용 난이도 보정 (0~50)
}

// ============================================
// 전투 시스템
// ============================================

export type TroopType = 'infantry' | 'cavalry' | 'archer';

export interface Stratagem {
  id: string;
  name: string;
  nameKo: string;
  requiredIntellect: number;
  effect: string;
  moraleImpact: number;
  damagePercent?: number;
  cooldown: number;
}

export interface BattleUnit {
  general: General;
  troops: number;
  maxTroops: number;
  morale: number;
  troopType: TroopType;
  usedStratagems: string[];
}

export type DuelChoice = 'power' | 'counter' | 'special';
export type BattleAction = 'charge' | 'defend' | 'stratagem' | 'duel';

export interface BattleLog {
  round: number;
  message: string;
  type: 'info' | 'damage' | 'morale' | 'stratagem' | 'duel' | 'victory' | 'defeat';
}

export interface BattleState {
  round: number;
  maxRounds: number;
  player: BattleUnit;
  enemy: BattleUnit;
  logs: BattleLog[];
  phase: 'selection' | 'duel' | 'result' | 'victory' | 'defeat';
  selectedStratagem?: string;
  duelInProgress?: {
    playerChoice?: DuelChoice;
    enemyChoice?: DuelChoice;
  };
}

export interface BattleResult {
  winner: 'player' | 'enemy';
  playerTroopsLost: number;
  enemyTroopsLost: number;
  rounds: number;
}

// 일기토 HP 상태
export interface DuelHealth {
  player: number;
  enemy: number;
}

// 장수 사망/포로 결과
export interface GeneralFate {
  generalId: string;
  fate: 'alive' | 'dead' | 'captured' | 'escaped';
  message?: string;
}

// ============================================
// 지역 & 세력 & 내정 시스템
// ============================================

// 세력 ID
export type FactionId = 'player' | 'liubei' | 'caocao' | 'sunquan' | 'dongzhuo' | 'yuanshao' | 'liubiao' | 'liuzhang' | 'gongsunzan' | 'rebels';

// 세력 정보
export interface Faction {
  id: FactionId;
  name: string;
  nameKo: string;
  color: string;     // 맵 표시용 색상
  ruler: string;     // 군주 장수 ID
}

// 지역 ID
export type RegionId = 'luoyang' | 'xuchang' | 'chengdu' | 'jianye' | 'changan' | 'ye' | 'jingzhou' | 'yizhou' | 'youzhou';

// 지역 정보
export interface Region {
  id: RegionId;
  name: string;
  nameKo: string;
  description: string;
  adjacent: RegionId[];  // 인접 지역
  owner: FactionId;      // 소유 세력
  // 자원
  gold: number;
  food: number;
  population: number;
  troops: number;
  // 개발도 (0~100)
  commerce: number;      // 상업
  agriculture: number;   // 농업
  defense: number;       // 성벽 내구도
  // 주둔 장수
  generals: string[];
}

// 자원 종류
export interface Resources {
  gold: number;
  food: number;
  population: number;
  troops: number;
}

// 내정 명령
export type DomesticAction = 'develop_farm' | 'develop_commerce' | 'recruit' | 'train' | 'rest';

// 내정 명령 정보
export interface DomesticCommand {
  id: DomesticAction;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  cost: Partial<Resources>;
  statRequired: 'politics' | 'might' | 'charisma';
}

// 게임 상태
export interface GameState {
  turn: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
  playerFaction: FactionId;
  regions: Record<RegionId, Region>;
  factions: Record<FactionId, Faction>;
  selectedRegion: RegionId | null;
  actionsRemaining: number;
  maxActions: number;
  phase: 'map' | 'domestic' | 'military' | 'battle' | 'recruit' | 'prisoner';
  // 출진 상태
  march: MarchState | null;
  // 전투 데이터
  battleData: BattleInitData | null;
  // 장수 시스템
  prisoners: Prisoner[];           // 포로 목록
  freeGenerals: FreeGeneral[];     // 재야 장수 목록
  deadGenerals: string[];          // 사망한 장수 ID 목록
  generalLoyalty: Record<string, number>; // 장수별 충성도 (장수 ID -> 충성도)
}

// 탭 종류
export type GameTab = 'map' | 'domestic' | 'military' | 'diplomacy';

// 게임 단계 (구 GameContext용)
export type GamePhase = 'title' | 'faction_select' | 'playing' | 'battle' | 'game_over';

// ============================================
// 출진 시스템
// ============================================

export type MarchStep = 'target' | 'generals' | 'troops' | 'confirm';

export interface MarchUnit {
  generalId: string;
  troops: number;
  troopType: TroopType;
  isCommander: boolean;  // 주장 여부
}

export interface MarchState {
  step: MarchStep;
  targetRegion: RegionId | null;
  units: MarchUnit[];
  foodRequired: number;
}

// 전투 초기화 데이터
export interface BattleInitData {
  playerUnits: MarchUnit[];
  playerRegionId: RegionId;
  enemyRegionId: RegionId;
  enemyGeneralIds: string[];
  enemyTroops: number;
}

// 전투 결과
export interface BattleOutcome {
  winner: 'player' | 'enemy';
  playerTroopsLost: number;
  enemyTroopsLost: number;
  capturedGenerals: string[];      // 잡은 적 포로
  conqueredRegion: boolean;
  // 장수 운명
  playerGeneralFates: GeneralFate[];  // 아군 장수들의 운명
  enemyGeneralFates: GeneralFate[];   // 적 장수들의 운명
}
