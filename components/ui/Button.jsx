export function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  asChild = false,
  ...props 
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (asChild) {
    const child = Array.isArray(children) ? children[0] : children;
    if (child && typeof child === 'object' && child.type) {
      return {
        ...child,
        props: {
          ...child.props,
          className: `${child.props?.className || ''} ${classes}`.trim(),
        },
      };
    }
  }
  
  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

