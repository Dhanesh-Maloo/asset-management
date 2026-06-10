import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTenant } from '../contexts/TenantContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Laptop,
  Ticket,
  Users,
  Building2,
  LogOut,
  X,
  UserCog,
  GitBranch,
  Settings,
  Crown,
  Gauge,
  Layers,
  MapPin,
  Key,
  Truck,
  FileBarChart,
  Activity,
  User,
  CalendarDays,
  Boxes
} from 'lucide-react';

const ALL_ROLES = ['super_admin', 'tenant_admin', 'asset_manager', 'helpdesk_agent', 'employee'];
const MANAGE_ROLES = ['super_admin', 'tenant_admin', 'asset_manager'];

const NAV_GROUPS = [
  {
    label: null, // top-level, no heading
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES, feature: null },
      { name: 'My Profile', href: '/profile', icon: User, roles: ALL_ROLES, feature: null },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Assets', href: '/assets', icon: Laptop, roles: ALL_ROLES, feature: 'assets' },
      { name: 'Reservations', href: '/reservations', icon: CalendarDays, roles: ALL_ROLES, feature: 'assets' },
      { name: 'Product Catalog', href: '/products', icon: Package, roles: ALL_ROLES, feature: 'products' },
      { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ALL_ROLES, feature: 'orders' },
      { name: 'Helpdesk', href: '/tickets', icon: Ticket, roles: ALL_ROLES, feature: 'tickets' },
    ],
  },
  {
    label: 'Organization',
    items: [
      { name: 'Departments', href: '/departments', icon: Layers, roles: MANAGE_ROLES, feature: null },
      { name: 'Locations', href: '/locations', icon: MapPin, roles: MANAGE_ROLES, feature: null },
      { name: 'Vendors', href: '/vendors', icon: Truck, roles: MANAGE_ROLES, feature: null },
      { name: 'Licenses', href: '/licenses', icon: Key, roles: MANAGE_ROLES, feature: null },
    ],
  },
  {
    label: 'Insights',
    items: [
      { name: 'Reports', href: '/reports', icon: FileBarChart, roles: MANAGE_ROLES, feature: null },
      { name: 'Activity Feed', href: '/activity', icon: Activity, roles: MANAGE_ROLES, feature: null },
    ],
  },
  {
    label: 'Administration',
    items: [
      { name: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'tenant_admin'], feature: 'users' },
      { name: 'Groups', href: '/groups', icon: UserCog, roles: ['super_admin', 'tenant_admin'], feature: 'groups' },
      { name: 'Workflows', href: '/workflows', icon: GitBranch, roles: ['super_admin', 'tenant_admin'], feature: 'workflows' },
      { name: 'Tenants', href: '/tenants', icon: Building2, roles: ['super_admin'], feature: null },
      { name: 'Tier Management', href: '/tier-management', icon: Crown, roles: ['super_admin'], feature: null },
      { name: 'Subscription', href: '/subscription', icon: Gauge, roles: ['tenant_admin', 'asset_manager'], feature: null },
      { name: 'Settings', href: '/tenant-settings', icon: Settings, roles: ['super_admin', 'tenant_admin'], feature: null },
    ],
  },
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { tenantBranding, isFeatureEnabled } = useTenant();

  const canSee = (item) => {
    const hasRole = item.roles.includes(user?.role);
    const featureEnabled = !item.feature || ['super_admin', 'tenant_admin'].includes(user?.role) || isFeatureEnabled(item.feature);
    return hasRole && featureEnabled;
  };

  const visibleGroups = NAV_GROUPS
    .map(group => ({ ...group, items: group.items.filter(canSee) }))
    .filter(group => group.items.length > 0);

  const initials = (user?.name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-sidebar text-sidebar-foreground
        border-r border-sidebar-border
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Workspace header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {tenantBranding.logo_url ? (
                <img src={tenantBranding.logo_url} alt={tenantBranding.company_name} className="h-7 w-auto shrink-0" />
              ) : (
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <Boxes className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="text-sm font-semibold font-heading text-white truncate">
                {tenantBranding.company_name}
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 hover:bg-white/10 rounded-md transition-colors"
              data-testid="sidebar-close-btn"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {visibleGroups.map((group, gi) => (
              <div key={group.label || `group-${gi}`}>
                {group.label && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted select-none">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors duration-150 ${isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'
                        }`
                      }
                      data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-primary" />
                          )}
                          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-sidebar-muted group-hover:text-white'} transition-colors`} />
                          <span className="truncate">{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User footer */}
          <div className="p-3 border-t border-sidebar-border shrink-0">
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-sidebar-muted capitalize truncate">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 rounded-md text-sidebar-muted hover:text-white hover:bg-white/10 transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
