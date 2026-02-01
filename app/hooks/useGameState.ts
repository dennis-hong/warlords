'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  GameState, RegionId, DomesticAction, Region,
  MarchState, MarchStep, MarchUnit, BattleInitData, BattleOutcome, TroopType
} from '../types';
import { REGIONS, FACTIONS, DOMESTIC_COMMANDS } from '../constants/worldData';
import { GENERALS } from '../constants/gameData';

// 초기 게임 상태
const createInitialState = (): GameState => ({
  turn: 1,
  season: 'spring',
  year: 190,
  playerFaction: 'player',
  regions: JSON.parse(JSON.stringify(REGIONS)), // 깊은 복사
  factions: FACTIONS,
  selectedRegion: null,
  actionsRemaining: 3,
  maxActions: 3,
  phase: 'map',
  march: null,
  battleData: null
});

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

  // 클라이언트 초기화
  useEffect(() => {
    setIsClient(true);
    // 로컬 스토리지에서 저장된 게임 불러오기
    const saved = localStorage.getItem('warlords_save');
    if (saved) {
      try {
        setGame(JSON.parse(saved));
      } catch {
        setGame(createInitialState());
      }
    } else {
      setGame(createInitialState());
    }
  }, []);

  // 저장
  useEffect(() => {
    if (game && isClient) {
      localStorage.setItem('warlords_save', JSON.stringify(game));
    }
  }, [game, isClient]);

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

  // 새 게임
  const newGame = useCallback(() => {
    const initial = createInitialState();
    setGame(initial);
    localStorage.setItem('warlords_save', JSON.stringify(initial));
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

      // 남은 플레이어 병력 계산
      const totalPlayerTroops = playerUnits.reduce((sum, u) => sum + u.troops, 0);
      const survivingTroops = totalPlayerTroops - outcome.playerTroopsLost;

      if (outcome.winner === 'player') {
        // 승리: 적 영토 점령
        const targetRegion = newRegions[enemyRegionId];
        newRegions[enemyRegionId] = {
          ...targetRegion,
          owner: prev.playerFaction,
          troops: survivingTroops,
          generals: playerUnits.map(u => u.generalId),
          defense: Math.floor(targetRegion.defense * 0.7) // 공성으로 내구도 손상
        };

        // 출발 지역에서 장수 제거 (이동)
        const sourceRegion = newRegions[playerRegionId];
        const movedGeneralIds = playerUnits.map(u => u.generalId);
        newRegions[playerRegionId] = {
          ...sourceRegion,
          generals: sourceRegion.generals.filter(g => !movedGeneralIds.includes(g))
        };
      } else {
        // 패배: 남은 병력 귀환
        const sourceRegion = newRegions[playerRegionId];
        newRegions[playerRegionId] = {
          ...sourceRegion,
          troops: sourceRegion.troops + survivingTroops
        };
      }

      return {
        ...prev,
        regions: newRegions,
        battleData: null,
        phase: 'map',
        actionsRemaining: Math.max(0, prev.actionsRemaining - 1)
      };
    });
  }, []);

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
    // 출진 시스템
    startMarch,
    cancelMarch,
    selectMarchTarget,
    setMarchStep,
    toggleMarchGeneral,
    setCommander,
    assignTroops,
    confirmMarch,
    handleBattleEnd
  };
}
