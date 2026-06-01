import React from 'react';
import { Activity, Apple, BarChart3, Heart, LogOut, TrendingUp, User as UserIcon } from 'lucide-react';
import { User } from '../firebase';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  logout: () => void;
}

export default function Layout({ children, activeTab, setActiveTab, user, logout }: LayoutProps) {
  const tabs = [
    { id: 'dashboard', icon: BarChart3, label: 'Início' },
    { id: 'workout', icon: Activity, label: 'Treino' },
    { id: 'diet', icon: Apple, label: 'Dieta' },
    { id: 'progress', icon: TrendingUp, label: 'Progresso' },
    { id: 'metrics', icon: Heart, label: 'Medidas' },
    { id: 'motivation', icon: UserIcon, label: 'IA' },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#fff9f9] text-zinc-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-pink-100/60 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-[#d4af37] to-rose-400 uppercase italic">
          BioForma
        </h1>
        <div className="flex items-center gap-4">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border-2 border-pink-200"
            referrerPolicy="no-referrer"
          />
          <button onClick={logout} className="text-rose-400 hover:text-rose-600 transition-colors cursor-pointer">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 pt-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-pink-100/60 px-2 py-3">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                activeTab === tab.id ? 'text-pink-500 scale-110 font-bold' : 'text-zinc-400'
              }`}
            >
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-pink-500 drop-shadow-[0_2px_4px_rgba(236,72,153,0.15)]' : 'text-zinc-400'} />
              <span className={`text-[10px] uppercase tracking-wider ${activeTab === tab.id ? 'text-pink-500 font-extrabold' : 'text-zinc-400 font-semibold'}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
