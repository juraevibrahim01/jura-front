import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

// Получить Багрепорты проекта или конкретный Багрепорт по ID
export const getBugReport = async (project_id, id = null, subcategoryId = null, categoryId = null) => {
    try {
        const headers = {
            'X-User-UserID': '1',
            'X-User-Email': 'juraevibrahim01@gmail.com'
        };

        // Если указана подкатегория — использовать её endpoints
        if (subcategoryId) {
            const base = `/projects/${project_id}/categories/${categoryId || ''}/subcategories/${subcategoryId}/tickets`;
            if (base.includes('/categories//')) {
                return id ? null : [];
            }

            const endpoint = id ? `${base}/${id}` : base;
            const response = await fetchJson(endpoint, { method: 'GET', headers });

            // Если запрос вернул список
            if (!id) {
                return Array.isArray(response?.tickets)
                    ? response.tickets
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];
            }

            // Если запрос вернул объект тикета
            return response?.tickets ?? response?.ticket ?? response?.data ?? response ?? null;
        }

        // Без подкатегории — использовать проектные endpoints
        if (!id) {
            const response = await fetchJson(`/projects/${project_id}/tickets`, { method: 'GET', headers });
            return Array.isArray(response?.tickets)
                ? response.tickets
                : Array.isArray(response?.data)
                    ? response.data
                    : [];
        }

        // Если указан ID — запросить конкретный тикет по проекту
        const itemResponse = await fetchJson(`/projects/${project_id}/tickets/${id}`, { method: 'GET', headers });
        return itemResponse?.tickets ?? itemResponse?.ticket ?? itemResponse?.data ?? itemResponse ?? null;
    } catch (error) {
        console.error(`Error fetching Bugreports ${id}:`, error);
        return id ? null : [];
    }
};

// Создать новый багрепорт
export const createBugreport = async (request) => {
    try {
        // Отправить запрос с данными багрепорта в body и ID пользователя/проекта в headers
        const response = await fetchJson(`/projects/${request.projectId}/categories/${request.categoryId}/subcategories/${request.subcategoryId}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-UserID': request.userId || '1',
                'X-User-Email': 'juraevibrahim01@gmail.com'
            },
            body: JSON.stringify({
                title: request.title,
                priority: request.priority,
                severity: request.severity,
                environment: request.environment,
                steps: request.steps,
                expected_result: request.expected_result,
                actual_result: request.actual_result,
                attachments: request.attachments || "",
            })
        });
        return response;
    } catch (error) {
        console.error('Error creating bugreport:', error);
        return null;
    }
};

