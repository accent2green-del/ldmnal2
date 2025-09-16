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
        
        // 모바일에서 네비게이션 아이템 클릭 시 사이드바 숨김
        EventEmitter.on('navigation:itemSelected', () => {
            if (window.innerWidth <= 768) {
                this.hideSidebar();
            }
        });
        
        // 윈도우 리사이즈 시 사이드바 상태 조정
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
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
        const isAdminMode = adminManager && adminManager.isAdminLoggedIn();
        
        return `
            <div class="tree-node department-node" data-type="department" data-id="${department.id}">
                <div class="tree-item department ${isAdminMode ? 'admin-mode' : ''} ${this.currentSelection?.type === 'department' && this.currentSelection?.id === department.id ? 'active' : ''}"
                     data-type="department" data-id="${department.id}">
                    ${hasCategories ? `<i class="fas fa-chevron-right tree-expand ${isExpanded ? 'expanded' : ''}" data-department-id="${department.id}"></i>` : '<span class="tree-expand"></span>'}
                    <i class="fas fa-building tree-icon"></i>
                    <span class="tree-label">${Utils.escapeHtml(department.name)}</span>
                    ${isAdminMode ? this.createInlineControls('department', department.id, true, true, true) : ''}
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
        const isAdminMode = adminManager && adminManager.isAdminLoggedIn();
        
        return `
            <div class="tree-node category-node" data-type="category" data-id="${category.id}">
                <div class="tree-item category ${isAdminMode ? 'admin-mode' : ''} ${this.currentSelection?.type === 'category' && this.currentSelection?.id === category.id ? 'active' : ''}"
                     data-type="category" data-id="${category.id}">
                    ${hasProcesses ? `<i class="fas fa-chevron-right tree-expand ${isExpanded ? 'expanded' : ''}" data-category-id="${category.id}"></i>` : '<span class="tree-expand"></span>'}
                    <i class="fas fa-list tree-icon"></i>
                    <span class="tree-label">${Utils.escapeHtml(category.name)}</span>
                    ${isAdminMode ? this.createInlineControls('category', category.id, true, true, true) : ''}
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
        const isAdminMode = adminManager && adminManager.isAdminLoggedIn();
        
        return `
            <div class="tree-node process-node" data-type="process" data-id="${process.id}">
                <div class="tree-item process ${isAdminMode ? 'admin-mode' : ''} ${this.currentSelection?.type === 'process' && this.currentSelection?.id === process.id ? 'active' : ''}"
                     data-type="process" data-id="${process.id}">
                    <span class="tree-expand"></span>
                    <i class="fas fa-file-alt tree-icon"></i>
                    <span class="tree-label">${Utils.escapeHtml(process.title)}</span>
                    ${isAdminMode ? this.createInlineControls('process', process.id, false, true, true) : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * 인라인 관리자 컨트롤 생성
     */
    createInlineControls(type, id, showAdd = true, showEdit = true, showDelete = true) {
        const controls = [];
        
        if (showAdd) {
            controls.push(`<button class="btn-inline btn-add" data-action="add" data-type="${type}" data-id="${id}" title="추가">
                <i class="fas fa-plus"></i>
            </button>`);
        }
        
        if (showEdit) {
            controls.push(`<button class="btn-inline btn-edit" data-action="edit" data-type="${type}" data-id="${id}" title="수정">
                <i class="fas fa-edit"></i>
            </button>`);
        }
        
        if (showDelete) {
            controls.push(`<button class="btn-inline btn-delete" data-action="delete" data-type="${type}" data-id="${id}" title="삭제">
                <i class="fas fa-trash"></i>
            </button>`);
        }
        
        return `<div class="tree-item-controls">${controls.join('')}</div>`;
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
            
            // 인라인 관리자 버튼 클릭
            const inlineBtn = target.closest('.btn-inline');
            if (inlineBtn) {
                e.stopPropagation();
                this.handleInlineAction(inlineBtn);
                return;
            }
            
            // 확장/축소 아이콘 클릭
            if (target.classList.contains('tree-expand')) {
                e.stopPropagation();
                this.handleExpandClick(target);
                return;
            }
            
            // 트리 아이템 클릭
            const treeItem = target.closest('.tree-item');
            if (treeItem) {
                this.handleItemClick(treeItem);
            }
        });
    }
    
    /**
     * 인라인 관리자 액션 처리
     */
    handleInlineAction(button) {
        const action = button.dataset.action;
        const type = button.dataset.type;
        const id = button.dataset.id;
        
        Logger.navigation(`🔧 관리자 액션: ${action} - ${type}:${id}`);
        
        // AdminManager로 액션 전달
        if (adminManager) {
            switch (action) {
                case 'add':
                    this.handleInlineAdd(type, id);
                    break;
                case 'edit':
                    this.handleInlineEdit(type, id);
                    break;
                case 'delete':
                    this.handleInlineDelete(type, id);
                    break;
            }
        }
    }
    
    /**
     * 인라인 추가 처리
     */
    handleInlineAdd(parentType, parentId) {
        let targetType;
        if (parentType === 'department') {
            targetType = 'category';
        } else if (parentType === 'category') {
            targetType = 'process';
        }
        
        if (targetType) {
            EventEmitter.emit('admin:showAddForm', { type: targetType, parentType, parentId });
        }
    }
    
    /**
     * 인라인 수정 처리
     */
    handleInlineEdit(type, id) {
        EventEmitter.emit('admin:showEditForm', { type, id });
    }
    
    /**
     * 인라인 삭제 처리
     */
    handleInlineDelete(type, id) {
        if (confirm(`정말로 이 ${type === 'department' ? '부서' : type === 'category' ? '카테고리' : '프로세스'}를 삭제하시겠습니까?`)) {
            EventEmitter.emit('admin:deleteItem', { type, id });
        }
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
        
        // 컨텐츠 렌더링 이벤트 발생
        EventEmitter.emit('navigation:itemSelected', { type, id });
        
        // 브레드크럼 업데이트
        this.updateBreadcrumb(type, id);
        
        // 상태 저장
        this.saveNavigationState();
    }
    
    /**
     * 관리자 모드 업데이트 (네비게이션 다시 렌더링)
     */
    updateAdminMode() {
        this.renderNavigation();
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
            // 축소
            this.expandedDepartments.delete(departmentId);
            expandIcon.classList.remove('expanded');
            childrenContainer.classList.remove('expanded');
            Logger.navigation(`➖ 부서 축소: ${departmentId}`);
        } else {
            // 확장
            this.expandedDepartments.add(departmentId);
            expandIcon.classList.add('expanded');
            childrenContainer.classList.add('expanded');
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
            // 축소
            this.expandedCategories.delete(categoryId);
            expandIcon.classList.remove('expanded');
            childrenContainer.classList.remove('expanded');
            Logger.navigation(`➖ 카테고리 축소: ${categoryId}`);
        } else {
            // 확장
            this.expandedCategories.add(categoryId);
            expandIcon.classList.add('expanded');
            childrenContainer.classList.add('expanded');
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
        } else {
            // 데스크탑에서는 collapsed 토글
            sidebar.classList.toggle('collapsed');
            this.isCollapsed = sidebar.classList.contains('collapsed');
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
}

// 전역 인스턴스 생성
window.navigationManager = new NavigationManager();