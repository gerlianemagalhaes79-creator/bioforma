import { useState, useEffect } from 'react';
import { db, collection, query, where, onSnapshot, User, orderBy, addDoc, deleteDoc, doc } from '../firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, Trash2, Camera, FileText, X, Scale, Dumbbell, 
  Sparkles, TrendingUp, Droplets, Heart, Info, Clipboard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import BodyAvatar from './BodyAvatar';

interface MetricsSectionProps {
  user: User;
}

type MetricsTab = 'avatar' | 'historico' | 'exames' | 'fotos';

export default function MetricsSection({ user }: MetricsSectionProps) {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<MetricsTab>('avatar');
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [showAddPhoto, setShowAddPhoto] = useState(false);

  // Form Section Collapsible
  const [formSection, setFormSection] = useState<'bio' | 'medidas' | 'dobras'>('bio');

  // New photo comparison states
  const [photoViewMode, setPhotoViewMode] = useState<'galeria' | 'comparar'>('galeria');
  const [compareAngle, setCompareAngle] = useState<string>('Front');
  const [comparePhotoAId, setComparePhotoAId] = useState<string>('');
  const [comparePhotoBId, setComparePhotoBId] = useState<string>('');

  // Selected exam category state for evolution charts
  const [selectedExamChart, setSelectedExamChart] = useState<string>('');

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

  // Extract unique exam types with numeric values
  const uniqueExamTypesWithValues = Array.from(
    new Set(exams.filter(e => e.value !== undefined && e.value > 0).map(e => e.type))
  );

  // Auto-select the first type available if none is selected
  useEffect(() => {
    if (!selectedExamChart && uniqueExamTypesWithValues.length > 0) {
      setSelectedExamChart(uniqueExamTypesWithValues[0]);
    }
  }, [exams, selectedExamChart]);

  // AI Exam Analyzer states
  const [analyzingExamId, setAnalyzingExamId] = useState<string | null>(null);
  const [examAnalysisResults, setExamAnalysisResults] = useState<Record<string, any>>({});

  const handleAnalyzeExam = async (exam: any) => {
    if (analyzingExamId) return;
    setAnalyzingExamId(exam.id);
    try {
      const response = await fetch('/api/analyze-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: exam.type,
          value: exam.value,
          unit: exam.unit,
          result: exam.result,
          notes: exam.notes
        })
      });
      const resData = await response.json();
      if (resData.success && resData.data) {
        setExamAnalysisResults(prev => ({
          ...prev,
          [exam.id]: resData.data
        }));
      } else {
        alert("Não foi possível gerar soluções para o exame neste momento.");
      }
    } catch (err) {
      console.error("Erro na análise:", err);
      alert("Erro ao conectar ao analisador de exames. Tente novamente.");
    } finally {
      setAnalyzingExamId(null);
    }
  };

  // Read latest logged metrics for the Avatar defaults
  const latestMetric = metrics[0] || {
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
    calfRight: 36
  };

  const handleSaveMetric = async () => {
    try {
      if (!newMetric.weight || newMetric.weight <= 0) {
        alert("Por favor, digite um peso válido.");
        return;
      }
      await addDoc(collection(db, 'metrics'), { ...newMetric, uid: user.uid });
      setShowAddMetric(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveExam = async () => {
    try {
      if (!newExam.type) {
        alert("Por favor, informe o nome do exame.");
        return;
      }
      await addDoc(collection(db, 'exams'), { ...newExam, uid: user.uid });
      setShowAddExam(false);
      setNewExam({
        date: format(new Date(), 'yyyy-MM-dd'),
        type: '',
        value: 0,
        unit: 'mg/dL',
        result: '',
        notes: ''
      });
    } catch (e) { console.error(e); }
  };

  const [isDragging, setIsDragging] = useState(false);

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
          setNewPhoto((prev) => ({ ...prev, imageUrl: compressedBase64 }));
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhoto = async () => {
    try {
      if (!newPhoto.imageUrl) {
        alert("Por favor, selecione ou envie a foto de progresso.");
        return;
      }
      await addDoc(collection(db, 'photos'), { ...newPhoto, uid: user.uid });
      setShowAddPhoto(false);
      setNewPhoto({
        date: format(new Date(), 'yyyy-MM-dd'),
        imageUrl: '',
        angle: 'Front',
        notes: ''
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in text-zinc-800">
      {/* Header section */}
      <div>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-800">
          Evolução & <span className="text-pink-500">Forma</span>
        </h2>
        <p className="text-zinc-400 text-xs mt-1">Acompanhe fotos de evolução, laudos de exames e biometria com avatar 2D.</p>
      </div>

      {/* Sub-tabs Selection */}
      <div className="flex bg-pink-50 p-1 rounded-2xl border border-pink-100/80 gap-1 overflow-x-auto text-[10px]">
        <button
          onClick={() => setActiveTab('avatar')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'avatar' ? 'bg-[#d4af37] text-white shadow-sm' : 'text-zinc-500 hover:text-pink-600'
          }`}
        >
          <Dumbbell size={13} />
          Avatar 2D
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'historico' ? 'bg-[#d4af37] text-white shadow-sm' : 'text-zinc-500 hover:text-pink-600'
          }`}
        >
          <Scale size={13} />
          Medidas
        </button>
        <button
          onClick={() => setActiveTab('exames')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'exames' ? 'bg-[#d4af37] text-white shadow-sm' : 'text-zinc-500 hover:text-pink-600'
          }`}
        >
          <FileText size={13} />
          Exames
        </button>
        <button
          onClick={() => setActiveTab('fotos')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold uppercase tracking-widest whitespace-nowrap transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'fotos' ? 'bg-[#d4af37] text-white shadow-sm' : 'text-zinc-500 hover:text-pink-600'
          }`}
        >
          <Camera size={13} />
          Fotos
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      <div className="space-y-6">
        
        {/* Tab 1: Interactive Avatar */}
        {activeTab === 'avatar' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center sm:items-end flex-wrap gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Silhueta Atualizada</span>
                <h3 className="text-xl font-black italic uppercase text-zinc-700">Avatar BioForma</h3>
              </div>
              <button
                onClick={() => setShowAddMetric(true)}
                className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-500 border border-pink-200/40 font-black italic uppercase text-[10px] tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                    + Registrar Medidas
              </button>
            </div>

            {/* Visual dynamic body model */}
            <BodyAvatar 
              bodyFat={latestMetric.bodyFat}
              muscleMass={latestMetric.muscleMass}
              chest={latestMetric.chest}
              waist={latestMetric.waist}
              hip={latestMetric.hip}
              bicepLeft={latestMetric.bicepLeft}
              bicepRight={latestMetric.bicepRight}
              thighLeft={latestMetric.thighLeft}
              thighRight={latestMetric.thighRight}
              calfLeft={latestMetric.calfLeft}
              calfRight={latestMetric.calfRight}
            />

            {/* Quick Summary Card */}
            <div className="bg-white border border-pink-100 p-5 rounded-[2rem] grid grid-cols-2 gap-4 shadow-sm shadow-pink-100/10">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Peso Atual</span>
                <span className="text-xl font-black italic text-zinc-800">{latestMetric.weight} kg</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Gordura Corporal</span>
                <span className="text-xl font-black italic text-amber-500">{latestMetric.bodyFat || 0}%</span>
              </div>
              <div className="space-y-1 border-t border-pink-50 pt-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Massa Muscular</span>
                <span className="text-xl font-black italic text-pink-500">{latestMetric.muscleMass || 0}%</span>
              </div>
              <div className="space-y-1 border-t border-pink-50 pt-3">
                <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest block">Cintura</span>
                <span className="text-xl font-black italic text-zinc-700">{latestMetric.waist || 0} cm</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Logs & Measurements History */}
        {activeTab === 'historico' && (
          <div className="space-y-4 animate-fade-in text-zinc-850">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Histórico de Biometria</h3>
              <button onClick={() => setShowAddMetric(true)} className="text-pink-500 hover:text-pink-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                <Plus size={16} /> Adicionar
              </button>
            </div>

            {metrics.length === 0 ? (
              <div className="bg-[#fffafa] border border-dotted border-pink-200 p-8 rounded-[2rem] text-center">
                <Scale size={32} className="mx-auto text-pink-200 mb-2" />
                <p className="text-sm font-bold text-zinc-400">Nenhum registro de medida ainda.</p>
                <button
                  onClick={() => setShowAddMetric(true)}
                  className="text-xs text-pink-500 font-bold hover:underline mt-1 block w-full text-center cursor-pointer"
                >
                  Registrar minha primeira medição
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {metrics.map((m) => (
                  <div key={m.id} className="bg-white p-6 rounded-[2rem] border border-pink-100 space-y-4 relative overflow-hidden shadow-sm shadow-pink-100/10">
                    <button 
                      onClick={() => deleteDoc(doc(db, 'metrics', m.id))} 
                      className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                        <Scale size={20} />
                      </div>
                      <div>
                        <div className="text-lg font-black italic uppercase text-zinc-800">{m.weight} kg</div>
                        <div className="text-[9px] font-bold text-[#d4af37] uppercase tracking-widest">
                          {format(new Date(m.date + 'T00:00:00'), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Bioimpedance indicators */}
                    <div className="grid grid-cols-4 gap-2 bg-pink-50/35 p-3 rounded-2xl border border-pink-100/20 text-center">
                      <div>
                        <div className="text-xs font-black text-pink-500">{m.bodyFat || 0}%</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Gordura</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#d4af37]">{m.muscleMass || 0}%</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Músculo</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-pink-500">{m.visceralFat || 0}</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Visceral</div>
                      </div>
                      <div>
                        <div className="text-xs font-black text-sky-500">{m.waterPercentage || 0}%</div>
                        <div className="text-[8px] font-bold text-zinc-400 uppercase">Água</div>
                      </div>
                    </div>

                    {/* Measurements Details Dropdown/View */}
                    <div className="grid grid-cols-3 gap-y-2 gap-x-4 text-xs pt-2 text-zinc-500 border-b border-pink-50 pb-2">
                      <div><span className="text-zinc-400 font-bold">Peitoral:</span> {m.chest || '--'} cm</div>
                      <div><span className="text-zinc-400 font-bold">Cintura:</span> {m.waist || '--'} cm</div>
                      <div><span className="text-zinc-400 font-bold">Abdômen:</span> {m.abdomen || '--'} cm</div>
                      <div><span className="text-zinc-400 font-bold">Bíceps (E/D):</span> {m.bicepLeft || '--'}/{m.bicepRight || '--'} cm</div>
                      <div><span className="text-zinc-400 font-bold">Coxas (E/D):</span> {m.thighLeft || '--'}/{m.thighRight || '--'} cm</div>
                      <div><span className="text-zinc-400 font-bold">Quadril:</span> {m.hip ? `${m.hip} cm` : '--'}</div>
                    </div>

                    {/* Skinfolds details */}
                    {(m.bicepsFold !== undefined || m.tricepsFold !== undefined || m.subscapularFold !== undefined || m.suprailiacFold !== undefined || m.abdominalFold !== undefined || m.chestFold !== undefined || m.thighFold !== undefined) && (
                      <div className="border-t border-pink-100/30 pt-2 space-y-1.5">
                        <div className="text-[9px] font-black text-[#d4af37] uppercase tracking-wider">Dobras Cutâneas (mm)</div>
                        <div className="grid grid-cols-4 gap-y-1 gap-x-2 text-[10px] text-zinc-550 font-mono">
                          {m.bicepsFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Bic:</span> {m.bicepsFold}mm</div>}
                          {m.tricepsFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Tri:</span> {m.tricepsFold}mm</div>}
                          {m.subscapularFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Sub:</span> {m.subscapularFold}mm</div>}
                          {m.suprailiacFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Sup:</span> {m.suprailiacFold}mm</div>}
                          {m.abdominalFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Abd:</span> {m.abdominalFold}mm</div>}
                          {m.chestFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Pei:</span> {m.chestFold}mm</div>}
                          {m.thighFold !== undefined && <div><span className="text-zinc-400 font-sans font-semibold">Cox:</span> {m.thighFold}mm</div>}
                          <div className="bg-[#fffdf5] border border-amber-100/50 px-1 rounded font-bold text-[#d4af37]">
                            <span className="font-sans font-extrabold">Σ:</span> {
                              (m.bicepsFold || 0) + (m.tricepsFold || 0) + (m.subscapularFold || 0) + (m.suprailiacFold || 0) + (m.abdominalFold || 0) + (m.chestFold || 0) + (m.thighFold || 0)
                            }mm
                          </div>
                        </div>
                      </div>
                    )}

                    {m.notes && (
                      <p className="text-[11px] text-zinc-400 border-t border-pink-50 pt-2 italic">Anotações: {m.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Lab Exams Section */}
        {activeTab === 'exames' && (
          <div className="space-y-4 animate-fade-in text-zinc-800">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Resultados de Exames</h3>
              <button onClick={() => setShowAddExam(true)} className="text-pink-500 hover:text-pink-650 flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                <Plus size={16} /> Novo Exame
              </button>
            </div>

            {exams.length === 0 ? (
              <div className="bg-[#fffafa] border border-dotted border-pink-200 p-8 rounded-[2rem] text-center">
                <Clipboard size={32} className="mx-auto text-pink-200 mb-2" />
                <p className="text-sm font-bold text-zinc-400">Nenhum laudo ou exame cadastrado ainda.</p>
                <p className="text-xs text-zinc-400 mt-1">Guarde exames como Testosterona, Colesterol, Vitaminas, etc.</p>
              </div>
            ) : (
              <div className="space-y-4">


                <div className="space-y-3">
                  {exams.map((e) => (
                    <div key={e.id} className="bg-white p-5 rounded-2xl border border-pink-100 space-y-2 relative shadow-sm shadow-pink-100/10">
                      <button 
                        onClick={() => deleteDoc(doc(db, 'exams', e.id))} 
                        className="absolute top-4 right-4 text-zinc-300 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                          <FileText size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <div className="text-sm font-black italic uppercase text-zinc-700">{e.type}</div>
                            {e.value !== undefined && e.value > 0 && (
                              <span className="text-xs font-black italic text-[#d4af37] bg-[#fffcf5] border border-amber-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                {e.value} {e.unit || ''}
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            {format(new Date(e.date + 'T00:00:00'), "dd/MM/yyyy")}
                          </div>
                        </div>
                      </div>

                      <div className="bg-pink-50/20 p-3 rounded-xl border border-pink-50 text-xs">
                        <div className="text-pink-500 font-bold mb-1">Resultado / Valores:</div>
                        <p className="text-zinc-600 font-mono whitespace-pre-line">{e.result}</p>
                      </div>

                      {e.notes && (
                        <p className="text-[10px] text-zinc-400 italic">Notas médicas: {e.notes}</p>
                      )}

                      {/* AI Solutions Button and Section */}
                      <div className="pt-2 border-t border-pink-50">
                        {examAnalysisResults[e.id] ? (
                          <div className="space-y-3 bg-[#fffcf5] border border-amber-100 p-4 rounded-xl mt-2 animate-fade-in text-xs">
                            <div className="flex items-center gap-1.5 text-[#d4af37] font-black uppercase text-[10px] tracking-wider">
                              <Sparkles size={14} /> Soluções Inteligentes Geradas por IA
                            </div>
                            
                            <div className="space-y-1">
                              <span className="font-bold text-zinc-700">Análise do Indicador:</span>
                              <p className="text-zinc-600 leading-relaxed text-[11px]">{examAnalysisResults[e.id].analysis}</p>
                            </div>

                            {examAnalysisResults[e.id].causes && examAnalysisResults[e.id].causes.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-700">🔍 Possíveis Causas Fisiológicas:</span>
                                <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 text-[11px]">
                                  {examAnalysisResults[e.id].causes.map((cause: string, i: number) => (
                                    <li key={i}>{cause}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {examAnalysisResults[e.id].solutions && examAnalysisResults[e.id].solutions.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-700">🏋️ Recomendações & Hábitos:</span>
                                <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 text-[11px]">
                                  {examAnalysisResults[e.id].solutions.map((sol: string, i: number) => (
                                    <li key={i}>{sol}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {examAnalysisResults[e.id].dietaryTips && examAnalysisResults[e.id].dietaryTips.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-700">🥗 Alimentos & Dieta Recomendada:</span>
                                <ul className="list-disc pl-4 space-y-0.5 text-zinc-600 text-[11px]">
                                  {examAnalysisResults[e.id].dietaryTips.map((tip: string, i: number) => (
                                    <li key={i}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-[10px] text-amber-700 font-medium leading-relaxed">
                              ⚠️ {examAnalysisResults[e.id].warning}
                            </div>

                            <button
                              onClick={() => {
                                setExamAnalysisResults(prev => {
                                  const updated = { ...prev };
                                  delete updated[e.id];
                                  return updated;
                                });
                              }}
                              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 block mt-1 underline cursor-pointer"
                            >
                              Fechar Análise
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAnalyzeExam(e)}
                            disabled={analyzingExamId === e.id}
                            className="w-full bg-[#fdf2f8] hover:bg-[#fbcfe8] text-pink-600 disabled:text-zinc-400 disabled:bg-zinc-100 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer border border-pink-100/50"
                          >
                            {analyzingExamId === e.id ? (
                              <>
                                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-pink-500 border-t-transparent rounded-full mr-1" />
                                Analisando Indicadores e Buscando Soluções...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} className="text-pink-500" />
                                Exame Baixo/Fora da Referência? Ver Soluções de IA
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Photos Grid */}
        {activeTab === 'fotos' && (
          <div className="space-y-4 animate-fade-in text-zinc-800">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Fotos de Evolução</h3>
              <button onClick={() => setShowAddPhoto(true)} className="text-pink-500 hover:text-pink-650 flex items-center gap-1 text-[11px] font-bold cursor-pointer">
                <Plus size={16} /> Adicionar Foto
              </button>
            </div>

            {photos.length === 0 ? (
              <div className="bg-[#fffafa] border border-dotted border-pink-200 p-8 rounded-[2rem] text-center">
                <Camera size={32} className="mx-auto text-pink-200 mb-2" />
                <p className="text-sm font-bold text-zinc-400">Nenhuma foto adicionada ainda.</p>
                <p className="text-xs text-zinc-400 mt-1">Insira fotos do seu corpo (Frente, Lado, Costas) para ver as mudanças físicas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* View layout selectors */}
                <div className="flex justify-between items-center bg-[#fffbfd] p-1 border border-pink-100 rounded-xl text-[10px] uppercase font-bold tracking-wider gap-1">
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('galeria')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      photoViewMode === 'galeria' ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                    }`}
                  >
                    Galeria Completa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoViewMode('comparar')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      photoViewMode === 'comparar' ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                    }`}
                  >
                    Comparador de Progresso
                  </button>
                </div>

                {photoViewMode === 'galeria' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {photos.map((p) => (
                      <div key={p.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-pink-100 group bg-pink-50/50 shadow-sm">
                        <img src={p.imageUrl} alt="Progress" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3">
                          <span className="text-[10px] font-black italic uppercase text-pink-300">{p.angle === 'Front' ? 'Frente' : p.angle === 'Side' ? 'Lado/Perfil' : p.angle === 'Back' ? 'Costas' : p.angle}</span>
                          <span className="text-[9px] font-bold text-zinc-350 mt-0.5">
                            {format(new Date(p.date + 'T00:00:00'), "dd/MM/yyyy")}
                          </span>
                          {p.notes && (
                            <p className="text-[9px] text-zinc-400 italic mt-1 line-clamp-1">{p.notes}</p>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => deleteDoc(doc(db, 'photos', p.id))}
                          className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* WORKSPACE COMPARATOR SETUP */
                  <div className="bg-[#fffdfd] border border-pink-100/60 p-4 rounded-[2rem] space-y-4 animate-fade-in shadow-sm shadow-pink-100/5">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Filter by Angle */}
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Ângulo</label>
                        <select
                          className="w-full bg-white border border-pink-100 rounded-lg p-1.5 text-xs text-zinc-700 font-bold"
                          value={compareAngle}
                          onChange={e => setCompareAngle(e.target.value)}
                        >
                          <option value="Front">Frente</option>
                          <option value="Side">Perfil/Lado</option>
                          <option value="Back">Costas</option>
                        </select>
                      </div>

                      {/* Photo A Selector */}
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Antes (Foto A)</label>
                        <select
                          className="w-full bg-white border border-pink-100 rounded-lg p-1.5 text-xs text-zinc-700"
                          value={comparePhotoAId}
                          onChange={e => setComparePhotoAId(e.target.value)}
                        >
                          {photos.filter(p => p.angle === compareAngle).map(p => (
                            <option key={p.id} value={p.id}>
                              {format(new Date(p.date + 'T00:00:00'), 'dd/MM/yyyy')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Photo B Selector */}
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Depois (Foto B)</label>
                        <select
                          className="w-full bg-white border border-pink-100 rounded-lg p-1.5 text-xs text-zinc-700"
                          value={comparePhotoBId}
                          onChange={e => setComparePhotoBId(e.target.value)}
                        >
                          {photos.filter(p => p.angle === compareAngle).map(p => (
                            <option key={p.id} value={p.id}>
                              {format(new Date(p.date + 'T00:00:00'), 'dd/MM/yyyy')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Side-by-Side Frames */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Frame A */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-pink-500 tracking-wider">Foto A (Antes)</span>
                        {photos.find(p => p.id === comparePhotoAId) ? (
                          <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-pink-100 bg-zinc-50 shadow-inner">
                            <img 
                              src={photos.find(p => p.id === comparePhotoAId)?.imageUrl} 
                              alt="Before" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-bold font-mono">
                              {format(new Date(photos.find(p => p.id === comparePhotoAId)!.date + 'T00:00:00'), "dd/MM/yyyy")}
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[3/4] rounded-xl border border-dashed border-pink-105 flex flex-col justify-center items-center p-3 text-center text-[10px] text-zinc-450">
                            Nenhuma foto <br />selecionada.
                          </div>
                        )}
                      </div>

                      {/* Frame B */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-[#d4af37] tracking-wider">Foto B (Depois)</span>
                        {photos.find(p => p.id === comparePhotoBId) ? (
                          <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-pink-100 bg-zinc-50 shadow-inner">
                            <img 
                              src={photos.find(p => p.id === comparePhotoBId)?.imageUrl} 
                              alt="After" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[9px] text-white font-bold font-mono">
                              {format(new Date(photos.find(p => p.id === comparePhotoBId)!.date + 'T00:00:00'), "dd/MM/yyyy")}
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-[3/4] rounded-xl border border-dashed border-pink-105 flex flex-col justify-center items-center p-3 text-center text-[10px] text-zinc-455">
                            Nenhuma foto <br />selecionada.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compare Summary Insights */}
                    {photos.find(p => p.id === comparePhotoAId) && photos.find(p => p.id === comparePhotoBId) && (
                      <div className="bg-pink-50/20 border border-pink-100/50 p-2.5 rounded-xl space-y-1">
                        <span className="text-[9px] font-black uppercase text-pink-650 tracking-wider">Resumo Comparativo de Mudança</span>
                        <p className="text-[11px] text-zinc-650 leading-relaxed">
                          Visualização lado a lado do ângulo <strong className="text-zinc-700">
                            {compareAngle === 'Front' ? 'Frente' : compareAngle === 'Side' ? 'Perfil/Lado' : 'Costas'}
                          </strong>. Compara fotos registradas em datas distintas para acompanhar sua resposta fásica ao plano nutricional.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

        <AnimatePresence>
        {/* Modal: New Bioimpedance / Measurement logs */}
        {showAddMetric && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 max-h-[85vh] overflow-y-auto space-y-6 text-zinc-850"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase text-zinc-750">Adicionar Medição</h3>
                <button onClick={() => setShowAddMetric(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X size={20} /></button>
              </div>

              {/* Sub-form category selector */}
              <div className="flex bg-[#fffafa] p-1 border border-pink-100 rounded-xl text-[10px] uppercase font-bold tracking-wider gap-0.5">
                <button
                  type="button"
                  onClick={() => setFormSection('bio')}
                  className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                    formSection === 'bio' ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                  }`}
                >
                  Bioimpedância
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('medidas')}
                  className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                    formSection === 'medidas' ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                  }`}
                >
                  Medidas
                </button>
                <button
                  type="button"
                  onClick={() => setFormSection('dobras')}
                  className={`flex-1 py-2 rounded-lg text-center transition-all cursor-pointer ${
                    formSection === 'dobras' ? 'bg-pink-500 text-white font-black shadow-sm' : 'text-zinc-500 hover:text-pink-400'
                  }`}
                >
                  Dobras
                </button>
              </div>

              <div className="space-y-4 text-zinc-700">
                {/* Global Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Data</label>
                    <input 
                      type="date"
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                      value={newMetric.date}
                      onChange={e => setNewMetric({...newMetric, date: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Peso Completo (kg)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="e.g. 72.5" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                      value={newMetric.weight || ''}
                      onChange={e => setNewMetric({...newMetric, weight: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                {formSection === 'bio' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Gordura Corporal (%)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 15.4" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                          value={newMetric.bodyFat || ''}
                          onChange={e => setNewMetric({...newMetric, bodyFat: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Massa Muscular (%)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 38.2" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                          value={newMetric.muscleMass || ''}
                          onChange={e => setNewMetric({...newMetric, muscleMass: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Gordura Visceral</label>
                        <input 
                          type="number" 
                          placeholder="e.g. 4" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                          value={newMetric.visceralFat || ''}
                          onChange={e => setNewMetric({...newMetric, visceralFat: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Água (%)</label>
                        <input 
                          type="number" 
                          step="0.1" 
                          placeholder="e.g. 58.5" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                          value={newMetric.waterPercentage || ''}
                          onChange={e => setNewMetric({...newMetric, waterPercentage: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formSection === 'medidas' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Tórax (cm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.chest || ''}
                          onChange={e => setNewMetric({...newMetric, chest: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Cintura (cm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.waist || ''}
                          onChange={e => setNewMetric({...newMetric, waist: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Abdômen</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.abdomen || ''}
                          onChange={e => setNewMetric({...newMetric, abdomen: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Quadril (cm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.hip || ''}
                          onChange={e => setNewMetric({...newMetric, hip: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Bíceps Esq</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.bicepLeft || ''}
                          onChange={e => setNewMetric({...newMetric, bicepLeft: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Bíceps Dir</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.bicepRight || ''}
                          onChange={e => setNewMetric({...newMetric, bicepRight: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Coxa Esq / Dir</label>
                        <div className="flex gap-1">
                          <input 
                            type="number" 
                            placeholder="E" 
                            className="w-1/2 bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                            value={newMetric.thighLeft || ''}
                            onChange={e => setNewMetric({...newMetric, thighLeft: parseFloat(e.target.value) || 0})} 
                          />
                          <input 
                            type="number" 
                            placeholder="D" 
                            className="w-1/2 bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                            value={newMetric.thighRight || ''}
                            onChange={e => setNewMetric({...newMetric, thighRight: parseFloat(e.target.value) || 0})} 
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Panturrilha E / D</label>
                        <div className="flex gap-1">
                          <input 
                            type="number" 
                            placeholder="E" 
                            className="w-1/2 bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                            value={newMetric.calfLeft || ''}
                            onChange={e => setNewMetric({...newMetric, calfLeft: parseFloat(e.target.value) || 0})} 
                          />
                          <input 
                            type="number" 
                            placeholder="D" 
                            className="w-1/2 bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                            value={newMetric.calfRight || ''}
                            onChange={e => setNewMetric({...newMetric, calfRight: parseFloat(e.target.value) || 0})} 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formSection === 'dobras' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Bicipital (mm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.bicepsFold || ''}
                          onChange={e => setNewMetric({...newMetric, bicepsFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Tricipital (mm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.tricepsFold || ''}
                          onChange={e => setNewMetric({...newMetric, tricepsFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Subescapular</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.subscapularFold || ''}
                          onChange={e => setNewMetric({...newMetric, subscapularFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Supra-ilíaca</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.suprailiacFold || ''}
                          onChange={e => setNewMetric({...newMetric, suprailiacFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Abdominal (mm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.abdominalFold || ''}
                          onChange={e => setNewMetric({...newMetric, abdominalFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Peitoral (mm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.chestFold || ''}
                          onChange={e => setNewMetric({...newMetric, chestFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8px] uppercase font-bold text-zinc-400">Coxa (mm)</label>
                        <input 
                          type="number" 
                          className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-2 text-xs text-zinc-800" 
                          value={newMetric.thighFold || ''}
                          onChange={e => setNewMetric({...newMetric, thighFold: parseFloat(e.target.value) || 0})} 
                        />
                      </div>
                      <div className="bg-[#fffdf5] border border-amber-100/40 p-2.5 rounded-xl flex flex-col justify-center">
                        <span className="text-[8px] uppercase font-black text-[#d4af37]">Soma das Dobras</span>
                        <div className="text-[12px] font-mono font-bold text-zinc-700">
                          {
                            (newMetric.bicepsFold || 0) + (newMetric.tricepsFold || 0) + (newMetric.subscapularFold || 0) + (newMetric.suprailiacFold || 0) + (newMetric.abdominalFold || 0) + (newMetric.chestFold || 0) + (newMetric.thighFold || 0)
                          } mm
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Anotações / Observações</label>
                  <textarea 
                    placeholder="e.g., Jejum de 12 horas, feito de manhã."
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800 h-20"
                    value={newMetric.notes}
                    onChange={e => setNewMetric({...newMetric, notes: e.target.value})}
                  />
                </div>

                <button 
                  onClick={handleSaveMetric} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-xl shadow-lg shadow-pink-200/50 text-xs tracking-wider cursor-pointer"
                >
                  Salvar Medição
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: New Lab Exam */}
        {showAddExam && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 max-h-[85vh] overflow-y-auto space-y-4 text-zinc-800"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase text-zinc-700">Novo Registro de Exame</h3>
                <button onClick={() => setShowAddExam(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X size={20} /></button>
              </div>

              <div className="space-y-4 text-zinc-700">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Tipo de Exame / Nome</label>
                  <select 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800"
                    value={['Glicose (Jejum)', 'Colesterol Total', 'Colesterol HDL', 'Colesterol LDL', 'Triglicerídeos', 'Testosterona Total', 'Vitamina D', 'Vitamina C', 'Creatinina', 'Ureia', 'Cortisol'].includes(newExam.type) ? newExam.type : (newExam.type === '' ? '' : 'Outro')}
                    onChange={e => {
                      if (e.target.value === 'Outro') {
                        setNewExam({...newExam, type: ''});
                      } else {
                        let unit = 'mg/dL';
                        if (e.target.value === 'Testosterona Total') unit = 'ng/dL';
                        if (e.target.value === 'Vitamina D') unit = 'ng/mL';
                        if (e.target.value === 'Vitamina C') unit = 'mg/dL';
                        setNewExam({...newExam, type: e.target.value, unit});
                      }
                    }}
                  >
                    <option value="">Selecione um exame comum...</option>
                    <option value="Glicose (Jejum)">Glicose (Jejum)</option>
                    <option value="Colesterol Total">Colesterol Total</option>
                    <option value="Colesterol HDL">Colesterol HDL</option>
                    <option value="Colesterol LDL">Colesterol LDL</option>
                    <option value="Triglicerídeos">Triglicerídeos</option>
                    <option value="Testosterona Total">Testosterona Total</option>
                    <option value="Vitamina D">Vitamina D</option>
                    <option value="Vitamina C">Vitamina C</option>
                    <option value="Creatinina">Creatinina</option>
                    <option value="Ureia">Ureia</option>
                    <option value="Cortisol">Cortisol</option>
                    <option value="Outro">Outro (Digitar manualmente)...</option>
                  </select>
                  
                  {(!['Glicose (Jejum)', 'Colesterol Total', 'Colesterol HDL', 'Colesterol LDL', 'Triglicerídeos', 'Testosterona Total', 'Vitamina D', 'Vitamina C', 'Creatinina', 'Ureia', 'Cortisol'].includes(newExam.type) || newExam.type === '') && (
                    <input 
                      type="text" 
                      placeholder="Digite o nome do exame (ex: Hemoglobina Glicada)" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800 animate-fade-in" 
                      value={newExam.type}
                      onChange={e => setNewExam({...newExam, type: e.target.value})} 
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Valor Numérico</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="e.g. 95 ou 580" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                      value={newExam.value || ''}
                      onChange={e => setNewExam({...newExam, value: parseFloat(e.target.value) || 0})} 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Unidade</label>
                    <input 
                      type="text" 
                      placeholder="e.g. mg/dL, ng/dL, pg/mL" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                      value={newExam.unit}
                      onChange={e => setNewExam({...newExam, unit: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Resultado & Indicadores Completos</label>
                  <textarea 
                    placeholder="e.g. Valor: 650 ng/dL (Referência: 240 a 830 mg/dL)" 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800 h-24 font-mono" 
                    value={newExam.result}
                    onChange={e => setNewExam({...newExam, result: e.target.value})} 
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Anotações do Médico ou Observações</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mantido acompanhamento clínico." 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                    value={newExam.notes}
                    onChange={e => setNewExam({...newExam, notes: e.target.value})} 
                  />
                </div>

                <button 
                  onClick={handleSaveExam} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-xl shadow-lg shadow-pink-200/50 text-xs tracking-wider cursor-pointer"
                >
                  Salvar Exame
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Modal: New Progress Photo */}
        {showAddPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-8 border border-pink-100 space-y-4 text-zinc-800"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black italic uppercase text-zinc-700">Foto de Progresso</h3>
                <button onClick={() => setShowAddPhoto(false)} className="text-zinc-400 hover:text-zinc-650 cursor-pointer"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                {/* Drag and Drop Upload Area */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider mb-2 block font-semibold">Foto do Progresso</label>
                  
                  {newPhoto.imageUrl ? (
                    <div className="relative rounded-2xl border border-pink-100 p-2 bg-pink-50/20 flex flex-col items-center">
                      <img 
                        src={newPhoto.imageUrl} 
                        alt="Preview do Progresso" 
                        className="max-h-48 object-contain rounded-xl shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <button 
                        type="button"
                        onClick={() => setNewPhoto({ ...newPhoto, imageUrl: '' })}
                        className="mt-2 text-xs text-rose-500 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={12} /> Remover Foto
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('photo-upload-input')?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragging 
                          ? 'border-pink-500 bg-pink-50/50' 
                          : 'border-pink-200 bg-[#fffafa] hover:border-pink-400 hover:bg-pink-50/20'
                      }`}
                    >
                      <input 
                        type="file" 
                        id="photo-upload-input" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileSelect} 
                      />
                      <Camera size={32} className="text-pink-400 animate-pulse" />
                      <div>
                        <p className="text-xs font-bold text-zinc-700">Enviar da Galeria</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Toque para selecionar ou arraste a imagem aqui</p>
                      </div>
                    </div>
                  )}

                  {/* Fallback option to let the user insert a URL manually if they wish */}
                  <div className="mt-3 text-center">
                    <button 
                      type="button"
                      onClick={() => {
                        const url = prompt("Cole o link / URL da imagem:");
                        if (url) setNewPhoto({ ...newPhoto, imageUrl: url });
                      }}
                      className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37] hover:underline cursor-pointer"
                    >
                      Ou inserir por link/URL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-semibold">Ângulo / Pose</label>
                    <select 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800"
                      value={newPhoto.angle}
                      onChange={e => setNewPhoto({...newPhoto, angle: e.target.value})}
                    >
                      <option value="Front">Frente</option>
                      <option value="Side">Lado / Perfil</option>
                      <option value="Back">Costas</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider font-semibold">Data</label>
                    <input 
                      type="date" 
                      className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-805" 
                      value={newPhoto.date}
                      onChange={e => setNewPhoto({...newPhoto, date: e.target.value})} 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Anotações rápidas</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Pós-treino de perna, pump bom." 
                    className="w-full bg-[#fffafa] border border-pink-100 rounded-xl p-3 text-xs text-zinc-800" 
                    value={newPhoto.notes}
                    onChange={e => setNewPhoto({...newPhoto, notes: e.target.value})} 
                  />
                </div>

                <button 
                  onClick={handleSavePhoto} 
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-semibold uppercase py-4 rounded-xl shadow-lg shadow-pink-200/50 text-xs tracking-wider cursor-pointer"
                >
                  Salvar Foto de Evolução
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
