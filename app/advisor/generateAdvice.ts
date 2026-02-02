// ============================================
// 조언 생성 로직
// ============================================

import type { GameState, FactionId, RegionId } from '../types';
import type { Advice, SituationAnalysis, Strategist } from './types';
import { GENERALS, UNAFFILIATED_GENERALS } from '../constants/gameData';
import { REGIONS } from '../constants/worldData';

// 고유 ID 생성
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// 지역 이름 가져오기
function getRegionName(regionId: RegionId): string {
  return REGIONS[regionId]?.nameKo || regionId;
}

// 세력 이름 가져오기
function getFactionName(state: GameState, factionId: FactionId): string {
  return state.factions[factionId]?.nameKo || factionId;
}

// 장수 이름 가져오기
function getGeneralName(generalId: string): string {
  const general = GENERALS[generalId] || UNAFFILIATED_GENERALS[generalId];
  return general?.nameKo || generalId;
}

// ============================================
// 긴급 조언 생성
// ============================================

function generateUrgentAdvice(state: GameState, analysis: SituationAnalysis): Advice[] {
  const advice: Advice[] = [];

  // 1. 자원 위기
  if (analysis.resources.goldStatus === 'critical') {
    advice.push({
      id: generateId(),
      category: 'urgent',
      priority: 'critical',
      title: '💰 금이 바닥났습니다!',
      description: '군자금이 고갈되어 봉록 지급과 군비 유지가 어렵습니다.',
      reasoning: '금이 부족하면 장수들의 충성도가 떨어지고, 병력 유지도 힘들어집니다.',
      actionable: { type: 'develop' }
    });
  }

  if (analysis.resources.foodStatus === 'critical') {
    advice.push({
      id: generateId(),
      category: 'urgent',
      priority: 'critical',
      title: '🌾 식량이 바닥났습니다!',
      description: '군량이 고갈되어 병사들이 굶주리고 있습니다.',
      reasoning: '식량 없이는 원정도, 방어도 불가능합니다. 즉시 농업 개발이 필요합니다.',
      actionable: { type: 'develop' }
    });
  }

  if (analysis.resources.troopsStatus === 'critical') {
    advice.push({
      id: generateId(),
      category: 'urgent',
      priority: 'critical',
      title: '⚔️ 병력이 부족합니다!',
      description: '전투를 치를 병력이 태부족합니다. 징병이 시급합니다.',
      reasoning: '병력이 부족하면 적의 침략을 막을 수 없습니다.',
      actionable: { type: 'recruit' }
    });
  }

  // 2. 임박한 위협
  const imminentThreats = analysis.threats.filter(t => t.threatLevel === 'imminent');
  for (const threat of imminentThreats) {
    advice.push({
      id: generateId(),
      category: 'urgent',
      priority: 'critical',
      title: `⚠️ ${getFactionName(state, threat.factionId)}의 위협!`,
      description: `${threat.borderRegions.map(r => getRegionName(r)).join(', ')}에 ${threat.enemyTroops.toLocaleString()} 병력이 집결해 있습니다.`,
      reasoning: '적의 병력이 압도적입니다. 방어 태세를 강화하거나 외교적 해결을 모색해야 합니다.',
      actionable: { type: 'defend', targetRegion: threat.borderRegions[0] }
    });
  }

  return advice;
}

// ============================================
// 군사 조언 생성
// ============================================

function generateMilitaryAdvice(state: GameState, analysis: SituationAnalysis): Advice[] {
  const advice: Advice[] = [];

  // 1. 공격 기회
  const topOpportunities = analysis.opportunities.slice(0, 3);
  for (const opp of topOpportunities) {
    const priority = opp.troops < 500 ? 'high' : opp.troops < 1500 ? 'medium' : 'low';
    advice.push({
      id: generateId(),
      category: 'military',
      priority,
      title: `⚔️ ${getRegionName(opp.regionId)} 공격 적기`,
      description: `${getFactionName(state, opp.owner)}의 ${getRegionName(opp.regionId)}가 ${opp.weakness}입니다. 병력 ${opp.troops.toLocaleString()}명.`,
      reasoning: `${getRegionName(opp.adjacentPlayerRegion)}에서 출진하면 유리한 전투가 가능합니다.`,
      actionable: { type: 'attack', targetRegion: opp.regionId }
    });
  }

  // 2. 훈련 필요
  const lowTraining = analysis.underdeveloped.filter(r => r.training < 40);
  if (lowTraining.length > 0) {
    advice.push({
      id: generateId(),
      category: 'military',
      priority: 'medium',
      title: '🏋️ 병사 훈련이 필요합니다',
      description: `${lowTraining.map(r => getRegionName(r.regionId)).join(', ')}의 훈련도가 낮습니다.`,
      reasoning: '훈련도가 낮으면 전투에서 피해가 커집니다. 정예병 양성이 필요합니다.',
      actionable: { type: 'train', targetRegion: lowTraining[0].regionId }
    });
  }

  return advice;
}

// ============================================
// 내정 조언 생성
// ============================================

function generateDomesticAdvice(state: GameState, analysis: SituationAnalysis): Advice[] {
  const advice: Advice[] = [];

  // 1. 농업 개발 필요
  const lowAgriculture = analysis.underdeveloped.filter(r => r.agriculture < 40);
  if (lowAgriculture.length > 0 && analysis.resources.foodStatus !== 'abundant') {
    advice.push({
      id: generateId(),
      category: 'domestic',
      priority: analysis.resources.foodStatus === 'low' ? 'high' : 'medium',
      title: '🌾 농업 개발이 필요합니다',
      description: `${lowAgriculture.slice(0, 2).map(r => getRegionName(r.regionId)).join(', ')}의 농업 개발도가 낮습니다.`,
      reasoning: '안정적인 식량 공급이 장기전의 기본입니다.',
      actionable: { type: 'develop', targetRegion: lowAgriculture[0].regionId }
    });
  }

  // 2. 상업 개발 필요
  const lowCommerce = analysis.underdeveloped.filter(r => r.commerce < 40);
  if (lowCommerce.length > 0 && analysis.resources.goldStatus !== 'abundant') {
    advice.push({
      id: generateId(),
      category: 'domestic',
      priority: analysis.resources.goldStatus === 'low' ? 'high' : 'medium',
      title: '💰 상업 개발이 필요합니다',
      description: `${lowCommerce.slice(0, 2).map(r => getRegionName(r.regionId)).join(', ')}의 상업 개발도가 낮습니다.`,
      reasoning: '금이 풍족해야 인재를 모으고 군비를 유지할 수 있습니다.',
      actionable: { type: 'develop', targetRegion: lowCommerce[0].regionId }
    });
  }

  // 3. 징병 권고
  if (analysis.resources.troopsStatus === 'low') {
    advice.push({
      id: generateId(),
      category: 'domestic',
      priority: 'high',
      title: '👥 징병이 필요합니다',
      description: '전쟁에 대비해 병력을 확충해야 합니다.',
      reasoning: '충분한 병력이 있어야 기회가 왔을 때 움직일 수 있습니다.',
      actionable: { type: 'recruit' }
    });
  }

  return advice;
}

// ============================================
// 인사 조언 생성
// ============================================

function generatePersonnelAdvice(state: GameState, analysis: SituationAnalysis): Advice[] {
  const advice: Advice[] = [];

  // 1. 재야 장수 등용 추천
  const topGenerals = analysis.availableGenerals.slice(0, 3);
  for (const gen of topGenerals) {
    const generalName = getGeneralName(gen.generalId);
    const priority = gen.value >= 300 ? 'high' : gen.value >= 250 ? 'medium' : 'low';
    
    advice.push({
      id: generateId(),
      category: 'personnel',
      priority,
      title: `👤 ${generalName} 등용을 권합니다`,
      description: `${getRegionName(gen.location)}에 ${generalName}이(가) 재야에 있습니다. 능력치 합계: ${gen.value}`,
      reasoning: gen.value >= 300 
        ? '천하의 명장입니다. 반드시 등용해야 합니다!'
        : '유능한 인재입니다. 등용을 고려해보십시오.',
      actionable: { type: 'recruit', targetGeneral: gen.generalId }
    });
  }

  // 2. 장수 부족 경고
  const playerRegions = Object.values(state.regions).filter(r => r.owner === state.playerFaction);
  const emptyRegions = playerRegions.filter(r => r.generals.length === 0);
  if (emptyRegions.length > 0) {
    advice.push({
      id: generateId(),
      category: 'personnel',
      priority: 'high',
      title: '⚠️ 장수 없는 지역이 있습니다',
      description: `${emptyRegions.map(r => getRegionName(r.id)).join(', ')}에 배치된 장수가 없습니다.`,
      reasoning: '장수가 없으면 내정도, 방어도 불가능합니다. 장수 배치가 시급합니다.',
      actionable: { type: 'other' }
    });
  }

  return advice;
}

// ============================================
// 전략 조언 생성
// ============================================

function generateStrategicAdvice(state: GameState, analysis: SituationAnalysis): Advice[] {
  const advice: Advice[] = [];

  // 1. 세력 순위 기반 조언
  const playerRank = analysis.factionStrength.findIndex(f => f.factionId === state.playerFaction) + 1;
  const totalFactions = analysis.factionStrength.length;
  
  if (playerRank === 1) {
    advice.push({
      id: generateId(),
      category: 'strategic',
      priority: 'medium',
      title: '👑 최강 세력의 자리에 있습니다',
      description: '현재 천하에서 가장 강한 세력입니다.',
      reasoning: '이 기세를 몰아 약한 세력부터 정복하여 천하통일을 이루십시오.'
    });
  } else if (playerRank > totalFactions / 2) {
    advice.push({
      id: generateId(),
      category: 'strategic',
      priority: 'high',
      title: '📊 세력 확장이 시급합니다',
      description: `현재 ${playerRank}위로 하위권입니다.`,
      reasoning: '내실을 다지면서 약한 이웃 세력을 병합해 영토를 넓혀야 합니다.'
    });
  }

  // 2. 최강 세력 견제 제안
  const strongestFaction = analysis.factionStrength[0];
  if (strongestFaction && strongestFaction.factionId !== state.playerFaction) {
    const factionName = getFactionName(state, strongestFaction.factionId);
    if (strongestFaction.totalTroops > analysis.factionStrength[1]?.totalTroops * 1.5) {
      advice.push({
        id: generateId(),
        category: 'strategic',
        priority: 'medium',
        title: `🎯 ${factionName}을 견제해야 합니다`,
        description: `${factionName}이 ${strongestFaction.totalRegions}개 지역을 지배하며 급성장 중입니다.`,
        reasoning: '지금 견제하지 않으면 나중에 대항하기 어려워집니다. 다른 세력과 연합을 고려하십시오.'
      });
    }
  }

  // 3. 턴 수 기반 조언
  if (state.turn <= 5) {
    advice.push({
      id: generateId(),
      category: 'strategic',
      priority: 'medium',
      title: '🌱 기반 다지기가 중요합니다',
      description: '아직 초반입니다. 성급한 확장보다 내실을 다지십시오.',
      reasoning: '농업과 상업을 발전시키고, 인재를 모으는 것이 먼저입니다.'
    });
  } else if (state.turn >= 20) {
    advice.push({
      id: generateId(),
      category: 'strategic',
      priority: 'medium',
      title: '⏰ 결단의 시간입니다',
      description: '충분히 힘을 길렀습니다. 천하 쟁패에 나설 때입니다.',
      reasoning: '더 이상 기다리면 다른 세력이 먼저 천하를 통일할 수 있습니다.'
    });
  }

  return advice;
}

// ============================================
// 메인 조언 생성 함수
// ============================================

export function generateAllAdvice(
  state: GameState,
  analysis: SituationAnalysis,
  strategist: Strategist
): Advice[] {
  let allAdvice: Advice[] = [];

  // 책사 특기에 따라 조언 가중치 부여
  const isSpecialist = (category: string) => 
    strategist.specialty.includes(category as any);

  // 각 카테고리 조언 수집
  const urgent = generateUrgentAdvice(state, analysis);
  const military = generateMilitaryAdvice(state, analysis);
  const domestic = generateDomesticAdvice(state, analysis);
  const personnel = generatePersonnelAdvice(state, analysis);
  const strategic = generateStrategicAdvice(state, analysis);

  // 긴급은 항상 포함
  allAdvice.push(...urgent);

  // 책사 특기에 따라 우선순위 조정
  const adjustPriority = (adviceList: Advice[], category: string): Advice[] => {
    return adviceList.map(a => ({
      ...a,
      // 특기 분야면 우선순위 한 단계 상승
      priority: isSpecialist(category) && a.priority !== 'critical' 
        ? (a.priority === 'medium' ? 'high' : a.priority === 'low' ? 'medium' : a.priority)
        : a.priority
    }));
  };

  allAdvice.push(...adjustPriority(military, 'military'));
  allAdvice.push(...adjustPriority(domestic, 'domestic'));
  allAdvice.push(...adjustPriority(personnel, 'personnel'));
  allAdvice.push(...adjustPriority(strategic, 'strategic'));

  // 우선순위로 정렬
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allAdvice.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // 최대 7개까지만 반환
  return allAdvice.slice(0, 7);
}
