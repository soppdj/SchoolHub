import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserProfile } from '../../types';
import { exportFullSystemBackup } from '../../lib/pdfGenerator';
import { db } from '../../lib/db';

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

  const [activeTab, setActiveTab] = useState<'templates' | 'users' | 'promotion' | 'backup'>('templates');

  // Edit User Modal State
  const [editingStaff, setEditingStaff] = useState<UserProfile | null>(null);

  // Class Promotion Wizard State
  const [isPromoting, setIsPromoting] = useState(false);
  const [promotionSummary, setPromotionSummary] = useState<string | null>(null);

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

  // 1. Automated Academic Year & Class Promotion Engine (Kenaikan Kelas Otomatis)
  const handleRunClassPromotion = async () => {
    const confirmRun = window.confirm(
      '⚠️ PERINGATAN KENAIKAN KELAS OTOMATIS:\n\nProses ini akan menaikkan seluruh siswa:\n• Kelas 1 -> Kelas 2\n• Kelas 2 -> Kelas 3\n• Kelas 3 -> Kelas 4\n• Kelas 4 -> Kelas 5\n• Kelas 5 -> Kelas 6\n• Kelas 6 -> Dikeluarkan sebagai ALUMNI\n\nApakah Anda yakin ingin memproses rollover tahun ajaran baru?'
    );
    if (!confirmRun) return;

    setIsPromoting(true);

    try {
      // Execute promotion in Dexie database
      let promotedCount = 0;
      let graduatedCount = 0;

      for (const st of students) {
        const curCls = classes.find(c => c.id === st.class_id);
        if (!curCls) continue;

        if (curCls.grade_level === 6) {
          // Graduate to Alumni
          await db.students.update(st.id, {
            class_id: 'alumni',
            fee_category: 'Reguler',
          });
          graduatedCount++;
        } else {
          // Promote to next class
          const nextGrade = curCls.grade_level + 1;
          const nextCls = classes.find(c => c.grade_level === nextGrade);
          if (nextCls) {
            await db.students.update(st.id, {
              class_id: nextCls.id,
            });
            promotedCount++;
          }
        }
      }

      setPromotionSummary(`🎉 Berhasil menaikkan ${promotedCount} siswa ke jenjang kelas berikutnya dan meluluskan ${graduatedCount} siswa Kelas 6 ke arsip Alumni!`);
      alert(`Kenaikan Kelas Otomatis Selesai!\n${promotedCount} siswa naik kelas, ${graduatedCount} siswa Kelas 6 lulus.`);
    } catch (err) {
      console.error(err);
      alert('Gagal memproses kenaikan kelas otomatis.');
    } finally {
      setIsPromoting(false);
    }
  };

  // 2. Full System Backup Snapshot
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
      ? current.filter(r => r !== role)
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
          <h2 className="text-xl font-extrabold mt-1">Universal Control Center & Template Manager</h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
            Manajemen hak akses multi-peran ~15 staf, mesin kenaikan kelas otomatis, penomoran surat bersegmen, dan backup database menyeluruh.
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

      {/* 1. UNIVERSAL TEMPLATE MANAGER */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Template 1: Master Schedule Structure */}
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

          {/* Template 2: Outgoing Letter Format */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-purple-600" />
                Template Format Penomoran Surat Bersegmen
              </h3>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-mono font-bold text-school-navy-900 bg-white p-2 rounded border border-slate-200">
                &#123;nomor&#125;/SD-KR/&#123;kode&#125;/&#123;romawi&#125;/&#123;tahun&#125;
              </div>
              <p className="text-[11px] text-slate-500">
                Variabel otomatis terisi saat staf TU menerbitkan surat keluar: nomor urut bertambah otomatis, kode perihal sesuai kategori, dan angka romawi menyesuaikan bulan berjalan.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* 2. USER & MULTI-ROLE MANAGER */}
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

      {/* 3. KENAIKAN KELAS OTOMATIS */}
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
              <div>• Kelas 1 ➔ Kelas 2 ({classes.find(c => c.id === 'c1')?.student_count} Siswa)</div>
              <div>• Kelas 2 ➔ Kelas 3 ({classes.find(c => c.id === 'c2')?.student_count} Siswa)</div>
              <div>• Kelas 3 ➔ Kelas 4 ({classes.find(c => c.id === 'c3')?.student_count} Siswa)</div>
              <div>• Kelas 4 ➔ Kelas 5 ({classes.find(c => c.id === 'c4')?.student_count} Siswa)</div>
              <div>• Kelas 5 ➔ Kelas 6 ({classes.find(c => c.id === 'c5')?.student_count} Siswa)</div>
              <div className="font-bold text-purple-700">• Kelas 6 ➔ Lulus / Alumni ({classes.find(c => c.id === 'c6')?.student_count} Siswa)</div>
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

      {/* 4. BACKUP & RESTORE */}
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

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs">
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
