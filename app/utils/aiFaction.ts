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
  Prisoner,
  AITurnLog
} from '../types';
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
  gameState: GameState
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
  if (region.troops < 5000) priority += 20;
  else if (region.troops < 10000) priority += 10;

  // 개발도가 낮으면 우선
  if (region.agriculture < 70) priority += 10;
  if (region.commerce < 70) priority += 10;

  // 훈련도가 낮으면 우선
  if ((region.training ?? 50) < 70) priority += 10;
  
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
      calculateRegionPriority(b, state) - 
      calculateRegionPriority(a, state)
    );
  
  if (myRegions.length === 0) {
    return { newState: state, actions };
  }
  
  // AI 행동력 (플레이어와 동일하게 3)
  let actionsRemaining = 3;
  
  // 행동력 소진까지 반복 (내정 + 공격 통합)
  let attackAttempted = false; // 턴당 공격은 1회만

  while (actionsRemaining > 0) {
    let actionTaken = false;

    // 공격 가능 여부 먼저 확인 (아직 공격 안 했으면)
    if (!attackAttempted) {
      const attackTarget = findAttackTarget(factionId, state, analyses);
      if (attackTarget) {
        attackAttempted = true;
        const { sourceRegion, targetRegion, troops } = attackTarget;
        const target = state.regions[targetRegion];
        const source = state.regions[sourceRegion];

        const attackPower = troops * 1.0;
        const defensePower = target.troops * 1.2 + target.defense * 10;
        const powerRatio = attackPower / Math.max(defensePower, 1);

        if (powerRatio > 1.2) {
          const attackerLoss = Math.floor(troops * 0.2);
          const defenderLoss = target.troops;
          const capturedGenerals: Prisoner[] = target.generals
            .filter(generalId => !state.prisoners.some(p => p.generalId === generalId))
            .map(generalId => ({
              generalId,
              capturedTurn: state.turn,
              capturedBy: factionId,
              location: targetRegion
            }));
          state = {
            ...state,
            prisoners: [...state.prisoners, ...capturedGenerals],
            regions: {
              ...state.regions,
              [sourceRegion]: { ...source, troops: source.troops - troops },
              [targetRegion]: {
                ...target,
                owner: factionId,
                troops: Math.max(0, troops - attackerLoss),
                generals: []
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
          const attackerLoss = Math.floor(troops * 0.3);
          const defenderLoss = Math.floor(target.troops * 0.2);
          state = {
            ...state,
            regions: {
              ...state.regions,
              [sourceRegion]: { ...source, troops: source.troops - attackerLoss },
              [targetRegion]: { ...target, troops: Math.max(0, target.troops - defenderLoss) }
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
        actionTaken = true;
        if (actionsRemaining <= 0) break;
      }
    }

    // 내정 행동: 지역 우선순위 재계산
    const sortedRegions = Object.values(state.regions)
      .filter(r => r.owner === factionId)
      .sort((a, b) =>
        calculateRegionPriority(b, state) -
        calculateRegionPriority(a, state)
      );

    let domesticDone = false;
    for (const regionSnapshot of sortedRegions) {
      if (actionsRemaining <= 0) break;

      const region = state.regions[regionSnapshot.id];
      const canAfford = (gold: number, food: number) =>
        region.gold >= gold && region.food >= food;

      // 병력 부족 → 징병 (인구 대비 병력이 적으면)
      if (region.troops < 10000 && region.population > 5000 && canAfford(500, 500)) {
        const recruited = Math.min(1500, Math.floor(region.population * 0.1));
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
        actions.push({ type: 'recruit', regionId: region.id, troops: recruited, message: `${region.nameKo}에서 ${recruited}명 징병` });
        actionsRemaining--;
        domesticDone = true;
        break;
      }

      // 훈련도 → 훈련
      const training = region.training ?? 50;
      if (training < 90 && canAfford(300, 200)) {
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
        actions.push({ type: 'train', regionId: region.id, message: `${region.nameKo}에서 병력 훈련 (+${increase})` });
        actionsRemaining--;
        domesticDone = true;
        break;
      }

      // 농업 개발
      if (region.agriculture < 90 && canAfford(500, 0)) {
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
        actions.push({ type: 'develop', regionId: region.id, message: `${region.nameKo} 농업 개발 (+${increase}%)` });
        actionsRemaining--;
        domesticDone = true;
        break;
      }

      // 상업 개발
      if (region.commerce < 90 && canAfford(500, 0)) {
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
        actions.push({ type: 'develop', regionId: region.id, message: `${region.nameKo} 상업 개발 (+${increase}%)` });
        actionsRemaining--;
        domesticDone = true;
        break;
      }

      // 성벽 강화 (다른 행동 조건이 안 맞을 때 폴백)
      if (region.defense < 100 && canAfford(500, 0)) {
        const increase = 5;
        state = {
          ...state,
          regions: {
            ...state.regions,
            [region.id]: {
              ...state.regions[region.id],
              defense: Math.min(100, region.defense + increase),
              gold: state.regions[region.id].gold - 500
            }
          }
        };
        actions.push({ type: 'develop', regionId: region.id, message: `${region.nameKo} 성벽 강화 (+${increase}%)` });
        actionsRemaining--;
        domesticDone = true;
        break;
      }
    }

    // 공격도 내정도 못 했으면 종료
    if (!actionTaken && !domesticDone) break;
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
  const logs: AITurnLog[] = [];
  let state = { ...gameState };
  
  // 생존 AI 세력
  const aiFactions = analyzeFactions(state)
    .filter(a => a.isAlive && a.factionId !== state.playerFaction && a.factionId !== 'player')
    .map(a => a.factionId);
  
  for (const factionId of aiFactions) {
    const currentAnalyses = analyzeFactions(state);
    const { newState, actions } = processAIFactionTurn(state, factionId, currentAnalyses);
    state = newState;
    
    if (actions.length > 0) {
      logs.push({
        turn: state.turn,
        factionId,
        factionName: state.factions[factionId]?.nameKo || factionId,
        actions: actions.map(a => a.message),
        actionDetails: actions.map(a => ({
          type: a.type,
          regionId: a.regionId,
          targetRegionId: a.targetRegionId
        }))
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
