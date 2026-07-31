Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\program\Campfire\desktop"
WshShell.Run "cmd.exe /c pnpm dev:tauri", 0, False
