import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {React.cloneElement(trigger, { onClick: handleToggle })}
      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50 p-1"
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
};
