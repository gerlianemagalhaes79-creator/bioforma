import { calculateStreak } from './streak';

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'questions' | 'accuracy' | 'study' | 'essay';
  iconName: string;
  color: 'emerald' | 'amber' | 'indigo' | 'rose' | 'purple' | 'cyan';
  maxProgress: number;
  unlocked: boolean;
  currentProgress: number;
  unlockedAt?: string;
  motto: string;
}

export function getUserBadges(activeUid: string = 'guest'): { badges: Badge[]; unlockedCount: number; totalCount: number } {
  let activityDates: string[] = [];
  let questionLogs: any[] = [];
  let completedTopicsCount = 0;
  let maxEssayScore = 0;

  try {
    const actRaw = localStorage.getItem(`activity_dates_${activeUid}`);
    if (actRaw) activityDates = JSON.parse(actRaw);
  } catch (_) {}

  try {
    const qRaw = localStorage.getItem(`questionLogs_${activeUid}`);
    if (qRaw) questionLogs = JSON.parse(qRaw);
  } catch (_) {}

  try {
    const progRaw = localStorage.getItem(`cronogramaProgress_${activeUid}`) || localStorage.getItem(`cronogramaProgress_guest`);
    if (progRaw) {
      const prog = JSON.parse(progRaw);
      if (typeof prog === 'object' && prog !== null) {
        completedTopicsCount = Object.values(prog).filter((v: any) => v === true || v?.completed === true).length;
      }
    }
  } catch (_) {}

  try {
    const essayRaw = localStorage.getItem(`essaySubmissions_${activeUid}`);
    if (essayRaw) {
      const essays = JSON.parse(essayRaw);
      if (Array.isArray(essays)) {
        maxEssayScore = essays.reduce((max: number, e: any) => Math.max(max, e.score || 0), 0);
      }
    }
  } catch (_) {}

  const currentStreak = calculateStreak(activityDates);
  const totalQuestions = questionLogs.length;
  const correctQuestions = questionLogs.filter((q: any) => q.isCorrect).length;
  const accuracy = totalQuestions >= 15 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  // Active days in current week (Monday to Sunday)
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const activeDaysThisWeek = activityDates.filter(dStr => {
    try {
      const d = new Date(dStr + 'T12:00:00');
      return d >= monday && d <= now;
    } catch {
      return false;
    }
  }).length;

  const rawBadges: Omit<Badge, 'unlocked' | 'currentProgress'>[] = [
    {
      id: 'streak_1',
      title: 'Primeiro Passo',
      description: 'Cumpra seu 1º dia de estudos na plataforma',
      category: 'streak',
      iconName: 'Zap',
      color: 'emerald',
      maxProgress: 1,
      motto: 'Toda aprovação começa no primeiro dia!'
    },
    {
      id: 'streak_3',
      title: 'Foco Ativado',
      description: 'Mantenha 3 dias consecutivos de ofensiva',
      category: 'streak',
      iconName: 'Flame',
      color: 'amber',
      maxProgress: 3,
      motto: 'A constância transforma esforço em resultado.'
    },
    {
      id: 'streak_7',
      title: 'Imparável FUNECE',
      description: 'Complete 1 semana inteira de ofensiva (7 dias)',
      category: 'streak',
      iconName: 'ShieldCheck',
      color: 'purple',
      maxProgress: 7,
      motto: 'Uma semana sem falhas no caminho da posse!'
    },
    {
      id: 'streak_14',
      title: 'Mestre da Disciplina',
      description: 'Mantenha 14 dias seguidos de preparação sólida',
      category: 'streak',
      iconName: 'Award',
      color: 'indigo',
      maxProgress: 14,
      motto: 'O hábito de estudar já faz parte de você.'
    },
    {
      id: 'streak_30',
      title: 'Lenda da Constância',
      description: 'Complete 30 dias consecutivos no ritmo SEDUC',
      category: 'streak',
      iconName: 'Crown',
      color: 'amber',
      maxProgress: 30,
      motto: 'Exemplo de dedicação absoluta e disciplina!'
    },
    {
      id: 'questions_10',
      title: 'Treino Iniciado',
      description: 'Responda 10 questões no simulador',
      category: 'questions',
      iconName: 'CheckCircle2',
      color: 'emerald',
      maxProgress: 10,
      motto: 'A teoria se fixa com a prática.'
    },
    {
      id: 'questions_50',
      title: 'Cientista de Questões',
      description: 'Responda 50 questões no estilo da banca FUNECE',
      category: 'questions',
      iconName: 'Target',
      color: 'cyan',
      maxProgress: 50,
      motto: 'Dominando o formato de cobrança do concurso.'
    },
    {
      id: 'questions_100',
      title: 'Maratonista FUNECE',
      description: 'Atinja o marco de 100 questões resolvidas',
      category: 'questions',
      iconName: 'BrainCircuit',
      color: 'indigo',
      maxProgress: 100,
      motto: 'Resolução massiva constrói a vaga.'
    },
    {
      id: 'accuracy_80',
      title: 'Precisão Cirúrgica',
      description: 'Alcançar 80%+ de rendimento (mín. 15 questões)',
      category: 'accuracy',
      iconName: 'TrendingUp',
      color: 'emerald',
      maxProgress: 80,
      motto: 'Alto desempenho focado na aprovação.'
    },
    {
      id: 'topics_10',
      title: 'Dominador do Edital',
      description: 'Conclua 10 tópicos ou subtópicos no cronograma',
      category: 'study',
      iconName: 'BookOpen',
      color: 'purple',
      maxProgress: 10,
      motto: 'Esgotando o edital com estratégia.'
    },
    {
      id: 'weekly_goal',
      title: 'Guardião Semanal',
      description: 'Estude em pelo menos 4 dias na semana atual',
      category: 'study',
      iconName: 'Calendar',
      color: 'amber',
      maxProgress: 4,
      motto: 'Meta semanal atingida com sucesso!'
    },
    {
      id: 'essay_pro',
      title: 'Mestre da Discursiva',
      description: 'Obtenha nota igual ou superior a 80 na Redação',
      category: 'essay',
      iconName: 'PenTool',
      color: 'rose',
      maxProgress: 80,
      motto: 'Texto estruturado e de alto impacto pedagogico.'
    }
  ];

  const badges: Badge[] = rawBadges.map(b => {
    let currentProgress = 0;
    let unlocked = false;

    switch (b.id) {
      case 'streak_1':
        currentProgress = Math.min(1, currentStreak);
        unlocked = currentStreak >= 1;
        break;
      case 'streak_3':
        currentProgress = Math.min(3, currentStreak);
        unlocked = currentStreak >= 3;
        break;
      case 'streak_7':
        currentProgress = Math.min(7, currentStreak);
        unlocked = currentStreak >= 7;
        break;
      case 'streak_14':
        currentProgress = Math.min(14, currentStreak);
        unlocked = currentStreak >= 14;
        break;
      case 'streak_30':
        currentProgress = Math.min(30, currentStreak);
        unlocked = currentStreak >= 30;
        break;
      case 'questions_10':
        currentProgress = Math.min(10, totalQuestions);
        unlocked = totalQuestions >= 10;
        break;
      case 'questions_50':
        currentProgress = Math.min(50, totalQuestions);
        unlocked = totalQuestions >= 50;
        break;
      case 'questions_100':
        currentProgress = Math.min(100, totalQuestions);
        unlocked = totalQuestions >= 100;
        break;
      case 'accuracy_80':
        currentProgress = Math.min(80, accuracy);
        unlocked = accuracy >= 80 && totalQuestions >= 15;
        break;
      case 'topics_10':
        currentProgress = Math.min(10, completedTopicsCount);
        unlocked = completedTopicsCount >= 10;
        break;
      case 'weekly_goal':
        currentProgress = Math.min(4, activeDaysThisWeek);
        unlocked = activeDaysThisWeek >= 4;
        break;
      case 'essay_pro':
        currentProgress = Math.min(80, maxEssayScore);
        unlocked = maxEssayScore >= 80;
        break;
    }

    return {
      ...b,
      currentProgress,
      unlocked
    };
  });

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return {
    badges,
    unlockedCount,
    totalCount: badges.length
  };
}
