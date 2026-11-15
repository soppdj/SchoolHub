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
  Edit2,
  Trash2,
  Eye,
  X,
  Image as ImageIcon,
  FileCheck,
  Check,
  RotateCcw,
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
import { db } from '../../lib/db';
import * as XLSX from 'xlsx';

export const AdminFinanceModule: React.FC = () => {
  const {
    students,
    classes,
    feeSppRecords,
    feeAnnualSummaries,
    feeAnnualInstallments,
    financeTransactions,
    settleFinanceDraft,
    letterArchives,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'spp' | 'tahunan' | 'kas_3pos' | 'surat' | 'dapodik'>('spp');
  const [selectedClassId, setSelectedClassId] = useState<string>('c1');
  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const classStudents = students.filter(s => s.class_id === selectedClassId);

  // Month list for SPP (July to June)
  const months = ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  // -------------------------------------------------------------
  // 1. SPP EDIT MODAL STATE
  // -------------------------------------------------------------
  const [editingSppRecord, setEditingSppRecord] = useState<{
    student: Student;
    month: string;
    record?: FeeSppRecord;
  } | null>(null);

  const [sppForm, setSppForm] = useState({
    status: 'Lunas' as 'Lunas' | 'Belum Lunas',
    nominal: 350000,
    paid_date: '2026-11-10',
    payment_method: 'Transfer Bank' as 'Transfer Bank' | 'Tunai',
    receipt_number: '',
    proof_file_url: '',
    notes: '',
  });

  const handleOpenSppModal = (student: Student, month: string, record?: FeeSppRecord) => {
    const isLunasDefault = record?.status === 'Lunas' || (!record && ['Juli', 'Agustus', 'September', 'Oktober', 'November'].includes(month) && student.id === 's101');
    const nominalDefault = record?.nominal || student.spp_monthly_amount || 350000;
    const paidDateDefault = record?.paid_date ? record.paid_date.slice(0, 10) : '2026-11-10';
    const receiptDefault = record?.receipt_number || `SPP-${student.nis}-${month.slice(0, 3).toUpperCase()}-26`;
    const proofDefault = record?.proof_file_url || (isLunasDefault ? 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400' : '');

    setSppForm({
      status: isLunasDefault ? 'Lunas' : 'Belum Lunas',
      nominal: nominalDefault,
      paid_date: paidDateDefault,
      payment_method: record?.payment_method || 'Transfer Bank',
      receipt_number: receiptDefault,
      proof_file_url: proofDefault,
      notes: '',
    });

    setEditingSppRecord({ student, month, record });
  };

  const handleSaveSpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSppRecord) return;

    const sppId = editingSppRecord.record?.id || `spp-${editingSppRecord.student.id}-${editingSppRecord.month.toLowerCase()}`;
    const updatedRecord: FeeSppRecord = {
      id: sppId,
      student_id: editingSppRecord.student.id,
      academic_year_id: 'ay-2026',
      month: editingSppRecord.month,
      nominal: Number(sppForm.nominal),
      status: sppForm.status,
      paid_date: sppForm.status === 'Lunas' ? (sppForm.paid_date || new Date().toISOString()) : undefined,
      payment_method: sppForm.payment_method,
      receipt_number: sppForm.receipt_number,
      proof_file_url: sppForm.proof_file_url || undefined,
      recorded_by: currentUser?.name || 'Administrator',
    };

    await db.fee_spp.put(updatedRecord);
    setEditingSppRecord(null);
  };

  const handleResetSppRecord = async () => {
    if (!editingSppRecord) return;
    if (editingSppRecord.record?.id) {
      await db.fee_spp.delete(editingSppRecord.record.id);
    } else {
      const sppId = `spp-${editingSppRecord.student.id}-${editingSppRecord.month.toLowerCase()}`;
      await db.fee_spp.put({
        id: sppId,
        student_id: editingSppRecord.student.id,
        academic_year_id: 'ay-2026',
        month: editingSppRecord.month,
        nominal: editingSppRecord.student.spp_monthly_amount || 350000,
        status: 'Belum Lunas',
        recorded_by: currentUser?.name || 'Administrator',
      });
    }
    setEditingSppRecord(null);
  };

  // -------------------------------------------------------------
  // 2. IURAN TAHUNAN MODAL & PROOF STATE
  // -------------------------------------------------------------
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedStudentForFee, setSelectedStudentForFee] = useState<Student | null>(null);
  const [installmentForm, setInstallmentForm] = useState({
    nominal: 500000,
    payment_method: 'Transfer Bank' as 'Transfer Bank' | 'Tunai',
    paid_date: '2026-11-10',
    receipt_number: '',
    proof_file_url: '',
    notes: 'Cicilan Iuran Tahunan Mandiri',
  });

  const handleOpenInstallmentModal = (student: Student) => {
    const existing = feeAnnualInstallments.filter(i => i.student_id === student.id);
    setSelectedStudentForFee(student);
    setInstallmentForm({
      nominal: 500000,
      payment_method: 'Transfer Bank',
      paid_date: '2026-11-10',
      receipt_number: `THN-${student.nis}-C${existing.length + 1}`,
      proof_file_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
      notes: `Cicilan Ke-${existing.length + 1} Iuran Tahunan Terpadu`,
    });
    setIsInstallmentModalOpen(true);
  };

  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForFee) return;

    const studentId = selectedStudentForFee.id;
    const existingInstallments = feeAnnualInstallments.filter(i => i.student_id === studentId);
    const newInstallmentNumber = existingInstallments.length + 1;
    const insId = `ins-${Date.now()}`;

    const newIns: FeeAnnualInstallment = {
      id: insId,
      student_id: studentId,
      installment_number: newInstallmentNumber,
      nominal: Number(installmentForm.nominal),
      paid_date: installmentForm.paid_date || new Date().toISOString(),
      payment_method: installmentForm.payment_method,
      proof_file_url: installmentForm.proof_file_url || undefined,
      notes: installmentForm.notes,
      receipt_number: installmentForm.receipt_number || `THN-${selectedStudentForFee.nis}-C${newInstallmentNumber}`,
      recorded_by: currentUser?.name || 'Administrator',
    };

    await db.fee_annual_installments.put(newIns);

    // Update Summary
    const allIns = [...existingInstallments, newIns];
    const totalPaid = allIns.reduce((sum, item) => sum + Number(item.nominal), 0);
    const target = selectedStudentForFee.annual_fee_target || 3500000;
    const pct = Math.min(100, Math.round((totalPaid / target) * 100));
    const status = pct >= 100 ? 'Lunas' : pct > 0 ? 'Sebagian' : 'Belum';

    const existingSummary = feeAnnualSummaries.find(s => s.student_id === studentId);
    await db.fee_annual_summary.put({
      id: existingSummary?.id || `fas-${studentId}`,
      student_id: studentId,
      academic_year_id: 'ay-2026',
      target_amount: target,
      total_paid: totalPaid,
      percentage_paid: pct,
      status,
    });

    setIsInstallmentModalOpen(false);
  };

  const handleDeleteInstallment = async (installmentId: string, studentId: string) => {
    if (!window.confirm('⚠️ Apakah Anda yakin ingin membatalkan/menghapus riwayat cicilan ini?')) return;
    await db.fee_annual_installments.delete(installmentId);

    const remainingIns = feeAnnualInstallments.filter(i => i.student_id === studentId && i.id !== installmentId);
    const totalPaid = remainingIns.reduce((sum, item) => sum + Number(item.nominal), 0);
    const st = students.find(s => s.id === studentId);
    const target = st?.annual_fee_target || 3500000;
    const pct = Math.min(100, Math.round((totalPaid / target) * 100));
    const status = pct >= 100 ? 'Lunas' : pct > 0 ? 'Sebagian' : 'Belum';

    const existingSummary = feeAnnualSummaries.find(s => s.student_id === studentId);
    await db.fee_annual_summary.put({
      id: existingSummary?.id || `fas-${studentId}`,
      student_id: studentId,
      academic_year_id: 'ay-2026',
      target_amount: target,
      total_paid: totalPaid,
      percentage_paid: pct,
      status,
    });
  };

  // -------------------------------------------------------------
  // 3. IMAGE PREVIEW MODAL STATE (For Bukti Transfer SPP & Tahunan)
  // -------------------------------------------------------------
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // File upload to Base64 helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // 4. DAPODIK INTERNAL STUDENT CRUD STATE
  // -------------------------------------------------------------
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState<Partial<Student>>({
    name: '',
    nis: '',
    nisn: '',
    class_id: selectedClassId,
    gender: 'L',
    parent_name: '',
    parent_phone: '',
    has_special_needs: false,
    special_needs_notes: '',
    fee_category: 'Reguler',
    spp_monthly_amount: 350000,
    annual_fee_target: 3500000,
  });

  const handleOpenEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentForm({ ...st });
  };

  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    const count = students.length + 1;
    setStudentForm({
      name: '',
      nis: `20260${count < 10 ? '0' + count : count}`,
      nisn: `0124455${600 + count}`,
      class_id: selectedClassId,
      gender: 'L',
      parent_name: '',
      parent_phone: '0812' + Math.floor(10000000 + Math.random() * 90000000),
      has_special_needs: false,
      special_needs_notes: '',
      fee_category: 'Reguler',
      spp_monthly_amount: 350000,
      annual_fee_target: 3500000,
    });
    setIsAddStudentOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.nis) {
      alert('Nama dan NIS wajib diisi.');
      return;
    }

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        ...studentForm,
      } as Student;
      await db.students.put(updated);
      setEditingStudent(null);
    } else {
      const newId = `s-${Date.now()}`;
      const newStudent: Student = {
        id: newId,
        name: studentForm.name || '',
        nis: studentForm.nis || '',
        nisn: studentForm.nisn || '',
        class_id: studentForm.class_id || selectedClassId,
        gender: studentForm.gender || 'L',
        parent_name: studentForm.parent_name || 'Wali Murid',
        parent_phone: studentForm.parent_phone || '08123456789',
        has_special_needs: !!studentForm.has_special_needs,
        special_needs_notes: studentForm.special_needs_notes || '',
        fee_category: studentForm.fee_category || 'Reguler',
        spp_monthly_amount: Number(studentForm.spp_monthly_amount) || 350000,
        annual_fee_target: Number(studentForm.annual_fee_target) || 3500000,
      };
      await db.students.put(newStudent);

      // Update class student count
      const targetClass = classes.find(c => c.id === newStudent.class_id);
      if (targetClass) {
        await db.classes.update(targetClass.id, {
          student_count: targetClass.student_count + 1,
        });
      }
      setIsAddStudentOpen(false);
    }
  };

  const handleDeleteStudent = async (st: Student) => {
    if (window.confirm(`⚠️ Apakah Anda yakin ingin menghapus data siswa "${st.name}" (NIS: ${st.nis}) dari database sekolah?`)) {
      await db.students.delete(st.id);
      const targetClass = classes.find(c => c.id === st.class_id);
      if (targetClass && targetClass.student_count > 0) {
        await db.classes.update(targetClass.id, {
          student_count: Math.max(0, targetClass.student_count - 1),
        });
      }
    }
  };

  const handleImportStudents = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        alert('File Excel/CSV kosong atau format tidak sesuai.');
        return;
      }

      const newStudents: Student[] = [];
      const classCountMap: Record<string, number> = {};

      rawRows.forEach((row, idx) => {
        const studentName = String(
          row['NAMA SISWA'] || row['Nama Siswa'] || row['Nama'] || row['nama'] || row['NAMA'] || ''
        ).trim();
        if (!studentName) return;

        // Class resolution (e.g. "Kelas 2" or "2")
        let targetClassId = selectedClassId;
        const rowClass = String(row['KELAS'] || row['Kelas'] || row['kelas'] || '').trim();
        if (rowClass) {
          const matchedClass = classes.find(
            (c) =>
              c.name.toLowerCase().includes(rowClass.toLowerCase()) ||
              `kelas ${c.grade_level}` === rowClass.toLowerCase() ||
              String(c.grade_level) === rowClass
          );
          if (matchedClass) targetClassId = matchedClass.id;
        }

        const nis = String(row['NIS'] || row['nis'] || `2026${String(idx + 1).padStart(4, '0')}`).trim();
        const nisn = String(row['NISN'] || row['nisn'] || `014${String(Date.now()).slice(-7)}`).trim();
        const genderRaw = String(
          row['JENIS KELAMIN'] || row['Jenis Kelamin'] || row['JK'] || row['L/P'] || 'L'
        ).toUpperCase().trim();
        const gender: 'L' | 'P' = genderRaw.startsWith('P') ? 'P' : 'L';
        const parentName = String(
          row['NAMA ORANG TUA'] || row['Orang Tua'] || row['Wali'] || `Wali Murid ${studentName.split(' ')[0]}`
        ).trim();
        const parentPhone = String(
          row['KONTAK WHATSAPP'] || row['No WhatsApp'] || row['Telepon'] || row['HP'] || '081200155566'
        ).trim();
        const inklusifRaw = String(
          row['STATUS INKLUSIF'] || row['Inklusif'] || row['GPK'] || ''
        ).toLowerCase();
        const hasSpecialNeeds =
          inklusifRaw.includes('ya') ||
          inklusifRaw.includes('inklusi') ||
          inklusifRaw.includes('true') ||
          inklusifRaw.includes('gpk');
        const feeCategory = (
          ['Beasiswa', 'Khusus'].includes(row['KATEGORI BIAYA'] || row['Kategori Biaya'])
            ? row['KATEGORI BIAYA'] || row['Kategori Biaya']
            : 'Reguler'
        ) as any;

        const newSt: Student = {
          id: `st-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          name: studentName,
          nisn,
          nis,
          class_id: targetClassId,
          gender,
          parent_name: parentName,
          parent_phone: parentPhone,
          has_special_needs: hasSpecialNeeds,
          fee_category: feeCategory,
          spp_monthly_amount: 350000,
          annual_fee_target: 3500000,
        };

        newStudents.push(newSt);
        classCountMap[targetClassId] = (classCountMap[targetClassId] || 0) + 1;
      });

      if (newStudents.length > 0) {
        await db.students.bulkPut(newStudents);
        for (const [cId, count] of Object.entries(classCountMap)) {
          const cls = classes.find((c) => c.id === cId);
          if (cls) {
            await db.classes.update(cId, { student_count: cls.student_count + count });
          }
        }
        alert(`✅ Berhasil mengimpor ${newStudents.length} data siswa dari spreadsheet ke sistem!`);
      } else {
        alert('⚠️ Tidak ada baris nama siswa yang valid ditemukan dalam berkas.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      alert('Gagal membaca berkas: ' + (err?.message || err));
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        'NO': 1,
        'NAMA SISWA': 'Adzkiya Rafania Shaeena Gunawan',
        'NISN': '0142233401',
        'NIS': '20250201',
        'KELAS': 'Kelas 2',
        'JENIS KELAMIN': 'P',
        'NAMA ORANG TUA': 'Wali Murid Adzkiya',
        'KONTAK WHATSAPP': '081200135566',
        'STATUS INKLUSIF': 'Tidak',
        'KATEGORI BIAYA': 'Reguler',
      },
      {
        'NO': 2,
        'NAMA SISWA': 'Muhammad Zeeshan Kafeel',
        'NISN': '0142233406',
        'NIS': '20250206',
        'KELAS': 'Kelas 2',
        'JENIS KELAMIN': 'L',
        'NAMA ORANG TUA': 'Wali Murid Muhammad',
        'KONTAK WHATSAPP': '081200185566',
        'STATUS INKLUSIF': 'Ya (GPK)',
        'KATEGORI BIAYA': 'Reguler',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
    XLSX.writeFile(wb, 'Format_Import_Data_Siswa_SD_Khoirur_Rooziqiin.xlsx');
  };

  // -------------------------------------------------------------
  // 5. LETTER GENERATOR FORM STATE (no.surat/perihal/bulan/sekolah/tahun)
  // -------------------------------------------------------------
  const [letterForm, setLetterForm] = useState({
    category_code: 'UND',
    recipient_or_sender: 'Seluruh Wali Murid Kelas 1 - 6',
    subject: 'Undangan Sosialisasi Program Tahfidz & Rapat Semester Ganjil',
    body_content: 'Dengan hormat, sehubungan dengan evaluasi tengah semester dan penguatan pembiasaan sholat Dhuha serta setoran Tahfidz Al-Qur\'an siswa, kami mengundang Bapak/Ibu hadir pada...',
    // Formula: [no.surat] / [perihal] / [bulan] / [sekolah] / [tahun]
    seg_nomor: '049',
    seg_perihal: 'UND',
    seg_bulan: '11',
    seg_sekolah: 'SD-KR',
    seg_tahun: '2026',
  });

  const fullLetterNumber = `${letterForm.seg_nomor}/${letterForm.seg_perihal}/${letterForm.seg_bulan}/${letterForm.seg_sekolah}/${letterForm.seg_tahun}`;

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
            { id: 'dapodik', label: 'Data Master Siswa', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-school-navy-900 text-white shadow-xs'
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

      {/* ------------------------------------------------------------- */}
      {/* 1. MATRIKS SPP BULANAN (FIT IN ONE SCREEN, NO NOMINAL COLUMN) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'spp' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-school-gold-600" />
                  Matriks Pembayaran SPP — {currentClass.name}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Tarif Standar: Rp 350.000 / bln
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                💡 <strong>Klik pada kotak bulan</strong> untuk mengedit nominal, tanggal bayar, & mengunggah bukti transfer bank.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lunas
              </span>
              <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Belum Lunas
              </span>
            </div>
          </div>

          {/* SPP Matrix Table: Compact, fits full screen width without scroll */}
          <div className="w-full">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl table-auto">
              <thead className="bg-school-navy-900 text-white font-bold text-[10px]">
                <tr>
                  <th className="px-2 py-2 w-8 text-center">No</th>
                  <th className="px-2.5 py-2 w-44">Nama Siswa</th>
                  {months.map((m) => (
                    <th key={m} className="px-1 py-2 text-center w-10">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center w-20">Kuitansi</th>
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
                    <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-2 py-1.5 text-center font-bold text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="px-2.5 py-1.5">
                        <div className="font-bold text-slate-900 leading-tight truncate max-w-[170px]" title={st.name}>
                          {st.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {st.nis}</div>
                      </td>

                      {months.map((m) => {
                        const rec = studentSppRecords.find(r => r.month === m);
                        const isLunas = rec?.status === 'Lunas' || (!rec && ['Juli', 'Agustus', 'September', 'Oktober', 'November'].includes(m) && i === 0);
                        const hasProof = !!rec?.proof_file_url || (isLunas && i === 0);

                        return (
                          <td key={m} className="px-1 py-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenSppModal(st, m, rec)}
                              className={`w-7 h-7 mx-auto rounded-md font-bold text-[11px] flex items-center justify-center transition-all cursor-pointer hover:scale-110 shadow-2xs relative group ${
                                isLunas
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 font-black'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-400 border border-dashed border-rose-300 font-bold'
                              }`}
                              title={`Klik untuk edit ${m} (${isLunas ? 'Lunas' : 'Belum Lunas'})${hasProof ? ' • Ada Bukti Transfer' : ''}`}
                            >
                              {isLunas ? '✓' : '-'}
                              {hasProof && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-600 rounded-full ring-1 ring-white" title="Ada Bukti Transfer" />
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => generateSppReceiptPdf(st, currentClass, latestPaid)}
                          className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-2 py-1 rounded-md text-[10px] font-bold shadow-2xs inline-flex items-center gap-1 transition-colors"
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

      {/* ------------------------------------------------------------- */}
      {/* 2. IURAN TAHUNAN TERPADU & PROGRESS BAR */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'tahunan' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-school-gold-600" />
                Iuran Tahunan Terpadu (All-In dengan Sistem Cicilan & Bukti Transfer)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan cicilan biaya tahunan dengan bukti transfer bank, kalkulasi otomatis progress bar, dan cetak kuitansi.
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
                      <span>Riwayat Cicilan & Bukti Transfer</span>
                      <span>Total: {installments.length} Cicilan</span>
                    </div>

                    {installments.length > 0 ? (
                      installments.map((ins) => (
                        <div key={ins.id} className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="font-bold text-slate-800">Cicilan Ke-{ins.installment_number}</span>
                            <span className="text-slate-400 ml-1">({ins.paid_date.slice(0, 10)})</span>
                            <span className="text-slate-400 ml-1 font-mono text-[10px]">• {ins.payment_method}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              Rp {Number(ins.nominal).toLocaleString('id-ID')}
                            </span>
                            {ins.proof_file_url && (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(ins.proof_file_url || null)}
                                className="p-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[10px] font-bold flex items-center gap-0.5"
                                title="Lihat Bukti Transfer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Bukti</span>
                              </button>
                            )}
                            <button
                              onClick={() => generateAnnualFeeReceiptPdf(st, currentClass, ins, summary)}
                              className="text-school-gold-700 hover:text-school-gold-800 font-bold text-[10px] underline ml-1"
                            >
                              Kuitansi
                            </button>
                            <button
                              onClick={() => handleDeleteInstallment(ins.id, st.id)}
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              title="Hapus Cicilan Ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">Belum ada riwayat cicilan tersimpan.</div>
                    )}
                  </div>

                  {/* Input Cicilan Button */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleOpenInstallmentModal(st)}
                      className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-school-gold-400" />
                      <span>Catat Cicilan & Bukti Transfer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MULTI-POS KAS ACCOUNTING (3 POS KEUANGAN) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'kas_3pos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* ------------------------------------------------------------- */}
      {/* 4. GENERATOR SURAT (no.surat/perihal/bulan/sekolah/tahun) */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'surat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2 border-b pb-2">
              <FileText className="w-4 h-4 text-school-gold-600" />
              Generator Surat Resmi SD Khoirur Rooziqiin Bandung
            </h3>

            {/* Segmented Numbering Format Engine: no.surat/perihal/bulan/sekolah/tahun */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700">Format Penomoran: <code className="text-school-navy-900 font-mono text-[11px]">no.surat/perihal/bulan/sekolah/tahun</code></span>
                <span className="text-emerald-700 bg-emerald-100 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  Standar Format Resmi
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 font-mono text-center">
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold">1. No. Surat</span>
                  <input
                    type="text"
                    value={letterForm.seg_nomor}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_nomor: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold">2. Perihal</span>
                  <input
                    type="text"
                    value={letterForm.seg_perihal}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_perihal: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold">3. Bulan</span>
                  <input
                    type="text"
                    value={letterForm.seg_bulan}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_bulan: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold">4. Sekolah</span>
                  <input
                    type="text"
                    value={letterForm.seg_sekolah}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_sekolah: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold bg-white"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block font-sans font-bold">5. Tahun</span>
                  <input
                    type="text"
                    value={letterForm.seg_tahun}
                    onChange={(e) => setLetterForm({ ...letterForm, seg_tahun: e.target.value })}
                    className="w-full border rounded p-1 text-center font-bold bg-white"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-700 font-medium bg-white p-2 rounded border border-slate-200">
                Hasil Nomor Surat: <strong className="text-school-navy-900 font-mono text-xs">{fullLetterNumber}</strong>
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
                onClick={async () => {
                  const letterArchive: LetterArchive = {
                    id: `la-${Date.now()}`,
                    letter_number: fullLetterNumber,
                    letter_type: 'Keluar',
                    category_code: letterForm.category_code,
                    date: new Date().toISOString().slice(0, 10),
                    recipient_or_sender: letterForm.recipient_or_sender,
                    subject: letterForm.subject,
                    body_content: letterForm.body_content,
                    created_by: currentUser?.id || 'admin',
                  };
                  await db.letter_archives.put(letterArchive);
                  generateOfficialLetterPdf(letterArchive);
                }}
                className="w-full bg-[#0F2942] hover:bg-[#1E3A8A] text-white py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-school-gold-400" />
                <span>Terbitkan & Unduh Surat Resmi PDF (Kop SD-KR)</span>
              </button>
            </div>
          </div>

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

      {/* ------------------------------------------------------------- */}
      {/* 5. DATA POKOK PENDIDIKAN SISWA DENGAN IMPORT EXCEL & CSV */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'dapodik' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-base text-school-navy-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-school-gold-600" />
                Data Pokok Pendidikan Siswa — {currentClass.name}
              </h3>
              <p className="text-xs text-slate-500">
                Direktori data master siswa kelas 1 sampai 6 dengan hak edit & hapus langsung oleh Administrator.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Template Download */}
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5"
                title="Unduh Format Template Excel untuk Impor Data Siswa"
              >
                <Download className="w-3.5 h-3.5 text-school-navy-800" />
                <span>Format Template</span>
              </button>

              {/* Import Excel / CSV Button */}
              <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4 text-emerald-100" />
                <span>📥 Import Siswa (.xlsx / .xlsm / .xls / .csv)</span>
                <input
                  type="file"
                  accept=".xlsx, .xlsm, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleImportStudents}
                />
              </label>

              {/* Add Student Button */}
              <button
                onClick={handleOpenAddStudent}
                className="bg-school-navy-900 hover:bg-[#1E3A8A] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-school-gold-400" />
                <span>+ Tambah Siswa Baru</span>
              </button>
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
                  <th className="px-3 py-2.5 text-center">Aksi Administrator</th>
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
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditStudent(st)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(st)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                          title="Hapus Siswa dari Dapodik"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* POPUP 1: EDIT / CHECKLIST SPP BULANAN (POPUP MODAL) */}
      {/* ------------------------------------------------------------- */}
      {editingSppRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-school-gold-600" />
                  Edit Pembayaran SPP — {editingSppRecord.student.name}
                </h4>
                <div className="text-[11px] text-slate-500">
                  Bulan <strong>{editingSppRecord.month}</strong> • NIS: {editingSppRecord.student.nis} • {currentClass.name}
                </div>
              </div>
              <button
                onClick={() => setEditingSppRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpp} className="space-y-3">
              {/* Status Lunas / Belum Lunas */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Pembayaran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSppForm({ ...sppForm, status: 'Lunas' })}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      sppForm.status === 'Lunas'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>LUNAS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSppForm({ ...sppForm, status: 'Belum Lunas' })}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      sppForm.status === 'Belum Lunas'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>BELUM LUNAS</span>
                  </button>
                </div>
              </div>

              {/* Nominal & Tanggal Bayar */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal SPP (Rp):</label>
                  <input
                    type="number"
                    required
                    value={sppForm.nominal}
                    onChange={(e) => setSppForm({ ...sppForm, nominal: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Pembayaran:</label>
                  <input
                    type="date"
                    value={sppForm.paid_date}
                    onChange={(e) => setSppForm({ ...sppForm, paid_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Metode & No Kuitansi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran:</label>
                  <select
                    value={sppForm.payment_method}
                    onChange={(e) => setSppForm({ ...sppForm, payment_method: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Transfer Bank">Transfer Bank (BSI / Mandiri)</option>
                    <option value="Tunai">Tunai ke Kasir TU</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor Kuitansi:</label>
                  <input
                    type="text"
                    value={sppForm.receipt_number}
                    onChange={(e) => setSppForm({ ...sppForm, receipt_number: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* BUKTI TRANSFER (UPLOAD / PREVIEW) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">
                  Bukti Transfer / Struk Pembayaran SPP:
                </label>

                {sppForm.proof_file_url ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-200">
                      <img
                        src={sppForm.proof_file_url}
                        alt="Bukti Transfer"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImageUrl(sppForm.proof_file_url)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Berkas Bukti Transfer Terlampir</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(sppForm.proof_file_url)}
                          className="text-blue-600 hover:underline font-bold text-[11px]"
                        >
                          Lihat Bukti Penuh
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={() => setSppForm({ ...sppForm, proof_file_url: '' })}
                          className="text-rose-600 hover:underline font-bold text-[11px]"
                        >
                          Hapus Bukti
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <label className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                        <Upload className="w-3.5 h-3.5 text-school-navy-800" />
                        <span>Unggah Foto Bukti Transfer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (url) => setSppForm({ ...sppForm, proof_file_url: url }))}
                        />
                      </label>
                      <span className="text-[10px] text-slate-400">Format JPG/PNG/Screenshot</span>
                    </div>
                    <input
                      type="url"
                      placeholder="Atau tempel tautan URL gambar bukti transfer di sini..."
                      value={sppForm.proof_file_url}
                      onChange={(e) => setSppForm({ ...sppForm, proof_file_url: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-[11px] bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t">
                <button
                  type="button"
                  onClick={handleResetSppRecord}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset / Hapus</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSppRecord(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold shadow-xs"
                  >
                    Simpan Perubahan SPP
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* POPUP 2: CATAT CICILAN BARU IURAN TAHUNAN DENGAN BUKTI */}
      {/* ------------------------------------------------------------- */}
      {isInstallmentModalOpen && selectedStudentForFee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 p-5 space-y-3 text-xs animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-school-gold-600" />
                Catat Cicilan Iuran Tahunan — {selectedStudentForFee.name}
              </h4>
              <button
                onClick={() => setIsInstallmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInstallment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal Cicilan (Rp):</label>
                  <input
                    type="number"
                    required
                    value={installmentForm.nominal}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, nominal: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Bayar:</label>
                  <input
                    type="date"
                    required
                    value={installmentForm.paid_date}
                    onChange={(e) => setInstallmentForm({ ...installmentForm, paid_date: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Metode Pembayaran:</label>
                <select
                  value={installmentForm.payment_method}
                  onChange={(e) => setInstallmentForm({ ...installmentForm, payment_method: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                >
                  <option value="Transfer Bank">Transfer Bank (BSI / Mandiri)</option>
                  <option value="Tunai">Tunai ke Kasir TU</option>
                </select>
              </div>

              {/* BUKTI TRANSFER IURAN TAHUNAN */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Bukti Transfer Cicilan:</label>
                {installmentForm.proof_file_url ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={installmentForm.proof_file_url}
                      alt="Bukti Transfer"
                      className="w-14 h-14 rounded-lg object-cover border border-slate-300 cursor-pointer"
                      onClick={() => setPreviewImageUrl(installmentForm.proof_file_url)}
                    />
                    <div>
                      <div className="text-emerald-700 font-bold text-[11px]">Bukti Terunggah</div>
                      <button
                        type="button"
                        onClick={() => setInstallmentForm({ ...installmentForm, proof_file_url: '' })}
                        className="text-rose-600 hover:underline text-[10px] font-bold"
                      >
                        Ganti Bukti
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-school-navy-800" />
                      <span>Pilih Berkas Bukti Transfer</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, (url) => setInstallmentForm({ ...installmentForm, proof_file_url: url }))}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan:</label>
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
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold shadow-xs"
                >
                  Simpan Cicilan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* POPUP 3: TAMBAH / EDIT DATA SISWA DAPODIK */}
      {/* ------------------------------------------------------------- */}
      {(isAddStudentOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-5 space-y-4 text-xs animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-school-gold-600" />
                {editingStudent ? `Edit Data Siswa — ${editingStudent.name}` : 'Tambah Siswa Baru (Dapodik Internal)'}
              </h4>
              <button
                onClick={() => {
                  setEditingStudent(null);
                  setIsAddStudentOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa:</label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Contoh: Muhammad Rayhan Al-Fatih"
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa):</label>
                  <input
                    type="text"
                    required
                    value={studentForm.nis}
                    onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN:</label>
                  <input
                    type="text"
                    value={studentForm.nisn}
                    onChange={(e) => setStudentForm({ ...studentForm, nisn: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas:</label>
                  <select
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.room_name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin:</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Orang Tua / Wali:</label>
                  <input
                    type="text"
                    value={studentForm.parent_name}
                    onChange={(e) => setStudentForm({ ...studentForm, parent_name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak WhatsApp:</label>
                  <input
                    type="tel"
                    value={studentForm.parent_phone}
                    onChange={(e) => setStudentForm({ ...studentForm, parent_phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_special_needs"
                    checked={studentForm.has_special_needs}
                    onChange={(e) => setStudentForm({ ...studentForm, has_special_needs: e.target.checked })}
                    className="w-4 h-4 rounded text-school-navy-900"
                  />
                  <label htmlFor="has_special_needs" className="font-bold text-slate-800 cursor-pointer">
                    Siswa Berkebutuhan Khusus / Inklusif (GPK)
                  </label>
                </div>
                {studentForm.has_special_needs && (
                  <input
                    type="text"
                    placeholder="Catatan kebutuhan khusus (misal: ADHD, Autism, Sensory Sensitive)..."
                    value={studentForm.special_needs_notes || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, special_needs_notes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Biaya:</label>
                  <select
                    value={studentForm.fee_category}
                    onChange={(e) => setStudentForm({ ...studentForm, fee_category: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Reguler">Reguler</option>
                    <option value="Beasiswa">Beasiswa</option>
                    <option value="Khusus">Khusus</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SPP / Bln (Rp):</label>
                  <input
                    type="number"
                    value={studentForm.spp_monthly_amount}
                    onChange={(e) => setStudentForm({ ...studentForm, spp_monthly_amount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Tahunan (Rp):</label>
                  <input
                    type="number"
                    value={studentForm.annual_fee_target}
                    onChange={(e) => setStudentForm({ ...studentForm, annual_fee_target: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    setIsAddStudentOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-school-navy-900 hover:bg-[#1E3A8A] text-white font-bold shadow-xs"
                >
                  {editingStudent ? 'Simpan Perubahan Siswa' : 'Daftarkan Siswa Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* POPUP 4: FULL IMAGE PREVIEW MODAL */}
      {/* ------------------------------------------------------------- */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-xl w-full space-y-3 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-extrabold text-sm text-school-navy-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Bukti Transfer / Pembayaran
              </h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center">
              <img
                src={previewImageUrl}
                alt="Bukti Transfer Penuh"
                className="max-h-[68vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <a
                href={previewImageUrl}
                download="Bukti_Transfer.jpg"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-school-navy-900 text-white font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Berkas</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
