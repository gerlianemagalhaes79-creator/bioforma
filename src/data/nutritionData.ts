export interface VitaminDetail {
  name: string;
  alias?: string;
  amount: number;
  unit: 'mg' | 'mcg' | 'UI';
  dailyValuePct: number;
  function: string;
  significance: 'Excelente fonte' | 'Boa fonte' | 'Presente' | 'Traço';
  solubility: 'hidrossolúvel' | 'lipossolúvel';
}

export interface FoodCompleteNutrition {
  name: string;
  kcal: number;
  calories?: number;
  p: number;
  protein?: number;
  c: number;
  carbs?: number;
  f: number;
  fat?: number;
  weight?: number;
  sodium: number;
  fiber: number;
  potassium: number;
  calcium: number;
  iron: number;
  // All essential vitamins
  vitaminA: number; // mcg
  vitaminB1: number; // mg
  vitaminB2: number; // mg
  vitaminB3: number; // mg
  vitaminB5: number; // mg
  vitaminB6: number; // mg
  vitaminB7: number; // mcg
  vitaminB9: number; // mcg
  vitaminB12: number; // mcg
  vitaminC: number; // mg
  vitaminD: number; // mcg
  vitaminE: number; // mg
  vitaminK: number; // mcg
  choline: number; // mg
  allVitamins: VitaminDetail[];
  source: string;
  absorptionTip?: string;
}

export const DAILY_RECOMMENDED_VITAMINS = {
  vitaminA: { name: 'Vitamina A (Retinol/Betacaroteno)', rda: 900, unit: 'mcg', type: 'lipossolúvel' },
  vitaminB1: { name: 'Vitamina B1 (Tiamina)', rda: 1.2, unit: 'mg', type: 'hidrossolúvel' },
  vitaminB2: { name: 'Vitamina B2 (Riboflavina)', rda: 1.3, unit: 'mg', type: 'hidrossolúvel' },
  vitaminB3: { name: 'Vitamina B3 (Niacina)', rda: 16, unit: 'mg', type: 'hidrossolúvel' },
  vitaminB5: { name: 'Vitamina B5 (Ácido Pantotênico)', rda: 5, unit: 'mg', type: 'hidrossolúvel' },
  vitaminB6: { name: 'Vitamina B6 (Piridoxina)', rda: 1.3, unit: 'mg', type: 'hidrossolúvel' },
  vitaminB7: { name: 'Vitamina B7 (Biotina)', rda: 30, unit: 'mcg', type: 'hidrossolúvel' },
  vitaminB9: { name: 'Vitamina B9 (Folato / Ácido Fólico)', rda: 400, unit: 'mcg', type: 'hidrossolúvel' },
  vitaminB12: { name: 'Vitamina B12 (Cobalamina)', rda: 2.4, unit: 'mcg', type: 'hidrossolúvel' },
  vitaminC: { name: 'Vitamina C (Ácido Ascórbico)', rda: 90, unit: 'mg', type: 'hidrossolúvel' },
  vitaminD: { name: 'Vitamina D (Colecalciferol)', rda: 15, unit: 'mcg', type: 'lipossolúvel' },
  vitaminE: { name: 'Vitamina E (Alfa-tocoferol)', rda: 15, unit: 'mg', type: 'lipossolúvel' },
  vitaminK: { name: 'Vitamina K (Filoquinona / Menaquinona)', rda: 120, unit: 'mcg', type: 'lipossolúvel' },
  choline: { name: 'Colina (Nutriente Essencial)', rda: 450, unit: 'mg', type: 'hidrossolúvel' },
};

// Rich offline food database containing all vitamins per 100g
export const COMPLETE_FOOD_DATABASE: Record<string, FoodCompleteNutrition> = {
  "ovo": {
    name: "Ovo de Galinha Inteiro",
    kcal: 155,
    p: 13.0,
    c: 1.1,
    f: 11.0,
    sodium: 124,
    fiber: 0,
    potassium: 126,
    calcium: 50,
    iron: 1.2,
    vitaminA: 140,
    vitaminB1: 0.07,
    vitaminB2: 0.45,
    vitaminB3: 0.08,
    vitaminB5: 1.4,
    vitaminB6: 0.12,
    vitaminB7: 20.0,
    vitaminB9: 44.0,
    vitaminB12: 1.1,
    vitaminC: 0,
    vitaminD: 2.0,
    vitaminE: 1.05,
    vitaminK: 0.3,
    choline: 250,
    allVitamins: [
      { name: "Colina", alias: "Fosfolipídio Essencial", amount: 250, unit: "mg", dailyValuePct: 56, function: "Saúde cerebral, síntese de acetilcolina e desintoxicação hepática", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B7 (Biotina)", alias: "Vitamina H", amount: 20, unit: "mcg", dailyValuePct: 67, function: "Metabolismo de gorduras, carboidratos e saúde capilar/unhas", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 0.45, unit: "mg", dailyValuePct: 35, function: "Produção de energia celular e respiração mitocondrial", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B12 (Cobalamina)", amount: 1.1, unit: "mcg", dailyValuePct: 46, function: "Formação de hemácias e integridade do sistema nervoso", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 1.4, unit: "mg", dailyValuePct: 28, function: "Síntese de hormônios esteroides e coenzima A", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina A (Retinol)", amount: 140, unit: "mcg", dailyValuePct: 16, function: "Visão, imunidade e diferenciação celular", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Vitamina D (Colecalciferol)", amount: 2.0, unit: "mcg", dailyValuePct: 13, function: "Absorção de cálcio e modulação imunológica", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 44, unit: "mcg", dailyValuePct: 11, function: "Síntese de DNA e divisão celular", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Tocoferol)", amount: 1.05, unit: "mg", dailyValuePct: 7, function: "Antioxidante de membrana celular", significance: "Presente", solubility: "lipossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.12, unit: "mg", dailyValuePct: 9, function: "Metabolismo de aminoácidos e neurotransmissores", significance: "Presente", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO / USDA Nutri",
    absorptionTip: "A gema contém todas as vitaminas lipossolúveis e a colina. Cozinhar o ovo coagula a avidina, liberando 100% da biotina para absorção!"
  },
  "frango": {
    name: "Peito de Frango Grelhado",
    kcal: 165,
    p: 31.0,
    c: 0,
    f: 3.6,
    sodium: 74,
    fiber: 0,
    potassium: 256,
    calcium: 15,
    iron: 1.0,
    vitaminA: 6,
    vitaminB1: 0.07,
    vitaminB2: 0.12,
    vitaminB3: 13.7,
    vitaminB5: 0.9,
    vitaminB6: 0.6,
    vitaminB7: 2.0,
    vitaminB9: 4.0,
    vitaminB12: 0.34,
    vitaminC: 0,
    vitaminD: 0.1,
    vitaminE: 0.27,
    vitaminK: 0.3,
    choline: 85,
    allVitamins: [
      { name: "Vitamina B3 (Niacina)", amount: 13.7, unit: "mg", dailyValuePct: 86, function: "Metabolismo energético, reparo do DNA e saúde celular", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.6, unit: "mg", dailyValuePct: 46, function: "Síntese proteica, hemoglobina e metabolismo de glicogênio", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Colina", amount: 85, unit: "mg", dailyValuePct: 19, function: "Sinalização celular e saúde hepática", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 0.9, unit: "mg", dailyValuePct: 18, function: "Conversão de alimentos em energia e síntese hormonal", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B12 (Cobalamina)", amount: 0.34, unit: "mcg", dailyValuePct: 14, function: "Formação de células sanguíneas e bainha de mielina", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 0.12, unit: "mg", dailyValuePct: 9, function: "Respiração celular e antioxidante enzimático", significance: "Presente", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO Oficial",
    absorptionTip: "Excelente biodisponibilidade de vitaminas do complexo B. Não remova totalmente a umidade do cozimento para reter as vitaminas hidrossolúveis."
  },
  "salmao": {
    name: "Salmão Grelhado / Fresco",
    kcal: 208,
    p: 20.0,
    c: 0,
    f: 13.0,
    sodium: 59,
    fiber: 0,
    potassium: 363,
    calcium: 9,
    iron: 0.34,
    vitaminA: 50,
    vitaminB1: 0.23,
    vitaminB2: 0.38,
    vitaminB3: 8.5,
    vitaminB5: 1.6,
    vitaminB6: 0.64,
    vitaminB7: 5.0,
    vitaminB9: 25.0,
    vitaminB12: 3.2,
    vitaminC: 0,
    vitaminD: 11.0,
    vitaminE: 2.8,
    vitaminK: 0.5,
    choline: 90,
    allVitamins: [
      { name: "Vitamina B12 (Cobalamina)", amount: 3.2, unit: "mcg", dailyValuePct: 133, function: "Vitalidade do sistema nervoso e regeneração de hemácias", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina D (Colecalciferol)", amount: 11.0, unit: "mcg", dailyValuePct: 73, function: "Fixação de cálcio, saúde óssea, síntese hormonal e imunidade", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B3 (Niacina)", amount: 8.5, unit: "mg", dailyValuePct: 53, function: "Metabolismo de lipídios e produção de ATP", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.64, unit: "mg", dailyValuePct: 49, function: "Produção de serotonina, dopamina e síntese muscular", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 1.6, unit: "mg", dailyValuePct: 32, function: "Saúde das adrenais e metabolismo energético", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 0.38, unit: "mg", dailyValuePct: 29, function: "Proteção contra estresse oxidativo nas células", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B1 (Tiamina)", amount: 0.23, unit: "mg", dailyValuePct: 19, function: "Metabolismo de carboidratos e função neural", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Tocoferol)", amount: 2.8, unit: "mg", dailyValuePct: 19, function: "Proteção antioxidante dos ácidos graxos ômega-3", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Colina", amount: 90, unit: "mg", dailyValuePct: 20, function: "Integridade de membranas celulares e suporte hepático", significance: "Boa fonte", solubility: "hidrossolúvel" }
    ],
    source: "USDA Food Database",
    absorptionTip: "A riqueza natural em gorduras boas (ômega-3) potencializa a absorção da Vitamina D e E sem necessidade de adição de outros óleos!"
  },
  "laranja": {
    name: "Laranja Pêra Fresca",
    kcal: 47,
    p: 0.9,
    c: 11.7,
    f: 0.1,
    sodium: 1,
    fiber: 2.4,
    potassium: 181,
    calcium: 40,
    iron: 0.1,
    vitaminA: 11,
    vitaminB1: 0.087,
    vitaminB2: 0.04,
    vitaminB3: 0.28,
    vitaminB5: 0.25,
    vitaminB6: 0.06,
    vitaminB7: 1.0,
    vitaminB9: 30.0,
    vitaminB12: 0,
    vitaminC: 53.2,
    vitaminD: 0,
    vitaminE: 0.18,
    vitaminK: 0.1,
    choline: 8.4,
    allVitamins: [
      { name: "Vitamina C (Ácido Ascórbico)", amount: 53.2, unit: "mg", dailyValuePct: 59, function: "Síntese de colágeno, absorção de ferro vegetal e imunidade", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 30, unit: "mcg", dailyValuePct: 8, function: "Renovação celular e síntese de neurotransmissores", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B1 (Tiamina)", amount: 0.087, unit: "mg", dailyValuePct: 7, function: "Metabolismo de glicose e vigor físico", significance: "Presente", solubility: "hidrossolúvel" },
      { name: "Vitamina A (Carotenoides)", amount: 11, unit: "mcg", dailyValuePct: 2, function: "Proteção de tecidos epiteliais e visão", significance: "Presente", solubility: "lipossolúvel" }
    ],
    source: "Tabela TACO Oficial",
    absorptionTip: "Consuma a laranja inteira com o bagaço para aproveitar as fibras que regulam a absorção dos açúcares e preservam os bioflavonoides."
  },
  "abacate": {
    name: "Abacate Fresco",
    kcal: 160,
    p: 2.0,
    c: 8.5,
    f: 14.7,
    sodium: 7,
    fiber: 6.7,
    potassium: 485,
    calcium: 12,
    iron: 0.55,
    vitaminA: 7,
    vitaminB1: 0.067,
    vitaminB2: 0.13,
    vitaminB3: 1.74,
    vitaminB5: 1.39,
    vitaminB6: 0.26,
    vitaminB7: 10.0,
    vitaminB9: 81.0,
    vitaminB12: 0,
    vitaminC: 10.0,
    vitaminD: 0,
    vitaminE: 2.07,
    vitaminK: 21.0,
    choline: 14.2,
    allVitamins: [
      { name: "Vitamina B9 (Folato)", amount: 81, unit: "mcg", dailyValuePct: 20, function: "Síntese de aminoácidos, renovação de tecidos e controle de homocisteína", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina K (Filoquinona)", amount: 21, unit: "mcg", dailyValuePct: 18, function: "Coagulação sanguínea e direcionamento do cálcio aos ossos", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 1.39, unit: "mg", dailyValuePct: 28, function: "Metabolismo lipídico e equilíbrio adrenal", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.26, unit: "mg", dailyValuePct: 20, function: "Regulação hormonal e síntese de dopamina", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Tocoferol)", amount: 2.07, unit: "mg", dailyValuePct: 14, function: "Antioxidante protetor contra radicais livres e saúde da pele", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Vitamina C (Ácido Ascórbico)", amount: 10.0, unit: "mg", dailyValuePct: 11, function: "Ação antioxidante e suporte imunológico", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B3 (Niacina)", amount: 1.74, unit: "mg", dailyValuePct: 11, function: "Geração de energia celular", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 0.13, unit: "mg", dailyValuePct: 10, function: "Auxílio no metabolismo oxidativo", significance: "Boa fonte", solubility: "hidrossolúvel" }
    ],
    source: "USDA Nutri Database",
    absorptionTip: "O perfil de gorduras monoinsaturadas do abacate aumenta em até 4 vezes a absorção de vitaminas lipossolúveis (A, D, E, K) de outros alimentos consumidos juntos!"
  },
  "figado": {
    name: "Fígado Bovino Grelhado",
    kcal: 175,
    p: 27.0,
    c: 3.9,
    f: 5.0,
    sodium: 70,
    fiber: 0,
    potassium: 350,
    calcium: 11,
    iron: 6.5,
    vitaminA: 7700,
    vitaminB1: 0.26,
    vitaminB2: 3.0,
    vitaminB3: 13.2,
    vitaminB5: 7.2,
    vitaminB6: 1.0,
    vitaminB7: 42.0,
    vitaminB9: 290.0,
    vitaminB12: 59.0,
    vitaminC: 1.3,
    vitaminD: 1.2,
    vitaminE: 0.4,
    vitaminK: 3.1,
    choline: 420,
    allVitamins: [
      { name: "Vitamina B12 (Cobalamina)", amount: 59.0, unit: "mcg", dailyValuePct: 2450, function: "Energia celular extrema, reparação nervosa e hematopoiese", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina A (Retinol Ativo)", amount: 7700, unit: "mcg", dailyValuePct: 855, function: "Visão, diferenciação celular e integridade da mucosa", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 3.0, unit: "mg", dailyValuePct: 230, function: "Cofator em dezenas de reações enzimáticas", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 7.2, unit: "mg", dailyValuePct: 144, function: "Síntese hormonal e metabolismo energético", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Colina", amount: 420, unit: "mg", dailyValuePct: 93, function: "Saúde hepática profunda e neurotransmissão", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B3 (Niacina)", amount: 13.2, unit: "mg", dailyValuePct: 82, function: "Reparo celular e síntese de NAD+", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 1.0, unit: "mg", dailyValuePct: 77, function: "Metabolismo de proteínas e regulação de humor", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 290, unit: "mcg", dailyValuePct: 72, function: "Divisão celular e saúde genética", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B7 (Biotina)", amount: 42, unit: "mcg", dailyValuePct: 140, function: "Regulação de genes e saúde dérmica", significance: "Excelente fonte", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO / USDA Nutri",
    absorptionTip: "O alimento mais denso em micronutrientes do planeta! O ferro heme e a Vitamina A são 100% bioativos e absorvidos com máxima eficiência pelo organismo."
  },
  "espinafre": {
    name: "Espinafre Refogado / Cozido",
    kcal: 23,
    p: 3.0,
    c: 3.8,
    f: 0.4,
    sodium: 70,
    fiber: 2.4,
    potassium: 460,
    calcium: 136,
    iron: 3.5,
    vitaminA: 524,
    vitaminB1: 0.1,
    vitaminB2: 0.24,
    vitaminB3: 0.5,
    vitaminB5: 0.15,
    vitaminB6: 0.24,
    vitaminB7: 1.5,
    vitaminB9: 146.0,
    vitaminB12: 0,
    vitaminC: 9.8,
    vitaminD: 0,
    vitaminE: 2.1,
    vitaminK: 483.0,
    choline: 19.3,
    allVitamins: [
      { name: "Vitamina K (Filoquinona)", amount: 483, unit: "mcg", dailyValuePct: 402, function: "Coagulação sanguínea, densidade óssea e flexibilidade vascular", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina A (Betacaroteno)", amount: 524, unit: "mcg", dailyValuePct: 58, function: "Antioxidante ocular e saúde da pele", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 146, unit: "mcg", dailyValuePct: 36, function: "Reparo de DNA e formação de células sanguíneas", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B2 (Riboflavina)", amount: 0.24, unit: "mg", dailyValuePct: 18, function: "Metabolismo de energia celular", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Alfa-tocoferol)", amount: 2.1, unit: "mg", dailyValuePct: 14, function: "Combate ao estresse oxidativo muscular", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Vitamina C (Ácido Ascórbico)", amount: 9.8, unit: "mg", dailyValuePct: 11, function: "Auxílio na absorção do ferro não-heme", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.24, unit: "mg", dailyValuePct: 18, function: "Suporte aos neurotransmissores", significance: "Boa fonte", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO Oficial",
    absorptionTip: "Cozinhar levemente reduz os oxalatos e aumenta em até 3x a biodisponibilidade do betacaroteno e do cálcio. Adicione azeite para absorver a Vitamina K e A!"
  },
  "brocolis": {
    name: "Brócolis Cozido no Vapor",
    kcal: 35,
    p: 2.4,
    c: 7.2,
    f: 0.4,
    sodium: 41,
    fiber: 3.3,
    potassium: 293,
    calcium: 40,
    iron: 0.7,
    vitaminA: 77,
    vitaminB1: 0.06,
    vitaminB2: 0.12,
    vitaminB3: 0.64,
    vitaminB5: 0.57,
    vitaminB6: 0.2,
    vitaminB7: 1.8,
    vitaminB9: 108.0,
    vitaminB12: 0,
    vitaminC: 65.0,
    vitaminD: 0,
    vitaminE: 1.5,
    vitaminK: 141.0,
    choline: 40.1,
    allVitamins: [
      { name: "Vitamina K (Filoquinona)", amount: 141, unit: "mcg", dailyValuePct: 117, function: "Mineralização óssea e proteção cardiovascular", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina C (Ácido Ascórbico)", amount: 65.0, unit: "mg", dailyValuePct: 72, function: "Poderoso antioxidante e neutralizador de radicais livres", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 108, unit: "mcg", dailyValuePct: 27, function: "Síntese celular e desintoxicação de estrogênios", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.2, unit: "mg", dailyValuePct: 15, function: "Metabolismo de aminoácidos", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina B5 (Ácido Pantotênico)", amount: 0.57, unit: "mg", dailyValuePct: 11, function: "Energia e regeneração tecidual", significance: "Boa fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Tocoferol)", amount: 1.5, unit: "mg", dailyValuePct: 10, function: "Proteção da membrana celular", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Vitamina A (Carotenoides)", amount: 77, unit: "mcg", dailyValuePct: 9, function: "Proteção imunológica", significance: "Boa fonte", solubility: "lipossolúvel" },
      { name: "Colina", amount: 40.1, unit: "mg", dailyValuePct: 9, function: "Saúde hepática e sinalização de membranas", significance: "Boa fonte", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO / USDA",
    absorptionTip: "O cozimento no vapor por 3 a 4 minutos preserva o sulforafano e evita a perda da vitamina C na água de cozimento!"
  },
  "castanha": {
    name: "Castanha-do-Pará (Brasil)",
    kcal: 656,
    p: 14.3,
    c: 12.3,
    f: 66.4,
    sodium: 3,
    fiber: 7.5,
    potassium: 659,
    calcium: 160,
    iron: 2.4,
    vitaminA: 0,
    vitaminB1: 0.62,
    vitaminB2: 0.04,
    vitaminB3: 0.3,
    vitaminB5: 0.18,
    vitaminB6: 0.1,
    vitaminB7: 3.5,
    vitaminB9: 22.0,
    vitaminB12: 0,
    vitaminC: 0.7,
    vitaminD: 0,
    vitaminE: 5.7,
    vitaminK: 0.1,
    choline: 28.8,
    allVitamins: [
      { name: "Vitamina B1 (Tiamina)", amount: 0.62, unit: "mg", dailyValuePct: 52, function: "Metabolismo de carboidratos e contração muscular", significance: "Excelente fonte", solubility: "hidrossolúvel" },
      { name: "Vitamina E (Alfa-tocoferol)", amount: 5.7, unit: "mg", dailyValuePct: 38, function: "Maior antioxidante lipossolúvel, protege vasos sanguíneos e fertilidade", significance: "Excelente fonte", solubility: "lipossolúvel" },
      { name: "Vitamina B9 (Folato)", amount: 22, unit: "mcg", dailyValuePct: 6, function: "Saúde celular e síntese protéica", significance: "Presente", solubility: "hidrossolúvel" },
      { name: "Vitamina B6 (Piridoxina)", amount: 0.1, unit: "mg", dailyValuePct: 8, function: "Metabolismo proteico", significance: "Presente", solubility: "hidrossolúvel" }
    ],
    source: "Tabela TACO Oficial",
    absorptionTip: "Apenas 1 ou 2 unidades por dia fornecem 100% do selênio necessário para a conversão do hormônio tireoidiano T4 em T3 ativo, potencializando a ação da Vitamina E."
  }
};

// Available specialties for the Nutritionist persona
export interface NutritionistSpecialty {
  id: string;
  name: string;
  shortLabel: string;
  category: 'Feminino' | 'Geral' | 'Performance' | 'Saúde';
  description: string;
  clinicalFocus: string[];
  keyStrategies: string[];
  examplePrompt: string;
  badgeColor: string;
}

export const AVAILABLE_SPECIALTIES: NutritionistSpecialty[] = [
  {
    id: "hipertrofia",
    name: "Hipertrofia",
    shortLabel: "Hipertrofia",
    category: "Performance",
    description: "Especialista em ganho de massa muscular magra, síntese proteica (ativação de mTOR), periodização de carboidratos ao redor dos treinos, leucina e recuperação neuromuscular sem ganho excessivo de gordura.",
    clinicalFocus: [
      "Distribuição proteica de 1.8 a 2.2g/kg para hipertrofia com balanço nitrogenado positivo",
      "Timing estratégico de carboidratos no pré e pós-treino para força e glicogênio muscular",
      "Aporte ótimo de leucina (2.5 a 3.0g por refeição principal) para disparar a síntese muscular",
      "Suplementação baseada em evidência: Creatina monoidratada (3-5g/dia) e micronutrientes para contração"
    ],
    keyStrategies: [
      "Superávit calórico controlado (+200 a +350 kcal) com alta densidade nutricional",
      "Carga glicêmica sincronizada com a intensidade dos treinos de membros inferiores e superiores"
    ],
    examplePrompt: "Como estruturar minha alimentação pós-treino para ganho máximo de massa magra?",
    badgeColor: "bg-pink-500/10 text-pink-600 border-pink-200"
  },
  {
    id: "emagrecimento",
    name: "Emagrecimento",
    shortLabel: "Emagrecimento",
    category: "Saúde",
    description: "Especialista em déficit calórico estratégico, redução acelerada de gordura corporal e visceral com preservação máxima de massa magra, saciedade prolongada e integridade metabólica.",
    clinicalFocus: [
      "Déficit energético moderado e sustentável (-300 a -500 kcal) sem redução da taxa metabólica basal",
      "Ingestão proteica elevada (2.0 a 2.4g/kg) para blindar a massa magra durante o déficit",
      "Alimentos de alto índice de saciedade e volume gástrico (fibras solúveis, vegetais crocantes, água)",
      "Manejo do cortisol e sono para facilitar a lipólise e oxidação de ácidos graxos"
    ],
    keyStrategies: [
      "Prato inteligente com 50% de vegetais ricos em fibras para saciedade mecânica",
      "Estratégia de janelas alimentares e substituições de baixa densidade calórica"
    ],
    examplePrompt: "Qual a melhor estratégia para queimar gordura sem perder massa muscular e sem passar fome?",
    badgeColor: "bg-blue-500/10 text-blue-600 border-blue-200"
  },
  {
    id: "sop",
    name: "SOP (Síndrome dos Ovários Policísticos)",
    shortLabel: "SOP & Hormonal",
    category: "Feminino",
    description: "Especialista clínica no manejo nutricional da SOP. Foco absoluto no combate à resistência à insulina, estabilização da curva glicêmica, redução de inflamação subclínica e regulação menstrual e hormonal.",
    clinicalFocus: [
      "Dieta de baixa carga glicêmica para eliminar picos de insulina que estimulam produção de andrógenos ovarianos",
      "Protocolo anti-inflamatório rico em ômega-3, curcumina, polifenóis e fitoquímicos",
      "Nutracêuticos padrão ouro: Mio-Inositol + D-Quiro-Inositol (proporção 40:1), magnésio bisglicinato, cromo e canela",
      "Controle clínico de sintomas: acne hormonal, queda capilar, inchaço e compulsão por doces na fase pré-menstrual"
    ],
    keyStrategies: [
      "Combinação mandatória de carboidratos com fibras e proteínas em todas as refeições",
      "Zero carboidratos simples isolados para blindar os receptores celulares de insulina"
    ],
    examplePrompt: "Tenho SOP e dificuldade de emagrecer. Como a alimentação pode controlar minha insulina?",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200"
  },
  {
    id: "recomposicao",
    name: "Recomposição Corporal",
    shortLabel: "Recomposição",
    category: "Performance",
    description: "Especialista em Recomposição Corporal simultânea: perda de gordura associada à hipertrofia muscular. Balanço energético em normocalórica ou leve déficit com alta ingestão proteica.",
    clinicalFocus: [
      "Calorias em manutenção ou déficit sutil (-200 a -300 kcal) para manter rendimento de força nos treinos",
      "Proteína em 2.0 a 2.4g/kg fracionada a cada 3 a 4 horas para manter síntese proteica (MPS) ativa",
      "Priorização de sobrecarga progressiva nos treinos aliada a carboidratos complexos de alta qualidade",
      "Avaliação por medidas e bioimpedância, ignorando flutuações pontuais de peso na balança"
    ],
    keyStrategies: [
      "Ciclagem de carboidratos (dias de treino pesado vs dias de descanso)",
      "Timing de 30-40g de proteína de alto valor biológico antes de dormir e pós-treino"
    ],
    examplePrompt: "Como consigo queimar gordura e ganhar músculo ao mesmo tempo sem perder peso na balança?",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200"
  },
  {
    id: "nutricao_esportiva",
    name: "Nutrição Esportiva & Performance",
    shortLabel: "Nutrição Esportiva",
    category: "Performance",
    description: "Especialista em rendimento esportivo, potência muscular, ressíntese rápida de glicogênio e suplementação baseada em evidência científica nível A (ISSN/AIS).",
    clinicalFocus: [
      "Maximização de estoques de glicogênio hepático e muscular para treinos de alta intensidade",
      "Hidratação isotônica e reposição eletrolítica calculada (sódio, potássio, magnésio)",
      "Uso de ergogênicos comprovados: Creatina, Cafeína, Beta-Alanina e Nitratos (suco de beterraba)"
    ],
    keyStrategies: [
      "Nutrição peri-treino (pré, intra e pós-treino imediato)",
      "Recuperação neuromuscular acelerada entre sessões"
    ],
    examplePrompt: "Qual a melhor suplementação e refeição pré-treino para ter mais força e resistência?",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-200"
  },
  {
    id: "saude_intestinal",
    name: "Saúde Intestinal & Microbiota",
    shortLabel: "Saúde Intestinal",
    category: "Saúde",
    description: "Especialista em digestibilidade, microbiota intestinal saudável, barreira mucosa e eliminação de inchaço, gases e distensão abdominal crônica.",
    clinicalFocus: [
      "Diversidade de fibras prebióticas (inulina, amido resistente, pectina) para bactérias benéficas",
      "Redução de FODMAPs fermentáveis em fases de sensibilidade e desinflamação",
      "Otimização da absorção de vitaminas e minerais no trato gastrointestinal"
    ],
    keyStrategies: [
      "Alimentos fermentados vivos (kefir, iogurte natural) e glutamina para mucosa",
      "Mastigação e acidez gástrica adequada para digestão completa de proteínas"
    ],
    examplePrompt: "Sinto minha barriga sempre inchada e estufada no final do dia. O que pode ser na minha alimentação?",
    badgeColor: "bg-teal-500/10 text-teal-600 border-teal-200"
  },
  {
    id: "antiinflamatoria",
    name: "Nutrição Anti-inflamatória & Longevidade",
    shortLabel: "Anti-inflamatória",
    category: "Saúde",
    description: "Especialista em modulação de marcadores inflamatórios (PCR, citocinas), saúde mitocondrial, antioxidantes naturais e longevidade celular.",
    clinicalFocus: [
      "Eliminação de óleos vegetais refinados pró-inflamatórios e produtos ultraprocessados",
      "Alta ingestão de polifenóis (frutas vermelhas, cacau 70%+, chá verde, azeite extravirgem)",
      "Proporção adequada de Ômega-3 vs Ômega-6 para desinflamar tecidos e articulações"
    ],
    keyStrategies: [
      "Dieta estilo mediterrânea com cores variadas e fitoquímicos em todas as refeições",
      "Proteção de telômeros e redução do estresse oxidativo celular"
    ],
    examplePrompt: "Quais os melhores alimentos anti-inflamatórios para acelerar minha recuperação e proteger as articulações?",
    badgeColor: "bg-indigo-500/10 text-indigo-600 border-indigo-200"
  },
  {
    id: "saciedade_compulsao",
    name: "Controle de Saciedade & Compulsão",
    shortLabel: "Saciedade & Compulsão",
    category: "Geral",
    description: "Especialista comportamental e bioquímico em saciedade, controle de grelina/leptina, regulação de dopamina e controle de compulsão alimentar noturna.",
    clinicalFocus: [
      "Densidade nutricional com volume gástrico (fibras solúveis, água e vegetais crocantes)",
      "Aporte de triptofano e tirosina para produção estável de serotonina e dopamina",
      "Técnicas de saciedade proteica que evitam quedas bruscas de glicose que geram fissura por doces"
    ],
    keyStrategies: [
      "Estratégia de prato equilibrado com 50% de salada e legumes para esticar mecanicamente o estômago",
      "Substituições inteligentes e saudáveis para momentos de ansiedade"
    ],
    examplePrompt: "Sinto muita vontade de comer doces e carboidratos à noite. Como a nutrição pode me ajudar a controlar?",
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-200"
  },
  {
    id: "resistencia_insulina",
    name: "Resistência à Insulina & Glicemia",
    shortLabel: "Glicemia & Insulina",
    category: "Saúde",
    description: "Especialista em estabilidade glicêmica, sensibilidade insulínica celular, prevenção de esteatose hepática e flexibilidade metabólica.",
    clinicalFocus: [
      "Estabilização das curvas pós-prandiais de glicose e insulina",
      "Prescrição de vinagre de maçã antes das refeições principais e caminhadas pós-prandiais de 10 min",
      "Aporte de minerais sensibilizadores da insulina: Cromo, Magnésio, Zinco e Ácido Alfa-Lipóico"
    ],
    keyStrategies: [
      "Ordem correta de ingestão: 1º fibras/salada, 2º proteínas/gorduras, 3º carboidratos",
      "Troca de amidos refinados por amidos resistentes e tubérculos integrais"
    ],
    examplePrompt: "Como evitar picos de glicose e melhorar a sensibilidade à insulina com a alimentação?",
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-200"
  }
];

export function findSpecialtyByName(nameOrId: string): NutritionistSpecialty | undefined {
  if (!nameOrId) return undefined;
  const norm = nameOrId.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return AVAILABLE_SPECIALTIES.find(s => {
    const sNorm = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const shortNorm = s.shortLabel.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const idNorm = s.id.toLowerCase().replace(/_/g, " ");
    return sNorm === norm || sNorm.includes(norm) || norm.includes(sNorm) ||
           shortNorm === norm || shortNorm.includes(norm) || norm.includes(shortNorm) ||
           idNorm === norm || idNorm.includes(norm) || norm.includes(idNorm);
  });
}

// Helper to generate full vitamins list for any given food name and gram weight
export function calculateAllVitaminsForFood(foodName: string, grams: number): FoodCompleteNutrition {
  const norm = foodName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  const factor = grams / 100;

  // Check direct match in complete database
  for (const key of Object.keys(COMPLETE_FOOD_DATABASE)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      const item = COMPLETE_FOOD_DATABASE[key];
      return scaleFoodNutrition(item, factor, grams);
    }
  }

  // Heuristic baseline if not in database
  let defaultKcal = 120;
  let defaultP = 4;
  let defaultC = 15;
  let defaultF = 2;
  let vitA = 10;
  let vitB1 = 0.05;
  let vitB2 = 0.08;
  let vitB3 = 1.0;
  let vitB5 = 0.4;
  let vitB6 = 0.1;
  let vitB7 = 1.0;
  let vitB9 = 20.0;
  let vitB12 = 0;
  let vitC = 5.0;
  let vitD = 0;
  let vitE = 0.5;
  let vitK = 5.0;
  let choline = 15.0;
  let source = "Estimativa Nutricional BioForma";

  if (norm.includes("ovo")) {
    defaultKcal = 155; defaultP = 13; defaultC = 1.1; defaultF = 11;
    vitA = 140; vitB1 = 0.07; vitB2 = 0.45; vitB5 = 1.4; vitB6 = 0.12; vitB7 = 20; vitB9 = 44; vitB12 = 1.1; vitD = 2.0; choline = 250;
  } else if (norm.includes("frango") || norm.includes("ave") || norm.includes("peru")) {
    defaultKcal = 165; defaultP = 31; defaultC = 0; defaultF = 3.6;
    vitB3 = 13.7; vitB6 = 0.6; vitB12 = 0.34; vitB5 = 0.9; choline = 85;
  } else if (norm.includes("peixe") || norm.includes("atum") || norm.includes("sardinha") || norm.includes("tilapia") || norm.includes("salmao")) {
    defaultKcal = 180; defaultP = 22; defaultC = 0; defaultF = 10;
    vitD = 8.0; vitB12 = 2.8; vitB3 = 8.0; vitB6 = 0.5; vitE = 2.0; choline = 80;
  } else if (norm.includes("carne") || norm.includes("boi") || norm.includes("bife") || norm.includes("patinho") || norm.includes("alcatra")) {
    defaultKcal = 200; defaultP = 26; defaultC = 0; defaultF = 10;
    vitB12 = 2.6; vitB3 = 5.5; vitB6 = 0.5; vitA = 2.0; choline = 75;
  } else if (norm.includes("folha") || norm.includes("couve") || norm.includes("salada") || norm.includes("alface") || norm.includes("legume")) {
    defaultKcal = 25; defaultP = 2; defaultC = 4; defaultF = 0.2;
    vitA = 350; vitC = 25; vitK = 180; vitB9 = 90; vitE = 1.2;
  } else if (norm.includes("fruta") || norm.includes("maca") || norm.includes("banana") || norm.includes("morango") || norm.includes("mamao") || norm.includes("laranja")) {
    defaultKcal = 60; defaultP = 0.8; defaultC = 14; defaultF = 0.2;
    vitC = 45; vitA = 25; vitB6 = 0.15; vitB9 = 25; vitB1 = 0.06;
  } else if (norm.includes("leite") || norm.includes("iogurte") || norm.includes("queijo")) {
    defaultKcal = 80; defaultP = 5; defaultC = 5; defaultF = 4;
    vitA = 50; vitB2 = 0.2; vitB12 = 0.5; vitD = 1.0; choline = 20;
  }

  const allVits: VitaminDetail[] = [];
  if (vitA > 0) allVits.push({ name: "Vitamina A", alias: "Retinol / Carotenoides", amount: parseFloat((vitA * factor).toFixed(1)), unit: "mcg", dailyValuePct: Math.round(((vitA * factor) / 900) * 100), function: "Saúde ocular, integridade epitelial e imunidade", significance: (vitA * factor) >= 150 ? "Excelente fonte" : "Boa fonte", solubility: "lipossolúvel" });
  if (vitB1 > 0) allVits.push({ name: "Vitamina B1", alias: "Tiamina", amount: parseFloat((vitB1 * factor).toFixed(2)), unit: "mg", dailyValuePct: Math.round(((vitB1 * factor) / 1.2) * 100), function: "Metabolismo de glicose e transmissão de impulsos nervosos", significance: (vitB1 * factor) >= 0.2 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB2 > 0) allVits.push({ name: "Vitamina B2", alias: "Riboflavina", amount: parseFloat((vitB2 * factor).toFixed(2)), unit: "mg", dailyValuePct: Math.round(((vitB2 * factor) / 1.3) * 100), function: "Produção de energia celular nas mitocôndrias", significance: (vitB2 * factor) >= 0.25 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB3 > 0) allVits.push({ name: "Vitamina B3", alias: "Niacina", amount: parseFloat((vitB3 * factor).toFixed(1)), unit: "mg", dailyValuePct: Math.round(((vitB3 * factor) / 16) * 100), function: "Reparação de DNA e produção de energia ATP", significance: (vitB3 * factor) >= 3.0 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB5 > 0) allVits.push({ name: "Vitamina B5", alias: "Ácido Pantotênico", amount: parseFloat((vitB5 * factor).toFixed(1)), unit: "mg", dailyValuePct: Math.round(((vitB5 * factor) / 5) * 100), function: "Síntese hormonal e coenzima A", significance: (vitB5 * factor) >= 1.0 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB6 > 0) allVits.push({ name: "Vitamina B6", alias: "Piridoxina", amount: parseFloat((vitB6 * factor).toFixed(2)), unit: "mg", dailyValuePct: Math.round(((vitB6 * factor) / 1.3) * 100), function: "Metabolismo de proteínas e neurotransmissores", significance: (vitB6 * factor) >= 0.25 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB7 > 0) allVits.push({ name: "Vitamina B7", alias: "Biotina", amount: parseFloat((vitB7 * factor).toFixed(1)), unit: "mcg", dailyValuePct: Math.round(((vitB7 * factor) / 30) * 100), function: "Saúde da pele, cabelos e síntese de ácidos graxos", significance: (vitB7 * factor) >= 6.0 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB9 > 0) allVits.push({ name: "Vitamina B9", alias: "Folato", amount: parseFloat((vitB9 * factor).toFixed(1)), unit: "mcg", dailyValuePct: Math.round(((vitB9 * factor) / 400) * 100), function: "Síntese de DNA e formação de hemácias", significance: (vitB9 * factor) >= 60 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitB12 > 0) allVits.push({ name: "Vitamina B12", alias: "Cobalamina", amount: parseFloat((vitB12 * factor).toFixed(2)), unit: "mcg", dailyValuePct: Math.round(((vitB12 * factor) / 2.4) * 100), function: "Manutenção do sistema nervoso e renovação celular", significance: (vitB12 * factor) >= 0.5 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitC > 0) allVits.push({ name: "Vitamina C", alias: "Ácido Ascórbico", amount: parseFloat((vitC * factor).toFixed(1)), unit: "mg", dailyValuePct: Math.round(((vitC * factor) / 90) * 100), function: "Síntese de colágeno e ação antioxidante", significance: (vitC * factor) >= 15 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });
  if (vitD > 0) allVits.push({ name: "Vitamina D", alias: "Colecalciferol", amount: parseFloat((vitD * factor).toFixed(2)), unit: "mcg", dailyValuePct: Math.round(((vitD * factor) / 15) * 100), function: "Absorção de cálcio, ossos fortes e imunidade", significance: (vitD * factor) >= 2.0 ? "Excelente fonte" : "Boa fonte", solubility: "lipossolúvel" });
  if (vitE > 0) allVits.push({ name: "Vitamina E", alias: "Tocoferol", amount: parseFloat((vitE * factor).toFixed(1)), unit: "mg", dailyValuePct: Math.round(((vitE * factor) / 15) * 100), function: "Proteção contra envelhecimento celular", significance: (vitE * factor) >= 2.0 ? "Excelente fonte" : "Boa fonte", solubility: "lipossolúvel" });
  if (vitK > 0) allVits.push({ name: "Vitamina K", alias: "Filoquinona", amount: parseFloat((vitK * factor).toFixed(1)), unit: "mcg", dailyValuePct: Math.round(((vitK * factor) / 120) * 100), function: "Fixação de cálcio e coagulação sanguínea", significance: (vitK * factor) >= 20 ? "Excelente fonte" : "Boa fonte", solubility: "lipossolúvel" });
  if (choline > 0) allVits.push({ name: "Colina", alias: "Nutriente Essencial", amount: parseFloat((choline * factor).toFixed(1)), unit: "mg", dailyValuePct: Math.round(((choline * factor) / 450) * 100), function: "Saúde hepática e cognitiva", significance: (choline * factor) >= 50 ? "Excelente fonte" : "Boa fonte", solubility: "hidrossolúvel" });

  return {
    name: foodName,
    kcal: Math.round(defaultKcal * factor),
    p: parseFloat((defaultP * factor).toFixed(1)),
    c: parseFloat((defaultC * factor).toFixed(1)),
    f: parseFloat((defaultF * factor).toFixed(1)),
    calories: Math.round(defaultKcal * factor),
    protein: parseFloat((defaultP * factor).toFixed(1)),
    carbs: parseFloat((defaultC * factor).toFixed(1)),
    fat: parseFloat((defaultF * factor).toFixed(1)),
    weight: grams,
    sodium: Math.round(30 * factor),
    fiber: parseFloat((1.5 * factor).toFixed(1)),
    potassium: Math.round(150 * factor),
    calcium: Math.round(20 * factor),
    iron: parseFloat((0.8 * factor).toFixed(1)),
    vitaminA: parseFloat((vitA * factor).toFixed(1)),
    vitaminB1: parseFloat((vitB1 * factor).toFixed(2)),
    vitaminB2: parseFloat((vitB2 * factor).toFixed(2)),
    vitaminB3: parseFloat((vitB3 * factor).toFixed(1)),
    vitaminB5: parseFloat((vitB5 * factor).toFixed(1)),
    vitaminB6: parseFloat((vitB6 * factor).toFixed(2)),
    vitaminB7: parseFloat((vitB7 * factor).toFixed(1)),
    vitaminB9: parseFloat((vitB9 * factor).toFixed(1)),
    vitaminB12: parseFloat((vitB12 * factor).toFixed(2)),
    vitaminC: parseFloat((vitC * factor).toFixed(1)),
    vitaminD: parseFloat((vitD * factor).toFixed(2)),
    vitaminE: parseFloat((vitE * factor).toFixed(1)),
    vitaminK: parseFloat((vitK * factor).toFixed(1)),
    choline: parseFloat((choline * factor).toFixed(1)),
    allVitamins: allVits,
    source: `${source} (${grams}g)`,
    absorptionTip: "Para absorção máxima de todas as vitaminas, combine com uma ingestão equilibrada de água e fontes saudáveis de lipídios nas refeições principais."
  };
}

function scaleFoodNutrition(base: FoodCompleteNutrition, factor: number, grams: number): FoodCompleteNutrition {
  return {
    name: base.name,
    kcal: Math.round(base.kcal * factor),
    p: parseFloat((base.p * factor).toFixed(1)),
    c: parseFloat((base.c * factor).toFixed(1)),
    f: parseFloat((base.f * factor).toFixed(1)),
    calories: Math.round(base.kcal * factor),
    protein: parseFloat((base.p * factor).toFixed(1)),
    carbs: parseFloat((base.c * factor).toFixed(1)),
    fat: parseFloat((base.f * factor).toFixed(1)),
    weight: grams,
    sodium: Math.round(base.sodium * factor),
    fiber: parseFloat((base.fiber * factor).toFixed(1)),
    potassium: Math.round(base.potassium * factor),
    calcium: Math.round(base.calcium * factor),
    iron: parseFloat((base.iron * factor).toFixed(1)),
    vitaminA: parseFloat((base.vitaminA * factor).toFixed(1)),
    vitaminB1: parseFloat((base.vitaminB1 * factor).toFixed(2)),
    vitaminB2: parseFloat((base.vitaminB2 * factor).toFixed(2)),
    vitaminB3: parseFloat((base.vitaminB3 * factor).toFixed(1)),
    vitaminB5: parseFloat((base.vitaminB5 * factor).toFixed(1)),
    vitaminB6: parseFloat((base.vitaminB6 * factor).toFixed(2)),
    vitaminB7: parseFloat((base.vitaminB7 * factor).toFixed(1)),
    vitaminB9: parseFloat((base.vitaminB9 * factor).toFixed(1)),
    vitaminB12: parseFloat((base.vitaminB12 * factor).toFixed(2)),
    vitaminC: parseFloat((base.vitaminC * factor).toFixed(1)),
    vitaminD: parseFloat((base.vitaminD * factor).toFixed(2)),
    vitaminE: parseFloat((base.vitaminE * factor).toFixed(1)),
    vitaminK: parseFloat((base.vitaminK * factor).toFixed(1)),
    choline: parseFloat((base.choline * factor).toFixed(1)),
    allVitamins: base.allVitamins.map(v => {
      const scaledAmount = parseFloat((v.amount * factor).toFixed(v.unit === 'mg' && v.amount < 1 ? 2 : 1));
      let rda = 100;
      if (v.name.includes("Vitamina A")) rda = 900;
      else if (v.name.includes("B1")) rda = 1.2;
      else if (v.name.includes("B2")) rda = 1.3;
      else if (v.name.includes("B3")) rda = 16;
      else if (v.name.includes("B5")) rda = 5;
      else if (v.name.includes("B6")) rda = 1.3;
      else if (v.name.includes("B7")) rda = 30;
      else if (v.name.includes("B9")) rda = 400;
      else if (v.name.includes("B12")) rda = 2.4;
      else if (v.name.includes("C")) rda = 90;
      else if (v.name.includes("D")) rda = 15;
      else if (v.name.includes("E")) rda = 15;
      else if (v.name.includes("K")) rda = 120;
      else if (v.name.includes("Colina")) rda = 450;
      
      const pct = Math.round((scaledAmount / rda) * 100);
      return {
        ...v,
        amount: scaledAmount,
        dailyValuePct: pct
      };
    }),
    source: `${base.source} (${grams}g)`,
    absorptionTip: base.absorptionTip
  };
}
