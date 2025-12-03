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

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
  e.preventDefault();
  setError("");

  if (!form.email || !form.password) {
    setError("Email and password are required.");
    return;
  }

  setLoading(true);

  // ⭐ IMPORTANT: DO NOT THROW AWAY "data"
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

  // ⭐ Check the returned user + session
  if (!data || !data.user || !data.session) {
    setError("Login failed. No session returned.");
    return;
  }

  // OPTIONAL: print to console for debugging
  console.log("Login Success:", data);

  // Redirect to dashboard
  router.push("/dashboard");
}


  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm">
            GAMOT e-Clinic
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="flex-1 flex items-center">
        <div className="max-w-md mx-auto w-full px-4 py-8">
          <h1 className="text-2xl font-bold mb-2">Login</h1>
          <p className="text-sm text-slate-400 mb-6">
            Sign in with your registered email and password.
          </p>

          {error && (
            <div className="mb-4 rounded border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4"
          >
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                placeholder="name@example.com"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4 text-center">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/create-account"
              className="text-emerald-400 hover:text-emerald-300"
            >
              Create account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
