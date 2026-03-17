import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
      },
      onError: (error: any) => {
        setErrorMsg("Invalid email or password. Please try again.");
      }
    }
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setErrorMsg("");
    loginMutation.mutate({ data: values });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#faf8f8]">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`} 
          alt="Abstract maroon background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#faf8f8] via-transparent to-transparent"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="flex justify-center mb-8">
          <div className="bg-primary p-4 rounded-2xl shadow-xl shadow-primary/20">
            <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-12 h-12" />
          </div>
        </div>

        <Card className="glass-panel border-white/40">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-3xl font-display font-bold text-foreground">Welcome Back</CardTitle>
            <CardDescription className="text-base">Sign in to your CampusWorks account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/80 font-semibold">Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@university.edu" className="h-12 rounded-xl bg-white/60 focus:bg-white transition-colors" {...field} />
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground/80 font-semibold">Password</FormLabel>
                      </div>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-white/60 focus:bg-white transition-colors" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm text-center font-medium animate-in fade-in zoom-in-95 duration-200">
                    {errorMsg}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline inline-flex items-center gap-1 group">
                Create one
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
