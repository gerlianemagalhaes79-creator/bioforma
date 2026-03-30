import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Apple, Droplets, Flame, X, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DietSectionProps {
  user: User;
  profile: any;
}

export default function DietSection({ user, profile }: DietSectionProps) {
  const [diets, setDiets] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDiet, setNewDiet] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meals: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }],
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

  const handleAddMeal = () => {
    setNewDiet({
      ...newDiet,
      meals: [...newDiet.meals, { name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]
    });
  };

  const handleSaveDiet = async () => {
    try {
      await addDoc(collection(db, 'diets'), {
        ...newDiet,
        uid: user.uid
      });
      // Update checkin
      await addDoc(collection(db, 'checkins'), {
        uid: user.uid,
        date: newDiet.date,
        dietOnTrack: true,
        waterGoalMet: newDiet.waterIntake >= (profile?.dailyWaterGoal || 2500)
      });
      setShowAddModal(false);
      setNewDiet({
        date: format(new Date(), 'yyyy-MM-dd'),
        meals: [{ name: '', calories: 0, protein: 0, carbs: 0, fat: 0 }],
        waterIntake: 0,
        notes: ''
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDiet = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'diets', id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
          Minha <span className="text-orange-500">Dieta</span>
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-black shadow-lg shadow-orange-500/20"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <div className="space-y-4">
        {diets.map((diet) => {
          const totalCals = diet.meals.reduce((acc: number, m: any) => acc + (m.calories || 0), 0);
          const totalProt = diet.meals.reduce((acc: number, m: any) => acc + (m.protein || 0), 0);
          
          return (
            <motion.div 
              layout
              key={diet.id}
              className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-black italic uppercase leading-tight">
                      {totalCals} <span className="text-xs font-normal not-italic text-zinc-500">kcal</span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      {format(new Date(diet.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-blue-500">
                    <Droplets size={14} />
                    <span className="text-[10px] font-bold">{diet.waterIntake}ml</span>
                  </div>
                  <button 
                    onClick={() => handleDeleteDiet(diet.id)}
                    className="text-zinc-700 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {diet.meals.map((meal: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm font-bold text-zinc-300">{meal.name}</span>
                    <div className="flex gap-3 text-[10px] font-black italic uppercase text-orange-500">
                      <span>{meal.calories}kcal</span>
                      <span className="text-zinc-600">{meal.protein}g P</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add Diet Modal */}
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
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Log de Dieta</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-500"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold"
                      value={newDiet.date}
                      onChange={(e) => setNewDiet({...newDiet, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Água (ml)</label>
                    <input 
                      type="number" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white font-bold"
                      value={newDiet.waterIntake || ''}
                      onChange={(e) => setNewDiet({...newDiet, waterIntake: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Refeições</label>
                  <div className="space-y-4">
                    {newDiet.meals.map((meal, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Refeição"
                          className="col-span-6 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold"
                          value={meal.name}
                          onChange={(e) => {
                            const newMeals = [...newDiet.meals];
                            newMeals[i].name = e.target.value;
                            setNewDiet({...newDiet, meals: newMeals});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="kcal"
                          className="col-span-3 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-center"
                          value={meal.calories || ''}
                          onChange={(e) => {
                            const newMeals = [...newDiet.meals];
                            newMeals[i].calories = parseInt(e.target.value);
                            setNewDiet({...newDiet, meals: newMeals});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="P(g)"
                          className="col-span-3 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-xs font-bold text-center"
                          value={meal.protein || ''}
                          onChange={(e) => {
                            const newMeals = [...newDiet.meals];
                            newMeals[i].protein = parseInt(e.target.value);
                            setNewDiet({...newDiet, meals: newMeals});
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={handleAddMeal}
                      className="w-full py-3 border border-dashed border-zinc-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition-all"
                    >
                      + Adicionar Refeição
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleSaveDiet}
                  className="w-full bg-orange-500 text-black font-black italic uppercase py-4 rounded-2xl shadow-lg shadow-orange-500/20"
                >
                  Salvar Dieta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
