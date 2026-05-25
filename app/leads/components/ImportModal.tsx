'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { leadsApi, type ImportBatch } from '@/lib/api.leads';

interface Props {
  onClose: () => void;
  onImportStarted: (batchId: string) => void;
}

export default function ImportModal({ onClose, onImportStarted }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dedupPhone, setDedupPhone] = useState(true);
  const [dedupEmail, setDedupEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [polling, setPolling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('Only .csv and .xlsx / .xls files are accepted.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit.');
      return;
    }
    setFile(f);
    setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const startPolling = (batchId: string) => {
    setPolling(true);
    pollRef.current = setInterval(async () => {
      try {
        const b = await leadsApi.importStatus(batchId);
        setBatch(b);
        if (b.status === 'done' || b.status === 'failed') {
          clearInterval(pollRef.current!);
          setPolling(false);
        }
      } catch {
        clearInterval(pollRef.current!);
        setPolling(false);
      }
    }, 1500);
  };

  const handleImport = async () => {
    if (!file) return;
    const keys: string[] = [];
    if (dedupPhone) keys.push('phone');
    if (dedupEmail) keys.push('email');
    setLoading(true);
    setError(null);
    try {
      const { batch_id } = await leadsApi.import(file, keys);
      onImportStarted(batch_id);
      startPolling(batch_id);
    } catch (e: any) {
      setError(e?.detail ?? 'Import failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!batch?.error_report) return;
    const rows = ['row,field,error', ...batch.error_report.map((r) => `${r.row},"${r.field}","${r.error}"`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'import_errors.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const isDone = batch?.status === 'done' || batch?.status === 'failed';
  const progress = batch
    ? batch.total_rows > 0
      ? Math.round(((batch.imported_count + batch.duplicate_count + batch.error_count) / batch.total_rows) * 100)
      : (isDone ? 100 : 0)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl border border-slate-200 w-[520px] p-6 shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-slate-900">Import Leads</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>

        {/* Drop zone — hide after import starts */}
        {!batch && (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors',
                isDragging ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <Upload className="w-8 h-8 text-slate-300" />
              {file ? (
                <p className="text-sm font-semibold text-cyan-700">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">Drop CSV or Excel file here</p>
                  <p className="text-xs text-slate-400">Supports .csv and .xlsx · max 10 MB / 50,000 rows</p>
                </>
              )}
              <button className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-white text-slate-600 bg-white">
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Dedup options */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2">De-duplicate on</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={dedupPhone} onChange={(e) => setDedupPhone(e.target.checked)} className="rounded" />
                  Phone number
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={dedupEmail} onChange={(e) => setDedupEmail(e.target.checked)} className="rounded" />
                  Email address
                </label>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Matching rows are imported but flagged — review and merge from the Duplicates panel.
              </p>
            </div>
          </>
        )}

        {/* Progress — shown after submit */}
        {batch && (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>
                {isDone ? (
                  batch.status === 'done' ? 'Import complete' : 'Import failed'
                ) : 'Processing…'}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', batch.status === 'failed' ? 'bg-red-500' : 'bg-cyan-500')}
                style={{ width: `${progress}%` }}
              />
            </div>

            {isDone && (
              <div className="grid grid-cols-3 gap-3 text-center mt-2">
                {[
                  { label: 'Imported', value: batch.imported_count, color: 'text-green-600' },
                  { label: 'Duplicates', value: batch.duplicate_count, color: 'text-amber-600' },
                  { label: 'Errors', value: batch.error_count, color: 'text-red-500' },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                    <p className={cn('text-lg font-bold', s.color)}>{s.value.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {batch.error_count > 0 && isDone && (
              <button
                onClick={handleDownloadErrors}
                className="flex items-center gap-1.5 text-xs text-amber-700 hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                Download error report ({batch.error_count} rows)
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            {isDone ? 'Close' : 'Cancel'}
          </button>
          {!batch && (
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-5 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Uploading…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
