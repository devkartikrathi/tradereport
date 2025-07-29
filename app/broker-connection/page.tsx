"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/navigation/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Trash2,
  Download,
  Shield,
  Activity
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface BrokerConnection {
  id: string;
  broker: string;
  createdAt: string;
  updatedAt: string;
}



export default function BrokerConnectionPage() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  useEffect(() => {
    fetchConnections();
    
    // Check for URL parameters
    const errorParam = searchParams.get("error");
    const successParam = searchParams.get("success");
    
    if (errorParam) {
      setError(getErrorMessage(errorParam));
    }
    
    if (successParam) {
      setSuccess(getSuccessMessage(successParam));
    }
  }, [searchParams]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiClient.getBrokerConnections();
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to fetch connections");
      }
      setConnections(result.data as BrokerConnection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectZerodha = async () => {
    try {
      setConnecting(true);
      setError(null);
      
      // Get login URL from API
      const result = await apiClient.getZerodhaLoginUrl();
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to get login URL");
      }
      
      const { loginUrl } = result.data as { loginUrl: string };
      
      // Redirect to Zerodha login
      window.location.href = loginUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Zerodha");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (brokerId: string) => {
    try {
      const result = await apiClient.disconnectBroker(brokerId);
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to disconnect");
      }
      fetchConnections();
      setSuccess("Broker disconnected successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect broker");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    }
  };

  const handleImportData = async (broker: string) => {
    try {
      setLoading(true);
      const result = await apiClient.importBrokerData(broker);
      if (!result.success || result.error) {
        throw new Error(result.error || "Failed to import data");
      }
      setSuccess(`Data imported successfully from ${broker}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
      apiClient.handleError({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case "auth_failed":
        return "Authentication with Zerodha was rejected or failed. Please try again.";
      case "connection_failed":
        return "Failed to establish connection with Zerodha. Please try again.";
      case "no_request_token":
        return "No authentication token received from Zerodha.";
      default:
        return "An error occurred during the connection process.";
    }
  };

  const getSuccessMessage = (success: string): string => {
    switch (success) {
      case "zerodha_connected":
        return "Successfully connected to Zerodha! Your account is now linked.";
      default:
        return "Operation completed successfully.";
    }
  };

  const getBrokerIcon = (broker: string) => {
    switch (broker.toLowerCase()) {
      case "zerodha":
        return "🟢";
      case "angel":
        return "🟡";
      case "icici":
        return "🔵";
      case "upstox":
        return "🟣";
      case "5paisa":
        return "🟠";
      case "groww":
        return "🟤";
      default:
        return "📊";
    }
  };

  const getBrokerName = (broker: string): string => {
    switch (broker.toLowerCase()) {
      case "zerodha":
        return "Zerodha";
      case "angel":
        return "Angel One";
      case "icici":
        return "ICICI Direct";
      case "upstox":
        return "Upstox";
      case "5paisa":
        return "5paisa";
      case "groww":
        return "Groww";
      default:
        return broker;
    }
  };

  const isConnected = (broker: string): boolean => {
    return connections.some(conn => conn.broker.toLowerCase() === broker.toLowerCase());
  };

  return (
    <Sidebar>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Broker Connections</h1>
            <p className="text-muted-foreground">
              Connect your trading accounts to import data automatically
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Zerodha Connection */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getBrokerIcon("zerodha")}</span>
                  <div>
                    <CardTitle className="text-lg">Zerodha</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Connect your Zerodha Kite account
                    </p>
                  </div>
                </div>
                {isConnected("zerodha") && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Secure OAuth authentication</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span>Auto-import trades & positions</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>Real-time data access</span>
                </div>
              </div>

              {isConnected("zerodha") ? (
                <div className="space-y-2">
                  <Button 
                    onClick={() => handleImportData("zerodha")}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Import Data
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDisconnect(connections.find(c => c.broker === "zerodha")?.id || "")}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleConnectZerodha}
                  disabled={connecting}
                  className="w-full"
                >
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Connect with Zerodha
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Other Brokers - Coming Soon */}
          <Card className="relative opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🟡</span>
                  <div>
                    <CardTitle className="text-lg">Angel One</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Coming soon
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="relative opacity-60">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🔵</span>
                  <div>
                    <CardTitle className="text-lg">ICICI Direct</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Coming soon
                    </p>
                  </div>
                </div>
                <Badge variant="outline">Soon</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Button disabled className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="border-t border-gray-200 my-6" />

        {/* Connected Accounts */}
        {connections.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Connected Accounts</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <Card key={connection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getBrokerIcon(connection.broker)}</span>
                        <div>
                          <CardTitle className="text-lg">
                            {getBrokerName(connection.broker)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Connected {new Date(connection.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      onClick={() => handleImportData(connection.broker)}
                      disabled={loading}
                      variant="outline"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Import Data
                    </Button>
                    <Button 
                      onClick={() => handleDisconnect(connection.id)}
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Security Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Shield className="h-5 w-5" />
              <span>Security & Privacy</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <p className="text-sm">
              Your broker credentials are encrypted and stored securely. We only access the data you authorize 
              and never store your login passwords. All API tokens are encrypted using industry-standard 
              encryption algorithms.
            </p>
          </CardContent>
        </Card>
      </div>
    </Sidebar>
  );
}
