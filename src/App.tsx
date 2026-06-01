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
import { LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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
      case 'workout': return <WorkoutSection user={user} />;
      case 'diet': return <DietSection user={user} profile={userProfile} />;
      case 'progress': return <ProgressTracker user={user} profile={userProfile} />;
      case 'metrics': return <MetricsSection user={user} />;
      case 'motivation': return <MotivationSection user={user} profile={userProfile} />;
      default: return <Dashboard user={user} profile={userProfile} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user}
      logout={logout}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="pb-24"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}
