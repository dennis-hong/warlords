'use client';

import React from 'react';
import type { GameOverState, FactionId } from '../types';
import { FACTION_DETAILS } from '../constants/worldData';

interface GameOverScreenProps {
  gameOver: GameOverState;
  selectedFaction: FactionId;
  onNewGame: () => void;
  onBackToTitle: () => void;
}

export default function GameOverScreen({ 
  gameOver, 
  selectedFaction,
  onNewGame, 
  onBackToTitle 
}: GameOverScreenProps) {
  const isVictory = gameOver.result === 'victory';
  const factionDetail = FACTION_DETAILS[selectedFaction];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        {/* 결과 아이콘 */}
        <div className={`text-8xl mb-6 ${isVictory ? 'animate-float' : 'animate-pulse'}`}>
          {isVictory ? '👑' : '💀'}
        </div>

        {/* 타이틀 */}
        <h1 className={`text-4xl font-bold mb-4 ${
          isVictory 
            ? 'text-amber-300 title-glow' 
            : 'text-red-400'
        }`}>
          {isVictory ? '천하통일!' : '멸망...'}
        </h1>

        {/* 세력 정보 */}
        <div className="mb-6">
          <span className="text-2xl">{factionDetail?.emoji || '🏯'}</span>
          <span className="text-xl text-amber-200 ml-2">
            {factionDetail?.displayName || '알 수 없음'}
          </span>
        </div>

        {/* 메시지 */}
        <p className="text-xl text-silk/80 mb-2">
          {gameOver.message}
        </p>

        {/* 통계 */}
        <div className="dynasty-card p-6 rounded-xl mb-8">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-300">{gameOver.year}</div>
              <div className="text-sm text-silk/60">년</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-jade-light">{gameOver.turn}</div>
              <div className="text-sm text-silk/60">턴</div>
            </div>
          </div>
        </div>

        {/* 결과별 메시지 */}
        <div className={`p-4 rounded-lg mb-8 ${
          isVictory 
            ? 'bg-amber-900/30 border border-amber-600/50' 
            : 'bg-red-900/30 border border-red-600/50'
        }`}>
          <p className="text-amber-200/80">
            {isVictory 
              ? `${factionDetail?.rulerName || '그대'}의 이름이 역사에 길이 남으리라!`
              : '역사의 뒤안길로 사라지다...'
            }
          </p>
        </div>

        {/* 버튼 */}
        <div className="space-y-3">
          <button
            onClick={onNewGame}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
              isVictory 
                ? 'btn-peace'
                : 'btn-war'
            }`}
          >
            🎮 새 게임
          </button>
          
          <button
            onClick={onBackToTitle}
            className="w-full py-3 rounded-xl text-amber-300/70 hover:text-amber-200 transition-colors"
          >
            타이틀로 돌아가기
          </button>
        </div>

        {/* 승리 시 축하 효과 */}
        {isVictory && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['⭐', '✨', '🎊', '🎉'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
