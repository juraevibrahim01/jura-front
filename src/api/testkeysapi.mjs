import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

// Получить тест-кейсы проекта или конкретный тест-кейс по ID
export const getTestKey = async (project_id, id = null, subcategoryId = null, categoryId = null) => {
    try {
        const headers = {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        };

        if (subcategoryId) {
            const candidateEndpoints = [
                `/projects/${project_id}/categories/${categoryId || ''}/subcategories/${subcategoryId}/test-cases`
            ].filter((endpoint) => endpoint && !endpoint.includes('/categories//'));

            for (const endpoint of candidateEndpoints) {
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
                    // continue to next candidate endpoint
                }
            }

            return [];
        }

        if (!id) {
            // Без ID → получить все тест-кейсы проекта
            const response = await fetchJson(`/projects/${project_id}/test-cases`, {
                    method: 'GET',
                    headers
                });
            return response?.test_keys || [];
        } else {
            // С ID → получить конкретный тест-кейс
            const response = await fetchJson(`/projects/${project_id}/test-cases/${id}`, {
                method: 'GET',
                headers
            });

            console.log(response);

            return response;
        }
    } catch (error) {
        console.error(`Error fetching test key ${id}:`, error);
        return id ? null : [];
    }
};

// Создать новый тест-кейс
export const createTestKey = async (request) => {
    try {
        // Отправить запрос с данными тест-кейса в body и ID пользователя/проекта в headers
        const response = await fetchJson(`/projects/${request.projectId}/test-cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': "juraevibrahim01@gmail.com",
                'X-User-UserID': request.userId || '1'
            },
            body: JSON.stringify({
                Date: request.Date,
                Name: request.Name,
                Module: request.Module,
                Precondition: request.Precondition,
                Steps: request.Steps,
                ExpectationRes: request.ExpectationRes,
                ActualRes: request.ActualRes,
                Comment: request.Comment
            })
        });
        return response;
    } catch (error) {
        console.error('Error creating test key:', error);
        return null;
    }
};

