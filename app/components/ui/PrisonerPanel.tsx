'use client';

import { useState } from 'react';
import type { Prisoner, General, RegionId } from '../../types';
import { calculateRecruitSuccess } from '../../utils/battle';

interface PrisonerPanelProps {
  prisoners: Prisoner[];
  playerGenerals: { generalId: string; regionId: RegionId }[];
  getGeneral: (id: string) => General | null;
  getRegionName: (id: RegionId) => string;
  getLoyalty: (id: string) => number;
  onRecruit: (prisonerId: string, recruiterId: string) => { success: boolean; message: string };
  onExecute: (prisonerId: string) => { success: boolean; message: string };
  onRelease: (prisonerId: string) => { success: boolean; message: string };
  onClose: () => void;
}

export function PrisonerPanel({
  prisoners,
  playerGenerals,
  getGeneral,
  getRegionName,
  getLoyalty,
  onRecruit,
  onExecute,
  onRelease,
  onClose
}: PrisonerPanelProps) {
  const [selectedPrisoner, setSelectedPrisoner] = useState<string | null>(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'execute' | 'release' | null>(null);

  const handleRecruit = () => {
    if (!selectedPrisoner || !selectedRecruiter) return;
    const result = onRecruit(selectedPrisoner, selectedRecruiter);
    setMessage(result.message);
    if (result.success) {
      setSelectedPrisoner(null);
      setSelectedRecruiter(null);
    }
  };

  const handleExecute = () => {
    if (!selectedPrisoner) return;
    const result = onExecute(selectedPrisoner);
    setMessage(result.message);
    setSelectedPrisoner(null);
    setConfirmAction(null);
  };

  const handleRelease = () => {
    if (!selectedPrisoner) return;
    const result = onRelease(selectedPrisoner);
    setMessage(result.message);
    setSelectedPrisoner(null);
    setConfirmAction(null);
  };

  const getSuccessRate = () => {
    if (!selectedPrisoner || !selectedRecruiter) return 0;
    const recruiter = getGeneral(selectedRecruiter);
    if (!recruiter) return 0;
    const loyalty = getLoyalty(selectedPrisoner);
    return Math.round(calculateRecruitSuccess(recruiter.charisma, loyalty, 10));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-purple-900 to-purple-950 px-4 py-3 flex justify-between items-center shrink-0">
        <h2 className="text-base font-bold text-purple-100">⛓️ 포로 관리</h2>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-white text-2xl">
          ×
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`px-4 py-2.5 text-sm text-center ${
          message.includes('🎉') ? 'bg-green-900' : 
          message.includes('💀') ? 'bg-red-900' : 'bg-yellow-900'
        }`}>
          {message}
        </div>
      )}

      {/* 확인 다이얼로그 */}
      {confirmAction && selectedPrisoner && (
        <div className="p-3 bg-red-950 border-b border-red-800">
          <p className="text-center text-sm mb-2.5">
            정말 {getGeneral(selectedPrisoner)?.nameKo}을(를) 
            {confirmAction === 'execute' ? ' 처형' : ' 석방'}하시겠습니까?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmAction(null)}
              className="flex-1 min-h-[44px] py-2 bg-gray-700 rounded active:scale-[0.97] text-sm"
            >
              취소
            </button>
            <button
              onClick={confirmAction === 'execute' ? handleExecute : handleRelease}
              className={`flex-1 min-h-[44px] py-2 rounded font-bold text-sm active:scale-[0.97] ${
                confirmAction === 'execute' ? 'bg-red-600' : 'bg-green-600'
              }`}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div>
          <h3 className="text-xs text-gray-400 mb-1.5">포로 목록</h3>
          {prisoners.length === 0 ? (
            <p className="text-gray-500 text-center py-6 text-sm">포로가 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {prisoners.map(prisoner => {
                const general = getGeneral(prisoner.generalId);
                if (!general) return null;
                const loyalty = getLoyalty(prisoner.generalId);
                
                return (
                  <button
                    key={prisoner.generalId}
                    onClick={() => {
                      setSelectedPrisoner(prisoner.generalId);
                      setConfirmAction(null);
                    }}
                    className={`w-full min-h-[52px] p-3 rounded-lg text-left transition active:scale-[0.98] ${
                      selectedPrisoner === prisoner.generalId
                        ? 'bg-purple-800 ring-2 ring-purple-400'
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0">{general.portrait}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{general.nameKo}</div>
                        <div className="text-[10px] text-gray-400">
                          武{general.might} 知{general.intellect} 政{general.politics} 魅{general.charisma}
                        </div>
                        <div className="text-[10px] text-gray-500">📍 {getRegionName(prisoner.location)}</div>
                      </div>
                      <div className="text-right text-[10px] shrink-0">
                        <div className="text-yellow-400">충성: {loyalty}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 등용 담당 */}
        {selectedPrisoner && !confirmAction && (
          <>
            <div>
              <h3 className="text-xs text-gray-400 mb-1.5">등용 담당 장수</h3>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {playerGenerals.slice(0, 5).map(({ generalId }) => {
                  const general = getGeneral(generalId);
                  if (!general) return null;
                  return (
                    <button
                      key={generalId}
                      onClick={() => setSelectedRecruiter(generalId)}
                      className={`w-full min-h-[44px] p-2 rounded-lg text-left transition text-sm active:scale-[0.98] ${
                        selectedRecruiter === generalId
                          ? 'bg-green-800 ring-2 ring-green-400'
                          : 'bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{general.portrait}</span>
                        <span className="font-bold flex-1">{general.nameKo}</span>
                        <span className="text-gray-400 text-xs">魅{general.charisma}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 성공률 */}
            {selectedRecruiter && (
              <div className="bg-gray-800 rounded-lg p-2.5 text-center">
                <div className="text-xs text-gray-400">등용 성공률</div>
                <div className={`text-xl font-bold ${
                  getSuccessRate() >= 70 ? 'text-green-400' :
                  getSuccessRate() >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {getSuccessRate()}%
                </div>
              </div>
            )}

            {/* 행동 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction('release')}
                className="flex-1 min-h-[44px] py-2 bg-gray-700 rounded-lg active:scale-[0.97] text-sm"
              >
                🕊️ 석방
              </button>
              <button
                onClick={() => setConfirmAction('execute')}
                className="flex-1 min-h-[44px] py-2 bg-red-900 rounded-lg active:scale-[0.97] text-sm"
              >
                💀 처형
              </button>
            </div>
          </>
        )}
      </div>

      {/* 하단 */}
      <div className="p-3 bg-gray-800/90 flex gap-2 safe-area-bottom shrink-0">
        <button
          onClick={onClose}
          className="flex-1 min-h-[48px] py-3 bg-gray-700 rounded-lg active:scale-[0.97] text-sm"
        >
          닫기
        </button>
        {selectedPrisoner && !confirmAction && (
          <button
            onClick={handleRecruit}
            disabled={!selectedRecruiter}
            className={`flex-1 min-h-[48px] py-3 rounded-lg font-bold text-sm active:scale-[0.97] ${
              selectedRecruiter ? 'bg-purple-600' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            🎯 등용 시도
          </button>
        )}
      </div>
    </div>
  );
}
