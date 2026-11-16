import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  FileCheck,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Building,
  Calendar,
  Plus,
  Eye,
  BookOpen,
  MapPin,
  Trash2,
  Check,
  BarChart2,
  CheckCheck,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/db';
import { UserProfile, PrincipalAgendaItem, TeachingJournal } from '../../types';

export const KepsekModule: React.FC = () => {
  const {
    currentUser,
    allStaff,
    classes,
    students,
    staffAttendance,
    sarprasTickets,
    approveSarprasTicket,
    rejectSarprasTicket,
    teachingJournals,
    principalAgendas,
    simulatedTime,
    simulatedDay,
  } = useApp();

  // Navigation Tabs for Kepala Sekolah Module
  const [activeTab, setActiveTab] = useState<'agenda' | 'absensi' | 'jurnal' | 'persetujuan'>('agenda');

  // Sub-tabs filters
  const [agendaFilter, setAgendaFilter] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');
  const [attendanceFilter, setAttendanceFilter] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [journalFilter, setJournalFilter] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  // Modal State: Add Agenda
  const [isAddAgendaModalOpen, setIsAddAgendaModalOpen] = useState(false);
  const [agendaTitle, setAgendaTitle] = useState('');
  const [agendaType, setAgendaType] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Harian');
  const [agendaDate, setAgendaDate] = useState('2026-11-10');
  const [agendaTimeStart, setAgendaTimeStart] = useState('08:00');
  const [agendaTimeEnd, setAgendaTimeEnd] = useState('09:30');
  const [agendaLocation, setAgendaLocation] = useState('Ruang Kepala Sekolah');
  const [agendaDescription, setAgendaDescription] = useState('');
  const [agendaPriority, setAgendaPriority] = useState<'Penting & Mendesak' | 'Prioritas Tinggi' | 'Rutin'>('Prioritas Tinggi');
  const [agendaStatus, setAgendaStatus] = useState<'Terjadwal' | 'Sedang Berjalan' | 'Selesai'>('Terjadwal');

  // Modal State: View Teacher Teaching Journal Detail
  const [selectedTeacherForJournal, setSelectedTeacherForJournal] = useState<UserProfile | null>(null);
  const [supervisoryFeedback, setSupervisoryFeedback] = useState('');
  const [isFeedbackSaved, setIsFeedbackSaved] = useState(false);

  // Search filter for teacher lists
  const [searchQuery, setSearchQuery] = useState('');

  // Pending Tickets awaiting Kepsek Approval
  const pendingSarprasTickets = sarprasTickets.filter(
    (t) => t.status === 'Menunggu Persetujuan Kepsek' || t.status === 'Dilaporkan'
  );

  // Staff on leave
  const staffOnLeave = staffAttendance.filter((s) => s.status === 'Izin' || s.status === 'Sakit');

  // Filtered Agendas
  const filteredAgendas = principalAgendas.filter((a) => a.type === agendaFilter);

  // Handle Save New Agenda Item
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaTitle.trim()) {
      alert('Silakan masukkan judul agenda.');
      return;
    }

    const newAgenda: PrincipalAgendaItem = {
      id: `pa-${Date.now()}`,
      type: agendaType,
      title: agendaTitle,
      date: agendaDate,
      time_start: agendaTimeStart,
      time_end: agendaTimeEnd,
      location: agendaLocation,
      description: agendaDescription,
      priority: agendaPriority,
      status: agendaStatus,
    };

    await db.principal_agenda.put(newAgenda);
    setIsAddAgendaModalOpen(false);
    setAgendaTitle('');
    setAgendaDescription('');
    alert('✅ Agenda Kepala Sekolah berhasil ditambahkan!');
  };

  // Toggle Agenda Status
  const handleUpdateAgendaStatus = async (id: string, newStatus: 'Terjadwal' | 'Sedang Berjalan' | 'Selesai') => {
    await db.principal_agenda.update(id, { status: newStatus });
  };

  // Delete Agenda Item
  const handleDeleteAgenda = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
      await db.principal_agenda.delete(id);
    }
  };

  // Save Supervisory Feedback for Teacher
  const handleSaveSupervisoryFeedback = (teacherName: string) => {
    if (!supervisoryFeedback.trim()) return;
    setIsFeedbackSaved(true);
    setTimeout(() => {
      setIsFeedbackSaved(false);
      setSupervisoryFeedback('');
      alert(`✅ Catatan supervisi untuk ${teacherName} berhasil disimpan ke buku pembinaan guru.`);
    }, 1500);
  };

  // Map teachers with attendance and journals
  const teacherPerformanceList = allStaff
    .filter((s) => {
      if (searchQuery.trim()) {
        return (
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.title && s.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (s.specialty && s.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    })
    .map((teacher) => {
      const att = staffAttendance.find((a) => a.user_id === teacher.id);
      const journals = teachingJournals.filter((j) => j.teacher_id === teacher.id);
      const todayJournals = journals.filter((j) => j.date === '2026-11-10');
      const assignedClass = classes.find((c) => c.id === teacher.assigned_class_id);

      // Teaching staff check
      const isTeacher = teacher.roles.some((r) =>
        ['Guru Kelas', 'Guru Mapel', 'Shadow Teacher'].includes(r)
      );

      return {
        teacher,
        attendance: att,
        journals,
        todayJournals,
        assignedClass,
        isTeacher,
      };
    });

  return (
    <div className="space-y-4">
      {/* Executive Welcome Banner */}
      <div className="bg-gradient-to-r from-school-navy-950 via-school-navy-900 to-school-navy-800 rounded-2xl p-5 text-white shadow-md border-b-2 border-school-gold-500 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
              Executive Dashboard
            </span>
            <span className="text-school-gold-400 text-xs font-semibold">Dr. H. Salman Farisi, M.Pd.</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1">Pusat Kendali & Agenda Kepala Sekolah</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            SD Khoirur Rooziqiin Bandung — Pemantauan presensi staf, evaluasi jurnal mengajar, dan disposisi anggaran terpadu.
          </p>
        </div>

        {/* Pending Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/15 text-center shrink-0">
            <div className="text-2xl font-black text-school-gold-400 leading-none">
              {pendingSarprasTickets.length + staffOnLeave.length}
            </div>
            <div className="text-[10px] text-slate-300 mt-1 uppercase tracking-wide font-bold">
              Menunggu Tinjauan
            </div>
          </div>
          <div className="bg-emerald-500/20 backdrop-blur-sm p-3 rounded-xl border border-emerald-400/30 text-center shrink-0">
            <div className="text-2xl font-black text-emerald-300 leading-none">
              {principalAgendas.filter((a) => a.type === 'Harian').length}
            </div>
            <div className="text-[10px] text-emerald-200 mt-1 uppercase tracking-wide font-bold">
              Agenda Hari Ini
            </div>
          </div>
        </div>
      </div>

      {/* KPI & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tingkat Kehadiran Guru</span>
          <div className="text-xl font-black text-slate-900">
            {allStaff.length > 0
              ? Math.round(((allStaff.length - staffOnLeave.length) / allStaff.length) * 100)
              : 100}
            %
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {allStaff.length - staffOnLeave.length} dari {allStaff.length} Staf Hadir Bertugas
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Siswa Terdaftar</span>
          <div className="text-xl font-black text-slate-900">{students.length} Siswa</div>
          <div className="text-[11px] text-slate-500">Kelas 1 - 6 (Tahun Ajaran 2026/2027)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Siswa Inklusif (GPK)</span>
          <div className="text-xl font-black text-rose-700">
            {students.filter((s) => s.has_special_needs).length} Siswa
          </div>
          <div className="text-[11px] text-slate-500">Didampingi Guru Khusus & Rapor Adaptif</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Tiket Sarpras Aktif</span>
          <div className="text-xl font-black text-amber-600">{sarprasTickets.length} Tiket</div>
          <div className="text-[11px] text-slate-500">{pendingSarprasTickets.length} Menunggu Persetujuan</div>
        </div>
      </div>

      {/* Main Module Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-xs flex flex-wrap items-center gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'agenda'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-school-gold-400" />
          <span>Agenda Kepala Sekolah</span>
          <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
            {principalAgendas.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('absensi')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'absensi'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-emerald-400" />
          <span>Matriks Presensi Guru & Staf</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            Harian / Pekan / Bulan
          </span>
        </button>

        <button
          onClick={() => setActiveTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'jurnal'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span>Laporan Jurnal & Kinerja Guru</span>
          <span className="bg-sky-100 text-sky-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            Klik Rincian
          </span>
        </button>

        <button
          onClick={() => setActiveTab('persetujuan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'persetujuan'
              ? 'bg-school-navy-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-400" />
          <span>Pusat Kendali Persetujuan & Disposisi</span>
          {pendingSarprasTickets.length > 0 && (
            <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {pendingSarprasTickets.length} Tiket
            </span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AGENDA KEPALA SEKOLAH (HARIAN, MINGGUAN, BULANAN)  */}
      {/* ========================================================= */}
      {activeTab === 'agenda' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-school-gold-600" />
                Kolom Agenda Eksekutif Kepala Sekolah
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan dan pemantauan agenda harian, program mingguan, serta rencana kerja bulanan SD Khoirur Rooziqiin.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddAgendaModalOpen(true)}
                className="bg-school-gold-500 hover:bg-school-gold-600 text-school-navy-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Agenda Baru</span>
              </button>
            </div>
          </div>

          {/* Sub-Filters: Harian, Mingguan, Bulanan */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setAgendaFilter('Harian')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                agendaFilter === 'Harian'
                  ? 'bg-white text-school-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-school-gold-600" />
              <span>Agenda Harian ({new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date())})</span>
              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full">
                {principalAgendas.filter((a) => a.type === 'Harian').length}
              </span>
            </button>

            <button
              onClick={() => setAgendaFilter('Mingguan')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                agendaFilter === 'Mingguan'
                  ? 'bg-white text-school-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Agenda Mingguan (Pekan Ke-2)</span>
              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full">
                {principalAgendas.filter((a) => a.type === 'Mingguan').length}
              </span>
            </button>

            <button
              onClick={() => setAgendaFilter('Bulanan')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                agendaFilter === 'Bulanan'
                  ? 'bg-white text-school-navy-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agenda Bulanan (November 2026)</span>
              <span className="bg-slate-200 text-slate-800 text-[10px] px-1.5 py-0.2 rounded-full">
                {principalAgendas.filter((a) => a.type === 'Bulanan').length}
              </span>
            </button>
          </div>

          {/* Agenda Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredAgendas.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                Belum ada agenda {agendaFilter.toLowerCase()} yang terdaftar.
              </div>
            ) : (
              filteredAgendas.map((item) => {
                const isFinished = item.status === 'Selesai';
                const isInProgress = item.status === 'Sedang Berjalan';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-3 ${
                      isFinished
                        ? 'bg-slate-50 border-slate-200 opacity-80'
                        : isInProgress
                        ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-school-gold-400 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Priority and Status Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.priority === 'Penting & Mendesak'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.priority === 'Prioritas Tinggi'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>

                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isFinished
                              ? 'bg-slate-200 text-slate-700'
                              : isInProgress
                              ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                              : 'bg-sky-100 text-sky-800'
                          }`}
                        >
                          {isFinished && <CheckCheck className="w-3 h-3 text-slate-600" />}
                          {isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>}
                          {item.status}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`font-black text-sm leading-snug ${
                          isFinished ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {item.title}
                      </h4>

                      {/* Time, Date & Location */}
                      <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-school-gold-600 shrink-0" />
                          <span>{item.date}</span>
                          {item.time_start && (
                            <span className="font-semibold text-slate-800">
                              • {item.time_start} - {item.time_end || 'selesai'} WIB
                            </span>
                          )}
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 text-xs leading-relaxed">{item.description}</p>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleUpdateAgendaStatus(
                              item.id,
                              isFinished ? 'Terjadwal' : 'Selesai'
                            )
                          }
                          className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                            isFinished
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isFinished ? 'Buka Kembali' : 'Tandai Selesai'}</span>
                        </button>

                        {!isFinished && !isInProgress && (
                          <button
                            onClick={() => handleUpdateAgendaStatus(item.id, 'Sedang Berjalan')}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-md font-bold"
                            title="Tandai Sedang Berjalan"
                          >
                            Mulai
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteAgenda(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
                        title="Hapus Agenda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MATRIKS PRESENSI GURU (HARIAN, MINGGUAN, BULANAN)  */}
      {/* ========================================================= */}
      {activeTab === 'absensi' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-600" />
                Matriks Kehadiran & Kedisiplinan Guru & Karyawan
              </h3>
              <p className="text-xs text-slate-500">
                Data presensi real-time terintegrasi: pantauan harian waktu masuk/pulang, rekap pekanan, dan laporan kedisiplinan bulanan.
              </p>
            </div>

            {/* Sub-Filters: Harian, Mingguan, Bulanan */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setAttendanceFilter('harian')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  attendanceFilter === 'harian'
                    ? 'bg-white text-school-navy-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Presensi Harian ({new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date())})
              </button>
              <button
                onClick={() => setAttendanceFilter('mingguan')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  attendanceFilter === 'mingguan'
                    ? 'bg-white text-school-navy-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matriks Pekanan (Sen - Jum)
              </button>
              <button
                onClick={() => setAttendanceFilter('bulanan')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  attendanceFilter === 'bulanan'
                    ? 'bg-white text-school-navy-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rekap Disiplin Bulanan (Nov)
              </button>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-800 uppercase">Hadir di Sekolah</div>
                <div className="text-lg font-black text-emerald-950">
                  {allStaff.length - staffOnLeave.length} Guru & Tendik
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-800 uppercase">Izin / Pelatihan Luar</div>
                <div className="text-lg font-black text-amber-950">
                  {staffAttendance.filter((s) => s.status === 'Izin').length} Staf
                </div>
              </div>
              <Clock className="w-6 h-6 text-amber-600" />
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-blue-800 uppercase">Sakit</div>
                <div className="text-lg font-black text-blue-950">
                  {staffAttendance.filter((s) => s.status === 'Sakit').length} Staf
                </div>
              </div>
              <AlertTriangle className="w-6 h-6 text-blue-500" />
            </div>

            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-rose-800 uppercase">Tanpa Keterangan (Alpa)</div>
                <div className="text-lg font-black text-rose-950">
                  {staffAttendance.filter((s) => s.status === 'Alpa').length} Staf
                </div>
              </div>
              <XCircle className="w-6 h-6 text-rose-500" />
            </div>
          </div>

          {/* ATTENDANCE VIEW: HARIAN */}
          {attendanceFilter === 'harian' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F2942] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Guru / Karyawan</th>
                      <th className="py-2.5 px-3">Jabatan & Tugas</th>
                      <th className="py-2.5 px-3 text-center">Jam Masuk</th>
                      <th className="py-2.5 px-3 text-center">Jam Pulang</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3">Keterangan / Agenda Dinas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allStaff.map((staff, idx) => {
                      const att = staffAttendance.find((a) => a.user_id === staff.id);
                      const isPresent = att?.status === 'Hadir' || !att;
                      const isLeave = att?.status === 'Izin' || att?.status === 'Sakit';

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={staff.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">{staff.name}</span>
                                <span className="text-[10px] text-slate-500">{staff.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">
                            {staff.title}
                            {staff.specialty && (
                              <span className="block text-[10px] text-slate-400">{staff.specialty}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-800">
                            {att?.check_in_time ? `${att.check_in_time} WIB` : '07:05 WIB'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center text-slate-500">
                            {isLeave ? '-' : '15:30 WIB'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                                att?.status === 'Izin'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : att?.status === 'Sakit'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                            >
                              {att?.status || 'Hadir'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {att?.leave_reason ? (
                              <span className="font-semibold text-amber-900">{att.leave_reason}</span>
                            ) : (
                              <span className="text-slate-400">Bertugas normal di sekolah</span>
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

          {/* ATTENDANCE VIEW: MINGGUAN (GRID SENIN - JUMAT) */}
          {attendanceFilter === 'mingguan' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F2942] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Guru / Karyawan</th>
                      <th className="py-2.5 px-3">Jabatan</th>
                      <th className="py-2.5 px-2 text-center">Sen (09)</th>
                      <th className="py-2.5 px-2 text-center">Sel (10)</th>
                      <th className="py-2.5 px-2 text-center">Rab (11)</th>
                      <th className="py-2.5 px-2 text-center">Kam (12)</th>
                      <th className="py-2.5 px-2 text-center">Jum (13)</th>
                      <th className="py-2.5 px-3 text-center">% Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allStaff.map((staff, idx) => {
                      const isIlham = staff.id === 'u-ilham';
                      return (
                        <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={staff.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-slate-900 leading-tight">{staff.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{staff.title}</td>

                          {/* Senin */}
                          <td className="py-2.5 px-2 text-center">
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                              H
                            </span>
                          </td>

                          {/* Selasa (Live Day) */}
                          <td className="py-2.5 px-2 text-center">
                            {isIlham ? (
                              <span
                                className="bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded text-[10px]"
                                title="Izin Pelatihan"
                              >
                                I
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                                H
                              </span>
                            )}
                          </td>

                          {/* Rabu */}
                          <td className="py-2.5 px-2 text-center">
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                              H
                            </span>
                          </td>

                          {/* Kamis */}
                          <td className="py-2.5 px-2 text-center">
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                              H
                            </span>
                          </td>

                          {/* Jumat */}
                          <td className="py-2.5 px-2 text-center">
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded text-[10px]">
                              H
                            </span>
                          </td>

                          {/* % Rate */}
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                isIlham ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {isIlham ? '80.0%' : '100.0%'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ATTENDANCE VIEW: BULANAN */}
          {attendanceFilter === 'bulanan' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F2942] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Guru / Staf Pendidik</th>
                      <th className="py-2.5 px-3">Tugas</th>
                      <th className="py-2.5 px-2 text-center">Hari Efektif</th>
                      <th className="py-2.5 px-2 text-center text-emerald-400">Hadir</th>
                      <th className="py-2.5 px-2 text-center text-amber-300">Izin</th>
                      <th className="py-2.5 px-2 text-center text-blue-300">Sakit</th>
                      <th className="py-2.5 px-2 text-center text-rose-400">Alpa</th>
                      <th className="py-2.5 px-3 text-center">% Disiplin</th>
                      <th className="py-2.5 px-3 text-center">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allStaff.map((staff, idx) => {
                      const isIlham = staff.id === 'u-ilham';
                      const presentDays = isIlham ? 21 : 22;
                      const leaveDays = isIlham ? 1 : 0;
                      const rate = isIlham ? '95.5%' : '100%';

                      return (
                        <tr key={staff.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <img
                                src={staff.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="font-bold text-slate-900 leading-tight">{staff.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">{staff.title}</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">22</td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                            {presentDays}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-bold text-amber-700">
                            {leaveDays}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400">0</td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400">0</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">
                            {rate}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                              Sangat Disiplin
                            </span>
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

      {/* ========================================================= */}
      {/* TAB 3: LAPORAN JURNAL & KINERJA GURU (INTERAKTIF & MODAL) */}
      {/* ========================================================= */}
      {activeTab === 'jurnal' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-600" />
                Laporan Jurnal Mengajar & Kinerja Pembelajaran Guru
              </h3>
              <p className="text-xs text-slate-500">
                Klik pada baris atau tombol <strong>Lihat Jurnal</strong> untuk membuka rincian lengkap jurnal harian, topik ajar, kehadiran siswa, dan catatan supervisi guru yang bersangkutan.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Teacher Input */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama guru / mapel..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:border-school-gold-400"
                />
              </div>

              {/* Journal Sub-filters */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setJournalFilter('harian')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    journalFilter === 'harian' ? 'bg-white text-school-navy-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setJournalFilter('mingguan')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    journalFilter === 'mingguan' ? 'bg-white text-school-navy-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Pekan Ini
                </button>
                <button
                  onClick={() => setJournalFilter('bulanan')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    journalFilter === 'bulanan' ? 'bg-white text-school-navy-950 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Bulan Ini
                </button>
              </div>
            </div>
          </div>

          {/* Teacher Journals Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F2942] text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Guru & Foto</th>
                    <th className="py-2.5 px-3">Mata Pelajaran & Jabatan</th>
                    <th className="py-2.5 px-3 text-center">Kelas</th>
                    <th className="py-2.5 px-3 text-center">Status Jurnal</th>
                    <th className="py-2.5 px-3">Topik Terakhir yang Diajarkan</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {teacherPerformanceList.map((item, idx) => {
                    const { teacher, todayJournals, journals, assignedClass, isTeacher } = item;
                    const latestJournal = journals[0];
                    const hasTodayJournal = todayJournals.length > 0;

                    return (
                      <tr
                        key={teacher.id}
                        onClick={() => setSelectedTeacherForJournal(teacher)}
                        className="hover:bg-amber-50/50 cursor-pointer transition-colors group"
                        title="Klik untuk membuka rincian jurnal harian guru ini"
                      >
                        <td className="py-3 px-3 text-slate-400 font-mono text-center">{idx + 1}</td>

                        {/* Foto & Nama Guru */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-school-gold-400/50 shadow-xs shrink-0 bg-slate-100">
                              <img
                                src={
                                  teacher.avatar_url ||
                                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                                }
                                alt={teacher.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block leading-tight group-hover:text-school-navy-950">
                                {teacher.name}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{teacher.phone || teacher.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Jabatan & Mapel */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800 block">{teacher.title}</span>
                          <span className="text-[10px] text-slate-500">
                            {teacher.specialty || 'Pendidikan Dasar & Karakter'}
                          </span>
                        </td>

                        {/* Kelas Diampu */}
                        <td className="py-3 px-3 text-center">
                          {assignedClass ? (
                            <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[11px]">
                              {assignedClass.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Semua Kelas</span>
                          )}
                        </td>

                        {/* Status Jurnal */}
                        <td className="py-3 px-3 text-center">
                          {hasTodayJournal ? (
                            <span className="bg-emerald-100 text-emerald-800 font-black px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{todayJournals.length} Entri JP</span>
                            </span>
                          ) : isTeacher ? (
                            <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full text-[10px] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Belum Mengisi</span>
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded text-[10px]">
                              Non-Pendidik
                            </span>
                          )}
                        </td>

                        {/* Topik Terakhir */}
                        <td className="py-3 px-3 text-slate-700 max-w-xs">
                          {latestJournal ? (
                            <div>
                              <span className="font-bold text-slate-900 block truncate">
                                {latestJournal.topic}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {latestJournal.subject_name} • Jam ke-{latestJournal.period_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Belum ada entri materi ajar</span>
                          )}
                        </td>

                        {/* Aksi Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTeacherForJournal(teacher);
                            }}
                            className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold text-[11px] px-3 py-1.5 rounded-lg shadow-xs transition-transform hover:scale-105 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-school-gold-400" />
                            <span>Lihat Jurnal</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: PUSAT KENDALI PERSETUJUAN & DISPOSISI KEPSEK       */}
      {/* ========================================================= */}
      {activeTab === 'persetujuan' && (
        <div className="space-y-4">
          {/* MANDATORY APPROVAL SECTION: SARPRAS BUDGET REQUESTS */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-school-gold-600" />
                  Persetujuan Anggaran Pengadaan & Perbaikan Sarpras
                </h3>
                <p className="text-xs text-slate-500">
                  Setiap anggaran yang disetujui otomatis mengunci status tiket dan membuat{' '}
                  <strong>Draf Pengeluaran</strong> di modul Keuangan TU.
                </p>
              </div>
              <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-1 rounded-full">
                {pendingSarprasTickets.length} Permohonan
              </span>
            </div>

            {pendingSarprasTickets.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Semua permohonan anggaran Sarpras telah selesai ditinjau.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSarprasTickets.map((ticket) => {
                  const reporter = allStaff.find((s) => s.id === ticket.reported_by_id);
                  return (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 text-school-navy-900">
                            {ticket.ticket_number}
                          </span>
                          <span className="font-black text-slate-900 text-sm">
                            {ticket.item_name} ({ticket.room_name})
                          </span>
                        </div>

                        <p className="text-slate-600 max-w-2xl leading-relaxed">
                          <strong>Keluhan:</strong> {ticket.issue_description}
                        </p>

                        <div className="text-[11px] text-slate-500">
                          Diajukan oleh: <strong>{reporter?.name || 'Staf Sekolah'}</strong> • Estimasi:{' '}
                          <strong className="text-slate-900 font-mono text-xs">
                            Rp {Number(ticket.estimated_cost || 0).toLocaleString('id-ID')}
                          </strong>
                        </div>
                      </div>

                      {/* 1-Click Approve or Reject Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => rejectSarprasTicket(ticket.id, 'Ditunda untuk prioritas semester depan')}
                          className="px-3 py-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 font-bold transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Tolak</span>
                        </button>

                        <button
                          onClick={() => {
                            approveSarprasTicket(ticket.id, Number(ticket.estimated_cost) || 100000);
                            alert(
                              `✅ Anggaran untuk ${ticket.item_name} Disetujui!\nSistem telah otomatis menerbitkan Draf Pengeluaran di Modul Keuangan TU.`
                            );
                          }}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>Setujui Anggaran</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* STAFF LEAVE & PERMISSION OVERSIGHT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2 border-b pb-3">
              <Users className="w-5 h-5 text-school-gold-600" />
              Pengawasan Izin & Cuti Guru / Staf
            </h3>

            {staffOnLeave.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                Seluruh guru dan tenaga kependidikan hadir bertugas hari ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {staffOnLeave.map((att) => {
                  const staff = allStaff.find((s) => s.id === att.user_id);
                  return (
                    <div
                      key={att.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={staff?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{staff?.name}</div>
                          <div className="text-slate-500">{att.leave_reason || 'Izin dinas luar / pelatihan'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {att.status}
                        </span>
                        <button
                          onClick={() => alert(`Izin ${staff?.name} telah diverifikasi oleh Kepala Sekolah.`)}
                          className="bg-school-navy-900 text-white font-bold text-[10px] px-2.5 py-1 rounded-md"
                        >
                          Verifikasi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: TAMBAH AGENDA KEPALA SEKOLAH                     */}
      {/* ========================================================= */}
      {isAddAgendaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-black text-school-navy-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-school-gold-600" />
                Tambah Agenda Kepala Sekolah Baru
              </h3>
              <button
                onClick={() => setIsAddAgendaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jenis Agenda</label>
                  <select
                    value={agendaType}
                    onChange={(e) => setAgendaType(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                  >
                    <option value="Harian">Agenda Harian</option>
                    <option value="Mingguan">Agenda Mingguan</option>
                    <option value="Bulanan">Agenda Bulanan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tingkat Prioritas</label>
                  <select
                    value={agendaPriority}
                    onChange={(e) => setAgendaPriority(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                  >
                    <option value="Penting & Mendesak">Penting & Mendesak</option>
                    <option value="Prioritas Tinggi">Prioritas Tinggi</option>
                    <option value="Rutin">Rutin</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Judul Kegiatan / Agenda</label>
                <input
                  type="text"
                  required
                  value={agendaTitle}
                  onChange={(e) => setAgendaTitle(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Kurikulum & Evaluasi Supervisi Kelas"
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-hidden focus:border-school-gold-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={agendaDate}
                    onChange={(e) => setAgendaDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={agendaTimeStart}
                    onChange={(e) => setAgendaTimeStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={agendaTimeEnd}
                    onChange={(e) => setAgendaTimeEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tempat / Lokasi</label>
                <input
                  type="text"
                  value={agendaLocation}
                  onChange={(e) => setAgendaLocation(e.target.value)}
                  placeholder="Contoh: Ruang Kepala Sekolah / Aula Utama / Disdik"
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Deskripsi / Uraian Rencana Kerja</label>
                <textarea
                  rows={3}
                  value={agendaDescription}
                  onChange={(e) => setAgendaDescription(e.target.value)}
                  placeholder="Jelaskan sasaran kegiatan, pihak yang terlibat, dan target capaian..."
                  className="w-full border border-slate-300 rounded-lg p-2 focus:outline-hidden focus:border-school-gold-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddAgendaModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-school-navy-900 hover:bg-school-navy-950 text-white font-black rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-school-gold-400" />
                  <span>Simpan ke Agenda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: POPUP RINCIAN JURNAL HARIAN GURU (INTERAKTIF)   */}
      {/* ========================================================= */}
      {selectedTeacherForJournal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-school-gold-400 shadow-md bg-slate-100 shrink-0">
                  <img
                    src={
                      selectedTeacherForJournal.avatar_url ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'
                    }
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-school-navy-950">
                      {selectedTeacherForJournal.name}
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      Pendidik Aktif
                    </span>
                  </div>
                  <p className="text-xs text-school-gold-700 font-bold">{selectedTeacherForJournal.title}</p>
                  <p className="text-[11px] text-slate-500">
                    Spesialisasi: {selectedTeacherForJournal.specialty || 'Pendidikan Tematik SD'} • Telp:{' '}
                    {selectedTeacherForJournal.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeacherForJournal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Teaching Journal Records by this teacher */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-school-gold-600" />
                Catatan Jurnal Mengajar Harian & Realisasi PBM
              </h4>

              {teachingJournals.filter((j) => j.teacher_id === selectedTeacherForJournal.id).length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs">
                  Belum ada catatan jurnal mengajar yang terekam untuk pendidik ini.
                </div>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {teachingJournals
                    .filter((j) => j.teacher_id === selectedTeacherForJournal.id)
                    .map((journal) => {
                      const cls = classes.find((c) => c.id === journal.class_id);
                      return (
                        <div
                          key={journal.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-school-navy-900 text-white font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                                JP Ke-{journal.period_number}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">
                                {journal.subject_name}
                              </span>
                              <span className="bg-school-gold-100 text-school-gold-900 font-bold px-2 py-0.5 rounded text-[10px]">
                                {cls?.name || 'Semua Kelas'}
                              </span>
                            </div>
                            <span className="text-slate-500 font-mono text-[11px]">{journal.date}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="font-black text-slate-900 text-xs">{journal.topic}</div>
                            <p className="text-slate-600 leading-relaxed text-[11px]">
                              <strong>Aktivitas:</strong> {journal.learning_activity}
                            </p>
                            {journal.notes && (
                              <p className="text-slate-600 text-[11px]">
                                <strong>Catatan Guru:</strong> {journal.notes}
                              </p>
                            )}
                          </div>

                          {/* Attendance breakdown in class */}
                          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200/60 text-[10px]">
                            <span className="font-bold text-slate-500">Presensi Siswa:</span>
                            <span className="text-emerald-700 font-extrabold">Hadir: {journal.present_count}</span>
                            <span className="text-amber-700 font-extrabold">Sakit: {journal.sick_count}</span>
                            <span className="text-blue-700 font-extrabold">Izin: {journal.permitted_count}</span>
                            <span className="text-rose-700 font-extrabold">Alpa: {journal.absent_count}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Supervision & Leadership Feedback Box */}
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2.5">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-school-gold-600" />
                Catatan Supervisi & Rekomendasi Kepala Sekolah
              </h4>
              <p className="text-[11px] text-amber-900">
                Tuliskan arahan manajerial, apresiasi, atau masukan pedagogis yang akan langsung terhubung ke profil pembinaan guru.
              </p>
              <textarea
                rows={2}
                value={supervisoryFeedback}
                onChange={(e) => setSupervisoryFeedback(e.target.value)}
                placeholder={`Contoh: Pembelajaran tematik terintegrasi berjalan sangat efektif. Tingkatkan diferensiasi konten untuk siswa inklusif.`}
                className="w-full text-xs border border-amber-300 rounded-lg p-2.5 bg-white focus:outline-hidden focus:ring-2 focus:ring-school-gold-400"
              />
              <div className="flex items-center justify-between pt-1">
                {isFeedbackSaved && (
                  <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Catatan supervisi tersimpan!
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveSupervisoryFeedback(selectedTeacherForJournal.name)}
                    className="bg-school-navy-900 hover:bg-school-navy-950 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 text-school-gold-400" />
                    <span>Kirim Catatan Supervisi</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSelectedTeacherForJournal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
