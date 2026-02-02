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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-purple-900 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">⛓️ 포로 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`p-3 text-center ${
            message.includes('🎉') ? 'bg-green-900' : 
            message.includes('💀') ? 'bg-red-900' : 'bg-yellow-900'
          }`}>
            {message}
          </div>
        )}

        {/* 확인 다이얼로그 */}
        {confirmAction && selectedPrisoner && (
          <div className="p-4 bg-red-950 border-b border-red-800">
            <p className="text-center mb-3">
              정말 {getGeneral(selectedPrisoner)?.nameKo}을(를) 
              {confirmAction === 'execute' ? ' 처형' : ' 석방'}하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 bg-gray-700 rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={confirmAction === 'execute' ? handleExecute : handleRelease}
                className={`flex-1 py-2 rounded font-bold ${
                  confirmAction === 'execute' 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                확인
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 포로 목록 */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">포로 목록</h3>
            {prisoners.length === 0 ? (
              <p className="text-gray-500 text-center py-8">포로가 없습니다.</p>
            ) : (
              <div className="space-y-2">
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
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedPrisoner === prisoner.generalId
                          ? 'bg-purple-800 ring-2 ring-purple-400'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{general.portrait}</span>
                        <div className="flex-1">
                          <div className="font-bold">{general.nameKo}</div>
                          <div className="text-xs text-gray-400">
                            武{general.might} 知{general.intellect} 政{general.politics} 魅{general.charisma}
                          </div>
                          <div className="text-xs text-gray-500">
                            📍 {getRegionName(prisoner.location)}
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="text-yellow-400">충성: {loyalty}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 등용 담당 장수 선택 */}
          {selectedPrisoner && !confirmAction && (
            <>
              <div>
                <h3 className="text-sm text-gray-400 mb-2">등용 담당 장수</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {playerGenerals.slice(0, 5).map(({ generalId }) => {
                    const general = getGeneral(generalId);
                    if (!general) return null;
                    
                    return (
                      <button
                        key={generalId}
                        onClick={() => setSelectedRecruiter(generalId)}
                        className={`w-full p-2 rounded-lg text-left transition text-sm ${
                          selectedRecruiter === generalId
                            ? 'bg-green-800 ring-2 ring-green-400'
                            : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{general.portrait}</span>
                          <span className="font-bold">{general.nameKo}</span>
                          <span className="text-gray-400 ml-auto">魅{general.charisma}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 성공률 표시 */}
              {selectedRecruiter && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">등용 성공률</div>
                    <div className={`text-2xl font-bold ${
                      getSuccessRate() >= 70 ? 'text-green-400' :
                      getSuccessRate() >= 40 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {getSuccessRate()}%
                    </div>
                  </div>
                </div>
              )}

              {/* 행동 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmAction('release')}
                  className="flex-1 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm"
                >
                  🕊️ 석방
                </button>
                <button
                  onClick={() => setConfirmAction('execute')}
                  className="flex-1 py-2 bg-red-900 rounded-lg hover:bg-red-800 text-sm"
                >
                  💀 처형
                </button>
              </div>
            </>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="p-4 bg-gray-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600"
          >
            닫기
          </button>
          {selectedPrisoner && !confirmAction && (
            <button
              onClick={handleRecruit}
              disabled={!selectedRecruiter}
              className={`flex-1 py-3 rounded-lg font-bold ${
                selectedRecruiter
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🎯 등용 시도
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
