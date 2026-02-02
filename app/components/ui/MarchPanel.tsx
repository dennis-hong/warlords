'use client';

import { useState } from 'react';
import type { MarchState, MarchStep, Region, RegionId, TroopType, General } from '../../types';
import { GENERALS } from '../../constants/gameData';

interface MarchPanelProps {
  march: MarchState;
  playerRegions: Region[];
  allRegions: Record<RegionId, Region>;
  selectedSourceRegion: Region | null;
  onSelectTarget: (regionId: RegionId) => void;
  onToggleGeneral: (generalId: string, isCommander?: boolean) => void;
  onSetCommander: (generalId: string) => void;
  onAssignTroops: (generalId: string, troops: number, troopType: TroopType) => void;
  onSetStep: (step: MarchStep) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const STEP_CONFIG: Record<MarchStep, { num: number; title: string; icon: string }> = {
  target: { num: 1, title: '목표 선택', icon: '🎯' },
  generals: { num: 2, title: '장수 편성', icon: '👥' },
  troops: { num: 3, title: '병력 배분', icon: '⚔️' },
  confirm: { num: 4, title: '출진 확인', icon: '🚀' }
};

const TROOP_TYPES: { id: TroopType; name: string; icon: string }[] = [
  { id: 'infantry', name: '보병', icon: '⚔️' },
  { id: 'cavalry', name: '기병', icon: '🐴' },
  { id: 'archer', name: '궁병', icon: '🏹' }
];

export function MarchPanel({
  march,
  playerRegions,
  allRegions,
  selectedSourceRegion,
  onSelectTarget,
  onToggleGeneral,
  onSetCommander,
  onAssignTroops,
  onSetStep,
  onConfirm,
  onCancel
}: MarchPanelProps) {
  // 출발 지역 (선택된 지역 또는 첫 번째 내 영토)
  const sourceRegion = selectedSourceRegion || playerRegions[0];
  if (!sourceRegion) return null;

  // 인접한 적 영토 목록
  const adjacentEnemyRegions = sourceRegion.adjacent
    .map(id => allRegions[id])
    .filter(r => r && r.owner !== sourceRegion.owner);

  // 출발 지역의 장수 목록
  const availableGenerals = sourceRegion.generals
    .map(id => GENERALS[id])
    .filter(Boolean) as General[];

  // 가용 병력 (출발 지역 병력 - 최소 수비 병력)
  const minDefenseTroops = 1000;
  const availableTroops = Math.max(0, sourceRegion.troops - minDefenseTroops);

  // 현재 배분된 총 병력
  const totalAssignedTroops = march.units.reduce((sum, u) => sum + u.troops, 0);
  
  // 남은 가용 병력
  const remainingTroops = availableTroops - totalAssignedTroops;

  // 목표 지역 정보
  const targetRegion = march.targetRegion ? allRegions[march.targetRegion] : null;

  return (
    <div className="space-y-4">
      {/* 스텝 인디케이터 */}
      <div className="flex justify-between items-center px-2">
        {Object.entries(STEP_CONFIG).map(([key, cfg]) => {
          const stepKey = key as MarchStep;
          const isActive = march.step === stepKey;
          const isPast = cfg.num < STEP_CONFIG[march.step].num;
          return (
            <div
              key={key}
              className={`flex flex-col items-center flex-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-50'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg
                  ${isActive ? 'bg-gold text-wood' : isPast ? 'bg-jade text-silk' : 'dynasty-card text-silk/50'}`}
              >
                {isPast ? '✓' : cfg.icon}
              </div>
              <div className={`text-xs mt-1 font-medium ${isActive ? 'text-gold' : 'text-silk/40'}`}>
                {cfg.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: 목표 선택 */}
      {march.step === 'target' && (
        <div className="dynasty-card rounded-lg p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-gold font-bold">🎯 목표 성 선택</h3>
            <span className="text-sm text-silk/50">출발: {sourceRegion.nameKo}</span>
          </div>

          {adjacentEnemyRegions.length === 0 ? (
            <div className="text-center text-silk/50 py-6">
              <div className="text-4xl mb-2">🚫</div>
              <p>인접한 적 영토가 없습니다</p>
              <p className="text-sm mt-1">다른 지역에서 출진하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {adjacentEnemyRegions.map(region => (
                <button
                  key={region.id}
                  onClick={() => onSelectTarget(region.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all ${
                    march.targetRegion === region.id
                      ? 'border-gold war-card scale-[1.02]'
                      : 'border-dynasty-light dynasty-card hover:border-crimson/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <div className="font-bold text-silk">{region.nameKo}</div>
                      <div className="text-sm text-silk/50">
                        {allRegions[region.id] && `소속: ${region.owner}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-crimson-light font-medium">⚔️ {region.troops.toLocaleString()}</div>
                      <div className="text-jade-light text-sm">🏰 {region.defense}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onCancel}
              className="btn-wood flex-1 py-3 rounded-lg"
            >
              취소
            </button>
            <button
              onClick={() => march.targetRegion && onSetStep('generals')}
              disabled={!march.targetRegion}
              className="btn-gold flex-1 py-3 rounded-lg"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 장수 편성 */}
      {march.step === 'generals' && (
        <div className="dynasty-card rounded-lg p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-gold font-bold">👥 장수 편성</h3>
            <span className="text-sm text-silk/50">
              {march.units.length}/3 선택
            </span>
          </div>

          {availableGenerals.length === 0 ? (
            <div className="text-center text-silk/50 py-6">
              <div className="text-4xl mb-2">😢</div>
              <p>출진 가능한 장수가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableGenerals.map(general => {
                const isSelected = march.units.some(u => u.generalId === general.id);
                const unit = march.units.find(u => u.generalId === general.id);
                const isCommander = unit?.isCommander;

                return (
                  <div
                    key={general.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-gold peace-card'
                        : 'border-dynasty-light dynasty-card'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => onToggleGeneral(general.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="text-2xl">{general.portrait}</div>
                        <div>
                          <div className="font-bold text-silk">
                            {general.nameKo}
                            {isCommander && <span className="ml-2 text-gold">⭐ 주장</span>}
                          </div>
                          <div className="text-xs text-silk/50">
                            武{general.might} 知{general.intellect} 政{general.politics} 魅{general.charisma}
                          </div>
                        </div>
                      </button>
                      {isSelected && !isCommander && (
                        <button
                          onClick={() => onSetCommander(general.id)}
                          className="btn-wood px-2 py-1 text-xs rounded"
                        >
                          주장 지정
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSetStep('target')}
              className="btn-wood flex-1 py-3 rounded-lg"
            >
              ← 이전
            </button>
            <button
              onClick={() => onSetStep('troops')}
              disabled={march.units.length === 0}
              className="btn-gold flex-1 py-3 rounded-lg"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 병력 배분 */}
      {march.step === 'troops' && (
        <div className="dynasty-card rounded-lg p-4 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-gold font-bold">⚔️ 병력 편성</h3>
          </div>

          {/* 병력 현황 바 */}
          <div className="silk-card rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dynasty-medium">출발지 병력</span>
              <span className="text-dynasty-black font-medium">{sourceRegion.troops.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dynasty-medium">최소 수비</span>
              <span className="text-crimson font-medium">-{minDefenseTroops.toLocaleString()}</span>
            </div>
            <div className="divider-gold my-2 opacity-30"></div>
            <div className="flex justify-between text-sm">
              <span className="text-dynasty-medium">가용 병력</span>
              <span className="text-jade font-bold">{availableTroops.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dynasty-medium">배분 완료</span>
              <span className="text-jade font-medium">-{totalAssignedTroops.toLocaleString()}</span>
            </div>
            <div className="divider-gold my-2 opacity-30"></div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gold-dark">남은 가용</span>
              <span className={remainingTroops >= 0 ? 'text-gold-dark' : 'text-crimson'}>
                {remainingTroops.toLocaleString()}
              </span>
            </div>
            {/* 프로그레스 바 */}
            <div className="progress-bar h-3">
              <div 
                className={`progress-fill ${totalAssignedTroops > availableTroops ? 'crimson' : 'jade'}`}
                style={{ width: `${Math.min(100, (totalAssignedTroops / availableTroops) * 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {march.units.map(unit => {
              const general = GENERALS[unit.generalId];
              if (!general) return null;
              
              // 이 장수가 사용 가능한 최대 병력 = 남은 가용 + 현재 배분량
              const maxForThisUnit = remainingTroops + unit.troops;

              return (
                <div key={unit.generalId} className="peace-card rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{general.portrait}</span>
                      <span className="font-bold text-dynasty-black">{general.nameKo}</span>
                      {unit.isCommander && <span className="text-gold text-sm">⭐</span>}
                    </div>
                    <span className="text-lg font-bold text-jade">
                      {unit.troops.toLocaleString()}
                    </span>
                  </div>

                  {/* 병종 선택 */}
                  <div className="flex gap-2">
                    {TROOP_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => onAssignTroops(unit.generalId, unit.troops, type.id)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          unit.troopType === type.id
                            ? 'btn-gold'
                            : 'btn-wood'
                        }`}
                      >
                        {type.icon} {type.name}
                      </button>
                    ))}
                  </div>

                  {/* 병력 슬라이더 */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, maxForThisUnit)}
                      step={100}
                      value={unit.troops}
                      onChange={(e) => onAssignTroops(unit.generalId, Number(e.target.value), unit.troopType)}
                      className="w-full h-3 bg-parchment-dark rounded-lg appearance-none cursor-pointer accent-gold"
                    />
                  </div>

                  {/* 빠른 배분 버튼 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAssignTroops(unit.generalId, 0, unit.troopType)}
                      className="btn-wood flex-1 py-1 text-xs rounded"
                    >
                      초기화
                    </button>
                    <button
                      onClick={() => onAssignTroops(unit.generalId, Math.floor(maxForThisUnit / 2), unit.troopType)}
                      className="btn-wood flex-1 py-1 text-xs rounded"
                    >
                      절반
                    </button>
                    <button
                      onClick={() => onAssignTroops(unit.generalId, maxForThisUnit, unit.troopType)}
                      className="btn-gold flex-1 py-1 text-xs rounded"
                    >
                      최대
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSetStep('generals')}
              className="btn-wood flex-1 py-3 rounded-lg"
            >
              ← 이전
            </button>
            <button
              onClick={() => onSetStep('confirm')}
              disabled={totalAssignedTroops === 0 || totalAssignedTroops > availableTroops}
              className="btn-gold flex-1 py-3 rounded-lg"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 최종 확인 */}
      {march.step === 'confirm' && targetRegion && (
        <div className="dynasty-card rounded-lg p-4 space-y-4 animate-fade-in">
          <h3 className="text-gold font-bold text-center text-xl title-glow">⚔️ 출진 확인</h3>

          {/* 목표 */}
          <div className="war-card rounded-lg p-3">
            <div className="text-sm text-crimson-light mb-1">🎯 목표</div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-silk text-lg">{targetRegion.nameKo}</span>
              <div className="text-right">
                <div className="text-crimson-light font-bold">⚔️ {targetRegion.troops.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 아군 편성 */}
          <div className="peace-card rounded-lg p-3">
            <div className="text-sm text-jade-light mb-2">🏴 아군 편성</div>
            {march.units.map(unit => {
              const general = GENERALS[unit.generalId];
              if (!general) return null;
              const troopType = TROOP_TYPES.find(t => t.id === unit.troopType);
              return (
                <div key={unit.generalId} className="flex justify-between items-center py-1 border-b border-jade/30 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{general.portrait}</span>
                    <span className="text-silk">
                      {general.nameKo}
                      {unit.isCommander && <span className="text-gold ml-1">⭐</span>}
                    </span>
                  </div>
                  <div className="text-jade-light text-sm font-medium">
                    {troopType?.icon} {unit.troops.toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-jade/50">
              <span className="text-jade-light">총 병력</span>
              <span className="font-bold text-silk">{totalAssignedTroops.toLocaleString()}</span>
            </div>
          </div>

          {/* 소모 자원 */}
          <div className="silk-card rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-dynasty-medium">🌾 필요 식량</span>
              <span className={sourceRegion.food >= march.foodRequired ? 'text-jade font-bold' : 'text-crimson font-bold'}>
                {march.foodRequired.toLocaleString()} / {sourceRegion.food.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 전력 비교 */}
          <div className="dynasty-card rounded-lg p-3 text-center border border-gold/30">
            <div className="text-sm text-silk/60 mb-1">⚖️ 전력 비교</div>
            <div className="flex items-center justify-center gap-4">
              <span className="text-jade-light font-bold text-xl">{totalAssignedTroops.toLocaleString()}</span>
              <span className="text-gold font-bold">vs</span>
              <span className="text-crimson-light font-bold text-xl">{targetRegion.troops.toLocaleString()}</span>
            </div>
            <div className="text-xs text-silk/50 mt-2">
              {totalAssignedTroops > targetRegion.troops
                ? '✨ 아군 우세'
                : totalAssignedTroops < targetRegion.troops
                ? '⚠️ 적군 우세'
                : '⚔️ 호각'}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSetStep('troops')}
              className="btn-wood flex-1 py-3 rounded-lg"
            >
              ← 이전
            </button>
            <button
              onClick={onConfirm}
              disabled={sourceRegion.food < march.foodRequired}
              className="btn-war flex-1 py-3 rounded-lg text-lg animate-pulse-crimson"
            >
              ⚔️ 출진!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
