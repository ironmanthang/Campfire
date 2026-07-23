mod commands;
mod debug;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::config::load_config,
            commands::config::save_config,
            commands::config::read_image_as_base64,
            commands::journal::list_entries,
            commands::journal::read_entry,
            commands::journal::write_entry,
            commands::search::search_entries,
            commands::journal::export_journal,
            commands::journal::import_journal,
            commands::journal::get_journal_context,
            commands::journal::get_journal_context_with_lines,
            commands::chat::load_chat_history,
            commands::chat::save_chat_history,
            commands::journal::delete_entry,
            commands::journal::delete_entries,
            commands::embeddings::get_entry_hashes,
            commands::embeddings::load_embeddings_cache,
            commands::embeddings::save_embeddings_cache,
            commands::system::get_ollama_context_length,
            commands::system::get_system_resources,
            commands::system::stop_ollama_model,
            commands::feedback::submit_feedback,
            commands::web_search::search_web,
            commands::journal::list_local_entries_for_sync,
            commands::journal::write_entry_with_timestamp,
            commands::journal::set_file_timestamp,
            commands::journal::read_sync_base,
            commands::journal::write_sync_base,
            commands::journal::delete_sync_base,
            commands::oauth::start_gdrive_auth,
            commands::oauth::get_gdrive_token,
            commands::oauth::check_gdrive_connected,
            commands::oauth::disconnect_gdrive,
            commands::backup::create_journal_backup,
            commands::backup::list_journal_backups,
            commands::backup::restore_journal_backup,
            debug::write_debug_payload // DEBUG
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
