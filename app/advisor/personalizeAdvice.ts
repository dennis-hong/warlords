// ============================================
// 책사 성격에 따른 조언 개성화
// ============================================

import type { Advice, Strategist, AdviceCategory } from './types';

// 성격별 기본 반응 패턴
const PERSONALITY_PATTERNS = {
  aggressive: {
    military: {
      prefix: ['지금이 기회입니다!', '더 이상 기다리지 마십시오!', '과감히 나아가십시오!'],
      suffix: ['망설이면 기회를 놓칩니다!', '승기를 잡으십시오!', '적이 두려워할 것입니다!']
    },
    domestic: {
      prefix: ['속히', '당장', '지체 없이'],
      suffix: ['전쟁 준비를 위함입니다.', '강병을 기르기 위함입니다.', '힘을 키워야 합니다.']
    },
    strategic: {
      prefix: ['공격이 최선의 방어입니다!', '먼저 치지 않으면 당합니다!'],
      suffix: ['주저하면 안 됩니다!', '적을 압도하십시오!']
    },
    personnel: {
      prefix: ['용맹한 장수를', '전쟁터에 나설 인재를'],
      suffix: ['전장에서 빛날 것입니다!', '승리를 안겨줄 것입니다!']
    },
    urgent: {
      prefix: ['즉시!', '당장!', '지금 바로!'],
      suffix: ['더 이상 지체하면 안 됩니다!', '한 순간도 늦출 수 없습니다!']
    }
  },
  cautious: {
    military: {
      prefix: ['신중히 판단해야 합니다.', '서두르지 마십시오.', '충분히 준비한 후에'],
      suffix: ['만전을 기해야 합니다.', '후환이 없도록 하십시오.', '퇴로를 확보하십시오.']
    },
    domestic: {
      prefix: ['우선', '먼저', '기반을 다지기 위해'],
      suffix: ['이것이 근본입니다.', '내실이 중요합니다.', '튼튼한 기반이 됩니다.']
    },
    strategic: {
      prefix: ['때를 기다리십시오.', '인내가 필요합니다.'],
      suffix: ['기회는 반드시 옵니다.', '조급함은 금물입니다.']
    },
    personnel: {
      prefix: ['믿을 수 있는 인재를', '충성스러운 신하를'],
      suffix: ['오래 곁에 둘 인재입니다.', '신뢰할 수 있습니다.']
    },
    urgent: {
      prefix: ['침착하게 대응하십시오.', '당황하지 마십시오.'],
      suffix: ['차근차근 대비합시다.', '준비가 있으면 두렵지 않습니다.']
    }
  },
  balanced: {
    military: {
      prefix: ['상황을 보아', '형세를 살펴', '때에 맞춰'],
      suffix: ['균형 있게 대처하십시오.', '상황에 맞게 움직이십시오.', '융통성 있게 대응하십시오.']
    },
    domestic: {
      prefix: ['조화롭게', '균형 있게', '차근차근'],
      suffix: ['기반이 튼튼해집니다.', '오래 갈 것입니다.', '백성이 따를 것입니다.']
    },
    strategic: {
      prefix: ['대세를 보건대', '천하의 형세가'],
      suffix: ['현명한 선택이 됩니다.', '후대에 기억될 것입니다.']
    },
    personnel: {
      prefix: ['인재를 고르게', '덕과 재능을 겸비한'],
      suffix: ['좋은 보필이 될 것입니다.', '큰 도움이 됩니다.']
    },
    urgent: {
      prefix: ['서둘러야 하지만 침착하게', '빠르되 정확하게'],
      suffix: ['슬기롭게 대처하십시오.', '혼란에 빠지지 마십시오.']
    }
  },
  cunning: {
    military: {
      prefix: ['적의 허점을 노리십시오!', '기습이 답입니다!', '상대가 예상 못한 곳을'],
      suffix: ['기책이 통할 것입니다!', '적이 당황할 것입니다!', '뒤통수를 치십시오!']
    },
    domestic: {
      prefix: ['겉으로는 평화롭게, 속으로는', '적을 속이려면 먼저'],
      suffix: ['속셈을 숨기십시오.', '힘을 감추십시오.', '때를 노리십시오.']
    },
    strategic: {
      prefix: ['이간계를 쓰십시오!', '적을 분열시키십시오!'],
      suffix: ['손 안 대고 코 풀 수 있습니다!', '어부지리를 노리십시오!']
    },
    personnel: {
      prefix: ['간자를 심거나', '뛰어난 지략가를'],
      suffix: ['적의 정보를 캐올 수 있습니다.', '기책에 능한 자입니다.']
    },
    urgent: {
      prefix: ['위기를 기회로!', '적도 당황했을 것입니다!'],
      suffix: ['혼란을 틈타 역전하십시오!', '이럴 때 판을 뒤집습니다!']
    }
  }
};

// 특수 상황별 책사 코멘트
const SPECIAL_COMMENTS: Record<string, Record<string, string>> = {
  zhugeliang: {
    lowResources: '백성이 굶주리면 대의를 이룰 수 없사옵니다.',
    attackOpportunity: '지피지기면 백전불태... 적의 허점이 보이옵니다.',
    defense: '수비도 때로는 최선의 공격이 됩니다.',
    recruitment: '와룡이 봉추를 만나면 천하를 얻는다 했사옵니다. 인재가 곧 천하이옵니다.'
  },
  guojia: {
    lowResources: '자원이 부족해도 기책으로 이길 수 있습니다!',
    attackOpportunity: '적이 방심했습니다! 번개같이 치십시오!',
    defense: '수비라... 좀 답답하지만, 기회를 노려야겠군요.',
    recruitment: '머리 좋은 놈 하나가 만 명보다 낫습니다!'
  },
  zhouyu: {
    lowResources: '강동의 풍요로움을 되찾아야 합니다!',
    attackOpportunity: '화공의 기회입니다! 동남풍을 기다리십시오!',
    defense: '장강이 천연의 요새... 굳건히 지키십시오!',
    recruitment: '강동의 인재가 중원에 뒤지지 않습니다!'
  },
  simayi: {
    lowResources: '때를 기다리며 힘을 기르십시오.',
    attackOpportunity: '기회가 보이나... 조금 더 지켜봅시다.',
    defense: '수비를 굳건히 하면 적이 지칩니다.',
    recruitment: '인재는 오래 지켜봐야 진가를 압니다.'
  },
  liru: {
    lowResources: '약한 자에게서 빼앗으면 됩니다.',
    attackOpportunity: '자비는 필요 없습니다. 철저히 짓밟으십시오!',
    defense: '적이 두려워하도록 공포를 심으십시오.',
    recruitment: '배신할 자는 먼저 써먹고 버리면 됩니다.'
  }
};

// 조언을 책사 성격에 맞게 변환
export function personalizeAdvice(advice: Advice, strategist: Strategist): Advice {
  const patterns = PERSONALITY_PATTERNS[strategist.personality];
  const categoryPatterns = patterns[advice.category] || patterns.strategic;
  
  // 랜덤 선택 함수
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  
  // 제목에 책사 스타일 반영 (긴급/중요한 경우)
  let newTitle = advice.title;
  if (advice.priority === 'critical' || advice.priority === 'high') {
    const exclamation = pick(strategist.speechStyle.exclamations);
    // 이미 이모지로 시작하면 그 뒤에 추가
    if (/^[^\w\s]/.test(newTitle)) {
      newTitle = newTitle.replace(/^([^\w\s]+\s*)/, `$1${exclamation} `);
    }
  }

  // 설명에 성격 반영
  let newDescription = advice.description;
  // 앞에 접두사 추가 (50% 확률)
  if (Math.random() > 0.5 && categoryPatterns.prefix.length > 0) {
    newDescription = `${pick(categoryPatterns.prefix)} ${newDescription.charAt(0).toLowerCase()}${newDescription.slice(1)}`;
  }
  
  // 추론에 특수 코멘트 및 어미 반영
  let newReasoning = advice.reasoning;
  
  // 특수 상황 코멘트 추가 (책사별)
  const specialComments = SPECIAL_COMMENTS[strategist.id];
  if (specialComments) {
    const situation = detectSituation(advice);
    if (situation && specialComments[situation]) {
      newReasoning = `${specialComments[situation]} ${newReasoning}`;
    }
  }
  
  // 문장 끝에 책사 특유의 어미 추가 (30% 확률)
  if (Math.random() > 0.7) {
    const ending = pick(strategist.speechStyle.endings);
    // 마지막 문장만 어미 변경
    const sentences = newReasoning.split(/(?<=[.!?])\s*/);
    if (sentences.length > 0) {
      let lastSentence = sentences[sentences.length - 1];
      // 기존 종결어미 제거하고 새 어미 추가
      lastSentence = lastSentence.replace(/[.!?~]+$/, '') + ' ' + ending;
      sentences[sentences.length - 1] = lastSentence;
      newReasoning = sentences.join(' ');
    }
  }

  // 성격별 접미사 추가 (40% 확률)
  if (Math.random() > 0.6 && categoryPatterns.suffix.length > 0) {
    newReasoning = `${newReasoning} ${pick(categoryPatterns.suffix)}`;
  }

  return {
    ...advice,
    title: newTitle,
    description: newDescription,
    reasoning: newReasoning
  };
}

// 상황 감지
function detectSituation(advice: Advice): string | null {
  const text = `${advice.title} ${advice.description}`.toLowerCase();
  
  if (text.includes('바닥') || text.includes('부족') || text.includes('고갈')) {
    return 'lowResources';
  }
  if (text.includes('공격') && text.includes('적기')) {
    return 'attackOpportunity';
  }
  if (text.includes('방어') || text.includes('위협') || text.includes('침략')) {
    return 'defense';
  }
  if (text.includes('등용') || text.includes('장수')) {
    return 'recruitment';
  }
  
  return null;
}

// 모든 조언을 한번에 개성화
export function personalizeAllAdvice(adviceList: Advice[], strategist: Strategist): Advice[] {
  return adviceList.map(advice => personalizeAdvice(advice, strategist));
}
