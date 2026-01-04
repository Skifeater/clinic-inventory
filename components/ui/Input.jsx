export function Input({ 
  label, 
  error, 
  className = "", 
  required = false,
  ...props 
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="block text-xs font-medium mb-1.5 text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        className={`w-full bg-white border ${error ? "border-red-300" : "border-gray-300"} rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

