**Step-by-step plan (pseudocode):**

1. **Analyze Dashboard Features:**

- Review `/src/components/dashboard` and `/src/hooks/dashboard` to infer dashboard page features.
- Identify user-observable behaviors and flows (not implementation details).

2. **List Integration Test Ideas (for Playwright):**

- Cover main dashboard user journeys and edge cases.
- Focus on real component rendering, service-level mocking, and user interactions.
- Ensure accessibility and error handling are considered.

3. **Output:**

- A list of Playwright integration test ideas for the dashboard page, each with a short description of the user scenario and what to verify.

---

### Dashboard Integration Test Ideas (Playwright)

#### 1. Dashboard Loads and Renders Main Sections

- **Scenario:** User visits the dashboard page.
- **Verify:**
  - Dashboard header is visible.
  - Summary cards (e.g., plant count, care status) are rendered.
  - Plant garden section is present.
  - No errors or loading spinners remain after data loads.

#### 2. Shows Empty State When No Plants Exist

- **Scenario:** User with no registered plants visits dashboard.
- **Verify:**
  - Empty garden component or message is shown.
  - No plant cards or garden grid is rendered.
  - Option to add/register a plant is visible.

#### 3. Plant Garden Renders with Multiple Plants

- **Scenario:** User with several plants in different containers.
- **Verify:**
  - Each plant group/container is displayed.
  - Plant cards show correct names, stages, and icons.
  - Garden header displays correct counts.

#### 4. Summary Cards Reflect Real Data

- **Scenario:** Dashboard loads with care/observation/fertilization/watering tasks.
- **Verify:**
  - Care status card shows correct overdue/upcoming counts.
  - Plant count card matches number of plants.
  - Clicking summary cards navigates to relevant detail pages.

#### 5. Stage Alert Card Appears for Plants in Critical Stages

- **Scenario:** At least one plant is in a stage that triggers an alert.
- **Verify:**
  - Stage alert card is visible with correct message.
  - Dismissing the alert hides it.

#### 6. Task Cards Show and Interact Correctly

- **Scenario:** User has upcoming tasks (watering, fertilization, observation).
- **Verify:**
  - Task cards are rendered with correct due dates and plant names.
  - Marking a task as complete updates UI and removes/completes the task.

#### 7. Handles Loading and Error States Gracefully

- **Scenario:** API is slow or returns an error.
- **Verify:**
  - Loading spinners are shown while waiting.
  - Error message is displayed if data fetch fails.
  - Retry button works and reloads data.

#### 8. Accessibility: All Interactive Elements Are Reachable

- **Scenario:** User navigates dashboard with keyboard.
- **Verify:**
  - All buttons/links are focusable.
  - ARIA labels/roles are present on summary cards, alerts, and task actions.

#### 9. Responsive Layout

- **Scenario:** User resizes window or uses mobile device.
- **Verify:**
  - Dashboard layout adapts (cards stack, garden grid collapses, etc.).
  - No content is cut off or inaccessible.

#### 10. Hidden Groups/Containers Feature

- **Scenario:** User hides a plant group/container.
- **Verify:**
  - Hidden group is not shown in garden.
  - Option to unhide is available and works.

#### 11. Dashboard Navigation

- **Scenario:** User clicks navigation links from dashboard.
- **Verify:**
  - Navigates to plants, care, observation, or settings pages.
  - Dashboard state is preserved on return.

---

**These scenarios can be used to write Playwright integration tests for your dashboard page, ensuring real user flows and observable behaviors are covered.**
