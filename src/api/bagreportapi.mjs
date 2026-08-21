import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

// Получить Багрепорты проекта или конкретный Багрепорт по ID
export const getBugReport = async (project_id, id) => {
    try {
        if (!id) {
            // Без ID → получить все Багрепорты проекта
            const response = await fetchJson(`/projects/${project_id}/tickets`, {
                method: 'GET',
                headers: {
                    'X-User-UserID': '1',
                    'X-User-Email': "juraevibrahim01@gmail.com"
                }
            });
            return response.tickets || [];
        } else {
            // С ID → получить конкретный багрепорт
            const response = await fetchJson(`/projects/${project_id}/tickets/${id}`, {
                method: 'GET',
                headers: { 
                    'X-User-UserID': '1',
                    'X-User-Email': "juraevibrahim01@gmail.com"
                }
            });

            console.log(response);

            return response;
        }
    } catch (error) {
        console.error(`Error fetching Bugreports ${id}:`, error);
        return id ? null : [];
    }
};

// Создать новый багрепорт
export const createTestKey = async (request) => {
    try {
        // Отправить запрос с данными тест-кейса в body и ID пользователя/проекта в headers
        const response = await fetchJson(`/projects/${request.projectId}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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

