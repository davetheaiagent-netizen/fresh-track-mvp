# FreshTrack MVP

AI-powered food expiry tracking and waste reduction app.

## Features

- 📸 Receipt scanning to auto-add items
- ⏰ Expiry date tracking with smart notifications
- 🍳 AI-powered recipe generation using expiring ingredients
- 🌱 Reduce food waste and save money

## Tech Stack

- **Framework**: Expo (React Native)
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4 for recipe generation
- **State**: Zustand
- **UI**: React Native Paper (Material Design 3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/davetheaiagent-netizen/fresh-track-mvp.git
cd fresh-track-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# Start the development server
npx expo start
```

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Enable Row Level Security (RLS) on all tables
4. Copy your project URL and anon key to `.env`

### Environment Variables

Create a `.env` file with:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Project Structure

```
src/
├── app/              # Expo Router screens
│   ├── (tabs)/       # Tab navigation
│   └── _layout.tsx   # Root layout
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── screens/         # Screen components
├── services/        # API integrations
├── types/           # TypeScript types
└── utils/           # Utility functions
```

## Roadmap

- [x] User authentication
- [x] Add/view/delete items
- [x] Expiry tracking
- [x] Recipe generation
- [ ] Receipt scanning (OCR)
- [ ] Push notifications
- [ ] Grocery store API integration
- [ ] B2B dashboard

## License

MIT
