
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// 사용자 프로필 타입 - 단순화
export interface UserProfile extends User {
  role: string;
  franchise: string;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser.email) return firebaseUser;

    try {
      // Firestore에서 실제 사용자 정보 조회
      const userDocRef = doc(db, 'users', firebaseUser.email);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userProfile: UserProfile = {
          ...firebaseUser,
          role: userData.role || '직원',
          franchise: userData.franchise || '메인매장'
        };
        return userProfile;
      } else {
        // 새 사용자의 경우 기본값 설정
        const userProfile: UserProfile = {
          ...firebaseUser,
          role: '직원',
          franchise: '메인매장'
        };

        // 기본 사용자 정보를 Firestore에 저장
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: '직원',
          franchise: '메인매장',
          lastLoginAt: serverTimestamp(),
          createdAt: serverTimestamp()
        }, { merge: true });

        return userProfile;
      }
    } catch (error) {
      console.error('사용자 역할 조회 오류:', error);
      // 오류가 발생해도 기본 사용자 정보 반환
      return {
        ...firebaseUser,
        role: '직원',
        franchise: '메인매장'
      } as UserProfile;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchUserRole(firebaseUser);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserRole]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
