import { getProjects, getProjectMetrics } from '../../api/projectapi.mjs';
import { getBugReport } from '../../api/bagreportapi.mjs';
import { getTestKey } from '../../api/testkeysapi.mjs';
import { renderProjectsList } from './ProjectSidebar.mjs';
import { renderBugReportsPanel } from './BugReportsPanel.mjs';
import { renderTestCasesPanel } from './TestCasesPanel.mjs';

// Установить хлебные крошки навигации
const setBreadcrumb = (parts) => {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = parts.join(' / ');
};

let mainContainer = null;

// Показать метрики проекта (количество баг-репортов и тест-кейсов)
const showProjectMetrics = async (projectId) => {
    if (!mainContainer) return;

    mainContainer.innerHTML = '<div class="main-loading">Loading...</div>';

    try {
        const metrics = await getProjectMetrics(projectId);
        mainContainer.innerHTML = `
            <div class="metrics">
                <h2 class="metrics-title">${metrics.project.project_name}</h2>
                <div class="metrics-cards">
                    <div class="card">
                        <div class="card-title">Bug Reports</div>
                        <div class="card-value">${metrics.project.tickets_total}</div>
                    </div>
                    <div class="card">
                        <div class="card-title">Test Cases</div>
                        <div class="card-value">${metrics.project.testkeys_total}</div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        mainContainer.innerHTML = '<div class="main-error">Failed to load metrics</div>';
    }
};

// Обновить состояние проекта и показать его метрики
const selectProject = async (projects, state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = null;
    localStorage.setItem('activeProjectId', project.id); // Для модалки создания тест-кейса
    setBreadcrumb(['Jura', project.name]);
    await showProjectMetrics(project.id);
};

// Показать баг-репорты выбранного проекта
const selectBugReports = async (state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'bug-reports';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Bug Reports']);
    await renderBugReportsPanel(mainContainer, async () => getBugReport(project.id));
};

// Показать тест-кейсы выбранного проекта
const selectTestCases = async (state, project) => {
    state.activeProjectId = project.id;
    state.activeProjectName = project.name;
    state.activeSection = 'test-cases';
    localStorage.setItem('activeProjectId', project.id);
    setBreadcrumb(['Jura', project.name, 'Test Cases']);
    await renderTestCasesPanel(mainContainer, async () => getTestKey(project.id));
};

// Создать обработчики событий для проектов
const createProjectHandlers = (projects, state) => ({
    onProjectSelect: async (project) => {
        await selectProject(projects, state, project);
        // Перерендерить список с новым активным проектом
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state));
    },
    onBugReportsSelect: async (project) => {
        await selectBugReports(state, project);
    },
    onTestCasesSelect: async (project) => {
        await selectTestCases(state, project);
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
        renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state));

        // Загрузить первый проект по умолчанию
        if (projects.length > 0) {
            await selectProject(projects, state, projects[0]);
            // Обновить список с выбранным проектом
            renderProjectsList(sidebar, projects, state.activeProjectId, state, createProjectHandlers(projects, state));
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
