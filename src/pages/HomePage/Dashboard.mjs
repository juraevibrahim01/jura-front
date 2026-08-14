import { getProjects, getProjectMetrics } from '../../api/projectapi.mjs';
import { getBugReports } from '../../api/bagreportapi.mjs';
import { getTestCases } from '../../api/testkeysapi.mjs';
import { renderProjectsList } from './ProjectSidebar.mjs';
import { renderBugReportsPanel } from './BugReportsPanel.mjs';
import { renderTestCasesPanel } from './TestCasesPanel.mjs';

const setBreadcrumb = (parts) => {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) breadcrumb.textContent = parts.join(' / ');
};

let mainContainer = null;

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

        renderProjectsList(sidebar, projects, state.activeProjectId, state, {
            onProjectSelect: async (project) => {
                state.activeProjectId = project.id;
                state.activeProjectName = project.name;
                state.activeSection = null;
                setBreadcrumb(['Jura', project.name]);
                await showProjectMetrics(project.id);
                renderProjectsList(sidebar, projects, state.activeProjectId, state, {
                    onProjectSelect: async (selectedProject) => {
                        state.activeProjectId = selectedProject.id;
                        state.activeProjectName = selectedProject.name;
                        state.activeSection = null;
                        setBreadcrumb(['Jura', selectedProject.name]);
                        await showProjectMetrics(selectedProject.id);
                        renderProjectsList(sidebar, projects, state.activeProjectId, state, {
                            onProjectSelect: async (selected) => {
                                state.activeProjectId = selected.id;
                                state.activeProjectName = selected.name;
                                state.activeSection = null;
                                setBreadcrumb(['Jura', selected.name]);
                                await showProjectMetrics(selected.id);
                            },
                            onBugReportsSelect: async (selectedProject) => {
                                state.activeProjectId = selectedProject.id;
                                state.activeProjectName = selectedProject.name;
                                state.activeSection = 'bug-reports';
                                setBreadcrumb(['Jura', selectedProject.name, 'Bug Reports']);
                                await renderBugReportsPanel(mainContainer, async () => getBugReports(selectedProject.id));
                            },
                            onTestCasesSelect: async (selectedProject) => {
                                state.activeProjectId = selectedProject.id;
                                state.activeProjectName = selectedProject.name;
                                state.activeSection = 'test-cases';
                                setBreadcrumb(['Jura', selectedProject.name, 'Test Cases']);
                                await renderTestCasesPanel(mainContainer, async () => getTestCases(selectedProject.id));
                            }
                        });
                    },
                    onBugReportsSelect: async (selectedProject) => {
                        state.activeProjectId = selectedProject.id;
                        state.activeProjectName = selectedProject.name;
                        state.activeSection = 'bug-reports';
                        setBreadcrumb(['Jura', selectedProject.name, 'Bug Reports']);
                        await renderBugReportsPanel(mainContainer, async () => getBugReports(selectedProject.id));
                    },
                    onTestCasesSelect: async (selectedProject) => {
                        state.activeProjectId = selectedProject.id;
                        state.activeProjectName = selectedProject.name;
                        state.activeSection = 'test-cases';
                        setBreadcrumb(['Jura', selectedProject.name, 'Test Cases']);
                        await renderTestCasesPanel(mainContainer, async () => getTestCases(selectedProject.id));
                    }
                });
            },
            onBugReportsSelect: async (project) => {
                state.activeProjectId = project.id;
                state.activeProjectName = project.name;
                state.activeSection = 'bug-reports';
                setBreadcrumb(['Jura', project.name, 'Bug Reports']);
                await renderBugReportsPanel(mainContainer, async () => getBugReports(project.id));
            },
            onTestCasesSelect: async (project) => {
                state.activeProjectId = project.id;
                state.activeProjectName = project.name;
                state.activeSection = 'test-cases';
                setBreadcrumb(['Jura', project.name, 'Test Cases']);
                await renderTestCasesPanel(mainContainer, async () => getTestCases(project.id));
            }
        });

        if (projects.length > 0) {
            const firstProject = projects[0];
            state.activeProjectId = firstProject.id;
            state.activeProjectName = firstProject.name;
            setBreadcrumb(['Jura', firstProject.name]);
            await showProjectMetrics(firstProject.id);
            renderProjectsList(sidebar, projects, state.activeProjectId, state, {
                onProjectSelect: async (project) => {
                    state.activeProjectId = project.id;
                    state.activeProjectName = project.name;
                    state.activeSection = null;
                    setBreadcrumb(['Jura', project.name]);
                    await showProjectMetrics(project.id);
                },
                onBugReportsSelect: async (project) => {
                    state.activeProjectId = project.id;
                    state.activeProjectName = project.name;
                    state.activeSection = 'bug-reports';
                    setBreadcrumb(['Jura', project.name, 'Bug Reports']);
                    await renderBugReportsPanel(mainContainer, async () => getBugReports(project.id));
                },
                onTestCasesSelect: async (project) => {
                    state.activeProjectId = project.id;
                    state.activeProjectName = project.name;
                    state.activeSection = 'test-cases';
                    setBreadcrumb(['Jura', project.name, 'Test Cases']);
                    await renderTestCasesPanel(mainContainer, async () => getTestCases(project.id));
                }
            });
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
