import Link from "next/link";

export function PageHeader({ 
  title, 
  description, 
  backHref, 
  backLabel = "Back to dashboard",
  badge,
  actions,
  className = ""
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top bar */}
      <div className="flex items-center justify-between">
        {backHref && (
          <Link
            href={backHref}
            className="text-xs text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← {backLabel}
          </Link>
        )}
        {badge && (
          <span className="text-[11px] text-gray-400 font-medium">
            {badge}
          </span>
        )}
        {!backHref && !badge && <div />}
      </div>

      {/* Heading */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}


