# Nyx App Production Scripts

This directory contains organized, modular scripts for building and deploying the Nyx App for Windows environments.

## Directory Structure

```
production/
├── README.md                 # This file
├── config/                   # Configuration files
│   ├── server.env.template   # Server environment template
│   └── build.config.json     # Build configuration
├── scripts/                  # Core scripts
│   ├── common/              # Shared utilities
│   │   └── utils.py         # Python utilities and helpers
│   ├── server/              # Server-specific scripts
│   │   ├── setup.py         # Server setup automation
│   │   └── build.py         # Server build automation
│   ├── client/              # Client-specific scripts
│   │   ├── setup.py         # Client setup automation
│   │   └── build.py         # Client build automation
│   └── deploy/              # Deployment scripts
│       └── generate-keys.py # Tauri signing key generation
├── build.py                 # Main build orchestrator
├── setup.py                 # Main setup orchestrator
└── deploy.py                # Main deployment orchestrator
```

## Quick Start

### Development Setup
```bash
# Setup everything for development
python production/setup.py --mode development

# Start development servers
python production/setup.py --mode development --start
```

### Production Build
```bash
# Build everything for production
python production/build.py --target all

# Build specific components
python production/build.py --target server
python production/build.py --target client
```

### Deployment
```bash
# Generate signing keys
python production/deploy.py --generate-keys

# Deploy locally
python production/deploy.py --target local

# Prepare for GitHub deployment
python production/deploy.py --target github
```

## Features

- **Modular Design**: Each component has its own setup and build scripts
- **Windows-Optimized**: Specifically designed for Windows environments
- **Configurable**: JSON-based configuration for different environments
- **Error Handling**: Comprehensive error checking and recovery
- **Logging**: Detailed logging for debugging
- **Validation**: Pre-flight checks before operations
- **Cleanup**: Automatic cleanup on failures

## Configuration

Edit `production/config/build.config.json` to customize:
- Build targets and options
- Environment variables
- Deployment settings
- Platform-specific configurations

## Requirements

- **Windows 10/11**
- **Python 3.8+** (with pip)
- **Node.js 18+**
- **pnpm** package manager
- **Rust** (for Tauri builds)
- **Visual Studio Build Tools** (for native dependencies)
