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
- BattleScreen.tsx에도 같은 문제가 있을 수 있음 (GENERALS 직접 참조)
- 포로 등용 시에도 같은 문제 있는지 확인 필요
- 전투 중 장수 표시도 getGeneral 사용하도록 수정 고려
