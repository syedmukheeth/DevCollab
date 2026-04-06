#!/bin/bash
set -e

# SyncMesh Forge Production Deployment Script
# Supports AWS EC2 and Oracle Cloud Always-Free ARM instances

echo "🚀 Starting SyncMesh Forge Production Deployment..."

# 1. System Dependencies
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    # Wait for docker group to apply
    su -s /bin/bash $USER -c "docker info"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 2. Environment Verification
if [ ! -f .env ]; then
    echo "⚠️  No .env file found! Generating secure defaults..."
    cat <<EOF > .env
NODE_ENV=production
PORT=4000
DB_USER=devcollab
DB_PASSWORD=$(openssl rand -base64 16)
DB_NAME=syncmesh_prod
SESSION_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost:5173
EOF
    echo "✅ .env generated. Please edit frontend URLs and OAuth keys before deploying to the public web!"
fi

# 3. Pull latest changes
echo "📥 Pulling latest repository state..."
git branch -r | grep origin/main > /dev/null && git pull origin main || echo "Working off local tree."

# 4. Prisma Database Migrations
echo "🗄️ Starting temporary Postgres DB for Prisma migrations..."
docker-compose -f docker-compose.prod.yml up -d db redis minio
sleep 8 # wait for services to boot

# Apply migrations
echo "⚙️ Running Prisma migrations to PostgreSQL..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# 5. Launch Cluster
echo "🚢 Launching Backend Production Cluster (Oracle Cloud)..."
# We exclude 'frontend' if it's being served by Vercel
docker-compose -f docker-compose.prod.yml up -d --build backend redis db minio

echo "🎉 Deployment Complete!"
echo "Backend API & Socket Backplane running on port 4000."
echo "View logs running: docker-compose -f docker-compose.prod.yml logs -f"
