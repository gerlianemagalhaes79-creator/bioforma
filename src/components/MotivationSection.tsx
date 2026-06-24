import { useState, useEffect } from 'react';
import { User, db, collection, query, where, getDocs, orderBy, limit } from '../firebase';
import { motion } from 'motion/react';
import { Sparkles, Brain, Target, Zap, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MotivationSectionProps {
  user: User;
  profile: any;
}

export default function MotivationSection({ user, profile }: MotivationSectionProps) {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchMotivation = async () => {
    setLoading(true);
    try {
      // Fetch recent data for context
      const metricsSnap = await getDocs(query(collection(db, 'metrics'), where('uid', '==', user.uid), orderBy('date', 'desc'), limit(3)));
      const workoutsSnap = await getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('date', 'desc'), limit(3)));
      
      const metrics = metricsSnap.docs.map(d => d.data());
      const workouts = workoutsSnap.docs.map(d => d.data());

      const response = await fetch('/api/motivation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile?.name,
          targetWeight: profile?.targetWeight,
          weight: metrics[0]?.weight,
          workouts: workouts.map(w => w.type).join(', ')
        })
      });
      const data = await response.json();
      setMessage(data.text || 'Mantenha o foco! A disciplina é o que separa o sonho da realidade. Vamos pra cima!');
    } catch (e) {
      console.error(e);
      setMessage('Mantenha o foco! A disciplina é o que separa o sonho da realidade. Vamos pra cima!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotivation();
  }, []);

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
        Foco <span className="text-orange-500">Total</span>
      </h2>

      <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain size={120} />
        </div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-black">
            <Sparkles size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Insight da IA</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-zinc-800 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-4 bg-zinc-800 rounded-full w-full animate-pulse"></div>
            <div className="h-4 bg-zinc-800 rounded-full w-1/2 animate-pulse"></div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-invert prose-sm max-w-none"
          >
            <div className="text-lg font-bold italic text-zinc-200 leading-relaxed">
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        <button 
          onClick={fetchMotivation}
          disabled={loading}
          className="mt-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-colors"
        >
          <Zap size={14} />
          Nova Dose de Motivação
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <Target className="text-orange-500 mb-3" size={24} />
          <div className="text-xs font-bold uppercase text-zinc-500 mb-1">Consistência</div>
          <div className="text-xl font-black italic">85%</div>
        </div>
        <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
          <Activity className="text-green-500 mb-3" size={24} />
          <div className="text-xs font-bold uppercase text-zinc-500 mb-1">Status</div>
          <div className="text-xl font-black italic text-green-500 uppercase">Ativo</div>
        </div>
      </div>
    </div>
  );
}
