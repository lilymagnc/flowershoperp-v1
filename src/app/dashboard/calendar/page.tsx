"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

import { useOrders } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useCalendar, CalendarEvent } from "@/hooks/use-calendar";
import { Calendar, CalendarDays, Truck, Users, Bell, Plus, Filter, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, parseISO, setDate, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { EventDialog } from "./components/event-dialog";
import { DayEventsDialog } from "./components/day-events-dialog";

export default function CalendarPage() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useCalendar();
  
  // 상태 관리
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventType, setSelectedEventType] = useState<string>('전체');
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);

  // 이벤트 타입별 설정 (자재요청 제거)
  const eventTypes = [
    { value: '전체', label: '전체', icon: CalendarDays, color: 'bg-gray-500' },
    { value: 'delivery', label: '배송/픽업', icon: Truck, color: 'bg-blue-500' },
    { value: 'employee', label: '직원스케줄', icon: Users, color: 'bg-green-500' },
    { value: 'notice', label: '공지/알림', icon: Bell, color: 'bg-red-500' },
    { value: 'payment', label: '월결제일', icon: CreditCard, color: 'bg-purple-500' }
  ];

  // 현재 월의 날짜들 계산 (요일 맞춤)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // 캘린더 그리드를 위해 월의 첫 주 시작일과 마지막 주 종료일 계산
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // 일요일 시작
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 }); // 일요일 시작
  
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // 캘린더 네비게이션
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // 픽업/배송 예약 데이터를 캘린더 이벤트로 변환
  const convertOrdersToEvents = useMemo(() => {
    const pickupDeliveryEvents: CalendarEvent[] = [];
    
    orders.forEach(order => {
      // 픽업 예약 처리 (즉시픽업 제외, 처리 중이거나 완료된 주문)
      if (order.pickupInfo && order.receiptType === 'pickup_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        const pickupDate = parseISO(order.pickupInfo.date);
        const pickupTime = order.pickupInfo.time;
        
        // 시간 정보가 있으면 시간을 설정, 없으면 09:00으로 기본 설정
        const [hours, minutes] = pickupTime ? pickupTime.split(':').map(Number) : [9, 0];
        pickupDate.setHours(hours, minutes, 0, 0);
        
        pickupDeliveryEvents.push({
          id: `pickup_${order.id}`,
          type: 'delivery',
          title: `[픽업] ${order.orderer.name}`,
          description: `상품: ${order.items?.map(item => item.name).join(', ')}`,
          startDate: pickupDate,
          status: (order.status as string) === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: (order.status as string) === 'completed' ? 'bg-gray-400' : 'bg-blue-500',
          isAllDay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        });
      }
      
      // 배송 예약 처리
      if (order.deliveryInfo && order.receiptType === 'delivery_reservation' && (order.status === 'processing' || order.status === 'completed')) {
        const deliveryDate = parseISO(order.deliveryInfo.date);
        const deliveryTime = order.deliveryInfo.time;
        
        // 시간 정보가 있으면 시간을 설정, 없으면 09:00으로 기본 설정
        const [hours, minutes] = deliveryTime ? deliveryTime.split(':').map(Number) : [9, 0];
        deliveryDate.setHours(hours, minutes, 0, 0);
        
        pickupDeliveryEvents.push({
          id: `delivery_${order.id}`,
          type: 'delivery',
          title: `[배송] ${order.orderer.name}`,
          description: `상품: ${order.items?.map(item => item.name).join(', ')} | 주소: ${order.deliveryInfo.address}`,
          startDate: deliveryDate,
          status: (order.status as string) === 'completed' ? 'completed' : 'pending',
          relatedId: order.id,
          color: (order.status as string) === 'completed' ? 'bg-gray-400' : 'bg-blue-500',
          isAllDay: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
        });
      }
    });
    
    return pickupDeliveryEvents;
  }, [orders]);

  // 모든 이벤트 합치기
  const allEvents = useMemo(() => {
    const combinedEvents = [...events, ...convertOrdersToEvents];
    
    // 이벤트 타입 필터링
    if (selectedEventType !== '전체') {
      return combinedEvents.filter(event => event.type === selectedEventType);
    }
    
    return combinedEvents;
  }, [events, convertOrdersToEvents, selectedEventType]);

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    return allEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      eventStart.setHours(0, 0, 0, 0);

      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      eventEnd.setHours(23, 59, 59, 999); // For multi-day events, check until the end of the day

      return dayStart >= eventStart && dayStart <= eventEnd;
    });
  };

  // 이벤트 클릭 핸들러
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayEventsDialogOpen(true);
  };

  // 새 이벤트 생성 핸들러
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  // 요일 헤더
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="일정 관리" 
        description="매장의 모든 일정을 한눈에 확인하세요." 
      />

      {/* 필터 및 네비게이션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 이벤트 타입 필터 버튼들 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">필터:</span>
                {eventTypes.map((type) => (
                  <Button
                    key={type.value}
                    variant={selectedEventType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedEventType(type.value)}
                    className={`text-xs px-3 py-1 h-auto ${
                      selectedEventType === type.value 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${type.color} mr-2`}></div>
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={goToPreviousMonth}>
                이전
              </Button>
              <Button variant="outline" onClick={goToToday}>
                오늘
              </Button>
              <Button variant="outline" onClick={goToNextMonth}>
                다음
              </Button>
              <Button onClick={handleCreateEvent} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                새 일정
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </h2>
          </div>
        </CardHeader>
      </Card>

      {/* 캘린더 */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="animate-pulse">
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 42 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* 요일 헤더 */}
              {weekDays.map((day) => (
                <div key={day} className="h-10 flex items-center justify-center font-medium text-gray-700">
                  {day}
                </div>
              ))}
              
              {/* 날짜들 */}
              {monthDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isTodayDate = isToday(day);
                
                return (
                  <div
                    key={index}
                    className={`min-h-24 p-1 border border-gray-200 cursor-pointer transition-colors ${
                      isTodayDate ? 'bg-blue-50 border-blue-300' : ''
                    } ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isTodayDate ? 'text-blue-600' : 
                      isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded cursor-pointer ${event.color} text-white truncate`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3}개 더
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이벤트 다이얼로그 */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onOpenChange={setIsEventDialogOpen}
        event={selectedEvent}
        onSave={async (eventData) => {
          if (selectedEvent) {
            await updateEvent(selectedEvent.id, eventData);
          } else {
            await createEvent(eventData);
          }
          setIsEventDialogOpen(false);
        }}
        onDelete={async () => {
          if (selectedEvent) {
            await deleteEvent(selectedEvent.id);
            setIsEventDialogOpen(false);
          }
        }}
        currentUser={user}
      />

      {/* 일일 이벤트 다이얼로그 */}
      <DayEventsDialog
        isOpen={isDayEventsDialogOpen}
        onOpenChange={setIsDayEventsDialogOpen}
        date={selectedDate}
        events={selectedDate ? getEventsForDate(selectedDate) : []}
        onEventClick={handleEventClick}
      />
    </div>
  );
}
