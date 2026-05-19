import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from '../../context/LoadingContext';
import './StethoscopeLoader.css';
import { Stethoscope } from 'lucide-react';

const StethoscopeLoader = () => {
  const { loading, showLoading, hideLoading } = useLoading();
  const location = useLocation();

  useEffect(() => {
    // Show page loader on navigation (pathname change)
    showLoading();
    const timer = setTimeout(() => {
      hideLoading();
    }, 450); // smooth page transition delay

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <div className="stethoscope-loader-overlay">
      <div className="stethoscope-loader-container">
        <div className="stethoscope-pulse-circle">
          <Stethoscope size={48} className="stethoscope-loader-icon" />
        </div>
        <div className="pulse-wave" />
        <div className="pulse-wave wave-delayed" />
        <span className="stethoscope-loader-text">Loading...</span>
      </div>
    </div>
  );
};

export default StethoscopeLoader;
