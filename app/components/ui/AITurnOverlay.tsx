'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AITurnLog, FactionId, Faction, RegionId, Region } from '../../types';
import { FACTION_DETAILS, REGION_POSITIONS, FACTIONS } from '../../constants/worldData';

interface AITurnOverlayProps {
  logs: AITurnLog[];
  factions: Record<FactionId, Faction>;
  regions: Record<RegionId, Region>;
  onComplete: () => void;
}

// 세력별 표시 시간 (ms)
const BASE_DURATION = 1200;
const ATTACK_EXTRA = 800;

// 인접 연결 (중복 제거용)
const ADJACENCY_PAIRS: [RegionId, RegionId][] = [
  ['luoyang', 'changan'],
  ['luoyang', 'xuchang'],
  ['luoyang', 'jingzhou'],
  ['luoyang', 'ye'],
  ['xuchang', 'jingzhou'],
  ['xuchang', 'jianye'],
  ['xuchang', 'ye'],
  ['jingzhou', 'jianye'],
  ['jingzhou', 'yizhou'],
  ['jingzhou', 'changan'],
  ['yizhou', 'chengdu'],
  ['ye', 'youzhou'],
];

export function AITurnOverlay({ logs, factions, regions, onComplete }: AITurnOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = 인트로
  const [phase, setPhase] = useState<'intro' | 'faction' | 'done'>('intro');
  const [actionVisible, setActionVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skippedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSkip = useCallback(() => {
    if (skippedRef.current) return;
    skippedRef.current = true;
    clearTimer();
    onComplete();
  }, [clearTimer, onComplete]);

  // 인트로 -> 첫 번째 세력으로 전환
  useEffect(() => {
    if (phase !== 'intro') return;

    if (logs.length === 0) {
      onComplete();
      return;
    }

    timerRef.current = setTimeout(() => {
      setPhase('faction');
      setCurrentIndex(0);
      setActionVisible(true);
    }, 800);

    return clearTimer;
  }, [phase, logs.length, onComplete, clearTimer]);

  // 세력별 자동 진행
  useEffect(() => {
    if (phase !== 'faction' || currentIndex < 0 || currentIndex >= logs.length) return;

    const log = logs[currentIndex];
    const hasAttack = log.actionDetails?.some(d => d.type === 'attack');
    const duration = BASE_DURATION + (hasAttack ? ATTACK_EXTRA : 0);

    timerRef.current = setTimeout(() => {
      setActionVisible(false);
      // 페이드 아웃 후 다음 진행
      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= logs.length) {
          setPhase('done');
        } else {
          setCurrentIndex(nextIndex);
          setActionVisible(true);
        }
      }, 250);
    }, duration);

    return clearTimer;
  }, [phase, currentIndex, logs, clearTimer]);

  // done 상태 -> 완료
  useEffect(() => {
    if (phase !== 'done') return;
    timerRef.current = setTimeout(() => {
      if (!skippedRef.current) onComplete();
    }, 300);
    return clearTimer;
  }, [phase, onComplete, clearTimer]);

  const currentLog = currentIndex >= 0 && currentIndex < logs.length ? logs[currentIndex] : null;
  const factionDetail = currentLog ? FACTION_DETAILS[currentLog.factionId] : null;
  const factionColor = factionDetail?.color || factions[currentLog?.factionId as FactionId]?.color || '#888';

  // 공격 화살표 데이터
  const attackDetails = currentLog?.actionDetails?.filter(d => d.type === 'attack') || [];

  // 관련 지역 (현재 세력 + 공격 대상)
  const involvedRegions = new Set<RegionId>();
  if (currentLog) {
    currentLog.actionDetails?.forEach(d => {
      if (d.regionId) involvedRegions.add(d.regionId);
      if (d.targetRegionId) involvedRegions.add(d.targetRegionId);
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      onClick={handleSkip}
    >
      {/* 반투명 배경 */}
      <div className="absolute inset-0 bg-black/80" />

      {/* 인트로 */}
      {phase === 'intro' && (
        <div className="relative z-10 text-center animate-fade-in">
          <div className="text-2xl font-bold text-gold title-glow">
            제후들의 움직임
          </div>
        </div>
      )}

      {/* 세력 행동 표시 */}
      {phase === 'faction' && currentLog && factionDetail && (
        <div className={`relative z-10 w-[92%] max-w-lg flex flex-col gap-3 transition-opacity duration-200 ${actionVisible ? 'opacity-100' : 'opacity-0'}`}>

          {/* 미니맵 - 항상 표시 */}
          <div className="rounded-xl overflow-hidden border-2 border-wood/60 shadow-2xl bg-dynasty-black/90">
            <StrategicMiniMap
              regions={regions}
              factions={factions}
              attacks={attackDetails}
              involvedRegions={involvedRegions}
              currentFactionId={currentLog.factionId}
              factionColor={factionColor}
            />
          </div>

          {/* 세력 정보 + 행동 목록 카드 */}
          <div
            className="rounded-xl overflow-hidden border-2 shadow-2xl"
            style={{ borderColor: factionColor, backgroundColor: 'rgba(20,15,10,0.95)' }}
          >
            {/* 헤더: 세력 */}
            <div
              className="px-4 py-2.5 flex items-center gap-3"
              style={{ background: `linear-gradient(135deg, ${factionColor}30, ${factionColor}10)` }}
            >
              <span className="text-2xl">{factionDetail.emoji}</span>
              <div>
                <div className="font-bold text-base" style={{ color: factionColor }}>
                  {factionDetail.displayName}
                </div>
                <div className="text-xs text-silk/50">
                  {factionDetail.rulerName}
                </div>
              </div>
              {/* 진행 인디케이터 */}
              <div className="ml-auto flex gap-1">
                {logs.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full transition-colors"
                    style={{
                      backgroundColor: i === currentIndex ? factionColor :
                        i < currentIndex ? `${factionColor}60` : 'rgba(255,255,255,0.15)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 행동 목록 */}
            <div className="px-4 py-2.5 space-y-1.5">
              {currentLog.actions.map((action, i) => {
                const detail = currentLog.actionDetails?.[i];
                const isAttack = detail?.type === 'attack';
                return (
                  <div
                    key={i}
                    className={`text-sm flex items-start gap-2 ${
                      isAttack ? 'text-crimson-light font-medium' : 'text-silk/70'
                    }`}
                    style={{
                      animation: `slideInLeft 0.3s ease-out ${i * 0.1}s both`
                    }}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {isAttack ? '⚔️' : detail?.type === 'recruit' ? '👤' : detail?.type === 'train' ? '🏋️' : '📋'}
                    </span>
                    <span>{action}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 하단 스킵 안내 */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10">
        <span className="text-xs text-silk/40 animate-pulse">
          터치하여 건너뛰기
        </span>
      </div>

      {/* 슬라이드 인 애니메이션 */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-12px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================
// 전략 미니맵 - 모든 지역 + 공격 화살표
// ============================================
function StrategicMiniMap({
  regions,
  factions,
  attacks,
  involvedRegions,
  currentFactionId,
  factionColor
}: {
  regions: Record<RegionId, Region>;
  factions: Record<FactionId, Faction>;
  attacks: { type: string; regionId?: RegionId; targetRegionId?: RegionId }[];
  involvedRegions: Set<RegionId>;
  currentFactionId: FactionId;
  factionColor: string;
}) {
  const regionList = Object.values(regions);

  return (
    <div className="relative w-full" style={{ paddingBottom: '65%' }}>
      {/* 배경 지도 이미지 */}
      <div className="absolute inset-0">
        <img src="/images/map-bg.png" alt="" className="w-full h-full object-cover opacity-30" />
      </div>

      {/* SVG 오버레이 - 연결선 + 지역 노드 + 공격 화살표 */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker
            id="attack-arrow"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={factionColor} />
          </marker>
          <filter id="node-glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="attack-glow">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 인접 연결선 (얇은 점선) */}
        {ADJACENCY_PAIRS.map(([a, b]) => {
          const posA = REGION_POSITIONS[a];
          const posB = REGION_POSITIONS[b];
          if (!posA || !posB) return null;
          return (
            <line
              key={`${a}-${b}`}
              x1={posA.x} y1={posA.y}
              x2={posB.x} y2={posB.y}
              stroke="rgba(255,240,200,0.15)"
              strokeWidth="0.4"
              strokeDasharray="1.5,1.5"
            />
          );
        })}

        {/* 지역 노드 */}
        {regionList.map(region => {
          const pos = REGION_POSITIONS[region.id];
          if (!pos) return null;
          const ownerFaction = factions[region.owner];
          const color = ownerFaction?.color || '#666';
          const isCurrentFaction = region.owner === currentFactionId;
          const isInvolved = involvedRegions.has(region.id);
          const isAttackTarget = attacks.some(a => a.targetRegionId === region.id);
          const isAttackSource = attacks.some(a => a.regionId === region.id);

          return (
            <g key={region.id}>
              {/* 관련 지역 하이라이트 링 */}
              {isInvolved && (
                <circle
                  cx={pos.x} cy={pos.y}
                  r={isAttackTarget ? 5.5 : 4.5}
                  fill="none"
                  stroke={isAttackTarget ? '#ef4444' : factionColor}
                  strokeWidth={isAttackTarget ? 0.8 : 0.5}
                  opacity={0.7}
                >
                  <animate
                    attributeName="r"
                    values={isAttackTarget ? '5.5;7;5.5' : '4.5;6;4.5'}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0.2;0.7"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* 지역 원 */}
              <circle
                cx={pos.x} cy={pos.y} r="3"
                fill={color}
                stroke={isCurrentFaction ? factionColor : 'rgba(255,240,200,0.3)'}
                strokeWidth={isCurrentFaction ? 0.8 : 0.3}
                opacity={isInvolved || isCurrentFaction ? 1 : 0.5}
                filter={isInvolved ? 'url(#node-glow)' : undefined}
              />

              {/* 공격 대상: 불꽃 이펙트 */}
              {isAttackTarget && (
                <circle cx={pos.x} cy={pos.y} r="3" fill="#ef4444" opacity="0.4">
                  <animate attributeName="opacity" values="0.4;0.1;0.4" dur="0.8s" repeatCount="indefinite" />
                </circle>
              )}

              {/* 출발 지역: 깜빡이는 링 */}
              {isAttackSource && (
                <circle cx={pos.x} cy={pos.y} r="3.5" fill="none" stroke={factionColor} strokeWidth="0.6" opacity="0.8">
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
                </circle>
              )}

              {/* 지역명 */}
              <text
                x={pos.x}
                y={pos.y + 5.5}
                textAnchor="middle"
                fontSize="2.8"
                fontWeight={isInvolved ? 'bold' : 'normal'}
                fill={isAttackTarget ? '#fca5a5' : isCurrentFaction ? factionColor : 'rgba(255,240,200,0.6)'}
              >
                {region.nameKo}
              </text>
            </g>
          );
        })}

        {/* 공격 화살표 */}
        {attacks.map((attack, i) => {
          if (!attack.regionId || !attack.targetRegionId) return null;
          const from = REGION_POSITIONS[attack.regionId];
          const to = REGION_POSITIONS[attack.targetRegionId];
          if (!from || !to) return null;

          // 화살표를 원 가장자리에서 시작/끝나도록 조정
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const nx = dx / dist;
          const ny = dy / dist;
          const startX = from.x + nx * 3.5;
          const startY = from.y + ny * 3.5;
          const endX = to.x - nx * 4;
          const endY = to.y - ny * 4;

          return (
            <g key={`attack-${i}`} filter="url(#attack-glow)">
              {/* 화살표 선 */}
              <line
                x1={startX} y1={startY}
                x2={endX} y2={endY}
                stroke={factionColor}
                strokeWidth="1.2"
                strokeDasharray="2.5,1.5"
                markerEnd="url(#attack-arrow)"
                opacity="0.9"
              >
                <animate
                  attributeName="stroke-dashoffset"
                  values="0;-8"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              </line>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
