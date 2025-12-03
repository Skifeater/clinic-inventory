"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function PharmacistSearchRxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔐 Guard: only pharmacists allowed
  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile || profile.role !== "pharmacist") {
        router.push("/dashboard");
        return;
      }

      setLoading(false);
    };

    checkRole();
  }, [router]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setResults([]);

    let query = supabase
      .from("prescriptions")
      .select("id, rx_code, beneficiary_name, date, diagnosis, pin")
      .order("created_at", { ascending: false });

    if (term.trim()) {
      query = query.or(
        `rx_code.ilike.%${term}%,beneficiary_name.ilike.%${term}%,pin.ilike.%${term}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setErrorMsg("Error searching prescriptions.");
    } else {
      setResults(data || []);
    }
  };

  const openAvailment = (id) => {
    router.push(`/pharmacist/availment?rxId=${id}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Top bar / back link */}
        <div className="flex items-center justify-between">
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to dashboard
          </button>
          <span className="text-[11px] text-gray-400">
            Pharmacist · Search Rx
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Search Prescription (GAMOT)</h1>
          <p className="text-sm text-gray-500">
            Search by Rx code, patient name, or PhilHealth PIN.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Search box */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 bg-white border border-gray-200 rounded-xl p-3 shadow-sm"
        >
          <input
            className="flex-1 bg-white border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            placeholder="RX-2025-000123, Juan Dela Cruz, or PIN..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-1.5 rounded-md bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition disabled:opacity-60"
          >
            Search
          </button>
        </form>

        {/* Results list */}
        <div className="space-y-2">
          {results.length === 0 && !term && (
            <p className="text-xs text-gray-400">
              Type a patient name, Rx code, or PIN then press Search.
            </p>
          )}

          {results.length === 0 && term && !errorMsg && (
            <p className="text-xs text-gray-400">
              No prescriptions found matching <span className="font-medium">"{term}"</span>.
            </p>
          )}

          {results.map((rx) => (
            <button
              key={rx.id}
              onClick={() => openAvailment(rx.id)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-900">
                  {rx.rx_code || "(no code)"} – {rx.beneficiary_name}
                </span>
                <span className="text-xs text-gray-500">{rx.date}</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Dx: {rx.diagnosis || "—"}
              </div>
              {rx.pin && (
                <div className="text-[11px] text-gray-400 mt-0.5">
                  PIN: {rx.pin}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
