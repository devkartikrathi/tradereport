import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import {
  TrendingUp,
  BarChart3,
  MessageCircle,
  Zap,
  CheckCircle,
} from "lucide-react";

export default function SignUpPage() {
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
            Join India&apos;s most advanced trading analytics platform
          </h2>

          <p className="text-lg text-muted-foreground mb-8">
            Start analyzing your trading performance with Google Gemini AI
            insights. Get personalized recommendations for NSE, BSE, crypto, and
            forex trading.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <span className="text-sm">Free forever for basic analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Interactive charts and insights</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">
                AI chatbot powered by Google Gemini
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">
                Instant CSV analysis and processing
              </span>
            </div>
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Trusted by 10,000+ traders</span>{" "}
              across India for performance analysis and trade optimization.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
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
            <h2 className="text-2xl font-bold">Get started today</h2>
            <p className="text-muted-foreground">Create your free account</p>
          </div>

          {/* Clerk Sign Up Component */}
          <div className="animate-fade-in">
            <SignUp
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
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign in
              </Link>
            </p>

            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                By signing up, you agree to our{" "}
                <Link
                  href="/terms"
                  className="text-primary hover:text-primary/80"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-primary hover:text-primary/80"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground pt-4">
              <Link
                href="/help"
                className="hover:text-foreground transition-colors"
              >
                Help Center
              </Link>
              <span>•</span>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact Support
              </Link>
              <span>•</span>
              <Link
                href="/demo"
                className="hover:text-foreground transition-colors"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
