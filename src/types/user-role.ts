import { Timestamp } from 'firebase/firestore';

// 사용자 역할 타입 - 단순화
export enum UserRoleType {
  SHOP_USER = 'shop_user' // 개인샵 사용자로 통합
}

// 권한 타입 - 모든 권한 허용
export enum Permission {
  CREATE_REQUEST = 'create_request',
  VIEW_ALL_REQUESTS = 'view_all_requests',
  EDIT_PRICES = 'edit_prices',
  CHANGE_STATUS = 'change_status',
  MANAGE_USERS = 'manage_users',
  CONSOLIDATE_REQUESTS = 'consolidate_requests',
  EXPORT_DATA = 'export_data'
}

// 사용자 역할 데이터 - 단순화 (브랜치 관련 필드 제거)
export interface UserRole {
  id: string;
  userId: string;
  role: UserRoleType;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 역할별 기본 권한 매핑 - 모든 권한 허용
export const ROLE_PERMISSIONS: Record<UserRoleType, Permission[]> = {
  [UserRoleType.SHOP_USER]: [
    Permission.CREATE_REQUEST,
    Permission.VIEW_ALL_REQUESTS,
    Permission.EDIT_PRICES,
    Permission.CHANGE_STATUS,
    Permission.MANAGE_USERS,
    Permission.CONSOLIDATE_REQUESTS,
    Permission.EXPORT_DATA
  ]
};

// 사용자 역할 생성 데이터 (브랜치 관련 필드 제거)
export interface CreateUserRoleData {
  userId: string;
  role: UserRoleType;
}

// 역할 확인 유틸리티 함수 - 항상 true 반환
export const hasPermission = (userRole: UserRole | null, permission: Permission): boolean => {
  return true; // 모든 권한 허용
};

export const hasAnyPermission = (userRole: UserRole | null, permissions: Permission[]): boolean => {
  return true; // 모든 권한 허용
};

export const isHQManager = (userRole: UserRole | null): boolean => true;
export const isBranchUser = (userRole: UserRole | null): boolean => true;
export const isBranchManager = (userRole: UserRole | null): boolean => true;
export const isAdmin = (userRole: UserRole | null): boolean => true;

// 역할 라벨
export const ROLE_LABELS: Record<UserRoleType, string> = {
  [UserRoleType.SHOP_USER]: '직원'
};
