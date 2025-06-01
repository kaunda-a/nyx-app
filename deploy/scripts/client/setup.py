"""
Client setup automation
"""

import sys
from pathlib import Path

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
from utils import utils

class ClientSetup:
    """Client setup automation"""
    
    def __init__(self):
        self.paths = utils.get_project_paths()
        self.config = utils.config.get('client', {})
        self.logger = utils.logger
        
    def setup_development(self) -> bool:
        """Setup client for development"""
        self.logger.info("🚀 Setting up client for development...")
        
        try:
            client_path = self.paths['client']
            if not client_path.exists():
                raise FileNotFoundError(f"Client directory not found: {client_path}")
            
            # Check if package.json exists
            package_json = client_path / 'package.json'
            if not package_json.exists():
                raise FileNotFoundError(f"package.json not found: {package_json}")
            
            # Install dependencies
            package_manager = self.config.get('package_manager', 'pnpm')
            utils.run_command([package_manager, 'install'], cwd=str(client_path))
            
            # Create production environment file if it doesn't exist
            env_prod_file = client_path / '.env.production'
            if not env_prod_file.exists():
                self.create_production_env_file(env_prod_file)
            
            self.logger.info("✅ Client development setup completed")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Client setup failed: {e}")
            return False
    
    def create_production_env_file(self, env_file: Path) -> None:
        """Create production environment file"""
        content = '''# Production Environment Configuration
VITE_SUPABASE_URL=https://txrzdqqiofnszegjqgac.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4cnpkcXFpb2Zuc3plZ2pxZ2FjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwNjYyNTIsImV4cCI6MjA1NzY0MjI1Mn0.MhsfSR3V42F-_6XSXUKTVb_sJQpIQsJfSVI7pS_Ppeg

# Production API and WebSocket URLs
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081
'''
        
        with open(env_file, 'w') as f:
            f.write(content)
        
        self.logger.info(f"📝 Created production environment file: {env_file}")
    
    def validate_setup(self) -> bool:
        """Validate client setup"""
        self.logger.info("🔍 Validating client setup...")
        
        try:
            client_path = self.paths['client']
            
            # Check package.json
            package_json = client_path / 'package.json'
            if not package_json.exists():
                self.logger.error(f"❌ package.json not found: {package_json}")
                return False
            
            # Check node_modules
            node_modules = client_path / 'node_modules'
            if not node_modules.exists():
                self.logger.error("❌ node_modules not found - run setup first")
                return False
            
            # Check Tauri configuration
            tauri_conf = client_path / 'src-tauri' / 'tauri.conf.json'
            if not tauri_conf.exists():
                self.logger.error(f"❌ Tauri configuration not found: {tauri_conf}")
                return False
            
            # Test package manager
            package_manager = self.config.get('package_manager', 'pnpm')
            result = utils.run_command(
                [package_manager, '--version'],
                capture_output=True
            )
            
            if result.returncode != 0:
                self.logger.error(f"❌ Package manager not working: {package_manager}")
                return False
            
            self.logger.info("✅ Client setup validation passed")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Client validation failed: {e}")
            return False
    
    def start_development_server(self) -> bool:
        """Start development server"""
        self.logger.info("🚀 Starting client development server...")
        
        try:
            if not self.validate_setup():
                return False
            
            client_path = self.paths['client']
            package_manager = self.config.get('package_manager', 'pnpm')
            dev_command = self.config.get('dev', {}).get('command', 'dev')
            
            self.logger.info(f"Starting client at http://localhost:{self.config.get('dev', {}).get('port', 5173)}")
            
            utils.run_command([package_manager, dev_command], cwd=str(client_path))
            
            return True
            
        except KeyboardInterrupt:
            self.logger.info("🛑 Development server stopped by user")
            return True
        except Exception as e:
            self.logger.error(f"❌ Failed to start development server: {e}")
            return False
    
    def check_rust_dependencies(self) -> bool:
        """Check Rust and Tauri dependencies"""
        self.logger.info("🔍 Checking Rust dependencies...")
        
        try:
            # Check Rust
            rust_deps = utils.check_dependencies(['rustc', 'cargo'])
            if not all(rust_deps.values()):
                self.logger.error("❌ Rust not found. Please install Rust from https://rustup.rs/")
                return False
            
            # Check Tauri CLI - skip version check and assume it's installed since we see it in dependencies
            client_path = self.paths['client']
            package_manager = self.config.get('package_manager', 'pnpm')

            # Check if @tauri-apps/cli is in package.json devDependencies
            package_json = client_path / 'package.json'
            tauri_installed = False

            if package_json.exists():
                import json
                with open(package_json, 'r') as f:
                    pkg_data = json.load(f)
                    dev_deps = pkg_data.get('devDependencies', {})
                    tauri_installed = '@tauri-apps/cli' in dev_deps

            if not tauri_installed:
                self.logger.warning("⚠️  Tauri CLI not found in package.json, installing...")
                utils.run_command(
                    [package_manager, 'add', '-D', '@tauri-apps/cli'],
                    cwd=str(client_path)
                )
            else:
                self.logger.info("✅ Tauri CLI found in dependencies")
            
            self.logger.info("✅ Rust dependencies check passed")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Rust dependencies check failed: {e}")
            return False

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Client setup automation")
    parser.add_argument('--mode', choices=['development', 'production'], 
                       default='development', help='Setup mode')
    parser.add_argument('--start', action='store_true', 
                       help='Start development server after setup')
    parser.add_argument('--validate', action='store_true', 
                       help='Only validate existing setup')
    parser.add_argument('--check-rust', action='store_true', 
                       help='Check Rust dependencies')
    
    args = parser.parse_args()
    
    setup = ClientSetup()
    
    if args.validate:
        success = setup.validate_setup()
    elif args.check_rust:
        success = setup.check_rust_dependencies()
    else:
        success = setup.setup_development()
        
        if success and args.check_rust:
            success = setup.check_rust_dependencies()
        
        if success and args.start:
            setup.start_development_server()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
