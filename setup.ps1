# EC Validator - Quick Setup Script for Windows PowerShell

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "EC Validator - Development Setup" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

# Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Successfully detected Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js not found. Please install Node.js 22+ first." -ForegroundColor Red
    exit 1
}

# Install agent dependencies
Write-Host "`n[2/5] Installing agent dependencies..." -ForegroundColor Yellow
Set-Location agent
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully installed agent dependencies" -ForegroundColor Green
    } else {
        Write-Host "Failed to install agent dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "Error: agent/package.json not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Install web dependencies
Write-Host "`n[3/5] Installing web dependencies..." -ForegroundColor Yellow
Set-Location ../web
if (Test-Path "package.json") {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully installed web dependencies" -ForegroundColor Green
    } else {
        Write-Host "Failed to install web dependencies" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
} else {
    Write-Host "Error: web/package.json not found" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Check for .env file
Write-Host "`n[4/5] Checking environment configuration..." -ForegroundColor Yellow
Set-Location ..
if (Test-Path ".env.local") {
    Write-Host "Found .env.local file" -ForegroundColor Green
} else {
    Write-Host "Warning: .env.local not found" -ForegroundColor Yellow
    Write-Host "  Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "  Created .env.local - Please fill in your API keys" -ForegroundColor Green
    } else {
        Write-Host "  Error: .env.example not found" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n[5/5] Setup Summary" -ForegroundColor Yellow
Write-Host "==================`n" -ForegroundColor Yellow

Write-Host "Project structure:" -ForegroundColor White
Write-Host "  - agent/  Backend with skills and tools" -ForegroundColor Green
Write-Host "  - web/    Frontend with Next.js" -ForegroundColor Green
Write-Host ""

Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Edit .env.local with your API keys" -ForegroundColor Cyan
Write-Host "  2. Start agent:  cd agent ; npm run dev" -ForegroundColor Cyan
Write-Host "  3. Start web:    cd web ; npm run dev" -ForegroundColor Cyan
Write-Host "  4. Open:         http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

Write-Host "For detailed instructions, see:" -ForegroundColor White
Write-Host "  - README.md" -ForegroundColor Cyan
Write-Host "  - DEVELOPMENT_STATUS.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "Setup complete!`n" -ForegroundColor Green
