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
  ChevronLeft,
  Award,
  Layers,
  Pencil,
  Trash2,
  PlusCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { SchoolClass, Student, KurikulumTP, StudentGrade, TahfidzProgress, MasterScheduleItem, PRESET_SPECIALTIES } from '../../types';
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
    saveScheduleItem,
    deleteScheduleItem,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'jurnal_mengajar' | 'absensi_bulanan' | 'jadwal' | 'daftar_siswa' | 'tahfidz' | 'kurikulum_rapor' | 'presensi_staf'
  >('jurnal_mengajar');

  // Selected class for Jurnal & Gradebook
  const userClass = classes.find((c) => c.wali_kelas_id === currentUser.id) || classes[0];
  const [selectedClassId, setSelectedClassId] = useState<string>(userClass.id);
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter((s) => s.class_id === selectedClassId);

  // Academic Months for Monthly Attendance Matrix (Juli s/d Juni)
  const academicMonths = [
    { name: 'Juli 2026', monthName: 'Juli', year: 2026, days: 31, startDayOfWeek: 3 },
    { name: 'Agustus 2026', monthName: 'Agustus', year: 2026, days: 31, startDayOfWeek: 6 },
    { name: 'September 2026', monthName: 'September', year: 2026, days: 30, startDayOfWeek: 2 },
    { name: 'Oktober 2026', monthName: 'Oktober', year: 2026, days: 31, startDayOfWeek: 4 },
    { name: 'November 2026 (Aktif)', monthName: 'November', year: 2026, days: 30, startDayOfWeek: 0 },
    { name: 'Desember 2026', monthName: 'Desember', year: 2026, days: 31, startDayOfWeek: 2 },
    { name: 'Januari 2027', monthName: 'Januari', year: 2027, days: 31, startDayOfWeek: 5 },
    { name: 'Februari 2027', monthName: 'Februari', year: 2027, days: 28, startDayOfWeek: 1 },
    { name: 'Maret 2027', monthName: 'Maret', year: 2027, days: 31, startDayOfWeek: 1 },
    { name: 'April 2027', monthName: 'April', year: 2027, days: 30, startDayOfWeek: 4 },
    { name: 'Mei 2027', monthName: 'Mei', year: 2027, days: 31, startDayOfWeek: 6 },
    { name: 'Juni 2027', monthName: 'Juni', year: 2027, days: 30, startDayOfWeek: 2 },
  ];

  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(4); // Default to November 2026
  const activeMonthInfo = academicMonths[selectedMonthIdx];

  // Persistent Monthly Attendance Matrix State
  const [monthlyAttendanceMap, setMonthlyAttendanceMap] = useState<Record<string, 'H' | 'S' | 'I' | 'A'>>(() => {
    try {
      const saved = localStorage.getItem('schoolhub_monthly_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Search & Filter for Directory of Students
  const [studentDirectoryClassId, setStudentDirectoryClassId] = useState<string>('ALL');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');

  // Schedule View States (Personal vs Class Master)
  const [scheduleViewMode, setScheduleViewMode] = useState<'my_schedule' | 'class_schedule'>('my_schedule');
  const [scheduleFilterDay, setScheduleFilterDay] = useState<number | 'ALL'>('ALL');
  const [scheduleClassFilterId, setScheduleClassFilterId] = useState<string>(selectedClassId);

  // Check teacher eligibility to manage schedule ("kecuali TU dan Sarpras dan Shadow teacher")
  const canManageSchedule = useMemo(() => {
    const isOnlyExcluded = currentUser.roles.every((r) =>
      ['Administrator', 'Sarpras', 'Shadow Teacher'].includes(r)
    );
    if (isOnlyExcluded && !currentUser.roles.includes('Developer')) {
      return false;
    }
    return (
      currentUser.roles.some((r) =>
        ['Guru Kelas', 'Guru Mapel', 'Kepala Sekolah', 'Developer'].includes(r)
      ) || currentUser.id === 'u-shava'
    );
  }, [currentUser]);

  // Schedule Modal and Form State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleFormDay, setScheduleFormDay] = useState<number>(1);
  const [scheduleFormPeriod, setScheduleFormPeriod] = useState<number>(1);
  const [scheduleFormStartTime, setScheduleFormStartTime] = useState<string>('08:00');
  const [scheduleFormEndTime, setScheduleFormEndTime] = useState<string>('08:35');
  const [scheduleFormClassId, setScheduleFormClassId] = useState<string>(selectedClassId || 'c1');
  const [scheduleFormSubject, setScheduleFormSubject] = useState<string>('');
  const [scheduleFormTeacherId, setScheduleFormTeacherId] = useState<string>(currentUser.id);
  const [scheduleSaveSuccess, setScheduleSaveSuccess] = useState<string>('');

  const JP_TIMES: Record<number, { start: string; end: string }> = {
    1: { start: '08:00', end: '08:35' },
    2: { start: '08:35', end: '09:10' },
    3: { start: '09:10', end: '09:45' },
    4: { start: '10:15', end: '10:50' },
    5: { start: '10:50', end: '11:25' },
    6: { start: '11:25', end: '12:00' },
    7: { start: '12:20', end: '12:55' },
    8: { start: '12:55', end: '13:30' },
    9: { start: '13:30', end: '14:05' },
    10: { start: '14:05', end: '14:40' },
  };

  const handlePeriodChange = (period: number) => {
    setScheduleFormPeriod(period);
    if (JP_TIMES[period]) {
      setScheduleFormStartTime(JP_TIMES[period].start);
      setScheduleFormEndTime(JP_TIMES[period].end);
    }
  };

  const handleOpenNewSchedule = (defaultDay?: number, defaultClass?: string) => {
    setEditingScheduleId(null);
    setScheduleFormDay(defaultDay || (scheduleFilterDay === 'ALL' ? 1 : scheduleFilterDay));
    setScheduleFormPeriod(1);
    setScheduleFormStartTime('08:00');
    setScheduleFormEndTime('08:35');
    setScheduleFormClassId(defaultClass || scheduleClassFilterId || selectedClassId || 'c1');
    setScheduleFormSubject(currentUser.specialty || 'Pendidikan Pancasila');
    setScheduleFormTeacherId(currentUser.id);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (item: MasterScheduleItem) => {
    setEditingScheduleId(item.id);
    setScheduleFormDay(item.day_of_week);
    setScheduleFormPeriod(item.period_number);
    setScheduleFormStartTime(item.start_time);
    setScheduleFormEndTime(item.end_time);
    setScheduleFormClassId(item.class_id);
    setScheduleFormSubject(item.subject_name);
    setScheduleFormTeacherId(item.teacher_id);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleFormSubject.trim()) return;

    const scheduleId = editingScheduleId || `sch-${scheduleFormClassId}-${scheduleFormDay}-${scheduleFormPeriod}-${Date.now().toString().slice(-4)}`;
    const scheduleItem: MasterScheduleItem = {
      id: scheduleId,
      class_id: scheduleFormClassId,
      day_of_week: (scheduleFormDay as 1 | 2 | 3 | 4 | 5),
      period_number: scheduleFormPeriod,
      start_time: scheduleFormStartTime,
      end_time: scheduleFormEndTime,
      duration_jp: 1,
      subject_name: scheduleFormSubject.trim(),
      teacher_id: scheduleFormTeacherId,
    };

    await saveScheduleItem(scheduleItem);
    setIsScheduleModalOpen(false);
    setScheduleSaveSuccess('Jadwal berhasil disimpan & tersinkronisasi otomatis ke Dashboard Bersama dan Firebase!');
    setTimeout(() => setScheduleSaveSuccess(''), 4000);
  };

  const handleDeleteSchedule = async (id: string, subjectName: string) => {
    if (window.confirm(`Hapus jadwal ${subjectName}? Tindakan ini akan menghapus jadwal secara permanen dari jadwal mengajar dan Dashboard Bersama.`)) {
      await deleteScheduleItem(id);
      setScheduleSaveSuccess('Jadwal berhasil dihapus!');
      setTimeout(() => setScheduleSaveSuccess(''), 3000);
    }
  };

  // Realtime Indonesian Date Format
  const realtimeDateFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const realtimeDateShortFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());
  }, []);

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

  // Monthly Attendance Matrix Handlers
  const isWeekendDay = (day: number) => {
    const dow = (activeMonthInfo.startDayOfWeek + day - 1) % 7;
    return dow === 0 || dow === 6; // 0=Sunday, 6=Saturday
  };

  const getDayAttendance = (studentId: string, day: number): 'H' | 'S' | 'I' | 'A' | '-' => {
    if (isWeekendDay(day)) return '-';
    const key = `${selectedClassId}-${selectedMonthIdx}-${studentId}-${day}`;
    return monthlyAttendanceMap[key] || 'H';
  };

  const toggleDayAttendance = (studentId: string, day: number) => {
    if (isWeekendDay(day)) return;
    const key = `${selectedClassId}-${selectedMonthIdx}-${studentId}-${day}`;
    const current = monthlyAttendanceMap[key] || 'H';
    const next: Record<'H' | 'S' | 'I' | 'A', 'H' | 'S' | 'I' | 'A'> = {
      H: 'S',
      S: 'I',
      I: 'A',
      A: 'H',
    };
    const updated = { ...monthlyAttendanceMap, [key]: next[current] };
    setMonthlyAttendanceMap(updated);
    localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updated));
  };

  const handleSetAllPresentMonth = () => {
    const updated = { ...monthlyAttendanceMap };
    classStudents.forEach((st) => {
      for (let d = 1; d <= activeMonthInfo.days; d++) {
        if (!isWeekendDay(d)) {
          const key = `${selectedClassId}-${selectedMonthIdx}-${st.id}-${d}`;
          updated[key] = 'H';
        }
      }
    });
    setMonthlyAttendanceMap(updated);
    localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updated));
    alert(`✅ Seluruh siswa ${currentClass.name} berhasil di-set HADIR untuk bulan ${activeMonthInfo.name}!`);
  };

  const handleExportMonthlyAttendanceExcel = () => {
    const headers: string[] = ['No', 'NIS', 'Nama Siswa'];
    for (let d = 1; d <= activeMonthInfo.days; d++) {
      headers.push(String(d));
    }
    headers.push('Hadir (H)', 'Sakit (S)', 'Izin (I)', 'Alpa (A)', '% Hadir');

    const rows = classStudents.map((st, i) => {
      let h = 0,
        s = 0,
        iz = 0,
        a = 0,
        effective = 0;
      const rowData: Record<string, any> = {
        'No': i + 1,
        'NIS': st.nis,
        'Nama Siswa': st.name,
      };

      for (let d = 1; d <= activeMonthInfo.days; d++) {
        if (isWeekendDay(d)) {
          rowData[String(d)] = '-';
        } else {
          effective++;
          const status = getDayAttendance(st.id, d);
          rowData[String(d)] = status;
          if (status === 'H') h++;
          else if (status === 'S') s++;
          else if (status === 'I') iz++;
          else if (status === 'A') a++;
        }
      }

      const pct = effective > 0 ? ((h / effective) * 100).toFixed(1) + '%' : '100%';
      rowData['Hadir (H)'] = h;
      rowData['Sakit (S)'] = s;
      rowData['Izin (I)'] = iz;
      rowData['Alpa (A)'] = a;
      rowData['% Hadir'] = pct;

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Presensi_${activeMonthInfo.monthName}`);
    XLSX.writeFile(
      wb,
      `Rekap_Presensi_${currentClass.name.replace(/\s+/g, '_')}_${activeMonthInfo.name.replace(/\s+/g, '_')}.xlsx`
    );
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
            <span>Jurnal Mengajar & Presensi Harian</span>
          </button>

          <button
            onClick={() => setActiveSubTab('absensi_bulanan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'absensi_bulanan'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Presensi Bulanan Siswa</span>
            <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 rounded-full">
              Jul - Jun
            </span>
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
        {(activeSubTab === 'jurnal_mengajar' ||
          activeSubTab === 'absensi_bulanan' ||
          activeSubTab === 'tahfidz' ||
          activeSubTab === 'kurikulum_rapor') && (
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
                {realtimeDateShortFormatted}
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

      {/* 2. MATRIKS PRESENSI SISWA BULANAN (DINAMIS JULI s/d JUNI) */}
      {activeSubTab === 'absensi_bulanan' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          {/* Header Controls: Month Picker, Navigation, Export, & Legend */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-school-gold-600" />
                  Presensi Bulanan Siswa — {currentClass.name}
                </h3>
                <span className="bg-school-gold-100 text-school-gold-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                  {classStudents.length} Siswa
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih bulan kalender akademik (Juli s/d Juni). Klik pada kotak tanggal siswa untuk mengganti status: <strong>H (Hadir)</strong>, <strong>S (Sakit)</strong>, <strong>I (Izin)</strong>, atau <strong>A (Alpa)</strong>.
              </p>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Previous Month */}
              <button
                type="button"
                onClick={() => setSelectedMonthIdx((prev) => Math.max(0, prev - 1))}
                disabled={selectedMonthIdx === 0}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Selector Dropdown */}
              <select
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                className="bg-white border-2 border-school-navy-900 rounded-xl px-3 py-1.5 text-xs font-black text-school-navy-900 shadow-xs focus:ring-2 focus:ring-school-gold-400"
              >
                {academicMonths.map((m, idx) => (
                  <option key={m.name} value={idx}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Next Month */}
              <button
                type="button"
                onClick={() => setSelectedMonthIdx((prev) => Math.min(academicMonths.length - 1, prev + 1))}
                disabled={selectedMonthIdx === academicMonths.length - 1}
                className="p-2 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Set All Present */}
              <button
                type="button"
                onClick={handleSetAllPresentMonth}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5"
                title="Isi Hadir untuk Semua Siswa di Hari Efektif"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Set Semua Hadir</span>
              </button>

              {/* Export Excel Button */}
              <button
                type="button"
                onClick={handleExportMonthlyAttendanceExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Export Matriks Presensi ke Format Excel"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Status Legend & Info */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 font-semibold text-slate-700">
              <span className="text-[11px] text-slate-500 font-bold">Keterangan:</span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                  H
                </span>
                <span>Hadir</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">
                  S
                </span>
                <span>Sakit</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-sky-100 text-sky-800 border border-sky-300">
                  I
                </span>
                <span>Izin</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-300">
                  A
                </span>
                <span>Alpa</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-200 text-slate-500">
                  -
                </span>
                <span>Libur Akhir Pekan</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              Tahun Ajaran <strong>2026/2027</strong> • SD Khoirur Rooziqiin
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-school-navy-900 text-white sticky top-0 z-20 font-bold text-[11px]">
                <tr>
                  <th className="px-2.5 py-2.5 w-10 text-center border-r border-white/10">No</th>
                  <th className="px-3 py-2.5 w-48 border-r border-white/10 sticky left-0 bg-school-navy-900 z-30">
                    Nama Siswa
                  </th>
                  {Array.from({ length: activeMonthInfo.days }, (_, i) => i + 1).map((day) => {
                    const isWeekend = isWeekendDay(day);
                    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                    const dow = (activeMonthInfo.startDayOfWeek + day - 1) % 7;
                    return (
                      <th
                        key={day}
                        className={`p-1 text-center w-8 border-r border-white/10 ${
                          isWeekend ? 'bg-[#0A1929] text-rose-300' : ''
                        }`}
                      >
                        <div className="text-[9px] opacity-75">{dayLabels[dow]}</div>
                        <div className="text-[11px] font-black">{day}</div>
                      </th>
                    );
                  })}
                  <th className="px-1.5 py-2.5 text-center w-8 bg-emerald-950 text-emerald-300 border-r border-white/10" title="Total Hadir">H</th>
                  <th className="px-1.5 py-2.5 text-center w-8 bg-amber-950 text-amber-300 border-r border-white/10" title="Total Sakit">S</th>
                  <th className="px-1.5 py-2.5 text-center w-8 bg-sky-950 text-sky-300 border-r border-white/10" title="Total Izin">I</th>
                  <th className="px-1.5 py-2.5 text-center w-8 bg-rose-950 text-rose-300 border-r border-white/10" title="Total Alpa">A</th>
                  <th className="px-2 py-2.5 text-center w-14 bg-school-gold-600 text-school-navy-950 font-black">
                    % Hadir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, i) => {
                  let hCount = 0;
                  let sCount = 0;
                  let iCount = 0;
                  let aCount = 0;
                  let effectiveDays = 0;

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2.5 py-1.5 text-center font-bold text-slate-400 border-r border-slate-100">
                        {i + 1}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 sticky left-0 bg-white hover:bg-slate-50 z-10 shadow-2xs">
                        <div className="font-bold text-slate-900 truncate max-w-[170px]" title={st.name}>
                          {st.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {st.nis}</div>
                      </td>

                      {Array.from({ length: activeMonthInfo.days }, (_, dIdx) => dIdx + 1).map((day) => {
                        const isWeekend = isWeekendDay(day);
                        if (!isWeekend) effectiveDays++;

                        const status = getDayAttendance(st.id, day);
                        if (!isWeekend) {
                          if (status === 'H') hCount++;
                          else if (status === 'S') sCount++;
                          else if (status === 'I') iCount++;
                          else if (status === 'A') aCount++;
                        }

                        const statusColors: Record<string, string> = {
                          H: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200',
                          S: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200',
                          I: 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200',
                          A: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200',
                          '-': 'bg-slate-100 text-slate-400 border-slate-200',
                        };

                        return (
                          <td
                            key={day}
                            onClick={() => !isWeekend && toggleDayAttendance(st.id, day)}
                            className={`p-0.5 text-center border-r border-slate-100 select-none ${
                              isWeekend ? 'bg-slate-100/60' : 'cursor-pointer'
                            }`}
                            title={
                              isWeekend
                                ? `Hari ${day} ${activeMonthInfo.monthName} adalah Libur Akhir Pekan`
                                : `Klik untuk mengubah status kehadiran siswa`
                            }
                          >
                            <span
                              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] border transition-transform ${
                                statusColors[status] || 'bg-slate-100 text-slate-500'
                              } ${!isWeekend ? 'active:scale-90' : ''}`}
                            >
                              {status}
                            </span>
                          </td>
                        );
                      })}

                      {/* Totals */}
                      <td className="px-1.5 py-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-r border-slate-100">
                        {hCount}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-amber-700 bg-amber-50/50 border-r border-slate-100">
                        {sCount}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-sky-700 bg-sky-50/50 border-r border-slate-100">
                        {iCount}
                      </td>
                      <td className="px-1.5 py-1.5 text-center font-bold text-rose-700 bg-rose-50/50 border-r border-slate-100">
                        {aCount}
                      </td>
                      <td className="px-2 py-1.5 text-center font-black text-school-navy-900 bg-amber-50/60">
                        {effectiveDays > 0 ? ((hCount / effectiveDays) * 100).toFixed(0) : 100}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. JADWAL PELAJARAN & MENGAJAR (INTEGRASI PENUH DASHBOARD GURU) */}
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

            {/* Toggle View: Jadwal Saya vs Jadwal Kelas & Tambah Jadwal */}
            <div className="flex flex-wrap items-center gap-2">
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

              {canManageSchedule && (
                <button
                  onClick={() => handleOpenNewSchedule()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-200" />
                  <span>+ Atur / Tambah Jadwal</span>
                </button>
              )}
            </div>
          </div>

          {scheduleSaveSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scheduleSaveSuccess}</span>
            </div>
          )}

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
                      {realtimeDateShortFormatted}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Menampilkan {mySchedules.length} slot jam pelajaran
                    </span>
                    {canManageSchedule && (
                      <button
                        onClick={() => handleOpenNewSchedule()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Tambah</span>
                      </button>
                    )}
                  </div>
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
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleScheduleToJournal(item)}
                                  className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1"
                                >
                                  <span>Tulis Jurnal</span>
                                  <ArrowRight className="w-3 h-3 text-school-gold-400" />
                                </button>
                                {canManageSchedule && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleEditSchedule(item)}
                                      title="Edit / Ubah Jadwal"
                                      className="p-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSchedule(item.id, item.subject_name)}
                                      title="Hapus Jadwal"
                                      className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg">
                    {classSchedules.length} Jam Pelajaran Terdaftar
                  </span>
                  {canManageSchedule && (
                    <button
                      onClick={() => handleOpenNewSchedule(undefined, scheduleClassFilterId)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah</span>
                    </button>
                  )}
                </div>
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
                      {canManageSchedule && <th className="py-2.5 px-4 text-center">Aksi</th>}
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
                          {canManageSchedule && (
                            <td className="py-2 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditSchedule(item)}
                                  title="Edit / Ubah Jadwal"
                                  className="p-1 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSchedule(item.id, item.subject_name)}
                                  title="Hapus Jadwal"
                                  className="p-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODAL ATUR / TAMBAH JADWAL MENGAJAR */}
          {isScheduleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between border-b border-school-gold-500/40">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-school-gold-400" />
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base">
                        {editingScheduleId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
                      </h3>
                      <p className="text-[11px] text-slate-300">
                        Tersinkronisasi otomatis ke Dashboard Bersama & Firebase
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveSchedule} className="p-6 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Hari */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Hari</label>
                      <select
                        value={scheduleFormDay}
                        onChange={(e) => setScheduleFormDay(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-school-navy-900 bg-white"
                      >
                        {[1, 2, 3, 4, 5].map((d) => (
                          <option key={d} value={d}>
                            {DAY_NAMES[d]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Jam Ke (JP) */}
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Jam Pelajaran (JP)</label>
                      <select
                        value={scheduleFormPeriod}
                        onChange={(e) => handlePeriodChange(Number(e.target.value))}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-school-navy-900 bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                          <option key={p} value={p}>
                            JP {p} ({JP_TIMES[p]?.start} - {JP_TIMES[p]?.end} WIB)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Waktu Mulai & Selesai */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Waktu Mulai (WIB)</label>
                      <input
                        type="time"
                        required
                        value={scheduleFormStartTime}
                        onChange={(e) => setScheduleFormStartTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Waktu Selesai (WIB)</label>
                      <input
                        type="time"
                        required
                        value={scheduleFormEndTime}
                        onChange={(e) => setScheduleFormEndTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Kelas */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kelas & Ruangan</label>
                    <select
                      value={scheduleFormClassId}
                      onChange={(e) => setScheduleFormClassId(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-school-navy-900 bg-white"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} — {cls.room_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Mata Pelajaran */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Mata Pelajaran</span>
                      <span className="text-[10px] text-slate-400">Pilih atau Ketik</span>
                    </label>
                    <select
                      value={PRESET_SPECIALTIES.includes(scheduleFormSubject as any) ? scheduleFormSubject : 'custom'}
                      onChange={(e) => {
                        if (e.target.value !== 'custom') {
                          setScheduleFormSubject(e.target.value);
                        }
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-school-navy-900 bg-white"
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
                      {PRESET_SPECIALTIES.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                      <option value="custom">Ketik Mapel Lainnya...</option>
                    </select>
                    {(!PRESET_SPECIALTIES.includes(scheduleFormSubject as any) || scheduleFormSubject === 'custom') && (
                      <input
                        type="text"
                        required
                        placeholder="Masukkan nama mata pelajaran..."
                        value={scheduleFormSubject === 'custom' ? '' : scheduleFormSubject}
                        onChange={(e) => setScheduleFormSubject(e.target.value)}
                        className="w-full mt-1.5 border border-slate-300 rounded-lg px-3 py-2 text-slate-800"
                      />
                    )}
                  </div>

                  {/* Guru Pengampu */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Guru Pengampu</label>
                    <select
                      value={scheduleFormTeacherId}
                      onChange={(e) => setScheduleFormTeacherId(e.target.value)}
                      disabled={!currentUser.roles.includes('Developer') && !currentUser.roles.includes('Kepala Sekolah')}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-school-navy-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      {allStaff.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.title || staff.roles[0]})
                        </option>
                      ))}
                    </select>
                    {!currentUser.roles.includes('Developer') && !currentUser.roles.includes('Kepala Sekolah') && (
                      <p className="text-[10px] text-slate-400">
                        Otomatis terisi akun Anda sebagai guru pengampu jadwal ini.
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="pt-3 border-t flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{editingScheduleId ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}</span>
                    </button>
                  </div>
                </form>
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
