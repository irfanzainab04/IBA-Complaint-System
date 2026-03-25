import { useState } from "react";
import { Link } from "wouter";
import { useListWorkOrders, type WorkOrder } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, FilterX, Clock, MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export function getStatusColor(status: string) {
  switch (status) {
    case 'open': return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
    case 'in_progress': return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200";
    case 'completed': return "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200";
    case 'rejected': return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'open': return 'Open';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'rejected': return 'Rejected';
    default: return status;
  }
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent': return "text-red-600 bg-red-50";
    case 'high': return "text-orange-600 bg-orange-50";
    case 'medium': return "text-blue-600 bg-blue-50";
    case 'low': return "text-gray-600 bg-gray-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export default function WorkOrdersList() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: workOrders, isLoading } = useListWorkOrders(
    {
      ...(statusFilter !== 'all' && { status: statusFilter as any }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter as any }),
    }
  );

  const filteredOrders = workOrders?.filter(wo =>
    wo.title.toLowerCase().includes(search.toLowerCase()) ||
    wo.location.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const canCreate = ['student', 'faculty', 'admin'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Work Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track campus maintenance requests</p>
        </div>
        {canCreate && (
          <Button asChild className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform">
            <Link href="/work-orders/new">
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Link>
          </Button>
        )}
      </div>

      <Card className="p-4 rounded-2xl shadow-sm border-border/50 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or location..."
            className="pl-9 h-11 rounded-xl bg-muted/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-muted/50">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px] h-11 rounded-xl bg-muted/50">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || priorityFilter !== 'all' || search !== '') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSearch(''); }}
              title="Clear filters"
            >
              <FilterX className="w-5 h-5" />
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No work orders found</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">Try adjusting your filters or search query to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.map(order => (
            <Link key={order.id} href={`/work-orders/${order.id}`}>
              <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-muted-foreground">#{order.id.slice(0, 8)}</span>
                      <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize`}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <Badge variant="secondary" className={`${getPriorityColor(order.priority)} capitalize border-transparent`}>
                        {order.priority}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {order.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{order.building ? `${order.building}, ` : ''}{order.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 capitalize">
                        <Tag className="w-4 h-4" />
                        <span>{order.category.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center">
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
