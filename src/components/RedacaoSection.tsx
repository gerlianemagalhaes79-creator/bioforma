import React, { useState } from 'react';
import { User, db, collection, addDoc } from '../firebase';
import { UserProfile, EssayTheme } from '../types';
import { ESSAY_THEMES } from '../data/seducData';
import { Sparkles, Edit3, Send, Award, CheckCircle, AlertCircle, BookOpen, BrainCircuit, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RedacaoSectionProps {
  user: User;
  profile: UserProfile | null;
}

export default function RedacaoSection({ user, profile }: RedacaoSectionProps) {
  const [themes] = useState<EssayTheme[]>(ESSAY_THEMES);
  const [selectedTheme, setSelectedTheme] = useState<EssayTheme>(ESSAY_THEMES[0]);
  const [essayText, setEssayText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const lineCount = essayText.split('\n').length;

  const handleCorrectEssay = async () => {
    if (!essayText || essayText.trim().length < 30) {
      alert('Sua resposta discursiva deve conter pelo menos 30 caracteres para uma análise completa.');
      return;
    }

    setEvaluating(true);
    setResult(null);

    try {
      const response = await fetch('/api/seduc/essay-correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeTitle: selectedTheme.title,
          promptText: selectedTheme.prompt,
          essayText
        })
      });

      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.includes('application/json')) {
        throw new Error('Serviço de correção temporariamente indisponível. Tente novamente em instantes.');
      }

      const resData = await response.json();
      if (resData.success) {
        setResult(resData.data);

        // Save essay result to Firestore
        try {
          await addDoc(collection(db, 'essays'), {
            uid: user.uid,
            themeTitle: selectedTheme.title,
            essayText,
            score: resData.data.score,
            criteriaScores: resData.data.criteriaScores,
            feedback: resData.data.feedback,
            submittedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Erro ao salvar redação no banco:', dbErr);
        }
      }
    } catch (err) {
      console.error('Erro na correção de redação:', err);
      alert('Ocorreu uma falha na conexão com a IA de correção. Tente novamente.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-green-700 text-white rounded-2xl shadow-xs">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-900">Prova Discursiva & Estudo de Caso</h2>
            <p className="text-xs text-zinc-500">Pratique questões dissertativas com avaliação da banca IA da SEDUC CE</p>
          </div>
        </div>
      </div>

      {/* Theme Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              setSelectedTheme(theme);
              setResult(null);
            }}
            className={`p-3 rounded-2xl text-left border transition-all shrink-0 w-64 border-0 cursor-pointer ${
              selectedTheme.id === theme.id 
                ? 'bg-emerald-800 text-white shadow-md' 
                : 'bg-white text-zinc-700 border-emerald-100 hover:bg-emerald-50'
            }`}
          >
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
              selectedTheme.id === theme.id ? 'bg-emerald-700 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {theme.category}
            </span>
            <p className="text-xs font-bold mt-1.5 line-clamp-2 leading-snug">
              {theme.title}
            </p>
          </button>
        ))}
      </div>

      {/* Prompt Details */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-zinc-900">{selectedTheme.title}</h3>
          <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-2xl mt-2 border border-zinc-100 leading-relaxed">
            {selectedTheme.prompt}
          </p>
        </div>

        {/* Guide Points */}
        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100 space-y-1.5">
          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
            Expectativa da Banca Examinadora (Pontos Ocultos de Grade):
          </p>
          <ul className="text-xs text-emerald-900/90 space-y-1 list-disc pl-4 font-medium">
            {selectedTheme.guidePoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>

        {/* Text Area */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-[11px] text-zinc-400 font-bold">
            <span>Escreva sua resposta dissertativa abaixo:</span>
            <span>{wordCount} palavras • ~{lineCount} linhas</span>
          </div>

          <textarea
            rows={9}
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Digite aqui sua fundamentação pedagógica e proposta de intervenção para a escola do Ceará..."
            className="w-full bg-zinc-50 border border-emerald-100 rounded-2xl p-4 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all shadow-inner leading-relaxed"
          />

          <button
            onClick={handleCorrectEssay}
            disabled={evaluating || !essayText.trim()}
            className={`w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all border-0 cursor-pointer flex items-center justify-center gap-2 ${
              evaluating || !essayText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
            }`}
          >
            <Sparkles size={16} className="text-amber-300" />
            <span>{evaluating ? 'Banca IA Avaliando Resposta...' : 'Corrigir com Banca IA SEDUC'}</span>
          </button>
        </div>
      </div>

      {/* AI Evaluation Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-emerald-950 text-white rounded-3xl p-5 border border-emerald-800 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-800 text-emerald-200 rounded-xl">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Resultado da Banca Examinadora IA</h4>
                  <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Concurso SEDUC CE 2026</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-black text-amber-300">{result.score}</span>
                <span className="text-xs text-emerald-300 font-bold">/100</span>
              </div>
            </div>

            {/* Criteria Scores Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-800">
                <p className="text-[9px] text-emerald-300 font-extrabold uppercase">Norma Culta & Gramática</p>
                <p className="text-sm font-black text-white mt-0.5">{result.criteriaScores.normaCulta} <span className="text-[10px] text-emerald-400">/25</span></p>
              </div>
              <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-800">
                <p className="text-[9px] text-emerald-300 font-extrabold uppercase">Domínio de Legislação</p>
                <p className="text-sm font-black text-white mt-0.5">{result.criteriaScores.dominioConteudo} <span className="text-[10px] text-emerald-400">/30</span></p>
              </div>
              <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-800">
                <p className="text-[9px] text-emerald-300 font-extrabold uppercase">Estrutura & Coesão</p>
                <p className="text-sm font-black text-white mt-0.5">{result.criteriaScores.estruturacaoTexto} <span className="text-[10px] text-emerald-400">/25</span></p>
              </div>
              <div className="bg-emerald-900/60 p-2.5 rounded-2xl border border-emerald-800">
                <p className="text-[9px] text-emerald-300 font-extrabold uppercase">Proposta Pedagógica</p>
                <p className="text-sm font-black text-white mt-0.5">{result.criteriaScores.propostaPedagogica} <span className="text-[10px] text-emerald-400">/20</span></p>
              </div>
            </div>

            {/* Feedback Box */}
            <div className="bg-emerald-900/40 p-3.5 rounded-2xl border border-emerald-800/80 space-y-1.5 text-xs">
              <p className="font-extrabold text-amber-300 uppercase text-[10px] tracking-wider">Parecer da Banca:</p>
              <p className="text-emerald-100/90 leading-relaxed text-[11px]">{result.feedback}</p>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {result.strengths && result.strengths.length > 0 && (
                <div className="bg-emerald-900/30 p-3 rounded-2xl border border-emerald-800/60 space-y-1">
                  <p className="font-extrabold text-emerald-300 text-[10px] uppercase">Pontos Fortes:</p>
                  <ul className="list-disc pl-4 text-emerald-200/90 text-[11px] space-y-0.5">
                    {result.strengths.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.improvements && result.improvements.length > 0 && (
                <div className="bg-amber-950/30 p-3 rounded-2xl border border-amber-800/40 space-y-1">
                  <p className="font-extrabold text-amber-300 text-[10px] uppercase">Ajustes Recomendados:</p>
                  <ul className="list-disc pl-4 text-amber-100/90 text-[11px] space-y-0.5">
                    {result.improvements.map((imp: string, idx: number) => (
                      <li key={idx}>{imp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
