import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

const hasRealNumericId = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

const buildTestCaseEndpoint = (projectId, categoryId = null, subcategoryId = null, testCaseId = null) => {
    const safeProjectId = projectId ?? '';
    const safeCategoryId = hasRealNumericId(categoryId) ? Number(categoryId) : null;
    const safeSubcategoryId = hasRealNumericId(subcategoryId) ? Number(subcategoryId) : null;
    const safeTestCaseId = hasRealNumericId(testCaseId) ? Number(testCaseId) : null;

    if (!safeProjectId) {
        return null;
    }

    if (safeTestCaseId !== null) {
        return `/projects/${safeProjectId}/test-cases/${safeTestCaseId}`;
    }

    if (safeCategoryId !== null && safeSubcategoryId !== null) {
        return `/projects/${safeProjectId}/categories/${safeCategoryId}/subcategories/${safeSubcategoryId}/test-cases`;
    }

    return `/projects/${safeProjectId}/test-cases`;
};

// Получить тест-кейсы проекта или конкретный тест-кейс по ID
export const getTestKey = async (project_id, id = null, subcategoryId = null, categoryId = null) => {
    try {
        const headers = {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        };

        if (id) {
            const endpoint = buildTestCaseEndpoint(project_id, categoryId, subcategoryId, id);
            const response = await fetchJson(endpoint, {
                method: 'GET',
                headers
            });
            return response?.test_key || response?.data || response || null;
        }

        const subcategoryPathIsValid = hasRealNumericId(categoryId) && hasRealNumericId(subcategoryId);

        if (subcategoryId && subcategoryPathIsValid) {
            const endpoint = buildTestCaseEndpoint(project_id, categoryId, subcategoryId);

            try {
                const response = await fetchJson(endpoint, {
                    method: 'GET',
                    headers
                });

                const items = Array.isArray(response?.test_keys)
                    ? response.test_keys
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

                if (items.length > 0 || response?.test_keys !== undefined || response?.data !== undefined) {
                    return items;
                }
            } catch (err) {
                // continue to fallback below
            }

            return [];
        }

        const endpoint = buildTestCaseEndpoint(project_id);
        const response = await fetchJson(endpoint, {
            method: 'GET',
            headers
        });
        return response?.test_keys || [];
    } catch (error) {
        console.error(`Error fetching test key ${id}:`, error);
        return id ? null : [];
    }
};

// Создать новый тест-кейс
export const createTestKey = async (request) => {
    try {
        if (!request?.projectId) {
            console.error('Missing projectId for creating test key');
            return null;
        }

        const endpoint = buildTestCaseEndpoint(request.projectId, request.categoryId, request.subcategoryId, true);

        if (!endpoint) {
            console.error('Invalid test key endpoint: missing projectId');
            return null;
        }

        // Отправить запрос с данными тест-кейса в body и ID пользователя/проекта в headers
        const response = await fetchJson(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': "juraevibrahim01@gmail.com",
                'X-User-UserID': request.userId || '1'
            },
            body: JSON.stringify({
                Date: request.Date || request.date || new Date().toISOString().split('T')[0],
                Name: request.Name,
                Module: request.Module,
                Precondition: request.Precondition,
                Steps: request.Steps,
                ExpectationRes: request.ExpectationRes,
                ActualRes: request.ActualRes || '',
                Comment: request.Comment || '',
                Status: request.Status || request.status || 'New'
            })
        });
        return response;
    } catch (error) {
        console.error('Error creating test key:', error);
        return null;
    }
};

