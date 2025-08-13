@echo off
echo ========================================
echo GitHub Repository Setup for What-If Calculator
echo ========================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if %errorlevel% neq 0 (
    echo Initializing git repository...
    git init
    echo.
)

REM Check current remote
echo Current remote configuration:
git remote -v
echo.

set /p REPO_URL="Enter your new GitHub repository URL (e.g., https://github.com/username/what-if-calculator.git): "

if "%REPO_URL%"=="" (
    echo ERROR: Repository URL is required
    pause
    exit /b 1
)

REM Check if origin exists and update or add it
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Updating existing remote origin...
    git remote set-url origin %REPO_URL%
) else (
    echo Adding remote origin...
    git remote add origin %REPO_URL%
)

echo.
echo Staging all changes...
git add .

echo.
echo Current status:
git status --short

echo.
set /p COMMIT_MSG="Enter initial commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Initial commit: What-If Calculator project setup

echo.
echo Creating initial commit...
git commit -m "%COMMIT_MSG%" >nul 2>&1
if %errorlevel% neq 0 (
    echo No changes to commit or commit already exists
)

echo.
echo Ensuring main branch is used...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo Push failed. This might be because:
    echo 1. The repository doesn't exist on GitHub yet
    echo 2. You need to authenticate with GitHub
    echo 3. The repository already has content
    echo.
    echo Please create the repository on GitHub first if it doesn't exist.
    echo.
    set /p FORCE_PUSH="Do you want to force push? (y/N): "
    if /i "%FORCE_PUSH%"=="y" (
        echo Force pushing...
        git push -u origin main --force
    )
)

echo.
echo ========================================
echo Repository Setup Complete!
echo ========================================
echo.
echo Repository URL: %REPO_URL%
echo.
echo Next steps:
echo 1. Visit your repository on GitHub
echo 2. Add a README.md if needed
echo 3. Configure GitHub Actions for CI/CD
echo 4. Set up branch protection rules
echo 5. Add collaborators if working in a team
echo.
echo Useful commands:
echo   git status           - Check current status
echo   git pull            - Get latest changes
echo   git push            - Push your commits
echo   git log --oneline   - View commit history
echo.

pause