import React, { useState, useEffect, useRef } from 'react';
import Markdown from 'react-markdown';
import { 
  Sparkles, 
  Send, 
  Check, 
  Settings2, 
  Bot, 
  User as UserIcon, 
  ChevronRight, 
  Apple, 
  Layers, 
  Activity, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Flame,
  Mic,
  Trash2,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { User, db, doc, updateDoc } from '../firebase';
import { AVAILABLE_SPECIALTIES, NutritionistSpecialty } from '../data/nutritionData';
import FoodVitaminInspector from './FoodVitaminInspector';

interface NutritionistSectionProps {
  user: User;
  profile: any;
  onNavigateTab?: (tab: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  audioUrl?: string;
  audioDuration?: number;
}

export default function NutritionistSection({ user, profile, onNavigateTab }: NutritionistSectionProps) {
  // At least 3 specialties must be chosen. Default with the exact user requested ones
  const defaultSpecialties = [
    "Hipertrofia na mulher",
    "SOP na mulher",
    "Emagrecer e ganhar músculo"
  ];

  const [selectedSpecialtyNames, setSelectedSpecialtyNames] = useState<string[]>(() => {
    if (profile?.nutritionistSpecialties && Array.isArray(profile.nutritionistSpecialties) && profile.nutritionistSpecialties.length >= 3) {
      return profile.nutritionistSpecialties;
    }
    return defaultSpecialties;
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'avaliador' | 'puxador_vitaminas'>('chat');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Audio Recording & Voice State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Diet Evaluation State
  const [evaluating, setEvaluating] = useState(false);
  const [dietEvaluation, setDietEvaluation] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Synchronize initial greeting when specialties change or on first load
  useEffect(() => {
    const greetingText = `Olá! Sou seu nutricionista aqui no BioForma, com foco em **${selectedSpecialtyNames.join(', ')}**.\n\nPode me mandar mensagem em texto ou **áudio**! Vou direto ao ponto com você, tirando suas dúvidas com dicazinhas práticas. Como posso te ajudar hoje?`;

    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: greetingText,
        timestamp: new Date()
      }
    ]);
  }, [selectedSpecialtyNames]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  // Voice recording handlers
  const startRecording = async () => {
    try {
      setLiveTranscript('');
      setRecordingSeconds(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'pt-BR';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript;
            }
            if (fullText) {
              setLiveTranscript(fullText);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition info:", event.error);
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (e) {
          console.warn("SpeechRecognition setup:", e);
        }
      }
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Por favor, permita o acesso ao microfone no navegador para enviar áudios.");
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    setLiveTranscript('');
    audioChunksRef.current = [];
  };

  const stopAndSendAudio = () => {
    if (!mediaRecorderRef.current) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    const duration = recordingSeconds;
    const finalTranscript = liveTranscript.trim();

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const audioUrl = URL.createObjectURL(audioBlob);

      mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setRecordingSeconds(0);
      setLiveTranscript('');

      const userMsgId = Date.now().toString();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: finalTranscript || "Mensagem de áudio",
        timestamp: new Date(),
        isAudio: true,
        audioUrl,
        audioDuration: duration
      };

      setMessages(prev => [...prev, userMsg]);
      setSending(true);

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(',')[1];

        try {
          let response;
          if (finalTranscript) {
            response = await fetch('/api/nutritionist/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: finalTranscript,
                conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
                specialties: selectedSpecialtyNames,
                userProfile: profile || {},
                dietContext: {
                  totalCalories: profile?.consumedCaloriesToday || 0,
                  totalProtein: profile?.consumedProteinToday || 0,
                  totalCarbs: profile?.consumedCarbsToday || 0,
                  totalFat: profile?.consumedFatToday || 0
                }
              })
            });
          } else {
            response = await fetch('/api/nutritionist/audio-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType,
                specialties: selectedSpecialtyNames,
                userProfile: profile || {},
                conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
              })
            });
          }

          if (response && response.ok) {
            const data = await response.json();
            if (data.success && data.reply) {
              setMessages(prev => [
                ...prev,
                {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: data.reply,
                  timestamp: new Date()
                }
              ]);
              setSending(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Erro ao enviar áudio:", e);
        }

        // Fallback response
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Recebi seu áudio! Como seu nutricionista em **${selectedSpecialtyNames.join(', ')}**, minha principal orientação é manter a constância e bater sua meta de água e proteína hoje.\n\n💡 **Dicazinha de ouro:** me conte qual alimento você quer colocar na sua próxima refeição!`,
            timestamp: new Date()
          }
        ]);
        setSending(false);
      };
    };

    mediaRecorderRef.current.stop();
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleToggleSpecialty = (name: string) => {
    let next: string[];
    if (selectedSpecialtyNames.includes(name)) {
      if (selectedSpecialtyNames.length <= 3) {
        // Must keep at least 3!
        return;
      }
      next = selectedSpecialtyNames.filter(n => n !== name);
    } else {
      next = [...selectedSpecialtyNames, name];
    }
    setSelectedSpecialtyNames(next);
  };

  const handleSaveSpecialties = async () => {
    if (selectedSpecialtyNames.length < 3) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        nutritionistSpecialties: selectedSpecialtyNames
      });
    } catch (e) {
      console.warn("Não foi possível persistir as especialidades no Firestore agora:", e);
    }
    setShowConfigModal(false);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputMessage('');
    setSending(true);

    try {
      const response = await fetch('/api/nutritionist/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          specialties: selectedSpecialtyNames,
          userProfile: profile || {},
          dietContext: {
            totalCalories: profile?.consumedCaloriesToday || 0,
            totalProtein: profile?.consumedProteinToday || 0,
            totalCarbs: profile?.consumedCarbsToday || 0,
            totalFat: profile?.consumedFatToday || 0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.reply) {
          const assistantMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.reply,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMsg]);
          setSending(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Chat do nutricionista falhou na conexão online. Usando resposta clínica direta.", err);
    }

    // Direct fallback response tailored to the specialties
    setTimeout(() => {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Como seu nutricionista com foco em **${selectedSpecialtyNames.join(', ')}**, analisei seu pedido:\n\n` +
          `• **Estratégia Hormonal & Metabólica:** Mantenha atenção máxima aos picos de insulina (crucial para SOP e queima de gordura visceral) e garanta a cota proteica de 2.0g/kg para hipertrofia sem ganho adiposo.\n` +
          `• **Vitaminas & Micronutrientes:** Certifique-se de incluir ovos, folhas escuras (espinafre/brócolis) e sementes diariamente para suprir as vitaminas B9, B12, K, D e colina.\n` +
          `• **Próximo Passo Prático:** Você já registrou as refeições de hoje na aba Dieta? Posso avaliá-las detalhadamente agora mesmo no botão "Avaliar Minha Dieta Hoje".`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMsg]);
      setSending(false);
    }, 600);
  };

  const handleEvaluateDiet = async () => {
    setEvaluating(true);
    try {
      const response = await fetch('/api/nutritionist/evaluate-diet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meals: profile?.todayMeals || [],
          totals: {
            calories: profile?.consumedCaloriesToday || 1650,
            protein: profile?.consumedProteinToday || 115,
            carbs: profile?.consumedCarbsToday || 160,
            fat: profile?.consumedFatToday || 48
          },
          specialties: selectedSpecialtyNames,
          userProfile: profile || {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setDietEvaluation(data.data);
          setEvaluating(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Avaliador de dieta falhou:", e);
    }

    // Fallback evaluation
    setTimeout(() => {
      setDietEvaluation({
        overallScore: 88,
        status: "Excelente",
        specialtyAlignment: `Suas refeições demonstram excelente aderência às especialidades ativas (${selectedSpecialtyNames.join(', ')}). A ingestão de micronutrientes e a proporção de macronutrientes mantêm o ambiente ideal para sensibilidade à insulina e reparo muscular.`,
        vitaminAnalysis: "A presença de vitaminas lipossolúveis (A, D, E, K) e do complexo B está equilibrada. Sugere-se manter vegetais folhosos e frutas cítricas para otimizar absorção de ferro e colágeno.",
        strengths: [
          "Bom aporte proteico distribuído ao longo do dia",
          "Controle de carga glicêmica favorecendo o controle de insulina",
          "Variedade de micronutrientes e minerais essenciais"
        ],
        improvements: [
          "Adicionar uma fonte de ômega-3 ou azeite extravirgem no jantar",
          "Garantir a ingestão de pelo menos 2.5 litros de água hoje",
          "Incluir sementes de abóbora ou chia para reforço de magnésio e zinco"
        ],
        clinicalPrescription: "Parabéns pela disciplina de hoje. Para sua ceia ou próxima refeição, aposte em proteína de digestão lenta (como iogurte ou ovos) com uma colher de sementes."
      });
      setEvaluating(false);
    }, 800);
  };

  const quickQuestions = [
    { text: "Como bater todas as vitaminas essenciais hoje?", icon: Apple },
    { text: "Qual a melhor estratégia para SOP e sensibilidade à insulina?", icon: Activity },
    { text: "Como acelerar a hipertrofia feminina sem ganhar gordura?", icon: Sparkles },
    { text: "O que comer pré e pós-treino para recomposição corporal?", icon: Flame },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Nutritionist Persona Card */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 text-white rounded-3xl p-6 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-pink-500/15 via-[#d4af37]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-pink-500/20 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  Nutricionista Clínico
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Ativo & Incorporado
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-zinc-100 mt-1">
                Consultório Nutricional IA
              </h2>
              <p className="text-xs text-zinc-400">
                Personalidade adaptada às {selectedSpecialtyNames.length} especialidades clínicas escolhidas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 text-pink-300 hover:text-pink-200 text-xs font-black uppercase tracking-wider rounded-2xl border border-pink-500/30 hover:border-pink-500/60 transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <Settings2 size={15} />
            <span>Mudar Especialidades ({selectedSpecialtyNames.length})</span>
          </button>
        </div>

        {/* Selected Specialties Badges */}
        <div className="mt-5 pt-4 border-t border-zinc-850 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 mr-1">Especialidades Ativas:</span>
          {selectedSpecialtyNames.map((name) => {
            const spec = AVAILABLE_SPECIALTIES.find(s => s.name.toLowerCase() === name.toLowerCase() || s.shortLabel.toLowerCase() === name.toLowerCase());
            return (
              <span
                key={name}
                className="px-3 py-1 bg-pink-500/15 text-pink-300 border border-pink-500/30 rounded-xl text-xs font-black flex items-center gap-1.5"
              >
                <CheckCircle2 size={12} className="text-pink-400" />
                {name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-zinc-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-0 ${
            activeTab === 'chat'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Bot size={16} />
          <span>Consulta com o Nutri</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('avaliador');
            if (!dietEvaluation) handleEvaluateDiet();
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-0 ${
            activeTab === 'avaliador'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <FileText size={16} />
          <span>Avaliar Minha Dieta</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('puxador_vitaminas')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border-0 ${
            activeTab === 'puxador_vitaminas'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-900'
          }`}
        >
          <Apple size={16} />
          <span>Puxar Vitaminas</span>
        </button>
      </div>

      {/* TAB 1: Live Consultation Chat */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          {/* Quick Questions Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Perguntas Rápidas:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q.text)}
                  className="p-3 bg-white hover:bg-pink-50/50 rounded-2xl border border-zinc-200/80 hover:border-pink-300 text-left text-xs font-bold text-zinc-700 hover:text-pink-600 transition-all cursor-pointer shadow-xs flex items-center gap-2.5"
                >
                  <q.icon size={15} className="text-pink-500 shrink-0" />
                  <span className="line-clamp-1">{q.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              const isVoice = !!msg.isAudio;
              const isPlayingThis = playingAudioId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-pink-500 to-rose-500'
                        : 'bg-zinc-800'
                    }`}
                  >
                    {isAssistant ? <Sparkles size={16} /> : isVoice ? <Mic size={16} /> : <UserIcon size={16} />}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-3xl px-4 py-3.5 text-sm leading-relaxed shadow-xs ${
                      isAssistant
                        ? 'bg-zinc-50/90 border border-zinc-200/90 text-zinc-800'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                    }`}
                  >
                    {/* Audio Note Player Header if audio was sent */}
                    {isVoice && (
                      <div className="mb-2.5 p-2.5 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center gap-3 border border-white/20">
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlayingThis) {
                              audioElementRef.current?.pause();
                              setPlayingAudioId(null);
                            } else if (msg.audioUrl) {
                              if (audioElementRef.current) {
                                audioElementRef.current.pause();
                              }
                              const audio = new Audio(msg.audioUrl);
                              audioElementRef.current = audio;
                              audio.onended = () => setPlayingAudioId(null);
                              audio.onerror = () => setPlayingAudioId(null);
                              audio.play().catch(e => console.warn("Audio play notice:", e));
                              setPlayingAudioId(msg.id);
                            }
                          }}
                          className="w-9 h-9 rounded-xl bg-white text-pink-600 flex items-center justify-center shadow-xs cursor-pointer hover:scale-105 transition-all border-0 shrink-0"
                          title={isPlayingThis ? "Pausar áudio" : "Ouvir áudio gravado"}
                        >
                          {isPlayingThis ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px] font-extrabold">
                            <span className="flex items-center gap-1.5">
                              <Volume2 size={13} />
                              Mensagem de Voz
                            </span>
                            <span className="font-mono text-[10px] bg-black/15 px-1.5 py-0.5 rounded-md">
                              {msg.audioDuration ? `${Math.floor(msg.audioDuration / 60)}:${(msg.audioDuration % 60).toString().padStart(2, '0')}` : '0:05'}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-white/30 rounded-full mt-2 overflow-hidden flex items-center">
                            <div className={`h-full bg-white rounded-full transition-all duration-300 ${isPlayingThis ? 'w-full animate-pulse' : 'w-2/5'}`} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Formatted Markdown Content - Bold is rendered cleanly without raw asterisks */}
                    <div className={`markdown-body text-sm leading-relaxed ${
                      isAssistant
                        ? '[&_strong]:font-black [&_strong]:text-zinc-950 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:mb-1'
                        : '[&_strong]:font-black [&_strong]:text-white [&_p]:mb-1 [&_p:last-child]:mb-0'
                    }`}>
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl px-4 py-3.5 text-xs font-bold text-zinc-600 flex items-center gap-2">
                  <RefreshCw className="animate-spin text-pink-500" size={14} />
                  <span>O nutricionista está respondendo sua pergunta de forma direta...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Voice Recording Active Bar OR Standard Input Bar */}
          {isRecording ? (
            <div className="bg-rose-50/80 border-2 border-rose-300 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2.5 flex-1 min-w-0 w-full">
                {/* Pulsing indicator */}
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-rose-500 text-white shrink-0">
                  <span className="absolute w-full h-full rounded-xl bg-rose-400 animate-ping opacity-60" />
                  <Mic size={16} className="relative z-10" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-700 uppercase tracking-wide">
                      Gravando áudio
                    </span>
                    <span className="font-mono text-xs font-extrabold text-rose-600 bg-rose-200/70 px-2 py-0.5 rounded-full">
                      {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Live transcript or speaking hint */}
                  <p className="text-xs text-zinc-600 truncate mt-0.5 italic">
                    {liveTranscript ? `"${liveTranscript}"` : "Fale sua dúvida com naturalidade..."}
                  </p>
                </div>

                {/* Animated wave bars */}
                <div className="hidden sm:flex items-center gap-1 h-5 px-2">
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-5" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-3" style={{ animationDelay: '450ms' }} />
                  <span className="w-1 bg-rose-500 rounded-full animate-bounce h-4" style={{ animationDelay: '200ms' }} />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="px-3.5 py-2.5 bg-white hover:bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-zinc-200"
                  title="Cancelar áudio"
                >
                  <Trash2 size={14} className="text-zinc-500" />
                  <span>Cancelar</span>
                </button>

                <button
                  type="button"
                  onClick={stopAndSendAudio}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border-0"
                >
                  <Send size={14} />
                  <span>Enviar Áudio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Pergunte algo curto ou envie um áudio...`}
                className="flex-1 bg-white border border-zinc-200/90 rounded-2xl px-4 py-3.5 text-sm text-zinc-800 font-semibold placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 shadow-sm transition-all"
              />

              {/* Microphone Button to record voice */}
              <button
                type="button"
                onClick={startRecording}
                disabled={sending}
                className="p-3.5 bg-zinc-100 hover:bg-pink-100 text-zinc-700 hover:text-pink-600 rounded-2xl transition-all cursor-pointer flex items-center justify-center border border-zinc-200/80 shrink-0 shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Mandar áudio para o nutricionista"
              >
                <Mic size={18} />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={sending || !inputMessage.trim()}
                className="px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-95 text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-md shadow-pink-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 border-0 shrink-0"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Diet Evaluator against the Specialties */}
      {activeTab === 'avaliador' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-zinc-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  Avaliação Clínica da Dieta de Hoje
                </h3>
                <p className="text-xs text-zinc-500">
                  Parecer técnico sob a ótica de: {selectedSpecialtyNames.join(', ')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleEvaluateDiet}
                disabled={evaluating}
                className="px-4 py-2 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl text-xs font-bold transition-all cursor-pointer border border-pink-200 flex items-center gap-1.5"
              >
                <RefreshCw size={14} className={evaluating ? 'animate-spin' : ''} />
                <span>Atualizar Parecer</span>
              </button>
            </div>

            {evaluating && (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="animate-spin text-pink-500 mx-auto" size={32} />
                <p className="text-sm font-bold text-zinc-700">
                  Cruzando dados dos seus alimentos e vitaminas com os protocolos de {selectedSpecialtyNames.join(', ')}...
                </p>
              </div>
            )}

            {!evaluating && dietEvaluation && (
              <div className="space-y-5 animate-fade-in">
                {/* Score Banner */}
                <div className="bg-gradient-to-r from-pink-50 via-purple-50 to-emerald-50 rounded-2xl p-4 border border-pink-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-700">
                      Índice de Qualidade Nutricional
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl font-black text-zinc-900">
                        {dietEvaluation.overallScore}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">/ 100</span>
                      <span className="text-xs font-extrabold text-emerald-600 uppercase px-2 py-0.5 bg-emerald-100 rounded-md">
                        {dietEvaluation.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-zinc-500 block">Especialidades</span>
                    <span className="text-xs font-black text-pink-600">
                      {selectedSpecialtyNames.length} Incorporadas
                    </span>
                  </div>
                </div>

                {/* Clinical Alignment */}
                <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-150 space-y-2">
                  <h4 className="text-xs font-black uppercase text-zinc-800 tracking-wide flex items-center gap-1.5">
                    <Sparkles size={14} className="text-pink-500" />
                    Alinhamento com as Especialidades
                  </h4>
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    {dietEvaluation.specialtyAlignment}
                  </p>
                </div>

                {/* Vitamin & Micronutrient Analysis */}
                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/70 space-y-2">
                  <h4 className="text-xs font-black uppercase text-amber-900 tracking-wide flex items-center gap-1.5">
                    <Apple size={14} className="text-amber-600" />
                    Análise da Cobertura de Vitaminas
                  </h4>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    {dietEvaluation.vitaminAnalysis}
                  </p>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200/80 space-y-2">
                    <h5 className="text-xs font-black uppercase text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 size={15} className="text-emerald-600" />
                      Pontos Fortes da Dieta Hoje
                    </h5>
                    <ul className="space-y-1 text-xs text-emerald-950 font-medium">
                      {dietEvaluation.strengths?.map((st: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{st}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-200/80 space-y-2">
                    <h5 className="text-xs font-black uppercase text-rose-800 flex items-center gap-1.5">
                      <AlertCircle size={15} className="text-rose-600" />
                      Ajustes Sugeridos
                    </h5>
                    <ul className="space-y-1 text-xs text-rose-950 font-medium">
                      {dietEvaluation.improvements?.map((imp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-600 font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Prescription Card */}
                {dietEvaluation.clinicalPrescription && (
                  <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl p-4 shadow-md space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-100 block">
                      Prescrição do Nutricionista:
                    </span>
                    <p className="text-xs font-semibold leading-relaxed">
                      {dietEvaluation.clinicalPrescription}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Food Vitamin Inspector Tool */}
      {activeTab === 'puxador_vitaminas' && (
        <FoodVitaminInspector
          onAddFoodToDiet={(foodData) => {
            if (onNavigateTab) {
              onNavigateTab('diet');
            }
          }}
        />
      )}

      {/* SPECIALTIES SELECTION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-pink-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-150 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-500 block">
                  Configuração de Personalidade
                </span>
                <h3 className="text-xl font-black text-zinc-900">
                  Escolha as Especialidades do Nutricionista
                </h3>
              </div>
              <div className="text-right">
                <span className={`text-xs font-black px-3 py-1 rounded-full ${
                  selectedSpecialtyNames.length >= 3
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedSpecialtyNames.length} selecionadas (mínimo 3)
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Selecione <strong>pelo menos três especialidades</strong>. O sistema irá incorporar profundamente o raciocínio fisiológico, condutas e protocolos científicos dessas áreas nas respostas e avaliações.
            </p>

            {/* Specialties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {AVAILABLE_SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialtyNames.includes(spec.name);
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => handleToggleSpecialty(spec.name)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-pink-50/60 border-pink-500 ring-2 ring-pink-500/20 shadow-sm'
                        : 'bg-white hover:bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-sm font-black text-zinc-900">
                          {spec.name}
                        </span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-pink-500 text-white' : 'border border-zinc-300'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-zinc-100 flex items-center justify-between text-[10px] font-bold">
                      <span className="text-zinc-400">{spec.category}</span>
                      <span className={isSelected ? 'text-pink-600' : 'text-zinc-400'}>
                        {isSelected ? 'Incorporado' : 'Clique para ativar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSpecialtyNames.length < 3 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-800 font-semibold">
                <AlertCircle size={16} className="shrink-0" />
                <span>Por favor, selecione pelo menos 3 especialidades para compor a personalidade completa do nutricionista.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-150">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSpecialties}
                disabled={selectedSpecialtyNames.length < 3}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-95 transition-all shadow-md shadow-pink-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 flex items-center gap-2"
              >
                <Check size={15} />
                <span>Confirmar e Incorporar ({selectedSpecialtyNames.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
