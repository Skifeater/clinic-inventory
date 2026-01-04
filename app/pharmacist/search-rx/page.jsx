"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

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
      <PageContainer>
        <Card>
          <p className="text-sm text-gray-500">Loading...</p>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="Search Prescription (GAMOT)"
        description="Search by Rx code, patient name, or PhilHealth PIN."
        backHref="/dashboard"
        badge="Pharmacist · Search Rx"
      />

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {/* Search box */}
      <Card>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="RX-2025-000123, Juan Dela Cruz, or PIN..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Results list */}
      <div className="space-y-2">
        {results.length === 0 && !term && (
          <Card>
            <p className="text-xs text-gray-400">
              Type a patient name, Rx code, or PIN then press Search.
            </p>
          </Card>
        )}

        {results.length === 0 && term && !errorMsg && (
          <Card>
            <p className="text-xs text-gray-400">
              No prescriptions found matching <span className="font-medium">"{term}"</span>.
            </p>
          </Card>
        )}

        {results.map((rx) => (
          <button
            key={rx.id}
            onClick={() => openAvailment(rx.id)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors"
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
    </PageContainer>
  );
}
