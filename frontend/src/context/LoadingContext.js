import React, { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [routeLoading, setRouteLoading] = useState(false);
  const [apiLoadingCount, setApiLoadingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const showLoading = () => setRouteLoading(true);
  const hideLoading = () => setRouteLoading(false);

  useEffect(() => {
    const handleStart = () => setApiLoadingCount((prev) => prev + 1);
    const handleEnd = () => setApiLoadingCount((prev) => Math.max(0, prev - 1));

    window.addEventListener('api-loading-start', handleStart);
    window.addEventListener('api-loading-end', handleEnd);

    return () => {
      window.removeEventListener('api-loading-start', handleStart);
      window.removeEventListener('api-loading-end', handleEnd);
    };
  }, []);

  useEffect(() => {
    if (routeLoading) {
      setLoading(true);
    } else if (apiLoadingCount > 0) {
      const timer = setTimeout(() => {
        setLoading(true);
      }, 200); // 200ms debounce to prevent loader from flashing on quick requests
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [routeLoading, apiLoadingCount]);

  return (
    <LoadingContext.Provider value={{ loading, showLoading, hideLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};
