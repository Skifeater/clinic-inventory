"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

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
      <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to dashboard
          </button>
          <span className="text-[11px] text-gray-400">
            Physician · Prescriptions
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">My Prescriptions</h1>
          <p className="text-sm text-gray-500">
            Review, print, or share PhilHealth GAMOT prescriptions you have created.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {errorMsg}
          </div>
        )}

        {prescriptions.length === 0 && !errorMsg && (
          <p className="text-sm text-gray-500">
            You haven&apos;t created any prescriptions yet.
          </p>
        )}

        {/* List */}
        <div className="space-y-2">
          {prescriptions.map((rx) => (
            <button
              key={rx.id}
              onClick={() => router.push(`/physician/prescriptions/${rx.id}`)}
              className="w-full text-left bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {rx.rx_code} – {rx.beneficiary_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Dx: {rx.diagnosis || "—"}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-gray-500">{rx.date}</div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${
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
      </div>
    </main>
  );
}
