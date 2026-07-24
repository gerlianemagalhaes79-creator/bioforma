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

  // 1. Organelas Celulares / Citologia / Célula
  if (lower.includes('organela') || lower.includes('citologia') || lower.includes('célula') || lower.includes('celula')) {
    return `### 1. Introdução
As **Organelas Celulares** são compartimentos subcelulares altamente especializados contidos no citosol das células eucarióticas. Elas existem para proporcionar a compartimentalização celular — permitindo que processos metabólicos distintos e quimicamente incompatíveis ocorram simultaneamente com máxima eficiência.

### 2. Conceito
Morfofuncionalmente, organelas são unidades estruturais (membranosas ou não membranosas) que realizam funções vitais específicas, como bioenergética (síntese de ATP), biogênese macromolecular (proteínas e lipídios), secreção vesicular e digestão intracelular.

### 3. Explicação Didática
Pense na célula eucariótica como uma cidade industrial autossuficiente:
- **Núcleo:** Central de Comando (armazena o DNA e orquestra a transcrição de RNAm).
- **Ribossomos:** Operários de montagem (ligam aminoácidos via ligações peptídicas).
- **Retículo Endoplasmático Rugoso (RER):** Fábrica de proteínas exportáveis e de membrana (revestido de ribossomos).
- **Retículo Endoplasmático Liso (REL):** Indústria química de lipídios (colesterol, fosfolipídios, hormônios esteroides) e desintoxicação celular de fármacos e álcool nos hepatócitos.
- **Complexo de Golgi:** Correios e Centro de Distribuição (modifica, empacota e envia vesículas de secreção e forma o acrossomo do espermatozoide).
- **Mitocôndrias:** Usinas de energia (realizam a respiração celular aeróbica gerando ATP).
- **Lisossomos:** Setor de Reciclagem e Sucata (vesículas ricas em hidrolases ácidas em pH ~5,0 para digestão heterofágica e autofágica).
- **Peroxissomos:** Segurança química (degradam peróxido de hidrogênio H₂O₂ via enzima catalase e realizam a beta-oxidação de ácidos graxos).
- **Cloroplastos (Vegetais):** Painéis solares (realizam a fotossíntese transformando energia luminosa em energia química).

### 4. Exemplos
- **Células do Fígado (Hepatócitos):** Possuem o REL extremamente hipertrofiado para metabolizar toxinas e medicamentos.
- **Células Musculares (Miócitos):** Apresentam elevado número de mitocôndrias para suprir a alta demanda de ATP no deslizamento das fibras de actina e miosina.

### 5. Relação com o Edital
Corresponde ao bloco de **Citologia e Biologia Celular** do edital SEDUC CE.

### 6. Como a FUNECE cobra
A banca **CEV/UECE (FUNECE)** prioriza a **Teoria Endossimbiótica de Lynn Margulis**. Exige que o candidato reconheça as evidências de que mitocôndrias e cloroplastos eram procariontes primitivos englobados por eucariontes heterótrofos:
1. Presença de DNA próprio circular sem histonas.
2. Ribossomos próprios do tipo 70S.
3. Dupla membrana lipoproteica.
4. Capacidade de autoduplicação independente do núcleo.

### 7. Pegadinhas
- **Pegadinha 1 (FUNECE):** Afirmar que células vegetais só têm cloroplastos e não têm mitocôndria. Errado! Vegetais possuem mitocôndrias e cloroplastos.
- **Pegadinha 2:** Confundir a função do RER (síntese proteica) com o REL (síntese de lipídios e desintoxicação).

### 8. Decore Isso
💡 **Macete:** **M.G.R.L.P**
- **M**itocôndria = ATP e Respiração
- **G**olgi = Secreção e Acrossomo
- **R**ER = Proteínas
- **L**isossomo = Digestão e Autofagia
- **P**eroxissomo = H₂O₂ e Catalase

### 9. Resumo
1. Organelas garantem a compartimentalização e eficiência das células eucarióticas.
2. Mitocôndrias e cloroplastos possuem origem endossimbiótica.
3. RER produz proteínas para secreção e REL produz lipídios/desintoxica.
4. Complexo de Golgi endereça vesículas e forma o acrossomo.
5. Lisossomos realizam autofagia e heterofagia celular via hidrolases ácidas.

### 10. Micro Revisão
1. *Qual organela é responsável pela síntese de hormônios esteroides e desintoxicação?*
2. *Quais as evidências da Teoria Endossimbiótica nas mitocôndrias?*
3. *Em qual organela origina-se o acrossomo do espermatozoide?*

**Gabarito:**
1. Retículo Endoplasmático Liso (REL).
2. DNA próprio circular, ribossomos 70S e dupla membrana.
3. No Complexo de Golgi.`;
  }

  // 2. Genética / DNA / RNA
  if (lower.includes('genética') || lower.includes('genetica') || lower.includes('dna') || lower.includes('rna') || lower.includes('mendel') || lower.includes('síntese') || lower.includes('sintese')) {
    return `### 1. Introdução
A **Genética** estuda os mecanismos de hereditariedade e a estrutura dos ácidos nucléicos (DNA e RNA) que codificam as características biológicas.

### 2. Conceito
Morfofuncionalmente baseia-se no **Dogma Central da Biologia Molecular**: Replicação do DNA (semiconservativa), Transcrição em RNAm e Tradução em proteínas nos ribossomos.

### 3. Explicação Didática
- **DNA:** Dupla hélice antiparalela (5'->3' e 3'->5') unida por pontes de hidrogênio entre A-T (2 pontes) e C-G (3 pontes).
- **RNA:** Fita simples composta por ribose e Uracila (U) substituindo a Timina (T).
- **1ª Lei de Mendel:** Segregação dos fatores na formação dos gametas (Aa x Aa gera proporção fenotípica 3:1).
- **2ª Lei de Mendel:** Segregação independente de genes em cromossomos não homólogos (AaBb x AaBb gera 9:3:3:1 na F2).

### 4. Exemplos
- **Sistema ABO:** Codominância entre os alelos Iᴬ e Iᴮ e dominância sobre o alelo recessivo i.
- **Anemia Falciforme:** Mutação de ponto com substituição de ácido glutâmico por valina na betaglobina.

### 5. Relação com o Edital
Bloco de **Genética e Biologia Molecular** do edital SEDUC CE.

### 6. Como a FUNECE cobra
A FUNECE cobra heredogramas com **Epistasia** e **Linkage (Ligação Gênica)**. Exige o cálculo da taxa de recombinação (% de crossing-over no paquíteno) para mapeamento cromossômico em centimorgans (cM).

### 7. Pegadinhas
- **Pegadinha FUNECE:** Afirmar que a replicação do DNA ocorre na mitose. Errado! Ocorre na **Fase S da Interfase**.
- O código genético é **degenerado** (vários códons para um aminoácido), mas nunca ambíguo.

### 8. Decore Isso
💡 **Proporções Mendelianas:** 1ª Lei = **3:1** | 2ª Lei = **9:3:3:1**.

### 9. Resumo
1. DNA é dupla hélice com pareamento A-T e C-G.
2. Replicação é semiconservativa na Fase S da interfase.
3. Transcrição produz RNAm e Tradução sintetiza proteínas.
4. 1ª Lei de Mendel: segregação dos fatores (3:1).
5. 2ª Lei: segregação independente em cromossomos diferentes (9:3:3:1).

### 10. Micro Revisão
1. *Em qual fase da interfase ocorre a duplicação do DNA?*
2. *O que é um código genético degenerado?*
3. *Qual a proporção fenotípica da F2 na 1ª Lei de Mendel?*

**Gabarito:** 1. Fase S. 2. Diferentes códons codificam o mesmo aminoácido. 3. 3:1.`;
  }

  // 3. Ecologia / Ciclos / Relações
  if (lower.includes('ecologia') || lower.includes('ecossistema') || lower.includes('cadeia') || lower.includes('teia') || lower.includes('nitrogênio') || lower.includes('nitrogenio') || lower.includes('ciclo')) {
    return `### 1. Introdução
A **Ecologia** analisa as interações entre os seres vivos (fatores bióticos) e o meio ambiente físico/químico (fatores abióticos).

### 2. Conceito
Estrutura-se em População (mesma espécie), Comunidade (várias espécies), Ecossistema (comunidade + meio abiótico) e Biosfera.

### 3. Explicação Didática
- **Fluxo de Energia:** Unidirecional e decrescente (~10% por nível trófico).
- **Ciclo do Nitrogênio:** Depende de bactérias: Fixação (*Rhizobium*), Nitrosação (*Nitrosomonas*), Nitratação (*Nitrobacter*) e Desnitrificação.
- **Relações Ecológicas:** Mutualismo (+/+ obrigatório), Protocooperação (+/+ facultativo), Comensalismo (+/0), Parasitismo (+/-) e Amensalismo (-/0).

### 4. Exemplos
- **Magnificação Trófica:** Acúmulo de metais pesados (mercúrio) no topo da cadeia alimentar.

### 5. Relação com o Edital
Bloco de **Ecologia** do edital SEDUC CE.

### 6. Como a FUNECE cobra
A FUNECE exige diferenciação entre **Habitat** (endereço) e **Nicho Ecológico** (papel ecológico) e cobra o Princípio da Exclusão Competitiva de Gause.

### 7. Pegadinhas
- **Pegadinha:** A energia flui unidirecionalmente, enquanto a matéria é reciclada pelos decompositores.

### 8. Decore Isso
💡 **Nitrificação:** Amônia -> Nitrosomonas -> Nitrito -> Nitrobacter -> Nitrato.

### 9. Resumo
1. Nicho é função; habitat é localização.
2. Fluxo energético é unidirecional e decrescente.
3. Bioacumulantes concentram-se no topo da cadeia.
4. Nitrobacter converte nitrito em nitrato.
5. Gause prevê competição por nichos sobrepostos.

### 10. Micro Revisão
1. *Bactéria que converte nitrito em nitrato?*
2. *Nível trófico com maior bioacumulação de toxina?*
3. *Diferença entre habitat e nicho?*

**Gabarito:** 1. *Nitrobacter*. 2. Topo da cadeia. 3. Habitat é endereço; nicho é função.`;
  }

  // 4. LDB / Legislação / DCRC
  if (lower.includes('ldb') || lower.includes('lei 9394') || lower.includes('legislação') || lower.includes('legislacao') || lower.includes('dcrc') || lower.includes('bncc') || lower.includes('diretrizes')) {
    return `### 1. Introdução
A **LDB 9.394/96 e o DCRC** regem a educação nacional e do Ceará, garantindo o direito constitucional à educação de qualidade.

### 2. Conceito
Educação Escolar divide-se em Educação Básica (Infantil, Fundamental e Médio) e Educação Superior.

### 3. Explicação Didática
- **Obrigatoriedade:** Dos 4 aos 17 anos (Pré-escola, Fundamental e Médio).
- **Carga Horária:** Mínimo de 800 horas anuais em 200 dias letivos.
- **Frequência Mínima:** 60% na Educação Infantil | 75% no Fundamental e Médio.

### 4. Exemplos
- Gestão democrática pública com elaboração participativa do PPP.

### 5. Relação com o Edital
Bloco de **Legislação Educacional e Didática** do edital SEDUC CE.

### 6. Como a FUNECE cobra
Literalidade das atualizações da LDB (Lei 14.533/2023, Art. 26-A história afro e indígena).

### 7. Pegadinhas
- Criar a falsa ideia de que creche (0 a 3) é obrigatória para a família. Não é! Obrigatório é a partir dos 4 anos.

### 8. Decore Isso
💡 **Obrigatoriedade:** 4 a 17 anos | **Dias/Horas:** 200d / 800h.

### 9. Resumo
1. Educação Básica obrigatória dos 4 aos 17 anos.
2. Mínimo de 800h em 200 dias letivos.
3. Frequência mínima de 75% no Fundamental e Médio.
4. Gestão democrática do ensino público.
5. Inclusão da Educação Digital e História Afro-Brasileira.

### 10. Micro Revisão
1. *Faixa etária da educação básica obrigatória?*
2. *Frequência mínima no Ensino Médio?*
3. *Número mínimo de dias letivos?*

**Gabarito:** 1. 4 a 17 anos. 2. 75%. 3. 200 dias.`;
  }

  // 5. Genérico Estruturado Profundo para Qualquer Outro Tópico
  return `### 1. Introdução
**${cleaned}** representa um tópico de fundamental relevância teórica e prática na disciplina de **${userSubject}**. O domínio rigoroso deste assunto permite ao candidato compreender os mecanismos basilares da matéria e responder com precisão técnica às questões formuladas pela banca FUNECE (CEV/UECE) para o concurso da SEDUC CE.

### 2. Conceito
Sob a perspectiva científica e acadêmica de **${userSubject}**, **${cleaned}** define-se como o conjunto estruturado de princípios, leis, classificações e interações que regem o comportamento, a dinâmica e as propriedades constitutivas desse campo de conhecimento.

### 3. Explicação Didática
Para uma apreensão profunda de **${cleaned}**:
- **Fundamento Teórico:** Trata-se da identificação dos elementos essenciais e das variáveis que regulam o sistema.
- **Mecanismo de Ação:** Analisa-se a relação de causa e efeito, a sequência temporal e as transformações morfofuncionais envolvidas.
- **Aplicação no Contexto Docente:** Correlacionam-se os dados conceituais com a prática pedagógica e os experimentos/situações de ensino.

### 4. Exemplos
- **Aplicações Práticas:** Exemplos do cotidiano e de experimentos científicos onde a alteração de parâmetros de **${cleaned}** modifica diretamente os resultados observados em **${userSubject}**.

### 5. Relação com o Edital
Corresponde ao bloco de **Conhecimentos Específicos de ${userSubject}** do Edital do Concurso SEDUC CE.

### 6. Como a FUNECE cobra
A banca **CEV/UECE (FUNECE)** exige o domínio exato da **terminologia acadêmica e das definições conceituais**. As questões frequentemente contêm enunciados detalhados que testam se o candidato sabe diferenciar termos correlatos e reconhecer exceções às regras gerais.

### 7. Pegadinhas
- **Atenção:** A FUNECE costuma inverter o papel de estruturas parecidas ou utilizar termos restritivos (como *somente*, *nunca*, *exclusivamente*) para induzir o candidato desatento ao erro em opções falsas.

### 8. Decore Isso
💡 **Macete de Estudo:** Foque no binômio **Conceito -> Função**. Toda questão da FUNECE sobre **${cleaned}** cobra a função exata ou a classificação teórica rigorosa do elemento em questão.

### 9. Resumo
1. **${cleaned}** é conteúdo de alta recorrência no edital de **${userSubject}**.
2. Requer a memorização precisa dos termos científicos e classificações.
3. A FUNECE cobra diferenciação minuciosa entre conceitos parecidos.
4. Cuidado com palavras de generalização ou exclusão nos enunciados.
5. Dominar a relação entre definição e aplicação prática assegura o acerto da questão.

### 10. Micro Revisão
1. *Qual é o conceito-chave que define o tema ${cleaned}?*
2. *Qual é o principal cuidado ao resolver questões da FUNECE sobre este assunto?*
3. *Como aplicar este conceito na análise de problemas de ${userSubject}?*

**Gabarito:**
1. A estrutura teórica e morfofuncional específica descrita para ${cleaned}.
2. Atentar-se à precisão dos termos e às alternativas com pegadinhas restritivas.
3. Relacionando os fundamentos conceituais à sua função/manifestação no sistema.`;
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

      const isGreetingOrHelp = lowerMsg.match(/^(oi|olá|ola|boa tarde|bom dia|boa noite|você me ajuda|voce me ajuda|me ajuda|pode me ajudar|me ajude|ajuda\??|quem é você|quem e voce|como você funciona|o que você faz)$/i) ||
        lowerMsg.includes('você me ajuda') || lowerMsg.includes('voce me ajuda') || lowerMsg.includes('pode me ajudar') || lowerMsg.includes('me ajuda com') || (lowerMsg.includes('ajuda') && !lowerMsg.includes('explique') && !lowerMsg.includes('ensine'));

      if (isGreetingOrHelp) {
        replyText = `Com certeza, Prof. ${userName}! Sou seu Professor Mentor especialista em **${userSubject}** para o Concurso SEDUC CE 2026.

Estou 100% pronto para te orientar com raciocínio e inteligência! Como posso te ajudar hoje?

1. **Análise Estratégica:** Me pergunte *"O que estudo hoje?"* ou *"Tenho matéria atrasada?"*.
2. **Aula Completa do Edital:** Me peça *"Explique [assunto]"* ou *"Ensine [conteúdo]"* para qualquer tópico de ${userSubject}!`;
      } else if (lowerMsg.includes('estudo hoje') || lowerMsg.includes('hoje') || lowerMsg.includes('cronograma') || lowerMsg.includes('meta')) {
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
      } else if (lowerMsg.includes('progresso') || lowerMsg.includes('como estou indo') || lowerMsg.includes('desempenho') || lowerMsg.includes('como tá') || lowerMsg.includes('estatística')) {
        const metaSubtopics = currentDay?.topics.map(t => t.subtopicNames?.length ? t.subtopicNames.join(', ') : t.parentTopicName).join(' • ');
        replyText = `📊 **Seu Desempenho Real no Sistema**\n\n• **Disciplina Alvo:** ${userSubject}\n• **Edital Concluído:** ${completedCount} de ${totalSubtopics} subtópicos (${progressPercent}%)\n• **Dia Atual no Cronograma:** Dia ${currentDay?.dayNumber || 1} (${currentDay?.displayDate || 'Hoje'})\n• **Meta de Subtópicos de Hoje:** ${metaSubtopics}`;
      } else if (lowerMsg.includes('pior assunto') || lowerMsg.includes('dificuldade')) {
        const firstSubtopic = currentDay?.topics[0]?.subtopicNames?.[0] || currentDay?.topics[0]?.parentTopicName || 'Conteúdos Específicos';
        replyText = `🎯 **Análise de Desempenho**\n\nCom base nos dados do sistema, o subtópico priorizado no seu cronograma ativo de **${userSubject}** é: **${firstSubtopic}**.\n\nSua prioridade hoje (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}) é concluir esta meta!`;
      } else if (lowerMsg.includes('revisar') || lowerMsg.includes('revisão')) {
        replyText = `📚 **Revisão Pendente do Cronograma**\n\nSua revisão pendente de hoje (${currentDay?.displayDate || `Dia ${currentDay?.dayNumber || 1}`}) engloba os subtópicos:\n${currentDay?.topics.map(t => `• **${t.parentTopicName}:** ${t.subtopicNames?.length ? t.subtopicNames.join(', ') : t.parentTopicName}`).join('\n')}\n\nDeseja realizar questões sobre essa meta agora?`;
      } else {
        const isExplicitTeachRequest = /^(explique|ensine|resuma|detalhe|o que é|como funciona|diferença|compare|aula|fale sobre)/i.test(lowerMsg) ||
          lowerMsg.includes('explique') || lowerMsg.includes('ensine') || lowerMsg.includes('aula de') || lowerMsg.includes('o que é') || lowerMsg.includes('como funciona');

        if (!isExplicitTeachRequest) {
          replyText = `Prof. ${userName}, entendi sua mensagem! Como seu Mentor especialista em **${userSubject}**, posso te orientar de duas formas:\n\n1. **Estratégia e Desempenho:** Pergunta-me *"O que estudo hoje?"*, *"Tenho matéria atrasada?"* ou *"Como está meu progresso?"*.\n2. **Aulas Teóricas do Edital:** Peça *"Explique [assunto]"* ou *"Ensine [conteúdo]"* para eu te dar uma aula completa de 10 seções focada na banca FUNECE!`;
        } else {
          replyText = buildSpecificTeachingLesson(text.trim(), userSubject);
        }
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
