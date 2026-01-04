import Link from "next/link";
import { AppHeader } from "../components/layout/AppHeader";
import { Button } from "../components/ui/Button";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <AppHeader
        rightContent={
          <>
            <span className="hidden sm:inline text-[11px] text-gray-400">
              Prototype · v0.1
            </span>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          </>
        }
      />

      {/* Main content */}
      <section className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-4 py-10 grid gap-10 md:grid-cols-[1.3fr,1fr] items-center">
          {/* Left side – hero text */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-semibold leading-tight">
              One workspace for{" "}
              <span className="text-emerald-600">Physicians</span> and{" "}
              <span className="text-emerald-600">Pharmacists</span> in
              PhilHealth GAMOT facilities.
            </h2>

            <p className="text-sm md:text-base text-gray-600 max-w-xl">
              Encode PhilHealth GAMOT prescriptions, generate availment slips,
              and keep your medicine inventory updated in a simple, clean web
              app designed for small clinics and primary care facilities.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 shadow-sm hover:shadow-md transition-all duration-150"
              >
                Login to GAMOT e-Clinic
              </Link>

              <Link
                href="/create-account"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-all duration-150"
              >
                Create an account
              </Link>
            </div>

            {/* Bullets */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Role-based access: Physician / Pharmacist / Manager
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tracks PRC & PhilHealth facility accreditation
              </div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Linked prescription → availment → inventory
              </div>
            </div>
          </div>

          {/* Right side – role cards */}
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-400">
              How it’s used
            </p>

            <div className="space-y-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold">Physician</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Create PhilHealth GAMOT prescriptions, sign electronically,
                  and review previous Rx with diagnosis and follow-up dates.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold">Pharmacist</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Search prescriptions, generate PhilHealth availment slips, and
                  automatically deduct dispensed medicines from inventory.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold">Pharmacy Manager</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Monitor inventory levels, oversee user accounts, and keep
                  facility and accreditation information up to date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 text-[11px] text-gray-500 flex items-center justify-between">
          <span>© {year} GAMOT e-Clinic</span>
          <span>Prototype for internal use · Not for production</span>
        </div>
      </footer>
    </main>
  );
}
