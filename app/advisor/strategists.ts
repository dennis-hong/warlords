// ============================================
// 책사 캐릭터 정의
// ============================================

import type { FactionId } from '../types';
import type { Strategist } from './types';

// 각 세력별 책사 정의
export const STRATEGISTS: Record<string, Strategist> = {
  // 촉 - 제갈량: 천하삼분의 대전략가
  zhugeliang: {
    id: 'zhugeliang',
    name: '諸葛亮',
    nameKo: '제갈량',
    portrait: '🪭',
    faction: 'liubei',
    specialty: ['strategic', 'military', 'domestic'],
    greeting: '주공, 제갈량이 대책을 말씀드리겠습니다.',
    catchphrase: '천하대세를 보건대, 이것이 상책이옵니다.',
    personality: 'balanced',
    speechStyle: {
      emphasis: ['천하삼분', '대의', '인덕', '민심', '장원한 계책'],
      endings: ['~하옵소서', '~이옵니다', '~함이 도리이옵니다'],
      exclamations: ['주공!', '이것이야말로', '깊이 헤아리소서']
    }
  },
  
  // 위 - 사마의: 인내의 전략가
  simayi: {
    id: 'simayi',
    name: '司馬懿',
    nameKo: '사마의',
    portrait: '🦊',
    faction: 'caocao',
    specialty: ['strategic', 'military'],
    greeting: '주공, 사마의가 진언 드리겠습니다.',
    catchphrase: '때를 기다리면 반드시 기회가 옵니다.',
    personality: 'cautious',
    speechStyle: {
      emphasis: ['인내', '때', '기회', '숨겨둔 칼', '후일을 도모'],
      endings: ['~해야 하옵니다', '~함이 상책이옵니다', '~두고 보아야 하옵니다'],
      exclamations: ['음...', '아직입니다', '기다리소서']
    }
  },

  // 위 - 순욱: 내정과 인재의 대가
  xunyu: {
    id: 'xunyu',
    name: '荀彧',
    nameKo: '순욱',
    portrait: '📜',
    faction: 'caocao',
    specialty: ['domestic', 'personnel'],
    greeting: '주공, 순욱이 정세를 분석하였습니다.',
    catchphrase: '인재를 얻으면 천하를 얻습니다.',
    personality: 'balanced',
    speechStyle: {
      emphasis: ['인재', '내치', '민심', '근본', '대업의 기반'],
      endings: ['~청하옵니다', '~하심이 옳습니다', '~함이 근본이옵니다'],
      exclamations: ['주공께서는', '우선은', '내치가 먼저이옵니다']
    }
  },

  // 위 - 곽가: 기책의 귀재
  guojia: {
    id: 'guojia',
    name: '郭嘉',
    nameKo: '곽가',
    portrait: '🧠',
    faction: 'caocao',
    specialty: ['strategic', 'military'],
    greeting: '주공, 봉효가 기책을 드리겠습니다.',
    catchphrase: '적의 허를 찌르면 천 리도 하루에 갈 수 있습니다!',
    personality: 'cunning',
    speechStyle: {
      emphasis: ['허점', '기습', '심리', '속도', '적의 빈틈'],
      endings: ['~하십시오!', '~함이 묘책이옵니다', '~기회를 놓치지 마십시오'],
      exclamations: ['바로 지금입니다!', '적이 방심했습니다!', '통쾌하게 치십시오!']
    }
  },

  // 오 - 주유: 화공의 명장
  zhouyu: {
    id: 'zhouyu',
    name: '周瑜',
    nameKo: '주유',
    portrait: '🔥',
    faction: 'sunquan',
    specialty: ['military', 'strategic'],
    greeting: '주공, 주유가 병법을 말씀드리겠습니다.',
    catchphrase: '동남풍이 불 때를 기다려 불태워 버리십시오!',
    personality: 'aggressive',
    speechStyle: {
      emphasis: ['화공', '수전', '강동', '결전', '일격필살'],
      endings: ['~해야 합니다!', '~함이 대의입니다', '~불태우십시오'],
      exclamations: ['지금이 기회입니다!', '결전의 때!', '강동의 위엄을 보여주십시오!']
    }
  },

  // 오 - 육손: 인내와 화공의 젊은 천재
  luxun: {
    id: 'luxun',
    name: '陸遜',
    nameKo: '육손',
    portrait: '📚',
    faction: 'sunquan',
    specialty: ['military', 'domestic'],
    greeting: '주공, 육손이 말씀드리겠습니다.',
    catchphrase: '적이 지칠 때까지 기다렸다가 화공으로 마무리하십시오.',
    personality: 'cautious',
    speechStyle: {
      emphasis: ['인내', '화공', '지구전', '적의 피로', '최후의 일격'],
      endings: ['~함이 옳습니다', '~기다려야 합니다', '~때가 올 것입니다'],
      exclamations: ['아직입니다', '서두르지 마십시오', '때를 기다리십시오']
    }
  },

  // 원소 - 전풍: 직언의 충신
  tianfeng: {
    id: 'tianfeng',
    name: '田豐',
    nameKo: '전풍',
    portrait: '📚',
    faction: 'yuanshao',
    specialty: ['strategic', 'domestic'],
    greeting: '주공, 전풍이 충언 드리겠습니다.',
    catchphrase: '신의 말을 들으시면 후회가 없을 것입니다!',
    personality: 'cautious',
    speechStyle: {
      emphasis: ['충언', '대비', '신중', '후환', '앞날을 도모'],
      endings: ['~하소서', '~함이 마땅합니다', '~귀 기울여 주소서'],
      exclamations: ['주공!', '이것이 충언이옵니다', '듣지 않으시면 후회하옵니다']
    }
  },

  // 동탁 - 이유: 음모의 달인
  liru: {
    id: 'liru',
    name: '李儒',
    nameKo: '이유',
    portrait: '🐍',
    faction: 'dongzhuo',
    specialty: ['strategic', 'military'],
    greeting: '상국, 이유가 계책을 올리겠습니다.',
    catchphrase: '수단과 방법을 가리지 않으면 천하도 손안에 있습니다.',
    personality: 'cunning',
    speechStyle: {
      emphasis: ['권모술수', '이간', '공포', '배신', '먼저 치기'],
      endings: ['~하시면 됩니다', '~함이 묘책이옵니다', '~자들을 제거하소서'],
      exclamations: ['상국께서 원하시는 대로', '거침없이 나아가소서', '의심되면 죽이소서']
    }
  },

  // 유표 - 괴량: 수성의 전략가
  kuailiang: {
    id: 'kuailiang',
    name: '蒯良',
    nameKo: '괴량',
    portrait: '📜',
    faction: 'liubiao',
    specialty: ['domestic', 'personnel'],
    greeting: '주공, 괴량이 방책을 말씀드리겠습니다.',
    catchphrase: '형주를 굳건히 지키는 것이 천하 쟁패의 기본입니다.',
    personality: 'cautious',
    speechStyle: {
      emphasis: ['수성', '형주', '안정', '인재', '백성'],
      endings: ['~함이 형주를 지키는 길이옵니다', '~하심이 마땅합니다', '~보전하소서'],
      exclamations: ['형주가 먼저이옵니다', '내치를 다스리소서', '굳건히 지키소서']
    }
  },

  // 유장 - 황권: 익주의 보좌관
  huangquan: {
    id: 'huangquan',
    name: '黃權',
    nameKo: '황권',
    portrait: '📜',
    faction: 'liuzhang',
    specialty: ['strategic', 'domestic'],
    greeting: '주공, 황권이 진언 드리겠습니다.',
    catchphrase: '험한 지세가 익주의 방패이니, 굳건히 지키소서.',
    personality: 'cautious',
    speechStyle: {
      emphasis: ['익주', '천험', '수비', '농사', '백성'],
      endings: ['~해야 하옵니다', '~함이 익주를 보전하는 길', '~하소서'],
      exclamations: ['익주를 지키소서', '밖의 일에 휘말리지 마소서', '험준함을 믿으소서']
    }
  },

  // 공손찬 - 전예: 북방의 전사
  tianyujing: {
    id: 'tianyujing',
    name: '田豫',
    nameKo: '전예',
    portrait: '⚔️',
    faction: 'gongsunzan',
    specialty: ['military', 'domestic'],
    greeting: '주공, 전예가 방책을 올리겠습니다.',
    catchphrase: '북방 오랑캐를 막아온 백마장사의 위엄을 보여주소서!',
    personality: 'aggressive',
    speechStyle: {
      emphasis: ['백마', '기병', '북방', '돌격', '위엄'],
      endings: ['~하십시오!', '~달려나가십시오', '~물리치소서'],
      exclamations: ['돌격!', '백마의 위엄으로!', '북방의 사나이답게!']
    }
  },

  // 황건적 - 장각: 태평도의 교주
  zhangjiao: {
    id: 'zhangjiao_advisor',
    name: '張角',
    nameKo: '장각',
    portrait: '☯️',
    faction: 'rebels',
    specialty: ['strategic', 'personnel'],
    greeting: '형제여, 하늘의 뜻을 전하노라.',
    catchphrase: '창천이 이미 죽었으니, 황천이 마땅히 서리라!',
    personality: 'aggressive',
    speechStyle: {
      emphasis: ['황천', '태평', '민초', '부패한 관리', '하늘의 뜻'],
      endings: ['~해야 하리라', '~것이 하늘의 뜻이니라', '~형제들이여'],
      exclamations: ['창천이 죽었도다!', '황천의 때가 왔도다!', '형제들이여!']
    }
  },

  // 범용 책사 (소세력용)
  generic: {
    id: 'generic',
    name: '謀士',
    nameKo: '모사',
    portrait: '📖',
    faction: 'player',
    specialty: ['strategic', 'military', 'domestic', 'personnel'],
    greeting: '주공, 소인이 헤아려본 바를 말씀드리겠습니다.',
    catchphrase: '주공의 현명한 판단을 믿습니다.',
    personality: 'balanced',
    speechStyle: {
      emphasis: ['생각건대', '헤아려보면', '소견으로는'],
      endings: ['~인 듯합니다', '~하시면 좋겠습니다', '~함이 좋을 것 같습니다'],
      exclamations: ['주공', '생각하옵건대', '소인의 소견으로는']
    }
  }
};

// 세력별 기본 책사 매핑
export const FACTION_STRATEGIST: Record<FactionId, string> = {
  player: 'generic',
  liubei: 'zhugeliang',
  caocao: 'simayi',
  sunquan: 'zhouyu',
  dongzhuo: 'liru',
  yuanshao: 'tianfeng',
  liubiao: 'kuailiang',
  liuzhang: 'huangquan',
  gongsunzan: 'tianyujing',
  rebels: 'zhangjiao_advisor'
};

// 세력과 선택한 원래 세력에 따라 책사 선택
export function getStrategistForFaction(selectedFaction: FactionId): Strategist {
  const strategistId = FACTION_STRATEGIST[selectedFaction] || 'generic';
  return STRATEGISTS[strategistId] || STRATEGISTS.generic;
}
