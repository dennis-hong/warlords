# progress.md - Warlords 개발 진행 기록

Original prompt: 장수 등용/영입 성공 후 보유 장수 및 주둔 장수 목록에 반영되지 않음

## 2026-02-03: 장수 등용 버그 수정

### 문제 원인
- `DomesticPanel.tsx`, `MarchPanel.tsx`, `RegionList.tsx`에서 장수 정보를 가져올 때 `GENERALS[id]`만 참조
- 재야 장수는 `UNAFFILIATED_GENERALS`에 정의되어 있음
- 등용 성공 후 `region.generals` 배열에는 추가되지만, UI에서 `GENERALS[id]`로 찾으면 null 반환 → 화면에 안 보임

### 수정 내용

#### 1. DomesticPanel.tsx
- `getGeneral` prop 추가
- `GENERALS[id]` → `getGeneral(id)` 변경
- 디버그 메시지 제거

#### 2. MarchPanel.tsx
- `getGeneral` prop 추가
- 3곳에서 `GENERALS[id]` → `getGeneral(id)` 변경:
  - 출발 지역 장수 목록
  - 병력 배분 패널
  - 출진 확인 패널

#### 3. RegionList.tsx
- `getGeneral` prop 추가
- `GENERALS[id]` → `getGeneral(id)` 변경

#### 4. WarlordsGame.tsx
- 위 3개 컴포넌트에 `getGeneral={getGeneral}` prop 전달

### 테스트 결과
- [x] 빌드 성공
- [ ] 재야 장수 등용 테스트 필요
- [ ] 등용 후 주둔 장수 목록 확인
- [ ] 등용 후 출진 시 장수 선택 가능 확인

## TODOs for next agent
- [x] BattleScreen.tsx GENERALS 직접 참조 → findGeneral() 사용으로 수정 완료
- [ ] 포로 등용 시에도 같은 문제 있는지 확인 필요
- [ ] PrisonerPanel.tsx 확인 필요

---

## 2026-02-04: 모바일 UI 대폭 개선

### 개선 목표
모바일(375px~430px 폭)에서 사용하기 편하고, 직관적이고, 전략 판단과 행동 동선이 편리하도록 UI 개선

### 수정된 파일 (15개)
1. **ResourceBar.tsx** - 2행 → 단일행 컴팩트 레이아웃 (턴/계절 좌측 + 자원 우측)
2. **BottomTabs.tsx** - 56px 최소 높이, active:scale-95 터치 피드백, 뱃지 위치 개선
3. **WorldMap.tsx** - 반응형 높이 `calc(100vh-220px)`, 48px 터치 타겟, 12px 성 아이콘
4. **DomesticPanel.tsx** - 행동력 뱃지 칩 스타일, 48px 내정 명령 버튼, 콤팩트 개발도 바
5. **MarchPanel.tsx** - 콤팩트 스텝 인디케이터, 모든 버튼 44px+, factions prop 추가 (세력명 현지화)
6. **DiplomacyPanel.tsx** - 52px 세력 카드, 48px 외교 액션 버튼, 행동력 표시
7. **RegionList.tsx** - 56px 최소 높이 리스트 아이템, active:scale-[0.98]
8. **RecruitPanel.tsx** - 모바일 풀스크린 모달 (fixed inset-0), safe-area 지원
9. **PrisonerPanel.tsx** - 모바일 풀스크린 모달, 52px 포로 카드
10. **AdvisorPanel.tsx** - 모바일 하단 시트 스타일 (items-end + rounded-t-xl)
11. **EventLog.tsx** - 모바일 하단 시트 스타일
12. **ConfirmModal.tsx** - 48px 버튼 터치 타겟
13. **WarlordsGame.tsx** - 플로팅 버튼 우하단 탭바 위 이동 (44px), pb-[68px], px-3
14. **globals.css** - 모바일 터치 최적화 (range 슬라이더 24px thumb, tap-highlight 제거)
15. **.gitignore** - screenshots/ 추가

### 주요 개선 사항

#### 1. ResourceBar (상단 자원 바)
- 2줄 → 1줄 레이아웃 (턴/계절 좌측 | 구분선 | 자원 우측)
- 10,000 이상 수치 자동 k 표기 (모바일 공간 절약)
- tabular-nums로 숫자 정렬

#### 2. WorldMap (지도)
- 높이: 고정 400px → 반응형 `calc(100vh-220px)` (min 350px, max 500px)
- 터치 타겟: 44px → 48px (min-width/min-height)
- 선택 시 active:scale-90 피드백

#### 3. DomesticPanel (내정)
- 행동력 표시: 괄호 텍스트 → 눈에 띄는 칩(chip) 스타일 뱃지
- 내정 명령 버튼: 48px 최소 높이, active:scale-[0.98]
- 개발도 바: 라벨 8px, 바 높이 2px (콤팩트)
- 닫기 버튼: 40x40px 터치 영역

#### 4. MarchPanel (출진)
- 스텝 인디케이터: 32px 원형 → 연결선 포함 콤팩트 디자인
- 목표 선택: 48px 카드 + 세력명 한글화 (factions prop 추가)
- 장수 편성: 44px 터치 영역, 주장 지정 버튼
- 병력 배분: range 슬라이더 24px thumb (CSS), 빠른 배분 버튼 36px
- 모든 네비게이션 버튼: 44px 최소 높이

#### 5. DiplomacyPanel (외교)
- 세력 카드: 52px 최소 높이, 정보 2줄 레이아웃
- 외교 액션 버튼: 48px, 2x2 그리드
- AI 제안: 40px 수락/거절 버튼

#### 6. 플로팅 버튼
- 위치: 우상단 top-20 → 우하단 bottom-[72px] (탭바 위)
- 크기: 56px → 44px (컨텐츠 겹침 해소)
- 호버 텍스트 제거 (모바일에선 불필요)

#### 7. 모달/패널
- RecruitPanel: 센터 모달 → 풀스크린 (fixed inset-0)
- PrisonerPanel: 센터 모달 → 풀스크린
- AdvisorPanel: 센터 모달 → 모바일 하단 시트 + 데스크탑 센터
- EventLog: 센터 모달 → 모바일 하단 시트 + 데스크탑 센터

#### 8. 전반적 터치 UX
- 모든 인터랙티브 요소: 최소 44px 터치 타겟
- active:scale-[0.95~0.98] 터치 피드백
- touch-action: manipulation (더블탭 줌 방지)
- -webkit-tap-highlight-color: transparent (하이라이트 제거)
- range 슬라이더: 24px thumb (모바일에서 잡기 쉽게)

### 데스크탑 호환성
- 모든 변경사항은 반응형 → 데스크탑에서도 정상 동작
- sm: breakpoint 사용 (모달 하단 시트 ↔ 센터)
- 데스크탑에서 테스트 완료 (1280x800)

### 테스트 결과
- [x] pnpm build 성공
- [x] 모바일 뷰포트 (390x844) 타이틀 → 세력 선택 → 게임 진입
- [x] 이벤트 모달 표시/해제
- [x] 지도 탭: 지역 선택 → 정보 카드 표시
- [x] 내정 탭: 지역 선택 → 내정 명령 → 개간 실행
- [x] 군사 탭: 출진 준비 → 목표 선택 → 장수 편성 확인
- [x] 외교 탭: 세력 목록 표시
- [x] 데스크탑 뷰포트 (1280x800) 정상
- [x] git push 완료

### 미처리/추가 개선 가능 사항
- [ ] 토스트 메시지가 출진 스텝 인디케이터와 겹침 → 토스트 위치 조정 필요
- [ ] TitleScreen, FactionSelectScreen 모바일 최적화 (현재도 작동은 함)
- [ ] BattleScreen, BattleResultScreen 모바일 최적화
- [ ] GameOverScreen 모바일 최적화
- [ ] 지도에서 핀치줌/팬 지원 (현재는 고정 뷰)
- [ ] 가로 모드 대응
