import { auth, currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import ResetDataButton from "@/components/reset-data-button";
import { logger } from "@/lib/logger";

export default async function Dashboard() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  const user = await currentUser();

  // Get or create user in database
  let analytics = null;
  let userRecord = null;

  try {
    userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { analytics: true },
    });

    // Create user if doesn't exist
    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          clerkId: userId,
          email: user?.emailAddresses?.[0]?.emailAddress || "",
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
        },
        include: { analytics: true },
      });
      logger.info("New user created in database", { userId: userRecord.id });
    }

    analytics = userRecord?.analytics;
  } catch (error) {
    console.error("Error fetching/creating user:", error);
  }

  // Use zero values if no analytics available
  const stats = {
    totalPnL: analytics?.totalNetProfitLoss || 0,
    winRate: analytics?.winRate || 0,
    totalTrades: analytics?.totalTrades || 0,
    maxDrawdown: analytics?.maxDrawdown || 0,
  };

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s your trading performance overview
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(stats.totalPnL)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics
                  ? "Total profit/loss from all trades"
                  : "Upload trades to see your P&L"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics
                  ? "Percentage of profitable trades"
                  : "Upload trades to see your win rate"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Trades
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTrades.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics
                  ? "Total number of trades executed"
                  : "Upload trades to see your activity"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Max Drawdown
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.maxDrawdown < 0
                  ? formatCurrency(stats.maxDrawdown)
                  : formatCurrency(0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics
                  ? "Maximum peak-to-trough decline"
                  : "Upload trades to see drawdown analysis"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card>
          <CardHeader>
            <CardTitle>
              {analytics
                ? "Your Trading Journey"
                : "Get Started with TradePulse"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics ? (
              <div>
                <p className="text-muted-foreground mb-4">
                  You have {stats.totalTrades} trades analyzed. Your current
                  performance shows a {stats.winRate.toFixed(1)}% win rate with
                  a total P&L of {formatCurrency(stats.totalPnL)}.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/reports"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    View Trade Reports
                  </a>
                  <a
                    href="/analytics"
                    className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Detailed Analytics
                  </a>
                  <a
                    href="/chat"
                    className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Chat with AI Assistant
                  </a>
                  <ResetDataButton variant="outline" size="default" />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  Upload your trade data to start analyzing your performance
                  with AI-powered insights powered by Google Gemini. We support
                  all major Indian brokers with intelligent column mapping.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/upload"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Upload Trading Data
                  </a>
                  <a
                    href="/chat"
                    className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Chat with AI Assistant
                  </a>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Supported Brokers</h4>
                  <p className="text-sm text-muted-foreground">
                    Zerodha, Angel One, ICICI Direct, Upstox, 5Paisa, Groww,
                    HDFC Securities, Kotak Securities, and more. Our AI
                    automatically detects and maps your broker&apos;s data
                    format.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
