import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  Building2,
  TrendingUp,
  CreditCard,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function AppLayout({ children, activeTab, setActiveTab }: AppLayoutProps) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Home', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Terminal', mobileLabel: 'Sale', icon: ShoppingCart },
    { id: 'products', label: 'Inventory', mobileLabel: 'Stock', icon: Package },
    { id: 'outlets', label: 'Outlets', mobileLabel: 'Global', icon: Building2 },
    { id: 'orders', label: 'Sales History', mobileLabel: 'History', icon: History },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 bg-slate-900 flex-col text-slate-300 border-r border-slate-800 shadow-xl z-30">
        <div className="p-6 flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg">E</div>
          <span className="font-bold text-lg text-white tracking-tight">ERP+POS v2.0</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-3 px-2">Enterprise Suite</div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 rounded-l-none pl-4" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-slate-500")} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto p-4 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs ring-2 ring-slate-800">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="md:hidden w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-md text-xs">E</div>
            <div className="hidden sm:block bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase border border-slate-200">
              Enterprise
            </div>
            <span className="hidden sm:inline text-slate-300">/</span>
            <h2 className="font-bold text-slate-800 text-xs md:text-sm uppercase tracking-tight truncate max-w-[120px] sm:max-w-none">
              {activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-6">
            <div className="hidden lg:block relative">
              <input 
                type="text" 
                placeholder="Global search..." 
                className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-1.5 text-xs w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>
            <button className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg font-bold text-[10px] md:text-xs shadow-sm hover:bg-blue-700 transition-all active:scale-95">
              + NEW
            </button>
            <button onClick={logout} className="md:hidden text-slate-400 p-2">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
           {menuItems.slice(0, 4).map((item) => {
             const Icon = item.icon;
             const isActive = activeTab === item.id;
             return (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={cn(
                   "flex flex-col items-center gap-1 min-w-[64px] transition-all",
                   isActive ? "text-blue-600" : "text-slate-400"
                 )}
               >
                 <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} />
                 <span className="text-[9px] font-bold uppercase tracking-tighter">{item.mobileLabel || item.label}</span>
                 {isActive && <motion.div layoutId="mobile-indicator" className="w-1 h-1 bg-blue-600 rounded-full" />}
               </button>
             );
           })}
        </nav>
      </main>
    </div>
  );
}
