import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc, updateDoc } from '../firebase';
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
  ChevronUp 
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

  // Perform AI nutrition search with web grounding on our server proxy
  const handleSearchNutrition = async (index: number) => {
    const meal = newDiet.meals[index];
    if (!meal.name.trim()) return;
    const gWeight = Number(meal.weight) || 100;
    
    setSearchingIndex(index);
    try {
      const resp = await fetch("/api/nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodName: meal.name, weight: gWeight })
      });
      
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
      }
    } catch (e) {
      console.error("Erro ao pesquisar alimento na internet:", e);
    } finally {
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
          
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-450 flex items-center justify-center text-white shadow-lg shadow-pink-400/25 hover:opacity-95 cursor-pointer"
            title="Logar Refeição"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* METAS CARD (ACTIVE DASHBOARD) */}
      <section className="bg-gradient-to-br from-white to-[#fffafc] p-6 rounded-[2rem] border border-pink-100/80 shadow-sm shadow-pink-100/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600">Minhas Metas Diárias Ativas</h3>
          </div>
          <span className="text-[9px] font-extrabold uppercase bg-pink-50 px-2 py-0.5 rounded-md text-pink-500 border border-pink-100 font-mono">
            {getObjectiveLabel(profile?.objective || 'manutencao')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#fffefe] p-4 rounded-2xl border border-pink-50/50 flex flex-col justify-between">
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Flame size={10} className="text-pink-500" /> Calorias
            </span>
            <div className="mt-1">
              <div className="text-xl font-black italic tracking-tighter text-zinc-800">{profile?.dailyCalorieGoal || 2000}</div>
              <span className="text-[8px] font-semibold text-zinc-400">kcal/dia</span>
            </div>
          </div>

          <div className="bg-[#fffefe] p-4 rounded-2xl border border-pink-50/50 flex flex-col justify-between">
            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Droplets size={10} className="text-sky-500" /> Água (Manual)
            </span>
            <div className="mt-1">
              <div className="text-xl font-black italic tracking-tighter text-zinc-800">{profile?.dailyWaterGoal || 2500}</div>
              <span className="text-[8px] font-semibold text-zinc-400">ml/dia</span>
            </div>
          </div>

          <div className="bg-[#fffefe] p-4 rounded-2xl border border-pink-50/50 flex flex-col justify-between">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#d4af37] flex items-center gap-1">
              <Apple size={10} className="text-[#d4af37]" /> Proteína
            </span>
            <div className="mt-1">
              <div className="text-xl font-black italic tracking-tighter text-zinc-800">{profile?.proteinGoal || 130}g</div>
              <span className="text-[8px] font-semibold text-zinc-400">meta proteica</span>
            </div>
          </div>
        </div>

        {/* PROGRESS METERS FOR OTHER MACROS */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div>
            <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-zinc-500 mb-1 uppercase">
              <span>Carboidratos</span>
              <span className="text-zinc-640 font-black">{profile?.carbGoal || 240}g</span>
            </div>
            <div className="w-full h-1.5 bg-pink-100/30 rounded-full overflow-hidden">
              <div className="h-full bg-pink-400 rounded-full w-2/3"></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-[9px] font-bold tracking-wider text-zinc-500 mb-1 uppercase">
              <span>Gorduras</span>
              <span className="text-zinc-640 font-black">{profile?.fatGoal || 60}g</span>
            </div>
            <div className="w-full h-1.5 bg-yellow-100/30 rounded-full overflow-hidden">
              <div className="h-full bg-[#d4af37] rounded-full w-1/2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* DIET LOG ENTRIES LIST */}
      <div className="space-y-4">
        {diets.length === 0 ? (
          <div className="py-12 px-6 bg-white border border-dashed border-pink-100 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-400 mb-3 animate-pulse">
              <Utensils size={24} />
            </div>
            <h4 className="text-sm font-bold uppercase italic text-zinc-700">Adicione seu Primeiro Log</h4>
            <p className="text-xs text-zinc-450 max-w-[280px] mt-1">Registre o que comeu hoje e use nossa busca inteligente na internet para estimar calorias, micros e macros!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {diets.map((diet) => {
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
                              <div key={i} className="bg-pink-50/20 rounded-xl p-3 border border-pink-50/40 space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-zinc-700">
                                    {meal.name} <span className="text-[10px] font-normal text-zinc-400 font-mono">({meal.weight || 100}g)</span>
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
                                    <span className="text-[8px] bg-pink-100/50 text-pink-600 px-1.5 py-0.2 rounded font-mono">
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">Alimentos Ingeridos</label>
                    <span className="text-[10px] font-semibold text-pink-500 italic block">Digite o peso em gramas (g)</span>
                  </div>
                  
                  <div className="space-y-4">
                    {newDiet.meals.map((meal, i) => (
                      <div key={i} className="bg-pink-50/10 p-4 rounded-2xl border border-pink-50 space-y-3">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6">
                            <input 
                              type="text" 
                              placeholder="Nome do Alimento. Ex: Maçã"
                              className="w-full bg-[#fffafa] border border-pink-150 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-805"
                              value={meal.name}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].name = e.target.value;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>
                          
                          <div className="col-span-3">
                            <input 
                              type="number" 
                              placeholder="Peso (g)"
                              className="w-full bg-[#fffafa] border border-pink-150 rounded-xl px-2 py-2 text-xs font-bold text-center text-zinc-805"
                              value={meal.weight || ''}
                              onChange={(e) => {
                                const newMeals = [...newDiet.meals];
                                newMeals[i].weight = parseInt(e.target.value) || 0;
                                setNewDiet({...newDiet, meals: newMeals});
                              }}
                            />
                          </div>

                          <div className="col-span-2">
                            <button
                              type="button"
                              onClick={() => handleSearchNutrition(i)}
                              className="w-full py-2 bg-gradient-to-r from-sky-500 to-sky-450 hover:opacity-90 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer transition-all"
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
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-450 text-white font-semibold uppercase py-4 rounded-2xl shadow-lg shadow-pink-200/50 cursor-pointer text-sm font-black"
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
