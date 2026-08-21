import React from "react";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";

export interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingProps> = ({
  size = "md",
  text,
  className,
}) => {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={cn("animate-spin text-brand-500", sizeMap[size])} />
        <div className="absolute inset-0 bg-brand-500/20 blur-md rounded-full -z-10 animate-pulse-subtle" />
      </div>
      {text && <p className="text-xs sm:text-sm text-zinc-400 font-medium">{text}</p>}
    </div>
  );
};

export const LoadingPage: React.FC<{ message?: string }> = ({
  message = "Loading ReachInbox...",
}) => {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 select-none">
      <div className="relative flex flex-col items-center gap-4">
        {/* Glowing brand icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-purple flex items-center justify-center shadow-glow-md border border-white/20 animate-pulse">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <div className="flex items-center gap-2 mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          <span className="text-sm text-zinc-300 font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-surface-subtle border border-surface-border/50",
        className
      )}
      {...props}
    />
  );
};
