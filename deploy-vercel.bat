@echo off
echo 🚀 Deploying What-If Calculator to Vercel...
echo.

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Vercel CLI
        echo Please install manually: npm install -g vercel
        pause
        exit /b 1
    )
)

echo Vercel CLI version:
vercel --version
echo.

echo 📝 DEPLOYMENT OPTIONS:
echo.
echo 1. Frontend Only (Static Site) - Recommended for demo
echo    - Fast deployment
echo    - Shows UI/UX perfectly
echo    - No backend functionality
echo.
echo 2. Full Stack (Frontend + API)
echo    - Complete application
echo    - Requires database setup
echo    - More complex configuration
echo.

set /p DEPLOY_TYPE="Choose deployment type (1 or 2): "

if "%DEPLOY_TYPE%"=="1" (
    echo.
    echo 🎯 Deploying FRONTEND ONLY...
    echo.
    cd apps\web
    
    echo Building application...
    npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
    
    echo Deploying to Vercel...
    vercel --prod
    
    echo.
    echo ✅ Frontend deployed successfully!
    echo Your What-If Calculator UI is now live!
    
) else if "%DEPLOY_TYPE%"=="2" (
    echo.
    echo 🔧 Deploying FULL STACK...
    echo.
    echo NOTE: You'll need to set up environment variables:
    echo - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
    echo - JWT_SECRET
    echo - REDIS_HOST (optional)
    echo.
    
    vercel --prod
    
    echo.
    echo ✅ Full stack deployed!
    echo Don't forget to configure environment variables in Vercel dashboard.
    
) else (
    echo Invalid selection. Please run the script again.
    pause
    exit /b 1
)

echo.
echo 🌐 Your app is now live on Vercel!
echo.
echo Next steps:
echo 1. Visit your Vercel dashboard to see the deployment
echo 2. Share the live URL with others
echo 3. Set up custom domain (optional)
echo 4. Configure environment variables for backend (if deployed)
echo.

pause