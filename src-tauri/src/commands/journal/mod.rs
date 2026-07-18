// Journal Tauri commands — split into focused submodules.
//
// - `helpers`        : shared types and pure parsing functions (no FS, no commands)
// - `crud`           : list/read/write/delete + journal context + export
// - `sync`           : sync-specific commands (timestamped writes, sync base)
// - `sync_helpers`   : shared sync helpers (file timestamp mutator)
//
// `lib.rs` and `commands::embeddings` / `commands::search` keep referring
// to `commands::journal::is_valid_date_file`, `extract_tags`, `extract_preview`,
// `list_entries`, etc. All of these are re-exported below to preserve the
// public path used elsewhere in the crate.

pub mod crud;
pub mod helpers;
pub mod sync;
mod sync_helpers;

pub use crud::*;
pub use helpers::{extract_preview, extract_tags, is_valid_date_file};
pub use sync::*;
