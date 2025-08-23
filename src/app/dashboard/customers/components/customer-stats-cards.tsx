"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, TrendingUp, Users } from "lucide-react";
import { Customer } from "@/hooks/use-customers";
import { useOrders } from "@/hooks/use-orders";
import { useMemo } from "react";

interface CustomerStatsCardsProps {
  customers: Customer[];
}

export function CustomerStatsCards({ customers }: CustomerStatsCardsProps) {
  const { orders } = useOrders();

  // 고객 통계 계산 (단일 매장)
  const customerStats = useMemo(() => {
    const totalPoints = customers.reduce((total, customer) => total + (customer.points || 0), 0);
    const topCustomer = customers.reduce((top, customer) => 
      (customer.points || 0) > (top?.points || 0) ? customer : top, null as Customer | null
    );
    
    return {
      totalCustomers: customers.length,
      totalPoints,
      topCustomer
    };
  }, [customers]);

  // TOP 10 고객 리스트 (포인트 보유량 기준)
  const top10Customers = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10)
      .map((customer, index) => {
        // 최근 주문에서 정보 가져오기
        const customerOrders = orders.filter(order => 
          (order.orderer?.name === customer.name && order.orderer?.contact === customer.contact) ||
          order.orderer?.id === customer.id
        ).sort((a, b) => {
          const dateA = a.orderDate?.toDate ? a.orderDate.toDate() : new Date();
          const dateB = b.orderDate?.toDate ? b.orderDate.toDate() : new Date();
          return dateB.getTime() - dateA.getTime();
        });
        
        const totalOrderAmount = customerOrders.reduce((total, order) => total + (order.summary?.total || 0), 0);
        
        return {
          ...customer,
          rank: index + 1,
          totalOrderAmount,
          orderCount: customerOrders.length
        };
      });
  }, [customers, orders]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* 전체 고객 수 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">전체 고객</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{customerStats.totalCustomers}명</div>
          <p className="text-xs text-muted-foreground">
            등록된 총 고객 수
          </p>
        </CardContent>
      </Card>

      {/* 총 보유 포인트 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 보유 포인트</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {customerStats.totalPoints.toLocaleString()}P
          </div>
          <p className="text-xs text-muted-foreground">
            모든 고객의 포인트 합계
          </p>
        </CardContent>
      </Card>

      {/* 최고 포인트 고객 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">최고 포인트 고객</CardTitle>
          <Trophy className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {customerStats.topCustomer ? (customerStats.topCustomer.points || 0).toLocaleString() : 0}P
          </div>
          <p className="text-xs text-muted-foreground">
            {customerStats.topCustomer?.name || '없음'}
          </p>
        </CardContent>
      </Card>

      {/* 평균 포인트 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 포인트</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {customerStats.totalCustomers > 0 
              ? Math.round(customerStats.totalPoints / customerStats.totalCustomers).toLocaleString() 
              : 0}P
          </div>
          <p className="text-xs text-muted-foreground">
            고객당 평균 포인트
          </p>
        </CardContent>
      </Card>

      {/* TOP 10 고객 리스트 */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            TOP 10 고객 (포인트 기준)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top10Customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {customer.rank}위
                  </Badge>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      주문 {customer.orderCount}회 • 총 {customer.totalOrderAmount.toLocaleString()}원
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{(customer.points || 0).toLocaleString()}P</div>
                  <div className="text-sm text-muted-foreground">
                    {customer.grade || '신규'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
