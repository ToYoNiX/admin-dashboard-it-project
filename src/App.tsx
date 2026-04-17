import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Staff } from './pages/Staff';
import { News } from './pages/News';
import { Events } from './pages/Events';
import { StudyPlans } from './pages/StudyPlans';
import { Requests } from './pages/Requests';
import { Schedules } from './pages/Schedules';
import { Calendars } from './pages/Calendars';
import { Activities } from './pages/Activities';
import { Gallery } from './pages/Gallery';
import { AdvisorResources } from './pages/AdvisorResources';
import { AcademicAdvising } from './pages/AcademicAdvising';
import { Registration } from './pages/Registration';
import { SmartELearning } from './pages/SmartELearning';
import { HonorList } from './pages/HonorList';
import { StudentResources } from './pages/StudentResources';
import { Announcements } from './pages/Announcements';
import { Reports } from './pages/Reports';
import { Messages } from './pages/Messages';
import { Documents } from './pages/Documents';
import { Settings } from './pages/Settings';
import { ManageAdvisors } from './pages/ManageAdvisors';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { RegisterFromInvitePage } from './pages/auth/RegisterFromInvitePage';
import { supabase } from './lib/supabase';
import {
  getAdvisorProfile,
  signOut,
  type AdvisorProfile } from
'./services/authService';
import { getUnreadStudentMessageCount } from './services/messagesService';

export function App() {
  const isRegisterRoute = window.location.pathname.toLowerCase().startsWith('/register');

  const [activePage, setActivePage] = useState('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdvisorProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [notificationsClearedAt, setNotificationsClearedAt] = useState<string | null>(null);

  const currentUserId = session?.user.id ?? null;

  const notificationsStorageKey = currentUserId ? `must_notifications_cleared_at_${currentUserId}` : null;

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

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setAuthError('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setIsAuthLoading(false);
      return;
    }

    const initializeAuth = async () => {
      const { data, error } = await client.auth.getSession();
      if (error) {
        setAuthError(error.message);
      }

      setSession(data.session ?? null);

      if (data.session?.user.id) {
        try {
          const advisorProfile = await getAdvisorProfile(data.session.user.id);
          setProfile(advisorProfile);
        } catch (profileError) {
          const message = profileError instanceof Error ? profileError.message : 'Failed to load user profile.';
          setAuthError(message);
        }
      }

      setIsAuthLoading(false);
    };

    void initializeAuth();

    const { data: authListener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        return;
      }

      void getAdvisorProfile(nextSession.user.id)
        .then((advisorProfile) => {
          setProfile(advisorProfile);
        })
        .catch((profileError) => {
          const message = profileError instanceof Error ? profileError.message : 'Failed to load user profile.';
          setAuthError(message);
        });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activePage === 'Manage Advisors' && !profile?.is_super_admin) {
      setActivePage('Dashboard');
    }
  }, [activePage, profile]);

  useEffect(() => {
    if (!notificationsStorageKey) {
      setNotificationsClearedAt(null);
      return;
    }

    const storedValue = window.localStorage.getItem(notificationsStorageKey);
    setNotificationsClearedAt(storedValue);
  }, [notificationsStorageKey]);

  useEffect(() => {
    if (!currentUserId) {
      setUnreadMessagesCount(0);
      return;
    }

    let isCancelled = false;

    const refreshUnreadCount = async () => {
      try {
        const nextCount = await getUnreadStudentMessageCount(currentUserId, notificationsClearedAt);
        if (!isCancelled) {
          setUnreadMessagesCount(nextCount);
        }
      } catch {
        if (!isCancelled) {
          setUnreadMessagesCount(0);
        }
      }
    };

    void refreshUnreadCount();
    const intervalId = window.setInterval(() => {
      void refreshUnreadCount();
    }, 15000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentUserId, notificationsClearedAt]);

  const handleClearNotifications = () => {
    const nowIso = new Date().toISOString();
    if (notificationsStorageKey) {
      window.localStorage.setItem(notificationsStorageKey, nowIso);
    }
    setNotificationsClearedAt(nowIso);
    setUnreadMessagesCount(0);
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setAuthError(null);
      await signOut();
    } catch (logoutError) {
      const message = logoutError instanceof Error ? logoutError.message : 'Failed to logout.';
      setAuthError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard userName={userName} />;
      case 'Students':
        return <Students onNavigateToMessages={() => setActivePage('Messages')} />;
      case 'Staff':
        return <Staff />;
      case 'News':
        return <News />;
      case 'Events':
        return <Events />;
      case 'Study Plans':
        return <StudyPlans />;
      case 'Requests':
        return <Requests />;
      case 'Schedules':
        return <Schedules />;
      case 'Calendars':
        return <Calendars />;
      case 'Activities':
        return <Activities />;
      case 'Gallery':
        return <Gallery />;
      case 'Advisor Resources':
        return <AdvisorResources />;
      case 'Academic Advising':
        return <AcademicAdvising />;
      case 'Registration':
        return <Registration />;
      case 'Smart E-Learning':
        return <SmartELearning />;
      case 'Honor List':
        return <HonorList />;
      case 'Student Resources':
        return <StudentResources />;
      case 'Announcements':
        return <Announcements />;
      case 'Reports':
        return <Reports />;
      case 'Messages':
        return <Messages advisorId={session?.user.id ?? ''} />;
      case 'Manage Advisors':
        return profile?.is_super_admin ? <ManageAdvisors /> : <Dashboard userName={userName} />;
      case 'Documents':
        return <Documents />;
      case 'Settings':
        return <Settings userId={session?.user.id ?? ''} userEmail={session?.user.email ?? ''} />;
      default:
        return <Dashboard userName={userName} />;
    }
  };

  if (isRegisterRoute) {
    return <RegisterFromInvitePage />;
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-must-bg flex items-center justify-center text-must-text-primary">
        Loading...
      </div>);

  }

  if (!session) {
    return authView === 'login' ?
    <LoginPage /> :
    <SignupPage onSwitchToLogin={() => setAuthView('login')} />;

  }

  if (!profile || !profile.is_active) {
    return (
      <div className="min-h-screen bg-must-bg flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-must-surface border border-must-border rounded-xl p-6 shadow-md">
          <h1 className="text-xl font-bold text-must-text-primary">Access Pending</h1>
          <p className="mt-2 text-sm text-must-text-secondary">
            Your account is not active yet. Please contact a super admin.
          </p>
          {authError ? <p className="mt-3 text-sm text-red-600">{authError}</p> : null}
          <button
            onClick={() => {
              void handleLogout();
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-must-navy text-white hover:bg-blue-900">

            Logout
          </button>
        </div>
      </div>);

  }

  const userName = profile.full_name || session.user.email || 'Advisor';

  return (
    <DashboardLayout
      activePage={activePage}
      onPageChange={setActivePage}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode(!darkMode)}
      userName={userName}
      userAvatarUrl={profile.avatar_url}
      unreadMessagesCount={unreadMessagesCount}
      onClearNotifications={handleClearNotifications}
      isSuperAdmin={profile.is_super_admin}
      onOpenSettings={() => setActivePage('Settings')}
      onLogout={() => {
        void handleLogout();
      }}
      isLoggingOut={isLoggingOut}>

      {renderPage()}
    </DashboardLayout>);

}
