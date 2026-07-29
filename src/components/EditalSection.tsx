import React, { useState, useEffect } from 'react';
import { User, db, doc, setDoc, collection, query, where, getDocs } from '../firebase';
import { UserProfile, EditalBlock, EditalTopicItem, EditalSubtopic, TopicStatus, GeneralCategoryKey } from '../types';
import { OFFICIAL_EDITAL_TREE, getBlocksForDegree } from '../data/seducData';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Printer, 
  Sparkles, 
  Bot, 
  HelpCircle, 
  GraduationCap, 
  FileText,
  Layers,
  Search,
  Award,
  Highlighter,
  CheckSquare,
  Square,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditalSectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
}

export default function EditalSection({ user, profile, setActiveTab }: EditalSectionProps) {
  // Estado para selecionar Botão 1 (especifico) ou Botão 2 (geral)
  const [activeMainCategory, setActiveMainCategory] = useState<'especifico' | 'geral'>('especifico');

  // Área Geral Selecionada
  const [selectedGeneralArea, setSelectedGeneralArea] = useState<GeneralCategoryKey>(
    'Educação Brasileira: Temas Educacionais e Pedagógicos'
  );

  // Estados de Expansão de Blocos e Tópicos (Tópicos começam FECHADOS por padrão)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Progresso individual dos tópicos/subtópicos armazenado no componente
  const uid = user?.uid || profile?.uid || 'guest';
  const storageKey = `studyProgress_${uid}`;

  const [statusMap, setStatusMap] = useState<Record<string, TopicStatus>>(() => {
    try {
      const local = localStorage.getItem(storageKey);
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  const userDegree = profile?.degree || profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';

  // Carregar progresso salvo do Firestore / LocalStorage no carregamento
  useEffect(() => {
    const loadProgress = async () => {
      // 1. Try local storage first
      try {
        const local = localStorage.getItem(storageKey);
        if (local) {
          setStatusMap(JSON.parse(local));
        }
      } catch (_) {}

      // 2. Fetch from Firestore if user.uid exists
      if (user?.uid) {
        try {
          const q = query(collection(db, 'studyProgress'), where('uid', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const newStatusMap: Record<string, TopicStatus> = {};
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.itemId && data.status) {
              newStatusMap[data.itemId] = data.status as TopicStatus;
            }
          });
          if (Object.keys(newStatusMap).length > 0) {
            setStatusMap(prev => {
              const merged = { ...prev, ...newStatusMap };
              try {
                localStorage.setItem(storageKey, JSON.stringify(merged));
              } catch (_) {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Erro ao carregar progresso:', err);
        }
      }
    };
    loadProgress();

    const handleProgressUpdate = () => {
      try {
        const local = localStorage.getItem(storageKey) || localStorage.getItem('studyProgress_guest');
        if (local) {
          setStatusMap(JSON.parse(local));
        }
      } catch (_) {}
    };

    window.addEventListener('studyProgressUpdated', handleProgressUpdate);
    window.addEventListener('storage', handleProgressUpdate);

    return () => {
      window.removeEventListener('studyProgressUpdated', handleProgressUpdate);
      window.removeEventListener('storage', handleProgressUpdate);
    };
  }, [user?.uid, storageKey]);

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleStatusUpdate = async (id: string, newStatus: TopicStatus) => {
    setStatusMap(prev => {
      const updated = { ...prev, [id]: newStatus };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    if (user?.uid) {
      try {
        const userProgressRef = doc(db, 'studyProgress', `${user.uid}_${id}`);
        await setDoc(userProgressRef, {
          uid: user.uid,
          itemId: id,
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Erro ao atualizar progresso do tópico:', err);
      }
    }
  };

  const getItemStatus = (id: string): TopicStatus => {
    return statusMap[id] || 'not_started';
  };

  const handleToggleGrifarSubtopic = (id: string, currentStatus: TopicStatus) => {
    const isGrifado = currentStatus === 'mastered' || currentStatus === 'reviewed' || currentStatus === 'in_progress';
    const nextStatus: TopicStatus = isGrifado ? 'not_started' : 'mastered';
    handleStatusUpdate(id, nextStatus);
  };

  const handleToggleGrifarTopicAll = (topic: EditalTopicItem) => {
    const subList = topic.subtopics.length > 0 
      ? topic.subtopics 
      : [{ id: topic.id, name: topic.name, status: topic.status || 'not_started' }];

    const allGrifado = subList.every(s => ['mastered', 'reviewed'].includes(getItemStatus(s.id)));
    const targetStatus: TopicStatus = allGrifado ? 'not_started' : 'mastered';

    subList.forEach(s => {
      handleStatusUpdate(s.id, targetStatus);
    });
    if (topic.subtopics.length > 0) {
      handleStatusUpdate(topic.id, targetStatus);
    }
  };

  const handlePrintEdital = () => {
    window.print();
  };

  // Obter Blocos da Área Ativa
  const getCurrentBlocks = (): EditalBlock[] => {
    if (activeMainCategory === 'especifico') {
      return getBlocksForDegree(userDegree);
    } else {
      return OFFICIAL_EDITAL_TREE.geral[selectedGeneralArea] || [];
    }
  };

  const currentBlocks = getCurrentBlocks();

  // Função auxiliar para calcular peso de um status
  const getStatusWeight = (status: TopicStatus): number => {
    if (status === 'mastered' || status === 'reviewed') return 1.0;
    if (status === 'in_progress') return 0.5;
    return 0;
  };

  // Cálculo de Porcentagem de Tópico
  const getTopicStats = (topic: EditalTopicItem) => {
    if (!topic.subtopics || topic.subtopics.length === 0) {
      const st = getItemStatus(topic.id);
      const weight = getStatusWeight(st);
      const isDone = st === 'mastered' || st === 'reviewed';
      return { total: 1, completed: isDone ? 1 : 0, percentage: Math.round(weight * 100) };
    }
    const total = topic.subtopics.length;
    let weightSum = 0;
    let completedCount = 0;
    topic.subtopics.forEach(s => {
      const st = getItemStatus(s.id);
      weightSum += getStatusWeight(st);
      if (st === 'mastered' || st === 'reviewed') {
        completedCount++;
      }
    });
    const percentage = total > 0 ? Math.round((weightSum / total) * 100) : 0;
    return { total, completed: completedCount, percentage };
  };

  // Cálculo de Porcentagem de Bloco
  const getBlockStats = (block: EditalBlock) => {
    let totalSubtopics = 0;
    let weightSum = 0;
    let completedCount = 0;

    block.topics.forEach(t => {
      if (!t.subtopics || t.subtopics.length === 0) {
        totalSubtopics += 1;
        const st = getItemStatus(t.id);
        weightSum += getStatusWeight(st);
        if (st === 'mastered' || st === 'reviewed') completedCount++;
      } else {
        totalSubtopics += t.subtopics.length;
        t.subtopics.forEach(s => {
          const st = getItemStatus(s.id);
          weightSum += getStatusWeight(st);
          if (st === 'mastered' || st === 'reviewed') completedCount++;
        });
      }
    });

    const percentage = totalSubtopics > 0 ? Math.round((weightSum / totalSubtopics) * 100) : 0;
    return { total: totalSubtopics, completed: completedCount, percentage };
  };

  // Cálculo do Progresso Geral do Edital e da Área Ativa
  let globalTotalSubtopics = 0;
  let globalWeightSum = 0;
  let globalCompleted = 0;

  const accumBlocksStats = (blocksList: EditalBlock[]) => {
    blocksList.forEach(b => {
      const stats = getBlockStats(b);
      globalTotalSubtopics += stats.total;
      globalCompleted += stats.completed;
      b.topics.forEach(t => {
        if (!t.subtopics || t.subtopics.length === 0) {
          globalWeightSum += getStatusWeight(getItemStatus(t.id));
        } else {
          t.subtopics.forEach(s => {
            globalWeightSum += getStatusWeight(getItemStatus(s.id));
          });
        }
      });
    });
  };

  accumBlocksStats(getBlocksForDegree(userDegree));
  (Object.keys(OFFICIAL_EDITAL_TREE.geral) as GeneralCategoryKey[]).forEach(key => {
    accumBlocksStats(OFFICIAL_EDITAL_TREE.geral[key]);
  });

  const overallProgress = globalTotalSubtopics > 0 
    ? Math.round((globalWeightSum / globalTotalSubtopics) * 100) 
    : 0;

  // Porcentagem da Área Atual
  let areaTotal = 0;
  let areaWeightSum = 0;
  let areaCompleted = 0;
  currentBlocks.forEach(b => {
    const bStats = getBlockStats(b);
    areaTotal += bStats.total;
    areaCompleted += bStats.completed;
    b.topics.forEach(t => {
      if (!t.subtopics || t.subtopics.length === 0) {
        areaWeightSum += getStatusWeight(getItemStatus(t.id));
      } else {
        t.subtopics.forEach(s => {
          areaWeightSum += getStatusWeight(getItemStatus(s.id));
        });
      }
    });
  });
  const currentAreaProgress = areaTotal > 0 ? Math.round((areaWeightSum / areaTotal) * 100) : 0;

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'mastered':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Dominado</span>;
      case 'reviewed':
        return <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black uppercase">Revisado</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Em Estudo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase">A Estudar</span>;
    }
  };

  const generalAreaKeys: GeneralCategoryKey[] = [
    'Educação Brasileira: Temas Educacionais e Pedagógicos',
    'Administração Pública',
    'Língua Portuguesa',
    'Leitura e Interpretação de Dados e Indicadores Educacionais'
  ];

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Edital Banner */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-700 text-white rounded-2xl shadow-xs print:hidden">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md uppercase">
                  Banca FUNECE / SEDUC CE
                </span>
                <span className="text-[10px] font-bold text-zinc-500">100% Oficial</span>
              </div>
              <h2 className="text-base font-black text-zinc-900">Conteúdo Programático do Edital</h2>
              <p className="text-xs text-zinc-500">Grife os tópicos para acompanhar sua porcentagem de conclusão</p>
            </div>
          </div>

          <div className="flex items-center gap-4 print:hidden">
            <button
              onClick={handlePrintEdital}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-200 cursor-pointer"
              title="Imprimir ou Salvar Edital em PDF"
            >
              <Printer size={15} />
              <span>Imprimir</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase">Edital Completo</p>
              <p className="text-xl font-black text-emerald-700">{overallProgress}%</p>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          {/* Active Area Progress */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <Highlighter size={14} className="text-emerald-700" />
                <span>Área Ativa: {currentAreaProgress}% concluído</span>
              </span>
              <span className="text-[11px] font-extrabold text-emerald-800">{areaCompleted}/{areaTotal} tópicos</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${currentAreaProgress}%` }}
                transition={{ duration: 0.6 }}
                className="bg-emerald-700 h-2 rounded-full"
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-800">
              <span className="flex items-center gap-1.5">
                <BarChart2 size={14} className="text-zinc-600" />
                <span>Domínio Total do Edital: {overallProgress}%</span>
              </span>
              <span className="text-[11px] font-extrabold text-zinc-500">{globalCompleted}/{globalTotalSubtopics} tópicos</span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 h-2 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* OS 2 BOTÕES PRINCIPAIS EXIGIDOS NO PROMPT */}
      <div className="grid grid-cols-2 gap-2.5 print:hidden">
        <button
          onClick={() => setActiveMainCategory('especifico')}
          className={`p-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1.5 border cursor-pointer ${
            activeMainCategory === 'especifico'
              ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
              : 'bg-white text-zinc-700 hover:bg-emerald-50 border-emerald-100 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award size={18} />
            <span className="uppercase tracking-wider">1. CONTEÚDO ESPECÍFICO</span>
          </div>
          <span className={`text-[10px] font-medium ${activeMainCategory === 'especifico' ? 'text-emerald-100' : 'text-zinc-500'}`}>
            50 Questões • Peso 62,5% • Conhecimentos Específicos
          </span>
        </button>

        <button
          onClick={() => setActiveMainCategory('geral')}
          className={`p-4 rounded-2xl font-black text-xs sm:text-sm transition-all flex flex-col items-center justify-center gap-1.5 border cursor-pointer ${
            activeMainCategory === 'geral'
              ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-600/30'
              : 'bg-white text-zinc-700 hover:bg-emerald-50 border-emerald-100 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={18} />
            <span className="uppercase tracking-wider">2. CONTEÚDO GERAL</span>
          </div>
          <span className={`text-[10px] font-medium ${activeMainCategory === 'geral' ? 'text-emerald-100' : 'text-zinc-500'}`}>
            30 Questões • 4 Blocos Obrigatórios da FUNECE
          </span>
        </button>
      </div>

      {/* Se no MODO GERAL: Seleção das 4 Áreas Oficiais */}
      {activeMainCategory === 'geral' && (
        <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3 print:hidden">
          <p className="text-xs font-black uppercase text-emerald-950 tracking-wider">
            SELECIONE A ÁREA DE CONHECIMENTO GERAL:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {generalAreaKeys.map((area) => {
              const isSelected = selectedGeneralArea === area;
              return (
                <button
                  key={area}
                  onClick={() => setSelectedGeneralArea(area)}
                  className={`p-3 rounded-xl text-left text-xs font-extrabold transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs font-black' 
                      : 'bg-zinc-50 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="leading-snug">{area}</span>
                    {isSelected && <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ÁRVORE HIERÁRQUICA: ÁREA -> BLOCO -> TÓPICO -> SUBTÓPICO */}
      <div className="space-y-3">
        {/* Campo de busca no edital */}
        <div className="relative print:hidden">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Filtrar por tópico ou lei do edital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-emerald-100 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
          />
        </div>

        {/* Renderização de Blocos */}
        {currentBlocks.map((block, blockIndex) => {
          const isBlockOpen = expandedBlocks[block.id] !== false; // blocos abertos por padrão
          const blockStats = getBlockStats(block);

          return (
            <div 
              key={block.id}
              className="bg-white rounded-2xl border border-emerald-100/90 shadow-2xs overflow-hidden transition-all"
            >
              {/* BLOCO HEADER */}
              <button
                onClick={() => toggleBlock(block.id)}
                className="w-full p-3.5 bg-emerald-50/50 hover:bg-emerald-50/90 text-left flex items-center justify-between border-b border-emerald-100/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {blockIndex + 1}
                  </div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-zinc-900">
                    {block.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {blockStats.percentage}% Concluído ({blockStats.completed}/{blockStats.total})
                  </span>
                  {isBlockOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
                </div>
              </button>

              {/* TÓPICOS DO BLOCO */}
              {isBlockOpen && (
                <div className="p-3 space-y-3 divide-y divide-zinc-100">
                  {block.topics
                    .filter(t => !searchTerm || t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.subtopics.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((topic, topicIndex) => {
                      // TÓPICOS FECHADOS POR PADRÃO: só abre se estiver explicitamente em expandedTopics
                      const isTopicOpen = !!expandedTopics[topic.id];
                      const topicStats = getTopicStats(topic);
                      const topicStatus = getItemStatus(topic.id);

                      return (
                        <div key={topic.id} className="pt-2.5 first:pt-0 space-y-2">
                          {/* TÓPICO HEADER (Clique para expandir) */}
                          <div className="flex items-start justify-between gap-2 bg-zinc-50/80 hover:bg-emerald-50/40 p-2.5 rounded-xl transition-colors">
                            <button
                              onClick={() => toggleTopic(topic.id)}
                              className="text-left flex items-start gap-2 transition-colors cursor-pointer group flex-1 min-w-0"
                            >
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md shrink-0 border border-emerald-200 mt-0.5">
                                {blockIndex + 1}.{topicIndex + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-emerald-800 leading-normal break-words">
                                  {topic.name}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                  {topic.subtopics.length} subtópicos • {topicStats.percentage}% concluído
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                              <button
                                onClick={() => toggleTopic(topic.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-bold text-zinc-600 cursor-pointer transition"
                              >
                                <span>{isTopicOpen ? 'Ocultar subtópicos' : 'Ver subtópicos'}</span>
                                {isTopicOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* SUBTÓPICOS DO TÓPICO (Visíveis apenas quando aberto) */}
                          {isTopicOpen && (
                            <div className="pl-3 sm:pl-5 border-l-2 border-emerald-200 space-y-2 pt-1 pb-1">
                              {topic.subtopics.map((subtopic) => {
                                const stStatus = getItemStatus(subtopic.id);
                                const isGrifado = stStatus === 'mastered' || stStatus === 'reviewed' || stStatus === 'in_progress';

                                return (
                                  <div 
                                    key={subtopic.id}
                                    className={`p-2.5 rounded-xl border transition-all space-y-2 ${
                                      isGrifado 
                                        ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-400/20' 
                                        : 'bg-zinc-50/80 border-zinc-200/60 hover:border-emerald-200'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex items-start gap-2 min-w-0">
                                        <button
                                          onClick={() => handleToggleGrifarSubtopic(subtopic.id, stStatus)}
                                          className="mt-0.5 cursor-pointer shrink-0 text-emerald-700 hover:scale-110 transition-transform"
                                          title={isGrifado ? 'Desmarcar tópico' : 'Grifar/Concluir tópico'}
                                        >
                                          {isGrifado ? (
                                            <CheckSquare size={16} className="text-emerald-700 fill-emerald-100" />
                                          ) : (
                                            <Square size={16} className="text-zinc-400 hover:text-emerald-600" />
                                          )}
                                        </button>
                                        <p className={`text-xs font-bold leading-snug ${isGrifado ? 'text-emerald-950 font-black' : 'text-zinc-800'}`}>
                                          {subtopic.name}
                                        </p>
                                      </div>

                                      <div className="shrink-0 flex items-center gap-1.5">
                                        {getStatusBadge(stStatus)}
                                      </div>
                                    </div>

                                    {/* Ações para o Subtópico */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200/50 text-[10px] print:hidden">
                                      {/* Alterar Status */}
                                      <div className="flex items-center gap-1">
                                        {(['not_started', 'in_progress', 'reviewed', 'mastered'] as TopicStatus[]).map((st) => {
                                          const labels: Record<TopicStatus, string> = {
                                            not_started: 'Não Visto',
                                            in_progress: 'Estudando',
                                            reviewed: 'Revisado',
                                            mastered: 'Dominado'
                                          };
                                          const isSelected = stStatus === st;
                                          return (
                                            <button
                                              key={st}
                                              onClick={() => handleStatusUpdate(subtopic.id, st)}
                                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                                                isSelected 
                                                  ? 'bg-emerald-700 text-white shadow-2xs' 
                                                  : 'bg-white text-zinc-500 hover:bg-zinc-200 border border-zinc-200'
                                              }`}
                                            >
                                              {labels[st]}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Atalhos Rápidos para Questões / Tutor */}
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => setActiveTab('simulados')}
                                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Praticar questões FUNECE deste subtópico"
                                        >
                                          <FileText size={11} />
                                          <span>Praticar Questões</span>
                                        </button>
                                        <button
                                          onClick={() => setActiveTab('tutor')}
                                          className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                          title="Tirar dúvida no Tutor IA especializado na FUNECE"
                                        >
                                          <Bot size={11} />
                                          <span>Tutor IA</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

