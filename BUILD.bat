@echo off
echo Building New Rules of Battle...
echo.
echo This may take a minute. You'll see some signing errors - these are normal!
echo.
.\node_modules\.bin\electron-builder.cmd
echo.
echo ================================================
echo BUILD COMPLETE!
echo ================================================
echo.
echo Your app is located at:
echo dist\win-unpacked\New Rules of Battle.exe
echo.
echo Double-click that file to run your app!
echo.
pause
