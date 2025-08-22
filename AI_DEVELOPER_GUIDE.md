# 🤖 AI Developer Guide for SmartGarden PWA

This guide provides essential information for AI coding assistants (like GitHub Copilot, Cursor, Continue.dev, etc.) to effectively work with the SmartGarden PWA codebase.

## 🏗️ Project Overview

SmartGarden is a Progressive Web Application for managing indoor gardening with:

- Offline-first plant tracking
- Growth stage management
- Care scheduling
- Scientific growing protocols

## 🗂️ Codebase Structure

```
src/
├── __tests__/          # Test files (unit, integration, e2e)
├── assets/             # Static assets (images, icons, etc.)
├── components/         # Reusable UI components
├── config/             # App configuration and constants
├── db/                 # Database models and utilities
├── hooks/              # Custom React hooks
├── lib/                # Shared utilities and helpers
├── pages/              # Page components
├── services/           # API and service layer
└── stores/             # State management (Zustand)
```

## 🛠️ Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Naming**: Use descriptive names with TypeScript types
- **Components**: Functional components with TypeScript interfaces
- **Styling**: TailwindCSS utility classes with `@apply` for repeated styles

### State Management

- Use **Zustand** for global state
- Keep state minimal and colocated when possible
- Use selectors for derived state

### Testing

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Cypress
- **Test Naming**: `[component].test.tsx`
- **Coverage**: Aim for 80%+ test coverage

## 🧠 Key Concepts

### Data Flow

1. User interactions trigger state updates
2. State changes trigger UI updates
3. Data is persisted to IndexedDB
4. Sync with backend when online

### Offline-First Architecture

- All data operations first go to IndexedDB
- Changes are queued for sync when online
- Conflict resolution is timestamp-based

## 🚀 Common Tasks

### Adding a New Feature

1. Create a new branch from `main`
2. Add tests first (TDD approach)
3. Implement the feature
4. Update documentation if needed
5. Submit a PR with a clear description

### Debugging

- Use React DevTools for component inspection
- Check IndexedDB in Chrome DevTools > Application
- Review service worker in Chrome DevTools > Application > Service Workers

## 📚 Documentation

- Keep JSDoc comments updated for all public APIs
- Document complex business logic
- Update this guide when making significant architectural changes

## 🔄 Workflow

1. Always run tests before committing
2. Follow conventional commits: `type(scope): description`
3. Keep commits small and focused
4. Rebase before pushing to remote

## 🛑 Common Pitfalls

- Don't modify auto-generated files
- Don't commit API keys or sensitive data
- Don't bypass TypeScript type checking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Getting Help

- Check existing issues
- Reference the main README
- Consult the test suite for examples

Happy coding! 🌱
