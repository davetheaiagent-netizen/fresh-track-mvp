import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, Button, Chip, SegmentedButtons, Card, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useRecipes } from '../hooks/useRecipes';
import { useItems } from '../hooks/useItems';
import { useShoppingList } from '../hooks/useShoppingList';
import { RecipeCard } from '../components/RecipeCard';
import { DietaryTag, Recipe } from '../types';
import { generateMissingIngredients } from '../utils/shoppingList';

const dietaryOptions = [
  { value: 'none', label: 'Any' },
  { value: 'vegetarian', label: 'Veg' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'GF' },
  { value: 'dairy-free', label: 'DF' },
];

const timeOptions = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
];

export default function RecipesScreen() {
  const router = useRouter();
  const { items } = useItems();
  const { recipes, loading, error, fetchRecipes } = useRecipes();
  const { addFromMissingIngredients } = useShoppingList();
  
  const [dietaryFilter, setDietaryFilter] = useState<string>('none');
  const [maxTime, setMaxTime] = useState<string>('60');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleGenerateRecipes = async () => {
    const dietary = dietaryFilter === 'none' ? [] : [dietaryFilter as DietaryTag];
    await fetchRecipes(recipes as any, dietary, parseInt(maxTime), 5);
    setHasGenerated(true);
  };

  const handleRegenerate = () => {
    setHasGenerated(false);
  };

  const handleAddToShoppingList = async (recipe: Recipe) => {
    const missing = generateMissingIngredients(recipe, items);
    if (missing.length === 0) {
      Alert.alert('All Set!', 'You already have all the ingredients for this recipe!');
      return;
    }
    
    const added = await addFromMissingIngredients(missing);
    setSnackbarMessage(`Added ${added.length} items to shopping list`);
    setSnackbarVisible(true);
  };

  const handleAddAllToShoppingList = async () => {
    if (recipes.length === 0) return;
    
    let totalMissing = 0;
    for (const recipe of recipes) {
      const missing = generateMissingIngredients(recipe, items);
      totalMissing += missing.length;
    }
    
    if (totalMissing === 0) {
      Alert.alert('All Set!', 'You have all the ingredients for these recipes!');
      return;
    }
    
    for (const recipe of recipes) {
      const missing = generateMissingIngredients(recipe, items);
      if (missing.length > 0) {
        await addFromMissingIngredients(missing);
      }
    }
    
    setSnackbarMessage(`Added all missing ingredients (${totalMissing} items)`);
    setSnackbarVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          🍳 Recipe Ideas
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Based on {items.length} items in your fridge
        </Text>
      </View>

      <Card style={styles.filterCard}>
        <Card.Content>
          <Text variant="labelLarge" style={styles.filterLabel}>
            Dietary Preference
          </Text>
          <SegmentedButtons
            value={dietaryFilter}
            onValueChange={setDietaryFilter}
            buttons={dietaryOptions}
            style={styles.segmented}
          />

          <Text variant="labelLarge" style={[styles.filterLabel, { marginTop: 16 }]}>
            Max Cooking Time
          </Text>
          <SegmentedButtons
            value={maxTime}
            onValueChange={setMaxTime}
            buttons={timeOptions}
            style={styles.segmented}
          />

          <Button
            mode="contained"
            onPress={handleGenerateRecipes}
            loading={loading}
            disabled={loading || items.length === 0}
            style={styles.generateButton}
            icon="auto-fix"
          >
            Generate Recipes
          </Button>
        </Card.Content>
      </Card>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>
            Chef is thinking... 👨‍🍳
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to generate recipes</Text>
          <Button mode="outlined" onPress={handleRegenerate}>
            Try Again
          </Button>
        </View>
      )}

      {!loading && hasGenerated && recipes.length === 0 && (
        <View style={styles.noRecipesContainer}>
          <Text style={styles.noRecipesIcon}>🤔</Text>
          <Text variant="titleMedium" style={styles.noRecipesTitle}>
            No recipes found
          </Text>
          <Text style={styles.noRecipesText}>
            Try adjusting your filters or adding more items
          </Text>
          <Button mode="outlined" onPress={handleRegenerate} style={{ marginTop: 16 }}>
            Try Different Filters
          </Button>
        </View>
      )}

      {hasGenerated && recipes.length > 0 && (
        <View style={styles.bulkActions}>
          <Button
            mode="contained"
            onPress={handleAddAllToShoppingList}
            style={styles.bulkButton}
            icon="cart-plus"
          >
            Add All Missing to List
          </Button>
        </View>
      )}

      <ScrollView style={styles.recipesList} showsVerticalScrollIndicator={false}>
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={`${recipe.name}-${index}`}
            recipe={recipe}
            onViewDetails={() => router.push(`/recipe/${encodeURIComponent(recipe.name)}`)}
            onAddToShoppingList={() => handleAddToShoppingList(recipe)}
          />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {hasGenerated && recipes.length > 0 && (
        <View style={styles.regenerateContainer}>
          <Button mode="text" onPress={handleRegenerate} icon="refresh">
            Regenerate with different options
          </Button>
        </View>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'View List',
          onPress: () => router.push('/shopping'),
        }}
      >
        {snackbarMessage}
      </Snackbar>
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
  filterCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  filterLabel: {
    color: '#374151',
    marginBottom: 8,
  },
  segmented: {
    marginBottom: 8,
  },
  generateButton: {
    marginTop: 16,
    backgroundColor: '#22C55E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 12,
  },
  noRecipesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noRecipesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noRecipesTitle: {
    color: '#374151',
    marginBottom: 8,
  },
  noRecipesText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  bulkActions: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bulkButton: {
    backgroundColor: '#3B82F6',
  },
  recipesList: {
    flex: 1,
  },
  regenerateContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
