import { useState } from "react";
import { Link } from "wouter";
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
import { Loader2, ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "faculty", "admin"], { required_error: "Please select a role" }),
}).superRefine((data, ctx) => {
  if (data.role === "student" && !data.email.endsWith("@khi.iba.edu.pk")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Student accounts must use a @khi.iba.edu.pk email address",
      path: ["email"],
    });
  }
  if (data.role === "faculty" && !data.email.endsWith("@iba.edu.pk")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Faculty/Staff accounts must use a @iba.edu.pk email address",
      path: ["email"],
    });
  }
});

export default function Register() {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { full_name: "", email: "", password: "", role: undefined as any },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data: any) => {
        if (data.pending_approval) {
          setPendingMessage(data.message);
          setIsPendingApproval(true);
        } else {
          login(data.token);
        }
      },
      onError: (error: any) => {
        const msg = error?.response?.data?.error || error?.message || "Registration failed. Please try again.";
        setErrorMsg(msg);
      }
    }
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    setErrorMsg("");
    registerMutation.mutate({ data: values as any });
  };

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#faf8f8] py-12">
        <div className="absolute inset-0 z-0">
          <img src={`${import.meta.env.BASE_URL}images/login-bg.png`} alt="" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f8] via-[#faf8f8]/80 to-transparent"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md px-4"
        >
          <Card className="glass-panel border-white/40 shadow-2xl text-center p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-amber-100 p-5 rounded-full">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-3">Account Pending Approval</h2>
            <p className="text-muted-foreground mb-6">{pendingMessage}</p>
            <Link href="/login">
              <Button className="rounded-xl w-full h-12">Back to Sign In</Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    );
  }

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
                          <Input placeholder="you@khi.iba.edu.pk" className="h-12 rounded-xl bg-white/60 focus:bg-white" {...field} />
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
                          <SelectItem value="faculty">Faculty / Staff</SelectItem>
                          <SelectItem value="admin">Administrator (Supervisor)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("role") === "student" && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    Student accounts require a <strong>@khi.iba.edu.pk</strong> email address.
                  </p>
                )}
                {form.watch("role") === "faculty" && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                    Faculty/Staff accounts require a <strong>@iba.edu.pk</strong> email address.
                  </p>
                )}
                {form.watch("role") === "admin" && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                    Administrator accounts require approval from an existing administrator before access is granted.
                  </p>
                )}

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

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
