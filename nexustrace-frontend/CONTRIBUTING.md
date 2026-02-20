# Contributing to NexusTrace Frontend

Thank you for your interest in contributing to NexusTrace! This document provides guidelines and instructions for contributing to the project.

## 🎯 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project and community
- Show empathy towards other community members

## 🚀 Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the repository page.

### 2. Clone Your Fork

```bash
git clone https://github.com/your-username/nexustrace-frontend.git
cd nexustrace-frontend
```

### 3. Add Upstream Remote

```bash
git remote add upstream <original-repository-url>
```

### 4. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

## 📋 Development Process

### Branch Naming Convention

Use descriptive branch names with the following prefixes:

- `feature/` - New features (e.g., `feature/add-export-functionality`)
- `fix/` - Bug fixes (e.g., `fix/timeline-rendering-issue`)
- `docs/` - Documentation updates (e.g., `docs/update-api-guide`)
- `refactor/` - Code refactoring (e.g., `refactor/optimize-store-logic`)
- `test/` - Adding or updating tests (e.g., `test/add-case-component-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```bash
feat(case): add case export functionality
fix(timeline): resolve rendering issue with long events
docs(readme): update installation instructions
refactor(store): simplify auth state management
```

## 🧪 Testing Your Changes

### Manual Testing

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Test your changes in the browser at `http://localhost:3000`

3. Verify:
   - Functionality works as expected
   - No console errors
   - Responsive design (mobile, tablet, desktop)
   - Dark/Light theme compatibility
   - Accessibility (keyboard navigation, screen readers)

### Type Checking

```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Build Testing

```bash
npm run build
npm run start
```

## 📝 Code Style Guidelines

### General Principles

- **DRY (Don't Repeat Yourself)**: Extract reusable logic into hooks or utilities
- **SOLID Principles**: Follow object-oriented design principles
- **Component Composition**: Build complex UIs from smaller, reusable components
- **Type Safety**: Leverage TypeScript for type safety

### TypeScript

```typescript
// ✅ DO: Use explicit types for function parameters and return values
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ DO: Use interfaces for object shapes
interface Case {
  id: string;
  title: string;
  status: CaseStatus;
}

// ❌ DON'T: Use 'any' type
function processData(data: any) { // Avoid this
  // ...
}

// ✅ DO: Use proper typing
function processData(data: CaseData) {
  // ...
}
```

### React Components

```typescript
// ✅ DO: Use functional components with TypeScript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {label}
    </button>
  );
}

// ✅ DO: Extract complex logic into custom hooks
function useCaseData(caseId: string) {
  return useQuery({
    queryKey: ["case", caseId],
    queryFn: () => fetchCase(caseId),
  });
}
```

### File Organization

```typescript
// Component file structure
import { useState, useEffect } from "react";           // 1. React imports
import { useQuery } from "@tanstack/react-query";      // 2. External dependencies
import { cn } from "@/lib/utils";                      // 3. Internal utilities
import type { Case } from "@/types/case";              // 4. Types
import { Button } from "@/components/ui/button";       // 5. Components
import { useCaseStore } from "@/store/caseStore";      // 6. Stores/Hooks

// Component implementation
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CaseCard`, `EvidenceList` |
| Functions | camelCase | `fetchCase`, `handleSubmit` |
| Hooks | camelCase with `use` prefix | `useAuth`, `useCases` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `API_URL` |
| Types/Interfaces | PascalCase | `Case`, `Evidence` |
| Files (components) | PascalCase | `CaseCard.tsx` |
| Files (utils) | camelCase | `caseUtils.ts` |

### Comments

```typescript
// ✅ DO: Add comments for complex logic
/**
 * Calculates the priority score for an evidence item based on
 * entity count, file type, and timestamp.
 * 
 * @param evidence - The evidence item to score
 * @returns Priority score (0-100)
 */
function calculatePriorityScore(evidence: Evidence): number {
  // ... implementation
}

// ✅ DO: Use TODO comments for future work
// TODO: Implement caching mechanism for better performance

// ❌ DON'T: State the obvious
const count = 0; // Initialize count to 0 (unnecessary comment)
```

## 🎨 UI/UX Guidelines

### Component Design

- Use **Shadcn UI** components as the foundation
- Maintain consistent spacing using Tailwind utilities
- Follow the existing design system
- Ensure responsive design (mobile-first approach)

### Accessibility

- Use semantic HTML elements
- Add proper ARIA labels
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers

### Example

```typescript
// ✅ Good: Accessible button
<button
  type="button"
  aria-label="Close dialog"
  onClick={handleClose}
  className="focus:ring-2 focus:ring-offset-2"
>
  <X className="h-4 w-4" />
  <span className="sr-only">Close</span>
</button>
```

## 🔄 Pull Request Process

### Before Submitting

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No console warnings or errors
- [ ] TypeScript types are correct
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Screenshots (if applicable)
Add screenshots for UI changes

## Testing
Describe how you tested the changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Build passes
- [ ] Lint passes
```

### Review Process

1. **Automated Checks**: CI/CD pipeline runs linting and build
2. **Code Review**: Maintainers review the code
3. **Feedback**: Address any comments or requested changes
4. **Approval**: Once approved, PR will be merged
5. **Cleanup**: Delete your feature branch after merge

## 🐛 Reporting Bugs

### Before Reporting

- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Gather relevant information

### Bug Report Template

```markdown
**Describe the Bug**
Clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Screenshots**
Add screenshots if applicable

**Environment**
- OS: [e.g., Windows 10, macOS 13]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node version: [e.g., 18.17.0]

**Additional Context**
Any other relevant information
```

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this work?

**Alternatives Considered**
Other approaches you've thought about

**Additional Context**
Mockups, examples, or references
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com/)

## ❓ Questions?

If you have questions:
- Check the [README](./README.md)
- Search existing issues
- Create a new issue with the `question` label
- Reach out to the maintainers

## 🙏 Thank You!

Your contributions make NexusTrace better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**
