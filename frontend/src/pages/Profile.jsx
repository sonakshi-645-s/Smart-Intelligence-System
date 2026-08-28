import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Moon, Sun, Globe, Bell, BellOff, Save, CheckCircle,
  Building, Mail, Lock, Terminal, Server, FileCheck, Check,
  AlertCircle, UploadCloud, Sparkles, AlertTriangle, RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, languagesList } = useLanguage();

  const [settings, setSettings] = useState({
    org_name: 'OASIS Global Logistics Corp',
    facility_code: 'FAC-ALPHA-2026',
    supervisor_contact: 'plant.manager@oasis-system.org',
    dock_warning_threshold: 85,
    safety_stock_min_pct: 20,
    sla_target_compliance: 95,
    notifications_enabled: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.get('/preferences/')
      .then((res) => {
        setSettings((prev) => ({ ...prev, ...res.data }));
      })
      .catch((err) => {
        console.error('Error loading preferences:', err);
      });
  }, []);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await api.post('/preferences/', {
        ...settings,
        dark_mode: isDark,
        preferred_language: language,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      alert('Error saving preferences: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = () => {
    const nextVal = !settings.notifications_enabled;
    setSettings((prev) => ({ ...prev, notifications_enabled: nextVal }));
    api.post('/preferences/', { notifications_enabled: nextVal }).catch(() => {});
  };

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-100">
            {t('profile.title')}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 mt-1">
          {t('profile.subtitle')}
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          {t('profile.saved')}
        </div>
      )}

      {/* SECTION 1: NOTIFICATION ENABLE / DISABLE TOGGLE & APPEARANCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Notification Alert Toggle */}
        <div className="glass-card p-6 rounded-2xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${
                settings.notifications_enabled
                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  : 'bg-stone-800 text-stone-400 border-stone-700'
              }`}>
                {settings.notifications_enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-100">{t('profile.notificationHeader')}</h3>
                <p className="text-xs text-stone-400">
                  {settings.notifications_enabled ? t('profile.notificationActive') : t('profile.notificationMuted')}
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={handleNotificationToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                settings.notifications_enabled ? 'bg-yellow-500' : 'bg-stone-700'
              }`}
            >
              <div
                className={`bg-stone-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.notifications_enabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-stone-400 leading-relaxed">
            {t('profile.notificationDesc')}
          </p>
        </div>

        {/* Theme Mode Switcher */}
        <div className="glass-card p-6 rounded-2xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-yellow-400">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-100">{t('profile.themeToggle')}</h3>
                <p className="text-xs text-stone-400">
                  {isDark ? t('profile.darkMode') : t('profile.lightMode')}
                </p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-yellow-400" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[11px] text-stone-400">
            Decent Yellow and Dark Brown aesthetic with high-contrast coffee and cream light mode.
          </p>
        </div>
      </div>

      {/* SECTION 2: 6-LANGUAGE LOCALIZATION (ENGLISH + 5 INDIAN LANGUAGES) */}
      <div className="glass-card p-6 rounded-2xl border border-stone-800 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-stone-800 pb-3">
          <Globe className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="font-bold text-sm text-stone-100">{t('profile.languageSelect')}</h3>
            <p className="text-xs text-stone-400">English + 5 Major Indian Regional Languages (Tamil, Telugu, Kannada, Hindi, Malayalam)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {languagesList.map((lang) => {
            const isCurrent = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  isCurrent
                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 font-black shadow-glow-amber scale-[1.02]'
                    : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="text-[10px] text-stone-400 uppercase font-mono">{lang.name}</div>
                <div className="font-black text-base mt-1">{lang.native}</div>
                {isCurrent && (
                  <div className="mt-1 text-[10px] text-yellow-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: ORGANIZATION DETAILS & ALERT THRESHOLDS */}
      <form onSubmit={handleSave} className="glass-card p-6 rounded-2xl border border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Building className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-bold text-sm text-stone-100">{t('profile.orgDetailsHeader')}</h3>
              <p className="text-xs text-stone-400">Manage plant facility identity and automated operational triggers</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-stone-950 text-xs font-black transition-all shadow-glow-amber flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>

        {/* Organization Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">{t('profile.orgName')}</label>
            <input
              type="text"
              value={settings.org_name}
              onChange={(e) => setSettings({ ...settings, org_name: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">{t('profile.facilityCode')}</label>
            <input
              type="text"
              value={settings.facility_code}
              onChange={(e) => setSettings({ ...settings, facility_code: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 font-mono outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 block">{t('profile.supervisorContact')}</label>
            <input
              type="email"
              value={settings.supervisor_contact}
              onChange={(e) => setSettings({ ...settings, supervisor_contact: e.target.value })}
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-100 outline-none focus:border-yellow-500"
            />
          </div>
        </div>
      </form>

      {/* SECTION 4: OPERATIONAL DATASETS & FACILITY TELEMETRY REFRESH */}
      <DatasetRefreshSection />
    </div>
  );
};

const DatasetRefreshSection = () => {
  const [files, setFiles] = useState({
    suppliers: null,
    customers: null,
    inventory: null,
    workforce: null,
    warehouses: null,
  });
  const [storedCounts, setStoredCounts] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successStatus, setSuccessStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchStatus = () => {
    api.get('/datasets/upload/')
      .then((res) => {
        if (res.data?.counts) {
          setStoredCounts(res.data.counts);
        }
      })
      .catch((err) => {
        console.error('Error fetching dataset status:', err);
      });
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setErrorMessage(`${file.name} is not a valid .csv file.`);
        return;
      }
      setErrorMessage('');
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleUploadSubmit = async (useSample = false) => {
    setUploading(true);
    setErrorMessage('');
    setSuccessStatus(null);

    const formData = new FormData();
    if (useSample) {
      formData.append('use_sample_data', 'true');
    } else {
      if (files.warehouses) formData.append('warehouses', files.warehouses);
      if (files.suppliers) formData.append('suppliers', files.suppliers);
      if (files.customers) formData.append('customers', files.customers);
      if (files.inventory) formData.append('inventory', files.inventory);
      if (files.workforce) formData.append('workforce', files.workforce);
    }

    try {
      const res = await api.post('/datasets/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessStatus({
        message: res.data.message,
        counts: res.data.counts,
      });
      setStoredCounts(res.data.counts);

      // Clear pending selected files since they are now committed to database
      setFiles({
        suppliers: null,
        customers: null,
        inventory: null,
        workforce: null,
        warehouses: null,
      });

      // Dispatch global event so all pages refresh immediately
      window.dispatchEvent(new CustomEvent('datasetsUpdated', { detail: res.data }));
    } catch (err) {
      setErrorMessage(err.response?.data?.error || 'Failed to update datasets. Please verify CSV schemas.');
    } finally {
      setUploading(false);
    }
  };

  const datasetList = [
    { key: 'suppliers', label: 'Suppliers', countKey: 'suppliers', desc: 'Vendor volume & lead times' },
    { key: 'customers', label: 'Customers', countKey: 'customers', desc: 'Order volumes & contractual SLAs' },
    { key: 'inventory', label: 'Inventory', countKey: 'inventory', desc: 'SKUs, stock on hand & safety buffers' },
    { key: 'workforce', label: 'Workforce', countKey: 'workforce', desc: 'Worker roles, skills & shift assignments' },
    { key: 'warehouses', label: 'Warehouses', countKey: 'warehouses', desc: 'Facilities, dock doors & capacity' },
  ];

  const hasPendingFiles = Object.values(files).some(Boolean);

  return (
    <div className="glass-card p-6 rounded-2xl border border-stone-800 space-y-5">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-800 pb-3">
        <div>
          <h3 className="font-bold text-sm text-stone-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-yellow-500" />
            Operational Datasets
          </h3>
          <p className="text-xs text-stone-400">
            Uploaded datasets remain permanently active in the database. You can update any file anytime.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleUploadSubmit(true)}
          disabled={uploading}
          className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-bold text-yellow-400 transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reload Sample Data</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{successStatus.message}</span>
        </div>
      )}

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {datasetList.map((item) => {
          const count = storedCounts ? storedCounts[item.countKey] : null;
          const pendingFile = files[item.key];
          return (
            <div key={item.key} className="p-3.5 rounded-xl bg-stone-950/70 border border-stone-800 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-100">{item.label}</span>
                  {pendingFile ? (
                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      New File Selected
                    </span>
                  ) : count !== null && count > 0 ? (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Active & Synced
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">Empty</span>
                  )}
                </div>

                <p className="text-[11px] text-stone-400 mt-0.5">{item.desc}</p>
                
                <div className="mt-2 text-xs font-mono text-stone-300">
                  {pendingFile ? (
                    <span className="text-yellow-400 font-bold truncate block">
                      Ready: {pendingFile.name}
                    </span>
                  ) : count !== null ? (
                    <span className="text-stone-300 font-semibold">
                      {count} records loaded in database
                    </span>
                  ) : (
                    <span>Loading...</span>
                  )}
                </div>
              </div>

              {/* Update File Input Button */}
              <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
                <label className="text-[11px] font-bold text-yellow-400 hover:text-yellow-300 cursor-pointer flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{count > 0 ? 'Update File' : 'Choose File'}</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileChange(item.key, e)}
                    className="hidden"
                  />
                </label>
                {pendingFile && (
                  <button
                    onClick={() => setFiles((prev) => ({ ...prev, [item.key]: null }))}
                    className="text-[10px] text-stone-400 hover:text-stone-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save / Update Action Bar */}
      {hasPendingFiles && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between animate-in fade-in">
          <div className="text-xs text-yellow-300 font-medium">
            You have selected new files to update. Click to apply them to the system.
          </div>
          <button
            type="button"
            onClick={() => handleUploadSubmit(false)}
            disabled={uploading}
            className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-stone-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Updating Database...' : 'Save & Update Datasets'}</span>
          </button>
        </div>
      )}

    </div>
  );
};

export default Profile;
