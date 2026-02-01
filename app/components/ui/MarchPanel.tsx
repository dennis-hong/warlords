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
              className={`flex flex-col items-center flex-1 ${isActive ? 'opacity-100' : 'opacity-50'}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${isActive ? 'bg-yellow-500 text-black' : isPast ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
              >
                {isPast ? '✓' : cfg.icon}
              </div>
              <div className={`text-xs mt-1 ${isActive ? 'text-yellow-400' : 'text-gray-500'}`}>
                {cfg.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: 목표 선택 */}
      {march.step === 'target' && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-yellow-400 font-bold">🎯 목표 성 선택</h3>
            <span className="text-sm text-gray-400">출발: {sourceRegion.nameKo}</span>
          </div>

          {adjacentEnemyRegions.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              <div className="text-3xl mb-2">🚫</div>
              <p>인접한 적 영토가 없습니다</p>
              <p className="text-sm mt-1">다른 지역에서 출진하세요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {adjacentEnemyRegions.map(region => (
                <button
                  key={region.id}
                  onClick={() => onSelectTarget(region.id)}
                  className={`w-full p-3 rounded-lg border transition-all ${
                    march.targetRegion === region.id
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="text-left">
                      <div className="font-bold text-white">{region.nameKo}</div>
                      <div className="text-sm text-gray-400">
                        {allRegions[region.id] && `소속: ${region.owner}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400">⚔️ {region.troops.toLocaleString()}</div>
                      <div className="text-blue-400 text-sm">🏰 {region.defense}%</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => march.targetRegion && onSetStep('generals')}
              disabled={!march.targetRegion}
              className="flex-1 py-3 rounded-lg bg-yellow-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 장수 편성 */}
      {march.step === 'generals' && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-yellow-400 font-bold">👥 장수 편성</h3>
            <span className="text-sm text-gray-400">
              {march.units.length}/3 선택
            </span>
          </div>

          {availableGenerals.length === 0 ? (
            <div className="text-center text-gray-400 py-6">
              <div className="text-3xl mb-2">😢</div>
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
                    className={`p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-yellow-500 bg-yellow-500/20'
                        : 'border-gray-600 bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <button
                        onClick={() => onToggleGeneral(general.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        <div className="text-2xl">{general.portrait}</div>
                        <div>
                          <div className="font-bold text-white">
                            {general.nameKo}
                            {isCommander && <span className="ml-2 text-yellow-400">⭐ 주장</span>}
                          </div>
                          <div className="text-xs text-gray-400">
                            武{general.might} 知{general.intellect} 政{general.politics} 魅{general.charisma}
                          </div>
                        </div>
                      </button>
                      {isSelected && !isCommander && (
                        <button
                          onClick={() => onSetCommander(general.id)}
                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-yellow-600 rounded transition-colors"
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
              className="flex-1 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={() => onSetStep('troops')}
              disabled={march.units.length === 0}
              className="flex-1 py-3 rounded-lg bg-yellow-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 병력 배분 */}
      {march.step === 'troops' && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-yellow-400 font-bold">⚔️ 병력 편성</h3>
            <span className="text-sm text-gray-400">
              가용: {availableTroops.toLocaleString()}
            </span>
          </div>

          <div className="bg-gray-700/50 rounded p-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>총 배분 병력:</span>
              <span className={totalAssignedTroops > availableTroops ? 'text-red-400' : 'text-green-400'}>
                {totalAssignedTroops.toLocaleString()} / {availableTroops.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {march.units.map(unit => {
              const general = GENERALS[unit.generalId];
              if (!general) return null;

              return (
                <div key={unit.generalId} className="bg-gray-700 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{general.portrait}</span>
                    <span className="font-bold text-white">{general.nameKo}</span>
                    {unit.isCommander && <span className="text-yellow-400 text-sm">⭐ 주장</span>}
                  </div>

                  {/* 병종 선택 */}
                  <div className="flex gap-2">
                    {TROOP_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => onAssignTroops(unit.generalId, unit.troops, type.id)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          unit.troopType === type.id
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {type.icon} {type.name}
                      </button>
                    ))}
                  </div>

                  {/* 병력 슬라이더 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>병력</span>
                      <span>{unit.troops.toLocaleString()}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={availableTroops}
                      step={100}
                      value={unit.troops}
                      onChange={(e) => onAssignTroops(unit.generalId, Number(e.target.value), unit.troopType)}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span>{availableTroops.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onSetStep('generals')}
              className="flex-1 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={() => onSetStep('confirm')}
              disabled={totalAssignedTroops === 0 || totalAssignedTroops > availableTroops}
              className="flex-1 py-3 rounded-lg bg-yellow-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
            >
              다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 최종 확인 */}
      {march.step === 'confirm' && targetRegion && (
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <h3 className="text-yellow-400 font-bold text-center">⚔️ 출진 확인</h3>

          {/* 목표 */}
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="text-sm text-red-300 mb-1">🎯 목표</div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white text-lg">{targetRegion.nameKo}</span>
              <div className="text-right">
                <div className="text-red-400">⚔️ {targetRegion.troops.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* 아군 편성 */}
          <div className="bg-green-900/30 border border-green-700 rounded-lg p-3">
            <div className="text-sm text-green-300 mb-2">🏴 아군 편성</div>
            {march.units.map(unit => {
              const general = GENERALS[unit.generalId];
              if (!general) return null;
              const troopType = TROOP_TYPES.find(t => t.id === unit.troopType);
              return (
                <div key={unit.generalId} className="flex justify-between items-center py-1 border-b border-green-700/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{general.portrait}</span>
                    <span className="text-white">
                      {general.nameKo}
                      {unit.isCommander && <span className="text-yellow-400 ml-1">⭐</span>}
                    </span>
                  </div>
                  <div className="text-green-300 text-sm">
                    {troopType?.icon} {unit.troops.toLocaleString()}
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-green-700">
              <span className="text-green-300">총 병력</span>
              <span className="font-bold text-white">{totalAssignedTroops.toLocaleString()}</span>
            </div>
          </div>

          {/* 소모 자원 */}
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">🌾 필요 식량</span>
              <span className={sourceRegion.food >= march.foodRequired ? 'text-green-400' : 'text-red-400'}>
                {march.foodRequired.toLocaleString()} / {sourceRegion.food.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 전력 비교 */}
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-400 mb-1">⚖️ 전력 비교</div>
            <div className="flex items-center justify-center gap-4">
              <span className="text-green-400 font-bold">{totalAssignedTroops.toLocaleString()}</span>
              <span className="text-gray-500">vs</span>
              <span className="text-red-400 font-bold">{targetRegion.troops.toLocaleString()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
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
              className="flex-1 py-3 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              ← 이전
            </button>
            <button
              onClick={onConfirm}
              disabled={sourceRegion.food < march.foodRequired}
              className="flex-1 py-3 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
            >
              ⚔️ 출진!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
