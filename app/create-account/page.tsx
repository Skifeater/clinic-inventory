"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

const initialForm = {
  full_name: "",
  phone_number: "",
  email: "",
  birthday: "",
  role: "physician", // must match DB check: 'physician' | 'pharmacist' | 'manager'
  prc_number: "",
  prc_validity: "",
  gamot_facility_name: "",
  gamot_facility_philhealth_accreditation: "",
  pcb_provider_name: "",
  pcb_provider_philhealth_accreditation: "",
  password: "",
  confirm_password: "",
};

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isPhysician = form.role === "physician";
  const isPharmacist = form.role === "pharmacist";
  const isManager = form.role === "manager";
  const needsGamotFacility = isPharmacist || isManager;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!form.full_name || !form.email || !form.role) {
      setError("Full name, email, and role are required.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    // Role-specific validation
    if (isPhysician) {
      if (!form.pcb_provider_name || !form.pcb_provider_philhealth_accreditation) {
        setError(
          "Primary Care Benefit Provider name and PhilHealth accreditation are required for physicians."
        );
        return;
      }
    }

    if (needsGamotFacility) {
      if (
        !form.gamot_facility_name ||
        !form.gamot_facility_philhealth_accreditation
      ) {
        setError(
          "GAMOT facility name and PhilHealth accreditation are required for pharmacists and pharmacy managers."
        );
        return;
      }
    }

    setSubmitting(true);

    // 1️⃣ Create auth user
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

    if (signUpError || !signUpData.user) {
      console.error(signUpError);
      setSubmitting(false);
      setError(
        signUpError?.message ||
          "Failed to create account (email may already exist)."
      );
      return;
    }

    const authUser = signUpData.user;

    // 2️⃣ Insert into `profiles` table, linked by id = auth user id
    const { error: profileError } = await supabase.from("profiles").insert([
      {
        id: authUser.id,
        full_name: form.full_name,
        phone: form.phone_number || null,
        email: form.email,
        birthday: form.birthday || null,
        role: form.role,
        prc_number: form.prc_number || null,
        prc_validity: form.prc_validity || null,
        gamot_facility_name: needsGamotFacility ? form.gamot_facility_name : null,
        gamot_accreditation_no: needsGamotFacility
          ? form.gamot_facility_philhealth_accreditation
          : null,
        pcb_provider_name: isPhysician ? form.pcb_provider_name : null,
        pcb_provider_philhealth_accreditation: isPhysician
          ? form.pcb_provider_philhealth_accreditation
          : null,
      },
    ]);

    setSubmitting(false);

    if (profileError) {
      console.error(profileError);
      setError(
        profileError.message || "Auth user created, but failed to save profile."
      );
      return;
    }


    setForm(initialForm);
    setSuccess("Account created successfully. You can now log in.");
    // If you want to auto-redirect instead of message:
    // router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold text-sm text-gray-900">
            GAMOT e-Clinic
          </Link>
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-5">
            Register a Physician, Pharmacist, or Pharmacy Manager. This will be
            used for prescriptions and availment slips.
          </p>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            {/* Full name */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Full Name *
              </label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="Dr. Juan Dela Cruz"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="name@example.com"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Phone Number
              </label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="09XXXXXXXXX"
              />
            </div>

            {/* Birthday */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={form.birthday}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
              />
            </div>

            {/* Role */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Role *
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="physician">Physician</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="manager">Pharmacy Manager</option>
              </select>
            </div>

            {/* PRC number */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                PRC Number (for Physician / Pharmacist)
              </label>
              <input
                name="prc_number"
                value={form.prc_number}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="XXXXX"
              />
            </div>

            {/* PRC validity */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                PRC Validity
              </label>
              <input
                type="date"
                name="prc_validity"
                value={form.prc_validity}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
              />
            </div>

            {/* GAMOT facility name */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Name of GAMOT Facility{" "}
                {needsGamotFacility && <span className="text-red-500">*</span>}
              </label>
              <input
                name="gamot_facility_name"
                value={form.gamot_facility_name}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="GAMOT Pharmacy - BGC"
                required={needsGamotFacility}
                disabled={isPhysician}
              />
            </div>

            {/* GAMOT facility PhilHealth */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                PhilHealth Accreditation No. (GAMOT Facility){" "}
                {needsGamotFacility && <span className="text-red-500">*</span>}
              </label>
              <input
                name="gamot_facility_philhealth_accreditation"
                value={form.gamot_facility_philhealth_accreditation}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                required={needsGamotFacility}
                disabled={isPhysician}
              />
            </div>

            {/* PCB provider name */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Primary Care Benefit Provider Name{" "}
                {isPhysician && <span className="text-red-500">*</span>}
              </label>
              <input
                name="pcb_provider_name"
                value={form.pcb_provider_name}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="e.g. PhilHealth Konsulta Provider"
                required={isPhysician}
                disabled={needsGamotFacility}
              />
            </div>

            {/* PCB provider PhilHealth */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                PhilHealth Accreditation No. (PCBP Facility){" "}
                {isPhysician && <span className="text-red-500">*</span>}
              </label>
              <input
                name="pcb_provider_philhealth_accreditation"
                value={form.pcb_provider_philhealth_accreditation}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                required={isPhysician}
                disabled={needsGamotFacility}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm password */}
            <div className="flex flex-col">
              <label className="text-xs font-medium mb-1 text-gray-700">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
              >
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
