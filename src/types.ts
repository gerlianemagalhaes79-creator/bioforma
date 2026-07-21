export type SubjectCategory = 'Conhecimentos Básicos' | 'Didática e Legislação' | 'Conhecimentos Específicos';

export type TopicStatus = 'not_started' | 'in_progress' | 'reviewed' | 'mastered';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  targetSubject: string; // e.g. "Língua Portuguesa", "Matemática", "História", "Biologia", etc.
  dailyGoalMinutes: number; // e.g. 180 (3 horas)
  streakDays: number;
  completedTopicsCount: number;
  totalQuestionsDone: number;
  correctAnswersCount: number;
  createdAt?: any;
}

export interface EditalTopic {
  id: string;
  category: SubjectCategory;
  subject: string;
  topicName: string;
  status: TopicStatus;
  notes?: string;
  importance: 'alta' | 'média' | 'baixa';
}

export interface Question {
  id: string;
  category: SubjectCategory;
  subject: string;
  topic: string;
  banca: 'IDECAN' | 'CEBRASPE' | 'VUNESP' | 'FAPEC' | 'Inédita PasseiSEDUC';
  questionText: string;
  supportText?: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  legalReference?: string;
  difficulty: 'fácil' | 'médio' | 'difícil';
}

export interface EssayTheme {
  id: string;
  title: string;
  category: string;
  prompt: string;
  contextText: string;
  guidePoints: string[];
}

export interface EssaySubmission {
  id?: string;
  uid: string;
  themeId: string;
  themeTitle: string;
  essayText: string;
  score: number; // 0-100
  criteriaScores: {
    normaCulta: number; // max 25
    dominioConteudo: number; // max 30
    estruturacaoTexto: number; // max 25
    propostaPedagogica: number; // max 20
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  submittedAt: string;
}

export interface TutorChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  legalReference?: string;
  timestamp: string;
}
