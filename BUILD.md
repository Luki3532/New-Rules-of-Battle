# Build Instructions for Windows .exe

## ✅ GOOD NEWS: The app has been built successfully!

Your executable is located at:
```
dist\win-unpacked\New Rules of Battle.exe
```

**To run the app:** Double-click `New Rules of Battle.exe` in the `dist\win-unpacked` folder.

**To share with friends:** Zip the entire `dist\win-unpacked` folder and send it to them. They can extract and run the .exe file.

---

## Building the App Yourself

### Quick Build Command

1. Open PowerShell and navigate to the project folder:
   ```powershell
   cd "c:\Users\Lucas Carpenter\Desktop\Me\New Rules of Battle"
   ```

2. Build the app:
   ```powershell
   .\node_modules\.bin\electron-builder.cmd
   ```

3. The app will be in `dist\win-unpacked\New Rules of Battle.exe`

**Note:** You may see signing errors during the build - these are normal and can be ignored. The app still builds successfully!

---

## Testing Before Building

To test the Electron app before building:

```powershell
cd "c:\Users\Lucas Carpenter\Desktop\Me\New Rules of Battle"
.\node_modules\.bin\electron.cmd .
```

This will open the application in a window without creating the exe.

---

## About the "Signing Errors"

During the build, you'll see errors about "Cannot create symbolic link" and "winCodeSign". **These are safe to ignore!**

These errors occur because:
- Windows requires special permissions to create symbolic links
- The signing tools aren't needed for personal use
- Your app builds successfully despite these warnings

The actual executable is created in `dist\win-unpacked` regardless of these errors.

---

## Distribution

### Option 1: Share the Unpacked Folder (Recommended)
1. Zip the entire `dist\win-unpacked` folder
2. Send the zip file to your friends
3. They extract and run `New Rules of Battle.exe`
4. Each person has their own separate data storage

### Option 2: Create a Portable Package
```powershell
# Create a zip file
Compress-Archive -Path "dist\win-unpacked\*" -DestinationPath "NewRulesOfBattle-Portable.zip"
```

---

## What Gets Included

The .exe includes:
- index.html (main interface)
- styles.css (Hunt Showdown theme)
- script.js (application logic)  
- main.js (Electron wrapper)
- All Electron runtime files

All your data is stored locally in each user's application data folder using localStorage.
