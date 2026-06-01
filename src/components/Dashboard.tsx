import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, limit } from '../firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Activity, Apple, Droplets, Flame, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts';

interface DashboardProps {
  user: User;
  profile: any;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [recentWorkout, setRecentWorkout] = useState<any>(null);
  const [diets, setDiets] = useState<any[]>([]);
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

    const workoutQuery = query(
      collection(db, 'workouts'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc'),
      limit(1)
    );
    const unsubscribeWorkout = onSnapshot(workoutQuery, (snapshot) => {
      if (!snapshot.empty) setRecentWorkout(snapshot.docs[0].data());
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

    return () => {
      unsubscribeCheckins();
      unsubscribeMetrics();
      unsubscribeWorkout();
      unsubscribeDiets();
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

  // Filter diets by selected date
  const activeDiet = diets.find(d => d.date === selectedDate);

  // Compute actual ingested macros
  const consumedCalories = activeDiet?.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
  const consumedProtein = activeDiet?.meals?.reduce((acc: number, m: any) => acc + (m.protein || 0), 0) || 0;
  const consumedFat = activeDiet?.meals?.reduce((acc: number, m: any) => acc + (m.fat || 0), 0) || 0;
  const consumedFiber = activeDiet?.meals?.reduce((acc: number, m: any) => acc + (m.fiber || 0), 0) || 0;

  const goalCalories = profile?.dailyCalorieGoal || 2000;
  const goalProtein = profile?.proteinGoal || 130;
  const goalFat = profile?.fatGoal || 60;
  const goalFiber = profile?.fiberGoal || 25; // Default safe fiber intake target

  const caloriePercent = Math.min((consumedCalories / goalCalories) * 105, 100) || 0;
  const calorieExceeded = consumedCalories > goalCalories;

  const macroData = [
    { name: 'Proteína', Consumido: Number(consumedProtein.toFixed(1)), Meta: goalProtein, color: '#d4af37' },
    { name: 'Gordura', Consumido: Number(consumedFat.toFixed(1)), Meta: goalFat, color: '#ec4899' },
    { name: 'Fibras', Consumido: Number(consumedFiber.toFixed(1)), Meta: goalFiber, color: '#10b981' },
  ];

  const getDayLabel = (dateStr: string) => {
    const tempYest = new Date();
    tempYest.setDate(tempYest.getDate() - 1);
    const yesterdayStr = format(tempYest, 'yyyy-MM-dd');

    if (dateStr === todayStr) return 'Hoje';
    if (dateStr === yesterdayStr) return 'Ontem';

    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd MMM', { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Section */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1">Bem-vinda de volta</h2>
        <p className="text-4xl font-extrabold tracking-tight uppercase italic leading-none text-zinc-800">
          {profile?.name?.split(' ')[0]} <span className="text-pink-500">Pronta?</span>
        </p>
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

          {/* Date Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {uniqueDates.slice(0, 5).map((dateStr) => {
              const isActive = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`text-[10px] font-extrabold uppercase py-1.5 px-3 rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-rose-450 border-pink-400 text-white shadow-md shadow-pink-400/20'
                      : 'bg-white border-pink-50 hover:border-pink-200 text-zinc-500'
                  }`}
                >
                  {getDayLabel(dateStr)}
                </button>
              );
            })}
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
                <div className="text-3xl font-black italic tracking-tighter text-zinc-850 leading-none">
                  {consumedCalories}
                </div>
                <div className="text-[8px] text-[#d4af37] font-extrabold uppercase tracking-wide mt-1">
                  de {goalCalories} kcal
                </div>
                <div className="text-[10px] text-pink-500 font-extrabold mt-1">
                  {Math.round((consumedCalories / goalCalories) * 100)}% consumido
                </div>
              </div>
            </div>

            {/* Indicator of limits */}
            <div className="mt-4 text-center">
              {calorieExceeded ? (
                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full inline-block">
                  Cota Excedida em {consumedCalories - goalCalories} kcal ⚠️
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-block">
                  Mais {goalCalories - consumedCalories} kcal para a meta 🎯
                </span>
              )}
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
            
            {activeDiet === undefined && (
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Check-in Mensal</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[8px] uppercase font-bold text-[#d4af37]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37]"></div> Treino
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase font-bold text-pink-500">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div> Dieta
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, i) => {
            const checkin = getCheckinForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-pink-500' : 'text-zinc-400'}`}>
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <div className={`w-full aspect-square rounded-lg border flex flex-col overflow-hidden ${
                  isToday ? 'border-pink-400' : 'border-pink-50/80'
                } bg-[#fffafe]`}>
                  <div className={`flex-1 ${checkin?.workoutDone ? 'bg-[#d4af37]' : 'bg-transparent'}`}></div>
                  <div className={`flex-1 ${checkin?.dietOnTrack ? 'bg-pink-500' : 'bg-transparent'}`}></div>
                </div>
                <span className="text-[8px] font-bold text-zinc-400">{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weight Chart */}
      {metrics.length > 0 && (
        <section className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/15">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Evolução de Peso</h3>
            <TrendingUp size={16} className="text-[#d4af37]" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #fbcfe8', borderRadius: '12px', fontSize: '10px', color: '#1f2937' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-end border-t border-pink-50 pt-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Atual</span>
              <div className="text-2xl font-black italic text-zinc-800">{metrics[metrics.length - 1].weight} kg</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Meta</span>
              <div className="text-xl font-bold italic text-pink-500">{profile?.targetWeight} kg</div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Workout */}
      {recentWorkout && (
        <section className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/15">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-4">Último Treino</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-lg font-black italic uppercase text-zinc-800">{recentWorkout.type}</div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                {format(new Date(recentWorkout.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
