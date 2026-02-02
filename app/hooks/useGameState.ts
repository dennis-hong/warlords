'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  GameState, RegionId, DomesticAction, Region,
  MarchState, MarchStep, MarchUnit, BattleInitData, BattleOutcome, TroopType,
  Prisoner, FreeGeneral, GeneralFate, FactionId, GamePhase
} from '../types';
import { REGIONS, FACTIONS, DOMESTIC_COMMANDS, FACTION_DETAILS } from '../constants/worldData';
import { GENERALS, INITIAL_FREE_GENERALS, INITIAL_LOYALTY, UNAFFILIATED_GENERALS } from '../constants/gameData';
import { attemptRecruit, getInitialLoyalty } from '../utils/battle';

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
    regions,
    factions: FACTIONS,
    selectedRegion: null,
    actionsRemaining: 3,
    maxActions: 3,
    phase: 'map',
    march: null,
    battleData: null,
    // 장수 시스템
    prisoners: [],
    freeGenerals: JSON.parse(JSON.stringify(INITIAL_FREE_GENERALS)),
    deadGenerals: [],
    generalLoyalty: { ...INITIAL_LOYALTY }
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
    const initial = createInitialState(factionId);
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
          // 훈련 효과는 나중에 전투력에 반영
          break;
        case 'rest':
          // 아무것도 안 함
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

      return {
        ...prev,
        turn: prev.turn + 1,
        season: nextSeason,
        year: nextYear,
        regions: newRegions,
        actionsRemaining: prev.maxActions,
        selectedRegion: null
      };
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

  // 출진 확정 -> 전투 시작
  const confirmMarch = useCallback(() => {
    setGame(prev => {
      if (!prev || !prev.march || !prev.march.targetRegion) return prev;
      if (prev.march.units.length === 0) return prev;

      const targetRegion = prev.regions[prev.march.targetRegion];
      if (!targetRegion) return prev;

      // 식량 체크 & 차감 (출발 지역에서)
      const sourceRegion = prev.selectedRegion
        ? prev.regions[prev.selectedRegion]
        : playerRegions[0];

      if (!sourceRegion || sourceRegion.food < prev.march.foodRequired) {
        return prev; // 식량 부족
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
        enemyTroops: targetRegion.troops
      };

      // 출발 지역에서 병력 & 식량 차감
      const newRegions = {
        ...prev.regions,
        [sourceRegion.id]: {
          ...sourceRegion,
          troops: sourceRegion.troops - totalMarchTroops,
          food: sourceRegion.food - prev.march.foodRequired
        }
      };

      return {
        ...prev,
        regions: newRegions,
        battleData,
        phase: 'battle',
        march: null
      };
    });
  }, [playerRegions]);

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

      return {
        ...prev,
        regions: newRegions,
        prisoners: newPrisoners,
        deadGenerals: newDeadGenerals,
        generalLoyalty: newLoyalty,
        battleData: null,
        phase: 'map',
        actionsRemaining: Math.max(0, prev.actionsRemaining - 1)
      };
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
        newRegions[regionId] = {
          ...newRegions[regionId],
          generals: [...newRegions[regionId].generals, generalId]
        };

        return {
          ...prev,
          regions: newRegions,
          freeGenerals: prev.freeGenerals.filter(fg => fg.generalId !== generalId),
          generalLoyalty: {
            ...prev.generalLoyalty,
            [generalId]: result.newLoyalty
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
    confirmMarch,
    handleBattleEnd,
    // 장수 등용 시스템
    getFreeGeneralsInRegion,
    getPlayerPrisoners,
    getGeneral,
    recruitFreeGeneral,
    recruitPrisoner,
    executePrisoner,
    releasePrisoner
  };
}
