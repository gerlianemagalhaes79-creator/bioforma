import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, limit, addDoc, updateDoc, doc, getDocs, deleteDoc } from '../firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Apple, Droplets, Flame, TrendingUp, Plus, ChevronLeft, ChevronRight, Calendar, Dumbbell, Award, Sparkles, Trash2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

interface DashboardProps {
  user: User;
  profile: any;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [aerobics, setAerobics] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    const checkinsQuery = query(
      collection(db, 'checkins'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(30)
    );
    const unsubscribeCheckins = onSnapshot(checkinsQuery, (snapshot) => {
      setCheckins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const metricsQuery = query(
      collection(db, 'metrics'),
      where('uid', '==', user.uid),
      orderBy('date', 'asc'),
      limit(10)
    );
    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      setMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const workoutsAllQuery = query(
      collection(db, 'workouts'),
      where('uid', '==', user.uid)
    );
    const unsubscribeWorkoutsAll = onSnapshot(workoutsAllQuery, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Real-time subscription to user diets to compute home charts
    const dietsQuery = query(
      collection(db, 'diets'),
      where('uid', '==', user.uid)
    );
    const unsubscribeDiets = onSnapshot(dietsQuery, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.date.localeCompare(a.date));
      setDiets(loaded);
    });

    const aerobicsQuery = query(
      collection(db, 'aerobics'),
      where('uid', '==', user.uid)
    );
    const unsubscribeAerobics = onSnapshot(aerobicsQuery, (snapshot) => {
      setAerobics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeCheckins();
      unsubscribeMetrics();
      unsubscribeWorkoutsAll();
      unsubscribeDiets();
      unsubscribeAerobics();
    };
  }, [user.uid]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const getCheckinForDay = (day: Date) => {
    return checkins.find(c => isSameDay(new Date(c.date + 'T00:00:00'), day));
  };



  // Find all unique dates in diets log
  const uniqueDates = Array.from(new Set(diets.map(d => d.date)))
    .sort()
    .reverse();

  // If today is missing from history, append it to visual selector so they can track current day
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  if (!uniqueDates.includes(todayStr)) {
    uniqueDates.unshift(todayStr);
  }

  const getSelectedDateLabel = () => {
    const today = new Date();
    const todayFormatted = format(today, 'yyyy-MM-dd');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');

    const selDate = new Date(selectedDate + 'T00:00:00');

    if (selectedDate === todayFormatted) {
      return `Hoje, ${format(selDate, "dd 'de' MMMM", { locale: ptBR })}`;
    } else if (selectedDate === yesterdayFormatted) {
      return `Ontem, ${format(selDate, "dd 'de' MMMM", { locale: ptBR })}`;
    } else {
      return format(selDate, "EEEE, dd 'de' MMMM", { locale: ptBR });
    }
  };

  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() - 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + 1);
    setSelectedDate(format(current, 'yyyy-MM-dd'));
  };



  // Filter diets by selected date and sum macros
  const selectedDateDiets = diets.filter(d => d.date === selectedDate);
  const selectedTotalWater = selectedDateDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0);
  const todayDiets = diets.filter(d => d.date === todayStr);
  const todayWater = todayDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0);

  const handleQuickAddWaterStart = async () => {
    try {
      const targetWater = profile?.dailyWaterGoal || 2500;
      const currentTotalWater = selectedDateDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0);
      const newWaterTotal = currentTotalWater + 150;

      const firstSelectedDiet = selectedDateDiets[0];

      if (firstSelectedDiet) {
        await updateDoc(doc(db, 'diets', firstSelectedDiet.id), {
          waterIntake: (firstSelectedDiet.waterIntake || 0) + 150
        });
      } else {
        await addDoc(collection(db, 'diets'), {
          uid: user.uid,
          date: selectedDate,
          meals: [],
          waterIntake: 150,
          notes: 'Registrado pela via rápida do início'
        });
      }

      // Sync with checkins Collection
      const checkinQuery = query(
        collection(db, 'checkins'),
        where('uid', '==', user.uid),
        where('date', '==', selectedDate)
      );
      const checkinSnap = await getDocs(checkinQuery);
      if (!checkinSnap.empty) {
        await updateDoc(doc(db, 'checkins', checkinSnap.docs[0].id), {
          waterGoalMet: newWaterTotal >= targetWater
        });
      } else {
        await addDoc(collection(db, 'checkins'), {
          uid: user.uid,
          date: selectedDate,
          waterGoalMet: newWaterTotal >= targetWater,
          workoutDone: false,
          dietOnTrack: true
        });
      }
    } catch (e) {
      console.error("Erro ao registrar água no início:", e);
    }
  };

  // Compute actual ingested macros by summing all meals from all diet entries of the selected date
  const consumedCalories = selectedDateDiets.reduce((acc, d) => 
    acc + (d.meals?.reduce((mAcc: number, m: any) => mAcc + (m.calories || 0), 0) || 0), 0
  );
  const consumedProtein = selectedDateDiets.reduce((acc, d) => 
    acc + (d.meals?.reduce((mAcc: number, m: any) => mAcc + (m.protein || 0), 0) || 0), 0
  );
  const consumedFat = selectedDateDiets.reduce((acc, d) => 
    acc + (d.meals?.reduce((mAcc: number, m: any) => mAcc + (m.fat || 0), 0) || 0), 0
  );
  const consumedFiber = selectedDateDiets.reduce((acc, d) => 
    acc + (d.meals?.reduce((mAcc: number, m: any) => mAcc + (m.fiber || 0), 0) || 0), 0
  );

  // Subtract aerobic activity calories burned
  const activeDateAerobics = aerobics.filter(a => a.date === selectedDate);
  const caloriesBurned = activeDateAerobics.reduce((acc: number, a: any) => acc + (a.caloriesBurned || 0), 0);
  const netCalories = Math.max(0, consumedCalories - caloriesBurned);

  const goalCalories = profile?.dailyCalorieGoal || 2000;
  const goalProtein = profile?.proteinGoal || 130;
  const goalFat = profile?.fatGoal || 60;
  const goalFiber = profile?.fiberGoal || 25; // Default safe fiber intake target

  const caloriePercent = Math.min((netCalories / goalCalories) * 105, 100) || 0;
  const calorieExceeded = netCalories > goalCalories;

  const macroData = [
    { name: 'Proteína', Consumido: Number(consumedProtein.toFixed(1)), Meta: goalProtein, color: '#d4af37' },
    { name: 'Gordura', Consumido: Number(consumedFat.toFixed(1)), Meta: goalFat, color: '#ec4899' },
    { name: 'Fibras', Consumido: Number(consumedFiber.toFixed(1)), Meta: goalFiber, color: '#10b981' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <section className="flex justify-between items-start">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">Bem-vinda de volta</h2>
          <p className="text-4xl font-extrabold tracking-tight uppercase italic leading-none text-zinc-800">
            {profile?.name?.split(' ')[0]} <span className="text-pink-500">Pronta?</span>
          </p>
        </div>

        {/* Discreet Water Droplet Button */}
        <button
          onClick={handleQuickAddWaterStart}
          className="p-2.5 bg-sky-50/80 hover:bg-sky-100 border border-sky-200/50 rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-sm hover:shadow active:scale-95 relative group"
          title={`Adicionar +150ml (Nesta data: ${selectedTotalWater}ml)`}
        >
          <span className="text-xl leading-none">💧</span>
          <span className="text-[8px] font-black uppercase text-sky-600 mt-0.5 tracking-tighter">
            {selectedTotalWater} ml
          </span>
          <span className="absolute right-0 top-full mt-2.5 bg-zinc-800 text-white text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-md">
            +150ml ({selectedDate === todayStr ? 'Hoje' : format(new Date(selectedDate + 'T00:00:00'), 'dd/MM')})
          </span>
        </button>
      </section>

      {/* Date Navigation and Selection Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-pink-100/50 shadow-sm shadow-pink-100/5">
        <div className="flex items-center gap-1.5">
          <Calendar size={15} className="text-pink-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Visualizar ou Registrar Retroativo</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <div className="relative flex items-center bg-pink-50/10 hover:bg-pink-50/30 border border-pink-100 rounded-2xl px-3 py-2 shadow-sm gap-3 max-w-sm transition-all">
            <button 
              type="button"
              onClick={handlePrevDay}
              className="p-1 hover:bg-white rounded-lg text-pink-500 cursor-pointer transition-colors border-0 flex items-center justify-center"
              title="Dia Anterior"
            >
              <ChevronLeft size={16} strokeWidth={3} />
            </button>
            
            <div className="text-center relative cursor-pointer px-1 flex-1">
              <span className="text-xs font-black uppercase text-zinc-700 block whitespace-nowrap tracking-tight">
                {getSelectedDateLabel()}
              </span>
              <input 
                type="date"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value);
                  }
                }}
              />
            </div>

            <button 
              type="button"
              onClick={handleNextDay}
              className="p-1 hover:bg-white rounded-lg text-pink-500 cursor-pointer transition-colors border-0 flex items-center justify-center"
              title="Próximo Dia"
            >
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-2 bg-pink-50 hover:bg-pink-100 active:scale-95 text-pink-600 font-extrabold uppercase text-[9px] rounded-2xl tracking-wider transition-all cursor-pointer border border-pink-100/60"
            >
              Hoje ↩
            </button>
          )}
        </div>
      </section>

      {/* Painel de Nutrição Diária com Gráficos */}
      <section className="bg-gradient-to-br from-white to-[#fffafc] p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/15 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5 leading-none">
              <Apple size={14} className="text-pink-500" /> Painel Nutricional Diário
            </h3>
            <p className="text-2xl font-black text-zinc-800 tracking-tight uppercase italic mt-1 leading-none">
              Resumo de <span className="text-pink-500">Consumo</span>
            </p>
          </div>
        </div>

        {/* Nutritional Interactive Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Circular Progress Ring for Calories (4 columns) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-5 bg-white rounded-3xl border border-pink-50/60 shadow-sm shadow-pink-100/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Metabolização</span>
            
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* SVG circular frame */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-pink-50/70"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-pink-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  initial={{ strokeDashoffset: 251.2 }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * Math.min(caloriePercent, 100)) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute text-center">
                <div className="text-3xl font-black italic tracking-tighter text-zinc-900 leading-none">
                  {netCalories}
                </div>
                <div className="text-[8px] text-[#d4af37] font-black uppercase tracking-wider mt-1">
                  de {goalCalories} kcal
                </div>
                <div className="text-[9px] text-pink-500 font-extrabold mt-1">
                  {Math.round((netCalories / goalCalories) * 100)}% líquido
                </div>
              </div>
            </div>

            {/* Indicator of limits */}
            <div className="mt-4 text-center space-y-2">
              <div>
                {calorieExceeded ? (
                  <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full inline-block">
                    Cota Excedida em {netCalories - goalCalories} kcal ⚠️
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-block">
                    Mais {goalCalories - netCalories} kcal para a meta 🎯
                  </span>
                )}
              </div>
              <div className="text-[9px] font-bold text-zinc-400 bg-zinc-50 py-1.5 px-3 rounded-2xl border border-zinc-100/50 inline-block">
                Comida: <span className="text-zinc-650">{consumedCalories} kcal</span>
                {caloriesBurned > 0 && (
                  <>
                    {' '}• Gasto Aeróbico: <span className="text-pink-500">-{caloriesBurned} kcal</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart & Progress (7 columns) */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-pink-50/60 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">
                Gráfico de Consumo vs Metas (g)
              </span>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={macroData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fdf4f8" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '700' }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 9 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(236,72,153,0.02)' }}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #fbcfe8', borderRadius: '16px', fontSize: '11px', color: '#1f2937' }}
                      formatter={(value: any, name: any) => [`${value}g`, name]}
                    />
                    <Bar 
                      dataKey="Consumido" 
                      radius={[4, 4, 0, 0]}
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="Meta" 
                      fill="#e4e4e7" 
                      radius={[4, 4, 0, 0]} 
                      opacity={0.65}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Summary Cards Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-amber-50/20 p-3 rounded-2xl border border-amber-100/50 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-[#9b7e1c] block">Proteína</span>
                  <span className="text-base font-black italic text-zinc-800">{consumedProtein.toFixed(1)}g</span>
                </div>
                <span className="text-[8px] text-zinc-400 font-bold mt-1 block">Meta: {goalProtein}g</span>
              </div>
              <div className="bg-pink-50/20 p-3 rounded-2xl border border-pink-100/50 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-pink-500 block">Gordura</span>
                  <span className="text-base font-black italic text-zinc-800">{consumedFat.toFixed(1)}g</span>
                </div>
                <span className="text-[8px] text-zinc-400 font-bold mt-1 block">Meta: {goalFat}g</span>
              </div>
              <div className="bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/50 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-600 block flex items-center gap-0.5">Fibras</span>
                  <span className="text-base font-black italic text-zinc-800">{consumedFiber.toFixed(1)}g</span>
                </div>
                <span className="text-[8px] text-zinc-400 font-bold mt-1 block">Meta: {goalFiber}g</span>
              </div>
            </div>
            
            {selectedDateDiets.length === 0 && (
              <div className="text-[10px] bg-pink-50/30 p-2 text-pink-650 rounded-xl border border-pink-100/60 text-center font-bold">
                Nenhum log para este dia. Adicione refeições na aba "Dieta"!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10">
          <div className="flex items-center gap-2 text-pink-500 mb-2">
            <Flame size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Meta Calórica</span>
          </div>
          <div className="text-2xl font-black italic text-zinc-800">{profile?.dailyCalorieGoal || 2000} <span className="text-xs font-normal not-italic text-zinc-400">kcal</span></div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10">
          <div className="flex items-center gap-2 text-pink-400 mb-2">
            <Droplets size={18} className="text-[#d4af37]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500">Meta de Água</span>
          </div>
          <div className="text-2xl font-black italic text-zinc-800">{profile?.dailyWaterGoal || 2500} <span className="text-xs font-normal not-italic text-zinc-400">ml</span></div>
        </div>
      </section>

      {/* Check-in Grid */}
      <section className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Check-in Mensal</h3>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-[8px] uppercase font-black tracking-wider text-[#d4af37] bg-yellow-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-[#d4af37]"></div> Treino
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase font-black tracking-wider text-sky-500 bg-sky-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-sky-400"></div> Água
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase font-black tracking-wider text-pink-500 bg-pink-50 px-2 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-pink-500"></div> Calorias
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, i) => {
            const checkin = getCheckinForDay(day);
            const isToday = isSameDay(day, new Date());
            const dayStr = format(day, 'yyyy-MM-dd');

            // 1. Workout met (checked via explicit check-in flag OR presence of logged strength/aerobic activities on this day)
            const dayWorkoutLogs = workouts.filter((w: any) => w.date === dayStr);
            const dayAerobicsLogs = aerobics.filter((a: any) => a.date === dayStr);
            const isWorkoutMet = checkin?.workoutDone || dayWorkoutLogs.length > 0 || dayAerobicsLogs.length > 0;

            // 2. Water met
            const dayDietsList = diets.filter(d => d.date === dayStr);
            const dayWater = dayDietsList.reduce((acc, d) => acc + (d.waterIntake || 0), 0);
            const targetWater = profile?.dailyWaterGoal || 2500;
            const isWaterMet = dayWater >= targetWater;

            // 3. Calories met: Ingested minus Aerobics Burned is <= Daily Goal (min 1 calorie logged)
            const dayCalories = dayDietsList.reduce((acc, d) => 
              acc + (d.meals?.reduce((mAcc: number, m: any) => mAcc + (m.calories || 0), 0) || 0), 0
            );
            const dayAerobics = aerobics.filter((a: any) => a.date === dayStr);
            const dayBurned = dayAerobics.reduce((acc: number, a: any) => acc + (a.caloriesBurned || 0), 0);
            const dayNetCalories = Math.max(0, dayCalories - dayBurned);
            const isCalorieMet = dayCalories > 0 && dayNetCalories <= goalCalories;
            
            const isSelected = dayStr === selectedDate;
            
            return (
              <button 
                key={i} 
                type="button"
                onClick={() => setSelectedDate(dayStr)}
                className={`flex flex-col items-center gap-1 p-1 rounded-2xl transition-all cursor-pointer border-0 w-full hover:bg-pink-50/40 relative active:scale-95 ${
                  isSelected ? 'bg-pink-50 ring-1 ring-pink-200' : ''
                }`}
              >
                <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-pink-500' : 'text-zinc-400'}`}>
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <div 
                  className={`w-full aspect-square rounded-xl border flex flex-col p-1 gap-0.5 overflow-hidden transition-all ${
                    isToday ? 'border-[#ec4899] ring-2 ring-pink-100 bg-[#fffbfc]' : 'border-pink-100/80 bg-[#fffdfd]'
                  } ${isSelected ? 'border-[#ec4899] ring-1 ring-[#ec4899] shadow-sm' : ''}`}
                  title={`Treino: ${isWorkoutMet ? 'Ok' : 'Não'}; Água: ${dayWater}/${targetWater}ml; Calorias: ${dayCalories} (gasto ${dayBurned})`}
                >
                  <div className={`flex-1 rounded-sm transition-all ${isWorkoutMet ? 'bg-[#d4af37]' : 'bg-zinc-100/40'}`}></div>
                  <div className={`flex-1 rounded-sm transition-all ${isWaterMet ? 'bg-[#38bdf8]' : 'bg-zinc-100/40'}`}></div>
                  <div className={`flex-1 rounded-sm transition-all ${isCalorieMet ? 'bg-pink-500' : 'bg-zinc-100/40'}`}></div>
                </div>
                <span className="text-[8px] font-bold text-zinc-400">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}
