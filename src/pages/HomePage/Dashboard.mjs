import { getProjects, getProjectMetrics } from '../../api/projectapi.mjs';
import { getProjectCategories, getCategorySubcategories } from '../../api/categoryapi.mjs';
import { getBugReport } from '../../api/bagreportapi.mjs';
import { getTestKey } from '../../api/testkeysapi.mjs';
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

// ------------------------------------------------------------
// Loaders for project hierarchy
// ------------------------------------------------------------
const loadProjectCategories = async (projectId) => {
    const cachedCategories = readProjectCategoriesFromStorage(projectId);

    if (cachedCategories.length > 0) {
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

    const activeCategoryId = Number(
        localStorage.getItem(getCategoryStorageKey(projectId)) || categories[0]?.id || 0
    );

    const activeCategory =
        categories.find((category) => Number(category.id) === Number(activeCategoryId)) ||
        categories[0] ||
        null;

    const subcategories = activeCategory
        ? await loadSubcategoriesForCategory(projectId, activeCategory.id)
        : [];

    let activeSubcategoryId = activeCategory
        ? localStorage.getItem(getSubcategoryStorageKey(projectId, activeCategory.id))
        : null;

    if (
        activeCategory &&
        (!activeSubcategoryId || !subcategories.some((subcategory) => Number(subcategory.id) === Number(activeSubcategoryId))) &&
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

        mainContainer.querySelectorAll('.subcategory-folder').forEach((folder) => {
            folder.addEventListener('click', async () => {
                const folderProjectId = folder.dataset.projectId;
                const folderCategoryId = folder.dataset.categoryId;
                const folderSubcategoryId = folder.dataset.subcategoryId;
                const folderView = folder.dataset.subcategoryView;

                if (!folderProjectId || !folderCategoryId || !folderSubcategoryId || !folderView) return;

                localStorage.setItem(
                    getSubcategoryViewStorageKey(folderProjectId, folderCategoryId, folderSubcategoryId),
                    folderView
                );

                await showProjectMetrics(folderProjectId);
            });
        });
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
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Categories']);

    const categories = await loadProjectCategories(project.id);
    if (categories.length > 0) {
        saveSelectedCategory(project.id, categories[0].id);
    }

    await showProjectMetrics(project.id);
};

const selectCategory = async (state, project, category) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'categories';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, category?.name || 'Categories']);

    if (project?.id && category?.id) {
        saveSelectedCategory(project.id, category.id);

        const subcategories = await loadSubcategoriesForCategory(project.id, category.id, false);
        if (Array.isArray(subcategories) && subcategories.length > 0) {
            const firstSubcategoryId = subcategories[0]?.id;
            if (firstSubcategoryId) {
                saveSelectedSubcategory(project.id, category.id, firstSubcategoryId);
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
        state.activeProjectId = project.id;
        state.activeProjectName = project.name;
        state.activeSection = 'categories';
        localStorage.setItem('activeProjectId', project.id);
        setBreadcrumb(['Jura', project.name, 'Categories']);
        await showProjectMetrics(project.id);
    },
    onCategorySelect: async (project, category) => {
        await selectCategory(state, project, category);
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
                        const url = `/test-case.html?projectId=${encodeURIComponent(project.id)}&testCaseId=${encodeURIComponent(testCaseId)}`;
                        window.open(url, '_blank');
                    }
                });
            });
        } catch (error) {
            mainContainer.innerHTML = `
                <div class="metrics">
                    <h2 class="metrics-title">${selectedSubcategory.name}</h2>
                </div>
                <div class="main-error">Failed to load ${view === 'testcases' ? 'test cases' : 'bug reports'}.</div>
            `;
        }

        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state, sidebar));
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
    };

    sidebar.innerHTML = '<div class="sidebar-loading">Loading projects...</div>';

    try {
        const projects = await getProjects();

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
