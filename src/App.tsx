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
  Timestamp
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
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
            targetWeight: 70
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        } else {
          setUserProfile(userSnap.data());
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a] text-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-2xl font-bold tracking-tighter uppercase italic"
        >
          BioForma
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md"
        >
          <h1 className="text-6xl font-black tracking-tighter uppercase italic mb-4 leading-none">
            BioForma
          </h1>
          <p className="text-zinc-400 mb-8 text-lg">
            Sua jornada para um corpo mais forte e saudável começa aqui.
            Acompanhe treinos, dieta e evolução com inteligência.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-3 hover:bg-zinc-200 transition-colors"
          >
            <LogIn size={20} />
            Entrar com Google
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
