@echo off
title Aetheria Purplish Lavender EPUB Reader
echo Starting Aetheria EPUB Reader...
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev
