# EcoScrap - Scrap Material Marketplace

A platform connecting scrap sellers with buyers to promote recycling and sustainable waste management.

## Features

- 🗺️ Interactive map for browsing scrap listings by location
- 📱 Responsive design for mobile and desktop
- 🔐 User authentication with Supabase
- 📸 Upload and manage scrap listings with images
- 📍 Geolocation tracking for pickup locations
- 💰 Price tracking and material categorization

## Setup Instructions for Team Members

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google Maps API key

### Step 1: Clone the repository

```bash
git clone https://github.com/prasun24-15/scrap_x.git
cd scrap_x
```

### Step 2: Install dependencies

```bash
npm install
# or
yarn install
```

### Step 3: Environment Setup

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

> Note: You'll need to get these values from the team leader or set up your own accounts for development.

### Step 4: Database Setup

1. Create a Supabase project
2. Run the following SQL scripts to set up the database:
   - Create the necessary tables (material_types, scrap_listings, etc.)
   - Set up the PostGIS extension for geolocation
   - Create the geolocation functions

The SQL scripts are available in the `src/integrations/supabase` directory.

### Step 5: Start the development server

```bash
npm run dev
# or
yarn dev
```

The application should now be running at http://localhost:8081 (or another port if 8081 is already in use).

## Database Schema

- `scrap_listings`: Stores all scrap listings with geolocation data
- `material_types`: Categories of recyclable materials
- `profiles`: User profile information

## API Functions

- `create_geography_point`: Converts longitude/latitude to PostGIS format
- `get_listings_with_coordinates`: Retrieves listings with coordinates

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## Hackathon Team

- [Your Name]
- [Team Member 2]
- [Team Member 3]
- [Team Member 4]
