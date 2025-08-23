
"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DashboardBillboard } from "@/components/dashboard-billboard";
import { Building, DollarSign, Package, Users, TrendingUp, Calendar, CalendarDays, ShoppingCart, CheckSquare, RefreshCw } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useShopSettings } from "@/hooks/use-shop-settings";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardStats {
  totalRevenue: number;
  newCustomers: number;
  weeklyOrders: number;
  pendingOrders: number;
}

interface Order {
  id: string;
  orderer: {
    name: string;
    contact: string;
    company: string;
    email: string;
  };
  orderDate: any;
  total: number;
  status: string;
  productNames?: string;
  receiptType?: string;
  pickupInfo?: {
    date: string;
    time: string;
    pickerName: string;
    pickerContact: string;
  };
  deliveryInfo?: {
    date: string;
    time: string;
    recipientName: string;
    recipientContact: string;
    address: string;
    district: string;
  };
}

// 차트 데이터 타입 (단일 매장 시스템)
interface DailySalesData {
  date: string;
  totalSales: number;
}

interface WeeklySalesData {
  week: string;
  totalSales: number;
}

interface MonthlySalesData {
  month: string;
  totalSales: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { shopSettings } = useShopSettings();
  
  // 브라우저 탭 제목 업데이트
  useEffect(() => {
    const title = getDashboardTitle();
    document.title = title;
  }, [settings]);

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    newCustomers: 0,
    weeklyOrders: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 주문 상세보기 다이얼로그 상태
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false);
  
  // 차트별 데이터 상태
  const [dailySales, setDailySales] = useState<DailySalesData[]>([]);
  const [weeklySales, setWeeklySales] = useState<WeeklySalesData[]>([]);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesData[]>([]);
  
  // 실시간 리스너 관리
  const [dailyUnsubscribe, setDailyUnsubscribe] = useState<(() => void) | null>(null);
  const [weeklyUnsubscribe, setWeeklyUnsubscribe] = useState<(() => void) | null>(null);
  const [monthlyUnsubscribe, setMonthlyUnsubscribe] = useState<(() => void) | null>(null);
  const [statsUnsubscribe, setStatsUnsubscribe] = useState<(() => void) | null>(null);
  
  // 차트별 날짜 필터링 상태
  const [dailyStartDate, setDailyStartDate] = useState(format(new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dailyEndDate, setDailyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [weeklyStartDate, setWeeklyStartDate] = useState(format(new Date(Date.now() - 56 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [weeklyEndDate, setWeeklyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [monthlyStartDate, setMonthlyStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1), 'yyyy-MM-dd'));
  const [monthlyEndDate, setMonthlyEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // 기존 날짜 상태 (다른 용도로 사용)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeek, setSelectedWeek] = useState(format(new Date(), 'yyyy-\'W\'ww'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // 대시보드 제목 가져오기
  const getDashboardTitle = () => {
    return '대시보드';
  };

  // 14일간 매출 차트 데이터 생성 (단일 매장) - 실시간 업데이트
  const generateDailySales = (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 13);
        return date;
      })();
      
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      // 실시간 리스너 설정
      const unsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 날짜별로 데이터 그룹화
      const salesByDate: { [key: string]: number } = {};
      
      // 선택된 기간 날짜 초기화
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = format(d, 'yyyy-MM-dd');
        salesByDate[dateKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
        allOrders.forEach((order: any) => {
          const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
          const dateKey = format(orderDate, 'yyyy-MM-dd');
        const total = order.summary?.total || order.total || 0;
        
          if (salesByDate.hasOwnProperty(dateKey)) {
          salesByDate[dateKey] += total;
        }
      });
      
        // 차트 데이터 형식으로 변환 (M/d 형식)
        const chartData = Object.entries(salesByDate).map(([date, totalSales]) => {
          const dateObj = parseISO(date);
          return {
            date: format(dateObj, 'M/d'),
            totalSales
          };
        });
        
        setDailySales(chartData);
      }, (error) => {
        console.error("Error in daily sales listener:", error);
      });
      
      // 클린업 함수 반환
      return unsubscribe;
    } catch (error) {
      console.error("Error generating daily sales:", error);
    }
  };

  // 8주간 매출 차트 데이터 생성 (단일 매장) - 실시간 업데이트
  const generateWeeklySales = (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 56);
        return date;
      })();
      
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      // 실시간 리스너 설정
      const unsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 주별로 데이터 그룹화
        const salesByWeek: { [key: string]: number } = {};
        
        // 선택된 기간 주 초기화
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
          const weekKey = format(d, 'yyyy-\'W\'ww');
          salesByWeek[weekKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
      allOrders.forEach((order: any) => {
          const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
          const weekKey = format(orderDate, 'yyyy-\'W\'ww');
        const total = order.summary?.total || order.total || 0;
        
          if (salesByWeek.hasOwnProperty(weekKey)) {
            salesByWeek[weekKey] += total;
          }
        });
        
        // 차트 데이터 형식으로 변환 (YYYY-주차 WW 형식)
        const chartData = Object.entries(salesByWeek).map(([week, totalSales]) => {
          // 'yyyy-Www' 형식을 파싱하여 YYYY-주차 WW 형식으로 변환
          const [year, weekNum] = week.split('-W');
        
        return {
            week: `${year}-주차 ${weekNum}`,
            totalSales
        };
      });
        
        setWeeklySales(chartData);
      }, (error) => {
        console.error("Error in weekly sales listener:", error);
      });
      
      // 클린업 함수 반환
      return unsubscribe;
    } catch (error) {
      console.error("Error generating weekly sales:", error);
    }
  };

  // 12개월간 매출 차트 데이터 생성 (단일 매장) - 실시간 업데이트
  const generateMonthlySales = (startDate?: Date, endDate?: Date) => {
    try {
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 11);
        return date;
      })();
      
      const startOfDay = new Date(start);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(end);
      endOfDay.setHours(23, 59, 59, 999);
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startOfDay)),
        where("orderDate", "<=", Timestamp.fromDate(endOfDay))
      );
      
      // 실시간 리스너 설정
      const unsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      // 월별로 데이터 그룹화
        const salesByMonth: { [key: string]: number } = {};
      
      // 선택된 기간 월 초기화
        for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
          const monthKey = format(d, 'yyyy-MM');
          salesByMonth[monthKey] = 0;
      }
      
      // 주문 데이터로 매출 계산
      allOrders.forEach((order: any) => {
          const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
          const monthKey = format(orderDate, 'yyyy-MM');
        const total = order.summary?.total || order.total || 0;
        
          if (salesByMonth.hasOwnProperty(monthKey)) {
            salesByMonth[monthKey] += total;
          }
        });
        
        // 차트 데이터 형식으로 변환 (M월 형식)
        const chartData = Object.entries(salesByMonth).map(([month, totalSales]) => {
          const dateObj = parseISO(month + '-01');
        return {
            month: format(dateObj, 'M월', { locale: ko }),
            totalSales
        };
      });
        
        setMonthlySales(chartData);
      }, (error) => {
        console.error("Error in monthly sales listener:", error);
      });
      
      // 클린업 함수 반환
      return unsubscribe;
    } catch (error) {
      console.error("Error generating monthly sales:", error);
    }
  };

  // 통계 데이터 실시간 업데이트
  const setupStatsListener = () => {
    try {
      const ordersQuery = query(collection(db, "orders"), orderBy("orderDate", "desc"));
      
      const unsubscribe = onSnapshot(ordersQuery, (ordersSnapshot) => {
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
        // 전체 매출 계산
        const totalRevenue = allOrders.reduce((sum, order) => sum + (order.summary?.total || order.total || 0), 0);
        
        // 최근 7일 주문 수
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyOrders = allOrders.filter(order => {
          const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
          return orderDate >= oneWeekAgo;
        }).length;
        
        // 대기 중인 주문 수
        const pendingOrders = allOrders.filter(order => 
          order.status === 'pending' || order.status === 'processing'
        ).length;
        
        // 고객 수 (중복 제거)
        const uniqueCustomers = new Set(allOrders.map(order => order.orderer?.email || order.orderer?.contact)).size;
        
                 // 최근 주문 5개
         const recentOrdersData = allOrders.slice(0, 5).map(order => ({
           id: order.id,
           orderer: order.orderer,
           orderDate: order.orderDate,
           total: order.summary?.total || order.total,
           status: order.status,
           productNames: order.items?.map((item: any) => item.name).join(', ') || order.productNames,
           receiptType: order.receiptType,
           pickupInfo: order.pickupInfo,
           deliveryInfo: order.deliveryInfo
         }));
        
        setStats({
          totalRevenue,
          newCustomers: uniqueCustomers,
          weeklyOrders,
          pendingOrders
        });
        
        setRecentOrders(recentOrdersData);
      }, (error) => {
        console.error("Error in stats listener:", error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up stats listener:", error);
    }
  };

  // 대시보드 통계 데이터 로드
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // 통계 데이터 실시간 리스너 설정
      const statsUnsub = setupStatsListener();
      if (statsUnsub) setStatsUnsubscribe(() => statsUnsub);
      
      // 차트 데이터 생성 (실시간 리스너 설정)
      const dailyUnsub = generateDailySales();
      const weeklyUnsub = generateWeeklySales();
      const monthlyUnsub = generateMonthlySales();
      
      if (dailyUnsub) setDailyUnsubscribe(() => dailyUnsub);
      if (weeklyUnsub) setWeeklyUnsubscribe(() => weeklyUnsub);
      if (monthlyUnsub) setMonthlyUnsubscribe(() => monthlyUnsub);
      
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 필터 변경 핸들러
  const handleDailyDateChange = () => {
    // 기존 리스너 정리
    if (dailyUnsubscribe) {
      dailyUnsubscribe();
    }
    
    const start = parseISO(dailyStartDate);
    const end = parseISO(dailyEndDate);
    const newUnsub = generateDailySales(start, end);
    if (newUnsub) setDailyUnsubscribe(() => newUnsub);
  };

  const handleWeeklyDateChange = () => {
    // 기존 리스너 정리
    if (weeklyUnsubscribe) {
      weeklyUnsubscribe();
    }
    
    const start = parseISO(weeklyStartDate);
    const end = parseISO(weeklyEndDate);
    const newUnsub = generateWeeklySales(start, end);
    if (newUnsub) setWeeklyUnsubscribe(() => newUnsub);
  };

  const handleMonthlyDateChange = () => {
    // 기존 리스너 정리
    if (monthlyUnsubscribe) {
      monthlyUnsubscribe();
    }
    
    const start = parseISO(monthlyStartDate);
    const end = parseISO(monthlyEndDate);
    const newUnsub = generateMonthlySales(start, end);
    if (newUnsub) setMonthlyUnsubscribe(() => newUnsub);
  };

  // 날짜 필터 변경 시 자동으로 차트 업데이트
  useEffect(() => {
    if (dailyUnsubscribe) handleDailyDateChange();
  }, [dailyStartDate, dailyEndDate]);

  useEffect(() => {
    if (weeklyUnsubscribe) handleWeeklyDateChange();
  }, [weeklyStartDate, weeklyEndDate]);

  useEffect(() => {
    if (monthlyUnsubscribe) handleMonthlyDateChange();
  }, [monthlyStartDate, monthlyEndDate]);

  // 주문 상세보기 열기
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOrderDetailDialogOpen(true);
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadDashboardStats();
  }, []);
  
  // 컴포넌트 언마운트 시 리스너 정리
  useEffect(() => {
    return () => {
      if (dailyUnsubscribe) dailyUnsubscribe();
      if (weeklyUnsubscribe) weeklyUnsubscribe();
      if (monthlyUnsubscribe) monthlyUnsubscribe();
      if (statsUnsubscribe) statsUnsubscribe();
    };
  }, [dailyUnsubscribe, weeklyUnsubscribe, monthlyUnsubscribe, statsUnsubscribe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-lg">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={getDashboardTitle()}
        description="현재 상태를 한 눈에 파악하세요."
      />

      <DashboardBillboard />
      
      {/* 대시보드 메뉴바 */}
      <div className="flex gap-4 p-4 bg-white rounded-lg border shadow-sm">
        <Button
          onClick={() => router.push('/dashboard/checklist')}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white border-green-600"
        >
          <CheckSquare className="h-4 w-4" />
          체크리스트
        </Button>
        <Button
          onClick={() => router.push('/dashboard/calendar')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        >
          <Calendar className="h-4 w-4" />
          일정관리
        </Button>
      </div>
      
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString()}원
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 고객 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomers}명</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">주간 주문</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weeklyOrders}건</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 주문</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}건</div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="space-y-6">
        {/* 일별/주간 차트 (2개 1열) */}
        <div className="grid gap-6 md:grid-cols-2">
        {/* 일별 매출 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>일별 매출 현황</CardTitle>
            <p className="text-sm text-muted-foreground">선택된 기간 지점별 매출 비율</p>
            <div className="flex gap-2">
                <Input
                  type="date"
                   value={dailyStartDate}
                onChange={(e) => setDailyStartDate(e.target.value)}
                   className="w-32"
                 />
                 <Input
                   type="date"
                   value={dailyEndDate}
                onChange={(e) => setDailyEndDate(e.target.value)}
                   className="w-32"
                />
              
            </div>
          </CardHeader>
          <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={dailySales}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="date" />
                   <YAxis />
                   <Tooltip 
                     formatter={(value, name) => [
                       `${value?.toLocaleString()}원`, 
                       '매출'
                     ]}
                     labelFormatter={(label) => `날짜: ${label}`}
                   />
                   <Bar dataKey="totalSales" fill="#8884d8" />
                 </BarChart>
               </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주별 매출 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>주간 매출 현황</CardTitle>
            <p className="text-sm text-muted-foreground">선택된 기간 지점별 매출 비율</p>
            <div className="flex gap-2">
                <Input
                   type="date"
                   value={weeklyStartDate}
                onChange={(e) => setWeeklyStartDate(e.target.value)}
                   className="w-32"
                 />
                 <Input
                   type="date"
                   value={weeklyEndDate}
                onChange={(e) => setWeeklyEndDate(e.target.value)}
                   className="w-32"
                />
              
            </div>
          </CardHeader>
          <CardContent>
                           <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={weeklySales}>
                   <CartesianGrid strokeDasharray="3 3" />
                   <XAxis dataKey="week" />
                   <YAxis />
                   <Tooltip 
                     formatter={(value, name) => [
                       `${value?.toLocaleString()}원`, 
                       '매출'
                     ]}
                     labelFormatter={(label) => `주차: ${label}`}
                   />
                   <Bar dataKey="totalSales" fill="#82ca9d" />
                 </BarChart>
               </ResponsiveContainer>
          </CardContent>
        </Card>
        </div>

        {/* 월별 매출 차트 (1열) */}
        <Card>
          <CardHeader>
            <CardTitle>월별 매출 현황</CardTitle>
            <p className="text-sm text-muted-foreground">선택된 기간 월별 매출</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={monthlyStartDate}
                onChange={(e) => setMonthlyStartDate(e.target.value)}
                className="w-32"
              />
              <Input
                type="date"
                value={monthlyEndDate}
                onChange={(e) => setMonthlyEndDate(e.target.value)}
                className="w-32"
              />
              
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value?.toLocaleString()}원`, 
                    '매출'
                  ]}
                  labelFormatter={(label) => `월: ${label}`}
                />
                <Bar dataKey="totalSales" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 최근 주문 (1열) */}
        <Card>
          <CardHeader>
            <CardTitle>최근 주문</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">주문ID</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">주문자</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">상품명</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">주문일</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">상태</th>
                    <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleOrderClick(order)}
                    >
                      <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                        {order.id.slice(-8)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {order.orderer.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">
                        {order.productNames || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.orderDate?.toDate?.() 
                          ? format(order.orderDate.toDate(), 'MM/dd HH:mm')
                          : format(new Date(order.orderDate), 'MM/dd HH:mm')
                        }
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={order.status === 'completed' ? 'default' : order.status === 'processing' ? 'secondary' : 'outline'}>
                          {order.status === 'completed' ? '완료' : order.status === 'processing' ? '처리중' : order.status === 'pending' ? '대기' : order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-right font-medium text-blue-600">
                        {(order.total || 0)?.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  최근 주문이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주문 상세보기 다이얼로그 */}
      <Dialog open={orderDetailDialogOpen} onOpenChange={setOrderDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>주문 상세 정보</DialogTitle>
            <DialogDescription>
              선택한 주문의 상세 정보를 확인할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">주문자 정보</h3>
                <p>이름: {selectedOrder.orderer.name}</p>
                <p>연락처: {selectedOrder.orderer.contact}</p>
                <p>회사: {selectedOrder.orderer.company}</p>
                <p>이메일: {selectedOrder.orderer.email}</p>
               </div>
              <div>
                <h3 className="font-medium">주문 정보</h3>
                <p>주문일: {
                  selectedOrder.orderDate?.toDate?.() 
                    ? format(selectedOrder.orderDate.toDate(), 'yyyy-MM-dd HH:mm')
                    : format(new Date(selectedOrder.orderDate), 'yyyy-MM-dd HH:mm')
                }</p>
                                 <p>총 금액: {(selectedOrder.total || 0)?.toLocaleString()}원</p>
                <p>상태: {selectedOrder.status}</p>
                {selectedOrder.productNames && (
                  <p>상품: {selectedOrder.productNames}</p>
                )}
             </div>
             </div>
           )}
         </DialogContent>
       </Dialog>
    </div>
  );
}

