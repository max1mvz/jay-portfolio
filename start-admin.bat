@echo off
REM ── Launches the site + the Decap CMS admin for editing content locally ──
cd /d "%~dp0"
echo Starting Decap CMS proxy (decap-server) on http://localhost:8081 ...
start "Decap CMS proxy" cmd /k npx decap-server
echo Starting local site at http://localhost:4321
echo.
echo   Edit your content here:  http://localhost:4321/admin/
echo.
echo Close this window (or press Ctrl+C) to stop the site.
start "" http://localhost:4321/admin/
python -m http.server 4321
