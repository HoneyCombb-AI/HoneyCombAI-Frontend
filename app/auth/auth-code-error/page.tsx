"use client";

import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const description = searchParams.get("description");

  // Define error-specific messages
  const getErrorDetails = (errorCode: string | null) => {
    switch (errorCode) {
      case "access_denied":
        return {
          title: "Authentication Cancelled",
          message: "You cancelled the Google sign-in process.",
          suggestions: [
            "Try signing in again",
            "Make sure to allow access when prompted",
          ],
        };
      case "missing_code":
        return {
          title: "Authorization Code Missing",
          message: "The authentication process did not complete properly.",
          suggestions: [
            "Clear browser cookies and try again",
            "Try using a different browser",
            "Check if popup blockers are enabled",
          ],
        };
      case "exchange_failed":
        return {
          title: "Authentication Exchange Failed",
          message: "Unable to verify your Google account.",
          suggestions: [
            "Check your internet connection",
            "Try again in a few minutes",
            "Contact support if this persists",
          ],
        };
      case "no_session":
        return {
          title: "Session Creation Failed",
          message:
            "Your account was verified but we could not create a session.",
          suggestions: [
            "Clear browser cookies",
            "Try signing in again",
            "Enable third-party cookies",
          ],
        };
      default:
        return {
          title: "Authentication Error",
          message: "There was a problem signing you in to Accountify.",
          suggestions: [
            "Cancelled Google sign-in",
            "Network connectivity issues",
            "Temporary service unavailability",
          ],
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">{errorDetails.title}</CardTitle>
            <CardDescription>{errorDetails.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {description && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Technical Details:</strong> {description}
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div>
                  <strong>This could be due to:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {errorDetails.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                asChild
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Link href="/login">Try Again</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Need help?{" "}
              <a
                href="mailto:support@accountify.com"
                className="underline underline-offset-4"
              >
                Contact Support
              </a>
            </div>

            {process.env.NODE_ENV === "development" && (
              <Alert className="mt-4">
                <AlertDescription>
                  <strong>Debug Info:</strong>
                  <pre className="mt-2 text-xs">
                    Error: {error || "none"}
                    {description && `\nDescription: ${description}`}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
