import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SchoolClass, Student, KurikulumTP, StudentGrade, TahfidzProgress } from '../../types';
import { generateKurikulumMerdekaReportCardPdf } from '../../lib/pdfGenerator';

export const GuruModule: React.FC = () => {
  const {
    currentUser,
    classes,
    students,
    teachingJournals,
    recordTeachingJournal,
    staffAttendance,
    kurikulumTps,
    studentGrades,
    tahfidzProgress,
    shadowJournals,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'presensi_staf' | 'jurnal_mengajar' | 'tahfidz' | 'kurikulum_rapor'>('jurnal_mengajar');

  // Selected class for Jurnal & Gradebook
  const userClass = classes.find(c => c.wali_kelas_id === currentUser.id) || classes[0];
  const [selectedClassId, setSelectedClassId] = useState<string>(userClass.id);
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.class_id === selectedClassId);

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
  const todayAttendance = staffAttendance.find(a => a.user_id === currentUser.id && a.date === '2026-11-10');
  const [isCheckedIn, setIsCheckedIn] = useState(Boolean(todayAttendance?.check_in_time));
  const [checkInTime, setCheckInTime] = useState(todayAttendance?.check_in_time || '07:12');

  const handleAttendanceChange = (studentId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa') => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalForm.topic || !journalForm.learning_activity) {
      alert('Mohon lengkapi judul materi dan ringkasan aktivitas pembelajaran!');
      return;
    }

    const presentCount = classStudents.filter(s => (attendanceMap[s.id] || 'Hadir') === 'Hadir').length;
    const sickCount = classStudents.filter(s => attendanceMap[s.id] === 'Sakit').length;
    const permittedCount = classStudents.filter(s => attendanceMap[s.id] === 'Izin').length;
    const absentCount = classStudents.filter(s => attendanceMap[s.id] === 'Alpa').length;

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
        <div className="flex items-center gap-1.5">
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

        {/* Class Selector Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Pilih Kelas:</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-school-navy-900 bg-white"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name} ({cls.student_count} Siswa)
              </option>
            ))}
          </select>
        </div>
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
                    <option value={1}>Jam Ke-1 (08:00 - 08:35)</option>
                    <option value={2}>Jam Ke-2 (08:35 - 09:10)</option>
                    <option value={3}>Jam Ke-3 (09:25 - 10:00)</option>
                    <option value={4}>Jam Ke-4 (10:00 - 10:35)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <input
                    type="text"
                    value={journalForm.subject_name}
                    onChange={(e) => setJournalForm({ ...journalForm, subject_name: e.target.value })}
                    placeholder="Contoh: Bahasa Indonesia / Matematika"
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
                  placeholder="Contoh: Siswa antusias, Ahmad Fauzi didampingi Shadow Teacher mencapai target tugas"
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
                  Presensi Cepat Siswa
                </h3>
                <p className="text-[11px] text-slate-500">
                  Otomatis default Hadir. Klik tombol untuk menandai izin/sakit.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {classStudents.length} Siswa
              </span>
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
            </div>
          </div>

        </div>
      )}

      {/* 2. SETORAN TAHFIDZ QUR'AN */}
      {activeSubTab === 'tahfidz' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2 border-b pb-2">
              <Sparkles className="w-4 h-4 text-school-gold-600" />
              Catat Setoran Hafalan Qur'an / Muraja'ah
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
                const st = students.find(s => s.id === th.student_id);
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

      {/* 3. KURIKULUM MERDEKA & RAPOR PDF */}
      {activeSubTab === 'kurikulum_rapor' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-school-gold-600" />
                Capaian Pembelajaran Kurikulum Merdeka & Unduh Rapor PDF
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

      {/* 4. PRESENSI HARIAN STAF */}
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

          {/* Quick Check-in / Check-out Buttons */}
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
