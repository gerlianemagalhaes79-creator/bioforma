import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Activity, Dumbbell, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WorkoutSectionProps {
  user: User;
}

export default function WorkoutSection({ user }: WorkoutSectionProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    type: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    exercises: [{ name: '', sets: 0, reps: 0, weight: 0 }],
    notes: ''
  });

  useEffect(() => {
    const q = query(
      collection(db, 'workouts'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddExercise = () => {
    setNewWorkout({
      ...newWorkout,
      exercises: [...newWorkout.exercises, { name: '', sets: 0, reps: 0, weight: 0 }]
    });
  };

  const handleSaveWorkout = async () => {
    if (!newWorkout.type) return;
    try {
      await addDoc(collection(db, 'workouts'), {
        ...newWorkout,
        uid: user.uid
      });
      // Also update checkin
      const checkinId = `${user.uid}_${newWorkout.date}`;
      // Note: for simplicity we use addDoc, but ideally we'd use setDoc with a deterministic ID for checkins
      // But rules might need update for that. Let's just add a checkin doc.
      await addDoc(collection(db, 'checkins'), {
        uid: user.uid,
        date: newWorkout.date,
        workoutDone: true
      });
      setShowAddModal(false);
      setNewWorkout({
        type: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        exercises: [{ name: '', sets: 0, reps: 0, weight: 0 }],
        notes: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'workouts', id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
          Meus <span className="text-orange-500">Treinos</span>
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="space-y-4">
        {workouts.map((workout) => (
          <motion.div 
            layout
            key={workout.id}
            className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500">
                  <Dumbbell size={20} />
                </div>
                <div>
                  <div className="text-lg font-black italic uppercase leading-tight">{workout.type}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {format(new Date(workout.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteWorkout(workout.id)}
                className="text-zinc-700 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {workout.exercises.map((ex: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                  <span className="text-sm font-bold text-zinc-300">{ex.name}</span>
                  <div className="flex gap-3 text-[10px] font-black italic uppercase text-orange-500">
                    <span>{ex.sets}x{ex.reps}</span>
                    <span className="text-zinc-600">{ex.weight}kg</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Workout Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 border border-zinc-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Novo Treino</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Tipo de Treino</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Peito e Tríceps"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold italic"
                    value={newWorkout.type}
                    onChange={(e) => setNewWorkout({...newWorkout, type: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Exercícios</label>
                  <div className="space-y-4">
                    {newWorkout.exercises.map((ex, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Nome"
                          className="col-span-6 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold"
                          value={ex.name}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].name = e.target.value;
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="S"
                          className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-center"
                          value={ex.sets || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].sets = parseInt(e.target.value);
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="R"
                          className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-center"
                          value={ex.reps || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].reps = parseInt(e.target.value);
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="kg"
                          className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-center"
                          value={ex.weight || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].weight = parseInt(e.target.value);
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={handleAddExercise}
                      className="w-full py-3 border border-dashed border-zinc-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition-all"
                    >
                      + Adicionar Exercício
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleSaveWorkout}
                  className="w-full bg-orange-500 text-black font-black italic uppercase py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                >
                  Salvar Treino
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
