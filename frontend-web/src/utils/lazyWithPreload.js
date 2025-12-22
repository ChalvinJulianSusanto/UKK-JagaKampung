import { lazy } from 'react';

/**
 * Custom lazy wrapper yang menambahkan preload capability
 * Memungkinkan prefetching components sebelum user navigate
 */
export function lazyWithPreload(importFunc) {
  const LazyComponent = lazy(importFunc);

  // Add preload method
  LazyComponent.preload = importFunc;

  return LazyComponent;
}
