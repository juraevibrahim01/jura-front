import { initDashboard } from './Dashboard.mjs';
import { renderHeader } from '../../widgest/Header/header.mjs';

// Dashboard layout
export const homePage = `
    <div class="dashboard-root">
        <div class="dashboard-body">
            <aside id="dashboard-sidebar" class="dashboard-sidebar"></aside>
                <main id="dashboard-main" class="dashboard-main">
                    <nav class="breadcrumb" id="breadcrumb">Jura</nav>
                    <div id="main-content"></div>
            </main>
        </div>
    </div>`;

const header = document.getElementById('header');

export const initHomePage = async () => {
    await initDashboard();
};
renderHeader(header);

