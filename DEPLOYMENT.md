# AP Invoice Automation - Deployment Guide

## Prerequisites

### Azure Services Required

1. **Azure Document Intelligence** - For OCR processing
   - Create a Document Intelligence resource in Azure Portal
   - Note the endpoint and key
   - Use `prebuilt-invoice` model

2. **Microsoft Graph API** - For email and SharePoint access
   - Register application in Azure AD
   - Grant permissions: `Mail.Read`, `Sites.ReadWrite.All`, `Files.ReadWrite.All`
   - Create client secret

3. **Azure AD B2C** (for admin auth)
   - Create separate app registration for admin interface
   - Configure redirect URIs for NextAuth

### External Services Required

4. **ServiceTitan API** - For PO and vendor data
   - Complete ServiceTitan API application process
   - Obtain client credentials
   - Note: This is currently the main blocker

5. **OpenAI API** - For document enhancement
   - Create API key with GPT-4 access
   - Consider usage limits for production

## Staging Deployment

### 1. Server Setup

Choose your hosting platform:
- **Azure Container Instances** (recommended for Azure integration)
- **AWS ECS/Fargate** 
- **Google Cloud Run**
- **DigitalOcean Droplets**
- **VPS with Docker**

### 2. Domain and DNS

1. Register domain or subdomain for staging: `paris-ap-staging.yourdomain.com`
2. Point DNS A record to server IP
3. For production, set up `paris-ap.parisservicegroup.com`

### 3. Environment Configuration

1. Copy `.env.staging` to `.env.production` on server
2. Fill in real values:

```bash
# Critical values to update:
DB_PASSWORD=generate_secure_password
REDIS_PASSWORD=generate_secure_password
GRAPH_TENANT_ID=your_azure_tenant_id
GRAPH_CLIENT_ID=your_app_registration_client_id
GRAPH_CLIENT_SECRET=your_app_registration_secret
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_SECRET=generate_random_string_32_chars
```

### 4. Deploy to Staging

```bash
# On your server
git clone [repository]
cd ap-invoice-automation

# Copy and configure environment
cp .env.staging .env.production
nano .env.production  # Fill in real values

# Build and start services
docker compose -f docker-compose.staging.yml --env-file .env.production up -d

# Check status
docker compose -f docker-compose.staging.yml ps
docker compose -f docker-compose.staging.yml logs -f
```

### 5. Initial Database Setup

```bash
# Run database migrations
docker compose -f docker-compose.staging.yml exec api npm run prisma:migrate:deploy

# (Optional) Seed with test data
docker compose -f docker-compose.staging.yml exec api npm run seed
```

## Production Deployment

### 1. SSL Certificate Setup

Option A - Let's Encrypt (recommended):
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d paris-ap.parisservicegroup.com

# Update nginx.conf to use HTTPS server block
```

Option B - Azure Application Gateway with managed certificates

Option C - CloudFlare proxy with automatic SSL

### 2. Production Environment Variables

Key differences from staging:
- **Stronger passwords** (use password managers)
- **Production SharePoint paths** (remove /STAGING)
- **Production Teams webhook** (main channel)
- **All notification emails**
- **Production domain** in NEXTAUTH_URL
- **Reduced logging verbosity**

### 3. Production Deployment

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Enable automatic restart
sudo systemctl enable docker
```

### 4. Monitoring Setup

```bash
# Check application health
curl http://localhost/health

# Monitor logs
docker compose logs -f api
docker compose logs -f workers

# Set up log rotation
sudo logrotate -f /etc/logrotate.conf
```

## Post-Deployment Tasks

### 1. ServiceTitan Integration Test

Once ServiceTitan API access is approved:
1. Update `ST_*` environment variables
2. Test connection: `docker compose exec api npm run test:servicetitan`
3. Verify PO and vendor data sync

### 2. SharePoint Folder Structure

Create the following folder structure in SharePoint:
```
Paris Mechanical(1)/
└── Paris Service Group - Documents/
    ├── Supplier Invoices/          # Processed PDFs
    │   ├── STAGING/                # For staging environment
    │   ├── 2024/
    │   └── 2025/
    └── Finance/
        └── AP/
            └── _raw/              # Raw email attachments
                ├── STAGING/       # For staging environment
                ├── 2024/
                └── 2025/
```

### 3. Email Integration Test

1. Send test email with PDF attachment to configured mailbox
2. Verify processing pipeline:
   - Email detected and processed
   - PDF extracted to SharePoint
   - OCR and OpenAI enhancement
   - Data stored in database
   - Notifications sent

### 4. User Access Setup

1. Add Paris Mechanical users to Azure AD
2. Test admin interface login
3. Verify permission levels
4. Train users on interface

## Rollback Plan

In case of issues:

```bash
# Rollback to previous version
docker compose -f docker-compose.prod.yml down
git checkout previous-stable-tag
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

# Database rollback (if needed)
docker compose exec api npm run prisma:migrate:reset
```

## Health Checks

Monitor these endpoints:
- `GET /health` - Application health
- `GET /api/health` - Database connectivity
- `GET /api/queues/status` - Queue system status

## Backup Strategy

1. **Database**: Daily automated backups
2. **Environment files**: Secure backup of `.env.production`
3. **SharePoint**: Built-in SharePoint backup
4. **Application logs**: Regular log archival

## Performance Optimization

For production load:
1. Scale workers: `deploy.replicas: 3` in docker-compose
2. Database connection pooling
3. Redis memory optimization
4. CDN for static assets

## Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Regular security updates
- [ ] Access logs monitored
- [ ] Firewall configured (only ports 80, 443, 22)

## Troubleshooting

### Common Issues

1. **ServiceTitan API 401**: Check credentials and tenant ID
2. **SharePoint access denied**: Verify Graph API permissions
3. **Email not processing**: Check mailbox permissions
4. **OCR failures**: Verify Document Intelligence quota
5. **OpenAI rate limits**: Check API usage and limits

### Debug Commands

```bash
# Check service status
docker compose ps

# View logs
docker compose logs api
docker compose logs workers

# Connect to database
docker compose exec postgres psql -U postgres -d paris_ap

# Check Redis
docker compose exec redis redis-cli
```

## Next Steps After Deployment

1. **Monitor for 1 week** - Watch for any processing errors
2. **Collect user feedback** - Iterate on UI/UX
3. **Performance tuning** - Based on actual load patterns
4. **Advanced features** - Mobile app, advanced reporting
5. **Additional integrations** - Other accounting systems

---

**Support Contact**: grahamm@parisservicegroup.com

**Repository**: [Add your repo URL here]

**Last Updated**: 2025-08-14