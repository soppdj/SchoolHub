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
  RotateCcw,
  FolderPlus,
  CheckSquare,
  FileDown,
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

export const RUBRIC_SUBJECTS = [
  { key: 'pai', name: 'PAI', fullName: 'Pendidikan Agama Islam' },
  { key: 'tahfidz', name: 'Tahfidz', fullName: "Tahfidz Al-Qur'an" },
  { key: 'pancasila', name: 'Pancasila', fullName: 'Pendidikan Pancasila' },
  { key: 'bindo', name: 'B. Indo', fullName: 'Bahasa Indonesia' },
  { key: 'mtk', name: 'Matematika', fullName: 'Matematika' },
  { key: 'ipas', name: 'IPAS', fullName: 'IPAS (Sains & Sosial)' },
  { key: 'bing', name: 'B. Inggris', fullName: 'Bahasa Inggris' },
  { key: 'bsunda', name: 'B. Sunda', fullName: 'Bahasa Sunda' },
  { key: 'pjok', name: 'PJOK', fullName: 'Pendidikan Jasmani, Olahraga & Kesehatan' },
  { key: 'sbdp', name: 'SBdP', fullName: 'Seni Budaya & Prakarya' },
  { key: 'tik', name: 'TIK', fullName: 'TIK (Informatika & Komputer)' },
];

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
    dailyAttendanceMap,
    updateStudentAttendance,
    batchUpdateStudentAttendance,
    rppDocuments,
    addRppDocument,
    deleteRppDocument,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    | 'jurnal_mengajar'
    | 'absensi_bulanan'
    | 'jadwal'
    | 'daftar_siswa'
    | 'tahfidz'
    | 'kurikulum_rapor'
    | 'presensi_staf'
    | 'rubrik_penilaian'
    | 'rpp_modul'
    | 'laporan_harian'
  >('jurnal_mengajar');

  // Selected class for Jurnal & Gradebook
  const userClass = classes.find((c) => c.wali_kelas_id === currentUser.id) || classes[0];
  const [selectedClassId, setSelectedClassId] = useState<string>(userClass.id);
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Automatically sort students alphabetically by name (A-Z)
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.class_id === selectedClassId)
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [students, selectedClassId]);

  // Multi-select JP checklist state (defaults to JP 2)
  const [selectedJpPeriods, setSelectedJpPeriods] = useState<number[]>([2]);

  const toggleJpPeriod = (jp: number) => {
    setSelectedJpPeriods((prev) => {
      if (prev.includes(jp)) {
        if (prev.length === 1) return prev; // keep at least 1 JP
        return prev.filter((p) => p !== jp).sort((a, b) => a - b);
      } else {
        return [...prev, jp].sort((a, b) => a - b);
      }
    });
  };

  // Attendance Date for Mapel Quick Attendance (defaults to today)
  const [attendanceDate, setAttendanceDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const attendanceDayFormatted = useMemo(() => {
    try {
      const d = new Date(attendanceDate + 'T00:00:00');
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    } catch {
      return attendanceDate;
    }
  }, [attendanceDate]);

  // RPP Form State
  const [rppForm, setRppForm] = useState({
    title: '',
    subject_name: currentUser.specialty || 'Bahasa Indonesia',
    grade_level: 3,
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    file_name: '',
    description: '',
  });

  // Laporan Harian State
  const [laporanDate, setLaporanDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [laporanClassId, setLaporanClassId] = useState<string>('c3');

  // Persistent Rubrik Penilaian Grades State (studentId_subjectKey -> score)
  const [rubricGrades, setRubricGrades] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('schoolhub_rubrik_grades');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    // Seed default reasonable baseline scores for demo students
    const initial: Record<string, number> = {};
    return initial;
  });

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
  const [monthlyAttendanceMap, setMonthlyAttendanceMap] = useState<Record<string, 'H' | 'S' | 'I' | 'A' | '-'>>(() => {
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
    rpp_id: '',
  });

  const jpTimeRangeLabel = useMemo(() => {
    if (selectedJpPeriods.length === 0) return 'Pilih minimal 1 JP';
    const sorted = [...selectedJpPeriods].sort((a, b) => a - b);
    const firstJp = sorted[0];
    const lastJp = sorted[sorted.length - 1];
    const start = JP_TIMES[firstJp]?.start || '08:00';
    const end = JP_TIMES[lastJp]?.end || '08:35';
    if (sorted.length === 1) {
      return `Jam Ke-${firstJp} (JP ${firstJp}) • ${start} - ${end} WIB`;
    }
    return `Jam Ke-${firstJp} s/d Jam Ke-${lastJp} (${sorted.map((p) => `JP ${p}`).join(', ')}) • ${start} - ${end} WIB (${sorted.length} JP)`;
  }, [selectedJpPeriods, JP_TIMES]);

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

  // Helper to resolve month index from YYYY-MM-DD date string
  const getMonthIndexFromDateString = (dateStr: string): number => {
    try {
      const parts = dateStr.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // 0-indexed
      const found = academicMonths.findIndex((am) => {
        if (am.year !== y) return false;
        const monthMap: Record<string, number> = {
          Juli: 6,
          Agustus: 7,
          September: 8,
          Oktober: 9,
          November: 10,
          Desember: 11,
          Januari: 0,
          Februari: 1,
          Maret: 2,
          April: 3,
          Mei: 4,
          Juni: 5,
        };
        return monthMap[am.monthName] === m;
      });
      return found !== -1 ? found : selectedMonthIdx;
    } catch {
      return selectedMonthIdx;
    }
  };

  // 1. Daily Mapel Student Attendance Handlers
  const getDailyAttendance = (studentId: string): 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral' => {
    const key = `${selectedClassId}_${attendanceDate}_${studentId}`;
    if (dailyAttendanceMap[key]) {
      return dailyAttendanceMap[key];
    }
    // Check if recorded in monthly attendance matrix
    try {
      const d = parseInt(attendanceDate.split('-')[2], 10);
      const mIdx = getMonthIndexFromDateString(attendanceDate);
      const mKey = `${selectedClassId}-${mIdx}-${studentId}-${d}`;
      const mVal = monthlyAttendanceMap[mKey];
      if (mVal === 'H') return 'Hadir';
      if (mVal === 'S') return 'Sakit';
      if (mVal === 'I') return 'Izin';
      if (mVal === 'A') return 'Alpa';
    } catch {
      // ignore
    }
    return 'Netral';
  };

  const handleDailyAttendanceChange = (
    studentId: string,
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'
  ) => {
    updateStudentAttendance(selectedClassId, attendanceDate, studentId, status);

    // Mirror to Monthly Attendance Matrix so Wali Kelas sees it in real time
    try {
      const d = parseInt(attendanceDate.split('-')[2], 10);
      const mIdx = getMonthIndexFromDateString(attendanceDate);
      const mKey = `${selectedClassId}-${mIdx}-${studentId}-${d}`;
      const code: 'H' | 'S' | 'I' | 'A' | '-' = status === 'Netral' ? '-' : (status[0] as 'H' | 'S' | 'I' | 'A');
      const updatedMonthly = { ...monthlyAttendanceMap, [mKey]: code };
      setMonthlyAttendanceMap(updatedMonthly);
      localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updatedMonthly));
    } catch (e) {
      console.warn('Gagal sinkronisasi ke presensi bulanan:', e);
    }
  };

  const handleMarkAllDailyPresent = () => {
    const updates: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'> = {};
    const updatedMonthly = { ...monthlyAttendanceMap };
    const d = parseInt(attendanceDate.split('-')[2], 10);
    const mIdx = getMonthIndexFromDateString(attendanceDate);

    classStudents.forEach((st) => {
      const key = `${selectedClassId}_${attendanceDate}_${st.id}`;
      updates[key] = 'Hadir';
      const mKey = `${selectedClassId}-${mIdx}-${st.id}-${d}`;
      updatedMonthly[mKey] = 'H';
    });

    batchUpdateStudentAttendance(updates);
    setMonthlyAttendanceMap(updatedMonthly);
    localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updatedMonthly));
  };

  const handleMarkAllDailyNeutral = () => {
    const updates: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'> = {};
    const updatedMonthly = { ...monthlyAttendanceMap };
    const d = parseInt(attendanceDate.split('-')[2], 10);
    const mIdx = getMonthIndexFromDateString(attendanceDate);

    classStudents.forEach((st) => {
      const key = `${selectedClassId}_${attendanceDate}_${st.id}`;
      updates[key] = 'Netral';
      const mKey = `${selectedClassId}-${mIdx}-${st.id}-${d}`;
      updatedMonthly[mKey] = '-';
    });

    batchUpdateStudentAttendance(updates);
    setMonthlyAttendanceMap(updatedMonthly);
    localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updatedMonthly));
  };

  // 2. Monthly Attendance Matrix Handlers
  const isWeekendDay = (day: number) => {
    const dow = (activeMonthInfo.startDayOfWeek + day - 1) % 7;
    return dow === 0 || dow === 6; // 0=Sunday, 6=Saturday
  };

  const getDayAttendance = (studentId: string, day: number): 'H' | 'S' | 'I' | 'A' | '-' => {
    if (isWeekendDay(day)) return '-';
    const key = `${selectedClassId}-${selectedMonthIdx}-${studentId}-${day}`;
    return monthlyAttendanceMap[key] || '-';
  };

  const toggleDayAttendance = (studentId: string, day: number) => {
    if (isWeekendDay(day)) return;
    const key = `${selectedClassId}-${selectedMonthIdx}-${studentId}-${day}`;
    const current = monthlyAttendanceMap[key] || '-';
    const next: Record<'H' | 'S' | 'I' | 'A' | '-', 'H' | 'S' | 'I' | 'A' | '-'> = {
      '-': 'H',
      H: 'S',
      S: 'I',
      I: 'A',
      A: '-',
    };
    const updated = { ...monthlyAttendanceMap, [key]: next[current] || 'H' };
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

  const handleResetAllNeutralMonth = () => {
    const updated = { ...monthlyAttendanceMap };
    classStudents.forEach((st) => {
      for (let d = 1; d <= activeMonthInfo.days; d++) {
        if (!isWeekendDay(d)) {
          const key = `${selectedClassId}-${selectedMonthIdx}-${st.id}-${d}`;
          updated[key] = '-';
        }
      }
    });
    setMonthlyAttendanceMap(updated);
    localStorage.setItem('schoolhub_monthly_attendance', JSON.stringify(updated));
    alert(`↺ Presensi seluruh siswa ${currentClass.name} untuk bulan ${activeMonthInfo.name} berhasil dinetralkan!`);
  };

  // 3. Rubrik Penilaian Handlers
  const getRubricScore = (studentId: string, subjectKey: string): number => {
    const key = `${studentId}_${subjectKey}`;
    if (rubricGrades[key] !== undefined) {
      return rubricGrades[key];
    }
    // Default baseline score: 85
    return 85;
  };

  const handleRubricScoreChange = (studentId: string, subjectKey: string, val: string) => {
    const num = val === '' ? 0 : Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    const key = `${studentId}_${subjectKey}`;
    const updated = { ...rubricGrades, [key]: num };
    setRubricGrades(updated);
    localStorage.setItem('schoolhub_rubrik_grades', JSON.stringify(updated));
  };

  const handleBatchFillRubric = (score: number) => {
    const updated = { ...rubricGrades };
    classStudents.forEach((st) => {
      RUBRIC_SUBJECTS.forEach((sub) => {
        updated[`${st.id}_${sub.key}`] = score;
      });
    });
    setRubricGrades(updated);
    localStorage.setItem('schoolhub_rubrik_grades', JSON.stringify(updated));
    alert(`✅ Seluruh nilai ${currentClass.name} berhasil diatur ke ${score}!`);
  };

  const handleResetRubric = () => {
    if (!window.confirm(`Netralkan seluruh nilai rubrik kelas ${currentClass.name}?`)) return;
    const updated = { ...rubricGrades };
    classStudents.forEach((st) => {
      RUBRIC_SUBJECTS.forEach((sub) => {
        delete updated[`${st.id}_${sub.key}`];
      });
    });
    setRubricGrades(updated);
    localStorage.setItem('schoolhub_rubrik_grades', JSON.stringify(updated));
  };

  const calculateStudentRubricStats = (studentId: string) => {
    const scores = RUBRIC_SUBJECTS.map((sub) => getRubricScore(studentId, sub.key));
    const validScores = scores.filter((s) => s > 0);
    const avg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
    let predikat = 'D';
    let predikatLabel = 'Perlu Bimbingan';
    let badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';

    if (avg >= 90) {
      predikat = 'A';
      predikatLabel = 'Sangat Baik';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    } else if (avg >= 80) {
      predikat = 'B';
      predikatLabel = 'Baik';
      badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
    } else if (avg >= 70) {
      predikat = 'C';
      predikatLabel = 'Cukup';
      badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
    }

    return { avg: parseFloat(avg.toFixed(1)), predikat, predikatLabel, badgeColor };
  };

  const handleExportRubrikExcel = () => {
    const headers: string[] = ['No', 'NIS', 'Nama Siswa'];
    RUBRIC_SUBJECTS.forEach((sub) => {
      headers.push(sub.name);
    });
    headers.push('Rata-rata', 'Predikat', 'Keterangan');

    const rows = classStudents.map((st, i) => {
      const stats = calculateStudentRubricStats(st.id);
      const rowData: Record<string, any> = {
        No: i + 1,
        NIS: st.nis,
        'Nama Siswa': st.name,
      };

      RUBRIC_SUBJECTS.forEach((sub) => {
        rowData[sub.name] = getRubricScore(st.id, sub.key);
      });

      rowData['Rata-rata'] = stats.avg;
      rowData['Predikat'] = stats.predikat;
      rowData['Keterangan'] = stats.predikatLabel;

      return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rubrik_${currentClass.name.replace(/\s+/g, '_')}`);
    XLSX.writeFile(
      wb,
      `Rubrik_Penilaian_Semua_Mapel_${currentClass.name.replace(/\s+/g, '_')}_SD_Khoirur_Rooziqiin.xlsx`
    );
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

  // 4. RPP & Modul Ajar Handlers
  const handleSaveRpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rppForm.title.trim()) {
      alert('Mohon masukkan judul RPP / Modul Ajar!');
      return;
    }

    const defaultFileName = rppForm.file_name.trim()
      ? rppForm.file_name.trim()
      : `${rppForm.title.replace(/\s+/g, '_')}_Kls${rppForm.grade_level}.pdf`;

    await addRppDocument({
      title: rppForm.title.trim(),
      subject_name: rppForm.subject_name.trim(),
      grade_level: Number(rppForm.grade_level),
      semester: rppForm.semester,
      teacher_id: currentUser.id,
      teacher_name: currentUser.name,
      file_name: defaultFileName,
      description:
        rppForm.description.trim() ||
        'Modul Ajar Kurikulum Merdeka terintegrasi Alur Tujuan Pembelajaran (ATP).',
    });

    alert('✅ Dokumen RPP / Modul Ajar berhasil diunggah dan disimpan ke Bank RPP!');
    setRppForm({
      title: '',
      subject_name: currentUser.specialty || 'Bahasa Indonesia',
      grade_level: 3,
      semester: 'Ganjil',
      file_name: '',
      description: '',
    });
  };

  // 5. Laporan Jurnal Harian Computations & Handlers
  const laporanClassStudents = useMemo(() => {
    return students
      .filter((s) => (laporanClassId === 'ALL' ? true : s.class_id === laporanClassId))
      .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [students, laporanClassId]);

  const laporanJournals = useMemo(() => {
    return teachingJournals
      .filter((tj) => {
        const matchDate = tj.date === laporanDate;
        const matchClass = laporanClassId === 'ALL' ? true : tj.class_id === laporanClassId;
        return matchDate && matchClass;
      })
      .sort((a, b) => a.period_number - b.period_number);
  }, [teachingJournals, laporanDate, laporanClassId]);

  const laporanAttendanceStats = useMemo(() => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let netral = 0;

    laporanClassStudents.forEach((st) => {
      const key = `${st.class_id}_${laporanDate}_${st.id}`;
      const status = dailyAttendanceMap[key] || 'Netral';
      if (status === 'Hadir') hadir++;
      else if (status === 'Sakit') sakit++;
      else if (status === 'Izin') izin++;
      else if (status === 'Alpa') alpa++;
      else netral++;
    });

    const total = laporanClassStudents.length;
    const effectiveTotal = hadir + sakit + izin + alpa;
    const pct = effectiveTotal > 0 ? ((hadir / effectiveTotal) * 100).toFixed(1) + '%' : '100%';

    return { total, hadir, sakit, izin, alpa, netral, pct };
  }, [laporanClassStudents, laporanDate, dailyAttendanceMap]);

  const handleExportLaporanHarianExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Jurnal Mengajar
    const journalRows = laporanJournals.map((j, i) => {
      const teacher = allStaff.find((t) => t.id === j.teacher_id);
      const cls = classes.find((c) => c.id === j.class_id);
      return {
        No: i + 1,
        'Jam Pelajaran': `Jam Ke-${j.period_number}`,
        Kelas: cls?.name || j.class_id,
        'Mata Pelajaran': j.subject_name,
        'Guru Pengajar': teacher?.name || currentUser.name,
        'Materi / Topik': j.topic,
        'Aktivitas Pembelajaran': j.learning_activity,
        'Dokumen RPP / Modul': j.rpp_title || '-',
        'Catatan Guru': j.notes || '-',
        'Jumlah Hadir': j.present_count,
        'Sakit': j.sick_count,
        'Izin': j.permitted_count,
        'Alpa': j.absent_count,
      };
    });
    const wsJournals = XLSX.utils.json_to_sheet(
      journalRows.length > 0 ? journalRows : [{ Catatan: 'Tidak ada entri jurnal pada tanggal ini' }]
    );
    XLSX.utils.book_append_sheet(wb, wsJournals, 'Jurnal_Mengajar');

    // Sheet 2: Presensi Siswa (Alfabetis A-Z)
    const attendanceRows = laporanClassStudents.map((st, i) => {
      const cls = classes.find((c) => c.id === st.class_id);
      const key = `${st.class_id}_${laporanDate}_${st.id}`;
      const status = dailyAttendanceMap[key] || 'Netral';
      return {
        No: i + 1,
        NIS: st.nis,
        'Nama Siswa (A-Z)': st.name,
        Kelas: cls?.name || st.class_id,
        'Status Presensi': status,
        'Catatan / Kebutuhan Khusus': st.has_special_needs ? 'GPK / ABK' : st.notes || '-',
      };
    });
    const wsAttendance = XLSX.utils.json_to_sheet(attendanceRows);
    XLSX.utils.book_append_sheet(wb, wsAttendance, 'Presensi_Siswa');

    XLSX.writeFile(wb, `Laporan_Jurnal_Harian_${laporanDate}_SD_Khoirur_Rooziqiin.xlsx`);
  };

  // Jump from Schedule to Journal
  const handleScheduleToJournal = (item: MasterScheduleItem) => {
    setSelectedClassId(item.class_id);
    setSelectedJpPeriods([item.period_number]);
    setJournalForm({
      period_number: item.period_number,
      subject_name: item.subject_name,
      topic: '',
      learning_activity: '',
      notes: '',
      rpp_id: '',
    });
    setActiveSubTab('jurnal_mengajar');
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.topic || !journalForm.learning_activity) {
      alert('Mohon lengkapi judul materi dan ringkasan aktivitas pembelajaran!');
      return;
    }

    const presentCount = classStudents.filter((s) => getDailyAttendance(s.id) === 'Hadir').length;
    const sickCount = classStudents.filter((s) => getDailyAttendance(s.id) === 'Sakit').length;
    const permittedCount = classStudents.filter((s) => getDailyAttendance(s.id) === 'Izin').length;
    const absentCount = classStudents.filter((s) => getDailyAttendance(s.id) === 'Alpa').length;

    const matchedRpp = rppDocuments.find((d) => d.id === journalForm.rpp_id);
    const periodsToSave = selectedJpPeriods.length > 0 ? selectedJpPeriods : [2];

    for (const jp of periodsToSave) {
      await recordTeachingJournal({
        class_id: selectedClassId,
        date: attendanceDate,
        period_number: jp,
        period_numbers: periodsToSave,
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
        rpp_id: matchedRpp?.id,
        rpp_title: matchedRpp?.title,
        rpp_file_url: matchedRpp?.file_name,
      });
    }

    alert(
      `✅ Jurnal Mengajar (${periodsToSave.map((p) => `JP ${p}`).join(', ')}) & Presensi berhasil disimpan! Panel kelas di Dashboard Bersama otomatis berubah menjadi HIJAU.`
    );
    setJournalForm({
      period_number: 2,
      subject_name: currentUser.specialty || 'Bahasa Indonesia',
      topic: '',
      learning_activity: '',
      notes: '',
      rpp_id: '',
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

          <button
            onClick={() => setActiveSubTab('rubrik_penilaian')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'rubrik_penilaian'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Rubrik Penilaian</span>
          </button>

          <button
            onClick={() => setActiveSubTab('rpp_modul')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'rpp_modul'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Upload RPP & Modul Ajar</span>
            {rppDocuments.length > 0 && (
              <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 rounded-full">
                {rppDocuments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('laporan_harian')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'laporan_harian'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-school-gold-400" />
            <span>Laporan Jurnal Harian</span>
          </button>
        </div>

        {/* Class Selector Dropdown for Class-context tabs */}
        {(activeSubTab === 'jurnal_mengajar' ||
          activeSubTab === 'absensi_bulanan' ||
          activeSubTab === 'tahfidz' ||
          activeSubTab === 'kurikulum_rapor' ||
          activeSubTab === 'rubrik_penilaian' ||
          activeSubTab === 'laporan_harian') && (
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
              <div className="space-y-3">
                {/* Jam Pelajaran Ke- (Sistem Ceklis Multi-JP) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-700">
                      Jam Pelajaran Ke- <span className="text-[10px] font-normal text-slate-500">(Sistem Ceklis Multi-JP)</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-school-gold-800 bg-school-gold-100 px-2 py-0.5 rounded border border-school-gold-300">
                      {selectedJpPeriods.length} JP Dipilih
                    </span>
                  </div>
                  {/* Grid Ceklis JP 1 s/d JP 10 */}
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((jp) => {
                      const isChecked = selectedJpPeriods.includes(jp);
                      return (
                        <button
                          key={jp}
                          type="button"
                          onClick={() => toggleJpPeriod(jp)}
                          className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all border flex flex-col items-center justify-center cursor-pointer select-none ${
                            isChecked
                              ? 'bg-[#0F2942] text-white border-[#0F2942] shadow-xs ring-2 ring-school-gold-400'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                          title={`Jam Ke-${jp} (${JP_TIMES[jp]?.start} - ${JP_TIMES[jp]?.end} WIB)`}
                        >
                          <span className="text-[9px] opacity-80">{isChecked ? '✓' : ''} JP</span>
                          <span>{jp}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-600 font-medium bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1 flex items-center justify-between">
                    <span>🕒 {jpTimeRangeLabel}</span>
                  </div>
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

              {/* Tautkan RPP / Modul Ajar (Sesuai Arahan Gambar) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5 text-school-gold-600" />
                    <span>Tautkan RPP, Modul Ajar</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('rpp_modul')}
                    className="text-[10px] font-bold text-school-navy-800 hover:text-school-navy-950 hover:underline flex items-center gap-1"
                  >
                    <span>+ Upload RPP Baru</span>
                  </button>
                </div>
                <select
                  value={journalForm.rpp_id}
                  onChange={(e) => setJournalForm({ ...journalForm, rpp_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800 focus:bg-white"
                >
                  <option value="">-- Pilih Dokumen RPP / Modul Ajar yang Ditautkan (Opsional) --</option>
                  {rppDocuments.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title} ({doc.subject_name} • Kls {doc.grade_level})
                    </option>
                  ))}
                </select>
                {journalForm.rpp_id && (
                  <div className="mt-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-medium truncate">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Tertaut: <b>{rppDocuments.find((d) => d.id === journalForm.rpp_id)?.title}</b>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 shrink-0">
                      {rppDocuments.find((d) => d.id === journalForm.rpp_id)?.file_name || 'Dokumen RPP'}
                    </span>
                  </div>
                )}
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
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-school-navy-700" />
                  Presensi Cepat — {currentClass.name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar siswa resmi ({classStudents.length} siswa). Klik untuk mengubah status.
                </p>
              </div>

              {/* Action Buttons: Hadirkan Semua & Netralkan Semua */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleMarkAllDailyNeutral}
                  className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  title="Netralkan status presensi seluruh siswa di kelas ini"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" />
                  <span>Netralkan Semua</span>
                </button>
                <button
                  type="button"
                  onClick={handleMarkAllDailyPresent}
                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  title="Tandai semua siswa hadir"
                >
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Hadirkan Semua</span>
                </button>
              </div>
            </div>

            {/* Editable Day & Date Selector Bar for Guru Mapel */}
            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-school-gold-600 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 leading-none">Hari & Tanggal Presensi</div>
                  <div className="text-xs font-black text-school-navy-900 leading-tight mt-0.5">{attendanceDayFormatted}</div>
                </div>
              </div>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-school-navy-900 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden cursor-pointer"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 pr-1">
              {classStudents.map((st, i) => {
                const curStatus = getDailyAttendance(st.id);
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

                    {/* Status Options: H, S, I, A, and - (Netral) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Netral'] as const).map((stat) => {
                        const isSelected = curStatus === stat;
                        const label = stat === 'Netral' ? '-' : stat[0];
                        return (
                          <button
                            key={stat}
                            type="button"
                            onClick={() => handleDailyAttendanceChange(st.id, stat)}
                            className={`text-[10px] w-6 h-6 rounded-md font-bold transition-all flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? stat === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 scale-105'
                                  : stat === 'Sakit'
                                  ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400 scale-105'
                                  : stat === 'Izin'
                                  ? 'bg-blue-500 text-white shadow-xs ring-2 ring-blue-400 scale-105'
                                  : stat === 'Alpa'
                                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-400 scale-105'
                                  : 'bg-slate-700 text-white shadow-xs ring-2 ring-slate-400 scale-105 font-black'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={`Status: ${stat}`}
                          >
                            {label}
                          </button>
                        );
                      })}
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

              {/* Netralkan Semua */}
              <button
                type="button"
                onClick={handleResetAllNeutralMonth}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-300 flex items-center gap-1.5 shadow-2xs"
                title="Reset / Netralkan Presensi Seluruh Siswa di Bulan Ini"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Netralkan Semua</span>
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
            <div className="flex items-center gap-3 font-semibold text-slate-700 flex-wrap">
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
                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] bg-slate-100 text-slate-500 border border-slate-300">
                  -
                </span>
                <span>Netral / Belum Terisi</span>
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

      {/* 8. RUBRIK PENILAIAN SELURUH MATA PELAJARAN (INTEGRASI GURU & WALI KELAS) */}
      {activeSubTab === 'rubrik_penilaian' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  Rubrik Terintegrasi
                </span>
                <span className="text-xs font-bold text-slate-500">Tahun Ajaran 2026/2027</span>
              </div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2 mt-1">
                <Award className="w-5 h-5 text-school-gold-600" />
                Rubrik Penilaian Semua Mata Pelajaran — {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Matriks penilaian capaian kompetensi siswa ({classStudents.length} siswa). Saling terintegrasi secara real-time antara seluruh guru mata pelajaran dan wali kelas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleBatchFillRubric(85)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5"
                title="Isi Nilai Standar 85 untuk Semua Siswa"
              >
                <Sparkles className="w-3.5 h-3.5 text-school-gold-600" />
                <span>Isi Standar (85)</span>
              </button>

              <button
                type="button"
                onClick={handleResetRubric}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-rose-300 flex items-center gap-1.5"
                title="Kosongkan / Reset Nilai Rubrik"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Nilai</span>
              </button>

              <button
                type="button"
                onClick={handleExportRubrikExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Unduh Rekap Rubrik Nilai dalam Format Excel"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[620px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-school-navy-900 text-white sticky top-0 z-20 font-bold text-[11px]">
                <tr>
                  <th className="px-2.5 py-2.5 w-10 text-center border-r border-white/10">No</th>
                  <th className="px-3 py-2.5 w-24 border-r border-white/10">NIS</th>
                  <th className="px-3 py-2.5 w-44 border-r border-white/10 sticky left-0 bg-school-navy-900 z-30">
                    Nama Siswa
                  </th>
                  {RUBRIC_SUBJECTS.map((sub) => (
                    <th
                      key={sub.key}
                      className="px-2 py-2 text-center w-20 border-r border-white/10"
                      title={sub.fullName}
                    >
                      <div className="font-extrabold">{sub.name}</div>
                      <div className="text-[9px] opacity-70 truncate max-w-[70px]">{sub.fullName.split(' ')[0]}</div>
                    </th>
                  ))}
                  <th className="px-2.5 py-2.5 text-center w-20 bg-[#153654] text-school-gold-300 border-r border-white/10">
                    Rata-rata
                  </th>
                  <th className="px-3 py-2.5 text-center w-28 bg-[#153654] text-white">
                    Predikat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, i) => {
                  const stats = calculateStudentRubricStats(st.id);
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2.5 py-2 text-center font-bold text-slate-400 border-r border-slate-100">
                        {i + 1}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-500 border-r border-slate-100 text-[11px]">
                        {st.nis}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-100 sticky left-0 bg-white hover:bg-slate-50 z-10 shadow-2xs">
                        <div className="font-bold text-slate-900 truncate max-w-[160px]" title={st.name}>
                          {st.name}
                        </div>
                        {st.has_special_needs && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded">
                            Inklusif (GPK)
                          </span>
                        )}
                      </td>

                      {/* 11 Subject Inputs */}
                      {RUBRIC_SUBJECTS.map((sub) => {
                        const score = getRubricScore(st.id, sub.key);
                        return (
                          <td key={sub.key} className="p-1 text-center border-r border-slate-100">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={score === 0 ? '' : score}
                              onChange={(e) => handleRubricScoreChange(st.id, sub.key, e.target.value)}
                              className={`w-14 text-center py-1 rounded-lg font-bold border transition-all text-xs focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden ${
                                score >= 85
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : score >= 75
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : score >= 65
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : score > 0
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                              placeholder="-"
                            />
                          </td>
                        );
                      })}

                      {/* Average */}
                      <td className="px-2.5 py-2 text-center font-extrabold text-school-navy-950 bg-amber-50/50 border-r border-slate-100 text-xs">
                        {stats.avg > 0 ? stats.avg : '-'}
                      </td>

                      {/* Predicate */}
                      <td className="px-3 py-2 text-center">
                        {stats.avg > 0 ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${stats.badgeColor}`}>
                            {stats.predikat} • {stats.predikatLabel}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {classStudents.length === 0 && (
                  <tr>
                    <td colSpan={16} className="py-8 text-center text-slate-400 text-xs">
                      Belum ada siswa terdaftar di {currentClass.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. UPLOAD RPP & MODUL AJAR (BANK RPP TERPADU) */}
      {activeSubTab === 'rpp_modul' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-school-navy-900 via-school-navy-800 to-[#1E3A8A] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-school-gold-500/20 text-school-gold-400 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black tracking-wide">
                  Bank Dokumen RPP & Modul Ajar
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Pusat arsip dan unggahan RPP serta Modul Ajar Kurikulum Merdeka SD Khoirur Rooziqiin. Dokumen yang diunggah dapat langsung ditautkan saat guru mengisi Jurnal Mengajar Harian.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white/10 backdrop-blur-xs border border-white/20 px-3.5 py-2 rounded-xl text-center">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">Total Modul Ajar</div>
                <div className="text-lg font-black text-school-gold-400">{rppDocuments.length} Dokumen</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Form Upload RPP (Col 5) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-school-gold-600" />
                  Unggah Dokumen RPP / Modul Ajar Baru
                </h4>
                <p className="text-[11px] text-slate-500">
                  Lengkapi data dokumen perangkat ajar Anda untuk kelas dan mata pelajaran terkait.
                </p>
              </div>

              <form onSubmit={handleSaveRpp} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Judul RPP / Modul Ajar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rppForm.title}
                    onChange={(e) => setRppForm({ ...rppForm, title: e.target.value })}
                    placeholder="Contoh: Modul Ajar IPAS - Siklus Hidup & Ekosistem"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                    <input
                      type="text"
                      required
                      value={rppForm.subject_name}
                      onChange={(e) => setRppForm({ ...rppForm, subject_name: e.target.value })}
                      placeholder="Contoh: IPAS / Matematika"
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenjang Kelas</label>
                    <select
                      value={rppForm.grade_level}
                      onChange={(e) => setRppForm({ ...rppForm, grade_level: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-bold text-school-navy-900"
                    >
                      {[1, 2, 3, 4, 5, 6].map((gr) => (
                        <option key={gr} value={gr}>
                          Kelas {gr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Semester</label>
                    <select
                      value={rppForm.semester}
                      onChange={(e) => setRppForm({ ...rppForm, semester: e.target.value as 'Ganjil' | 'Genap' })}
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium"
                    >
                      <option value="Ganjil">Semester Ganjil</option>
                      <option value="Genap">Semester Genap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama File Dokumen</label>
                    <input
                      type="text"
                      value={rppForm.file_name}
                      onChange={(e) => setRppForm({ ...rppForm, file_name: e.target.value })}
                      placeholder="Modul_Ajar.pdf"
                      className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deskripsi / Alur Tujuan Pembelajaran (ATP)</label>
                  <textarea
                    rows={3}
                    value={rppForm.description}
                    onChange={(e) => setRppForm({ ...rppForm, description: e.target.value })}
                    placeholder="Tuliskan tujuan pembelajaran, alur fase, atau ringkasan media yang digunakan..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-school-gold-400" />
                  <span>Simpan ke Bank RPP & Modul Ajar</span>
                </button>
              </form>
            </div>

            {/* List RPP Dokumen (Col 7) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-school-gold-600" />
                    Daftar RPP & Modul Ajar Tersimpan
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Dokumen siap ditautkan ke jurnal atau diunduh untuk kebutuhan pembelajaran.
                  </p>
                </div>
              </div>

              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {rppDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-school-gold-400 bg-slate-50/60 hover:bg-white transition-all space-y-2.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-school-navy-900 text-white text-[10px] font-black px-2 py-0.5 rounded">
                            Kelas {doc.grade_level}
                          </span>
                          <span className="bg-school-gold-100 text-school-gold-800 text-[10px] font-bold px-2 py-0.5 rounded border border-school-gold-200">
                            {doc.subject_name}
                          </span>
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
                            Semester {doc.semester}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-school-navy-950 group-hover:text-school-navy-700">
                          {doc.title}
                        </h5>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Hapus dokumen RPP "${doc.title}"?`)) {
                            deleteRppDocument(doc.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Hapus RPP"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {doc.description && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                      <div className="text-slate-500 text-[10px]">
                        ✍️ Oleh: <span className="font-bold text-slate-700">{doc.teacher_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setJournalForm((prev) => ({ ...prev, rpp_id: doc.id }));
                            setActiveSubTab('jurnal_mengajar');
                          }}
                          className="px-2.5 py-1 bg-school-gold-400 hover:bg-school-gold-500 text-school-navy-950 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1 shadow-xs"
                          title="Tautkan RPP ini saat mengisi jurnal hari ini"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Tautkan ke Jurnal</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => alert(`Mengunduh dokumen: ${doc.file_name}`)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-lg text-[10px] transition-all flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-slate-500" />
                          <span>{doc.file_name}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {rppDocuments.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Belum ada dokumen RPP atau Modul Ajar yang diunggah.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. LAPORAN JURNAL HARIAN TERPADU (PRESENSI & JURNAL MENGAJAR) */}
      {activeSubTab === 'laporan_harian' && (
        <div className="space-y-4">
          {/* Header Controls & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
                <Calendar className="w-4 h-4 text-school-gold-600" />
                <span className="font-bold text-slate-700">Tanggal Laporan:</span>
                <input
                  type="date"
                  value={laporanDate}
                  onChange={(e) => setLaporanDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 font-bold text-school-navy-900 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden cursor-pointer"
                />
              </div>

              {/* Class Filter */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
                <Users className="w-4 h-4 text-school-navy-700" />
                <span className="font-bold text-slate-700">Pilih Kelas:</span>
                <select
                  value={laporanClassId}
                  onChange={(e) => setLaporanClassId(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-0.5 font-bold text-school-navy-900 focus:ring-2 focus:ring-school-gold-400 focus:outline-hidden"
                >
                  <option value="ALL">Semua Kelas (1 s/d 6)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons: Print & Excel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-school-gold-400" />
                <span>Cetak Laporan (Print / PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleExportLaporanHarianExcel}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Printable Report Document Card */}
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            
            {/* Kop Surat Resmi SD Khoirur Rooziqiin */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <h2 className="text-lg md:text-xl font-black text-school-navy-950 tracking-wide uppercase">
                SD KHOIRUR ROOZIQIIN BANDUNG
              </h2>
              <h3 className="text-xs md:text-sm font-extrabold text-school-gold-700 uppercase tracking-wider">
                LAPORAN JURNAL MENGAJAR & REKAPITULASI PRESENSI HARIAN
              </h3>
              <p className="text-[11px] text-slate-500">
                Pusat Data Terpadu Pembelajaran • Tahun Ajaran 2026/2027
              </p>
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-700 pt-1">
                <span>🗓️ Tanggal: {laporanDate}</span>
                <span>•</span>
                <span>
                  🏫 Kelas: {laporanClassId === 'ALL' ? 'Seluruh Kelas (Kelas 1 - 6)' : classes.find((c) => c.id === laporanClassId)?.name}
                </span>
              </div>
            </div>

            {/* Bagian 1: Ringkasan & Rekapitulasi Presensi Siswa */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-school-gold-600" />
                  1. Rekapitulasi & Presensi Siswa (Urutan Alfabet A-Z)
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  Total Siswa: {laporanAttendanceStats.total} Siswa
                </span>
              </div>

              {/* Attendance Mini Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Siswa</div>
                  <div className="text-base font-black text-slate-800">{laporanAttendanceStats.total}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Hadir</div>
                  <div className="text-base font-black text-emerald-800">{laporanAttendanceStats.hadir}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-2 rounded-xl">
                  <div className="text-[10px] text-amber-700 uppercase font-semibold">Sakit</div>
                  <div className="text-base font-black text-amber-800">{laporanAttendanceStats.sakit}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-xl">
                  <div className="text-[10px] text-blue-700 uppercase font-semibold">Izin</div>
                  <div className="text-base font-black text-blue-800">{laporanAttendanceStats.izin}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  <div className="text-[10px] text-rose-700 uppercase font-semibold">Alpa</div>
                  <div className="text-base font-black text-rose-800">{laporanAttendanceStats.alpa}</div>
                </div>
                <div className="bg-school-navy-50 border border-school-navy-200 p-2 rounded-xl">
                  <div className="text-[10px] text-school-navy-700 uppercase font-semibold">% Kehadiran</div>
                  <div className="text-base font-black text-school-navy-900">{laporanAttendanceStats.pct}</div>
                </div>
              </div>

              {/* Student Attendance Table (A-Z) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-extrabold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3 w-28">NIS</th>
                      <th className="py-2 px-3">Nama Lengkap Siswa (A-Z)</th>
                      <th className="py-2 px-3 w-24">Kelas</th>
                      <th className="py-2 px-3 w-28 text-center">Status Presensi</th>
                      <th className="py-2 px-3">Keterangan / Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {laporanClassStudents.map((st, i) => {
                      const key = `${st.class_id}_${laporanDate}_${st.id}`;
                      const status = dailyAttendanceMap[key] || 'Netral';
                      const cls = classes.find((c) => c.id === st.class_id);
                      return (
                        <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-500 font-mono">{i + 1}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{st.nis}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {st.name}
                            {st.has_special_needs && (
                              <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                                GPK
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-600 font-medium">{cls?.name || st.class_id}</td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                                status === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : status === 'Sakit'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : status === 'Izin'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : status === 'Alpa'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] italic">
                            {st.notes || (st.has_special_needs ? 'Program Inklusi ABK' : '-')}
                          </td>
                        </tr>
                      );
                    })}
                    {laporanClassStudents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Tidak ada data siswa untuk kelas yang dipilih.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bagian 2: Jurnal Mengajar Hari Tersebut */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-school-gold-600" />
                  2. Entri Jurnal Mengajar & Perangkat Ajar Tertaut
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {laporanJournals.length} Entri Jurnal
                </span>
              </div>

              {laporanJournals.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 w-16 text-center">JP</th>
                        <th className="py-2 px-3 w-20">Kelas</th>
                        <th className="py-2 px-3 w-36">Mata Pelajaran</th>
                        <th className="py-2 px-3 w-40">Guru Pengajar</th>
                        <th className="py-2 px-3">Materi / Topik Pembelajaran</th>
                        <th className="py-2 px-3">Aktivitas & Metode</th>
                        <th className="py-2 px-3 w-44">Dokumen RPP / Modul</th>
                        <th className="py-2 px-3 w-36">Catatan Pembelajaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {laporanJournals.map((j) => {
                        const teacher = allStaff.find((t) => t.id === j.teacher_id);
                        const cls = classes.find((c) => c.id === j.class_id);
                        const jpLabel = j.period_numbers && j.period_numbers.length > 1
                          ? `JP ${j.period_numbers.join(', ')}`
                          : `JP ${j.period_number}`;
                        return (
                          <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-black text-school-navy-900">
                              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                {jpLabel}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-700">{cls?.name || j.class_id}</td>
                            <td className="py-2.5 px-3 font-extrabold text-school-navy-950">{j.subject_name}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{teacher?.name || currentUser.name}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{j.topic}</td>
                            <td className="py-2.5 px-3 text-slate-600 leading-relaxed text-[11px]">{j.learning_activity}</td>
                            <td className="py-2.5 px-3">
                              {j.rpp_title ? (
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{j.rpp_title}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] italic">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px] italic">
                              {j.notes || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">
                    Belum ada entri Jurnal Mengajar yang diisi untuk tanggal {laporanDate} pada kelas ini.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveSubTab('jurnal_mengajar')}
                    className="px-3 py-1 bg-school-navy-900 hover:bg-school-navy-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Isi Jurnal Mengajar Sekarang
                  </button>
                </div>
              )}
            </div>

            {/* Bagian 3: Pengesahan & Tanda Tangan Resmi */}
            <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <div className="text-slate-500">Mengetahui,</div>
                  <div className="font-bold text-slate-800">Guru Mata Pelajaran / Wali Kelas</div>
                </div>
                <div className="font-extrabold text-slate-900 underline">
                  {currentUser.name}
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <div className="text-slate-500">Bandung, {laporanDate}</div>
                  <div className="font-bold text-slate-800">Kepala Sekolah</div>
                </div>
                <div className="font-extrabold text-slate-900 underline">
                  Dwi Windarti, S.E
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
