# Quick Cloud Deployment Guide

Since Docker isn't installed locally, here are your cloud deployment options:

## Option 1: Deploy to Azure Container Instances (Recommended)

### Prerequisites
- Azure CLI installed or use Azure Cloud Shell
- Your `.env.production` file ready

### Steps:

1. **Login to Azure Cloud Shell**
   ```
   https://shell.azure.com
   ```

2. **Clone your repository**
   ```bash
   git clone [your-repo-url]
   cd ap-invoice-automation
   ```

3. **Upload your .env.production file**
   - Click the upload button in Cloud Shell
   - Upload your `.env.production` file

4. **Build and deploy**
   ```bash
   # Create resource group
   az group create --name paris-ap-staging --location westus2

   # Build images
   docker compose -f docker-compose.staging.yml build

   # Push to Azure Container Registry
   az acr create --name parisapregistry --resource-group paris-ap-staging --sku Basic
   az acr login --name parisapregistry
   
   docker tag ap-invoice-automation-api parisapregistry.azurecr.io/ap-api:latest
   docker tag ap-invoice-automation-admin parisapregistry.azurecr.io/ap-admin:latest
   docker tag ap-invoice-automation-workers parisapregistry.azurecr.io/ap-workers:latest
   
   docker push parisapregistry.azurecr.io/ap-api:latest
   docker push parisapregistry.azurecr.io/ap-admin:latest
   docker push parisapregistry.azurecr.io/ap-workers:latest

   # Deploy containers
   az container create \
     --resource-group paris-ap-staging \
     --name paris-ap-staging \
     --image parisapregistry.azurecr.io/ap-api:latest \
     --dns-name-label paris-ap-staging \
     --ports 80 443 \
     --environment-variables-file .env.production
   ```

## Option 2: Deploy to DigitalOcean (Simplest)

### Steps:

1. **Create a Droplet**
   - Go to https://www.digitalocean.com
   - Create Ubuntu 22.04 droplet ($20/month minimum)
   - Choose West Coast region

2. **SSH into droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Clone and deploy**
   ```bash
   git clone [your-repo-url]
   cd ap-invoice-automation
   
   # Create .env.production (copy contents from your local file)
   nano .env.production
   
   # Deploy
   docker compose -f docker-compose.staging.yml --env-file .env.production up -d
   ```

## Option 3: Deploy to Vercel/Railway (Serverless)

### For Admin UI Only (Vercel):

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Set root directory to `apps/admin`
   - Add environment variables from `.env.production`

### For Full Stack (Railway):

1. **Go to Railway**
   - https://railway.app
   - New Project → Deploy from GitHub
   - Select your repository

2. **Add services**
   - Add PostgreSQL
   - Add Redis
   - Deploy your apps

## Option 4: Local Testing with Docker Desktop

If you want to test locally first:

1. **Install Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and restart computer
   - Start Docker Desktop

2. **Run deployment script**
   ```powershell
   powershell -ExecutionPolicy Bypass -File deploy-staging.ps1
   ```

## Testing Your Deployment

Once deployed, test the system:

1. **Send test email**
   - Email a PDF invoice to: ap@parisservicegroup.com
   - Subject: "Test Invoice from Vendor"

2. **Check processing**
   - Visit admin UI: `http://your-deployment-url:3000`
   - Check API health: `http://your-deployment-url:4000/health`

3. **Monitor logs**
   ```bash
   # Azure
   az container logs --resource-group paris-ap-staging --name paris-ap-staging

   # DigitalOcean
   docker compose logs -f

   # Vercel
   Check dashboard logs
   ```

## Quick Checklist

Before deploying, ensure you have:

- [x] Azure Document Intelligence key
- [x] Microsoft Graph API credentials  
- [x] SharePoint Site/Drive IDs
- [x] OpenAI API key
- [x] Database passwords set
- [ ] Teams Webhook URL (optional)
- [ ] ServiceTitan credentials (optional, can add later)

## Support

Need help? 
- Email: grahamm@parisservicegroup.com
- Check logs for errors
- Verify all environment variables are set correctly