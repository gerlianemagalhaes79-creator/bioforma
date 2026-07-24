import React, { useState, useEffect, useMemo } from 'react';
import { User, db, collection, query, onSnapshot } from '../firebase';
import { UserProfile, QuestionAnswerLog } from '../types';
import { 
  BarChart3, BrainCircuit, Target, TrendingUp, Clock, Zap, AlertTriangle, 
  CheckCircle2, ChevronRight, ChevronDown, Award, Sparkles, Filter, RefreshCw, 
  BookOpen, ShieldCheck, PieChart as PieIcon, Layers, Flame, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Cell 
} from 'recharts';

interface IntelligenceCenterProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
  onOpenTutorWithContext?: (promptText: string) => void;
}

export default function IntelligenceCenter({ user, profile, setActiveTab, onOpenTutorWithContext }: IntelligenceCenterProps) {
  const [logs, setLogs] = useState<QuestionAnswerLog[]>([]);
  const [isDetailedBoxOpen, setIsDetailedBoxOpen] = useState(false);
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [evolutionFilter, setEvolutionFilter] = useState<'7d' | '30d' | 'all'>('30d');

  const targetSubject = profile?.targetSubject || 'Biologia';

  // Realtime subscription to Firestore questionLogs
  useEffect(() => {
    const logsRef = collection(db, 'users', user.uid, 'questionLogs');
    const q = query(logsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbLogs: QuestionAnswerLog[] = [];
      snapshot.forEach((doc) => {
        dbLogs.push({ id: doc.id, ...doc.data() } as QuestionAnswerLog);
      });

      if (dbLogs.length > 0) {
        // Sort descending by timestamp
        dbLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setLogs(dbLogs);
      } else {
        setLogs([]);
      }
    }, (err) => {
      console.warn("Firestore listener error:", err);
      setLogs([]);
    });

    return () => unsubscribe();
  }, [user.uid, targetSubject]);

  // Expand target subject discipline by default
  useEffect(() => {
    if (!expandedDiscipline && logs.length > 0) {
      setExpandedDiscipline(targetSubject);
    }
  }, [targetSubject, logs.length]);

  // -------------------------------------------------------------
  // COMPUTED STATS & DRILL-DOWNS
  // -------------------------------------------------------------

  // 1. Overall Totals
  const totalQuestions = logs.length;
  const correctQuestions = logs.filter(l => l.isCorrect).length;
  const overallAccuracy = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  // 2. Discipline Performance Breakdown
  const disciplineStats = useMemo(() => {
    const map: Record<string, { total: number; correct: number; blocks: Record<string, { total: number; correct: number; subtopics: Record<string, { total: number; correct: number }> }> }> = {};

    logs.forEach(log => {
      const disc = log.discipline || 'Outras';
      const block = log.blockName || 'Geral';
      const subtopic = log.subtopicName || log.topicName || 'Tópico Geral';

      if (!map[disc]) {
        map[disc] = { total: 0, correct: 0, blocks: {} };
      }
      map[disc].total += 1;
      if (log.isCorrect) map[disc].correct += 1;

      if (!map[disc].blocks[block]) {
        map[disc].blocks[block] = { total: 0, correct: 0, subtopics: {} };
      }
      map[disc].blocks[block].total += 1;
      if (log.isCorrect) map[disc].blocks[block].correct += 1;

      if (!map[disc].blocks[block].subtopics[subtopic]) {
        map[disc].blocks[block].subtopics[subtopic] = { total: 0, correct: 0 };
      }
      map[disc].blocks[block].subtopics[subtopic].total += 1;
      if (log.isCorrect) map[disc].blocks[block].subtopics[subtopic].correct += 1;
    });

    // Ensure main 5 categories are always represented in order
    const orderedKeys = [
      targetSubject,
      'Língua Portuguesa',
      'Administração Pública',
      'Temas Educacionais',
      'Indicadores Educacionais'
    ];

    return orderedKeys.map(key => {
      const data = map[key] || { total: 0, correct: 0, blocks: {} };
      const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      return {
        discipline: key,
        total: data.total,
        correct: data.correct,
        pct,
        blocks: data.blocks
      };
    });
  }, [logs, targetSubject]);

  // 3. Radar Chart Data (5 Core Areas)
  const radarData = useMemo(() => {
    return disciplineStats.map(d => ({
      subject: d.discipline === targetSubject ? `Específica (${d.discipline.slice(0, 8)}...)` : d.discipline,
      Aproveitamento: d.pct,
      fullMark: 100
    }));
  }, [disciplineStats, targetSubject]);

  // 4. Time Metric Calculations
  const timeMetrics = useMemo(() => {
    if (logs.length === 0) {
      return { avgSec: 0, minSec: 0, maxSec: 0, totalMin: 0 };
    }
    const totalTime = logs.reduce((acc, l) => acc + (l.timeSpentSeconds || 90), 0);
    const avgSec = Math.round(totalTime / logs.length);
    const times = logs.map(l => l.timeSpentSeconds || 90);
    const minSec = Math.min(...times);
    const maxSec = Math.max(...times);

    return {
      avgSec,
      minSec,
      maxSec,
      totalMin: Math.round(totalTime / 60)
    };
  }, [logs]);

  // 5. Evolution Chart Data (Over Time)
  const evolutionData = useMemo(() => {
    const daysMap: Record<string, { dateStr: string; total: number; correct: number }> = {};
    const daysCount = evolutionFilter === '7d' ? 7 : evolutionFilter === '30d' ? 30 : 90;
    const now = new Date();

    // Populate daily keys
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      daysMap[key] = { dateStr: key, total: 0, correct: 0 };
    }

    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const diffDays = Math.floor((now.getTime() - logDate.getTime()) / 86400000);
      if (diffDays < daysCount) {
        const key = logDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (daysMap[key]) {
          daysMap[key].total += 1;
          if (log.isCorrect) daysMap[key].correct += 1;
        }
      }
    });

    let cumulativeAccuracy = 0;
    return Object.values(daysMap).map(d => {
      if (d.total > 0) {
        cumulativeAccuracy = Math.round((d.correct / d.total) * 100);
      }
      return {
        date: d.dateStr,
        Aproveitamento: cumulativeAccuracy,
        Questoes: d.total
      };
    });
  }, [logs, evolutionFilter]);

  // 6. Banca Precision Breakdown
  const bancaStats = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {};
    logs.forEach(l => {
      const b = l.banca || 'FUNECE / CEV-UECE';
      if (!map[b]) map[b] = { total: 0, correct: 0 };
      map[b].total += 1;
      if (l.isCorrect) map[b].correct += 1;
    });

    // Default entries if empty
    const knownBancas = ['FUNECE / CEV-UECE', 'CEBRASPE', 'FGV', 'IDECAN'];
    knownBancas.forEach(kb => {
      if (!map[kb]) map[kb] = { total: 0, correct: 0 };
    });

    return Object.entries(map).map(([banca, stat]) => ({
      banca,
      total: stat.total,
      pct: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);
  }, [logs]);

  // 7. Subtopic Ranking & Categorization (Dominados, Consolidação, Críticos)
  const subtopicRankings = useMemo(() => {
    const map: Record<string, { subtopic: string; discipline: string; total: number; correct: number; pct: number }> = {};

    logs.forEach(l => {
      const key = l.subtopicName || l.topicName || 'Tópico Geral';
      if (!map[key]) {
        map[key] = { subtopic: key, discipline: l.discipline, total: 0, correct: 0, pct: 0 };
      }
      map[key].total += 1;
      if (l.isCorrect) map[key].correct += 1;
    });

    Object.values(map).forEach(item => {
      item.pct = Math.round((item.correct / item.total) * 100);
    });

    const items = Object.values(map);
    const dominados = items.filter(i => i.pct >= 85);
    const consolidacao = items.filter(i => i.pct >= 60 && i.pct < 85);
    const criticos = items.filter(i => i.pct < 60);

    return { dominados, consolidacao, criticos };
  }, [logs]);

  // 8. Auto Study Priorities (Top 3 Recommendations)
  const priorityRecommendations = useMemo(() => {
    // Collect all subtopics and calculate urgency score
    const allSubtopics: { name: string; discipline: string; pct: number; count: number; priorityLevel: 'Crítica' | 'Alta' | 'Média' }[] = [];

    disciplineStats.forEach(d => {
      Object.entries(d.blocks).forEach(([blockName, bData]) => {
        Object.entries(bData.subtopics).forEach(([subName, sData]) => {
          const pct = Math.round((sData.correct / sData.total) * 100);
          let level: 'Crítica' | 'Alta' | 'Média' = 'Média';
          if (pct < 50) level = 'Crítica';
          else if (pct < 70) level = 'Alta';

          allSubtopics.push({
            name: subName,
            discipline: d.discipline,
            pct,
            count: sData.total,
            priorityLevel: level
          });
        });
      });
    });

    allSubtopics.sort((a, b) => a.pct - b.pct);
    return allSubtopics.slice(0, 3);
  }, [disciplineStats]);

  // 9. Índice de Preparação / Aprovação SEDUC-CE (0 - 100)
  const aprovaçãoIndex = useMemo(() => {
    if (totalQuestions === 0) {
      return {
        score: 0,
        label: 'Aguardando Primeiras Questões',
        color: 'text-zinc-700 bg-zinc-100 border-zinc-200',
        especPct: 0,
        generalAvg: 0
      };
    }

    const especificStat = disciplineStats.find(d => d.discipline === targetSubject);
    const especPct = especificStat && especificStat.total > 0 ? especificStat.pct : 0;

    const generalStats = disciplineStats.filter(d => d.discipline !== targetSubject && d.total > 0);
    const generalAvg = generalStats.length > 0 
      ? Math.round(generalStats.reduce((acc, g) => acc + g.pct, 0) / generalStats.length)
      : 0;

    const volumeBonus = Math.min(20, Math.round((totalQuestions / 40) * 20));

    const finalScore = Math.min(99, Math.round((especPct * 0.5) + (generalAvg * 0.3) + volumeBonus));

    let label = 'Em Evolução Promissora';
    let color = 'text-amber-700 bg-amber-50 border-amber-200';
    if (finalScore >= 80) {
      label = 'Excelente Chance de Aprovação nas Vagas!';
      color = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    } else if (finalScore >= 65) {
      label = 'Competitivo (Zona de Classificação)';
      color = 'text-teal-800 bg-teal-50 border-teal-200';
    }

    return { score: finalScore, label, color, especPct, generalAvg };
  }, [disciplineStats, targetSubject, totalQuestions]);

  // Helper for status badge colors
  const getBadgeColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-50 text-emerald-900 border-emerald-200/80 font-bold';
    if (pct >= 60) return 'bg-amber-50 text-amber-900 border-amber-200/80 font-bold';
    return 'bg-rose-50 text-rose-900 border-rose-200/80 font-bold';
  };

  const getBarBg = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-700';
    if (pct >= 60) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ========================================================= */}
      {/* TOP HEADER: ULTRA-COMPACT & MINIMALIST CENTRAL DE APROVEITAMENTO */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-zinc-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Clean Titles & Quick Stats */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200/60">
              <BrainCircuit size={14} className="text-emerald-700" />
            </div>
            <h1 className="text-sm font-black text-zinc-900 tracking-tight">
              Central de Aproveitamento
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 pl-6">
            <span className="font-bold text-zinc-800 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-emerald-600" />
              {totalQuestions} Questões Respondidas
            </span>
            <span className="text-zinc-300">•</span>
            <span className="font-bold text-emerald-900 flex items-center gap-1">
              <Target size={12} className="text-emerald-700" />
              {overallAccuracy}% Aproveitamento Geral
            </span>
          </div>
        </div>

        {/* Right: Ultra Compact Índice de Preparação */}
        <div className="bg-zinc-50 rounded-lg px-2.5 py-1.5 border border-zinc-200/80 flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <div className="text-center shrink-0 border-r border-zinc-200 pr-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1 justify-center">
              <Award size={11} className="text-emerald-700" />
              Índice
            </span>
            <div className="flex items-baseline justify-center gap-0.5">
              <span className="text-sm font-black text-zinc-900">{aprovaçãoIndex.score}</span>
              <span className="text-[9px] font-bold text-zinc-500">/100</span>
            </div>
          </div>

          <div className="text-[10px] space-y-0.5">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold border block text-center ${aprovaçãoIndex.color}`}>
              {aprovaçãoIndex.label}
            </span>
            <div className="flex items-center gap-2 text-[9px] text-zinc-500 font-semibold">
              <span>Esp: <strong className="text-zinc-800">{aprovaçãoIndex.especPct}%</strong></span>
              <span>Ger: <strong className="text-zinc-800">{aprovaçãoIndex.generalAvg}%</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN GRID: DRILL DOWN + RADAR DE DIFICULDADES             */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN (8 COLS): DISCIPLINE -> BLOCO -> SUBTÓPICO DRILL-DOWN */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden h-fit">
          {/* Main Collapsible Header */}
          <button
            onClick={() => setIsDetailedBoxOpen(!isDetailedBoxOpen)}
            className="w-full p-3.5 sm:p-4 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/80 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200/60 shrink-0">
                <BarChart3 size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-zinc-900 group-hover:text-emerald-900 transition">
                  Desempenho Detalhado por Disciplina, Bloco e Subtópico
                </h3>
                <p className="text-[11px] text-zinc-500 font-medium truncate">
                  Clique na disciplina ou bloco para expandir o raio-X completo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-md border border-zinc-200">
                {disciplineStats.length} Módulos
              </span>
              <div className="p-1 bg-zinc-100 rounded-md text-zinc-600 group-hover:bg-zinc-200/80 transition">
                {isDetailedBoxOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          <AnimatePresence>
            {isDetailedBoxOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-zinc-100 p-3.5 sm:p-4 space-y-3 bg-zinc-50/40"
              >
                {/* Discipline List */}
                <div className="space-y-2.5">
                  {disciplineStats.map((d) => {
                    const isExpanded = expandedDiscipline === d.discipline;

                    return (
                      <div key={d.discipline} className="border border-zinc-200/80 rounded-lg overflow-hidden bg-white shadow-2xs">
                        {/* Discipline Header Row */}
                        <button
                          onClick={() => setExpandedDiscipline(isExpanded ? null : d.discipline)}
                          className="w-full p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-left hover:bg-zinc-50 transition cursor-pointer"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900">{d.discipline}</span>
                              {d.discipline === targetSubject && (
                                <span className="bg-emerald-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  Específica (Peso 62.5%)
                                </span>
                              )}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden flex items-center">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${getBarBg(d.pct)}`}
                                style={{ width: `${d.pct}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                            <div className="text-right">
                              <span className={`inline-block text-[11px] px-2 py-0.5 rounded-md border ${getBadgeColor(d.pct)}`}>
                                {d.pct}%
                              </span>
                              <span className="block text-[10px] text-zinc-500 font-medium mt-0.5">
                                {d.total} questões
                              </span>
                            </div>

                            <div className="p-1 bg-zinc-100 rounded-md text-zinc-500">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                          </div>
                        </button>

                        {/* DRILL-DOWN LEVEL 1 & 2: BLOCKS & SUBTOPICS */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-zinc-50/80 border-t border-zinc-200/80 p-3 space-y-2.5"
                            >
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                                Blocos do Edital de {d.discipline}
                              </p>

                              {Object.keys(d.blocks).length === 0 ? (
                                <p className="text-xs text-zinc-500 italic">Sem questões respondidas para este módulo ainda.</p>
                              ) : (
                                Object.entries(d.blocks).map(([blockName, bData]) => {
                                  const bPct = bData.total > 0 ? Math.round((bData.correct / bData.total) * 100) : 0;
                                  const isBlockExpanded = expandedBlock === blockName;

                                  return (
                                    <div key={blockName} className="bg-white rounded-lg border border-zinc-200/80 p-2.5 space-y-2 shadow-2xs">
                                      {/* Block Row */}
                                      <div 
                                        onClick={() => setExpandedBlock(isBlockExpanded ? null : blockName)}
                                        className="flex items-center justify-between gap-2 cursor-pointer group"
                                      >
                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                          <ChevronRight size={13} className={`text-zinc-400 transition-transform ${isBlockExpanded ? 'rotate-90 text-emerald-800' : ''}`} />
                                          <span className="text-xs font-bold text-zinc-800 group-hover:text-emerald-900 transition">
                                            {blockName}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] text-zinc-500 font-medium">{bData.total} quest.</span>
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${getBadgeColor(bPct)}`}>
                                            {bPct}%
                                          </span>
                                        </div>
                                      </div>

                                      {/* DRILL-DOWN LEVEL 2: SUBTOPICS */}
                                      {isBlockExpanded && (
                                        <div className="pt-2 pl-4 border-t border-zinc-100 space-y-1">
                                          <span className="text-[9px] font-bold text-zinc-400 uppercase block mb-1">
                                            Aproveitamento por Subtópico
                                          </span>
                                          {Object.entries(bData.subtopics).map(([subName, sData]) => {
                                            const sPct = sData.total > 0 ? Math.round((sData.correct / sData.total) * 100) : 0;
                                            return (
                                              <div key={subName} className="flex items-center justify-between text-xs py-1 border-b border-zinc-50 last:border-0">
                                                <span className="font-medium text-zinc-700 text-[11px]">{subName}</span>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] text-zinc-400">{sData.correct}/{sData.total} acertos</span>
                                                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getBadgeColor(sPct)}`}>
                                                    {sPct}%
                                                  </span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN (4 COLS): RADAR DE DIFICULDADES */}
        <div className="lg:col-span-4 bg-white rounded-xl p-4 border border-zinc-200/80 shadow-2xs space-y-3.5 h-fit">
          <div className="pb-2.5 border-b border-zinc-100">
            <h3 className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-2">
              <PieIcon size={16} className="text-emerald-800" />
              Radar de Dificuldades
            </h3>
            <p className="text-[11px] text-zinc-500">Mapeamento poligonal do nível de domínio nas 5 áreas FUNECE</p>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                <PolarGrid stroke="#e4e4e7" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#27272a', fontSize: 10, fontWeight: 'bold' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar 
                  name="Aproveitamento %" 
                  dataKey="Aproveitamento" 
                  stroke="#065f46" 
                  fill="#10b981" 
                  fillOpacity={0.3} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80 text-xs text-zinc-800 space-y-1">
            <span className="font-bold flex items-center gap-1 text-emerald-900 text-[11px]">
              <Sparkles size={13} className="text-emerald-700" />
              Diagnóstico do Radar:
            </span>
            <p className="text-[11px] leading-relaxed text-zinc-600">
              Sua pontuação na parte Específica e em Temas Educacionais está sólida. O radar indica que dar atenção extra a Português e Indicadores SPAECE elevará sua nota final rapidamente.
            </p>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* EVOLUÇÃO TEMPORAL (LINE CHART)                           */}
      {/* ========================================================= */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-zinc-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-zinc-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-800" />
              Evolução Temporal do Desempenho
            </h3>
            <p className="text-[11px] text-zinc-500">Histórico de porcentagem de acertos ao longo dos dias de treino</p>
          </div>

          {/* View Filters */}
          <div className="flex items-center p-0.5 bg-zinc-100 rounded-lg">
            {(['7d', '30d', 'all'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setEvolutionFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                  evolutionFilter === filter ? 'bg-emerald-900 text-white shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {filter === '7d' ? '7 Dias' : filter === '30d' ? '30 Dias' : 'Geral'}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full h-56 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#71717a' }} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e4e4e7', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="Aproveitamento" 
                stroke="#047857" 
                strokeWidth={3} 
                dot={{ fill: '#047857', r: 4 }}
                activeDot={{ r: 6, fill: '#059669' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
