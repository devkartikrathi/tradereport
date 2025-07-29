'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  Activity,
  DollarSign,
  BarChart3,
  Shield,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface LivePosition {
  tradingsymbol: string;
  exchange: string;
  quantity: number;
  averagePrice: number;
  lastPrice: number;
  pnl: number;
  unrealised: number;
  realised: number;
  value: number;
  timestamp: Date;
}

interface LiveTrade {
  tradeId: string;
  tradingsymbol: string;
  exchange: string;
  transactionType: string;
  quantity: number;
  averagePrice: number;
  timestamp: Date;
  pnl?: number;
}

interface MonitoringData {
  positions: LivePosition[];
  todayTrades: LiveTrade[];
  dailyPnL: number;
  dailyTradesCount: number;
  totalExposure: number;
  lastUpdated: Date;
}

interface MarketHours {
  isMarketOpen: boolean;
  nextOpenTime?: Date;
  nextCloseTime?: Date;
  currentTime: Date;
}

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: Date;
}

interface AlertSummary {
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
}

export default function MonitoringPage() {
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [marketHours, setMarketHours] = useState<MarketHours | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertSummary, setAlertSummary] = useState<AlertSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/monitoring/live?type=all&alerts=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const data = await response.json();
      
      setMonitoringData(data.monitoringData);
      setMarketHours(data.marketHours);
      setAlerts(data.alerts || []);
      setAlertSummary(data.alertSummary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      toast.error('Failed to fetch monitoring data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMonitoringData();

    if (autoRefresh) {
      const interval = setInterval(fetchMonitoringData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Manual refresh
  const handleRefresh = () => {
    fetchMonitoringData();
    toast.success('Data refreshed');
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, isAcknowledged: true, isRead: true }
            : alert
        ));
        toast.success('Alert acknowledged');
      }
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  };

  // Mark alert as read
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', alertId })
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, isRead: true }
            : alert
        ));
      }
    } catch {
      toast.error('Failed to mark alert as read');
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Get P&L color
  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-time Monitoring</h1>
          <p className="text-muted-foreground">
            Live trading activity and risk monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Status */}
      {marketHours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Market Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {marketHours.isMarketOpen ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )}
                <span className="font-medium">
                  {marketHours.isMarketOpen ? 'Market Open' : 'Market Closed'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {marketHours.isMarketOpen 
                  ? `Closes at ${marketHours.nextCloseTime?.toLocaleTimeString('en-IN')}`
                  : `Opens at ${marketHours.nextOpenTime?.toLocaleTimeString('en-IN')}`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      {monitoringData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPnLColor(monitoringData.dailyPnL)}`}>
                ₹{monitoringData.dailyPnL.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">
                {monitoringData.dailyPnL >= 0 ? 'Profit' : 'Loss'} today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today&apos;s Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monitoringData.dailyTradesCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Total trades today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exposure</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{monitoringData.totalExposure.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-muted-foreground">
                Current positions value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alertSummary?.unreadAlerts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Unread alerts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Alerts</span>
              <Badge variant="secondary">{alerts.length}</Badge>
            </CardTitle>
            <CardDescription>
              Trading rule violations and important notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Alert key={alert.id} className={alert.isRead ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(alert.severity)}`} />
                      <div>
                        <AlertTitle className="flex items-center space-x-2">
                          <span>{alert.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {alert.severity}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(alert.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                      {!alert.isAcknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Positions */}
      {monitoringData?.positions && monitoringData.positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Live Positions</span>
              <Badge variant="secondary">{monitoringData.positions.length}</Badge>
            </CardTitle>
            <CardDescription>
              Current open positions with real-time P&L
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitoringData.positions.map((position) => (
                <div
                  key={`${position.tradingsymbol}-${position.exchange}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{position.tradingsymbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {position.exchange} • Qty: {position.quantity}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Avg Price</div>
                      <div className="font-medium">₹{position.averagePrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Last Price</div>
                      <div className="font-medium">₹{position.lastPrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">P&L</div>
                      <div className={`font-medium ${getPnLColor(position.pnl)}`}>
                        ₹{position.pnl.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Trades */}
      {monitoringData?.todayTrades && monitoringData.todayTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
                              <span>Today&apos;s Trades</span>
              <Badge variant="secondary">{monitoringData.todayTrades.length}</Badge>
            </CardTitle>
            <CardDescription>
              Trades executed today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monitoringData.todayTrades.map((trade) => (
                <div
                  key={trade.tradeId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{trade.tradingsymbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {trade.exchange} • {trade.transactionType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Quantity</div>
                      <div className="font-medium">{trade.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Price</div>
                      <div className="font-medium">₹{trade.averagePrice.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Time</div>
                      <div className="font-medium">
                        {new Date(trade.timestamp).toLocaleTimeString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Updated */}
      {monitoringData && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {new Date(monitoringData.lastUpdated).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  );
} 