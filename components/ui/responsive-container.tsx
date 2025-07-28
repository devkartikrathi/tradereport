"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  centered?: boolean;
  fluid?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = "xl",
  padding = "md",
  centered = true,
  fluid = false,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  const paddingClasses = {
    none: "",
    sm: "px-2 py-2",
    md: "px-4 py-4",
    lg: "px-6 py-6",
    xl: "px-8 py-8",
  };

  return (
    <div
      className={cn(
        "w-full",
        !fluid && maxWidthClasses[maxWidth],
        centered && !fluid && "mx-auto",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
}

export function ResponsiveGrid({
  children,
  className,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = "md",
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const gridColsClasses = {
    sm: cols.sm ? `grid-cols-${cols.sm}` : "",
    md: cols.md ? `md:grid-cols-${cols.md}` : "",
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : "",
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : "",
  };

  return (
    <div
      className={cn(
        "grid",
        gapClasses[gap],
        gridColsClasses.sm,
        gridColsClasses.md,
        gridColsClasses.lg,
        gridColsClasses.xl,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
  hover?: boolean;
  interactive?: boolean;
}

export function ResponsiveCard({
  children,
  className,
  variant = "default",
  hover = false,
  interactive = false,
}: ResponsiveCardProps) {
  const variantClasses = {
    default: "bg-card border border-border",
    elevated: "bg-card border border-border shadow-lg",
    outlined: "bg-transparent border-2 border-border",
  };

  const hoverClasses = hover ? "hover:shadow-md transition-shadow duration-200" : "";
  const interactiveClasses = interactive ? "cursor-pointer active:scale-95 transition-transform duration-150" : "";

  return (
    <div
      className={cn(
        "rounded-lg p-4",
        variantClasses[variant],
        hoverClasses,
        interactiveClasses,
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  className?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
  color?: "default" | "muted" | "primary" | "secondary";
  responsive?: boolean;
}

export function ResponsiveText({
  children,
  className,
  size = "base",
  weight = "normal",
  color = "default",
  responsive = true,
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
    "3xl": "text-3xl",
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const colorClasses = {
    default: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary-foreground",
  };

  const responsiveClasses = responsive ? {
    xs: "text-xs sm:text-sm",
    sm: "text-sm sm:text-base",
    base: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
    xl: "text-xl sm:text-2xl",
    "2xl": "text-2xl sm:text-3xl",
    "3xl": "text-3xl sm:text-4xl",
  } : sizeClasses;

  return (
    <div
      className={cn(
        responsiveClasses[size],
        weightClasses[weight],
        colorClasses[color],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  responsive?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  responsive = true,
}: ResponsiveImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        responsive ? "w-full h-auto" : "",
        className
      )}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
    />
  );
}

interface ResponsiveButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  responsive?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function ResponsiveButton({
  children,
  className,
  variant = "default",
  size = "md",
  responsive = true,
  fullWidth = false,
  disabled = false,
  onClick,
}: ResponsiveButtonProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-6 text-lg",
  };

  const responsiveClasses = responsive ? {
    sm: "h-8 px-3 text-sm sm:h-10 sm:px-4 sm:text-base",
    md: "h-10 px-4 py-2 sm:h-12 sm:px-6 sm:text-lg",
    lg: "h-12 px-6 text-lg sm:h-14 sm:px-8 sm:text-xl",
  } : sizeClasses;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        responsiveClasses[size],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
} 