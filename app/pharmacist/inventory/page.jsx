"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function PharmacistInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // inventory + medicine info
  const [errorMsg, setErrorMsg] = useState("");
  const [savingRowId, setSavingRowId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setErrorMsg("");

      // 🔐 check pharmacist role
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "pharmacist") {
        router.push("/dashboard");
        return;
      }

      // load medicines
      const { data: meds, error: medsError } = await supabase
        .from("medicines")
        .select("id, name, preparation, is_active");

      if (medsError) {
        console.error("Medicines error:", medsError);
        setErrorMsg("Error loading medicines.");
        setLoading(false);
        return;
      }

      const medMap = new Map((meds || []).map((m) => [m.id, m]));

      // load inventory
      const { data: inv, error: invError } = await supabase
        .from("inventory")
        .select("id, medicine_id, gamot_facility_name, quantity_available")
        .order("gamot_facility_name", { ascending: true });

      if (invError) {
        console.error("Inventory error:", invError);
        setErrorMsg("Error loading inventory.");
        setLoading(false);
        return;
      }

      const combined =
        inv?.map((row) => {
          const med = medMap.get(row.medicine_id) || {};
          return {
            id: row.id,
            medicineId: row.medicine_id,
            name: med.name || "Unknown medicine",
            preparation: med.preparation || "",
            isActive: med.is_active ?? true,
            facility: row.gamot_facility_name || "",
            quantity: row.quantity_available ?? 0,
            delta: "", // for add/subtract input
          };
        }) || [];

      setRows(combined);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const handleDeltaChange = (index, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], delta: value };
      return copy;
    });
  };

  const handleApplyChange = async (index) => {
    const row = rows[index];
    const delta = parseInt(row.delta || "0", 10);

    if (Number.isNaN(delta) || delta === 0) {
      return;
    }

    const newQty = (row.quantity || 0) + delta;
    if (newQty < 0) {
      alert("Resulting stock cannot be negative.");
      return;
    }

    setSavingRowId(row.id);
    setErrorMsg("");

    const { error } = await supabase
      .from("inventory")
      .update({ quantity_available: newQty })
      .eq("id", row.id);

    setSavingRowId(null);

    if (error) {
      console.error("Update inventory error:", error);
      setErrorMsg("Error updating stock.");
      return;
    }

    // update local state
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        quantity: newQty,
        delta: "",
      };
      return copy;
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading inventory...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => router.push("/dashboard")}
          >
            ← Back to dashboard
          </button>
          <span className="text-[11px] text-gray-400">
            Pharmacist · Inventory
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Pharmacy Inventory</h1>
          <p className="text-sm text-gray-500">
            View and adjust current stock for PhilHealth GAMOT medicines.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {errorMsg}
          </div>
        )}

        {/* Table card */}
        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="text-left py-2 pr-2 font-medium">Medicine</th>
                <th className="text-left py-2 pr-2 font-medium">Preparation</th>
                <th className="text-left py-2 pr-2 font-medium">Facility</th>
                <th className="text-right py-2 pr-2 font-medium">
                  Current Qty
                </th>
                <th className="text-right py-2 pr-2 font-medium">
                  + / − Adjust
                </th>
                <th className="text-right py-2 pl-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-gray-400 text-xs"
                  >
                    No inventory records yet.
                  </td>
                </tr>
              )}

              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 align-middle"
                >
                  <td className="py-2 pr-2">
                    <div className="font-medium text-gray-900">
                      {row.name}
                      {!row.isActive && (
                        <span className="ml-1 text-[10px] text-amber-500">
                          (inactive)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-2 text-gray-600">
                    {row.preparation}
                  </td>
                  <td className="py-2 pr-2 text-gray-600">
                    {row.facility || "—"}
                  </td>
                  <td className="py-2 pr-2 text-right text-gray-900">
                    {row.quantity}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <input
                      className="w-24 bg-white border border-gray-300 rounded-md px-2 py-1 text-right text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                      value={row.delta}
                      onChange={(e) =>
                        handleDeltaChange(index, e.target.value)
                      }
                      placeholder="+10 or -5"
                    />
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleApplyChange(index)}
                      disabled={savingRowId === row.id}
                      className="px-3 py-1.5 rounded-md bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {savingRowId === row.id ? "Saving..." : "Apply"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-gray-500">
          Tip: Use positive numbers to add stock (e.g. +20) and negative numbers
          to deduct (e.g. -5). Stock will not be allowed to go below zero.
        </p>
      </div>
    </main>
  );
}
