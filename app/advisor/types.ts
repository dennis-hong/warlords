// ============================================
// 전략 조언 시스템 타입 정의
// ============================================

import { FactionId, RegionId } from '../types';

// 조언 카테고리
export type AdviceCategory = 
  | 'urgent'      // 긴급 (즉시 조치 필요)
  | 'military'    // 군사 (공격/방어 제안)
  | 'domestic'    // 내정 (개발 제안)
  | 'personnel'   // 인사 (등용/장수 관리)
  | 'strategic';  // 전략 (장기 계획)

// 조언 우선순위
export type AdvicePriority = 'critical' | 'high' | 'medium' | 'low';

// 조언 항목
export interface Advice {
  id: string;
  category: AdviceCategory;
  priority: AdvicePriority;
  title: string;
  description: string;
  reasoning: string;      // 왜 이 조언을 하는지
  actionable?: {          // 실행 가능한 행동 제안
    type: 'attack' | 'defend' | 'develop' | 'recruit' | 'train' | 'other';
    targetRegion?: RegionId;
    targetGeneral?: string;
  };
}

// 책사 성격 타입
export type PersonalityType = 'aggressive' | 'cautious' | 'balanced' | 'cunning';

// 책사 캐릭터
export interface Strategist {
  id: string;
  name: string;
  nameKo: string;
  portrait: string;       // 이모지
  faction: FactionId;
  specialty: AdviceCategory[];
  greeting: string;       // 인사말
  catchphrase: string;    // 특유의 말투/어미
  personality: PersonalityType;  // 성격 유형
  speechStyle: {          // 말투 스타일
    emphasis: string[];   // 자주 강조하는 표현
    endings: string[];    // 문장 끝맺음
    exclamations: string[]; // 감탄사
  };
}

// 조언 세션
export interface AdvisorSession {
  strategist: Strategist;
  advice: Advice[];
  generatedAt: number;    // 턴
  situation: string;      // 현재 상황 요약
}

// 상황 분석 결과
export interface SituationAnalysis {
  // 자원 상태
  resources: {
    goldStatus: 'critical' | 'low' | 'adequate' | 'abundant';
    foodStatus: 'critical' | 'low' | 'adequate' | 'abundant';
    troopsStatus: 'critical' | 'low' | 'adequate' | 'abundant';
  };
  
  // 세력 비교
  factionStrength: {
    factionId: FactionId;
    totalTroops: number;
    totalRegions: number;
    avgDevelopment: number;
  }[];
  
  // 위협 분석
  threats: {
    factionId: FactionId;
    borderRegions: RegionId[];
    threatLevel: 'imminent' | 'potential' | 'none';
    enemyTroops: number;
  }[];
  
  // 기회 분석
  opportunities: {
    regionId: RegionId;
    owner: FactionId;
    weakness: string;
    troops: number;
    adjacentPlayerRegion: RegionId;
  }[];
  
  // 재야 장수
  availableGenerals: {
    generalId: string;
    location: RegionId;
    value: number;  // 능력치 합계
  }[];
  
  // 내정 필요 지역
  underdeveloped: {
    regionId: RegionId;
    agriculture: number;
    commerce: number;
    training: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}
