'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Shield, Sparkles, CheckCircle2, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Step = 'credentials' | 'mfa';

const DEMO_USERS = [
  { label: 'Admin',     email: 'manoj@salesq.com',   password: 'manoj@123'  },
  { label: 'Manager',   email: 'soorya@salesq.com',  password: 'soorya@123' },
  { label: 'Executive', email: 'jessica@salesq.com', password: 'jessica@123' },
];

export default function LoginPage() {
  const [step, setStep] = useState<Step>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  function fillDemo(u: typeof DEMO_USERS[0]) {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
    setStep('credentials');
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.detail === 'MFA code required') {
        setStep('mfa');
      } else {
        setError(err?.detail ?? 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleMFA(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, totpCode);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.detail ?? 'Invalid MFA code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1526 0%, #0f2040 50%, #0a1a35 100%)' }}
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">SQ</span>
          </div>
          <div>
            <p className="text-white font-semibold text-lg leading-tight">SalesQ</p>
            <p className="text-slate-400 text-xs">AI Sales Calling · CRM · Coaching</p>
          </div>
        </div>

        {/* Copy */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-300 text-xs font-medium tracking-wide uppercase">
              Powered by GPT-4o · DeepSeek · Whisper
            </span>
          </div>

          <div>
            <h1 className="text-5xl font-extrabold text-white leading-[1.1]">
              Every call.<br />
              Every coach.<br />
              <span className="text-slate-300">One workspace.</span>
            </h1>
            <p className="mt-5 text-slate-400 text-base leading-relaxed max-w-sm">
              Browser softphone, AI coaching, conversation intelligence, and the
              entire CRM — wired together so every conversation makes the next one better.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '24,128', label: 'CALLS ANALYZED TODAY' },
              { value: '+32%',   label: 'AVG. CLOSE-RATE LIFT' },
              { value: '0.4s',   label: 'COACHING LATENCY' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-slate-500 text-[10px] font-medium tracking-wider mt-0.5 uppercase">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-slate-300 text-sm leading-relaxed italic">
              "We replaced four tools with SalesQ. Our team's connect rate jumped from 38% to 67% in eight weeks."
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">LP</div>
              <div>
                <p className="text-white text-xs font-semibold">Linda Park</p>
                <p className="text-slate-500 text-xs">VP Sales, Bright Future Ltd</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-slate-600 text-xs">
          <CheckCircle2 className="w-3 h-3" />
          <span>SOC 2 · GDPR · HIPAA</span>
          <span className="mx-2">·</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            All systems normal
          </span>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex flex-col justify-between w-full lg:w-1/2 bg-white">
        <div className="flex items-center justify-end p-6 gap-4">
          <span className="text-slate-500 text-sm">Don't have an account?</span>
          <button className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Request Demo
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-md space-y-6">

            {step === 'credentials' ? (
              <>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
                  <p className="text-slate-500 mt-1">Sign in to your SalesQ workspace.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Work email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <button type="button" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">Forgot</button>
                    </div>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    {loading ? 'Signing in…' : 'Sign in to SalesQ'}
                    {!loading && <span>›</span>}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div>
                  <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-cyan-600" />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Two-step verification</h2>
                  <p className="text-slate-500 mt-1">Enter the 6-digit code from your authenticator app.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleMFA} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Authentication code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoFocus
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || totpCode.length !== 6}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm"
                  >
                    {loading ? 'Verifying…' : 'Verify & Sign in'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('credentials'); setError(''); setTotpCode(''); }}
                    className="w-full py-2 text-sm text-slate-500 hover:text-slate-700"
                  >
                    ← Back to sign in
                  </button>
                </form>
              </>
            )}

            {/* Demo credentials */}
            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
              <p className="text-xs text-cyan-700 font-semibold mb-2">Demo accounts — click to fill</p>
              <div className="space-y-1.5">
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => fillDemo(u)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs bg-white border border-cyan-100 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    <span className="font-semibold text-cyan-800">{u.label}</span>
                    <span className="text-slate-500">{u.email}</span>
                    <span className="text-slate-400 font-mono">{u.password}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">© 2026 SalesQ Inc.</span>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Help'].map((l) => (
              <button key={l} className="text-xs text-slate-400 hover:text-slate-600">{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
