"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function PharmacistAvailmentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rxId = searchParams.get("rxId");

  const [loading, setLoading] = useState(true);
  const [rx, setRx] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [saving, setSaving] = useState(false);
  const [header, setHeader] = useState({
    gamotFacilityName: "",
    gamotAccreditationNo: "",
    transactionNo: "",
    upsc: "",
    date: "",
    contactNo: "",
    amountCovered: "",
    remainingCoverage: "",
  });

  const handleHeaderChange = (field: string, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadData = async () => {
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

      if (!rxId) {
        setErrorMsg("No prescription selected.");
        setLoading(false);
        return;
      }

      // prescription header
      const { data: prescription, error: rxError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", rxId)
        .single();

      if (rxError || !prescription) {
        console.error(rxError);
        setErrorMsg("Prescription not found.");
        setLoading(false);
        return;
      }

      // prescription items (with medicine_id)
      const { data: rxItems, error: itemsError } = await supabase
        .from("prescription_items")
        .select(
          "id, line_no, medicine_id, generic_name, dosage_strength, dosage_form, sig, quantity"
        )
        .eq("prescription_id", rxId)
        .order("line_no");

      if (itemsError) {
        console.error(itemsError);
      }

      const mapped =
        rxItems?.map((it: any) => ({
          id: it.id,
          lineNo: it.line_no,
          medicine_id: it.medicine_id,
          generic_name: it.generic_name,
          dosage_strength: it.dosage_strength,
          dosage_form: it.dosage_form,
          sig: it.sig,
          rx_quantity: it.quantity,
          unitPrice: "",
          quantityDispensed: it.quantity ?? "",
        })) || [];

      setRx(prescription);
      setMeds(mapped);

      setHeader((prev) => ({
        ...prev,
        upsc: prescription.upsc || "",
        date: prescription.date || new Date().toISOString().slice(0, 10),
      }));

      setLoading(false);
    };

    loadData();
  }, [rxId, router]);

  const handleMedChange = (index: number, field: string, value: string) => {
    setMeds((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rx) return;

    setSaving(true);
    setErrorMsg("");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setErrorMsg("You must be logged in.");
      setSaving(false);
      return;
    }

    // compute med rows
    const medRows = meds
      .map((m, idx) => {
        const unit = parseFloat(m.unitPrice || "0") || 0;
        const qty = parseInt(String(m.quantityDispensed || "0"), 10) || 0;
        const lineTotal = unit * qty;

        return {
          line_no: idx + 1,
          generic_name: m.generic_name,
          dosage_strength: m.dosage_strength,
          drug_formulation: m.dosage_form || "",
          unit_price: unit,
          quantity_dispensed: qty,
          price: lineTotal,
        };
      })
      .filter((r) => r.quantity_dispensed > 0 || r.unit_price > 0);

    const total = medRows.reduce((sum, r) => sum + r.price, 0);

    const amountCovered = parseFloat(header.amountCovered || "0") || 0;
    const remainingCoverage =
      parseFloat(header.remainingCoverage || "0") || 0;

    // 1) insert availment_slip
    const { data: slip, error: slipError } = await supabase
      .from("availment_slips")
      .insert({
        prescription_id: rx.id,
        pharmacist_id: user.id,
        gamot_facility_name: header.gamotFacilityName,
        gamot_accreditation_no: header.gamotAccreditationNo,
        transaction_number: header.transactionNo,
        upsc: header.upsc,
        date: header.date || null,
        patient_name: rx.beneficiary_name,
        age: rx.age,
        sex: rx.sex,
        pin: rx.pin,
        contact_no: header.contactNo,
        total,
        amount_covered: amountCovered,
        remaining_coverage: remainingCoverage,
      })
      .select("id")
      .single();

    if (slipError || !slip) {
      console.error(slipError);
      setErrorMsg(slipError?.message || "Error saving availment slip.");
      setSaving(false);
      return;
    }

    // 2) insert availment_items
    if (medRows.length > 0) {
      const withAvailmentId = medRows.map((r) => ({
        ...r,
        availment_slip_id: slip.id,
      }));

      const { error: itemsError } = await supabase
        .from("availment_items")
        .insert(withAvailmentId);

      if (itemsError) {
        console.error("Availment items insert error:", itemsError);
        setErrorMsg(itemsError.message);
        setSaving(false);
        return;
      }
    }

    // 3) subtract inventory
    for (let i = 0; i < meds.length; i++) {
      const med = meds[i];
      const medId = med.medicine_id;
      const qtyDispensed = parseInt(med.quantityDispensed || "0", 10);

      if (!medId || qtyDispensed <= 0) continue;

      const { data: inv, error: invError } = await supabase
        .from("inventory")
        .select("id, quantity_available")
        .eq("medicine_id", medId)
        .eq("gamot_facility_name", header.gamotFacilityName || null)
        .single();

      if (invError || !inv) {
        console.error("Inventory fetch error:", invError);
        continue;
      }

      const newQty = (inv.quantity_available || 0) - qtyDispensed;

      const { error: updError } = await supabase
        .from("inventory")
        .update({ quantity_available: newQty })
        .eq("id", inv.id);

      if (updError) {
        console.error("Inventory update error:", updError);
      }
    }

    // 4) mark prescription as FILLED / FINISHED
    const { error: statusError } = await supabase
      .from("prescriptions")
      .update({ status: "FILLED" }) // or "FINISHED"
      .eq("id", rx.id);

    if (statusError) {
      console.error("Status update error:", statusError);
      // we won't block printing for this, just log it
    }

    setSaving(false);

    // ⬇️ Go straight to printable availment slip page
    router.push(`/pharmacist/availments/${slip.id}`);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!rx) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
        {errorMsg || "Prescription not found."}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* top bar */}
        <div className="flex items-center justify-between">
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <span className="text-[11px] text-gray-400">
            Pharmacist · PhilHealth GAMOT
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            PhilHealth GAMOT – Availment Slip
          </h1>
          <p className="text-sm text-gray-500">
            Prescription:{" "}
            <span className="font-mono text-gray-800">{rx.rx_code}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PATIENT INFO */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-1 shadow-sm">
            <div>
              <span className="font-semibold">Patient:</span>{" "}
              {rx.beneficiary_name}
            </div>
            <div className="flex gap-4">
              <span>
                <span className="font-semibold">Age:</span> {rx.age || "—"}
              </span>
              <span>
                <span className="font-semibold">Sex:</span> {rx.sex || "—"}
              </span>
            </div>
            <div>
              <span className="font-semibold">PIN:</span> {rx.pin || "—"}
            </div>
            <div>
              <span className="font-semibold">Diagnosis:</span>{" "}
              {rx.diagnosis || "—"}
            </div>
          </div>

          {/* GAMOT FACILITY & HEADER FIELDS */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-3 shadow-sm">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  GAMOT Facility Name
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.gamotFacilityName}
                  onChange={(e) =>
                    handleHeaderChange("gamotFacilityName", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  GAMOT Accreditation Number
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.gamotAccreditationNo}
                  onChange={(e) =>
                    handleHeaderChange(
                      "gamotAccreditationNo",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  Transaction No.
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.transactionNo}
                  onChange={(e) =>
                    handleHeaderChange("transactionNo", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  UPSC
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.upsc}
                  onChange={(e) =>
                    handleHeaderChange("upsc", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  Date
                </label>
                <input
                  type="date"
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900"
                  value={header.date}
                  onChange={(e) =>
                    handleHeaderChange("date", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1 text-gray-600">
                Contact No.
              </label>
              <input
                className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                value={header.contactNo}
                onChange={(e) =>
                  handleHeaderChange("contactNo", e.target.value)
                }
              />
            </div>
          </div>

          {/* MEDS TABLE */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h2 className="font-semibold mb-2 text-sm text-gray-800">
              List of medications availed under PhilHealth GAMOT
            </h2>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="text-left py-1 pr-2">#</th>
                  <th className="text-left py-1 pr-2">
                    Generic / Strength / Form / Sig
                  </th>
                  <th className="text-right py-1 pr-2">Rx Qty</th>
                  <th className="text-right py-1 pr-2">Unit Price</th>
                  <th className="text-right py-1 pr-2">Qty Dispensed</th>
                </tr>
              </thead>
              <tbody>
                {meds.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-2 text-center text-gray-400 text-xs"
                    >
                      No medicines encoded for this prescription.
                    </td>
                  </tr>
                )}
                {meds.map((m, idx) => (
                  <tr key={m.id} className="border-b border-gray-100">
                    <td className="py-1 pr-2 align-top">{idx + 1}</td>
                    <td className="py-1 pr-2 align-top">
                      <div className="text-gray-900">
                        {m.generic_name || "—"}
                      </div>
                      <div className="text-gray-600">
                        {m.dosage_strength || ""}
                      </div>
                      <div className="text-gray-600">
                        {m.dosage_form || ""}
                      </div>
                      <div className="text-gray-500">{m.sig || ""}</div>
                    </td>
                    <td className="py-1 pr-2 text-right align-top">
                      {m.rx_quantity || ""}
                    </td>
                    <td className="py-1 pr-2 text-right align-top">
                      <input
                        className="w-20 bg-white border border-gray-300 rounded px-1 py-[2px] text-right text-xs text-gray-900 placeholder-gray-400"
                        value={m.unitPrice}
                        onChange={(e) =>
                          handleMedChange(idx, "unitPrice", e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </td>
                    <td className="py-1 pr-2 text-right align-top">
                      <input
                        className="w-16 bg-white border border-gray-300 rounded px-1 py-[2px] text-right text-xs text-gray-900 placeholder-gray-400"
                        value={m.quantityDispensed}
                        onChange={(e) =>
                          handleMedChange(
                            idx,
                            "quantityDispensed",
                            e.target.value
                          )
                        }
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-3 shadow-sm">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  Amount Covered by PhilHealth
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.amountCovered}
                  onChange={(e) =>
                    handleHeaderChange("amountCovered", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-600">
                  Remaining Benefit Coverage
                </label>
                <input
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 placeholder-gray-400"
                  value={header.remainingCoverage}
                  onChange={(e) =>
                    handleHeaderChange("remainingCoverage", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              (Total is computed automatically from unit price × quantity
              dispensed.)
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
          >
            {saving ? "Saving..." : "Save Availment Slip"}
          </button>
        </form>
      </div>
    </main>
  );
}
