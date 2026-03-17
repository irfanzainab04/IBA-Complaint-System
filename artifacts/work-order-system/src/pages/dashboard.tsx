import { useGetDashboardStats, useListWorkOrders } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ClipboardList, Clock, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentOrders, isLoading: ordersLoading } = useListWorkOrders();

  if (statsLoading || ordersLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-64"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    { title: "Open/Assigned", value: (stats?.open || 0) + (stats?.assigned || 0), icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-600/10" },
    { title: "In Progress", value: stats?.in_progress || 0, icon: Clock, color: "text-purple-600", bg: "bg-purple-600/10" },
    { title: "Completed", value: stats?.complete || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-600/10" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Welcome back, {user?.full_name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">Here is the latest overview of campus maintenance requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-foreground truncate pr-4">{order.title}</h4>
                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full whitespace-nowrap
                      ${order.status === 'open' ? 'bg-amber-100 text-amber-800' : 
                        order.status === 'in_progress' ? 'bg-purple-100 text-purple-800' : 
                        order.status === 'complete' ? 'bg-emerald-100 text-emerald-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground gap-2 mt-2">
                    <span className="truncate max-w-[150px]">{order.location}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(order.created_at))} ago</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
