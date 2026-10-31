import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import OnboardingModal from './OnboardingModal';
import CommandPalette from './CommandPalette';
import { Menu, Bell, Sun, Moon, Search, User, LogOut, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Every page mounts its own DashboardLayout, so keep the last list here to avoid the bell resetting on navigation.
let notificationCache = [];

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState(notificationCache);
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
    // The bell is secondary: wait a moment on first load so the page's own data gets the connection first.
    const first = user ? setTimeout(fetchNotifications, notificationCache.length ? 0 : 1500) : null;
    const interval = setInterval(() => { if (user) fetchNotifications(); }, 60000);
    const onFocus = () => { if (user && document.visibilityState === 'visible') fetchNotifications(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { clearTimeout(first); clearInterval(interval); document.removeEventListener('visibilitychange', onFocus); };
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
      notificationCache = res.data;
      setNotifications(res.data);
    } catch {
      // silently fail
    }
  };

  // Notifications are computed live on the server, so track "seen" state locally.
  // A notification counts as unread again only if its count changes.
  // The key depends on the signed-in user, which is not known yet on a fresh page load,
  // so the seen list is read in an effect once the user is available (reading it up front
  // used the wrong key and the badge came back after every refresh).
  const seenKey = `seenNotifications_${user?.id || user?.email}`;
  const [seen, setSeen] = useState({});
  const [seenLoaded, setSeenLoaded] = useState(false);
  useEffect(() => {
    if (!user) return;
    try { setSeen(JSON.parse(localStorage.getItem(seenKey) || '{}')); } catch { setSeen({}); }
    setSeenLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seenKey, !!user]);
  const notifKey = (n) => n.type;

  // Dismissed notifications stay hidden until their count changes (new activity), and can be listed again with "Show cleared".
  const dismissedKey = `dismissedNotifications_${user?.id || user?.email}`;
  const [dismissed, setDismissed] = useState({});
  const [showCleared, setShowCleared] = useState(false);
  useEffect(() => {
    if (!user) return;
    try { setDismissed(JSON.parse(localStorage.getItem(dismissedKey) || '{}')); } catch { setDismissed({}); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissedKey, !!user]);
  const saveDismissed = (next) => {
    setDismissed(next);
    try { localStorage.setItem(dismissedKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
  const isDismissed = (n) => dismissed[notifKey(n)] === n.count;
  const dismissOne = (n) => saveDismissed({ ...dismissed, [notifKey(n)]: n.count });
  const dismissAll = () => {
    const next = { ...dismissed };
    notifications.forEach((n) => { next[notifKey(n)] = n.count; });
    saveDismissed(next);
  };
  const clearedCount = notifications.filter(isDismissed).length;
  const visibleNotifications = showCleared ? notifications : notifications.filter((n) => !isDismissed(n));
  const isUnread = (n) => seenLoaded && seen[notifKey(n)] !== n.count && dismissed[notifKey(n)] !== n.count;
  const totalCount = notifications.filter(isUnread).reduce((sum, n) => sum + (n.count || 0), 0);

  // What was unread at the moment the dropdown opened, so the list can still highlight it after it is marked seen.
  const [newTypes, setNewTypes] = useState([]);
  const newOnOpen = notifications.filter((n) => newTypes.includes(n.type)).reduce((sum, n) => sum + (n.count || 0), 0);
  const toggleBell = () => {
    if (!notifOpen) {
      setNewTypes(notifications.filter(isUnread).map((n) => n.type));
      markAllSeen();
    }
    setNotifOpen(!notifOpen);
  };

  const markAllSeen = () => {
    if (!user) return;
    const next = {};
    notifications.forEach(n => { next[notifKey(n)] = n.count; });
    setSeen(next);
    try { localStorage.setItem(seenKey, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

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
                onClick={toggleBell}
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
                    {newOnOpen > 0 && (
                      <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5 rounded-full">
                        {newOnOpen} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        All caught up!
                      </div>
                    ) : (
                      visibleNotifications.map((n, i) => (
                        <a
                          key={n.type || i}
                          href={n.link || '#'}
                          onClick={(e) => { e.preventDefault(); setNotifOpen(false); if (n.link) navigate(n.link); }}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-0 ${newTypes.includes(n.type) ? 'bg-primary/5' : ''}`}
                        >
                          <span className="text-lg mt-0.5">{typeIcon(n.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{n.message}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{n.type.replace(/_/g, ' ')}</p>
                          </div>
                          <span className={`text-xs font-bold rounded-full px-2 py-0.5 mt-0.5 ${newTypes.includes(n.type) ? 'text-white bg-primary' : 'text-muted-foreground bg-muted'}`}>
                            {n.count}
                          </span>
                          {!isDismissed(n) && (
                            <button
                              type="button"
                              aria-label="Dismiss notification"
                              title="Dismiss"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismissOne(n); }}
                              className="mt-0.5 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </a>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-border bg-muted/40 flex items-center justify-between gap-3">
                    <button
                      onClick={() => { fetchNotifications(); setNotifOpen(false); }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Refresh
                    </button>
                    <div className="flex items-center gap-3">
                      {clearedCount > 0 && (
                        <button
                          onClick={() => setShowCleared(!showCleared)}
                          className="text-xs text-muted-foreground hover:underline"
                        >
                          {showCleared ? 'Hide cleared' : `Show cleared (${clearedCount})`}
                        </button>
                      )}
                      {notifications.some((n) => !isDismissed(n)) && (
                        <button onClick={dismissAll} className="text-xs text-primary hover:underline font-medium">
                          Clear all
                        </button>
                      )}
                    </div>
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
