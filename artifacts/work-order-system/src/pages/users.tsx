import { useState } from "react";
import { useListUsers } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const roleColors: Record<string, string> = {
  student: "bg-blue-100 text-blue-800",
  faculty: "bg-purple-100 text-purple-800",
  admin: "bg-primary/10 text-primary",
  technician: "bg-amber-100 text-amber-800",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: users, isLoading } = useListUsers({} as any);

  const filteredUsers = (users || []).filter(u =>
    (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingAdmins = filteredUsers.filter((u: any) => u.role === 'admin' && u.is_approved === false);
  const approvedUsers = filteredUsers.filter((u: any) => !(u.role === 'admin' && u.is_approved === false));

  const handleApprove = async (userId: string, userName: string) => {
    setApprovingId(userId);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast({ title: "Account Approved", description: `${userName}'s administrator account has been approved.` });
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      } else {
        const err = await response.json();
        toast({ variant: "destructive", title: "Error", description: err.error || "Failed to approve account." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to approve account." });
    }
    setApprovingId(null);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">Manage all registered users and approve pending administrator accounts.</p>
      </div>

      {/* Pending Admin Approvals */}
      {!isLoading && pendingAdmins.length > 0 && (
        <Card className="rounded-2xl border-amber-200 bg-amber-50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Clock className="w-5 h-5" />
              Pending Administrator Approvals ({pendingAdmins.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAdmins.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-amber-200">
                <div>
                  <p className="font-semibold text-foreground">{u.full_name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  {u.created_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">Registered {format(new Date(u.created_at), 'MMM d, yyyy')}</p>
                  )}
                </div>
                <Button
                  onClick={() => handleApprove(u.id, u.full_name)}
                  disabled={approvingId === u.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  {approvingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users by name, email, or role..."
          className="pl-9 h-11 rounded-xl bg-white border-border/50"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="flex items-center gap-2 font-display">
            <Users className="w-5 h-5" />
            All Users {!isLoading && <span className="text-muted-foreground font-normal text-sm">({approvedUsers.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : approvedUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users found.</div>
          ) : (
            <div className="divide-y divide-border/50">
              {approvedUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <p className="font-semibold text-foreground">{u.full_name}</p>
                      <Badge className={`${roleColors[u.role] || 'bg-gray-100 text-gray-800'} capitalize border-transparent text-xs`}>
                        {u.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4 hidden sm:block">
                    {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
