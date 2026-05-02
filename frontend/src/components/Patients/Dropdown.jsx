import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './Dropdown.css';

const Dropdown = ({ label, options, selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div className="dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <span>{selected || label}</span>
        <ChevronDown size={18} className={isOpen ? 'rotate' : ''} />
      </div>
      
      {isOpen && (
        <div className="dropdown-menu animate-slide-down">
          {options.map((option) => (
            <div 
              key={option} 
              className={`dropdown-item ${selected === option ? 'selected' : ''}`}
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
            >
              <span>{option}</span>
              {selected === option && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
