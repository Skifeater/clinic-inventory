"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

export default function PrescriptionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [rx, setRx] = useState(null);
  const [items, setItems] = useState([]);
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

      // optional: only allow physician who owns it
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "physician") {
        router.push("/dashboard");
        return;
      }

      const { data: presc, error: rxError } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", id)
        .single();

      if (rxError || !presc) {
        console.error(rxError);
        setErrorMsg("Prescription not found.");
        setLoading(false);
        return;
      }

      // enforce ownership
      if (presc.physician_id !== user.id) {
        setErrorMsg("You are not allowed to view this prescription.");
        setLoading(false);
        return;
      }

      const { data: rxItems, error: itemsError } = await supabase
        .from("prescription_items")
        .select("*")
        .eq("prescription_id", id)
        .order("line_no");

      if (itemsError) console.error(itemsError);

      setRx(presc);
      setItems(rxItems || []);
      setLoading(false);
    };

    if (id) load();
  }, [id, router]);

  if (loading) return <div className="p-4">Loading...</div>;

  if (errorMsg)
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4">
        <button
          className="text-xs text-slate-400 hover:text-slate-200 mb-2"
          onClick={() => router.back()}
        >
          ← Back
        </button>
        <p>{errorMsg}</p>
      </main>
    );

  if (!rx) return null;

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "");

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 print:bg-white print:text-black">
        {/* Top bar (hidden when printing) */}
        <div className="flex justify-between items-center mb-4 print:hidden">
          <button
            className="text-xs text-slate-400 hover:text-slate-200"
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <div className="space-x-2">
            <button
              className="px-3 py-1 rounded bg-emerald-500 text-slate-900 text-xs font-medium hover:bg-emerald-400"
              onClick={() => window.print()}
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

                {/* PhilHealth-style sheet with watermark */}
        <div className="relative bg-white text-black p-6 rounded shadow print:shadow-none print:p-0">
          {/* WATERMARK */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 print:opacity-10">
            <img
              src="/watermark-med.png"
              alt="Medical watermark"
              className="max-w-xs md:max-w-sm"
            />
          </div>

          {/* ACTUAL CONTENT */}
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h1 className="text-lg font-bold">
                  PhilHealth GAMOT Prescription
                </h1>
                <p className="text-xs">
                  Rx Code: <span className="font-mono">{rx.rx_code}</span>
                </p>
              </div>
              <div className="text-xs text-right">
                <div>Date: {formatDate(rx.date)}</div>
                <div>UPSC: {rx.upsc || "_________"}</div>
              </div>
            </div>

            <hr className="my-3 border-black" />

            {/* Patient info */}
            <div className="text-xs space-y-1 mb-3">
              <div className="flex justify-between">
                <span>
                  Beneficiary Name:{" "}
                  <span className="font-semibold">
                    {rx.beneficiary_name || "________________"}
                  </span>
                </span>
                <span>
                  Age: {rx.age || "____"} &nbsp; Sex: {rx.sex || "___"}
                </span>
              </div>
              <div>
                Address: {rx.address || "__________________________________"}
              </div>
              <div>
                Diagnosis: {rx.diagnosis || "________________________________"}
              </div>
              <div>
                PhilHealth PIN: {rx.pin || "______________________"}
              </div>
            </div>

            <hr className="my-3 border-black" />

            {/* Rx items */}
            <div className="text-xs mb-3">
              <div className="font-bold mb-1">Rx</div>
              <table className="w-full border border-black border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="border border-black px-1 py-1 w-6 text-left">
                      #
                    </th>
                    <th className="border border-black px-1 py-1 text-left">
                      Generic Name / Strength / Form
                    </th>
                    <th className="border border-black px-1 py-1 text-left">
                      Sig. (Intake Instructions)
                    </th>
                    <th className="border border-black px-1 py-1 w-12 text-right">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-black px-1 py-2 text-center"
                      >
                        No medicines encoded.
                      </td>
                    </tr>
                  )}
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="border border-black px-1 py-1 align-top">
                        {it.line_no}
                      </td>
                      <td className="border border-black px-1 py-1 align-top">
                        <div>{it.generic_name || ""}</div>
                        <div>{it.dosage_strength || ""}</div>
                        <div>{it.dosage_form || ""}</div>
                      </td>
                      <td className="border border-black px-1 py-1 align-top">
                        {it.sig || ""}
                      </td>
                      <td className="border border-black px-1 py-1 text-right align-top">
                        {it.quantity || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Follow-up + signature */}
            <div className="text-xs mt-4 space-y-4">
              <div>
                Follow-up Date:&nbsp;
                <span className="font-semibold">
                  {formatDate(rx.follow_up_date) || "__________________"}
                </span>
              </div>

              <div className="flex justify-end mt-8">
                <div className="text-center">
                  <div className="border-t border-black w-48 mx-auto" />
                  <div>{rx.physician_name || "Physician Signature"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
