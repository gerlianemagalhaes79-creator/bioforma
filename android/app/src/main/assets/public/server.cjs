var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_vite = require("vite");
var aiClient = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("[Nutrition] GEMINI_API_KEY is not defined. Will fall back directly to offline diet dictionary.");
      return null;
    }
    aiClient = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function formatGeminiError(err) {
  if (!err) return "Erro desconhecido";
  const msg = err.message || String(err);
  try {
    if (typeof msg === "string" && msg.trim().startsWith("{")) {
      const parsed = JSON.parse(msg);
      if (parsed.error) {
        const code = parsed.error.code || "";
        const status = parsed.error.status || "";
        const message = parsed.error.message || "";
        return `[API ${code} - ${status}] ${message}`;
      }
    }
  } catch (_) {
  }
  if (msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("high demand")) {
    return "Servico temporariamente indisponivel (503 - Alta demanda)";
  }
  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
    return "Limite de requisicoes atingido (429 - Quota)";
  }
  return msg.replace(/[\{\}]/g, "").substring(0, 150);
}
async function generateContentWithRetry(aiInstance, options) {
  const { contents, config = {}, defaultModel = "gemini-3.5-flash", maxRetries = 2 } = options;
  const modelsToTry = Array.from(/* @__PURE__ */ new Set([defaultModel, "gemini-3.1-flash-lite", "gemini-flash-latest"]));
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini SDK] Chamando modelo "${model}" (tentativa ${attempt}/${maxRetries})`);
        const response = await aiInstance.models.generateContent({
          model,
          contents,
          config
        });
        if (response && response.text) {
          return response;
        }
      } catch (err) {
        const cleanMessage = formatGeminiError(err);
        console.log(`[Gemini SDK] Falha na tentativa ${attempt} com o modelo "${model}": ${cleanMessage}`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    }
  }
  throw new Error("Todos os modelos e tentativas do Gemini falharam.");
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app.use(import_express.default.json());
  app.post("/api/nutrition", async (req, res) => {
    const { foodName, weight } = req.body;
    if (!foodName || !weight || isNaN(Number(weight))) {
      return res.status(400).json({ error: "Nome do alimento e peso (gramas) s\xE3o obrigat\xF3rios." });
    }
    const g = Number(weight);
    const normalizedFood = String(foodName).toLowerCase().trim();
    const fallbackDatabase = {
      "ovo": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, vitaminA: 140, vitaminC: 0, vitaminD: 2, vitaminB6: 0.12, vitaminB12: 1.1, source: "Tabela TACO Oficial" },
      "frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "peito de frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "frango grelhado": { kcal: 170, p: 32, c: 0, f: 4.5, sodium: 80, fiber: 0, potassium: 260, calcium: 15, iron: 1, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO Oficial" },
      "frango cozido": { kcal: 163, p: 31.5, c: 0, f: 3.2, sodium: 70, fiber: 0, potassium: 250, calcium: 15, iron: 1, vitaminA: 6, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.6, vitaminB12: 0.3, source: "Tabela TACO" },
      "arroz": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "arroz branco": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "arroz integral": { kcal: 111, p: 2.6, c: 23, f: 0.9, sodium: 1, fiber: 1.8, potassium: 43, calcium: 10, iron: 0.4, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.18, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "feijao": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.15, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "feij\xE3o": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.15, vitaminB12: 0, source: "Tabela TACO Oficial" },
      "banana": { kcal: 89, p: 1.1, c: 23, f: 0.3, sodium: 1, fiber: 2.6, potassium: 358, calcium: 5, iron: 0.3, vitaminA: 3, vitaminC: 8.7, vitaminD: 0, vitaminB6: 0.4, vitaminB12: 0, source: "USDA Nutri" },
      "maca": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "USDA Nutri" },
      "ma\xE7\xE3": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, vitaminA: 3, vitaminC: 4.6, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "USDA Nutri" },
      "aveia": { kcal: 389, p: 16.9, c: 66, f: 6.9, sodium: 2, fiber: 10.6, potassium: 429, calcium: 54, iron: 4.7, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.1, vitaminB12: 0, source: "Tabela TACO" },
      "leite": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, vitaminA: 46, vitaminC: 0, vitaminD: 1.2, vitaminB6: 0.04, vitaminB12: 0.45, source: "Tabela TACO" },
      "leite desnatado": { kcal: 35, p: 3.2, c: 5, f: 0.1, sodium: 45, fiber: 0, potassium: 150, calcium: 122, iron: 0.1, vitaminA: 46, vitaminC: 0, vitaminD: 1.2, vitaminB6: 0.04, vitaminB12: 0.45, source: "Tabela TACO" },
      "whey": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informa\xE7\xE3o do Fabricante" },
      "whey protein": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informa\xE7\xE3o do Fabricante" },
      "creatina": { kcal: 0, p: 0, c: 0, f: 0, sodium: 0, fiber: 0, potassium: 0, calcium: 0, iron: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "Informa\xE7\xE3o do Fabricante" },
      "pao": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.05, vitaminB12: 0, source: "USDA Nutri" },
      "p\xE3o": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.05, vitaminB12: 0, source: "USDA Nutri" },
      "pao frances": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "Tabela TACO" },
      "p\xE3o franc\xEAs": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.04, vitaminB12: 0, source: "Tabela TACO" },
      "carne": { kcal: 250, p: 26, c: 0, f: 15, sodium: 60, fiber: 0, potassium: 318, calcium: 18, iron: 2.6, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.6, source: "USDA Nutri" },
      "patinho": { kcal: 140, p: 21, c: 0, f: 5, sodium: 55, fiber: 0, potassium: 330, calcium: 10, iron: 2.5, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.3, source: "Tabela TACO" },
      "alcatra": { kcal: 160, p: 22, c: 0, f: 7, sodium: 52, fiber: 0, potassium: 310, calcium: 10, iron: 2.3, vitaminA: 2, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.5, source: "Tabela TACO" },
      "batata": { kcal: 86, p: 2, c: 20, f: 0.1, sodium: 6, fiber: 1.8, potassium: 320, calcium: 12, iron: 0.3, vitaminA: 1, vitaminC: 20, vitaminD: 0, vitaminB6: 0.3, vitaminB12: 0, source: "Tabela TACO" },
      "batata doce": { kcal: 86, p: 1.3, c: 20, f: 0.1, sodium: 30, fiber: 3, potassium: 337, calcium: 30, iron: 0.6, vitaminA: 700, vitaminC: 2.4, vitaminD: 0, vitaminB6: 0.2, vitaminB12: 0, source: "Tabela TACO" },
      "salmao": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, vitaminA: 50, vitaminC: 0, vitaminD: 11, vitaminB6: 0.6, vitaminB12: 3.2, source: "USDA" },
      "salm\xE3o": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, vitaminA: 50, vitaminC: 0, vitaminD: 11, vitaminB6: 0.6, vitaminB12: 3.2, source: "USDA" },
      "azeite": { kcal: 884, p: 0, f: 100, c: 0, sodium: 2, fiber: 0, potassium: 1, calcium: 1, iron: 0.2, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0, vitaminB12: 0, source: "USDA" },
      "queijo": { kcal: 350, p: 23, c: 2.3, f: 28, sodium: 620, fiber: 0, potassium: 80, calcium: 700, iron: 0.4, vitaminA: 260, vitaminC: 0, vitaminD: 0.6, vitaminB6: 0.08, vitaminB12: 1.5, source: "Tabela TACO" },
      "manteiga": { kcal: 717, p: 0.8, c: 0.1, f: 81, sodium: 576, fiber: 0, potassium: 24, calcium: 24, iron: 0.1, vitaminA: 680, vitaminC: 0, vitaminD: 1.5, vitaminB6: 0.01, vitaminB12: 0.17, source: "USDA" },
      "mandioca": { kcal: 125, p: 0.6, c: 30, f: 0.3, sodium: 1, fiber: 1.6, potassium: 271, calcium: 19, iron: 0.3, vitaminA: 1, vitaminC: 20.6, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO" },
      "iogurte": { kcal: 60, p: 3.5, c: 5, f: 3, sodium: 50, fiber: 0, potassium: 140, calcium: 120, iron: 0.1, vitaminA: 27, vitaminC: 0.5, vitaminD: 0.1, vitaminB6: 0.05, vitaminB12: 0.4, source: "USDA" },
      "castanha": { kcal: 650, p: 15, c: 15, f: 60, sodium: 3, fiber: 6, potassium: 660, calcium: 110, iron: 6, vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB6: 0.3, vitaminB12: 0, source: "Tabela TACO" },
      "ovo de galinha": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, vitaminA: 140, vitaminC: 0, vitaminD: 2, vitaminB6: 0.12, vitaminB12: 1.1, source: "Tabela TACO" },
      "tomate": { kcal: 18, p: 0.9, c: 3.9, f: 0.2, sodium: 5, fiber: 1.2, potassium: 237, calcium: 10, iron: 0.3, vitaminA: 42, vitaminC: 13.7, vitaminD: 0, vitaminB6: 0.08, vitaminB12: 0, source: "Tabela TACO" },
      "alface": { kcal: 15, p: 1.3, c: 2.8, f: 0.2, sodium: 10, fiber: 1.3, potassium: 194, calcium: 36, iron: 0.8, vitaminA: 370, vitaminC: 9.2, vitaminD: 0, vitaminB6: 0.09, vitaminB12: 0, source: "Tabela TACO" }
    };
    const matchedFoodKey = Object.keys(fallbackDatabase).find(
      (key) => normalizedFood === key || normalizedFood.includes(key) || key.includes(normalizedFood)
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
    const prompt = `Analise os valores nutricionais reais e a m\xE9dia para ${g} gramas do seguinte alimento: "${foodName}". 
Voc\xEA deve se conectar \xE0 internet ou usar bases de dados confi\xE1veis de alimentos (como a tabela TACO, USDA, ou fontes na web) e pesquisar se necess\xE1rio. 
Calcule os valores escalados especificamente para ${g}g do alimento.
Retorne um objeto JSON contendo exatamente estas chaves com valores num\xE9ricos (exceto a fonte):
- calories: n\xFAmero (kcal para ${g}g)
- protein: n\xFAmero (g de prote\xEDna para ${g}g)
- carbs: n\xFAmero (g de carboidratos para ${g}g)
- fat: n\xFAmero (g de gordura para ${g}g)
- sodium: n\xFAmero (mg de s\xF3dio para ${g}g)
- fiber: n\xFAmero (g de fibras para ${g}g)
- potassium: n\xFAmero (mg de pot\xE1ssio para ${g}g)
- calcium: n\xFAmero (mg de c\xE1lcio para ${g}g)
- iron: n\xFAmero (mg de ferro para ${g}g)
- vitaminA: n\xFAmero (mcg de vitamina A para ${g}g)
- vitaminC: n\xFAmero (mg de vitamina C para ${g}g)
- vitaminD: n\xFAmero (mcg de vitamina D para ${g}g)
- vitaminB6: n\xFAmero (mg de vitamina B6 para ${g}g)
- vitaminB12: n\xFAmero (mcg de vitamina B12 para ${g}g)
- source: string curta indicando a fonte ou verifica\xE7\xE3o de pesquisa da web.

Aten\xE7\xE3o: retorne estritamente um JSON limpo formatado de acordo com o esquema mapeado. N\xE3o inclua Markdown extra al\xE9m do pr\xF3prio formato JSON.`;
    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Nutrition] Tentando Gemini com Google Search para: "${foodName}" (${g}g)`);
        const response = await aiInstance.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "vitaminA", "vitaminC", "vitaminD", "vitaminB6", "vitaminB12", "source"],
              properties: {
                calories: { type: import_genai.Type.NUMBER, description: "Calorias totais em kcal" },
                protein: { type: import_genai.Type.NUMBER, description: "Prote\xEDnas em gramas" },
                carbs: { type: import_genai.Type.NUMBER, description: "Carboidratos em gramas" },
                fat: { type: import_genai.Type.NUMBER, description: "Gorduras em gramas" },
                sodium: { type: import_genai.Type.NUMBER, description: "S\xF3dio em mg" },
                fiber: { type: import_genai.Type.NUMBER, description: "Fibras alimentares em gramas" },
                potassium: { type: import_genai.Type.NUMBER, description: "Pot\xE1ssio em mg" },
                calcium: { type: import_genai.Type.NUMBER, description: "C\xE1lculo de c\xE1lcio em mg" },
                iron: { type: import_genai.Type.NUMBER, description: "Hierro (ferro) em mg" },
                vitaminA: { type: import_genai.Type.NUMBER, description: "Vitamina A em mcg" },
                vitaminC: { type: import_genai.Type.NUMBER, description: "Vitamina C em mg" },
                vitaminD: { type: import_genai.Type.NUMBER, description: "Vitamina D em mcg" },
                vitaminB6: { type: import_genai.Type.NUMBER, description: "Vitamina B6 em mg" },
                vitaminB12: { type: import_genai.Type.NUMBER, description: "Vitamina B12 em mcg" },
                source: { type: import_genai.Type.STRING, description: "A fonte de consulta comprovada na internet" }
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
      } catch (searchError) {
        console.log(`[Nutrition] Gemini Search Grounding indisponivel (quota). Tentando Gemini padrao...`);
      }
      try {
        console.log(`[Nutrition] Tentando Gemini normal (com retries) para: "${foodName}" (${g}g)`);
        const responseWithoutSearch = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "vitaminA", "vitaminC", "vitaminD", "vitaminB6", "vitaminB12", "source"],
              properties: {
                calories: { type: import_genai.Type.NUMBER, description: "Calorias totais em kcal" },
                protein: { type: import_genai.Type.NUMBER, description: "Prote\xEDnas em gramas" },
                carbs: { type: import_genai.Type.NUMBER, description: "Carboidratos em gramas" },
                fat: { type: import_genai.Type.NUMBER, description: "Gorduras em gramas" },
                sodium: { type: import_genai.Type.NUMBER, description: "S\xF3dio em mg" },
                fiber: { type: import_genai.Type.NUMBER, description: "Fibras alimentares em gramas" },
                potassium: { type: import_genai.Type.NUMBER, description: "Pot\xE1ssio em mg" },
                calcium: { type: import_genai.Type.NUMBER, description: "C\xE1lculo de c\xE1lcio em mg" },
                iron: { type: import_genai.Type.NUMBER, description: "Hierro (ferro) em mg" },
                vitaminA: { type: import_genai.Type.NUMBER, description: "Vitamina A em mcg" },
                vitaminC: { type: import_genai.Type.NUMBER, description: "Vitamina C em mg" },
                vitaminD: { type: import_genai.Type.NUMBER, description: "Vitamina D em mcg" },
                vitaminB6: { type: import_genai.Type.NUMBER, description: "Vitamina B6 em mg" },
                vitaminB12: { type: import_genai.Type.NUMBER, description: "Vitamina B12 em mcg" },
                source: { type: import_genai.Type.STRING, description: "A fonte de consulta recomendada" }
              }
            }
          }
        });
        const responseText = responseWithoutSearch.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          console.log(`[Nutrition] Gemini padr\xE3o funcionou!`, parsedData);
          return res.json({ success: true, data: parsedData });
        }
      } catch (normalError) {
        console.log(`[Nutrition] Gemini padrao indisponivel. Ativando estimativa offline... Erro: ${normalError.message}`);
      }
    } else {
      console.log(`[Nutrition] Pulando IA por falta de chave API. Usando estimativa inteligente local.`);
    }
    try {
      let matchedFuzzyKey = Object.keys(fallbackDatabase).find(
        (key) => normalizedFood.includes(key) || key.includes(normalizedFood)
      );
      let basicNutrients = {
        kcal: 100,
        // standard default
        p: 2,
        c: 15,
        f: 1.5,
        sodium: 15,
        fiber: 1,
        potassium: 120,
        calcium: 15,
        iron: 0.5,
        vitaminA: 5,
        vitaminC: 1,
        vitaminD: 0,
        vitaminB6: 0.05,
        vitaminB12: 0,
        source: "Heur\xEDstica BioForma Estimada (Sem Conex\xE3o)"
      };
      if (matchedFuzzyKey) {
        basicNutrients = { ...fallbackDatabase[matchedFuzzyKey] };
      } else {
        if (normalizedFood.includes("carne") || normalizedFood.includes("bife") || normalizedFood.includes("peixe") || normalizedFood.includes("porco") || normalizedFood.includes("vaca")) {
          basicNutrients = { kcal: 200, p: 25, c: 0, f: 11, sodium: 60, fiber: 0, potassium: 300, calcium: 10, iron: 2, vitaminA: 5, vitaminC: 0, vitaminD: 0.1, vitaminB6: 0.5, vitaminB12: 2.5, source: "Estimativa Carnes BioForma" };
        } else if (normalizedFood.includes("bolo") || normalizedFood.includes("escondidinho") || normalizedFood.includes("pizza") || normalizedFood.includes("doce") || normalizedFood.includes("chocolate") || normalizedFood.includes("biscoito")) {
          basicNutrients = { kcal: 350, p: 4, c: 55, f: 15, sodium: 350, fiber: 1.5, potassium: 120, calcium: 40, iron: 1.2, vitaminA: 10, vitaminC: 0.5, vitaminD: 0.1, vitaminB6: 0.05, vitaminB12: 0.1, source: "Estimativa Ultraprocessados BioForma" };
        } else if (normalizedFood.includes("salada") || normalizedFood.includes("legume") || normalizedFood.includes("brocolis") || normalizedFood.includes("br\xF3colis") || normalizedFood.includes("cenoura") || normalizedFood.includes("abobora")) {
          basicNutrients = { kcal: 30, p: 1.5, c: 6, f: 0.2, sodium: 10, fiber: 2.5, potassium: 220, calcium: 30, iron: 0.6, vitaminA: 200, vitaminC: 15, vitaminD: 0, vitaminB6: 0.1, vitaminB12: 0, source: "Estimativa Vegetais BioForma" };
        } else if (normalizedFood.includes("suco") || normalizedFood.includes("refrigerante") || normalizedFood.includes("gatorade") || normalizedFood.includes("cerveja")) {
          basicNutrients = { kcal: 45, p: 0.1, c: 11, f: 0, sodium: 5, fiber: 0.1, potassium: 45, calcium: 2, iron: 0.1, vitaminA: 5, vitaminC: 10, vitaminD: 0, vitaminB6: 0.02, vitaminB12: 0, source: "Estimativa Bebidas BioForma" };
        }
      }
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
    } catch (fallbackErr) {
      console.log("Erro no fallback local:", fallbackErr);
      return res.status(200).json({
        success: true,
        data: {
          calories: Math.round(100 * (g / 100)),
          protein: parseFloat((2 * (g / 100)).toFixed(1)),
          carbs: parseFloat((15 * (g / 100)).toFixed(1)),
          fat: parseFloat((1.5 * (g / 100)).toFixed(1)),
          sodium: 15,
          fiber: 1,
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
  app.post("/api/aerobics-calories", async (req, res) => {
    const { type, duration, intensity, userWeight } = req.body;
    if (!type || !duration || isNaN(Number(duration))) {
      return res.status(400).json({ error: "Tipo de atividade e dura\xE7\xE3o s\xE3o obrigat\xF3rios." });
    }
    const min = Number(duration);
    const weight = Number(userWeight) || 68;
    const normalIntensity = String(intensity || "moderado").toLowerCase().trim();
    const normalizedType = String(type).toLowerCase().trim();
    const aiInstance = getAIClient();
    if (aiInstance) {
      const gptPrompt = `Voc\xEA \xE9 um especialista em fisiologia do exerc\xEDcio e educa\xE7\xE3o f\xEDsica. 
      Calcule as calorias gastas por uma pessoa de ${weight}kg realizando a seguinte atividade f\xEDsica:
      Atividade: "${type}"
      Dura\xE7\xE3o: ${min} minutos
      Intensidade: "${intensity}"
      
      Leve em considera\xE7\xE3o a fisiologia real (gasto por minuto e valor MET). Se for Amamenta\xE7\xE3o, ela tem um custo cal\xF3rico consider\xE1vel (~300 a 500 kcal por dia, cerca de 4 a 5 kcal/minuto dependendo da intensidade).
      Retorne estritamente um objeto JSON com as chaves:
      - caloriesBurned: n\xFAmero inteiro (calorias em kcal)
      - metUsed: n\xFAmero (MET correspondente \xE0 atividade e intensidade)
      - explanation: string curta em portugu\xEAs explicando simplificadamente a estimativa (ex: "Consumo estimado de X kcal/min para amamenta\xE7\xE3o moderada").
      
      N\xE3o inclua markdown extra ou texto de introdu\xE7\xE3o/conclus\xE3o. Apenas o JSON em formato puro.`;
      try {
        console.log(`[Aerobics] Tentando calcular calorias com Gemini (com retries) para: ${type}, ${min}min, intensidade: ${intensity}`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: gptPrompt,
          defaultModel: "gemini-3.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              required: ["caloriesBurned", "metUsed", "explanation"],
              properties: {
                caloriesBurned: { type: import_genai.Type.INTEGER, description: "Gasto cal\xF3rico estimado em kcal" },
                metUsed: { type: import_genai.Type.NUMBER, description: "Valor de MET utilizado" },
                explanation: { type: import_genai.Type.STRING, description: "Breve explica\xE7\xE3o do gasto" }
              }
            }
          }
        });
        const responseText = response.text;
        if (responseText) {
          const parsedData = JSON.parse(responseText.trim());
          console.log(`[Aerobics] Gemini calculou as calorias aer\xF3bicas:`, parsedData);
          return res.json({ success: true, data: parsedData });
        }
      } catch (geminiError) {
        console.log(`[Aerobics] Gemini indispon\xEDvel para c\xE1lculo de aer\xF3bico. Usando o algoritmo offline. Error: ${geminiError.message}`);
      }
    }
    try {
      let baseMet = 5;
      if (normalizedType.includes("corrida") || normalizedType.includes("trote") || normalizedType.includes("run")) {
        baseMet = normalIntensity === "baixo" ? 7 : normalIntensity === "alto" ? 12 : 9.8;
      } else if (normalizedType.includes("volei") || normalizedType.includes("v\xF4lei") || normalizedType.includes("volleyball")) {
        baseMet = normalIntensity === "baixo" ? 3 : normalIntensity === "alto" ? 6 : 4;
      } else if (normalizedType.includes("natacao") || normalizedType.includes("nata\xE7\xE3o") || normalizedType.includes("swim")) {
        baseMet = normalIntensity === "baixo" ? 4.5 : normalIntensity === "alto" ? 8 : 6;
      } else if (normalizedType.includes("amamenta") || normalizedType.includes("amamento") || normalizedType.includes("breastfeed")) {
        baseMet = normalIntensity === "baixo" ? 2.5 : normalIntensity === "alto" ? 4.5 : 3.5;
      } else if (normalizedType.includes("treino") || normalizedType.includes("musculacao") || normalizedType.includes("muscula\xE7\xE3o") || normalizedType.includes("academia")) {
        baseMet = normalIntensity === "baixo" ? 3.5 : normalIntensity === "alto" ? 7 : 5;
      } else if (normalizedType.includes("caminha") || normalizedType.includes("walk")) {
        baseMet = normalIntensity === "baixo" ? 2.5 : normalIntensity === "alto" ? 4.5 : 3.3;
      } else if (normalizedType.includes("bicicleta") || normalizedType.includes("pedal") || normalizedType.includes("bike")) {
        baseMet = normalIntensity === "baixo" ? 4 : normalIntensity === "alto" ? 10 : 7;
      } else if (normalizedType.includes("futebol") || normalizedType.includes("soccer")) {
        baseMet = normalIntensity === "baixo" ? 5 : normalIntensity === "alto" ? 9 : 7;
      } else if (normalizedType.includes("danca") || normalizedType.includes("dan\xE7a") || normalizedType.includes("zumba")) {
        baseMet = normalIntensity === "baixo" ? 3.5 : normalIntensity === "alto" ? 7 : 5;
      }
      const hours = min / 60;
      const computedKcal = Math.round(baseMet * weight * hours);
      const intensityText = normalIntensity.charAt(0).toUpperCase() + normalIntensity.slice(1);
      console.log(`[Aerobics] Retornando c\xE1lculo offline de aer\xF3bico para: ${type} ${min}min. Kcal: ${computedKcal}`);
      return res.json({
        success: true,
        data: {
          caloriesBurned: computedKcal,
          metUsed: baseMet,
          explanation: `C\xE1lculo offline: ${type} com intensidade ${intensityText} (${baseMet} MET).`
        }
      });
    } catch (err) {
      const emergencyKcal = Math.round(6 * min);
      return res.json({
        success: true,
        data: {
          caloriesBurned: emergencyKcal,
          metUsed: 5,
          explanation: "Estimativa geral BioForma (6 kcal/minuto)."
        }
      });
    }
  });
  app.post("/api/analyze-exam", async (req, res) => {
    const { type, value, unit, result, notes } = req.body;
    if (!type) {
      return res.status(400).json({ error: "O tipo ou nome do exame \xE9 obrigat\xF3rio para a an\xE1lise." });
    }
    const numericValue = Number(value);
    const normalizedType = String(type).toLowerCase().trim();
    const prompt = `Voc\xEA \xE9 um analista m\xE9dico de intelig\xEAncia artificial de elite integrado ao aplicativo BioForma.
O usu\xE1rio enviou um exame laboratorial e deseja solu\xE7\xF5es/sugest\xF5es pr\xE1ticas para o seu resultado, principalmente se estiver fora dos valores normais ou abaixo da refer\xEAncia.

Detalhes do exame fornecidos:
- Tipo/Nome do Exame: "${type}"
- Valor registrado: ${value ? `${value} ${unit || ""}` : "N\xE3o informado numericamente"}
- Texto do Resultado/Laudo Completo: "${result || ""}"
- Notas/Observa\xE7\xF5es: "${notes || ""}"

Voc\xEA deve fornecer uma resposta no formato JSON estruturado com os seguintes campos:
1. "analysis": Breve resumo explicando o que \xE9 esse exame e interpretando o valor atual (especialmente se estiver baixo ou alto).
2. "causes": Uma lista de strings contendo poss\xEDveis causas fisiol\xF3gicas para esse n\xEDvel (principalmente se estiver abaixo do ideal).
3. "solutions": Uma lista de strings com solu\xE7\xF5es pr\xE1ticas e seguras para elevar/ajustar esse marcador (melhorias nos treinos, mudan\xE7as de h\xE1bitos, regula\xE7\xE3o de sono, controle de estresse).
4. "dietaryTips": Uma lista de strings com dicas de alimenta\xE7\xE3o ou alimentos ricos que auxiliam nesse marcador espec\xEDfico.
5. "warning": Um aviso m\xE9dico claro, lembrando que a IA \xE9 apenas informativa e n\xE3o substitui a consulta m\xE9dica.

Escreva a resposta estritamente em portugu\xEAs brasileiro de forma profissional, acolhedora e direta. Retorne apenas o JSON puro, sem formata\xE7\xE3o Markdown externa.`;
    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Exam Analysis] Analisando exame com Gemini (com retries) para: "${type}" (valor: ${value})`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              required: ["analysis", "causes", "solutions", "dietaryTips", "warning"],
              properties: {
                analysis: { type: import_genai.Type.STRING, description: "Resumo explicativo do exame e interpreta\xE7\xE3o" },
                causes: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Lista de poss\xEDveis causas do n\xEDvel do exame"
                },
                solutions: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Lista de sugest\xF5es de h\xE1bitos, atividades ou solu\xE7\xF5es gerais"
                },
                dietaryTips: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Alimentos e estrat\xE9gias de dieta recomendados"
                },
                warning: { type: import_genai.Type.STRING, description: "Aviso de isen\xE7\xE3o de responsabilidade m\xE9dica" }
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
      } catch (geminiErr) {
        console.log(`[Exam Analysis] Falha ao consultar o Gemini para exames, usando o analisador offline inteligente. Erro: ${geminiErr.message}`);
      }
    }
    try {
      console.log(`[Exam Analysis] Executando analisador offline de exames para: "${type}"`);
      let analysis = `O exame de ${type} \xE9 fundamental para avaliar as fun\xE7\xF5es metab\xF3licas ou hormonais do organismo.`;
      let causes = ["Fatores individuais de gen\xE9tica ou idade", "Padr\xF5es alimentares espec\xEDficos", "N\xEDvel de atividade f\xEDsica", "N\xEDveis de estresse ou priva\xE7\xE3o de sono."];
      let solutions = ["Manter rotina consistente de atividade f\xEDsica (muscula\xE7\xE3o e aer\xF3bico)", "Priorizar 7 a 8 horas de sono de qualidade para regula\xE7\xE3o end\xF3crina", "Reduzir consumo de a\xE7\xFAcares refinados e gorduras trans", "Monitorar novos resultados em 3 a 6 meses sob supervis\xE3o m\xE9dica."];
      let dietaryTips = ["Beba pelo menos 35ml de \xE1gua por kg de peso corporal diariamente", "Aumente o consumo de vegetais folhosos escuros, legumes e frutas frescas", "Inclua fontes de gorduras saud\xE1veis na alimenta\xE7\xE3o (azeite extra virgem, sementes, abacate, peixes)."];
      let warning = "Aten\xE7\xE3o: Esta \xE9 uma an\xE1lise automatizada baseada em diretrizes nutricionais e esportivas de car\xE1ter exclusivamente informativo. Nunca altere medicamentos ou inicie suplementa\xE7\xF5es de alta dose sem antes consultar seu m\xE9dico de confian\xE7a.";
      if (normalizedType.includes("vitamina d") || normalizedType.includes("d3") || normalizedType.includes("colecalciferol")) {
        analysis = "A Vitamina D \xE9 crucial para a fixa\xE7\xE3o do c\xE1lcio nos ossos, modula\xE7\xE3o da imunidade, for\xE7a muscular e s\xEDntese hormonal. N\xEDveis baixos (especialmente abaixo de 30 ng/mL) s\xE3o extremamente comuns em pessoas que passam muito tempo em ambientes fechados.";
        causes = [
          "Baixa exposi\xE7\xE3o \xE0 luz solar direta sem protetor solar",
          "Dieta pobre em peixes gordos e gemas de ovos",
          "Dificuldades metab\xF3licas individuais de s\xEDntese cut\xE2nea."
        ];
        solutions = [
          "Exposi\xE7\xE3o solar di\xE1ria inteligente de 15 a 20 minutos (bra\xE7os e pernas expostos, preferencialmente entre as 10h e as 14h, respeitando a sensibilidade da pele)",
          "Realizar exerc\xEDcios f\xEDsicos regulares (estimula o metabolismo \xF3sseo e muscular)",
          "Apresentar este resultado ao m\xE9dico para prescri\xE7\xE3o de uma dosagem segura de suplementa\xE7\xE3o de Vitamina D3 (ex: 2.000 UI a 5.000 UI di\xE1rias, conforme necessidade cl\xEDnica)."
        ];
        dietaryTips = [
          "Aumentar o consumo de peixes de \xE1guas frias (salm\xE3o selvagem, atum, sardinha)",
          "Incluir gemas de ovos org\xE2nicos ou caipiras na dieta",
          "Consumir cogumelos expostos ao sol ou alimentos fortificados com Vitamina D."
        ];
      } else if (normalizedType.includes("vitamina c") || normalizedType.includes("\xE1cido asc\xF3rbico") || normalizedType.includes("ascorb")) {
        analysis = "A Vitamina C (\xE1cido asc\xF3rbico) \xE9 um poderoso antioxidante vital para a s\xEDntese de col\xE1geno, sa\xFAde de vasos sangu\xEDneos, cicatriza\xE7\xE3o, absor\xE7\xE3o do ferro vegetal e excelente fun\xE7\xE3o do sistema imunol\xF3gico. N\xEDveis baixos causam fadiga, imunidade baixa e dores nas articula\xE7\xF5es.";
        causes = [
          "Consumo insuficiente de frutas frescas e vegetais crus no dia a dia",
          "Cozimento prolongado de alimentos ricos em Vitamina C (que destr\xF3i o nutriente devido ao calor)",
          "Estresse f\xEDsico muito alto decorrente de treinos exaustivos sem recupera\xE7\xE3o adequada",
          "H\xE1bito de fumar ou exposi\xE7\xE3o frequente a toxinas ambientais (que aumentam o gasto de antioxidantes)."
        ];
        solutions = [
          "Aumentar a ingest\xE3o de alimentos crus ricos em Vitamina C nas refei\xE7\xF5es principais",
          "Melhorar a absor\xE7\xE3o do ferro de fontes vegetais (como feij\xE3o e espinafre) consumindo alimentos com Vitamina C na mesma refei\xE7\xE3o",
          "Ajustar a intensidade do treino e priorizar o descanso se a imunidade estiver fragilizada",
          "Se indicado por m\xE9dico ou nutricionista, avaliar a suplementa\xE7\xE3o di\xE1ria de 500mg a 1000mg de Vitamina C pura."
        ];
        dietaryTips = [
          "Consumir frutas c\xEDtricas frescas (laranja, lim\xE3o, mexerica, kiwi, morango)",
          "Incluir frutas com alt\xEDssima concentra\xE7\xE3o como Acerola e Goiaba na sua rotina de sucos ou lanches",
          "Adicionar piment\xE3o amarelo ou vermelho cru na salada, al\xE9m de br\xF3colis e couve pouco cozidos."
        ];
      } else if (normalizedType.includes("testosterona") || normalizedType.includes("testo")) {
        analysis = "A testosterona \xE9 o principal horm\xF4nio androg\xEAnico, essencial para o ganho e manuten\xE7\xE3o de massa muscular, queima de gordura, n\xEDveis de energia, libido e sa\xFAde cognitiva. N\xEDveis muito baixos podem sabotar seu progresso f\xEDsico.";
        causes = [
          "Estresse cr\xF4nico elevado (o cortisol alto inibe diretamente a produ\xE7\xE3o de testosterona)",
          "Priva\xE7\xE3o de sono recorrente ou sono fragmentado",
          "Defici\xEAncia de gorduras boas e micronutrientes como zinco e magn\xE9sio na dieta",
          "Excesso de gordura corporal, que aumenta a convers\xE3o de testosterona em estrog\xEAnio via aromatase."
        ];
        solutions = [
          "Praticar treinos de for\xE7a intensos (muscula\xE7\xE3o com pesos livres, agachamentos, levantamento terra) de 3 a 5 vezes na semana",
          "Garantir 7 a 8 horas de sono profundo ininterrupto por noite",
          "Gerenciar o estresse por meio de medita\xE7\xE3o, respira\xE7\xE3o ou caminhadas ao ar livre",
          "Evitar consumo excessivo de \xE1lcool, que interfere diretamente no eixo hormonal."
        ];
        dietaryTips = [
          "Consumir fontes de gorduras saud\xE1veis (gemas de ovo, azeite extra virgem, abacate, castanhas e nozes) para fornecer colesterol, que \xE9 a mat\xE9ria-prima dos horm\xF4nios esteroides",
          "Garantir alimentos ricos em Zinco e Magn\xE9sio (carne vermelha magra, sementes de ab\xF3bora, espinafre, cacau 100%)",
          "Adicionar vegetais cruc\xEDferos (br\xF3colis, couve-flor, repolho), que cont\xEAm compostos que auxiliam no equil\xEDbrio estrog\xEAnico."
        ];
      } else if (normalizedType.includes("glicose") || normalizedType.includes("a\xE7\xFAcar") || normalizedType.includes("glicemia")) {
        if (numericValue > 0 && numericValue < 70) {
          analysis = "Sua Glicose em jejum est\xE1 abaixo da refer\xEAncia padr\xE3o (< 70 mg/dL), indicando uma tend\xEAncia \xE0 hipoglicemia leve. Isso pode gerar fadiga s\xFAbita, tontura, tremores ou suor frio.";
          causes = [
            "Per\xEDodos de jejum prolongado n\xE3o adaptados",
            "Treinos de alt\xEDssima intensidade combinados com baixa ingest\xE3o de carboidratos pr\xE9vios",
            "Alta sensibilidade insul\xEDnica natural ou resposta metab\xF3lica exagerada ao estresse f\xEDsico."
          ];
          solutions = [
            "Evitar treinar em jejum absoluto se sentir tontura ou fraqueza",
            "Distribuir a ingest\xE3o cal\xF3rica e de carboidratos de forma mais homog\xEAnea ao longo do dia",
            "Monitorar as taxas de glicemia e relatar tonturas ao seu profissional de sa\xFAde."
          ];
          dietaryTips = [
            "Adicionar fontes de carboidratos complexos de baixo \xEDndice glic\xEAmico combinados com prote\xEDnas e fibras nas refei\xE7\xF5es principais (aveia, batata doce, arroz integral, lentilha)",
            "Leve sempre uma fonte r\xE1pida de carboidrato (uma banana ou sach\xEA de mel) na bolsa para emerg\xEAncias de tontura durante treinos intensos."
          ];
        } else if (numericValue >= 100) {
          analysis = "Sua Glicose est\xE1 acima de 99 mg/dL, sugerindo um estado de pr\xE9-diabetes ou resist\xEAncia \xE0 insulina que precisa ser abordado para evitar o ac\xFAmulo de gordura visceral e proteger o p\xE2ncreas.";
          causes = [
            "Dieta com alta densidade de carboidratos simples e a\xE7\xFAcares refinados",
            "Sedentarismo ou falta de contra\xE7\xE3o muscular de alta demanda",
            "Estresse cr\xF4nico que mant\xE9m o cortisol elevado (estimulando a gliconeog\xEAnese)."
          ];
          solutions = [
            "Engajar-se em treinos de muscula\xE7\xE3o (o m\xFAsculo \xE9 o principal captador de glicose sem necessidade excessiva de insulina)",
            "Fazer uma caminhada de 10 a 15 minutos logo ap\xF3s as maiores refei\xE7\xF5es (ajuda a controlar o pico glic\xEAmico p\xF3s-prandial)",
            "Melhorar a qualidade do sono e praticar controle de estresse."
          ];
          dietaryTips = [
            "Substituir carboidratos refinados (p\xE3o branco, massas, doces) por vers\xF5es integrais e ricos em fibras",
            "Iniciar as refei\xE7\xF5es principais consumindo primeiro as fibras (saladas) e prote\xEDnas, deixando os carboidratos por \xFAltimo (reduz a velocidade de absor\xE7\xE3o da glicose)",
            "Utilizar canela em p\xF3, vinagre de ma\xE7\xE3 e ch\xE1 verde, que auxiliam na sensibilidade \xE0 insulina."
          ];
        }
      } else if (normalizedType.includes("hdl") || normalizedType.includes("bom")) {
        analysis = "O HDL \xE9 o Colesterol Bom. Ele atua como uma 'limpeza' das art\xE9rias, levando o excesso de colesterol de volta ao f\xEDgado para ser eliminado. Valores muito baixos (geralmente abaixo de 40 mg/dL) aumentam o risco cardiovascular.";
        causes = [
          "Falta de exerc\xEDcios aer\xF3bicos regulares",
          "Consumo inadequado de gorduras saud\xE1veis e excesso de carboidratos refinados",
          "Fatores gen\xE9ticos ou sedentarismo cr\xF4nico."
        ];
        solutions = [
          "Adicionar atividades aer\xF3bicas de intensidade moderada a alta de 3 a 5 vezes na semana (corrida, ciclismo, nata\xE7\xE3o)",
          "Eliminar gorduras trans (biscoitos recheados, salgadinhos de pacote, frituras industriais)",
          "Controlar o peso e evitar o tabagismo."
        ];
        dietaryTips = [
          "Consumir azeite de oliva extra virgem diariamente (cerca de 1 a 2 colheres de sopa)",
          "Comer abacate, sementes de linha\xE7a, chia e oleaginosas (nozes, castanhas-do-par\xE1)",
          "Incluir peixes ricos em \xD4mega-3 ou avaliar suplementa\xE7\xE3o purificada de \xF3leo de peixe."
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
    } catch (offlineErr) {
      return res.status(500).json({ error: "Erro interno ao processar a an\xE1lise do exame." });
    }
  });
  app.post("/api/motivation", async (req, res) => {
    const { name, targetWeight, weight, workouts, consistency } = req.body;
    const prompt = `Voc\xEA \xE9 um personal trainer e nutricionista motivacional de elite. 
O usu\xE1rio se chama ${name || "Atleta"}. 
Dados recentes:
- Peso atual: ${weight || "N/A"} kg
- Meta: ${targetWeight || "N/A"} kg
- \xDAltimos treinos: ${workouts || "Nenhum registrado"}
- Consist\xEAncia de h\xE1bitos nos \xFAltimos 14 dias (treinos, dieta e hidrata\xE7\xE3o): ${consistency !== void 0 ? consistency + "%" : "N\xE3o calculada ainda"}

Gere uma mensagem curta, altamente personalizada, impactante e motivadora em portugu\xEAs para o usu\xE1rio hoje. 
Se a consist\xEAncia estiver alta (acima de 75%), parabenize a disciplina implac\xE1vel. Se estiver m\xE9dia (50% a 75%), incentive a continuar subindo e manter a const\xE2ncia. Se estiver abaixo de 50%, d\xEA um "pux\xE3o de orelha" amig\xE1vel e encorajador, lembrando-o de que cada pequeno passo conta e que ele precisa retomar a rotina de treinos, \xE1gua e dieta hoje mesmo.
Foques em disciplina, consist\xEAncia e no objetivo de ter m\xFAsculos mais fortes e menos gordura. 
Use um tom de "coach" de alto n\xEDvel, din\xE2mico e focado em resultados reais, sem enrola\xE7\xE3o.`;
    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Motivation] Gerando mensagem motivacional com Gemini (com retries) para: "${name || "Atleta"}"`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.5-flash",
          maxRetries: 2
        });
        if (response && response.text) {
          return res.json({ success: true, text: response.text });
        }
      } catch (err) {
        console.log(`[Motivation] Falha ao consultar o Gemini para motiva\xE7\xE3o: ${err.message}`);
      }
    }
    return res.json({
      success: true,
      text: "Mantenha o foco! A disciplina \xE9 o que separa o sonho da realidade. Cada repeti\xE7\xE3o, cada refei\xE7\xE3o limpa e cada gota de suor te deixam mais perto da sua melhor vers\xE3o. Vamos pra cima!"
    });
  });
  app.post("/api/workout-feedback", async (req, res) => {
    const { workoutType, exercises } = req.body;
    if (!workoutType || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: "O tipo de treino e a lista de exerc\xEDcios realizados s\xE3o obrigat\xF3rios." });
    }
    const totalVolume = exercises.reduce((acc, ex) => {
      const w = Number(ex.weight) || 0;
      const s = Number(ex.sets) || 0;
      const r = Number(ex.reps) || 0;
      return acc + w * s * r;
    }, 0);
    const exercisesSummary = exercises.map(
      (ex) => `- ${ex.name}: ${ex.sets} s\xE9ries x ${ex.reps} repeti\xE7\xF5es com ${ex.weight} kg`
    ).join("\n");
    const prompt = `Voc\xEA \xE9 um Personal Trainer Inteligente de elite e especialista em fisiologia do exerc\xEDcio integrado ao aplicativo BioForma.
O usu\xE1rio acabou de concluir uma sess\xE3o de treino real. Voc\xEA deve analisar a carga (peso), as s\xE9ries (sets) e repeti\xE7\xF5es de cada exerc\xEDcio realizado para fornecer solu\xE7\xF5es pr\xE1ticas de sobrecarga progressiva, dicas biomec\xE2nicas de execu\xE7\xE3o e estrat\xE9gias alimentares.

Detalhes da Sess\xE3o de Treino:
- Tipo/Nome do Treino: "${workoutType}"
- Volume Total Movimentado: ${totalVolume} kg
- Exerc\xEDcios Realizados:
${exercisesSummary}

Voc\xEA deve retornar obrigatoriamente um objeto JSON com as seguintes chaves em portugu\xEAs do Brasil:
1. "generalFeedback": Um par\xE1grafo de feedback motivacional e fisiol\xF3gico geral, parabenizando o esfor\xE7o e avaliando de forma cient\xEDfica o est\xEDmulo gerado (ex: hipertrofia muscular, for\xE7a, condicionamento) com base na combina\xE7\xE3o de cargas e repeti\xE7\xF5es realizadas.
2. "progressiveOverloadSolutions": Uma lista de strings (3 a 4 itens) sugerindo solu\xE7\xF5es inteligentes de sobrecarga progressiva para a pr\xF3xima sess\xE3o de alguns dos exerc\xEDcios realizados (ex: sugerir aumento de carga fracionada, incremento de repeti\xE7\xF5es por s\xE9rie, ou aumento da densidade do treino controlando o descanso).
3. "biomechanicsFormTips": Uma lista de strings (2 a 3 itens) focadas em ajuste postural, seguran\xE7a articular, cad\xEAncia da fase exc\xEAntrica/conc\xEAntrica e recrutamento de unidades motoras para os grupos musculares envolvidos nesse treino.
4. "nutritionalStrategy": Uma lista de strings (2 a 3 itens) com solu\xE7\xF5es nutricionais imediatas p\xF3s-treino de s\xEDntese proteica, reidrata\xE7\xE3o e ress\xEDntese de glicog\xEAnio adequadas para a recupera\xE7\xE3o dessa sess\xE3o.

Aten\xE7\xE3o: retorne estritamente um JSON limpo e v\xE1lido formatado de acordo com o esquema mapeado. N\xE3o inclua Markdown extra como \`\`\`json ou introdu\xE7\xF5es.`;
    const aiInstance = getAIClient();
    if (aiInstance) {
      try {
        console.log(`[Workout Feedback] Gerando feedback com Gemini para treino: "${workoutType}" (volume: ${totalVolume}kg)`);
        const response = await generateContentWithRetry(aiInstance, {
          contents: prompt,
          defaultModel: "gemini-3.5-flash",
          maxRetries: 2,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: import_genai.Type.OBJECT,
              required: ["generalFeedback", "progressiveOverloadSolutions", "biomechanicsFormTips", "nutritionalStrategy"],
              properties: {
                generalFeedback: { type: import_genai.Type.STRING, description: "Feedback geral e motivacional do treino realizado" },
                progressiveOverloadSolutions: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Lista de propostas para sobrecarga progressiva no pr\xF3ximo treino"
                },
                biomechanicsFormTips: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Lista de solu\xE7\xF5es e corre\xE7\xF5es biomec\xE2nicas e posturais"
                },
                nutritionalStrategy: {
                  type: import_genai.Type.ARRAY,
                  items: { type: import_genai.Type.STRING },
                  description: "Sugest\xF5es de nutri\xE7\xE3o e hidrata\xE7\xE3o p\xF3s-treino"
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
      } catch (geminiErr) {
        console.log(`[Workout Feedback] Gemini indispon\xEDvel para feedback de treino. Ativando fallback inteligente offline. Erro: ${geminiErr.message}`);
      }
    }
    try {
      console.log(`[Workout Feedback] Executando gerador offline de feedback para treino: "${workoutType}"`);
      const generalFeedback = `Sensacional! Voc\xEA concluiu o seu treino "${workoutType}" com excelente dedica\xE7\xE3o! Analisando os seus dados de cargas e s\xE9ries, voc\xEA movimentou um volume total acumulado de ${totalVolume} kg nesta sess\xE3o. Este est\xEDmulo de volume e tens\xE3o mec\xE2nica \xE9 altamente eficiente para desencadear cascatas de sinaliza\xE7\xE3o molecular para a hipertrofia e fortalecimento do tecido muscular. Continue consistente!`;
      const firstExerciseName = exercises[0]?.name || "exerc\xEDcio principal";
      const progressiveOverloadSolutions = [
        `No exerc\xEDcio "${firstExerciseName}", se conseguiu completar as s\xE9ries com a postura ideal, experimente aumentar a carga de 1kg a 2kg de cada lado na pr\xF3xima sess\xE3o para impor um novo est\xEDmulo de sobrecarga \xE0 musculatura.`,
        "Aplique a sobrecarga de repeti\xE7\xF5es: se a carga atual estiver muito pesada para aumentar, tente adicionar apenas 1 a 2 repeti\xE7\xF5es extras na \xFAltima s\xE9rie de cada exerc\xEDcio antes de subir o peso.",
        "Diminua o tempo de intervalo em 10 segundos nos exerc\xEDcios em que obteve maior facilidade. Isso aumenta a densidade do treino e estimula mais o estresse metab\xF3lico produtivo.",
        "Controle a fase exc\xEAntrica: realize a descida do peso de forma lenta (3 segundos) para ampliar o tempo sob tens\xE3o, o que gera microles\xF5es positivas fundamentais para o ganho muscular."
      ];
      const biomechanicsFormTips = [
        "Foque na conex\xE3o mente-m\xFAsculo: contraia conscientemente o grupo muscular alvo no topo de cada repeti\xE7\xE3o, ao inv\xE9s de apenas empurrar ou puxar o peso sem inten\xE7\xE3o.",
        "Mantenha suas articula\xE7\xF5es estabilizadas e evite realizar movimentos compensat\xF3rios ('roubar' com a lombar ou balan\xE7ar o tronco) para manter o estresse isolado no m\xFAsculo correto.",
        "Respire de maneira coordenada: expire na fase conc\xEAntrica (quando vence a resist\xEAncia) e inspire na fase exc\xEAntrica (quando segura o peso de volta)."
      ];
      const nutritionalStrategy = [
        "Consuma uma por\xE7\xE3o proteica de alta qualidade (como ovos, frango, peixe ou whey) nas pr\xF3ximas 1 a 2 horas para maximizar o balan\xE7o nitrogenado positivo e acelerar a s\xEDntese de prote\xEDnas.",
        "Reponha os estoques de energia de forma inteligente adicionando carboidratos de m\xE9dio/alto \xEDndice glic\xEAmico (como banana, aveia ou arroz) para acelerar a ress\xEDntese de glicog\xEAnio muscular.",
        "Hidrata\xE7\xE3o essencial: beba pelo menos 500ml de \xE1gua imediatamente e continue bebendo pequenos goles ao longo das pr\xF3ximas horas para recuperar a hidrata\xE7\xE3o das c\xE9lulas musculares, o que otimiza a recupera\xE7\xE3o."
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
    } catch (offlineErr) {
      return res.status(500).json({ error: "Erro interno ao processar o feedback do treino." });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[FULL-STACK] Servidor rodando em http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
