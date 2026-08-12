import { Button } from "../../shared/ui/Button/Button.mjs";

// -------------------------------- HomePage ------------------------------------------------------
export const homePage = `
    <section class="home-page">
        <div class="home-page-status">
            <div class="home-page-status_title">Total</div>
            <span class="home-page-status_value">0</span>
        </div>

        <div class="home-page-search">
            <input type="text" class="home-page-search_input" placeholder="Search test cases...">
        </div>

        <section class="home-page-test-cases">
            <div class="home-page-test-cases_not-found">
                <h3>No test cases found.</h3>
                <p>Create your first test case to get started.</p>
                <div class="home-page-test-cases_not-found_button">
                    ${Button}
                </div>
            </div>
        </section>
    </section>
`;
