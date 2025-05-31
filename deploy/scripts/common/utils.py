"""
Common utilities for production scripts
"""

import os
import sys
import json
import subprocess
import platform
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
from datetime import datetime

class ProductionUtils:
    """Utility class for production operations"""

    def __init__(self, config_path: Optional[str] = None):
        self.platform = "windows"  # Windows-only deployment
        self.config = self._load_config(config_path)
        self.logger = self._setup_logging()

    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load build configuration"""
        if config_path is None:
            config_path = Path(__file__).parent.parent.parent / "config" / "build.config.json"

        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading config: {e}")
            return {}

    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration"""
        logger = logging.getLogger('production')
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    def run_command(self, command: Union[str, List[str]],
                   cwd: Optional[str] = None,
                   env: Optional[Dict[str, str]] = None,
                   capture_output: bool = False,
                   timeout: Optional[int] = None) -> subprocess.CompletedProcess:
        """Run a command with proper error handling"""

        if isinstance(command, list):
            cmd_str = ' '.join(command)
        else:
            cmd_str = command

        self.logger.info(f"Running: {cmd_str}")
        if cwd:
            self.logger.info(f"Working directory: {cwd}")

        try:
            # Prepare environment
            run_env = os.environ.copy()
            if env:
                run_env.update(env)

            # Run command
            result = subprocess.run(
                command,
                cwd=cwd,
                env=run_env,
                shell=True if isinstance(command, str) else False,
                capture_output=capture_output,
                text=True,
                timeout=timeout,
                check=True
            )

            self.logger.info(f"✅ Command completed successfully")
            return result

        except subprocess.CalledProcessError as e:
            self.logger.error(f"❌ Command failed with exit code {e.returncode}")
            if e.stdout:
                self.logger.error(f"stdout: {e.stdout}")
            if e.stderr:
                self.logger.error(f"stderr: {e.stderr}")
            raise
        except subprocess.TimeoutExpired as e:
            self.logger.error(f"❌ Command timed out after {timeout} seconds")
            raise
        except Exception as e:
            self.logger.error(f"❌ Unexpected error: {e}")
            raise

    def check_dependencies(self, dependencies: List[str]) -> Dict[str, bool]:
        """Check if required dependencies are available"""
        results = {}

        for dep in dependencies:
            try:
                result = subprocess.run(
                    [dep, '--version'],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                results[dep] = result.returncode == 0
                if results[dep]:
                    self.logger.info(f"✅ {dep} is available")
                else:
                    self.logger.warning(f"❌ {dep} is not available")
            except Exception:
                results[dep] = False
                self.logger.warning(f"❌ {dep} is not available")

        return results

    def ensure_directory(self, path: Union[str, Path]) -> Path:
        """Ensure directory exists, create if it doesn't"""
        path = Path(path)
        path.mkdir(parents=True, exist_ok=True)
        self.logger.info(f"📁 Directory ensured: {path}")
        return path

    def clean_directory(self, path: Union[str, Path],
                       patterns: Optional[List[str]] = None) -> None:
        """Clean directory contents"""
        path = Path(path)

        if not path.exists():
            return

        if patterns is None:
            # Remove everything
            shutil.rmtree(path)
            path.mkdir(parents=True, exist_ok=True)
            self.logger.info(f"🧹 Cleaned directory: {path}")
        else:
            # Remove specific patterns
            import glob
            for pattern in patterns:
                for item in glob.glob(str(path / pattern)):
                    item_path = Path(item)
                    if item_path.is_file():
                        item_path.unlink()
                    elif item_path.is_dir():
                        shutil.rmtree(item_path)
                    self.logger.info(f"🧹 Removed: {item_path}")

    def copy_file(self, src: Union[str, Path], dst: Union[str, Path]) -> None:
        """Copy file with logging"""
        src, dst = Path(src), Path(dst)

        # Ensure destination directory exists
        dst.parent.mkdir(parents=True, exist_ok=True)

        shutil.copy2(src, dst)
        self.logger.info(f"📋 Copied: {src} → {dst}")

    def get_platform_executable_name(self, name: str) -> str:
        """Get Windows executable name"""
        return f"{name}.exe"

    def get_venv_activation_command(self, venv_path: Union[str, Path]) -> str:
        """Get Windows virtual environment activation command"""
        venv_path = Path(venv_path)
        return str(venv_path / "Scripts" / "activate.bat")

    def create_virtual_environment(self, path: Union[str, Path],
                                 python_cmd: str = "python") -> Path:
        """Create Python virtual environment"""
        path = Path(path)

        if path.exists():
            self.logger.info(f"Virtual environment already exists: {path}")
            return path

        self.logger.info(f"Creating virtual environment: {path}")
        self.run_command([python_cmd, "-m", "venv", str(path)])

        return path

    def install_python_requirements(self, venv_path: Union[str, Path],
                                  requirements_file: Union[str, Path]) -> None:
        """Install Python requirements in virtual environment"""
        venv_path = Path(venv_path)
        requirements_file = Path(requirements_file)

        if not requirements_file.exists():
            raise FileNotFoundError(f"Requirements file not found: {requirements_file}")

        # Get Windows pip executable path
        pip_cmd = str(venv_path / "Scripts" / "pip.exe")

        # Upgrade pip first
        self.run_command([pip_cmd, "install", "--upgrade", "pip"])

        # Install requirements
        self.run_command([pip_cmd, "install", "-r", str(requirements_file)])

    def validate_environment(self) -> bool:
        """Validate the environment for production builds"""
        self.logger.info("🔍 Validating environment...")

        # Check Python version
        python_version = sys.version_info
        required_version = (3, 8)

        if python_version < required_version:
            self.logger.error(f"Python {required_version[0]}.{required_version[1]}+ required, got {python_version[0]}.{python_version[1]}")
            return False

        # Check required Windows tools
        required_tools = ['python', 'node', 'pnpm']

        dependencies = self.check_dependencies(required_tools)
        missing = [tool for tool, available in dependencies.items() if not available]

        if missing:
            self.logger.error(f"Missing required tools: {', '.join(missing)}")
            return False

        self.logger.info("✅ Environment validation passed")
        return True

    def get_project_paths(self) -> Dict[str, Path]:
        """Get standardized project paths"""
        base_path = Path(__file__).parent.parent.parent.parent

        return {
            'root': base_path,
            'server': base_path / 'server',
            'client': base_path / 'client',
            'deploy': base_path / 'deploy',
            'dist': base_path / 'dist'
        }

    def create_env_file(self, template_path: Union[str, Path],
                       output_path: Union[str, Path],
                       values: Optional[Dict[str, str]] = None) -> None:
        """Create environment file from template"""
        template_path = Path(template_path)
        output_path = Path(output_path)

        if not template_path.exists():
            raise FileNotFoundError(f"Template not found: {template_path}")

        # Read template
        with open(template_path, 'r') as f:
            content = f.read()

        # Replace values if provided
        if values:
            for key, value in values.items():
                content = content.replace(f"your_{key.lower()}_here", value)

        # Write output
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w') as f:
            f.write(content)

        self.logger.info(f"📝 Created environment file: {output_path}")

# Global utility instance
utils = ProductionUtils()
