import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  children, 
  className = 'input-control', 
  style = {}, 
  dropdownStyle = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to extract options from React children (option elements)
  const extractOptions = (nodes) => {
    const list = [];
    React.Children.forEach(nodes, child => {
      if (!child) return;
      if (child.type === 'option') {
        list.push({
          value: child.props.value,
          label: child.props.children
        });
      } else if (child.props && child.props.children) {
        list.push(...extractOptions(child.props.children));
      }
    });
    return list;
  };

  const parsedOptions = options || extractOptions(children);
  const selectedOption = parsedOptions.find(o => String(o.value) === String(value)) || parsedOptions[0];

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  // Separate wrapper styles (layout) from trigger styles (appearance)
  const wrapperStyle = {
    position: 'relative',
    display: style.display || 'inline-block',
    width: style.width || '100%',
    minWidth: style.minWidth,
    margin: style.margin,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    marginLeft: style.marginLeft,
    marginRight: style.marginRight,
    flex: style.flex,
    alignSelf: style.alignSelf
  };

  const triggerStyle = {
    ...style,
    // Reset layout styles that belong to the wrapper
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    userSelect: 'none',
    width: '100%',
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    flex: 'none'
  };

  return (
    <div 
      ref={dropdownRef} 
      className={`custom-select-wrapper ${isOpen ? 'open' : ''}`} 
      style={wrapperStyle}
    >
      <div 
        className={className} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={triggerStyle}
      >
        <span>{selectedOption ? selectedOption.label : ''}</span>
        <ChevronDown 
          size={14} 
          style={{ 
            transition: 'transform 0.2s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            opacity: 0.7,
            marginLeft: '0.5rem',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && !disabled && (
        <div className="custom-select-dropdown" style={dropdownStyle}>
          {parsedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={`custom-select-option ${isSelected ? 'selected' : ''}`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} style={{ flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
