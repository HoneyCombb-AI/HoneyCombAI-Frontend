"use client";
import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  AlertTriangle,
  Loader2,
  Check,
  RotateCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Zod Schema for LinkedIn Credentials
const linkedInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Simple Google Logo SVG component
const GoogleLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="24"
    viewBox="0 0 24 24"
    width="24"
  >
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
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="#0077b5"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

// Simple Outlook Logo SVG component
const OutlookLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
  >
    <path
      fill="#0078D4"
      d="M1 18.2l7.1 5.2L14.6 18H23V6h-8.4L8.1.6 1 5.8v12.4z"
    />
    <path
      fill="#26A1EB"
      d="M23 18V6h-9l-2.4 2.8L9 6H1v12h8l2.5-3 2.5 3h9z"
    />
    <path
      fill="#E6F3FB"
      d="M2.5 16.5l5.5-3.5 1-2.5-2-4-5.5 3v7z"
    />
    <path
      fill="#4BC3F3"
      d="M2.5 16.5V9.5L8 6l6 3.5v7l-5.5 4-6-4z"
    />
    <path fill="white" d="M4.6 13.9l.7-4.5 3.5 1.3L4.6 13.9z" />
  </svg>
);

const IntegrationContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectedEmail, setConnectedEmail] = React.useState<string | null>(
    null
  );
  // Outlook State
  const [isOutlookConnected, setIsOutlookConnected] = React.useState(false);
  const [outlookConnectedEmail, setOutlookConnectedEmail] = React.useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = React.useState(true);

  // LinkedIn State
  const [linkedInOpen, setLinkedInOpen] = React.useState(false);
  const [linkedInEmail, setLinkedInEmail] = React.useState("");
  const [linkedInPassword, setLinkedInPassword] = React.useState("");
  const [linkedInLoading, setLinkedInLoading] = React.useState(false);
  // Controls whether the LinkedIn password field is masked ("password") or visible ("text").
  // UX + safety: defaults to masked and resets whenever the dialog closes or save completes.
  const [isLinkedInPasswordVisible, setIsLinkedInPasswordVisible] =
    React.useState(false);

  // LinkedIn Status State
  const [liStatus, setLiStatus] = React.useState<
    "pending" | "connected" | "failed" | null
  >(null);
  const [liConnectedEmail, setLiConnectedEmail] = React.useState<string | null>(
    null
  );
  const [liError, setLiError] = React.useState<string | null>(null);
  const [liFailedHover, setLiFailedHover] = React.useState(false);

  const checkStatuses = async () => {
    try {
      // Gmail Check
      const gmailRes = await fetch("/api/gmail/status");
      if (gmailRes.ok) {
        const data = await gmailRes.json();
        setIsConnected(data.isConnected);
        setConnectedEmail(data.email);
      }

      // LinkedIn Check
      const liRes = await fetch("/api/linkedin/status");
      if (liRes.ok) {
        const data = await liRes.json();
        setLiStatus(data.status);
        setLiConnectedEmail(data.email);
        setLiConnectedEmail(data.email);
        setLiError(data.error);
      }

      // Outlook Check
      const outlookRes = await fetch("/api/outlook/status");
      if (outlookRes.ok) {
        const data = await outlookRes.json();
        setIsOutlookConnected(data.isConnected);
        setOutlookConnectedEmail(data.email);
      }
    } catch (error) {
      console.error("Failed to check status", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    checkStatuses();
  }, []);

  const handleLinkedInSave = async () => {
    // Validate with Zod
    const result = linkedInSchema.safeParse({
      email: linkedInEmail,
      password: linkedInPassword,
    });

    if (!result.success) {
      // Show the first error message
      const firstError = result.error.errors[0]?.message || "Invalid input";
      toast.error(firstError);
      return;
    }

    setLinkedInLoading(true);
    try {
      const res = await fetch("/api/linkedin/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: linkedInEmail,
          password: linkedInPassword,
        }),
      });

      if (res.ok) {
        toast.success("LinkedIn credentials saved successfully");
        setLinkedInOpen(false);
        setIsLinkedInPasswordVisible(false);
        setLinkedInEmail("");
        setLinkedInPassword("");
        // Refresh status
        checkStatuses();
      } else {
        toast.error("Failed to save credentials");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLinkedInLoading(false);
    }
  };

  const getLinkedInButton = () => {
    if (isLoading) {
      return (
        <Button
          variant="outline"
          className="w-full bg-white text-gray-500 border-gray-200 cursor-default"
          disabled
        >
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
          Checking...
        </Button>
      );
    }

    if (liStatus === "connected") {
      return (
        <Button className="w-full bg-green-700 hover:bg-green-800 text-white cursor-default opacity-100 disabled:opacity-100">
          <Check className="mr-2 h-4 w-4" />
          Connected
        </Button>
      );
    }
    if (liStatus === "pending") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  variant="outline"
                  className="w-full bg-white text-gray-500 border-gray-200 cursor-default"
                >
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
                  Connecting...
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-center">
                Connection might take a while. Please approve any login requests
                on your LinkedIn mobile app if prompted.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    if (liStatus === "failed") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full">
                <DialogTrigger asChild>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                    onMouseEnter={() => setLiFailedHover(true)}
                    onMouseLeave={() => setLiFailedHover(false)}
                  >
                    {liFailedHover ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Retry
                      </>
                    ) : (
                      "Connection Failed"
                    )}
                  </Button>
                </DialogTrigger>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Error: {liError || "Unknown error occurred"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <DialogTrigger asChild>
        <Button className="w-full bg-[#0077b5] hover:bg-[#005885] text-white transition-all duration-200 cursor-pointer">
          Connect LinkedIn
        </Button>
      </DialogTrigger>
    );
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
          <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GoogleLogo />
                Gmail
              </CardTitle>
              <CardDescription>Sync your emails seamlessly.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex flex-col flex-1 justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {isConnected
                    ? `Connected as: ${connectedEmail}`
                    : "Connect your Google account to enable email capabilities."}
                </p>
                {isConnected ? (
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white cursor-default opacity-100 disabled:opacity-100">
                    <Check className="mr-2 h-4 w-4" />
                    Connected
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-gray-700 border-gray-200 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      window.location.href = "/api/gmail/connect";
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <GoogleLogo />
                        <span className="ml-2">Connect Gmail</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>

          </Card>

          {/* Outlook Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <OutlookLogo />
                Outlook
              </CardTitle>
              <CardDescription>
                Sync your Microsoft Outlook emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex flex-col flex-1 justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {isOutlookConnected
                    ? `Connected as: ${outlookConnectedEmail}`
                    : "Connect your Outlook account to enable email capabilities."}
                </p>
                {isOutlookConnected ? (
                  <Button className="w-full bg-green-700 hover:bg-green-800 text-white cursor-default opacity-100 disabled:opacity-100">
                    <Check className="mr-2 h-4 w-4" />
                    Connected
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-[#0078D4] border-gray-200 transition-all duration-200 cursor-pointer"
                    onClick={() => {
                      window.location.href = "/api/outlook/connect";
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <OutlookLogo />
                        <span className="ml-2">Connect Outlook</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LinkedIn Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkedInLogo />
                LinkedIn
              </CardTitle>
              <CardDescription>
                Automate your professional networking.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex flex-col flex-1 justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {liStatus && liConnectedEmail
                    ? `Account: ${liConnectedEmail}`
                    : "Connect your LinkedIn account to enable automated outreach and networking features."}
                </p>
                <Dialog
                  open={linkedInOpen}
                  onOpenChange={(open) => {
                    setLinkedInOpen(open);
                    // Reset visibility whenever the dialog closes so the next open starts masked.
                    if (!open) setIsLinkedInPasswordVisible(false);
                  }}
                >
                  {getLinkedInButton()}
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Connect LinkedIn Account</DialogTitle>
                      <DialogDescription>
                        Enter your LinkedIn credentials to enable integration.
                      </DialogDescription>
                    </DialogHeader>

                    <Alert
                      variant="destructive"
                      className="bg-red-50 text-red-900 border-red-200"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800 font-semibold mb-1">
                        Vital Warning
                      </AlertTitle>
                      <AlertDescription className="text-red-700 text-sm font-medium text-justify">
                        You MUST have completed security verification
                        (ID/Persona) on LinkedIn before connecting. Failure to
                        do so may result in LinkedIn restricting access due to
                        automated logins.
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
                        {/* Password field with a standard "show/hide" toggle to reduce typing errors. */}
                        <div className="relative">
                          <Input
                            id="li-password"
                            type={
                              isLinkedInPasswordVisible ? "text" : "password"
                            }
                            placeholder="********"
                            value={linkedInPassword}
                            onChange={(e) =>
                              setLinkedInPassword(e.target.value)
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            aria-label={
                              isLinkedInPasswordVisible
                                ? "Hide password"
                                : "Show password"
                            }
                            aria-pressed={isLinkedInPasswordVisible}
                            onClick={() =>
                              setIsLinkedInPasswordVisible(
                                (current) => !current
                              )
                            }
                          >
                            {isLinkedInPasswordVisible ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleLinkedInSave}
                        disabled={linkedInLoading}
                      >
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
    </div >
  );
};

// Wrap in Suspense because useSearchParams causes hydration errors if not wrapped
const IntegrationPage = () => {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <IntegrationContent />
    </Suspense>
  );
};

export default IntegrationPage;
