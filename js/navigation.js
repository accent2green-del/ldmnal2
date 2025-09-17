/**
 * 네비게이션 관리 모듈
 * 트리 구조 네비게이션 생성, 상태 관리, 이벤트 처리
 */

class NavigationManager {
    constructor() {
        this.expandedDepartments = new Set();
        this.expandedCategories = new Set();
        this.currentSelection = null;
        this.isCollapsed = false;
        
        // 이벤트 바인딩
        this.bindEvents();
        
        Logger.navigation('Navigation 매니저 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        // 데이터 초기화 완료 시 네비게이션 생성
        EventEmitter.on('data:initialized', () => {
            this.renderNavigation();
        });
        
        // 데이터 업데이트 시 네비게이션 갱신
        EventEmitter.on('data:updated', () => {
            this.renderNavigation();
        });
        
        // 사이드바 토글 버튼
        document.addEventListener('DOMContentLoaded', () => {
            const sidebarToggle = document.getElementById('sidebar-toggle');
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', () => {
                    this.toggleSidebar();
                });
            }
        });
        
        // 모바일에서 네비게이션 아이템 클릭 시 사이드바 숨김 (스마트 로직)
        EventEmitter.on('navigation:itemSelected', (data) => {
            if (window.innerWidth <= 768) {
                const { type } = data;
                // 프로세스(leaf node) 선택 시에만 즉시 숨김
                // 부서나 카테고리 선택 시에는 사용자가 하위 항목을 볼 수 있도록 지연
                if (type === 'process') {
                    this.hideSidebar();
                } else if (type === 'department' || type === 'category') {
                    // 부서/카테고리 선택 시 2초 후 자동 숨김 (사용자가 하위 항목 확인 가능)
                    setTimeout(() => {
                        // 다시 한 번 모바일 체크 (사용자가 화면을 회전했을 수 있음)
                        if (window.innerWidth <= 768) {
                            this.hideSidebar();
                        }
                    }, 2000);
                }
            }
        });
        
        // 윈도우 리사이즈 시 사이드바 상태 조정
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 데이터 로드 후 아이콘 메뉴 초기화
        EventEmitter.on('data:initialized', () => {
            setTimeout(() => {
                this.updateIconMenu();
            }, 100);
        });
    }
    
    /**
     * 네비게이션 트리 렌더링
     */
    renderNavigation() {
        Logger.navigation('🌳 네비게이션 트리 생성 중...');
        
        const treeContainer = document.getElementById('navigation-tree');
        if (!treeContainer) {
            Logger.error('네비게이션 컨테이너를 찾을 수 없습니다.');
            return;
        }
        
        // 로딩 상태 제거
        treeContainer.innerHTML = '';
        
        const departments = dataManager.getDepartments();
        
        if (departments.length === 0) {
            treeContainer.innerHTML = '<div class="no-data">등록된 부서가 없습니다.</div>';
            return;
        }
        
        // 트리 구조 생성
        const treeHTML = departments.map(dept => this.createDepartmentNode(dept)).join('');
        treeContainer.innerHTML = treeHTML;
        
        // 이벤트 리스너 등록
        this.attachEventListeners();
        
        // 저장된 확장 상태 복원
        this.restoreExpandedState();
        
        Logger.navigation('✅ 네비게이션 트리 생성 완료', {
            departments: departments.length,
            categories: dataManager.data.categories.length,
            processes: dataManager.data.processes.length
        });
    }
    
    /**
     * 부서 노드 생성
     */
    createDepartmentNode(department) {
        const categories = dataManager.getCategoriesByDepartment(department.id);
        const hasCategories = categories.length > 0;
        const isExpanded = this.expandedDepartments.has(department.id);
        return `
            <div class="tree-node department-node" data-type="department" data-id="${department.id}">
                <div class="tree-item department ${this.currentSelection?.type === 'department' && this.currentSelection?.id === department.id ? 'active' : ''}"
                     data-type="department" data-id="${department.id}">
                    ${hasCategories ? `<span class="icon icon-chevron-right tree-expand ${isExpanded ? 'expanded' : ''}" data-department-id="${department.id}"></span>` : '<span class="tree-expand"></span>'}
                    <span class="icon icon-building tree-icon"></span>
                    <span class="tree-label">${Utils.escapeHtml(department.name)}</span>
                </div>
                <div class="tree-children ${isExpanded ? 'expanded' : ''}" id="dept-${department.id}-children">
                    ${categories.map(category => this.createCategoryNode(category)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 카테고리 노드 생성
     */
    createCategoryNode(category) {
        const processes = dataManager.getProcessesByCategory(category.id);
        const hasProcesses = processes.length > 0;
        const isExpanded = this.expandedCategories.has(category.id);
        return `
            <div class="tree-node category-node" data-type="category" data-id="${category.id}">
                <div class="tree-item category ${this.currentSelection?.type === 'category' && this.currentSelection?.id === category.id ? 'active' : ''}"
                     data-type="category" data-id="${category.id}">
                    ${hasProcesses ? `<span class="icon icon-chevron-right tree-expand ${isExpanded ? 'expanded' : ''}" data-category-id="${category.id}"></span>` : '<span class="tree-expand"></span>'}
                    <span class="icon icon-list tree-icon"></span>
                    <span class="tree-label">${Utils.escapeHtml(category.name)}</span>
                </div>
                <div class="tree-children ${isExpanded ? 'expanded' : ''}" id="cat-${category.id}-children">
                    ${processes.map(process => this.createProcessNode(process)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 프로세스 노드 생성
     */
    createProcessNode(process) {
        return `
            <div class="tree-node process-node" data-type="process" data-id="${process.id}">
                <div class="tree-item process ${this.currentSelection?.type === 'process' && this.currentSelection?.id === process.id ? 'active' : ''}"
                     data-type="process" data-id="${process.id}">
                    <span class="tree-expand"></span>
                    <span class="icon icon-file tree-icon"></span>
                    <span class="tree-label">${Utils.escapeHtml(process.title)}</span>
                </div>
            </div>
        `;
    }
    

    
    /**
     * 이벤트 리스너 등록
     */
    attachEventListeners() {
        const treeContainer = document.getElementById('navigation-tree');
        if (!treeContainer) return;
        
        // 클릭 이벤트 위임
        treeContainer.addEventListener('click', (e) => {
            const target = e.target;
            
            // 네비게이션 컨트롤 버튼 클릭
            const controlBtn = target.closest('.nav-control-btn');
            if (controlBtn) {
                e.stopPropagation();
                this.handleNavigationControl(controlBtn);
                return;
            }
            
            // 확장/축소 아이콘 클릭
            if (target.classList.contains('tree-expand') || target.classList.contains('icon-chevron-right')) {
                e.stopPropagation();
                const expandElement = target.closest('.tree-expand') || target;
                this.handleExpandClick(expandElement);
                return;
            }
            
            // 트리 아이템 클릭
            const treeItem = target.closest('.tree-item');
            if (treeItem) {
                this.handleItemClick(treeItem);
            }
        });
        
        // 키보드 접근성 지원
        treeContainer.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    }
    

    

    

    

    
    /**
     * 확장/축소 처리
     */
    handleExpandClick(expandIcon) {
        const departmentId = expandIcon.dataset.departmentId;
        const categoryId = expandIcon.dataset.categoryId;
        
        if (departmentId) {
            this.toggleDepartment(departmentId);
        } else if (categoryId) {
            this.toggleCategory(categoryId);
        }
    }
    
    /**
     * 아이템 클릭 처리
     */
    handleItemClick(treeItem) {
        const type = treeItem.dataset.type;
        const id = treeItem.dataset.id;
        
        Logger.navigation(`🖱️ 네비게이션 아이템 클릭: ${type} - ${id}`);
        
        // 이전 선택 해제
        const previousActive = document.querySelector('.tree-item.active');
        if (previousActive) {
            previousActive.classList.remove('active');
        }
        
        // 현재 선택 표시
        treeItem.classList.add('active');
        
        // 선택 상태 저장
        this.currentSelection = { type, id };
        
        // 부서나 카테고리 클릭 시 자동 확장 (축소는 하지 않음)
        if (type === 'department') {
            // 부서 클릭 시 해당 부서만 확장 (다른 부서는 건드리지 않음)
            if (!this.expandedDepartments.has(id)) {
                this.expandDepartment(id);
            }
        } else if (type === 'category') {
            // 카테고리 클릭 시 해당 카테고리만 확장
            if (!this.expandedCategories.has(id)) {
                this.expandCategory(id);
            }
        }
        
        // 컨텐츠 렌더링 이벤트 발생
        EventEmitter.emit('navigation:itemSelected', { type, id });
        
        // 브레드크럼 업데이트
        this.updateBreadcrumb(type, id);
        
        // 상태 저장
        this.saveNavigationState();
    }
    
    /**
     * 부서 확장만 하기 (축소하지 않음)
     */
    expandDepartment(departmentId) {
        if (this.expandedDepartments.has(departmentId)) return;
        
        const expandIcon = document.querySelector(`[data-department-id="${departmentId}"]`);
        const childrenContainer = document.getElementById(`dept-${departmentId}-children`);
        
        if (!expandIcon || !childrenContainer) return;
        
        // 확장 애니메이션
        this.expandedDepartments.add(departmentId);
        expandIcon.classList.add('expanded');
        childrenContainer.classList.add('expanding');
        
        setTimeout(() => {
            childrenContainer.classList.add('expanded');
            childrenContainer.classList.remove('expanding');
        }, 50);
        
        Logger.navigation(`➕ 부서 자동 확장: ${departmentId}`);
        this.saveNavigationState();
    }
    
    /**
     * 카테고리 확장만 하기 (축소하지 않음)
     */
    expandCategory(categoryId) {
        if (this.expandedCategories.has(categoryId)) return;
        
        const expandIcon = document.querySelector(`[data-category-id="${categoryId}"]`);
        const childrenContainer = document.getElementById(`cat-${categoryId}-children`);
        
        if (!expandIcon || !childrenContainer) return;
        
        // 확장 애니메이션
        this.expandedCategories.add(categoryId);
        expandIcon.classList.add('expanded');
        childrenContainer.classList.add('expanding');
        
        setTimeout(() => {
            childrenContainer.classList.add('expanded');
            childrenContainer.classList.remove('expanding');
        }, 50);
        
        Logger.navigation(`➕ 카테고리 자동 확장: ${categoryId}`);
        this.saveNavigationState();
    }
    

    
    /**
     * 부서 확장/축소
     */
    toggleDepartment(departmentId) {
        const expandIcon = document.querySelector(`[data-department-id="${departmentId}"]`);
        const childrenContainer = document.getElementById(`dept-${departmentId}-children`);
        
        if (!expandIcon || !childrenContainer) return;
        
        const isExpanded = this.expandedDepartments.has(departmentId);
        
        if (isExpanded) {
            // 축소 애니메이션
            childrenContainer.classList.add('collapsing');
            this.expandedDepartments.delete(departmentId);
            expandIcon.classList.remove('expanded');
            
            setTimeout(() => {
                childrenContainer.classList.remove('expanded', 'collapsing');
            }, 300);
            
            Logger.navigation(`➖ 부서 축소: ${departmentId}`);
        } else {
            // 확장 애니메이션
            this.expandedDepartments.add(departmentId);
            expandIcon.classList.add('expanded');
            childrenContainer.classList.add('expanding');
            
            setTimeout(() => {
                childrenContainer.classList.add('expanded');
                childrenContainer.classList.remove('expanding');
            }, 50);
            
            Logger.navigation(`➕ 부서 확장: ${departmentId}`);
        }
        
        this.saveNavigationState();
    }
    
    /**
     * 카테고리 확장/축소
     */
    toggleCategory(categoryId) {
        const expandIcon = document.querySelector(`[data-category-id="${categoryId}"]`);
        const childrenContainer = document.getElementById(`cat-${categoryId}-children`);
        
        if (!expandIcon || !childrenContainer) return;
        
        const isExpanded = this.expandedCategories.has(categoryId);
        
        if (isExpanded) {
            // 축소 애니메이션
            childrenContainer.classList.add('collapsing');
            this.expandedCategories.delete(categoryId);
            expandIcon.classList.remove('expanded');
            
            setTimeout(() => {
                childrenContainer.classList.remove('expanded', 'collapsing');
            }, 300);
            
            Logger.navigation(`➖ 카테고리 축소: ${categoryId}`);
        } else {
            // 확장 애니메이션
            this.expandedCategories.add(categoryId);
            expandIcon.classList.add('expanded');
            childrenContainer.classList.add('expanding');
            
            setTimeout(() => {
                childrenContainer.classList.add('expanded');
                childrenContainer.classList.remove('expanding');
            }, 50);
            
            Logger.navigation(`➕ 카테고리 확장: ${categoryId}`);
        }
        
        this.saveNavigationState();
    }
    
    /**
     * 사이드바 토글
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        if (window.innerWidth <= 768) {
            // 모바일에서는 show/hide 토글
            sidebar.classList.toggle('show');
            this.updateIconMenu();
        } else {
            // 데스크탑에서는 collapsed 토글
            sidebar.classList.toggle('collapsed');
            this.isCollapsed = sidebar.classList.contains('collapsed');
            this.updateIconMenu();
        }
        
        Logger.navigation(`📱 사이드바 토글: ${sidebar.classList.contains('show') || sidebar.classList.contains('collapsed') ? '열림' : '닫힌'}`);
    }
    
    /**
     * 사이드바 숨김 (모바일용)
     */
    hideSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('show');
        }
    }
    
    /**
     * 화면 크기 변경 처리
     */
    handleResize() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        
        if (window.innerWidth > 768) {
            // 데스크탑으로 변경 시 모바일 클래스 제거
            sidebar.classList.remove('show');
        } else {
            // 모바일로 변경 시 collapsed 클래스 제거
            sidebar.classList.remove('collapsed');
        }
        
        // 아이콘 메뉴 상태 업데이트
        this.updateIconMenu();
    }
    
    /**
     * 브레드크럼 업데이트
     */
    updateBreadcrumb(type, id) {
        const breadcrumbContainer = document.getElementById('breadcrumb');
        if (!breadcrumbContainer) return;
        
        let breadcrumb = ['홈'];
        
        try {
            if (type === 'process') {
                const process = dataManager.getProcessById(id);
                const category = dataManager.getCategoryById(process.categoryId);
                const department = dataManager.getDepartmentById(process.departmentId);
                
                breadcrumb = [
                    '홈',
                    department.name,
                    category.name,
                    process.title
                ];
            } else if (type === 'category') {
                const category = dataManager.getCategoryById(id);
                const department = dataManager.getDepartmentById(category.departmentId);
                
                breadcrumb = [
                    '홈',
                    department.name,
                    category.name
                ];
            } else if (type === 'department') {
                const department = dataManager.getDepartmentById(id);
                
                breadcrumb = [
                    '홈',
                    department.name
                ];
            }
        } catch (error) {
            Logger.error('브레드크럼 생성 중 오류:', error);
            breadcrumb = ['홈'];
        }
        
        breadcrumbContainer.innerHTML = breadcrumb
            .map(item => `<span>${Utils.escapeHtml(item)}</span>`)
            .join('');
        
        Logger.navigation(`🍞 브레드크럼 업데이트: ${breadcrumb.join(' > ')}`);
    }
    
    /**
     * 네비게이션 상태 저장
     */
    saveNavigationState() {
        const state = {
            expandedDepartments: Array.from(this.expandedDepartments),
            expandedCategories: Array.from(this.expandedCategories),
            currentSelection: this.currentSelection,
            isCollapsed: this.isCollapsed
        };
        
        Utils.setToStorage(AppConfig.STORAGE_KEYS.NAVIGATION_STATE, state);
    }
    
    /**
     * 네비게이션 상태 복원
     */
    restoreExpandedState() {
        const state = Utils.getFromStorage(AppConfig.STORAGE_KEYS.NAVIGATION_STATE);
        
        if (state) {
            // 확장 상태 복원
            if (state.expandedDepartments) {
                state.expandedDepartments.forEach(deptId => {
                    this.expandedDepartments.add(deptId);
                    const expandIcon = document.querySelector(`[data-department-id="${deptId}"]`);
                    const childrenContainer = document.getElementById(`dept-${deptId}-children`);
                    if (expandIcon && childrenContainer) {
                        expandIcon.classList.add('expanded');
                        childrenContainer.classList.add('expanded');
                    }
                });
            }
            
            if (state.expandedCategories) {
                state.expandedCategories.forEach(catId => {
                    this.expandedCategories.add(catId);
                    const expandIcon = document.querySelector(`[data-category-id="${catId}"]`);
                    const childrenContainer = document.getElementById(`cat-${catId}-children`);
                    if (expandIcon && childrenContainer) {
                        expandIcon.classList.add('expanded');
                        childrenContainer.classList.add('expanded');
                    }
                });
            }
            
            // 선택 상태 복원
            if (state.currentSelection) {
                const { type, id } = state.currentSelection;
                const treeItem = document.querySelector(`.tree-item[data-type="${type}"][data-id="${id}"]`);
                if (treeItem) {
                    treeItem.classList.add('active');
                    this.currentSelection = state.currentSelection;
                    this.updateBreadcrumb(type, id);
                }
            }
            
            Logger.navigation('📚 네비게이션 상태 복원 완료');
        }
    }
    
    /**
     * 특정 아이템으로 네비게이션
     */
    navigateToItem(type, id) {
        Logger.navigation(`🎯 프로그래밍 방식 네비게이션: ${type} - ${id}`);
        
        // 필요한 부모 노드들 자동 확장
        if (type === 'process') {
            const process = dataManager.getProcessById(id);
            if (process) {
                this.expandedDepartments.add(process.departmentId);
                this.expandedCategories.add(process.categoryId);
            }
        } else if (type === 'category') {
            const category = dataManager.getCategoryById(id);
            if (category) {
                this.expandedDepartments.add(category.departmentId);
            }
        }
        
        // 네비게이션 다시 렌더링
        this.renderNavigation();
        
        // 아이템 선택
        const treeItem = document.querySelector(`.tree-item[data-type="${type}"][data-id="${id}"]`);
        if (treeItem) {
            this.handleItemClick(treeItem);
        }
    }
    
    /**
     * 현재 선택된 아이템 반환
     */
    getCurrentSelection() {
        return this.currentSelection;
    }
    
    /**
     * 네비게이션 초기화
     */
    reset() {
        this.expandedDepartments.clear();
        this.expandedCategories.clear();
        this.currentSelection = null;
        this.isCollapsed = false;
        
        // 상태 저장
        this.saveNavigationState();
        
        // 네비게이션 다시 렌더링
        this.renderNavigation();
        
        Logger.navigation('🔄 네비게이션 초기화 완료');
    }
    
    /**
     * 모바일 오버레이 생성
     */
    createMobileOverlay() {
        const existingOverlay = document.querySelector('.sidebar-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', () => {
            this.hideSidebar();
        });
    }
    
    /**
     * 터치 제스처 추가
     */
    addTouchGestures() {
        let touchStartX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (window.innerWidth <= 768) {
                const touchEndX = e.changedTouches[0].clientX;
                const deltaX = touchEndX - touchStartX;
                
                if (deltaX > 100 && touchStartX < 50) {
                    this.showSidebar();
                } else if (deltaX < -100 && this.isSidebarOpen()) {
                    this.hideSidebar();
                }
            }
        }, { passive: true });
    }
    
    /**
     * 네비게이션 컨트롤 생성 (확장/축소 버튼)
     */
    createNavigationControls() {
        return `
            <div class="navigation-controls">
                <button class="nav-control-btn expand-all" title="모두 펼치기">모두 펼치기</button>
                <button class="nav-control-btn collapse-all" title="모두 접기">모두 접기</button>
            </div>
        `;
    }
    
    /**
     * 네비게이션 컨트롤 처리
     */
    handleNavigationControl(button) {
        if (button.classList.contains('expand-all')) {
            this.expandAll();
        } else if (button.classList.contains('collapse-all')) {
            this.collapseAll();
        }
    }
    
    /**
     * 모든 노드 확장
     */
    expandAll() {
        Logger.navigation('📂 모든 네비게이션 노드 확장 시작');
        
        // 모든 부서 확장
        const departments = dataManager.getDepartments();
        departments.forEach(dept => {
            this.expandedDepartments.add(dept.id);
            
            // 모든 카테고리 확장
            const categories = dataManager.getCategoriesByDepartment(dept.id);
            categories.forEach(cat => {
                this.expandedCategories.add(cat.id);
            });
        });
        
        // UI 업데이트
        this.updateExpandedUI();
        this.saveNavigationState();
        
        // 성공 피드백
        Utils.showNotification('모든 항목이 펼쳐졌습니다', 'success');
        Logger.navigation('✅ 모든 네비게이션 노드 확장 완료');
    }
    
    /**
     * 모든 노드 축소
     */
    collapseAll() {
        Logger.navigation('📁 모든 네비게이션 노드 축소 시작');
        
        // 모든 확장 상태 제거
        this.expandedDepartments.clear();
        this.expandedCategories.clear();
        
        // UI 업데이트
        this.updateExpandedUI();
        this.saveNavigationState();
        
        // 성공 피드백
        Utils.showNotification('모든 항목이 접혔습니다', 'info');
        Logger.navigation('✅ 모든 네비게이션 노드 축소 완료');
    }
    
    /**
     * 확장 상태에 따른 UI 업데이트
     */
    updateExpandedUI() {
        // 부서 노드 업데이트
        this.expandedDepartments.forEach(deptId => {
            const expandIcon = document.querySelector(`[data-department-id="${deptId}"]`);
            const childrenContainer = document.getElementById(`dept-${deptId}-children`);
            if (expandIcon && childrenContainer) {
                expandIcon.classList.add('expanded');
                childrenContainer.classList.add('expanded');
            }
        });
        
        // 축소된 부서 노드 업데이트
        document.querySelectorAll('[data-department-id]').forEach(expandIcon => {
            const deptId = expandIcon.dataset.departmentId;
            if (!this.expandedDepartments.has(deptId)) {
                const childrenContainer = document.getElementById(`dept-${deptId}-children`);
                if (childrenContainer) {
                    expandIcon.classList.remove('expanded');
                    childrenContainer.classList.remove('expanded');
                }
            }
        });
        
        // 카테고리 노드 업데이트
        this.expandedCategories.forEach(catId => {
            const expandIcon = document.querySelector(`[data-category-id="${catId}"]`);
            const childrenContainer = document.getElementById(`cat-${catId}-children`);
            if (expandIcon && childrenContainer) {
                expandIcon.classList.add('expanded');
                childrenContainer.classList.add('expanded');
            }
        });
        
        // 축소된 카테고리 노드 업데이트
        document.querySelectorAll('[data-category-id]').forEach(expandIcon => {
            const catId = expandIcon.dataset.categoryId;
            if (!this.expandedCategories.has(catId)) {
                const childrenContainer = document.getElementById(`cat-${catId}-children`);
                if (childrenContainer) {
                    expandIcon.classList.remove('expanded');
                    childrenContainer.classList.remove('expanded');
                }
            }
        });
    }
    
    /**
     * 키보드 네비게이션 지원
     */
    handleKeyboardNavigation(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target;
            if (target.classList.contains('tree-expand')) {
                e.preventDefault();
                this.handleExpandClick(target);
            } else if (target.classList.contains('tree-item')) {
                e.preventDefault();
                this.handleItemClick(target);
            }
        }
    }
    
    /**
     * 아이콘 메뉴 업데이트
     */
    updateIconMenu() {
        const iconMenu = document.getElementById('icon-menu');
        const sidebar = document.getElementById('sidebar');
        
        if (!iconMenu || !sidebar) return;
        
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed && window.innerWidth > 768) {
            this.showIconMenu();
            this.createIconMenuItems();
        } else {
            this.hideIconMenu();
        }
    }
    
    /**
     * 아이콘 메뉴 표시
     */
    showIconMenu() {
        const iconMenu = document.getElementById('icon-menu');
        if (iconMenu) {
            iconMenu.classList.add('show');
            iconMenu.style.display = 'block';
        }
    }
    
    /**
     * 아이콘 메뉴 숨김
     */
    hideIconMenu() {
        const iconMenu = document.getElementById('icon-menu');
        if (iconMenu) {
            iconMenu.classList.remove('show');
            iconMenu.style.display = 'none';
        }
    }
    
    /**
     * 아이콘 메뉴 아이템 생성
     */
    createIconMenuItems() {
        const iconMenuItems = document.getElementById('icon-menu-items');
        const iconMenuToggle = document.getElementById('icon-menu-toggle');
        
        if (!iconMenuItems) return;
        
        // 토글 버튼 이벤트
        if (iconMenuToggle) {
            iconMenuToggle.onclick = () => {
                this.toggleSidebar();
            };
        }
        
        const departments = dataManager.getDepartments();
        
        const menuHTML = departments.map(dept => {
            const isActive = this.currentSelection?.type === 'department' && this.currentSelection?.id === dept.id;
            return `
                <button class="icon-menu-item ${isActive ? 'active' : ''}" 
                        data-type="department" 
                        data-id="${dept.id}"
                        title="${Utils.escapeHtml(dept.name)}">
                    <span class="icon icon-building"></span>
                </button>
            `;
        }).join('');
        
        iconMenuItems.innerHTML = menuHTML;
        
        // 아이콘 메뉴 아이템 이벤트 등록
        iconMenuItems.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.icon-menu-item');
            if (menuItem) {
                const type = menuItem.dataset.type;
                const id = menuItem.dataset.id;
                this.navigateToItem(type, id);
                
                // 사이드바 펼치기
                this.toggleSidebar();
            }
        });
    }
    
    /**
     * 사이드바 표시
     */
    showSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.add('show');
            
            if (window.innerWidth <= 768 && overlay) {
                overlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }
    }
    
    /**
     * 사이드바 열림 상태 확인
     */
    isSidebarOpen() {
        const sidebar = document.getElementById('sidebar');
        return sidebar && sidebar.classList.contains('show');
    }
}

// 전역 인스턴스 생성
try {
    window.navigationManager = new NavigationManager();
    Logger.info('🧭 NavigationManager 전역 인스턴스 생성 완료');
} catch (error) {
    Logger.error('❌ NavigationManager 전역 인스턴스 생성 실패:', error);
    throw error;
}