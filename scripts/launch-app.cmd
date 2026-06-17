@echo off
setlocal

pushd "%~dp0.." >nul
set "APP_DIR=%CD%"
popd >nul

set "ELECTRON_EXE=%APP_DIR%\node_modules\electron\dist\electron.exe"
set "MAIN_FILE=%APP_DIR%\out\main\index.js"

if not exist "%ELECTRON_EXE%" (
  echo Electron is not installed. Run npm install first.
  pause
  exit /b 1
)

if not exist "%MAIN_FILE%" (
  echo Built app files are missing. Run npm run build first.
  pause
  exit /b 1
)

start "" "%ELECTRON_EXE%" "%APP_DIR%"
