@echo off
REM ── Launches the portfolio locally and opens it in your browser ──
cd /d "%~dp0"
echo Starting local server at http://localhost:4321
echo Close this window (or press Ctrl+C) to stop the site.
start "" http://localhost:4321
python -m http.server 4321
