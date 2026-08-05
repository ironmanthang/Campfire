Campfire Journal is a native desktop application built using the Tauri framework (Rust/Webview2). 

The runFullTrust capability is required for the application to function as a native Win32 desktop app. Specifically, it uses full trust permissions to:
1. Access the local file system to store, read, and export local journal data, attachments, and app settings.
2. Trigger system file picker dialogs and open default web browsers/external links.
3. Execute the native compiled binary backend (Rust) for local application logic and local database management.
