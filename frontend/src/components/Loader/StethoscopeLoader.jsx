import React, { useEffect, useState } from 'react';
import { useLoading } from '../../context/LoadingContext';
import './StethoscopeLoader.css';
import { Stethoscope } from 'lucide-react';

const StethoscopeLoader = () => {
  const { loading } = useLoading();
  const [shouldRender, setShouldRender] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (loading) {
      setShouldRender(true);
      const frame = requestAnimationFrame(() => {
        // Delay slightly to let the browser register the newly mounted DOM element
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsTransitioning(false);
      // Match the 300ms transition duration in CSS
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!shouldRender) return null;

  return (
    <div className={`stethoscope-loader-overlay ${isTransitioning ? 'visible' : ''}`}>
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
