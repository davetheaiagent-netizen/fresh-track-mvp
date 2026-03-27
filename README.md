# FreshTrack MVP

AI-powered food expiry tracking and waste reduction app.

## Features

### Consumer App
- 📸 Receipt scanning with OCR to auto-add items
- ⏰ Expiry date tracking with smart notifications
- 🍳 AI-powered recipe generation using expiring ingredients
- 🌱 Reduce food waste and save money

### B2B Dashboard (for retailers)
- 📊 Waste analytics by category
- 📈 Weekly trends and tracking
- 💡 AI-powered recommendations
- 👥 Customer engagement metrics
- 🏪 Store-level insights

## Tech Stack

- **Framework**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4 for recipe generation
- **State**: Zustand
- **UI**: React Native Paper (Material Design 3)
- **Charts**: react-native-chart-kit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API key
- Google Cloud Vision API key (for receipt scanning)

### Installation

```bash
# Clone the repository
git clone https://github.com/davetheaiagent-netizen/fresh-track-mvp.git
cd fresh-track-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# Start the development server
npx expo start
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migrations in `supabase/migrations/`:
   ```bash
   # First migration (core schema)
   psql -h your-host -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
   
   # Second migration (B2B schema)
   psql -h your-host -U postgres -d postgres -f supabase/migrations/002_b2b_schema.sql
   ```
3. Enable Row Level Security (RLS) on all tables
4. Copy your project URL and anon key to `.env`

### Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
EXPO_PUBLIC_GOOGLE_CLOUD_API_KEY=your_google_cloud_api_key
```

## Project Structure

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/           # Tab navigation
│   │   ├── index.tsx     # Home screen
│   │   ├── recipes.tsx   # Recipes screen
│   │   └── settings.tsx # Settings screen
│   ├── _layout.tsx       # Root layout
│   ├── b2b-dashboard.tsx # B2B retail dashboard
│   └── notifications.tsx  # Notification settings
├── components/            # Reusable UI components
│   ├── ItemCard.tsx
│   ├── RecipeCard.tsx
│   ├── AddItemModal.tsx
│   ├── ReceiptScanner.tsx
│   └── ReceiptScannerModal.tsx
├── hooks/                # Custom React hooks
│   ├── useItems.ts
│   ├── useRecipes.ts
│   └── useNotifications.ts
├── screens/              # Screen components
├── services/            # API integrations
│   ├── supabase.ts
│   ├── openai.ts
│   ├── notifications.ts
│   └── b2b.ts
├── types/               # TypeScript types
│   ├── index.ts
│   └── b2b.ts
└── utils/               # Utility functions
    └── expiryCalculator.ts
```

## Roadmap

- [x] User authentication
- [x] Add/view/delete items
- [x] Expiry tracking
- [x] Recipe generation (GPT-4)
- [x] Receipt scanning (OCR)
- [x] Push notifications
- [x] B2B dashboard
- [ ] Grocery store API integration
- [ ] Shopping list from recipes
- [ ] AI-powered store recommendations

## B2B Features

The B2B dashboard provides:

- **Overview Metrics**: Total items, waste percentage, items wasted
- **Waste by Category**: Pie chart breakdown
- **Weekly Trends**: Line chart of waste over time
- **Top Wasted Products**: List of products causing most waste
- **Recommendations**: AI-powered suggestions to reduce waste
- **Customer Engagement**: User activity and retention metrics

## License

MIT
