import { useState } from "react";
import { useGetDashboardStats, useListWorkOrders, useCreateWorkOrder } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ClipboardList, Clock, CheckCircle2, XCircle, Plus, Building2, MapPin, Tag, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { getPriorityColor, getStatusColor, getStatusLabel } from "./work-orders/list";
import { Loader2 } from "lucide-react";

const createSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Please provide more details"),
  category: z.enum(["electrical", "plumbing", "it", "lab_equipment", "general"]),
  building: z.string().min(1, "Building is required"),
  location: z.string().min(2, "Location details are required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type CreateFormValues = z.infer<typeof createSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useListWorkOrders();

  const canCreate = ['student', 'faculty', 'admin'].includes(user?.role || '');
  const isAdmin = user?.role === 'admin';

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { title: "", description: "", category: "general", building: "", location: "", priority: "medium" },
  });

  const createMutation = useCreateWorkOrder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({ title: "Request Submitted", description: "Your work order has been submitted successfully." });
        setCreateOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create request." });
      }
    }
  });

  const onSubmit = (values: CreateFormValues) => {
    createMutation.mutate({ data: values });
  };

  if (statsLoading || ordersLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
        </div>
        <div className="h-96 bg-muted rounded-2xl"></div>
      </div>
    );
  }

  const chartData = stats?.by_category ? Object.entries(stats.by_category).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value
  })) : [];

  const topRecent = recentOrders?.slice(0, 5) || [];

  const statCards = [
    { title: "Total Requests", value: stats?.total || 0, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-600/10" },
    { title: "Open", value: stats?.open || 0, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-600/10" },
    { title: "In Progress", value: stats?.in_progress || 0, icon: Clock, color: "text-purple-600", bg: "bg-purple-600/10" },
    { title: "Completed", value: stats?.completed || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-600/10" },
    { title: "Rejected", value: (stats as any)?.rejected || 0, icon: XCircle, color: "text-red-600", bg: "bg-red-600/10" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.full_name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-1">Here is the latest overview of campus maintenance requests.</p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl shadow-md hover:-translate-y-0.5 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="rounded-2xl border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-4 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-3xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-2xl border-none shadow-md">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-display">Requests by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-md flex flex-col">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="font-display">Recent Activity</CardTitle>
            <Link href="/work-orders" className="text-sm text-primary hover:underline font-medium">View All</Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <div className="divide-y divide-border/50">
              {topRecent.length === 0 && (
                <div className="p-6 text-center text-muted-foreground">No recent requests</div>
              )}
              {topRecent.map(order => (
                <Link key={order.id} href={`/work-orders/${order.id}`} className="block p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground truncate pr-2 flex-1">{order.title}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2
                      ${order.status === 'open' ? 'bg-amber-100 text-amber-800' :
                        order.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className={`${getPriorityColor(order.priority)} capitalize border-transparent text-[10px] h-5`}>
                      {order.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(order.created_at))} ago</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Work Order Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) form.reset(); }}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display font-bold">New Maintenance Request</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Issue Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Leaking pipe in 2nd floor restroom" className="h-11 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className={`grid grid-cols-1 gap-4 ${isAdmin ? "sm:grid-cols-2" : ""}`}>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-muted-foreground" /> Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="electrical">Electrical</SelectItem>
                          <SelectItem value="plumbing">Plumbing</SelectItem>
                          <SelectItem value="it">IT / Network</SelectItem>
                          <SelectItem value="lab_equipment">Lab Equipment</SelectItem>
                          <SelectItem value="general">General Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-muted-foreground" /> Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select priority" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low - Routine</SelectItem>
                            <SelectItem value="medium">Medium - Standard</SelectItem>
                            <SelectItem value="high">High - Impacting work</SelectItem>
                            <SelectItem value="urgent">Urgent - Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground" /> Building</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Science Complex" className="h-11 rounded-lg bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Specific Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Room 402, North Wall" className="h-11 rounded-lg bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the issue in detail, including when it started..."
                        className="min-h-[100px] rounded-xl resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
                <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); form.reset(); }} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="rounded-xl px-6">
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
