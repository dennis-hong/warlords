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

const RELATION_ICONS: Record<DiplomaticRelationType, string> = {
  alliance: '🤝',
  truce: '🕊️',
  tribute: '💰',
  hostile: '⚔️',
  neutral: '🔸'
};

const RELATION_NAMES: Record<DiplomaticRelationType, string> = {
  alliance: '동맹',
  truce: '불가침',
  tribute: '조공',
  hostile: '전쟁 중',
  neutral: '중립'
};

const RELATION_COLORS: Record<DiplomaticRelationType, string> = {
  alliance: 'text-green-400 bg-green-900/30 border-green-600/50',
  truce: 'text-blue-400 bg-blue-900/30 border-blue-600/50',
  tribute: 'text-yellow-400 bg-yellow-900/30 border-yellow-600/50',
  hostile: 'text-red-400 bg-red-900/30 border-red-600/50',
  neutral: 'text-gray-400 bg-gray-800/30 border-gray-600/50'
};

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
  let remainingTurns: number | undefined;
  if (relation.duration && relation.startTurn) {
    remainingTurns = relation.duration - (0);
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

  const aliveFactions = Object.entries(gameState.factions)
    .filter(([id]) => id !== gameState.playerFaction && id !== 'player')
    .filter(([id]) => {
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

  const handleProposalResponse = (proposalId: string, accept: boolean) => {
    if (!onHandleProposal) return;
    const result = onHandleProposal(proposalId, accept);
    onShowToast?.(result.message, result.success ? 'success' : 'info');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gold flex items-center gap-1.5 title-glow">
          🏛️ 외교
        </h2>
        <span className="text-xs text-silk/50">행동 {gameState.actionsRemaining}회</span>
      </div>

      {/* AI 외교 제안 */}
      {pendingProposals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-amber-300">📜 외교 제안</h3>
          {pendingProposals.map(proposal => {
            const fromFaction = gameState.factions[proposal.from];
            const typeNames: Record<string, string> = { alliance: '동맹', truce: '불가침 조약' };
            const typeIcons: Record<string, string> = { alliance: '🤝', truce: '🕊️' };
            
            return (
              <div key={proposal.id} className="p-3 bg-amber-900/30 border border-amber-600/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl shrink-0">{typeIcons[proposal.type] || '📜'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-100 font-medium text-sm">
                      {fromFaction?.nameKo || proposal.from}의 {typeNames[proposal.type] || '외교'} 제안
                    </p>
                    <p className="text-xs text-amber-300/70 mt-0.5">
                      {proposal.type === 'alliance' 
                        ? '"함께 천하를 도모하지 않겠소?"'
                        : `"${proposal.duration || 5}턴간 서로 존중합시다."`
                      }
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleProposalResponse(proposal.id, true)}
                        className="min-h-[40px] px-4 py-1.5 text-sm bg-green-700/50 text-green-200 rounded active:scale-95 transition-transform"
                      >
                        ✅ 수락
                      </button>
                      <button
                        onClick={() => handleProposalResponse(proposal.id, false)}
                        className="min-h-[40px] px-4 py-1.5 text-sm bg-red-700/50 text-red-200 rounded active:scale-95 transition-transform"
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
      <div className="space-y-1.5">
        {aliveFactions.map(faction => (
          <button
            key={faction.id}
            onClick={() => setSelectedFaction(selectedFaction === faction.id ? null : faction.id)}
            className={`w-full min-h-[52px] p-3 rounded-lg border transition-all text-left active:scale-[0.98] ${
              selectedFaction === faction.id
                ? 'border-amber-500 bg-amber-900/30'
                : 'border-stone-700 bg-stone-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <span className="font-medium text-amber-100 text-sm">{faction.nameKo}</span>
                <div className="text-xs text-amber-300/70">
                  영토 {faction.regions}개 · 병력 {faction.troops.toLocaleString()}
                </div>
              </div>
              <span className={`text-[10px] px-2 py-1 rounded border shrink-0 ml-2 ${RELATION_COLORS[faction.relation]}`}>
                {RELATION_ICONS[faction.relation]} {RELATION_NAMES[faction.relation]}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 세력 외교 액션 */}
      {selectedFactionData && (
        <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700 animate-slide-up">
          <h3 className="text-sm font-bold text-amber-200 mb-2">
            {selectedFactionData.nameKo}와의 외교
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {/* 동맹 제안 */}
            <button
              onClick={() => handleDiplomaticAction(
                () => onProposeAlliance?.(selectedFactionData.id),
                '동맹 제안'
              )}
              disabled={
                !onProposeAlliance || isProcessing || gameState.actionsRemaining <= 0 ||
                selectedFactionData.relation === 'alliance' || selectedFactionData.relation === 'hostile'
              }
              className={`min-h-[48px] p-2.5 text-sm rounded border transition-all active:scale-95 ${
                selectedFactionData.relation === 'alliance' || selectedFactionData.relation === 'hostile' || gameState.actionsRemaining <= 0
                  ? 'bg-gray-900/30 text-gray-300/50 border-gray-700/30 cursor-not-allowed'
                  : 'bg-green-900/50 text-green-200 border-green-600/50 active:bg-green-800/50'
              }`}
            >
              🤝 동맹
              {selectedFactionData.relation === 'alliance' && <span className="block text-[10px]">이미 동맹</span>}
            </button>

            {/* 불가침 */}
            <button
              onClick={() => handleDiplomaticAction(
                () => onProposeTruce?.(selectedFactionData.id),
                '불가침 제안'
              )}
              disabled={
                !onProposeTruce || isProcessing || gameState.actionsRemaining <= 0 ||
                selectedFactionData.relation === 'alliance' || selectedFactionData.relation === 'truce'
              }
              className={`min-h-[48px] p-2.5 text-sm rounded border transition-all active:scale-95 ${
                selectedFactionData.relation === 'alliance' || selectedFactionData.relation === 'truce' || gameState.actionsRemaining <= 0
                  ? 'bg-gray-900/30 text-gray-300/50 border-gray-700/30 cursor-not-allowed'
                  : 'bg-blue-900/50 text-blue-200 border-blue-600/50 active:bg-blue-800/50'
              }`}
            >
              🕊️ 불가침
              {selectedFactionData.relation === 'truce' && <span className="block text-[10px]">이미 불가침</span>}
            </button>

            {/* 동맹 파기 */}
            {selectedFactionData.relation === 'alliance' && (
              <button
                onClick={() => handleDiplomaticAction(
                  () => onBreakAlliance?.(selectedFactionData.id),
                  '동맹 파기'
                )}
                disabled={!onBreakAlliance || isProcessing}
                className="min-h-[48px] p-2.5 text-sm bg-orange-900/50 text-orange-200 rounded border border-orange-600/50 active:scale-95 transition-all"
              >
                💔 동맹 파기
              </button>
            )}

            {/* 선전포고 */}
            <button
              onClick={() => {
                onDeclareWar?.(selectedFactionData.id);
                onShowToast?.(`⚔️ ${selectedFactionData.nameKo}에 선전포고!`, 'info');
              }}
              disabled={!onDeclareWar || selectedFactionData.relation === 'hostile'}
              className={`min-h-[48px] p-2.5 text-sm rounded border transition-all active:scale-95 ${
                selectedFactionData.relation === 'hostile'
                  ? 'bg-red-900/30 text-red-300/50 border-red-700/30 cursor-not-allowed'
                  : 'bg-red-900/50 text-red-200 border-red-600/50 active:bg-red-800/50'
              }`}
            >
              ⚔️ 선전포고
              {selectedFactionData.relation === 'hostile' && <span className="block text-[10px]">이미 전쟁 중</span>}
            </button>
          </div>
        </div>
      )}

      {/* 안내 문구 */}
      {!selectedFaction && pendingProposals.length === 0 && (
        <div className="text-center text-amber-500/60 py-6">
          <p className="text-xl mb-1">🏛️</p>
          <p className="text-sm">세력을 선택하여 외교를 시작하세요</p>
        </div>
      )}
    </div>
  );
}
