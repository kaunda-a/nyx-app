@echo off
echo ========================================
echo Nyx App Quick Start (Windows)
echo ========================================
echo.

:: Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Trying alternative commands...

    :: Try py launcher
    py --version >nul 2>&1
    if errorlevel 1 (
        echo Error: Python not found. Please install Python 3.8+ for Windows.
        echo Download from: https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    ) else (
        echo Found Python via py launcher. Using 'py' command.
        set PYTHON_CMD=py
        goto :python_found
    )
) else (
    set PYTHON_CMD=python
)

:python_found

echo Choose an option:
echo 1. Setup for Development
echo 2. Build for Production
echo 3. Generate Signing Keys
echo 4. Setup GitHub Deployment
echo 5. Clean Everything
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto development
if "%choice%"=="2" goto production
if "%choice%"=="3" goto generate_keys
if "%choice%"=="4" goto github_setup
if "%choice%"=="5" goto clean
echo Invalid choice. Exiting.
pause
exit /b 1

:development
echo.
echo Setting up for development...
%PYTHON_CMD% deploy/setup.py --mode development --target all
if errorlevel 1 (
    echo Setup failed!
    pause
    exit /b 1
)
echo.
echo Setup completed! To start development:
echo 1. Edit server/.env with your configuration
echo 2. Start server: %PYTHON_CMD% deploy/scripts/server/setup.py --start
echo 3. Start client: %PYTHON_CMD% deploy/scripts/client/setup.py --start
pause
exit /b 0

:production
echo.
echo Building for production...
%PYTHON_CMD% deploy/setup.py --mode production --target all
if errorlevel 1 (
    echo Setup failed!
    pause
    exit /b 1
)
%PYTHON_CMD% deploy/build.py --target all --test --distribute
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)
echo.
echo Build completed! Check the 'dist' folder for distribution files.
pause
exit /b 0

:generate_keys
echo.
echo Generating Tauri signing keys...
%PYTHON_CMD% deploy/deploy.py --generate-keys
if errorlevel 1 (
    echo Key generation failed!
    pause
    exit /b 1
)
echo.
echo Keys generated successfully! Check deploy/config/keys/ directory.
pause
exit /b 0

:github_setup
echo.
echo Setting up GitHub deployment...
%PYTHON_CMD% deploy/deploy.py --target github
if errorlevel 1 (
    echo GitHub setup failed!
    pause
    exit /b 1
)
echo.
echo GitHub setup completed! Follow the instructions above.
pause
exit /b 0

:clean
echo.
echo Cleaning all build artifacts...
%PYTHON_CMD% deploy/build.py --clean
echo Clean completed!
pause
exit /b 0
