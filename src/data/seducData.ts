import { EditalTopic, Question, EssayTheme } from '../types';

export const INITIAL_EDITAL_TOPICS: EditalTopic[] = [
  // Conhecimentos Básicos - Língua Portuguesa
  { id: 'lp-1', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Compreensão e Interpretação de Textos Verbais e Não Verbais', status: 'in_progress', importance: 'alta' },
  { id: 'lp-2', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Tipologia e Gêneros Textuais (Dissertativo, Argumentativo, Expositivo)', status: 'reviewed', importance: 'alta' },
  { id: 'lp-3', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Coesão e Coerência Textual (Anáfora, Catáfora, Conectivos)', status: 'not_started', importance: 'alta' },
  { id: 'lp-4', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Sintaxe de Regência Verbal e Nominal e Uso do Sinal Indicativo de Crase', status: 'in_progress', importance: 'alta' },
  { id: 'lp-5', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Sintaxe de Concordância Verbal e Nominal no Padrão Norma-Culta', status: 'not_started', importance: 'alta' },
  { id: 'lp-6', category: 'Conhecimentos Básicos', subject: 'Língua Portuguesa', topicName: 'Pontuação e Efeitos de Sentido', status: 'not_started', importance: 'média' },

  // Didática e Legislação Educacional
  { id: 'leg-1', category: 'Didática e Legislação', subject: 'Legislação Educacional', topicName: 'LDB (Lei nº 9.394/96): Princípios e Fins da Educação Nacional e Direitos (Art. 1º ao 6º)', status: 'mastered', importance: 'alta' },
  { id: 'leg-2', category: 'Didática e Legislação', subject: 'Legislação Educacional', topicName: 'LDB: Organização da Educação Básica e Ensino Médio (Art. 21 ao 36-D)', status: 'in_progress', importance: 'alta' },
  { id: 'leg-3', category: 'Didática e Legislação', subject: 'Legislação Educacional', topicName: 'LDB: Os Profissionais da Educação e Valorização do Magistério (Art. 61 ao 67)', status: 'reviewed', importance: 'alta' },
  { id: 'leg-4', category: 'Didática e Legislação', subject: 'Legislação Educacional', topicName: 'Constituição Federal /88: Da Educação (Art. 205 ao 214)', status: 'in_progress', importance: 'alta' },
  { id: 'leg-5', category: 'Didática e Legislação', subject: 'Legislação Educacional', topicName: 'BNCC (Base Nacional Comum Curricular): Competências Gerais e Estrutura do Ensino Médio', status: 'not_started', importance: 'alta' },
  { id: 'leg-6', category: 'Didática e Legislação', subject: 'Legislação do Ceará', topicName: 'Estatuto do Magistério Oficial do Estado do Ceará (Lei Estadual nº 10.884/84 e alterações)', status: 'in_progress', importance: 'alta' },
  { id: 'leg-7', category: 'Didática e Legislação', subject: 'Legislação do Ceará', topicName: 'Plano Estadual de Educação do Ceará (PEE-CE - Lei nº 16.025/2016)', status: 'not_started', importance: 'média' },
  { id: 'leg-8', category: 'Didática e Legislação', subject: 'Didática e Pedagogia', topicName: 'Tendências Pedagógicas na Prática Escolar (Libâneo, Saviani, Paulo Freire)', status: 'reviewed', importance: 'alta' },
  { id: 'leg-9', category: 'Didática e Legislação', subject: 'Didática e Pedagogia', topicName: 'Avaliação da Aprendizagem: Diagnóstica, Formativa e Somativa (Luckesi, Hoffmann)', status: 'in_progress', importance: 'alta' },
  { id: 'leg-10', category: 'Didática e Legislação', subject: 'Didática e Pedagogia', topicName: 'Educação Inclusiva, DUA (Desenho Universal para Aprendizagem) e PDI na Escola', status: 'not_started', importance: 'alta' },

  // Conhecimentos Básicos - Raciocínio Lógico
  { id: 'rlm-1', category: 'Conhecimentos Básicos', subject: 'Raciocínio Lógico', topicName: 'Lógica Proposicional, Tabela Verdade e Conectivos Lógicos', status: 'not_started', importance: 'média' },
  { id: 'rlm-2', category: 'Conhecimentos Básicos', subject: 'Raciocínio Lógico', topicName: 'Equivalências e Negações de Proposições Compostas', status: 'not_started', importance: 'média' },
  { id: 'rlm-3', category: 'Conhecimentos Básicos', subject: 'Raciocínio Lógico', topicName: 'Resolução de Problemas com Conjuntos e Diagramas Lógicos', status: 'in_progress', importance: 'média' },

  // Conhecimentos Específicos (Gerais por Área)
  { id: 'esp-1', category: 'Conhecimentos Específicos', subject: 'Conhecimentos Específicos da Licenciatura', topicName: 'Planejamento de Ensino e Sequência Didática para a Educação Básica', status: 'in_progress', importance: 'alta' },
  { id: 'esp-2', category: 'Conhecimentos Específicos', subject: 'Conhecimentos Específicos da Licenciatura', topicName: 'Metodologias Ativas e Uso de TDICs em Escolas de Tempo Integral da SEDUC CE', status: 'not_started', importance: 'alta' },
  { id: 'esp-3', category: 'Conhecimentos Específicos', subject: 'Conhecimentos Específicos da Licenciatura', topicName: 'Interdisciplinaridade e Projetos Integradores no Novo Ensino Médio do Ceará', status: 'not_started', importance: 'alta' },
  { id: 'esp-4', category: 'Conhecimentos Específicos', subject: 'Conhecimentos Específicos da Licenciatura', topicName: 'Epistemologia e Didática Específica da Componente Curricular', status: 'not_started', importance: 'média' }
];

export const SEDUC_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    category: 'Didática e Legislação',
    subject: 'Legislação Educacional',
    topic: 'LDB (Lei nº 9.394/96)',
    banca: 'IDECAN',
    questionText: 'Segundo o Artigo 13 da Lei de Diretrizes e Bases da Educação Nacional (LDB nº 9.394/96), os docentes incumbir-se-ão de ações fundamentais para a rotina pedagógica. Assinale a alternativa que NÃO expressa uma incumbência legal do professor segundo a LDB:',
    options: [
      { letter: 'A', text: 'Elaborar e cumprir plano de trabalho, segundo a proposta pedagógica da escola.' },
      { letter: 'B', text: 'Zelar pela aprendizagem dos alunos e estabelecer estratégias de recuperação para os de menor rendimento.' },
      { letter: 'C', text: 'Elaborar a proposta pedagógica da instituição de ensino de forma isolada, cabendo à gestão apenas a aprovação.' },
      { letter: 'D', text: 'Ministrar os dias letivos e horas-aula estabelecidos, além de participar integralmente dos períodos dedicados ao planejamento.' },
      { letter: 'E', text: 'Colaborar com as atividades de articulação da escola com as famílias e a comunidade.' }
    ],
    correctAnswer: 'C',
    legalReference: 'LDB nº 9.394/96, Art. 12 e Art. 13',
    explanation: 'A alternativa C está incorreta (e portanto é o gabarito). A proposta pedagógica é elaborada pela ESTABELECIMENTO DE ENSINO com a PARTICIPAÇÃO dos docentes (Art. 12, I e Art. 13, I da LDB), em gestão democrática, e não de forma isolada pelo professor.',
    difficulty: 'médio'
  },
  {
    id: 'q-2',
    category: 'Didática e Legislação',
    subject: 'Didática e Pedagogia',
    topic: 'Avaliação da Aprendizagem',
    banca: 'CEBRASPE',
    questionText: 'No contexto das Escolas de Ensino Médio em Tempo Integral (EEMTI) da rede estadual do Ceará, a avaliação formativa assume papel central na mediação pedagógica. Segundo Cipriano Luckesi, a avaliação formativa diferencia-se do exame pontual porque:',
    options: [
      { letter: 'A', text: 'Possui caráter classificatório e visa selecionar os melhores alunos para bolsas de iniciação científica.' },
      { letter: 'B', text: 'É um diagnóstico contínuo focado em acolher a aprendizagem e reorientar a prática pedagógica do professor.' },
      { letter: 'C', text: 'Aplica testes padronizados exclusivamente no final do ano letivo para verificação de metas orçamentárias.' },
      { letter: 'D', text: 'Busca quantificar os erros dos estudantes para fins de atribuição de punições disciplinares.' },
      { letter: 'E', text: 'Substitui completamente o papel do professor por softwares automatizados de correção.' }
    ],
    correctAnswer: 'B',
    legalReference: 'Luckesi, C. (2011). Avaliação da Aprendizagem Escolar.',
    explanation: 'Para Luckesi, a avaliação autêntica é amorosa, inclusiva e diagnóstica. Ela não busca classificar ou punir, mas sim mapear as lacunas para reorientar a intervenção pedagógica e garantir que todos aprendam.',
    difficulty: 'fácil'
  },
  {
    id: 'q-3',
    category: 'Didática e Legislação',
    subject: 'Legislação do Ceará',
    topic: 'Estatuto do Magistério do CE',
    banca: 'Inédita PasseiSEDUC',
    questionText: 'Com base no Estatuto do Magistério Oficial do Estado do Ceará (Lei Estadual nº 10.884/84 e atualizações), a valorização dos professores da educação básica da SEDUC CE pauta-se por princípios essenciais. Sobre o estágio probatório e a estabilidade funcional do docente estadual, assinale a afirmativa correta:',
    options: [
      { letter: 'A', text: 'O estágio probatório tem duração de 2 (dois) anos, dispensada a avaliação especial de desempenho.' },
      { letter: 'B', text: 'O estágio probatório tem duração de 3 (três) anos de efetivo exercício, sendo obrigatória a avaliação especial por comissão constituída para essa finalidade.' },
      { letter: 'C', text: 'A estabilidade é adquirida automaticamente ao completar 1 (um) ano de sala de aula sem faltas injustificadas.' },
      { letter: 'D', text: 'Durante o estágio probatório, o professor fica impedido de participar de formações continuadas promovidas pela SEDUC.' },
      { letter: 'E', text: 'A remoção a pedido do docente pode ocorrer a qualquer momento no primeiro mês de posse sem critérios regulamentares.' }
    ],
    correctAnswer: 'B',
    legalReference: 'CF/88 Art. 41 e Lei Estadual do Ceará nº 10.884/84',
    explanation: 'Conforme a Constituição Federal (Art. 41, caput e §4º) e a legislação estadual do Ceará, são necessários 3 (três) anos de efetivo exercício para aquisição da estabilidade, mediante avaliação especial de desempenho por comissão instituída.',
    difficulty: 'médio'
  },
  {
    id: 'q-4',
    category: 'Conhecimentos Básicos',
    subject: 'Língua Portuguesa',
    topic: 'Sintaxe e Crase',
    banca: 'IDECAN',
    questionText: 'Considere a frase adaptada da diretriz pedagógica da SEDUC CE: "A escola de tempo integral visa ___ garantia do direito ___ aprendizagem de todos os estudantes, oferecendo suporte contínuo ___ famílias." Assinale a sequência que preenche correta e respectivamente as lacunas de acordo com a norma-padrão:',
    options: [
      { letter: 'A', text: 'à – à – às' },
      { letter: 'B', text: 'a – a – as' },
      { letter: 'C', text: 'à – a – às' },
      { letter: 'D', text: 'a – à – as' },
      { letter: 'E', text: 'à – à – as' }
    ],
    correctAnswer: 'A',
    legalReference: 'Gramática Normativa da Língua Portuguesa - Regência Verbal e Crase',
    explanation: '1) "visa" no sentido de almejar exige preposição "a" + artigo "a" da palavra "garantia" = "à garantia". 2) "direito" exige preposição "a" + artigo "a" de "aprendizagem" = "à aprendizagem". 3) "suporte" exige preposição "a" + artigo no plural "as" de "famílias" = "às famílias". Gabarito: A.',
    difficulty: 'difícil'
  },
  {
    id: 'q-5',
    category: 'Didática e Legislação',
    subject: 'Legislação Educacional',
    topic: 'BNCC e Ensino Médio',
    banca: 'VUNESP',
    questionText: 'A Base Nacional Comum Curricular (BNCC) para o Ensino Médio organiza o conhecimento em Áreas do Conhecimento e estabelece 10 Competências Gerais. No contexto da SEDUC CE, o Projeto de Vida é considerado:',
    options: [
      { letter: 'A', text: 'Uma disciplina optativa sem qualquer articulação com as competências socioemocionais.' },
      { letter: 'B', text: 'Um eixo integrador estratégico que articula as escolhas acadêmicas, profissionais e cidadãs dos estudantes.' },
      { letter: 'C', text: 'Uma atividade extracurricular restrita a alunos do 1º ano que apresentam reprovação anterior.' },
      { letter: 'D', text: 'Um documento burocrático preenchido exclusivamente pelos pais no ato da matrícula.' },
      { letter: 'E', text: 'Um conteúdo isolado exclusivo da componente de Filosofia.' }
    ],
    correctAnswer: 'B',
    legalReference: 'BNCC - Etapa do Ensino Médio (MEC/SEDUC-CE)',
    explanation: 'O Projeto de Vida na BNCC e no Novo Ensino Médio do Ceará atua como elemento central e transversal, estimulando o protagonismo juvenil e a construção do futuro pessoal, acadêmico e profissional do estudante.',
    difficulty: 'fácil'
  }
];

export const ESSAY_THEMES: EssayTheme[] = [
  {
    id: 'theme-1',
    title: 'A Gestão Democrática e a Prevenção do Evasão Escolar no Ensino Médio Cearense',
    category: 'Estudo de Caso Pedagógico / Prática de Sala de Aula',
    prompt: 'Com base na LDB nº 9.394/96 e nas diretrizes de tempo integral da SEDUC CE, elabore um texto dissertativo-expositivo (de 20 a 30 linhas) abordando como a gestão democrática e o trabalho pedagógico colaborativo podem combater a evasão escolar e garantir a permanência de estudantes em situação de vulnerabilidade.',
    contextText: 'O estado do Ceará é referência nacional na consolidação de escolas de tempo integral (EEMTI e EEEP). No entanto, desafios socioeconômicos pós-pandemia impõem o risco de abandono escolar na etapa final da educação básica.',
    guidePoints: [
      'Citar o princípio da Gestão Democrática (LDB Art. 3º e Art. 14)',
      'Ações pedagógicas de acolhimento e escuta ativa (Projeto de Vida)',
      'Articulação da escola com a rede de proteção social (Busca Ativa Escolar e CRAS/CREAS)',
      'Avaliação formativa e recomposição de aprendizagens'
    ]
  },
  {
    id: 'theme-2',
    title: 'Educação Inclusiva, DUA e o Plano de Desenvolvimento Individualizado (PDI)',
    category: 'Inclusão e Diversidade',
    prompt: 'Considerando a Lei Brasileira de Inclusão (Lei nº 13.146/2015) e o Desenho Universal para a Aprendizagem (DUA), proponha uma sequência de intervenção pedagógica para acolher um estudante neurodivergente no Ensino Médio da rede estadual do Ceará.',
    contextText: 'Garantir que a escola seja um espaço de acesso, permanência e aprendizagem efetiva para pessoas com deficiência e neurodivergências é imperativo constitucional e dever de todo professor concursado.',
    guidePoints: [
      'Conceituação do Desenho Universal para a Aprendizagem (múltiplas formas de engajamento, representação e expressão)',
      'Elaboração e acompanhamento do PDI junto ao Atendimento Educacional Especializado (AEE)',
      'Uso de tecnologias assistivas e flexibilização curricular sem redução de expectativas'
    ]
  }
];
