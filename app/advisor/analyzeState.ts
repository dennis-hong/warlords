// ============================================
// 상황 분석 로직
// ============================================

import type { GameState, FactionId, RegionId, Region } from '../types';
import type { SituationAnalysis } from './types';
import { GENERALS, UNAFFILIATED_GENERALS } from '../constants/gameData';
import { REGIONS } from '../constants/worldData';

// 자원 상태 판단
function getResourceStatus(amount: number, type: 'gold' | 'food' | 'troops'): 'critical' | 'low' | 'adequate' | 'abundant' {
  const thresholds = {
    gold: { critical: 500, low: 1500, adequate: 5000 },
    food: { critical: 1000, low: 3000, adequate: 8000 },
    troops: { critical: 1000, low: 3000, adequate: 8000 }
  };
  
  const t = thresholds[type];
  if (amount < t.critical) return 'critical';
  if (amount < t.low) return 'low';
  if (amount < t.adequate) return 'adequate';
  return 'abundant';
}

// 플레이어의 총 자원 계산
function calculatePlayerResources(state: GameState): { gold: number; food: number; troops: number } {
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  return {
    gold: playerRegions.reduce((sum, r) => sum + r.gold, 0),
    food: playerRegions.reduce((sum, r) => sum + r.food, 0),
    troops: playerRegions.reduce((sum, r) => sum + r.troops, 0)
  };
}

// 세력별 강도 계산
function calculateFactionStrengths(state: GameState): SituationAnalysis['factionStrength'] {
  const factionData: Map<FactionId, { troops: number; regions: number; development: number }> = new Map();
  
  for (const region of Object.values(state.regions)) {
    const existing = factionData.get(region.owner) || { troops: 0, regions: 0, development: 0 };
    existing.troops += region.troops;
    existing.regions += 1;
    existing.development += (region.agriculture + region.commerce) / 2;
    factionData.set(region.owner, existing);
  }
  
  return Array.from(factionData.entries())
    .map(([factionId, data]) => ({
      factionId,
      totalTroops: data.troops,
      totalRegions: data.regions,
      avgDevelopment: data.regions > 0 ? data.development / data.regions : 0
    }))
    .sort((a, b) => b.totalTroops - a.totalTroops);
}

// 위협 분석
function analyzeThreat(state: GameState): SituationAnalysis['threats'] {
  const threats: SituationAnalysis['threats'] = [];
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  
  // 플레이어 인접 적 세력 분석
  const adjacentEnemies: Map<FactionId, { regions: RegionId[]; troops: number }> = new Map();
  
  for (const playerRegion of playerRegions) {
    for (const adjId of playerRegion.adjacent) {
      const adjRegion = state.regions[adjId];
      if (adjRegion && adjRegion.owner !== state.playerFaction) {
        const existing = adjacentEnemies.get(adjRegion.owner) || { regions: [], troops: 0 };
        if (!existing.regions.includes(adjId)) {
          existing.regions.push(adjId);
          existing.troops += adjRegion.troops;
        }
        adjacentEnemies.set(adjRegion.owner, existing);
      }
    }
  }
  
  // 플레이어 총 병력
  const playerTroops = playerRegions.reduce((sum, r) => sum + r.troops, 0);
  
  for (const [factionId, data] of adjacentEnemies) {
    let threatLevel: 'imminent' | 'potential' | 'none' = 'none';
    
    // 적이 플레이어보다 병력이 1.5배 이상이면 위협
    if (data.troops > playerTroops * 1.5) {
      threatLevel = 'imminent';
    } else if (data.troops > playerTroops * 0.8) {
      threatLevel = 'potential';
    }
    
    threats.push({
      factionId,
      borderRegions: data.regions,
      threatLevel,
      enemyTroops: data.troops
    });
  }
  
  return threats.sort((a, b) => {
    const order = { imminent: 0, potential: 1, none: 2 };
    return order[a.threatLevel] - order[b.threatLevel];
  });
}

// 공격 기회 분석
function analyzeOpportunities(state: GameState): SituationAnalysis['opportunities'] {
  const opportunities: SituationAnalysis['opportunities'] = [];
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  
  for (const playerRegion of playerRegions) {
    for (const adjId of playerRegion.adjacent) {
      const adjRegion = state.regions[adjId];
      if (adjRegion && adjRegion.owner !== state.playerFaction) {
        // 약점 분석
        let weakness = '';
        if (adjRegion.troops < 1000) {
          weakness = '병력 부족';
        } else if (adjRegion.generals.length === 0) {
          weakness = '장수 없음';
        } else if (adjRegion.defense < 30) {
          weakness = '성벽 취약';
        } else if (adjRegion.troops < playerRegion.troops * 0.7) {
          weakness = '수적 열세';
        }
        
        if (weakness) {
          // 이미 같은 지역이 있는지 확인
          if (!opportunities.find(o => o.regionId === adjId)) {
            opportunities.push({
              regionId: adjId,
              owner: adjRegion.owner,
              weakness,
              troops: adjRegion.troops,
              adjacentPlayerRegion: playerRegion.id
            });
          }
        }
      }
    }
  }
  
  // 약점이 심각한 순서로 정렬 (병력 적은 순)
  return opportunities.sort((a, b) => a.troops - b.troops);
}

// 등용 가능한 재야 장수 분석
function analyzeAvailableGenerals(state: GameState): SituationAnalysis['availableGenerals'] {
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  const playerRegionIds = playerRegions.map(r => r.id);
  
  return state.freeGenerals
    .filter(fg => playerRegionIds.includes(fg.location))
    .map(fg => {
      const general = GENERALS[fg.generalId] || UNAFFILIATED_GENERALS[fg.generalId];
      if (!general) return null;
      
      const value = general.might + general.intellect + general.politics + general.charisma;
      return {
        generalId: fg.generalId,
        location: fg.location,
        value
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== null)
    .sort((a, b) => b.value - a.value);
}

// 개발 필요 지역 분석
function analyzeUnderdeveloped(state: GameState): SituationAnalysis['underdeveloped'] {
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  
  return playerRegions
    .map(region => {
      const avgDev = (region.agriculture + region.commerce + region.training) / 3;
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (avgDev < 30) {
        priority = 'high';
      } else if (avgDev < 50) {
        priority = 'medium';
      }
      
      return {
        regionId: region.id,
        agriculture: region.agriculture,
        commerce: region.commerce,
        training: region.training,
        priority
      };
    })
    .filter(r => r.priority !== 'low' || r.agriculture < 50 || r.commerce < 50 || r.training < 50)
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });
}

// 메인 분석 함수
export function analyzeGameState(state: GameState): SituationAnalysis {
  const resources = calculatePlayerResources(state);
  
  return {
    resources: {
      goldStatus: getResourceStatus(resources.gold, 'gold'),
      foodStatus: getResourceStatus(resources.food, 'food'),
      troopsStatus: getResourceStatus(resources.troops, 'troops')
    },
    factionStrength: calculateFactionStrengths(state),
    threats: analyzeThreat(state),
    opportunities: analyzeOpportunities(state),
    availableGenerals: analyzeAvailableGenerals(state),
    underdeveloped: analyzeUnderdeveloped(state)
  };
}

// 현재 상황 요약 텍스트 생성
export function generateSituationSummary(state: GameState, analysis: SituationAnalysis): string {
  const playerFaction = state.factions[state.playerFaction];
  const year = state.year;
  const season = { spring: '봄', summer: '여름', fall: '가을', winter: '겨울' }[state.season];
  
  const playerStrength = analysis.factionStrength.find(f => f.factionId === state.playerFaction);
  const rank = analysis.factionStrength.findIndex(f => f.factionId === state.playerFaction) + 1;
  
  let summary = `${year}년 ${season}, ${playerFaction?.nameKo || '우리 세력'}은 `;
  summary += `${playerStrength?.totalRegions || 0}개 지역을 지배하고 있습니다. `;
  summary += `(세력 순위: ${rank}위)`;
  
  // 위협 상황
  const imminentThreats = analysis.threats.filter(t => t.threatLevel === 'imminent');
  if (imminentThreats.length > 0) {
    const threatFaction = state.factions[imminentThreats[0].factionId];
    summary += ` ${threatFaction?.nameKo || '적'}의 위협이 임박해 있습니다!`;
  }
  
  return summary;
}
