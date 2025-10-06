# CircleCI Workflow Configuration Guide

## 🔄 **Current Workflow Setup**

### **1. Default Workflow (Feature Branches)**
- **Triggers**: All branches except `main`
- **Jobs**: 
  - `install-dependencies`
  - `test-backend` (requires install-dependencies)
  - `test-frontend` (requires install-dependencies)
  - `build-images` (requires test-backend + test-frontend)
- **Purpose**: Run tests and builds on PRs and feature branches
- **No Deployment**: Only validation

### **2. Main Deploy Workflow**
- **Triggers**: Only `main` branch
- **Jobs**: 
  - `install-dependencies`
  - `test-backend` (requires install-dependencies)
  - `test-frontend` (requires install-dependencies)
  - `build-images` (requires test-backend + test-frontend)
  - `deploy-railway-qa` (requires build-images)
- **Purpose**: Deploy to QA environment after PR merge
- **Deployment**: Railway QA environment

### **3. Release Workflow**
- **Triggers**: Only tags matching `/^v.*/` (e.g., v1.0.0, v2.1.3)
- **Jobs**: 
  - `install-dependencies`
  - `test-backend` (requires install-dependencies)
  - `test-frontend` (requires install-dependencies)
  - `build-images` (requires test-backend + test-frontend)
  - `deploy-railway-production` (requires build-images)
- **Purpose**: Deploy to production on GitHub releases
- **Deployment**: Railway production environment

## 🧪 **Testing the Workflows**

### **Test Feature Branch Workflow:**
```bash
# Create a test branch
git checkout -b feature/test-workflow

# Make a change
echo "# Test $(date)" >> TEST.md
git add TEST.md
git commit -m "Test feature branch workflow"
git push origin feature/test-workflow

# Create PR on GitHub
# CircleCI should trigger the default workflow
```

### **Test Main Branch Workflow:**
```bash
# After PR is approved and merged to main
# CircleCI should trigger the main-deploy workflow
# This will deploy to Railway QA environment
```

### **Test Release Workflow:**
```bash
# Create a release tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# CircleCI should trigger the release workflow
# This will deploy to Railway production environment
```

## 🔍 **Troubleshooting**

### **If Workflows Don't Trigger:**

1. **Check CircleCI Dashboard**: https://app.circleci.com/pipelines/github/MaxMcNally/TradingBot
2. **Verify Branch Protection**: Ensure main branch protection is properly configured
3. **Check Webhook Settings**: Verify GitHub webhooks are properly configured
4. **Validate Configuration**: Use CircleCI CLI to validate config:
   ```bash
   circleci config validate .circleci/config.yml
   ```

### **Common Issues:**

- **Branch Protection**: If main is protected, direct pushes will be blocked
- **Webhook Configuration**: CircleCI needs proper GitHub webhook access
- **Context Variables**: Ensure Railway contexts are properly configured
- **Status Checks**: GitHub branch protection requires status checks to pass

## 📋 **Workflow Summary**

| Event | Workflow | Jobs | Deployment |
|-------|----------|------|------------|
| Push to feature branch | `default` | install → test → build | ❌ None |
| PR created/updated | `default` | install → test → build | ❌ None |
| PR merged to main | `main-deploy` | install → test → build → deploy | ✅ Railway QA |
| Tag created (v*) | `release` | install → test → build → deploy | ✅ Railway Production |

## 🚀 **Next Steps**

1. **Monitor CircleCI Dashboard** for workflow execution
2. **Test each workflow** with the examples above
3. **Verify deployments** to Railway environments
4. **Adjust configuration** as needed based on results
