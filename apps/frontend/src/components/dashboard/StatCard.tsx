import React from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";
import { cn } from "../../utils/cn";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  variant?: "brand" | "emerald" | "amber" | "rose" | "purple";
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  variant = "brand",
  isLoading = false,
}) => {
  const variantStyles = {
    brand: {
      color: "text-brand-400",
      bgColor: "bg-brand-500/10",
      borderColor: "border-brand-500/20",
      glowColor: "group-hover:border-brand-500/40",
    },
    emerald: {
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      glowColor: "group-hover:border-emerald-500/40",
    },
    amber: {
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      glowColor: "group-hover:border-amber-500/40",
    },
    rose: {
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      glowColor: "group-hover:border-rose-500/40",
    },
    purple: {
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      glowColor: "group-hover:border-purple-500/40",
    },
  };

  const style = variantStyles[variant];

  return (
    <Card
      hoverable
      className={cn(
        "p-5 group relative overflow-hidden bg-[#10121A]/90 backdrop-blur-xl transition-all duration-300",
        style.glowColor
      )}
    >
      {/* Background subtle light splash */}
      <div
        className={cn(
          "absolute -right-8 -bottom-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20 transition-opacity group-hover:opacity-40",
          style.bgColor
        )}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "p-2.5 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105",
            style.bgColor,
            style.borderColor
          )}
        >
          <Icon className={cn("w-4 h-4", style.color)} />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-20 bg-surface-subtle animate-pulse rounded-lg my-1" />
        ) : (
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {value}
          </div>
        )}

        {description && (
          <div className="mt-1 text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <span>{description}</span>
          </div>
        )}
      </div>
    </Card>
  );
};
