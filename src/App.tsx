import React, { useEffect, useState } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Requests } from './pages/Requests';
import { Schedules } from './pages/Schedules';
import { Announcements } from './pages/Announcements';
import { Reports } from './pages/Reports';
import { Messages } from './pages/Messages';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
export function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Students':
        return <Students />;
      case 'Requests':
        return <Requests />;
      case 'Schedules':
        return <Schedules />;
      case 'Announcements':
        return <Announcements />;
      case 'Reports':
        return <Reports />;
      case 'Messages':
        return <Messages />;
      case 'Documents':
        return <Documents />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };
  return (
    <DashboardLayout
      activePage={activePage}
      onPageChange={setActivePage}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}>

      {renderPage()}
    </DashboardLayout>);

}