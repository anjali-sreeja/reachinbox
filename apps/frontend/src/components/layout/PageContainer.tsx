import React from "react";
import { cn } from "../../utils/cn";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = "xl",
  className,
  ...props
}) => {
  const maxWidthStyles = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in",
        maxWidthStyles[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
