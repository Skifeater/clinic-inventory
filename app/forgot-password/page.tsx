"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
    <main className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h1 className="text-xl font-semibold">Forgot Password</h1>
        <p className="text-xs text-gray-500">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {message && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-md">
            {message}
          </div>
        )}
        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs mb-1 text-gray-600">Email</label>
            <input
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-lg py-2 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="text-xs text-gray-500 text-center">
          Remembered your password?{" "}
          <a
            href="/login"
            className="text-emerald-600 hover:text-emerald-500 font-medium"
          >
            Back to login
          </a>
        </div>
      </div>
    </main>
  );
}
