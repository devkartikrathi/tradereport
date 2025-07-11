import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { TrendingUp, BarChart3, Shield, Users } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background flex-col justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-3 bg-primary rounded-xl">
              <TrendingUp className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TradePulse</h1>
              <p className="text-muted-foreground">
                AI-Powered Trading Analytics
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6">
            Welcome back to India&apos;s smartest trading platform
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Continue analyzing your trading performance with Google Gemini AI
            insights tailored for Indian markets including NSE, BSE, crypto, and
            forex.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Advanced performance analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">SEBI compliant and secure</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Trusted by 10,000+ Indian traders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-primary rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TradePulse</h1>
                <p className="text-sm text-muted-foreground">
                  AI Trading Analytics
                </p>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to your account</p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="animate-fade-in">
            <SignIn
              appearance={{
                elements: {
                  formButtonPrimary:
                    "bg-primary hover:bg-primary/90 text-primary-foreground",
                  card: "shadow-lg border-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-border hover:bg-muted",
                  formFieldInput: "border-border focus:border-primary",
                  footerActionLink: "text-primary hover:text-primary/80",
                },
              }}
            />
          </div>

          {/* Additional Links */}
          <div className="text-center space-y-4 pt-6">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up for free
              </Link>
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </Link>
              <span>•</span>
              <Link
                href="/help"
                className="hover:text-foreground transition-colors"
              >
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
