"""
Client build automation
"""

import sys
from pathlib import Path
import glob

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
from utils import utils

class ClientBuilder:
    """Client build automation"""

    def __init__(self):
        self.paths = utils.get_project_paths()
        self.config = utils.config.get('client', {})
        self.build_config = self.config.get('build', {})
        self.logger = utils.logger

    def build_web_assets(self) -> bool:
        """Build web assets"""
        self.logger.info("🔨 Building web assets...")

        try:
            client_path = self.paths['client']
            package_manager = self.config.get('package_manager', 'pnpm')

            # Clean previous build
            dist_dir = client_path / 'dist'
            utils.clean_directory(dist_dir)

            # Build web assets
            utils.run_command([package_manager, 'build'], cwd=str(client_path))

            # Verify build output
            if not dist_dir.exists() or not any(dist_dir.iterdir()):
                raise FileNotFoundError("Build output not found")

            self.logger.info("✅ Web assets built successfully")
            return True

        except Exception as e:
            self.logger.error(f"❌ Web build failed: {e}")
            return False

    def build_tauri_app(self) -> bool:
        """Build Tauri application"""
        self.logger.info("🔨 Building Tauri application...")

        try:
            client_path = self.paths['client']
            package_manager = self.config.get('package_manager', 'pnpm')
            build_command = self.build_config.get('command', 'tauri build')

            # Ensure production environment file exists
            env_file = client_path / self.build_config.get('env_file', '.env.production')
            if not env_file.exists():
                self.logger.warning(f"⚠️  Production environment file not found: {env_file}")
                # Create basic one
                with open(env_file, 'w') as f:
                    f.write('''VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081
''')

            # Build Tauri app - use the npm script defined in package.json
            utils.run_command([package_manager, 'run', 'tauri:build'], cwd=str(client_path))

            # Verify build output - check for executable instead of bundle
            exe_path = client_path / 'src-tauri' / 'target' / 'release' / 'app.exe'
            if not exe_path.exists():
                raise FileNotFoundError("Tauri executable not found")

            # Report the built executable
            size_mb = exe_path.stat().st_size / (1024 * 1024)
            self.logger.info(f"📦 Built executable: {exe_path} ({size_mb:.1f} MB)")

            self.logger.info("✅ Tauri application built successfully")
            return True

        except Exception as e:
            self.logger.error(f"❌ Tauri build failed: {e}")
            return False

    def package_for_distribution(self) -> bool:
        """Package client for distribution"""
        self.logger.info(">> Packaging client for distribution...")

        try:
            client_path = self.paths['client']
            output_dir = self.paths['dist']

            # Ensure output directory exists
            utils.ensure_directory(output_dir)

            # Copy the built installer (NSIS creates a single executable installer)
            bundle_dir = client_path / 'src-tauri' / 'target' / 'release' / 'bundle' / 'nsis'
            if bundle_dir.exists():
                # Find the NSIS installer
                for installer_path in bundle_dir.glob('*.exe'):
                    dst_path = output_dir / 'nyx.exe'
                    utils.copy_file(installer_path, dst_path)
                    size_mb = installer_path.stat().st_size / (1024 * 1024)
                    self.logger.info(f">> Copied standalone app: {dst_path} ({size_mb:.1f} MB)")
                    break
                else:
                    self.logger.warning("NSIS installer not found")
            else:
                # Fallback to raw executable if bundling failed
                exe_path = client_path / 'src-tauri' / 'target' / 'release' / 'app.exe'
                if exe_path.exists():
                    dst_path = output_dir / 'nyx.exe'
                    utils.copy_file(exe_path, dst_path)
                    size_mb = exe_path.stat().st_size / (1024 * 1024)
                    self.logger.info(f">> Copied desktop app: {dst_path} ({size_mb:.1f} MB)")
                else:
                    self.logger.warning("Desktop app executable not found")

            self.logger.info(f">> Client packaged in: {output_dir}")
            return True

        except Exception as e:
            self.logger.error(f"ERROR: Client packaging failed: {e}")
            return False

    def test_build(self) -> bool:
        """Test the built application"""
        self.logger.info("🧪 Testing built application...")

        try:
            # Check for the built executable
            client_path = self.paths['client']
            exe_path = client_path / 'src-tauri' / 'target' / 'release' / 'app.exe'

            if not exe_path.exists():
                raise FileNotFoundError("Executable not found")

            # Basic file integrity check
            if exe_path.stat().st_size < 1024 * 1024:  # Less than 1MB is suspicious for a Tauri app
                raise ValueError(f"Executable seems too small: {exe_path}")

            size_mb = exe_path.stat().st_size / (1024 * 1024)
            self.logger.info(f"✅ Build test passed - Executable: {size_mb:.1f} MB")
            return True

        except Exception as e:
            self.logger.error(f"❌ Build test failed: {e}")
            return False

    def clean_build_artifacts(self) -> bool:
        """Clean build artifacts"""
        self.logger.info("🧹 Cleaning build artifacts...")

        try:
            client_path = self.paths['client']

            # Clean directories
            dirs_to_clean = [
                client_path / 'dist',
                client_path / 'src-tauri' / 'target'
            ]

            for dir_path in dirs_to_clean:
                if dir_path.exists():
                    utils.clean_directory(dir_path)

            self.logger.info("✅ Build artifacts cleaned")
            return True

        except Exception as e:
            self.logger.error(f"❌ Clean failed: {e}")
            return False

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Client build automation")
    parser.add_argument('--target', choices=['web', 'tauri', 'all'],
                       default='all', help='Build target')
    parser.add_argument('--test', action='store_true',
                       help='Test build after completion')
    parser.add_argument('--package', action='store_true',
                       help='Package for distribution')
    parser.add_argument('--clean', action='store_true',
                       help='Clean build artifacts before building')

    args = parser.parse_args()

    builder = ClientBuilder()

    # Clean if requested
    if args.clean:
        builder.clean_build_artifacts()

    success = True

    # Build based on target
    if args.target in ['web', 'all']:
        success = builder.build_web_assets()

    if success and args.target in ['tauri', 'all']:
        success = builder.build_tauri_app()

    if success and args.test:
        success = builder.test_build()

    if success and args.package:
        success = builder.package_for_distribution()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
