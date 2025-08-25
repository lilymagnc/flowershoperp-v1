# Weather API Setup Guide

The dashboard includes a weather display that shows current weather conditions for Seoul, Korea. To enable this feature, you need to configure the OpenWeatherMap API.

## Setup Instructions

### 1. Get a Free API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to "API keys" section
4. Generate a new API key (it may take a few hours to activate)

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory of your project and add:

```env
WEATHER_API_KEY=your_openweathermap_api_key_here
```

Replace `your_openweathermap_api_key_here` with the actual API key you received.

### 3. Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
# or
yarn dev
```

## How It Works

- The weather API fetches forecast data for Seoul (37.5665, 126.9780)
- It displays the current day's low/high temperature and weather condition
- Weather conditions are translated from English to Korean
- If the API key is not configured, the weather display will be hidden gracefully

## Troubleshooting

- **500 Internal Server Error**: Make sure your API key is correctly set in `.env.local`
- **Weather not showing**: Check the browser console for any error messages
- **API key not working**: New API keys may take up to 2 hours to activate

## Weather Conditions Mapping

The following weather conditions are supported and will be displayed in Korean:

- Clear → 맑음 ☀️
- Clouds → 흐림 ☁️
- Rain → 비 🌧️
- Drizzle → 이슬비 🌦️
- Thunderstorm → 천둥번개 ⛈️
- Snow → 눈 ❄️
- Mist/Haze/Fog → 안개 🌫️
- Dust → 먼지 😷
- Sand → 황사 😷
