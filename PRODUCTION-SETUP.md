# Nyx App Production Setup Guide

This guide explains how to build and deploy the Nyx App for production, where the Tauri client communicates with a server running without a virtual environment.

## Overview

The production setup consists of:
- **Tauri Desktop App**: Bundled client application
- **Standalone Server**: Python server executable that runs without virtual environment
- **Automatic Server Management**: The Tauri app can start and monitor the server

## Quick Start

**Windows Only** - This application is designed specifically for Windows environments.

```bash
# Quick setup and build
.\quick-start.bat

# Or manual setup
python deploy/setup.py --mode development
python deploy/build.py --target all --distribute
```

## New Modular Structure

The deployment setup is now organized in the `deploy/` directory:

```
deploy/
├── config/                   # Configuration files
├── scripts/                  # Modular build scripts
│   ├── common/              # Shared utilities
│   ├── server/              # Server-specific scripts
│   ├── client/              # Client-specific scripts
│   └── deploy/              # Deployment scripts
├── setup.py                 # Main setup orchestrator
├── build.py                 # Main build orchestrator
└── deploy.py                # Main deployment orchestrator
```

## Detailed Setup

### 1. Server Packaging

The server is packaged into a standalone executable using PyInstaller:

```bash
cd server
python build_server.py
```

This creates:
- `server/dist/nyx-server.exe` (Windows) or `server/dist/nyx-server` (Linux/Mac)
- Includes all dependencies and Python runtime
- No virtual environment required

### 2. Client Building

The Tauri client is built with production configuration:

```bash
cd client
pnpm install
pnpm tauri build
```

This creates:
- Windows: `.msi` installer in `client/src-tauri/target/release/bundle/msi/`
- Linux: `.deb` package in `client/src-tauri/target/release/bundle/deb/`
- Mac: `.dmg` file in `client/src-tauri/target/release/bundle/dmg/`

### 3. Communication Setup

#### API Configuration
- **Development**: `http://localhost:5173` → `http://localhost:8080` (via Vite proxy)
- **Production**: Tauri app → `http://localhost:8080` (direct HTTP)

#### CORS Configuration
The server allows these origins:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alternative dev server)
- `tauri://localhost` (Tauri app)
- `https://tauri.localhost` (Tauri app secure)

#### Environment Variables
Production builds use `.env.production`:
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081
```

## Features

### Automatic Server Management

The Tauri app includes server management features:

1. **Health Checking**: Monitors server status
2. **Auto-Start**: Attempts to start server on app launch
3. **Manual Controls**: Start server, open server folder
4. **Status Monitoring**: Real-time server health display

### Server Health Endpoint

Enhanced health endpoint at `/health` provides:
- Server status and uptime
- System resource usage (CPU, memory, disk)
- Database connectivity status
- Timestamp and version information

### Dynamic Configuration

The client supports runtime configuration changes:
- API URL can be changed after build
- Configuration stored in localStorage
- Fallback to build-time environment variables

## Deployment

### Single Machine Deployment

1. **Copy Distribution Files**:
   ```
   dist/
   ├── nyx-server.exe          # Server executable
   ├── Nyx Admin_1.0.0_x64.msi # Client installer
   ├── start-server.bat        # Server startup script
   └── .env                    # Server configuration
   ```

2. **Install and Run**:
   - Run `start-server.bat` to start the server
   - Install the Nyx Admin application using the `.msi` file
   - Launch the Nyx Admin app

### Network Deployment

For server on a different machine:

1. **Server Machine**:
   ```bash
   # Copy server files
   nyx-server.exe
   .env

   # Start server
   ./nyx-server.exe
   ```

2. **Client Machines**:
   - Install Nyx Admin application
   - Update API URL in settings or localStorage:
     ```javascript
     localStorage.setItem('RUNTIME_API_URL', 'http://server-ip:8080')
     ```

## Configuration Files

### Server Configuration (`.env`)
```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# Server
PORT=8080
ENVIRONMENT=production

# Security
JWT_SECRET=your_jwt_secret
```

### Client Configuration
- Build-time: `client/.env.production`
- Runtime: Browser localStorage
- Fallback: Default values in code

## Troubleshooting

### Server Issues

1. **Server won't start**:
   - Check if port 8080 is available
   - Verify `.env` file exists and is valid
   - Check server logs for errors

2. **Permission errors**:
   - Ensure executable permissions on Linux/Mac
   - Run as administrator on Windows if needed

3. **Dependencies missing**:
   - Server executable should be self-contained
   - If issues persist, install Python and run from source

### Client Issues

1. **Can't connect to server**:
   - Verify server is running (`http://localhost:8080/health`)
   - Check firewall settings
   - Verify API URL configuration

2. **CORS errors**:
   - Ensure server CORS configuration includes Tauri origins
   - Check browser developer tools for specific errors

3. **Auto-start fails**:
   - Server executable must be in expected location
   - Check Tauri app logs for error messages

### Network Issues

1. **Connection timeouts**:
   - Increase timeout values in client configuration
   - Check network connectivity between client and server

2. **SSL/TLS errors**:
   - For HTTPS deployments, ensure valid certificates
   - Update client configuration for secure endpoints

## Security Considerations

1. **Server Security**:
   - Run server with minimal privileges
   - Use strong JWT secrets
   - Keep server updated

2. **Network Security**:
   - Use HTTPS in production networks
   - Configure firewall rules appropriately
   - Consider VPN for remote access

3. **Client Security**:
   - Tauri app runs in secure context
   - API credentials stored securely
   - Regular security updates

## Monitoring

### Health Monitoring
- Server health endpoint: `GET /health`
- Client health monitoring component
- Automatic reconnection on failures

### Logging
- Server logs to console and files
- Client logs to browser console
- Tauri app logs to system logs

### Performance
- Server resource monitoring via health endpoint
- Client performance monitoring
- Network latency tracking

## Support

For issues or questions:
1. Check this documentation
2. Review server and client logs
3. Test with development setup first
4. Check network connectivity and firewall settings
