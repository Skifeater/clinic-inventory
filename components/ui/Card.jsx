export function Card({ children, className = "", padding = "md", ...props }) {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  };
  
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}


