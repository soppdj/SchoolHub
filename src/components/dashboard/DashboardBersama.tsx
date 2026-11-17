import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  UserCheck,
  UserX,
  BookOpen,
  HeartHandshake,
  ArrowRight,
  HelpCircle,
  FileText,
  UserPlus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PanelColorState, SchoolClass, MasterScheduleItem, UserProfile } from '../../types';

export const DashboardBersama: React.FC = () => {
  const {
    classes,
    students,
    schedules,
    allStaff,
    staffAttendance,
    teachingJournals,
    shadowJournals,
    piketSchedules,
    currentUser,
    assignSubstituteTeacher,
    simulatedTime,
    setSimulatedTime,
    simulatedDay,
    setSimulatedDay,
    isSimulatingRedState,
    setIsSimulatingRedState,
    studentAttendanceSummary,
    dailyAttendanceMap,
  } = useApp();

  const [selectedClassModal, setSelectedClassModal] = useState<SchoolClass | null>(null);
  const [isTahfidzDay, setIsTahfidzDay] = useState(false); // Normal Day vs Tahfidz Day
  const [isAutoRealtime, setIsAutoRealtime] = useState(true);

  // Active date for resolving dynamic student attendance
  const activeAttendanceDate = useMemo(() => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isoToday = now.toISOString().split('T')[0];

    const recordedDates = Array.from(
      new Set(
        Object.keys(dailyAttendanceMap || {})
          .map((k) => k.split('_')[1])
          .filter(Boolean)
      )
    );

    return recordedDates.includes(localToday)
      ? localToday
      : recordedDates.includes(isoToday)
      ? isoToday
      : recordedDates.length > 0
      ? recordedDates[recordedDates.length - 1]
      : localToday;
  }, [dailyAttendanceMap]);

  // Automatic Realtime JP ticker (follows current real time and day)
  useEffect(() => {
    const syncRealtime = () => {
      if (!isAutoRealtime) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setSimulatedTime(`${hh}:${mm}`);
      const d = now.getDay();
      if (d >= 1 && d <= 5) {
        setSimulatedDay(d);
      }
    };

    syncRealtime();
    const interval = setInterval(syncRealtime, 10000); // sync every 10 seconds
    return () => clearInterval(interval);
  }, [isAutoRealtime, setSimulatedTime, setSimulatedDay]);

  // Dynamic Realtime Indonesian Date Format
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

  // Time periods definition (1 JP = 35 mins) based on Jadwal_fix.xlsx
  const periods = useMemo(() => {
    return [
      { period: 0, label: 'Pembiasaan Sholat Dhuha', start: '07:30', end: '08:00', isRoutine: true },
      { period: 1, label: 'Jam Ke-1', start: '08:00', end: '08:35', durationJp: 1 },
      { period: 2, label: 'Jam Ke-2', start: '08:35', end: '09:10', durationJp: 1 },
      { period: 3, label: 'Jam Ke-3', start: '09:10', end: '09:45', durationJp: 1 },
      { period: 0, label: 'Istirahat Pagi', start: '09:45', end: '10:15', isRoutine: true },
      { period: 4, label: 'Jam Ke-4', start: '10:15', end: '10:50', durationJp: 1 },
      { period: 5, label: 'Jam Ke-5', start: '10:50', end: '11:25', durationJp: 1 },
      { period: 6, label: 'Jam Ke-6', start: '11:25', end: '12:00', durationJp: 1 },
      { period: 0, label: 'Istirahat Siang', start: '12:00', end: '12:20', isRoutine: true },
      { period: 7, label: 'Jam Ke-7', start: '12:20', end: '12:55', durationJp: 1 },
      { period: 8, label: 'Jam Ke-8', start: '12:55', end: '13:30', durationJp: 1 },
      { period: 9, label: 'Jam Ke-9', start: '13:30', end: '14:05', durationJp: 1 },
      { period: 10, label: 'Jam Ke-10', start: '14:05', end: '14:40', durationJp: 1 },
    ];
  }, []);

  // Find active period based on simulatedTime (semi-open interval [start, end) so boundaries match correctly)
  const activePeriod = useMemo(() => {
    const cur = periods.find((p) => simulatedTime >= p.start && simulatedTime < p.end);
    if (cur) return cur;
    // If exact end of last period or out of range, match closest teaching period
    const exactEndMatch = periods.find((p) => simulatedTime === p.end && !p.isRoutine);
    return exactEndMatch || periods.find((p) => !p.isRoutine) || periods[1];
  }, [periods, simulatedTime]);

  // Today's Piket Officers
  const todayPiket = piketSchedules.find((p) => p.day_of_week === simulatedDay) || piketSchedules[0];
  const piketLapanganTeacher = allStaff.find((s) => s.id === todayPiket?.piket_lapangan_teacher_id);
  const piketKantorTeacher = allStaff.find((s) => s.id === todayPiket?.piket_kantor_teacher_id);

  // Staff Attendance Summary
  const staffPresentCount = staffAttendance.filter((s) => s.status === 'Hadir').length;
  const staffLeaveCount = staffAttendance.filter((s) => s.status === 'Izin' || s.status === 'Sakit').length;

  // Find teachers who have FREE period right now and are present today
  // Filter out: Shadow Teacher, Sarpras, Developer, dan TU/Administrator (hanya guru pengajar)
  const busyTeacherIdsInCurrentPeriod = schedules
    .filter((s) => s.day_of_week === simulatedDay && s.period_number === activePeriod.period)
    .map((s) => s.teacher_id);

  const availableFreeTeachers = allStaff.filter((staff) => {
    const isPresent = staffAttendance.some((a) => a.user_id === staff.id && a.status === 'Hadir');
    const isBusyTeaching = busyTeacherIdsInCurrentPeriod.includes(staff.id);
    const isNonTeachingRole = staff.roles.some((r) =>
      ['Shadow Teacher', 'Sarpras', 'Developer', 'Administrator', 'Kepala Sekolah'].includes(r)
    ) || ['TU & Bendahara', 'Shadow Teacher', 'Sarpras', 'Developer', 'Kepala Sekolah'].includes(staff.title || '');
    return isPresent && !isBusyTeaching && !isNonTeachingRole;
  });

  // Calculate panel state for each class (Kelas 1 to 6)
  const getClassPanelState = (cls: SchoolClass): {
    colorState: PanelColorState;
    schedule?: MasterScheduleItem;
    journal?: any;
    isLeaveOrDelayed: boolean;
    teacher?: UserProfile;
    shadowTeacher?: UserProfile;
  } => {
    // 1. Get schedule for this class at current period and day
    const sched = schedules.find(
      (s) => s.class_id === cls.id && s.day_of_week === simulatedDay && s.period_number === activePeriod.period
    ) || schedules.find(
      (s) => s.class_id === cls.id && s.period_number === activePeriod.period
    );

    // 2. Check if a journal has been recorded by teacher (supports multi-JP period_numbers)
    const journal = teachingJournals.find(
      (j) =>
        j.class_id === cls.id &&
        (j.period_number === activePeriod.period || j.period_numbers?.includes(activePeriod.period))
    );

    // 3. Teacher details
    const teacher = allStaff.find((s) => s.id === (journal ? journal.teacher_id : sched?.teacher_id));
    const teacherAttendance = staffAttendance.find((a) => a.user_id === sched?.teacher_id);

    // 4. Shadow teacher details
    const shadowStudent = students.find((st) => st.class_id === cls.id && st.has_special_needs);
    const shadowTeacher = shadowStudent
      ? allStaff.find((s) => s.id === shadowStudent.shadow_teacher_id)
      : undefined;

    // Determine color state:
    // If journal exists -> GREEN
    if (journal) {
      return { colorState: 'GREEN', schedule: sched, journal, isLeaveOrDelayed: false, teacher, shadowTeacher };
    }

    // If teacher is on leave/absent -> RED
    const isLeave = teacherAttendance?.status === 'Izin' || teacherAttendance?.status === 'Sakit';
    if (isSimulatingRedState || isLeave) {
      return { colorState: 'RED', schedule: sched, isLeaveOrDelayed: true, teacher, shadowTeacher };
    }

    // If past end time without journal -> GRAY
    if (simulatedTime > activePeriod.end) {
      return { colorState: 'GRAY', schedule: sched, isLeaveOrDelayed: false, teacher, shadowTeacher };
    }

    // Default -> WHITE (Upcoming / Scheduled)
    return { colorState: 'WHITE', schedule: sched, isLeaveOrDelayed: false, teacher, shadowTeacher };
  };

  const isUserPiketLapanganOrKepsek =
    currentUser.roles.includes('Guru Piket Lapangan') ||
    currentUser.roles.includes('Kepala Sekolah') ||
    currentUser.roles.includes('Developer');

  return (
    <div className="space-y-4 pb-20 lg:pb-24">
      
      {/* HEADER SUMMARY STRIP (Dipindahkan ke Paling Atas) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Card 1: Active Period */}
        <div className="bg-white border-l-4 border-school-navy-700 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{realtimeDateShortFormatted} • Jam Pelajaran</div>
            <div className="text-base font-extrabold text-school-navy-900 leading-tight">
              {activePeriod.label}
            </div>
            <div className="text-[11px] text-slate-500 font-mono font-medium">
              {activePeriod.start} - {activePeriod.end} WIB ({activePeriod.durationJp || 1} JP)
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-school-navy-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Teacher Attendance Live */}
        <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kehadiran Guru & Staf</div>
            <div className="text-base font-extrabold text-slate-900 leading-tight">
              {staffPresentCount} <span className="text-xs font-normal text-slate-500">Hadir di Sekolah</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className="text-rose-600 font-bold">{staffLeaveCount} Izin/Pelatihan</span> • 0 Alpa
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Student Attendance Aggregated (Sinkron Realtime dengan Presensi Guru) */}
        <div className="bg-white border-l-4 border-school-gold-500 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kehadiran Siswa Kelas 1-6</div>
            <div className="text-base font-extrabold text-slate-900 leading-tight">
              {studentAttendanceSummary.present} / {studentAttendanceSummary.total} <span className="text-xs font-semibold text-emerald-600">({studentAttendanceSummary.pct}%)</span>
            </div>
            <div className="text-[11px] text-slate-500">
              <span className={studentAttendanceSummary.sick > 0 ? 'text-amber-600 font-bold' : ''}>{studentAttendanceSummary.sick} Sakit</span> •{' '}
              <span className={studentAttendanceSummary.permitted > 0 ? 'text-blue-600 font-bold' : ''}>{studentAttendanceSummary.permitted} Izin</span> •{' '}
              <span className={studentAttendanceSummary.absent > 0 ? 'text-rose-600 font-bold' : ''}>{studentAttendanceSummary.absent} Alpa</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-school-gold-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Today's Piket Officers */}
        <div className="bg-white border-l-4 border-purple-500 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Petugas Piket Hari Ini</div>
            <div className="text-xs font-bold text-slate-900 truncate">
              🎯 Lapangan: <span className="text-indigo-700">{piketLapanganTeacher?.name.split(',')[0] || 'Ustdz. Fatimah'}</span>
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">
              🏢 Kantor: <span className="text-teal-700">{piketKantorTeacher?.name.split(',')[0] || 'Ustdz. Dedi'}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Simulation & Mode Control Ribbon */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs space-y-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Date, Time Simulator & Tahfidz toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Realtime Date Badge */}
            <div className="flex items-center gap-1.5 font-extrabold text-school-navy-950 bg-gradient-to-r from-school-gold-100 via-amber-100 to-school-gold-200 border border-school-gold-400 px-3 py-1.5 rounded-lg text-xs shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-school-gold-700" />
              <span>{realtimeDateFormatted}</span>
            </div>

            {/* Day Selector (Senin - Jumat) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-school-navy-700" />
              <span className="font-bold text-slate-700 text-xs">Hari:</span>
              <select
                value={simulatedDay}
                onChange={(e) => {
                  setIsAutoRealtime(false);
                  setSimulatedDay(Number(e.target.value));
                }}
                className="font-bold text-school-navy-900 bg-transparent focus:outline-hidden text-xs cursor-pointer"
              >
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
              </select>
            </div>

            {/* Time Picker Simulator */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="time"
                value={simulatedTime}
                onChange={(e) => {
                  setIsAutoRealtime(false);
                  setSimulatedTime(e.target.value);
                }}
                className="font-mono font-bold text-slate-900 bg-transparent focus:outline-hidden"
              />
              <span className="text-slate-500 font-semibold text-[11px]">WIB</span>
            </div>

            {/* Tahfidz Day Toggle */}
            <button
              onClick={() => setIsTahfidzDay(!isTahfidzDay)}
              className={`px-2.5 py-1 rounded-lg border font-semibold text-[11px] transition-all flex items-center gap-1 ${
                isTahfidzDay
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>{isTahfidzDay ? 'Hari Tahfidz (08:30)' : 'Hari Reguler (08:00)'}</span>
            </button>
          </div>
        </div>

        {/* Period Fast Jumper Track - Otomatis Sesuai Realtime, Tanpa Label LOMPAT JP */}
        <div className="flex items-center gap-2 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 rounded-xl bg-slate-100/90 border border-slate-200/80 scrollbar-none flex-1">
            {/* Realtime Mode Toggle Pill */}
            <button
              type="button"
              onClick={() => {
                setIsAutoRealtime(true);
                const now = new Date();
                const hh = String(now.getHours()).padStart(2, '0');
                const mm = String(now.getMinutes()).padStart(2, '0');
                setSimulatedTime(`${hh}:${mm}`);
                const d = now.getDay();
                if (d >= 1 && d <= 5) setSimulatedDay(d);
              }}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer select-none ${
                isAutoRealtime
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
              title={isAutoRealtime ? 'JP otomatis mengikuti waktu nyata saat ini' : 'Klik untuk kembali mengikuti jam realtime'}
            >
              <span className={`w-2 h-2 rounded-full ${isAutoRealtime ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              <span>{isAutoRealtime ? 'Realtime Aktif' : 'Ikuti Waktu Real'}</span>
            </button>

            {periods
              .filter((p) => !p.isRoutine)
              .map((p) => {
                const isActive = activePeriod.period === p.period;
                return (
                  <button
                    key={p.period}
                    type="button"
                    onClick={() => {
                      setIsAutoRealtime(false);
                      setSimulatedTime(p.start);
                    }}
                    className={`shrink-0 min-w-[56px] py-1 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                      isActive
                        ? 'bg-school-navy-900 text-school-gold-300 shadow-md ring-2 ring-school-gold-400 scale-105'
                        : 'bg-white text-slate-700 hover:text-school-navy-950 hover:bg-slate-50 border border-slate-200/80 shadow-2xs hover:scale-102 active:scale-95'
                    }`}
                    title={`${p.label} (${p.start} - ${p.end} WIB)`}
                  >
                    <span>JP {p.period}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-school-gold-400 animate-pulse"></span>}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* 6-CLASS MONITORING GRID (KELAS 1 - 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls) => {
          const state = getClassPanelState(cls);
          const colorState = state.colorState;

          // Panel Color styling classes based on 4-State logic
          const colorStyles: Record<PanelColorState, {
            bg: string;
            border: string;
            badgeBg: string;
            badgeText: string;
            statusText: string;
            pulse?: boolean;
          }> = {
            WHITE: {
              bg: 'bg-white',
              border: 'border-slate-300',
              badgeBg: 'bg-slate-100 text-slate-600 border-slate-300',
              badgeText: 'Terjadwal / Menunggu',
              statusText: 'Belum Dimulai',
            },
            GREEN: {
              bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/20',
              border: 'border-emerald-400',
              badgeBg: 'bg-white/20 text-white border-white/30 backdrop-blur-sm',
              badgeText: state.journal?.is_substitute ? 'Guru Pengganti Aktif' : 'Aktif Mengajar',
              statusText: 'Guru Sudah di Kelas',
            },
            RED: {
              bg: 'bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-rose-600/30',
              border: 'border-rose-400',
              badgeBg: 'bg-white/25 text-white border-white/40 backdrop-blur-sm font-black',
              badgeText: 'KOSONG / TERLAMBAT >15 MNT',
              statusText: 'Perlu Guru Pengganti Segera!',
              pulse: true,
            },
            GRAY: {
              bg: 'bg-slate-100 hover:bg-slate-200/70 text-slate-800 shadow-slate-200/50',
              border: 'border-slate-300',
              badgeBg: 'bg-slate-200 text-slate-700 border-slate-300 font-bold',
              badgeText: 'Selesai',
              statusText: 'Jam Selesai',
            },
          };

          const curStyle = colorStyles[colorState];
          const isLight = colorState === 'WHITE' || colorState === 'GRAY';

          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClassModal(cls)}
              className={`rounded-2xl p-4 border-2 transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden ${
                curStyle.bg
              } ${curStyle.border} ${curStyle.pulse ? 'animate-pulse' : ''}`}
            >
              {/* Header inside card: Class Name, Room & State Badge in a single clean row */}
              <div className={`flex items-center justify-between gap-2 mb-2.5 pb-2 border-b ${
                isLight ? 'border-slate-200' : 'border-white/10'
              }`}>
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className={`text-base font-black tracking-wide shrink-0 ${
                    colorState === 'WHITE'
                      ? 'text-school-navy-950'
                      : colorState === 'GRAY'
                      ? 'text-slate-900'
                      : 'text-white'
                  }`}>
                    {cls.name}
                  </span>
                  <span className={`text-[11px] font-semibold truncate ${
                    colorState === 'WHITE'
                      ? 'text-slate-500'
                      : colorState === 'GRAY'
                      ? 'text-slate-600 font-medium'
                      : 'text-white/80'
                  }`}>
                    ({cls.room_name} • {students.filter(s => s.class_id === cls.id).length || cls.student_count} Siswa)
                  </span>
                </div>

                <div className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border whitespace-nowrap shrink-0 ${curStyle.badgeBg}`}>
                  {curStyle.badgeText}
                </div>
              </div>

              {/* Subject & Teacher Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${
                    colorState === 'WHITE'
                      ? 'text-school-navy-700'
                      : colorState === 'GRAY'
                      ? 'text-slate-700'
                      : 'text-white'
                  }`} />
                  <span className={`text-xs font-bold truncate ${
                    colorState === 'WHITE'
                      ? 'text-slate-900'
                      : colorState === 'GRAY'
                      ? 'text-slate-900'
                      : 'text-white'
                  }`}>
                    {state.journal?.subject_name || state.schedule?.subject_name || 'Tematik Terpadu'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className={`w-4 h-4 ${
                    colorState === 'WHITE'
                      ? 'text-slate-400'
                      : colorState === 'GRAY'
                      ? 'text-slate-600'
                      : 'text-white/80'
                  }`} />
                  <span className={`text-xs truncate ${
                    colorState === 'WHITE'
                      ? 'text-slate-700 font-medium'
                      : colorState === 'GRAY'
                      ? 'text-slate-800 font-semibold'
                      : 'text-white/90'
                  }`}>
                    {state.teacher ? state.teacher.name : 'Belum Ditugaskan'}
                    {state.journal?.is_substitute && (
                      <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] px-1 py-0.2 rounded font-black">
                        PENGGANTI
                      </span>
                    )}
                  </span>
                </div>

                {/* Show Live Topic Uploaded by Teacher if Active */}
                {state.journal && (
                  <div className={`text-[11px] font-medium px-2.5 py-1 rounded-lg truncate flex items-center gap-1.5 border ${
                    colorState === 'GRAY'
                      ? 'bg-white text-slate-800 border-slate-300 shadow-xs'
                      : colorState === 'WHITE'
                      ? 'bg-slate-50 text-slate-800 border-slate-200 shadow-xs'
                      : 'text-white/95 bg-black/15 border-white/20'
                  }`}>
                    <span className={`text-[10px] shrink-0 ${isLight ? 'text-slate-500 font-bold' : 'opacity-80'}`}>📖 Topik:</span>
                    <span className="font-bold truncate">{state.journal.topic}</span>
                  </div>
                )}

                {/* Shadow Teacher Badge if assigned to this class */}
                {state.shadowTeacher && (
                  <div className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${
                    isLight
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-white/15 text-white border-white/20'
                  }`}>
                    <HeartHandshake className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-300'}`} />
                    <span className="font-semibold">GPK:</span>
                    <span className="truncate">{state.shadowTeacher.name.split(',')[0]} (Ahmad Fauzi)</span>
                  </div>
                )}
              </div>

              {/* Action Prompt / Footer */}
              <div className={`pt-2.5 border-t flex items-center justify-between text-[11px] ${
                colorState === 'WHITE'
                  ? 'border-slate-100 text-slate-500'
                  : colorState === 'GRAY'
                  ? 'border-slate-200 text-slate-600 font-medium'
                  : 'border-white/20 text-white/90'
              }`}>
                <span>{curStyle.statusText}</span>

                {colorState === 'RED' ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Claim or assign substitute
                      const freeOne = availableFreeTeachers[0];
                      if (freeOne) {
                        assignSubstituteTeacher(cls.id, state.schedule?.id || '', freeOne.id);
                      }
                    }}
                    className="bg-white text-rose-700 font-black px-2.5 py-1 rounded-md text-[10px] hover:bg-rose-50 shadow-sm transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    Ambil Alih Kelas
                  </button>
                ) : (
                  <span className={`font-semibold flex items-center gap-1 hover:underline ${
                    colorState === 'WHITE'
                      ? 'text-school-navy-700 hover:text-school-navy-950'
                      : colorState === 'GRAY'
                      ? 'text-slate-700 hover:text-slate-950'
                      : 'text-white'
                  }`}>
                    Detail Modal <ArrowRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RICH INTERACTIVE DETAIL MODAL (Pop-up upon clicking Green/Red panel) */}
      {selectedClassModal && (() => {
        const state = getClassPanelState(selectedClassModal);
        const modalStudentList = students
          .filter((s) => s.class_id === selectedClassModal.id)
          .sort((a, b) => a.name.localeCompare(b.name, 'id'));
        const isGreen = state.colorState === 'GREEN';
        const isRed = state.colorState === 'RED';

        const getStudentAttendanceStatus = (studentId: string): 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral' => {
          const directKey = `${selectedClassModal.id}_${activeAttendanceDate}_${studentId}`;
          if (dailyAttendanceMap[directKey]) return dailyAttendanceMap[directKey];
          const allKeys = Object.keys(dailyAttendanceMap);
          const matched = allKeys.find((k) => k.endsWith(`_${studentId}`));
          if (matched && dailyAttendanceMap[matched]) return dailyAttendanceMap[matched];
          return 'Hadir';
        };

        const modalHadirCount = modalStudentList.filter((s) => getStudentAttendanceStatus(s.id) === 'Hadir').length;
        const modalSakitCount = modalStudentList.filter((s) => getStudentAttendanceStatus(s.id) === 'Sakit').length;
        const modalIzinCount = modalStudentList.filter((s) => getStudentAttendanceStatus(s.id) === 'Izin').length;
        const modalAlpaCount = modalStudentList.filter((s) => getStudentAttendanceStatus(s.id) === 'Alpa').length;
        const modalNetralCount = modalStudentList.filter((s) => getStudentAttendanceStatus(s.id) === 'Netral').length;

        const relevantShadowJournal = shadowJournals.find(
          (sh) => sh.class_id === selectedClassModal.id
        );

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className={`px-6 py-4 flex items-center justify-between text-white ${
                isGreen
                  ? 'bg-emerald-600'
                  : isRed
                  ? 'bg-rose-600'
                  : 'bg-school-navy-900'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black">{selectedClassModal.name}</h3>
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {state.colorState}
                    </span>
                  </div>
                  <p className="text-xs text-white/80">
                    {selectedClassModal.room_name} • Jam Pelajaran {activePeriod.period} ({activePeriod.start} - {activePeriod.end} WIB)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClassModal(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-bold text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800 text-xs">
                
                {/* Teacher & Subject Info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Guru yang Mengajar:</span>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <img
                        src={state.teacher?.avatar_url}
                        alt="Foto Guru"
                        className="w-5 h-5 rounded-full object-cover border border-slate-300"
                      />
                      <span>{state.teacher ? state.teacher.name : 'Belum Ada'}</span>
                    </div>
                    {state.journal?.is_substitute && (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded mt-1 inline-block">
                        Guru Pengganti Ditugaskan
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Mata Pelajaran & Durasi:</span>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {state.schedule?.subject_name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      Durasi: {state.schedule?.duration_jp || 1} JP ({ (state.schedule?.duration_jp || 1) * 35 } Menit)
                    </div>
                  </div>
                </div>

                {/* Teaching Journal & Material Content (if Green) */}
                {isGreen && state.journal && (
                  <div className="space-y-2 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <FileText className="w-4 h-4" />
                        <span>Materi yang Diberikan (Jurnal Mengajar Terisi):</span>
                      </div>
                      {state.journal.rpp_title && (
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          RPP: {state.journal.rpp_title}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {state.journal.topic}
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {state.journal.learning_activity}
                    </p>
                    {state.journal.notes && (
                      <div className="text-[11px] text-slate-500 italic pt-1 border-t border-emerald-200/60">
                        Catatan Guru: "{state.journal.notes}"
                      </div>
                    )}
                  </div>
                )}

                {/* Shadow Teacher Accompaniment Journal Summary */}
                {state.shadowTeacher && (
                  <div className="space-y-2 bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
                    <div className="flex items-center justify-between text-rose-800">
                      <div className="flex items-center gap-2 font-bold">
                        <HeartHandshake className="w-4 h-4" />
                        <span>Catatan Shadow Teacher (Guru Pendamping Khusus):</span>
                      </div>
                      <span className="text-[10px] bg-rose-200/60 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                        {state.shadowTeacher.name.split(',')[0]}
                      </span>
                    </div>
                    {relevantShadowJournal ? (
                      <>
                        <div className="text-xs text-slate-700 leading-relaxed">
                          <strong>Siswa Didampingi:</strong>{' '}
                          {students.find((s) => s.id === relevantShadowJournal.student_id)?.name || 'Siswa ABK'}{' '}
                          (Fokus: {relevantShadowJournal.focus_rating}/5, Emosi: {relevantShadowJournal.emotion_rating}/5, Perilaku: {relevantShadowJournal.behavior_rating}/5)
                        </div>
                        <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-rose-100">
                          "{relevantShadowJournal.material_adaptation || relevantShadowJournal.behavior_notes || 'Siswa didampingi dalam modul pembelajaran reguler.'}"
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-slate-700 leading-relaxed">
                          <strong>Siswa Didampingi:</strong> {modalStudentList.find((s) => s.has_special_needs)?.name || 'Siswa Inklusi'}
                        </div>
                        <p className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-rose-100 italic">
                          Belum ada entri catatan jurnal pendampingan khusus yang diunggah untuk sesi kelas ini.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Student Attendance Breakdown Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-school-navy-700" />
                      Presensi Siswa di Kelas Ini ({modalStudentList.length} Siswa Terdaftar):
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="text-emerald-700">Hadir: {modalHadirCount}</span>
                      <span className={modalSakitCount > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>Sakit: {modalSakitCount}</span>
                      <span className={modalIzinCount > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}>Izin: {modalIzinCount}</span>
                      {modalAlpaCount > 0 && <span className="text-rose-600 font-bold">Alpa: {modalAlpaCount}</span>}
                      {modalNetralCount > 0 && <span className="text-slate-500">Belum: {modalNetralCount}</span>}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 w-10">No</th>
                          <th className="px-3 py-1.5">Nama Siswa</th>
                          <th className="px-3 py-1.5">NIS</th>
                          <th className="px-3 py-1.5 text-center">Status Presensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalStudentList.map((st, i) => {
                          const status = getStudentAttendanceStatus(st.id);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50">
                              <td className="px-3 py-1.5 font-medium text-slate-400">{i + 1}</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-900">
                                {st.name}
                                {st.has_special_needs && (
                                  <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                    ABK / GPK
                                  </span>
                                )}
                                {st.notes && (
                                  <span className="ml-1.5 text-[9px] bg-slate-100 text-slate-500 italic px-1 rounded">
                                    ({st.notes})
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">{st.nis}</td>
                              <td className="px-3 py-1.5 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  status === 'Hadir'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'Sakit'
                                    ? 'bg-amber-100 text-amber-800'
                                    : status === 'Izin'
                                    ? 'bg-blue-100 text-blue-800'
                                    : status === 'Alpa'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* If RED: Substitute assignment section inside modal */}
                {isRed && (
                  <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Tindakan Penggantian Guru:</span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Guru Piket Lapangan atau Kepala Sekolah dapat menugaskan guru pengganti dari daftar guru yang sedang free jam ini:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableFreeTeachers.map((free) => (
                        <button
                          key={free.id}
                          onClick={() => {
                            assignSubstituteTeacher(selectedClassModal.id, state.schedule?.id || '', free.id);
                            setSelectedClassModal(null);
                          }}
                          className="bg-school-navy-900 hover:bg-school-navy-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-school-gold-400" />
                          <span>Tugaskan {free.name.split(',')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
                <button
                  onClick={() => setSelectedClassModal(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
