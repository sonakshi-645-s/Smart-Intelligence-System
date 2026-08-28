import React, { useState } from 'react';
import {
  Lock, Mail, User, ShieldCheck, Database, CheckCircle2,
  AlertCircle, ArrowRight, Building2, Sparkles, UserPlus, LogIn
} from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import UPSLogo from '../components/UPSLogo';

const Login = ({ onLoginSuccess }) => {
  const { t } = useLanguage();
  const { isDark } = useTheme();

  // Mode: 'login' (existing user) or 'register' (new user who needs to upload datasets)
  const [authMode, setAuthMode] = useState('login');

  // Fields: Email, Organisation Name, Password (No default credentials pre-filled)
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [useSampleData, setUseSampleData] = useState(true);

  const [files, setFiles] = useState({
    suppliers: null,
    customers: null,
    inventory: null,
    workforce: null,
    warehouses: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError(`${file.name} is not a valid .csv file.`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(`${file.name} exceeds the 15MB file size limit.`);
        return;
      }
      setError('');
      setUseSampleData(false);
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !orgName) {
      setError('Please provide your Email ID, Organisation Name, and Password.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (authMode === 'login') {
        // Existing user login with Email ID, Organisation Name, and Password
        const res = await api.post('/auth/login/', {
          email: email.trim(),
          organization_name: orgName.trim(),
          password: password.trim(),
        });

        setSuccessMsg(`Welcome, ${res.data.user}. Loading enterprise network...`);
        setTimeout(() => {
          onLoginSuccess({
            user: res.data.user,
            email: res.data.email,
            organizationName: res.data.organization_name,
            token: res.data.token,
            activeWarehouse: res.data.active_warehouse,
            warehouses: res.data.warehouses,
          });
        }, 600);
      } else {
        // New user registration & dataset ingestion
        const formData = new FormData();
        formData.append('email', email.trim());
        formData.append('organization_name', orgName.trim());
        formData.append('password', password.trim());
        formData.append('full_name', fullName.trim());
        formData.append('use_sample_data', useSampleData ? 'true' : 'false');

        if (files.warehouses) formData.append('warehouses', files.warehouses);
        if (files.suppliers) formData.append('suppliers', files.suppliers);
        if (files.customers) formData.append('customers', files.customers);
        if (files.inventory) formData.append('inventory', files.inventory);
        if (files.workforce) formData.append('workforce', files.workforce);

        const res = await api.post('/auth/register/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        setSuccessMsg(`Account created for ${res.data.organization_name}! Ingesting multi-warehouse datasets...`);
        setTimeout(() => {
          onLoginSuccess({
            user: res.data.user,
            email: res.data.email,
            organizationName: res.data.organization_name,
            token: res.data.token,
            activeWarehouse: res.data.active_warehouse,
            warehouses: res.data.warehouses,
          });
        }, 700);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication error. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#0C0A09] text-stone-100 selection:bg-yellow-500 selection:text-stone-950">
      <div className="w-full max-w-3xl glass-card bg-stone-900/95 border border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
        
        {/* Header Branding with UPS Shield Logo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div className="flex items-center gap-4">
            <UPSLogo className="w-14 h-16 shrink-0 drop-shadow-xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-stone-100 font-mono">
                  {t('systemTitle')}
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                  {authMode === 'login' ? 'ENTERPRISE PORTAL' : 'ORGANISATION ONBOARDING'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Multi-Warehouse Network Control &bull; Analyze and optimize all regional hubs simultaneously
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-stone-950 p-1 rounded-xl border border-stone-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                authMode === 'login'
                  ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In (Manager)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
                setSuccessMsg('');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                authMode === 'register'
                  ? 'bg-yellow-500 text-stone-950 shadow-glow-amber'
                  : 'text-stone-400 hover:text-yellow-400'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Credentials Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* If Registering, show Full Name */}
            {authMode === 'register' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-yellow-400" />
                  Manager Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:border-yellow-500 outline-none transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            {/* Email ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-yellow-400" />
                Login Mail ID
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:border-yellow-500 outline-none transition-colors"
                placeholder="name@company.com"
                required
              />
            </div>

            {/* Organisation Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-yellow-400" />
                Organisation Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:border-yellow-500 outline-none transition-colors"
                placeholder="Enter organisation name"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:border-yellow-500 outline-none transition-colors"
                placeholder="Enter your security password"
                required
              />
            </div>
          </div>

          {/* DATASET INGESTION: ONLY REQUIRED WHEN CREATING AN ACCOUNT */}
          {authMode === 'register' && (
            <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-stone-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-yellow-400" />
                    Multi-Warehouse Dataset Ingestion
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Upload your enterprise datasets, or initialize with pre-verified multi-warehouse demo data.
                  </p>
                </div>

                {/* 1-Click Demo Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold bg-stone-900 border border-stone-700 px-3 py-1.5 rounded-lg hover:border-yellow-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={useSampleData}
                    onChange={(e) => setUseSampleData(e.target.checked)}
                    className="accent-yellow-500 rounded"
                  />
                  <span className="text-yellow-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Start with Verified Multi-Hub Data
                  </span>
                </label>
              </div>

              {/* 5 CSV Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'suppliers', label: '1. suppliers.csv (Vendors, Origins, Inbound Lead Times)' },
                  { key: 'customers', label: '2. customers.csv (Destinations, Regions, Delivery SLAs)' },
                  { key: 'inventory', label: '3. inventory.csv (SKUs, Stock on Hand, Safety Stock)' },
                  { key: 'workforce', label: '4. workforce.csv (Skills, Shift Schedules, Efficiency)' },
                  { key: 'warehouses', label: '5. warehouses.csv (Facility IDs, Names, Cities, Docks)' },
                ].map((item) => (
                  <div key={item.key} className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-stone-300 truncate">{item.label}</span>
                      {files[item.key] && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(item.key, e)}
                      className="block w-full text-[10px] text-stone-400 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-stone-800 file:text-stone-300 hover:file:bg-stone-700 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Row & Switcher link */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div>
              {authMode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                  }}
                  className="text-xs text-yellow-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Don't have an account yet? Create account & ingest datasets
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                  }}
                  className="text-xs text-yellow-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Already have an account? Sign in with Mail ID, Org & Password
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 via-amber-500 to-[#78350F] hover:from-yellow-400 hover:to-[#5C2406] text-stone-950 font-black text-xs transition-all shadow-glow-amber flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>{authMode === 'login' ? 'Authenticating...' : 'Registering & Ingesting Data...'}</span>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Access Multi-Facility Dashboard' : 'Register Organisation & Datasets'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
