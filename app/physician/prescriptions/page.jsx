"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Alert } from "../../../components/ui/Alert";
import { Card } from "../../../components/ui/Card";

export default function PhysicianPrescriptionsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      // verify role = physician
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "physician") {
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, rx_code, beneficiary_name, date, diagnosis, status")
        .eq("physician_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMsg("Error loading prescriptions.");
      } else {
        setPrescriptions(data || []);
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
        title="My Prescriptions"
        description="Review, print, or share PhilHealth GAMOT prescriptions you have created."
        backHref="/dashboard"
        badge="Physician · Prescriptions"
      />

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      {prescriptions.length === 0 && !errorMsg && (
        <Card>
          <p className="text-sm text-gray-500">
            You haven&apos;t created any prescriptions yet.
          </p>
        </Card>
      )}

      {/* List */}
      <div className="space-y-2">
        {prescriptions.map((rx) => (
          <button
            key={rx.id}
            onClick={() => router.push(`/physician/prescriptions/${rx.id}`)}
            className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {rx.rx_code} – {rx.beneficiary_name}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Dx: {rx.diagnosis || "—"}
                </div>
              </div>
              <div className="text-right space-y-1.5">
                <div className="text-xs text-gray-500">{rx.date}</div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    (rx.status || "NEW") === "NEW"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}
                >
                  {rx.status || "NEW"}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </PageContainer>
  );
}
