# Codebae Runner

Secure code execution microservice for Codebae IDE.

## Features

- Multi-language support (C++, Java, Python)
- Isolated execution environment
- Resource limits and timeouts
- API key authentication
- Health monitoring

## Supported Languages

- **C++** - Compiled with g++ -O2 -std=c++17
- **Java** - Compiled with javac, executed with java
- **Python** - Executed with python3

## Environment Variables

```bash
PORT=3000                          # Server port
MAX_CODE_SIZE=100000               # Max code size in bytes
EXECUTION_TIMEOUT=5000             # Default timeout in ms
MAX_OUTPUT_SIZE=100000             # Max output size in bytes
API_KEY=your-secret-key            # Optional API authentication
```

## Local Development

```bash
npm install
npm run dev
```

## Production Deployment

### Fly.io

```bash
# Install flyctl if not already installed
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app (first time only)
fly apps create codebae-runner

# Deploy
fly deploy

# Set secrets
fly secrets set API_KEY=your-secret-key
```

### Docker

```bash
# Build
docker build -t codebae-runner .

# Run
docker run -p 3000:3000 -e API_KEY=your-secret-key codebae-runner
```

## API Usage

### Execute Code

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "language": "cpp",
    "code": "#include<iostream>\nint main(){std::cout<<\"Hello\";return 0;}",
    "input": "",
    "timeout": 5000
  }'
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Stats

```bash
curl http://localhost:3000/stats
```

## Security

- Code execution timeout limits
- Output size limits
- Temporary directory isolation
- API key authentication
- Resource cleanup on exit
