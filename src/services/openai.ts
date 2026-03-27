import OpenAI from 'openai';
import { Item, Recipe, DietaryTag, Ingredient } from '../types';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY'
});

const SYSTEM_PROMPT = `You are a helpful chef assistant specializing in reducing food waste. 
You generate creative, practical recipes that help users use their ingredients before they expire.
Always prioritize ingredients that are about to expire.
Provide clear, concise instructions suitable for home cooks of all skill levels.`;

export async function generateRecipes(
  items: Item[],
  dietaryRestrictions: DietaryTag[] = [],
  maxPrepTime: number = 60,
  count: number = 3
): Promise<Recipe[]> {
  const expiringItems = items
    .filter(item => item.status === 'active')
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  const userPrompt = `
Generate ${count} recipes using some or all of these ingredients that need to be used soon:
${expiringItems.map(item => `- ${item.name} (expires: ${item.expiry_date}, category: ${item.category || 'unknown'})`).join('\n')}

Dietary restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
Maximum prep time: ${maxPrepTime} minutes
Maximum cooking time: ${maxPrepTime * 2} minutes

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Brief description",
      "ingredients": [
        {"name": "ingredient", "amount": "1", "unit": "cup", "is_expiring_item": true}
      ],
      "instructions": ["Step 1", "Step 2"],
      "prep_time": 10,
      "cook_time": 30,
      "servings": 4,
      "dietary_tags": ["vegetarian", "quick"]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recipes || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error generating recipes:', error);
    return [];
  }
}

export async function generateRecipeForItem(item: Item): Promise<Recipe | null> {
  const recipes = await generateRecipes([item], [], 30, 1);
  return recipes[0] || null;
}

export function validateRecipeResponse(response: any): response is { recipes: Recipe[] } {
  return (
    response &&
    Array.isArray(response.recipes) &&
    response.recipes.every((recipe: any) => 
      typeof recipe.name === 'string' &&
      Array.isArray(recipe.ingredients) &&
      Array.isArray(recipe.instructions)
    )
  );
}
