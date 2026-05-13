"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import type { IntegrationStatuses } from "@/lib/types/integration";
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
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(
    null
  );
  // Outlook State
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [outlookConnectedEmail, setOutlookConnectedEmail] = useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [gmailConfirming, setGmailConfirming] = useState(false);
  const [outlookConfirming, setOutlookConfirming] = useState(false);

  // LinkedIn State
  const [linkedInOpen, setLinkedInOpen] = useState(false);
  const [linkedInEmail, setLinkedInEmail] = useState("");
  const [linkedInPassword, setLinkedInPassword] = useState("");
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  // Controls whether the LinkedIn password field is masked ("password") or visible ("text").
  // UX + safety: defaults to masked and resets whenever the dialog closes or save completes.
  const [isLinkedInPasswordVisible, setIsLinkedInPasswordVisible] =
    useState(false);

  // LinkedIn Status State
  const [liStatus, setLiStatus] = useState<
    "pending" | "connected" | "failed" | null
  >(null);
  const [liConnectedEmail, setLiConnectedEmail] = useState<string | null>(
    null
  );
  const [liError, setLiError] = useState<string | null>(null);
  const [liFailedHover, setLiFailedHover] = useState(false);

  const checkStatuses = async () => {
    try {
      const res = await fetch("/api/integration/status");
      if (res.ok) {
        const data: IntegrationStatuses = await res.json();

        // Gmail
        setIsConnected(data.gmail.isConnected);
        setConnectedEmail(data.gmail.email);

        // LinkedIn
        setLiStatus(data.linkedin.status);
        setLiConnectedEmail(data.linkedin.email);
        setLiError(data.linkedin.error);

        // Outlook
        setIsOutlookConnected(data.outlook.isConnected);
        setOutlookConnectedEmail(data.outlook.email);
      } else {
        const json = await res.json().catch(() => ({}));
        setPageError(json.error || 'Failed to load integration status');
      }
    } catch (error) {
      console.error("Failed to check statuses", error);
      setPageError('Failed to load integration status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGmailDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Gmail account disconnected successfully");
        setIsConnected(false);
        setConnectedEmail(null);
      } else {
        toast.error("Failed to disconnect Gmail account");
      }
    } catch (error) {
      console.error("Error disconnecting Gmail:", error);
      toast.error("An error occurred while disconnecting");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleOutlookDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/outlook/disconnect", {
        method: "POST",
      });

      if (res.ok) {
        toast.success("Outlook account disconnected successfully");
        setIsOutlookConnected(false);
        setOutlookConnectedEmail(null);
      } else {
        toast.error("Failed to disconnect Outlook account");
      }
    } catch (error) {
      console.error("Error disconnecting Outlook:", error);
      toast.error("An error occurred while disconnecting");
    } finally {
      setIsDisconnecting(false);
    }
  };

  React.useEffect(() => {
    checkStatuses();
  }, []);

  const searchParams = useSearchParams();

  // Handle error/success states from OAuth callback redirects
  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (error) {
      switch (error) {
        case "connection_failed":
          toast.error("Failed to connect account. Please try again.");
          break;
        case "outlook_auth_failed":
        case "token_exchange_failed":
        case "profile_fetch_failed":
          toast.error("Authentication failed. Please try again.");
          break;
        case "unauthorized":
          toast.error("You must be logged in to connect accounts.");
          break;
        case "db_error":
        case "server_error":
          toast.error("A server error occurred. Please try again later.");
          break;
        default:
          toast.error("An error occurred during connection.");
      }
      // Clean up URL
      window.history.replaceState({}, "", "/integration");
    }

    if (success === "outlook_connected") {
      toast.success("Outlook account connected successfully!");
      window.history.replaceState({}, "", "/integration");
    }

    if (success === "gmail_connected") {
      toast.success("Gmail account connected successfully!");
      window.history.replaceState({}, "", "/integration");
    }
  }, [searchParams]);

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
      {pageError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
          <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-11.25a.75.75 0 011.5 0v4.5a.75.75 0 01-1.5 0v-4.5zm.75 7.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          <p className="text-base font-medium text-red-500">Something went wrong</p>
          <p className="text-sm text-muted-foreground">{pageError}</p>
        </div>
      ) : (
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
                  <div className="flex flex-col gap-2">
                    {gmailConfirming ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
                        <p className="text-xs text-red-700">Are you sure you want to disconnect? This will remove your account and you will no longer be able to send emails.</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => { setGmailConfirming(false); handleGmailDisconnect(); }}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, disconnect"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setGmailConfirming(false)}
                            disabled={isDisconnecting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-green-700 hover:bg-green-800 text-white cursor-default opacity-100 disabled:opacity-100">
                          <Check className="mr-2 h-4 w-4" />
                          Connected
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 transition-all duration-200"
                          onClick={() => setGmailConfirming(true)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-100 text-gray-700 border-gray-200 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                            onClick={() => {
                              window.location.href = "/api/gmail/connect";
                            }}
                            disabled={isLoading || isOutlookConnected}
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
                        </div>
                      </TooltipTrigger>
                      {isOutlookConnected && (
                        <TooltipContent>
                          <p>Disconnect Outlook first before connecting Gmail.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
                  <div className="flex flex-col gap-2">
                    {outlookConfirming ? (
                      <div className="rounded-md border border-red-200 bg-red-50 p-3 flex flex-col gap-2">
                        <p className="text-xs text-red-700">Are you sure you want to disconnect? This will remove your account and you will no longer be able to send emails.</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => { setOutlookConfirming(false); handleOutlookDisconnect(); }}
                            disabled={isDisconnecting}
                          >
                            {isDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, disconnect"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOutlookConfirming(false)}
                            disabled={isDisconnecting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-green-700 hover:bg-green-800 text-white cursor-default opacity-100 disabled:opacity-100">
                          <Check className="mr-2 h-4 w-4" />
                          Connected
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-white hover:bg-red-50 text-red-600 border-red-200 hover:border-red-300 transition-all duration-200"
                          onClick={() => setOutlookConfirming(true)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-full">
                          <Button
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-100 text-[#0078D4] border-gray-200 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
                            onClick={() => {
                              window.location.href = "/api/outlook/connect";
                            }}
                            disabled={isLoading || isConnected}
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
                        </div>
                      </TooltipTrigger>
                      {isConnected && (
                        <TooltipContent>
                          <p>Disconnect Gmail first before connecting Outlook.</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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
      )}
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
