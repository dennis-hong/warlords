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
    <div className="min-h-screen relative overflow-y-auto">
      {/* 배경 이미지 */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="/images/title-bg.png"
          alt=""
          className="w-full h-full object-cover"
        />
        {/* 어두운 오버레이 - 텍스트 가독성 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6 sm:p-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* 타이틀 로고 */}
          <div className="text-center mb-8 sm:mb-14 animate-slide-up">
            {/* 성 아이콘 */}
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6 animate-float">🏯</div>
            
            {/* 메인 타이틀 */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gold tracking-wider mb-2 sm:mb-3 title-fancy">
              삼국지
            </h1>
            
            {/* 부제 */}
            <div className="divider-gold w-40 sm:w-48 mx-auto mb-2 sm:mb-3"></div>
            <p className="text-xl sm:text-2xl text-crimson font-bold tracking-[0.22em] sm:tracking-[0.3em]">
              軍雄割據
            </p>
            <div className="divider-gold w-40 sm:w-48 mx-auto mt-2 sm:mt-3"></div>
            
            {/* 한문 문구 */}
            <p className="text-xs sm:text-sm text-silk/40 mt-4 sm:mt-6 tracking-[0.25em] sm:tracking-widest">
              天下三分 誰主沉浮
            </p>
          </div>

          {/* 메뉴 버튼들 */}
          <div className="space-y-3 sm:space-y-4 w-full max-w-xs">
            <button
              onClick={onNewGame}
              className="btn-war w-full min-h-[48px] py-3.5 sm:py-4 px-6 text-lg sm:text-xl rounded-lg flex items-center justify-center gap-3 animate-scale-in"
              style={{ animationDelay: '0.2s' }}
            >
              <span className="text-xl sm:text-2xl">🎮</span>
              새 게임
            </button>

            <button
              onClick={handleContinue}
              disabled={!hasSaveData}
              className={`w-full min-h-[48px] py-3.5 sm:py-4 px-6 text-lg sm:text-xl rounded-lg flex items-center justify-center gap-3 animate-scale-in ${
                hasSaveData ? 'btn-peace' : 'btn-wood opacity-50'
              }`}
              style={{ animationDelay: '0.3s' }}
            >
              <span className="text-xl sm:text-2xl">📂</span>
              이어하기
              {!hasSaveData && <span className="text-xs opacity-70">(저장 없음)</span>}
            </button>

            <button
              disabled
              className="btn-wood w-full min-h-[48px] py-3.5 sm:py-4 px-6 text-lg sm:text-xl rounded-lg flex items-center justify-center gap-3 opacity-50 cursor-not-allowed animate-scale-in"
              style={{ animationDelay: '0.4s' }}
            >
              <span className="text-xl sm:text-2xl">⚙️</span>
              설정
              <span className="text-xs opacity-70">(준비 중)</span>
            </button>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center text-silk/30 text-xs sm:text-sm pb-2 safe-area-bottom">
          <p className="font-medium">Warlords: Three Kingdoms</p>
          <p className="mt-1 text-xs">v0.1.0</p>
        </div>
      </div>
    </div>
  );
}
