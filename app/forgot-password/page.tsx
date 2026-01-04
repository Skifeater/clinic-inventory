"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
import { AppHeader } from "../../components/layout/AppHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    // You can also store this in NEXT_PUBLIC_SITE_URL
    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
        : `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError(error.message || "Something went wrong.");
      return;
    }

    setMessage(
      "If an account with that email exists, a password reset link has been sent."
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <AppHeader showBack backHref="/login" backLabel="Back to login" />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <Card padding="lg">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold mb-1">Forgot Password</h1>
                <p className="text-sm text-gray-500">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="error">{error}</Alert>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <div className="text-xs text-gray-500 text-center">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Back to login
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
