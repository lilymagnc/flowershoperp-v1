# 🏪 단독매장용 꽃집 ERP 설정 가이드

이 ERP 시스템은 **단독매장**에 최적화되어 있으며, 지점 관리 없이 독립적인 꽃집 운영에 적합합니다.

## 🎯 **주요 특징**

### ✅ **지점 시스템 완전 제거**
- 브랜치/지점 관리 기능 제거
- 단일 상점 운영에 최적화
- 복잡한 다중 지점 로직 제거

### 🚚 **새로운 배송비 관리 시스템**
- `deliveryFees` 컬렉션: 지역별 배송비 관리
- `deliverySettings` 컬렉션: 배송 관련 기본 설정
- 지역별 무료배송 기준 설정 가능

### 🏪 **상점 정보 관리**
- `shopSettings` 컬렉션: 상점 기본 정보 관리
- 상점명, 연락처, 주소, 영업시간 등 설정

## 📊 **새로운 Firestore 컬렉션 구조**

### 1. `deliveryFees` 컬렉션
```typescript
interface DeliveryFee {
  id: string;
  district: string;        // 지역구 (예: "영등포구")
  fee: number;            // 배송비 (원)
  freeThreshold: number;  // 무료배송 기준 금액 (원)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. `deliverySettings` 컬렉션
```typescript
interface DeliverySettings {
  id: string;
  defaultFee: number;     // 기본 배송비
  freeThreshold: number;  // 기본 무료배송 기준
  surcharges: {
    mediumItem: number;   // 중형 상품 추가비
    largeItem: number;    // 대형 상품 추가비
    express: number;      // 당일배송 추가비
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 3. `shopSettings` 컬렉션
```typescript
interface ShopSettings {
  id: string;
  shopName: string;       // 상점명
  ownerName: string;      // 사장님 성함
  phone: string;          // 연락처
  email?: string;         // 이메일
  address: string;        // 주소
  businessHours: {        // 영업시간
    open: string;
    close: string;
    closedDays: string[];
  };
  currency: string;       // 통화 (KRW)
  taxRate: number;        // 세율
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 🔧 **다른 꽃집에서 사용하기**

### 1. **상점 정보 설정**
```typescript
// shopSettings 컬렉션에서 수정
{
  shopName: "당신의 꽃집 이름",
  ownerName: "사장님 성함",
  phone: "02-xxxx-xxxx",
  address: "상점 주소",
  // ... 기타 설정
}
```

### 2. **배송비 설정**
```typescript
// deliveryFees 컬렉션에서 지역별 배송비 설정
[
  { district: "종로구", fee: 5000, freeThreshold: 50000 },
  { district: "중구", fee: 5000, freeThreshold: 50000 },
  // ... 기타 지역
]
```

### 3. **환경변수 설정** (선택사항)
```env
NEXT_PUBLIC_SHOP_NAME="당신의 꽃집"
NEXT_PUBLIC_SHOP_PHONE="02-xxxx-xxxx"
NEXT_PUBLIC_DEFAULT_CURRENCY="KRW"
```

## 🚀 **시작하기**

### 1. **프로젝트 실행**
```bash
npm install
npm run dev
```

### 2. **초기 데이터 설정**
- 시스템 첫 실행 시 자동으로 기본 설정 생성
- `deliveryFees`: 서울 지역 기본 배송비 데이터
- `deliverySettings`: 기본 배송 설정
- `shopSettings`: 기본 상점 정보

### 3. **설정 커스터마이징**
- 설정 페이지에서 상점 정보 수정
- 픽업/배송 관리에서 배송비 조정
- 필요에 따라 지역 추가/수정

## 📋 **제거된 기능들**

- ❌ 지점 관리 페이지 (`/dashboard/branches`)
- ❌ 지점별 고객 구분
- ❌ 지점별 재고 관리
- ❌ 지점별 매출 분석
- ❌ 지점 선택 UI 요소들

## ✅ **유지된 기능들**

- ✅ 상품 관리 (전체 상품)
- ✅ 자재 관리 (전체 자재)
- ✅ 주문 관리
- ✅ 고객 관리
- ✅ 배송비 자동 계산
- ✅ 재고 관리
- ✅ 매출 분석
- ✅ 모든 기본 ERP 기능

## 🔧 **기술적 변경사항**

### 제거된 파일들:
- `src/hooks/use-branches.ts`
- `src/app/dashboard/branches/`
- `src/scripts/update-branches-delivery-fees.ts`

### 수정된 파일들:
- `src/hooks/use-delivery-fees.ts` - 새로운 배송비 시스템
- `src/hooks/use-products.ts` - branch 필드 제거
- `src/hooks/use-materials.ts` - branch 필드 제거
- `src/app/dashboard/orders/new/page.tsx` - 새로운 배송비 로직

### 새로 추가된 파일들:
- `src/hooks/use-shop-settings.ts` - 상점 설정 관리

## 💡 **권장사항**

1. **Firebase 보안 규칙** 업데이트
2. **기존 데이터 마이그레이션** (필요시)
3. **사용자 교육** - 새로운 인터페이스 적응
4. **백업** - 변경 전 데이터 백업 권장

---

**🎉 이제 다른 꽃집에서도 쉽게 사용할 수 있는 범용 단독매장 ERP 시스템입니다!**
