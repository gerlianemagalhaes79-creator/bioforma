import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  User, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from '../firebase';
import { 
  format, 
  subDays, 
  subWeeks, 
  subMonths, 
  isSameDay, 
  startOfWeek, 
  startOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfWeek,
  endOfMonth,
  addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Droplets, Target, Activity, Check, Plus, AlertCircle, Dumbbell, 
  FileText, Camera, Calendar, Info, Scale, Trash2, ChevronLeft, ChevronRight,
  Sparkles, Sliders, Image as ImageIcon, Heart
} from 'lucide-react';

interface ProgressTrackerProps {
  user: User;
  profile: any;
}

type TimeFrame = 'daily' | 'weekly' | 'monthly';
type TrackerGroup = 'comp' | 'circ' | 'dobras';
type ProgressSubTab = 'daily' | 'trends' | 'new-record';

export default function ProgressTracker({ user, profile }: ProgressTrackerProps) {
  // Navigation Subs
  const [activeSubTab, setActiveSubTab] = useState<ProgressSubTab>('daily');
  
  // Date view selectors
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Trends Config
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('daily');
  const [trackerGroup, setTrackerGroup] = useState<TrackerGroup>('comp');
  const [selectedExamChart, setSelectedExamChart] = useState<string>('');

  // Firestore Real-time Collections
  const [metrics, setMetrics] = useState<any[]>([]);
  const [diets, setDiets] = useState<any[]>([]);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);

  // Form selections and flags
  const [metricFormTab, setMetricFormTab] = useState<'bio' | 'medidas' | 'dobras'>('bio');
  const [uploadAngle, setUploadAngle] = useState<string>('Front');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Before / After Comparison states
  const [compareAngle, setCompareAngle] = useState<string>('Front');
  const [comparePhotoAId, setComparePhotoAId] = useState<string>('');
  const [comparePhotoBId, setComparePhotoBId] = useState<string>('');

  // Reset inputs
  const [newMetric, setNewMetric] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: 70,
    bodyFat: 18,
    muscleMass: 35,
    visceralFat: 4,
    waterPercentage: 55,
    chest: 95,
    waist: 80,
    abdomen: 82,
    hip: 95,
    bicepLeft: 32,
    bicepRight: 32,
    thighLeft: 55,
    thighRight: 55,
    calfLeft: 36,
    calfRight: 36,
    bicepsFold: 8,
    tricepsFold: 12,
    subscapularFold: 15,
    suprailiacFold: 14,
    abdominalFold: 18,
    chestFold: 10,
    thighFold: 14,
    notes: ''
  });

  const [newExam, setNewExam] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: '',
    value: 0,
    unit: 'mg/dL',
    result: '',
    notes: ''
  });

  // Load subscriptions
  useEffect(() => {
    const qMetrics = query(collection(db, 'metrics'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const qDiets = query(collection(db, 'diets'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const qCheckins = query(collection(db, 'checkins'), where('uid', '==', user.uid), orderBy('date', 'asc'));
    const qExams = query(collection(db, 'exams'), where('uid', '==', user.uid), orderBy('date', 'desc'));
    const qPhotos = query(collection(db, 'photos'), where('uid', '==', user.uid), orderBy('date', 'desc'));

    const unsubMetrics = onSnapshot(qMetrics, (s) => setMetrics(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubDiets = onSnapshot(qDiets, (s) => setDiets(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubCheckins = onSnapshot(qCheckins, (s) => setCheckins(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubExams = onSnapshot(qExams, (s) => setExams(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubPhotos = onSnapshot(qPhotos, (s) => setPhotos(s.docs.map(d => ({ ...d.data(), id: d.id }))));

    return () => { 
      unsubMetrics(); 
      unsubDiets(); 
      unsubCheckins(); 
      unsubExams(); 
      unsubPhotos(); 
    };
  }, [user.uid]);

  // Extract unique exams types for dropdown chart
  const uniqueExamTypes = useMemo(() => {
    const types = exams.filter(e => e.value !== undefined && e.value > 0).map(e => e.type);
    return Array.from(new Set(types));
  }, [exams]);

  // Set default exam chart
  useEffect(() => {
    if (!selectedExamChart && uniqueExamTypes.length > 0) {
      setSelectedExamChart(uniqueExamTypes[0]);
    }
  }, [uniqueExamTypes, selectedExamChart]);

  // Automatically select default comparator photos
  useEffect(() => {
    const anglePhotos = photos.filter(p => p.angle === compareAngle).sort((a, b) => a.date.localeCompare(b.date));
    if (anglePhotos.length > 0) {
      setComparePhotoAId(anglePhotos[0].id);
      setComparePhotoBId(anglePhotos[anglePhotos.length - 1].id);
    } else {
      setComparePhotoAId('');
      setComparePhotoBId('');
    }
  }, [photos, compareAngle]);

  // Helper date conversions
  const parsedSelectedDate = useMemo(() => {
    try {
      return new Date(selectedDate + 'T00:00:00');
    } catch (_) {
      return new Date();
    }
  }, [selectedDate]);

  // Increments / Decrements day viewport
  const changeDay = (amount: number) => {
    const nextDate = addDays(parsedSelectedDate, amount);
    setSelectedDate(format(nextDate, 'yyyy-MM-dd'));
  };

  // Find entries for selectedDate
  const currentCheckin = useMemo(() => {
    return checkins.find(c => c.date === selectedDate);
  }, [checkins, selectedDate]);

  const currentDiet = useMemo(() => {
    return diets.find(d => d.date === selectedDate);
  }, [diets, selectedDate]);

  const dayPhotos = useMemo(() => {
    return photos.filter(p => p.date === selectedDate);
  }, [photos, selectedDate]);

  // Computed nutritional consumption
  const totalCalories = currentDiet?.meals?.reduce((acc: number, m: any) => acc + (m.calories || 0), 0) || 0;
  const totalProtein = currentDiet?.meals?.reduce((acc: number, m: any) => acc + (m.protein || 0), 0) || 0;
  const totalCarbs = currentDiet?.meals?.reduce((acc: number, m: any) => acc + (m.carbs || 0), 0) || 0;
  const totalFat = currentDiet?.meals?.reduce((acc: number, m: any) => acc + (m.fat || 0), 0) || 0;
  const totalFiber = currentDiet?.meals?.reduce((acc: number, m: any) => acc + (m.fiber || 0), 0) || 0;

  const targetCalories = profile?.dailyCalorieGoal || 2000;
  const targetProtein = profile?.proteinGoal || 130;
  const targetCarbs = profile?.carbGoal || 240;
  const targetFat = profile?.fatGoal || 60;
  const targetFiber = profile?.fiberGoal || 25;
  const targetWater = profile?.dailyWaterGoal || 2500;

  // Toggle checkins
  const handleToggleCheckin = async (dateStr: string, type: 'workoutDone' | 'dietOnTrack') => {
    try {
      const existing = checkins.find(c => c.date === dateStr);
      if (existing) {
        await updateDoc(doc(db, 'checkins', existing.id), {
          [type]: !existing[type]
        });
      } else {
        await addDoc(collection(db, 'checkins'), {
          uid: user.uid,
          date: dateStr,
          [type]: true
        });
      }
    } catch (e) {
      console.error('Error toggling checkin', e);
    }
  };

  // Log water intake
  const handleLogWater = async (amount: number) => {
    try {
      const existingDiet = diets.find(d => d.date === selectedDate);
      if (existingDiet) {
        const updatedWater = Math.max(0, (existingDiet.waterIntake || 0) + amount);
        await updateDoc(doc(db, 'diets', existingDiet.id), {
          waterIntake: updatedWater,
          waterGoalMet: updatedWater >= targetWater
        });

        // Sync checkin too
        const existingCheckin = checkins.find(c => c.date === selectedDate);
        if (existingCheckin) {
          await updateDoc(doc(db, 'checkins', existingCheckin.id), {
            waterGoalMet: updatedWater >= targetWater
          });
        } else {
          await addDoc(collection(db, 'checkins'), {
            uid: user.uid,
            date: selectedDate,
            waterGoalMet: updatedWater >= targetWater
          });
        }
      } else {
        const initialWater = Math.max(0, amount);
        await addDoc(collection(db, 'diets'), {
          uid: user.uid,
          date: selectedDate,
          waterIntake: initialWater,
          meals: [],
          notes: 'Registrado pela via rápida do painel de progresso'
        });

        await addDoc(collection(db, 'checkins'), {
          uid: user.uid,
          date: selectedDate,
          waterGoalMet: initialWater >= targetWater
        });
      }
    } catch (e) {
      console.error('Error logging water', e);
    }
  };

  // Image Processing for body photo
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setCompressedImage(compressedBase64);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Save Progress Photo
  const handleSavePhoto = async () => {
    if (!compressedImage) {
      alert("Por favor selecione uma imagem");
      return;
    }
    try {
      await addDoc(collection(db, 'photos'), {
        uid: user.uid,
        date: selectedDate,
        imageUrl: compressedImage,
        angle: uploadAngle,
        notes: uploadNotes
      });
      setCompressedImage(null);
      setUploadNotes('');
      alert("Foto salva com sucesso no progresso!");
    } catch (e) {
      console.error(e);
    }
  };

  // Save Bioimpedance Metric
  const handleSaveMetric = async () => {
    if (!newMetric.weight || newMetric.weight <= 0) {
      alert("Peso inválido!");
      return;
    }
    try {
      await addDoc(collection(db, 'metrics'), {
        ...newMetric,
        uid: user.uid
      });
      alert("Biometria adicionada!");
      setNewMetric({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: 70,
        bodyFat: 18,
        muscleMass: 35,
        visceralFat: 4,
        waterPercentage: 55,
        chest: 95,
        waist: 80,
        abdomen: 82,
        hip: 95,
        bicepLeft: 32,
        bicepRight: 32,
        thighLeft: 55,
        thighRight: 55,
        calfLeft: 36,
        calfRight: 36,
        bicepsFold: 8,
        tricepsFold: 12,
        subscapularFold: 15,
        suprailiacFold: 14,
        abdominalFold: 18,
        chestFold: 10,
        thighFold: 14,
        notes: ''
      });
      setActiveSubTab('trends');
    } catch (e) {
      console.error(e);
    }
  };

  // Save Exam
  const handleSaveExam = async () => {
    if (!newExam.type) {
      alert("Informe o tipo de laudo");
      return;
    }
    try {
      await addDoc(collection(db, 'exams'), {
        ...newExam,
        uid: user.uid
      });
      alert("Resultado de exame arquivado!");
      setNewExam({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: '',
        value: 0,
        unit: 'mg/dL',
        result: '',
        notes: ''
      });
      setActiveSubTab('trends');
    } catch (e) {
      console.error(e);
    }
  };

  // Compute intervals statistics for Trends
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

      const avgWeight = periodMetrics.length > 0 ? periodMetrics.reduce((acc, m) => acc + m.weight, 0) / periodMetrics.length : null;
      const avgFat = periodMetrics.length > 0 ? periodMetrics.reduce((acc, m) => acc + (m.bodyFat || 0), 0) / periodMetrics.length : null;
      const avgMuscle = periodMetrics.length > 0 ? periodMetrics.reduce((acc, m) => acc + (m.muscleMass || 0), 0) / periodMetrics.length : null;

      const avgWaist = periodMetrics.length > 0 && periodMetrics.some(m => m.waist !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.waist || 0), 0) / periodMetrics.filter(m => m.waist !== undefined).length : null;
      const avgAbdomen = periodMetrics.length > 0 && periodMetrics.some(m => m.abdomen !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.abdomen || 0), 0) / periodMetrics.filter(m => m.abdomen !== undefined).length : null;
      const avgHip = periodMetrics.length > 0 && periodMetrics.some(m => m.hip !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.hip || 0), 0) / periodMetrics.filter(m => m.hip !== undefined).length : null;
      const avgChest = periodMetrics.length > 0 && periodMetrics.some(m => m.chest !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.chest || 0), 0) / periodMetrics.filter(m => m.chest !== undefined).length : null;

      const avgTricepsFold = periodMetrics.length > 0 && periodMetrics.some(m => m.tricepsFold !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.tricepsFold || 0), 0) / periodMetrics.filter(m => m.tricepsFold !== undefined).length : null;
      const avgSubscapularFold = periodMetrics.length > 0 && periodMetrics.some(m => m.subscapularFold !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.subscapularFold || 0), 0) / periodMetrics.filter(m => m.subscapularFold !== undefined).length : null;
      const avgSuprailiacFold = periodMetrics.length > 0 && periodMetrics.some(m => m.suprailiacFold !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.suprailiacFold || 0), 0) / periodMetrics.filter(m => m.suprailiacFold !== undefined).length : null;
      const avgAbdominalFold = periodMetrics.length > 0 && periodMetrics.some(m => m.abdominalFold !== undefined)
        ? periodMetrics.reduce((acc, m) => acc + (m.abdominalFold || 0), 0) / periodMetrics.filter(m => m.abdominalFold !== undefined).length : null;

      const avgWater = periodDiets.length > 0 ? periodDiets.reduce((acc, d) => acc + (d.waterIntake || 0), 0) / periodDiets.length : 0;
      const adherence = periodCheckins.length > 0 ? (periodCheckins.filter(c => c.dietOnTrack).length / periodCheckins.length) * 100 : 0;

      return {
        date: dateStr,
        label,
        weight: avgWeight ? parseFloat(avgWeight.toFixed(1)) : null,
        bodyFat: avgFat ? parseFloat(avgFat.toFixed(1)) : null,
        muscleMass: avgMuscle ? parseFloat(avgMuscle.toFixed(1)) : null,
        waist: avgWaist ? parseFloat(avgWaist.toFixed(1)) : null,
        abdomen: avgAbdomen ? parseFloat(avgAbdomen.toFixed(1)) : null,
        hip: avgHip ? parseFloat(avgHip.toFixed(1)) : null,
        chest: avgChest ? parseFloat(avgChest.toFixed(1)) : null,
        tricepsFold: avgTricepsFold ? parseFloat(avgTricepsFold.toFixed(1)) : null,
        subscapularFold: avgSubscapularFold ? parseFloat(avgSubscapularFold.toFixed(1)) : null,
        suprailiacFold: avgSuprailiacFold ? parseFloat(avgSuprailiacFold.toFixed(1)) : null,
        abdominalFold: avgAbdominalFold ? parseFloat(avgAbdominalFold.toFixed(1)) : null,
        water: Math.round(avgWater),
        adherence: Math.round(adherence)
      };
    });
  }, [timeFrame, metrics, diets, checkins]);

  return (
    <div className="space-y-6 animate-fade-in text-zinc-800">
      {/* Upper Branded Header */}
      <div>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-800">
          Controle de <span className="text-pink-500">Progresso</span>
        </h2>
        <p className="text-zinc-400 text-xs mt-1">Sincronize check-ins, ingestão hídrica, fotos de evolução corporal e exames laboratoriais.</p>
      </div>

      {/* Tri-Subtab Nav Bar */}
      <div className="flex bg-white p-1 border border-pink-100 rounded-[1.5rem] text-[10px] uppercase font-black tracking-wider shadow-sm">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-1 py-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'daily' 
              ? 'bg-pink-500 text-white font-black shadow-md shadow-pink-200' 
              : 'text-zinc-500 hover:text-pink-400'
          }`}
        >
          <Check size={14} /> Diario
        </button>
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`flex-1 py-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'trends' 
              ? 'bg-pink-500 text-white font-black shadow-md shadow-pink-200' 
              : 'text-zinc-500 hover:text-pink-400'
          }`}
        >
          <TrendingUp size={14} /> Histórico & Tendências
        </button>
        <button
          onClick={() => setActiveSubTab('new-record')}
          className={`flex-1 py-3 rounded-2xl text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'new-record' 
              ? 'bg-pink-500 text-white font-black shadow-md shadow-pink-200' 
              : 'text-zinc-500 hover:text-pink-400'
          }`}
        >
          <Plus size={14} /> Registrar Novo
        </button>
      </div>

      {/* --- SUBTAB A: DAILY CONTROL PANELS --- */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6 animate-fade-in">
          {/* Day View Selector Grid */}
          <div className="bg-white p-3 rounded-[1.8rem] border border-pink-100/70 flex items-center justify-between shadow-sm shadow-pink-100/5">
            <button 
              onClick={() => changeDay(-1)} 
              className="p-2 hover:bg-pink-50 text-pink-500 rounded-full transition-all cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <span className="text-[9px] uppercase font-bold text-[#d4af37] tracking-widest block leading-none mb-1">
                Visualizando data
              </span>
              <span className="text-xs font-black uppercase text-zinc-700 italic">
                {isSameDay(parsedSelectedDate, new Date()) 
                  ? 'Hoje (' + format(parsedSelectedDate, 'dd/MM/yyyy') + ')'
                  : format(parsedSelectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </span>
            </div>
            <button 
              onClick={() => changeDay(1)} 
              className="p-2 hover:bg-pink-50 text-pink-500 rounded-full transition-all cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Interactive Check-ins Block */}
            <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Indicadores Principais</h3>
                  <span className="text-sm font-black italic uppercase text-zinc-700">Check-in de Metas Diárias</span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full animate-ping bg-emerald-400"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Workout Toggle */}
                <button
                  onClick={() => handleToggleCheckin(selectedDate, 'workoutDone')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center group ${
                    currentCheckin?.workoutDone
                      ? 'bg-gradient-to-br from-[#fffdf5] to-[#fffcf3] border-amber-200 text-[#a0821c] shadow-sm'
                      : 'bg-[#faf8f9] border-zinc-100 text-zinc-400 hover:border-pink-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    currentCheckin?.workoutDone ? 'bg-[#d4af37] text-white shadow-sm' : 'bg-white text-zinc-350 border border-zinc-100'
                  }`}>
                    <Dumbbell size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase italic">Treino Batido</div>
                    <span className="text-[8px] font-bold block opacity-75 mt-0.5 uppercase">
                      {currentCheckin?.workoutDone ? 'Concluido ✓' : 'Pendente'}
                    </span>
                  </div>
                </button>

                {/* Diet Toggle */}
                <button
                  onClick={() => handleToggleCheckin(selectedDate, 'dietOnTrack')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-2 text-center group ${
                    currentCheckin?.dietOnTrack
                      ? 'bg-gradient-to-br from-[#fffbfe] to-[#fff5fa] border-pink-200 text-pink-700 shadow-sm'
                      : 'bg-[#faf8f9] border-zinc-100 text-zinc-400 hover:border-pink-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                    currentCheckin?.dietOnTrack ? 'bg-pink-500 text-white shadow-sm shadow-pink-200' : 'bg-white text-zinc-350 border border-zinc-100'
                  }`}>
                    <Target size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase italic">Dieta no Foco</div>
                    <span className="text-[8px] font-bold block opacity-75 mt-0.5 uppercase">
                      {currentCheckin?.dietOnTrack ? 'No Plano ✓' : 'Pendente'}
                    </span>
                  </div>
                </button>
              </div>

              {/* Sparkle Feedback */}
              <div className="bg-pink-50/20 rounded-xl p-3 border border-pink-50 border-dashed flex items-center gap-2 text-[10px] text-zinc-500">
                <Sparkles size={14} className="text-pink-500 flex-shrink-0" />
                <p>
                  {currentCheckin?.workoutDone && currentCheckin?.dietOnTrack 
                    ? "Excelente! Você bateu ambas as metas hoje e está cada vez mais próxima dos seus objetivos!" 
                    : "Preencha seus check-ins clicando nos botões acima para reabastecer seus gráficos de consistência."}
                </p>
              </div>
            </div>

            {/* 2. Interactive Water Drop Module */}
            <div className="bg-white p-5 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#2563eb]">Líquidos</h3>
                  <span className="text-sm font-black italic uppercase text-zinc-700">Consumo de Água Diário</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black italic text-[#2563eb]">
                    {currentDiet?.waterIntake || 0}
                  </span>
                  <span className="text-[10px] text-zinc-450 font-bold block">
                    de {targetWater} ml
                  </span>
                </div>
              </div>

              {/* Styled Water glass cup bar logic */}
              <div className="bg-[#eff6ff] h-8 rounded-2xl border border-blue-100 relative overflow-hidden flex items-center justify-center shadow-inner">
                {/* Water wave level overlay */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-300"
                  animate={{ 
                    height: `${Math.min(((currentDiet?.waterIntake || 0) / targetWater) * 100, 100)}%` 
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                <span className="z-10 text-[10px] uppercase font-extrabold text-blue-900 mix-blend-multiply drop-shadow-sm flex items-center gap-1">
                  <Droplets size={12} /> {Math.min(Math.round(((currentDiet?.waterIntake || 0) / targetWater) * 100), 100)}% Hydrated
                </span>
              </div>

              {/* Increment Action pill selectors */}
              <div className="grid grid-cols-4 gap-1.5 text-[9px] uppercase font-bold">
                <button 
                  onClick={() => handleLogWater(250)}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1e40af] py-2 rounded-xl transition-all cursor-pointer text-center"
                >
                  +250ml
                </button>
                <button 
                  onClick={() => handleLogWater(500)}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1e40af] py-2 rounded-xl transition-all cursor-pointer text-center"
                >
                  +500ml
                </button>
                <button 
                  onClick={() => handleLogWater(1000)}
                  className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1e40af] py-2 rounded-xl transition-all cursor-pointer text-center"
                >
                  +1L
                </button>
                <button 
                  onClick={() => handleLogWater(-250)}
                  className="bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 py-2 rounded-xl transition-all cursor-pointer text-center"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* 3. Micro & Macro Nutrition Target Bars */}
          <div className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Nutrição de Precisão</h3>
                <span className="text-sm font-black italic uppercase text-zinc-700">Metas Nutricionais Alcançadas</span>
              </div>
              <span className="text-xs font-black italic text-pink-500 bg-pink-50 border border-pink-100 px-3 py-1 rounded-xl">
                {totalCalories} kcal consumidas
              </span>
            </div>

            {/* Calories Progress Row */}
            <div className="space-y-1 bg-[#fffbfd] p-3 rounded-2xl border border-pink-100/40">
              <div className="flex justify-between text-[10px] font-bold text-zinc-600">
                <span className="uppercase text-zinc-400">Total Metabólico</span>
                <span>{totalCalories} / {targetCalories} kcal</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden border">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    totalCalories > targetCalories ? 'bg-rose-500' : 'bg-gradient-to-r from-pink-500 to-rose-450'
                  }`}
                  style={{ width: `${Math.min((totalCalories / targetCalories) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[9px] font-black">
                {totalCalories > targetCalories ? (
                  <span className="text-rose-600 uppercase">Cota excedida em {totalCalories - targetCalories} kcal</span>
                ) : (
                  <span className="text-emerald-600 uppercase">Déficit disponível: {targetCalories - totalCalories} kcal</span>
                )}
                <span className="font-mono text-zinc-400">{Math.round((totalCalories / targetCalories) * 100)}%</span>
              </div>
            </div>

            {/* Individual Macro Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Protein Block */}
              <div className="bg-amber-50/20 p-3.5 rounded-2xl border border-amber-100/50 space-y-1">
                <span className="text-[8px] font-black uppercase text-amber-700 block">🥩 Proteínas</span>
                <span className="text-base font-black italic text-zinc-800">{totalProtein.toFixed(1)}g</span>
                <div className="text-[8px] font-bold text-zinc-400">Meta: {targetProtein}g</div>
                {/* Micro progress bar */}
                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#d4af37] h-full" style={{ width: `${Math.min((totalProtein / targetProtein) * 100, 100)}%` }} />
                </div>
                <div className="text-[8px] font-extrabold text-amber-700 uppercase pt-0.5">
                  {totalProtein >= targetProtein ? 'Batida! ✓' : `Faltam ${(targetProtein - totalProtein).toFixed(1)}g`}
                </div>
              </div>

              {/* Carbs Block */}
              <div className="bg-pink-50/20 p-3.5 rounded-2xl border border-pink-100/50 space-y-1">
                <span className="text-[8px] font-black uppercase text-pink-600 block">🍞 Carboidratos</span>
                <span className="text-base font-black italic text-zinc-800">{totalCarbs.toFixed(1)}g</span>
                <div className="text-[8px] font-bold text-zinc-400">Meta: {targetCarbs}g</div>
                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-pink-500 h-full" style={{ width: `${Math.min((totalCarbs / targetCarbs) * 100, 100)}%` }} />
                </div>
                <div className="text-[8px] font-extrabold text-pink-500 uppercase pt-0.5">
                  {totalCarbs >= targetCarbs ? 'Batido! ✓' : `Faltam ${(targetCarbs - totalCarbs).toFixed(1)}g`}
                </div>
              </div>

              {/* Fat Block */}
              <div className="bg-[#fffbfe] p-3.5 rounded-2xl border border-pink-100/30 space-y-1">
                <span className="text-[8px] font-black uppercase text-rose-500 block">🥑 Gorduras</span>
                <span className="text-base font-black italic text-zinc-800">{totalFat.toFixed(1)}g</span>
                <div className="text-[8px] font-bold text-zinc-400">Meta: {targetFat}g</div>
                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-400 h-full" style={{ width: `${Math.min((totalFat / targetFat) * 100, 100)}%` }} />
                </div>
                <div className="text-[8px] font-extrabold text-rose-500 uppercase pt-0.5">
                  {totalFat >= targetFat ? 'Batida! ✓' : `Faltam ${(targetFat - totalFat).toFixed(1)}g`}
                </div>
              </div>

              {/* Fiber Block */}
              <div className="bg-emerald-50/20 p-3.5 rounded-2xl border border-emerald-100/50 space-y-1">
                <span className="text-[8px] font-black uppercase text-emerald-700 block">🌿 Fibras</span>
                <span className="text-base font-black italic text-zinc-800">{totalFiber.toFixed(1)}g</span>
                <div className="text-[8px] font-bold text-zinc-400">Meta: {targetFiber}g</div>
                <div className="w-full bg-zinc-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-550 bg-emerald-500 h-full" style={{ width: `${Math.min((totalFiber / targetFiber) * 100, 100)}%` }} />
                </div>
                <div className="text-[8px] font-extrabold text-emerald-700 uppercase pt-0.5">
                  {totalFiber >= targetFiber ? 'Suficiente ✓' : `Faltam ${(targetFiber - totalFiber).toFixed(1)}g`}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Body Progress Photo Shot integrated */}
          <div className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-pink-500">Acompanhamento Corporal</h3>
              <span className="text-sm font-black italic uppercase text-zinc-700">Foto do Corpo (Deste Dia)</span>
            </div>

            {dayPhotos.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {dayPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-pink-100 shadow-sm group">
                    <img 
                      src={photo.imageUrl} 
                      alt="Progress" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-2 flex flex-col justify-end">
                      <span className="text-[8px] font-black uppercase text-pink-300">
                        {photo.angle === 'Front' ? 'Frente' : photo.angle === 'Side' ? 'Perfil' : 'Costas'}
                      </span>
                    </div>
                    {/* Delete handler */}
                    <button
                      onClick={async () => {
                        if (confirm("Remover esta foto?")) {
                          await deleteDoc(doc(db, 'photos', photo.id));
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Drag Drop Uploader frame directly on progress dashboard */
              <div className="space-y-4">
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[1.8rem] p-6 text-center transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    isDragging 
                      ? 'border-pink-500 bg-pink-50/10' 
                      : 'border-pink-100 bg-[#fffbfe]/40 hover:bg-[#fffafa]'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  {compressedImage ? (
                    <div className="space-y-3 w-full max-w-xs mx-auto">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border border-pink-105 mx-auto max-h-48">
                        <img src={compressedImage} alt="Comprimida" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-emerald-600 font-extrabold uppercase">Foto compactada e pronta! ✓</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-11 h-11 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm">
                        <Camera size={20} />
                      </div>
                      <p className="text-xs font-bold text-zinc-650">Arraste ou clique para enviar foto hoje</p>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide">Frente, Perfil ou Costas</p>
                    </>
                  )}
                </div>

                {compressedImage && (
                  <div className="bg-white p-3.5 border border-pink-100 rounded-2xl space-y-3 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Ângulo Visual</label>
                        <select 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-1.5 text-xs text-zinc-800 font-bold"
                          value={uploadAngle}
                          onChange={e => setUploadAngle(e.target.value)}
                        >
                          <option value="Front">Frente (Frontal)</option>
                          <option value="Side">Lado (Perfil)</option>
                          <option value="Back">Costas (Posterior)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Observações rápidas</label>
                        <input 
                          type="text" 
                          placeholder="Ex: em jejum, pós-treino" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-1.5 text-xs text-zinc-850"
                          value={uploadNotes}
                          onChange={e => setUploadNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleSavePhoto}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-black py-2 rounded-xl text-[10px] uppercase shadow-md cursor-pointer"
                      >
                        Confirmar e Arquivar
                      </button>
                      <button
                        onClick={() => setCompressedImage(null)}
                        className="bg-zinc-100 text-zinc-500 font-bold px-3 py-2 rounded-xl text-[10px] uppercase hover:bg-zinc-200 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB B: HISTORICAL CHARTS & TREND MODULES --- */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6 animate-fade-in">
          {/* Biometrics Chart Control Grid */}
          <div className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Evolução Biométrica</h3>
                <span className="text-sm font-black italic uppercase text-zinc-700 block">Composição & Gorduras Histórica</span>
              </div>

              {/* Timeframe selector inside card */}
              <div className="flex bg-[#fffafa] p-1 border border-pink-100 rounded-xl text-[9px] font-bold uppercase gap-0.5">
                {(['daily', 'weekly', 'monthly'] as TimeFrame[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      timeFrame === tf ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                    }`}
                  >
                    {tf === 'daily' ? 'Diário' : tf === 'weekly' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric group switcher */}
            <div className="grid grid-cols-3 gap-1 bg-[#fffbfd] p-1 border border-pink-100/70 rounded-2xl text-[9px] uppercase font-black tracking-wide">
              <button
                onClick={() => setTrackerGroup('comp')}
                className={`py-2 rounded-xl text-center cursor-pointer transition-all ${
                  trackerGroup === 'comp' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                Bioimpedância
              </button>
              <button
                onClick={() => setTrackerGroup('circ')}
                className={`py-2 rounded-xl text-center cursor-pointer transition-all ${
                  trackerGroup === 'circ' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                Medidas
              </button>
              <button
                onClick={() => setTrackerGroup('dobras')}
                className={`py-2 rounded-xl text-center cursor-pointer transition-all ${
                  trackerGroup === 'dobras' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                D. Cutâneas
              </button>
            </div>

            {/* Recharts chart area */}
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fdf4f8" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '700' }}
                  />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #fbcfe8', fontSize: '11px', color: '#1f2937' }} />
                  
                  {/* COMPOSITION CHART */}
                  {trackerGroup === 'comp' && (
                    <>
                      <Line type="monotone" dataKey="weight" stroke="#d4af37" strokeWidth={3} name="Peso (kg)" connectNulls />
                      <Line type="monotone" dataKey="bodyFat" stroke="#ec4899" strokeWidth={2.5} strokeDasharray="4 4" name="Gordura (%)" connectNulls />
                      <Line type="monotone" dataKey="muscleMass" stroke="#10b981" strokeWidth={2.5} strokeDasharray="4 4" name="Massa Muscular (%)" connectNulls />
                    </>
                  )}

                  {/* CIRCUMFERENCES */}
                  {trackerGroup === 'circ' && (
                    <>
                      <Line type="monotone" dataKey="waist" stroke="#d4af37" strokeWidth={2.5} name="Cintura" connectNulls />
                      <Line type="monotone" dataKey="abdomen" stroke="#ec4899" strokeWidth={2} name="Abdômen" connectNulls />
                      <Line type="monotone" dataKey="hip" stroke="#06b6d4" strokeWidth={2} name="Quadril" connectNulls />
                    </>
                  )}

                  {/* SKIN FOLDS */}
                  {trackerGroup === 'dobras' && (
                    <>
                      <Line type="monotone" dataKey="tricepsFold" stroke="#d4af37" strokeWidth={2.5} name="Tríceps (mm)" connectNulls />
                      <Line type="monotone" dataKey="subscapularFold" stroke="#ec4899" strokeWidth={2} name="Subescapular" connectNulls />
                      <Line type="monotone" dataKey="abdominalFold" stroke="#10b981" strokeWidth={2} name="Abdominal" connectNulls />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BIOCHEMICAL EXAMS TREND LINE */}
          {uniqueExamTypes.length > 0 && (
            <div className="bg-white p-6 rounded-[2rem] border border-pink-100 shadow-sm shadow-pink-100/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Laudos Clínicos</h3>
                  <span className="text-sm font-black italic uppercase text-zinc-700 block">Evolução do Exame Select</span>
                </div>
                
                {/* Select Exam dropdown */}
                <select 
                  className="bg-white border border-pink-150 rounded-xl px-3 py-1.5 text-xs text-zinc-700 font-bold shadow-sm"
                  value={selectedExamChart}
                  onChange={e => setSelectedExamChart(e.target.value)}
                >
                  {uniqueExamTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Chart for exams */}
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    exams
                      .filter(e => e.type === selectedExamChart && e.value > 0)
                      .sort((a,b) => a.date.localeCompare(b.date))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fdf4f8" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(d) => {
                        try {
                          return format(new Date(d + 'T00:00:00'), 'dd/MM/yy');
                        } catch (_) { return d; }
                      }}
                      tick={{ fill: '#4b5563', fontSize: 10, fontWeight: '700' }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontSize: 9 }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={3} dot={{ r:4 }} name="Valor" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* BEFORE / AFTER COMPARATOR FRAME */}
          {photos.length >= 2 ? (
            <div className="bg-[#fffdfd] border border-pink-100 p-5 rounded-[2rem] space-y-4 shadow-sm shadow-pink-100/5">
              <div className="flex justify-between items-center border-b border-pink-50 pb-2">
                <div>
                  <h3 className="text-[10px] font-black uppercase text-[#d4af37]">Comparador Corporal</h3>
                  <span className="text-sm font-black italic uppercase text-zinc-700">Evidência Visual (Antes/Depois)</span>
                </div>
                <select
                  className="bg-white border border-pink-100 rounded-xl px-2 py-1 text-xs font-bold text-zinc-600"
                  value={compareAngle}
                  onChange={e => setCompareAngle(e.target.value)}
                >
                  <option value="Front">Frente</option>
                  <option value="Side">Perfil</option>
                  <option value="Back">Costas</option>
                </select>
              </div>

              {/* Photos selectors */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Foto A (Mais antiga)</label>
                  <select 
                    className="w-full bg-white border border-pink-50 rounded-lg p-1.5 text-xs text-zinc-650"
                    value={comparePhotoAId}
                    onChange={e => setComparePhotoAId(e.target.value)}
                  >
                    {photos.filter(p => p.angle === compareAngle).map(p => (
                      <option key={p.id} value={p.id}>{format(new Date(p.date + 'T00:00:00'), 'dd/MM/yyyy')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Foto B (Mais nova)</label>
                  <select 
                    className="w-full bg-white border border-pink-50 rounded-lg p-1.5 text-xs text-zinc-650"
                    value={comparePhotoBId}
                    onChange={e => setComparePhotoBId(e.target.value)}
                  >
                    {photos.filter(p => p.angle === compareAngle).map(p => (
                      <option key={p.id} value={p.id}>{format(new Date(p.date + 'T00:00:00'), 'dd/MM/yyyy')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Two side columns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-[#d4af37]">Antes (Foto A)</span>
                  {photos.find(p => p.id === comparePhotoAId) ? (
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-pink-100 bg-zinc-50 shadow-sm">
                      <img 
                        src={photos.find(p => p.id === comparePhotoAId)?.imageUrl} 
                        alt="Foto Antes" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-0.5 rounded text-[8px] text-white font-mono font-bold">
                        {format(new Date(photos.find(p => p.id === comparePhotoAId)!.date + 'T00:00:00'), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-2xl border border-dashed border-pink-100 flex items-center justify-center p-3 text-center text-[10px] text-zinc-400 font-bold bg-white">
                      Selecione Foto A
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-pink-500">Depois (Foto B)</span>
                  {photos.find(p => p.id === comparePhotoBId) ? (
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-pink-100 bg-zinc-50 shadow-sm">
                      <img 
                        src={photos.find(p => p.id === comparePhotoBId)?.imageUrl} 
                        alt="Foto Depois" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-0.5 rounded text-[8px] text-white font-mono font-bold">
                        {format(new Date(photos.find(p => p.id === comparePhotoBId)!.date + 'T00:00:00'), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[3/4] rounded-2xl border border-dashed border-pink-100 flex items-center justify-center p-3 text-center text-[10px] text-zinc-400 font-bold bg-white">
                      Selecione Foto B
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-[2rem] border border-pink-100/60 flex items-center gap-3 text-xs text-zinc-500 font-bold">
              <Info className="text-[#d4af37]" />
              <span>Adicione pelo menos 2 fotos de progresso para desbloquear a visualização lado a lado de "Antes e Depois".</span>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB C: NEW RECORD FORMS (METRICS & EXAMS) --- */}
      {activeSubTab === 'new-record' && (
        <div className="space-y-6 animate-fade-in">
          {/* Internal subtab selectors */}
          <div className="flex bg-[#fffbfd] p-1 border border-pink-100 rounded-2xl text-[9px] uppercase font-black tracking-wide shadow-sm">
            <button
              onClick={() => setMetricFormTab('bio')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer rounded-xl ${
                metricFormTab === 'bio' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-550'
              }`}
            >
              Bioimpedância
            </button>
            <button
              onClick={() => setMetricFormTab('medidas')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer rounded-xl ${
                metricFormTab === 'medidas' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-550'
              }`}
            >
              Medidas Corporais
            </button>
            <button
              onClick={() => setMetricFormTab('dobras')}
              className={`flex-1 py-2 text-center transition-all cursor-pointer rounded-xl ${
                metricFormTab === 'dobras' ? 'bg-pink-500 text-white shadow-sm' : 'text-zinc-550'
              }`}
            >
              Exame Clínico
            </button>
          </div>

          {/* BIOIMPEDANCE SHEETS */}
          {metricFormTab === 'bio' && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-pink-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-pink-500">
                <Scale size={20} />
                <h3 className="text-sm font-black uppercase italic text-zinc-700">Composição de Bioimpedância</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-zinc-700 text-xs">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Data de Registro</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.date}
                    onChange={e => setNewMetric({...newMetric, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Peso Total (kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5 font-bold"
                    value={newMetric.weight}
                    onChange={e => setNewMetric({...newMetric, weight: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-zinc-705 text-xs text-zinc-700">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Gordura Corporal (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.bodyFat}
                    onChange={e => setNewMetric({...newMetric, bodyFat: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Massa Muscular (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.muscleMass}
                    onChange={e => setNewMetric({...newMetric, muscleMass: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Água Corporal (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.waterPercentage}
                    onChange={e => setNewMetric({...newMetric, waterPercentage: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveMetric}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer mt-4"
              >
                Salvar Registro de Bioimpedância
              </button>
            </div>
          )}

          {/* MEASUREMENTS CHEETS */}
          {metricFormTab === 'medidas' && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-pink-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-pink-500">
                <Sliders size={20} />
                <h3 className="text-sm font-black uppercase italic text-zinc-700">Medidas de Circunferência</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-zinc-700 text-xs">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Data de Registro</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.date}
                    onChange={e => setNewMetric({...newMetric, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Cintura (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.waist}
                    onChange={e => setNewMetric({...newMetric, waist: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-zinc-700 text-xs">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Abdômen (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.abdomen}
                    onChange={e => setNewMetric({...newMetric, abdomen: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Quadril (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.hip}
                    onChange={e => setNewMetric({...newMetric, hip: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Peitoral (cm)</label>
                  <input 
                    type="number" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newMetric.chest}
                    onChange={e => setNewMetric({...newMetric, chest: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveMetric}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer mt-4"
              >
                Salvar Registro de Medidas
              </button>
            </div>
          )}

          {/* EXAM REPORT RECORD FRAME */}
          {metricFormTab === 'dobras' && (
            <div className="bg-white p-6 rounded-[2.5rem] border border-pink-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-pink-500">
                <FileText size={20} />
                <h3 className="text-sm font-black uppercase italic text-zinc-700">Gabarito de Exames Clínicos</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-zinc-700 text-xs">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Data do Exame</label>
                  <input 
                    type="date" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5 animate-fade-in"
                    value={newExam.date}
                    onChange={e => setNewExam({...newExam, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Exame Comum</label>
                  <select 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5 font-bold"
                    value={['Glicose (Jejum)', 'Colesterol Total', 'Colesterol HDL', 'Colesterol LDL', 'Triglicerídeos', 'Testosterona Total', 'Vitamina D', 'Creatinina', 'Ureia', 'Cortisol'].includes(newExam.type) ? newExam.type : (newExam.type === '' ? '' : 'Outro')}
                    onChange={e => {
                      if (e.target.value === 'Outro') {
                        setNewExam({...newExam, type: ''});
                      } else {
                        let unit = 'mg/dL';
                        if (e.target.value === 'Testosterona Total') unit = 'ng/dL';
                        if (e.target.value === 'Vitamina D') unit = 'ng/mL';
                        setNewExam({...newExam, type: e.target.value, unit});
                      }
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="Glicose (Jejum)">Glicose (Jejum)</option>
                    <option value="Colesterol Total">Colesterol Total</option>
                    <option value="Colesterol HDL">Colesterol HDL</option>
                    <option value="Colesterol LDL">Colesterol LDL</option>
                    <option value="Triglicerídeos">Triglicerídeos</option>
                    <option value="Testosterona Total">Testosterona Total</option>
                    <option value="Vitamina D">Vitamina D</option>
                    <option value="Creatinina">Creatinina</option>
                    <option value="Ureia">Ureia</option>
                    <option value="Cortisol">Cortisol</option>
                    <option value="Outro">Digitar manualmente...</option>
                  </select>
                </div>
              </div>

              {/* Manual name entry if other */}
              {(!['Glicose (Jejum)', 'Colesterol Total', 'Colesterol HDL', 'Colesterol LDL', 'Triglicerídeos', 'Testosterona Total', 'Vitamina D', 'Creatinina', 'Ureia', 'Cortisol'].includes(newExam.type) || newExam.type === '') && (
                <div className="animate-fade-in text-xs text-zinc-700">
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Nome do Exame</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Hemoglobina Glicada"
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newExam.type}
                    onChange={e => setNewExam({...newExam, type: e.target.value})}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-zinc-700 text-xs text-zinc-750">
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Resultado Quantitativo (Valor)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 580"
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5 font-bold"
                    value={newExam.value || ''}
                    onChange={e => setNewExam({...newExam, value: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="text-[8px] uppercase font-bold text-zinc-400">Unidade de Medida</label>
                  <input 
                    type="text" 
                    placeholder="Ex: mg/dL, ng/dL"
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5"
                    value={newExam.unit}
                    onChange={e => setNewExam({...newExam, unit: e.target.value})}
                  />
                </div>
              </div>

              <div className="text-xs text-zinc-700">
                <label className="text-[8px] uppercase font-bold text-zinc-400">Texto Do Laudo / Faixas de referência</label>
                <textarea 
                  placeholder="Ex: Valor: 5.8% (Referência: menor de 5.7%)..."
                  className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2.5 h-16"
                  value={newExam.result}
                  onChange={e => setNewExam({...newExam, result: e.target.value})}
                />
              </div>

              <button 
                onClick={handleSaveExam}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black py-3 rounded-2xl text-[11px] uppercase tracking-wider transition-colors cursor-pointer mt-4"
              >
                Registrar Exame Laboratorial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
