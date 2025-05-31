#!/usr/bin/env python3
"""
Generate signing keys for Tauri updater
"""

import sys
import subprocess
import json
from pathlib import Path

# Add common utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
from utils import utils

class KeyGenerator:
    """Tauri signing key generator"""
    
    def __init__(self):
        self.paths = utils.get_project_paths()
        self.logger = utils.logger
        
    def check_tauri_cli(self) -> bool:
        """Check if Tauri CLI is available"""
        self.logger.info("🔍 Checking Tauri CLI availability...")
        
        try:
            client_path = self.paths['client']
            
            # Try global Tauri CLI first
            try:
                result = utils.run_command(['tauri', '--version'], capture_output=True)
                if result.returncode == 0:
                    self.logger.info("✅ Global Tauri CLI found")
                    return True
            except:
                pass
            
            # Try local Tauri CLI via package manager
            package_manager = utils.config.get('client', {}).get('package_manager', 'pnpm')
            try:
                result = utils.run_command(
                    [package_manager, 'tauri', '--version'], 
                    cwd=str(client_path),
                    capture_output=True
                )
                if result.returncode == 0:
                    self.logger.info("✅ Local Tauri CLI found")
                    return True
            except:
                pass
            
            # Try to install Tauri CLI locally
            self.logger.info("📦 Installing Tauri CLI...")
            utils.run_command(
                [package_manager, 'add', '-D', '@tauri-apps/cli'],
                cwd=str(client_path)
            )
            
            # Verify installation
            result = utils.run_command(
                [package_manager, 'tauri', '--version'], 
                cwd=str(client_path),
                capture_output=True
            )
            
            if result.returncode == 0:
                self.logger.info("✅ Tauri CLI installed successfully")
                return True
            else:
                self.logger.error("❌ Failed to install Tauri CLI")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Error checking Tauri CLI: {e}")
            return False
    
    def generate_keys(self, with_password: bool = False) -> bool:
        """Generate signing keys"""
        self.logger.info("🔐 Generating Tauri updater signing keys...")
        
        try:
            if not self.check_tauri_cli():
                return False
            
            client_path = self.paths['client']
            package_manager = utils.config.get('client', {}).get('package_manager', 'pnpm')
            
            # Generate keys
            cmd = [package_manager, 'tauri', 'signer', 'generate']
            if with_password:
                cmd.append('-w')  # Generate with password
            
            self.logger.info("Generating key pair...")
            result = utils.run_command(cmd, cwd=str(client_path), capture_output=True)
            
            if result.returncode != 0:
                self.logger.error(f"❌ Key generation failed: {result.stderr}")
                return False
            
            self.logger.info("✅ Keys generated successfully!")
            self.logger.info(f"Output:\n{result.stdout}")
            
            # Parse output to extract keys
            self.parse_and_save_keys(result.stdout)
            
            # Show next steps
            self.show_next_steps()
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Key generation failed: {e}")
            return False
    
    def parse_and_save_keys(self, output: str) -> None:
        """Parse key generation output and save to files"""
        try:
            lines = output.strip().split('\n')
            
            private_key = None
            public_key = None
            password = None
            
            # Parse output
            for i, line in enumerate(lines):
                if 'Private key:' in line and i + 1 < len(lines):
                    private_key = lines[i + 1].strip()
                elif 'Public key:' in line and i + 1 < len(lines):
                    public_key = lines[i + 1].strip()
                elif 'Password:' in line and i + 1 < len(lines):
                    password = lines[i + 1].strip()
            
            # Save keys to production config
            keys_dir = self.paths['production'] / 'config' / 'keys'
            utils.ensure_directory(keys_dir)
            
            if private_key:
                with open(keys_dir / 'private_key.txt', 'w') as f:
                    f.write(private_key)
                self.logger.info(f"💾 Private key saved to: {keys_dir / 'private_key.txt'}")
            
            if public_key:
                with open(keys_dir / 'public_key.txt', 'w') as f:
                    f.write(public_key)
                self.logger.info(f"💾 Public key saved to: {keys_dir / 'public_key.txt'}")
                
                # Update tauri.conf.json
                self.update_tauri_config(public_key)
            
            if password:
                with open(keys_dir / 'key_password.txt', 'w') as f:
                    f.write(password)
                self.logger.info(f"💾 Key password saved to: {keys_dir / 'key_password.txt'}")
            
            # Create .gitignore for keys directory
            gitignore_content = """# Tauri signing keys - DO NOT COMMIT
private_key.txt
key_password.txt

# Only public key can be committed
!public_key.txt
!.gitignore
"""
            with open(keys_dir / '.gitignore', 'w') as f:
                f.write(gitignore_content)
                
        except Exception as e:
            self.logger.error(f"❌ Error parsing keys: {e}")
    
    def update_tauri_config(self, public_key: str) -> None:
        """Update tauri.conf.json with public key"""
        try:
            tauri_conf_path = self.paths['client'] / 'src-tauri' / 'tauri.conf.json'
            
            if not tauri_conf_path.exists():
                self.logger.warning("⚠️  tauri.conf.json not found")
                return
            
            # Read current config
            with open(tauri_conf_path, 'r') as f:
                config = json.load(f)
            
            # Update updater config
            if 'app' not in config:
                config['app'] = {}
            if 'updater' not in config['app']:
                config['app']['updater'] = {}
            
            config['app']['updater']['pubkey'] = public_key
            
            # Write updated config
            with open(tauri_conf_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            self.logger.info(f"✅ Updated tauri.conf.json with public key")
            
        except Exception as e:
            self.logger.error(f"❌ Error updating tauri.conf.json: {e}")
    
    def show_next_steps(self) -> None:
        """Show next steps for using the keys"""
        self.logger.info("\n📋 Next steps:")
        self.logger.info("1. 🔐 Add private key to GitHub Secrets:")
        self.logger.info("   - Go to your repository Settings > Secrets and variables > Actions")
        self.logger.info("   - Add new secret: TAURI_PRIVATE_KEY")
        self.logger.info("   - Copy content from: production/config/keys/private_key.txt")
        
        self.logger.info("\n2. 🔑 If you used a password, add it to GitHub Secrets:")
        self.logger.info("   - Add new secret: TAURI_KEY_PASSWORD")
        self.logger.info("   - Copy content from: production/config/keys/key_password.txt")
        
        self.logger.info("\n3. ✅ Public key has been automatically added to tauri.conf.json")
        
        self.logger.info("\n🔒 Security reminders:")
        self.logger.info("   - Never commit private keys to version control")
        self.logger.info("   - Keep your private key and password secure")
        self.logger.info("   - The keys directory has a .gitignore to protect sensitive files")
    
    def validate_keys(self) -> bool:
        """Validate existing keys"""
        self.logger.info("🔍 Validating existing keys...")
        
        try:
            keys_dir = self.paths['production'] / 'config' / 'keys'
            
            # Check if keys exist
            private_key_file = keys_dir / 'private_key.txt'
            public_key_file = keys_dir / 'public_key.txt'
            
            if not private_key_file.exists():
                self.logger.warning("⚠️  Private key not found")
                return False
            
            if not public_key_file.exists():
                self.logger.warning("⚠️  Public key not found")
                return False
            
            # Check tauri.conf.json
            tauri_conf_path = self.paths['client'] / 'src-tauri' / 'tauri.conf.json'
            if tauri_conf_path.exists():
                with open(tauri_conf_path, 'r') as f:
                    config = json.load(f)
                
                pubkey = config.get('app', {}).get('updater', {}).get('pubkey')
                if not pubkey:
                    self.logger.warning("⚠️  Public key not found in tauri.conf.json")
                    return False
                
                # Verify public key matches
                with open(public_key_file, 'r') as f:
                    stored_pubkey = f.read().strip()
                
                if pubkey != stored_pubkey:
                    self.logger.warning("⚠️  Public key mismatch between file and tauri.conf.json")
                    return False
            
            self.logger.info("✅ Keys validation passed")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Key validation failed: {e}")
            return False

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Tauri signing key generator")
    parser.add_argument('--with-password', action='store_true', 
                       help='Generate keys with password protection')
    parser.add_argument('--validate', action='store_true', 
                       help='Validate existing keys')
    parser.add_argument('--force', action='store_true', 
                       help='Force regenerate keys even if they exist')
    
    args = parser.parse_args()
    
    generator = KeyGenerator()
    
    if args.validate:
        success = generator.validate_keys()
    else:
        # Check if keys already exist
        keys_dir = generator.paths['production'] / 'config' / 'keys'
        private_key_file = keys_dir / 'private_key.txt'
        
        if private_key_file.exists() and not args.force:
            generator.logger.warning("⚠️  Keys already exist!")
            generator.logger.info("Use --force to regenerate or --validate to check existing keys")
            success = False
        else:
            success = generator.generate_keys(args.with_password)
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
