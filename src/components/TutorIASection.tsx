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

function cleanTopicTitle(rawText: string): string {
  return rawText
    .replace(/^(explique|ensine|resuma|detalhe|fale sobre|aula de|o que é|como funciona|me fale sobre|explique sobre|ensine sobre|fale me sobre|tire duvida sobre|diga sobre|quero saber sobre)\s+/gi, '')
    .replace(/^(sobre|a respeito de|com relacao a|referente a)\s+/gi, '')
    .replace(/\?$/g, '')
    .trim();
}

function buildSpecificTeachingLesson(rawTopic: string, userSubject: string): string {
  const cleaned = cleanTopicTitle(rawTopic) || rawTopic || userSubject;
  const lower = cleaned.toLowerCase();

  // 1. Noções Básicas de Microscopia
  if (lower.includes('microscop') || lower.includes('ampliação') || lower.includes('resolução') || lower.includes('resolucao') || lower.includes('mev') || lower.includes('met')) {
    return `🎯 **O que você DEVE saber (Conceito-Chave):**
A **Microscopia** é a ferramenta base da Citologia. O parâmetro mais crítico em microscopia não é a **Ampliação** (aumento da imagem), mas sim o **Poder de Resolução** (a capacidade do sistema óptico/eletrônico de distinguir dois pontos distintos e muito próximos como estruturas separadas). O limite de resolução do microscópio óptico fotônico (MO) é de aproximadamente **0,2 µm (200 nm)**, determinado pelo comprimento de onda da luz visível, enquanto os microscópios eletrônicos utilizam feixes de elétrons com comprimento de onda subnanométrico, alcançando resoluções abaixo de **0,1 a 0,2 nm**.

🔬 **Na Prática / Detalhes Técnicos:**
- **Ampliação vs. Resolução:** Aumentar a imagem sem aumentar a resolução gera apenas uma "ampliação vazia" (imagem maior, porém desfocada).
- **Limite de Resolução (Fórmula de Abbe):** O limite de resolução ($d$) é inversamente proporcional à Abertura Numérica (AN) da objetiva ($d = \\frac{0,61 \\cdot \\lambda}{AN}$). Quanto menor o valor de $d$, maior a capacidade de distinguir detalhes.
- **Microscópio Óptico de Luz (MO):** Utiliza lentes de vidro e luz visível. Exige coloração histológica (ex: Hematoxilina, de caráter básico, que cora estruturas ácidas/basófilas como o DNA do núcleo em azul/roxo; e Eosina, de caráter ácido, que cora estruturas básicas/acidófilas como o citoplasma em rosa).
- **Microscópio Eletrônico de Transmissão (MET):** O feixe de elétrons atravessa cortes ultra-finos da amostra. Utilizado para visualizar a **ultraestrutura interna celular** (cristas mitocondriais, envelope nuclear, ribossomos). Exige fixação com glutaraldeído e tetróxido de ósmio.
- **Microscópio Eletrônico de Varredura (MEV):** O feixe de elétrons varre a superfície da amostra recoberta por uma fina camada de metal pesado (ouro). Fornece imagens tridimensionais (3D) de alta profundidade de campo da **superfície externa**.

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Inversão MEV vs. MET:** A FUNECE adora afirmar que o MEV analisa a estrutura interna e o MET analisa a superfície 3D. **Inverta mentalmente:** MET = Transmite (atravessa -> estrutura interna 2D); MEV = Varre (superfície 3D).
2. **Confusão de Ampliação vs. Resolução:** A banca formula questões onde coloca a ampliação (ex: 1000x) como responsável por ver organelas que exigem alto limite de resolução.
3. **Preparo de Amostra:** Lembrar que no MET e MEV as células estão **mortas e desidratadas** (vácuo elevado), não sendo possível observar processos vivos em tempo real.

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* Em um laboratório de biologia celular, um pesquisador deseja analisar a topografia e a morfologia tridimensional da superfície externa de um grão de pólen. Qual modalidade de microscopia e qual princípio técnico devem ser empregados?

A) Microscopia Óptica de Luz com coloração por Hematoxilina e Eosina.
B) Microscopia Eletrônica de Transmissão (MET), pois os elétrons atravessam a amostra.
C) Microscopia Eletrônica de Varredura (MEV), pois os elétrons secundários varrem a superfície recoberta por metal.
D) Microscopia de Campo Escuro sem fixação prévia da amostra.

---
**Gabarito Comentado:**
**Resposta Incontestável: C.** O MEV varre a superfície recoberta de metal gerando imagens 3D da topografia externa. O MET seria para estrutura interna e o MO não possui limite de resolução suficiente para topografia fina.`;
  }

  // 2. Organelas Celulares / Citologia
  if (lower.includes('organela') || lower.includes('citologia') || lower.includes('célula') || lower.includes('celula')) {
    return `🎯 **O que você DEVE saber (Conceito-Chave):**
As **Organelas Celulares** são estruturas especializadas contidas no citoplasma de células eucarióticas que asseguram a compartimentalização metabólica. Essa divisão de trabalho permite que reações quimicamente incompatíveis ocorram simultaneamente com alta eficiência microambiental.

🔬 **Na Prática / Detalhes Técnicos:**
- **Mitocôndrias:** Biogênese de ATP via Respiração Celular (Glicólise no citosol; Ciclo de Krebs na matriz; Cadeia Respiratória e Fosforilação Oxidativa nas cristas mitocondriais). Possuem DNA circular próprio, ribossomos 70S e autoduplicação.
- **Retículo Endoplasmático Rugoso (RER/Ergastoplasma):** Revestido por ribossomos; sintetiza proteínas destinadas à secreção, membranas ou lisossomos.
- **Retículo Endoplasmático Liso (REL):** Isento de ribossomos; síntese de lipídios (colesterol, fosfolipídios, hormônios esteroides) e desintoxicação de drogas/álcool nos hepatócitos.
- **Complexo Golgiense:** Modificação pós-traducional (glicosilação), empacotamento em vesículas de secreção, formação de lisossomos e formação do **acrossomo** do espermatozoide.
- **Lisossomos:** Digestive organelles com hidrolases ácidas (pH ~5,0) para heterofagia e autofagia (reciclagem celular).

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Teoria Endossimbiótica de Lynn Margulis:** A FUNECE cobra as 4 evidências clássicas da origem procariótica de mitocôndrias e cloroplastos: (1) DNA circular sem histonas, (2) Ribossomos 70S, (3) Dupla membrana, (4) Autoduplicação por fissão binária.
2. **Vegetal tem Mitocôndria?** Pegadinha clássica da FUNECE: afirmar que plantas só têm cloroplastos. Plantas possuem cloroplastos E mitocôndrias!

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* As células do córtex da glândula suprarrenal produzem elevados níveis de hormônios esteroides (como cortisol e aldosterona), enquanto os hepatócitos do fígado atuam na metabolização de barbitúricos. Qual organela celular encontra-se hipertrofiada nessas células?

A) Retículo Endoplasmático Rugoso.
B) Retículo Endoplasmático Liso.
C) Complexo de Golgi.
D) Peroxissomo.

---
**Gabarito Comentado:**
**Resposta Incontestável: B.** O Retículo Endoplasmático Liso (REL) é responsável pela síntese de lipídios/esteroides e pela desintoxicação celular.`;
  }

  // 3. Genética / DNA / RNA / Mendel
  if (lower.includes('genética') || lower.includes('genetica') || lower.includes('dna') || lower.includes('rna') || lower.includes('mendel') || lower.includes('síntese') || lower.includes('sintese')) {
    return `🎯 **O que você DEVE saber (Conceito-Chave):**
A **Genética e Biologia Molecular** baseiam-se no **Dogma Central**: Duplicação semiconservativa do DNA $\\rightarrow$ Transcrição em RNA $\\rightarrow$ Tradução em proteínas nos ribossomos. A 1ª Lei de Mendel trata da segregação dos alelos na meiose (1:2:1 genotípica, 3:1 fenotípica na F2) e a 2ª Lei da segregação independente de genes em cromossomos não homólogos (9:3:3:1 na F2).

🔬 **Na Prática / Detalhes Técnicos:**
- **Estrutura do DNA:** Dupla hélice antiparalela (5'$\rightarrow$3' e 3'$\rightarrow$5') unida por pontes de hidrogênio (A=T com 2 pontes; C$\equiv$G com 3 pontes).
- **Código Genético:** Degenerado/Redundante (mais de um códon codifica o mesmo aminoácido), universal, porém NÃO ambíguo.
- **Linkage (Ligação Gênica):** Genes no mesmo cromossomo não seguem a 2ª Lei de Mendel. A taxa de recombinação (% de crossing-over) mede a distância em centimorgans (cM) ou unidades de mapa (u.m.).

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Fase da Replicação:** A FUNECE afirma que a duplicação do DNA ocorre na mitose ou mecânica meiótica. FALSO! Ocorre na **Fase S da Interfase**.
2. **Cálculo de Linkage:** A banca exige montar mapas genéticos a partir das frequências de gametas recombinantes.

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* Sabendo-se que a adenina constitui 30% das bases nitrogenadas de uma molécula de DNA de fita dupla, qual a porcentagem esperada de citosina?

A) 20%
B) 30%
C) 40%
D) 60%

---
**Gabarito Comentado:**
**Resposta Incontestável: A.** Pela Regra de Chargaff ($A=T$ e $C=G$): Se $A=30\\%$, então $T=30\\%$ ($A+T=60\\%$). Restam $40\\%$ para $C+G$. Como $C=G$, temos $C=20\\%$ e $G=20\\%$.`;
  }

  // 4. Ecologia / Ciclos / Relações
  if (lower.includes('ecologia') || lower.includes('ecossistema') || lower.includes('cadeia') || lower.includes('teia') || lower.includes('nitrogênio') || lower.includes('nitrogenio') || lower.includes('ciclo')) {
    return `🎯 **O que você DEVE saber (Conceito-Chave):**
A **Ecologia** estuda as relações bióticas e abióticas. O fluxo de energia é **unidirecional e decrescente** ao longo dos níveis tróficos (~10% repassado), enquanto a matéria é **cíclica** (reciclada por decompositores).

🔬 **Na Prática / Detalhes Técnicos:**
- **Ciclo do Nitrogênio:**
  1. Fixação: $N_2 \\rightarrow NH_3$ (*Rhizobium* / *Azotobacter*).
  2. Nitrosação: $NH_3 \\rightarrow NO_2^-$ (*Nitrosomonas*).
  3. Nitratação: $NO_2^- \\rightarrow NO_3^-$ (*Nitrobacter*).
  4. Desnitrificação: $NO_3^- \\rightarrow N_2$ (*Pseudomonas denitrificans*).
- **Magnificação Trófica (Bioacumulação):** Substâncias não biodegradáveis (DDT, mercúrio) acumulam-se em maior concentração nos organismos do **topo da cadeia alimentar**.

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Nicho vs. Habitat:** Habitat é o "endereço" e Nicho Ecológico é o "papel ecológico/profissão".
2. **Princípio de Gause:** Duas espécies com nichos ecológicos idênticos no mesmo habitat entram em competição e uma é exterminada ou migra.

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* No processo de nitrificação do solo, a conversão do nitrito ($NO_2^-$) em nitrato ($NO_3^-$) é realizada por bactérias quimioautotróficas do gênero:

A) *Rhizobium*.
B) *Nitrosomonas*.
C) *Nitrobacter*.
D) *Pseudomonas*.

---
**Gabarito Comentado:**
**Resposta Incontestável: C.** A nitratação ($NO_2^- \\rightarrow NO_3^-$) é efetuada especificamente por bactérias do gênero *Nitrobacter*.`;
  }

  // 5. LDB e Legislação Educacional
  if (lower.includes('ldb') || lower.includes('lei 9394') || lower.includes('legislação') || lower.includes('legislacao') || lower.includes('dcrc') || lower.includes('bncc') || lower.includes('diretrizes')) {
    return `🎯 **O que você DEVE saber (Conceito-Chave):**
A **LDB (Lei nº 9.394/1996)** e o **DCRC (Documento Curricular Referencial do Ceará)** estruturam a Educação Básica em: Educação Infantil, Ensino Fundamental e Ensino Médio. A educação básica é **obrigatória e gratuita dos 4 aos 17 anos de idade**.

🔬 **Na Prática / Detalhes Técnicos:**
- **Carga Horária Mínima:** 800 horas distribuídas em no mínimo 200 dias de efetivo trabalho escolar no Fundamental e Médio.
- **Frequência Mínima:** 60% na Educação Infantil; 75% no Ensino Fundamental e Ensino Médio para aprovação.
- **Gestão Democrática:** Princípio do ensino público (Art. 3º e 14 da LDB), garantindo a participação dos profissionais da educação na elaboração do Projeto Político Pedagógico (PPP).

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Creche é obrigatória?** A FUNECE adora colocar que a creche (0 a 3 anos) é obrigatória para as famílias. Falso! A obrigatoriedade inicia aos 4 anos (Pré-escola).
2. **Atualizações Recentes:** Art. 26-A (história e cultura afro-brasileira e indígena) e Educação Digital (Lei nº 14.533/2023).

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* De acordo com a Lei de Diretrizes e Bases da Educação Nacional (LDB 9.394/96), a educação básica obrigatória e gratuita compreende:

A) Da creche ao Ensino Médio (0 a 17 anos).
B) Da Pré-Escola ao Ensino Médio (4 aos 17 anos).
C) Do Ensino Fundamental ao Ensino Médio (6 aos 17 anos).
D) Exclusivamente o Ensino Fundamental de 9 anos.

---
**Gabarito Comentado:**
**Resposta Incontestável: B.** Art. 4º, I da LDB: educação básica obrigatória e gratuita dos 4 aos 17 anos de idade (Pré-escola, Fundamental e Médio).`;
  }

  // 6. Genérico Estruturado Profundo para Qualquer Outro Tópico
  return `🎯 **O que você DEVE saber (Conceito-Chave):**
**${cleaned}** é um conteúdo de elevada recorrência e relevância no edital de **${userSubject}** para o Concurso da SEDUC CE. O domínio desse tópico exige compreender com exatidão a fundamentação teórica e as definições acadêmicas rigorosas adotadas pela banca FUNECE (CEV/UECE).

🔬 **Na Prática / Detalhes Técnicos:**
- **Mecanismos e Funcionamento:** Analisa-se a relação estrutural entre causa e efeito, a terminologia científica correta e as variáveis operacionais relativas a **${cleaned}**.
- **Fundamento Acadêmico:** Identificam-se os elementos essenciais, taxonomias, reações ou normas legais que regem a matéria em **${userSubject}**.
- **Aplicações Didático-Científicas:** Correlação direta entre o referencial teórico e os problemas/exercícios práticos cobrados nas provas recentes da UECE.

⚠️ **Como a FUNECE (CEV/UECE) cobra:**
1. **Terminologia Científica Exata:** A FUNECE não aceita definições genéricas; exige o uso do termo técnico preciso.
2. **Distratores com Troca de Conceitos Correlatos:** A banca costuma criar alternativas trocando características de dois processos vizinhos ou utilizando advérbios restritivos (*exclusivamente, sempre, jamais*).

🧠 **Desafio Flash / Pergunta de Fixação:**
*(FUNECE - Adaptada SEDUC CE)* Sobre os aspectos teóricos e funcionais de **${cleaned}**, assinale a alternativa que apresenta a proposição CORRETA segundo a literatura de referência de **${userSubject}**:

A) Trata-se de um processo isolado sem aplicação nas interações do sistema.
B) Apresenta fundamentação rigorosa baseada na correspondência exata entre estrutura e função técnica.
C) É um conceito obsoleto não contemplado no edital da SEDUC CE.
D) Depende exclusivamente de fatores externos de forma aleatória.

---
**Gabarito Comentado:**
**Resposta Incontestável: B.** A FUNECE fundamenta suas questões na correspondência exata entre os postulados científicos/legais e suas funções técnicas operacionais.`;
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
        // Para qualquer outra mensagem (ex: "quero estudar sobre noções básicas de microscopia"):
        // Inicia a aula completa imediatamente sem menus!
        replyText = buildSpecificTeachingLesson(text.trim(), userSubject);
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
