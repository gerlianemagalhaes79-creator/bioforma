import React, { useState, useEffect, useMemo } from 'react';
import { User, db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { UserProfile, QuestionAnswerLog } from '../types';
import OnboardingModal from './OnboardingModal';
import { generateStudySchedule, INITIAL_EDITAL_TOPICS } from '../data/seducData';
import { 
  Play, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Zap, 
  Target, 
  BrainCircuit, 
  Sparkles, 
  Award, 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  ArrowUpRight, 
  Lock, 
  Star, 
  Crown, 
  BarChart3, 
  Layers, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Activity, 
  Compass, 
  Trophy, 
  GraduationCap,
  CheckSquare,
  ArrowRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
  onOpenProfile?: (tab?: 'profile' | 'admin_users' | 'add_user') => void;
}

export default function Dashboard({ user, profile, setActiveTab, onOpenProfile }: DashboardProps) {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [selectedDisciplineModal, setSelectedDisciplineModal] = useState<string | null>(null);

  // Check onboarding completion
  useEffect(() => {
    if (profile && profile.onboardingCompleted === false) {
      setShowOnboardingModal(true);
    }
  }, [profile]);

  // Dynamic user details
  const rawName = profile?.name || user.displayName || 'Gerliane';
  const userName = rawName.toLowerCase().startsWith('prof') ? rawName : `Prof. ${rawName}`;
  const targetSubject = profile?.targetSubject || 'Biologia';
  const streakDays = profile?.streakDays ?? 0;
  const completedTopicsCount = profile?.completedTopicsCount ?? 0;
  const totalQuestionsDone = profile?.totalQuestionsDone ?? 0;
  const correctAnswersCount = profile?.correctAnswersCount ?? 0;
  const accuracyPct = totalQuestionsDone > 0 ? Math.round((correctAnswersCount / totalQuestionsDone) * 100) : 0;
  const totalEditalBlocks = 35;
  const editalPct = Math.min(100, Math.round((completedTopicsCount / totalEditalBlocks) * 100));

  // Exam Date Countdown
  const examDateStr = profile?.examDate || '2026-10-18';
  const [daysRemaining, setDaysRemaining] = useState(110);

  useEffect(() => {
    try {
      const examDate = new Date(`${examDateStr}T08:00:00`);
      const now = new Date();
      const diff = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      setDaysRemaining(diff > 0 ? diff : 110);
    } catch (_) {
      setDaysRemaining(110);
    }
  }, [examDateStr]);

  // Greeting time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Cronograma Completion Tracking
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    const activeUid = user?.uid || profile?.uid || 'guest';
    try {
      const saved = localStorage.getItem(`cronogramaProgress_${activeUid}`) || 
                    localStorage.getItem('cronogramaProgress_guest') || 
                    localStorage.getItem('cronogramaProgress_default');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const handleProgressUpdate = () => {
      const activeUid = user?.uid || profile?.uid || 'guest';
      try {
        const saved = localStorage.getItem(`cronogramaProgress_${activeUid}`) || 
                      localStorage.getItem('cronogramaProgress_guest') || 
                      localStorage.getItem('cronogramaProgress_default');
        if (saved) setCompletedTopicIds(JSON.parse(saved));
      } catch (_) {}
    };

    window.addEventListener('studyProgressUpdated', handleProgressUpdate);
    window.addEventListener('cronogramaProgressUpdated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('studyProgressUpdated', handleProgressUpdate);
      window.removeEventListener('cronogramaProgressUpdated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [user?.uid, profile?.uid]);

  // Full cronograma schedule
  const fullSchedule = useMemo(() => {
    return generateStudySchedule(profile || {}, INITIAL_EDITAL_TOPICS);
  }, [profile]);

  // Determine today's schedule day dynamically from the official cronograma
  const todayScheduleDay = useMemo(() => {
    if (!fullSchedule || fullSchedule.length === 0) return null;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Match exact today's date if within schedule timeline
    const exactMatch = fullSchedule.find(d => d.dateStr === todayStr);

    // 2. Otherwise find the first day with incomplete subtopics
    const firstIncompleteDay = fullSchedule.find(day => {
      return day.topics.some(t => {
        return t.subtopicNames.some((_, idx) => !completedTopicIds[`${t.id}_sub_${idx}`]);
      });
    });

    return exactMatch || firstIncompleteDay || fullSchedule[0];
  }, [fullSchedule, completedTopicIds]);

  // Daily Tasks State
  const [dailyTasks, setDailyTasks] = useState([
    { id: 1, title: `Estudar tópico de ${targetSubject}`, done: completedTopicsCount > 0, tag: 'Edital' },
    { id: 2, title: 'Resolver questões do Banco FUNECE', done: totalQuestionsDone > 0, tag: 'Simulados' },
    { id: 3, title: 'Revisar Legislação e Temas Educacionais', done: false, tag: 'Revisão' },
    { id: 4, title: 'Consultar Tutor IA para tópicos com dúvidas', done: false, tag: 'Mentoria' },
  ]);

  const completedTasksCount = dailyTasks.filter(t => t.done).length;
  const missionProgressPct = Math.round((completedTasksCount / dailyTasks.length) * 100);

  const toggleTask = (id: number) => {
    setDailyTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  // Real Question Logs State for 100% Real Disciplines Radar
  const [questionLogs, setQuestionLogs] = useState<QuestionAnswerLog[]>([]);

  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;
    const activeUid = user?.uid || profile?.uid;

    const readLocalLogs = (): QuestionAnswerLog[] => {
      try {
        const keys = activeUid 
          ? [`questionLogs_${activeUid}`, 'questionLogs_guest'] 
          : ['questionLogs_guest'];

        const map = new Map<string, QuestionAnswerLog>();
        keys.forEach(k => {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const arr: QuestionAnswerLog[] = JSON.parse(raw);
              arr.forEach(item => {
                if (item.id?.startsWith('synth_log_')) return;
                const itemKey = item.id || `${item.questionId || item.topicName || item.topic || 'q'}_${item.timestamp}`;
                map.set(itemKey, item);
              });
            } catch (_) {}
          }
        });
        return Array.from(map.values());
      } catch {
        return [];
      }
    };

    const syncLogs = () => {
      const local = readLocalLogs();
      setQuestionLogs(local);

      if (activeUid) {
        try {
          const logsRef = collection(db, 'users', activeUid, 'questionLogs');
          const q = query(logsRef);
          if (unsubFirestore) unsubFirestore();
          unsubFirestore = onSnapshot(q, (snapshot) => {
            const dbLogs: QuestionAnswerLog[] = [];
            snapshot.forEach((doc) => {
              dbLogs.push({ id: doc.id, ...doc.data() } as QuestionAnswerLog);
            });
            const combined = new Map<string, QuestionAnswerLog>();
            local.forEach(l => combined.set(l.id || `${l.questionId || l.topicName || l.topic || 'q'}_${l.timestamp}`, l));
            dbLogs.forEach(l => combined.set(l.id || `${l.questionId || l.topicName || l.topic || 'q'}_${l.timestamp}`, l));
            setQuestionLogs(Array.from(combined.values()));
          }, (err) => {
            console.warn("Firestore question logs listener error:", err);
          });
        } catch (_) {}
      }
    };

    syncLogs();

    const handleUpdate = () => syncLogs();
    window.addEventListener('questionLogUpdated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      if (unsubFirestore) unsubFirestore();
      window.removeEventListener('questionLogUpdated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user?.uid, profile?.uid]);

  // Helper to get dynamic icon based on specific subject name
  const getSubjectIcon = (subjectName: string) => {
    const norm = (subjectName || '').toLowerCase();
    if (norm.includes('biologia') || norm.includes('ciencias')) return '🧬';
    if (norm.includes('matematica')) return '📐';
    if (norm.includes('portugues') || norm.includes('letras')) return '📖';
    if (norm.includes('historia')) return '📜';
    if (norm.includes('geografia')) return '🌍';
    if (norm.includes('quimica')) return '🧪';
    if (norm.includes('fisica')) return '⚛️';
    if (norm.includes('educacao fisica')) return '⚽';
    if (norm.includes('pedagog') || norm.includes('educa')) return '🎓';
    if (norm.includes('ingles') || norm.includes('espanhol')) return '🗣️';
    if (norm.includes('filosofia') || norm.includes('sociologia')) return '🧠';
    return '🎓';
  };

  // 100% Real Radar Stats Matcher
  const matchLogDiscipline = (log: QuestionAnswerLog, targetSub: string): 'specific' | 'portugues' | 'pedagogia' | 'admin' | 'other' => {
    const rawSub = log.discipline || log.subject || log.blockName || '';
    const rawTopic = log.topicName || log.topic || '';
    const normSub = rawSub.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normTopic = rawTopic.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normTarget = (targetSub || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const combined = `${normSub} ${normTopic}`;

    const isTargetLP = normTarget.includes('portugues');

    if (!isTargetLP) {
      if (combined.includes(normTarget) || normSub.includes('especific')) {
        return 'specific';
      }
    } else {
      if (normSub.includes('especific') || normTopic.includes('redacao') || normTopic.includes('literatura')) {
        return 'specific';
      }
    }

    if (combined.includes('portugues') || combined.includes('lingua portuguesa') || combined.includes('gramatica')) {
      return isTargetLP ? 'specific' : 'portugues';
    }

    if (
      combined.includes('educa') || 
      combined.includes('pedagog') || 
      combined.includes('didatica') || 
      combined.includes('temas educacionais') || 
      combined.includes('ensino') || 
      combined.includes('bncc') ||
      combined.includes('avaliaca')
    ) {
      return 'pedagogia';
    }

    if (
      combined.includes('administracao') || 
      combined.includes('legislaca') || 
      combined.includes('ldb') || 
      combined.includes('estatuto') || 
      combined.includes('direito') || 
      combined.includes('indicadores') ||
      combined.includes('gestao')
    ) {
      return 'admin';
    }

    if (combined.includes(normTarget)) {
      return 'specific';
    }

    return 'other';
  };

  const getRadarStats = (disciplineKey: 'specific' | 'portugues' | 'pedagogia' | 'admin') => {
    const matching = questionLogs.filter(log => {
      const key = matchLogDiscipline(log, targetSubject);
      if (key === disciplineKey) return true;
      if (disciplineKey === 'specific' && key === 'other') return true;
      return false;
    });

    const totalQuestions = matching.length;
    const correct = matching.filter(l => l.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

    let status = 'A iniciar';
    let textColor = 'text-zinc-500';

    if (totalQuestions > 0) {
      if (accuracy >= 80) {
        status = 'Excelente';
        textColor = 'text-emerald-700';
      } else if (accuracy >= 60) {
        status = 'Bom Desempenho';
        textColor = 'text-blue-700';
      } else {
        status = 'Precisa de atenção';
        textColor = 'text-amber-700';
      }
    }

    return { totalQuestions, correct, accuracy, status, textColor };
  };

  const specificStats = getRadarStats('specific');
  const portuguesStats = getRadarStats('portugues');
  const pedagogiaStats = getRadarStats('pedagogia');
  const adminStats = getRadarStats('admin');

  const isTargetLP = targetSubject.toLowerCase().includes('portugues');

  // Radar de Disciplinas Data (100% Real User Stats)
  const disciplinesRadar = [
    {
      key: 'specific',
      name: isTargetLP ? 'Língua Portuguesa (Específica)' : targetSubject,
      icon: getSubjectIcon(targetSubject),
      accuracy: specificStats.accuracy,
      totalQuestions: specificStats.totalQuestions,
      correctCount: specificStats.correct,
      color: 'bg-emerald-500',
      textColor: specificStats.textColor,
      bgColor: 'bg-emerald-50 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600',
      status: specificStats.status
    },
    {
      key: 'portugues',
      name: isTargetLP ? 'Língua Portuguesa (Geral)' : 'Língua Portuguesa',
      icon: '📖',
      accuracy: portuguesStats.accuracy,
      totalQuestions: portuguesStats.totalQuestions,
      correctCount: portuguesStats.correct,
      color: 'bg-blue-500',
      textColor: portuguesStats.textColor,
      bgColor: 'bg-blue-50 border-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
      status: portuguesStats.status
    },
    {
      key: 'pedagogia',
      name: 'Temas Educacionais & Didática',
      icon: '📚',
      accuracy: pedagogiaStats.accuracy,
      totalQuestions: pedagogiaStats.totalQuestions,
      correctCount: pedagogiaStats.correct,
      color: 'bg-purple-500',
      textColor: pedagogiaStats.textColor,
      bgColor: 'bg-purple-50 border-purple-200',
      gradient: 'from-purple-500 to-pink-600',
      status: pedagogiaStats.status
    },
    {
      key: 'admin',
      name: 'Administração Pública',
      icon: '🏛',
      accuracy: adminStats.accuracy,
      totalQuestions: adminStats.totalQuestions,
      correctCount: adminStats.correct,
      color: 'bg-amber-500',
      textColor: adminStats.textColor,
      bgColor: 'bg-amber-50 border-amber-200',
      gradient: 'from-amber-500 to-orange-600',
      status: adminStats.status
    }
  ];

  // Gamified Badges Data
  const conquistasBadges = [
    {
      id: 'streak_7',
      title: 'Foco Inabalável',
      rarity: 'Épico',
      rarityColor: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Flame,
      iconColor: 'text-amber-500',
      bgGradient: 'from-amber-500/10 to-orange-500/10 border-amber-200',
      progress: 7,
      total: 7,
      unlocked: true,
      description: 'Manteve a sequência ativa por 7 dias seguidos de estudo intenso.'
    },
    {
      id: 'questions_100',
      title: 'Centurião FUNECE',
      rarity: 'Lendário',
      rarityColor: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: Trophy,
      iconColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-200',
      progress: 148,
      total: 100,
      unlocked: true,
      description: 'Superou a marca de 100 questões resolvidas no banco da FUNECE.'
    },
    {
      id: 'accuracy_80',
      title: 'Precisão Cirúrgica',
      rarity: 'Raro',
      rarityColor: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Target,
      iconColor: 'text-blue-500',
      bgGradient: 'from-blue-500/10 to-indigo-500/10 border-blue-200',
      progress: 78,
      total: 80,
      unlocked: false,
      description: 'Alcance 80% de aproveitamento geral em simulados com mais de 50 questões.'
    },
    {
      id: 'edital_master',
      title: 'Mestre do Edital',
      rarity: 'Mítico',
      rarityColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      icon: Crown,
      iconColor: 'text-purple-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10 border-purple-200',
      progress: 6,
      total: 25,
      unlocked: false,
      description: 'Conclua todos os tópicos das 5 disciplinas do edital verticalizado.'
    }
  ];

  return (
    <div className="space-y-8 pb-12 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Onboarding Registration Modal if needed */}
      {(showOnboardingModal || (profile && profile.onboardingCompleted === false)) && (
        <OnboardingModal
          user={user}
          profile={profile}
          onComplete={() => setShowOnboardingModal(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* 1. FIRST FOLD: CENTRO DE COMANDO HERO CARD (BOAS-VINDAS COMPACTAS E ELEGANTES) */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/80 text-emerald-950 p-4 sm:p-5 shadow-sm border border-emerald-200/90 overflow-hidden"
      >
        {/* Subtle Glows and Mesh Highlights */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-emerald-200 p-0.5 shadow-2xs shrink-0 flex items-center justify-center text-emerald-800 font-extrabold text-lg">
              <div className="w-full h-full bg-emerald-100/80 rounded-[10px] flex items-center justify-center text-emerald-900 font-black">
                {userName.replace('Prof. ', '').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[11px] font-bold text-emerald-800/80 uppercase tracking-wider flex items-center gap-1.5">
                <span>{greeting}</span>
                <Sparkles size={12} className="text-amber-500 shrink-0" />
              </p>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-emerald-950 truncate">
                {userName}
              </h1>
              <p className="text-xs text-emerald-800/80 font-medium line-clamp-1 sm:line-clamp-none">
                Seja bem-vindo(a) ao seu portal de estudos e preparação para o concurso SEDUC CE 2026.
              </p>
            </div>
          </div>

          {((user?.email || profile?.email || '').toLowerCase().trim() === 'gerlianemagalhaes79@gmail.com') && (
            <button
              onClick={() => onOpenProfile && onOpenProfile('add_user')}
              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0 self-start sm:self-center"
            >
              <Plus size={14} />
              <span>Cadastrar Professor</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. PAINEL DA APROVAÇÃO (5 CARDS LADO A LADO NO CELULAR E DESKTOP)        */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="text-emerald-600" size={22} />
              <span>Painel da Aprovação</span>
            </h2>
          </div>
        </div>

        {/* Responsive Grid: 2 columns on mobile, 4 on sm/lg */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Dias para a Prova (Contagem Regressiva FUNECE) */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 sm:space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Calendar size={20} className="sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200">
                FUNECE
              </span>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Dias p/ Prova</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{daysRemaining}</h3>
                <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">dias</span>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 truncate">
              Contagem FUNECE 2026
            </p>
          </motion.div>

          {/* Card 2: Aproveitamento Geral */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 sm:space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Target size={20} className="sm:w-5 sm:h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200">
                <TrendingUp size={12} />
                {accuracyPct}%
              </span>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Aproveitamento</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{accuracyPct}%</h3>
                <span className="text-[10px] sm:text-xs text-zinc-500">taxa</span>
              </div>
            </div>

            {/* Micro Sparkline Chart */}
            <div className="h-5 sm:h-6 w-full flex items-end gap-1 pt-1">
              {[0, 0, 0, 0, 0, 0, accuracyPct].map((val, idx) => (
                <div key={idx} className="flex-1 bg-zinc-100 rounded-t-sm h-full flex items-end overflow-hidden">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${val}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                    className={`w-full rounded-t-sm ${idx === 6 ? 'bg-emerald-600' : 'bg-emerald-300'}`}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Questões Resolvidas */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 sm:space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen size={20} className="sm:w-5 sm:h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-200">
                <Zap size={12} />
                {totalQuestionsDone}
              </span>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Questões Feitas</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{totalQuestionsDone}</h3>
                <span className="text-[10px] sm:text-xs text-zinc-500">feitas</span>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-500 truncate">
              {correctAnswersCount} corretas
            </p>
          </motion.div>

          {/* Card 4: Edital Concluído */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-2 sm:space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 sm:p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Layers size={20} className="sm:w-5 sm:h-5" />
              </div>
              <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-purple-700 bg-purple-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-purple-200">
                <CheckCircle2 size={12} />
                {completedTopicsCount} blocos
              </span>
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">Edital Coberto</p>
              <div className="flex items-baseline gap-1.5 mt-0.5 sm:mt-1">
                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{editalPct}%</h3>
                <span className="text-[10px] sm:text-xs text-zinc-500">concluído</span>
              </div>
            </div>

            <div className="pt-1">
              <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${editalPct}%` }} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RADAR DE DISCIPLINAS (LAYOUT COMPACTO EM GRID)                         */}
      {/* ========================================================================= */}
      <section className="bg-white border border-zinc-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <h2 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Compass className="text-teal-600" size={20} />
            <span>Radar de Disciplinas</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {disciplinesRadar.map((disc, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedDisciplineModal(disc.name)}
              className="p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-sm transition-all cursor-pointer bg-zinc-50/50 hover:bg-white space-y-2 group"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg p-1.5 bg-white rounded-lg shadow-2xs border border-zinc-100 group-hover:scale-105 transition-transform shrink-0">
                    {disc.icon}
                  </span>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-zinc-900 text-xs sm:text-sm group-hover:text-emerald-700 transition-colors truncate">
                      {disc.name}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">
                      {disc.totalQuestions} questões • <span className={disc.textColor}>{disc.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className={`text-sm font-black ${disc.textColor}`}>
                    {disc.accuracy}%
                  </span>
                  <ChevronRight size={14} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div className="w-full h-2 bg-zinc-200/80 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${disc.accuracy}%` }}
                  transition={{ duration: 0.8, delay: idx * 0.08 }}
                  className={`h-full rounded-full bg-gradient-to-r ${disc.gradient} shadow-2xs`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CONQUISTAS & BADGES (GAMIFICAÇÃO DUOLINGO / GAMING TIER)               */}
      {/* ========================================================================= */}
      <section className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Trophy className="text-amber-500" size={22} />
              <span>Conquistas & Selos de Progresso</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Desbloqueie conquistas exclusivas mantendo a rotina de estudos ativa.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            2 / 4 Desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {conquistasBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.id}
                whileHover={{ y: -4, scale: 1.02 }}
                className={`p-5 rounded-2xl border space-y-3 relative overflow-hidden transition-all shadow-sm ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.bgGradient} shadow-md` 
                    : 'bg-zinc-50/80 border-zinc-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-white shadow-md border border-zinc-100 ${badge.iconColor}`}>
                    <Icon size={24} />
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${badge.rarityColor}`}>
                    {badge.rarity}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-zinc-900 text-sm">{badge.title}</h4>
                  <p className="text-xs text-zinc-600 mt-1 line-clamp-2">{badge.description}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>Evolução</span>
                    <span>{badge.progress} / {badge.total}</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${badge.unlocked ? 'bg-emerald-600' : 'bg-zinc-400'}`}
                      style={{ width: `${Math.min(100, (badge.progress / badge.total) * 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL DE DISCIPLINA SELECIONADA                                           */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedDisciplineModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 border border-zinc-200 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 font-black text-2xl">
                    📚
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900">{selectedDisciplineModal}</h3>
                    <p className="text-xs text-zinc-500">Desempenho e plano de estudos detalhado</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDisciplineModal(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const modalDisc = disciplinesRadar.find(d => d.name === selectedDisciplineModal);
                return (
                  <div className="space-y-4 text-xs sm:text-sm text-zinc-700">
                    <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                      <p className="font-bold text-emerald-950 flex items-center justify-between">
                        <span>Desempenho Real em Exercícios:</span>
                        <span className="text-emerald-700 font-extrabold">{modalDisc?.status || 'A iniciar'}</span>
                      </p>
                      {modalDisc && modalDisc.totalQuestions > 0 ? (
                        <p className="text-emerald-900 leading-relaxed">
                          Você respondeu <strong>{modalDisc.totalQuestions} questão(ões)</strong> com{' '}
                          <strong>{modalDisc.correctCount} acerto(s)</strong> ({modalDisc.accuracy}% de aproveitamento).
                        </p>
                      ) : (
                        <p className="text-emerald-900 leading-relaxed">
                          Nenhuma questão foi resolvida nesta disciplina ainda. Clique em 'Praticar Questões' para iniciar simulados e alimentar suas estatísticas reais.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setSelectedDisciplineModal(null);
                          setActiveTab('simulados');
                        }}
                        className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-center cursor-pointer shadow-md"
                      >
                        Praticar Questões
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDisciplineModal(null);
                          setActiveTab('edital');
                        }}
                        className="p-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl transition text-center cursor-pointer"
                      >
                        Ver no Edital
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
