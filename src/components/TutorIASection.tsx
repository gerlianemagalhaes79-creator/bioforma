import React, { useState, useRef, useEffect, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
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

function cleanTopicTitle(rawText: string, activeTopicName?: string, userSubject: string = 'Língua Portuguesa'): string {
  const trimmed = rawText.trim().replace(/[?!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = trimmed.toLowerCase();

  // Lista de palavras e expressões de diálogo que NUNCA devem ser tratadas como tópicos de estudo
  const INVALID_TOPIC_WORDS = new Set([
    'nao', 'não', 'n', 'sim', 's', 'ok', 'claro', 'bora', 'quero', 'quero sim', 'quero nao', 'quero não',
    'nao entendi', 'não entendi', 'entendi', 'compreendi', 'show', 'beleza', 'blz', 'valeu', 'obrigado',
    'obrigada', 'perfeito', 'otimo', 'ótimo', 'certo', 'top', 'massa', 'duvida', 'dúvida', 'ajuda', 'socorro',
    'estudo', 'aula', 'materia', 'matéria', 'assunto', 'conteudo', 'conteúdo', 'topico', 'tópico', 'edital',
    'funece', 'uece', 'seduc', 'prova', 'questão', 'questao', 'exercicio', 'exercício', 'simulado', 'desafio',
    'mais ou menos', 'ainda nao', 'ainda não', 'ficou confuso', 'achei dificil', 'achei difícil', 'repete', 'reexplica'
  ]);

  if (INVALID_TOPIC_WORDS.has(lower)) {
    return activeTopicName || userSubject;
  }

  // Expressões genéricas que apenas confirmam o início dos estudos sem especificar matéria
  const genericStartRegex = /^(vamos\s+come[çc]ar|vamos\s+l[aá]|vamos\s+nessa|iniciar|come[çc]ar|pode\s+come[çc]ar|pode\s+ser|bora|sim|ok|claro|pronto|pronta|estou\s+pront[oa]|quero\s+sim|manda\s+ver|pode\s+mandar|com\s+certeza|estudar|quero\s+estudar|vamos\s+estudar|qual\s+[eé]\s+a\s+mat[eé]ria|qual\s+[eé]\s+o\s+assunto|o\s+que\s+estudo\s+hoje|mat[eé]ria\s+de\s+hoje|assunto\s+de\s+hoje|t[oó]pico\s+de\s+hoje|meta\s+de\s+hoje)$/i;

  if (genericStartRegex.test(lower)) {
    return activeTopicName || userSubject;
  }

  // Remove expressões de dificuldade, dúvida, comando e prefixos verbais
  let cleaned = trimmed
    .replace(/^(eu\s+)?(tenho|sinto|estou\s+com|estou\s+tendo|acho\s+que\s+tenho)\s+(muita\s+|bastante\s+|alguma\s+)?(dificuldade|d[uú]vida|problema)\s+(em|com|sobre|de|na|no|nas|nos)?\s*/gi, '')
    .replace(/^(n[aã]o\s+consigo\s+entender|n[aã]o\s+entendo|n[aã]o\s+compreendo|tenho\s+dificuldade\s+em|dificuldade\s+em|dificuldade\s+com|d[uú]vida\s+em|d[uú]vida\s+sobre)\s*/gi, '')
    .replace(/^(quero|desejo|gostaria\s+de|preciso|vamos|posso|pode)\s+(estudar|aprender|ver|entender|revisar|come[çc]ar|iniciar|saber\s+sobre|tirar\s+d[uú]vida\s+de|tirar\s+d[uú]vida\s+sobre|aprofundar|detalhar)\s*/gi, '')
    .replace(/^(quero|desejo|gostaria\s+de|preciso|vamos|posso|pode)\s*/gi, '')
    .replace(/^(estudar|aprender|ver|entender|revisar|come[çc]ar|iniciar|aprofundar|detalhar)\s*/gi, '')
    .replace(/^(o|a|os|as)\s+(t[oó]pico|conte[uú]do|assunto|mat[eé]ria|disciplina)\s+(de|da|do|dos|das)?\s*/gi, '')
    .replace(/^(t[oó]pico|conte[uú]do|assunto|mat[eé]ria|disciplina)\s+(de|da|do|dos|das)?\s*/gi, '')
    .replace(/^(explique|ensine|resuma|detalhe|fale\s+sobre|aula\s+de|o\s+que\s+[eé]|como\s+funciona|me\s+fale\s+sobre|explique\s+sobre|ensine\s+sobre|fale-me\s+sobre|fale\s+me\s+sobre|tire\s+d[uú]vida\s+sobre|diga\s+sobre|quero\s+saber\s+sobre|me\s+ajuda\s+com|me\s+ajuda\s+em|ajuda\s+com|ajuda\s+em)\s*/gi, '')
    .replace(/^(sobre|a\s+respeito\s+de|com\s+rela[çc][aã]o\s+a|referente\s+a)\s*/gi, '')
    .trim();

  // Limpa resíduos preposicionais no início
  cleaned = cleaned.replace(/^(em|de|da|do|sobre|com)\s+/i, '').trim();

  if (cleaned.length >= 3 && !INVALID_TOPIC_WORDS.has(cleaned.toLowerCase())) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  const VALID_SHORT_ACRONYMS = new Set(['dna', 'rna', 'met', 'mev', 'ldb', 'bncc', 'dcrc', 'tic', 'tics', 'ppp', 'pea']);
  if (VALID_SHORT_ACRONYMS.has(cleaned.toLowerCase())) {
    return cleaned.toUpperCase();
  }

  return activeTopicName || userSubject;
}

function checkFollowUpQuestion(rawText: string, userSubject: string): string | null {
  const lower = rawText.trim().toLowerCase();

  // 0. Saudações simples (resposta rápida e amigável sem aula)
  const greetingRegex = /^(oi|oii|oiii|olá|ola|boa tarde|bom dia|boa noite|tudo bem|tudo bom|tudo joia|fala prof|fala professor|professor|mestre|hey|hi|e ai|e aí|oi prof|oi professor|olá prof|olá professor)[\s!,?.]*$/i;
  if (greetingRegex.test(lower)) {
    return `Olá, Profª. Gerliane! Tudo ótimo por aqui! Como posso te ajudar hoje nos seus estudos para a SEDUC CE? Quer tirar uma dúvida, ver a meta de hoje ou resolver questões da FUNECE?`;
  }

  // 0.1. Resposta de negação / não entendi / ainda com dúvida
  const isNegativeOrUnclear = /^(n[aã]o|n|ainda\s+n[aã]o|n[aã]o\s+entendi|n[aã]o\s+ficou\s+claro|n[aã]o\s+muito|mais\s+ou\s+menos|achei\s+dif[ií]cil|fiquei\s+com\s+d[uú]vida|ficou\s+confuso|n[aã]o\s+compreendi|pode\s+explicar\s+de\s+novo|explica\s+de\s+novo|repete|reexplica|como\s+assim|n[aã]o\s+sei)[\s.!,]*$/i.test(lower);
  if (isNegativeOrUnclear) {
    return `Sem problemas, Profª. Gerliane! Quando a teoria parece abstrata, a melhor forma de fixar o conteúdo para a FUNECE é com um exemplo prático do cotidiano:

🥖 **A Cena da Padaria (Entendendo a Sintaxe na Prática):**
Imagine a frase: *"A professora comprou um bolo de chocolate quentinho para os alunos ontem na padaria."*

• 👤 **Sujeito:** Quem comanda a ação principal $\rightarrow$ *"A professora"*.
• 🎬 **Predicado / Verbo:** O que aconteceu $\rightarrow$ *"comprou..."*.
• 📦 **Objeto Direto:** O que foi comprado diretamente (sem pedágio de preposição) $\rightarrow$ *"um bolo"*.
• 🎯 **Objeto Indireto:** Para quem foi destinado (com pedágio/preposição) $\rightarrow$ *"para os alunos"*.
• 🏷️ **Adjuntos Adnominais:** As características coladas no substantivo $\rightarrow$ *"de chocolate"*, *"quentinho"*.
• 📍 **Adjuntos Adverbiais:** As circunstâncias de tempo e lugar $\rightarrow$ *"ontem"* (tempo), *"na padaria"* (lugar).

⚡ **E a Pegadinha da FUNECE (Complemento Nominal vs Adjunto Adnominal):**
• Se dissermos *"A admiração **da aluna**"* $\rightarrow$ A aluna é quem pratica a admiração (**Agente**) = **Adjunto Adnominal**.
• Se dissermos *"A admiração **pela professora**"* $\rightarrow$ A professora é o alvo admirado (**Paciente**) = **Complemento Nominal**.

Ficou muito mais claro de visualizar agora? Quer que eu detalhe algum termo específico ou prefere responder a uma questão para treinar?`;
  }

  // 0.2. Respostas de agradecimento / compreensão / confirmação
  const isGratitudeOrUnderstood = /^(obrigad[oa]|valeu|entendi|compreendi|agora\s+entendi|ficou\s+claro|agora\s+ficou\s+claro|show|show\s+de\s+bola|beleza|blz|perfeito|perfeita|[oó]timo|[oó]tima|certo|top|muito\s+bom|muito\s+boa|excelente|massa|maravilha|entendido|de\s+boa)[\s.!,]*$/i.test(lower);
  if (isGratitudeOrUnderstood) {
    return `Excelente, Profª. Gerliane! Fico muito feliz que o conceito tenha ficado claro! 🎯

Como a matéria é vasta no edital da SEDUC CE / FUNECE, qual é o próximo passo que você prefere agora:
1. 📖 **Avançar para o próximo tópico:** Orações Subordinadas, Concordância, Regência ou Crase?
2. 🧠 **Fazer um microdesafio da FUNECE:** Testar seus conhecimentos com uma questão inédita com gabarito comentado?`;
  }

  // Se for frase de início da aula, não é pergunta de seguimento
  if (lower.includes('vamos começar') || lower.includes('vamos comecar') || lower.includes('quero estudar') || lower.includes('vamos la') || lower.includes('materia de hoje')) {
    return null;
  }

  // 1. Pergunta se "isso é tudo" em Sintaxe ou se tem mais conteúdo
  if ((lower.includes('isso') || lower.includes('só') || lower.includes('so') || lower.includes('tem mais') || lower.includes('o que mais') || lower.includes('tudo que tem') || lower.includes('quais outros') || lower.includes('acabou') || lower.includes('completo')) && (lower.includes('sintaxe') || lower.includes('portug') || lower.includes('materia') || lower.includes('matéria') || lower.includes('conteúdo') || lower.includes('conteudo') || lower.includes('tudo'))) {
    return `**Não, Profª. Gerliane! A Sintaxe é um dos blocos mais densos, estratégicos e cobrados da Língua Portuguesa pela banca FUNECE (CEV/UECE).**

O que vimos anteriormente foi a visão geral e os termos essenciais da oração. No edital completo da SEDUC CE 2026, a Sintaxe se desdobra em 4 pilares indispensáveis:

📌 **1. Sintaxe do Período Simples (Termos da Oração):**
• **Essenciais:** Sujeito (determinado simples/composto, indeterminado, oracional e oração sem sujeito/verbos impessoais) e Predicado (verbal, nominal e verbo-nominal + predicativo do sujeito e do objeto).
• **Integrantes:** Objeto Direto/Indireto, Complemento Nominal e Agente da Passiva.
• **Acessórios:** Adjunto Adnominal, Adjunto Adverbial, Aposto e Vocativo.

📌 **2. Sintaxe do Período Composto (Relações Interoracionais):**
• **Orações Coordenadas:** Assindéticas e Sindéticas (Aditivas, Adversativas, Alternativas, Conclusivas e Explicativas).
• **Orações Subordinadas Substantivas:** Subjetivas, Objetivas Diretas, Objetivas Indiretas, Completivas Nominais, Predicativas e Apositivas.
• **Orações Subordinadas Adjetivas:** Explicativas (com vírgula) vs. Restritivas (sem vírgula).
• **Orações Subordinadas Adverbiais:** Causais, Concessivas, Consecutivas, Condicionais, Conformativas, Comparativas, Finais, Proporcionais e Temporais.
• **Orações Reduzidas:** De Infinitivo, Gerúndio e Particípio (a FUNECE ama cobrar o desdobramento e o valor semântico!).

📌 **3. Mecanismos Normativos e Relações Sintáticas:**
• **Concordância Verbal e Nominal:** Casos gerais e especiais (verbos *Haver/Fazer*, sujeito composto posposto, partícula *SE*).
• **Regência Verbal e Nominal:** Emprego obrigatório de preposição com verbos notáveis (*aspirar, visar, assistir, preferir, esquecer/lembrar*).
• **Crase:** Casos obrigatórios, casos proibidos e os 3 casos facultativos (*Mnemônico: Até a sua Maria*).
• **Colocação Pronominal:** Próclise (fatores de atração), Ênclise e Mesóclise.

📌 **4. Sintaxe de Pontuação:**
• Emprego obrigatório e proibido da vírgula (nunca separar sujeito de predicado nem verbo de seu complemento!).

💡 **Foco FUNECE:** Os temas com maior índice de questões em provas da SEDUC CE são: **1) Diferença entre Complemento Nominal e Adjunto Adnominal**, **2) Funções do SE e do QUE**, e **3) Orações Subordinadas Concessivas vs. Causais**.

Qual dessas 4 partes você quer aprofundar agora ou quer que eu te ensine com exemplos bem práticos do dia a dia?`;
  }

  // 2. Pedido de exemplos da vida real / simplificação
  if (lower.includes('exemplo') || lower.includes('vida real') || lower.includes('dia a dia') || lower.includes('simplifi') || lower.includes('descomplica') || lower.includes('mais fácil') || lower.includes('mais facil') || lower.includes('prático') || lower.includes('pratico')) {
    return `Com certeza, Profª. Gerliane! Vamos descomplicar a **Sintaxe** com uma analogia prática do cotidiano:

🥖 **A Cena da Padaria (Entendendo os Termos da Oração):**
Imagine a frase: *"A professora comprou um bolo de chocolate quentinho para os alunos ontem na padaria."*

• 👤 **Sujeito:** Quem comanda a ação principal $\rightarrow$ *"A professora"*.
• 🎬 **Predicado / Verbo:** O que aconteceu $\rightarrow$ *"comprou..."*.
• 📦 **Objeto Direto:** O que foi comprado diretamente (sem pedágio de preposição) $\rightarrow$ *"um bolo"*.
• 🎯 **Objeto Indireto:** Para quem foi destinado (com pedágio/preposição) $\rightarrow$ *"para os alunos"*.
• 🏷️ **Adjuntos Adnominais:** As características coladas no substantivo que você pode tirar sem desestruturar a frase $\rightarrow$ *"de chocolate"*, *"quentinho"*.
• 📍 **Adjuntos Adverbiais:** As circunstâncias de tempo e lugar $\rightarrow$ *"ontem"* (tempo), *"na padaria"* (lugar).

⚡ **E a Pegadinha da FUNECE (Complemento Nominal vs Adjunto Adnominal):**
• Se dissermos *"A admiração **da aluna**"* $\rightarrow$ A aluna é quem pratica a admiração (**Agente**) = **Adjunto Adnominal**.
• Se dissermos *"A admiração **pela professora**"* $\rightarrow$ A professora é o alvo admirado (**Paciente**) = **Complemento Nominal**.

Ficou muito mais claro de visualizar agora? Quer resolver uma questão da FUNECE para testar ou prefere detalhar outro ponto?`;
  }

  // 3. Diferença entre Complemento Nominal e Adjunto Adnominal
  if ((lower.includes('complemento nominal') || lower.includes('adjunto adnominal')) && (lower.includes('diferen') || lower.includes('como') || lower.includes('versus') || lower.includes('vs') || lower.includes('dúvida') || lower.includes('duvida'))) {
    return `Essa é a dúvida que mais derruba candidatos na FUNECE! Vamos fixar com a **Regra de Ouro Incontestável**:

Ambos vêm introduzidos por preposição e ligados a um substantivo. O segredo é:

1. **Ligado a Adjetivo ou Advérbio:** É **SEMPRE Complemento Nominal** (*"favorável ao projeto"*, *"longe de casa"*).
2. **Ligado a Substantivo Concreto:** É **SEMPRE Adjunto Adnominal** (*"copo de vidro"*, *"livro do professor"*).
3. **Ligado a Substantivo Abstrato (O Ponto Crítico da FUNECE):**
   • **Papel AGENTE (quem pratica a ação):** $\rightarrow$ **Adjunto Adnominal** (*"A crítica do professor"* = o professor criticou).
   • **Papel PACIENTE (quem sofre/recebe a ação):** $\rightarrow$ **Complemento Nominal** (*"A crítica ao professor"* = o professor recebeu a crítica).

💡 **Resumo mental rápido:** Sofreu a ação = **CN**. Praticou a ação = **AA**.

Ficou clara essa distinção? Quer que eu coloque uma questão de concurso para você treinar esse macete?`;
  }

  // 4. Funções do SE (Partícula Apassivadora vs. Índice de Indeterminação)
  if (lower.includes('função do se') || lower.includes('funcoes do se') || lower.includes('particula apassivadora') || lower.includes('índice de indeterminação') || (lower.includes('se') && (lower.includes('apassiv') || lower.includes('indetermin')))) {
    return `Na FUNECE, a diferenciação do **SE** é feita pelo teste da transitividade verbal:

1. **Partícula Apassivadora (PA):**
   • Verbo Transitivo Direto (VTD) ou Transitivo Direto e Indireto (VTDI).
   • O termo seguinte é o **SUJEITO PACIENTE** (o verbo concorda com ele!).
   • *Exemplo:* *"Vendem-se casas"* $\rightarrow$ *"Casas são vendidas"*. (Verbo no plural concordando com *casas*).

2. **Índice de Indeterminação do Sujeito (IIS):**
   • Verbo Transitivo Indireto (VTI), Intransitivo (VI) ou de Ligação (VL) + Preposição.
   • O sujeito é **INDETERMINADO** e o verbo fica OBRIGATORIAMENTE na **3ª pessoa do singular**!
   • *Exemplo:* *"Precisa-se de professores"* (e NUNCA *"Precisam-se de professores"*).

Conseguiu pegar o macete do VTD (concorda) vs VTI (fica no singular)?`;
  }

  // 5. Resposta de questões (Alternativas A, B, C, D)
  const isOptionLetter = /^(alternativa\s+|letra\s+|opção\s+|opcao\s+)?([a-d])[\s.!,]*$/i.test(lower);
  if (isOptionLetter) {
    const letterMatch = lower.match(/[a-d]/i);
    const letter = letterMatch ? letterMatch[0].toUpperCase() : 'B';
    return `**Resposta Analisada: Letra ${letter}!** 🎯

${letter === 'C' || letter === 'B' ? 'Excelente! Você acertou a linha de raciocínio da banca FUNECE!' : 'Atenção aos distratores da banca!'}

**Comentário Técnico FUNECE:**
Na análise sintática da FUNECE, a banca exige a identificação precisa da transitividade verbal e da regência do termo. Lembre-se:
• Substantivos abstratos que exigem termo com papel paciente caracterizam **Complemento Nominal**.
• Verbos impessoais (*Haver* no sentido de existir e *Fazer* indicando tempo) não admitem sujeito nem pluralização.

Quer resolver outro microdesafio da FUNECE ou prefere avançar para o próximo tópico do cronograma?`;
  }

  // 6. Pedido explícito de questão / simulado
  if (lower.includes('questão') || lower.includes('questao') || lower.includes('exercício') || lower.includes('exercicio') || lower.includes('simulado') || lower.includes('desafio') || lower.includes('manda a questão') || lower.includes('quero responder')) {
    return `🧠 **Desafio de Fixação — Sintaxe e Termos da Oração (Padrão FUNECE / SEDUC CE):**

Considere o período extraído de texto oficial:
*"Constatou-se a urgente necessidade de novos investimentos pedagógicos nas escolas estaduais."*

Com base na sintaxe da Língua Portuguesa e na norma culta, assinale a opção **CORRETA**:

A) O termo *"a urgente necessidade"* desempenha a função sintática de Objeto Direto do verbo *constatar*.
B) A partícula *"se"* classifica-se como Índice de Indeterminação do Sujeito, tornando a oração sem sujeito.
C) O termo *"de novos investimentos pedagógicos"* exerce a função de Complemento Nominal do substantivo abstrato *necessidade*.
D) O termo *"nas escolas estaduais"* funciona como Objeto Indireto regido pela preposição *em*.

---
💡 *Dica do Mentor:* Analise a transitividade do verbo *constatar* e o papel semântico do termo ligado a *necessidade*. Qual alternativa você marca: **A, B, C ou D**?`;
  }

  // 7. Microscopia - Resolução / Abbe
  if (lower.includes('resoluc') || lower.includes('resoluç') || lower.includes('abbe') || lower.includes('limite de resol')) {
    return `O **Poder de Resolução** é a capacidade do microscópio de distinguir dois pontos extremamente próximos como estruturas separadas.\n\nDiferente da ampliação (que apenas aumenta o tamanho da imagem), o limite de resolução ($d$) depende do comprimento de onda ($\lambda$) e da abertura numérica ($AN$) da lente, pela fórmula de Abbe ($d = \\frac{0,61 \\cdot \\lambda}{AN}$). Quanto menor o $d$, maior o detalhamento! No microscópio óptico o limite é ~200 nm, enquanto no eletrônico atinge fração de nanômetro.\n\nFicou claro por que aumentar a imagem sem poder de resolução gera apenas uma imagem desfocada?`;
  }

  // 8. MET 2D
  if ((lower.includes('met') || lower.includes('transmissao') || lower.includes('transmissão')) && (lower.includes('2d') || lower.includes('plana') || lower.includes('atravess') || lower.includes('corte') || lower.includes('por que') || lower.includes('porque') || lower.includes('como'))) {
    return `No **MET (Microscópio Eletrônico de Transmissão)**, a imagem é em 2D porque o feixe de elétrons *atravessa* (transmite por) um corte celular ultra-fino.\n\nComo a amostra é fatiada em lâminas extremamente finas para os elétrons passarem por dentro dela, a imagem resultante no sensor é uma projeção bidimensional (2D) da ultraestrutura interna.\n\nEntendeu por que o MET gera essa fatia plana interna em 2D enquanto o MEV gera uma imagem tridimensional?`;
  }

  // 9. MEV 3D
  if ((lower.includes('mev') || lower.includes('varredura')) && (lower.includes('3d') || lower.includes('superficie') || lower.includes('superfície') || lower.includes('relevo') || lower.includes('por que') || lower.includes('porque') || lower.includes('como'))) {
    return `No **MEV (Microscópio Eletrônico de Varredura)**, a imagem é em 3D porque a amostra é recoberta com metal (ouro) e o feixe de elétrons *varre* a superfície externa.\n\nOs elétrons refletidos rebatem em detectores que mapeiam a profundidade e a topografia celular, gerando uma imagem tridimensional (3D) de alta profundidade de campo.\n\nConseguiu visualizar essa diferença entre varrer a superfície (MEV 3D) e atravessar a amostra (MET 2D)?`;
  }

  // 10. Dúvida pedagógica (Inatismo / Behaviorismo)
  if (lower.includes('inatismo') || lower.includes('behaviorismo') || lower.includes('comportamentalismo') || lower.includes('cognitivismo') || lower.includes('interacionismo')) {
    return `Nas teorias de aprendizagem cobradas pela FUNECE:\n\n• **Inatismo:** Defende que os conhecimentos e capacidades do aluno já nascem pré-formados com ele.\n• **Behaviorismo / Comportamentalismo:** Defende que a aprendizagem ocorre por estímulo-resposta e reforço do ambiente (Skinner).\n• **Interacionismo / Cognitivismo:** O conhecimento é construído na relação ativa do sujeito com o meio e a sociedade (Piaget / Vygotsky).\n\nA FUNECE gosta de perguntar sobre o papel do professor em cada vertente. Qual dessas abordagens você quer detalhar agora?`;
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

  // 1. Sintaxe / Termos da Oração / Período Composto (Língua Portuguesa)
  if (lower.includes('sintaxe') || lower.includes('sujeito') || lower.includes('predicado') || lower.includes('complemento nominal') || lower.includes('adjunto') || lower.includes('oraç') || lower.includes('orac') || lower.includes('período') || lower.includes('periodo') || lower.includes('subordinad') || lower.includes('coordenad') || lower.includes('transitividade') || lower.includes('objeto direto')) {
    body = `**Sintaxe da Língua Portuguesa (Período Simples e Composto) — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Sintaxe** é a parte da gramática normativa que estuda a disposição das palavras na frase e as relações lógicas que elas estabelecem entre si (funções sintáticas) e entre as orações no período.
• **Termos Essenciais:** Sujeito (determinado, indeterminado, oracional ou oração sem sujeito/verbos impessoais) e Predicado (verbal, nominal ou verbo-nominal).
• **Termos Integrantes:** Complementos Verbais (Objeto Direto e Indireto), Complemento Nominal e Agente da Passiva.
• **Termos Acessórios:** Adjunto Adnominal, Adjunto Adverbial e Aposto (+ Vocativo, que é termo independente).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Complemento Nominal vs. Adjunto Adnominal:** Com substantivos abstratos regidos pela preposição "de", se o termo exercer papel **paciente** (alvo da ação), é Complemento Nominal (*"A leitura do livro"*); se exercer papel **agente** (autor da ação), é Adjunto Adnominal (*"A leitura do professor"*).
• **Funções do "QUE":** Pronome Relativo (inicia Oração Subordinada Adjetiva e pode ser substituído por *o qual/a qual*) vs. Conjunção Integrante (inicia Oração Subordinada Substantiva e pode ser substituído por *isso*).
• **Funções do "SE":** Partícula Apassivadora (com VTD/VTDI concordando com o sujeito paciente: *"Alugam-se casas"*) vs. Índice de Indeterminação do Sujeito (com VTI/VI/VL na 3ª pessoa do singular: *"Precisa-se de professores"*).
• ⚠️ **Pegadinha da FUNECE:** A banca adora cobrar orações subordinadas **reduzidas** (de gerúndio, particípio e infinitivo) e exigir que o candidato faça o desdobramento exato da conjunção correspondente.`;
  }
  // 2. Concordância, Regência e Crase (Língua Portuguesa)
  else if (lower.includes('concordância') || lower.includes('concordancia') || lower.includes('regência') || lower.includes('regencia') || lower.includes('crase') || lower.includes('pontuação') || lower.includes('pontuacao')) {
    body = `**Concordância, Regência e Crase — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
• **Concordância Verbal e Nominal:** Harmonia morfossintática de número e pessoa entre o verbo e seu sujeito, e de gênero e número entre o substantivo e seus determinantes.
• **Regência Verbal e Nominal:** Relação de subordinação entre o termo regente e o termo regido, estabelecendo a presença ou ausência obrigatória de preposição.
• **Crase:** Fenômeno fonético-sintático da fusão da preposição *a* com o artigo feminino *a(s)* ou pronomes demonstrativos (*aquele, aquela, aquilo*).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Verbos Impessoais (HAVER e FAZER):** *Haver* no sentido de existir/ocorrer e *Fazer* indicando tempo decorrido são impessoais e permanecem rigorosamente na **3ª pessoa do singular** (*"Havia muitos candidatos"*, *"Faz três anos"*).
• **Regência de Verbos Notáveis:** *Aspirar* e *Visar* (sentido de desejar/almejar são VTI e exigem preposição "a", sem aceitar pronome *lhe*); *Assistir* (sentido de presenciar é VTI com "a"); *Preferir* (exige "a" e rejeita termos intensificadores como *"mais... do que"*).
• **Regra Prática da Crase:** Substitua a palavra feminina por uma masculina correspondente; se surgir a combinação **AO**, o uso do acento grave é obrigatório (*"Fui à escola" $\rightarrow$ "Fui ao colégio"*).
• ⚠️ **Pegadinha da FUNECE:** A banca cobra com frequência a proibição de crase antes de verbos, palavras masculinas, pronomes de tratamento e pronomes indefinidos.`;
  }
  // 3. Morfologia e Classes de Palavras (Língua Portuguesa)
  else if (lower.includes('morfologia') || lower.includes('classe') || lower.includes('verbo') || lower.includes('pronome') || lower.includes('conjunção') || lower.includes('conjuncao') || lower.includes('advérbio') || lower.includes('adverbio') || lower.includes('coesão') || lower.includes('coesao')) {
    body = `**Morfologia, Classes Gramaticais e Coesão — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Morfologia** analisa a estrutura interna, a formação e a classificação das 10 classes de palavras da Língua Portuguesa (Substantivo, Artigo, Adjetivo, Numeral, Pronome, Verbo, Advérbio, Preposição, Conjunção e Interjeição), articuladas aos mecanismos de coesão textual referencial (anáfora/catáfora) e sequencial (conjunções e conectivos).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Conjunções Coordenativas e Subordinativas:** A FUNECE exige a identificação do valor semântico exato dos conectivos (*concessivo, consecutivo, causal, proporcional, condicional, explicativo*). Exemplo: *embora, conquanto, posto que* (concessivas) vs. *porque, já que, visto que* (causais).
• **Colocação Pronominal:** Regras estritas de próclise (palavras negativas, pronomes relativos, conjunções subordinativas, advérbios atraem o pronome para antes do verbo).
• ⚠️ **Pegadinha da FUNECE:** A banca costuma colocar orações com valor semântico de causa e consequência invertidas para induzir o candidato ao erro.`;
  }
  // 4. Noções Básicas de Microscopia
  else if (lower.includes('microscop') || lower.includes('ampliação') || lower.includes('ampliacao') || lower.includes('resolução') || lower.includes('resolucao') || lower.includes('mev') || lower.includes('met')) {
    body = `**Noções Básicas de Microscopia — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Microscopia** compreende o conjunto de técnicas de magnificação e análise visual de microestruturas celulares. O conceito central mais cobrado em prova não é a mera ampliação da imagem, mas sim o **Poder de Resolução** — a distância mínima necessária entre dois pontos para que sejam identificados como estruturas separadas. Seu limite ($d$) é determinado pela fórmula de Abbe ($d = \\frac{0,61 \\cdot \\lambda}{AN}$).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Ampliação vs. Resolução:** Aumentar a imagem sem resolução adequada gera a chamada "ampliação vazia" (imagem grande, porém borrada).
• **Microscópio Óptico de Luz (MO):** Utiliza fótons de luz visível e lentes de vidro. Limite de resolução de ~200 nm. Exige coloração histológica (ex: Hematoxilina/Eosina).
• **Microscópio Eletrônico de Transmissão (MET):** Feixe de elétrons atravessa cortes ultrafinos da amostragem, permitindo mapear a **ultraestrutura interna** (2D) em escala de nanômetros.
• **Microscópio Eletrônico de Varredura (MEV):** Feixe de elétrons varre a superfície recoberta de metal, gerando mapeamento **tridimensional (3D) da superfície**.
• ⚠️ **Pegadinha da FUNECE:** A banca adora trocar as funções de MET e MEV. Guarde que o MET atravessa (2D interno) e o MEV varre a superfície (3D externo).`;
  }
  // 5. Organelas Celulares / Citologia
  else if (lower.includes('organela') || lower.includes('citologia') || lower.includes('célula') || lower.includes('celula') || lower.includes('membrana') || lower.includes('transporte ativo') || lower.includes('osmose')) {
    body = `**Biologia Celular, Membranas e Organelas — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Célula** é a unidade morfofisiológica fundamental dos seres vivos. A membrana plasmática opera segundo o modelo do **Mosaico Fluido** (bicamada fosfolipídica anfipática com proteínas integrais e periféricas e colesterol modulador térmico de fluidez). As **organelas citoplasmáticas** promovem a compartimentalização e especialização metabólica dos eucariontes.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Mecanismos de Transporte:**
  - *Passivo (sem gasto de ATP):* Difusão simples (gases/apolares), difusão facilitada (permeases/aquaporinas) e osmose (fluxo de solvente do meio hipotônico para o hipertônico).
  - *Ativo (com gasto de ATP):* Primário (Bomba de $\\text{Na}^+/\\text{K}^+$: 3 $\\text{Na}^+$ saem, 2 $\\text{K}^+$ entram) e Secundário (simporte e antiporte aproveitando gradiente eletroquímico).
• **Organelas Estratégicas:** Mitocôndrias (respiração aeróbia com DNA circular e ribossomos 70S), RER (síntese proteica exportável), REL (síntese lipídica e desintoxicação), Complexo Golgiense (glicosilação e acrossomo) e Lisossomos (hidrolases ácidas).
• ⚠️ **Pegadinha da FUNECE:** A banca afirma que células vegetais não realizam respiração ou não possuem mitocôndrias (possuem mitocôndrias E cloroplastos!).`;
  }
  // 6. Genética / DNA / RNA / Mendel
  else if (lower.includes('genética') || lower.includes('genetica') || lower.includes('dna') || lower.includes('rna') || lower.includes('mendel') || lower.includes('síntese') || lower.includes('sintese') || lower.includes('mutação') || lower.includes('mutacao')) {
    body = `**Genética e Biologia Molecular — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Genética Molecular** estuda a estrutura, duplicação e expressão do material genético. O ponto central é o **Dogma Central da Biologia Molecular**: o DNA duplica-se de maneira semiconservativa na Fase S da Interfase, é transcrito em RNA mensageiro e este é traduzido em sequências polipeptídicas (proteínas) nos ribossomos.

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Estrutura e Pareamento do DNA:** Dupla hélice antiparalela (5' $\\rightarrow$ 3' e 3' $\\rightarrow$ 5') estabilizada por pontes de hidrogênio (A=T com 2 pontes; C $\\equiv$ G com 3 pontes).
• **Código Genético:** Universal e Degenerado/Redundante (mais de um códon trinca pode codificar o mesmo aminoácido).
• **Leis de Mendel:** 1ª Lei (Segregação independente dos alelos na meiose) e 2ª Lei (Segregação de pares de genes em cromossomos homólogos distintos).
• ⚠️ **Pegadinha da FUNECE:** A banca frequentemente afirma que a replicação do DNA ocorre durante a mitose. Correção: a duplicação ocorre exclusivamente na **Fase S da Interfase**.`;
  }
  // 7. Ecologia / Ciclos / Relações
  else if (lower.includes('ecologia') || lower.includes('ecossistema') || lower.includes('cadeia') || lower.includes('teia') || lower.includes('nitrogênio') || lower.includes('nitrogenio') || lower.includes('ciclo') || lower.includes('sucessão') || lower.includes('sucessao')) {
    body = `**Ecologia e Dinâmica dos Ecossistemas — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Ecologia** estuda as relações recíprocas entre os seres vivos (fatores bióticos) e o meio físico (fatores abióticos).
• **Fluxo de Energia:** É rigorosamente **unidirecional e decrescente** ao longo dos níveis tróficos (~10% transferido por nível).
• **Ciclo da Matéria:** É **100% cíclico**, dependendo obrigatoriamente da atuação dos decompositores (fungos e bactérias).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Ciclo do Nitrogênio (Passo a Passo Bioquímico):**
  1. *Fixação:* $\\text{N}_2 \\rightarrow \\text{NH}_3$ (*Rhizobium* e cianobactérias).
  2. *Nitrosação:* $\\text{NH}_3 \\rightarrow \\text{NO}_2^-$ (*Nitrosomonas*).
  3. *Nitratação:* $\\text{NO}_2^- \\rightarrow \\text{NO}_3^-$ (*Nitrobacter*).
  4. *Desnitrificação:* $\\text{NO}_3^- \\rightarrow \\text{N}_2$ (*Pseudomonas*).
• **Magnificação Trófica / Bioacumulação:** Compostos xenobióticos persistentes (metais pesados, agrotóxicos) acumulam-se em maiores concentrações nos **consumidores do topo da cadeia**.
• ⚠️ **Pegadinha da FUNECE:** A banca alega que a energia é reciclada pelos decompositores. Falso! A energia dissipa-se continuamente sob a forma de calor.`;
  }
  // 8. LDB / Legislação / DCRC / BNCC / Estatuto CE
  else if (lower.includes('ldb') || lower.includes('lei 9394') || lower.includes('legislação') || lower.includes('legislacao') || lower.includes('dcrc') || lower.includes('bncc') || lower.includes('diretrizes') || lower.includes('estatuto') || lower.includes('10884') || lower.includes('9826')) {
    body = `**Legislação Educacional e Normas do Ceará — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Legislação Educacional** (LDB nº 9.394/1996, DCRC, BNCC e normas estaduais do Ceará) estrutura o ordenamento jurídico do ensino público.
• **Educação Escolar:** Divide-se em **Educação Básica** (Educação Infantil, Ensino Fundamental e Ensino Médio) e **Educação Superior**.
• **Obrigatoriedade e Gratuidade:** Dos **4 aos 17 anos** de idade (Pré-escola, Ensino Fundamental e Ensino Médio).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Regras de Organização Escolar (Art. 24 da LDB):**
  - Carga horária mínima anual: **800 horas**, distribuídas em no mínimo **200 dias** de efetivo trabalho escolar.
  - Frequência mínima para aprovação: **60%** na Educação Infantil e **75%** no Ensino Fundamental e Ensino Médio.
  - Avaliação: Prevalência dos aspectos **qualitativos sobre os quantitativos** e dos resultados ao longo do período sobre os de eventuais exames finais.
• **Gestão Democrática:** Princípio constitucional com participação dos profissionais da educação na elaboração do Projeto Político-Pedagógico (PPP) e das comunidades escolar e local em Conselhos Escolares.
• ⚠️ **Pegadinha da FUNECE:** A banca tenta afirmar que a creche (0 a 3 anos) é de matrícula obrigatória para os pais. Errado! A oferta é dever do Estado, mas a obrigatoriedade de matrícula pela família inicia aos 4 anos (Pré-escola).`;
  }
  // 9. Didática e Teorias Pedagógicas
  else if (lower.includes('didática') || lower.includes('didatica') || lower.includes('pedagog') || lower.includes('tendência') || lower.includes('tendencia') || lower.includes('avaliação') || lower.includes('avaliacao') || lower.includes('planejamento') || lower.includes('currículo') || lower.includes('curriculo') || lower.includes('saviani') || lower.includes('libâneo') || lower.includes('libaneo') || lower.includes('freire')) {
    body = `**Didática, Teorias da Aprendizagem e Tendências Pedagógicas — Conceito Central e Aplicação FUNECE**

🎯 **Ponto Central e Definição Técnica:**
A **Didática** é o ramo da Pedagogia que estuda os métodos, processos e fundamentos do ensino-aprendizagem. As tendências pedagógicas dividem-se em duas grandes vertentes (segundo Libâneo e Saviani):
• **Tendências Liberais (Manutenção do Status Quo):** Tradicional, Renovada Progressivista, Renovada Não-Diretiva e Tecnicista.
• **Tendências Progressistas (Transformação Social):** Libertadora (Paulo Freire), Libertária e Crítico-Social dos Conteúdos / Histórico-Crítica (Saviani/Libâneo).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Modalidades de Avaliação Escolar:**
  - *Diagnóstica (Inicial):* Identifica conhecimentos prévios e necessidades dos estudantes.
  - *Formativa (Processual/Contínua):* Acompanha a aprendizagem durante o processo para regular e reorientar as práticas pedagógicas.
  - *Somativa (Classificatória/Final):* Mensura resultados ao final do período letivo.
• **Relação Teoria e Prática (Práxis):** A Pedagogia Histórico-Crítica valoriza o domínio dos conteúdos científicos contextualizados como instrumento de emancipação das classes populares.
• ⚠️ **Pegadinha da FUNECE:** A banca frequentemente confunde a Pedagogia Libertadora (foco no diálogo horizontal e temas geradores) com a Pedagogia Libertária (autogestão e não-diretividade).`;
  }
  // 10. Assunto Genérico / Outras Matérias
  else {
    body = `**${cleaned} — Conceito Central e Aplicação FUNECE (SEDUC CE)**

🎯 **Ponto Central e Definição Técnica:**
O tópico **${cleaned}** constitui um dos pilares conceituais fundamentais exigidos no edital do Concurso SEDUC CE 2026. A abordagem deste conteúdo demanda o domínio rigoroso de seus postulados teóricos, terminologia técnico-científica oficial e critérios operacionais normatizados pela literatura de referência da banca FUNECE (CEV/UECE).

⚡ **Aplicação Prática e Padrão FUNECE:**
• **Diretriz de Cobrança:** A banca FUNECE privilegia a articulação entre os princípios teóricos de **${cleaned}** e a resolução de situações-problema aplicadas, valorizando o rigor conceitual sem espaço para ambiguidades.
• **Atenção aos Distratores:** Cuidado redobrado com alternativas que utilizam termos restritivos (*sempre, nunca, apenas, exclusivamente*) ou que invertem causas e consequências.`;
  }

  // Se a aluna pediu EXPLICITAMENTE uma questão ou exercício
  if (userWantsQuiz) {
    body += `\n\n🧠 **Desafio de Fixação da FUNECE:**
*(Inédita Padrão SEDUC CE)* Sobre este tema, assinale a afirmativa CORRETA segundo a literatura de referência da banca:

A) A fundamentação teórica independe dos princípios conceituais e normativos aplicáveis.
B) A correspondência exata entre os mecanismos técnicos e as relações funcionais assegura o acerto da questão na prova da FUNECE.
C) Trata-se de um tópico com cobrança exclusivamente descritiva sem aplicação analítica.
D) A prática exclui os postulados clássicos normatizados pela literatura acadêmica.

---
**Gabarito Comentado:**
**Resposta Incontestável: B.** A FUNECE fundamenta suas questões na correspondência exata entre a definição teórica e sua aplicação técnica e funcional.`;
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
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
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
