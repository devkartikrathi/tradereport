import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PrismaClient } from "@prisma/client";
import {
  TrendingUp,
  Link,
  Unlink,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import ImportDataButton from "@/components/broker/import-data-button";

const prisma = new PrismaClient();

export default async function BrokerConnectionPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from database
  const userRecord = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { brokerConnections: true },
  });

  if (!userRecord) {
    redirect("/sign-in");
  }

  const zerodhaConnection = userRecord.brokerConnections.find(
    (conn) => conn.broker === "zerodha"
  );

  const isConnected = !!zerodhaConnection;

  return (
    <Sidebar>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Broker Connections</h1>
          <p className="text-muted-foreground">
            Connect your brokerage accounts to automatically import trading data
          </p>
        </div>

        {/* Status Messages */}
        {params.error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {params.error === "no_request_token" &&
                "No request token received from Zerodha"}
              {params.error === "config_error" &&
                "Broker integration not configured"}
              {params.error === "user_not_found" &&
                "User not found in database"}
              {params.error === "session_error" &&
                "Failed to establish session with Zerodha"}
              {params.error === "callback_error" && "Error processing callback"}
              {params.error === "disconnect_error" &&
                "Failed to disconnect broker"}
            </AlertDescription>
          </Alert>
        )}

        {params.success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {params.success === "connected" &&
                "Successfully connected to Zerodha!"}
              {params.success === "disconnected" &&
                "Successfully disconnected from Zerodha"}
            </AlertDescription>
          </Alert>
        )}

        {/* Zerodha Connection Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Zerodha</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    India&apos;s largest stock broker by active retail clients
                  </p>
                </div>
              </div>
              <Badge
                variant={isConnected ? "default" : "secondary"}
                className={isConnected ? "bg-green-100 text-green-800" : ""}
              >
                {isConnected ? (
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <XCircle className="h-3 w-3" />
                    <span>Not Connected</span>
                  </div>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connection Status</h4>
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? "Your Zerodha account is connected and ready to import data"
                      : "Connect your Zerodha account to automatically import trades and positions"}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {isConnected ? (
                    <>
                      <ImportDataButton />
                      <form action="/api/broker/disconnect" method="POST">
                        <input type="hidden" name="broker" value="zerodha" />
                        <Button variant="destructive" size="sm" type="submit">
                          <Unlink className="h-4 w-4 mr-2" />
                          Disconnect
                        </Button>
                      </form>
                    </>
                  ) : (
                    <form action="/api/auth/zerodha" method="GET">
                      <Button type="submit" size="sm">
                        <Link className="h-4 w-4 mr-2" />
                        Connect Zerodha
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {isConnected && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Connection Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Connected:</span>
                      <span className="ml-2">
                        {zerodhaConnection?.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Last Updated:
                      </span>
                      <span className="ml-2">
                        {zerodhaConnection?.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>What you can do with connected brokers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Automatic Trade Import</h4>
                  <p className="text-sm text-muted-foreground">
                    Import all your trades automatically without manual file
                    uploads
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Real-time Positions</h4>
                  <p className="text-sm text-muted-foreground">
                    Get current positions and portfolio holdings in real-time
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium">Scheduled Sync</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync data at regular intervals
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium">Secure Storage</h4>
                  <p className="text-sm text-muted-foreground">
                    All access tokens are encrypted and stored securely
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
