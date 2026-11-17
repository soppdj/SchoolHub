import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  UserProfile,
  UserRole,
  SchoolClass,
  Student,
  MasterScheduleItem,
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
  PiketSchedule,
  PiketLapanganChecklist,
  GuestBookEntry,
  PrincipalAgendaItem,
  RppModulDocument,
} from '../types';
import { db, initializeLocalDatabase, flushOfflineSyncQueue } from '../lib/db';
import { realtimeHub, RealtimeEvent, isFirebaseConfigured, firestore } from '../lib/firebase';
import { pushToFirestore, deleteFromFirestore, listenToFirestoreCollection } from '../lib/firestoreSync';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  logout: () => void;
  allStaff: UserProfile[];
  activeRoles: UserRole[];
  toggleActiveRole: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  networkStatus: 'online' | 'offline' | 'syncing';
  triggerSync: () => Promise<void>;
  pendingSyncCount: number;

  // Master Data
  classes: SchoolClass[];
  students: Student[];
  schedules: MasterScheduleItem[];
  staffAttendance: StaffAttendance[];
  teachingJournals: TeachingJournal[];
  shadowJournals: ShadowTeacherJournal[];
  tahfidzProgress: TahfidzProgress[];
  kurikulumTps: KurikulumTP[];
  studentGrades: StudentGrade[];
  feeSppRecords: FeeSppRecord[];
  feeAnnualSummaries: FeeAnnualSummary[];
  feeAnnualInstallments: FeeAnnualInstallment[];
  financeTransactions: FinanceTransaction[];
  letterTemplates: LetterTemplate[];
  letterArchives: LetterArchive[];
  sarprasItems: SarprasItem[];
  sarprasTickets: SarprasTicket[];
  piketSchedules: PiketSchedule[];
  piketChecklists: PiketLapanganChecklist[];
  guestBookEntries: GuestBookEntry[];
  principalAgendas: PrincipalAgendaItem[];
  rppDocuments: RppModulDocument[];

  // Student Attendance Synchronized State
  dailyAttendanceMap: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'>;
  updateStudentAttendance: (
    classId: string,
    date: string,
    studentId: string,
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'
  ) => void;
  batchUpdateStudentAttendance: (
    updates: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'>
  ) => void;
  studentAttendanceSummary: {
    total: number;
    present: number;
    sick: number;
    permitted: number;
    absent: number;
    pct: string;
  };

  // Live simulation states for Dashboard Bersama
  simulatedTime: string; // e.g. "08:40"
  setSimulatedTime: (time: string) => void;
  simulatedDay: number; // 1 to 5
  setSimulatedDay: (day: number) => void;
  isSimulatingRedState: boolean;
  setIsSimulatingRedState: (val: boolean) => void;

  // Telegram Drawer
  isTelegramDrawerOpen: boolean;
  setIsTelegramDrawerOpen: (val: boolean) => void;

  // Actions
  recordTeachingJournal: (journal: Omit<TeachingJournal, 'id' | 'created_at'>) => Promise<void>;
  recordShadowJournal: (journal: Omit<ShadowTeacherJournal, 'id' | 'created_at'>) => Promise<void>;
  assignSubstituteTeacher: (classId: string, scheduleId: string, substituteTeacherId: string) => Promise<void>;
  reportSarprasTicket: (ticket: Omit<SarprasTicket, 'id' | 'ticket_number' | 'reported_date' | 'status'>) => Promise<void>;
  approveSarprasTicket: (ticketId: string, estimatedCost: number) => Promise<void>;
  rejectSarprasTicket: (ticketId: string, reason: string) => Promise<void>;
  settleFinanceDraft: (transactionId: string, pos: any) => Promise<void>;
  saveScheduleItem: (schedule: MasterScheduleItem) => Promise<void>;
  deleteScheduleItem: (scheduleId: string) => Promise<void>;
  savePiketSchedule: (schedule: PiketSchedule) => Promise<void>;
  addRppDocument: (doc: Omit<RppModulDocument, 'id' | 'uploaded_at'>) => Promise<void>;
  deleteRppDocument: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  id: 'u-sopianto',
  name: 'Sopianto Djahar, S.Pd',
  username: 'sopianto.djahar',
  password: 'sopianto123',
  title: 'Developer',
  email: 'sopianto.djahar@sdkhoirurroziqiin.sch.id',
  phone: '081223344550',
  roles: ['Developer'],
  specialty: 'Developer',
  specialties: ['Developer', 'TIK (Informatika & Komputer)', 'Matematika', 'Sains & Eksperimen', 'Kepanduan Pramuka'],
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  is_active: true,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('schoolhub_auth_user_id'));
  });
  const [activeRoles, setActiveRoles] = useState<UserRole[]>(DEFAULT_PROFILE.roles);
  const [activeTab, setActiveTab] = useState<string>('dashboard_bersama');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isTelegramDrawerOpen, setIsTelegramDrawerOpen] = useState<boolean>(false);

  // Live Simulation state
  const [simulatedTime, setSimulatedTime] = useState<string>('08:35');
  const [simulatedDay, setSimulatedDay] = useState<number>(2); // 2 = Tuesday / Selasa
  const [isSimulatingRedState, setIsSimulatingRedState] = useState<boolean>(false);

  // Initialize database
  useEffect(() => {
    initializeLocalDatabase();
  }, []);

  // Network online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('syncing');
      flushOfflineSyncQueue().then(() => {
        setNetworkStatus('online');
      });
    };
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time Firestore synchronizer for live PWA multi-client reactivity
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubs = [
      listenToFirestoreCollection<MasterScheduleItem>('schedules', (remoteSchedules) => {
        if (remoteSchedules && remoteSchedules.length > 0) {
          db.schedules.bulkPut(remoteSchedules);
        }
      }),
      listenToFirestoreCollection<StaffAttendance>('staff_attendance', (remoteAttendance) => {
        if (remoteAttendance && remoteAttendance.length > 0) {
          db.staff_attendance.bulkPut(remoteAttendance);
        }
      }),
      listenToFirestoreCollection<TeachingJournal>('teaching_journals', (remoteJournals) => {
        if (remoteJournals && remoteJournals.length > 0) {
          db.teaching_journals.bulkPut(remoteJournals);
        }
      }),
      listenToFirestoreCollection<ShadowTeacherJournal>('shadow_journals', (remoteShadows) => {
        if (remoteShadows && remoteShadows.length > 0) {
          db.shadow_journals.bulkPut(remoteShadows);
        }
      }),
      listenToFirestoreCollection<SarprasTicket>('sarpras_tickets', (remoteTickets) => {
        if (remoteTickets && remoteTickets.length > 0) {
          db.sarpras_tickets.bulkPut(remoteTickets);
        }
      }),
      listenToFirestoreCollection<PrincipalAgendaItem>('principal_agenda', (remoteAgendas) => {
        if (remoteAgendas && remoteAgendas.length > 0) {
          db.principal_agenda.bulkPut(remoteAgendas);
        }
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, []);

  // Live queries from Dexie.js
  const allStaff = useLiveQuery(() => db.profiles.toArray()) || [];
  const classes = useLiveQuery(() => db.classes.orderBy('grade_level').toArray()) || [];
  const rawStudents = useLiveQuery(() => db.students.toArray()) || [];
  // Ensure students are always automatically sorted alphabetically by name (A-Z)
  const students = useMemo(() => {
    return [...rawStudents].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  }, [rawStudents]);
  const schedules = useLiveQuery(() => db.schedules.toArray()) || [];
  const staffAttendance = useLiveQuery(() => db.staff_attendance.toArray()) || [];
  const teachingJournals = useLiveQuery(() => db.teaching_journals.toArray()) || [];
  const shadowJournals = useLiveQuery(() => db.shadow_journals.toArray()) || [];
  const tahfidzProgress = useLiveQuery(() => db.tahfidz_progress.toArray()) || [];
  const kurikulumTps = useLiveQuery(() => db.kurikulum_tp.toArray()) || [];
  const studentGrades = useLiveQuery(() => db.student_grades.toArray()) || [];
  const feeSppRecords = useLiveQuery(() => db.fee_spp.toArray()) || [];
  const feeAnnualSummaries = useLiveQuery(() => db.fee_annual_summary.toArray()) || [];
  const feeAnnualInstallments = useLiveQuery(() => db.fee_annual_installments.toArray()) || [];
  const financeTransactions = useLiveQuery(() => db.finance_transactions.toArray()) || [];
  const letterTemplates = useLiveQuery(() => db.letter_templates.toArray()) || [];
  const letterArchives = useLiveQuery(() => db.letter_archives.toArray()) || [];
  const sarprasItems = useLiveQuery(() => db.sarpras_items.toArray()) || [];
  const sarprasTickets = useLiveQuery(() => db.sarpras_tickets.toArray()) || [];
  const piketSchedules = useLiveQuery(() => db.piket_schedules.toArray()) || [];
  const piketChecklists = useLiveQuery(() => db.piket_checklists.toArray()) || [];
  const guestBookEntries = useLiveQuery(() => db.guest_book.toArray()) || [];
  const principalAgendas = useLiveQuery(() => db.principal_agenda.toArray()) || [];

  // Update pending sync count
  useEffect(() => {
    db.offline_sync_queue.where('synced').equals(0).count().then(count => {
      setPendingSyncCount(count);
    });
  }, [teachingJournals, shadowJournals, sarprasTickets, financeTransactions]);

  // Set user from localStorage session, or keep default
  useEffect(() => {
    if (allStaff.length > 0) {
      const savedId = localStorage.getItem('schoolhub_auth_user_id');
      if (savedId) {
        const found = allStaff.find(s => s.id === savedId);
        if (found) {
          setCurrentUser(found);
          setActiveRoles(found.roles);
          setIsAuthenticated(true);
          return;
        }
      }
      const defaultDev = allStaff.find(s => s.roles.includes('Developer')) || allStaff[0];
      if (defaultDev) {
        setCurrentUser(defaultDev);
        setActiveRoles(defaultDev.roles);
      }
    }
  }, [allStaff]);

  const logout = () => {
    localStorage.removeItem('schoolhub_auth_user_id');
    setIsAuthenticated(false);
  };

  // When user changes, sync their active roles
  const handleSetCurrentUser = (user: UserProfile) => {
    localStorage.setItem('schoolhub_auth_user_id', user.id);
    setCurrentUser(user);
    setActiveRoles(user.roles);
    setIsAuthenticated(true);
  };

  // Additive multi-role toggle
  const toggleActiveRole = (role: UserRole) => {
    setActiveRoles(prev => {
      if (prev.includes(role)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(r => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const triggerSync = async () => {
    setNetworkStatus('syncing');
    await flushOfflineSyncQueue();
    setTimeout(() => {
      setNetworkStatus('online');
      setPendingSyncCount(0);
    }, 600);
  };

  // 1. Record Teaching Journal (Instantly flips panel to Green)
  const recordTeachingJournal = async (journalData: Omit<TeachingJournal, 'id' | 'created_at'>) => {
    const id = `tj-${Date.now()}`;
    const newJournal: TeachingJournal = {
      ...journalData,
      id,
      created_at: new Date().toISOString(),
    };
    await db.teaching_journals.put(newJournal);
    pushToFirestore('teaching_journals', newJournal.id, newJournal);
    realtimeHub.broadcast({
      table: 'teaching_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 2. Record Shadow Teacher Journal
  const recordShadowJournal = async (journalData: Omit<ShadowTeacherJournal, 'id' | 'created_at'>) => {
    const id = `sh-${Date.now()}`;
    const newJournal: ShadowTeacherJournal = {
      ...journalData,
      id,
      created_at: new Date().toISOString(),
    };
    await db.shadow_journals.put(newJournal);
    pushToFirestore('shadow_journals', newJournal.id, newJournal);
    realtimeHub.broadcast({
      table: 'shadow_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 3. Assign Substitute Teacher (Red panel -> Green with Guru Pengganti)
  const assignSubstituteTeacher = async (classId: string, scheduleId: string, substituteTeacherId: string) => {
    const sched = schedules.find(s => s.id === scheduleId) || {
      subject_name: 'Pelajaran Terjadwal',
      period_number: 2,
    };
    const id = `tj-sub-${Date.now()}`;
    const newJournal: TeachingJournal = {
      id,
      schedule_id: scheduleId,
      class_id: classId,
      date: '2026-11-10',
      period_number: sched.period_number,
      subject_name: sched.subject_name,
      teacher_id: substituteTeacherId,
      is_substitute: true,
      original_teacher_id: 'teacher_id' in sched ? sched.teacher_id : undefined,
      topic: 'Pendampingan & Pembahasan Tugas oleh Guru Pengganti',
      learning_activity: 'Membahas modul latihan dan penugasan mandiri terbimbing.',
      notes: 'Ditugaskan oleh Guru Piket Lapangan karena guru utama berhalangan.',
      present_count: 18,
      sick_count: 0,
      permitted_count: 0,
      absent_count: 0,
      created_at: new Date().toISOString(),
    };
    await db.teaching_journals.put(newJournal);
    pushToFirestore('teaching_journals', newJournal.id, newJournal);
    realtimeHub.broadcast({
      table: 'teaching_journals',
      eventType: 'INSERT',
      newRecord: newJournal,
    });
  };

  // 4. Report Sarpras Ticket
  const reportSarprasTicket = async (ticketData: Omit<SarprasTicket, 'id' | 'ticket_number' | 'reported_date' | 'status'>) => {
    const id = `tkt-${Date.now().toString().slice(-4)}`;
    const ticketNo = `TKT-2026-${Date.now().toString().slice(-4)}`;
    const newTicket: SarprasTicket = {
      ...ticketData,
      id,
      ticket_number: ticketNo,
      reported_date: new Date().toISOString(),
      status: 'Dilaporkan',
    };
    await db.sarpras_tickets.put(newTicket);
    pushToFirestore('sarpras_tickets', newTicket.id, newTicket);
    // Also update item condition
    const item = sarprasItems.find(i => i.id === ticketData.item_id);
    if (item) {
      await db.sarpras_items.update(item.id, { condition: 'Perlu Diganti' });
    }
    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'INSERT',
      newRecord: newTicket,
    });
  };

  // 5. Approve Sarpras Ticket (Kepsek approves -> AUTOMATICALLY creates Draft Expense in Administrator module!)
  const approveSarprasTicket = async (ticketId: string, estimatedCost: number) => {
    const ticket = sarprasTickets.find(t => t.id === ticketId);
    if (!ticket) return;

    // Create Draft Expense
    const draftId = `ft-draft-${Date.now()}`;
    const draftNumber = `TRX-DRAFT-${Date.now().toString().slice(-4)}`;
    const newDraft: FinanceTransaction = {
      id: draftId,
      transaction_number: draftNumber,
      date: new Date().toISOString().slice(0, 10),
      type: 'Pengeluaran',
      pos_keuangan: 'Kas SPP / Operasional',
      category: 'Perbaikan Sarpras Terjadwal',
      amount: estimatedCost,
      description: `[DRAF OTOMATIS SARPRAS] ${ticket.item_name} di ${ticket.room_name} (Disetujui Kepala Sekolah)`,
      is_draft: true,
      sarpras_ticket_id: ticketId,
      recorded_by: currentUser?.id || 'u-nurul',
    };

    await db.finance_transactions.put(newDraft);
    pushToFirestore('finance_transactions', newDraft.id, newDraft);

    // Update ticket status
    await db.sarpras_tickets.update(ticketId, {
      status: 'Disetujui',
      estimated_cost: estimatedCost,
      approved_by_id: currentUser?.id || 'u-salman',
      approved_date: new Date().toISOString(),
      finance_transaction_id: draftId,
    });
    pushToFirestore('sarpras_tickets', ticketId, {
      status: 'Disetujui',
      estimated_cost: estimatedCost,
      approved_by_id: currentUser?.id || 'u-salman',
      approved_date: new Date().toISOString(),
      finance_transaction_id: draftId,
    });

    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'UPDATE',
      newRecord: { id: ticketId, status: 'Disetujui' },
    });
    realtimeHub.broadcast({
      table: 'finance_transactions',
      eventType: 'INSERT',
      newRecord: newDraft,
    });
  };

  // Reject ticket
  const rejectSarprasTicket = async (ticketId: string, reason: string) => {
    await db.sarpras_tickets.update(ticketId, {
      status: 'Ditolak',
      sarpras_notes: `Ditolak Kepala Sekolah: ${reason}`,
    });
    realtimeHub.broadcast({
      table: 'sarpras_tickets',
      eventType: 'UPDATE',
      newRecord: { id: ticketId, status: 'Ditolak' },
    });
  };

  // 6. Settle Finance Draft (Administrator selects POS and confirms)
  const settleFinanceDraft = async (transactionId: string, pos: any) => {
    await db.finance_transactions.update(transactionId, {
      pos_keuangan: pos,
      is_draft: false,
      transaction_number: `TRX-${Date.now().toString().slice(-6)}`,
    });
    realtimeHub.broadcast({
      table: 'finance_transactions',
      eventType: 'UPDATE',
      newRecord: { id: transactionId, is_draft: false },
    });
  };

  const saveScheduleItem = async (schedule: MasterScheduleItem) => {
    await db.schedules.put(schedule);
    pushToFirestore('schedules', schedule.id, schedule);
    realtimeHub.broadcast({
      table: 'schedules',
      eventType: 'INSERT',
      newRecord: schedule,
    });
  };

  const deleteScheduleItem = async (scheduleId: string) => {
    await db.schedules.delete(scheduleId);
    deleteFromFirestore('schedules', scheduleId);
    realtimeHub.broadcast({
      table: 'schedules',
      eventType: 'DELETE',
      oldRecord: { id: scheduleId },
    });
  };

  const savePiketSchedule = async (schedule: PiketSchedule) => {
    await db.piket_schedules.put(schedule);
    pushToFirestore('piket_schedules', schedule.id, schedule);
    realtimeHub.broadcast({
      table: 'piket_schedules',
      eventType: 'UPDATE',
      newRecord: schedule,
    });
  };

  // Persistent Daily Student Attendance Record (syncs across Dashboard & Teachers)
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'>>(() => {
    try {
      const saved = localStorage.getItem('schoolhub_daily_attendance');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const updateStudentAttendance = (
    classId: string,
    date: string,
    studentId: string,
    status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'
  ) => {
    const key = `${classId}_${date}_${studentId}`;
    setDailyAttendanceMap((prev) => {
      const next = { ...prev, [key]: status };
      localStorage.setItem('schoolhub_daily_attendance', JSON.stringify(next));
      return next;
    });
  };

  const batchUpdateStudentAttendance = (updates: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Netral'>) => {
    setDailyAttendanceMap((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('schoolhub_daily_attendance', JSON.stringify(next));
      return next;
    });
  };

  // Live Student Attendance Summary for Dashboard Bersama (Sinkron Otomatis Realtime)
  const studentAttendanceSummary = useMemo(() => {
    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const isoToday = now.toISOString().split('T')[0];

    // Collect all dates present in dailyAttendanceMap
    const recordedDates = Array.from(
      new Set(
        Object.keys(dailyAttendanceMap)
          .map((k) => k.split('_')[1])
          .filter(Boolean)
      )
    );

    // Pick effective date: prefer localToday, then isoToday, or the latest recorded date
    const effectiveDate = recordedDates.includes(localToday)
      ? localToday
      : recordedDates.includes(isoToday)
      ? isoToday
      : recordedDates.length > 0
      ? recordedDates[recordedDates.length - 1]
      : localToday;

    let sick = 0;
    let permitted = 0;
    let absent = 0;
    let explicitPresent = 0;
    let totalRecorded = 0;

    // Scan all recorded attendances for the effective date
    (students || []).forEach((st: Student) => {
      const key = `${st.class_id}_${effectiveDate}_${st.id}`;
      const status = dailyAttendanceMap[key];
      if (status === 'Sakit') {
        sick++;
        totalRecorded++;
      } else if (status === 'Izin') {
        permitted++;
        totalRecorded++;
      } else if (status === 'Alpa') {
        absent++;
        totalRecorded++;
      } else if (status === 'Hadir') {
        explicitPresent++;
        totalRecorded++;
      }
    });

    const total = students.length || 55;
    // Fallback baseline if no attendances have been marked yet
    const effectiveSick = totalRecorded > 0 ? sick : 2;
    const effectivePermitted = totalRecorded > 0 ? permitted : 1;
    const effectiveAbsent = totalRecorded > 0 ? absent : 0;
    const present = Math.max(0, total - effectiveSick - effectivePermitted - effectiveAbsent);
    const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '94.5';

    return {
      total,
      present,
      sick: effectiveSick,
      permitted: effectivePermitted,
      absent: effectiveAbsent,
      pct,
      effectiveDate,
    };
  }, [students, dailyAttendanceMap]);

  // RPP & Modul Ajar Bank
  const [rppDocuments, setRppDocuments] = useState<RppModulDocument[]>(() => {
    try {
      const saved = localStorage.getItem('schoolhub_rpp_documents');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'rpp-1',
        title: 'Modul Ajar IPAS Bab 2 - Mengenal Siklus Hidup Hewan & Tumbuhan',
        subject_name: 'IPAS (Sains & Sosial)',
        grade_level: 3,
        semester: 'Ganjil',
        teacher_id: 'u-fauziah',
        teacher_name: 'Fauziah Hasanah, S.Pd',
        file_name: 'Modul_Ajar_IPAS_Kls3_Siklus_Hidup.pdf',
        uploaded_at: '2026-11-10T08:00:00Z',
        description: 'Alur Tujuan Pembelajaran fase B untuk eksplorasi metamorfosis dan pengamatan lingkungan sekolah.',
      },
      {
        id: 'rpp-2',
        title: 'RPP Matematika - Operasi Hitung Perkalian Bilangan Cacah',
        subject_name: 'Matematika',
        grade_level: 3,
        semester: 'Ganjil',
        teacher_id: 'u-sopianto',
        teacher_name: 'Sopianto Djahar, S.Pd',
        file_name: 'RPP_Matematika_Perkalian_Kls3.pdf',
        uploaded_at: '2026-11-12T09:30:00Z',
        description: 'Metode kontekstual menggunakan benda konkret & media visual.',
      },
      {
        id: 'rpp-3',
        title: 'Modul Ajar Bahasa Indonesia - Menulis Teks Deskripsi Sederhana',
        subject_name: 'Bahasa Indonesia',
        grade_level: 3,
        semester: 'Ganjil',
        teacher_id: 'u-maya',
        teacher_name: 'Maya Rahmayanti, S.Pd',
        file_name: 'Modul_Ajar_Bindo_Deskripsi.pdf',
        uploaded_at: '2026-11-14T10:15:00Z',
        description: 'Mengenal kata sifat, panca indera, dan struktur kalimat SPOK.',
      },
    ];
  });

  const addRppDocument = async (doc: Omit<RppModulDocument, 'id' | 'uploaded_at'>) => {
    const newDoc: RppModulDocument = {
      ...doc,
      id: `rpp-${Date.now()}`,
      uploaded_at: new Date().toISOString(),
    };
    setRppDocuments((prev) => {
      const next = [newDoc, ...prev];
      localStorage.setItem('schoolhub_rpp_documents', JSON.stringify(next));
      return next;
    });
  };

  const deleteRppDocument = async (id: string) => {
    setRppDocuments((prev) => {
      const next = prev.filter((d) => d.id !== id);
      localStorage.setItem('schoolhub_rpp_documents', JSON.stringify(next));
      return next;
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F2942] text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-school-gold-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-lg font-bold">School Hub — SD Khoirur Rooziqiin Bandung</h2>
          <p className="text-xs text-slate-300">Memuat data dan inisialisasi offline cache...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        isAuthenticated,
        setIsAuthenticated,
        logout,
        allStaff,
        activeRoles,
        toggleActiveRole,
        activeTab,
        setActiveTab,
        networkStatus,
        triggerSync,
        pendingSyncCount,
        classes,
        students,
        schedules,
        staffAttendance,
        teachingJournals,
        shadowJournals,
        tahfidzProgress,
        kurikulumTps,
        studentGrades,
        feeSppRecords,
        feeAnnualSummaries,
        feeAnnualInstallments,
        financeTransactions,
        letterTemplates,
        letterArchives,
        sarprasItems,
        sarprasTickets,
        piketSchedules,
        piketChecklists,
        guestBookEntries,
        principalAgendas,
        rppDocuments,
        dailyAttendanceMap,
        updateStudentAttendance,
        batchUpdateStudentAttendance,
        studentAttendanceSummary,
        simulatedTime,
        setSimulatedTime,
        simulatedDay,
        setSimulatedDay,
        isSimulatingRedState,
        setIsSimulatingRedState,
        isTelegramDrawerOpen,
        setIsTelegramDrawerOpen,
        recordTeachingJournal,
        recordShadowJournal,
        assignSubstituteTeacher,
        reportSarprasTicket,
        approveSarprasTicket,
        rejectSarprasTicket,
        settleFinanceDraft,
        saveScheduleItem,
        deleteScheduleItem,
        savePiketSchedule,
        addRppDocument,
        deleteRppDocument,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
