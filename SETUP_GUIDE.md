# Codebae Execution System Setup Guide

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel App    │────▶│  Execution Client │────▶│  Fly.io Runner  │
│  (Next.js)      │     │  (HTTP Client)    │     │ (Docker + g++)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Quick Start

### 1. Deploy the Runner Service

```bash
cd codebae-runner

# Install flyctl if needed
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Deploy
fly deploy

# Set API key
fly secrets set API_KEY=your-secret-key-here

# Get the app URL
fly status
```

### 2. Configure Main App

Update `.env` in your main Codebae repository:

```bash
RUNNER_URL=https://your-app-name.fly.dev/execute
RUNNER_API_KEY=your-secret-key-here
```

### 3. Test the Setup

```bash
# Test runner health
curl https://your-app-name.fly.dev/health

# Test code execution
curl -X POST https://your-app-name.fly.dev/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "language": "cpp",
    "code": "#include<iostream>\nint main(){std::cout<<\"Hello World\";return 0;}"
  }'
```

## Files Changed

### Main App
- ✅ `src/lib/execution-client.js` - New HTTP client
- ✅ `src/app/api/execute-code/route.js` - Updated to use client
- ✅ `src/app/api/execute/route.js` - Updated to use client
- ✅ `.env` - Added runner configuration

### Runner Service (New)
- ✅ `codebae-runner/Dockerfile` - Container configuration
- ✅ `codebae-runner/server.js` - Execution service
- ✅ `codebae-runner/package.json` - Dependencies
- ✅ `codebae-runner/fly.toml` - Fly.io deployment config
- ✅ `codebae-runner/README.md` - Documentation
- ✅ `codebae-runner/deploy.sh` - Deployment script

## Features

### Security
- ✅ API key authentication
- ✅ Resource limits (CPU, memory, time)
- ✅ Output size limits
- ✅ Isolated temporary directories
- ✅ Cleanup on completion/error

### Languages Supported
- ✅ C++ (g++ -O2 -std=c++17)
- ✅ Java (OpenJDK 17)
- ✅ Python (Python 3)

### Monitoring
- ✅ Health endpoint (`/health`)
- ✅ Stats endpoint (`/stats`)
- ✅ Active job tracking
- ✅ Execution time metrics

## Scaling

The Fly.io configuration includes:
- Auto-start/stop machines
- Min 1 machine running
- Up to 2 CPUs per machine
- 1GB RAM per machine

To scale:
```bash
fly scale count 3  # Run 3 instances
```

## Troubleshooting

### Runner not responding
```bash
fly logs  # Check logs
fly status  # Check status
```

### Code execution fails
Check runner health:
```bash
curl https://your-app.fly.dev/health
```

### API key errors
Verify API key is set:
```bash
fly secrets list
```

## Migration from Piston

Old Piston-based execution has been replaced with:
- ✅ Direct HTTP calls to runner
- ✅ Better error handling
- ✅ Faster execution (no external API)
- ✅ More secure (your own infrastructure)

## Next Steps

1. Deploy runner service
2. Update environment variables
3. Test all languages
4. Monitor performance
5. Scale as needed
