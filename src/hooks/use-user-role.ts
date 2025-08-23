"use client";
import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { 
  UserRole, 
  UserRoleType, 
  Permission, 
  CreateUserRoleData,
  ROLE_PERMISSIONS 
} from '@/types/user-role';

export function useUserRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // 사용자 역할 조회 - 실제 Firestore에서 조회 (브랜치 관련 필드 제거)
  const fetchUserRole = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      
      // 1. users 컬렉션에서 사용자 정보 조회
      const userDocRef = doc(db, 'users', user.email);
      const userDocSnap = await getDoc(userDocRef);
      
      // 2. userRoles 컬렉션에서 권한 정보 조회
      const userRolesQuery = query(
        collection(db, 'userRoles'), 
        where('userId', '==', user.email),
        where('isActive', '==', true)
      );
      const userRolesSnap = await getDocs(userRolesQuery);
      
      let userRoleData: UserRole | null = null;
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role || '직원';
        
        // 권한 코드를 UserRoleType으로 매핑 (단순화된 시스템)
        let roleType = UserRoleType.SHOP_USER;
        
        userRoleData = {
          id: user.email,
          userId: user.email,
          role: roleType,
          permissions: ROLE_PERMISSIONS[roleType],
          isActive: true,
          createdAt: userData.createdAt || new Date() as any,
          updatedAt: userData.updatedAt || new Date() as any
        };
      } else if (!userRolesSnap.empty) {
        // userRoles에서 정보 가져오기
        const roleData = userRolesSnap.docs[0].data();
        userRoleData = {
          id: roleData.id || user.email,
          userId: user.email,
          role: roleData.role || UserRoleType.SHOP_USER,
          permissions: roleData.permissions || ROLE_PERMISSIONS[UserRoleType.SHOP_USER],
          isActive: roleData.isActive !== false,
          createdAt: roleData.createdAt || new Date() as any,
          updatedAt: roleData.updatedAt || new Date() as any
        };
      } else {
        // 기본값 (새 사용자)
        userRoleData = {
          id: user.email,
          userId: user.email,
          role: UserRoleType.SHOP_USER,
          permissions: ROLE_PERMISSIONS[UserRoleType.SHOP_USER],
          isActive: true,
          createdAt: new Date() as any,
          updatedAt: new Date() as any
        };
      }
      
      setUserRole(userRoleData);
      setLoading(false);
    } catch (error) {
      console.error('사용자 역할 조회 오류:', error);
      setLoading(false);
    }
  }, [user?.email]);

  // 사용자 역할 생성 - 단순화 (브랜치 관련 필드 제거)
  const createUserRole = async (data: CreateUserRoleData): Promise<void> => {
    try {
      const roleData: Omit<UserRole, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: data.userId,
        role: UserRoleType.SHOP_USER,
        permissions: ROLE_PERMISSIONS[UserRoleType.SHOP_USER],
        isActive: true
      };

      const docRef = doc(db, 'userRoles', data.userId);
      await setDoc(docRef, {
        ...roleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast({
        title: '역할 생성 완료',
        description: '사용자 역할이 성공적으로 생성되었습니다.',
      });
    } catch (error) {
      console.error('사용자 역할 생성 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 생성 실패',
        description: '사용자 역할 생성 중 오류가 발생했습니다.',
      });
      throw error;
    }
  };

  // 사용자 역할 업데이트 - 단순화 (브랜치 관련 필드 제거)
  const updateUserRole = async (
    roleId: string, 
    updates: Partial<Pick<UserRole, 'role' | 'permissions' | 'isActive'>>
  ): Promise<void> => {
    try {
      const docRef = doc(db, 'userRoles', roleId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, updateData, { merge: true });
      
      if (userRole && userRole.id === roleId) {
        setUserRole({
          ...userRole,
          ...updates,
          updatedAt: new Date() as any,
        });
      }
      
      toast({
        title: '역할 업데이트 완료',
        description: '사용자 역할이 성공적으로 업데이트되었습니다.',
      });
    } catch (error) {
      console.error('사용자 역할 업데이트 오류:', error);
      toast({
        variant: 'destructive',
        title: '역할 업데이트 실패',
        description: '사용자 역할 업데이트 중 오류가 발생했습니다.',
      });
      throw error;
    }
  };

  // 권한 확인 함수들 - 항상 true 반환
  const hasPermission = (permission: Permission): boolean => {
    return true; // 모든 권한 허용
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return true; // 모든 권한 허용
  };

  const isHQManager = (): boolean => true;
  const isHeadOfficeAdmin = (): boolean => true;
  const isBranchUser = (): boolean => true;
  const isBranchManager = (): boolean => true;
  const isAdmin = (): boolean => true;

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  // 사용자 정보가 변경될 때마다 역할 정보 새로고침
  useEffect(() => {
    if (user?.email) {
      fetchUserRole();
    }
  }, [user?.email, fetchUserRole]);

  return {
    userRole,
    loading,
    fetchUserRole,
    createUserRole,
    updateUserRole,
    hasPermission,
    hasAnyPermission,
    isHQManager,
    isHeadOfficeAdmin,
    isBranchUser,
    isBranchManager,
    isAdmin
  };
}
