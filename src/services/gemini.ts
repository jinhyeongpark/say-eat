export interface FoodItem {
  name: string;
  carbs: number;
  fat: number;
  protein: number;
  calories: number;
  tags: string[];
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `당신은 한국 식문화와 음식 영양성분에 해박한 정밀 영양 분석 AI 전문가입니다.
사용자가 입력한 자연어 식단 문장을 분석하여 음식명, 탄수화물(g), 단백질(g), 지방(g), 총 칼로리(kcal), 특징 해시태그 목록을 추출해 내야 합니다.

[반드시 준수해야 할 출력 형식 (JSON Schema)]
출력은 추가 설명, 서론, 결론, 마크다운 기호(예: \`\`\`json) 없이 오직 아래 구조를 가진 순수한 JSON 객체 하나만 반환해야 합니다.

{
  "menuList": [
    {
      "name": "음식명 (한글로 변환 및 정돈된 이름)",
      "carbs": 탄수화물_그램수(정수형 숫자만),
      "protein": 단백질_그램수(정수형 숫자만),
      "fat": 지방_그램수(정수형 숫자만),
      "calories": 총칼로리_kcal(정수형 숫자만),
      "tags": ["#태그1", "#태그2", "#태그3"]
    }
  ]
}

[분석 및 계산 규칙]
1. 복합 메뉴 분리: 사용자가 여러 음식을 나열한 경우(예: "삼겹살에 밥 한공기, 제로콜라") 각 음식을 menuList 내의 개별 객체로 분할하십시오.
2. 수치 합산의 정합성:
   * 탄수화물 1g = 4kcal, 단백질 1g = 4kcal, 지방 1g = 9kcal 기준을 기본으로 계산하되, 한국 식약처 식품영양성분 데이터베이스의 실제 음식 열량과 크게 벗어나지 않도록 현실적인 수치를 부여하십시오.
   * "calories" 값은 계산한 (탄수화물*4 + 단백질*4 + 지방*9)의 값과 오차가 최대 10% 이내여야 합니다.
3. 해시태그 작명:
   * 음식당 2~3개의 개성 넘치는 직관적인 해시태그를 생성하십시오.
   * 예: 고단백 음식 -> #고단백, 다이어트식 -> #클린식, 고탄수/고지방 고칼로리 -> #치팅데이 #탄단지폭발, 채소류 -> #식이섬유 등.
4. 양 추정: 사용자가 명확한 양(예: "삼겹살 2인분", "밥 반공기")을 말했을 경우 해당 서빙 사이즈에 맞춰 수치를 비례 계산하십시오. 언급이 없으면 1인분(Standard Serving) 기준으로 추정합니다.`;

function buildSystemPrompt(customFoodsPrompt?: string) {
  return customFoodsPrompt ? `${SYSTEM_PROMPT}\n\n${customFoodsPrompt}` : SYSTEM_PROMPT;
}

async function callGemini(payload: object): Promise<FoodItem[]> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('빈 응답');
  const parsed = JSON.parse(raw.trim());
  return parsed.menuList ?? [];
}

export async function analyzeDiet(text: string, customFoodsPrompt = ''): Promise<FoodItem[]> {
  if (!GEMINI_API_KEY) return localParser(text);
  try {
    return await callGemini({
      contents: [{ parts: [{ text: `다음 식단을 분석해줘: "${text}"` }] }],
      systemInstruction: { parts: [{ text: buildSystemPrompt(customFoodsPrompt) }] },
      generationConfig: { responseMimeType: 'application/json' },
    });
  } catch (err) {
    console.warn('Gemini 텍스트 분석 실패, 로컬 파서 사용:', err);
    return localParser(text);
  }
}

export async function analyzeDietFromAudio(audioBase64: string, mimeType: string, customFoodsPrompt = ''): Promise<FoodItem[]> {
  return callGemini({
    contents: [{
      parts: [
        { inlineData: { mimeType, data: audioBase64 } },
        { text: '이 오디오에서 먹은 음식을 분석해줘' },
      ],
    }],
    systemInstruction: { parts: [{ text: buildSystemPrompt(customFoodsPrompt) }] },
    generationConfig: { responseMimeType: 'application/json' },
  });
}

function localParser(text: string): FoodItem[] {
  const lower = text.toLowerCase();
  let name = text;
  let carbs = 15, fat = 8, protein = 15;
  let tags = ["#일반식", "#든든함"];

  if (lower.includes("닭가슴살") || lower.includes("샐러드")) {
    name = "닭가슴살 샐러드"; carbs = 8; fat = 4; protein = 28;
    tags = ["#클린식", "#고단백", "#저탄수"];
  } else if (lower.includes("피자") || lower.includes("햄버거") || lower.includes("치킨")) {
    name = "치팅밀"; carbs = 65; fat = 28; protein = 22;
    tags = ["#치팅데이", "#고열량"];
  } else if (lower.includes("밥") || lower.includes("비빔밥") || lower.includes("한식")) {
    name = "한식 식사"; carbs = 55; fat = 9; protein = 14;
    tags = ["#한국인밥상", "#균형식단"];
  } else if (lower.includes("삼겹살") || lower.includes("고기") || lower.includes("소고기")) {
    name = "고기 식단"; carbs = 4; fat = 32; protein = 35;
    tags = ["#키토", "#고단백"];
  } else if (lower.includes("라떼")) {
    name = "카페라떼"; carbs = 10; fat = 5; protein = 4;
    tags = ["#카페인", "#우유함유"];
  } else if (lower.includes("커피") || lower.includes("아메리카노")) {
    name = "아메리카노"; carbs = 1; fat = 0; protein = 0;
    tags = ["#카페인", "#제로"];
  }

  const calories = carbs * 4 + fat * 9 + protein * 4;
  return [{ name, carbs, fat, protein, calories, tags }];
}
