# CI/CD Pipeline Guide

This guide explains the new CI/CD pipeline setup for automated deployments to Railway environments.

## 🔄 Pipeline Overview

### **Three Workflows:**

1. **`main`** - Deploy to QA on main branch merges
2. **`release`** - Deploy to production on GitHub releases
3. **`feature`** - Run tests on feature branches (no deployment)

## 🚀 Deployment Flow

### **QA Deployment (Main Branch)**
```
Pull Request → Merge to main → Tests → Build → Deploy to QA
```

**Triggers:**
- Push to `main` branch
- Pull request merged to `main`

**Environment:** `qa`
**Service:** `api-qa`
**URL:** https://api-qa-qa.up.railway.app

### **Production Deployment (GitHub Releases)**
```
Create Release → Tag (v*) → Tests → Build → Deploy to Production
```

**Triggers:**
- GitHub release created with tag starting with `v` (e.g., `v1.0.0`)

**Environment:** `production`
**Service:** `api`
**URL:** https://api-production-49d7.up.railway.app

### **Feature Branch Testing**
```
Push to feature branch → Tests → Build (validation only)
```

**Triggers:**
- Push to any branch except `main`
- No deployment, only testing and validation

## 🔧 CircleCI Setup

### **1. Create Contexts**

In CircleCI dashboard, create these contexts:

#### **`railway-qa` Context:**
```
RAILWAY_TOKEN=your-railway-token
```

#### **`railway-production` Context:**
```
RAILWAY_TOKEN=your-railway-token
JWT_SECRET=your-production-jwt-secret
SESSION_SECRET=your-production-session-secret
```

### **2. Get Railway Token**

```bash
railway auth:token
```

Add this token to both contexts in CircleCI.

### **3. Environment Variables**

The pipeline automatically sets these variables:

#### **QA Environment:**
- `NODE_ENV=QA`
- `TRADING_MODE=paper`
- `LOG_LEVEL=debug`
- `ENVIRONMENT=qa`
- `DEBUG=true`

#### **Production Environment:**
- `NODE_ENV=production`
- `TRADING_MODE=paper`
- `LOG_LEVEL=info`
- `JWT_SECRET` (from CircleCI context)
- `SESSION_SECRET` (from CircleCI context)

## 📋 How to Use

### **Deploy to QA (Automatic)**

1. **Create a Pull Request** from your feature branch
2. **Merge the PR** to main branch
3. **CircleCI automatically:**
   - Runs tests
   - Builds the application
   - Deploys to QA environment
   - Sets QA environment variables

### **Deploy to Production (Manual)**

1. **Create a GitHub Release:**
   ```bash
   # Create and push a tag
   git tag v1.0.0
   git push origin v1.0.0
   
   # Or create release via GitHub UI
   ```

2. **CircleCI automatically:**
   - Runs tests
   - Builds the application
   - Deploys to production environment
   - Sets production environment variables

### **Test Feature Branches**

1. **Push to any feature branch**
2. **CircleCI automatically:**
   - Runs tests
   - Builds the application (validation only)
   - No deployment

## 🎯 Workflow Examples

### **Example 1: Feature Development**

```bash
# Create feature branch
git checkout -b feature/new-strategy

# Make changes and push
git add .
git commit -m "Add new trading strategy"
git push origin feature/new-strategy

# CircleCI runs tests and builds (no deployment)
```

### **Example 2: Deploy to QA**

```bash
# Create and merge PR
# (via GitHub UI or CLI)

# CircleCI automatically deploys to QA
# QA URL: https://api-qa-qa.up.railway.app
```

### **Example 3: Deploy to Production**

```bash
# Create release tag
git tag v1.2.0
git push origin v1.2.0

# Or create release via GitHub UI with tag v1.2.0

# CircleCI automatically deploys to production
# Production URL: https://api-production-49d7.up.railway.app
```

## 🔍 Monitoring Deployments

### **CircleCI Dashboard**
- View build status and logs
- Monitor test results
- Check deployment progress

### **Railway Dashboard**
- Monitor service status
- View application logs
- Check resource usage

### **Commands**
```bash
# Check QA deployment
railway environment qa
railway status
railway logs

# Check production deployment
railway environment production
railway status
railway logs
```

## 🛠️ Troubleshooting

### **Common Issues**

1. **Deployment Fails:**
   - Check CircleCI build logs
   - Verify Railway token is correct
   - Check environment variables

2. **Tests Fail:**
   - Review test output in CircleCI
   - Check for linting errors
   - Verify dependencies

3. **Environment Variables Not Set:**
   - Check CircleCI context configuration
   - Verify variable names match code
   - Check Railway environment settings

### **Debug Commands**

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

1. **Environment Variables:**
   - Never commit secrets to git
   - Use CircleCI contexts for sensitive data
   - Rotate secrets regularly

2. **Railway Token:**
   - Keep token secure
   - Use different tokens for different environments
   - Regenerate if compromised

3. **Branch Protection:**
   - Require PR reviews for main branch
   - Require status checks to pass
   - Prevent direct pushes to main

## 📈 Benefits

### **Automated QA Testing:**
- Every PR merge automatically tests in QA
- Catch issues before production
- Consistent testing environment

### **Controlled Production Releases:**
- Production deployments only on releases
- Full test suite before production
- Clear release versioning

### **Feature Branch Validation:**
- All branches tested automatically
- Early detection of issues
- No accidental deployments

## 🎉 Next Steps

1. **Set up CircleCI contexts** with Railway tokens
2. **Test the pipeline** with a feature branch
3. **Create your first release** to test production deployment
4. **Monitor deployments** and adjust as needed

---

**Happy Deploying! 🚀**
