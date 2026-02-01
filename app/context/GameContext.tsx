'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { GameState, FactionId, GamePhase } from '../types';
import { createInitialRegionStates } from '../constants/regions';
import { FACTION_GENERALS, FACTION_START_REGION } from '../constants/factions';
import { GAME_CONFIG } from '../constants/gameData';

// 액션 타입
type GameAction =
  | { type: 'START_NEW_GAME' }
  | { type: 'SELECT_FACTION'; factionId: FactionId }
  | { type: 'START_GAME' }
  | { type: 'SET_PHASE'; phase: GamePhase }
  | { type: 'NEXT_TURN' }
  | { type: 'RETURN_TO_TITLE' };

// 초기 상태
const initialState: GameState = {
  phase: 'title',
  selectedFaction: null,
  currentTurn: 1,
  year: GAME_CONFIG.START_YEAR,
  month: GAME_CONFIG.START_MONTH,
  regions: createInitialRegionStates(),
  playerGenerals: []
};

// 리듀서
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_NEW_GAME':
      return {
        ...initialState,
        phase: 'faction_select',
        regions: createInitialRegionStates()
      };

    case 'SELECT_FACTION':
      return {
        ...state,
        selectedFaction: action.factionId
      };

    case 'START_GAME': {
      if (!state.selectedFaction) return state;
      
      const playerGenerals = FACTION_GENERALS[state.selectedFaction] || [];
      const startRegion = FACTION_START_REGION[state.selectedFaction];
      
      const regions = { ...state.regions };
      if (startRegion && regions[startRegion]) {
        regions[startRegion] = {
          ...regions[startRegion],
          generals: playerGenerals
        };
      }

      return {
        ...state,
        phase: 'playing',
        playerGenerals,
        regions
      };
    }

    case 'SET_PHASE':
      return {
        ...state,
        phase: action.phase
      };

    case 'NEXT_TURN': {
      const nextMonth = state.month >= 12 ? 1 : state.month + 1;
      const nextYear = state.month >= 12 ? state.year + 1 : state.year;
      
      return {
        ...state,
        currentTurn: state.currentTurn + 1,
        month: nextMonth,
        year: nextYear
      };
    }

    case 'RETURN_TO_TITLE':
      return {
        ...initialState,
        regions: createInitialRegionStates()
      };

    default:
      return state;
  }
}

// Context 타입
interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  startNewGame: () => void;
  selectFaction: (factionId: FactionId) => void;
  startGame: () => void;
  returnToTitle: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Provider
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const value: GameContextType = {
    state,
    dispatch,
    startNewGame: () => dispatch({ type: 'START_NEW_GAME' }),
    selectFaction: (factionId) => dispatch({ type: 'SELECT_FACTION', factionId }),
    startGame: () => dispatch({ type: 'START_GAME' }),
    returnToTitle: () => dispatch({ type: 'RETURN_TO_TITLE' })
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// Hook
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
