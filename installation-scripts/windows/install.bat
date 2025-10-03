@echo off
echo ========================================
echo ICS/OT Cybersecurity Platform Installer
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - OK
) else (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo [1/8] Checking system requirements...

:: Check Windows version
for /f "tokens=4-5 delims=. " %%i in ('ver') do set VERSION=%%i.%%j
echo Windows version: %VERSION%

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo Node.js: Found
    node --version
) else (
    echo Node.js: Not found - Installing...
    echo Please install Node.js 18+ from https://nodejs.org/
    echo Press any key to open the download page...
    pause >nul
    start https://nodejs.org/
    echo After installing Node.js, please restart this script.
    pause
    exit /b 1
)

:: Check if Python is installed
python --version >nul 2>&1
if %errorLevel% == 0 (
    echo Python: Found
    python --version
) else (
    echo Python: Not found - Installing...
    echo Please install Python 3.9+ from https://python.org/
    echo Press any key to open the download page...
    pause >nul
    start https://python.org/downloads/
    echo After installing Python, please restart this script.
    pause
    exit /b 1
)

:: Check if Git is installed
git --version >nul 2>&1
if %errorLevel% == 0 (
    echo Git: Found
    git --version
) else (
    echo Git: Not found - Installing...
    echo Please install Git from https://git-scm.com/
    echo Press any key to open the download page...
    pause >nul
    start https://git-scm.com/downloads
    echo After installing Git, please restart this script.
    pause
    exit /b 1
)

echo.
echo [2/8] Creating application directories...
if not exist "C:\ICS-Cybersecurity" mkdir "C:\ICS-Cybersecurity"
if not exist "C:\ICS-Cybersecurity\data" mkdir "C:\ICS-Cybersecurity\data"
if not exist "C:\ICS-Cybersecurity\logs" mkdir "C:\ICS-Cybersecurity\logs"
if not exist "C:\ICS-Cybersecurity\models" mkdir "C:\ICS-Cybersecurity\models"
echo Application directories created.

echo.
echo [3/8] Copying application files...
xcopy /E /I /Y "..\..\backend" "C:\ICS-Cybersecurity\backend"
xcopy /E /I /Y "..\..\frontend" "C:\ICS-Cybersecurity\frontend"
echo Application files copied.

echo.
echo [4/8] Setting up Python virtual environment...
cd "C:\ICS-Cybersecurity\backend"
python -m venv venv
call venv\Scripts\activate.bat
echo Virtual environment created.

echo.
echo [5/8] Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)
echo Python dependencies installed.

echo.
echo [6/8] Installing Node.js dependencies...
cd "C:\ICS-Cybersecurity\frontend"
npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo Node.js dependencies installed.

echo.
echo [7/8] Building frontend application...
npm run build
if %errorLevel% neq 0 (
    echo ERROR: Failed to build frontend application
    pause
    exit /b 1
)
echo Frontend application built.

echo.
echo [8/8] Creating Windows services...

:: Create backend service script
echo @echo off > "C:\ICS-Cybersecurity\start-backend.bat"
echo cd "C:\ICS-Cybersecurity\backend" >> "C:\ICS-Cybersecurity\start-backend.bat"
echo call venv\Scripts\activate.bat >> "C:\ICS-Cybersecurity\start-backend.bat"
echo python src\main.py >> "C:\ICS-Cybersecurity\start-backend.bat"

:: Create frontend service script
echo @echo off > "C:\ICS-Cybersecurity\start-frontend.bat"
echo cd "C:\ICS-Cybersecurity\frontend" >> "C:\ICS-Cybersecurity\start-frontend.bat"
echo npm run preview -- --host 0.0.0.0 --port 3000 >> "C:\ICS-Cybersecurity\start-frontend.bat"

:: Create combined startup script
echo @echo off > "C:\ICS-Cybersecurity\start-platform.bat"
echo echo Starting ICS/OT Cybersecurity Platform... >> "C:\ICS-Cybersecurity\start-platform.bat"
echo start "Backend" cmd /k "C:\ICS-Cybersecurity\start-backend.bat" >> "C:\ICS-Cybersecurity\start-platform.bat"
echo timeout /t 5 >> "C:\ICS-Cybersecurity\start-platform.bat"
echo start "Frontend" cmd /k "C:\ICS-Cybersecurity\start-frontend.bat" >> "C:\ICS-Cybersecurity\start-platform.bat"
echo echo Platform started! >> "C:\ICS-Cybersecurity\start-platform.bat"
echo echo Backend: http://localhost:8000 >> "C:\ICS-Cybersecurity\start-platform.bat"
echo echo Frontend: http://localhost:3000 >> "C:\ICS-Cybersecurity\start-platform.bat"

:: Create desktop shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo sLinkFile = "%USERPROFILE%\Desktop\ICS Cybersecurity Platform.lnk" >> "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo oLink.TargetPath = "C:\ICS-Cybersecurity\start-platform.bat" >> "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo oLink.WorkingDirectory = "C:\ICS-Cybersecurity" >> "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo oLink.Description = "ICS/OT Cybersecurity Platform" >> "C:\ICS-Cybersecurity\create-shortcut.vbs"
echo oLink.Save >> "C:\ICS-Cybersecurity\create-shortcut.vbs"

cscript "C:\ICS-Cybersecurity\create-shortcut.vbs"
del "C:\ICS-Cybersecurity\create-shortcut.vbs"

echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo The ICS/OT Cybersecurity Platform has been installed to:
echo C:\ICS-Cybersecurity\
echo.
echo To start the platform:
echo 1. Double-click the desktop shortcut "ICS Cybersecurity Platform"
echo 2. Or run: C:\ICS-Cybersecurity\start-platform.bat
echo.
echo Access URLs:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo.
echo For support and documentation, see README.md
echo.
pause

