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
            Logger.info('JSON 파일에서 데이터 로드 시도 중...');
            const response = await fetch(AppConfig.API.ENDPOINTS.MANUAL_DATA);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 표준 형식인지 확인
            if (this.validateData(data)) {
                this.data = data;
                this.saveToStorage();
                Logger.info('JSON 파일에서 데이터 로드 완료 (표준 형식)');
            } else if (Array.isArray(data) && data.length > 0 && data[0]['1단계']) {
                // 새 형식 (1단계/2단계) 데이터인 경우 변환
                Logger.info('새 형식 JSON 데이터 감지됨, 변환 중...', { itemCount: data.length });
                const convertedData = this.convertNewFormatToStandard(data);
                
                if (this.validateData(convertedData)) {
                    this.data = convertedData;
                    this.saveToStorage();
                    Logger.info('JSON 파일에서 데이터 로드 완료 (새 형식 변환됨)', {
                        departments: convertedData.departments.length,
                        categories: convertedData.categories.length,
                        processes: convertedData.processes.length
                    });
                } else {
                    throw new Error('변환된 데이터 구조가 유효하지 않음');
                }
            } else {
                throw new Error('알 수 없는 데이터 구조');
            }
            
        } catch (error) {
            Logger.warn('JSON 파일 로드 실패, 기본 데이터 생성:', error.message);
            
            // 네트워크 오류인지 확인
            if (error instanceof TypeError && error.message.includes('fetch')) {
                Logger.info('네트워크 연결 확인 필요 - 오프라인 모드로 전환');
            }
            
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
     * 모든 카테고리 목록 반환
     */
    getCategories() {
        return [...this.data.categories].sort((a, b) => a.order - b.order);
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
    
    /**
     * 새로운 JSON 형식 데이터 변환 및 가져오기
     */
    importNewFormatData(newFormatData) {
        try {
            Logger.info('새 형식 JSON 데이터 변환 시작...');
            
            // 새 형식이 배열인지 확인
            if (!Array.isArray(newFormatData)) {
                throw new Error('새 형식 데이터는 배열이어야 합니다.');
            }
            
            const convertedData = this.convertNewFormatToStandard(newFormatData);
            
            if (this.validateData(convertedData)) {
                this.data = convertedData;
                this.saveToStorage();
                EventEmitter.emit('data:updated', this.data);
                Logger.info('새 형식 데이터 변환 및 가져오기 완료', this.getDataSummary());
                return true;
            }
            
            return false;
        } catch (error) {
            Logger.error('새 형식 데이터 가져오기 실패:', error);
            return false;
        }
    }
    
    /**
     * 새 JSON 형식을 기존 형식으로 변환
     */
    convertNewFormatToStandard(newFormatData) {
        Logger.info('JSON 형식 변환 중...', { itemCount: newFormatData.length });
        
        const departments = [];
        const categories = [];
        const processes = [];
        
        // 부서별 카운터와 매핑
        const departmentMap = new Map();
        const categoryMap = new Map();
        let departmentOrder = 1;
        let categoryOrder = 1;
        let processOrder = 1;
        
        newFormatData.forEach((item, itemIndex) => {
            const departmentName = item['1단계'];
            const categoryName = item['2단계'];
            const metaInfo = item['3단계'] || {};
            const processList = item['4단계'] || [];
            
            // 부서 처리
            let departmentId = departmentMap.get(departmentName);
            if (!departmentId) {
                departmentId = Utils.generateId('dept');
                departmentMap.set(departmentName, departmentId);
                
                departments.push({
                    id: departmentId,
                    name: departmentName,
                    description: this.extractBusinessDefinition(metaInfo.업무정의),
                    order: departmentOrder++,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            // 카테고리 처리
            const categoryKey = `${departmentName}::${categoryName}`;
            let categoryId = categoryMap.get(categoryKey);
            if (!categoryId) {
                categoryId = Utils.generateId('cat');
                categoryMap.set(categoryKey, categoryId);
                
                categories.push({
                    id: categoryId,
                    name: categoryName,
                    departmentId: departmentId,
                    description: this.extractBusinessDefinition(metaInfo.업무정의) || `${categoryName} 관련 업무`,
                    order: categoryOrder++,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            // 프로세스 처리
            processList.forEach((processItem, processIndex) => {
                const processName = processItem['프로세스'];
                const processDetails = processItem['5단계'] || {};
                
                // 빈 프로세스나 중복 프로세스 필터링
                if (!processName || processName.trim() === '') {
                    return;
                }
                
                // 동일한 프로세스명이 이미 해당 카테고리에 있는지 확인
                const existingProcess = processes.find(p => 
                    p.categoryId === categoryId && 
                    p.title === processName.trim()
                );
                
                if (existingProcess) {
                    // 기존 프로세스가 있으면 세부 정보 업데이트
                    this.updateExistingProcess(existingProcess, processDetails, metaInfo);
                } else {
                    // 새 프로세스 생성
                    const newProcess = {
                        id: Utils.generateId('proc'),
                        title: processName.trim(),
                        description: this.extractStepDescription(processDetails.단계설명) || `${processName} 관련 업무 프로세스`,
                        categoryId: categoryId,
                        departmentId: departmentId,
                        steps: this.convertToSteps(processDetails),
                        tags: this.extractTags(processDetails, metaInfo),
                        legalBasis: this.extractLegalBasis(metaInfo.법적근거),
                        references: this.extractReferences(processDetails.참고자료),
                        outputs: processDetails.산출물 || [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        order: processOrder++
                    };
                    
                    processes.push(newProcess);
                }
            });
        });
        
        Logger.info('변환 완료', {
            departments: departments.length,
            categories: categories.length,
            processes: processes.length
        });
        
        return {
            departments,
            categories,
            processes
        };
    }
    
    /**
     * 업무정의에서 설명 추출
     */
    extractBusinessDefinition(definition) {
        if (!definition || typeof definition !== 'string') {
            return null;
        }
        
        // 업무정의에서 첫 번째 라인 또는 주요 설명 추출
        const lines = definition.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length > 0) {
            return lines[0].replace(/^-\s*/, ''); // 맨 앞의 - 기호 제거
        }
        
        return definition.substring(0, 200).trim(); // 최대 200자로 제한
    }
    
    /**
     * 단계 설명에서 설명 추출
     */
    extractStepDescription(stepDescription) {
        if (!stepDescription || typeof stepDescription !== 'string') {
            return null;
        }
        
        // 단계설명에서 주요 내용 추출
        const lines = stepDescription.split('\n').map(line => line.trim()).filter(line => line);
        const mainLines = lines.filter(line => !line.startsWith('- '));
        
        if (mainLines.length > 0) {
            return mainLines.join(' ').substring(0, 200).trim();
        }
        
        return stepDescription.substring(0, 200).trim();
    }
    
    /**
     * 5단계 정보를 steps 형식으로 변환
     */
    convertToSteps(processDetails) {
        const steps = [];
        const mainContents = processDetails.주요내용 || [];
        const stepDescription = processDetails.단계설명 || '';
        
        if (mainContents.length > 0) {
            // 주요내용을 단계별로 분할
            mainContents.forEach((content, index) => {
                steps.push({
                    stepNumber: index + 1,
                    title: content.replace(/^-\s*/, '').trim(),
                    description: content,
                    details: stepDescription
                });
            });
        } else if (stepDescription) {
            // 단계설명만 있는 경우
            const descriptionLines = stepDescription.split('\n')
                .map(line => line.trim())
                .filter(line => line && line.startsWith('- '));
            
            if (descriptionLines.length > 0) {
                descriptionLines.forEach((line, index) => {
                    const content = line.replace(/^-\s*/, '').trim();
                    steps.push({
                        stepNumber: index + 1,
                        title: content,
                        description: content,
                        details: stepDescription
                    });
                });
            } else {
                // 단계설명을 하나의 단계로 처리
                steps.push({
                    stepNumber: 1,
                    title: '업무 실행',
                    description: stepDescription,
                    details: stepDescription
                });
            }
        } else {
            // 기본 단계 생성
            steps.push({
                stepNumber: 1,
                title: '업무 처리',
                description: '해당 업무를 수행합니다.',
                details: '세부 절차는 관련 규정에 따라 진행합니다.'
            });
        }
        
        return steps;
    }
    
    /**
     * 태그 추출
     */
    extractTags(processDetails, metaInfo) {
        const tags = [];
        
        // 산출물에서 태그 추출
        if (processDetails.산출물 && Array.isArray(processDetails.산출물)) {
            processDetails.산출물.forEach(output => {
                if (output && typeof output === 'string') {
                    if (output.includes('신청서')) tags.push('신청서');
                    if (output.includes('허가')) tags.push('허가');
                    if (output.includes('민원')) tags.push('민원');
                    if (output.includes('계약')) tags.push('계약');
                    if (output.includes('공사')) tags.push('공사');
                    if (output.includes('설계')) tags.push('설계');
                    if (output.includes('보상')) tags.push('보상');
                }
            });
        }
        
        // 법적근거에서 태그 추출
        if (metaInfo.법적근거 && Array.isArray(metaInfo.법적근거)) {
            metaInfo.법적근거.forEach(legal => {
                if (legal && typeof legal === 'string') {
                    if (legal.includes('민원')) tags.push('민원');
                    if (legal.includes('도로')) tags.push('도로');
                    if (legal.includes('건설')) tags.push('건설');
                    if (legal.includes('안전')) tags.push('안전');
                    if (legal.includes('시설')) tags.push('시설');
                }
            });
        }
        
        // 기본 태그
        tags.push('업무프로세스');
        
        // 중복 제거 후 반환
        return [...new Set(tags)];
    }
    
    /**
     * 법적근거 추출
     */
    extractLegalBasis(legalBasisArray) {
        if (!Array.isArray(legalBasisArray)) {
            return [];
        }
        
        return legalBasisArray.filter(item => item && typeof item === 'string').map(item => item.trim());
    }
    
    /**
     * 참고자료 추출
     */
    extractReferences(referencesArray) {
        if (!Array.isArray(referencesArray)) {
            return [];
        }
        
        return referencesArray.filter(item => item && typeof item === 'string').map(item => item.trim());
    }
    
    /**
     * 기존 프로세스 업데이트 (중복 방지)
     */
    updateExistingProcess(existingProcess, processDetails, metaInfo) {
        // 더 상세한 정보가 있으면 업데이트
        if (processDetails.단계설명 && !existingProcess.description) {
            existingProcess.description = this.extractStepDescription(processDetails.단계설명);
        }
        
        if (processDetails.주요내용 && processDetails.주요내용.length > 0 && existingProcess.steps.length <= 1) {
            existingProcess.steps = this.convertToSteps(processDetails);
        }
        
        if (processDetails.참고자료 && processDetails.참고자료.length > 0) {
            existingProcess.references = this.extractReferences(processDetails.참고자료);
        }
        
        if (processDetails.산출물 && processDetails.산출물.length > 0) {
            existingProcess.outputs = processDetails.산출물;
        }
        
        existingProcess.updatedAt = new Date().toISOString();
    }
    
    /**
     * 모든 데이터 초기화
     */
    clearAllData() {
        try {
            this.data = {
                departments: [],
                categories: [],
                processes: []
            };
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            Logger.info('모든 데이터가 초기화되었습니다.');
            return true;
        } catch (error) {
            Logger.error('데이터 초기화 실패:', error);
            return false;
        }
    }
    
    /**
     * 변환된 데이터를 시스템에 로드
     */
    importConvertedData(convertedData) {
        try {
            if (!convertedData || typeof convertedData !== 'object') {
                throw new Error('잘못된 데이터 형식입니다.');
            }
            
            const { departments = [], categories = [], processes = [] } = convertedData;
            
            // 데이터 유효성 검증
            if (!Array.isArray(departments) || !Array.isArray(categories) || !Array.isArray(processes)) {
                throw new Error('데이터는 배열 형식이어야 합니다.');
            }
            
            // 새로운 데이터 설정
            this.data = {
                departments: departments.map(dept => ({
                    ...dept,
                    createdAt: dept.createdAt || new Date().toISOString(),
                    updatedAt: dept.updatedAt || new Date().toISOString()
                })),
                categories: categories.map(cat => ({
                    ...cat,
                    createdAt: cat.createdAt || new Date().toISOString(),
                    updatedAt: cat.updatedAt || new Date().toISOString()
                })),
                processes: processes.map(proc => ({
                    ...proc,
                    createdAt: proc.createdAt || new Date().toISOString(),
                    updatedAt: proc.updatedAt || new Date().toISOString()
                }))
            };
            
            // 저장 및 이벤트 발생
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            EventEmitter.emit('data:imported', this.data);
            
            Logger.info('변환된 데이터 로드 완료:', {
                departments: this.data.departments.length,
                categories: this.data.categories.length,
                processes: this.data.processes.length
            });
            
            return true;
        } catch (error) {
            Logger.error('변환된 데이터 로드 실패:', error);
            throw error;
        }
    }
    
    /**
     * 부서 업데이트 (상세 정보 포함)
     */
    updateDepartment(id, updateData) {
        try {
            const index = this.data.departments.findIndex(dept => dept.id === id);
            if (index === -1) {
                throw new Error('부서를 찾을 수 없습니다.');
            }
            
            this.data.departments[index] = {
                ...this.data.departments[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('부서 업데이트 실패:', error);
            return false;
        }
    }
    
    /**
     * 카테고리 업데이트 (상세 정보 포함)
     */
    updateCategory(id, updateData) {
        try {
            const index = this.data.categories.findIndex(cat => cat.id === id);
            if (index === -1) {
                throw new Error('카테고리를 찾을 수 없습니다.');
            }
            
            this.data.categories[index] = {
                ...this.data.categories[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('카테고리 업데이트 실패:', error);
            return false;
        }
    }
    
    /**
     * 프로세스 업데이트 (상세 정보 포함)
     */
    updateProcess(id, updateData) {
        try {
            const index = this.data.processes.findIndex(proc => proc.id === id);
            if (index === -1) {
                throw new Error('프로세스를 찾을 수 없습니다.');
            }
            
            this.data.processes[index] = {
                ...this.data.processes[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToStorage();
            EventEmitter.emit('data:updated', this.data);
            return true;
        } catch (error) {
            Logger.error('프로세스 업데이트 실패:', error);
            return false;
        }
    }
    
    /**
     * ID로 부서 조회
     */
    getDepartmentById(id) {
        return this.data.departments.find(dept => dept.id === id) || null;
    }
    
    /**
     * ID로 카테고리 조회
     */
    getCategoryById(id) {
        return this.data.categories.find(cat => cat.id === id) || null;
    }
    
    /**
     * ID로 프로세스 조회
     */
    getProcessById(id) {
        return this.data.processes.find(proc => proc.id === id) || null;
    }
}

// 전역 인스턴스 생성
try {
    window.dataManager = new DataManager();
    Logger.info('📊 DataManager 전역 인스턴스 생성 완료');
} catch (error) {
    Logger.error('❌ DataManager 전역 인스턴스 생성 실패:', error);
    throw error;
}