"use client";

import { Loader2, RefreshCw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "spinner" | "dots" | "pulse";
  text?: string;
  className?: string;
}

export function Loading({
  size = "md",
  variant = "default",
  text,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const renderSpinner = () => (
    <Loader2 className={cn("animate-spin", sizeClasses[size], className)} />
  );

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
    </div>
  );

  const renderPulse = () => (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
      <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:0.1s]" />
      <div className="w-2 h-2 bg-current rounded-full animate-pulse [animation-delay:0.2s]" />
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "spinner":
        return renderSpinner();
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {renderContent()}
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface PageLoadingProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
}

export function PageLoading({
  title = "Loading...",
  description = "Please wait while we prepare your data",
  showProgress = false,
  progress = 0,
}: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {showProgress && (
          <div className="w-full max-w-xs mx-auto">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress.toFixed(0)}% complete
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-muted";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded",
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width || (variant === "circular" ? "2rem" : "100%"),
        height: height || (variant === "circular" ? "2rem" : "1rem"),
      }}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
  showTitle?: boolean;
  showContent?: boolean;
  lines?: number;
}

export function SkeletonCard({
  className,
  showTitle = true,
  showContent = true,
  lines = 3,
}: SkeletonCardProps) {
  return (
    <div className={cn("p-6 space-y-4", className)}>
      {showTitle && <Skeleton className="h-6 w-1/3" />}
      {showContent && (
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  text = "Loading...",
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
} 