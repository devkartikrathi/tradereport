"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Shield, Link, Unlink, Edit, Save, X, Calendar, Mail, UserCheck } from "lucide-react";
import Sidebar from "@/components/navigation/sidebar";
import { useUser } from "@clerk/nextjs";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TradingRules {
  maxDailyTrades: number;
  maxDailyLoss: number;
  riskRewardRatio: number;
}

interface BrokerConnection {
  id: string;
  broker: string;
  createdAt: string;
  updatedAt: string;
}

interface ZerodhaProfile {
  user_id: string;
  user_name: string;
  email: string;
  broker: string;
  user_type: string;
  exchanges: string[];
  products: string[];
  order_types: string[];
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
}

interface TradingRulesFormData {
  maxDailyTrades: string;
  maxDailyLoss: string;
  riskRewardRatio: string;
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tradingRules, setTradingRules] = useState<TradingRules | null>(null);
  const [brokerConnections, setBrokerConnections] = useState<BrokerConnection[]>([]);
  const [zerodhaProfile, setZerodhaProfile] = useState<ZerodhaProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: ""
  });

  // Trading rules edit state
  const [isEditingRules, setIsEditingRules] = useState(false);
  const [rulesFormData, setRulesFormData] = useState<TradingRulesFormData>({
    maxDailyTrades: "10",
    maxDailyLoss: "1000",
    riskRewardRatio: "2.0"
  });

  useEffect(() => {
    if (isLoaded && user) {
      fetchProfileData();
    }
  }, [isLoaded, user]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const profileResponse = await fetch('/api/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setProfileFormData({
          firstName: profileData.firstName || "",
          lastName: profileData.lastName || ""
        });
      }

      // Fetch trading rules
      const rulesResponse = await fetch('/api/trading-rules');
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setTradingRules(rulesData);
        setRulesFormData({
          maxDailyTrades: rulesData.maxDailyTrades.toString(),
          maxDailyLoss: rulesData.maxDailyLoss.toString(),
          riskRewardRatio: rulesData.riskRewardRatio.toString()
        });
      }

      // Fetch broker connections
      const connectionsResponse = await fetch('/api/broker/connections');
      if (connectionsResponse.ok) {
        const connectionsData = await connectionsResponse.json();
        setBrokerConnections(connectionsData.connections || []);
        
        // Check if Zerodha is connected and fetch profile
        const zerodhaConnection = connectionsData.connections?.find((conn: BrokerConnection) => conn.broker === "zerodha");
        if (zerodhaConnection) {
          try {
            const zerodhaResponse = await fetch('/api/zerodha/profile');
            if (zerodhaResponse.ok) {
              const zerodhaData = await zerodhaResponse.json();
              setZerodhaProfile(zerodhaData);
            }
          } catch (error) {
            console.error('Error fetching Zerodha profile:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: profileFormData.firstName,
          lastName: profileFormData.lastName
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile.user);
        setIsEditingProfile(false);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTradingRulesUpdate = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/trading-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDailyTrades: parseInt(rulesFormData.maxDailyTrades),
          maxDailyLoss: parseFloat(rulesFormData.maxDailyLoss),
          riskRewardRatio: parseFloat(rulesFormData.riskRewardRatio)
        }),
      });

      if (response.ok) {
        const updatedRules = await response.json();
        setTradingRules(updatedRules.rules);
        setIsEditingRules(false);
        setMessage({ type: 'success', text: 'Trading rules updated successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to update trading rules' });
      }
    } catch (error) {
      console.error('Error updating trading rules:', error);
      setMessage({ type: 'error', text: 'Failed to update trading rules' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrokerDisconnect = async (brokerId: string) => {
    try {
      const response = await fetch('/api/broker/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brokerId }),
      });

      if (response.ok) {
        setBrokerConnections(prev => prev.filter(conn => conn.id !== brokerId));
        setMessage({ type: 'success', text: 'Broker disconnected successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message || 'Failed to disconnect broker' });
      }
    } catch (error) {
      console.error('Error disconnecting broker:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect broker' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN')}`;
  };

  if (!isLoaded || isLoading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </Sidebar>
    );
  }

  if (!user) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to view your profile.</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information, trading rules, and broker connections.
            </p>
          </div>

          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          {/* User Information Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your personal information and account details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={profileFormData.firstName}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={profileFormData.lastName}
                        onChange={(e) => setProfileFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleProfileUpdate} disabled={isSaving} className="flex items-center gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingProfile(false)}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                      <p className="font-medium">{user.emailAddresses[0]?.emailAddress}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Member Since
                      </div>
                      <p className="font-medium">{profile ? formatDate(profile.createdAt) : 'Loading...'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        First Name
                      </div>
                      <p className="font-medium">{profile?.firstName || 'Not set'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        Last Name
                      </div>
                      <p className="font-medium">{profile?.lastName || 'Not set'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trading Rules Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Trading Rules
              </CardTitle>
              <CardDescription>
                Manage your risk management and trading discipline rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingRules ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Daily Trades</label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={rulesFormData.maxDailyTrades}
                        onChange={(e) => setRulesFormData(prev => ({ ...prev, maxDailyTrades: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Daily Loss</label>
                      <Input
                        type="number"
                        min="100"
                        max="100000"
                        step="100"
                        value={rulesFormData.maxDailyLoss}
                        onChange={(e) => setRulesFormData(prev => ({ ...prev, maxDailyLoss: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Risk-Reward Ratio</label>
                      <Input
                        type="number"
                        min="0.5"
                        max="10.0"
                        step="0.1"
                        value={rulesFormData.riskRewardRatio}
                        onChange={(e) => setRulesFormData(prev => ({ ...prev, riskRewardRatio: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleTradingRulesUpdate} disabled={isSaving} className="flex items-center gap-2">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {isSaving ? 'Saving...' : 'Save Rules'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingRules(false)}
                      disabled={isSaving}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{tradingRules?.maxDailyTrades || 10}</div>
                      <div className="text-sm text-blue-600">Daily Trades</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {tradingRules ? formatCurrency(tradingRules.maxDailyLoss) : '₹1,000'}
                      </div>
                      <div className="text-sm text-green-600">Daily Loss Limit</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{tradingRules?.riskRewardRatio || 2.0}</div>
                      <div className="text-sm text-purple-600">Risk-Reward Ratio</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditingRules(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Trading Rules
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Broker Connections Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Broker Connections
              </CardTitle>
              <CardDescription>
                Manage your connected brokerage accounts and API connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brokerConnections.length === 0 ? (
                <div className="text-center py-8">
                  <Unlink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Broker Connections</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your brokerage account to automatically import trade data.
                  </p>
                  <Button asChild>
                    <a href="/broker-connection">Connect Broker Account</a>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {brokerConnections.map((connection) => (
                    <div key={connection.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Link className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium capitalize">{connection.broker}</h4>
                            <p className="text-sm text-muted-foreground">
                              Connected on {formatDate(connection.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">
                            {connection.broker}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBrokerDisconnect(connection.id)}
                            className="flex items-center gap-2"
                          >
                            <Unlink className="h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                      
                      {/* Show Zerodha user details if connected */}
                      {connection.broker === "zerodha" && zerodhaProfile && (
                        <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Zerodha Account Details</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <span className="ml-2 font-medium">{zerodhaProfile.user_id}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Name:</span>
                              <span className="ml-2 font-medium">{zerodhaProfile.user_name}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>
                              <span className="ml-2 font-medium">{zerodhaProfile.email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Account Type:</span>
                              <span className="ml-2 font-medium capitalize">{zerodhaProfile.user_type}</span>
                            </div>
                          </div>
                          {zerodhaProfile.exchanges && zerodhaProfile.exchanges.length > 0 && (
                            <div className="pt-2 border-t border-blue-200">
                              <span className="text-xs text-muted-foreground">Available Exchanges:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {zerodhaProfile.exchanges.map((exchange, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {exchange}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  <Button asChild variant="outline">
                    <a href="/broker-connection">Manage Connections</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
} 