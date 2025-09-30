# Contributing to Bet Think

Thank you for your interest in contributing to Bet Think! This document provides guidelines and workflows for contributing to the project.

## 🏗️ Project Structure

This is a monorepo containing:
- `apps/mobile` - React Native mobile app
- `services/api` - Backend REST/SSE API (placeholder)
- `services/model` - LLM inference service (placeholder)
- `packages/shared` - Shared TypeScript types and utilities

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Expo CLI (for mobile development)

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-org/bet-think.git
cd bet-think
```

2. **Install dependencies**
```bash
# Mobile app
cd apps/mobile
npm install

# Shared package
cd ../../packages/shared
npm install
```

3. **Configure environment**
```bash
cd ../../apps/mobile
cp .env.example .env
# Edit .env with your configuration
```

4. **Start development**
```bash
npm start
```

## 📝 Code Style

### TypeScript

- Use TypeScript strict mode
- Define types/interfaces for all public APIs
- Use meaningful variable names
- Avoid `any` type (use `unknown` if needed)
- Prefer `const` over `let`

### React/React Native

- Use functional components with hooks
- Use React.memo for expensive components
- Keep components small and focused
- Extract complex logic into custom hooks
- Use TypeScript for prop types

### Naming Conventions

- **Files**: PascalCase for components (`ChatScreen.tsx`), camelCase for utilities (`logger.ts`)
- **Components**: PascalCase (`ChatMessage`)
- **Functions**: camelCase (`sendMessage`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`)
- **Types/Interfaces**: PascalCase (`BetRecommendation`)

### Code Organization

```typescript
// 1. Imports (grouped: external, internal, types)
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { useAuthStore } from '@/stores/auth.store';
import { logger } from '@/utils/logger';

import type { User } from '@shared/types';

// 2. Types/Interfaces
interface ComponentProps {
  user: User;
  onPress: () => void;
}

// 3. Component
export const Component: React.FC<ComponentProps> = ({ user, onPress }) => {
  // 3a. State
  const [isLoading, setIsLoading] = useState(false);
  
  // 3b. Hooks
  const { login } = useAuthStore();
  
  // 3c. Effects
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 3d. Handlers
  const handlePress = () => {
    onPress();
  };
  
  // 3e. Render
  return (
    <View style={styles.container}>
      <Button onPress={handlePress}>Press me</Button>
    </View>
  );
};

// 4. Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

## 🧪 Testing

### Writing Tests

- Write tests for all new features
- Update existing tests when modifying code
- Aim for meaningful coverage (not just high %)
- Test behavior, not implementation

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Structure

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Component } from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Press me')).toBeTruthy();
  });
  
  it('should handle press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Component onPress={onPress} />);
    
    fireEvent.press(getByText('Press me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

## 🔀 Git Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Production hotfixes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(chat): add message search functionality

- Added search input to chat screen
- Implemented fuzzy search algorithm
- Added tests for search logic

Closes #123
```

```
fix(auth): resolve token refresh race condition

The token refresh logic was causing multiple simultaneous
refresh attempts. Now using a mutex to prevent this.

Fixes #456
```

### Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes and commit**
```bash
git add .
git commit -m "feat(scope): description"
```

3. **Push to remote**
```bash
git push origin feature/your-feature-name
```

4. **Create Pull Request**
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes
   - Request reviewers

5. **Address review feedback**
   - Make requested changes
   - Respond to comments
   - Push additional commits

6. **Merge**
   - Squash and merge for feature branches
   - Use merge commit for release branches

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linter warnings (`npm run lint`)
- [ ] Added tests for new features
- [ ] Updated documentation
- [ ] Updated CHANGELOG.md
- [ ] Screenshots added for UI changes
- [ ] Tested on iOS and Android (for mobile)
- [ ] No console.log statements (use logger)
- [ ] No sensitive data in code/comments

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the issue
2. **Steps to reproduce**: Detailed steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Environment**: OS, device, app version
6. **Screenshots**: If applicable
7. **Logs**: Relevant error logs

## 💡 Feature Requests

When requesting features, include:

1. **Problem**: What problem does this solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other solutions considered
4. **Use case**: Real-world scenarios
5. **Priority**: How important is this?

## 📚 Documentation

- Update README.md for major changes
- Add JSDoc comments for complex functions
- Update ARCHITECTURE.md for architectural changes
- Keep CHANGELOG.md up to date

## 🔍 Code Review Guidelines

### As a Reviewer

- Be respectful and constructive
- Focus on code, not the person
- Ask questions, don't demand
- Suggest improvements with examples
- Approve when ready (even with minor suggestions)

### As an Author

- Be open to feedback
- Explain your decisions
- Don't take criticism personally
- Respond to all comments
- Make requested changes promptly

## 🎯 Best Practices

### Performance

- Use React.memo for expensive components
- Memoize values with useMemo
- Memoize callbacks with useCallback
- Use virtualized lists for long lists
- Optimize images and assets

### Accessibility

- Add accessibility labels
- Use semantic HTML/components
- Test with screen readers
- Ensure sufficient color contrast
- Support keyboard navigation

### Security

- Never commit sensitive data
- Use environment variables
- Validate all user input
- Sanitize data before display
- Use HTTPS for all API calls

### Error Handling

- Use try-catch for async operations
- Log errors appropriately
- Show user-friendly error messages
- Don't swallow errors silently
- Use error boundaries for React

## 📞 Communication

- Use GitHub Issues for bugs/features
- Use pull request comments for code discussion
- Join our Slack channel for quick questions
- Attend weekly dev meetings (Thursdays 10am)

## ❓ Questions?

If you have questions about contributing, reach out to:
- Email: dev@betthink.app
- Slack: #dev-mobile

Thank you for contributing! 🎉
