import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { db } from '../services/db';

export const CustomSelect = ({ value, onChange, options, placeholder, disabled, style, buttonStyle }) => {
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;
  const styles = getStyles(isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, style, { zIndex: isOpen ? 9999 : 1 }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setIsOpen(!isOpen)}
        style={[styles.button, disabled && styles.disabledButton, buttonStyle]}
      >
        <Text style={[styles.buttonText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Choisir --')}
        </Text>
        <ChevronDown size={16} color="#71717a" />
      </TouchableOpacity>

      {isOpen && (
        <>
          {/* Transparent Backdrop to close dropdown on clicking outside */}
          <TouchableOpacity 
            activeOpacity={1} 
            style={styles.backdrop} 
            onPress={() => setIsOpen(false)} 
          />
          
          <View style={styles.dropdownMenu}>
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(value);
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.selectedOptionItem]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {item.label}
                    </Text>
                    {isSelected && <Check size={14} color="#002cf7" />}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
            />
          </View>
        </>
      )}
    </View>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  button: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: '#f4f4f5',
  },
  buttonText: {
    fontSize: 13,
    color: '#18181b',
  },
  placeholderText: {
    color: '#a1a1aa',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    backgroundColor: 'transparent',
    zIndex: 9998,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    maxHeight: 180,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  optionsList: {
    padding: 6,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  selectedOptionItem: {
    backgroundColor: '#eff6ff',
  },
  optionText: {
    fontSize: 13,
    color: '#3f3f46',
  },
  selectedOptionText: {
    color: '#002cf7',
    fontWeight: '600',
  },
});

function getStyles(isDarkMode) {
  if (!isDarkMode) return baseStyles;
  
  const overrides = {
    button: { backgroundColor: '#0f172a', borderColor: '#334155' },
    disabledButton: { backgroundColor: '#1e293b' },
    buttonText: { color: '#ffffff' },
    placeholderText: { color: '#64748b' },
    dropdownMenu: { backgroundColor: '#1e293b', borderColor: '#334155' },
    optionText: { color: '#cbd5e1' },
    selectedOptionItem: { backgroundColor: 'rgba(0, 44, 247, 0.15)' },
    selectedOptionText: { color: '#38bdf8' },
  };

  const merged = {};
  Object.keys(baseStyles).forEach(key => {
    if (overrides[key]) {
      merged[key] = { ...StyleSheet.flatten(baseStyles[key]), ...overrides[key] };
    } else {
      merged[key] = baseStyles[key];
    }
  });
  return merged;
};
