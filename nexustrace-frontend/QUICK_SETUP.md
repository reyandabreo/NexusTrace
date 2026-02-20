# Quick Setup Guide 🚀

> 📖 [← Back to Main README](README.md) | [Quick Reference](QUICK_REFERENCE.md) | [Contributing](CONTRIBUTING.md) | [Project Structure](PROJECT_STRUCTURE.md)

A streamlined guide to get NexusTrace frontend running in under 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 18.17+ installed ([Download](https://nodejs.org/))
- [ ] npm 9+ (comes with Node.js)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)
- [ ] Backend API running on `http://localhost:8000`

## One-Line Setup

For experienced developers who want to start quickly:

```bash
git clone <repo-url> && cd nexustrace-frontend && npm install && cp .env.example .env.local && npm run dev
```

## Step-by-Step Setup

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd nexustrace-frontend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

Expected time: ~2 minutes

### 3️⃣ Environment Configuration

```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local and set your API URL
# Default: NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4️⃣ Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5️⃣ Verify Setup

- [ ] Application loads without errors
- [ ] Can navigate to login page
- [ ] Console shows no errors
- [ ] Backend connection successful

## Common Setup Issues

### Port 3000 Already in Use

```bash
# Find and kill process on port 3000
lsof -i :3000 && kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### API Connection Failed

```bash
# Verify backend is running
curl http://localhost:8000/health

# If not running, start the backend first
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P > "TypeScript: Restart TS Server"
```

## Next Steps

1. **Create an Account**: Go to `/register` and create a test account
2. **Explore Dashboard**: Login and navigate the dashboard
3. **Create a Case**: Test case creation functionality
4. **Upload Evidence**: Try uploading sample files
5. **Read Documentation**: Check [README.md](./README.md) for detailed info

## Development Workflow

```bash
# Start dev server
npm run dev

# Run linter (in a new terminal)
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## Recommended VS Code Extensions

Install these for the best development experience:

```bash
# Press Cmd/Ctrl + Shift + P, then "Show Recommended Extensions"
```

Or manually install:
- **ESLint** - Code linting
- **Tailwind CSS IntelliSense** - Class name autocomplete
- **TypeScript Vue Plugin (Volar)** - Better TypeScript support
- **Prettier** - Code formatting

## File to Edit First

Start by exploring these files:

1. [app/page.tsx](app/page.tsx) - Landing page
2. [app/dashboard/page.tsx](app/dashboard/page.tsx) - Dashboard home
3. [components/ui/button.tsx](components/ui/button.tsx) - UI component example
4. [lib/api.ts](lib/api.ts) - API configuration

## Helpful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Clear Next.js cache
rm -rf .next

# Check for outdated packages
npm outdated

# Update package
npm update <package-name>

# View all scripts
npm run
```

## Testing Your Setup

Create a simple test case:

1. Navigate to `http://localhost:3000/register`
2. Register with:
   - Email: `test@example.com`
   - Password: `TestPassword123!`
3. Login with the same credentials
4. Create a new case in the dashboard
5. Upload a test file as evidence

If all steps work, your setup is complete! ✅

## Getting Help

- **Documentation**: [README.md](./README.md)
- **Architecture**: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Issues**: Create an issue in the repository

## Quick Reference

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Start prod | `npm run start` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |

---

**Setup Time**: ~5 minutes  
**First Case Created**: ~10 minutes  
**Ready to Contribute**: ~30 minutes after reading docs

## 📚 Related Documentation

- [Main README](README.md) - Project overview and getting started
- [Quick Reference](QUICK_REFERENCE.md) - Commands and patterns
- [Contributing Guide](CONTRIBUTING.md) - Contribution guidelines
- [Project Structure](PROJECT_STRUCTURE.md) - Architecture details
- [API Integration](API_INTEGRATION.md) - API documentation
- [Changelog](CHANGELOG.md) - Version history

---

Happy coding! 🎉
