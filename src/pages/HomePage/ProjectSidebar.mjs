const createElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

export const renderProjectsList = (container, projects, activeProjectId, state, actions = {}) => {
    container.innerHTML = '';

    const title = createElement('div', 'projects-title', 'Projects');
    container.appendChild(title);

    projects.forEach((project) => {
        const projectWrap = createElement('div', 'project-wrap');
        const projectHeader = createElement('div', 'project-header');
        projectHeader.textContent = project.name;
        projectHeader.dataset.projectId = project.id;

        if (project.id === activeProjectId) {
            projectHeader.classList.add('active-project');
        }

        const toggleIcon = createElement('span', 'chev');
        toggleIcon.textContent = state.expanded[project.id] ? '▼' : '▶';
        projectHeader.prepend(toggleIcon);

        const submenu = createElement('div', 'project-submenu');
        if (!state.expanded[project.id]) {
            submenu.style.display = 'none';
        }

        const bugReportsItem = createElement('div', 'submenu-item', 'Bug Reports');
        bugReportsItem.dataset.action = 'bug-reports';
        bugReportsItem.dataset.projectId = project.id;
        if (state.activeSection === 'bug-reports' && state.activeProjectId === project.id) {
            bugReportsItem.classList.add('active-sub');
        }

        const testCasesItem = createElement('div', 'submenu-item', 'Test Cases');
        testCasesItem.dataset.action = 'test-cases';
        testCasesItem.dataset.projectId = project.id;
        if (state.activeSection === 'test-cases' && state.activeProjectId === project.id) {
            testCasesItem.classList.add('active-sub');
        }

        submenu.appendChild(bugReportsItem);
        submenu.appendChild(testCasesItem);

        projectWrap.appendChild(projectHeader);
        projectWrap.appendChild(submenu);
        container.appendChild(projectWrap);

        projectHeader.addEventListener('click', async () => {
            state.expanded[project.id] = !state.expanded[project.id];
            renderProjectsList(container, projects, state.activeProjectId, state, actions);

            if (!state.activeProjectId || state.activeProjectId !== project.id) {
                if (actions.onProjectSelect) {
                    await actions.onProjectSelect(project);
                }
            }
        });

        bugReportsItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (actions.onBugReportsSelect) {
                await actions.onBugReportsSelect(project);
            }
        });

        testCasesItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            if (actions.onTestCasesSelect) {
                await actions.onTestCasesSelect(project);
            }
        });
    });
};
