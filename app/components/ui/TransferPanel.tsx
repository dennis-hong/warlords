'use client';

import { useState, useMemo } from 'react';
import type { Region, RegionId, General } from '../../types';
import { GeneralPortrait } from './GeneralPortrait';

type TransferStep = 'source' | 'destination' | 'items';
type TransferItemType = 'general' | 'troops' | 'gold' | 'food';

interface TransferPanelProps {
  playerRegions: Region[];
  allRegions: Record<RegionId, Region>;
  initialSourceRegion?: RegionId | null;
  actionsRemaining: number;
  getGeneral: (id: string) => General | null;
  onTransfer: (params: TransferParams) => { success: boolean; message: string };
  onClose: () => void;
}

export interface TransferParams {
  sourceRegion: RegionId;
  destRegion: RegionId;
  generals: string[];
  troops: number;
  gold: number;
  food: number;
}

export function TransferPanel({
  playerRegions,
  allRegions,
  initialSourceRegion,
  actionsRemaining,
  getGeneral,
  onTransfer,
  onClose,
}: TransferPanelProps) {
  const [step, setStep] = useState<TransferStep>(initialSourceRegion ? 'destination' : 'source');
  const [sourceRegion, setSourceRegion] = useState<RegionId | null>(initialSourceRegion ?? null);
  const [destRegion, setDestRegion] = useState<RegionId | null>(null);
  const [selectedGenerals, setSelectedGenerals] = useState<string[]>([]);
  const [troopsToMove, setTroopsToMove] = useState(0);
  const [goldToMove, setGoldToMove] = useState(0);
  const [foodToMove, setFoodToMove] = useState(0);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const sourceData = sourceRegion ? allRegions[sourceRegion] : null;
  const destData = destRegion ? allRegions[destRegion] : null;

  // 인접한 플레이어 지역만 목적지로 가능
  const availableDestinations = useMemo(() => {
    if (!sourceRegion || !sourceData) return [];
    const adjacentIds = sourceData.adjacent;
    return playerRegions.filter(r => adjacentIds.includes(r.id) && r.id !== sourceRegion);
  }, [sourceRegion, sourceData, playerRegions]);

  // 출발 성의 장수 목록
  const sourceGenerals = useMemo(() => {
    if (!sourceData) return [];
    return sourceData.generals.map(id => getGeneral(id)).filter(Boolean) as General[];
  }, [sourceData, getGeneral]);

  // 이동할 항목이 있는지
  const hasTransferItems = selectedGenerals.length > 0 || troopsToMove > 0 || goldToMove > 0 || foodToMove > 0;

  const handleSelectSource = (regionId: RegionId) => {
    setSourceRegion(regionId);
    setDestRegion(null);
    setSelectedGenerals([]);
    setTroopsToMove(0);
    setGoldToMove(0);
    setFoodToMove(0);
    setStep('destination');
  };

  const handleSelectDest = (regionId: RegionId) => {
    setDestRegion(regionId);
    setStep('items');
  };

  const toggleGeneral = (generalId: string) => {
    setSelectedGenerals(prev =>
      prev.includes(generalId)
        ? prev.filter(id => id !== generalId)
        : [...prev, generalId]
    );
  };

  const handleConfirm = () => {
    if (!sourceRegion || !destRegion) return;

    const result = onTransfer({
      sourceRegion,
      destRegion,
      generals: selectedGenerals,
      troops: troopsToMove,
      gold: goldToMove,
      food: foodToMove,
    });

    setResultMessage(result.message);

    if (result.success) {
      // 성공 시 잠깐 결과 보여주고 닫기
      setTimeout(() => onClose(), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* 패널 */}
      <div className="relative silk-card rounded-t-xl sm:rounded-xl overflow-hidden shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col animate-slide-up">
        {/* 헤더 */}
        <div className="bg-wood px-4 py-3 border-b-2 border-gold/30 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gold title-glow flex items-center gap-2">
            🚚 이동
          </h3>
          <div className="flex items-center gap-3">
            {/* 단계 표시 */}
            <div className="flex items-center gap-1 text-xs">
              <span className={step === 'source' ? 'text-gold font-bold' : 'text-parchment/50'}>출발</span>
              <span className="text-parchment/50">→</span>
              <span className={step === 'destination' ? 'text-gold font-bold' : 'text-parchment/50'}>도착</span>
              <span className="text-parchment/50">→</span>
              <span className={step === 'items' ? 'text-gold font-bold' : 'text-parchment/50'}>항목</span>
            </div>
            <button onClick={onClose} className="text-parchment/60 text-lg active:text-parchment">✕</button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* 결과 메시지 */}
          {resultMessage && (
            <div className={`p-3 rounded-lg text-sm text-center font-medium ${
              resultMessage.includes('성공') || resultMessage.includes('완료')
                ? 'bg-jade/20 text-jade-light border border-jade/30'
                : 'bg-crimson/20 text-crimson-light border border-crimson/30'
            }`}>
              {resultMessage}
            </div>
          )}

          {/* Step 1: 출발 성 선택 */}
          {step === 'source' && (
            <div className="space-y-2">
              <p className="text-sm text-parchment/80 mb-2">출발할 성을 선택하세요</p>
              {playerRegions.map(region => (
                <button
                  key={region.id}
                  onClick={() => handleSelectSource(region.id)}
                  className="w-full dynasty-card rounded-lg p-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gold text-sm">🏯 {region.nameKo}</span>
                      <div className="text-xs text-parchment/70 mt-0.5">
                        장수 {region.generals.length}명 · ⚔️{(region.troops / 1000).toFixed(0)}k
                      </div>
                    </div>
                    <div className="text-xs text-parchment/60 space-x-2">
                      <span>💰{region.gold.toLocaleString()}</span>
                      <span>🌾{region.food.toLocaleString()}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: 도착 성 선택 */}
          {step === 'destination' && sourceData && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-parchment/80">
                  <span className="text-gold font-medium">{sourceData.nameKo}</span>에서 이동할 곳
                </p>
                <button onClick={() => { setStep('source'); setSourceRegion(null); }} className="text-xs text-parchment/60 active:text-parchment">
                  ← 변경
                </button>
              </div>

              {availableDestinations.length === 0 ? (
                <div className="dynasty-card rounded-lg p-4 text-center">
                  <p className="text-sm text-parchment/70">인접한 아군 성이 없습니다</p>
                  <p className="text-xs text-parchment/50 mt-1">인접한 자기 영토로만 이동할 수 있습니다</p>
                </div>
              ) : (
                availableDestinations.map(region => (
                  <button
                    key={region.id}
                    onClick={() => handleSelectDest(region.id)}
                    className="w-full dynasty-card rounded-lg p-3 text-left active:scale-[0.98] transition-transform"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gold text-sm">🏯 {region.nameKo}</span>
                        <div className="text-xs text-parchment/70 mt-0.5">
                          장수 {region.generals.length}명 · ⚔️{(region.troops / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <span className="text-jade-light text-xs">→ 이동</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Step 3: 이동할 항목 선택 */}
          {step === 'items' && sourceData && destData && (
            <div className="space-y-3">
              {/* 경로 표시 */}
              <div className="flex items-center justify-center gap-2 text-sm py-1">
                <span className="text-gold font-medium">🏯 {sourceData.nameKo}</span>
                <span className="text-parchment/60">→</span>
                <span className="text-jade-light font-medium">🏯 {destData.nameKo}</span>
                <button onClick={() => { setStep('destination'); setDestRegion(null); }} className="text-xs text-parchment/60 ml-1 active:text-parchment">
                  변경
                </button>
              </div>

              {/* 장수 이동 */}
              <div className="space-y-1.5">
                <h4 className="text-xs text-parchment/80 font-medium">🎖️ 장수 이동</h4>
                {sourceGenerals.length === 0 ? (
                  <p className="text-xs text-parchment/50 pl-2">이동 가능한 장수가 없습니다</p>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5">
                    {sourceGenerals.map(general => {
                      const isSelected = selectedGenerals.includes(general.id);
                      return (
                        <button
                          key={general.id}
                          onClick={() => toggleGeneral(general.id)}
                          className={`rounded-lg p-2 text-left transition-all active:scale-[0.97] text-sm ${
                            isSelected
                              ? 'bg-jade/20 border border-jade/50 text-jade-light'
                              : 'bg-dynasty-dark/50 border border-wood/20 text-parchment/80'
                          }`}
                        >
                          <span className="flex items-center gap-1"><GeneralPortrait generalId={general.id} portrait={general.portrait || ''} size="sm" /> {general.nameKo}</span>
                          {isSelected && <span className="ml-1 text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 병력 이동 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-parchment/80 font-medium">⚔️ 병력 이동</h4>
                  <span className="text-xs text-parchment/60">보유: {sourceData.troops.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={sourceData.troops}
                    step={500}
                    value={troopsToMove}
                    onChange={(e) => setTroopsToMove(Number(e.target.value))}
                    className="flex-1 accent-crimson-light"
                  />
                  <span className="text-sm text-crimson-light font-medium min-w-[60px] text-right">
                    {troopsToMove.toLocaleString()}
                  </span>
                </div>
                {/* 빠른 선택 */}
                <div className="flex gap-1.5">
                  {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setTroopsToMove(Math.floor(sourceData.troops * ratio))}
                      className="flex-1 text-xs py-1 rounded bg-dynasty-dark/50 text-parchment/70 active:bg-dynasty-medium"
                    >
                      {ratio === 0 ? '0' : `${Math.round(ratio * 100)}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 금 이동 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-parchment/80 font-medium">💰 금 이동</h4>
                  <span className="text-xs text-parchment/60">보유: {sourceData.gold.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={sourceData.gold}
                    step={100}
                    value={goldToMove}
                    onChange={(e) => setGoldToMove(Number(e.target.value))}
                    className="flex-1 accent-gold"
                  />
                  <span className="text-sm text-gold font-medium min-w-[60px] text-right">
                    {goldToMove.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 식량 이동 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs text-parchment/80 font-medium">🌾 식량 이동</h4>
                  <span className="text-xs text-parchment/60">보유: {sourceData.food.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={sourceData.food}
                    step={100}
                    value={foodToMove}
                    onChange={(e) => setFoodToMove(Number(e.target.value))}
                    className="flex-1 accent-jade-light"
                  />
                  <span className="text-sm text-jade-light font-medium min-w-[60px] text-right">
                    {foodToMove.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 행동력 비용 안내 */}
              <div className="bg-dynasty-dark/50 rounded-md p-2 text-xs text-parchment/70 flex items-center gap-1.5">
                <span>⚡</span>
                <span>이동에 행동력 1 소모 (남은 행동력: <span className={actionsRemaining > 0 ? 'text-gold' : 'text-crimson-light'}>{actionsRemaining}</span>)</span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        {step === 'items' && (
          <div className="p-4 pt-0 flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 min-h-[48px] py-2.5 px-4 rounded-lg bg-dynasty-medium/50 text-parchment/80 active:bg-dynasty-medium transition-colors font-medium active:scale-[0.97]"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasTransferItems || actionsRemaining <= 0}
              className={`flex-1 min-h-[48px] py-2.5 px-4 rounded-lg font-medium transition-all active:scale-[0.97] ${
                hasTransferItems && actionsRemaining > 0
                  ? 'btn-peace'
                  : 'bg-dynasty-medium/30 text-silk/30 cursor-not-allowed'
              }`}
            >
              이동 실행
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
