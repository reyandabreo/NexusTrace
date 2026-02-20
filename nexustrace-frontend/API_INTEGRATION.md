# API Integration Guide

This guide explains how the NexusTrace frontend integrates with the backend API.

## 📋 Table of Contents

- [API Client Setup](#api-client-setup)
- [Authentication Flow](#authentication-flow)
- [Making API Calls](#making-api-calls)
- [Error Handling](#error-handling)
- [API Endpoints Reference](#api-endpoints-reference)
- [Request/Response Examples](#request-response-examples)
- [Best Practices](#best-practices)

---

## 🔧 API Client Setup

### Axios Instance

The API client is configured in [lib/api.ts](lib/api.ts):

```typescript
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Request Interceptor (JWT Injection)

Automatically attaches JWT token to every request:

```typescript
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
```

### Response Interceptor (Auto Logout)

Handles 401 Unauthorized responses:

```typescript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## 🔐 Authentication Flow

### Registration

```typescript
// POST /auth/register
const response = await api.post("/auth/register", {
  email: "user@example.com",
  password: "SecurePassword123!",
  full_name: "John Doe"
});

// Response
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Login

```typescript
// POST /auth/login (Form Data)
const formData = new FormData();
formData.append("username", email);
formData.append("password", password);

const response = await api.post("/auth/login", formData, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" }
});

// Response
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}

// Store token
localStorage.setItem("access_token", response.data.access_token);
```

### Get Current User

```typescript
// GET /auth/me
const response = await api.get("/auth/me");

// Response
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2026-02-15T10:30:00Z"
}
```

---

## 📡 Making API Calls

### Using TanStack Query (Recommended)

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

// Fetch data (GET)
function useCases() {
  return useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const response = await api.get("/cases");
      return response.data;
    },
  });
}

// Mutate data (POST, PUT, DELETE)
function useCreateCase() {
  return useMutation({
    mutationFn: async (caseData: CreateCaseRequest) => {
      const response = await api.post("/cases", caseData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["cases"] });
    },
  });
}
```

### Direct API Calls

```typescript
// GET request
const cases = await api.get("/cases");
console.log(cases.data);

// POST request
const newCase = await api.post("/cases", {
  name: "Investigation Case",
  description: "Case description"
});

// PUT request
const updatedCase = await api.put(`/cases/${caseId}`, {
  status: "closed"
});

// DELETE request
await api.delete(`/cases/${caseId}`);
```

### File Upload

```typescript
const formData = new FormData();
formData.append("file", fileObject);
formData.append("case_id", caseId);

const response = await api.post(`/cases/${caseId}/evidence`, formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload Progress: ${percentCompleted}%`);
  },
});
```

---

## 🚨 Error Handling

### Try-Catch Pattern

```typescript
try {
  const response = await api.get("/cases");
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    // Handle Axios-specific errors
    console.error("API Error:", error.response?.data);
    console.error("Status Code:", error.response?.status);
    
    if (error.response?.status === 404) {
      // Handle not found
    } else if (error.response?.status === 500) {
      // Handle server error
    }
  } else {
    // Handle non-Axios errors
    console.error("Unexpected Error:", error);
  }
  throw error;
}
```

### React Query Error Handling

```typescript
const { data, error, isError } = useQuery({
  queryKey: ["case", caseId],
  queryFn: () => api.get(`/cases/${caseId}`).then(res => res.data),
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

### Global Error Display

Use toast notifications:

```typescript
import { toast } from "sonner";

try {
  await api.post("/cases", caseData);
  toast.success("Case created successfully!");
} catch (error) {
  toast.error("Failed to create case. Please try again.");
}
```

---

## 📚 API Endpoints Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | Login user | ❌ |
| `GET` | `/auth/me` | Get current user | ✅ |
| `POST` | `/auth/refresh` | Refresh token | ✅ |

### Cases

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/cases` | List all cases | ✅ |
| `POST` | `/cases` | Create new case | ✅ |
| `GET` | `/cases/{id}` | Get case by ID | ✅ |
| `PUT` | `/cases/{id}` | Update case | ✅ |
| `DELETE` | `/cases/{id}` | Delete case | ✅ |
| `GET` | `/cases/{id}/evidence` | List case evidence | ✅ |

### Evidence

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/cases/{id}/evidence` | Upload evidence | ✅ |
| `GET` | `/evidence/{id}` | Get evidence metadata | ✅ |
| `DELETE` | `/evidence/{id}` | Delete evidence | ✅ |
| `GET` | `/evidence/{id}/download` | Download evidence file | ✅ |

### Timeline

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/cases/{id}/timeline` | Get timeline events | ✅ |
| `POST` | `/cases/{id}/timeline` | Add timeline event | ✅ |

### Network Graph

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/cases/{id}/network` | Get network graph data | ✅ |

### Entity Extraction

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/cases/{id}/entities` | Get extracted entities | ✅ |
| `POST` | `/evidence/{id}/extract` | Trigger entity extraction | ✅ |

### RAG Chat

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/cases/{id}/chat` | Send chat message | ✅ |
| `GET` | `/cases/{id}/chat/history` | Get chat history | ✅ |

### Analytics

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/analytics/dashboard` | Get dashboard stats | ✅ |
| `GET` | `/analytics/cases/{id}` | Get case analytics | ✅ |

### Audit Logs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/audit/logs` | Get audit logs | ✅ |
| `GET` | `/audit/logs/case/{id}` | Get case audit logs | ✅ |

---

## 💡 Request/Response Examples

### Create Case

**Request:**
```http
POST /cases
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "name": "Data Breach Investigation",
  "description": "Investigation of potential data breach on 2026-02-15"
}
```

**Response:**
```json
{
  "id": "case-uuid-12345",
  "case_id": "CASE-2026-001",
  "name": "Data Breach Investigation",
  "description": "Investigation of potential data breach on 2026-02-15",
  "status": "open",
  "owner_id": "user-uuid",
  "created_at": "2026-02-20T10:30:00Z",
  "updated_at": "2026-02-20T10:30:00Z",
  "evidence_count": 0
}
```

### Upload Evidence

**Request:**
```http
POST /cases/case-uuid-12345/evidence
Content-Type: multipart/form-data
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="evidence.pdf"
Content-Type: application/pdf

[binary data]
------WebKitFormBoundary--
```

**Response:**
```json
{
  "evidence_id": "evidence-uuid-67890",
  "filename": "evidence.pdf",
  "file_type": "application/pdf",
  "file_size": 1048576,
  "case_id": "case-uuid-12345",
  "created_at": "2026-02-20T10:35:00Z",
  "status": "processing"
}
```

### RAG Chat Query

**Request:**
```http
POST /cases/case-uuid-12345/chat
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "message": "What are the main entities mentioned in the evidence?",
  "conversation_id": "conv-uuid-111"
}
```

**Response:**
```json
{
  "response": "Based on the analyzed evidence, the main entities are:\n\n1. **John Smith** (Person) - Mentioned 5 times\n2. **Acme Corp** (Organization) - Mentioned 3 times\n3. **192.168.1.100** (IP Address) - Mentioned 2 times",
  "sources": [
    {
      "evidence_id": "evidence-uuid-67890",
      "excerpt": "...John Smith accessed the server at 192.168.1.100...",
      "relevance_score": 0.95
    }
  ],
  "conversation_id": "conv-uuid-111",
  "timestamp": "2026-02-20T10:40:00Z"
}
```

---

## ✅ Best Practices

### 1. Use TanStack Query for Data Fetching

```typescript
// ✅ Good: Automatic caching, refetching, and error handling
const { data, isLoading, error } = useQuery({
  queryKey: ["cases"],
  queryFn: () => api.get("/cases").then(res => res.data),
});

// ❌ Avoid: Manual state management
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
useEffect(() => {
  setLoading(true);
  api.get("/cases").then(res => setData(res.data)).finally(() => setLoading(false));
}, []);
```

### 2. Type API Responses

```typescript
// Define response types
interface CaseResponse {
  id: string;
  name: string;
  status: "open" | "closed" | "in_progress";
}

// Use in queries
const { data } = useQuery<CaseResponse[]>({
  queryKey: ["cases"],
  queryFn: () => api.get<CaseResponse[]>("/cases").then(res => res.data),
});
```

### 3. Handle Loading States

```typescript
if (isLoading) return <Skeleton />;
if (isError) return <ErrorMessage error={error} />;
if (!data) return null;

return <CaseList cases={data} />;
```

### 4. Invalidate Queries After Mutations

```typescript
const { mutate } = useMutation({
  mutationFn: (data) => api.post("/cases", data),
  onSuccess: () => {
    // Refetch cases list
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    
    // Show success message
    toast.success("Case created successfully!");
  },
});
```

### 5. Use Optimistic Updates

```typescript
const { mutate } = useMutation({
  mutationFn: (id) => api.delete(`/cases/${id}`),
  onMutate: async (deletedId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["cases"] });
    
    // Snapshot previous value
    const previousCases = queryClient.getQueryData(["cases"]);
    
    // Optimistically update
    queryClient.setQueryData(["cases"], (old) =>
      old.filter((case) => case.id !== deletedId)
    );
    
    return { previousCases };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["cases"], context.previousCases);
  },
});
```

### 6. Implement Request Debouncing

```typescript
import { useDebouncedValue } from "@/hooks/useDebounce";

function SearchComponent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  
  const { data } = useQuery({
    queryKey: ["cases", "search", debouncedSearch],
    queryFn: () => api.get(`/cases?search=${debouncedSearch}`),
    enabled: debouncedSearch.length > 0,
  });
}
```

### 7. Handle File Downloads

```typescript
async function downloadEvidence(evidenceId: string) {
  const response = await api.get(`/evidence/${evidenceId}/download`, {
    responseType: "blob",
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "evidence.pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();
}
```

---

## 🔒 Security Considerations

1. **Never log tokens**: Avoid logging JWT tokens to console
2. **Use HTTPS in production**: Set `NEXT_PUBLIC_API_URL` to HTTPS URL
3. **Validate user input**: Sanitize data before sending to API
4. **Handle sensitive data**: Don't store sensitive info in localStorage
5. **Implement CSRF protection**: Use proper CSRF tokens for mutations

---

## 🐛 Debugging API Calls

### Enable Axios Request Logging

```typescript
// Add to lib/api.ts for debugging
api.interceptors.request.use((config) => {
  console.log("API Request:", config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.status, error.config.url);
    return Promise.reject(error);
  }
);
```

### Use Browser DevTools

1. Open Network tab
2. Filter by "Fetch/XHR"
3. Inspect request/response headers and payload
4. Check for CORS errors

---

## 📖 Additional Resources

- [Axios Documentation](https://axios-http.com/docs/intro)
- [TanStack Query Guide](https://tanstack.com/query/latest/docs/framework/react/overview)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last Updated**: February 2026
