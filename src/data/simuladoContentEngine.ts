// Engine de Conteúdo e Questões de Alta Densidade do Módulo Simulado
// Avaliação estrita de CONTEÚDO específico no padrão autêntico FUNECE / CEV-UECE
// Distratores altamente plausíveis, vocabulário acadêmico formal e zero duplicidade

export interface ContentQuestionTemplate {
  disciplineKeywords: string[];
  topicKeywords: string[];
  subtopicKeywords?: string[];
  question: string;
  alternatives: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topic: string;
  subtopic: string;
  difficulty: 'Fácil' | 'Média' | 'Difícil' | 'Avançado';
  skills: string[];
  commonMistake?: string;
  studyTip?: string;
}

export const SANITY_BANNED_PATTERNS = [
  /de acordo com a matriz (de referência )?do edital/gi,
  /segundo a matriz (de referência )?do edital/gi,
  /para fins de avaliação (na|pela) banca/gi,
  /sob o ponto de vista da comissão examinadora/gi,
  /segundo a (banca )?FUNECE/gi,
  /de acordo com a (banca )?FUNECE/gi,
  /na visão da (banca )?FUNECE/gi,
  /conforme os critérios da (banca )?FUNECE/gi,
  /o domínio dos fundamentos teóricos e práticos inerentes a/gi,
  /a caracterização de .* fundamenta-se em definições estáticas/gi,
  /fundamenta-se em princípios estáticos sem relação com os modelos/gi,
  /dispensa(m)? sustentação empírica ou dedução lógica/gi,
  /prescinde de análise sistemática dos seus elementos/gi,
  /sem qualquer embasamento científico/gi,
  /de forma puramente aleatória e sem fundamentação/gi
];

// Banco Curado de Questões de Conteúdo Real por Disciplinas e Subtópicos (Padrão FUNECE)
export const AUTHENTIC_CONTENT_QUESTION_BANK: ContentQuestionTemplate[] = [
  // ==========================================
  // LÍNGUA PORTUGUESA - SINTAXE E ANÁLISE LINGUÍSTICA
  // ==========================================
  {
    disciplineKeywords: ['português', 'portuguesa', 'letras', 'língua portuguesa'],
    topicKeywords: ['sintaxe', 'termo', 'oração', 'periodo', 'período', 'analise linguistica', 'análise linguística', 'estrutura da frase'],
    subtopicKeywords: ['sujeito', 'predicado', 'transitividade', 'objeto', 'complemento nominal', 'adjunto'],
    question: `Considere o período a seguir:\n\n*"Constatou-se a urgente necessidade de investimentos estruturais nas escolas públicas do interior."*\n\nEm conformidade com a norma-padrão da Língua Portuguesa e com as regras de análise sintática, assinale a afirmativa CORRETA:`,
    alternatives: [
      { letter: 'A', text: 'O termo "a urgente necessidade" exerce a função sintática de sujeito paciente do verbo constatar, uma vez que o verbo transitivo direto está apassivado pelo pronome "se".' },
      { letter: 'B', text: 'A partícula "se" atua como índice de indeterminação do sujeito, tornando a oração sem sujeito determinado e exigindo o verbo na terceira pessoa do singular.' },
      { letter: 'C', text: 'O termo "de investimentos estruturais" classifica-se sintaticamente como adjunto adnominal, pois expressa posse em relação ao substantivo abstrato antecedente.' },
      { letter: 'D', text: 'O termo "nas escolas públicas do interior" funciona como objeto indireto regido pela preposição "em", complementando o sentido do verbo constatar.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O verbo "constatar" é transitivo direto e está acompanhado da partícula apassivadora "se" (VTD + se = voz passiva sintética). Logo, o termo "a urgente necessidade" é o sujeito paciente ("A urgente necessidade foi constatada").\n- Análise dos Distratores:\n  * B) Incorreta. O "se" é pronome apassivador (partícula apassivadora), e não índice de indeterminação, pois o verbo é VTD.\n  * C) Incorreta. O termo "de investimentos estruturais" está ligado ao substantivo abstrato "necessidade" e possui valor paciente (os investimentos são necessitados), configurando Complemento Nominal, e não adjunto adnominal.\n  * D) Incorreta. O termo expressa circunstância de lugar, atuando como Adjunto Adverbial de Lugar.`,
    topic: 'Sintaxe da Oração e do Período',
    subtopic: 'Termos Integrantes e Transitividade Verbal',
    difficulty: 'Difícil',
    skills: ['Análise Sintática', 'Vozes Verbais', 'Termos da Oração']
  },
  {
    disciplineKeywords: ['português', 'portuguesa', 'letras', 'língua portuguesa'],
    topicKeywords: ['sintaxe', 'concordância', 'regência', 'crase', 'pontuação'],
    subtopicKeywords: ['concordância verbal', 'concordancia verbal', 'haver', 'fazer', 'impessoal'],
    question: `Analise a concordância verbal nas sentenças abaixo:\n\nI. Devem haver soluções viáveis para os problemas de infraestrutura escolar.\nII. Fazem dez anos que os investimentos foram aprovados pelo conselho.\nIII. Tratam-se de propostas inovadoras voltadas ao aprimoramento pedagógico.\nIV. Havia muitos candidatos inscritos no processo seletivo estadual.\n\nDe acordo com a norma-padrão da Língua Portuguesa, está plenamente CORRETA apenas a sentença:`,
    alternatives: [
      { letter: 'A', text: 'IV, apenas, pois o verbo "haver" no sentido de existir é impessoal e não flexiona para o plural.' },
      { letter: 'B', text: 'I e II, apenas, pois verbos que expressam tempo transcorrido ou existência concordam facultativamente com o substantivo plural que os acompanha.' },
      { letter: 'C', text: 'II e III, apenas, em virtude da presença de expressões quantitativas no predicado que atraem a flexão plural dos verbos.' },
      { letter: 'D', text: 'I, III e IV, pois a partícula "se" em orações passivas e as locuções verbais exigem pluralização automática dos núcleos verbais.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): Apenas a proposição IV está correta. O verbo "haver" no sentido de existir é impessoal e deve ficar na 3ª pessoa do singular ("Havia muitos candidatos").\n- Análise dos Distratores:\n  * I) Incorreta. Na locução com o verbo impessoal "haver" ("deve haver"), o verbo auxiliar "dever" herda a impessoalidade e deve permanecer no singular: "Deve haver soluções".\n  * II) Incorreta. O verbo "fazer" indicando tempo decorrido é impessoal, devendo ficar no singular: "Faz dez anos".\n  * III) Incorreta. O verbo "tratar-se" é transitivo indireto acompanhado de índice de indeterminação do sujeito "se", exigindo a 3ª pessoa do singular: "Trata-se de propostas".`,
    topic: 'Concordância Verbal e Nominal',
    subtopic: 'Verbos Impessoais e Concordância com Partícula SE',
    difficulty: 'Difícil',
    skills: ['Concordância Verbal', 'Sintaxe Normativa']
  },
  {
    disciplineKeywords: ['português', 'portuguesa', 'letras', 'língua portuguesa'],
    topicKeywords: ['sintaxe', 'orações', 'período composto', 'subordinação', 'conectivos', 'conjunção'],
    subtopicKeywords: ['oração subordinada', 'conjunções', 'valor semântico'],
    question: `No período: *"Conquanto houvesse restrições orçamentárias expressivas, a comissão executou o cronograma de formação continuada."*, a oração destacada expressa relação semântica de:`,
    alternatives: [
      { letter: 'A', text: 'Concessão, estabelecendo uma quebra de expectativa ou contraste que não impede a ação principal.' },
      { letter: 'B', text: 'Causa, explicitando o motivo determinante que impulsionou a execução integral do cronograma orçamentário.' },
      { letter: 'C', text: 'Condição, impondo uma exigência circunstancial prévia indispensável para a realização da formação docente.' },
      { letter: 'D', text: 'Conformidade, alinhando a prática pedagógica às diretrizes orçamentárias estabelecidas pela comissão.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O conectivo "conquanto" é uma conjunção subordinativa concessiva (equivalente a "embora", "ainda que", "posto que"), introduzindo uma oração subordinada adverbial concessiva que indica um fato contrário que não impede o desfecho da oração principal.\n- Análise dos Distratores:\n  * B) Causa seria introduzida por conectivos como "porque", "já que", "visto que".\n  * C) Condição seria introduzida por "se", "caso", "desde que".\n  * D) Conformidade seria introduzida por "conforme", "segundo", "consoante".`,
    topic: 'Período Composto por Subordinação',
    subtopic: 'Orações Subordinadas Adverbiais e Conjunções',
    difficulty: 'Média',
    skills: ['Semântica Conectiva', 'Orações Adverbiais']
  },
  {
    disciplineKeywords: ['português', 'portuguesa', 'letras', 'língua portuguesa'],
    topicKeywords: ['regência', 'crase', 'sintaxe'],
    subtopicKeywords: ['regência verbal', 'uso do acento grave', 'crase'],
    question: `No que tange à regência dos verbos e ao emprego do acento indicativo de crase, assinale a opção que atende integralmente à norma-padrão da Língua Portuguesa:`,
    alternatives: [
      { letter: 'A', text: 'O professor aspirava a uma vaga no concurso e sempre visava ao aprimoramento contínuo de suas práticas docentes.' },
      { letter: 'B', text: 'O professor aspirava uma vaga no concurso e sempre visava o aprimoramento contínuo de suas práticas docentes.' },
      { letter: 'C', text: 'O relatório que os fiscais assistiram continha críticas severas às quais a diretoria foi obrigada à responder.' },
      { letter: 'D', text: 'O projeto implicará em reformulações curriculares profundas que todos os docentes devem obedecer cegamente.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O verbo 'aspirar' no sentido de desejar/almejar é VTI e rege a preposição 'a' ('aspirava a uma vaga'). O verbo 'visar' no sentido de ter como meta/objetivo também é VTI e rege 'a' ('visava ao aprimoramento').\n- Análise dos Distratores:\n  * B) 'Aspirar' e 'visar' no sentido de desejar exigem preposição 'a'.\n  * C) O verbo 'assistir' no sentido de presenciar é VTI ('a que assistiram'); não ocorre crase antes de verbo ('a responder').\n  * D) O verbo 'implicar' no sentido de acarretar é VTD (não admite 'em'); 'obedecer' é VTI ('a que todos devem obedecer').`,
    topic: 'Regência Verbal e Nominal',
    subtopic: 'Transitividade de Verbos Especiais e Crase',
    difficulty: 'Difícil',
    skills: ['Regência Verbal', 'Crase']
  },

  // ==========================================
  // BIOLOGIA - CELULAR, GENÉTICA, FISIOLOGIA, ECOLOGIA
  // ==========================================
  {
    disciplineKeywords: ['biologia', 'ciências biológicas'],
    topicKeywords: ['identidade dos seres vivos', 'célula', 'aspectos físicos', 'químicos e estruturais da célula', 'membrana'],
    subtopicKeywords: ['membrana plasmática', 'mosaico fluido', 'transporte', 'osmose', 'lipídios'],
    question: `A membrana plasmática opera segundo o modelo do Mosaico Fluido, apresentando uma bicamada fosfolipídica anfipática com proteínas integradas e periféricas. A respeito dos fatores que modulam a fluidez e a permeabilidade seletiva da membrana celular, assinale a afirmativa CORRETA:`,
    alternatives: [
      { letter: 'A', text: 'O colesterol atua como um regulador bidirecional da fluidez: em altas temperaturas restringe a mobilidade fosfolipídica excessiva e em baixas temperaturas impede o empacotamento compacto das caudas de ácidos graxos.' },
      { letter: 'B', text: 'A presença de ácidos graxos saturados com duplas ligações cis aumenta significativamente o espaço intermolecular, elevando a fluidez da membrana em baixas temperaturas.' },
      { letter: 'C', text: 'O transporte ativo primário consome o gradiente eletroquímico gerado por carreadores secundários sem hidrólise direta de trifosfato de adenosina (ATP).' },
      { letter: 'D', text: 'Gases apolares como O₂ e CO₂ dependem obrigatoriamente de proteínas transmembrana carreadoras (permeases) para atravessar a bicamada lipídica.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O colesterol em células animais é um modulador térmico anfipático de fluidez: em altas temperaturas, seus anéis esteroides rígidos reduzem a movimentação e a fluidez excessiva; em baixas temperaturas, sua intercalação impede a cristalização das caudas fosfolipídicas.\n- Análise dos Distratores:\n  * B) Incorreta. Ácidos graxos insaturados (e não saturados) possuem duplas ligações cis que causam dobras e aumentam a fluidez.\n  * C) Incorreta. O transporte ativo primário consome ATP diretamente no sítio catalítico (ex: Bomba de Na+/K+ ATPase).\n  * D) Incorreta. Gases apolares (O₂ e CO₂) atravessam livremente a bicamada lipídica por difusão simples.`,
    topic: 'Identidade dos Seres Vivos',
    subtopic: 'Aspectos Físicos, Químicos e Estruturais da Célula',
    difficulty: 'Avançado',
    skills: ['Biologia Celular', 'Biofísica de Membranas', 'Fisiologia Celular']
  },
  {
    disciplineKeywords: ['biologia', 'ciências biológicas'],
    topicKeywords: ['organelas', 'funções celulares', 'bioenergética', 'respiração celular', 'fotossíntese'],
    subtopicKeywords: ['mitocôndria', 'cloroplasto', 'fosforilação oxidativa', 'complexo de golgi'],
    question: `Durante o processo de respiração celular aeróbia em eucariontes, a síntese de ATP pela ATP sintase na fosforilação oxidativa é impulsionada diretamente por:`,
    alternatives: [
      { letter: 'A', text: 'Um gradiente eletroquímico de prótons (H⁺) gerado pelo bombeamento ativo de elétrons através dos complexos da cadeia respiratória para o espaço intermembranas.' },
      { letter: 'B', text: 'A hidrólise direta do ácido cítrico no ciclo de Krebs no interior da matriz mitocondrial catalisada por quinases específicas.' },
      { letter: 'C', text: 'A transferência direta do grupo fosfato do fosfoenolpiruvato durante a glicólise anaeróbia no citosol.' },
      { letter: 'D', text: 'O consumo de oxigênio molecular na matriz mitocondrial atuando como doador primário de prótons para a ATP sintase.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A hipótese quimiosmótica de Mitchell estabelece que o transporte de elétrons pela cadeia respiratória promove o bombeamento de prótons (H⁺) da matriz para o espaço intermembranas. O retorno desses prótons a favor do gradiente via ATP sintase aciona a rotação mecânica da enzima e a fosforilação de ADP em ATP.\n- Análise dos Distratores:\n  * B) O ciclo de Krebs produz NADH, FADH₂ e GTP por fosforilação em nível de substrato, mas não impulsiona diretamente a ATP sintase.\n  * C) A glicólise citosólica gera apenas 2 ATP líquidos por fosforilação em nível de substrato.\n  * D) O oxigênio é o aceptor FINAL (e não doador inicial) de elétrons e prótons, formando água (H₂O).`,
    topic: 'Funções Celulares e Bioenergética',
    subtopic: 'Respiração Celular e Fosforilação Oxidativa',
    difficulty: 'Difícil',
    skills: ['Bioquímica Celular', 'Metabolismo Energético']
  },
  {
    disciplineKeywords: ['biologia', 'ciências biológicas'],
    topicKeywords: ['enzimas', 'bioquímica', 'cinética enzimática', 'metabolismo'],
    subtopicKeywords: ['inibição enzimática', 'km', 'vmax', 'sítio ativo'],
    question: `No estudo da cinética enzimática segundo o modelo de Michaelis-Menten, um inibidor competitivo caracteriza-se por:`,
    alternatives: [
      { letter: 'A', text: 'Ligar-se reversivelmente ao sítio ativo da enzima livre, aumentando o valor da constante $K_m$ aparente sem alterar a velocidade máxima ($V_{\\max}$) em saturação de substrato.' },
      { letter: 'B', text: 'Ligar-se irreversivelmente a um sítio alostérico distante, reduzindo drasticamente a $V_{\\max}$ sem modificar a afinidade ($K_m$) da enzima pelo substrato.' },
      { letter: 'C', text: 'Interagir exclusivamente com o complexo enzima-substrato (ES), diminuindo simultaneamente tanto o $K_m$ aparente quanto a $V_{\\max}$.' },
      { letter: 'D', text: 'Promover a desnaturação térmica da cadeia polipeptídica terciária por quebra de pontes dissulfeto na fenda catalítica.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O inibidor competitivo compete diretamente com o substrato pelo mesmo sítio ativo. Com isso, é necessária uma concentração maior de substrato para atingir metade da velocidade máxima (aumentando o $K_m$ aparente), mas com excesso de substrato o inibidor é deslocado e a $V_{\\max}$ original é alcançada.\n- Análise dos Distratores:\n  * B) Descreve inibição não-competitiva (ou alostérica).\n  * C) Descreve inibição incompetitiva (ou acompetitiva).\n  * D) Descreve desnaturação proteica geral.`,
    topic: 'Identidade dos Seres Vivos',
    subtopic: 'Bioquímica e Cinética Enzimática',
    difficulty: 'Avançado',
    skills: ['Bioquímica', 'Cinética Enzimática']
  },
  {
    disciplineKeywords: ['biologia', 'ciências biológicas'],
    topicKeywords: ['transmissão da vida', 'genética', 'mendel', 'hereditariedade', 'código genético'],
    subtopicKeywords: ['primeira lei', 'segunda lei', 'probabilidade genética', 'ligamento gênico'],
    question: `Em um cruzamento entre dois indivíduos heterozigotos para dois pares de alelos com segregação independente ($AaBb \\times AaBb$), a probabilidade de se obter um descendente com genótipo duplamente homozigoto recessivo ($aabb$) ou homozigoto dominante para ambos os locos ($AABB$) é de:`,
    alternatives: [
      { letter: 'A', text: '2/16 (ou 1/8).' },
      { letter: 'B', text: '1/16.' },
      { letter: 'C', text: '4/16 (ou 1/4).' },
      { letter: 'D', text: '9/16.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): Para cada par heterozigoto ($Aa \\times Aa$), a chance de $AA$ é $1/4$ e de $aa$ é $1/4$. Sendo segregação independente (Segunda Lei de Mendel):\n  * $P(AABB) = P(AA) \\times P(BB) = 1/4 \\times 1/4 = 1/16$.\n  * $P(aabb) = P(aa) \\times P(bb) = 1/4 \\times 1/4 = 1/16$.\n  * Como são eventos mutuamente exclusivos (regra do OU): $1/16 + 1/16 = 2/16 = 1/8$.\n- Análise dos Distratores:\n  * B) 1/16 corresponde apenas à probabilidade de um dos genótipos isoladamente.\n  * C) 4/16 corresponderia aos duplamente heterozigotos ($AaBb$).\n  * D) 9/16 é a proporção fenotípica dominante dupla ($A\\_B\\_$).`,
    topic: 'Transmissão da Vida e Genética',
    subtopic: 'Segunda Lei de Mendel e Cálculos de Probabilidade',
    difficulty: 'Difícil',
    skills: ['Genética Clássica', 'Probabilidade Genética']
  },
  {
    disciplineKeywords: ['biologia', 'ciências biológicas'],
    topicKeywords: ['ecologia', 'populações', 'comunidades', 'ecossistemas', 'ciclos biogeoquímicos'],
    subtopicKeywords: ['ciclo do nitrogênio', 'fixação', 'nitrificação', 'desnitrificação'],
    question: `No ciclo biogeoquímico do nitrogênio, a conversão microbiológica de amônia ($NH_3$ / $NH_4^+$) em nitrato ($NO_3^-$) ocorre em duas etapas oxidativas sucessivas denominadas:`,
    alternatives: [
      { letter: 'A', text: 'Nitrosação (por bactérias do gênero *Nitrosomonas*) seguida de Nitratação (por bactérias do gênero *Nitrobacter*).' },
      { letter: 'B', text: 'Amonificação (por fungos saprófitos) seguida de Desnitrificação (por bactérias anaeróbias estritas).' },
      { letter: 'C', text: 'Fixação biológica (por cianobactérias) seguida de Hidrólise proteica (por actinomicetos).' },
      { letter: 'D', text: 'Desaminação oxidativa (por protozoários ciliados) seguida de Redução anaeróbia de nitritos.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A nitrificação é um processo quimiossintetizante aeróbio realizado em duas etapas:\n  1. Nitrosação: $2NH_3 + 3O_2 \\rightarrow 2NO_2^- + 2H^+ + 2H_2O$ (*Nitrosomonas* / *Nitrosococcus*).\n  2. Nitratação: $2NO_2^- + O_2 \\rightarrow 2NO_3^-$ (*Nitrobacter*).\n- Análise dos Distratores:\n  * B) Amonificação é a decomposição de matéria orgânica gerando amônia; Desnitrificação converte nitrato em $N_2$ gasoso.\n  * C) Fixação biológica converte $N_2$ atmosférico em amônia.\n  * D) Desaminação remove grupos amina de aminoácidos.`,
    topic: 'Ecologia e Meio Ambiente',
    subtopic: 'Ciclos Biogeoquímicos e Dinâmica do Nitrogênio',
    difficulty: 'Difícil',
    skills: ['Ecologia', 'Microbiologia', 'Ciclos Biogeoquímicos']
  },

  // ==========================================
  // MATEMÁTICA
  // ==========================================
  {
    disciplineKeywords: ['matemática', 'matematica'],
    topicKeywords: ['funções', 'álgebra', 'geometria', 'trigonometria', 'análise combinatória', 'probabilidade'],
    subtopicKeywords: ['função quadrática', 'máximo e mínimo', 'vértice da parábola'],
    question: `Considere a função quadrática $f(x) = -2x^2 + 12x - 10$, definida para todo $x \\in \\mathbb{R}$. As coordenadas do vértice $V(x_v, y_v)$ da parábola e o valor máximo atingido pela função são, respectivamente:`,
    alternatives: [
      { letter: 'A', text: '$V(3, 8)$ e valor máximo igual a $8$.' },
      { letter: 'B', text: '$V(3, -10)$ e valor máximo igual a $-10$.' },
      { letter: 'C', text: '$V(-3, 8)$ e valor mínimo igual a $8$.' },
      { letter: 'D', text: '$V(6, 16)$ e valor máximo igual a $16$.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): Para a função $f(x) = ax^2 + bx + c$ com $a = -2, b = 12, c = -10$:\n  * $x_v = \\frac{-b}{2a} = \\frac{-12}{2(-2)} = \\frac{-12}{-4} = 3$.\n  * $y_v = f(3) = -2(3)^2 + 12(3) - 10 = -2(9) + 36 - 10 = -18 + 36 - 10 = 8$.\n  * Como $a = -2 < 0$, a concavidade é voltada para baixo, logo o vértice representa o ponto de MÁXIMO da função, cujo valor máximo é $y_v = 8$.\n- Análise dos Distratores:\n  * B) Incorreta. Erro no cálculo de $y_v$ utilizando o termo independente $c$.\n  * C) Incorreta. Erro no sinal de $x_v$ e na classificação (é ponto de máximo, não mínimo).\n  * D) Incorreta. Omissão da divisão por $2a$ na fórmula do vértice.`,
    topic: 'Funções e Álgebra',
    subtopic: 'Função Quadrática e Otimização',
    difficulty: 'Média',
    skills: ['Álgebra', 'Função Quadrática', 'Cálculo de Vértice']
  },
  {
    disciplineKeywords: ['matemática', 'matematica'],
    topicKeywords: ['combinatória', 'análise combinatória', 'probabilidade', 'contagem'],
    subtopicKeywords: ['combinação simples', 'permutação', 'arranjo'],
    question: `Um comitê pedagógico formado por 4 professores será escolhido a partir de um grupo composto por 6 professores de Ciências da Natureza e 5 professores de Ciências Humanas. Sabendo que o comitê deve conter obrigatoriamente exatamente 2 professores de Ciências da Natureza e 2 professores de Ciências Humanas, o número total de comissões distintas que podem ser formadas é igual a:`,
    alternatives: [
      { letter: 'A', text: '150.' },
      { letter: 'B', text: '330.' },
      { letter: 'C', text: '75.' },
      { letter: 'D', text: '180.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A ordem dos membros não importa (combinação simples):\n  * Escolha dos 2 professores de Natureza entre 6: $C(6, 2) = \\frac{6 \\times 5}{2 \\times 1} = 15$.\n  * Escolha dos 2 professores de Humanas entre 5: $C(5, 2) = \\frac{5 \\times 4}{2 \\times 1} = 10$.\n  * Pelo Princípio Fundamental da Contagem (regra do produto): $15 \\times 10 = 150$.\n- Análise dos Distratores:\n  * B) 330 é $C(11, 4)$, ou seja, todas as combinações de 4 membros sem restrição de área.\n  * C) 75 é metade de 150 (erro por divisão indevida por 2).\n  * D) 180 é resultado de confusão com arranjos parciais.`,
    topic: 'Análise Combinatória e Probabilidade',
    subtopic: 'Combinação Simples e Princípio Fundamental da Contagem',
    difficulty: 'Média',
    skills: ['Análise Combinatória', 'Resolução de Problemas']
  },

  // ==========================================
  // HISTÓRIA
  // ==========================================
  {
    disciplineKeywords: ['história', 'historia'],
    topicKeywords: ['história do ceará', 'brasil colônia', 'brasil império', 'brasil república'],
    subtopicKeywords: ['confederação do equador', 'revoltas provinciais', 'movimentos emancipacionistas'],
    question: `A Confederação do Equador (1824), movimento republicano e separatista deflagrado em Pernambuco com expressiva adesão no Ceará, teve como um dos seus principais fatores desencadeadores:`,
    alternatives: [
      { letter: 'A', text: 'A dissolução autoritária da Assembleia Constituinte de 1823 por D. Pedro I e a outorga da Constituição de 1824 com a instituição do Poder Moderador.' },
      { letter: 'B', text: 'A decretação da Lei de Terras de 1850 que inviabilizou a posse camponesa nas províncias do Norte e centralizou as sesmarias.' },
      { letter: 'C', text: 'A invasão holandesa no Nordeste açucareiro e a imposição da cobrança de impostos confiscatórios pela Companhia das Índias Ocidentais.' },
      { letter: 'D', text: 'A eclosão da Guerra dos Emboabas e o controle monopolista das rotas de gado pelo sertão cearense.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A 'Noite da Agonia' (fechamento da Constituinte em 1823) e a imposição centralizadora da Carta de 1824 com o Poder Moderador geraram forte descontentamento nas províncias nordestinas, levando líderes como Frei Caneca (PE) e Tristão de Alencar Araripe (CE) a proclamarem a Confederação do Equador.\n- Análise dos Distratores:\n  * B) A Lei de Terras é de 1850 (Segundo Reinado), período muito posterior.\n  * C) As invasões holandesas ocorreram no século XVII (1630-1654).\n  * D) A Guerra dos Emboabas ocorreu em Minas Gerais (1707-1709) no contexto da mineração.`,
    topic: 'Brasil Império e História do Ceará',
    subtopic: 'Confederação do Equador e Movimentos Liberais',
    difficulty: 'Difícil',
    skills: ['Historiografia Brasileira', 'História Regional do Ceará']
  },

  // ==========================================
  // GEOGRAFIA
  // ==========================================
  {
    disciplineKeywords: ['geografia'],
    topicKeywords: ['geografia do ceará', 'domínios morfoclimáticos', 'caatinga', 'semiárido'],
    subtopicKeywords: ['semiárido cearense', 'relevo', 'depressão sertaneja', 'bacias hidrográficas'],
    question: `No que se refere ao quadro natural do Ceará e ao domínio das Caatingas / Semiárido nordestino, a Depressão Sertaneja é caracterizada por:`,
    alternatives: [
      { letter: 'A', text: 'Superfícies rebaixadas esculpidas sobre o embasamento cristalino pré-cambriano, com solos rasos e pedregosos (litólicos) e drenagem intermitente dominada por rios temporários.' },
      { letter: 'B', text: 'Extensos planaltos sedimentares úmidos recobertos por florestas latifoliadas perenes alimentadas por aquíferos freáticos profundos.' },
      { letter: 'C', text: 'Vales profundos de origem vulcânica recente com intensa atividade sísmica e drenagem perene permanente.' },
      { letter: 'D', text: 'Planícies costeiras formadas exclusivamente por cordões arenosos holocênicos sob influência direta do clima equatorial superúmido.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A Depressão Sertaneja corresponde à unidade geomorfológica predominante no Ceará, modelada sobre o embasamento cristalino, marcada por intemperismo predominantemente físico, solos pouco profundos e rios com regime intermitente/temporário.\n- Análise dos Distratores:\n  * B) Descreve os maciços residuais úmidos (brejos de altitude como Baturité e Ibiapaba), não a Depressão Sertaneja.\n  * C) O relevo cearense é geologicamente estável e antigo, sem vulcanismo recente.\n  * D) Descreve a faixa litorânea litorânea/costeira.`,
    topic: 'Geografia do Ceará e Domínios Morfoclimáticos',
    subtopic: 'Depressão Sertaneja e Recursos Hídricos no Semiárido',
    difficulty: 'Difícil',
    skills: ['Geomorfologia', 'Climatologia Regional']
  },

  // ==========================================
  // EDUCAÇÃO BRASILEIRA, DIDÁTICA E LEGISLAÇÃO
  // ==========================================
  {
    disciplineKeywords: ['educação brasileira', 'didática', 'pedagogia', 'conhecimentos pedagógicos'],
    topicKeywords: ['tendências pedagógicas', 'trabalho pedagógico', 'planejamento', 'avaliação'],
    subtopicKeywords: ['histórico-crítica', 'saviani', 'libâneo', 'avaliação formativa'],
    question: `Na concepção da Pedagogia Histórico-Crítica formulada por Dermeval Saviani, a prática pedagógica escolar é estruturada em torno de:`,
    alternatives: [
      { letter: 'A', text: 'Um movimento dialético que parte da Prática Social Inicial, passa pela Problematização, Instrumentalização e Catarse, culminando na Prática Social Final qualificada.' },
      { letter: 'B', text: 'Um modelo comportamentalista baseado em estímulo-resposta e reforçamento programado para condicionamento de condutas operacionais.' },
      { letter: 'C', text: 'Uma metodologia puramente não-diretiva centrada exclusivamente nos interesses espontâneos da criança sem a mediação do saber científico sistematizado.' },
      { letter: 'D', text: 'Uma transmissão enciclopédica estática e descontextualizada dos conteúdos clássicos por meio da memorização mnemônica.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): A Pedagogia Histórico-Crítica de Saviani organiza os 5 passos metodológicos dialéticos: 1. Prática Social Inicial; 2. Problematização; 3. Instrumentalização (apropriação dos instrumentos culturais/científicos); 4. Catarse (incorporação crítica do saber); 5. Prática Social Final transformada.\n- Análise dos Distratores:\n  * B) Descreve a Tendência Liberal Tecnicista (Behaviorismo de Skinner).\n  * C) Descreve a Tendência Liberal Renovada Não-Diretiva (Carl Rogers).\n  * D) Descreve a Tendência Liberal Tradicional.`,
    topic: 'Tendências Pedagógicas na Educação Brasileira',
    subtopic: 'Pedagogia Histórico-Crítica e Mediação Didática',
    difficulty: 'Avançado',
    skills: ['Teoria Pedagógica', 'Didática Fundamental']
  },
  {
    disciplineKeywords: ['administração pública', 'legislação', 'conhecimentos básicos'],
    topicKeywords: ['ldb', 'lei 9394/96', 'constituição federal', 'gestão democrática'],
    subtopicKeywords: ['artigo 3', 'artigo 13', 'artigo 14', 'princípios do ensino'],
    question: `De acordo com o Artigo 13 da Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/1996), constitui incumbência legal expressa dos docentes nos estabelecimentos de ensino:`,
    alternatives: [
      { letter: 'A', text: 'Participar da elaboração da proposta pedagógica do estabelecimento de ensino e zelar pela aprendizagem dos alunos, estabelecendo estratégias de recuperação para os de menor rendimento.' },
      { letter: 'B', text: 'Fixar unilateralmente o calendário letivo estadual e deliberar sobre as diretrizes orçamentárias do fundo de manutenção escolar.' },
      { letter: 'C', text: 'Homologar o Plano Estadual de Educação e determinar a abertura de novas unidades escolares no sistema municipal.' },
      { letter: 'D', text: 'Exercer com exclusividade a auditoria contábil dos recursos do FUNDEB no âmbito do conselho tutelar.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O Artigo 13 da LDB nº 9.394/96 estabelece expressamente como incumbência dos docentes: 'I - participar da elaboração da proposta pedagógica do estabelecimento de ensino; II - elaborar e cumprir plano de trabalho (...); III - zelar pela aprendizagem dos alunos; IV - estabelecer estratégias de recuperação para os alunos de menor rendimento'.\n- Análise dos Distratores:\n  * B, C e D) Referem-se a competências exclusivas dos órgãos executivos, conselhos de educação ou sistemas de ensino, e não ao corpo docente.`,
    topic: 'Legislação da Educação Básica',
    subtopic: 'Incumbências Docentes e Organização Escolar na LDB',
    difficulty: 'Média',
    skills: ['Legislação Educacional', 'LDB 9.394/96']
  },
  {
    disciplineKeywords: ['dados e indicadores educacionais', 'leitura e interpretação de dados'],
    topicKeywords: ['spaece', 'ideb', 'censo escolar', 'indicadores'],
    subtopicKeywords: ['escala de proficiência', 'padrões de desempenho', 'fluxo escolar'],
    question: `No Sistema Permanente de Avaliação da Educação Básica do Ceará (SPAECE), os resultados de proficiência dos estudantes do Ensino Médio em Língua Portuguesa e Matemática são categorizados em quatro Padrões de Desempenho. A escala correta, do nível mais básico ao mais consolidado, é:`,
    alternatives: [
      { letter: 'A', text: 'Muito Crítico, Crítico, Intermediário e Adequado.' },
      { letter: 'B', text: 'Insuficiente, Básico, Proficiente e Avançado.' },
      { letter: 'C', text: 'Nulo, Regular, Bom e Excelente.' },
      { letter: 'D', text: 'Em Desenvolvimento, Parcial, Satisfatório e Pleno.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- Alternativa A (Correta): O SPAECE adota oficialmente os quatro níveis de padrões de desempenho: 1. Muito Crítico; 2. Crítico; 3. Intermediário; 4. Adequado. Essa categorização orienta as políticas pedagógicas e o cálculo do Índice de Desempenho Escolar do Ceará.\n- Análise dos Distratores:\n  * B) 'Insuficiente, Básico, Proficiente e Avançado' é a nomenclatura utilizada pelo SARESP (São Paulo) e SAEB.\n  * C e D) São escalas descritivas genéricas não adotadas pela SEDUC-CE / CAEd.`,
    topic: 'Indicadores Educacionais e Avaliação Externa',
    subtopic: 'Padrões de Desempenho e Metodologia SPAECE',
    difficulty: 'Difícil',
    skills: ['SPAECE', 'Indicadores Educacionais do Ceará']
  }
];

// Utilitário de Embaralhamento de Alternativas (Garante que o gabarito A, B, C, D seja uniformemente distribuído)
export function shuffleQuestionOptions(
  alternatives: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[],
  correctAnswer: 'A' | 'B' | 'C' | 'D',
  explanation: string
): {
  shuffledAlternatives: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  newCorrectAnswer: 'A' | 'B' | 'C' | 'D';
  updatedExplanation: string;
} {
  const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const correctObj = alternatives.find(a => (a.letter || '').toUpperCase() === correctAnswer.toUpperCase()) || alternatives[0];

  // Create cloned array and shuffle using Fisher-Yates with random offset
  const cloned = [...alternatives];
  for (let i = cloned.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  let newCorrectAnswer: 'A' | 'B' | 'C' | 'D' = 'A';
  const shuffledAlternatives = cloned.map((opt, idx) => {
    const assignedLetter = letters[idx];
    if (opt === correctObj || opt.text === correctObj.text) {
      newCorrectAnswer = assignedLetter;
    }
    return {
      letter: assignedLetter,
      text: opt.text
    };
  });

  // Re-align explanation header if it had hardcoded Gabarito: A / B / C / D
  let updatedExplanation = explanation;
  if (updatedExplanation) {
    updatedExplanation = updatedExplanation
      .replace(/Gabarito:\s*[A-D]/i, `Gabarito: ${newCorrectAnswer}`)
      .replace(/Alternativa\s+[A-D]\s+\(Correta\)/i, `Alternativa ${newCorrectAnswer} (Correta)`);
  }

  return {
    shuffledAlternatives,
    newCorrectAnswer,
    updatedExplanation
  };
}

// Sanitizer & Validator de Questões com Refinamento Estrito FUNECE
export function sanitizeSimuladoQuestion(q: any, fallbackTopic: string, fallbackSubtopic: string): any {
  if (!q) return null;

  let cleanedQuestionText = (q.question || q.questionText || '').trim();
  let cleanedExplanation = (q.explanation || '').trim();

  // Remove banned meta-phrases from question text and explanation
  SANITY_BANNED_PATTERNS.forEach(pat => {
    cleanedQuestionText = cleanedQuestionText.replace(pat, '').trim();
    cleanedExplanation = cleanedExplanation.replace(pat, '').trim();
  });

  // Ensure options is an array of 4 letters
  const rawAlternatives = Array.isArray(q.alternatives) ? q.alternatives : (Array.isArray(q.options) ? q.options : []);
  const validLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  const normalizedAlternatives = validLetters.map((letter, idx) => {
    const found = rawAlternatives.find((a: any) => (a.letter || '').toUpperCase() === letter) || rawAlternatives[idx];
    let altText = typeof found === 'string' ? found : (found?.text || `Opção ${letter} fundamentada nos preceitos do assunto.`);
    SANITY_BANNED_PATTERNS.forEach(pat => {
      altText = altText.replace(pat, '').trim();
    });
    return {
      letter,
      text: altText
    };
  });

  let rawCorrect = (q.correctAnswer || 'A').toUpperCase().trim();
  if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
    rawCorrect = 'A';
  }

  // Shuffle alternatives to ensure perfectly balanced distribution of correct answers across A, B, C, D
  const { shuffledAlternatives, newCorrectAnswer, updatedExplanation } = shuffleQuestionOptions(
    normalizedAlternatives,
    rawCorrect as 'A' | 'B' | 'C' | 'D',
    cleanedExplanation
  );

  const topicName = (q.topic || fallbackTopic || 'Conhecimentos do Edital')
    .replace(/^[\d\.\-\s\)\(]+/, '')
    .trim();
  const subtopicName = (q.subtopic || fallbackSubtopic || topicName)
    .replace(/^[\d\.\-\s\)\(]+/, '')
    .trim();

  return {
    question: cleanedQuestionText,
    questionText: cleanedQuestionText,
    alternatives: shuffledAlternatives,
    options: shuffledAlternatives,
    correctAnswer: newCorrectAnswer,
    explanation: updatedExplanation || `Gabarito: ${newCorrectAnswer}\n\nGabarito Comentado:\n- A alternativa ${newCorrectAnswer} está correta do ponto de vista do conteúdo científico do subtópico.\n- As demais alternativas apresentam incorreções conceituais ou contradições teóricas.`,
    topic: topicName,
    subtopic: subtopicName,
    difficulty: q.difficulty || 'Difícil',
    banca: q.banca || 'FUNECE / CEV-UECE',
    skills: Array.isArray(q.skills) && q.skills.length > 0 ? q.skills : ['Domínio Científico do Conteúdo', 'Análise Conceitual', 'Rigor FUNECE'],
    commonMistake: q.commonMistake || 'Atenção às distinções conceituais sutis e termos técnicos nas alternativas.',
    studyTip: q.studyTip || 'Revise a teoria aprofundada e resolva exercícios com distratores complexos.'
  };
}

// Compute semantic fingerprint to detect conceptual duplicate questions
export function computeQuestionSemanticHash(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['sobre', 'acerca', 'assinale', 'alternativa', 'correta', 'incorreta', 'texto', 'abaixo', 'conforme', 'considerando', 'respeito', 'termo', 'opcao', 'proposicao', 'questão', 'questao'].includes(w))
    .slice(0, 10)
    .sort()
    .join('_');
}

// Check semantic duplicate against existing questions
export function isSemanticDuplicate(questionText: string, seenQuestionList: string[]): boolean {
  if (!questionText || !Array.isArray(seenQuestionList) || seenQuestionList.length === 0) return false;
  const targetHash = computeQuestionSemanticHash(questionText);
  if (!targetHash) return false;

  for (const seen of seenQuestionList) {
    const seenHash = computeQuestionSemanticHash(seen);
    if (targetHash === seenHash) return true;
    // Check heavy substring overlap
    if (seen.length > 35 && questionText.length > 35) {
      const s1 = questionText.substring(0, 50).toLowerCase();
      const s2 = seen.substring(0, 50).toLowerCase();
      if (s1 === s2) return true;
    }
  }
  return false;
}

// Gerador de Fallback Especializado por Disciplina com 100% de Rigor e Zero Meta-Texto
export function generateCuratedFallbackForTopic(
  discipline: string,
  topicName: string,
  subtopicName: string,
  index: number = 0,
  seenTexts: string[] = []
): ContentQuestionTemplate {
  const normDisc = (discipline || '').toLowerCase();
  const normTop = (topicName || '').toLowerCase();
  const normSub = (subtopicName || topicName || '').toLowerCase();

  // Search curated bank for best match that hasn't been seen
  const candidates = AUTHENTIC_CONTENT_QUESTION_BANK.filter(item => {
    const discMatch = item.disciplineKeywords.some(k => normDisc.includes(k) || normTop.includes(k));
    const topMatch = item.topicKeywords.some(k => normTop.includes(k) || normSub.includes(k));
    const subMatch = item.subtopicKeywords ? item.subtopicKeywords.some(k => normSub.includes(k)) : true;
    return (discMatch && (topMatch || subMatch)) || topMatch;
  });

  const unseenCandidate = candidates.find(c => !isSemanticDuplicate(c.question, seenTexts));
  if (unseenCandidate) {
    return unseenCandidate;
  }

  if (candidates.length > 0) {
    return candidates[index % candidates.length];
  }

  // If no direct template, build a dedicated question with high-density distractors based on discipline area
  if (normDisc.includes('português') || normDisc.includes('língua') || normDisc.includes('letras')) {
    return {
      disciplineKeywords: ['português'],
      topicKeywords: ['sintaxe'],
      question: `Considere o período a seguir:\n\n*"Constatou-se a imperiosa necessidade de reformulação dos critérios avaliativos nas escolas da rede estadual."*\n\nEm conformidade com as regras de sintaxe da Língua Portuguesa e o padrão culto, assinale a opção CORRETA:`,
      alternatives: [
        { letter: 'A', text: 'O termo "a imperiosa necessidade" funciona como sujeito paciente do verbo constatar, caracterizando a voz passiva sintética formada por VTD acompanhado de pronome apassivador.' },
        { letter: 'B', text: 'A partícula "se" classifica-se sintaticamente como índice de indeterminação do sujeito, tornando a oração destituída de sujeito determinado.' },
        { letter: 'C', text: 'O termo "de reformulação dos critérios" classifica-se como adjunto adnominal do substantivo necessidade por possuir sentido ativo em relação ao núcleo.' },
        { letter: 'D', text: 'O verbo constatar atua como transitivo indireto regido pela preposição "de", com sujeito oculto contextualmente recuperável.' }
      ],
      correctAnswer: 'A',
      explanation: `Gabarito: A\n\nGabarito Comentado:\n- A) Correta: O verbo constatar é VTD acompanhado de partícula apassivadora "se", tornando "a imperiosa necessidade" o sujeito paciente.\n- B) Incorreta: O "se" é pronome apassivador.\n- C) Incorreta: "de reformulação dos critérios" é Complemento Nominal.\n- D) Incorreta: Constatar é VTD.`,
      topic: topicName || 'Sintaxe da Língua Portuguesa',
      subtopic: subtopicName || 'Termos da Oração e Vozes Verbais',
      difficulty: 'Difícil',
      skills: ['Sintaxe', 'Concordância']
    };
  }

  if (normDisc.includes('biologia') || normDisc.includes('ciência')) {
    return {
      disciplineKeywords: ['biologia'],
      topicKeywords: ['célula'],
      question: `A respeito dos mecanismos moleculares de transporte através da membrana plasmática e da geração do potencial de repouso celular, assinale a afirmativa CORRETA:`,
      alternatives: [
        { letter: 'A', text: 'A bomba de Na⁺/K⁺ ATPase realiza transporte ativo primário acoplado à hidrólise de ATP, transportando 3 íons Na⁺ para o meio extracelular e 2 íons K⁺ para o meio intracelular contra seus respectivos gradientes eletroquímicos.' },
        { letter: 'B', text: 'A difusão facilitada de glicose por carreadores da família GLUT consome diretamente a energia livre derivada da hidrólise de trifosfato de adenosina (ATP) na face citoplasmática.' },
        { letter: 'C', text: 'A osmose caracteriza-se pelo fluxo termodinâmico de solutos do meio hipotônico para o hipertônico impulsionado por pressão osmótica hidrostática direta.' },
        { letter: 'D', text: 'Proteínas periféricas da membrana celular ancoradas na matriz extracelular são responsáveis pela formação dos canais iônicos transmembrana voltagem-dependentes.' }
      ],
      correctAnswer: 'A',
      explanation: `Gabarito: A\n\nGabarito Comentado:\n- A) Correta: A bomba de Na⁺/K⁺ é uma ATPase tipo P de transporte ativo primário que hidrolisa 1 ATP para ejetar 3 Na⁺ e internalizar 2 K⁺ contra gradientes eletroquímicos.\n- B) Incorreta: Difusão facilitada é transporte passivo (sem gasto direto ou indireto de ATP).\n- C) Incorreta: A osmose é o deslocamento do SOLVENTE (água) do meio hipotônico para o hipertônico.\n- D) Incorreta: Canais iônicos transmembrana são formados por proteínas integrais intrínsecas, não periféricas.`,
      topic: topicName || 'Biologia Celular',
      subtopic: subtopicName || 'Transporte Transmembrana e Fisiologia',
      difficulty: 'Avançado',
      skills: ['Biologia Celular', 'Biofísica']
    };
  }

  // Fallback para Educação / Didática
  return {
    disciplineKeywords: ['educação'],
    topicKeywords: ['didática'],
    question: `No que tange ao planejamento curricular e à avaliação da aprendizagem na perspectiva formativa e mediadora, assinale a proposição CORRETA:`,
    alternatives: [
      { letter: 'A', text: 'A avaliação formativa atua como instrumento diagnóstico contínuo de regulação das aprendizagens, permitindo a reorientação das práticas pedagógicas e a identificação de lacunas ao longo do processo educativo.' },
      { letter: 'B', text: 'A avaliação somativa deve ter primazia absoluta sobre os aspectos qualitativos com o propósito exclusivo de classificação, seriação e ranqueamento discente.' },
      { letter: 'C', text: 'O planejamento do trabalho docente dispensa a articulação prévia entre os objetivos pedagógicos, os conteúdos científicos e os critérios avaliativos definidos.' },
      { letter: 'D', text: 'A avaliação diagnóstica restringe-se ao encerramento do ano letivo com a finalidade estrita de atribuição de conceitos finais para progressão escolar.' }
    ],
    correctAnswer: 'A',
    explanation: `Gabarito: A\n\nGabarito Comentado:\n- A) Correta: A avaliação formativa (Scriven / Perrenoud / Luckesi) visa acompanhar continuamente o desenvolvimento do estudante para identificar dificuldades e regular a ação didática.\n- B, C e D) Apresentam concepções reducionistas ou distorcidas contrárias aos preceitos da didática contemporânea.`,
    topic: topicName || 'Didática e Avaliação',
    subtopic: subtopicName || 'Avaliação Formativa e Planejamento',
    difficulty: 'Média',
    skills: ['Didática', 'Avaliação da Aprendizagem']
  };
}

