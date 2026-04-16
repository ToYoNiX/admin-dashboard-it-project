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
  userName: string;
  userAvatarUrl?: string | null;
  unreadMessagesCount: number;
  onClearNotifications: () => void;
  isSuperAdmin: boolean;
  onOpenSettings: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
}
export function DashboardLayout({
  children,
  activePage,
  onPageChange,
  sidebarCollapsed,
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  userName,
  userAvatarUrl,
  unreadMessagesCount,
  onClearNotifications,
  isSuperAdmin,
  onOpenSettings,
  onLogout,
  isLoggingOut = false
}: DashboardLayoutProps) {
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <Navbar
        onToggleSidebar={onToggleSidebar}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        userName={userName}
        userAvatarUrl={userAvatarUrl}
        unreadMessagesCount={unreadMessagesCount}
        onClearNotifications={onClearNotifications}
        onOpenSettings={onOpenSettings}
        onLogout={onLogout}
        isLoggingOut={isLoggingOut} />


      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onPageChange={onPageChange}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          isSuperAdmin={isSuperAdmin} />


        <main className="flex-1 overflow-y-auto scrollbar-custom flex flex-col bg-must-bg">
          <div className="flex-1 p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>);

}