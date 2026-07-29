import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { UserProfile } from '../types';
import { getUserBadges, Badge } from '../utils/badges';
import { 
  Award, 
  Flame, 
  Zap, 
  ShieldCheck, 
  Target, 
  BrainCircuit, 
  TrendingUp, 
  BookOpen, 
  Calendar, 
  PenTool, 
  Crown, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ChevronRight,
  Filter,
  X,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BadgesSectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab?: (tab: string) => void;
}

export default function BadgesSection({ user, profile, setActiveTab }: BadgesSectionProps) {
  const activeUid = user?.uid || profile?.uid || 'guest';
  const [{ badges, unlockedCount, totalCount }, setBadgesData] = useState(() => getUserBadges(activeUid));
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Refresh badges on streak or log updates
  useEffect(() => {
    const refresh = () => {
      setBadgesData(getUserBadges(activeUid));
    };

    refresh();
    window.addEventListener('userStreakUpdated', refresh);
    window.addEventListener('questionLogUpdated', refresh);
    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener('userStreakUpdated', refresh);
      window.removeEventListener('questionLogUpdated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [activeUid]);

  const renderIcon = (name: string, size = 20, className = '') => {
    switch (name) {
      case 'Zap': return <Zap size={size} className={className} />;
      case 'Flame': return <Flame size={size} className={className} />;
      case 'ShieldCheck': return <ShieldCheck size={size} className={className} />;
      case 'Award': return <Award size={size} className={className} />;
      case 'Crown': return <Crown size={size} className={className} />;
      case 'CheckCircle2': return <CheckCircle2 size={size} className={className} />;
      case 'Target': return <Target size={size} className={className} />;
      case 'BrainCircuit': return <BrainCircuit size={size} className={className} />;
      case 'TrendingUp': return <TrendingUp size={size} className={className} />;
      case 'BookOpen': return <BookOpen size={size} className={className} />;
      case 'Calendar': return <Calendar size={size} className={className} />;
      case 'PenTool': return <PenTool size={size} className={className} />;
      default: return <Sparkles size={size} className={className} />;
    }
  };

  const getBadgeColorStyles = (color: Badge['color'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBg: 'bg-zinc-50/80 border-zinc-200/80 text-zinc-400',
        iconBg: 'bg-zinc-200/70 text-zinc-400 border-zinc-300',
        badgeBg: 'bg-zinc-100 text-zinc-500 border-zinc-200',
        progressFill: 'bg-zinc-400'
      };
    }

    switch (color) {
      case 'emerald':
        return {
          cardBg: 'bg-emerald-50/60 border-emerald-300/80 text-emerald-950 shadow-2xs',
          iconBg: 'bg-emerald-800 text-white border-emerald-900',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          progressFill: 'bg-emerald-800'
        };
      case 'amber':
        return {
          cardBg: 'bg-amber-50/60 border-amber-300/80 text-amber-950 shadow-2xs',
          iconBg: 'bg-amber-800 text-white border-amber-900',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          progressFill: 'bg-amber-800'
        };
      case 'purple':
        return {
          cardBg: 'bg-purple-50/60 border-purple-300/80 text-purple-950 shadow-2xs',
          iconBg: 'bg-purple-800 text-white border-purple-900',
          badgeBg: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
          progressFill: 'bg-purple-800'
        };
      case 'indigo':
        return {
          cardBg: 'bg-indigo-50/60 border-indigo-300/80 text-indigo-950 shadow-2xs',
          iconBg: 'bg-indigo-800 text-white border-indigo-900',
          badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
          progressFill: 'bg-indigo-800'
        };
      case 'rose':
        return {
          cardBg: 'bg-rose-50/60 border-rose-300/80 text-rose-950 shadow-2xs',
          iconBg: 'bg-rose-800 text-white border-rose-900',
          badgeBg: 'bg-rose-100 text-rose-900 border-rose-300 font-bold',
          progressFill: 'bg-rose-800'
        };
      case 'cyan':
        return {
          cardBg: 'bg-cyan-50/60 border-cyan-300/80 text-cyan-950 shadow-2xs',
          iconBg: 'bg-cyan-800 text-white border-cyan-900',
          badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold',
          progressFill: 'bg-cyan-800'
        };
    }
  };

  const filteredBadges = badges.filter(b => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'unlocked') return b.unlocked;
    if (selectedCategory === 'locked') return !b.unlocked;
    return b.category === selectedCategory;
  });

  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-3.5 sm:p-5 shadow-2xs space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Award size={20} className="text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-zinc-900 text-sm sm:text-base tracking-tight">
                Galeria de Conquistas & Metas
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-300 uppercase">
                {unlockedCount} / {totalCount} Conquistadas
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              Desbloqueie selos de desempenho mantendo sua rotina de estudos ativa no ritmo SEDUC CE 2026.
            </p>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full sm:w-48 space-y-1 shrink-0">
          <div className="flex justify-between text-[11px] font-bold text-zinc-700">
            <span>Progresso Geral</span>
            <span className="text-emerald-900">{completionPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/60">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-emerald-800 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
            selectedCategory === 'all' 
              ? 'bg-emerald-900 text-white shadow-2xs' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          Todas ({totalCount})
        </button>
        <button
          onClick={() => setSelectedCategory('unlocked')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            selectedCategory === 'unlocked' 
              ? 'bg-emerald-900 text-white shadow-2xs' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Sparkles size={12} className="text-amber-400" /> Conquistadas ({unlockedCount})
        </button>
        <button
          onClick={() => setSelectedCategory('streak')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            selectedCategory === 'streak' 
              ? 'bg-emerald-900 text-white shadow-2xs' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Flame size={12} className="text-amber-500" /> Ofensiva
        </button>
        <button
          onClick={() => setSelectedCategory('questions')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            selectedCategory === 'questions' 
              ? 'bg-emerald-900 text-white shadow-2xs' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <Target size={12} /> Questões
        </button>
        <button
          onClick={() => setSelectedCategory('study')}
          className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer ${
            selectedCategory === 'study' 
              ? 'bg-emerald-900 text-white shadow-2xs' 
              : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
          }`}
        >
          <BookOpen size={12} /> Edital & Metas
        </button>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredBadges.map((badge) => {
          const styles = getBadgeColorStyles(badge.color, badge.unlocked);
          const pct = Math.min(100, Math.round((badge.currentProgress / badge.maxProgress) * 100));

          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedBadge(badge)}
              className={`p-3.5 rounded-xl border transition cursor-pointer relative flex flex-col justify-between ${styles.cardBg}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${styles.iconBg}`}>
                      {renderIcon(badge.iconName, 18)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs sm:text-sm tracking-tight truncate flex items-center gap-1">
                        {badge.title}
                      </h4>
                      <p className="text-[10px] opacity-80 font-medium line-clamp-1">{badge.description}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] border shrink-0 uppercase tracking-wider ${styles.badgeBg}`}>
                    {badge.unlocked ? 'Desbloqueado' : 'Em Progresso'}
                  </span>
                </div>

                {/* Motto quote */}
                <p className="text-[11px] italic opacity-90 border-l-2 border-current/30 pl-2 py-0.5 font-medium">
                  "{badge.motto}"
                </p>
              </div>

              {/* Progress Indicator */}
              <div className="mt-3 space-y-1 pt-2 border-t border-current/10">
                <div className="flex justify-between items-center text-[10px] font-bold opacity-90">
                  <span>
                    {badge.id === 'accuracy_80' 
                      ? `Rendimento: ${badge.currentProgress}%`
                      : `Progresso: ${badge.currentProgress} / ${badge.maxProgress}`
                    }
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${styles.progressFill}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Details for Selected Badge */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-zinc-200 rounded-2xl max-w-md w-full p-5 shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 p-1 rounded-lg bg-zinc-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 rounded-2xl bg-emerald-900 text-white flex items-center justify-center mx-auto shadow-md border-2 border-emerald-700">
                  {renderIcon(selectedBadge.iconName, 32)}
                </div>

                <div>
                  <div className="flex items-center justify-center gap-1.5">
                    <h3 className="text-lg font-black text-zinc-900">{selectedBadge.title}</h3>
                    {selectedBadge.unlocked && <Star size={16} className="text-amber-500 fill-amber-500" />}
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">{selectedBadge.description}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center">
                <p className="text-xs font-bold text-emerald-950 italic">
                  "{selectedBadge.motto}"
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 bg-zinc-50 rounded-lg border border-zinc-200/80">
                  <span className="font-bold text-zinc-600">Status Atual:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedBadge.unlocked ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {selectedBadge.unlocked ? '✨ Conquistada' : '⏳ Em Andamento'}
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
                  <p className="font-bold text-zinc-900">Como conquistar:</p>
                  <p className="text-zinc-600 leading-relaxed">
                    {selectedBadge.category === 'streak' && 'Mantenha sua rotina diária estudando ou respondendo simulados sem quebrar sua sequência de dias consecutivos.'}
                    {selectedBadge.category === 'questions' && 'Pratique com os simulados no padrão FUNECE para acumular questões resolvidas e fixar o edital.'}
                    {selectedBadge.category === 'accuracy' && 'Mantenha um alto índice de acertos nos simulados (acima de 80%) para demonstrar domínio do conteúdo.'}
                    {selectedBadge.category === 'study' && 'Marque tópicos e subtópicos como concluídos no Cronograma de Estudos.'}
                    {selectedBadge.category === 'essay' && 'Envie uma redação discursiva para correção pela IA e conquiste nota 80 ou superior.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
              >
                Entendido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
