'use client';

interface TitleScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
  hasSaveData: boolean;
}

export default function TitleScreen({ onNewGame, onContinue, hasSaveData }: TitleScreenProps) {
  const handleContinue = () => {
    if (hasSaveData) {
      onContinue();
    } else {
      alert('저장된 게임이 없습니다.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <img
          src="/images/title-bg.png"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* 어두운 오버레이 - 텍스트 가독성 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
      </div>

      {/* 타이틀 로고 */}
      <div className="text-center mb-16 relative z-10 animate-slide-up">
        {/* 성 아이콘 */}
        <div className="text-8xl mb-6 animate-float">🏯</div>
        
        {/* 메인 타이틀 */}
        <h1 className="text-5xl font-bold text-gold tracking-wider mb-3 title-fancy">
          삼국지
        </h1>
        
        {/* 부제 */}
        <div className="divider-gold w-48 mx-auto mb-3"></div>
        <p className="text-2xl text-crimson font-bold tracking-[0.3em]">
          軍雄割據
        </p>
        <div className="divider-gold w-48 mx-auto mt-3"></div>
        
        {/* 한문 문구 */}
        <p className="text-sm text-silk/40 mt-6 tracking-widest">
          天下三分 誰主沉浮
        </p>
      </div>

      {/* 메뉴 버튼들 */}
      <div className="space-y-4 w-full max-w-xs relative z-10">
        <button
          onClick={onNewGame}
          className="btn-war w-full py-4 px-6 text-xl rounded-lg flex items-center justify-center gap-3 animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="text-2xl">🎮</span>
          새 게임
        </button>

        <button
          onClick={handleContinue}
          disabled={!hasSaveData}
          className={`w-full py-4 px-6 text-xl rounded-lg flex items-center justify-center gap-3 animate-scale-in ${
            hasSaveData ? 'btn-peace' : 'btn-wood opacity-50'
          }`}
          style={{ animationDelay: '0.3s' }}
        >
          <span className="text-2xl">📂</span>
          이어하기
          {!hasSaveData && <span className="text-xs opacity-70">(저장 없음)</span>}
        </button>

        <button
          disabled
          className="btn-wood w-full py-4 px-6 text-xl rounded-lg flex items-center justify-center gap-3 opacity-50 cursor-not-allowed animate-scale-in"
          style={{ animationDelay: '0.4s' }}
        >
          <span className="text-2xl">⚙️</span>
          설정
          <span className="text-xs opacity-70">(준비 중)</span>
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-8 text-center text-silk/30 text-sm">
        <p className="font-medium">Warlords: Three Kingdoms</p>
        <p className="mt-1 text-xs">v0.1.0</p>
      </div>
    </div>
  );
}
