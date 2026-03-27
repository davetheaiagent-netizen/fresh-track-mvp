import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, IconButton, Chip } from 'react-native-paper';
import { Item } from '../types';
import { CATEGORY_DEFAULTS, getExpiryUrgency, getExpiryColor, formatExpiryText } from '../utils/expiryCalculator';

interface ItemCardProps {
  item: Item;
  onPress?: () => void;
  onMarkUsed?: () => void;
  onMarkWasted?: () => void;
  onDelete?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  onMarkUsed,
  onMarkWasted,
  onDelete,
}) => {
  const categoryInfo = CATEGORY_DEFAULTS[item.category || 'other'];
  const urgency = getExpiryUrgency(item.expiry_date);
  const expiryColor = getExpiryColor(urgency);
  const expiryText = formatExpiryText(item.expiry_date);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card} mode="elevated">
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text variant="titleMedium" style={styles.itemName}>
                {item.name}
              </Text>
              <View style={styles.expiryRow}>
                <View style={[styles.expiryDot, { backgroundColor: expiryColor }]} />
                <Text style={[styles.expiryText, { color: expiryColor }]}>
                  {expiryText}
                </Text>
              </View>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={onDelete}
              style={styles.deleteButton}
            />
          </View>

          {urgency !== 'ok' && (
            <View style={styles.actions}>
              {onMarkUsed && (
                <TouchableOpacity style={styles.actionButton} onPress={onMarkUsed}>
                  <Text style={styles.actionText}>✅ Used it</Text>
                </TouchableOpacity>
              )}
              {onMarkWasted && (
                <TouchableOpacity style={styles.actionButtonWasted} onPress={onMarkWasted}>
                  <Text style={styles.actionTextWasted}>💔 Wasted</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.quantity > 1 && (
            <Chip style={styles.quantityChip} textStyle={styles.quantityText}>
              x{item.quantity}
            </Chip>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  content: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    color: '#1F2937',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  expiryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  expiryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    margin: -8,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonWasted: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 13,
  },
  actionTextWasted: {
    color: '#991B1B',
    fontWeight: '600',
    fontSize: 13,
  },
  quantityChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    height: 24,
    backgroundColor: '#E0E7FF',
  },
  quantityText: {
    fontSize: 11,
  },
});
