import React from "react";
import { Sparkles, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left branding & mobile toggle */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center shadow-glow-sm border border-white/10">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            ReachInbox <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">AI</span>
          </span>
          <span className="text-[11px] text-zinc-400 font-medium">Outreach Automation</span>
        </div>
      </div>

      {/* Center status pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          BullMQ Schedulers Active
        </span>
      </div>

      {/* Right user & logout */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-brand-500/40 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600/40 text-brand-200 border border-brand-500/30 flex items-center justify-center text-xs font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-200">{user.name}</span>
                <span className="text-[11px] text-zinc-400 truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-zinc-400 hover:text-red-400 p-2"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
