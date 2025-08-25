
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

  // Try OpenWeatherMap API first if API key is available
  if (apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return processWeatherData(data);
      }
    } catch (error) {
      console.warn('OpenWeatherMap API failed, trying fallback:', error);
    }
  }

  // Fallback: Use free public weather API (wttr.in)
  try {
    const fallbackUrl = `https://wttr.in/Seoul?format=j1`;
    const response = await fetch(fallbackUrl);
    
    if (response.ok) {
      const data = await response.json();
      return processWttrData(data);
    }
  } catch (error) {
    console.warn('Fallback weather API failed:', error);
  }

  // Final fallback: Return static weather data
  return NextResponse.json({
    lowTemp: 15,
    highTemp: 22,
    condition: '맑음',
    message: 'Using static weather data'
  });
}

// Process OpenWeatherMap data
function processWeatherData(data: any) {
  const today = new Date().toISOString().split('T')[0];
  let lowTemp = Infinity;
  let highTemp = -Infinity;
  let condition = null;

  const todayForecasts = data.list.filter((f: any) => f.dt_txt.startsWith(today));

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

  return NextResponse.json({
    lowTemp: Math.round(lowTemp),
    highTemp: Math.round(highTemp),
    condition: condition
  });
}

// Process wttr.in data (free weather API)
function processWttrData(data: any) {
  try {
    const current = data.current_condition[0];
    const temp = parseInt(current.temp_C);
    const weatherDesc = current.weatherDesc[0].value;
    
    // Map English weather descriptions to Korean
    const weatherMap: { [key: string]: string } = {
      'sunny': '맑음',
      'clear': '맑음',
      'cloudy': '흐림',
      'overcast': '흐림',
      'rain': '비',
      'drizzle': '이슬비',
      'thunder': '천둥번개',
      'snow': '눈',
      'mist': '안개',
      'fog': '안개',
      'haze': '안개'
    };

    let condition = '맑음'; // default
    for (const [english, korean] of Object.entries(weatherMap)) {
      if (weatherDesc.toLowerCase().includes(english)) {
        condition = korean;
        break;
      }
    }

    return NextResponse.json({
      lowTemp: temp - 3, // Estimate low temp
      highTemp: temp + 3, // Estimate high temp
      condition: condition
    });
  } catch (error) {
    console.error('Error processing wttr.in data:', error);
    throw error;
  }
}
