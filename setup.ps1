# Run from project root after updating DB_PASSWORD in .env

Write-Host "Struct Backend Setup" -ForegroundColor Cyan
Write-Host "===================="

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example — update DB_PASSWORD if needed."
}

Write-Host "`n1. Start PostgreSQL (choose one):"
Write-Host "   - Docker:  docker compose up -d"
Write-Host "   - Local:   ensure PostgreSQL service is running"

Write-Host "`n2. Create database (psql as superuser):"
Write-Host "   CREATE DATABASE struct_db;"

Write-Host "`n3. Installing Python deps..."
pip install -r requirements.txt

Write-Host "`n4. Running migrations..."
python manage.py migrate

Write-Host "`n5. Seeding templates..."
python manage.py seed_templates

Write-Host "`n6. Done! Start the API server:"
Write-Host "   python manage.py runserver"
Write-Host "`n   Frontend (separate terminal):"
Write-Host "   cd struct-react && npm start"
