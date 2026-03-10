"use client";

import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  LogOut,
  Accessibility,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFontSize, fontSizeLabels, FontSize } from "@/lib/font-size-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { fontSize, setFontSize } = useFontSize();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Loading settings...</p>
      </div>
    )
  }

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!user) {
    return null;
  }

  const displayName =
    user.user_metadata?.name || user.email?.split("@")[0] || "User";
  const userEmail = user.email || "";
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSignOut = async () => {
    router.replace("/");
    signOut()
      .then(() => {
        toast.success("Signed out successfully");
      })
      .catch(() => {
        toast.error("Sign out failed");
      });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-semibold">Profile Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account information and preferences
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Profile Overview */}
          <Card className="bg-gray-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">{displayName}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {userEmail}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Member since {joinDate}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="bg-gray-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground">
                    Professional plan with full access
                  </p>
                </div>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  <Crown className="h-3 w-3 mr-1" />
                  PRO
                </Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Authentication Method</p>
                  <p className="text-sm text-muted-foreground">
                    Google OAuth 2.0
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Secure
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Settings */}
          <Card className="bg-gray-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="h-5 w-5" />
                Accessibility Settings
              </CardTitle>
              <CardDescription>
                Customize your reading experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Text Size</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust the font size for better readability
                  </p>
                </div>
                <Select value={fontSize} onValueChange={(value: FontSize) => setFontSize(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fontSizeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

        </main>
      </div>
      <div className="p-6 flex justify-end">
        <Button
          variant="destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
