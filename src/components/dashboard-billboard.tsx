"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useOrders } from '@/hooks/use-orders';
import { useCalendar } from '@/hooks/use-calendar';
import { Calendar as CalendarIcon, Truck, Package, Megaphone, Dot, Thermometer, Loader2 } from 'lucide-react';

interface WeatherData {
  lowTemp: number | null;
  highTemp: number | null;
  condition: string | null;
}

export const DashboardBillboard = () => {
  const [currentDate, setCurrentDate] = useState('');
  const [weather, setWeather] = useState<WeatherData>({ lowTemp: null, highTemp: null, condition: null });
  const [weatherLoading, setWeatherLoading] = useState(true);

  const { orders, loading: ordersLoading } = useOrders(); 
  const { events: calendarEvents, loading: noticesLoading } = useCalendar();

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setWeatherLoading(true);
        const response = await fetch('/api/weather');
        const data = await response.json();
        
        // Handle both successful responses and fallback responses
        if (response.ok) {
          setWeather(data);
        } else {
          console.warn('Weather API error:', data.error || 'Unknown error');
          // Set weather to null values to hide weather display
          setWeather({ lowTemp: null, highTemp: null, condition: null });
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        // Set weather to null values to hide weather display
        setWeather({ lowTemp: null, highTemp: null, condition: null });
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  // Set current date
  useEffect(() => {
    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    }).format(today);
    setCurrentDate(formattedDate);
  }, []);

  // --- Data Filtering Logic ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowTime = tomorrow.getTime();

  const isSameDay = (orderDate) => {
    if (!orderDate) return -1;
    const date = orderDate.toDate();
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  };

  const todayDeliveries = orders.filter(o => o.receiptType === 'delivery_reservation' && isSameDay(o.orderDate) === todayTime).length;
  const todayPickups = orders.filter(o => (o.receiptType === 'pickup_reservation' || o.receiptType === 'store_pickup') && isSameDay(o.orderDate) === todayTime).length;
  
  const tomorrowDeliveries = orders.filter(o => o.receiptType === 'delivery_reservation' && isSameDay(o.orderDate) === tomorrowTime).length;
  const tomorrowPickups = orders.filter(o => (o.receiptType === 'pickup_reservation' || o.receiptType === 'store_pickup') && isSameDay(o.orderDate) === tomorrowTime).length;

    const notices = calendarEvents.filter(event => {
    if (event.type !== 'notice') {
      return false;
    }
    const eventStart = new Date(event.startDate);
    eventStart.setHours(0, 0, 0, 0);

    // Handle multi-day events: show notice if today is between start and end date
    const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
    eventEnd.setHours(23, 59, 59, 999);

    return today >= eventStart && today <= eventEnd;
  });

  // --- Billboard Items --- 
  const getWeatherText = () => {
    if (weatherLoading) return "날씨 로딩 중...";
    if (weather.lowTemp !== null && weather.highTemp !== null && weather.condition) {
      const emojiMap: { [key: string]: string } = {
        '맑음': '☀️',
        '흐림': '☁️',
        '비': '🌧️',
        '이슬비': '🌦️',
        '천둥번개': '⛈️',
        '눈': '❄️',
        '안개': '🌫️',
        '먼지': '😷',
        '황사': '😷'
      };
      const emoji = emojiMap[weather.condition] || '🌡️'; // Default emoji if no match
      return `${emoji} ${weather.condition} 최저 ${weather.lowTemp}° / 최고 ${weather.highTemp}°`;
    }
    return null;
  };

  const weatherText = getWeatherText();

  const billboardItems = [
    { icon: CalendarIcon, text: currentDate },
    weatherText && { icon: weatherLoading ? Loader2 : Thermometer, text: weatherText, isWeather: true },
    ...notices.map(n => ({ icon: Megaphone, text: n.title, color: "text-red-300" })),
    { icon: Truck, text: `오늘 배송/픽업: ${todayDeliveries}/${todayPickups}건`, color: "text-yellow-300" },
    { icon: Package, text: `내일 배송/픽업: ${tomorrowDeliveries}/${tomorrowPickups}건`, color: "text-yellow-300" },
  ].filter(Boolean);

  return (
    <>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-container { position: relative; }
        .marquee-content { animation: marquee 60s linear infinite; display: flex; position: absolute; }
        .marquee-container:hover .marquee-content { animation-play-state: paused; }
        .loading-icon { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <Card className="mb-6 w-full overflow-hidden bg-blue-600 text-white">
        <CardContent className="p-0">
          <div className="marquee-container flex items-center h-16">
            {(ordersLoading || noticesLoading) ? (
                <div className="w-full text-center">전광판 데이터 로딩 중...</div>
            ) : (
                <div className="marquee-content">
                  {billboardItems.map((item, index) => (
                    <React.Fragment key={`first-${index}`}>
                      <div className="flex items-center mx-4 flex-shrink-0">
                        <item.icon className={`h-6 w-6 mr-2 ${item.color || ''} ${item.isWeather && weatherLoading ? 'loading-icon' : ''}`} />
                        <span className={`font-semibold text-base whitespace-nowrap ${item.color || ''}`}>{item.text}</span>
                      </div>
                      {index < billboardItems.length - 1 && <Dot className="text-blue-200"/>}
                    </React.Fragment>
                  ))}
                  {billboardItems.map((item, index) => (
                    <React.Fragment key={`second-${index}`}>
                      <div className="flex items-center mx-4 flex-shrink-0">
                        <item.icon className={`h-6 w-6 mr-2 ${item.color || ''} ${item.isWeather && weatherLoading ? 'loading-icon' : ''}`} />
                        <span className={`font-semibold text-base whitespace-nowrap ${item.color || ''}`}>{item.text}</span>
                      </div>
                      {index < billboardItems.length - 1 && <Dot className="text-blue-200"/>}
                    </React.Fragment>
                  ))}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};