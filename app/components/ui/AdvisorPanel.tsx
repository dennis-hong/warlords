'use client';

import React, { useState, useCallback } from 'react';
import type { AdvisorSession, Advice, AdviceCategory, AdvicePriority } from '../../advisor/types';
import type { GameState, RegionId } from '../../types';
import { REGIONS } from '../../constants/worldData';

interface AdvisorPanelProps {
  session: AdvisorSession;
  gameState?: GameState;  // AI 조언용
  onClose: () => void;
  onActionClick?: (actionType: string, targetRegion?: string, targetGeneral?: string) => void;
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

function AdviceCard({ 
  advice, 
  onActionClick 
}: { 
  advice: Advice;
  onActionClick?: (actionType: string, targetRegion?: string, targetGeneral?: string) => void;
}) {
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.(
                  advice.actionable!.type,
                  advice.actionable!.targetRegion,
                  advice.actionable!.targetGeneral
                );
              }}
              className="mt-2 w-full text-left px-3 py-2 bg-amber-800/50 hover:bg-amber-700/50 rounded transition-colors text-sm"
            >
              <span className="text-amber-300">📌 바로가기: </span>
              <span className="text-amber-100">
                {
                  advice.actionable.type === 'attack' ? `${advice.actionable.targetRegion} 공격 준비` :
                  advice.actionable.type === 'defend' ? `${advice.actionable.targetRegion} 방어 확인` :
                  advice.actionable.type === 'develop' ? '내정 화면으로' :
                  advice.actionable.type === 'recruit' ? '등용 화면으로' :
                  advice.actionable.type === 'train' ? '훈련 화면으로' :
                  '검토하기'
                }
              </span>
            </button>
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

export default function AdvisorPanel({ session, gameState, onClose, onActionClick }: AdvisorPanelProps) {
  const { strategist, advice, situation } = session;
  const [selectedCategory, setSelectedCategory] = useState<AdviceCategory | 'all'>('all');
  const [showAI, setShowAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // 카테고리 필터링
  const filteredAdvice = selectedCategory === 'all' 
    ? advice 
    : advice.filter(a => a.category === selectedCategory);

  // AI 조언 요청
  const requestAiAdvice = useCallback(async () => {
    if (!gameState) return;
    
    setAiLoading(true);
    setAiError('');
    setAiResponse('');

    try {
      // 게임 상태를 API 형식으로 변환
      const playerRegions = Object.values(gameState.regions)
        .filter(r => r.owner === gameState.playerFaction);
      
      const totalResources = playerRegions.reduce((acc, r) => ({
        gold: acc.gold + r.gold,
        food: acc.food + r.food,
        troops: acc.troops + r.troops
      }), { gold: 0, food: 0, troops: 0 });

      // 위협 분석
      const threats = Object.values(gameState.regions)
        .filter(r => r.owner !== gameState.playerFaction)
        .filter(r => r.adjacent.some(adj => 
          gameState.regions[adj as RegionId]?.owner === gameState.playerFaction
        ))
        .map(r => ({
          faction: gameState.factions[r.owner]?.nameKo || r.owner,
          regions: [REGIONS[r.id]?.nameKo || r.id],
          troops: r.troops
        }));

      // 기회 분석
      const opportunities = Object.values(gameState.regions)
        .filter(r => r.owner !== gameState.playerFaction && r.troops < 2000)
        .filter(r => r.adjacent.some(adj => 
          gameState.regions[adj as RegionId]?.owner === gameState.playerFaction
        ))
        .map(r => ({
          region: REGIONS[r.id]?.nameKo || r.id,
          owner: gameState.factions[r.owner]?.nameKo || r.owner,
          troops: r.troops
        }));

      // 세력 순위
      const factionStrength = Object.entries(
        Object.values(gameState.regions).reduce((acc, r) => {
          const faction = gameState.factions[r.owner]?.nameKo || r.owner;
          if (!acc[faction]) acc[faction] = { regions: 0, troops: 0 };
          acc[faction].regions++;
          acc[faction].troops += r.troops;
          return acc;
        }, {} as Record<string, { regions: number; troops: number }>)
      )
        .map(([faction, data]) => ({ faction, ...data }))
        .sort((a, b) => b.troops - a.troops);

      const context = {
        playerFaction: gameState.factions[gameState.playerFaction]?.nameKo || gameState.playerFaction,
        turn: gameState.turn,
        strategist: {
          nameKo: strategist.nameKo,
          name: strategist.name,
          personality: strategist.personality,
          speechStyle: strategist.speechStyle,
          catchphrase: strategist.catchphrase
        },
        resources: totalResources,
        regions: playerRegions.map(r => ({
          name: REGIONS[r.id]?.nameKo || r.id,
          troops: r.troops,
          generals: r.generals,
          agriculture: r.agriculture,
          commerce: r.commerce
        })),
        threats,
        opportunities,
        factionRanking: factionStrength,
        question: aiQuestion || undefined
      };

      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI 요청 실패');
      }

      setAiResponse(data.advice);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI 조언을 받을 수 없습니다');
    } finally {
      setAiLoading(false);
    }
  }, [gameState, strategist, aiQuestion]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 sm:p-4">
      <div className="bg-gradient-to-b from-amber-950 to-stone-900 sm:rounded-xl border-t-2 sm:border-2 border-amber-600 shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-xl">
        
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
                {gameState && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-purple-600/50 text-purple-200 rounded-full border border-purple-400/50">
                    🤖 AI
                  </span>
                )}
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

          {/* AI 토글 버튼 */}
          {gameState && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowAI(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  !showAI
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-700 text-amber-300 hover:bg-stone-600'
                }`}
              >
                📜 기본 조언
              </button>
              <button
                onClick={() => setShowAI(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  showAI
                    ? 'bg-purple-600 text-white'
                    : 'bg-stone-700 text-purple-300 hover:bg-stone-600'
                }`}
              >
                🤖 AI 책사
              </button>
            </div>
          )}
        </div>

        {showAI && gameState ? (
          /* AI 조언 섹션 */
          <div className="flex-1 overflow-y-auto p-4">
            {/* 질문 입력 */}
            <div className="mb-4">
              <label className="block text-amber-300 text-sm mb-2">
                📝 질문 (선택사항)
              </label>
              <input
                type="text"
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                placeholder="예: 지금 공격해야 할까요? 내정에 집중할까요?"
                className="w-full px-4 py-2 bg-stone-800 border border-amber-700 rounded-lg text-amber-100 placeholder-amber-600/50 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* AI 요청 버튼 */}
            <button
              onClick={requestAiAdvice}
              disabled={aiLoading}
              className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                aiLoading
                  ? 'bg-stone-700 text-stone-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white'
              }`}
            >
              {aiLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {strategist.nameKo} 생각 중...
                </>
              ) : (
                <>
                  🎯 {strategist.nameKo}에게 조언 구하기
                </>
              )}
            </button>

            {/* 에러 메시지 */}
            {aiError && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">⚠️ {aiError}</p>
              </div>
            )}

            {/* AI 응답 */}
            {aiResponse && (
              <div className="mt-4 p-4 bg-gradient-to-br from-purple-900/30 to-stone-900/50 border border-purple-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{strategist.portrait}</span>
                  <span className="text-purple-200 font-medium">{strategist.nameKo}의 조언</span>
                </div>
                <p className="text-amber-100 whitespace-pre-wrap leading-relaxed">
                  {aiResponse}
                </p>
              </div>
            )}

            {/* 안내 문구 */}
            {!aiResponse && !aiLoading && !aiError && (
              <div className="mt-8 text-center text-amber-500/60">
                <p className="text-lg mb-2">🎭</p>
                <p className="text-sm">
                  AI {strategist.nameKo}이(가) 현재 상황을 분석하고<br/>
                  캐릭터에 맞는 조언을 드립니다.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* 기존 조언 섹션 */
          <>
            {/* 카테고리 필터 */}
            <div className="px-4 py-3 border-b border-amber-800 bg-stone-900/30 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
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
                    className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
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
                  <AdviceCard key={a.id} advice={a} onActionClick={onActionClick} />
                ))
              )}
            </div>
          </>
        )}

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
