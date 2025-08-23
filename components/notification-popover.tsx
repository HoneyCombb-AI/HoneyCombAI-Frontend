import { Bell, BellOff } from "lucide-react";

export function NotificationPopoverContent() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <h4 className="font-semibold">Notifications</h4>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No new notifications available
        </p>
      </div>
    </div>
  );
}