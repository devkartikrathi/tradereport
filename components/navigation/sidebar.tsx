"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Upload,
  MessageCircle,
  TrendingUp,
  Menu,
  X,
  Activity,
  TrendingDown,
  Shield,
  User,
  Brain,
  Target,
  Zap,
  Eye,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: BarChart3,
    description: "Overview of your trading performance",
  },
  {
    name: "Upload Data",
    href: "/upload",
    icon: Upload,
    description: "Upload your trade data files (CSV, XLSX, XLS)",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
    description: "Detailed analytics and insights",
  },
  {
    name: "Trades",
    href: "/trades",
    icon: TrendingDown,
    description: "View all trades and open positions",
  },
  {
    name: "Chat Assistant",
    href: "/chat",
    icon: MessageCircle,
    description: "AI-powered trading insights",
  },
  {
    name: "Trade Validator",
    href: "/validator",
    icon: Target,
    description: "Validate your trade ideas with AI",
  },
  {
    name: "AI Coaching",
    href: "/coaching",
    icon: Brain,
    description: "Get personalized trading insights",
  },
  {
    name: "Behavioral Insights",
    href: "/behavioral",
    icon: Eye,
    description: "Understand your trading patterns",
  },
  {
    name: "Risk Management",
    href: "/risk-management",
    icon: Shield,
    description: "Manage your trading risk",
  },
  {
    name: "Performance Goals",
    href: "/performance-goals",
    icon: Target,
    description: "Set and track your goals",
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    description: "Manage your account and settings",
  },
  {
    name: "Pricing",
    href: "/pricing",
    icon: Star,
    description: "View subscription plans and pricing",
  },
  {
    name: "Trading Rules",
    href: "/trading-rules",
    icon: Shield,
    description: "Set your personal trading rules",
  },
  {
    name: "Live Monitoring",
    href: "/monitoring",
    icon: Zap,
    description: "Real-time trading activity and alerts",
  },
];

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Activity className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TradePulse</h1>
                <p className="text-sm text-muted-foreground">
                  AI-Powered Analytics
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <UserButton
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-8 h-8",
                  },
                }}
              />
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-full bg-green-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-primary" />
              <span className="font-semibold">TradePulse</span>
            </div>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
