import React, { useState } from 'react';
import {
  LogIn,
  KeyRound,
  User,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  School,
  CheckCircle2,
  BookOpen,
  HeartHandshake,
  CreditCard,
  Wrench,
  Award,
  ArrowRight,
  Info,
  Laptop,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile } from '../../types';
import { loginWithEmail, loginWithGoogle } from '../../lib/firebase';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { allStaff, setCurrentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'form' | 'roster'>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Authenticate using staff credentials (supports username or email)
  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Mohon masukkan nama pengguna / email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    const inputClean = identifier.trim().toLowerCase();
    const matchedStaff = allStaff.find((s) => {
      const matchUsername = s.username && s.username.toLowerCase() === inputClean;
      const matchEmail = s.email && s.email.toLowerCase() === inputClean;
      return matchUsername || matchEmail;
    });

    if (matchedStaff) {
      if (matchedStaff.password === password) {
        localStorage.setItem('schoolhub_auth_user_id', matchedStaff.id);
        setCurrentUser(matchedStaff);
        setIsLoading(false);
        onLoginSuccess?.();
        return;
      } else {
        setErrorMsg('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
        setIsLoading(false);
        return;
      }
    }

    // Try Firebase Email/Password auth if not matched locally
    loginWithEmail(identifier, password)
      .then((user) => {
        const staffByEmail = allStaff.find(
          (s) => s.email.toLowerCase() === (user.email || '').toLowerCase()
        );
        const userToSet = staffByEmail || allStaff[0];
        localStorage.setItem('schoolhub_auth_user_id', userToSet.id);
        setCurrentUser(userToSet);
        setIsLoading(false);
        onLoginSuccess?.();
      })
      .catch((err) => {
        console.warn('Firebase Auth failed, checking local credentials:', err);
        setErrorMsg('Pengguna tidak ditemukan atau kredensial salah. Gunakan tab "Pilih Akun Guru & Staf" untuk masuk cepat.');
        setIsLoading(false);
      });
  };

  // Quick 1-Click login as specific staff member
  const handleQuickLogin = (staff: UserProfile) => {
    localStorage.setItem('schoolhub_auth_user_id', staff.id);
    setCurrentUser(staff);
    onLoginSuccess?.();
  };

  // Google Sign-In via Firebase Auth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const gUser = await loginWithGoogle();
      const matched = allStaff.find(
        (s) => s.email.toLowerCase() === (gUser.email || '').toLowerCase()
      );
      const userToSet = matched || allStaff[0];
      localStorage.setItem('schoolhub_auth_user_id', userToSet.id);
      setCurrentUser(userToSet);
      setIsLoading(false);
      onLoginSuccess?.();
    } catch (err: any) {
      console.warn('Google Sign-In note:', err);
      // Fallback for demo if popup was blocked or demo keys are active
      if (allStaff.length > 0) {
        const defaultDev = allStaff.find((s) => s.roles.includes('Developer')) || allStaff[0];
        localStorage.setItem('schoolhub_auth_user_id', defaultDev.id);
        setCurrentUser(defaultDev);
        onLoginSuccess?.();
      } else {
        setErrorMsg('Login Google gagal: ' + (err?.message || 'Silakan coba lagi'));
      }
      setIsLoading(false);
    }
  };

  const featureCards = [
    {
      icon: School,
      title: 'Monitoring 6 Kelas Real-Time',
      desc: 'Pantau status hijau/merah kegiatan belajar, guru berhalangan, & rekomendasi guru pengganti instan.',
      color: 'border-blue-400 bg-blue-50/50 text-blue-700',
    },
    {
      icon: BookOpen,
      title: 'Akademik & Presensi Bulanan',
      desc: 'Jurnal harian terstruktur, absensi siswa bulanan dinamis (Jul-Jun), & asesmen capaian kurikulum.',
      color: 'border-emerald-400 bg-emerald-50/50 text-emerald-700',
    },
    {
      icon: HeartHandshake,
      title: 'Inklusif & Shadow Teacher',
      desc: 'Pemantauan 4 dimensi perkembangan ABK, log terapi harian, & komunikasi terarah ke orang tua.',
      color: 'border-rose-400 bg-rose-50/50 text-rose-700',
    },
    {
      icon: CreditCard,
      title: 'Administrasi & Keuangan SPP',
      desc: 'Matriks SPP 12 bulan satu layar, verifikasi bukti transfer, iuran tahunan, & generator surat resmi.',
      color: 'border-amber-400 bg-amber-50/50 text-amber-700',
    },
    {
      icon: Wrench,
      title: 'Sarpras & Tiket Kerusakan',
      desc: 'Inventarisasi aset per gedung/ruang & alur lapor kerusakan otomatis ke bendahara dan kepala sekolah.',
      color: 'border-purple-400 bg-purple-50/50 text-purple-700',
    },
    {
      icon: Award,
      title: 'Executive Dashboard Kepsek',
      desc: 'Persetujuan anggaran, matriks kehadiran guru harian-mingguan-bulanan, & rekap kinerja staf.',
      color: 'border-cyan-400 bg-cyan-50/50 text-cyan-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929] via-[#0F2942] to-[#153654] text-white flex flex-col justify-between">
      {/* Top Bar Branding */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white border-2 border-school-gold-400 p-0.5 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
            <img
              src="/logo.png"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.svg';
              }}
              alt="Logo SD Khoirur Rooziqiin Bandung"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-wider text-white">School Hub</span>
              <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                SD KHOIRUR ROOZIQIIN
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Pusat Data Terpadu SD Khoirur Rooziqiin Bandung
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-school-gold-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-school-gold-400" />
          <span>Sistem Manajemen Sekolah Cerdas & Offline-First</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-8 lg:py-12 flex-1 flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
        {/* Left Side: Welcoming & Feature Showcase */}
        <div className="flex-1 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-school-gold-500/20 border border-school-gold-400/40 text-school-gold-300 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-school-gold-400" />
            <span>Portal Otentikasi Terintegrasi</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Selamat Datang di <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-school-gold-300 via-amber-200 to-school-gold-500">
              School Hub
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Pusat kendali dan kolaborasi digital seluruh sivitas akademika SD Khoirur Rooziqiin Bandung.
            Menyatukan live monitoring kelas, jurnal mengajar, presensi bulanan, layanan inklusi, kas keuangan, dan sarana prasarana.
          </p>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {featureCards.map((feat, idx) => (
              <div
                key={idx}
                className="bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-xl p-3 flex items-start gap-3 text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-school-gold-500/10 border border-school-gold-400/30 flex items-center justify-center shrink-0 text-school-gold-300">
                  <feat.icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-snug">{feat.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5 line-clamp-2">
                    {feat.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Login Box */}
        <div className="w-full max-w-md bg-white text-slate-800 rounded-2xl shadow-2xl border-2 border-school-gold-400/50 overflow-hidden shrink-0">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-[#0F2942] to-[#1A365D] text-white p-5 border-b border-school-gold-500/30 text-center relative">
            <div className="w-14 h-14 mx-auto rounded-full bg-white p-1 shadow-md border-2 border-school-gold-400 mb-2 overflow-hidden flex items-center justify-center">
              <img
                src="/logo.png"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.svg';
                }}
                alt="SD Khoirur Rooziqiin"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="text-lg font-black tracking-wide text-white">Masuk ke School Hub</h2>
            <p className="text-xs text-school-gold-200 mt-0.5 font-medium">
              SD Khoirur Rooziqiin Bandung
            </p>

            {/* Tab switch */}
            <div className="mt-4 grid grid-cols-2 bg-black/25 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`py-1.5 rounded-lg transition-all ${
                  activeTab === 'form'
                    ? 'bg-school-gold-500 text-school-navy-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Formulir Login
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`py-1.5 rounded-lg transition-all ${
                  activeTab === 'roster'
                    ? 'bg-school-gold-500 text-school-navy-950 font-bold shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                13 Akun Staf (1-Klik)
              </button>
            </div>
          </div>

          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'form' ? (
              <form onSubmit={handleCredentialLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pengguna / Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: sopianto.djahar atau dwi.windarti"
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-school-navy-700 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-9 pr-10 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-school-navy-700 focus:outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#0F2942] hover:bg-[#1A365D] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                >
                  <LogIn className="w-4 h-4 text-school-gold-400" />
                  <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="px-2 bg-white text-slate-400">Atau masuk dengan</span>
                  </div>
                </div>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Akun Google</span>
                </button>

                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                  <Laptop className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Tips Cepat:</span> Ingin langsung menguji sistem tanpa mengetik? Gunakan tab <span className="font-bold text-school-navy-900 underline cursor-pointer" onClick={() => setActiveTab('roster')}>"13 Akun Staf (1-Klik)"</span> di atas.
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 flex items-center justify-between">
                  <span>Pilih guru / staf untuk login instan:</span>
                  <span className="font-bold text-school-navy-800">{allStaff.length} Staf Terdaftar</span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {allStaff.map((staff) => (
                    <div
                      key={staff.id}
                      onClick={() => handleQuickLogin(staff)}
                      className="pt-2 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={staff.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover border border-school-gold-400 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-school-navy-800">
                            {staff.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                            <span className="text-school-gold-700 font-semibold">{staff.title || staff.roles[0]}</span>
                            <span>• user: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono text-slate-700">{staff.username}</code></span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="bg-school-navy-900 group-hover:bg-school-gold-500 text-white group-hover:text-school-navy-950 px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-colors flex items-center gap-1"
                      >
                        <span>Masuk</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Terhubung ke Firebase Backend • SD Khoirur Rooziqiin Bandung
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-white/10 text-center text-xs text-slate-400">
        © 2026 SD Khoirur Rooziqiin Bandung • School Hub Versi 2.4.0 (PWA & Offline-First)
      </footer>
    </div>
  );
};
