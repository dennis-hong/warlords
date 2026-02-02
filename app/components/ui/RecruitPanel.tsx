'use client';

import { useState } from 'react';
import type { RegionId, FreeGeneral, General } from '../../types';
import { calculateRecruitSuccess } from '../../utils/battle';

interface RecruitPanelProps {
  regionId: RegionId;
  regionName: string;
  freeGenerals: FreeGeneral[];
  regionGenerals: string[];
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-blue-900 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold">🎯 재야 장수 등용 - {regionName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`p-3 text-center ${message.includes('🎉') ? 'bg-green-900' : 'bg-red-900'}`}>
            {message}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 재야 장수 목록 */}
          <div>
            <h3 className="text-sm text-gray-400 mb-2">재야 장수</h3>
            {freeGenerals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">이 지역에 재야 장수가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {freeGenerals.map(fg => {
                  const general = getGeneral(fg.generalId);
                  if (!general) return null;
                  const loyalty = getLoyalty(fg.generalId);
                  
                  return (
                    <button
                      key={fg.generalId}
                      onClick={() => setSelectedTarget(fg.generalId)}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedTarget === fg.generalId
                          ? 'bg-blue-800 ring-2 ring-blue-400'
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
                        </div>
                        <div className="text-right text-xs">
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

          {/* 등용 담당 장수 선택 */}
          {selectedTarget && (
            <div>
              <h3 className="text-sm text-gray-400 mb-2">등용 담당 장수 (매력이 높을수록 유리)</h3>
              <div className="space-y-2">
                {regionGenerals.map(genId => {
                  const general = getGeneral(genId);
                  if (!general) return null;
                  
                  return (
                    <button
                      key={genId}
                      onClick={() => setSelectedRecruiter(genId)}
                      className={`w-full p-3 rounded-lg text-left transition ${
                        selectedRecruiter === genId
                          ? 'bg-green-800 ring-2 ring-green-400'
                          : 'bg-gray-800 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{general.portrait}</span>
                        <div className="flex-1">
                          <div className="font-bold">{general.nameKo}</div>
                          <div className="text-xs text-gray-400">
                            매력: {general.charisma}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 성공률 표시 */}
          {selectedTarget && selectedRecruiter && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-1">등용 성공률</div>
                <div className={`text-3xl font-bold ${
                  getSuccessRate() >= 70 ? 'text-green-400' :
                  getSuccessRate() >= 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {getSuccessRate()}%
                </div>
              </div>
            </div>
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
          <button
            onClick={handleRecruit}
            disabled={!selectedTarget || !selectedRecruiter}
            className={`flex-1 py-3 rounded-lg font-bold ${
              selectedTarget && selectedRecruiter
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            등용 시도
          </button>
        </div>
      </div>
    </div>
  );
}
