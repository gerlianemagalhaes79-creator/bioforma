import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc, updateDoc, getDocs } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Trash2, 
  Apple, 
  Droplets, 
  Flame, 
  X, 
  Utensils, 
  Search, 
  Sparkles, 
  Settings, 
  Check, 
  Scale, 
  Globe, 
  TrendingUp, 
  Info, 
  ChevronDown, 
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DietSectionProps {
  user: User;
  profile: any;
}

export default function DietSection({ user, profile }: DietSectionProps) {
  const [diets, setDiets] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [searchingIndex, setSearchingIndex] = useState<number | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // States for goals settings
  const [baseExpenditure, setBaseExpenditure] = useState(profile?.baseExpenditure || 1800);
  const [objective, setObjective] = useState(profile?.objective || 'manutencao');
  const [waterGoal, setWaterGoal] = useState(profile?.dailyWaterGoal || 2500);
  const [calorieGoal, setCalorieGoal] = useState(profile?.dailyCalorieGoal || 2000);
  const [proteinGoal, setProteinGoal] = useState(profile?.proteinGoal || 130);
  const [carbGoal, setCarbGoal] = useState(profile?.carbGoal || 240);
  const [fatGoal, setFatGoal] = useState(profile?.fatGoal || 60);

  // State to track expanded meal cards (to see full micro/macros details)
  const [expandedDietId, setExpandedDietId] = useState<string | null>(null);

  const [newDiet, setNewDiet] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meals: [{ 
      name: '', 
      weight: 100, 
      unit: 'g',
      calories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0,
      sodium: 0,
      fiber: 0,
      potassium: 0,
      calcium: 0,
      iron: 0,
      source: ''
    }],
    waterIntake: 0,
    notes: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'diets'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDiets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user.uid]);

  // Sync settings state when profile loads, but only if the modal is currently closed
  // to prevent overwriting user edits in real-time.
  useEffect(() => {
    if (profile && !showSettingsModal) {
      setBaseExpenditure(profile.baseExpenditure ?? 1800);
      setObjective(profile.objective ?? 'manutencao');
      setWaterGoal(profile.dailyWaterGoal ?? 2500);
      setCalorieGoal(profile.dailyCalorieGoal ?? 2000);
      setProteinGoal(profile.proteinGoal ?? 130);
      setCarbGoal(profile.carbGoal ?? 240);
      setFatGoal(profile.fatGoal ?? 60);
    }
  }, [profile, showSettingsModal]);

  // Sync settings state when the modal opens to make sure we edit the most up-to-date saved values
  useEffect(() => {
    if (showSettingsModal && profile) {
      setBaseExpenditure(profile.baseExpenditure ?? 1800);
      setObjective(profile.objective ?? 'manutencao');
      setWaterGoal(profile.dailyWaterGoal ?? 2500);
      setCalorieGoal(profile.dailyCalorieGoal ?? 2000);
      setProteinGoal(profile.proteinGoal ?? 130);
      setCarbGoal(profile.carbGoal ?? 240);
      setFatGoal(profile.fatGoal ?? 60);
    }
  }, [showSettingsModal]);

  // Calculate targets dynamically inside settings when inputs change
  const handleCalculateDefaultMacros = (expenditure: number, obj: string) => {
    const exp = Number(expenditure) || 1800;
    let targetCals = exp;
    let pPct = 0.25;
    let cPct = 0.50;
    let fPct = 0.25;

    if (obj === 'perda') {
      targetCals = exp - 500;
      pPct = 0.35;
      cPct = 0.40;
      fPct = 0.25;
    } else if (obj === 'ganho') {
      targetCals = exp + 400;
      pPct = 0.30;
      cPct = 0.50;
      fPct = 0.20;
    }

    if (targetCals < 1200) targetCals = 1200; // Safeguard minimum healthy calories

    const computedProt = Math.round((targetCals * pPct) / 4);
    const computedCarb = Math.round((targetCals * cPct) / 4);
    const computedFat = Math.round((targetCals * fPct) / 9);

    return {
      targetCals,
      computedProt,
      computedCarb,
      computedFat
    };
  };

  const handleApplyDefaultCalculations = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const { targetCals, computedProt, computedCarb, computedFat } = handleCalculateDefaultMacros(Number(baseExpenditure), objective);
    setCalorieGoal(targetCals);
    setProteinGoal(computedProt);
    setCarbGoal(computedCarb);
    setFatGoal(computedFat);
  };

  const handleSaveSettings = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        baseExpenditure: Number(baseExpenditure),
        objective,
        dailyWaterGoal: Number(waterGoal),
        dailyCalorieGoal: Number(calorieGoal),
        proteinGoal: Number(proteinGoal),
        carbGoal: Number(carbGoal),
        fatGoal: Number(fatGoal)
      });
      setShowSettingsModal(false);
    } catch (e) {
      console.error("Error saving goals profile:", e);
    }
  };

  const handleAddMeal = () => {
    setNewDiet({
      ...newDiet,
      meals: [...newDiet.meals, { 
        name: '', 
        weight: 100, 
        unit: 'g',
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0,
        sodium: 0,
        fiber: 0,
        potassium: 0,
        calcium: 0,
        iron: 0,
        source: ''
      }]
    });
  };

  const handleRemoveMeal = (idx: number) => {
    const list = [...newDiet.meals];
    const filtered = list.filter((_, i) => i !== idx);
    setNewDiet({
      ...newDiet,
      meals: filtered.length > 0 ? filtered : [{ 
        name: '', 
        weight: 100, 
        unit: 'g',
        calories: 0, 
        protein: 0, 
        carbs: 0, 
        fat: 0,
        sodium: 0,
        fiber: 0,
        potassium: 0,
        calcium: 0,
        iron: 0,
        source: ''
      }]
    });
  };

  const getLocalNutritionEstimate = (foodName: string, g: number) => {
    const normalized = foodName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    // Base nutrition values per 100g
    let base = { kcal: 120, p: 4, c: 15, f: 3, sodium: 50, fiber: 1.2, potassium: 150, calcium: 15, iron: 0.5, name: "Alimento Geral" };

    const db: Record<string, typeof base> = {
      "ovo": { kcal: 155, p: 13, c: 1.1, f: 11, sodium: 124, fiber: 0, potassium: 126, calcium: 50, iron: 1.2, name: "Ovo Cozido" },
      "frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, name: "Peito de Frango Grelhado" },
      "peito de frango": { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, name: "Peito de Frango" },
      "frango grelhado": { kcal: 170, p: 32, c: 0, f: 4.5, sodium: 80, fiber: 0, potassium: 260, calcium: 15, iron: 1.0, name: "Frango Grelhado" },
      "frango cozido": { kcal: 163, p: 31.5, c: 0, f: 3.2, sodium: 70, fiber: 0, potassium: 250, calcium: 15, iron: 1.0, name: "Frango Cozido" },
      "arroz": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, name: "Arroz Branco Cozido" },
      "arroz branco": { kcal: 130, p: 2.7, c: 28, f: 0.3, sodium: 1, fiber: 0.4, potassium: 35, calcium: 10, iron: 0.2, name: "Arroz Branco" },
      "arroz integral": { kcal: 111, p: 2.6, c: 23, f: 0.9, sodium: 1, fiber: 1.8, potassium: 43, calcium: 10, iron: 0.4, name: "Arroz Integral" },
      "feijao": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, name: "Feijão Cozido" },
      "feijao carioca": { kcal: 90, p: 5, c: 16, f: 0.5, sodium: 2, fiber: 6.4, potassium: 355, calcium: 35, iron: 1.5, name: "Feijão Carioca" },
      "feijao preto": { kcal: 91, p: 6, c: 14, f: 0.5, sodium: 2, fiber: 7.0, potassium: 350, calcium: 30, iron: 1.5, name: "Feijão Preto" },
      "banana": { kcal: 89, p: 1.1, c: 23, f: 0.3, sodium: 1, fiber: 2.6, potassium: 358, calcium: 5, iron: 0.3, name: "Banana" },
      "maca": { kcal: 52, p: 0.3, c: 14, f: 0.2, sodium: 1, fiber: 2.4, potassium: 107, calcium: 6, iron: 0.1, name: "Maçã" },
      "aveia": { kcal: 389, p: 16.9, c: 66, f: 6.9, sodium: 2, fiber: 10.6, potassium: 429, calcium: 54, iron: 4.7, name: "Aveia em Flocos" },
      "leite": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, name: "Leite Integral" },
      "leite integral": { kcal: 60, p: 3.2, c: 4.8, f: 3.2, sodium: 44, fiber: 0, potassium: 150, calcium: 120, iron: 0.1, name: "Leite Integral" },
      "leite desnatado": { kcal: 35, p: 3.2, c: 5, f: 0.1, sodium: 45, fiber: 0, potassium: 150, calcium: 122, iron: 0.1, name: "Leite Desnatado" },
      "whey": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, name: "Whey Protein" },
      "whey protein": { kcal: 380, p: 80, c: 6, f: 4, sodium: 160, fiber: 0, potassium: 180, calcium: 400, iron: 0.5, name: "Whey Protein" },
      "creatina": { kcal: 0, p: 0, c: 0, f: 0, sodium: 0, fiber: 0, potassium: 0, calcium: 0, iron: 0, name: "Creatina" },
      "pao": { kcal: 265, p: 9, c: 49, f: 3.2, sodium: 490, fiber: 2.7, potassium: 115, calcium: 260, iron: 3.6, name: "Pão de Forma" },
      "pao frances": { kcal: 300, p: 8, c: 58, f: 3, sodium: 640, fiber: 2.3, potassium: 110, calcium: 20, iron: 1.0, name: "Pão Francês" },
      "carne": { kcal: 250, p: 26, c: 0, f: 15, sodium: 60, fiber: 0, potassium: 318, calcium: 18, iron: 2.6, name: "Carne Vermelha" },
      "patinho": { kcal: 140, p: 21, c: 0, f: 5, sodium: 55, fiber: 0, potassium: 330, calcium: 10, iron: 2.5, name: "Carne Patinho" },
      "alcatra": { kcal: 160, p: 22, c: 0, f: 7, sodium: 52, fiber: 0, potassium: 310, calcium: 10, iron: 2.3, name: "Carne Alcatra" },
      "batata": { kcal: 86, p: 2, c: 20, f: 0.1, sodium: 6, fiber: 1.8, potassium: 320, calcium: 12, iron: 0.3, name: "Batata Inglesa" },
      "batata doce": { kcal: 86, p: 1.3, c: 20, f: 0.1, sodium: 30, fiber: 3, potassium: 337, calcium: 30, iron: 0.6, name: "Batata Doce" },
      "salmao": { kcal: 208, p: 20, c: 0, f: 13, sodium: 59, fiber: 0, potassium: 363, calcium: 9, iron: 0.3, name: "Salmão" },
      "azeite": { kcal: 884, p: 0, f: 100, c: 0, sodium: 2, fiber: 0, potassium: 1, calcium: 1, iron: 0.2, name: "Azeite de Oliva" },
      "queijo": { kcal: 350, p: 23, c: 2.3, f: 28, sodium: 620, fiber: 0, potassium: 80, calcium: 700, iron: 0.4, name: "Queijo Mussarela" },
      "manteiga": { kcal: 717, p: 0.8, c: 0.1, f: 81, sodium: 576, fiber: 0, potassium: 24, calcium: 24, iron: 0.1, name: "Manteiga" },
      "mandioca": { kcal: 125, p: 0.6, c: 30, f: 0.3, sodium: 1, fiber: 1.6, potassium: 271, calcium: 19, iron: 0.3, name: "Mandioca Cozida" },
      "iogurte": { kcal: 60, p: 3.5, c: 5, f: 3, sodium: 50, fiber: 0, potassium: 140, calcium: 120, iron: 0.1, name: "Iogurte Natural" },
      "castanha": { kcal: 650, p: 15, c: 15, f: 60, sodium: 3, fiber: 6, potassium: 660, calcium: 110, iron: 6.0, name: "Castanhas" },
      "tomate": { kcal: 18, p: 0.9, c: 3.9, f: 0.2, sodium: 5, fiber: 1.2, potassium: 237, calcium: 10, iron: 0.3, name: "Tomate" },
      "alface": { kcal: 15, p: 1.3, c: 2.8, f: 0.2, sodium: 10, fiber: 1.3, potassium: 194, calcium: 36, iron: 0.8, name: "Alface" },
      "tapioca": { kcal: 350, p: 0, c: 87, f: 0, sodium: 2, fiber: 0, potassium: 10, calcium: 10, iron: 0.1, name: "Tapioca (Goma)" },
      "cafe": { kcal: 2, p: 0.1, c: 0, f: 0, sodium: 2, fiber: 0, potassium: 49, calcium: 2, iron: 0, name: "Café sem Açúcar" },
      "agua": { kcal: 0, p: 0, c: 0, f: 0, sodium: 5, fiber: 0, potassium: 1, calcium: 3, iron: 0, name: "Água Mineral" },
      "pasta de amendoim": { kcal: 588, p: 25, c: 20, f: 50, sodium: 10, fiber: 6, potassium: 649, calcium: 43, iron: 1.9, name: "Pasta de Amendoim" },
      "suco de laranja": { kcal: 45, p: 0.7, c: 10.4, f: 0.2, sodium: 1, fiber: 0.2, potassium: 200, calcium: 11, iron: 0.2, name: "Suco de Laranja" },
      "mamao": { kcal: 43, p: 0.5, c: 11, f: 0.3, sodium: 8, fiber: 1.7, potassium: 182, calcium: 20, iron: 0.3, name: "Mamão Papaia" },
      "morango": { kcal: 32, p: 0.7, c: 7.7, f: 0.3, sodium: 1, fiber: 2, potassium: 153, calcium: 16, iron: 0.4, name: "Morango" },
      "pipoca": { kcal: 387, p: 12, c: 78, f: 4.5, sodium: 8, fiber: 14, potassium: 329, calcium: 7, iron: 3.1, name: "Pipoca" },
      "doce de leite": { kcal: 315, p: 6, c: 55, f: 7, sodium: 130, fiber: 0, potassium: 250, calcium: 200, iron: 0.1, name: "Doce de Leite" },
      "chocolate": { kcal: 546, p: 4.9, c: 61, f: 31, sodium: 24, fiber: 7, potassium: 372, calcium: 56, iron: 8.0, name: "Chocolate" },
      "coca cola": { kcal: 42, p: 0, c: 10, f: 0, sodium: 4, fiber: 0, potassium: 2, calcium: 2, iron: 0, name: "Coca Cola" },
      "refrigerante": { kcal: 42, p: 0, c: 10.4, f: 0, sodium: 5, fiber: 0, potassium: 2, calcium: 2, iron: 0, name: "Refrigerante" },
      "cerveja": { kcal: 43, p: 0.5, c: 3.6, f: 0, sodium: 4, fiber: 0, potassium: 27, calcium: 4, iron: 0, name: "Cerveja" },
      "vinho": { kcal: 85, p: 0.1, c: 2.6, f: 0, sodium: 4, fiber: 0, potassium: 127, calcium: 8, iron: 0.5, name: "Vinho" },
      "suco": { kcal: 40, p: 0.5, c: 10, f: 0.1, sodium: 2, fiber: 0.5, potassium: 120, calcium: 10, iron: 0.1, name: "Suco Natural" },
      "mel": { kcal: 304, p: 0.3, c: 82, f: 0, sodium: 4, fiber: 0, potassium: 52, calcium: 6, iron: 0.4, name: "Mel" }
    };

    // Find custom match
    let matchedKey = "";
    for (const key of Object.keys(db)) {
      if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      base = db[matchedKey];
    } else {
      // Heuristic analyzers based on words for high accuracy in case of custom terms
      if (normalized.includes("frango") || normalized.includes("chicken") || normalized.includes("peru") || normalized.includes("ave") || normalized.includes("peito")) {
        base = { kcal: 165, p: 31, c: 0, f: 3.6, sodium: 74, fiber: 0, potassium: 256, calcium: 15, iron: 1.0, name: "Aves" };
      } else if (normalized.includes("boi") || normalized.includes("vaca") || normalized.includes("carne") || normalized.includes("patinho") || normalized.includes("mignon") || normalized.includes("alcatra") || normalized.includes("picanha") || normalized.includes("churrasco") || normalized.includes("bife")) {
        base = { kcal: 200, p: 26, c: 0, f: 10, sodium: 65, fiber: 0, potassium: 315, calcium: 15, iron: 2.5, name: "Carne Bovina" };
      } else if (normalized.includes("peixe") || normalized.includes("pargo") || normalized.includes("pescada") || normalized.includes("atum") || normalized.includes("sardinha") || normalized.includes("tilapia") || normalized.includes("merluza")) {
        base = { kcal: 130, p: 22, c: 0, f: 4.5, sodium: 70, fiber: 0, potassium: 350, calcium: 20, iron: 0.8, name: "Pescados" };
      } else if (normalized.includes("queijo") || normalized.includes("cheese") || normalized.includes("mussarela") || normalized.includes("ricota") || normalized.includes("requeijao") || normalized.includes("requeijão") || normalized.includes("cream")) {
        base = { kcal: 320, p: 22, c: 2.5, f: 25, sodium: 550, fiber: 0, potassium: 85, calcium: 600, iron: 0.3, name: "Queijos" };
      } else if (normalized.includes("leite") || normalized.includes("iogurte") || normalized.includes("coalhada")) {
        base = { kcal: 55, p: 3.2, c: 4.8, f: 2.5, sodium: 45, fiber: 0, potassium: 145, calcium: 115, iron: 0.1, name: "Laticínios" };
      } else if (normalized.includes("pao") || normalized.includes("pão") || normalized.includes("torrada") || normalized.includes("biscoito") || normalized.includes("bolacha") || normalized.includes("croissant")) {
        base = { kcal: 270, p: 8.5, c: 52, f: 3.5, sodium: 500, fiber: 2.5, potassium: 120, calcium: 25, iron: 1.5, name: "Panificados" };
      } else if (normalized.includes("arroz") || normalized.includes("massa") || normalized.includes("macarrao") || normalized.includes("macarrão") || normalized.includes("pasta") || normalized.includes("miojo") || normalized.includes("lasanha")) {
        base = { kcal: 135, p: 2.8, c: 29, f: 0.4, sodium: 2, fiber: 0.6, potassium: 40, calcium: 10, iron: 0.3, name: "Cereais e Massas" };
      } else if (normalized.includes("doce") || normalized.includes("açucar") || normalized.includes("açúcar") || normalized.includes("chocolate") || normalized.includes("bala") || normalized.includes("pirulito") || normalized.includes("sobremesa") || normalized.includes("sorvete")) {
        base = { kcal: 380, p: 2, c: 68, f: 12, sodium: 60, fiber: 0.5, potassium: 110, calcium: 40, iron: 1.0, name: "Doces e Sobremesas" };
      } else if (normalized.includes("azeite") || normalized.includes("oleo") || normalized.includes("óleo") || normalized.includes("manteiga") || normalized.includes("gordura") || normalized.includes("banha")) {
        base = { kcal: 850, p: 0.2, c: 0.2, f: 95, sodium: 5, fiber: 0, potassium: 5, calcium: 5, iron: 0.1, name: "Lipídios" };
      } else if (normalized.includes("suco") || normalized.includes("refri") || normalized.includes("refrigerante") || normalized.includes("nectar")) {
        base = { kcal: 45, p: 0.3, c: 11, f: 0, sodium: 4, fiber: 0.1, potassium: 100, calcium: 8, iron: 0.1, name: "Bebidas Açucaradas" };
      } else if (normalized.includes("alface") || normalized.includes("salada") || normalized.includes("folha") || normalized.includes("couve") || normalized.includes("brocolis") || normalized.includes("brócolis") || normalized.includes("legume") || normalized.includes("vegetal") || normalized.includes("tomate")) {
        base = { kcal: 22, p: 1.2, c: 4.5, f: 0.2, sodium: 10, fiber: 1.8, potassium: 210, calcium: 24, iron: 0.5, name: "Hortaliças e Legumes" };
      } else if (normalized.includes("banana") || normalized.includes("maca") || normalized.includes("maçã") || normalized.includes("fruta") || normalized.includes("uva") || normalized.includes("mamao") || normalized.includes("mamão") || normalized.includes("morango") || normalized.includes("laranja") || normalized.includes("abacaxi")) {
        base = { kcal: 55, p: 0.6, c: 13.5, f: 0.2, sodium: 2, fiber: 2.1, potassium: 160, calcium: 12, iron: 0.2, name: "Frutas Frescas" };
      } else if (normalized.includes("whey") || normalized.includes("proteina") || normalized.includes("proteína") || normalized.includes("albumina") || normalized.includes("creatina")) {
        base = { kcal: 380, p: 78, c: 7, f: 4, sodium: 155, fiber: 0, potassium: 175, calcium: 380, iron: 0.5, name: "Suplementos" };
      }
    }

    const factor = g / 100;
    return {
      calories: Math.round(base.kcal * factor),
      protein: parseFloat((base.p * factor).toFixed(1)),
      carbs: parseFloat((base.c * factor).toFixed(1)),
      fat: parseFloat((base.f * factor).toFixed(1)),
      sodium: Math.round(base.sodium * factor),
      fiber: parseFloat((base.fiber * factor).toFixed(1)),
      potassium: Math.round(base.potassium * factor),
      calcium: Math.round(base.calcium * factor),
      iron: parseFloat((base.iron * factor).toFixed(1)),
      source: `Tabela Oficial Local (${base.name})`
    };
  };

  // Perform AI nutrition search with web grounding on our server proxy
  const handleSearchNutrition = async (index: number) => {
    const meal = newDiet.meals[index];
    if (!meal.name.trim()) return;
    const gWeight = Number(meal.weight) || 100;
    
    setSearchingIndex(index);
    let success = false;
    
    try {
      let apiOrigin = window.location.origin;
      if (!apiOrigin || apiOrigin.startsWith('file') || !apiOrigin.startsWith('http')) {
        apiOrigin = window.location.protocol + "//" + window.location.host;
      }
      const apiEndpoint = `${apiOrigin.replace(/\/+$/, '')}/api/nutrition`;

      // Strategy A: Try the relative origin server endpoint first
      let resp: Response | null = null;
      try {
        resp = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodName: meal.name, weight: gWeight })
        });
      } catch (localErr) {
        console.warn("Plano A (Servidor Local) indisponível. Tentando do gateway central do Cloud Run...", localErr);
      }

      // Strategy B: If the local origin is not found (404), fails, or is blocked, query our central Cloud Run wrapper container
      if (!resp || !resp.ok) {
        const fallbackGateway = "https://ais-pre-rz7vogl2ggltgsdykljdyj-273227904733.us-east1.run.app/api/nutrition";
        try {
          resp = await fetch(fallbackGateway, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ foodName: meal.name, weight: gWeight })
          });
        } catch (gatewayErr) {
          console.warn("Plano B (Gateway Cloud Run) também falhou. Entrando em modo Offline inteligente...", gatewayErr);
        }
      }
      
      if (resp && resp.ok) {
        const resData = await resp.json();
        if (resData.success && resData.data) {
          const nutData = resData.data;
          const updatedMeals = [...newDiet.meals];
          updatedMeals[index] = {
            ...updatedMeals[index],
            calories: Math.round(nutData.calories || 0),
            protein: parseFloat((nutData.protein || 0).toFixed(1)),
            carbs: parseFloat((nutData.carbs || 0).toFixed(1)),
            fat: parseFloat((nutData.fat || 0).toFixed(1)),
            sodium: Math.round(nutData.sodium || 0),
            fiber: parseFloat((nutData.fiber || 0).toFixed(1)),
            potassium: Math.round(nutData.potassium || 0),
            calcium: Math.round(nutData.calcium || 0),
            iron: parseFloat((nutData.iron || 0).toFixed(1)),
            source: nutData.source || "Grounded Web Search"
          };
          setNewDiet({
            ...newDiet,
            meals: updatedMeals
          });
          success = true;
        }
      }
    } catch (e) {
      console.warn("API de nutrição total falhou. Ativando estimador local inteligente...", e);
    }

    if (!success) {
      try {
        const nutData = getLocalNutritionEstimate(meal.name, gWeight);
        const updatedMeals = [...newDiet.meals];
        updatedMeals[index] = {
          ...updatedMeals[index],
          calories: Math.round(nutData.calories || 0),
          protein: parseFloat((nutData.protein || 0).toFixed(1)),
          carbs: parseFloat((nutData.carbs || 0).toFixed(1)),
          fat: parseFloat((nutData.fat || 0).toFixed(1)),
          sodium: Math.round(nutData.sodium || 0),
          fiber: parseFloat((nutData.fiber || 0).toFixed(1)),
          potassium: Math.round(nutData.potassium || 0),
          calcium: Math.round(nutData.calcium || 0),
          iron: parseFloat((nutData.iron || 0).toFixed(1)),
          source: `${nutData.source} (Offline Fallback)`
        };
        setNewDiet({
          ...newDiet,
          meals: updatedMeals
        });
      } catch (err) {
        console.error("Erro no estimador offline:", err);
      } finally {
        setSearchingIndex(null);
      }
    } else {
      setSearchingIndex(null);
    }
  };

  const handleSaveDiet = async () => {
    try {
      await addDoc(collection(db, 'diets'), {
        ...newDiet,
        uid: user.uid
      });
      
      const targetWater = profile?.dailyWaterGoal || 2500;
      await addDoc(collection(db, 'checkins'), {
        uid: user.uid,
        date: newDiet.date,
        dietOnTrack: true,
        waterGoalMet: newDiet.waterIntake >= targetWater
      });

      setShowAddModal(false);
      setNewDiet({
        date: format(new Date(), 'yyyy-MM-dd'),
        meals: [{ 
          name: '', 
          weight: 100, 
          unit: 'g',
          calories: 0, 
          protein: 0, 
          carbs: 0, 
          fat: 0,
          sodium: 0,
          fiber: 0,
          potassium: 0,
          calcium: 0,
          iron: 0,
          source: ''
        }],
        waterIntake: 0,
        notes: ''
      });
    } catch (e) {
      console.error("Erro ao salvar diário de dieta:", e);
    }
  };

  const handleDeleteDiet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'diets', id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuickAddWater = async () => {
    try {
      const existingDiet = diets.find(d => d.date === selectedDate);
      const targetWater = profile?.dailyWaterGoal || 2500;
      let newWaterTotal = 150;

      if (existingDiet) {
        newWaterTotal = (existingDiet.waterIntake || 0) + 150;
        const dietRef = doc(db, 'diets', existingDiet.id);
        await updateDoc(dietRef, {
          waterIntake: newWaterTotal
        });
      } else {
        const minimalDiet = {
          date: selectedDate,
          meals: [],
          waterIntake: 150,
          notes: '',
          uid: user.uid
        };
        await addDoc(collection(db, 'diets'), minimalDiet);
      }

      // Sync with checkins Collection
      const checkinQuery = query(
        collection(db, 'checkins'),
        where('uid', '==', user.uid),
        where('date', '==', selectedDate)
      );
      const checkinSnap = await getDocs(checkinQuery);
      if (!checkinSnap.empty) {
        const firstCheckinId = checkinSnap.docs[0].id;
        const checkinRef = doc(db, 'checkins', firstCheckinId);
        await updateDoc(checkinRef, {
          waterGoalMet: newWaterTotal >= targetWater
        });
      } else {
        await addDoc(collection(db, 'checkins'), {
          uid: user.uid,
          date: selectedDate,
          dietOnTrack: true,
          waterGoalMet: newWaterTotal >= targetWater
        });
      }
    } catch (err) {
      console.error("Erro ao registrar água de forma rápida:", err);
    }
  };

  const toggleExpandDiet = (id: string) => {
    setExpandedDietId(expandedDietId === id ? null : id);
  };

  // Get objective label in Portuguese
  const getObjectiveLabel = (obj: string) => {
    switch(obj) {
      case 'perda': return 'Perda de Peso';
      case 'ganho': return 'Ganho de Massa';
      default: return 'Manutenção';
    }
  };

  // Find all diet entries for the selected date
  const selectedDateDiets = diets.filter(d => d.date === selectedDate);

  // Sum up actuals for the selected date
  const selectedTotalCals = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.calories || 0), 0), 0
  );
  const selectedTotalProt = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.protein || 0), 0), 0
  );
  const selectedTotalCarbs = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.carbs || 0), 0), 0
  );
  const selectedTotalFat = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.fat || 0), 0), 0
  );
  const selectedTotalWater = selectedDateDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0);

  // Micronutrients for the selected date
  const selectedTotalSodium = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.sodium || 0), 0), 0
  );
  const selectedTotalFiber = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.fiber || 0), 0), 0
  );
  const selectedTotalPotassium = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.potassium || 0), 0), 0
  );
  const selectedTotalCalcium = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.calcium || 0), 0), 0
  );
  const selectedTotalIron = selectedDateDiets.reduce((acc, d) => 
    acc + d.meals.reduce((mAcc: number, m: any) => mAcc + (m.iron || 0), 0), 0
  );

  const calorieTarget = profile?.dailyCalorieGoal || 2000;
  const caloriePct = calorieTarget > 0 ? Math.min(100, Math.round((selectedTotalCals / calorieTarget) * 100)) : 0;

  const waterTarget = profile?.dailyWaterGoal || 2500;
  const waterPct = waterTarget > 0 ? Math.min(100, Math.round((selectedTotalWater / waterTarget) * 100)) : 0;

  const proteinTarget = profile?.proteinGoal || 130;
  const proteinPct = proteinTarget > 0 ? Math.min(100, Math.round((selectedTotalProt / proteinTarget) * 100)) : 0;

  const carbTarget = profile?.carbGoal || 240;
  const carbPct = carbTarget > 0 ? Math.min(100, Math.round((selectedTotalCarbs / carbTarget) * 100)) : 0;

  const fatTarget = profile?.fatGoal || 60;
  const fatPct = fatTarget > 0 ? Math.min(100, Math.round((selectedTotalFat / fatTarget) * 100)) : 0;

  // Calendar logic helpers
  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };
  
  const handleGoToToday = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setSelectedDate(todayStr);
    setCalendarMonth(new Date());
  };

  const datesWithLogs = new Set<string>();
  diets.forEach((d) => {
    if (d.date) {
      datesWithLogs.add(d.date);
    }
  });

  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday = 0
  
  const calendarCells: (Date | null)[] = [];
  // Padded cells before the 1st
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(new Date(year, month, day));
  }

  const weekdayInitials = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthYearLabel = format(calendarMonth, 'MMMM yyyy', { locale: ptBR });
  const capitalizedLabel = monthYearLabel.charAt(0).toUpperCase() + monthYearLabel.slice(1);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-800">
      
      {/* HEADER SECTION & PROFILE SETTINGS TRIGGERS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-800">
            Minha <span className="text-pink-500">Dieta</span>
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] mt-1.5 flex items-center gap-1.5">
            <Globe size={11} className="text-sky-400" /> Alimentado com consulta via Inteligência Artificial
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="w-11 h-11 rounded-xl bg-white border border-pink-100 flex items-center justify-center text-zinc-650 hover:bg-pink-50/50 shadow-sm transition-all cursor-pointer"
            title="Ajustar Metas Nutritivas"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* QUICK ACTIONS GRID */}
      <div className="flex flex-col gap-4">
        {/* QUICK DIET LOG CARD */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-pink-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-base">
              <Utensils size={26} className="text-white fill-white/10" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-pink-100">Registrar Refeição</h3>
              <p className="text-xl font-black italic tracking-tighter mt-0.5">
                {selectedTotalCals} <span className="text-xs font-normal not-italic text-pink-150 uppercase font-extrabold pb-0.5">kcal registradas {selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'hoje' : 'neste dia'}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setNewDiet(prev => ({ ...prev, date: selectedDate }));
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-pink-50 active:scale-95 text-pink-600 font-extrabold uppercase text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Adicionar Dieta</span>
          </button>
        </div>

        {/* QUICK WATER LOG CARD */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-500 p-6 rounded-[2rem] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-sky-500/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-base">
              <Droplets size={26} className="text-white fill-white/10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-sky-100">Registrar Consumo de Água</h3>
              <p className="text-xl font-black italic tracking-tighter mt-0.5">
                {selectedTotalWater} <span className="text-xs font-normal not-italic text-sky-100 uppercase font-extrabold pb-0.5">ml registrados {selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'hoje' : 'neste dia'}</span>
              </p>
            </div>
          </div>
          
          <button
            onClick={handleQuickAddWater}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-sky-50 active:scale-95 text-sky-600 font-extrabold uppercase text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Adicionar +150ml</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* DAY SELECTION TITLE & COLLAPSIBLE CALENDAR TOGGLE */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white border border-pink-50/40 p-4 rounded-2xl shadow-sm">
            <button 
              type="button"
              onClick={() => setShowCalendar(prev => !prev)}
              className="text-xs font-black uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5 hover:text-pink-500 transition-colors cursor-pointer border-0"
            >
              <Calendar size={14} className="text-pink-500" /> 
              {showCalendar ? 'Ocultar Calendário ✕' : 'Escolher Outro Dia 📅'}
            </button>
            <div className="text-xs font-black text-pink-600 bg-pink-50/55 px-3 py-1.5 rounded-xl uppercase italic font-mono">
              {format(new Date(selectedDate + 'T00:00:00'), "dd/MM/yyyy")}
            </div>
          </div>

          {/* COLLAPSIBLE CALENDAR */}
          <AnimatePresence>
            {showCalendar && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-gradient-to-br from-white to-[#fffbfd] p-6 rounded-[2rem] border border-pink-100/95 shadow-md shadow-pink-100/10 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black uppercase text-zinc-800">Histórico de Dieta</h3>
                    <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Selecione uma data para ler as refeições</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      handleGoToToday();
                      setShowCalendar(false);
                    }}
                    className="text-[9px] font-black uppercase bg-pink-50 hover:bg-pink-100 px-3 py-1.5 rounded-xl text-pink-500 border border-pink-100 transition-all cursor-pointer border-0"
                    title="Voltar para a data de hoje"
                  >
                    Hoje
                  </button>
                </div>

                {/* MONTH SWITCHER BAR */}
                <div className="flex items-center justify-between bg-white border border-pink-50 p-2 rounded-2xl shadow-sm">
                  <button 
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-xl bg-pink-50/50 hover:bg-pink-50 flex items-center justify-center text-pink-500 active:scale-95 transition-all cursor-pointer border-0"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>

                  <div className="text-xs font-black uppercase tracking-tight text-zinc-700">
                    {capitalizedLabel}
                  </div>

                  <button 
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-xl bg-pink-50/50 hover:bg-pink-50 flex items-center justify-center text-pink-500 active:scale-95 transition-all cursor-pointer border-0"
                  >
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* THE MONTH CALENDAR GRID */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs select-none">
                  {weekdayInitials.map((initial, i) => (
                    <div key={i} className="text-zinc-400 py-1 text-[10px] uppercase font-black tracking-wider">
                      {initial}
                    </div>
                  ))}
                  
                  {calendarCells.map((dateObj, idx) => {
                    if (!dateObj) {
                      return <div key={`empty-${idx}`} className="aspect-square animate-fade-in" />;
                    }
                    
                    const dateStr = formatDateString(dateObj);
                    const isSelected = dateStr === selectedDate;
                    const hasLog = datesWithLogs.has(dateStr);
                    const isTodayCell = dateStr === format(new Date(), 'yyyy-MM-dd');
                    
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowCalendar(false);
                        }}
                        className={`aspect-square w-full rounded-full flex flex-col items-center justify-center relative text-xs font-black transition-all cursor-pointer animate-fade-in border-0 ${
                          isSelected 
                            ? 'bg-pink-500 text-white shadow-sm shadow-pink-500/30 font-black scale-102' 
                            : isTodayCell 
                              ? 'border border-pink-400 text-pink-500 bg-pink-50/20'
                              : hasLog
                                ? 'text-zinc-800 bg-pink-50/40 hover:bg-pink-50/70 border border-pink-100/50'
                                : 'text-zinc-650 hover:bg-zinc-100/80'
                        }`}
                      >
                        <span>{dateObj.getDate()}</span>
                        {hasLog && !isSelected && (
                          <span className={`w-1 h-1 rounded-full absolute bottom-1 ${
                            isTodayCell ? 'bg-pink-400' : 'bg-pink-500'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* MINI COMPLIANCE LEGEND */}
                <div className="border-t border-pink-50/50 pt-3 flex items-center justify-between text-[8px] uppercase tracking-wider font-extrabold text-zinc-400">
                  <div className="flex items-center gap-1 animate-fade-in">
                    <span className="w-2 h-2 rounded-full border border-pink-100 bg-pink-50/40"></span>
                    <span>Dia Registrado</span>
                  </div>
                  <div className="flex items-center gap-1 animate-fade-in">
                    <span className="w-2 h-2 rounded-full border border-pink-400 bg-pink-50/20"></span>
                    <span>Hoje</span>
                  </div>
                  <div className="flex items-center gap-1 animate-fade-in">
                    <span className="w-3 h-3 rounded-full bg-pink-500"></span>
                    <span>Selecionado</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          {/* SELECTED DATE DIET DIARY */}
          <div className="space-y-4">
            {selectedDateDiets.length === 0 ? (
              <div className="py-12 px-6 bg-white border border-dashed border-pink-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-400 mb-3 animate-pulse">
                  <Utensils size={24} />
                </div>
                <h4 className="text-sm font-bold uppercase italic text-zinc-700">Nenhum registro para este dia</h4>
                <p className="text-xs text-zinc-400 max-w-[280px] mt-1 mb-4">
                  Registre o que comeu {selectedDate === format(new Date(), 'yyyy-MM-dd') ? 'hoje' : 'nesta data'} para rastrear seus macros e calorias estimadas via IA!
                </p>
                <button
                  onClick={() => {
                    setNewDiet(prev => ({ ...prev, date: selectedDate }));
                    setShowAddModal(true);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-102 active:scale-98 transition-all text-white font-extrabold uppercase text-xs rounded-xl shadow-md shadow-pink-300/20 cursor-pointer"
                >
                  Registrar Alimentação
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDateDiets.map((diet) => {
                  const totalCals = diet.meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
                  const totalProt = diet.meals.reduce((acc: number, m: any) => acc + (m.protein || 0), 0);
                  const totalCarbs = diet.meals.reduce((acc: number, m: any) => acc + (m.carbs || 0), 0);
                  const totalFat = diet.meals.reduce((acc: number, m: any) => acc + (m.fat || 0), 0);

                  // Micros aggregation
                  const totalSodium = diet.meals.reduce((acc: number, m: any) => acc + (m.sodium || 0), 0);
                  const totalFiber = diet.meals.reduce((acc: number, m: any) => acc + (m.fiber || 0), 0);
                  const totalPotassium = diet.meals.reduce((acc: number, m: any) => acc + (m.potassium || 0), 0);
                  const totalCalcium = diet.meals.reduce((acc: number, m: any) => acc + (m.calcium || 0), 0);
                  const totalIron = diet.meals.reduce((acc: number, m: any) => acc + (m.iron || 0), 0);

                  const isExpanded = expandedDietId === diet.id;

                  return (
                    <motion.div 
                      layout
                      key={diet.id}
                      onClick={() => toggleExpandDiet(diet.id)}
                      className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 cursor-pointer hover:border-pink-300 transition-all"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                            <Utensils size={20} />
                          </div>
                          <div>
                            <div className="text-lg font-black italic uppercase leading-tight text-zinc-800">
                              {totalCals} <span className="text-xs font-normal not-italic text-zinc-400">kcal</span>
                            </div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37]">
                              {format(new Date(diet.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-sky-500 bg-sky-50 px-2.5 py-1 rounded-full">
                            <Droplets size={12} />
                            <span className="text-[10px] font-extrabold">{diet.waterIntake}ml</span>
                          </div>
                          <button 
                            onClick={(e) => handleDeleteDiet(diet.id, e)}
                            className="text-rose-300 hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                            title="Remover Log"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Summary row always visible */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 pt-1 border-t border-pink-50 text-[10px] uppercase font-black tracking-tight text-zinc-500">
                        <span className="text-[#d4af37]">{totalProt.toFixed(1)}g Prot</span>
                        <span>{totalCarbs.toFixed(1)}g Carb</span>
                        <span className="text-pink-500">{totalFat.toFixed(1)}g Gord</span>
                        {totalFiber > 0 && <span className="text-emerald-500 font-bold">{totalFiber.toFixed(1)}g Fibras</span>}
                      </div>

                      {/* Expanded Items & Micro Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden space-y-4 pt-3 border-t border-pink-50"
                          >
                            <div>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-2">Refeições Logadas</span>
                              <div className="space-y-2">
                                {diet.meals.map((meal: any, i: number) => (
                                  <div key={i} className="bg-pink-50/20 rounded-xl p-3 border border-pink-50/40 space-y-1 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold text-zinc-700">
                                        {meal.name} <span className="text-[10px] font-normal text-zinc-400 font-mono font-bold">({meal.weight || 100}{meal.unit || 'g'})</span>
                                      </span>
                                      <div className="flex gap-2 text-[10px] font-extrabold italic uppercase text-pink-500">
                                        <span>{meal.calories} kcal</span>
                                        <span className="text-[#d4af37]">{meal.protein}g P</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-zinc-400 font-bold">
                                      <span>C: {meal.carbs || 0}g</span>
                                      <span>G: {meal.fat || 0}g</span>
                                      {(meal.fiber > 0) && <span>Fibra: {meal.fiber}g</span>}
                                      {(meal.sodium > 0) && <span>Sódio: {meal.sodium}mg</span>}
                                      {meal.source && (
                                        <span className="text-[8px] bg-pink-100/50 text-pink-600 px-1.5 py-0.2 rounded font-mono font-bold">
                                          {meal.source.substring(0, 30)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Accumulated nutrient analysis */}
                            <div className="bg-[#fffdfd] p-4 rounded-2xl border border-pink-100 flex flex-col gap-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[#d4af37] flex items-center gap-1">
                                <Sparkles size={11} /> Micronutrientes Consolidados do Dia
                              </span>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-3 text-xs font-semibold text-zinc-600 mt-1">
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase font-bold text-zinc-400">Fibra</span>
                                  <span className="font-extrabold text-zinc-700">{totalFiber.toFixed(1)}g</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase font-bold text-zinc-400">Sódio</span>
                                  <span className="font-extrabold text-zinc-700">{totalSodium}mg</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase font-bold text-zinc-400">Potássio</span>
                                  <span className="font-extrabold text-zinc-700">{totalPotassium}mg</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase font-bold text-zinc-400">Cálcio</span>
                                  <span className="font-extrabold text-zinc-700">{totalCalcium}mg</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] uppercase font-bold text-zinc-400">Ferro</span>
                                  <span className="font-extrabold text-zinc-700">{totalIron.toFixed(1)}mg</span>
                                </div>
                              </div>
                            </div>

                            {diet.notes && (
                              <div className="text-[11px] bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 text-zinc-600">
                                <strong>Obs:</strong> {diet.notes}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      {/* METAS SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          >
            <motion.div 
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 max-h-[90vh] overflow-y-auto text-zinc-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-850">Ajustar Metas</h3>
                <button 
                  onClick={() => setShowSettingsModal(false)} 
                  className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Gasto Calórico Base (kcal)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold"
                    value={baseExpenditure || ''}
                    onChange={(e) => setBaseExpenditure(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Objetivo</label>
                  <select 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold cursor-pointer focus:ring-2 focus:ring-pink-300 focus:outline-none"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                  >
                    <option value="perda">📉 Perda de Peso (Déficit Calórico)</option>
                    <option value="manutencao">⚖️ Manutenção de Peso</option>
                    <option value="ganho">📈 Ganho de Massa (Superávit Calórico)</option>
                  </select>
                </div>

                <div className="bg-pink-50/40 p-3 rounded-2xl border border-pink-100/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-pink-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Macros e Calorias Inteligentes</span>
                  </div>
                  <button 
                    onClick={handleApplyDefaultCalculations}
                    type="button"
                    className="bg-pink-500 text-white font-extrabold uppercase text-[9px] px-3 py-1.5 rounded-lg hover:bg-pink-600 transition-colors shadow-sm cursor-pointer"
                  >
                    Calcular Metas
                  </button>
                </div>

                <div className="border-t border-pink-50 pt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Calorias (kcal/dia)</label>
                      <input 
                        type="number" 
                        className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold"
                        value={calorieGoal || ''}
                        onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Metas Água (ml/dia)</label>
                      <input 
                        type="number" 
                        className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold"
                        value={waterGoal || ''}
                        onChange={(e) => setWaterGoal(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block border-b border-pink-50 pb-1">
                      Macronutrientes Escolhidos (Gramas)
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-[#d4af37] block mb-1">Proteína</label>
                        <input 
                          type="number" 
                          placeholder="g"
                          className="w-full bg-[#fffafa] border border-[#fce7f3] rounded-xl px-2.5 py-2 text-xs font-black text-center text-zinc-700"
                          value={proteinGoal || ''}
                          onChange={(e) => setProteinGoal(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-pink-500 block mb-1">Carboidrato</label>
                        <input 
                          type="number" 
                          placeholder="g"
                          className="w-full bg-[#fffafa] border border-[#fce7f3] rounded-xl px-2.5 py-2 text-xs font-black text-center text-zinc-700"
                          value={carbGoal || ''}
                          onChange={(e) => setCarbGoal(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-zinc-650 block mb-1">Gordura</label>
                        <input 
                          type="number" 
                          placeholder="g"
                          className="w-full bg-[#fffafa] border border-[#fce7f3] rounded-xl px-2.5 py-2 text-xs font-black text-center text-zinc-700"
                          value={fatGoal || ''}
                          onChange={(e) => setFatGoal(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveSettings}
                  className="w-full mt-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-2xl shadow-lg shadow-pink-200/50 cursor-pointer hover:opacity-95 transition-all text-sm font-black"
                >
                  Salvar Metas Realistas
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD DIET LOG MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 border border-pink-100 max-h-[90vh] overflow-y-auto text-zinc-800"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-855">Adicionar Log Diário</h3>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Estimativa de Calorias com IA</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold"
                      value={newDiet.date}
                      onChange={(e) => setNewDiet({...newDiet, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Água Consumida (ml)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 500"
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold"
                      value={newDiet.waterIntake || ''}
                      onChange={(e) => setNewDiet({...newDiet, waterIntake: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">Alimentos ou Bebidas Ingeridos</label>
                    <span className="text-[10px] font-semibold text-pink-500 italic block">Escolha a unidade (g ou ml)</span>
                  </div>
                  
                  <div className="space-y-4">
                    {newDiet.meals.map((meal, i) => (
                      <div key={i} className="bg-pink-50/10 p-4 rounded-2xl border border-pink-50 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <input 
                              type="text" 
                              placeholder="Nome do Alimento ou Bebida"
                              className="w-full bg-[#fffafa] border border-pink-150 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-805"
                              value={meal.name}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].name = e.target.value;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                          
                          <div className="col-span-2">
                            <input 
                              type="number" 
                              placeholder="Qtd"
                              className="w-full bg-[#fffafa] border border-pink-150 rounded-xl px-1 py-2 text-xs font-bold text-center text-zinc-805"
                              value={meal.weight || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].weight = parseInt(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>

                          <div className="col-span-2">
                            <select
                              className="w-full bg-[#fffafa] border border-pink-150 rounded-xl px-2 py-2 text-xs font-bold text-center text-zinc-805 cursor-pointer focus:outline-none"
                              value={meal.unit || 'g'}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].unit = e.target.value;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            >
                              <option value="g">g</option>
                              <option value="ml">ml</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <button
                              type="button"
                              onClick={() => handleSearchNutrition(i)}
                              className="w-full py-2 bg-gradient-to-r from-sky-500 to-sky-500 hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
                              title="Pesquisar nutrição real e média na internet via IA"
                              disabled={searchingIndex === i}
                            >
                              {searchingIndex === i ? (
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <Globe size={13} className="animate-pulse" />
                              )}
                            </button>
                          </div>

                          <button 
                            type="button"
                            onClick={() => handleRemoveMeal(i)}
                            className="col-span-1 text-rose-450 hover:text-rose-600 cursor-pointer flex justify-center items-center"
                            title="Remover"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Nutritional fields - updated automatically, editable manually */}
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold block mb-1 uppercase">Calorias (kcal)</label>
                            <input 
                              type="number" 
                              className="w-full bg-[#fffafa] border border-pink-100 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-zinc-700"
                              value={meal.calories || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].calories = parseInt(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold block mb-1 uppercase">Proteína (g)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="w-full bg-[#fffafa] border border-pink-100 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-zinc-700 hover:border-pink-300"
                              value={meal.protein || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].protein = parseFloat(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold block mb-1 uppercase">Carb (g)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="w-full bg-[#fffafa] border border-pink-100 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-zinc-700"
                              value={meal.carbs || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].carbs = parseFloat(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-400 font-bold block mb-1 uppercase">Gordura (g)</label>
                            <input 
                              type="number" 
                              step="any"
                              className="w-full bg-[#fffafa] border border-pink-100 rounded-lg px-2 py-1.5 text-xs text-center font-bold text-zinc-700"
                              value={meal.fat || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].fat = parseFloat(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                        </div>

                        {/* Extra section displaying fiber / sodium / source if present */}
                        {meal.source && (
                          <div className="flex items-center justify-between text-[8px] font-bold text-sky-600 bg-sky-50/50 px-2.5 py-1.5 rounded-lg border border-sky-100/40">
                            <span className="flex items-center gap-1"><Info size={10} /> Fibras: {meal.fiber || 0}g | Sódio: {meal.sodium || 0}mg</span>
                            <span className="font-mono">Fonte: {meal.source}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      onClick={handleAddMeal}
                      type="button"
                      className="w-full py-3 border border-dashed border-pink-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-pink-400 hover:border-pink-500 hover:text-pink-500 transition-all cursor-pointer"
                    >
                      + Adicionar Refeição
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Dicas de Suplementação ou Obs (Opcional)</label>
                  <textarea 
                    placeholder="Refeição com Whey, creatina..."
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800"
                    rows={2}
                    value={newDiet.notes}
                    onChange={(e) => setNewDiet({...newDiet, notes: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleSaveDiet}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold uppercase py-4 rounded-2xl shadow-lg shadow-pink-200/50 cursor-pointer text-sm font-black"
                >
                  Confirmar e Salvar Dieta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
