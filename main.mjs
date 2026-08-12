import { homePage, initHomePage } from './src/pages/HomePage/HomePage.mjs';

const page = document.getElementById('page');
page.innerHTML = homePage;

// Initialize home page with async data loading
initHomePage().catch((error) => {
    console.error('Failed to initialize home page:', error);
});

