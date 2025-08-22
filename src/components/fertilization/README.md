# Fertilization Dashboard Component

## Overview

The `FertilizationDashboardSection` component displays fertilization tasks with intelligent filtering to show only relevant tasks to users.

## Filtering Logic

### 3-Day Window Rule

The dashboard only shows fertilization tasks that fall within a **3-day window**:

- **Past tasks**: Up to 3 days ago (inclusive)
- **Today's tasks**: All tasks due today
- **Future tasks**: Up to 3 days from today (inclusive)

### Why This Filtering?

1. **Reduces clutter**: Long-term plants (like strawberries) can have 90+ fertilization tasks over their lifetime
2. **Improves focus**: Users only see actionable tasks that need attention soon
3. **Maintains relevance**: Tasks older than 3 days are likely either completed or missed

### Task Categories

Tasks within the 3-day window are categorized as:

1. **Overdue** (red badge): Tasks past due but not logged
2. **Due Today** (orange badge): Tasks scheduled for today
3. **Upcoming** (green): Tasks due within next 3 days

### User Experience Features

- **Smart counts**: Badge shows only relevant tasks, not total tasks
- **Schedule indicator**: Shows "(X more in schedule)" when tasks are filtered out
- **Clickable workflow**: Click task → navigate to log-care → product pre-selected
- **Expand/collapse**: "View All" button to see more upcoming tasks within the window

## Example Scenarios

### Scenario 1: New Lettuce Plant
- **Day 1**: Plant created, no fertilization tasks visible yet
- **Day 25**: First fertilization task appears (within 3-day window of due date)
- **Day 28**: Task becomes overdue if not completed
- **Day 31**: Task disappears from dashboard (outside 3-day window)

### Scenario 2: Mature Strawberry Plant
- **Day 120+**: Regular weekly Neptune's Harvest tasks
- **Dashboard shows**: Only next 1-2 upcoming tasks + any overdue
- **Hidden**: The remaining 80+ future fertilization tasks
- **Indicator**: "(87 more in schedule)" to show total tasks exist

## Technical Implementation

```typescript
// 3-day window calculation
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const threeDaysFromNow = new Date(todayStart);
threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 4); // Start of day 4

const threeDaysAgo = new Date(todayStart);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Start of 3 days ago

// Filter tasks within window
const relevantTasks = tasks.filter((task) => {
  const taskDate = new Date(task.dueDate);
  taskDate.setHours(0, 0, 0, 0);
  return taskDate >= threeDaysAgo && taskDate < threeDaysFromNow;
});
```

## Benefits

- **Actionable interface**: Users see only tasks requiring immediate attention
- **Reduced overwhelm**: Long fertilization schedules don't flood the dashboard
- **Better completion rates**: Focused view encourages timely task completion
- **Automatic cleanup**: Old missed tasks naturally disappear after 3 days