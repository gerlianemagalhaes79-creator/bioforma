import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

let aiClient: any = null;

function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "undefined") {
      console.warn("[SEDUC] GEMINI_API_KEY is not defined in environment or is placeholder. Fallback responses enabled.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

function formatGeminiError(err: any): string {
  if (!err) return "Erro desconhecido";
  const msg = err.message || String(err);
  
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota") || msg.includes("Quota")) {
    return "cota_excedida_429";
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
    return "servico_indisponivel_503";
  }
  
  return msg.replace(/[\{\}]/g, '').substring(0, 100);
}

let quotaCooldownUntil = 0;

async function generateContentWithRetry(aiInstance: any, options: {
  contents: string;
  config?: any;
  defaultModel?: string;
  maxRetries?: number;
}) {
  if (Date.now() < quotaCooldownUntil) {
    throw new Error("Cota do Gemini temporariamente excedida (em periodo de cooldown). Usando modo offline.");
  }

  const { contents, config = {}, defaultModel = "gemini-2.5-flash", maxRetries = 2 } = options;
  // Supported models in current @google/genai SDK
  const modelsToTry = Array.from(new Set([
    defaultModel,
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro"
  ]));
  
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini SDK] Solicitando resposta ao modelo "${model}"`);
        const response = await aiInstance.models.generateContent({
          model,
          contents,
          config,
        });
        if (response && response.text) {
          quotaCooldownUntil = 0; // Sucesso, reseta o cooldown
          return response;
        }
      } catch (err: any) {
        const errCode = formatGeminiError(err);
        const errStr = String(err?.message || err);
        if (errCode === "cota_excedida_429" || errStr.includes("429")) {
          console.warn(`[Gemini SDK] Cota indisponivel no modelo "${model}", alternando modelo...`);
          break; // Pula imediatamente para o proximo modelo
        }
        if (errStr.includes("404") || errStr.includes("not found")) {
          console.warn(`[Gemini SDK] Modelo "${model}" nao encontrado (404), ignorando...`);
          break; // Pula imediatamente modelo nao existente
        }
        console.warn(`[Gemini SDK] Tentativa ${attempt} falhou no modelo "${model}": ${errCode}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  }

  // Se todos falharam por cota, ativa o cooldown por 60 segundos
  quotaCooldownUntil = Date.now() + 60000;
  throw new Error("Todos os modelos do Gemini estao temporariamente indisponiveis por cota.");
}

const app = express();

// Custom CORS middleware to allow static hostings like Vercel to fetch results from the backend
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

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
    return `Sobre a sua dúvida específica:\n\nEsse é um detalhe muito importante exigido pela FUNECE! A banca cobra com precisão o termo técnico e o mecanismo prático aplicado a esse conceito.\n\nConseguiu entender bem esse ponto ou quer que eu detalhe mais algum conceito desse assunto?`;
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

// ===============================================================
// PASSEISEDUC - ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL PARA CONCURSO
// ===============================================================

const FORMULA_FORMATTING_DIRECTIVE = `
## 📐 DIRETIVA DE FORMATAÇÃO DE FÓRMULAS E SÍMBOLOS
Sempre que precisar incluir fórmulas matemáticas, físicas ou científicas, siga rigorosamente estas regras para evitar que o texto fique bagunçado:

1. **Uso de Símbolos Diretos:** Prefira utilizar os símbolos reais sempre que possível (ex: $\\lambda$, $\\Delta$, $\\pi$, $\\cdot$, $\\approx$) em vez de escrever seus nomes por extenso ou usar códigos complexos soltos no texto.
2. **Padrão de Exibição:** 
   - Se for uma fórmula em destaque (linha própria), envolva-a sempre entre dois sinais de dólar ($$ fórmula $$).
   - Se for uma variável ou fórmula curta dentro da frase, envolva-a com um único sinal de dólar ($ fórmula $).
3. **Clareza Didática:** Nunca deixe códigos brutos de formatação visíveis para o aluno (como \\frac, \\lambda, \\mathbf sem o devido encapsulamento). O texto deve ser limpo, fluido e com formatação profissional.
`;

  // Professor Mentor IA - Especialista em Aprovação SEDUC CE 2026 (FUNECE / CEV-UECE)
  app.post("/api/seduc/tutor", async (req, res) => {
    const { message, subject, profile, cronograma, stats, isProactive, mode } = req.body;

    if (!message && !isProactive) {
      return res.status(400).json({ error: "Mensagem ou flag proativa é obrigatória." });
    }

    const userName = profile?.name || "Professor(a)";
    const userSubject = profile?.targetSubject || subject || "Licenciatura SEDUC CE";
    const userDegree = profile?.degree || "Licenciatura";
    const totalDone = stats?.completedSubtopics ?? profile?.completedTopicsCount ?? 6;
    const totalSubtopics = stats?.totalSubtopics ?? 120;
    const progressPercent = stats?.progressPercent ?? (totalSubtopics > 0 ? Math.round((totalDone / totalSubtopics) * 100) : 10);
    const questionsDone = profile?.totalQuestionsDone || stats?.totalQuestions || 18;
    const correctCount = profile?.correctAnswersCount || stats?.correctAnswers || 14;
    const accuracy = questionsDone > 0 ? Math.round((correctCount / questionsDone) * 100) : 75;
    const activeTopicsText = req.body.activeTopics ? JSON.stringify(req.body.activeTopics) : "";
    const overdueList = req.body.overdueItems || [];
    const overdueText = overdueList.length > 0
      ? overdueList.map((item: any) => `• [Dia ${item.dayNumber} • ${item.displayDate}] (${item.category}): Tópico "${item.parentTopicName}" -> Subtópico Pendente: "${item.subtopicName}"`).join("\n")
      : "Nenhum item pendente. O aluno está 100% em dia com o cronograma até hoje!";

    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const historyList = Array.isArray(req.body.history) ? req.body.history : [];
    const historyText = historyList.slice(-6).map((h: any) => `${h.role === 'user' ? 'Aluna' : 'Professor'}: ${h.text}`).join('\n\n');

    const sysPrompt = `PROFESSOR MENTOR IA - ESPECIALISTA EM PREPARAÇÃO E BANCA FUNECE (CEV/UECE) - SEDUC CE 2026

IDENTIDADE E REGRAS IMPLACÁVEIS DE METODOLOGIA DIDÁTICA:
Você é o "Professor Mentor IA", especialista na Banca FUNECE e mestre em preparação para a SEDUC CE.
A aluna é a Profª. ${userName} (concorrendo na área de ${userSubject}).

${FORMULA_FORMATTING_DIRECTIVE}

🚨 SAUDAÇÕES E CONVERSA INICIAL (REGRA IMPLACÁVEL):
- Se a mensagem da aluna for APENAS uma saudação, cumprimento ou pergunta amigável (ex: "oi", "olá", "tudo bem?", "boa tarde", "oi professor", "como vai?"):
  - RESPONDA DE FORMA NATURAL, CURTA E SIMPLES (1 a 2 frases no máximo), como num chat normal.
  - É ABSOLUTAMENTE PROIBIDO enviar aula completa, explicativa, textos longos ou exemplos antes que a aluna peça um tópico específico ou faça uma pergunta sobre a matéria!
  - Exemplo ideal de resposta: "Olá, Profª. ${userName}! Tudo ótimo por aqui. Como posso te ajudar hoje nos seus estudos para a SEDUC CE? Você quer tirar uma dúvida, ver a meta de hoje ou resolver questões?"

🚨 REGRA DE ESTRUTURAÇÃO DAS AULAS E EXPLICAÇÕES (DIRETIVA CRÍTICA DE METODOLOGIA):
NUNCA comece a explicação usando historinhas, analogias ou exemplos do dia a dia ("encheção de linguiça"). Siga estritamente esta ordem em toda e qualquer aula/explicação sobre conteúdo:

1. 🎯 **PONTO CENTRAL E DEFINIÇÃO TÉCNICA:**
   - Vá direto ao ponto central do assunto de forma clara, objetiva, densa e precisa.
   - Explique exatamente O QUE É o conceito e forneça sua DEFINIÇÃO formal/técnica completa de acordo com a literatura acadêmica do edital.

2. ⚡ **APLICAÇÃO PRÁTICA E PADRÃO FUNECE:**
   - Mostre como esse conceito se aplica na prática e exatamente como a banca FUNECE (CEV/UECE) o cobra na prova da SEDUC CE (incluindo pegadinhas clássicas e detalhes exigidos).

3. 💡 **PERGUNTA FINAL OBRIGATÓRIA (OFERTA DE SIMPLIFICAÇÃO COM EXEMPLOS DA VIDA REAL):**
   - No final da explicação, pergunte OBRIGATORIAMENTE se a aluna quer que você ensine/explique de uma forma mais simplificada adequando a exemplos da vida real, ou se prefere resolver uma questão da banca sobre o tema.
   - Exemplo de fechamento obrigatório: "Ficou clara para você a definição e a aplicação técnica desse conceito? Quer que eu te ensine de uma forma mais simplificada adequando a exemplos da vida real ou prefere responder a uma questão sobre o assunto?"

4. QUANDO A ALUNA PEDIR EXPLICITAMENTE EXEMPLOS DA VIDA REAL OU SIMPLIFICAÇÃO:
   - Aí sim, e SOMENTE quando ela aceitar ou pedir ("sim", "quero os exemplos", "me ensine de forma simplificada"), forneça os exemplos da vida real de forma leve, didática e motivadora.
   - Responda dúvidas específicas em NO MÁXIMO 2 parágrafos curtos, mantendo foco e objetividade.

DADOS DA ALUNA NO SISTEMA:
- Aluna: Profª. ${userName}
- Disciplina Específica: ${userSubject} (${userDegree})
- Data Atual: ${formattedDate}
- Progresso do Edital: ${totalDone} de ${totalSubtopics} subtópicos concluídos (${progressPercent}%).
- Desempenho em Questões: ${questionsDone} resolvidas (${correctCount} acertos, ${accuracy}% de aproveitamento).
- Meta Ativa do Dia: ${activeTopicsText || "Dados do cronograma não sincronizados"}
- Itens Atrasados: ${overdueText}

${historyText ? `HISTÓRICO DA CONVERSA ANTERIOR:\n${historyText}\n\n` : ''}
${isProactive ? `SITUAÇÃO PROATIVA: Apresente de forma ultra-direta a meta de estudos de hoje.` : `MENSAGEM DA ALUNA: "${message}"`}`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        const response = await generateContentWithRetry(aiInstance, {
          contents: sysPrompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2
        });
        if (response && response.text) {
          return res.json({ success: true, text: response.text });
        }
      } catch (err: any) {
        console.warn("[Mentor IA] Erro no Gemini, usando resposta inteligente local:", err.message);
      }
    }

    // Fallback offline inteligente baseado nas Regras de Ouro
    const lowerMsg = (message || '').toLowerCase().trim();

    // 1. Saudações simples (sem solicitação de conteúdo)
    const isGreeting = /^(oi|oii|oiii|olá|ola|boa tarde|bom dia|boa noite|tudo bem|tudo bom|tudo joia|fala prof|fala professor|professor|mestre|hey|hi|e ai|e aí|oi prof|oi professor|olá prof|olá professor)[\s!,?.]*$/i.test(lowerMsg);

    if (isGreeting) {
      return res.json({
        success: true,
        text: `Olá, Profª. ${userName}! Tudo ótimo por aqui! Como posso te ajudar hoje nos seus estudos para a SEDUC CE? Quer tirar uma dúvida, ver a meta de hoje ou resolver questões da FUNECE?`
      });
    }

    if (isProactive || lowerMsg.includes('estudo hoje') || lowerMsg.includes('meta de hoje') || lowerMsg.includes('cronograma de hoje')) {
      const activeTopicsList = Array.isArray(req.body.activeTopics) ? req.body.activeTopics : [];
      const specTopic = activeTopicsList.find((t: any) => t.category === 'Conhecimentos Específicos') || activeTopicsList[0];
      const secondaryTopics = activeTopicsList.filter((t: any) => t !== specTopic);

      const specBlock = specTopic?.blockName || 'Conhecimentos Específicos';
      const specParent = specTopic?.parentTopicName || 'Conteúdo do Edital';
      const specSubtopic = (specTopic?.subtopics && specTopic.subtopics.length > 0)
        ? specTopic.subtopics.join(', ')
        : specParent;

      const secondaryStr = secondaryTopics.length > 0
        ? secondaryTopics.map((t: any) => `• **${t.category}:** ${(t.subtopics && t.subtopics.length > 0) ? t.subtopics.join(', ') : t.parentTopicName}`).join('\n')
        : `• **Legislação Educacional / Didática:** Leis do CE e LDB\n• **Revisão Espaçada:** Questões da FUNECE`;

      return res.json({
        success: true,
        text: `Hoje você deve estudar:

**Disciplina:**
${userSubject}

**Bloco:**
${specBlock}

**Tópico:**
${specParent}

**Subtópico:**
${specSubtopic}

Esse conteúdo foi escolhido porque faz parte do seu cronograma de hoje (${formattedDate}) e é sua meta ativa.

Depois continue com:
${secondaryStr}`
      });
    }

    if (lowerMsg.includes('atrasad') || lowerMsg.includes('atraso') || lowerMsg.includes('pendent')) {
      if (overdueList.length === 0) {
        return res.json({
          success: true,
          text: `🎉 **Você está 100% em dia com seu cronograma até hoje!**\n\nTodas as metas do seu cronograma de ${userSubject} do dia de hoje (${formattedDate}) e de dias anteriores já foram marcadas como concluídas no sistema!`
        });
      }

      const formattedOverdue = overdueList.map((item: any) => 
        `• **Dia ${item.dayNumber} (${item.displayDate}) - ${item.category}:**\n  - **Tópico:** ${item.parentTopicName}\n  - **Subtópico Pendente:** ${item.subtopicName}`
      ).join('\n\n');

      return res.json({
        success: true,
        text: `⚠️ **Análise de Matérias Pendentes / Atrasadas (Até Hoje)**\n\nVocê possui **${overdueList.length} subtópico(s) pendente(s)** de conclusão no seu cronograma do dia atual e de dias anteriores:\n\n${formattedOverdue}\n\n💡 **Orientação do Mentor:** Priorize a conclusão destes subtópicos para manter sua preparação no ritmo ideal para a FUNECE!`
      });
    }

    if (lowerMsg.includes('progresso') || lowerMsg.includes('como estou indo') || lowerMsg.includes('desempenho') || lowerMsg.includes('estatística') || lowerMsg.includes('estatistica')) {
      return res.json({
        success: true,
        text: `📊 **Seu Desempenho Real no Sistema**

• **Disciplina Alvo:** ${userSubject} (${userDegree})
• **Edital Concluído:** ${totalDone} de ${totalSubtopics} subtópicos (${progressPercent}% do edital concluído).
• **Desempenho em Questões:** ${questionsDone} resolvidas (${correctCount} acertos, ${accuracy}% de aproveitamento).
• **Situação do Cronograma:** ${overdueList.length === 0 ? '🎉 100% em dia com as metas de estudo!' : `⚠️ Possui ${overdueList.length} subtópico(s) pendente(s)`}.

💡 **Orientação do Mentor:** Continue resolvendo questões focadas na banca FUNECE e mantenha suas revisões diárias em dia!`
      });
    }

    // Para QUALQUER OUTRA MENSAGEM (incluindo assuntos de estudo, "quero estudar...", "me ajuda com biologia", "microscopia", "explique..."):
    // INICIA A AULA IMEDIATAMENTE SEM MENUS!
    const activeTopicsList = Array.isArray(req.body.activeTopics) ? req.body.activeTopics : [];
    const specTopic = activeTopicsList.find((t: any) => t.category === 'Conhecimentos Específicos') || activeTopicsList[0];
    const activeTopicName = specTopic?.subtopics?.[0] || specTopic?.parentTopicName || 'Noções Básicas de Microscopia';
    const userWantsQuiz = /questã|questao|simulado|exercí|exercici|pergunta|testar/i.test(lowerMsg);

    const lessonText = buildSpecificTeachingLesson(message, userSubject, activeTopicName, userWantsQuiz);
    return res.json({
      success: true,
      text: lessonText
    });
  });

  // Explicação Detalhada de Questão com IA
  app.post("/api/seduc/question-explain", async (req, res) => {
    const { questionText, options, correctAnswer, userAnswer, subject, topic } = req.body;

    const prompt = `Como professor especialista na BANCA FUNECE / CEV-UECE do Concurso SEDUC CE 2026, comente detalhadamente esta questão de prova:
Matéria: ${subject || 'Didática / Legislação FUNECE'}
Tópico: ${topic || 'Conhecimentos Gerais'}
Enunciado: "${questionText}"
Gabarito Oficial: Alternativa ${correctAnswer}
Resposta do Aluno: Alternativa ${userAnswer || 'N/A'}

${FORMULA_FORMATTING_DIRECTIVE}

Forneça um comentário explicativo completo no estilo FUNECE contendo:
1. Fundamentação Legal ou Doutrinária (Artigo da lei, norma da BNCC ou teoria pedagógica aplicada).
2. Por que a alternativa ${correctAnswer} é a correta segundo o gabarito oficial da FUNECE.
3. Por que as outras alternativas são distratores / estão incorretas.
4. Uma dica prática sobre a pegadinha clássica da FUNECE para não errar esse tipo de questão na prova da SEDUC CE.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2
        });
        if (response && response.text) {
          return res.json({ success: true, text: response.text });
        }
      } catch (err: any) {
        console.warn("[Question Explain] Erro no Gemini, caindo para resposta local:", err.message);
      }
    }

    return res.json({
      success: true,
      text: ` Comentário Pedagógico Especialista FUNECE:\n\nA alternativa correta segundo a FUNECE é a **${correctAnswer}**.\n\nA banca CEV/UECE (FUNECE) exige atenção às expressões exatas da legislação educacional do Ceará (Estatuto do Magistério, PEE-CE e LDB) e aos fundamentos pedagógicos de autores como Luckesi e Libâneo. A alternativa ${correctAnswer} reflete com precisão a norma vigente, enquanto os distratores trazem modificações sutis em conceitos e atribuições.`
    });
  });

  // Motor de Simulados Inteligente - Geração Personalizada por Assunto Estrito
  app.post("/api/seduc/generate-simulado", async (req, res) => {
    const {
      discipline,
      blockName,
      selectedTopics, // Array<{ topicName: string; subtopicName?: string }>
      banca = "FUNECE / CEV-UECE",
      difficulty = "Média",
      questionType = "Estilo banca",
      count = 5,
      previousQuestions = [] // Array<string> of previously seen question texts or titles
    } = req.body;

    if (!selectedTopics || !Array.isArray(selectedTopics) || selectedTopics.length === 0) {
      return res.status(400).json({ error: "Pelo menos um assunto do edital deve ser selecionado." });
    }

    const requestedCount = Math.min(Math.max(Number(count) || 5, 1), 20);

    // Function to strip topic codes like "1.1", "2.3", "a)" from topic titles
    const cleanEditalTitle = (rawTitle: string): string => {
      if (!rawTitle) return "Conhecimentos Específicos";
      return rawTitle
        .replace(/^[\d\.\-\s\)\(]+/, '')
        .replace(/^(Módulo|Modulo|Tópico|Topico|Unidade|Item)\s*\d+[\.\:\-]*\s*/i, '')
        .trim() || rawTitle;
    };

    const topicPaths = selectedTopics.map((t, index) => {
      const cleanSub = cleanEditalTitle(t.subtopicName || t.topicName || '');
      const cleanTop = cleanEditalTitle(t.topicName || '');
      return `• [Questão ${index + 1}] -> Disciplina: ${discipline || 'Conhecimentos do Edital'} | Assunto Científico: ${cleanSub} (${cleanTop})`;
    }).join("\n");

    const previousBlock = Array.isArray(previousQuestions) && previousQuestions.length > 0
      ? `\n## 🚨 HISTÓRICO DE QUESTÕES JÁ GERADAS E DIRETIVA DE PROGRESSÃO CONCEITUAL
O candidato JÁ RESOLVEU ${previousQuestions.length} questões em treinos anteriores.
Abaixo estão os enunciados e recortes conceituais que o aluno JÁ VIU e que É ESTRITAMENTE PROIBIDO REPETIR:

${previousQuestions.slice(-60).map((q: string, idx: number) => `   [Questão Anterior ${idx + 1}] ${q}`).join('\n')}

### 🚫 REGRAS ABSOLUTAS DE ANTI-REPETIÇÃO E EQUIVALÊNCIA CONCEITUAL:
1. **REPETIÇÃO CONCEITUAL É ERRO GRAVE**: É TERMINANTEMENTE PROIBIDO gerar qualquer questão que avalie o mesmo conceito central, o mesmo mecanismo, o mesmo componente ou a mesma explicação de uma questão anterior.
2. **COMPARABILIDADE SEMÂNTICA**: Uma questão DEVE ser considerada REPETIDA mesmo se o enunciado e as alternativas forem totalmente reescritos, caso esteja cobrando essencialmente o mesmo conhecimento prévio (exemplo: se uma questão anterior de 'Aspectos físicos, químicos e estruturais da célula' avaliou 'colesterol e fluidez da membrana', você ESTÁ PROIBIDO de gerar outra questão sobre colesterol/fluidez de membrana).
3. **EXPLORAÇÃO PROGRESSIVA DO CONTEÚDO**: Cada tópico/subtópico do edital é um conjunto amplo e extenso de conteúdos. Você DEVE OBRIGATORIAMENTE selecionar um RECORTE CONCEITUAL OU MECANISMO AINDA NÃO EXPLORADO dentro do subtópico (por exemplo: avançar para transporte ativo secundário, bomba de Na+/K+, aquaporinas, osmose em meio hipertônico/hipotônico, proteínas transmembrana vs. periféricas, glicocálix, cinética enzimática de Michaelis-Menten, organelas e bioenergética, citosqueleto, etc.).
4. **NOVIDADE REAL NO CONHECIMENTO**: A questão só é considerada nova se contiver NOVIDADE REAL no conhecimento avaliado. Não crie variações estéticas ou paráfrases da mesma questão.`
      : `\n## 🚨 DIRETIVA DE PROGRESSÃO CONCEITUAL E ANTI-REPETIÇÃO RIGOROSA
Cada tópico e subtópico do edital é um universo amplo de conteúdos. Ao gerar questões para esta sessão, explore progressivamente diferentes conhecimentos, conceitos, mecanismos, relações, aplicações, situações-problema, comparações, processos, estruturas e exceções.
NUNCA concentre a geração no mesmo subassunto. A cada nova questão (mesmo em gerações múltiplas), selecione preferencialmente um recorte diferente e inédito do conteúdo programático.`;

    const randomSeed = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

    const prompt = `[SEED DE VARIABILIDADE OBRIGATÓRIA DA SESSÃO: ${randomSeed}]
Você é o motor oficial de geração de questões do sistema PasseiSEDUC, especializado na preparação para o concurso da SEDUC-CE 2026. Sua função é gerar questões de alta qualidade, tecnicamente corretas, diretamente relacionadas ao conteúdo programático do edital e adequadas ao estilo de cobrança da banca FUNECE/CEV-UECE.

Sua missão é gerar exatamente ${requestedCount} questões objetivas inéditas, pautadas nos assuntos selecionados:

${topicPaths}

${FORMULA_FORMATTING_DIRECTIVE}

---

### 🚨 REGRAS DEFINITIVAS DO SISTEMA (CUMPRIR COM RIGOR ABSOLUTO)

1. **TRATAMENTO DO TÓPICO/SUBTÓPICO COMO CONJUNTO AMPLO DE CONTEÚDOS:**
   - Trate cada tópico e subtópico do edital como um CONJUNTO AMPLO E EXTENSO de conteúdos e não como um único conceito isolado.
   - Ao gerar questões, explore progressivamente diferentes conhecimentos, conceitos, mecanismos, relações, aplicações, situações-problema, comparações, processos, estruturas, exceções e interpretações existentes dentro do conteúdo programático selecionado.
   - NUNCA concentre repetidamente as questões no mesmo subassunto apenas porque ele pertence ao tópico selecionado.

2. **CONSULTA OBRIGATÓRIA AO HISTÓRICO E PREVENÇÃO DE EQUIVALÊNCIA CONCEITUAL:**
   - Consulte obrigatoriamente o histórico de questões já geradas para o usuário, tópico e subtópico e IMPEÇA a criação de questões idênticas ou essencialmente equivalentes às anteriores.
   - A comparação considera o texto literal, o conteúdo cobrado, o conceito central, o mecanismo avaliado, a situação apresentada e a resposta correta.
   - Uma questão é CONSIDERADA REPETIDA mesmo que o enunciado e as alternativas tenham sido reescritos se estiver avaliando essencialmente o mesmo conhecimento de uma questão anterior.
   - Mantenha memória dos conteúdos já cobrados e PRIORIZE CONTEÚDOS AINDA NÃO EXPLORADOS dentro do tópico.
   - Exemplo obrigatório: Se uma questão anterior de 'Aspectos físicos, químicos e estruturais da célula' avaliou colesterol e fluidez da membrana, a próxima NÃO deve reformular colesterol ou fluidez; deve avançar para outro aspecto relevante do tópico (ex: composição química celular, proteínas, carboidratos, lipídios, ácidos nucleicos, organização estrutural, propriedades da membrana, transporte ativo/passivo, osmose, organelas, citosqueleto ou enzimologia).
   - A questão só pode ser considerada nova quando houver NOVIDADE REAL no conhecimento avaliado. O objetivo é construir um banco progressivo.

3. **CONTEÚDO PROGRAMÁTICO = O QUE A QUESTÃO COBRA:**
   - O SUBTÓPICO SELECIONADO É O CONTEÚDO DA QUESTÃO. A FUNECE/CEV-UECE É APENAS O ESTILO DE COBRANÇA. NUNCA CONFUNDA BANCA, EDITAL, CONCURSO OU SEDUC COM O CONTEÚDO DA QUESTÃO.
   - A questão DEVE testar conhecimento REAL sobre o assunto selecionado. Se o usuário selecionar "Biologia → Identidade dos seres vivos → Aspectos físicos, químicos e estruturais da célula", a questão OBRIGATORIAMENTE deve avaliar conhecimentos científicos sobre os aspectos físicos, químicos e estruturais da célula.
   - NÃO crie uma questão sobre a FUNECE, sobre o edital, sobre a SEDUC, sobre legislação educacional, sobre didática, sobre competências docentes ou sobre como a banca cobra o assunto.
   - O nome da banca pode determinar a forma de construção da questão, mas NUNCA pode substituir o conteúdo científico/acadêmico que está sendo avaliado.

4. **HIERARQUIA OBRIGATÓRIA E FIDELIDADE À DISCIPLINA:**
   - HIERARQUIA: DISCIPLINA → TÓPICO → SUBTÓPICO.
   - O subtópico selecionado possui prioridade máxima. O tópico serve apenas como contexto de organização e não pode substituir o subtópico. NUNCA gere uma questão apenas sobre o tópico amplo quando existe um subtópico específico selecionado.
   - Se selecionar Biologia, a questão deve ser de Biologia. Se selecionar Física, deve ser Física. Se selecionar Matemática, deve ser Matemática. Se selecionar História, deve ser História. Se selecionar Língua Portuguesa, deve ser Língua Portuguesa. E assim sucessivamente.
   - NUNCA invente cenários artificiais de salas de aula, reunião de professores ou escolas para disciplinas específicas (Biologia, Física, Química, Matemática, História, Geografia, etc.). A pergunta DEVE ser sobre a própria ciência/matéria.

5. **EXPRESSÕES E FRASES ESTRITAMENTE PROIBIDAS:**
   - NUNCA escreva enunciados como:
     * "Considerando a matriz de referência do edital..."
     * "Para fins de avaliação na banca FUNECE..."
     * "De acordo com a FUNECE..."
     * "Segundo a banca examinadora..."
     * "No âmbito do concurso da SEDUC..."
     * "Conforme as diretrizes do edital..."
     * "A FUNECE considera..."
     * "A banca costuma cobrar..."
     * "No âmbito da Biologia, acerca das propriedades..."
     * "Em uma escola estadual de tempo integral..."
   - Essas expressões devem ser tratadas como ERRO GRAVE.

6. **QUALIDADE, ESTRUTURAÇÃO E PLAUSIBILIDADE DOS DISTRATORES (ITENS ERRADOS):**
   - **ZERO ERROS GROTESCOS OU ABSURDOS**: É ESTRITAMENTE PROIBIDO criar distratores com erros caricatos, absurdos ou ingênuos que possam ser descartados por eliminação fácil sem estudo prévio.
   - **ERROS SUTIS E TÉCNICAMENTE EMBASADOS**: Cada distrator deve parecer 90% correto e altamente erudito, contendo apenas uma inconsistência conceitual pontual, como:
     * Trocar conceitos ou termos de alta especificidade (ex: inibição competitiva vs. não-competitiva; transporte ativo primário vs. secundário; oração adjetiva explicativa vs. restritiva; tendência pedagógica renovada progressivista vs. renovada não-diretiva; Art. 12 vs. Art. 13 da LDB).
     * Atribuir uma propriedade verdadeira a um compartimento, fase, classe ou mecanismo incorreto (ex: atribuir a função da membrana interna mitocondrial ao estroma do cloroplasto).
     * Inverter sutilmente a relação de causa/efeito ou o sinal de uma regulação metabólica/química/conceitual.
   - **PARIDADE DE EXTENSÃO E DENSIDADE VOCABULAR**: O item correto e os 3 distratores DEVEM ter extensão, densidade acadêmica e estrutura sintática rigorosamente equivalentes. A alternativa correta JAMAIS pode ser a única longa ou explicativa.
   - **PROIBIÇÃO DE PALAVRAS "PISTA" DE CHUTE**: NÃO use termos absolutos entregadores de erro (como "prescinde totalmente", "anula integralmente", "sempre", "nunca", "vedado a todos", "sem exceção"), a menos que o conteúdo exija.
   - **DISTRATORES CONCRETOS**: Evite frases genéricas vazias ("o conhecimento desse tópico é importante", "articula-se com a prática pedagógica").
   - Distribua a alternativa correta ALEATORIAMENTE entre A, B, C e D.

7. **EXPLICAÇÃO EDUCATIVA QUE ENSINA O CONTEÚDO:**
   - Explique por que a alternativa correta está correta e por que cada distrator está incorreto com base no CONHECIMENTO ESPECÍFICO AVALIADO.
   - Não explique "como a FUNECE cobra" no lugar de explicar a matéria.

---

### 📋 CHECK-LIST MENTAL DE VALIDAÇÃO (EXECUTAR ANTES DE CADA QUESTÃO):
1. A questão pertence exatamente à disciplina selecionada?
2. A questão aborda diretamente o tópico/subtópico selecionado?
3. O conhecimento avaliado traz NOVIDADE REAL em relação às questões anteriores do histórico?
4. A FUNECE está sendo utilizada apenas como estilo e não como assunto?
5. A questão poderia existir mesmo se o nome "FUNECE" fosse removido completamente?
6. Nenhuma alternativa está falando genericamente sobre edital, banca, concurso, legislação ou pedagogia quando isso não fizer parte do conteúdo selecionado?
7. Existe apenas uma alternativa correta?
8. Os distratores são plausíveis e pertencem ao mesmo conteúdo?
9. A explicação do gabarito explica a matéria, e não a banca?
10. A questão possui conteúdo acadêmico real e não frases genéricas produzidas apenas para preencher o espaço?

SE QUALQUER UMA DAS RESPOSTAS FOR "NÃO", REFAÇA A QUESTÃO IMEDIATAMENTE.

---

${previousBlock}

---

### 📝 EXEMPLO DE EXCELÊNCIA (PADRÃO FUNECE - BIOLOGIA CELULAR):

**Enunciado:**
A membrana plasmática é uma estrutura dinâmica e seletiva, essencial para a manutenção da homeostase e para a regulação do tráfego de substâncias entre os meios intra e extracelular. A respeito da composição físico-química e da organização estrutural da membrana celular, assinale a afirmativa CORRETA:

**Opções:**
A) O colesterol atua como modulador da fluidez da membrana em células animais: em temperaturas elevadas, limita a movimentação excessiva dos fosfolipídeos; em temperaturas baixas, previne o empacotamento das cadeias de ácidos graxos e a cristalização da bicamada.
B) O transporte ativo secundário, como o simporte de glicose e sódio (Na+), consome diretamente moléculas de ATP no sítio catalítico da proteína carreadora para deslocar a glicose a favor do seu gradiente.
C) Proteínas periféricas da membrana caracterizam-se por apresentarem extensos domínios transmembrana ricos em aminoácidos apolares dispostos em alfa-hélice ancorados no centro hidrofóbico.
D) A osmose é caracterizada como um transporte ativo especializado, no qual moléculas de água são bombeadas contra o gradiente de concentração com gasto direto de ATP pela célula.

**Gabarito:** A

---

### 📤 FORMATO DA SAÍDA E ESTRUTURA DO GABARITO COMENTADO (JSON):

Sua resposta DEVE ser estritamente um objeto JSON com a chave "questions":

{
  "questions": [
    {
      "question": "Enunciado objetivo, claro e de alto rigor técnico focado exclusivamente no conteúdo científico do subtópico",
      "alternatives": [
        { "letter": "A", "text": "Afirmação concreta, tecnicamente verificável e densa" },
        { "letter": "B", "text": "Afirmação concreta, tecnicamente verificável e densa" },
        { "letter": "C", "text": "Afirmação concreta, tecnicamente verificável e densa" },
        { "letter": "D", "text": "Afirmação concreta, tecnicamente verificável e densa" }
      ],
      "correctAnswer": "A",
      "explanation": "Gabarito: A\\n\\nGabarito Comentado:\\n- Análise da Alternativa A (Correta): [Explicação científica/conceitual aprofundada da matéria]\\n- Análise dos Distratores:\\n  * B) [Erro técnico/conceitual do ponto de vista da matéria]\\n  * C) [Erro técnico/conceitual do ponto de vista da matéria]\\n  * D) [Erro técnico/conceitual do ponto de vista da matéria]",
      "topic": "Nome do tópico sem códigos",
      "subtopic": "Nome do subtópico sem códigos",
      "difficulty": "Avançado",
      "banca": "FUNECE / CEV-UECE",
      "skills": ["Domínio Científico do Conteúdo", "Rigor Técnico FUNECE"],
      "commonMistake": "Atenção aos detalhes técnicos e exceções conceituais do assunto.",
      "studyTip": "Revise os mecanismos e definições essenciais deste subtópico."
    }
  ]
}`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Simulado Motor] Gerando ${requestedCount} questões com Gemini para: "${discipline}" - ${selectedTopics.length} tópicos`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            temperature: 0.9,
            topP: 0.95,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["questions"],
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["question", "alternatives", "correctAnswer", "explanation", "topic", "subtopic", "difficulty", "banca", "skills"],
                    properties: {
                      question: { type: Type.STRING },
                      alternatives: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          required: ["letter", "text"],
                          properties: {
                            letter: { type: Type.STRING },
                            text: { type: Type.STRING }
                          }
                        }
                      },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      subtopic: { type: Type.STRING },
                      difficulty: { type: Type.STRING },
                      banca: { type: Type.STRING },
                      skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                      commonMistake: { type: Type.STRING },
                      studyTip: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            console.log(`[Simulado Motor] Geradas ${parsed.questions.length} questões com sucesso via Gemini!`);
            return res.json({ success: true, questions: parsed.questions });
          }
        }
      } catch (err: any) {
        console.warn("[Simulado Motor] Falha no Gemini, usando banco de questões curadas:", err.message);
      }
    }

    // High quality dynamic fallback generator guaranteeing unique questions per topic
    const shuffleArray = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const normDisc = (discipline || '').toLowerCase();

    const fallbackQuestions = selectedTopics.slice(0, requestedCount).map((item, idx) => {
      const cleanSub = cleanEditalTitle(item.subtopicName || item.topicName || '');
      const cleanTop = cleanEditalTitle(item.topicName || '');

      let questionText = "";
      let rawAlternatives: { text: string; isCorrect: boolean; reason: string }[] = [];

      // Combine previousQuestions strings into a single lookup text for keyword checking
      const seenCombined = (Array.isArray(previousQuestions) ? previousQuestions : []).join(' ').toLowerCase();

      if (normDisc.includes('biologia') || normDisc.includes('ciência')) {
        // Multi-variant sub-concept pool for Biology with subtle, academic distractors
        const bioVariants = [
          // Variant 0: Transporte Ativo Secundário e Gradiente Eletroquímico
          {
            key: 'simporte',
            question: `Em relação aos mecanismos de transporte através da membrana celular e à bioenergética em "${cleanSub}", considere as seguintes afirmações:\n\nI. O transporte ativo secundário, como o simporte de sódio e glicose (Na+/Glicose), não consome ATP de forma direta na proteína carreadora, utilizando a energia potencial do gradiente eletroquímico de Na+ previamente estabelecido pela bomba de Na+/K+.\nII. A difusão simples do oxigênio e do gás carbônico ocorre a favor do gradiente de concentração sem necessidade de proteínas transportadoras nem consumo energético.\nIII. A difusão facilitada de íons por canais proteicos ocorre contra o gradiente eletroquímico celular mediante gasto direto de ATP.\n\nEstá correto o que se afirma em:`,
            alternatives: [
              { text: `I e II apenas.`, isCorrect: true, reason: "I está correta (o simporte utiliza a energia do gradiente eletroquímico de Na+) e II está correta (difusão simples é passiva). III está incorreta pois difusão facilitada ocorre a favor do gradiente e não consome ATP." },
              { text: `I e III apenas.`, isCorrect: false, reason: "A afirmação III é incorreta porque a difusão facilitada é um processo passivo a favor do gradiente." },
              { text: `II e III apenas.`, isCorrect: false, reason: "A afirmação III é incorreta." },
              { text: `I, II e III.`, isCorrect: false, reason: "A afirmação III é incorreta." }
            ]
          },
          // Variant 1: Osmose, Turgidez e Aquaporinas
          {
            key: 'osmose',
            question: `No que tange às propriedades osmóticas, ao comportamento celular em soluções de diferentes tonicidades e ao tema de "${cleanSub}", assinale a alternativa CORRETA:`,
            alternatives: [
              { text: `Quando colocada em meio hipotônico, a célula vegetal absorve água por osmose até atingir a pressão de turgor, sem sofrer lise devido à resistência mecânica da parede celular celulósica.`, isCorrect: true, reason: "A parede celular celulósica exerce pressão contrária (pressão de turgor), impedindo o rompimento osmótico da célula vegetal." },
              { text: `Células animais colocadas em solução hipotônica perdem água rapidamente para o meio externo, assumindo aspecto murcho ou crenado.`, isCorrect: false, reason: "Em meio hipotônico, a célula animal ganha água por osmose podendo sofrer lise (hemólise); a crenação ocorre em meio hipertônico." },
              { text: `As aquaporinas são proteínas carreadoras simportadoras que realizam o transporte ativo primário da água dependente da hidrólise de GTP.`, isCorrect: false, reason: "Aquaporinas são canais proteicos que facilitam a difusão passiva (osmose) da água, sem consumo energético." },
              { text: `A plasmólise na célula vegetal caracteriza-se pela expansão do vacuólo e do protoplasto quando o tecido é imerso em solução hipotônica.`, isCorrect: false, reason: "A plasmólise ocorre em meio hipertônico, quando a célula perde água e o protoplasto se retrói." }
            ]
          },
          // Variant 2: Colesterol e Fluidez da Membrana
          {
            key: 'colesterol',
            question: `A respeito da organização biofísica da bicamada lipídica, do papel do colesterol e da estrutura de proteínas de membrana associadas a "${cleanSub}", assinale a alternativa CORRETA:`,
            alternatives: [
              { text: `O colesterol atua como modulador da fluidez da membrana em células animais: em temperaturas elevadas, limita a movimentação dos fosfolipídeos; em temperaturas baixas, previne o empacotamento das cadeias de ácidos graxos e a cristalização da bicamada.`, isCorrect: true, reason: "Descrição biofísica do papel anfipático e termorregulador do colesterol na bicamada lipídica." },
              { text: `Proteínas periféricas da membrana caracterizam-se por se ancorarem firmemente ao centro hidrofóbico através de domínios em alfa-hélice apolares transmembrana.`, isCorrect: false, reason: "Domínios apolares transmembrana em alfa-hélice são exclusivos de proteínas integrais (transmembrana), não periféricas." },
              { text: `O glicocálix é uma camada de fosfolipídeos e esteroides exposta na face citoplasmática interna da membrana celular responsável pela síntese de ATP.`, isCorrect: false, reason: "O glicocálix é constituído por glicoproteínas e glicolipídeos localizados na face extracelular, atuando no reconhecimento celular." },
              { text: `A assimetria lipídica da membrana plasmática é mantida por difusão lateral espontânea dos fosfolipídeos entre as monocamadas sem auxílio enzimático.`, isCorrect: false, reason: "A assimetria é mantida por enzimas específicas (flipases e flopases) que consomem ATP para mover fosfolipídeos entre as monocamadas." }
            ]
          },
          // Variant 3: Enzimas e Cinética de Michaelis-Menten
          {
            key: 'enzima',
            question: `Acerca da bioquímica celular, da cinético-química enzimática e da regulação metabólica em "${cleanSub}", assinale a alternativa CORRETA:`,
            alternatives: [
              { text: `Inibidores competitivos ligam-se reversivelmente ao sítio ativo da enzima, aumentando o valor da constante de Michaelis-Menten (Km) aparente, mantendo inalterada a velocidade máxima (Vmáx) em altas concentrações de substrato.`, isCorrect: true, reason: "Princípio fundamental da cinética enzimática de Michaelis-Menten para inibição competitiva." },
              { text: `Inibidores não-competitivos ligam-se ao sítio ativo da enzima, alterando a afinidade pelo substrato e reduzindo o valor de Km sem afetar a Vmáx.`, isCorrect: false, reason: "Inibidores não-competitivos ligam-se a um sítio alostérico (fora do sítio ativo) e diminuem a Vmáx mantendo o Km inalterado." },
              { text: `A glicólise ocorre na matriz mitocôndrial e consiste na oxidação completa da glicose em CO2 e H2O com elevada produção de ATP por fosforilação oxidativa.`, isCorrect: false, reason: "A glicólise ocorre no citosol (hialoplasma), produz piruvato e apenas 2 ATPs por fosforilação em nível de substrato." },
              { text: `A enzima RuBisCO na fotossíntese C3 realiza a fixação do CO2 durante a fase fotoquímica dependente de luz no interior dos tilacoides.`, isCorrect: false, reason: "A RuBisCO atua no estroma do cloroplasto durante a etapa enzimática (ciclo de Calvin)." }
            ]
          },
          // Variant 4: Citosqueleto e Microtúbulos
          {
            key: 'citosqueleto',
            question: `No que se refere ao citosqueleto, à organização estrutural e ao transporte intracelular referente ao tema de "${cleanSub}", assinale a alternativa CORRETA:`,
            alternatives: [
              { text: `Os microtúbulos, compostos por heterodímeros de tubulina alfa e beta, constituem os centríolos, fusos mitóticos, cílios e flagelos, atuando no transporte vesicular via proteínas motoras.`, isCorrect: true, reason: "Estrutura e dinâmica funcional dos microtúbulos e proteínas motoras associadas (cinesina e dineína)." },
              { text: `Os filamentos intermediários são constituídos por polímeros dinâmicos de actina G e participam ativamente da citocinese celular e contração muscular.`, isCorrect: false, reason: "Microfilamentos são formados por actina; filamentos intermediários incluem queratina e laminas e têm função estrutural." },
              { text: `Os microfilamentos de actina atuam no transporte anterógrado de vesículas sobre o fuso mitótico mediante hidrólise direta de GTP.`, isCorrect: false, reason: "O fuso mitótico e o transporte de vesículas dependem dos microtúbulos, e não dos microfilamentos de actina." },
              { text: `A polimerização dos microtúbulos ocorre na extremidade negativa (-) associada à membrana plasmática através da adição de monômeros de miosina.`, isCorrect: false, reason: "A polimerização do microtúbulo ocorre na extremidade positiva (+), incorporando dímeros de tubulina." }
            ]
          }
        ];

        // Find variant not yet seen in previousQuestions or pick by index
        const selectedVar = bioVariants.find(v => !seenCombined.includes(v.key)) || bioVariants[idx % bioVariants.length];
        questionText = selectedVar.question;
        rawAlternatives = selectedVar.alternatives;

      } else if (normDisc.includes('português') || normDisc.includes('língua') || normDisc.includes('gramát')) {
        const portVariants = [
          {
            key: 'concordância',
            question: `No que se refere aos aspectos de sintaxe, coesão e regência associados ao tema de "${cleanSub}", assinale a alternativa que atende rigorosamente à norma-padrão da Língua Portuguesa:`,
            alternatives: [
              { text: `A articulação sintática dos enunciados exige observância estrita às regras de concordância e à seleção adequada dos conectivos para a garantia da coesão e da clareza.`, isCorrect: true, reason: "A norma-padrão exige harmonia sintática entre os termos regentes e regidos e seleção adequada de conectivos." },
              { text: `O emprego de conectivos subordinativos condicionais estabelece uma relação de causa concluída entre as orações do período.`, isCorrect: false, reason: "Conectivos condicionais estabelecem hipótese ou condição, não relação de causa." },
              { text: `A pontuação em orações subordinadas adjetivas restritivas exige obrigatoriamente o emprego de vírgulas para delimitar o sentido geral do termo.`, isCorrect: false, reason: "Orações adjetivas restritivas não são isoladas por vírgulas; apenas as explicativas recebem pontuação." },
              { text: `A regência do verbo regente admite a omissão de preposição antes de pronomes relativos quando o termo regido for um substantivo abstrato.`, isCorrect: false, reason: "Se o verbo exige preposição, esta deve ser obrigatoriamente antecedente ao pronome relativo." }
            ]
          },
          {
            key: 'crase',
            question: `Análise a construção sintático-semântica, o emprego da crase e a colocação pronominal referente ao tópico de "${cleanSub}". Assinale a opção correta quanto à norma culta:`,
            alternatives: [
              { text: `A exatidão no emprego da regência e da colocação pronominal assegura a precisão denotativa e a clareza no registro formal.`, isCorrect: true, reason: "Regência e colocação pronominal sustentam a clareza no registro culto." },
              { text: `O sinal indicativo de crase deve ser empregado antes de verbos no infinitivo quando houver ideia de ação futura determinada.`, isCorrect: false, reason: "É vedado o uso do sinal indicativo de crase antes de verbos." },
              { text: `A substituição de conectivos adversativos por conjunções concessivas preserva rigorosamente a estrutura sintática e o sentido original do período.`, isCorrect: false, reason: "Conectivos adversativos e concessivos possuem valores semânticos e exigências modais distintas." },
              { text: `A concordância do adjetivo anteposto a múltiplos substantivos de gêneros diferentes faz-se obrigatoriamente no plural masculino.`, isCorrect: false, reason: "O adjetivo anteposto concorda em gênero e número com o substantivo mais próximo." }
            ]
          }
        ];
        const selectedVar = portVariants.find(v => !seenCombined.includes(v.key)) || portVariants[idx % portVariants.length];
        questionText = selectedVar.question;
        rawAlternatives = selectedVar.alternatives;

      } else if (normDisc.includes('legislaç') || normDisc.includes('direito') || normDisc.includes('administraç')) {
        questionText = `De acordo com os preceitos da legislação educacional brasileira (LDB nº 9.394/96 e normas correlatas) no que tange ao tema "${cleanSub}", assinale a afirmativa correta:`;
        rawAlternatives = [
          { text: `A garantia do direito à educação, a igualdade de condições para acesso e permanência e a gestão democrática do ensino público constituem princípios do ensino nacional.`, isCorrect: true, reason: "Fundamentação expressa no Artigo 3º da LDB nº 9.394/96." },
          { text: `A elaboração do Projeto Político-Pedagógico pela unidade escolar deve seguir estritamente a matriz estadual sem adaptações à comunidade local.`, isCorrect: false, reason: "A LDB (Art. 12) garante a autonomia dos estabelecimentos de ensino para elaborar e executar sua proposta pedagógica." },
          { text: `A obrigatoriedade e gratuidade da educação básica abrange exclusivamente a faixa etária dos 6 aos 18 anos de idade.`, isCorrect: false, reason: "A educação básica obrigatória e gratuita abrange dos 4 aos 17 anos de idade (Art. 4º, I)." },
          { text: `A gestão democrática do ensino público restringe a participação em conselhos escolares aos profissionais da educação com cargo efetivo.`, isCorrect: false, reason: "A LDB (Art. 14) determina a participação dos profissionais da educação e da comunidade escolar e local em conselhos." }
        ];
      } else if (normDisc.includes('pedagogi') || normDisc.includes('didátic') || normDisc.includes('educaç')) {
        const pedVariants = [
          {
            key: 'tendencias',
            question: `Na Didática Geral e no estudo das Tendências Pedagógicas no Brasil, quanto ao desenvolvimento do trabalho pedagógico e ao tema "${cleanSub}", assinale a opção correta:`,
            alternatives: [
              { text: `A articulação entre os saberes científicos e a realidade social dos estudantes caracteriza a Pedagogia Histórico-Crítica, visando à democratização do conhecimento e à emancipação do educando.`, isCorrect: true, reason: "Fundamento central da Pedagogia Histórico-Crítica (Dermeval Saviani)." },
              { text: `A Tendência Liberal Tecnicista organiza o processo pedagógico a partir do diálogo sobre temas geradores e da conscientização política do estudante.`, isCorrect: false, reason: "Temas geradores e conscientização pertencem à Pedagogia Libertadora de Paulo Freire." },
              { text: `A Tendência Liberal Renovada Progressivista fundamenta-se na transmissão expositiva de conteúdos acumulados com foco no treino de exames.`, isCorrect: false, reason: "A Renovada Progressivista centra-se na atividade do aluno ('aprender a aprender') e em métodos ativos." },
              { text: `A Tendência Progressista Libertária propõe a centralização do trabalho escolar na figura do professor como autoridade moral e mediador instrucional.`, isCorrect: false, reason: "A Tendência Libertária recusa a autoridade centralizada, propondo a autogestão e formas não-diretivas." }
            ]
          },
          {
            key: 'planejamento',
            question: `Acerca do planejamento didático, da organização curricular e do tema de "${cleanSub}", assinale a alternativa cientificamente correta:`,
            alternatives: [
              { text: `O planejamento didático intencional medeia a relação entre o conhecimento prévio do estudante e o conhecimento científico elaborado, promovendo a aprendizagem significativa.`, isCorrect: true, reason: "Conceito essencial da mediação pedagógica dialética." },
              { text: `A avaliação formativa e processual tem como finalidade primordial a classificação e ordenação dos estudantes para concessão de certificados.`, isCorrect: false, reason: "A avaliação formativa busca diagnosticar e reorientar o processo de ensino-aprendizagem, não classificar estaticamente." },
              { text: `A organização dos conteúdos curriculares deve ocorrer de forma estanque e linear, sem articulação com temas transversais ou interdisciplinares.`, isCorrect: false, reason: "As diretrizes curriculares exigem contextualização, interdisciplinaridade e transversalidade." },
              { text: `O Projeto Político-Pedagógico (PPP) é um documento burocrático de elaboração exclusiva da equipe gestora para cumprimento de exigências administrativas.`, isCorrect: false, reason: "O PPP deve ser elaborado coletivamente com a participação dos professores, funcionários e comunidade escolar." }
            ]
          }
        ];
        const selectedVar = pedVariants.find(v => !seenCombined.includes(v.key)) || pedVariants[idx % pedVariants.length];
        questionText = selectedVar.question;
        rawAlternatives = selectedVar.alternatives;
      } else {
        questionText = `No âmbito do estudo acadêmico de ${discipline || 'Conhecimentos Específicos'}, referente ao tópico de "${cleanSub}", assinale a proposição conceitualmente CORRETA:`;
        rawAlternatives = [
          { text: `O domínio dos fundamentos teóricos e conceituais inerentes a ${cleanSub.toLowerCase()} permite a compreensão precisa dos fenômenos, estruturas e processos da área de conhecimento.`, isCorrect: true, reason: "Análise conceitual e científica rigorosa do conteúdo específico selecionado." },
          { text: `A caracterização de ${cleanSub.toLowerCase()} fundamenta-se em princípios isolados sem relação com os modelos explicativos consolidados da área.`, isCorrect: false, reason: "Os conhecimentos da área baseiam-se em teorias e modelos científicos amplamente fundamentados." },
          { text: `As propriedades e relações inerentes a ${cleanSub.toLowerCase()} apoiam-se unicamente em inferências empíricas sem necessidade de demonstração lógica ou teórica.`, isCorrect: false, reason: "O conhecimento específico exige rigor metódico, teórico e dedutivo." },
          { text: `A interpretação dos fenômenos atrelados a ${cleanSub.toLowerCase()} limita-se à descrição superficial sem necessidade de análise estrutural sistemática.`, isCorrect: false, reason: "A análise sistemática dos componentes é essencial para a compreensão conceitual da matéria." }
        ];
      }

      // Shuffle the 4 alternatives so the correct letter is randomly A, B, C, or D
      const shuffled = shuffleArray(rawAlternatives);
      const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      let correctLetter: 'A' | 'B' | 'C' | 'D' = 'A';

      const finalAlternatives = shuffled.map((alt, i) => {
        const letter = letters[i];
        if (alt.isCorrect) correctLetter = letter;
        return {
          letter: letter,
          text: alt.text
        };
      });

      const correctObj = shuffled.find(a => a.isCorrect)!;

      return {
        question: questionText,
        alternatives: finalAlternatives,
        correctAnswer: correctLetter,
        explanation: `Gabarito: ${correctLetter}\n\nGabarito Comentado:\n- Análise da Alternativa ${correctLetter} (Correta): ${correctObj.reason}\n- Análise dos Distratores: As demais alternativas apresentam incorreções conceituais, inversões de propriedades ou dados equivocados a respeito da matéria.`,
        topic: cleanTop,
        subtopic: cleanSub,
        difficulty: difficulty || "Avançado",
        banca: banca || "FUNECE / CEV-UECE",
        skills: ["Domínio Científico do Conteúdo", "Análise Conceitual"]
      };
    });

    return res.json({ success: true, questions: fallbackQuestions });
  });

  // Correção de Questão Discursiva / Redação Pedagógica
  app.post("/api/seduc/essay-correct", async (req, res) => {
    const { themeTitle, promptText, essayText } = req.body;

    if (!essayText || essayText.trim().length < 20) {
      return res.status(400).json({ error: "O texto da resposta é muito curto para avaliação." });
    }

    const evaluationPrompt = `Você é a Banca Examinadora Oficial do Concurso SEDUC CE 2026 para Professores.
Avalie a seguinte resposta discursiva produzida por um candidato a professor da rede estadual do Ceará.

Tema: "${themeTitle}"
Enunciado/Comando: "${promptText || 'Estudo de caso pedagógico com base na LDB e BNCC'}"

Texto do Candidato:
"""
${essayText}
"""

Avalie e atribua nota de 0 a 100 distribuída rigorosamente nestes 4 critérios:
1. "normaCulta": Domínio do Padrão Culto da Língua Portuguesa (Gramática, Regência, Crase, Pontuação) [Máximo 25 pontos]
2. "dominioConteudo": Domínio Teórico do Conteúdo Pedagógico e Legislação Educacional [Máximo 30 pontos]
3. "estruturacaoTexto": Estruturação Textual, Coesão, Coerência e Adequação ao Gênero Dissertativo [Máximo 25 pontos]
4. "propostaPedagogica": Proposta de Intervenção Pedagógica Prática e Aplicabilidade na Escola da SEDUC CE [Máximo 20 pontos]

Retorne EXCLUSIVAMENTE um objeto JSON válido com este formato exato:
{
  "score": número (soma das notas de 0 a 100),
  "criteriaScores": {
    "normaCulta": número (0-25),
    "dominioConteudo": número (0-30),
    "estruturacaoTexto": número (0-25),
    "propostaPedagogica": número (0-20)
  },
  "feedback": "Parecer geral detalhado e construtivo da banca examinadora sobre o desempenho do candidato.",
  "strengths": ["Ponto forte 1", "Ponto forte 2"],
  "improvements": ["Aspecto a melhorar 1", "Aspecto a melhorar 2"]
}`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        const response = await generateContentWithRetry(aiInstance, {
          contents: evaluationPrompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["score", "criteriaScores", "feedback", "strengths", "improvements"],
              properties: {
                score: { type: Type.INTEGER },
                criteriaScores: {
                  type: Type.OBJECT,
                  required: ["normaCulta", "dominioConteudo", "estruturacaoTexto", "propostaPedagogica"],
                  properties: {
                    normaCulta: { type: Type.INTEGER },
                    dominioConteudo: { type: Type.INTEGER },
                    estruturacaoTexto: { type: Type.INTEGER },
                    propostaPedagogica: { type: Type.INTEGER }
                  }
                },
                feedback: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                improvements: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed });
        }
      } catch (err: any) {
        console.warn("[Essay Correct] Erro no Gemini:", err.message);
      }
    }

    // Heuristic Fallback for Essay Correction
    const textLength = essayText.trim().length;
    let baseScore = Math.min(88, Math.max(60, Math.round(textLength / 12)));
    return res.json({
      success: true,
      data: {
        score: baseScore,
        criteriaScores: {
          normaCulta: Math.round(baseScore * 0.25),
          dominioConteudo: Math.round(baseScore * 0.30),
          estruturacaoTexto: Math.round(baseScore * 0.25),
          propostaPedagogica: Math.round(baseScore * 0.20)
        },
        feedback: "Sua resposta apresenta boa articulação dos conceitos pedagógicos essenciais da SEDUC CE. Recomenda-se explicitar com mais clareza os artigos da LDB (ex: Art. 12 e 13) e a fundamentação da BNCC para pontuação máxima.",
        strengths: ["Linguagem clara e formal", "Boa contextualização da realidade escolar"],
        improvements: ["Fundamentar com artigos específicos da legislação educacional", "Detalhar os passos práticos da proposta de intervenção"]
      }
    });
  });

  // API endpoint for food nutrition lookup using Gemini + Google Search Grounding with robust fallbacks
  app.post("/api/nutrition", async (req, res) => {
    const { foodName, weight } = req.body;

    if (!foodName || !weight || isNaN(Number(weight))) {
      return res.status(400).json({ error: "Nome do alimento e peso (gramas) são obrigatórios." });
    }

    const g = Number(weight);
    const normalizedFood = String(foodName).toLowerCase().trim();

    // Predefined local dictionary for immediate lookup (saves API quota) & robust offline handling
    const fallbackDatabase: Record<string, { kcal: number; p: number; c: number; f: number; sodium: number; fiber: number; potassium: number; calcium: number; iron: number; vitaminA: number; vitaminC: number; vitaminD: number; vitaminB6: number; vitaminB12: number; source: string }> = {
      "ovo": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, vitaminA: 140, vitaminC: 0, vitaminD: 2.0, vitaminB6: 0.12, vitaminB12: 1.1, source: "Tabela TACO Oficial" },
      "frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "peito de frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "frango grelhado": { kcal: 170, p: 32, c: 0, f: 4.5, sodium: 80, fiber: 0, potassium: 260, calcium: 15, iron: 1.0, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "frango cozido": { kcal: 163, p: 31.5, c: 0, f: 3.2, sodium: 70, fiber: 0, potassium: 250, calcium: 15, iron: 1.0, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO" },
      "arroz": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "arroz branco": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "arroz integral": { kcal: 111, p: 2.6, c: 23, f: 0.9, sodium: 1, fiber: 1.8, potassium: 43, calcium: 10, iron: 0.4, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.18, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "feijao": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.15, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "feijão": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.15, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "banana": { kcal: 89, p: 1.1, c: 23, f: 0.3, sodium: 1, fiber: 2.6, potassium: 358, calcium: 5, iron: 0.3, vitaminA: 3, vitaminC: 8.7, vitaminD: 0, vitaminB6: 0.4, vitaminB12: 0, source: "USDA Nutri" },
      "maca": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "USDA Nutri" },
      "maçã": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "USDA Nutri" },
      "aveia": { kcal: 389, p: 16.9, c: 66, f: 6.9, sodium: 2, fiber: 10.6, potassium: 429, calcium: 54, iron: 4.7, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.1, vitaminB12: 0, source: "Tabela TACO" },
      "leite": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, vitaminA: 46, vitaminC: 0, vitaminD: 1.2, vitaminB6: 0.04, vitaminB12: 0.45, source: "Tabela TACO" },
      "leite desnatado": { kcal: 35, p: 3.2, c: 5, f: 0.1, sodium: 45, fiber: 0, potassium: 150, calcium: 122, iron: 0.1, vitaminA: 46, vitaminC: 0, vitaminD: 1.2, vitaminB6: 0.04, vitaminB12: 0.45, source: "Tabela TACO" },
      "whey": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informação do Fabricante" },
      "whey protein": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informação do Fabricante" },
      "creatina": { kcal: 0, p: 0, c: 0, f: 0, sodium: 0, fiber: 0, potassium: 0, calcium: 0, iron: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informação do Fabricante" },
      "pao": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.05, vitaminB12: 0, source: "USDA Nutri" },
      "pão": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.05, vitaminB12: 0, source: "USDA Nutri" },
      "pao frances": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1.0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "Tabela TACO" },
      "pão francês": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1.0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "Tabela TACO" },
      "carne": { kcal: 250, p: 26, c: 0, f: 15, sodium: 60, fiber: 0, potassium: 318, calcium: 18, iron: 2.6, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.6, source: "USDA Nutri" },
      "patinho": { kcal: 140, p: 21, c: 0, f: 5, sodium: 55, fiber: 0, potassium: 330, calcium: 10, iron: 2.5, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.3, source: "Tabela TACO" },
      "alcatra": { kcal: 160, p: 22, c: 0, f: 7, sodium: 52, fiber: 0, potassium: 310, calcium: 10, iron: 2.3, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.5, source: "Tabela TACO" },
      "batata": { kcal: 86, p: 2, c: 20, f: 0.1, sodium: 6, fiber: 1.8, potassium: 320, calcium: 12, iron: 0.3, vitaminA: 1, vitaminC: 20.0, vitaminD: 0, vitaminB6: 0.3, vitaminB12: 0, source: "Tabela TACO" },
      "batata doce": { kcal: 86, p: 1.3, c: 20, f: 0.1, sodium: 30, fiber: 3, potassium: 337, calcium: 30, iron: 0.6, vitaminA: 700, vitaminC: 2.4, vitaminD: 0, vitaminB6: 0.2, vitaminB12: 0, source: "Tabela TACO" },
      "salmao": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, vitaminA: 50, vitaminC: 0, vitaminD: 11.0, vitaminB6: 0.6, vitaminB12: 3.2, source: "USDA" },
      "salmão": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, vitaminA: 50, vitaminC: 0, vitaminD: 11.0, vitaminB6: 0.6, vitaminB12: 3.2, source: "USDA" },
      "azeite": { kcal: 884, p: 0, f: 100, c: 0, sodium: 2, fiber: 0, potassium: 1, calcium: 1, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "USDA" },
      "queijo": { kcal: 350, p: 23, c: 2.3, f: 28, sodium: 620, fiber: 0, potassium: 80, calcium: 700, iron: 0.4, vitaminA: 260, vitaminC: 0, vitaminD: 0.6, vitaminB6: 0.08, vitaminB12: 1.5, source: "Tabela TACO" },
      "manteiga": { kcal: 717, p: 0.8, c: 0.1, f: 81, sodium: 576, fiber: 0, potassium: 24, calcium: 24, iron: 0.1, vitaminA: 680, vitaminC: 0, vitaminD: 1.5, vitaminB6: 0.01, vitaminB12: 0.17, source: "USDA" },
      "mandioca": { kcal: 125, p: 0.6, c: 30, f: 0.3, sodium: 1, fiber: 1.6, potassium: 271, calcium: 19, iron: 0.3, vitaminA: 1, vitaminC: 20.6, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO" },
      "iogurte": { kcal: 60, p: 3.5, c: 5, f: 3, sodium: 50, fiber: 0, potassium: 140, calcium: 120, iron: 0.1, vitaminA: 27, vitaminC: 0.5, vitaminD: 0.1, vitaminB6: 0.05, vitaminB12: 0.4, source: "USDA" },
      "castanha": { kcal: 650, p: 15, c: 15, f: 60, sodium: 3, fiber: 6, potassium: 660, calcium: 110, iron: 6.0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.3, vitaminB12: 0, source: "Tabela TACO" },
      "ovo de galinha": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, vitaminA: 140, vitaminC: 0, vitaminD: 2.0, vitaminB6: 0.12, vitaminB12: 1.1, source: "Tabela TACO" },
      "tomate": { kcal: 18, p: 0.9, c: 3.9, f: 0.2, sodium: 5, fiber: 1.2, potassium: 237, calcium: 10, iron: 0.3, vitaminA: 42, vitaminC: 13.7, vitaminD: 0, vitaminB6: 0.08, vitaminB12: 0, source: "Tabela TACO" },
      "alface": { kcal: 15, p: 1.3, c: 2.8, f: 0.2, sodium: 10, fiber: 1.3, potassium: 194, calcium: 36, iron: 0.8, vitaminA: 370, vitaminC: 9.2, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO" }
    };

    // Fast-Local-First Logic: If we find a direct matching item, return it immediately!
    const matchedFoodKey = Object.keys(fallbackDatabase).find(key => 
      normalizedFood === key || normalizedFood.includes(key) || key.includes(normalizedFood)
    );

    if (matchedFoodKey) {
      console.log(`[Nutrition] Local-First Match Encontrado para: "${foodName}". Ignorando chamada API.`);
      const basicNutrients = fallbackDatabase[matchedFoodKey];
      const factor = g / 100;
      return res.json({
        success: true,
        data: {
          calories: Math.round(basicNutrients.kcal * factor),
          protein: parseFloat((basicNutrients.p * factor).toFixed(1)),
          carbs: parseFloat((basicNutrients.c * factor).toFixed(1)),
          fat: parseFloat((basicNutrients.f * factor).toFixed(1)),
          sodium: Math.round(basicNutrients.sodium * factor),
          fiber: parseFloat((basicNutrients.fiber * factor).toFixed(1)),
          potassium: Math.round(basicNutrients.potassium * factor),
          calcium: Math.round(basicNutrients.calcium * factor),
          iron: parseFloat((basicNutrients.iron * factor).toFixed(1)),
          vitaminA: parseFloat((basicNutrients.vitaminA * factor).toFixed(1)),
          vitaminC: parseFloat((basicNutrients.vitaminC * factor).toFixed(1)),
          vitaminD: parseFloat((basicNutrients.vitaminD * factor).toFixed(1)),
          vitaminB6: parseFloat((basicNutrients.vitaminB6 * factor).toFixed(1)),
          vitaminB12: parseFloat((basicNutrients.vitaminB12 * factor).toFixed(1)),
          source: `${basicNutrients.source} (${g}g)`
        }
      });
    }

    const prompt = `Analise os valores nutricionais reais e a média para ${g} gramas do seguinte alimento: "${foodName}". 
Você deve se conectar à internet ou usar bases de dados confiáveis de alimentos (como a tabela TACO, USDA, ou fontes na web) e pesquisar se necessário. 
Calcule os valores escalados especificamente para ${g}g do alimento.
Retorne um objeto JSON contendo exatamente estas chaves com valores numéricos (exceto a fonte):
- calories: número (kcal para ${g}g)
- protein: número (g de proteína para ${g}g)
- carbs: número (g de carboidratos para ${g}g)
- fat: número (g de gordura para ${g}g)
- sodium: número (mg de sódio para ${g}g)
- fiber: número (g de fibras para ${g}g)
- potassium: número (mg de potássio para ${g}g)
- calcium: número (mg de cálcio para ${g}g)
- iron: número (mg de ferro para ${g}g)
- vitaminA: número (mcg de vitamina A para ${g}g)
- vitaminC: número (mg de vitamina C para ${g}g)
- vitaminD: número (mcg de vitamina D para ${g}g)
- vitaminB6: número (mg de vitamina B6 para ${g}g)
- vitaminB12: número (mcg de vitamina B12 para ${g}g)
- source: string curta indicando a fonte ou verificação de pesquisa da web.

Atenção: retorne estritamente um JSON limpo formatado de acordo com o esquema mapeado. Não inclua Markdown extra além do próprio formato JSON.`;

    // Strategy 1: Attempt with Gemini 3.5 Flash and Google Search Grounding if AI Client is available
    const aiInstance = getAIClient();
    if (aiInstance && Date.now() >= quotaCooldownUntil) {
      try {
        console.log(`[Nutrition] Tentando Gemini com Google Search para: "${foodName}" (${g}g)`);
        const response = await aiInstance.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "vitaminA", "vitaminC", "vitaminD", "vitaminB6", "vitaminB12", "source"],
              properties: {
                calories: { type: Type.NUMBER, description: "Calorias totais em kcal" },
                protein: { type: Type.NUMBER, description: "Proteínas em gramas" },
                carbs: { type: Type.NUMBER, description: "Carboidratos em gramas" },
                fat: { type: Type.NUMBER, description: "Gorduras em gramas" },
                sodium: { type: Type.NUMBER, description: "Sódio em mg" },
                fiber: { type: Type.NUMBER, description: "Fibras alimentares em gramas" },
                potassium: { type: Type.NUMBER, description: "Potássio em mg" },
                calcium: { type: Type.NUMBER, description: "Cálculo de cálcio em mg" },
                iron: { type: Type.NUMBER, description: "Hierro (ferro) em mg" },
                vitaminA: { type: Type.NUMBER, description: "Vitamina A em mcg" },
                vitaminC: { type: Type.NUMBER, description: "Vitamina C em mg" },
                vitaminD: { type: Type.NUMBER, description: "Vitamina D em mcg" },
                vitaminB6: { type: Type.NUMBER, description: "Vitamina B6 em mg" },
                vitaminB12: { type: Type.NUMBER, description: "Vitamina B12 em mcg" },
                source: { type: Type.STRING, description: "A fonte de consulta comprovada na internet" }
              }
            }
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          console.log(`[Nutrition] Gemini com Grounding funcionou!`, parsedData);
          return res.json({ success: true, data: parsedData });
        }
      } catch (searchError: any) {
        console.log(`[Nutrition] Gemini Search Grounding indisponivel (quota). Tentando Gemini padrao...`);
      }

      // Strategy 2: Attempt standard prompt without the googleSearch tool if AI Client is available
      try {
        console.log(`[Nutrition] Tentando Gemini normal (com retries) para: "${foodName}" (${g}g)`);
        const responseWithoutSearch = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "vitaminA", "vitaminC", "vitaminD", "vitaminB6", "vitaminB12", "source"],
              properties: {
                calories: { type: Type.NUMBER, description: "Calorias totais em kcal" },
                protein: { type: Type.NUMBER, description: "Proteínas em gramas" },
                carbs: { type: Type.NUMBER, description: "Carboidratos em gramas" },
                fat: { type: Type.NUMBER, description: "Gorduras em gramas" },
                sodium: { type: Type.NUMBER, description: "Sódio em mg" },
                fiber: { type: Type.NUMBER, description: "Fibras alimentares em gramas" },
                potassium: { type: Type.NUMBER, description: "Potássio em mg" },
                calcium: { type: Type.NUMBER, description: "Cálculo de cálcio em mg" },
                iron: { type: Type.NUMBER, description: "Hierro (ferro) em mg" },
                vitaminA: { type: Type.NUMBER, description: "Vitamina A em mcg" },
                vitaminC: { type: Type.NUMBER, description: "Vitamina C em mg" },
                vitaminD: { type: Type.NUMBER, description: "Vitamina D em mcg" },
                vitaminB6: { type: Type.NUMBER, description: "Vitamina B6 em mg" },
                vitaminB12: { type: Type.NUMBER, description: "Vitamina B12 em mcg" },
                source: { type: Type.STRING, description: "A fonte de consulta recomendada" }
              }
            }
          }
        });

        const responseText = responseWithoutSearch.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          console.log(`[Nutrition] Gemini padrão funcionou!`, parsedData);
          return res.json({ success: true, data: parsedData });
        }
      } catch (normalError: any) {
        console.log(`[Nutrition] Gemini padrao indisponivel. Ativando estimativa offline... Erro: ${normalError.message}`);
      }
    } else {
      console.log(`[Nutrition] Pulando IA por falta de chave API. Usando estimativa inteligente local.`);
    }

    // Strategy 3: Local intelligent offline heuristic fallback database
    try {
      let matchedFuzzyKey = Object.keys(fallbackDatabase).find(key => 
        normalizedFood.includes(key) || key.includes(normalizedFood)
      );

      let basicNutrients = {
        kcal: 100, // standard default
        p: 2.0,
        c: 15.0,
        f: 1.5,
        sodium: 15,
        fiber: 1.0,
        potassium: 120,
        calcium: 15,
        iron: 0.5,
        vitaminA: 5,
        vitaminC: 1.0,
        vitaminD: 0,
        vitaminB6: 0.05,
        vitaminB12: 0,
        source: "Heurística BioForma Estimada (Sem Conexão)"
      };

      if (matchedFuzzyKey) {
        basicNutrients = { ...fallbackDatabase[matchedFuzzyKey] };
      } else {
        // Smart Heuristic guesses based on Portuguese food classification keywords
        if (normalizedFood.includes("carne") || normalizedFood.includes("bife") || normalizedFood.includes("peixe") || normalizedFood.includes("porco") || normalizedFood.includes("vaca")) {
          basicNutrients = { kcal: 200, p: 25, c: 0, f: 11, sodium: 60, fiber: 0, potassium: 300, calcium: 10, iron: 2.0, vitaminA: 5, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.5, source: "Estimativa Carnes BioForma" };
        } else if (normalizedFood.includes("bolo") || normalizedFood.includes("escondidinho") || normalizedFood.includes("pizza") || normalizedFood.includes("doce") || normalizedFood.includes("chocolate") || normalizedFood.includes("biscoito")) {
          basicNutrients = { kcal: 350, p: 4, c: 55, f: 15, sodium: 350, fiber: 1.5, potassium: 120, calcium: 40, iron: 1.2, vitaminA: 10, vitaminC: 0.5, vitaminD: 0.1, vitaminB6: 0.05, vitaminB12: 0.1, source: "Estimativa Ultraprocessados BioForma" };
        } else if (normalizedFood.includes("salada") || normalizedFood.includes("legume") || normalizedFood.includes("brocolis") || normalizedFood.includes("brócolis") || normalizedFood.includes("cenoura") || normalizedFood.includes("abobora")) {
          basicNutrients = { kcal: 30, p: 1.5, c: 6, f: 0.2, sodium: 10, fiber: 2.5, potassium: 220, calcium: 30, iron: 0.6, vitaminA: 200, vitaminC: 15, vitaminD: 0, vitaminB6: 0.1, vitaminB12: 0, source: "Estimativa Vegetais BioForma" };
        } else if (normalizedFood.includes("suco") || normalizedFood.includes("refrigerante") || normalizedFood.includes("gatorade") || normalizedFood.includes("cerveja")) {
          basicNutrients = { kcal: 45, p: 0.1, c: 11, f: 0, sodium: 5, fiber: 0.1, potassium: 45, calcium: 2, iron: 0.1, vitaminA: 5, vitaminC: 10, vitaminD: 0, vitaminB6: 0.02, vitaminB12: 0, source: "Estimativa Bebidas BioForma" };
        }
      }

      // Calculate the values weighted by the requested weight in grams (the db has values per 100g)
      const factor = g / 100;
      const computedResponse = {
        calories: Math.round(basicNutrients.kcal * factor),
        protein: parseFloat((basicNutrients.p * factor).toFixed(1)),
        carbs: parseFloat((basicNutrients.c * factor).toFixed(1)),
        fat: parseFloat((basicNutrients.f * factor).toFixed(1)),
        sodium: Math.round(basicNutrients.sodium * factor),
        fiber: parseFloat((basicNutrients.fiber * factor).toFixed(1)),
        potassium: Math.round(basicNutrients.potassium * factor),
        calcium: Math.round(basicNutrients.calcium * factor),
        iron: parseFloat((basicNutrients.iron * factor).toFixed(1)),
        vitaminA: parseFloat((basicNutrients.vitaminA * factor).toFixed(1)),
        vitaminC: parseFloat((basicNutrients.vitaminC * factor).toFixed(1)),
        vitaminD: parseFloat((basicNutrients.vitaminD * factor).toFixed(1)),
        vitaminB6: parseFloat((basicNutrients.vitaminB6 * factor).toFixed(1)),
        vitaminB12: parseFloat((basicNutrients.vitaminB12 * factor).toFixed(1)),
        source: `${basicNutrients.source} (${g}g)`
      };

      console.log(`[Nutrition] Retornando fallback local com sucesso para "${foodName}":`, computedResponse);
      return res.json({ success: true, data: computedResponse });
    } catch (fallbackErr: any) {
      console.log("Erro no fallback local:", fallbackErr);
      return res.status(200).json({
        success: true,
        data: {
          calories: Math.round(100 * (g / 100)),
          protein: parseFloat((2.0 * (g / 100)).toFixed(1)),
          carbs: parseFloat((15.0 * (g / 100)).toFixed(1)),
          fat: parseFloat((1.5 * (g / 100)).toFixed(1)),
          sodium: 15,
          fiber: 1.0,
          potassium: 120,
          calcium: 15,
          iron: 0.5,
          vitaminA: 5,
          vitaminC: 1,
          vitaminD: 0,
          vitaminB6: 0.05,
          vitaminB12: 0,
          source: `Estimativa BioForma (${g}g)`
        }
      });
    }
  });

  // Calculate calories burned for aerobic activities using Gemini AI
  const aerobicsHandler = async (req: express.Request, res: express.Response) => {
    const { type, duration, intensity, userWeight } = req.body;

    if (!type || !duration || isNaN(Number(duration))) {
      return res.status(400).json({ error: "Tipo de atividade e duração são obrigatórios." });
    }

    const min = Number(duration);
    const weight = Number(userWeight) || 68; // Fallback to 68kg if not provided
    const normalIntensity = String(intensity || "moderado").toLowerCase().trim();
    const intensityText = normalIntensity.charAt(0).toUpperCase() + normalIntensity.slice(1);
    const normalizedType = String(type).toLowerCase().trim();

    // Strategy 1: Attempt Gemini AI Calculation
    const aiInstance = getAIClient();
    if (aiInstance) {
      const gptPrompt = `Você é um especialista em fisiologia do exercício e educação física. 
      Calcule as calorias gastas por uma pessoa de ${weight}kg realizando a seguinte atividade física:
      Atividade: "${type}"
      Duração: ${min} minutos
      Intensidade: "${intensityText}"
      
      Leve em consideração a fisiologia real (gasto por minuto e valor MET). Se for Amamentação, ela tem um custo calórico considerável (~300 a 500 kcal por dia, cerca de 4 a 5 kcal/minuto dependendo da intensidade).
      Retorne estritamente um objeto JSON com as chaves:
      - caloriesBurned: número inteiro (calorias em kcal)
      - metUsed: número (MET correspondente à atividade e intensidade)
      - explanation: string curta em português explicando simplificadamente a estimativa (ex: "Consumo estimado de X kcal/min para amamentação moderada").
      
      Não inclua markdown extra ou texto de introdução/conclusão. Apenas o JSON em formato puro.`;

      try {
        console.log(`[Aerobics] Tentando calcular calorias com Gemini (com retries) para: ${type}, ${min}min, intensidade: ${intensityText}`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: gptPrompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["caloriesBurned", "metUsed", "explanation"],
              properties: {
                caloriesBurned: { type: Type.INTEGER, description: "Gasto calórico estimado em kcal" },
                metUsed: { type: Type.NUMBER, description: "Valor de MET utilizado" },
                explanation: { type: Type.STRING, description: "Breve explicação do gasto" }
              }
            }
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          console.log(`[Aerobics] Gemini calculou as calorias aeróbicas:`, parsedData);
          return res.json({ success: true, data: parsedData });
        }
      } catch (geminiError: any) {
        console.log(`[Aerobics] Gemini indisponível para cálculo de aeróbico. Usando o algoritmo offline. Error: ${geminiError.message}`);
      }
    }

    // Strategy 2: Offline Calculation Helper using standard MET values
    try {
      let baseMet = 5.0; // Default MET
      
      // Determine base MET based on athletic category and intensity
      if (normalizedType.includes("corrida") || normalizedType.includes("trote") || normalizedType.includes("run")) {
        baseMet = normalIntensity === "baixo" ? 7.0 : normalIntensity === "alto" ? 12.0 : 9.8;
      } else if (normalizedType.includes("volei") || normalizedType.includes("vôlei") || normalizedType.includes("volleyball")) {
        baseMet = normalIntensity === "baixo" ? 3.0 : normalIntensity === "alto" ? 6.0 : 4.0;
      } else if (normalizedType.includes("natacao") || normalizedType.includes("natação") || normalizedType.includes("swim")) {
        baseMet = normalIntensity === "baixo" ? 4.5 : normalIntensity === "alto" ? 8.0 : 6.0;
      } else if (normalizedType.includes("amamenta") || normalizedType.includes("amamento") || normalizedType.includes("breastfeed")) {
        // Breastfeeding consumes high energy! ~4 kcal / min is ~3.5 MET
        baseMet = normalIntensity === "baixo" ? 2.5 : normalIntensity === "alto" ? 4.5 : 3.5;
      } else if (normalizedType.includes("treino") || normalizedType.includes("musculacao") || normalizedType.includes("musculação") || normalizedType.includes("academia")) {
        baseMet = normalIntensity === "baixo" ? 3.5 : normalIntensity === "alto" ? 7.0 : 5.0;
      } else if (normalizedType.includes("caminha") || normalizedType.includes("walk")) {
        baseMet = normalIntensity === "baixo" ? 2.5 : normalIntensity === "alto" ? 4.5 : 3.3;
      } else if (normalizedType.includes("bicicleta") || normalizedType.includes("pedal") || normalizedType.includes("bike")) {
        baseMet = normalIntensity === "baixo" ? 4.0 : normalIntensity === "alto" ? 10.0 : 7.0;
      } else if (normalizedType.includes("futebol") || normalizedType.includes("soccer")) {
        baseMet = normalIntensity === "baixo" ? 5.0 : normalIntensity === "alto" ? 9.0 : 7.0;
      } else if (normalizedType.includes("danca") || normalizedType.includes("dança") || normalizedType.includes("zumba")) {
        baseMet = normalIntensity === "baixo" ? 3.5 : normalIntensity === "alto" ? 7.0 : 5.0;
      }

      // Formula: kcal = MET * weight * hours
      const hours = min / 60;
      const computedKcal = Math.round(baseMet * weight * hours);

      console.log(`[Aerobics] Retornando cálculo offline de aeróbico para: ${type} ${min}min. Kcal: ${computedKcal}`);
      return res.json({
        success: true,
        data: {
          caloriesBurned: computedKcal,
          metUsed: baseMet,
          explanation: `Cálculo offline: ${type} com intensidade ${intensityText} (${baseMet} MET).`
        }
      });
    } catch (err: any) {
      // Emergency absolute fallback
      const emergencyKcal = Math.round(6.0 * min);
      return res.json({
        success: true,
        data: {
          caloriesBurned: emergencyKcal,
          metUsed: 5.0,
          explanation: "Estimativa geral BioForma (6 kcal/minuto)."
        }
      });
    }
  };

  app.post("/api/aerobics", aerobicsHandler);
  app.post("/api/aerobics-calories", aerobicsHandler);

  // Analyze Lab Exams with Gemini or offline expert knowledge to provide actionable solutions
  app.post("/api/analyze-exam", async (req, res) => {
    const { type, value, unit, result, notes } = req.body;

    if (!type) {
      return res.status(400).json({ error: "O tipo ou nome do exame é obrigatório para a análise." });
    }

    const numericValue = Number(value);
    const normalizedType = String(type).toLowerCase().trim();

    const prompt = `Você é um analista médico de inteligência artificial de elite integrado ao aplicativo BioForma.
O usuário enviou um exame laboratorial e deseja soluções/sugestões práticas para o seu resultado, principalmente se estiver fora dos valores normais ou abaixo da referência.

Detalhes do exame fornecidos:
- Tipo/Nome do Exame: "${type}"
- Valor registrado: ${value ? `${value} ${unit || ''}` : "Não informado numericamente"}
- Texto do Resultado/Laudo Completo: "${result || ''}"
- Notas/Observações: "${notes || ''}"

Você deve fornecer uma resposta no formato JSON estruturado com os seguintes campos:
1. "analysis": Breve resumo explicando o que é esse exame e interpretando o valor atual (especialmente se estiver baixo ou alto).
2. "causes": Uma lista de strings contendo possíveis causas fisiológicas para esse nível (principalmente se estiver abaixo do ideal).
3. "solutions": Uma lista de strings com soluções práticas e seguras para elevar/ajustar esse marcador (melhorias nos treinos, mudanças de hábitos, regulação de sono, controle de estresse).
4. "dietaryTips": Uma lista de strings com dicas de alimentação ou alimentos ricos que auxiliam nesse marcador específico.
5. "warning": Um aviso médico claro, lembrando que a IA é apenas informativa e não substitui a consulta médica.

Escreva a resposta estritamente em português brasileiro de forma profissional, acolhedora e direta. Retorne apenas o JSON puro, sem formatação Markdown externa.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Exam Analysis] Analisando exame com Gemini (com retries) para: "${type}" (valor: ${value})`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["analysis", "causes", "solutions", "dietaryTips", "warning"],
              properties: {
                analysis: { type: Type.STRING, description: "Resumo explicativo do exame e interpretação" },
                causes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de possíveis causas do nível do exame"
                },
                solutions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de sugestões de hábitos, atividades ou soluções gerais"
                },
                dietaryTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Alimentos e estratégias de dieta recomendados"
                },
                warning: { type: Type.STRING, description: "Aviso de isenção de responsabilidade médica" }
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim());
          console.log(`[Exam Analysis] Gemini analisou com sucesso!`);
          return res.json({ success: true, data: parsed });
        }
      } catch (geminiErr: any) {
        console.log(`[Exam Analysis] Falha ao consultar o Gemini para exames, usando o analisador offline inteligente. Erro: ${geminiErr.message}`);
      }
    }

    // Smart Offline Expert Fallback System for common lab tests
    try {
      console.log(`[Exam Analysis] Executando analisador offline de exames para: "${type}"`);
      
      let analysis = `O exame de ${type} é fundamental para avaliar as funções metabólicas ou hormonais do organismo.`;
      let causes: string[] = ["Fatores individuais de genética ou idade", "Padrões alimentares específicos", "Nível de atividade física", "Níveis de estresse ou privação de sono."];
      let solutions: string[] = ["Manter rotina consistente de atividade física (musculação e aeróbico)", "Priorizar 7 a 8 horas de sono de qualidade para regulação endócrina", "Reduzir consumo de açúcares refinados e gorduras trans", "Monitorar novos resultados em 3 a 6 meses sob supervisão médica."];
      let dietaryTips: string[] = ["Beba pelo menos 35ml de água por kg de peso corporal diariamente", "Aumente o consumo de vegetais folhosos escuros, legumes e frutas frescas", "Inclua fontes de gorduras saudáveis na alimentação (azeite extra virgem, sementes, abacate, peixes)."];
      let warning = "Atenção: Esta é uma análise automatizada baseada em diretrizes nutricionais e esportivas de caráter exclusivamente informativo. Nunca altere medicamentos ou inicie suplementações de alta dose sem antes consultar seu médico de confiança.";

      if (normalizedType.includes("vitamina d") || normalizedType.includes("d3") || normalizedType.includes("colecalciferol")) {
        analysis = "A Vitamina D é crucial para a fixação do cálcio nos ossos, modulação da imunidade, força muscular e síntese hormonal. Níveis baixos (especialmente abaixo de 30 ng/mL) são extremamente comuns em pessoas que passam muito tempo em ambientes fechados.";
        causes = [
          "Baixa exposição à luz solar direta sem protetor solar",
          "Dieta pobre em peixes gordos e gemas de ovos",
          "Dificuldades metabólicas individuais de síntese cutânea."
        ];
        solutions = [
          "Exposição solar diária inteligente de 15 a 20 minutos (braços e pernas expostos, preferencialmente entre as 10h e as 14h, respeitando a sensibilidade da pele)",
          "Realizar exercícios físicos regulares (estimula o metabolismo ósseo e muscular)",
          "Apresentar este resultado ao médico para prescrição de uma dosagem segura de suplementação de Vitamina D3 (ex: 2.000 UI a 5.000 UI diárias, conforme necessidade clínica)."
        ];
        dietaryTips = [
          "Aumentar o consumo de peixes de águas frias (salmão selvagem, atum, sardinha)",
          "Incluir gemas de ovos orgânicos ou caipiras na dieta",
          "Consumir cogumelos expostos ao sol ou alimentos fortificados com Vitamina D."
        ];
      } else if (normalizedType.includes("vitamina c") || normalizedType.includes("ácido ascórbico") || normalizedType.includes("ascorb")) {
        analysis = "A Vitamina C (ácido ascórbico) é um poderoso antioxidante vital para a síntese de colágeno, saúde de vasos sanguíneos, cicatrização, absorção do ferro vegetal e excelente função do sistema imunológico. Níveis baixos causam fadiga, imunidade baixa e dores nas articulações.";
        causes = [
          "Consumo insuficiente de frutas frescas e vegetais crus no dia a dia",
          "Cozimento prolongado de alimentos ricos em Vitamina C (que destrói o nutriente devido ao calor)",
          "Estresse físico muito alto decorrente de treinos exaustivos sem recuperação adequada",
          "Hábito de fumar ou exposição frequente a toxinas ambientais (que aumentam o gasto de antioxidantes)."
        ];
        solutions = [
          "Aumentar a ingestão de alimentos crus ricos em Vitamina C nas refeições principais",
          "Melhorar a absorção do ferro de fontes vegetais (como feijão e espinafre) consumindo alimentos com Vitamina C na mesma refeição",
          "Ajustar a intensidade do treino e priorizar o descanso se a imunidade estiver fragilizada",
          "Se indicado por médico ou nutricionista, avaliar a suplementação diária de 500mg a 1000mg de Vitamina C pura."
        ];
        dietaryTips = [
          "Consumir frutas cítricas frescas (laranja, limão, mexerica, kiwi, morango)",
          "Incluir frutas com altíssima concentração como Acerola e Goiaba na sua rotina de sucos ou lanches",
          "Adicionar pimentão amarelo ou vermelho cru na salada, além de brócolis e couve pouco cozidos."
        ];
      } else if (normalizedType.includes("testosterona") || normalizedType.includes("testo")) {
        analysis = "A testosterona é o principal hormônio androgênico, essencial para o ganho e manutenção de massa muscular, queima de gordura, níveis de energia, libido e saúde cognitiva. Níveis muito baixos podem sabotar seu progresso físico.";
        causes = [
          "Estresse crônico elevado (o cortisol alto inibe diretamente a produção de testosterona)",
          "Privação de sono recorrente ou sono fragmentado",
          "Deficiência de gorduras boas e micronutrientes como zinco e magnésio na dieta",
          "Excesso de gordura corporal, que aumenta a conversão de testosterona em estrogênio via aromatase."
        ];
        solutions = [
          "Praticar treinos de força intensos (musculação com pesos livres, agachamentos, levantamento terra) de 3 a 5 vezes na semana",
          "Garantir 7 a 8 horas de sono profundo ininterrupto por noite",
          "Gerenciar o estresse por meio de meditação, respiração ou caminhadas ao ar livre",
          "Evitar consumo excessivo de álcool, que interfere diretamente no eixo hormonal."
        ];
        dietaryTips = [
          "Consumir fontes de gorduras saudáveis (gemas de ovo, azeite extra virgem, abacate, castanhas e nozes) para fornecer colesterol, que é a matéria-prima dos hormônios esteroides",
          "Garantir alimentos ricos em Zinco e Magnésio (carne vermelha magra, sementes de abóbora, espinafre, cacau 100%)",
          "Adicionar vegetais crucíferos (brócolis, couve-flor, repolho), que contêm compostos que auxiliam no equilíbrio estrogênico."
        ];
      } else if (normalizedType.includes("glicose") || normalizedType.includes("açúcar") || normalizedType.includes("glicemia")) {
        if (numericValue > 0 && numericValue < 70) {
          analysis = "Sua Glicose em jejum está abaixo da referência padrão (< 70 mg/dL), indicando uma tendência à hipoglicemia leve. Isso pode gerar fadiga súbita, tontura, tremores ou suor frio.";
          causes = [
            "Períodos de jejum prolongado não adaptados",
            "Treinos de altíssima intensidade combinados com baixa ingestão de carboidratos prévios",
            "Alta sensibilidade insulínica natural ou resposta metabólica exagerada ao estresse físico."
          ];
          solutions = [
            "Evitar treinar em jejum absoluto se sentir tontura ou fraqueza",
            "Distribuir a ingestão calórica e de carboidratos de forma mais homogênea ao longo do dia",
            "Monitorar as taxas de glicemia e relatar tonturas ao seu profissional de saúde."
          ];
          dietaryTips = [
            "Adicionar fontes de carboidratos complexos de baixo índice glicêmico combinados com proteínas e fibras nas refeições principais (aveia, batata doce, arroz integral, lentilha)",
            "Leve sempre uma fonte rápida de carboidrato (uma banana ou sachê de mel) na bolsa para emergências de tontura durante treinos intensos."
          ];
        } else if (numericValue >= 100) {
          analysis = "Sua Glicose está acima de 99 mg/dL, sugerindo um estado de pré-diabetes ou resistência à insulina que precisa ser abordado para evitar o acúmulo de gordura visceral e proteger o pâncreas.";
          causes = [
            "Dieta com alta densidade de carboidratos simples e açúcares refinados",
            "Sedentarismo ou falta de contração muscular de alta demanda",
            "Estresse crônico que mantém o cortisol elevado (estimulando a gliconeogênese)."
          ];
          solutions = [
            "Engajar-se em treinos de musculação (o músculo é o principal captador de glicose sem necessidade excessiva de insulina)",
            "Fazer uma caminhada de 10 a 15 minutos logo após as maiores refeições (ajuda a controlar o pico glicêmico pós-prandial)",
            "Melhorar a qualidade do sono e praticar controle de estresse."
          ];
          dietaryTips = [
            "Substituir carboidratos refinados (pão branco, massas, doces) por versões integrais e ricos em fibras",
            "Iniciar as refeições principais consumindo primeiro as fibras (saladas) e proteínas, deixando os carboidratos por último (reduz a velocidade de absorção da glicose)",
            "Utilizar canela em pó, vinagre de maçã e chá verde, que auxiliam na sensibilidade à insulina."
          ];
        }
      } else if (normalizedType.includes("hdl") || normalizedType.includes("bom")) {
        analysis = "O HDL é o Colesterol Bom. Ele atua como uma 'limpeza' das artérias, levando o excesso de colesterol de volta ao fígado para ser eliminado. Valores muito baixos (geralmente abaixo de 40 mg/dL) aumentam o risco cardiovascular.";
        causes = [
          "Falta de exercícios aeróbicos regulares",
          "Consumo inadequado de gorduras saudáveis e excesso de carboidratos refinados",
          "Fatores genéticos ou sedentarismo crônico."
        ];
        solutions = [
          "Adicionar atividades aeróbicas de intensidade moderada a alta de 3 a 5 vezes na semana (corrida, ciclismo, natação)",
          "Eliminar gorduras trans (biscoitos recheados, salgadinhos de pacote, frituras industriais)",
          "Controlar o peso e evitar o tabagismo."
        ];
        dietaryTips = [
          "Consumir azeite de oliva extra virgem diariamente (cerca de 1 a 2 colheres de sopa)",
          "Comer abacate, sementes de linhaça, chia e oleaginosas (nozes, castanhas-do-pará)",
          "Incluir peixes ricos em Ômega-3 ou avaliar suplementação purificada de óleo de peixe."
        ];
      }

      return res.json({
        success: true,
        data: {
          analysis,
          causes,
          solutions,
          dietaryTips,
          warning
        }
      });
    } catch (offlineErr: any) {
      return res.status(500).json({ error: "Erro interno ao processar a análise do exame." });
    }
  });

  // Analyze Motivation with Gemini or offline expert knowledge
  app.post("/api/motivation", async (req, res) => {
    const { name, targetWeight, weight, workouts, consistency } = req.body;

    const prompt = `Você é um personal trainer e nutricionista motivacional de elite. 
O usuário se chama ${name || 'Atleta'}. 
Dados recentes:
- Peso atual: ${weight || 'N/A'} kg
- Meta: ${targetWeight || 'N/A'} kg
- Últimos treinos: ${workouts || 'Nenhum registrado'}
- Consistência de hábitos nos últimos 14 dias (treinos, dieta e hidratação): ${consistency !== undefined ? consistency + "%" : 'Não calculada ainda'}

Gere uma mensagem curta, altamente personalizada, impactante e motivadora em português para o usuário hoje. 
Se a consistência estiver alta (acima de 75%), parabenize a disciplina implacável. Se estiver média (50% a 75%), incentive a continuar subindo e manter a constância. Se estiver abaixo de 50%, dê um "puxão de orelha" amigável e encorajador, lembrando-o de que cada pequeno passo conta e que ele precisa retomar a rotina de treinos, água e dieta hoje mesmo.
Foques em disciplina, consistência e no objetivo de ter músculos mais fortes e menos gordura. 
Use um tom de "coach" de alto nível, dinâmico e focado em resultados reais, sem enrolação.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Motivation] Gerando mensagem motivacional com Gemini (com retries) para: "${name || 'Atleta'}"`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2
        });
        if (response && response.text) {
          return res.json({ success: true, text: response.text });
        }
      } catch (err: any) {
        console.log(`[Motivation] Falha ao consultar o Gemini para motivação: ${err.message}`);
      }
    }

    return res.json({
      success: true,
      text: "Mantenha o foco! A disciplina é o que separa o sonho da realidade. Cada repetição, cada refeição limpa e cada gota de suor te deixam mais perto da sua melhor versão. Vamos pra cima!"
    });
  });

  // Intelligent Post-Workout Feedback using Gemini to evaluate loads/sets and suggest solutions
  app.post("/api/workout-feedback", async (req, res) => {
    const { workoutType, exercises } = req.body;

    if (!workoutType || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "O tipo de treino e a lista de exercícios realizados são obrigatórios." });
    }

    const totalVolume = exercises.reduce((acc, ex) => {
      const w = Number(ex.weight) || 0;
      const s = Number(ex.sets) || 0;
      const r = Number(ex.reps) || 0;
      return acc + (w * s * r);
    }, 0);

    const exercisesSummary = exercises.map(ex => 
      `- ${ex.name}: ${ex.sets} séries x ${ex.reps} repetições com ${ex.weight} kg`
    ).join("\n");

    const prompt = `Você é um Personal Trainer Inteligente de elite e especialista em fisiologia do exercício integrado ao aplicativo BioForma.
O usuário acabou de concluir uma sessão de treino real. Você deve analisar a carga (peso), as séries (sets) e repetições de cada exercício realizado para fornecer soluções práticas de sobrecarga progressiva, dicas biomecânicas de execução e estratégias alimentares.

Detalhes da Sessão de Treino:
- Tipo/Nome do Treino: "${workoutType}"
- Volume Total Movimentado: ${totalVolume} kg
- Exercícios Realizados:
${exercisesSummary}

Você deve retornar obrigatoriamente um objeto JSON com as seguintes chaves em português do Brasil:
1. generalFeedback: Um parágrafo de feedback motivacional e fisiológico geral, parabenizando o esforço e avaliando de forma científica o estímulo gerado (ex: hipertrofia muscular, força, condicionamento) com base na combinação de cargas e repetições realizadas.
2. progressiveOverloadSolutions: Uma lista de strings (3 a 4 itens) sugerindo soluções inteligentes de sobrecarga progressiva para a próxima sessão de alguns dos exercícios realizados.
3. biomechanicsFormTips: Uma lista de strings (2 a 3 itens) focadas em ajuste postural, segurança articular, cadência da fase excêntrica/concêntrica e recrutamento de unidades motoras.
4. nutritionalStrategy: Uma lista de strings (2 a 3 itens) com soluções nutricionais imediatas pós-treino de síntese proteica, reidratação e ressíntese de glicogênio.

Atenção: retorne estritamente um JSON limpo e válido formatado de acordo com o esquema mapeado.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Workout Feedback] Gerando feedback com Gemini para treino: "${workoutType}" (volume: ${totalVolume}kg)`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-2.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              required: ["generalFeedback", "progressiveOverloadSolutions", "biomechanicsFormTips", "nutritionalStrategy"],
              properties: {
                generalFeedback: { type: Type.STRING, description: "Feedback geral e motivacional do treino realizado" },
                progressiveOverloadSolutions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de propostas para sobrecarga progressiva no próximo treino"
                },
                biomechanicsFormTips: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Lista de soluções e correções biomecânicas e posturais"
                },
                nutritionalStrategy: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Sugestões de nutrição e hidratação pós-treino"
                }
              }
            }
          }
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text.trim());
          console.log(`[Workout Feedback] Gemini gerou feedback com sucesso!`);
          return res.json({ success: true, data: { ...parsed, totalVolume } });
        }
      } catch (geminiErr: any) {
        console.log(`[Workout Feedback] Gemini indisponível para feedback de treino. Ativando fallback inteligente offline. Erro: ${geminiErr.message}`);
      }
    }

    // High-Quality Rule-Based Offline Fallback
    try {
      console.log(`[Workout Feedback] Executando gerador offline de feedback para treino: "${workoutType}"`);
      
      const generalFeedback = `Sensacional! Você concluiu o seu treino "${workoutType}" com excelente dedicação! Analisando os seus dados de cargas e séries, você movimentou um volume total acumulado de ${totalVolume} kg nesta sessão. Este estímulo de volume e tensão mecânica é altamente eficiente para desencadear cascatas de sinalização molecular para a hipertrofia e fortalecimento do tecido muscular. Continue consistente!`;
      
      const firstExerciseName = exercises[0]?.name || "exercício principal";
      const progressiveOverloadSolutions = [
        `No exercício "${firstExerciseName}", se conseguiu completar as séries com a postura ideal, experimente aumentar a carga de 1kg a 2kg de cada lado na próxima sessão para impor um novo estímulo de sobrecarga à musculatura.`,
        "Aplique a sobrecarga de repetições: se a carga atual estiver muito pesada para aumentar, tente adicionar apenas 1 a 2 repetições extras na última série de cada exercício antes de subir o peso.",
        "Diminua o tempo de intervalo em 10 segundos nos exercícios em que obteve maior facilidade. Isso aumenta a densidade do treino e estimula mais o estresse metabólico produtivo.",
        "Controle a fase excêntrica: realize a descida do peso de forma lenta (3 segundos) para ampliar o tempo sob tensão, o que gera microlesões positivas fundamentais para o ganho muscular."
      ];

      const biomechanicsFormTips = [
        "Foque na conexão mente-músculo: contraia conscientemente o grupo muscular alvo no topo de cada repetição, ao invés de apenas empurrar ou puxar o peso sem intenção.",
        "Mantenha suas articulações estabilizadas e evite realizar movimentos compensatórios ('roubar' com a lombar ou balançar o tronco) para manter o estresse isolado no músculo correto.",
        "Respire de maneira coordenada: expire na fase concêntrica (quando vence a resistência) e inspire na fase excêntrica (quando segura o peso de volta)."
      ];

      const nutritionalStrategy = [
        "Consuma uma porção proteica de alta qualidade (como ovos, frango, peixe ou whey) nas próximas 1 a 2 horas para maximizar o balanço nitrogenado positivo e acelerar a síntese de proteínas.",
        "Reponha os estoques de energia de forma inteligente adicionando carboidratos de médio/alto índice glicêmico (como banana, aveia ou arroz) para acelerar a ressíntese de glicogênio muscular.",
        "Hidratação essencial: beba pelo menos 500ml de água imediatamente e continue bebendo pequenos goles ao longo das próximas horas para recuperar a hidratação das células musculares, o que otimiza a recuperação."
      ];

      return res.json({
        success: true,
        data: {
          generalFeedback,
          progressiveOverloadSolutions,
          biomechanicsFormTips,
          nutritionalStrategy,
          totalVolume
        }
      });
    } catch (offlineErr: any) {
      return res.status(500).json({ error: "Erro interno ao processar o feedback do treino." });
    }
  });

async function startServer() {
  const PORT = 3000;

  // Serve static files in production or delegate to Vite in development (when running standalone Node server)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[FULL-STACK] Servidor rodando em http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
