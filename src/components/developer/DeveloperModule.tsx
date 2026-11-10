import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Shield,
  Layers,
  Users,
  Settings,
  RefreshCw,
  Download,
  Upload,
  ArrowUpRight,
  GraduationCap,
  FileCode,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Plus,
  Search,
  Filter,
  Clock,
  BookOpen,
  Sparkles,
  X,
  Save,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserProfile, MasterScheduleItem } from '../../types';
import { exportFullSystemBackup } from '../../lib/pdfGenerator';
import { db } from '../../lib/db';
import { SEED_SCHEDULES } from '../../lib/seedData';

const DAY_NAMES: Record<number, string> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
};

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
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

const POPULAR_SUBJECTS = [
  'Bahasa Indonesia',
  'Matematika',
  'IPAS (Sains & Sosial)',
  'Bahasa Inggris',
  'Bahasa Sunda',
  'PAI & Budi Pekerti',
  'PAI & Fiqih',
  'Pendidikan Pancasila',
  'PJOK',
  'Coding & Robotika',
  'TIK (Informatika Dasar)',
  "Tahfidz Al-Qur'an",
  'Seni Budaya & Prakarya (SBdP)',
  'Karakter Magnet Rezeki',
  'Kepanduan Pramuka',
  'Sains & Eksperimen',
];

export const DeveloperModule: React.FC = () => {
  const {
    allStaff,
    classes,
    students,
    schedules,
    letterTemplates,
    kurikulumTps,
    feeAnnualSummaries,
    financeTransactions,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'schedules' | 'templates' | 'users' | 'promotion' | 'backup'>('schedules');

  // Edit User Modal State
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Class Promotion Wizard State
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSummary, setPromotionSummary] = useState<string | null>(null);

  // Schedule Management State
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<number | 'ALL'>('ALL');
  const [searchSchedule, setSearchSchedule] = useState<string>('');
  const [editingSchedule, setEditingSchedule] = useState<MasterScheduleItem | null>(null);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<MasterScheduleItem>>({
    class_id: 'c1',
    day_of_week: 1,
    period_number: 1,
    start_time: '08:00',
    end_time: '08:35',
    duration_jp: 1,
    subject_name: 'Pendidikan Pancasila',
    teacher_id: 'u-fatimah',
  });

  const availableRoles: UserRole[] = [
    'Developer',
    'Administrator',
    'Kepala Sekolah',
    'Guru Kelas',
    'Guru Mapel',
    'Shadow Teacher',
    'Sarpras',
    'Guru Piket Lapangan',
    'Guru Piket Kantor',
  ];

  // Filtered schedules for management table
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        if (filterClassId !== 'ALL' && s.class_id !== filterClassId) return false;
        if (filterDay !== 'ALL' && s.day_of_week !== filterDay) return false;
        if (searchSchedule.trim()) {
          const q = searchSchedule.toLowerCase();
          const matchSubj = s.subject_name.toLowerCase().includes(q);
          const teacher = allStaff.find((st) => st.id === s.teacher_id);
          const matchTeacher = teacher?.name.toLowerCase().includes(q) || false;
          if (!matchSubj && !matchTeacher) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        if (a.class_id !== b.class_id) return a.class_id.localeCompare(b.class_id);
        return a.period_number - b.period_number;
      });
  }, [schedules, filterClassId, filterDay, searchSchedule, allStaff]);

  // 1. Delete a schedule item
  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('⚠️ Apakah Anda yakin ingin menghapus jadwal jam pelajaran ini?')) {
      await db.schedules.delete(id);
    }
  };

  // 2. Save edited schedule item
  const handleSaveEditSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    await db.schedules.put(editingSchedule);
    setEditingSchedule(null);
  };

  // 3. Add new schedule item
  const handleAddNewSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.subject_name || !newSchedule.teacher_id) {
      alert('Mata pelajaran dan guru pengampu wajib dipilih.');
      return;
    }
    const cId = newSchedule.class_id || 'c1';
    const day = Number(newSchedule.day_of_week) || 1;
    const period = Number(newSchedule.period_number) || 1;
    const id = `sch-${cId.replace('c', '')}-${day}-${period}-${Date.now().toString().slice(-4)}`;

    const item: MasterScheduleItem = {
      id,
      class_id: cId,
      day_of_week: (day as 1 | 2 | 3 | 4 | 5),
      period_number: period,
      start_time: newSchedule.start_time || PERIOD_TIMES[period]?.start || '08:00',
      end_time: newSchedule.end_time || PERIOD_TIMES[period]?.end || '08:35',
      duration_jp: 1,
      subject_name: newSchedule.subject_name,
      teacher_id: newSchedule.teacher_id,
    };

    await db.schedules.put(item);
    setIsAddScheduleModalOpen(false);
  };

  // 4. Reset to official 250 master schedule items from Excel
  const handleResetMasterSchedules = async () => {
    const ok = window.confirm(
      '⚠️ PERINGATAN PEMULIHAN JADWAL MASTER RESMI:\n\nTindakan ini akan memulihkan 250 jam pelajaran resmi SD Khoirur Rooziqiin Bandung sesuai berkas Excel Jadwal_fix.xlsx (Senin s/d Jumat Kelas 1 - 6).\n\nLanjutkan?'
    );
    if (!ok) return;

    await db.schedules.clear();
    await db.schedules.bulkPut(SEED_SCHEDULES);
    alert('✅ Seluruh 250 jadwal master resmi SD Khoirur Rooziqiin berhasil dimuat ulang ke database!');
  };

  // 5. Automated Academic Year & Class Promotion Engine (Kenaikan Kelas Otomatis)
  const handleRunClassPromotion = async () => {
    const confirmRun = window.confirm(
      '⚠️ PERINGATAN KENAIKAN KELAS OTOMATIS:\n\nProses ini akan menaikkan seluruh siswa:\n• Kelas 1 -> Kelas 2\n• Kelas 2 -> Kelas 3\n• Kelas 3 -> Kelas 4\n• Kelas 4 -> Kelas 5\n• Kelas 5 -> Kelas 6\n• Kelas 6 -> Dikeluarkan sebagai ALUMNI\n\nApakah Anda yakin ingin memproses rollover tahun ajaran baru?'
    );
    if (!confirmRun) return;

    setIsPromoting(true);

    try {
      let promotedCount = 0;
      let graduatedCount = 0;

      for (const st of students) {
        const curCls = classes.find((c) => c.id === st.class_id);
        if (!curCls) continue;

        if (curCls.grade_level === 6) {
          await db.students.update(st.id, {
            class_id: 'alumni',
            fee_category: 'Reguler',
          });
          graduatedCount++;
        } else {
          const nextGrade = curCls.grade_level + 1;
          const nextCls = classes.find((c) => c.grade_level === nextGrade);
          if (nextCls) {
            await db.students.update(st.id, {
              class_id: nextCls.id,
            });
            promotedCount++;
          }
        }
      }

      setPromotionSummary(
        `🎉 Berhasil menaikkan ${promotedCount} siswa ke jenjang kelas berikutnya dan meluluskan ${graduatedCount} siswa Kelas 6 ke arsip Alumni!`
      );
      alert(`Kenaikan Kelas Otomatis Selesai!\n${promotedCount} siswa naik kelas, ${graduatedCount} siswa Kelas 6 lulus.`);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses kenaikan kelas otomatis.');
    } finally {
      setIsPromoting(false);
    }
  };

  // 6. Full System Backup Snapshot
  const handleFullBackup = () => {
    const backupSnapshot = {
      timestamp: new Date().toISOString(),
      school: 'SD Khoirur Rooziqiin Bandung',
      academic_year: '2026/2027',
      staff: allStaff,
      classes,
      students,
      schedules,
      letterTemplates,
      kurikulumTps,
      feeAnnualSummaries,
      financeTransactions,
    };
    exportFullSystemBackup(backupSnapshot);
  };

  // Toggle role inside user edit modal
  const handleToggleStaffRole = (role: UserRole) => {
    if (!editingStaff) return;
    const current = editingStaff.roles;
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setEditingStaff({ ...editingStaff, roles: updated });
  };

  const handleSaveStaffChanges = async () => {
    if (!editingStaff) return;
    await db.profiles.put(editingStaff);
    alert(`✅ Data akun staf ${editingStaff.name} berhasil diperbarui!`);
    setEditingStaff(null);
  };

  return (
    <div className="space-y-4">
      
      {/* Developer Banner */}
      <div className="bg-[#0A1C2E] rounded-2xl p-5 text-white shadow-md border-b-2 border-purple-500 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
              Developer Mode (Super Admin)
            </span>
            <span className="text-purple-300 text-xs font-semibold">SD Khoirur Rooziqiin Bandung</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1">Universal Control Center & Schedule Manager</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Manajemen penuh jadwal pelajaran 6 kelas, hak akses multi-peran ~15 staf, mesin kenaikan kelas otomatis, penomoran surat, dan backup database.
          </p>
        </div>

        <button
          onClick={handleFullBackup}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Cadangkan Database (JSON)</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b pb-2 flex-wrap">
        {[
          { id: 'schedules', label: 'Kelola Jadwal Pelajaran (Master)', icon: Calendar },
          { id: 'templates', label: 'Universal Template Manager', icon: Layers },
          { id: 'users', label: 'Manajemen 15 Akun & Multi-Peran', icon: Users },
          { id: 'promotion', label: 'Mesin Kenaikan Kelas Otomatis', icon: GraduationCap },
          { id: 'backup', label: 'Backup & Restore Database', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-purple-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. KELOLA JADWAL PELAJARAN MASTER (CRUD) */}
      {activeTab === 'schedules' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Daftar Master Jadwal Pelajaran (Kelas 1 s/d 6)
              </h3>
              <p className="text-xs text-slate-500">
                Total terdaftar: <strong>{schedules.length} Jam Pelajaran</strong> aktif. Pengembang memiliki hak akses penuh untuk menambah, mengedit, atau menghapus slot jadwal.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleResetMasterSchedules}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                title="Pulihkan seluruh data jadwal dari berkas Jadwal_fix.xlsx"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset ke Master Resmi (250 JP)</span>
              </button>

              <button
                onClick={() => setIsAddScheduleModalOpen(true)}
                className="bg-purple-700 hover:bg-purple-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-purple-200" />
                <span>Tambah Jam Pelajaran</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Filter Kelas:</label>
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
              >
                <option value="ALL">Semua Kelas (1 s/d 6)</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.room_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Filter Hari:</label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white font-semibold"
              >
                <option value="ALL">Semua Hari (Senin - Jumat)</option>
                <option value={1}>Senin</option>
                <option value={2}>Selasa</option>
                <option value={3}>Rabu</option>
                <option value={4}>Kamis</option>
                <option value={5}>Jumat</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cari Pelajaran / Guru:</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchSchedule}
                  onChange={(e) => setSearchSchedule(e.target.value)}
                  placeholder="Ketik mapel atau nama guru..."
                  className="w-full pl-8 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Schedules Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-2.5">Hari & Jam</th>
                  <th className="px-3 py-2.5">Waktu (WIB)</th>
                  <th className="px-3 py-2.5">Kelas</th>
                  <th className="px-3 py-2.5">Mata Pelajaran</th>
                  <th className="px-3 py-2.5">Guru Pengampu</th>
                  <th className="px-3 py-2.5 text-center">Aksi Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => {
                  const cls = classes.find((c) => c.id === item.class_id);
                  const teacher = allStaff.find((s) => s.id === item.teacher_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2">
                        <span className="font-bold text-school-navy-950">
                          {DAY_NAMES[item.day_of_week] || `Hari ${item.day_of_week}`}
                        </span>
                        <span className="ml-1.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                          JP {item.period_number}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono font-semibold text-slate-600">
                        {item.start_time} - {item.end_time}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-slate-900">{cls?.name || item.class_id}</span>
                        <span className="block text-[10px] text-slate-400">{cls?.room_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-slate-800">{item.subject_name}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <img
                            src={teacher?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{teacher?.name || item.teacher_id}</div>
                            <div className="text-[10px] text-slate-400">{teacher?.specialty || teacher?.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingSchedule(item)}
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md border border-amber-200 transition-colors"
                            title="Edit Jadwal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(item.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 transition-colors"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSchedules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      Tidak ada jadwal yang sesuai dengan filter kelas / hari yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. UNIVERSAL TEMPLATE MANAGER */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Template Struktur Jadwal Pelajaran
              </h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                1 JP = 35 Menit
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">1. Skema Hari Reguler (Senin, Rabu, Jumat):</div>
                <div>• 07:30 - 08:00 WIB: Sholat Dhuha Bersama di Mushola</div>
                <div>• 08:00 WIB: Pelajaran Jam Ke-1 (JP 1) dimulai</div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-900">2. Skema Hari Tahfidz (Selasa & Kamis):</div>
                <div>• 07:30 - 08:30 WIB: Sholat Dhuha + Halaqah Tahfidz Qur'an</div>
                <div>• 08:30 WIB: Pelajaran Jam Ke-1 (JP 1) dimulai</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                Template Format Penomoran Surat Bersegmen
              </h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-mono font-bold text-school-navy-900 bg-white p-2 rounded border border-slate-200">
                &#123;no.surat&#125;/&#123;perihal&#125;/&#123;bulan&#125;/&#123;sekolah&#125;/&#123;tahun&#125;
              </div>
              <p className="text-[11px] text-slate-500">
                Variabel otomatis terisi saat staf TU menerbitkan surat keluar: nomor urut (no.surat), kode perihal (UND/SK/dsb), angka bulan (11), kode sekolah (SD-KR), dan tahun berjalan (2026).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. USER & MULTI-ROLE MANAGER */}
      {activeTab === 'users' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900">
                Direktori Staf Internal SD Khoirur Rooziqiin Bandung
              </h3>
              <p className="text-xs text-slate-500">
                Kelola hak akses multi-peran aditif dan tautan ID Telegram untuk bot asisten.
              </p>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
              {allStaff.length} Akun Staf Aktif
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-2.5">Foto & Nama Staf</th>
                  <th className="px-3 py-2.5">Email & No. HP</th>
                  <th className="px-3 py-2.5">Peran Aktif (Additive Multi-Role)</th>
                  <th className="px-3 py-2.5">Telegram ID</th>
                  <th className="px-3 py-2.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={staff.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div className="font-bold text-slate-900">{staff.name}</div>
                          <div className="text-[10px] text-slate-400">{staff.title || 'Tenaga Pendidik'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-slate-800">{staff.email}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{staff.phone}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {staff.roles.map((r) => (
                          <span key={r} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-700">
                      {staff.telegram_id ? (
                        <span className="text-emerald-700 font-bold">ID: {staff.telegram_id}</span>
                      ) : (
                        <span className="text-slate-400">Belum Terhubung</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => setEditingStaff(staff)}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-2.5 py-1 rounded text-[11px] font-bold"
                      >
                        Edit Peran
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. KENAIKAN KELAS OTOMATIS */}
      {activeTab === 'promotion' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-black text-lg text-school-navy-950">
              Mesin Kenaikan Kelas Otomatis & Rollover Tahun Ajaran
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Menaikkan seluruh siswa dari Kelas 1 ke 2, Kelas 2 ke 3, hingga Kelas 5 ke 6 secara batch, serta mengarsipkan siswa Kelas 6 sebagai Alumni sekolah.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
            <div className="font-bold text-slate-800">Skema Batch Rollover:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div>• Kelas 1 ➔ Kelas 2 ({classes.find((c) => c.id === 'c1')?.student_count} Siswa)</div>
              <div>• Kelas 2 ➔ Kelas 3 ({classes.find((c) => c.id === 'c2')?.student_count} Siswa)</div>
              <div>• Kelas 3 ➔ Kelas 4 ({classes.find((c) => c.id === 'c3')?.student_count} Siswa)</div>
              <div>• Kelas 4 ➔ Kelas 5 ({classes.find((c) => c.id === 'c4')?.student_count} Siswa)</div>
              <div>• Kelas 5 ➔ Kelas 6 ({classes.find((c) => c.id === 'c5')?.student_count} Siswa)</div>
              <div className="font-bold text-purple-700">
                • Kelas 6 ➔ Lulus / Alumni ({classes.find((c) => c.id === 'c6')?.student_count} Siswa)
              </div>
            </div>
          </div>

          {promotionSummary && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold">
              {promotionSummary}
            </div>
          )}

          <button
            onClick={handleRunClassPromotion}
            disabled={isPromoting}
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-black text-xs shadow-md transition-all inline-flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isPromoting ? 'animate-spin' : ''}`} />
            <span>{isPromoting ? 'Memproses Rollover...' : 'Jalankan Kenaikan Kelas Otomatis'}</span>
          </button>
        </div>
      )}

      {/* 5. BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto">
            <Download className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-black text-base text-school-navy-950">
              Pencadangan & Pemulihan Basis Data
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simpan seluruh snapshot tabel database (siswa, nilai, jurnal, transaksi kas, dan surat) dalam satu berkas JSON terenkripsi.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleFullBackup}
              className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-school-gold-400" />
              <span>Ekspor JSON Lengkap</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD SCHEDULE ITEM */}
      {isAddScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-600" />
                Tambah Jam Pelajaran Baru
              </h4>
              <button
                onClick={() => setIsAddScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewSchedule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Target:</label>
                  <select
                    value={newSchedule.class_id}
                    onChange={(e) => setNewSchedule({ ...newSchedule, class_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.room_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari:</label>
                  <select
                    value={newSchedule.day_of_week}
                    onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value={1}>Senin</option>
                    <option value={2}>Selasa</option>
                    <option value={3}>Rabu</option>
                    <option value={4}>Kamis</option>
                    <option value={5}>Jumat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke (JP):</label>
                  <select
                    value={newSchedule.period_number}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const standardTimes = PERIOD_TIMES[p] || { start: '08:00', end: '08:35' };
                      setNewSchedule({
                        ...newSchedule,
                        period_number: p,
                        start_time: standardTimes.start,
                        end_time: standardTimes.end,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <option key={p} value={p}>
                        JP {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai:</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai:</label>
                  <input
                    type="time"
                    required
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                <input
                  type="text"
                  required
                  value={newSchedule.subject_name}
                  onChange={(e) => setNewSchedule({ ...newSchedule, subject_name: e.target.value })}
                  placeholder="Ketik nama mata pelajaran..."
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_SUBJECTS.slice(0, 8).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setNewSchedule({ ...newSchedule, subject_name: subj })}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition-colors"
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guru Pengampu:</label>
                <select
                  required
                  value={newSchedule.teacher_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, teacher_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {allStaff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.specialty || st.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddScheduleModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
                >
                  Simpan Jadwal Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SCHEDULE ITEM */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                Edit Jadwal Jam Pelajaran
              </h4>
              <button
                onClick={() => setEditingSchedule(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSchedule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Target:</label>
                  <select
                    value={editingSchedule.class_id}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, class_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.room_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Hari:</label>
                  <select
                    value={editingSchedule.day_of_week}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, day_of_week: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    <option value={1}>Senin</option>
                    <option value={2}>Selasa</option>
                    <option value={3}>Rabu</option>
                    <option value={4}>Kamis</option>
                    <option value={5}>Jumat</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jam Ke (JP):</label>
                  <select
                    value={editingSchedule.period_number}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const standardTimes = PERIOD_TIMES[p] || { start: '08:00', end: '08:35' };
                      setEditingSchedule({
                        ...editingSchedule,
                        period_number: p,
                        start_time: standardTimes.start,
                        end_time: standardTimes.end,
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <option key={p} value={p}>
                        JP {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai:</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.start_time}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, start_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai:</label>
                  <input
                    type="time"
                    required
                    value={editingSchedule.end_time}
                    onChange={(e) => setEditingSchedule({ ...editingSchedule, end_time: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                <input
                  type="text"
                  required
                  value={editingSchedule.subject_name}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, subject_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {POPULAR_SUBJECTS.slice(0, 8).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setEditingSchedule({ ...editingSchedule, subject_name: subj })}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition-colors"
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Guru Pengampu:</label>
                <select
                  required
                  value={editingSchedule.teacher_id}
                  onChange={(e) => setEditingSchedule({ ...editingSchedule, teacher_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {allStaff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.specialty || st.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingSchedule(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Simpan Perubahan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT STAFF PERMISSIONS */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs animate-fadeIn">
            <h4 className="font-extrabold text-sm text-school-navy-900 border-b pb-2">
              Edit Multi-Peran & Tautan Telegram — {editingStaff.name}
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ID Telegram (Untuk Bot Webhook)</label>
              <input
                type="text"
                value={editingStaff.telegram_id || ''}
                onChange={(e) => setEditingStaff({ ...editingStaff, telegram_id: e.target.value })}
                placeholder="Contoh: 99881102"
                className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Pilih Peran Aktif (Additive Multi-Role):</label>
              <div className="grid grid-cols-2 gap-2">
                {availableRoles.map((role) => {
                  const isChecked = editingStaff.roles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleToggleStaffRole(role)}
                      className={`p-2 rounded-lg text-left font-bold border transition-all flex items-center gap-2 ${
                        isChecked
                          ? 'bg-purple-100 text-purple-900 border-purple-400'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-purple-600 w-3.5 h-3.5"
                      />
                      <span>{role}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStaffChanges}
                className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold"
              >
                Simpan Perubahan Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
