/**
 * 데이터 관리 모듈
 * JSON 파일 로딩, 로컬 스토리지 관리, 데이터 CRUD 작업
 */

class DataManager {
    constructor() {
        this.data = {
            departments: [],
            categories: [],
            processes: []
        };
        this.initialized = false;
        
        // 이벤트 바인딩
        this.bindEvents();
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        // 데이터 변경 시 스토리지에 저장
        EventEmitter.on('data:updated', (data) => {
            this.saveToStorage();
        });
    }
    
    /**
     * 데이터 초기화
     */
    async initialize() {
        Logger.info('데이터 매니저 초기화 중...');
        
        try {
            // 로컬 스토리지에서 데이터 로드 시도
            const localData = this.loadFromStorage();
            
            if (localData && this.validateData(localData)) {
                Logger.info('로컬 스토리지에서 데이터 로드 완료');
                this.data = localData;
            } else {
                // 로컬 데이터가 없거나 유효하지 않으면 JSON 파일 로드
                Logger.info('JSON 파일에서 데이터 로드 시도 중...');
                await this.loadFromJSON();
            }
            
            this.initialized = true;
            EventEmitter.emit('data:initialized', this.data);
            Logger.info('데이터 초기화 완료', this.getDataSummary());
            
        } catch (error) {
            Logger.error('데이터 초기화 실패:', error);
            
            // 기본 데이터로 초기화
            this.data = Utils.deepClone(AppConfig.DEFAULT_DATA);
            this.generateSampleData();
            this.initialized = true;
            
            EventEmitter.emit('data:initialized', this.data);
            Logger.info('기본 데이터로 초기화 완료');
        }
    }
    
    /**
     * JSON 파일에서 데이터 로드
     */
    async loadFromJSON() {
        try {
            const response = await fetch(AppConfig.API.ENDPOINTS.MANUAL_DATA);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (this.validateData(data)) {
                this.data = data;
                this.saveToStorage();
                Logger.info('JSON 파일에서 데이터 로드 완료');
            } else {
                throw new Error('Invalid data structure');
            }
            
        } catch (error) {
            Logger.warn('JSON 파일 로드 실패, 기본 데이터 생성:', error.message);
            this.data = Utils.deepClone(AppConfig.DEFAULT_DATA);
            this.generateSampleData();
            this.saveToStorage();
        }
    }
    
    /**
     * 로컬 스토리지에서 데이터 로드
     */
    loadFromStorage() {
        return Utils.getFromStorage(AppConfig.STORAGE_KEYS.MANUAL_DATA);
    }
    
    /**
     * 로컬 스토리지에 데이터 저장
     */
    saveToStorage() {
        return Utils.setToStorage(AppConfig.STORAGE_KEYS.MANUAL_DATA, this.data);
    }
    
    /**
     * 데이터 구조 유효성 검증
     */
    validateData(data) {
        return data && 
               Array.isArray(data.departments) &&
               Array.isArray(data.categories) &&
               Array.isArray(data.processes);
    }
    
    /**
     * 샘플 데이터 생성
     */
    generateSampleData() {
        Logger.info('샘플 데이터 생성 중...');
        
        // 부서 데이터는 이미 기본값으로 설정됨
        
        // 카테고리 샘플 데이터
        const sampleCategories = [
            // 공통(운영지원과)
            { id: 'cat_001', name: '문서관리', departmentId: 'dept_001', description: '문서 작성 및 관리 업무', order: 1 },
            { id: 'cat_002', name: '회계업무', departmentId: 'dept_001', description: '예산 및 회계 관련 업무', order: 2 },
            { id: 'cat_003', name: '인사관리', departmentId: 'dept_001', description: '인사 관련 업무', order: 3 },
            
            // 시설안전관리과
            { id: 'cat_004', name: '시설점검', departmentId: 'dept_002', description: '도로시설 점검 업무', order: 1 },
            { id: 'cat_005', name: '안전관리', departmentId: 'dept_002', description: '안전 관리 업무', order: 2 },
            { id: 'cat_006', name: '시설보수', departmentId: 'dept_002', description: '시설 보수 및 유지관리', order: 3 },
            
            // 도로안전운영과
            { id: 'cat_007', name: '교통관리', departmentId: 'dept_003', description: '교통 관리 업무', order: 1 },
            { id: 'cat_008', name: '도로운영', departmentId: 'dept_003', description: '도로 운영 업무', order: 2 },
            { id: 'cat_009', name: '사고대응', departmentId: 'dept_003', description: '교통사고 대응 업무', order: 3 }
        ];
        
        // 프로세스 샘플 데이터
        const sampleProcesses = [];
        
        sampleCategories.forEach(category => {
            for (let i = 1; i <= 3; i++) {
                const process = {
                    id: Utils.generateId('proc'),
                    title: `${category.name} 프로세스 ${i}`,
                    description: `${category.name}와 관련된 ${i}번째 업무 프로세스입니다.`,
                    categoryId: category.id,
                    departmentId: category.departmentId,
                    steps: [
                        {
                            stepNumber: 1,
                            title: '준비 단계',
                            description: '필요한 자료와 도구를 준비합니다.',
                            details: '관련 문서, 양식, 도구 등을 미리 준비하여 업무 효율성을 높입니다.'
                        },
                        {
                            stepNumber: 2,
                            title: '실행 단계',
                            description: '실제 업무를 수행합니다.',
                            details: '준비된 자료를 바탕으로 해당 업무를 정확히 수행합니다.'
                        },
                        {
                            stepNumber: 3,
                            title: '완료 단계',
                            description: '업무 완료 후 검토 및 정리를 진행합니다.',
                            details: '업무 결과를 검토하고 필요한 후속 조치를 취합니다.'
                        }
                    ],
                    tags: [`${category.name}`, '업무프로세스', '매뉴얼'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    order: i
                };
                
                sampleProcesses.push(process);
            }
        });
        
        this.data.categories = sampleCategories;
        this.data.processes = sampleProcesses;
        
        Logger.info('샘플 데이터 생성 완료:', this.getDataSummary());
    }
    
    /**
     * 데이터 요약 정보 반환
     */
    getDataSummary() {
        return {
            departments: this.data.departments.length,
            categories: this.data.categories.length,
            processes: this.data.processes.length
        };
    }
    
    /**
     * 모든 데이터 반환
     */
    getAllData() {
        return Utils.deepClone(this.data);
    }
    
    /**
     * 부서 목록 반환
     */
    getDepartments() {
        return [...this.data.departments].sort((a, b) => a.order - b.order);
    }
    
    /**
     * 특정 부서의 카테고리 목록 반환
     */
    getCategoriesByDepartment(departmentId) {
        return this.data.categories
            .filter(cat => cat.departmentId === departmentId)
            .sort((a, b) => a.order - b.order);
    }
    
    /**
     * 특정 카테고리의 프로세스 목록 반환
     */
    getProcessesByCategory(categoryId) {
        return this.data.processes
            .filter(proc => proc.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    }
    
    /**
     * ID로 부서 찾기
     */
    getDepartmentById(id) {
        return this.data.departments.find(dept => dept.id === id);
    }
    
    /**
     * ID로 카테고리 찾기
     */
    getCategoryById(id) {
        return this.data.categories.find(cat => cat.id === id);
    }
    
    /**
     * ID로 프로세스 찾기
     */
    getProcessById(id) {
        return this.data.processes.find(proc => proc.id === id);
    }
    
    /**
     * 검색 기능
     */
    search(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        
        const results = [];
        const searchQuery = query.toLowerCase().trim();
        
        // 프로세스에서 검색
        this.data.processes.forEach(process => {
            let score = 0;
            let matchedFields = [];
            
            // 제목 검색
            if (process.title.toLowerCase().includes(searchQuery)) {
                score += 10;
                matchedFields.push('title');
            }
            
            // 설명 검색
            if (process.description.toLowerCase().includes(searchQuery)) {
                score += 5;
                matchedFields.push('description');
            }
            
            // 태그 검색
            if (process.tags && process.tags.some(tag => tag.toLowerCase().includes(searchQuery))) {
                score += 3;
                matchedFields.push('tags');
            }
            
            // 단계별 내용 검색
            if (process.steps) {
                process.steps.forEach(step => {
                    if (step.title.toLowerCase().includes(searchQuery) || 
                        step.description.toLowerCase().includes(searchQuery)) {
                        score += 2;
                        matchedFields.push('steps');
                    }
                });
            }
            
            if (score > 0) {
                const category = this.getCategoryById(process.categoryId);
                const department = this.getDepartmentById(process.departmentId);
                
                results.push({
                    type: 'process',
                    id: process.id,
                    title: process.title,
                    description: process.description,
                    path: `${department?.name} > ${category?.name} > ${process.title}`,
                    score: score,
                    matchedFields: [...new Set(matchedFields)]
                });
            }
        });
        
        // 카테고리에서 검색
        this.data.categories.forEach(category => {
            if (category.name.toLowerCase().includes(searchQuery) || 
                category.description.toLowerCase().includes(searchQuery)) {
                
                const department = this.getDepartmentById(category.departmentId);
                
                results.push({
                    type: 'category',
                    id: category.id,
                    title: category.name,
                    description: category.description,
                    path: `${department?.name} > ${category.name}`,
                    score: 8,
                    matchedFields: ['name', 'description']
                });
            }
        });
        
        // 점수순으로 정렬
        return results.sort((a, b) => b.score - a.score);
    }
    
    /**
     * 부서 추가/수정
     */
    saveDepartment(department) {
        try {
            if (department.id) {
                // 수정
                const index = this.data.departments.findIndex(d => d.id === department.id);
                if (index !== -1) {
                    this.data.departments[index] = { ...department, updatedAt: new Date().toISOString() };
                }
            } else {
                // 추가
                department.id = Utils.generateId('dept');
                department.createdAt = new Date().toISOString();
                department.updatedAt = new Date().toISOString();
                this.data.departments.push(department);
            }
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('부서 저장 실패:', error);
            return false;
        }
    }
    
    /**
     * 카테고리 추가/수정
     */
    saveCategory(category) {
        try {
            if (category.id) {
                // 수정
                const index = this.data.categories.findIndex(c => c.id === category.id);
                if (index !== -1) {
                    this.data.categories[index] = { ...category, updatedAt: new Date().toISOString() };
                }
            } else {
                // 추가
                category.id = Utils.generateId('cat');
                category.createdAt = new Date().toISOString();
                category.updatedAt = new Date().toISOString();
                this.data.categories.push(category);
            }
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('카테고리 저장 실패:', error);
            return false;
        }
    }
    
    /**
     * 프로세스 추가/수정
     */
    saveProcess(process) {
        try {
            if (process.id) {
                // 수정
                const index = this.data.processes.findIndex(p => p.id === process.id);
                if (index !== -1) {
                    this.data.processes[index] = { ...process, updatedAt: new Date().toISOString() };
                }
            } else {
                // 추가
                process.id = Utils.generateId('proc');
                process.createdAt = new Date().toISOString();
                process.updatedAt = new Date().toISOString();
                this.data.processes.push(process);
            }
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('프로세스 저장 실패:', error);
            return false;
        }
    }
    
    /**
     * 부서 삭제
     */
    deleteDepartment(id) {
        try {
            // 연관된 카테고리와 프로세스도 함께 삭제
            this.data.categories = this.data.categories.filter(cat => cat.departmentId !== id);
            this.data.processes = this.data.processes.filter(proc => proc.departmentId !== id);
            this.data.departments = this.data.departments.filter(dept => dept.id !== id);
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('부서 삭제 실패:', error);
            return false;
        }
    }
    
    /**
     * 카테고리 삭제
     */
    deleteCategory(id) {
        try {
            // 연관된 프로세스도 함께 삭제
            this.data.processes = this.data.processes.filter(proc => proc.categoryId !== id);
            this.data.categories = this.data.categories.filter(cat => cat.id !== id);
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('카테고리 삭제 실패:', error);
            return false;
        }
    }
    
    /**
     * 프로세스 삭제
     */
    deleteProcess(id) {
        try {
            this.data.processes = this.data.processes.filter(proc => proc.id !== id);
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('프로세스 삭제 실패:', error);
            return false;
        }
    }
    
    /**
     * 데이터 내보내기
     */
    exportData() {
        return {
            data: Utils.deepClone(this.data),
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
    }
    
    /**
     * 데이터 가져오기
     */
    importData(importedData) {
        try {
            if (this.validateData(importedData.data)) {
                this.data = importedData.data;
                this.saveToStorage();
                EventEmitter.emit('data:updated', this.data);
                return true;
            }
            return false;
        } catch (error) {
            Logger.error('데이터 가져오기 실패:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.dataManager = new DataManager();