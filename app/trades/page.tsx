import { auth, currentUser } from "@clerk/nextjs/server";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  TrendingUp,
  Activity,
  BarChart3,
  Download,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import ResetDataButton from "@/components/reset-data-button";

export default async function TradesPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Sign in to view this page</div>;
  }

  const user = await currentUser();

  // Get or create user and their trades data
  let userRecord = null;
  let matchedTrades: any[] = [];
  let openPositions: any[] = [];

  try {
    userRecord = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        matchedTrades: {
          orderBy: [{ sellDate: "desc" }],
        },
        openPositions: {
          orderBy: [{ date: "desc" }],
        },
        analytics: true,
      },
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
        include: {
          matchedTrades: {
            orderBy: [{ sellDate: "desc" }],
          },
          openPositions: {
            orderBy: [{ date: "desc" }],
          },
          analytics: true,
        },
      });
      console.log("Created new user in database:", userRecord.id);
    }

    matchedTrades = userRecord?.matchedTrades || [];
    openPositions = userRecord?.openPositions || [];
  } catch (error) {
    console.error("Error fetching/creating user:", error);
  }

  if (!matchedTrades.length && !openPositions.length) {
    return (
      <Sidebar>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Trades & Positions</h1>
            <p className="text-muted-foreground">
              View your matched trades and open positions
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>No Trade Data Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Upload your trade data to view matched trades and open
                positions.
              </p>
              <a
                href="/upload"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Upload CSV Data
              </a>
            </CardContent>
          </Card>
        </div>
      </Sidebar>
    );
  }

  // Calculate summary statistics from matched trades only
  const totalMatched = matchedTrades.length;
  const profitableTrades = matchedTrades.filter((t) => t.profit > 0).length;
  const totalPnL = matchedTrades.reduce((sum, t) => sum + t.profit, 0);
  const winRate =
    totalMatched > 0 ? (profitableTrades / totalMatched) * 100 : 0;

  // Group matched trades by sell date for better organization
  const tradesByDate = matchedTrades.reduce((acc, trade) => {
    const dateKey = format(new Date(trade.sellDate), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(trade);
    return acc;
  }, {} as Record<string, typeof matchedTrades>);

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Trades & Positions</h1>
              <p className="text-muted-foreground">
                Matched trades: {totalMatched} | Open positions:{" "}
                {openPositions.length}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </button>
              <ResetDataButton variant="destructive" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Matched Trades
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMatched}</div>
              <p className="text-xs text-muted-foreground">
                Completed buy-sell pairs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {profitableTrades} profitable out of {totalMatched}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalPnL >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totalPnL)}
              </div>
              <p className="text-xs text-muted-foreground">
                Net profit/loss from matched trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Positions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openPositions.length}</div>
              <p className="text-xs text-muted-foreground">
                Unmatched buy/sell orders
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Matched Trades */}
        {matchedTrades.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Matched Trades History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  {(Object.entries(tradesByDate) as [string, any[]][]).map(
                    ([dateKey, dayTrades]) => (
                      <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold">
                            {format(new Date(dateKey), "MMMM dd, yyyy")}
                          </h3>
                          <Badge variant="outline">
                            {dayTrades.length} trades
                          </Badge>
                          <Badge
                            variant={
                              dayTrades.reduce(
                                (sum: number, t: any) => sum + t.profit,
                                0
                              ) >= 0
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dayTrades.reduce(
                                (sum: number, t: any) => sum + t.profit,
                                0
                              )
                            )}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {dayTrades.map((trade: any) => (
                            <div
                              key={trade.id}
                              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {trade.symbol}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      MATCHED
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Buy:{" "}
                                    {format(new Date(trade.buyDate), "MM/dd")}{" "}
                                    {trade.buyTime} <br />
                                    Sell:{" "}
                                    {format(
                                      new Date(trade.sellDate),
                                      "MM/dd"
                                    )}{" "}
                                    {trade.sellTime}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      Buy:
                                    </span>{" "}
                                    ₹{trade.buyPrice.toFixed(2)}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      Sell:
                                    </span>{" "}
                                    ₹{trade.sellPrice.toFixed(2)}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      Qty:
                                    </span>{" "}
                                    {trade.quantity.toLocaleString()}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">
                                      Commission:
                                    </span>{" "}
                                    ₹{trade.commission.toFixed(2)}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end">
                                  <div
                                    className={`text-lg font-bold ${
                                      trade.profit >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {formatCurrency(trade.profit)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {trade.duration && `${trade.duration} min`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Open Positions */}
        {openPositions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Open Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {openPositions.map((position: any) => (
                    <div
                      key={position.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {position.symbol}
                            </span>
                            <Badge
                              variant={
                                position.type === "BUY"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {position.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(position.date), "MM/dd/yyyy")}{" "}
                            {position.time}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Price:
                            </span>{" "}
                            ₹{position.price.toFixed(2)}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Commission:
                            </span>{" "}
                            ₹{position.commission.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Qty:</span>{" "}
                            {position.remainingQuantity.toLocaleString()}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Trade ID:
                            </span>{" "}
                            {position.tradeId || "N/A"}
                          </div>
                        </div>

                        <div className="flex flex-col items-end">
                          <div className="text-sm font-medium text-amber-600">
                            OPEN
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Awaiting match
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Additional Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a
            href="/analytics"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Analytics Dashboard
          </a>
          <a
            href="/chat"
            className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Ask AI About These Trades
          </a>
          <a
            href="/upload"
            className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Upload More Data
          </a>
        </div>
      </div>
    </Sidebar>
  );
}
