import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';

/**
 * Enhanced Link component dengan prefetching capabilities
 * Akan preload route saat user hover atau saat visible di viewport
 */
const PrefetchLink = ({
  to,
  children,
  onPrefetch,
  prefetchOnHover = true,
  prefetchOnVisible = false,
  className = '',
  ...props
}) => {
  const linkRef = useRef(null);
  const prefetchedRef = useRef(false);

  const handlePrefetch = () => {
    if (prefetchedRef.current || !onPrefetch) return;
    prefetchedRef.current = true;
    onPrefetch();
  };

  // Prefetch on hover
  const handleMouseEnter = () => {
    if (prefetchOnHover) {
      handlePrefetch();
    }
  };

  // Prefetch when visible in viewport (Intersection Observer)
  useEffect(() => {
    if (!prefetchOnVisible || !linkRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handlePrefetch();
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Prefetch sedikit sebelum visible
      }
    );

    observer.observe(linkRef.current);

    return () => {
      observer.disconnect();
    };
  }, [prefetchOnVisible]);

  return (
    <Link
      ref={linkRef}
      to={to}
      onMouseEnter={handleMouseEnter}
      className={className}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;
