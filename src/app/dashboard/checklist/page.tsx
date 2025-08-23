"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckSquare, 
  Calendar, 
  CalendarDays, 
  Building, 
  Plus, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp
} from "lucide-react";
import { useChecklist } from "@/hooks/use-checklist";
import { useAuth } from "@/hooks/use-auth";
import { useUserRole } from "@/hooks/use-user-role";

import { ChecklistRecord, ChecklistStats, ChecklistTemplate } from "@/types/checklist";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ChecklistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { userRole, isHQManager } = useUserRole();

  const { getChecklists, getStats, getWorkers, getTemplate } = useChecklist();
  
  const [recentChecklists, setRecentChecklists] = useState<ChecklistRecord[]>([]);
  const [stats, setStats] = useState<{
    daily: ChecklistStats[];
    weekly: ChecklistStats[];
    monthly: ChecklistStats[];
  }>({ daily: [], weekly: [], monthly: [] });
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // 필터 설정 (단일 매장 시스템)
        const filter: any = {};
        
        // 모든 데이터를 병렬로 로드
        const [recent, dailyStats, weeklyStats, monthlyStats, workersList] = await Promise.all([
          getChecklists(filter),
          getStats('daily'),
          getStats('weekly'),
          getStats('monthly'),
          getWorkers()
        ]);

        // 상태 업데이트를 한 번에 처리
        setRecentChecklists(recent.slice(0, 5));
        setStats({
          daily: dailyStats,
          weekly: weeklyStats,
          monthly: monthlyStats
        });
        setWorkers(workersList.map(w => w.name));

      } catch (error) {
        console.error('Error loading checklist data:', error);
        // 에러가 발생해도 로딩 상태는 해제
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userRole?.role]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return '완료';
      case 'partial':
        return '진행중';
      case 'pending':
        return '대기';
      default:
        return '미정';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getCategoryIcon = useCallback((category: string) => {
    switch (category) {
      case 'daily':
        return <Calendar className="h-4 w-4" />;
      case 'weekly':
        return <CalendarDays className="h-4 w-4" />;
      case 'monthly':
        return <Building className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  }, []);

  const getCategoryText = useCallback((category: string) => {
    switch (category) {
      case 'daily':
        return '일일';
      case 'weekly':
        return '주간';
      case 'monthly':
        return '월간';
      default:
        return '기타';
    }
  }, []);

  const calculateCompletionRate = useCallback((checklist: ChecklistRecord) => {
    // 모든 항목을 기준으로 계산
    const totalItems = checklist.items.length;
    const completedItems = checklist.items.filter(item => item.checked).length;
    return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  }, []);

  const getAverageCompletionRate = useCallback((stats: ChecklistStats[]) => {
    if (stats.length === 0) return 0;
    const totalRate = stats.reduce((sum, stat) => sum + stat.completionRate, 0);
    return totalRate / stats.length;
  }, []);

  // 체크리스트 상태를 올바르게 계산하는 함수
  const getCorrectStatus = useCallback((checklist: ChecklistRecord) => {
    const completionRate = calculateCompletionRate(checklist);
    
    if (completionRate === 100) return 'completed';
    else if (completionRate > 0) return 'partial';
    else return 'pending';
  }, [calculateCompletionRate]);

  // 로딩 상태를 더 부드럽게 처리
  const renderContent = useCallback(() => {
    if (loading) {
      return (
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
      );
    }

    return (
      <>
        {/* 상단 통계 카드 */}
        <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                일일 체크리스트
              </CardTitle>
              <Calendar className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getAverageCompletionRate(stats.daily).toFixed(1)}%
              </div>
              <p className="text-xs opacity-90 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                최근 7일 평균 완료율
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                주간 체크리스트
              </CardTitle>
              <CalendarDays className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getAverageCompletionRate(stats.weekly).toFixed(1)}%
              </div>
              <p className="text-xs opacity-90 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                이번 주 완료율
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                월간 체크리스트
              </CardTitle>
              <Building className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getAverageCompletionRate(stats.monthly).toFixed(1)}%
              </div>
              <p className="text-xs opacity-90 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                이번 달 완료율
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium opacity-90">
                등록된 근무자
              </CardTitle>
              <CheckSquare className="h-4 w-4 opacity-90" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
              <p className="text-xs opacity-90">체크리스트 참여 근무자</p>
            </CardContent>
          </Card>
        </div>

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              빠른 액션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => router.push('/dashboard/checklist/daily/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                새 일일 체크리스트
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/checklist/weekly/new')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                새 주간 체크리스트
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/checklist/monthly/new')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Building className="h-4 w-4 mr-2" />
                새 월간 체크리스트
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard/checklist/history')}
              >
                <Clock className="h-4 w-4 mr-2" />
                히스토리 보기
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/dashboard/checklist/template')}
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                템플릿 관리
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 최근 체크리스트 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 체크리스트</CardTitle>
            <p className="text-sm text-gray-600">최근 작성된 체크리스트 목록</p>
          </CardHeader>
          <CardContent>
            {recentChecklists.length > 0 ? (
              <div className="space-y-4">
                {recentChecklists.map((checklist) => (
                  <div 
                    key={checklist.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/dashboard/checklist/${checklist.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      {getCategoryIcon('daily')}
                      <div>
                        <p className="font-medium">
                          {format(new Date(checklist.date), 'yyyy년 M월 d일 (E)', { locale: ko })} 체크리스트
                        </p>
                        <p className="text-sm text-gray-600">
                          담당자: {checklist.responsiblePerson} | 
                          오픈: {checklist.openWorker} | 
                          마감: {checklist.closeWorker}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {calculateCompletionRate(checklist).toFixed(1)}%
                        </p>
                        <Progress 
                          value={calculateCompletionRate(checklist)} 
                          className="w-20 h-2"
                        />
                      </div>
                      <Badge className={getStatusColor(getCorrectStatus(checklist))}>
                        {getStatusIcon(getCorrectStatus(checklist))}
                        <span className="ml-1">{getStatusText(getCorrectStatus(checklist))}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">아직 작성된 체크리스트가 없습니다.</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/dashboard/checklist/daily/new')}
                >
                  첫 체크리스트 작성하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </>
    );
  }, [loading, stats, workers, recentChecklists, router, calculateCompletionRate, getCorrectStatus, getStatusColor, getStatusIcon, getStatusText, getCategoryIcon]);

  return (
    <div className="space-y-8">
      <PageHeader 
        title="체크리스트 관리" 
        description="매장 업무 체크리스트를 관리하세요." 
      />
      
      {renderContent()}
    </div>
  );
}
