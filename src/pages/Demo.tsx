// Demo page showing the complete flow of Signature Kit Pro
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PDFBuilderEmbed } from '@/lib/PDFBuilderEmbed';
import { RichTextBuilderEmbed } from '@/lib/RichTextBuilderEmbed';
import { 
  BookOpen, 
  Code, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const Demo = () => {
  const [apiKey, setApiKey] = useState('');
  const [customerId, setCustomerId] = useState('demo_clinic_123');
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderType, setBuilderType] = useState<'pdf' | 'rich_text'>('pdf');
  const [documentId, setDocumentId] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleContinue = (docId: string) => {
    setDocumentId(docId);
    toast.success(`Document saved! ID: ${docId}`);
  };

  const previewUrl = documentId && apiKey 
    ? `${window.location.origin}/preview?templateId=${documentId}&apiKey=${apiKey}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Signature Kit Pro - Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how to embed the builder in your application and manage documents with customer IDs
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Complete Flow
                </CardTitle>
                <CardDescription>
                  Understand how Signature Kit Pro works end-to-end
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Get API Key</h3>
                      <p className="text-sm text-muted-foreground">
                        Sign up and get your API key from the dashboard. This key authenticates all your requests.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Embed Builder</h3>
                      <p className="text-sm text-muted-foreground">
                        Import the builder component and pass your API key and customer ID. Users can create documents.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Save Document</h3>
                      <p className="text-sm text-muted-foreground">
                        When user clicks "Continue", the document is saved with the customer ID. You get back a document ID.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Share Preview</h3>
                      <p className="text-sm text-muted-foreground">
                        Send the preview URL to users via email. They can view the document without signing in.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Multi-Tenant</h3>
                      <p className="text-sm text-muted-foreground">
                        Each customer (clinic, company, etc.) only sees their own documents thanks to customer ID filtering.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Medical Clinics</h3>
                    <p className="text-sm text-muted-foreground">
                      Each clinic has its own customer ID. When a clinic logs in, they only see templates created for their clinic.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">SaaS Applications</h3>
                    <p className="text-sm text-muted-foreground">
                      Your SaaS customers can embed the builder. Each customer's documents are isolated by customer ID.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Installation & Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">1. Install Package</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm flex items-center justify-between">
                    <code>npm install signature-kit-pro</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('npm install signature-kit-pro')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">2. Import Component</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-xs">
{`import { PDFBuilderEmbed } from 'signature-kit-pro';
import 'signature-kit-pro/dist/style.css';`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(`import { PDFBuilderEmbed } from 'signature-kit-pro';\nimport 'signature-kit-pro/dist/style.css';`)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-2">3. Use Component</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-xs">
{`<PDFBuilderEmbed
  apiKey="sk_your_api_key_here"
  customerId="clinic_123"
  onContinue={(documentId) => {
    // Redirect to preview or save document ID
    window.location.href = \`/preview?templateId=\${documentId}&apiKey=sk_...\`;
  }}
/>`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(`<PDFBuilderEmbed\n  apiKey="sk_your_api_key_here"\n  customerId="clinic_123"\n  onContinue={(documentId) => {\n    window.location.href = \`/preview?templateId=\${documentId}&apiKey=sk_...\`;\n  }}\n/>`)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Try the Builder
                </CardTitle>
                <CardDescription>
                  Enter your API key and customer ID to test the builder
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      placeholder="sk_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from the dashboard
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer ID</Label>
                    <Input
                      id="customerId"
                      placeholder="clinic_123"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier for your customer/tenant
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!apiKey) {
                        toast.error('Please enter an API key');
                        return;
                      }
                      setBuilderType('pdf');
                      setShowBuilder(true);
                    }}
                    variant="outline"
                  >
                    Try PDF Builder
                  </Button>
                  <Button
                    onClick={() => {
                      if (!apiKey) {
                        toast.error('Please enter an API key');
                        return;
                      }
                      setBuilderType('rich_text');
                      setShowBuilder(true);
                    }}
                    variant="outline"
                  >
                    Try Rich Text Builder
                  </Button>
                </div>

                {showBuilder && apiKey && (
                  <div className="border rounded-lg overflow-hidden">
                    {builderType === 'pdf' ? (
                      <PDFBuilderEmbed
                        apiKey={apiKey}
                        customerId={customerId}
                        onContinue={handleContinue}
                        onSave={(docId) => {
                          setDocumentId(docId);
                          toast.success(`Document saved! ID: ${docId}`);
                        }}
                      />
                    ) : (
                      <RichTextBuilderEmbed
                        apiKey={apiKey}
                        customerId={customerId}
                        onContinue={handleContinue}
                        onSave={(docId) => {
                          setDocumentId(docId);
                          toast.success(`Document saved! ID: ${docId}`);
                        }}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview URL</CardTitle>
                <CardDescription>
                  Share this URL with users to let them preview the document
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewUrl ? (
                  <>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm break-all">
                      {previewUrl}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(previewUrl)}
                        variant="outline"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy URL
                      </Button>
                      <Button
                        onClick={() => window.open(previewUrl, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Preview
                      </Button>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-foreground">
                        <strong>Note:</strong> This URL can be sent via email. When users click it, they'll see the document preview without needing to sign in.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Create a document first to generate a preview URL</p>
                    <p className="text-sm mt-2">Go to the "Builder" tab and create a document</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Using the SDK</h3>
                  <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre className="text-xs">
{`import { SignatureKitProSDK } from 'signature-kit-pro/sdk';

const sdk = new SignatureKitProSDK({
  apiKey: 'sk_...',
  customerId: 'clinic_123'
});

// List documents for this customer
const { documents } = await sdk.listDocuments();

// Get a specific document
const { document } = await sdk.getDocument(documentId);

// Create a signing session
const { session, signingUrl } = await sdk.createSession({
  documentId: 'doc_123',
  signerEmail: 'user@example.com',
  signerName: 'John Doe'
});`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => copyToClipboard(`import { SignatureKitProSDK } from 'signature-kit-pro/sdk';\n\nconst sdk = new SignatureKitProSDK({\n  apiKey: 'sk_...',\n  customerId: 'clinic_123'\n});\n\n// List documents\nconst { documents } = await sdk.listDocuments();`)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Demo;

