# Nyx Server

Backend server for the Nyx App, built with FastAPI and Python.

## Quick Start

### Development Setup

#### Windows
```bash
# Setup development environment
.\setup-dev.bat

# Start development server
.\start-dev.bat
```

#### Linux/Mac
```bash
# Make scripts executable
chmod +x setup-dev.sh start-dev.sh

# Setup development environment
./setup-dev.sh

# Start development server
./start-dev.sh
```

### Manual Setup

1. **Create virtual environment**:
   ```bash
   python -m venv base
   ```

2. **Activate virtual environment**:
   ```bash
   # Windows
   base\Scripts\activate.bat
   
   # Linux/Mac
   source base/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start server**:
   ```bash
   python main.py
   ```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=8080
ENVIRONMENT=development

# Database Configuration (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here

# Security
JWT_SECRET=your_very_secure_jwt_secret_here
```

### Required Configuration

- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_KEY**: Your Supabase anonymous key
- **JWT_SECRET**: Secure secret for JWT token signing (minimum 32 characters)

## API Endpoints

### Health Check
- `GET /health` - Server health and status information

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration

### Core Features
- `/api/profiles` - Browser profile management
- `/api/proxies` - Proxy configuration
- `/api/crawlers` - Web crawling tasks
- `/api/campaigns` - Campaign management
- `/api/settings` - User settings

## Development

### Project Structure
```
server/
├── api/                 # FastAPI application
│   ├── routes/         # API route handlers
│   ├── middleware/     # Custom middleware
│   └── fastapi.py      # Main FastAPI app
├── core/               # Core business logic
├── db/                 # Database operations
├── security/           # Authentication & security
├── sessions/           # Session storage
├── base/               # Virtual environment (gitignored)
├── requirements.txt    # Python dependencies
├── main.py            # Server entry point
└── .env               # Environment configuration (gitignored)
```

### Adding Dependencies

```bash
# Activate virtual environment
source base/bin/activate  # Linux/Mac
# or
base\Scripts\activate.bat  # Windows

# Install new package
pip install package-name

# Update requirements.txt
pip freeze > requirements.txt
```

### Running Tests

```bash
# Activate virtual environment
source base/bin/activate

# Run tests (when implemented)
pytest
```

## Production Deployment

### Standalone Executable

Build a standalone executable that doesn't require Python or virtual environment:

```bash
# Activate virtual environment
source base/bin/activate

# Build executable
python build_server.py
```

This creates:
- `dist/nyx-server.exe` (Windows)
- `dist/nyx-server` (Linux/Mac)

### Docker Deployment

```bash
# Build Docker image
docker build -t nyx-server .

# Run container
docker run -p 8080:8080 --env-file .env nyx-server
```

### Manual Deployment

1. Copy server files to target machine
2. Install Python 3.11+
3. Create virtual environment and install dependencies
4. Configure `.env` file
5. Start server with `python main.py`

## Troubleshooting

### Common Issues

1. **Virtual environment not found**:
   ```bash
   # Run setup script
   ./setup-dev.sh  # Linux/Mac
   .\setup-dev.bat  # Windows
   ```

2. **Dependencies not installed**:
   ```bash
   source base/bin/activate
   pip install -r requirements.txt
   ```

3. **Port already in use**:
   - Change `PORT` in `.env` file
   - Or kill process using port 8080

4. **Database connection errors**:
   - Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
   - Check network connectivity to Supabase

5. **JWT errors**:
   - Ensure `JWT_SECRET` is set and at least 32 characters
   - Use a secure random string

### Logs

Server logs are displayed in the console. For production, consider:
- Redirecting output to log files
- Using a logging service
- Setting up log rotation

### Performance

For production deployments:
- Use a production WSGI server (uvicorn with multiple workers)
- Configure reverse proxy (nginx)
- Set up monitoring and health checks
- Use environment-specific configuration

## Security

### Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secret**: Use a strong, random secret
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Configure appropriate CORS origins
5. **Rate Limiting**: Enable rate limiting for production
6. **Updates**: Keep dependencies updated

### Authentication

The server uses JWT-based authentication with Supabase integration:
- Users authenticate through Supabase
- JWT tokens are validated on protected routes
- Session management through secure cookies

## Support

For issues or questions:
1. Check this README
2. Review server logs
3. Verify configuration in `.env`
4. Test with development setup first
