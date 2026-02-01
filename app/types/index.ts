// 장수 데이터
export interface General {
  id: string;
  name: string;
  nameKo: string;
  might: number;      // 무력
  intellect: number;  // 지력
  politics: number;   // 정치
  charisma: number;   // 매력
  portrait?: string;  // 이모지 or 이미지
}

// 병종
export type TroopType = 'infantry' | 'cavalry' | 'archer';

// 계략
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

// 전투 유닛 (장수 + 병력)
export interface BattleUnit {
  general: General;
  troops: number;
  maxTroops: number;
  morale: number;
  troopType: TroopType;
  usedStratagems: string[];  // 쿨다운 중인 계략
}

// 일기토 선택지
export type DuelChoice = 'power' | 'counter' | 'special';

// 전투 행동
export type BattleAction = 'charge' | 'defend' | 'stratagem' | 'duel';

// 전투 로그
export interface BattleLog {
  round: number;
  message: string;
  type: 'info' | 'damage' | 'morale' | 'stratagem' | 'duel' | 'victory' | 'defeat';
}

// 전투 상태
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

// 전투 결과
export interface BattleResult {
  winner: 'player' | 'enemy';
  playerTroopsLost: number;
  enemyTroopsLost: number;
  rounds: number;
}
