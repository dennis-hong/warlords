# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Warlords is a Three Kingdoms (삼국지) themed turn-based strategy web game built with Next.js. Players control a faction, manage territories, recruit generals, and engage in tactical battles to unify China.

## Commands

```bash
pnpm dev      # Start development server (http://localhost:3000)
pnpm build    # Production build
pnpm lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16+ with React 19
- **Styling**: Tailwind CSS 4
- **State Management**: React hooks (useState, useCallback)
- **Storage**: localStorage for save/load
- **Language**: TypeScript

## Architecture

### Directory Structure

```
app/
├── components/
│   ├── ui/           # Reusable UI components (ResourceBar, WorldMap, etc.)
│   ├── WarlordsGame.tsx    # Main game component, handles game phases
│   ├── BattleScreen.tsx    # Battle system UI
│   ├── TitleScreen.tsx     # Start screen
│   └── FactionSelectScreen.tsx
├── hooks/
│   ├── useGameState.ts     # Main game state management (regions, turns, actions)
│   └── useBattleState.ts   # Battle-specific state
├── constants/
│   ├── gameData.ts         # Generals, initial data, loyalty
│   └── worldData.ts        # Regions, factions, domestic commands
├── types/
│   └── index.ts            # All TypeScript interfaces
└── utils/
    └── battle.ts           # Battle calculations, recruitment logic
```

### Key Patterns

**Game Phase Flow**: `title` → `faction_select` → `playing` → `battle` → `playing`

**State Management**: `useGameState` hook manages all game state including:
- Turn/season progression
- Region ownership and resources
- March/battle system
- General recruitment, prisoners, deaths

**Battle Flow**: March preparation → Field battle (rounds with actions) → Victory/Defeat → Territory changes

### Data Types

- `FactionId`: Player and AI factions ('player', 'caocao', 'liubei', 'sunquan', etc.)
- `RegionId`: 9 territories ('luoyang', 'xuchang', 'chengdu', 'jianye', etc.)
- `TroopType`: 'infantry', 'cavalry', 'archer' with rock-paper-scissors advantages
- `DomesticAction`: 'develop_farm', 'develop_commerce', 'recruit', 'train', 'rest'

### Game Design Reference

See `GAME_DESIGN.md` for detailed game mechanics including:
- Battle system (charge/defend/stratagem/duel)
- Morale system
- Stratagem list and success rates
- Duel mechanics
- UI mockups

## Korean Language

The game UI is in Korean. General names have both `name` (pinyin) and `nameKo` (Korean) fields.
