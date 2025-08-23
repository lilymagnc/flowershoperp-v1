import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function updateMenuSettings() {
  try {
    console.log('메뉴 설정 업데이트 시작...');
    
    const settingsDoc = doc(db, 'system', 'settings');
    const settingsSnapshot = await getDoc(settingsDoc);
    
    if (settingsSnapshot.exists()) {
      const currentSettings = settingsSnapshot.data();
      console.log('현재 설정:', currentSettings.menuSettings);
      
      // 현재 메뉴 설정에 users 메뉴가 없으면 추가
      if (!currentSettings.menuSettings?.users) {
        const updatedMenuSettings = {
          ...currentSettings.menuSettings,
          "users": { visible: true, order: 15, label: "사용자관리" }
        };
        
        // 기존 메뉴들의 순서 조정
        if (updatedMenuSettings["stock-history"]) {
          updatedMenuSettings["stock-history"].order = 16;
        }
        if (updatedMenuSettings["settings"]) {
          updatedMenuSettings["settings"].order = 17;
        }
        
        const updatedSettings = {
          ...currentSettings,
          menuSettings: updatedMenuSettings,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(settingsDoc, updatedSettings);
        console.log('메뉴 설정 업데이트 완료!');
        console.log('업데이트된 메뉴 설정:', updatedMenuSettings);
      } else {
        console.log('users 메뉴가 이미 존재합니다.');
      }
    } else {
      console.log('설정 문서가 존재하지 않습니다.');
    }
  } catch (error) {
    console.error('메뉴 설정 업데이트 중 오류:', error);
  }
}

// 스크립트 실행
updateMenuSettings();
