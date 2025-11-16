# Contributing to Head North

Purpose: How to propose, implement, and submit changes. Use this when you plan to contribute code or docs. For local setup and commands, see Development. For system design, see Architecture. For deployment, see Deployment.

## Quick Start

1. **Fork and clone** the repository
2. **Set up development environment**: See [README.md](README.md) for installation and setup
3. **Read the coding guidelines**: See [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md)
4. **Make your changes** following our standards
5. **Run tests**: `npm run test`
6. **Lint your code**: `npm run lint`
7. **Create a pull request**

## Code Style & Guidelines

See [docs/CODING_GUIDELINES.md](docs/CODING_GUIDELINES.md) for comprehensive coding guidelines including:

- Quick reference API cheat sheet
- Functional programming patterns (Maybe, Either, pattern matching)
- TypeScript best practices
- Testing guidelines
- Common patterns and anti-patterns

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following coding guidelines
3. **Write/update tests** as needed
4. **Ensure all tests pass**: `npm run test`
5. **Ensure linting passes**: `npm run lint`
6. **Update documentation** if needed
7. **Create a pull request** with a clear description

### PR Checklist

- [ ] Code follows project coding standards
- [ ] Tests added/updated and passing
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow conventional commits

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `test`: Test additions/changes
- `chore`: Maintenance tasks

**Examples:**

```
feat(api): add Zod validation for cycle data
fix(web): handle empty filter arrays correctly
refactor(utils): extract pure functions from component
docs: update FP guidelines with new patterns
```

## Project Structure

See [README.md](README.md) for the complete monorepo structure and architecture overview.

## Testing & Linting

See [README.md](README.md) for all available commands. Most common:

- **Run all tests**: `npm run test`
- **Lint all code**: `npm run lint`

## Documentation

Use the following documents depending on your need:

- Project overview and quick start: `README.md`
- Local workflows and commands: `docs/development.md`
- Deployment: `docs/deployment.md`
- System design and repository layout: `docs/architecture.md`
- Coding standards and best practices: `docs/CODING_GUIDELINES.md`

## Getting Help

- **Questions?** Open an issue for discussion
- **Found a bug?** Open an issue with reproduction steps
- **Proposing a feature?** Open an issue for discussion before implementing

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

---

Thank you for contributing to Head North! 🎉
