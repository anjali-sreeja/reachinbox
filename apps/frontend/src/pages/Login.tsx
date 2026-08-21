import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/Button";
import { LoadingPage } from "../components/ui/Loading";

export const Login: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "access_denied") {
        setAuthError("Google sign-in was cancelled. Please try again.");
      } else {
        setAuthError("Authentication failed. Please verify your Google credentials.");
      }
    }
  }, [searchParams]);

  if (isLoading) {
    return <LoadingPage message="Checking authentication session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = () => {
    setIsRedirecting(true);
    login();
  };

  return (
    <div className="min-h-screen w-full bg-[#050507] text-zinc-100 flex flex-col justify-between items-center p-4 sm:p-6 relative overflow-hidden select-none bg-grid-pattern">
      {/* ── Background Subtle Ambient Lighting ── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-brand-600/15 via-brand-purple/10 to-brand-cyan/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* ── Top Bar / Minimal Header ── */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-white/10 flex items-center justify-center shadow-inner-glow">
            <Cpu className="w-4 h-4 text-brand-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-200">
            ReachInbox
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle/80 border border-white/5 text-[11px] text-zinc-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>v1.0 Production Engine</span>
        </div>
      </header>

      {/* ── Centered Card Container ── */}
      <main className="w-full max-w-[420px] my-auto py-8">
        {/* Card Header & AI Visual Node Element */}
        <div className="flex flex-col items-center text-center mb-6 space-y-3">
          <div className="relative">
            {/* Soft pulsing node effect */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-surface-elevated to-surface border border-brand-500/30 flex items-center justify-center shadow-glow-sm relative z-10">
              <Sparkles className="w-6 h-6 text-brand-400" />
            </div>
            <div className="absolute -inset-1 bg-brand-500/20 blur-md rounded-2xl -z-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
              ReachInbox
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-normal">
              AI-powered email outreach scheduler
            </p>
          </div>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="rounded-3xl bg-[#0D0E15]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 relative">
          <div className="space-y-1.5 text-center">
            <h2 className="text-base font-semibold text-zinc-100">
              Sign in to your account
            </h2>
            <p className="text-xs text-zinc-400">
              Access your campaigns, delayed jobs, and analytics
            </p>
          </div>

          {/* Authentication Error Alert */}
          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-left animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{authError}</p>
            </div>
          )}

          {/* Google OAuth CTA Button */}
          <div className="space-y-3">
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              isLoading={isRedirecting}
              onClick={handleGoogleLogin}
              className="h-12 bg-white text-zinc-900 hover:bg-zinc-100 hover:text-black font-semibold rounded-xl border border-white shadow-md transition-all active:scale-[0.98]"
              leftIcon={
                <svg className="w-5 h-5 mr-1 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              }
            >
              Continue with Google
            </Button>

            {/* Security Guarantee */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium pt-1">
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Secure authentication powered by Google</span>
            </div>
          </div>

          {/* Infrastructure Feature Chips */}
          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-2 text-left">
            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-white/5 flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-zinc-200">BullMQ Redis</span>
                <span className="text-[9px] text-zinc-400">Crash-resilient queue</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-white/5 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-purple shrink-0" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-zinc-200">Rate Limiting</span>
                <span className="text-[9px] text-zinc-400">200 emails / hr cap</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Subdued Footer ── */}
      <footer className="w-full max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2 py-4 border-t border-white/5 text-[11px] text-zinc-400">
        <span className="font-medium text-zinc-300">
          Email automation, intelligently scheduled.
        </span>
        <span className="flex items-center gap-1 text-zinc-400">
          ReachInbox &bull; Enterprise Cold Outreach Platform
          <ArrowRight className="w-3 h-3 ml-0.5" />
        </span>
      </footer>
    </div>
  );
};
