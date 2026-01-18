# Build Error Fix 🛠️

You encountered a build error:
`[Error: Failed to collect page data for /api/execute]`
`Cannot find module './vendor-chunks/next.js'`

This is a common **Cache Corruption** issue in Next.js, often happening after moving files or changing dependencies.

## Solution

Please run the following commands in your terminal to clean the cache and rebuild:

### Option 1: Clean and Run Dev (Recommended for Development)
```bash
# Windows Command Prompt
rmdir /s /q .next
npm run dev
```

### Option 2: Clean and Build Production
```bash
# Windows Command Prompt
rmdir /s /q .next
npm run build
```

This effectively deletes the corrupted `.next` folder and forces Next.js to regenerate all build artifacts from scratch.

---
**Note**: The files `/api/execute` and `/test/[testId]/manage` DO exist and are valid. The error is strictly related to the stale build cache.
