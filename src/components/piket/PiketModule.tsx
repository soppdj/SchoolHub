import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GuestBookEntry, PiketLapanganChecklist } from '../../types';

export const PiketModule: React.FC = () => {
  const {
    currentUser,
    allStaff,
    piketChecklists,
    guestBookEntries,
    classes,
    schedules,
    staffAttendance,
    assignSubstituteTeacher,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'lapangan' | 'kantor'>('lapangan');

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
    person_to_meet: 'Kepala Sekolah (Dr. H. Salman Farisi, M.Pd.)',
    phone_number: '',
  });

  const [guestList, setGuestList] = useState<GuestBookEntry[]>(guestBookEntries);

  const handleToggleChecklist = (field: keyof PiketLapanganChecklist) => {
    setChecklist(prev => ({ ...prev, [field]: !prev[field] }));
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
      person_to_meet: 'Kepala Sekolah (Dr. H. Salman Farisi, M.Pd.)',
      phone_number: '',
    });
    alert('✅ Buku Tamu Digital berhasil dicatat!');
  };

  return (
    <div className="space-y-4">
      
      {/* Header Selector: Piket Lapangan vs Piket Kantor */}
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('lapangan')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 ${
              activeTab === 'lapangan'
                ? 'bg-school-navy-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-school-gold-400" />
            <span>Guru Piket Lapangan (Ketertiban & Pengganti)</span>
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

        <div className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-lg">
          Petugas Aktif: <strong className="text-school-navy-900">{currentUser.name}</strong>
        </div>
      </div>

      {/* 1. GURU PIKET LAPANGAN */}
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
                10 November 2026
              </span>
            </div>

            <form onSubmit={handleSaveChecklist} className="space-y-4 text-xs">
              <div className="space-y-2.5">
                {[
                  { field: 'sapa_pagi_completed', label: '1. Sapa Pagi & Senyum di Gerbang Utama (07:15 - 07:30 WIB)', desc: 'Menyambut kedatangan siswa, cek kerapian seragam dan salaman tertib.' },
                  { field: 'dhuha_supervised', label: '2. Pengawasan Sholat Dhuha Bersama (07:30 - 08:00 WIB)', desc: 'Mengawasi wudhu di selasar mushola dan ketenangan sholat berjamaah.' },
                  { field: 'tahfidz_orderliness', label: '3. Ketertiban Halaqah Tahfidz Pagi', desc: 'Memastikan seluruh siswa tertib di kelompok halaqah masing-masing.' },
                  { field: 'istirahat_patrol', label: '4. Patroli Area Lapangan & Koridor Saat Istirahat', desc: 'Mencegah lari-lari berbahaya, bercanda fisik, dan memantau antrean kantin.' },
                  { field: 'facility_cleanliness_check', label: '5. Pemeriksaan Kebersihan Toilet & Halaman Sekolah', desc: 'Memastikan fasilitas air mengalir, toilet bersih, dan bebas sampah berserakan.' },
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
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
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
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md"
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
                  <div className="text-[11px] text-slate-500">Guru Utama: Ustadz Ilham Pratama (Izin Pelatihan)</div>
                </div>
                <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                  PANEL MERAH
                </span>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-slate-700 mb-1">Pilih Guru Pengganti yang Bebas:</label>
                <div className="space-y-1.5">
                  {allStaff.filter(s => s.roles.includes('Guru Mapel') || s.roles.includes('Developer')).slice(0, 3).map((free) => (
                    <button
                      key={free.id}
                      type="button"
                      onClick={() => {
                        assignSubstituteTeacher('c4', 'sch-4-2', free.id);
                        alert(`✅ Sukses menugaskan ${free.name} ke Kelas 4! Panel di Dashboard Bersama langsung menjadi Hijau.`);
                      }}
                      className="w-full text-left p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between transition-colors"
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

      {/* 2. GURU PIKET KANTOR (BUKU TAMU DIGITAL) */}
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
                  <option value="Kepala Sekolah (Dr. H. Salman Farisi, M.Pd.)">Kepala Sekolah (Dr. H. Salman Farisi, M.Pd.)</option>
                  <option value="Tata Usaha / Administrasi (Ibu Nurul Hidayati)">Tata Usaha / Administrasi (Ibu Nurul Hidayati)</option>
                  <option value="Wali Kelas 1 - 6">Wali Kelas 1 - 6</option>
                  <option value="Koordinator Sarpras">Koordinator Sarpras</option>
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
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md"
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

    </div>
  );
};
