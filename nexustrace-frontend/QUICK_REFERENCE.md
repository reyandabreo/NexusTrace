# Quick Reference Guide 📘

> 📖 [← Back to Main README](README.md) | [Quick Setup](QUICK_SETUP.md) | [Contributing](CONTRIBUTING.md) | [API Integration](API_INTEGRATION.md)

A quick reference for common tasks and information when working with NexusTrace Frontend.

## 🚀 Quick Start Commands

```bash
# Setup
npm install                          # Install dependencies
cp .env.example .env.local          # Create environment file
npm run dev                         # Start development server

# Development
npm run dev                         # Start dev server (http://localhost:3000)
npm run build                       # Build for production
npm run start                       # Start production server
npm run lint                        # Run ESLint
npx tsc --noEmit                   # Type check
```

## 📂 Important Files

| File | Purpose |
|------|---------|
| `lib/api.ts` | Axios client configuration |
| `app/layout.tsx` | Root layout with providers |
| `proxy.ts` | Route protection middleware |
| `components/providers.tsx` | Context providers |
| `lib/queryClient.ts` | TanStack Query config |
| `.env.local` | Environment variables (gitignored) |

## 🗂️ Directory Quick Reference

```
app/              → Pages and routes (Next.js App Router)
components/       → Reusable React components
  ├── ui/         → Shadcn UI base components
  ├── layout/     → Navigation, sidebars
  └── evidence/   → Evidence-specific components
hooks/            → Custom React hooks
lib/              → Utilities and helpers
store/            → Zustand state stores
types/            → TypeScript type definitions
public/           → Static assets
```

## 🔗 Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/register` | Registration |
| `/dashboard` | Dashboard home |
| `/dashboard/cases` | Cases list |
| `/dashboard/case/[id]` | Case details |
| `/dashboard/case/[id]/timeline` | Timeline view |
| `/dashboard/case/[id]/network` | Network graph |
| `/dashboard/case/[id]/entities` | Entities |
| `/dashboard/case/[id]/rag` | RAG chat |
| `/dashboard/analytics` | Analytics |
| `/dashboard/activity` | Activity feed |
| `/dashboard/audit` | Audit logs |
| `/dashboard/settings` | Settings |

## 🎣 Common Hooks

### Custom Hooks

```typescript
// Authentication
import { useAuth } from "@/hooks/useAuth";
const { user, login, logout, isAuthenticated } = useAuth();

// Cases
import { useCases } from "@/hooks/useCases";
const { cases, loading, error, createCase } = useCases();

// RAG Chat
import { useRag } from "@/hooks/useRag";
const { messages, sendMessage, loading } = useRag(caseId);

// File Upload
import { useUpload } from "@/hooks/useUpload";
const { upload, progress } = useUpload();
```

### React Query Patterns

```typescript
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ["cases"],
  queryFn: () => api.get("/cases").then(res => res.data),
});

// Mutate data
const { mutate } = useMutation({
  mutationFn: (data) => api.post("/cases", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["cases"] });
  },
});
```

## 🎨 UI Components (Shadcn)

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
```

## 🔐 Authentication

```typescript
// Login
const formData = new FormData();
formData.append("username", email);
formData.append("password", password);
const response = await api.post("/auth/login", formData);
localStorage.setItem("access_token", response.data.access_token);

// Logout
localStorage.removeItem("access_token");
window.location.href = "/login";

// Get current user
const user = await api.get("/auth/me");
```

## 📡 API Calls

```typescript
import api from "@/lib/api";

// GET
const cases = await api.get("/cases");

// POST
const newCase = await api.post("/cases", { name: "Case 1", description: "..." });

// PUT
const updated = await api.put(`/cases/${id}`, { status: "closed" });

// DELETE
await api.delete(`/cases/${id}`);

// File Upload
const formData = new FormData();
formData.append("file", file);
await api.post(`/cases/${caseId}/evidence`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
```

## 🗃️ State Management

### Zustand Store Pattern

```typescript
import { create } from "zustand";

interface Store {
  data: any;
  setData: (data: any) => void;
}

export const useStore = create<Store>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));

// Usage
import { useStore } from "@/store/myStore";
const { data, setData } = useStore();
```

## 🎨 Styling

```typescript
import { cn } from "@/lib/utils";

// Conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" ? "bg-blue-500" : "bg-gray-500"
)} />

// Common Tailwind patterns
"flex items-center justify-between"      // Flexbox
"grid grid-cols-3 gap-4"                // Grid
"p-4 px-6"                              // Padding
"text-lg font-semibold"                 // Typography
"hover:bg-gray-100 transition"          // Hover states
"md:flex hidden"                        // Responsive (hidden on mobile)
```

## 📝 TypeScript Patterns

```typescript
// Component props
interface Props {
  title: string;
  optional?: number;
  onClick: () => void;
  children: React.ReactNode;
}

// API response
interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

// Union types
type Status = "open" | "closed" | "in_progress";

// Generic function
function fetchData<T>(url: string): Promise<T> {
  return api.get(url).then(res => res.data);
}
```

## 🚨 Error Handling

```typescript
// Try-catch
try {
  const data = await api.get("/cases");
} catch (error) {
  if (axios.isAxiosError(error)) {
    console.error(error.response?.data);
  }
  toast.error("Failed to fetch cases");
}

// React Query
const { data, error, isError } = useQuery({
  queryKey: ["cases"],
  queryFn: fetchCases,
  retry: 3,
});

if (isError) {
  return <ErrorComponent error={error} />;
}
```

## 🔧 Utility Functions

```typescript
// Class name merging
import { cn } from "@/lib/utils";
cn("class1", "class2", condition && "class3");

// Date formatting
new Date(timestamp).toLocaleDateString();

// Debouncing
import { useDebouncedValue } from "@/hooks/useDebounce";
const debouncedSearch = useDebouncedValue(search, 500);
```

## 📦 Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Access in code
process.env.NEXT_PUBLIC_API_URL
```

## 🐛 Debugging

```typescript
// Console logging (remove before commit)
console.log("Data:", data);
console.error("Error:", error);
console.table(arrayOfObjects);

// React DevTools
// Install React DevTools extension

// Network tab
// Chrome DevTools → Network → Filter: Fetch/XHR
```

## 📊 Common Patterns

### Loading State

```typescript
if (isLoading) return <Skeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;
return <DataDisplay data={data} />;
```

### Form Handling

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});

const onSubmit = (data) => {
  // Handle form submission
};
```

### Modal/Dialog

```typescript
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <YourContent />
  </DialogContent>
</Dialog>
```

## 🔍 Search & Find

```bash
# Find file by name
find . -name "*.tsx" | grep "Case"

# Search in files
grep -r "useAuth" .

# VS Code: Cmd/Ctrl + Shift + F
```

## 🧪 Testing Checklist

- [ ] Functionality works as expected
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Dark/Light theme compatible
- [ ] Loading states handled
- [ ] Error states handled
- [ ] TypeScript errors resolved
- [ ] ESLint warnings fixed

## 📚 Documentation Files

- [README.md](README.md) - Main documentation
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Architecture details
- [API_INTEGRATION.md](API_INTEGRATION.md) - API integration guide
- [QUICK_SETUP.md](QUICK_SETUP.md) - Setup instructions
- [CHANGELOG.md](CHANGELOG.md) - Version history

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 <PID>` |
| API connection failed | Check backend is running on :8000 |
| Module not found | `rm -rf node_modules && npm install` |
| TypeScript errors | Restart TS server (Cmd+Shift+P) |
| Build fails | `rm -rf .next && npm run build` |

## 💡 Pro Tips

1. **Use keyboard shortcuts**: Cmd/Ctrl + P (file search), Cmd/Ctrl + Shift + F (search in files)
2. **Install extensions**: ESLint, Tailwind IntelliSense, Prettier
3. **Use React DevTools**: Inspect component hierarchy and state
4. **Check Network tab**: Debug API calls and responses
5. **Read error messages**: They usually tell you exactly what's wrong
6. **Use TanStack Query DevTools**: See query cache and states
7. **Leverage TypeScript**: Let autocomplete guide you
8. **Commit often**: Small, focused commits are better

## 📞 Getting Help

1. Check this quick reference
2. Read the full [README.md](README.md)
3. Search existing issues
4. Create a new issue with details
5. Ask the team

## 📚 Related Documentation

- [Main README](README.md) - Project overview and getting started
- [Quick Setup Guide](QUICK_SETUP.md) - Fast setup instructions
- [Contributing Guide](CONTRIBUTING.md) - Contribution guidelines
- [Project Structure](PROJECT_STRUCTURE.md) - Architecture details
- [API Integration](API_INTEGRATION.md) - API documentation
- [Changelog](CHANGELOG.md) - Version history

---

**Last Updated**: February 2026  
**Version**: 0.1.0
