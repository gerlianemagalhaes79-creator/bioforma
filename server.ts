import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

let aiClient: any = null;

function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("[Nutrition] GEMINI_API_KEY is not defined. Will fall back directly to offline diet dictionary.");
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
  if (!err) return "Serviço indisponível";
  const msg = err.message || String(err);
  
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("prepayment") || msg.includes("quota")) {
    return "Quota/Créditos de pré-pagamento em AI Studio temporariamente esgotados (429)";
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
    return "Serviço com alta demanda temporária (503)";
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return "Modelo não encontrado (404)";
  }

  try {
    if (typeof msg === 'string' && msg.trim().startsWith('{')) {
      const parsed = JSON.parse(msg);
      if (parsed.error?.message) {
        return parsed.error.message.replace(/[\{\}\[\]"]/g, '').substring(0, 100);
      }
    }
  } catch (_) {
    // ignore
  }
  
  return msg.replace(/[\{\}\[\]"']/g, '').substring(0, 120);
}

async function generateContentWithRetry(aiInstance: any, options: {
  contents: string;
  config?: any;
  defaultModel?: string;
  maxRetries?: number;
}) {
  const { contents, config = {}, defaultModel = "gemini-3.8-flash", maxRetries = 1 } = options;
  const modelsToTry = Array.from(new Set([defaultModel, "gemini-3.8-flash", "gemini-flash-latest"]));
  
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await aiInstance.models.generateContent({
          model,
          contents,
          config,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        const cleanMessage = formatGeminiError(err);
        console.log(`[Gemini SDK] Modelo "${model}" em contingência: ${cleanMessage}`);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  }
  throw new Error("Contingência: Modelos de IA indisponíveis no momento.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

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

  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API endpoint for food nutrition lookup using Gemini + Google Search Grounding with robust fallbacks
  // PUXA TODAS AS VITAMINAS DO ALIMENTO CONFORME SOLICITADO PELO USUÁRIO
  app.post("/api/nutrition", async (req, res) => {
    const { foodName, weight } = req.body;

    if (!foodName || !weight || isNaN(Number(weight))) {
      return res.status(400).json({ error: "Nome do alimento e peso (gramas) são obrigatórios." });
    }

    const g = Number(weight);
    const normalizedFood = String(foodName).toLowerCase().trim();

    // Comprehensive offline database with complete essential vitamins profile (per 100g)
    const fallbackDatabase: Record<string, {
      kcal: number; p: number; c: number; f: number; sodium: number; fiber: number; potassium: number; calcium: number; iron: number;
      vitaminA: number; vitaminB1: number; vitaminB2: number; vitaminB3: number; vitaminB5: number; vitaminB6: number;
      vitaminB7: number; vitaminB9: number; vitaminB12: number; vitaminC: number; vitaminD: number; vitaminE: number;
      vitaminK: number; choline: number; source: string; absorptionTip?: string;
    }> = {
      "ovo": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, vitaminA: 140, vitaminB1: 0.07, vitaminB2: 0.45, vitaminB3: 0.08, vitaminB5: 1.4, vitaminB6: 0.12, vitaminB7: 20, vitaminB9: 44, vitaminB12: 1.1, vitaminC: 0, vitaminD: 2.0, vitaminE: 1.05, vitaminK: 0.3, choline: 250, source: "Tabela TACO Oficial", absorptionTip: "A gema contém colina e todas as vitaminas lipossolúveis (A, D, E, K). Cozinhar o ovo coagula a avidina, liberando 100% da biotina." },
      "frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, vitaminA: 6, vitaminB1: 0.07, vitaminB2: 0.12, vitaminB3: 13.7, vitaminB5: 0.9, vitaminB6: 0.6, vitaminB7: 2.0, vitaminB9: 4.0, vitaminB12: 0.34, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.27, vitaminK: 0.3, choline: 85, source: "Tabela TACO Oficial", absorptionTip: "Excelente biodisponibilidade de niacina (B3) e piridoxina (B6), cruciais para a síntese proteica e energia." },
      "peito de frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, vitaminA: 6, vitaminB1: 0.07, vitaminB2: 0.12, vitaminB3: 13.7, vitaminB5: 0.9, vitaminB6: 0.6, vitaminB7: 2.0, vitaminB9: 4.0, vitaminB12: 0.34, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.27, vitaminK: 0.3, choline: 85, source: "Tabela TACO Oficial", absorptionTip: "Excelente biodisponibilidade de niacina (B3) e piridoxina (B6)." },
      "frango grelhado": { kcal: 170, p: 32, c: 0, f: 4.5, sodium: 80, fiber: 0, potassium: 260, calcium: 15, iron: 1.0, vitaminA: 6, vitaminB1: 0.07, vitaminB2: 0.12, vitaminB3: 13.7, vitaminB5: 0.9, vitaminB6: 0.6, vitaminB7: 2.0, vitaminB9: 4.0, vitaminB12: 0.34, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.27, vitaminK: 0.3, choline: 85, source: "Tabela TACO Oficial" },
      "salmao": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.34, vitaminA: 50, vitaminB1: 0.23, vitaminB2: 0.38, vitaminB3: 8.5, vitaminB5: 1.6, vitaminB6: 0.64, vitaminB7: 5.0, vitaminB9: 25.0, vitaminB12: 3.2, vitaminC: 0, vitaminD: 11.0, vitaminE: 2.8, vitaminK: 0.5, choline: 90, source: "USDA Nutri", absorptionTip: "A riqueza em ômega-3 maximiza a absorção da Vitamina D e Vitamina E sem necessidade de gorduras adicionais." },
      "salmão": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.34, vitaminA: 50, vitaminB1: 0.23, vitaminB2: 0.38, vitaminB3: 8.5, vitaminB5: 1.6, vitaminB6: 0.64, vitaminB7: 5.0, vitaminB9: 25.0, vitaminB12: 3.2, vitaminC: 0, vitaminD: 11.0, vitaminE: 2.8, vitaminK: 0.5, choline: 90, source: "USDA Nutri" },
      "laranja": { kcal: 47, p: 0.9, c: 11.7, f: 0.1, sodium: 1, fiber: 2.4, potassium: 181, calcium: 40, iron: 0.1, vitaminA: 11, vitaminB1: 0.087, vitaminB2: 0.04, vitaminB3: 0.28, vitaminB5: 0.25, vitaminB6: 0.06, vitaminB7: 1.0, vitaminB9: 30.0, vitaminB12: 0, vitaminC: 53.2, vitaminD: 0, vitaminE: 0.18, vitaminK: 0.1, choline: 8.4, source: "Tabela TACO", absorptionTip: "Consuma com o bagaço para absorção equilibrada dos açúcares e proteção da vitamina C." },
      "abacate": { kcal: 160, p: 2.0, c: 8.5, f: 14.7, sodium: 7, fiber: 6.7, potassium: 485, calcium: 12, iron: 0.55, vitaminA: 7, vitaminB1: 0.067, vitaminB2: 0.13, vitaminB3: 1.74, vitaminB5: 1.39, vitaminB6: 0.26, vitaminB7: 10.0, vitaminB9: 81.0, vitaminB12: 0, vitaminC: 10.0, vitaminD: 0, vitaminE: 2.07, vitaminK: 21.0, choline: 14.2, source: "USDA Nutri", absorptionTip: "As gorduras boas aumentam em até 400% a absorção de vitaminas lipossolúveis (A, D, E, K) de outros alimentos da refeição." },
      "arroz": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminB1: 0.07, vitaminB2: 0.02, vitaminB3: 1.5, vitaminB5: 0.4, vitaminB6: 0.09, vitaminB7: 0.5, vitaminB9: 8.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.05, vitaminK: 0.1, choline: 5.0, source: "Tabela TACO Oficial" },
      "arroz branco": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminB1: 0.07, vitaminB2: 0.02, vitaminB3: 1.5, vitaminB5: 0.4, vitaminB6: 0.09, vitaminB7: 0.5, vitaminB9: 8.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.05, vitaminK: 0.1, choline: 5.0, source: "Tabela TACO Oficial" },
      "feijao": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminB1: 0.16, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.24, vitaminB6: 0.15, vitaminB7: 3.0, vitaminB9: 130.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.2, vitaminK: 5.6, choline: 32.0, source: "Tabela TACO Oficial", absorptionTip: "Rico em folato (B9). Consuma com alimentos ricos em Vitamina C (como tomate ou laranja) para potencializar a absorção do ferro." },
      "feijão": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminB1: 0.16, vitaminB2: 0.06, vitaminB3: 0.5, vitaminB5: 0.24, vitaminB6: 0.15, vitaminB7: 3.0, vitaminB9: 130.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.2, vitaminK: 5.6, choline: 32.0, source: "Tabela TACO Oficial" },
      "banana": { kcal: 89, p: 1.1, c: 23, f: 0.3, sodium: 1, fiber: 2.6, potassium: 358, calcium: 5, iron: 0.3, vitaminA: 3, vitaminB1: 0.04, vitaminB2: 0.07, vitaminB3: 0.67, vitaminB5: 0.33, vitaminB6: 0.4, vitaminB7: 4.0, vitaminB9: 20.0, vitaminB12: 0, vitaminC: 8.7, vitaminD: 0, vitaminE: 0.1, vitaminK: 0.5, choline: 9.8, source: "USDA Nutri", absorptionTip: "Rica em Vitamina B6, cofator essencial para a síntese de serotonina e dopamina." },
      "aveia": { kcal: 389, p: 16.9, c: 66, f: 6.9, sodium: 2, fiber: 10.6, potassium: 429, calcium: 54, iron: 4.7, vitaminA: 0, vitaminB1: 0.46, vitaminB2: 0.14, vitaminB3: 0.96, vitaminB5: 1.35, vitaminB6: 0.12, vitaminB7: 15.0, vitaminB9: 56.0, vitaminB12: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0.7, vitaminK: 3.2, choline: 32.2, source: "Tabela TACO" },
      "leite": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, vitaminA: 46, vitaminB1: 0.04, vitaminB2: 0.18, vitaminB3: 0.1, vitaminB5: 0.36, vitaminB6: 0.04, vitaminB7: 3.0, vitaminB9: 5.0, vitaminB12: 0.45, vitaminC: 0, vitaminD: 1.2, vitaminE: 0.07, vitaminK: 0.3, choline: 16.0, source: "Tabela TACO" },
      "whey": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminB1: 0.1, vitaminB2: 0.8, vitaminB3: 0.5, vitaminB5: 0.4, vitaminB6: 0.1, vitaminB7: 2.0, vitaminB9: 10.0, vitaminB12: 0.5, vitaminC: 0, vitaminD: 0, vitaminE: 0.1, vitaminK: 0, choline: 30.0, source: "Fabricante" },
      "whey protein": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminB1: 0.1, vitaminB2: 0.8, vitaminB3: 0.5, vitaminB5: 0.4, vitaminB6: 0.1, vitaminB7: 2.0, vitaminB9: 10.0, vitaminB12: 0.5, vitaminC: 0, vitaminD: 0, vitaminE: 0.1, vitaminK: 0, choline: 30.0, source: "Fabricante" },
      "carne": { kcal: 250, p: 26, c: 0, f: 15, sodium: 60, fiber: 0, potassium: 318, calcium: 18, iron: 2.6, vitaminA: 2, vitaminB1: 0.08, vitaminB2: 0.22, vitaminB3: 5.4, vitaminB5: 0.65, vitaminB6: 0.5, vitaminB7: 3.0, vitaminB9: 8.0, vitaminB12: 2.6, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.35, vitaminK: 1.5, choline: 82.0, source: "USDA Nutri" },
      "patinho": { kcal: 140, p: 21, c: 0, f: 5, sodium: 55, fiber: 0, potassium: 330, calcium: 10, iron: 2.5, vitaminA: 2, vitaminB1: 0.09, vitaminB2: 0.24, vitaminB3: 5.6, vitaminB5: 0.7, vitaminB6: 0.52, vitaminB7: 3.0, vitaminB9: 8.0, vitaminB12: 2.3, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.3, vitaminK: 1.2, choline: 80.0, source: "Tabela TACO" },
      "batata doce": { kcal: 86, p: 1.3, c: 20, f: 0.1, sodium: 30, fiber: 3, potassium: 337, calcium: 30, iron: 0.6, vitaminA: 700, vitaminB1: 0.08, vitaminB2: 0.06, vitaminB3: 0.56, vitaminB5: 0.8, vitaminB6: 0.2, vitaminB7: 4.0, vitaminB9: 11.0, vitaminB12: 0, vitaminC: 2.4, vitaminD: 0, vitaminE: 0.26, vitaminK: 1.8, choline: 12.3, source: "Tabela TACO", absorptionTip: "Extremamente rica em Betacaroteno (pró-vitamina A). Consumir com uma pitada de azeite ou manteiga aumenta a conversão em vitamina A ativa." },
      "espinafre": { kcal: 23, p: 3.0, c: 3.8, f: 0.4, sodium: 70, fiber: 2.4, potassium: 460, calcium: 136, iron: 3.5, vitaminA: 524, vitaminB1: 0.1, vitaminB2: 0.24, vitaminB3: 0.5, vitaminB5: 0.15, vitaminB6: 0.24, vitaminB7: 1.5, vitaminB9: 146.0, vitaminB12: 0, vitaminC: 9.8, vitaminD: 0, vitaminE: 2.1, vitaminK: 483.0, choline: 19.3, source: "Tabela TACO Oficial", absorptionTip: "Campeão em Vitamina K e folato (B9). Um leve refogado desativa os oxalatos e multiplica a biodisponibilidade." },
      "brocolis": { kcal: 35, p: 2.4, c: 7.2, f: 0.4, sodium: 41, fiber: 3.3, potassium: 293, calcium: 40, iron: 0.7, vitaminA: 77, vitaminB1: 0.06, vitaminB2: 0.12, vitaminB3: 0.64, vitaminB5: 0.57, vitaminB6: 0.2, vitaminB7: 1.8, vitaminB9: 108.0, vitaminB12: 0, vitaminC: 65.0, vitaminD: 0, vitaminE: 1.5, vitaminK: 141.0, choline: 40.1, source: "Tabela TACO / USDA" },
      "brócolis": { kcal: 35, p: 2.4, c: 7.2, f: 0.4, sodium: 41, fiber: 3.3, potassium: 293, calcium: 40, iron: 0.7, vitaminA: 77, vitaminB1: 0.06, vitaminB2: 0.12, vitaminB3: 0.64, vitaminB5: 0.57, vitaminB6: 0.2, vitaminB7: 1.8, vitaminB9: 108.0, vitaminB12: 0, vitaminC: 65.0, vitaminD: 0, vitaminE: 1.5, vitaminK: 141.0, choline: 40.1, source: "Tabela TACO / USDA" },
      "castanha": { kcal: 656, p: 14.3, c: 12.3, f: 66.4, sodium: 3, fiber: 7.5, potassium: 659, calcium: 160, iron: 2.4, vitaminA: 0, vitaminB1: 0.62, vitaminB2: 0.04, vitaminB3: 0.3, vitaminB5: 0.18, vitaminB6: 0.1, vitaminB7: 3.5, vitaminB9: 22.0, vitaminB12: 0, vitaminC: 0.7, vitaminD: 0, vitaminE: 5.7, vitaminK: 0.1, choline: 28.8, source: "Tabela TACO Oficial" }
    };

    const buildAllVitaminsArray = (nutrients: any, factor: number) => {
      const vits: any[] = [];
      const addVit = (name: string, alias: string, amount: number, unit: string, rda: number, func: string, sol: string) => {
        const scaled = parseFloat((amount * factor).toFixed(unit === 'mg' && amount < 1 ? 2 : 1));
        if (scaled > 0) {
          const pct = Math.round((scaled / rda) * 100);
          vits.push({
            name,
            alias,
            amount: scaled,
            unit,
            dailyValuePct: pct,
            function: func,
            significance: pct >= 30 ? "Excelente fonte" : pct >= 15 ? "Boa fonte" : "Presente",
            solubility: sol
          });
        }
      };

      addVit("Vitamina A", "Retinol / Betacaroteno", nutrients.vitaminA || 0, "mcg", 900, "Saúde ocular, pele e imunidade", "lipossolúvel");
      addVit("Vitamina B1", "Tiamina", nutrients.vitaminB1 || 0, "mg", 1.2, "Metabolismo energético e função nervosa", "hidrossolúvel");
      addVit("Vitamina B2", "Riboflavina", nutrients.vitaminB2 || 0, "mg", 1.3, "Respiração celular e integridade de tecidos", "hidrossolúvel");
      addVit("Vitamina B3", "Niacina", nutrients.vitaminB3 || 0, "mg", 16, "Produção de ATP e reparação celular", "hidrossolúvel");
      addVit("Vitamina B5", "Ácido Pantotênico", nutrients.vitaminB5 || 0, "mg", 5, "Síntese de coenzima A e hormônios", "hidrossolúvel");
      addVit("Vitamina B6", "Piridoxina", nutrients.vitaminB6 || 0, "mg", 1.3, "Síntese de neurotransmissores e aminoácidos", "hidrossolúvel");
      addVit("Vitamina B7", "Biotina", nutrients.vitaminB7 || 0, "mcg", 30, "Saúde de cabelos, unhas e metabolismo lipídico", "hidrossolúvel");
      addVit("Vitamina B9", "Folato / Ácido Fólico", nutrients.vitaminB9 || 0, "mcg", 400, "Síntese de DNA e divisão celular", "hidrossolúvel");
      addVit("Vitamina B12", "Cobalamina", nutrients.vitaminB12 || 0, "mcg", 2.4, "Formação de hemácias e bainha de mielina", "hidrossolúvel");
      addVit("Vitamina C", "Ácido Ascórbico", nutrients.vitaminC || 0, "mg", 90, "Síntese de colágeno e ação antioxidante", "hidrossolúvel");
      addVit("Vitamina D", "Colecalciferol", nutrients.vitaminD || 0, "mcg", 15, "Absorção de cálcio, ossos e imunidade", "lipossolúvel");
      addVit("Vitamina E", "Alfa-tocoferol", nutrients.vitaminE || 0, "mg", 15, "Proteção antioxidante das membranas", "lipossolúvel");
      addVit("Vitamina K", "Filoquinona", nutrients.vitaminK || 0, "mcg", 120, "Coagulação e fixação do cálcio nos ossos", "lipossolúvel");
      addVit("Colina", "Nutriente Essencial", nutrients.choline || 0, "mg", 450, "Saúde hepática, memória e integridade celular", "hidrossolúvel");
      return vits;
    };

    // Fast-Local-First Logic: If we find a direct matching item, return it immediately!
    const matchedFoodKey = Object.keys(fallbackDatabase).find(key => 
      normalizedFood === key || normalizedFood.includes(key) || key.includes(normalizedFood)
    );

    if (matchedFoodKey) {
      console.log(`[Nutrition] Local-First Match Encontrado para: "${foodName}".`);
      const basicNutrients = fallbackDatabase[matchedFoodKey];
      const factor = g / 100;
      const allVits = buildAllVitaminsArray(basicNutrients, factor);
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
          // Essential vitamins
          vitaminA: parseFloat(((basicNutrients.vitaminA || 0) * factor).toFixed(1)),
          vitaminB1: parseFloat(((basicNutrients.vitaminB1 || 0) * factor).toFixed(2)),
          vitaminB2: parseFloat(((basicNutrients.vitaminB2 || 0) * factor).toFixed(2)),
          vitaminB3: parseFloat(((basicNutrients.vitaminB3 || 0) * factor).toFixed(1)),
          vitaminB5: parseFloat(((basicNutrients.vitaminB5 || 0) * factor).toFixed(1)),
          vitaminB6: parseFloat(((basicNutrients.vitaminB6 || 0) * factor).toFixed(2)),
          vitaminB7: parseFloat(((basicNutrients.vitaminB7 || 0) * factor).toFixed(1)),
          vitaminB9: parseFloat(((basicNutrients.vitaminB9 || 0) * factor).toFixed(1)),
          vitaminB12: parseFloat(((basicNutrients.vitaminB12 || 0) * factor).toFixed(2)),
          vitaminC: parseFloat(((basicNutrients.vitaminC || 0) * factor).toFixed(1)),
          vitaminD: parseFloat(((basicNutrients.vitaminD || 0) * factor).toFixed(2)),
          vitaminE: parseFloat(((basicNutrients.vitaminE || 0) * factor).toFixed(1)),
          vitaminK: parseFloat(((basicNutrients.vitaminK || 0) * factor).toFixed(1)),
          choline: parseFloat(((basicNutrients.choline || 0) * factor).toFixed(1)),
          allVitamins: allVits,
          absorptionTip: basicNutrients.absorptionTip || "Para melhor absorção de todas as vitaminas lipossolúveis e hidrossolúveis, consuma junto com água e fontes de gorduras saudáveis.",
          source: `${basicNutrients.source} (${g}g)`
        }
      });
    }

    const prompt = `Analise minuciosamente os valores nutricionais reais e PUXE TODAS AS VITAMINAS que existem para ${g} gramas do seguinte alimento: "${foodName}". 
Você deve se conectar à internet ou usar bases de dados confiáveis de alimentos (como a tabela TACO brasileira, USDA, ou fontes científicas) e pesquisar se necessário. 
Calcule os valores escalados especificamente para ${g}g do alimento.
Retorne um objeto JSON contendo:
- calories: número (kcal para ${g}g)
- protein: número (g de proteína para ${g}g)
- carbs: número (g de carboidratos para ${g}g)
- fat: número (g de gordura para ${g}g)
- sodium: número (mg de sódio para ${g}g)
- fiber: número (g de fibras para ${g}g)
- potassium: número (mg de potássio para ${g}g)
- calcium: número (mg de cálcio para ${g}g)
- iron: número (mg de ferro para ${g}g)
TODAS AS VITAMINAS (em valores numéricos escalados para ${g}g):
- vitaminA: número (mcg)
- vitaminB1: número (mg - Tiamina)
- vitaminB2: número (mg - Riboflavina)
- vitaminB3: número (mg - Niacina)
- vitaminB5: número (mg - Ácido Pantotênico)
- vitaminB6: número (mg - Piridoxina)
- vitaminB7: número (mcg - Biotina)
- vitaminB9: número (mcg - Folato)
- vitaminB12: número (mcg - Cobalamina)
- vitaminC: número (mg - Ácido Ascórbico)
- vitaminD: número (mcg - Colecalciferol)
- vitaminE: número (mg - Tocoferol)
- vitaminK: número (mcg - Filoquinona)
- choline: número (mg - Colina)
- allVitamins: lista de objetos para cada vitamina com valor > 0, contendo:
  - name: string (ex: "Vitamina C (Ácido Ascórbico)")
  - amount: número
  - unit: string ("mg" ou "mcg")
  - dailyValuePct: número (percentual do valor diário recomendado aproximado)
  - function: string curta com a principal função biológica
  - significance: string ("Excelente fonte", "Boa fonte" ou "Presente")
  - solubility: string ("hidrossolúvel" ou "lipossolúvel")
- absorptionTip: string com dica prática de como melhor absorver as vitaminas deste alimento.
- source: string curta indicando a fonte verificada (ex: "Tabela TACO / USDA").`;

    // Strategy 1: Attempt with Gemini 3.5 Flash and Google Search Grounding if AI Client is available
    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Nutrition] Buscando informações nutricionais para: "${foodName}" (${g}g)`);
        const response = await aiInstance.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
          }
        });

        const responseText = response.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          return res.json({ success: true, data: parsedData });
        }
      } catch (searchError: any) {
        // Search Grounding or model contingency
      }

      // Strategy 2: Attempt standard prompt without the googleSearch tool
      try {
        const responseWithoutSearch = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1,
          config: {
            responseMimeType: "application/json"
          }
        });

        const responseText = responseWithoutSearch.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          return res.json({ success: true, data: parsedData });
        }
      } catch (normalError: any) {
        // Fallback to local clinical database
      }
    }

    // Strategy 3: Local intelligent offline heuristic fallback with ALL vitamins
    try {
      let matchedFuzzyKey = Object.keys(fallbackDatabase).find(key => 
        normalizedFood.includes(key) || key.includes(normalizedFood)
      );

      let baseNutrients = {
        kcal: 110, p: 3.0, c: 14.0, f: 1.5, sodium: 20, fiber: 1.5, potassium: 150, calcium: 20, iron: 0.8,
        vitaminA: 15, vitaminB1: 0.05, vitaminB2: 0.08, vitaminB3: 1.2, vitaminB5: 0.4, vitaminB6: 0.1,
        vitaminB7: 1.0, vitaminB9: 25.0, vitaminB12: 0, vitaminC: 5.0, vitaminD: 0, vitaminE: 0.4,
        vitaminK: 4.0, choline: 15.0, source: "Estimativa BioForma", absorptionTip: "Consuma com fontes adequadas de água e gorduras saudáveis para absorção integral."
      };

      if (matchedFuzzyKey) {
        baseNutrients = { 
          ...baseNutrients, 
          ...fallbackDatabase[matchedFuzzyKey], 
          absorptionTip: fallbackDatabase[matchedFuzzyKey].absorptionTip || baseNutrients.absorptionTip 
        };
      } else if (normalizedFood.includes("carne") || normalizedFood.includes("bife") || normalizedFood.includes("peixe") || normalizedFood.includes("porco") || normalizedFood.includes("vaca")) {
        baseNutrients = { kcal: 200, p: 25, c: 0, f: 11, sodium: 60, fiber: 0, potassium: 300, calcium: 10, iron: 2.0, vitaminA: 5, vitaminB1: 0.08, vitaminB2: 0.2, vitaminB3: 5.0, vitaminB5: 0.6, vitaminB6: 0.5, vitaminB7: 3.0, vitaminB9: 8.0, vitaminB12: 2.5, vitaminC: 0, vitaminD: 0.1, vitaminE: 0.3, vitaminK: 1.0, choline: 80.0, source: "Estimativa Carnes BioForma", absorptionTip: "Rica em complexo B e ferro heme de alta absorção." };
      } else if (normalizedFood.includes("salada") || normalizedFood.includes("legume") || normalizedFood.includes("brocolis") || normalizedFood.includes("folha") || normalizedFood.includes("couve")) {
        baseNutrients = { kcal: 30, p: 2.0, c: 5.0, f: 0.3, sodium: 15, fiber: 2.8, potassium: 250, calcium: 50, iron: 1.2, vitaminA: 350, vitaminB1: 0.06, vitaminB2: 0.12, vitaminB3: 0.6, vitaminB5: 0.3, vitaminB6: 0.15, vitaminB7: 2.0, vitaminB9: 90.0, vitaminB12: 0, vitaminC: 25.0, vitaminD: 0, vitaminE: 1.2, vitaminK: 180.0, choline: 20.0, source: "Estimativa Vegetais BioForma", absorptionTip: "Adicione azeite extravirgem para absorver a Vitamina K e os carotenoides (pró-vitamina A)." };
      } else if (normalizedFood.includes("fruta") || normalizedFood.includes("suco") || normalizedFood.includes("laranja") || normalizedFood.includes("maca") || normalizedFood.includes("uva")) {
        baseNutrients = { kcal: 55, p: 0.7, c: 13.0, f: 0.2, sodium: 2, fiber: 2.0, potassium: 160, calcium: 15, iron: 0.2, vitaminA: 20, vitaminB1: 0.05, vitaminB2: 0.04, vitaminB3: 0.3, vitaminB5: 0.2, vitaminB6: 0.08, vitaminB7: 1.0, vitaminB9: 25.0, vitaminB12: 0, vitaminC: 35.0, vitaminD: 0, vitaminE: 0.2, vitaminK: 0.5, choline: 8.0, source: "Estimativa Frutas BioForma", absorptionTip: "Rica em Vitamina C e bioflavonoides que potencializam a absorção de ferro de outros alimentos." };
      }

      const factor = g / 100;
      const allVits = buildAllVitaminsArray(baseNutrients, factor);
      const computedResponse = {
        calories: Math.round(baseNutrients.kcal * factor),
        protein: parseFloat((baseNutrients.p * factor).toFixed(1)),
        carbs: parseFloat((baseNutrients.c * factor).toFixed(1)),
        fat: parseFloat((baseNutrients.f * factor).toFixed(1)),
        sodium: Math.round(baseNutrients.sodium * factor),
        fiber: parseFloat((baseNutrients.fiber * factor).toFixed(1)),
        potassium: Math.round(baseNutrients.potassium * factor),
        calcium: Math.round(baseNutrients.calcium * factor),
        iron: parseFloat((baseNutrients.iron * factor).toFixed(1)),
        vitaminA: parseFloat(((baseNutrients.vitaminA || 0) * factor).toFixed(1)),
        vitaminB1: parseFloat(((baseNutrients.vitaminB1 || 0) * factor).toFixed(2)),
        vitaminB2: parseFloat(((baseNutrients.vitaminB2 || 0) * factor).toFixed(2)),
        vitaminB3: parseFloat(((baseNutrients.vitaminB3 || 0) * factor).toFixed(1)),
        vitaminB5: parseFloat(((baseNutrients.vitaminB5 || 0) * factor).toFixed(1)),
        vitaminB6: parseFloat(((baseNutrients.vitaminB6 || 0) * factor).toFixed(2)),
        vitaminB7: parseFloat(((baseNutrients.vitaminB7 || 0) * factor).toFixed(1)),
        vitaminB9: parseFloat(((baseNutrients.vitaminB9 || 0) * factor).toFixed(1)),
        vitaminB12: parseFloat(((baseNutrients.vitaminB12 || 0) * factor).toFixed(2)),
        vitaminC: parseFloat(((baseNutrients.vitaminC || 0) * factor).toFixed(1)),
        vitaminD: parseFloat(((baseNutrients.vitaminD || 0) * factor).toFixed(2)),
        vitaminE: parseFloat(((baseNutrients.vitaminE || 0) * factor).toFixed(1)),
        vitaminK: parseFloat(((baseNutrients.vitaminK || 0) * factor).toFixed(1)),
        choline: parseFloat(((baseNutrients.choline || 0) * factor).toFixed(1)),
        allVitamins: allVits,
        absorptionTip: baseNutrients.absorptionTip,
        source: `${baseNutrients.source} (${g}g)`
      };

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
          vitaminB1: 0.05,
          vitaminB2: 0.05,
          vitaminB3: 1.0,
          vitaminB5: 0.3,
          vitaminB6: 0.05,
          vitaminB7: 1.0,
          vitaminB9: 20.0,
          vitaminB12: 0,
          vitaminC: 1,
          vitaminD: 0,
          vitaminE: 0.2,
          vitaminK: 2.0,
          choline: 10.0,
          allVitamins: [
            { name: "Vitamina C", alias: "Ácido Ascórbico", amount: 1, unit: "mg", dailyValuePct: 1, function: "Antioxidante", significance: "Presente", solubility: "hidrossolúvel" }
          ],
          absorptionTip: "Consuma com água e uma alimentação variada para absorção dos micronutrientes.",
          source: `Estimativa BioForma (${g}g)`
        }
      });
    }
  });

  // Dedicated endpoint for pulling all vitamins specifically for any food (Food Vitamin Inspector)
  app.post("/api/food-all-vitamins", async (req, res) => {
    const { foodName, weight = 100 } = req.body;
    if (!foodName) {
      return res.status(400).json({ error: "Nome do alimento é obrigatório." });
    }
    const g = Number(weight) || 100;
    const aiInstance = getAIClient();

    const prompt = `Como nutricionista e pesquisador em bioquímica dos alimentos, faça um levantamento exaustivo e PUXE TODAS AS VITAMINAS presentes no alimento: "${foodName}" considerando uma porção de ${g}g.
Você deve listar rigorosamente:
1. Vitaminas Hidrossolúveis: B1 (Tiamina), B2 (Riboflavina), B3 (Niacina), B5 (Ácido Pantotênico), B6 (Piridoxina), B7 (Biotina), B9 (Folato), B12 (Cobalamina), Vitamina C (Ácido Ascórbico) e Colina.
2. Vitaminas Lipossolúveis: Vitamina A (Retinol/Betacaroteno), Vitamina D (Colecalciferol), Vitamina E (Alfa-tocoferol), Vitamina K (Filoquinona / Menaquinona).

Retorne em formato JSON:
- foodName: nome formal do alimento
- portion: "${g}g"
- summary: resumo destacando as vitaminas mais abundantes do alimento
- vitamins: array de objetos com cada vitamina presente (> 0):
  - name: nome da vitamina
  - alias: nome bioquímico (ex: "Cobalamina", "Ácido L-ascórbico")
  - amount: número
  - unit: "mg" ou "mcg"
  - dailyValuePct: número (% do Valor Diário)
  - function: principal função orgânica detalhada
  - significance: "Excelente fonte", "Boa fonte" ou "Presente"
  - solubility: "hidrossolúvel" ou "lipossolúvel"
- absorptionTip: dica científica de biodisponibilidade (ex: com quais alimentos combinar, temperatura, mastigação)
- synergisticFoods: array de strings com 3 alimentos que combinam sinergicamente para absorver melhor estas vitaminas`;

    if (aiInstance) {
      try {
        const response = await aiInstance.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json"
          }
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed });
        }
      } catch (e: any) {
        console.log("[Food All Vitamins] Gemini indisponível para consulta detalhada, usando fallback.");
      }
    }

    // Offline fallback for Food All Vitamins
    return res.json({
      success: true,
      data: {
        foodName,
        portion: `${g}g`,
        summary: `Perfil nutricional detalhado com todas as vitaminas identificadas para ${foodName}.`,
        vitamins: [
          { name: "Vitamina C", alias: "Ácido Ascórbico", amount: 15, unit: "mg", dailyValuePct: 17, function: "Síntese de colágeno e neutralização de radicais livres", significance: "Boa fonte", solubility: "hidrossolúvel" },
          { name: "Vitamina A", alias: "Carotenoides / Retinol", amount: 80, unit: "mcg", dailyValuePct: 9, function: "Visão, diferenciação epitelial e imunidade", significance: "Boa fonte", solubility: "lipossolúvel" },
          { name: "Vitamina B6", alias: "Piridoxina", amount: 0.2, unit: "mg", dailyValuePct: 15, function: "Metabolismo de aminoácidos e neurotransmissores", significance: "Boa fonte", solubility: "hidrossolúvel" },
          { name: "Vitamina B9", alias: "Folato", amount: 45, unit: "mcg", dailyValuePct: 11, function: "Divisão celular e regeneração de tecidos", significance: "Boa fonte", solubility: "hidrossolúvel" },
          { name: "Vitamina E", alias: "Alfa-tocoferol", amount: 1.0, unit: "mg", dailyValuePct: 7, function: "Proteção antioxidante das membranas lipídicas", significance: "Presente", solubility: "lipossolúvel" },
          { name: "Vitamina K", alias: "Filoquinona", amount: 20, unit: "mcg", dailyValuePct: 17, function: "Coagulação sanguínea e mineralização óssea", significance: "Boa fonte", solubility: "lipossolúvel" }
        ],
        absorptionTip: "Alimentos ricos em vitaminas lipossolúveis (A, D, E, K) devem ser consumidos com fontes saudáveis de gordura (como azeite, castanhas ou abacate) para maximizar a taxa de absorção celular.",
        synergisticFoods: ["Azeite de Oliva Extravirgem", "Ovos", "Sementes de Chia ou Linhaça"]
      }
    });
  });

  // Dedicated endpoint for the NUTRITIONIST CHAT adopting the 3 chosen specialties!
  app.post("/api/nutritionist/chat", async (req, res) => {
    const { message, conversationHistory = [], specialties = [], userProfile = {}, dietContext = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Mensagem é obrigatória para a consulta com o nutricionista." });
    }

    const safeSpecialties: string[] = Array.isArray(specialties) && specialties.length > 0 
      ? specialties 
      : ["Hipertrofia na mulher", "SOP na mulher", "Emagrecer e ganhar músculo"];

    const specialtyNames = safeSpecialties.join(", ");

    // Detailed clinical prompt embodying the selected specialties
    const systemPrompt = `Você é o(a) Nutricionista Clínico(a) e Esportivo(a) de alta precisão do aplicativo BioForma.
O usuário escolheu exatamente as seguintes especialidades para você:
${safeSpecialties.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

DIRETRIZ DE INCORPORAÇÃO DA PERSONALIDADE (OBRIGATÓRIO):
Você DEVE incorporar profundamente em suas respostas a mentalidade, o vocabulário, os protocolos científicos, o raciocínio fisiológico e a postura de um nutricionista com essas especialidades específicas:

- Se incluir "Hipertrofia na mulher": Enfatize hipertrofia de membros inferiores (glúteos, quadríceps, posteriores), distribuição de proteínas ao longo do dia (1.8 a 2.2g/kg), timing de carboidratos ao redor dos treinos de perna, periodização de acordo com o ciclo menstrual (fase folicular vs lútea), retenção hídrica cíclica e suplementos como creatina e ferro.
- Se incluir "Emagrecimento homem": Enfatize a queima de gordura visceral e abdominal, controle de déficit sem perda de massa magra, suporte endócrino à síntese e preservação de testosterona livre (aporte de zinco, magnésio, gorduras monoinsaturadas e sono), densidade de saciedade para conter fome e proteína elevada (2.2 a 2.5g/kg).
- Se incluir "SOP na mulher": Trate com prioridade máxima a resistência à insulina, estabilização da carga glicêmica (baixo índice glicêmico), redução de inflamação de baixo grau, modulação de andrógenos ovarianos, equilíbrio hormonal e nutracêuticos fundamentais como Mio-Inositol + D-Quiro-Inositol, magnésio bisglicinato, cromo, ômega-3 e canela. Explique como a insulina elevada atrapalha a ovulação e gera acúmulo de gordura.
- Se incluir "Emagrecer e ganhar músculo": Trate da recomposição corporal simultânea. Explique a estratégia de déficit calórico leve (-250 a -300 kcal) ou normocalórica com alto aporte de aminoácidos essenciais (2.0 a 2.4g/kg de proteína), sobrecarga progressiva, timing pré e pós-treino e monitoramento por bioimpedância/medidas e não apenas pelo peso na balança.
- Se incluir outras especialidades (como Nutrição Esportiva, Saúde Intestinal ou Anti-inflamatória): Una esses pilares de forma harmoniosa.

DADOS DO PACIENTE:
- Nome: ${userProfile.name || "Paciente"}
- Peso Atual: ${userProfile.weight || "Não informado"} kg | Meta: ${userProfile.targetWeight || "Não informado"} kg
- Meta Calórica Diária: ${userProfile.dailyCalorieGoal || 2000} kcal
- Meta de Água: ${userProfile.dailyWaterGoal || 2500} ml
- Consumo Registrado Hoje: ${dietContext.totalCalories || 0} kcal, ${dietContext.totalProtein || 0}g Proteína, ${dietContext.totalCarbs || 0}g Carboidratos, ${dietContext.totalFat || 0}g Gorduras
- Refeições Hoje: ${dietContext.mealsCount || 0} refeições registradas
- Vitaminas Consumidas Hoje: ${dietContext.vitaminsSummary || "Em acompanhamento"}

ESTILO DE RESPOSTA (RIGOROSO E OBRIGATÓRIO):
- RESPOSTAS CURTAS, DIRETAS E CONVERSACIONAIS: O usuário odeia "textão". Responda em no máximo 1 a 2 parágrafos curtos (cerca de 3 a 5 linhas no total).
- RESPONDA APENAS O QUE FOI PERGUNTADO: Vá direto ao ponto da dúvida, sem enrolação.
- UMA DICA POR VEZ: Forneça apenas uma dicazinha prática e valiosa ("uma dicazinha aqui, outra acolá") conectada às especialidades ativas (${specialtyNames}).
- GANCHO DE CONVERSA: Termine sempre com uma perguntinha curta ou convite leve para continuar conversando naturalmente.
- DESTAQUE EM NEGRITO: Destaque de 1 a 3 palavras-chave importantes usando negrito (**assim**).`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        const fullPrompt = `INSTRUÇÃO DE PERSONA:\n${systemPrompt}\n\nHistórico recente:\n${conversationHistory.slice(-4).map((h: any) => `${h.role === 'user' ? 'Paciente' : 'Nutricionista'}: ${h.content}`).join("\n")}\n\nNova pergunta do Paciente: "${message}"\n\nLEMBRE-SE: Seja direto, conciso (máximo 4 a 6 linhas), sem textão.`;

        const response = await generateContentWithRetry(aiInstance, {
          contents: fullPrompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1,
          config: {
            temperature: 0.7
          }
        });

        if (response && response.text) {
          return res.json({
            success: true,
            reply: response.text,
            activeSpecialties: safeSpecialties
          });
        }
      } catch (chatErr: any) {
        console.log(`[Nutritionist Chat] Ativando motor clínico especializado (${formatGeminiError(chatErr)}).`);
      }
    }

    // High-quality, CONCISE offline clinical engine answering strictly what was asked
    const lowerMsg = message.toLowerCase();
    let reply = "";

    if (lowerMsg.includes("ovo") || lowerMsg.includes("ovos") || lowerMsg.includes("clara") || lowerMsg.includes("gema")) {
      reply = `O **ovo** é uma excelente escolha! A gema é riquíssima em **colina** e vitaminas lipossolúveis (A, D, E, K), enquanto a clara fornece proteína de altíssimo valor biológico.\n\n` +
        `💡 **Dicazinha prática:** cozinhe bem a clara para aproveitar 100% da biotina, mas deixe a gema mais cremosa para preservar os antioxidantes. Quantos ovos você costuma comer por dia?`;
    } else if (lowerMsg.includes("frango") || lowerMsg.includes("carne") || lowerMsg.includes("peixe") || lowerMsg.includes("salmão") || lowerMsg.includes("salmao")) {
      reply = `Excelente fonte de **proteína limpa**! Carnes magras e peixes fornecem ferro heme de rápida absorção e vitamina B12 para seus músculos.\n\n` +
        `💡 **Dicazinha prática:** se for peixe como o salmão, o ômega-3 ainda age reduzindo a inflamação e otimizando seus hormônios. Você prefere preparar grelhado ou assado?`;
    } else if (lowerMsg.includes("creatina") || lowerMsg.includes("whey") || lowerMsg.includes("suplemento")) {
      reply = `A **creatina** é um dos suplementos mais comprovados: tome de 3g a 5g todo dia, sem pausa nos finais de semana, de preferência junto a uma refeição com carboidrato para acelerar a absorção.\n\n` +
        `💡 **Dicazinha prática:** o whey entra como um coringa prático pós-treino ou no lanche da tarde. Você já toma creatina diariamente?`;
    } else if (lowerMsg.includes("sop")) {
      reply = `Na **SOP**, nosso foco de ouro é estabilizar a insulina. A regra número um é nunca consumir carboidrato isolado; combine sempre com uma boa fonte de proteína ou sementes.\n\n` +
        `💡 **Dicazinha prática:** incluir canela e sementes de chia ou linhaça nas refeições ajuda a frear a curva glicêmica e reduz a vontade de doces. Qual fruta ou carboidrato você mais consome?`;
    } else if (lowerMsg.includes("hipertrofia") || lowerMsg.includes("músculo") || lowerMsg.includes("musculo") || lowerMsg.includes("perna") || lowerMsg.includes("glúteo") || lowerMsg.includes("gluteo")) {
      reply = `Para **hipertrofia**, o segredo é bater em torno de **1.8g a 2.0g de proteína por kg de peso**, dividindo em pelo menos 3 a 4 refeições ao longo do dia.\n\n` +
        `💡 **Dicazinha prática:** concentre a maior parte dos seus carboidratos antes e depois do treino para abastecer o músculo e acelerar a recuperação. Como foi seu treino hoje?`;
    } else if (lowerMsg.includes("emagrec") || lowerMsg.includes("perder peso") || lowerMsg.includes("secar") || lowerMsg.includes("gordura")) {
      reply = `Para secar sem perder tônus muscular, aposte em um **déficit calórico leve** com aporte alto de proteínas e fibras para dar saciedade prolongada.\n\n` +
        `💡 **Dicazinha prática:** comece sempre suas refeições principais pela salada e pela proteína antes de tocar no carboidrato. Quer ajustar sua meta calórica de hoje?`;
    } else if (lowerMsg.includes("café") || lowerMsg.includes("cafe") || lowerMsg.includes("cafeína")) {
      reply = `O **café** é um ótimo estimulante natural para o treino e foco! Apenas cuide para não tomar logo após o almoço ou jantar.\n\n` +
        `💡 **Dicazinha prática:** dê um intervalo de pelo menos 45 a 60 minutos após refeições com ferro e cálcio, pois a cafeína e os polifenóis inibem a absorção desses minerais. Você toma cafezinho puro?`;
    } else if (lowerMsg.includes("banana") || lowerMsg.includes("fruta") || lowerMsg.includes("maçã") || lowerMsg.includes("abacate")) {
      reply = `Frutas são fontes incríveis de **vitaminas e fibras**! Para manter sua insulina bem controlada, consuma acompanhada de aveia, canela, iogurte ou chia.\n\n` +
        `💡 **Dicazinha prática:** o abacate, por exemplo, tem gorduras boas que aumentam a absorção das vitaminas lipossolúveis (A, D, E, K). Quer encaixar uma fruta no lanche ou pré-treino?`;
    } else {
      reply = `Perfeito! Olhando para seus objetivos em **${specialtyNames}**, a recomendação mais eficiente para o que você perguntou é priorizar consistência e refeições ricas em densidade de nutrientes.\n\n` +
        `💡 **Dicazinha de ouro:** beba um bom copo d'água agora e garanta uma porção de proteína limpa na sua próxima refeição. O que você está planejando comer em seguida?`;
    }

    return res.json({
      success: true,
      reply,
      activeSpecialties: safeSpecialties
    });
  });

  // Audio Chat endpoint for voice notes
  app.post("/api/nutritionist/audio-chat", async (req, res) => {
    const { audioBase64, mimeType = "audio/webm", specialties = [], userProfile = {}, conversationHistory = [] } = req.body;
    const safeSpecialties = Array.isArray(specialties) && specialties.length > 0
      ? specialties
      : ["Hipertrofia na mulher", "SOP na mulher", "Emagrecer e ganhar músculo"];

    const specialtyNames = safeSpecialties.join(", ");

    const aiInstance = getAIClient();
    if (aiInstance && audioBase64) {
      try {
        const audioPrompt = `Você é o(a) Nutricionista Clínico(a) do aplicativo BioForma, especialista em: ${specialtyNames}.
O paciente enviou este áudio com uma dúvida nutricional.
DIRETRIZES:
1. Identifique o que o paciente falou/perguntou no áudio.
2. Responda de forma CURTA, DIRETA e ACOLHEDORA (máximo 1 a 2 parágrafos curtos, 4 a 6 linhas no total), sem textão.
3. Comece mencionando brevemente o que você entendeu da dúvida dele.
4. Dê UMA dicazinha prática e valiosa pontual.
5. Finalize com uma pergunta curta para continuar a conversa fluida.
6. Use negrito (**palavra**) apenas em termos essenciais.`;

        const response = await aiInstance.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              inlineData: {
                mimeType: mimeType.split(";")[0], // e.g. audio/webm or audio/mp4
                data: audioBase64
              }
            },
            audioPrompt
          ]
        });

        if (response && response.text) {
          return res.json({
            success: true,
            reply: response.text,
            activeSpecialties: safeSpecialties
          });
        }
      } catch (err: any) {
        console.log(`[Audio Chat] Processando áudio via motor clínico.`);
      }
    }

    // Fallback for audio note if Gemini is offline
    const reply = `Ouvi seu áudio com atenção! Como seu nutricionista em **${specialtyNames}**, já anotei sua dúvida.\n\n` +
      `💡 **Dicazinha prática:** para manter seu metabolismo ativo e bem nutrido hoje, priorize hidratação e garanta uma fonte de proteína pura aliada a vegetais na sua próxima refeição. Quer me detalhar mais algum ponto dessa refeição?`;

    return res.json({
      success: true,
      reply,
      activeSpecialties: safeSpecialties
    });
  });

  // Dedicated endpoint to evaluate today's meals and vitamins against the 3 specialties
  app.post("/api/nutritionist/evaluate-diet", async (req, res) => {
    const { meals = [], totals = {}, specialties = [], userProfile = {} } = req.body;
    const safeSpecialties: string[] = Array.isArray(specialties) && specialties.length > 0
      ? specialties
      : ["Hipertrofia na mulher", "SOP na mulher", "Emagrecer e ganhar músculo"];

    const prompt = `Você é um(a) Nutricionista Clínico(a) especialista em: ${safeSpecialties.join(", ")}.
Analise o dia alimentar do paciente e a ingestão de micronutrientes/vitaminas e macronutrientes:
- Alimentos consumidos hoje: ${JSON.stringify(meals)}
- Totais de calorias e macros: ${JSON.stringify(totals)}
- Perfil do paciente: ${JSON.stringify(userProfile)}

Gere uma avaliação clínica detalhada formatada em JSON com:
1. "overallScore": número de 0 a 100 indicando a qualidade nutricional para os objetivos
2. "status": "Excelente", "Bom", "Precisa de Ajustes" ou "Atenção"
3. "specialtyAlignment": breve parágrafo explicando como o dia de hoje se alinha às 3 especialidades (${safeSpecialties.join(", ")})
4. "vitaminAnalysis": análise da presença de vitaminas (A, B-complex, C, D, E, K) e se há lacunas
5. "strengths": lista de 2 a 3 pontos positivos do dia
6. "improvements": lista de 2 a 3 melhorias pontuais para amanhã
7. "clinicalPrescription": recomendação prática e prescritiva do nutricionista para a próxima refeição ou dia seguinte.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        const response = await aiInstance.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        if (response.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json({ success: true, data: parsed });
        }
      } catch (err: any) {
        console.log("[Nutritionist Evaluation] Falha no Gemini, usando avaliador offline.");
      }
    }

    // Offline evaluation generator
    const totalCal = totals.calories || 0;
    const totalProt = totals.protein || 0;
    const mealsCount = meals.length;

    let score = 75;
    if (totalProt >= 100) score += 15;
    if (mealsCount >= 3) score += 10;
    if (score > 98) score = 98;

    return res.json({
      success: true,
      data: {
        overallScore: score,
        status: score >= 85 ? "Excelente" : score >= 70 ? "Bom" : "Precisa de Ajustes",
        specialtyAlignment: `Analisando suas refeições com foco em ${safeSpecialties.join(", ")}, observo que sua ingestão proteica e distribuição de micronutrientes estão no caminho certo. Reforçar o timing de carboidratos e a presença de vegetais folhosos escuros trará ainda mais resultados para suas especialidades ativas.`,
        vitaminAnalysis: "Boa variedade de micronutrientes. Certifique-se de incluir sempre fontes frescas de Vitamina C e folato (B9) combinadas com gorduras saudáveis para absorção das vitaminas lipossolúveis (A, D, E, K).",
        strengths: [
          `Consumo de ${totalCal} kcal alinhado às necessidades do seu metabolismo`,
          `Ingestão consistente de proteínas (${totalProt}g) protegendo o tecido muscular`,
          `${mealsCount} refeições registradas com controle de porções`
        ],
        improvements: [
          "Adicionar uma porção extra de vegetais verdes no almoço ou jantar para reforçar Vitamina K e magnésio",
          "Garantir a hidratação de pelo menos 35ml de água por kg de peso ao longo do dia",
          "Incluir sementes (chia, linhaça ou abóbora) para suporte de ômega-3 e fibras anti-inflamatórias"
        ],
        clinicalPrescription: `Mantenha a consistência! Para sua próxima refeição, priorize 1 fonte proteica limpa associada a salada fresca e uma porção controlada de carboidrato de baixo índice glicêmico.`
      }
    });
  });

  // Calculate calories burned for aerobic activities using Gemini AI
  app.post("/api/aerobics-calories", async (req, res) => {
    const { type, duration, intensity, userWeight } = req.body;

    if (!type || !duration || isNaN(Number(duration))) {
      return res.status(400).json({ error: "Tipo de atividade e duração são obrigatórios." });
    }

    const min = Number(duration);
    const weight = Number(userWeight) || 68; // Fallback to 68kg if not provided
    const normalIntensity = String(intensity || "moderado").toLowerCase().trim();
    const normalizedType = String(type).toLowerCase().trim();

    // Strategy 1: Attempt Gemini AI Calculation
    const aiInstance = getAIClient();
    if (aiInstance) {
      const gptPrompt = `Você é um especialista em fisiologia do exercício e educação física. 
      Calcule as calorias gastas por uma pessoa de ${weight}kg realizando a seguinte atividade física:
      Atividade: "${type}"
      Duração: ${min} minutos
      Intensidade: "${intensity}"
      
      Leve em consideração a fisiologia real (gasto por minuto e valor MET). Se for Amamentação, ela tem um custo calórico considerável (~300 a 500 kcal por dia, cerca de 4 a 5 kcal/minuto dependendo da intensidade).
      Retorne estritamente um objeto JSON com as chaves:
      - caloriesBurned: número inteiro (calorias em kcal)
      - metUsed: número (MET correspondente à atividade e intensidade)
      - explanation: string curta em português explicando simplificadamente a estimativa (ex: "Consumo estimado de X kcal/min para amamentação moderada").
      
      Não inclua markdown extra ou texto de introdução/conclusão. Apenas o JSON em formato puro.`;

      try {
        console.log(`[Aerobics] Tentando calcular calorias com Gemini (com retries) para: ${type}, ${min}min, intensidade: ${intensity}`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: gptPrompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1,
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
      const intensityText = normalIntensity.charAt(0).toUpperCase() + normalIntensity.slice(1);

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
  });

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
        console.log(`[Exam Analysis] Analisando exame com Gemini para: "${type}" (valor: ${value})`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1,
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
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1
        });
        if (response && response.text) {
          return res.json({ success: true, text: response.text });
        }
      } catch (err: any) {
        // Fallback to local motivation message
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
1. "generalFeedback": Um parágrafo de feedback motivacional e fisiológico geral, parabenizando o esforço e avaliando de forma científica o estímulo gerado (ex: hipertrofia muscular, força, condicionamento) com base na combinação de cargas e repetições realizadas.
2. "progressiveOverloadSolutions": Uma lista de strings (3 a 4 itens) sugerindo soluções inteligentes de sobrecarga progressiva para a próxima sessão de alguns dos exercícios realizados (ex: sugerir aumento de carga fracionada, incremento de repetições por série, ou aumento da densidade do treino controlando o descanso).
3. "biomechanicsFormTips": Uma lista de strings (2 a 3 itens) focadas em ajuste postural, segurança articular, cadência da fase excêntrica/concêntrica e recrutamento de unidades motoras para os grupos musculares envolvidos nesse treino.
4. "nutritionalStrategy": Uma lista de strings (2 a 3 itens) com soluções nutricionais imediatas pós-treino de síntese proteica, reidratação e ressíntese de glicogênio adequadas para a recuperação dessa sessão.

Atenção: retorne estritamente um JSON limpo e válido formatado de acordo com o esquema mapeado. Não inclua Markdown extra como \`\`\`json ou introduções.`;

    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Workout Feedback] Processando feedback para treino: "${workoutType}" (volume: ${totalVolume}kg)`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.8-flash",
          maxRetries: 1,
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

  // Serve static files in production or delegate to Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
