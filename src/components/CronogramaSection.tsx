import React, { useState, useMemo } from 'react';
import { User } from '../firebase';
import { UserProfile, EditalTopic, ScheduleDay } from '../types';
import { generateStudySchedule, INITIAL_EDITAL_TOPICS } from '../data/seducData';
import OnboardingModal from './OnboardingModal';
import { 
  Calendar, 
  Printer, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  User as UserIcon, 
  GraduationCap, 
  Sparkles, 
  UserCheck, 
  Award, 
  RefreshCw,
  FileText,
  Filter,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';

interface CronogramaSectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab?: (tab: string) => void;
}

export default function CronogramaSection({ user, profile, setActiveTab }: CronogramaSectionProps) {
  const [topics] = useState<EditalTopic[]>(INITIAL_EDITAL_TOPICS);
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'Conhecimentos Básicos' | 'Didática e Legislação' | 'Conhecimentos Específicos'>('all');

  // Generate schedule array based on profile data
  const scheduleDays = useMemo(() => {
    return generateStudySchedule(profile || {}, topics);
  }, [profile, topics]);

  const toggleTopicCompletion = (id: string) => {
    setCompletedTopicIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalTopicsInSchedule = useMemo(() => {
    return scheduleDays.reduce((acc, day) => acc + day.topics.length, 0);
  }, [scheduleDays]);

  const completedCount = useMemo(() => {
    return Object.values(completedTopicIds).filter(Boolean).length;
  }, [completedTopicIds]);

  const progressPercent = totalTopicsInSchedule > 0 
    ? Math.round((completedCount / totalTopicsInSchedule) * 100) 
    : 0;

  return (
    <div className="space-y-5">
      {/* Print Specific CSS stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-cronograma-page, #printable-cronograma-page * {
            visibility: visible;
          }
          #printable-cronograma-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Recadastrar Onboarding Modal */}
      {showEditModal && (
        <OnboardingModal
          user={user}
          profile={profile}
          onComplete={() => setShowEditModal(false)}
        />
      )}

      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-5 shadow-xl border border-emerald-800/60 relative overflow-hidden space-y-3 no-print"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <Calendar size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  Banca FUNECE 2026
                </span>
                <span className="text-xs text-amber-300 font-bold">
                  {scheduleDays.length} Dias de Estudos
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white mt-1">
                Cronograma do Edital
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Cronograma</span>
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-700 transition cursor-pointer"
              title="Ajustar carga horária e datas"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">Recadastrar</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-emerald-200/90 leading-relaxed max-w-2xl relative z-10">
          Distribuição diária automática com <strong>2 a 4 assuntos por dia</strong>, alternando entre Conhecimentos Gerais (Língua Portuguesa, RLM, Didática e Legislação CE) e Conhecimentos Específicos para a prova da SEDUC CE.
        </p>
      </motion.div>

      {/* Main Schedule Container */}
      <div className="space-y-5" id="printable-cronograma-page">
        {/* Candidate Profile Summary Card */}
        <div className="bg-white border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Plano de Metas • Concurso SEDUC CE
              </span>
              <h3 className="text-lg font-black text-emerald-950 mt-1">
                Professor(a): {profile?.name || user.displayName || 'Professor(a)'}
              </h3>
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="no-print text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
            >
              Recadastrar / Alterar Perfil
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-700">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Licenciatura / Área</p>
                <p className="font-bold text-zinc-800 truncate">{profile?.degree || 'Língua Portuguesa'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Início & Prova</p>
                <p className="font-bold text-zinc-800">
                  {profile?.startDate || 'Hoje'} até {profile?.examDate || '18/10/2026'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Carga Horária</p>
                <p className="font-bold text-zinc-800">{profile?.hoursPerDay || 3}h/dia ({profile?.hoursPerDay && profile.hoursPerDay >= 5 ? '4' : '2 a 3'} assuntos/dia)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UserIcon size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Atuação</p>
                <p className="font-bold text-zinc-800 truncate">{profile?.isWorkingInArea || 'Educador'}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pt-2 no-print">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" /> Progresso de Estudos Concluídos:
              </span>
              <span className="font-black text-emerald-800">{completedCount} de {totalTopicsInSchedule} tópicos ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden border border-emerald-200">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 no-print">
          <div className="p-4 bg-emerald-900 text-white rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-emerald-300 tracking-wider">Módulo Geral FUNECE</span>
            <h4 className="font-extrabold text-sm text-white">Conteúdo Geral Obrigatório</h4>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Língua Portuguesa (FUNECE), Raciocínio Lógico, LDB nº 9.394/96, Estatuto do Magistério do CE, PEE-CE e Didática Geral.
            </p>
          </div>

          <div className="p-4 bg-teal-900 text-white rounded-2xl space-y-1">
            <span className="text-[10px] uppercase font-extrabold text-teal-300 tracking-wider">Módulo Específico</span>
            <h4 className="font-extrabold text-sm text-white">Específica da Licenciatura</h4>
            <p className="text-xs text-teal-200/90 leading-relaxed">
              Metodologias Ativas, Sequência Didática, DUA, PDI, Projetos integradores no Novo Ensino Médio do Ceará e Questões da FUNECE.
            </p>
          </div>
        </div>

        {/* Schedule Calendar Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 pb-2">
            <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              Calendário de Estudos Dia a Dia
            </h3>
            <span className="text-xs font-semibold text-zinc-500 italic">
              Clique no checkbox para marcar o assunto como lido
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {scheduleDays.map((day) => (
              <div 
                key={day.dateStr} 
                className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3 hover:border-emerald-300 transition shadow-xs hover:shadow-md"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                  <span className="font-black text-xs text-emerald-900 uppercase tracking-tight flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
                      {day.dayNumber}
                    </span>
                    Dia {day.dayNumber} • {day.displayDate}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
                    {day.topics.length} Assuntos
                  </span>
                </div>

                <div className="space-y-2">
                  {day.topics.map((item) => {
                    const isDone = completedTopicIds[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleTopicCompletion(item.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                          isDone 
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900' 
                            : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        <button 
                          type="button" 
                          className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition ${
                            isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isDone && <CheckCircle size={12} className="stroke-[3]" />}
                        </button>
                        
                        <div className="min-w-0 flex-1">
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-block mb-1 ${
                            item.category === 'Conhecimentos Específicos' 
                              ? 'bg-teal-100 text-teal-800' 
                              : item.category === 'Didática e Legislação'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.subject}
                          </span>
                          <p className={`font-semibold leading-snug text-[11px] ${isDone ? 'line-through text-emerald-800/70' : 'text-zinc-800'}`}>
                            {item.topicName}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Printable Footer Notice */}
        <div className="pt-6 border-t border-zinc-200 text-center text-xs text-zinc-500 space-y-1">
          <p className="font-bold text-emerald-950">
            PasseiSEDUC • Preparatório Especializado no Concurso SEDUC CE 2026 (Banca FUNECE)
          </p>
          <p className="text-[10px] text-zinc-400">
            Cronograma oficial impresso para acompanhamento de estudos de {profile?.name || user.displayName}.
          </p>
        </div>
      </div>
    </div>
  );
}
