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
  const [isDetailedBoxOpen, setIsDetailedBoxOpen] = useState(true);
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [evolutionFilter, setEvolutionFilter] = useState<'7d' | '30d' | 'all'>('30d');

  const targetSubject = profile?.targetSubject || 'Biologia';

  // Helper to normalize discipline names to match the 5 main categories
  const getCanonicalDiscipline = (raw: string, targetSub: string): string => {
    if (!raw) return targetSub;
    const lower = raw.toLowerCase();
    
    if (lower.includes('portuguê') || lower.includes('língua portuguesa')) {
      return 'Língua Portuguesa';
    }
    if (lower.includes('administra') || lower.includes('estatuto') || lower.includes('pública')) {
      return 'Administração Pública';
    }
    if (lower.includes('educaçã') || lower.includes('pedagóg') || lower.includes('temas')) {
      return 'Temas Educacionais';
    }
    if (lower.includes('dado') || lower.includes('indicador') || lower.includes('leitura') || lower.includes('spaece')) {
      return 'Indicadores Educacionais';
    }
    return targetSub;
  };

  // Load question logs from local storage AND Firestore with realtime updates
  useEffect(() => {
    let unsubFirestore: (() => void) | null = null;

    const readLocalLogs = (): QuestionAnswerLog[] => {
      try {
        const activeUid = user?.uid || profile?.uid;
        const keys = activeUid 
          ? [`questionLogs_${activeUid}`] 
          : ['questionLogs_guest'];

        const map = new Map<string, QuestionAnswerLog>();
        keys.forEach(k => {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const arr: QuestionAnswerLog[] = JSON.parse(raw);
              arr.forEach(item => {
                if (item.id?.startsWith('synth_log_')) return;
                const itemKey = item.id || `${item.questionId}_${item.timestamp}`;
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

    const processLogs = (rawLogs: QuestionAnswerLog[]): QuestionAnswerLog[] => {
      const finalLogs = [...rawLogs];
      finalLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return finalLogs;
    };

    const syncLogs = () => {
      const localLogs = readLocalLogs();
      const activeUid = user?.uid || profile?.uid;

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

            const combinedMap = new Map<string, QuestionAnswerLog>();
            localLogs.forEach(l => combinedMap.set(l.id || `${l.questionId}_${l.timestamp}`, l));
            dbLogs.forEach(l => combinedMap.set(l.id || `${l.questionId}_${l.timestamp}`, l));

            const merged = Array.from(combinedMap.values());
            const processed = processLogs(merged);
            setLogs(processed);

            try {
              localStorage.setItem(`questionLogs_${activeUid}`, JSON.stringify(processed));
            } catch (_) {}
          }, (err) => {
            console.warn("Firestore listener error:", err);
            setLogs(processLogs(localLogs));
          });
        } catch {
          setLogs(processLogs(localLogs));
        }
      } else {
        setLogs(processLogs(localLogs));
      }
    };

    syncLogs();

    const handleUpdate = () => syncLogs();
    window.addEventListener('questionLogUpdated', handleUpdate);
    return () => {
      window.removeEventListener('questionLogUpdated', handleUpdate);
      if (unsubFirestore) unsubFirestore();
    };
  }, [user?.uid, profile?.uid, targetSubject]);

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
      const disc = getCanonicalDiscipline(log.discipline, targetSubject);
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

  // Clean real performance stats
  const performanceSummary = useMemo(() => {
    const especificStat = disciplineStats.find(d => d.discipline === targetSubject);
    const especTotal = especificStat ? especificStat.total : 0;
    const especPctDisplay = especTotal > 0 ? `${especificStat!.pct}%` : 'Sem dados';

    const generalStats = disciplineStats.filter(d => d.discipline !== targetSubject && d.total > 0);
    const generalTotal = generalStats.reduce((acc, g) => acc + g.total, 0);
    const generalCorrect = generalStats.reduce((acc, g) => acc + g.correct, 0);
    const generalAvgDisplay = generalTotal > 0 ? `${Math.round((generalCorrect / generalTotal) * 100)}%` : 'Sem dados';

    return { especPctDisplay, especTotal, generalAvgDisplay, generalTotal };
  }, [disciplineStats, targetSubject]);

  // Helper for status badge colors
  const getBadgeColor = (pct: number, total: number = 1) => {
    if (total === 0) return 'bg-zinc-100 text-zinc-500 border-zinc-200/80 font-medium';
    if (pct >= 80) return 'bg-emerald-50 text-emerald-900 border-emerald-200/80 font-bold';
    if (pct >= 60) return 'bg-amber-50 text-amber-900 border-amber-200/80 font-bold';
    return 'bg-rose-50 text-rose-900 border-rose-200/80 font-bold';
  };

  const getBarBg = (pct: number, total: number = 1) => {
    if (total === 0) return 'bg-zinc-200';
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
              {totalQuestions > 0 ? `${overallAccuracy}% Aproveitamento Geral` : 'Sem questões respondidas ainda'}
            </span>
          </div>
        </div>

        {/* Right: Resumo de Desempenho Real */}
        <div className="bg-zinc-50 rounded-lg px-3 py-2 border border-zinc-200/80 flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <div className="text-center shrink-0 border-r border-zinc-200 pr-3">
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">
              Específica
            </span>
            <span className="text-sm font-black text-emerald-900">
              {performanceSummary.especPctDisplay}
            </span>
          </div>

          <div className="text-[10px] space-y-0.5">
            <div className="text-zinc-600 font-semibold flex items-center gap-1.5">
              <span>Gerais:</span>
              <strong className="text-zinc-900">{performanceSummary.generalAvgDisplay}</strong>
            </div>
            <div className="text-[9px] text-zinc-500 font-medium">
              Total Real: {totalQuestions} questões
            </div>
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
