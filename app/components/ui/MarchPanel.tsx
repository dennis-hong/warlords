'use client';

import { useState, useCallback } from 'react';
import type { MarchState, MarchStep, Region, RegionId, TroopType, General, Faction, FactionId } from '../../types';

interface MarchPanelProps {
  march: MarchState;
  playerRegions: Region[];
  allRegions: Record<RegionId, Region>;
  factions?: Record<FactionId, Faction>;
  selectedSourceRegion: Region | null;
  getGeneral: (id: string) => General | null;
  onSelectTarget: (regionId: RegionId) => void;
  onToggleGeneral: (generalId: string, isCommander?: boolean) => void;
  onSetCommander: (generalId: string) => void;
  onAssignTroops: (generalId: string, troops: number, troopType: TroopType) => void;
  onAssignTroopsBatch?: (assignments: { generalId: string; troops: number }[]) => void;
  onSetStep: (step: MarchStep) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const STEP_CONFIG: Record<MarchStep, { num: number; title: string; icon: string }> = {
  target: { num: 1, title: '목표', icon: '🎯' },
  generals: { num: 2, title: '장수', icon: '👥' },
  troops: { num: 3, title: '병력', icon: '⚔️' },
  confirm: { num: 4, title: '확인', icon: '🚀' }
};

const TROOP_TYPES: { id: TroopType; name: string; icon: string; cost: number; advantage: string; disadvantage: string }[] = [
  { id: 'infantry', name: '보병', icon: '⚔️', cost: 0, advantage: '궁병', disadvantage: '기병' },
  { id: 'cavalry', name: '기병', icon: '🐴', cost: 500, advantage: '보병', disadvantage: '궁병' },
  { id: 'archer', name: '궁병', icon: '🏹', cost: 300, advantage: '기병', disadvantage: '보병' }
];

export function MarchPanel({
  march,
  playerRegions,
  allRegions,
  factions,
  selectedSourceRegion,
  getGeneral,
  onSelectTarget,
  onToggleGeneral,
  onSetCommander,
  onAssignTroops,
  onAssignTroopsBatch,
  onSetStep,
  onConfirm,
  onCancel
}: MarchPanelProps) {
  const sourceRegion = selectedSourceRegion || playerRegions[0];
  if (!sourceRegion) return null;

  const adjacentEnemyRegions = sourceRegion.adjacent
    .map(id => allRegions[id])
    .filter(r => r && r.owner !== sourceRegion.owner);

  const availableGenerals = sourceRegion.generals
    .map(id => getGeneral(id))
    .filter((g): g is General => g !== null);

  const minDefenseTroops = 1000;
  const availableTroops = Math.max(0, sourceRegion.troops - minDefenseTroops);
  const totalAssignedTroops = march.units.reduce((sum, u) => sum + u.troops, 0);
  const remainingTroops = availableTroops - totalAssignedTroops;
  const targetRegion = march.targetRegion ? allRegions[march.targetRegion] : null;

  return (
    <div className="space-y-3">
      {/* 스텝 인디케이터 - 콤팩트 */}
      <div className="flex items-center gap-1 px-1">
        {Object.entries(STEP_CONFIG).map(([key, cfg], idx) => {
          const stepKey = key as MarchStep;
          const isActive = march.step === stepKey;
          const isPast = cfg.num < STEP_CONFIG[march.step].num;
          return (
            <div key={key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md transition-all
                    ${isActive ? 'bg-gold text-wood scale-110' : isPast ? 'bg-jade text-silk' : 'dynasty-card text-silk/40'}`}
                >
                  {isPast ? '✓' : cfg.icon}
                </div>
                <div className={`text-[10px] mt-0.5 font-medium ${isActive ? 'text-gold' : 'text-silk/40'}`}>
                  {cfg.title}
                </div>
              </div>
              {idx < 3 && (
                <div className={`w-full h-0.5 mx-0.5 mt-[-12px] ${isPast ? 'bg-jade/50' : 'bg-dynasty-light/30'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1: 목표 선택 */}
      {march.step === 'target' && (
        <div className="dynasty-card rounded-lg p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-gold font-bold text-sm">🎯 목표 성 선택</h3>
            <span className="text-xs text-silk/50">출발: {sourceRegion.nameKo}</span>
          </div>

          {adjacentEnemyRegions.length === 0 ? (
            <div className="text-center text-silk/50 py-4">
              <div className="text-3xl mb-2">🚫</div>
              <p className="text-sm">인접한 적 영토가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {adjacentEnemyRegions.map(region => (
                <button
                  key={region.id}
                  onClick={() => onSelectTarget(region.id)}
                  className={`w-full min-h-[48px] p-3 rounded-lg border-2 transition-all active:scale-[0.98] ${
                    march.targetRegion === region.id
                      ? 'border-gold war-card'
                      : 'border-dynasty-light dynasty-card'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <div className="font-bold text-silk text-sm">{region.nameKo}</div>
                      <div className="text-xs text-silk/50">{factions?.[region.owner]?.nameKo || region.owner}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-crimson-light font-medium text-sm">⚔️ {region.troops.toLocaleString()}</div>
                      <div className="text-jade-light text-xs">🏰 {region.defense}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={onCancel} className="btn-wood flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]">
              취소
            </button>
            <button
              onClick={() => march.targetRegion && onSetStep('generals')}
              disabled={!march.targetRegion}
              className="btn-gold flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 장수 편성 */}
      {march.step === 'generals' && (
        <div className="dynasty-card rounded-lg p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-gold font-bold text-sm">👥 장수 편성</h3>
            <span className="text-xs text-silk/50">{march.units.length}/3 선택</span>
          </div>

          {availableGenerals.length === 0 ? (
            <div className="text-center text-silk/50 py-4">
              <div className="text-3xl mb-2">😢</div>
              <p className="text-sm">출진 가능한 장수가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {availableGenerals.map(general => {
                const isSelected = march.units.some(u => u.generalId === general.id);
                const unit = march.units.find(u => u.generalId === general.id);
                const isCommander = unit?.isCommander;

                return (
                  <div
                    key={general.id}
                    className={`p-2.5 rounded-lg border-2 transition-all ${
                      isSelected ? 'border-gold peace-card' : 'border-dynasty-light dynasty-card'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <button
                        onClick={() => onToggleGeneral(general.id)}
                        className="flex items-center gap-2 flex-1 text-left min-h-[44px] active:opacity-70"
                      >
                        <div className="text-2xl shrink-0">{general.portrait}</div>
                        <div className="min-w-0">
                          <div className="font-bold text-silk text-sm truncate">
                            {general.nameKo}
                            {isCommander && <span className="ml-1 text-gold">⭐</span>}
                          </div>
                          <div className="text-[10px] text-silk/50">
                            무{general.might} 지{general.intellect} 정{general.politics} 매{general.charisma}
                          </div>
                        </div>
                      </button>
                      {isSelected && !isCommander && (
                        <button
                          onClick={() => onSetCommander(general.id)}
                          className="btn-wood px-2 py-1.5 text-[10px] rounded shrink-0 active:scale-95"
                        >
                          주장
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => onSetStep('target')} className="btn-wood flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]">
              ← 이전
            </button>
            <button
              onClick={() => onSetStep('troops')}
              disabled={march.units.length === 0}
              className="btn-gold flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 병력 배분 */}
      {march.step === 'troops' && (
        <TroopAllocationStep
          march={march}
          availableTroops={availableTroops}
          totalAssignedTroops={totalAssignedTroops}
          remainingTroops={remainingTroops}
          sourceRegion={sourceRegion}
          getGeneral={getGeneral}
          onAssignTroops={onAssignTroops}
          onAssignTroopsBatch={onAssignTroopsBatch}
          onSetStep={onSetStep}
        />
      )}

      {/* Step 4: 최종 확인 */}
      {march.step === 'confirm' && targetRegion && (
        <div className="dynasty-card rounded-lg p-3 space-y-3 animate-fade-in">
          <h3 className="text-gold font-bold text-center text-lg title-glow">⚔️ 출진 확인</h3>

          {/* 목표 */}
          <div className="war-card rounded-lg p-2.5">
            <div className="text-xs text-crimson-light mb-1">🎯 목표</div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-silk text-base">{targetRegion.nameKo}</span>
              <div className="text-crimson-light font-bold text-sm">⚔️ {targetRegion.troops.toLocaleString()}</div>
            </div>
          </div>

          {/* 아군 편성 */}
          <div className="peace-card rounded-lg p-2.5">
            <div className="text-xs text-jade-light mb-1.5">🏴 아군 편성</div>
            {march.units.map(unit => {
              const general = getGeneral(unit.generalId);
              if (!general) return null;
              const troopType = TROOP_TYPES.find(t => t.id === unit.troopType);
              return (
                <div key={unit.generalId} className="flex justify-between items-center py-1 border-b border-jade/30 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{general.portrait}</span>
                    <span className="text-silk text-sm">
                      {general.nameKo}
                      {unit.isCommander && <span className="text-gold ml-0.5">⭐</span>}
                    </span>
                  </div>
                  <div className="text-jade-light text-xs font-medium">
                    {troopType?.icon} {unit.troops.toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t border-jade/50">
              <span className="text-jade-light text-sm">총 병력</span>
              <span className="font-bold text-silk">{totalAssignedTroops.toLocaleString()}</span>
            </div>
          </div>

          {/* 전력 비교 */}
          <div className="dynasty-card rounded-lg p-2.5 text-center border border-gold/30">
            <div className="text-xs text-silk/60 mb-1">⚖️ 전력 비교</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-jade-light font-bold text-lg">{totalAssignedTroops.toLocaleString()}</span>
              <span className="text-gold font-bold text-sm">vs</span>
              <span className="text-crimson-light font-bold text-lg">{targetRegion.troops.toLocaleString()}</span>
            </div>
            <div className="text-[10px] text-silk/50 mt-1">
              {totalAssignedTroops > targetRegion.troops
                ? '✨ 아군 우세'
                : totalAssignedTroops < targetRegion.troops
                ? '⚠️ 적군 우세'
                : '⚔️ 호각'}
            </div>
          </div>

          {/* 소모 자원 */}
          {(() => {
            const troopCost = march.units.reduce((sum, unit) => {
              const type = TROOP_TYPES.find(t => t.id === unit.troopType);
              return sum + (type?.cost || 0);
            }, 0);
            const hasEnoughGold = sourceRegion.gold >= troopCost;
            const hasEnoughFood = sourceRegion.food >= march.foodRequired;

            return (
              <div className="silk-card rounded-lg p-2.5 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-dynasty-medium">🌾 필요 식량</span>
                  <span className={hasEnoughFood ? 'text-jade font-bold' : 'text-crimson font-bold'}>
                    {march.foodRequired.toLocaleString()} / {sourceRegion.food.toLocaleString()}
                  </span>
                </div>
                {troopCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-dynasty-medium">💰 편성비</span>
                    <span className={hasEnoughGold ? 'text-gold font-bold' : 'text-crimson font-bold'}>
                      {troopCost.toLocaleString()} / {sourceRegion.gold.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex gap-2 pt-1">
            <button onClick={() => onSetStep('troops')} className="btn-wood flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]">
              ← 이전
            </button>
            {(() => {
              const troopCost = march.units.reduce((sum, unit) => {
                const type = TROOP_TYPES.find(t => t.id === unit.troopType);
                return sum + (type?.cost || 0);
              }, 0);
              const canAfford = sourceRegion.food >= march.foodRequired && sourceRegion.gold >= troopCost;

              return (
                <button
                  onClick={onConfirm}
                  disabled={!canAfford}
                  className="btn-war flex-1 min-h-[48px] py-2.5 rounded-lg text-base active:scale-[0.97] animate-pulse-crimson"
                >
                  ⚔️ 출진!
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 병력 배분 단계 (통합 분배 기능 포함)
// ============================================

interface TroopAllocationStepProps {
  march: MarchState;
  availableTroops: number;
  totalAssignedTroops: number;
  remainingTroops: number;
  sourceRegion: Region;
  getGeneral: (id: string) => General | null;
  onAssignTroops: (generalId: string, troops: number, troopType: TroopType) => void;
  onAssignTroopsBatch?: (assignments: { generalId: string; troops: number }[]) => void;
  onSetStep: (step: MarchStep) => void;
}

function TroopAllocationStep({
  march,
  availableTroops,
  totalAssignedTroops,
  remainingTroops,
  sourceRegion,
  getGeneral,
  onAssignTroops,
  onAssignTroopsBatch,
  onSetStep
}: TroopAllocationStepProps) {
  const [showDetail, setShowDetail] = useState(false);

  const unitCount = march.units.length;

  // 통합 분배: 모든 장수에게 균등 배분 (단일 state update)
  const distributeEvenly = useCallback((totalToDistribute: number) => {
    if (unitCount === 0) return;
    const perUnit = Math.floor(totalToDistribute / unitCount);
    const leftover = totalToDistribute - perUnit * unitCount;

    if (onAssignTroopsBatch) {
      // 일괄 처리 (단일 state update)
      const assignments = march.units.map((unit, idx) => ({
        generalId: unit.generalId,
        troops: idx === 0 ? perUnit + leftover : perUnit
      }));
      onAssignTroopsBatch(assignments);
    } else {
      // 폴백: 개별 호출
      march.units.forEach((unit, idx) => {
        const troops = idx === 0 ? perUnit + leftover : perUnit;
        onAssignTroops(unit.generalId, troops, unit.troopType);
      });
    }
  }, [march.units, unitCount, onAssignTroops, onAssignTroopsBatch]);

  // 수비 병력 남기고 분배
  const distributeWithReserve = useCallback((reserveTroops: number) => {
    const toDistribute = Math.max(0, availableTroops - reserveTroops);
    distributeEvenly(toDistribute);
  }, [availableTroops, distributeEvenly]);

  return (
    <div className="dynasty-card rounded-lg p-3 space-y-3 animate-fade-in">
      <h3 className="text-gold font-bold text-sm">⚔️ 병력 편성</h3>

      {/* 병력 현황 */}
      <div className="silk-card rounded-lg p-2.5 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-dynasty-medium">가용 병력</span>
          <span className="text-jade font-bold">{availableTroops.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-dynasty-medium">배분 완료</span>
          <span className="text-jade font-medium">{totalAssignedTroops.toLocaleString()}</span>
        </div>
        <div className="progress-bar h-2.5 mt-1">
          <div
            className={`progress-fill ${totalAssignedTroops > availableTroops ? 'crimson' : 'jade'}`}
            style={{ width: `${Math.min(100, (totalAssignedTroops / availableTroops) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-dynasty-medium">남은 {remainingTroops.toLocaleString()}</span>
          <span className="text-dynasty-medium">{availableTroops > 0 ? Math.round((totalAssignedTroops / availableTroops) * 100) : 0}%</span>
        </div>
      </div>

      {/* 통합 분배 버튼 */}
      <div className="space-y-1.5">
        <div className="text-xs text-silk/60 font-medium">📦 통합 분배 ({unitCount}명에게 균등)</div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => distributeEvenly(availableTroops)}
            className="btn-gold min-h-[44px] py-2 rounded-lg text-xs active:scale-[0.97] flex flex-col items-center justify-center"
          >
            <span className="font-bold">전체</span>
            <span className="text-[10px] opacity-80">{availableTroops > 0 ? `${Math.floor(availableTroops / unitCount).toLocaleString()}씩` : '0'}</span>
          </button>
          <button
            onClick={() => distributeEvenly(Math.floor(availableTroops / 2))}
            className="btn-peace min-h-[44px] py-2 rounded-lg text-xs active:scale-[0.97] flex flex-col items-center justify-center"
          >
            <span className="font-bold">절반</span>
            <span className="text-[10px] opacity-80">{availableTroops > 0 ? `${Math.floor(availableTroops / 2 / unitCount).toLocaleString()}씩` : '0'}</span>
          </button>
          <button
            onClick={() => distributeEvenly(0)}
            className="btn-wood min-h-[44px] py-2 rounded-lg text-xs active:scale-[0.97] flex flex-col items-center justify-center"
          >
            <span className="font-bold">초기화</span>
            <span className="text-[10px] opacity-80">0씩</span>
          </button>
        </div>

        {/* 수비 남기고 분배 */}
        <div className="flex gap-1.5 mt-1">
          {[1000, 2000, 3000, 5000].map(reserve => {
            const distributable = Math.max(0, availableTroops - reserve);
            if (distributable <= 0 && reserve > 1000) return null;
            return (
              <button
                key={reserve}
                onClick={() => distributeWithReserve(reserve)}
                disabled={distributable <= 0}
                className={`flex-1 min-h-[38px] py-1.5 rounded-lg text-[11px] active:scale-[0.97] flex flex-col items-center justify-center ${
                  distributable > 0 ? 'btn-peace' : 'bg-dynasty-medium/30 text-silk/30 cursor-not-allowed'
                }`}
              >
                <span className="font-medium">{(reserve / 1000).toFixed(0)}k 수비</span>
                <span className="text-[9px] opacity-70">{distributable > 0 ? `${Math.floor(distributable / unitCount).toLocaleString()}씩` : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 장수별 세부 조정 (접기/펼치기) */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="w-full flex items-center justify-between text-xs text-silk/60 py-1.5 px-1 active:text-silk/80"
      >
        <span>🎛️ 장수별 세부 조정</span>
        <span>{showDetail ? '▲ 접기' : '▼ 펼치기'}</span>
      </button>

      {/* 장수별 현재 배치 요약 (항상 표시) */}
      {!showDetail && (
        <div className="space-y-1">
          {march.units.map(unit => {
            const general = getGeneral(unit.generalId);
            if (!general) return null;
            const troopType = TROOP_TYPES.find(t => t.id === unit.troopType);
            return (
              <div key={unit.generalId} className="flex items-center justify-between peace-card rounded-lg px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{general.portrait}</span>
                  <span className="font-medium text-dynasty-black text-sm">
                    {general.nameKo}
                    {unit.isCommander && <span className="text-gold ml-0.5">⭐</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-dynasty-medium">{troopType?.icon} {troopType?.name}</span>
                  <span className="text-sm font-bold text-jade">{unit.troops.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 장수별 세부 조정 (펼침 시) */}
      {showDetail && (
        <div className="space-y-3">
          {march.units.map(unit => {
            const general = getGeneral(unit.generalId);
            if (!general) return null;
            const currentRemaining = availableTroops - totalAssignedTroops;
            const maxForThisUnit = currentRemaining + unit.troops;

            return (
              <div key={unit.generalId} className="peace-card rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{general.portrait}</span>
                    <span className="font-bold text-dynasty-black text-sm">{general.nameKo}</span>
                    {unit.isCommander && <span className="text-gold text-xs">⭐</span>}
                  </div>
                  <span className="text-base font-bold text-jade">
                    {unit.troops.toLocaleString()}
                  </span>
                </div>

                {/* 병종 선택 */}
                <div className="flex gap-1.5">
                  {TROOP_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => onAssignTroops(unit.generalId, unit.troops, type.id)}
                      className={`flex-1 min-h-[40px] py-1.5 rounded text-xs transition-colors active:scale-95 ${
                        unit.troopType === type.id ? 'btn-gold' : 'btn-wood'
                      }`}
                    >
                      <div>{type.icon} {type.name}</div>
                      {type.cost > 0 && <div className="text-[10px] opacity-70">💰{type.cost}</div>}
                    </button>
                  ))}
                </div>

                {/* 상성 */}
                <div className="text-[10px] text-center text-silk/60 bg-dynasty-dark/50 rounded px-2 py-0.5">
                  {(() => {
                    const type = TROOP_TYPES.find(t => t.id === unit.troopType);
                    return type ? (
                      <span>
                        <span className="text-jade">✓{type.advantage}</span>
                        {' / '}
                        <span className="text-crimson">✗{type.disadvantage}</span>
                      </span>
                    ) : null;
                  })()}
                </div>

                {/* 병력 슬라이더 */}
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, maxForThisUnit)}
                  step={100}
                  value={unit.troops}
                  onChange={(e) => onAssignTroops(unit.generalId, Number(e.target.value), unit.troopType)}
                  className="w-full h-4 bg-parchment-dark rounded-lg appearance-none cursor-pointer accent-gold touch-none"
                  style={{ WebkitAppearance: 'none' }}
                />

                {/* 빠른 배분 */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onAssignTroops(unit.generalId, 0, unit.troopType)}
                    className="btn-wood flex-1 min-h-[36px] py-1 text-[11px] rounded active:scale-95"
                  >
                    초기화
                  </button>
                  <button
                    onClick={() => onAssignTroops(unit.generalId, Math.floor(maxForThisUnit / 2), unit.troopType)}
                    className="btn-wood flex-1 min-h-[36px] py-1 text-[11px] rounded active:scale-95"
                  >
                    절반
                  </button>
                  <button
                    onClick={() => onAssignTroops(unit.generalId, maxForThisUnit, unit.troopType)}
                    className="btn-gold flex-1 min-h-[36px] py-1 text-[11px] rounded active:scale-95"
                  >
                    최대
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSetStep('generals')} className="btn-wood flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]">
          ← 이전
        </button>
        <button
          onClick={() => onSetStep('confirm')}
          disabled={totalAssignedTroops === 0 || totalAssignedTroops > availableTroops}
          className="btn-gold flex-1 min-h-[44px] py-2.5 rounded-lg active:scale-[0.97]"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}
