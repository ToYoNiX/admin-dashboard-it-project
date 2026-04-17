import {
  LayoutDashboardIcon,
  UsersIcon,
  BriefcaseIcon,
  NewspaperIcon,
  CalendarRangeIcon,
  BookCopyIcon,
  CalendarIcon,
  MessageSquareIcon,
  ImagesIcon,
  GraduationCapIcon,
  SchoolIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PartyPopperIcon } from
'lucide-react';
interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isSuperAdmin: boolean;
}
export function Sidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse,
  isSuperAdmin
}: SidebarProps) {
  const academicItems = [
  {
    id: 'Staff',
    icon: BriefcaseIcon,
    label: 'Academic Staff'
  },
  {
    id: 'Advisor Resources',
    icon: GraduationCapIcon,
    label: 'Advisor Resources'
  },
  {
    id: 'Student Resources',
    icon: SchoolIcon,
    label: 'Student Resources'
  },
  {
    id: 'Study Plans',
    icon: BookCopyIcon,
    label: 'Study Plans'
  },
  {
    id: 'Schedules',
    icon: CalendarIcon,
    label: 'Schedules'
  },
  {
    id: 'Calendars',
    icon: CalendarRangeIcon,
    label: 'Calendars'
  }];

  const isAcademicsActive = academicItems.some((item) => item.id === activePage);

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
    id: 'Activities',
    icon: PartyPopperIcon,
    label: 'Activities'
  },
    {
    id: 'News',
    icon: NewspaperIcon,
    label: 'News'
  },
  {
    id: 'Events',
    icon: CalendarRangeIcon,
    label: 'Events'
  },
    {
      id: 'Gallery',
      icon: ImagesIcon,
      label: 'Photo Gallery'
    },
  ...(isSuperAdmin ? [{
    id: 'Manage Advisors',
    icon: ShieldCheckIcon,
    label: 'Manage Advisors'
  }] : [])];

  return (
    <aside
      className={`bg-must-surface border-l border-must-border transition-all duration-300 flex flex-col relative z-40 ${collapsed ? 'w-[72px]' : 'w-[260px]'} hidden md:flex`}>

      <div className="flex-1 py-6 overflow-y-auto scrollbar-custom">
        <nav className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center justify-end py-3 px-3 rounded-lg transition-colors group relative ${isActive ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
                title={collapsed ? item.label : undefined}>

                {isActive &&
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" />
                }


                {!collapsed &&
                <span className="font-medium text-sm whitespace-nowrap mr-3">
                    {item.label}
                  </span>
                }

                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : ''}`} />
              </button>);

          })}

          <div className="relative group">
            <button
              type="button"
              className={`w-full flex items-center justify-end py-3 px-3 rounded-lg transition-colors group relative ${isAcademicsActive ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
              title={collapsed ? 'Academics' : undefined}>

              {isAcademicsActive &&
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" />
              }
              {!collapsed &&
              <>
                  <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-3">
                    <ChevronDownIcon className="w-4 h-4 group-hover:hidden" />
                    <ChevronUpIcon className="w-4 h-4 hidden group-hover:block" />
                  </span>
                  <span className="font-medium text-sm whitespace-nowrap mr-3">Academics</span>
                </>
              }

              <BookCopyIcon
                className={`w-5 h-5 flex-shrink-0 ${isAcademicsActive ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : ''}`} />
            </button>

            <div
              className={`hidden group-hover:block ${collapsed ? 'absolute right-full top-0 mr-2 w-64' : 'pr-4 pl-1 pt-1'}`}>

              <div className="rounded-lg border border-must-border bg-must-surface shadow-lg md:shadow-none">
                <div className="py-2">
                  {academicItems.map((item) => {
                    const isSubActive = activePage === item.id;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onPageChange(item.id)}
                        className={`w-full flex items-center justify-end gap-3 px-3 py-2 text-sm transition-colors ${isSubActive ? 'text-must-green bg-green-50 dark:bg-green-900/20' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}>

                        <span className="whitespace-nowrap text-right">{item.label}</span>
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-must-green' : 'text-slate-400'}`} />
                      </button>);

                  })}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onPageChange('Messages')}
            className={`w-full flex items-center justify-end py-3 px-3 rounded-lg transition-colors group relative ${activePage === 'Messages' ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}>

            {activePage === 'Messages' &&
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" />
            }
            <MessageSquareIcon
              className={`w-5 h-5 flex-shrink-0 ${activePage === 'Messages' ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : 'mr-3'}`} />


            {!collapsed &&
            <span className="font-medium text-sm whitespace-nowrap mr-3">
                Messages
              </span>
            }
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-must-border">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">

          {collapsed ?
          <ChevronLeftIcon className="w-5 h-5" /> :

          <ChevronRightIcon className="w-5 h-5" />
          }
        </button>
      </div>
    </aside>);

}
