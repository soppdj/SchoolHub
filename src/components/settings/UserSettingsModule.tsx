import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/db';
import { UserProfile, TeachingJournal, StudentGrade } from '../../types';

// Preset avatar options for convenient 1-click photo update
const AVATAR_PRESETS = [
  { label: 'Pria Formal 1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { label: 'Pria Formal 2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
  { label: 'Pria Sporty (PJOK)', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200' },
  { label: 'Pria Senior (Kepsek)', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200' },
  { label: 'Wanita Hijab 1', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
  { label: 'Wanita Hijab 2', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' },
  { label: 'Wanita Ramah (Shadow)', url: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200' },
  { label: 'Wanita Ceria', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200' },
];

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
  const [title, setTitle] = useState(currentUser.title);
  const [specialty, setSpecialty] = useState(currentUser.specialty || '');
  const [phone, setPhone] = useState(currentUser.phone);
  const [email, setEmail] = useState(currentUser.email);
  const [telegramId, setTelegramId] = useState(currentUser.telegram_id || '');
  const [telegramUsername, setTelegramUsername] = useState(currentUser.telegram_username || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');
  const [isSavedBiodata, setIsSavedBiodata] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Check if current user is an Administrator (e.g. Nurul Hidayati)
  const isAdministrator = currentUser.roles.includes('Administrator') && !currentUser.roles.some((r) => ['Guru Kelas', 'Guru Mapel', 'Shadow Teacher'].includes(r));

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

  // Save Biodata to Dexie & Context
  const handleSaveBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Partial<UserProfile> = {
      name,
      title,
      specialty,
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

        {/* Quick Avatar Gallery Modal / Dropdown */}
        {showAvatarPicker && (
          <div className="mt-5 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-school-gold-300 uppercase tracking-wider">
                Pilih Foto Profil Cepat (Koleksi Guru & Staf)
              </h4>
              <button
                onClick={() => setShowAvatarPicker(false)}
                className="text-xs text-slate-300 hover:text-white"
              >
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAvatarUrl(preset.url);
                    setShowAvatarPicker(false);
                  }}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
                    avatarUrl === preset.url
                      ? 'border-school-gold-400 ring-2 ring-school-gold-400 scale-105'
                      : 'border-white/30 hover:border-white'
                  }`}
                  title={preset.label}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-14 object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white p-1 text-center">
                    Pilih
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Atau masukkan tautan / URL foto kustom..."
                className="flex-1 text-xs bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white placeholder-slate-400 focus:outline-hidden focus:border-school-gold-400"
              />
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
          {isAdministrator ? (
            <Briefcase className="w-4 h-4 text-school-gold-400" />
          ) : (
            <BookOpen className="w-4 h-4 text-emerald-400" />
          )}
          <span>{isAdministrator ? 'Jurnal Aktivitas Administrasi & TU' : 'Entri Jurnal Harian Cepat'}</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            Live
          </span>
        </button>

        {/* HIDE Penilaian & Asesmen Siswa for Administrator (Non-teaching staff) */}
        {!isAdministrator && (
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
              <label className="text-xs font-bold text-slate-700">Jabatan / Tugas Utama</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Spesialisasi / Mata Pelajaran</label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Contoh: Pendidikan Jasmani, Bahasa Inggris, Tahfidz"
                className="w-full text-sm border border-slate-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
              />
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

      {/* TAB 2: ENTRI JURNAL HARIAN CEPAT / JURNAL AKTIVITAS ADMINISTRASI TU */}
      {activeTab === 'jurnal' && (
        <div className="space-y-6">
          {isAdministrator ? (
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
