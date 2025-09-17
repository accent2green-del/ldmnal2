
// 애플리케이션 상태 확인 스크립트
console.log('=== 애플리케이션 디버그 정보 ===');
console.log('dataManager 상태:', typeof window.dataManager !== 'undefined' ? '✅ 로드됨' : '❌ 누락');
console.log('navigationManager 상태:', typeof window.navigationManager !== 'undefined' ? '✅ 로드됨' : '❌ 누락');
console.log('adminManager 상태:', typeof window.adminManager !== 'undefined' ? '✅ 로드됨' : '❌ 누락');
console.log('데이터 로드 상태:', window.dataManager && window.dataManager.initialized ? '✅ 초기화됨' : '❌ 미초기화');
console.log('네비게이션 항목 수:', window.dataManager ? window.dataManager.getDepartments().length : '알 수 없음');

