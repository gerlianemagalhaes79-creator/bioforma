import { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  logout, 
  User, 
  db, 
  doc, 
  getDoc, 
  setDoc,
  Timestamp,
  onSnapshot
} from './firebase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import WorkoutSection from './components/WorkoutSection';
import DietSection from './components/DietSection';
import MetricsSection from './components/MetricsSection';
import ProgressTracker from './components/ProgressTracker';
import MotivationSection from './components/MotivationSection';
import { LogIn, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showCancelWorkoutConfirm, setShowCancelWorkoutConfirm] = useState(false);

  const handleLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);
    setLoginError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.warn('Erro de login capturado:', err);
      if (err.code === 'auth/cancelled-popup-request') {
        setLoginError('O login foi cancelado porque uma nova tentativa foi aberta. Aguarde a janela carregar.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setLoginError('A janela de login com Google foi fechada antes de concluir o processo. Tente novamente.');
      } else if (err.code === 'auth/popup-blocked') {
        setLoginError('O navegador bloqueou o popup do Google. Ative a permissão de popups para este site!');
      } else {
        setLoginError(err.message || 'Erro inesperado na autenticação.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          const newProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Usuário',
            email: currentUser.email,
            createdAt: Timestamp.now(),
            dailyWaterGoal: 2500,
            dailyCalorieGoal: 2000,
            targetWeight: 70,
            baseExpenditure: 1800,
            objective: 'manutencao',
            proteinGoal: 130,
            carbGoal: 240,
            fatGoal: 60
          };
          await setDoc(userRef, newProfile);
        }

        // Listen to changes in real-time
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data());
          }
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffafa] text-zinc-800">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-amber-500 to-pink-600 font-sans"
        >
          BioForma
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fff5f5] via-white to-[#fffaf0] text-zinc-800 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md space-y-6"
        >
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-[#d4af37] to-rose-400 mb-2 leading-none uppercase italic">
            BioForma
          </h1>
          <p className="text-zinc-600 text-lg">
            Sua jornada para um corpo mais forte, harmonioso e saudável.
            Acompanhe treinos, dieta, bioimpedância e evolução com elegância.
          </p>
          
          {loginError && (
            <div className="p-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-2xl animate-fade-in text-left">
              <span className="font-extrabold uppercase block mb-1">Ops! Ocorreu um problema:</span>
              {loginError}
              <div className="mt-2 text-[10px] text-zinc-500 font-normal leading-normal select-text">
                Dica: O ambiente de desenvolvimento em iframe pode restringir popups. Se persistir, abra o app em uma <strong>Nova Aba</strong> pelo link superior.
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={signingIn}
            className={`w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:opacity-90 shadow-lg shadow-pink-200 transition-all cursor-pointer ${
              signingIn ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {signingIn ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>Entrar com Google</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} profile={userProfile} />;
      case 'workout': return (
        <WorkoutSection 
          user={user} 
          profile={userProfile} 
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
        />
      );
      case 'diet': return <DietSection user={user} profile={userProfile} />;
      case 'progress': return <ProgressTracker user={user} profile={userProfile} />;
      case 'metrics': return <MetricsSection user={user} />;
      case 'motivation': return <MotivationSection user={user} profile={userProfile} />;
      default: return <Dashboard user={user} profile={userProfile} />;
    }
  };

  return (
    <div className="relative">
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        logout={logout}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>

      {/* Floating Minimized Workout Tracker Bar */}
      <AnimatePresence>
        {activeSession && (isMinimized || activeTab !== 'workout') && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="fixed bottom-[74px] left-4 right-4 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 z-[49] bg-gradient-to-r from-zinc-900 to-zinc-950 text-white rounded-2xl px-4 py-3.5 shadow-xl border border-zinc-850 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-3 w-3 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
              <div className="min-w-0">
                <p className="text-[9px] text-pink-400 font-black uppercase tracking-widest leading-none">Treino Ativo</p>
                <p className="text-xs font-bold text-zinc-100 truncate mt-1">{activeSession.type}</p>
                <p className="text-[10px] text-zinc-400 font-bold leading-none mt-1">
                  {activeSession.exercises.filter((ex: any) => ex.completed).length} de {activeSession.exercises.length} exercícios
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('workout');
                  setIsMinimized(false);
                }}
                className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1 border-0"
              >
                <Maximize2 size={11} strokeWidth={3} />
                Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelWorkoutConfirm(true);
                }}
                className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center"
                title="Descartar treino"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal for Cancelling Active Session */}
      <AnimatePresence>
        {showCancelWorkoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-pink-100 shadow-2xl space-y-4 text-zinc-800"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <div className="bg-rose-50 p-2 rounded-xl text-rose-500">
                  <X size={20} />
                </div>
                <h4 className="font-extrabold text-zinc-800 text-lg">Cancelar Treino</h4>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Deseja mesmo cancelar e descartar a sessão de treino atual? Todo o progresso desta sessão será perdido de forma permanente.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCancelWorkoutConfirm(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-0"
                >
                  Continuar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveSession(null);
                    setIsMinimized(false);
                    setShowCancelWorkoutConfirm(false);
                  }}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase rounded-xl transition-all cursor-pointer border-0"
                >
                  Sim, Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
