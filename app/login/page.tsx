"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";
import { AppHeader } from "../../components/layout/AppHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (loginError) {
      console.error(loginError);
      setError(loginError.message);
      return;
    }

    if (!data || !data.user || !data.session) {
      setError("Login failed. No session returned.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <AppHeader showBack backHref="/" backLabel="Back to home" />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card padding="lg">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-1">Login</h2>
                <p className="text-sm text-gray-500">
                  Sign in with your registered email and password.
                </p>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />

                <p className="text-xs text-gray-500">
                  Forgot your password?{" "}
                  <Link
                    href="/forgot-password"
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                  >
                    Reset it here
                  </Link>
                </p>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>

              <p className="text-xs text-gray-500 text-center">
                Don&apos;t have an account yet?{" "}
                <Link
                  href="/create-account"
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Create account
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
