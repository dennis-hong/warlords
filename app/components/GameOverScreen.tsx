'use client';

import { useMemo } from 'react';
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
  const confetti = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 2}s`,
        emoji: ['⭐', '✨', '🎊', '🎉'][Math.floor(Math.random() * 4)]
      })),
    []
  );

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-md w-full text-center animate-fade-in relative overflow-hidden rounded-xl dynasty-card p-4 sm:p-6">
        {/* 결과 아이콘 */}
        <div className={`text-6xl sm:text-8xl mb-4 sm:mb-6 ${isVictory ? 'animate-float' : 'animate-pulse'}`}>
          {isVictory ? '👑' : '💀'}
        </div>

        {/* 타이틀 */}
        <h1 className={`text-3xl sm:text-4xl font-bold mb-4 ${
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
        <p className="text-lg sm:text-xl text-silk/80 mb-2">
          {gameOver.message}
        </p>

        {/* 통계 */}
        <div className="dynasty-card p-4 sm:p-6 rounded-xl mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-300">{gameOver.year}</div>
              <div className="text-sm text-silk/60">년</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-jade-light">{gameOver.turn}</div>
              <div className="text-sm text-silk/60">턴</div>
            </div>
          </div>
        </div>

        {/* 결과별 메시지 */}
        <div className={`p-4 rounded-lg mb-6 ${
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
            className={`w-full min-h-[48px] py-4 rounded-xl text-lg font-bold transition-all ${
              isVictory 
                ? 'btn-peace'
                : 'btn-war'
            }`}
          >
            🎮 새 게임
          </button>
          
          <button
            onClick={onBackToTitle}
            className="w-full min-h-[44px] py-3 rounded-xl text-amber-300/70 hover:text-amber-200 transition-colors"
          >
            타이틀로 돌아가기
          </button>
        </div>

        {/* 승리 시 축하 효과 */}
        {isVictory && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((piece) => (
              <div
                key={piece.id}
                className="absolute text-2xl animate-float"
                style={{
                  left: piece.left,
                  top: piece.top,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration
                }}
              >
                {piece.emoji}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
