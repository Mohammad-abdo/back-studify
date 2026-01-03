# Database Setup Script for Studify
# This script helps you set up the database

Write-Host "🔧 Studify Database Setup" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is running
Write-Host "1. Checking MySQL connection..." -ForegroundColor Yellow
$mysqlCheck = Get-Process -Name "mysqld" -ErrorAction SilentlyContinue
if (-not $mysqlCheck) {
    Write-Host "   ⚠️  MySQL might not be running" -ForegroundColor Yellow
    Write-Host "   Please start MySQL service (XAMPP/MAMP/MySQL Service)" -ForegroundColor White
} else {
    Write-Host "   ✅ MySQL process found" -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Database Setup Instructions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Option A: Using Command Line" -ForegroundColor Cyan
Write-Host "   -----------------------------" -ForegroundColor Gray
Write-Host "   mysql -u root -p" -ForegroundColor White
Write-Host "   CREATE DATABASE IF NOT EXISTS studify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" -ForegroundColor White
Write-Host "   EXIT;" -ForegroundColor White
Write-Host ""
Write-Host "   Option B: Using phpMyAdmin" -ForegroundColor Cyan
Write-Host "   --------------------------" -ForegroundColor Gray
Write-Host "   1. Open http://localhost/phpmyadmin" -ForegroundColor White
Write-Host "   2. Click 'New' to create database" -ForegroundColor White
Write-Host "   3. Name: studify" -ForegroundColor White
Write-Host "   4. Collation: utf8mb4_unicode_ci" -ForegroundColor White
Write-Host "   5. Click 'Create'" -ForegroundColor White
Write-Host ""

Write-Host "3. After creating the database, run:" -ForegroundColor Yellow
Write-Host "   npx prisma migrate dev" -ForegroundColor White
Write-Host "   npm run prisma:seed" -ForegroundColor White
Write-Host ""

Write-Host "4. Current DATABASE_URL in .env:" -ForegroundColor Yellow
$dbUrl = Get-Content .env | Select-String -Pattern "^DATABASE_URL"
if ($dbUrl) {
    Write-Host "   $($dbUrl.Line)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   If root has a password, update it to:" -ForegroundColor Yellow
    Write-Host '   DATABASE_URL="mysql://root:yourpassword@localhost:3306/studify"' -ForegroundColor White
} else {
    Write-Host "   ❌ DATABASE_URL not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


