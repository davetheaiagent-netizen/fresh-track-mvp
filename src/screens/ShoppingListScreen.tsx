import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, Checkbox, Button, FAB, TextInput, Chip, Divider, IconButton, Modal, Portal } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useShoppingList } from '../hooks/useShoppingList';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { ShoppingListItem } from '../utils/shoppingList';

const categoryEmojis: Record<string, string> = {
  dairy: '🥛',
  produce: '🥬',
  meat: '🥩',
  bakery: '🍞',
  pantry: '🥫',
  frozen: '🧊',
  other: '📦',
};

const categoryColors: Record<string, string> = {
  dairy: '#60A5FA',
  produce: '#4ADE80',
  meat: '#F87171',
  bakery: '#FBBF24',
  pantry: '#FB923C',
  frozen: '#A78BFA',
  other: '#94A3B8',
};

export default function ShoppingListScreen() {
  const router = useRouter();
  const { items, loading, addItem, toggleItem, removeItem, clearChecked, clearAll, generateFromRecipes, getItemsByCategory } = useShoppingList();
  const { items: ownedItems } = useItems();
  const { recipes } = useRecipes();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Refresh data when screen focuses
    }, [])
  );

  const handleAddItem = async () => {
    if (newItemName.trim()) {
      await addItem(newItemName.trim(), newItemQuantity.trim());
      setNewItemName('');
      setNewItemQuantity('');
      setShowAddModal(false);
    }
  };

  const handleGenerateFromRecipes = async () => {
    if (recipes.length > 0) {
      const added = await generateFromRecipes(recipes, ownedItems);
      setShowGenerateModal(false);
      Alert.alert(
        'Items Added',
        `Added ${added.length} items to your shopping list from recipe ingredients.`
      );
    } else {
      Alert.alert(
        'No Recipes',
        'Generate some recipes first to add missing ingredients to your shopping list.'
      );
    }
  };

  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      'Remove all checked items from your shopping list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', onPress: clearChecked },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Items',
      'Remove all items from your shopping list?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  const checkedCount = items.filter(i => i.checked).length;
  const uncheckedCount = items.filter(i => !i.checked).length;
  const groupedItems = getItemsByCategory();

  const renderItem = ({ item }: { item: ShoppingListItem }) => (
    <Card style={[styles.itemCard, item.checked && styles.checkedCard]} mode="elevated">
      <View style={styles.itemRow}>
        <Checkbox
          status={item.checked ? 'checked' : 'unchecked'}
          onPress={() => toggleItem(item.id)}
          color="#22C55E"
        />
        <View style={styles.itemInfo}>
          <Text
            variant="bodyLarge"
            style={[styles.itemName, item.checked && styles.checkedText]}
          >
            {item.name}
          </Text>
          {item.quantity && (
            <Text
              variant="bodySmall"
              style={[styles.itemQuantity, item.checked && styles.checkedText]}
            >
              {item.quantity} {item.unit}
            </Text>
          )}
          {item.source === 'recipe' && item.recipeName && (
            <Chip
              icon="chef-hat"
              style={styles.recipeChip}
              textStyle={styles.recipeChipText}
              compact
            >
              {item.recipeName}
            </Chip>
          )}
        </View>
        <IconButton
          icon="close"
          size={20}
          onPress={() => removeItem(item.id)}
        />
      </View>
    </Card>
  );

  const renderCategory = (category: string, categoryItems: ShoppingListItem[]) => {
    const uncheckedInCategory = categoryItems.filter(i => !i.checked);
    const checkedInCategory = categoryItems.filter(i => i.checked);
    
    if (uncheckedInCategory.length === 0 && checkedInCategory.length === 0) return null;
    
    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[category] + '20' }]}>
            <Text style={styles.categoryEmoji}>
              {categoryEmojis[category] || '📦'}
            </Text>
            <Text style={[styles.categoryName, { color: categoryColors[category] }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </View>
          <Text style={styles.categoryCount}>
            {uncheckedInCategory.length} remaining
          </Text>
        </View>
        
        {uncheckedInCategory.map(item => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
        
        {checkedInCategory.length > 0 && (
          <View style={styles.checkedSection}>
            <Text variant="labelSmall" style={styles.checkedLabel}>
              CHECKED ({checkedInCategory.length})
            </Text>
            {checkedInCategory.map(item => (
              <View key={item.id}>{renderItem({ item })}</View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🛒</Text>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Your shopping list is empty
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Add items manually or generate from recipes
      </Text>
      <View style={styles.emptyButtons}>
        <Button
          mode="outlined"
          onPress={() => setShowAddModal(true)}
          style={styles.emptyButton}
          icon="plus"
        >
          Add Item
        </Button>
        <Button
          mode="contained"
          onPress={() => setShowGenerateModal(true)}
          style={styles.emptyButton}
          icon="auto-fix"
        >
          From Recipes
        </Button>
      </View>
    </View>
  );

  const categories = Object.keys(groupedItems).sort();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={styles.title}>
            🛒 Shopping List
          </Text>
          {items.length > 0 && (
            <IconButton
              icon="delete-sweep-outline"
              onPress={handleClearAll}
            />
          )}
        </View>
        {items.length > 0 && (
          <View style={styles.statsRow}>
            <Chip icon="check" style={styles.statChip}>
              {checkedCount} checked
            </Chip>
            <Chip icon="cart-outline" style={styles.statChip}>
              {uncheckedCount} to buy
            </Chip>
          </View>
        )}
      </View>

      {items.length > 0 && (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => setShowAddModal(true)}
            style={styles.actionButton}
            icon="plus"
          >
            Add Item
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowGenerateModal(true)}
            style={styles.actionButton}
            icon="auto-fix"
          >
            From Recipes
          </Button>
          {checkedCount > 0 && (
            <Button
              mode="text"
              onPress={handleClearChecked}
              style={styles.actionButton}
              textColor="#EF4444"
            >
              Clear Checked
            </Button>
          )}
        </View>
      )}

      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item: category }) => 
          renderCategory(category, groupedItems[category])
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Item Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add Item
          </Text>
          <TextInput
            label="Item name"
            value={newItemName}
            onChangeText={setNewItemName}
            mode="outlined"
            style={styles.modalInput}
            placeholder="e.g., Milk, Eggs, Bread"
            autoFocus
          />
          <TextInput
            label="Quantity (optional)"
            value={newItemQuantity}
            onChangeText={setNewItemQuantity}
            mode="outlined"
            style={styles.modalInput}
            placeholder="e.g., 2, 500g, 1L"
          />
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddItem}>
              Add
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Generate From Recipes Modal */}
      <Portal>
        <Modal
          visible={showGenerateModal}
          onDismiss={() => setShowGenerateModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Add Missing Ingredients
          </Text>
          <Text variant="bodyMedium" style={styles.modalDescription}>
            Find ingredients from your generated recipes that you don't have in your fridge and add them to your shopping list.
          </Text>
          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setShowGenerateModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleGenerateFromRecipes}>
              Add Missing Items
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  statChip: {
    backgroundColor: '#F3F4F6',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flex: 1,
    minWidth: 100,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyButton: {
    minWidth: 140,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  categoryName: {
    fontWeight: '600',
    fontSize: 14,
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  checkedCard: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 4,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 4,
  },
  itemName: {
    fontWeight: '500',
    color: '#1F2937',
  },
  itemQuantity: {
    color: '#6B7280',
    marginTop: 2,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  recipeChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    height: 22,
    backgroundColor: '#DBEAFE',
  },
  recipeChipText: {
    fontSize: 10,
    color: '#1D4ED8',
  },
  checkedSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  checkedLabel: {
    color: '#9CA3AF',
    marginLeft: 36,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  modalDescription: {
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalInput: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
});
