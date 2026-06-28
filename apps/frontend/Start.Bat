@echo off
title VCPGroupChat frontend debug (port 4090)

REM Run from the directory containing this script.
cd /d %~dp0

echo ======================================
echo  VCPGroupChat frontend debug server
echo ======================================
echo.
echo Starting Python HTTP server on port 4090...
echo.
echo Open:
echo   http://localhost:4090
echo.
echo The default product backend is:
echo   http://127.0.0.1:7010
echo.
echo Press Ctrl+C to stop the server.
echo ======================================
echo.

python -m http.server 4090

echo.
echo Server stopped or failed to start.
echo Press any key to exit...
pause > nul
