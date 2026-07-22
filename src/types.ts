export type SubjectCategory = 
  | 'Conhecimentos Específicos'
  | 'Educação Brasileira: Temas Educacionais e Pedagógicos'
  | 'Língua Portuguesa'
  | 'Dados e Indicadores Educacionais'
  | 'Administração Pública'
  | 'Conhecimentos Básicos'
  | 'Didática e Legislação';

export type TopicStatus = 'not_started' | 'in_progress' | 'reviewed' | 'mastered';

export interface EditalSubtopic {
  id: string;
  name: string;
  status: TopicStatus;
}

export interface EditalTopicItem {
  id: string;
  name: string;
  status: TopicStatus;
  subtopics: EditalSubtopic[];
}

export interface EditalBlock {
  id: string;
  name: string;
  topics: EditalTopicItem[];
}

export type GeneralCategoryKey = 
  | 'Educação Brasileira: Temas Educacionais e Pedagógicos'
  | 'Administração Pública'
  | 'Língua Portuguesa'
  | 'Leitura e Interpretação de Dados e Indicadores Educacionais';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role?: 'admin' | 'professor';
  isAdmin?: boolean;
  age?: number;
  isWorkingInArea?: string; // e.g., "Sim - Professor Temporário (Rede Pública)", "Sim - Rede Privada", "Não atuo ainda"
  startDate?: string; // e.g. "2026-07-22"
  examDate?: string; // e.g. "2026-10-18"
  degree?: string; // e.g. "Licenciatura em Língua Portuguesa", "Licenciatura em Matemática", etc.
  hoursPerDay?: number; // e.g. 3
  onboardingCompleted?: boolean;
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
  blockName?: string;
  topicName: string;
  subtopics?: string[];
  status: TopicStatus;
  notes?: string;
  importance: 'alta' | 'média' | 'baixa';
}

export interface Question {
  id: string;
  category: SubjectCategory | string;
  subject: string;
  topic: string;
  subtopic?: string;
  banca: string;
  questionText: string;
  supportText?: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D' | 'E';
    text: string;
  }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  legalReference?: string;
  difficulty: string;
  skills?: string[];
  commonMistake?: string;
  studyTip?: string;
}

export interface EssayTheme {
  id: string;
  title: string;
  category: string;
  prompt: string;
  contextText: string;
  guidePoints: string[];
}

export interface ScheduleTopicItem {
  id: string;
  category: SubjectCategory;
  subject: string;
  topicName: string;
  completed: boolean;
}

export interface ScheduleDay {
  dateStr: string; // "2026-07-22"
  displayDate: string; // "22/07 (Qua)"
  dayNumber: number; // 1, 2, 3...
  topics: ScheduleTopicItem[];
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
