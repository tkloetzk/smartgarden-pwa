# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartGarden is a Progressive Web Application for managing indoor gardening with scientifically-backed growing protocols, offline-first plant tracking, and intelligent care scheduling. The app combines React 18 with Firebase for cloud sync and IndexedDB (via Dexie.js) for offline-first functionality.

## Development Commands

### Core Commands
- `npm run dev` - Start development server with Vite
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run lint` - Run ESLint on TypeScript files
- `npm run preview` - Preview production build

### Testing Commands
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests for CI (no watch mode)
- `npm run test:debug` - Run tests in debug mode with verbose output
- `npm run test:e2e` - Run Playwright end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI
- `npm run test:all` - Run both unit and E2E tests

### Development Tools
- `npm run dev:watch` - Run dev server with test watcher
- `npm run test:preview` - Start Jest preview for visual test debugging

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Radix UI components
- **State Management**: React hooks + custom hooks for Firebase integration
- **Database**: Dual-layer architecture:
  - Firebase Firestore for cloud sync and multi-device access
  - IndexedDB via Dexie.js for offline-first functionality
- **PWA**: Service Worker + Web App Manifest via vite-plugin-pwa
- **Testing**: Jest + React Testing Library + Playwright

### Key Architectural Patterns

#### Offline-First Design
The app uses a dual-database architecture:
- **Primary**: IndexedDB (Dexie.js) for offline functionality
- **Secondary**: Firebase Firestore for cloud sync
- Data flows: Local operations → IndexedDB → Firebase sync

#### Service Layer Architecture
- **Services**: Business logic and data operations (`src/services/`)
- **Firebase Services**: Cloud data operations (`src/services/firebase/`)
- **Hooks**: React integration and state management (`src/hooks/`)

#### Growth Stage System
Core domain model centers around plant growth stages:
- **Base stages**: germination → seedling → vegetative → maturation
- **Category-specific stages**: Different plants have additional stages (flowering, fruiting, harvest)
- **Dynamic scheduling**: Care schedules adapt based on growth stage and plant history

### Directory Structure

#### Core Application
- `src/App.tsx` - Main app component with routing
- `src/components/` - Reusable UI components
- `src/pages/` - Page-level components
- `src/hooks/` - Custom React hooks
- `src/services/` - Business logic and data services
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions

#### Key Service Files
- `src/services/careSchedulingService.ts` - Core scheduling logic
- `src/services/firebase/` - Firebase integration services
- `src/services/smartDefaultsService.ts` - Intelligent defaults system
- `src/services/dynamicSchedulingService.ts` - Adaptive scheduling

#### Type System
- `src/types/core.ts` - Core domain types (GrowthStage, CareActivityType, etc.)
- `src/types/database.ts` - Database schema types
- `src/types/scheduling.ts` - Scheduling and task types

### Testing Strategy

#### Unit Tests
- **Location**: `src/__tests__/`
- **Pattern**: Co-located with source files
- **Tools**: Jest + React Testing Library
- **Focus**: Component behavior, service logic, utility functions

#### Integration Tests
- **Location**: `src/__tests__/integration/`
- **Focus**: Feature workflows, service integration
- **Examples**: Plant registration flow, care scheduling integration

#### E2E Tests
- **Location**: `tests/e2e/` (Note: may be in root)
- **Tool**: Playwright
- **Focus**: Complete user workflows

### Firebase Configuration

#### Environment Variables Required
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Authentication
- Uses Firebase Auth with email/password
- User context managed via `useFirebaseAuth` hook
- All data operations are user-scoped

### Key Development Patterns

#### Custom Hooks Pattern
- `useFirebasePlants` - Plant data with real-time sync
- `useFirebaseCareActivities` - Care activity tracking
- `useDynamicStage` - Growth stage calculations
- `useScheduledTasks` - Task scheduling and reminders

#### Service Pattern
- Services handle all business logic
- Hooks provide React integration
- Clear separation between data access and UI logic

#### Type-First Development
- Comprehensive TypeScript types in `src/types/`
- Domain-driven type hierarchy
- Strict type checking enabled

### Data Flow

1. **User Actions** → Components
2. **Components** → Custom Hooks
3. **Custom Hooks** → Services
4. **Services** → Firebase/IndexedDB
5. **Database Changes** → Real-time subscriptions → Hooks → Components

### PWA Features

- **Service Worker**: Automatic via vite-plugin-pwa
- **Offline Caching**: Images and static assets
- **App Installation**: Web App Manifest configured
- **Background Sync**: Via IndexedDB for offline operations

### Development Notes

#### Path Aliases
- `@/` maps to `src/`
- All imports use absolute paths from src root
- Jest configured with matching moduleNameMapper

#### Testing Utilities
- `src/__tests__/utils/testHelpers.tsx` - Common test utilities
- `src/__tests__/utils/testDataFactories.ts` - Test data generation
- Mock Firebase config for testing

#### Code Style
- ESLint configured for TypeScript + React
- Prettier integration via ESLint
- TailwindCSS for styling consistency