@echo off
title Google Gemini - Clean One-Time Sign-In Helper
echo =======================================================================
echo   Google Gemini - Clean Sign-In Helper (Anti-Bot Bypass)
echo =======================================================================
echo.
echo Closing any lingering Chrome instances tied to gemini_chrome_profile...
powershell -Command "Get-CimInstance Win32_Process -Filter \"Name = 'chrome.exe'\" | Where-Object { $_.CommandLine -like '*gemini_chrome_profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1
timeout /t 1 >nul

if exist "%~dp0gemini_chrome_profile\DevToolsActivePort" (
    del /f /q "%~dp0gemini_chrome_profile\DevToolsActivePort" >nul 2>&1
)

echo.
echo Launching Google Chrome in CLEAN mode (without any debugging or bot flags)...
echo.
echo -----------------------------------------------------------------------
echo INSTRUCTIONS:
echo 1. In the Chrome window that opens, sign in to:
echo    elattarayman1@gmail.com
echo 2. Once you are signed in and see the Gemini home screen:
echo    CLOSE the Chrome window.
echo 3. Your login session will be permanently saved in 'gemini_chrome_profile'.
echo 4. You can then run: .\run.bat --theme "Gothic Vitrail Fox" --count 1 --mode gemini-web
echo -----------------------------------------------------------------------
echo.

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="%~dp0gemini_chrome_profile" "https://accounts.google.com/ServiceLogin?continue=https://gemini.google.com/app"

echo Chrome launched! Please sign in in that window, then close it.
echo Press any key when you have signed in and closed the Chrome window.
pause >nul
echo.
echo Done! Your profile is ready for automated generation.

