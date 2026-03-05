import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegisterMutation } from "@/hooks/use-auth";
import { Zap, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";

const BENEFITS = [
  "Generate 300+ shoppable videos daily",
  "AI agents post 24/7 automatically",
  "Track revenue per post in real time",
  "14-day free trial, no credit card needed",
];

export default function Register() {
  const [brandName, setBrandName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const register = useRegisterMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!brandName.trim() || !email.trim() || !password) return;
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      await register.mutateAsync({ username: email.trim().toLowerCase(), password, brandName: brandName.trim() });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-col justify-center flex-1 px-16 bg-gradient-to-br from-primary/10 via-violet-500/5 to-background">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Dexfluence</span>
        </div>
        <h2 className="text-3xl font-bold leading-tight mb-4">
          Your AI Content<br />Manufacturing Engine
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Generate hundreds of shoppable videos daily, automatically post them, and watch your revenue grow.
        </p>
        <ul className="space-y-3">
          {BENEFITS.map(b => (
            <li key={b} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Dexfluence</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold" data-testid="heading-register">Create your brand account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start your 14-day free trial — no credit card required</p>
          </div>

          <Card className="border-card-border">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand name</Label>
                  <Input
                    id="brandName"
                    placeholder="e.g. SkinGlow Cosmetics"
                    value={brandName}
                    onChange={e => setBrandName(e.target.value)}
                    required
                    data-testid="input-register-brand"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@brand.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    data-testid="input-register-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      data-testid="input-register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                    data-testid="input-register-confirm"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md" data-testid="text-register-error">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={register.isPending}
                  data-testid="button-register-submit"
                >
                  {register.isPending ? "Creating account..." : <><ArrowRight className="w-4 h-4" /> Create Free Account</>}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By creating an account you agree to our Terms of Service
                </p>
              </form>

              <div className="mt-4 pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium" data-testid="link-to-login">
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
