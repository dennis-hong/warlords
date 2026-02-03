'use client';

import { useState, useMemo } from 'react';
import { useGameState } from '../hooks/useGameState';
import {
  ResourceBar,
  WorldMap,
  DomesticPanel,
  BottomTabs,
  RegionList,
  MarchPanel,
  RecruitPanel,
  PrisonerPanel,
  Toast,
  useToast,
  ConfirmModal,
  EventModal,
  EventLog
} from './ui';
import AdvisorPanel from './ui/AdvisorPanel';
import BattleScreen from './BattleScreen';
import BattleResultScreen from './BattleResultScreen';
import TitleScreen from './TitleScreen';
import FactionSelectScreen from './FactionSelectScreen';
import { SEASONS, DOMESTIC_COMMANDS } from '../constants/worldData';
import { INITIAL_LOYALTY } from '../constants/gameData';
import { getAdvisorSession } from '../advisor';
import type { GameTab, RegionId, DomesticAction } from '../types';

export default function WarlordsGame() {
  const {
    game,
    isClient,
    playerRegions,
    totalResources,
    selectRegion,
    executeDomestic,
    endTurn,
    newGame,
    // 게임 페이즈 관리
    gamePhase,
    hasSaveData,
    startNewGame,
    selectFactionAndStart,
    continueGame,
    backToTitle,
    // 출진 시스템
    startMarch,
    cancelMarch,
    selectMarchTarget,
    setMarchStep,
    toggleMarchGeneral,
    setCommander,
    assignTroops,
    confirmMarch,
    handleBattleEnd,
    closeBattleResult,
    // 장수 등용 시스템
    getFreeGeneralsInRegion,
    getPlayerPrisoners,
    getGeneral,
    recruitFreeGeneral,
    recruitPrisoner,
    executePrisoner,
    releasePrisoner,
    // 이벤트 시스템
    handleEventChoice
  } = useGameState();

  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [showRecruitPanel, setShowRecruitPanel] = useState(false);
  const [showPrisonerPanel, setShowPrisonerPanel] = useState(false);
  const [showEndTurnModal, setShowEndTurnModal] = useState(false);
  const [showAdvisorPanel, setShowAdvisorPanel] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const { messages: toastMessages, showToast, removeToast } = useToast();

  // 전략 조언 세션 (game이 있을 때만)
  const advisorSession = useMemo(() => {
    if (!game) return null;
    return getAdvisorSession(game);
  }, [game?.turn, game?.playerFaction, game?.regions]);

  // 로딩 (클라이언트 준비 전)
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-4 animate-float">🏯</div>
          <div className="text-xl text-gold title-glow">천하 준비 중...</div>
        </div>
      </div>
    );
  }

  // 타이틀 화면
  if (gamePhase === 'title') {
    return (
      <TitleScreen
        onNewGame={startNewGame}
        onContinue={continueGame}
        hasSaveData={hasSaveData}
      />
    );
  }

  // 세력 선택 화면
  if (gamePhase === 'faction_select') {
    return (
      <FactionSelectScreen
        onSelectFaction={selectFactionAndStart}
        onBack={backToTitle}
      />
    );
  }

  // 게임 데이터 없음 (playing 상태인데 game이 null인 경우)
  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center dynasty-card p-8 rounded-xl">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl text-crimson-light mb-4">게임 로딩 오류</div>
          <button 
            onClick={backToTitle}
            className="btn-war px-6 py-3 rounded-lg"
          >
            타이틀로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const season = SEASONS[game.season];
  const selectedRegionData = game.selectedRegion ? game.regions[game.selectedRegion] : null;
  const isPlayerRegion = selectedRegionData?.owner === game.playerFaction;

  const handleSelectRegion = (regionId: RegionId) => {
    selectRegion(regionId);
    const region = game.regions[regionId];
    // 내 영토면 내정 탭으로
    if (region.owner === game.playerFaction) {
      setActiveTab('domestic');
    }
  };

  const handleExecuteDomestic = (regionId: RegionId, action: DomesticAction) => {
    const command = DOMESTIC_COMMANDS.find(c => c.id === action);
    const success = executeDomestic(regionId, action);

    if (success && command) {
      const messages: Record<DomesticAction, string> = {
        develop_farm: '농업 개발 완료! 농업치 +5%',
        develop_commerce: '상업 개발 완료! 상업치 +5%',
        recruit: '징병 완료! 병력 증가',
        train: '훈련 완료! 훈련도 상승'
      };
      showToast(messages[action], 'success');
    } else if (!success) {
      showToast('행동력 또는 자원이 부족합니다', 'error');
    }
  };

  const handleEndTurn = () => {
    setShowEndTurnModal(true);
  };

  const confirmEndTurn = () => {
    endTurn();
    setShowEndTurnModal(false);
    showToast(`턴 ${game.turn} 시작!`, 'info');
  };

  // 전투 결과 화면 닫기 핸들러
  const handleCloseBattleResult = () => {
    const isVictory = game.battleResult?.conqueredRegionId;
    closeBattleResult();
    // 승리: 점령 지역 내정 탭, 패배: 맵 탭
    setActiveTab(isVictory ? 'domestic' : 'map');
  };

  // 전투 화면 (이벤트 모달 포함)
  if (game.phase === 'battle' && game.battleData) {
    return (
      <>
        {/* 전투 시작 이벤트 모달 */}
        {game.activeEvent && (
          <EventModal
            event={game.activeEvent}
            onChoice={handleEventChoice}
          />
        )}
        {/* 이벤트가 없거나 처리 후 전투 화면 */}
        {!game.activeEvent && (
          <BattleScreen
            battleData={game.battleData}
            regions={game.regions}
            onBattleEnd={handleBattleEnd}
          />
        )}
      </>
    );
  }

  // 전투 결과 화면
  if (game.phase === 'battle_result' && game.battleResult) {
    return (
      <BattleResultScreen
        result={game.battleResult}
        regions={game.regions}
        onRecruitPrisoner={recruitPrisoner}
        onExecutePrisoner={executePrisoner}
        onReleasePrisoner={releasePrisoner}
        playerGenerals={playerRegions.flatMap(r =>
          r.generals.map(g => ({ generalId: g, regionId: r.id }))
        )}
        getGeneral={getGeneral}
        onClose={handleCloseBattleResult}
      />
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* 토스트 메시지 */}
      <Toast messages={toastMessages} onRemove={removeToast} />

      {/* 자원 바 */}
      <ResourceBar
        resources={totalResources}
        turn={game.turn}
        season={season.nameKo}
        seasonIcon={season.icon}
        year={game.year}
      />

      {/* 플로팅 버튼 영역 */}
      <div className="fixed right-4 top-20 z-40 flex flex-col gap-2">
        {/* 책사 조언 버튼 */}
        {advisorSession && (
          <button
            onClick={() => setShowAdvisorPanel(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-500 shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
            title="책사에게 조언을 구하기"
          >
            <span className="text-2xl">{advisorSession.strategist.portrait}</span>
            {/* 긴급 알림 뱃지 */}
            {advisorSession.advice.some(a => a.priority === 'critical') && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
                !
              </span>
            )}
            {/* 호버 텍스트 */}
            <span className="absolute right-16 bg-stone-900/90 text-amber-200 px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              책사의 조언
            </span>
          </button>
        )}

        {/* 역사 기록 버튼 */}
        <button
          onClick={() => setShowEventLog(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 border-2 border-amber-700 shadow-lg hover:scale-110 transition-transform flex items-center justify-center group"
          title="역사 기록 보기"
        >
          <span className="text-2xl">📜</span>
          {/* 이벤트 개수 뱃지 */}
          {game.triggeredEvents.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-600 rounded-full text-white text-xs flex items-center justify-center">
              {game.triggeredEvents.length}
            </span>
          )}
          {/* 호버 텍스트 */}
          <span className="absolute right-16 bg-stone-900/90 text-amber-200 px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            역사 기록
          </span>
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="p-4">
        {/* 지도 탭 */}
        {activeTab === 'map' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-gold flex items-center gap-2 title-glow">
              🗺️ 천하 정세
              <span className="text-sm font-normal text-silk/50">
                (내 영토: {playerRegions.length}개)
              </span>
            </h2>
            
            <WorldMap
              regions={game.regions}
              factions={game.factions}
              selectedRegion={game.selectedRegion}
              playerFaction={game.playerFaction}
              onSelectRegion={handleSelectRegion}
            />

            {/* 선택된 지역 간단 정보 */}
            {selectedRegionData && (
              <div className="dynasty-card rounded-lg p-4 animate-slide-up">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gold text-lg">
                      🏯 {selectedRegionData.nameKo}
                    </h3>
                    <p className="text-sm text-silk/60">
                      {game.factions[selectedRegionData.owner]?.nameKo} 세력
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-crimson-light font-medium">⚔️ {selectedRegionData.troops.toLocaleString()}</div>
                    <div className="text-jade-light font-medium">🏰 {selectedRegionData.defense}%</div>
                  </div>
                </div>
                
                {isPlayerRegion ? (
                  <button
                    onClick={() => setActiveTab('domestic')}
                    className="btn-peace mt-3 w-full py-2 rounded-lg"
                  >
                    📋 내정 관리
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('military')}
                    className="btn-war mt-3 w-full py-2 rounded-lg"
                  >
                    ⚔️ 출진 준비
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 내정 탭 */}
        {activeTab === 'domestic' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-gold flex items-center gap-2 title-glow">
              🏠 내정
              <span className="text-sm font-normal text-silk/50">
                (남은 행동: {game.actionsRemaining}회)
              </span>
            </h2>

            {/* 장수 관리 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRecruitPanel(true)}
                disabled={!selectedRegionData || !isPlayerRegion}
                className="btn-peace flex-1 py-2 px-4 rounded-lg text-sm"
              >
                🎯 재야 장수 등용
                {selectedRegionData && isPlayerRegion && (
                  <span className="ml-1 text-jade-light">
                    ({getFreeGeneralsInRegion(selectedRegionData.id).length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowPrisonerPanel(true)}
                className="btn-bronze flex-1 py-2 px-4 rounded-lg text-sm"
              >
                ⛓️ 포로 관리
                <span className="ml-1 text-bronze">
                  ({getPlayerPrisoners().length})
                </span>
              </button>
            </div>

            {/* 지역 선택 안됨 -> 목록 표시 */}
            {!selectedRegionData || !isPlayerRegion ? (
              <>
                <p className="text-silk/50 text-sm">지역을 선택하세요</p>
                <RegionList
                  regions={playerRegions}
                  selectedRegion={game.selectedRegion}
                  getGeneral={getGeneral}
                  onSelectRegion={handleSelectRegion}
                />
              </>
            ) : (
              /* 지역 선택됨 -> 내정 패널 */
              <DomesticPanel
                region={selectedRegionData}
                actionsRemaining={game.actionsRemaining}
                getGeneral={getGeneral}
                onExecute={handleExecuteDomestic}
                onClose={() => selectRegion(null)}
              />
            )}
          </div>
        )}

        {/* 군사 탭 */}
        {activeTab === 'military' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-gold flex items-center gap-2 title-glow">
              ⚔️ 출진
              {game.march && (
                <span className="text-sm font-normal text-silk/50">
                  출발: {selectedRegionData?.nameKo || playerRegions[0]?.nameKo}
                </span>
              )}
            </h2>

            {/* 출진 상태가 없으면 시작 버튼 */}
            {!game.march ? (
              <div className="dynasty-card rounded-lg p-6 text-center">
                <div className="text-5xl mb-4 animate-float">⚔️</div>
                <p className="text-silk/70 mb-4">
                  {playerRegions.length > 0
                    ? `${isPlayerRegion ? selectedRegionData?.nameKo : playerRegions[0].nameKo}에서 출진합니다`
                    : '출발할 영토가 없습니다'}
                </p>
                <button
                  onClick={startMarch}
                  disabled={playerRegions.length === 0}
                  className="btn-war w-full py-3 rounded-lg text-lg"
                >
                  출진 준비
                </button>
              </div>
            ) : (
              /* 출진 패널 */
              <MarchPanel
                march={game.march}
                playerRegions={playerRegions}
                allRegions={game.regions}
                selectedSourceRegion={selectedRegionData && isPlayerRegion ? selectedRegionData : null}
                getGeneral={getGeneral}
                onSelectTarget={selectMarchTarget}
                onToggleGeneral={toggleMarchGeneral}
                onSetCommander={setCommander}
                onAssignTroops={assignTroops}
                onSetStep={setMarchStep}
                onConfirm={confirmMarch}
                onCancel={cancelMarch}
              />
            )}
          </div>
        )}

        {/* 외교 탭 */}
        {activeTab === 'diplomacy' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-gold title-glow">🤝 외교</h2>
            <div className="dynasty-card rounded-lg p-8 text-center">
              <div className="text-5xl mb-4 animate-float">🚧</div>
              <p className="text-silk/50">외교 시스템 준비 중...</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 탭 바 */}
      <BottomTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actionsRemaining={game.actionsRemaining}
        onEndTurn={handleEndTurn}
      />

      {/* 재야 장수 등용 패널 */}
      {showRecruitPanel && selectedRegionData && isPlayerRegion && (
        <RecruitPanel
          regionId={selectedRegionData.id}
          regionName={selectedRegionData.nameKo}
          freeGenerals={getFreeGeneralsInRegion(selectedRegionData.id)}
          regionGenerals={selectedRegionData.generals}
          actionsRemaining={game.actionsRemaining}
          getGeneral={getGeneral}
          getLoyalty={(id) => game.generalLoyalty[id] ?? INITIAL_LOYALTY[id] ?? 60}
          onRecruit={(generalId, recruiterId) => recruitFreeGeneral(selectedRegionData.id, generalId, recruiterId)}
          onClose={() => setShowRecruitPanel(false)}
        />
      )}

      {/* 포로 관리 패널 */}
      {showPrisonerPanel && (
        <PrisonerPanel
          prisoners={getPlayerPrisoners()}
          playerGenerals={playerRegions.flatMap(r =>
            r.generals.map(g => ({ generalId: g, regionId: r.id }))
          )}
          getGeneral={getGeneral}
          getRegionName={(id) => game.regions[id]?.nameKo || id}
          getLoyalty={(id) => game.generalLoyalty[id] ?? INITIAL_LOYALTY[id] ?? 60}
          onRecruit={recruitPrisoner}
          onExecute={executePrisoner}
          onRelease={releasePrisoner}
          onClose={() => setShowPrisonerPanel(false)}
        />
      )}

      {/* 턴 종료 확인 모달 */}
      <ConfirmModal
        isOpen={showEndTurnModal}
        title="턴 종료"
        message={`${game.year}년 ${SEASONS[game.season].nameKo} (턴 ${game.turn})을 종료하시겠습니까?\n\n다음 턴에 자원 수입이 발생합니다.`}
        confirmText="턴 종료"
        cancelText="취소"
        onConfirm={confirmEndTurn}
        onCancel={() => setShowEndTurnModal(false)}
      />

      {/* 역사 이벤트 모달 */}
      {game.activeEvent && (
        <EventModal
          event={game.activeEvent}
          onChoice={handleEventChoice}
        />
      )}

      {/* 책사 조언 패널 */}
      {showAdvisorPanel && advisorSession && (
        <AdvisorPanel
          session={advisorSession}
          onClose={() => setShowAdvisorPanel(false)}
          onActionClick={(actionType, targetRegion) => {
            // 조언에 따른 화면 이동
            setShowAdvisorPanel(false);
            
            if (targetRegion) {
              // 지역이 있으면 해당 지역 선택
              selectRegion(targetRegion as RegionId);
            }
            
            // 액션 타입에 따라 탭 이동
            switch (actionType) {
              case 'attack':
                setActiveTab('military');
                showToast('출진 준비 화면으로 이동합니다', 'info');
                break;
              case 'defend':
              case 'develop':
              case 'train':
                setActiveTab('domestic');
                showToast('내정 화면으로 이동합니다', 'info');
                break;
              case 'recruit':
                if (targetRegion) {
                  setActiveTab('domestic');
                  setShowRecruitPanel(true);
                  showToast('등용 화면을 엽니다', 'info');
                } else {
                  setActiveTab('domestic');
                  showToast('등용할 지역을 선택하세요', 'info');
                }
                break;
              default:
                showToast('해당 화면으로 이동합니다', 'info');
            }
          }}
        />
      )}

      {/* 역사 기록 패널 */}
      {showEventLog && (
        <EventLog
          triggeredEvents={game.triggeredEvents}
          currentTurn={game.turn}
          onClose={() => setShowEventLog(false)}
        />
      )}

    </div>
  );
}
