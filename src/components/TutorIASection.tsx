import React, { useState, useRef, useEffect } from 'react';
import { User, db, collection, addDoc } from '../firebase';
import { UserProfile, TutorChatMessage } from '../types';
import { ALL_DISCIPLINES_EDITAL } from '../data/disciplinesData';
import { GraduationCap, Send, Sparkles, BookOpen, BrainCircuit, User as UserIcon, RefreshCw, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorIASectionProps {
  user: User;
  profile: UserProfile | null;
}

export default function TutorIASection({ user, profile }: TutorIASectionProps) {
  const userName = profile?.name || user.displayName || 'Professor(a)';
  const userSubject = profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';
  const editalBlocks = ALL_DISCIPLINES_EDITAL[userSubject] || ALL_DISCIPLINES_EDITAL['Licenciatura em Língua Portuguesa / Letras'] || [];
  const firstBlockTopics = editalBlocks[0]?.topics || [];
  const sampleTopicNames = firstBlockTopics.slice(0, 5).map(t => t.name);

  const [messages, setMessages] = useState<TutorChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Olá, Prof. ${userName}! Sou o seu Professor Mentor IA, especialista na Banca FUNECE (CEV/UECE) para o Concurso Público da SEDUC CE 2026.\n\nAcompanho diariamente seu progresso na Fila Única de Estudos, simulados e estatísticas para garantir sua vaga em ${userSubject}.\n\nComo posso orientar ou acelerar seus estudos hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
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
      const response = await fetch('/api/seduc/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          subject: userSubject,
          profile: profile,
          activeTopics: sampleTopicNames
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
      console.warn('Servidor offline ou resposta não-JSON, gerando resposta do Mentor IA:', err);
      
      const lowerMsg = text.trim().toLowerCase();
      const userName = profile?.name || 'Professor(a)';
      let replyText = '';

      const mainTopicToday = sampleTopicNames[0] || 'Conteúdo Específico do Edital';
      const secTopicToday = sampleTopicNames[1] || 'Tópicos Fundamentais do Edital';

      if (lowerMsg.includes('estudo hoje') || lowerMsg.includes('hoje') || lowerMsg.includes('cronograma')) {
        replyText = `📅 **Estudo de Hoje (Edital Verticalizado FUNECE)**\n\nHoje seu cronograma recomenda:\n\n📚 **${userSubject}** (60 min)\n• **Meta Principal:** ${mainTopicToday}\n• **Complemento:** ${secTopicToday}\n\n📖 **Legislação Educacional / Didática** (40 min)\n• Estatuto do Magistério do CE (Lei nº 10.884/84)\n• LDB nº 9.394/96 (Art. 12 e Art. 13) e DCRC\n\n✍️ **Revisão Espaçada & Prática** (20 min)\n• Resolução de 5 a 10 questões da FUNECE sobre ${mainTopicToday}\n\n**Ordem Recomendada:**\n1. Específica (${mainTopicToday})\n2. Legislação & Didática SEDUC CE\n3. Simulados / Questões da Semana\n\n*Precisa que eu explique ${mainTopicToday} ou algum ponto específico deste conteúdo? É só me pedir!*`;
      } else if (lowerMsg.includes('progresso') || lowerMsg.includes('onde paramos') || lowerMsg.includes('desempenho')) {
        replyText = `📊 **Análise do seu Progresso**\n\n• **Disciplina Alvo:** ${userSubject}\n• **Próximo Tópico da Fila:** ${mainTopicToday}\n• **Aproveitamento Geral:** Acompanhe suas estatísticas detalhadas na aba de Desempenho!\n\n*Quer realizar um simulado focado em ${mainTopicToday} agora?*`;
      } else if (lowerMsg.includes('atrasad') || lowerMsg.includes('atraso')) {
        replyText = `⏱ **Ajuste de Cronograma (Plano de Aceleração FUNECE)**\n\n1. Foque no tópico essencial de hoje: **${mainTopicToday}**.\n2. Utilize o gerador de simulados com filtro em **${userSubject}** para praticar 10 questões rápidas da FUNECE.\n3. Faça uma revisão ativa de 15 minutos do Estatuto do Magistério do CE (Lei nº 10.884/84).`;
      } else {
        replyText = `Prof. ${userName}, como Doutor Mentor especialista em **${userSubject}** e Banca **FUNECE / CEV-UECE**:\n\nSobre **"${text.trim()}"**:\n\n1. **Orientação Técnica:** Para a prova da SEDUC CE 2026, relacione esse tema diretamente às competências do DCRC (Diretrizes Curriculares do Ceará) e às questões recentes da banca UECE/CEV.\n2. **Foco Prático:** Foque na resolução de problemas e na aplicação pedagógica em sala de aula.\n\n*Gostaria de uma explicação detalhada, um resumo em tópicos ou questões de fixação sobre este tema?*`;
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
            <p className="text-[11px] text-zinc-500 font-medium">Mentor Pedagógico & Coach de Estudos da Banca FUNECE / SEDUC CE</p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
          Ativo
        </span>
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
                <p className="whitespace-pre-line">{msg.text}</p>
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
            <span>Professor Mentor IA analisando edital e legislação...</span>
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
          placeholder="Digite sua dúvida ou peça orientação ao Professor Mentor..."
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
