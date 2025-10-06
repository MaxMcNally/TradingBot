#!/bin/bash

# Test PR Workflow Script
# This script helps test the new PR-based workflow

echo "🚀 Testing PR Workflow Setup"
echo "=============================="

# Check if we're on main branch
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

if [ "$current_branch" = "main" ]; then
    echo "❌ You're on the main branch. Please switch to a feature branch first."
    echo "   Example: git checkout -b feature/test-pr-workflow"
    exit 1
fi

echo "✅ You're on a feature branch: $current_branch"

# Make a small change to test the workflow
echo ""
echo "📝 Making a test change..."
echo "# Test PR Workflow - $(date)" >> TEST_PR_WORKFLOW.md

# Add and commit the change
git add TEST_PR_WORKFLOW.md
git commit -m "Test PR workflow setup

This is a test commit to verify the new PR-based workflow:
- Pull requests should trigger tests and builds
- Main branch should be protected from direct pushes
- Only merged PRs should deploy to QA

This file can be deleted after testing."

echo "✅ Test commit created"

# Push the branch
echo ""
echo "📤 Pushing branch to origin..."
git push origin $current_branch

echo ""
echo "🎯 Next Steps:"
echo "1. Go to GitHub: https://github.com/MaxMcNally/TradingBot"
echo "2. Create a Pull Request from '$current_branch' to 'main'"
echo "3. Check CircleCI dashboard to see if the PR workflow triggers"
echo "4. Verify that tests and builds run on the PR"
echo "5. After testing, you can delete this branch and the test file"
echo ""
echo "🔗 GitHub PR URL:"
echo "https://github.com/MaxMcNally/TradingBot/compare/main...$current_branch"
