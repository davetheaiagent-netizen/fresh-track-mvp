import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Button, Text, Card, TextInput, Chip, ActivityIndicator } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { supabase, getCurrentUser } from './supabase';
import { ExtractedItem, ItemCategory } from '../types';
import { inferCategory, suggestExpiryDate, CATEGORY_DEFAULTS } from '../utils/expiryCalculator';

interface ReceiptScannerProps {
  onItemsExtracted: (items: ExtractedItem[]) => void;
  onCancel: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onItemsExtracted,
  onCancel,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [storeName, setStoreName] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processReceipt(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      processReceipt(result.assets[0].uri);
    }
  };

  const processReceipt = async (uri: string) => {
    setProcessing(true);
    
    try {
      const base64 = await fetch(uri)
        .then(res => res.blob())
        .then(blob => new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]);
          };
          reader.readAsDataURL(blob);
        }));

      const response = await fetch('https://vision.googleapis.com/v1/images:annotate?key=' + 
        (process.env.EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY || ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.responses?.[0]?.textAnnotations?.[0]?.description || '';
      
      const items = parseReceiptText(text);
      setExtractedItems(items);
      
      const detectedStore = detectStoreName(text);
      setStoreName(detectedStore);
      
    } catch (error) {
      console.error('Receipt processing error:', error);
      Alert.alert('Error', 'Failed to process receipt. Please try again or add items manually.');
    } finally {
      setProcessing(false);
    }
  };

  const parseReceiptText = (text: string): ExtractedItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const items: ExtractedItem[] = [];
    
    const commonFoodKeywords = [
      'milk', 'bread', 'butter', 'cheese', 'egg', 'yogurt', 'cream',
      'chicken', 'beef', 'pork', 'fish', 'salmon', 'bacon', 'sausage',
      'apple', 'banana', 'orange', 'tomato', 'lettuce', 'spinach', 'carrot',
      'onion', 'potato', 'broccoli', 'pepper', 'mushroom', 'avocado',
      'rice', 'pasta', 'noodle', 'cereal', 'soup', 'sauce',
      'chicken', 'turkey', 'lamb', 'steak', 'mince', 'fillet',
      'milk', 'skim', 'semi', 'whole', 'oat', 'almond',
      'bread', 'bagel', 'muffin', 'roll', 'croissant',
      'yogurt', 'yoghurt', 'Greek', 'flavored',
      'butter', 'margarine', 'spread',
      'juice', 'water', 'soda', 'drink',
      'fruit', 'vegetable', 'salad', 'fresh',
      'frozen', 'ice', 'pizza', 'fries',
      'coffee', 'tea', 'sugar', 'salt', 'pepper',
      'oil', 'vinegar', 'flour', 'baking',
      'chocolate', 'biscuit', 'cookie', 'cake', 'sweet',
      'crisps', 'chips', 'nuts', 'snack',
      'ham', 'cheese', 'pasta', 'lasagna', 'pizza',
      'bacon', 'sausage', 'soup', 'stew', 'curry'
    ];

    const priceRegex = /[£$]?\d+[.,]\d{2}\s*$/;
    const quantityRegex = /^(x?\d+|half|one|two|three|three|four|five)/i;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      const hasFoodKeyword = commonFoodKeywords.some(keyword => 
        lowerLine.includes(keyword)
      );
      
      const hasPrice = priceRegex.test(line);
      const hasQuantity = quantityRegex.test(line.trim());
      
      if ((hasFoodKeyword || hasQuantity) && hasPrice) {
        const cleanLine = line
          .replace(priceRegex, '')
          .replace(/^\d+\s*/, '')
          .replace(/@\s*[\d.,]+\s*/, '')
          .replace(/x\d+\s*/gi, '')
          .replace(/\s{2,}/g, ' ')
          .trim();

        if (cleanLine.length > 2 && cleanLine.length < 50) {
          const category = inferCategory(cleanLine);
          const suggestedExpiry = suggestExpiryDate(cleanLine);

          items.push({
            name: cleanLine,
            inferred_category: category,
            suggested_expiry_days: CATEGORY_DEFAULTS[category].daysUntilExpiry,
          });
        }
      }
    }

    return items.slice(0, 15);
  };

  const detectStoreName = (text: string): string => {
    const storePatterns = [
      { name: 'Tesco', pattern: /tesco/i },
      { name: 'Sainsbury\'s', pattern: /sainsbury/i },
      { name: 'Asda', pattern: /asda/i },
      { name: 'Morrisons', pattern: /morrison/i },
      { name: 'Waitrose', pattern: /waitrose/i },
      { name: 'Co-op', pattern: /co-op|coop/i },
      { name: 'M&S', pattern: /marks\s*(and|&)\s*spencer/i },
      { name: 'Lidl', pattern: /lidl/i },
      { name: 'Aldi', pattern: /aldi/i },
      { name: 'Iceland', pattern: /iceland/i },
      { name: 'Whole Foods', pattern: /whole\s*food/i },
      { name: 'Trader Joe\'s', pattern: /trader\s*joe/i },
      { name: 'Costco', pattern: /costco/i },
      { name: 'Walmart', pattern: /walmart/i },
      { name: 'Target', pattern: /target/i },
    ];

    for (const { name, pattern } of storePatterns) {
      if (pattern.test(text)) {
        return name;
      }
    }
    return '';
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: any) => {
    const newItems = [...extractedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setExtractedItems(newItems);
  };

  const removeItem = (index: number) => {
    setExtractedItems(extractedItems.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (extractedItems.length === 0) {
      Alert.alert('No items', 'Please add items to your receipt.');
      return;
    }
    onItemsExtracted(extractedItems);
  };

  const handleAddManualItem = () => {
    const newItem: ExtractedItem = {
      name: '',
      inferred_category: 'other',
      suggested_expiry_days: 7,
    };
    setExtractedItems([...extractedItems, newItem]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          📸 Scan Receipt
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Upload or photograph your shopping receipt
        </Text>
      </View>

      {!image && !processing && (
        <Card style={styles.uploadCard}>
          <Card.Content style={styles.uploadContent}>
            <Text style={styles.uploadIcon}>🧾</Text>
            <Text variant="titleMedium" style={styles.uploadTitle}>
              Add your receipt
            </Text>
            <Text variant="bodySmall" style={styles.uploadText}>
              We'll automatically detect items and suggest expiry dates
            </Text>
            <View style={styles.buttonRow}>
              <Button mode="outlined" onPress={pickImage} style={styles.uploadButton}>
                📁 Choose Photo
              </Button>
              <Button mode="contained" onPress={takePhoto} style={styles.uploadButton}>
                📷 Take Photo
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

      {processing && (
        <Card style={styles.processingCard}>
          <Card.Content style={styles.processingContent}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text variant="titleMedium" style={styles.processingText}>
              Processing receipt...
            </Text>
            <Text variant="bodySmall" style={styles.processingSubtext}>
              Detecting items and prices
            </Text>
          </Card.Content>
        </Card>
      )}

      {image && extractedItems.length > 0 && (
        <>
          <Card style={styles.previewCard}>
            <Image source={{ uri: image }} style={styles.previewImage} />
          </Card>

          {storeName && (
            <TextInput
              label="Store name"
              value={storeName}
              onChangeText={setStoreName}
              mode="outlined"
              style={styles.storeInput}
            />
          )}

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Detected Items ({extractedItems.length})
          </Text>

          {extractedItems.map((item, index) => (
            <Card key={index} style={styles.itemCard}>
              <Card.Content>
                <View style={styles.itemHeader}>
                  <TextInput
                    label="Item name"
                    value={item.name}
                    onChangeText={(text) => updateItem(index, 'name', text)}
                    mode="outlined"
                    style={styles.itemNameInput}
                    dense
                  />
                  <Button 
                    icon="close" 
                    mode="text" 
                    onPress={() => removeItem(index)}
                    compact
                  />
                </View>

                {item.inferred_category && (
                  <Chip 
                    style={styles.categoryChip}
                    textStyle={styles.categoryChipText}
                  >
                    {CATEGORY_DEFAULTS[item.inferred_category].icon} {item.inferred_category}
                  </Chip>
                )}

                <Text variant="bodySmall" style={styles.expiryHint}>
                  Suggested expiry: ~{item.suggested_expiry_days} days
                </Text>
              </Card.Content>
            </Card>
          ))}

          <Button 
            mode="outlined" 
            onPress={handleAddManualItem}
            style={styles.addItemButton}
            icon="plus"
          >
            Add Missing Item
          </Button>

          <View style={styles.actions}>
            <Button mode="outlined" onPress={onCancel} style={styles.actionButton}>
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleConfirm} 
              style={styles.actionButton}
              disabled={extractedItems.filter(i => i.name).length === 0}
            >
              Add {extractedItems.filter(i => i.name).length} Items
            </Button>
          </View>
        </>
      )}

      {image && extractedItems.length === 0 && !processing && (
        <Card style={styles.noItemsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.noItemsText}>
              No items detected
            </Text>
            <Text variant="bodySmall" style={styles.noItemsSubtext}>
              Try a clearer photo or add items manually
            </Text>
            <Button mode="outlined" onPress={onCancel} style={styles.retryButton}>
              Try Again
            </Button>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  uploadCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  uploadContent: {
    alignItems: 'center',
    padding: 24,
  },
  uploadIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  uploadTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
  },
  processingCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  processingContent: {
    alignItems: 'center',
    padding: 32,
  },
  processingText: {
    marginTop: 16,
    fontWeight: '600',
  },
  processingSubtext: {
    color: '#6B7280',
    marginTop: 4,
  },
  previewCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  storeInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    fontWeight: '600',
    color: '#374151',
  },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNameInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F3F4F6',
  },
  categoryChipText: {
    fontSize: 12,
  },
  expiryHint: {
    color: '#6B7280',
    marginTop: 8,
  },
  addItemButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
  noItemsCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  noItemsText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  noItemsSubtext: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    alignSelf: 'center',
  },
});
