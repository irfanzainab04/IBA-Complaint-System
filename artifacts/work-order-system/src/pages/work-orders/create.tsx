import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateWorkOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Building2, MapPin, Tag, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const createSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Please provide more details"),
  category: z.enum(["electrical", "plumbing", "it", "lab_equipment", "general"]),
  building: z.string().min(1, "Building is required"),
  location: z.string().min(2, "Location details are required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export default function CreateWorkOrder() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      building: "",
      location: "",
      priority: "medium",
    },
  });

  const createMutation = useCreateWorkOrder({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({ title: "Success", description: "Work order created successfully." });
        setLocation(`/work-orders/${data.id}`);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Error", description: "Failed to create request." });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof createSchema>) => {
    createMutation.mutate({ data: values });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-full">
          <Link href="/work-orders"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">New Maintenance Request</h1>
          <p className="text-muted-foreground mt-1">Submit a new issue to the facilities team</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/50 shadow-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary to-accent"></div>
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Issue Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Leaking pipe in 2nd floor men's restroom" className="h-12 rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
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

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - Routine</SelectItem>
                          <SelectItem value="medium">Medium - Standard</SelectItem>
                          <SelectItem value="high">High - Impacting work</SelectItem>
                          <SelectItem value="urgent">Urgent - Hazard/Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                <FormField
                  control={form.control}
                  name="building"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" /> Building</FormLabel>
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
                      <FormLabel className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> Specific Location</FormLabel>
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
                    <FormLabel className="text-base font-semibold">Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the issue in detail, including when it started and any troubleshooting attempted."
                        className="min-h-[120px] rounded-xl resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                <Button variant="outline" type="button" asChild className="rounded-xl h-12 px-6">
                  <Link href="/work-orders">Cancel</Link>
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-transform"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
