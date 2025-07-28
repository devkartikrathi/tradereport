"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showUI?: boolean;
}

export function PerformanceMonitor({
  enabled = true,
  onMetricsUpdate,
  showUI = false,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    errorRate: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Measure page load time
  const measurePageLoadTime = useCallback(() => {
    if (typeof window !== "undefined") {
      const loadTime = performance.now();
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));
    }
  }, []);

  // Get memory usage (if available)
  const getMemoryUsage = useCallback(() => {
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      const usedMemory = memory?.usedJSHeapSize ? memory.usedJSHeapSize / 1024 / 1024 : 0; // MB
      setMetrics(prev => ({ ...prev, memoryUsage: usedMemory }));
      return usedMemory;
    }
    return 0;
  }, []);

  // Monitor network performance
  const monitorNetworkPerformance = useCallback(async () => {
    if ("connection" in navigator) {
      const connection = (navigator as { connection?: { rtt?: number } }).connection;
      if (connection) {
        const latency = connection.rtt || 0;
        setMetrics(prev => ({ ...prev, networkLatency: latency }));
        return latency;
      }
    }
    return 0;
  }, []);

  // Error tracking
  const trackErrors = useCallback(() => {
    let errorCount = 0;
    
    const originalError = console.error;
    console.error = (...args) => {
      errorCount++;
      setMetrics(prev => ({ ...prev, errorRate: errorCount }));
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!enabled) return;

    setIsMonitoring(true);
    
    // Measure initial page load
    measurePageLoadTime();

    // Set up periodic monitoring
    const interval = setInterval(() => {
      getMemoryUsage();
      monitorNetworkPerformance();
    }, 5000); // Check every 5 seconds

    // Set up error tracking
    const cleanupErrors = trackErrors();

    return () => {
      clearInterval(interval);
      cleanupErrors();
      setIsMonitoring(false);
    };
  }, [enabled, measurePageLoadTime, getMemoryUsage, monitorNetworkPerformance, trackErrors]);

  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  // Notify parent component of metrics updates
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Performance status indicators
  const getPerformanceStatus = (metric: keyof PerformanceMetrics) => {
    const value = metrics[metric];
    
    switch (metric) {
      case "pageLoadTime":
        return value < 1000 ? "good" : value < 3000 ? "warning" : "poor";
      case "apiResponseTime":
        return value < 200 ? "good" : value < 500 ? "warning" : "poor";
      case "memoryUsage":
        return value < 50 ? "good" : value < 100 ? "warning" : "poor";
      case "networkLatency":
        return value < 50 ? "good" : value < 100 ? "warning" : "poor";
      case "errorRate":
        return value === 0 ? "good" : value < 5 ? "warning" : "poor";
      default:
        return "unknown";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "poor":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!showUI) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Page Load</span>
              {getStatusIcon(getPerformanceStatus("pageLoadTime"))}
            </div>
            <div className="text-lg font-semibold">
              {metrics.pageLoadTime.toFixed(0)}ms
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Response</span>
              {getStatusIcon(getPerformanceStatus("apiResponseTime"))}
            </div>
            <div className="text-lg font-semibold">
              {metrics.apiResponseTime.toFixed(0)}ms
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Memory</span>
              {getStatusIcon(getPerformanceStatus("memoryUsage"))}
            </div>
            <div className="text-lg font-semibold">
              {metrics.memoryUsage.toFixed(1)}MB
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              {getStatusIcon(getPerformanceStatus("networkLatency"))}
            </div>
            <div className="text-lg font-semibold">
              {metrics.networkLatency.toFixed(0)}ms
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Error Rate</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(getPerformanceStatus("errorRate"))}
            <span className="text-sm font-medium">{metrics.errorRate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for easy performance monitoring
export function usePerformanceMonitor(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    errorRate: 0,
  });

  const handleMetricsUpdate = useCallback((newMetrics: PerformanceMetrics) => {
    setMetrics(newMetrics);
  }, []);

  return {
    metrics,
    PerformanceMonitorComponent: () => (
      <PerformanceMonitor
        enabled={enabled}
        onMetricsUpdate={handleMetricsUpdate}
        showUI={true}
      />
    ),
  };
} 