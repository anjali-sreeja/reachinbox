import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "gradient";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2.5 rounded-xl gap-2",
    lg: "text-base px-5 py-3 rounded-xl gap-2.5",
  };

  const variants = {
    primary:
      "bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm hover:shadow-glow-md border border-brand-400/30",
    gradient:
      "bg-ai-gradient text-white shadow-glow-sm hover:shadow-glow-md border border-white/20 hover:brightness-110",
    secondary:
      "bg-surface-subtle hover:bg-surface-elevated text-zinc-200 border border-surface-border hover:border-surface-borderHover",
    outline:
      "bg-transparent hover:bg-white/5 text-zinc-300 border border-white/10 hover:border-brand-500/40 hover:text-white",
    ghost:
      "bg-transparent hover:bg-white/5 text-zinc-400 hover:text-zinc-100 border border-transparent",
    danger:
      "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40",
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
