#!/bin/bash
set -e

APP_DIR="/var/www/struct"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
REPO="https://github.com/farhaghallab3/structv2.git"

echo "=== Struct deploy ==="

# 1. Clone or update
if [ -d "$APP_DIR/repo/.git" ]; then
  cd "$APP_DIR/repo"
  git pull origin main || git pull origin master
else
  mkdir -p "$APP_DIR"
  git clone "$REPO" "$APP_DIR/repo"
  cd "$APP_DIR/repo"
fi

# 2. Backend
mkdir -p "$BACKEND_DIR"
rsync -a --exclude venv --exclude staticfiles --exclude .env \
  "$APP_DIR/repo/" "$BACKEND_DIR/"

cd "$BACKEND_DIR"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
python manage.py seed_templates
python manage.py collectstatic --noinput

# 3. Frontend build
cd "$APP_DIR/repo/struct-react"
npm ci
cp .env.production .env.production.local 2>/dev/null || true
REACT_APP_API_URL=https://api.structorg.com/api npm run build
rsync -a --delete build/ "$FRONTEND_DIR/"

# 4. Restart API
sudo systemctl restart struct-api
sudo systemctl reload nginx

echo "=== Deploy complete ==="
