
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings, loading: settingsLoading } = useSettings();
  
  // 디버깅용 로그
  React.useEffect(() => {
    console.log('로그인 페이지 - 설정 로딩 상태:', settingsLoading);
    console.log('로그인 페이지 - 설정 데이터:', settings);
    console.log('로그인 페이지 - 로고 URL:', settings?.logoUrl);
  }, [settings, settingsLoading]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시 lastLogin 업데이트
      try {
        const userRef = doc(db, "users", email);
        await updateDoc(userRef, {
          lastLogin: serverTimestamp()
        });
      } catch (updateError) {
        console.warn("lastLogin 업데이트 실패:", updateError);
        // lastLogin 업데이트 실패해도 로그인은 계속 진행
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '로그인 실패',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <div className="flex justify-center py-6">
            <SafeImage 
              src={settings?.logoUrl || "https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg"}
              alt="Logo" 
              width={200} 
              height={50}
              className="w-48 h-auto"

              fallbackSrc="https://ecimg.cafe24img.com/pg1472b45444056090/lilymagflower/web/upload/category/logo/v2_d13ecd48bab61a0269fab4ecbe56ce07_lZMUZ1lORo_top.jpg"
              onError={(error) => {
                console.error('로그인 페이지 로고 로딩 실패:', error);
              }}
            />
        </div>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  <span className="sr-only">{showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}</span>
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              로그인
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
