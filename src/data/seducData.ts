import { EditalTopic, Question, EssayTheme, UserProfile, ScheduleDay, ScheduleTopicItem, EditalBlock, SubjectCategory, GeneralCategoryKey, TopicStatus } from '../types';
import { ALL_DISCIPLINES_EDITAL } from './disciplinesData';

export const FUNECE_DEGREE_OPTIONS = [
  'Licenciatura em Língua Portuguesa / Letras',
  'Licenciatura em Matemática',
  'Licenciatura em História',
  'Licenciatura em Biologia / Ciências Biológicas',
  'Licenciatura em Geografia',
  'Licenciatura em Física',
  'Licenciatura em Química',
  'Licenciatura em Pedagogia',
  'Licenciatura em Educação Física',
  'Licenciatura em Língua Inglesa',
  'Licenciatura em Língua Espanhola',
  'Licenciatura em Língua Brasileira de Sinais - Libras',
  'Licenciatura em Artes / Artes Visuais / Música',
  'Licenciatura em Filosofia',
  'Licenciatura em Sociologia'
];

/**
 * Estrutura Oficial do Concurso SEDUC CE (Banca FUNECE / CEV-UECE) - 80 Questões Total
 */
export const PROVA_ESTRUTURA_SEDUC = [
  {
    subject: 'Conhecimentos Específicos',
    questionsCount: 50,
    weightPercent: '62,5%',
    priority: 'MÁXIMA (50 das 80 questões)',
    color: 'emerald',
    description: 'Tópicos específicos da licenciatura selecionada no perfil do candidato (ex: Biologia, Língua Portuguesa, Matemática, História, etc.).'
  },
  {
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    questionsCount: 8,
    weightPercent: '10,0%',
    priority: 'MÉDIA/ALTA (8 questões)',
    color: 'amber',
    description: 'LDB 9.394/96, Tendências Pedagógicas, Avaliação Formativa, DUA e Inclusão nas escolas da SEDUC CE.'
  },
  {
    subject: 'Língua Portuguesa',
    questionsCount: 8,
    weightPercent: '10,0%',
    priority: 'MÉDIA/ALTA (8 questões)',
    color: 'teal',
    description: 'Interpretação textual, sintaxe de regência e crase, concordância, coesão/coerência no padrão CEV/UECE.'
  },
  {
    subject: 'Leitura e Interpretação de Dados e Indicadores Educacionais',
    questionsCount: 8,
    weightPercent: '10,0%',
    priority: 'MÉDIA/ALTA (8 questões)',
    color: 'blue',
    description: 'Análise de tabelas, gráficos, índices educacionais do Ceará (SPAECE, IDEB, taxas de rendimento e distorção idade-série).'
  },
  {
    subject: 'Administração Pública',
    questionsCount: 6,
    weightPercent: '7,5%',
    priority: 'MÉDIA (6 questões)',
    color: 'purple',
    description: 'Estatuto do Magistério do CE (Lei 10.884/84), CF/88 (Art. 205 ao 214), princípios da Adm. Pública e Plano Estadual de Educação (PEE-CE).'
  }
];

/**
 * FONTE ÚNICA DE DADOS (SINGLE SOURCE OF TRUTH)
 * ÁRVORE OFICIAL DO EDITAL MATRICIAL SEDUC CE / BANCA FUNECE
 * Hierarquia estrita: Área -> Bloco -> Tópico -> Subtópico
 */
export const OFFICIAL_EDITAL_TREE: {
  geral: Record<GeneralCategoryKey, EditalBlock[]>;
  especifico: Record<string, EditalBlock[]>;
} = {
  geral: {
    'Educação Brasileira: Temas Educacionais e Pedagógicos': [
      {
        id: 'bloco-eb-1',
        name: 'Bloco 1: História do Pensamento Pedagógico Brasileiro e Didática',
        topics: [
          {
            id: 'top-eb-1-1',
            name: '1. História do Pensamento Pedagógico Brasileiro',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-eb-1-1-1', name: '1.1 Teoria da Educação e Diferentes Correntes do Pensamento Pedagógico Brasileiro', status: 'mastered' },
              { id: 'sub-eb-1-1-2', name: '1.2 Projeto Político Pedagógico (PPP)', status: 'reviewed' }
            ]
          },
          {
            id: 'top-eb-1-2',
            name: '2. A Didática e o Processo de Ensino e Aprendizagem',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-eb-1-2-1', name: '2.1 Organização do Processo Didático: Planejamento, Estratégias e Metodologias, Avaliação', status: 'in_progress' },
              { id: 'sub-eb-1-2-2', name: '2.2 A Sala de Aula como Espaço de Aprendizagem e Interação', status: 'reviewed' },
              { id: 'sub-eb-1-2-3', name: '2.3 A Didática como Fundamento Epistemológico do Fazer Docente', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-eb-2',
        name: 'Bloco 2: Teorias da Aprendizagem e Psicologia do Desenvolvimento',
        topics: [
          {
            id: 'top-eb-2-1',
            name: '3. Principais Teorias da Aprendizagem e Desenvolvimento',
            status: 'reviewed',
            subtopics: [
              { id: 'sub-eb-2-1-1', name: '3.1 Inatismo, Comportamentalismo, Behaviorismo, Interacionismo, Cognitivismo', status: 'reviewed' },
              { id: 'sub-eb-2-1-2', name: '3.2 As Bases Empíricas, Metodológicas e Epistemológicas das Diversas Teorias de Aprendizagem', status: 'reviewed' },
              { id: 'sub-eb-2-1-3', name: '3.3 Contribuições de Piaget, Vygotsky e Wallon para a Psicologia e Pedagogia', status: 'mastered' },
              { id: 'sub-eb-2-1-4', name: '3.4 Teoria das Inteligências Múltiplas de Gardner', status: 'reviewed' },
              { id: 'sub-eb-2-1-5', name: '3.5 Psicologia do Desenvolvimento: Aspectos Históricos e Biopsicossociais', status: 'in_progress' },
              { id: 'sub-eb-2-1-6', name: '3.6 Temas Contemporâneos: Bullying, Papel da Escola, Escolha da Profissão, Transtornos Alimentares na Adolescência, Família, Escolhas Sexuais', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-eb-3',
        name: 'Bloco 3: Teorias do Currículo, Gestão e Ética Docente',
        topics: [
          {
            id: 'top-eb-3-1',
            name: '4. Teorias do Currículo, Gestão e Pesquisa Docente',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-eb-3-1-1', name: '4.1 Acesso, Permanência e Sucesso do Aluno na Escola', status: 'in_progress' },
              { id: 'sub-eb-3-1-2', name: '4.2 Gestão da Aprendizagem', status: 'not_started' },
              { id: 'sub-eb-3-1-3', name: '4.3 Planejamento e Gestão Educacional', status: 'not_started' },
              { id: 'sub-eb-3-1-4', name: '4.4 Avaliação Institucional, de Desempenho e de Aprendizagem', status: 'in_progress' },
              { id: 'sub-eb-3-1-5', name: '4.5 O Professor: Formação e Profissão', status: 'reviewed' },
              { id: 'sub-eb-3-1-6', name: '4.6 A Pesquisa na Prática Docente', status: 'not_started' },
              { id: 'sub-eb-3-1-7', name: '4.7 A Dimensão Ética da Profissão', status: 'mastered' }
            ]
          },
          {
            id: 'top-eb-3-2',
            name: '5. Aspectos Legais e Políticos da Educação Brasileira',
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-3-2-1', name: '5. Aspectos Legais e Políticos da Organização da Educação Brasileira', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-eb-4',
        name: 'Bloco 4: Políticas Educacionais para a Educação Básica e Ensino Médio',
        topics: [
          {
            id: 'top-eb-4-1',
            name: '6. Políticas Educacionais para a Educação Básica',
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-4-1-1', name: '6.1 Ensino Médio: 6.1.1 Diretrizes, Parâmetros Curriculares, Currículo e Avaliação', status: 'not_started' },
              { id: 'sub-eb-4-1-2', name: '6.1.2 Interdisciplinaridade e Contextualização no Ensino Médio', status: 'not_started' },
              { id: 'sub-eb-4-1-3', name: '6.1.3 Ensino Médio Integrado: Fundamentação Legal e Curricular', status: 'not_started' },
              { id: 'sub-eb-4-1-4', name: '6.2 Educação Inclusiva na Educação Básica', status: 'in_progress' },
              { id: 'sub-eb-4-1-5', name: '6.3 Educação, Trabalho, Formação Profissional e as Transformações do Ensino Médio', status: 'not_started' },
              { id: 'sub-eb-4-1-6', name: '6.4 Protagonismo Juvenil e Cidadania', status: 'not_started' }
            ]
          }
        ]
      }
    ],
    'Administração Pública': [
      {
        id: 'bloco-adm-1',
        name: 'Bloco 1: Fundamentos da Administração Pública e Servidor Público',
        topics: [
          {
            id: 'top-adm-1-1',
            name: '1 a 5. Conceito, Princípios e Responsabilidades',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-adm-1-1-1', name: '1. Conceito de Administração Pública e 2. Conceito de Servidor Público', status: 'mastered' },
              { id: 'sub-adm-1-1-2', name: '3. Princípios da Administração Pública', status: 'reviewed' },
              { id: 'sub-adm-1-1-3', name: '4. Direitos e Deveres dos Servidores Públicos', status: 'in_progress' },
              { id: 'sub-adm-1-1-4', name: '5. Responsabilidade dos Servidores Públicos', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-adm-2',
        name: 'Bloco 2: Servidor Estadual e Legislação do Grupo MAG (Ceará)',
        topics: [
          {
            id: 'top-adm-2-1',
            name: '6. Servidor Estadual do Ceará e Estatuto Civil (Lei nº 9.826/1974)',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-adm-2-1-1', name: '6.1 Estatuto dos Funcionários Públicos Civis do CE (Lei nº 9.826/1974): 6.1.1 Do provimento dos cargos (Cap. I a X)', status: 'in_progress' },
              { id: 'sub-adm-2-1-2', name: '6.1.2 Dos direitos, vantagens e autorizações (Cap. I a VI)', status: 'in_progress' },
              { id: 'sub-adm-2-1-3', name: '6.1.3 Do regime disciplinar (Título VI - Cap. I a VII)', status: 'not_started' },
              { id: 'sub-adm-2-1-4', name: '6.2 Lei nº 15.243/2012 (Disciplina o Art. 3º da Lei nº 15.064/2011)', status: 'not_started' },
              { id: 'sub-adm-2-1-5', name: '6.3 Estágio Probatório Servidor Estadual (Lei nº 9.826/74, Lei nº 13.092/01, Lei nº 15.744/14 e Lei nº 15.909/15)', status: 'in_progress' }
            ]
          },
          {
            id: 'top-adm-2-2',
            name: '6.4 a 6.7 Carreira, Carga Horária, Promoção e Remuneração do Magistério (Grupo MAG)',
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-2-2-1', name: '6.4 Carreira do Magistério: Concurso, Provimento, Carga Horária e Jornada (Lei nº 10.884/1984, Lei nº 12.066/1993, Lei nº 14.404/2009)', status: 'in_progress' },
              { id: 'sub-adm-2-2-2', name: '6.5 Ampliação da Carga Horária de Trabalho do Grupo MAG (Lei nº 15.451/2013 e Decreto nº 31.458/2014)', status: 'not_started' },
              { id: 'sub-adm-2-2-3', name: '6.6 Promoção dos Profissionais do Grupo MAG (Lei nº 15.901/2015, Decreto nº 32.103/2016)', status: 'not_started' },
              { id: 'sub-adm-2-2-4', name: '6.7 Sistema Remuneratório dos Profissionais MAG de Nível Superior (Leis nº 15.243/12, nº 15.901/15, nº 16.104/16, nº 16.513/18 e nº 16.536/18)', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-adm-3',
        name: 'Bloco 3: Legislação Básica da Educação Nacional e Estadual',
        topics: [
          {
            id: 'top-adm-3-1',
            name: 'Legislação Nacional Básica da Educação',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-adm-3-1-1', name: '1. Lei nº 9.394/1996 e alterações (Lei de Diretrizes e Bases da Educação Nacional - LDB)', status: 'mastered' },
              { id: 'sub-adm-3-1-2', name: '2. Lei nº 8.069/1990 e alterações (Estatuto da Criança e do Adolescente - ECA)', status: 'reviewed' },
              { id: 'sub-adm-3-1-3', name: '3. Constituição da República Federativa do Brasil (Art. 205 a 214)', status: 'mastered' },
              { id: 'sub-adm-3-1-4', name: '4. Emenda Constitucional nº 53/2006 e 5. Lei nº 11.494/2007 e alterações (FUNDEB)', status: 'reviewed' },
              { id: 'sub-adm-3-1-5', name: '6. Lei nº 11.114/2005, 7. Lei nº 11.274/2006 e 8. Lei nº 13.415/2017 (Reforma do Ensino Médio)', status: 'in_progress' }
            ]
          },
          {
            id: 'top-adm-3-2',
            name: 'Planos de Educação (PNE e PEE-CE)',
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-3-2-1', name: '9. Lei Federal Nº 13.005/2014 (Plano Nacional de Educação - PNE)', status: 'not_started' },
              { id: 'sub-adm-3-2-2', name: '10. Lei Estadual Nº 16.025/2016 (Plano Estadual de Educação - PEE-CE)', status: 'not_started' }
            ]
          }
        ]
      }
    ],
    'Língua Portuguesa': [
      {
        id: 'bloco-lp-1',
        name: 'Bloco 1: Leitura, Interpretação e Ortografia',
        topics: [
          {
            id: 'top-lp-1-1',
            name: 'Compreensão, Tipologia e Semântica',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-lp-1-1-1', name: '1. Compreensão e Interpretação de Textos', status: 'in_progress' },
              { id: 'sub-lp-1-1-2', name: '2. Tipologia Textual', status: 'reviewed' },
              { id: 'sub-lp-1-1-3', name: '11. Significação das Palavras', status: 'reviewed' }
            ]
          },
          {
            id: 'top-lp-1-2',
            name: 'Ortografia e Acentuação',
            status: 'reviewed',
            subtopics: [
              { id: 'sub-lp-1-2-1', name: '3. Ortografia Oficial', status: 'mastered' },
              { id: 'sub-lp-1-2-2', name: '4. Acentuação Gráfica', status: 'mastered' }
            ]
          }
        ]
      },
      {
        id: 'bloco-lp-2',
        name: 'Bloco 2: Gramática, Sintaxe e Estilo',
        topics: [
          {
            id: 'top-lp-2-1',
            name: 'Morfossintaxe, Regência e Crase',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-lp-2-1-1', name: '5. Emprego das Classes de Palavras', status: 'in_progress' },
              { id: 'sub-lp-2-1-2', name: '6. Emprego do Sinal Indicativo de Crase', status: 'in_progress' },
              { id: 'sub-lp-2-1-3', name: '10. Regência Nominal e Verbal', status: 'in_progress' }
            ]
          },
          {
            id: 'top-lp-2-2',
            name: 'Sintaxe, Concordância e Pontuação',
            status: 'not_started',
            subtopics: [
              { id: 'sub-lp-2-2-1', name: '7. Sintaxe da Oração e do Período', status: 'in_progress' },
              { id: 'sub-lp-2-2-2', name: '8. Pontuação', status: 'reviewed' },
              { id: 'sub-lp-2-2-3', name: '9. Concordância Nominal e Verbal', status: 'not_started' }
            ]
          }
        ]
      }
    ],
    'Leitura e Interpretação de Dados e Indicadores Educacionais': [
      {
        id: 'bloco-dad-1',
        name: 'Bloco 1: Indicadores Educacionais, Matrícula e Fluxo Escolar',
        topics: [
          {
            id: 'top-dad-1-1',
            name: 'Estatísticas de Atendimento e Escolarização',
            status: 'in_progress',
            subtopics: [
              { id: 'sub-dad-1-1-1', name: 'Leitura e Interpretação de Dados Referentes à Matrícula e Taxa de Atendimento Escolar', status: 'in_progress' },
              { id: 'sub-dad-1-1-2', name: 'Taxas de Escolarização Líquida e Bruta', status: 'in_progress' }
            ]
          },
          {
            id: 'top-dad-1-2',
            name: 'Distorção Idade-Série e Taxas de Rendimento Escolar',
            status: 'not_started',
            subtopics: [
              { id: 'sub-dad-1-2-1', name: 'Taxa de Distorção Idade-Série na Rede Estadual', status: 'not_started' },
              { id: 'sub-dad-1-2-2', name: 'Taxas de Rendimento (Aprovação, Reprovação e Abandono)', status: 'not_started' }
            ]
          }
        ]
      },
      {
        id: 'bloco-dad-2',
        name: 'Bloco 2: Avaliações em Larga Escala e Análise Quantitativa',
        topics: [
          {
            id: 'top-dad-2-1',
            name: 'Sistemas de Avaliação e Indicadores (SPAECE, SAEB, ENEM, IDEB, PISA)',
            status: 'not_started',
            subtopics: [
              { id: 'sub-dad-2-1-1', name: 'Resultados do Sistema Permanente de Avaliação da Educação Básica do Ceará (SPAECE)', status: 'not_started' },
              { id: 'sub-dad-2-1-2', name: 'Sistema de Avaliação da Educação Básica (SAEB), Exame Nacional do Ensino Médio (ENEM) e PISA', status: 'not_started' },
              { id: 'sub-dad-2-1-3', name: 'Índice de Desenvolvimento da Educação Básica (IDEB)', status: 'not_started' }
            ]
          },
          {
            id: 'top-dad-2-2',
            name: 'Representação de Dados e Cálculo de Porcentagem',
            status: 'not_started',
            subtopics: [
              { id: 'sub-dad-2-2-1', name: 'Leitura e Interpretação de Dados Apresentados em Tabelas, Gráficos e Mapas', status: 'in_progress' },
              { id: 'sub-dad-2-2-2', name: 'Resolução de Problemas que Envolvam o Cálculo de Porcentagem com Dados Fornecidos em Diferentes Formatos', status: 'not_started' }
            ]
          }
        ]
      }
    ]
  },
  especifico: ALL_DISCIPLINES_EDITAL
};

/**
 * Retorna os blocos do conteúdo específico para uma determinada licenciatura
 */
export function getBlocksForDegree(userDegree?: string): EditalBlock[] {
  if (userDegree && OFFICIAL_EDITAL_TREE.especifico[userDegree]) {
    return OFFICIAL_EDITAL_TREE.especifico[userDegree];
  }

  // Tenta busca flexível por palavras-chave
  if (userDegree) {
    const cleanDegree = userDegree.toLowerCase();
    const matchedKey = Object.keys(OFFICIAL_EDITAL_TREE.especifico).find(key => {
      const k = key.toLowerCase();
      return k.includes(cleanDegree) || cleanDegree.includes(k) ||
        (cleanDegree.includes('biologia') && k.includes('biologia')) ||
        (cleanDegree.includes('português') && k.includes('portuguesa')) ||
        (cleanDegree.includes('letras') && k.includes('portuguesa')) ||
        (cleanDegree.includes('artes') && k.includes('artes')) ||
        (cleanDegree.includes('física') && k.includes('física')) ||
        (cleanDegree.includes('química') && k.includes('química')) ||
        (cleanDegree.includes('matemática') && k.includes('matemática')) ||
        (cleanDegree.includes('história') && k.includes('história')) ||
        (cleanDegree.includes('geografia') && k.includes('geografia')) ||
        (cleanDegree.includes('filosofia') && k.includes('filosofia')) ||
        (cleanDegree.includes('sociologia') && k.includes('sociologia')) ||
        (cleanDegree.includes('inglês') && k.includes('inglesa')) ||
        (cleanDegree.includes('espanhol') && k.includes('espanhola')) ||
        (cleanDegree.includes('libras') && k.includes('libras')) ||
        (cleanDegree.includes('pedag') && k.includes('pedagogia'));
    });
    if (matchedKey) {
      return OFFICIAL_EDITAL_TREE.especifico[matchedKey];
    }
  }

  // Fallback padrão para Biologia caso não seja encontrado
  return OFFICIAL_EDITAL_TREE.especifico['Licenciatura em Biologia / Ciências Biológicas'] || [];
}

export const getEspecificoTree = getBlocksForDegree;

/**
 * Converte a Árvore do Edital em uma lista linear para ser consumida por
 * funcionalidades que necessitam de iteração sobre os tópicos (ex: Cronograma e Simulados).
 */
export function getFlattenedEditalTopics(userDegree?: string): EditalTopic[] {
  const result: EditalTopic[] = [];

  // 1. Categorias Gerais (as 4 obrigatórias)
  const generalCats = OFFICIAL_EDITAL_TREE.geral;
  (Object.keys(generalCats) as GeneralCategoryKey[]).forEach((catKey) => {
    const blocks = generalCats[catKey];
    blocks.forEach((block) => {
      block.topics.forEach((topic) => {
        result.push({
          id: topic.id,
          category: catKey as SubjectCategory,
          subject: catKey,
          blockName: block.name,
          topicName: topic.name,
          subtopics: topic.subtopics.map(s => s.name),
          status: topic.status || 'not_started',
          importance: 'alta'
        });
      });
    });
  });

  // 2. Categoria Específica
  const specBlocks = getBlocksForDegree(userDegree);
  specBlocks.forEach((block) => {
    block.topics.forEach((topic) => {
      result.push({
        id: topic.id,
        category: 'Conhecimentos Específicos',
        subject: `Conhecimentos Específicos (${userDegree || 'Licenciatura'})`,
        blockName: block.name,
        topicName: topic.name,
        subtopics: topic.subtopics.map(s => s.name),
        status: topic.status || 'not_started',
        importance: 'alta'
      });
    });
  });

  return result;
}

export const INITIAL_EDITAL_TOPICS: EditalTopic[] = getFlattenedEditalTopics();

export const SEDUC_QUESTIONS: Question[] = [
  // 1. Conhecimentos Específicos
  {
    id: 'q-esp-1',
    category: 'Conhecimentos Específicos',
    subject: 'Conhecimentos Específicos',
    topic: 'Metodologias e Didática Específica',
    banca: 'FUNECE',
    questionText: 'Na prova de Conhecimentos Específicos (responsável por 50 das 80 questões do concurso SEDUC CE), a CEV/UECE exige que a componente curricular dialogue com os itinerários formativos do Ensino Médio. Em relação ao planejamento de ensino por competências e habilidades, assinale a opção correta:',
    options: [
      { letter: 'A', text: 'O ensino por competências elimina a necessidade de conteúdos conceituais na área de conhecimento.' },
      { letter: 'B', text: 'A avaliação específica deve integrar saberes científicos com a resolução de problemas do cotidiano do estudante cearense.' },
      { letter: 'C', text: 'O professor deve limitar a transmissão de conteúdos à memorização passiva das definições do livro didático.' },
      { letter: 'D', text: 'A matriz de referência da FUNECE proíbe a utilização de práticas laboratoriais no ensino de ciências e linguagens.' },
      { letter: 'E', text: 'A componente curricular específica não possui relação com os objetivos de aprendizagem do DCRC.' }
    ],
    correctAnswer: 'B',
    legalReference: 'Diretrizes Curriculares do Ceará (DCRC) e Matriz FUNECE',
    explanation: 'Gabarito FUNECE: B. A FUNECE valoriza a aplicação contextualizada do conhecimento específico, unindo a fundamentação científica à capacidade de resolução de problemas e protagonismo no ensino médio de tempo integral.',
    difficulty: 'médio'
  },
  // 2. Educação Brasileira e Temas Pedagógicos
  {
    id: 'q-ped-1',
    category: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    topic: 'LDB nº 9.394/96',
    banca: 'FUNECE',
    questionText: 'Em provas elaboradas pela FUNECE para o magistério estadual do Ceará (seção de Temas Educacionais e Pedagógicos), cobra-se com rigor a LDB nº 9.394/96. Segundo o Artigo 13 da LDB, assinale a alternativa que NÃO constitui uma incumbência legal atribuída diretamente aos docentes:',
    options: [
      { letter: 'A', text: 'Elaborar e cumprir plano de trabalho, segundo a proposta pedagógica do estabelecimento de ensino.' },
      { letter: 'B', text: 'Zelar pela aprendizagem dos alunos e estabelecer estratégias de recuperação para os de menor rendimento.' },
      { letter: 'C', text: 'Formular a proposta pedagógica da escola de forma individual e isolada, sem submissão ao conselho escolar.' },
      { letter: 'D', text: 'Ministrar os dias letivos e horas-aula estabelecidos, além de participar integralmente dos períodos dedicados ao planejamento.' },
      { letter: 'E', text: 'Colaborar com as atividades de articulação da escola com as famílias e a comunidade.' }
    ],
    correctAnswer: 'C',
    legalReference: 'LDB nº 9.394/96, Art. 12 e Art. 13',
    explanation: 'Gabarito FUNECE: Alternativa C. Na LDB, a proposta pedagógica é elaborada coletivamente pelo estabelecimento de ensino com a participação dos docentes, e nunca isoladamente.',
    difficulty: 'fácil'
  },
  // 3. Língua Portuguesa
  {
    id: 'q-lp-1',
    category: 'Língua Portuguesa',
    subject: 'Língua Portuguesa',
    topic: 'Sintaxe e Crase',
    banca: 'FUNECE',
    questionText: 'Na tradição de provas da FUNECE / CEV-UECE (seção de Língua Portuguesa), a regência e o uso do sinal indicativo de crase são recorrentes. Examine: "A diretora da EEMTI dirigiu-se ___ comunidade para apresentar ___ diretrizes pedagógicas e dar suporte ___ famílias." Qual opção preenche corretamente as lacunas?',
    options: [
      { letter: 'A', text: 'à – as – às' },
      { letter: 'B', text: 'a – às – as' },
      { letter: 'C', text: 'à – às – as' },
      { letter: 'D', text: 'a – as – às' },
      { letter: 'E', text: 'à – as – as' }
    ],
    correctAnswer: 'A',
    legalReference: 'Gramática Normativa - CEV/UECE',
    explanation: '1) dirigiu-se "a" + "a comunidade" = "à comunidade". 2) apresentar é VTD, exige apenas artigo "as diretrizes". 3) dar suporte exige preposição "a" + artigo "as famílias" = "às famílias". Gabarito FUNECE: A.',
    difficulty: 'médio'
  },
  // 4. Leitura e Interpretação de Dados e Indicadores Educacionais
  {
    id: 'q-dad-1',
    category: 'Dados e Indicadores Educacionais',
    subject: 'Leitura e Interpretação de Dados e Indicadores Educacionais',
    topic: 'SPAECE e Indicadores da SEDUC',
    banca: 'FUNECE',
    questionText: 'No bloco de "Leitura e Interpretação de Dados e Indicadores Educacionais" (8 questões na prova SEDUC CE), a FUNECE avalia a capacidade do professor de analisar os resultados do SPAECE (Sistema de Avaliação da Educação Básica do Ceará). Um gráfico do SPAECE revela que 75% dos alunos de uma escola de Ensino Médio atingiram o nível "Adequado" em proficiência. Com base nesse dado estatístico, é correto inferir:',
    options: [
      { letter: 'A', text: 'Todos os alunos da escola dominam 100% dos descritores da matriz de referência do SPAECE.' },
      { letter: 'B', text: 'A maioria absoluta (três quartos) dos estudantes avaliados demonstrou as competências consolidadas esperadas para a etapa.' },
      { letter: 'C', text: 'O indicador comprova que a escola não necessita de plano de recomposição de aprendizagem para os 25% restantes.' },
      { letter: 'D', text: 'O resultado do SPAECE impede que a escola receba recursos do Fundo de Manutenção da Educação Básica.' },
      { letter: 'E', text: 'A taxa de proficiência do SPAECE substitui as notas regimentais de avaliação formativa atribuídas pelo docente.' }
    ],
    correctAnswer: 'B',
    legalReference: 'Manual de Indicadores Educacionais do Ceará / SPAECE SEDUC CE',
    explanation: 'Gabarito FUNECE: B. 75% corresponde exatamente a três quartos (3/4) do total, indicando que a grande maioria dos estudantes atingiu o padrão de proficiência desejado.',
    difficulty: 'médio'
  },
  // 5. Administração Pública
  {
    id: 'q-adm-1',
    category: 'Administração Pública',
    subject: 'Administração Pública',
    topic: 'Estatuto do Magistério do CE',
    banca: 'CEV/UECE',
    questionText: 'Na disciplina de Administração Pública (6 questões no concurso da SEDUC CE), destaca-se a legislação do servidor público cearense. Conforme a Lei Estadual nº 10.884/84 (Estatuto do Magistério do Ceará) e a CF/88, sobre o estágio probatório do professor estadual, assinale a opção correta:',
    options: [
      { letter: 'A', text: 'O estágio probatório possui prazo de 2 (dois) anos, dispensando comissão de avaliação.' },
      { letter: 'B', text: 'O estágio probatório cumpre-se em 3 (três) anos de efetivo exercício, condicionado à avaliação especial de desempenho.' },
      { letter: 'C', text: 'A estabilidade no serviço público estadual ocorre automaticamente com 12 meses de contrato.' },
      { letter: 'D', text: 'O servidor em estágio probatório fica proibido de solicitar licença para tratamento de saúde.' },
      { letter: 'E', text: 'A exoneração do professor durante o estágio probatório não exige motivação legal nem contraditório.' }
    ],
    correctAnswer: 'B',
    legalReference: 'CF/88 Art. 41 e Lei Estadual do Ceará nº 10.884/84',
    explanation: 'Gabarito FUNECE: B. Conforme a CF/88 e a Lei Estadual nº 10.884/84, a estabilidade ocorre após 3 anos de efetivo exercício com aprovação em avaliação especial de desempenho.',
    difficulty: 'médio'
  }
];

export const ESSAY_THEMES: EssayTheme[] = [
  {
    id: 'theme-funece-1',
    title: 'A Atuação do Professor na Escola de Ensino Médio em Tempo Integral do Ceará (Banca FUNECE)',
    category: 'Estudo de Caso / Redação Discursiva FUNECE',
    prompt: 'Com base na LDB nº 9.394/96, no DCRC do Ceará e nas diretrizes da FUNECE, redija um texto dissertativo (de 20 a 30 linhas) abordando o papel do professor na mediação dos Projetos de Vida, na prevenção do abandono escolar e no fortalecimento da gestão democrática nas escolas estaduais.',
    contextText: 'O modelo de Educação em Tempo Integral do Ceará consolidou-se como referência nacional. A FUNECE exige do candidato à docência clareza pedagógica e fundamentação em normativas estaduais.',
    guidePoints: [
      'Fundamentação na LDB (Art. 3º e 13) e no Estatuto do Ceará',
      'Articulação entre Protagonismo Juvenil e o Projeto de Vida no Novo Ensino Médio',
      'Estratégias de Busca Ativa Escolar e Recomposição de Aprendizagem',
      'Avaliação Formativa e Inclusão Escolar'
    ]
  },
  {
    id: 'theme-funece-2',
    title: 'Análise de Indicadores Educacionais (SPAECE/IDEB) e Ação Pedagógica Inclusiva',
    category: 'Indicadores Educacionais e Prática Pedagógica',
    prompt: 'A partir da interpretação dos dados do SPAECE e do IDEB, elabore uma proposta de intervenção pedagógica que combine recomposição de aprendizagem e Desenho Universal para a Aprendizagem (DUA) nas escolas da SEDUC CE.',
    contextText: 'A prova da SEDUC valoriza professores capazes de transformar dados estatísticos e indicadores em estratégias reais de ensino inclusivo.',
    guidePoints: [
      'Análise crítica dos indicadores do SPAECE e do IDEB',
      'Princípios do DUA: engajamento, representação e expressão',
      'Construção do Plano de Desenvolvimento Individualizado (PDI)'
    ]
  }
];

export interface EditalLeafNode {
  id: string;
  category: SubjectCategory;
  subject: string;
  blockName: string;
  parentTopicName: string;
  leafName: string;
  status: TopicStatus;
}

/**
 * Percorre recursivamente o JSON do edital e expande cada bloco até encontrar APENAS os nós folha (leaf nodes).
 * É PROIBIDO usar nós intermediários como conteúdo de estudo quando existirem filhos.
 */
export function extractEditalLeafNodes(userDegree?: string): EditalLeafNode[] {
  const leaves: EditalLeafNode[] = [];

  // 1. Processa as 4 Áreas de Conhecimento Geral
  const generalCats = OFFICIAL_EDITAL_TREE.geral;
  (Object.keys(generalCats) as GeneralCategoryKey[]).forEach((catKey) => {
    const blocks = generalCats[catKey];
    blocks.forEach((block) => {
      block.topics.forEach((topic) => {
        if (!topic.subtopics || topic.subtopics.length === 0) {
          // O próprio tópico é o nó folha
          leaves.push({
            id: topic.id,
            category: catKey as SubjectCategory,
            subject: catKey,
            blockName: block.name,
            parentTopicName: topic.name,
            leafName: topic.name,
            status: topic.status || 'not_started'
          });
        } else {
          // Apenas os subtópicos são nós folha
          topic.subtopics.forEach((sub) => {
            leaves.push({
              id: sub.id,
              category: catKey as SubjectCategory,
              subject: catKey,
              blockName: block.name,
              parentTopicName: topic.name,
              leafName: sub.name,
              status: sub.status || 'not_started'
            });
          });
        }
      });
    });
  });

  // 2. Processa o Conteúdo Específico da Licenciatura
  const specBlocks = getBlocksForDegree(userDegree);
  const specSubjectName = `Conhecimentos Específicos (${userDegree || 'Licenciatura'})`;
  specBlocks.forEach((block) => {
    block.topics.forEach((topic) => {
      if (!topic.subtopics || topic.subtopics.length === 0) {
        leaves.push({
          id: topic.id,
          category: 'Conhecimentos Específicos',
          subject: specSubjectName,
          blockName: block.name,
          parentTopicName: topic.name,
          leafName: topic.name,
          status: topic.status || 'not_started'
        });
      } else {
        topic.subtopics.forEach((sub) => {
          leaves.push({
            id: sub.id,
            category: 'Conhecimentos Específicos',
            subject: specSubjectName,
            blockName: block.name,
            parentTopicName: topic.name,
            leafName: sub.name,
            status: sub.status || 'not_started'
          });
        });
      }
    });
  });

  return leaves;
}

export interface InterleavedQueueItem {
  id: string;
  category: SubjectCategory;
  subject: string;
  blockName: string;
  parentTopicName: string;
  subtopicNames: string[];
  type: 'especifico' | 'geral';
}

/**
 * Cria uma FILA ÚNICA E INTERCALADA de estudos (Interleaving Queue).
 * Intercala ordenadamente lotes de Conhecimentos Específicos e Conhecimentos Gerais.
 * Proporção: 2 lotes Específicos (~65%) para 1 lote Geral (~35%).
 */
export function buildInterleavedStudyQueue(userDegree?: string): InterleavedQueueItem[] {
  const leaves = extractEditalLeafNodes(userDegree);
  const specLeaves = leaves.filter(l => l.category === 'Conhecimentos Específicos');
  const genLeaves = leaves.filter(l => l.category !== 'Conhecimentos Específicos');

  const createBatches = (leafList: EditalLeafNode[], itemType: 'especifico' | 'geral') => {
    const batches: InterleavedQueueItem[] = [];
    let currentBatch: EditalLeafNode[] = [];

    leafList.forEach((node) => {
      if (currentBatch.length === 0) {
        currentBatch.push(node);
      } else {
        const first = currentBatch[0];
        if (node.parentTopicName === first.parentTopicName && node.blockName === first.blockName && currentBatch.length < 2) {
          currentBatch.push(node);
        } else {
          batches.push({
            id: `q_batch_${batches.length}_${first.id}`,
            category: first.category,
            subject: first.subject,
            blockName: first.blockName,
            parentTopicName: first.parentTopicName,
            subtopicNames: currentBatch.map(b => b.leafName),
            type: itemType
          });
          currentBatch = [node];
        }
      }
    });

    if (currentBatch.length > 0) {
      const first = currentBatch[0];
      batches.push({
        id: `q_batch_${batches.length}_${first.id}`,
        category: first.category,
        subject: first.subject,
        blockName: first.blockName,
        parentTopicName: first.parentTopicName,
        subtopicNames: currentBatch.map(b => b.leafName),
        type: itemType
      });
    }

    return batches;
  };

  const specBatches = createBatches(specLeaves, 'especifico');
  const genBatches = createBatches(genLeaves, 'geral');

  const queue: InterleavedQueueItem[] = [];
  let sIdx = 0;
  let gIdx = 0;

  // Intercala rigorosamente: 2 lotes Específicos, 1 lote Geral
  while (sIdx < specBatches.length || gIdx < genBatches.length) {
    if (sIdx < specBatches.length) queue.push(specBatches[sIdx++]);
    if (sIdx < specBatches.length) queue.push(specBatches[sIdx++]);
    if (gIdx < genBatches.length) queue.push(genBatches[gIdx++]);

    if (sIdx >= specBatches.length && gIdx < genBatches.length) {
      queue.push(genBatches[gIdx++]);
    }
  }

  return queue;
}

/**
 * Função Inteligente para Gerar o Cronograma de Estudos Dia a Dia
 * REGRA ABSOLUTA DE INTERLEAVING (Aprendizagem Intercalada)
 */
export function generateStudySchedule(
  profile: Partial<UserProfile>,
  topics?: EditalTopic[]
): ScheduleDay[] {
  const activeDegree = profile.degree || profile.targetSubject || 'Licenciatura em Biologia / Ciências Biológicas';
  const leaves = extractEditalLeafNodes(activeDegree);

  const specLeaves = leaves.filter(l => l.category === 'Conhecimentos Específicos');
  const genLeaves = leaves.filter(l => l.category !== 'Conhecimentos Específicos');

  const createBatchesFromLeaves = (leafList: EditalLeafNode[], itemType: 'especifico' | 'geral') => {
    const batches: InterleavedQueueItem[] = [];
    let currentBatch: EditalLeafNode[] = [];

    leafList.forEach((node) => {
      if (currentBatch.length === 0) {
        currentBatch.push(node);
      } else {
        const first = currentBatch[0];
        // Lote compacto: no máximo 2 subtópicos por sessão de estudo
        if (node.parentTopicName === first.parentTopicName && node.blockName === first.blockName && currentBatch.length < 2) {
          currentBatch.push(node);
        } else {
          batches.push({
            id: `q_b_${batches.length}_${first.id}`,
            category: first.category,
            subject: first.subject,
            blockName: first.blockName,
            parentTopicName: first.parentTopicName,
            subtopicNames: currentBatch.map(b => b.leafName),
            type: itemType
          });
          currentBatch = [node];
        }
      }
    });

    if (currentBatch.length > 0) {
      const first = currentBatch[0];
      batches.push({
        id: `q_b_${batches.length}_${first.id}`,
        category: first.category,
        subject: first.subject,
        blockName: first.blockName,
        parentTopicName: first.parentTopicName,
        subtopicNames: currentBatch.map(b => b.leafName),
        type: itemType
      });
    }

    return batches;
  };

  const specBatches = createBatchesFromLeaves(specLeaves, 'especifico');
  const genBatches = createBatchesFromLeaves(genLeaves, 'geral');

  const startDateStr = profile.startDate || new Date().toISOString().split('T')[0];
  const examDateStr = profile.examDate || '2026-10-18';

  const start = new Date(startDateStr + 'T00:00:00');
  const exam = new Date(examDateStr + 'T00:00:00');

  const diffTime = Math.max(86400000, exam.getTime() - start.getTime());
  const totalDays = Math.min(180, Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24))));

  const hours = profile.hoursPerDay || 3;
  const daysOfWeekFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const scheduleDays: ScheduleDay[] = [];

  let specIndex = 0;
  let genIndex = 0;

  const historyByDay: Record<number, { blockName: string; parentTopicName: string; subtopics: string[]; category: string }[]> = {};

  for (let i = 0; i < totalDays; i++) {
    const dayNum = i + 1;
    const currentDate = new Date(start.getTime() + i * 86400000);
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayNameFull = daysOfWeekFull[currentDate.getDay()];
    const dayFormatted = `${String(currentDate.getDate()).padStart(2, '0')}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${currentDate.getFullYear()} (${dayNameFull})`;

    const dayTopicsList: ScheduleTopicItem[] = [];
    const dayStudiedSessions: { blockName: string; parentTopicName: string; subtopics: string[]; category: string }[] = [];

    // --- SESSÃO 1: CONTEÚDO ESPECÍFICO ---
    if (specBatches.length > 0) {
      const specBatch = specBatches[specIndex % specBatches.length];
      specIndex++;

      const specQuestions = 10;

      dayTopicsList.push({
        id: `sched_d${dayNum}_spec_${specBatch.id}`,
        category: specBatch.category,
        subject: specBatch.subject,
        blockName: specBatch.blockName,
        parentTopicName: specBatch.parentTopicName,
        subtopicNames: specBatch.subtopicNames,
        completed: false,
        questionsGoal: `${specQuestions} questões`,
        reviewType: 'Específica'
      });

      dayStudiedSessions.push({
        blockName: specBatch.blockName,
        parentTopicName: specBatch.parentTopicName,
        subtopics: specBatch.subtopicNames,
        category: 'Específica'
      });
    }

    // --- SESSÃO 2: CONTEÚDO GERAL ---
    if (genBatches.length > 0) {
      const genBatch = genBatches[genIndex % genBatches.length];
      genIndex++;

      const genQuestions = 5;

      dayTopicsList.push({
        id: `sched_d${dayNum}_gen_${genBatch.id}`,
        category: genBatch.category,
        subject: genBatch.subject,
        blockName: genBatch.blockName,
        parentTopicName: genBatch.parentTopicName,
        subtopicNames: genBatch.subtopicNames,
        completed: false,
        questionsGoal: `${genQuestions} questões`,
        reviewType: 'Geral'
      });

      dayStudiedSessions.push({
        blockName: genBatch.blockName,
        parentTopicName: genBatch.parentTopicName,
        subtopics: genBatch.subtopicNames,
        category: 'Geral'
      });
    }

    historyByDay[dayNum] = dayStudiedSessions;

    // --- REVISÃO ESPAÇADA ---
    const reviewsDueToday: {
      type: 'Revisão 24h' | 'Revisão 7d' | 'Revisão 30d';
      fromDayNumber: number;
      subtopics: string[];
      parentTopicName: string;
      blockName: string;
    }[] = [];

    if (dayNum > 1 && historyByDay[dayNum - 1]) {
      historyByDay[dayNum - 1].forEach(prev => {
        reviewsDueToday.push({
          type: 'Revisão 24h',
          fromDayNumber: dayNum - 1,
          subtopics: prev.subtopics,
          parentTopicName: prev.parentTopicName,
          blockName: prev.blockName
        });
      });
    }

    if (dayNum > 7 && historyByDay[dayNum - 7]) {
      historyByDay[dayNum - 7].forEach(prev => {
        reviewsDueToday.push({
          type: 'Revisão 7d',
          fromDayNumber: dayNum - 7,
          subtopics: prev.subtopics,
          parentTopicName: prev.parentTopicName,
          blockName: prev.blockName
        });
      });
    }

    if (dayNum > 30 && historyByDay[dayNum - 30]) {
      historyByDay[dayNum - 30].forEach(prev => {
        reviewsDueToday.push({
          type: 'Revisão 30d',
          fromDayNumber: dayNum - 30,
          subtopics: prev.subtopics,
          parentTopicName: prev.parentTopicName,
          blockName: prev.blockName
        });
      });
    }

    scheduleDays.push({
      dateStr,
      displayDate: dayFormatted,
      dayNumber: dayNum,
      timeSlotFormatted: `${hours}h/dia`,
      topics: dayTopicsList,
      reviewsDueToday
    });
  }

  return scheduleDays;
}

