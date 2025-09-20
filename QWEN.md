# Qwen Code Configuration

This file contains project-specific configurations for Qwen Code to enhance our development workflow. **All code generation must follow the comprehensive guidelines in `coding_Doc.md` and all testing must follow patterns defined in `testing_Doc.md`.**

## Project Information
- **Project Name**: Smart Garden App - Plant care management PWA
- **Architecture**: Clean Architecture with React/TypeScript frontend and Firebase backend
- **Main Technologies**:
  - **Frontend**: React 19, TypeScript 5.x, Vite, TailwindCSS
  - **Backend**: Firebase (Firestore, Auth, Functions)
  - **State Management**: Zustand + TanStack Query for server state
  - **Testing Stack**: Vitest + Storybook + Playwright + MSW
  - **UI Components**: Radix UI + Custom design system

## Core Development Guidelines

### Code Standards
**MUST follow `coding_Doc.md` for all code generation**, including:
- React 19 patterns with modern hooks (use(), useActionState, etc.)
- TypeScript 5.x with strict mode and branded types
- Clean Architecture with proper layer separation
- Functional programming patterns with immutable updates
- Performance optimization with React.memo, useMemo, useCallback
- Comprehensive error handling and accessibility (WCAG 2.1)

### Testing Standards
**MUST follow `testing_Doc.md` for all test generation**, including:
- **Unit/Integration**: Vitest with REAL components and SERVICE-level mocking
- **Component States**: Storybook stories with MSW for visual testing
- **E2E Workflows**: Playwright for complete user journeys
- **NEVER mock components being tested** - always test real components
- **Mock external services** (Firebase, APIs) not internal components
- TypeScript-safe test patterns with proper typing

## Smart Garden App Domain Specifics

### Domain Concepts
- **Plants**: Individual plant instances with variety, location, container
- **Care Activities**: Watering, fertilizing, observing, thinning, harvesting
- **Plant Groups**: Plants grouped by variety + container for bulk operations
- **Care Status**: Automated scheduling based on plant protocols and last activities
- **Plant Protocols**: Variety-specific care schedules and requirements

### Key Component Patterns
- **Dashboard**: Complex composition with multiple hooks and real-time data
- **Plant Management**: CRUD operations with Firebase integration
- **Care Logging**: Form-heavy components with validation and photo upload
- **Mobile-First**: Touch-friendly interfaces with responsive design

### Service Architecture
```
Frontend (React) → Custom Hooks → Services → Firebase
                 ↓                    ↓
              UI Components ← MSW Mocks (in tests)
```

## Testing Strategy for Smart Garden App

### Component Testing Approach
1. **Dashboard-like complex components**: Test hook coordination and business logic
2. **Form components**: Test validation, submission, and error handling
3. **List components**: Test filtering, sorting, and bulk operations
4. **Modal components**: Test accessibility and focus management

### Data Flow Testing
- **Plant state changes** propagating through dashboard
- **Care activity logging** updating plant status
- **Real-time Firebase updates** reflected in UI
- **Offline/online synchronization** handling

## Development Preferences
- **Clear, concise explanations** with domain context
- **Follow existing patterns** especially in plant/care domain logic
- **Functional programming** with immutable plant data updates
- **Descriptive naming** using domain terminology (plants, activities, protocols)
- **Comments for complex logic** especially care scheduling algorithms
- **Modular, reusable code** with proper TypeScript interfaces

## File Organization
```
src/
├── components/
│   ├── dashboard/     # Dashboard-specific components
│   ├── plant/         # Plant management components
│   ├── care/          # Care activity components
│   └── ui/            # Shared UI components
├── hooks/
│   ├── dashboard/     # Dashboard-specific hooks
│   ├── plant/         # Plant management hooks
│   └── care/          # Care activity hooks
├── services/
│   ├── firebase/      # Firebase service layer
│   └── plant/         # Plant domain services
└── types/
    ├── plant.ts       # Plant domain types
    └── care.ts        # Care activity types
```

## Critical Reminders for AI Assistants

1. **ALWAYS reference `coding_Doc.md`** for React/TypeScript patterns
2. **ALWAYS reference `testing_Doc.md`** for testing strategies
3. **NEVER mock components** being tested - use real components with service mocking
4. **Test user-observable behavior**, not implementation details
5. **Use domain terminology** (plants, care activities, protocols) consistently
6. **Consider mobile/touch interactions** for all UI components
7. **Handle Firebase real-time updates** and offline scenarios
8. **Follow clean architecture** with proper service layer separation

This configuration ensures all AI assistants understand the project's complexity, follow established patterns, and maintain consistency with the comprehensive documentation in `coding_Doc.md` and `testing_Doc.md`.