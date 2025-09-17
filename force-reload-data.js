// 강제로 새 JSON 데이터 로드하기
console.log('🔄 강제 데이터 리로드 시작...');

if (window.dataManager) {
    // 1. 로컬 스토리지 클리어
    console.log('🗑️ 로컬 스토리지 클리어 중...');
    localStorage.removeItem('koreanRoadManual_manualData');
    
    // 2. 현재 데이터 상태 확인
    console.log('📊 현재 데이터 상태:');
    console.log('- 부서:', window.dataManager.getDepartments().length);
    console.log('- 카테고리:', window.dataManager.getCategories().length);
    
    // 3. 새 JSON 강제 로드
    console.log('📥 새 JSON 파일 강제 로드 중...');
    window.dataManager.loadFromJSON()
        .then(() => {
            console.log('✅ 새 데이터 로드 완료!');
            console.log('📊 새 데이터 상태:');
            
            const departments = window.dataManager.getDepartments();
            const categories = window.dataManager.getCategories();
            
            console.log(`- 부서: ${departments.length}개`);
            console.log(`- 카테고리: ${categories.length}개`);
            
            console.log('\n🏢 부서 목록:');
            departments.forEach((dept, idx) => {
                console.log(`${idx + 1}. "${dept.name}" (${dept.id})`);
            });
            
            console.log('\n📂 카테고리 목록:');
            categories.forEach((cat, idx) => {
                console.log(`${idx + 1}. "${cat.name}" (${cat.id}) → 부서: ${cat.departmentId}`);
            });
            
            console.log('\n🔗 부서-카테고리 매핑:');
            departments.forEach(dept => {
                const deptCategories = categories.filter(cat => cat.departmentId === dept.id);
                console.log(`📋 ${dept.name}: ${deptCategories.length}개 카테고리`);
                deptCategories.forEach(cat => {
                    console.log(`   └─ ${cat.name}`);
                });
                if (deptCategories.length === 0) {
                    console.log('   └─ ⚠️ 카테고리가 없음!');
                }
            });
            
            console.log('\n🎯 이제 페이지를 새로고침하여 변경된 데이터를 확인하세요!');
        })
        .catch(error => {
            console.error('❌ 새 데이터 로드 실패:', error);
        });
    
} else {
    console.log('❌ DataManager를 찾을 수 없습니다.');
}

console.log('💡 이 스크립트 실행 후 페이지를 새로고침하세요: location.reload()');