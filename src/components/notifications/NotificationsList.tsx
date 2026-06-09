import React from "react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "../../hooks/use-notifications";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Bell, BellDot, Check, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function NotificationsList() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const handleMarkRead = (id: string, isRead: boolean) => {
    if (!isRead) {
      markReadMutation.mutate(id);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading notifications...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Stay updated on your deals and payments.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllReadMutation.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <Bell className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p>You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-colors ${notification.is_read ? 'bg-white' : 'bg-blue-50/30 border-blue-100'}`}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className="mt-1">
                  {notification.is_read ? (
                    <Bell className="h-5 w-5 text-gray-400" />
                  ) : (
                    <BellDot className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-900' : 'text-blue-900'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm ${notification.is_read ? 'text-gray-500' : 'text-blue-800'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 shrink-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    onClick={() => handleMarkRead(notification.id, notification.is_read)}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
