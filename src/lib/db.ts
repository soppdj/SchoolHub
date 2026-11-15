import Dexie, { Table } from 'dexie';
import {
  UserProfile,
  AcademicYear,
  SchoolClass,
  Student,
  MasterScheduleItem,
  PiketSchedule,
  StaffAttendance,
  TeachingJournal,
  ShadowTeacherJournal,
  TahfidzProgress,
  KurikulumTP,
  StudentGrade,
  FeeSppRecord,
  FeeAnnualSummary,
  FeeAnnualInstallment,
  FinanceTransaction,
  LetterTemplate,
  LetterArchive,
  SarprasItem,
  SarprasTicket,
  GuestBookEntry,
  PiketLapanganChecklist,
  OfflineSyncQueueItem,
  PrincipalAgendaItem,
} from '../types';
import {
  SEED_ACADEMIC_YEAR,
  SEED_STAFF,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_SCHEDULES,
  SEED_PIKET_SCHEDULES,
  SEED_STAFF_ATTENDANCE,
  SEED_TEACHING_JOURNALS,
  SEED_SHADOW_JOURNALS,
  SEED_TAHFIDZ,
  SEED_KURIKULUM_TP,
  SEED_GRADES,
  SEED_FEE_SPP,
  SEED_FEE_ANNUAL_SUMMARY,
  SEED_FEE_ANNUAL_INSTALLMENTS,
  SEED_FINANCE_TRANSACTIONS,
  SEED_LETTER_TEMPLATES,
  SEED_LETTER_ARCHIVES,
  SEED_SARPRAS_ITEMS,
  SEED_SARPRAS_TICKETS,
  SEED_PIKET_CHECKLIST,
  SEED_GUEST_BOOK,
  SEED_PRINCIPAL_AGENDA,
} from './seedData';

export class SchoolHubDatabase extends Dexie {
  profiles!: Table<UserProfile, string>;
  academic_years!: Table<AcademicYear, string>;
  classes!: Table<SchoolClass, string>;
  students!: Table<Student, string>;
  schedules!: Table<MasterScheduleItem, string>;
  piket_schedules!: Table<PiketSchedule, string>;
  staff_attendance!: Table<StaffAttendance, string>;
  teaching_journals!: Table<TeachingJournal, string>;
  shadow_journals!: Table<ShadowTeacherJournal, string>;
  tahfidz_progress!: Table<TahfidzProgress, string>;
  kurikulum_tp!: Table<KurikulumTP, string>;
  student_grades!: Table<StudentGrade, string>;
  fee_spp!: Table<FeeSppRecord, string>;
  fee_annual_summary!: Table<FeeAnnualSummary, string>;
  fee_annual_installments!: Table<FeeAnnualInstallment, string>;
  finance_transactions!: Table<FinanceTransaction, string>;
  letter_templates!: Table<LetterTemplate, string>;
  letter_archives!: Table<LetterArchive, string>;
  sarpras_items!: Table<SarprasItem, string>;
  sarpras_tickets!: Table<SarprasTicket, string>;
  piket_checklists!: Table<PiketLapanganChecklist, string>;
  guest_book!: Table<GuestBookEntry, string>;
  principal_agenda!: Table<PrincipalAgendaItem, string>;
  offline_sync_queue!: Table<OfflineSyncQueueItem, number>;

  constructor() {
    super('SchoolHub_SDKhoirurRooziqiin');
    this.version(1).stores({
      profiles: 'id, email, *roles, assigned_class_id',
      academic_years: 'id, is_active',
      classes: 'id, grade_level, wali_kelas_id',
      students: 'id, nisn, nis, class_id, has_special_needs',
      schedules: 'id, class_id, day_of_week, period_number, teacher_id',
      piket_schedules: 'id, day_of_week',
      staff_attendance: 'id, user_id, date, status',
      teaching_journals: 'id, class_id, date, teacher_id, period_number',
      shadow_journals: 'id, student_id, class_id, shadow_teacher_id, date',
      tahfidz_progress: 'id, student_id, class_id, date, juz',
      kurikulum_tp: 'id, grade_level, subject_name',
      student_grades: 'id, student_id, tp_id',
      fee_spp: 'id, student_id, month, status',
      fee_annual_summary: 'id, student_id, status',
      fee_annual_installments: 'id, student_id, installment_number, paid_date',
      finance_transactions: 'id, transaction_number, date, pos_keuangan, is_draft',
      letter_templates: 'id, code',
      letter_archives: 'id, letter_number, letter_type, date',
      sarpras_items: 'id, code, room_name, condition',
      sarpras_tickets: 'id, ticket_number, room_name, status, reported_by_id',
      piket_checklists: 'id, date, teacher_id',
      guest_book: 'id, date, time',
      principal_agenda: 'id, type, date, status, priority',
      offline_sync_queue: '++id, table_name, action, timestamp, synced',
    });
  }
}

export const db = new SchoolHubDatabase();

// Pre-populate Dexie database if empty or if schedules need upgrade
export async function initializeLocalDatabase() {
  const staffCount = await db.profiles.count();
  if (staffCount === 0) {
    console.log('🌱 Initializing local database with SD Khoirur Rooziqiin Bandung seed data...');
    await db.academic_years.put(SEED_ACADEMIC_YEAR);
    await db.profiles.bulkPut(SEED_STAFF);
    await db.classes.bulkPut(SEED_CLASSES);
    await db.students.bulkPut(SEED_STUDENTS);
    await db.schedules.bulkPut(SEED_SCHEDULES);
    await db.piket_schedules.bulkPut(SEED_PIKET_SCHEDULES);
    await db.staff_attendance.bulkPut(SEED_STAFF_ATTENDANCE);
    await db.teaching_journals.bulkPut(SEED_TEACHING_JOURNALS);
    await db.shadow_journals.bulkPut(SEED_SHADOW_JOURNALS);
    await db.tahfidz_progress.bulkPut(SEED_TAHFIDZ);
    await db.kurikulum_tp.bulkPut(SEED_KURIKULUM_TP);
    await db.student_grades.bulkPut(SEED_GRADES);
    await db.fee_spp.bulkPut(SEED_FEE_SPP);
    await db.fee_annual_summary.bulkPut(SEED_FEE_ANNUAL_SUMMARY);
    await db.fee_annual_installments.bulkPut(SEED_FEE_ANNUAL_INSTALLMENTS);
    await db.finance_transactions.bulkPut(SEED_FINANCE_TRANSACTIONS);
    await db.letter_templates.bulkPut(SEED_LETTER_TEMPLATES);
    await db.letter_archives.bulkPut(SEED_LETTER_ARCHIVES);
    await db.sarpras_items.bulkPut(SEED_SARPRAS_ITEMS);
    await db.sarpras_tickets.bulkPut(SEED_SARPRAS_TICKETS);
    await db.piket_checklists.put(SEED_PIKET_CHECKLIST);
    await db.guest_book.bulkPut(SEED_GUEST_BOOK);
    await db.principal_agenda.bulkPut(SEED_PRINCIPAL_AGENDA);
    console.log('✅ Local database initialized successfully!');
  } else {
    // Check if staff roster needs upgrade to official 12 teachers and clean template data
    const sopianto = await db.profiles.get('u-sopianto');
    if (!sopianto) {
      console.log('🔄 Upgrading local database with official 12 teachers roster and clean template data...');
      await db.profiles.clear();
      await db.profiles.bulkPut(SEED_STAFF);
      await db.classes.clear();
      await db.classes.bulkPut(SEED_CLASSES);
      await db.students.clear();
      await db.students.bulkPut(SEED_STUDENTS);
      await db.staff_attendance.clear();
      await db.staff_attendance.bulkPut(SEED_STAFF_ATTENDANCE);
      await db.teaching_journals.clear();
      await db.teaching_journals.bulkPut(SEED_TEACHING_JOURNALS);
      await db.shadow_journals.clear();
      await db.shadow_journals.bulkPut(SEED_SHADOW_JOURNALS);
      await db.tahfidz_progress.clear();
      await db.tahfidz_progress.bulkPut(SEED_TAHFIDZ);
      await db.student_grades.clear();
      await db.student_grades.bulkPut(SEED_GRADES);
      await db.fee_spp.clear();
      await db.fee_spp.bulkPut(SEED_FEE_SPP);
      await db.fee_annual_summary.clear();
      await db.fee_annual_summary.bulkPut(SEED_FEE_ANNUAL_SUMMARY);
      await db.fee_annual_installments.clear();
      await db.fee_annual_installments.bulkPut(SEED_FEE_ANNUAL_INSTALLMENTS);
      await db.finance_transactions.clear();
      await db.finance_transactions.bulkPut(SEED_FINANCE_TRANSACTIONS);
      await db.letter_archives.clear();
      await db.letter_archives.bulkPut(SEED_LETTER_ARCHIVES);
      await db.sarpras_items.clear();
      await db.sarpras_items.bulkPut(SEED_SARPRAS_ITEMS);
      await db.sarpras_tickets.clear();
      await db.sarpras_tickets.bulkPut(SEED_SARPRAS_TICKETS);
      await db.guest_book.clear();
      await db.guest_book.bulkPut(SEED_GUEST_BOOK);
      await db.principal_agenda.clear();
      await db.principal_agenda.bulkPut(SEED_PRINCIPAL_AGENDA);
      await db.piket_schedules.clear();
      await db.piket_schedules.bulkPut(SEED_PIKET_SCHEDULES);
      await db.schedules.clear();
      await db.schedules.bulkPut(SEED_SCHEDULES);
      console.log('✅ Local database upgraded to official 12 teachers and clean template data!');
    }
  }
}

// Queue offline mutations
export async function queueOfflineMutation(tableName: string, action: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) {
  await db.offline_sync_queue.add({
    table_name: tableName,
    action,
    payload,
    timestamp: Date.now(),
    synced: false,
  });
}

// Flush queue to backend (or simulate sync resolution)
export async function flushOfflineSyncQueue(): Promise<{ syncedCount: number; errors: number }> {
  const pending = await db.offline_sync_queue.where('synced').equals(0).toArray();
  let syncedCount = 0;
  let errors = 0;

  for (const item of pending) {
    try {
      // In standalone/mock mode or with Firebase, mark item as synced
      if (item.id) {
        await db.offline_sync_queue.update(item.id, { synced: true });
        syncedCount++;
      }
    } catch (err) {
      errors++;
      console.error('Failed to sync queue item:', item, err);
    }
  }

  return { syncedCount, errors };
}
