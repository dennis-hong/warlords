'use client';

import { useState } from 'react';
import { FACTION_DETAILS, type FactionDetail } from '../constants/worldData';
import { GENERALS } from '../constants/gameData';
import type { FactionId } from '../types';

// 플레이어가 선택 가능한 세력 ID 목록 (9개)
const PLAYABLE_FACTIONS: FactionId[] = [
  'liubei',     // 유비 (촉)
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
      <span className="text-gold">
        {'★'.repeat(difficulty)}
        <span className="text-dynasty-light">{'★'.repeat(5 - difficulty)}</span>
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
    <div className="min-h-screen p-4 pb-28">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6 animate-fade-in">
        <button
          onClick={onBack}
          className="btn-wood p-2 rounded-lg"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gold flex items-center gap-2 title-glow">
          ⚔️ 세력을 선택하라
        </h1>
      </div>

      {/* 세력 그리드 (3x3) */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {PLAYABLE_FACTIONS.map((factionId, idx) => {
          const detail = FACTION_DETAILS[factionId];
          if (!detail) return null;

          const isSelected = selectedFaction === factionId;

          return (
            <button
              key={factionId}
              onClick={() => setSelectedFaction(factionId)}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center animate-scale-in
                ${isSelected 
                  ? 'dynasty-card scale-105 animate-pulse-gold' 
                  : 'dynasty-card hover:scale-102'}`}
              style={{ 
                borderColor: isSelected ? detail.color : 'var(--color-dynasty-light)',
                boxShadow: isSelected ? `0 0 20px ${detail.color}40` : undefined,
                animationDelay: `${idx * 0.05}s`
              }}
            >
              <span className="text-3xl mb-1">{detail.emoji}</span>
              <span className="font-bold text-sm text-silk">{detail.displayName}</span>
              <span className="text-xs text-silk/60">{detail.rulerName}</span>
              <div className="text-xs mt-1">
                <span className="text-gold">{'★'.repeat(detail.difficulty)}</span>
                <span className="text-dynasty-light">{'★'.repeat(5 - detail.difficulty)}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 선택된 세력 상세 정보 */}
      {selectedDetail ? (
        <div className="silk-card rounded-lg overflow-hidden animate-slide-up">
          {/* 세력 헤더 */}
          <div 
            className="p-4 border-b-2"
            style={{ 
              backgroundColor: `${selectedDetail.color}20`,
              borderColor: selectedDetail.color
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-5xl">{selectedDetail.emoji}</span>
              <div>
                <h2 className="text-xl font-bold" style={{ color: selectedDetail.color }}>
                  {selectedDetail.displayName}
                </h2>
                <p className="text-dynasty-medium text-sm">{selectedDetail.slogan}</p>
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="p-4 space-y-3 border-b-2 border-parchment-dark">
            <div className="flex justify-between">
              <span className="text-dynasty-medium">👤 군주</span>
              <span className="font-bold text-dynasty-black">{selectedDetail.rulerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dynasty-medium">📍 본거지</span>
              <span className="text-dynasty-black">{selectedDetail.capital}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-dynasty-medium">⭐ 난이도</span>
              <span>{renderDifficulty(selectedDetail.difficulty)}</span>
            </div>
          </div>

          {/* 군주 능력치 */}
          {selectedDetail.rulerId && getGeneralInfo(selectedDetail.rulerId) && (
            <div className="p-4 border-b-2 border-parchment-dark">
              <h3 className="text-sm text-dynasty-medium mb-3">📊 군주 능력치</h3>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="stat-badge might rounded-lg p-2">
                  <div className="text-crimson-light font-bold">武</div>
                  <div className="font-bold text-silk">{getGeneralInfo(selectedDetail.rulerId)?.might}</div>
                </div>
                <div className="stat-badge intellect rounded-lg p-2">
                  <div className="text-blue-400 font-bold">知</div>
                  <div className="font-bold text-silk">{getGeneralInfo(selectedDetail.rulerId)?.intellect}</div>
                </div>
                <div className="stat-badge politics rounded-lg p-2">
                  <div className="text-jade-light font-bold">政</div>
                  <div className="font-bold text-silk">{getGeneralInfo(selectedDetail.rulerId)?.politics}</div>
                </div>
                <div className="stat-badge charisma rounded-lg p-2">
                  <div className="text-gold-light font-bold">魅</div>
                  <div className="font-bold text-silk">{getGeneralInfo(selectedDetail.rulerId)?.charisma}</div>
                </div>
              </div>
            </div>
          )}

          {/* 주요 장수 */}
          <div className="p-4 border-b-2 border-parchment-dark">
            <h3 className="text-sm text-dynasty-medium mb-2">⚔️ 주요 장수</h3>
            <div className="flex flex-wrap gap-2">
              {selectedDetail.keyGenerals.map((generalId) => {
                const general = getGeneralInfo(generalId);
                if (!general) return null;
                return (
                  <span 
                    key={generalId}
                    className="px-2 py-1 bg-wood text-parchment rounded text-sm shadow-sm"
                  >
                    {general.nameKo}
                    <span className="text-gold-light ml-1 text-xs">
                      武{general.might}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* 특징 */}
          <div className="p-4">
            <h3 className="text-sm text-dynasty-medium mb-2">📝 특징</h3>
            <ul className="space-y-1">
              {selectedDetail.features.map((feature, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2 text-dynasty-black">
                  <span className="text-gold">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="dynasty-card rounded-lg p-8 text-center animate-fade-in">
          <div className="text-5xl mb-4 animate-float">👆</div>
          <p className="text-silk/60">세력을 선택하면 상세 정보가 표시됩니다</p>
        </div>
      )}

      {/* 게임 시작 버튼 (하단 고정) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dynasty-black via-dynasty-black/95 to-transparent safe-area-bottom">
        <button
          onClick={handleStart}
          disabled={!selectedFaction}
          className={`w-full py-4 rounded-lg text-xl flex items-center justify-center gap-3 ${
            selectedFaction ? 'btn-gold animate-pulse-gold' : 'btn-wood opacity-50'
          }`}
        >
          <span className="text-2xl">🎮</span>
          {selectedFaction ? `${FACTION_DETAILS[selectedFaction]?.displayName}으로 시작` : '세력을 선택하세요'}
        </button>
      </div>
    </div>
  );
}
