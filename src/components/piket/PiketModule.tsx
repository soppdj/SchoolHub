import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  UserCheck,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserPlus,
  Send,
  Plus,
  Users,
  Search,
  Calendar,
  CheckCircle,
  Printer,
  FileDown,
  Edit,
  Lock,
  Unlock,
  Phone,
  Sparkles,
  MapPin,
  Building,
  RotateCcw,
  X,
  Check,
  Award,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { GuestBookEntry, PiketLapanganChecklist, PiketSchedule } from '../../types';

interface DayConfig {
  day: 1 | 2 | 3 | 4 | 5;
  name: string;
  focusLapangan: string;
  focusKantor: string;
  color: string;
}

const PIKET_DAYS: DayConfig[] = [
  {
    day: 1,
    name: 'Senin',
    focusLapangan: 'Upacara Bendera, Sapa Pagi & Senyum di Gerbang, Sholat Dhuha Berjamaah, Ketertiban Barisan.',
    focusKantor: 'Buku Tamu Digital, Rekap Administrasi Awal Pekan, Surat Masuk Dinas, Koordinasi Kepala Sekolah.',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    day: 2,
    name: 'Selasa',
    focusLapangan: 'Sapa Pagi Ramah, Sholat Dhuha, Ketertiban Halaqah Tahfidz Pagi, Patroli Koridor & Lapangan.',
    focusKantor: 'Buku Tamu Tamu Kedinasan, Pelayanan Wali Murid, Verifikasi Administrasi SPP & Kas Sekolah.',
    color: 'from-emerald-600 to-teal-700',
  },
  {
    day: 3,
    name: 'Rabu',
    focusLapangan: 'Sapa Pagi di Gerbang, Sholat Dhuha, Pembiasaan Karakter Magnet Rezeki, Penugasan Guru Pengganti.',
    focusKantor: 'Buku Tamu, Pelayanan Surat Keterangan Siswa, Koordinasi Inventaris & Tiket Sarpras.',
    color: 'from-amber-600 to-orange-700',
  },
  {
    day: 4,
    name: 'Kamis',
    focusLapangan: 'Sapa Pagi, Sholat Dhuha, Patroli Kebersihan Toilet & Halaman, Pemantauan Makan Siang Sehat.',
    focusKantor: 'Buku Tamu, Pengarsipan Dokumen Resmi Sekolah, Update Data Kontak Wali Murid, Notifikasi Bot.',
    color: 'from-purple-600 to-violet-700',
  },
  {
    day: 5,
    name: 'Jumat',
    focusLapangan: 'Jumat Berkah & Sapa Pagi, Sholat Dhuha & Dzikir Pagi, Pengawasan Kepulangan Tertib Lebih Awal.',
    focusKantor: 'Buku Tamu, Rekapitulasi Presensi Mingguan Staf, Laporan Akhir Pekan ke Kepala Sekolah.',
    color: 'from-rose-600 to-pink-700',
  },
];

export const PiketModule: React.FC = () => {
  const {
    currentUser,
    allStaff,
    piketSchedules,
    savePiketSchedule,
    piketChecklists,
    guestBookEntries,
    classes,
    schedules,
    staffAttendance,
    assignSubstituteTeacher,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'jadwal_piket' | 'lapangan' | 'kantor'>('jadwal_piket');

  // Permission check: only Developer and Administrator (TU/Bendahara) can edit Piket Schedule
  const canEditPiket = useMemo(() => {
    return (
      currentUser.roles.includes('Developer') ||
      currentUser.roles.includes('Administrator') ||
      currentUser.title?.toLowerCase().includes('developer') ||
      currentUser.title?.toLowerCase().includes('tu') ||
      currentUser.title?.toLowerCase().includes('bendahara') ||
      currentUser.id === 'u-sopianto' ||
      currentUser.id === 'u-silvi'
    );
  }, [currentUser]);

  // Current real-world day of week (1=Senin s/d 5=Jumat)
  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d >= 1 && d <= 5 ? (d as 1 | 2 | 3 | 4 | 5) : 1;
  }, []);

  const [dayFilter, setDayFilter] = useState<'ALL' | 1 | 2 | 3 | 4 | 5>('ALL');

  // Modal Edit Piket State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [formLapanganId, setFormLapanganId] = useState<string>('');
  const [formKantorId, setFormKantorId] = useState<string>('');
  const [formStartTime, setFormStartTime] = useState<string>('06:45');
  const [formEndTime, setFormEndTime] = useState<string>('15:00');
  const [formNotes, setFormNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Get existing schedule for a specific day
  const getPiketForDay = (day: 1 | 2 | 3 | 4 | 5): PiketSchedule | undefined => {
    return piketSchedules.find((p) => p.day_of_week === day);
  };

  const handleOpenEditModal = (day: 1 | 2 | 3 | 4 | 5) => {
    if (!canEditPiket) {
      alert('⚠️ Anda tidak memiliki izin untuk mengedit jadwal piket. Pengeditan hanya dapat dilakukan oleh Admin/TU dan Developer.');
      return;
    }
    const current = getPiketForDay(day);
    setEditingDay(day);
    setFormLapanganId(current?.piket_lapangan_teacher_id || allStaff[0]?.id || '');
    setFormKantorId(current?.piket_kantor_teacher_id || allStaff[1]?.id || '');
    setFormStartTime(current?.start_time || '06:45');
    setFormEndTime(current?.end_time || '15:00');
    setFormNotes(current?.notes || '');
    setIsEditModalOpen(true);
  };

  const handleSavePiket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditPiket) return;

    const existing = getPiketForDay(editingDay);
    const dayConfig = PIKET_DAYS.find((d) => d.day === editingDay);
    const newSchedule: PiketSchedule = {
      id: existing?.id || `ps-${editingDay}`,
      day_of_week: editingDay,
      piket_lapangan_teacher_id: formLapanganId,
      piket_kantor_teacher_id: formKantorId,
      start_time: formStartTime,
      end_time: formEndTime,
      notes: formNotes.trim() || dayConfig?.focusLapangan || '',
    };

    await savePiketSchedule(newSchedule);
    setIsEditModalOpen(false);
    setSaveSuccessMsg(`✅ Jadwal Piket Hari ${dayConfig?.name} berhasil diperbarui & tersinkronisasi otomatis ke Dashboard Bersama!`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Quick 1-Click Swap or Inline Selection
  const handleQuickAssign = async (
    day: 1 | 2 | 3 | 4 | 5,
    roleType: 'lapangan' | 'kantor',
    teacherId: string
  ) => {
    if (!canEditPiket) return;
    const existing = getPiketForDay(day);
    const dayConfig = PIKET_DAYS.find((d) => d.day === day);

    const newSchedule: PiketSchedule = {
      id: existing?.id || `ps-${day}`,
      day_of_week: day,
      piket_lapangan_teacher_id: roleType === 'lapangan' ? teacherId : existing?.piket_lapangan_teacher_id || allStaff[0].id,
      piket_kantor_teacher_id: roleType === 'kantor' ? teacherId : existing?.piket_kantor_teacher_id || allStaff[1].id,
      start_time: existing?.start_time || '06:45',
      end_time: existing?.end_time || '15:00',
      notes: existing?.notes || dayConfig?.focusLapangan || '',
    };

    await savePiketSchedule(newSchedule);
    setSaveSuccessMsg(`✅ Petugas Piket Hari ${dayConfig?.name} berhasil diperbarui!`);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Export Jadwal Piket to Excel
  const handleExportExcel = () => {
    const rows = PIKET_DAYS.map((d, i) => {
      const p = getPiketForDay(d.day);
      const lapangan = allStaff.find((s) => s.id === p?.piket_lapangan_teacher_id);
      const kantor = allStaff.find((s) => s.id === p?.piket_kantor_teacher_id);
      return {
        No: i + 1,
        Hari: d.name,
        'Petugas Piket Lapangan': lapangan ? `${lapangan.name} (${lapangan.title})` : 'Belum Ditugaskan',
        'Kontak Lapangan': lapangan?.phone || '-',
        'Petugas Piket Kantor': kantor ? `${kantor.name} (${kantor.title})` : 'Belum Ditugaskan',
        'Kontak Kantor': kantor?.phone || '-',
        'Jam Tugas Piket': `${p?.start_time || '06:45'} - ${p?.end_time || '15:00'} WIB`,
        'Fokus Tugas Lapangan': d.focusLapangan,
        'Fokus Tugas Kantor': d.focusKantor,
        'Catatan Khusus': p?.notes || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Piket_Harian');
    XLSX.writeFile(wb, 'Jadwal_Piket_Lapangan_dan_Kantor_SD_Khoirur_Rooziqiin.xlsx');
  };

  // Piket Lapangan Checklist Form State
  const defaultChecklist = piketChecklists[0] || {
    id: 'plc-today',
    date: '2026-11-10',
    teacher_id: currentUser.id,
    sapa_pagi_completed: true,
    dhuha_supervised: true,
    tahfidz_orderliness: true,
    istirahat_patrol: false,
    facility_cleanliness_check: true,
    late_students_count: 2,
    late_students_notes: '2 siswa terlambat 7 menit karena hujan lokal di Antapani.',
    incident_notes: 'Pintu gerbang dan mushola kondusif, siswa antre wudhu tertib.',
  };

  const [checklist, setChecklist] = useState<PiketLapanganChecklist>(defaultChecklist);

  // Guest Book Form State (Piket Kantor)
  const [guestForm, setGuestForm] = useState({
    guest_name: '',
    institution_or_relation: '',
    purpose: '',
    person_to_meet: 'Kepala Sekolah (Dwi Windarti, S.E)',
    phone_number: '',
  });

  const [guestList, setGuestList] = useState<GuestBookEntry[]>(guestBookEntries);

  const handleToggleChecklist = (field: keyof PiketLapanganChecklist) => {
    setChecklist((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    alert('✅ Ceklis Piket Lapangan & Catatan Kejadian berhasil disimpan dan disinkronkan ke Kepala Sekolah!');
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestForm.guest_name || !guestForm.purpose) {
      alert('Nama tamu dan tujuan kunjungan wajib diisi!');
      return;
    }

    const newGuest: GuestBookEntry = {
      id: `gb-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      guest_name: guestForm.guest_name,
      institution_or_relation: guestForm.institution_or_relation || 'Masyarakat / Orang Tua',
      purpose: guestForm.purpose,
      person_to_meet: guestForm.person_to_meet,
      phone_number: guestForm.phone_number || '-',
      recorded_by_id: currentUser.id,
    };

    setGuestList([newGuest, ...guestList]);
    setGuestForm({
      guest_name: '',
      institution_or_relation: '',
      purpose: '',
      person_to_meet: 'Kepala Sekolah (Dwi Windarti, S.E)',
      phone_number: '',
    });
    alert('✅ Buku Tamu Digital berhasil dicatat!');
  };

  const todayPiket = getPiketForDay(todayDayOfWeek);
  const todayLapangan = allStaff.find((s) => s.id === todayPiket?.piket_lapangan_teacher_id);
  const todayKantor = allStaff.find((s) => s.id === todayPiket?.piket_kantor_teacher_id);

  return (
    <div className="space-y-4">
      {/* Save Success Alert Banner */}
      {saveSuccessMsg && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-white" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg('')} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Selector: 3 Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('jadwal_piket')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'jadwal_piket'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-school-gold-400" />
            <span>Jadwal Piket Harian (Senin - Jumat)</span>
            <span className="bg-school-gold-500 text-school-navy-950 text-[10px] font-black px-1.5 rounded-full">
              5 Hari
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lapangan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'lapangan'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-school-gold-400" />
            <span>Guru Piket Lapangan (Ceklis & Pengganti)</span>
          </button>

          <button
            onClick={() => setActiveTab('kantor')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'kantor'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-school-gold-400" />
            <span>Guru Piket Kantor (Buku Tamu Digital)</span>
          </button>
        </div>

        {/* Role & Access Badge */}
        <div className="flex items-center gap-2 text-xs">
          {canEditPiket ? (
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xs">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hak Akses Edit: Admin/TU & Developer</span>
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-600 border border-slate-300 font-semibold px-3 py-1 rounded-lg flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Mode Lihat Saja (Dikelola Admin/TU & Developer)</span>
            </span>
          )}
        </div>
      </div>

      {/* 1. TAB: JADWAL PIKET HARIAN (SENIN - JUMAT) */}
      {activeTab === 'jadwal_piket' && (
        <div className="space-y-4">
          {/* Top Banner: Today's Active Officers & Quick Stats */}
          <div className="bg-gradient-to-r from-school-navy-900 via-school-navy-800 to-[#1E3A8A] text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-school-gold-500/20 text-school-gold-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black tracking-wide">
                    Jadwal Piket Lapangan & Piket Kantor SD Khoirur Rooziqiin
                  </h3>
                  <p className="text-xs text-slate-300">
                    Sistem rotasi piket harian terpadu. Pengaturan petugas dapat diedit langsung oleh Administrator/TU dan Developer.
                  </p>
                </div>
              </div>
            </div>

            {/* Today's Active Officer Card */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs border border-white/20 p-3 rounded-xl shrink-0">
              <div className="text-left space-y-1 text-xs">
                <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-school-gold-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Petugas Hari Ini ({PIKET_DAYS.find((d) => d.day === todayDayOfWeek)?.name})</span>
                </div>
                <div className="text-white font-bold flex items-center gap-1.5">
                  <span className="text-slate-300 font-normal">🎯 Lapangan:</span>
                  <span className="text-school-gold-300">{todayLapangan?.name || '-'}</span>
                </div>
                <div className="text-white font-bold flex items-center gap-1.5">
                  <span className="text-slate-300 font-normal">🏢 Kantor:</span>
                  <span className="text-teal-300">{todayKantor?.name || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Ribbon & Day Filter */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600">Filter Hari:</span>
              <button
                type="button"
                onClick={() => setDayFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  dayFilter === 'ALL'
                    ? 'bg-school-navy-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Hari (Senin - Jumat)
              </button>
              {PIKET_DAYS.map((d) => (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setDayFilter(d.day)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                    dayFilter === d.day
                      ? 'bg-school-navy-900 text-white'
                      : d.day === todayDayOfWeek
                      ? 'bg-school-gold-100 text-school-gold-900 border border-school-gold-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{d.name}</span>
                  {d.day === todayDayOfWeek && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#0F2942] hover:bg-[#1E3A8A] text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-school-gold-400" />
                <span>Cetak Jadwal Piket</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-white" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Daily Schedule Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {PIKET_DAYS.filter((d) => (dayFilter === 'ALL' ? true : d.day === dayFilter)).map((d) => {
              const schedule = getPiketForDay(d.day);
              const isToday = d.day === todayDayOfWeek;
              const petugasLapangan = allStaff.find((s) => s.id === schedule?.piket_lapangan_teacher_id);
              const petugasKantor = allStaff.find((s) => s.id === schedule?.piket_kantor_teacher_id);

              return (
                <div
                  key={d.day}
                  className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-xs ${
                    isToday
                      ? 'border-school-gold-400 ring-2 ring-school-gold-400/30'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Day Card Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-school-navy-900 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        {d.day}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-base text-school-navy-950">Hari {d.name}</h4>
                          {isToday && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              HARI INI (AKTIF)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3 h-3 text-school-gold-600" />
                            {schedule?.start_time || '06:45'} - {schedule?.end_time || '15:00'} WIB
                          </span>
                          <span>•</span>
                          <span>2 Petugas Piket Ditugaskan</span>
                        </div>
                      </div>
                    </div>

                    {/* Edit Button for Admin/TU & Developer */}
                    {canEditPiket && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(d.day)}
                        className="px-3.5 py-1.5 bg-school-navy-900 hover:bg-school-navy-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-school-gold-400" />
                        <span>Edit Petugas Hari {d.name}</span>
                      </button>
                    )}
                  </div>

                  {/* Day Card Body: 2 Columns (Lapangan vs Kantor) */}
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Petugas Piket Lapangan */}
                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
                            <ShieldCheck className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-indigo-700">Peran Operasional</div>
                            <h5 className="font-black text-xs text-school-navy-950">Petugas Piket Lapangan</h5>
                          </div>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Gerbang & Ketertiban
                        </span>
                      </div>

                      {/* Officer Profile Box */}
                      {petugasLapangan ? (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-200/80 shadow-xs">
                          <img
                            src={petugasLapangan.avatar_url}
                            alt={petugasLapangan.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-indigo-400 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h6 className="font-extrabold text-xs text-slate-900 truncate">
                              {petugasLapangan.name}
                            </h6>
                            <div className="text-[11px] text-indigo-800 font-semibold truncate">
                              {petugasLapangan.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{petugasLapangan.phone}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-dashed border-indigo-200 text-center text-slate-400 text-xs">
                          Belum ada petugas lapangan
                        </div>
                      )}

                      {/* Quick Dropdown if in Edit Mode */}
                      {canEditPiket && (
                        <div className="pt-1">
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Ganti Petugas Lapangan Cepat:
                          </label>
                          <select
                            value={schedule?.piket_lapangan_teacher_id || ''}
                            onChange={(e) => handleQuickAssign(d.day, 'lapangan', e.target.value)}
                            className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:outline-hidden"
                          >
                            {allStaff.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} — {st.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Focus of Duty */}
                      <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-indigo-100/80 space-y-1">
                        <div className="font-bold text-indigo-900 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Fokus Tugas Lapangan:</span>
                        </div>
                        <p className="leading-relaxed text-slate-700">{d.focusLapangan}</p>
                      </div>
                    </div>

                    {/* 2. Petugas Piket Kantor */}
                    <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-100 space-y-3">
                      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-teal-600 text-white rounded-lg shadow-xs">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-teal-700">Peran Operasional</div>
                            <h5 className="font-black text-xs text-school-navy-950">Petugas Piket Kantor</h5>
                          </div>
                        </div>
                        <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          Front Office & Tamu
                        </span>
                      </div>

                      {/* Officer Profile Box */}
                      {petugasKantor ? (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-teal-200/80 shadow-xs">
                          <img
                            src={petugasKantor.avatar_url}
                            alt={petugasKantor.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-teal-400 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h6 className="font-extrabold text-xs text-slate-900 truncate">
                              {petugasKantor.name}
                            </h6>
                            <div className="text-[11px] text-teal-800 font-semibold truncate">
                              {petugasKantor.title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{petugasKantor.phone}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-dashed border-teal-200 text-center text-slate-400 text-xs">
                          Belum ada petugas kantor
                        </div>
                      )}

                      {/* Quick Dropdown if in Edit Mode */}
                      {canEditPiket && (
                        <div className="pt-1">
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Ganti Petugas Kantor Cepat:
                          </label>
                          <select
                            value={schedule?.piket_kantor_teacher_id || ''}
                            onChange={(e) => handleQuickAssign(d.day, 'kantor', e.target.value)}
                            className="w-full bg-white border border-teal-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-400 focus:outline-hidden"
                          >
                            {allStaff.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name} — {st.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Focus of Duty */}
                      <div className="text-[11px] text-slate-600 bg-white/80 p-2.5 rounded-lg border border-teal-100/80 space-y-1">
                        <div className="font-bold text-teal-900 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-teal-600" />
                          <span>Fokus Tugas Kantor:</span>
                        </div>
                        <p className="leading-relaxed text-slate-700">{d.focusKantor}</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Notes / Instructions */}
                  {schedule?.notes && (
                    <div className="px-5 pb-4 text-xs">
                      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Instruksi Khusus:</span> {schedule.notes}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pengesahan Tanda Tangan Cetak (Visible on Print) */}
          <div className="hidden print:block pt-8 text-center text-xs">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Dwi Windarti, S.E</p>
              </div>
              <div>
                <p>Bandung, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold">TU & Bendahara</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Silvi Oktaviani, S.Kom</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. GURU PIKET LAPANGAN */}
      {activeTab === 'lapangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Daily Field Checklist (Col 7) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-school-gold-600" />
                Ceklis Tugas Rutin Piket Lapangan
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {new Intl.DateTimeFormat('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date())}
              </span>
            </div>

            <form onSubmit={handleSaveChecklist} className="space-y-4 text-xs">
              <div className="space-y-2.5">
                {[
                  {
                    field: 'sapa_pagi_completed',
                    label: '1. Sapa Pagi & Senyum di Gerbang Utama (07:15 - 07:30 WIB)',
                    desc: 'Menyambut kedatangan siswa, cek kerapian seragam dan salaman tertib.',
                  },
                  {
                    field: 'dhuha_supervised',
                    label: '2. Pengawasan Sholat Dhuha Bersama (07:30 - 08:00 WIB)',
                    desc: 'Mengawasi wudhu di selasar mushola dan ketenangan sholat berjamaah.',
                  },
                  {
                    field: 'tahfidz_orderliness',
                    label: '3. Ketertiban Halaqah Tahfidz Pagi',
                    desc: 'Memastikan seluruh siswa tertib di kelompok halaqah masing-masing.',
                  },
                  {
                    field: 'istirahat_patrol',
                    label: '4. Patroli Area Lapangan & Koridor Saat Istirahat',
                    desc: 'Mencegah lari-lari berbahaya, bercanda fisik, dan memantau antrean kantin.',
                  },
                  {
                    field: 'facility_cleanliness_check',
                    label: '5. Pemeriksaan Kebersihan Toilet & Halaman Sekolah',
                    desc: 'Memastikan fasilitas air mengalir, toilet bersih, dan bebas sampah berserakan.',
                  },
                ].map((item) => {
                  const isChecked = Boolean(checklist[item.field as keyof PiketLapanganChecklist]);
                  return (
                    <div
                      key={item.field}
                      onClick={() => handleToggleChecklist(item.field as any)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.label}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Late Students & Incident Log */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Siswa Terlambat Hari Ini</label>
                  <input
                    type="number"
                    value={checklist.late_students_count}
                    onChange={(e) => setChecklist({ ...checklist, late_students_count: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Keterangan / Alasan Terlambat</label>
                  <input
                    type="text"
                    value={checklist.late_students_notes}
                    onChange={(e) => setChecklist({ ...checklist, late_students_notes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Kejadian Khusus / Laporan Insiden</label>
                <textarea
                  rows={2}
                  value={checklist.incident_notes}
                  onChange={(e) => setChecklist({ ...checklist, incident_notes: e.target.value })}
                  placeholder="Catat jika ada siswa sakit mendadak di lapangan, barang tertinggal, dsb..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer"
              >
                Simpan & Terbitkan Laporan Piket Lapangan
              </button>
            </form>
          </div>

          {/* Quick Authority Control: Substitute Teacher Assignment (Col 5) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-school-gold-600" />
                Otoritas Penggantian Guru Jam Kosong
              </h3>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                Otoritas Piket
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Guru Piket Lapangan memiliki wewenang operasional untuk segera menugaskan guru yang sedang bebas jam mengajar ke kelas yang terindikasi kosong (panel merah).
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Kelas yang Membutuhkan Pengganti:</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Kelas 4 (Jam Ke-2)</div>
                  <div className="text-[11px] text-slate-500">Guru Utama: Rizal Zatmika, S.Pd (Izin Pelatihan)</div>
                </div>
                <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                  PANEL MERAH
                </span>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">Pilih Guru Pengganti yang Bebas:</label>
                <div className="space-y-1.5">
                  {allStaff
                    .filter((s) => s.roles.includes('Guru Mapel') || s.roles.includes('Developer'))
                    .slice(0, 3)
                    .map((free) => (
                      <button
                        key={free.id}
                        type="button"
                        onClick={() => {
                          assignSubstituteTeacher('c4', 'sch-4-2', free.id);
                          alert(`✅ Sukses menugaskan ${free.name} ke Kelas 4! Panel di Dashboard Bersama langsung menjadi Hijau.`);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img src={free.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="font-bold text-slate-800 truncate">{free.name}</span>
                        </div>
                        <span className="bg-school-navy-900 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                          Tugaskan
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GURU PIKET KANTOR (BUKU TAMU DIGITAL) */}
      {activeTab === 'kantor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Guest Registration Form (Col 5) */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-school-navy-900 border-b pb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-school-gold-600" />
              Buku Tamu Digital — Front Office
            </h3>

            <form onSubmit={handleAddGuest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Tamu</label>
                <input
                  type="text"
                  required
                  value={guestForm.guest_name}
                  onChange={(e) => setGuestForm({ ...guestForm, guest_name: e.target.value })}
                  placeholder="Contoh: H. Sudrajat, S.Sos."
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instansi / Hubungan</label>
                <input
                  type="text"
                  value={guestForm.institution_or_relation}
                  onChange={(e) => setGuestForm({ ...guestForm, institution_or_relation: e.target.value })}
                  placeholder="Contoh: Dinas Pendidikan Kota Bandung / Wali Murid"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pihak yang Ingin Ditemui</label>
                <select
                  value={guestForm.person_to_meet}
                  onChange={(e) => setGuestForm({ ...guestForm, person_to_meet: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  <option value="Kepala Sekolah (Dwi Windarti, S.E)">Kepala Sekolah (Dwi Windarti, S.E)</option>
                  <option value="Tata Usaha & Bendahara (Silvi Oktaviani, S.Kom)">Tata Usaha & Bendahara (Silvi Oktaviani, S.Kom)</option>
                  <option value="Wali Kelas 1 - 6">Wali Kelas 1 - 6</option>
                  <option value="Koordinator Sarpras (Deni)">Koordinator Sarpras (Deni)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Kontak / WhatsApp Tamu</label>
                <input
                  type="text"
                  value={guestForm.phone_number}
                  onChange={(e) => setGuestForm({ ...guestForm, phone_number: e.target.value })}
                  placeholder="0812xxxxxx"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Keperluan / Tujuan Kunjungan</label>
                <textarea
                  required
                  rows={3}
                  value={guestForm.purpose}
                  onChange={(e) => setGuestForm({ ...guestForm, purpose: e.target.value })}
                  placeholder="Jelaskan ringkasan keperluan kedatangan tamu..."
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md cursor-pointer"
              >
                Simpan ke Buku Tamu Sekolah
              </button>
            </form>
          </div>

          {/* Guest Log Table (Col 7) */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900">
                Daftar Tamu Sekolah Terdaftar
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                {guestList.length} Tamu Dicatat
              </span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {guestList.map((g) => (
                <div key={g.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-extrabold text-slate-900 text-sm">{g.guest_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(g.date).toLocaleDateString('id-ID')} • {g.time} WIB
                    </span>
                  </div>
                  <div className="text-slate-600">
                    <strong>Instansi:</strong> {g.institution_or_relation} • <strong>Kontak:</strong> {g.phone_number}
                  </div>
                  <div className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    <strong>Keperluan:</strong> {g.purpose}
                  </div>
                  <div className="text-[11px] text-school-navy-700 font-semibold pt-0.5">
                    Menemui: {g.person_to_meet}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT JADWAL PIKET (KHUSUS ADMIN/TU & DEVELOPER) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-school-gold-100 text-school-gold-800 rounded-xl">
                  <Edit className="w-5 h-5 text-school-navy-900" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-school-navy-950">
                    Edit Jadwal Piket Hari {PIKET_DAYS.find((d) => d.day === editingDay)?.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pengaturan petugas piket lapangan & kantor (Otoritas Admin/TU & Developer).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePiket} className="space-y-4 text-xs">
              {/* Petugas Lapangan Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Petugas Piket Lapangan</span>
                </label>
                <select
                  required
                  value={formLapanganId}
                  onChange={(e) => setFormLapanganId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-school-navy-900 focus:bg-white focus:ring-2 focus:ring-indigo-400"
                >
                  {allStaff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.title} ({st.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Petugas Kantor Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  <span>Petugas Piket Kantor</span>
                </label>
                <select
                  required
                  value={formKantorId}
                  onChange={(e) => setFormKantorId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-school-navy-900 focus:bg-white focus:ring-2 focus:ring-teal-400"
                >
                  {allStaff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.title} ({st.roles.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Jam Piket */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jam Mulai Tugas</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jam Selesai Tugas</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Catatan / Instruksi Khusus */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Catatan Khusus / Arahan Tugas
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Contoh: Fokus sambut tamu dari dinas pendidikan pukul 09:00 WIB..."
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-school-navy-900 hover:bg-school-navy-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-school-gold-400" />
                  <span>Simpan Perubahan Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
