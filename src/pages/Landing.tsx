import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, FileText, Shield, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-foreground">Signature Kit Pro</div>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
          Digital Signatures
          <br />
          Made Simple
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Create, send, and manage documents with electronic signatures. 
          Built for developers, designed for everyone.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="text-lg px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Try Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Fast Integration</h3>
            <p className="text-muted-foreground">
              Simple API that gets you up and running in minutes. 
              Built for developers who value their time.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">Secure & Compliant</h3>
            <p className="text-muted-foreground">
              Enterprise-grade security with encryption at rest and in transit. 
              SOC 2 compliant infrastructure.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <FileText className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">PDF & Rich Text</h3>
            <p className="text-muted-foreground">
              Support for PDF documents and rich text templates. 
              Flexible document builder with drag-and-drop.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Simple Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2 text-foreground">Free</h3>
            <div className="text-4xl font-bold mb-4 text-foreground">$0<span className="text-lg text-muted-foreground">/month</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>10 documents/month</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Basic templates</span>
              </li>
            </ul>
            <Link to="/login">
              <Button className="w-full">Get Started</Button>
            </Link>
          </div>
          <div className="p-8 rounded-lg border-2 border-primary bg-card relative">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-sm font-semibold">
              Popular
            </div>
            <h3 className="text-2xl font-bold mb-2 text-foreground">Pro</h3>
            <div className="text-4xl font-bold mb-4 text-foreground">$29<span className="text-lg text-muted-foreground">/month</span></div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Unlimited documents</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>API access</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Webhooks</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Priority support</span>
              </li>
            </ul>
            <Link to="/login">
              <Button className="w-full">Upgrade to Pro</Button>
            </Link>
          </div>
          <div className="p-8 rounded-lg border bg-card">
            <h3 className="text-2xl font-bold mb-2 text-foreground">Enterprise</h3>
            <div className="text-4xl font-bold mb-4 text-foreground">Custom</div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Custom integrations</span>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Link to="/login">
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 Signature Kit Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

