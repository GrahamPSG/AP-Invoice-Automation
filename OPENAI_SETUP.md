# OpenAI API Key Setup for What-If Calculator

## 🔑 Getting Your OpenAI API Key

1. **Visit OpenAI Platform**
   - Go to: https://platform.openai.com/api-keys
   - Sign in to your OpenAI account (or create one)

2. **Create a New API Key**
   - Click **"Create new secret key"**
   - Give it a name like "What-If Calculator"
   - Copy the key (starts with `sk-proj-...`)
   - **⚠️ Important**: Save this key immediately - you won't see it again!

## ⚙️ Configuring in Vercel (Method 1 - Dashboard)

1. **Access Your Project**
   - Go to: https://vercel.com/dashboard
   - Select your `what-if-calculator` project

2. **Add Environment Variable**
   - Click **Settings** → **Environment Variables**
   - Click **Add New**
   - Enter:
     ```
     Name: OPENAI_API_KEY
     Value: sk-proj-your-actual-key-here
     Environments: ✓ Production ✓ Preview ✓ Development
     ```
   - Click **Save**

3. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger auto-deployment

## 💻 Alternative: Via Vercel CLI (Method 2)

```bash
# Navigate to your web app directory
cd apps/web

# Set environment variable for production
npx vercel env add OPENAI_API_KEY production

# Set for preview environments
npx vercel env add OPENAI_API_KEY preview

# Set for development
npx vercel env add OPENAI_API_KEY development

# Redeploy
npx vercel --prod
```

## 🧪 Testing the Configuration

### Option 1: Test Endpoint
Visit: https://what-if-calculator.vercel.app/test-pdf-parsing.html

1. Click **"Test API Endpoint"** 
2. Should return success if configured correctly

### Option 2: Upload a PDF
1. Go to **Scenarios** page
2. Click **"Create Scenario"**
3. Upload a PDF file
4. Check console logs for OpenAI processing

### Option 3: API Direct Test
```bash
curl https://what-if-calculator.vercel.app/api/parse-proposal/test
```

## 📋 Environment Variable Reference

| Variable | Value | Purpose |
|----------|-------|---------|
| `OPENAI_API_KEY` | `sk-proj-...` | OpenAI API access for PDF parsing |

## 🔧 Troubleshooting

### Issue: "OpenAI service not properly initialized"
- ✅ **Check**: API key is set in Vercel environment variables
- ✅ **Check**: Key starts with `sk-proj-` (newer format) or `sk-` (older format)
- ✅ **Check**: Deployment completed after adding the key

### Issue: "Failed to parse PDF"
- ✅ **Check**: PDF file is valid and not corrupted
- ✅ **Check**: File size is under Vercel's limits
- ✅ **Check**: OpenAI API key has credits/usage available

### Issue: Test endpoint returns fallback data
- ✅ **Check**: Environment variable name is exactly `OPENAI_API_KEY`
- ✅ **Check**: Variable is set for Production environment
- ✅ **Check**: Latest deployment includes the environment variable

## 💡 Expected Behavior

### Without API Key:
- Falls back to simulated test data
- Console shows: "OpenAI not configured, using test endpoint"

### With API Key:
- Actual OpenAI Assistant processes the PDF
- Extracts real building data from uploaded plans
- Higher confidence scores (95% vs 50%)

## 🚀 Next Steps

1. Add your OpenAI API key to Vercel
2. Test with a real construction PDF
3. Monitor usage in OpenAI dashboard
4. Adjust assistant instructions if needed

## 🔗 Useful Links

- [OpenAI Platform](https://platform.openai.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants/overview)