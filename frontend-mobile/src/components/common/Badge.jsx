const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className = '',
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary-dark',
    success: 'bg-success/10 text-success-dark',
    error: 'bg-error/10 text-error-dark',
    warning: 'bg-warning/10 text-warning-dark',
    hadir: 'bg-success/10 text-success-dark',
    tidak_hadir: 'bg-error/10 text-error-dark',
    approved: 'bg-success/10 text-success-dark',
    pending: 'bg-warning/10 text-warning-dark',
    rejected: 'bg-error/10 text-error-dark',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

export default Badge;
