const createElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

const getProjectCategoriesKey = (projectId) => `project_categories_${projectId}`;
const getProjectSubcategoriesStorageKey = (projectId, categoryId) => `project_subcategories_${projectId}_${categoryId}`;
const getCategoryStorageKey = (projectId) => `activeCategoryId_${projectId}`;
const getSubcategoryStorageKey = (projectId, categoryId) => `activeSubcategoryId_${projectId}_${categoryId}`;

const readProjectCategories = (projectId) => {
    try {
        const raw = localStorage.getItem(getProjectCategoriesKey(projectId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const readProjectSubcategories = (projectId, categoryId) => {
    try {
        const raw = localStorage.getItem(getProjectSubcategoriesStorageKey(projectId, categoryId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
};

const ensureTreeState = (state, projectId) => {
    state.expandedCategories = state.expandedCategories || {};
    state.expandedSubcategories = state.expandedSubcategories || {};
    state.expandedCategories[projectId] = state.expandedCategories[projectId] || {};
    state.expandedSubcategories[projectId] = state.expandedSubcategories[projectId] || {};
};

const getActiveCategoryId = (projectId) => {
    const storedCategoryId = Number(localStorage.getItem(getCategoryStorageKey(projectId)));
    return Number.isFinite(storedCategoryId) && storedCategoryId > 0 ? storedCategoryId : 0;
};

const getActiveSubcategoryId = (projectId, categoryId) => {
    const storedSubcategoryId = Number(localStorage.getItem(getSubcategoryStorageKey(projectId, categoryId)));
    return Number.isFinite(storedSubcategoryId) && storedSubcategoryId > 0 ? storedSubcategoryId : 0;
};

const toggleCategoryBranch = (state, projectId, categoryId, shouldOpen) => {
    ensureTreeState(state, projectId);

    const nextCategoryMap = { ...state.expandedCategories[projectId] };
    Object.keys(nextCategoryMap).forEach((id) => {
        if (String(id) !== String(categoryId)) {
            nextCategoryMap[id] = false;
        }
    });

    nextCategoryMap[categoryId] = shouldOpen;
    state.expandedCategories[projectId] = nextCategoryMap;

    if (!shouldOpen) {
        delete state.expandedSubcategories[projectId][categoryId];
    } else {
        state.expandedSubcategories[projectId][categoryId] = state.expandedSubcategories[projectId][categoryId] || {};
    }
};

const toggleSubcategoryBranch = (state, projectId, categoryId, subcategoryId, shouldOpen) => {
    ensureTreeState(state, projectId);

    const nextSubcategoryMap = { ...state.expandedSubcategories[projectId][categoryId] };
    Object.keys(nextSubcategoryMap).forEach((id) => {
        if (String(id) !== String(subcategoryId)) {
            nextSubcategoryMap[id] = false;
        }
    });

    nextSubcategoryMap[subcategoryId] = shouldOpen;
    state.expandedSubcategories[projectId][categoryId] = nextSubcategoryMap;
};

export const renderProjectsList = (container, projects, activeProjectId, state, actions = {}) => {
    container.innerHTML = '';
    state.expandedCategories = state.expandedCategories || {};
    state.expandedSubcategories = state.expandedSubcategories || {};

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
        const activeCategoryId = getActiveCategoryId(project.id);
        const activeSubcategoryId = activeCategoryId ? getActiveSubcategoryId(project.id, activeCategoryId) : 0;

        categories.forEach((category) => {
            const categoryGroup = createElement('div', 'submenu-category-group');
            const isExpanded = Boolean(state.expandedCategories[project.id]?.[category.id]) || Number(activeCategoryId) === Number(category.id);

            const categoryItem = createElement('div', 'submenu-item category-item');
            categoryItem.dataset.projectId = project.id;
            categoryItem.dataset.categoryId = category.id;
            categoryItem.dataset.categoryName = category.name;

            const categoryChevron = createElement('span', 'category-chevron');
            categoryChevron.textContent = isExpanded ? '▼' : '▶';
            categoryItem.appendChild(categoryChevron);

            const categoryText = createElement('span', 'category-text', category.name);
            categoryItem.appendChild(categoryText);

            if (
                state.activeSection === 'categories' &&
                state.activeProjectId === project.id &&
                Number(activeCategoryId) === Number(category.id)
            ) {
                categoryItem.classList.add('active-sub');
            }

            categoryItem.addEventListener('click', async () => {
                const nextExpandedState = !Boolean(state.expandedCategories[project.id]?.[category.id]);
                toggleCategoryBranch(state, project.id, category.id, nextExpandedState);

                if (actions.onCategorySelect) {
                    await actions.onCategorySelect(project, category);
                }

                renderProjectsList(container, projects, state.activeProjectId, state, actions);
            });

            categoryGroup.appendChild(categoryItem);

            const subcategories = readProjectSubcategories(project.id, category.id);
            const subcategoryList = createElement('div', 'submenu-subcategories');

            if (isExpanded && subcategories.length > 0) {
                subcategories.forEach((subcategory) => {
                    const subcategoryItem = createElement('div', 'submenu-subitem');
                    subcategoryItem.dataset.projectId = project.id;
                    subcategoryItem.dataset.categoryId = category.id;
                    subcategoryItem.dataset.subcategoryId = subcategory.id;

                    const subcategoryChevron = createElement('span', 'subcategory-chevron');
                    subcategoryChevron.textContent = '▶';
                    subcategoryItem.appendChild(subcategoryChevron);

                    const subcategoryText = createElement('span', 'subcategory-text', subcategory.name || 'Unnamed subcategory');
                    subcategoryItem.appendChild(subcategoryText);

                    const isSelectedSubcategory = Number(activeCategoryId) === Number(category.id) && Number(activeSubcategoryId) === Number(subcategory.id);
                    const isExpandedSubcategory = Boolean(
                        state.expandedSubcategories[project.id]?.[category.id]?.[subcategory.id]
                    ) || isSelectedSubcategory;

                    if (isSelectedSubcategory || isExpandedSubcategory) {
                        subcategoryItem.classList.add('active-subcategory');
                    }

                    const nestedChildren = createElement('div', 'submenu-subchildren');
                    if (isSelectedSubcategory || isExpandedSubcategory) {
                        nestedChildren.classList.add('expanded');

                        const bugFolder = createElement('div', 'submenu-subchild', 'Bug Reports');
                        const testFolder = createElement('div', 'submenu-subchild', 'Test Cases');

                        bugFolder.addEventListener('click', async (event) => {
                            event.stopPropagation();
                            if (actions.onSubcategorySectionSelect) {
                                await actions.onSubcategorySectionSelect(project, category, subcategory, 'bugreports');
                            }
                        });

                        testFolder.addEventListener('click', async (event) => {
                            event.stopPropagation();
                            if (actions.onSubcategorySectionSelect) {
                                await actions.onSubcategorySectionSelect(project, category, subcategory, 'testcases');
                            }
                        });

                        nestedChildren.appendChild(bugFolder);
                        nestedChildren.appendChild(testFolder);
                    }

                    subcategoryItem.addEventListener('click', async () => {
                        const currentExpanded = Boolean(state.expandedSubcategories[project.id]?.[category.id]?.[subcategory.id]);
                        const nextExpandedState = !currentExpanded;

                        toggleSubcategoryBranch(state, project.id, category.id, subcategory.id, nextExpandedState);

                        if (nextExpandedState) {
                            localStorage.setItem(getSubcategoryStorageKey(project.id, category.id), String(subcategory.id));
                        } else {
                            localStorage.removeItem(getSubcategoryStorageKey(project.id, category.id));
                        }

                        if (actions.onSubcategorySelect) {
                            await actions.onSubcategorySelect(project, category, subcategory);
                        }

                        renderProjectsList(container, projects, state.activeProjectId, state, actions);
                    });

                    subcategoryList.appendChild(subcategoryItem);
                    if (nestedChildren.childElementCount > 0) {
                        subcategoryList.appendChild(nestedChildren);
                    }
                });
            } else if (isExpanded && Number(activeCategoryId) === Number(category.id)) {
                const emptyItem = createElement('div', 'submenu-subitem submenu-subitem-empty');
                const emptyChevron = createElement('span', 'subcategory-chevron');
                emptyChevron.textContent = '▶';
                const emptyText = createElement('span', 'subcategory-text', 'No subcategories');
                emptyItem.appendChild(emptyChevron);
                emptyItem.appendChild(emptyText);
                subcategoryList.appendChild(emptyItem);
            }

            if (subcategoryList.children.length > 0) {
                categoryGroup.appendChild(subcategoryList);
            }

            submenu.appendChild(categoryGroup);
        });

        projectWrap.appendChild(projectHeader);
        projectWrap.appendChild(submenu);
        container.appendChild(projectWrap);

        projectHeader.addEventListener('click', async () => {
            state.expanded[project.id] = !state.expanded[project.id];
            renderProjectsList(container, projects, state.activeProjectId, state, actions);

            if (actions.onProjectSelect) {
                await actions.onProjectSelect(project);
            }
        });
    });
};
