import type { Region, FactionId, Faction, General } from '../../types';

interface EnemyRegionPopupProps {
  region: Region;
  faction: Faction;
  getGeneral: (id: string) => General | null;
  onClose: () => void;
  onAttack: () => void;
}

/**
 * 적 성 정보 팝업 - 정찰 느낌의 제한된 정보 표시
 */
export function EnemyRegionPopup({
  region,
  faction,
  getGeneral,
  onClose,
  onAttack,
}: EnemyRegionPopupProps) {
  // 병력을 대략적으로 표시 (정찰 느낌)
  const getTroopLevel = (troops: number): { label: string; color: string; icon: string } => {
    if (troops >= 15000) return { label: '대군', color: 'text-crimson-light', icon: '🔴' };
    if (troops >= 10000) return { label: '강병', color: 'text-orange-400', icon: '🟠' };
    if (troops >= 6000) return { label: '보통', color: 'text-yellow-400', icon: '🟡' };
    if (troops >= 3000) return { label: '소수', color: 'text-jade-light', icon: '🟢' };
    return { label: '허약', color: 'text-silk/50', icon: '⚪' };
  };

  // 방어도를 대략적으로 표시
  const getDefenseLevel = (defense: number): { label: string; icon: string } => {
    if (defense >= 80) return { label: '철옹성', icon: '🏰' };
    if (defense >= 60) return { label: '견고', icon: '🧱' };
    if (defense >= 40) return { label: '보통', icon: '🪵' };
    return { label: '허술', icon: '🕳️' };
  };

  const troopLevel = getTroopLevel(region.troops);
  const defenseLevel = getDefenseLevel(region.defense);

  // 태수 (첫 번째 장수)
  const governor = region.generals.length > 0 ? getGeneral(region.generals[0]) : null;
  const generalCount = region.generals.length;

  return (
    <div className="dynasty-card rounded-lg p-3 animate-slide-up border border-wood/50">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-base border border-wood/60"
            style={{ backgroundColor: faction.color }}
          >
            🏯
          </div>
          <div>
            <h3 className="font-bold text-gold text-base leading-tight">
              {region.nameKo}
            </h3>
            <p className="text-xs text-silk/50 leading-tight">
              {faction.nameKo} 세력
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-dynasty-medium/50 text-silk/40 active:bg-dynasty-medium text-sm"
        >
          ✕
        </button>
      </div>

      {/* 정찰 정보 */}
      <div className="bg-dynasty-dark/50 rounded-md p-2.5 mb-2.5 space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-silk/40 mb-1">
          <span>🔍</span>
          <span className="italic">정찰 보고</span>
        </div>

        {/* 태수 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-silk/60">🎖️ 태수</span>
          <span className="text-parchment font-medium">
            {governor ? (
              <span className="flex items-center gap-1">
                <span>{governor.portrait}</span>
                <span>{governor.nameKo}</span>
              </span>
            ) : (
              <span className="text-silk/30">불명</span>
            )}
          </span>
        </div>

        {/* 장수 수 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-silk/60">👥 장수</span>
          <span className="text-parchment">
            {generalCount > 0 ? `${generalCount}명 확인` : '정보 없음'}
          </span>
        </div>

        {/* 병력 수준 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-silk/60">⚔️ 병력</span>
          <span className={`font-medium flex items-center gap-1 ${troopLevel.color}`}>
            <span>{troopLevel.icon}</span>
            <span>{troopLevel.label}</span>
          </span>
        </div>

        {/* 방어도 */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-silk/60">🏰 방어</span>
          <span className="text-parchment flex items-center gap-1">
            <span>{defenseLevel.icon}</span>
            <span>{defenseLevel.label}</span>
          </span>
        </div>
      </div>

      {/* 출진 버튼 */}
      <button
        onClick={onAttack}
        className="btn-war w-full py-2.5 rounded-lg text-sm active:scale-[0.98] transition-transform"
      >
        ⚔️ 출진 준비
      </button>
    </div>
  );
}
