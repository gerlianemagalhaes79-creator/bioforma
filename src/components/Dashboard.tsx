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
        className="bg-white rounded-xl p-3 sm:p-3.5 border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-black text-zinc-900 tracking-tight truncate">
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
          <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-lg text-center flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Faltam</span>
            <span className="text-xs font-black text-emerald-950">{daysRemaining}</span>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">dias para a prova</span>
          </div>

          {((user?.email || profile?.email || '').toLowerCase().trim() === 'gerlianemagalhaes79@gmail.com') && (
            <button
              onClick={() => onOpenProfile && onOpenProfile('add_user')}
              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
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
    </div>
  );
}
