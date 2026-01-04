export function PageContainer({ 
  children, 
  maxWidth = "4xl",
  className = "" 
}) {
  const maxWidthStyles = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
    "2xl": "max-w-6xl",
    full: "max-w-full",
  };
  
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className={`${maxWidthStyles[maxWidth]} mx-auto px-4 py-6 space-y-6 ${className}`}>
        {children}
      </div>
    </main>
  );
}

