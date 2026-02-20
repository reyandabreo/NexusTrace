"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Save,
  LogOut,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { useAuditLogger } from "@/store/auditStore";
import { toast } from "sonner";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { logAction } = useAuditLogger();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Profile state
  const [fullName, setFullName] = useState(user?.username || "");
  const [email] = useState(user?.email || "");
  const role = "Investigator"; // From user object or default
  
  // Notification state
  const [notifications, setNotifications] = useState({
    highRiskAlerts: true,
    evidenceUpload: true,
    aiResponse: true,
  });
  
  // Security state
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const handleSaveProfile = () => {
    logAction("UPDATE_SETTINGS", "Profile Information", {
      status: "success",
      details: "Updated profile information",
    });
    toast.success("Profile updated", {
      description: "Your profile information has been saved",
    });
  };
  
  const handleSaveNotifications = () => {
    logAction("UPDATE_SETTINGS", "Notification Preferences", {
      status: "success",
      details: "Updated notification preferences",
    });
    toast.success("Preferences saved", {
      description: "Your notification preferences have been updated",
    });
  };
  
  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords don't match", {
        description: "New password and confirmation must match",
      });
      return;
    }
    
    if (passwords.new.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters",
      });
      return;
    }
    
    logAction("UPDATE_SETTINGS", "Password Change", {
      status: "success",
      details: "Changed account password",
    });
    
    toast.success("Password updated", {
      description: "Your password has been changed successfully",
    });
    
    setPasswords({ current: "", new: "", confirm: "" });
  };
  
  const handleLogoutAllSessions = () => {
    logAction("LOGOUT", "All Sessions", {
      status: "success",
      details: "Logged out all active sessions",
    });
    toast.success("Sessions ended", {
      description: "All active sessions have been logged out",
    });
  };
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    logAction("UPDATE_SETTINGS", "Theme Preference", {
      status: "success",
      details: `Changed theme to ${newTheme}`,
    });
    toast.success("Theme updated", {
      description: `Theme changed to ${newTheme}`,
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background/50 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account preferences and security
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-card/50 border border-border p-1">
            <TabsTrigger 
              value="profile" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger 
              value="theme" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Profile Information
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Basic account management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-border bg-background text-foreground"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email <span className="text-xs text-muted-foreground">(Read-only)</span>
                    </Label>
                    <Input
                      id="email"
                      value={email}
                      disabled
                      className="border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-foreground">
                      Role <span className="text-xs text-muted-foreground">(Read-only)</span>
                    </Label>
                    <Input
                      id="role"
                      value={role}
                      disabled
                      className="border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
                
                <Separator className="bg-border" />
                
                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Keep minimal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="highRiskAlerts" className="text-sm font-medium text-foreground">
                        High-risk alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive notifications for high-risk events
                      </p>
                    </div>
                    <Switch
                      id="highRiskAlerts"
                      checked={notifications.highRiskAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, highRiskAlerts: checked })
                      }
                    />
                  </div>
                  
                  <Separator className="bg-border" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="evidenceUpload" className="text-sm font-medium text-foreground">
                        Evidence upload confirmations
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Get notified when evidence is uploaded
                      </p>
                    </div>
                    <Switch
                      id="evidenceUpload"
                      checked={notifications.evidenceUpload}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, evidenceUpload: checked })
                      }
                    />
                  </div>
                  
                  <Separator className="bg-border" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="aiResponse" className="text-sm font-medium text-foreground">
                        AI response ready notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Alert when AI analysis is complete
                      </p>
                    </div>
                    <Switch
                      id="aiResponse"
                      checked={notifications.aiResponse}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, aiResponse: checked })
                      }
                    />
                  </div>
                </div>
                
                <Separator className="bg-border" />
                
                <Button onClick={handleSaveNotifications} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Security Settings
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Focus only on essentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Password Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="max-w-md border-border bg-background text-foreground"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      className="max-w-md border-border bg-background text-foreground"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="max-w-md border-border bg-background text-foreground"
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <Button onClick={handleChangePassword} className="gap-2">
                    <Shield className="h-4 w-4" />
                    Update Password
                  </Button>
                </div>
                
                <Separator className="bg-border" />
                
                {/* Active Sessions Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Active Sessions</h3>
                  
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Current Device – Chrome</p>
                        <p className="text-xs text-muted-foreground">Active now</p>
                      </div>
                    </div>
                    <div className="flex h-2 w-2 rounded-full bg-green-500" />
                  </div>
                  
                  <Button 
                    onClick={handleLogoutAllSessions} 
                    variant="outline" 
                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout All Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Theme Tab */}
          <TabsContent value="theme">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Theme Preferences
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Modern touch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div
                    onClick={() => handleThemeChange("light")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      theme === "light" ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {theme === "light" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <Sun className="h-5 w-5 text-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Light</p>
                      <p className="text-xs text-muted-foreground">Bright and clean</p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => handleThemeChange("dark")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      theme === "dark" ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {theme === "dark" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <Moon className="h-5 w-5 text-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Dark</p>
                      <p className="text-xs text-muted-foreground">Easy on the eyes</p>
                    </div>
                  </div>
                  
                  <div
                    onClick={() => handleThemeChange("system")}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      theme === "system" ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {theme === "system" && (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <Monitor className="h-5 w-5 text-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">System Default</p>
                      <p className="text-xs text-muted-foreground">Match your OS settings</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Theme changes are applied instantly across the entire application.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
