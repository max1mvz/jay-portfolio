@echo off
title Jay Lovete - The Reel (scroll-cinematic demo)
cd /d "%~dp0"
echo ============================================================
echo    Jay Lovete - THE REEL  (scroll-scrubbed cinematic site)
echo ============================================================
echo.
echo  Opening http://localhost:4321/cinema/ . . .
start "" "http://localhost:4321/cinema/"
echo  Keep this window open while viewing. Ctrl+C to stop.
echo.
python -m http.server 4321
