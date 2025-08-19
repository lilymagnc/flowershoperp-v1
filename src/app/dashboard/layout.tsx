
"use client";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useSettings } from '@/hooks/use-settings';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Boxes, ShoppingCart, Users, UserCog, LogOut, ClipboardList, BookUser, Hammer, History, Briefcase, MapPin, Truck, Images, Receipt, Settings } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import React from 'react';
import { SafeImage } from '@/components/ui/safe-image';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }
  const getRoleDisplayName = () => {
    if (user.isAnonymous) return '익명 사용자';
    return user.role || '사용자';
  };
  return (
    <SidebarProvider defaultOpen={true}>
        <Sidebar className="no-print">
            <SidebarHeader className="p-4">
                <div className="flex items-center justify-center">
                    {console.log('사이드바 로고 URL:', settings?.logoUrl)}
                    {console.log('사이드바 설정 로딩 상태:', settings?.logoUrl ? '로드됨' : '로드 안됨')}
                    {settings?.logoUrl ? (
                      <img 
                        src={settings.logoUrl}
                        alt="Logo" 
                        width={150} 
                        height={40} 
                        className="w-36 h-auto"
                        onError={(error) => {
                          console.error('사이드바 로고 로딩 실패:', error);
                        }}
                      />
                    ) : (
                      <div className="text-xl font-bold text-gray-800">
                        {settings?.siteName || '릴리맥 ERP'}
                      </div>
                    )}
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {/* 1. 대시보드 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard')}><LayoutDashboard />대시보드</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 2. 샘플앨범 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/sample-albums')}><Images />샘플앨범</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 3. 주문 접수 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders/new')}><ShoppingCart />주문 접수</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 4. 주문 현황 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/orders')}><ClipboardList />주문 현황</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 5. 픽업/배송예약관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/pickup-delivery')}><Truck />픽업/배송예약관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 6. 수령자 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/recipients')}><MapPin />수령자 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 7. 고객 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/customers')}><BookUser />고객 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 8. 거래처 관리 (모든 사용자) */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/partners')}><Briefcase />거래처 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 9. 상품 관리 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/products')}><Boxes />상품 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 10. 자재 관리 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/materials')}><Hammer />자재 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 11. 재고 변동 기록 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/stock-history')}><History />재고 변동 기록</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 12. 간편 지출관리 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/simple-expenses')}><Receipt />간편 지출관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 13. 인사 관리 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/hr')}><Users />인사 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 14. 사용자 관리 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/users')}><UserCog />사용자 관리</SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* 15. 시스템 설정 */}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => router.push('/dashboard/settings')}><Settings />시스템 설정</SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4">
                <div className="flex items-center gap-3 mb-2">
                    <Avatar>
                        <AvatarImage src={user.photoURL ?? ''} />
                        <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-medium truncate">{user.isAnonymous ? '익명 사용자' : user.email}</p>
                        <p className="text-xs text-muted-foreground">역할: {getRoleDisplayName()}</p>
                    </div>
                </div>
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" />로그아웃</Button>
            </SidebarFooter>
        </Sidebar>
        <main className="flex-1 print:flex-grow-0 print:w-full print:max-w-full print:p-0 print:m-0">
             <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
                <SidebarTrigger className="xl:hidden" />
                <div className="w-full flex-1">
                    {/* Header content can go here if needed */}
                </div>
             </header>
            <div className="p-4 lg:p-6">
                {children}
            </div>
        </main>
    </SidebarProvider>
  );
}
