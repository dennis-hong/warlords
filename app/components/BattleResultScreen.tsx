'use client';

import { useState } from 'react';
import type { BattleResultData, Region, General, GeneralFate } from '../types';
import { GENERALS } from '../constants/gameData';

interface BattleResultScreenProps {
  result: BattleResultData;
  regions: Record<string, Region>;
  onRecruitPrisoner: (prisonerId: string, recruiterId: string) => { success: boolean; message: string };
  onExecutePrisoner: (prisonerId: string) => { success: boolean; message: string };
  onReleasePrisoner: (prisonerId: string) => { success: boolean; message: string };
  playerGenerals: { generalId: string; regionId: string }[];
  getGeneral: (id: string) => General | null;
  onClose: () => void;
}

export default function BattleResultScreen({
  result,
  regions,
  onRecruitPrisoner,
  onExecutePrisoner,
  onReleasePrisoner,
  playerGenerals,
  getGeneral,
  onClose
}: BattleResultScreenProps) {
  const { outcome, conqueredRegionId, sourceRegionId, pendingPrisoners } = result;
  const isVictory = outcome.winner === 'player';
  
  // 포로 처리 상태 (어떤 포로를 처리했는지)
  const [processedPrisoners, setProcessedPrisoners] = useState<Set<string>>(new Set());
  const [prisonerMessages, setPrisonerMessages] = useState<Record<string, { text: string; type: 'success' | 'error' | 'info' }>>({});
  
  // 포로 처리 UI 표시 여부
  const [showPrisonerActions, setShowPrisonerActions] = useState(false);
  const [selectedPrisoner, setSelectedPrisoner] = useState<string | null>(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);

  const targetRegion = conqueredRegionId ? regions[conqueredRegionId] : null;
  const sourceRegion = regions[sourceRegionId];

  // 미처리 포로 목록
  const unprocessedPrisoners = pendingPrisoners.filter(p => !processedPrisoners.has(p.generalId));
  const hasPrisoners = pendingPrisoners.length > 0;

  // 포로 등용 시도
  const handleRecruit = () => {
    if (!selectedPrisoner || !selectedRecruiter) return;
    
    const result = onRecruitPrisoner(selectedPrisoner, selectedRecruiter);
    setPrisonerMessages(prev => ({
      ...prev,
      [selectedPrisoner]: { text: result.message, type: result.success ? 'success' : 'error' }
    }));
    
    if (result.success) {
      setProcessedPrisoners(prev => new Set([...prev, selectedPrisoner]));
    }
    setSelectedPrisoner(null);
    setSelectedRecruiter(null);
    setShowPrisonerActions(false);
  };

  // 포로 처형
  const handleExecute = (prisonerId: string) => {
    const result = onExecutePrisoner(prisonerId);
    setPrisonerMessages(prev => ({
      ...prev,
      [prisonerId]: { text: result.message, type: result.success ? 'info' : 'error' }
    }));
    if (result.success) {
      setProcessedPrisoners(prev => new Set([...prev, prisonerId]));
    }
  };

  // 포로 석방
  const handleRelease = (prisonerId: string) => {
    const result = onReleasePrisoner(prisonerId);
    setPrisonerMessages(prev => ({
      ...prev,
      [prisonerId]: { text: result.message, type: result.success ? 'info' : 'error' }
    }));
    if (result.success) {
      setProcessedPrisoners(prev => new Set([...prev, prisonerId]));
    }
  };

  // 장수 운명 표시
  const renderGeneralFates = (fates: GeneralFate[], label: string, isEnemy: boolean) => {
    const significantFates = fates.filter(f => f.fate !== 'alive');
    if (significantFates.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm text-silk/60 mb-2">{label}</h4>
        <div className="space-y-1">
          {significantFates.map(fate => {
            const general = getGeneral(fate.generalId) || GENERALS[fate.generalId];
            const fateIcons: Record<string, string> = {
              dead: '💀',
              captured: '⛓️',
              escaped: '💨'
            };
            const fateLabels: Record<string, string> = {
              dead: '전사',
              captured: '포로',
              escaped: '도주'
            };
            return (
              <div key={fate.generalId} className={`text-sm ${
                fate.fate === 'dead' ? 'text-crimson-light' :
                fate.fate === 'captured' ? 'text-bronze' :
                'text-silk/50'
              }`}>
                {fateIcons[fate.fate]} {general?.nameKo || fate.generalId} - {fateLabels[fate.fate]}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="dynasty-card rounded-xl p-6 w-full max-w-md animate-scale-in">
        {/* 승리/패배 헤더 */}
        <div className="text-center mb-6">
          <div className={`text-5xl font-bold mb-3 ${
            isVictory ? 'text-jade-light winner-glow' : 'text-crimson-light'
          }`}>
            {isVictory ? '🎉 승리!' : '💀 패배...'}
          </div>
          
          {isVictory && targetRegion ? (
            <p className="text-silk/70">
              <span className="text-gold font-bold">{targetRegion.nameKo}</span>을(를) 점령했습니다!
            </p>
          ) : (
            <p className="text-silk/70">
              아군이 <span className="text-crimson-light">{sourceRegion?.nameKo}</span>으로 퇴각합니다...
            </p>
          )}
        </div>

        {/* 전투 통계 */}
        <div className="divider-gold my-4"></div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-jade/10 rounded-lg">
            <div className="text-xs text-silk/50 mb-1">아군 피해</div>
            <div className="text-lg font-bold text-jade-light">
              ⚔️ {outcome.playerTroopsLost.toLocaleString()}명
            </div>
          </div>
          <div className="text-center p-3 bg-crimson/10 rounded-lg">
            <div className="text-xs text-silk/50 mb-1">적군 피해</div>
            <div className="text-lg font-bold text-crimson-light">
              💀 {outcome.enemyTroopsLost.toLocaleString()}명
            </div>
          </div>
        </div>

        {/* 장수 운명 */}
        {outcome.playerGeneralFates && renderGeneralFates(outcome.playerGeneralFates, '아군 장수', false)}
        {outcome.enemyGeneralFates && renderGeneralFates(outcome.enemyGeneralFates, '적군 장수', true)}

        {/* 포로 처리 섹션 */}
        {isVictory && hasPrisoners && (
          <>
            <div className="divider-gold my-4"></div>
            
            <div className="mb-4">
              <h3 className="text-gold font-bold mb-3">⛓️ 포로 처리</h3>
              
              {unprocessedPrisoners.length > 0 ? (
                <div className="space-y-3">
                  {unprocessedPrisoners.map(prisoner => {
                    const general = getGeneral(prisoner.generalId) || GENERALS[prisoner.generalId];
                    const message = prisonerMessages[prisoner.generalId];
                    
                    return (
                      <div key={prisoner.generalId} className="bg-wood/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{general?.portrait || '👤'}</span>
                            <div>
                              <div className="font-bold text-silk">{general?.nameKo || prisoner.generalId}</div>
                              <div className="text-xs text-silk/50">
                                무력 {general?.might} | 지력 {general?.intellect} | 정치 {general?.politics}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {message && (
                          <div className={`text-sm mb-2 ${
                            message.type === 'success' ? 'text-jade-light' :
                            message.type === 'error' ? 'text-crimson-light' :
                            'text-silk/70'
                          }`}>
                            {message.text}
                          </div>
                        )}
                        
                        {selectedPrisoner === prisoner.generalId ? (
                          /* 등용 장수 선택 UI */
                          <div className="space-y-2">
                            <div className="text-sm text-silk/70">등용을 시도할 장수를 선택하세요:</div>
                            <select
                              value={selectedRecruiter || ''}
                              onChange={(e) => setSelectedRecruiter(e.target.value)}
                              className="w-full bg-night border border-gold/30 rounded px-3 py-2 text-silk text-sm"
                            >
                              <option value="">장수 선택...</option>
                              {playerGenerals.map(pg => {
                                const gen = getGeneral(pg.generalId);
                                return (
                                  <option key={pg.generalId} value={pg.generalId}>
                                    {gen?.nameKo || pg.generalId} (매력: {gen?.charisma || 0})
                                  </option>
                                );
                              })}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={handleRecruit}
                                disabled={!selectedRecruiter}
                                className="btn-peace flex-1 py-2 rounded text-sm disabled:opacity-50"
                              >
                                등용 시도
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPrisoner(null);
                                  setSelectedRecruiter(null);
                                }}
                                className="btn-wood px-4 py-2 rounded text-sm"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* 포로 행동 버튼 */
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedPrisoner(prisoner.generalId)}
                              className="btn-peace flex-1 py-2 rounded text-sm"
                            >
                              🤝 등용
                            </button>
                            <button
                              onClick={() => handleExecute(prisoner.generalId)}
                              className="btn-war flex-1 py-2 rounded text-sm"
                            >
                              ⚔️ 처형
                            </button>
                            <button
                              onClick={() => handleRelease(prisoner.generalId)}
                              className="btn-wood flex-1 py-2 rounded text-sm"
                            >
                              🕊️ 석방
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-silk/50 text-center py-2">
                  모든 포로를 처리했습니다.
                </p>
              )}
            </div>
          </>
        )}

        {/* 처리된 포로 메시지 표시 */}
        {Object.keys(prisonerMessages).length > 0 && processedPrisoners.size > 0 && (
          <div className="mb-4 p-3 bg-wood/20 rounded-lg">
            <div className="text-sm text-silk/70">
              {Array.from(processedPrisoners).map(id => {
                const msg = prisonerMessages[id];
                const gen = getGeneral(id) || GENERALS[id];
                return msg ? (
                  <div key={id} className={
                    msg.type === 'success' ? 'text-jade-light' :
                    msg.type === 'error' ? 'text-crimson-light' :
                    'text-silk/70'
                  }>
                    • {msg.text}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className={`w-full py-3 rounded-lg text-lg font-bold ${
            isVictory ? 'btn-gold' : 'btn-war'
          }`}
        >
          {isVictory && targetRegion 
            ? `🏯 ${targetRegion.nameKo} 내정으로` 
            : '확인'
          }
        </button>
        
        {isVictory && unprocessedPrisoners.length > 0 && (
          <p className="text-xs text-silk/40 text-center mt-2">
            * 처리하지 않은 포로는 포로 관리에서 처리할 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
