#!/usr/bin/env python3
"""
Main build orchestrator for Nyx App
"""

import sys
import argparse
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent / "scripts" / "common"))
from utils import utils

def build_server(test: bool = False, package: bool = False):
    """Build server"""
    utils.logger.info("🔨 Building server...")

    try:
        # Import and run server build
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "server"))
        from build import ServerBuilder

        builder = ServerBuilder()
        success = builder.build_executable()

        if success and test:
            success = builder.test_executable()

        if success and package:
            success = builder.package_for_distribution()

        return success

    except Exception as e:
        utils.logger.error(f"❌ Server build failed: {e}")
        return False

def build_client(target: str = 'all', test: bool = False, package: bool = False):
    """Build client"""
    utils.logger.info("🔨 Building client...")

    try:
        # Import and run client build
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "client"))
        from build import ClientBuilder

        builder = ClientBuilder()
        success = True

        if target in ['web', 'all']:
            success = builder.build_web_assets()

        if success and target in ['tauri', 'all']:
            success = builder.build_tauri_app()

        if success and test:
            success = builder.test_build()

        if success and package:
            success = builder.package_for_distribution()

        return success

    except Exception as e:
        utils.logger.error(f"❌ Client build failed: {e}")
        return False

def create_distribution_package():
    """Create complete distribution package"""
    utils.logger.info("📦 Creating distribution package...")

    try:
        output_dir = utils.get_project_paths()['dist']
        utils.ensure_directory(output_dir)

        # Create README for distribution
        readme_content = """# Nyx App Distribution Package

This package contains the complete Nyx App for production deployment.

## Contents

- `nyx-server.exe` - Backend server
- `Nyx.msi` - Desktop application installer
- `start-server.bat` - Server startup script
- `.env.example` - Environment configuration template

## Installation

1. **Install the desktop application**:
   - Run `Nyx.msi` installer

2. **Configure the server**:
   - Copy `.env.example` to `.env`
   - Edit `.env` with your configuration values

3. **Start the server**:
   - Run `start-server.bat`

4. **Launch the desktop app**:
   - The app will automatically connect to the local server

## Requirements

- No additional software required
- Server runs on port 8080 by default
- Ensure port 8080 is not blocked by firewall

## Support

For issues or questions, please refer to the documentation or contact support.
"""

        readme_path = output_dir / 'README.txt'
        with open(readme_path, 'w') as f:
            f.write(readme_content)

        utils.logger.info(f"📦 Distribution package created in: {output_dir}")

        # List contents
        utils.logger.info("📋 Package contents:")
        for item in output_dir.iterdir():
            if item.is_file():
                size_mb = item.stat().st_size / (1024 * 1024)
                utils.logger.info(f"  - {item.name} ({size_mb:.1f} MB)")

        return True

    except Exception as e:
        utils.logger.error(f"❌ Distribution package creation failed: {e}")
        return False

def clean_all():
    """Clean all build artifacts"""
    utils.logger.info("🧹 Cleaning all build artifacts...")

    try:
        paths = utils.get_project_paths()

        # Clean server artifacts
        server_dirs = [
            paths['server'] / 'build',
            paths['server'] / 'dist',
            paths['server'] / '__pycache__'
        ]

        for dir_path in server_dirs:
            if dir_path.exists():
                utils.clean_directory(dir_path)

        # Clean client artifacts
        client_dirs = [
            paths['client'] / 'dist',
            paths['client'] / 'src-tauri' / 'target'
        ]

        for dir_path in client_dirs:
            if dir_path.exists():
                utils.clean_directory(dir_path)

        # Clean distribution directory
        if paths['dist'].exists():
            utils.clean_directory(paths['dist'])

        utils.logger.info("✅ All build artifacts cleaned")
        return True

    except Exception as e:
        utils.logger.error(f"❌ Clean failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Nyx App Build Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python build.py --target all                    # Build everything
  python build.py --target server --test          # Build and test server
  python build.py --target client --package       # Build and package client
  python build.py --clean                         # Clean all artifacts
  python build.py --target all --distribute       # Build complete distribution
        """
    )

    parser.add_argument('--target', choices=['server', 'client', 'all'],
                       default='all', help='Build target')
    parser.add_argument('--client-target', choices=['web', 'tauri', 'all'],
                       default='all', help='Client build target')
    parser.add_argument('--test', action='store_true',
                       help='Test builds after completion')
    parser.add_argument('--package', action='store_true',
                       help='Package for distribution')
    parser.add_argument('--distribute', action='store_true',
                       help='Create complete distribution package')
    parser.add_argument('--clean', action='store_true',
                       help='Clean build artifacts before building')

    args = parser.parse_args()

    # Print banner
    print("=" * 60)
    print("🔨 Nyx App Build Orchestrator")
    print("=" * 60)

    # Clean if requested
    if args.clean:
        if not clean_all():
            sys.exit(1)

    success = True

    # Build based on target
    if args.target in ['server', 'all']:
        success = build_server(args.test, args.package)

    if success and args.target in ['client', 'all']:
        success = build_client(args.client_target, args.test, args.package)

    # Create distribution package if requested
    if success and args.distribute:
        success = create_distribution_package()

    if success:
        print("\n" + "=" * 60)
        print("✅ Build completed successfully!")
        print("=" * 60)

        if args.distribute:
            dist_path = utils.get_project_paths()['dist']
            print(f"\n📦 Distribution package ready: {dist_path}")
        else:
            print("\n📋 Next steps:")
            print("1. Test the built applications")
            print("2. Create distribution: python production/build.py --distribute")
    else:
        print("\n" + "=" * 60)
        print("❌ Build failed!")
        print("=" * 60)

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
