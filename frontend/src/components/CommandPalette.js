import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import { NAV_GROUPS } from './Sidebar';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command';
import { Laptop, Plus, Ticket, Sun, Moon, LogOut, ArrowRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QUICK_ACTIONS = [
  { id: 'add-asset', label: 'Add New Asset', icon: Plus, href: '/assets', roles: ['super_admin', 'tenant_admin', 'asset_manager'] },
  { id: 'create-ticket', label: 'Create Ticket', icon: Ticket, href: '/tickets', roles: null },
];

export const CommandPalette = ({ open, onOpenChange, darkMode, onToggleDarkMode }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isFeatureEnabled } = useTenant();
  const [query, setQuery] = useState('');
  const [assetResults, setAssetResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery('');
      setAssetResults([]);
    }
  }, [open]);

  // Debounced live asset search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setAssetResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API}/assets`, { params: { search: query.trim(), limit: 6 } });
        setAssetResults(Array.isArray(res.data) ? res.data.slice(0, 6) : []);
      } catch {
        setAssetResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const canSee = (item) => {
    const hasRole = item.roles.includes(user?.role);
    const featureEnabled = !item.feature || ['super_admin', 'tenant_admin'].includes(user?.role) || isFeatureEnabled(item.feature);
    return hasRole && featureEnabled;
  };

  const q = query.trim().toLowerCase();
  const matches = (label) => !q || label.toLowerCase().includes(q);

  const visiblePages = NAV_GROUPS
    .flatMap(g => g.items)
    .filter(canSee)
    .filter(item => matches(item.name));

  const visibleActions = QUICK_ACTIONS
    .filter(a => !a.roles || a.roles.includes(user?.role))
    .filter(a => matches(a.label));

  const themeLabel = darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  const showTheme = matches('theme') || matches(themeLabel) || matches('dark') || matches('light');
  const showLogout = matches('logout') || matches('sign out');

  const run = (fn) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search assets, pages, actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>
          {searching ? 'Searching…' : 'No results found.'}
        </CommandEmpty>

        {/* Live asset results */}
        {assetResults.length > 0 && (
          <>
            <CommandGroup heading="Assets">
              {assetResults.map((asset) => (
                <CommandItem
                  key={asset.id}
                  value={`asset-${asset.id}`}
                  onSelect={() => run(() => navigate(`/assets/${asset.id}`))}
                  className="cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Laptop className="!h-3.5 !w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[13px] font-semibold text-primary">{asset.asset_tag}</span>
                    <span className="ml-2 text-xs text-muted-foreground truncate">
                      {asset.serial_number}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground capitalize shrink-0">
                    {(asset.status || '').replace(/_/g, ' ')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Quick actions */}
        {visibleActions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {visibleActions.map((action) => (
                <CommandItem
                  key={action.id}
                  value={action.id}
                  onSelect={() => run(() => navigate(action.href))}
                  className="cursor-pointer"
                >
                  <action.icon className="text-muted-foreground" />
                  <span>{action.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Page navigation */}
        {visiblePages.length > 0 && (
          <>
            <CommandGroup heading="Go to">
              {visiblePages.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`page-${item.href}`}
                  onSelect={() => run(() => navigate(item.href))}
                  className="cursor-pointer"
                >
                  <item.icon className="text-muted-foreground" />
                  <span>{item.name}</span>
                  <CommandShortcut>
                    <ArrowRight className="!h-3 !w-3" />
                  </CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* System */}
        {(showTheme || showLogout) && (
          <CommandGroup heading="System">
            {showTheme && (
              <CommandItem value="toggle-theme" onSelect={() => run(onToggleDarkMode)} className="cursor-pointer">
                {darkMode ? <Sun className="text-muted-foreground" /> : <Moon className="text-muted-foreground" />}
                <span>{themeLabel}</span>
              </CommandItem>
            )}
            {showLogout && (
              <CommandItem value="logout" onSelect={() => run(logout)} className="cursor-pointer text-destructive">
                <LogOut />
                <span>Logout</span>
              </CommandItem>
            )}
          </CommandGroup>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-border bg-muted/40 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono">↑↓</kbd> navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono">↵</kbd> open
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-card border border-border font-mono">esc</kbd> close
        </span>
      </div>
    </CommandDialog>
  );
};

export default CommandPalette;
