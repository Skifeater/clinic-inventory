"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { AppHeader } from "../../components/layout/AppHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setError(error.message || "Failed to update password.");
      return;
    }

    setMessage("Password updated successfully. Redirecting to login…");

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <AppHeader showBack backHref="/login" backLabel="Back to login" />
      
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <Card padding="lg">
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-semibold mb-1">Set a new password</h1>
                <p className="text-sm text-gray-500">
                  Enter your new password below to finish resetting your account.
                </p>
              </div>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="error">{error}</Alert>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                />

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Updating…" : "Update password"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
