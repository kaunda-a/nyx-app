#!/usr/bin/env python3
"""
Main deployment orchestrator for Nyx App
"""

import sys
import argparse
from pathlib import Path

# Add scripts to path
sys.path.insert(0, str(Path(__file__).parent / "scripts" / "common"))
from utils import utils

def generate_signing_keys(with_password: bool = False, force: bool = False):
    """Generate Tauri signing keys"""
    utils.logger.info("🔐 Generating signing keys...")
    
    try:
        # Import and run key generation
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "deploy"))
        from generate_keys import KeyGenerator
        
        generator = KeyGenerator()
        
        # Check if keys already exist
        keys_dir = generator.paths['production'] / 'config' / 'keys'
        private_key_file = keys_dir / 'private_key.txt'
        
        if private_key_file.exists() and not force:
            utils.logger.warning("⚠️  Keys already exist!")
            utils.logger.info("Use --force to regenerate")
            return False
        
        return generator.generate_keys(with_password)
        
    except Exception as e:
        utils.logger.error(f"❌ Key generation failed: {e}")
        return False

def validate_signing_keys():
    """Validate existing signing keys"""
    utils.logger.info("🔍 Validating signing keys...")
    
    try:
        # Import and run key validation
        sys.path.insert(0, str(Path(__file__).parent / "scripts" / "deploy"))
        from generate_keys import KeyGenerator
        
        generator = KeyGenerator()
        return generator.validate_keys()
        
    except Exception as e:
        utils.logger.error(f"❌ Key validation failed: {e}")
        return False

def setup_github_deployment():
    """Setup GitHub deployment configuration"""
    utils.logger.info("🐙 Setting up GitHub deployment...")
    
    try:
        # Validate keys exist
        if not validate_signing_keys():
            utils.logger.error("❌ Signing keys not found or invalid")
            utils.logger.info("Run: python production/deploy.py --generate-keys")
            return False
        
        # Read keys
        keys_dir = utils.get_project_paths()['production'] / 'config' / 'keys'
        private_key_file = keys_dir / 'private_key.txt'
        password_file = keys_dir / 'key_password.txt'
        
        with open(private_key_file, 'r') as f:
            private_key = f.read().strip()
        
        password = None
        if password_file.exists():
            with open(password_file, 'r') as f:
                password = f.read().strip()
        
        # Show GitHub setup instructions
        utils.logger.info("\n📋 GitHub Secrets Setup:")
        utils.logger.info("1. Go to your repository: Settings > Secrets and variables > Actions")
        utils.logger.info("2. Add the following secrets:")
        utils.logger.info(f"   - Name: TAURI_PRIVATE_KEY")
        utils.logger.info(f"   - Value: {private_key}")
        
        if password:
            utils.logger.info(f"   - Name: TAURI_KEY_PASSWORD")
            utils.logger.info(f"   - Value: {password}")
        
        utils.logger.info("\n3. Ensure your workflow file is up to date:")
        workflow_file = utils.get_project_paths()['root'] / '.github' / 'workflows' / 'build-and-test.yml'
        utils.logger.info(f"   - File: {workflow_file}")
        
        if workflow_file.exists():
            utils.logger.info("   ✅ Workflow file exists")
        else:
            utils.logger.warning("   ⚠️  Workflow file not found")
        
        utils.logger.info("\n🚀 After setting up secrets, push to trigger the workflow!")
        
        return True
        
    except Exception as e:
        utils.logger.error(f"❌ GitHub setup failed: {e}")
        return False

def prepare_local_deployment():
    """Prepare local deployment package"""
    utils.logger.info("📦 Preparing local deployment...")
    
    try:
        # Ensure everything is built
        utils.logger.info("Building all components...")
        
        # Import build orchestrator
        sys.path.insert(0, str(Path(__file__).parent))
        import build
        
        # Build everything
        success = True
        success = build.build_server(test=True, package=True)
        
        if success:
            success = build.build_client(target='all', test=True, package=True)
        
        if success:
            success = build.create_distribution_package()
        
        if success:
            utils.logger.info("✅ Local deployment package ready")
            dist_path = utils.get_project_paths()['dist']
            utils.logger.info(f"📁 Location: {dist_path}")
            
            # List package contents
            utils.logger.info("\n📋 Package contents:")
            for item in dist_path.iterdir():
                if item.is_file():
                    size_mb = item.stat().st_size / (1024 * 1024)
                    utils.logger.info(f"  - {item.name} ({size_mb:.1f} MB)")
        
        return success
        
    except Exception as e:
        utils.logger.error(f"❌ Local deployment preparation failed: {e}")
        return False

def create_deployment_guide():
    """Create deployment guide"""
    utils.logger.info("📝 Creating deployment guide...")
    
    try:
        guide_content = """# Nyx App Deployment Guide

## Quick Deployment

### Local Deployment
1. Run the deployment preparation:
   ```bash
   python production/deploy.py --target local
   ```

2. Files will be created in the `dist/` directory:
   - Server executable
   - Client installer
   - Startup scripts
   - Configuration templates

### GitHub Deployment
1. Generate signing keys:
   ```bash
   python production/deploy.py --generate-keys
   ```

2. Setup GitHub secrets:
   ```bash
   python production/deploy.py --target github
   ```

3. Push to repository to trigger automated build

## Manual Steps

### 1. Generate Signing Keys
```bash
# Generate keys without password
python production/scripts/deploy/generate-keys.py

# Generate keys with password protection
python production/scripts/deploy/generate-keys.py --with-password

# Validate existing keys
python production/scripts/deploy/generate-keys.py --validate
```

### 2. Setup Environment
```bash
# Development setup
python production/setup.py --mode development

# Production setup
python production/setup.py --mode production
```

### 3. Build Applications
```bash
# Build everything
python production/build.py --target all --test --distribute

# Build specific components
python production/build.py --target server --package
python production/build.py --target client --package
```

## Security Notes

- Private keys are stored in `production/config/keys/` (gitignored)
- Never commit private keys to version control
- Use strong passwords for key protection
- Regularly rotate signing keys for production

## Troubleshooting

### Key Generation Issues
- Ensure Tauri CLI is installed
- Check Node.js and pnpm are available
- Verify client dependencies are installed

### Build Issues
- Validate environment: `python production/setup.py --validate-only`
- Check logs for specific error messages
- Ensure all dependencies are installed

### Deployment Issues
- Verify all files are in the dist directory
- Check file permissions on executables
- Ensure environment variables are set correctly
"""
        
        guide_path = utils.get_project_paths()['production'] / 'DEPLOYMENT.md'
        with open(guide_path, 'w') as f:
            f.write(guide_content)
        
        utils.logger.info(f"📝 Deployment guide created: {guide_path}")
        return True
        
    except Exception as e:
        utils.logger.error(f"❌ Failed to create deployment guide: {e}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Nyx App Deployment Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python deploy.py --generate-keys                    # Generate signing keys
  python deploy.py --generate-keys --with-password    # Generate keys with password
  python deploy.py --target local                     # Prepare local deployment
  python deploy.py --target github                    # Setup GitHub deployment
  python deploy.py --validate-keys                    # Validate existing keys
        """
    )
    
    parser.add_argument('--target', choices=['local', 'github'], 
                       help='Deployment target')
    parser.add_argument('--generate-keys', action='store_true', 
                       help='Generate Tauri signing keys')
    parser.add_argument('--with-password', action='store_true', 
                       help='Generate keys with password protection')
    parser.add_argument('--force', action='store_true', 
                       help='Force regenerate keys even if they exist')
    parser.add_argument('--validate-keys', action='store_true', 
                       help='Validate existing signing keys')
    parser.add_argument('--create-guide', action='store_true', 
                       help='Create deployment guide')
    
    args = parser.parse_args()
    
    # Print banner
    print("=" * 60)
    print("🚀 Nyx App Deployment Orchestrator")
    print("=" * 60)
    
    success = True
    
    # Handle key operations
    if args.generate_keys:
        success = generate_signing_keys(args.with_password, args.force)
    elif args.validate_keys:
        success = validate_signing_keys()
    elif args.target == 'local':
        success = prepare_local_deployment()
    elif args.target == 'github':
        success = setup_github_deployment()
    elif args.create_guide:
        success = create_deployment_guide()
    else:
        parser.print_help()
        success = False
    
    if success and args.target:
        print("\n" + "=" * 60)
        print("✅ Deployment preparation completed!")
        print("=" * 60)
    elif not success:
        print("\n" + "=" * 60)
        print("❌ Deployment preparation failed!")
        print("=" * 60)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
