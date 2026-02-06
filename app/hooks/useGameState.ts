'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  GameState, RegionId, DomesticAction, Region,
  MarchState, MarchStep, MarchUnit, BattleInitData, BattleOutcome, TroopType,
  Prisoner, FreeGeneral, GeneralFate, FactionId, GamePhase,
  HistoricalEvent, EventTrigger, EventChoice, EventEffect, EventCondition,
  BattleResultData, DiplomaticProposal, DiplomaticRelation, DiplomaticRelationType
} from '../types';
import { REGIONS, FACTIONS, DOMESTIC_COMMANDS, FACTION_DETAILS } from '../constants/worldData';
import { GENERALS, INITIAL_FREE_GENERALS, INITIAL_LOYALTY, UNAFFILIATED_GENERALS } from '../constants/gameData';
import { HISTORICAL_EVENTS, CUSTOM_CONDITION_CHECKS } from '../constants/events';
import { attemptRecruit, getInitialLoyalty } from '../utils/battle';
import {
  analyzeFactions,
  decideAIDiplomacy,
  shouldAcceptProposal,
  processAItoAIDiplomacy,
  decideAIWarDeclaration,
  getProposalMessage,
  getDiplomacyResultMessage,
  getRelationBetween
} from '../utils/aiDiplomacy';
import { processAllAITurns, processAIIncome, type AITurnLog } from '../utils/aiFaction';

// 세력 선택에 따른 초기 상태 생성
const createInitialState = (selectedFaction: FactionId = 'player'): GameState => {
  // 지역 데이터 깊은 복사
  const regions = JSON.parse(JSON.stringify(REGIONS));
  
  // 선택한 세력의 지역들을 'player'로 변경
  Object.keys(regions).forEach(key => {
    const regionId = key as RegionId;
    if (regions[regionId].owner === selectedFaction) {
      regions[regionId].owner = 'player';
    }
  });

  return {
    turn: 1,
    season: 'spring',
    year: 190,
    playerFaction: 'player',
    selectedFaction: selectedFaction,  // 원래 선택한 세력 저장 (이벤트 조건용)
    regions,
    factions: FACTIONS,
    selectedRegion: null,
    actionsRemaining: 3,
    maxActions: 3,
    phase: 'map',
    march: null,
    battleData: null,
    battleResult: null,
    // 장수 시스템
    prisoners: [],
    freeGenerals: JSON.parse(JSON.stringify(INITIAL_FREE_GENERALS)),
    deadGenerals: [],
    generalLoyalty: { ...INITIAL_LOYALTY },
    // 이벤트 시스템
    triggeredEvents: [],
    activeEvent: null,
    battleBonuses: {},
    moraleBonus: 0,
    // 외교 시스템
    diplomaticRelations: [],
    diplomaticProposals: [],
    // AI 턴 로그
    aiTurnLogs: [],
    // 게임 오버
    gameOver: null
  };
};

// 초기 출진 상태
const createInitialMarch = (): MarchState => ({
  step: 'target',
  targetRegion: null,
  units: [],
  foodRequired: 0
});

export function useGameState() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [gamePhase, setGamePhase] = useState<GamePhase>('title');
  const [hasSaveData, setHasSaveData] = useState(false);

  // 클라이언트 초기화 - 타이틀 화면에서 시작
  useEffect(() => {
    setIsClient(true);
    // 저장된 게임 확인만 (로드하지 않음)
    const saved = localStorage.getItem('warlords_save');
    setHasSaveData(!!saved);
  }, []);

  // 게임 상태 변경 시 저장 (playing 상태일 때만)
  useEffect(() => {
    if (game && isClient && gamePhase === 'playing') {
      localStorage.setItem('warlords_save', JSON.stringify(game));
    }
  }, [game, isClient, gamePhase]);

  // 새 게임 시작 (세력 선택 화면으로)
  const startNewGame = useCallback(() => {
    setGamePhase('faction_select');
  }, []);

  // 세력 선택 완료 후 게임 시작
  const selectFactionAndStart = useCallback((factionId: FactionId) => {
    let initial = createInitialState(factionId);
    
    // 게임 시작 이벤트 체크
    const startEvent = HISTORICAL_EVENTS
      .filter(event => {
        if (event.trigger !== 'game_start') return false;
        // 세력 조건 체크
        return event.conditions.every(cond => {
          if (cond.type === 'faction') return cond.factionId === factionId;
          return true;
        });
      })
      .sort((a, b) => b.priority - a.priority)[0];
    
    if (startEvent) {
      initial = { ...initial, activeEvent: startEvent };
    }
    
    setGame(initial);
    setGamePhase('playing');
    localStorage.setItem('warlords_save', JSON.stringify(initial));
    setHasSaveData(true);
  }, []);

  // 이어하기
  const continueGame = useCallback(() => {
    const saved = localStorage.getItem('warlords_save');
    if (saved) {
      try {
        setGame(JSON.parse(saved));
        setGamePhase('playing');
      } catch {
        alert('저장된 게임을 불러오는데 실패했습니다.');
      }
    }
  }, []);

  // 타이틀로 돌아가기
  const backToTitle = useCallback(() => {
    setGamePhase('title');
  }, []);

  // 플레이어 소유 지역 목록
  const playerRegions = game 
    ? Object.values(game.regions).filter(r => r.owner === game.playerFaction)
    : [];

  // 전체 자원 합계
  const totalResources = playerRegions.reduce(
    (acc, r) => ({
      gold: acc.gold + r.gold,
      food: acc.food + r.food,
      population: acc.population + r.population,
      troops: acc.troops + r.troops
    }),
    { gold: 0, food: 0, population: 0, troops: 0 }
  );

  // 지역 선택
  const selectRegion = useCallback((regionId: RegionId | null) => {
    setGame(prev => prev ? { ...prev, selectedRegion: regionId } : null);
  }, []);

  // 내정 명령 실행
  const executeDomestic = useCallback((regionId: RegionId, action: DomesticAction) => {
    if (!game || game.actionsRemaining <= 0) return false;

    const region = game.regions[regionId];
    if (!region || region.owner !== game.playerFaction) return false;

    const command = DOMESTIC_COMMANDS.find(c => c.id === action);
    if (!command) return false;

    // 비용 확인
    const cost = command.cost;
    if ((cost.gold || 0) > region.gold) return false;
    if ((cost.food || 0) > region.food) return false;
    if ((cost.population || 0) > region.population) return false;

    // 담당 장수 찾기 (가장 능력치 높은 장수)
    const assignedGeneral = region.generals
      .map(id => GENERALS[id])
      .filter(Boolean)
      .sort((a, b) => (b?.[command.statRequired] || 0) - (a?.[command.statRequired] || 0))[0];

    const bonus = assignedGeneral ? assignedGeneral[command.statRequired] / 100 : 0.5;

    setGame(prev => {
      if (!prev) return null;

      const newRegion: Region = { ...prev.regions[regionId] };

      // 비용 차감
      newRegion.gold -= cost.gold || 0;
      newRegion.food -= cost.food || 0;
      newRegion.population -= cost.population || 0;

      // 효과 적용
      switch (action) {
        case 'develop_farm':
          newRegion.agriculture = Math.min(100, newRegion.agriculture + 5 * (1 + bonus));
          break;
        case 'develop_commerce':
          newRegion.commerce = Math.min(100, newRegion.commerce + 5 * (1 + bonus));
          break;
        case 'recruit':
          const recruited = Math.floor(1000 * (1 + bonus));
          newRegion.troops += recruited;
          break;
        case 'train':
          // 훈련도 증가 (최대 100)
          const trainingIncrease = Math.floor(5 * (1 + bonus));
          newRegion.training = Math.min(100, (newRegion.training || 50) + trainingIncrease);
          break;
      }

      return {
        ...prev,
        regions: {
          ...prev.regions,
          [regionId]: newRegion
        },
        actionsRemaining: prev.actionsRemaining - 1
      };
    });

    return true;
  }, [game]);

  // 턴 종료
  const endTurn = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;

      // 계절 진행
      const seasonOrder: GameState['season'][] = ['spring', 'summer', 'fall', 'winter'];
      const currentIdx = seasonOrder.indexOf(prev.season);
      const nextSeason = seasonOrder[(currentIdx + 1) % 4];
      const nextYear = nextSeason === 'spring' ? prev.year + 1 : prev.year;

      // 수입 계산 (각 지역별)
      const newRegions = { ...prev.regions };
      Object.keys(newRegions).forEach(key => {
        const regionId = key as RegionId;
        const region = newRegions[regionId];
        
        // 플레이어 영토만 수입 처리
        if (region.owner === prev.playerFaction) {
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
        }
      });

      // 새로운 상태 (턴 이벤트 체크용)
      const newTurn = prev.turn + 1;
      let newState: GameState = {
        ...prev,
        turn: newTurn,
        season: nextSeason,
        year: nextYear,
        regions: newRegions,
        actionsRemaining: prev.maxActions,
        selectedRegion: null
      };

      // ============================================
      // AI 외교 처리
      // ============================================
      const analyses = analyzeFactions(newState);
      
      // 1. 외교 관계 만료 처리
      const updatedRelations = newState.diplomaticRelations.filter(r => {
        if (r.duration && r.startTurn) {
          const elapsed = newTurn - r.startTurn;
          return elapsed < r.duration;  // 아직 유효
        }
        return true;  // 기간 제한 없는 관계는 유지
      });
      newState = { ...newState, diplomaticRelations: updatedRelations };

      // 2. AI 세력들의 외교 행동
      const aiFactions = analyses
        .filter(a => a.isAlive && a.factionId !== newState.playerFaction && a.factionId !== 'player')
        .map(a => a.factionId);

      const newProposals: DiplomaticProposal[] = [...newState.diplomaticProposals];
      let aiRelationChanges: DiplomaticRelation[] = [];

      for (const aiFaction of aiFactions) {
        // AI가 플레이어에게 외교 제안
        const proposal = decideAIDiplomacy(newState, aiFaction, analyses);
        if (proposal) {
          newProposals.push(proposal);
        }

        // AI 선전포고 결정
        const warTarget = decideAIWarDeclaration(newState, aiFaction, analyses);
        if (warTarget) {
          // 기존 관계 제거하고 적대 관계 추가
          newState = {
            ...newState,
            diplomaticRelations: [
              ...newState.diplomaticRelations.filter(r =>
                !((r.faction1 === aiFaction && r.faction2 === warTarget) ||
                  (r.faction1 === warTarget && r.faction2 === aiFaction))
              ),
              {
                faction1: aiFaction,
                faction2: warTarget,
                type: 'hostile',
                startTurn: newTurn
              }
            ]
          };
        }
      }

      // 3. AI끼리의 외교 (백그라운드)
      const aiToAiRelations = processAItoAIDiplomacy(newState, analyses);
      aiRelationChanges = [...aiRelationChanges, ...aiToAiRelations];

      newState = {
        ...newState,
        diplomaticProposals: newProposals,
        diplomaticRelations: [...newState.diplomaticRelations, ...aiRelationChanges]
      };

      // ============================================
      // AI 세력 턴 처리
      // ============================================
      
      // AI 수입 처리
      newState = processAIIncome(newState);
      
      // AI 행동 처리 (내정, 군사)
      const { newState: stateAfterAI, logs: aiLogs } = processAllAITurns(newState);
      newState = stateAfterAI;
      
      // AI 턴 로그 저장
      newState = { ...newState, aiTurnLogs: aiLogs };

      // ============================================
      // 게임 오버 체크
      // ============================================
      const playerRegionCount = Object.values(newState.regions)
        .filter(r => r.owner === newState.playerFaction).length;
      const totalRegions = Object.keys(newState.regions).length;

      // 패배: 모든 영토 상실
      if (playerRegionCount === 0) {
        newState = {
          ...newState,
          gameOver: {
            result: 'defeat',
            message: '모든 영토를 잃었습니다...',
            turn: newTurn,
            year: nextYear
          }
        };
      }
      // 승리: 모든 영토 점령
      else if (playerRegionCount === totalRegions) {
        newState = {
          ...newState,
          gameOver: {
            result: 'victory',
            message: '천하를 통일했습니다!',
            turn: newTurn,
            year: nextYear
          }
        };
      }

      // 턴 시작 이벤트 체크 (인라인)
      const checkCondition = (condition: EventCondition, state: GameState): boolean => {
        switch (condition.type) {
          case 'faction':
            return state.selectedFaction === condition.factionId;
          case 'turn':
            return state.turn === condition.turn;
          case 'turnMin':
            return condition.turnMin !== undefined && state.turn >= condition.turnMin;
          case 'turnMax':
            return condition.turnMax !== undefined && state.turn <= condition.turnMax;
          case 'general_free':
            if (!condition.generalId) return false;
            return state.freeGenerals.some(fg => fg.generalId === condition.generalId);
          case 'has_general':
            if (!condition.generalId) return false;
            return Object.values(state.regions).some(
              region => region.owner === state.playerFaction &&
                        region.generals.includes(condition.generalId!)
            );
          case 'region_owner':
            if (!condition.regionId) return false;
            return state.regions[condition.regionId]?.owner === state.playerFaction;
          case 'custom':
            if (!condition.customCheck) return false;
            const customFn = CUSTOM_CONDITION_CHECKS[condition.customCheck];
            return customFn ? customFn(state) : false;
          default:
            return true;
        }
      };

      // turn_start 이벤트 찾기
      const turnEvent = HISTORICAL_EVENTS
        .filter(event => {
          if (event.trigger !== 'turn_start') return false;
          if (!event.isRepeatable && newState.triggeredEvents.includes(event.id)) return false;
          return event.conditions.every(cond => checkCondition(cond, newState));
        })
        .sort((a, b) => b.priority - a.priority)[0];

      if (turnEvent) {
        return { ...newState, activeEvent: turnEvent };
      }

      return newState;
    });
  }, []);

  // 새 게임 (타이틀에서 호출 - 세력 선택 화면으로)
  const newGame = useCallback(() => {
    setGamePhase('faction_select');
  }, []);

  // 화면 전환
  const setPhase = useCallback((phase: GameState['phase']) => {
    setGame(prev => prev ? { ...prev, phase } : null);
  }, []);

  // ============================================
  // 출진 시스템
  // ============================================

  // 출진 시작
  const startMarch = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        march: createInitialMarch(),
        phase: 'military'
      };
    });
  }, []);

  // 출진 취소
  const cancelMarch = useCallback(() => {
    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        march: null,
        phase: 'map'
      };
    });
  }, []);

  // 출진 대상 지역 선택
  const selectMarchTarget = useCallback((targetRegion: RegionId) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;
      return {
        ...prev,
        march: {
          ...prev.march,
          targetRegion,
          step: 'generals'
        }
      };
    });
  }, []);

  // 출진 단계 이동
  const setMarchStep = useCallback((step: MarchStep) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;
      return {
        ...prev,
        march: { ...prev.march, step }
      };
    });
  }, []);

  // 장수 선택/해제
  const toggleMarchGeneral = useCallback((generalId: string, isCommander: boolean = false) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;

      const existingIndex = prev.march.units.findIndex(u => u.generalId === generalId);
      let newUnits: MarchUnit[];

      if (existingIndex >= 0) {
        // 이미 선택된 장수 -> 제거
        newUnits = prev.march.units.filter(u => u.generalId !== generalId);
        // 주장이 제거되면 첫 번째 장수를 주장으로
        if (prev.march.units[existingIndex].isCommander && newUnits.length > 0) {
          newUnits[0].isCommander = true;
        }
      } else {
        // 새 장수 추가 (최대 3명)
        if (prev.march.units.length >= 3) return prev;

        const newUnit: MarchUnit = {
          generalId,
          troops: 0,
          troopType: 'infantry',
          isCommander: prev.march.units.length === 0 || isCommander
        };

        // 주장으로 지정하면 기존 주장 해제
        if (isCommander) {
          newUnits = prev.march.units.map(u => ({ ...u, isCommander: false }));
          newUnits.push(newUnit);
        } else {
          newUnits = [...prev.march.units, newUnit];
        }
      }

      return {
        ...prev,
        march: { ...prev.march, units: newUnits }
      };
    });
  }, []);

  // 주장 지정
  const setCommander = useCallback((generalId: string) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;
      const newUnits = prev.march.units.map(u => ({
        ...u,
        isCommander: u.generalId === generalId
      }));
      return {
        ...prev,
        march: { ...prev.march, units: newUnits }
      };
    });
  }, []);

  // 병력 배분
  const assignTroops = useCallback((generalId: string, troops: number, troopType: TroopType) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;

      const newUnits = prev.march.units.map(u =>
        u.generalId === generalId ? { ...u, troops, troopType } : u
      );

      // 필요 식량 계산 (거리 × 총 병력 × 0.1)
      const totalTroops = newUnits.reduce((sum, u) => sum + u.troops, 0);
      const foodRequired = Math.ceil(totalTroops * 0.2); // 간단히 20%로

      return {
        ...prev,
        march: { ...prev.march, units: newUnits, foodRequired }
      };
    });
  }, []);

  // 병력 일괄 배분 (통합 분배용)
  const assignTroopsBatch = useCallback((assignments: { generalId: string; troops: number }[]) => {
    setGame(prev => {
      if (!prev || !prev.march) return prev;

      const newUnits = prev.march.units.map(u => {
        const assignment = assignments.find(a => a.generalId === u.generalId);
        return assignment ? { ...u, troops: assignment.troops } : u;
      });

      const totalTroops = newUnits.reduce((sum, u) => sum + u.troops, 0);
      const foodRequired = Math.ceil(totalTroops * 0.2);

      return {
        ...prev,
        march: { ...prev.march, units: newUnits, foodRequired }
      };
    });
  }, []);

  // 출진 확정 -> 전투 시작
  const confirmMarch = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.march || !prev.march.targetRegion) return prev;
      if (prev.march.units.length === 0) return prev;

      const targetRegion = prev.regions[prev.march.targetRegion];
      if (!targetRegion) return prev;

      // 플레이어 영토 목록 (prev에서 직접 계산)
      const currentPlayerRegions = Object.values(prev.regions).filter(r => r.owner === prev.playerFaction);

      // 식량 체크 & 차감 (출발 지역에서)
      // selectedRegion이 플레이어 영토인 경우 사용, 아니면 첫 번째 영토
      let sourceRegion = prev.selectedRegion && prev.regions[prev.selectedRegion]?.owner === prev.playerFaction
        ? prev.regions[prev.selectedRegion]
        : currentPlayerRegions[0];

      if (!sourceRegion || sourceRegion.food < prev.march.foodRequired) {
        return prev; // 식량 부족
      }

      // 병종 비용 계산 (기병 500금, 궁병 300금)
      const TROOP_COSTS: Record<string, number> = {
        infantry: 0,
        cavalry: 500,
        archer: 300
      };
      const goldRequired = prev.march.units.reduce((sum, unit) => {
        return sum + (TROOP_COSTS[unit.troopType] || 0);
      }, 0);

      if (sourceRegion.gold < goldRequired) {
        return prev; // 금 부족
      }

      // 병력 차감 체크
      const totalMarchTroops = prev.march.units.reduce((sum, u) => sum + u.troops, 0);
      if (sourceRegion.troops < totalMarchTroops) {
        return prev; // 병력 부족
      }

      // 전투 데이터 생성
      const battleData: BattleInitData = {
        playerUnits: prev.march.units,
        playerRegionId: sourceRegion.id,
        enemyRegionId: prev.march.targetRegion,
        enemyGeneralIds: targetRegion.generals,
        enemyTroops: targetRegion.troops,
        playerTraining: sourceRegion.training || 50,
        enemyTraining: targetRegion.training || 50
      };

      // 출발 지역에서 병력 & 식량 & 금 차감
      const newRegions = {
        ...prev.regions,
        [sourceRegion.id]: {
          ...sourceRegion,
          troops: sourceRegion.troops - totalMarchTroops,
          food: sourceRegion.food - prev.march.foodRequired,
          gold: sourceRegion.gold - goldRequired
        }
      };

      // 새로운 상태 (전투 이벤트 체크용)
      const newState: GameState = {
        ...prev,
        regions: newRegions,
        battleData,
        phase: 'battle',
        march: null
      };

      // 전투 시작 이벤트 체크 (인라인)
      const checkBattleCondition = (condition: EventCondition, state: GameState): boolean => {
        switch (condition.type) {
          case 'faction':
            return state.selectedFaction === condition.factionId;
          case 'has_general':
            if (!condition.generalId) return false;
            // 출진 중인 장수 체크
            return state.battleData?.playerUnits.some(u => u.generalId === condition.generalId) || false;
          case 'troops_ratio':
            // 아군이 적의 일정 비율 이하인지 체크
            if (!state.battleData || !condition.ratio) return false;
            const playerTroops = state.battleData.playerUnits.reduce((sum, u) => sum + u.troops, 0);
            const enemyTroops = state.battleData.enemyTroops;
            return (playerTroops / enemyTroops) <= condition.ratio;
          case 'custom':
            if (!condition.customCheck) return false;
            const battleCustomFn = CUSTOM_CONDITION_CHECKS[condition.customCheck];
            return battleCustomFn ? battleCustomFn(state) : false;
          default:
            return true;
        }
      };

      // battle_start 이벤트 찾기
      const battleEvent = HISTORICAL_EVENTS
        .filter(event => {
          if (event.trigger !== 'battle_start') return false;
          if (!event.isRepeatable && newState.triggeredEvents.includes(event.id)) return false;
          return event.conditions.every(cond => checkBattleCondition(cond, newState));
        })
        .sort((a, b) => b.priority - a.priority)[0];

      if (battleEvent) {
        return { ...newState, activeEvent: battleEvent };
      }

      return newState;
    });
  }, []);

  // 전투 종료 처리
  const handleBattleEnd = useCallback((outcome: BattleOutcome) => {
    setGame(prev => {
      if (!prev || !prev.battleData) return prev;

      const { playerRegionId, enemyRegionId, playerUnits } = prev.battleData;
      const newRegions = { ...prev.regions };
      let newPrisoners = [...prev.prisoners];
      let newDeadGenerals = [...prev.deadGenerals];
      const newLoyalty = { ...prev.generalLoyalty };

      // 장수 운명 처리
      const processGeneralFates = (fates: GeneralFate[], isPlayer: boolean) => {
        fates.forEach(fate => {
          switch (fate.fate) {
            case 'dead':
              newDeadGenerals.push(fate.generalId);
              break;
            case 'captured':
              newPrisoners.push({
                generalId: fate.generalId,
                capturedTurn: prev.turn,
                capturedBy: isPlayer ? prev.playerFaction : newRegions[enemyRegionId].owner,
                location: isPlayer ? enemyRegionId : playerRegionId
              });
              break;
          }
        });
      };

      // 플레이어 장수 운명 처리
      if (outcome.playerGeneralFates) {
        processGeneralFates(outcome.playerGeneralFates, true);
      }

      // 적 장수 운명 처리
      if (outcome.enemyGeneralFates) {
        processGeneralFates(outcome.enemyGeneralFates, false);
      }

      // 사망/포로된 장수 목록
      const removedPlayerGenerals = outcome.playerGeneralFates
        ?.filter(f => f.fate === 'dead' || f.fate === 'captured')
        .map(f => f.generalId) || [];
      
      const removedEnemyGenerals = outcome.enemyGeneralFates
        ?.filter(f => f.fate === 'dead' || f.fate === 'captured')
        .map(f => f.generalId) || [];

      // 남은 플레이어 병력 계산
      const totalPlayerTroops = playerUnits.reduce((sum, u) => sum + u.troops, 0);
      const survivingTroops = totalPlayerTroops - outcome.playerTroopsLost;

      // 생존한 플레이어 장수
      const survivingPlayerGenerals = playerUnits
        .map(u => u.generalId)
        .filter(id => !removedPlayerGenerals.includes(id));

      if (outcome.winner === 'player') {
        // 승리: 적 영토 점령
        const targetRegion = newRegions[enemyRegionId];
        
        // 적 생존 장수는 그 지역에 남음 (포로 제외)
        const survivingEnemyGenerals = targetRegion.generals
          .filter(id => !removedEnemyGenerals.includes(id));

        newRegions[enemyRegionId] = {
          ...targetRegion,
          owner: prev.playerFaction,
          troops: survivingTroops,
          generals: survivingPlayerGenerals,
          defense: Math.floor(targetRegion.defense * 0.7)
        };

        // 출발 지역에서 장수 제거 (이동)
        const sourceRegion = newRegions[playerRegionId];
        const movedGeneralIds = playerUnits.map(u => u.generalId);
        newRegions[playerRegionId] = {
          ...sourceRegion,
          generals: sourceRegion.generals.filter(g => !movedGeneralIds.includes(g))
        };

        // 적 생존 장수들에 대한 처리 (도망간 것으로 처리 - 인접 지역으로)
        // 간단히 처리: 그냥 사라짐 (나중에 재야로 등장 가능)
      } else {
        // 패배: 남은 병력 귀환
        const sourceRegion = newRegions[playerRegionId];
        newRegions[playerRegionId] = {
          ...sourceRegion,
          troops: sourceRegion.troops + survivingTroops,
          generals: sourceRegion.generals.filter(g => !removedPlayerGenerals.includes(g))
        };
      }

      // 포로로 잡힌 적 장수들 (처리 대기)
      const pendingPrisoners = outcome.enemyGeneralFates?.filter(f => f.fate === 'captured') || [];

      // 전투 결과 데이터 생성
      const battleResult: BattleResultData = {
        outcome,
        conqueredRegionId: outcome.winner === 'player' ? enemyRegionId : null,
        sourceRegionId: playerRegionId,
        pendingPrisoners
      };

      return {
        ...prev,
        regions: newRegions,
        prisoners: newPrisoners,
        deadGenerals: newDeadGenerals,
        generalLoyalty: newLoyalty,
        battleData: null,
        battleResult,
        moraleBonus: 0, // 전투 후 사기 보너스 초기화
        phase: 'battle_result',
        actionsRemaining: Math.max(0, prev.actionsRemaining - 1)
      };
    });
  }, []);

  // 전투 결과 화면 닫기 -> 점령 지역 또는 출발 지역으로 이동
  const closeBattleResult = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.battleResult) return prev;

      const { conqueredRegionId, sourceRegionId } = prev.battleResult;
      
      // 승리: 점령한 지역 선택
      // 패배: 출발 지역 선택
      const targetRegion = conqueredRegionId || sourceRegionId;

      // 새로운 상태
      const newState: GameState = {
        ...prev,
        battleResult: null,
        selectedRegion: targetRegion,
        phase: 'map'
      };

      // 점령 성공 시 region_captured 이벤트 체크
      if (conqueredRegionId) {
        const checkCaptureCondition = (condition: EventCondition, state: GameState): boolean => {
          switch (condition.type) {
            case 'faction':
              return state.selectedFaction === condition.factionId;
            case 'region_owner':
              if (!condition.regionId) return false;
              return state.regions[condition.regionId]?.owner === state.playerFaction;
            default:
              return true;
          }
        };

        // region_captured 이벤트 찾기
        const captureEvent = HISTORICAL_EVENTS
          .filter(event => {
            if (event.trigger !== 'region_captured') return false;
            if (!event.isRepeatable && newState.triggeredEvents.includes(event.id)) return false;
            // region_owner 조건이 방금 점령한 지역과 일치하는지 체크
            const hasRegionCondition = event.conditions.some(
              c => c.type === 'region_owner' && c.regionId === conqueredRegionId
            );
            if (!hasRegionCondition) return false;
            return event.conditions.every(cond => checkCaptureCondition(cond, newState));
          })
          .sort((a, b) => b.priority - a.priority)[0];

        if (captureEvent) {
          return { ...newState, activeEvent: captureEvent };
        }
      }

      return newState;
    });
  }, []);

  // ============================================
  // 장수 등용 시스템
  // ============================================

  // 해당 지역의 재야 장수 목록
  const getFreeGeneralsInRegion = useCallback((regionId: RegionId): FreeGeneral[] => {
    if (!game) return [];
    return game.freeGenerals.filter(fg => fg.location === regionId);
  }, [game]);

  // 플레이어가 보유한 포로 목록
  const getPlayerPrisoners = useCallback((): Prisoner[] => {
    if (!game) return [];
    return game.prisoners.filter(p => p.capturedBy === game.playerFaction);
  }, [game]);

  // 장수 정보 가져오기 (기존 장수 + 재야 장수)
  const getGeneral = useCallback((generalId: string) => {
    return GENERALS[generalId] || UNAFFILIATED_GENERALS[generalId] || null;
  }, []);

  // 재야 장수 등용 시도
  const recruitFreeGeneral = useCallback((
    regionId: RegionId, 
    generalId: string,
    recruiterId: string
  ): { success: boolean; message: string } => {
    if (!game || game.actionsRemaining <= 0) {
      return { success: false, message: '행동력이 부족합니다.' };
    }

    const region = game.regions[regionId];
    if (!region || region.owner !== game.playerFaction) {
      return { success: false, message: '자신의 영토에서만 등용할 수 있습니다.' };
    }

    const freeGeneral = game.freeGenerals.find(
      fg => fg.generalId === generalId && fg.location === regionId
    );
    if (!freeGeneral) {
      return { success: false, message: '해당 장수를 찾을 수 없습니다.' };
    }

    const recruiter = getGeneral(recruiterId);
    const target = getGeneral(generalId);
    if (!recruiter || !target) {
      return { success: false, message: '장수 정보를 찾을 수 없습니다.' };
    }

    const targetLoyalty = game.generalLoyalty[generalId] ?? getInitialLoyalty(generalId);
    const result = attemptRecruit(
      recruiter.charisma,
      targetLoyalty,
      freeGeneral.recruitDifficulty
    );

    setGame(prev => {
      if (!prev) return null;

      if (result.success) {
        // 등용 성공
        const newRegions = { ...prev.regions };
        const oldGenerals = newRegions[regionId].generals;
        const newGenerals = [...oldGenerals, generalId];
        console.log('[DEBUG] 등용 성공:', { regionId, generalId, oldGenerals, newGenerals });
        newRegions[regionId] = {
          ...newRegions[regionId],
          generals: newGenerals
        };

        let newState: GameState = {
          ...prev,
          regions: newRegions,
          freeGenerals: prev.freeGenerals.filter(fg => fg.generalId !== generalId),
          generalLoyalty: {
            ...prev.generalLoyalty,
            [generalId]: result.newLoyalty
          },
          actionsRemaining: prev.actionsRemaining - 1
        };

        // general_recruited 이벤트 체크 (예: 적토마)
        const checkRecruitCondition = (condition: EventCondition, state: GameState): boolean => {
          switch (condition.type) {
            case 'faction':
              return state.selectedFaction === condition.factionId;
            case 'has_general':
              // 방금 등용한 장수가 조건에 맞는지 체크
              if (condition.generalId === generalId) return true;
              // 또는 이미 보유한 장수인지
              return Object.values(state.regions)
                .filter(r => r.owner === state.playerFaction)
                .some(r => r.generals.includes(condition.generalId!));
            default:
              return true;
          }
        };

        const recruitEvent = HISTORICAL_EVENTS
          .filter(event => {
            if (event.trigger !== 'general_recruited') return false;
            if (!event.isRepeatable && newState.triggeredEvents.includes(event.id)) return false;
            return event.conditions.every(cond => checkRecruitCondition(cond, newState));
          })
          .sort((a, b) => b.priority - a.priority)[0];

        if (recruitEvent) {
          newState = { ...newState, activeEvent: recruitEvent };
        }

        return newState;
      } else {
        // 등용 실패
        return {
          ...prev,
          actionsRemaining: prev.actionsRemaining - 1
        };
      }
    });

    if (result.success) {
      return { 
        success: true, 
        message: `🎉 ${target.nameKo}이(가) 휘하에 합류했습니다! (충성도: ${result.newLoyalty})` 
      };
    } else {
      return { 
        success: false, 
        message: `${target.nameKo}이(가) 등용을 거절했습니다.` 
      };
    }
  }, [game, getGeneral]);

  // 포로 등용 시도
  const recruitPrisoner = useCallback((
    prisonerId: string,
    recruiterId: string
  ): { success: boolean; message: string } => {
    if (!game || game.actionsRemaining <= 0) {
      return { success: false, message: '행동력이 부족합니다.' };
    }

    const prisoner = game.prisoners.find(
      p => p.generalId === prisonerId && p.capturedBy === game.playerFaction
    );
    if (!prisoner) {
      return { success: false, message: '해당 포로를 찾을 수 없습니다.' };
    }

    const recruiter = getGeneral(recruiterId);
    const target = getGeneral(prisonerId);
    if (!recruiter || !target) {
      return { success: false, message: '장수 정보를 찾을 수 없습니다.' };
    }

    const targetLoyalty = game.generalLoyalty[prisonerId] ?? getInitialLoyalty(prisonerId);
    
    // 포로는 등용 난이도 +10 (저항감)
    const result = attemptRecruit(recruiter.charisma, targetLoyalty, 10);

    setGame(prev => {
      if (!prev) return null;

      if (result.success) {
        // 등용 성공 - 포로가 있던 지역에 배치
        const newRegions = { ...prev.regions };
        newRegions[prisoner.location] = {
          ...newRegions[prisoner.location],
          generals: [...newRegions[prisoner.location].generals, prisonerId]
        };

        return {
          ...prev,
          regions: newRegions,
          prisoners: prev.prisoners.filter(p => p.generalId !== prisonerId),
          generalLoyalty: {
            ...prev.generalLoyalty,
            [prisonerId]: result.newLoyalty
          },
          actionsRemaining: prev.actionsRemaining - 1
        };
      } else {
        // 등용 실패
        return {
          ...prev,
          actionsRemaining: prev.actionsRemaining - 1
        };
      }
    });

    if (result.success) {
      return { 
        success: true, 
        message: `🎉 ${target.nameKo}이(가) 투항했습니다! (충성도: ${result.newLoyalty})` 
      };
    } else {
      return { 
        success: false, 
        message: `${target.nameKo}이(가) 투항을 거부했습니다.` 
      };
    }
  }, [game, getGeneral]);

  // 포로 처형
  const executePrisoner = useCallback((prisonerId: string): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };

    const prisoner = game.prisoners.find(
      p => p.generalId === prisonerId && p.capturedBy === game.playerFaction
    );
    if (!prisoner) {
      return { success: false, message: '해당 포로를 찾을 수 없습니다.' };
    }

    const target = getGeneral(prisonerId);

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        prisoners: prev.prisoners.filter(p => p.generalId !== prisonerId),
        deadGenerals: [...prev.deadGenerals, prisonerId]
      };
    });

    return { 
      success: true, 
      message: `💀 ${target?.nameKo || prisonerId}을(를) 처형했습니다.` 
    };
  }, [game, getGeneral]);

  // 포로 석방
  const releasePrisoner = useCallback((prisonerId: string): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };

    const prisoner = game.prisoners.find(
      p => p.generalId === prisonerId && p.capturedBy === game.playerFaction
    );
    if (!prisoner) {
      return { success: false, message: '해당 포로를 찾을 수 없습니다.' };
    }

    const target = getGeneral(prisonerId);

    setGame(prev => {
      if (!prev) return null;
      
      // 석방된 장수는 재야로
      const newFreeGeneral: FreeGeneral = {
        generalId: prisonerId,
        location: prisoner.location,
        recruitDifficulty: 0 // 한 번 석방해준 은혜
      };

      return {
        ...prev,
        prisoners: prev.prisoners.filter(p => p.generalId !== prisonerId),
        freeGenerals: [...prev.freeGenerals, newFreeGeneral],
        // 석방하면 충성도가 조금 올라감
        generalLoyalty: {
          ...prev.generalLoyalty,
          [prisonerId]: Math.min(100, (prev.generalLoyalty[prisonerId] || 50) + 10)
        }
      };
    });

    return { 
      success: true, 
      message: `${target?.nameKo || prisonerId}을(를) 석방했습니다. (호감도 상승)` 
    };
  }, [game, getGeneral]);

  // ============================================
  // 역사 이벤트 시스템
  // ============================================

  // 이벤트 조건 체크
  const checkEventCondition = useCallback((condition: EventCondition, state: GameState): boolean => {
    switch (condition.type) {
      case 'faction':
        return state.selectedFaction === condition.factionId;
      
      case 'turn':
        return state.turn === condition.turn;
      
      case 'turnMin':
        return condition.turnMin !== undefined && state.turn >= condition.turnMin;
      
      case 'turnMax':
        return condition.turnMax !== undefined && state.turn <= condition.turnMax;
      
      case 'region_owner':
        if (!condition.regionId) return false;
        return state.regions[condition.regionId]?.owner === state.playerFaction;
      
      case 'has_general':
        if (!condition.generalId) return false;
        // 플레이어 영토의 장수 중에 있는지 확인
        return Object.values(state.regions).some(
          region => region.owner === state.playerFaction && 
                    region.generals.includes(condition.generalId!)
        );
      
      case 'general_free':
        if (!condition.generalId) return false;
        return state.freeGenerals.some(fg => fg.generalId === condition.generalId);
      
      case 'general_in_region':
        if (!condition.generalId || !condition.regionId) return false;
        return state.regions[condition.regionId]?.generals.includes(condition.generalId) || false;
      
      case 'troops_ratio':
        // 전투 중일 때만 체크 (battleData 필요)
        if (!state.battleData || !condition.ratio) return false;
        const playerTroops = state.battleData.playerUnits.reduce((sum, u) => sum + u.troops, 0);
        const enemyTroops = state.battleData.enemyTroops;
        return (playerTroops / enemyTroops) <= condition.ratio;
      
      case 'custom':
        if (!condition.customCheck) return false;
        const customCheckFn = CUSTOM_CONDITION_CHECKS[condition.customCheck];
        return customCheckFn ? customCheckFn(state) : false;
      
      default:
        return false;
    }
  }, []);

  // 특정 조건에 맞는 조건 체크 (turnMin, turnMax 등)
  const checkEventConditionExtended = useCallback((condition: EventCondition, state: GameState): boolean => {
    // 기본 조건 체크
    if (!checkEventCondition(condition, state)) {
      // turnMin, turnMax 체크
      if (condition.turnMin !== undefined && state.turn < condition.turnMin) return false;
      if (condition.turnMax !== undefined && state.turn > condition.turnMax) return false;
      if (condition.type === 'faction' || condition.type === 'turn') return false;
    }
    
    // turnMin/turnMax 추가 체크
    if (condition.turnMin !== undefined && state.turn < condition.turnMin) return false;
    if (condition.turnMax !== undefined && state.turn > condition.turnMax) return false;
    
    return checkEventCondition(condition, state);
  }, [checkEventCondition]);

  // 트리거에 해당하는 이벤트 찾기
  const findTriggeredEvent = useCallback((trigger: EventTrigger, state: GameState): HistoricalEvent | null => {
    const eligibleEvents = HISTORICAL_EVENTS
      .filter(event => {
        // 이미 발생한 이벤트인지 체크
        if (!event.isRepeatable && state.triggeredEvents.includes(event.id)) {
          return false;
        }
        // 트리거 타입 체크
        if (event.trigger !== trigger) {
          return false;
        }
        // 모든 조건 만족하는지 체크
        return event.conditions.every(cond => checkEventConditionExtended(cond, state));
      })
      .sort((a, b) => b.priority - a.priority); // 우선순위 높은 순

    return eligibleEvents[0] || null;
  }, [checkEventConditionExtended]);

  // 이벤트 트리거 (특정 시점에 호출)
  const triggerEvent = useCallback((trigger: EventTrigger) => {
    if (!game) return;
    
    const event = findTriggeredEvent(trigger, game);
    if (event) {
      setGame(prev => prev ? { ...prev, activeEvent: event } : null);
    }
  }, [game, findTriggeredEvent]);

  // 이벤트 효과 적용
  const applyEventEffect = useCallback((effect: EventEffect, state: GameState): GameState => {
    const newState = { ...state };
    
    switch (effect.type) {
      case 'add_general': {
        // 장수를 플레이어 영토로 이동
        if (!effect.generalId) break;
        const gId = effect.generalId;

        // 1. 재야 장수인 경우
        const freeGeneral = newState.freeGenerals.find(fg => fg.generalId === gId);
        if (freeGeneral) {
          newState.freeGenerals = newState.freeGenerals.filter(fg => fg.generalId !== gId);
        } else {
          // 2. 다른 세력 소속인 경우 - 해당 진영에서 제거
          for (const [rId, region] of Object.entries(newState.regions)) {
            if (region.owner !== newState.playerFaction && region.generals.includes(gId)) {
              newState.regions = {
                ...newState.regions,
                [rId]: {
                  ...region,
                  generals: region.generals.filter(g => g !== gId)
                }
              };
              break;
            }
          }
        }

        // 플레이어 첫 번째 영토에 추가
        const playerRegion = Object.values(newState.regions).find(r => r.owner === newState.playerFaction);
        if (playerRegion) {
          newState.regions = {
            ...newState.regions,
            [playerRegion.id]: {
              ...playerRegion,
              generals: [...playerRegion.generals, gId]
            }
          };
        }
        break;
      }
      
      case 'set_loyalty': {
        if (effect.generalId && effect.value !== undefined) {
          newState.generalLoyalty = {
            ...newState.generalLoyalty,
            [effect.generalId]: effect.value
          };
        }
        break;
      }
      
      case 'add_loyalty': {
        if (effect.generalId && effect.value !== undefined) {
          const current = newState.generalLoyalty[effect.generalId] || 50;
          newState.generalLoyalty = {
            ...newState.generalLoyalty,
            [effect.generalId]: Math.min(100, Math.max(0, current + effect.value))
          };
        }
        break;
      }
      
      case 'add_gold': {
        if (effect.value !== undefined) {
          if (effect.regionId) {
            // 특정 지역에 추가
            const region = newState.regions[effect.regionId];
            if (region) {
              newState.regions = {
                ...newState.regions,
                [effect.regionId]: { ...region, gold: region.gold + effect.value }
              };
            }
          } else {
            // 플레이어 첫 번째 영토에 추가
            const playerRegion = Object.values(newState.regions).find(r => r.owner === newState.playerFaction);
            if (playerRegion) {
              newState.regions = {
                ...newState.regions,
                [playerRegion.id]: { ...playerRegion, gold: playerRegion.gold + effect.value }
              };
            }
          }
        }
        break;
      }
      
      case 'add_food': {
        if (effect.value !== undefined) {
          if (effect.regionId) {
            const region = newState.regions[effect.regionId];
            if (region) {
              newState.regions = {
                ...newState.regions,
                [effect.regionId]: { ...region, food: region.food + effect.value }
              };
            }
          } else {
            const playerRegion = Object.values(newState.regions).find(r => r.owner === newState.playerFaction);
            if (playerRegion) {
              newState.regions = {
                ...newState.regions,
                [playerRegion.id]: { ...playerRegion, food: playerRegion.food + effect.value }
              };
            }
          }
        }
        break;
      }
      
      case 'add_troops': {
        if (effect.value !== undefined) {
          if (effect.regionId) {
            const region = newState.regions[effect.regionId];
            if (region) {
              newState.regions = {
                ...newState.regions,
                [effect.regionId]: { ...region, troops: region.troops + effect.value }
              };
            }
          } else {
            const playerRegion = Object.values(newState.regions).find(r => r.owner === newState.playerFaction);
            if (playerRegion) {
              newState.regions = {
                ...newState.regions,
                [playerRegion.id]: { ...playerRegion, troops: playerRegion.troops + effect.value }
              };
            }
          }
        }
        break;
      }
      
      case 'add_morale': {
        // 사기 보너스 누적 (다음 전투에 적용)
        if (effect.value !== undefined) {
          newState.moraleBonus = (newState.moraleBonus || 0) + effect.value;
        }
        break;
      }

      case 'remove_general': {
        // 장수를 플레이어 영토에서 제거 (재야로)
        if (!effect.generalId) break;
        const removeId = effect.generalId;
        for (const [rId, region] of Object.entries(newState.regions)) {
          if (region.owner === newState.playerFaction && region.generals.includes(removeId)) {
            newState.regions = {
              ...newState.regions,
              [rId]: {
                ...region,
                generals: region.generals.filter(g => g !== removeId)
              }
            };
            // 재야 장수로 추가
            newState.freeGenerals = [
              ...newState.freeGenerals,
              { generalId: removeId, location: rId as RegionId, recruitDifficulty: 50 }
            ];
            break;
          }
        }
        break;
      }

      case 'unlock_stratagem': {
        // 계략 해금 (현재 계략 시스템이 고정이므로 메시지로 대체)
        break;
      }

      case 'battle_bonus': {
        if (effect.value !== undefined) {
          if (effect.generalId) {
            // 특정 장수에게 전투 보너스
            newState.battleBonuses = {
              ...newState.battleBonuses,
              [effect.generalId]: (newState.battleBonuses[effect.generalId] || 0) + effect.value
            };
          } else if (effect.targetType === 'player') {
            // 플레이어 전체에 전투 보너스 (특수 키 '_player')
            newState.battleBonuses = {
              ...newState.battleBonuses,
              ['_player']: (newState.battleBonuses['_player'] || 0) + effect.value
            };
          }
        }
        break;
      }

      case 'message':
        // 메시지는 UI에서 처리
        break;

      default:
        break;
    }
    
    return newState;
  }, []);

  // 이벤트 선택 처리
  const handleEventChoice = useCallback((choice: EventChoice) => {
    setGame(prev => {
      if (!prev || !prev.activeEvent) return prev;
      
      let newState = { ...prev };
      
      // 모든 효과 적용
      for (const effect of choice.effects) {
        newState = applyEventEffect(effect, newState);
      }
      
      // 이벤트 완료 처리
      newState.triggeredEvents = [...newState.triggeredEvents, prev.activeEvent.id];
      newState.activeEvent = null;
      
      return newState;
    });
  }, [applyEventEffect]);

  // 이벤트 닫기 (선택지 없는 경우)
  const closeEvent = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.activeEvent) return prev;
      return {
        ...prev,
        triggeredEvents: [...prev.triggeredEvents, prev.activeEvent.id],
        activeEvent: null
      };
    });
  }, []);

  // 게임 시작 시 이벤트 체크 (selectFactionAndStart 수정 필요)
  const checkGameStartEvents = useCallback((state: GameState): GameState => {
    const event = findTriggeredEvent('game_start', state);
    if (event) {
      return { ...state, activeEvent: event };
    }
    return state;
  }, [findTriggeredEvent]);

  // ============================================
  // 외교 시스템
  // ============================================

  // 선전포고
  const declareWar = useCallback((targetFaction: FactionId) => {
    setGame(prev => {
      if (!prev) return prev;
      
      // 이미 적대 관계인지 확인
      const existingRelation = prev.diplomaticRelations.find(r =>
        (r.faction1 === prev.playerFaction && r.faction2 === targetFaction) ||
        (r.faction1 === targetFaction && r.faction2 === prev.playerFaction)
      );
      
      if (existingRelation?.type === 'hostile') {
        return prev; // 이미 전쟁 중
      }
      
      // 기존 관계 제거하고 적대 관계 추가
      const newRelations = prev.diplomaticRelations.filter(r =>
        !((r.faction1 === prev.playerFaction && r.faction2 === targetFaction) ||
          (r.faction1 === targetFaction && r.faction2 === prev.playerFaction))
      );
      
      newRelations.push({
        faction1: prev.playerFaction,
        faction2: targetFaction,
        type: 'hostile',
        startTurn: prev.turn
      });
      
      return {
        ...prev,
        diplomaticRelations: newRelations
      };
    });
  }, []);

  // 두 세력 간의 관계 확인
  const getRelationWith = useCallback((targetFaction: FactionId): string => {
    if (!game) return 'neutral';
    const relation = game.diplomaticRelations.find(r =>
      (r.faction1 === game.playerFaction && r.faction2 === targetFaction) ||
      (r.faction1 === targetFaction && r.faction2 === game.playerFaction)
    );
    return relation?.type || 'neutral';
  }, [game]);

  // 동맹 제안
  const proposeAlliance = useCallback((targetFaction: FactionId): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };
    if (game.actionsRemaining <= 0) return { success: false, message: '행동력이 부족합니다.' };

    const currentRelation = getRelationWith(targetFaction);
    if (currentRelation === 'alliance') {
      return { success: false, message: '이미 동맹 관계입니다.' };
    }
    if (currentRelation === 'hostile') {
      return { success: false, message: '전쟁 중에는 동맹을 제안할 수 없습니다.' };
    }

    // AI 응답 결정
    const analyses = analyzeFactions(game);
    const proposal: DiplomaticProposal = {
      id: `proposal-${Date.now()}`,
      from: game.playerFaction,
      to: targetFaction,
      type: 'alliance',
      proposedTurn: game.turn,
      status: 'pending'
    };

    const decision = shouldAcceptProposal(game, proposal, analyses);
    const factionName = FACTIONS[targetFaction]?.nameKo || targetFaction;

    setGame(prev => {
      if (!prev) return prev;

      if (decision.accept) {
        // 수락: 동맹 관계 추가
        const newRelations = prev.diplomaticRelations.filter(r =>
          !((r.faction1 === prev.playerFaction && r.faction2 === targetFaction) ||
            (r.faction1 === targetFaction && r.faction2 === prev.playerFaction))
        );
        newRelations.push({
          faction1: prev.playerFaction,
          faction2: targetFaction,
          type: 'alliance',
          startTurn: prev.turn
        });
        return {
          ...prev,
          diplomaticRelations: newRelations,
          actionsRemaining: prev.actionsRemaining - 1
        };
      } else {
        // 거절
        return {
          ...prev,
          actionsRemaining: prev.actionsRemaining - 1
        };
      }
    });

    if (decision.accept) {
      return { success: true, message: `🤝 ${factionName}이(가) 동맹을 수락했습니다!` };
    } else {
      return { success: false, message: `${factionName}이(가) 동맹 제안을 거절했습니다. (${decision.reason})` };
    }
  }, [game, getRelationWith]);

  // 불가침 제안
  const proposeTruce = useCallback((targetFaction: FactionId): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };
    if (game.actionsRemaining <= 0) return { success: false, message: '행동력이 부족합니다.' };

    const currentRelation = getRelationWith(targetFaction);
    if (currentRelation === 'alliance' || currentRelation === 'truce') {
      return { success: false, message: '이미 우호적인 관계입니다.' };
    }

    // AI 응답 결정
    const analyses = analyzeFactions(game);
    const proposal: DiplomaticProposal = {
      id: `proposal-${Date.now()}`,
      from: game.playerFaction,
      to: targetFaction,
      type: 'truce',
      proposedTurn: game.turn,
      duration: 5,
      status: 'pending'
    };

    const decision = shouldAcceptProposal(game, proposal, analyses);
    const factionName = FACTIONS[targetFaction]?.nameKo || targetFaction;

    setGame(prev => {
      if (!prev) return prev;

      if (decision.accept) {
        // 수락: 불가침 관계 추가
        const newRelations = prev.diplomaticRelations.filter(r =>
          !((r.faction1 === prev.playerFaction && r.faction2 === targetFaction) ||
            (r.faction1 === targetFaction && r.faction2 === prev.playerFaction))
        );
        newRelations.push({
          faction1: prev.playerFaction,
          faction2: targetFaction,
          type: 'truce',
          startTurn: prev.turn,
          duration: 5
        });
        return {
          ...prev,
          diplomaticRelations: newRelations,
          actionsRemaining: prev.actionsRemaining - 1
        };
      } else {
        return {
          ...prev,
          actionsRemaining: prev.actionsRemaining - 1
        };
      }
    });

    if (decision.accept) {
      return { success: true, message: `🕊️ ${factionName}이(가) 불가침 조약을 수락했습니다!` };
    } else {
      return { success: false, message: `${factionName}이(가) 불가침 제안을 거절했습니다. (${decision.reason})` };
    }
  }, [game, getRelationWith]);

  // AI 외교 제안 처리 (수락/거절)
  const handleAIProposal = useCallback((proposalId: string, accept: boolean): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };

    const proposal = game.diplomaticProposals.find(p => p.id === proposalId);
    if (!proposal) return { success: false, message: '제안을 찾을 수 없습니다.' };

    const factionName = FACTIONS[proposal.from]?.nameKo || proposal.from;

    setGame(prev => {
      if (!prev) return prev;

      // 제안 목록에서 제거
      const newProposals = prev.diplomaticProposals.filter(p => p.id !== proposalId);

      if (accept) {
        // 수락: 관계 추가
        const newRelations = prev.diplomaticRelations.filter(r =>
          !((r.faction1 === prev.playerFaction && r.faction2 === proposal.from) ||
            (r.faction1 === proposal.from && r.faction2 === prev.playerFaction))
        );
        newRelations.push({
          faction1: proposal.from,
          faction2: prev.playerFaction,
          type: proposal.type,
          startTurn: prev.turn,
          duration: proposal.duration
        });
        return {
          ...prev,
          diplomaticRelations: newRelations,
          diplomaticProposals: newProposals
        };
      } else {
        return {
          ...prev,
          diplomaticProposals: newProposals
        };
      }
    });

    if (accept) {
      const typeNames: Record<string, string> = {
        alliance: '동맹',
        truce: '불가침 조약'
      };
      return { success: true, message: `🤝 ${factionName}과의 ${typeNames[proposal.type] || '조약'}을 수락했습니다!` };
    } else {
      return { success: true, message: `${factionName}의 제안을 거절했습니다.` };
    }
  }, [game]);

  // 대기 중인 외교 제안 목록
  const getPendingProposals = useCallback((): DiplomaticProposal[] => {
    if (!game) return [];
    return game.diplomaticProposals.filter(p => 
      p.to === game.playerFaction && p.status === 'pending'
    );
  }, [game]);

  // ============================================
  // 이동 시스템 (장수/병력/자원)
  // ============================================
  
  const transferResources = useCallback((params: {
    sourceRegion: RegionId;
    destRegion: RegionId;
    generals: string[];
    troops: number;
    gold: number;
    food: number;
  }): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };
    if (game.actionsRemaining <= 0) return { success: false, message: '행동력이 부족합니다.' };

    const { sourceRegion, destRegion, generals, troops, gold, food } = params;
    const source = game.regions[sourceRegion];
    const dest = game.regions[destRegion];

    if (!source || !dest) return { success: false, message: '지역을 찾을 수 없습니다.' };
    if (source.owner !== game.playerFaction || dest.owner !== game.playerFaction) {
      return { success: false, message: '자신의 영토 간에만 이동할 수 있습니다.' };
    }
    if (!source.adjacent.includes(destRegion)) {
      return { success: false, message: '인접한 성끼리만 이동할 수 있습니다.' };
    }

    // 이동할 항목 검증
    const hasItems = generals.length > 0 || troops > 0 || gold > 0 || food > 0;
    if (!hasItems) return { success: false, message: '이동할 항목을 선택하세요.' };

    if (troops > source.troops) return { success: false, message: '병력이 부족합니다.' };
    if (gold > source.gold) return { success: false, message: '금이 부족합니다.' };
    if (food > source.food) return { success: false, message: '식량이 부족합니다.' };

    // 장수 검증
    for (const gId of generals) {
      if (!source.generals.includes(gId)) {
        return { success: false, message: '해당 장수가 출발 성에 없습니다.' };
      }
    }

    setGame(prev => {
      if (!prev) return null;

      const newRegions = { ...prev.regions };
      const newSource = { ...newRegions[sourceRegion] };
      const newDest = { ...newRegions[destRegion] };

      // 장수 이동
      if (generals.length > 0) {
        newSource.generals = newSource.generals.filter(g => !generals.includes(g));
        newDest.generals = [...newDest.generals, ...generals];
      }

      // 병력 이동
      newSource.troops -= troops;
      newDest.troops += troops;

      // 금 이동
      newSource.gold -= gold;
      newDest.gold += gold;

      // 식량 이동
      newSource.food -= food;
      newDest.food += food;

      newRegions[sourceRegion] = newSource;
      newRegions[destRegion] = newDest;

      return {
        ...prev,
        regions: newRegions,
        actionsRemaining: prev.actionsRemaining - 1,
      };
    });

    // 이동 내용 요약
    const parts: string[] = [];
    if (generals.length > 0) {
      const names = generals.map(id => getGeneral(id)?.nameKo || id).join(', ');
      parts.push(`장수(${names})`);
    }
    if (troops > 0) parts.push(`병력 ${troops.toLocaleString()}`);
    if (gold > 0) parts.push(`금 ${gold.toLocaleString()}`);
    if (food > 0) parts.push(`식량 ${food.toLocaleString()}`);

    return {
      success: true,
      message: `이동 완료! ${parts.join(', ')}`
    };
  }, [game, getGeneral]);

  // 동맹 파기
  const breakAlliance = useCallback((targetFaction: FactionId): { success: boolean; message: string } => {
    if (!game) return { success: false, message: '게임이 로드되지 않았습니다.' };

    const currentRelation = getRelationWith(targetFaction);
    if (currentRelation !== 'alliance') {
      return { success: false, message: '동맹 관계가 아닙니다.' };
    }

    const factionName = FACTIONS[targetFaction]?.nameKo || targetFaction;

    setGame(prev => {
      if (!prev) return prev;

      // 동맹 관계 제거
      const newRelations = prev.diplomaticRelations.filter(r =>
        !((r.faction1 === prev.playerFaction && r.faction2 === targetFaction) ||
          (r.faction1 === targetFaction && r.faction2 === prev.playerFaction))
      );

      return {
        ...prev,
        diplomaticRelations: newRelations
      };
    });

    return { success: true, message: `⚠️ ${factionName}과의 동맹을 파기했습니다.` };
  }, [game, getRelationWith]);

  return {
    game,
    isClient,
    playerRegions,
    totalResources,
    selectRegion,
    executeDomestic,
    endTurn,
    newGame,
    setPhase,
    // 게임 페이즈 관리
    gamePhase,
    hasSaveData,
    startNewGame,
    selectFactionAndStart,
    continueGame,
    backToTitle,
    // 출진 시스템
    startMarch,
    cancelMarch,
    selectMarchTarget,
    setMarchStep,
    toggleMarchGeneral,
    setCommander,
    assignTroops,
    assignTroopsBatch,
    confirmMarch,
    handleBattleEnd,
    closeBattleResult,
    // 장수 등용 시스템
    getFreeGeneralsInRegion,
    getPlayerPrisoners,
    getGeneral,
    recruitFreeGeneral,
    recruitPrisoner,
    executePrisoner,
    releasePrisoner,
    // 이벤트 시스템
    triggerEvent,
    handleEventChoice,
    closeEvent,
    // 이동 시스템
    transferResources,
    // 외교 시스템
    declareWar,
    getRelationWith,
    proposeAlliance,
    proposeTruce,
    handleAIProposal,
    getPendingProposals,
    breakAlliance
  };
}
