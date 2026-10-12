import { fetchJson } from './api.mjs';

const getHeaders = () => ({
    'X-User-UserID': '1',
    'X-User-Email': 'juraevibrahim01@gmail.com'
});

export const getProjectCategories = async (projectId) => {
    try {
        const response = await fetchJson(`/project/${projectId}/categories`, {
            method: 'GET',
            headers: getHeaders()
        });

        return Array.isArray(response?.categories) ? response.categories : [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const createProjectCategory = async (projectId, name) => {
    if (!projectId || !name || !String(name).trim()) return null;

    try {
        const response = await fetchJson(`/project/${projectId}/categories`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: String(name).trim() })
        });

        return response?.category || response?.data || response || null;
    } catch (error) {
        console.error('Error creating category:', error);
        return null;
    }
};

export const getCategorySubcategories = async (projectId, categoryId) => {
    if (!projectId || !categoryId) return [];

    const endpoint = `/category/${categoryId}/subcategories`;

    try {
        const response = await fetchJson(endpoint, {
            method: 'GET',
            headers: getHeaders()
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

export const createCategorySubcategory = async (categoryId, name) => {
    if (!categoryId || !name || !String(name).trim()) return null;

    try {
        const response = await fetchJson(`/category/${categoryId}/subcategories`, {
            method: 'POST',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: String(name).trim() })
        });

        return response?.subcategory || response?.data || response || null;
    } catch (error) {
        console.error('Error creating subcategory:', error);
        return null;
    }
};

export const deleteProjectCategory = async (projectId, categoryId) => {
    if (!projectId || !categoryId) return null;

    try {
        const response = await fetchJson(`/project/${projectId}/categories`, {
            method: 'DELETE',
            headers: {
                ...getHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: categoryId })
        });

        return response || null;
    } catch (error) {
        console.error('Error deleting category:', error);
        return null;
    }
};
