import { invoke } from "@tauri-apps/api/core";

/*
  =============================================================================
  DEBUG CLEANUP GUIDE
  =============================================================================
  If you want to delete all debug/payload logging code from the app, do these steps:

  1. Delete this file completely:
     -> src/services/debug.ts (this file)

  2. Delete the Rust debug module file:
     -> src-tauri/src/debug.rs

  3. In src/services/ollama.ts:
     - Remove: import { saveDebugPayload } from "./debug";
     - Remove: await saveDebugPayload(journalDir, chatBody);

  4. In src-tauri/src/lib.rs:
     - Remove: mod debug;
     - Remove: debug::write_debug_payload // DEBUG
  =============================================================================
*/

// DEBUG: Intercept and save chat payload
export async function saveDebugPayload(journalDir: string, payload: any) {
  try {
    await invoke("write_debug_payload", {
      dirPath: journalDir,
      filename: "last_sent_payload.json",
      content: JSON.stringify(payload, null, 2)
    });
  } catch (err) {
    console.error("Failed to save debug payload:", err);
  }
}

