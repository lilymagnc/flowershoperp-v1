"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Clock,
  Star,
  Gift,
  MapPin,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye,
  TrendingDown,
  Activity
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { useOrders } from '@/hooks/use-orders';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useSimpleExpenses } from '@/hooks/use-simple-expenses';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 차트 컴포넌트 (실제 차트 라이브러리 사용 시 교체)
const SimpleChart = ({ data, title, type = 'bar' }: { data: any[], title: string, type?: string }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">{title}</p>
          <p className="text-xs text-gray-400">데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">{title}</h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {data.slice(0, 8).map((item, index) => {
          const key = Object.keys(item)[0];
          const value = item[key];
          const displayName = key === 'method' ? getPaymentMethodName(value) : 
                             key === 'category' ? getExpenseCategoryName(value) :
                             key === 'hour' ? value :
                             key === 'day' ? value :
                             key === 'region' ? value :
                             key === 'name' ? value :
                             key === 'month' ? value : key;
          
          return (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600 truncate flex-1">{displayName}</span>
              <span className="text-sm font-medium text-gray-900">
                {typeof value === 'number' ? 
                  (key === 'amount' || key === 'revenue' ? 
                    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(value) :
                    value.toLocaleString()
                  ) : value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 결제 수단 이름 변환
const getPaymentMethodName = (method: string) => {
  const methodNames: { [key: string]: string } = {
    'card': '카드',
    'cash': '현금',
    'transfer': '계좌이체',
    'mainpay': '메인페이',
    'shopping_mall': '쇼핑몰',
    'epay': '이페이',
    '기타': '기타'
  };
  return methodNames[method] || method;
};

// 지출 카테고리 이름 변환
const getExpenseCategoryName = (category: string) => {
  const categoryNames: { [key: string]: string } = {
    'flower': '꽃/식물',
    'vase': '화분/화병',
    'ribbon': '리본/포장',
    'card': '카드/메시지',
    'delivery': '배송비',
    'utility': '공과금',
    'rent': '임대료',
    'salary': '인건비',
    'marketing': '마케팅',
    'maintenance': '유지보수',
    'supplies': '소모품',
    'food': '식비',
    'transportation': '교통비',
    'other': '기타',
    '기타': '기타'
  };
  return categoryNames[category] || category;
};

// 통계 카드 컴포넌트
const StatCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = 'blue',
  subtitle 
}: {
  title: string;
  value: string;
  change?: string;
  icon: any;
  color?: string;
  subtitle?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <p className={`text-xs flex items-center gap-1 ${
                change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {change.startsWith('+') ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {change}
              </p>
            )}
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState('month');
  const { orders, loading: ordersLoading } = useOrders();
  const { customers, loading: customersLoading } = useCustomers();
  const { products, loading: productsLoading } = useProducts();
  const { expenses, loading: expensesLoading } = useSimpleExpenses();

  // 날짜 범위 계산
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'week':
        return {
          from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: now
        };
      case 'month':
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now
        };
      case 'quarter':
        return {
          from: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
          to: now
        };
      case 'year':
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: now
        };
      default:
        return { from: now, to: now };
    }
  };

  const { from, to } = getDateRange();

  // 기본 통계 계산
  const calculateStats = () => {
    if (!orders || orders.length === 0) {
      return {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        totalCustomers: customers?.length || 0,
        newCustomers: 0,
        popularProducts: [],
        topCustomers: [],
        dailyRevenue: [],
        revenueChange: 0,
        ordersChange: 0,
        averageOrderChange: 0,
        newCustomersChange: 0,
        paymentMethods: [],
        hourlyOrders: [],
        weeklyRevenue: [],
        customerRegions: [],
        customerFrequency: [],
        productRevenue: [],
        lowStockProducts: [],
        seasonalTrends: [],
        birthdayCustomers: [],
        realTimeStats: {
          inProgress: 0,
          completed: 0,
          pending: 0
        },
        // 지출 분석 추가
        totalExpenses: 0,
        totalProfit: 0,
        profitMargin: 0,
        expensesByCategory: [],
        monthlyExpenses: [],
        expensesChange: 0,
        profitChange: 0
      };
    }

    const filteredOrders = orders.filter(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      return orderDate >= from && orderDate <= to;
    });

    // 지출 데이터 필터링
    const filteredExpenses = expenses?.filter(expense => {
      const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();
      return expenseDate >= from && expenseDate <= to;
    }) || [];

    // 이전 기간 계산 (비교용)
    const getPreviousPeriod = () => {
      const periodLength = to.getTime() - from.getTime();
      const previousTo = new Date(from.getTime());
      const previousFrom = new Date(from.getTime() - periodLength);
      return { from: previousFrom, to: previousTo };
    };

    const { from: prevFrom, to: prevTo } = getPreviousPeriod();
    const previousOrders = orders.filter(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      return orderDate >= prevFrom && orderDate <= prevTo;
    });

    const previousExpenses = expenses?.filter(expense => {
      const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();
      return expenseDate >= prevFrom && expenseDate <= prevTo;
    }) || [];

    // 기본 통계
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 지출 통계
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // 이전 기간 통계
    const prevTotalRevenue = previousOrders.reduce((sum, order) => sum + (order.summary.total || 0), 0);
    const prevTotalOrders = previousOrders.length;
    const prevAverageOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
    const prevTotalExpenses = previousExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const prevTotalProfit = prevTotalRevenue - prevTotalExpenses;

    // 증감률 계산
    const revenueChange = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
    const ordersChange = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
    const averageOrderChange = prevAverageOrderValue > 0 ? ((averageOrderValue - prevAverageOrderValue) / prevAverageOrderValue) * 100 : 0;
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0;
    const profitChange = prevTotalProfit !== 0 ? ((totalProfit - prevTotalProfit) / Math.abs(prevTotalProfit)) * 100 : 0;

    // 신규 고객 수
    const newCustomers = customers?.filter(customer => {
      const customerOrders = orders.filter(order => order.orderer.id === customer.id);
      if (customerOrders.length === 0) return false;
      
      const firstOrderDate = new Date(Math.min(...customerOrders.map(o => {
        const orderDate = o.orderDate instanceof Date ? o.orderDate : o.orderDate.toDate();
        return orderDate.getTime();
      })));
      return firstOrderDate >= from && firstOrderDate <= to;
    }).length || 0;

    const prevNewCustomers = customers?.filter(customer => {
      const customerOrders = orders.filter(order => order.orderer.id === customer.id);
      if (customerOrders.length === 0) return false;
      
      const firstOrderDate = new Date(Math.min(...customerOrders.map(o => {
        const orderDate = o.orderDate instanceof Date ? o.orderDate : o.orderDate.toDate();
        return orderDate.getTime();
      })));
      return firstOrderDate >= prevFrom && firstOrderDate <= prevTo;
    }).length || 0;

    const newCustomersChange = prevNewCustomers > 0 ? ((newCustomers - prevNewCustomers) / prevNewCustomers) * 100 : 0;

    // 인기 상품 (주문 빈도 기준)
    const productCounts: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const productName = item.name || '기타';
          productCounts[productName] = (productCounts[productName] || 0) + 1;
        });
      }
    });

    const popularProducts = Object.entries(productCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // VIP 고객 (주문 금액 기준)
    const customerRevenue: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const customerName = order.orderer.name || '익명';
      customerRevenue[customerName] = (customerRevenue[customerName] || 0) + (order.summary.total || 0);
    });

    const topCustomers = Object.entries(customerRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));

    // 일별 매출
    const dailyRevenue: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      const date = format(orderDate, 'yyyy-MM-dd');
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (order.summary.total || 0);
    });

    const dailyRevenueArray = Object.entries(dailyRevenue)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // 결제 수단별 매출
    const paymentMethods: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const method = order.payment.method || '기타';
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.summary.total || 0);
    });

    const paymentMethodsArray = Object.entries(paymentMethods)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 시간대별 주문
    const hourlyOrders: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      const hour = orderDate.getHours();
      const hourKey = `${hour}:00`;
      hourlyOrders[hourKey] = (hourlyOrders[hourKey] || 0) + 1;
    });

    const hourlyOrdersArray = Object.entries(hourlyOrders)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // 요일별 매출
    const weeklyRevenue: { [key: string]: number } = {};
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      const day = orderDate.getDay();
      const dayName = weekdays[day];
      weeklyRevenue[dayName] = (weeklyRevenue[dayName] || 0) + (order.summary.total || 0);
    });

    const weeklyRevenueArray = weekdays.map(day => ({
      day,
      revenue: weeklyRevenue[day] || 0
    }));

    // 지역별 고객 분포
    const customerRegions: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const region = order.deliveryInfo?.address?.split(' ')[1] || '기타';
      customerRegions[region] = (customerRegions[region] || 0) + 1;
    });

    const customerRegionsArray = Object.entries(customerRegions)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count);

    // 고객 주문 빈도
    const customerFrequency: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const customerName = order.orderer.name || '익명';
      customerFrequency[customerName] = (customerFrequency[customerName] || 0) + 1;
    });

    const customerFrequencyArray = Object.entries(customerFrequency)
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // 상품별 매출
    const productRevenue: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      if (order.items) {
        order.items.forEach((item: any) => {
          const productName = item.name || '기타';
          const revenue = (item.price || 0) * (item.quantity || 1);
          productRevenue[productName] = (productRevenue[productName] || 0) + revenue;
        });
      }
    });

    const productRevenueArray = Object.entries(productRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 재고 부족 상품 (실제 재고 데이터가 있다면 연결)
    const lowStockProducts = products?.filter(product => (product.stock || 0) < 10) || [];

    // 계절별 트렌드 (월별로 계산)
    const monthlyRevenue: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      const month = format(orderDate, 'yyyy-MM');
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (order.summary.total || 0);
    });

    const seasonalTrends = Object.entries(monthlyRevenue)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // 생일/기념일 고객 (이번 달)
    const currentMonth = new Date().getMonth();
    const birthdayCustomers = customers?.filter(customer => {
      if (!customer.birthday) return false;
      const birthday = new Date(customer.birthday);
      return birthday.getMonth() === currentMonth;
    }) || [];

    // 실시간 통계
    const today = new Date();
    const todayOrders = orders.filter(order => {
      const orderDate = order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate();
      return orderDate.toDateString() === today.toDateString();
    });

    const realTimeStats = {
      inProgress: todayOrders.filter(order => order.status === 'processing').length,
      completed: todayOrders.filter(order => order.status === 'completed').length,
      pending: todayOrders.filter(order => order.status === 'canceled').length
    };

    // 지출 분석
    // 카테고리별 지출
    const expensesByCategory: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      const category = expense.category || '기타';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + (expense.amount || 0);
    });

    const expensesByCategoryArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    // 월별 지출
    const monthlyExpenses: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      const expenseDate = expense.date instanceof Date ? expense.date : expense.date.toDate();
      const month = format(expenseDate, 'yyyy-MM');
      monthlyExpenses[month] = (monthlyExpenses[month] || 0) + (expense.amount || 0);
    });

    const monthlyExpensesArray = Object.entries(monthlyExpenses)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalCustomers: customers?.length || 0,
      newCustomers,
      popularProducts,
      topCustomers,
      dailyRevenue: dailyRevenueArray,
      revenueChange,
      ordersChange,
      averageOrderChange,
      newCustomersChange,
      paymentMethods: paymentMethodsArray,
      hourlyOrders: hourlyOrdersArray,
      weeklyRevenue: weeklyRevenueArray,
      customerRegions: customerRegionsArray,
      customerFrequency: customerFrequencyArray,
      productRevenue: productRevenueArray,
      lowStockProducts,
      seasonalTrends,
      birthdayCustomers,
      realTimeStats,
      // 지출 분석 추가
      totalExpenses,
      totalProfit,
      profitMargin,
      expensesByCategory: expensesByCategoryArray,
      monthlyExpenses: monthlyExpensesArray,
      expensesChange,
      profitChange
    };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDateRange = () => {
    return `${format(from, 'yyyy년 MM월 dd일', { locale: ko })} ~ ${format(to, 'yyyy년 MM월 dd일', { locale: ko })}`;
  };

  if (ordersLoading || customersLoading || productsLoading || expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>리포트 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="매장 분석 리포트"
        description="매출, 고객, 상품 데이터를 종합적으로 분석하여 매장 운영에 도움을 드립니다."
      />

      {/* 날짜 범위 선택 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">이번 주</SelectItem>
                  <SelectItem value="month">이번 달</SelectItem>
                  <SelectItem value="quarter">이번 분기</SelectItem>
                  <SelectItem value="year">이번 년도</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDateRange()}
              </Badge>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              리포트 내보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="총 매출"
          value={formatCurrency(stats.totalRevenue)}
          change={`${stats.revenueChange.toFixed(1)}%`}
          icon={DollarSign}
          color="green"
          subtitle="이번 기간"
        />
        <StatCard
          title="총 지출"
          value={formatCurrency(stats.totalExpenses)}
          change={`${stats.expensesChange.toFixed(1)}%`}
          icon={TrendingDown}
          color="red"
          subtitle="이번 기간"
        />
        <StatCard
          title="총 이윤"
          value={formatCurrency(stats.totalProfit)}
          change={`${stats.profitChange.toFixed(1)}%`}
          icon={Target}
          color={stats.totalProfit >= 0 ? "purple" : "red"}
          subtitle="이번 기간"
        />
        <StatCard
          title="이윤률"
          value={`${stats.profitMargin.toFixed(1)}%`}
          change={`${stats.profitChange.toFixed(1)}%`}
          icon={BarChart3}
          color={stats.profitMargin >= 0 ? "blue" : "red"}
          subtitle="매출 대비"
        />
        <StatCard
          title="신규 고객"
          value={stats.newCustomers.toString()}
          change={`${stats.newCustomersChange.toFixed(1)}%`}
          icon={Users}
          color="yellow"
          subtitle="이번 기간"
        />
      </div>

      {/* 메인 리포트 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            대시보드
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            매출 분석
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            지출 분석
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            고객 분석
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            상품 분석
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            트렌드 분석
          </TabsTrigger>
        </TabsList>

        {/* 대시보드 탭 */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 일별 매출 차트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  일별 매출 추이
                </CardTitle>
                <CardDescription>
                  선택한 기간의 일별 매출 변화를 확인합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart 
                  data={stats.dailyRevenue} 
                  title="일별 매출" 
                  type="line" 
                />
              </CardContent>
            </Card>

            {/* 이윤 분석 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  이윤 분석
                </CardTitle>
                <CardDescription>
                  매출, 지출, 이윤 현황을 한눈에 확인합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">매출</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">지출</p>
                      <p className="text-lg font-bold text-red-700">{formatCurrency(stats.totalExpenses)}</p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${stats.totalProfit >= 0 ? 'bg-purple-50' : 'bg-red-50'}`}>
                      <p className={`text-sm font-medium ${stats.totalProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>이윤</p>
                      <p className={`text-lg font-bold ${stats.totalProfit >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                        {formatCurrency(stats.totalProfit)}
                      </p>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">이윤률</p>
                    <p className={`text-xl font-bold ${stats.profitMargin >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {stats.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 상품 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  인기 상품 TOP 5
                </CardTitle>
                <CardDescription>
                  가장 많이 주문된 상품 순위
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.popularProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{product.count}회 주문</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* VIP 고객 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  VIP 고객 TOP 5
                </CardTitle>
                <CardDescription>
                  가장 많은 금액을 주문한 고객 순위
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCustomers.map((customer, index) => (
                    <div key={customer.name} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center p-0">
                          {index + 1}
                        </Badge>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{formatCurrency(customer.revenue)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 매출 분석 탭 */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  결제 수단별 매출
                </CardTitle>
                <CardDescription>
                  고객들이 선호하는 결제 방법 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.paymentMethods} title="결제 수단별 매출" type="pie" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  시간대별 주문 패턴
                </CardTitle>
                <CardDescription>
                  하루 중 주문이 가장 많은 시간대
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.hourlyOrders} title="시간대별 주문" type="bar" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                요일별 매출 분석
              </CardTitle>
              <CardDescription>
                요일별 주문 패턴과 매출 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleChart data={stats.weeklyRevenue} title="요일별 매출" type="bar" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 지출 분석 탭 */}
        <TabsContent value="expenses" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  카테고리별 지출
                </CardTitle>
                <CardDescription>
                  지출 내역을 카테고리별로 분석합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.expensesByCategory} title="카테고리별 지출" type="pie" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  월별 지출 분석
                </CardTitle>
                <CardDescription>
                  월별 지출 패턴 및 추이
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.monthlyExpenses} title="월별 지출" type="line" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 고객 분석 탭 */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  지역별 고객 분포
                </CardTitle>
                <CardDescription>
                  배송 지역별 고객 분포 현황
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.customerRegions} title="지역별 고객" type="pie" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  고객 주문 빈도
                </CardTitle>
                <CardDescription>
                  고객별 평균 주문 횟수 분석
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.customerFrequency} title="주문 빈도" type="bar" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                생일/기념일 고객 현황
              </CardTitle>
              <CardDescription>
                이번 달 생일/기념일인 고객 목록
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.birthdayCustomers.length > 0 ? (
                  stats.birthdayCustomers.map((customer, index) => (
                    <div key={customer.id} className="text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Gift className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="font-medium text-sm mb-1">{customer.name}</p>
                      <p className="text-xs text-gray-600">{customer.birthday ? format(new Date(customer.birthday), 'MM월 dd일') : '생일 정보 없음'}</p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-green-600 font-medium">이번 달 생일/기념일 고객 없음</p>
                    <p className="text-sm text-gray-500 mt-2">이번 달 생일/기념일인 고객이 없습니다</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 상품 분석 탭 */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  상품별 매출 순위
                </CardTitle>
                <CardDescription>
                  매출 기준 상품 순위
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={stats.productRevenue} title="상품별 매출" type="bar" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  재고 부족 상품
                </CardTitle>
                <CardDescription>
                  재고가 부족한 상품 알림
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.lowStockProducts.length > 0 ? (
                    stats.lowStockProducts.map((product, index) => (
                      <div key={product.id} className="text-center p-4 bg-red-50 rounded-lg">
                        <Package className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <p className="font-medium text-sm mb-1">{product.name}</p>
                        <p className="text-xs text-gray-600">재고: {product.stock || 0}개</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                      <p className="text-green-600 font-medium">모든 상품 재고 정상</p>
                      <p className="text-sm text-gray-500 mt-2">재고 부족 상품이 없습니다</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                계절별 상품 트렌드
              </CardTitle>
              <CardDescription>
                계절별 인기 상품 변화 추이
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleChart data={stats.seasonalTrends} title="계절별 트렌드" type="line" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 트렌드 분석 탭 */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  기념일별 매출 트렌드
                </CardTitle>
                <CardDescription>
                  생일, 결혼기념일 등 기념일별 매출 패턴
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={[]} title="기념일별 매출" type="line" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  월별 매출 예측
                </CardTitle>
                <CardDescription>
                  다음 달 매출 예측 및 트렌드
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleChart data={[]} title="매출 예측" type="line" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                실시간 모니터링
              </CardTitle>
              <CardDescription>
                현재 진행 중인 주문 및 실시간 현황
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <ShoppingCart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-blue-600">{stats.realTimeStats.inProgress}</p>
                  <p className="text-sm text-gray-600">진행 중 주문</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-green-600">{stats.realTimeStats.completed}</p>
                  <p className="text-sm text-gray-600">오늘 완료</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-yellow-600">{stats.realTimeStats.pending}</p>
                  <p className="text-sm text-gray-600">배송 대기</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
