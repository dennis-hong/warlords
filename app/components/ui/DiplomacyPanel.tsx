'use client';

import React, { useState } from 'react';
import type { 
  GameState, 
  FactionId, 
  DiplomaticRelationType,
  DiplomaticRelation,
  DiplomaticProposal
} from '../../types';

interface DiplomacyPanelProps {
  gameState: GameState;
  onDeclareWar?: (targetFaction: FactionId) => void;
  onProposeAlliance?: (targetFaction: FactionId) => { success: boolean; message: string };
  onProposeTruce?: (targetFaction: FactionId) => { success: boolean; message: string };
  onBreakAlliance?: (targetFaction: FactionId) => { success: boolean; message: string };
  onHandleProposal?: (proposalId: string, accept: boolean) => { success: boolean; message: string };
  pendingProposals?: DiplomaticProposal[];
  onShowToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
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
): { type: DiplomaticRelationType; remainingTurns?: number } {
  const relation = relations.find(r =>
    (r.faction1 === faction1 && r.faction2 === faction2) ||
    (r.faction1 === faction2 && r.faction2 === faction1)
  );
  if (!relation) return { type: 'neutral' };
  
  // 남은 턴 계산 (불가침의 경우)
  let remainingTurns: number | undefined;
  if (relation.duration && relation.startTurn) {
    remainingTurns = relation.duration - (/* 현재 턴 - 시작 턴 */ 0);
  }
  
  return { type: relation.type, remainingTurns };
}

export default function DiplomacyPanel({ 
  gameState, 
  onDeclareWar,
  onProposeAlliance,
  onProposeTruce,
  onBreakAlliance,
  onHandleProposal,
  pendingProposals = [],
  onShowToast
}: DiplomacyPanelProps) {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 생존한 세력 목록 (자신 제외)
  const aliveFactions = Object.entries(gameState.factions)
    .filter(([id]) => id !== gameState.playerFaction && id !== 'player')
    .filter(([id]) => {
      // 최소 1개 지역 보유
      return Object.values(gameState.regions).some(r => r.owner === id);
    })
    .map(([id, faction]) => {
      const { type: relation, remainingTurns } = getRelation(
        gameState.diplomaticRelations || [],
        gameState.playerFaction,
        id as FactionId
      );
      return {
        ...faction,
        id: id as FactionId,
        relation,
        remainingTurns,
        regions: Object.values(gameState.regions).filter(r => r.owner === id).length,
        troops: Object.values(gameState.regions)
          .filter(r => r.owner === id)
          .reduce((sum, r) => sum + r.troops, 0)
      };
    });

  const selectedFactionData = aliveFactions.find(f => f.id === selectedFaction);

  // 외교 행동 처리
  const handleDiplomaticAction = async (
    action: () => { success: boolean; message: string } | undefined,
    actionName: string
  ) => {
    if (!action || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const result = action();
      if (result) {
        onShowToast?.(result.message, result.success ? 'success' : 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // AI 제안 처리
  const handleProposalResponse = (proposalId: string, accept: boolean) => {
    if (!onHandleProposal) return;
    const result = onHandleProposal(proposalId, accept);
    onShowToast?.(result.message, result.success ? 'success' : 'info');
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-amber-200 mb-4 flex items-center gap-2">
        🏛️ 외교
      </h2>

      {/* AI 외교 제안 알림 */}
      {pendingProposals.length > 0 && (
        <div className="mb-4 space-y-2">
          <h3 className="text-sm font-medium text-amber-300 mb-2">📜 외교 제안</h3>
          {pendingProposals.map(proposal => {
            const fromFaction = gameState.factions[proposal.from];
            const proposalTypeNames: Record<string, string> = {
              alliance: '동맹',
              truce: '불가침 조약'
            };
            const proposalIcons: Record<string, string> = {
              alliance: '🤝',
              truce: '🕊️'
            };
            
            return (
              <div 
                key={proposal.id}
                className="p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{proposalIcons[proposal.type] || '📜'}</span>
                  <div className="flex-1">
                    <p className="text-amber-100 font-medium">
                      {fromFaction?.nameKo || proposal.from}의 {proposalTypeNames[proposal.type] || '외교'} 제안
                    </p>
                    <p className="text-sm text-amber-300/70 mt-1">
                      {proposal.type === 'alliance' 
                        ? '"함께 천하를 도모하지 않겠소?"'
                        : `"${proposal.duration || 5}턴간 서로의 영토를 존중합시다."`
                      }
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleProposalResponse(proposal.id, true)}
                        className="px-3 py-1 text-sm bg-green-700/50 text-green-200 rounded hover:bg-green-600/50 transition-colors"
                      >
                        ✅ 수락
                      </button>
                      <button
                        onClick={() => handleProposalResponse(proposal.id, false)}
                        className="px-3 py-1 text-sm bg-red-700/50 text-red-200 rounded hover:bg-red-600/50 transition-colors"
                      >
                        ❌ 거절
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                {faction.remainingTurns !== undefined && faction.relation === 'truce' && (
                  <span className="ml-1">({faction.remainingTurns}턴)</span>
                )}
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
              <p className="mt-1 text-amber-500/60">행동력: {gameState.actionsRemaining} 남음</p>
            </div>
          </div>

          {/* 외교 명령 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            {/* 동맹 제안 */}
            <button
              onClick={() => handleDiplomaticAction(
                () => onProposeAlliance?.(selectedFactionData.id),
                '동맹 제안'
              )}
              disabled={
                !onProposeAlliance || 
                isProcessing ||
                gameState.actionsRemaining <= 0 ||
                selectedFactionData.relation === 'alliance' ||
                selectedFactionData.relation === 'hostile'
              }
              className={`p-2 text-sm rounded border transition-all ${
                selectedFactionData.relation === 'alliance'
                  ? 'bg-green-900/30 text-green-300/50 border-green-700/30 cursor-not-allowed'
                  : selectedFactionData.relation === 'hostile' || gameState.actionsRemaining <= 0
                  ? 'bg-gray-900/30 text-gray-300/50 border-gray-700/30 cursor-not-allowed'
                  : 'bg-green-900/50 text-green-200 border-green-600/50 hover:bg-green-800/50 hover:border-green-500'
              }`}
            >
              🤝 동맹 제안
              {selectedFactionData.relation === 'alliance' && (
                <span className="block text-xs">이미 동맹</span>
              )}
            </button>

            {/* 불가침 제안 */}
            <button
              onClick={() => handleDiplomaticAction(
                () => onProposeTruce?.(selectedFactionData.id),
                '불가침 제안'
              )}
              disabled={
                !onProposeTruce ||
                isProcessing ||
                gameState.actionsRemaining <= 0 ||
                selectedFactionData.relation === 'alliance' ||
                selectedFactionData.relation === 'truce'
              }
              className={`p-2 text-sm rounded border transition-all ${
                selectedFactionData.relation === 'alliance' || selectedFactionData.relation === 'truce'
                  ? 'bg-blue-900/30 text-blue-300/50 border-blue-700/30 cursor-not-allowed'
                  : gameState.actionsRemaining <= 0
                  ? 'bg-gray-900/30 text-gray-300/50 border-gray-700/30 cursor-not-allowed'
                  : 'bg-blue-900/50 text-blue-200 border-blue-600/50 hover:bg-blue-800/50 hover:border-blue-500'
              }`}
            >
              🕊️ 불가침 제안
              {selectedFactionData.relation === 'truce' && (
                <span className="block text-xs">이미 불가침</span>
              )}
            </button>

            {/* 동맹 파기 */}
            {selectedFactionData.relation === 'alliance' && (
              <button
                onClick={() => handleDiplomaticAction(
                  () => onBreakAlliance?.(selectedFactionData.id),
                  '동맹 파기'
                )}
                disabled={!onBreakAlliance || isProcessing}
                className="p-2 text-sm bg-orange-900/50 text-orange-200 rounded border border-orange-600/50 hover:bg-orange-800/50 hover:border-orange-500 transition-all"
              >
                💔 동맹 파기
              </button>
            )}

            {/* 선전포고 */}
            <button
              onClick={() => {
                onDeclareWar?.(selectedFactionData.id);
                onShowToast?.(`⚔️ ${selectedFactionData.nameKo}에 선전포고했습니다!`, 'info');
              }}
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
      {!selectedFaction && pendingProposals.length === 0 && (
        <div className="text-center text-amber-500/60 py-8">
          <p className="text-2xl mb-2">🏛️</p>
          <p>세력을 선택하여 외교 관계를 확인하세요.</p>
          <p className="text-sm mt-2 text-amber-600/50">
            AI 세력들이 외교 제안을 보내올 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}
