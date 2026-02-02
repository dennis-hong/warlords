'use client';

import React, { useState } from 'react';
import type { AdvisorSession, Advice, AdviceCategory, AdvicePriority } from '../../advisor/types';

interface AdvisorPanelProps {
  session: AdvisorSession;
  onClose: () => void;
}

// 카테고리 아이콘
const CATEGORY_ICONS: Record<AdviceCategory, string> = {
  urgent: '🚨',
  military: '⚔️',
  domestic: '🏛️',
  personnel: '👥',
  strategic: '📜'
};

// 카테고리 이름
const CATEGORY_NAMES: Record<AdviceCategory, string> = {
  urgent: '긴급',
  military: '군사',
  domestic: '내정',
  personnel: '인사',
  strategic: '전략'
};

// 우선순위 색상
const PRIORITY_COLORS: Record<AdvicePriority, string> = {
  critical: 'border-red-500 bg-red-900/30',
  high: 'border-orange-500 bg-orange-900/20',
  medium: 'border-yellow-500 bg-yellow-900/20',
  low: 'border-gray-500 bg-gray-800/20'
};

// 우선순위 라벨
const PRIORITY_LABELS: Record<AdvicePriority, string> = {
  critical: '긴급!',
  high: '중요',
  medium: '권고',
  low: '참고'
};

function AdviceCard({ advice }: { advice: Advice }) {
  const [expanded, setExpanded] = useState(advice.priority === 'critical');

  return (
    <div 
      className={`border-l-4 rounded-r-lg p-3 mb-3 cursor-pointer transition-all hover:bg-opacity-50 ${PRIORITY_COLORS[advice.priority]}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CATEGORY_ICONS[advice.category]}</span>
          <span className="font-semibold text-amber-100">{advice.title}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${
          advice.priority === 'critical' ? 'bg-red-600 text-white' :
          advice.priority === 'high' ? 'bg-orange-600 text-white' :
          advice.priority === 'medium' ? 'bg-yellow-600 text-black' :
          'bg-gray-600 text-white'
        }`}>
          {PRIORITY_LABELS[advice.priority]}
        </span>
      </div>

      {/* 내용 */}
      <p className="text-sm text-amber-200/80 mt-2">{advice.description}</p>

      {/* 확장 내용 */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-900/50">
          <p className="text-sm text-amber-300/70 italic">
            💭 {advice.reasoning}
          </p>
          {advice.actionable && (
            <div className="mt-2 text-xs text-amber-400">
              📌 제안: {
                advice.actionable.type === 'attack' ? `${advice.actionable.targetRegion} 공격` :
                advice.actionable.type === 'defend' ? `${advice.actionable.targetRegion} 방어 강화` :
                advice.actionable.type === 'develop' ? '개발 명령 실행' :
                advice.actionable.type === 'recruit' ? '등용 시도' :
                advice.actionable.type === 'train' ? '훈련 강화' :
                '검토 필요'
              }
            </div>
          )}
        </div>
      )}

      {/* 확장 힌트 */}
      <div className="text-xs text-amber-500/50 mt-2 text-right">
        {expanded ? '접기 ▲' : '상세보기 ▼'}
      </div>
    </div>
  );
}

export default function AdvisorPanel({ session, onClose }: AdvisorPanelProps) {
  const { strategist, advice, situation } = session;
  const [selectedCategory, setSelectedCategory] = useState<AdviceCategory | 'all'>('all');

  // 카테고리 필터링
  const filteredAdvice = selectedCategory === 'all' 
    ? advice 
    : advice.filter(a => a.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-gradient-to-b from-amber-950 to-stone-900 rounded-xl border-2 border-amber-600 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        
        {/* 헤더 - 책사 정보 */}
        <div className="p-4 border-b border-amber-700 bg-gradient-to-r from-amber-900/50 to-transparent">
          <div className="flex items-start gap-4">
            {/* 책사 아바타 */}
            <div className="w-16 h-16 rounded-full bg-amber-800 flex items-center justify-center text-4xl border-2 border-amber-500">
              {strategist.portrait}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-amber-200">{strategist.nameKo}</h2>
                <span className="text-amber-400">({strategist.name})</span>
              </div>
              <p className="text-amber-300/80 text-sm mt-1 italic">
                &quot;{strategist.greeting}&quot;
              </p>
            </div>

            {/* 닫기 버튼 */}
            <button 
              onClick={onClose}
              className="text-amber-500 hover:text-amber-300 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 상황 요약 */}
          <div className="mt-3 p-3 bg-stone-900/50 rounded-lg">
            <p className="text-amber-200/90 text-sm">
              📊 {situation}
            </p>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="px-4 py-2 border-b border-amber-800 bg-stone-900/30 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-amber-600 text-white' 
                : 'bg-stone-700 text-amber-200 hover:bg-stone-600'
            }`}
          >
            전체 ({advice.length})
          </button>
          {(['urgent', 'military', 'domestic', 'personnel', 'strategic'] as AdviceCategory[]).map(cat => {
            const count = advice.filter(a => a.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-stone-700 text-amber-200 hover:bg-stone-600'
                }`}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_NAMES[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* 조언 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAdvice.length === 0 ? (
            <div className="text-center text-amber-400/60 py-8">
              이 분야에서는 특별한 조언이 없습니다.
            </div>
          ) : (
            filteredAdvice.map(a => (
              <AdviceCard key={a.id} advice={a} />
            ))
          )}
        </div>

        {/* 푸터 - 책사의 맺음말 */}
        <div className="p-4 border-t border-amber-700 bg-gradient-to-r from-transparent to-amber-900/30">
          <p className="text-amber-300/70 text-sm text-center italic">
            &quot;...{strategist.catchphrase}&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
