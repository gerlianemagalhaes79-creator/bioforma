import React, { useState } from 'react';
import { User, db, doc, setDoc } from '../firebase';
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
  Award
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

  // Estados de Expansão de Blocos e Tópicos
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Progresso individual dos tópicos/subtópicos armazenado no componente
  const [statusMap, setStatusMap] = useState<Record<string, TopicStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const userDegree = profile?.degree || profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleStatusUpdate = async (id: string, newStatus: TopicStatus) => {
    setStatusMap(prev => ({ ...prev, [id]: newStatus }));
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
  };

  const getItemStatus = (id: string, defaultStatus: TopicStatus = 'not_started'): TopicStatus => {
    return statusMap[id] || defaultStatus;
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

  // estatísticas
  let totalSubtopicsCount = 0;
  let masteredSubtopicsCount = 0;

  const countSubtopics = (blocksList: EditalBlock[]) => {
    blocksList.forEach(b => {
      b.topics.forEach(t => {
        t.subtopics.forEach(st => {
          totalSubtopicsCount++;
          const stStatus = getItemStatus(st.id, st.status);
          if (stStatus === 'mastered' || stStatus === 'reviewed') {
            masteredSubtopicsCount++;
          }
        });
      });
    });
  };

  countSubtopics(getBlocksForDegree(userDegree));
  (Object.keys(OFFICIAL_EDITAL_TREE.geral) as GeneralCategoryKey[]).forEach(key => {
    countSubtopics(OFFICIAL_EDITAL_TREE.geral[key]);
  });

  const overallProgress = totalSubtopicsCount > 0 
    ? Math.round((masteredSubtopicsCount / totalSubtopicsCount) * 100) 
    : 0;

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
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-3 print:border-none print:shadow-none print:p-0">
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
              <p className="text-xs text-zinc-500">Hierarquia Obrigatória: Área → Bloco → Tópico → Subtópico</p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrintEdital}
              className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-zinc-200 cursor-pointer"
              title="Imprimir ou Salvar Edital em PDF"
            >
              <Printer size={15} />
              <span>Imprimir Documento</span>
            </button>
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-zinc-400 uppercase">Domínio Total</p>
              <p className="text-xl font-black text-emerald-700">{overallProgress}%</p>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-200 print:hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 h-1.5 rounded-full"
          />
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
            50 Questões • Peso 62,5% • {userDegree}
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
        <div className="bg-white rounded-2xl p-3 border border-emerald-100 shadow-xs space-y-2 print:hidden">
          <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
            Selecione a Área de Conhecimento Geral:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {generalAreaKeys.map((area) => {
              const isSelected = selectedGeneralArea === area;
              return (
                <button
                  key={area}
                  onClick={() => setSelectedGeneralArea(area)}
                  className={`p-2.5 rounded-xl text-left text-xs font-extrabold transition-all border cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs' 
                      : 'bg-zinc-50/70 text-zinc-600 hover:bg-zinc-100 border-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{area}</span>
                    {isSelected && <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ÁRVORE HIERÁRQUICA: ÁREA -> BLOCO -> TÓPICO -> SUBTÓPICO */}
      <div className="space-y-3">
        {/* Header da Área Ativa */}
        <div className="bg-zinc-900 text-white p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider">
              {activeMainCategory === 'especifico' 
                ? `Área: Conhecimentos Específicos (${userDegree})` 
                : `Área: ${selectedGeneralArea}`}
            </span>
          </div>
          <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
            {currentBlocks.length} Blocos
          </span>
        </div>

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
          const isBlockOpen = expandedBlocks[block.id] !== false; // por padrão aberto
          
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                    {block.topics.length} Tópicos
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
                      const isTopicOpen = expandedTopics[topic.id] !== false;
                      const topicStatus = getItemStatus(topic.id, topic.status || 'not_started');

                      return (
                        <div key={topic.id} className="pt-2.5 first:pt-0 space-y-2">
                          {/* TÓPICO HEADER */}
                          <div className="flex items-start justify-between gap-2">
                            <button
                              onClick={() => toggleTopic(topic.id)}
                              className="text-left flex items-start gap-2 hover:text-emerald-700 transition-colors cursor-pointer group flex-1"
                            >
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 shrink-0 border border-emerald-100">
                                {blockIndex + 1}.{topicIndex + 1}
                              </span>
                              <div>
                                <h4 className="font-extrabold text-xs text-zinc-900 group-hover:text-emerald-800 leading-snug">
                                  {topic.name}
                                </h4>
                                <p className="text-[10px] text-zinc-500 font-medium">
                                  {topic.subtopics.length} subtópicos mapeados
                                </p>
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {getStatusBadge(topicStatus)}
                              <button
                                onClick={() => toggleTopic(topic.id)}
                                className="p-1 hover:bg-zinc-100 rounded cursor-pointer text-zinc-400"
                              >
                                {isTopicOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* SUBTÓPICOS DO TÓPICO */}
                          {isTopicOpen && (
                            <div className="pl-4 sm:pl-6 border-l-2 border-emerald-100 space-y-2 pt-1 pb-1">
                              {topic.subtopics.map((subtopic) => {
                                const stStatus = getItemStatus(subtopic.id, subtopic.status || 'not_started');

                                return (
                                  <div 
                                    key={subtopic.id}
                                    className="p-2.5 rounded-xl bg-zinc-50/80 border border-zinc-200/60 hover:border-emerald-200 transition-all space-y-2"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs font-bold text-zinc-800 leading-snug">
                                        • {subtopic.name}
                                      </p>
                                      <div className="shrink-0">
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

                                      {/* Atalhos Rápidos para Simulados / Tutor */}
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
