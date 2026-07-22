import React from 'react';
import { LayoutDashboard, Calendar, BookOpen, FileText, Sparkles, Bot, LogOut, GraduationCap, Flame, User } from 'lucide-react';
import { User as FirebaseUser } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: FirebaseUser;
  logout: () => void;
  streakDays?: number;
  onOpenProfile?: () => void;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab, 
  user, 
  logout, 
  streakDays = 7,
  onOpenProfile
}: LayoutProps) {
  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Início' },
    { id: 'cronograma', icon: Calendar, label: 'Cronograma' },
    { id: 'edital', icon: BookOpen, label: 'Edital' },
    { id: 'simulados', icon: FileText, label: 'Simulados' },
    { id: 'redacao', icon: Sparkles, label: 'Discursiva' },
    { id: 'tutor', icon: Bot, label: 'Tutor IA' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f4fbf7] text-zinc-800 font-sans pb-24">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-emerald-100 px-3 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div 
          onClick={() => setActiveTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-200">
            <GraduationCap size={22} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-black tracking-tight text-emerald-950 uppercase italic leading-none">
                Passei<span className="text-emerald-600">SEDUC</span>
              </h1>
              <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded-md uppercase tracking-wider">
                2026
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 font-semibold tracking-wide mt-0.5">
              FUNECE • Preparatório SEDUC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Study Streak Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-700 text-xs font-bold" title="Sequência de Estudo">
            <Flame size={14} className="fill-amber-500 text-amber-500 animate-pulse" />
            <span>{streakDays}d</span>
          </div>

          <div className="flex items-center gap-2 border-l border-emerald-100 pl-2.5">
            {/* Clickable Profile Avatar button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 p-1 hover:bg-emerald-50 rounded-xl transition cursor-pointer border border-transparent hover:border-emerald-200"
              title="Meu Perfil / Recadastrar Dados"
            >
              <img 
                src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                alt={user.displayName || "Professor"} 
                className="w-8 h-8 rounded-full border-2 border-emerald-400 object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="text-[11px] font-bold text-emerald-900 hidden md:inline">Perfil</span>
            </button>

            <button 
              onClick={logout} 
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer border-0 bg-transparent"
              title="Sair do PasseiSEDUC"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-3.5 pt-4 sm:px-6">
        {children}
      </main>

      {/* Bottom Floating Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-emerald-100 px-1 py-1.5 shadow-lg">
        <div className="max-w-xl mx-auto flex justify-around items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all cursor-pointer border-0 bg-transparent ${
                  isActive ? 'text-emerald-700 font-bold scale-105' : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-transparent'}`}>
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] tracking-tight uppercase ${isActive ? 'text-emerald-800 font-extrabold' : 'text-zinc-500 font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

