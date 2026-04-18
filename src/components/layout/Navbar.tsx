import {
  BellIcon,
  MenuIcon,
  LogOutIcon,
  MoonIcon,
  SunIcon,
  SettingsIcon,
  PlaneIcon } from
'lucide-react';
import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
interface NavbarProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  userName: string;
  userAvatarUrl?: string | null;
  unreadMessagesCount: number;
  onClearNotifications: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  isLoggingOut?: boolean;
}
export function Navbar({
  onToggleSidebar,
  darkMode,
  onToggleDarkMode,
  userName,
  userAvatarUrl,
  unreadMessagesCount,
  onClearNotifications,
  onOpenSettings,
  onLogout,
  isLoggingOut = false
}: NavbarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const initials =
  userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') ||
  'AD';

  return (
    <header className="sticky top-0 z-50 bg-[#0D1B3E] text-white shadow-md">
      <div className="grid min-h-[88px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-9 h-9 rounded-full bg-must-green text-white flex items-center justify-center text-sm font-bold border-2 border-white/20 mr-1 overflow-hidden">
          {userAvatarUrl ?
          <img src={userAvatarUrl} alt="Advisor avatar" className="w-full h-full object-cover" /> :
          initials}
        </div>
        <ButtonLogout onLogout={onLogout} isLoggingOut={isLoggingOut} />
        <ButtonVisitSite />

        <button
          onClick={onOpenSettings}
          title="Open Settings"
          className="p-2 hover:bg-white/10 rounded-full transition-colors">

          <SettingsIcon className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((current) => !current)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
            title="Notifications">

            <BellIcon className="w-5 h-5" />
            {unreadMessagesCount > 0 ?
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-[#0D1B3E]">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span> :
            null}
          </button>

          {isNotificationsOpen ?
          <div className="absolute left-0 mt-2 w-72 rounded-lg border border-must-border bg-must-surface shadow-lg z-30 text-must-text-primary">
              <div className="px-4 py-3 border-b border-must-border">
                <p className="text-sm font-semibold">Message Notifications</p>
                <p className="text-xs text-must-text-secondary mt-1">
                  {unreadMessagesCount === 0 ? 'No unread messages.' : `${unreadMessagesCount} unread student message${unreadMessagesCount === 1 ? '' : 's'}.`}
                </p>
              </div>
              <div className="p-3">
                <button
                  onClick={() => {
                    onClearNotifications();
                    setIsNotificationsOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium transition-colors">

                  Clear Notifications
                </button>
              </div>
            </div> :
          null}
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-white/10 rounded-full transition-colors">

          {darkMode ?
          <SunIcon className="w-5 h-5" /> :

          <MoonIcon className="w-5 h-5" />
          }
        </button>
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-2">
          <img
            src="/assists/1740307130_140_87669_group1000004290.svg"
            alt="MISR UNIVERSITY Logo"
            className="h-16 w-auto object-contain sm:h-20" />
          <div className="text-center leading-tight">
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-white/70">Admin Dashboard</p>
            <h1 className="text-sm font-semibold text-white sm:text-xl">International Students Affairs Portal</h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 justify-end">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors md:hidden"
          aria-label="Toggle Sidebar">

          <MenuIcon className="w-5 h-5" />
        </button>

      </div>
      </div>
    </header>);

}

interface ButtonLogoutProps {
  onLogout: () => void;
  isLoggingOut: boolean;
}

function ButtonLogout({ onLogout, isLoggingOut }: ButtonLogoutProps) {
  return (
    <button
      onClick={onLogout}
      disabled={isLoggingOut}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60">

      <LogOutIcon className="w-3.5 h-3.5" />
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>);

}

function ButtonVisitSite() {
  return (
    <a
      href="https://international-student-platform.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 transition-colors">

      <PlaneIcon className="w-3.5 h-3.5" />
      Visit Site
    </a>);

}
