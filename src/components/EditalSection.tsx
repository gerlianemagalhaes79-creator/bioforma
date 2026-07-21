import React, { useState } from 'react';
import { User, db, doc, setDoc } from '../firebase';
import { UserProfile, EditalTopic, TopicStatus } from '../types';
import { INITIAL_EDITAL_TOPICS } from '../data/seducData';
import { BookOpen, CheckCircle2, Clock, Sparkles, Search, Filter, AlertCircle, Bot, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EditalSectionProps {
  user: User;
  profile: UserProfile | null;
  setActiveTab: (tab: string) => void;
}

export default function EditalSection({ user, profile, setActiveTab }: EditalSectionProps) {
  const [topics, setTopics] = useState<EditalTopic[]>(INITIAL_EDITAL_TOPICS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const categories = ['Todos', 'Conhecimentos Básicos', 'Didática e Legislação', 'Conhecimentos Específicos'];

  const handleStatusChange = async (topicId: string, newStatus: TopicStatus) => {
    const updated = topics.map(t => t.id === topicId ? { ...t, status: newStatus } : t);
    setTopics(updated);

    // Persist user study progress to Firestore
    try {
      const userProgressRef = doc(db, 'studyProgress', `${user.uid}_${topicId}`);
      await setDoc(userProgressRef, {
        uid: user.uid,
        topicId,
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Update completed topic count in user profile
      const completedCount = updated.filter(t => t.status === 'mastered' || t.status === 'reviewed').length;
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { completedTopicsCount: completedCount }, { merge: true });
    } catch (err) {
      console.warn('Erro ao atualizar progresso do edital:', err);
    }
  };

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.topicName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          topic.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || topic.category === selectedCategory;
    const matchesStatus = statusFilter === 'Todos' || 
      (statusFilter === 'Iniciado' && topic.status === 'in_progress') ||
      (statusFilter === 'Revisado' && topic.status === 'reviewed') ||
      (statusFilter === 'Dominado' && topic.status === 'mastered') ||
      (statusFilter === 'A Estudar' && topic.status === 'not_started');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate Progress Stats
  const totalCount = topics.length;
  const masteredCount = topics.filter(t => t.status === 'mastered').length;
  const reviewedCount = topics.filter(t => t.status === 'reviewed').length;
  const inProgressCount = topics.filter(t => t.status === 'in_progress').length;
  const progressPercent = Math.round(((masteredCount + reviewedCount * 0.7 + inProgressCount * 0.3) / totalCount) * 100);

  const getStatusBadge = (status: TopicStatus) => {
    switch (status) {
      case 'mastered':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Dominado</span>;
      case 'reviewed':
        return <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-black uppercase">Revisado</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Em Estudo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase">A Estudar</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Edital Progress Banner */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900">Edital Verticalizado SEDUC CE 2026</h2>
              <p className="text-xs text-zinc-500">Mapeamento completo dos conteúdos e legislação do concurso</p>
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-700">{progressPercent}%</span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden p-0.5 border border-zinc-200">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 h-2 rounded-full"
          />
        </div>

        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center">
          <div className="p-1.5 rounded-xl bg-zinc-50 border border-zinc-100">
            <p className="text-[9px] font-extrabold text-zinc-400 uppercase">A Estudar</p>
            <p className="text-xs font-black text-zinc-700">{topics.filter(t => t.status === 'not_started').length}</p>
          </div>
          <div className="p-1.5 rounded-xl bg-amber-50/80 border border-amber-100">
            <p className="text-[9px] font-extrabold text-amber-600 uppercase">Em Estudo</p>
            <p className="text-xs font-black text-amber-800">{inProgressCount}</p>
          </div>
          <div className="p-1.5 rounded-xl bg-teal-50/80 border border-teal-100">
            <p className="text-[9px] font-extrabold text-teal-600 uppercase">Revisado</p>
            <p className="text-xs font-black text-teal-800">{reviewedCount}</p>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100">
            <p className="text-[9px] font-extrabold text-emerald-600 uppercase">Dominado</p>
            <p className="text-xs font-black text-emerald-800">{masteredCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Buscar tópico, lei ou assunto do edital..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-emerald-100 rounded-2xl pl-10 pr-4 py-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:border-emerald-500 transition-colors shadow-xs"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border-0 cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-emerald-800 text-white shadow-xs' 
                  : 'bg-white text-zinc-600 hover:bg-emerald-50 border border-emerald-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-emerald-100 text-zinc-500 space-y-2">
            <AlertCircle size={32} className="mx-auto text-zinc-300" />
            <p className="font-bold text-xs">Nenhum tópico encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <div 
              key={topic.id}
              className="bg-white rounded-2xl p-4 border border-emerald-100/90 shadow-xs hover:border-emerald-200 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wide bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      {topic.subject}
                    </span>
                    {topic.importance === 'alta' && (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-100">
                        Alta Relevância
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-zinc-900 text-xs leading-snug">
                    {topic.topicName}
                  </h4>
                </div>

                <div className="shrink-0">
                  {getStatusBadge(topic.status)}
                </div>
              </div>

              {/* Status Selector & Quick AI Action */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                <div className="flex items-center gap-1">
                  {(['not_started', 'in_progress', 'reviewed', 'mastered'] as TopicStatus[]).map((st) => {
                    const labels: Record<TopicStatus, string> = {
                      not_started: 'Não Visto',
                      in_progress: 'Estudando',
                      reviewed: 'Revisado',
                      mastered: 'Dominado'
                    };
                    const isSelected = topic.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(topic.id, st)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border-0 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-emerald-700 text-white shadow-xs' 
                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                        }`}
                      >
                        {labels[st]}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setActiveTab('tutor')}
                  className="p-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[10px] font-bold border border-emerald-200 cursor-pointer flex items-center gap-1"
                  title="Tirar dúvida sobre este tópico no Tutor IA"
                >
                  <Bot size={13} />
                  <span>Dúvida IA</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
