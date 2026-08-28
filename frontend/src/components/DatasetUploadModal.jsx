import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, ShieldCheck, Database, ArrowRight } from 'lucide-react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';

const DatasetUploadModal = ({ isOpen, onClose, onIngestionSuccess }) => {
  const { t } = useLanguage();
  const [files, setFiles] = useState({
    suppliers: null,
    customers: null,
    inventory: null,
    workforce: null,
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (key, e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError(`${file.name} is not a .csv file.`);
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(`${file.name} exceeds 15MB file size limit.`);
        return;
      }
      setError(null);
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!files.suppliers && !files.customers && !files.inventory && !files.workforce) {
      setError('Please select at least one CSV file to ingest.');
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    if (files.suppliers) formData.append('suppliers', files.suppliers);
    if (files.customers) formData.append('customers', files.customers);
    if (files.inventory) formData.append('inventory', files.inventory);
    if (files.workforce) formData.append('workforce', files.workforce);

    try {
      const res = await api.post('/ingest/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || 'Datasets ingested and sanitized successfully!');
      if (onIngestionSuccess) onIngestionSuccess();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'Ingestion failed. Ensure data schema conforms to OASIS standards.');
    } finally {
      setUploading(false);
    }
  };

  const handleSeedSampleData = async () => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await api.post('/seed-sample-data/');
      setMessage('Sample enterprise supply chain datasets loaded and AES-256 encrypted successfully!');
      if (onIngestionSuccess) onIngestionSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to seed sample data.');
    } finally {
      setUploading(false);
    }
  };

  const datasetFields = [
    { key: 'suppliers', label: '1. suppliers.csv', desc: 'ID, Name, Origin City, Lat, Long, Item Type, Volume History, Lead Times' },
    { key: 'customers', label: '2. customers.csv', desc: 'ID, Region, Destination City, Lat, Long, SLA Hours, Avg Volume' },
    { key: 'inventory', label: '3. inventory.csv', desc: 'SKU ID, Category, Stock on Hand, Safety Stock, Turnover, Movement Velocity' },
    { key: 'workforce', label: '4. workforce.csv', desc: 'Employee ID, Name (AES-256), Primary Skill, Secondary Skill, Efficiency, Shift' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="glass-card bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Multi-Dataset Ingestion & Sanitization Engine</h2>
              <p className="text-xs text-slate-400">Enforces strict MIME validation, formula injection neutralizing & Pydantic schema checks</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Quick Seed Button Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-blue-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Quick-Start with Bundled Enterprise Datasets
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Load 4 pre-verified supply chain CSV datasets (10 suppliers, 10 customers, 12 SKUs, 18 workers).
              </p>
            </div>
            <button
              onClick={handleSeedSampleData}
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-glow-blue whitespace-nowrap flex items-center gap-1.5"
            >
              Load Sample Data
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Feedback messages */}
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* File Upload Grid */}
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {datasetFields.map((field) => (
                <div key={field.key} className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-200">{field.label}</span>
                    {files[field.key] ? (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">Max 15MB</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2 line-clamp-1">{field.desc}</p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileChange(field.key, e)}
                      className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                    />
                  </label>
                </div>
              ))}
            </div>

            {/* Security Guard Notice */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>In-memory processing active: cells starting with <code>=, +, -, @</code> sanitized against CSV formula injection.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-blue transition-all disabled:opacity-50"
              >
                {uploading ? 'Validating & Ingesting...' : 'Sanitize & Ingest Selected CSVs'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatasetUploadModal;
