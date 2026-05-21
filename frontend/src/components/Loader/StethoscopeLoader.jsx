import React from 'react';
import { useLoading } from '../../context/LoadingContext';
import './StethoscopeLoader.css';
import { Stethoscope } from 'lucide-react';

const StethoscopeLoader = () => {
  const { loading } = useLoading();

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
