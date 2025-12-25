# Library Reference - Nibelheim

> Documentation mise à jour via Context7 - Décembre 2025

## Stack Overview

| Library | Version | Status |
|---------|---------|--------|
| Next.js | 16.0.10 | App Router, React 19 support |
| React | 19.2.3 | Server Components, new hooks |
| Supabase JS | 2.87.3 | SSR cookies, RLS |
| Tailwind CSS | v4 | Breaking changes from v3 |
| Zod | 4.2.1 | New API, better tree-shaking |
| Vitest | 4.0.16 | Browser mode available |

---

## Next.js 16 - App Router

### Server Components (Default)

```typescript
// app/page.tsx - Server Component by default
async function getData() {
  const res = await fetch('https://api.example.com/data', {
    cache: 'no-store'  // Dynamic (like getServerSideProps)
    // cache: 'force-cache'  // Static (like getStaticProps)
    // next: { revalidate: 60 }  // ISR
  })
  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}
```

### Client Components

```typescript
'use client'

export default function ClientComponent({ data }) {
  const [state, setState] = useState(data)
  return <button onClick={() => setState(...)}>Click</button>
}
```

### Dynamic Routes (params is now a Promise)

```typescript
// app/[moduleId]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ moduleId: string }>
}) {
  const { moduleId } = await params  // Must await in Next.js 16
  return <div>Module: {moduleId}</div>
}
```

### Headers & Cookies (async)

```typescript
import { cookies, headers } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const headersList = await headers()

  const theme = cookieStore.get('theme')
  const auth = headersList.get('authorization')

  return <div>Theme: {theme?.value}</div>
}
```

---

## React 19 - New Hooks

### useActionState (Form Actions)

```typescript
'use client'
import { useActionState } from 'react'

async function submitForm(prevState: any, formData: FormData) {
  const name = formData.get('name')
  // Server action or API call
  return { success: true, message: `Hello ${name}` }
}

export default function Form() {
  const [state, formAction, isPending] = useActionState(submitForm, null)

  return (
    <form action={formAction}>
      <input name="name" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
      {state?.message && <p>{state.message}</p>}
    </form>
  )
}
```

### useOptimistic (Optimistic Updates)

```typescript
'use client'
import { useOptimistic, startTransition } from 'react'

function MessageList({ messages, sendMessage }) {
  const [optimisticMessages, addOptimistic] = useOptimistic(
    messages,
    (state, newMessage) => [...state, { text: newMessage, sending: true }]
  )

  async function handleSubmit(formData: FormData) {
    const text = formData.get('message') as string
    addOptimistic(text)  // Show immediately
    startTransition(async () => {
      await sendMessage(formData)  // Actually send
    })
  }

  return (
    <>
      <form action={handleSubmit}>
        <input name="message" />
        <button>Send</button>
      </form>
      {optimisticMessages.map((msg, i) => (
        <div key={i}>
          {msg.text} {msg.sending && <span>(Sending...)</span>}
        </div>
      ))}
    </>
  )
}
```

---

## Supabase SSR - Auth with Cookies

### Middleware (Recommended Pattern)

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Protect routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

### Server Component (Read-only)

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Can't set cookies in Server Components
          // Session refresh happens in middleware
        }
      }
    }
  )
}
```

### Browser Client

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Auth State Listener

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    // Events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED
    console.log('Auth event:', event)
    if (session) {
      console.log('User:', session.user.email)
    }
  }
)

// Cleanup
subscription.unsubscribe()
```

---

## Tailwind CSS v4 - Breaking Changes

### Migration from v3

```bash
# Auto-upgrade (recommended)
npx @tailwindcss/upgrade
```

### Key Changes

| v3 | v4 | Notes |
|----|-----|-------|
| `tailwind.config.js` | CSS-based config | Use `@config` to load JS |
| `shadow-sm` | `shadow-xs` | Scale renamed |
| `rounded-sm` | `rounded-xs` | Scale renamed |
| `blur-sm` | `blur-xs` | Scale renamed |
| `outline-none` | `outline-hidden` | Accessibility |
| `:not([hidden]) ~ :not([hidden])` | `:not(:last-child)` | `space-*` selector |

### CSS-based Configuration

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.72 0.24 210);
  --color-secondary: oklch(0.68 0.28 285);
  --font-display: "Inter", sans-serif;
}
```

### Using JS Config (Legacy)

```css
@import "tailwindcss";
@config "./tailwind.config.js";
```

### New Features

```css
/* Container queries */
@container (min-width: 400px) {
  .card { /* styles */ }
}

/* Feature detection */
@supports (backdrop-filter: blur(10px)) {
  .glass { backdrop-filter: blur(10px); }
}
```

---

## Zod 4 - New API

### Top-level Format Validators

```typescript
import { z } from 'zod'

// Zod 4 - New API (tree-shakeable)
z.email()
z.uuid()
z.url()
z.ipv4()
z.ipv6()
z.iso.date()
z.iso.datetime()

// Zod 3 - Deprecated
// z.string().email()  // Still works but not recommended
```

### Core Sub-package

```typescript
// For shared utilities
import * as zCore from 'zod/v4/core'

function handleError(error: zCore.$ZodError) {
  console.error(error.issues)
}

// Or via namespace
import { z } from 'zod'
type ZodError = z.core.$ZodError
```

### Error Handling Changes

```typescript
// Zod 3 - Deprecated
// error.addIssue({ ... })

// Zod 4 - Direct array manipulation
error.issues.push({
  code: 'custom',
  message: 'Custom error',
  path: ['field']
})
```

### Schema Example

```typescript
const PromptSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  category: z.enum(['Development', 'Writing', 'Analysis', 'Marketing', 'Other']),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().default(false),
})

type Prompt = z.infer<typeof PromptSchema>
```

---

## Vitest 4 - Browser Mode

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',  // For unit tests
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
})
```

### React Component Testing (Browser Mode)

```typescript
import { render } from 'vitest-browser-react'
import { expect, test } from 'vitest'
import Counter from './Counter'

test('increments count on click', async () => {
  const screen = render(<Counter initialCount={0} />)

  await screen.getByRole('button', { name: /increment/i }).click()

  await expect.element(screen.getByText('Count: 1')).toBeInTheDocument()
})
```

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('PromptCard', () => {
  it('calls onFavorite when star is clicked', async () => {
    const onFavorite = vi.fn()
    render(<PromptCard prompt={mockPrompt} onFavorite={onFavorite} />)

    await userEvent.click(screen.getByRole('button', { name: /favorite/i }))

    expect(onFavorite).toHaveBeenCalledWith(mockPrompt.id)
  })
})
```

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint

# Testing
npm run test             # Run tests once
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report

# Supabase
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

---

## Resources

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Reference](https://react.dev/reference)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [Tailwind v4 Upgrade](https://tailwindcss.com/docs/upgrade-guide)
- [Zod 4 Changelog](https://zod.dev/v4/changelog)
- [Vitest Browser Mode](https://vitest.dev/guide/browser)
