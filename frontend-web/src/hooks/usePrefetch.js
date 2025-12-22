import { useCallback } from 'react';

/**
 * Custom hook untuk prefetch lazy-loaded components
 * Membantu mempercepat transisi antar halaman dengan preload components
 */
export const usePrefetch = () => {
  const prefetch = useCallback((importFunc) => {
    // Prefetch komponen dengan memanggil import function
    // Lazy components akan di-cache oleh browser
    if (importFunc && typeof importFunc === 'function') {
      // Check if it's a lazy component
      if (importFunc._payload) {
        // Already a lazy component, trigger the import
        const payload = importFunc._payload;
        if (payload && typeof payload._result === 'undefined') {
          payload._result = payload._init(payload._payload);
        }
      }
    }
  }, []);

  return { prefetch };
};

/**
 * Utility function untuk prefetch route berdasarkan path
 */
export const prefetchRoute = (routePath, lazyComponents) => {
  const routeMap = {
    '/dashboard': 'Dashboard',
    '/users': 'Users',
    '/schedules': 'Schedules',
    '/attendances': 'Attendances',
    '/analytics': 'Analytics',
    '/reports': 'Reports',
    '/settings': 'Settings',
  };

  const componentName = routeMap[routePath];
  if (componentName && lazyComponents[componentName]) {
    const component = lazyComponents[componentName];
    // Trigger the lazy load by accessing the internal promise
    if (component._payload && component._payload._status === undefined) {
      component._payload._status = 0;
      const thenable = component._payload._result;
      if (!thenable) {
        return;
      }
    }
  }
};
