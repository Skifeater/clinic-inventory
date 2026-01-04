"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Alert } from "../../components/ui/Alert";

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
      <AppHeader showBack backHref="/" backLabel="Back to home" />

      <section className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PageHeader
            title="Create account"
            description="Register a Physician, Pharmacist, or Pharmacy Manager. This will be used for prescriptions and availment slips."
          />

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}
          {success && <Alert variant="success" className="mb-4">{success}</Alert>}

          <Card>
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <Input
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Dr. Juan Dela Cruz"
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />

              <Input
                label="Phone Number"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="09XXXXXXXXX"
              />

              <Input
                label="Birthday"
                type="date"
                name="birthday"
                value={form.birthday}
                onChange={handleChange}
              />

              <div className="flex flex-col">
                <label className="block text-xs font-medium mb-1.5 text-gray-700">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="physician">Physician</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="manager">Pharmacy Manager</option>
                </select>
              </div>

              <Input
                label="PRC Number (for Physician / Pharmacist)"
                name="prc_number"
                value={form.prc_number}
                onChange={handleChange}
                placeholder="XXXXX"
              />

              <Input
                label="PRC Validity"
                type="date"
                name="prc_validity"
                value={form.prc_validity}
                onChange={handleChange}
              />

              <Input
                label={`Name of GAMOT Facility${needsGamotFacility ? " *" : ""}`}
                name="gamot_facility_name"
                value={form.gamot_facility_name}
                onChange={handleChange}
                placeholder="GAMOT Pharmacy - BGC"
                required={needsGamotFacility}
                disabled={isPhysician}
              />

              <Input
                label={`PhilHealth Accreditation No. (GAMOT Facility)${needsGamotFacility ? " *" : ""}`}
                name="gamot_facility_philhealth_accreditation"
                value={form.gamot_facility_philhealth_accreditation}
                onChange={handleChange}
                required={needsGamotFacility}
                disabled={isPhysician}
              />

              <Input
                label={`Primary Care Benefit Provider Name${isPhysician ? " *" : ""}`}
                name="pcb_provider_name"
                value={form.pcb_provider_name}
                onChange={handleChange}
                placeholder="e.g. PhilHealth Konsulta Provider"
                required={isPhysician}
                disabled={needsGamotFacility}
              />

              <Input
                label={`PhilHealth Accreditation No. (PCBP Facility)${isPhysician ? " *" : ""}`}
                name="pcb_provider_philhealth_accreditation"
                value={form.pcb_provider_philhealth_accreditation}
                onChange={handleChange}
                required={isPhysician}
                disabled={needsGamotFacility}
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Creating account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </section>
    </main>
  );
}
