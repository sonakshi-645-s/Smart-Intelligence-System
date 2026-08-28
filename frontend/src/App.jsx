import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Mic, Globe, Sun, Moon,
  Navigation, ChevronDown, LogOut, Building
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import BottomNavBar from './components/BottomNavBar';
import VoiceAssistant from './components/VoiceAssistant';
import UPSLogo from './components/UPSLogo';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Recommendations from './pages/Recommendations';
import Profile from './pages/Profile';

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeWarehouse, setActiveWarehouse] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, languagesList } = useLanguage();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  // Check existing session
  useEffect(() => {
    const savedToken = localStorage.getItem('oasis_auth_token');
    const savedWarehouse = localStorage.getItem('oasis_active_warehouse');
    if (savedToken) {
      setIsAuthenticated(true);
      setCurrentUser(localStorage.getItem('oasis_user') || 'ops_manager');
      if (savedWarehouse) {
        try {
          setActiveWarehouse(JSON.parse(savedWarehouse));
        } catch (e) {}
      }
    }
  }, []);

  const handleLoginSuccess = ({ user, token, activeWarehouse: wh }) => {
    localStorage.setItem('oasis_auth_token', token);
    localStorage.setItem('oasis_user', user);
    if (wh) {
      localStorage.setItem('oasis_active_warehouse', JSON.stringify(wh));
      setActiveWarehouse(wh);
    }
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('oasis_auth_token');
    localStorage.removeItem('oasis_user');
    localStorage.removeItem('oasis_active_warehouse');
    setIsAuthenticated(false);
    setActiveWarehouse(null);
  };

  const handleSwitchWarehouse = (wh) => {
    setActiveWarehouse(wh);
    localStorage.setItem('oasis_active_warehouse', JSON.stringify(wh));
  };

  // If unauthenticated, gate to Login & Dataset Ingestion
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? 'bg-[#0C0A09] text-stone-100' : 'bg-[#FDFBF7] text-[#29180E]'
    }`}>
      
      {/* TOP COMMAND HEADER */}
      <header className={`sticky top-0 z-30 glass-card backdrop-blur-xl border-b px-4 sm:px-8 py-3.5 flex items-center justify-between ${
        isDark ? 'bg-stone-950/85 border-stone-800/80' : 'bg-white/90 border-[#E5DFD5]'
      }`}>
        {/* Brand with authentic UPS Shield Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <UPSLogo className="w-10 h-11 shrink-0 drop-shadow-md hover:scale-105 transition-transform" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider font-mono">
                {t('systemTitle')}
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/30">
                v3.0 ENTERPRISE
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-stone-400">
              {t('systemSubtitle')}
            </p>
          </div>
        </div>

        {/* Active Facility Badge */}
        {activeWarehouse && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-stone-900/70 border border-stone-800 text-xs">
            <Building className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-stone-400">Facility:</span>
            <span className="font-bold text-yellow-400">{activeWarehouse.name} ({activeWarehouse.city})</span>
          </div>
        )}

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 6-Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-300 transition-colors"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="uppercase">{language}</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 glass-card bg-stone-900 border border-stone-700 rounded-xl shadow-2xl p-1.5 z-50">
                {languagesList.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                      language === l.code
                        ? 'bg-yellow-500 text-stone-950 font-bold shadow-glow-amber'
                        : 'text-stone-300 hover:bg-stone-800'
                    }`}
                  >
                    <span>{l.name}</span>
                    <span className="text-[10px] opacity-75">{l.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-yellow-400" />}
          </button>

          {/* Voice Assistant Floating Trigger Button */}
          <button
            onClick={() => setIsVoiceOpen(!isVoiceOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
              isVoiceOpen
                ? 'bg-yellow-500 text-stone-950 shadow-glow-amber font-black'
                : 'bg-gradient-to-r from-yellow-500 via-amber-500 to-[#78350F] hover:from-yellow-400 hover:to-[#5C2406] text-stone-950 shadow-glow-amber'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">AI Voice</span>
          </button>

          {/* Logout / Switch Datasets */}
          <button
            onClick={handleLogout}
            title={t('nav.logout')}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-rose-950/40 border border-stone-800 hover:border-rose-700/50 text-stone-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTAINER: 3 PRIMARY PAGES */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            activeWarehouse={activeWarehouse}
            onSwitchWarehouse={handleSwitchWarehouse}
            onOpenVoiceAssistant={() => setIsVoiceOpen(true)}
          />
        )}
        {activeTab === 'recommendations' && <Recommendations />}
        {activeTab === 'profile' && <Profile />}
      </main>

      {/* FLOATING VOICE ASSISTANT MODAL / WIDGET */}
      <VoiceAssistant
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
      />

      {/* FLOATING BOTTOM NAVIGATION DOCK (3 PAGES) */}
      <BottomNavBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
