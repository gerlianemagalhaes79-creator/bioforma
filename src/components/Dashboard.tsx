import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../firebase';
import { UserProfile } from '../types';
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
    window.addEventListener('storage', handleProgressUpdate);
    return () => {
      window.removeEventListener('studyProgressUpdated', handleProgressUpdate);
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

  // Radar de Disciplinas Data (Using real user stats if available or cleanly structured)
  const disciplinesRadar = [
    {
      name: targetSubject,
      icon: '🧬',
      accuracy: totalQuestionsDone > 0 ? accuracyPct : 0,
      totalQuestions: Math.round(totalQuestionsDone * 0.5),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50 border-emerald-200',
      gradient: 'from-emerald-500 to-teal-600',
      status: totalQuestionsDone > 0 ? (accuracyPct >= 70 ? 'Bom Desempenho' : 'Em evolução') : 'A Iniciar'
    },
    {
      name: 'Língua Portuguesa',
      icon: '📖',
      accuracy: totalQuestionsDone > 0 ? Math.max(0, accuracyPct - 5) : 0,
      totalQuestions: Math.round(totalQuestionsDone * 0.25),
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50 border-blue-200',
      gradient: 'from-blue-500 to-indigo-600',
      status: totalQuestionsDone > 0 ? 'Acompanhamento ativo' : 'A Iniciar'
    },
    {
      name: 'Temas Educacionais & Didática',
      icon: '📚',
      accuracy: totalQuestionsDone > 0 ? Math.max(0, accuracyPct - 10) : 0,
      totalQuestions: Math.round(totalQuestionsDone * 0.15),
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50 border-purple-200',
      gradient: 'from-purple-500 to-pink-600',
      status: totalQuestionsDone > 0 ? 'Estável' : 'A Iniciar'
    },
    {
      name: 'Administração Pública',
      icon: '🏛',
      accuracy: totalQuestionsDone > 0 ? Math.max(0, accuracyPct - 15) : 0,
      totalQuestions: Math.round(totalQuestionsDone * 0.1),
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50 border-amber-200',
      gradient: 'from-amber-500 to-orange-600',
      status: totalQuestionsDone > 0 ? 'Atenção (Revisar)' : 'A Iniciar'
    }
  ];

  // Mapa do Edital Nodes Data
  const editalMapBlocks = [
    { id: 1, title: 'Citologia & Estrutura Celular', subject: targetSubject, status: 'completed', pct: 100 },
    { id: 2, title: 'Membrana Plasmática & Transporte', subject: targetSubject, status: 'in_progress', pct: 60 },
    { id: 3, title: 'Organelas & Bioenergética (Mitocôndrias)', subject: targetSubject, status: 'not_started', pct: 0 },
    { id: 4, title: 'LDB (Lei 9.394/96) e Diretrizes', subject: 'Temas Educacionais', status: 'completed', pct: 100 },
    { id: 5, title: 'Crase & Regência Verbal FUNECE', subject: 'Língua Portuguesa', status: 'in_progress', pct: 45 },
    { id: 6, title: 'Estatuto do Magistério do Ceará', subject: 'Administração Pública', status: 'not_started', pct: 0 }
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
      {/* 1. FIRST FOLD: CENTRO DE COMANDO HERO CARD (ELEGANT LIGHT MINT HERO)     */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/80 text-emerald-950 p-6 sm:p-8 lg:p-9 shadow-xl shadow-emerald-950/5 border border-emerald-200/90 overflow-hidden"
      >
        {/* Subtle Glows and Mesh Highlights */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6 sm:space-y-7">
          {/* Top Bar inside Hero */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/70 pb-5 sm:pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-200 p-0.5 shadow-sm shrink-0 flex items-center justify-center text-emerald-800 font-extrabold text-xl">
                <div className="w-full h-full bg-emerald-100/80 rounded-[14px] flex items-center justify-center text-emerald-900 font-black">
                  {userName.replace('Prof. ', '').charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-emerald-800/70 uppercase tracking-widest flex items-center gap-1.5">
                  <span>{greeting}</span>
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-950">
                  {userName}
                </h1>
                <p className="text-xs text-emerald-800/80 font-medium pt-0.5">
                  Concurso SEDUC Ceará 2026 • <span className="text-emerald-900 font-bold">FUNECE / CEV-UECE</span>
                </p>
              </div>
            </div>

            {/* Countdown Badge & Admin Action */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="px-3.5 py-2 bg-white/90 border border-emerald-200/90 rounded-xl flex items-center gap-2 shadow-xs">
                <Calendar size={15} className="text-emerald-700" />
                <span className="text-xs text-emerald-950 font-medium">
                  Faltam <strong className="text-emerald-900 font-black text-sm">{daysRemaining}</strong> dias para a prova FUNECE
                </span>
              </div>

              {((user?.email || profile?.email || '').toLowerCase().trim() === 'gerlianemagalhaes79@gmail.com') && (
                <button
                  onClick={() => onOpenProfile && onOpenProfile('add_user')}
                  className="px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} />
                  <span>Cadastrar Professor</span>
                </button>
              )}
            </div>
          </div>

          {/* "HOJE VOCÊ ESTUDARÁ" - BREADCRUMB HIERARCHICAL TRAIL */}
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase tracking-wider">
                <Target size={15} className="text-emerald-700 shrink-0" />
                <span>Hoje você estudará — Trilha Programática do Cronograma</span>
              </div>
              {todayScheduleDay && (
                <span className="text-[11px] font-semibold text-emerald-900 bg-white/90 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0 flex items-center gap-1.5 font-mono shadow-xs">
                  <Calendar size={12} className="text-emerald-700" />
                  Dia {todayScheduleDay.dayNumber} • {todayScheduleDay.topics.length} Sessões
                </span>
              )}
            </div>

            {/* Breadcrumb List of Study Sessions */}
            <div className="space-y-2.5">
              {todayScheduleDay?.topics.map((item, idx) => {
                const allDone = item.subtopicNames.every((_, subIdx) => completedTopicIds[`${item.id}_sub_${subIdx}`]);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                      allDone
                        ? 'bg-emerald-100/80 border-emerald-300 text-emerald-950'
                        : 'bg-white/85 border-emerald-200/90 text-emerald-950 hover:border-emerald-300 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      {/* Breadcrumb Path Hierarchy Header */}
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800/90 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px] uppercase border border-emerald-200 shrink-0">
                          Sessão 0{idx + 1}
                        </span>
                        <ChevronRight size={13} className="text-emerald-400 shrink-0" />
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${
                            item.reviewType?.includes('Ebbinghaus')
                              ? 'bg-amber-100 text-amber-950 border-amber-300/80'
                              : 'bg-emerald-100 text-emerald-950 border-emerald-300/80'
                          }`}
                        >
                          {item.reviewType || item.category}
                        </span>
                        <ChevronRight size={13} className="text-emerald-400 shrink-0" />
                        <span className="text-emerald-950 font-extrabold text-xs">{item.parentTopicName}</span>
                      </div>

                      {allDone ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          <CheckCircle2 size={13} /> Concluído
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-800 font-medium">
                          Meta: <strong className="text-emerald-900 font-bold">{item.questionsGoal} questões</strong>
                        </span>
                      )}
                    </div>

                    {/* Subtopic Breadcrumb Chain */}
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-medium pl-1 overflow-x-auto py-0.5 scrollbar-none">
                      <span className="text-emerald-700/80 text-[11px] font-mono shrink-0">Conteúdo:</span>
                      {item.subtopicNames.map((subName, subIdx) => (
                        <React.Fragment key={subIdx}>
                          {subIdx > 0 && <ChevronRight size={12} className="text-emerald-400 shrink-0" />}
                          <span className={`px-2 py-1 rounded bg-emerald-50/90 border text-[11px] whitespace-nowrap ${
                            completedTopicIds[`${item.id}_sub_${subIdx}`]
                              ? 'border-emerald-300 text-emerald-900 bg-emerald-100/90 line-through opacity-80'
                              : 'border-emerald-200/90 text-emerald-950 shadow-2xs'
                          }`}>
                            {subName}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Progress Bar + High Contrast CTA Button */}
          <div className="pt-2 sm:pt-3 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-t border-emerald-200/70">
            {/* Global Edital Progress Bar */}
            <div className="space-y-2 flex-1 max-w-xl">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={15} className="text-emerald-700" />
                  <span>Progresso do Edital Verticalizado SEDUC CE</span>
                </span>
                <span className="text-emerald-900 font-bold font-mono text-xs">{editalPct}% concluído</span>
              </div>

              <div className="w-full h-2.5 bg-white/90 rounded-full border border-emerald-200 p-0.5 overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${editalPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-emerald-600 rounded-full"
                />
              </div>
            </div>

            {/* High-Contrast CTA Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('cronograma')}
              className="w-full lg:w-auto px-7 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-800/20 transition-all duration-200 flex items-center justify-center gap-3 group cursor-pointer shrink-0"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-950/60 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                <Play size={13} className="fill-white translate-x-0.5" />
              </div>
              <span>Continuar Estudo de Hoje</span>
              <ArrowRight size={18} className="text-emerald-100 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 2. PAINEL DA APROVAÇÃO (4 CARDS GRANDES COM METRICAS REAIS)              */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="text-emerald-600" size={22} />
              <span>Painel da Aprovação</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Métricas reais consolidadas do seu ritmo de aprendizado para a SEDUC CE 2026.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full font-bold text-xs uppercase tracking-wider">
            Atualizado em Tempo Real
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Aproveitamento Geral */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Target size={22} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <TrendingUp size={13} />
                {totalQuestionsDone > 0 ? `${accuracyPct}% taxa` : 'A Iniciar'}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Aproveitamento Geral</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{accuracyPct}%</h3>
                <span className="text-xs text-zinc-500">nos simulados</span>
              </div>
            </div>

            {/* Micro Sparkline Chart */}
            <div className="h-6 w-full flex items-end gap-1 pt-1">
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

          {/* Card 2: Questões Resolvidas */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <BookOpen size={22} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <Zap size={13} />
                {totalQuestionsDone > 0 ? `${totalQuestionsDone} feitas` : '0 hoje'}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Questões Resolvidas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{totalQuestionsDone}</h3>
                <span className="text-xs text-zinc-500">questões FUNECE</span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] font-bold text-zinc-500">
                {totalQuestionsDone > 0 ? `${correctAnswersCount} respostas corretas` : 'Nenhuma questão resolvida ainda'}
              </p>
            </div>
          </motion.div>

          {/* Card 3: Edital Concluído */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Layers size={22} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                <CheckCircle2 size={13} />
                {completedTopicsCount} de {totalEditalBlocks} blocos
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Edital Concluído</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{editalPct}%</h3>
                <span className="text-xs text-zinc-500">do edital cobrindo {targetSubject}</span>
              </div>
            </div>

            {/* Micro Progress Bar */}
            <div className="pt-2">
              <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${editalPct}%` }} />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Sequência Ativa (Sem Duplicação da Contagem Regressiva) */}
          <motion.div
            whileHover={{ y: -3 }}
            className="bg-white border border-zinc-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 space-y-3 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Flame size={22} />
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <Flame size={13} className="text-amber-500 animate-bounce" />
                Ofensiva de Estudos
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sequência de Estudos</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{streakDays}</h3>
                <span className="text-xs text-zinc-500">dias seguidos</span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold text-zinc-600">
                {streakDays > 0 ? 'Mantenha a consistência hoje!' : 'Inicie sua sequência hoje!'}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RADAR DE DISCIPLINAS (GRÁFICOS HORIZONTAIS COM CORES PRÓPRIAS)        */}
      {/* ========================================================================= */}
      <section className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Compass className="text-teal-600" size={22} />
              <span>Radar de Disciplinas</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Acompanhamento de rendimento por área do conhecimento do edital SEDUC CE.
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Clique na disciplina para ver detalhes de estudo
          </span>
        </div>

        <div className="space-y-4">
          {disciplinesRadar.map((disc, idx) => (
            <motion.div
              key={idx}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedDisciplineModal(disc.name)}
              className="p-4 rounded-2xl border border-zinc-100 hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer bg-zinc-50/50 hover:bg-white space-y-2 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 bg-white rounded-xl shadow-xs border border-zinc-100 group-hover:scale-110 transition-transform">
                    {disc.icon}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-zinc-900 text-sm sm:text-base group-hover:text-emerald-700 transition-colors">
                      {disc.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      {disc.totalQuestions} questões resolvidas • <span className={disc.textColor}>{disc.status}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className={`text-base font-black ${disc.textColor}`}>
                    {disc.accuracy}%
                  </span>
                  <ChevronRight size={18} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Horizontal Progress Bar with unique gradient color */}
              <div className="w-full h-3 bg-zinc-200/80 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${disc.accuracy}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  className={`h-full rounded-full bg-gradient-to-r ${disc.gradient} shadow-xs`}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAPA DO EDITAL & LINHA DO TEMPO (GRID DE 2 COLUNAS)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* MAPA DO EDITAL (7 COLUNAS) */}
        <section className="lg:col-span-7 bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <MapPinIcon />
                <span>Mapa do Edital</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Progresso visual por bloco de conteúdo
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('edital')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              Ver Tudo <ArrowRight size={14} />
            </button>
          </div>

          {/* Status Legend */}
          <div className="flex items-center gap-4 text-xs font-bold flex-wrap">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              ✔ Concluído
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              ⚡ Em andamento
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full border border-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400" />
              🔒 Não iniciado
            </span>
          </div>

          {/* Grid of Edital Map Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {editalMapBlocks.map((item) => {
              const isCompleted = item.status === 'completed';
              const isInProgress = item.status === 'in_progress';

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveTab('edital')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                    isCompleted 
                      ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950' 
                      : isInProgress 
                        ? 'bg-sky-50/60 border-sky-300 text-sky-950' 
                        : 'bg-zinc-50/80 border-zinc-200 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {item.subject}
                    </span>
                    {isCompleted && <CheckCircle2 size={16} className="text-emerald-600" />}
                    {isInProgress && <Zap size={16} className="text-sky-600 animate-pulse" />}
                    {!isCompleted && !isInProgress && <Lock size={16} className="text-zinc-400" />}
                  </div>

                  <h4 className="font-extrabold text-xs sm:text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h4>

                  <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${isCompleted ? 'bg-emerald-600' : isInProgress ? 'bg-sky-600' : 'bg-zinc-300'}`} 
                      style={{ width: `${item.pct}%` }} 
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* LINHA DO TEMPO (5 COLUNAS) */}
        <section className="lg:col-span-5 bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <Clock className="text-indigo-600" size={22} />
              <span>Linha do Tempo</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Acompanhe sua evolução diária contínua.
            </p>
          </div>

          {/* Timeline Items */}
          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-zinc-200">
            {/* Ontem */}
            <div className="relative pl-8 space-y-1">
              <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white text-[8px]">
                ✔
              </div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ontem</span>
              <h4 className="font-bold text-zinc-900 text-sm">✔ Citologia & Estrutura Celular</h4>
              <p className="text-xs text-emerald-700 font-medium">Concluído • 85% de acertos nas questões</p>
            </div>

            {/* Hoje */}
            <div className="relative pl-8 space-y-1">
              <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white shadow-md animate-pulse flex items-center justify-center text-emerald-950 font-black text-[10px]">
                ⚡
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Hoje</span>
              <h4 className="font-extrabold text-zinc-900 text-sm">⚡ Membrana Plasmática & Transporte</h4>
              <p className="text-xs text-amber-700 font-medium">Em andamento • Meta de 50 questões hoje</p>
            </div>

            {/* Amanhã */}
            <div className="relative pl-8 space-y-1">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-zinc-300 border-2 border-white" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Amanhã</span>
              <h4 className="font-bold text-zinc-700 text-sm">🎯 Ecologia & Ciclos Biogeoquímicos</h4>
              <p className="text-xs text-zinc-500">Agendado para amanhã de manhã</p>
            </div>

            {/* Depois */}
            <div className="relative pl-8 space-y-1">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-zinc-200 border-2 border-white" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Em breve</span>
              <h4 className="font-bold text-zinc-600 text-sm">📚 Genética Molecular & Mendel</h4>
              <p className="text-xs text-zinc-400">Próximo bloco do cronograma</p>
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 5. DIAGNÓSTICO INTELIGENTE (IA DE DESEMPENHO)                           */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-zinc-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
                <span>Diagnóstico Inteligente IA</span>
                <Sparkles size={18} className="text-amber-400" />
              </h2>
              <p className="text-xs text-indigo-200/80 font-medium">
                Análise preditiva automatizada para evitar retenção na curva de esquecimento.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('tutor')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/30 shrink-0"
          >
            <Sparkles size={14} />
            <span>Consultar Mentor IA</span>
          </button>
        </div>

        {/* Diagnostic Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          <div className="p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <AlertTriangle size={15} />
              <span>Desempenho Crítico</span>
            </div>
            <p className="text-sm font-bold text-white">
              Seu pior desempenho atualmente está em <strong className="text-amber-300">Ecologia (42%)</strong>.
            </p>
            <p className="text-xs text-indigo-200/80">
              Recomendamos focar um treino adaptativo de 15 questões nesta disciplina.
            </p>
          </div>

          <div className="p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
              <RotateCcw size={15} />
              <span>Curva de Ebbinghaus</span>
            </div>
            <p className="text-sm font-bold text-white">
              Sua curva de esquecimento indica revisão urgente em <strong className="text-purple-300">LDB (Lei 9.394/96)</strong>.
            </p>
            <p className="text-xs text-indigo-200/80">
              Você possui risco alto de esquecer o conteúdo em 5 dias se não revisar hoje.
            </p>
          </div>

          <div className="p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
              <TrendingUp size={15} />
              <span>Evolução Positiva</span>
            </div>
            <p className="text-sm font-bold text-white">
              <strong className="text-emerald-300">Português aumentou +18%</strong> de acertos esta semana.
            </p>
            <p className="text-xs text-indigo-200/80">
              Biologia teve leve oscilação de -7% em questões de nível avançado.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. MISSÃO DE HOJE (QUEST CHECKLIST COM BARRA ENORME)                    */}
      {/* ========================================================================= */}
      <section className="bg-white border border-zinc-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <CheckSquare className="text-emerald-600" size={22} />
              <span>Missão de Hoje</span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Cumpra as metas diárias para acumular experiência e garantir ritmo de aprovação.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {completedTasksCount} de {dailyTasks.length} concluídas
          </span>
        </div>

        {/* Task List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dailyTasks.map((task) => (
            <motion.div
              key={task.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleTask(task.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                task.done 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                  : 'bg-zinc-50/80 border-zinc-200 text-zinc-700 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                  task.done ? 'bg-emerald-600 text-white' : 'border-2 border-zinc-300 bg-white'
                }`}>
                  {task.done && <Check size={14} strokeWidth={3} />}
                </div>
                <span className={`text-xs sm:text-sm font-bold ${task.done ? 'line-through opacity-75' : ''}`}>
                  {task.title}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-zinc-200 shadow-2xs">
                {task.tag}
              </span>
            </motion.div>
          ))}
        </div>

        {/* HUGE MISSION PROGRESS BAR AT BOTTOM */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-sm sm:text-base font-black">
            <span className="uppercase tracking-wide flex items-center gap-2">
              <Flame className="text-amber-400" size={20} />
              <span>Missão do Dia</span>
            </span>
            <span className="text-amber-300 text-xl font-black">{missionProgressPct}%</span>
          </div>

          <div className="w-full bg-emerald-950 h-4 rounded-full p-0.5 overflow-hidden border border-emerald-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${missionProgressPct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 rounded-full shadow-lg"
            />
          </div>
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

              <div className="space-y-3 text-xs sm:text-sm text-zinc-700">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <p className="font-bold text-emerald-950">Status do Conteúdo:</p>
                  <p className="text-emerald-800">Você já cobriu 60% do edital desta disciplina com excelente taxa de retenção.</p>
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// MapPinIcon component for Mapa do Edital
function MapPinIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
