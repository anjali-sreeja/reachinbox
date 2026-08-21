import React from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  glow = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        "bg-surface/90 backdrop-blur-md border border-surface-border rounded-2xl shadow-inner-glow transition-all duration-300",
        hoverable &&
          "hover:border-surface-borderHover hover:shadow-glow-sm hover:translate-y-[-1px]",
        glow && "shadow-glow-sm border-brand-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn("p-5 sm:p-6 border-b border-surface-border/60", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3
      className={cn(
        "text-base sm:text-lg font-semibold text-zinc-100 tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn("text-xs sm:text-sm text-zinc-400 mt-1", className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return <div className={cn("p-5 sm:p-6", className)} {...props}>{children}</div>;
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "p-5 sm:p-6 border-t border-surface-border/60 flex items-center justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
