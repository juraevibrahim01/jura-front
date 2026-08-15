import { createTestKey } from '../../../api/testkeysapi.mjs';
import { createTestKeyModal } from '../../../entities/test_keys/TestKeys.mjs'

// HTML кнопка "New Test Case"
export const Button = `<button id="crete_testKeys" class="not-found_button_create">New Test Case</button>`
// Инициализировать обработчики события кнопки
export const initButtonListeners = () => {
    const button = document.getElementById('crete_testKeys');
    button.addEventListener('click', () => {
        
        // При клике на кнопку → открыть модалку для создания
        const body = document.body;
        const modalHTML = createTestKeyModal();
        body.insertAdjacentHTML('beforeend', modalHTML);
        
        const modal = document.getElementById('testKeyModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelModal');
        const form = document.getElementById('testKeyForm');
        
        // Функция закрытия модалки
        const closeModal = () => {
            modal.remove();
        };
        
        // Закрытие при клике на X или Cancel
        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        
        // Закрытие при клике на черный фон (overlay)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Отправка формы при клике на "Create Test Case"
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Получить данные пользователя и проекта из localStorage
            const userId = localStorage.getItem('userId') || '1';
            const projectId = localStorage.getItem('activeProjectId') || '1'; // Сохранено при выборе проекта
            
            // Собрать данные из полей формы
            const formData = new FormData(form);
            const testKeyData = {
                Date: new Date().toISOString().split('T')[0], // Текущая дата
                Name: formData.get('Name'),
                Module: formData.get('Module'),
                Precondition: formData.get('Precondition'),
                Steps: formData.get('Steps'),
                ExpectationRes: formData.get('ExpectationRes'),
                ActualRes: formData.get('ActualRes') || '',
                Comment: formData.get('Comment') || '',
                userId: userId,
                projectId: projectId
            };
            
            try {
                // Отправить данные на сервер
                const result = await createTestKey(testKeyData);
                if (result) {
                    console.log('Test case created successfully:', result);
                    alert('Test case created successfully!');
                    closeModal(); // Закрыть модалку
                } else {
                    alert('Failed to create test case');
                }
            } catch (error) {
                console.error('Error creating test case:', error);
                alert('Error creating test case: ' + error.message);
            }
        });
    });
}
