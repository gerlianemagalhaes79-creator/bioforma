import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User, db, doc, getDoc, setDoc } from '../firebase';
import { UserProfile, EditalTopic } from '../types';
import { generateStudySchedule, buildInterleavedStudyQueue, INITIAL_EDITAL_TOPICS } from '../data/seducData';
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
  }, [user?.uid, profile?.uid, storageKey]);

  const activeDegree = profile?.degree || profile?.targetSubject || 'Licenciatura em Biologia / Ciências Biológicas';

  // Build the unified Interleaving Queue
  const interleavedQueue = useMemo(() => {
    return buildInterleavedStudyQueue(activeDegree);
  }, [activeDegree]);

  // Generate schedule array based on profile data
  const scheduleDays = useMemo(() => {
    return generateStudySchedule(profile || {}, topics);
  }, [profile, topics]);

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

  const toggleSubtopicCompletion = (subKey: string, daySubtopicKeys?: string[]) => {
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

  const toggleWholeDayCompletion = (daySubtopicKeys: string[]) => {
    if (!daySubtopicKeys || daySubtopicKeys.length === 0) return;

    setCompletedTopicIds(prev => {
      const isAllDone = daySubtopicKeys.every(k => !!prev[k]);
      const updated = { ...prev };
      
      daySubtopicKeys.forEach(k => {
        updated[k] = !isAllDone;
      });

      if (!isAllDone) {
        triggerDayConfetti();
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
            margin: 12mm 12mm 12mm 12mm;
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
            font-size: 10.5px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* OFFICIAL HEADER */
          .official-header {
            border-bottom: 3px solid #064e3b;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 900;
            color: #064e3b;
            text-transform: uppercase;
            letter-spacing: -0.3px;
            margin: 0;
            line-height: 1.1;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #047857;
            font-weight: 800;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .doc-badge {
            background: #064e3b;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: right;
          }

          /* CANDIDATE DOSSIER BOX */
          .dossier-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 4px solid #064e3b;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 12px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .dossier-item {
            font-size: 10px;
          }
          .dossier-label {
            font-size: 8.5px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 1px;
          }
          .dossier-value {
            font-weight: 800;
            color: #0f172a;
            font-size: 11px;
          }

          /* MOTIVATIONAL MANIFESTO BANNER */
          .manifesto-banner {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 14px;
            text-align: center;
          }
          .manifesto-text {
            font-size: 11px;
            font-weight: 800;
            color: #064e3b;
            margin: 0;
            font-style: italic;
          }
          .manifesto-subtext {
            font-size: 9px;
            color: #047857;
            margin-top: 2px;
            font-weight: 600;
          }

          /* SCHEDULE GRID */
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .day-card {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px;
            background: #ffffff;
            page-break-inside: avoid;
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          }
          .day-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1.5px solid #064e3b;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .day-title {
            font-size: 12px;
            font-weight: 900;
            color: #064e3b;
            text-transform: uppercase;
          }
          .day-time {
            font-size: 9px;
            font-weight: 800;
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
            padding: 7px;
            margin-bottom: 7px;
            background: #fafafa;
          }
          .session-especifica {
            border-left: 4px solid #0f766e;
            background: #f0fdfa;
          }
          .session-geral {
            border-left: 4px solid #047857;
            background: #ecfdf5;
          }
          .session-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .badge {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 3px;
            color: #ffffff;
            background: #0f766e;
            letter-spacing: 0.3px;
          }
          .topic-name {
            font-size: 10.5px;
            font-weight: 800;
            color: #1e293b;
          }

          /* SUBTOPIC CHECKLIST */
          .subtopic-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin-top: 4px;
            font-size: 10px;
            color: #334155;
          }
          .checkbox {
            width: 11px;
            height: 11px;
            border: 1.5px solid #475569;
            border-radius: 2px;
            display: inline-block;
            margin-top: 1px;
            flex-shrink: 0;
            background: #ffffff;
          }
          
          /* PERFORMANCE LOG TRACKER ON DAY CARD */
          .day-tracker {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            padding-top: 6px;
            border-top: 1px dashed #cbd5e1;
            font-size: 8.5px;
            color: #475569;
            font-weight: 700;
          }
          .tracker-box {
            flex: 1;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            padding: 3px 5px;
            border-radius: 4px;
          }

          /* REVIEWS DUE BOX */
          .review-box {
            margin-top: 6px;
            padding: 5px 8px;
            background: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 5px;
            font-size: 9px;
            color: #92400e;
            font-weight: 700;
          }

          /* SIGNATURE & FOOTER */
          .pledge-footer {
            margin-top: 18px;
            page-break-inside: avoid;
            border-top: 1px solid #cbd5e1;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .signature-box {
            text-align: center;
            width: 240px;
          }
          .signature-line {
            border-bottom: 1px solid #334155;
            margin-bottom: 4px;
            height: 20px;
          }
          .signature-label {
            font-size: 9px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
          }
          .footer-notes {
            font-size: 8.5px;
            color: #64748b;
            max-w: 300px;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <!-- OFFICIAL HEADER -->
        <div class="official-header">
          <div>
            <h1 class="brand-title">PASSEI SEDUC CE 2026 • PLANO INTELIGENTE</h1>
            <div class="brand-subtitle">Matriz Intercalada de Estudos & Resolução de Questões</div>
          </div>
          <div class="doc-badge">
            Banca FUNECE / UECE<br/>
            Documento Oficial
          </div>
        </div>

        <!-- CANDIDATE DOSSIER CARD -->
        <div class="dossier-card">
          <div class="dossier-item">
            <span class="dossier-label">Professor(a) Candidato(a)</span>
            <span class="dossier-value">${userName}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Cargo / Disciplina Específica</span>
            <span class="dossier-value">${userSubject}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Emissão do Plano</span>
            <span class="dossier-value">${new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Carga Horária Diária</span>
            <span class="dossier-value">${dailyHours} Horas / Dia</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Método Aplicado</span>
            <span class="dossier-value">Interleaving (Estudo Intercalado)</span>
          </div>
          <div class="dossier-item">
            <span class="dossier-label">Estratégia de Prova</span>
            <span class="dossier-value">Foco 62,5% Conhecimentos Específicos</span>
          </div>
        </div>

        <!-- MOTIVATIONAL MANIFESTO BANNER -->
        <div class="manifesto-banner">
          <p class="manifesto-text">
            "A aprovação no Magistério Estadual do Ceará é construída dia a dia com foco, disciplina e resolução sistemática de questões."
          </p>
          <div class="manifesto-subtext">
            Marque cada sessão concluída e mantenha o ritmo. Você está mais próximo da sua vaga!
          </div>
        </div>

        <!-- SCHEDULE GRID -->
        <div class="grid">
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

                  ${session.subtopicNames.map(subName => `
                    <div class="subtopic-item">
                      <span class="checkbox"></span>
                      <span><strong>[ ] Teoria/Lei</strong> &nbsp; <strong>[ ] Questões FUNECE</strong> — ${subName}</span>
                    </div>
                  `).join('')}
                </div>
              `).join('')}

              <!-- Daily Execution Log Box -->
              <div class="day-tracker">
                <div class="tracker-box">⏱ Tempo Real: _____ min</div>
                <div class="tracker-box">🎯 Questões: ___ / ___ acertos</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- PLEDGE & SIGNATURE FOOTER -->
        <div class="pledge-footer">
          <div class="footer-notes">
            <strong>PasseiSEDUC 2026</strong> • Plataforma Especializada de Preparação FUNECE<br/>
            Guarde este documento impresso em seu local de estudos e assinale o cumprimento diário das metas.
          </div>

          <div class="signature-box">
            <div class="signature-line"></div>
            <div class="signature-label">Assinatura do(a) Futuro(a) Professor(a) Efetivo(a)</div>
          </div>
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
              const isDayFullyCompleted = daySubtopicKeys.length > 0 && daySubtopicKeys.every((k) => !!completedTopicIds[k]);

              return (
                <div 
                  key={day.dateStr} 
                  className={`border rounded-2xl p-4 space-y-3 transition shadow-xs flex flex-col justify-between ${
                    isDayFullyCompleted 
                      ? 'bg-emerald-50/60 border-emerald-300' 
                      : 'bg-white border-zinc-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    {/* DIA HEADER */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs ${
                          isDayFullyCompleted ? 'bg-emerald-600 text-white' : 'bg-emerald-800 text-white'
                        }`}>
                          {isDayFullyCompleted ? '✓' : day.dayNumber}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-xs text-zinc-900 capitalize">
                            {day.displayDate}
                          </h4>
                          <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                            <Clock size={11} />
                            <span>{day.timeSlotFormatted}</span>
                          </p>
                        </div>
                      </div>

                      {isDayFullyCompleted ? (
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                          <PartyPopper size={11} className="text-emerald-700 animate-bounce" />
                          Concluído 🎉
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                          Dia {day.dayNumber}
                        </span>
                      )}
                    </div>

                    {/* ESTUDO PRINCIPAL (SESSÕES INTERCALADAS DE TÓPICOS/SUBTÓPICOS) */}
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
                                  onClick={() => toggleSubtopicCompletion(subKey, daySubtopicKeys)}
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
                  </div>

                  {/* BOTAO CONCLUIR DIA INTEIRO */}
                  <div className="pt-2 border-t border-zinc-100 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleWholeDayCompletion(daySubtopicKeys)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isDayFullyCompleted
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {isDayFullyCompleted ? (
                        <>
                          <CheckCircle2 size={15} className="text-emerald-700" />
                          <span>Dia de Estudo Concluído! 🎉</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={15} className="text-emerald-200" />
                          <span>Marcar Dia como Concluído ✨</span>
                        </>
                      )}
                    </button>
                  </div>
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
