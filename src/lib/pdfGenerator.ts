import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  Student,
  SchoolClass,
  FeeSppRecord,
  FeeAnnualInstallment,
  FeeAnnualSummary,
  LetterArchive,
  FinanceTransaction,
  KurikulumTP,
  StudentGrade,
  TahfidzProgress,
  ShadowTeacherJournal,
} from '../types';

export const SCHOOL_INFO = {
  pemerintah: 'PEMERINTAH KABUPATEN BANDUNG BARAT',
  name: 'SEKOLAH DASAR KHOIRUR ROOZIQIIN',
  yayasan: 'PEMERINTAH KABUPATEN BANDUNG BARAT',
  tagline: 'Pusat Data Terpadu SD Khoirur Rooziqiin Bandung',
  address: 'Jl. Raya Cimareme No.256, RT.01/RW.02 Ngamprah, Kabupaten Bandung Barat, Jawa Barat 40552',
  contact: 'Telp: 0811-1111-4272 | Email: sdkhoirurrooziqiin@gmail.com',
  npsn: 'NPSN: 70055952',
};

// Add standard official school letterhead to any PDF document
export function drawLetterhead(doc: jsPDF) {
  // Decorative top bars
  doc.setFillColor(15, 41, 66); // Deep Navy (#0F2942)
  doc.rect(0, 0, 210, 8, 'F');
  doc.setFillColor(217, 119, 6); // Warm Metallic Gold (#D97706)
  doc.rect(0, 8, 210, 2, 'F');

  // School Name and Yayasan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(SCHOOL_INFO.yayasan.toUpperCase(), 105, 17, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(15, 41, 66);
  doc.text(SCHOOL_INFO.name, 105, 24, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`"${SCHOOL_INFO.tagline}"`, 105, 29, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(SCHOOL_INFO.address, 105, 34, { align: 'center' });
  doc.text(`${SCHOOL_INFO.contact} • ${SCHOOL_INFO.npsn}`, 105, 38, { align: 'center' });

  // Double horizontal separator line
  doc.setDrawColor(15, 41, 66);
  doc.setLineWidth(0.8);
  doc.line(15, 42, 195, 42);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.line(15, 43.2, 195, 43.2);
}

// 1. Generate Official PDF SPP Receipt
export function generateSppReceiptPdf(student: Student, schoolClass: SchoolClass, record: FeeSppRecord) {
  const doc = new jsPDF({ format: 'a5', orientation: 'landscape' });
  
  // Custom Letterhead for A5 landscape (width: 210, height: 148)
  drawLetterhead(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 41, 66);
  doc.text('KUITANSI RESMI PEMBAYARAN SPP BULANAN', 105, 52, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Kuitansi: ${record.receipt_number || 'SPP-' + Date.now().toString().slice(-6)}`, 105, 57, { align: 'center' });

  // Data Table
  const tableData = [
    ['Telah Diterima Dari', `: ${student.parent_name} (Orang Tua / Wali Siswa)`],
    ['Nama Lengkap Siswa', `: ${student.name}`],
    ['NIS / NISN', `: ${student.nis} / ${student.nisn}`],
    ['Kelas / Ruang', `: ${schoolClass.name} (${schoolClass.room_name})`],
    ['Pembayaran Untuk', `: SPP Bulan ${record.month} (Tahun Ajaran 2026/2027)`],
    ['Metode Pembayaran', `: ${record.payment_method || 'Transfer Bank'}`],
    ['Tanggal Pembayaran', `: ${record.paid_date ? new Date(record.paid_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}`],
    ['Jumlah Pembayaran', `: Rp ${Number(record.nominal).toLocaleString('id-ID')},-`],
  ];

  autoTable(doc, {
    startY: 62,
    margin: { left: 20, right: 20 },
    theme: 'plain',
    body: tableData,
    styles: { fontSize: 9, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [15, 41, 66] },
      1: { fontStyle: 'normal' },
    },
  });

  // Nominal Box
  const finalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(20, finalY, 90, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9);
  doc.text(`TERBILANG: Rp ${Number(record.nominal).toLocaleString('id-ID')},- LUNAS`, 25, finalY + 9);

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Bandung, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 145, finalY + 4);
  doc.text('Bagian Keuangan / Tata Usaha,', 145, finalY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 66);
  doc.text('Nurul Hidayati, S.E.', 145, finalY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Bendahara Sekolah', 145, finalY + 32);

  // Watermark stamp
  doc.setDrawColor(5, 150, 105);
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(118, finalY + 12, 20, 10, 1, 1, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('LUNAS', 123, finalY + 18);

  doc.save(`Kuitansi_SPP_${student.name.replace(/\s+/g, '_')}_${record.month}.pdf`);
}

// 2. Generate Official PDF Annual Fee Installment Receipt
export function generateAnnualFeeReceiptPdf(
  student: Student,
  schoolClass: SchoolClass,
  installment: FeeAnnualInstallment,
  summary?: FeeAnnualSummary
) {
  const doc = new jsPDF({ format: 'a5', orientation: 'landscape' });
  drawLetterhead(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 41, 66);
  doc.text('KUITANSI RESMI CICILAN IURAN TAHUNAN TERPADU', 105, 52, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Nomor Kuitansi: ${installment.receipt_number}`, 105, 57, { align: 'center' });

  const totalPaid = summary ? summary.total_paid : installment.nominal;
  const target = student.annual_fee_target || 3500000;
  const pct = Math.min(100, Math.round((totalPaid / target) * 100));

  const tableData = [
    ['Telah Diterima Dari', `: ${student.parent_name} (Orang Tua / Wali Siswa)`],
    ['Nama Lengkap Siswa', `: ${student.name}`],
    ['NIS / Kelas', `: ${student.nis} / ${schoolClass.name}`],
    ['Uraian Pembayaran', `: Cicilan Ke-${installment.installment_number} Iuran Tahunan Terpadu`],
    ['Nominal Cicilan Ini', `: Rp ${Number(installment.nominal).toLocaleString('id-ID')},-`],
    ['Akumulasi Terbayar', `: Rp ${totalPaid.toLocaleString('id-ID')} dari Target Rp ${target.toLocaleString('id-ID')} (${pct}%)`],
    ['Sisa Tagihan Tahunan', `: Rp ${Math.max(0, target - totalPaid).toLocaleString('id-ID')},-`],
    ['Tanggal & Metode', `: ${new Date(installment.paid_date).toLocaleDateString('id-ID')} via ${installment.payment_method}`],
  ];

  autoTable(doc, {
    startY: 62,
    margin: { left: 20, right: 20 },
    theme: 'plain',
    body: tableData,
    styles: { fontSize: 8.5, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [15, 41, 66] },
      1: { fontStyle: 'normal' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(20, finalY, 90, 14, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`CICILAN KE-${installment.installment_number}: Rp ${Number(installment.nominal).toLocaleString('id-ID')},-`, 25, finalY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Bandung, ' + new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 145, finalY + 4);
  doc.text('Bagian Keuangan / Tata Usaha,', 145, finalY + 9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 66);
  doc.text('Nurul Hidayati, S.E.', 145, finalY + 28);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Bendahara Sekolah', 145, finalY + 32);

  doc.save(`Kuitansi_Tahunan_${student.name.replace(/\s+/g, '_')}_Cicilan${installment.installment_number}.pdf`);
}

// 3. Generate Official Outgoing Letter PDF with Letterhead
export function generateOfficialLetterPdf(letter: LetterArchive) {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
  drawLetterhead(doc);

  // Letter Metadata Table
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);

  const leftX = 20;
  let currentY = 54;

  doc.text(`Nomor     : ${letter.letter_number}`, leftX, currentY);
  doc.text(`Bandung, ${new Date(letter.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, currentY);

  currentY += 6;
  doc.text(`Lampiran : -`, leftX, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Perihal    : ${letter.subject}`, leftX, currentY);

  currentY += 12;
  doc.setFont('helvetica', 'normal');
  doc.text(`Kepada Yth.`, leftX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`${letter.recipient_or_sender}`, leftX, currentY);
  currentY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`di Tempat`, leftX, currentY);

  currentY += 12;
  doc.text(`Assalamu'alaikum Warahmatullahi Wabarakatuh,`, leftX, currentY);

  currentY += 8;
  const content = letter.body_content || 'Dengan ini kami sampaikan informasi resmi dari pihak sekolah SD Khoirur Rooziqiin Bandung.';
  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, leftX, currentY);

  currentY += splitText.length * 6 + 10;
  doc.text(`Demikian surat ini kami sampaikan, atas perhatian dan kerja sama yang baik kami ucapkan terima kasih.`, leftX, currentY);
  currentY += 7;
  doc.text(`Wassalamu'alaikum Warahmatullahi Wabarakatuh.`, leftX, currentY);

  currentY += 16;
  doc.text(`Kepala SD Khoirur Rooziqiin Bandung,`, 130, currentY);
  currentY += 26;
  doc.setFont('helvetica', 'bold');
  doc.text(`Dr. H. Salman Farisi, M.Pd.`, 130, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`NIP/NPY: 197805122005011003`, 130, currentY);

  doc.save(`Surat_Resmi_${letter.letter_number.replace(/[\/\\:]/g, '_')}.pdf`);
}

// 4. Generate Kurikulum Merdeka Report Card (Rapor PDF) with Highest & Lowest TP Narratives
export function generateKurikulumMerdekaReportCardPdf(
  student: Student,
  schoolClass: SchoolClass,
  tps: KurikulumTP[],
  grades: StudentGrade[],
  tahfidz: TahfidzProgress[],
  shadowNotes?: ShadowTeacherJournal[]
) {
  const doc = new jsPDF({ format: 'a4', orientation: 'portrait' });
  drawLetterhead(doc);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 41, 66);
  doc.text('LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)', 105, 50, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text('KURIKULUM MERDEKA • TAHUN AJARAN 2026/2027', 105, 55, { align: 'center' });

  // Student Identity Box
  const identityData = [
    ['Nama Siswa', `: ${student.name}`, 'Kelas / Fase', `: ${schoolClass.name} / Fase ${schoolClass.grade_level <= 2 ? 'A' : schoolClass.grade_level <= 4 ? 'B' : 'C'}`],
    ['NISN / NIS', `: ${student.nisn} / ${student.nis}`, 'Semester', ': 1 (Ganjil)'],
    ['Nama Sekolah', `: SD Khoirur Rooziqiin Bandung`, 'Tahun Ajaran', ': 2026/2027'],
  ];

  autoTable(doc, {
    startY: 60,
    margin: { left: 15, right: 15 },
    theme: 'plain',
    body: identityData,
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { cellWidth: 62 },
      2: { fontStyle: 'bold', cellWidth: 28 },
      3: { cellWidth: 52 },
    },
  });

  // Calculate Kurikulum Merdeka Highest and Lowest TP Narratives
  const subjects = Array.from(new Set(tps.map(t => t.subject_name)));
  const tableRows: any[] = [];

  subjects.forEach((subj, idx) => {
    const subjTps = tps.filter(t => t.subject_name === subj);
    const subjGrades = subjTps.map(tp => {
      const g = grades.find(gr => gr.student_id === student.id && gr.tp_id === tp.id);
      return {
        tp,
        formative: g?.score_formative || 85,
        summative: g?.score_summative || 88,
        finalScore: Math.round(((g?.score_formative || 85) + (g?.score_summative || 88)) / 2),
      };
    });

    if (subjGrades.length > 0) {
      subjGrades.sort((a, b) => b.finalScore - a.finalScore);
      const highest = subjGrades[0];
      const lowest = subjGrades[subjGrades.length - 1];

      const avgScore = Math.round(subjGrades.reduce((a, b) => a + b.finalScore, 0) / subjGrades.length);

      let narrative = `Menunjukkan penguasaan yang sangat baik dalam ${highest.tp.description.toLowerCase()}`;
      if (subjGrades.length > 1 && lowest.finalScore < 85) {
        narrative += `. Perlu bimbingan lebih lanjut dan penguatan dalam ${lowest.tp.description.toLowerCase()}`;
      } else {
        narrative += `. Terus pertahankan capaian belajar yang membanggakan ini.`;
      }

      tableRows.push([
        idx + 1,
        subj,
        avgScore,
        narrative,
      ]);
    }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 4,
    margin: { left: 15, right: 15 },
    head: [['No', 'Mata Pelajaran', 'Nilai Akhir', 'Capaian Kompetensi (Deskripsi Kurikulum Merdeka)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [15, 41, 66], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { fontStyle: 'bold', cellWidth: 40 },
      2: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
      3: { cellWidth: 108 },
    },
  });

  // Tahfidz Section
  let curY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 41, 66);
  doc.text('CAPAIAN PROGRAM PEMBIASAAN TAHFIDZ AL-QUR\'AN', 15, curY);

  const studentTahfidz = tahfidz.filter(t => t.student_id === student.id);
  const tahfidzRows = studentTahfidz.length > 0
    ? studentTahfidz.map((th, i) => [
        i + 1,
        `Juz ${th.juz}`,
        `Surat ${th.surah_name} (Ayat ${th.verse_from} - ${th.verse_to})`,
        th.grade,
        th.notes || 'Hafalan lancar dan tartil',
      ])
    : [[1, 'Juz 30', 'Surat Pendek Juz 30', 'Lancar', 'Aktif mengikuti setoran hafalan pagi']];

  autoTable(doc, {
    startY: curY + 2,
    margin: { left: 15, right: 15 },
    head: [['No', 'Juz', 'Surat & Ayat', 'Predikat', 'Catatan Pembimbing']],
    body: tahfidzRows,
    theme: 'grid',
    headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 20 },
      2: { cellWidth: 60 },
      3: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
      4: { cellWidth: 65 },
    },
  });

  // If Student has Shadow Teacher notes, add attachment section
  if (student.has_special_needs && shadowNotes && shadowNotes.length > 0) {
    curY = (doc as any).lastAutoTable.finalY + 6;
    if (curY > 230) {
      doc.addPage();
      curY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 41, 66);
    doc.text('CATATAN PERKEMBANGAN INDIVIDU (SHADOW TEACHER / GPK)', 15, curY);

    const sn = shadowNotes[0];
    const shadowRows = [
      ['Perkembangan Fokus', `: ${sn.focus_notes} (Skor: ${sn.focus_rating}/5)`],
      ['Pengendalian Perilaku', `: ${sn.behavior_notes} (Skor: ${sn.behavior_rating}/5)`],
      ['Kondisi Emosi & Sosial', `: ${sn.emotion_notes} (Skor: ${sn.emotion_rating}/5)`],
      ['Adaptasi Materi Belajar', `: ${sn.material_adaptation}`],
    ];

    autoTable(doc, {
      startY: curY + 2,
      margin: { left: 15, right: 15 },
      body: shadowRows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: [180, 83, 9] },
        1: { cellWidth: 135 },
      },
    });
  }

  // Signature Block
  let signY = (doc as any).lastAutoTable.finalY + 10;
  if (signY > 250) {
    doc.addPage();
    signY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text('Mengetahui,', 25, signY);
  doc.text('Orang Tua / Wali Siswa,', 25, signY + 5);

  doc.text('Bandung, 20 Desember 2026', 140, signY);
  doc.text('Wali Kelas,', 140, signY + 5);

  signY += 22;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 41, 66);
  doc.text(`( ${student.parent_name} )`, 25, signY);
  doc.text(`( Ustadzah / Ustadz Wali Kelas )`, 140, signY);

  doc.save(`Rapor_Kurikulum_Merdeka_${student.name.replace(/\s+/g, '_')}_${schoolClass.name}.pdf`);
}

// 5. Excel Export for Full System Data / Financial Ledgers
export function exportFinanceToExcel(transactions: FinanceTransaction[]) {
  const data = transactions.map((t, idx) => ({
    'No': idx + 1,
    'No Transaksi': t.transaction_number,
    'Tanggal': t.date,
    'Pos Keuangan': t.pos_keuangan,
    'Jenis': t.type,
    'Kategori': t.category,
    'Uraian': t.description,
    'Nominal (Rp)': t.amount,
    'Status Draf': t.is_draft ? 'Draf Sarpras' : 'Final',
    'Pencatat': t.recorded_by,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Keuangan 3 Pos');
  XLSX.writeFile(workbook, `Laporan_Keuangan_SD_Khoirur_Rooziqiin_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// 6. JSON System Backup Export
export function exportFullSystemBackup(data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SchoolHub_SD_Khoirur_Rooziqiin_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
