import React, { useState } from 'react';
import {
  HeartHandshake,
  Star,
  Sparkles,
  Calendar,
  Smile,
  Brain,
  Layers,
  CheckCircle2,
  BookOpen,
  User,
  PlusCircle,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, ShadowTeacherJournal } from '../../types';

export const ShadowTeacherModule: React.FC = () => {
  const {
    currentUser,
    students,
    classes,
    shadowJournals,
    recordShadowJournal,
  } = useApp();

  // Find students with special needs
  const specialStudents = students.filter(s => s.has_special_needs);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(specialStudents[0]?.id || 's201');
  const selectedStudent = students.find(s => s.id === selectedStudentId) || specialStudents[0];
  const studentClass = classes.find(c => c.id === selectedStudent?.class_id);

  // Form state for 4 dimensions
  const [formData, setFormData] = useState({
    subject_name: 'Matematika & Literasi',
    focus_rating: 4 as 1 | 2 | 3 | 4 | 5,
    focus_notes: 'Fokus terjaga selama 25 menit sesi manipulasi objek konkrit. Mampu menyelesaikan 4 dari 5 target soal adaptif.',
    behavior_rating: 5 as 1 | 2 | 3 | 4 | 5,
    behavior_notes: 'Tertib mengikuti instruksi, tidak ada tantrum, dapat duduk tenang bersama teman sekelas.',
    emotion_rating: 4 as 1 | 2 | 3 | 4 | 5,
    emotion_notes: 'Emosi stabil dan ceria. Menunjukkan ekspresi bangga ketika diapresiasi oleh guru kelas.',
    material_adaptation: 'Materi penjumlahan dua angka diabstraksikan menjadi hitungan fisik dengan stik warna-warni dan kartu angka bergambar.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !studentClass) return;

    await recordShadowJournal({
      student_id: selectedStudent.id,
      class_id: studentClass.id,
      shadow_teacher_id: currentUser.id,
      date: new Date().toISOString().slice(0, 10),
      subject_name: formData.subject_name,
      focus_rating: formData.focus_rating,
      focus_notes: formData.focus_notes,
      behavior_rating: formData.behavior_rating,
      behavior_notes: formData.behavior_notes,
      emotion_rating: formData.emotion_rating,
      emotion_notes: formData.emotion_notes,
      material_adaptation: formData.material_adaptation,
    });

    alert('✅ Jurnal Pendampingan 4 Dimensi berhasil dicatat! Data langsung tersinkron ke Wali Kelas dan popup Live Dashboard.');
  };

  const studentJournals = shadowJournals.filter(j => j.student_id === selectedStudentId);

  return (
    <div className="space-y-4">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 rounded-2xl p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              Pendidikan Inklusif
            </span>
            <span className="text-rose-200 text-xs font-semibold">SD Khoirur Rooziqiin Bandung</span>
          </div>
          <h2 className="text-xl font-extrabold mt-1">Jurnal Pendampingan Individu Siswa (GPK)</h2>
          <p className="text-xs text-white/90 max-w-2xl mt-0.5">
            Dokumentasi terstruktur perkembangan harian siswa berkebutuhan khusus pada 4 dimensi: Fokus, Perilaku, Emosi, dan Adaptasi Materi.
          </p>
        </div>

        {/* Student Selector */}
        <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/20 text-xs">
          <label className="block text-[11px] font-semibold text-rose-100 mb-1">Pilih Siswa Didampingi:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="border-0 rounded-lg px-3 py-1.5 font-bold text-slate-900 bg-white"
          >
            {specialStudents.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name} ({classes.find(c => c.id === st.class_id)?.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Historical Progress Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Input Form across 4 Dimensions (Col 7) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-600" />
              Input Jurnal Harian — {selectedStudent?.name}
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Kelas: {studentClass?.name}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran yang Didampingi</label>
              <input
                type="text"
                value={formData.subject_name}
                onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-900"
              />
            </div>

            {/* Dimension 1: Fokus */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-blue-600" />
                  1. Perkembangan Fokus & Rentang Atensi (Skor 1 - 5):
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, focus_rating: star as any })}
                      className={`p-1 rounded transition-colors ${
                        formData.focus_rating >= star ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-bold text-blue-800 ml-1">({formData.focus_rating}/5)</span>
                </div>
              </div>
              <textarea
                rows={2}
                value={formData.focus_notes}
                onChange={(e) => setFormData({ ...formData, focus_notes: e.target.value })}
                placeholder="Catat berapa menit atensi bertahan, pemicu distraksi, dan cara mengarahkan kembali..."
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>

            {/* Dimension 2: Perilaku */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  2. Regulasi Perilaku & Kepatuhan Instruksi (Skor 1 - 5):
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, behavior_rating: star as any })}
                      className={`p-1 rounded transition-colors ${
                        formData.behavior_rating >= star ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-bold text-emerald-800 ml-1">({formData.behavior_rating}/5)</span>
                </div>
              </div>
              <textarea
                rows={2}
                value={formData.behavior_notes}
                onChange={(e) => setFormData({ ...formData, behavior_notes: e.target.value })}
                placeholder="Catat perilaku duduk, interaksi dengan teman sekitar, dan respons terhadap instruksi..."
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>

            {/* Dimension 3: Emosi */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-amber-600" />
                  3. Kondisi Emosi & Ekspresi Diri (Skor 1 - 5):
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, emotion_rating: star as any })}
                      className={`p-1 rounded transition-colors ${
                        formData.emotion_rating >= star ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-bold text-amber-800 ml-1">({formData.emotion_rating}/5)</span>
                </div>
              </div>
              <textarea
                rows={2}
                value={formData.emotion_notes}
                onChange={(e) => setFormData({ ...formData, emotion_notes: e.target.value })}
                placeholder="Catat suasana hati, tingkat kecemasan, atau kepuasan emosional saat belajar..."
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>

            {/* Dimension 4: Adaptasi Materi */}
            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                4. Bentuk Adaptasi & Modifikasi Materi Pembelajaran:
              </span>
              <textarea
                rows={2}
                value={formData.material_adaptation}
                onChange={(e) => setFormData({ ...formData, material_adaptation: e.target.value })}
                placeholder="Jelaskan modifikasi yang dilakukan agar materi Kurikulum Merdeka dapat diakses anak..."
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-700 hover:bg-rose-800 text-white py-2.5 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Jurnal Pendampingan & Sinkronkan ke Rapor</span>
            </button>
          </form>
        </div>

        {/* Historical Progress & Logs for this student (Col 5) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h3 className="font-extrabold text-sm text-school-navy-900">
                Riwayat Pendampingan
              </h3>
              <p className="text-[11px] text-slate-500">
                Log harian yang akan otomatis terlampir di lembar rapor.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {studentJournals.length} Catatan
            </span>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {studentJournals.map((j) => (
              <div key={j.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-extrabold text-slate-900">{j.subject_name}</span>
                  <span className="text-[10px] text-slate-500">{new Date(j.date).toLocaleDateString('id-ID')}</span>
                </div>

                <div className="grid grid-cols-3 gap-1 text-[11px] text-center font-bold">
                  <div className="bg-blue-100 text-blue-800 py-0.5 rounded">
                    Fokus: {j.focus_rating}/5
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 py-0.5 rounded">
                    Perilaku: {j.behavior_rating}/5
                  </div>
                  <div className="bg-amber-100 text-amber-800 py-0.5 rounded">
                    Emosi: {j.emotion_rating}/5
                  </div>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Fokus:</strong> {j.focus_notes}
                </p>

                <div className="text-[11px] text-purple-900 bg-purple-50 p-2 rounded-lg border border-purple-200">
                  <strong>Adaptasi:</strong> {j.material_adaptation}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
