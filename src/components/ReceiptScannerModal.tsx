import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { ReceiptScanner } from '../components/ReceiptScanner';
import { ExtractedItem } from '../types';
import { addDays } from 'date-fns';

interface ReceiptScannerModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (items: ExtractedItem[]) => void;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
}) => {
  const handleItemsExtracted = (items: ExtractedItem[]) => {
    onConfirm(items);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        <ReceiptScanner
          onItemsExtracted={handleItemsExtracted}
          onCancel={onDismiss}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
