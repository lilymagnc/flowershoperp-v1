
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Building, DollarSign, Package, Users, TrendingUp, Calendar, CalendarDays } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranches } from "@/hooks/use-branches";

import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardStats {
  totalRevenue: number;
  newCustomers: number;
  totalProducts: number;
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
  branchName: string;
}

interface ChartData {
  date: string;
  sales: number;
  color: string;
}

export default function DashboardPage() {
  const { branches, loading: branchesLoading } = useBranches();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    newCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 차트별 데이터 상태
  const [dailySales, setDailySales] = useState<ChartData[]>([]);
  const [weeklySales, setWeeklySales] = useState<ChartData[]>([]);
  const [monthlySales, setMonthlySales] = useState<ChartData[]>([]);

  // 색상 팔레트 정의
  const dailyColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#F7DC6F'
  ];

  const weeklyColors = [
    '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E'
  ];

  const monthlyColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
  ];

  // 지난 14일간 일별 매출 데이터 생성
  const generateDailySales = async () => {
    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 13);
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startDate)),
        where("orderDate", "<=", Timestamp.fromDate(endDate))
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const salesByDay: { [key: string]: number } = {};
      days.forEach(day => {
        salesByDay[format(day, 'MM/dd')] = 0;
      });
      
      orders.forEach((order: any) => {
        const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
        const dayKey = format(orderDate, 'MM/dd');
        const total = order.summary?.total || order.total || 0;
        if (salesByDay.hasOwnProperty(dayKey)) {
          salesByDay[dayKey] += total;
        }
      });
      
      const result = days.map((day, index) => ({
        date: format(day, 'MM/dd'),
        sales: salesByDay[format(day, 'MM/dd')],
        color: dailyColors[index]
      }));
      
      return result;
    } catch (error) {
      console.error("Error generating daily sales:", error);
      return [];
    }
  };

  // 지난 8주간 주간 매출 데이터 생성
  const generateWeeklySales = async () => {
    try {
      const endDate = new Date();
      const startDate = subWeeks(endDate, 7);
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(startDate)),
        where("orderDate", "<=", Timestamp.fromDate(endDate))
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const salesByWeek: { [key: string]: number } = {};
      weeks.forEach(week => {
        salesByWeek[format(week, 'MM/dd')] = 0;
      });
      
      orders.forEach((order: any) => {
        const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
        const weekKey = format(orderDate, 'MM/dd');
        const total = order.summary?.total || order.total || 0;
        if (salesByWeek.hasOwnProperty(weekKey)) {
          salesByWeek[weekKey] += total;
        }
      });
      
      const result = weeks.map((week, index) => ({
        date: format(week, 'MM/dd'),
        sales: salesByWeek[format(week, 'MM/dd')],
        color: weeklyColors[index]
      }));
      
      return result;
    } catch (error) {
      console.error("Error generating weekly sales:", error);
      return [];
    }
  };

  // 1월부터 12월까지 월별 매출 데이터 생성
  const generateMonthlySales = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));
      
      const ordersQuery = query(
        collection(db, "orders"),
        where("orderDate", ">=", Timestamp.fromDate(new Date(currentYear, 0, 1))),
        where("orderDate", "<=", Timestamp.fromDate(new Date(currentYear, 11, 31)))
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const salesByMonth: { [key: string]: number } = {};
      months.forEach(month => {
        salesByMonth[format(month, 'M월')] = 0;
      });
      
      orders.forEach((order: any) => {
        const orderDate = order.orderDate?.toDate?.() || new Date(order.orderDate);
        const monthKey = format(orderDate, 'M월');
        const total = order.summary?.total || order.total || 0;
        if (salesByMonth.hasOwnProperty(monthKey)) {
          salesByMonth[monthKey] += total;
        }
      });
      
      const result = months.map((month, index) => ({
        date: format(month, 'M월'),
        sales: salesByMonth[format(month, 'M월')],
        color: monthlyColors[index]
      }));
      
      return result;
    } catch (error) {
      console.error("Error generating monthly sales:", error);
      return [];
    }
  };

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        console.log("대시보드 데이터 로딩 시작...");
        
        // 주문 데이터 가져오기
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("주문 데이터:", orders.length, "개");
        
        // 최근 주문 (실제 데이터)
        const recentOrdersQuery = query(
          collection(db, "orders"),
          orderBy("orderDate", "desc"),
          limit(5)
        );
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrdersData = recentOrdersSnapshot.docs.map(doc => {
          const orderData = doc.data();
          return {
            id: doc.id,
            orderer: orderData.orderer || { name: '주문자 정보 없음' },
            orderDate: orderData.orderDate,
            total: orderData.summary?.total || orderData.total || 0,
            status: orderData.status || 'pending',
            branchName: orderData.branchName || '지점 미지정'
          };
        });
        setRecentOrders(recentOrdersData);
        console.log("최근 주문:", recentOrdersData.length, "개");
        
        // 기본 통계
        const totalRevenue = orders.reduce((acc, order: any) => acc + (order.summary?.total || order.total || 0), 0);
        const pendingOrders = orders.filter((order: any) => order.status === 'pending' || order.status === 'processing').length;
        
        // 상품 수
        const productsSnapshot = await getDocs(collection(db, "products"));
        const products = productsSnapshot.docs.map(doc => doc.data());
        const uniqueProductIds = new Set(products.map(product => product.id).filter(Boolean));
        const totalProducts = uniqueProductIds.size;
        console.log("상품 데이터:", totalProducts, "개");
        
        // 고객 수
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const newCustomers = customersSnapshot.size;
        console.log("고객 데이터:", newCustomers, "개");
        
        setStats({
          totalRevenue,
          newCustomers,
          totalProducts,
          pendingOrders
        });
        console.log("통계 설정 완료:", { totalRevenue, newCustomers, totalProducts, pendingOrders });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    // branches 로딩이 완료되면 데이터 로드
    if (!branchesLoading) {
      fetchDashboardData().then(async () => {
        // 차트 데이터 생성
        const dailyData = await generateDailySales();
        const weeklyData = await generateWeeklySales();
        const monthlyData = await generateMonthlySales();
        setDailySales(dailyData);
        setWeeklySales(weeklyData);
        setMonthlySales(monthlyData);
      });
    }
  }, [branchesLoading]);

  const formatCurrency = (value: number) => `₩${value.toLocaleString()}`;
  
  const formatDate = (date: any) => {
    if (!date) return '날짜 없음';
    if (date.toDate) {
      return date.toDate().toLocaleDateString('ko-KR');
    }
    return new Date(date).toLocaleDateString('ko-KR');
  };
  
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'completed': { text: '완료', color: 'bg-green-100 text-green-800' },
      'processing': { text: '처리중', color: 'bg-blue-100 text-blue-800' },
      'pending': { text: '대기', color: 'bg-yellow-100 text-yellow-800' },
      'cancelled': { text: '취소', color: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

  // 차트용 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            매출: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="대시보드" description="시스템의 현재 상태를 한 눈에 파악하세요." />
        <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="대시보드"
        description="시스템의 현재 상태를 한 눈에 파악하세요."
      />
      
      {/* 상단 통계 카드 */}
      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              실시간 매출 현황
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">등록 고객</CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newCustomers}</div>
            <p className="text-xs opacity-90 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              전체 등록 고객
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">등록된 상품 수</CardTitle>
            <Package className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
            <p className="text-xs opacity-90">고유 바코드 기준</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">처리 대기</CardTitle>
            <Calendar className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs opacity-90">처리 필요한 주문</p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 일별 매출 현황 - 지난 14일 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              일별 매출 현황
            </CardTitle>
            <p className="text-sm text-blue-600">지난 14일간 매출 추이</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="dailyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} 
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fill="url(#dailyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 주간 매출 현황 - 지난 8주 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CalendarDays className="h-5 w-5" />
              주간 매출 현황
            </CardTitle>
            <p className="text-sm text-green-600">지난 8주간 매출 추이</p>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} 
                  fontSize={12}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 월별 매출 현황 - 1월부터 12월 */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Building className="h-5 w-5" />
            월별 매출 현황
          </CardTitle>
          <p className="text-sm text-purple-600">2024년 월별 매출 현황</p>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlySales}>
              <defs>
                <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                fontSize={12} 
                tick={{ fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis 
                tickFormatter={(value) => `₩${(value/1000000).toFixed(1)}M`} 
                fontSize={12}
                tick={{ fill: '#6B7280' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="sales" 
                radius={[6, 6, 0, 0]}
                fill="url(#monthlyGradient)"
              >
                {monthlySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={monthlyColors[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 최근 주문 목록 */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Package className="h-5 w-5" />
            최근 주문
          </CardTitle>
          <p className="text-sm text-orange-600">실시간 주문 현황</p>
        </CardHeader>
        <CardContent className="pt-6">
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문자</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">주문일</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">출고지점</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{order.orderer?.name || '주문자 정보 없음'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{order.branchName}</p>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">주문 데이터가 없습니다.</p>
              <p className="text-gray-400 text-sm mt-2">새로운 주문이 들어오면 여기에 표시됩니다.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
