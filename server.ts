import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for food nutrition lookup using Gemini + Google Search Grounding with robust fallbacks
  app.post("/api/nutrition", async (req, res) => {
    const { foodName, weight } = req.body;

    if (!foodName || !weight || isNaN(Number(weight))) {
      return res.status(400).json({ error: "Nome do alimento e peso (gramas) são obrigatórios." });
    }

    const g = Number(weight);
    const normalizedFood = String(foodName).toLowerCase().trim();

    // Predefined local dictionary for immediate lookup (saves API quota) & robust offline handling
    const fallbackDatabase: Record<string, { kcal: number; p: number; c: number; f: number; sodium: number; fiber: number; potassium: number; calcium: number; iron: number; source: string }> = {
      "ovo": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, source: "Tabela TACO Oficial" },
      "frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, source: "Tabela TACO Oficial" },
      "peito de frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, source: "Tabela TACO Oficial" },
      "frango grelhado": { kcal: 170, p: 32, c: 0, f: 4.5, sodium: 80, fiber: 0, potassium: 260, calcium: 15, iron: 1.0, source: "Tabela TACO Oficial" },
      "frango cozido": { kcal: 163, p: 31.5, c: 0, f: 3.2, sodium: 70, fiber: 0, potassium: 250, calcium: 15, iron: 1.0, source: "Tabela TACO" },
      "arroz": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, source: "Tabela TACO Oficial" },
      "arroz branco": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, source: "Tabela TACO Oficial" },
      "arroz integral": { kcal: 111, p: 2.6, c: 23, f: 0.9, sodium: 1, fiber: 1.8, potassium: 43, calcium: 10, iron: 0.4, source: "Tabela TACO Oficial" },
      "feijao": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, source: "Tabela TACO Oficial" },
      "feijão": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, source: "Tabela TACO Oficial" },
      "banana": { kcal: 89, p: 1.1, c: 23, f: 0.3, sodium: 1, fiber: 2.6, potassium: 358, calcium: 5, iron: 0.3, source: "USDA Nutri" },
      "maca": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, source: "USDA Nutri" },
      "maçã": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, source: "USDA Nutri" },
      "aveia": { kcal: 389, p: 16.9, c: 66, f: 6.9, sodium: 2, fiber: 10.6, potassium: 429, calcium: 54, iron: 4.7, source: "Tabela TACO" },
      "leite": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, source: "Tabela TACO" },
      "leite desnatado": { kcal: 35, p: 3.2, c: 5, f: 0.1, sodium: 45, fiber: 0, potassium: 150, calcium: 122, iron: 0.1, source: "Tabela TACO" },
      "whey": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, source: "Informação do Fabricante" },
      "whey protein": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, source: "Informação do Fabricante" },
      "creatina": { kcal: 0, p: 0, c: 0, f: 0, sodium: 0, fiber: 0, potassium: 0, calcium: 0, iron: 0, source: "Informação do Fabricante" },
      "pao": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, source: "USDA Nutri" },
      "pão": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, source: "USDA Nutri" },
      "pao frances": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1.0, source: "Tabela TACO" },
      "pão francês": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1.0, source: "Tabela TACO" },
      "carne": { kcal: 250, p: 26, c: 0, f: 15, sodium: 60, fiber: 0, potassium: 318, calcium: 18, iron: 2.6, source: "USDA Nutri" },
      "patinho": { kcal: 140, p: 21, c: 0, f: 5, sodium: 55, fiber: 0, potassium: 330, calcium: 10, iron: 2.5, source: "Tabela TACO" },
      "alcatra": { kcal: 160, p: 22, c: 0, f: 7, sodium: 52, fiber: 0, potassium: 310, calcium: 10, iron: 2.3, source: "Tabela TACO" },
      "batata": { kcal: 86, p: 2, c: 20, f: 0.1, sodium: 6, fiber: 1.8, potassium: 320, calcium: 12, iron: 0.3, source: "Tabela TACO" },
      "batata doce": { kcal: 86, p: 1.3, c: 20, f: 0.1, sodium: 30, fiber: 3, potassium: 337, calcium: 30, iron: 0.6, source: "Tabela TACO" },
      "salmao": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, source: "USDA" },
      "salmão": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, source: "USDA" },
      "azeite": { kcal: 884, p: 0, f: 100, c: 0, sodium: 2, fiber: 0, potassium: 1, calcium: 1, iron: 0.2, source: "USDA" },
      "queijo": { kcal: 350, p: 23, c: 2.3, f: 28, sodium: 620, fiber: 0, potassium: 80, calcium: 700, iron: 0.4, source: "Tabela TACO" },
      "manteiga": { kcal: 717, p: 0.8, c: 0.1, f: 81, sodium: 576, fiber: 0, potassium: 24, calcium: 24, iron: 0.1, source: "USDA" },
      "mandioca": { kcal: 125, p: 0.6, c: 30, f: 0.3, sodium: 1, fiber: 1.6, potassium: 271, calcium: 19, iron: 0.3, source: "Tabela TACO" },
      "iogurte": { kcal: 60, p: 3.5, c: 5, f: 3, sodium: 50, fiber: 0, potassium: 140, calcium: 120, iron: 0.1, source: "USDA" },
      "castanha": { kcal: 650, p: 15, c: 15, f: 60, sodium: 3, fiber: 6, potassium: 660, calcium: 110, iron: 6.0, source: "Tabela TACO" },
      "ovo de galinha": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, source: "Tabela TACO" },
      "tomate": { kcal: 18, p: 0.9, c: 3.9, f: 0.2, sodium: 5, fiber: 1.2, potassium: 237, calcium: 10, iron: 0.3, source: "Tabela TACO" },
      "alface": { kcal: 15, p: 1.3, c: 2.8, f: 0.2, sodium: 10, fiber: 1.3, potassium: 194, calcium: 36, iron: 0.8, source: "Tabela TACO" }
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
- source: string curta indicando a fonte ou verificação de pesquisa da web.

Atenção: retorne estritamente um JSON limpo formatado de acordo com o esquema mapeado. Não inclua Markdown extra além do próprio formato JSON.`;

    // Strategy 1: Attempt with Gemini 3.5 Flash and Google Search Grounding
    try {
      console.log(`[Nutrition] Tentando Gemini com Google Search para: "${foodName}" (${g}g)`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "source"],
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

    // Strategy 2: Attempt standard prompt without the googleSearch tool
    try {
      console.log(`[Nutrition] Tentando Gemini normal (sem Search) para: "${foodName}" (${g}g)`);
      const responseWithoutSearch = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            required: ["calories", "protein", "carbs", "fat", "sodium", "fiber", "potassium", "calcium", "iron", "source"],
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
      console.log(`[Nutrition] Gemini padrao indisponivel (quota). Ativando estimativa offline...`);
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
        source: "Heurística BioForma Estimada (Sem Conexão)"
      };

      if (matchedFuzzyKey) {
        basicNutrients = { ...fallbackDatabase[matchedFuzzyKey] };
      } else {
        // Smart Heuristic guesses based on Portuguese food classification keywords
        if (normalizedFood.includes("carne") || normalizedFood.includes("bife") || normalizedFood.includes("peixe") || normalizedFood.includes("porco") || normalizedFood.includes("vaca")) {
          basicNutrients = { kcal: 200, p: 25, c: 0, f: 11, sodium: 60, fiber: 0, potassium: 300, calcium: 10, iron: 2.0, source: "Estimativa Carnes BioForma" };
        } else if (normalizedFood.includes("bolo") || normalizedFood.includes("escondidinho") || normalizedFood.includes("pizza") || normalizedFood.includes("doce") || normalizedFood.includes("chocolate") || normalizedFood.includes("biscoito")) {
          basicNutrients = { kcal: 350, p: 4, c: 55, f: 15, sodium: 350, fiber: 1.5, potassium: 120, calcium: 40, iron: 1.2, source: "Estimativa Ultraprocessados BioForma" };
        } else if (normalizedFood.includes("salada") || normalizedFood.includes("legume") || normalizedFood.includes("brocolis") || normalizedFood.includes("brócolis") || normalizedFood.includes("cenoura") || normalizedFood.includes("abobora")) {
          basicNutrients = { kcal: 30, p: 1.5, c: 6, f: 0.2, sodium: 10, fiber: 2.5, potassium: 220, calcium: 30, iron: 0.6, source: "Estimativa Vegetais BioForma" };
        } else if (normalizedFood.includes("suco") || normalizedFood.includes("refrigerante") || normalizedFood.includes("gatorade") || normalizedFood.includes("cerveja")) {
          basicNutrients = { kcal: 45, p: 0.1, c: 11, f: 0, sodium: 5, fiber: 0.1, potassium: 45, calcium: 2, iron: 0.1, source: "Estimativa Bebidas BioForma" };
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
          source: `Estimativa BioForma (${g}g)`
        }
      });
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
