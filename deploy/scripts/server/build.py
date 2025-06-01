"""
Server build automation
"""

import sys
from pathlib import Path

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
from utils import utils

class ServerBuilder:
    """Server build automation"""

    def __init__(self):
        self.paths = utils.get_project_paths()
        self.config = utils.config.get('server', {})
        self.build_config = self.config.get('build', {})
        self.logger = utils.logger

    def create_spec_file(self, output_path: Path) -> Path:
        """Create PyInstaller spec file"""
        spec_file = output_path / "nyx-server.spec"

        # Get configuration
        name = self.build_config.get('name', 'nyx-server')
        add_data = self.build_config.get('options', {}).get('add_data', [])
        hidden_imports = self.build_config.get('options', {}).get('hidden_imports', [])

        # Format add_data for spec file
        add_data_str = ',\n        '.join([f"('{item.split(':')[0]}', '{item.split(':')[1]}')" for item in add_data])
        hidden_imports_str = ',\n        '.join([f"'{imp}'" for imp in hidden_imports])

        spec_content = f'''# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
        {add_data_str}
    ],
    hiddenimports=[
        {hidden_imports_str}
    ],
    hookspath=[],
    hooksconfig={{}},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='{name}',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    cofile=None,
    icon=None,
)
'''

        with open(spec_file, 'w') as f:
            f.write(spec_content)

        self.logger.info(f">> Created PyInstaller spec file: {spec_file}")
        return spec_file

    def build_executable(self) -> bool:
        """Build standalone executable"""
        self.logger.info(">> Building server executable...")

        try:
            server_path = self.paths['server']
            venv_path = server_path / self.config.get('venv_name', 'base')

            # Ensure build directory exists
            build_dir = server_path / 'build'
            dist_dir = server_path / 'dist'

            # Clean previous builds
            utils.clean_directory(build_dir)
            utils.clean_directory(dist_dir)

            # Get Windows PyInstaller executable
            pyinstaller_cmd = str(venv_path / "Scripts" / "pyinstaller.exe")

            # Create spec file
            spec_file = self.create_spec_file(server_path)

            # Build with PyInstaller
            utils.run_command([
                pyinstaller_cmd,
                "--clean",
                str(spec_file)
            ], cwd=str(server_path))

            # Verify executable was created
            exe_name = utils.get_platform_executable_name(self.build_config.get('name', 'nyx-server'))
            exe_path = dist_dir / exe_name

            if not exe_path.exists():
                raise FileNotFoundError(f"Executable not found: {exe_path}")

            # Get file size
            size_mb = exe_path.stat().st_size / (1024 * 1024)
            self.logger.info(f"✅ Executable created: {exe_path} ({size_mb:.1f} MB)")

            return True

        except Exception as e:
            self.logger.error(f"❌ Build failed: {e}")
            return False

    def test_executable(self) -> bool:
        """Test the built executable"""
        self.logger.info("🧪 Testing executable...")

        try:
            server_path = self.paths['server']
            dist_dir = server_path / 'dist'
            exe_name = utils.get_platform_executable_name(self.build_config.get('name', 'nyx-server'))
            exe_path = dist_dir / exe_name

            if not exe_path.exists():
                raise FileNotFoundError(f"Executable not found: {exe_path}")

            # Test that it starts (we'll kill it quickly)
            import signal
            import time
            import subprocess

            self.logger.info("Starting executable test...")
            process = subprocess.Popen([str(exe_path)],
                                     stdout=subprocess.PIPE,
                                     stderr=subprocess.PIPE)

            # Wait a shorter time for faster testing
            time.sleep(3)

            # Check if process is still running
            if process.poll() is None:
                self.logger.info("✅ Executable started successfully")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.logger.warning("Process didn't terminate gracefully, killing...")
                    process.kill()
                    process.wait()
                return True
            else:
                stdout, stderr = process.communicate()
                self.logger.error(f"❌ Executable failed to start")
                if stdout:
                    self.logger.error(f"stdout: {stdout.decode()}")
                if stderr:
                    self.logger.error(f"stderr: {stderr.decode()}")
                return False

        except Exception as e:
            self.logger.error(f"❌ Test failed: {e}")
            return False

    def package_for_distribution(self) -> bool:
        """Package executable for distribution"""
        self.logger.info("📦 Packaging for distribution...")

        try:
            server_path = self.paths['server']
            dist_dir = server_path / 'dist'
            output_dir = self.paths['dist']

            # Ensure output directory exists
            utils.ensure_directory(output_dir)

            # Copy executable
            exe_name = utils.get_platform_executable_name(self.build_config.get('name', 'nyx-server'))
            src_exe = dist_dir / exe_name
            dst_exe = output_dir / exe_name

            utils.copy_file(src_exe, dst_exe)

            # Copy environment template
            env_template = self.paths['production'] / 'config' / 'server.env.template'
            dst_env = output_dir / '.env.example'
            utils.copy_file(env_template, dst_env)

            # Create Windows startup script
            startup_script = output_dir / 'start-server.bat'
            with open(startup_script, 'w') as f:
                f.write(f'''@echo off
echo Starting Nyx Server...
echo Server will be available at http://localhost:8080
echo Press Ctrl+C to stop the server
echo.
{exe_name}
pause
''')

            self.logger.info(f"📦 Server packaged in: {output_dir}")
            return True

        except Exception as e:
            self.logger.error(f"❌ Packaging failed: {e}")
            return False

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Server build automation")
    parser.add_argument('--test', action='store_true',
                       help='Test executable after building')
    parser.add_argument('--package', action='store_true',
                       help='Package for distribution')
    parser.add_argument('--clean', action='store_true',
                       help='Clean build artifacts before building')

    args = parser.parse_args()

    builder = ServerBuilder()

    # Clean if requested
    if args.clean:
        server_path = builder.paths['server']
        utils.clean_directory(server_path / 'build')
        utils.clean_directory(server_path / 'dist')
        utils.logger.info("🧹 Cleaned build artifacts")

    # Build executable
    success = builder.build_executable()

    if success and args.test:
        success = builder.test_executable()

    if success and args.package:
        success = builder.package_for_distribution()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
