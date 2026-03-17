import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "faculty", "admin", "technician"], { required_error: "Please select a role" }),
  department: z.string().optional(),
});

export default function Register() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", role: undefined as any, department: "" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
      },
      onError: (error: any) => {
        setErrorMsg(error?.message || "Registration failed. Please try again.");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    setErrorMsg("");
    registerMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#faf8f8] py-12">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Abstract maroon background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f8] via-[#faf8f8]/80 to-transparent"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-xl px-4"
      >
        <Card className="glass-panel border-white/40 shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-black/5">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
            <CardTitle className="text-3xl font-display font-bold text-foreground">Create Account</CardTitle>
            <CardDescription className="text-base">Join CampusWorks to manage and track maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-foreground/80">Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" className="h-12 rounded-xl bg-white/60 focus:bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="you@university.edu" className="h-12 rounded-xl bg-white/60 focus:bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-white/60 focus:bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl bg-white/60 focus:bg-white">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="faculty">Faculty/Staff</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="admin">Administrator (Supervisor)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">Department/Hall (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Science Dept" className="h-12 rounded-xl bg-white/60 focus:bg-white" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 mt-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
