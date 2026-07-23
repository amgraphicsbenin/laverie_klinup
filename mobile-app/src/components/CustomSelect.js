import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Modal, Dimensions } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { db } from '../services/db';

export const CustomSelect = ({ value, onChange, options = [], placeholder, disabled, style, buttonStyle }) => {
  const isDarkMode = db.isDarkMode ? db.isDarkMode() : false;
  const styles = getStyles(isDarkMode);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 200 });
  const buttonRef = useRef(null);

  const safeOptions = Array.isArray(options) ? options : [];
  const selectedOption = safeOptions.find(o => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const windowH = Dimensions.get('window').height;
    const windowW = Dimensions.get('window').width;

    const computeAndOpen = (x, y, w, h) => {
      const menuMaxH = 200;
      let top = y + h + 4;
      if (top + menuMaxH > windowH && y - menuMaxH > 0) {
        top = Math.max(10, y - menuMaxH - 4);
      }
      let left = Math.max(8, Math.min(x, windowW - w - 8));
      setDropdownPos({ top, left, width: Math.max(w, 140) });
      setIsOpen(true);
    };

    if (buttonRef.current) {
      if (typeof buttonRef.current.getBoundingClientRect === 'function') {
        const rect = buttonRef.current.getBoundingClientRect();
        computeAndOpen(rect.left, rect.top, rect.width, rect.height);
      } else if (typeof buttonRef.current.measureInWindow === 'function') {
        buttonRef.current.measureInWindow((x, y, w, h) => {
          computeAndOpen(x, y, w, h);
        });
      } else {
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  };

  return (
    <View ref={buttonRef} style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={toggleDropdown}
        style={[styles.button, disabled && styles.disabledButton, buttonStyle]}
      >
        <Text style={[styles.buttonText, !selectedOption && styles.placeholderText]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Choisir --')}
        </Text>
        <ChevronDown size={16} color="#71717a" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={[
              styles.dropdownMenuModal,
              {
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
              }
            ]}
          >
            {safeOptions.length > 0 ? (
              <FlatList
                data={safeOptions}
                keyExtractor={(item) => String(item.value)}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}
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
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun choix disponible</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    width: '100%',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownMenuModal: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    maxHeight: 200,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 1000,
    overflow: 'hidden',
  },
  optionsList: {
    padding: 6,
    flexGrow: 0,
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
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#71717a',
  },
});

function getStyles(isDarkMode) {
  if (!isDarkMode) return baseStyles;

  const overrides = {
    button: { backgroundColor: '#09090b', borderColor: '#27272a' },
    disabledButton: { backgroundColor: '#18181b' },
    buttonText: { color: '#ffffff' },
    placeholderText: { color: '#a1a1aa' },
    dropdownMenuModal: { backgroundColor: '#121212', borderColor: '#27272a' },
    optionText: { color: '#d4d4d8' },
    selectedOptionItem: { backgroundColor: 'rgba(0, 44, 247, 0.15)' },
    selectedOptionText: { color: '#38bdf8' },
    emptyText: { color: '#a1a1aa' },
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
}
