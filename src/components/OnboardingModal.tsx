import React, { useState } from 'react';
import { db, doc, setDoc } from '../firebase';
import { UserProfile } from '../types';
import { FUNECE_DEGREE_OPTIONS } from '../data/seducData';
import { GraduationCap, Calendar, Clock, UserCheck, Award, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingModalProps {
  user: any;
  profile: UserProfile | null;
  onComplete?: () => void;
}

export default function OnboardingModal({ user, profile, onComplete }: OnboardingModalProps) {
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [age, setAge] = useState<string>(profile?.age ? String(profile.age) : '28');
  const [isWorkingInArea, setIsWorkingInArea] = useState(
    profile?.isWorkingInArea || 'Sim - Professor Temporário (Rede Pública)'
  );
  const [degree, setDegree] = useState(profile?.degree || 'Licenciatura em Língua Portuguesa / Letras');
  const [startDate, setStartDate] = useState(
    profile?.startDate || new Date().toISOString().split('T')[0]
  );
  const [examDate, setExamDate] = useState(profile?.examDate || '2026-10-18');
  const [hoursPerDay, setHoursPerDay] = useState<string>(
    profile?.hoursPerDay ? String(profile.hoursPerDay) : '3'
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || saving) return;

    setSaving(true);
    try {
      const targetSub = degree
        .replace('Licenciatura em ', '')
        .replace(' / Letras', '')
        .replace(' / Ciências Biológicas', '');

      const userRef = doc(db, 'users', user.uid);
      const updatedProfile: Partial<UserProfile> = {
        name: name.trim() || 'Professor(a)',
        age: Number(age) || 28,
        isWorkingInArea,
        degree,
        targetSubject: targetSub,
        startDate,
        examDate,
        hoursPerDay: Number(hoursPerDay) || 3,
        dailyGoalMinutes: (Number(hoursPerDay) || 3) * 60,
        onboardingCompleted: true
      };

      await setDoc(userRef, updatedProfile, { merge: true });
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Erro ao salvar cadastro do professor:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-emerald-100 overflow-hidden my-6"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 text-white relative">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-amber-300">
              <GraduationCap size={28} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider border border-amber-400/30">
                Cadastro de Preparação FUNECE
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                Boas-vindas, Professor(a)!
              </h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Preencha seus dados para gerar seu <strong>Cronograma Personalizado 100% Edital SEDUC CE</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-600" /> Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Profª Gerliane Magalhães"
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Idade */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Award size={14} className="text-emerald-600" /> Idade
              </label>
              <input
                type="number"
                min="18"
                max="80"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Atuação na Área */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700">
              Já atua na área da Educação?
            </label>
            <select
              value={isWorkingInArea}
              onChange={(e) => setIsWorkingInArea(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50/50"
            >
              <option value="Sim - Professor Temporário (Rede Pública Estadual/Municipal)">
                Sim - Professor Temporário (Rede Pública Estadual/Municipal)
              </option>
              <option value="Sim - Escola Privada / Cursos">
                Sim - Professor na Rede Privada / Cursos
              </option>
              <option value="Não atuo na área ainda">
                Não atuo na área educacional ainda
              </option>
            </select>
          </div>

          {/* Formação Acadêmica */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-emerald-600" /> Sua Formação Acadêmica / Licenciatura
            </label>
            <select
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/30 text-emerald-950 font-medium"
            >
              {FUNECE_DEGREE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              O edital organizará automaticamente seu <strong>Conteúdo Específico</strong> da FUNECE com base nesta opção.
            </p>
          </div>

          {/* Datas de Estudos e Prova */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600" /> Iniciar Estudos Em:
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-600" /> Previsão da Prova SEDUC:
              </label>
              <input
                type="date"
                required
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-900 bg-amber-50/30"
              />
            </div>
          </div>

          {/* Horas de Estudo por Dia */}
          <div className="space-y-1 pt-1">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5">
              <Clock size={14} className="text-emerald-600" /> Quantas Horas Pretende Estudar por Dia?
            </label>
            <select
              value={hoursPerDay}
              onChange={(e) => setHoursPerDay(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-zinc-50/50"
            >
              <option value="2">2 Horas/dia (Distribuirá 2 assuntos/dia no Cronograma)</option>
              <option value="3">3 Horas/dia (Distribuirá 3 assuntos/dia no Cronograma)</option>
              <option value="4">4 Horas/dia (Distribuirá 3-4 assuntos/dia no Cronograma)</option>
              <option value="6">6 Horas/dia (Distribuirá 4 assuntos/dia no Cronograma - Foco Total)</option>
              <option value="8">8 Horas/dia (Distribuirá 4 assuntos/dia - Dedicação Exclusiva)</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
            <Sparkles size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Com a <strong>Banca FUNECE</strong> como organizadora, dividiremos 100% do seu conteúdo em <strong>Conteúdo Geral</strong> (Língua Portuguesa, RLM, Didática e Legislação do Ceará) e <strong>Conteúdo Específico</strong> da sua licenciatura!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-2xl hover:opacity-95 shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer transition text-sm"
          >
            {saving ? (
              <span>Gerando seu Cronograma FUNECE...</span>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Salvar e Gerar Cronograma do Edital</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
