import type { ComponentType } from 'react';
import {
  BarChart3Icon,
  BookCopyIcon,
  BriefcaseIcon,
  Building2Icon,
  CalendarIcon,
  CalendarRangeIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  GraduationCapIcon,
  HouseIcon,
  ImagesIcon,
  InfoIcon,
  Link2Icon,
  MailIcon,
  MegaphoneIcon,
  MessageSquareIcon,
  MonitorIcon,
  NewspaperIcon,
  PartyPopperIcon,
  SchoolIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon
} from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isSuperAdmin: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function Sidebar({
  activePage,
  onPageChange,
  collapsed,
  onToggleCollapse,
  isSuperAdmin
}: SidebarProps) {
  const homeItems: MenuItem[] = [
    { id: 'About Sector', label: 'About Sector', icon: InfoIcon },
    { id: 'Mission', label: 'Mission', icon: BookCopyIcon },
    { id: 'Vision', label: 'Vision', icon: EyeIcon },
    { id: 'Sector Plan', label: 'Sector Plan', icon: FileTextIcon }
  ];

  const academicsItems: MenuItem[] = [
    { id: 'Staff', label: 'Academic Rank', icon: BriefcaseIcon },
    { id: 'Study Plans', label: 'Educational Programs', icon: BookCopyIcon },
    { id: 'Academic Advising', label: 'Academic Advising', icon: GraduationCapIcon },
    { id: 'Registration', label: 'Registration', icon: ClipboardListIcon },
    { id: 'Smart E-Learning', label: 'Smart E-Learning', icon: MonitorIcon },
    { id: 'Calendars', label: 'Academic Calendars', icon: CalendarRangeIcon },
    { id: 'Schedules', label: 'Schedules', icon: CalendarIcon },
    { id: 'Honor List', label: 'Honor List', icon: TrophyIcon },
    { id: 'Admission', label: 'Admission', icon: FileTextIcon }
  ];

  const advisorsItems: MenuItem[] = [
    { id: 'Announcements', label: 'Announcements', icon: MegaphoneIcon },
    { id: 'Advisor Resources', label: 'Advising Resources', icon: GraduationCapIcon },
    { id: 'International Students Data', label: 'International Data', icon: GlobeIcon },
    { id: 'Reports', label: 'Statistical Reports', icon: BarChart3Icon }
  ];

  const facilitiesItems: MenuItem[] = [
    { id: 'Must Facilities', label: 'Must Facilities', icon: Building2Icon },
    { id: 'International Students Handbook', label: 'International Handbook', icon: SchoolIcon }
  ];

  const staticItems: MenuItem[] = [
    { id: 'Activities', label: 'Activities', icon: PartyPopperIcon },
    { id: 'Important Links', label: 'Important Links', icon: Link2Icon },
    { id: 'News', label: 'News', icon: NewspaperIcon },
    { id: 'Events', label: 'Events', icon: CalendarRangeIcon },
    { id: 'Gallery', label: 'Photo Gallery', icon: ImagesIcon }
  ];

  const adminItems: MenuItem[] = isSuperAdmin
    ? [{ id: 'Manage Advisors', label: 'Manage Advisors', icon: ShieldCheckIcon }]
    : [];

  const bottomItems: MenuItem[] = [
    { id: 'Messages', label: 'Messages', icon: MessageSquareIcon },
    { id: 'Contact Center', label: 'Contact Center', icon: MailIcon }
  ];

  const isGroupActive = (items: MenuItem[]) => items.some((item) => item.id === activePage);

  function renderButton(item: MenuItem): React.ReactNode {
    const isActive = activePage === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onPageChange(item.id)}
        className={`w-full flex items-center justify-end py-3 px-3 rounded-lg transition-colors group relative ${isActive ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
        title={collapsed ? item.label : undefined}
      >
        {isActive ? <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" /> : null}
        {!collapsed ? <span className="font-medium text-base whitespace-nowrap mr-3">{item.label}</span> : null}
        <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : ''}`} />
      </button>
    );
  }

  function renderGroup(title: string, icon: ComponentType<{ className?: string }>, items: MenuItem[]): React.ReactNode {
    const isActive = isGroupActive(items);
    const Icon = icon;

    return (
      <div key={title} className="relative group">
        <button
          type="button"
          onClick={() => onPageChange(items[0].id)}
          className={`w-full flex items-center justify-end py-3 px-3 rounded-lg transition-colors relative ${isActive ? 'bg-green-50 dark:bg-green-900/20 text-must-green' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
          title={collapsed ? title : undefined}
        >
          {isActive ? <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-must-green rounded-r-full" /> : null}

          {!collapsed ? (
            <>
              <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 ml-3">
                <ChevronDownIcon className="w-5 h-5" />
              </span>
              <span className="font-medium text-base whitespace-nowrap mr-3">{title}</span>
            </>
          ) : null}

          <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-must-green' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} ${collapsed ? 'mx-auto' : ''}`} />
        </button>

        <div className={`hidden group-hover:block ${collapsed ? 'absolute right-full top-0 mr-2 w-[17rem]' : 'pr-4 pl-1 pt-1'}`}>
          <div className="rounded-lg border border-must-border bg-must-surface shadow-lg md:shadow-none">
            <div className="py-2">
              {items.map((item) => {
                const isSubActive = activePage === item.id;
                const SubIcon = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPageChange(item.id)}
                    className={`w-full flex items-center justify-end gap-3 px-3 py-2.5 text-base transition-colors ${isSubActive ? 'text-must-green bg-green-50 dark:bg-green-900/20' : 'text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-must-text-primary'}`}
                  >
                    <span className="whitespace-nowrap text-right">{item.label}</span>
                    <SubIcon className={`w-5 h-5 flex-shrink-0 ${isSubActive ? 'text-must-green' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className={`bg-must-surface border-l border-must-border transition-all duration-300 flex flex-col relative z-40 ${collapsed ? 'w-[80px]' : 'w-[288px]'} hidden md:flex`}>
      <div className="flex-1 py-6 overflow-y-auto scrollbar-custom">
        <nav className="space-y-1 px-3">
          {renderGroup('Home', HouseIcon, homeItems)}
          {renderGroup('Academics', BookCopyIcon, academicsItems)}
          {renderGroup('Advisors', UsersIcon, advisorsItems)}
          {staticItems.slice(0, 1).map(renderButton)}
          {renderGroup('Facilities', Building2Icon, facilitiesItems)}
          {staticItems.slice(1).map(renderButton)}
          {adminItems.map(renderButton)}
          {bottomItems.map(renderButton)}
        </nav>
      </div>

      <div className="p-4 border-t border-must-border">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-must-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronLeftIcon className="w-6 h-6" /> : <ChevronRightIcon className="w-6 h-6" />}
        </button>
      </div>
    </aside>
  );
}
