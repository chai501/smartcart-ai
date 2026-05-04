# Smart E-Commerce System - Startup Script

Write-Host "Starting Smart E-Commerce Recommendation System..." -ForegroundColor Cyan

# 1. Start Backend
Write-Host "Starting Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 2. Start ML Service
Write-Host "Starting ML Recommendation Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd data-science; ..\.venv\Scripts\activate; python main.py"

# 3. Start Frontend
Write-Host "Starting Frontend (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "All services are starting in separate windows!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "ML Service: http://localhost:8000" -ForegroundColor Cyan
