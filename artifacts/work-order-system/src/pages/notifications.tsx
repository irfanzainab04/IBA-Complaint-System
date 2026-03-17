import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, CircleAlert, CheckCircle2, Wrench } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications, isLoading } = useListNotifications();

  const markReadMut = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_update': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'assignment': return <Wrench className="w-5 h-5 text-blue-500" />;
      case 'comment': return <Bell className="w-5 h-5 text-primary" />;
      default: return <CircleAlert className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-1">Updates on your work orders and assignments</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : notifications?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">All caught up</h3>
          <p className="text-muted-foreground mt-1">You have no notifications right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notifications?.map(notif => (
            <Card key={notif.id} className={`rounded-2xl shadow-sm border-border/50 overflow-hidden transition-colors ${!notif.is_read ? 'bg-primary/5' : 'bg-white'}`}>
              <div className="p-5 flex items-start gap-4">
                <div className={`p-3 rounded-full mt-1 ${!notif.is_read ? 'bg-white shadow-sm' : 'bg-muted/50'}`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{notif.type.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDistanceToNow(new Date(notif.created_at))} ago</span>
                  </div>
                  <p className={`text-base ${!notif.is_read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>
                    {notif.message}
                  </p>
                  {notif.work_order_id && (
                    <div className="mt-3">
                      <Button variant="link" className="p-0 h-auto text-primary" asChild>
                        <Link href={`/work-orders/${notif.work_order_id}`}>View Work Order</Link>
                      </Button>
                    </div>
                  )}
                </div>
                {!notif.is_read && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    title="Mark as read"
                    className="mt-1 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
                    onClick={() => markReadMut.mutate({ id: notif.id })}
                    disabled={markReadMut.isPending}
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
