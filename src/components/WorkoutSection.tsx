import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc, updateDoc } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Dumbbell, X, Play, Check, TrendingUp, ChevronDown, ChevronUp, Calendar, Award, Edit2, Flame, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface WorkoutSectionProps {
  user: User;
  profile?: any;
}

export default function WorkoutSection({ user, profile }: WorkoutSectionProps) {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<any | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Aerobic states
  const [aerobics, setAerobics] = useState<any[]>([]);
  const [showAddAerobicModal, setShowAddAerobicModal] = useState(false);
  const [calculatingAerobic, setCalculatingAerobic] = useState(false);
  const [computedKcal, setComputedKcal] = useState<number | null>(null);
  const [computedExplanation, setComputedExplanation] = useState<string | null>(null);
  const [computedMet, setComputedMet] = useState<number | null>(null);

  const [newAerobic, setNewAerobic] = useState({
    type: '',
    duration: 30,
    intensity: 'moderado',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });
  
  // Real-time workout tracking state
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const [newWorkout, setNewWorkout] = useState({
    type: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    exercises: [{ name: '', sets: 0, reps: 0, weight: 0 }],
    notes: ''
  });

  const [selectedExercise, setSelectedExercise] = useState<string>('');

  useEffect(() => {
    const q = query(
      collection(db, 'workouts'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAerobics = query(
      collection(db, 'aerobics'),
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );
    const unsubscribeAerobics = onSnapshot(qAerobics, (snapshot) => {
      setAerobics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribe();
      unsubscribeAerobics();
    };
  }, [user.uid]);

  // Derive unique exercise names for load selection graph
  const allExerciseNames = Array.from(
    new Set(
      workouts.flatMap(w => w.exercises?.map((ex: any) => ex.name) || [])
    )
  ).filter(Boolean);

  // Auto-select first exercise name if none is active
  useEffect(() => {
    if (allExerciseNames.length > 0 && !selectedExercise) {
      setSelectedExercise(allExerciseNames[0]);
    }
  }, [allExerciseNames, selectedExercise]);

  // Format data for the chart selectively
  const chartData = workouts
    .filter(w => w.exercises?.some((ex: any) => ex.name?.toLowerCase() === selectedExercise?.toLowerCase() && ex.weight > 0))
    .map(w => {
      const ex = w.exercises.find((ex: any) => ex.name?.toLowerCase() === selectedExercise?.toLowerCase());
      return {
        date: format(new Date(w.date + 'T00:00:00'), "dd/MM"),
        rawDate: w.date,
        carga: ex.weight,
        name: ex.name
      };
    })
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate));

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
      // Add standard checkin
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

  // Aerobics calculation and save handlers using server endpoint
  const handleCalculateAerobic = async () => {
    if (!newAerobic.type || !newAerobic.duration) return null;
    setCalculatingAerobic(true);
    try {
      const response = await fetch(`${window.location.origin}/api/aerobics-calories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newAerobic.type,
          duration: Number(newAerobic.duration),
          intensity: newAerobic.intensity,
          userWeight: profile?.weight || profile?.bodyWeight || 68
        })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setComputedKcal(resData.data.caloriesBurned);
        setComputedExplanation(resData.data.explanation);
        setComputedMet(resData.data.metUsed);
        setCalculatingAerobic(false);
        return resData.data;
      }
    } catch (e) {
      console.error("Erro ao calcular calorias do aeróbico com IA:", e);
    }
    
    // Offline client fallback
    let fallbackMet = 5.0;
    const t = newAerobic.type.toLowerCase();
    const ints = newAerobic.intensity;
    if (t.includes("corrida") || t.includes("run")) fallbackMet = ints === "baixo" ? 7.0 : ints === "alto" ? 12.0 : 9.8;
    else if (t.includes("volei") || t.includes("vôlei")) fallbackMet = ints === "baixo" ? 3.0 : ints === "alto" ? 6.0 : 4.0;
    else if (t.includes("natacao") || t.includes("natação")) fallbackMet = ints === "baixo" ? 4.5 : ints === "alto" ? 8.0 : 6.0;
    else if (t.includes("amament") || t.includes("peito")) fallbackMet = ints === "baixo" ? 2.5 : ints === "alto" ? 4.5 : 3.5;
    else if (t.includes("treino") || t.includes("muscul")) fallbackMet = ints === "baixo" ? 3.5 : ints === "alto" ? 7.0 : 5.0;

    const mass = profile?.weight || profile?.bodyWeight || 68;
    const computedBurn = Math.round(fallbackMet * mass * (newAerobic.duration / 60));
    setComputedKcal(computedBurn);
    setComputedMet(fallbackMet);
    setComputedExplanation(`Cálculo offline: ${newAerobic.type} (${fallbackMet} MET)`);
    setCalculatingAerobic(false);
    return { caloriesBurned: computedBurn, metUsed: fallbackMet, explanation: `Cálculo offline: ${newAerobic.type}` };
  };

  const handleSaveAerobic = async () => {
    if (!newAerobic.type || !newAerobic.duration) return;
    
    setCalculatingAerobic(true);
    try {
      let finalKcal = computedKcal;
      let finalExplanation = computedExplanation;
      let finalMet = computedMet;

      if (finalKcal === null) {
        const calculated = await handleCalculateAerobic();
        if (calculated) {
          finalKcal = calculated.caloriesBurned;
          finalExplanation = calculated.explanation;
          finalMet = calculated.metUsed;
        }
      }

      await addDoc(collection(db, 'aerobics'), {
        uid: user.uid,
        type: newAerobic.type,
        duration: Number(newAerobic.duration),
        intensity: newAerobic.intensity,
        date: newAerobic.date,
        caloriesBurned: finalKcal || 150,
        metUsed: finalMet || 5.0,
        explanation: finalExplanation || 'Registrado com IA',
        notes: newAerobic.notes || ''
      });

      // Synchronize with check-in (mark workoutDone as complete for this day)
      // Query checkins of the target day first
      await addDoc(collection(db, 'checkins'), {
        uid: user.uid,
        date: newAerobic.date,
        workoutDone: true
      });

      setShowAddAerobicModal(false);
      setNewAerobic({
        type: '',
        duration: 30,
        intensity: 'moderado',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
      });
      setComputedKcal(null);
      setComputedExplanation(null);
      setComputedMet(null);
    } catch (e) {
      console.error("Erro ao salvar atividade aeróbica:", e);
    } finally {
      setCalculatingAerobic(false);
    }
  };

  const handleDeleteAerobic = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Deseja excluir esta atividade aeróbica?")) {
      try {
        await deleteDoc(doc(db, 'aerobics', id));
      } catch (e) {
        console.error("Erro ao excluir aeróbico:", e);
      }
    }
  };

  const handleDeleteWorkout = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open/close accordion
    if (confirm("Tem certeza que deseja excluir este treino?")) {
      try {
        await deleteDoc(doc(db, 'workouts', id));
        if (expandedWorkoutId === id) setExpandedWorkoutId(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRemoveNewExercise = (index: number) => {
    const filtered = newWorkout.exercises.filter((_, idx) => idx !== index);
    setNewWorkout({
      ...newWorkout,
      exercises: filtered.length > 0 ? filtered : [{ name: '', sets: 0, reps: 0, weight: 0 }]
    });
  };

  const handleOpenEdit = (workout: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering open/close accordion
    setEditingWorkout(JSON.parse(JSON.stringify(workout))); // deep clone
    setShowEditModal(true);
  };

  const handleEditAddExercise = () => {
    if (!editingWorkout) return;
    setEditingWorkout({
      ...editingWorkout,
      exercises: [...editingWorkout.exercises, { name: '', sets: 0, reps: 0, weight: 0 }]
    });
  };

  const handleRemoveEditExercise = (index: number) => {
    if (!editingWorkout) return;
    const filtered = editingWorkout.exercises.filter((_: any, idx: number) => idx !== index);
    setEditingWorkout({
      ...editingWorkout,
      exercises: filtered.length > 0 ? filtered : [{ name: '', sets: 0, reps: 0, weight: 0 }]
    });
  };

  const handleUpdateEditWorkout = async () => {
    if (!editingWorkout || !editingWorkout.type) return;
    try {
      const workoutRef = doc(db, 'workouts', editingWorkout.id);
      await updateDoc(workoutRef, {
        type: editingWorkout.type,
        exercises: editingWorkout.exercises,
        notes: editingWorkout.notes || ''
      });
      setShowEditModal(false);
      setEditingWorkout(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Workout live tracker actions
  const handleStartWorkoutSession = (workout: any) => {
    setActiveSession({
      originalWorkoutId: workout.id,
      type: workout.type,
      exercises: workout.exercises.map((ex: any) => ({
        ...ex,
        completed: false // checklist check-in status per exercise
      }))
    });
  };

  const handleToggleExerciseCheckin = (index: number) => {
    if (!activeSession) return;
    const updated = [...activeSession.exercises];
    updated[index].completed = !updated[index].completed;
    setActiveSession({ ...activeSession, exercises: updated });
  };

  const handleAdjustWeight = (index: number, amt: number) => {
    if (!activeSession) return;
    const updated = [...activeSession.exercises];
    updated[index].weight = Math.max(0, (updated[index].weight || 0) + amt);
    setActiveSession({ ...activeSession, exercises: updated });
  };

  const handleWeightInputChange = (index: number, val: string) => {
    if (!activeSession) return;
    const numeric = parseFloat(val) || 0;
    const updated = [...activeSession.exercises];
    updated[index].weight = numeric;
    setActiveSession({ ...activeSession, exercises: updated });
  };

  const handleFinishWorkoutSession = async () => {
    if (!activeSession) return;
    try {
      // 1. Update the original template workout weights so next run is pre-filled with the latest loads
      const originalWorkout = workouts.find(w => w.id === activeSession.originalWorkoutId);
      if (originalWorkout) {
        const updatedTemplateExercises = originalWorkout.exercises.map((origEx: any) => {
          const matchedSessionEx = activeSession.exercises.find((se: any) => se.name === origEx.name);
          return {
            ...origEx,
            weight: matchedSessionEx ? matchedSessionEx.weight : origEx.weight
          };
        });
        await updateDoc(doc(db, 'workouts', activeSession.originalWorkoutId), {
          exercises: updatedTemplateExercises
        });
      }

      // 2. Add as a historical Session Log in workouts collection so charts read it chronologically
      const todayString = format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'workouts'), {
        uid: user.uid,
        type: activeSession.type,
        date: todayString,
        isSession: true, // Mark this to differentiate from basic plan templates
        exercises: activeSession.exercises.map((ex: any) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight
        })),
        notes: "Sessão concluída com sucesso! 🔥"
      });

      // 3. Mark daily task check-in
      await addDoc(collection(db, 'checkins'), {
        uid: user.uid,
        date: todayString,
        workoutDone: true
      });

      // Show celebration feedback & close
      setActiveSession(null);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  // Only display current base templates to prevent layout spamming from list entries
  const workoutTemplates = workouts.filter(w => !w.isSession);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-800">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-800">
          Meus <span className="text-pink-500">Treinos</span>
        </h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-pink-400/25 hover:opacity-90 cursor-pointer animate-pulse"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* TRAINING LIST SECTION */}
      <div className="space-y-4">
        {workoutTemplates.length === 0 ? (
          <div className="bg-white p-8 rounded-[2rem] border border-pink-100 text-center space-y-4">
            <Dumbbell className="mx-auto text-pink-300 animate-bounce" size={40} />
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-650">Nenhum plano de treino cadastrado</p>
              <p className="text-xs text-zinc-400">Toque no botão de "+" para criar sua primeira tabela de treino!</p>
            </div>
          </div>
        ) : (
          workoutTemplates.map((workout) => (
            <motion.div 
              layout
              key={workout.id}
              className={`bg-white rounded-[2rem] border shadow-sm transition-all overflow-hidden ${
                expandedWorkoutId === workout.id ? 'border-pink-300 shadow-md ring-1 ring-pink-100' : 'border-pink-100 hover:border-pink-200'
              }`}
            >
              {/* Card Header (Accordion Control) */}
              <div 
                onClick={() => setExpandedWorkoutId(expandedWorkoutId === workout.id ? null : workout.id)}
                className="p-6 cursor-pointer flex items-center justify-between select-none hover:bg-pink-50/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                    <Dumbbell size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black italic uppercase leading-tight text-zinc-800">{workout.type}</h4>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#d4af37] bg-yellow-50 px-2 py-0.5 rounded-full">
                      {workout.exercises?.length || 0} EXERCÍCIOS
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleOpenEdit(workout, e)}
                    className="text-pink-400 hover:text-pink-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-pink-50/60"
                    title="Editar Treino"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteWorkout(workout.id, e)}
                    className="text-rose-450 hover:text-rose-600 transition-colors cursor-pointer p-2 rounded-lg hover:bg-rose-50/50"
                    title="Excluir Treino"
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="text-pink-400 p-1">
                    {expandedWorkoutId === workout.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              <AnimatePresence>
                {expandedWorkoutId === workout.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pb-6 border-t border-pink-50/60 bg-gradient-to-b from-[#fffafa]/20 to-[#ffffff]"
                  >
                    {/* Primary Button to start workout session */}
                    <div className="py-4">
                      <button
                        onClick={() => handleStartWorkoutSession(workout)}
                        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold uppercase text-xs tracking-wider rounded-xl shadow-md shadow-pink-200/50 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <Play size={14} className="fill-current" /> Iniciar Treino
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">Lista de Exercícios</p>
                      {workout.exercises?.map((ex: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-pink-50/40 last:border-0 text-xs">
                          <span className="font-semibold text-zinc-700">{ex.name}</span>
                          <div className="flex gap-3 text-[10px] font-black italic uppercase text-pink-500 bg-pink-50/45 px-2.5 py-1 rounded-lg">
                            <span>{ex.sets} s</span>
                            <span>{ex.reps} r</span>
                            <span className="text-[#d4af37]">{ex.weight} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {workout.notes && (
                      <div className="mt-4 p-3.5 bg-neutral-50 rounded-xl text-xs text-zinc-500 italic">
                        <strong>Obs:</strong> {workout.notes}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>

      {/* SEÇÃO: ATIVIDADES AERÓBICAS (COM ESTIMATIVA DE CALORIAS POR IA) */}
      <div className="bg-gradient-to-br from-[#fffafe] to-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 flex items-center gap-1">
              <Sparkles size={12} className="text-[#d4af37]" /> Fitness Aeróbico
            </span>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-zinc-850 mt-1">Atividades Aeróbicas <span className="text-[#d4af37]">com IA</span></h3>
          </div>
          <button
            onClick={() => setShowAddAerobicModal(true)}
            className="px-4 py-2 bg-[#d4af37] text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-md shadow-yellow-500/10 flex items-center gap-1 border-0"
          >
            <Plus size={14} strokeWidth={3} />
            Registrar Aeróbico
          </button>
        </div>

        {/* List of registered aerobics */}
        <div className="space-y-3">
          {aerobics.length === 0 ? (
            <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-pink-100 space-y-2">
              <Flame size={32} className="text-pink-300 mx-auto animate-bounce" />
              <div>
                <p className="text-xs font-bold text-zinc-500">Nenhum aeróbico registrado ainda</p>
                <p className="text-[10px] text-zinc-450 mt-1 block">Insira corrida, vôlei, natação, amamentação para que a IA desconte as calorias gasta.</p>
              </div>
            </div>
          ) : (
            aerobics.map((aer) => (
              <div 
                key={aer.id}
                className="bg-white p-4 rounded-2xl border border-pink-50 hover:border-pink-200/60 shadow-sm transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
                    <Flame size={20} className="fill-orange-100 text-orange-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black italic uppercase tracking-tight text-zinc-800 truncate leading-none">{aer.type}</h4>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 leading-none">
                        {aer.intensity}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 font-bold">
                      {aer.duration} min • {format(new Date(aer.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    {aer.explanation && (
                      <p className="text-[9px] text-zinc-500 italic mt-1 font-semibold select-none">
                        💡 {aer.explanation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black italic tracking-tight text-[#d4af37]">
                      -{aer.caloriesBurned} <span className="text-[9px] font-bold not-italic text-zinc-400 uppercase">kcal</span>
                    </div>
                    {aer.metUsed && <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">{aer.metUsed} MET</span>}
                  </div>
                  <button
                    onClick={(e) => handleDeleteAerobic(aer.id, e)}
                    className="text-zinc-400 hover:text-rose-500 cursor-pointer p-1.5 hover:bg-rose-50 rounded-lg transition-all border-0 bg-transparent flex items-center justify-center"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: REGISTRAR ATIVIDADE AERÓBICA COM IA */}
      <AnimatePresence>
        {showAddAerobicModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[2rem] border border-pink-100 p-6 shadow-2xl space-y-6 text-zinc-805"
            >
              <div className="flex items-center justify-between border-b border-pink-50 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[#d4af37] animate-pulse animate-bounce" />
                  <h3 className="text-xl font-extrabold italic uppercase tracking-tight text-zinc-800">
                    Estimar Aeróbico <span className="text-pink-500">com IA</span>
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddAerobicModal(false)}
                  className="text-zinc-400 hover:text-zinc-650 p-1 bg-zinc-50 border-0 rounded-lg cursor-pointer flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Popular Pills */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400 mb-2 block">
                    Sugestões de Atividade
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Corrida", "Vôlei", "Natação", "Amamentação", "Treino de musculação", "Caminhada"].map((suge) => (
                      <button
                        key={suge}
                        type="button"
                        onClick={() => {
                          setNewAerobic({ ...newAerobic, type: suge });
                          setComputedKcal(null);
                          setComputedExplanation(null);
                        }}
                        className={`text-[9px] font-extrabold uppercase py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                          newAerobic.type === suge
                            ? 'bg-gradient-to-r from-pink-500 to-rose-450 text-white border-pink-400 shadow-sm shadow-pink-300/15'
                            : 'bg-white border-pink-50 text-zinc-500 hover:border-pink-200'
                        }`}
                      >
                        {suge === "Amamentação" ? "🍼 Amamentação" : suge}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Type */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 block">Nome da Atividade</label>
                  <input
                    type="text"
                    placeholder="Ex: Corrida na esteira, CrossFit, Futevôlei"
                    className="w-full bg-[#fffcfd] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold italic focus:ring-1 focus:ring-pink-300 focus:outline-none"
                    value={newAerobic.type}
                    onChange={(e) => {
                      setNewAerobic({ ...newAerobic, type: e.target.value });
                      setComputedKcal(null);
                      setComputedExplanation(null);
                    }}
                  />
                </div>

                {/* Duration and Intensity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#d4af37] mb-1.5 block">Tempo (Minutos)</label>
                    <input
                      type="number"
                      placeholder="Ex: 30"
                      min={1}
                      className="w-full bg-[#fffcfd] border border-pink-100 rounded-xl px-4 py-2.5 text-zinc-800 font-bold text-center focus:ring-1 focus:ring-pink-300 focus:outline-none"
                      value={newAerobic.duration || ''}
                      onChange={(e) => {
                        setNewAerobic({ ...newAerobic, duration: Number(e.target.value) || 0 });
                        setComputedKcal(null);
                        setComputedExplanation(null);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-pink-500 mb-1.5 block">Intensidade</label>
                    <select
                      className="w-full bg-[#fffcfd] border border-pink-100 rounded-xl px-2 py-2.5 text-xs font-bold text-zinc-700 cursor-pointer focus:ring-1 focus:ring-pink-300 focus:outline-none"
                      value={newAerobic.intensity}
                      onChange={(e) => {
                        setNewAerobic({ ...newAerobic, intensity: e.target.value });
                        setComputedKcal(null);
                        setComputedExplanation(null);
                      }}
                    >
                      <option value="baixo">Leve / Baixo</option>
                      <option value="moderado">Moderado</option>
                      <option value="alto">Intenso / Alto</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 block">Data do Exercício</label>
                  <input
                    type="date"
                    className="w-full bg-[#fffcfd] border border-pink-100 rounded-xl px-4 py-2.5 text-center text-xs font-bold text-zinc-700 focus:outline-none"
                    value={newAerobic.date}
                    onChange={(e) => setNewAerobic({ ...newAerobic, date: e.target.value })}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 block">Observações (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Amamentação ou trote na praia"
                    className="w-full bg-[#fffcfd] border border-pink-100 rounded-xl px-4 py-2 text-xs text-zinc-500 focus:outline-none"
                    value={newAerobic.notes || ''}
                    onChange={(e) => setNewAerobic({ ...newAerobic, notes: e.target.value })}
                  />
                </div>

                {/* Gemini preview estimation block */}
                {(newAerobic.type && newAerobic.duration > 0) && (
                  <div className="bg-gradient-to-tr from-yellow-50/30 to-pink-50/20 p-4 rounded-2xl border border-pink-100/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-none">Previsão Google Gemini AI 🔮</span>
                      <button
                        type="button"
                        onClick={handleCalculateAerobic}
                        disabled={calculatingAerobic}
                        className="text-[9px] bg-pink-500 text-white font-extrabold uppercase px-2.5 py-1 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all border-0 cursor-pointer"
                      >
                        {calculatingAerobic ? "Estimando..." : "Calcular com IA"}
                      </button>
                    </div>

                    {computedKcal !== null ? (
                      <div className="space-y-1">
                        <div className="text-2xl font-black italic text-zinc-900 leading-none mt-1">
                          {computedKcal} <span className="text-[11px] font-bold not-italic text-zinc-500 uppercase">kcal gastas</span>
                        </div>
                        {computedMet && <div className="text-[8px] text-[#d4af37] font-black uppercase">Esporte classe {computedMet} MET</div>}
                        {computedExplanation && (
                          <p className="text-[10px] text-zinc-500 italic font-medium leading-relaxed bg-white/60 p-2 rounded-xl border border-pink-50/50 mt-1">
                            {computedExplanation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[9px] text-zinc-400 font-bold">Toque em "Calcular com IA" ou salve direto para estimar automaticamente!</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAerobicModal(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 uppercase text-xs font-black rounded-xl cursor-pointer border-0"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!newAerobic.type || !newAerobic.duration || calculatingAerobic}
                  onClick={handleSaveAerobic}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-455 text-white font-black uppercase text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 border-0"
                >
                  {calculatingAerobic ? "Salvando..." : "Salvar Atividade"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SEÇÃO: GRÁFICO DE EVOLUÇÃO DAS CARGAS (MOVED DOWN) */}
      {workouts.length > 0 && (
        <div className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                <TrendingUp size={16} />
              </div>
              <h3 className="text-sm font-black italic uppercase text-zinc-700">Evolução de Cargas</h3>
            </div>
            
            {/* Filter Dropdown */}
            {allExerciseNames.length > 0 && (
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-[#fffafa] border border-pink-100 rounded-xl px-3 py-2 text-xs font-bold text-zinc-700 focus:outline-none focus:ring-2 focus:ring-pink-300 cursor-pointer min-w-[150px]"
              >
                {allExerciseNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedExercise ? (
            chartData.length >= 2 ? (
              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 15, right: 15, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
                      axisLine={false}
                      tickLine={false}
                      unit="kg"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #fbcfe8',
                        borderRadius: '1rem',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        boxShadow: '0 4px 12px rgba(236,72,153,0.08)'
                      }}
                      formatter={(value: any) => [`${value} kg`, 'Carga']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="carga" 
                      stroke="#ec4899" 
                      strokeWidth={3} 
                      activeDot={{ r: 6, fill: '#ffcb05', stroke: '#fff', strokeWidth: 2 }} 
                      dot={{ r: 4, fill: '#ec4899', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 bg-[#fffafa] rounded-2xl border border-dashed border-pink-100 flex flex-col items-center justify-center text-center p-4">
                <Dumbbell className="text-pink-300 mb-2" size={24} />
                <p className="text-xs font-bold text-zinc-500">Histórico de cargas ativo</p>
                <p className="text-[10px] text-zinc-400 mt-1">Conclua seus treinos para preencher os pontos no gráfico de evolução.</p>
              </div>
            )
          ) : (
            <div className="h-28 bg-[#fffafa] rounded-2xl border border-dashed border-pink-100 flex items-center justify-center text-zinc-400 text-xs font-semibold">
              Monte seu primeiro treino para acompanhar sua evolução de cargas.
            </div>
          )}
        </div>
      )}

      {/* ACTIVE WORKOUT SESSION TRACKER INTERFACE MODAL */}
      <AnimatePresence>
        {activeSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ y: 150, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 150, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 border border-pink-100 max-h-[90vh] overflow-y-auto text-zinc-800 space-y-6 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-pink-50 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                  </span>
                  <div>
                    <h3 className="text-xl font-extrabold italic uppercase tracking-tight text-zinc-800 leading-tight">Treino Ativo</h3>
                    <p className="text-[10px] text-[#d4af37] font-bold uppercase tracking-widest">{activeSession.type}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (confirm("Deseja mesmo cancelar e abandonar esta sessão de treino atual?")) {
                      setActiveSession(null);
                    }
                  }} 
                  className="text-zinc-400 hover:text-zinc-650 cursor-pointer p-1.5 hover:bg-zinc-100 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Exercises check-in and weight control list */}
              <div className="space-y-4 flex-1">
                <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 flex justify-between">
                  <span>Mapear Check-in</span>
                  <span>Ajustar Carga Atual</span>
                </div>

                <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
                  {activeSession.exercises.map((ex: any, i: number) => (
                    <div 
                      key={i} 
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${
                        ex.completed 
                          ? 'bg-pink-50/10 border-pink-200 ring-1 ring-pink-100' 
                          : 'bg-white border-zinc-100 hover:border-zinc-200'
                      }`}
                    >
                      {/* Check-in Trigger */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleToggleExerciseCheckin(i)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer border transition-all ${
                            ex.completed 
                              ? 'bg-pink-500 border-pink-500 text-white' 
                              : 'border-zinc-300 hover:border-pink-300 bg-[#fffafa]/40'
                          }`}
                        >
                          {ex.completed && <Check size={14} strokeWidth={4} />}
                        </button>
                        
                        <div>
                          <p className={`text-xs font-bold leading-tight ${ex.completed ? 'text-zinc-900 line-through' : 'text-zinc-700'}`}>
                            {ex.name}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">
                            {ex.sets ?? 0} Séries x {ex.reps ?? 0} Reps
                          </p>
                        </div>
                      </div>

                      {/* Weight adjusting control */}
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => handleAdjustWeight(i, -2)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 font-black text-xs text-zinc-650 flex items-center justify-center hover:bg-zinc-200 cursor-pointer select-none"
                        >
                          -2
                        </button>
                        <button 
                          onClick={() => handleAdjustWeight(i, -0.5)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 font-extrabold text-[10px] text-zinc-650 flex items-center justify-center hover:bg-zinc-200 cursor-pointer select-none"
                        >
                          -.5
                        </button>
                        
                        {/* Direct weight input */}
                        <div className="flex items-center bg-[#fffafa] border border-pink-100 rounded-lg px-2 w-16 text-center">
                          <input 
                            type="number"
                            step="any"
                            value={ex.weight ?? 0}
                            onChange={(e) => handleWeightInputChange(i, e.target.value)}
                            className="w-full text-center text-xs font-black italic text-pink-500 bg-transparent focus:outline-none"
                          />
                          <span className="text-[10px] font-bold text-zinc-400">kg</span>
                        </div>

                        <button 
                          onClick={() => handleAdjustWeight(i, 0.5)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 font-extrabold text-[10px] text-zinc-650 flex items-center justify-center hover:bg-zinc-200 cursor-pointer select-none"
                        >
                          +.5
                        </button>
                        <button 
                          onClick={() => handleAdjustWeight(i, 2)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 font-black text-xs text-zinc-650 flex items-center justify-center hover:bg-zinc-200 cursor-pointer select-none"
                        >
                          +2
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Action Control */}
              <button
                onClick={handleFinishWorkoutSession}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-pink-200/50 hover:opacity-95 text-center flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Award size={15} /> Concluir Treino de Hoje
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CELEBRATION FEEDBACK TRANSITION BANNER */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-gradient-to-r from-pink-500 to-rose-400 text-white font-black italic uppercase text-xs tracking-wider px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-pink-300"
          >
            <span className="text-sm">🔥</span> Treino Concluído com Sucesso! Check-in e Cargas Registrados.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Workout Modal */}
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
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 max-h-[90vh] overflow-y-auto text-zinc-800"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-850">Novo Treino</h3>
                <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Tipo de Treino</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Perna Completo, Glúteos"
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold italic"
                    value={newWorkout.type}
                    onChange={(e) => setNewWorkout({...newWorkout, type: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Exercícios</label>
                  <div className="space-y-4">
                    {newWorkout.exercises.map((ex, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Nome"
                          className="col-span-5 bg-[#fffafa] border border-pink-100 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800"
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
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.sets || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].sets = parseInt(e.target.value) || 0;
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="R"
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.reps || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].reps = parseInt(e.target.value) || 0;
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="kg"
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.weight || ''}
                          onChange={(e) => {
                            const newExs = [...newWorkout.exercises];
                            newExs[i].weight = parseInt(e.target.value) || 0;
                            setNewWorkout({...newWorkout, exercises: newExs});
                          }}
                        />
                        <button
                          onClick={() => handleRemoveNewExercise(i)}
                          className="col-span-1 text-rose-400 hover:text-rose-600 cursor-pointer p-1 flex justify-center items-center"
                          type="button"
                          title="Remover Exercício"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={handleAddExercise}
                      className="w-full py-3 border border-dashed border-pink-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-pink-400 hover:border-pink-500 hover:text-pink-500 transition-all cursor-pointer"
                    >
                      + Adicionar Exercício
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Observações (Opcional)</label>
                  <textarea 
                    placeholder="Instruções extras, pausas recomendadas..."
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800"
                    rows={2}
                    value={newWorkout.notes}
                    onChange={(e) => setNewWorkout({...newWorkout, notes: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleSaveWorkout}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-2xl shadow-lg shadow-pink-200/50 cursor-pointer hover:opacity-95 transition-all text-sm font-black"
                >
                  Salvar Treino
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Workout Modal */}
      <AnimatePresence>
        {showEditModal && editingWorkout && (
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
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 max-h-[90vh] overflow-y-auto text-zinc-800"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-zinc-850">Alterar Treino</h3>
                <button 
                  onClick={() => { setShowEditModal(false); setEditingWorkout(null); }} 
                  className="text-zinc-400 hover:text-zinc-650 cursor-pointer"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Tipo de Treino</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Perna Completo, Glúteos"
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-2xl px-4 py-3 text-zinc-800 font-bold italic"
                    value={editingWorkout.type}
                    onChange={(e) => setEditingWorkout({...editingWorkout, type: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Exercícios</label>
                  <div className="space-y-4">
                    {editingWorkout.exercises.map((ex: any, i: number) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder="Nome"
                          className="col-span-5 bg-[#fffafa] border border-pink-100 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-800"
                          value={ex.name}
                          onChange={(e) => {
                            const newExs = [...editingWorkout.exercises];
                            newExs[i].name = e.target.value;
                            setEditingWorkout({...editingWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="S"
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.sets || ''}
                          onChange={(e) => {
                            const newExs = [...editingWorkout.exercises];
                            newExs[i].sets = parseInt(e.target.value) || 0;
                            setEditingWorkout({...editingWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="R"
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.reps || ''}
                          onChange={(e) => {
                            const newExs = [...editingWorkout.exercises];
                            newExs[i].reps = parseInt(e.target.value) || 0;
                            setEditingWorkout({...editingWorkout, exercises: newExs});
                          }}
                        />
                        <input 
                          type="number" 
                          placeholder="kg"
                          step="any"
                          className="col-span-2 bg-[#fffafa] border border-pink-100 rounded-xl px-1.5 py-2 text-xs font-bold text-center text-zinc-800"
                          value={ex.weight || ''}
                          onChange={(e) => {
                            const newExs = [...editingWorkout.exercises];
                            newExs[i].weight = parseFloat(e.target.value) || 0;
                            setEditingWorkout({...editingWorkout, exercises: newExs});
                          }}
                        />
                        <button
                          onClick={() => handleRemoveEditExercise(i)}
                          className="col-span-1 text-rose-450 hover:text-rose-600 cursor-pointer p-1 flex justify-center items-center"
                          type="button"
                          title="Remover Exercício"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={handleEditAddExercise}
                      className="w-full py-3 border border-dashed border-pink-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-pink-400 hover:border-pink-500 hover:text-pink-500 transition-all cursor-pointer"
                    >
                      + Adicionar Exercício
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Observações (Opcional)</label>
                  <textarea 
                    placeholder="Instruções extras, pausas recomendadas..."
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800"
                    rows={2}
                    value={editingWorkout.notes || ''}
                    onChange={(e) => setEditingWorkout({...editingWorkout, notes: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleUpdateEditWorkout}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-2xl shadow-lg shadow-pink-200/50 cursor-pointer hover:opacity-95 transition-all text-sm font-black"
                >
                  Confirmar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

