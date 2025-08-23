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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  User,
  Mail,
  Calendar,
  Shield,
  Crown,
  LogOut,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )}

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

  const handleEdit = () => {
    setEditForm({
      name: displayName,
      email: userEmail,
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    // TODO: Implement profile update functionality
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({ name: "", email: "" });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="flex h-screen bg-background">
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

              <Separator />

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Display Name
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {displayName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">
                        Email Address
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {userEmail}
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleEdit} variant="outline">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Display Name</Label>
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed directly
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
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

          {/* Account Actions */}
          <Card className="bg-gray-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Account Actions
              </CardTitle>
              <CardDescription>
                Manage your account security and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 space-x-4">
                <Button variant="outline" className="justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Security Settings
                </Button>
                <Button variant="outline" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </Button>
              </div>

              <Separator />

              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="justify-start"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
