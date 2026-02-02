'use client';

import { useState } from 'react';
import { FACTION_DETAILS, type FactionDetail } from '../constants/worldData';
import { GENERALS } from '../constants/gameData';
import type { FactionId } from '../types';

// 플레이어가 선택 가능한 세력 ID 목록 (9개)
const PLAYABLE_FACTIONS: FactionId[] = [
  'player',     // 유비 (촉)
  'caocao',     // 조조 (위)
  'sunquan',    // 손권 (오)
  'yuanshao',   // 원소
  'dongzhuo',   // 동탁
  'liubiao',    // 유표
  'liuzhang',   // 유장
  'gongsunzan', // 공손찬
  'rebels'      // 황건적 (장각)
];

interface FactionSelectScreenProps {
  onSelectFaction: (factionId: FactionId) => void;
  onBack: () => void;
}

export default function FactionSelectScreen({ onSelectFaction, onBack }: FactionSelectScreenProps) {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);

  const selectedDetail = selectedFaction ? FACTION_DETAILS[selectedFaction] : null;

  // 난이도 별 렌더링
  const renderDifficulty = (difficulty: number) => {
    return (
      <span className="text-yellow-400">
        {'★'.repeat(difficulty)}
        <span className="text-gray-600">{'★'.repeat(5 - difficulty)}</span>
      </span>
    );
  };

  // 장수 정보 가져오기
  const getGeneralInfo = (generalId: string) => {
    return GENERALS[generalId];
  };

  const handleStart = () => {
    if (selectedFaction) {
      onSelectFaction(selectedFaction);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-4 pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          ⚔️ 세력을 선택하라
        </h1>
      </div>

      {/* 세력 그리드 (3x3) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PLAYABLE_FACTIONS.map((factionId) => {
          const detail = FACTION_DETAILS[factionId];
          if (!detail) return null;

          const isSelected = selectedFaction === factionId;

          return (
            <button
              key={factionId}
              onClick={() => setSelectedFaction(factionId)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center
                ${isSelected 
                  ? 'border-yellow-400 bg-gray-700 scale-105 shadow-lg shadow-yellow-400/20' 
                  : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-750'}`}
              style={{ 
                borderColor: isSelected ? detail.color : undefined,
                boxShadow: isSelected ? `0 0 15px ${detail.color}40` : undefined
              }}
            >
              <span className="text-3xl mb-1">{detail.emoji}</span>
              <span className="font-bold text-sm">{detail.displayName}</span>
              <span className="text-xs text-gray-400">{detail.rulerName}</span>
              <div className="text-xs mt-1">
                {'★'.repeat(detail.difficulty)}
                <span className="text-gray-700">{'★'.repeat(5 - detail.difficulty)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 세력 상세 정보 */}
      {selectedDetail ? (
        <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          {/* 세력 헤더 */}
          <div 
            className="p-4 border-b border-gray-700"
            style={{ backgroundColor: `${selectedDetail.color}20` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedDetail.emoji}</span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: selectedDetail.color }}>
                  {selectedDetail.displayName}
                </h2>
                <p className="text-gray-400 text-sm">{selectedDetail.slogan}</p>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="p-4 space-y-3 border-b border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-400">👤 군주</span>
              <span className="font-bold">{selectedDetail.rulerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">📍 본거지</span>
              <span>{selectedDetail.capital}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">⭐ 난이도</span>
              <span>{renderDifficulty(selectedDetail.difficulty)}</span>
            </div>
          </div>

          {/* 군주 능력치 */}
          {selectedDetail.rulerId && getGeneralInfo(selectedDetail.rulerId) && (
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm text-gray-400 mb-2">📊 군주 능력치</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="bg-red-900/30 rounded p-2">
                  <div className="text-red-400">武</div>
                  <div className="font-bold">{getGeneralInfo(selectedDetail.rulerId)?.might}</div>
                </div>
                <div className="bg-blue-900/30 rounded p-2">
                  <div className="text-blue-400">知</div>
                  <div className="font-bold">{getGeneralInfo(selectedDetail.rulerId)?.intellect}</div>
                </div>
                <div className="bg-green-900/30 rounded p-2">
                  <div className="text-green-400">政</div>
                  <div className="font-bold">{getGeneralInfo(selectedDetail.rulerId)?.politics}</div>
                </div>
                <div className="bg-yellow-900/30 rounded p-2">
                  <div className="text-yellow-400">魅</div>
                  <div className="font-bold">{getGeneralInfo(selectedDetail.rulerId)?.charisma}</div>
                </div>
              </div>
            </div>
          )}

          {/* 주요 장수 */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm text-gray-400 mb-2">⚔️ 주요 장수</h3>
            <div className="flex flex-wrap gap-2">
              {selectedDetail.keyGenerals.map((generalId) => {
                const general = getGeneralInfo(generalId);
                if (!general) return null;
                return (
                  <span 
                    key={generalId}
                    className="px-2 py-1 bg-gray-700 rounded text-sm"
                  >
                    {general.nameKo}
                    <span className="text-gray-500 ml-1 text-xs">
                      武{general.might}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* 특징 */}
          <div className="p-4">
            <h3 className="text-sm text-gray-400 mb-2">📝 특징</h3>
            <ul className="space-y-1">
              {selectedDetail.features.map((feature, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-yellow-400">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-600 p-8 text-center">
          <div className="text-4xl mb-3">👆</div>
          <p className="text-gray-400">세력을 선택하면 상세 정보가 표시됩니다</p>
        </div>
      )}

      {/* 게임 시작 버튼 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
        <button
          onClick={handleStart}
          disabled={!selectedFaction}
          className={`w-full py-4 rounded-lg text-xl font-bold transition-all duration-200 flex items-center justify-center gap-3
            ${selectedFaction
              ? 'bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-500 hover:to-yellow-500 text-white shadow-lg transform hover:scale-[1.02]'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        >
          <span className="text-2xl">🎮</span>
          {selectedFaction ? `${FACTION_DETAILS[selectedFaction]?.displayName}으로 시작` : '세력을 선택하세요'}
        </button>
      </div>
    </div>
  );
}
