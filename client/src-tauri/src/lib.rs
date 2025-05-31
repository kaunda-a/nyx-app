use std::process::{Command, Stdio};
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
async fn check_server_health() -> Result<bool, String> {
    let client = reqwest::Client::new();
    match client.get("http://localhost:8080/health")
        .timeout(std::time::Duration::from_secs(5))
        .send()
        .await
    {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
async fn start_server() -> Result<String, String> {
    // Try to find the server executable
    let server_paths = vec![
        "../server/main.py",
        "./server/main.py",
        "../server/dist/main.exe",
        "./server/dist/main.exe",
        "server.exe"
    ];

    for path in server_paths {
        let path_buf = PathBuf::from(path);
        if path_buf.exists() {
            let result = if path.ends_with(".py") {
                // Run Python script
                Command::new("python")
                    .arg(path)
                    .current_dir("../server")
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
            } else {
                // Run executable
                Command::new(path)
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
            };

            match result {
                Ok(_) => return Ok(format!("Server started from {}", path)),
                Err(e) => log::warn!("Failed to start server from {}: {}", path, e),
            }
        }
    }

    Err("Could not find or start server executable".to_string())
}

#[tauri::command]
async fn open_server_folder() -> Result<(), String> {
    let server_path = PathBuf::from("../server");
    if server_path.exists() {
        tauri::api::shell::open(&tauri::Env::default(), server_path.to_string_lossy(), None)
            .map_err(|e| format!("Failed to open server folder: {}", e))?;
        Ok(())
    } else {
        Err("Server folder not found".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        check_server_health,
        start_server,
        open_server_folder
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Auto-check server health on startup
      let app_handle = app.handle().clone();
      tokio::spawn(async move {
          // Wait a moment for the app to fully initialize
          tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

          // Check if server is running
          match check_server_health().await {
              Ok(true) => log::info!("Server is already running"),
              Ok(false) => {
                  log::info!("Server not running, attempting to start...");
                  match start_server().await {
                      Ok(msg) => log::info!("{}", msg),
                      Err(e) => log::warn!("Failed to auto-start server: {}", e),
                  }
              },
              Err(e) => log::error!("Error checking server health: {}", e),
          }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
