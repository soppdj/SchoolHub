-- ==============================================================================
-- SCHOOL HUB — SD KHOIRUR ROOZIQIIN BANDUNG
-- KODE UNIK PROYEK: SDKR-HUB-2026 (PREFIX TABEL: sh_)
-- SKEMA CADANGAN SUPABASE (ISOLATED & COLLISION-FREE)
-- ==============================================================================
-- Skema SQL ini dirancang khusus agar dapat dimasukkan/dijalankan ke dalam
-- satu project Supabase yang SUDAH BERJALAN bersama aplikasi lain tanpa ada
-- tabrakan nama tabel (table name collision).
--
-- Seluruh tabel menggunakan prefix unik "sh_" (School Hub) dan kolom identitas
-- "app_code" bernilai default 'SDKR-HUB-2026' serta "school_id" 'SCH-SDKR-BDG'.
-- ==============================================================================

-- 1. Enable Extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 0. METADATA INTEGRASI APLIKASI
-- ==============================================================================
create table if not exists public.sh_app_metadata (
  id text primary key default 'SDKR-HUB-2026',
  app_code text not null unique default 'SDKR-HUB-2026',
  school_id text not null default 'SCH-SDKR-BDG',
  school_name text not null default 'SD Khoirur Rooziqiin Bandung',
  app_name text not null default 'School Hub - Pusat Data Terpadu',
  version text not null default '2.4.0',
  description text default 'Sistem internal sekolah cerdas offline-first & realtime broadcast',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 1. PROFIL PENDIDIK & STAF (sh_profiles)
-- ==============================================================================
create table if not exists public.sh_profiles (
  id text primary key, -- e.g. 'u-sopianto', 'u-dwi', 'u-silvi' or UUID
  app_code text not null default 'SDKR-HUB-2026',
  name text not null,
  username text unique not null,
  title text not null,
  email text unique not null,
  phone text,
  roles text[] not null default '{"Guru Kelas"}',
  specialty text,
  specialties text[] default '{}',
  assigned_class_id text,
  telegram_id text,
  telegram_username text,
  avatar_url text,
  is_active boolean default true,
  is_developer boolean default false,
  is_tu_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 2. TAHUN AKADEMIK (sh_academic_years)
-- ==============================================================================
create table if not exists public.sh_academic_years (
  id text primary key,
  app_code text not null default 'SDKR-HUB-2026',
  name text not null,
  semester int not null check (semester in (1, 2)),
  is_active boolean default true,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 3. KELAS ROMBEL (sh_classes)
-- ==============================================================================
create table if not exists public.sh_classes (
  id text primary key, -- 'c1' s/d 'c6'
  app_code text not null default 'SDKR-HUB-2026',
  name text not null,
  grade_level int not null check (grade_level between 1 and 6),
  wali_kelas_id text references public.sh_profiles(id) on delete set null,
  room_name text not null,
  student_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 4. DATA SISWA RESMI (sh_students)
-- ==============================================================================
create table if not exists public.sh_students (
  id text primary key, -- 's001', 's002', etc.
  app_code text not null default 'SDKR-HUB-2026',
  nisn text not null unique,
  nis text not null unique,
  name text not null,
  class_id text references public.sh_classes(id) on delete cascade,
  gender text check (gender in ('L', 'P')),
  birth_place text,
  birth_date date,
  parent_name text not null,
  parent_phone text not null,
  has_special_needs boolean default false,
  special_needs_notes text,
  shadow_teacher_id text references public.sh_profiles(id) on delete set null,
  fee_category text default 'Reguler',
  spp_monthly_amount numeric(12,2) default 350000,
  annual_fee_target numeric(12,2) default 3500000,
  is_alumni boolean default false,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 5. JADWAL PELAJARAN MASTER (sh_schedules)
-- ==============================================================================
create table if not exists public.sh_schedules (
  id text primary key,
  app_code text not null default 'SDKR-HUB-2026',
  class_id text references public.sh_classes(id) on delete cascade,
  day_of_week int check (day_of_week between 1 and 5),
  period_number int not null,
  start_time text not null,
  end_time text not null,
  duration_jp int default 1,
  subject_name text not null,
  teacher_id text references public.sh_profiles(id) on delete set null,
  is_tahfidz_day boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 6. JADWAL PIKET HARIAN (sh_piket_schedules) - LAPANGAN & KANTOR PERHARI
-- Dikelola khusus oleh Admin/TU dan Developer
-- ==============================================================================
create table if not exists public.sh_piket_schedules (
  id text primary key, -- 'ps-1' (Senin) s/d 'ps-5' (Jumat)
  app_code text not null default 'SDKR-HUB-2026',
  day_of_week int check (day_of_week between 1 and 5),
  day_name text not null,
  piket_lapangan_teacher_id text references public.sh_profiles(id) on delete set null,
  piket_kantor_teacher_id text references public.sh_profiles(id) on delete set null,
  start_time text not null default '06:45',
  end_time text not null default '15:00',
  notes text,
  updated_by text references public.sh_profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 7. CEKLIS TUGAS PIKET LAPANGAN (sh_piket_logs)
-- ==============================================================================
create table if not exists public.sh_piket_logs (
  id text primary key default ('pl-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  date date not null,
  teacher_id text references public.sh_profiles(id),
  sapa_pagi_completed boolean default false,
  dhuha_supervised boolean default false,
  tahfidz_orderliness boolean default false,
  istirahat_patrol boolean default false,
  facility_cleanliness_check boolean default false,
  late_students_count int default 0,
  late_students_notes text,
  incident_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 8. BUKU TAMU DIGITAL PIKET KANTOR (sh_guest_book)
-- ==============================================================================
create table if not exists public.sh_guest_book (
  id text primary key default ('gb-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  date date not null,
  time text not null,
  guest_name text not null,
  institution_or_relation text,
  purpose text not null,
  person_to_meet text not null,
  phone_number text not null,
  recorded_by_id text references public.sh_profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 9. PRESENSI HARIAN STAF & PENDIDIK (sh_staff_attendance)
-- ==============================================================================
create table if not exists public.sh_staff_attendance (
  id text primary key default ('sa-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  user_id text references public.sh_profiles(id) on delete cascade,
  date date not null,
  check_in_time text,
  check_out_time text,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Belum Hadir')),
  leave_reason text,
  proof_file_url text,
  jp_taught_count int default 0,
  substitute_jp_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (app_code, user_id, date)
);

-- ==============================================================================
-- 10. BANK RPP & MODUL AJAR (sh_rpp_modul_documents)
-- ==============================================================================
create table if not exists public.sh_rpp_modul_documents (
  id text primary key default ('rpp-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  title text not null,
  subject_name text not null,
  grade_level int not null check (grade_level between 1 and 6),
  semester text not null check (semester in ('Ganjil', 'Genap')),
  teacher_id text references public.sh_profiles(id) on delete set null,
  teacher_name text not null,
  file_name text not null,
  file_url text,
  description text,
  uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 11. JURNAL MENGAJAR (sh_teaching_journals)
-- Terintegrasi Multi-JP Ceklis & Tautan RPP / Modul Ajar
-- ==============================================================================
create table if not exists public.sh_teaching_journals (
  id text primary key default ('tj-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  schedule_id text references public.sh_schedules(id) on delete set null,
  class_id text references public.sh_classes(id) on delete cascade,
  date date not null,
  period_number int not null,
  period_numbers int[] default '{}',
  subject_name text not null,
  teacher_id text references public.sh_profiles(id) on delete cascade,
  is_substitute boolean default false,
  original_teacher_id text references public.sh_profiles(id) on delete set null,
  topic text not null,
  learning_activity text not null,
  notes text,
  rpp_id text references public.sh_rpp_modul_documents(id) on delete set null,
  rpp_title text,
  rpp_file_url text,
  present_count int default 0,
  sick_count int default 0,
  permitted_count int default 0,
  absent_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 12. PRESENSI SISWA HARIAN PERSISTEN (sh_daily_attendance)
-- ==============================================================================
create table if not exists public.sh_daily_attendance (
  id text primary key default ('da-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  class_id text references public.sh_classes(id) on delete cascade,
  date date not null,
  student_id text references public.sh_students(id) on delete cascade,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpa', 'Netral')),
  notes text,
  updated_by text references public.sh_profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (app_code, class_id, date, student_id)
);

-- ==============================================================================
-- 13. JURNAL SHADOW TEACHER (sh_shadow_teacher_journals)
-- Pemantauan 4 Dimensi Perkembangan Siswa Inklusi (GPK)
-- ==============================================================================
create table if not exists public.sh_shadow_teacher_journals (
  id text primary key default ('sh-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  date date not null,
  student_id text references public.sh_students(id) on delete cascade,
  class_id text references public.sh_classes(id) on delete cascade,
  shadow_teacher_id text references public.sh_profiles(id) on delete cascade,
  subject_name text not null,
  focus_rating int check (focus_rating between 1 and 5),
  focus_notes text not null,
  behavior_rating int check (behavior_rating between 1 and 5),
  behavior_notes text not null,
  emotion_rating int check (emotion_rating between 1 and 5),
  emotion_notes text not null,
  material_adaptation text not null,
  evidence_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 14. SETORAN TAHFIDZ QUR'AN (sh_tahfidz_progress)
-- ==============================================================================
create table if not exists public.sh_tahfidz_progress (
  id text primary key default ('tp-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  student_id text references public.sh_students(id) on delete cascade,
  class_id text references public.sh_classes(id) on delete cascade,
  teacher_id text references public.sh_profiles(id) on delete cascade,
  date date not null,
  juz int not null,
  surah_name text not null,
  verse_from int not null,
  verse_to int not null,
  grade text check (grade in ('Lancar', 'Cukup', 'Ulang')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 15. KURIKULUM MERDEKA TUJUAN PEMBELAJARAN (sh_kurikulum_tp)
-- ==============================================================================
create table if not exists public.sh_kurikulum_tp (
  id text primary key,
  app_code text not null default 'SDKR-HUB-2026',
  grade_level int not null check (grade_level between 1 and 6),
  subject_name text not null,
  code text not null,
  description text not null
);

-- ==============================================================================
-- 16. RUBRIK PENILAIAN SEMUA MAPEL (sh_rubrik_grades)
-- ==============================================================================
create table if not exists public.sh_rubrik_grades (
  id text primary key default ('rg-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  student_id text references public.sh_students(id) on delete cascade,
  subject_key text not null,
  score numeric(5,2) not null default 85 check (score between 0 and 100),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (app_code, student_id, subject_key)
);

-- ==============================================================================
-- 17. SPP BULANAN (sh_fee_spp)
-- ==============================================================================
create table if not exists public.sh_fee_spp (
  id text primary key default ('spp-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  student_id text references public.sh_students(id) on delete cascade,
  academic_year_id text references public.sh_academic_years(id),
  month text not null,
  nominal numeric(12,2) not null default 350000,
  status text not null check (status in ('Lunas', 'Belum Lunas')),
  paid_date timestamp with time zone,
  payment_method text check (payment_method in ('Transfer Bank', 'Tunai')),
  receipt_number text,
  proof_file_url text,
  recorded_by text references public.sh_profiles(id),
  unique (app_code, student_id, academic_year_id, month)
);

-- ==============================================================================
-- 18. IURAN TAHUNAN & ANGSURAN (sh_fee_annual_summary & installments)
-- ==============================================================================
create table if not exists public.sh_fee_annual_summary (
  id text primary key default ('fas-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  student_id text references public.sh_students(id) on delete cascade,
  academic_year_id text references public.sh_academic_years(id),
  target_amount numeric(12,2) default 3500000,
  total_paid numeric(12,2) default 0,
  percentage_paid numeric(5,2) default 0,
  status text default 'Belum' check (status in ('Lunas', 'Sebagian', 'Belum')),
  unique (app_code, student_id, academic_year_id)
);

create table if not exists public.sh_fee_annual_installments (
  id text primary key default ('fai-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  student_id text references public.sh_students(id) on delete cascade,
  installment_number int not null,
  nominal numeric(12,2) not null,
  paid_date timestamp with time zone not null,
  payment_method text check (payment_method in ('Transfer Bank', 'Tunai')),
  proof_file_url text,
  notes text,
  receipt_number text not null,
  recorded_by text references public.sh_profiles(id)
);

-- ==============================================================================
-- 19. KAS KEUANGAN 3 POS (sh_finance_transactions)
-- ==============================================================================
create table if not exists public.sh_finance_transactions (
  id text primary key default ('trx-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  transaction_number text not null unique,
  date date not null,
  type text not null check (type in ('Pemasukan', 'Pengeluaran')),
  pos_keuangan text not null check (pos_keuangan in ('Kas SPP / Operasional', 'Dana BOS', 'Kas Kegiatan / Ekstrakurikuler')),
  category text not null,
  amount numeric(14,2) not null,
  description text not null,
  is_draft boolean default false,
  sarpras_ticket_id text,
  proof_file_url text,
  recorded_by text references public.sh_profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 20. TEMPLAT SURAT & ARSIP SURAT RESMI (sh_letters)
-- ==============================================================================
create table if not exists public.sh_letter_templates (
  id text primary key,
  app_code text not null default 'SDKR-HUB-2026',
  code text not null,
  title text not null,
  numbering_format text not null,
  body_template text not null
);

create table if not exists public.sh_letters_archive (
  id text primary key default ('let-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  letter_number text not null unique,
  letter_type text check (letter_type in ('Keluar', 'Masuk')),
  category_code text not null,
  date date not null,
  recipient_or_sender text not null,
  subject text not null,
  body_content text,
  file_url text,
  created_by text references public.sh_profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 21. INVENTARIS & TIKET KERUSAKAN SARPRAS (sh_sarpras)
-- ==============================================================================
create table if not exists public.sh_sarpras_inventory (
  id text primary key,
  app_code text not null default 'SDKR-HUB-2026',
  code text not null unique,
  name text not null,
  room_name text not null,
  quantity int not null default 1,
  condition text not null check (condition in ('Baik', 'Rusak Ringan', 'Perlu Diganti')),
  last_checked_date date not null
);

create table if not exists public.sh_sarpras_tickets (
  id text primary key default ('tkt-' || uuid_generate_v4()::text),
  app_code text not null default 'SDKR-HUB-2026',
  ticket_number text not null unique,
  item_id text references public.sh_sarpras_inventory(id),
  item_name text not null,
  room_name text not null,
  reported_by_id text references public.sh_profiles(id),
  reported_date timestamp with time zone default timezone('utc'::text, now()) not null,
  issue_description text not null,
  photo_url text,
  status text not null check (status in ('Dilaporkan', 'Menunggu Persetujuan Kepsek', 'Disetujui', 'Ditolak', 'Dalam Pengerjaan', 'Selesai')),
  estimated_cost numeric(12,2),
  sarpras_notes text,
  approved_by_id text references public.sh_profiles(id),
  approved_date timestamp with time zone,
  finance_transaction_id text references public.sh_finance_transactions(id)
);

-- ==============================================================================
-- 22. REALTIME PUBLICATION SETUP (Hanya tabel-tabel utama School Hub)
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.sh_teaching_journals;
alter publication supabase_realtime add table public.sh_piket_schedules;
alter publication supabase_realtime add table public.sh_staff_attendance;
alter publication supabase_realtime add table public.sh_daily_attendance;
alter publication supabase_realtime add table public.sh_sarpras_tickets;
alter publication supabase_realtime add table public.sh_finance_transactions;

-- ==============================================================================
-- 23. ROW LEVEL SECURITY (RLS) - Aman & Tidak Mengganggu Proyek Lain
-- ==============================================================================
alter table public.sh_app_metadata enable row level security;
alter table public.sh_profiles enable row level security;
alter table public.sh_academic_years enable row level security;
alter table public.sh_classes enable row level security;
alter table public.sh_students enable row level security;
alter table public.sh_schedules enable row level security;
alter table public.sh_piket_schedules enable row level security;
alter table public.sh_piket_logs enable row level security;
alter table public.sh_guest_book enable row level security;
alter table public.sh_staff_attendance enable row level security;
alter table public.sh_rpp_modul_documents enable row level security;
alter table public.sh_teaching_journals enable row level security;
alter table public.sh_daily_attendance enable row level security;
alter table public.sh_shadow_teacher_journals enable row level security;
alter table public.sh_tahfidz_progress enable row level security;
alter table public.sh_kurikulum_tp enable row level security;
alter table public.sh_rubrik_grades enable row level security;
alter table public.sh_fee_spp enable row level security;
alter table public.sh_fee_annual_summary enable row level security;
alter table public.sh_fee_annual_installments enable row level security;
alter table public.sh_finance_transactions enable row level security;
alter table public.sh_letter_templates enable row level security;
alter table public.sh_letters_archive enable row level security;
alter table public.sh_sarpras_inventory enable row level security;
alter table public.sh_sarpras_tickets enable row level security;

-- Policies: Mengizinkan akses terisolasi untuk data SDKR
create policy "sh_allow_all_app_metadata" on public.sh_app_metadata for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_profiles" on public.sh_profiles for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_academic_years" on public.sh_academic_years for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_classes" on public.sh_classes for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_students" on public.sh_students for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_schedules" on public.sh_schedules for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_piket_schedules" on public.sh_piket_schedules for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_piket_logs" on public.sh_piket_logs for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_guest_book" on public.sh_guest_book for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_staff_attendance" on public.sh_staff_attendance for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_rpp_modul" on public.sh_rpp_modul_documents for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_teaching_journals" on public.sh_teaching_journals for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_daily_attendance" on public.sh_daily_attendance for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_shadow_journals" on public.sh_shadow_teacher_journals for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_tahfidz" on public.sh_tahfidz_progress for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_kurikulum_tp" on public.sh_kurikulum_tp for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_rubrik_grades" on public.sh_rubrik_grades for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_fee_spp" on public.sh_fee_spp for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_fee_annual_summary" on public.sh_fee_annual_summary for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_fee_annual_installments" on public.sh_fee_annual_installments for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_finance_transactions" on public.sh_finance_transactions for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_letter_templates" on public.sh_letter_templates for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_letters_archive" on public.sh_letters_archive for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_sarpras_inventory" on public.sh_sarpras_inventory for all using (app_code = 'SDKR-HUB-2026');
create policy "sh_allow_all_sarpras_tickets" on public.sh_sarpras_tickets for all using (app_code = 'SDKR-HUB-2026');

-- ==============================================================================
-- 24. DATA AWAL (SEED DATA) RESMI SD KHOIRUR ROOZIQIIN BANDUNG
-- ==============================================================================

-- Metadata
insert into public.sh_app_metadata (id, app_code, school_id, school_name, app_name, version)
values ('SDKR-HUB-2026', 'SDKR-HUB-2026', 'SCH-SDKR-BDG', 'SD Khoirur Rooziqiin Bandung', 'School Hub', '2.4.0')
on conflict (id) do nothing;

-- 13 Profil Pendidik & Staf
insert into public.sh_profiles (id, app_code, name, username, title, email, phone, roles, specialty, specialties, avatar_url, is_developer, is_tu_admin)
values
  ('u-dwi', 'SDKR-HUB-2026', 'Dwi Windarti, S.E', 'dwi.windarti', 'Kepala Sekolah', 'dwi.windarti@sdkhoirurroziqiin.sch.id', '081223344552', '{"Kepala Sekolah"}', 'Kepala Sekolah', '{"Kepala Sekolah","Karakter Magnet Rezeki","Pendidikan Pancasila"}', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', false, false),
  ('u-maya', 'SDKR-HUB-2026', 'Maya Rahmayanti, S.Pd', 'maya.rahmayanti', 'Wali kelas 1', 'maya.rahmayanti@sdkhoirurroziqiin.sch.id', '081223344553', '{"Guru Kelas"}', 'Pendidikan Pancasila', '{"Pendidikan Pancasila","Bahasa Indonesia","Matematika"}', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', false, false),
  ('u-fauziah', 'SDKR-HUB-2026', 'Fauziah Hasanah, S.Pd', 'fauziah.hasanah', 'Wali kelas 4', 'fauziah.hasanah@sdkhoirurroziqiin.sch.id', '081223344554', '{"Guru Kelas","Guru Mapel"}', 'IPAS (Sains & Sosial)', '{"IPAS (Sains & Sosial)","Matematika","Bahasa Indonesia"}', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', false, false),
  ('u-sopianto', 'SDKR-HUB-2026', 'Sopianto Djahar, S.Pd', 'sopianto.djahar', 'Developer', 'sopianto.djahar@sdkhoirurroziqiin.sch.id', '081223344550', '{"Developer"}', 'Developer', '{"Developer","TIK (Informatika & Komputer)","Matematika","Sains & Eksperimen"}', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', true, false),
  ('u-yulianti', 'SDKR-HUB-2026', 'Yulianti Nurzakiah, S.Pd', 'yulianti.nurzakiah', 'Wali kelas 2', 'yulianti.nurzakiah@sdkhoirurroziqiin.sch.id', '081223344555', '{"Guru Kelas"}', 'Matematika', '{"Matematika","Bahasa Indonesia","Seni Rupa"}', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150', false, false),
  ('u-rizal', 'SDKR-HUB-2026', 'Rizal Zatmika, S.Pd', 'rizal.zatmika', 'Wali Kelas 3', 'rizal.zatmika@sdkhoirurroziqiin.sch.id', '081223344556', '{"Guru Kelas"}', 'Bahasa Indonesia', '{"Bahasa Indonesia","Pendidikan Pancasila","IPAS"}', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', false, false),
  ('u-ike', 'SDKR-HUB-2026', 'Ike Ristiawati, S.H', 'ike.ristiawati', 'Wali kelas 6', 'ike.ristiawati@sdkhoirurroziqiin.sch.id', '081223344557', '{"Guru Kelas"}', 'Pendidikan Pancasila', '{"Pendidikan Pancasila","Bahasa Indonesia","Matematika"}', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150', false, false),
  ('u-shava', 'SDKR-HUB-2026', 'Hj. Shava Nadliya A, S.Psi.I', 'shava.nadliya', 'Guru Tahfidz', 'shava.nadliya@sdkhoirurroziqiin.sch.id', '081223344558', '{"Guru Mapel"}', 'Tahfidz Al-Qur''an', '{"Tahfidz Al-Qur''an","PAI (Pendidikan Agama Islam)"}', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', false, false),
  ('u-frida', 'SDKR-HUB-2026', 'Frida Firdiani, S.Kom.I, M.Pd.I', 'frida.firdiani', 'Wali Kelas 5', 'frida.firdiani@sdkhoirurroziqiin.sch.id', '081223344559', '{"Guru Kelas"}', 'PAI (Pendidikan Agama Islam)', '{"PAI (Pendidikan Agama Islam)","Bahasa Arab","Karakter Magnet Rezeki"}', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', false, false),
  ('u-silvi', 'SDKR-HUB-2026', 'Silvi Oktaviani, S.Kom', 'silvi.oktaviani', 'TU & Bendahara', 'silvi.oktaviani@sdkhoirurroziqiin.sch.id', '081223344551', '{"Administrator"}', 'TU & Bendahara', '{"TU & Bendahara","Administrasi Keuangan","Sarpras"}', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', false, true),
  ('u-azhar', 'SDKR-HUB-2026', 'Azhar', 'azhar', 'Shadow teacher', 'azhar@sdkhoirurroziqiin.sch.id', '081223344560', '{"Shadow Teacher","Guru Mapel"}', 'PJOK (Pendidikan Jasmani)', '{"PJOK (Pendidikan Jasmani)","Shadow Teacher","Kepanduan Pramuka"}', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', false, false),
  ('u-cepi', 'SDKR-HUB-2026', 'Cepi', 'cepi', 'Shadow teacher', 'cepi@sdkhoirurroziqiin.sch.id', '081223344561', '{"Shadow Teacher"}', 'Shadow Teacher', '{"Shadow Teacher","Pendampingan ABK"}', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', false, false),
  ('u-deni', 'SDKR-HUB-2026', 'Deni', 'deni', 'Sarpras', 'deni@sdkhoirurroziqiin.sch.id', '081223344562', '{"Sarpras"}', 'Sarpras', '{"Sarpras","Inventaris & Logistik"}', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', false, false)
on conflict (id) do nothing;

-- 6 Rombongan Belajar (Kelas 1 - 6)
insert into public.sh_classes (id, app_code, name, grade_level, wali_kelas_id, room_name, student_count)
values
  ('c1', 'SDKR-HUB-2026', 'Kelas 1', 1, 'u-maya', 'Gedung A • R.101', 1),
  ('c2', 'SDKR-HUB-2026', 'Kelas 2', 2, 'u-yulianti', 'Gedung A • R.102', 8),
  ('c3', 'SDKR-HUB-2026', 'Kelas 3', 3, 'u-rizal', 'Gedung A • R.103', 13),
  ('c4', 'SDKR-HUB-2026', 'Kelas 4', 4, 'u-fauziah', 'Gedung B • R.201', 12),
  ('c5', 'SDKR-HUB-2026', 'Kelas 5', 5, 'u-frida', 'Gedung B • R.202', 11),
  ('c6', 'SDKR-HUB-2026', 'Kelas 6', 6, 'u-ike', 'Gedung B • R.203', 10)
on conflict (id) do nothing;

-- 5 Hari Jadwal Piket Harian (Senin - Jumat)
insert into public.sh_piket_schedules (id, app_code, day_of_week, day_name, piket_lapangan_teacher_id, piket_kantor_teacher_id, start_time, end_time, notes)
values
  ('ps-1', 'SDKR-HUB-2026', 1, 'Senin', 'u-maya', 'u-deni', '06:45', '15:00', 'Upacara Bendera, Sapa Pagi di Gerbang, Sholat Dhuha Berjamaah.'),
  ('ps-2', 'SDKR-HUB-2026', 2, 'Selasa', 'u-azhar', 'u-frida', '06:45', '15:00', 'Sapa Pagi Ramah, Sholat Dhuha, Ketertiban Halaqah Tahfidz Pagi.'),
  ('ps-3', 'SDKR-HUB-2026', 3, 'Rabu', 'u-frida', 'u-rizal', '06:45', '15:00', 'Sapa Pagi, Sholat Dhuha, Karakter Magnet Rezeki, Penugasan Guru Pengganti.'),
  ('ps-4', 'SDKR-HUB-2026', 4, 'Kamis', 'u-fauziah', 'u-yulianti', '06:45', '15:00', 'Sapa Pagi, Sholat Dhuha, Patroli Kebersihan Toilet & Halaman.'),
  ('ps-5', 'SDKR-HUB-2026', 5, 'Jumat', 'u-ike', 'u-shava', '06:45', '15:00', 'Jumat Berkah & Sapa Pagi, Sholat Dhuha & Dzikir Pagi, Pengawasan Kepulangan Tertib.')
on conflict (id) do nothing;
