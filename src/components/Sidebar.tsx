import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Upload,
  Search,
  Settings,
  PlusCircle,
  LogOut,
  Building2,
  ChevronRight,
  X,
  UserCheck,
} from 'lucide-react';
import { UserSession } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserSession;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Dynamic navigation items based on logged-in user role
  const getNavItems = () => {
    if (currentUser.userType === 'principal') {
      return [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'faculty', label: 'Staff Management', icon: Users },
        { id: 'assignment-matrix', label: 'Assignment Matrix', icon: Building2 },
        { id: 'students', label: 'Student Records', icon: GraduationCap },
        { id: 'my-profile', label: 'My Profile', icon: UserCheck },
        { id: 'settings', label: 'Portal Settings', icon: Settings },
      ];
    } else if (currentUser.userType === 'teacher') {
      return [
        { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
        { id: 'students', label: 'Student Records', icon: GraduationCap },
        { id: 'results-upload', label: 'Result Upload', icon: Upload },
        { id: 'my-profile', label: 'My Profile', icon: UserCheck },
      ];
    } else {
      // Student role - simple student menu
      return [
        { id: 'student-profile', label: 'My Marks & Dossier', icon: GraduationCap },
        { id: 'student-portal', label: 'Student Search & Directory', icon: Search },
      ];
    }
  };

  const navItems = getNavItems();

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 w-72 max-w-[85vw] md:w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 h-screen shrink-0 select-none transition-transform duration-300 ease-in-out font-['Plus_Jakarta_Sans',sans-serif] ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-amber-300 font-bold shadow-md ring-1 ring-emerald-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="overflow-hidden">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">
                PUNJAB DAANISH
              </div>
              <div className="text-sm font-bold text-white truncate font-['Playfair_Display']">
                Schools Portal
              </div>
            </div>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl md:hidden transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-rose-400" />
            </button>
          )}
        </div>

        {/* Campus Selector Badge */}
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300 truncate">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium truncate">Fazilpur Campus</span>
          </div>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
            ACTIVE
          </span>
        </div>

        {/* Quick Action - Only for Principal */}
        {currentUser.userType === 'principal' && (
          <div className="p-3">
            <button
              onClick={() => handleNavClick('student-registration')}
              className="w-full flex items-center justify-center space-x-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 px-3 rounded-xl shadow-sm transition-all text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Students</span>
            </button>
          </div>
        )}

        {/* Nav Menu */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 pb-1 tracking-wider">
            Main Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${isActive
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-700/40 hover:border-emerald-500/50 transition-colors">
            <button
              onClick={() => handleNavClick('my-profile')}
              className="flex items-center space-x-2.5 overflow-hidden text-left hover:opacity-90 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs font-bold border border-emerald-600 shrink-0">
                {currentUser.userName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{currentUser.userName}</div>
                <div className="text-[10px] text-emerald-400 font-bold capitalize truncate">My Profile</div>
              </div>
            </button>
            <button
              onClick={() => {
                onLogout();
                onCloseMobile?.();
              }}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
