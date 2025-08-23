
import { NextResponse } from 'next/server';

// Map English weather conditions to Korean
const weatherConditionsMap = {
  'Clear': '맑음',
  'Clouds': '흐림',
  'Rain': '비',
  'Drizzle': '이슬비',
  'Thunderstorm': '천둥번개',
  'Snow': '눈',
  'Mist': '안개',
  'Smoke': '연기',
  'Haze': '안개',
  'Dust': '먼지',
  'Fog': '안개',
  'Sand': '황사',
  'Ash': '재',
  'Squall': '돌풍',
  'Tornado': '토네이도'
};

export async function GET(request: Request) {
  const apiKey = process.env.WEATHER_API_KEY;
  
  const lat = 37.5665; // Seoul
  const lon = 126.9780; // Seoul

  if (!apiKey) {
    return NextResponse.json({ error: 'Weather API key is not configured.' }, { status: 500 });
  }

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenWeatherMap API error:', errorData);
      return NextResponse.json({ error: `Failed to fetch weather data: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();

    const today = new Date().toISOString().split('T')[0];
    let lowTemp = Infinity;
    let highTemp = -Infinity;
    let condition = null;

    const todayForecasts = data.list.filter(f => f.dt_txt.startsWith(today));

    if (todayForecasts.length > 0) {
      // Use the weather condition from the first forecast of the day
      const mainCondition = todayForecasts[0].weather[0].main;
      condition = weatherConditionsMap[mainCondition] || mainCondition;

      for (const forecast of todayForecasts) {
        if (forecast.main.temp < lowTemp) lowTemp = forecast.main.temp;
        if (forecast.main.temp > highTemp) highTemp = forecast.main.temp;
      }
    } else {
      // Fallback if no forecast for today is available
      const firstForecast = data.list[0];
      const mainCondition = firstForecast.weather[0].main;
      condition = weatherConditionsMap[mainCondition] || mainCondition;
      lowTemp = firstForecast.main.temp;
      highTemp = firstForecast.main.temp;
    }

    const weatherData = {
      lowTemp: Math.round(lowTemp),
      highTemp: Math.round(highTemp),
      condition: condition
    };

    return NextResponse.json(weatherData);

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json({ error: 'Internal server error while fetching weather.' }, { status: 500 });
  }
}
