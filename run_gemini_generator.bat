@echo off
setlocal enabledelayedexpansion
title CaseCraft Studio - Gemini Web Multi-Theme AI Generator

echo ===============================================================================
echo        CaseCraft Studio - 5-Design Multi-Theme Phone Case Generator
echo               (Chrome Selenium + Master Excel + Google Drive)
echo ===============================================================================
echo.
echo Enter your themes below (you can type a single theme or multiple separated by commas).
echo Example: Japanese Dragon, Cyberpunk Samurai, Celestial Wolf
echo.

set /p THEMES="Enter Theme(s) [Japanese design for a dragon]: "
if "!THEMES!"=="" set THEMES=Japanese design for a dragon

set /p COUNT="Designs per theme [5]: "
if "!COUNT!"=="" set COUNT=5

echo.
echo [*] Themes:    !THEMES!
echo [*] Per Theme: !COUNT! Designs
echo [*] Standard:  9:16 Vertical Full Bleed (8K Resolution)
echo [*] Safe-Zone: Lower 65%% Focal Element, Top 35%% Camera Clearance
echo [*] Cloud:     Master Products Excel + Google Drive Auto-Sync
echo.

py scripts\gemini_web_selenium.py --themes !THEMES! --count !COUNT!

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Process exited with status %ERRORLEVEL%.
)

echo.
echo ===============================================================================
echo Completed! Check your 'projects' folder and Google Drive folder.
echo You can now load the Master Excel into 'Excel to Printify Importer' at http://localhost:3000!
echo ===============================================================================
pause
