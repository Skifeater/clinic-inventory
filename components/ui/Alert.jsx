export function Alert({ 
  children, 
  variant = "error", 
  className = "",
  ...props 
}) {
  const variants = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border-amber-200 text-amber-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };
  
  return (
    <div
      className={`border rounded-lg px-3 py-2.5 text-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}


