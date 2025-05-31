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

            # Build Tauri app
            utils.run_command([package_manager, build_command], cwd=str(client_path))

            # Verify build output
            bundle_dir = client_path / 'src-tauri' / 'target' / 'release' / 'bundle'
            if not bundle_dir.exists():
                raise FileNotFoundError("Tauri build output not found")

            # Find built Windows installers
            installers = []
            for pattern in ['**/*.msi', '**/*.exe']:
                installers.extend(glob.glob(str(bundle_dir / pattern), recursive=True))

            if not installers:
                raise FileNotFoundError("No installers found in build output")

            for installer in installers:
                size_mb = Path(installer).stat().st_size / (1024 * 1024)
                self.logger.info(f"📦 Built installer: {installer} ({size_mb:.1f} MB)")

            self.logger.info("✅ Tauri application built successfully")
            return True

        except Exception as e:
            self.logger.error(f"❌ Tauri build failed: {e}")
            return False

    def package_for_distribution(self) -> bool:
        """Package client for distribution"""
        self.logger.info("📦 Packaging client for distribution...")

        try:
            client_path = self.paths['client']
            output_dir = self.paths['dist']

            # Ensure output directory exists
            utils.ensure_directory(output_dir)

            # Copy installers
            bundle_dir = client_path / 'src-tauri' / 'target' / 'release' / 'bundle'

            # Find and copy Windows installers
            for pattern in ['**/*.msi', '**/*.exe']:
                for installer_path in glob.glob(str(bundle_dir / pattern), recursive=True):
                    installer = Path(installer_path)
                    # Rename to simple Nyx.msi if it's an MSI installer
                    if installer.suffix.lower() == '.msi':
                        dst_path = output_dir / 'Nyx.msi'
                    else:
                        dst_path = output_dir / installer.name
                    utils.copy_file(installer, dst_path)

            self.logger.info(f"📦 Client packaged in: {output_dir}")
            return True

        except Exception as e:
            self.logger.error(f"❌ Client packaging failed: {e}")
            return False

    def test_build(self) -> bool:
        """Test the built application"""
        self.logger.info("🧪 Testing built application...")

        try:
            # For now, just verify files exist
            client_path = self.paths['client']
            bundle_dir = client_path / 'src-tauri' / 'target' / 'release' / 'bundle'

            if not bundle_dir.exists():
                raise FileNotFoundError("Build output directory not found")

            # Check for Windows installers
            installers = []
            for pattern in ['**/*.msi', '**/*.exe']:
                installers.extend(glob.glob(str(bundle_dir / pattern), recursive=True))

            if not installers:
                raise FileNotFoundError("No installers found")

            # Basic file integrity check
            for installer_path in installers:
                installer = Path(installer_path)
                if installer.stat().st_size < 1024:  # Less than 1KB is suspicious
                    raise ValueError(f"Installer seems too small: {installer}")

            self.logger.info("✅ Build test passed")
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
