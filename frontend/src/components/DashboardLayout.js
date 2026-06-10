import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingModal from './OnboardingModal';
import CommandPalette from './CommandPalette';
import { Menu, Bell, Sun, Moon, Search, User, LogOut, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (user) fetchNotifications();
    const interval = setInterval(() => { if (user) fetchNotifications(); }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Ctrl+K / Cmd+K opens the command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`);
      setNotifications(res.data);
    } catch {
      // silently fail
    }
  };

  const totalCount = notifications.reduce((sum, n) => sum + (n.count || 0), 0);

  const typeIcon = (type) => {
    const icons = {
      pending_order: '📦',
      expiring_warranty: '🛡️',
      overdue_maintenance: '🔧',
      assigned_ticket: '🎫',
    };
    return icons[type] || '🔔';
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-card/80 backdrop-blur-md border-b border-border h-14 px-4 flex items-center gap-3 shrink-0">
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-accent rounded-md transition-colors"
            data-testid="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 flex-1 max-w-md h-9 px-3 text-sm
                       bg-secondary/60 border border-transparent rounded-md text-muted-foreground
                       hover:bg-card hover:border-border transition-all group"
            data-testid="global-search"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left">Search assets, pages, actions…</span>
            <kbd className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-card border border-border text-[10px] font-mono font-medium group-hover:border-ring/40 transition-colors">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile search icon */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>

          <div className="flex-1 md:hidden" />

          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode
                ? <Sun className="h-[18px] w-[18px] text-amber-400" />
                : <Moon className="h-[18px] w-[18px] text-muted-foreground" />}
            </button>

            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 hover:bg-accent rounded-md transition-colors"
                data-testid="notification-bell"
              >
                <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                {totalCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-destructive text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-0.5 flex items-center justify-center">
                    {totalCount > 9 ? '9+' : totalCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-11 w-80 bg-popover border border-border rounded-lg shadow-dropdown z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {totalCount > 0 && (
                      <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5 rounded-full">
                        {totalCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        All caught up!
                      </div>
                    ) : (
                      notifications.map((n, i) => (
                        <a
                          key={i}
                          href={n.link || '#'}
                          onClick={() => setNotifOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                        >
                          <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{n.type.replace(/_/g, ' ')}</p>
                          </div>
                          <span className="text-xs font-bold text-white bg-primary rounded-full px-2 py-0.5 mt-0.5">
                            {n.count}
                          </span>
                        </a>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-border bg-muted/40">
                    <button
                      onClick={() => { fetchNotifications(); setNotifOpen(false); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative ml-1" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 hover:bg-accent rounded-md transition-colors"
                data-testid="user-menu-btn"
              >
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-white">{initials}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-11 w-56 bg-popover border border-border rounded-lg shadow-dropdown z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      My Profile
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto app-canvas">
          {children}
        </main>
      </div>

      {/* Command palette (Ctrl+K) */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Onboarding modal — shows once on first login */}
      {user?.role && ['tenant_admin', 'asset_manager'].includes(user.role) && (
        <OnboardingModal />
      )}
    </div>
  );
};

export default DashboardLayout;
