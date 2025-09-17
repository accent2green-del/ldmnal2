// 실제 데이터 구조 디버깅 스크립트
console.log('=== 실제 데이터 구조 디버깅 시작 ===');

// 1. DataManager가 로드되었는지 확인
if (window.dataManager) {
    console.log('✅ DataManager 발견');
    
    // 2. 현재 데이터 구조 확인
    const departments = window.dataManager.getDepartments();
    const categories = window.dataManager.getCategories();
    
    console.log('\n📊 현재 데이터 상태:');
    console.log(`- 부서 수: ${departments.length}`);
    console.log(`- 카테고리 수: ${categories.length}`);
    
    console.log('\n🏢 부서 목록:');
    departments.forEach((dept, idx) => {
        console.log(`${idx + 1}. "${dept.name}" (ID: ${dept.id})`);
    });
    
    console.log('\n📂 카테고리 목록:');
    categories.forEach((cat, idx) => {
        console.log(`${idx + 1}. "${cat.name}" (ID: ${cat.id}, 부서ID: ${cat.departmentId})`);
    });
    
    // 3. 부서-카테고리 매핑 확인
    console.log('\n🔗 부서-카테고리 매핑:');
    departments.forEach(dept => {
        const deptCategories = categories.filter(cat => cat.departmentId === dept.id);
        console.log(`📋 ${dept.name} (${dept.id}): ${deptCategories.length}개 카테고리`);
        deptCategories.forEach(cat => {
            console.log(`   └─ ${cat.name} (${cat.id})`);
        });
        if (deptCategories.length === 0) {
            console.log('   └─ ⚠️ 카테고리가 없음!');
        }
    });
    
    // 4. 원본 JSON 확인
    console.log('\n📄 원본 JSON 데이터 확인 중...');
    fetch('new-format-data.json')
        .then(response => response.json())
        .then(jsonData => {
            console.log(`📥 원본 JSON 로드됨: ${jsonData.length}개 항목`);
            
            // 첫 몇 개 항목의 1단계, 2단계 확인
            console.log('\n🔍 원본 JSON 구조 (처음 3개 항목):');
            jsonData.slice(0, 3).forEach((item, idx) => {
                console.log(`${idx + 1}. 1단계: "${item['1단계']}", 2단계: "${item['2단계']}"`);
            });
            
            // 변환 테스트
            console.log('\n🔄 변환 테스트 시작...');
            if (window.dataManager.convertNewFormatToStandard) {
                const converted = window.dataManager.convertNewFormatToStandard(jsonData);
                console.log('✅ 변환 성공:');
                console.log(`   - 부서: ${converted.departments.length}개`);
                console.log(`   - 카테고리: ${converted.categories.length}개`);
                console.log(`   - 프로세스: ${converted.processes.length}개`);
                
                console.log('\n🏢 변환된 부서:');
                converted.departments.forEach((dept, idx) => {
                    console.log(`   ${idx + 1}. "${dept.name}" (${dept.id})`);
                });
                
                console.log('\n📂 변환된 카테고리:');
                converted.categories.forEach((cat, idx) => {
                    console.log(`   ${idx + 1}. "${cat.name}" (${cat.id}) → 부서: ${cat.departmentId}`);
                });
                
                // 매핑 확인
                console.log('\n🔗 변환된 데이터 매핑:');
                converted.departments.forEach(dept => {
                    const deptCats = converted.categories.filter(cat => cat.departmentId === dept.id);
                    console.log(`📋 ${dept.name}: ${deptCats.length}개 카테고리`);
                    deptCats.forEach(cat => {
                        console.log(`   └─ ${cat.name}`);
                    });
                });
                
            } else {
                console.log('❌ convertNewFormatToStandard 함수를 찾을 수 없음');
            }
        })
        .catch(error => {
            console.log('❌ 원본 JSON 로드 실패:', error);
        });
    
} else {
    console.log('❌ DataManager를 찾을 수 없음');
    console.log('💡 애플리케이션이 완전히 로드될 때까지 기다려주세요');
}

console.log('\n=== 디버깅 완료 ===');
console.log('💡 이 스크립트를 다시 실행하려면: location.reload() 후 몇 초 기다린 다음 다시 실행하세요');