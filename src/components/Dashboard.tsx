import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { UserProfile } from '../types';
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
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ user, profile, setActiveTab }: DashboardProps) {
  const userName = profile?.name || user.displayName || 'Professor(a)';
  const targetSubject = profile?.targetSubject || 'Língua Portuguesa';
  
  // Calculate exam countdown (assuming estimated exam date October 2026)
  const examDate = new Date('2026-10-18T08:00:00');
  const [daysRemaining, setDaysRemaining] = useState(240);

  useEffect(() => {
    const now = new Date();
    const diff = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    setDaysRemaining(diff);
  }, []);

  const readinessScore = Math.min(96, Math.max(45, (profile?.completedTopicsCount || 6) * 4 + 35));

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-emerald-800/60 relative overflow-hidden"
      >
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30 mb-2">
              <Zap size={12} className="text-amber-400" /> Rumo à Posse 2026
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Olá, Prof. {userName}!
            </h2>
            <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed max-w-sm">
              Sua disciplina-alvo é <span className="font-bold text-emerald-300">{targetSubject}</span>. O edital da SEDUC CE exige constância e domínio pedagógico.
            </p>
          </div>
          
          <div className="bg-emerald-800/80 backdrop-blur-sm border border-emerald-700/60 p-3 rounded-2xl text-center shrink-0 min-w-[85px]">
            <p className="text-[9px] uppercase font-bold text-emerald-300 tracking-wider">Faltam</p>
            <p className="text-2xl font-black text-amber-300 leading-none my-1">{daysRemaining}</p>
            <p className="text-[9px] font-bold text-emerald-200 uppercase">Dias</p>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="mt-4 pt-3.5 border-t border-emerald-800/80 relative z-10">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-emerald-200 text-[11px] flex items-center gap-1">
              <BrainCircuit size={14} className="text-emerald-400" /> Prontidão de Aprovação IA:
            </span>
            <span className="font-black text-amber-300">{readinessScore}%</span>
          </div>
          <div className="w-full bg-emerald-950/80 rounded-full h-2.5 p-0.5 border border-emerald-800">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${readinessScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-1.5 rounded-full"
            />
          </div>
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
          <p className="text-[9px] font-bold text-teal-600 mt-1">Questões</p>
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
              <p className="text-[11px] text-zinc-500">3 prioridades sugeridas pela IA para o seu edital</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('edital')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 border-0 bg-transparent cursor-pointer"
          >
            Ver Edital Completo <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                1
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-950">LDB (Art. 21 ao 36-D) – Ensino Médio</p>
                <p className="text-[10px] text-emerald-700 font-medium">Didática e Legislação • Alta relevância na banca IDECAN</p>
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
                <p className="text-xs font-bold text-zinc-800">Regência Verbal e Crase em Questões</p>
                <p className="text-[10px] text-zinc-500 font-medium">Língua Portuguesa • Treino Prático</p>
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
                <p className="text-xs font-bold text-zinc-800">Estudo de Caso: Gestão Democrática</p>
                <p className="text-[10px] text-zinc-500 font-medium">Questão Discursiva da SEDUC CE</p>
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
            <p className="text-xs font-black uppercase tracking-wider text-emerald-200">Simulados</p>
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
            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">Inteligência IA</p>
            <p className="text-sm font-black text-white mt-0.5">Tutor Pedagogia SEDUC</p>
          </div>
        </button>
      </div>

      {/* Strategic Advice Card */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-4 flex items-start gap-3.5">
        <div className="p-2 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="font-extrabold text-amber-950 text-xs uppercase tracking-wider">Estratégia de Prova SEDUC CE 2026</h4>
          <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
            As bancas organizadoras do Ceará costumam atribuir alto peso à **Didática e Legislação Educacional**. Um excelente desempenho em LDB e BNCC garante vaga nas primeiras colocações!
          </p>
        </div>
      </div>
    </div>
  );
}
