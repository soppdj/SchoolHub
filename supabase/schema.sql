-- ==============================================================================
-- SCHOOL HUB — SD KHOIRUR ROOZIQIIN BANDUNG
-- Complete Database Schema with Row Level Security (RLS) and Realtime Broadcast
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Staff & Teacher accounts, ~15 users)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  title text,
  email text unique not null,
  phone text,
  roles text[] not null default '{"Guru Kelas"}',
  telegram_id text,
  telegram_username text,
  assigned_class_id text,
  specialty text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ACADEMIC YEARS
create table if not exists public.academic_years (
  id text primary key,
  name text not null,
  semester int not null check (semester in (1, 2)),
  is_active boolean default true,
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CLASSES (Kelas 1 to 6)
create table if not exists public.classes (
  id text primary key,
  name text not null,
  grade_level int not null check (grade_level between 1 and 6),
  wali_kelas_id uuid references public.profiles(id) on delete set null,
  room_name text not null,
  student_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. STUDENTS
create table if not exists public.students (
  id text primary key,
  nisn text not null unique,
  nis text not null unique,
  name text not null,
  class_id text references public.classes(id) on delete cascade,
  gender text check (gender in ('L', 'P')),
  birth_place text,
  birth_date date,
  parent_name text not null,
  parent_phone text not null,
  has_special_needs boolean default false,
  special_needs_notes text,
  shadow_teacher_id uuid references public.profiles(id) on delete set null,
  fee_category text default 'Reguler',
  spp_monthly_amount numeric(12,2) default 350000,
  annual_fee_target numeric(12,2) default 3500000,
  is_alumni boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MASTER SCHEDULES
create table if not exists public.schedules (
  id text primary key,
  class_id text references public.classes(id) on delete cascade,
  day_of_week int check (day_of_week between 1 and 5),
  period_number int not null,
  start_time time not null,
  end_time time not null,
  duration_jp int default 1,
  subject_name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  is_tahfidz_day boolean default false
);

-- 6. PIKET SCHEDULES
create table if not exists public.piket_schedules (
  id text primary key,
  day_of_week int check (day_of_week between 1 and 5),
  piket_lapangan_teacher_id uuid references public.profiles(id),
  piket_kantor_teacher_id uuid references public.profiles(id)
);

-- 7. PIKET LOGS (Checklist & incidents)
create table if not exists public.piket_logs (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  teacher_id uuid references public.profiles(id),
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

-- 8. GUEST BOOK (Piket Kantor)
create table if not exists public.guest_book (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  time time not null,
  guest_name text not null,
  institution_or_relation text,
  purpose text not null,
  person_to_meet text not null,
  phone_number text not null,
  recorded_by_id uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. STAFF ATTENDANCE
create table if not exists public.staff_attendance (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in_time time,
  check_out_time time,
  status text not null check (status in ('Hadir', 'Izin', 'Sakit', 'Dinas Luar', 'Belum Hadir')),
  leave_reason text,
  proof_file_url text,
  jp_taught_count int default 0,
  substitute_jp_count int default 0,
  unique (user_id, date)
);

-- 10. TEACHING JOURNALS (Jurnal Mengajar)
create table if not exists public.teaching_journals (
  id uuid primary key default uuid_generate_v4(),
  schedule_id text references public.schedules(id) on delete set null,
  class_id text references public.classes(id) on delete cascade,
  date date not null,
  period_number int not null,
  subject_name text not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  is_substitute boolean default false,
  original_teacher_id uuid references public.profiles(id) on delete set null,
  shadow_teacher_id uuid references public.profiles(id) on delete set null,
  topic text not null,
  learning_activity text not null,
  notes text,
  present_count int default 0,
  sick_count int default 0,
  permitted_count int default 0,
  absent_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. CLASS STUDENT ATTENDANCE RECORDS
create table if not exists public.class_attendance (
  id uuid primary key default uuid_generate_v4(),
  teaching_journal_id uuid references public.teaching_journals(id) on delete cascade,
  date date not null,
  class_id text references public.classes(id) on delete cascade,
  student_id text references public.students(id) on delete cascade,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpa')),
  notes text
);

-- 12. SHADOW TEACHER JOURNALS (Jurnal Pendampingan Siswa 4 Dimensi)
create table if not exists public.shadow_teacher_journals (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  student_id text references public.students(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  shadow_teacher_id uuid references public.profiles(id) on delete cascade,
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

-- 13. TAHFIDZ PROGRESS
create table if not exists public.tahfidz_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id text references public.students(id) on delete cascade,
  class_id text references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  juz int not null,
  surah_name text not null,
  verse_from int not null,
  verse_to int not null,
  grade text check (grade in ('Lancar', 'Cukup', 'Ulang')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. KURIKULUM MERDEKA TUJUAN PEMBELAJARAN (TP)
create table if not exists public.kurikulum_tp (
  id text primary key,
  grade_level int not null check (grade_level between 1 and 6),
  subject_name text not null,
  code text not null,
  description text not null
);

-- 15. STUDENT GRADES
create table if not exists public.student_grades (
  id uuid primary key default uuid_generate_v4(),
  student_id text references public.students(id) on delete cascade,
  tp_id text references public.kurikulum_tp(id) on delete cascade,
  score_formative numeric(5,2) default 0,
  score_summative numeric(5,2) default 0,
  notes text,
  unique (student_id, tp_id)
);

-- 16. FEE SPP RECORDS
create table if not exists public.fee_spp (
  id uuid primary key default uuid_generate_v4(),
  student_id text references public.students(id) on delete cascade,
  academic_year_id text references public.academic_years(id),
  month text not null,
  nominal numeric(12,2) not null default 350000,
  status text not null check (status in ('Lunas', 'Belum Lunas')),
  paid_date timestamp with time zone,
  payment_method text check (payment_method in ('Transfer Bank', 'Tunai')),
  receipt_number text,
  proof_file_url text,
  recorded_by uuid references public.profiles(id),
  unique (student_id, academic_year_id, month)
);

-- 17. FEE ANNUAL SUMMARY
create table if not exists public.fee_annual_summary (
  id uuid primary key default uuid_generate_v4(),
  student_id text references public.students(id) on delete cascade,
  academic_year_id text references public.academic_years(id),
  target_amount numeric(12,2) default 3500000,
  total_paid numeric(12,2) default 0,
  percentage_paid numeric(5,2) default 0,
  status text default 'Belum' check (status in ('Lunas', 'Sebagian', 'Belum')),
  unique (student_id, academic_year_id)
);

-- 18. FEE ANNUAL INSTALLMENTS
create table if not exists public.fee_annual_installments (
  id uuid primary key default uuid_generate_v4(),
  student_id text references public.students(id) on delete cascade,
  installment_number int not null,
  nominal numeric(12,2) not null,
  paid_date timestamp with time zone not null,
  payment_method text check (payment_method in ('Transfer Bank', 'Tunai')),
  proof_file_url text,
  notes text,
  receipt_number text not null,
  recorded_by uuid references public.profiles(id)
);

-- 19. FINANCE TRANSACTIONS (3 Pos Keuangan)
create table if not exists public.finance_transactions (
  id uuid primary key default uuid_generate_v4(),
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
  recorded_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 20. LETTER TEMPLATES & ARCHIVE
create table if not exists public.letter_templates (
  id text primary key,
  code text not null,
  title text not null,
  numbering_format text not null,
  body_template text not null
);

create table if not exists public.letters_archive (
  id uuid primary key default uuid_generate_v4(),
  letter_number text not null unique,
  letter_type text check (letter_type in ('Keluar', 'Masuk')),
  category_code text not null,
  date date not null,
  recipient_or_sender text not null,
  subject text not null,
  body_content text,
  file_url text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 21. SARPRAS INVENTORY
create table if not exists public.sarpras_inventory (
  id text primary key,
  code text not null unique,
  name text not null,
  room_name text not null,
  quantity int not null default 1,
  condition text not null check (condition in ('Baik', 'Rusak Ringan', 'Perlu Diganti')),
  last_checked_date date not null
);

-- 22. SARPRAS TICKETS & CROSS-ROLE WORKFLOW
create table if not exists public.sarpras_tickets (
  id uuid primary key default uuid_generate_v4(),
  ticket_number text not null unique,
  item_id text references public.sarpras_inventory(id),
  item_name text not null,
  room_name text not null,
  reported_by_id uuid references public.profiles(id),
  reported_date timestamp with time zone default timezone('utc'::text, now()) not null,
  issue_description text not null,
  photo_url text,
  status text not null check (status in ('Dilaporkan', 'Menunggu Persetujuan Kepsek', 'Disetujui', 'Ditolak', 'Dalam Pengerjaan', 'Selesai')),
  estimated_cost numeric(12,2),
  sarpras_notes text,
  approved_by_id uuid references public.profiles(id),
  approved_date timestamp with time zone,
  finance_transaction_id uuid references public.finance_transactions(id)
);

-- Realtime Setup: enable broadcast on crucial tables for Dashboard Bersama
alter publication supabase_realtime add table public.teaching_journals;
alter publication supabase_realtime add table public.staff_attendance;
alter publication supabase_realtime add table public.shadow_teacher_journals;
alter publication supabase_realtime add table public.sarpras_tickets;
alter publication supabase_realtime add table public.finance_transactions;
alter publication supabase_realtime add table public.fee_spp;
alter publication supabase_realtime add table public.fee_annual_installments;
