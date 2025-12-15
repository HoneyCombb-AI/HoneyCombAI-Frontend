'use client'
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Zod Schema for LinkedIn Credentials
const linkedInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Simple Google Logo SVG component
const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

// Simple LinkedIn Logo SVG component
const LinkedInLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0077b5">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const IntegrationPage: React.FC = () => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectedEmail, setConnectedEmail] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // LinkedIn State
  const [linkedInOpen, setLinkedInOpen] = React.useState(false);
  const [linkedInEmail, setLinkedInEmail] = React.useState("");
  const [linkedInPassword, setLinkedInPassword] = React.useState("");
  const [linkedInLoading, setLinkedInLoading] = React.useState(false);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/gmail/status");
        if (res.ok) {
          const data = await res.json();
          setIsConnected(data.isConnected);
          setConnectedEmail(data.email);
        }
      } catch (error) {
        console.error("Failed to check status", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleLinkedInSave = async () => {
    if (!linkedInEmail || !linkedInPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setLinkedInLoading(true);
    try {
      const res = await fetch("/api/linkedin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkedInEmail, password: linkedInPassword }),
      });

      if (res.ok) {
        toast.success("LinkedIn credentials saved successfully");
        setLinkedInOpen(false);
        setLinkedInEmail("");
        setLinkedInPassword("");
      } else {
        toast.error("Failed to save credentials");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLinkedInLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50">
      <header className="hidden md:flex h-16 items-center gap-2 px-6 border-b bg-white">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">
              Integrations
            </h1>
          </div>
        </div>
      </header>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gmail Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GoogleLogo />
                Gmail
              </CardTitle>
              <CardDescription>
                Sync your emails seamlessly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                  {isConnected
                    ? `Connected as: ${connectedEmail}`
                    : "Connect your Google account to enable email capabilities."}
                </p>
                {isConnected ? (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default"
                    disabled
                  >
                    Context Connected
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      window.location.href = "/api/gmail/connect";
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? "Checking..." : "Connect Gmail"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkedInLogo />
                LinkedIn
              </CardTitle>
              <CardDescription>
                Automate your professional networking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500">
                  Connect your LinkedIn account to enable automated outreach and networking features.
                </p>
                <Dialog open={linkedInOpen} onOpenChange={setLinkedInOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-[#0077b5] hover:bg-[#005885] text-white">
                      Connect LinkedIn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Connect LinkedIn Account</DialogTitle>
                      <DialogDescription>
                        Enter your LinkedIn credentials to enable integration.
                      </DialogDescription>
                    </DialogHeader>

                    <Alert variant="destructive" className="bg-red-50 text-red-900 border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800 font-semibold mb-1">Vital Warning</AlertTitle>
                      <AlertDescription className="text-red-700 text-xs text-justify">
                        You MUST have completed security verification (ID/Persona) on LinkedIn before connecting. Failure to do so may result in LinkedIn restricting access to your account due to automated logins.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="li-email">Email</Label>
                        <Input
                          id="li-email"
                          placeholder="name@example.com"
                          value={linkedInEmail}
                          onChange={(e) => setLinkedInEmail(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="li-password">Password</Label>
                        <Input
                          id="li-password"
                          type="password"
                          placeholder="********"
                          value={linkedInPassword}
                          onChange={(e) => setLinkedInPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleLinkedInSave} disabled={linkedInLoading}>
                        {linkedInLoading ? "Saving..." : "Save Integration"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default IntegrationPage;