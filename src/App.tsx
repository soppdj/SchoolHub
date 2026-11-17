import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardBersama } from './components/dashboard/DashboardBersama';
import { GuruModule } from './components/guru/GuruModule';
import { ShadowTeacherModule } from './components/shadow/ShadowTeacherModule';
import { PiketModule } from './components/piket/PiketModule';
import { AdminFinanceModule } from './components/admin/AdminFinanceModule';
import { SarprasModule } from './components/sarpras/SarprasModule';
import { KepsekModule } from './components/kepsek/KepsekModule';
import { DeveloperModule } from './components/developer/DeveloperModule';
import { UserSettingsModule } from './components/settings/UserSettingsModule';
import { TelegramBotSimulator } from './components/telegram/TelegramBotSimulator';
import { AuthScreen } from './components/auth/AuthScreen';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 min-w-0 bg-[#F8FAFC] p-4 lg:p-6 overflow-y-auto h-full scroll-smooth">
      {activeTab === 'dashboard_bersama' && <DashboardBersama />}
      {activeTab === 'guru_akademik' && <GuruModule />}
      {activeTab === 'shadow_teacher' && <ShadowTeacherModule />}
      {activeTab === 'piket' && <PiketModule />}
      {activeTab === 'administrator_finance' && <AdminFinanceModule />}
      {activeTab === 'sarpras' && <SarprasModule />}
      {activeTab === 'kepala_sekolah' && <KepsekModule />}
      {activeTab === 'developer_mode' && <DeveloperModule />}
      {activeTab === 'pengaturan' && <UserSettingsModule />}
    </main>
  );
};

const AppShell: React.FC = () => {
  const { isAuthenticated } = useApp();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <TelegramBotSimulator />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
