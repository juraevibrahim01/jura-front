import { getProjects, getProjectMetrics, getBugReports, getTestCases } from '../../api/api.mjs';

const createEl = (tag, cls = '', txt = '') => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt) el.textContent = txt;
    return el;
};

const setBreadcrumb = (parts) => {
    const bc = document.getElementById('breadcrumb');
    if (bc) bc.textContent = parts.join(' / ');
};

const renderProjectsList = (container, projects, activeProjectId, state) => {
    container.innerHTML = '';
    const title = createEl('div', 'projects-title', 'Projects');
    container.appendChild(title);

    projects.forEach((p) => {
        const pWrap = createEl('div', 'project-wrap');
        const pHeader = createEl('div', 'project-header');
        pHeader.textContent = p.name;
        pHeader.dataset.projectId = p.id;
        if (p.id === activeProjectId) pHeader.classList.add('active-project');

        const toggleIcon = createEl('span', 'chev');
        toggleIcon.textContent = state.expanded[p.id] ? '▼' : '▶';
        pHeader.prepend(toggleIcon);

        const sub = createEl('div', 'project-submenu');
        if (!state.expanded[p.id]) sub.style.display = 'none';

        const br = createEl('div', 'submenu-item');
        br.textContent = 'Bug Reports';
        br.dataset.action = 'bug-reports';
        br.dataset.projectId = p.id;
        if (state.activeSection === 'bug-reports' && state.activeProjectId === p.id) br.classList.add('active-sub');

        const tc = createEl('div', 'submenu-item');
        tc.textContent = 'Test Cases';
        tc.dataset.action = 'test-cases';
        tc.dataset.projectId = p.id;
        if (state.activeSection === 'test-cases' && state.activeProjectId === p.id) tc.classList.add('active-sub');

        sub.appendChild(br);
        sub.appendChild(tc);

        pWrap.appendChild(pHeader);
        pWrap.appendChild(sub);
        container.appendChild(pWrap);

        // events
        pHeader.addEventListener('click', async () => {
            // toggle
            state.expanded[p.id] = !state.expanded[p.id];
            renderProjectsList(container, projects, state.activeProjectId, state);
            if (!state.activeProjectId || state.activeProjectId !== p.id) {
                // select project and load metrics
                state.activeProjectId = p.id;
                state.activeProjectName = p.name;
                state.activeSection = null;
                setBreadcrumb(['Jura', p.name]);
                await loadAndRenderMetrics(p.id);
            }
        });

        br.addEventListener('click', async (e) => {
            e.stopPropagation();
            state.activeProjectId = p.id;
            state.activeProjectName = p.name;
            state.activeSection = 'bug-reports';
            renderProjectsList(container, projects, state.activeProjectId, state);
            setBreadcrumb(['Jura', p.name, 'Bug Reports']);
            await loadAndRenderBugReports(p.id);
        });

        tc.addEventListener('click', async (e) => {
            e.stopPropagation();
            state.activeProjectId = p.id;
            state.activeProjectName = p.name;
            state.activeSection = 'test-cases';
            renderProjectsList(container, projects, state.activeProjectId, state);
            setBreadcrumb(['Jura', p.name, 'Test Cases']);
            await loadAndRenderTestCases(p.id);
        });
    });
};

const showMainLoading = (main) => {
    main.innerHTML = '<div class="main-loading">Loading...</div>';
};

const showMainError = (main, msg) => {
    main.innerHTML = `<div class="main-error">${msg}</div>`;
};

const renderMetrics = (main, metrics) => {
    main.innerHTML = `
        <div class="metrics">
            <h2 class="metrics-title">${metrics.project_name}</h2>
            <div class="metrics-cards">
                <div class="card">
                    <div class="card-title">Bug Reports</div>
                    <div class="card-value">${metrics.bug_reports_count}</div>
                </div>
                <div class="card">
                    <div class="card-title">Test Cases</div>
                    <div class="card-value">${metrics.test_cases_count}</div>
                </div>
            </div>
        </div>
    `;
};

const renderBugReports = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML = '<div class="main-empty">No bug reports.</div>';
        return;
    }
    const rows = items.map(it => `
        <div class="bug-card">
            <div class="bug-title">${it.title}</div>
            <div class="bug-meta">#${it.id} • ${it.status} • ${it.priority}</div>
        </div>
    `).join('');
    main.innerHTML = `<div class="list-title">Bug Reports</div><div class="bug-list">${rows}</div>`;
};

const renderTestCases = (main, items) => {
    if (!items || items.length === 0) {
        main.innerHTML = '<div class="main-empty">No test cases.</div>';
        return;
    }
    const rows = items.map(it => `
        <div class="tc-card">
            <div class="tc-title">${it.title}</div>
            <div class="tc-meta">#${it.id} • ${it.status}</div>
        </div>
    `).join('');
    main.innerHTML = `<div class="list-title">Test Cases</div><div class="tc-list">${rows}</div>`;
};

let _mainEl = null;

const loadAndRenderMetrics = async (projectId) => {
    if (!_mainEl) return;
    showMainLoading(_mainEl);
    try {
        const metrics = await getProjectMetrics(projectId);
        renderMetrics(_mainEl, metrics);
    } catch (err) {
        showMainError(_mainEl, 'Failed to load metrics');
    }
};

const loadAndRenderBugReports = async (projectId) => {
    if (!_mainEl) return;
    showMainLoading(_mainEl);
    try {
        const items = await getBugReports(projectId);
        renderBugReports(_mainEl, items);
    } catch (err) {
        showMainError(_mainEl, 'Failed to load bug reports');
    }
};

const loadAndRenderTestCases = async (projectId) => {
    if (!_mainEl) return;
    showMainLoading(_mainEl);
    try {
        const items = await getTestCases(projectId);
        renderTestCases(_mainEl, items);
    } catch (err) {
        showMainError(_mainEl, 'Failed to load test cases');
    }
};

export const initDashboard = async () => {
    const sidebar = document.getElementById('dashboard-sidebar');
    const main = document.getElementById('dashboard-main');

    if (!header || !sidebar || !main) return;

    // Respect a breadcrumb placed inside main (user preference): render content into #main-content if present
    const mainContent = document.getElementById('main-content');
    _mainEl = mainContent || main;

    // state
    const state = {
        expanded: {},
        activeProjectId: null,
        activeProjectName: null,
        activeSection: null,
    };

    // load projects
    sidebar.innerHTML = '<div class="sidebar-loading">Loading projects...</div>';
    try {
        const projects = await getProjects();
        // initialize expanded map
        projects.forEach(p => { state.expanded[p.id] = false; });
        renderProjectsList(sidebar, projects, state.activeProjectId, state);
        // if at least one project, select first project by default
        if (projects.length > 0) {
            const first = projects[0];
            state.activeProjectId = first.id;
            state.activeProjectName = first.name;
            setBreadcrumb(['Jura', first.name]);
            await loadAndRenderMetrics(first.id);
            renderProjectsList(sidebar, projects, state.activeProjectId, state);
        } else {
            sidebar.innerHTML = '<div class="sidebar-empty">No projects found.</div>';
            if (_mainEl) _mainEl.innerHTML = '<div class="main-empty">No project selected.</div>';
        }
    } catch (err) {
        sidebar.innerHTML = '<div class="sidebar-error">Failed to load projects.</div>';
        if (_mainEl) _mainEl.innerHTML = '<div class="main-error">Cannot load data.</div>';
    }
};
