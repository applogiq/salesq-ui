'use client';
import { useState } from 'react';
import { Shield, CheckCircle2, AlertCircle, Smartphone, KeyRound } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { MFASetupOut } from '@/lib/api.types';

export default function MFAPage() {
  const { user } = useAuth();
  const [step, setStep] = useState<'idle' | 'setup' | 'confirm' | 'done'>('idle');
  const [mfaData, setMfaData] = useState<MFASetupOut | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled ?? false);
  const [disabling, setDisabling] = useState(false);

  async function startSetup() {
    setLoading(true);
    setError('');
    try {
      const data = await authApi.mfaSetup();
      setMfaData(data);
      setStep('setup');
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to initiate MFA setup');
    } finally {
      setLoading(false);
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.mfaConfirm(code);
      setMfaEnabled(true);
      setStep('done');
    } catch (e: any) {
      setError(e?.detail ?? 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function disableMFA() {
    setDisabling(true);
    setError('');
    try {
      await authApi.mfaDisable();
      setMfaEnabled(false);
      setStep('idle');
    } catch (e: any) {
      setError(e?.detail ?? 'Failed to disable MFA');
    } finally {
      setDisabling(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-slate-900">Two-Factor Authentication</h1>
        <p className="text-xs text-slate-500">Secure your account with a TOTP authenticator app (Google Authenticator, Authy, 1Password)</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Status card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mfaEnabled ? 'bg-green-100' : 'bg-slate-100'}`}>
            <Shield className={`w-6 h-6 ${mfaEnabled ? 'text-green-600' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              MFA is {mfaEnabled ? 'enabled' : 'disabled'}
            </p>
            <p className="text-xs text-slate-500">
              {mfaEnabled
                ? 'Your account is protected with two-factor authentication.'
                : 'Enable MFA to add an extra layer of security to your account.'}
            </p>
          </div>
          <div className="ml-auto">
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${mfaEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {mfaEnabled ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>

        {/* Step: idle */}
        {step === 'idle' && !mfaEnabled && (
          <button
            onClick={startSetup}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Smartphone className="w-4 h-4" />
            {loading ? 'Setting up…' : 'Set up authenticator app'}
          </button>
        )}

        {/* Step: show QR code */}
        {step === 'setup' && mfaData && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-slate-700">
              1. Scan this QR code with your authenticator app
            </p>
            <div
              className="w-48 h-48 border border-slate-200 rounded-xl overflow-hidden"
              dangerouslySetInnerHTML={{ __html: mfaData.qr_svg }}
            />
            <div>
              <p className="text-xs text-slate-500 mb-1">Or enter this key manually:</p>
              <code className="text-xs bg-slate-100 px-3 py-2 rounded-lg block break-all font-mono text-slate-700">
                {mfaData.uri.split('secret=')[1]?.split('&')[0] ?? mfaData.uri}
              </code>
            </div>
            <button
              onClick={() => setStep('confirm')}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition-colors"
            >
              I've scanned it → Enter code
            </button>
          </div>
        )}

        {/* Step: confirm code */}
        {step === 'confirm' && (
          <form onSubmit={confirmCode} className="space-y-4">
            <p className="text-sm font-medium text-slate-700">
              2. Enter the 6-digit code from your app to confirm
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-48 px-4 py-3 border border-slate-300 rounded-lg text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {loading ? 'Confirming…' : 'Confirm & Enable MFA'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('setup'); setCode(''); setError(''); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                ← Back
              </button>
            </div>
          </form>
        )}

        {/* Step: done */}
        {step === 'done' && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">MFA enabled successfully!</p>
              <p className="text-xs text-green-600">Your account now requires a TOTP code on every login.</p>
            </div>
          </div>
        )}

        {/* Disable MFA */}
        {mfaEnabled && step !== 'done' && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={disableMFA}
              disabled={disabling}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {disabling ? 'Disabling…' : 'Disable MFA'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl text-xs text-cyan-700 space-y-1">
        <p className="font-semibold">Recommended apps:</p>
        <ul className="list-disc list-inside space-y-0.5 text-cyan-600">
          <li>Google Authenticator (iOS / Android)</li>
          <li>Authy (multi-device sync)</li>
          <li>1Password (built-in TOTP)</li>
          <li>Microsoft Authenticator</li>
        </ul>
      </div>
    </div>
  );
}
