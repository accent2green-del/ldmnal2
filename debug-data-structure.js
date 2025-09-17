// 데이터 구조 디버깅 스크립트
// 브라우저 개발자 도구에서 실행하여 현재 데이터 구조를 확인

console.log('=== 데이터 구조 디버깅 ===');

// 1. 부서 데이터 확인
console.log('1. 부서 데이터:');
if (window.dataManager) {
    const departments = window.dataManager.getDepartments();
    console.log('부서 총 개수:', departments.length);
    departments.forEach((dept, idx) => {
        console.log(`  ${idx + 1}. "${dept.name}" (ID: ${dept.id})`);
    });
} else {
    console.log('DataManager가 없습니다.');
}

// 2. 카테고리 데이터 확인
console.log('\n2. 카테고리 데이터:');
if (window.dataManager) {
    const categories = window.dataManager.getCategories();
    console.log('카테고리 총 개수:', categories.length);
    categories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. "${cat.name}" (ID: ${cat.id}, 부서ID: ${cat.departmentId})`);
    });
    
    // 부서별 카테고리 그룹화
    console.log('\n부서별 카테고리 그룹화:');
    const departments = window.dataManager.getDepartments();
    departments.forEach(dept => {
        const deptCategories = categories.filter(cat => cat.departmentId === dept.id);
        console.log(`${dept.name} (ID: ${dept.id}): ${deptCategories.length}개 카테고리`);
        deptCategories.forEach(cat => {
            console.log(`  - "${cat.name}" (ID: ${cat.id})`);
        });
    });
} else {
    console.log('DataManager가 없습니다.');
}

// 3. 프로세스 데이터 확인
console.log('\n3. 프로세스 데이터:');
if (window.dataManager) {
    const processes = window.dataManager.getProcesses();
    console.log('프로세스 총 개수:', processes.length);
    processes.forEach((proc, idx) => {
        console.log(`  ${idx + 1}. "${proc.title}" (ID: ${proc.id}, 카테고리ID: ${proc.categoryId})`);
    });
}

console.log('\n=== 데이터 구조 디버깅 완료 ===');