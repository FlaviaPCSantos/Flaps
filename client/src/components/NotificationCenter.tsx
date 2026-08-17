import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const { data: notifications } = trpc.notifications.list.useQuery(
    { limit: 10 },
    { enabled: !!user }
  );

  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(
    undefined,
    { enabled: !!user }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation();
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation();

  const handleMarkAsRead = async (notificationId: number) => {
    await markAsReadMutation.mutateAsync({ notificationId });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadMutation.mutateAsync();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition"
      >
        <Bell size={20} />
        {unreadCount && unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notificações</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X size={16} />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b cursor-pointer hover:bg-muted transition ${
                      !notification.isRead ? "bg-accent/5" : ""
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p>Nenhuma notificação</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {unreadCount && unreadCount > 0 && (
            <div className="p-3 border-t">
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Marcar todas como lidas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
