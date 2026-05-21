"use client";

import { useAuth } from "@/lib/auth-context";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import type { UpdatePasswordRequest } from "@/types/user";
import { useFontSize, fontSizeLabels, FontSize } from "@/lib/font-size-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const { fontSize, setFontSize } = useFontSize();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loading />
        <p className="text-sm text-muted-foreground mt-4">Loading settings...</p>
      </div>
    );
  }

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
    toast.success("Signed out successfully");
    await signOut();
  };

  const handlePasswordUpdate = async () => {
    if (pwLoading) return;
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPwLoading(true);
    try {
      await axios.post<unknown, unknown, UpdatePasswordRequest>("/api/user/update-password", {
        password: newPassword,
        confirmPassword,
      });
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
      setDialogOpen(false);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.error
          : "Failed to update password";
      toast.error(message || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-background">
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
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
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

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Update your account password
                </p>
              </div>
              <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) {
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowNew(false);
                    setShowConfirm(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <KeyRound className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter a new password of at least 6 characters.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNew ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((v) => !v)}
                          aria-label={showNew ? "Hide new password" : "Show new password"}
                          aria-pressed={showNew}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNew ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repeat new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handlePasswordUpdate();
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                          aria-pressed={showConfirm}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        disabled={pwLoading}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handlePasswordUpdate} disabled={pwLoading}>
                        {pwLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
              <Select
                value={fontSize}
                onValueChange={(value: FontSize) => setFontSize(value)}
              >
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

        <div className="p-6 flex justify-end">
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
}
