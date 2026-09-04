import React, { useState } from 'react';
import { Sparkles, Search, CheckCircle2, Info, Lightbulb, Flame, ShieldAlert, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import { COMPLETE_FOOD_DATABASE, calculateAllVitaminsForFood, DAILY_RECOMMENDED_VITAMINS } from '../data/nutritionData';

interface FoodVitaminInspectorProps {
  onAddFoodToDiet?: (foodData: any) => void;
}

export default function FoodVitaminInspector({ onAddFoodToDiet }: FoodVitaminInspectorProps) {
  const [searchTerm, setSearchTerm] = useState('Ovo');
  const [portionGrams, setPortionGrams] = useState(100);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'todas' | 'lipossolúvel' | 'hidrossolúvel'>('todas');
  const [result, setResult] = useState<any>(() => calculateAllVitaminsForFood('Ovo', 100));
  const [addedSuccess, setAddedSuccess] = useState(false);

  const quickPicks = [
    { label: '🥚 Ovo Inteiro', query: 'Ovo' },
    { label: '🐟 Salmão', query: 'Salmão' },
    { label: '🥑 Abacate', query: 'Abacate' },
    { label: '🍊 Laranja', query: 'Laranja' },
    { label: '🥦 Brócolis', query: 'Brócolis' },
    { label: '🥩 Fígado', query: 'Fígado' },
    { label: '🥬 Espinafre', query: 'Espinafre' },
    { label: '🌰 Castanha', query: 'Castanha' },
  ];

  const handleInspectFood = async (food: string, grams: number) => {
    if (!food.trim()) return;
    setLoading(true);
    setAddedSuccess(false);

    try {
      // First attempt the live backend API for web-grounded comprehensive vitamin extraction
      const response = await fetch('/api/food-all-vitamins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodName: food, weight: grams })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          // Merge with calculation helper if needed to ensure complete fields
          const calc = calculateAllVitaminsForFood(food, grams);
          setResult({
            ...calc,
            ...json.data,
            vitamins: json.data.vitamins || calc.allVitamins,
            allVitamins: json.data.vitamins || calc.allVitamins,
            absorptionTip: json.data.absorptionTip || calc.absorptionTip
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("API de vitaminas offline. Utilizando cálculo local de alta precisão.", err);
    }

    // Local instant calculation fallback
    const localCalc = calculateAllVitaminsForFood(food, grams);
    setResult(localCalc);
    setLoading(false);
  };

  const handleSelectQuickPick = (item: string) => {
    setSearchTerm(item);
    handleInspectFood(item, portionGrams);
  };

  const vitaminsList = result?.allVitamins || result?.vitamins || [];
  const filteredVitamins = vitaminsList.filter((v: any) => {
    if (activeFilter === 'todas') return true;
    return v.solubility === activeFilter;
  });

  const totalVitaminsCount = vitaminsList.length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 rounded-3xl p-6 border border-amber-200/60 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-pink-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              Puxador de Vitaminas & Bioquímica
            </h2>
            <p className="text-xs text-zinc-500">
              Digite qualquer alimento para puxar todas as vitaminas hidrossolúveis e lipossolúveis presentes.
            </p>
          </div>
        </div>

        {/* Search Bar & Weight Input */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInspectFood(searchTerm, portionGrams)}
              placeholder="Ex: Abacate, Salmão, Ovos, Laranja, Brócolis..."
              className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-zinc-200 text-sm font-semibold text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white px-3 py-2 rounded-2xl border border-zinc-200 shadow-sm">
              <span className="text-xs font-bold text-zinc-400 mr-2">Porção:</span>
              <input
                type="number"
                min="10"
                max="2000"
                step="10"
                value={portionGrams}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPortionGrams(val);
                  if (val > 0) handleInspectFood(searchTerm, val);
                }}
                className="w-16 text-sm font-black text-zinc-800 focus:outline-none"
              />
              <span className="text-xs font-bold text-zinc-500">g</span>
            </div>

            <button
              onClick={() => handleInspectFood(searchTerm, portionGrams)}
              disabled={loading}
              className="px-5 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:opacity-95 transition-all shadow-md shadow-pink-200 cursor-pointer flex items-center gap-2 shrink-0 border-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Puxar Vitaminas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-zinc-400 whitespace-nowrap mr-1">Exemplos:</span>
          {quickPicks.map((pick) => (
            <button
              key={pick.query}
              type="button"
              onClick={() => handleSelectQuickPick(pick.query)}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer border ${
                searchTerm.toLowerCase() === pick.query.toLowerCase()
                  ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                  : 'bg-white/80 hover:bg-white text-zinc-600 border-zinc-200/80'
              }`}
            >
              {pick.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-150 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    {totalVitaminsCount} Vitaminas Identificadas
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    Porção calculada: {portionGrams}g
                  </span>
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mt-1">
                  {result.name || result.foodName || searchTerm}
                </h3>
              </div>

              {onAddFoodToDiet && (
                <button
                  type="button"
                  onClick={() => {
                    onAddFoodToDiet({
                      name: result.name || result.foodName || searchTerm,
                      calories: result.kcal || result.calories || 0,
                      protein: result.p || result.protein || 0,
                      carbs: result.c || result.carbs || 0,
                      fat: result.f || result.fat || 0,
                      sodium: result.sodium || 0,
                      fiber: result.fiber || 0,
                      potassium: result.potassium || 0,
                      calcium: result.calcium || 0,
                      iron: result.iron || 0,
                      vitaminA: result.vitaminA || 0,
                      vitaminB1: result.vitaminB1 || 0,
                      vitaminB2: result.vitaminB2 || 0,
                      vitaminB3: result.vitaminB3 || 0,
                      vitaminB5: result.vitaminB5 || 0,
                      vitaminB6: result.vitaminB6 || 0,
                      vitaminB7: result.vitaminB7 || 0,
                      vitaminB9: result.vitaminB9 || 0,
                      vitaminB12: result.vitaminB12 || 0,
                      vitaminC: result.vitaminC || 0,
                      vitaminD: result.vitaminD || 0,
                      vitaminE: result.vitaminE || 0,
                      vitaminK: result.vitaminK || 0,
                      choline: result.choline || 0,
                      allVitamins: result.allVitamins || result.vitamins || [],
                      source: result.source || 'BioForma Vitamin Inspector'
                    });
                    setAddedSuccess(true);
                    setTimeout(() => setAddedSuccess(false), 3000);
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border-0 ${
                    addedSuccess
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                      : 'bg-zinc-900 hover:bg-pink-500 text-white shadow-md'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Alimento Adicionado!</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} />
                      <span>Adicionar à Refeição</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Macronutrients Fast Summary */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100/80 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Calorias</span>
                <p className="text-base font-black text-amber-900 mt-0.5">
                  {result.kcal || result.calories || 0} <span className="text-[10px] font-bold">kcal</span>
                </p>
              </div>
              <div className="bg-rose-50/60 p-3 rounded-2xl border border-rose-100/80 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Proteína</span>
                <p className="text-base font-black text-rose-900 mt-0.5">
                  {result.p || result.protein || 0}g
                </p>
              </div>
              <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/80 text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Carboidratos</span>
                <p className="text-base font-black text-blue-900 mt-0.5">
                  {result.c || result.carbs || 0}g
                </p>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100/80 text-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase">Gorduras</span>
                <p className="text-base font-black text-purple-900 mt-0.5">
                  {result.f || result.fat || 0}g
                </p>
              </div>
            </div>

            {/* Scientific Absorption Tip */}
            {result.absorptionTip && (
              <div className="bg-amber-50/80 rounded-2xl p-3.5 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                <Lightbulb size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold uppercase tracking-wide text-[10px] text-amber-700 block mb-0.5">
                    Dica de Otimização & Biodisponibilidade:
                  </span>
                  {result.absorptionTip}
                </div>
              </div>
            )}
          </div>

          {/* Vitamin Classification Filter Tabs */}
          <div className="flex items-center justify-between gap-2 px-1">
            <h4 className="text-sm font-black text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={16} className="text-pink-500" />
              Tabela de Vitaminas do Alimento
            </h4>

            <div className="flex bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveFilter('todas')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  activeFilter === 'todas' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Todas ({vitaminsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('hidrossolúvel')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  activeFilter === 'hidrossolúvel' ? 'bg-white text-blue-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Hidrossolúveis
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('lipossolúvel')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  activeFilter === 'lipossolúvel' ? 'bg-white text-amber-700 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Lipossolúveis (A, D, E, K)
              </button>
            </div>
          </div>

          {/* Comprehensive Vitamin Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredVitamins.map((vit: any, idx: number) => {
              const pct = Math.min(vit.dailyValuePct || 0, 100);
              const isHigh = (vit.dailyValuePct || 0) >= 30;
              const isMedium = (vit.dailyValuePct || 0) >= 15;

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-4 border border-zinc-150 hover:border-pink-200 transition-all shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-zinc-900">
                          {vit.name}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                          vit.solubility === 'lipossolúvel'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {vit.solubility}
                        </span>
                      </div>
                      {vit.alias && (
                        <p className="text-[11px] text-zinc-400 font-semibold">
                          {vit.alias}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-pink-600">
                        {vit.amount} {vit.unit}
                      </span>
                      <p className={`text-[10px] font-extrabold ${
                        isHigh ? 'text-emerald-600' : isMedium ? 'text-amber-600' : 'text-zinc-400'
                      }`}>
                        {vit.dailyValuePct || 0}% do VD
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : isMedium
                          ? 'bg-gradient-to-r from-amber-400 to-pink-500'
                          : 'bg-zinc-300'
                      }`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>

                  {/* Biological Role */}
                  <p className="text-xs text-zinc-600 leading-snug">
                    {vit.function}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-zinc-50">
                    <span className="font-bold text-zinc-400">Classificação Nutricional:</span>
                    <span className={`font-black uppercase tracking-wider ${
                      isHigh ? 'text-emerald-600' : isMedium ? 'text-amber-600' : 'text-zinc-500'
                    }`}>
                      {vit.significance || (isHigh ? 'Excelente fonte' : isMedium ? 'Boa fonte' : 'Presente')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVitamins.length === 0 && (
            <div className="text-center py-8 bg-zinc-50 rounded-2xl border border-zinc-150">
              <p className="text-xs text-zinc-500 font-semibold">
                Nenhuma vitamina correspondente ao filtro "{activeFilter}" encontrada neste alimento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
