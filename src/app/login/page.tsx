'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithGrpc, saveSession } from '../../lib/grpc-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@omnisign.io');
  const [password, setPassword] = useState('OmniSign123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const session = await loginWithGrpc(email, password);
      saveSession(session);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#000000] text-slate-100">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md card-elevated p-8 relative z-10 space-y-6">
        {/* Brand Logo & Headline */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="w-6 h-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              OmniSign Enterprise
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Masuk ke panel kontrol signage via Rust Tonic gRPC & Envoy
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              {errorMsg}
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Administrator
            </label>
            <input
              type="email"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@omnisign.io"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/80 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" /> Password
            </label>
            <input
              type="password"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-indigo-600 bg-white/10 border-white/20" />
              <span>Ingat sesi ini</span>
            </label>
            <span className="text-[11px] font-mono text-indigo-400/80">Argon2id + JWT</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Menghubungkan ke gRPC...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & System Info Footnote */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Multi-table RBAC • Envoy Proxy & TLS Active</span>
        </div>
      </div>
    </div>
  );
}
