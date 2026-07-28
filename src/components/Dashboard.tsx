import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { UserProfile } from '../types';
import OnboardingModal from './OnboardingModal';
import IntelligenceCenter from './IntelligenceCenter';
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
  onOpenProfile?: (tab?: 'profile' | 'admin_users' | 'add_user') => void;
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
    <div className="space-y-4">
      {/* Onboarding Registration Modal if needed */}
      {(showOnboardingModal || (profile && profile.onboardingCompleted === false)) && (
        <OnboardingModal
          user={user}
          profile={profile}
          onComplete={() => setShowOnboardingModal(false)}
        />
      )}

      {/* Welcome Banner - Minimalist, Compact & Formal */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-3 sm:p-4 border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-black text-zinc-900 tracking-tight truncate">
              Olá, Prof. {userName}!
            </h2>
          </div>

          <div className="hidden sm:block text-zinc-300">•</div>

          <p className="text-xs text-zinc-600 truncate">
            <span className="text-zinc-500 font-medium">Alvo:</span>{' '}
            <strong className="text-emerald-900 font-bold">{targetSubject}</strong>
            {profile?.degree && (
              <span className="text-zinc-500 font-normal ml-1">
                ({profile.degree})
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-lg text-center flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Faltam</span>
            <span className="text-sm font-black text-emerald-950">{daysRemaining}</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">dias para a prova</span>
          </div>

          {((user?.email || profile?.email || '').toLowerCase().trim() === 'gerlianemagalhaes79@gmail.com') && (
            <button
              onClick={() => onOpenProfile && onOpenProfile('add_user')}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>+ Cadastrar Novo Professor</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Central de Aproveitamento do Candidato */}
      <IntelligenceCenter 
        user={user} 
        profile={profile} 
        setActiveTab={setActiveTab} 
      />

      {/* Strategic Advice & Official 80-Question Exam Structure Card - Minimalist & Formal */}
      <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200/60">
              <Award size={14} className="text-emerald-700" />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-xs sm:text-sm">Estrutura Oficial da Prova SEDUC CE</h4>
              <p className="text-[11px] text-zinc-500">80 Questões • Distribuição por disciplina na banca FUNECE</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200/80 uppercase tracking-wider">
            62,5% Peso Específico
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-xs">
          {/* Conhecimentos Específicos - High Priority Banner */}
          <div className="lg:col-span-5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                50q
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-bold text-zinc-900 text-xs truncate">Conhecimentos Específicos</p>
                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 text-[9px] font-bold uppercase rounded border border-emerald-200">
                    Sua Licenciatura
                  </span>
                </div>
                <p className="text-[10px] text-zinc-600 font-medium truncate">{targetSubject}</p>
              </div>
            </div>
            <span className="font-black text-emerald-950 text-xs shrink-0">50 Questões (62,5%)</span>
          </div>

          {/* General Knowledge Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Educação Brasileira e Pedagógicos */}
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-[11px] truncate">Educação Brasileira e Didática</p>
                  <p className="text-[9px] text-zinc-500">10% • LDB, DUA e Legislação</p>
                </div>
              </div>
              <span className="font-bold text-zinc-800 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Língua Portuguesa */}
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-[11px] truncate">Língua Portuguesa</p>
                  <p className="text-[9px] text-zinc-500">10% • Texto, Regência e Crase</p>
                </div>
              </div>
              <span className="font-bold text-zinc-800 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Dados e Indicadores Educacionais */}
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  8q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-[11px] truncate">Dados e Indicadores Educacionais</p>
                  <p className="text-[9px] text-zinc-500">10% • SPAECE, IDEB e Estatística</p>
                </div>
              </div>
              <span className="font-bold text-zinc-800 text-xs shrink-0">8 Questões</span>
            </div>

            {/* Administração Pública */}
            <div className="p-2.5 bg-zinc-50/80 border border-zinc-200/80 rounded-lg flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded bg-zinc-800 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  6q
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-zinc-900 text-[11px] truncate">Administração Pública</p>
                  <p className="text-[9px] text-zinc-500">7,5% • Estatuto Magistério CE</p>
                </div>
              </div>
              <span className="font-bold text-zinc-800 text-xs shrink-0">6 Questões</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
