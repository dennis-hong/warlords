// ============================================
// AI 책사 API - Gemini 기반 조언 생성
// ============================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// 환경변수에서 API 키 로드
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 게임 상황 요약 타입
interface GameContext {
  playerFaction: string;
  turn: number;
  strategist: {
    nameKo: string;
    name: string;
    personality: string;
    speechStyle: {
      emphasis: string[];
      endings: string[];
      exclamations: string[];
    };
    catchphrase: string;
  };
  resources: {
    gold: number;
    food: number;
    troops: number;
  };
  regions: {
    name: string;
    troops: number;
    generals: string[];
    agriculture: number;
    commerce: number;
  }[];
  threats: {
    faction: string;
    regions: string[];
    troops: number;
  }[];
  opportunities: {
    region: string;
    owner: string;
    troops: number;
  }[];
  factionRanking: {
    faction: string;
    regions: number;
    troops: number;
  }[];
  question?: string;  // 사용자 질문
}

export async function POST(request: NextRequest) {
  try {
    const context: GameContext = await request.json();

    // API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI 기능이 설정되지 않았습니다.' },
        { status: 503 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    // 프롬프트 구성
    const prompt = buildPrompt(context);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000,
      },
    });

    const response = result.response;
    const text = response.text();

    return NextResponse.json({ advice: text });
  } catch (error) {
    console.error('AI Advisor error:', error);
    return NextResponse.json(
      { error: 'AI 조언 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

function buildPrompt(ctx: GameContext): string {
  const strategist = ctx.strategist;
  
  // 현재 상황 요약
  const situation = `
## 현재 상황 (${ctx.turn}턴)
- 세력: ${ctx.playerFaction}
- 자원: 금 ${ctx.resources.gold.toLocaleString()}, 식량 ${ctx.resources.food.toLocaleString()}, 병력 ${ctx.resources.troops.toLocaleString()}
- 영토: ${ctx.regions.length}개 지역
  ${ctx.regions.map(r => `  - ${r.name}: 병력 ${r.troops}, 장수 ${r.generals.length}명, 농업 ${r.agriculture}, 상업 ${r.commerce}`).join('\n')}

## 위협
${ctx.threats.length > 0 
  ? ctx.threats.map(t => `- ${t.faction}: ${t.regions.join(', ')} 접경, 병력 ${t.troops.toLocaleString()}`).join('\n')
  : '- 당장의 위협 없음'}

## 기회
${ctx.opportunities.length > 0 
  ? ctx.opportunities.slice(0, 3).map(o => `- ${o.region} (${o.owner}): 병력 ${o.troops.toLocaleString()}`).join('\n')
  : '- 특별한 기회 없음'}

## 세력 순위
${ctx.factionRanking.slice(0, 5).map((f, i) => `${i+1}. ${f.faction}: ${f.regions}개 지역, 병력 ${f.troops.toLocaleString()}`).join('\n')}
`;

  // 사용자 질문이 있는 경우
  const questionPart = ctx.question 
    ? `\n## 주공의 질문\n"${ctx.question}"\n`
    : '';

  // 캐릭터 지시
  const characterPrompt = `
당신은 삼국지의 책사 **${strategist.nameKo}(${strategist.name})**입니다.

## 성격
- 유형: ${strategist.personality}
  ${strategist.personality === 'aggressive' ? '- 공격적이고 과감한 결정을 선호합니다.' : ''}
  ${strategist.personality === 'cautious' ? '- 신중하고 인내하며 때를 기다립니다.' : ''}
  ${strategist.personality === 'balanced' ? '- 균형잡힌 시각으로 상황을 분석합니다.' : ''}
  ${strategist.personality === 'cunning' ? '- 기발한 계책과 심리전을 즐깁니다.' : ''}

## 말투 특징
- 강조 표현: ${strategist.speechStyle.emphasis.join(', ')}
- 문장 끝맺음: ${strategist.speechStyle.endings.join(', ')}
- 감탄사: ${strategist.speechStyle.exclamations.join(', ')}
- 대표 대사: "${strategist.catchphrase}"

## 지시사항
1. 위 상황을 분석하고 ${ctx.question ? '주공의 질문에 답하면서' : ''} 전략 조언을 해주세요.
2. **반드시** 캐릭터의 성격과 말투를 유지하세요.
3. 너무 길지 않게, 핵심만 간결하게 전달하세요 (200자 내외).
4. 구체적이고 실행 가능한 조언을 포함하세요.
5. 캐릭터 특유의 명대사나 표현을 자연스럽게 사용하세요.
6. 마크다운 문법(**, *, #, - 등)을 절대 사용하지 마세요. 순수 텍스트로만 작성하세요.
`;

  return characterPrompt + situation + questionPart;
}
