import { useState, useEffect, useMemo } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy } from '../firebase';
import { 
  format, 
  subDays, 
  subWeeks, 
  subMonths, 
  isAfter, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfDay,
  endOfWeek,
  endOfMonth
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell 
} from 'recharts';
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Droplets, Target, Activity } from 'lucide-react';

interface ProgressTrackerProps {
  user: User;
  profile: any;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';

export default function ProgressTracker({ user, profile }: ProgressTrackerProps) {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const [metrics, setMetrics] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);

  useEffect(() => {
    const qMetrics = query(collection(db, 'metrics'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const qDiets = query(collection(db, 'diets'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const qCheckins = query(collection(db, 'checkins'), where('uid', '==', user.uid), orderBy('date', 'asc'));

    const unsubMetrics = onSnapshot(qMetrics, (s) => setMetrics(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubDiets = onSnapshot(qDiets, (s) => setDiets(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubCheckins = onSnapshot(qCheckins, (s) => setCheckins(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    return () => { unsubMetrics(); unsubDiets(); unsubCheckins(); };
  }, [user.uid]);

  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let interval: any;

    if (timeFrame === 'daily') {
      startDate = subDays(now, 14);
      interval = eachDayOfInterval({ start: startDate, end: now });
    } else if (timeFrame === 'weekly') {
      startDate = subWeeks(now, 12);
      interval = eachWeekOfInterval({ start: startDate, end: now });
    } else {
      startDate = subMonths(now, 6);
      interval = eachMonthOfInterval({ start: startDate, end: now });
    }

    return interval.map((date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const label = timeFrame === 'daily' 
        ? format(date, 'dd/MM') 
        : timeFrame === 'weekly' 
          ? `Sem ${format(date, 'w')}` 
          : format(date, 'MMM', { locale: ptBR });

      // Find data for this period
      let periodMetrics, periodDiets, periodCheckins;
      
      if (timeFrame === 'daily') {
        periodMetrics = metrics.filter(m => m.date === dateStr);
        periodDiets = diets.filter(d => d.date === dateStr);
        periodCheckins = checkins.filter(c => c.date === dateStr);
      } else {
        const end = timeFrame === 'weekly' ? endOfWeek(date) : endOfMonth(date);
        periodMetrics = metrics.filter(m => {
          const d = new Date(m.date + 'T00:00:00');
          return d >= date && d <= end;
        });
        periodDiets = diets.filter(d => {
          const dt = new Date(d.date + 'T00:00:00');
          return dt >= date && dt <= end;
        });
        periodCheckins = checkins.filter(c => {
          const dc = new Date(c.date + 'T00:00:00');
          return dc >= date && dc <= end;
        });
      }

      const avgWeight = periodMetrics.length > 0 
        ? periodMetrics.reduce((acc, m) => acc + m.weight, 0) / periodMetrics.length 
        : null;
      
      const avgFat = periodMetrics.length > 0 
        ? periodMetrics.reduce((acc, m) => acc + (m.bodyFat || 0), 0) / periodMetrics.length 
        : null;

      const avgMuscle = periodMetrics.length > 0 
        ? periodMetrics.reduce((acc, m) => acc + (m.muscleMass || 0), 0) / periodMetrics.length 
        : null;

      const avgWater = periodDiets.length > 0 
        ? periodDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0) / periodDiets.length 
        : 0;

      const adherence = periodCheckins.length > 0
        ? (periodCheckins.filter(c => c.dietOnTrack).length / periodCheckins.length) * 100
        : 0;

      return {
        date: dateStr,
        label,
        weight: avgWeight ? parseFloat(avgWeight.toFixed(1)) : null,
        bodyFat: avgFat ? parseFloat(avgFat.toFixed(1)) : null,
        muscleMass: avgMuscle ? parseFloat(avgMuscle.toFixed(1)) : null,
        water: Math.round(avgWater),
        adherence: Math.round(adherence)
      };
    });
  }, [timeFrame, metrics, diets, checkins]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-xl">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
              <span className="text-xs font-bold text-white">{p.value} {p.unit}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
          Rastreio de <span className="text-orange-500">Progresso</span>
        </h2>
        
        {/* Timeframe Selector */}
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
          {(['daily', 'weekly', 'monthly'] as TimeFrame[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFrame(tf)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                timeFrame === tf ? 'bg-orange-500 text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {tf === 'daily' ? 'Diário' : tf === 'weekly' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>
      </div>

      {/* Weight & Body Composition */}
      <section className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Peso e Composição</h3>
          </div>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#f97316" 
                strokeWidth={4} 
                dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Peso"
                unit="kg"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="bodyFat" 
                stroke="#ef4444" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                name="Gordura"
                unit="%"
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="muscleMass" 
                stroke="#22c55e" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                name="Músculo"
                unit="%"
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-4">
          <div className="text-center">
            <div className="text-xs font-bold text-orange-500">Peso</div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Laranja</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-red-500">Gordura</div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Vermelho</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold text-green-500">Músculo</div>
            <div className="text-[8px] text-zinc-500 uppercase font-bold">Verde</div>
          </div>
        </div>
      </section>

      {/* Water Intake */}
      <section className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-blue-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Ingestão de Água (Média)</h3>
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="water" name="Água" unit="ml" radius={[6, 6, 0, 0]}>
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.water >= (profile?.dailyWaterGoal || 2500) ? '#3b82f6' : '#1e3a8a'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Diet Adherence */}
      <section className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-green-500" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Aderência à Dieta</h3>
          </div>
          <div className="text-xl font-black italic text-green-500">
            {filteredData.reduce((acc, d) => acc + d.adherence, 0) / filteredData.length | 0}%
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                dy={10}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="stepAfter" 
                dataKey="adherence" 
                stroke="#22c55e" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAdherence)" 
                name="Aderência"
                unit="%"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
