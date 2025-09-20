Phase 1A: Foundation Dependencies (Week 1)

Critical Testing Order - Dependency Chain First

Utility Testing (Proper Dependency Order)

1. plantGrouping.ts - Core grouping algorithms (no dependencies)
2. containerGrouping.ts - Container-based grouping (depends on plantGrouping)
3. findContainerMates - Complex relationships (depends on both above)

Service Layer Foundation

1. Firebase Core Services:

- Batch operations testing
- Authentication state management
- Database connection handling

2. TaskManagementService.bulkRegenerateTasksForPlants - Critical dashboard sync function
3. Individual Services:

- plantService - CRUD operations
- varietyService - Seed data management
- careActivityService - Activity logging

Phase 1B: Hook Dependency Chain (Week 1-2)

Respect Hook Interdependencies

Testing Order Based on Dependencies

1. useDashboardData (foundation) - Provides getUpcomingFertilizationTasks
2. useCareStatus - Depends on getUpcomingFertilizationTasks from above
3. useAllUpcomingTasks - Combines all task logic
4. Task-specific hooks - useFertilizationTasks, useWateringTasks, useObservationTasks

Mocking Strategy for Hook Dependencies

- Maintain real dependency relationships in tests
- Mock at service layer, not hook layer
- Test hook integration with actual dependency flow

Phase 2: Enhanced Component States (Week 2)

Storybook with Synthetic Data

Performance Stories with Data Generators

- Synthetic data generators for 50+ plants (no Firebase dependency)
- Configurable plant collection sizes - 10, 25, 50, 100+ plants
- Performance measurement addon - Track render times, memory usage

Error-Focused Stories

- Network timeout scenarios - MSW delayed responses
- Authentication state transitions - Login/logout within stories
- Partial data failures - Mixed success/error responses

Bulk Modal Comprehensive Coverage

- All selection combinations - Single, multiple, container mates
- Edge cases - No plants, all plants selected, mixed containers

Phase 3: Integration with Auth Cycles (Week 3)

Playwright with Real State Management

Authentication State Testing

- Login/logout cycles - Dashboard refresh behavior
- Session expiration - Auto-logout and re-authentication
- User switching - Different user data loading

Mobile-Specific Integration

- Touch interactions - Bulk selection via touch
- Responsive layouts - Dashboard adaptation across screen sizes
- Offline/online transitions - Network state changes

Complex Workflow Integration

- Bulk Activity Modal E2E - Complete workflow with Firebase
- Dashboard sync scenarios - Protocol updates, data refresh
- Concurrent user operations - Multi-device simulation

Phase 4: Performance & Edge Cases (Week 4)

Large Dataset Scenarios

- Database seeded with 100+ plants - Real performance testing
- Memory leak detection - Long-running dashboard sessions
- Network performance - Slow connections, high latency

Advanced Integration Scenarios

- Real Firebase sync testing - Live database operations
- Visual regression pipeline - Automated UI consistency
- Accessibility compliance - Full dashboard navigation

Technical Implementation Details

Dependency Chain Testing Strategy

useDashboardData (base) → useCareStatus (depends on fertilization tasks)
→ useAllUpcomingTasks (combines all)  
 → Task-specific hooks (use combined data)

Service Layer Mocking Approach

- Mock Firebase at SDK level - Maintain service contracts
- Preserve business logic - Keep hook interdependencies real
- Test integration points - Service-to-hook boundaries

Performance Testing Framework

- Storybook: Synthetic data generators for UI performance
- Playwright: Real database with large datasets for E2E performance
- Vitest: Hook performance with large data sets

Risk Mitigation

1. Complex Hook Dependencies - Test dependency chain integrity
2. Firebase State Management - Authentication state consistency
3. Bulk Operations - Transaction integrity and error handling
4. Performance Scaling - Large garden performance degradation

This refined approach respects the natural dependency flow, maintains realistic testing relationships, and addresses│ │
the authentication state management critical for dashboard functionality.
