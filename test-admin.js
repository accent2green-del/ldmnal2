// 관리자 모드 테스트 스크립트
console.log('=== 관리자 모드 디버그 테스트 ===');

// 1. 기본 상태 확인
console.log('dataManager 존재:', !!window.dataManager);
console.log('adminManager 존재:', !!window.adminManager);
console.log('데이터 초기화 상태:', window.dataManager?.initialized);

// 2. 데이터 내용 확인
if (window.dataManager) {
    const summary = window.dataManager.getDataSummary();
    console.log('데이터 요약:', summary);
    
    const departments = window.dataManager.getDepartments();
    console.log('부서 수:', departments.length);
    console.log('부서 목록:', departments.map(d => d.name));
}

// 3. 관리자 버튼 확인
const adminBtn = document.getElementById('admin-btn');
console.log('관리자 버튼 존재:', !!adminBtn);
console.log('관리자 버튼 텍스트:', adminBtn?.textContent);

// 4. 관리자 로그인 상태 확인
if (window.adminManager) {
    console.log('관리자 로그인 상태:', window.adminManager.isLoggedIn);
    console.log('세션 토큰:', window.adminManager.sessionToken);
}

// 5. 네비게이션 트리 확인
const navTree = document.getElementById('navigation-tree');
console.log('네비게이션 트리 존재:', !!navTree);
console.log('네비게이션 트리 내용 길이:', navTree?.innerHTML?.length);

console.log('=== 테스트 완료 ===');
