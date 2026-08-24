const createElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

const getProjectCategoriesKey = (projectId) => `project_categories_${projectId}`;

const readProjectCategories = (projectId) => {
    try {
        const raw = localStorage.getItem(getProjectCategoriesKey(projectId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        return [];
    }
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

        const categories = readProjectCategories(project.id);

        categories.forEach((category) => {
            const categoryItem = createElement('div', 'submenu-item category-item', category.name);
            categoryItem.dataset.projectId = project.id;
            categoryItem.dataset.categoryId = category.id;
            categoryItem.dataset.categoryName = category.name;
            if (state.activeSection === 'categories' && state.activeProjectId === project.id) {
                categoryItem.classList.add('active-sub');
            }

            categoryItem.addEventListener('click', async () => {
                if (actions.onCategorySelect) {
                    await actions.onCategorySelect(project, category);
                }
            });

            submenu.appendChild(categoryItem);
        });

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
    });
};
