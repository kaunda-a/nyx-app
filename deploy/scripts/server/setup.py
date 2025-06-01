"""
Server setup automation
"""

import sys
from pathlib import Path

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
from utils import utils

class ServerSetup:
    """Server setup automation"""

    def __init__(self):
        self.paths = utils.get_project_paths()
        self.config = utils.config.get('server', {})
        self.logger = utils.logger

    def setup_development(self) -> bool:
        """Setup server for development"""
        self.logger.info(">> Setting up server for development...")

        try:
            # Change to server directory
            server_path = self.paths['server']
            if not server_path.exists():
                raise FileNotFoundError(f"Server directory not found: {server_path}")

            # Create virtual environment
            venv_name = self.config.get('venv_name', 'base')
            venv_path = server_path / venv_name

            utils.create_virtual_environment(venv_path)

            # Install requirements
            requirements_file = server_path / self.config.get('requirements_file', 'requirements.txt')
            utils.install_python_requirements(venv_path, requirements_file)

            # Create environment file if it doesn't exist
            env_file = server_path / '.env'
            if not env_file.exists():
                template_path = self.paths['production'] / 'config' / 'server.env.template'
                utils.create_env_file(template_path, env_file)
                self.logger.warning("⚠️  Please edit server/.env with your actual configuration values")

            # Create necessary directories
            utils.ensure_directory(server_path / 'logs')
            utils.ensure_directory(server_path / 'sessions')

            self.logger.info("✅ Server development setup completed")
            return True

        except Exception as e:
            self.logger.error(f"❌ Server setup failed: {e}")
            return False

    def setup_production(self) -> bool:
        """Setup server for production"""
        self.logger.info(">> Setting up server for production...")

        try:
            # Ensure development setup is done first
            if not self.setup_development():
                return False

            # Install additional production dependencies
            server_path = self.paths['server']
            venv_path = server_path / self.config.get('venv_name', 'base')

            # Get Windows pip executable
            pip_cmd = str(venv_path / "Scripts" / "pip.exe")

            # Install PyInstaller for building executables
            utils.run_command([pip_cmd, "install", "pyinstaller"])

            self.logger.info("SUCCESS: Server production setup completed")
            return True

        except Exception as e:
            self.logger.error(f"ERROR: Server production setup failed: {e}")
            return False

    def validate_setup(self) -> bool:
        """Validate server setup"""
        self.logger.info(">> Validating server setup...")

        try:
            server_path = self.paths['server']
            venv_name = self.config.get('venv_name', 'base')
            venv_path = server_path / venv_name

            # Check virtual environment
            if not venv_path.exists():
                self.logger.error("ERROR: Virtual environment not found")
                return False

            # Check main file
            main_file = server_path / self.config.get('main_file', 'main.py')
            if not main_file.exists():
                self.logger.error(f"ERROR: Main file not found: {main_file}")
                return False

            # Check environment file
            env_file = server_path / '.env'
            if not env_file.exists():
                self.logger.warning("⚠️  Environment file not found")
                return False

            # Test Python import
            python_cmd = str(venv_path / "Scripts" / "python.exe")

            test_result = utils.run_command(
                [python_cmd, "-c", "import fastapi, uvicorn; print('OK')"],
                cwd=str(server_path),
                capture_output=True
            )

            if "OK" not in test_result.stdout:
                self.logger.error("ERROR: Required packages not properly installed")
                return False

            self.logger.info("SUCCESS: Server setup validation passed")
            return True

        except Exception as e:
            self.logger.error(f"ERROR: Server validation failed: {e}")
            return False

    def start_development_server(self) -> bool:
        """Start development server"""
        self.logger.info(">> Starting development server...")

        try:
            if not self.validate_setup():
                return False

            server_path = self.paths['server']
            venv_path = server_path / self.config.get('venv_name', 'base')

            # Get Windows Python executable
            python_cmd = str(venv_path / "Scripts" / "python.exe")

            # Start server
            main_file = self.config.get('main_file', 'main.py')
            health_url = self.config.get('health_check', {}).get('url', 'http://localhost:8080')
            port = health_url.split(':')[-1].split('/')[0] if ':' in health_url else '8080'
            self.logger.info(f"Starting server at http://localhost:{port}")

            utils.run_command([python_cmd, main_file], cwd=str(server_path))

            return True

        except KeyboardInterrupt:
            self.logger.info("🛑 Server stopped by user")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to start server: {e}")
            return False

def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description="Server setup automation")
    parser.add_argument('--mode', choices=['development', 'production'],
                       default='development', help='Setup mode')
    parser.add_argument('--start', action='store_true',
                       help='Start server after setup')
    parser.add_argument('--validate', action='store_true',
                       help='Only validate existing setup')

    args = parser.parse_args()

    setup = ServerSetup()

    if args.validate:
        success = setup.validate_setup()
    elif args.mode == 'development':
        success = setup.setup_development()
        if success and args.start:
            setup.start_development_server()
    elif args.mode == 'production':
        success = setup.setup_production()
    else:
        success = False

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
