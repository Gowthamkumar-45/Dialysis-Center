import React, { createContext, useContext, useState, useEffect } from 'react';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [apiLoadingCount, setApiLoadingCount] = useState(0);
  const [loading, setLoading] = useState(false);

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
    let showTimer;
    let hideTimer;

    if (apiLoadingCount > 0) {
      // Debounce: Wait 250ms before showing the loader
      showTimer = setTimeout(() => {
        setLoading((current) => {
          if (!current) {
            window.loaderShowTime = Date.now();
            return true;
          }
          return current;
        });
      }, 250);
    } else {
      const showTime = window.loaderShowTime || 0;
      const elapsed = Date.now() - showTime;
      const minDuration = 400; // Force loader to display for at least 400ms to prevent quick flashing

      if (showTime && elapsed < minDuration) {
        const remaining = minDuration - elapsed;
        hideTimer = setTimeout(() => {
          setLoading(false);
          window.loaderShowTime = null;
        }, remaining);
      } else {
        setLoading(false);
        window.loaderShowTime = null;
      }
    }

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [apiLoadingCount]);

  return (
    <LoadingContext.Provider value={{ loading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};
