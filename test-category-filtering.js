// 카테고리 필터링 테스트 스크립트
console.log('🧪 카테고리 필터링 테스트 시작...');

function testCategoryFiltering() {
    // 1. 데이터 확인
    if (!window.dataManager) {
        console.log('❌ DataManager를 찾을 수 없습니다.');
        return;
    }
    
    const departments = window.dataManager.getDepartments();
    const categories = window.dataManager.getCategories();
    
    console.log('📊 현재 데이터:');
    console.log(`- 부서: ${departments.length}개`);
    console.log(`- 카테고리: ${categories.length}개`);
    
    console.log('\n🔗 부서-카테고리 매핑 확인:');
    departments.forEach(dept => {
        const deptCategories = categories.filter(cat => cat.departmentId === dept.id);
        console.log(`📋 ${dept.name} (${dept.id}): ${deptCategories.length}개 카테고리`);
        deptCategories.forEach((cat, idx) => {
            if (idx < 3) { // 처음 3개만 표시
                console.log(`   └─ ${cat.name} (${cat.id})`);
            } else if (idx === 3) {
                console.log(`   └─ ... 외 ${deptCategories.length - 3}개`);
            }
        });
    });
    
    // 2. AdminManager와 모달 테스트
    console.log('\n🔧 관리자 패널 테스트...');
    
    // Admin panel 탭 클릭
    const adminTab = document.getElementById('admin-panel-tab');
    if (adminTab) {
        console.log('✅ 관리자 패널 탭 클릭');
        adminTab.click();
        
        setTimeout(() => {
            // 관리자 로그인
            if (window.adminManager && window.adminManager.showAddProcessModal) {
                console.log('✅ AdminManager 사용 가능');
                
                // 직접 프로세스 추가 모달 열기 (로그인 없이 테스트)
                console.log('🚀 프로세스 추가 모달 열기...');
                window.adminManager.showAddProcessModal();
                
                setTimeout(() => {
                    // 부서 선택 테스트
                    const deptSelect = document.getElementById('process-department');
                    if (deptSelect) {
                        console.log('✅ 부서 선택 요소 발견');
                        const options = deptSelect.querySelectorAll('option');
                        console.log(`📋 부서 옵션: ${options.length}개`);
                        
                        // 각 부서 선택해보기
                        options.forEach((option, idx) => {
                            if (idx > 0) { // 첫 번째는 "부서를 선택하세요"
                                console.log(`\n🎯 테스트: "${option.textContent}" 선택 중...`);
                                option.selected = true;
                                
                                // change 이벤트 발생
                                const changeEvent = new Event('change', { bubbles: true });
                                deptSelect.dispatchEvent(changeEvent);
                                
                                // 카테고리 선택 요소 확인
                                setTimeout(() => {
                                    const catSelect = document.getElementById('process-category');
                                    if (catSelect) {
                                        const catOptions = catSelect.querySelectorAll('option');
                                        console.log(`   → 카테고리 옵션: ${catOptions.length}개`);
                                        
                                        // 카테고리 옵션 목록 표시
                                        Array.from(catOptions).forEach((catOpt, catIdx) => {
                                            if (catIdx > 0 && catIdx <= 3) { // 첫 3개만 표시
                                                console.log(`      ${catIdx}. ${catOpt.textContent}`);
                                            }
                                        });
                                        
                                        if (catOptions.length > 4) {
                                            console.log(`      ... 외 ${catOptions.length - 4}개`);
                                        }
                                    } else {
                                        console.log('   → ❌ 카테고리 선택 요소를 찾을 수 없음');
                                    }
                                }, 500);
                            }
                        });
                        
                    } else {
                        console.log('❌ 부서 선택 요소를 찾을 수 없음');
                    }
                }, 1000);
                
            } else {
                console.log('❌ AdminManager를 사용할 수 없습니다.');
            }
        }, 1000);
        
    } else {
        console.log('❌ 관리자 패널 탭을 찾을 수 없습니다.');
    }
}

// 애플리케이션이 초기화된 후 테스트 실행
if (document.readyState === 'complete') {
    setTimeout(testCategoryFiltering, 2000);
} else {
    window.addEventListener('load', () => {
        setTimeout(testCategoryFiltering, 2000);
    });
}

console.log('⏳ 테스트가 곧 시작됩니다...');