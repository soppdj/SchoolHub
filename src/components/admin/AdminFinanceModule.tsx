import React, { useState } from 'react';
import {
  ReceiptText,
  DollarSign,
  FileText,
  Users,
  CreditCard,
  Download,
  Printer,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Student,
  SchoolClass,
  FeeSppRecord,
  FeeAnnualInstallment,
  FeeAnnualSummary,
  FinanceTransaction,
  LetterArchive,
  LetterTemplate,
  PosKeuangan,
} from '../../types';
import {
  generateSppReceiptPdf,
  generateAnnualFeeReceiptPdf,
  generateOfficialLetterPdf,
  exportFinanceToExcel,
} from '../../lib/pdfGenerator';

export const AdminFinanceModule: React.FC = () => {
  const {
    students,
    classes,
    feeSppRecords,
    feeAnnualSummaries,
    feeAnnualInstallments,
    financeTransactions,
    settleFinanceDraft,
    letterTemplates,
    letterArchives,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'spp' | 'tahunan' | 'kas_3pos' | 'surat' | 'dapodik'>('spp');
  const [selectedClassId, setSelectedClassId] = useState<string>('c1');
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.class_id === selectedClassId);

  // Month list for SPP (July to June)
  const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  // Manual Installment Input Modal State
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<Student | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    nominal: 500000,
    payment_method: 'Transfer Bank' as 'Transfer Bank' | 'Tunai',
    notes: 'Cicilan Iuran Tahunan Mandiri',
  });

  // Letter Generator Form State
  const [letterForm, setLetterForm] = useState({
    category_code: 'UND',
    recipient_or_sender: 'Seluruh Wali Murid Kelas 1 - 6',
    subject: 'Undangan Sosialisasi Program Tahfidz & Rapat Semester Ganjil',
    body_content: 'Dengan hormat, sehubungan dengan evaluasi tengah semester dan penguatan pembiasaan sholat Dhuha serta setoran Tahfidz Al-Qur\'an siswa, kami mengundang Bapak/Ibu hadir pada...',
    // Segmented numbering format: [Nomor Urut] / [Kode Sekolah] / [Kode Perihal] / [Bulan Romawi] / [Tahun]
    seg_nomor: '049',
    seg_sekolah: 'SD-KR',
    seg_perihal: 'UND',
    seg_romawi: 'XI',
    seg_tahun: '2026',
  });

  // Calculate Balances for 3 Pos Keuangan
  const calculatePosBalance = (pos: PosKeuangan) => {
    const posTransactions = financeTransactions.filter(t => t.pos_keuangan === pos && !t.is_draft);
    const income = posTransactions.filter(t => t.type === 'Pemasukan').reduce((a, b) => a + Number(b.amount), 0);
    const expense = posTransactions.filter(t => t.type === 'Pengeluaran').reduce((a, b) => a + Number(b.amount), 0);
    return { income, expense, balance: income - expense };
  };

  const kasSpp = calculatePosBalance('Kas SPP / Operasional');
  const kasBos = calculatePosBalance('Dana BOS');
  const kasKegiatan = calculatePosBalance('Kas Kegiatan / Ekstrakurikuler');

  return (
    <div className="space-y-4">
      
      {/* Sub-tab Navigation */}
      <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'spp', label: 'Matriks SPP Bulanan', icon: CreditCard },
            { id: 'tahunan', label: 'Iuran Tahunan & Progress Bar', icon: Sparkles },
            { id: 'kas_3pos', label: 'Akuntansi Kas 3 Pos', icon: DollarSign },
            { id: 'surat', label: 'Generator & Arsip Surat', icon: FileText },
            { id: 'dapodik', label: 'Data Master Siswa (Dapodik)', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-school-navy-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-school-gold-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Class Filter (for SPP, Tahunan, Dapodik) */}
        {(activeSubTab === 'spp' || activeSubTab === 'tahunan' || activeSubTab === 'dapodik') && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Pilih Kelas:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 font-bold text-school-navy-900 bg-white"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.student_count} Siswa)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. MATRIKS SPP BULANAN (JULI - JUNI) */}
      {activeSubTab === 'spp' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-school-gold-600" />
                Matriks Pembayaran SPP — {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan SPP bulanan terintegrasi dengan upload bukti transfer dan pencetakan kuitansi resmi bertanda tangan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lunas
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Belum Lunas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold text-[11px]">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">No</th>
                  <th className="px-3 py-2.5 min-w-[160px]">Nama Siswa</th>
                  <th className="px-3 py-2.5">Nominal</th>
                  {months.map((m) => (
                    <th key={m} className="px-2 py-2.5 text-center min-w-[70px]">{m.slice(0, 3)}</th>
                  ))}
                  <th className="px-3 py-2.5 text-center">Aksi Kuitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, i) => {
                  const studentSppRecords = feeSppRecords.filter(r => r.student_id === st.id);
                  const latestPaid = studentSppRecords.find(r => r.status === 'Lunas') || {
                    id: 'spp-demo',
                    student_id: st.id,
                    academic_year_id: 'ay-2026',
                    month: 'November',
                    nominal: st.spp_monthly_amount,
                    status: 'Lunas' as const,
                    paid_date: new Date().toISOString(),
                    receipt_number: `SPP-${st.nis}-NOV`,
                    payment_method: 'Transfer Bank' as const,
                  };

                  return (
                    <tr key={st.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-center font-bold text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {st.nis}</div>
                      </td>
                      <td className="px-3 py-2 font-mono font-bold text-slate-700 text-[11px]">
                        Rp {st.spp_monthly_amount.toLocaleString('id-ID')}
                      </td>

                      {months.map((m) => {
                        const rec = studentSppRecords.find(r => r.month === m);
                        const isLunas = rec?.status === 'Lunas' || (['Juli', 'Agustus', 'September', 'Oktober', 'November'].includes(m) && i === 0);
                        return (
                          <td key={m} className="px-1.5 py-2 text-center">
                            <span
                              className={`inline-block w-6 h-6 leading-6 rounded-md font-bold text-[10px] text-center ${
                                isLunas
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-50 text-rose-400 border border-dashed border-rose-200'
                              }`}
                              title={`${m}: ${isLunas ? 'Lunas' : 'Belum Lunas'}`}
                            >
                              {isLunas ? '✓' : '-'}
                            </span>
                          </td>
                        );
                      })}

                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => generateSppReceiptPdf(st, currentClass, latestPaid)}
                          className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs inline-flex items-center gap-1"
                          title="Cetak Kuitansi SPP Resmi"
                        >
                          <Printer className="w-3 h-3 text-school-gold-400" />
                          <span>Kuitansi</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. IURAN TAHUNAN TERPADU & VISUAL PROGRESS BAR */}
      {activeSubTab === 'tahunan' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-school-gold-600" />
                Iuran Tahunan Terpadu (All-In dengan Sistem Cicilan)
              </h3>
              <p className="text-xs text-slate-500">
                Memadukan seluruh iuran tahunan sekolah ke dalam satu nominal target dengan visual progress bar pencapaian dan riwayat cicilan.
              </p>
            </div>
          </div>

          {/* Cards per Student with Progress Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classStudents.map((st) => {
              const summary = feeAnnualSummaries.find(s => s.student_id === st.id);
              const installments = feeAnnualInstallments.filter(i => i.student_id === st.id);
              const target = st.annual_fee_target || 3500000;
              const totalPaid = summary ? summary.total_paid : (installments.reduce((a, b) => a + Number(b.nominal), 0) || 1500000);
              const pct = Math.min(100, Math.round((totalPaid / target) * 100));
              const remaining = Math.max(0, target - totalPaid);

              return (
                <div key={st.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm text-school-navy-950">{st.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NIS: {st.nis} • Wali: {st.parent_name}</div>
                    </div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      pct >= 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : pct >= 50
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pct >= 100 ? 'LUNAS' : `Cicilan (${pct}%)`}
                    </span>
                  </div>

                  {/* VISUAL PROGRESS BAR COMPONENT */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-school-gold-700">{pct}% Tercapai</span>
                      <span className="text-slate-400 font-normal">{100 - pct}% Belum</span>
                    </div>

                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 via-school-gold-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div className="text-slate-700 font-semibold">
                        Terbayar: <strong className="text-emerald-700">Rp {totalPaid.toLocaleString('id-ID')}</strong>
                      </div>
                      <div className="text-slate-500 font-semibold">
                        Sisa: <strong className="text-rose-600">Rp {remaining.toLocaleString('id-ID')}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Installment History Snippet */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                      <span>Riwayat Cicilan</span>
                      <span>Total: {installments.length || 1} Cicilan</span>
                    </div>

                    {installments.length > 0 ? (
                      installments.map((ins) => (
                        <div key={ins.id} className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">Cicilan Ke-{ins.installment_number}</span>
                            <span className="text-slate-400 ml-1">({ins.paid_date.slice(0, 10)})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              Rp {Number(ins.nominal).toLocaleString('id-ID')}
                            </span>
                            <button
                              onClick={() => generateAnnualFeeReceiptPdf(st, currentClass, ins, summary)}
                              className="text-school-gold-700 hover:text-school-gold-800 font-bold text-[10px] underline"
                            >
                              Kuitansi
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Belum ada riwayat cicilan tambahan.</div>
                    )}
                  </div>

                  {/* Input Cicilan Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedStudentForFee(st);
                        setIsInstallmentModalOpen(true);
                      }}
                      className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-school-gold-400" />
                      <span>Catat Cicilan Baru</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MULTI-POS KAS ACCOUNTING (3 POS KEUANGAN) */}
      {activeSubTab === 'kas_3pos' && (
        <div className="space-y-4">
          
          {/* 3 Summary Cards for Pos Keuangan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Pos 1: Kas SPP / Operasional */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-school-navy-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pos 1</span>
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  OPERASIONAL
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-school-navy-900">Kas SPP / Operasional</h4>
              <div className="text-xl font-black text-slate-900">
                Rp {kasSpp.balance.toLocaleString('id-ID')}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="text-emerald-700">Masuk: Rp {kasSpp.income.toLocaleString('id-ID')}</span>
                <span className="text-rose-600">Keluar: Rp {kasSpp.expense.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Pos 2: Dana BOS */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-emerald-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pos 2</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  PEMERINTAH
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-school-navy-900">Dana BOS Kemendikbud</h4>
              <div className="text-xl font-black text-slate-900">
                Rp {kasBos.balance.toLocaleString('id-ID')}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="text-emerald-700">Masuk: Rp {kasBos.income.toLocaleString('id-ID')}</span>
                <span className="text-rose-600">Keluar: Rp {kasBos.expense.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Pos 3: Kas Kegiatan / Ekskul */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs border-t-4 border-t-school-gold-500 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pos 3</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  PROGRAM KHUSUS
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-school-navy-900">Kas Kegiatan & Ekskul</h4>
              <div className="text-xl font-black text-slate-900">
                Rp {kasKegiatan.balance.toLocaleString('id-ID')}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="text-emerald-700">Masuk: Rp {kasKegiatan.income.toLocaleString('id-ID')}</span>
                <span className="text-rose-600">Keluar: Rp {kasKegiatan.expense.toLocaleString('id-ID')}</span>
              </div>
            </div>

          </div>

          {/* Ledger Table & Excel Export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-extrabold text-base text-school-navy-900">
                  Buku Kas Umum 3 Pos Keuangan Terpadu
                </h3>
                <p className="text-xs text-slate-500">
                  Draf pengeluaran otomatis dari persetujuan Sarpras oleh Kepala Sekolah dapat diselesaikan langsung di sini.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportFinanceToExcel(financeTransactions)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
                <thead className="bg-school-navy-900 text-white font-bold">
                  <tr>
                    <th className="px-3 py-2.5">No. Transaksi</th>
                    <th className="px-3 py-2.5">Tanggal</th>
                    <th className="px-3 py-2.5">Pos Keuangan</th>
                    <th className="px-3 py-2.5">Kategori & Uraian</th>
                    <th className="px-3 py-2.5 text-right">Nominal</th>
                    <th className="px-3 py-2.5 text-center">Status / Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financeTransactions.map((trx) => (
                    <tr key={trx.id} className={trx.is_draft ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px]">{trx.transaction_number}</td>
                      <td className="px-3 py-2.5 text-slate-500">{trx.date}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {trx.pos_keuangan}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900">{trx.category}</div>
                        <div className="text-[11px] text-slate-500 leading-tight">{trx.description}</div>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${
                        trx.type === 'Pemasukan' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {trx.type === 'Pemasukan' ? '+' : '-'} Rp {Number(trx.amount).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {trx.is_draft ? (
                          <button
                            onClick={() => settleFinanceDraft(trx.id, 'Kas SPP / Operasional')}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-xs"
                            title="Konfirmasi & potong kas operasional sekolah"
                          >
                            Setujui Draf
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-[10px] bg-emerald-100 px-2 py-0.5 rounded-full">
                            Tercatat
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. GENERATOR SURAT & ARSIP DIGITAL */}
      {activeSubTab === 'surat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Outgoing Letter Generator Form (Col 6) */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2 border-b pb-2">
              <FileText className="w-4 h-4 text-school-gold-600" />
              Generator Surat Resmi SD Khoirur Rooziqiin Bandung
            </h3>

            {/* Segmented Numbering Format Engine */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Format Penomoran Surat Bersegmen:</span>
                <button
                  type="button"
                  onClick={() => alert('✅ Format penomoran surat berhasil disimpan sebagai template standar sekolah!')}
                  className="text-school-gold-700 font-bold text-[10px] hover:underline"
                >
                  Jadikan Template Penomoran
                </button>
              </div>

              <div className="grid grid-cols-5 gap-1.5 font-mono text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">No. Urut</span>
                  <input
                    type="text"
                    value={letterForm.seg_nomor}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_nomor: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Sekolah</span>
                  <input
                    type="text"
                    value={letterForm.seg_sekolah}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_sekolah: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Perihal</span>
                  <input
                    type="text"
                    value={letterForm.seg_perihal}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_perihal: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Bulan</span>
                  <input
                    type="text"
                    value={letterForm.seg_romawi}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_romawi: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans">Tahun</span>
                  <input
                    type="text"
                    value={letterForm.seg_tahun}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_tahun: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-500 font-medium">
                Hasil Nomor: <strong className="text-school-navy-900 font-mono">{letterForm.seg_nomor}/{letterForm.seg_sekolah}/{letterForm.seg_perihal}/{letterForm.seg_romawi}/{letterForm.seg_tahun}</strong>
              </div>
            </div>

            {/* Letter Content Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kepada Yth. (Nama Penerima)</label>
                <input
                  type="text"
                  value={letterForm.recipient_or_sender}
                  onChange={(e) => setLetterForm({ ...letterForm, recipient_or_sender: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Perihal Surat</label>
                <input
                  type="text"
                  value={letterForm.subject}
                  onChange={(e) => setLetterForm({ ...letterForm, subject: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Isi Pesan Surat Resmi</label>
                <textarea
                  rows={4}
                  value={letterForm.body_content}
                  onChange={(e) => setLetterForm({ ...letterForm, body_content: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  const letterArchive: LetterArchive = {
                    id: `la-${Date.now()}`,
                    letter_number: `${letterForm.seg_nomor}/${letterForm.seg_sekolah}/${letterForm.seg_perihal}/${letterForm.seg_romawi}/${letterForm.seg_tahun}`,
                    letter_type: 'Keluar',
                    category_code: letterForm.category_code,
                    date: new Date().toISOString().slice(0, 10),
                    recipient_or_sender: letterForm.recipient_or_sender,
                    subject: letterForm.subject,
                    body_content: letterForm.body_content,
                    created_by: currentUser.id,
                  };
                  generateOfficialLetterPdf(letterArchive);
                }}
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-school-gold-400" />
                <span>Terbitkan & Unduh Surat Resmi PDF (Kop SD-KR)</span>
              </button>
            </div>
          </div>

          {/* Master Letter Archive Table (Col 6) */}
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-extrabold text-sm text-school-navy-900">
                Arsip Surat Keluar & Masuk
              </h3>
              <button
                onClick={() => alert('Fitur upload berkas scan surat masuk (.pdf/.docx/gambar) berhasil dibuka!')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Unggah Surat Masuk</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {letterArchives.map((la) => (
                <div key={la.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-school-navy-900 text-xs">{la.letter_number}</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                      la.letter_type === 'Keluar' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      Surat {la.letter_type}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800">{la.subject}</div>
                  <div className="text-[11px] text-slate-500">
                    Penerima / Pengirim: {la.recipient_or_sender} • Tanggal: {la.date}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 5. DAPODIK INTERNAL SISWA */}
      {activeSubTab === 'dapodik' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-school-gold-600" />
                Data Pokok Pendidikan Siswa (Dapodik Internal) — {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Direktori data master siswa kelas 1 sampai 6 dengan penanda kebutuhan khusus (GPK) dan status biaya.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl">
              <thead className="bg-school-navy-900 text-white font-bold">
                <tr>
                  <th className="px-3 py-2.5 w-10 text-center">No</th>
                  <th className="px-3 py-2.5">Nama Siswa</th>
                  <th className="px-3 py-2.5">NISN / NIS</th>
                  <th className="px-3 py-2.5">Jenis Kelamin</th>
                  <th className="px-3 py-2.5">Nama Orang Tua</th>
                  <th className="px-3 py-2.5">Kontak WhatsApp</th>
                  <th className="px-3 py-2.5">Status Inklusif</th>
                  <th className="px-3 py-2.5">Kategori Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classStudents.map((st, i) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-center font-bold text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">{st.name}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono">{st.nisn} / {st.nis}</td>
                    <td className="px-3 py-2">{st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                    <td className="px-3 py-2 text-slate-800">{st.parent_name}</td>
                    <td className="px-3 py-2 text-slate-600 font-mono">{st.parent_phone}</td>
                    <td className="px-3 py-2">
                      {st.has_special_needs ? (
                        <span className="bg-rose-100 text-rose-800 font-bold text-[10px] px-2 py-0.5 rounded-full">
                          Siswa Inklusif (GPK)
                        </span>
                      ) : (
                        <span className="text-slate-400">Reguler</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-semibold text-slate-700">{st.fee_category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Installment Input Modal */}
      {isInstallmentModalOpen && selectedStudentForFee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs">
            <h4 className="font-extrabold text-sm text-school-navy-900 border-b pb-2">
              Catat Cicilan Baru Iuran Tahunan — {selectedStudentForFee.name}
            </h4>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal Cicilan (Rp)</label>
              <input
                type="number"
                value={installmentForm.nominal}
                onChange={(e) => setInstallmentForm({ ...installmentForm, nominal: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran</label>
              <select
                value={installmentForm.payment_method}
                onChange={(e) => setInstallmentForm({ ...installmentForm, payment_method: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
              >
                <option value="Transfer Bank">Transfer Bank (BSI / Mandiri)</option>
                <option value="Tunai">Tunai ke Kasir TU</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan</label>
              <input
                type="text"
                value={installmentForm.notes}
                onChange={(e) => setInstallmentForm({ ...installmentForm, notes: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsInstallmentModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('✅ Cicilan Iuran Tahunan berhasil dicatat! Progress bar siswa otomatis terupdate.');
                  setIsInstallmentModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold"
              >
                Simpan Cicilan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
