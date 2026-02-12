import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, Shield, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      toast({
        title: "Invalid Credentials",
        description: "Please use the demo credentials shown below.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/20" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-accent/5 translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-primary-foreground font-bold text-xl tracking-tight">SRM IST</span>
          </div>
          <p className="text-primary-foreground/60 text-sm">Institute of Science and Technology</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            University<br />Executive Portal
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md leading-relaxed">
            Enterprise-grade Decision Intelligence platform for managing student assessments, skills, and performance analytics.
          </p>
          <div className="flex gap-8 pt-4">
            {[
              { value: "10K+", label: "Students" },
              { value: "4", label: "Years" },
              { value: "Real-time", label: "Analytics" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-primary-foreground/50 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-primary-foreground/40 text-xs">
          © 2026 SRM Institute of Science and Technology. All rights reserved.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">SRM IST Portal</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">Sign in to your account</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">Enter your credentials to access the portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@srmist.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </form>

          {/* Demo credentials */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <p className="text-xs font-semibold text-foreground">Demo Credentials</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Admin:</span>{" "}
                  <span className="text-muted-foreground font-mono">admin@srmist.edu.in / admin123</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border/60">
                <GraduationCap className="w-4 h-4 text-accent shrink-0" />
                <div>
                  <span className="font-medium text-foreground">Student:</span>{" "}
                  <span className="text-muted-foreground font-mono">student@srmist.edu.in / student123</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
