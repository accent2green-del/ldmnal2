/**
 * 관리자 기능 모듈
 * 로그인, 데이터 관리, CRUD 작업
 */

class AdminManager {
    constructor() {
        this.isLoggedIn = false;
        this.sessionToken = null;
        this.currentEditItem = null;
        
        // 이벤트 바인딩
        this.bindEvents();
        
        // 세션 복원 시도
        this.restoreSession();
        
        Logger.info('AdminManager 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    bindEvents() {
        document.addEventListener('DOMContentLoaded', () => {
            // 관리자 버튼 클릭
            const adminBtn = document.getElementById('admin-btn');
            if (adminBtn) {
                adminBtn.addEventListener('click', () => {
                    if (this.isLoggedIn) {
                        this.showAdminPanel();
                    } else {
                        this.showLoginModal();
                    }
                });
            }
            
            // 로그아웃 버튼 클릭
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                    this.showLogoutConfirmation();
                });
            }
            
            // 로그인 모달 이벤트
            this.bindLoginModalEvents();
            
            // 관리자 패널 이벤트
            this.bindAdminPanelEvents();
        });
        
        // 인라인 관리자 액션 이벤트
        EventEmitter.on('admin:showAddForm', (data) => {
            this.showInlineAddForm(data);
        });
        
        EventEmitter.on('admin:showEditForm', (data) => {
            this.showInlineEditForm(data);
        });
        
        EventEmitter.on('admin:deleteItem', (data) => {
            this.handleInlineDelete(data);
        });
    }
    
    /**
     * 로그인 모달 이벤트 바인딩
     */
    bindLoginModalEvents() {
        const loginModal = document.getElementById('admin-modal');
        const loginForm = document.getElementById('admin-login-form');
        const closeBtn = document.getElementById('admin-modal-close');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideLoginModal();
            });
        }
        
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideLoginModal();
                }
            });
        }
    }
    
    /**
     * 관리자 패널 이벤트 바인딩
     */
    bindAdminPanelEvents() {
        // 데이터 업데이트 시 패널 새로고침
        EventEmitter.on('data:updated', () => {
            if (this.isLoggedIn) {
                setTimeout(() => this.renderAdminPanel(), 100);
            }
        });
    }
    
    /**
     * 로그인 처리
     */
    handleLogin() {
        const passwordInput = document.getElementById('admin-password');
        const password = passwordInput ? passwordInput.value : '';
        
        if (password === AppConfig.ADMIN_PASSWORD) {
            // 로그인 성공
            this.isLoggedIn = true;
            this.sessionToken = this.generateSessionToken();
            
            // 세션 저장
            this.saveSession();
            
            // UI 업데이트
            this.updateAdminButtonState();
            this.hideLoginModal();
            
            // 관리자 패널 표시
            this.showAdminPanel();
            
            Utils.showNotification(AppConfig.MESSAGES.SUCCESS_ADMIN_LOGIN, 'success');
            Logger.info('🔑 관리자 로그인 성공');
            
        } else {
            // 로그인 실패
            Utils.showNotification(AppConfig.MESSAGES.ERROR_ADMIN_LOGIN, 'error');
            Logger.warn('🚫 관리자 로그인 실패: 잘못된 비밀번호');
            
            // 비밀번호 입력 필드 초기화
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    }
    
    /**
     * 로그아웃 확인 대화상자 표시
     */
    showLogoutConfirmation() {
        const confirmed = confirm('정말로 로그아웃하시겠습니까?\n\n모든 관리자 기능이 비활성화됩니다.');
        
        if (confirmed) {
            this.handleLogout();
        }
    }
    
    /**
     * 로그아웃 처리
     */
    handleLogout() {
        // 로극 애니메이션
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.innerHTML = '<span class="icon icon-spinner"></span> 로그아웃 중...';
            logoutBtn.disabled = true;
        }
        
        // 짧은 딸레이 후 로그아웃 실행
        setTimeout(() => {
            this.isLoggedIn = false;
            this.sessionToken = null;
            this.currentEditItem = null;
            
            // 세션 삭제
            Utils.removeFromStorage(AppConfig.STORAGE_KEYS.ADMIN_SESSION);
            
            // UI 업데이트
            this.updateAdminButtonState();
            
            // 홈으로 이동
            EventEmitter.emit('navigation:itemSelected', { type: 'home', id: null });
            
            // 로그아웃 성공 메시지
            Utils.showNotification('로그아웃이 완료되었습니다. 안전하게 나가셔주세요.', 'success');
            Logger.info('🔓 관리자 로그아웃 완료');
        }, 1000);
    }
    
    /**
     * 세션 토큰 생성
     */
    generateSessionToken() {
        return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 세션 저장
     */
    saveSession() {
        const sessionData = {
            token: this.sessionToken,
            timestamp: Date.now(),
            isLoggedIn: this.isLoggedIn
        };
        
        Utils.setToStorage(AppConfig.STORAGE_KEYS.ADMIN_SESSION, sessionData);
    }
    
    /**
     * 세션 복원
     */
    restoreSession() {
        const sessionData = Utils.getFromStorage(AppConfig.STORAGE_KEYS.ADMIN_SESSION);
        
        if (sessionData && sessionData.isLoggedIn && sessionData.token) {
            // 세션 유효성 검사 (24시간)
            const sessionAge = Date.now() - sessionData.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24시간
            
            if (sessionAge < maxAge) {
                this.isLoggedIn = true;
                this.sessionToken = sessionData.token;
                this.updateAdminButtonState();
                Logger.info('🔄 관리자 세션 복원 완료');
            } else {
                // 세션 만료
                Utils.removeFromStorage(AppConfig.STORAGE_KEYS.ADMIN_SESSION);
                Logger.info('⏰ 관리자 세션 만료');
            }
        }
    }
    
    /**
     * 로그인 상태 확인 메서드 (네비게이션에서 사용)
     */
    isAdminLoggedIn() {
        return this.isLoggedIn;
    }
    
    /**
     * 관리자 버튼 상태 업데이트
     */
    updateAdminButtonState() {
        const adminBtn = document.getElementById('admin-btn');
        const logoutBtn = document.getElementById('logout-btn');
        
        if (adminBtn) {
            if (this.isLoggedIn) {
                adminBtn.innerHTML = '<span class="icon icon-user-cog"></span> 관리자 모드';
                adminBtn.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                adminBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                adminBtn.style.color = 'white';
            } else {
                adminBtn.innerHTML = '<span class="icon icon-cog"></span> 관리자';
                adminBtn.style.backgroundColor = '';
                adminBtn.style.borderColor = '';
                adminBtn.style.color = '';
            }
        }
        
        // 로그아웃 버튼 표시/숨김
        if (logoutBtn) {
            if (this.isLoggedIn) {
                logoutBtn.classList.remove('hidden');
                logoutBtn.innerHTML = '<span class="icon icon-sign-out"></span> 로그아웃';
                logoutBtn.disabled = false;
            } else {
                logoutBtn.classList.add('hidden');
            }
        }
        
        // 관리자 모드 표시기 업데이트
        this.updateAdminModeIndicator();
        
        // 네비게이션 업데이트 (인라인 컨트롤 표시/숨김)
        if (window.navigationManager) {
            window.navigationManager.updateAdminMode();
        }
    }
    
    /**
     * 로그인 모달 표시
     */
    showLoginModal() {
        const modal = document.getElementById('admin-modal');
        const passwordInput = document.getElementById('admin-password');
        
        if (modal) {
            modal.classList.add('show');
            if (passwordInput) {
                passwordInput.value = '';
                setTimeout(() => passwordInput.focus(), 100);
            }
        }
    }
    
    /**
     * 로그인 모달 숨김
     */
    hideLoginModal() {
        const modal = document.getElementById('admin-modal');
        if (modal) {
            modal.classList.remove('show');
        }
    }
    
    /**
     * 관리자 패널 표시
     */
    showAdminPanel() {
        if (!this.isLoggedIn) {
            this.showLoginModal();
            return;
        }
        
        // 콘텐츠 영역에 관리자 패널 렌더링
        this.renderAdminPanel();
        
        // 네비게이션 선택 해제
        const activeItem = document.querySelector('.tree-item.active');
        if (activeItem) {
            activeItem.classList.remove('active');
        }
        
        // 브레드크럼 업데이트
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = '<span>홈</span><span>관리자 패널</span>';
        }
        
        Logger.info('🛠️ 관리자 패널 표시');
    }
    
    /**
     * 관리자 모드 표시기 업데이트
     */
    updateAdminModeIndicator() {
        // 기존 표시기 제거
        const existingIndicator = document.querySelector('.admin-mode-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }
        
        if (this.isLoggedIn) {
            // 새 표시기 생성
            const indicator = document.createElement('div');
            indicator.className = 'admin-mode-indicator';
            indicator.innerHTML = '<span class="icon icon-cog"></span> 관리자 모드 활성';
            document.body.appendChild(indicator);
        }
    }
    
    /**
     * 인라인 추가 폼 표시
     */
    showInlineAddForm(data) {
        const { type, parentType, parentId } = data;
        
        // 간단한 프롬프트를 사용하여 이름 입력받기
        const name = prompt(`새 ${type === 'category' ? '카테고리' : '프로세스'} 이름을 입력하세요:`);
        
        if (name && name.trim()) {
            if (type === 'category') {
                this.addCategory(name.trim(), parentId);
            } else if (type === 'process') {
                this.addProcess(name.trim(), parentId);
            }
        }
    }
    
    /**
     * 인라인 수정 폼 표시
     */
    showInlineEditForm(data) {
        const { type, id } = data;
        
        let item;
        if (type === 'department') {
            item = dataManager.getDepartmentById(id);
        } else if (type === 'category') {
            item = dataManager.getCategoryById(id);
        } else if (type === 'process') {
            item = dataManager.getProcessById(id);
        }
        
        if (item) {
            const currentName = item.name || item.title;
            const newName = prompt(`${type === 'department' ? '부서' : type === 'category' ? '카테고리' : '프로세스'} 이름을 수정하세요:`, currentName);
            
            if (newName && newName.trim() && newName !== currentName) {
                this.updateItem(type, id, { name: newName.trim(), title: newName.trim() });
            }
        }
    }
    
    /**
     * 인라인 삭제 처리
     */
    handleInlineDelete(data) {
        const { type, id } = data;
        
        if (type === 'department') {
            this.deleteDepartment(id);
        } else if (type === 'category') {
            this.deleteCategory(id);
        } else if (type === 'process') {
            this.deleteProcess(id);
        }
    }
    
    /**
     * 카테고리 추가
     */
    addCategory(name, departmentId) {
        const newCategory = {
            id: `cat_${Date.now()}`,
            name: name,
            departmentId: departmentId
        };
        
        dataManager.addCategory(newCategory);
        Utils.showNotification('카테고리가 추가되었습니다.', 'success');
    }
    
    /**
     * 프로세스 추가
     */
    addProcess(title, categoryId) {
        const newProcess = {
            id: `proc_${Date.now()}`,
            title: title,
            categoryId: categoryId,
            content: '새로 생성된 프로세스입니다. 내용을 편집해 주세요.',
            steps: [],
            legalBasis: '',
            outputs: '',
            references: ''
        };
        
        dataManager.addProcess(newProcess);
        Utils.showNotification('프로세스가 추가되었습니다.', 'success');
    }
    
    /**
     * 아이템 업데이트
     */
    updateItem(type, id, updates) {
        if (type === 'department') {
            dataManager.updateDepartment(id, updates);
        } else if (type === 'category') {
            dataManager.updateCategory(id, updates);
        } else if (type === 'process') {
            dataManager.updateProcess(id, updates);
        }
        
        Utils.showNotification('항목이 수정되었습니다.', 'success');
    }
    
    /**
     * 부서 삭제
     */
    deleteDepartment(id) {
        dataManager.deleteDepartment(id);
        Utils.showNotification('부서가 삭제되었습니다.', 'success');
    }
    
    /**
     * 카테고리 삭제
     */
    deleteCategory(id) {
        dataManager.deleteCategory(id);
        Utils.showNotification('카테고리가 삭제되었습니다.', 'success');
    }
    
    /**
     * 프로세스 삭제
     */
    deleteProcess(id) {
        dataManager.deleteProcess(id);
        Utils.showNotification('프로세스가 삭제되었습니다.', 'success');
    }
    
    /**
     * 관리자 패널 렌더링
     */
    renderAdminPanel() {
        const stats = dataManager.getDataSummary();
        
        const content = `
            <div class="admin-panel fade-in">
                <div class="admin-header">
                    <h2><span class="icon icon-user-cog"></span> 관리자 패널</h2>
                    <div class="admin-actions">
                        <button class="btn-secondary" onclick="adminManager.exportData()">
                            <span class="icon icon-download"></span> 데이터 내보내기
                        </button>
                        <button class="btn-secondary" onclick="adminManager.showImportModal()">
                            <span class="icon icon-upload"></span> 데이터 가져오기
                        </button>
                        <button class="btn-secondary" onclick="adminManager.handleLogout()">
                            <span class="icon icon-sign-out"></span> 로그아웃
                        </button>
                    </div>
                </div>
                
                <div class="admin-stats mb-3">
                    <div class="stats-grid">
                        <div class="stat-card">
                            <span class="icon icon-building"></span>
                            <h3>부서</h3>
                            <span>${stats.departments}</span>
                        </div>
                        <div class="stat-card">
                            <span class="icon icon-list"></span>
                            <h3>카테고리</h3>
                            <span>${stats.categories}</span>
                        </div>
                        <div class="stat-card">
                            <span class="icon icon-file"></span>
                            <h3>프로세스</h3>
                            <span>${stats.processes}</span>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <div class="tab-buttons">
                        <button class="tab-button active" data-tab="departments">
                            <span class="icon icon-building"></span> 부서 관리
                        </button>
                        <button class="tab-button" data-tab="categories">
                            <span class="icon icon-list"></span> 카테고리 관리
                        </button>
                        <button class="tab-button" data-tab="processes">
                            <span class="icon icon-file"></span> 프로세스 관리
                        </button>
                    </div>
                    
                    <div class="tab-content">
                        <div class="tab-pane active" id="departments-tab">
                            ${this.renderDepartmentsTab()}
                        </div>
                        <div class="tab-pane" id="categories-tab">
                            ${this.renderCategoriesTab()}
                        </div>
                        <div class="tab-pane" id="processes-tab">
                            ${this.renderProcessesTab()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const contentContainer = document.getElementById('content-body');
        if (contentContainer) {
            contentContainer.innerHTML = content;
            this.attachAdminEvents();
        }
    }
    
    /**
     * 부서 관리 탭 렌더링
     */
    renderDepartmentsTab() {
        const departments = dataManager.getDepartments();
        
        return `
            <div class="admin-section">
                <div class="section-header">
                    <h3>부서 관리</h3>
                    <button class="btn-primary" onclick="adminManager.showAddModal('department')">
                        <span class="icon icon-plus"></span> 부서 추가
                    </button>
                </div>
                <div class="data-table">
                    ${departments.map(dept => `
                        <div class="table-row">
                            <div class="item-info">
                                <div class="item-title">${Utils.escapeHtml(dept.name)}</div>
                                <div class="item-description">${Utils.escapeHtml(dept.description || '')}</div>
                            </div>
                            <div class="table-actions">
                                <button class="btn-edit" onclick="adminManager.showEditModal('department', '${dept.id}')">
                                    <span class="icon icon-edit"></span>
                                </button>
                                <button class="btn-delete" onclick="adminManager.confirmDelete('department', '${dept.id}', '${Utils.escapeHtml(dept.name)}')">
                                    <span class="icon icon-trash"></span>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 카테고리 관리 탭 렌더링
     */
    renderCategoriesTab() {
        const categories = dataManager.data.categories || [];
        const departments = dataManager.getDepartments();
        
        return `
            <div class="admin-section">
                <div class="section-header">
                    <h3>카테고리 관리</h3>
                    <button class="btn-primary" onclick="adminManager.showAddModal('category')">
                        <span class="icon icon-plus"></span> 카테고리 추가
                    </button>
                </div>
                <div class="data-table">
                    ${categories.map(cat => {
                        const dept = departments.find(d => d.id === cat.departmentId);
                        return `
                            <div class="table-row">
                                <div class="item-info">
                                    <div class="item-title">${Utils.escapeHtml(cat.name)}</div>
                                    <div class="item-description">${Utils.escapeHtml(cat.description || '')}</div>
                                    <div class="item-meta">부서: ${Utils.escapeHtml(dept?.name || '알 수 없음')}</div>
                                </div>
                                <div class="table-actions">
                                    <button class="btn-edit" onclick="adminManager.showEditModal('category', '${cat.id}')">
                                        <span class="icon icon-edit"></span>
                                    </button>
                                    <button class="btn-delete" onclick="adminManager.confirmDelete('category', '${cat.id}', '${Utils.escapeHtml(cat.name)}')">
                                        <span class="icon icon-trash"></span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 프로세스 관리 탭 렌더링
     */
    renderProcessesTab() {
        const processes = dataManager.data.processes || [];
        const categories = dataManager.data.categories || [];
        const departments = dataManager.getDepartments();
        
        return `
            <div class="admin-section">
                <div class="section-header">
                    <h3>프로세스 관리</h3>
                    <button class="btn-primary" onclick="adminManager.showAddModal('process')">
                        <span class="icon icon-plus"></span> 프로세스 추가
                    </button>
                </div>
                <div class="data-table">
                    ${processes.map(proc => {
                        const cat = categories.find(c => c.id === proc.categoryId);
                        const dept = departments.find(d => d.id === proc.departmentId);
                        return `
                            <div class="table-row">
                                <div class="item-info">
                                    <div class="item-title">${Utils.escapeHtml(proc.title)}</div>
                                    <div class="item-description">${Utils.escapeHtml(proc.description || '')}</div>
                                    <div class="item-meta">
                                        ${Utils.escapeHtml(dept?.name || '알 수 없음')} > ${Utils.escapeHtml(cat?.name || '알 수 없음')}
                                    </div>
                                </div>
                                <div class="table-actions">
                                    <button class="btn-edit" onclick="adminManager.showEditModal('process', '${proc.id}')">
                                        <span class="icon icon-edit"></span>
                                    </button>
                                    <button class="btn-delete" onclick="adminManager.confirmDelete('process', '${proc.id}', '${Utils.escapeHtml(proc.title)}')">
                                        <span class="icon icon-trash"></span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * 관리자 이벤트 연결
     */
    attachAdminEvents() {
        // 탭 전환
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }
    
    /**
     * 탭 전환
     */
    switchTab(tabId) {
        // 버튼 활성화 상태 변경
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
        
        // 탭 패널 표시 상태 변경
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        Logger.info(`🗂️ 관리자 탭 전환: ${tabId}`);
    }
    
    /**
     * 추가 모달 표시
     */
    showAddModal(type) {
        this.currentEditItem = { type, id: null, isNew: true };
        this.showEditModal(type, null);
    }
    
    /**
     * 편집 모달 표시
     */
    showEditModal(type, id) {
        // 모달 생성 및 표시 로직
        this.createEditModal(type, id);
    }
    
    /**
     * 편집 모달 생성
     */
    createEditModal(type, id) {
        const isNew = !id;
        let item = null;
        let title = '';
        
        if (!isNew) {
            switch (type) {
                case 'department':
                    item = dataManager.getDepartmentById(id);
                    title = '부서 편집';
                    break;
                case 'category':
                    item = dataManager.getCategoryById(id);
                    title = '카테고리 편집';
                    break;
                case 'process':
                    item = dataManager.getProcessById(id);
                    title = '프로세스 편집';
                    break;
            }
        } else {
            title = type === 'department' ? '부서 추가' : 
                   type === 'category' ? '카테고리 추가' : '프로세스 추가';
        }
        
        const modalHTML = this.generateEditModalHTML(type, item, title, isNew);
        
        // 모달을 body에 추가
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 이벤트 연결
        this.bindEditModalEvents(type, id, isNew);
        
        // 모달 표시
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    /**
     * 편집 모달 HTML 생성
     */
    generateEditModalHTML(type, item, title, isNew) {
        let formFields = '';
        
        switch (type) {
            case 'department':
                formFields = `
                    <div class="form-group">
                        <label for="dept-name">부서명</label>
                        <input type="text" id="dept-name" value="${item ? Utils.escapeHtml(item.name) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="dept-desc">설명</label>
                        <textarea id="dept-desc" rows="3">${item ? Utils.escapeHtml(item.description || '') : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="dept-order">순서</label>
                        <input type="number" id="dept-order" value="${item ? item.order : 1}" min="1" required>
                    </div>
                `;
                break;
                
            case 'category':
                const departments = dataManager.getDepartments();
                formFields = `
                    <div class="form-group">
                        <label for="cat-name">카테고리명</label>
                        <input type="text" id="cat-name" value="${item ? Utils.escapeHtml(item.name) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="cat-dept">부서</label>
                        <select id="cat-dept" required>
                            <option value="">부서를 선택하세요</option>
                            ${departments.map(dept => 
                                `<option value="${dept.id}" ${item && item.departmentId === dept.id ? 'selected' : ''}>
                                    ${Utils.escapeHtml(dept.name)}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cat-desc">설명</label>
                        <textarea id="cat-desc" rows="3">${item ? Utils.escapeHtml(item.description || '') : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="cat-order">순서</label>
                        <input type="number" id="cat-order" value="${item ? item.order : 1}" min="1" required>
                    </div>
                `;
                break;
                
            case 'process':
                const categories = dataManager.data.categories || [];
                const depts = dataManager.getDepartments();
                formFields = `
                    <div class="form-group">
                        <label for="proc-title">프로세스명</label>
                        <input type="text" id="proc-title" value="${item ? Utils.escapeHtml(item.title) : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="proc-dept">부서</label>
                        <select id="proc-dept" required>
                            <option value="">부서를 선택하세요</option>
                            ${depts.map(dept => 
                                `<option value="${dept.id}" ${item && item.departmentId === dept.id ? 'selected' : ''}>
                                    ${Utils.escapeHtml(dept.name)}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="proc-cat">카테고리</label>
                        <select id="proc-cat" required>
                            <option value="">카테고리를 선택하세요</option>
                            ${categories.map(cat => 
                                `<option value="${cat.id}" data-dept="${cat.departmentId}" ${item && item.categoryId === cat.id ? 'selected' : ''}>
                                    ${Utils.escapeHtml(cat.name)}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="proc-desc">설명</label>
                        <textarea id="proc-desc" rows="3">${item ? Utils.escapeHtml(item.description || '') : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="proc-tags">태그 (쉼표로 구분)</label>
                        <input type="text" id="proc-tags" value="${item && item.tags ? item.tags.join(', ') : ''}">
                    </div>
                    <div class="form-group">
                        <label>처리 단계</label>
                        <div id="steps-container">
                            ${item && item.steps ? item.steps.map((step, index) => this.generateStepHTML(step, index)).join('') : this.generateStepHTML(null, 0)}
                        </div>
                        <button type="button" class="btn-secondary" onclick="adminManager.addStep()">
                            <span class="icon icon-plus"></span> 단계 추가
                        </button>
                    </div>
                `;
                break;
        }
        
        return `
            <div class="modal" id="edit-modal">
                <div class="modal-content" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" id="edit-modal-close">
                            <span class="icon icon-times"></span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="edit-form">
                            ${formFields}
                            <div class="form-actions">
                                <button type="submit" class="btn-primary">
                                    <span class="icon icon-check"></span> ${isNew ? '추가' : '저장'}
                                </button>
                                <button type="button" class="btn-secondary" onclick="adminManager.closeEditModal()">
                                    취소
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * 단계 HTML 생성
     */
    generateStepHTML(step, index) {
        return `
            <div class="step-editor" data-step="${index}">
                <div class="step-header">
                    <span class="step-number">${index + 1}</span>
                    <button type="button" class="btn-delete" onclick="adminManager.removeStep(${index})" ${index === 0 ? 'style="display:none"' : ''}>
                        <span class="icon icon-trash"></span>
                    </button>
                </div>
                <div class="form-group">
                    <label>단계명</label>
                    <input type="text" class="step-title" value="${step ? Utils.escapeHtml(step.title) : ''}" required>
                </div>
                <div class="form-group">
                    <label>설명</label>
                    <textarea class="step-description" rows="2">${step ? Utils.escapeHtml(step.description) : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>세부사항</label>
                    <textarea class="step-details" rows="2">${step ? Utils.escapeHtml(step.details || '') : ''}</textarea>
                </div>
            </div>
        `;
    }
    
    /**
     * 편집 모달 이벤트 바인딩
     */
    bindEditModalEvents(type, id, isNew) {
        // 폼 제출
        const form = document.getElementById('edit-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSave(type, id, isNew);
            });
        }
        
        // 모달 닫기
        const closeBtn = document.getElementById('edit-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeEditModal();
            });
        }
        
        // 프로세스 편집 시 부서 변경에 따른 카테고리 필터링
        if (type === 'process') {
            const deptSelect = document.getElementById('proc-dept');
            const catSelect = document.getElementById('proc-cat');
            
            if (deptSelect && catSelect) {
                deptSelect.addEventListener('change', () => {
                    this.filterCategories(deptSelect.value, catSelect);
                });
            }
        }
    }
    
    /**
     * 카테고리 필터링
     */
    filterCategories(departmentId, catSelect) {
        const options = catSelect.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
            } else {
                const optionDeptId = option.dataset.dept;
                option.style.display = (!departmentId || optionDeptId === departmentId) ? 'block' : 'none';
            }
        });
        
        // 현재 선택된 옵션이 숨겨졌으면 초기화
        const selectedOption = catSelect.options[catSelect.selectedIndex];
        if (selectedOption && selectedOption.style.display === 'none') {
            catSelect.selectedIndex = 0;
        }
    }
    
    /**
     * 단계 추가
     */
    addStep() {
        const container = document.getElementById('steps-container');
        if (container) {
            const stepCount = container.children.length;
            const stepHTML = this.generateStepHTML(null, stepCount);
            container.insertAdjacentHTML('beforeend', stepHTML);
        }
    }
    
    /**
     * 단계 제거
     */
    removeStep(index) {
        const stepElement = document.querySelector(`[data-step="${index}"]`);
        if (stepElement) {
            stepElement.remove();
            // 단계 번호 재정렬
            this.reorderSteps();
        }
    }
    
    /**
     * 단계 순서 재정렬
     */
    reorderSteps() {
        const container = document.getElementById('steps-container');
        if (container) {
            Array.from(container.children).forEach((step, index) => {
                step.dataset.step = index;
                const numberSpan = step.querySelector('.step-number');
                if (numberSpan) {
                    numberSpan.textContent = index + 1;
                }
                
                const deleteBtn = step.querySelector('.btn-delete');
                if (deleteBtn) {
                    deleteBtn.style.display = index === 0 ? 'none' : 'block';
                    deleteBtn.onclick = () => this.removeStep(index);
                }
            });
        }
    }
    
    /**
     * 저장 처리
     */
    handleSave(type, id, isNew) {
        try {
            let data = {};
            
            switch (type) {
                case 'department':
                    data = {
                        id: id,
                        name: document.getElementById('dept-name').value.trim(),
                        description: document.getElementById('dept-desc').value.trim(),
                        order: parseInt(document.getElementById('dept-order').value)
                    };
                    break;
                    
                case 'category':
                    data = {
                        id: id,
                        name: document.getElementById('cat-name').value.trim(),
                        departmentId: document.getElementById('cat-dept').value,
                        description: document.getElementById('cat-desc').value.trim(),
                        order: parseInt(document.getElementById('cat-order').value)
                    };
                    break;
                    
                case 'process':
                    // 단계 수집
                    const steps = [];
                    const stepElements = document.querySelectorAll('.step-editor');
                    stepElements.forEach((stepEl, index) => {
                        const title = stepEl.querySelector('.step-title').value.trim();
                        const description = stepEl.querySelector('.step-description').value.trim();
                        const details = stepEl.querySelector('.step-details').value.trim();
                        
                        if (title) {
                            steps.push({
                                stepNumber: index + 1,
                                title,
                                description,
                                details
                            });
                        }
                    });
                    
                    // 태그 처리
                    const tagsInput = document.getElementById('proc-tags').value.trim();
                    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                    
                    data = {
                        id: id,
                        title: document.getElementById('proc-title').value.trim(),
                        departmentId: document.getElementById('proc-dept').value,
                        categoryId: document.getElementById('proc-cat').value,
                        description: document.getElementById('proc-desc').value.trim(),
                        steps: steps,
                        tags: tags
                    };
                    break;
            }
            
            // 유효성 검사
            if (!this.validateData(type, data)) {
                return;
            }
            
            // 저장
            let success = false;
            switch (type) {
                case 'department':
                    success = dataManager.saveDepartment(data);
                    break;
                case 'category':
                    success = dataManager.saveCategory(data);
                    break;
                case 'process':
                    success = dataManager.saveProcess(data);
                    break;
            }
            
            if (success) {
                this.closeEditModal();
                Utils.showNotification(AppConfig.MESSAGES.SUCCESS_DATA_SAVE, 'success');
                Logger.info(`💾 ${type} 저장 완료: ${data.name || data.title}`);
            } else {
                Utils.showNotification('데이터 저장 중 오류가 발생했습니다.', 'error');
            }
            
        } catch (error) {
            Logger.error('데이터 저장 실패:', error);
            Utils.showNotification('데이터 저장 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 데이터 유효성 검사
     */
    validateData(type, data) {
        switch (type) {
            case 'department':
                if (!data.name) {
                    Utils.showNotification('부서명을 입력해주세요.', 'error');
                    return false;
                }
                break;
                
            case 'category':
                if (!data.name) {
                    Utils.showNotification('카테고리명을 입력해주세요.', 'error');
                    return false;
                }
                if (!data.departmentId) {
                    Utils.showNotification('부서를 선택해주세요.', 'error');
                    return false;
                }
                break;
                
            case 'process':
                if (!data.title) {
                    Utils.showNotification('프로세스명을 입력해주세요.', 'error');
                    return false;
                }
                if (!data.departmentId) {
                    Utils.showNotification('부서를 선택해주세요.', 'error');
                    return false;
                }
                if (!data.categoryId) {
                    Utils.showNotification('카테고리를 선택해주세요.', 'error');
                    return false;
                }
                break;
        }
        
        return true;
    }
    
    /**
     * 편집 모달 닫기
     */
    closeEditModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
    
    /**
     * 삭제 확인
     */
    confirmDelete(type, id, name) {
        const typeName = type === 'department' ? '부서' : type === 'category' ? '카테고리' : '프로세스';
        const message = `"${name}" ${typeName}를 삭제하시겠습니까?${type !== 'process' ? '\n관련된 하위 데이터도 함께 삭제됩니다.' : ''}`;
        
        if (Utils.confirm(message)) {
            let success = false;
            
            switch (type) {
                case 'department':
                    success = dataManager.deleteDepartment(id);
                    break;
                case 'category':
                    success = dataManager.deleteCategory(id);
                    break;
                case 'process':
                    success = dataManager.deleteProcess(id);
                    break;
            }
            
            if (success) {
                Utils.showNotification(AppConfig.MESSAGES.SUCCESS_DATA_DELETE, 'success');
                Logger.info(`🗑️ ${type} 삭제 완료: ${name}`);
            } else {
                Utils.showNotification('데이터 삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }
    
    /**
     * 데이터 내보내기
     */
    exportData() {
        try {
            const exportData = dataManager.exportData();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `manual_data_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showNotification('데이터를 성공적으로 내보냈습니다.', 'success');
            Logger.info('📤 데이터 내보내기 완료');
            
        } catch (error) {
            Logger.error('데이터 내보내기 실패:', error);
            Utils.showNotification('데이터 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }
    
    /**
     * 데이터 가져오기 모달 표시
     */
    showImportModal() {
        const modalHTML = `
            <div class="modal" id="import-modal">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3>데이터 가져오기</h3>
                        <button class="modal-close" onclick="adminManager.closeImportModal()">
                            <span class="icon icon-times"></span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="import-options">
                            <p>가져올 데이터 형식을 선택하세요:</p>
                            
                            <div class="option-card" onclick="adminManager.selectImportType('standard')">
                                <span class="icon icon-code"></span>
                                <h4>표준 형식 JSON</h4>
                                <p>기존 시스템에서 내보낸 JSON 파일</p>
                            </div>
                            
                            <div class="option-card" onclick="adminManager.selectImportType('new')">
                                <span class="icon icon-layers"></span>
                                <h4>새 형식 JSON</h4>
                                <p>5단계 계층 구조로 된 JSON 파일</p>
                                <small>1단계(부서) → 2단계(업무) → 3단계(메타정보) → 4단계(프로세스) → 5단계(상세)</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 모달을 body에 추가
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);
        
        // 모달 표시
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }
    
    /**
     * 가져오기 형식 선택
     */
    selectImportType(type) {
        this.closeImportModal();
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.txt';
        input.addEventListener('change', (e) => {
            this.handleImportFile(e.target.files[0], type);
        });
        input.click();
    }
    
    /**
     * 가져오기 모달 닫기
     */
    closeImportModal() {
        const modal = document.getElementById('import-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
    
    /**
     * 가져오기 파일 처리
     */
    handleImportFile(file, type = 'standard') {
        if (!file) return;
        
        Utils.showLoading();
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                let success = false;
                let message = '';
                
                if (type === 'new') {
                    // 새 형식 JSON 처리
                    message = `새 형식 JSON 데이터를 변환하여 가져오시겠습니까?\n\n발견된 데이터:\n- 총 ${importData.length}개 업무\n- 기존 데이터는 모두 삭제됩니다.`;
                    
                    if (Utils.confirm(message)) {
                        success = dataManager.importNewFormatData(importData);
                        if (success) {
                            Utils.showNotification('새 형식 데이터를 성공적으로 변환하여 가져왔습니다.', 'success');
                            Logger.info('📥 새 형식 데이터 가져오기 완료');
                        } else {
                            Utils.showNotification('새 형식 데이터 변환 중 오류가 발생했습니다.', 'error');
                        }
                    }
                } else {
                    // 기존 표준 형식 JSON 처리
                    message = '기존 데이터를 모두 덮어쓰시겠습니까?';
                    
                    if (Utils.confirm(message)) {
                        success = dataManager.importData(importData);
                        if (success) {
                            Utils.showNotification('데이터를 성공적으로 가져왔습니다.', 'success');
                            Logger.info('📥 표준 형식 데이터 가져오기 완료');
                        } else {
                            Utils.showNotification('올바르지 않은 데이터 형식입니다.', 'error');
                        }
                    }
                }
                
                Utils.hideLoading();
                
            } catch (error) {
                Utils.hideLoading();
                Logger.error('데이터 가져오기 실패:', error);
                Utils.showNotification('데이터 파일을 읽는 중 오류가 발생했습니다.', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    /**
     * 관리자 권한 확인
     */
    checkPermission() {
        return this.isLoggedIn;
    }
}

// 관리자 전용 CSS 추가
const adminStyles = `
    .admin-panel {
        max-width: 1200px;
    }
    
    .admin-tabs {
        margin-top: 2rem;
    }
    
    .tab-buttons {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 2rem;
    }
    
    .tab-button {
        padding: 1rem 1.5rem;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
        transition: var(--transition);
    }
    
    .tab-button.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
    }
    
    .tab-button:hover {
        color: var(--text-primary);
    }
    
    .tab-pane {
        display: none;
    }
    
    .tab-pane.active {
        display: block;
    }
    
    .admin-section {
        margin-bottom: 2rem;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .section-header h3 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
    }
    
    .item-info {
        flex: 1;
    }
    
    .item-title {
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 0.25rem;
    }
    
    .item-description {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
        margin-bottom: 0.25rem;
    }
    
    .item-meta {
        color: var(--text-muted);
        font-size: var(--font-size-sm);
    }
    
    .step-editor {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 1rem;
        margin-bottom: 1rem;
        background: var(--surface-color);
    }
    
    .step-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    
    .form-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .import-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .option-card {
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 1.5rem;
        cursor: pointer;
        transition: var(--transition);
        text-align: center;
    }
    
    .option-card:hover {
        border-color: var(--primary-color);
        background: var(--surface-color);
    }
    
    .option-card i {
        font-size: 2rem;
        color: var(--primary-color);
        margin-bottom: 0.75rem;
        display: block;
    }
    
    .option-card h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
        margin-bottom: 0.5rem;
    }
    
    .option-card p {
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .option-card small {
        color: var(--text-muted);
        font-size: var(--font-size-sm);
        display: block;
        margin-top: 0.5rem;
    }
`;

const adminStyleSheet = document.createElement('style');
adminStyleSheet.textContent = adminStyles;
document.head.appendChild(adminStyleSheet);

// 전역 인스턴스 생성
window.adminManager = new AdminManager();