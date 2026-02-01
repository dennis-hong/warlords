'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GameState, RegionId, DomesticAction, Region } from '../types';
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
  phase: 'map'
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

  return {
    game,
    isClient,
    playerRegions,
    totalResources,
    selectRegion,
    executeDomestic,
    endTurn,
    newGame,
    setPhase
  };
}
