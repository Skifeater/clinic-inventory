"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function PhysicianPrescriptionPage() {
  const router = useRouter();

  // ---- HEADER / PATIENT FORM STATE ----
  const [header, setHeader] = useState({
    date: "",
    upsc: "",
    beneficiaryName: "",
    age: "",
    sex: "",
    address: "",
    diagnosis: "",
    pin: "",
    followUpDate: "",
  });

  // Medicines list from DB (for dropdown)
  const [medOptions, setMedOptions] = useState([]);

  // 3 medicine lines (now with medicineId)
  const [items, setItems] = useState([
    { medicineId: "", genericName: "", dosageStrength: "", sig: "", quantity: "" },
    { medicineId: "", genericName: "", dosageStrength: "", sig: "", quantity: "" },
    { medicineId: "", genericName: "", dosageStrength: "", sig: "", quantity: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Prefill date + load medicines list
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setHeader((prev) => ({
      ...prev,
      date: prev.date || today,
    }));

    const loadMeds = async () => {
      const { data, error } = await supabase
        .from("medicines")
        .select("id, name, preparation, is_active")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Medicines load error:", error);
      } else {
        setMedOptions(data || []);
      }
    };

    loadMeds();
  }, []);

  // ---- HANDLERS ----
  const handleHeaderChange = (field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleMedicineSelect = (index, medicineId) => {
    setItems((prev) => {
      const copy = [...prev];
      const med = medOptions.find((m) => m.id === medicineId) || null;

      copy[index] = {
        ...copy[index],
        medicineId,
        genericName: med ? med.name : "",
        dosageStrength: med ? med.preparation : "",
      };

      return copy;
    });
  };

  // ---- SUBMIT TO SUPABASE ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    // get session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(sessionError);
    }

    const user = session?.user;

    if (!user) {
      setErrorMsg("You must be logged in.");
      setSaving(false);
      router.push("/login");
      return;
    }

    // check role = physician
    const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role, full_name")
  .eq("id", user.id)
  .single();


    if (profileError || !profile || profile.role !== "physician") {
      setErrorMsg("Only physicians can create prescriptions.");
      setSaving(false);
      router.push("/dashboard");
      return;
    }

    const rxCode = `RX-${new Date().getFullYear()}-${Math.floor(
      Math.random() * 1e6
    )
      .toString()
      .padStart(6, "0")}`;

    // 1) insert into prescriptions
    const { data: presc, error: prescError } = await supabase
  .from("prescriptions")
  .insert({
    rx_code: rxCode,
    physician_id: user.id,
    physician_name: profile.full_name,   
    date: header.date,
    upsc: header.upsc,
    beneficiary_name: header.beneficiaryName,
    age: header.age ? Number(header.age) : null,
    sex: header.sex,
    address: header.address,
    diagnosis: header.diagnosis,
    pin: header.pin,
    follow_up_date: header.followUpDate || null,
  })
  .select("id, rx_code")
  .single();


    if (prescError) {
      console.error("Prescription insert error:", prescError);
      setErrorMsg(prescError.message);
      setSaving(false);
      return;
    }

    // 2) insert medicine lines into prescription_items
    const itemsToSave = items
      .map((item, i) => ({
        prescription_id: presc.id,
        line_no: i + 1,
        medicine_id: item.medicineId || null,
        generic_name: item.genericName,
        dosage_strength: item.dosageStrength,
        dosage_form: null, // removed from UI, store null
        sig: item.sig,
        quantity: item.quantity ? Number(item.quantity) : null,
      }))
      .filter(
        (r) =>
          r.generic_name ||
          r.dosage_strength ||
          r.sig ||
          r.quantity
      );

    if (itemsToSave.length > 0) {
      const { error: itemError } = await supabase
        .from("prescription_items")
        .insert(itemsToSave);

      if (itemError) {
        console.error(itemError);
        setErrorMsg("Error saving medicines.");
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    alert(`Prescription saved. RX Code: ${presc.rx_code}`);
    router.push(`/physician/prescriptions/${presc.id}`);
  };

  // ---- RENDER ----
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-gray-500 hover:text-gray-700 mb-3"
        >
          ← Back to dashboard
        </button>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                PhilHealth GAMOT Prescription
              </h1>
              <p className="text-xs text-gray-500">
                Fill out the patient details and Rx for PhilHealth GAMOT.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SECTION: PATIENT + HEADER */}
            <section className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Patient & Header
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                    value={header.date}
                    onChange={(e) =>
                      handleHeaderChange("date", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    UPSC
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                    value={header.upsc}
                    onChange={(e) =>
                      handleHeaderChange("upsc", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Beneficiary Name
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                    value={header.beneficiaryName}
                    onChange={(e) =>
                      handleHeaderChange("beneficiaryName", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Age
                    </label>
                    <input
                      type="number"
                      className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                      value={header.age}
                      onChange={(e) =>
                        handleHeaderChange("age", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Sex
                    </label>
                    <select
                      className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                      value={header.sex}
                      onChange={(e) =>
                        handleHeaderChange("sex", e.target.value)
                      }
                    >
                      <option value="">---</option>
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                  value={header.address}
                  onChange={(e) =>
                    handleHeaderChange("address", e.target.value)
                  }
                />
              </div>
            </section>

            {/* SECTION: DIAGNOSIS + PIN */}
            <section className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Diagnosis & PhilHealth
              </h2>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Diagnosis
                </label>
                <textarea
                  rows={2}
                  className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                  value={header.diagnosis}
                  onChange={(e) =>
                    handleHeaderChange("diagnosis", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  PhilHealth PIN (optional)
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                  value={header.pin}
                  onChange={(e) =>
                    handleHeaderChange("pin", e.target.value)
                  }
                />
              </div>
            </section>

            {/* SECTION: RX */}
            <section className="border border-gray-200 rounded-lg p-3 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                Rx
                <span className="text-[11px] text-gray-400 font-normal">
                  You can select from list or type manually.
                </span>
              </h2>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-3 space-y-2 bg-white"
                >
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    {index + 1}. Medication
                  </p>

                  {/* Dropdown */}
                  <div>
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Select from medicine list (optional)
                    </label>
                    <select
                      className="border border-gray-300 rounded w-full px-2 py-1 text-xs bg-white text-black"
                      value={item.medicineId || ""}
                      onChange={(e) =>
                        handleMedicineSelect(index, e.target.value)
                      }
                    >
                      <option value="">
                        -- Select or leave blank to type manually --
                      </option>
                      {medOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} – {m.preparation}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Manual text fields */}
                  <div className="grid md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Generic Name
                      </label>
                      <input
                        placeholder="e.g. Amoxicillin"
                        className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                        value={item.genericName}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "genericName",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Strength / Preparation
                      </label>
                      <input
                        placeholder="e.g. 500 mg capsule"
                        className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                        value={item.dosageStrength}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "dosageStrength",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Sig.
                      </label>
                      <input
                        placeholder="Take 1 tab every 8 hours for 7 days"
                        className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                        value={item.sig}
                        onChange={(e) =>
                          handleItemChange(index, "sig", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">
                        Qty
                      </label>
                      <input
                        placeholder="e.g. 30"
                        className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* SECTION: Follow-up */}
            <section className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Follow-up (optional)
              </h2>
              <div className="grid md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    className="border border-gray-300 rounded w-full px-2 py-1 text-sm bg-white text-black"
                    value={header.followUpDate}
                    onChange={(e) =>
                      handleHeaderChange("followUpDate", e.target.value)
                    }
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-md bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Prescription"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
