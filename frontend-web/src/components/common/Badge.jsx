const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variants = {
    default: 'bg-neutral/20 text-neutral-dark',
    primary: 'bg-primary/20 text-primary',
    success: 'bg-success/20 text-success',
    error: 'bg-error/20 text-error',
    warning: 'bg-warning/20 text-warning',
    secondary: 'bg-secondary/20 text-neutral-dark',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {children}
    </span>
  );
};

export default Badge;
