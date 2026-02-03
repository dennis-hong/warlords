/**
 * AI 세력 턴 자동화
 * 
 * AI 세력이 매 턴 내정, 군사 행동을 결정
 */

import type { 
  GameState, 
  FactionId, 
  RegionId,
  Region,
  DiplomaticRelationType,
  AITurnLog
} from '../types';
import { GENERALS, UNAFFILIATED_GENERALS } from '../constants/gameData';
import { getRelationBetween, analyzeFactions, type FactionAnalysis } from './aiDiplomacy';

// AI 행동 결과
export interface AIActionResult {
  factionId: FactionId;
  actions: AIAction[];
}

export interface AIAction {
  type: 'develop' | 'recruit' | 'train' | 'attack' | 'reinforce';
  regionId?: RegionId;
  targetRegionId?: RegionId;
  troops?: number;
  message: string;
}

// AITurnLog는 types/index.ts에서 정의됨 (재export)
export type { AITurnLog };

/**
 * AI 세력의 지역 우선순위 계산
 */
function calculateRegionPriority(
  region: Region,
  gameState: GameState,
  analyses: FactionAnalysis[]
): number {
  let priority = 0;
  
  // 접경 지역 우선 (방어 필요)
  const hasEnemyNeighbor = region.adjacent.some(adjId => {
    const adjRegion = gameState.regions[adjId];
    if (!adjRegion || adjRegion.owner === region.owner) return false;
    const relation = getRelationBetween(
      gameState.diplomaticRelations,
      region.owner,
      adjRegion.owner
    );
    return relation === 'hostile' || relation === 'neutral';
  });
  
  if (hasEnemyNeighbor) priority += 30;
  
  // 병력이 적으면 우선
  if (region.troops < 3000) priority += 20;
  
  // 개발도가 낮으면 우선
  if (region.agriculture < 50) priority += 10;
  if (region.commerce < 50) priority += 10;
  
  // 훈련도가 낮으면 우선
  if ((region.training || 50) < 60) priority += 10;
  
  return priority;
}

/**
 * AI 공격 대상 선정
 */
function findAttackTarget(
  factionId: FactionId,
  gameState: GameState,
  analyses: FactionAnalysis[]
): { sourceRegion: RegionId; targetRegion: RegionId; troops: number } | null {
  const myAnalysis = analyses.find(a => a.factionId === factionId);
  if (!myAnalysis) return null;
  
  // 내 지역들
  const myRegions = Object.values(gameState.regions).filter(r => r.owner === factionId);
  
  let bestAttack: { sourceRegion: RegionId; targetRegion: RegionId; troops: number; score: number } | null = null;
  
  for (const sourceRegion of myRegions) {
    // 병력이 충분해야 공격 가능 (최소 3000)
    if (sourceRegion.troops < 3000) continue;
    
    // 인접 적 지역 찾기
    for (const adjId of sourceRegion.adjacent) {
      const targetRegion = gameState.regions[adjId];
      if (!targetRegion || targetRegion.owner === factionId) continue;
      
      // 동맹/불가침 상대는 공격 안 함
      const relation = getRelationBetween(
        gameState.diplomaticRelations,
        factionId,
        targetRegion.owner
      );
      if (relation === 'alliance' || relation === 'truce') continue;
      
      // 병력 비율 계산
      const attackableTroops = Math.floor(sourceRegion.troops * 0.7); // 70%만 출진
      const powerRatio = attackableTroops / Math.max(targetRegion.troops, 1);
      
      // 1.5배 이상 우세해야 공격
      if (powerRatio < 1.5) continue;
      
      const score = powerRatio * 100 - targetRegion.defense;
      
      if (!bestAttack || score > bestAttack.score) {
        bestAttack = {
          sourceRegion: sourceRegion.id,
          targetRegion: targetRegion.id,
          troops: attackableTroops,
          score
        };
      }
    }
  }
  
  if (bestAttack) {
    return {
      sourceRegion: bestAttack.sourceRegion,
      targetRegion: bestAttack.targetRegion,
      troops: bestAttack.troops
    };
  }
  
  return null;
}

/**
 * AI 세력의 한 턴 행동 결정
 */
export function processAIFactionTurn(
  gameState: GameState,
  factionId: FactionId,
  analyses: FactionAnalysis[]
): { newState: GameState; actions: AIAction[] } {
  const actions: AIAction[] = [];
  let state = { ...gameState };
  
  // 내 지역들
  const myRegions = Object.values(state.regions)
    .filter(r => r.owner === factionId)
    .sort((a, b) => 
      calculateRegionPriority(b, state, analyses) - 
      calculateRegionPriority(a, state, analyses)
    );
  
  if (myRegions.length === 0) {
    return { newState: state, actions };
  }
  
  // AI 행동력 (플레이어와 동일하게 3)
  let actionsRemaining = 3;
  
  // 1. 내정 행동
  for (const region of myRegions) {
    if (actionsRemaining <= 0) break;
    
    // 자원 확인
    const canAfford = (gold: number, food: number) => 
      region.gold >= gold && region.food >= food;
    
    // 병력 부족 → 징병
    if (region.troops < 5000 && region.population > 10000 && canAfford(500, 500)) {
      const recruited = Math.min(1000, Math.floor(region.population * 0.1));
      state = {
        ...state,
        regions: {
          ...state.regions,
          [region.id]: {
            ...state.regions[region.id],
            troops: state.regions[region.id].troops + recruited,
            population: state.regions[region.id].population - recruited,
            gold: state.regions[region.id].gold - 500,
            food: state.regions[region.id].food - 500
          }
        }
      };
      actions.push({
        type: 'recruit',
        regionId: region.id,
        troops: recruited,
        message: `${region.nameKo}에서 ${recruited}명 징병`
      });
      actionsRemaining--;
      continue;
    }
    
    // 훈련도 낮음 → 훈련
    const training = region.training || 50;
    if (training < 70 && canAfford(300, 200)) {
      const increase = Math.min(10, 100 - training);
      state = {
        ...state,
        regions: {
          ...state.regions,
          [region.id]: {
            ...state.regions[region.id],
            training: training + increase,
            gold: state.regions[region.id].gold - 300,
            food: state.regions[region.id].food - 200
          }
        }
      };
      actions.push({
        type: 'train',
        regionId: region.id,
        message: `${region.nameKo}에서 병력 훈련 (+${increase})`
      });
      actionsRemaining--;
      continue;
    }
    
    // 농업/상업 개발
    if (region.agriculture < 70 && canAfford(500, 0)) {
      const increase = 5;
      state = {
        ...state,
        regions: {
          ...state.regions,
          [region.id]: {
            ...state.regions[region.id],
            agriculture: Math.min(100, region.agriculture + increase),
            gold: state.regions[region.id].gold - 500
          }
        }
      };
      actions.push({
        type: 'develop',
        regionId: region.id,
        message: `${region.nameKo} 농업 개발 (+${increase}%)`
      });
      actionsRemaining--;
      continue;
    }
    
    if (region.commerce < 70 && canAfford(500, 0)) {
      const increase = 5;
      state = {
        ...state,
        regions: {
          ...state.regions,
          [region.id]: {
            ...state.regions[region.id],
            commerce: Math.min(100, region.commerce + increase),
            gold: state.regions[region.id].gold - 500
          }
        }
      };
      actions.push({
        type: 'develop',
        regionId: region.id,
        message: `${region.nameKo} 상업 개발 (+${increase}%)`
      });
      actionsRemaining--;
    }
  }
  
  // 2. 공격 행동 (간소화 - 실제 전투는 복잡하므로 병력 손실만 계산)
  // 참고: 실제 전투 시스템과 통합하려면 더 복잡한 로직 필요
  // 지금은 간단히 병력 이동 + 손실 계산만
  
  const attackTarget = findAttackTarget(factionId, state, analyses);
  
  if (attackTarget && actionsRemaining > 0) {
    const { sourceRegion, targetRegion, troops } = attackTarget;
    const target = state.regions[targetRegion];
    const source = state.regions[sourceRegion];
    
    // 간단한 전투 계산
    const attackPower = troops * 1.0;  // 공격력
    const defensePower = target.troops * 1.2 + target.defense * 10;  // 방어력 (방어 보너스)
    
    const powerRatio = attackPower / Math.max(defensePower, 1);
    
    if (powerRatio > 1.2) {
      // 공격 성공
      const attackerLoss = Math.floor(troops * 0.2);  // 20% 손실
      const defenderLoss = target.troops;  // 전멸
      
      // 지역 점령
      state = {
        ...state,
        regions: {
          ...state.regions,
          [sourceRegion]: {
            ...source,
            troops: source.troops - troops  // 출진 병력 감소
          },
          [targetRegion]: {
            ...target,
            owner: factionId,
            troops: troops - attackerLoss,  // 남은 병력
            generals: []  // 장수는 도망 (간소화)
          }
        }
      };
      
      actions.push({
        type: 'attack',
        regionId: sourceRegion,
        targetRegionId: targetRegion,
        troops,
        message: `⚔️ ${source.nameKo}에서 ${target.nameKo} 점령! (${defenderLoss}명 섬멸)`
      });
    } else {
      // 공격 실패 (손실만 발생)
      const attackerLoss = Math.floor(troops * 0.3);  // 30% 손실
      const defenderLoss = Math.floor(target.troops * 0.2);  // 20% 손실
      
      state = {
        ...state,
        regions: {
          ...state.regions,
          [sourceRegion]: {
            ...source,
            troops: source.troops - attackerLoss
          },
          [targetRegion]: {
            ...target,
            troops: target.troops - defenderLoss
          }
        }
      };
      
      actions.push({
        type: 'attack',
        regionId: sourceRegion,
        targetRegionId: targetRegion,
        troops,
        message: `⚔️ ${source.nameKo}에서 ${target.nameKo} 공격 실패 (${attackerLoss}명 손실)`
      });
    }
    actionsRemaining--;
  }
  
  return { newState: state, actions };
}

/**
 * 모든 AI 세력의 턴 처리
 */
export function processAllAITurns(gameState: GameState): { 
  newState: GameState; 
  logs: AITurnLog[] 
} {
  const analyses = analyzeFactions(gameState);
  const logs: AITurnLog[] = [];
  let state = { ...gameState };
  
  // 생존 AI 세력
  const aiFactions = analyses
    .filter(a => a.isAlive && a.factionId !== state.playerFaction && a.factionId !== 'player')
    .map(a => a.factionId);
  
  for (const factionId of aiFactions) {
    const { newState, actions } = processAIFactionTurn(state, factionId, analyses);
    state = newState;
    
    if (actions.length > 0) {
      logs.push({
        turn: state.turn,
        factionId,
        factionName: state.factions[factionId]?.nameKo || factionId,
        actions: actions.map(a => a.message)
      });
    }
  }
  
  return { newState: state, logs };
}

/**
 * AI 수입 처리 (플레이어와 동일)
 */
export function processAIIncome(gameState: GameState): GameState {
  const newRegions = { ...gameState.regions };
  
  Object.keys(newRegions).forEach(key => {
    const regionId = key as RegionId;
    const region = newRegions[regionId];
    
    // AI 영토만 처리 (플레이어 제외)
    if (region.owner === gameState.playerFaction || region.owner === 'player') return;
    
    // 금 수입 (상업 비례)
    const goldIncome = Math.floor(region.population * 0.1 * (region.commerce / 100));
    // 식량 수입 (농업 비례)
    const foodIncome = Math.floor(region.population * 0.2 * (region.agriculture / 100));
    // 병력 유지비
    const upkeep = Math.floor(region.troops * 0.05);
    // 인구 증가
    const popGrowth = Math.floor(region.population * 0.02);
    
    newRegions[regionId] = {
      ...region,
      gold: region.gold + goldIncome,
      food: Math.max(0, region.food + foodIncome - upkeep),
      population: region.population + popGrowth
    };
  });
  
  return { ...gameState, regions: newRegions };
}
