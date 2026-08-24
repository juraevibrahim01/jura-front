# Project logic overview

## 1. Project structure

Main entry:
- `main.mjs` — bootstraps the app and initializes the home page.
- `src/pages/HomePage/HomePage.mjs` — renders the dashboard shell.
- `src/pages/HomePage/Dashboard.mjs` — main project logic: project → category → subcategory flow and data rendering.
- `src/pages/HomePage/ProjectSidebar.mjs` — sidebar with project items and categories action.
- `src/api/projectapi.mjs` — project, category and subcategory requests.

## 2. Data flow

### Projects
- Source: `getProjects()`
- Endpoint: `GET /projects`
- Result: project list.

### Project metrics
- Source: `getProjectMetrics(projectId)`
- Endpoint: `GET /project/${projectId}`
- Result: project name and totals.

### Categories under project
- Source: `getProjectCategories(projectId)`
- Endpoint: `GET /projects/${projectId}/categories`
- Result: list of categories.
- Active category is saved in `localStorage` by key: `activeCategoryId_<projectId>`.

### Subcategories under category
- Source: `getCategorySubcategories(projectId, categoryId)`
- Endpoint: `GET /projects/${projectId}/categories/${categoryId}/subcategories`
- Result: list of subcategories.
- Active subcategory is saved per project/category by key: `activeSubcategoryId_<projectId>_<categoryId>`.

### Bug reports and test cases under subcategory
- Source: `getBugReport(projectId, null, subcategoryId)` and `getTestKey(projectId, null, subcategoryId)`
- Used only when a subcategory is selected.
- These lists are rendered under the chosen subcategory, not under the project itself.

## 3. Dashboard flow

Required flow:
1. Select a project.
2. Show project and its categories.
3. Select a category.
4. Show subcategories for that category.
5. Select a subcategory.
6. Render Bug Reports and Test Cases under that subcategory.

The project-level Bug Reports and Test Cases screens are intentionally not shown in the main dashboard anymore.

## 4. Sidebar logic

The project submenu should contain only the category action for the selected project.

The UI should not open project-level bug reports or test cases directly from the sidebar; those are shown only after selecting a subcategory.

## 5. Routes

Defined in `src/app/routes/routes.mjs`.

Available helpers:
- `buildProjectRoute(projectId)`
- `buildProjectCategoriesRoute(projectId)`
- `buildProjectCategoryRoute(projectId, categoryId)`
- `buildProjectSubcategoryRoute(projectId, categoryId, subcategoryId)`

These are placeholder routes for later integration with the real router.

## 6. Important notes

- Requests go to `https://jura-1-llep.onrender.com`.
- State is stored in `localStorage`.
- The flow is intentionally hierarchical: project → category → subcategory.
- Bug reports and test cases are considered child-content of the selected subcategory.
