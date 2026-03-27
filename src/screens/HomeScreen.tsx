import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, FAB, Searchbar, Banner, Button } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import { ItemCard } from '../components/ItemCard';
import { AddItemModal } from '../components/AddItemModal';
import { ReceiptScannerModal } from '../components/ReceiptScannerModal';
import { ItemCategory, ExtractedItem } from '../types';
import { groupItemsByExpiry } from '../utils/expiryCalculator';

export default function HomeScreen() {
  const router = useRouter();
  const { items, loading, fetchItems, addItem, addItemsFromReceipt, markAsUsed, markAsWasted, deleteItem } = useItems();
  const { recipes, fetchRecipes, loading: recipesLoading } = useRecipes();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUrgentBanner, setShowUrgentBanner] = useState(true);

  const grouped = groupItemsByExpiry(items);
  const urgentCount = grouped.expired.length + grouped.expiringToday.length + grouped.expiringSoon.length;

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = async (name: string, expiryDate: string, category: ItemCategory) => {
    await addItem(name, expiryDate, category);
  };

  const handleReceiptItems = async (receiptItems: ExtractedItem[]) => {
    await addItemsFromReceipt(receiptItems);
    setShowReceiptModal(false);
  };

  const handleMarkUsed = async (id: string) => {
    await markAsUsed(id);
  };

  const handleMarkWasted = async (id: string) => {
    await markAsWasted(id);
  };

  const handleDelete = async (id: string) => {
    await deleteItem(id);
  };

  const handleFindRecipes = async () => {
    if (items.length > 0) {
      await fetchRecipes(items);
      router.push('/recipes');
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🥬</Text>
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        Your fridge is empty
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        Add items to track their expiry and get recipe ideas
      </Text>
      <Button mode="contained" onPress={() => setShowAddModal(true)} style={styles.emptyButton}>
        Add First Item
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🥬 FreshTrack
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {items.length} items tracked
        </Text>
      </View>

      {urgentCount > 0 && showUrgentBanner && (
        <Banner
          visible={true}
          actions={[
            { label: 'Find Recipes', onPress: handleFindRecipes },
            { label: 'Dismiss', onPress: () => setShowUrgentBanner(false) },
          ]}
          icon="alert-circle"
          style={styles.urgentBanner}
        >
          {urgentCount} item{urgentCount > 1 ? 's' : ''} expiring soon - tap to find recipes!
        </Banner>
      )}

      {items.length > 0 && (
        <Searchbar
          placeholder="Search items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => router.push(`/item/${item.id}`)}
            onMarkUsed={() => handleMarkUsed(item.id)}
            onMarkWasted={() => handleMarkWasted(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchItems} />
        }
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.fabContainer}>
        <FAB
          icon="lightbulb-outline"
          style={[styles.fab, styles.recipeFab]}
          onPress={handleFindRecipes}
          disabled={items.length === 0 || recipesLoading}
          label="Find Recipes"
        />
        <FAB.Group
          open={false}
          visible={true}
          icon="plus"
          actions={[
            {
              icon: 'file-document-outline',
              label: 'Scan Receipt',
              onPress: () => setShowReceiptModal(true),
            },
            {
              icon: 'pencil-outline',
              label: 'Add Manually',
              onPress: () => setShowAddModal(true),
            },
          ]}
          onStateChange={() => {}}
          fabStyle={styles.fab}
        />
      </View>

      <AddItemModal
        visible={showAddModal}
        onDismiss={() => setShowAddModal(false)}
        onSubmit={handleAddItem}
      />

      <ReceiptScannerModal
        visible={showReceiptModal}
        onDismiss={() => setShowReceiptModal(false)}
        onConfirm={handleReceiptItems}
      />
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
  title: {
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  urgentBanner: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listContent: {
    paddingBottom: 160,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
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
  emptyButton: {
    paddingHorizontal: 24,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
  },
  fab: {
    backgroundColor: '#22C55E',
  },
  recipeFab: {
    backgroundColor: '#3B82F6',
    marginBottom: 70,
  },
});
