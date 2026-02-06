'use client';

import React from 'react';
import type { HistoricalEvent, EventChoice } from '../../types';

interface EventModalProps {
  event: HistoricalEvent;
  onChoice: (choice: EventChoice) => void;
}

export function EventModal({ event, onChoice }: EventModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* 모달 컨텐츠 */}
      <div className="relative w-[95%] max-w-md mx-4 animate-fade-in">
        {/* 장식 프레임 */}
        <div className="absolute inset-0 border-2 border-amber-600/50 rounded-lg" />
        <div className="absolute inset-1 border border-amber-500/30 rounded-lg" />
        
        {/* 메인 컨텐츠 */}
        <div className="relative bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 rounded-lg overflow-hidden">
          {/* 헤더 - 이벤트 이미지와 제목 */}
          <div className="relative bg-gradient-to-r from-amber-900/50 via-amber-800/30 to-amber-900/50 p-4">
            {/* 배경 패턴 */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  rgba(251, 191, 36, 0.1) 10px,
                  rgba(251, 191, 36, 0.1) 20px
                )`
              }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* 이벤트 아이콘 */}
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-gradient-to-br from-amber-700 to-amber-900 rounded-full border-2 border-amber-500 shadow-lg shadow-amber-900/50">
                <span className="text-4xl">{event.image || '📜'}</span>
              </div>
              
              {/* 제목 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-amber-400 text-lg font-bold tracking-wide">
                  {event.nameKo}
                </h2>
                <p className="text-amber-200/60 text-sm font-serif italic">
                  {event.nameKo}
                </p>
              </div>
            </div>
          </div>
          
          {/* 구분선 */}
          <div className="h-px bg-gradient-to-r from-transparent via-amber-600/50 to-transparent" />
          
          {/* 이벤트 설명 */}
          <div className="p-5">
            <div className="bg-black/30 rounded-lg p-4 border border-stone-700/50">
              <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>
          
          {/* 선택지 */}
          <div className="px-5 pb-5 space-y-3">
            {event.choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => onChoice(choice)}
                className="w-full text-left group"
              >
                <div className="relative overflow-hidden rounded-lg border border-amber-700/50 bg-gradient-to-r from-stone-800 to-stone-700 transition-all duration-200 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/30">
                  {/* 호버 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/0 via-amber-600/10 to-amber-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                  
                  <div className="relative p-3 flex items-center gap-3">
                    {/* 선택 번호 */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-900/50 rounded-full border border-amber-700 text-amber-400 font-bold">
                      {index + 1}
                    </div>
                    
                    {/* 선택 텍스트 */}
                    <p className="text-stone-200 text-sm group-hover:text-amber-200 transition-colors">
                      {choice.text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {/* 하단 장식 */}
          <div className="h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-50" />
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default EventModal;
