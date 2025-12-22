// Route preloader untuk prefetch pages saat user hover/idle
const preloadedRoutes = new Set();

/**
 * Preload lazy-loaded route component
 * @param {Function} lazyComponent - Lazy loaded component
 * @returns {Promise}
 */
export const preloadRoute = (lazyComponent) => {
  if (!lazyComponent || typeof lazyComponent !== 'function') {
    return Promise.resolve();
  }

  const componentKey = lazyComponent.toString();

  // Skip jika sudah pernah di-preload
  if (preloadedRoutes.has(componentKey)) {
    return Promise.resolve();
  }

  preloadedRoutes.add(componentKey);

  // Trigger lazy load
  return lazyComponent()
    .then(() => {
      console.log('✓ Route preloaded successfully');
    })
    .catch((error) => {
      console.error('✗ Failed to preload route:', error);
      preloadedRoutes.delete(componentKey); // Remove from set jika gagal
    });
};

/**
 * Preload multiple routes sekaligus
 * @param {Array} lazyComponents - Array of lazy loaded components
 */
export const preloadRoutes = (lazyComponents) => {
  return Promise.all(
    lazyComponents.map(component => preloadRoute(component))
  );
};

/**
 * Clear preloaded routes cache
 */
export const clearPreloadCache = () => {
  preloadedRoutes.clear();
};

export default {
  preloadRoute,
  preloadRoutes,
  clearPreloadCache,
};
