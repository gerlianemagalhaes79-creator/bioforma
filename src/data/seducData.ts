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
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-1-1-1', name: '1.1 Teoria da Educação e Diferentes Correntes do Pensamento Pedagógico Brasileiro', status: 'not_started' },
              { id: 'sub-eb-1-1-2', name: '1.2 Projeto Político Pedagógico (PPP)', status: 'not_started' }
            ]
          },
          {
            id: 'top-eb-1-2',
            name: '2. A Didática e o Processo de Ensino e Aprendizagem',
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-1-2-1', name: '2.1 Organização do Processo Didático: Planejamento, Estratégias e Metodologias, Avaliação', status: 'not_started' },
              { id: 'sub-eb-1-2-2', name: '2.2 A Sala de Aula como Espaço de Aprendizagem e Interação', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-2-1-1', name: '3.1 Inatismo, Comportamentalismo, Behaviorismo, Interacionismo, Cognitivismo', status: 'not_started' },
              { id: 'sub-eb-2-1-2', name: '3.2 As Bases Empíricas, Metodológicas e Epistemológicas das Diversas Teorias de Aprendizagem', status: 'not_started' },
              { id: 'sub-eb-2-1-3', name: '3.3 Contribuições de Piaget, Vygotsky e Wallon para a Psicologia e Pedagogia', status: 'not_started' },
              { id: 'sub-eb-2-1-4', name: '3.4 Teoria das Inteligências Múltiplas de Gardner', status: 'not_started' },
              { id: 'sub-eb-2-1-5', name: '3.5 Psicologia do Desenvolvimento: Aspectos Históricos e Biopsicossociais', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-eb-3-1-1', name: '4.1 Acesso, Permanência e Sucesso do Aluno na Escola', status: 'not_started' },
              { id: 'sub-eb-3-1-2', name: '4.2 Gestão da Aprendizagem', status: 'not_started' },
              { id: 'sub-eb-3-1-3', name: '4.3 Planejamento e Gestão Educacional', status: 'not_started' },
              { id: 'sub-eb-3-1-4', name: '4.4 Avaliação Institucional, de Desempenho e de Aprendizagem', status: 'not_started' },
              { id: 'sub-eb-3-1-5', name: '4.5 O Professor: Formação e Profissão', status: 'not_started' },
              { id: 'sub-eb-3-1-6', name: '4.6 A Pesquisa na Prática Docente', status: 'not_started' },
              { id: 'sub-eb-3-1-7', name: '4.7 A Dimensão Ética da Profissão', status: 'not_started' }
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
              { id: 'sub-eb-4-1-4', name: '6.2 Educação Inclusiva na Educação Básica', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-1-1-1', name: '1. Conceito de Administração Pública e 2. Conceito de Servidor Público', status: 'not_started' },
              { id: 'sub-adm-1-1-2', name: '3. Princípios da Administração Pública', status: 'not_started' },
              { id: 'sub-adm-1-1-3', name: '4. Direitos e Deveres dos Servidores Públicos', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-2-1-1', name: '6.1 Estatuto dos Funcionários Públicos Civis do CE (Lei nº 9.826/1974): 6.1.1 Do provimento dos cargos (Cap. I a X)', status: 'not_started' },
              { id: 'sub-adm-2-1-2', name: '6.1.2 Dos direitos, vantagens e autorizações (Cap. I a VI)', status: 'not_started' },
              { id: 'sub-adm-2-1-3', name: '6.1.3 Do regime disciplinar (Título VI - Cap. I a VII)', status: 'not_started' },
              { id: 'sub-adm-2-1-4', name: '6.2 Lei nº 15.243/2012 (Disciplina o Art. 3º da Lei nº 15.064/2011)', status: 'not_started' },
              { id: 'sub-adm-2-1-5', name: '6.3 Estágio Probatório Servidor Estadual (Lei nº 9.826/74, Lei nº 13.092/01, Lei nº 15.744/14 e Lei nº 15.909/15)', status: 'not_started' }
            ]
          },
          {
            id: 'top-adm-2-2',
            name: '6.4 a 6.7 Carreira, Carga Horária, Promoção e Remuneração do Magistério (Grupo MAG)',
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-2-2-1', name: '6.4 Carreira do Magistério: Concurso, Provimento, Carga Horária e Jornada (Lei nº 10.884/1984, Lei nº 12.066/1993, Lei nº 14.404/2009)', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-adm-3-1-1', name: '1. Lei nº 9.394/1996 e alterações (Lei de Diretrizes e Bases da Educação Nacional - LDB)', status: 'not_started' },
              { id: 'sub-adm-3-1-2', name: '2. Lei nº 8.069/1990 e alterações (Estatuto da Criança e do Adolescente - ECA)', status: 'not_started' },
              { id: 'sub-adm-3-1-3', name: '3. Constituição da República Federativa do Brasil (Art. 205 a 214)', status: 'not_started' },
              { id: 'sub-adm-3-1-4', name: '4. Emenda Constitucional nº 53/2006 e 5. Lei nº 11.494/2007 e alterações (FUNDEB)', status: 'not_started' },
              { id: 'sub-adm-3-1-5', name: '6. Lei nº 11.114/2005, 7. Lei nº 11.274/2006 e 8. Lei nº 13.415/2017 (Reforma do Ensino Médio)', status: 'not_started' }
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-lp-1-1-1', name: '1. Compreensão e Interpretação de Textos', status: 'not_started' },
              { id: 'sub-lp-1-1-2', name: '2. Tipologia Textual', status: 'not_started' },
              { id: 'sub-lp-1-1-3', name: '11. Significação das Palavras', status: 'not_started' }
            ]
          },
          {
            id: 'top-lp-1-2',
            name: 'Ortografia e Acentuação',
            status: 'not_started',
            subtopics: [
              { id: 'sub-lp-1-2-1', name: '3. Ortografia Oficial', status: 'not_started' },
              { id: 'sub-lp-1-2-2', name: '4. Acentuação Gráfica', status: 'not_started' }
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-lp-2-1-1', name: '5. Emprego das Classes de Palavras', status: 'not_started' },
              { id: 'sub-lp-2-1-2', name: '6. Emprego do Sinal Indicativo de Crase', status: 'not_started' },
              { id: 'sub-lp-2-1-3', name: '10. Regência Nominal e Verbal', status: 'not_started' }
            ]
          },
          {
            id: 'top-lp-2-2',
            name: 'Sintaxe, Concordância e Pontuação',
            status: 'not_started',
            subtopics: [
              { id: 'sub-lp-2-2-1', name: '7. Sintaxe da Oração e do Período', status: 'not_started' },
              { id: 'sub-lp-2-2-2', name: '8. Pontuação', status: 'not_started' },
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
            status: 'not_started',
            subtopics: [
              { id: 'sub-dad-1-1-1', name: 'Leitura e Interpretação de Dados Referentes à Matrícula e Taxa de Atendimento Escolar', status: 'not_started' },
              { id: 'sub-dad-1-1-2', name: 'Taxas de Escolarização Líquida e Bruta', status: 'not_started' }
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
              { id: 'sub-dad-2-2-1', name: 'Leitura e Interpretação de Dados Apresentados em Tabelas, Gráficos e Mapas', status: 'not_started' },
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
  // --- CONHECIMENTOS PEDAGÓGICOS E TEMAS EDUCACIONAIS ---
  {
    id: 'q-ped-1',
    category: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    topic: 'História do Pensamento Pedagógico',
    subtopic: 'Tendências Pedagógicas',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Segundo a classificação proposta por José Carlos Libâneo, as tendências pedagógicas brasileiras dividem-se em Liberais e Progressistas. Sobre a Tendência Liberal Tecnicista, assinale a opção correta:',
    options: [
      { letter: 'A', text: 'Modela o comportamento humano por meio de técnicas específicas, subordinando a educação à sociedade e priorizando a formação de indivíduos para o mercado de trabalho.' },
      { letter: 'B', text: 'Fundamenta-se na auto-organização dos alunos, priorizando a transformação da personalidade num sentido libertário e autogestionário.' },
      { letter: 'C', text: 'Assume um compromisso com a transformação social a partir do desenvolvimento da consciência crítica e da problematização da realidade do educando.' },
      { letter: 'D', text: 'Prioriza a transmissão dos conteúdos acumulados pela humanidade, centrando a relação pedagógica na autoridade do professor e na disciplina.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A Tendência Liberal Tecnicista foca na eficiência, no comportamentalismo e no adestramento para o mercado de trabalho. A opção B refere-se à Progressista Libertária; a C, à Progressista Libertadora; e a D, à Liberal Tradicional.',
    difficulty: 'médio',
    skills: ['Classificação de Libâneo', 'Tendências Pedagógicas']
  },
  {
    id: 'q-ped-2',
    category: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    topic: 'Didática e Aprendizagem',
    subtopic: 'Avaliação da Aprendizagem',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Na concepção de Cipriano Luckesi, a avaliação da aprendizagem escolar distingue-se essencialmente da verificação. Sob a ótica da avaliação formativa e diagnóstica, assinale a afirmativa correta:',
    options: [
      { letter: 'A', text: 'A avaliação possui caráter dinâmico e processual, funcionando como instrumento de diagnóstico e orientação do fluxo de aprendizagem para a tomada de decisões pedagógicas.' },
      { letter: 'B', text: 'A avaliação limita-se à atribuição de notas e conceitos finais para fins de seleção, retenção e rotulagem dos estudantes.' },
      { letter: 'C', text: 'A verificação estática do rendimento substitui a necessidade de intervenção contínua e recomposição de aprendizagem pelo docente.' },
      { letter: 'D', text: 'A prática avaliativa deve ocorrer exclusivamente ao final do período letivo, vedada a utilização de instrumentos qualitativos diversificados.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. Luckesi defende a avaliação como prática inclusiva e amorosa, orientada ao diagnóstico e à reorientação da aprendizagem, opondo-se à mera verificação punitiva e classificatória.',
    difficulty: 'médio',
    skills: ['Avaliação Diagnóstica e Formativa', 'Doutrina de Luckesi']
  },
  {
    id: 'q-ped-3',
    category: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    topic: 'Psicologia do Desenvolvimento',
    subtopic: 'Teoria Sociointeracionista',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Lev Vygotsky postula que o desenvolvimento das funções psicológicas superiores é mediado por instrumentos e signos na interação social. Acerca do conceito de Zona de Desenvolvimento Proximal (ZDP), assinale a opção correta:',
    options: [
      { letter: 'A', text: 'Representa a distância entre o nível de desenvolvimento real, determinado pela capacidade de resolver problemas independentemente, e o nível de desenvolvimento potencial, determinado pela resolução sob mediação.' },
      { letter: 'B', text: 'Define o conjunto de estruturas biológicas maturacionais que limitam de forma irreversível a capacidade de aprendizagem do indivíduo em cada faixa etária.' },
      { letter: 'C', text: 'Refere-se ao estágio final do desenvolvimento cognitivo em que o estudante não necessita de nenhuma influência do meio sociocultural.' },
      { letter: 'D', text: 'Consiste na assimilação de esquemas mentais pré-existentes sem modificação das estruturas cognitivas do sujeito.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A ZDP em Vygotsky é a zona em que a intervenção pedagógica e a mediação do professor e dos pares provocam avanços no desenvolvimento do estudante.',
    difficulty: 'avançado',
    skills: ['Sociointeracionismo', 'Conceito de ZDP']
  },
  {
    id: 'q-ped-4',
    category: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    subject: 'Educação Brasileira: Temas Educacionais e Pedagógicos',
    topic: 'Gestão Escolar e PPP',
    subtopic: 'Projeto Político-Pedagógico',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Segundo Ilma Passos Alencastro Veiga, o Projeto Político-Pedagógico (PPP) da escola pública expressa a própria identidade da instituição. Assinale a afirmativa que expressa a dimensão política e pedagógica do PPP:',
    options: [
      { letter: 'A', text: 'É político por comprometer-se com a formação do cidadão para um tipo de sociedade, e pedagógico por organizar intencionalmente as ações educativas da escola.' },
      { letter: 'B', text: 'É político por subordinar-se às diretrizes partidárias do governo de ocasião, e pedagógico por padronizar as cartilhas de ensino.' },
      { letter: 'C', text: 'Trata-se de um plano técnico-operacional elaborado isoladamente pelos gestores escolares para cumprimento de exigências burocráticas.' },
      { letter: 'D', text: 'Constitui um regimento estático cujas metas não podem ser revisadas pela comunidade escolar ou pelos conselhos da escola.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. Veiga articula o PPP nas dimensões indissociáveis do compromisso sociopolítico (formação cidadã) e do fazer pedagógico (intencionalidade docente).',
    difficulty: 'médio',
    skills: ['Projeto Político Pedagógico', 'Doutrina de Veiga']
  },

  // --- LEGISLAÇÃO E ADMINISTRAÇÃO PÚBLICA ---
  {
    id: 'q-leg-1',
    category: 'Administração Pública',
    subject: 'Administração Pública',
    topic: 'LDB nº 9.394/96',
    subtopic: 'Princípios da Educação Nacional',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'O Artigo 3º da Lei nº 9.394/96 (LDB) estabelece os princípios que regem o ensino nacional. Com base nas recentes alterações legislativas, assinale a opção que apresenta CORRETAMENTE um desses princípios:',
    options: [
      { letter: 'A', text: 'Garantia do direito à educação e à aprendizagem ao longo da vida, aliada ao respeito à diversidade humana, linguística, cultural e identitária das pessoas surdas, surdocegas e com deficiência auditiva.' },
      { letter: 'B', text: 'Uniformidade de critérios pedagógicos com vedação expressa do pluralismo de ideias e de concepções pedagógicas.' },
      { letter: 'C', text: 'Obrigatoriedade de vinculação exclusiva entre a educação escolar e o mercado de trabalho corporativo, com exclusão de práticas sociais.' },
      { letter: 'D', text: 'Centralização das decisões financeiras nos órgãos normativos estaduais com eliminação da autonomia das unidades escolares.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A LDB consagrou o direito à aprendizagem ao longo da vida (Inciso XIII) e a modalidade de Educação Bilíngue de Surdos (Inciso XIV).',
    difficulty: 'médio',
    skills: ['LDB Art. 3º', 'Princípios Constitucionais e Legais']
  },
  {
    id: 'q-leg-2',
    category: 'Administração Pública',
    subject: 'Administração Pública',
    topic: 'Estatuto do Magistério do CE',
    subtopic: 'Direitos e Deveres do Servidor Estadual',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'À luz do Estatuto dos Funcionários Públicos Civis do Estado do Ceará (Lei nº 9.826/1974) e da Lei nº 10.884/1984 (Estatuto do Magistério do CE), assinale a alternativa INCORRETA sobre as obrigações do docente:',
    options: [
      { letter: 'A', text: 'É dever do servidor público estadual exercer com zelo e dedicação as atribuições do seu cargo, bem como ser leal às instituições a que servir.' },
      { letter: 'B', text: 'É facultado ao professor estadual recusar-se a prestar informações às autoridades competentes quando solicitado no interesse da Administração Pública.' },
      { letter: 'C', text: 'Constitui infração disciplinar ausentar-se do serviço durante o expediente sem prévia autorização do chefe imediato.' },
      { letter: 'D', text: 'O servidor responde civil, penal e administrativamente pelo exercício irregular de suas atribuições institucionais.' }
    ],
    correctAnswer: 'B',
    explanation: 'Gabarito FUNECE: B (Incorreta). Prestar informações do interesse público é dever funcional do servidor e do professor estadual, não sendo uma faculdade.',
    difficulty: 'médio',
    skills: ['Lei nº 9.826/74', 'Estatuto do Magistério do Ceará']
  },
  {
    id: 'q-leg-3',
    category: 'Administração Pública',
    subject: 'Administração Pública',
    topic: 'Constituição Federal',
    subtopic: 'Artigos 205 a 214 da CF/88',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'A Constituição Federal de 1988 estabelece, no Artigo 206, os princípios do ensino público no Brasil. Sobre a valorização dos profissionais da educação escolar, assinale a afirmativa correta:',
    options: [
      { letter: 'A', text: 'A garantia de planos de carreira para os profissionais da educação escolar pública exige ingresso exclusivamente por concurso público de provas e títulos.' },
      { letter: 'B', text: 'O ingresso na carreira do magistério público estadual pode dar-se por indicação política com dispensa de processo seletivo público.' },
      { letter: 'C', text: 'A fixação do piso salarial nacional profissional do magistério público compete individualmente aos municípios sem amparo em lei federal.' },
      { letter: 'D', text: 'A gestão democrática do ensino público aplica-se apenas às instituições de ensino privado de nível superior.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. O Art. 206, V, da CF/88 estabelece planos de carreira para o magistério público, com ingresso exclusivo por concurso público de provas e títulos.',
    difficulty: 'fácil',
    skills: ['CF/88 Art. 206', 'Concurso Público e Magistério']
  },

  // --- LÍNGUA PORTUGUESA ---
  {
    id: 'q-lp-1',
    category: 'Língua Portuguesa',
    subject: 'Língua Portuguesa',
    topic: 'Sintaxe e Crase',
    subtopic: 'Regência e Emprego do Sinal Indicativo de Crase',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Considere a frase: "O professor de Língua Portuguesa referiu-se ___ exigências da FUNECE e dirigiu-se ___ alunas que solicitavam acesso ___ matriz curricular." Assinale a opção que preenche corretamente as lacunas:',
    options: [
      { letter: 'A', text: 'às – às – à' },
      { letter: 'B', text: 'as – as – a' },
      { letter: 'C', text: 'às – as – à' },
      { letter: 'D', text: 'as – às – a' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. 1) referiu-se "a" + "as exigências" = "às exigências". 2) dirigiu-se "a" + "as alunas" = "às alunas". 3) acesso "a" + "a matriz" = "à matriz". Todas as lacunas exigem crase.',
    difficulty: 'médio',
    skills: ['Crase e Regência Verbal', 'Gramática FUNECE']
  },
  {
    id: 'q-lp-2',
    category: 'Língua Portuguesa',
    subject: 'Língua Portuguesa',
    topic: 'Concordância Verbal',
    subtopic: 'Casos Especiais de Concordância',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Analise a concordância verbal nas frases abaixo segundo a norma-padrão da Língua Portuguesa e assinale a opção inteiramente CORRETA:',
    options: [
      { letter: 'A', text: 'Fazem muitos anos que a rede estadual de ensino promove a Semana Universitária com palestras acadêmicas.' },
      { letter: 'B', text: 'Haviam muitos candidatos inscritos no concurso de professor da SEDUC-CE na sede da banca examinadora.' },
      { letter: 'C', text: 'Mais de um professor aprovado no certame assinou o termo de posse durante a solenidade oficial.' },
      { letter: 'D', text: 'Tratam-se de questões de elevado nível técnico elaboradas para selecionar os docentes da rede pública.' }
    ],
    correctAnswer: 'C',
    explanation: 'Gabarito FUNECE: C. "Mais de um" exige verbo no singular ("assinou"). Nas demais: A) "Faz muitos anos" (verbo fazer impessoal indicando tempo); B) "Havia muitos candidatos" (verbo haver impessoal no sentido de existir); D) "Trata-se de questões" (verbo seguido de preposição com índice de indeterminação do sujeito fica no singular).',
    difficulty: 'avançado',
    skills: ['Concordância Verbal', 'Verbos Impessoais']
  },
  {
    id: 'q-lp-3',
    category: 'Língua Portuguesa',
    subject: 'Língua Portuguesa',
    topic: 'Pontuação e Sintaxe',
    subtopic: 'Orações Subordinadas Adjetivas',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Observe a diferença entre os períodos: I. "Os professores da rede estadual, que concluíram o mestrado, receberão gratificação." II. "Os professores da rede estadual que concluíram o mestrado receberão gratificação." Sob o aspecto sintático-semântico, assinale a análise correta:',
    options: [
      { letter: 'A', text: 'Em I, a oração é adjetiva explicativa, indicando que TODOS os professores da rede concluíram o mestrado; em II, a oração é adjetiva restritiva, restringindo a gratificação APENAS aos que têm mestrado.' },
      { letter: 'B', text: 'Em I e II, o sentido do período é idêntico, sendo o uso das vírgulas meramente estético sem impacto no significado.' },
      { letter: 'C', text: 'Em I, a oração isolada por vírgulas exerce função de adjunto adverbial de causa; em II, exerce função de complemento nominal.' },
      { letter: 'D', text: 'A presença das vírgulas em I torna o período gramaticalmente incorreto segundo a norma culta.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A pontuação em orações adjetivas altera radicalmente o valor semântico: com vírgulas é explicativa (generalizante); sem vírgulas é restritiva (limitadora).',
    difficulty: 'médio',
    skills: ['Orações Adjetivas', 'Valor das Vírgulas']
  },

  // --- LEITURA E INTERPRETAÇÃO DE DADOS EDUCACIONAIS ---
  {
    id: 'q-dad-1',
    category: 'Leitura e Interpretação de Dados e Indicadores Educacionais',
    subject: 'Leitura e Interpretação de Dados e Indicadores Educacionais',
    topic: 'Indicadores do Ceará',
    subtopic: 'SPAECE e IDEB',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'O Índice de Desenvolvimento da Educação Básica (IDEB) combina dois indicadores fundamentais para mensurar a qualidade do ensino. Assinale a alternativa que indica CORRETAMENTE a composição do IDEB:',
    options: [
      { letter: 'A', text: 'O fluxo escolar (taxa de aprovação obtida no Censo Escolar) e as notas médias de proficiência nas avaliações em larga escala (Saeb/Spaece).' },
      { letter: 'B', text: 'O orçamento anual repassado pelo FUNDEB e a taxa de investimento em infraestrutura predial das escolas.' },
      { letter: 'C', text: 'A quantidade de alunos matriculados em tempo integral e a taxa de formação continuada dos docentes.' },
      { letter: 'D', text: 'A porcentagem de aprovação nas universidades públicas e o índice de frequência diária dos estudantes.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. O IDEB é calculado pelo produto entre o indicador de rendimento escolar (aprovação) e a nota média de desempenho nas avaliações do Saeb/Spaece.',
    difficulty: 'fácil',
    skills: ['Composição do IDEB', 'Indicadores Educacionais']
  },

  // --- BIOLOGIA (CONHECIMENTOS ESPECÍFICOS) ---
  {
    id: 'q-bio-1',
    category: 'Conhecimentos Específicos',
    subject: 'Biologia',
    topic: 'Biologia Celular e Bioenergética',
    subtopic: 'Respiração Celular e Fosforilação Oxidativa',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'A respiração celular aeróbica compreende a glicólise, o ciclo de Krebs e a fosforilação oxidativa. Em relação à cadeia respiratória localizada na crista mitocondrial de eucariotos, assinale a opção correta:',
    options: [
      { letter: 'A', text: 'O fluxo de elétrons ao longo dos complexos proteicos gera um gradiente de prótons (H+) no espaço intermembranas, impulsionando a síntese de ATP pela ATP sintase quando os prótons retornam à matriz.' },
      { letter: 'B', text: 'O oxigênio molecular atua como aceptor inicial de elétrons no complexo I, sendo reduzido a dióxido de carbono durante a glicólise.' },
      { letter: 'C', text: 'A fosforilação oxidativa ocorre no hialoplasma celular sem dependência da integridade da membrana mitocondrial interna.' },
      { letter: 'D', text: 'A quebra direta da glicose em duas moléculas de piruvato gera a maior fatia de ATP de todo o processo aeróbico.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A hipótese quimiosmótica de Peter Mitchell explica que a cadeia de elétrons bombeia H+ para o espaço intermembranas, criando a força próton-motriz que aciona a ATP sintase.',
    difficulty: 'avançado',
    skills: ['Fosforilação Oxidativa', 'Cadeia de Elétrons']
  },
  {
    id: 'q-bio-2',
    category: 'Conhecimentos Específicos',
    subject: 'Biologia',
    topic: 'Genética e Biologia Molecular',
    subtopic: 'Síntese Proteica e Código Genético',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'O código genético é considerado universal e degenerado. O termo "degenerado" (ou redundante) significa que:',
    options: [
      { letter: 'A', text: 'Diferentes códons (trincas de nucleotídeos no RNAm) podem codificar o mesmo aminoácido.' },
      { letter: 'B', text: 'Um único códon é capaz de codificar múltiplos aminoácidos simultaneamente na mesma cadeia polipeptídica.' },
      { letter: 'C', text: 'O código sofre degradação enzimática durante o processo de transcrição no núcleo celular.' },
      { letter: 'D', text: 'As mutações de ponto alteram obrigatoriamente a estrutura primária da proteína produzida.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. Degenerado significa que existem 64 códons para 20 aminoácidos, logo, um aminoácido pode ser especificado por mais de uma trinca.',
    difficulty: 'médio',
    skills: ['Código Genético Degenerado', 'Síntese Proteica']
  },

  // --- HISTÓRIA (CONHECIMENTOS ESPECÍFICOS) ---
  {
    id: 'q-his-1',
    category: 'Conhecimentos Específicos',
    subject: 'História',
    topic: 'História do Ceará e do Brasil',
    subtopic: 'Sedição de Juazeiro e Coronelismo',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'A Sedição de Juazeiro (1914) constitui um episódio marcante da história política do Ceará durante a República Velha. Sobre as causas e desdobramentos desse conflito, assinale a afirmativa correta:',
    options: [
      { letter: 'A', text: 'A Sedição representou a reação das oligarquias cearenses, lideradas por Padre Cícero e Floro Bartolomeu, contra a Política das Salvações promovida pelo presidente Hermes da Fonseca.' },
      { letter: 'B', text: 'Tratou-se de uma revolta operária de inspiração anarquista que visava à implantação de uma república socialista no interior do Ceará.' },
      { letter: 'C', text: 'Foi um movimento de contestação militar liderado pela Coluna Prestes para derrubar o poder dos coronéis do Cariri.' },
      { letter: 'D', text: 'O conflito resultou na consolidação definitiva do governo de Franco Rabelo e na erradicação do coronelismo na região do Cariri.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A Sedição de Juazeiro opôs os coronéis e camponeses do Cariri (sob a liderança de Padre Cícero) ao governador Franco Rabelo, nomeado na esteira das "Salvações".',
    difficulty: 'avançado',
    skills: ['Sedição de Juazeiro 1914', 'História do Ceará']
  },

  // --- MATEMÁTICA (CONHECIMENTOS ESPECÍFICOS) ---
  {
    id: 'q-mat-1',
    category: 'Conhecimentos Específicos',
    subject: 'Matemática',
    topic: 'Funções e Álgebra',
    subtopic: 'Funções Exponenciais e Logarítmicas',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'Uma população de bactérias cresce segundo a função exponencial P(t) = P0 . 2^(k.t), onde t é o tempo em horas e P0 é a população inicial. Sabendo que a população triplica a cada 4 horas, o valor da constante k é igual a:',
    options: [
      { letter: 'A', text: 'log2(3) / 4' },
      { letter: 'B', text: '4 . log3(2)' },
      { letter: 'C', text: 'log3(4) / 2' },
      { letter: 'D', text: 'log2(4) / 3' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. P(4) = 3.P0 => P0 . 2^(4k) = 3.P0 => 2^(4k) = 3 => 4k = log2(3) => k = log2(3) / 4.',
    difficulty: 'avançado',
    skills: ['Equações Logarítmicas', 'Função Exponencial']
  },

  // --- GEOGRAFIA (CONHECIMENTOS ESPECÍFICOS) ---
  {
    id: 'q-geo-1',
    category: 'Conhecimentos Específicos',
    subject: 'Geografia',
    topic: 'Geografia do Brasil e do Ceará',
    subtopic: 'Domínio da Caatinga e Semiaridez',
    banca: 'FUNECE / CEV-UECE',
    questionText: 'O domínio morfoclimático da Caatinga abrange grande parte do território cearense. Sobre as características geoecológicas desse domínio, assinale a opção correta:',
    options: [
      { letter: 'A', text: 'Apresenta vegetação xerófila caducifólia, solos rasos e pedregosos na depressão sertaneja, e regime pluviométrico marcado por irregularidade e secas periódicas.' },
      { letter: 'B', text: 'Caracteriza-se por florestas latifoliadas ombrófilas e rios perenes de grande vazão ao longo de todo o sertão nordestino.' },
      { letter: 'C', text: 'Ocorre em clima temperado úmido com baixa evapotranspiração e solos profundos e ricos em matéria orgânica.' },
      { letter: 'D', text: 'Possui drenagem exorreica contínua sem a presença de rios temporários ou intermitentes.' }
    ],
    correctAnswer: 'A',
    explanation: 'Gabarito FUNECE: A. A Caatinga é marcada pelo clima semiárido, adaptações xerófilas da vegetação e rios temporários/intermitentes na depressão sertaneja.',
    difficulty: 'médio',
    skills: ['Domínio da Caatinga', 'Geografia do Ceará']
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
  leafIds: string[];
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
            leafIds: currentBatch.map(b => b.id),
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
        leafIds: currentBatch.map(b => b.id),
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
  const activeDegree = profile.degree || profile.targetSubject || 'Licenciatura em Língua Portuguesa / Letras';
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
            leafIds: currentBatch.map(b => b.id),
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
        leafIds: currentBatch.map(b => b.id),
        type: itemType
      });
    }

    return batches;
  };

  const specBatches = createBatchesFromLeaves(specLeaves, 'especifico');
  const genBatches = createBatchesFromLeaves(genLeaves, 'geral');

  // Ensure stable start date across sessions so topic IDs remain constant
  const startDateStr = profile.startDate || '2026-05-01';
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
        leafIds: specBatch.leafIds,
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
        leafIds: genBatch.leafIds,
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

    scheduleDays.push({
      dateStr,
      displayDate: dayFormatted,
      dayNumber: dayNum,
      timeSlotFormatted: `${hours}h/dia`,
      topics: dayTopicsList,
      reviewsDueToday: []
    });
  }

  return scheduleDays;
}

