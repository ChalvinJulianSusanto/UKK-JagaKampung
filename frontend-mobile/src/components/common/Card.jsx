import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  icon: Icon,
  onClick,
  className = '',
  padding = 'default',
  hover = false,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    compact: 'p-2.5',
    sm: 'p-3',
    default: 'p-4',
    lg: 'p-6',
  };

  const baseClasses = `bg-white rounded-xl shadow-card transition-all duration-200 ${paddingClasses[padding]}`;
  const hoverClasses = hover ? 'hover:shadow-card-hover cursor-pointer active:scale-[0.98]' : '';
  const clickableClasses = onClick ? 'cursor-pointer active:scale-[0.98]' : '';

  const Component = onClick || hover ? motion.div : 'div';
  const motionProps = onClick || hover ? {
    whileTap: { scale: 0.98 },
    whileHover: { y: -2 },
  } : {};

  return (
    <Component
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`}
      {...motionProps}
      {...props}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-3 mb-3">
          {Icon && (
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {title && <h3 className="font-semibold text-gray-900 truncate">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 truncate">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </Component>
  );
};

export default Card;
