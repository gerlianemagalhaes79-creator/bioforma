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
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic">
          BioForma
        </h1>
        <div className="flex items-center gap-4">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-zinc-700"
            referrerPolicy="no-referrer"
          />
          <button onClick={logout} className="text-zinc-400 hover:text-white transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-lg mx-auto px-6 pt-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414]/90 backdrop-blur-lg border-t border-zinc-800 px-2 py-3">
        <div className="max-w-lg mx-auto flex justify-around items-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.id ? 'text-orange-500 scale-110' : 'text-zinc-500'
              }`}
            >
              <tab.icon size={24} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
