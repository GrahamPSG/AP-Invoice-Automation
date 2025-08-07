@echo off
echo Starting What-If Calculator Development Environment...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Start PostgreSQL with Docker (if available)
echo Checking for Docker...
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting PostgreSQL database...
    docker run -d --name whatif-db -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=whatif postgres:16 2>nul
    echo Database should be running on port 5432
    echo.
) else (
    echo WARNING: Docker not found. You'll need to install and start PostgreSQL manually.
    echo Download from: https://www.postgresql.org/download/
    echo.
    echo Database configuration needed:
    echo - User: postgres
    echo - Password: postgres  
    echo - Database: whatif
    echo - Port: 5432
    echo.
)

echo.
echo ===========================================
echo  MANUAL SETUP INSTRUCTIONS
echo ===========================================
echo.
echo 1. Open TWO separate command prompt windows
echo.
echo 2. In the FIRST window, run:
echo    cd /d "%~dp0apps\api"
echo    npm install
echo    npm run start:dev
echo.
echo 3. In the SECOND window, run:  
echo    cd /d "%~dp0apps\web"
echo    npm install
echo    npm run dev
echo.
echo 4. Open your browser to: http://localhost:5173
echo.
echo ===========================================
echo.

pause