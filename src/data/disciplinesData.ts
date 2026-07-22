import { EditalBlock } from '../types';

export const ALL_DISCIPLINES_EDITAL: Record<string, EditalBlock[]> = {
  'Licenciatura em Artes / Artes Visuais / Música': [
    {
      id: 'bloco-art-1',
      name: 'Conhecimentos Específicos - Arte-Educação',
      topics: [
        { id: 'top-art-1', name: '1 A arte na Educação para todos - LDB/PCN/RCB', status: 'not_started', subtopics: [] },
        { id: 'top-art-2', name: '2 Fundamentos e tendências pedagógicas do ensino de Arte no Brasil', status: 'not_started', subtopics: [] },
        { id: 'top-art-3', name: '3 A arte e o processo de construção da cidadania', status: 'not_started', subtopics: [] },
        { id: 'top-art-4', name: '4 As diversas linguagens artísticas: Estética - conceitos e contextos', status: 'not_started', subtopics: [] },
        { id: 'top-art-5', name: '5 Aspectos da cultura popular brasileira e as manifestações populares: formação histórica, multiculturalismo', status: 'not_started', subtopics: [] },
        {
          id: 'top-art-6',
          name: '6 A arte da pré-história brasileira e cearense',
          status: 'not_started',
          subtopics: [
            { id: 'sub-art-6-1', name: '6.1 Arte Indígena', status: 'not_started' },
            { id: 'sub-art-6-2', name: '6.2 Arte Africana', status: 'not_started' }
          ]
        },
        { id: 'top-art-7', name: '7 As artes visuais no Brasil e no Ceará: do barroco colonial brasileiro aos dias atuais', status: 'not_started', subtopics: [] },
        { id: 'top-art-8', name: '8 As artes audiovisuais: TV, cinema, fotografia, multimídia - novos recursos/novas linguagens', status: 'not_started', subtopics: [] },
        { id: 'top-art-9', name: '9 A música no Brasil e a contribuição cearense, partindo do período colonial aos nossos dias', status: 'not_started', subtopics: [] },
        { id: 'top-art-10', name: '10 O teatro no Brasil e no Ceará: história e movimentos', status: 'not_started', subtopics: [] },
        { id: 'top-art-11', name: '11 A dança no Brasil e no Ceará: dramática e folclórica, popular e erudita', status: 'not_started', subtopics: [] },
        { id: 'top-art-12', name: '12 Principais movimentos artísticos do século XX no Brasil', status: 'not_started', subtopics: [] },
        { id: 'top-art-13', name: '13 Lei nº 11.769/2009 - Ensino e aprendizagem da Música na Escola', status: 'not_started', subtopics: [] },
        { id: 'top-art-14', name: '14 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a Disciplina de Arte', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Biologia / Ciências Biológicas': [
    {
      id: 'bloco-bio-1',
      name: 'Conhecimentos Específicos - Biologia',
      topics: [
        {
          id: 'top-bio-1',
          name: '1 Identidade dos seres vivos',
          status: 'not_started',
          subtopics: [
            { id: 'sub-bio-1-1', name: '1.1 Aspectos físicos, químicos e estruturais da célula', status: 'not_started' },
            { id: 'sub-bio-1-2', name: '1.2 Organelas', status: 'not_started' },
            { id: 'sub-bio-1-3', name: '1.3 Organização celular: seres procariontes, eucariontes e sem organização celular', status: 'not_started' },
            { id: 'sub-bio-1-4', name: '1.4 Funções celulares: síntese, transporte, eliminação de substâncias e processos de obtenção de energia (fermentação, fotossíntese e respiração celular)', status: 'not_started' },
            { id: 'sub-bio-1-5', name: '1.5 Ciclo celular', status: 'not_started' }
          ]
        },
        { id: 'top-bio-2', name: '2 Noções básicas de microscopia', status: 'not_started', subtopics: [] },
        {
          id: 'top-bio-3',
          name: '3 Origem e evolução da vida',
          status: 'not_started',
          subtopics: [
            { id: 'sub-bio-3-1', name: '3.1 Hipóteses sobre a origem da vida', status: 'not_started' },
            { id: 'sub-bio-3-2', name: '3.2 Teoria de Lamarck e teoria de Darwin', status: 'not_started' },
            { id: 'sub-bio-3-3', name: '3.3 Origem do homem', status: 'not_started' }
          ]
        },
        {
          id: 'top-bio-4',
          name: '4 Diversidade da vida',
          status: 'not_started',
          subtopics: [
            { id: 'sub-bio-4-1', name: '4.1 Principais características dos representantes de cada domínio e de cada reino da natureza', status: 'not_started' },
            { id: 'sub-bio-4-2', name: '4.2 Regras de nomenclatura', status: 'not_started' },
            { id: 'sub-bio-4-3', name: '4.3 Biodiversidade no planeta e no Brasil', status: 'not_started' }
          ]
        },
        { id: 'top-bio-5', name: '5 Características anatômicas e fisiológicas do homem: fisiologia dos sistemas biológicos (digestório, respiratório, cardiovascular, urinário, nervoso, endócrino, imunológico, reprodutor e locomotor)', status: 'not_started', subtopics: [] },
        {
          id: 'top-bio-6',
          name: '6 Transmissão da vida',
          status: 'not_started',
          subtopics: [
            { id: 'sub-bio-6-1', name: '6.1 Fundamentos da hereditariedade: gene e código genético, cálculos com probabilidade', status: 'not_started' },
            { id: 'sub-bio-6-2', name: '6.2 Primeira e segunda leis de Mendel', status: 'not_started' },
            { id: 'sub-bio-6-3', name: '6.3 Aplicações da engenharia genética: clonagem, transgênicos', status: 'not_started' }
          ]
        },
        {
          id: 'top-bio-7',
          name: '7 Interação entre os seres vivos',
          status: 'not_started',
          subtopics: [
            { id: 'sub-bio-7-1', name: '7.1 Conceitos básicos em ecologia', status: 'not_started' },
            { id: 'sub-bio-7-2', name: '7.2 Relações tróficas (cadeias e teias alimentares; distribuição natural da matéria e da energia e concentração de pesticidas e de subprodutos radiativos)', status: 'not_started' },
            { id: 'sub-bio-7-3', name: '7.3 Relações ecológicas limitadoras do crescimento populacional', status: 'not_started' },
            { id: 'sub-bio-7-4', name: '7.4 Ecossistemas do Brasil', status: 'not_started' }
          ]
        },
        { id: 'top-bio-8', name: '8 Ensino de Biologia: conhecimento científico e habilidade didática no ensino de Biologia', status: 'not_started', subtopics: [] },
        { id: 'top-bio-10', name: '10 A construção do conhecimento no ensino de Biologia: abordagens metodológicas', status: 'not_started', subtopics: [] },
        { id: 'top-bio-11', name: '11 Recursos didáticos no ensino de Biologia (utilizados em sala de aula e laboratório, incluindo conhecimentos básicos de técnicas, materiais e normas de segurança laboratoriais)', status: 'not_started', subtopics: [] },
        { id: 'top-bio-12', name: '12 O ensino de Biologia e as novas tecnologias da informação e comunicação', status: 'not_started', subtopics: [] },
        { id: 'top-bio-13', name: '13 Avaliação de aprendizagem do conhecimento biológico', status: 'not_started', subtopics: [] },
        { id: 'top-bio-14', name: '14 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a Disciplina de Biologia', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Educação Física': [
    {
      id: 'bloco-ef-1',
      name: 'Conhecimentos Específicos - Educação Física',
      topics: [
        { id: 'top-ef-1', name: '1 Histórico da Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-2', name: '2 Educação Física enquanto linguagem', status: 'not_started', subtopics: [] },
        { id: 'top-ef-3', name: '3 Processo ensino-aprendizagem na Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-4', name: '4 Construindo competências e habilidades em Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-5', name: '5 Avaliação em Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-6', name: '6 Educação Física e sociedade', status: 'not_started', subtopics: [] },
        { id: 'top-ef-7', name: '7 Fundamentos didático-pedagógicos da educação física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-8', name: '8 Atividade física e saúde', status: 'not_started', subtopics: [] },
        { id: 'top-ef-9', name: '9 Crescimento e desenvolvimento', status: 'not_started', subtopics: [] },
        { id: 'top-ef-10', name: '10 Aspectos da aprendizagem motora', status: 'not_started', subtopics: [] },
        { id: 'top-ef-11', name: '11 Aspectos sócio históricos da Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-12', name: '12 Política educacional e Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-13', name: '13 Cultura e Educação Física', status: 'not_started', subtopics: [] },
        { id: 'top-ef-14', name: '14 Aspectos da competição e cooperação no cenário escolar', status: 'not_started', subtopics: [] },
        { id: 'top-ef-15', name: '15 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a Disciplina de Educação Física', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Filosofia': [
    {
      id: 'bloco-fil-1',
      name: 'Conhecimentos Específicos - Filosofia',
      topics: [
        {
          id: 'top-fil-1',
          name: '1 A emergência da filosofia grega',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-1-1', name: '1.1 Filosofia e a cidade', status: 'not_started' },
            { id: 'sub-fil-1-2', name: '1.2 Filosofia e a democracia', status: 'not_started' },
            { id: 'sub-fil-1-3', name: '1.3 Filosofia e a universalização da palavra', status: 'not_started' },
            { id: 'sub-fil-1-4', name: '1.4 Filosofia, verdade e argumentação', status: 'not_started' }
          ]
        },
        {
          id: 'top-fil-2',
          name: '2 Filosofia e os conhecimentos tradicionais (narrativas/mitos)',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-2-1', name: '2.1 Filosofia e a consciência cotidiana', status: 'not_started' },
            { id: 'sub-fil-2-2', name: '2.2 Filosofia, a arte e as ciências', status: 'not_started' }
          ]
        },
        {
          id: 'top-fil-3',
          name: '3 Filosofia e ação',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-3-1', name: '3.1 Moral, ética e política', status: 'not_started' },
            { id: 'sub-fil-3-2', name: '3.2 Filosofia, ética e felicidade (Platão, Aristóteles, Agostinho de Hipona e Spinoza)', status: 'not_started' },
            { id: 'sub-fil-3-3', name: '3.3 Ética, autonomia da razão e dignidade (Kant)', status: 'not_started' },
            { id: 'sub-fil-3-4', name: '3.4 Crítica e genealogia da moral (Nietzsche)', status: 'not_started' },
            { id: 'sub-fil-3-5', name: '3.5 Contextualização histórica dessas questões e principais argumentos', status: 'not_started' }
          ]
        },
        {
          id: 'top-fil-4',
          name: '4 Filosofia e conhecimento científico',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-4-1', name: '4.1 Racionalismo (Descartes) e empirismo (Bacon)', status: 'not_started' },
            { id: 'sub-fil-4-2', name: '4.2 Filosofia, Ciência e técnica (Descartes, Bacon)', status: 'not_started' },
            { id: 'sub-fil-4-3', name: '4.3 Filosofia e crítica da técnica (Heidegger, Benjamin)', status: 'not_started' },
            { id: 'sub-fil-4-4', name: '4.4 Contextualização histórica dessas questões e principais argumentos', status: 'not_started' }
          ]
        },
        {
          id: 'top-fil-5',
          name: '5 Filosofia e experiência estética',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-5-1', name: '5.1 Arte e absoluto (Hegel), arte e afirmação da vida (Nietzsche)', status: 'not_started' },
            { id: 'sub-fil-5-2', name: '5.2 Arte e sentido (Heidegger e Gadamer)', status: 'not_started' },
            { id: 'sub-fil-5-3', name: '5.3 Arte e capitalismo (Benjamin, Adorno e Horkheimer)', status: 'not_started' },
            { id: 'sub-fil-5-4', name: '5.4 Contextualização histórica dessas questões e principais argumentos', status: 'not_started' }
          ]
        },
        { id: 'top-fil-6', name: '6 Ensino de Filosofia no Ensino Médio: determinações legais', status: 'not_started', subtopics: [] },
        {
          id: 'top-fil-7',
          name: '7 Reflexões acerca do ensino de Filosofia no Ensino Médio',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fil-7-1', name: '7.1 Ensino de Filosofia e interdisciplinaridade', status: 'not_started' },
            { id: 'sub-fil-7-2', name: '7.2 Estratégias didáticas e a seleção de conteúdos', status: 'not_started' }
          ]
        },
        { id: 'top-fil-8', name: '8 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a Disciplina de Filosofia', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Física': [
    {
      id: 'bloco-fis-1',
      name: 'Conhecimentos Específicos - Física',
      topics: [
        {
          id: 'top-fis-1',
          name: '1 História e evolução das ideias da Física',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-1-1', name: '1.1 Cosmologia antiga', status: 'not_started' },
            { id: 'sub-fis-1-2', name: '1.2 Física de Aristóteles', status: 'not_started' },
            { id: 'sub-fis-1-3', name: '1.3 Origens da mecânica', status: 'not_started' },
            { id: 'sub-fis-1-4', name: '1.4 Surgimento da teoria da relatividade e da teoria quântica', status: 'not_started' }
          ]
        },
        {
          id: 'top-fis-2',
          name: '2 Mecânica',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-2-1', name: '2.1 Cinemática escalar e vetorial', status: 'not_started' },
            { id: 'sub-fis-2-2', name: '2.2 Movimento circular', status: 'not_started' },
            { id: 'sub-fis-2-3', name: '2.3 Leis de Newton e suas aplicações', status: 'not_started' },
            { id: 'sub-fis-2-4', name: '2.4 Trabalho', status: 'not_started' },
            { id: 'sub-fis-2-5', name: '2.5 Potência', status: 'not_started' },
            { id: 'sub-fis-2-6', name: '2.6 Energia, conservação e suas transformações, impulso', status: 'not_started' },
            { id: 'sub-fis-2-7', name: '2.7 Quantidade de movimento, conservação da quantidade de movimento', status: 'not_started' },
            { id: 'sub-fis-2-8', name: '2.8 Gravitação universal', status: 'not_started' },
            { id: 'sub-fis-2-9', name: '2.9 Estática dos corpos rígidos', status: 'not_started' },
            { id: 'sub-fis-2-10', name: '2.10 Estática dos fluidos', status: 'not_started' },
            { id: 'sub-fis-2-11', name: '2.11 Princípios de Pascal, Arquimedes e Stevin', status: 'not_started' }
          ]
        },
        {
          id: 'top-fis-3',
          name: '3 Termodinâmica',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-3-1', name: '3.1 Calor e temperatura', status: 'not_started' },
            { id: 'sub-fis-3-2', name: '3.2 Temperatura e dilatação térmica', status: 'not_started' },
            { id: 'sub-fis-3-3', name: '3.3 Calor específico', status: 'not_started' },
            { id: 'sub-fis-3-4', name: '3.4 Trocas de calor', status: 'not_started' },
            { id: 'sub-fis-3-5', name: '3.5 Mudança de fase e diagramas de fases', status: 'not_started' },
            { id: 'sub-fis-3-6', name: '3.6 Propagação do calor', status: 'not_started' },
            { id: 'sub-fis-3-7', name: '3.7 Teoria cinética dos gases', status: 'not_started' },
            { id: 'sub-fis-3-8', name: '3.8 Energia interna', status: 'not_started' },
            { id: 'sub-fis-3-9', name: '3.9 Lei de Joule', status: 'not_started' },
            { id: 'sub-fis-3-10', name: '3.10 Transformações gasosas', status: 'not_started' },
            { id: 'sub-fis-3-11', name: '3.11 Leis da termodinâmica: entropia e entalpia', status: 'not_started' },
            { id: 'sub-fis-3-12', name: '3.12 Máquinas térmicas', status: 'not_started' },
            { id: 'sub-fis-3-13', name: '3.13 Ciclo de Carnot', status: 'not_started' }
          ]
        },
        {
          id: 'top-fis-4',
          name: '4 Eletromagnetismo',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-4-1', name: '4.1 Introdução à eletricidade', status: 'not_started' },
            { id: 'sub-fis-4-2', name: '4.2 Campo elétrico', status: 'not_started' },
            { id: 'sub-fis-4-3', name: '4.3 Lei de Gauss', status: 'not_started' },
            { id: 'sub-fis-4-4', name: '4.4 Potencial elétrico', status: 'not_started' },
            { id: 'sub-fis-4-5', name: '4.5 Corrente elétrica', status: 'not_started' },
            { id: 'sub-fis-4-6', name: '4.6 Potência elétrica e resistores', status: 'not_started' },
            { id: 'sub-fis-4-7', name: '4.7 Circuitos elétricos', status: 'not_started' },
            { id: 'sub-fis-4-8', name: '4.8 Campo magnético', status: 'not_started' },
            { id: 'sub-fis-4-9', name: '4.9 Lei de Ampère', status: 'not_started' },
            { id: 'sub-fis-4-10', name: '4.10 Lei de Faraday', status: 'not_started' },
            { id: 'sub-fis-4-11', name: '4.11 Propriedades elétricas e magnéticas dos materiais', status: 'not_started' },
            { id: 'sub-fis-4-12', name: '4.12 Equações de Maxwell', status: 'not_started' },
            { id: 'sub-fis-4-13', name: '4.13 Radiação', status: 'not_started' }
          ]
        },
        {
          id: 'top-fis-5',
          name: '5 Ondulatória',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-5-1', name: '5.1 Movimento harmônico simples', status: 'not_started' },
            { id: 'sub-fis-5-2', name: '5.2 Oscilações livres, amortecidas e forçadas', status: 'not_started' },
            { id: 'sub-fis-5-3', name: '5.3 Ondas', status: 'not_started' },
            { id: 'sub-fis-5-4', name: '5.4 Ondas sonoras e eletromagnéticas', status: 'not_started' },
            { id: 'sub-fis-5-5', name: '5.5 Frequências naturais e ressonância', status: 'not_started' },
            { id: 'sub-fis-5-6', name: '5.6 Ótica geométrica: reflexão e refração da luz', status: 'not_started' },
            { id: 'sub-fis-5-7', name: '5.7 Instrumentos ópticos - características e aplicações', status: 'not_started' }
          ]
        },
        { id: 'top-fis-6', name: '6 Ótica Física: interferência; difração; polarização', status: 'not_started', subtopics: [] },
        {
          id: 'top-fis-7',
          name: '7 Física Moderna',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-7-1', name: '7.1 Introdução a Relatividade Especial, transformação de Lorentz', status: 'not_started' },
            { id: 'sub-fis-7-2', name: '7.2 Equivalência Massa-Energia', status: 'not_started' },
            { id: 'sub-fis-7-3', name: '7.3 Natureza ondulatória-corpuscular da matéria', status: 'not_started' },
            { id: 'sub-fis-7-4', name: '7.4 Teoria quântica da matéria e da radiação', status: 'not_started' },
            { id: 'sub-fis-7-5', name: '7.5 Modelo do átomo de hidrogênio', status: 'not_started' },
            { id: 'sub-fis-7-6', name: '7.6 Núcleo atômico', status: 'not_started' },
            { id: 'sub-fis-7-7', name: '7.7 Energia nuclear, relatividade geral', status: 'not_started' }
          ]
        },
        {
          id: 'top-fis-8',
          name: '8 Ensino de Física',
          status: 'not_started',
          subtopics: [
            { id: 'sub-fis-8-1', name: '8.1 Conhecimento científico e habilidade didática no ensino de Física', status: 'not_started' },
            { id: 'sub-fis-8-2', name: '8.2 Construção do conhecimento no ensino da Física: abordagens metodológicas', status: 'not_started' },
            { id: 'sub-fis-8-3', name: '8.3 Recursos didáticos no ensino de Física (utilizados em sala de aula e laboratório, incluindo conhecimentos básicos de técnicas, materiais e normas de segurança laboratoriais)', status: 'not_started' }
          ]
        },
        { id: 'top-fis-9', name: '9 O ensino de Física e as novas tecnologias da informação e comunicação', status: 'not_started', subtopics: [] },
        { id: 'top-fis-10', name: '10 Avaliação de aprendizagem do conhecimento cientifico', status: 'not_started', subtopics: [] },
        { id: 'top-fis-11', name: '11 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Física', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Geografia': [
    {
      id: 'bloco-geo-1',
      name: 'Conhecimentos Específicos - Geografia',
      topics: [
        {
          id: 'top-geo-1',
          name: '1 Concepções do pensamento geográfico e sua influência no ensino da Geografia',
          status: 'not_started',
          subtopics: [
            { id: 'sub-geo-1-1', name: '1.1 Sociedade, lugar e paisagem no ensino da Geografia', status: 'not_started' },
            { id: 'sub-geo-1-2', name: '1.2 Currículo: cultura e territorialidade no ensino da Geografia', status: 'not_started' },
            { id: 'sub-geo-1-3', name: '1.3 Novas abordagens teóricas e metodológicas no ensino da Geografia', status: 'not_started' },
            { id: 'sub-geo-1-4', name: '1.4 Novas tecnologias de comunicação e informação no ensino da Geografia', status: 'not_started' },
            { id: 'sub-geo-1-5', name: '1.5 Aspectos avaliativos no Ensino da Geografia', status: 'not_started' }
          ]
        },
        {
          id: 'top-geo-2',
          name: '2 Geopolítica e Econômica',
          status: 'not_started',
          subtopics: [
            { id: 'sub-geo-2-1', name: '2.1 O espaço como produto do homem', status: 'not_started' },
            { id: 'sub-geo-2-2', name: '2.2 Capitalismo', status: 'not_started' },
            { id: 'sub-geo-2-3', name: '2.3 Desenvolvimento e subdesenvolvimento', status: 'not_started' },
            { id: 'sub-geo-2-4', name: '2.4 Economia do pós-guerra', status: 'not_started' },
            { id: 'sub-geo-2-5', name: '2.5 O Brasil, a nova ordem mundial e a globalização', status: 'not_started' },
            { id: 'sub-geo-2-6', name: '2.6 O comércio internacional', status: 'not_started' },
            { id: 'sub-geo-2-7', name: '2.7 O MERCOSUL', status: 'not_started' },
            { id: 'sub-geo-2-8', name: '2.8 A economia mundial e do Brasil', status: 'not_started' },
            { id: 'sub-geo-2-9', name: '2.9 O problema da dívida externa', status: 'not_started' },
            { id: 'sub-geo-2-10', name: '2.10 Energia e transporte', status: 'not_started' },
            { id: 'sub-geo-2-11', name: '2.11 A agropecuária', status: 'not_started' },
            { id: 'sub-geo-2-12', name: '2.12 O comércio', status: 'not_started' },
            { id: 'sub-geo-2-13', name: '2.13 A indústria', status: 'not_started' },
            { id: 'sub-geo-2-14', name: '2.14 Os serviços', status: 'not_started' },
            { id: 'sub-geo-2-15', name: '2.15 As relações de trabalho', status: 'not_started' },
            { id: 'sub-geo-2-16', name: '2.16 As desigualdades sociais e a exploração humana', status: 'not_started' },
            { id: 'sub-geo-2-17', name: '2.17 A revolução técnico-científica', status: 'not_started' }
          ]
        },
        {
          id: 'top-geo-3',
          name: '3 Geografia da população',
          status: 'not_started',
          subtopics: [
            { id: 'sub-geo-3-1', name: '3.1 A população e as formas de ocupação do espaço', status: 'not_started' },
            { id: 'sub-geo-3-2', name: '3.2 Os contrastes regionais do Brasil', status: 'not_started' },
            { id: 'sub-geo-3-3', name: '3.3 Urbanização e metropolização', status: 'not_started' }
          ]
        },
        {
          id: 'top-geo-4',
          name: '4 Ecologia',
          status: 'not_started',
          subtopics: [
            { id: 'sub-geo-4-1', name: '4.1 Ecosistemas naturais', status: 'not_started' },
            { id: 'sub-geo-4-2', name: '4.2 Impactos ambientais', status: 'not_started' },
            { id: 'sub-geo-4-3', name: '4.3 Recursos naturais e devastação histórica', status: 'not_started' },
            { id: 'sub-geo-4-4', name: '4.4 Política ambiental', status: 'not_started' }
          ]
        },
        { id: 'top-geo-5', name: '5 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Geografia', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em História': [
    {
      id: 'bloco-his-1',
      name: 'Conhecimentos Específicos - História',
      topics: [
        {
          id: 'top-his-1',
          name: '1 Concepções do pensamento histórico, a dinâmica historiográfica e sua influência no ensino da história',
          status: 'not_started',
          subtopics: [
            { id: 'sub-his-1-1', name: '1.1 Memória, oralidade e cotidiano no ensino de História', status: 'not_started' },
            { id: 'sub-his-1-2', name: '1.2 Currículo: cultura, gênero, direitos humanos, meio ambiente, história local e diversidade étnico racial no ensino de História, novas abordagens teóricas e metodológicas no ensino de História', status: 'not_started' },
            { id: 'sub-his-1-3', name: '1.3 Novas tecnologias de comunicação e informação no ensino de História', status: 'not_started' },
            { id: 'sub-his-1-4', name: '1.4 Aspectos avaliativo no ensino de História', status: 'not_started' }
          ]
        },
        {
          id: 'top-his-2',
          name: '2 História Natural e História Social',
          status: 'not_started',
          subtopics: [
            { id: 'sub-his-2-1', name: '2.1 O processo de humanização e a dinâmica da formação das sociedades humanas na Pré-história', status: 'not_started' },
            { id: 'sub-his-2-2', name: '2.2 A Organização sócio-política, econômica, cultural religiosa do Egito, Núbia, Kush, Ménroe, Napata, Mesopotâmia, Palestina, Fenícia, Pérsia, Grega e Romana, sua dinâmica, relações, rupturas e transformações', status: 'not_started' }
          ]
        },
        {
          id: 'top-his-3',
          name: '3 A organização sócio-política, econômica, cultural religiosa da sociedade europeia do século V ao XV sua dinâmica, relações, rupturas e transformações',
          status: 'not_started',
          subtopics: [
            { id: 'sub-his-3-1', name: '3.1 A Cristianização da Europa', status: 'not_started' },
            { id: 'sub-his-3-2', name: '3.2 A sociedade Oriental, o Islamismo e a islamização da Arábia e África', status: 'not_started' },
            { id: 'sub-his-3-3', name: '3.3 Os reinos africanos no século V ao XV', status: 'not_started' }
          ]
        },
        {
          id: 'top-his-4',
          name: '4 Dinâmica, relações, rupturas e transformações da sociedade europeia do século XV ao XVIII',
          status: 'not_started',
          subtopics: [
            { id: 'sub-his-4-1', name: '4.1 As civilizações e organizações políticas pré-coloniais Mali, Congo e Zimbabwe', status: 'not_started' },
            { id: 'sub-his-4-2', name: '4.2 Escravidão e diáspora dos povos africanos', status: 'not_started' }
          ]
        },
        { id: 'top-his-5', name: '5 Dinâmica, relações, rupturas e transformações da sociedade europeia, americana, africana e asiática do século XVIII a contemporaneidade', status: 'not_started', subtopics: [] },
        {
          id: 'top-his-6',
          name: '6 Dinâmica, relações, rupturas e transformações da organização sócio-política, econômica e cultural no Brasil e Ceará Colonial',
          status: 'not_started',
          subtopics: [
            { id: 'sub-his-6-1', name: '5.1 Escravidão e resistência negra e indígena no Brasil e Ceará Colonial', status: 'not_started' },
            { id: 'sub-his-6-2', name: '5.2 As tecnologias de agricultura, de beneficiamento de cultivo, de mineração e de edificações trazidas pelos escravizados, bem como a produção científica, artística (artes plásticas, literatura, música, dança, teatro) política', status: 'not_started' },
            { id: 'sub-his-6-3', name: '5.3 Cultura e religiosidade africana e indígena no Brasil e Ceará Colonial', status: 'not_started' },
            { id: 'sub-his-6-4', name: '5.4 Movimento de independência no Brasil e Ceará Colonial', status: 'not_started' },
            { id: 'sub-his-6-5', name: '5.5 Organização sócio-política, econômica e cultural no Império: Primeiro e Segundo Reinado e participação do Ceará', status: 'not_started' },
            { id: 'sub-his-6-6', name: '5.6 As revoluções sociais: Cabanagem, Balaiada, Farroupilha, Sabinada, Revolta dos Malês, Quebra Quilo; Abolição e Movimento Republicano no Brasil e Ceará', status: 'not_started' }
          ]
        },
        { id: 'top-his-7', name: '7 Atualidades', status: 'not_started', subtopics: [] },
        { id: 'top-his-8', name: '8 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de História', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Língua Brasileira de Sinais - Libras': [
    {
      id: 'bloco-lib-1',
      name: 'Conhecimentos Específicos - Língua Brasileira de Sinais (Libras)',
      topics: [
        { id: 'top-lib-1', name: '1 Educação de surdos: história e teorias', status: 'not_started', subtopics: [] },
        { id: 'top-lib-2', name: '2 Identidades e cultura surda', status: 'not_started', subtopics: [] },
        { id: 'top-lib-3', name: '3 Políticas educacionais para surdos e processos inclusivos', status: 'not_started', subtopics: [] },
        { id: 'top-lib-4', name: '4 Fonologia e Língua Brasileira de Sinais', status: 'not_started', subtopics: [] },
        { id: 'top-lib-5', name: '5 Morfologia e Língua Brasileira de Sinais', status: 'not_started', subtopics: [] },
        { id: 'top-lib-6', name: '6 Sintaxe e Língua Brasileira de Sinais', status: 'not_started', subtopics: [] },
        { id: 'top-lib-7', name: '7 Semântica e pragmática e Língua Brasileira de Sinais', status: 'not_started', subtopics: [] },
        { id: 'top-lib-8', name: '8 Ensino da Língua Brasileira de Sinais como primeira língua', status: 'not_started', subtopics: [] },
        { id: 'top-lib-9', name: '9 Ensino da Língua Brasileira de Sinais como segunda língua', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Língua Espanhola': [
    {
      id: 'bloco-esp-1',
      name: 'Conhecimentos Específicos - Língua Espanhola',
      topics: [
        { id: 'top-esp-1', name: '1 Leitura e compreensão de textos em Língua Espanhola considerando os diversos gêneros textuais', status: 'not_started', subtopics: [] },
        { id: 'top-esp-2', name: '2 Tendências pedagógicas sobre o ensino de Língua Espanhola: abordagem da linguagem sob novos enfoques', status: 'not_started', subtopics: [] },
        {
          id: 'top-esp-3',
          name: '3 Uso e domínio das estratégias de leitura (skimming, scanning, prediction e outras)',
          status: 'not_started',
          subtopics: [
            { id: 'sub-esp-3-1', name: '3.1 Compreensão geral do texto', status: 'not_started' },
            { id: 'sub-esp-3-2', name: '3.2 Reconhecimento de informações específicas', status: 'not_started' },
            { id: 'sub-esp-3-3', name: '3.3 Inferência e predição', status: 'not_started' },
            { id: 'sub-esp-3-4', name: '3.4 Palavras cognatas e falsos cognatos', status: 'not_started' }
          ]
        },
        { id: 'top-esp-4', name: '4 Vocabulário: domínio de vocabulário compatível com a interpretação de texto dentro do conteúdo exigido', status: 'not_started', subtopics: [] },
        {
          id: 'top-esp-5',
          name: '5 Aspectos linguísticos e gramaticais',
          status: 'not_started',
          subtopics: [
            { id: 'sub-esp-5-1', name: '5.1 El alfabeto gráfico y oral', status: 'not_started' },
            { id: 'sub-esp-5-2', name: '5.2 Artículos', status: 'not_started' },
            { id: 'sub-esp-5-3', name: '5.3 Pronombres personales y de tratamiento', status: 'not_started' },
            { id: 'sub-esp-5-4', name: '5.4 Presente de indicativo: ser, estar y tener', status: 'not_started' },
            { id: 'sub-esp-5-5', name: '5.5 Adjetivos posesivos', status: 'not_started' },
            { id: 'sub-esp-5-6', name: '5.6 Contracciones', status: 'not_started' },
            { id: 'sub-esp-5-7', name: '5.7 Combinaciones', status: 'not_started' },
            { id: 'sub-esp-5-8', name: '5.8 Perífrasis de futuro', status: 'not_started' },
            { id: 'sub-esp-5-9', name: '5.9 Los numerales', status: 'not_started' },
            { id: 'sub-esp-5-10', name: '5.10 El artículo neutro LO', status: 'not_started' },
            { id: 'sub-esp-5-11', name: '5.11 Adverbios y expresiones de tiempo', status: 'not_started' },
            { id: 'sub-esp-5-12', name: '5.12 Verbos', status: 'not_started' },
            { id: 'sub-esp-5-13', name: '5.13 Pronombres demostrativos', status: 'not_started' },
            { id: 'sub-esp-5-14', name: '5.14 Adverbios y pronombres interrogativos', status: 'not_started' },
            { id: 'sub-esp-5-15', name: '5.15 Formación del plural', status: 'not_started' },
            { id: 'sub-esp-5-16', name: '5.16 Lugares (establecimientos comerciales) y medios de transporte', status: 'not_started' },
            { id: 'sub-esp-5-17', name: '5.17 La familia', status: 'not_started' },
            { id: 'sub-esp-5-18', name: '5.18 Los colores', status: 'not_started' },
            { id: 'sub-esp-5-19', name: '5.19 Objetos variados', status: 'not_started' }
          ]
        },
        { id: 'top-esp-6', name: '6 Divergências léxicas (heterosemánticos, heterotónicos, heterogenéricos)', status: 'not_started', subtopics: [] },
        { id: 'top-esp-7', name: '7 Apócope', status: 'not_started', subtopics: [] },
        { id: 'top-esp-8', name: '8 Relação entre língua, cultura e sociedade', status: 'not_started', subtopics: [] },
        { id: 'top-esp-9', name: '9 O tratamento da produção escrita como processo (revisão/correção e reescrita)', status: 'not_started', subtopics: [] },
        { id: 'top-esp-10', name: '10 Compreensão de textos de autores modernos e/ou contemporâneos', status: 'not_started', subtopics: [] },
        { id: 'top-esp-11', name: '11 Avaliação no ensino e aprendizagem da Língua Espanhola na educação básica', status: 'not_started', subtopics: [] },
        { id: 'top-esp-12', name: '12 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Língua Espanhola', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Língua Inglesa': [
    {
      id: 'bloco-ing-1',
      name: 'Conhecimentos Específicos - Língua Inglesa',
      topics: [
        { id: 'top-ing-1', name: '1 Leitura e compreensão de textos em Língua Inglesa considerando os diversos gêneros textuais', status: 'not_started', subtopics: [] },
        { id: 'top-ing-2', name: '2 Tendências pedagógicas do ensino de Língua Inglesa: abordagem da linguagem sob novos enfoques', status: 'not_started', subtopics: [] },
        {
          id: 'top-ing-3',
          name: '3 Uso e domínio das estratégias de leitura (skimming, scanning, prediction e outras)',
          status: 'not_started',
          subtopics: [
            { id: 'sub-ing-3-1', name: '3.1 Compreensão geral do texto', status: 'not_started' },
            { id: 'sub-ing-3-2', name: '3.2 Reconhecimento de informações específicas', status: 'not_started' },
            { id: 'sub-ing-3-3', name: '3.3 Inferência e predição', status: 'not_started' },
            { id: 'sub-ing-3-4', name: '3.4 Palavras cognatas e falsos cognatos, entre outros', status: 'not_started' }
          ]
        },
        {
          id: 'top-ing-4',
          name: '4 Vocabulário',
          status: 'not_started',
          subtopics: [
            { id: 'sub-ing-4-1', name: '4.1 Domínio de vocabulário compatível com a interpretação de texto, dentro do conteúdo exigido', status: 'not_started' }
          ]
        },
        {
          id: 'top-ing-5',
          name: '5 Aspectos linguísticos e gramaticais',
          status: 'not_started',
          subtopics: [
            { id: 'sub-ing-5-1', name: '5.1 Conhecimento dos tempos e modos verbais', status: 'not_started' },
            { id: 'sub-ing-5-2', name: '5.2 Verb "to be"', status: 'not_started' },
            { id: 'sub-ing-5-3', name: '5.3 Regular/irregular verbs (simple present and simple past)', status: 'not_started' },
            { id: 'sub-ing-5-4', name: '5.4 Present and past continuous', status: 'not_started' },
            { id: 'sub-ing-5-5', name: '5.5 Present and past perfect', status: 'not_started' },
            { id: 'sub-ing-5-6', name: '5.6 Present perfect continuous', status: 'not_started' },
            { id: 'sub-ing-5-7', name: '5.7 Future tense: will', status: 'not_started' },
            { id: 'sub-ing-5-8', name: '5.8 Going to - nas diversas formas (afirmativa, negativa e interrogativa)', status: 'not_started' },
            { id: 'sub-ing-5-9', name: '5.9 Imperative', status: 'not_started' },
            { id: 'sub-ing-5-10', name: '5.10 Modals: can, could, should, must, have, may', status: 'not_started' },
            { id: 'sub-ing-5-11', name: '5.11 Passive voice', status: 'not_started' },
            { id: 'sub-ing-5-12', name: '5.12 Uso de preposições e conjunções', status: 'not_started' },
            { id: 'sub-ing-5-13', name: '5.13 Formação e classe de palavras', status: 'not_started' },
            { id: 'sub-ing-5-14', name: '5.14 Pronomes: personal pronouns (object pronouns, subject pronouns)', status: 'not_started' },
            { id: 'sub-ing-5-15', name: '5.15 Possessive pronouns', status: 'not_started' },
            { id: 'sub-ing-5-16', name: '5.16 Possessive adjectives', status: 'not_started' },
            { id: 'sub-ing-5-17', name: '5.17 Relative clauses: who/that/which/whose/whom/where', status: 'not_started' },
            { id: 'sub-ing-5-18', name: '5.18 Comparatives and superlatives', status: 'not_started' },
            { id: 'sub-ing-5-19', name: '5.19 Possessive case', status: 'not_started' }
          ]
        },
        { id: 'top-ing-6', name: '6 Relação entre língua, cultura e sociedade', status: 'not_started', subtopics: [] },
        { id: 'top-ing-7', name: '7 O tratamento da produção escrita como processo (revisão/correção e reescrita)', status: 'not_started', subtopics: [] },
        { id: 'top-ing-8', name: '8 Compreensão de textos de autores modernos e/ou contemporâneos', status: 'not_started', subtopics: [] },
        { id: 'top-ing-9', name: '9 Avaliação no ensino e aprendizagem da Língua Inglesa na Educação Básica', status: 'not_started', subtopics: [] },
        { id: 'top-ing-10', name: '10 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Língua Inglesa', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Língua Portuguesa / Letras': [
    {
      id: 'bloco-lp-lit-1',
      name: 'Conhecimentos Específicos - I LITERATURA',
      topics: [
        { id: 'top-lp-0', name: '1 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Língua Portuguesa', status: 'not_started', subtopics: [] },
        { id: 'top-lp-lit-1', name: '1 Relações contextuais e intertextuais entre gêneros textuais, épocas, autores e mídias na literatura brasileira', status: 'not_started', subtopics: [] },
        {
          id: 'top-lp-lit-2',
          name: '2 A linguagem literária',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-2-1', name: '2.1 Elementos da teoria literária (narrador, personagens, tempo, etc) em produções artísticas de diferentes momentos históricos e tendências culturais, mediante análise de textos e obras no Brasil', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-3',
          name: '3 O Barroco no Brasil',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-3-1', name: '3.1 Relações sociais e históricas presentes no Barroco no Brasil', status: 'not_started' },
            { id: 'sub-lp-lit-3-2', name: '3.2 Abordagem dos tipos e dos problemas sociais nos textos de Gregório de Matos Guerra', status: 'not_started' },
            { id: 'sub-lp-lit-3-3', name: '3.3 Os reflexos da literatura barroca gerando mudanças de atitude na sociedade da época', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-4',
          name: '4 O Arcadismo no Brasil',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-4-1', name: '4.1 O papel do Arcadismo no Brasil, como movimento paralelo à inconfidência Mineira', status: 'not_started' },
            { id: 'sub-lp-lit-4-2', name: '4.2 A "face pré-romântica" da poesia árcade brasileira como aspecto transitório para o Romantismo', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-5',
          name: '5 O Romantismo no Brasil',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-5-1', name: '5.1 O Romantismo como reflexo dos costumes da sociedade burguesa - características, elementos textuais e não textuais', status: 'not_started' },
            { id: 'sub-lp-lit-5-2', name: '5.2 A criação de estereótipos e perfis dos personagens literários', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-6',
          name: '6 Análise de textos dos autores realistas-naturalistas',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-6-1', name: '6.1 Contexto sócio histórico', status: 'not_started' },
            { id: 'sub-lp-lit-6-2', name: '6.2 As características do texto', status: 'not_started' },
            { id: 'sub-lp-lit-6-3', name: '6.3 O retrato comportamental da sociedade e suas consequências', status: 'not_started' }
          ]
        },
        { id: 'top-lp-lit-7', name: '7 Estrutura, temas e aspectos da produção poética dos principais autores parnasianos brasileiros', status: 'not_started', subtopics: [] },
        {
          id: 'top-lp-lit-8',
          name: '8 O Simbolismo como reflexo dos receios e desejos dos excluídos na sociedade brasileira',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-8-1', name: '8.1 O caráter transcendental entre a imaginação e a fantasia, versus a razão, ou a lógica', status: 'not_started' },
            { id: 'sub-lp-lit-8-2', name: '8.2 Análise da poética de Cruz e Souza e Alphonsus de Guimaraens', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-9',
          name: '9 A revolução artística do inicio do século XX e o Pré-Modernismo no Brasil',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-9-1', name: '9.1 Manifestações artístico-literárias', status: 'not_started' },
            { id: 'sub-lp-lit-9-2', name: '9.2 Influências revolucionárias das inovações geradas pelas Vanguardas Europeias', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-lit-10',
          name: '10 A trajetória modernista brasileira em suas diferentes fases',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-10-1', name: '10.1 A busca de novos rumos na literatura', status: 'not_started' },
            { id: 'sub-lp-lit-10-2', name: '10.2 Os principais autores da primeira geração modernista brasileira e sua relação com a tradição literária', status: 'not_started' },
            { id: 'sub-lp-lit-10-3', name: '10.3 Segundo momento modernista no Brasil - a poesia', status: 'not_started' },
            { id: 'sub-lp-lit-10-4', name: '10.4 O segundo momento modernista no Brasil - a prosa', status: 'not_started' },
            { id: 'sub-lp-lit-10-5', name: '10.5 O diversidade artística e temática do terceiro momento modernista', status: 'not_started' }
          ]
        },
        { id: 'top-lp-lit-11', name: '11 A problemática do pós-moderno no Brasil, numa visão crítico literária', status: 'not_started', subtopics: [] },
        {
          id: 'top-lp-lit-12',
          name: '12 Influências e aspectos étnicos na literatura brasileira',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lit-12-1', name: '12.1 A cultura africana retratada nos fatos, temáticas e personagens nas obras literárias brasileiras', status: 'not_started' },
            { id: 'sub-lp-lit-12-2', name: '12.2 O índio no imaginário literário do Brasil', status: 'not_started' }
          ]
        }
      ]
    },
    {
      id: 'bloco-lp-lec-2',
      name: 'Conhecimentos Específicos - II LEITURA',
      topics: [
        {
          id: 'top-lp-lec-1',
          name: '1 Compreensão literal - Relações de coerência',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lec-1-1', name: '1.1 Ideia de coerência', status: 'not_started' },
            { id: 'sub-lp-lec-1-2', name: '1.2 Ideia principal', status: 'not_started' },
            { id: 'sub-lp-lec-1-3', name: '1.3 Detalhes de apoio', status: 'not_started' },
            { id: 'sub-lp-lec-1-4', name: '1.4 Relações de causa e efeito', status: 'not_started' },
            { id: 'sub-lp-lec-1-5', name: '1.5 Sequência temporal', status: 'not_started' },
            { id: 'sub-lp-lec-1-6', name: '1.6 Sequência espacial', status: 'not_started' },
            { id: 'sub-lp-lec-1-7', name: '1.7 Relações de comparação e contraste', status: 'not_started' }
          ]
        },
        { id: 'top-lp-lec-2', name: '2 Relações coesivas: referência, substituição, elipse e Repetição', status: 'not_started', subtopics: [] },
        { id: 'top-lp-lec-3', name: '3 Indícios contextuais: definição, exemplos, recolocação, estruturas paralelas, conectivos, repetição de palavras-chave', status: 'not_started', subtopics: [] },
        { id: 'top-lp-lec-4', name: '4 Relações de sentido entre palavras: Sinonímia/antonímia, hiperonímia/hiponímia, Campo semântico', status: 'not_started', subtopics: [] },
        { id: 'top-lp-lec-5', name: '5 Compreensão textual versus interpretação textual', status: 'not_started', subtopics: [] },
        {
          id: 'top-lp-lec-6',
          name: '6 Compreensão Interpretativa',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-lec-6-1', name: '6.1 Propósito do autor', status: 'not_started' },
            { id: 'sub-lp-lec-6-2', name: '6.2 Informações implícitas', status: 'not_started' },
            { id: 'sub-lp-lec-6-3', name: '6.3 Distinção entre fato e opinião', status: 'not_started' }
          ]
        },
        { id: 'top-lp-lec-7', name: '7 Organização retórica: generalização, exemplificação, descrição, definição, exemplificação/especificação, explanação, classificação e elaboração', status: 'not_started', subtopics: [] },
        { id: 'top-lp-lec-8', name: '8 Seleção de Inferência: compreensão crítica', status: 'not_started', subtopics: [] }
      ]
    },
    {
      id: 'bloco-lp-ling-3',
      name: 'Conhecimentos Específicos - III ANÁLISE LINGUÍSTICA',
      topics: [
        { id: 'top-lp-ling-1', name: '1 Recursos estilísticos e estruturais: aspectos textuais, gramaticais e convenções da escrita', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-2', name: '2 Fatores constitutivos de relevância: coerência e coesão', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-3', name: '3 Análise de textos, identificando a estrutura da frase: modos de construção de orações segundo diferentes perspectivas de ordenação, observando-se os aspectos semânticos', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-4', name: '4 Uso do vocábulo, quanto ao seu valor e significação dentro do texto', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-5', name: '5 Concordância, regência e colocação como fatores de modificação e geração de sentido do texto', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-6', name: '6 Uso de estruturas verbais e nominais (pronomes, conjunções, preposições, etc)', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-7', name: '7 Descrição linguística aplicada ao texto: orações, sintagmas, palavras, morfemas', status: 'not_started', subtopics: [] },
        { id: 'top-lp-ling-8', name: '8 Variação linguística e preconceito linguístico, observando os níveis de linguagem presentes em gêneros textuais', status: 'not_started', subtopics: [] },
        {
          id: 'top-lp-ling-9',
          name: '9 Gêneros Textuais',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-ling-9-1', name: '9.1 Identificação dos gêneros', status: 'not_started' },
            { id: 'sub-lp-ling-9-2', name: '9.2 A função social do uso dos gêneros', status: 'not_started' },
            { id: 'sub-lp-ling-9-3', name: '9.3 Confronto de diferentes gêneros identificando as semelhanças e diferenças', status: 'not_started' }
          ]
        },
        {
          id: 'top-lp-ling-10',
          name: '10 As tecnologias da comunicação e de informação no ensino da Língua Portuguesa',
          status: 'not_started',
          subtopics: [
            { id: 'sub-lp-ling-10-1', name: '10.1 Hipertexto', status: 'not_started' },
            { id: 'sub-lp-ling-10-2', name: '10.2 Condições de textualidade', status: 'not_started' },
            { id: 'sub-lp-ling-10-3', name: '10.3 A linguagem virtual mediante a visão da Semiótica', status: 'not_started' }
          ]
        }
      ]
    }
  ],

  'Licenciatura em Matemática': [
    {
      id: 'bloco-mat-1',
      name: 'Conhecimentos Específicos - Matemática',
      topics: [
        { id: 'top-mat-1', name: '1 Números: números inteiros, divisibilidade, números racionais, números irracionais e reais', status: 'not_started', subtopics: [] },
        {
          id: 'top-mat-2',
          name: '2 Funções',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-2-1', name: '2.1 Igualdade de funções', status: 'not_started' },
            { id: 'sub-mat-2-2', name: '2.2 Determinação do domínio de uma função', status: 'not_started' },
            { id: 'sub-mat-2-3', name: '2.3 Função injetiva, sobrejetiva e bijetiva', status: 'not_started' },
            { id: 'sub-mat-2-4', name: '2.4 Função inversa', status: 'not_started' },
            { id: 'sub-mat-2-5', name: '2.5 Composição de funções', status: 'not_started' },
            { id: 'sub-mat-2-6', name: '2.6 Funções crescentes, decrescentes, pares e ímpares; os zeros e o sinal de uma função', status: 'not_started' },
            { id: 'sub-mat-2-7', name: '2.7 Funções lineares, constantes do 1º e 2º graus, modulares, polinomiais, logarítmicas e exponenciais', status: 'not_started' }
          ]
        },
        { id: 'top-mat-3', name: '3 Equações: desigualdades e inequações', status: 'not_started', subtopics: [] },
        { id: 'top-mat-4', name: '4 Geometria: plana, espacial e analítica', status: 'not_started', subtopics: [] },
        { id: 'top-mat-5', name: '5 Trigonometria: triângulo retângulo, estudo do seno, cosseno e tangente', status: 'not_started', subtopics: [] },
        {
          id: 'top-mat-6',
          name: '6 Sequências',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-6-1', name: '6.1 Sequências de Fibonacci, sequências numéricas', status: 'not_started' },
            { id: 'sub-mat-6-2', name: '6.2 Progressão aritmética e geométrica', status: 'not_started' }
          ]
        },
        {
          id: 'top-mat-7',
          name: '7 Matrizes',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-7-1', name: '7.1 Determinantes', status: 'not_started' },
            { id: 'sub-mat-7-2', name: '7.2 Sistemas lineares', status: 'not_started' },
            { id: 'sub-mat-7-3', name: '7.3 Análise combinatória', status: 'not_started' },
            { id: 'sub-mat-7-4', name: '7.4 Binômio de Newton', status: 'not_started' }
          ]
        },
        {
          id: 'top-mat-8',
          name: '8 Noções de estatística',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-8-1', name: '8.1 Medidas de tendência central', status: 'not_started' },
            { id: 'sub-mat-8-2', name: '8.2 Medidas de dispersão distribuição de frequência', status: 'not_started' },
            { id: 'sub-mat-8-3', name: '8.3 Gráficos', status: 'not_started' },
            { id: 'sub-mat-8-4', name: '8.4 Tabelas', status: 'not_started' }
          ]
        },
        {
          id: 'top-mat-9',
          name: '9 Matemática financeira',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-9-1', name: '9.1 Proporção, porcentagem, juros e taxas de juros, juro exato e juro comercial, sistemas de capitalização, descontos simples, desconto racional, desconto bancário', status: 'not_started' },
            { id: 'sub-mat-9-2', name: '9.2 Taxa efetiva, equivalência de capitais', status: 'not_started' }
          ]
        },
        { id: 'top-mat-10', name: '10 Cálculo de probabilidade', status: 'not_started', subtopics: [] },
        { id: 'top-mat-11', name: '11 Números complexos', status: 'not_started', subtopics: [] },
        { id: 'top-mat-12', name: '12 Cálculo diferencial e integral das funções de uma variável', status: 'not_started', subtopics: [] },
        { id: 'top-mat-13', name: '13 Noções de história da Matemática', status: 'not_started', subtopics: [] },
        { id: 'top-mat-14', name: '14 Avaliação e educação matemática: formas e instrumentos', status: 'not_started', subtopics: [] },
        {
          id: 'top-mat-15',
          name: '15 Ensino de Matemática',
          status: 'not_started',
          subtopics: [
            { id: 'sub-mat-15-1', name: '15.1 Transposição didática', status: 'not_started' },
            { id: 'sub-mat-15-2', name: '15.2 Uso de material concreto e aplicativos digitais', status: 'not_started' }
          ]
        },
        { id: 'top-mat-16', name: '16 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Matemática', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Química': [
    {
      id: 'bloco-qui-1',
      name: 'Conhecimentos Específicos - Química',
      topics: [
        { id: 'top-qui-1', name: '1 História da Química: a Alquimia como precursora da ciência Química, o nascimento da Química moderna, Química e sociedade', status: 'not_started', subtopics: [] },
        {
          id: 'top-qui-2',
          name: '2 O mundo e suas transformações',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-2-1', name: '2.1 Leis ponderais (Lavoisier, Proust, Dalton, Richter)', status: 'not_started' },
            { id: 'sub-qui-2-2', name: '2.2 Leis das reações gasosas de Gay Lussac', status: 'not_started' },
            { id: 'sub-qui-2-3', name: '2.3 Hipótese de Avogadro, mole, molécula', status: 'not_started' },
            { id: 'sub-qui-2-4', name: '2.4 Cálculos Estequiométricos', status: 'not_started' },
            { id: 'sub-qui-2-5', name: '2.5 Natureza elétrica da matéria (os trabalhos de Faraday)', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-3',
          name: '3 Ligações químicas',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-3-1', name: '3.1 Iônica, covalente, eletronegatividade', status: 'not_started' },
            { id: 'sub-qui-3-2', name: '3.2 Repulsão de pares eletrônicos, geometria molecular', status: 'not_started' },
            { id: 'sub-qui-3-3', name: '3.3 Teoria da ligação de valência e a sobreposição de orbitais', status: 'not_started' },
            { id: 'sub-qui-3-4', name: '3.4 Orbitais híbridos e moleculares', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-4',
          name: '4 Sólidos, líquidos e gases no universo da Química',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-4-1', name: '4.1 Evolução do conceito de matéria', status: 'not_started' },
            { id: 'sub-qui-4-2', name: '4.2 Características e propriedades', status: 'not_started' },
            { id: 'sub-qui-4-3', name: '4.3 Líquidos e sólidos ideais, ligações químicas nos sólidos e líquidos', status: 'not_started' }
          ]
        },
        { id: 'top-qui-5', name: '5 Sólidos, líquidos e gases reais: mudança de estado, diagrama de fase', status: 'not_started', subtopics: [] },
        {
          id: 'top-qui-6',
          name: '6 Soluções',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-6-1', name: '6.1 Misturas, tipos de solução, concentração e solubilidade', status: 'not_started' },
            { id: 'sub-qui-6-2', name: '6.2 Propriedades coligativas, eletrólitos, íons em solução aquosa', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-7',
          name: '7 Modelo atômico',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-7-1', name: '7.1 Evolução dos conceitos de átomo', status: 'not_started' },
            { id: 'sub-qui-7-2', name: '7.2 Propriedades dos átomos (eletronegatividade, afinidade eletrônica e suas dimensões)', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-8',
          name: '8 Funções químicas e aplicações',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-8-1', name: '8.1 Ácidos', status: 'not_started' },
            { id: 'sub-qui-8-2', name: '8.2 Bases', status: 'not_started' },
            { id: 'sub-qui-8-3', name: '8.3 Sais', status: 'not_started' },
            { id: 'sub-qui-8-4', name: '8.4 Óxidos', status: 'not_started' },
            { id: 'sub-qui-8-5', name: '8.5 Reações em solução aquosa de ácido-base, precipitação e complexação', status: 'not_started' },
            { id: 'sub-qui-8-6', name: '8.6 Equilíbrio das soluções aquosas de ácido-base, dissociação, hidrólise, indicadores ácido-base de titulação, tampões, estequiometria de soluções', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-9',
          name: '9 A tabela periódica',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-9-1', name: '9.1 Histórico da tabela e sua construção', status: 'not_started' },
            { id: 'sub-qui-9-2', name: '9.2 O problema da classificação (metais, não metais e semi-metais), gases nobres e química do carbono', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-10',
          name: '10 Cinética e equilíbrio químico',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-10-1', name: '10.1 Velocidades e mecanismos de reação', status: 'not_started' },
            { id: 'sub-qui-10-2', name: '10.2 Equação de velocidade, teoria de colisões, complexo ativado, catálise', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-11',
          name: '11 Química Orgânica',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-11-1', name: '11.1 Princípios básicos da nomenclatura orgânica', status: 'not_started' },
            { id: 'sub-qui-11-2', name: '11.2 Funções orgânicas, reações e mecanismos de reação', status: 'not_started' }
          ]
        },
        {
          id: 'top-qui-12',
          name: '12 Ensino de Química',
          status: 'not_started',
          subtopics: [
            { id: 'sub-qui-12-1', name: '12.1 Conhecimento científico e habilidade didática no ensino de Química', status: 'not_started' },
            { id: 'sub-qui-12-2', name: '12.2 A construção do conhecimento no ensino da Química: abordagens metodológicas', status: 'not_started' }
          ]
        },
        { id: 'top-qui-13', name: '13 Recursos didáticos no ensino de Química (utilizados em sala de aula e laboratório, incluindo conhecimentos básicos de técnicas, materiais e normas de segurança laboratoriais)', status: 'not_started', subtopics: [] },
        { id: 'top-qui-14', name: '14 O ensino de Química e as novas tecnologias da informação e comunicação', status: 'not_started', subtopics: [] },
        { id: 'top-qui-15', name: '15 Avaliação de aprendizagem do conhecimento químico', status: 'not_started', subtopics: [] },
        { id: 'top-qui-16', name: '16 Competências e habilidades propostas pelos Parâmetros Curriculares Nacionais do Ensino Médio para a disciplina de Química', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Sociologia': [
    {
      id: 'bloco-soc-1',
      name: 'Conhecimentos Específicos - Sociologia',
      topics: [
        {
          id: 'top-soc-1',
          name: '1 Contexto histórico do surgimento da Sociologia',
          status: 'not_started',
          subtopics: [
            { id: 'sub-soc-1-1', name: '1.1 A constituição do saber sociológico', status: 'not_started' },
            { id: 'sub-soc-1-2', name: '1.2 A sociologia como ciência', status: 'not_started' },
            { id: 'sub-soc-1-3', name: '1.3 Sociologia e sociedade: conceitos, desenvolvimento da Sociologia', status: 'not_started' }
          ]
        },
        {
          id: 'top-soc-2',
          name: '2 Condicionamentos sócio-culturais da personalidade do indivíduo',
          status: 'not_started',
          subtopics: [
            { id: 'sub-soc-2-1', name: '2.1 Subjetividade e objetividade', status: 'not_started' }
          ]
        },
        {
          id: 'top-soc-3',
          name: '3 Estrutura e organização social',
          status: 'not_started',
          subtopics: [
            { id: 'sub-soc-3-1', name: '3.1 Estrutura da sociedade', status: 'not_started' },
            { id: 'sub-soc-3-2', name: '3.2 Instituições sociais', status: 'not_started' }
          ]
        },
        {
          id: 'top-soc-4',
          name: '4 Pensamento sociológico: conceitos básicos da Teoria de Durkheim, Marx e Weber',
          status: 'not_started',
          subtopics: [
            { id: 'sub-soc-4-1', name: '4.1 Classes sociais, estratificação e desigualdade: Karl Marx e Max Weber', status: 'not_started' },
            { id: 'sub-soc-4-2', name: '4.2 Classe social na sociedade ocidental atual: classes e estilos de vida', status: 'not_started' }
          ]
        },
        {
          id: 'top-soc-5',
          name: '5 Problemas sociais contemporâneos',
          status: 'not_started',
          subtopics: [
            { id: 'sub-soc-5-1', name: '5.1 As desigualdades sociais', status: 'not_started' },
            { id: 'sub-soc-5-2', name: '5.2 Exclusão social', status: 'not_started' },
            { id: 'sub-soc-5-3', name: '5.3 Escola, juventude e violência', status: 'not_started' },
            { id: 'sub-soc-5-4', name: '5.4 A escola e o tratamento das diferenças sociais', status: 'not_started' },
            { id: 'sub-soc-5-5', name: '5.5 Preconceito e discriminação', status: 'not_started' },
            { id: 'sub-soc-5-6', name: '5.6 Movimentos sociais tradicionais e novos', status: 'not_started' },
            { id: 'sub-soc-5-7', name: '5.7 Gênero e envelhecimento', status: 'not_started' },
            { id: 'sub-soc-5-8', name: '5.8 Gênero e violência', status: 'not_started' },
            { id: 'sub-soc-5-9', name: '5.9 Cultura e consumo', status: 'not_started' },
            { id: 'sub-soc-5-10', name: '5.10 Violência e Estado', status: 'not_started' },
            { id: 'sub-soc-5-11', name: '5.11 Migrações', status: 'not_started' },
            { id: 'sub-soc-5-12', name: '5.12 Ética e Cidadania', status: 'not_started' }
          ]
        },
        { id: 'top-soc-6', name: '6 Sociedade, trabalho e emprego, relações sociais e transformações do trabalho', status: 'not_started', subtopics: [] },
        { id: 'top-soc-7', name: '7 Os meios de comunicação e a questão ideológica', status: 'not_started', subtopics: [] },
        { id: 'top-soc-8', name: '8 O meio ambiente e o desenvolvimento tecnológico', status: 'not_started', subtopics: [] },
        { id: 'top-soc-9', name: '9 A globalização e os Estados nacionais', status: 'not_started', subtopics: [] },
        { id: 'top-soc-10', name: '10 Metodologia de ensino de sociologia', status: 'not_started', subtopics: [] },
        { id: 'top-soc-11', name: '11 A globalização e os novos desafios da sociedade', status: 'not_started', subtopics: [] },
        { id: 'top-soc-12', name: '12 Cultura e sociedade: o Estado, a família, a religião, as instituições sociais e o processo de socialização', status: 'not_started', subtopics: [] },
        { id: 'top-soc-13', name: '13 O novo mundo do trabalho', status: 'not_started', subtopics: [] },
        { id: 'top-soc-14', name: '14 A História do sindicalismo no Brasil', status: 'not_started', subtopics: [] },
        { id: 'top-soc-15', name: '15 Os novos movimentos sociais', status: 'not_started', subtopics: [] },
        { id: 'top-soc-16', name: '16 Sociologia no Brasil: cultura e identidade', status: 'not_started', subtopics: [] },
        { id: 'top-soc-17', name: '17 Sociologia no Nordeste: cultura, identidade, religiosidade', status: 'not_started', subtopics: [] }
      ]
    }
  ],

  'Licenciatura em Pedagogia': [
    {
      id: 'bloco-ped-1',
      name: 'Conhecimentos Específicos - Pedagogia e Gestão Educacional',
      topics: [
        { id: 'top-ped-1', name: '1 História do Pensamento Pedagógico e Didática no Brasil', status: 'not_started', subtopics: [] },
        { id: 'top-ped-2', name: '2 Organização do Processo Didático: Planejamento, Estratégias e Avaliação Formativa', status: 'not_started', subtopics: [] },
        { id: 'top-ped-3', name: '3 Teorias da Aprendizagem e Psicologia do Desenvolvimento', status: 'not_started', subtopics: [] },
        { id: 'top-ped-4', name: '4 Projeto Político Pedagógico (PPP) e Gestão Democrática Escolar', status: 'not_started', subtopics: [] },
        { id: 'top-ped-5', name: '5 Currículo, Acesso, Permanência e Sucesso do Aluno na Escola Pública', status: 'not_started', subtopics: [] },
        { id: 'top-ped-6', name: '6 Orientação Educacional, AEE e Desenho Universal para a Aprendizagem (DUA)', status: 'not_started', subtopics: [] }
      ]
    }
  ]
};
