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
  CalendarDays
} from 'lucide-react';
import { Button } from './ui/button';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const { tenantBranding, isFeatureEnabled } = useTenant();

  const ALL_ROLES = ['super_admin', 'tenant_admin', 'asset_manager', 'helpdesk_agent', 'employee'];
  const MANAGE_ROLES = ['super_admin', 'tenant_admin', 'asset_manager'];

  const navigation = [
    // ── Core ──
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES, feature: null },
    { name: 'My Profile', href: '/profile', icon: User, roles: ALL_ROLES, feature: null },
    { name: 'Product Catalog', href: '/products', icon: Package, roles: ALL_ROLES, feature: 'products' },
    { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ALL_ROLES, feature: 'orders' },
    { name: 'Assets', href: '/assets', icon: Laptop, roles: ALL_ROLES, feature: 'assets' },
    { name: 'Reservations', href: '/reservations', icon: CalendarDays, roles: ALL_ROLES, feature: 'assets' },
    { name: 'Helpdesk', href: '/tickets', icon: Ticket, roles: ALL_ROLES, feature: 'tickets' },
    // ── Management ──
    { name: 'Departments', href: '/departments', icon: Layers, roles: MANAGE_ROLES, feature: null },
    { name: 'Locations', href: '/locations', icon: MapPin, roles: MANAGE_ROLES, feature: null },
    { name: 'Vendors', href: '/vendors', icon: Truck, roles: MANAGE_ROLES, feature: null },
    { name: 'Licenses', href: '/licenses', icon: Key, roles: MANAGE_ROLES, feature: null },
    // ── Reports ──
    { name: 'Reports', href: '/reports', icon: FileBarChart, roles: MANAGE_ROLES, feature: null },
    { name: 'Activity Feed', href: '/activity', icon: Activity, roles: MANAGE_ROLES, feature: null },
    // ── Admin ──
    { name: 'Groups', href: '/groups', icon: UserCog, roles: ['super_admin', 'tenant_admin'], feature: 'groups' },
    { name: 'Workflows', href: '/workflows', icon: GitBranch, roles: ['super_admin', 'tenant_admin'], feature: 'workflows' },
    { name: 'Users', href: '/users', icon: Users, roles: ['super_admin', 'tenant_admin'], feature: 'users' },
    { name: 'Tenants', href: '/tenants', icon: Building2, roles: ['super_admin'], feature: null },
    { name: 'Tier Management', href: '/tier-management', icon: Crown, roles: ['super_admin'], feature: null },
    { name: 'Subscription', href: '/subscription', icon: Gauge, roles: ['tenant_admin', 'asset_manager'], feature: null },
    { name: 'Settings', href: '/tenant-settings', icon: Settings, roles: ['super_admin', 'tenant_admin'], feature: null },
  ];

  const visibleNav = navigation.filter(item => {
    const hasRole = item.roles.includes(user?.role);
    const featureEnabled = !item.feature || ['super_admin', 'tenant_admin'].includes(user?.role) || isFeatureEnabled(item.feature);
    return hasRole && featureEnabled;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-slate-900 text-white
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div>
              {tenantBranding.logo_url ? (
                <img src={tenantBranding.logo_url} alt={tenantBranding.company_name} className="h-8 mb-2" />
              ) : (
                <h1 className="text-xl font-bold font-heading">{tenantBranding.company_name}</h1>
              )}
              <p className="text-xs text-slate-400 mt-1">{user?.name}</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1 hover:bg-slate-800 rounded"
              data-testid="sidebar-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive
                    ? 'bg-primary text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <div className="bg-slate-800 rounded-lg p-3 mb-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Role</p>
              <p className="text-sm font-medium capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;