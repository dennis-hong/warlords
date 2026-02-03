/**
 * AI 외교 의사결정 시스템
 * 
 * AI 세력이 상황을 분석하고 외교적 행동을 결정
 */

import type { 
  GameState, 
  FactionId, 
  DiplomaticRelationType,
  DiplomaticProposal,
  DiplomaticRelation,
  Region
} from '../types';

// 세력 분석 결과
interface FactionAnalysis {
  factionId: FactionId;
  totalTroops: number;
  totalRegions: number;
  totalGold: number;
  totalFood: number;
  powerRank: number;        // 세력 순위 (1 = 최강)
  threatLevel: number;      // 위협도 (0~100)
  borderingFactions: FactionId[];  // 접경 세력
  isAlive: boolean;
}

// AI 외교 성향
interface DiplomaticPersonality {
  aggressiveness: number;   // 공격성 (0~1)
  trustworthiness: number;  // 신뢰성 (0~1) - 배신 확률
  pragmatism: number;       // 실용주의 (0~1) - 이익 우선
}

// 세력별 AI 성향
const AI_PERSONALITIES: Partial<Record<FactionId, DiplomaticPersonality>> = {
  caocao: { aggressiveness: 0.8, trustworthiness: 0.4, pragmatism: 0.9 },     // 조조: 공격적, 실용적, 배신 잦음
  sunquan: { aggressiveness: 0.4, trustworthiness: 0.7, pragmatism: 0.7 },    // 손권: 수비적, 신뢰 높음
  liubei: { aggressiveness: 0.5, trustworthiness: 0.9, pragmatism: 0.5 },     // 유비: 균형, 의리 있음
  yuanshao: { aggressiveness: 0.6, trustworthiness: 0.5, pragmatism: 0.4 },   // 원소: 자존심 강함
  dongzhuo: { aggressiveness: 0.95, trustworthiness: 0.1, pragmatism: 0.3 },  // 동탁: 매우 공격적, 믿을 수 없음
  liubiao: { aggressiveness: 0.2, trustworthiness: 0.8, pragmatism: 0.6 },    // 유표: 소극적, 안정 추구
  liuzhang: { aggressiveness: 0.1, trustworthiness: 0.9, pragmatism: 0.4 },   // 유장: 매우 소극적
  gongsunzan: { aggressiveness: 0.7, trustworthiness: 0.6, pragmatism: 0.5 }, // 공손찬: 공격적
  rebels: { aggressiveness: 0.5, trustworthiness: 0.3, pragmatism: 0.5 },     // 황건적: 보통
};

// 기본 성향
const DEFAULT_PERSONALITY: DiplomaticPersonality = {
  aggressiveness: 0.5,
  trustworthiness: 0.5,
  pragmatism: 0.5
};

/**
 * 세력 분석
 */
export function analyzeFactions(gameState: GameState): FactionAnalysis[] {
  const factionStats: Record<string, {
    troops: number;
    regions: number;
    gold: number;
    food: number;
  }> = {};

  // 각 세력의 총 전력 계산
  Object.values(gameState.regions).forEach(region => {
    const owner = region.owner;
    if (!factionStats[owner]) {
      factionStats[owner] = { troops: 0, regions: 0, gold: 0, food: 0 };
    }
    factionStats[owner].troops += region.troops;
    factionStats[owner].regions += 1;
    factionStats[owner].gold += region.gold;
    factionStats[owner].food += region.food;
  });

  // 순위 계산 (병력 + 지역 수 기준)
  const factionPowers = Object.entries(factionStats)
    .map(([id, stats]) => ({
      id,
      power: stats.troops + stats.regions * 2000  // 지역당 2000점 가중치
    }))
    .sort((a, b) => b.power - a.power);

  const rankMap: Record<string, number> = {};
  factionPowers.forEach((f, idx) => { rankMap[f.id] = idx + 1; });

  // 접경 세력 계산
  const getBorderingFactions = (factionId: FactionId): FactionId[] => {
    const myRegions = Object.values(gameState.regions).filter(r => r.owner === factionId);
    const borderingSet = new Set<FactionId>();
    
    myRegions.forEach(region => {
      region.adjacent.forEach(adjId => {
        const adjRegion = gameState.regions[adjId];
        if (adjRegion && adjRegion.owner !== factionId) {
          borderingSet.add(adjRegion.owner);
        }
      });
    });
    
    return Array.from(borderingSet);
  };

  // 분석 결과 생성
  const analyses: FactionAnalysis[] = Object.entries(factionStats).map(([id, stats]) => {
    const factionId = id as FactionId;
    const borderingFactions = getBorderingFactions(factionId);
    
    // 위협도 계산 (접경 세력들의 총 병력 대비 내 병력)
    const borderingTroops = borderingFactions.reduce((sum, borderId) => {
      return sum + (factionStats[borderId]?.troops || 0);
    }, 0);
    const threatLevel = borderingTroops > 0 
      ? Math.min(100, Math.round((borderingTroops / Math.max(stats.troops, 1)) * 50))
      : 0;

    return {
      factionId,
      totalTroops: stats.troops,
      totalRegions: stats.regions,
      totalGold: stats.gold,
      totalFood: stats.food,
      powerRank: rankMap[id] || 99,
      threatLevel,
      borderingFactions,
      isAlive: stats.regions > 0
    };
  });

  return analyses;
}

/**
 * 두 세력 간 현재 관계 확인
 */
export function getRelationBetween(
  relations: DiplomaticRelation[],
  faction1: FactionId,
  faction2: FactionId
): DiplomaticRelationType {
  const relation = relations.find(r =>
    (r.faction1 === faction1 && r.faction2 === faction2) ||
    (r.faction1 === faction2 && r.faction2 === faction1)
  );
  return relation?.type || 'neutral';
}

/**
 * AI가 제안을 수락할지 결정
 */
export function shouldAcceptProposal(
  gameState: GameState,
  proposal: DiplomaticProposal,
  analyses: FactionAnalysis[]
): { accept: boolean; reason: string } {
  const aiAnalysis = analyses.find(a => a.factionId === proposal.to);
  const proposerAnalysis = analyses.find(a => a.factionId === proposal.from);
  
  if (!aiAnalysis || !proposerAnalysis) {
    return { accept: false, reason: '세력 정보 없음' };
  }

  const personality = AI_PERSONALITIES[proposal.to] || DEFAULT_PERSONALITY;

  // 동맹 제안 평가
  if (proposal.type === 'alliance') {
    // 약한 세력은 강한 세력과 동맹 원함
    if (aiAnalysis.powerRank > proposerAnalysis.powerRank) {
      // 제안자가 더 강함 → 수락 확률 높음
      const acceptChance = 0.7 + (1 - personality.aggressiveness) * 0.3;
      if (Math.random() < acceptChance) {
        return { accept: true, reason: '강한 세력과의 동맹 필요' };
      }
    }
    
    // 공통 적이 있으면 수락 확률 증가
    const hasCommonEnemy = aiAnalysis.borderingFactions.some(f => 
      proposerAnalysis.borderingFactions.includes(f) &&
      getRelationBetween(gameState.diplomaticRelations, proposal.to, f) === 'hostile'
    );
    if (hasCommonEnemy && Math.random() < 0.8) {
      return { accept: true, reason: '공동의 적에 맞서기 위함' };
    }

    // 위협 받고 있으면 수락 확률 증가
    if (aiAnalysis.threatLevel > 60 && Math.random() < 0.6) {
      return { accept: true, reason: '외부 위협에 대응' };
    }

    // 공격적인 성향이면 거절
    if (personality.aggressiveness > 0.7 && Math.random() < personality.aggressiveness) {
      return { accept: false, reason: '독자 행동 선호' };
    }

    // 기본 50% 확률
    return Math.random() < 0.5 
      ? { accept: true, reason: '협력 가치 인정' }
      : { accept: false, reason: '신뢰 부족' };
  }

  // 불가침 제안 평가
  if (proposal.type === 'truce') {
    // 현재 전쟁 중이면 휴전 고려
    const currentRelation = getRelationBetween(
      gameState.diplomaticRelations, 
      proposal.from, 
      proposal.to
    );
    
    if (currentRelation === 'hostile') {
      // 전쟁 중인데 지고 있으면 수락 확률 높음
      if (aiAnalysis.totalTroops < proposerAnalysis.totalTroops * 0.8) {
        return { accept: true, reason: '전력 열세로 휴전 필요' };
      }
      // 공격적 성향이면 거절
      if (personality.aggressiveness > 0.6) {
        return { accept: false, reason: '전쟁 계속 원함' };
      }
    }

    // 다른 전선에 집중하고 싶으면 수락
    if (aiAnalysis.borderingFactions.length > 2 && Math.random() < 0.6) {
      return { accept: true, reason: '다른 전선에 집중' };
    }

    // 실용적인 성향이면 수락
    if (personality.pragmatism > 0.6 && Math.random() < personality.pragmatism) {
      return { accept: true, reason: '실리 추구' };
    }

    return Math.random() < 0.4 
      ? { accept: true, reason: '평화 유지' }
      : { accept: false, reason: '경계 유지' };
  }

  return { accept: false, reason: '알 수 없는 제안' };
}

/**
 * AI 세력의 외교 행동 결정
 */
export function decideAIDiplomacy(
  gameState: GameState,
  aiFaction: FactionId,
  analyses: FactionAnalysis[]
): DiplomaticProposal | null {
  const aiAnalysis = analyses.find(a => a.factionId === aiFaction);
  if (!aiAnalysis || !aiAnalysis.isAlive) return null;

  const personality = AI_PERSONALITIES[aiFaction] || DEFAULT_PERSONALITY;

  // 플레이어 세력과 현재 관계
  const playerRelation = getRelationBetween(
    gameState.diplomaticRelations,
    aiFaction,
    gameState.playerFaction
  );

  // 이미 동맹이거나 전쟁 중이면 새 제안 안 함
  if (playerRelation === 'alliance' || playerRelation === 'truce') {
    return null;
  }

  // 플레이어 분석
  const playerAnalysis = analyses.find(a => a.factionId === gameState.playerFaction);
  if (!playerAnalysis) return null;

  // 외교 제안 확률 계산
  const makeProposalChance = (1 - personality.aggressiveness) * 0.3;  // 기본 확률

  // 위협 수준이 높으면 동맹 제안 확률 증가
  let allianceChance = makeProposalChance;
  if (aiAnalysis.threatLevel > 50) {
    allianceChance += 0.2;
  }
  if (aiAnalysis.powerRank > playerAnalysis.powerRank) {
    // 플레이어가 더 강하면 동맹 제안
    allianceChance += 0.1;
  }

  // 접경하지 않으면 불가침 제안
  const isBordering = aiAnalysis.borderingFactions.includes(gameState.playerFaction);
  
  if (!isBordering) {
    // 접경 안 하면 외교 제안 안 함 (의미 없음)
    return null;
  }

  // 전쟁 중이면 휴전 제안 가능성
  if (playerRelation === 'hostile') {
    // 지고 있으면 휴전 제안
    if (aiAnalysis.totalTroops < playerAnalysis.totalTroops * 0.7) {
      if (Math.random() < 0.3 + (1 - personality.aggressiveness) * 0.3) {
        return {
          id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          from: aiFaction,
          to: gameState.playerFaction,
          type: 'truce',
          proposedTurn: gameState.turn,
          duration: 5,  // 5턴간 불가침
          status: 'pending'
        };
      }
    }
    return null;
  }

  // 동맹 또는 불가침 제안
  if (Math.random() < allianceChance) {
    // 신뢰성 높으면 동맹 제안, 낮으면 불가침
    const proposeAlliance = personality.trustworthiness > 0.5 && Math.random() < 0.4;
    
    return {
      id: `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from: aiFaction,
      to: gameState.playerFaction,
      type: proposeAlliance ? 'alliance' : 'truce',
      proposedTurn: gameState.turn,
      duration: proposeAlliance ? undefined : 5,
      status: 'pending'
    };
  }

  // 공격적인 성향이면 선전포고 고려
  if (playerRelation === 'neutral' && 
      personality.aggressiveness > 0.7 &&
      aiAnalysis.totalTroops > playerAnalysis.totalTroops * 1.5) {
    // 충분히 강하면 전쟁 시작 (제안이 아닌 직접 행동)
    // 이건 별도 함수에서 처리
  }

  return null;
}

/**
 * AI끼리의 외교 행동 (백그라운드)
 */
export function processAItoAIDiplomacy(
  gameState: GameState,
  analyses: FactionAnalysis[]
): DiplomaticRelation[] {
  const newRelations: DiplomaticRelation[] = [];
  
  // 생존 AI 세력
  const aiFactions = analyses
    .filter(a => a.isAlive && a.factionId !== gameState.playerFaction && a.factionId !== 'player')
    .map(a => a.factionId);

  for (const ai1 of aiFactions) {
    for (const ai2 of aiFactions) {
      if (ai1 >= ai2) continue;  // 중복 방지

      const currentRelation = getRelationBetween(gameState.diplomaticRelations, ai1, ai2);
      
      // 이미 관계가 있으면 스킵
      if (currentRelation !== 'neutral') continue;

      // 접경하는지 확인
      const ai1Analysis = analyses.find(a => a.factionId === ai1);
      if (!ai1Analysis?.borderingFactions.includes(ai2)) continue;

      // 5% 확률로 불가침 체결
      if (Math.random() < 0.05) {
        newRelations.push({
          faction1: ai1,
          faction2: ai2,
          type: 'truce',
          startTurn: gameState.turn,
          duration: 5
        });
      }
      // 2% 확률로 동맹 체결
      else if (Math.random() < 0.02) {
        newRelations.push({
          faction1: ai1,
          faction2: ai2,
          type: 'alliance',
          startTurn: gameState.turn
        });
      }
    }
  }

  return newRelations;
}

/**
 * AI 선전포고 결정
 */
export function decideAIWarDeclaration(
  gameState: GameState,
  aiFaction: FactionId,
  analyses: FactionAnalysis[]
): FactionId | null {
  const aiAnalysis = analyses.find(a => a.factionId === aiFaction);
  if (!aiAnalysis || !aiAnalysis.isAlive) return null;

  const personality = AI_PERSONALITIES[aiFaction] || DEFAULT_PERSONALITY;

  // 공격성 낮으면 전쟁 안 함
  if (personality.aggressiveness < 0.3) return null;

  // 접경 세력 중 공격 대상 찾기
  for (const targetFaction of aiAnalysis.borderingFactions) {
    const currentRelation = getRelationBetween(
      gameState.diplomaticRelations,
      aiFaction,
      targetFaction
    );

    // 이미 전쟁 중이거나 동맹/불가침이면 스킵
    if (currentRelation !== 'neutral') continue;

    const targetAnalysis = analyses.find(a => a.factionId === targetFaction);
    if (!targetAnalysis) continue;

    // 병력이 충분히 많으면 공격
    const powerRatio = aiAnalysis.totalTroops / Math.max(targetAnalysis.totalTroops, 1);
    const attackThreshold = 1.3 + (1 - personality.aggressiveness) * 0.5;

    if (powerRatio > attackThreshold && Math.random() < personality.aggressiveness * 0.3) {
      return targetFaction;
    }
  }

  return null;
}

/**
 * 외교 제안 메시지 생성
 */
export function getProposalMessage(proposal: DiplomaticProposal, factionName: string): string {
  switch (proposal.type) {
    case 'alliance':
      return `🤝 ${factionName}에서 동맹을 제안합니다!\n"함께 천하를 도모하지 않겠소?"`;
    case 'truce':
      return `🕊️ ${factionName}에서 불가침 조약을 제안합니다.\n"서로의 영토를 존중하고 평화를 유지합시다."`;
    case 'tribute':
      return `💰 ${factionName}에서 조공을 제안합니다.`;
    default:
      return `${factionName}에서 외교 제안이 왔습니다.`;
  }
}

/**
 * 외교 결과 메시지 생성
 */
export function getDiplomacyResultMessage(
  type: DiplomaticRelationType,
  faction1Name: string,
  faction2Name: string,
  isAccepted: boolean
): string {
  if (!isAccepted) {
    return `❌ ${faction2Name}이(가) 제안을 거절했습니다.`;
  }

  switch (type) {
    case 'alliance':
      return `🤝 ${faction1Name}와 ${faction2Name}이 동맹을 맺었습니다!`;
    case 'truce':
      return `🕊️ ${faction1Name}와 ${faction2Name}이 불가침 조약을 체결했습니다.`;
    case 'hostile':
      return `⚔️ ${faction1Name}이(가) ${faction2Name}에 선전포고했습니다!`;
    default:
      return `외교 관계가 변경되었습니다.`;
  }
}
