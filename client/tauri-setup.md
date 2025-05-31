# Nyx Browser - Tauri Desktop App Setup

## Current Status
✅ Tauri initialized successfully
✅ Configuration files created
✅ Package.json updated with Tauri scripts
❌ Rust toolchain needs to be fixed

## Next Steps

### 1. Fix Rust Installation

Run in PowerShell as Administrator:
```powershell
rustup toolchain install stable --component rustc,cargo,rust-std
rustup default stable
```

If that fails, try clean reinstall:
```powershell
rustup self uninstall
# Then download and run rustup-init.exe from https://rustup.rs/
```

### 2. Verify Rust Installation
```powershell
rustc --version
cargo --version
```

### 3. Run Tauri Development Server
```powershell
pnpm run tauri:dev
```

### 4. Build Desktop App
```powershell
pnpm run tauri:build
```

## Configuration Summary

### Tauri Config (`src-tauri/tauri.conf.json`)
- **App Name**: Nyx Browser
- **Window Size**: 1200x800 (min 800x600)
- **Theme**: Dark
- **Build Output**: `../dist` (Vite build folder)
- **Dev Server**: http://localhost:3000

### Package.json Scripts Added
- `pnpm run tauri:dev` - Run development version
- `pnpm run tauri:build` - Build production app
- `pnpm run tauri` - Access Tauri CLI

### Custom Icons
- Generated icon files from your spider logo
- Need to replace files in `src-tauri/icons/` folder

## Troubleshooting

### Common Issues
1. **Rust not found**: Run `rustup default stable`
2. **Permission errors**: Run PowerShell as Administrator
3. **Antivirus blocking**: Temporarily disable antivirus during installation
4. **Build fails**: Check that `dist` folder exists after `pnpm run build`

### Windows-specific Requirements
- Visual Studio Build Tools or Visual Studio with C++ workload
- Windows 10 SDK

## Features Configured
- Window management (resizable, centered)
- Dark theme support
- Custom app metadata
- Bundle configuration for distribution
- Development hot-reload support

## Next Development Steps
1. Fix Rust installation
2. Test desktop app launch
3. Replace default icons with Nyx spider logo
4. Configure app permissions if needed
5. Set up code signing for distribution
6. Create installer/MSI package
