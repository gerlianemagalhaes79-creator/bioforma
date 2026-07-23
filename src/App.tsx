import React, { useState, useEffect } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  loginWithGoogle, 
  logout, 
  User, 
  db, 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  deleteDoc,
  collection,
  query,
  where,
  Timestamp, 
  onSnapshot 
} from './firebase';
import { UserProfile } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CronogramaSection from './components/CronogramaSection';
import EditalSection from './components/EditalSection';
import SimuladosSection from './components/SimuladosSection';
import RedacaoSection from './components/RedacaoSection';
import TutorIASection from './components/TutorIASection';
import ProfileModal from './components/ProfileModal';
import OnboardingModal from './components/OnboardingModal';
import { LogIn, GraduationCap, Sparkles, BookOpen, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'admin_users' | 'add_user'>('admin_users');
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const handleOpenProfile = (tab?: 'profile' | 'admin_users' | 'add_user') => {
    const isSuperAdmin = (user?.email || userProfile?.email || '').toLowerCase().trim() === 'gerlianemagalhaes79@gmail.com';
    const targetTab = isSuperAdmin ? (tab || 'admin_users') : 'profile';
    setProfileModalTab(targetTab);
    setShowProfileModal(true);
  };

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
        const cleanEmail = (currentUser.email || '').toLowerCase().trim();
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Check if there is a pre-registered profile with this email
          let preRegDocId: string | null = null;
          let preRegProfile: any = null;

          if (cleanEmail) {
            try {
              const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
              const preRegSnap = await getDocs(q);
              if (!preRegSnap.empty) {
                const docFound = preRegSnap.docs[0];
                preRegDocId = docFound.id;
                preRegProfile = docFound.data();
              }
            } catch (err) {
              console.warn('Erro ao consultar pré-cadastro por e-mail:', err);
            }
          }

          if (preRegProfile) {
            // Migrate pre-registered profile to currentUser.uid
            const mergedProfile: UserProfile = {
              ...preRegProfile,
              uid: currentUser.uid,
              name: currentUser.displayName || preRegProfile.name || 'Professor(a)',
              email: cleanEmail || preRegProfile.email,
              onboardingCompleted: true,
              createdAt: preRegProfile.createdAt || Timestamp.now()
            };
            await setDoc(userRef, mergedProfile);
            if (preRegDocId && preRegDocId !== currentUser.uid) {
              try {
                await deleteDoc(doc(db, 'users', preRegDocId));
              } catch (_) {}
            }
          } else {
            // Create fresh profile
            const isSuperAdmin = cleanEmail === 'gerlianemagalhaes79@gmail.com';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Professor(a)',
              email: cleanEmail,
              role: isSuperAdmin ? 'admin' : 'professor',
              isAdmin: isSuperAdmin,
              targetSubject: 'Língua Portuguesa',
              degree: 'Licenciatura em Língua Portuguesa / Letras',
              dailyGoalMinutes: 180,
              hoursPerDay: 3,
              streakDays: 7,
              completedTopicsCount: 6,
              totalQuestionsDone: 18,
              correctAnswersCount: 14,
              onboardingCompleted: true,
              createdAt: Timestamp.now()
            };
            await setDoc(userRef, newProfile);
          }
        } else {
          // Ensure role is set accurately
          const existingData = userSnap.data();
          const isSuperAdmin = cleanEmail === 'gerlianemagalhaes79@gmail.com';
          if (isSuperAdmin && (!existingData.role || existingData.role !== 'admin')) {
            await setDoc(userRef, { role: 'admin', isAdmin: true }, { merge: true });
          } else if (!isSuperAdmin && existingData.role === 'admin') {
            await setDoc(userRef, { role: 'professor', isAdmin: false }, { merge: true });
          }
        }

        // Listen to changes in real-time
        unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as UserProfile);
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
      <div className="flex items-center justify-center min-h-screen bg-[#f4fbf7] text-zinc-800">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
            <GraduationCap size={32} />
          </div>
          <span className="text-2xl font-black text-emerald-950 tracking-tight italic uppercase">
            Passei<span className="text-emerald-600">SEDUC</span>
          </span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f7ee] via-white to-[#f4fbf7] text-zinc-800 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-md space-y-6"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
            <GraduationCap size={44} strokeWidth={2.2} />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wider rounded-full border border-emerald-200">
              Concurso SEDUC CE 2026
            </span>
            <h1 className="text-4xl font-black tracking-tight text-emerald-950 mt-3 uppercase italic leading-none">
              Passei<span className="text-emerald-600">SEDUC</span>
            </h1>
            <p className="text-zinc-600 text-sm mt-3 leading-relaxed">
              Plataforma ultra inteligente de aprovação para professores no Concurso da SEDUC Ceará 2026. Edital verticalizado, cronograma interativo, simulados FUNECE, discursivas e Professor Mentor.
            </p>
          </div>
          
          {loginError && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in text-left">
              <span className="font-extrabold uppercase block mb-1">Atenção ao realizar login:</span>
              {loginError}
              <div className="mt-2 text-[10px] text-zinc-500 font-normal leading-normal select-text">
                Se a janela não abrir, certifique-se de permitir popups ou abra a aplicação em uma <strong>Nova Aba</strong> pelo menu superior.
              </div>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={signingIn}
            className={`w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white font-extrabold py-4 rounded-full flex items-center justify-center gap-3 hover:opacity-95 shadow-xl shadow-emerald-200 transition-all cursor-pointer ${
              signingIn ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {signingIn ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Acessando PasseiSEDUC...</span>
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
      case 'dashboard':
        return <Dashboard user={user} profile={userProfile} setActiveTab={setActiveTab} onOpenProfile={handleOpenProfile} />;
      case 'cronograma':
        return <CronogramaSection user={user} profile={userProfile} setActiveTab={setActiveTab} />;
      case 'edital':
        return <EditalSection user={user} profile={userProfile} setActiveTab={setActiveTab} />;
      case 'simulados':
        return <SimuladosSection user={user} profile={userProfile} />;
      case 'redacao':
        return <RedacaoSection user={user} profile={userProfile} />;
      case 'tutor':
        return <TutorIASection user={user} profile={userProfile} setActiveTab={setActiveTab} />;
      default:
        return <Dashboard user={user} profile={userProfile} setActiveTab={setActiveTab} onOpenProfile={handleOpenProfile} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user}
      logout={logout}
      streakDays={userProfile?.streakDays || 7}
      onOpenProfile={() => handleOpenProfile()}
    >
      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          user={user}
          profile={userProfile}
          initialTab={profileModalTab}
          onClose={() => setShowProfileModal(false)}
          onRecadastrar={() => setShowOnboardingModal(true)}
        />
      )}

      {/* Recadastrar / Onboarding Modal */}
      {showOnboardingModal && (
        <OnboardingModal
          user={user}
          profile={userProfile}
          onComplete={() => setShowOnboardingModal(false)}
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

