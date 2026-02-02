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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950 to-gray-900 flex flex-col items-center justify-center p-6">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10">🐉</div>
        <div className="absolute top-20 right-10 text-5xl opacity-10">⚔️</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-10">🏯</div>
        <div className="absolute bottom-10 right-20 text-5xl opacity-10">🐲</div>
      </div>

      {/* 타이틀 로고 */}
      <div className="text-center mb-16 relative z-10">
        <div className="text-7xl mb-4 animate-pulse">🏯</div>
        <h1 className="text-4xl font-bold text-yellow-400 tracking-wider mb-2"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          삼국지
        </h1>
        <p className="text-2xl text-red-400 font-medium tracking-widest">
          - 군웅할거 -
        </p>
        <p className="text-sm text-gray-500 mt-4">
          天下三分 誰主沉浮
        </p>
      </div>

      {/* 메뉴 버튼들 */}
      <div className="space-y-4 w-full max-w-xs relative z-10">
        <button
          onClick={onNewGame}
          className="w-full py-4 px-6 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white text-xl font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <span className="text-2xl">🎮</span>
          새 게임
        </button>

        <button
          onClick={handleContinue}
          className={`w-full py-4 px-6 text-xl font-bold rounded-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-3
            ${hasSaveData 
              ? 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white hover:scale-105' 
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
        >
          <span className="text-2xl">📂</span>
          이어하기
          {!hasSaveData && <span className="text-xs">(저장 없음)</span>}
        </button>

        <button
          disabled
          className="w-full py-4 px-6 bg-gray-700 text-gray-500 text-xl font-bold rounded-lg shadow-lg flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <span className="text-2xl">⚙️</span>
          설정
          <span className="text-xs">(준비 중)</span>
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="absolute bottom-6 text-center text-gray-600 text-sm">
        <p>Warlords: Three Kingdoms</p>
        <p className="mt-1">v0.1.0</p>
      </div>
    </div>
  );
}
