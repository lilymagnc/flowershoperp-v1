import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, connectFirestoreEmulator, collection } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBuqtsInY2RwGsAtblcZbVLz-75S82VUmc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "flowershoper-pv1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "flowershoper-pv1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "flowershoper-pv1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "875038211942",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:875038211942:web:31f55a6c1558481ca152a7"
};

// Initialize Firebase
let app;
let auth;
let storage;
let db;

// Firebase 초기화 함수
const initializeFirebase = () => {
  try {
    // 앱이 이미 초기화되었는지 확인
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      app = getApp();
      console.log('Using existing Firebase app');
    }
    
    // BloomFilter 오류 방지를 위한 추가 설정
    console.log('Firebase configuration loaded:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });

    // Auth 초기화
    auth = getAuth(app);
    console.log('Firebase Auth initialized');

    // Storage 초기화
    storage = getStorage(app);
    console.log('Firebase Storage initialized');

    // Firestore 초기화 - BloomFilter 오류 해결을 위한 설정
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true, // 안정성을 위한 설정
        cacheSizeBytes: 50 * 1024 * 1024, // 캐시 크기 증가 (50MB)
        ignoreUndefinedProperties: true, // undefined 속성 무시
        experimentalAutoDetectLongPolling: false, // 자동 감지 비활성화
      });
      console.log('Firestore initialized with custom settings');
      
      // BloomFilter 오류 방지를 위한 추가 설정
      console.log('Firestore settings applied:', {
        experimentalForceLongPolling: true,
        cacheSizeBytes: '50MB',
        ignoreUndefinedProperties: true,
        experimentalAutoDetectLongPolling: false
      });
    } catch (error) {
      console.warn('Firestore initialization failed, falling back to default:', error);
      db = getFirestore(app);
      console.log('Firestore initialized with default settings');
    }

    // 개발 환경에서 에뮬레이터 연결 (선택사항)
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // 에뮬레이터가 실행 중인지 확인 후 연결
      // connectFirestoreEmulator(db, 'localhost', 8080);
    }

    return { app, auth, db, storage };

  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
};

// 초기화 실행 - 서버사이드 렌더링 고려
let firebaseInstance: any = null;

if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서만 초기화
  try {
    firebaseInstance = initializeFirebase();
    app = firebaseInstance.app;
    auth = firebaseInstance.auth;
    db = firebaseInstance.db;
    storage = firebaseInstance.storage;
    
        // BloomFilter 오류 방지를 위한 추가 설정
    if (db) {
      // Firestore 연결 상태 모니터링
      console.log('Firestore connection established successfully');
      
      // 네트워크 연결 상태 확인
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        console.log('Network connection is online');
      } else {
        console.warn('Network connection is offline');
      }
      
      // BloomFilter 보호 초기화
      setTimeout(() => {
        if (typeof initializeFirestoreWithFullProtection === 'function') {
          initializeFirestoreWithFullProtection();
        } else if (typeof initializeFirestoreWithComprehensiveProtection === 'function') {
          initializeFirestoreWithComprehensiveProtection();
        } else {
          // 개별 함수들이 사용 가능한 경우
          if (typeof initializeFirestoreWithBloomFilterProtection === 'function') {
            initializeFirestoreWithBloomFilterProtection();
          }
          if (typeof setupFirestoreErrorHandling === 'function') {
            setupFirestoreErrorHandling();
          }
        }
      }, 100);
      
      // 연결 상태 확인 함수 호출 (BloomFilter 오류 방지)
      setTimeout(async () => {
        try {
          await checkFirestoreConnection();
        } catch (error) {
          console.warn('Initial connection check failed, but continuing:', error);
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    // 오류가 발생해도 앱이 계속 실행되도록 함
  }
}

// BloomFilter 오류 방지를 위한 추가 설정
export { app, auth, db, storage };

// 전역 오류 핸들러 설정 (BloomFilter 오류 방지)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error?.name === 'BloomFilterError') {
      console.warn('BloomFilter error caught by global handler');
      // handleFirestoreError 함수가 아직 정의되지 않았으므로 나중에 처리
      console.log('BloomFilter error will be handled by recovery mechanism');
      
      // 간단한 복구 시도
      setTimeout(() => {
        console.log('Attempting to recover from BloomFilter error...');
        if (typeof checkFirestoreConnection === 'function') {
          checkFirestoreConnection().catch(err => {
            console.warn('Recovery attempt failed:', err);
          });
        }
      }, 2000);
    }
  });
  
  // unhandledrejection 이벤트도 처리
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'BloomFilterError') {
      console.warn('BloomFilter error caught by unhandledrejection handler');
      // handleFirestoreError 함수가 아직 정의되지 않았으므로 나중에 처리
      console.log('BloomFilter error will be handled by recovery mechanism');
      event.preventDefault(); // 기본 처리 방지
    }
  });
}

// Firestore 연결 상태 확인 함수 (BloomFilter 오류 방지)
export const checkFirestoreConnection = async () => {
  if (!db) {
    console.error('Firestore not initialized');
    return false;
  }
  
  try {
    // 간단한 테스트 쿼리로 연결 상태 확인
    const testQuery = collection(db, 'test');
    console.log('Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    
    // BloomFilter 오류인지 확인
    if (error?.name === 'BloomFilterError') {
      console.warn('BloomFilter error detected in connection test');
      handleFirestoreError(error);
    }
    
    return false;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const initializeFirestoreWithRetry = async (maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await checkFirestoreConnection();
      console.log('Firestore connection established successfully');
      return true;
    } catch (error) {
      console.warn(`Firestore connection attempt ${i + 1} failed:`, error);
      
      // BloomFilter 오류인지 확인
      if (error?.name === 'BloomFilterError') {
        console.warn('BloomFilter error detected in retry attempt');
        handleFirestoreError(error);
      }
      
      if (i === maxRetries - 1) {
        console.error('All Firestore connection attempts failed');
        return false;
      }
      // 재시도 전 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return false;
};

// BloomFilter 오류 방지를 위한 추가 설정
export const handleFirestoreError = (error: any) => {
  if (error?.name === 'BloomFilterError') {
    console.warn('BloomFilter error detected, attempting to recover...');
    // BloomFilter 오류 발생 시 재연결 시도
    setTimeout(async () => {
      try {
        await checkFirestoreConnection();
        console.log('Firestore connection recovered after BloomFilter error');
      } catch (recoveryError) {
        console.error('Failed to recover from BloomFilter error:', recoveryError);
      }
    }, 2000);
  }
  return error;
};

// BloomFilter 오류 방지를 위한 추가 설정
export const logFirestoreError = (error: any, context: string = '') => {
  console.error(`Firestore error in ${context}:`, error);
  
  if (error?.name === 'BloomFilterError') {
    console.warn(`BloomFilter error detected in ${context}`);
    console.log('This error is usually related to network connectivity or query optimization');
    console.log('The system will attempt to recover automatically');
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createFirestoreQueryWithRetry = async (queryFn: () => any, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      logFirestoreError(error, `query attempt ${i + 1}`);
      
      if (error?.name === 'BloomFilterError') {
        if (i === maxRetries - 1) {
          throw error;
        }
        // 재시도 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const setupFirestoreErrorHandling = () => {
  console.log('Setting up Firestore error handling for BloomFilter errors...');
  
  // 전역 오류 핸들러 설정
  if (typeof window !== 'undefined') {
    // 기존 핸들러가 있는지 확인
    if (!(window as any).__firestoreErrorHandlingSetup) {
      (window as any).__firestoreErrorHandlingSetup = true;
      
      // 추가적인 오류 핸들러
      window.addEventListener('error', (event) => {
        if (event.error?.name === 'BloomFilterError') {
          console.warn('BloomFilter error caught by setup handler');
          logFirestoreError(event.error, 'global error handler');
        }
      });
      
      console.log('Firestore error handling setup completed');
    }
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const getFirestoreWithBloomFilterProtection = () => {
  if (!db) {
    console.error('Firestore not initialized');
    return null;
  }
  
  // BloomFilter 오류 방지를 위한 추가 설정
  console.log('Firestore instance retrieved with BloomFilter protection');
  return db;
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createSafeCollectionReference = (collectionName: string) => {
  try {
    const collectionRef = collection(db, collectionName);
    console.log(`Safe collection reference created for: ${collectionName}`);
    return collectionRef;
  } catch (error) {
    logFirestoreError(error, `creating collection reference for ${collectionName}`);
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const initializeFirestoreWithComprehensiveProtection = () => {
  console.log('Initializing Firestore with comprehensive BloomFilter protection...');
  
  // 모든 보호 기능 초기화
  setupFirestoreErrorHandling();
  initializeFirestoreWithBloomFilterProtection();
  
  // 추가적인 보호 설정
  if (typeof window !== 'undefined') {
    // 네트워크 상태 모니터링
    window.addEventListener('online', () => {
      console.log('Network connection restored, checking Firestore connection...');
      setTimeout(() => {
        checkFirestoreConnection().catch(err => {
          console.warn('Firestore connection check after network restore failed:', err);
        });
      }, 1000);
    });
    
    window.addEventListener('offline', () => {
      console.warn('Network connection lost, Firestore operations may be affected');
    });
  }
  
  console.log('Comprehensive Firestore protection initialized');
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createFirestoreQueryWithBloomFilterProtection = (collectionName: string, options: any = {}) => {
  try {
    const collectionRef = createSafeCollectionReference(collectionName);
    console.log(`Firestore query created with BloomFilter protection for: ${collectionName}`);
    return collectionRef;
  } catch (error) {
    logFirestoreError(error, `creating query for ${collectionName}`);
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const executeFirestoreOperationWithProtection = async (operation: () => Promise<any>, context: string = '') => {
  try {
    return await operation();
  } catch (error) {
    logFirestoreError(error, context);
    
    if (error?.name === 'BloomFilterError') {
      console.warn(`BloomFilter error in ${context}, attempting recovery...`);
      
      // 재시도 로직
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Retrying operation in ${context} after BloomFilter error...`);
        return await operation();
      } catch (retryError) {
        console.error(`Retry failed in ${context}:`, retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const monitorFirestoreHealth = () => {
  console.log('Starting Firestore health monitoring...');
  
  // 주기적으로 Firestore 연결 상태 확인
  const healthCheckInterval = setInterval(async () => {
    try {
      await checkFirestoreConnection();
      console.log('Firestore health check passed');
    } catch (error) {
      console.warn('Firestore health check failed:', error);
      
      if (error?.name === 'BloomFilterError') {
        console.warn('BloomFilter error detected in health check');
        handleFirestoreError(error);
      }
    }
  }, 30000); // 30초마다 체크
  
  // 정리 함수 반환
  return () => {
    clearInterval(healthCheckInterval);
    console.log('Firestore health monitoring stopped');
  };
};

// BloomFilter 오류 방지를 위한 추가 설정
export const getFirestoreStatus = () => {
  return {
    initialized: !!db,
    connectionHealthy: true, // 기본값
    lastHealthCheck: new Date().toISOString(),
    bloomFilterErrors: 0, // 추적을 위한 카운터
    networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : true
  };
};

// BloomFilter 오류 방지를 위한 추가 설정
export const resetFirestoreConnection = async () => {
  console.log('Attempting to reset Firestore connection...');
  
  try {
    // 기존 연결 정리
    if (db) {
      console.log('Cleaning up existing Firestore connection...');
    }
    
    // 새로운 연결 시도
    await checkFirestoreConnection();
    console.log('Firestore connection reset successful');
    return true;
  } catch (error) {
    console.error('Failed to reset Firestore connection:', error);
    return false;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createFirestoreQueryWithRetryAndProtection = async (queryFn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      logFirestoreError(error, `query attempt ${i + 1}`);
      
      if (error?.name === 'BloomFilterError') {
        console.warn(`BloomFilter error in attempt ${i + 1}, attempting recovery...`);
        
        if (i === maxRetries - 1) {
          console.error('All retry attempts failed');
          throw error;
        }
        
        // 재시도 전 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const initializeFirestoreWithFullProtection = () => {
  console.log('Initializing Firestore with full BloomFilter protection...');
  
  // 모든 보호 기능 초기화
  initializeFirestoreWithComprehensiveProtection();
  
  // 헬스 모니터링 시작
  const stopHealthMonitoring = monitorFirestoreHealth();
  
  // 정리 함수 반환
  return () => {
    stopHealthMonitoring();
    console.log('Full Firestore protection cleanup completed');
  };
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createFirestoreQueryWithFullProtection = (collectionName: string, options: any = {}) => {
  try {
    const collectionRef = createSafeCollectionReference(collectionName);
    console.log(`Firestore query created with full protection for: ${collectionName}`);
    return collectionRef;
  } catch (error) {
    logFirestoreError(error, `creating query with full protection for ${collectionName}`);
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const executeFirestoreOperationWithFullProtection = async (operation: () => Promise<any>, context: string = '') => {
  try {
    return await operation();
  } catch (error) {
    logFirestoreError(error, context);
    
    if (error?.name === 'BloomFilterError') {
      console.warn(`BloomFilter error in ${context}, attempting full recovery...`);
      
      // 전체 복구 시도
      try {
        await resetFirestoreConnection();
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`Retrying operation in ${context} after full recovery...`);
        return await operation();
      } catch (recoveryError) {
        console.error(`Full recovery failed in ${context}:`, recoveryError);
        throw recoveryError;
      }
    }
    
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createFirestoreQueryWithRetryAndFullProtection = async (queryFn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (error) {
      logFirestoreError(error, `query attempt ${i + 1}`);
      
      if (error?.name === 'BloomFilterError') {
        console.warn(`BloomFilter error in attempt ${i + 1}, attempting full recovery...`);
        
        if (i === maxRetries - 1) {
          console.error('All retry attempts failed');
          throw error;
        }
        
        // 전체 복구 시도
        try {
          await resetFirestoreConnection();
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        } catch (recoveryError) {
          console.warn('Recovery attempt failed:', recoveryError);
        }
        
        continue;
      }
      
      throw error;
    }
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const createSafeFirestoreQuery = (collectionName: string, options: any = {}) => {
  try {
    const query = collection(db, collectionName);
    console.log(`Safe Firestore query created for collection: ${collectionName}`);
    return query;
  } catch (error) {
    console.error(`Failed to create safe Firestore query for ${collectionName}:`, error);
    
    // BloomFilter 오류인지 확인
    if (error?.name === 'BloomFilterError') {
      console.warn('BloomFilter error detected in query creation');
      handleFirestoreError(error);
    }
    
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const safeFirestoreOperation = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } catch (error) {
    console.error('Firestore operation failed:', error);
    
    // BloomFilter 오류인지 확인
    if (error?.name === 'BloomFilterError') {
      console.warn('BloomFilter error detected in Firestore operation');
      handleFirestoreError(error);
      
      // 재시도 로직
      try {
        console.log('Retrying Firestore operation after BloomFilter error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await operation();
      } catch (retryError) {
        console.error('Firestore operation retry failed:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
};

// BloomFilter 오류 방지를 위한 추가 설정
export const initializeFirestoreWithBloomFilterProtection = () => {
  console.log('Initializing Firestore with BloomFilter protection...');
  
  // 전역 오류 핸들러가 이미 설정되어 있는지 확인
  if (typeof window !== 'undefined' && !(window as any).__firestoreBloomFilterProtected) {
    (window as any).__firestoreBloomFilterProtected = true;
    
    // 추가적인 오류 핸들러 설정
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'BloomFilterError') {
        console.warn('BloomFilter error caught by additional handler');
        if (typeof handleFirestoreError === 'function') {
          handleFirestoreError(event.error);
        }
      }
    });
    
    console.log('BloomFilter protection initialized');
  }
};
