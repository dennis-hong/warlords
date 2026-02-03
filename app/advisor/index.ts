// ============================================
// 전략 조언 시스템 메인 엔트리
// ============================================

export * from './types';
export * from './strategists';
export * from './analyzeState';
export * from './generateAdvice';
export * from './personalizeAdvice';

// 간편 사용을 위한 통합 함수
import type { GameState } from '../types';
import type { AdvisorSession } from './types';
import { getStrategistForFaction } from './strategists';
import { analyzeGameState, generateSituationSummary } from './analyzeState';
import { generateAllAdvice } from './generateAdvice';
import { personalizeAllAdvice } from './personalizeAdvice';

export function getAdvisorSession(state: GameState): AdvisorSession {
  // 1. 책사 선택 (선택한 세력 기반)
  const strategist = getStrategistForFaction(state.selectedFaction);
  
  // 2. 상황 분석
  const analysis = analyzeGameState(state);
  
  // 3. 상황 요약 생성
  const situation = generateSituationSummary(state, analysis);
  
  // 4. 조언 생성
  const rawAdvice = generateAllAdvice(state, analysis, strategist);
  
  // 5. 책사 성격에 맞게 조언 개성화 🎭
  const advice = personalizeAllAdvice(rawAdvice, strategist);
  
  return {
    strategist,
    advice,
    generatedAt: state.turn,
    situation
  };
}
