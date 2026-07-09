import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';

export const CustomSelect = ({ value, onChange, options, placeholder, disabled, style, buttonStyle }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        style={[styles.button, disabled && styles.disabledButton, buttonStyle]}
      >
        <Text style={[styles.buttonText, !selectedOption && styles.placeholderText]}>
          {selectedOption ? selectedOption.label : (placeholder || '-- Choisir --')}
        </Text>
        <ChevronDown size={16} color="#71717a" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder || 'Sélectionner'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.value)}
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
                    {isSelected && <Check size={16} color="#3b82f6" />}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#18181b',
  },
  optionsList: {
    paddingHorizontal: 16,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  selectedOptionItem: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  optionText: {
    fontSize: 13,
    color: '#52525b',
  },
  selectedOptionText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
