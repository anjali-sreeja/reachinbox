import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Send,
  MailPlus,
  Sparkles,
  LogOut,
  X,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../utils/cn";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      to: "/dashboard",
    },
    {
      label: "Scheduled Emails",
      icon: Clock,
      to: "/scheduled",
    },
    {
      label: "Sent Emails",
      icon: Send,
      to: "/sent",
    },
    {
      label: "Compose Email",
      icon: MailPlus,
      to: "/compose",
      badge: "New",
    },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      <aside
        className={cn(
          "w-64 border-r border-surface-border bg-[#0B0D14]/95 backdrop-blur-xl flex flex-col justify-between p-4 shrink-0 transition-transform duration-300 z-50",
          "fixed md:static inset-y-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-6">
          {/* Logo & Mobile Close */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center shadow-glow-sm border border-white/10">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white">
                  ReachInbox
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  AI
                </span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-surface-subtle"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 mb-2">
              Menu
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group select-none",
                    isActive
                      ? "bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-glow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-surface-subtle/80"
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple border border-brand-purple/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom User Mini-Profile */}
        {user && (
          <div className="pt-4 border-t border-surface-border/80">
            <div className="p-2.5 rounded-2xl bg-surface-subtle/70 border border-surface-border flex items-center justify-between gap-2 shadow-inner-glow">
              <div className="flex items-center gap-2.5 min-w-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border border-brand-500/40 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600/40 text-brand-200 border border-brand-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-zinc-200 truncate">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => void logout()}
                className="text-zinc-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
