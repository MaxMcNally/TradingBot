# CircleCI + Railway Deployment Setup

This guide explains how to set up automated deployment from CircleCI to Railway.

## 🔧 CircleCI Configuration

The CircleCI configuration has been updated to include Railway deployment jobs:

- **`deploy-railway-staging`**: Deploys feature branches to Railway staging
- **`deploy-railway-production`**: Deploys main branch to Railway production

## 🚀 Setup Steps

### 1. Railway Setup

First, set up your Railway projects:

```bash
# Create staging project
railway project new --name tradingbot-staging

# Create production project  
railway project new --name tradingbot-production
```

### 2. Get Railway Token

```bash
# Generate Railway token
railway auth:token
```

Copy the token - you'll need it for CircleCI.

### 3. CircleCI Context Setup

In your CircleCI dashboard:

1. Go to **Organization Settings** → **Contexts**
2. Create two contexts:
   - `railway-staging`
   - `railway-production`

### 4. Add Environment Variables to CircleCI

For each context, add these environment variables:

#### Railway Staging Context (`railway-staging`):
```
RAILWAY_TOKEN=your-railway-token
JWT_SECRET=your-staging-jwt-secret
SESSION_SECRET=your-staging-session-secret
```

#### Railway Production Context (`railway-production`):
```
RAILWAY_TOKEN=your-railway-token
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

### 5. Link Railway Projects

```bash
# Link staging project
railway link --project tradingbot-staging

# Link production project
railway link --project tradingbot-production
```

## 🔄 Deployment Flow

### Automatic Deployments:

1. **Feature Branches** (`feature/*`):
   - Run tests
   - Build Docker images
   - Deploy to Railway staging
   - Set staging environment variables

2. **Main Branch** (`main`):
   - Run tests
   - Build Docker images
   - Deploy to Railway production
   - Set production environment variables

### Manual Deployments:

You can also trigger deployments manually:

```bash
# Deploy current branch to staging
railway up --service staging

# Deploy current branch to production
railway up --service production
```

## 📊 Monitoring Deployments

### CircleCI Dashboard:
- View build status
- Check test results
- Monitor deployment logs

### Railway Dashboard:
- View service status
- Check application logs
- Monitor resource usage

### Commands:
```bash
# Check Railway deployment status
railway status

# View Railway logs
railway logs

# Check CircleCI build status
# (Available in CircleCI dashboard)
```

## 🔧 Environment Variables

### Staging Environment:
- `NODE_ENV=staging`
- `TRADING_MODE=paper`
- `LOG_LEVEL=debug`

### Production Environment:
- `NODE_ENV=production`
- `TRADING_MODE=paper`
- `LOG_LEVEL=info`
- `JWT_SECRET` (from CircleCI context)
- `SESSION_SECRET` (from CircleCI context)

## 🛠️ Troubleshooting

### Common Issues:

1. **Railway Token Invalid**:
   - Regenerate token: `railway auth:token`
   - Update CircleCI context variables

2. **Deployment Fails**:
   - Check Railway logs: `railway logs`
   - Verify environment variables
   - Check CircleCI build logs

3. **Tests Fail**:
   - Check test output in CircleCI
   - Verify dependencies are up to date
   - Check for linting errors

### Debug Commands:

```bash
# Check Railway project status
railway status

# View detailed logs
railway logs --json

# Check environment variables
railway variables

# Test deployment locally
railway up --detach
```

## 🔐 Security Best Practices

1. **Environment Variables**:
   - Never commit secrets to git
   - Use CircleCI contexts for sensitive data
   - Rotate secrets regularly

2. **Railway Token**:
   - Keep token secure
   - Regenerate if compromised
   - Use different tokens for staging/production

3. **Branch Protection**:
   - Require PR reviews for main branch
   - Require status checks to pass
   - Prevent direct pushes to main

## 📈 Scaling and Optimization

### Performance:
- Monitor Railway resource usage
- Optimize Docker images
- Use Railway's auto-scaling

### Cost Management:
- Monitor Railway usage
- Set up billing alerts
- Optimize resource allocation

## 🎯 Next Steps

1. **Set up monitoring**: Configure alerts for failures
2. **Add custom domains**: Configure in Railway settings
3. **Set up backups**: Configure database backups
4. **Performance monitoring**: Add APM tools
5. **Security scanning**: Add security checks to CI/CD

## 📚 Resources

- [CircleCI Documentation](https://circleci.com/docs/)
- [Railway Documentation](https://docs.railway.app)
- [Railway CLI Reference](https://docs.railway.app/reference/cli)
- [CircleCI Contexts](https://circleci.com/docs/contexts/)
