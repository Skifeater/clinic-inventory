import Link from "next/link";

export function AppHeader({ 
  showBack = false, 
  backHref = "/",
  backLabel = "Back to home",
  rightContent = null
}) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              G
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">
                GAMOT e-Clinic
              </h1>
              <p className="text-xs text-gray-500">
                Inventory &amp; e-Prescription System
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {showBack && (
            <Link
              href={backHref}
              className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              ← {backLabel}
            </Link>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}


