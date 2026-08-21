import React from "react";
import { useLocation } from "react-router-dom";
import { Menu, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const getPageDetails = () => {
    switch (location.pathname) {
      case "/dashboard":
      case "/":
        return {
          title: "Overview",
          description: "System throughput, scheduling pipeline, and delivery stats",
        };
      case "/scheduled":
        return {
          title: "Scheduled Emails",
          description: "Outbound queues waiting for automated dispatch",
        };
      case "/sent":
        return {
          title: "Sent Emails",
          description: "Completed deliveries with Ethereal SMTP preview links",
        };
      case "/compose":
        return {
          title: "Compose Outreach",
          description: "Configure batch recipient lists and delivery delays",
        };
      default:
        return {
          title: "Dashboard",
          description: "ReachInbox outreach automation workspace",
        };
    }
  };

  const { title, description } = getPageDetails();

  return (
    <header className="h-18 border-b border-surface-border bg-[#08090E]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-zinc-400 hover:text-zinc-100 bg-surface-subtle border border-surface-border"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs text-zinc-400 hidden sm:block">
            {description}
          </p>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            BullMQ Schedulers Active
          </span>
        </div>

        {/* User Mini Bar */}
        {user && (
          <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-surface-border">
            <div className="flex items-center gap-2.5">
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
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-zinc-200">{user.name}</span>
                <span className="text-[10px] text-zinc-400">{user.email}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => void logout()}
              className="text-zinc-400 hover:text-red-400 px-2.5 py-1.5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 mr-1 hidden sm:inline" />
              <span className="text-xs">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
