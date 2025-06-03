@echo off
setlocal enabledelayedexpansion

:: Nyx App - Simple Start
echo ========================================
echo Nyx App - Simple Start
echo ========================================

:: Check for Python
echo Checking for Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Trying alternate...
    py --version >nul 2>&1
    if errorlevel 1 (
        echo Error: Python not found. Please install Python.
        pause
        exit /b 1
    ) else (
        echo Found Python via py launcher. Using 'py'
        set PYTHON_CMD=py
    )
) else (
    echo Found Python. Using 'python'
    set PYTHON_CMD=python
)

echo.
echo Choose an option:
echo 1. Setup for Development
echo 2. Deploy (Cloud Build + Release)
echo 3. Clean Everything
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" goto setup_dev
if "%choice%"=="2" goto cloud_automation
if "%choice%"=="3" goto clean_all

echo Invalid choice. Please try again.
pause
exit /b 1

:setup_dev
echo.
echo Setting up development environment...
echo ========================================

:: Setup server
echo Setting up server...
%PYTHON_CMD% deploy/scripts/server/setup.py --mode development
if errorlevel 1 (
    echo Server setup failed!
    goto error_exit
)

:: Setup client
echo Setting up client...
%PYTHON_CMD% deploy/scripts/client/setup.py --mode development
if errorlevel 1 (
    echo Client setup failed!
    goto error_exit
)

echo.
echo ========================================
echo [SUCCESS] Development setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Start server: cd server ^&^& %PYTHON_CMD% main.py
echo 2. Start client: cd client ^&^& pnpm dev
echo.
goto success_exit

:clean_all
echo.
echo Cleaning everything...
echo ========================================

%PYTHON_CMD% deploy/build.py --clean
if errorlevel 1 (
    echo Clean failed!
    goto error_exit
)

echo.
echo ========================================
echo [SUCCESS] Cleanup completed!
echo ========================================
goto success_exit

:cloud_automation
echo.
echo Deploy - Cloud Build and Release
echo ========================================
echo.
echo This will:
echo 1. Push your code to GitHub
echo 2. Automatically build and package everything in the cloud
echo 3. Create a ready-to-install Nyx.exe file
echo.
set /p confirm="Continue with deployment? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    goto success_exit
)

echo.
echo Committing and pushing to GitHub...
echo ========================================
git add .
git commit -m "Deploy: Trigger automated build and release"
if errorlevel 1 (
    echo Git commit failed! (This might be normal if no changes)
)

git push origin main
if errorlevel 1 (
    echo Git push failed!
    goto error_exit
)

echo.
echo ========================================
echo [SUCCESS] Deployment started!
echo ========================================
echo.
echo GitHub is now building your app automatically.
echo.
echo What to do next:
echo 1. Visit: https://github.com/kaunda-a/nyx-app/actions
echo 2. Wait for build to complete (~10-15 minutes)
echo 3. Download Nyx.exe from the artifacts
echo.
goto success_exit

:error_exit
echo.
echo ========================================
echo [ERROR] Operation failed!
echo ========================================
pause
exit /b 1

:success_exit
echo.
pause
exit /b 0
