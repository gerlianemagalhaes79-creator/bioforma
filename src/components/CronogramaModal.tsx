import React, { useState, useMemo } from 'react';
import { UserProfile, EditalTopic, ScheduleDay } from '../types';
import { generateStudySchedule, INITIAL_EDITAL_TOPICS } from '../data/seducData';
import { Calendar, Printer, CheckCircle, Clock, BookOpen, User, GraduationCap, X, ChevronLeft, ChevronRight, Sparkles, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface CronogramaModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onOpenEditProfile?: () => void;
}

export default function CronogramaModal({ profile, onClose, onOpenEditProfile }: CronogramaModalProps) {
  const [topics] = useState<EditalTopic[]>(INITIAL_EDITAL_TOPICS);
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>({});
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Print Specific CSS stylesheet embedded */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-cronograma, #printable-cronograma * {
            visibility: visible;
          }
          #printable-cronograma {
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

      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-emerald-100 overflow-hidden my-4 max-h-[92vh] flex flex-col"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <Calendar size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
                  Banca FUNECE 2026
                </span>
                <span className="text-xs text-amber-300 font-bold hidden sm:inline">
                  {scheduleDays.length} Dias Mapeados
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Cronograma de Estudos do Edital SEDUC CE
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              title="Imprimir Cronograma em PDF"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Imprimir Cronograma</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1" id="printable-cronograma">
          {/* Printable Header Info Box */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  FUNECE • Concurso SEDUC CE 2026
                </span>
                <h3 className="text-base sm:text-lg font-black text-emerald-950 mt-1">
                  Plano de Estudos de {profile?.name || 'Professor(a)'}
                </h3>
              </div>

              {onOpenEditProfile && (
                <button
                  onClick={onOpenEditProfile}
                  className="no-print text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Alterar Datas/Carga Horária
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-700">
              <div className="flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Licenciatura</p>
                  <p className="font-bold text-zinc-800 truncate">{profile?.degree || 'Língua Portuguesa'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Início & Prova</p>
                  <p className="font-bold text-zinc-800">
                    {profile?.startDate || 'Hoje'} até {profile?.examDate || '18/10/2026'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Meta Diária</p>
                  <p className="font-bold text-zinc-800">{profile?.hoursPerDay || 3}h por dia (2-4 assuntos/dia)</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <User size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Atuação</p>
                  <p className="font-bold text-zinc-800 truncate">{profile?.isWorkingInArea || 'Educador'}</p>
                </div>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="pt-2 no-print">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-emerald-900 flex items-center gap-1">
                  <Sparkles size={14} className="text-emerald-600" /> Progresso do Cronograma:
                </span>
                <span className="font-black text-emerald-800">{completedCount} de {totalTopicsInSchedule} assuntos concluídos ({progressPercent}%)</span>
              </div>
              <div className="w-full bg-emerald-200/80 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Curriculum Overview Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Módulo 1</span>
              <h4 className="font-extrabold text-sm text-white">Conteúdo Geral (Banca FUNECE)</h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Língua Portuguesa (FUNECE), Raciocínio Lógico, LDB nº 9.394/96, Estatuto do Magistério do CE, PEE-CE e Didática (Luckesi/Libâneo).
              </p>
            </div>

            <div className="p-4 bg-teal-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-teal-300 tracking-wider">Módulo 2</span>
              <h4 className="font-extrabold text-sm text-white">Conteúdo Específico ({profile?.targetSubject || 'Específica'})</h4>
              <p className="text-xs text-teal-200/90 leading-relaxed">
                Metodologias Ativas, Sequência Didática, DUA, PDI, Projetos integradores do Novo Ensino Médio do Ceará e Questões da FUNECE.
              </p>
            </div>
          </div>

          {/* Schedule Calendar Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" />
                Roteiro Dia a Dia (2 a 4 Assuntos por Dia)
              </h3>
              <span className="text-xs text-zinc-500 italic">
                Ajustado para {profile?.hoursPerDay || 3} horas de estudo por dia
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scheduleDays.map((day) => (
                <div 
                  key={day.dateStr} 
                  className="bg-white border border-zinc-200 rounded-2xl p-3.5 space-y-2.5 hover:border-emerald-300 transition shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                    <span className="font-black text-xs text-emerald-900 uppercase tracking-tight flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                        {day.dayNumber}
                      </span>
                      Dia {day.dayNumber} • {day.displayDate}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {day.topics.length} Assuntos
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {day.topics.map((item) => {
                      const isDone = completedTopicIds[item.id];
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleTopicCompletion(item.id)}
                          className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2 ${
                            isDone 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                              : 'bg-zinc-50/70 border-zinc-200/80 text-zinc-800 hover:bg-zinc-100'
                          }`}
                        >
                          <button 
                            type="button" 
                            className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                              isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300 bg-white'
                            }`}
                          >
                            {isDone && <CheckCircle size={12} className="stroke-[3]" />}
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded inline-block mb-0.5 ${
                              item.category === 'Conhecimentos Específicos' 
                                ? 'bg-teal-100 text-teal-800' 
                                : item.category === 'Didática e Legislação'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.subject}
                            </span>
                            <p className={`font-medium leading-snug text-[11px] ${isDone ? 'line-through text-emerald-800/70' : 'text-zinc-800'}`}>
                              <strong>{item.parentTopicName}: </strong>
                              {item.subtopicNames ? item.subtopicNames.join(', ') : ''}
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

          {/* Printable Signature Footer */}
          <div className="pt-6 border-t border-zinc-200 text-center text-xs text-zinc-500 space-y-2">
            <p className="font-bold text-emerald-950">
              PasseiSEDUC • Preparatório Especializado no Concurso SEDUC CE 2026 (Banca FUNECE)
            </p>
            <p className="text-[10px] text-zinc-400">
              Documento gerado em {new Date().toLocaleDateString('pt-BR')} para acompanhamento do candidato {profile?.name}.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
