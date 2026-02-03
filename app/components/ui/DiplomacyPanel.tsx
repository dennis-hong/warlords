'use client';

import React, { useState } from 'react';
import type { 
  GameState, 
  FactionId, 
  DiplomaticRelationType,
  DiplomaticRelation 
} from '../../types';

interface DiplomacyPanelProps {
  gameState: GameState;
  onDeclareWar?: (targetFaction: FactionId) => void;
}

// 외교 관계 아이콘
const RELATION_ICONS: Record<DiplomaticRelationType, string> = {
  alliance: '🤝',
  truce: '🕊️',
  tribute: '💰',
  hostile: '⚔️',
  neutral: '🔸'
};

// 외교 관계 이름
const RELATION_NAMES: Record<DiplomaticRelationType, string> = {
  alliance: '동맹',
  truce: '불가침',
  tribute: '조공',
  hostile: '전쟁 중',
  neutral: '중립'
};

// 외교 관계 색상
const RELATION_COLORS: Record<DiplomaticRelationType, string> = {
  alliance: 'text-green-400 bg-green-900/30 border-green-600/50',
  truce: 'text-blue-400 bg-blue-900/30 border-blue-600/50',
  tribute: 'text-yellow-400 bg-yellow-900/30 border-yellow-600/50',
  hostile: 'text-red-400 bg-red-900/30 border-red-600/50',
  neutral: 'text-gray-400 bg-gray-800/30 border-gray-600/50'
};

// 두 세력 간의 관계 찾기
function getRelation(
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

export default function DiplomacyPanel({ gameState, onDeclareWar }: DiplomacyPanelProps) {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);

  // 생존한 세력 목록 (자신 제외)
  const aliveFactions = Object.entries(gameState.factions)
    .filter(([id]) => id !== gameState.playerFaction && id !== 'player')
    .filter(([id]) => {
      // 최소 1개 지역 보유
      return Object.values(gameState.regions).some(r => r.owner === id);
    })
    .map(([id, faction]) => ({
      ...faction,
      id: id as FactionId,
      relation: getRelation(
        gameState.diplomaticRelations || [],
        gameState.playerFaction,
        id as FactionId
      ),
      regions: Object.values(gameState.regions).filter(r => r.owner === id).length,
      troops: Object.values(gameState.regions)
        .filter(r => r.owner === id)
        .reduce((sum, r) => sum + r.troops, 0)
    }));

  const selectedFactionData = aliveFactions.find(f => f.id === selectedFaction);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-amber-200 mb-4 flex items-center gap-2">
        🏛️ 외교
        <span className="text-sm font-normal text-amber-400/70">(개발 중)</span>
      </h2>

      {/* 세력 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {aliveFactions.map(faction => (
          <button
            key={faction.id}
            onClick={() => setSelectedFaction(
              selectedFaction === faction.id ? null : faction.id
            )}
            className={`p-3 rounded-lg border transition-all text-left ${
              selectedFaction === faction.id
                ? 'border-amber-500 bg-amber-900/30'
                : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-amber-100">{faction.nameKo}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${RELATION_COLORS[faction.relation]}`}>
                {RELATION_ICONS[faction.relation]} {RELATION_NAMES[faction.relation]}
              </span>
            </div>
            <div className="text-sm text-amber-300/70">
              영토 {faction.regions}개 · 병력 {faction.troops.toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 세력 상세 & 외교 액션 */}
      {selectedFactionData && (
        <div className="p-4 bg-stone-800/50 rounded-lg border border-stone-700">
          <h3 className="text-lg font-bold text-amber-200 mb-3">
            {selectedFactionData.nameKo}와의 외교
          </h3>
          
          <div className="mb-4 p-3 bg-stone-900/50 rounded">
            <div className="text-sm text-amber-300/80">
              <p>현재 관계: <span className={RELATION_COLORS[selectedFactionData.relation].split(' ')[0]}>
                {RELATION_ICONS[selectedFactionData.relation]} {RELATION_NAMES[selectedFactionData.relation]}
              </span></p>
            </div>
          </div>

          {/* 외교 명령 버튼 (Coming Soon) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled
              className="p-2 text-sm bg-green-900/30 text-green-300/50 rounded border border-green-700/30 cursor-not-allowed"
            >
              🤝 동맹 제안
              <span className="block text-xs">준비 중</span>
            </button>
            <button
              disabled
              className="p-2 text-sm bg-blue-900/30 text-blue-300/50 rounded border border-blue-700/30 cursor-not-allowed"
            >
              🕊️ 불가침 제안
              <span className="block text-xs">준비 중</span>
            </button>
            <button
              disabled
              className="p-2 text-sm bg-yellow-900/30 text-yellow-300/50 rounded border border-yellow-700/30 cursor-not-allowed"
            >
              💰 조공 제안
              <span className="block text-xs">준비 중</span>
            </button>
            <button
              onClick={() => onDeclareWar?.(selectedFactionData.id)}
              disabled={!onDeclareWar || selectedFactionData.relation === 'hostile'}
              className={`p-2 text-sm rounded border transition-all ${
                selectedFactionData.relation === 'hostile'
                  ? 'bg-red-900/30 text-red-300/50 border-red-700/30 cursor-not-allowed'
                  : 'bg-red-900/50 text-red-200 border-red-600/50 hover:bg-red-800/50 hover:border-red-500'
              }`}
            >
              ⚔️ 선전포고
              {selectedFactionData.relation === 'hostile' && (
                <span className="block text-xs">이미 전쟁 중</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      {!selectedFaction && (
        <div className="text-center text-amber-500/60 py-8">
          <p className="text-2xl mb-2">🏛️</p>
          <p>세력을 선택하여 외교 관계를 확인하세요.</p>
          <p className="text-sm mt-2 text-amber-600/50">
            외교 명령은 다음 업데이트에서 추가됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
