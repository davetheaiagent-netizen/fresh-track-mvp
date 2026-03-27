import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Chip, Button, Divider } from 'react-native-paper';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onViewDetails?: () => void;
  onAddToShoppingList?: () => void;
}

const dietaryColors: Record<string, string> = {
  vegan: '#22C55E',
  vegetarian: '#84CC16',
  'gluten-free': '#F59E0B',
  'dairy-free': '#06B6D4',
  'nut-free': '#8B5CF6',
  'low-carb': '#EC4899',
  keto: '#EF4444',
  quick: '#3B82F6',
};

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onViewDetails,
  onAddToShoppingList,
}) => {
  const totalTime = recipe.prep_time + recipe.cook_time;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <Text variant="titleLarge" style={styles.title}>
          {recipe.name}
        </Text>
        
        <Text variant="bodyMedium" style={styles.description}>
          {recipe.description}
        </Text>

        <View style={styles.metaRow}>
          <Chip icon="clock-outline" style={styles.metaChip} textStyle={styles.metaText}>
            {totalTime} min
          </Chip>
          <Chip icon="account-group-outline" style={styles.metaChip} textStyle={styles.metaText}>
            {recipe.servings} servings
          </Chip>
          {recipe.prep_time <= 15 && (
            <Chip icon="flash" style={[styles.metaChip, styles.quickChip]} textStyle={styles.quickText}>
              Quick!
            </Chip>
          )}
        </View>

        <Divider style={styles.divider} />

        <Text variant="labelLarge" style={styles.sectionTitle}>
          Ingredients
        </Text>
        {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[
              styles.ingredientText,
              ingredient.is_expiring_item && styles.expiringIngredient
            ]}>
              {ingredient.amount} {ingredient.unit} {ingredient.name}
              {ingredient.is_expiring_item && ' ⏰'}
            </Text>
          </View>
        ))}
        {recipe.ingredients.length > 5 && (
          <Text style={styles.moreText}>
            +{recipe.ingredients.length - 5} more ingredients
          </Text>
        )}

        <View style={styles.tagsRow}>
          {recipe.dietary_tags.map((tag) => (
            <Chip
              key={tag}
              style={[styles.tag, { backgroundColor: dietaryColors[tag] || '#E5E7EB' }]}
              textStyle={styles.tagText}
              compact
            >
              {tag}
            </Chip>
          ))}
        </View>

        <View style={styles.actions}>
          {onViewDetails && (
            <Button mode="outlined" onPress={onViewDetails} style={styles.actionButton}>
              View Recipe
            </Button>
          )}
          {onAddToShoppingList && (
            <Button mode="contained" onPress={onAddToShoppingList} style={styles.actionButton}>
              Add Missing to List
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  title: {
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  description: {
    color: '#6B7280',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaChip: {
    backgroundColor: '#F3F4F6',
  },
  metaText: {
    fontSize: 12,
  },
  quickChip: {
    backgroundColor: '#DBEAFE',
  },
  quickText: {
    color: '#1D4ED8',
    fontSize: 12,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#374151',
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    color: '#9CA3AF',
    marginRight: 8,
  },
  ingredientText: {
    flex: 1,
    color: '#4B5563',
  },
  expiringIngredient: {
    color: '#166534',
    fontWeight: '600',
  },
  moreText: {
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    height: 24,
  },
  tagText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
