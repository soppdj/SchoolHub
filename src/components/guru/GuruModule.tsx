import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileCheck,
  FileText,
  HeartHandshake,
  LogIn,
  LogOut,
  Plus,
  Printer,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Award,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolClass, Student, KurikulumTP, StudentGrade, TahfidzProgress, MasterScheduleItem } from '../../types';
import { generateKurikulumMerdekaReportCardPdf } from '../../lib/pdfGenerator';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
};

export const GuruModule: React.FC = () => {
  const {
    currentUser,
    allStaff,
    classes,
    students,
    schedules,
    teachingJournals,
    recordTeachingJournal,
    staffAttendance,
    kurikulumTps,
    studentGrades,
    tahfidzProgress,
    shadowJournals,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'jurnal_mengajar' | 'jadwal' | 'daftar_siswa' | 'tahfidz' | 'kurikulum_rapor' | 'presensi_staf'
  >('jurnal_mengajar');

  // Selected class for Jurnal & Gradebook
  const userClass = classes.find((c) => c.wali_kelas_id === currentUser.id) || classes[0];
  const [selectedClassId, setSelectedClassId] = useState<string>(userClass.id);
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.class_id === selectedClassId);

  // Search & Filter for Directory of Students
  const [studentDirectoryClassId, setStudentDirectoryClassId] = useState<string>('ALL');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Schedule View States (Personal vs Class Master)
  const [scheduleViewMode, setScheduleViewMode] = useState<'my_schedule' | 'class_schedule'>('my_schedule');
  const [scheduleFilterDay, setScheduleFilterDay] = useState<number | 'ALL'>('ALL');
  const [scheduleClassFilterId, setScheduleClassFilterId] = useState<string>(selectedClassId);

  // Teaching Journal Form State
  const [journalForm, setJournalForm] = useState({
    period_number: 2,
    subject_name: currentUser.specialty || 'Bahasa Indonesia',
    topic: '',
    learning_activity: '',
    notes: '',
  });

  // Student Attendance Form State (defaults to Hadir for all)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa'>>({});

  // Tahfidz Form State
  const [tahfidzForm, setTahfidzForm] = useState({
    student_id: classStudents[0]?.id || '',
    juz: 30,
    surah_name: 'An-Naba',
    verse_from: 1,
    verse_to: 15,
    grade: 'Lancar' as 'Lancar' | 'Cukup' | 'Ulang',
    notes: 'Makharijul huruf fasih dan tartil',
  });

  // Staff check-in state
  const todayAttendance = staffAttendance.find(
    (a) => a.user_id === currentUser.id && a.date === '2026-11-10'
  );
  const [isCheckedIn, setIsCheckedIn] = useState(Boolean(todayAttendance?.check_in_time));
  const [checkInTime, setCheckInTime] = useState(todayAttendance?.check_in_time || '07:12');

  // 1. My Personal Teaching Schedules (Jadwal Mengajar Saya)
  const mySchedules = useMemo(() => {
    return schedules
      .filter((s) => s.teacher_id === currentUser.id)
      .filter((s) => (scheduleFilterDay === 'ALL' ? true : s.day_of_week === scheduleFilterDay))
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.period_number - b.period_number;
      });
  }, [schedules, currentUser.id, scheduleFilterDay]);

  // 2. Class Master Schedules (Jadwal Kelas Terpilih)
  const classSchedules = useMemo(() => {
    return schedules
      .filter((s) => s.class_id === scheduleClassFilterId)
      .filter((s) => (scheduleFilterDay === 'ALL' ? true : s.day_of_week === scheduleFilterDay))
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.period_number - b.period_number;
      });
  }, [schedules, scheduleClassFilterId, scheduleFilterDay]);

  // 3. Filtered Students for the Full Directory tab
  const directoryStudents = useMemo(() => {
    return students.filter((s) => {
      if (studentDirectoryClassId !== 'ALL' && s.class_id !== studentDirectoryClassId) return false;
      if (searchStudentQuery.trim()) {
        const q = searchStudentQuery.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchNis = s.nis.includes(q) || s.nisn.includes(q);
        if (!matchName && !matchNis) return false;
      }
      return true;
    });
  }, [students, studentDirectoryClassId, searchStudentQuery]);

  // Attendance Handlers
  const handleAttendanceChange = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, 'Hadir'> = {};
    classStudents.forEach((st) => {
      updated[st.id] = 'Hadir';
    });
    setAttendanceMap(updated);
  };

  // Jump from Schedule to Journal
  const handleScheduleToJournal = (item: MasterScheduleItem) => {
    setSelectedClassId(item.class_id);
    setJournalForm({
      period_number: item.period_number,
      subject_name: item.subject_name,
      topic: '',
      learning_activity: '',
      notes: '',
    });
    setActiveSubTab('jurnal_mengajar');
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.topic || !journalForm.learning_activity) {
      alert('Mohon lengkapi judul materi dan ringkasan aktivitas pembelajaran!');
      return;
    }

    const presentCount = classStudents.filter((s) => (attendanceMap[s.id] || 'Hadir') === 'Hadir').length;
    const sickCount = classStudents.filter((s) => attendanceMap[s.id] === 'Sakit').length;
    const permittedCount = classStudents.filter((s) => attendanceMap[s.id] === 'Izin').length;
    const absentCount = classStudents.filter((s) => attendanceMap[s.id] === 'Alpa').length;

    await recordTeachingJournal({
      class_id: selectedClassId,
      date: '2026-11-10',
      period_number: Number(journalForm.period_number),
      subject_name: journalForm.subject_name,
      teacher_id: currentUser.id,
      is_substitute: false,
      topic: journalForm.topic,
      learning_activity: journalForm.learning_activity,
      notes: journalForm.notes,
      present_count: presentCount,
      sick_count: sickCount,
      permitted_count: permittedCount,
      absent_count: absentCount,
    });

    alert('✅ Jurnal Mengajar & Presensi berhasil disimpan! Panel kelas di Dashboard Bersama otomatis berubah menjadi HIJAU.');
    setJournalForm({
      period_number: 2,
      subject_name: currentUser.specialty || 'Bahasa Indonesia',
      topic: '',
      learning_activity: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubTab('jurnal_mengajar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'jurnal_mengajar'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Jurnal Mengajar & Presensi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('jadwal')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'jadwal'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Jadwal Pelajaran & Mengajar</span>
            {mySchedules.length > 0 && (
              <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 rounded-full">
                {mySchedules.length} JP
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('daftar_siswa')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'daftar_siswa'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Daftar Siswa & Profil Kelas</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 rounded-full">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('tahfidz')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'tahfidz'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Setoran Tahfidz Qur'an</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kurikulum_rapor')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'kurikulum_rapor'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Kurikulum Merdeka & Rapor PDF</span>
          </button>

          <button
            onClick={() => setActiveSubTab('presensi_staf')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'presensi_staf'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Presensi Harian Staf</span>
          </button>
        </div>

        {/* Class Selector Dropdown for Class-context tabs */}
        {(activeSubTab === 'jurnal_mengajar' || activeSubTab === 'tahfidz' || activeSubTab === 'kurikulum_rapor') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Pilih Kelas:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-school-navy-900 bg-white"
            >
              {classes.map((cls) => {
                const sCount = students.filter((s) => s.class_id === cls.id).length || cls.student_count;
                return (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({sCount} Siswa)
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* 1. JURNAL MENGAJAR & PRESENSI KELAS */}
      {activeSubTab === 'jurnal_mengajar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Form Jurnal Mengajar (Col 7) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-school-gold-600" />
                  Isi Jurnal Mengajar — {currentClass.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Mengisi jurnal akan otomatis mengubah panel kelas di Dashboard Bersama menjadi Hijau (Aktif Mengajar).
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Selasa, 10 Nov 2026
              </span>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Pelajaran Ke-</label>
                  <select
                    value={journalForm.period_number}
                    onChange={(e) => setJournalForm({ ...journalForm, period_number: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((jp) => (
                      <option key={jp} value={jp}>
                        Jam Ke-{jp} (JP {jp})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={journalForm.subject_name}
                    onChange={(e) => setJournalForm({ ...journalForm, subject_name: e.target.value })}
                    placeholder="Contoh: Bahasa Indonesia / Matematika / PJOK"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Materi / Topik Pembelajaran yang Diberikan</label>
                <input
                  type="text"
                  required
                  value={journalForm.topic}
                  onChange={(e) => setJournalForm({ ...journalForm, topic: e.target.value })}
                  placeholder="Contoh: Mengenal Nilai Tempat Puluhan dan Satuan"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Aktivitas & Metode Pembelajaran</label>
                <textarea
                  required
                  rows={3}
                  value={journalForm.learning_activity}
                  onChange={(e) => setJournalForm({ ...journalForm, learning_activity: e.target.value })}
                  placeholder="Jelaskan alur pembelajaran secara ringkas, media yang digunakan, dan keterlibatan siswa..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Khusus / Kendala (Opsional)</label>
                <input
                  type="text"
                  value={journalForm.notes}
                  onChange={(e) => setJournalForm({ ...journalForm, notes: e.target.value })}
                  placeholder="Contoh: Siswa aktif berpartisipasi, tugas mandiri selesai dengan tertib."
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-school-gold-400" />
                <span>Simpan Jurnal & Aktifkan Panel Hijau di Monitoring Live</span>
              </button>
            </form>
          </div>

          {/* Quick 1-Click Student Attendance Table (Col 5) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-school-navy-700" />
                  Presensi Cepat — {currentClass.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar siswa resmi ({classStudents.length} siswa). Klik untuk mengubah status.
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
              >
                Hadirkan Semua
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {classStudents.map((st, i) => {
                const curStatus = attendanceMap[st.id] || 'Hadir';
                return (
                  <div key={st.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 truncate flex items-center gap-1">
                        <span>{i + 1}. {st.name}</span>
                        {st.has_special_needs && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded">
                            GPK
                          </span>
                        )}
                        {st.notes && (
                          <span className="text-[9px] bg-slate-100 text-slate-500 italic px-1 rounded">
                            ({st.notes})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">NIS: {st.nis}</div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as const).map((stat) => (
                        <button
                          key={stat}
                          type="button"
                          onClick={() => handleAttendanceChange(st.id, stat)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold transition-all ${
                            curStatus === stat
                              ? stat === 'Hadir'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : stat === 'Sakit'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : stat === 'Izin'
                                ? 'bg-blue-500 text-white shadow-xs'
                                : 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {stat[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {classStudents.length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada data siswa terdaftar di kelas ini.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. JADWAL PELAJARAN & MENGAJAR (INTEGRASI PENUH DASHBOARD GURU) */}
      {activeSubTab === 'jadwal' && (
        <div className="space-y-4">
          
          {/* Header & View Mode Switcher */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Jadwal Resmi Master
                </span>
                <span className="text-xs font-bold text-slate-500">Tahun Ajaran 2026/2027</span>
              </div>
              <h3 className="text-lg font-extrabold text-school-navy-950 mt-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-school-gold-600" />
                Integrasi Jadwal Pelajaran & Jam Mengajar Guru
              </h3>
              <p className="text-xs text-slate-500">
                Pendidik: <strong>{currentUser.name}</strong> ({currentUser.title})
              </p>
            </div>

            {/* Toggle View: Jadwal Saya vs Jadwal Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setScheduleViewMode('my_schedule')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  scheduleViewMode === 'my_schedule'
                    ? 'bg-school-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jadwal Mengajar Saya ({mySchedules.length} JP)
              </button>
              <button
                onClick={() => setScheduleViewMode('class_schedule')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  scheduleViewMode === 'class_schedule'
                    ? 'bg-school-navy-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Jadwal Seluruh Kelas (1-6)
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-school-gold-600" />
                Filter Hari:
              </span>
              <button
                onClick={() => setScheduleFilterDay('ALL')}
                className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  scheduleFilterDay === 'ALL'
                    ? 'bg-school-navy-900 text-white border-school-navy-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Hari
              </button>
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setScheduleFilterDay(d)}
                  className={`px-2.5 py-1 rounded-lg border font-bold transition-all ${
                    scheduleFilterDay === d
                      ? 'bg-school-navy-900 text-white border-school-navy-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {DAY_NAMES[d]}
                </button>
              ))}
            </div>

            {scheduleViewMode === 'class_schedule' && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-600">Pilih Kelas:</span>
                <select
                  value={scheduleClassFilterId}
                  onChange={(e) => setScheduleClassFilterId(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-school-navy-900 bg-white"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.room_name})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* VIEW A: JADWAL MENGAJAR SAYA (PERSONAL TEACHER VIEW) */}
          {scheduleViewMode === 'my_schedule' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Beban Mengajar</div>
                    <div className="text-xl font-black text-school-navy-950 mt-0.5">
                      {schedules.filter((s) => s.teacher_id === currentUser.id).length} JP / Minggu
                    </div>
                    <div className="text-[11px] text-slate-500">1 JP = 35 Menit Tatap Muka</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Kelas yang Diampu</div>
                    <div className="text-xl font-black text-school-navy-950 mt-0.5">
                      {Array.from(new Set(schedules.filter((s) => s.teacher_id === currentUser.id).map((s) => s.class_id))).length} Kelas
                    </div>
                    <div className="text-[11px] text-emerald-600 font-semibold">Tercakup dalam Jadwal Master</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Simulasi Hari Ini</div>
                    <div className="text-xl font-black text-school-gold-600 mt-0.5">
                      Selasa, 10 Nov 2026
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {schedules.filter((s) => s.teacher_id === currentUser.id && s.day_of_week === 2).length} JP Terjadwal Hari Ini
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Table of My Schedules */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-school-navy-950 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-purple-600" />
                    Rincian Jam Mengajar — {currentUser.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Menampilkan {mySchedules.length} slot jam pelajaran
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Hari & Jam Ke-</th>
                        <th className="py-2.5 px-4">Waktu (WIB)</th>
                        <th className="py-2.5 px-4">Kelas & Ruangan</th>
                        <th className="py-2.5 px-4">Mata Pelajaran</th>
                        <th className="py-2.5 px-4 text-center">Aksi Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mySchedules.map((item) => {
                        const cls = classes.find((c) => c.id === item.class_id);
                        const isToday = item.day_of_week === 2;
                        return (
                          <tr key={item.id} className={`hover:bg-slate-50 ${isToday ? 'bg-amber-50/40' : ''}`}>
                            <td className="py-2.5 px-4">
                              <span className="font-extrabold text-school-navy-950">
                                {DAY_NAMES[item.day_of_week]}
                              </span>
                              <span className="ml-2 bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                                JP {item.period_number}
                              </span>
                              {isToday && (
                                <span className="ml-1.5 bg-amber-200 text-amber-900 text-[9px] font-bold px-1 rounded uppercase">
                                  Hari Ini
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-600">
                              {item.start_time} - {item.end_time}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-slate-900">{cls?.name || item.class_id}</span>
                              <span className="block text-[10px] text-slate-400">{cls?.room_name}</span>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">
                              {item.subject_name}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <button
                                onClick={() => handleScheduleToJournal(item)}
                                className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1"
                              >
                                <span>Tulis Jurnal</span>
                                <ArrowRight className="w-3 h-3 text-school-gold-400" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {mySchedules.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                            Tidak ada jadwal mengajar yang ditemukan untuk guru ini pada filter yang dipilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW B: JADWAL KELAS (FULL CLASS TIMETABLE) */}
          {scheduleViewMode === 'class_schedule' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-school-navy-950 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-school-gold-600" />
                    Jadwal Pelajaran {classes.find((c) => c.id === scheduleClassFilterId)?.name} (Lengkap)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Ruang: {classes.find((c) => c.id === scheduleClassFilterId)?.room_name} • Wali Kelas:{' '}
                    {allStaff.find((s) => s.id === classes.find((c) => c.id === scheduleClassFilterId)?.wali_kelas_id)?.name}
                  </p>
                </div>
                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                  {classSchedules.length} Jam Pelajaran Terdaftar
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-school-navy-900 text-white font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Hari</th>
                      <th className="py-2.5 px-4">Jam Ke</th>
                      <th className="py-2.5 px-4">Waktu (WIB)</th>
                      <th className="py-2.5 px-4">Mata Pelajaran</th>
                      <th className="py-2.5 px-4">Guru Pengampu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classSchedules.map((item) => {
                      const teacher = allStaff.find((s) => s.id === item.teacher_id);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-bold text-school-navy-950">
                            {DAY_NAMES[item.day_of_week]}
                          </td>
                          <td className="py-2 px-4">
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                              JP {item.period_number}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono font-semibold text-slate-600">
                            {item.start_time} - {item.end_time}
                          </td>
                          <td className="py-2 px-4 font-bold text-slate-800">
                            {item.subject_name}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={teacher?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <span className="font-semibold text-slate-900">{teacher?.name || item.teacher_id}</span>
                            </div>
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

      {/* 3. DAFTAR SISWA & PROFIL KELAS LENGKAP */}
      {activeSubTab === 'daftar_siswa' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-school-gold-600" />
                Direktori Data Siswa SD Khoirur Rooziqiin Bandung
              </h3>
              <p className="text-xs text-slate-500">
                Total terdaftar: <strong>{students.length} Siswa</strong> dari Kelas 1 s/d Kelas 6.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                L: {students.filter((s) => s.gender === 'L').length} Siswa
              </span>
              <span className="bg-pink-50 text-pink-700 font-bold px-2.5 py-1 rounded-lg border border-pink-200">
                P: {students.filter((s) => s.gender === 'P').length} Siswa
              </span>
              <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg border border-rose-200">
                Inklusif / GPK: {students.filter((s) => s.has_special_needs).length}
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Filter Tingkat Kelas:</label>
              <select
                value={studentDirectoryClassId}
                onChange={(e) => setStudentDirectoryClassId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-semibold"
              >
                <option value="ALL">Semua Kelas (1 s/d 6)</option>
                {classes.map((cls) => {
                  const sCount = students.filter((s) => s.class_id === cls.id).length || cls.student_count;
                  return (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({sCount} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cari Nama / NISN / NIS:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  placeholder="Ketik nama siswa..."
                  className="w-full pl-9 border border-slate-300 rounded-lg px-3 py-1.5 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Table of Students */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">No</th>
                  <th className="px-3 py-2.5">Nama Lengkap Siswa</th>
                  <th className="px-3 py-2.5">NISN / NIS</th>
                  <th className="px-3 py-2.5">L/P</th>
                  <th className="px-3 py-2.5">Kelas & Ruangan</th>
                  <th className="px-3 py-2.5">Kebutuhan Khusus / GPK</th>
                  <th className="px-3 py-2.5">Nama Orang Tua</th>
                  <th className="px-3 py-2.5">Kontak WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {directoryStudents.map((st, idx) => {
                  const cls = classes.find((c) => c.id === st.class_id);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <span className="font-extrabold text-slate-900">{st.name}</span>
                        {st.notes && (
                          <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 italic px-1 rounded">
                            ({st.notes})
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500">
                        {st.nisn} / {st.nis}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          st.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                        }`}>
                          {st.gender}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-school-navy-950">{cls?.name || st.class_id}</span>
                        <span className="block text-[10px] text-slate-400">{cls?.room_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        {st.has_special_needs ? (
                          <div>
                            <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full inline-block">
                              🌟 GPK Inklusif
                            </span>
                            <span className="block text-[9px] text-slate-500 mt-0.5">{st.special_needs_notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Reguler</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700 font-medium">
                        {st.parent_name || 'Wali Murid'}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-emerald-700 font-semibold">
                        {st.parent_phone || '-'}
                      </td>
                    </tr>
                  );
                })}
                {directoryStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada siswa yang cocok dengan kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SETORAN TAHFIDZ QUR'AN */}
      {activeSubTab === 'tahfidz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2 border-b pb-2">
              <Sparkles className="w-4 h-4 text-school-gold-600" />
              Catat Setoran Hafalan Qur'an / Muraja'ah — {currentClass.name}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={tahfidzForm.student_id}
                  onChange={(e) => setTahfidzForm({ ...tahfidzForm, student_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-white"
                >
                  {classStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (NIS: {st.nis})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Juz</label>
                  <input
                    type="number"
                    value={tahfidzForm.juz}
                    onChange={(e) => setTahfidzForm({ ...tahfidzForm, juz: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Surat</label>
                  <input
                    type="text"
                    value={tahfidzForm.surah_name}
                    onChange={(e) => setTahfidzForm({ ...tahfidzForm, surah_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ayat Dari</label>
                  <input
                    type="number"
                    value={tahfidzForm.verse_from}
                    onChange={(e) => setTahfidzForm({ ...tahfidzForm, verse_from: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sampai Ayat</label>
                  <input
                    type="number"
                    value={tahfidzForm.verse_to}
                    onChange={(e) => setTahfidzForm({ ...tahfidzForm, verse_to: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Predikat Kelancaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Lancar', 'Cukup', 'Ulang'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setTahfidzForm({ ...tahfidzForm, grade: g })}
                      className={`py-1.5 rounded-lg font-bold border transition-all ${
                        tahfidzForm.grade === g
                          ? g === 'Lancar'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : g === 'Cukup'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Pembimbing / Tajwid</label>
                <textarea
                  rows={2}
                  value={tahfidzForm.notes}
                  onChange={(e) => setTahfidzForm({ ...tahfidzForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  alert('✅ Setoran Tahfidz berhasil disimpan ke riwayat dan portofolio siswa!');
                }}
                className="w-full bg-[#0F2942] text-white py-2 rounded-xl font-bold hover:bg-[#1E3A8A] transition-colors"
              >
                Simpan Setoran Tahfidz
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-school-navy-900 border-b pb-2 flex items-center justify-between">
              <span>Riwayat Setoran Tahfidz — {currentClass.name}</span>
              <span className="text-xs text-slate-400 font-normal">Juz 30 Target Dasar</span>
            </h3>

            <div className="space-y-2">
              {tahfidzProgress.map((th) => {
                const st = students.find((s) => s.id === th.student_id);
                return (
                  <div key={th.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{st?.name || 'Siswa'}</div>
                      <div className="text-slate-500 font-medium">
                        Juz {th.juz} • Surat {th.surah_name} (Ayat {th.verse_from} - {th.verse_to})
                      </div>
                      <div className="text-[11px] text-slate-400 italic mt-0.5">"{th.notes}"</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      th.grade === 'Lancar' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {th.grade}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. KURIKULUM MERDEKA & RAPOR PDF */}
      {activeSubTab === 'kurikulum_rapor' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-school-gold-600" />
                Capaian Pembelajaran Kurikulum Merdeka & Unduh Rapor PDF — {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Sistem otomatis menyusun deskripsi naratif capaian kompetensi tertinggi dan capaian yang memerlukan bimbingan.
              </p>
            </div>
            <div className="bg-school-gold-50 border border-school-gold-300 px-3 py-1.5 rounded-xl text-xs font-bold text-school-gold-700">
              Fase {currentClass.grade_level <= 2 ? 'A (Kelas 1-2)' : currentClass.grade_level <= 4 ? 'B (Kelas 3-4)' : 'C (Kelas 5-6)'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">No</th>
                  <th className="px-3 py-2.5">Nama Siswa</th>
                  <th className="px-3 py-2.5">NISN / NIS</th>
                  <th className="px-3 py-2.5">Status Khusus / GPK</th>
                  <th className="px-3 py-2.5">Predikat Rata-Rata</th>
                  <th className="px-3 py-2.5 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-center font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-900">{st.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono">{st.nisn} / {st.nis}</td>
                    <td className="px-3 py-2.5">
                      {st.has_special_needs ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Didampingi GPK
                        </span>
                      ) : (
                        <span className="text-slate-400">Reguler</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Amat Baik (91.5)
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => {
                          generateKurikulumMerdekaReportCardPdf(
                            st,
                            currentClass,
                            kurikulumTps,
                            studentGrades,
                            tahfidzProgress,
                            shadowJournals
                          );
                        }}
                        className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5 text-school-gold-400" />
                        <span>Cetak Rapor PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. PRESENSI HARIAN STAF */}
      {activeSubTab === 'presensi_staf' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                Presensi Mandiri Staf & Rekap Bulanan Administratif
              </h3>
              <p className="text-xs text-slate-500">
                Catatan jam masuk & jam pulang guru/staf untuk laporan administrasi ke Dinas dan Yayasan.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-700">Status Anda Hari Ini:</div>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                isCheckedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isCheckedIn ? `Hadir (Masuk: ${checkInTime} WIB)` : 'Belum Check-In'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Check-In Kedatangan Pagi</div>
                <div className="text-xs text-slate-500">Batas toleransi sapa pagi: 07:15 WIB</div>
              </div>
              <button
                onClick={() => {
                  setIsCheckedIn(true);
                  setCheckInTime(new Date().toTimeString().slice(0, 5));
                  alert('✅ Check-In Berhasil dicatat!');
                }}
                disabled={isCheckedIn}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                  isCheckedIn
                    ? 'bg-emerald-200 text-emerald-800 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>{isCheckedIn ? 'Sudah Check-In' : 'Check-In Sekarang'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">Check-Out Kepulangan Sore</div>
                <div className="text-xs text-slate-500">Jam kepulangan reguler: 15:00 WIB</div>
              </div>
              <button
                onClick={() => alert('✅ Check-Out Berhasil dicatat. Selamat beristirahat!')}
                className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#0F2942] hover:bg-[#1E3A8A] text-white shadow-sm flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4 text-school-gold-400" />
                <span>Check-Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
