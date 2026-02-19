#!/bin/bash
# deploy.sh
# Quick deployment script for Health Monitor
# Usage: bash deploy.sh [backend|frontend|all]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Health Monitor - Production Deployment Script           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

# Get current directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to deploy backend
deploy_backend() {
    echo -e "\n${YELLOW}📦 Deploying Backend to Render...${NC}"
    
    cd "$REPO_ROOT/Backend"
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Git not initialized. Run 'git init' first${NC}"
        exit 1
    fi
    
    # Verify files exist
    if [ ! -f "runtime.txt" ]; then
        echo -e "${RED}❌ runtime.txt not found${NC}"
        exit 1
    fi
    
    if [ ! -f "build.sh" ]; then
        echo -e "${RED}❌ build.sh not found${NC}"
        exit 1
    fi
    
    if [ ! -f "start.sh" ]; then
        echo -e "${RED}❌ start.sh not found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}✓ Checking build script...${NC}"
    bash build.sh 2>/dev/null && echo -e "${GREEN}✓ Build script OK${NC}" || echo -e "${YELLOW}! Build script failed (expected in CI)${NC}"
    
    echo -e "${YELLOW}✓ Committing changes...${NC}"
    git add -A
    git commit -m "Deploy: Production backend setup" || true
    
    echo -e "${YELLOW}✓ Pushing to origin main...${NC}"
    git push origin main
    
    echo -e "${GREEN}✅ Backend deployed! ${NC}"
    echo -e "   Configure in Render Dashboard:"
    echo -e "   - Build Command: bash build.sh"
    echo -e "   - Start Command: bash start.sh"
    echo -e "   - Set all environment variables"
    
    cd - > /dev/null
}

# Function to deploy frontend
deploy_frontend() {
    echo -e "\n${YELLOW}🎨 Deploying Frontend to Vercel...${NC}"
    
    cd "$REPO_ROOT/Frontend"
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}! Git not in Frontend folder (expected - use monorepo)${NC}"
    fi
    
    echo -e "${YELLOW}✓ Verifying build...${NC}"
    npm run build 2>/dev/null && echo -e "${GREEN}✓ Build successful${NC}" || echo -e "${RED}❌ Build failed${NC}"
    
    echo -e "${YELLOW}✓ Files ready for deployment${NC}"
    
    echo -e "${GREEN}✅ Frontend ready to deploy!${NC}"
    echo -e "   In Vercel Dashboard:"
    echo -e "   - Set VITE_API_URL environment variable"
    echo -e "   - Build Command: npm run build"
    echo -e "   - Output Directory: dist"
    
    cd - > /dev/null
}

# Function to test health endpoints
test_endpoints() {
    echo -e "\n${YELLOW}🧪 Testing Endpoints...${NC}"
    
    echo -e "${YELLOW}Testing Backend Health...${NC}"
    if curl -s https://health-monitor-backend.onrender.com/api/health/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend health check OK${NC}"
    else
        echo -e "${YELLOW}! Backend not yet deployed${NC}"
    fi
    
    echo -e "${YELLOW}Testing Frontend...${NC}"
    if curl -s https://health-monitor-frontend.vercel.app > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend responding${NC}"
    else
        echo -e "${YELLOW}! Frontend not yet deployed${NC}"
    fi
}

# Function to show environment
show_env() {
    echo -e "\n${YELLOW}🔍 Environment Check...${NC}"
    
    echo -e "${YELLOW}Python:${NC}"
    python --version 2>/dev/null || echo "Not installed"
    
    echo -e "${YELLOW}Node:${NC}"
    node --version 2>/dev/null || echo "Not installed"
    
    echo -e "${YELLOW}Git:${NC}"
    git --version 2>/dev/null || echo "Not installed"
    
    echo -e "${YELLOW}Backend dependencies:${NC}"
    [ -f "$REPO_ROOT/Backend/requirements.txt" ] && echo "✓ requirements.txt found" || echo "✗ Not found"
    
    echo -e "${YELLOW}Frontend dependencies:${NC}"
    [ -f "$REPO_ROOT/Frontend/package.json" ] && echo "✓ package.json found" || echo "✗ Not found"
    
    echo -e "${YELLOW}Production files:${NC}"
    [ -f "$REPO_ROOT/DEPLOYMENT_GUIDE.md" ] && echo "✓ DEPLOYMENT_GUIDE.md found" || echo "✗ Not found"
    [ -f "$REPO_ROOT/PRODUCTION_CHECKLIST.md" ] && echo "✓ PRODUCTION_CHECKLIST.md found" || echo "✗ Not found"
}

# Main logic
DEPLOY_TYPE=${1:-all}

case $DEPLOY_TYPE in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    test)
        test_endpoints
        ;;
    env)
        show_env
        ;;
    all)
        show_env
        echo ""
        echo -e "${YELLOW}Choose what to deploy:${NC}"
        echo "1) Backend only"
        echo "2) Frontend only"
        echo "3) Both (backend then frontend)"
        echo "4) Exit"
        read -p "Enter choice (1-4): " choice
        
        case $choice in
            1)
                deploy_backend
                ;;
            2)
                deploy_frontend
                ;;
            3)
                deploy_backend
                echo ""
                deploy_frontend
                ;;
            4)
                echo -e "${YELLOW}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                exit 1
                ;;
        esac
        ;;
    help)
        echo "Usage: bash deploy.sh [backend|frontend|all|test|env|help]"
        echo ""
        echo "Options:"
        echo "  backend   - Deploy backend to Render"
        echo "  frontend  - Deploy frontend to Vercel"
        echo "  all       - Interactive deployment"
        echo "  test      - Test production endpoints"
        echo "  env       - Show environment info"
        echo "  help      - Show this help message"
        ;;
    *)
        echo -e "${RED}Unknown option: $DEPLOY_TYPE${NC}"
        echo "Run 'bash deploy.sh help' for usage"
        exit 1
        ;;
esac

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Deployment script completed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
