@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Cleaning EventRecording Solution
echo ===================================================
echo.

echo Removing Node modules...
if exist node_modules rmdir /s /q node_modules
if exist preseed\node_modules rmdir /s /q preseed\node_modules
if exist generator\node_modules rmdir /s /q generator\node_modules
if exist client\node_modules rmdir /s /q client\node_modules

echo Removing build output directories (dist)...
if exist dist rmdir /s /q dist
if exist preseed\dist rmdir /s /q preseed\dist
if exist generator\dist rmdir /s /q generator\dist
if exist client\dist rmdir /s /q client\dist

echo Removing active runtime data files (data\)...
if exist data\events.db del /f /q /a data\events.db
if exist data\events.db-journal del /f /q /a data\events.db-journal
if exist data\events.db-shm del /f /q /a data\events.db-shm
if exist data\events.db-wal del /f /q /a data\events.db-wal
if exist data\events.json del /f /q /a data\events.json
if exist data\sites.json del /f /q /a data\sites.json

echo Removing log files and temporary artifacts...
if exist *.log del /f /q /a *.log
if exist npm-debug.log* del /f /q /a npm-debug.log*

echo.
echo ===================================================
echo   SUCCESS: Repository cleaned cleanly for Git!
echo ===================================================
