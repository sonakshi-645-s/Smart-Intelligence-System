import React from 'react';
import { LayoutDashboard, Sliders, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const BottomNavBar = ({ activeTab, setActiveTab }) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard') || 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'simulator',
      label: 'Simulator',
      icon: Sliders,
    },
    {
      id: 'recommendations',
      label: t('nav.recommendations') || 'Staffing',
      icon: Sparkles,
      badge: '5',
    },
    {
      id: 'profile',
      label: t('nav.profile') || 'Preferences',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4">
      <nav className="glass-card bg-stone-950/85 backdrop-blur-xl border border-stone-700/80 shadow-2xl rounded-2xl p-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center px-5 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-yellow-500/15 text-yellow-400 font-bold shadow-glow-amber border border-yellow-500/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-yellow-400' : ''} transition-transform`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-yellow-500 text-stone-950 text-[10px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-stone-950">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-wide">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-0.5 bg-yellow-400 rounded-full shadow-glow-amber" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavBar;
