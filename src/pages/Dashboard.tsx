import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, CreditCard, Key, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ApiKey {
  id: string;
  keyName: string | null;
  apiKey: string;
  fullApiKey?: string;
  createdAt: string;
  lastUsedAt: string | null;
  active: boolean;
}

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchApiKeys();
    }
  }, [token]);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch (error) {
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyName: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('API key created! Save it securely - it won\'t be shown again.');
        setNewKeyName('');
        await fetchApiKeys();
        
        // Show the full key once
        if (data.key?.apiKey) {
          const shouldCopy = window.confirm('API key created! Click OK to copy it to clipboard.');
          if (shouldCopy) {
            navigator.clipboard.writeText(data.key.apiKey);
            toast.success('API key copied to clipboard!');
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create API key');
      }
    } catch (error) {
      toast.error('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('API key revoked');
        await fetchApiKeys();
      } else {
        toast.error('Failed to revoke API key');
      }
    } catch (error) {
      toast.error('Failed to revoke API key');
    } finally {
      setDeleteKeyId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Signature Kit Pro</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Dashboard</h1>

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList>
            <TabsTrigger value="api-keys">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="billing">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>
                  Manage your API keys for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Create new key */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Key name (e.g., Production, Development)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={createApiKey} disabled={isCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Key
                  </Button>
                </div>

                {/* Keys list */}
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{key.keyName || 'Unnamed Key'}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {key.apiKey}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                            {key.lastUsedAt && (
                              <> • Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(key.apiKey)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteKeyId(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Billing</CardTitle>
                <CardDescription>Manage your subscription and payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Current Plan</h3>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg capitalize text-foreground">
                          {user?.subscriptionTier || 'Free'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Status: {user?.subscriptionStatus || 'Active'}
                        </div>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Payment Method</h3>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-muted-foreground">No payment method on file</div>
                      <Button variant="outline" disabled>
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Billing History */}
                <div>
                  <h3 className="font-semibold mb-2 text-foreground">Billing History</h3>
                  <div className="p-4 border rounded-lg text-center text-muted-foreground">
                    No billing history available
                  </div>
                </div>

                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  <strong>Note:</strong> Billing functionality is coming soon. This is a preview of the billing interface.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteKeyId !== null} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The API key will be immediately revoked and all requests using it will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteKeyId && deleteApiKey(deleteKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;

