import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Heart, Camera, FileText, X, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MetricsSectionProps {
  user: User;
}

export default function MetricsSection({ user }: MetricsSectionProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  const [newMetric, setNewMetric] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: 0,
    bodyFat: 0,
    muscleMass: 0,
    visceralFat: 0,
    waterPercentage: 0,
    notes: ''
  });

  const [newExam, setNewExam] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: '',
    result: '',
    notes: ''
  });

  const [newPhoto, setNewPhoto] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    imageUrl: '',
    angle: 'Front',
    notes: ''
  });

  useEffect(() => {
    const qMetrics = query(collection(db, 'metrics'), where('uid', '==', user.uid), orderBy('date', 'desc'));
    const qExams = query(collection(db, 'exams'), where('uid', '==', user.uid), orderBy('date', 'desc'));
    const qPhotos = query(collection(db, 'photos'), where('uid', '==', user.uid), orderBy('date', 'desc'));

    const unsubMetrics = onSnapshot(qMetrics, (s) => setMetrics(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubExams = onSnapshot(qExams, (s) => setExams(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubPhotos = onSnapshot(qPhotos, (s) => setPhotos(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubMetrics(); unsubExams(); unsubPhotos(); };
  }, [user.uid]);

  const handleSaveMetric = async () => {
    try {
      await addDoc(collection(db, 'metrics'), { ...newMetric, uid: user.uid });
      setShowAddMetric(false);
    } catch (e) { console.error(e); }
  };

  const handleSaveExam = async () => {
    try {
      await addDoc(collection(db, 'exams'), { ...newExam, uid: user.uid });
      setShowAddExam(false);
    } catch (e) { console.error(e); }
  };

  const handleSavePhoto = async () => {
    try {
      await addDoc(collection(db, 'photos'), { ...newPhoto, uid: user.uid });
      setShowAddPhoto(false);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
        Minha <span className="text-orange-500">Evolução</span>
      </h2>

      {/* Metrics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Biometria</h3>
          <button onClick={() => setShowAddMetric(true)} className="text-orange-500"><Plus size={20} /></button>
        </div>
        <div className="space-y-4">
          {metrics.map(m => (
            <div key={m.id} className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-2xl font-black italic">{m.weight} <span className="text-xs font-normal not-italic text-zinc-500">kg</span></div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {format(new Date(m.date + 'T00:00:00'), "dd/MM/yyyy")}
                  </div>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'metrics', m.id))} className="text-zinc-700 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs font-black italic text-orange-500">{m.bodyFat}%</div>
                  <div className="text-[8px] font-bold uppercase text-zinc-600">Gordura</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black italic text-orange-500">{m.muscleMass}%</div>
                  <div className="text-[8px] font-bold uppercase text-zinc-600">Músculo</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-black italic text-orange-500">{m.visceralFat}</div>
                  <div className="text-[8px] font-bold uppercase text-zinc-600">Visceral</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Photos Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Fotos</h3>
          <button onClick={() => setShowAddPhoto(true)} className="text-orange-500"><Plus size={20} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {photos.map(p => (
            <div key={p.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-zinc-800 group">
              <img src={p.imageUrl} alt="Progress" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                <span className="text-[10px] font-black italic uppercase text-orange-500">{p.angle}</span>
                <span className="text-[8px] font-bold text-zinc-400">{format(new Date(p.date + 'T00:00:00'), "dd/MM/yyyy")}</span>
              </div>
              <button 
                onClick={() => deleteDoc(doc(db, 'photos', p.id))}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Exams Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Exames</h3>
          <button onClick={() => setShowAddExam(true)} className="text-orange-500"><Plus size={20} /></button>
        </div>
        <div className="space-y-4">
          {exams.map(e => (
            <div key={e.id} className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="text-sm font-black italic uppercase">{e.type}</div>
                  <div className="text-[8px] font-bold text-zinc-500">{format(new Date(e.date + 'T00:00:00'), "dd/MM/yyyy")}</div>
                </div>
              </div>
              <button onClick={() => deleteDoc(doc(db, 'exams', e.id))} className="text-zinc-700 hover:text-red-500"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Modals (Simplified for brevity) */}
      <AnimatePresence>
        {showAddMetric && (
          <motion.div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-md rounded-[2rem] p-8 border border-zinc-800">
              <div className="flex justify-between mb-6">
                <h3 className="text-xl font-black italic uppercase">Nova Medição</h3>
                <button onClick={() => setShowAddMetric(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <input type="number" placeholder="Peso (kg)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3" onChange={e => setNewMetric({...newMetric, weight: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Gordura (%)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3" onChange={e => setNewMetric({...newMetric, bodyFat: parseFloat(e.target.value)})} />
                <input type="number" placeholder="Músculo (%)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3" onChange={e => setNewMetric({...newMetric, muscleMass: parseFloat(e.target.value)})} />
                <button onClick={handleSaveMetric} className="w-full bg-orange-500 text-black font-black italic uppercase py-4 rounded-xl">Salvar</button>
              </div>
            </div>
          </motion.div>
        )}
        {showAddPhoto && (
          <motion.div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-zinc-900 w-full max-w-md rounded-[2rem] p-8 border border-zinc-800">
              <div className="flex justify-between mb-6">
                <h3 className="text-xl font-black italic uppercase">Nova Foto</h3>
                <button onClick={() => setShowAddPhoto(false)}><X /></button>
              </div>
              <div className="space-y-4">
                <input type="text" placeholder="URL da Imagem" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3" onChange={e => setNewPhoto({...newPhoto, imageUrl: e.target.value})} />
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3" onChange={e => setNewPhoto({...newPhoto, angle: e.target.value})}>
                  <option value="Front">Frente</option>
                  <option value="Side">Lado</option>
                  <option value="Back">Costas</option>
                </select>
                <button onClick={handleSavePhoto} className="w-full bg-orange-500 text-black font-black italic uppercase py-4 rounded-xl">Salvar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
