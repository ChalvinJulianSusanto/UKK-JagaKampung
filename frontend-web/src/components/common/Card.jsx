import { motion } from 'framer-motion';

const Card = ({
  children,
  title,
  subtitle,
  className = '',
  noPadding = false,
  hover = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        bg-white rounded-lg shadow-md
        ${hover ? 'hover:shadow-lg transition-shadow duration-300' : ''}
        ${className}
      `}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-neutral-light">
          {title && <h3 className="text-lg font-semibold text-neutral-dark">{title}</h3>}
          {subtitle && <p className="text-sm text-neutral mt-1">{subtitle}</p>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </motion.div>
  );
};

export default Card;
