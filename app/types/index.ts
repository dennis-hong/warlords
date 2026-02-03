// ============================================
// 기본 타입 (다른 타입에서 참조)
// ============================================

// 세력 ID
export type FactionId = 'player' | 'liubei' | 'caocao' | 'sunquan' | 'dongzhuo' | 'yuanshao' | 'liubiao' | 'liuzhang' | 'gongsunzan' | 'rebels';

// 지역 ID
export type RegionId = 'luoyang' | 'xuchang' | 'chengdu' | 'jianye' | 'changan' | 'ye' | 'jingzhou' | 'yizhou' | 'youzhou';

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

// 장수 사망/포로 결과
export interface GeneralFate {
  generalId: string;
  fate: 'alive' | 'dead' | 'captured' | 'escaped';
  message?: string;
}

// ============================================
// 역사 이벤트 시스템 (GameState 전에 정의 필요)
// ============================================

export type EventTrigger = 
  | 'game_start'           // 게임 시작 시
  | 'turn_start'           // 턴 시작 시
  | 'turn_end'             // 턴 종료 시
  | 'region_captured'      // 지역 점령 시
  | 'battle_start'         // 전투 시작 시
  | 'battle_end'           // 전투 종료 시
  | 'general_recruited'    // 장수 등용 시
  | 'general_captured'     // 장수 포로 시
  | 'general_died';        // 장수 사망 시

export interface EventCondition {
  type: 'faction' | 'turn' | 'turnMin' | 'turnMax' | 'region_owner' | 'has_general' | 'general_free' | 'general_in_region' | 'troops_ratio' | 'custom';
  factionId?: FactionId;
  turn?: number;
  turnMin?: number;
  turnMax?: number;
  regionId?: RegionId;
  generalId?: string;
  ratio?: number;        // 병력 비율 (적 대비)
  customCheck?: string;  // 커스텀 조건 함수명
}

export interface EventEffect {
  type: 'add_general' | 'remove_general' | 'add_troops' | 'add_gold' | 'add_food' | 
        'set_loyalty' | 'add_loyalty' | 'add_morale' | 'set_relation' | 'unlock_stratagem' |
        'battle_bonus' | 'message';
  targetType?: 'player' | 'faction' | 'general' | 'region';
  targetId?: string;
  value?: number;
  generalId?: string;
  regionId?: RegionId;
  message?: string;
}

export interface EventChoice {
  id: string;
  text: string;
  effects: EventEffect[];
}

export interface HistoricalEvent {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  image?: string;         // 이모지 or 이미지
  trigger: EventTrigger;
  conditions: EventCondition[];
  choices: EventChoice[];
  isRepeatable: boolean;  // 반복 가능 여부
  priority: number;       // 우선순위 (높을수록 먼저)
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

// ============================================
// 지역 & 세력 & 내정 시스템
// ============================================

// 세력 정보
export interface Faction {
  id: FactionId;
  name: string;
  nameKo: string;
  color: string;     // 맵 표시용 색상
  ruler: string;     // 군주 장수 ID
}

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
  training: number;      // 훈련도 (0~100) - 전투력 보너스
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
export type DomesticAction = 'develop_farm' | 'develop_commerce' | 'recruit' | 'train';

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

// ============================================
// 게임 상태
// ============================================

// 전투 결과 데이터 (결과 화면 표시용)
export interface BattleResultData {
  outcome: BattleOutcome;
  conqueredRegionId: RegionId | null;  // 점령한 지역 (승리 시)
  sourceRegionId: RegionId;            // 출발 지역
  pendingPrisoners: GeneralFate[];     // 처리 대기 중인 포로들
}

export interface GameState {
  turn: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  year: number;
  playerFaction: FactionId;
  selectedFaction: FactionId;      // 선택한 원래 세력 (이벤트 조건용)
  regions: Record<RegionId, Region>;
  factions: Record<FactionId, Faction>;
  selectedRegion: RegionId | null;
  actionsRemaining: number;
  maxActions: number;
  phase: 'map' | 'domestic' | 'military' | 'battle' | 'battle_result' | 'recruit' | 'prisoner';
  // 전투 결과 데이터
  battleResult: BattleResultData | null;
  // 출진 상태
  march: MarchState | null;
  // 전투 데이터
  battleData: BattleInitData | null;
  // 장수 시스템
  prisoners: Prisoner[];           // 포로 목록
  freeGenerals: FreeGeneral[];     // 재야 장수 목록
  deadGenerals: string[];          // 사망한 장수 ID 목록
  generalLoyalty: Record<string, number>; // 장수별 충성도 (장수 ID -> 충성도)
  // 이벤트 시스템
  triggeredEvents: string[];       // 이미 발생한 이벤트 ID 목록
  activeEvent: HistoricalEvent | null;  // 현재 표시 중인 이벤트
  battleBonuses: Record<string, number>; // 장수별 전투 보너스 (이벤트로 획득)
  // 외교 시스템
  diplomaticRelations: DiplomaticRelation[];  // 세력간 외교 관계
  diplomaticProposals: DiplomaticProposal[];  // 대기 중인 외교 제안
  // AI 턴 로그 (최근 턴의 AI 행동)
  aiTurnLogs: AITurnLog[];
}

// AI 턴 로그
export interface AITurnLog {
  turn: number;
  factionId: FactionId;
  factionName: string;
  actions: string[];
}

// 탭 종류
export type GameTab = 'map' | 'domestic' | 'military' | 'diplomacy';

// 게임 단계
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
  playerTraining: number;  // 플레이어 훈련도
  enemyTraining: number;   // 적 훈련도
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

// ============================================
// 외교 시스템
// ============================================

// 외교 관계 타입
export type DiplomaticRelationType = 
  | 'alliance'      // 동맹 (공동 방어, 영토 통과)
  | 'truce'         // 불가침 (일정 턴 공격 금지)
  | 'tribute'       // 조공 (한쪽이 다른 쪽에 자원 제공)
  | 'hostile'       // 적대 (전쟁 중)
  | 'neutral';      // 중립 (기본 상태)

// 외교 관계
export interface DiplomaticRelation {
  faction1: FactionId;
  faction2: FactionId;
  type: DiplomaticRelationType;
  startTurn: number;        // 관계 시작 턴
  duration?: number;        // 지속 턴 수 (불가침의 경우)
  tributeAmount?: {         // 조공액 (조공의 경우)
    gold?: number;
    food?: number;
  };
  tributeGiver?: FactionId; // 조공 제공자
}

// 외교 제안
export interface DiplomaticProposal {
  id: string;
  from: FactionId;
  to: FactionId;
  type: DiplomaticRelationType;
  proposedTurn: number;
  duration?: number;
  tributeAmount?: {
    gold?: number;
    food?: number;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

// 외교 명령 타입
export type DiplomaticAction = 
  | 'propose_alliance'    // 동맹 제안
  | 'propose_truce'       // 불가침 제안
  | 'propose_tribute'     // 조공 제안
  | 'declare_war'         // 선전포고
  | 'break_alliance'      // 동맹 파기
  | 'cancel_truce';       // 불가침 파기
