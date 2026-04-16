import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}
export function DashboardLayout({
  children,
  activePage,
  onPageChange,
  sidebarCollapsed,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Navbar
        onToggleSidebar={onToggleSidebar}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode} />


      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onPageChange={onPageChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar} />


        <main className="flex-1 overflow-y-auto scrollbar-custom flex flex-col bg-must-bg">
          <div className="flex-1 p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>);

}