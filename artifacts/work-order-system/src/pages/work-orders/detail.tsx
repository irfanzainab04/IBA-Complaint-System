import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWorkOrder, useGetWorkOrderComments, useAddComment,
  useRejectWorkOrder, useUpdateWorkOrderStatus
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getStatusColor, getPriorityColor, getStatusLabel } from "./list";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, MapPin, Building, Tag, Calendar, User as UserIcon, MessageSquare, Send, CheckCircle, XCircle, Wrench, AlertCircle } from "lucide-react";

export default function WorkOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [techName, setTechName] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: order, isLoading: isOrderLoading } = useGetWorkOrder(id);
  const { data: comments, isLoading: isCommentsLoading } = useGetWorkOrderComments(id);

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/work-orders", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  const addComment = useAddComment({
    mutation: {
      onSuccess: () => {
        setCommentText("");
        queryClient.invalidateQueries({ queryKey: ["/api/work-orders", id, "comments"] });
      }
    }
  });

  const rejectMut = useRejectWorkOrder({
    mutation: {
      onSuccess: () => {
        setRejectOpen(false);
        setRejectReason("");
        toast({ title: "Work Order Rejected", description: "The work order has been successfully rejected." });
        invalidateQueries();
      }
    }
  });

  const statusMut = useUpdateWorkOrderStatus({ mutation: { onSuccess: invalidateQueries } });

  const handleAssign = async () => {
    if (!techName.trim()) return;
    setIsAssigning(true);
    try {
      const response = await fetch(`/api/work-orders/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician_name: techName.trim() })
      });
      if (response.ok) {
        setAssignOpen(false);
        setTechName("");
        toast({ title: "Technician Assigned", description: `Work order assigned to ${techName.trim()} and is now In Progress.` });
        invalidateQueries();
      } else {
        const err = await response.json();
        toast({ variant: "destructive", title: "Error", description: err.error || "Failed to assign technician." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to assign technician." });
    }
    setIsAssigning(false);
  };

  if (isOrderLoading || !order) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const isAdmin = user?.role === 'admin';
  const isTech = user?.role === 'technician';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="rounded-full">
            <Link href="/work-orders"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">Request #{order.id.slice(0, 8)}</h1>
            <Badge variant="outline" className={`${getStatusColor(order.status)} capitalize text-sm px-3 py-1 rounded-full`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-3 flex-wrap">
          {/* Admin: Accept (assign) + Reject for open orders */}
          {isAdmin && order.status === 'open' && (
            <>
              {/* Accept → opens assign dialog */}
              <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setTechName(""); }}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
                    <CheckCircle className="w-4 h-4 mr-2" /> Accept & Assign
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Assign Technician</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-3">
                    <label className="text-sm font-semibold block">Technician Name</label>
                    <Input
                      value={techName}
                      onChange={e => setTechName(e.target.value)}
                      placeholder="Enter technician's full name..."
                      className="rounded-xl h-12"
                      onKeyDown={e => e.key === 'Enter' && handleAssign()}
                    />
                    <p className="text-xs text-muted-foreground">The work order will move to <strong>In Progress</strong> once assigned.</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAssignOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button onClick={handleAssign} disabled={!techName.trim() || isAssigning} className="rounded-xl">
                      {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign & Start"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Reject */}
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="rounded-xl shadow-md">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Reject Work Order</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="text-sm font-semibold mb-2 block">Reason for rejection</label>
                    <Textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Please explain why this request is being rejected..."
                      className="rounded-xl"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectOpen(false)} className="rounded-xl">Cancel</Button>
                    <Button variant="destructive" onClick={() => rejectMut.mutate({ id, data: { reason: rejectReason } })} disabled={!rejectReason || rejectMut.isPending} className="rounded-xl">
                      {rejectMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reject"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Admin: Reassign when in_progress */}
          {isAdmin && order.status === 'in_progress' && (
            <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setTechName(""); }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl shadow-md border-primary/30">
                  <Wrench className="w-4 h-4 mr-2" /> Reassign Technician
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Reassign Technician</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  {order.assigned_to_name && (
                    <p className="text-sm text-muted-foreground">Currently assigned to: <strong>{order.assigned_to_name}</strong></p>
                  )}
                  <label className="text-sm font-semibold block">New Technician Name</label>
                  <Input
                    value={techName}
                    onChange={e => setTechName(e.target.value)}
                    placeholder="Enter technician's full name..."
                    className="rounded-xl h-12"
                    onKeyDown={e => e.key === 'Enter' && handleAssign()}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssignOpen(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleAssign} disabled={!techName.trim() || isAssigning} className="rounded-xl">
                    {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reassign"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Technician: Mark complete */}
          {isTech && order.status === 'in_progress' && (
            <Button onClick={() => statusMut.mutate({ id, data: { status: 'completed' } })} disabled={statusMut.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
              <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* MAIN COL */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-2xl font-bold">{order.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="prose max-w-none text-foreground/80">
                <p className="whitespace-pre-wrap">{order.description}</p>
              </div>

              {order.rejection_reason && (
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <h4 className="text-destructive font-bold flex items-center gap-2 mb-1"><XCircle className="w-4 h-4" /> Rejection Reason</h4>
                  <p className="text-sm text-destructive/90">{order.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* COMMENTS */}
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg"><MessageSquare className="w-5 h-5" /> Comments & Updates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {isCommentsLoading ? (
                  <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : comments?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">No comments yet.</div>
                ) : (
                  comments?.map(comment => (
                    <div key={comment.id} className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-foreground">{comment.author_name}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-muted/20 border-t border-border/50">
                <form
                  onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) addComment.mutate({ id, data: { content: commentText } }); }}
                  className="flex gap-3"
                >
                  <Input
                    placeholder="Add an update or ask a question..."
                    className="h-11 rounded-xl bg-white"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                  />
                  <Button type="submit" disabled={!commentText.trim() || addComment.isPending} className="h-11 px-6 rounded-xl shadow-md">
                    {addComment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SIDEBAR COL */}
        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b border-border/50 bg-muted/30">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><Tag className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Category</p>
                  <p className="font-medium capitalize">{order.category.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><AlertCircle className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Priority</p>
                  <Badge variant="secondary" className={`${getPriorityColor(order.priority)} capitalize border-transparent mt-0.5`}>
                    {order.priority}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><Building className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Building</p>
                  <p className="font-medium">{order.building || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><MapPin className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Location</p>
                  <p className="font-medium">{order.location}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><Calendar className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Submitted</p>
                  <p className="font-medium text-sm">{format(new Date(order.created_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg text-primary"><UserIcon className="w-4 h-4" /></div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Requester</p>
                  <p className="font-medium">{order.requester_name}</p>
                </div>
              </div>

              {order.assigned_to_name && (
                <div className="flex gap-4 items-start pt-4 border-t border-border/50">
                  <div className="mt-0.5 bg-blue-100 p-2 rounded-lg text-blue-700"><Wrench className="w-4 h-4" /></div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Assigned Technician</p>
                    <p className="font-medium text-blue-800">{order.assigned_to_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
