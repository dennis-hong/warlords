import type { HistoricalEvent, FactionId } from '../types';

// ============================================
// 역사 이벤트 데이터
// ============================================

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  // ============================================
  // 1. 도원결의 (桃園結義) - 유비 시작 이벤트
  // ============================================
  {
    id: 'oath_of_peach_garden',
    name: '桃園結義',
    nameKo: '도원결의',
    description: `복숭아 꽃이 만발한 정원에서 세 영웅이 의형제의 맹세를 나누었다.

"우리 비록 성은 다르나, 의형제가 되어 마음을 합하고 힘을 모아
곤경에 처한 백성을 구하고 위태로운 나라를 돕겠노라.

같은 날 태어나지는 못했으나
같은 날 죽기를 바라노라!"

이 맹세는 천하에 길이 전해질 것이다.`,
    image: '🍑',
    trigger: 'game_start',
    conditions: [
      { type: 'faction', factionId: 'liubei' }
    ],
    choices: [
      {
        id: 'oath_accept',
        text: '"함께 천하를 바로잡겠소!" (맹세를 굳건히)',
        effects: [
          { type: 'set_loyalty', generalId: 'guanyu', value: 100 },
          { type: 'set_loyalty', generalId: 'zhangfei', value: 100 },
          { type: 'add_morale', targetType: 'player', value: 10 },
          { type: 'message', message: '관우와 장비의 충성도가 최대가 되었습니다!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 100
  },

  // ============================================
  // 2. 조조의 야망 - 조조 시작 이벤트
  // ============================================
  {
    id: 'caocao_ambition',
    name: '治世之能臣 亂世之奸雄',
    nameKo: '치세의 능신, 난세의 간웅',
    description: `어느 날, 관상가 허소가 조조를 보고 말했다.

"그대는 치세에는 능신이 되고,
난세에는 간웅이 되리라."

조조는 크게 웃었다.
"천하가 어지러우니, 내가 바로잡아야겠군."

난세의 영웅이 일어설 때가 왔다.`,
    image: '👑',
    trigger: 'game_start',
    conditions: [
      { type: 'faction', factionId: 'caocao' }
    ],
    choices: [
      {
        id: 'caocao_rise',
        text: '"천하는 내가 다스리겠다!" (야망을 품다)',
        effects: [
          { type: 'add_gold', targetType: 'player', value: 1000 },
          { type: 'add_troops', targetType: 'player', value: 500 },
          { type: 'message', message: '금 1000, 병력 500을 얻었습니다!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 100
  },

  // ============================================
  // 3. 강동의 호랑이 - 손권 시작 이벤트
  // ============================================
  {
    id: 'tiger_of_jiangdong',
    name: '江東之虎',
    nameKo: '강동의 호랑이',
    description: `손책의 유언이 떠오른다.

"내가 전장에서 싸우는 것은 너보다 낫지만,
인재를 등용하고 강동을 지키는 것은
내가 너만 못하다."

형의 유지를 이어받아 강동을 지켜야 한다.
주유, 육손, 감녕... 뛰어난 신하들이 곁에 있다.`,
    image: '🐯',
    trigger: 'game_start',
    conditions: [
      { type: 'faction', factionId: 'sunquan' }
    ],
    choices: [
      {
        id: 'defend_jiangdong',
        text: '"강동을 지키고 천하를 도모하리라!"',
        effects: [
          { type: 'add_loyalty', generalId: 'zhouyu', value: 20 },
          { type: 'add_loyalty', generalId: 'luxun', value: 20 },
          { type: 'add_food', targetType: 'player', value: 1500 },
          { type: 'message', message: '주유, 육손의 충성도가 상승하고 식량 1500을 얻었습니다!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 100
  },

  // ============================================
  // 4. 삼고초려 (三顧草廬) - 제갈량 등용 이벤트
  // ============================================
  {
    id: 'three_visits',
    name: '三顧草廬',
    nameKo: '삼고초려',
    description: `와룡 제갈량이 초당에서 기다리고 있다는 소문이 들린다.

서서가 떠나며 말했다.
"와룡과 봉추 중 하나만 얻어도
천하를 얻을 수 있습니다."

세 번이고 찾아가 예를 갖추면,
천하의 기재를 얻을 수 있을 것이다.`,
    image: '🪭',
    trigger: 'turn_start',
    conditions: [
      { type: 'faction', factionId: 'liubei' },
      { type: 'general_free', generalId: 'zhugeliang' },
      { type: 'turnMin', turnMin: 3 }
    ],
    choices: [
      {
        id: 'visit_zhuge',
        text: '"선생을 세 번이고 찾아뵙겠습니다." (제갈량 영입)',
        effects: [
          { type: 'add_general', generalId: 'zhugeliang', targetType: 'player' },
          { type: 'set_loyalty', generalId: 'zhugeliang', value: 95 },
          { type: 'message', message: '제갈량이 합류했습니다! "신은 유비 주공을 위해 만사를 다하겠습니다."' }
        ]
      },
      {
        id: 'skip_zhuge',
        text: '"지금은 때가 아닌 것 같소." (다음 기회에)',
        effects: [
          { type: 'message', message: '제갈량은 여전히 초당에서 기다리고 있습니다...' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 90
  },

  // ============================================
  // 5. 여포와 적토마 - 여포 등용 이벤트
  // ============================================
  {
    id: 'redhare',
    name: '赤兔馬',
    nameKo: '적토마',
    description: `천하에 둘도 없는 명마 적토마!
하루에 천 리를 달린다는 전설의 말이다.

여포와 함께 적토마가 진영에 합류했다.
"사람 중에 여포, 말 중에 적토!"

여포의 무력이 더욱 빛날 것이다.`,
    image: '🐎',
    trigger: 'general_recruited',
    conditions: [
      { type: 'has_general', generalId: 'lvbu' }
    ],
    choices: [
      {
        id: 'redhare_accept',
        text: '"천하무적 여포를 얻었구나!"',
        effects: [
          { type: 'battle_bonus', generalId: 'lvbu', value: 5 },
          { type: 'message', message: '여포가 적토마와 함께 합류! 전투력 +5 보너스!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 80
  },

  // ============================================
  // 6. 장판파 전투 - 조운 단기 돌파
  // ============================================
  {
    id: 'changban',
    name: '長坂坡',
    nameKo: '장판파',
    description: `조운이 적진 한가운데서 외쳤다!

"나는 상산의 조자룡이다!
누가 나와 겨뤄보겠느냐!"

홀로 수만 대군 속을 돌파하며
어린 주인 아두를 품에 안고
일곱 번 들어가 일곱 번 나왔다!

조운의 용맹이 천하에 떨쳤다.`,
    image: '⚔️',
    trigger: 'battle_start',
    conditions: [
      { type: 'has_general', generalId: 'zhaoyun' },
      { type: 'troops_ratio', ratio: 0.5 }  // 아군이 적의 절반 이하일 때
    ],
    choices: [
      {
        id: 'changban_charge',
        text: '"조자룡! 적진을 돌파하라!" (특수 일기토 발동)',
        effects: [
          { type: 'battle_bonus', generalId: 'zhaoyun', value: 10 },
          { type: 'add_morale', targetType: 'player', value: 20 },
          { type: 'message', message: '조운의 기세가 하늘을 찌른다! 사기 +20, 전투 보너스 +10!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 85
  },

  // ============================================
  // 7. 관우의 의리 - 관우 포로 후 귀환
  // ============================================
  {
    id: 'guanyu_loyalty',
    name: '千里走單騎',
    nameKo: '천리주단기',
    description: `관우가 조조 진영에서 탈출하여 돌아왔다!

"승상의 은혜는 잊지 않겠으나,
형님과의 의리는 저버릴 수 없소."

다섯 관문을 지나 여섯 장수를 베고,
천 리를 달려 유비에게 돌아왔다.

의리의 화신, 관운장이 돌아왔다!`,
    image: '🗡️',
    trigger: 'turn_start',
    conditions: [
      { type: 'faction', factionId: 'liubei' },
      { type: 'custom', customCheck: 'guanyu_captured_by_caocao' }
    ],
    choices: [
      {
        id: 'welcome_guanyu',
        text: '"운장! 잘 돌아왔소!" (관우 복귀)',
        effects: [
          { type: 'add_general', generalId: 'guanyu', targetType: 'player' },
          { type: 'set_loyalty', generalId: 'guanyu', value: 100 },
          { type: 'add_morale', targetType: 'player', value: 15 },
          { type: 'message', message: '관우가 돌아왔습니다! 천하가 그의 의리에 감복합니다.' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 88
  },

  // ============================================
  // 8. 적벽대전 - 화공 이벤트
  // ============================================
  {
    id: 'chibi',
    name: '赤壁大戰',
    nameKo: '적벽대전',
    description: `동남풍이 불기 시작했다!

제갈량이 하늘을 우러러 빌었고,
주유가 화공을 준비했으며,
황개가 고육지계를 펼쳤다.

"동풍이 분다! 지금이다!"

천 척의 전선이 불길에 휩싸였다.
삼국지 최대의 전투가 시작된다!`,
    image: '🔥',
    trigger: 'battle_start',
    conditions: [
      { type: 'custom', customCheck: 'chibi_battle_conditions' }
    ],
    choices: [
      {
        id: 'fire_attack',
        text: '"동남풍을 타고 화공을 펼쳐라!"',
        effects: [
          { type: 'unlock_stratagem', targetType: 'player', value: 1 },  // 화공 강화
          { type: 'add_morale', targetType: 'player', value: 30 },
          { type: 'message', message: '화공 성공! 적 함대가 불길에 휩싸입니다!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 95
  },

  // ============================================
  // 9. 유비 입촉 - 성도 점령
  // ============================================
  {
    id: 'liubei_yizhou',
    name: '劉備入蜀',
    nameKo: '유비 입촉',
    description: `마침내 익주를 얻었다!

천부의 험지, 풍요로운 땅.
제갈량의 융중대에서 말한 그대로다.

"익주는 하늘이 내린 땅입니다.
고조(유방)께서도 이 땅을 발판으로
천하를 얻으셨습니다."

이제 천하삼분의 기틀이 마련되었다!`,
    image: '🏰',
    trigger: 'region_captured',
    conditions: [
      { type: 'faction', factionId: 'liubei' },
      { type: 'region_owner', regionId: 'chengdu' }
    ],
    choices: [
      {
        id: 'establish_shu',
        text: '"이 땅을 기반으로 한실을 부흥시키겠노라!"',
        effects: [
          { type: 'add_gold', regionId: 'chengdu', value: 3000 },
          { type: 'add_food', regionId: 'chengdu', value: 5000 },
          { type: 'add_troops', regionId: 'chengdu', value: 2000 },
          { type: 'message', message: '익주의 백성들이 환영합니다! 금 3000, 식량 5000, 병력 2000 획득!' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 85
  },

  // ============================================
  // 10. 동탁의 폭정 - 동탁 시작
  // ============================================
  {
    id: 'dongzhuo_tyranny',
    name: '董卓專權',
    nameKo: '동탁의 전횡',
    description: `동탁이 낙양에 입성했다.

"천자는 내가 옹립하고,
제후는 내가 다스린다.
누가 감히 나를 막겠는가?"

그러나 천하의 제후들이 들끓고 있다.
연합군이 결성되기 전에
힘을 길러야 한다!`,
    image: '👹',
    trigger: 'game_start',
    conditions: [
      { type: 'faction', factionId: 'dongzhuo' }
    ],
    choices: [
      {
        id: 'show_power',
        text: '"여포가 있는 한, 두려울 것이 없다!"',
        effects: [
          { type: 'set_loyalty', generalId: 'lvbu', value: 70 },
          { type: 'add_troops', targetType: 'player', value: 1000 },
          { type: 'message', message: '여포의 무력으로 병력을 쉽게 모았습니다! 병력 +1000' }
        ]
      }
    ],
    isRepeatable: false,
    priority: 100
  }
];

// 세력별 시작 이벤트 매핑
export const FACTION_START_EVENTS: Partial<Record<FactionId, string>> = {
  'liubei': 'oath_of_peach_garden',
  'caocao': 'caocao_ambition',
  'sunquan': 'tiger_of_jiangdong',
  'dongzhuo': 'dongzhuo_tyranny'
};

// 커스텀 조건 체크 함수들
export const CUSTOM_CONDITION_CHECKS: Record<string, (gameState: unknown) => boolean> = {
  'guanyu_captured_by_caocao': (state: unknown) => {
    // 관우가 조조에게 포로로 잡혔다가 탈출한 상태인지 체크
    // 실제 구현은 gameState 타입에 맞게 수정 필요
    return false;
  },
  'chibi_battle_conditions': (state: unknown) => {
    // 적벽대전 조건: 손권/유비 연합 vs 조조, 형주/건업 방면 전투
    // 실제 구현은 battleData와 연동 필요
    return false;
  }
};
