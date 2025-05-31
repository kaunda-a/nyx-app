# Tauri Signing Keys

This directory contains the Tauri signing keys for app updates and distribution.

## Security Notice

🔒 **IMPORTANT**: Never commit private keys to version control!

- `private_key.txt` - Private signing key (NEVER COMMIT)
- `key_password.txt` - Key password if used (NEVER COMMIT)
- `public_key.txt` - Public key (safe to commit)

## Key Generation

Generate keys using the deployment script:

```bash
# Generate keys without password
python production/deploy.py --generate-keys

# Generate keys with password protection
python production/deploy.py --generate-keys --with-password

# Validate existing keys
python production/deploy.py --validate-keys
```

## GitHub Deployment

For GitHub Actions deployment:

1. Generate keys locally
2. Add private key to GitHub Secrets as `TAURI_PRIVATE_KEY`
3. Add password to GitHub Secrets as `TAURI_KEY_PASSWORD` (if used)
4. Public key is automatically added to `tauri.conf.json`

## Key Rotation

For security, consider rotating keys periodically:

1. Generate new keys with `--force` flag
2. Update GitHub Secrets
3. Rebuild and redistribute applications

## Troubleshooting

- Ensure Tauri CLI is installed
- Check that client dependencies are installed
- Verify Node.js and pnpm are available
- Run validation to check key integrity
