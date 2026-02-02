// ============================================
// 책사 캐릭터 정의
// ============================================

import type { FactionId } from '../types';
import type { Strategist } from './types';

// 각 세력별 책사 정의
export const STRATEGISTS: Record<string, Strategist> = {
  // 촉
  zhugeliang: {
    id: 'zhugeliang',
    name: '諸葛亮',
    nameKo: '제갈량',
    portrait: '🪭',
    faction: 'liubei',
    specialty: ['strategic', 'military', 'domestic'],
    greeting: '주공, 제갈량이 대책을 말씀드리겠습니다.',
    catchphrase: '~하오니, 깊이 헤아려 주시옵소서.'
  },
  
  // 위
  simayi: {
    id: 'simayi',
    name: '司馬懿',
    nameKo: '사마의',
    portrait: '🦊',
    faction: 'caocao',
    specialty: ['strategic', 'military'],
    greeting: '주공, 사마의가 진언 드리겠습니다.',
    catchphrase: '~함이 상책이옵니다.'
  },
  xunyu: {
    id: 'xunyu',
    name: '荀彧',
    nameKo: '순욱',
    portrait: '📜',
    faction: 'caocao',
    specialty: ['domestic', 'personnel'],
    greeting: '주공, 순욱이 정세를 분석하였습니다.',
    catchphrase: '~하시길 청하옵니다.'
  },
  guojia: {
    id: 'guojia',
    name: '郭嘉',
    nameKo: '곽가',
    portrait: '🧠',
    faction: 'caocao',
    specialty: ['strategic', 'military'],
    greeting: '주공, 봉효가 기책을 드리겠습니다.',
    catchphrase: '적의 허를 찔러야 하옵니다.'
  },

  // 오
  zhouyu: {
    id: 'zhouyu',
    name: '周瑜',
    nameKo: '주유',
    portrait: '🔥',
    faction: 'sunquan',
    specialty: ['military', 'strategic'],
    greeting: '주공, 주유가 병법을 말씀드리겠습니다.',
    catchphrase: '대의를 이루려면 ~해야 하옵니다.'
  },
  luxun: {
    id: 'luxun',
    name: '陸遜',
    nameKo: '육손',
    portrait: '📚',
    faction: 'sunquan',
    specialty: ['military', 'domestic'],
    greeting: '주공, 육손이 말씀드리겠습니다.',
    catchphrase: '때를 기다려 ~함이 옳으리다.'
  },

  // 원소
  tianfeng: {
    id: 'tianfeng',
    name: '田豐',
    nameKo: '전풍',
    portrait: '📚',
    faction: 'yuanshao',
    specialty: ['strategic', 'domestic'],
    greeting: '주공, 전풍이 충언 드리겠습니다.',
    catchphrase: '신중히 ~하소서.'
  },

  // 동탁
  liru: {
    id: 'liru',
    name: '李儒',
    nameKo: '이유',
    portrait: '🐍',
    faction: 'dongzhuo',
    specialty: ['strategic', 'military'],
    greeting: '상국, 이유가 계책을 올리겠습니다.',
    catchphrase: '~하면 천하가 상국의 것이 되리다.'
  },

  // 유표
  kuailiang: {
    id: 'kuailiang',
    name: '蒯良',
    nameKo: '괴량',
    portrait: '📜',
    faction: 'liubiao',
    specialty: ['domestic', 'personnel'],
    greeting: '주공, 괴량이 방책을 말씀드리겠습니다.',
    catchphrase: '~함이 형주를 지키는 길이옵니다.'
  },

  // 유장
  huangquan: {
    id: 'huangquan',
    name: '黃權',
    nameKo: '황권',
    portrait: '📜',
    faction: 'liuzhang',
    specialty: ['strategic', 'domestic'],
    greeting: '주공, 황권이 진언 드리겠습니다.',
    catchphrase: '익주를 보전하려면 ~해야 하옵니다.'
  },

  // 공손찬
  tianyujing: {
    id: 'tianyujing',
    name: '田豫',
    nameKo: '전예',
    portrait: '⚔️',
    faction: 'gongsunzan',
    specialty: ['military', 'domestic'],
    greeting: '주공, 전예가 방책을 올리겠습니다.',
    catchphrase: '북방을 굳건히 ~하소서.'
  },

  // 황건적
  zhangjiao: {
    id: 'zhangjiao_advisor',
    name: '張角',
    nameKo: '장각',
    portrait: '☯️',
    faction: 'rebels',
    specialty: ['strategic', 'personnel'],
    greeting: '형제여, 하늘의 뜻을 전하노라.',
    catchphrase: '창천이 이미 죽었으니 ~해야 하리라.'
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
    catchphrase: '~함이 좋을 것 같습니다.'
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
