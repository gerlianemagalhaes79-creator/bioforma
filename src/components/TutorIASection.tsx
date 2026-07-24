import React, { useState, useRef, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';
import { User, db, collection, addDoc, doc, getDoc } from '../firebase';
import { UserProfile, TutorChatMessage } from '../types';
import { ALL_DISCIPLINES_EDITAL } from '../data/disciplinesData';
import { generateStudySchedule, INITIAL_EDITAL_TOPICS } from '../data/seducData';
import { GraduationCap, Send, Sparkles, BookOpen, BrainCircuit, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorIASectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab?: (tab: string) => void;
}

export default function TutorIASection({ user, profile, setActiveTab }: TutorIASectionProps) {
  const userName = profile?.name || user.displayName || 'Professor(a)';
  const userSubject = profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';
  
  const uid = user?.uid || profile?.uid || 'guest';
  const storageKey = `cronogramaProgress_${uid}`;

  // State for user's completed topic IDs from Cronograma
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load cronograma progress from localStorage and Firestore
  useEffect(() => {
    const loadSavedCronogramaProgress = async () => {
      try {
        const savedLocal = localStorage.getItem(storageKey);
        if (savedLocal) {
          setCompletedTopicIds(JSON.parse(savedLocal));
        }
      } catch (err) {
        console.warn('Erro ao carregar cronograma do localStorage:', err);
      }

      if (user?.uid) {
        try {
          const docRef = doc(db, 'cronogramaProgress', user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data?.completedTopicIds) {
              setCompletedTopicIds(data.completedTopicIds);
              localStorage.setItem(storageKey, JSON.stringify(data.completedTopicIds));
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar cronograma do Firestore:', err);
        }
      }
    };

    loadSavedCronogramaProgress();
  }, [user?.uid, storageKey]);

  // Compute official schedule based on user profile
  const scheduleDays = useMemo(() => {
    return generateStudySchedule(profile || {}, INITIAL_EDITAL_TOPICS);
  }, [profile]);

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

  // Find active day (today's calendar date, or first day with uncompleted subtopics, or day 1)
  const currentDay = useMemo(() => {
    if (!scheduleDays || scheduleDays.length === 0) return null;

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayISO = `${yyyy}-${mm}-${dd}`;

    // 1. Tenta encontrar a data de hoje no cronograma
    const todaySchedule = scheduleDays.find(d => d.dateStr === todayISO);

    // 2. Tenta encontrar o primeiro dia com subtópicos pendentes
    const pendingDay = scheduleDays.find(d => {
      return d.topics.some(topicSession => 
        topicSession.subtopicNames.some((_, subIdx) => !completedTopicIds[`${topicSession.id}_sub_${subIdx}`])
      );
    });

    return todaySchedule || pendingDay || scheduleDays[0];
  }, [scheduleDays, completedTopicIds]);

  // Calculate uncompleted/pending subtopics up to current day / today's date
  const overdueItems = useMemo(() => {
    if (!scheduleDays || scheduleDays.length === 0) return [];

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayISO = `${yyyy}-${mm}-${dd}`;

    const targetDayNumber = currentDay?.dayNumber || 1;

    const uncompleted: Array<{
      dayNumber: number;
      displayDate: string;
      category: string;
      blockName?: string;
      parentTopicName: string;
      subtopicName: string;
    }> = [];

    scheduleDays.forEach(day => {
      // Inclui todos os dias até o dia atual (por número do dia ou por data do calendário)
      if (day.dayNumber <= targetDayNumber || (day.dateStr && day.dateStr <= todayISO)) {
        day.topics.forEach(t => {
          if (t.subtopicNames && t.subtopicNames.length > 0) {
            t.subtopicNames.forEach((subName, subIdx) => {
              const key = `${t.id}_sub_${subIdx}`;
              if (!completedTopicIds[key]) {
                uncompleted.push({
                  dayNumber: day.dayNumber,
                  displayDate: day.displayDate,
                  category: t.category,
                  blockName: t.blockName,
                  parentTopicName: t.parentTopicName,
                  subtopicName: subName
                });
              }
            });
          } else {
            if (!completedTopicIds[t.id]) {
              uncompleted.push({
                dayNumber: day.dayNumber,
                displayDate: day.displayDate,
                category: t.category,
                blockName: t.blockName,
                parentTopicName: t.parentTopicName,
                subtopicName: t.parentTopicName
              });
            }
          }
        });
      }
    });

    return uncompleted;
  }, [scheduleDays, currentDay, completedTopicIds]);

  // Summary string of active schedule
  const cronogramaSummary = useMemo(() => {
    if (!currentDay) return `Cronograma Ativo FUNECE para ${userSubject}`;
    const topicsStr = currentDay.topics.map(t => {
      const subs = t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames.join(', ') : t.parentTopicName;
      return `[${t.category}]: Subtópico Exato: "${subs}" (Tópico Pai: ${t.parentTopicName})`;
    }).join(' | ');
    return `Dia ${currentDay.dayNumber} (${currentDay.displayDate}) - Meta Ativa de Hoje: ${topicsStr}. Progresso do Edital: ${completedCount}/${totalSubtopics} subtópicos concluídos (${progressPercent}%).`;
  }, [currentDay, userSubject, completedCount, totalSubtopics, progressPercent]);

  const [messages, setMessages] = useState<TutorChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Olá, Prof. ${userName}! Sou o seu Professor Mentor IA, 100% especialista na Banca FUNECE (CEV/UECE) para o Concurso SEDUC CE 2026.\n\nEstou **diretamente conectado ao seu Cronograma de Estudos** de **${userSubject}**!\n\n📌 **Sua Meta Ativa de Hoje (Dia ${currentDay?.dayNumber || 1} • ${currentDay?.displayDate || 'Hoje'}):**\n${currentDay?.topics.map(t => {
        const subtext = t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames.join(', ') : t.parentTopicName;
        return `• **${t.category}:** ${subtext}`;
      }).join('\n') || 'Meta pronta para início!'}\n\n📊 **Progresso Atual:** ${completedCount} de ${totalSubtopics} subtópicos concluídos (${progressPercent}% do edital).\n\nComo posso orientar seus estudos ou tirar dúvidas sobre a matéria de hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Sincroniza a mensagem inicial assim que os dados do cronograma do dia atual forem carregados
  useEffect(() => {
    if (!currentDay) return;
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome-1') {
        const metaStr = currentDay.topics.map(t => {
          const subtext = t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames.join(', ') : t.parentTopicName;
          return `• **${t.category}:** ${subtext}`;
        }).join('\n');

        return [{
          id: 'welcome-1',
          sender: 'ai',
          text: `Olá, Prof. ${userName}! Sou o seu Professor Mentor IA, 100% especialista na Banca FUNECE (CEV/UECE) para o Concurso SEDUC CE 2026.\n\nEstou **diretamente conectado ao seu Cronograma de Estudos** de **${userSubject}**!\n\n📌 **Sua Meta Ativa de Hoje (Dia ${currentDay.dayNumber} • ${currentDay.displayDate}):**\n${metaStr}\n\n📊 **Progresso Atual:** ${completedCount} de ${totalSubtopics} subtópicos concluídos (${progressPercent}% do edital).\n\nComo posso orientar seus estudos ou tirar dúvidas sobre a matéria de hoje?`,
          timestamp: prev[0].timestamp
        }];
      }
      return prev;
    });
  }, [currentDay, userName, userSubject, completedCount, totalSubtopics, progressPercent]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'O que estudo hoje?',
    'Como está meu progresso?',
    'Me passe um microdesafio FUNECE',
    'Resumo do Estatuto do CE (Lei 10.884)',
    'Sinto que estou com dificuldade e atrasado'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text || !text.trim()) return;

    const userMsg: TutorChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const activeTopicsList = currentDay ? currentDay.topics.map(t => ({
        category: t.category,
        blockName: t.blockName,
        parentTopicName: t.parentTopicName,
        subtopics: t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames : [t.parentTopicName]
      })) : [];

      const response = await fetch('/api/seduc/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          subject: userSubject,
          profile: profile,
          cronograma: cronogramaSummary,
          activeTopics: activeTopicsList,
          overdueItems: overdueItems,
          stats: {
            completedSubtopics: completedCount,
            totalSubtopics: totalSubtopics,
            progressPercent: progressPercent,
            currentDayNumber: currentDay?.dayNumber || 1
          }
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Serviço do tutor temporariamente indisponível. Tente novamente.');
      }

      const data = await response.json();
      if (data.success) {
        const aiMsg: TutorChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);

        // Save to Firestore chat logs
        try {
          await addDoc(collection(db, 'tutorChats'), {
            uid: user.uid,
            userText: text.trim(),
            aiResponse: data.text,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Erro ao salvar chat no Firestore:', dbErr);
        }
      }
    } catch (err) {
      console.warn('Servidor offline ou resposta não-JSON, gerando resposta do Mentor IA com Cronograma:', err);
      
      const lowerMsg = text.trim().toLowerCase();
      let replyText = '';

      if (lowerMsg.includes('estudo hoje') || lowerMsg.includes('hoje') || lowerMsg.includes('cronograma') || lowerMsg.includes('meta')) {
        const specTopic = currentDay?.topics.find(t => t.category === 'Conhecimentos Específicos') || currentDay?.topics[0];
        const secondaryTopics = currentDay?.topics.filter(t => t !== specTopic) || [];

        const specSubtopicStr = specTopic?.subtopicNames && specTopic.subtopicNames.length > 0
          ? specTopic.subtopicNames.join(', ')
          : (specTopic?.parentTopicName || 'Conteúdo do Cronograma');

        replyText = `Hoje você deve estudar:

**Disciplina:**
${userSubject}

**Bloco:**
${specTopic?.blockName || 'Conhecimentos Específicos'}

**Tópico:**
${specTopic?.parentTopicName || 'Tópicos do Edital'}

**Subtópico:**
${specSubtopicStr}

Esse conteúdo foi escolhido porque faz parte do seu cronograma de hoje (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}) e é sua meta ativa.

Depois continue com:
${secondaryTopics.length > 0 ? secondaryTopics.map(t => {
  const sub = t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames.join(', ') : t.parentTopicName;
  return `• **${t.category}:** ${sub}`;
}).join('\n') : `• **Legislação Educacional / Didática:** Leis do CE e LDB\n• **Revisão Espaçada:** Questões da FUNECE`}`;
      } else if (lowerMsg.includes('atrasad') || lowerMsg.includes('atraso') || lowerMsg.includes('pendent')) {
        if (overdueItems.length === 0) {
          replyText = `🎉 **Você está 100% em dia com seu cronograma até hoje!**\n\nTodas as metas de **${userSubject}** do seu cronograma de hoje (${currentDay?.displayDate || 'Hoje'}) e de dias anteriores já foram marcadas como concluídas no sistema!`;
        } else {
          const formattedOverdue = overdueItems.map(item => 
            `• **Dia ${item.dayNumber} (${item.displayDate}) - ${item.category}:**\n  - **Tópico:** ${item.parentTopicName}\n  - **Subtópico Pendente:** ${item.subtopicName}`
          ).join('\n\n');
          
          replyText = `⚠️ **Análise de Matérias Pendentes / Atrasadas (Até Hoje)**\n\nVocê possui **${overdueItems.length} subtópicos pendentes** de conclusão no seu cronograma do dia atual e de dias anteriores:\n\n${formattedOverdue}\n\n💡 **Orientação do Mentor:** Finalize estes subtópicos para manter sua preparação no ritmo ideal para a FUNECE!`;
        }
      } else if (lowerMsg.includes('progresso') || lowerMsg.includes('como estou indo') || lowerMsg.includes('desempenho')) {
        const metaSubtopics = currentDay?.topics.map(t => t.subtopicNames?.length ? t.subtopicNames.join(', ') : t.parentTopicName).join(' • ');
        replyText = `📊 **Seu Desempenho Real no Sistema**\n\n• **Disciplina Alvo:** ${userSubject}\n• **Edital Concluído:** ${completedCount} de ${totalSubtopics} subtópicos (${progressPercent}%)\n• **Dia Atual no Cronograma:** Dia ${currentDay?.dayNumber || 1} (${currentDay?.displayDate || 'Hoje'})\n• **Meta de Subtópicos de Hoje:** ${metaSubtopics}`;
      } else if (lowerMsg.includes('pior assunto') || lowerMsg.includes('dificuldade')) {
        const firstSubtopic = currentDay?.topics[0]?.subtopicNames?.[0] || currentDay?.topics[0]?.parentTopicName || 'Conteúdos Específicos';
        replyText = `🎯 **Análise de Desempenho**\n\nCom base nos dados do sistema, o subtópico priorizado no seu cronograma ativo de **${userSubject}** é: **${firstSubtopic}**.\n\nSua prioridade hoje (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}) é concluir esta meta!`;
      } else if (lowerMsg.includes('revisar') || lowerMsg.includes('revisão')) {
        replyText = `📚 **Revisão Pendente do Cronograma**\n\nSua revisão pendente de hoje (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}) engloba os subtópicos:\n${currentDay?.topics.map(t => `• **${t.parentTopicName}:** ${t.subtopicNames?.length ? t.subtopicNames.join(', ') : t.parentTopicName}`).join('\n')}\n\nDeseja realizar questões sobre essa meta agora?`;
      } else {
        const firstSubtopic = currentDay?.topics[0]?.subtopicNames?.[0] || currentDay?.topics[0]?.parentTopicName || userSubject;
        replyText = `Prof. ${userName}, sobre **"${text.trim()}"**:\n\n1. **Referência no Cronograma (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}):** Assunto diretamente ligado ao subtópico **${firstSubtopic}**.\n2. **Orientação FUNECE:** Foco direto nos conceitos científicos e pegadinhas da banca.\n\n*(Se desejar uma explicação teórica sobre isso, me diga: "Explique ${firstSubtopic}")*`;
      }

      const aiMsg: TutorChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 flex flex-col h-[78vh]">
      {/* Header */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-emerald-100 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-800 to-teal-900 text-amber-300 rounded-xl shadow-xs">
            <GraduationCap size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-zinc-900">Professor Mentor IA</h2>
            <p className="text-[11px] text-zinc-500 font-medium">Mentor Pedagógico Conectado ao Cronograma Oficial FUNECE / SEDUC CE</p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
          Ativo
        </span>
      </div>

      {/* Live Cronograma Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-2xl p-3 border border-emerald-700/80 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-amber-400 text-emerald-950 rounded-xl font-black text-xs flex items-center gap-1 shrink-0">
            <Calendar size={14} />
            <span>Dia {currentDay?.dayNumber || 1}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1">
              <Sparkles size={12} />
              <span>Cronograma Conectado: {userSubject}</span>
            </p>
            <p className="text-[10px] text-emerald-100/90 font-medium truncate">
              <strong>Meta de Hoje:</strong> {currentDay?.topics.map(t => `${t.parentTopicName}`).join(' • ') || 'Carregando metas do dia...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black bg-emerald-800/80 text-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-700">
            {completedCount}/{totalSubtopics} Subtópicos ({progressPercent}%)
          </span>
          {setActiveTab && (
            <button
              onClick={() => setActiveTab('cronograma')}
              className="text-[10px] font-black bg-white text-emerald-950 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>Ver Cronograma</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={loading}
            className="px-3 py-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-950 text-[11px] font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="flex-1 bg-white rounded-2xl p-4 border border-emerald-100/90 shadow-xs overflow-y-auto space-y-3 scrollbar-thin">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
                isUser ? 'bg-emerald-800 text-white' : 'bg-amber-400 text-emerald-950 font-black'
              }`}>
                {isUser ? <UserIcon size={14} /> : <GraduationCap size={15} />}
              </div>

              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-1 ${
                isUser 
                  ? 'bg-emerald-800 text-white rounded-tr-none shadow-xs' 
                  : 'bg-zinc-50 text-zinc-800 border border-zinc-200/80 rounded-tl-none'
              }`}>
                <div className="markdown-body">
                  <Markdown
                    components={{
                      p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed whitespace-pre-wrap">{children}</p>,
                      strong: ({ children }) => <strong className={`font-black ${isUser ? 'text-amber-300' : 'text-zinc-950'}`}>{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1.5">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>
                <p className={`text-[9px] text-right font-medium ${isUser ? 'text-emerald-200' : 'text-zinc-400'}`}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 font-extrabold p-2.5 bg-emerald-50 rounded-2xl w-fit animate-pulse border border-emerald-200">
            <GraduationCap size={16} className="text-amber-600" />
            <span>Professor Mentor IA consultando seu Cronograma e Legislação FUNECE...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="flex gap-2 shrink-0 pt-1"
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte ao Mentor sobre seu Cronograma, dúvidas da matéria ou legislação..."
          disabled={loading}
          className="flex-1 bg-white border border-emerald-200 rounded-2xl px-4 py-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-600 transition-colors shadow-xs font-medium"
        />

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className={`px-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-amber-300 font-extrabold rounded-2xl flex items-center justify-center transition-all border-0 cursor-pointer shadow-md ${
            loading || !inputText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
          }`}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
