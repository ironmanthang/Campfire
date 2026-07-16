use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SystemResources {
    pub gpu_raw: String,
    pub ollama_ps_raw: String,
    pub cpu_raw: String,
    pub ram_raw: String,
}

fn run_system_cmd(program: String, args: Vec<String>) -> String {
    use std::process::Command;
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd")
            .arg("/C")
            .arg(&program)
            .args(&args)
            .output()
    } else {
        Command::new(&program)
            .args(&args)
            .output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                stdout.trim().to_string()
            } else {
                format!("Error: {}\n{}", stderr.trim(), stdout.trim())
            }
        }
        Err(e) => format!("Failed to execute command: {}", e),
    }
}

#[tauri::command]
pub async fn get_system_resources() -> Result<SystemResources, String> {
    let handle_gpu = std::thread::spawn(|| run_system_cmd("nvidia-smi".to_string(), vec![]));
    let handle_ollama = std::thread::spawn(|| run_system_cmd("ollama".to_string(), vec!["ps".to_string()]));
    let handle_cpu = std::thread::spawn(|| run_system_cmd("powershell".to_string(), vec![
        "-Command".to_string(),
        "Get-CimInstance Win32_Processor | Select-Object LoadPercentage".to_string()
    ]));
    let handle_ram = std::thread::spawn(|| run_system_cmd("powershell".to_string(), vec![
        "-Command".to_string(),
        "Get-CimInstance Win32_OperatingSystem | Select-Object FreePhysicalMemory,TotalVisibleMemorySize".to_string()
    ]));

    let gpu_raw = handle_gpu.join().unwrap_or_else(|_| "Failed to query GPU".to_string());
    let ollama_ps_raw = handle_ollama.join().unwrap_or_else(|_| "Failed to query Ollama".to_string());
    let cpu_raw = handle_cpu.join().unwrap_or_else(|_| "Failed to query CPU".to_string());
    let ram_raw = handle_ram.join().unwrap_or_else(|_| "Failed to query RAM".to_string());

    Ok(SystemResources {
        gpu_raw,
        ollama_ps_raw,
        cpu_raw,
        ram_raw,
    })
}

#[tauri::command]
pub fn stop_ollama_model(model: String) -> Result<String, String> {
    let result = run_system_cmd("ollama".to_string(), vec!["stop".to_string(), model]);
    Ok(result)
}

#[tauri::command]
pub fn get_ollama_context_length() -> Result<u32, String> {
    let local_app_data = std::env::var("LOCALAPPDATA")
        .map_err(|_| "LOCALAPPDATA environment variable not found".to_string())?;
    
    let db_path = Path::new(&local_app_data)
        .join("Ollama")
        .join("db.sqlite");
        
    if !db_path.exists() {
        return Err("Ollama db.sqlite not found".to_string());
    }

    let output = std::process::Command::new("sqlite3")
        .arg(db_path.to_string_lossy().to_string())
        .arg("SELECT context_length FROM settings LIMIT 1;")
        .output();

    match output {
        Ok(out) => {
            if out.status.success() {
                let stdout_str = String::from_utf8_lossy(&out.stdout);
                let trimmed = stdout_str.trim();
                if let Ok(val) = trimmed.parse::<u32>() {
                    if val > 0 {
                        return Ok(val);
                    }
                }
                Err("No custom context length set in Ollama settings".to_string())
            } else {
                let stderr_str = String::from_utf8_lossy(&out.stderr);
                Err(format!("sqlite3 execution failed: {}", stderr_str))
            }
        }
        Err(e) => {
            Err(format!("Failed to execute sqlite3 CLI: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_laptop_brightness() -> Result<u32, String> {
    #[cfg(target_os = "windows")]
    {
        let output = run_system_cmd("powershell".to_string(), vec![
            "-Command".to_string(),
            "(Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightness).CurrentBrightness".to_string()
        ]);
        if output.starts_with("Error:") || output.starts_with("Failed") {
            return Err(output);
        }
        let parsed = output.trim().parse::<u32>()
            .map_err(|e| format!("Failed to parse brightness value '{}': {}", output, e))?;
        Ok(parsed)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Unsupported operating system".to_string())
    }
}

#[tauri::command]
pub fn set_laptop_brightness(brightness: u32) -> Result<(), String> {
    if brightness > 100 {
        return Err("Brightness value must be between 0 and 100".to_string());
    }
    #[cfg(target_os = "windows")]
    {
        let output = run_system_cmd("powershell".to_string(), vec![
            "-Command".to_string(),
            format!(
                "Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{{Brightness = {}; Timeout = 1}}",
                brightness
            )
        ]);
        if output.starts_with("Error:") || output.starts_with("Failed") {
            return Err(output);
        }
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Unsupported operating system".to_string())
    }
}
