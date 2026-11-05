Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Current directory
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetParentFolderName(scriptDir)

' 1. Start MySQL database silently
WshShell.Run "cmd.exe /c """ & scriptDir & "\start-mysql.bat""", 0, False
WScript.Sleep 3000

' 2. Start Express Backend API silently
WshShell.Run "cmd.exe /c """ & scriptDir & "\start-backend.bat""", 0, False
WScript.Sleep 2000

' 3. Start React Vite Frontend silently
WshShell.Run "cmd.exe /c """ & scriptDir & "\start-frontend.bat""", 0, False
WScript.Sleep 2000

' Optional: Popup notification
' WshShell.Popup "Telangana Ruchulu Restaurant Management System is now running in the background at http://localhost:3000", 5, "System Started", 64
