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

function cleanTopicTitle(rawText: string, activeTopicName?: string, userSubject: string = 'Biologia'): string {
  const lower = rawText.trim().toLowerCase().replace(/[?!.,;:]/g, '').trim();
  const subjectLower = userSubject.toLowerCase();

  // Frases de início, confirmação ou diálogo informal
  const startKeywords = [
    'vamos comecar', 'vamos começar', 'vamos la', 'vamos lá', 'vamos', 'bora',
    'iniciar', 'comecar', 'começar', 'pode comecar', 'pode começar', 'pode ser',
    'sim', 'ok', 'claro', 'pronto', 'pronta', 'estou pronto', 'estou pronta',
    'quero sim', 'vamos nessa', 'manda ver', 'manda', 'pode mandar', 'com certeza',
    'oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'ajuda', 'me ajuda',
    'estou com duvida', 'estou com dúvida', 'tenho duvida', 'tenho dúvida',
    'qual e a materia', 'qual e o assunto', 'o que estudo hoje', 'materia de hoje',
    'assunto de hoje', 'topico de hoje', 'meta de hoje', 'vamos a ela', 'estudar',
    'quero estudar', 'vamos estudar'
  ];

  const isStartOrConfirmation = startKeywords.some(kw => 
    lower === kw || 
    lower.startsWith('vamos') || 
    lower.startsWith('pode') || 
    lower.includes('comecar') || 
    lower.includes('começar') ||
    lower.includes('iniciar') ||
    (lower.includes('estudar') && !lower.match(/(microscop|mitocô|mitoco|dna|rna|ldb|ecolog|organel|citolog|genet|ciclo|pedagog|psicolog|didat)/i))
  );

  // Verifica se há alguma palavra-chave de assunto específico do edital
  const hasEditalKeyword = /microscop|organel|citolog|genet|dna|rna|mendel|ecolog|nitrog|ldb|bncc|dcrc|didat|psicolog|escola|avaliac|curríc|curric/i.test(lower);

  if ((isStartOrConfirmation || !hasEditalKeyword) && activeTopicName) {
    return activeTopicName;
  }

  // Se houver assunto específico, limpa prefixos
  let cleaned = rawText
    .replace(/^(quero|desejo|gostaria de|preciso|vamos|posso|pode)?\s*(estudar|aprender|ver|entender|revisar|começar|comecar|iniciar)?\s*/gi, '')
    .replace(/^(o|a)\s+(tópico|topico|conteúdo|conteudo|assunto|matéria|materia|disciplina)\s+(de|da|do)?\s*/gi, '')
    .replace(/^(tópico|topico|conteúdo|conteudo|assunto|matéria|materia|disciplina)\s+(de|da|do)?\s*/gi, '')
    .replace(/^(explique|ensine|resuma|detalhe|fale sobre|aula de|o que é|como funciona|me fale sobre|explique sobre|ensine sobre|fale me sobre|tire duvida sobre|diga sobre|quero saber sobre|me ajuda com|me ajuda em|tenho dúvida em|tenho duvida em)\s*/gi, '')
    .replace(/^(sobre|a respeito de|com relacao a|referente a)\s*/gi, '')
    .replace(/[?!.,;:]/g, '')
    .trim();

  const cleanedLower = cleaned.toLowerCase();

  if ((!cleaned || cleanedLower === subjectLower || cleanedLower === 'biologia' || cleanedLower === 'conhecimentos específicos' || cleanedLower === 'materia' || cleanedLower === 'matéria' || cleanedLower === 'topico' || cleanedLower === 'tópico' || cleanedLower === 'disciplina' || cleanedLower === 'hoje' || cleanedLower === 'comecar' || cleanedLower === 'começar' || cleanedLower === 'iniciar' || cleanedLower === 'vamos') && activeTopicName) {
    return activeTopicName;
  }

  return cleaned || activeTopicName || userSubject;
}

function checkFollowUpQuestion(rawText: string, userSubject: string): string | null {
  const lower = rawText.trim().toLowerCase();

  // 0. Saudações simples (resposta rápida e amigável sem aula)
  const greetingRegex = /^(oi|oii|oiii|olá|ola|boa tarde|bom dia|boa noite|tudo bem|tudo bom|tudo joia|fala prof|fala professor|professor|mestre|hey|hi|e ai|e aí|oi prof|oi professor|olá prof|olá professor)[\s!,?.]*$/i;
  if (greetingRegex.test(lower)) {
    return `Olá, Profª. Gerliane! Tudo ótimo por aqui! Como posso te ajudar hoje nos seus estudos para a SEDUC CE? Quer tirar uma dúvida, ver a meta de hoje ou resolver questões da FUNECE?`;
  }

  // Se for frase de início da aula, não é pergunta de seguimento
  if (lower.includes('vamos começar') || lower.includes('vamos comecar') || lower.includes('quero estudar') || lower.includes('vamos la') || lower.includes('materia de hoje')) {
    return null;
  }

  // 1. Dúvida específica sobre Resolução / Limite de Resolução / Abbe
  if (lower.includes('resoluc') || lower.includes('resoluç') || lower.includes('abbe') || lower.includes('limite de resol')) {
    return `O **Poder de Resolução** é a capacidade do microscópio de distinguir dois pontos extremamente próximos como estruturas separadas.\n\nDiferente da ampliação (que apenas aumenta o tamanho da imagem), o limite de resolução ($d$) depende do comprimento de onda ($\lambda$) e da abertura numérica ($AN$) da lente, pela fórmula de Abbe ($d = \\frac{0,61 \\cdot \\lambda}{AN}$). Quanto menor o $d$, maior o detalhamento! No microscópio óptico o limite é ~200 nm, enquanto no eletrônico atinge fração de nanômetro.\n\nFicou claro por que aumentar a imagem sem poder de resolução gera apenas uma imagem desfocada?`;
  }

  // 2. Dúvida sobre MET 2D
  if ((lower.includes('met') || lower.includes('transmissao') || lower.includes('transmissão')) && (lower.includes('2d') || lower.includes('plana') || lower.includes('atravess') || lower.includes('corte') || lower.includes('por que') || lower.includes('porque') || lower.includes('como'))) {
    return `No **MET (Microscópio Eletrônico de Transmissão)**, a imagem é em 2D porque o feixe de elétrons *atravessa* (transmite por) um corte celular ultra-fino.\n\nComo a amostra é fatiada em lâminas extremamente finas para os elétrons passarem por dentro dela, a imagem resultante no sensor é uma projeção bidimensional (2D) da ultraestrutura interna.\n\nEntendeu por que o MET gera essa fatia plana interna em 2D enquanto o MEV gera uma imagem tridimensional?`;
  }

  // 3. Dúvida sobre MEV 3D
  if ((lower.includes('mev') || lower.includes('varredura')) && (lower.includes('3d') || lower.includes('superficie') || lower.includes('superfície') || lower.includes('relevo') || lower.includes('por que') || lower.includes('porque') || lower.includes('como'))) {
    return `No **MEV (Microscópio Eletrônico de Varredura)**, a imagem é em 3D porque a amostra é recoberta com metal (ouro) e o feixe de elétrons *varre* a superfície externa.\n\nOs elétrons refletidos rebatem em detectores que mapeiam a profundidade e a topografia celular, gerando uma imagem tridimensional (3D) de alta profundidade de campo.\n\nConseguiu visualizar essa diferença entre varrer a superfície (MEV 3D) e atravessar a amostra (MET 2D)?`;
  }

  // 4. Dúvida sobre Hematoxilina / Eosina
  if (lower.includes('hematoxilina') || lower.includes('eosina') || lower.includes('corante') || lower.includes('colora')) {
    return `A **Hematoxilina** é um corante básico com afinidade por estruturas ácidas (basófilas) da célula, como o DNA do núcleo, tingindo-as em roxo/azul.\n\nA **Eosina** é um corante ácido com afinidade por estruturas básicas (acidófilas), como as proteínas do citoplasma, tingindo-as em rosa.\n\nA FUNECE adora trocar essa relação! Conseguiu fixar que Hematoxilina cora o núcleo e Eosina cora o citoplasma?`;
  }

  // 5. Dúvida sobre Ampliação vs Resolução
  if (lower.includes('amplia') || lower.includes('aumento')) {
    return `A **Ampliação** representa o quanto a imagem é multiplicada em tamanho (ex: 100x, 1000x).\n\nPorém, aumentar a imagem sem ter um bom **Poder de Resolução** gera apenas a chamada "ampliação vazia": a imagem fica maior, mas completamente desfocada! Por isso a FUNECE foca tanto na resolução como o parâmetro principal.\n\nFicou clara essa diferença entre aumentar o tamanho e conseguir enxergar detalhes?`;
  }

  // 6. Dúvida pedagógica (Inatismo / Behaviorismo)
  if (lower.includes('inatismo') || lower.includes('behaviorismo') || lower.includes('comportamentalismo') || lower.includes('cognitivismo') || lower.includes('interacionismo')) {
    return `Nas teorias de aprendizagem cobradas pela FUNECE:\n\n• **Inatismo:** Defende que os conhecimentos e capacidades do aluno já nascem pré-formados com ele.\n• **Behaviorismo / Comportamentalismo:** Defende que a aprendizagem ocorre por estímulo-resposta e reforço do ambiente (Skinner).\n• **Interacionismo / Cognitivismo:** O conhecimento é construído na relação ativa do sujeito com o meio e a sociedade (Piaget / Vygotsky).\n\nA FUNECE gosta de perguntar sobre o papel do professor em cada vertente. Qual dessas abordagens você quer detalhar agora?`;
  }

  // 7. Pergunta curta com "por que", "como", "e ", "qual", "o que é"
  const isQuestion = lower.includes('?') || lower.startsWith('por que') || lower.startsWith('porque') || lower.startsWith('como') || lower.startsWith('e ') || lower.startsWith('qual') || lower.startsWith('o que');
  
  if (isQuestion && lower.length < 120) {
    return `Sobre a sua dúvida específica:\n\nEsse é um detalhe muito importante exigido pela FUNECE! A banca cobra com precisão o termo técnico e o mecanismo prático de aplicação.\n\nConseguiu entender bem esse ponto ou quer que eu te ensine de uma forma mais simplificada adequando a exemplos da vida real?`;
  }

  return null;
}

function buildSpecificTeachingLesson(rawTopic: string, userSubject: string, activeTopicName?: string, userWantsQuiz: boolean = false): string {
  // Verifica se é pergunta de seguimento/continuidade
  const followUp = checkFollowUpQuestion(rawTopic, userSubject);
  if (followUp) {
    return followUp;
  }

  const cleaned = cleanTopicTitle(rawTopic, activeTopicName, userSubject) || activeTopicName || userSubject;
  const lower = cleaned.toLowerCase();

  let body = '';

  // 1. Noções Básicas de Microscopia
  if (lower.includes('microscop') || lower.includes('ampliação') || lower.includes('ampliacao') || lower.includes('resolução') || lower.includes('resolucao') || lower.includes('mev') || lower.includes('met')) {
    body = `**Noções Básicas de Microscopia — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Microscopia** compreende o conjunto de técnicas de magnificação e análise visual de microestruturas celulares. O conceito central mais cobrado em prova não é a mera ampliação da imagem, mas sim o **Poder de Resolução** — a distância mínima necessária entre dois pontos para que sejam identificados como estruturas separadas. Seu limite ($d$) é determinado pela fórmula de Abbe ($d = \\frac{0,61 \\cdot \\lambda}{AN}$).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Ampliação vs. Resolução:** Aumentar a imagem sem resolução adequada gera a chamada "ampliação vazia" (imagem grande, porém borrada).
• **Microscópio Óptico de Luz (MO):** Utiliza fótons de luz visível e lentes de vidro. Limite de resolução de ~200 nm. Exige coloração histológica (ex: Hematoxilina/Eosina).
• **Microscópio Eletrônico de Transmissão (MET):** Feixe de elétrons atravessa cortes ultrafinos da amostragem, permitindo mapear a **ultraestrutura interna** (2D) em escala de nanômetros.
• **Microscópio Eletrônico de Varredura (MEV):** Feixe de elétrons varre a superfície recoberta de metal, gerando mapeamento **tridimensional (3D) da superfície**.
⚠️ **Pegadinha da FUNECE:** A banca adora trocar as funções de MET e MEV. Guarde que o MET atravessa (2D interno) e o MEV varre a superfície (3D externo).`;
  }
  // 2. Organelas Celulares / Citologia
  else if (lower.includes('organela') || lower.includes('citologia') || lower.includes('célula') || lower.includes('celula')) {
    body = `**Organelas Celulares — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
As **Organelas Celulares** são subestruturas especializadas imersas no hialoplasma/citoplasma das células eucarióticas. Sua função biológica primária é promover a **compartimentalização celular**, permitindo que diferentes reações bioquímicas incompatíveis ocorram isoladamente com máxima eficiência energética.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Mitocôndrias:** Síntese de ATP via respiração celular aeróbia. Possuem origem endossimbiótica (DNA circular próprio, ribossomos 70S e autoduplicação por fissão binária).
• **Retículo Endoplasmático Rugoso (RER):** Revestido de ribossomos; atua na síntese e transporte de proteínas destinadas à secreção ou membranas.
• **Retículo Endoplasmático Liso (REL):** Sem ribossomos; atua na síntese de lipídios/esteroides e desintoxicação celular.
• **Complexo Golgiense:** Secreção celular, modificação pós-traducional de proteínas e formação do acrossomo do espermatozoide.
• **Lisossomos:** Vesículas com hidrolases ácidas para digestão intracelular (autofagia e heterofagia).
⚠️ **Pegadinha da FUNECE:** A banca costuma afirmar falsamente que vegetais não possuem mitocôndrias (possuem mitocôndrias E cloroplastos!) ou que a duplicação do DNA ocorre durante a mitose (ocorre na Fase S da Interfase).`;
  }
  // 3. Genética / DNA / RNA / Mendel
  else if (lower.includes('genética') || lower.includes('genetica') || lower.includes('dna') || lower.includes('rna') || lower.includes('mendel') || lower.includes('síntese') || lower.includes('sintese')) {
    body = `**Genética e Biologia Molecular — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Genética Molecular** estuda a estrutura, duplicação e expressão do material genético. O ponto central é o **Dogma Central da Biologia Molecular**: o DNA duplica-se de maneira semiconservativa, é transcrito em RNAm e este é traduzido em sequências de aminoácidos (proteínas) nos ribossomos.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Estrutura do DNA:** Dupla hélice antiparalela (5'→3' e 3'→5') estabilizada por pontes de hidrogênio (A=T com 2 pontes; C≡G com 3 pontes).
• **Código Genético Degenerado:** Múltiplos códons codificam o mesmo aminoácido.
• **Leis de Mendel e Linkage:** A 1ª Lei trata da segregação dos alelos na meiose; a 2ª Lei trata da segregação independente em cromossomos distintos; o Linkage ocorre quando os genes estão no mesmo cromossomo.
⚠️ **Pegadinha da FUNECE:** A banca afirma com frequência que a replicação do DNA ocorre durante a divisão celular. Correção: a duplicação ocorre exclusivamente na **Fase S da Interfase**.`;
  }
  // 4. Ecologia / Ciclos / Relações
  else if (lower.includes('ecologia') || lower.includes('ecossistema') || lower.includes('cadeia') || lower.includes('teia') || lower.includes('nitrogênio') || lower.includes('nitrogenio') || lower.includes('ciclo')) {
    body = `**Ecologia e Ciclos Biogeoquímicos — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Ecologia** estuda a dinâmica das interações entre organismos e o ambiente abiótico. A regra central estabelece que o **fluxo de energia é unidirecional e decrescente** ao longo da teia alimentar (~10% retido por nível trófico), enquanto a **matéria é 100% cíclica** e reciclada pelos decompositores.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Ciclo do Nitrogênio:** Etapas bacterianas estritas: Fixação (*Rhizobium*) $\rightarrow$ Nitrosação (*Nitrosomonas*) $\rightarrow$ Nitratação (*Nitrobacter*) $\rightarrow$ Desnitrificação (*Pseudomonas*).
• **Magnificação Trófica:** Concentração progressiva de substâncias não biodegradáveis (agrotóxicos/metais) nos organismos do **topo da cadeia alimentar**.
• **Nicho Ecológico vs. Habitat:** Habitat é o espaço físico; Nicho é a função ecológica e hábitos da espécie.
⚠️ **Pegadinha da FUNECE:** A FUNECE costuma alegar que a energia é reciclada pelos decompositores. Errado! Apenas a MATÉRIA se recicla; a energia dissipa-se como calor.`;
  }
  // 5. LDB / Legislação / DCRC
  else if (lower.includes('ldb') || lower.includes('lei 9394') || lower.includes('legislação') || lower.includes('legislacao') || lower.includes('dcrc') || lower.includes('bncc') || lower.includes('diretrizes')) {
    body = `**LDB (Lei nº 9.394/1996) — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **LDB** é a legislação orgânica federal que disciplina a Educação Nacional no Brasil. Ela divide a Educação Escolar em duas categorias: Educação Básica (composta por Educação Infantil, Ensino Fundamental e Ensino Médio) e Educação Superior.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Obrigatoriedade e Gratuidade:** Dos **4 aos 17 anos** de idade (Pré-escola, Ensino Fundamental e Ensino Médio).
• **Carga Horária Mínima:** 800 horas distribuídas em no mínimo 200 dias de efetivo trabalho escolar.
• **Frequência Mínima Exigida:** 60% na Educação Infantil e 75% no Ensino Fundamental e Médio para aprovação.
⚠️ **Pegadinha da FUNECE:** A banca tenta enganar afirmando que a Creche (0 aos 3 anos) é de matrícula obrigatória pelos pais. Incorreto! O dever de oferta é do Estado, mas a obrigação da família de matricular o aluno inicia aos **4 anos** (Pré-escola).`;
  }
  // 6. Genérico Estruturado
  else {
    body = `**${cleaned} (${userSubject}) — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
O tópico **${cleaned}** compreende a fundamentação teórica e as definições essenciais no campo de **${userSubject}**. Sua análise exige a compreensão exata das propriedades, nomenclaturas oficiais e diretrizes vigentes.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Aplicação Direta:** A banca avalia a capacidade de relacionar a definição teórica com a resolução de problemas e situações-problema.
• **Atalhos e Cuidados:** Atenção a termos absolutistas nas alternativas (*sempre, nunca, apenas, exclusivamente*) que buscam invalidar proposições corretas.`;
  }

  // Se a usuária pediu EXPLICITAMENTE uma questão ou exercício
  if (userWantsQuiz) {
    body += `\n\n🧠 **Desafio de Fixação da FUNECE:**
*(Adaptada SEDUC CE)* Sobre este tema, qual das alternativas apresenta a proposição correta segundo a literatura de referência?

A) Os conceitos teóricos aplicam-se independentemente da estrutura do sistema.
B) A correspondência exata entre fundamentação técnica e função operacional assegura o acerto da questão.
C) Trata-se de um tópico meramente secundário sem cobrança em provas da UECE.
D) A aplicação prática exclui os postulados clássicos da literatura de referência.

---
**Gabarito Comentado:**
**Resposta Incontestável: B.** A FUNECE fundamenta suas questões na correspondência exata entre a definição teórica e sua função técnica.`;
  }

  // Pergunta final oferecendo simplificação com exemplos da vida real
  const closingQuestion = `\n\n💡 **Perguntinha do Mentor:**\nFicou clara para você a definição e a aplicação técnica de **${cleaned}**? Quer que eu te ensine de uma forma mais simplificada adequando a exemplos da vida real, ou prefere responder a uma questão da banca FUNECE sobre este assunto agora?`;

  return body + closingQuestion;
}

export default function TutorIASection({ user, profile, setActiveTab }: TutorIASectionProps) {
  const userName = profile?.name || user.displayName || 'Professor(a)';
  const userSubject = profile?.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';
  
  const uid = user?.uid || profile?.uid || 'guest';
  const storageKey = `cronogramaProgress_${uid}`;

  // State for user's completed topic IDs from Cronograma
  const [completedTopicIds, setCompletedTopicIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(storageKey) || localStorage.getItem('cronogramaProgress_guest') || localStorage.getItem('cronogramaProgress_default');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load cronograma progress from localStorage and Firestore
  useEffect(() => {
    const loadSavedCronogramaProgress = async () => {
      let currentLocalMap: Record<string, boolean> = {};
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
        console.warn('Erro ao carregar cronograma do localStorage:', err);
      }

      const activeUid = user?.uid || profile?.uid;
      if (activeUid) {
        try {
          const docRef = doc(db, 'cronogramaProgress', activeUid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data?.completedTopicIds) {
              const merged = { ...currentLocalMap, ...data.completedTopicIds };
              setCompletedTopicIds(merged);
              localStorage.setItem(storageKey, JSON.stringify(merged));
              localStorage.setItem('cronogramaProgress_guest', JSON.stringify(merged));
            }
          }
        } catch (err) {
          console.warn('Erro ao carregar cronograma do Firestore:', err);
        }
      }
    };

    loadSavedCronogramaProgress();
  }, [user?.uid, profile?.uid, storageKey]);

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
      text: `Olá, Prof. ${userName}! Sou o seu Professor Mentor IA especialista na Banca FUNECE (CEV/UECE) para o Concurso SEDUC CE 2026.\n\n⚡ **Modo Neurociência Ativado:** Explicações diretas (zero enrolação), ancoragem em exemplos concretos do mundo real (como usar um ovo para explicar a célula) e testes de resgate ativo!\n\n📌 **Sua Meta Ativa de Hoje (Dia ${currentDay?.dayNumber || 1} • ${currentDay?.displayDate || 'Hoje'}):**\n${currentDay?.topics.map(t => {
        const subtext = t.subtopicNames && t.subtopicNames.length > 0 ? t.subtopicNames.join(', ') : t.parentTopicName;
        return `• **${t.category}:** ${subtext}`;
      }).join('\n') || 'Meta pronta para início!'}\n\n📊 **Progresso do Edital:** ${completedCount} de ${totalSubtopics} subtópicos (${progressPercent}%).\n\nQual tópico do edital você quer dominar agora?`,
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
          text: `Olá, Prof. ${userName}! Sou o seu Professor Mentor IA especialista na Banca FUNECE (CEV/UECE) para o Concurso SEDUC CE 2026.\n\n⚡ **Modo Neurociência Ativado:** Explicações diretas (zero enrolação), ancoragem em exemplos concretos do mundo real (como usar um ovo para explicar a célula) e testes de resgate ativo!\n\n📌 **Sua Meta Ativa de Hoje (Dia ${currentDay.dayNumber} • ${currentDay.displayDate}):**\n${metaStr}\n\n📊 **Progresso do Edital:** ${completedCount} de ${totalSubtopics} subtópicos (${progressPercent}%).\n\nQual tópico do edital você quer dominar agora?`,
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
          history: messages.slice(-10).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', text: m.text })),
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

      const isStrictGreeting = /^(oi|olá|ola|boa tarde|bom dia|boa noite)$/i.test(lowerMsg);

      if (isStrictGreeting) {
        replyText = `Olá, Prof. ${userName}! Sou seu Professor Mentor especialista em **${userSubject}** para o Concurso SEDUC CE 2026 (FUNECE).\n\nEstou pronto! Qual assunto do edital vamos dominar agora? Digite o tópico e iniciaremos a aula imediatamente!`;
      } else if (lowerMsg.includes('estudo hoje') || lowerMsg.includes('meta de hoje') || lowerMsg.includes('cronograma de hoje')) {
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
      } else if (lowerMsg.includes('progresso') || lowerMsg.includes('como estou indo') || lowerMsg.includes('desempenho') || lowerMsg.includes('estatística')) {
        const metaSubtopics = currentDay?.topics.map(t => t.subtopicNames?.length ? t.subtopicNames.join(', ') : t.parentTopicName).join(' • ');
        replyText = `📊 **Seu Desempenho Real no Sistema**\n\n• **Disciplina Alvo:** ${userSubject}\n• **Edital Concluído:** ${completedCount} de ${totalSubtopics} subtópicos (${progressPercent}%)\n• **Dia Atual no Cronograma:** Dia ${currentDay?.dayNumber || 1} (${currentDay?.displayDate || 'Hoje'})\n• **Meta de Subtópicos de Hoje:** ${metaSubtopics}`;
      } else {
        const specTopic = currentDay?.topics.find(t => t.category === 'Conhecimentos Específicos') || currentDay?.topics[0];
        const activeTopicName = specTopic?.subtopicNames?.[0] || specTopic?.parentTopicName || 'Noções Básicas de Microscopia';
        const userWantsQuiz = /questã|questao|simulado|exercí|exercici|pergunta|testar/i.test(lowerMsg);

        replyText = buildSpecificTeachingLesson(text.trim(), userSubject, activeTopicName, userWantsQuiz);
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
    <div className="space-y-2 flex flex-col h-[82vh]">
      {/* Compact Header */}
      <div className="bg-white rounded-xl px-3.5 py-2.5 border border-emerald-100 shadow-2xs flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-gradient-to-br from-emerald-800 to-teal-900 text-amber-300 rounded-lg shadow-2xs shrink-0">
            <GraduationCap size={18} />
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <h2 className="text-sm font-black text-zinc-900 shrink-0">Professor Mentor IA</h2>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 truncate">
              Dia {currentDay?.dayNumber || 1} • {userSubject}
            </span>
          </div>
        </div>

        {setActiveTab && (
          <button
            onClick={() => setActiveTab('cronograma')}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Ver Cronograma</span>
            <ArrowRight size={12} />
          </button>
        )}
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
