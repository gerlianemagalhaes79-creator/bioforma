import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User, db, doc, getDoc, setDoc } from '../firebase';
import { UserProfile, EditalTopic } from '../types';
import { generateStudySchedule, buildInterleavedStudyQueue, INITIAL_EDITAL_TOPICS } from '../data/seducData';
import { syncCronogramaToEdital } from '../utils/syncCronogramaEdital';
import { recordUserActivity } from '../utils/streak';
import { 
  Calendar, 
  Printer, 
  Clock, 
  BookOpen, 
  Sparkles,
  CheckSquare,
  Square,
  RotateCcw,
  Target,
  HelpCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PartyPopper
} from 'lucide-react';
import { motion } from 'motion/react';

interface CronogramaSectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab?: (tab: string) => void;
}

export default function CronogramaSection({ user, profile, setActiveTab }: CronogramaSectionProps) {
  const [topics] = useState<EditalTopic[]>(INITIAL_EDITAL_TOPICS);
  const uid = user?.uid || profile?.uid || 'guest';
  const storageKey = `cronogramaProgress_${uid}`;

  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('cronogramaProgress_guest') || localStorage.getItem('cronogramaProgress_default');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showQueueModal, setShowQueueModal] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});

  const toggleDayCollapse = (dateStr: string) => {
    setCollapsedDays(prev => ({
      ...prev,
      [dateStr]: prev[dateStr] !== undefined ? !prev[dateStr] : false
    }));
  };

  const activeDegree = profile?.degree || profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';

  // Build the unified Interleaving Queue
  const interleavedQueue = useMemo(() => {
    return buildInterleavedStudyQueue(activeDegree);
  }, [activeDegree]);

  // Generate schedule array based on profile data
  const scheduleDays = useMemo(() => {
    return generateStudySchedule(profile || {}, topics);
  }, [profile, topics]);

  // Sync / Load saved cronograma completion progress from localStorage & Firestore
  useEffect(() => {
    const loadSavedCronogramaProgress = async () => {
      let currentLocalMap: Record<string, boolean> = {};

      // 1. Try local storage first for speed and merge fallback keys
      try {
        const primary = localStorage.getItem(storageKey);
        const guest = localStorage.getItem('cronogramaProgress_guest');
        const def = localStorage.getItem('cronogramaProgress_default');
        
        currentLocalMap = {
          ...(def ? JSON.parse(def) : {}),
          ...(guest ? JSON.parse(guest) : {}),
          ...(primary ? JSON.parse(primary) : {})
        };

        if (Object.keys(currentLocalMap).length > 0) {
          setCompletedTopicIds(currentLocalMap);
          syncCronogramaToEdital(currentLocalMap, activeDegree, user?.uid || profile?.uid);
        }
      } catch (err) {
        console.warn('Erro ao carregar do localStorage:', err);
      }

      // 2. Sync from Firestore if user UID is present
      const activeUid = user?.uid || profile?.uid;
      if (activeUid) {
        try {
          const docRef = doc(db, 'cronogramaProgress', activeUid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data && data.completedTopicIds) {
              // MERGE local + firestore so no completed items are ever lost!
              const merged = { ...currentLocalMap, ...data.completedTopicIds };
              setCompletedTopicIds(merged);
              syncCronogramaToEdital(merged, activeDegree, activeUid);
              
              localStorage.setItem(storageKey, JSON.stringify(merged));
              localStorage.setItem(`cronogramaProgress_${activeUid}`, JSON.stringify(merged));
              localStorage.setItem('cronogramaProgress_guest', JSON.stringify(merged));

              if (Object.keys(merged).length > Object.keys(data.completedTopicIds).length) {
                await setDoc(docRef, {
                  uid: activeUid,
                  completedTopicIds: merged,
                  updatedAt: new Date().toISOString()
                }, { merge: true });
              }
            }
          } else if (Object.keys(currentLocalMap).length > 0) {
            await setDoc(docRef, {
              uid: activeUid,
              completedTopicIds: currentLocalMap,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (err) {
          console.warn('Erro ao carregar do Firestore:', err);
        }
      }
    };

    loadSavedCronogramaProgress();
  }, [user?.uid, profile?.uid, storageKey, activeDegree]);

  useEffect(() => {
    const handleProgressUpdate = () => {
      try {
        const primary = localStorage.getItem(storageKey);
        const guest = localStorage.getItem('cronogramaProgress_guest');
        const def = localStorage.getItem('cronogramaProgress_default');
        const map = {
          ...(def ? JSON.parse(def) : {}),
          ...(guest ? JSON.parse(guest) : {}),
          ...(primary ? JSON.parse(primary) : {})
        };
        setCompletedTopicIds(map);
      } catch (_) {}
    };

    window.addEventListener('cronogramaProgressUpdated', handleProgressUpdate);
    window.addEventListener('studyProgressUpdated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);

    return () => {
      window.removeEventListener('cronogramaProgressUpdated', handleProgressUpdate);
      window.removeEventListener('studyProgressUpdated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [storageKey]);

  const triggerDayConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#047857', '#059669', '#10b981', '#34d399', '#f59e0b', '#fbbf24']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#047857', '#10b981', '#fbbf24']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#047857', '#10b981', '#fbbf24']
        });
      }, 250);
    } catch (err) {
      console.warn('Erro ao disparar confetes:', err);
    }
  };

  const toggleSubtopicCompletion = (subKey: string, daySubtopicKeys?: string[], dateStr?: string) => {
    setCompletedTopicIds(prev => {
      const isNowChecked = !prev[subKey];
      const updated = {
        ...prev,
        [subKey]: isNowChecked
      };

      if (isNowChecked && daySubtopicKeys && daySubtopicKeys.length > 0) {
        const wasAllDone = daySubtopicKeys.every(k => prev[k]);
        const isAllDone = daySubtopicKeys.every(k => updated[k]);
        if (isAllDone && !wasAllDone) {
          triggerDayConfetti();
          if (dateStr) {
            setCollapsedDays(prevCollapsed => ({ ...prevCollapsed, [dateStr]: true }));
          }
        }
      }

      const activeUid = user?.uid || profile?.uid;
      recordUserActivity(activeUid).catch(() => {});

      // Save to localStorage immediately under all fallbacks
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.setItem('cronogramaProgress_guest', JSON.stringify(updated));
        localStorage.setItem('cronogramaProgress_default', JSON.stringify(updated));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }

      syncCronogramaToEdital(updated, activeDegree, user?.uid || profile?.uid);

      // Save to Firestore asynchronously
      if (activeUid) {
        setDoc(doc(db, 'cronogramaProgress', activeUid), {
          uid: activeUid,
          completedTopicIds: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(err => {
          console.warn('Erro ao salvar progresso do cronograma no Firestore:', err);
        });

        const count = Object.values(updated).filter(Boolean).length;
        setDoc(doc(db, 'users', activeUid), {
          completedTopicsCount: count
        }, { merge: true }).catch(() => {});
      }

      return updated;
    });
  };

  const toggleWholeDayCompletion = (daySubtopicKeys: string[], dateStr?: string) => {
    if (!daySubtopicKeys || daySubtopicKeys.length === 0) return;

    setCompletedTopicIds(prev => {
      const isAllDone = daySubtopicKeys.every(k => !!prev[k]);
      const updated = { ...prev };
      
      daySubtopicKeys.forEach(k => {
        updated[k] = !isAllDone;
      });

      if (!isAllDone) {
        triggerDayConfetti();
        if (dateStr) {
          setCollapsedDays(prevCollapsed => ({ ...prevCollapsed, [dateStr]: true }));
        }
      } else {
        if (dateStr) {
          setCollapsedDays(prevCollapsed => ({ ...prevCollapsed, [dateStr]: false }));
        }
      }

      const activeUid = user?.uid || profile?.uid;
      recordUserActivity(activeUid).catch(() => {});

      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.setItem('cronogramaProgress_guest', JSON.stringify(updated));
        localStorage.setItem('cronogramaProgress_default', JSON.stringify(updated));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }

      syncCronogramaToEdital(updated, activeDegree, user?.uid || profile?.uid);

      if (activeUid) {
        setDoc(doc(db, 'cronogramaProgress', activeUid), {
          uid: activeUid,
          completedTopicIds: updated,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch(() => {});

        const count = Object.values(updated).filter(Boolean).length;
        setDoc(doc(db, 'users', activeUid), {
          completedTopicsCount: count
        }, { merge: true }).catch(() => {});
      }

      return updated;
    });
  };

  // Total leaf subtopics across all days
  const totalSubtopics = useMemo(() => {
    return scheduleDays.reduce((acc, day) => {
      return acc + day.topics.reduce((tAcc, top) => tAcc + top.subtopicNames.length, 0);
    }, 0);
  }, [scheduleDays]);

  const completedCount = useMemo(() => {
    return Object.values(completedTopicIds).filter(Boolean).length;
  }, [completedTopicIds]);

  const progressPercent = totalSubtopics > 0 
    ? Math.round((completedCount / totalSubtopics) * 100) 
    : 0;

  const handlePrint = () => {
    const userName = profile?.name || user.displayName || 'Professor(a)';
    const userSubject = profile?.targetSubject || 'Licenciatura SEDUC CE';
    const dailyHours = profile?.hoursPerDay || (profile?.dailyGoalMinutes ? Math.round(profile.dailyGoalMinutes / 60) : 4);

    const printHTML = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Plano de Estudos SEDUC CE 2026 - ${userName}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* CABEÇALHO BONITO E MOTIVADOR (SEM TEXTAO) */
          .print-header {
            background: linear-gradient(135deg, #064e3b 0%, #047857 100%);
            color: #ffffff;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .header-left {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .header-badge {
            font-size: 8.5px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #a7f3d0;
          }
          .print-title {
            font-size: 15px;
            font-weight: 900;
            color: #ffffff;
            margin: 0;
            letter-spacing: -0.2px;
          }
          .print-meta {
            font-size: 9.5px;
            color: #ecfdf5;
            font-weight: 600;
          }
          .header-motto {
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.25);
            padding: 6px 12px;
            border-radius: 6px;
            text-align: right;
            max-width: 220px;
          }
          .motto-text {
            font-size: 9.5px;
            font-weight: 800;
            color: #ffffff;
            font-style: italic;
            display: block;
            line-height: 1.25;
          }

          /* CRONOGRAMA EM LISTA VERTICAL (UM ABAIXO DO OUTRO) */
          .schedule-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .day-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 9px 12px;
            background: #ffffff;
            page-break-inside: avoid;
          }

          .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }

          .day-title {
            font-size: 11.5px;
            font-weight: 900;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: 0.2px;
          }

          .day-time {
            font-size: 9px;
            font-weight: 700;
            color: #0d9488;
            background: #f0fdfa;
            border: 1px solid #ccfbf1;
            padding: 2px 6px;
            border-radius: 4px;
          }

          /* SESSION BLOCK */
          .session {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 7px 9px;
            margin-bottom: 6px;
            background: #f8fafc;
          }
          .session-especifica {
            border-left: 3.5px solid #0f766e;
            background: #f0fdfa;
          }
          .session-geral {
            border-left: 3.5px solid #047857;
            background: #f0fdf4;
          }

          .session-top {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 5px;
          }

          .badge {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 2px 5px;
            border-radius: 3px;
            color: #ffffff;
            letter-spacing: 0.3px;
            flex-shrink: 0;
          }

          .topic-name {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
          }

          /* SUBTOPIC CHECKLIST - LIMPO E CONFORTÁVEL DE ANOTAR */
          .subtopics-container {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-top: 4px;
          }

          .subtopic-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            font-size: 10px;
            color: #1e293b;
            background: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
          }

          .subtopic-text {
            font-weight: 600;
            color: #334155;
            flex: 1;
          }

          .check-group {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 9px;
            font-weight: 700;
            color: #475569;
            flex-shrink: 0;
          }

          .check-option {
            display: flex;
            align-items: center;
            gap: 3px;
          }

          .check-box {
            width: 11px;
            height: 11px;
            border: 1.5px solid #064e3b;
            border-radius: 2px;
            background: #ffffff;
            display: inline-block;
          }

          /* FOOTER */
          .print-footer {
            margin-top: 14px;
            page-break-inside: avoid;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 8.5px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <!-- MOTIVATIONAL HEADER -->
        <div class="print-header">
          <div class="header-left">
            <div class="header-badge">🚀 Rumo à Nomeação SEDUC CE 2026</div>
            <h1 class="print-title">Plano de Estudos & Cronograma Diário</h1>
            <div class="print-meta">
              Prof(a). <strong>${userName}</strong> &nbsp;•&nbsp; ${userSubject} &nbsp;•&nbsp; Meta: <strong>${dailyHours}h/dia</strong> (FUNECE)
            </div>
          </div>
          <div class="header-motto">
            <span class="motto-text">"Sua dedicação diária constrói a sua aprovação!" ✨</span>
          </div>
        </div>

        <!-- SCHEDULE LIST (DAYS STACKED VERTICALLY) -->
        <div class="schedule-list">
          ${scheduleDays.map(day => `
            <div class="day-card">
              <div class="day-header">
                <span class="day-title">DIA ${day.dayNumber} • ${day.displayDate}</span>
                <span class="day-time">${day.timeSlotFormatted}</span>
              </div>
              
              ${day.topics.map(session => `
                <div class="session ${session.category === 'Conhecimentos Específicos' ? 'session-especifica' : 'session-geral'}">
                  <div class="session-top">
                    <span class="badge" style="background: ${session.category === 'Conhecimentos Específicos' ? '#0f766e' : '#047857'}">
                      ${session.reviewType || (session.category === 'Conhecimentos Específicos' ? 'Específica' : 'Geral')}
                    </span>
                    <span class="topic-name">${session.parentTopicName}</span>
                  </div>

                  <div class="subtopics-container">
                    ${session.subtopicNames.map(subName => `
                      <div class="subtopic-item">
                        <span class="subtopic-text">${subName}</span>
                        <div class="check-group">
                          <span class="check-option"><span class="check-box"></span> Teoria</span>
                          <span class="check-option"><span class="check-box"></span> Questões</span>
                          <span class="check-option"><span class="check-box"></span> Revisão</span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <!-- FOOTER -->
        <div class="print-footer">
          <div>PasseiSEDUC 2026 • Plataforma de Preparação FUNECE</div>
          <div>Emissão: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printHTML);
        printWindow.document.close();
      } else {
        window.print();
      }
    } catch (err) {
      console.warn('Fallback para impressão na própria página:', err);
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Print Specific CSS stylesheet */}
      <style>{`
        @media print {
          html, body {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #printable-cronograma-page {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Cronograma Inteligente Intercalado
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-800/90 text-emerald-200 border border-emerald-700">
                <Sparkles size={11} />
                Interleaving
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print shrink-0">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Schedule Container */}
      <div className="space-y-5" id="printable-cronograma-page">
        {/* Progress Bar Container */}
        <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 sm:p-4 shadow-xs no-print">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-emerald-900 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" /> Progresso do Edital:
            </span>
            <span className="font-black text-emerald-800 text-xs sm:text-sm">{completedCount} de {totalSubtopics} subtópicos ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2.5 overflow-hidden border border-emerald-200">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>



        {/* Schedule Calendar Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 pb-2">
            <h3 className="font-black text-emerald-950 text-base flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              Cronograma Diário de Aprendizagem Intercalada
            </h3>
            <span className="text-xs font-semibold text-zinc-500 italic">
              Dias balanceados com Específica + Geral
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {scheduleDays.map((day) => {
              const daySubtopicKeys = day.topics.flatMap((session) =>
                session.subtopicNames.map((_, subIdx) => `${session.id}_sub_${subIdx}`)
              );
              const completedInDay = daySubtopicKeys.filter((k) => !!completedTopicIds[k]).length;
              const isDayFullyCompleted = daySubtopicKeys.length > 0 && completedInDay === daySubtopicKeys.length;

              const isCollapsed = collapsedDays[day.dateStr] !== undefined
                ? collapsedDays[day.dateStr]
                : isDayFullyCompleted;

              return (
                <div 
                  key={day.dateStr} 
                  className={`border rounded-2xl p-3.5 sm:p-4 transition shadow-2xs flex flex-col justify-between ${
                    isDayFullyCompleted 
                      ? 'bg-emerald-50/70 border-emerald-300/80 hover:border-emerald-400' 
                      : 'bg-white border-zinc-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* DIA HEADER */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <button
                        type="button"
                        onClick={() => toggleDayCollapse(day.dateStr)}
                        className="flex items-center gap-2 text-left cursor-pointer group"
                      >
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs transition ${
                          isDayFullyCompleted ? 'bg-emerald-600 text-white group-hover:bg-emerald-700' : 'bg-emerald-800 text-white group-hover:bg-emerald-900'
                        }`}>
                          {isDayFullyCompleted ? '✓' : day.dayNumber}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs text-zinc-900 capitalize group-hover:text-emerald-900 transition">
                            {day.displayDate}
                          </h4>
                          <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <Clock size={11} />
                            <span>{day.timeSlotFormatted}</span>
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isDayFullyCompleted ? (
                          <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1 shrink-0">
                            <PartyPopper size={11} className="text-emerald-700 animate-bounce" />
                            Concluído 🎉
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                            Dia {day.dayNumber}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleDayCollapse(day.dateStr)}
                          className="p-1 rounded-lg hover:bg-emerald-100/60 text-emerald-800 transition cursor-pointer"
                          title={isCollapsed ? "Expandir detalhes" : "Recolher barrinha"}
                        >
                          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* VISTA RECOLHIDA (BARRINHA DO DIA) SE FOR CONCLUÍDO/RECOLHIDO */}
                    {isCollapsed ? (
                      <div 
                        onClick={() => toggleDayCollapse(day.dateStr)}
                        className="p-2.5 bg-emerald-100/60 hover:bg-emerald-100 border border-emerald-200 rounded-xl cursor-pointer transition flex items-center justify-between text-xs font-bold text-emerald-950"
                      >
                        <div className="flex items-center gap-2 text-[11px]">
                          <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                          <span>
                            {isDayFullyCompleted
                              ? `Dia ${day.dayNumber} concluído (${completedInDay}/${daySubtopicKeys.length} subtópicos)`
                              : `Dia ${day.dayNumber} em andamento (${completedInDay}/${daySubtopicKeys.length} subtópicos)`
                            }
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-800 font-extrabold hover:underline shrink-0">
                          Abrir detalhes ↓
                        </span>
                      </div>
                    ) : (
                      /* ESTUDO PRINCIPAL (SESSÕES INTERCALADAS DE TÓPICOS/SUBTÓPICOS) */
                      <div className="space-y-2">
                        {day.topics.map((session) => (
                          <div 
                            key={session.id} 
                            className={`border rounded-xl p-2.5 space-y-2 ${
                              session.category === 'Conhecimentos Específicos' 
                                ? 'bg-teal-50/40 border-teal-200/80' 
                                : 'bg-emerald-50/40 border-emerald-200/80'
                            }`}
                          >
                            {/* CATEGORIA E TÓPICO */}
                            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white ${
                                  session.category === 'Conhecimentos Específicos' ? 'bg-teal-800' : 'bg-emerald-800'
                                }`}>
                                  {session.reviewType || (session.category === 'Conhecimentos Específicos' ? 'Específica' : 'Geral')}
                                </span>
                                <span className="text-xs font-bold text-zinc-800 truncate">
                                  {session.parentTopicName}
                                </span>
                              </div>

                              {session.questionsGoal && (
                                <span className="text-[10px] font-extrabold text-teal-900 bg-teal-100/80 px-2 py-0.5 rounded-md shrink-0">
                                  {session.questionsGoal}
                                </span>
                              )}
                            </div>

                            {/* LISTA DE SUBTÓPICOS */}
                            <div className="space-y-1">
                              {session.subtopicNames.map((subName, subIdx) => {
                                const subKey = `${session.id}_sub_${subIdx}`;
                                const isChecked = !!completedTopicIds[subKey];
                                return (
                                  <button
                                    key={subKey}
                                    type="button"
                                    onClick={() => toggleSubtopicCompletion(subKey, daySubtopicKeys, day.dateStr)}
                                    className={`w-full text-left p-1.5 rounded-lg border transition text-xs flex items-center gap-2 cursor-pointer ${
                                      isChecked
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                        : 'bg-white hover:bg-emerald-50/50 border-zinc-200/80 text-zinc-800'
                                    }`}
                                  >
                                    {isChecked ? (
                                      <CheckSquare size={14} className="text-emerald-700 shrink-0" />
                                    ) : (
                                      <Square size={14} className="text-zinc-400 shrink-0" />
                                    )}
                                    <span className={`text-[11px] leading-tight break-words ${isChecked ? 'line-through text-emerald-800/80' : ''}`}>
                                      {subName}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* BOTAO CONCLUIR / REABRIR DIA INTEIRO */}
                  {!isCollapsed && (
                    <div className="pt-2 border-t border-zinc-100 mt-2">
                      <button
                        type="button"
                        onClick={() => toggleWholeDayCompletion(daySubtopicKeys, day.dateStr)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isDayFullyCompleted
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs hover:shadow-xs'
                        }`}
                      >
                        {isDayFullyCompleted ? (
                          <>
                            <CheckCircle2 size={15} className="text-emerald-700" />
                            <span>Dia de Estudo Concluído! 🎉 (Recolher)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={15} className="text-emerald-200" />
                            <span>Marcar Dia como Concluído ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Printable Footer Notice */}
        <div className="pt-6 border-t border-zinc-200 text-center text-xs text-zinc-500 space-y-1">
          <p className="font-bold text-emerald-950">
            PasseiSEDUC • Preparatório Especializado no Concurso SEDUC CE 2026 (Banca FUNECE)
          </p>
          <p className="text-[10px] text-zinc-400">
            Cronograma oficial impresso com técnica de Interleaving para {profile?.name || user.displayName}.
          </p>
        </div>
      </div>
    </div>
  );
}
