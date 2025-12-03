// app/create-account/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient"; // adjust path if needed

type Role = "physician" | "pharmacist" | "manager";

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    birthday: "",
    role: "" as Role | "",
    prcNo: "",
    prcValidity: "",
    gamotFacilityName: "",
    gamotAccreditationNo: "",
    pcpName: "",
    pcpAccreditationNo: "",
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!form.email || !form.password || !form.fullName) {
      setErrorMsg("Please fill in at least Full Name, Email, and Password.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    // 1) Create auth user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (signUpError || !signUpData.user) {
      console.error(signUpError);
      setErrorMsg(signUpError?.message || "Error creating account.");
      setLoading(false);
      return;
    }

    const user = signUpData.user;

    // 2) Insert profile row
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: form.fullName,
      email: form.email.trim(),
      phone: form.phone || null,
      birthday: form.birthday || null,
      role: form.role || null,
      prc_num: form.prcNo || null,
      prc_validity: form.prcValidity || null,
      gamot_facility_name: form.gamotFacilityName || null,
      gamot_accreditation_no: form.gamotAccreditationNo || null,
      pcp_name: form.pcpName || null,
      pcp_accreditation_no: form.pcpAccreditationNo || null,
    });

    if (profileError) {
      console.error(profileError);
      setErrorMsg(profileError.message || "Error saving profile.");
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessMsg(
      "Account created successfully. Please check your email to confirm your account."
    );

    // Optional: redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const isPrescribingRole = form.role === "physician" || form.role === "pharmacist";

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Top bar (same style as Home) */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
              G
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                GAMOT e-Clinic
              </h1>
              <p className="text-xs text-gray-500">
                Inventory &amp; e-Prescription System
              </p>
            </div>
          </div>

          <span className="text-xs text-gray-400 hidden sm:inline">
            Create account
          </span>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 flex items-center">
        <div className="w-full max-w-3xl mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr] items-start">
            {/* Left: form card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-7 space-y-5">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Create an account</h2>
                <p className="text-sm text-gray-500">
                  Fill out your basic details and facility information. This will
                  be used for prescriptions and availment slips.
                </p>
              </div>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-3 py-2 rounded-md">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Full Name
                    </label>
                    <input
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                      value={form.fullName}
                      onChange={(e) => handleChange("fullName", e.target.value)}
                      placeholder="Dr. Juan Dela Cruz"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="name@clinic.ph"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Mobile Number
                      </label>
                      <input
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                        value={form.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Birthday
                      </label>
                      <input
                        type="date"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                        value={form.birthday}
                        onChange={(e) => handleChange("birthday", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Role
                      </label>
                      <select
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                        value={form.role}
                        onChange={(e) =>
                          handleChange("role", e.target.value as Role)
                        }
                      >
                        <option value="">Select role</option>
                        <option value="physician">Physician</option>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="manager">Pharmacy Manager</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* PRC & Professional */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                    Professional Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        PRC Number {isPrescribingRole && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                        value={form.prcNo}
                        onChange={(e) => handleChange("prcNo", e.target.value)}
                        placeholder="1234567"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        PRC Validity
                      </label>
                      <input
                        type="date"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                        value={form.prcValidity}
                        onChange={(e) =>
                          handleChange("prcValidity", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* GAMOT Facility */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                    GAMOT Facility
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Facility Name
                    </label>
                    <input
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                      value={form.gamotFacilityName}
                      onChange={(e) =>
                        handleChange("gamotFacilityName", e.target.value)
                      }
                      placeholder="ABC GAMOT Pharmacy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PhilHealth GAMOT Accreditation No.
                    </label>
                    <input
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                      value={form.gamotAccreditationNo}
                      onChange={(e) =>
                        handleChange("gamotAccreditationNo", e.target.value)
                      }
                      placeholder="PH-XXXX-YYYY"
                    />
                  </div>
                </div>

                {/* Primary Care Provider (optional) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                    Primary Care Benefit Provider (optional)
                  </h3>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PCP Provider Name
                    </label>
                    <input
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                      value={form.pcpName}
                      onChange={(e) => handleChange("pcpName", e.target.value)}
                      placeholder="XYZ Primary Care Clinic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PCP PhilHealth Accreditation No.
                    </label>
                    <input
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                      value={form.pcpAccreditationNo}
                      onChange={(e) =>
                        handleChange("pcpAccreditationNo", e.target.value)
                      }
                      placeholder="PCP-XXXX-YYYY"
                    />
                  </div>
                </div>

                {/* Password section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-[0.15em] text-gray-500 uppercase">
                    Login Credentials
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                        value={form.password}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          handleChange("confirmPassword", e.target.value)
                        }
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Your email may need to be confirmed before you can log in.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-60 shadow-sm"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </form>
            </div>

            {/* Right: helper text */}
            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-1">
                  How this information is used
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Your profile details appear on electronic prescriptions,
                  availment slips, and audit logs so PhilHealth and the
                  facility can verify transactions.
                </p>
                <ul className="text-xs text-gray-500 space-y-1.5 list-disc list-inside">
                  <li>PRC details are required for prescribing roles.</li>
                  <li>
                    Facility and accreditation numbers show on official forms.
                  </li>
                  <li>
                    You can update non-critical details later through the admin
                    or manager.
                  </li>
                </ul>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Log in here
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
