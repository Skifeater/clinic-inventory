"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { PageContainer } from "../../../components/layout/PageContainer";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Alert } from "../../../components/ui/Alert";

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
    <PageContainer maxWidth="lg">
      <PageHeader
        title="PhilHealth GAMOT Prescription"
        description="Fill out the patient details and Rx for PhilHealth GAMOT."
        backHref="/dashboard"
        badge="Physician · Create Prescription"
      />

      <Card padding="lg">
        {errorMsg && <Alert variant="error" className="mb-4">{errorMsg}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* SECTION: PATIENT + HEADER */}
            <section className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Patient & Header
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  label="Date"
                  type="date"
                  value={header.date}
                  onChange={(e) =>
                    handleHeaderChange("date", e.target.value)
                  }
                />
                <Input
                  label="UPSC"
                  type="text"
                  value={header.upsc}
                  onChange={(e) =>
                    handleHeaderChange("upsc", e.target.value)
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <Input
                  label="Beneficiary Name"
                  type="text"
                  value={header.beneficiaryName}
                  onChange={(e) =>
                    handleHeaderChange("beneficiaryName", e.target.value)
                  }
                />

                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Age"
                    type="number"
                    value={header.age}
                    onChange={(e) =>
                      handleHeaderChange("age", e.target.value)
                    }
                  />
                  <div className="flex flex-col col-span-2">
                    <label className="block text-xs font-medium mb-1.5 text-gray-700">
                      Sex
                    </label>
                    <select
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

              <Input
                label="Address"
                type="text"
                value={header.address}
                onChange={(e) =>
                  handleHeaderChange("address", e.target.value)
                }
              />
            </section>

            {/* SECTION: DIAGNOSIS + PIN */}
            <section className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Diagnosis & PhilHealth
              </h2>
              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                  Diagnosis
                </label>
                <textarea
                  rows={2}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  value={header.diagnosis}
                  onChange={(e) =>
                    handleHeaderChange("diagnosis", e.target.value)
                  }
                />
              </div>
              <Input
                label="PhilHealth PIN (optional)"
                type="text"
                value={header.pin}
                onChange={(e) =>
                  handleHeaderChange("pin", e.target.value)
                }
              />
            </section>

            {/* SECTION: RX */}
            <section className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                Rx
                <span className="text-[11px] text-gray-400 font-normal">
                  You can select from list or type manually.
                </span>
              </h2>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white"
                >
                  <p className="text-xs font-semibold text-gray-700">
                    {index + 1}. Medication
                  </p>

                  {/* Dropdown */}
                  <div className="flex flex-col">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                      Select from medicine list (optional)
                    </label>
                    <select
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    <Input
                      label="Generic Name"
                      placeholder="e.g. Amoxicillin"
                      value={item.genericName}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "genericName",
                          e.target.value
                        )
                      }
                    />
                    <Input
                      label="Strength / Preparation"
                      placeholder="e.g. 500 mg capsule"
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

                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <Input
                        label="Sig."
                        placeholder="Take 1 tab every 8 hours for 7 days"
                        value={item.sig}
                        onChange={(e) =>
                          handleItemChange(index, "sig", e.target.value)
                        }
                      />
                    </div>
                    <Input
                      label="Qty"
                      placeholder="e.g. 30"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* SECTION: Follow-up */}
            <section className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/60">
              <h2 className="text-sm font-semibold text-gray-700">
                Follow-up (optional)
              </h2>
              <Input
                label="Follow-up Date"
                type="date"
                value={header.followUpDate}
                onChange={(e) =>
                  handleHeaderChange("followUpDate", e.target.value)
                }
              />
            </section>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Prescription"}
              </Button>
            </div>
          </form>
      </Card>
    </PageContainer>
  );
}
