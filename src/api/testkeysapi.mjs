import { fetchJson } from './api.mjs';

const PROJECTS_STORAGE_KEY = 'projects';

// Получить тест-кейсы проекта или конкретный тест-кейс по ID
export const getTestKey = async (project_id, id) => {
    try {
        if (!id) {
            // Без ID → получить все тест-кейсы проекта
            const response = await fetchJson(`/projects/${project_id}/test-cases`, {
                    method: 'GET',
                    headers: {
                        'X-User-UserID': '1',
                        'X-User-Email': 'juraevibrahim01@gmail.com'
                    }
                });
            return response.test_keys || [];
        } else {
            // С ID → получить конкретный тест-кейс
            const response = await fetchJson(`/projects/${project_id}/test-cases/${id}`, {
                method: 'GET',
                headers: { 
                'X-User-UserID': '1',
                'X-User-Email': 'juraevibrahim01@gmail.com'
                }
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

