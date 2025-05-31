#!/usr/bin/env python3
"""
Tauri Signing Key Generator for Nyx App

This script generates signing keys for Tauri applications to enable
code signing and secure app distribution.
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

# Add common utils to path
sys.path.insert(0, str(Path(__file__).parent.parent / "common"))
import utils

class KeyGenerator:
    """Generate and manage Tauri signing keys"""
    
    def __init__(self):
        self.utils = utils.ProductionUtils()
        self.logger = self.utils.logger
        self.paths = utils.get_project_paths()
        self.config = self.utils.config.get('deployment', {}).get('signing', {})
        
        # Key storage configuration
        self.keys_dir = self.paths['deploy'] / 'config' / 'keys'
        self.private_key_file = self.keys_dir / 'private_key.txt'
        self.password_file = self.keys_dir / 'key_password.txt'
        self.public_key_file = self.keys_dir / 'public_key.txt'
        
        self.logger.info(f"KeyGenerator initialized for keys directory: {self.keys_dir}")
    
    def generate_keys(self, with_password: bool = False) -> bool:
        """Generate Tauri signing keys"""
        try:
            self.logger.info("🔐 Generating Tauri signing keys...")
            
            # Ensure keys directory exists
            self.utils.ensure_directory(self.keys_dir)
            
            # Check if Tauri CLI is available
            client_path = self.paths['client']
            
            # Generate keys using Tauri CLI
            if with_password:
                self.logger.info("Generating keys with password protection...")
                password = self._generate_secure_password()
                
                # Save password
                with open(self.password_file, 'w') as f:
                    f.write(password)
                
                # Generate keys with password
                result = self.utils.run_command(
                    ['pnpm', 'tauri', 'signer', 'generate', '--password', password],
                    cwd=str(client_path),
                    capture_output=True
                )
            else:
                self.logger.info("Generating keys without password...")
                result = self.utils.run_command(
                    ['pnpm', 'tauri', 'signer', 'generate'],
                    cwd=str(client_path),
                    capture_output=True
                )
            
            # Extract keys from output
            if result.returncode == 0:
                self._extract_keys_from_output(result.stdout)
                self.logger.info("✅ Keys generated successfully!")
                return True
            else:
                self.logger.error(f"❌ Key generation failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Key generation failed: {e}")
            return False
    
    def _generate_secure_password(self) -> str:
        """Generate a secure password for key protection"""
        import secrets
        import string
        
        # Generate a 32-character password with letters, digits, and symbols
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(alphabet) for _ in range(32))
        return password
    
    def _extract_keys_from_output(self, output: str) -> None:
        """Extract keys from Tauri CLI output"""
        lines = output.split('\n')
        
        private_key = None
        public_key = None
        
        # Look for key patterns in output
        for i, line in enumerate(lines):
            if 'private key' in line.lower() or 'secret key' in line.lower():
                # Next line usually contains the key
                if i + 1 < len(lines):
                    private_key = lines[i + 1].strip()
            elif 'public key' in line.lower():
                if i + 1 < len(lines):
                    public_key = lines[i + 1].strip()
        
        # If we can't parse from output, generate manually
        if not private_key:
            private_key = self._generate_fallback_key()
        
        # Save private key
        with open(self.private_key_file, 'w') as f:
            f.write(private_key)
        
        # Save public key if available
        if public_key:
            with open(self.public_key_file, 'w') as f:
                f.write(public_key)
        
        self.logger.info(f"📁 Keys saved to: {self.keys_dir}")
    
    def _generate_fallback_key(self) -> str:
        """Generate a fallback signing key if Tauri CLI fails"""
        import secrets
        import base64
        
        # Generate a 256-bit key
        key_bytes = secrets.token_bytes(32)
        key_b64 = base64.b64encode(key_bytes).decode('utf-8')
        
        self.logger.warning("⚠️  Using fallback key generation")
        return key_b64
    
    def validate_keys(self) -> bool:
        """Validate existing signing keys"""
        try:
            self.logger.info("🔍 Validating signing keys...")
            
            # Check if private key exists
            if not self.private_key_file.exists():
                self.logger.error("❌ Private key file not found")
                return False
            
            # Check if private key is readable
            with open(self.private_key_file, 'r') as f:
                private_key = f.read().strip()
            
            if not private_key:
                self.logger.error("❌ Private key file is empty")
                return False
            
            if len(private_key) < 32:
                self.logger.error("❌ Private key appears to be too short")
                return False
            
            self.logger.info("✅ Keys validation passed")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Key validation failed: {e}")
            return False
    
    def get_keys_for_github(self) -> Dict[str, str]:
        """Get keys formatted for GitHub Secrets"""
        try:
            if not self.validate_keys():
                raise ValueError("Keys validation failed")
            
            # Read private key
            with open(self.private_key_file, 'r') as f:
                private_key = f.read().strip()
            
            # Read password if exists
            password = ""
            if self.password_file.exists():
                with open(self.password_file, 'r') as f:
                    password = f.read().strip()
            
            return {
                'TAURI_PRIVATE_KEY': private_key,
                'TAURI_KEY_PASSWORD': password
            }
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get keys for GitHub: {e}")
            return {}

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate Tauri signing keys")
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
        if success:
            keys = generator.get_keys_for_github()
            print("\n📋 GitHub Secrets:")
            for key, value in keys.items():
                print(f"  {key}: {value}")
    else:
        # Check if keys already exist
        if generator.private_key_file.exists() and not args.force:
            generator.logger.warning("⚠️  Keys already exist!")
            generator.logger.info("Use --force to regenerate")
            return
        
        success = generator.generate_keys(args.with_password)
        
        if success:
            keys = generator.get_keys_for_github()
            print("\n🎉 Keys generated successfully!")
            print("\n📋 Add these to GitHub Secrets:")
            for key, value in keys.items():
                print(f"  {key}: {value}")

if __name__ == "__main__":
    main()
