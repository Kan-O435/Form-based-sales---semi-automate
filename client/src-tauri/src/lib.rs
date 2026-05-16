use std::io::{BufRead, BufReader};
use tauri::Emitter;

#[tauri::command]
async fn launch_browser(app: tauri::AppHandle, company_name: String) -> Result<(), String> {
    let script_path = concat!(env!("CARGO_MANIFEST_DIR"), "/../scripts/automation.js");
    let client_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/..");

    tauri::async_runtime::spawn_blocking(move || -> Result<(), String> {
        let mut child = std::process::Command::new("node")
            .arg(script_path)
            .arg(&company_name)
            .current_dir(client_dir)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("node の起動に失敗しました: {}", e))?;

        // stderr を別スレッドで読んでフロントエンドに転送
        if let Some(stderr) = child.stderr.take() {
            let app_err = app.clone();
            std::thread::spawn(move || {
                for line in BufReader::new(stderr).lines().flatten() {
                    let _ = app_err.emit("automation-status", format!("[エラー] {}", line));
                }
            });
        }

        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines().flatten() {
                let _ = app.emit("automation-status", line);
            }
        }

        let status = child.wait().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("自動化スクリプトがエラーで終了しました".to_string());
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![launch_browser])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
