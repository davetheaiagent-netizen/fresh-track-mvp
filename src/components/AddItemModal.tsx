import React, { useState } from 'react';
import { View, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, TextInput, Text, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ItemCategory } from '../types';
import { CATEGORY_DEFAULTS, inferCategory } from '../utils/expiryCalculator';

interface AddItemModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (name: string, expiryDate: string, category: ItemCategory) => void;
  initialName?: string;
  initialCategory?: ItemCategory;
}

const categories: { value: ItemCategory; label: string; icon: string }[] = [
  { value: 'dairy', label: 'Dairy', icon: '🥛' },
  { value: 'meat', label: 'Meat', icon: '🥩' },
  { value: 'produce', label: 'Produce', icon: '🥬' },
  { value: 'bakery', label: 'Bakery', icon: '🍞' },
  { value: 'pantry', label: 'Pantry', icon: '🥫' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onDismiss,
  onSubmit,
  initialName = '',
  initialCategory = 'other',
}) => {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<ItemCategory>(initialCategory);
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleNameChange = (text: string) => {
    setName(text);
    if (text.length > 2) {
      const inferred = inferCategory(text);
      if (inferred !== category) {
        setCategory(inferred);
      }
    }
  };

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), expiryDate.toISOString().split('T')[0], category);
      setName('');
      setCategory('other');
      setExpiryDate(new Date());
      onDismiss();
    }
  };

  const handleDismiss = () => {
    setName('');
    setCategory('other');
    setExpiryDate(new Date());
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <Text variant="headlineSmall" style={styles.title}>
            Add Item
          </Text>

          <TextInput
            label="Item name"
            value={name}
            onChangeText={handleNameChange}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Chicken breast, Bananas"
            autoFocus
          />

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Category (auto-detected)
          </Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <Button
                key={cat.value}
                mode={category === cat.value ? 'contained' : 'outlined'}
                onPress={() => setCategory(cat.value)}
                style={styles.categoryButton}
                compact
              >
                {cat.icon} {cat.label}
              </Button>
            ))}
          </View>

          <Text variant="labelLarge" style={styles.sectionLabel}>
            Expiry Date
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
          >
            {expiryDate.toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Button>

          {showDatePicker && (
            <DateTimePicker
              value={expiryDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setExpiryDate(date);
              }}
            />
          )}

          <View style={styles.actions}>
            <Button mode="outlined" onPress={handleDismiss} style={styles.actionButton}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.actionButton}
              disabled={!name.trim()}
            >
              Add Item
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  sectionLabel: {
    marginBottom: 8,
    color: '#6B7280',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryButton: {
    marginBottom: 4,
  },
  dateButton: {
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
