use std::fs;
use std::path::PathBuf;

fn main() {
    tauri_build::build();

    // Read the developer's .env file (shared with Vite) and forward
    // the Google OAuth client secret to the Rust compiler so the
    // `env!("VITE_GOOGLE_CLIENT_SECRET")` lookup in `commands::oauth`
    // resolves at build time.
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let candidates = [
        manifest_dir.join("..").join(".env"),
        manifest_dir.join("..").join("..").join("desktop").join(".env"),
    ];

    let mut client_id = String::new();
    let mut client_secret = String::new();

    for env_path in &candidates {
        if let Ok(content) = fs::read_to_string(env_path) {
            for line in content.lines() {
                let line = line.trim();
                if line.is_empty() || line.starts_with('#') {
                    continue;
                }
                if let Some(rest) = line.strip_prefix("VITE_GOOGLE_CLIENT_ID=") {
                    client_id = rest.trim().to_string();
                } else if let Some(rest) = line.strip_prefix("VITE_GOOGLE_CLIENT_SECRET=") {
                    client_secret = rest.trim().to_string();
                }
            }
            if !client_id.is_empty() || !client_secret.is_empty() {
                break;
            }
        }
    }

    println!("cargo:rerun-if-changed={}", manifest_dir.join("..").join(".env").display());
    println!("cargo:rerun-if-env-changed=VITE_GOOGLE_CLIENT_ID");
    println!("cargo:rerun-if-env-changed=VITE_GOOGLE_CLIENT_SECRET");

    // Allow process env to override (useful for CI / Store build pipelines).
    if let Ok(v) = std::env::var("VITE_GOOGLE_CLIENT_ID") {
        if !v.is_empty() { client_id = v; }
    }
    if let Ok(v) = std::env::var("VITE_GOOGLE_CLIENT_SECRET") {
        if !v.is_empty() { client_secret = v; }
    }

    if client_id.is_empty() {
        panic!(
            "VITE_GOOGLE_CLIENT_ID is missing. Add it to desktop/.env or set it in the build environment."
        );
    }
    if client_secret.is_empty() {
        panic!(
            "VITE_GOOGLE_CLIENT_SECRET is missing. Add it to desktop/.env or set it in the build environment."
        );
    }

    println!("cargo:rustc-env=VITE_GOOGLE_CLIENT_ID={}", client_id);
    println!("cargo:rustc-env=VITE_GOOGLE_CLIENT_SECRET={}", client_secret);
}
