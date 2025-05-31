#!/usr/bin/env python3
"""
Main setup orchestrator for Nyx App
"""

import sys
import argparse
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent / "scripts" / "common"))
from utils import utils

def setup_environment():
    """Setup and validate environment"""
    utils.logger.info("🔧 Setting up Nyx App environment...")
    
    if not utils.validate_environment():
        utils.logger.error("❌ Environment validation failed")
        return False
    
    return True

def setup_server(mode: str = 'development', start: bool = False):
    """Setup server"""
    utils.logger.info(f"🖥️  Setting up server for {mode}...")
    
    try:
        # Import and run server setup
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "server"))
        from setup import ServerSetup
        
        server_setup = ServerSetup()
        
        if mode == 'development':
            success = server_setup.setup_development()
        else:
            success = server_setup.setup_production()
        
        if success and start:
            utils.logger.info("🚀 Starting development server...")
            server_setup.start_development_server()
        
        return success
        
    except Exception as e:
        utils.logger.error(f"❌ Server setup failed: {e}")
        return False

def setup_client(mode: str = 'development', start: bool = False):
    """Setup client"""
    utils.logger.info(f"💻 Setting up client for {mode}...")
    
    try:
        # Import and run client setup
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "client"))
        from setup import ClientSetup
        
        client_setup = ClientSetup()
        success = client_setup.setup_development()
        
        if success:
            success = client_setup.check_rust_dependencies()
        
        if success and start:
            utils.logger.info("🚀 Starting development server...")
            client_setup.start_development_server()
        
        return success
        
    except Exception as e:
        utils.logger.error(f"❌ Client setup failed: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Nyx App Setup Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup.py --mode development                    # Setup for development
  python setup.py --mode development --start           # Setup and start servers
  python setup.py --target server --mode development   # Setup only server
  python setup.py --target client --check-rust         # Setup client and check Rust
        """
    )
    
    parser.add_argument('--mode', choices=['development', 'production'], 
                       default='development', help='Setup mode')
    parser.add_argument('--target', choices=['server', 'client', 'all'], 
                       default='all', help='Setup target')
    parser.add_argument('--start', action='store_true', 
                       help='Start development servers after setup')
    parser.add_argument('--check-rust', action='store_true', 
                       help='Check Rust dependencies for client')
    parser.add_argument('--validate-only', action='store_true', 
                       help='Only validate environment')
    
    args = parser.parse_args()
    
    # Print banner
    print("=" * 60)
    print("🚀 Nyx App Setup Orchestrator")
    print("=" * 60)
    
    # Validate environment first
    if not setup_environment():
        sys.exit(1)
    
    if args.validate_only:
        utils.logger.info("✅ Environment validation completed")
        sys.exit(0)
    
    success = True
    
    # Setup based on target
    if args.target in ['server', 'all']:
        success = setup_server(args.mode, args.start and args.target == 'server')
    
    if success and args.target in ['client', 'all']:
        success = setup_client(args.mode, args.start and args.target == 'client')
    
    # Start both servers if requested and target is 'all'
    if success and args.start and args.target == 'all':
        utils.logger.info("🚀 To start development servers:")
        utils.logger.info("  Server: python production/scripts/server/setup.py --start")
        utils.logger.info("  Client: python production/scripts/client/setup.py --start")
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Setup completed successfully!")
        print("=" * 60)
        
        if args.mode == 'development':
            print("\n📋 Next steps:")
            print("1. Edit server/.env with your configuration")
            print("2. Start server: python production/scripts/server/setup.py --start")
            print("3. Start client: python production/scripts/client/setup.py --start")
        else:
            print("\n📋 Next steps:")
            print("1. Build server: python production/build.py --target server")
            print("2. Build client: python production/build.py --target client")
    else:
        print("\n" + "=" * 60)
        print("❌ Setup failed!")
        print("=" * 60)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
