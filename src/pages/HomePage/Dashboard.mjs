import { getProjects, getProjectMetrics } from '../../api/projectapi.mjs';
import {
    getProjectCategories,
    getCategorySubcategories,
    createProjectCategory,
    createCategorySubcategory
} from '../../api/categoryapi.mjs';
import { getBugReport, createBugreport } from '../../api/bagreportapi.mjs';
import { createBugReportModal } from '../../entities/BugReport/BugReport.mjs';
import { getTestKey, createTestKey } from '../../api/testkeysapi.mjs';
import { createTestKeyModal } from '../../entities/test_keys/TestKeys.mjs';
import { buildProjectCategoryRoute, setCurrentRoute } from '../../app/routes/routes.mjs';
import { renderProjectsList } from './ProjectSidebar.mjs';

// ------------------------------------------------------------
// Storage helpers
// ------------------------------------------------------------
const getCategoryStorageKey = (projectId) => `activeCategoryId_${projectId}`;
const getSubcategoryStorageKey = (projectId, categoryId) => `activeSubcategoryId_${projectId}_${categoryId}`;
const getSubcategoryViewStorageKey = (projectId, categoryId, subcategoryId) => `activeSubcategoryView_${projectId}_${categoryId}_${subcategoryId}`;
const getProjectCategoriesStorageKey = (projectId) => `project_categories_${projectId}`;
const getProjectSubcategoriesStorageKey = (projectId, categoryId) => `project_subcategories_${projectId}_${categoryId}`;

const readJsonCache = (key, fallback = []) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) ?? fallback;
    } catch (error) {
        return fallback;
    }
};

const writeJsonCache = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        // Ignore storage errors so the UI continues working.
    }
};

const normalizeItems = (items, keyName = 'id', nameKey = 'name') => {
    if (!Array.isArray(items)) return [];

    return items
        .map((item) => ({
            id: Number(item?.[keyName]),
            name: String(item?.[nameKey] || '')
        }))
        .filter((item) => item.id && item.name);
};

const saveSelectedCategory = (projectId, categoryId) => {
    if (!projectId || !categoryId) return;
    localStorage.setItem(getCategoryStorageKey(projectId), String(categoryId));
};

const saveSelectedSubcategory = (projectId, categoryId, subcategoryId) => {
    if (!projectId || !categoryId || !subcategoryId) return;
    localStorage.setItem(getSubcategoryStorageKey(projectId, categoryId), String(subcategoryId));
};

const saveProjectCategories = (projectId, categories = []) => {
    if (!projectId) return [];

    const normalized = normalizeItems(categories);
    writeJsonCache(getProjectCategoriesStorageKey(projectId), normalized);
    return normalized;
};

const saveProjectSubcategories = (projectId, categoryId, subcategories = []) => {
    if (!projectId || !categoryId) return [];

    const normalized = normalizeItems(subcategories);
    writeJsonCache(getProjectSubcategoriesStorageKey(projectId, categoryId), normalized);
    return normalized;
};

const readProjectCategoriesFromStorage = (projectId) => {
    const cached = readJsonCache(getProjectCategoriesStorageKey(projectId), []);
    return Array.isArray(cached) ? cached : [];
};

const readSubcategoriesFromStorage = (projectId, categoryId) => {
    const cached = readJsonCache(getProjectSubcategoriesStorageKey(projectId, categoryId), []);
    return Array.isArray(cached) ? cached : [];
};

const createEntityId = (items = []) => {
    const numericIds = items
        .map((item) => Number(item?.id))
        .filter((value) => Number.isFinite(value) && value > 0);

    return numericIds.length > 0 ? Math.max(...numericIds) + 1 : Date.now();
};

const addProjectCategory = (projectId, categoryName) => {
    if (!projectId) return null;

    const trimmedName = String(categoryName || '').trim();
    if (!trimmedName) return null;

    const categories = readProjectCategoriesFromStorage(projectId);
    const category = {
        id: createEntityId(categories),
        name: trimmedName
    };

    const nextCategories = [...categories, category];
    saveProjectCategories(projectId, nextCategories);
    saveSelectedCategory(projectId, category.id);
    return category;
};

const addProjectSubcategory = (projectId, categoryId, subcategoryName) => {
    if (!projectId || !categoryId) return null;

    const trimmedName = String(subcategoryName || '').trim();
    if (!trimmedName) return null;

    const subcategories = readSubcategoriesFromStorage(projectId, categoryId);
    const subcategory = {
        id: createEntityId(subcategories),
        name: trimmedName
    };

    const nextSubcategories = [...subcategories, subcategory];
    saveProjectSubcategories(projectId, categoryId, nextSubcategories);
    saveSelectedSubcategory(projectId, categoryId, subcategory.id);
    return subcategory;
};

// ------------------------------------------------------------
// Loaders for project hierarchy
// ------------------------------------------------------------
const loadProjectCategories = async (projectId, forceRefresh = false) => {
    if (!projectId) return [];

    const cachedCategories = readProjectCategoriesFromStorage(projectId);

    if (!forceRefresh && cachedCategories.length > 0) {
        return cachedCategories;
    }

    const categories = await getProjectCategories(projectId);
    const normalizedCategories = saveProjectCategories(projectId, categories);
    return normalizedCategories;
};

const loadSubcategoriesForCategory = async (projectId, categoryId, forceRefresh = false) => {
    if (!projectId || !categoryId) return [];

    if (!forceRefresh) {
        const cachedSubcategories = readSubcategoriesFromStorage(projectId, categoryId);
        if (cachedSubcategories.length > 0) {
            return cachedSubcategories;
        }
    }

    const subcategories = await getCategorySubcategories(projectId, categoryId);
    const normalizedSubcategories = saveProjectSubcategories(projectId, categoryId, subcategories);
    return normalizedSubcategories;
};

const buildProjectHierarchy = async (projectId) => {
    const categories = await loadProjectCategories(projectId);

    const storedCategoryId = Number(localStorage.getItem(getCategoryStorageKey(projectId)));
    const activeCategoryId = Number.isFinite(storedCategoryId) && storedCategoryId > 0
        ? storedCategoryId
        : (Number(categories[0]?.id) > 0 ? Number(categories[0].id) : null);

    const activeCategory =
        activeCategoryId !== null
            ? categories.find((category) => Number(category.id) === Number(activeCategoryId)) || categories[0] || null
            : categories[0] || null;

    const subcategories = activeCategory
        ? await loadSubcategoriesForCategory(projectId, activeCategory.id)
        : [];

    let activeSubcategoryId = activeCategory
        ? localStorage.getItem(getSubcategoryStorageKey(projectId, activeCategory.id))
        : null;

    if (
        activeCategory &&
        (!activeSubcategoryId || Number(activeSubcategoryId) <= 0 || !subcategories.some((subcategory) => Number(subcategory.id) === Number(activeSubcategoryId))) &&
        subcategories.length > 0
    ) {
        activeSubcategoryId = String(subcategories[0].id);
        saveSelectedSubcategory(projectId, activeCategory.id, activeSubcategoryId);
    }

    const activeSubcategory = activeCategory && activeSubcategoryId
        ? subcategories.find((subcategory) => Number(subcategory.id) === Number(activeSubcategoryId)) || null
        : null;

    return { categories, activeCategory, subcategories, activeSubcategory };
};

// ------------------------------------------------------------
// Rendering helpers
// ------------------------------------------------------------
const setBreadcrumb = (parts) => {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = parts.join(' / ');
    }
};

const getSubcategorySectionTitle = (view) => {
    if (view === 'testcases') return 'Test Cases';
    if (view === 'bugreports') return 'Bug Reports';
    return 'Select section';
};

const getSubcategoryEmptyMessage = (view) => {
    if (view === 'testcases') return 'No test cases for this subcategory.';
    if (view === 'bugreports') return 'No bug reports for this subcategory.';
    return 'Choose Bug Reports or Test Cases.';
};

const renderProjectCategories = async (projectId) => {
    const { activeCategory, subcategories, activeSubcategory } = await buildProjectHierarchy(projectId);
    const activeView = activeSubcategory && activeCategory
        ? localStorage.getItem(getSubcategoryViewStorageKey(projectId, activeCategory.id, activeSubcategory.id))
        : null;

    return `
        <div class="categories-panel">
            <div class="category-actions">
                <button
                    type="button"
                    class="btn-primary category-action-btn"
                    data-action="create-category"
                    data-project-id="${projectId}"
                >
                    Add category
                </button>
                <button
                    type="button"
                    class="btn-secondary category-action-btn"
                    data-action="create-subcategory"
                    data-project-id="${projectId}"
                    data-category-id="${activeCategory?.id || ''}"
                    ${activeCategory ? '' : 'disabled'}
                >
                    Add subcategory
                </button>
            </div>
            ${activeCategory ? `
                <div class="subcategory-panel">
                    <div class="category-row">
                        <h4 class="subcategories-title">Subcategories</h4>
                        <div class="subcategory-list">
                            ${subcategories.length > 0 ? subcategories.map((subcategory) => {
                                const isSelected = Number(activeSubcategory?.id) === Number(subcategory.id);
                                const isActiveView = activeView && isSelected;

                                return `
                                    <div class="subcategory-node">
                                        <div
                                            class="subcategory-item ${isSelected ? 'active' : ''}"
                                            data-subcategory-id="${subcategory.id}"
                                            data-category-id="${activeCategory.id}"
                                            data-project-id="${projectId}"
                                        >
                                            ${subcategory.name || 'Unnamed subcategory'}
                                        </div>
                                        <div class="subcategory-children ${isSelected ? 'expanded' : ''}">
                                            <button
                                                type="button"
                                                class="subcategory-folder ${activeView === 'bugreports' && isSelected ? 'active' : ''}"
                                                data-subcategory-view="bugreports"
                                                data-project-id="${projectId}"
                                                data-category-id="${activeCategory.id}"
                                                data-subcategory-id="${subcategory.id}"
                                                onclick="window.openSubcategoryView && window.openSubcategoryView(this);"
                                            >
                                                Bug Reports
                                            </button>
                                            <button
                                                type="button"
                                                class="subcategory-folder ${activeView === 'testcases' && isSelected ? 'active' : ''}"
                                                data-subcategory-view="testcases"
                                                data-project-id="${projectId}"
                                                data-category-id="${activeCategory.id}"
                                                data-subcategory-id="${subcategory.id}"
                                                onclick="window.openSubcategoryView && window.openSubcategoryView(this);"
                                            >
                                                Test Cases
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<div class="main-empty">No subcategories available.</div>'}
                        </div>
                    </div>
                </div>
            ` : '<div class="main-empty">Select a category from the tree.</div>'}
        </div>
    `;
};

let mainContainer = null;
const dashboardContext = {
    state: null,
    sidebar: null,
    projects: []
};

const renderEntityModal = ({ title, fieldLabel, submitLabel, onSubmit }) => {
    const modalId = 'categoryEntityModal';
    if (document.getElementById(modalId)) return;

    document.body.insertAdjacentHTML('beforeend', `
        <div id="${modalId}" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button type="button" class="modal-close" data-close-modal="true">×</button>
                </div>
                <div class="modal-body">
                    <form id="entityForm">
                        <div class="form-group">
                            <label for="entityName">${fieldLabel}</label>
                            <input id="entityName" type="text" name="name" required placeholder="Enter name" />
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn-primary">${submitLabel}</button>
                            <button type="button" class="btn-secondary" data-close-modal="true">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `);

    const modal = document.getElementById(modalId);
    const form = document.getElementById('entityForm');
    const closeModal = () => {
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });

    modal.querySelectorAll('[data-close-modal="true"]').forEach((button) => {
        button.addEventListener('click', closeModal);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        if (!name) return;

        await onSubmit(name, closeModal);
    });
};

const handleSubcategoryFolderClick = async (folder) => {
    const folderProjectId = folder.dataset.projectId;
    const folderCategoryId = folder.dataset.categoryId;
    const folderSubcategoryId = folder.dataset.subcategoryId;
    const folderView = folder.dataset.subcategoryView;

    if (!folderProjectId || !folderCategoryId || !folderSubcategoryId || !folderView) return;

    const project = dashboardContext.projects.find((item) => Number(item.id) === Number(folderProjectId));
    const category = { id: Number(folderCategoryId), name: 'Selected category' };
    const subcategory = { id: Number(folderSubcategoryId), name: 'Selected subcategory' };

    localStorage.setItem(
        getSubcategoryViewStorageKey(folderProjectId, folderCategoryId, folderSubcategoryId),
        folderView
    );

    if (project) {
        await renderSubcategorySection(project, category, subcategory, folderView, dashboardContext.sidebar, dashboardContext.projects, dashboardContext.state);
        return;
    }

    await showProjectMetrics(folderProjectId);
};

window.openSubcategoryView = async function openSubcategoryView(folder) {
    if (!folder) return;
    await handleSubcategoryFolderClick(folder);
};

const bindSubcategoryFolderActions = () => {
    if (!mainContainer) return;

    mainContainer.querySelectorAll('.subcategory-folder').forEach((folder) => {
        folder.onclick = async () => {
            await handleSubcategoryFolderClick(folder);
        };
    });
};

const showProjectMetrics = async (projectId) => {
    if (!mainContainer) return;

    mainContainer.innerHTML = '<div class="main-loading">Loading...</div>';

    try {
        const metrics = await getProjectMetrics(projectId);
        const categoriesMarkup = await renderProjectCategories(projectId);

        mainContainer.innerHTML = `
            <div class="metrics">
                <h2 class="metrics-title">${metrics.project.project_name}</h2>
            </div>
            ${categoriesMarkup}
        `;

        bindSubcategoryFolderActions();

        const createCategoryButton = mainContainer.querySelector('[data-action="create-category"]');
        if (createCategoryButton) {
            createCategoryButton.addEventListener('click', async () => {
                const projectId = createCategoryButton.dataset.projectId;
                if (!projectId) return;

                renderEntityModal({
                    title: 'Add category',
                    fieldLabel: 'Category name',
                    submitLabel: 'Create category',
                    onSubmit: async (name, closeModal) => {
                        const response = await createProjectCategory(projectId, name);
                        if (!response) {
                            alert('Failed to create category');
                            return;
                        }

                        const currentCategory = response?.category || response?.data || response;
                        const categoryName = currentCategory?.name || name;
                        const categoryId = currentCategory?.id ?? createEntityId(readProjectCategoriesFromStorage(projectId));

                        const cachedCategories = readProjectCategoriesFromStorage(projectId);
                        const nextCategories = [...cachedCategories.filter((item) => Number(item.id) !== Number(categoryId)), {
                            id: Number(categoryId),
                            name: String(categoryName)
                        }];
                        saveProjectCategories(projectId, nextCategories);
                        saveSelectedCategory(projectId, categoryId);

                        closeModal();
                        renderProjectsList(
                            dashboardContext.sidebar,
                            dashboardContext.projects,
                            dashboardContext.state?.activeProjectId,
                            dashboardContext.state,
                            createProjectHandlers(dashboardContext.projects, dashboardContext.state, dashboardContext.sidebar)
                        );
                        await showProjectMetrics(projectId);
                    }
                });
            });
        }

        const createSubcategoryButton = mainContainer.querySelector('[data-action="create-subcategory"]');
        if (createSubcategoryButton) {
            createSubcategoryButton.addEventListener('click', async () => {
                const projectId = createSubcategoryButton.dataset.projectId;
                const stateCategoryId = dashboardContext.state?.activeCategoryId ?? Number(localStorage.getItem(getCategoryStorageKey(projectId)) || 0);
                const categoryId = stateCategoryId > 0 ? String(stateCategoryId) : createSubcategoryButton.dataset.categoryId;

                if (!projectId || !categoryId) return;

                saveSelectedCategory(projectId, Number(categoryId));
                if (dashboardContext.state) dashboardContext.state.activeCategoryId = Number(categoryId);

                renderEntityModal({
                    title: 'Add subcategory',
                    fieldLabel: 'Subcategory name',
                    submitLabel: 'Create subcategory',
                    onSubmit: async (name, closeModal) => {
                        const response = await createCategorySubcategory(categoryId, name);
                        if (!response) {
                            alert('Failed to create subcategory');
                            return;
                        }

                        const currentSubcategory = response?.subcategory || response?.data || response;
                        const subcategoryName = currentSubcategory?.name || name;
                        const subcategoryId = currentSubcategory?.id ?? createEntityId(readSubcategoriesFromStorage(projectId, categoryId));

                        const cachedSubcategories = readSubcategoriesFromStorage(projectId, categoryId);
                        const nextSubcategories = [...cachedSubcategories.filter((item) => Number(item.id) !== Number(subcategoryId)), {
                            id: Number(subcategoryId),
                            name: String(subcategoryName)
                        }];
                        saveProjectSubcategories(projectId, categoryId, nextSubcategories);
                        saveSelectedSubcategory(projectId, categoryId, subcategoryId);
                        if (dashboardContext.state) dashboardContext.state.activeSubcategoryId = Number(subcategoryId);

                        closeModal();
                        renderProjectsList(
                            dashboardContext.sidebar,
                            dashboardContext.projects,
                            dashboardContext.state?.activeProjectId,
                            dashboardContext.state,
                            createProjectHandlers(dashboardContext.projects, dashboardContext.state, dashboardContext.sidebar)
                        );
                        await showProjectMetrics(projectId);
                    }
                });
            });
        }
    } catch (error) {
        mainContainer.innerHTML = '<div class="main-error">Failed to load metrics</div>';
    }
};

// ------------------------------------------------------------
// User actions / handlers
// ------------------------------------------------------------
const selectProject = async (projects, state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    state.activeCategoryId = null;
    state.activeSubcategoryId = null;
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Categories']);

    const categories = await loadProjectCategories(project.id, true);
    if (categories.length > 0) {
        const firstCategoryId = Number(categories[0].id);
        saveSelectedCategory(project.id, firstCategoryId);
        state.activeCategoryId = firstCategoryId;
    }

    await showProjectMetrics(project.id);
};

const selectCategory = async (state, project, category) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    state.activeCategoryId = Number(category?.id) || null;
    state.activeSubcategoryId = null;
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, category?.name || 'Categories']);

    if (project?.id && category?.id) {
        saveSelectedCategory(project.id, category.id);

        const subcategories = await loadSubcategoriesForCategory(project.id, category.id, true);
        if (Array.isArray(subcategories) && subcategories.length > 0) {
            const firstSubcategoryId = subcategories[0]?.id;
            if (firstSubcategoryId) {
                saveSelectedSubcategory(project.id, category.id, firstSubcategoryId);
                state.activeSubcategoryId = Number(firstSubcategoryId);
            }
        }
    }
};

const renderSubcategorySection = async (project, category, subcategory, view, sidebar, projects, state) => {
    if (!project?.id || !category?.id || !subcategory?.id || !view) return;

    saveSelectedCategory(project.id, category.id);
    saveSelectedSubcategory(project.id, category.id, subcategory.id);
    localStorage.setItem(getSubcategoryViewStorageKey(project.id, category.id, subcategory.id), view);

    const selectedSubcategory = {
        id: Number(subcategory.id),
        name: String(subcategory.name || 'Selected subcategory')
    };

    try {
        const items = view === 'testcases'
            ? await getTestKey(project.id, null, subcategory.id, category.id)
            : await getBugReport(project.id, null, subcategory.id, category.id);

        const listItems = Array.isArray(items) ? items : [];

        mainContainer.innerHTML = `
            <div class="metrics">
                <h2 class="metrics-title">${selectedSubcategory.name}</h2>
            </div>
            <div class="subcategory-content">
                <div class="subcategory-actions">
                    ${view === 'bugreports' ? `<button id="openCreateBugReport" class="btn-primary">Create Bug Report</button>` : ''}
                    ${view === 'testcases' ? `<button id="openCreateTestCase" class="btn-primary">Create Test Case</button>` : ''}
                </div>
                <div class="subcategory-section">
                    <h5>${getSubcategorySectionTitle(view)}</h5>
                    <div class="subcategory-items-list">
                        ${listItems.length > 0 ? listItems.map((item) => `
                            <div
                                class="subcategory-item-entry ${view === 'testcases' ? 'tc-entry' : 'bug-entry'}"
                                data-test-case-id="${item.id}"
                                data-bugreport-id="${item.id}"
                            >
                                ${view === 'testcases'
                                    ? (item.name || `Test case #${item.id}`)
                                    : (item.title || item.name || `Ticket #${item.id}`)}
                            </div>
                        `).join('') : `<div class="main-empty">${getSubcategoryEmptyMessage(view)}</div>`}
                    </div>
                </div>
            </div>
        `;

        mainContainer.querySelectorAll('.subcategory-item-entry').forEach((entry) => {
            entry.addEventListener('click', () => {
                const bugreportId = entry.dataset.bugreportId;
                const testCaseId = entry.dataset.testCaseId;

                if (view === 'bugreports' && project.id && bugreportId) {
                    const url = `/bugreport.html?projectId=${encodeURIComponent(project.id)}&tickets=${encodeURIComponent(bugreportId)}`;
                    window.open(url, '_blank');
                    return;
                }

                if (view === 'testcases' && project.id && testCaseId) {
                    const url = `/test-case.html?projectId=${encodeURIComponent(project.id)}&categoryId=${encodeURIComponent(category.id)}&subcategoryId=${encodeURIComponent(subcategory.id)}&testCaseId=${encodeURIComponent(testCaseId)}`;
                    window.open(url, '_blank');
                }
            });
        });

        if (view === 'bugreports') {
            const createBtn = mainContainer.querySelector('#openCreateBugReport');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    if (document.getElementById('bugReportModal')) return;
                    document.body.insertAdjacentHTML('beforeend', createBugReportModal());

                    const modal = document.getElementById('bugReportModal');
                    const closeBtn = document.getElementById('closeBugReportModal');
                    const cancelBtn = document.getElementById('cancelBugReportModal');
                    const form = document.getElementById('bugReportForm');

                    const closeModal = () => {
                        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
                    };

                    if (closeBtn) closeBtn.addEventListener('click', closeModal);
                    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

                    if (form) {
                        form.addEventListener('submit', async (e) => {
                            e.preventDefault();

                            const payload = {
                                projectId: project.id,
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                userId: localStorage.getItem('userId') || '1',
                                title: (document.getElementById('bugReportTitle') || {}).value || '',
                                priority: (document.getElementById('bugReportPriority') || {}).value || 'Medium',
                                severity: (document.getElementById('bugReportSeverity') || {}).value || 'Normal',
                                environment: (document.getElementById('bugReportEnvironment') || {}).value || '',
                                steps: (document.getElementById('bugReportSteps') || {}).value || '',
                                expected_result: (document.getElementById('bugReportExpected') || {}).value || '',
                                actual_result: (document.getElementById('bugReportActual') || {}).value || '',
                                attachments: (document.getElementById('bugReportAttachments') || {}).value || ''
                            };

                            try {
                                const res = await createBugreport(payload);
                                if (res) {
                                    closeModal();
                                    const updated = await getBugReport(project.id, null, subcategory.id, category.id);
                                    const listEl = mainContainer.querySelector('.subcategory-items-list');
                                    if (listEl) {
                                        listEl.innerHTML = Array.isArray(updated) && updated.length > 0 ? updated.map((item) => `
                                            <div class="subcategory-item-entry bug-entry" data-bugreport-id="${item.id}">${item.title || item.name || `Ticket #${item.id}`}</div>
                                        `).join('') : `<div class="main-empty">${getSubcategoryEmptyMessage(view)}</div>`;
                                        mainContainer.querySelectorAll('.subcategory-item-entry').forEach((entry) => {
                                            entry.addEventListener('click', () => {
                                                const bugreportId = entry.dataset.bugreportId;
                                                if (view === 'bugreports' && project.id && bugreportId) {
                                                    const url = `/bugreport.html?projectId=${encodeURIComponent(project.id)}&tickets=${encodeURIComponent(bugreportId)}`;
                                                    window.open(url, '_blank');
                                                }
                                            });
                                        });
                                    }
                                }
                            } catch (err) {
                                console.error('Error creating bug report', err);
                            }
                        });
                    }
                });
            }
        }

        if (view === 'testcases') {
            const createBtn = mainContainer.querySelector('#openCreateTestCase');
            if (createBtn) {
                createBtn.addEventListener('click', () => {
                    if (document.getElementById('testKeyModal')) return;
                    document.body.insertAdjacentHTML('beforeend', createTestKeyModal());

                    const modal = document.getElementById('testKeyModal');
                    const closeBtn = document.getElementById('closeModal');
                    const cancelBtn = document.getElementById('cancelModal');
                    const form = document.getElementById('testKeyForm');

                    const closeModal = () => {
                        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
                    };

                    if (closeBtn) closeBtn.addEventListener('click', closeModal);
                    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
                    if (modal) {
                        modal.addEventListener('click', (e) => {
                            if (e.target === modal) closeModal();
                        });
                    }

                    if (form) {
                        form.addEventListener('submit', async (e) => {
                            e.preventDefault();

                            const formData = new FormData(form);
                            const payload = {
                                projectId: project.id,
                                categoryId: category.id,
                                subcategoryId: subcategory.id,
                                userId: localStorage.getItem('userId') || '1',
                                Date: formData.get('Date') || new Date().toISOString().split('T')[0],
                                Name: formData.get('Name') || '',
                                Module: formData.get('Module') || '',
                                Precondition: formData.get('Precondition') || '',
                                Steps: formData.get('Steps') || '',
                                ExpectationRes: formData.get('ExpectationRes') || '',
                                ActualRes: formData.get('ActualRes') || '',
                                Comment: formData.get('Comment') || '',
                                Status: formData.get('Status') || 'New'
                            };

                            try {
                                const res = await createTestKey(payload);
                                if (res) {
                                    closeModal();
                                    const updated = await getTestKey(project.id, null, subcategory.id, category.id);
                                    const listEl = mainContainer.querySelector('.subcategory-items-list');
                                    if (listEl) {
                                        listEl.innerHTML = Array.isArray(updated) && updated.length > 0 ? updated.map((item) => `
                                            <div class="subcategory-item-entry tc-entry" data-test-case-id="${item.id}">${item.name || `Test case #${item.id}`}</div>
                                        `).join('') : `<div class="main-empty">${getSubcategoryEmptyMessage(view)}</div>`;
                                        mainContainer.querySelectorAll('.subcategory-item-entry').forEach((entry) => {
                                            entry.addEventListener('click', () => {
                                                const testCaseId = entry.dataset.testCaseId;
                                                if (view === 'testcases' && project.id && testCaseId) {
                                                    const url = `/test-case.html?projectId=${encodeURIComponent(project.id)}&categoryId=${encodeURIComponent(category.id)}&subcategoryId=${encodeURIComponent(subcategory.id)}&testCaseId=${encodeURIComponent(testCaseId)}`;
                                                    window.open(url, '_blank');
                                                }
                                            });
                                        });
                                    }
                                }
                            } catch (err) {
                                console.error('Error creating test case', err);
                            }
                        });
                    }
                });
            }
        }
    } catch (error) {
        mainContainer.innerHTML = `
            <div class="metrics">
                <h2 class="metrics-title">${selectedSubcategory.name}</h2>
            </div>
            <div class="subcategory-content">
                <div class="subcategory-actions">
                    ${view === 'bugreports' ? `<button id="openCreateBugReport" class="btn-primary">Create Bug Report</button>` : ''}
                    ${view === 'testcases' ? `<button id="openCreateTestCase" class="btn-primary">Create Test Case</button>` : ''}
                </div>
                <div class="subcategory-section">
                    <h5>${getSubcategorySectionTitle(view)}</h5>
                    <div class="main-error">Failed to load ${view === 'testcases' ? 'test cases' : 'bug reports'}.</div>
                </div>
            </div>
        `;
    }

    if (sidebar && projects && state) {
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    }
};

const createProjectHandlers = (projects, state, sidebar) => ({
    onProjectSelect: async (project) => {
        await selectProject(projects, state, project);
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    },
    onCategoriesSelect: async (project) => {
        state.activeProjectId = project.id;
        state.activeProjectName = project.name;
        state.activeSection = 'categories';
        localStorage.setItem('activeProjectId', project.id);
        setBreadcrumb(['Jura', project.name, 'Categories']);
        await showProjectMetrics(project.id);
    },
    onCategorySelect: async (project, category) => {
        await selectCategory(state, project, category);
        await showProjectMetrics(project.id);
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    },
    onSubcategorySelect: async (project, category, subcategory) => {
        if (!project?.id || !category?.id || !subcategory?.id) return;

        saveSelectedCategory(project.id, category.id);
        saveSelectedSubcategory(project.id, category.id, subcategory.id);
        localStorage.setItem(getSubcategoryViewStorageKey(project.id, category.id, subcategory.id), 'none');

        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    },
    onSubcategorySectionSelect: async (project, category, subcategory, view) => {
        if (!project?.id || !category?.id || !subcategory?.id || !view) return;
        await renderSubcategorySection(project, category, subcategory, view, sidebar, projects, state);
    }
});

// ------------------------------------------------------------
// Dashboard initialization
// ------------------------------------------------------------
export const initDashboard = async () => {
    const sidebar = document.getElementById('dashboard-sidebar');
    const main = document.getElementById('dashboard-main');

    if (!sidebar || !main) return;

    const mainContent = document.getElementById('main-content');
    mainContainer = mainContent || main;

    const state = {
        expanded: {},
        activeProjectId: null,
        activeProjectName: null,
        activeSection: null,
        activeCategoryId: null,
        activeSubcategoryId: null,
    };

    dashboardContext.state = state;
    dashboardContext.sidebar = sidebar;

    sidebar.innerHTML = '<div class="sidebar-loading">Loading projects...</div>';

    try {
        const projects = await getProjects();
        dashboardContext.projects = projects;

        projects.forEach((project) => {
            state.expanded[project.id] = false;
        });

        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));

        if (projects.length > 0) {
            await selectProject(projects, state, projects[0]);
            renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
        } else {
            sidebar.innerHTML = '<div class="sidebar-empty">No projects found.</div>';
            if (mainContainer) {
                mainContainer.innerHTML = '<div class="main-empty">No project selected.</div>';
            }
        }
    } catch (error) {
        sidebar.innerHTML = '<div class="sidebar-error">Failed to load projects.</div>';
        if (mainContainer) {
            mainContainer.innerHTML = '<div class="main-error">Cannot load data.</div>';
        }
    }
};
