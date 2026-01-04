"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { PageContainer } from "../../components/layout/PageContainer";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
      }

      const user = session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile error:", error);
      } else {
        setProfile(data);
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </Card>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <Card>
          <p className="text-sm text-gray-500">No profile found.</p>
        </Card>
      </PageContainer>
    );
  }

  const { full_name, role } = profile;

  return (
    <PageContainer maxWidth="lg">
      <PageHeader
        title="GAMOT e-Clinic Dashboard"
        description={
          <>
            Welcome{full_name ? `, ${full_name}` : ""}!{" "}
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
              {role}
            </span>
          </>
        }
        actions={
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            Logout
          </Button>
        }
      />

      <Card>
        {/* PHYSICIAN VIEW */}
        {role === "physician" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Physician tools
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                className="border border-gray-200 rounded-xl p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => router.push("/physician/prescription")}
              >
                <div className="font-semibold text-gray-900">
                  PhilHealth GAMOT Prescription
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Create a new prescription for a PhilHealth GAMOT patient.
                </div>
              </button>

              <button
                className="border border-gray-200 rounded-xl p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => router.push("/physician/prescriptions")}
              >
                <div className="font-semibold text-gray-900">
                  My Prescriptions
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  View or print previous prescriptions.
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PHARMACIST VIEW */}
        {role === "pharmacist" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">
              Pharmacist tools
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                className="border border-gray-200 rounded-xl p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => router.push("/pharmacist/search-rx")}
              >
                <div className="font-semibold text-gray-900">
                  Search Prescription (GAMOT)
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Search Rx by code or patient to fill PhilHealth GAMOT
                  Availment Slip.
                </div>
              </button>

              <button
                className="border border-gray-200 rounded-xl p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => router.push("/pharmacist/availments")}
              >
                <div className="font-semibold text-gray-900">
                  My Availment Slips
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  View previously submitted availment slips.
                </div>
              </button>

              <button
                className="border border-gray-200 rounded-xl p-4 text-left bg-white hover:bg-gray-50 transition-colors"
                onClick={() => router.push("/pharmacist/inventory")}
              >
                <div className="font-semibold text-gray-900">
                  Inventory
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  View and adjust current medicine stock.
                </div>
              </button>
            </div>
          </div>
        )}

        {/* MANAGER / OTHER ROLES */}
        {role === "manager" && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">
              Facility tools
            </h2>
            <p className="text-sm text-gray-600">
              (Here you can later add reports, statistics, and other facility
              management tools.)
            </p>
          </div>
        )}

        {/* Fallback for any other role */}
        {role !== "physician" &&
          role !== "pharmacist" &&
          role !== "manager" && (
            <p className="text-sm text-gray-600">
              Your role does not have specific tools configured yet.
            </p>
          )}
      </Card>
    </PageContainer>
  );
}
