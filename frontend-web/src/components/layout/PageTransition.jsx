import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();

  // Variants untuk animasi yang lebih smooth dan cepat
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 4,
      scale: 0.99,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad untuk smooth motion
        when: 'beforeChildren',
        staggerChildren: 0.03,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      transition: {
        duration: 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
