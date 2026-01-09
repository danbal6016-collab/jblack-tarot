import { CategoryKey, QuestionCategory } from './types';

export const CATEGORIES: QuestionCategory[] = [
  {
    id: 'FANDOM',
    label: '덕질',
    icon: '✨',
    questions: [
      '최애는 나를 어떻게 생각하는가?',
      '최애와 만날 확률이 가장 높은 장소는 어디인가?',
      '최애의 취향은 무엇인가?',
      '최애는 지금 누구와 교제 중인가?',
      '내가 탈덕을 한다면 이유가 무엇일까?',
      '최애와 나의 관계는 어떤가?',
      '최애와 나의 궁합은 어떤가?',
      '이 덕질은 언제까지 유지될까?',
      '내 최애의 병크는 무엇인가?',
      '최애와 진짜 사귈 수 있을까?'
    ]
  },
  {
    id: 'LOVE',
    label: '연애',
    icon: '🌹',
    questions: [
      '나의 다음 연애는 언제쯤 시작되는가?',
      '나의 미래 배우자는 어떤 사람인가?',
      '그 새끼에게 가장 크게 복수하는 법은 무엇인가?',
      '지금 만나고 있는 이 사람과의 끝은 어떻게 될까?',
      '나를 짝사랑하고 있는 사람은 누구인가?',
      '그 사람은 나에게 먼저 연락을 하게 되는가?',
      '이성에게 가장 호감을 사는 나의 매력 포인트는 무엇인가?',
      '그 사람은 나를 어떻게 생각하는가?',
      '그 사람과 나의 연인 발전 가능성은 어느 정도인가?',
      '지금 관계를 발전시키기 위해 내가 해야 할 행동은 무엇인가?',
      '현재 그 관계의 가장 큰 문제점은 무엇인가?',
      '상대는 나에게 무엇을 숨기고 있는가?',
      '그 관계의 미래는 어떻게 되는가?',
      '미래에 내가 만나게 될 이성은 어떤 스타일인가?'
    ]
  },
  {
    id: 'APPEARANCE',
    label: '외모',
    icon: '💄',
    questions: [
      '나에게 가장 효과 좋은 다이어트 방법은 무엇인가?',
      '성형을 한다면 어디를 하는 게 좋은가?',
      '나만의 독보적 분위기는 무엇인가?',
      '나에겐 어떤 스타일링이 가장 잘 어울리는가?',
      '나의 외모는 주로 사람들에게 어떤 인상을 주는가?'
    ]
  },
  {
    id: 'CAREER',
    label: '진로',
    icon: '🔮',
    questions: [
      '내가 미래에서 가장 성공하는 법은 무엇인가?',
      '내 업계 사람들은 나에 대해 뭐라고 생각하는가?',
      '나에게 숨겨진 잠재력은 무엇일까?',
      '어떤 종류의 길을 택해야 내 삶의 만족도가 높아지는가?',
      '내가 내 커리어에서 겪을 수 있는 큰 어려움은?',
      '내가 내 커리어 성취를 위해 지금 당장 시작해야 할 일은 무엇인가?'
    ]
  },
  {
    id: 'WEALTH',
    label: '금전',
    icon: '💰',
    questions: [
      '나의 금전복을 확 향상시키는 방법은 무엇인가?',
      '나의 금전운이 특별히 높아지는 시기는 언제인가?',
      '현재 재정 상태를 개선하려면 어떻게 해야 하는가?',
      '내가 새로 시작하려는 일은 금전적으로 어떤 영향을 불러일으킬까?',
      '어떤 방식이 나에게 가장 큰 돈이 되는가?',
      '1년 후 나의 재정 상황은 어떻게 되는가?',
      '나의 타고난 금전복은 어느 정도인가?'
    ]
  },
  {
    id: 'HEALTH',
    label: '건강',
    icon: '🌿',
    questions: [
      '나를 죽게 할 병은 무엇인가?',
      '나의 건강을 개선하기 위해서 무엇을 해야 하는가?',
      '내가 가질 수 있는 잠재적 질병은 무엇인가?',
      '어떤 식의 건강 관리가 나에게 필요한가?'
    ]
  },
  {
    id: 'STUDY',
    label: '학업',
    icon: '📚',
    questions: [
      '나는 어떤 종류의 대학에 가게 되는가?',
      '지금 공부 방식이 나에게 가장 효율적인가?',
      '현재 나의 학업 상태는 어떠한가?',
      '앞으로 나의 학업적 성취의 흐름은 어떻게 흘러갈까?',
      '내 학업에 가장 크게 방해가 되는 요소는 무엇인가?'
    ]
  },
  {
    id: 'RELATIONSHIP',
    label: '대인관계',
    icon: '🤝',
    questions: [
      '이 관계에서 내가 무의식적으로 원하는 것은 무엇인가?',
      '상대는 지금 이 관계를 어떻게 느끼는가?',
      '상대가 나에게 숨기고 있는 것은 무엇인까?',
      '상대방이 이 관계에서 바라고 있는 것은 무엇인가?',
      '이 관계가 발전하려면 무엇이 필요한가?',
      '이 관계는 나에게 어떤 영향을 끼칠까?'
    ]
  }
];

export const TAROT_DECK = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", 
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit", 
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", 
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun", 
  "Judgement", "The World",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands", 
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands", 
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups", 
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups", 
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords", 
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords", 
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles", 
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles", 
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles"
];