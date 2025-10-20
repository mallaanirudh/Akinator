export interface Trait {
  id: string;
  key: string;
  displayName: string;
  type: 'BOOLEAN' | 'ENUM' | 'STRING';
  popularity?: number;
  infoValue?: number;
}

export interface Character {
  id: string;
  name: string;
  universe?: string;
  aliases: string[];
  traits: CharacterTrait[];
}

export interface CharacterTrait {
  id: string;
  characterId: string;
  traitId: string;
  value: string;
  trait: Trait;
}

export interface Question {
  id: string;
  text: string;
  type?: string;
  key?: string;
  displayName?: string;
  popularity?: number;
  infoValue?: number;
  traitId?: string;
}

export interface AnswerLog {
  id: string;
  sessionId: string;
  traitId: string;
  questionId?: string;
  answer: string;
  answeredAt: string;
  trait?: Trait;
  question?: Question;
}

export interface Session {
  id: string;
  userId?: string;
  createdAt: string;
  completed: boolean;
  answers: AnswerLog[];
}

export interface TopChoice {
  character: Character;
  probability: number;
}

export interface GuessResult {
  character: Character;
  confidence: number;
  topChoices: TopChoice[];
}

export interface GameResponse {
  action: 'question' | 'guess';
  sessionId: string;
  question?: Question;
  guess?: GuessResult;
  topChoices?: TopChoice[];
  answersCount?: number;
  currentConfidence?: number;
  message?: string;
}