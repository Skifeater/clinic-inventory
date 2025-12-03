"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

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
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
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
            Pharmacist · My Availments
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">My Availment Slips</h1>
          <p className="text-sm text-gray-500">
            List of PhilHealth GAMOT availment slips you have encoded.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {errorMsg}
          </div>
        )}

        {slips.length === 0 && !errorMsg && (
          <p className="text-sm text-gray-500">
            You haven&apos;t created any availment slips yet.
          </p>
        )}

        <div className="space-y-2">
          {slips.map((s) => {
            const total =
              typeof s.total === "number"
                ? s.total.toFixed(2)
                : Number(s.total || 0).toFixed(2);
            const covered =
              typeof s.amount_covered === "number"
                ? s.amount_covered.toFixed(2)
                : Number(s.amount_covered || 0).toFixed(2);

            return (
              <div
                key={s.id}
                className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {s.patient_name || "Unknown patient"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Txn: {s.transaction_number || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {s.date || "—"}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Total: ₱{total} &nbsp;|&nbsp; Covered: ₱{covered}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
