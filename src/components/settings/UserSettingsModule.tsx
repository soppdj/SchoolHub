import React, { useState, useMemo } from 'react';
import {
  User,
  Settings,
  BookOpen,
  Award,
  Bell,
  CheckCircle2,
  Camera,
  Save,
  Send,
  Sparkles,
  Phone,
  Mail,
  Shield,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  FileText,
  Plus,
  HelpCircle,
  ExternalLink,
  Briefcase,
  ClipboardList,
  FileSpreadsheet,
  Check,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/db';
import {
  UserProfile,
  TeachingJournal,
  StudentGrade,
  UserRole,
  PRESET_TITLES,
  PRESET_SPECIALTIES,
  PRESET_ROLES,
} from '../../types';

export const UserSettingsModule: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    classes,
    students,
    schedules,
    kurikulumTps,
    studentGrades,
    teachingJournals,
    recordTeachingJournal,
    simulatedTime,
    simulatedDay,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'biodata' | 'jurnal' | 'penilaian' | 'notifikasi'>('biodata');

  // Biodata Form State
  const [name, setName] = useState(currentUser.name);
  const [title, setTitle] = useState(currentUser.title || '');
  const [specialty, setSpecialty] = useState(currentUser.specialty || '');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(currentUser.roles || []);
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [telegramId, setTelegramId] = useState(currentUser.telegram_id || '');
  const [telegramUsername, setTelegramUsername] = useState(currentUser.telegram_username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [isSavedBiodata, setIsSavedBiodata] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Check user role categories
  const isTeachingStaff = currentUser.roles.some((r) => ['Guru Kelas', 'Guru Mapel', 'Shadow Teacher'].includes(r));
  const isKepsek = currentUser.roles.includes('Kepala Sekolah') && !isTeachingStaff;
  const isAdministrator = currentUser.roles.includes('Administrator') && !isTeachingStaff;

  // Kepala Sekolah Supervision Journal Form State
  const [kepsekDate, setKepsekDate] = useState<string>('2026-11-10');
  const [kepsekSupervisionType, setKepsekSupervisionType] = useState<string>('Supervisi Klinis Kelas');
  const [kepsekTeacherTarget, setKepsekTeacherTarget] = useState<string>('Ahmad Fauzan, S.Pd. (Wali Kelas 2)');
  const [kepsekFocusNotes, setKepsekFocusNotes] = useState<string>(
    'Observasi proses pembelajaran tematik adaptif matematika dan sinergi pendampingan bersama Shadow Teacher Ustadzah Dewi (pendampingan Ahmad Fauzi).'
  );
  const [kepsekRecommendation, setKepsekRecommendation] = useState<string>(
    'Diferensiasi materi dengan media konkrit blok Dienes berjalan sangat baik. Disarankan mempertahankan pendekatan multisensori.'
  );
  const [isSavedKepsekJournal, setIsSavedKepsekJournal] = useState<boolean>(false);

  // Quick Journal Form State (Teaching Staff)
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'c1');
  const [journalPeriod, setJournalPeriod] = useState<number>(2);
  const [journalSubject, setJournalSubject] = useState<string>(
    currentUser.specialty || 'Pendidikan Jasmani & Olahraga (PJOK)'
  );
  const [journalTopic, setJournalTopic] = useState<string>('');
  const [journalActivity, setJournalActivity] = useState<string>('');
  const [journalNotes, setJournalNotes] = useState<string>('');
  const [presentCount, setPresentCount] = useState<number>(18);
  const [sickCount, setSickCount] = useState<number>(0);
  const [permittedCount, setPermittedCount] = useState<number>(0);
  const [isSavedJournal, setIsSavedJournal] = useState(false);

  // Administrator Activity Journal Form State (Pekerjaan Administrasi TU)
  const [adminDate, setAdminDate] = useState<string>('2026-11-10');
  const [adminDivision, setAdminDivision] = useState<string>('Keuangan & SPP');
  const [adminTitle, setAdminTitle] = useState<string>('Rekapitulasi Pembayaran SPP & Cetak Kuitansi');
  const [adminDescription, setAdminDescription] = useState<string>(
    'Verifikasi mutasi rekening koran BSI, pengecekan bukti transfer siswa kelas 2, pembaruan status lunas di matriks SPP, dan pencetakan kuitansi resmi bertanda tangan bendahara.'
  );
  const [adminDocumentOutput, setAdminDocumentOutput] = useState<string>('9 Lembar Kuitansi SPP & Laporan Kas Harian');
  const [adminStatus, setAdminStatus] = useState<'Selesai' | 'Sedang Berjalan' | 'Perlu Koordinasi'>('Selesai');
  const [adminNotes, setAdminNotes] = useState<string>('Kuitansi telah diserahkan kepada wali kelas untuk didistribusikan ke wali murid.');
  const [isSavedAdminJournal, setIsSavedAdminJournal] = useState<boolean>(false);

  // Quick Grading Form State
  const [gradeClassId, setGradeClassId] = useState<string>(classes[0]?.id || 'c1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedTpId, setSelectedTpId] = useState<string>('');
  const [scoreNumber, setScoreNumber] = useState<number>(85);
  const [qualitativeCategory, setQualitativeCategory] = useState<'Sangat Baik' | 'Tercapai' | 'Perlu Bimbingan'>('Tercapai');
  const [gradeNotes, setGradeNotes] = useState<string>('');
  const [isSavedGrade, setIsSavedGrade] = useState(false);

  // Filter students for the selected grading class
  const classStudents = students.filter((s) => s.class_id === gradeClassId);
  const classTps = kurikulumTps.filter((tp) => {
    const cls = classes.find((c) => c.id === gradeClassId);
    return !cls || tp.grade_level === cls.grade_level;
  });

  // Recent journals by this user
  const myRecentJournals = teachingJournals
    .filter((j) => j.teacher_id === currentUser.id)
    .slice(-5)
    .reverse();

  // Available titles with strict patent locking (TU & Bendahara, Developer, Kepala Sekolah)
  const availableTitles = useMemo(() => {
    return PRESET_TITLES.filter((t) => {
      if (t === 'TU & Bendahara') return currentUser.id === 'u-silvi';
      if (t === ('Developer' as any)) return currentUser.id === 'u-sopianto';
      if (t === 'Kepala Sekolah') return currentUser.id === 'u-dwi';
      return true;
    });
  }, [currentUser.id]);

  // Check if a role is patented/locked for specific authorized staff
  const isRoleLocked = (role: UserRole) => {
    if (role === 'Developer' && currentUser.id !== 'u-sopianto') return true;
    if (role === 'Administrator' && currentUser.id !== 'u-silvi') return true;
    if (role === 'Kepala Sekolah' && currentUser.id !== 'u-dwi') return true;
    return false;
  };

  const getLockReason = (role: UserRole) => {
    if (role === 'Developer') return 'Paten: Khusus Sopianto Djahar, S.Pd';
    if (role === 'Administrator') return 'Paten: Khusus Silvi Oktaviani, S.Kom (TU & Bendahara)';
    if (role === 'Kepala Sekolah') return 'Paten: Khusus Dwi Windarti, S.E';
    return '';
  };

  // Save Biodata to Dexie & Context
  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out any unauthorized patented roles
    const safeRoles = selectedRoles.filter((r) => !isRoleLocked(r) || currentUser.roles.includes(r));
    const finalRoles = safeRoles.length > 0 ? safeRoles : currentUser.roles;

    const updated: Partial<UserProfile> = {
      name,
      title,
      specialty,
      roles: finalRoles,
      phone,
      email,
      telegram_id: telegramId,
      telegram_username: telegramUsername,
      avatar_url: avatarUrl,
    };

    await db.profiles.update(currentUser.id, updated);
    setCurrentUser({ ...currentUser, ...updated });

    setIsSavedBiodata(true);
    setTimeout(() => setIsSavedBiodata(false), 3000);
  };

  // Submit Quick Journal
  const handleQuickJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTopic.trim()) {
      alert('Silakan isi topik atau judul materi pembelajaran.');
      return;
    }

    const cls = classes.find((c) => c.id === selectedClassId);
    await recordTeachingJournal({
      class_id: selectedClassId,
      date: '2026-11-10', // Live simulation date
      period_number: journalPeriod,
      subject_name: journalSubject,
      teacher_id: currentUser.id,
      is_substitute: false,
      topic: journalTopic,
      learning_activity: journalActivity || 'Pembelajaran tatap muka interaktif dan latihan mandiri terbimbing.',
      notes: journalNotes || 'Kegiatan belajar berjalan lancar, siswa berpartisipasi aktif.',
      present_count: Number(presentCount),
      sick_count: Number(sickCount),
      permitted_count: Number(permittedCount),
      absent_count: 0,
    });

    setIsSavedJournal(true);
    setJournalTopic('');
    setJournalActivity('');
    setJournalNotes('');
    setTimeout(() => setIsSavedJournal(false), 3000);
  };

  // Submit Administrator Journal (Pekerjaan Administrasi TU)
  const handleAdminJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle.trim()) {
      alert('Silakan isi judul / rincian pekerjaan administrasi.');
      return;
    }

    const adminJournal: TeachingJournal = {
      id: `adm-${Date.now()}`,
      class_id: 'c-all',
      date: adminDate,
      period_number: 1,
      subject_name: `Administrasi TU: ${adminDivision}`,
      teacher_id: currentUser.id,
      is_substitute: false,
      topic: adminTitle,
      learning_activity: adminDescription,
      notes: `Output: ${adminDocumentOutput} | Status: ${adminStatus}${adminNotes ? ' | ' + adminNotes : ''}`,
      present_count: 71,
      sick_count: 0,
      permitted_count: 0,
      absent_count: 0,
      created_at: new Date().toISOString(),
    };

    await db.teaching_journals.put(adminJournal);
    setIsSavedAdminJournal(true);
    setTimeout(() => setIsSavedAdminJournal(false), 3000);
  };

  // Submit Kepala Sekolah Supervision Journal
  const handleKepsekJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kepsekFocusNotes.trim()) {
      alert('Silakan isi catatan fokus supervisi.');
      return;
    }

    const kepsekJournal: TeachingJournal = {
      id: `kps-${Date.now()}`,
      class_id: 'c-all',
      date: kepsekDate,
      period_number: 1,
      subject_name: `Supervisi Kepsek: ${kepsekSupervisionType}`,
      teacher_id: currentUser.id,
      is_substitute: false,
      topic: `${kepsekSupervisionType} — ${kepsekTeacherTarget}`,
      learning_activity: kepsekFocusNotes,
      notes: `Rekomendasi: ${kepsekRecommendation}`,
      present_count: 71,
      sick_count: 0,
      permitted_count: 0,
      absent_count: 0,
      created_at: new Date().toISOString(),
    };

    await db.teaching_journals.put(kepsekJournal);
    setIsSavedKepsekJournal(true);
    setTimeout(() => setIsSavedKepsekJournal(false), 3000);
  };

  // Submit Quick Grade
  const handleQuickGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      alert('Silakan pilih siswa yang akan dinilai.');
      return;
    }

    const gradeId = `grd-${Date.now()}`;
    const newGrade: StudentGrade = {
      id: gradeId,
      student_id: selectedStudentId,
      tp_id: selectedTpId || (classTps[0]?.id || 'tp-1'),
      score_formative: scoreNumber,
      score_summative: scoreNumber,
      notes: gradeNotes || `Capaian asesmen: ${qualitativeCategory}. Memahami konsep materi dengan baik.`,
    };

    await db.student_grades.put(newGrade);
    setIsSavedGrade(true);
    setGradeNotes('');
    setTimeout(() => setIsSavedGrade(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* User Header Profile Card */}
      <div className="bg-gradient-to-r from-[#0F2942] to-[#1E3A8A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-school-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar with Edit Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-white border-3 border-school-gold-400 overflow-hidden shadow-xl flex items-center justify-center">
              <img
                src={avatarUrl || currentUser.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200'}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200';
                }}
              />
            </div>
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute -bottom-2 -right-2 bg-school-gold-500 hover:bg-school-gold-600 text-school-navy-950 p-2 rounded-xl shadow-lg border-2 border-white transition-transform hover:scale-110"
              title="Ganti Foto Profil"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black tracking-tight">{currentUser.name}</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Aktif
              </span>
            </div>

            <p className="text-school-gold-400 font-semibold text-sm">{currentUser.title}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {currentUser.roles.map((r) => (
                <span
                  key={r}
                  className="bg-white/10 text-slate-200 border border-white/20 text-xs px-2.5 py-0.5 rounded-full font-medium"
                >
                  {r}
                </span>
              ))}
              {currentUser.specialty && (
                <span className="bg-school-gold-500/20 text-school-gold-300 border border-school-gold-400/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  Spesialisasi: {currentUser.specialty}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-school-gold-400" />
                {currentUser.phone || 'Belum diisi'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-school-gold-400" />
                {currentUser.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-400" />
                Telegram: @{currentUser.telegram_username || 'belum_terhubung'}
              </span>
            </div>
          </div>
        </div>

        {/* Manual Device Photo Upload Modal / Panel (Tanpa Koleksi Preset) */}
        {showAvatarPicker && (
          <div className="mt-5 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 animate-fadeIn space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-xs font-bold text-school-gold-300 uppercase tracking-wider flex items-center gap-2">
                <Camera className="w-4 h-4 text-school-gold-400" />
                Ganti Foto Profil Pribadi dari Perangkat
              </h4>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-xs text-slate-300 hover:text-white"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-school-gold-400 bg-white/20 shrink-0 shadow-md">
                <img
                  src={avatarUrl || currentUser.avatar_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-2 text-xs">
                <p className="text-slate-200 text-[11px]">
                  Pilih file foto wajah resmi Anda langsung dari galeri HP, kamera, atau penyimpanan laptop/komputer:
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="bg-school-gold-500 hover:bg-school-gold-600 text-school-navy-950 font-black px-4 py-2 rounded-xl cursor-pointer inline-flex items-center gap-2 shadow-md transition-all hover:scale-105">
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Foto dari Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            if (typeof reader.result === 'string') {
                              const newAvatar = reader.result;
                              setAvatarUrl(newAvatar);
                              await db.profiles.update(currentUser.id, { avatar_url: newAvatar });
                              setCurrentUser({ ...currentUser, avatar_url: newAvatar });
                              alert('✅ Foto profil pribadi Anda berhasil diperbarui dan tersimpan!');
                              setShowAvatarPicker(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <span className="text-[11px] text-slate-300">Format: JPG, PNG, WEBP (Maks 5MB)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-xs">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Atau tempel URL gambar web eksternal..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder-slate-400 text-xs focus:outline-hidden focus:border-school-gold-400"
              />
              <button
                type="button"
                onClick={async () => {
                  if (avatarUrl) {
                    await db.profiles.update(currentUser.id, { avatar_url: avatarUrl });
                    setCurrentUser({ ...currentUser, avatar_url: avatarUrl });
                    alert('✅ Tautan foto profil berhasil disimpan!');
                    setShowAvatarPicker(false);
                  }
                }}
                className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                Terapkan URL
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('biodata')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'biodata'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-school-gold-400" />
          <span>Biodata & Profil</span>
        </button>

        <button
          onClick={() => setActiveTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'jurnal'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {isKepsek ? (
            <Shield className="w-4 h-4 text-school-gold-400" />
          ) : isAdministrator ? (
            <Briefcase className="w-4 h-4 text-school-gold-400" />
          ) : (
            <BookOpen className="w-4 h-4 text-emerald-400" />
          )}
          <span>
            {isKepsek
              ? 'Jurnal Supervisi & Catatan Kepsek'
              : isAdministrator
              ? 'Jurnal Aktivitas Administrasi & TU'
              : 'Entri Jurnal Harian Cepat'}
          </span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            Live
          </span>
        </button>

        {/* HIDE Penilaian & Asesmen Siswa for Non-teaching staff (Kepsek & Administrator) */}
        {isTeachingStaff && (
          <button
            onClick={() => setActiveTab('penilaian')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
              activeTab === 'penilaian'
                ? 'bg-school-navy-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>Penilaian & Asesmen Siswa</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('notifikasi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'notifikasi'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-sky-400" />
          <span>Notifikasi & Bot Telegram</span>
        </button>
      </div>

      {/* TAB 1: BIODATA & PROFIL */}
      {activeTab === 'biodata' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
                <User className="w-5 h-5 text-school-gold-600" />
                Edit Biodata & Profil Staf Pendidik
              </h2>
              <p className="text-xs text-slate-500">
                Informasi ini digunakan dalam jurnal mengajar, buku piket, presensi real-time, dan komunikasi sekolah.
              </p>
            </div>
            {isSavedBiodata && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Biodata Berhasil Disimpan!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSaveBiodata} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap & Gelar</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Jabatan / Tugas Utama</span>
                <span className="text-[10px] text-school-gold-600 font-semibold">Pilih atau Ketik</span>
              </label>
              <div className="relative">
                <select
                  value={availableTitles.includes(title as any) ? title : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setTitle(e.target.value);
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
                >
                  <option value="">-- Pilih Jabatan / Tugas Utama --</option>
                  {availableTitles.map((t: string) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="custom">Ketik Jabatan Lainnya...</option>
                </select>
                {(!availableTitles.includes(title as any) || title === 'custom') && (
                  <input
                    type="text"
                    required
                    value={title === 'custom' ? '' : title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan jabatan khusus..."
                    className="w-full mt-2 text-sm border border-slate-300 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
                  />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Spesialisasi / Mata Pelajaran</span>
                <span className="text-[10px] text-slate-500">Daftar Jadwal Fix</span>
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              >
                <option value="">-- Pilih Spesialisasi / Mapel --</option>
                {PRESET_SPECIALTIES.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-Role Selection Checkboxes */}
            <div className="col-span-full space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-school-navy-950 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-school-gold-600" />
                    Peran Pengguna (Dapat Memilih Lebih dari Satu Peran)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Pilih semua hak akses dan peran operasional yang dimiliki pengguna ini.
                  </p>
                </div>
                <span className="bg-school-navy-100 text-school-navy-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {selectedRoles.length} Peran Dipilih
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
                {PRESET_ROLES.map((role) => {
                  const isChecked = selectedRoles.includes(role);
                  const isLocked = isRoleLocked(role);
                  const lockReason = getLockReason(role);

                  return (
                    <label
                      key={role}
                      title={isLocked ? lockReason : undefined}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${
                        isLocked
                          ? 'opacity-60 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                          : isChecked
                          ? 'bg-school-navy-900 text-white font-bold border-school-navy-950 shadow-xs cursor-pointer'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isLocked}
                          onChange={() => {
                            if (isLocked) return;
                            if (isChecked) {
                              if (selectedRoles.length > 1) {
                                setSelectedRoles(selectedRoles.filter((r) => r !== role));
                              }
                            } else {
                              setSelectedRoles([...selectedRoles, role]);
                            }
                          }}
                          className="rounded text-school-gold-500 focus:ring-school-gold-400 disabled:opacity-50"
                        />
                        <span className="truncate">{role}</span>
                      </div>
                      {isLocked && (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ml-1">
                          🔒 Paten
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nomor WhatsApp / Telepon</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Alamat Email Resmi Sekolah</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">ID Chat Telegram (Untuk Notifikasi Bot)</label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Misal: 99881111"
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Username Telegram</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">@</span>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
                  placeholder="username_telegram"
                  className="w-full pl-8 text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">URL Foto Profil / Avatar</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="bg-school-navy-900 hover:bg-school-navy-950 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
              >
                <Save className="w-4 h-4 text-school-gold-400" />
                <span>Simpan Perubahan Biodata</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ENTRI JURNAL HARIAN CEPAT / JURNAL SUPERVISI KEPSEK / JURNAL ADMINISTRASI TU */}
      {activeTab === 'jurnal' && (
        <div className="space-y-6">
          {isKepsek ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-school-gold-600" />
                    Jurnal Supervisi & Catatan Kepemimpinan Kepala Sekolah
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pencatatan resmi supervisi pembelajaran kelas, evaluasi kinerja guru, arahan manajerial, dan pembinaan kependidikan SD Khoirur Rooziqiin.
                  </p>
                </div>
                {isSavedKepsekJournal && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Catatan Supervisi Berhasil Disimpan ke Rekam Jejak Sekolah!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleKepsekJournalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tanggal Supervisi / Observasi</label>
                    <input
                      type="date"
                      required
                      value={kepsekDate}
                      onChange={(e) => setKepsekDate(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jenis Kegiatan Supervisi</label>
                    <select
                      value={kepsekSupervisionType}
                      onChange={(e) => setKepsekSupervisionType(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      <option value="Supervisi Klinis Kelas">Supervisi Klinis Kelas (PBM)</option>
                      <option value="Supervisi Perangkat Pembelajaran">Supervisi Perangkat Ajar & Modul</option>
                      <option value="Supervisi Program Inklusi (GPK)">Supervisi Program Inklusi & Shadow Teacher</option>
                      <option value="Evaluasi Kinerja Guru & Tendik">Evaluasi Kinerja Guru & Tendik</option>
                      <option value="Briefing & Pembinaan Manajemen">Briefing & Pembinaan Manajemen</option>
                      <option value="Monitoring Program Unggulan Tahfidz">Monitoring Program Unggulan & Tahfidz</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Guru / Sasaran yang Disupervisi</label>
                    <input
                      type="text"
                      required
                      value={kepsekTeacherTarget}
                      onChange={(e) => setKepsekTeacherTarget(e.target.value)}
                      placeholder="Contoh: Ahmad Fauzan, S.Pd. (Wali Kelas 2) / Guru PAI"
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Fokus Observasi & Catatan Lapangan</label>
                  <textarea
                    rows={3}
                    required
                    value={kepsekFocusNotes}
                    onChange={(e) => setKepsekFocusNotes(e.target.value)}
                    placeholder="Uraikan temuan observasi kelas, keterlibatan peserta didik, dan dinamika pembelajaran..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Rekomendasi Tindak Lanjut & Arahan Pembinaan</label>
                  <textarea
                    rows={2}
                    required
                    value={kepsekRecommendation}
                    onChange={(e) => setKepsekRecommendation(e.target.value)}
                    placeholder="Tuliskan arahan tindak lanjut, apresiasi, atau masukan pedagogik untuk guru bersangkutan..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden leading-relaxed bg-amber-50/50"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
                  >
                    <Shield className="w-4 h-4 text-school-gold-400" />
                    <span>Simpan Jurnal Supervisi Kepala Sekolah</span>
                  </button>
                </div>
              </form>
            </div>
          ) : isAdministrator ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-school-gold-600" />
                    Jurnal Tugas & Aktivitas Administrasi Tata Usaha (TU)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pencatatan harian pekerjaan administrasi sekolah, rekapitulasi SPP, persuratan resmi, Dapodik, dan pembukuan kas SD Khoirur Rooziqiin.
                  </p>
                </div>
                {isSavedAdminJournal && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Jurnal Pekerjaan Administrasi Berhasil Disimpan!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleAdminJournalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Tanggal Pekerjaan</label>
                    <input
                      type="date"
                      required
                      value={adminDate}
                      onChange={(e) => setAdminDate(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Divisi / Bidang Administrasi</label>
                    <select
                      value={adminDivision}
                      onChange={(e) => setAdminDivision(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      <option value="Keuangan & SPP">Keuangan & SPP Siswa</option>
                      <option value="Kearsipan & Surat Keluar">Kearsipan & Surat Keluar/Masuk</option>
                      <option value="Dapodik & Kesiswaan">Dapodik & Data Pokok Siswa</option>
                      <option value="Layanan Tamu & Humas">Layanan Tamu & Komunikasi Wali Murid</option>
                      <option value="Sarana & Prasarana">Pengadaan & Inventaris Sarpras</option>
                      <option value="Operasional Kantor">Operasional & Kesekretariatan TU</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Status Penyelesaian</label>
                    <select
                      value={adminStatus}
                      onChange={(e) => setAdminStatus(e.target.value as any)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      <option value="Selesai">✅ Selesai Dikerjakan</option>
                      <option value="Sedang Berjalan">⏳ Sedang Berjalan (In Progress)</option>
                      <option value="Perlu Koordinasi">⚠️ Perlu Koordinasi / Verifikasi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Judul / Agenda Pekerjaan Administrasi</label>
                  <input
                    type="text"
                    required
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    placeholder="Contoh: Rekapitulasi SPP Kelas 2 & Verifikasi Bukti Transfer"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Uraian Rincian Pekerjaan TU</label>
                  <textarea
                    rows={3}
                    required
                    value={adminDescription}
                    onChange={(e) => setAdminDescription(e.target.value)}
                    placeholder="Jelaskan uraian pekerjaan administrasi yang telah diselesaikan secara sistematis..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Output Dokumen / Berkas yang Dihasilkan</label>
                    <input
                      type="text"
                      value={adminDocumentOutput}
                      onChange={(e) => setAdminDocumentOutput(e.target.value)}
                      placeholder="Contoh: 9 Lembar Kuitansi SPP, 1 Arsip Surat Keluar, Buku Kas 3 Pos"
                      className="w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">Catatan Disposisi / Keterangan Lanjutan</label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Contoh: Telah dikoordinasikan dengan Bendahara & Wali Kelas..."
                      className="w-full text-sm border border-slate-300 bg-white rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
                  >
                    <Briefcase className="w-4 h-4 text-school-gold-400" />
                    <span>Simpan Jurnal Aktivitas Administrasi TU</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600" />
                    Entri Cepat Jurnal Mengajar Harian
                  </h2>
                  <p className="text-xs text-slate-500">
                    Mengisi jurnal secara real-time langsung memverifikasi kehadiran Anda dan mengubah status kelas di Dashboard Bersama menjadi Hijau (Aktif Mengajar).
                  </p>
                </div>
                {isSavedJournal && (
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Jurnal Berhasil Disimpan & Panel Kelas Hijau!</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleQuickJournalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Pilih Kelas</label>
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.room_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Jam Pelajaran (JP)</label>
                    <select
                      value={journalPeriod}
                      onChange={(e) => setJournalPeriod(Number(e.target.value))}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((jp) => (
                        <option key={jp} value={jp}>
                          Jam Ke-{jp} (JP {jp})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Mata Pelajaran</label>
                    <input
                      type="text"
                      required
                      value={journalSubject}
                      onChange={(e) => setJournalSubject(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Topik / Materi Pembelajaran</label>
                  <input
                    type="text"
                    required
                    value={journalTopic}
                    onChange={(e) => setJournalTopic(e.target.value)}
                    placeholder="Contoh: Kebugaran Jasmani & Latihan Gerak Lokomotor / Pengenalan Huruf Hijaiyah"
                    className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Aktivitas & Langkah Pembelajaran</label>
                  <textarea
                    rows={3}
                    value={journalActivity}
                    onChange={(e) => setJournalActivity(e.target.value)}
                    placeholder="Uraikan aktivitas pembelajaran di kelas atau lapangan..."
                    className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-emerald-800">Siswa Hadir</label>
                    <input
                      type="number"
                      min={0}
                      value={presentCount}
                      onChange={(e) => setPresentCount(Number(e.target.value))}
                      className="w-full mt-1 text-sm border border-emerald-300 bg-white rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-amber-800">Siswa Sakit</label>
                    <input
                      type="number"
                      min={0}
                      value={sickCount}
                      onChange={(e) => setSickCount(Number(e.target.value))}
                      className="w-full mt-1 text-sm border border-amber-300 bg-white rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-blue-800">Siswa Izin</label>
                    <input
                      type="number"
                      min={0}
                      value={permittedCount}
                      onChange={(e) => setPermittedCount(Number(e.target.value))}
                      className="w-full mt-1 text-sm border border-blue-300 bg-white rounded-lg px-2.5 py-1.5 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">Catatan Khusus</label>
                    <input
                      type="text"
                      value={journalNotes}
                      onChange={(e) => setJournalNotes(e.target.value)}
                      placeholder="Opsional..."
                      className="w-full mt-1 text-sm border border-slate-300 bg-white rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-200" />
                    <span>Kirim & Simpan Jurnal Mengajar</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Recent Journals Table */}
          {myRecentJournals.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-school-navy-950 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                {isAdministrator ? 'Riwayat Jurnal Aktivitas Administrasi Terakhir' : 'Riwayat Jurnal Terakhir Anda'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <th className="py-2 px-3 font-semibold">Tanggal</th>
                      <th className="py-2 px-3 font-semibold">{isAdministrator ? 'Bidang / Bagian' : 'Kelas'}</th>
                      <th className="py-2 px-3 font-semibold">{isAdministrator ? 'Tugas Utama' : 'JP & Mapel'}</th>
                      <th className="py-2 px-3 font-semibold">Uraian / Aktivitas</th>
                      <th className="py-2 px-3 font-semibold">{isAdministrator ? 'Output & Status' : 'Kehadiran'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myRecentJournals.map((j) => {
                      const c = classes.find((cl) => cl.id === j.class_id);
                      return (
                        <tr key={j.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-mono text-slate-500">{j.date}</td>
                          <td className="py-2 px-3 font-bold text-school-navy-900">
                            {isAdministrator ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">
                                {j.subject_name.replace('Administrasi TU: ', '')}
                              </span>
                            ) : (
                              c?.name || j.class_id
                            )}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {isAdministrator ? j.topic : `JP ${j.period_number} • ${j.subject_name}`}
                          </td>
                          <td className="py-2 px-3 text-slate-700 max-w-xs truncate" title={j.learning_activity}>
                            {j.learning_activity}
                          </td>
                          <td className="py-2 px-3">
                            {isAdministrator ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                {j.notes?.split('|')?.[1]?.replace('Status:', '').trim() || 'Selesai'}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold">{j.present_count} hadir</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PENILAIAN & ASESMEN CEPAT (Hanya untuk Tenaga Pendidik / Non-Admin) */}
      {activeTab === 'penilaian' && !isAdministrator && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Input Cepat Nilai & Asesmen Capaian Siswa
              </h2>
              <p className="text-xs text-slate-500">
                Asesmen formatif/sumatif otomatis terintegrasi ke rapor kurikulum merdeka dan arsip evaluasi akademik.
              </p>
            </div>
            {isSavedGrade && (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nilai Siswa Berhasil Disimpan!</span>
              </div>
            )}
          </div>

          <form onSubmit={handleQuickGradeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Jenjang / Kelas</label>
                <select
                  value={gradeClassId}
                  onChange={(e) => {
                    setGradeClassId(e.target.value);
                    setSelectedStudentId('');
                  }}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.room_name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Pilih Siswa</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Pilih Nama Siswa --</option>
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.nis}) {st.has_special_needs ? '🌟 Inklusif' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tujuan Pembelajaran (TP) / Indikator</label>
              <select
                value={selectedTpId}
                onChange={(e) => setSelectedTpId(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-medium text-slate-800"
              >
                {classTps.map((tp) => (
                  <option key={tp.id} value={tp.id}>
                    [{tp.subject_name}] {tp.code}: {tp.description}
                  </option>
                ))}
                {classTps.length === 0 && (
                  <option value="tp-default">Tujuan Pembelajaran Umum Semester 1</option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Skor Angka (0 - 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={scoreNumber}
                  onChange={(e) => setScoreNumber(Number(e.target.value))}
                  className="w-full text-lg font-bold border border-slate-300 rounded-lg px-3.5 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kategori Capaian</label>
                <select
                  value={qualitativeCategory}
                  onChange={(e) => setQualitativeCategory(e.target.value as any)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white font-semibold text-slate-800"
                >
                  <option value="Sangat Baik">Sangat Baik (Istimewa)</option>
                  <option value="Tercapai">Tercapai (Optimal Sesuai Kriteria)</option>
                  <option value="Perlu Bimbingan">Perlu Bimbingan (Pendampingan Khusus)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Catatan Refleksi & Evaluasi Guru</label>
              <textarea
                rows={2}
                value={gradeNotes}
                onChange={(e) => setGradeNotes(e.target.value)}
                placeholder="Berikan umpan balik positif dan deskripsi kemampuan yang telah dikuasai..."
                className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
              >
                <Award className="w-4 h-4 text-amber-200" />
                <span>Simpan Nilai Asesmen Siswa</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: NOTIFIKASI & TELEGRAM */}
      {activeTab === 'notifikasi' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-school-navy-950 flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-600" />
              Preferensi Notifikasi & Telegram Bot
            </h2>
            <p className="text-xs text-slate-500">
              Atur pemberitahuan instan via bot Telegram resmi SD Khoirur Rooziqiin.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">Pengingat Jadwal Mengajar Harian</p>
                <p className="text-xs text-slate-500">Kirim rangkuman jadwal kelas setiap pukul 07:00 pagi.</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-school-navy-900 rounded" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">Permintaan Guru Pengganti Otomatis</p>
                <p className="text-xs text-slate-500">
                  Notifikasi ketika sistem mendeteksi jam kosong dan Anda direkomendasikan bertugas.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-school-navy-900 rounded" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">Pengingat Entri Jurnal</p>
                <p className="text-xs text-slate-500">
                  Kirim peringatan 10 menit sebelum jam pelajaran berakhir jika jurnal belum diisi.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-school-navy-900 rounded" />
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50">
              <div>
                <p className="text-sm font-bold text-slate-800">Status Ketersediaan Standby</p>
                <p className="text-xs text-slate-500">
                  Muncul dalam daftar rekomendasi guru pengganti saat Anda tidak memiliki jam mengajar.
                </p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-school-navy-900 rounded" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
