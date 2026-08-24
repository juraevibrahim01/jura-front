export const ROUTES = {
    home: '/',
    projectList: '/projects',
    projectDetails: '/projects/:projectId',
    projectCategories: '/projects/:projectId/categories',
    projectCategory: '/projects/:projectId/categories/:categoryId',
    projectSubcategory: '/projects/:projectId/categories/:categoryId/subcategories/:subcategoryId',
};

export const buildProjectRoute = (projectId) => `/projects/${encodeURIComponent(projectId)}`;
export const buildProjectCategoriesRoute = (projectId) => `/projects/${encodeURIComponent(projectId)}/categories`;
export const buildProjectCategoryRoute = (projectId, categoryId) => `/projects/${encodeURIComponent(projectId)}/categories/${encodeURIComponent(categoryId)}`;
export const buildProjectSubcategoryRoute = (projectId, categoryId, subcategoryId) => `/projects/${encodeURIComponent(projectId)}/categories/${encodeURIComponent(categoryId)}/subcategories/${encodeURIComponent(subcategoryId)}`;

export const setCurrentRoute = (route, state = {}) => {
    if (typeof window === 'undefined') return route;
    const url = new URL(route, window.location.origin);
    window.history.pushState(state, '', `${url.pathname}${url.search}`);
    return `${url.pathname}${url.search}`;
};
