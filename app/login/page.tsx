"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Link from "next/link";

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
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              G
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                GAMOT e-Clinic
              </h1>
              <p className="text-xs text-gray-500">
                Inventory &amp; e-Prescription System
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            ← Back to home
          </Link>
        </header>

        {/* Card */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-1">Login</h2>
          <p className="text-sm text-gray-500 mb-4">
            Sign in with your registered email and password.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs mb-1 text-gray-600">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-600">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/create-account"
              className="text-emerald-600 hover:text-emerald-500 font-medium"
            >
              Create account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
