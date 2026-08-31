import { fetchJson } from './api.mjs';

export const getProjectCategories = async (projectId) => {
    try {
        const response = await fetchJson(`/project/${projectId}/categories`, {
            method: 'GET',
            headers: {
                'X-User-UserID': '1',
                'X-User-Email': 'juraevibrahim01@gmail.com'
            }
        });

        return Array.isArray(response?.categories) ? response.categories : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const getCategorySubcategories = async (projectId, categoryId) => {
    if (!projectId || !categoryId) return [];

    const endpoint = `/category/${categoryId}/subcategories`;

    try {
        const response = await fetchJson(endpoint, {
            method: 'GET',
            headers: {
                'X-User-UserID': '1',
                'X-User-Email': 'juraevibrahim01@gmail.com'
            }
        });

        const subcategories = Array.isArray(response?.subcategories)
            ? response.subcategories
            : Array.isArray(response?.data)
                ? response.data
                : [];

        return subcategories;
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return [];
    }
};
