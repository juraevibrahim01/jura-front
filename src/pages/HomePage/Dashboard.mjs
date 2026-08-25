import { getProjects, getProjectMetrics } from '../../api/projectapi.mjs';
import { getProjectCategories, getCategorySubcategories } from '../../api/categoryapi.mjs';
import { getBugReport } from '../../api/bagreportapi.mjs';
import { getTestKey } from '../../api/testkeysapi.mjs';
import { buildProjectCategoryRoute, buildProjectSubcategoryRoute, setCurrentRoute } from '../../app/routes/routes.mjs';
import { renderProjectsList } from './ProjectSidebar.mjs';

const getCategoryStorageKey = (projectId) => `activeCategoryId_${projectId}`;
const getSubcategoryStorageKey = (projectId, categoryId) => `activeSubcategoryId_${projectId}_${categoryId}`;
const getSubcategoryViewStorageKey = (projectId, categoryId, subcategoryId) => `activeSubcategoryView_${projectId}_${categoryId}_${subcategoryId}`;
const getProjectCategoriesStorageKey = (projectId) => `project_categories_${projectId}`;

const saveProjectCategoryId = (projectId, categoryId) => {
    if (!projectId || !categoryId) return;
    localStorage.setItem(getCategoryStorageKey(projectId), String(categoryId));
};

const saveProjectSubcategoryId = (projectId, categoryId, subcategoryId) => {
    if (!projectId || !categoryId || !subcategoryId) return;
    localStorage.setItem(getSubcategoryStorageKey(projectId, categoryId), String(subcategoryId));
};

const saveProjectCategories = (projectId, categories = []) => {
    if (!projectId) return;
    const normalized = Array.isArray(categories)
        ? categories
            .map((category) => ({
                id: Number(category?.id),
                name: String(category?.name || '')
            }))
            .filter((category) => category.id && category.name)
        : [];

    localStorage.setItem(getProjectCategoriesStorageKey(projectId), JSON.stringify(normalized));
    return normalized;
};

const getProjectSubcategoriesStorageKey = (projectId, categoryId) => `project_subcategories_${projectId}_${categoryId}`;

const readSubcategoriesFromStorage = (projectId, categoryId) => {
    try {
        const raw = localStorage.getItem(getProjectSubcategoriesStorageKey(projectId, categoryId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
};

const loadSubcategoriesForCategory = async (projectId, categoryId, forceRefresh = false) => {
    if (!projectId || !categoryId) return [];

    if (!forceRefresh) {
        const cached = readSubcategoriesFromStorage(projectId, categoryId);
        if (cached.length > 0) {
            return cached;
        }
    }

    const subcategories = await getCategorySubcategories(projectId, categoryId);
    const normalized = Array.isArray(subcategories)
        ? subcategories.map((subcategory) => ({
            id: Number(subcategory?.id),
            name: String(subcategory?.name || '')
        })).filter((subcategory) => subcategory.id && subcategory.name)
        : [];

    localStorage.setItem(
        getProjectSubcategoriesStorageKey(projectId, categoryId),
        JSON.stringify(normalized)
    );

    return normalized;
};

const buildProjectHierarchy = async (projectId) => {
    const categories = await getProjectCategories(projectId);
    const activeCategoryId = Number(localStorage.getItem(getCategoryStorageKey(projectId)) || categories[0]?.id || 0);
    const activeCategory = categories.find((category) => Number(category.id) === Number(activeCategoryId)) || categories[0] || null;

    let subcategories = [];
    if (activeCategory) {
        subcategories = await loadSubcategoriesForCategory(projectId, activeCategory.id);
    }

    let activeSubcategoryId = activeCategory
        ? localStorage.getItem(getSubcategoryStorageKey(projectId, activeCategory.id))
        : null;

    if (activeCategory && (!activeSubcategoryId || !subcategories.some((subcategory) => Number(subcategory.id) === Number(activeSubcategoryId))) && subcategories.length > 0) {
        activeSubcategoryId = String(subcategories[0].id);
        saveProjectSubcategoryId(projectId, activeCategory.id, activeSubcategoryId);
    }

    const activeSubcategory = activeCategory && activeSubcategoryId
        ? subcategories.find((subcategory) => Number(subcategory.id) === Number(activeSubcategoryId)) || null
        : null;

    return { categories, activeCategory, subcategories, activeSubcategory };
};

const renderProjectCategories = async (projectId) => {
    const { categories, activeCategory, subcategories, activeSubcategory } = await buildProjectHierarchy(projectId);

    const [bugReports, testCases] = activeSubcategory
        ? await Promise.all([
            getBugReport(projectId, null, activeSubcategory.id, activeCategory?.id),
            getTestKey(projectId, null, activeSubcategory.id, activeCategory?.id)
        ])
        : [[], []];

    const activeSection = activeSubcategory
        ? localStorage.getItem(getSubcategoryViewStorageKey(projectId, activeCategory.id, activeSubcategory.id)) || 'bugreports'
        : 'bugreports';

    const visibleItems = activeSection === 'testcases' ? testCases : bugReports;
    const visibleTitle = activeSection === 'testcases' ? 'Test Cases' : 'Bug Reports';
    const emptyMessage = activeSection === 'testcases'
        ? 'No test cases for this subcategory.'
        : 'No bug reports for this subcategory.';

    return `
        <div class="categories-panel">
            <h3 class="metrics-title">Categories</h3>
            <div class="category-list">
                ${categories.length > 0 ? categories.map((category) => `
                    <button
                        type="button"
                        class="category-item ${Number(activeCategory?.id) === Number(category.id) ? 'active' : ''}"
                        data-category-id="${category.id}"
                        data-project-id="${projectId}"
                    >
                        ${category.name}
                    </button>
                `).join('') : '<div class="main-empty">No categories found for this project.</div>'}
            </div>

            ${activeCategory ? `
                <div class="subcategory-panel">
                    <div class="category-row">
                        <h4 class="subcategories-title">${activeCategory.name}</h4>
                        <div class="subcategory-list">
                            ${subcategories.length > 0 ? subcategories.map((subcategory) => `
                                <div class="subcategory-node">
                                    <div
                                        class="subcategory-item ${Number(activeSubcategory?.id) === Number(subcategory.id) ? 'active' : ''}"
                                        data-subcategory-id="${subcategory.id}"
                                        data-category-id="${activeCategory.id}"
                                        data-project-id="${projectId}"
                                    >
                                        ${subcategory.name || 'Unnamed subcategory'}
                                    </div>
                                    <div class="subcategory-children ${Number(activeSubcategory?.id) === Number(subcategory.id) ? 'expanded' : ''}">
                                        <button type="button" class="subcategory-folder ${activeSection === 'bugreports' && Number(activeSubcategory?.id) === Number(subcategory.id) ? 'active' : ''}" data-subcategory-view="bugreports" data-project-id="${projectId}" data-category-id="${activeCategory.id}" data-subcategory-id="${subcategory.id}">Bug Reports</button>
                                        <button type="button" class="subcategory-folder ${activeSection === 'testcases' && Number(activeSubcategory?.id) === Number(subcategory.id) ? 'active' : ''}" data-subcategory-view="testcases" data-project-id="${projectId}" data-category-id="${activeCategory.id}" data-subcategory-id="${subcategory.id}">Test Cases</button>
                                    </div>
                                </div>
                            `).join('') : '<div class="main-empty">No subcategories available.</div>'}
                        </div>
                    </div>

                    ${activeSubcategory ? `
                        <div class="subcategory-content">
                            <div class="subcategory-folder-list">
                                <button
                                    type="button"
                                    class="subcategory-folder ${activeSection === 'bugreports' ? 'active' : ''}"
                                    data-subcategory-view="bugreports"
                                    data-project-id="${projectId}"
                                    data-category-id="${activeCategory.id}"
                                    data-subcategory-id="${activeSubcategory.id}"
                                >
                                    Bug Reports
                                </button>
                                <button
                                    type="button"
                                    class="subcategory-folder ${activeSection === 'testcases' ? 'active' : ''}"
                                    data-subcategory-view="testcases"
                                    data-project-id="${projectId}"
                                    data-category-id="${activeCategory.id}"
                                    data-subcategory-id="${activeSubcategory.id}"
                                >
                                    Test Cases
                                </button>
                            </div>

                            <div class="subcategory-section">
                                <h5>${visibleTitle}</h5>
                                <div class="subcategory-items-list">
                                    ${visibleItems.length > 0 ? visibleItems.map((item) => `
                                        <div class="subcategory-item-entry ${activeSection === 'testcases' ? 'tc-entry' : 'bug-entry'}" data-test-case-id="${item.id}" data-bugreport-id="${item.id}">
                                            ${activeSection === 'testcases' ? (item.name || `Test case #${item.id}`) : (item.title || item.name || `Ticket #${item.id}`)}
                                        </div>
                                    `).join('') : `<div class="main-empty">${emptyMessage}</div>`}
                                </div>
                            </div>
                        </div>
                    ` : '<div class="main-empty">Select a subcategory to view bug reports and test cases.</div>'}
                </div>
            ` : ''}
        </div>
    `;
};

// Установить хлебные крошки навигации
const setBreadcrumb = (parts) => {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = parts.join(' / ');
};

let mainContainer = null;
const activeSubcategoryRequests = new Set();

const makeSubcategoryRequestKey = (projectId, categoryId, subcategoryId) =>
    `subcategory:${projectId}:${categoryId}:${subcategoryId}`;

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

        mainContainer.querySelectorAll('.category-item').forEach((button) => {
            button.addEventListener('click', async () => {
                const categoryId = button.dataset.categoryId;
                const selectedProjectId = button.dataset.projectId;

                if (selectedProjectId && categoryId) {
                    saveProjectCategoryId(selectedProjectId, categoryId);
                    localStorage.removeItem(getSubcategoryStorageKey(selectedProjectId, categoryId));

                    const subcategories = await loadSubcategoriesForCategory(selectedProjectId, categoryId, false);
                    if (Array.isArray(subcategories) && subcategories.length > 0) {
                        const firstSubcategoryId = subcategories[0]?.id;
                        if (firstSubcategoryId) {
                            saveProjectSubcategoryId(selectedProjectId, categoryId, firstSubcategoryId);
                        }
                    }

                    setCurrentRoute(buildProjectCategoryRoute(selectedProjectId, categoryId));
                    await showProjectMetrics(selectedProjectId);
                }
            });
        });

        mainContainer.querySelectorAll('.subcategory-item').forEach((item) => {
            item.addEventListener('click', async () => {
                const projectId = item.dataset.projectId;
                const categoryId = item.dataset.categoryId;
                const subcategoryId = item.dataset.subcategoryId;

                if (!projectId || !categoryId || !subcategoryId) return;

                const requestKey = makeSubcategoryRequestKey(projectId, categoryId, subcategoryId);
                if (activeSubcategoryRequests.has(requestKey)) return;
                activeSubcategoryRequests.add(requestKey);

                try {
                    saveProjectCategoryId(projectId, categoryId);
                    saveProjectSubcategoryId(projectId, categoryId, subcategoryId);
                    localStorage.setItem(getSubcategoryViewStorageKey(projectId, categoryId, subcategoryId), 'bugreports');
                    setCurrentRoute(buildProjectSubcategoryRoute(projectId, categoryId, subcategoryId));

                    const [bugReports, testCases] = await Promise.all([
                        getBugReport(projectId, null, subcategoryId, categoryId),
                        getTestKey(projectId, null, subcategoryId, categoryId)
                    ]);

                    const selectedSubcategory = (await loadSubcategoriesForCategory(projectId, categoryId, false)).find((subcategory) => Number(subcategory.id) === Number(subcategoryId)) || { id: Number(subcategoryId), name: 'Selected subcategory' };

                    const viewItems = Array.isArray(bugReports) ? bugReports : [];
                    const viewTitle = 'Bug Reports';

                    mainContainer.innerHTML = `
                        <div class="metrics">
                            <h2 class="metrics-title">${selectedSubcategory.name}</h2>
                        </div>
                        <div class="subcategory-content">
                            <div class="subcategory-folder-list">
                                <button type="button" class="subcategory-folder active" data-subcategory-view="bugreports" data-project-id="${projectId}" data-category-id="${categoryId}" data-subcategory-id="${subcategoryId}">Bug Reports</button>
                                <button type="button" class="subcategory-folder" data-subcategory-view="testcases" data-project-id="${projectId}" data-category-id="${categoryId}" data-subcategory-id="${subcategoryId}">Test Cases</button>
                            </div>
                            <div class="subcategory-section">
                                <h5>${viewTitle}</h5>
                                <div class="subcategory-items-list">
                                    ${viewItems.length > 0 ? viewItems.map((item) => `
                                        <div class="subcategory-item-entry bug-entry" data-bugreport-id="${item.id}">
                                            ${item.title || item.name || `Ticket #${item.id}`}
                                        </div>
                                    `).join('') : '<div class="main-empty">No bug reports for this subcategory.</div>'}
                                </div>
                            </div>
                        </div>
                    `;

                    mainContainer.querySelectorAll('.subcategory-folder').forEach((folder) => {
                        folder.addEventListener('click', async () => {
                            const folderProjectId = folder.dataset.projectId;
                            const folderCategoryId = folder.dataset.categoryId;
                            const folderSubcategoryId = folder.dataset.subcategoryId;
                            const folderView = folder.dataset.subcategoryView;

                            if (!folderProjectId || !folderCategoryId || !folderSubcategoryId || !folderView) return;
                            localStorage.setItem(getSubcategoryViewStorageKey(folderProjectId, folderCategoryId, folderSubcategoryId), folderView);
                            await showProjectMetrics(folderProjectId);
                        });
                    });

                    mainContainer.querySelectorAll('.bug-entry').forEach((entry) => {
                        entry.addEventListener('click', () => {
                            const bugreportId = entry.dataset.bugreportId;
                            if (!projectId || !bugreportId) return;
                            const url = `/bugreport.html?projectId=${encodeURIComponent(projectId)}&tickets=${encodeURIComponent(bugreportId)}`;
                            window.open(url, '_blank');
                        });
                    });
                } finally {
                    activeSubcategoryRequests.delete(requestKey);
                }
            });
        });

        mainContainer.querySelectorAll('.subcategory-folder').forEach((folder) => {
            folder.addEventListener('click', async () => {
                const folderProjectId = folder.dataset.projectId;
                const folderCategoryId = folder.dataset.categoryId;
                const folderSubcategoryId = folder.dataset.subcategoryId;
                const folderView = folder.dataset.subcategoryView;

                if (!folderProjectId || !folderCategoryId || !folderSubcategoryId || !folderView) return;
                localStorage.setItem(getSubcategoryViewStorageKey(folderProjectId, folderCategoryId, folderSubcategoryId), folderView);
                await showProjectMetrics(folderProjectId);
            });
        });
    } catch (err) {
        mainContainer.innerHTML = '<div class="main-error">Failed to load metrics</div>';
    }
};

const selectProject = async (projects, state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Categories']);

    const categories = await getProjectCategories(project.id);
    saveProjectCategories(project.id, categories);
    saveProjectCategoryId(project.id, categories[0]?.id || null);

    await showProjectMetrics(project.id);
};

const selectCategories = async (state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Categories']);
    await showProjectMetrics(project.id);
};

const selectCategory = async (state, project, category) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, category?.name || 'Categories']);

    if (project?.id && category?.id) {
        saveProjectCategoryId(project.id, category.id);

        const subcategories = await loadSubcategoriesForCategory(project.id, category.id, false);
        if (Array.isArray(subcategories) && subcategories.length > 0) {
            const firstSubcategoryId = subcategories[0]?.id;
            if (firstSubcategoryId) {
                saveProjectSubcategoryId(project.id, category.id, firstSubcategoryId);
            }
        }
    }
};

const createProjectHandlers = (projects, state, sidebar) => ({
    onProjectSelect: async (project) => {
        await selectProject(projects, state, project);
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    },
    onCategoriesSelect: async (project) => {
        await selectCategories(state, project);
    },
    onCategorySelect: async (project, category) => {
        await selectCategory(state, project, category);
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    },
    onSubcategorySelect: async (project, category, subcategory) => {
        if (!project?.id || !category?.id || !subcategory?.id) return;

        const requestKey = makeSubcategoryRequestKey(project.id, category.id, subcategory.id);
        if (activeSubcategoryRequests.has(requestKey)) return;
        activeSubcategoryRequests.add(requestKey);

        try {
            saveProjectCategoryId(project.id, category.id);
            saveProjectSubcategoryId(project.id, category.id, subcategory.id);
            setCurrentRoute(buildProjectSubcategoryRoute(project.id, category.id, subcategory.id));

const [bugReports, testCases] = await Promise.all([
            getBugReport(project.id, null, subcategory.id, category.id),
            getTestKey(project.id, null, subcategory.id, category.id)
        ]);

            const selectedSubcategory = { id: Number(subcategory.id), name: String(subcategory.name || 'Selected subcategory') };
            const sections = [];

            if (Array.isArray(bugReports) && bugReports.length > 0) {
                sections.push(`
                    <div class="subcategory-section">
                        <h5>Bug Reports</h5>
                        <div class="bug-list">
                            ${bugReports.map((item) => `
                                <div class="bug-card" data-bugreport-id="${item.id}">
                                    <div class="bug-title">${item.title || item.name || `Ticket #${item.id}`}</div>
                                    <div class="bug-meta">#${item.id} • ${item.status || ''} • ${item.priority || ''}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `);
            }

            if (Array.isArray(testCases) && testCases.length > 0) {
                sections.push(`
                    <div class="subcategory-section">
                        <h5>Test Cases</h5>
                        <div class="tc-list">
                            ${testCases.map((item) => `
                                <div class="tc-card" data-test-case-id="${item.id}">
                                    <div class="tc-title">${item.name || `Test case #${item.id}`}</div>
                                    <div class="tc-meta">#${item.id} • ${item.status || ''}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `);
            }

            if (sections.length === 0) {
                mainContainer.innerHTML = `
                    <div class="metrics">
                        <h2 class="metrics-title">${selectedSubcategory.name}</h2>
                    </div>
                    <div class="main-empty">No bug reports or test cases for this subcategory.</div>
                `;
                return;
            }

            mainContainer.innerHTML = `
                <div class="metrics">
                    <h2 class="metrics-title">${selectedSubcategory.name}</h2>
                </div>
                <div class="subcategory-content">
                    ${sections.join('')}
                </div>
            `;

            mainContainer.querySelectorAll('.bug-card').forEach((card) => {
                card.addEventListener('click', () => {
                    const bugreportId = card.dataset.bugreportId;
                    if (!project.id || !bugreportId) return;
                    const url = `/bugreport.html?projectId=${encodeURIComponent(project.id)}&tickets=${encodeURIComponent(bugreportId)}`;
                    window.open(url, '_blank');
                });
            });

            mainContainer.querySelectorAll('.tc-card').forEach((card) => {
                card.addEventListener('click', () => {
                    const testCaseId = card.dataset.testCaseId;
                    if (!project.id || !testCaseId) return;
                    const url = `/test-case.html?projectId=${encodeURIComponent(project.id)}&testCaseId=${encodeURIComponent(testCaseId)}`;
                    window.open(url, '_blank');
                });
            });
        } finally {
            activeSubcategoryRequests.delete(requestKey);
        }

        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
    }
});

// Инициализировать дашборд с проектами и обработчиками событий
export const initDashboard = async () => {
    const sidebar = document.getElementById('dashboard-sidebar');
    const main = document.getElementById('dashboard-main');

    if (!sidebar || !main) return;

    const mainContent = document.getElementById('main-content');
    mainContainer = mainContent || main;

    // Состояние дашборда: открытые проекты, активный проект, активный раздел
    const state = {
        expanded: {},
        activeProjectId: null,
        activeProjectName: null,
        activeSection: null,
    };

    sidebar.innerHTML = '<div class="sidebar-loading">Loading projects...</div>';

    try {
        // Получить список проектов
        const projects = await getProjects();

        // Инициализировать все проекты как закрытые
        projects.forEach((project) => {
            state.expanded[project.id] = false;
        });

        // Отрендерить список проектов с обработчиками
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));

        // Загрузить первый проект по умолчанию
        if (projects.length > 0) {
            await selectProject(projects, state, projects[0]);
            // Обновить список с выбранным проектом
            renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
        } else {
            sidebar.innerHTML = '<div class="sidebar-empty">No projects found.</div>';
            if (mainContainer) {
                mainContainer.innerHTML = '<div class="main-empty">No project selected.</div>';
            }
        }
    } catch (err) {
        sidebar.innerHTML = '<div class="sidebar-error">Failed to load projects.</div>';
        if (mainContainer) {
            mainContainer.innerHTML = '<div class="main-error">Cannot load data.</div>';
        }
    }
};
