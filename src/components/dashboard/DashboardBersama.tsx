import React, { useState, useMemo } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Maximize2,
  Minimize2,
  UserCheck,
  UserX,
  BookOpen,
  HeartHandshake,
  ArrowRight,
  ShieldAlert,
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
  } = useApp();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedClassModal, setSelectedClassModal] = useState<SchoolClass | null>(null);
  const [isTahfidzDay, setIsTahfidzDay] = useState(false); // Normal Day vs Tahfidz Day

  // Time periods definition (1 JP = 35 mins)
  // Normal Day: 07:30 - 08:00 Dhuha
  // Tahfidz Day: 07:30 - 08:30 Dhuha + Tahfidz
  const periods = useMemo(() => {
    if (isTahfidzDay) {
      return [
        { period: 0, label: 'Dhuha & Tahfidz Pagi', start: '07:30', end: '08:30', isRoutine: true },
        { period: 1, label: 'Jam Ke-1', start: '08:30', end: '09:05', durationJp: 1 },
        { period: 2, label: 'Jam Ke-2', start: '09:05', end: '09:40', durationJp: 1 },
        { period: 3, label: 'Istirahat Pagi', start: '09:40', end: '10:00', isRoutine: true },
        { period: 4, label: 'Jam Ke-3', start: '10:00', end: '10:35', durationJp: 1 },
        { period: 5, label: 'Jam Ke-4', start: '10:35', end: '11:10', durationJp: 1 },
      ];
    }
    return [
      { period: 0, label: 'Pembiasaan Sholat Dhuha', start: '07:30', end: '08:00', isRoutine: true },
      { period: 1, label: 'Jam Ke-1', start: '08:00', end: '08:35', durationJp: 1 },
      { period: 2, label: 'Jam Ke-2', start: '08:35', end: '09:10', durationJp: 1 },
      { period: 3, label: 'Istirahat Pagi', start: '09:10', end: '09:25', isRoutine: true },
      { period: 4, label: 'Jam Ke-3', start: '09:25', end: '10:00', durationJp: 1 },
      { period: 5, label: 'Jam Ke-4', start: '10:00', end: '10:35', durationJp: 1 },
    ];
  }, [isTahfidzDay]);

  // Find active period based on simulatedTime
  const activePeriod = useMemo(() => {
    const cur = periods.find((p) => simulatedTime >= p.start && simulatedTime <= p.end);
    return cur || periods[2]; // Default to Period 2
  }, [periods, simulatedTime]);

  // Today's Piket Officers
  const todayPiket = piketSchedules.find((p) => p.day_of_week === simulatedDay) || piketSchedules[0];
  const piketLapanganTeacher = allStaff.find((s) => s.id === todayPiket?.piket_lapangan_teacher_id);
  const piketKantorTeacher = allStaff.find((s) => s.id === todayPiket?.piket_kantor_teacher_id);

  // Staff Attendance Summary
  const staffPresentCount = staffAttendance.filter((s) => s.status === 'Hadir').length;
  const staffLeaveCount = staffAttendance.filter((s) => s.status === 'Izin' || s.status === 'Sakit').length;

  // Student Attendance Total
  const totalStudentsCount = students.length;
  const totalStudentsPresent = 104; // Demo aggregate

  // Find teachers who have FREE period right now and are present today
  const busyTeacherIdsInCurrentPeriod = schedules
    .filter((s) => (s.day_of_week === simulatedDay || s.day_of_week === 1) && s.period_number === activePeriod.period)
    .map((s) => s.teacher_id);

  const availableFreeTeachers = allStaff.filter((staff) => {
    const isPresent = staffAttendance.some((a) => a.user_id === staff.id && a.status === 'Hadir');
    const isBusyTeaching = busyTeacherIdsInCurrentPeriod.includes(staff.id);
    const isKepsekOrAdmin = staff.roles.includes('Kepala Sekolah') || staff.roles.includes('Administrator');
    return isPresent && !isBusyTeaching && !isKepsekOrAdmin;
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
    // 1. Get schedule for this class at current period
    const sched = schedules.find(
      (s) => s.class_id === cls.id && s.day_of_week === simulatedDay && s.period_number === activePeriod.period
    ) || schedules.find(
      (s) => s.class_id === cls.id && s.period_number === activePeriod.period
    );

    // 2. Check if a journal has been recorded
    const journal = teachingJournals.find(
      (j) => j.class_id === cls.id && j.period_number === activePeriod.period
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

    // If simulated red state is on, or teacher is on leave/absent -> RED
    const isLeave = teacherAttendance?.status === 'Izin' || teacherAttendance?.status === 'Sakit';
    if (isSimulatingRedState || isLeave || (cls.id === 'c4' && simulatedTime > '08:45')) {
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
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#F8FAFC] p-6 overflow-y-auto' : ''}`}>
      
      {/* Simulation & Mode Control Ribbon */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Realtime Date Badge: Selasa, 10 November 2026 */}
          <div className="flex items-center gap-1.5 font-extrabold text-school-navy-950 bg-gradient-to-r from-school-gold-100 via-amber-100 to-school-gold-200 border border-school-gold-400 px-3 py-1.5 rounded-lg text-xs shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-school-gold-700" />
            <span>Selasa, 10 November 2026</span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-school-navy-900 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-300">
            <Play className="w-3.5 h-3.5 text-school-gold-600 animate-spin" />
            <span>Simulasi Jam:</span>
          </div>

          {/* Time Picker Simulator */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="time"
              value={simulatedTime}
              onChange={(e) => setSimulatedTime(e.target.value)}
              className="font-mono font-bold text-slate-900 bg-transparent focus:outline-hidden"
            />
            <span className="text-slate-500 font-semibold text-[11px]">WIB</span>
          </div>

          {/* Period Fast Jumper */}
          <div className="hidden sm:flex items-center gap-1">
            {periods.slice(1, 5).map((p) => (
              <button
                key={p.period}
                onClick={() => setSimulatedTime(p.start)}
                className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all ${
                  activePeriod.period === p.period
                    ? 'bg-school-navy-900 text-white border-school-navy-900 font-bold'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                JP {p.period}
              </button>
            ))}
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

        {/* Right side simulation triggers: Force Red State & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulatingRedState(!isSimulatingRedState)}
            className={`px-3 py-1 rounded-lg border font-bold text-[11px] transition-all flex items-center gap-1.5 ${
              isSimulatingRedState
                ? 'bg-rose-600 text-white border-rose-700 shadow-sm animate-pulse'
                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
            }`}
            title="Klik untuk menguji skenario kelas kosong (>15 menit atau guru izin) dan mengaktifkan rekomendasi guru pengganti"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{isSimulatingRedState ? 'Simulasi Merah: AKTIF' : 'Simulasikan Kelas Merah (Kosong)'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Monitor TV / Layar Penuh'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* HEADER SUMMARY STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Card 1: Active Period */}
        <div className="bg-white border-l-4 border-school-navy-700 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Selasa, 10 Nov 2026 • Jam Pelajaran</div>
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

        {/* Card 3: Student Attendance Aggregated */}
        <div className="bg-white border-l-4 border-school-gold-500 rounded-xl p-3 shadow-xs border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Kehadiran Siswa Kelas 1-6</div>
            <div className="text-base font-extrabold text-slate-900 leading-tight">
              {totalStudentsPresent} / {totalStudentsCount} <span className="text-xs font-semibold text-emerald-600">(96.3%)</span>
            </div>
            <div className="text-[11px] text-slate-500">
              3 Sakit • 1 Izin • 0 Alpa
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

      {/* RECOMMENDED SUBSTITUTE TEACHERS GOLD PANEL (Visible when any class is RED) */}
      {(isSimulatingRedState || staffLeaveCount > 0) && (
        <div className="bg-gradient-to-r from-amber-500 via-school-gold-500 to-amber-600 rounded-xl p-4 text-white shadow-lg border border-amber-300 animate-subtle-glow">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-white/20 backdrop-blur-sm shrink-0">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm uppercase tracking-wider bg-white text-school-navy-950 px-2 py-0.5 rounded text-[10px]">
                    Sistem Rekomendasi Guru Pengganti Otomatis
                  </span>
                  <span className="text-xs font-semibold text-amber-100">
                    Terdeteksi Jam Kosong / Guru Izin pada Jam Ke-2
                  </span>
                </div>
                <p className="text-xs text-white/95 mt-1 leading-relaxed">
                  Guru berikut terkonfirmasi <strong>hadir di sekolah</strong> dan <strong>tidak memiliki jadwal mengajar</strong> pada slot jam ini:
                </p>
              </div>
            </div>

            {/* List of Illuminated Free Teachers */}
            <div className="flex flex-wrap items-center gap-2">
              {availableFreeTeachers.slice(0, 4).map((freeTeacher) => (
                <div
                  key={freeTeacher.id}
                  className="bg-white text-school-navy-950 px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm border border-amber-200"
                >
                  <img
                    src={freeTeacher.avatar_url}
                    alt={freeTeacher.name}
                    className="w-5 h-5 rounded-full object-cover border border-school-gold-500"
                  />
                  <span>{freeTeacher.name.split(',')[0]}</span>
                  {freeTeacher.specialty && (
                    <span className="text-[10px] text-slate-500 font-normal">({freeTeacher.specialty})</span>
                  )}
                  {isUserPiketLapanganOrKepsek && (
                    <button
                      onClick={() => assignSubstituteTeacher('c4', 'sch-4-2', freeTeacher.id)}
                      className="ml-1 bg-school-navy-900 hover:bg-school-navy-700 text-white text-[10px] px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1"
                      title={`Tugaskan ${freeTeacher.name} ke kelas kosong`}
                    >
                      <UserPlus className="w-3 h-3" />
                      Tugaskan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              bg: 'bg-slate-100 text-slate-600',
              border: 'border-slate-300',
              badgeBg: 'bg-slate-200 text-slate-600 border-slate-300',
              badgeText: 'Selesai',
              statusText: 'Jam Selesai',
            },
          };

          const curStyle = colorStyles[colorState];

          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClassModal(cls)}
              className={`rounded-2xl p-4 border-2 transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5 relative overflow-hidden ${
                curStyle.bg
              } ${curStyle.border} ${curStyle.pulse ? 'animate-pulse' : ''}`}
            >
              {/* Header inside card: Class Name & State Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <div className={`text-base font-black tracking-wide ${colorState === 'WHITE' ? 'text-school-navy-950' : 'text-white'}`}>
                    {cls.name}
                  </div>
                  <div className={`text-[11px] font-medium ${colorState === 'WHITE' ? 'text-slate-500' : 'text-white/80'}`}>
                    {cls.room_name} • {cls.student_count} Siswa
                  </div>
                </div>

                <div className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${curStyle.badgeBg}`}>
                  {curStyle.badgeText}
                </div>
              </div>

              {/* Subject & Teacher Info */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className={`w-4 h-4 ${colorState === 'WHITE' ? 'text-school-navy-700' : 'text-white'}`} />
                  <span className={`text-xs font-bold truncate ${colorState === 'WHITE' ? 'text-slate-900' : 'text-white'}`}>
                    {state.schedule?.subject_name || 'Tematik Terpadu'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className={`w-4 h-4 ${colorState === 'WHITE' ? 'text-slate-400' : 'text-white/80'}`} />
                  <span className={`text-xs truncate ${colorState === 'WHITE' ? 'text-slate-700 font-medium' : 'text-white/90'}`}>
                    {state.teacher ? state.teacher.name : 'Belum Ditugaskan'}
                    {state.journal?.is_substitute && (
                      <span className="ml-1 bg-amber-400 text-slate-950 text-[9px] px-1 py-0.2 rounded font-black">
                        PENGGANTI
                      </span>
                    )}
                  </span>
                </div>

                {/* Shadow Teacher Badge if assigned to this class */}
                {state.shadowTeacher && (
                  <div className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg border ${
                    colorState === 'WHITE'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-white/15 text-white border-white/20'
                  }`}>
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-300" />
                    <span className="font-semibold">GPK:</span>
                    <span className="truncate">{state.shadowTeacher.name.split(',')[0]} (Ahmad Fauzi)</span>
                  </div>
                )}
              </div>

              {/* Action Prompt / Footer */}
              <div className={`pt-2.5 border-t flex items-center justify-between text-[11px] ${
                colorState === 'WHITE'
                  ? 'border-slate-100 text-slate-400'
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
                  <span className="font-semibold flex items-center gap-1 hover:underline">
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
        const modalStudentList = students.filter((s) => s.class_id === selectedClassModal.id);
        const isGreen = state.colorState === 'GREEN';
        const isRed = state.colorState === 'RED';

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
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <FileText className="w-4 h-4" />
                      <span>Materi yang Diberikan (Jurnal Mengajar Terisi):</span>
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
                    <div className="text-xs text-slate-700 leading-relaxed">
                      <strong>Siswa Didampingi:</strong> Ahmad Fauzi (Fokus: 4/5, Emosi: Ceria & Terkendali).
                    </div>
                    <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-rose-100">
                      "Ahmad menyelesaikan latihan penjumlahan dengan bantuan blok benda konkret. Fokus terjaga stabil selama sesi pelajaran."
                    </p>
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
                      <span className="text-emerald-700">Hadir: {modalStudentList.length - 1}</span>
                      <span className="text-amber-600">Sakit: 1</span>
                      <span className="text-slate-400">Izin: 0</span>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-1.5 w-10">No</th>
                          <th className="px-3 py-1.5">Nama Siswa</th>
                          <th className="px-3 py-1.5">NIS</th>
                          <th className="px-3 py-1.5 text-center">Status Presensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {modalStudentList.slice(0, 5).map((st, i) => (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="px-3 py-1.5 font-medium text-slate-400">{i + 1}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-900">
                              {st.name}
                              {st.has_special_needs && (
                                <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">
                                  ABK / GPK
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-1.5 text-slate-500 font-mono text-[11px]">{st.nis}</td>
                            <td className="px-3 py-1.5 text-center">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Hadir
                              </span>
                            </td>
                          </tr>
                        ))}
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
