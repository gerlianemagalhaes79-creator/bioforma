import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { UserProfile } from '../types';
import OnboardingModal from './OnboardingModal';
import CronogramaModal from './CronogramaModal';
import { 
  Target, 
  CheckCircle2, 
  Clock, 
  Award, 
  ArrowRight, 
  BrainCircuit, 
  Sparkles, 
  BookOpen, 
  PenTool, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Calendar,
  Printer,
  GraduationCap,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
  onOpenProfile?: () => void;
}

export default function Dashboard({ user, profile, setActiveTab, onOpenProfile }: DashboardProps) {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Automatically show onboarding modal if user profile is loaded but onboarding is not completed
  useEffect(() => {
    if (profile && profile.onboardingCompleted === false) {
      setShowOnboardingModal(true);
    }
  }, [profile]);

  const userName = profile?.name || user.displayName || 'Professor(a)';
  const targetSubject = profile?.targetSubject || 'Língua Portuguesa';
  
  // Calculate exam countdown based on profile.examDate or default
  const examDateStr = profile?.examDate || '2026-10-18';
  const [daysRemaining, setDaysRemaining] = useState(89);

  useEffect(() => {
    try {
      const examDate = new Date(`${examDateStr}T08:00:00`);
      const now = new Date();
      const diff = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      setDaysRemaining(diff);
    } catch (_) {
      setDaysRemaining(89);
    }
  }, [examDateStr]);

  const readinessScore = Math.min(96, Math.max(45, (profile?.completedTopicsCount || 6) * 4 + 35));

  return (
    <div className="space-y-5">
      {/* Onboarding Registration Modal if needed */}
      {(showOnboardingModal || (profile && profile.onboardingCompleted === false)) && (
        <OnboardingModal
          user={user}
          profile={profile}
          onComplete={() => setShowOnboardingModal(false)}
        />
      )}

      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-4 shadow-md border border-emerald-800/60 relative overflow-hidden space-y-2"
      >
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
              Olá, Prof. {userName}!
            </h2>
          </div>

          <div className="px-3 py-1 bg-emerald-800/80 border border-emerald-700/60 rounded-xl text-center shrink-0 flex items-center gap-1.5 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-300 uppercase">Faltam</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 leading-none">{daysRemaining}</span>
            <span className="text-[10px] font-bold text-emerald-200 uppercase">dias para a prova</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs relative z-10 text-emerald-200/90 pt-0.5">
          <p className="truncate text-xs">
            Alvo: <span className="font-extrabold text-amber-300">{targetSubject}</span>
            {profile?.degree && <span className="text-xs text-emerald-200/80 block sm:inline sm:ml-1 font-medium">({profile.degree})</span>}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs text-center">
          <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Edital Visto</p>
          <p className="text-xl font-black text-emerald-800 mt-0.5">
            {profile?.completedTopicsCount || 6}<span className="text-xs font-semibold text-zinc-400">/23</span>
          </p>
          <p className="text-[9px] font-bold text-emerald-600 mt-1">Tópicos</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs text-center">
          <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Simulados</p>
          <p className="text-xl font-black text-teal-800 mt-0.5">
            {profile?.totalQuestionsDone || 18}
          </p>
          <p className="text-[9px] font-bold text-teal-600 mt-1">Questões FUNECE</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-emerald-100 shadow-xs text-center">
          <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">Acertos</p>
          <p className="text-xl font-black text-amber-600 mt-0.5">
            {Math.round(((profile?.correctAnswersCount || 14) / Math.max(1, profile?.totalQuestionsDone || 18)) * 100)}%
          </p>
          <p className="text-[9px] font-bold text-amber-600 mt-1">Aproveitamento</p>
        </div>
      </div>

      {/* Today's Study Roadmap */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Target size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-zinc-900 text-sm">Trilha de Estudos de Hoje</h3>
              <p className="text-[11px] text-zinc-500">3 prioridades sugeridas pela IA para a Banca FUNECE</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('edital')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
          >
            Ver Edital Verticalizado <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">Estatuto do Magistério do CE (Lei 10.884/84)</p>
                <p className="text-[10px] text-emerald-700 font-medium">Legislação do Ceará • Questão Certa FUNECE</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('tutor')}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-extrabold rounded-xl border-0 cursor-pointer shadow-xs"
            >
              Estudar
            </button>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                2
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800">Sintaxe de Regência e Crase na FUNECE</p>
                <p className="text-[10px] text-zinc-500 font-medium">Língua Portuguesa FUNECE • Treino Prático</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('simulados')}
              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white text-[10px] font-extrabold rounded-xl border-0 cursor-pointer shadow-xs"
            >
              Resolver
            </button>
          </div>

          <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                3
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-800">Prática Pedagógica & Avaliação Formativa</p>
                <p className="text-[10px] text-zinc-500 font-medium">Didática Geral • Saviani e Luckesi</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('redacao')}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-extrabold rounded-xl border-0 cursor-pointer shadow-xs"
            >
              Escrever
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setActiveTab('simulados')}
          className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl text-left shadow-md hover:shadow-lg transition-all border-0 cursor-pointer flex flex-col justify-between h-32 group"
        >
          <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-200">Simulados FUNECE</p>
            <p className="text-sm font-black text-white mt-0.5">Banco de Questões</p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('tutor')}
          className="p-4 bg-gradient-to-br from-zinc-900 to-emerald-950 text-white rounded-3xl text-left shadow-md hover:shadow-lg transition-all border-0 cursor-pointer flex flex-col justify-between h-32 group"
        >
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BrainCircuit size={20} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Inteligência FUNECE</p>
            <p className="text-sm font-black text-white mt-0.5">Tutor Especialista SEDUC</p>
          </div>
        </button>
      </div>

      {/* Strategic Advice & Official 80-Question Exam Structure Card */}
      <div className="bg-white border border-emerald-200/90 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-emerald-600 to-teal-800 text-white rounded-xl shadow-xs">
              <Award size={18} />
            </div>
            <div>
              <h4 className="font-extrabold text-emerald-950 text-sm">Estrutura da Prova SEDUC CE (80 Questões)</h4>
              <p className="text-xs text-zinc-500">Distribuição oficial de peso por disciplina na banca FUNECE</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-black text-[10px] uppercase tracking-wider">
            Prioridade Estratégica
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Conhecimentos Específicos - Prioridade Máxima */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                50q
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-black text-emerald-950 text-xs truncate">Conhecimentos Específicos</p>
                  <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 text-[9px] font-black uppercase rounded">
                    Foco 62,5% da Prova
                  </span>
                </div>
                <p className="text-[10px] text-emerald-800 font-medium">Conteúdo da sua licenciatura ({targetSubject})</p>
              </div>
            </div>
            <span className="font-black text-emerald-900 text-sm shrink-0">50 Questões</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Educação Brasileira e Pedagógicos */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-amber-950 text-[11px] truncate">Educação Brasileira e Pedagógicos</p>
                  <p className="text-[9px] text-amber-800">10% • LDB, DUA e Didática</p>
                </div>
              </div>
              <span className="font-black text-amber-900 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Língua Portuguesa */}
            <div className="p-2.5 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-teal-950 text-[11px] truncate">Língua Portuguesa</p>
                  <p className="text-[9px] text-teal-800">10% • Texto, Regência e Crase</p>
                </div>
              </div>
              <span className="font-black text-teal-900 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Dados e Indicadores Educacionais */}
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-blue-950 text-[11px] truncate">Dados e Indicadores Educacionais</p>
                  <p className="text-[9px] text-blue-800">10% • SPAECE, IDEB e Gráficos</p>
                </div>
              </div>
              <span className="font-black text-blue-900 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Administração Pública */}
            <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  6q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-purple-950 text-[11px] truncate">Administração Pública</p>
                  <p className="text-[9px] text-purple-800">7,5% • Estatuto Magistério CE</p>
                </div>
              </div>
              <span className="font-black text-purple-900 text-xs shrink-0">6 Questões</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Advice Card */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-4 flex items-start gap-3.5">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">Estratégia de Aprovação FUNECE</h4>
          <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
            Como <strong>Conhecimentos Específicos</strong> correspondem a <strong>50 das 80 questões (62,5% da prova)</strong>, seu cronograma prioriza diariamente a sua área de atuação ({targetSubject}). Não deixe de revisar os 4 blocos gerais (Português, Pedagógicos, Indicadores Educacionais SPAECE e Estatuto do Magistério do CE).
          </p>
        </div>
      </div>
    </div>
  );
}
