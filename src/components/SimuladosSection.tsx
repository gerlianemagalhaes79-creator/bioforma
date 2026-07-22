import React, { useState } from 'react';
import { User, db, doc, setDoc } from '../firebase';
import { UserProfile, Question } from '../types';
import { SEDUC_QUESTIONS } from '../data/seducData';
import { FileText, CheckCircle2, XCircle, Sparkles, Filter, ChevronRight, RotateCcw, BrainCircuit, Award, BookOpen, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SimuladosSectionProps {
  user: User;
  profile: UserProfile | null;
}

export default function SimuladosSection({ user, profile }: SimuladosSectionProps) {
  const [questions] = useState<Question[]>(SEDUC_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | 'E' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [selectedSubject, setSelectedSubject] = useState<string>('Todas');

  const subjectsList = [
    'Todas',
    'Conhecimentos Específicos',
    'Educação Brasileira e Pedagógicos',
    'Língua Portuguesa',
    'Dados e Indicadores Educacionais',
    'Administração Pública'
  ];

  const filteredQuestions = questions.filter(q => {
    if (selectedSubject === 'Todas') return true;
    return q.category === selectedSubject || q.subject === selectedSubject;
  });

  const activeQuestionIndex = Math.min(currentIndex, Math.max(0, filteredQuestions.length - 1));
  const currentQuestion = filteredQuestions[activeQuestionIndex] || questions[0];

  const handleSelectOption = (letter: 'A' | 'B' | 'C' | 'D' | 'E') => {
    if (isSubmitted) return;
    setSelectedOption(letter);
  };

  const handleCheckAnswer = async () => {
    if (!selectedOption || isSubmitted) return;

    const isCorrect = selectedOption === currentQuestion.correctAnswer;
    setIsSubmitted(true);
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    // Update user profile question statistics in Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        totalQuestionsDone: (profile?.totalQuestionsDone || 0) + 1,
        correctAnswersCount: (profile?.correctAnswersCount || 0) + (isCorrect ? 1 : 0)
      }, { merge: true });
    } catch (err) {
      console.warn('Erro ao atualizar estatísticas de questões:', err);
    }
  };

  const handleFetchAiExplanation = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    try {
      const response = await fetch('/api/seduc/question-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQuestion.questionText,
          options: currentQuestion.options,
          correctAnswer: currentQuestion.correctAnswer,
          userAnswer: selectedOption,
          subject: currentQuestion.subject,
          topic: currentQuestion.topic
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiExplanation(data.text);
      }
    } catch (err) {
      console.error('Erro ao buscar explicação IA:', err);
      setAiExplanation(currentQuestion.explanation);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setAiExplanation(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop or finish
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-2xl shadow-xs">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-900">Simulados & Exercícios SEDUC CE</h2>
            <p className="text-xs text-zinc-500">Questões focadas na banca do concurso com resolução comentada</p>
          </div>
        </div>

        {/* Score Pill */}
        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-2xl text-center">
          <p className="text-[9px] font-black text-emerald-800 uppercase">Aproveitamento</p>
          <p className="text-sm font-black text-emerald-900">
            {score.correct}/{score.total} <span className="text-[10px] text-emerald-700">({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)</span>
          </p>
        </div>
      </div>

      {/* Subject Filter Pills (5 Bloco Oficial FUNECE) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {subjectsList.map((subj) => (
          <button
            key={subj}
            onClick={() => {
              setSelectedSubject(subj);
              setCurrentIndex(0);
              setSelectedOption(null);
              setIsSubmitted(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
              selectedSubject === subj
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:border-emerald-300'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Active Question Card */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-xs space-y-4">
        {/* Question Metadata Bar */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-800 text-white text-[10px] font-black uppercase">
              {currentQuestion.banca}
            </span>
            <span className="text-zinc-500 font-extrabold text-[11px]">
              {currentQuestion.subject} • {currentQuestion.topic}
            </span>
          </div>

          <span className="text-zinc-400 font-bold text-[10px]">
            Questão {currentIndex + 1} de {questions.length}
          </span>
        </div>

        {/* Enunciado */}
        <div className="space-y-2">
          {currentQuestion.supportText && (
            <p className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-xl italic border border-zinc-100">
              "{currentQuestion.supportText}"
            </p>
          )}
          <p className="text-xs sm:text-sm font-bold text-zinc-800 leading-relaxed">
            {currentQuestion.questionText}
          </p>
        </div>

        {/* Options List */}
        <div className="space-y-2 pt-1">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedOption === opt.letter;
            const isCorrectOption = opt.letter === currentQuestion.correctAnswer;

            let optionStyle = "border-zinc-200 bg-white hover:border-emerald-300 text-zinc-800";
            let badgeStyle = "bg-zinc-100 text-zinc-600";

            if (isSelected && !isSubmitted) {
              optionStyle = "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs";
              badgeStyle = "bg-emerald-600 text-white";
            } else if (isSubmitted) {
              if (isCorrectOption) {
                optionStyle = "border-emerald-500 bg-emerald-100/80 text-emerald-950 font-extrabold";
                badgeStyle = "bg-emerald-700 text-white";
              } else if (isSelected && !isCorrectOption) {
                optionStyle = "border-rose-400 bg-rose-50 text-rose-950 font-bold";
                badgeStyle = "bg-rose-600 text-white";
              }
            }

            return (
              <button
                key={opt.letter}
                onClick={() => handleSelectOption(opt.letter)}
                disabled={isSubmitted}
                className={`w-full p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${optionStyle}`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center text-xs font-black shrink-0 mt-0.5 ${badgeStyle}`}>
                  {opt.letter}
                </div>
                <span className="text-xs leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button: Submit or Next */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {!isSubmitted ? (
            <button
              onClick={handleCheckAnswer}
              disabled={!selectedOption}
              className={`w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all border-0 cursor-pointer ${
                !selectedOption ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95'
              }`}
            >
              Responder Questão
            </button>
          ) : (
            <div className="w-full space-y-3">
              {/* Feedback Alert */}
              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                selectedOption === currentQuestion.correctAnswer 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2.5">
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle size={20} className="text-rose-600 shrink-0" />
                  )}
                  <div>
                    <p className="font-extrabold text-xs">
                      {selectedOption === currentQuestion.correctAnswer ? 'Excelente! Resposta Correta 🎉' : 'Atenção ao Gabarito Oficial!'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Gabarito: <strong>Alternativa {currentQuestion.correctAnswer}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleFetchAiExplanation}
                  disabled={loadingAi}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] font-extrabold uppercase rounded-xl border-0 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>{loadingAi ? 'Analisando...' : 'Explicar IA'}</span>
                </button>
              </div>

              {/* AI Rationale Box */}
              {aiExplanation && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-950 text-white rounded-2xl text-xs space-y-2 border border-emerald-800"
                >
                  <div className="flex items-center gap-1.5 text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider">
                    <BrainCircuit size={15} />
                    <span>Fundamentação e Resolução da IA</span>
                  </div>
                  <p className="text-emerald-100/90 leading-relaxed whitespace-pre-line text-[11px]">
                    {aiExplanation}
                  </p>
                </motion.div>
              )}

              {/* Next Question Button */}
              <button
                onClick={handleNextQuestion}
                className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all border-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Próxima Questão</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
