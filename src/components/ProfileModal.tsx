import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { User, db, collection, doc, setDoc, getDocs, deleteDoc, Timestamp } from '../firebase';
import { FUNECE_DEGREE_OPTIONS } from '../data/seducData';
import { 
  User as UserIcon, 
  GraduationCap, 
  Calendar, 
  Clock, 
  Award, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Mail, 
  Sparkles, 
  UserPlus, 
  Users, 
  CheckCircle2, 
  Trash2, 
  Search,
  Key,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileModalProps {
  user: User;
  profile: UserProfile | null;
  onClose: () => void;
  onRecadastrar: () => void;
}

export default function ProfileModal({ user, profile, onClose, onRecadastrar }: ProfileModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'admin_users' | 'add_user'>('admin_users');
  
  // State for registering a new user (Admin mode)
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDegree, setNewUserDegree] = useState('Licenciatura em Língua Portuguesa / Letras');
  const [newUserHours, setNewUserHours] = useState('3');
  const [newUserWorking, setNewUserWorking] = useState('Sim - Professor Temporário (Rede Pública)');
  const [newUserAge, setNewUserAge] = useState('28');
  const [savingUser, setSavingUser] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Registered users list from Firestore
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users list from Firestore
  const fetchRegisteredUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list: UserProfile[] = [];
      snap.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as UserProfile);
      });
      setRegisteredUsers(list);
    } catch (err) {
      console.error('Erro ao buscar lista de professores:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchRegisteredUsers();
  }, []);

  // Handle Admin creating a new professor/user account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || savingUser) return;

    setSavingUser(true);
    setSuccessMsg(null);
    try {
      const cleanEmail = newUserEmail.trim().toLowerCase();
      // Generate a document ID based on email or timestamp
      const customDocId = `prof_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      
      const targetSub = newUserDegree
        .replace('Licenciatura em ', '')
        .replace(' / Letras', '')
        .replace(' / Ciências Biológicas', '');

      const newProfProfile: UserProfile = {
        uid: customDocId,
        name: newUserName.trim(),
        email: cleanEmail,
        role: 'professor',
        age: Number(newUserAge) || 28,
        isWorkingInArea: newUserWorking,
        degree: newUserDegree,
        targetSubject: targetSub,
        startDate: new Date().toISOString().split('T')[0],
        examDate: '2026-10-18',
        hoursPerDay: Number(newUserHours) || 3,
        dailyGoalMinutes: (Number(newUserHours) || 3) * 60,
        streakDays: 1,
        completedTopicsCount: 0,
        totalQuestionsDone: 0,
        correctAnswersCount: 0,
        onboardingCompleted: true,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'users', customDocId), newProfProfile);
      
      setSuccessMsg(`Professor(a) ${newUserName} cadastrado(a) com sucesso! Edital mapeado para ${targetSub}.`);
      setNewUserName('');
      setNewUserEmail('');
      fetchRegisteredUsers();
      setActiveSubTab('admin_users');
    } catch (err: any) {
      console.error('Erro ao cadastrar novo professor:', err);
      alert('Erro ao cadastrar usuário: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (uid: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover o cadastro do professor(a) "${name}"?`)) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        fetchRegisteredUsers();
      } catch (err) {
        console.error('Erro ao remover usuário:', err);
      }
    }
  };

  const filteredUsers = registeredUsers.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.degree && u.degree.toLowerCase().includes(term)) ||
      (u.targetSubject && u.targetSubject.toLowerCase().includes(term))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-emerald-100 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-5 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-emerald-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3.5 relative z-10">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
              alt={profile?.name || "Professor Administrador"}
              className="w-14 h-14 rounded-2xl border-2 border-amber-300 object-cover shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <ShieldCheck size={12} /> Perfil Administrador
                </span>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Gestão SEDUC CE 2026
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 truncate">
                Prof. {profile?.name || user.displayName || 'Administrador'}
              </h2>
              <p className="text-xs text-emerald-200/90 flex items-center gap-1 mt-0.5 truncate">
                <Mail size={12} /> {profile?.email || user.email}
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-1 mt-4 border-t border-emerald-800/80 pt-3 text-xs">
            <button
              onClick={() => setActiveSubTab('admin_users')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'admin_users'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users size={15} />
              <span>Professores Cadastrados ({registeredUsers.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('add_user')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'add_user'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus size={15} />
              <span>Cadastrar Novo Professor</span>
            </button>

            <button
              onClick={() => setActiveSubTab('profile')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                activeSubTab === 'profile'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-emerald-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserIcon size={15} />
              <span>Meus Dados Admin</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: Lista de Professores Cadastrados pelo Admin */}
          {activeSubTab === 'admin_users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                    <Users size={18} className="text-emerald-600" />
                    Professores e Concursando Mapeados
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Sua conta de administrador permite gerenciar e vincular o cronograma de cada formação.
                  </p>
                </div>

                <button
                  onClick={() => setActiveSubTab('add_user')}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs rounded-xl hover:opacity-95 shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UserPlus size={15} />
                  <span>Novo Cadastro</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-zinc-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, email ou licenciatura (ex: Matemática, Biologia)..."
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Users Cards List */}
              {loadingUsers ? (
                <div className="text-center py-8 text-xs text-zinc-400 animate-pulse">
                  Carregando lista de professores cadastrados...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-6 text-center space-y-2">
                  <Users size={28} className="mx-auto text-zinc-300" />
                  <p className="text-xs font-bold text-zinc-600">Nenhum professor encontrado com esse filtro.</p>
                  <button
                    onClick={() => setActiveSubTab('add_user')}
                    className="text-xs text-emerald-700 font-extrabold underline cursor-pointer"
                  >
                    Clique aqui para cadastrar um novo professor
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.uid}
                      className="p-3.5 bg-white border border-zinc-200 rounded-2xl hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0 text-xs">
                          {u.name?.charAt(0) || 'P'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-zinc-900 truncate">
                              {u.name}
                            </span>
                            {u.role === 'admin' && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{u.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-100">
                              {u.degree || 'Licenciatura em Língua Portuguesa'}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-semibold">
                              {u.hoursPerDay || 3}h/dia de estudos
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleDeleteUser(u.uid, u.name)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Remover Professor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Form para Cadastrar Novo Professor */}
          {activeSubTab === 'add_user' && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <Sparkles size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Como <strong>Administrador</strong>, você pode cadastrar outros professores informando a licenciatura exata. O sistema atrelará automaticamente os tópicos de <strong>Conhecimentos Específicos FUNECE</strong> para a formação escolhida!
                </p>
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Nome Completo do Professor</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ex: Prof. Carlos Eduardo"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">E-mail para Acesso</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Formação / Licenciatura */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 flex items-center gap-1">
                  <GraduationCap size={14} className="text-emerald-600" /> Formação / Licenciatura do Candidato
                </label>
                <select
                  value={newUserDegree}
                  onChange={(e) => setNewUserDegree(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-emerald-50/40 text-emerald-950 font-medium"
                >
                  {FUNECE_DEGREE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Atuação na Área */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Atuação Profissional</label>
                  <select
                    value={newUserWorking}
                    onChange={(e) => setNewUserWorking(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Sim - Professor Temporário (Rede Pública)">
                      Sim - Professor Temporário (Rede Pública)
                    </option>
                    <option value="Sim - Escola Privada / Cursos">
                      Sim - Escola Privada / Cursos
                    </option>
                    <option value="Não atuo na área ainda">
                      Não atuo na área educacional ainda
                    </option>
                  </select>
                </div>

                {/* Carga Horária */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Carga Horária Diária</label>
                  <select
                    value={newUserHours}
                    onChange={(e) => setNewUserHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="2">2 Horas/dia (2 assuntos/dia no cronograma)</option>
                    <option value="3">3 Horas/dia (3 assuntos/dia no cronograma)</option>
                    <option value="4">4 Horas/dia (3-4 assuntos/dia no cronograma)</option>
                    <option value="6">6 Horas/dia (4 assuntos/dia - Foco Total)</option>
                    <option value="8">8 Horas/dia (4 assuntos/dia - Dedicação Exclusiva)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingUser}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold py-3 px-6 rounded-2xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition text-xs uppercase tracking-wider"
              >
                {savingUser ? (
                  <span>Cadastrando no Banco de Dados...</span>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Cadastrar Professor e Gerar Cronograma</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: Meus Dados de Administrador */}
          {activeSubTab === 'profile' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck size={16} /> Seus Dados de Administrador
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <UserIcon size={12} className="text-emerald-600" /> Idade
                    </span>
                    <p className="font-extrabold text-zinc-800">{profile?.age ? `${profile.age} anos` : 'Não informada'}</p>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <Award size={12} className="text-emerald-600" /> Atuação na Educação
                    </span>
                    <p className="font-extrabold text-zinc-800 truncate">{profile?.isWorkingInArea || 'Administrador do Sistema'}</p>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-0.5 sm:col-span-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <GraduationCap size={12} className="text-emerald-600" /> Sua Licenciatura / Formação
                    </span>
                    <p className="font-extrabold text-emerald-950">{profile?.degree || 'Licenciatura em Língua Portuguesa'}</p>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                      <Calendar size={12} className="text-emerald-600" /> Início dos Estudos
                    </span>
                    <p className="font-extrabold text-zinc-800">{profile?.startDate || '2026-07-22'}</p>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-0.5">
                    <span className="text-[10px] font-bold text-amber-800 uppercase flex items-center gap-1">
                      <Calendar size={12} className="text-amber-600" /> Data Prevista da Prova
                    </span>
                    <p className="font-extrabold text-amber-950">{profile?.examDate || '2026-10-18'}</p>
                  </div>
                </div>
              </div>

              {/* Recadastrar Button */}
              <button
                onClick={() => {
                  onClose();
                  onRecadastrar();
                }}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold py-3 px-6 rounded-2xl hover:opacity-95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition text-xs uppercase tracking-wider"
              >
                <RefreshCw size={16} />
                <span>Recadastrar Minhas Informações</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
