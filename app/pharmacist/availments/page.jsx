"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Alert } from "../../../components/ui/Alert";

export default function PharmacistAvailmentsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [slips, setSlips] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      setErrorMsg("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "pharmacist") {
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("availment_slips")
        .select(
          "id, date, transaction_number, patient_name, total, amount_covered"
        )
        .eq("pharmacist_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMsg(error.message || "Error loading availment slips.");
      } else {
        setSlips(data || []);
      }

      setLoading(false);
    };

    load();
  }, [router]);

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
        title="My Availment Slips"
        description="List of PhilHealth GAMOT availment slips you have encoded."
        backHref="/dashboard"
        badge="Pharmacist · My Availments"
      />

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {slips.length === 0 && !errorMsg && (
        <Card>
          <p className="text-sm text-gray-500">
            You haven&apos;t created any availment slips yet.
          </p>
        </Card>
      )}

      <div className="space-y-2">
        {slips.map((s) => (
          <button
            key={s.id}
            onClick={() => router.push(`/pharmacist/availments/${s.id}`)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-900">
                {s.patient_name || "Unknown patient"}
              </div>
              <div className="text-xs text-gray-500">{s.date}</div>
            </div>

            <div className="text-xs text-gray-600 mt-0.5">
              Txn: {s.transaction_number || "—"}
            </div>

            <div className="text-[11px] text-gray-500 mt-1">
              Total: ₱{s.total?.toFixed?.(2) || "0.00"} | Covered: ₱
              {s.amount_covered?.toFixed?.(2) || "0.00"}
            </div>
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
