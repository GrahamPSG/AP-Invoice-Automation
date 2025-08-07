# 🚀 Quick Start - What-If Calculator

## Option 1: Automated Start (Windows)
Double-click `start-dev.bat` and follow the instructions.

## Option 2: Manual Start

### Step 1: Install Dependencies
```bash
# In first terminal - Install API dependencies  
cd apps/api
npm install

# In second terminal - Install Web dependencies
cd apps/web  
npm install
```

### Step 2: Start Database
You have 3 options:

**Option A - Docker (Recommended):**
```bash
docker run -d --name whatif-db -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=whatif \
  postgres:16
```

**Option B - Use existing PostgreSQL:**
- Create database named `whatif`
- User: `postgres`, Password: `postgres`
- Port: `5432`

**Option C - Skip database (API will show errors but web will load):**
- The frontend will work without backend
- Some features will be disabled

### Step 3: Start Services

**Terminal 1 - API Server:**
```bash
cd apps/api
npm run start:dev
```
API will be at: http://localhost:3000

**Terminal 2 - Web App:**
```bash  
cd apps/web
npm run dev
```
Web app will be at: http://localhost:5173

### Step 4: Access the App
Open your browser to: **http://localhost:5173**

---

## Features Available:
- 📊 Project management & Excel upload
- 🔄 What-if scenario modeling  
- 📈 Interactive charts and forecasting
- 📑 PDF/Excel report generation
- 🔐 Authentication system
- ⚡ Performance monitoring

## Troubleshooting:
- **Port already in use**: Change ports in `vite.config.ts` or `main.ts`
- **Database connection failed**: Check PostgreSQL is running on port 5432
- **Module not found**: Run `npm install` in both api/ and web/ directories
- **Permission errors**: Run terminals as administrator (Windows)

## Development URLs:
- **Web App**: http://localhost:5173  
- **API Docs**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health