import React from 'react';
import { UserRole } from '../types';
import { 
  ShoppingBag, 
  Receipt, 
  Clock, 
  LayoutDashboard, 
  Package, 
  Wallet,
  Store
} from 'lucide-react';
import { motion } from 'motion/react';

export type ActiveTabType = 
  | 'pos' 
  | 'history' 
  | 'closing' 
  | 'dashboard' 
  | 'products' 
  | 'consignment' 
  | 'finances' 
  | 'attendance'
  | 'settings';

interface BottomNavBarProps {
  activeTab: ActiveTabType;
  onSelectTab: (tab: ActiveTabType) => void;
  userRole: UserRole;
  cartCount?: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  cartCount = 0,
}) => {
  const cashierNavItems = [
    { id: 'pos' as const, label: 'ORDER', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'history' as const, label: 'Riwayat & Kasbon', icon: Receipt },
    { id: 'closing' as const, label: 'Tutup Shift', icon: Clock },
  ];

  const adminNavItems = [
    { id: 'dashboard' as const, label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'history' as const, label: 'Riwayat', icon: Receipt },
    { id: 'products' as const, label: 'Menu & Stok', icon: Package },
    { id: 'finances' as const, label: 'Keuangan', icon: Wallet },
  ];

  const items = userRole === 'admin' ? adminNavItems : cashierNavItems;

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-3 sm:px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-around sm:justify-center gap-1 sm:gap-2 px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl max-w-lg w-full text-zinc-400">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-4 rounded-xl transition-all duration-150 select-none cursor-pointer flex-1 ${
                isActive
                  ? 'text-white font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className="absolute inset-0 rounded-xl bg-zinc-800/90 border border-zinc-700/80 -z-10 shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon 
                  className={`w-5 h-5 transition-all duration-150 ${
                    isActive ? 'scale-110 text-amber-400' : 'text-zinc-400'
                  }`} 
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] tracking-tight mt-1 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
