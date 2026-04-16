import React from 'react';
import {
  LayoutDashboardIcon,
  UsersIcon,
  FileTextIcon,
  CalendarIcon,
  MegaphoneIcon,
  BarChart3Icon,
  MessageSquareIcon,
  FolderIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon } from
'lucide-react';
interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}
export function Sidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  const menuItems = [
  {
    id: 'Dashboard',
    icon: LayoutDashboardIcon,
    label: 'Dashboard'
  },
  {
    id: 'Students',
    icon: UsersIcon,
    label: 'Students'
  },
  {
    id: 'Requests',
    icon: FileTextIcon,
    label: 'Requests'
  },
  {
    id: 'Schedules',
    icon: CalendarIcon,
    label: 'Schedules'
  },
  {
    id: 'Announcements',
    icon: MegaphoneIcon,
    label: 'Announcements'
  },
  {
    id: 'Reports',
    icon: BarChart3Icon,
    label: 'Reports'
  },
  {
    id: 'Messages',
    icon: MessageSquareIcon,
    label: 'Messages'
  },
  {
    id: 'Documents',
    icon: FolderIcon,
    label: 'Documents'
  },
  {
    id: 'Settings',
    icon: SettingsIcon,
    label: 'Settings'
  }];

  return (
    <aside
      className={`bg-must-surface border-r border-must-border transition-all duration-300 flex flex-col relative z-40 ${collapsed ? 'w-[72px]' : 'w-[260px]'} hidden md:flex`}>

      <div className="flex-1 py-6 overflow-y-auto scrollbar-custom">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center py-3 px-3 rounded-lg transition-colors group relative ${isActive ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
                title={collapsed ? item.label : undefined}>

                {isActive &&
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" />
                }
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : 'mr-3'}`} />


                {!collapsed &&
                <span className="font-medium text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                }
              </button>);

          })}
        </nav>
      </div>

      <div className="p-4 border-t border-must-border">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">

          {collapsed ?
          <ChevronRightIcon className="w-5 h-5" /> :

          <ChevronLeftIcon className="w-5 h-5" />
          }
        </button>
      </div>
    </aside>);

}