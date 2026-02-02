'use client';

import { useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import {
  ResourceBar,
  WorldMap,
  DomesticPanel,
  BottomTabs,
  RegionList,
  MarchPanel,
  RecruitPanel,
  PrisonerPanel
} from './ui';
import BattleScreen from './BattleScreen';
import TitleScreen from './TitleScreen';
import FactionSelectScreen from './FactionSelectScreen';
import { SEASONS } from '../constants/worldData';
import { INITIAL_LOYALTY } from '../constants/gameData';
import type { GameTab, RegionId } from '../types';

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
    // 장수 등용 시스템
    getFreeGeneralsInRegion,
    getPlayerPrisoners,
    getGeneral,
    recruitFreeGeneral,
    recruitPrisoner,
    executePrisoner,
    releasePrisoner
  } = useGameState();

  const [activeTab, setActiveTab] = useState<GameTab>('map');
  const [showRecruitPanel, setShowRecruitPanel] = useState(false);
  const [showPrisonerPanel, setShowPrisonerPanel] = useState(false);

  // 로딩 (클라이언트 준비 전)
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🏯</div>
          <div className="text-xl text-gray-400">천하 준비 중...</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl text-gray-400">게임 로딩 오류</div>
          <button 
            onClick={backToTitle}
            className="mt-4 px-4 py-2 bg-red-600 rounded-lg"
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

  const handleEndTurn = () => {
    if (confirm(`턴 ${game.turn}을 종료하시겠습니까?`)) {
      endTurn();
    }
  };

  // 전투 화면
  if (game.phase === 'battle' && game.battleData) {
    return (
      <BattleScreen
        battleData={game.battleData}
        regions={game.regions}
        onBattleEnd={handleBattleEnd}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pb-20">
      {/* 자원 바 */}
      <ResourceBar
        resources={totalResources}
        turn={game.turn}
        season={season.nameKo}
        seasonIcon={season.icon}
        year={game.year}
      />

      {/* 메인 컨텐츠 */}
      <div className="p-4">
        {/* 지도 탭 */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              🗺️ 천하 정세
              <span className="text-sm font-normal text-gray-400">
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
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-yellow-400">
                      🏯 {selectedRegionData.nameKo}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {game.factions[selectedRegionData.owner]?.nameKo} 세력
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-red-300">⚔️ {selectedRegionData.troops.toLocaleString()}</div>
                    <div className="text-blue-300">🏰 {selectedRegionData.defense}%</div>
                  </div>
                </div>
                
                {isPlayerRegion && (
                  <button
                    onClick={() => setActiveTab('domestic')}
                    className="mt-3 w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg transition-colors"
                  >
                    📋 내정 관리
                  </button>
                )}
                {!isPlayerRegion && (
                  <button
                    onClick={() => setActiveTab('military')}
                    className="mt-3 w-full bg-red-700 hover:bg-red-600 text-white py-2 rounded-lg transition-colors"
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
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              🏠 내정
              <span className="text-sm font-normal text-gray-400">
                (남은 행동: {game.actionsRemaining}회)
              </span>
            </h2>

            {/* 장수 관리 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRecruitPanel(true)}
                disabled={!selectedRegionData || !isPlayerRegion}
                className="flex-1 py-2 px-4 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg transition-colors text-sm font-bold"
              >
                🎯 재야 장수 등용
                {selectedRegionData && isPlayerRegion && (
                  <span className="ml-1 text-blue-300">
                    ({getFreeGeneralsInRegion(selectedRegionData.id).length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowPrisonerPanel(true)}
                className="flex-1 py-2 px-4 bg-purple-700 hover:bg-purple-600 rounded-lg transition-colors text-sm font-bold"
              >
                ⛓️ 포로 관리
                <span className="ml-1 text-purple-300">
                  ({getPlayerPrisoners().length})
                </span>
              </button>
            </div>

            {/* 지역 선택 안됨 -> 목록 표시 */}
            {!selectedRegionData || !isPlayerRegion ? (
              <>
                <p className="text-gray-400 text-sm">지역을 선택하세요</p>
                <RegionList
                  regions={playerRegions}
                  selectedRegion={game.selectedRegion}
                  onSelectRegion={handleSelectRegion}
                />
              </>
            ) : (
              /* 지역 선택됨 -> 내정 패널 */
              <DomesticPanel
                region={selectedRegionData}
                actionsRemaining={game.actionsRemaining}
                onExecute={executeDomestic}
                onClose={() => selectRegion(null)}
              />
            )}
          </div>
        )}

        {/* 군사 탭 */}
        {activeTab === 'military' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              ⚔️ 출진
              {game.march && (
                <span className="text-sm font-normal text-gray-400">
                  출발: {selectedRegionData?.nameKo || playerRegions[0]?.nameKo}
                </span>
              )}
            </h2>

            {/* 출진 상태가 없으면 시작 버튼 */}
            {!game.march ? (
              <div className="bg-gray-800 rounded-lg p-6 text-center">
                <div className="text-4xl mb-3">⚔️</div>
                <p className="text-gray-300 mb-4">
                  {playerRegions.length > 0
                    ? `${isPlayerRegion ? selectedRegionData?.nameKo : playerRegions[0].nameKo}에서 출진합니다`
                    : '출발할 영토가 없습니다'}
                </p>
                <button
                  onClick={startMarch}
                  disabled={playerRegions.length === 0}
                  className="w-full py-3 rounded-lg bg-red-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-500 transition-colors"
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
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-yellow-400">🤝 외교</h2>
            <div className="bg-gray-800 rounded-lg p-6 text-center text-gray-400">
              <div className="text-4xl mb-2">🚧</div>
              <p>외교 시스템 준비 중...</p>
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

    </div>
  );
}
