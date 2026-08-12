import React, { useState, useMemo, useEffect } from 'react';
import { User, db, doc, setDoc, collection, addDoc } from '../firebase';
import { UserProfile, Question, QuestionAnswerLog } from '../types';
import { recordUserActivity } from '../utils/streak';
import { SEDUC_QUESTIONS, OFFICIAL_EDITAL_TREE, getEspecificoTree, FUNECE_DEGREE_OPTIONS } from '../data/seducData';
import { FormattedText } from './FormattedText';
import { 
  FileText, CheckCircle2, XCircle, Sparkles, Filter, ChevronRight, ChevronDown, 
  RotateCcw, BrainCircuit, Award, BookOpen, Clock, Search, CheckSquare, Square, 
  Bookmark, Strikethrough, AlertTriangle, Lightbulb, Play, Sliders, ArrowLeft, 
  HelpCircle, Send, BarChart3, Target, Check, RefreshCw, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SimuladosSectionProps {
  user: User;
  profile: UserProfile | null;
}

interface SelectedSubtopic {
  blockId: string;
  blockName: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
}

type TabMode = 'generator' | 'bank' | 'stats';
type QuizMode = 'instant' | 'exam';

export default function SimuladosSection({ user, profile }: SimuladosSectionProps) {
  // Navigation & Mode States
  const [activeTab, setActiveTab] = useState<TabMode>('generator');
  const [quizMode, setQuizMode] = useState<QuizMode>('instant');

  // Discipline Tree Selection State
  const userDegree = profile?.degree || FUNECE_DEGREE_OPTIONS[0];
  const [selectedDisciplineCategory, setSelectedDisciplineCategory] = useState<string>(''); // empty until selected
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  // Checkbox Selection for Subtopics (Hierarchy Tree)
  const [selectedSubtopicsMap, setSelectedSubtopicsMap] = useState<Record<string, SelectedSubtopic>>({});

  // Generator Configurations
  const [selectedBanca, setSelectedBanca] = useState<string>('FUNECE / CEV-UECE');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Média');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('Estilo banca');

  // Active Simulado Session States
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswersMap, setUserAnswersMap] = useState<Record<number, 'A' | 'B' | 'C' | 'D' | 'E'>>({});
  const [submittedQuestionsMap, setSubmittedQuestionsMap] = useState<Record<number, boolean>>({});
  const [eliminatedOptionsMap, setEliminatedOptionsMap] = useState<Record<number, Record<string, boolean>>>({});
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<number, boolean>>({});
  
  // Loading & Generation Status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Timer & Results
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [quizElapsedTime, setQuizElapsedTime] = useState<number>(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);

  // AI Tutor Modal Helper
  const [tutorQuestionContext, setTutorQuestionContext] = useState<Question | null>(null);
  const [tutorQuestionQuery, setTutorQuestionQuery] = useState<string>('');
  const [tutorAnswerText, setTutorAnswerText] = useState<string | null>(null);
  const [loadingTutor, setLoadingTutor] = useState<boolean>(false);

  // Ready-made Question Bank State
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>('Todas');
  const [bankIndex, setBankIndex] = useState<number>(0);

  // Determine Active Edital Tree based on user selection
  const currentTreeBlocks = useMemo(() => {
    if (!selectedDisciplineCategory) return [];
    if (selectedDisciplineCategory === 'especifico') {
      return getEspecificoTree(userDegree);
    }
    const geralCategory = selectedDisciplineCategory as keyof typeof OFFICIAL_EDITAL_TREE.geral;
    return OFFICIAL_EDITAL_TREE.geral[geralCategory] || [];
  }, [selectedDisciplineCategory, userDegree]);

  // Expand all blocks by default, but leave topics collapsed until clicked
  useEffect(() => {
    const initialBlockState: Record<string, boolean> = {};
    currentTreeBlocks.forEach(block => {
      initialBlockState[block.id] = true;
    });
    setExpandedBlocks(initialBlockState);
    setExpandedTopics({});
  }, [currentTreeBlocks]);

  // Clear subtopic selections when switching discipline category to avoid cross-subject topic pollution
  useEffect(() => {
    setSelectedSubtopicsMap({});
  }, [selectedDisciplineCategory]);

  // Quiz Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeQuizQuestions && !isQuizCompleted && quizStartTime) {
      interval = setInterval(() => {
        setQuizElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeQuizQuestions, isQuizCompleted, quizStartTime]);

  // Checkbox Toggle Helpers
  const handleToggleSubtopic = (item: SelectedSubtopic) => {
    setSelectedSubtopicsMap(prev => {
      const next = { ...prev };
      if (next[item.subtopicId]) {
        delete next[item.subtopicId];
      } else {
        next[item.subtopicId] = item;
      }
      return next;
    });
  };

  const handleToggleTopicAll = (block: typeof currentTreeBlocks[0], topic: typeof currentTreeBlocks[0]['topics'][0]) => {
    const subtopicList = topic.subtopics.length > 0 
      ? topic.subtopics 
      : [{ id: `${topic.id}-gen`, name: topic.name, status: topic.status }];

    const allSelected = subtopicList.every(sub => !!selectedSubtopicsMap[sub.id]);

    setSelectedSubtopicsMap(prev => {
      const next = { ...prev };
      subtopicList.forEach(sub => {
        if (allSelected) {
          delete next[sub.id];
        } else {
          next[sub.id] = {
            blockId: block.id,
            blockName: block.name,
            topicId: topic.id,
            topicName: topic.name,
            subtopicId: sub.id,
            subtopicName: sub.name
          };
        }
      });
      return next;
    });
  };

  const handleToggleBlockAll = (block: typeof currentTreeBlocks[0]) => {
    let allSubtopics: SelectedSubtopic[] = [];
    block.topics.forEach(t => {
      const subList = t.subtopics.length > 0 ? t.subtopics : [{ id: `${t.id}-gen`, name: t.name, status: t.status }];
      subList.forEach(sub => {
        allSubtopics.push({
          blockId: block.id,
          blockName: block.name,
          topicId: t.id,
          topicName: t.name,
          subtopicId: sub.id,
          subtopicName: sub.name
        });
      });
    });

    const isAllChecked = allSubtopics.every(sub => !!selectedSubtopicsMap[sub.subtopicId]);

    setSelectedSubtopicsMap(prev => {
      const next = { ...prev };
      allSubtopics.forEach(sub => {
        if (isAllChecked) {
          delete next[sub.subtopicId];
        } else {
          next[sub.subtopicId] = sub;
        }
      });
      return next;
    });
  };

  const handleClearAllSelections = () => {
    setSelectedSubtopicsMap({});
  };

  const handleSelectAllInTree = () => {
    const nextMap: Record<string, SelectedSubtopic> = {};
    currentTreeBlocks.forEach(block => {
      block.topics.forEach(topic => {
        const subList = topic.subtopics.length > 0 ? topic.subtopics : [{ id: `${topic.id}-gen`, name: topic.name, status: topic.status }];
        subList.forEach(sub => {
          nextMap[sub.id] = {
            blockId: block.id,
            blockName: block.name,
            topicId: topic.id,
            topicName: topic.name,
            subtopicId: sub.id,
            subtopicName: sub.name
          };
        });
      });
    });
    setSelectedSubtopicsMap(nextMap);
  };

  const selectedCount = Object.keys(selectedSubtopicsMap).length;

  // Total subtopics available in current tree
  const totalSubtopicsInTree = useMemo(() => {
    let count = 0;
    currentTreeBlocks.forEach(block => {
      block.topics.forEach(topic => {
        const subList = topic.subtopics.length > 0 ? topic.subtopics : [{ id: `${topic.id}-gen` }];
        count += subList.length;
      });
    });
    return count;
  }, [currentTreeBlocks]);

  // Dynamic question count: 1 per selected topic, or 5 if ALL topics in tree are selected
  const computedQuestionCount = useMemo(() => {
    if (selectedCount === 0) return 0;
    if (totalSubtopicsInTree > 0 && selectedCount >= totalSubtopicsInTree) {
      return 5;
    }
    return selectedCount;
  }, [selectedCount, totalSubtopicsInTree]);

  // Helper to retrieve previously seen question texts across ALL local storage keys to prevent repetition
  const getPreviouslySeenQuestionTexts = (): string[] => {
    try {
      const seenSet = new Set<string>();

      // Scan all localStorage keys related to seen questions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.includes('seduc_seen_questions') || key.includes('questionLogs') || key.includes('simulado_history') || key.includes('user_simulados')) {
          try {
            const val = localStorage.getItem(key);
            if (!val) continue;
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
              parsed.forEach((item: any) => {
                if (typeof item === 'string' && item.trim()) {
                  seenSet.add(item.trim());
                } else if (item && typeof item === 'object') {
                  if (item.questionText) seenSet.add(item.questionText.trim());
                  if (item.question) seenSet.add(item.question.trim());
                  if (Array.isArray(item.questions)) {
                    item.questions.forEach((q: any) => {
                      if (q.questionText) seenSet.add(q.questionText.trim());
                      if (q.question) seenSet.add(q.question.trim());
                    });
                  }
                }
              });
            }
          } catch (e) {
            // ignore JSON parse errors for non-JSON items
          }
        }
      }

      return Array.from(seenSet);
    } catch (err) {
      return [];
    }
  };

  const cleanEditalTitle = (rawTitle: string): string => {
    if (!rawTitle) return "Conhecimentos Específicos";
    return rawTitle
      .replace(/^[\d\.\-\s\)\(]+/, '')
      .replace(/^(Módulo|Modulo|Tópico|Topico|Unidade|Item)\s*\d+[\.\:\-]*\s*/i, '')
      .trim() || rawTitle;
  };

  // Helper to record newly generated questions into history
  const recordSeenQuestions = (questions: Question[]) => {
    try {
      const activeUid = user?.uid || profile?.uid || 'guest';
      const historyKey = `seduc_seen_questions_${activeUid}`;
      const existing = localStorage.getItem(historyKey);
      const arr: string[] = existing ? JSON.parse(existing) : [];

      questions.forEach(q => {
        if (q.questionText && !arr.includes(q.questionText.trim())) {
          arr.push(q.questionText.trim());
        }
      });

      const trimmed = arr.slice(-200);
      localStorage.setItem(historyKey, JSON.stringify(trimmed));
    } catch (err) {
      console.warn("Erro ao registrar histórico de questões vistas:", err);
    }
  };

  const generateSmartFallbackQuestions = (
    disciplineName: string,
    category: string,
    topicPayload: { topicName: string; subtopicName: string }[],
    count: number
  ): Question[] => {
    const selectedQuestions: Question[] = [];
    const seenTexts = getPreviouslySeenQuestionTexts();

    // Filter bank questions that belong to this discipline or category AND have not been seen
    const categoryMatch = SEDUC_QUESTIONS.filter(q => {
      const qSub = q.subject.toLowerCase();
      const qCat = q.category.toLowerCase();
      const disc = disciplineName.toLowerCase();
      const cat = category.toLowerCase();

      if (category === 'especifico') {
        return qCat.includes('específic') || qSub.includes(disc) || disc.includes(qSub);
      }
      return qCat.includes(cat) || qSub.includes(cat) || cat.includes(qCat);
    });

    // STRICTLY UNSEEN questions only
    const unseenPool = categoryMatch.filter(q => !seenTexts.includes(q.questionText.trim()));

    const cearaCities = ["Fortaleza", "Sobral", "Juazeiro do Norte", "Crateús", "Quixadá", "Iguatu", "Maracanaú", "Baturité", "Itapipoca", "Caucaia", "Russas", "Tianguá", "Camocim", "Tauá", "Limoeiro do Norte"];
    const schoolTypes = ["em uma Escola de Ensino Médio em Tempo Integral (EEMTI)", "em uma Escola Estadual de Educação Profissional (EEEP)", "em uma turma de Educação de Jovens e Adultos (EJA)", "no Laboratório Multidisciplinar de Aprendizagem", "durante a reunião do Conselho de Classe"];
    const teacherNames = ["Prof. Raimundo", "Profa. Francisca", "Prof. Carlos", "Profa. Camila", "Prof. Gilberto", "Profa. Claudiana", "Prof. Henrique", "Profa. Socorro", "Prof. Eudoro", "Profa. Rebeca", "Prof. Valdemar", "Profa. Elisângela", "Prof. Marcondes", "Profa. Tereza", "Prof. Vicente"];

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    for (let i = 0; i < count; i++) {
      const topObj = topicPayload[i % topicPayload.length] || { topicName: 'Tópico de Estudo', subtopicName: '' };
      const rawTopicName = topObj.topicName;
      const rawSubtopicName = topObj.subtopicName || rawTopicName;
      const topicName = cleanEditalTitle(rawTopicName);
      const subtopicName = cleanEditalTitle(rawSubtopicName);

      // Check if we have an exact matching UNSEEN question from SEDUC_QUESTIONS
      const exactMatchIdx = unseenPool.findIndex(q => 
        (q.topic.toLowerCase().includes(topicName.toLowerCase()) || 
        (subtopicName && q.subtopic.toLowerCase().includes(subtopicName.toLowerCase()))) &&
        !selectedQuestions.some(sq => sq.questionText === q.questionText)
      );

      if (exactMatchIdx !== -1) {
        const matched = unseenPool.splice(exactMatchIdx, 1)[0];
        selectedQuestions.push({
          ...matched,
          id: `fallback-smart-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          subject: disciplineName,
          options: matched.options.slice(0, 4)
        });
      } else if (unseenPool.length > 0) {
        const randomIdx = Math.floor(Math.random() * unseenPool.length);
        const baseQ = unseenPool.splice(randomIdx, 1)[0];
        if (!selectedQuestions.some(sq => sq.questionText === baseQ.questionText)) {
          selectedQuestions.push({
            ...baseQ,
            id: `fallback-cat-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
            subject: disciplineName,
            options: baseQ.options.slice(0, 4)
          });
        }
      } else {
        // Build a 100% unique question tailored to the exact discipline
        const normDisc = disciplineName.toLowerCase();

        let qText = `Acerca do tópico "${subtopicName}" (${topicName}), assinale a alternativa inteiramente CORRETA do ponto de vista conceitual e científico:`;
        let rawOpts = [
          { isCorrect: true, text: `O domínio dos fundamentos teóricos e práticos inerentes a ${subtopicName.toLowerCase()} permite a compreensão precisa dos fenômenos, estruturas e processos da área.` },
          { isCorrect: false, text: `A caracterização de ${subtopicName.toLowerCase()} fundamenta-se em definições estáticas sem relação com os princípios consolidados da disciplina.` },
          { isCorrect: false, text: `As relações e propriedades associadas a ${subtopicName.toLowerCase()} dispensam sustentação empírica ou dedução lógica rigorosa.` },
          { isCorrect: false, text: `A análise dos elementos constituintes de ${subtopicName.toLowerCase()} prescinde de embasamento sistemático.` }
        ];

        if (normDisc.includes('português') || normDisc.includes('lingua') || normDisc.includes('gramát')) {
          qText = `No que se refere aos recursos de regência, sintaxe e coesão referentes ao tema de "${subtopicName}", assinale a alternativa que atende à norma-padrão da Língua Portuguesa:`;
          rawOpts = [
            { isCorrect: true, text: `A articulação sintática dos enunciados exige observância às regras de concordância e à seleção adequada dos conectivos para a garantia da coesão e da clareza.` },
            { isCorrect: false, text: `O emprego dos conectivos subordinativos prescinde de concordância entre verbo e sujeito no registro culto.` },
            { text: `A pontuação em orações subordinadas adjetivas restritivas deve incluir obrigatoriamente vírgulas isolando o termo.` },
            { text: `As relações de regência verbal admitem a omissão de preposição antes de pronomes relativos mesmo quando exigida pelo termo regente.` }
          ];
        } else if (normDisc.includes('biologia') || normDisc.includes('ciência')) {
          qText = `No âmbito da Biologia, acerca das propriedades estruturais, físico-químicas e funcionais atreladas a "${subtopicName}", assinale a afirmativa cientificamente CORRETA:`;
          rawOpts = [
            { isCorrect: true, text: `Os mecanismos celulares e moleculares operam em dinamismo homeostático, assegurando a regulação metabólica, o transporte de substâncias e a integridade funcional da célula.` },
            { isCorrect: false, text: `As reações metabólicas e o transporte ativo de íons através da membrana plasmática ocorrem de modo passivo, sem gasto de ATP.` },
            { isCorrect: false, text: `A bicamada lipídica da membrana plasmática é totalmente impermeável a moléculas apolares e gases como O2 e CO2.` },
            { isCorrect: false, text: `A síntese de proteínas e a respiração celular ocorrem exclusivamente no citosol, sem participação de organelas membranosas.` }
          ];
        } else if (normDisc.includes('legislaç') || normDisc.includes('direito')) {
          qText = `De acordo com a legislação educacional brasileira referente ao tema "${subtopicName}", assinale a afirmativa correta:`;
          rawOpts = [
            { isCorrect: true, text: `A garantia do direito à educação, a igualdade de condições para acesso e permanência e a gestão democrática do ensino público constituem princípios do ensino nacional.` },
            { isCorrect: false, text: `A aplicação das diretrizes curriculares nacionais anula a autonomia pedagógica das unidades escolares na elaboração do Projeto Político-Pedagógico.` },
            { isCorrect: false, text: `O ensino público pode restringir a liberdade de aprender, ensinar e pesquisar em função de orientações doutrinárias específicas.` },
            { isCorrect: false, text: `A gestão democrática do ensino público veda a participação dos profissionais da educação e da comunidade local em conselhos escolares.` }
          ];
        } else if (normDisc.includes('pedagogi') || normDisc.includes('didátic') || normDisc.includes('educaç')) {
          qText = `Na Didática Geral e no estudo das Tendências Pedagógicas, no que se refere ao tema "${subtopicName}", assinale a opção correta:`;
          rawOpts = [
            { isCorrect: true, text: `A articulação entre os saberes científicos e a realidade social dos estudantes visa à democratização do conhecimento e à emancipação crítica do educando.` },
            { isCorrect: false, text: `A Tendência Liberal Tecnicista prioriza o diálogo sobre temas geradores e a conscientização política em detrimento do treinamento operacional.` },
            { isCorrect: false, text: `A Tendência Liberal Renovada Progressivista fundamenta-se na transmissão expositiva de conteúdos acumulados, sendo o aluno um receptor passivo.` },
            { isCorrect: false, text: `A avaliação formativa e contínua busca unicamente a classificação numérica final dos discentes para fins de seleção e exclusão.` }
          ];
        }

        const shuffled = shuffle(rawOpts);
        const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        let correctLetter: 'A' | 'B' | 'C' | 'D' = 'A';

        const finalOpts = shuffled.map((opt, idx) => {
          const l = letters[idx];
          if (opt.isCorrect) correctLetter = l;
          return { letter: l, text: opt.text };
        });

        const correctObj = shuffled.find(o => o.isCorrect)!;

        selectedQuestions.push({
          id: `funece-high-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          category: category === 'especifico' ? 'Conhecimentos Específicos' : (category as any),
          subject: disciplineName,
          topic: topicName,
          subtopic: subtopicName,
          banca: 'FUNECE / CEV-UECE',
          questionText: qText,
          options: finalOpts,
          correctAnswer: correctLetter,
          explanation: `Gabarito Comentado:\n- Alternativa ${correctLetter} (Correta): ${correctObj.text}\n- Análise das demais alternativas: As demais opções contêm imprecisões conceituais ou contradições com o conhecimento consolidado da matéria.`,
          difficulty: 'difícil',
          skills: ['Domínio Científico do Conteúdo', 'Análise Conceitual'],
          commonMistake: `Atenção à precisão dos conceitos científicos e aos detalhes das opções.`,
          studyTip: `Revise a fundamentação teórica e as definições essenciais deste subtópico.`
        });
      }
    }

    return selectedQuestions;
  };

  // Generate Simulado via Server API
  const handleGenerateSimulado = async () => {
    if (!selectedDisciplineCategory) {
      setGenerationError("Selecione um módulo do edital para poder carregar e escolher os tópicos.");
      return;
    }

    if (selectedCount === 0) {
      setGenerationError("Selecione pelo menos 1 assunto/subtópico na árvore do edital.");
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);

    const topicPayload = Object.values(selectedSubtopicsMap).map(s => ({
      topicName: s.topicName,
      subtopicName: s.subtopicName
    }));

    const disciplineName = selectedDisciplineCategory === 'especifico' ? userDegree : selectedDisciplineCategory;
    const blockName = Object.values(selectedSubtopicsMap)[0]?.blockName || 'Conhecimentos Específicos';

    // Retrieve seen questions to pass to AI for absolute anti-repetition
    const seenTexts = getPreviouslySeenQuestionTexts();

    const targetCount = computedQuestionCount || 1;

    try {
      const response = await fetch('/api/seduc/generate-simulado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discipline: disciplineName,
          blockName: blockName,
          selectedTopics: topicPayload,
          banca: selectedBanca,
          difficulty: selectedDifficulty,
          questionType: selectedQuestionType,
          count: targetCount,
          previousQuestions: seenTexts
        })
      });

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.warn("Falha ao interpretar JSON do servidor:", jsonErr);
        }
      }

      if (data && data.success && data.questions && data.questions.length > 0) {
        // Format returned questions to fit Question interface
        const formattedQuestions: Question[] = data.questions.map((q: any, idx: number) => ({
          id: `gen-q-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          category: selectedDisciplineCategory === 'especifico' ? 'Conhecimentos Específicos' : (selectedDisciplineCategory as any),
          subject: disciplineName,
          topic: cleanEditalTitle(q.topic || topicPayload[idx % topicPayload.length]?.topicName || 'Tópico de Estudo'),
          subtopic: cleanEditalTitle(q.subtopic || topicPayload[idx % topicPayload.length]?.subtopicName || ''),
          banca: q.banca || selectedBanca,
          questionText: q.question,
          options: q.alternatives || [],
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || 'Gabarito Oficial FUNECE',
          difficulty: q.difficulty || selectedDifficulty,
          skills: q.skills || [],
          commonMistake: q.commonMistake || '',
          studyTip: q.studyTip || ''
        }));

        recordSeenQuestions(formattedQuestions);

        setActiveQuizQuestions(formattedQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswersMap({});
        setSubmittedQuestionsMap({});
        setEliminatedOptionsMap({});
        setBookmarkedMap({});
        setQuizStartTime(Date.now());
        setQuizElapsedTime(0);
        setIsQuizCompleted(false);
      } else {
        // Fallback: load matching offline questions from bank if API is unreachable/fails
        console.warn("API de geração indisponível ou resposta inválida. Usando gerador adaptativo de questões FUNECE.");
        const fallbackQuestions = generateSmartFallbackQuestions(disciplineName, selectedDisciplineCategory, topicPayload, targetCount);

        recordSeenQuestions(fallbackQuestions);

        setActiveQuizQuestions(fallbackQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswersMap({});
        setSubmittedQuestionsMap({});
        setEliminatedOptionsMap({});
        setBookmarkedMap({});
        setQuizStartTime(Date.now());
        setQuizElapsedTime(0);
        setIsQuizCompleted(false);
      }
    } catch (err: any) {
      console.error("Erro ao gerar simulado:", err);
      // Fallback on total network error
      const fallbackQuestions = generateSmartFallbackQuestions(disciplineName, selectedDisciplineCategory, topicPayload, targetCount);
      recordSeenQuestions(fallbackQuestions);
      setActiveQuizQuestions(fallbackQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswersMap({});
      setSubmittedQuestionsMap({});
      setEliminatedOptionsMap({});
      setBookmarkedMap({});
      setQuizStartTime(Date.now());
      setQuizElapsedTime(0);
      setIsQuizCompleted(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Option Elimination Toggle
  const handleToggleEliminateOption = (qIdx: number, letter: string) => {
    setEliminatedOptionsMap(prev => {
      const qMap = { ...(prev[qIdx] || {}) };
      qMap[letter] = !qMap[letter];
      return { ...prev, [qIdx]: qMap };
    });
  };

  // Option Selection
  const handleSelectOption = (qIdx: number, letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (submittedQuestionsMap[qIdx] && quizMode === 'instant') return;
    setUserAnswersMap(prev => ({ ...prev, [qIdx]: letter }));
  };

  const saveQuestionLogHelper = async (logData: Omit<QuestionAnswerLog, 'id'>) => {
    const fullLog: QuestionAnswerLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...logData
    };

    // 1. Save to local storage for immediate UI reactivity across components
    try {
      const activeUid = user?.uid || profile?.uid || 'guest';
      const key = `questionLogs_${activeUid}`;
      const existing = localStorage.getItem(key);
      const arr: QuestionAnswerLog[] = existing ? JSON.parse(existing) : [];
      arr.unshift(fullLog);
      localStorage.setItem(key, JSON.stringify(arr));
      window.dispatchEvent(new Event('questionLogUpdated'));
      recordUserActivity(activeUid).catch(() => {});
    } catch (err) {
      console.warn("Erro ao salvar log local de questão:", err);
    }

    // 2. Save to Firestore
    const activeUid = user?.uid || profile?.uid;
    if (activeUid) {
      try {
        const logsRef = collection(db, 'users', activeUid, 'questionLogs');
        await addDoc(logsRef, {
          ...logData,
          uid: activeUid
        });
      } catch (err) {
        console.warn("Erro ao salvar log no Firestore:", err);
      }
    }
  };

  // Check Answer in Instant Mode
  const handleCheckAnswerInstant = async (qIdx: number) => {
    if (!userAnswersMap[qIdx]) return;
    setSubmittedQuestionsMap(prev => ({ ...prev, [qIdx]: true }));

    const q = activeQuizQuestions![qIdx];
    const isCorrect = userAnswersMap[qIdx] === q.correctAnswer;

    const logItem: Omit<QuestionAnswerLog, 'id'> = {
      uid: user?.uid || profile?.uid || 'guest',
      questionId: q.id,
      discipline: q.subject || 'Conhecimentos Específicos',
      blockName: q.category || 'Edital SEDUC',
      topicName: q.topic || 'Conceitos Gerais',
      subtopicName: q.subtopic || q.topic || 'Conceitos Gerais',
      banca: q.banca || 'FUNECE / CEV-UECE',
      isCorrect,
      timeSpentSeconds: Math.max(12, Math.round(quizElapsedTime / Math.max(1, qIdx + 1))),
      userAnswer: userAnswersMap[qIdx],
      correctAnswer: q.correctAnswer,
      timestamp: new Date().toISOString()
    };

    await saveQuestionLogHelper(logItem);

    // Update user profile question counters in Firestore
    const activeUid = user?.uid || profile?.uid;
    if (activeUid) {
      try {
        const userRef = doc(db, 'users', activeUid);
        await setDoc(userRef, {
          totalQuestionsDone: (profile?.totalQuestionsDone || 0) + 1,
          correctAnswersCount: (profile?.correctAnswersCount || 0) + (isCorrect ? 1 : 0)
        }, { merge: true });
      } catch (err) {
        console.warn("Erro ao atualizar contador de questões:", err);
      }
    }
  };

  // Finish Full Simulado
  const handleFinishQuiz = async () => {
    setIsQuizCompleted(true);
    if (!activeQuizQuestions) return;

    let correctCount = 0;
    for (let idx = 0; idx < activeQuizQuestions.length; idx++) {
      const q = activeQuizQuestions[idx];
      const uAns = userAnswersMap[idx];
      if (uAns) {
        const isCorr = uAns === q.correctAnswer;
        if (isCorr) correctCount++;
        const logItem: Omit<QuestionAnswerLog, 'id'> = {
          uid: user?.uid || profile?.uid || 'guest',
          questionId: q.id,
          discipline: q.subject || 'Conhecimentos Específicos',
          blockName: q.category || 'Edital SEDUC',
          topicName: q.topic || 'Conceitos Gerais',
          subtopicName: q.subtopic || q.topic || 'Conceitos Gerais',
          banca: q.banca || 'FUNECE / CEV-UECE',
          isCorrect: isCorr,
          timeSpentSeconds: Math.max(12, Math.round(quizElapsedTime / activeQuizQuestions.length)),
          userAnswer: uAns,
          correctAnswer: q.correctAnswer,
          timestamp: new Date().toISOString()
        };
        await saveQuestionLogHelper(logItem);
      }
    }

    const activeUid = user?.uid || profile?.uid;
    if (activeUid) {
      try {
        const userRef = doc(db, 'users', activeUid);
        await setDoc(userRef, {
          totalQuestionsDone: (profile?.totalQuestionsDone || 0) + activeQuizQuestions.length,
          correctAnswersCount: (profile?.correctAnswersCount || 0) + correctCount
        }, { merge: true });
      } catch (err) {
        console.warn("Erro ao salvar resultado final do simulado:", err);
      }
    }
  };

  // Ask AI Tutor about question
  const handleAskTutorQuestion = async (q: Question) => {
    setTutorQuestionContext(q);
    setTutorAnswerText(null);
    setTutorQuestionQuery(`Explique com detalhes o conceito de "${q.subtopic || q.topic}" nesta questão e por que a resposta é a alternativa ${q.correctAnswer}.`);
  };

  const handleSendTutorQuery = async () => {
    if (!tutorQuestionContext || !tutorQuestionQuery.trim() || loadingTutor) return;
    setLoadingTutor(true);
    try {
      const res = await fetch('/api/seduc/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${tutorQuestionQuery}\n\n[Contexto da Questão]:\nEnunciado: "${tutorQuestionContext.questionText}"\nGabarito: ${tutorQuestionContext.correctAnswer}\nAssunto: ${tutorQuestionContext.topic} - ${tutorQuestionContext.subtopic || ''}`,
          subject: tutorQuestionContext.subject
        })
      });
      const data = await res.json();
      if (data.success) {
        setTutorAnswerText(data.text);
      }
    } catch (err) {
      console.error("Erro ao consultar Tutor IA:", err);
      setTutorAnswerText("Não foi possível conectar ao Tutor IA no momento. Tente novamente em instantes.");
    } finally {
      setLoadingTutor(false);
    }
  };

  // Format Elapsed Seconds as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Render Ready-Made Question Bank Questions Filter
  const filteredBankQuestions = useMemo(() => {
    if (bankSubjectFilter === 'Todas') return SEDUC_QUESTIONS;
    return SEDUC_QUESTIONS.filter(q => q.category === bankSubjectFilter || q.subject === bankSubjectFilter);
  }, [bankSubjectFilter]);

  const currentBankQuestion = filteredBankQuestions[Math.min(bankIndex, filteredBankQuestions.length - 1)] || SEDUC_QUESTIONS[0];

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* TAB 1: GERADOR DE SIMULADOS INTELIGENTE (ESTILO QCONCURSOS) */}
      {/* ========================================================= */}
      {activeTab === 'generator' && !activeQuizQuestions && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (8 cols): Hierarchical Edital Tree Picker */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                  <Filter size={16} className="text-emerald-700" />
                  Hierarquia do Edital Matricial
                </h3>
              </div>

              {/* Selection Summary Pill */}
              {selectedCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-emerald-900 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    {selectedCount} selecionado(s)
                  </span>
                  <button
                    onClick={handleClearAllSelections}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Limpar
                  </button>
                </div>
              )}
            </div>

            {/* Discipline Selector Bar */}
            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-extrabold text-zinc-600 mb-1">Módulo do Edital</label>
                <select
                  value={selectedDisciplineCategory}
                  onChange={(e) => {
                    setSelectedDisciplineCategory(e.target.value);
                    setSelectedSubtopicsMap({});
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 text-xs font-bold text-zinc-800 focus:outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="">-- Selecione o Módulo do Edital --</option>
                  <option value="especifico">Conhecimentos Específicos ({userDegree})</option>
                  <option value="Educação Brasileira: Temas Educacionais e Pedagógicos">Educação Brasileira & Pedagógicos</option>
                  <option value="Administração Pública">Administração Pública & Estatuto CE</option>
                  <option value="Língua Portuguesa">Língua Portuguesa</option>
                  <option value="Leitura e Interpretação de Dados e Indicadores Educacionais">Dados & Indicadores Educacionais</option>
                </select>
              </div>

              {selectedDisciplineCategory === 'especifico' && (
                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    🎯 Perfil Cadastrado:
                  </span>
                  <span className="font-black text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 text-[11px]">
                    {userDegree}
                  </span>
                </div>
              )}
            </div>

            {/* Bulk Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider">
                Tópicos do Edital ({currentTreeBlocks.reduce((acc, b) => acc + b.topics.length, 0)})
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleSelectAllInTree}
                  disabled={!selectedDisciplineCategory}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-[11px] font-extrabold hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Marcar Todos
                </button>
                <button
                  onClick={handleClearAllSelections}
                  disabled={!selectedDisciplineCategory}
                  className="px-3 py-1.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-xl text-[11px] font-bold hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Tree View Container - Simplified Top-Level Topics */}
            <div className="border border-zinc-200 rounded-2xl p-3 max-h-[480px] overflow-y-auto space-y-2 bg-zinc-50/50 scrollbar-thin">
              {!selectedDisciplineCategory ? (
                <div className="py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-emerald-200 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                    <Filter size={22} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-zinc-900">Selecione o Módulo do Edital</h4>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
                      Escolha um módulo no menu acima (ex: Conhecimentos Específicos, Língua Portuguesa) para carregar os tópicos e subtópicos.
                    </p>
                  </div>
                </div>
              ) : currentTreeBlocks.map((block) => (
                <div key={block.id} className="space-y-2">
                  {block.topics.map((topic) => {
                    const isTopicExpanded = !!expandedTopics[topic.id];
                    const subList = topic.subtopics.length > 0 
                      ? topic.subtopics 
                      : [{ id: `${topic.id}-gen`, name: topic.name, status: topic.status }];

                    const isTopicFullyChecked = subList.every(s => !!selectedSubtopicsMap[s.id]);
                    const isTopicPartiallyChecked = subList.some(s => !!selectedSubtopicsMap[s.id]);

                    return (
                      <div key={topic.id} className="bg-white rounded-2xl border border-zinc-200 p-3 shadow-2xs space-y-2">
                        {/* Topic Main Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => handleToggleTopicAll(block, topic)}
                              className="flex items-center gap-2 text-left cursor-pointer hover:text-emerald-800 transition shrink-0 mt-0.5"
                            >
                              {isTopicFullyChecked ? (
                                <CheckSquare size={18} className="text-emerald-700 shrink-0" />
                              ) : isTopicPartiallyChecked ? (
                                <div className="w-4 h-4 rounded bg-emerald-200 border border-emerald-600 flex items-center justify-center shrink-0">
                                  <div className="w-2 h-2 bg-emerald-800 rounded-xs" />
                                </div>
                              ) : (
                                <Square size={18} className="text-zinc-400 shrink-0" />
                              )}
                            </button>

                            <button
                              onClick={() => setExpandedTopics(p => ({ ...p, [topic.id]: !isTopicExpanded }))}
                              className="text-left flex-1 min-w-0 cursor-pointer group"
                            >
                              <span className={`text-xs font-bold leading-normal break-words block transition group-hover:text-emerald-800 ${
                                isTopicFullyChecked ? 'text-emerald-950 font-black' : 'text-zinc-800'
                              }`}>
                                {topic.name}
                              </span>
                            </button>
                          </div>

                          {/* Expand Toggle Button */}
                          <button
                            onClick={() => setExpandedTopics(p => ({ ...p, [topic.id]: !isTopicExpanded }))}
                            className="flex items-center gap-1 text-[11px] font-extrabold text-zinc-500 hover:text-emerald-800 bg-zinc-100 hover:bg-emerald-50 px-2.5 py-1 rounded-xl transition cursor-pointer shrink-0 mt-0.5"
                          >
                            <span>{topic.subtopics.length} subtópico(s)</span>
                            {isTopicExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </div>

                        {/* Subtopics List (visible only when expanded) */}
                        {isTopicExpanded && topic.subtopics.length > 0 && (
                          <div className="pl-6 pt-2 border-t border-zinc-100 space-y-1.5">
                            {topic.subtopics.map((sub) => {
                              const isSubChecked = !!selectedSubtopicsMap[sub.id];

                              return (
                                <div key={sub.id} className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleSubtopic({
                                      blockId: block.id,
                                      blockName: block.name,
                                      topicId: topic.id,
                                      topicName: topic.name,
                                      subtopicId: sub.id,
                                      subtopicName: sub.name
                                    })}
                                    className="flex items-center gap-2 text-left cursor-pointer hover:text-emerald-800 transition"
                                  >
                                    {isSubChecked ? (
                                      <CheckSquare size={15} className="text-emerald-700 shrink-0" />
                                    ) : (
                                      <Square size={15} className="text-zinc-300 shrink-0" />
                                    )}
                                    <span className={`text-[11px] ${isSubChecked ? 'font-bold text-emerald-950' : 'text-zinc-600'}`}>
                                      {sub.name}
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column (4 cols): Start Button & Summary */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-4 h-fit">
            <div className="space-y-1 pb-2 border-b border-zinc-100">
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-700" />
                Simulado FUNECE
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {selectedCount === 0 
                  ? 'Selecione ao menos um assunto do edital ao lado.' 
                  : (totalSubtopicsInTree > 0 && selectedCount >= totalSubtopicsInTree)
                    ? 'Todos os assuntos selecionados (Serão geradas 5 questões).'
                    : selectedCount === 1
                      ? '1 assunto selecionado (Será gerada 1 questão).'
                      : `${selectedCount} assuntos selecionados (Serão geradas ${computedQuestionCount} questões - 1 por assunto).`}
              </p>
            </div>

            {/* Generation Error Message */}
            {generationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0 text-rose-600" />
                <p className="font-bold">{generationError}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerateSimulado}
              disabled={isGenerating || selectedCount === 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white transition shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                selectedCount === 0 || isGenerating
                  ? 'bg-zinc-300 cursor-not-allowed opacity-70'
                  : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:opacity-95'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className="animate-spin text-emerald-200" />
                  <span>Gerando Questão Inédita...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-white" />
                  <span>
                    {computedQuestionCount === 1 
                      ? 'INICIAR (1 QUESTÃO)' 
                      : `INICIAR (${computedQuestionCount} QUESTÕES)`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE QUIZ PLAYER MODE (QCONCURSOS PLAYER INTERFACE)     */}
      {/* ========================================================= */}
      {activeQuizQuestions && activeQuizQuestions.length > 0 && !isQuizCompleted && (
        <div className="space-y-4">
          {/* Top Bar Navigation */}
          <div className="bg-white rounded-3xl p-4 border border-emerald-100 shadow-xs flex items-center justify-between gap-3">
            <button
              onClick={() => setActiveQuizQuestions(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 bg-zinc-100 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <ArrowLeft size={14} />
              Sair do Treino
            </button>

            <div className="flex items-center gap-3">
              {/* Timer Pill */}
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-900 px-3 py-1.5 rounded-xl border border-amber-200 font-mono text-xs font-bold">
                <Clock size={14} className="text-amber-700" />
                <span>{formatTime(quizElapsedTime)}</span>
              </div>

              {/* Progress Count */}
              <span className="text-xs font-black text-zinc-800">
                Questão {currentQuestionIndex + 1} / {activeQuizQuestions.length}
              </span>
            </div>

            <button
              onClick={handleFinishQuiz}
              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
            >
              Finalizar Treino
            </button>
          </div>

          {/* Question Numbers Quick Grid */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activeQuizQuestions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const hasAnswered = userAnswersMap[idx] !== undefined;
              const isSubmitted = submittedQuestionsMap[idx];
              const isCorrect = isSubmitted && userAnswersMap[idx] === q.correctAnswer;

              let style = "bg-white border-zinc-200 text-zinc-700 hover:border-emerald-300";
              if (isCurrent) {
                style = "bg-emerald-800 text-white font-black shadow-xs ring-2 ring-emerald-400";
              } else if (isSubmitted) {
                style = isCorrect ? "bg-emerald-100 text-emerald-900 border-emerald-400 font-bold" : "bg-rose-100 text-rose-900 border-rose-400 font-bold";
              } else if (hasAnswered) {
                style = "bg-teal-100 text-teal-900 border-teal-300 font-bold";
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center justify-center border ${style}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Current Question Card */}
          {(() => {
            const q = activeQuizQuestions[currentQuestionIndex];
            const qIdx = currentQuestionIndex;
            const selectedOpt = userAnswersMap[qIdx];
            const isSubmitted = submittedQuestionsMap[qIdx];
            const eliminatedMap = eliminatedOptionsMap[qIdx] || {};

            return (
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-5">
                {/* Question Metadata Header */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-emerald-800 text-white font-black text-[10px] px-2.5 py-0.5 rounded-md uppercase">
                      {q.banca}
                    </span>
                    <span className="bg-zinc-100 text-zinc-700 font-bold text-[10px] px-2 py-0.5 rounded-md">
                      {q.difficulty}
                    </span>
                    <span className="text-zinc-500 font-bold text-[11px]">
                      {q.subject} • {q.topic} {q.subtopic ? `• ${q.subtopic}` : ''}
                    </span>
                  </div>

                  <button
                    onClick={() => setBookmarkedMap(p => ({ ...p, [qIdx]: !p[qIdx] }))}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      bookmarkedMap[qIdx] ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                    }`}
                    title="Favoritar questão"
                  >
                    <Bookmark size={15} className={bookmarkedMap[qIdx] ? 'fill-amber-600' : ''} />
                  </button>
                </div>

                {/* Enunciado */}
                <div className="space-y-3">
                  {q.supportText && (
                    <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-100 text-xs text-zinc-600 italic leading-relaxed">
                      <FormattedText content={q.supportText} />
                    </div>
                  )}

                  <div className="text-xs sm:text-sm font-extrabold text-zinc-800 leading-relaxed">
                    <FormattedText content={q.questionText} />
                  </div>
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {q.options.map((opt) => {
                    const isSelected = selectedOpt === opt.letter;
                    const isEliminated = !!eliminatedMap[opt.letter];
                    const isCorrect = opt.letter === q.correctAnswer;

                    let containerStyle = "border-zinc-200 bg-white hover:border-emerald-300 text-zinc-800";
                    let badgeStyle = "bg-zinc-100 text-zinc-600";

                    if (isSelected && !isSubmitted) {
                      containerStyle = "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-xs";
                      badgeStyle = "bg-emerald-700 text-white";
                    } else if (isSubmitted) {
                      if (isCorrect) {
                        containerStyle = "border-emerald-500 bg-emerald-100/90 text-emerald-950 font-black shadow-xs";
                        badgeStyle = "bg-emerald-700 text-white";
                      } else if (isSelected && !isCorrect) {
                        containerStyle = "border-rose-400 bg-rose-50 text-rose-950 font-bold";
                        badgeStyle = "bg-rose-600 text-white";
                      }
                    }

                    return (
                      <div
                        key={opt.letter}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition ${containerStyle} ${
                          isEliminated ? 'opacity-40 grayscale' : ''
                        }`}
                      >
                        {/* Option Radio / Selection Button */}
                        <button
                          onClick={() => handleSelectOption(qIdx, opt.letter as any)}
                          className="flex items-start gap-3 flex-1 text-left cursor-pointer"
                        >
                          <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${badgeStyle}`}>
                            {opt.letter}
                          </span>
                          <div className={`text-xs sm:text-sm pt-0.5 leading-relaxed ${isEliminated ? 'line-through' : ''}`}>
                            <FormattedText content={opt.text} />
                          </div>
                        </button>

                        {/* Eliminate / Cross-out option tool */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEliminateOption(qIdx, opt.letter);
                          }}
                          className={`p-1.5 rounded-lg border text-zinc-400 hover:text-zinc-700 transition cursor-pointer ${
                            isEliminated ? 'bg-zinc-200 border-zinc-300 text-zinc-800' : 'bg-zinc-50 border-zinc-200'
                          }`}
                          title="Riscar alternativa"
                        >
                          <Strikethrough size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Instant Check Answer Button */}
                {quizMode === 'instant' && !isSubmitted && (
                  <div className="pt-2">
                    <button
                      onClick={() => handleCheckAnswerInstant(qIdx)}
                      disabled={!selectedOpt}
                      className={`w-full py-3 rounded-2xl font-black text-xs text-white transition shadow-xs cursor-pointer ${
                        selectedOpt ? 'bg-emerald-800 hover:bg-emerald-900' : 'bg-zinc-300 cursor-not-allowed'
                      }`}
                    >
                      Conferir Resposta
                    </button>
                  </div>
                )}

                {/* Comprehensive Solution Box */}
                {(isSubmitted || quizMode === 'exam') && (isSubmitted || isQuizCompleted) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80">
                      <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-700" />
                        Gabarito Oficial & Resolução Comentada (FUNECE)
                      </span>

                      <button
                        onClick={() => handleAskTutorQuestion(q)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-[11px] font-black hover:bg-emerald-100 cursor-pointer shadow-2xs"
                      >
                        <BrainCircuit size={13} className="text-emerald-700" />
                        Perguntar ao Tutor IA
                      </button>
                    </div>

                    {/* Theoretical Explanation */}
                    <div className="text-xs text-emerald-950 leading-relaxed font-medium">
                      <FormattedText content={q.explanation} />
                    </div>

                    {/* Common Traps / Pegadinha da Banca */}
                    {q.commonMistake && (
                      <div className="p-3 bg-amber-100/70 rounded-xl border border-amber-200/80 text-xs text-amber-950 space-y-1">
                        <span className="font-extrabold flex items-center gap-1.5 text-amber-900">
                          <AlertTriangle size={14} className="text-amber-700 shrink-0" />
                          Pegadinha Clássica da Banca:
                        </span>
                        <div className="text-[11px] text-amber-900 leading-relaxed">
                          <FormattedText content={q.commonMistake} />
                        </div>
                      </div>
                    )}

                    {/* Active Learning Study Tip */}
                    {q.studyTip && (
                      <div className="p-3 bg-teal-100/70 rounded-xl border border-teal-200/80 text-xs text-teal-950 space-y-1">
                        <span className="font-extrabold flex items-center gap-1.5 text-teal-900">
                          <Lightbulb size={14} className="text-teal-700 shrink-0" />
                          Dica de Memorização & Aprendizagem Ativa:
                        </span>
                        <div className="text-[11px] text-teal-900 leading-relaxed">
                          <FormattedText content={q.studyTip} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <button
                    onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Anterior
                  </button>

                  <button
                    onClick={() => {
                      if (currentQuestionIndex < activeQuizQuestions.length - 1) {
                        setCurrentQuestionIndex(p => p + 1);
                      } else {
                        handleFinishQuiz();
                      }
                    }}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer"
                  >
                    {currentQuestionIndex < activeQuizQuestions.length - 1 ? 'Próxima Questão' : 'Finalizar Treino'}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================= */}
      {/* FINAL RESULT / SCORE SCREEN                               */}
      {/* ========================================================= */}
      {isQuizCompleted && activeQuizQuestions && (
        <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xs space-y-6 text-center max-w-2xl mx-auto">
          <div className="p-4 bg-emerald-50 rounded-full w-20 h-20 mx-auto flex items-center justify-center border-2 border-emerald-200 text-emerald-800 shadow-xs">
            <Award size={40} />
          </div>

          <div>
            <h3 className="text-xl font-black text-zinc-900">Treino Concluído com Sucesso!</h3>
            <p className="text-xs text-zinc-500 mt-1">Confira seu resultado final e seu aproveitamento nesta bateria de questões</p>
          </div>

          {/* Score Calculation */}
          {(() => {
            let correctCount = 0;
            activeQuizQuestions.forEach((q, idx) => {
              if (userAnswersMap[idx] === q.correctAnswer) correctCount++;
            });
            const pct = Math.round((correctCount / activeQuizQuestions.length) * 100);

            return (
              <div className="grid grid-cols-3 gap-3 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase">Acertos</p>
                  <p className="text-lg font-black text-emerald-800">{correctCount} / {activeQuizQuestions.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase">Aproveitamento</p>
                  <p className="text-lg font-black text-emerald-800">{pct}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-zinc-500 uppercase">Tempo Total</p>
                  <p className="text-lg font-black text-zinc-800">{formatTime(quizElapsedTime)}</p>
                </div>
              </div>
            );
          })()}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setIsQuizCompleted(false);
                setCurrentQuestionIndex(0);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-2xl text-xs font-extrabold cursor-pointer"
            >
              Revisar Gabarito das Questões
            </button>

            <button
              onClick={() => {
                setActiveQuizQuestions(null);
                setIsQuizCompleted(false);
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-black shadow-xs cursor-pointer"
            >
              Nova Rodada de Questões
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BANCO DE QUESTÕES RESOLVIDAS FUNECE                */}
      {/* ========================================================= */}
      {activeTab === 'bank' && !activeQuizQuestions && (
        <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 flex items-center gap-2">
                <BookOpen size={16} className="text-emerald-700" />
                Banco de Questões FUNECE SEDUC
              </h3>
              <p className="text-[11px] text-zinc-500">Pratique com questões resolvidas e comentadas da banca CEV/UECE</p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {['Todas', 'Conhecimentos Específicos', 'Educação Brasileira', 'Língua Portuguesa', 'Administração Pública'].map((sub) => (
                <button
                  key={sub}
                  onClick={() => { setBankSubjectFilter(sub); setBankIndex(0); }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap cursor-pointer ${
                    bankSubjectFilter === sub ? 'bg-emerald-800 text-white' : 'bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Current Bank Question View */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-zinc-100 pb-2">
              <span className="bg-emerald-800 text-white font-black text-[10px] px-2 py-0.5 rounded-md">
                {currentBankQuestion.banca}
              </span>
              <span className="font-bold">{currentBankQuestion.subject} • {currentBankQuestion.topic}</span>
              <span className="font-bold">Questão {bankIndex + 1} de {filteredBankQuestions.length}</span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-zinc-800 leading-relaxed">
              {currentBankQuestion.questionText}
            </p>

            <div className="space-y-2">
              {currentBankQuestion.options.map(opt => (
                <div key={opt.letter} className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-800 flex items-center gap-2">
                  <span className="font-black bg-zinc-200 px-2 py-0.5 rounded-md text-zinc-700">{opt.letter}</span>
                  <span>{opt.text}</span>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-extrabold">Gabarito Oficial: Alternativa {currentBankQuestion.correctAnswer}</p>
              <p className="leading-relaxed">{currentBankQuestion.explanation}</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setBankIndex(p => Math.max(0, p - 1))}
                disabled={bankIndex === 0}
                className="px-4 py-2 bg-zinc-100 disabled:opacity-40 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setBankIndex(p => (p + 1) % filteredBankQuestions.length)}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TUTOR IA QUESTION CONTEXT MODAL                           */}
      {/* ========================================================= */}
      <AnimatePresence>
        {tutorQuestionContext && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 border border-emerald-100 shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-800 text-white rounded-xl">
                    <BrainCircuit size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-zinc-900">Tutor IA - Tira-Dúvidas da Questão</h4>
                    <p className="text-[11px] text-zinc-500">Especialista na Banca FUNECE SEDUC CE</p>
                  </div>
                </div>

                <button
                  onClick={() => setTutorQuestionContext(null)}
                  className="p-1.5 hover:bg-zinc-100 rounded-xl text-zinc-500 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>

              {/* Question Context Snippet */}
              <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs text-zinc-700 space-y-1">
                <p className="font-extrabold text-zinc-900">Questão: {tutorQuestionContext.topic}</p>
                <p className="text-[11px] italic text-zinc-600 line-clamp-2">"{tutorQuestionContext.questionText}"</p>
              </div>

              {/* Input Query */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-zinc-800">Sua dúvida sobre este conceito:</label>
                <textarea
                  rows={3}
                  value={tutorQuestionQuery}
                  onChange={(e) => setTutorQuestionQuery(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-3 text-xs font-medium text-zinc-800 focus:outline-none focus:border-emerald-600"
                  placeholder="Ex: Por que a lei considera este ponto específico? Como a FUNECE costuma cobrar isso?"
                />
              </div>

              {/* Answer View */}
              {tutorAnswerText && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-1">
                  <p className="font-black text-emerald-900">Resposta do Tutor IA:</p>
                  <p className="whitespace-pre-line">{tutorAnswerText}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setTutorQuestionContext(null)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fechar
                </button>

                <button
                  onClick={handleSendTutorQuery}
                  disabled={loadingTutor || !tutorQuestionQuery.trim()}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loadingTutor ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                  <span>Enviar ao Tutor</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
