# School Hub — Pusat Data Terpadu SD Khoirur Rooziqiin Bandung

Aplikasi Sistem Operasional Sekolah Terpadu (SaaS/PWA) SD Khoirur Rooziqiin Bandung dengan pendekatan **Offline-First**, sinkronisasi real-time, manajemen absensi guru & siswa, jurnal pembelajaran, keuangan SPP & iuran tahunan 3 pos, sistem persuratan otomatis, serta pengawasan eksekutif Kepala Sekolah.

- **GitHub Repository**: [https://github.com/soppdj/SchoolHub](https://github.com/soppdj/SchoolHub)
- **Deployment Platform**: Vercel
- **Cloud Backend**: Google Firebase (Cloud Firestore, Firebase Authentication, Firebase Storage)

---

## 🚀 Fitur Utama

1. **Dashboard Operasional Bersama (Live Monitoring 6 Kelas)**:
   - Panel kelas otomatis berganti warna (Kuning = Istirahat/Persiapan, Hijau = Aktif Mengajar, Merah = Kosong/Guru Izin).
   - Sistem rekomendasi guru pengganti otomatis secara cerdas.
2. **Guru & Akademik**:
   - Entri Jurnal Harian Cepat, Asesmen Capaian TP (Kurikulum Merdeka), dan monitoring 250 master jam pelajaran.
3. **Shadow Teacher (Inklusif & GPK)**:
   - Jurnal 4 dimensi adaptif khusus santri berkebutuhan khusus.
4. **Piket Harian & Buku Tamu**:
   - Checklist piket lapangan, pemantauan 5S, keterlambatan siswa, dan buku tamu digital.
5. **Administrasi & Keuangan TU**:
   - Matriks SPP bulanan ringkas (1 layar tanpa scroll), upload & preview bukti transfer mutasi bank, pencetakan kuitansi resmi bertanda tangan.
   - Iuran tahunan dengan progress bar dinamis, pembukuan kas 3 pos, generator nomor surat otomatis (`no.surat/perihal/bulan/sekolah/tahun`), dan data master siswa.
6. **Eksekutif Kepala Sekolah**:
   - Kolom Agenda Kepala Sekolah (Harian, Mingguan, Bulanan) dengan status dan CRUD interaktif.
   - Matriks presensi kehadiran guru (Harian, Mingguan Senin-Jumat, Bulanan).
   - Laporan jurnal & kinerja guru interaktif: klik baris atau tombol untuk membuka popup detail jurnal PBM dan catatan supervisi.
   - Persetujuan 1-klik anggaran sarpras & disposisi cuti.
7. **Pengaturan & Profil Pengguna**:
   - Upload foto pribadi manual langsung dari perangkat pengguna (laptop/HP) tanpa foto preset eksternal.
   - Tampilan hak akses dinamis (hanya guru pengajar yang melihat asesmen nilai).

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Framer Motion
- **Local Storage (Offline-First)**: Dexie.js (IndexedDB)
- **Cloud Backend**: Google Firebase (Cloud Firestore & Firebase Storage)
- **PDF Generation**: jsPDF + jspdf-autotable
- **Spreadsheet Integration**: xlsx (SheetJS)
- **Hosting & Deployment**: Vercel

---

## 💻 Menjalankan di Lokal (Development)

```bash
# 1. Clone repository
git clone https://github.com/soppdj/SchoolHub.git
cd SchoolHub

# 2. Install dependencies
npm install

# 3. (Opsional) Buat file .env untuk kredensial Firebase pribadi Anda
# Format: VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, dll.

# 4. Jalankan dev server
npm run dev
```

Akses di browser: `http://localhost:5173`

---

## ☁️ Panduan Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan klik **Add New... > Project**.
2. Hubungkan akun GitHub Anda dan pilih repository **`soppdj/SchoolHub`**.
3. Pada pengaturan konfigurasi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Tambahkan **Environment Variables** di Vercel (Project Settings > Environment Variables):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
5. Klik **Deploy**. File `vercel.json` sudah tersedia untuk menangani routing SPA (Single Page Application) secara otomatis.

---

## 🔥 Konfigurasi Backend Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/) dan buat project baru (misal: `schoolhub-sd-khoirur-rooziqiin`).
2. Buat Web App pada project settings dan salin konfigurasinya ke file `.env` atau Vercel Environment Variables.
3. Aktifkan layanan:
   - **Cloud Firestore**: Mode Production (gunakan aturan di `firestore.rules`).
   - **Firebase Storage**: Untuk penyimpanan bukti transfer & foto profil (gunakan aturan di `storage.rules`).
   - **Firebase Authentication**: Opsional untuk login berbasis akun staf/email resmi.
4. Deploy aturan Firebase menggunakan Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage
   ```

---

Dikelola secara resmi oleh Tim ICT & Manajemen SD Khoirur Rooziqiin Bandung.
