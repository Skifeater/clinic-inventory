"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function AvailmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [slip, setSlip] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [rx, setRx] = useState<any>(null);
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

      // 1) load availment slip
      const { data: slipData, error: slipError } = await supabase
        .from("availment_slips")
        .select("*")
        .eq("id", id)
        .single();

      if (slipError || !slipData) {
        console.error(slipError);
        setErrorMsg("Availment slip not found.");
        setLoading(false);
        return;
      }

      // 2) load corresponding prescription (for Rx code & diagnosis)
      const { data: rxData, error: rxError } = await supabase
        .from("prescriptions")
        .select("rx_code, diagnosis, beneficiary_name")
        .eq("id", slipData.prescription_id)
        .single();

      if (rxError) {
        console.error(rxError);
      }

      // 3) load availment items
      const { data: itemsData, error: itemsError } = await supabase
        .from("availment_items")
        .select(
          "line_no, generic_name, dosage_strength, drug_formulation, unit_price, quantity_dispensed, price"
        )
        .eq("availment_slip_id", id)
        .order("line_no", { ascending: true });

      if (itemsError) {
        console.error(itemsError);
      }

      setSlip(slipData);
      setRx(rxData || null);
      setItems(itemsData || []);
      setLoading(false);
    };

    if (id) load();
  }, [id, router]);

  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString() : "";

  const formatMoney = (n?: number) =>
    typeof n === "number" ? n.toFixed(2) : "0.00";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  if (errorMsg || !slip) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-4">
        <button
          className="text-xs text-gray-500 hover:text-gray-800 mb-3"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <p>{errorMsg || "Availment slip not found."}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 print:bg-white print:text-black">
        {/* Top bar (hidden when printing) */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <button
            className="text-xs text-gray-500 hover:text-gray-800"
            onClick={() => router.push("/pharmacist/availments")}
          >
            ← Back to list
          </button>
          <div className="space-x-2">
            <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
              Status: FINISHED
            </span>
            <button
              className="px-3 py-1 rounded-lg bg-emerald-500 text-white text-xs font-medium hover:bg-emerald-400 shadow-sm"
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* Printable sheet */}
        <div className="bg-white text-black p-6 rounded-xl shadow print:shadow-none print:p-0 print:rounded-none border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-lg font-bold">
                PhilHealth GAMOT – Availment Slip
              </h1>
              <p className="text-xs">
                Rx Code:{" "}
                <span className="font-mono">
                  {rx?.rx_code || "___________"}
                </span>
              </p>
              <p className="text-xs">
                Transaction No.:{" "}
                <span className="font-mono">
                  {slip.transaction_number || "___________"}
                </span>
              </p>
            </div>
            <div className="text-xs text-right">
              <div>Date: {formatDate(slip.date)}</div>
              <div>UPSC: {slip.upsc || "__________"}</div>
            </div>
          </div>

          <hr className="my-3 border-black" />

          {/* Patient & facility info */}
          <div className="text-xs space-y-1 mb-3">
            <div className="flex justify-between">
              <span>
                Patient:&nbsp;
                <span className="font-semibold">
                  {slip.patient_name || rx?.beneficiary_name || "__________"}
                </span>
              </span>
              <span>
                Age: {slip.age || "____"} &nbsp; Sex: {slip.sex || "___"}
              </span>
            </div>
            <div>
              PIN: {slip.pin || "__________________"} &nbsp; Contact:{" "}
              {slip.contact_no || "________________"}
            </div>
            <div>
              Diagnosis: {rx?.diagnosis || "_____________________________"}
            </div>
            <div>
              GAMOT Facility:{" "}
              <span className="font-semibold">
                {slip.gamot_facility_name || "______________________"}
              </span>
            </div>
            <div>
              Accreditation No.:{" "}
              {slip.gamot_accreditation_no || "____________________"}
            </div>
          </div>

          <hr className="my-3 border-black" />

          {/* Items table */}
          <div className="text-xs mb-3">
            <div className="font-bold mb-1">
              List of medications availed under PhilHealth GAMOT
            </div>
            <table className="w-full border border-black border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-black px-1 py-1 w-6 text-left">
                    #
                  </th>
                  <th className="border border-black px-1 py-1 text-left">
                    Generic / Strength / Form
                  </th>
                  <th className="border border-black px-1 py-1 text-right">
                    Qty
                  </th>
                  <th className="border border-black px-1 py-1 text-right">
                    Unit Price
                  </th>
                  <th className="border border-black px-1 py-1 text-right">
                    Line Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-black px-1 py-2 text-center"
                    >
                      No dispensed items recorded.
                    </td>
                  </tr>
                )}
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="border border-black px-1 py-1">
                      {it.line_no}
                    </td>
                    <td className="border border-black px-1 py-1">
                      <div>{it.generic_name}</div>
                      <div>{it.dosage_strength}</div>
                      <div>{it.drug_formulation}</div>
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      {it.quantity_dispensed}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      ₱{formatMoney(it.unit_price)}
                    </td>
                    <td className="border border-black px-1 py-1 text-right">
                      ₱{formatMoney(it.price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & signatures */}
          <div className="text-xs mt-4 space-y-3">
            <div className="flex justify-end">
              <div className="space-y-1 text-right">
                <div>
                  Total Bill:&nbsp;
                  <span className="font-semibold">
                    ₱{formatMoney(slip.total)}
                  </span>
                </div>
                <div>
                  Amount Covered by PhilHealth:&nbsp;
                  <span className="font-semibold">
                    ₱{formatMoney(slip.amount_covered)}
                  </span>
                </div>
                <div>
                  Remaining Benefit Coverage:&nbsp;
                  <span className="font-semibold">
                    ₱{formatMoney(slip.remaining_coverage)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <div className="text-center">
                <div className="border-t border-black w-40 mx-auto" />
                <div className="mt-1">Patient / Representative</div>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-40 mx-auto" />
                <div className="mt-1">Pharmacist</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
