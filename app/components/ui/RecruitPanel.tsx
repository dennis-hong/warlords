'use client';

import { useState } from 'react';
import type { RegionId, FreeGeneral, General } from '../../types';
import { calculateRecruitSuccess } from '../../utils/battle';

interface RecruitPanelProps {
  regionId: RegionId;
  regionName: string;
  freeGenerals: FreeGeneral[];
  regionGenerals: string[];
  actionsRemaining: number;
  getGeneral: (id: string) => General | null;
  getLoyalty: (id: string) => number;
  onRecruit: (generalId: string, recruiterId: string) => { success: boolean; message: string };
  onClose: () => void;
}

export function RecruitPanel({
  regionId,
  regionName,
  freeGenerals,
  regionGenerals,
  actionsRemaining,
  getGeneral,
  getLoyalty,
  onRecruit,
  onClose
}: RecruitPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleRecruit = () => {
    if (!selectedTarget || !selectedRecruiter) return;
    const result = onRecruit(selectedTarget, selectedRecruiter);
    setMessage(result.message);
    if (result.success) {
      setSelectedTarget(null);
      setSelectedRecruiter(null);
    }
  };

  const getSuccessRate = () => {
    if (!selectedTarget || !selectedRecruiter) return 0;
    const recruiter = getGeneral(selectedRecruiter);
    const target = getGeneral(selectedTarget);
    const freeGeneral = freeGenerals.find(fg => fg.generalId === selectedTarget);
    if (!recruiter || !target || !freeGeneral) return 0;
    const loyalty = getLoyalty(selectedTarget);
    return Math.round(calculateRecruitSuccess(recruiter.charisma, loyalty, freeGeneral.recruitDifficulty));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col z-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-950 px-4 py-3 flex justify-between items-center shrink-0 safe-area-top">
        <div>
          <h2 className="text-base font-bold text-blue-100">🎯 등용 - {regionName}</h2>
          <p className={`text-xs ${actionsRemaining > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            행동력: {actionsRemaining}회
          </p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-gray-400 active:text-white text-2xl">
          ×
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`px-4 py-2.5 text-sm text-center ${message.includes('🎉') ? 'bg-green-900' : 'bg-red-900'}`}>
          {message}
        </div>
      )}

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 재야 장수 목록 */}
        <div>
          <h3 className="text-xs text-gray-400 mb-1.5">재야 장수</h3>
          {freeGenerals.length === 0 ? (
            <p className="text-gray-500 text-center py-4 text-sm">이 지역에 재야 장수가 없습니다.</p>
          ) : (
            <div className="space-y-1.5">
              {freeGenerals.map(fg => {
                const general = getGeneral(fg.generalId);
                if (!general) return null;
                const loyalty = getLoyalty(fg.generalId);
                
                return (
                  <button
                    key={fg.generalId}
                    onClick={() => setSelectedTarget(fg.generalId)}
                    className={`w-full min-h-[52px] p-3 rounded-lg text-left transition active:scale-[0.98] ${
                      selectedTarget === fg.generalId
                        ? 'bg-blue-800 ring-2 ring-blue-400'
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
                      </div>
                      <div className="text-right text-[10px] shrink-0">
                        <div className="text-yellow-400">충성: {loyalty}</div>
                        <div className="text-gray-400">난이도: +{fg.recruitDifficulty}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 등용 담당 장수 */}
        {selectedTarget && (
          <div>
            <h3 className="text-xs text-gray-400 mb-1.5">등용 담당 (매력↑ 유리)</h3>
            <div className="space-y-1.5">
              {regionGenerals.map(genId => {
                const general = getGeneral(genId);
                if (!general) return null;
                return (
                  <button
                    key={genId}
                    onClick={() => setSelectedRecruiter(genId)}
                    className={`w-full min-h-[48px] p-2.5 rounded-lg text-left transition active:scale-[0.98] ${
                      selectedRecruiter === genId
                        ? 'bg-green-800 ring-2 ring-green-400'
                        : 'bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{general.portrait}</span>
                      <span className="font-bold text-sm flex-1">{general.nameKo}</span>
                      <span className="text-gray-400 text-xs">魅 {general.charisma}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 성공률 */}
        {selectedTarget && selectedRecruiter && (
          <div className="bg-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">등용 성공률</div>
            <div className={`text-2xl font-bold ${
              getSuccessRate() >= 70 ? 'text-green-400' :
              getSuccessRate() >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {getSuccessRate()}%
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="p-3 bg-gray-800/90 flex gap-2 safe-area-bottom shrink-0">
        <button
          onClick={onClose}
          className="flex-1 min-h-[48px] py-3 bg-gray-700 rounded-lg active:scale-[0.97] text-sm"
        >
          닫기
        </button>
        <button
          onClick={handleRecruit}
          disabled={!selectedTarget || !selectedRecruiter}
          className={`flex-1 min-h-[48px] py-3 rounded-lg font-bold text-sm active:scale-[0.97] ${
            selectedTarget && selectedRecruiter
              ? 'bg-blue-600'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          등용 시도
        </button>
      </div>
    </div>
  );
}
