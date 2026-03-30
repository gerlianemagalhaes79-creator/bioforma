import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, limit } from '../firebase';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Activity, Apple, Droplets, Flame, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  user: User;
  profile: any;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [recentWorkout, setRecentWorkout] = useState<any>(null);

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

    return () => {
      unsubscribeCheckins();
      unsubscribeMetrics();
      unsubscribeWorkout();
    };
  }, [user.uid]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const getCheckinForDay = (day: Date) => {
    return checkins.find(c => isSameDay(new Date(c.date + 'T00:00:00'), day));
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-1">Bem-vindo de volta</h2>
        <p className="text-4xl font-black tracking-tighter uppercase italic leading-none">
          {profile?.name?.split(' ')[0]} <span className="text-orange-500">Pronto?</span>
        </p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800">
          <div className="flex items-center gap-2 text-orange-500 mb-2">
            <Flame size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Meta Calórica</span>
          </div>
          <div className="text-2xl font-black italic">{profile?.dailyCalorieGoal || 2000} <span className="text-xs font-normal not-italic text-zinc-500">kcal</span></div>
        </div>
        <div className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Droplets size={18} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Meta de Água</span>
          </div>
          <div className="text-2xl font-black italic">{profile?.dailyWaterGoal || 2500} <span className="text-xs font-normal not-italic text-zinc-500">ml</span></div>
        </div>
      </section>

      {/* Check-in Grid */}
      <section className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Check-in Mensal</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 text-[8px] uppercase font-bold text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Treino
            </div>
            <div className="flex items-center gap-1 text-[8px] uppercase font-bold text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div> Dieta
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, i) => {
            const checkin = getCheckinForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={`text-[8px] font-bold uppercase ${isToday ? 'text-orange-500' : 'text-zinc-600'}`}>
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <div className={`w-full aspect-square rounded-lg border flex flex-col overflow-hidden ${
                  isToday ? 'border-orange-500/50' : 'border-zinc-800'
                } bg-zinc-950`}>
                  <div className={`flex-1 ${checkin?.workoutDone ? 'bg-green-500' : 'bg-transparent'}`}></div>
                  <div className={`flex-1 ${checkin?.dietOnTrack ? 'bg-orange-500' : 'bg-transparent'}`}></div>
                </div>
                <span className="text-[8px] font-bold text-zinc-700">{format(day, 'd')}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Weight Chart */}
      {metrics.length > 0 && (
        <section className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Evolução de Peso</h3>
            <TrendingUp size={16} className="text-orange-500" />
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                  labelStyle={{ display: 'none' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorWeight)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Atual</span>
              <div className="text-2xl font-black italic">{metrics[metrics.length - 1].weight} kg</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Meta</span>
              <div className="text-xl font-bold italic text-zinc-400">{profile?.targetWeight} kg</div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Workout */}
      {recentWorkout && (
        <section className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Último Treino</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-lg font-black italic uppercase">{recentWorkout.type}</div>
              <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                {format(new Date(recentWorkout.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
