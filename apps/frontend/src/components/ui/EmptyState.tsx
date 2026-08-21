import React from "react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../../utils/cn";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-surface-border bg-surface-subtle/40 backdrop-blur-sm",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-surface-border flex items-center justify-center text-zinc-400 mb-4 shadow-inner-glow">
        {icon || <Inbox className="w-6 h-6 text-brand-400" />}
      </div>

      <h4 className="text-base font-semibold text-zinc-200">{title}</h4>
      <p className="text-sm text-zinc-400 max-w-sm mt-1.5 mb-5">{description}</p>

      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
