@echo off
title Smart Intelligence System GitHub Push
set "PATH=C:\Users\sonak\.gemini\antigravity-ide\scratch\mingit\cmd;%PATH%"
cd /d "%~dp0"
echo ================================================================
echo           SMART INTELLIGENCE SYSTEM - GITHUB PUSH
echo ================================================================
echo Remote: https://github.com/sonakshi-645-s/Smart-Intelligence-System.git
echo.
git branch -M main
git remote -v
echo.
echo Pushing latest commits to GitHub...
git push -u origin main
echo.
pause
