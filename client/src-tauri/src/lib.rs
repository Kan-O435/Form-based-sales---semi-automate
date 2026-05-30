use std::io::{BufRead, BufReader, Write};
use std::sync::Mutex;
use tauri::{Emitter, Manager};

struct AppState {
    pending_stdin: Mutex<Option<std::process::ChildStdin>>,
}

// 手動確認が必要なステータス（useAutomation.ts の MANUAL_REVIEW_STATUSES と同期）
const MANUAL_STATUSES: &[&str] = &[
    "no_contact_page",
    "inquiry_type_mismatch",
    "submit_failed",
    "validation_failed",
    "form_parse_failed",
    "cloudflare_blocked",
    "captcha_detected",
    "unknown_error",
];

/// ユーザー確認後に呼ばれる。'exit' を送信して Node.js を終了させる。
#[tauri::command]
async fn release_browser(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.pending_stdin.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut stdin) = *guard {
        let _ = stdin.write_all(b"exit\n");
        let _ = stdin.flush();
    }
    *guard = None;
    Ok(())
}

/// 現在開いている Chromium のページでフォーム解析・入力を実行する。
#[tauri::command]
async fn fill_current_page(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let mut guard = state.pending_stdin.lock().map_err(|e| e.to_string())?;
    if let Some(ref mut stdin) = *guard {
        let _ = stdin.write_all(b"fill\n");
        let _ = stdin.flush();
    }
    Ok(())
}

#[tauri::command]
async fn launch_browser(
    app: tauri::AppHandle,
    company_name: String,
    profile: serde_json::Value,
) -> Result<(), String> {
    let script_path = concat!(env!("CARGO_MANIFEST_DIR"), "/../scripts/automation.js");
    let client_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/..");
    let profile_json = serde_json::to_string(&profile).map_err(|e| e.to_string())?;

    tauri::async_runtime::spawn_blocking(move || -> Result<(), String> {
        let mut child = std::process::Command::new("node")
            .arg(script_path)
            .arg(&company_name)
            .arg(&profile_json)
            .current_dir(client_dir)
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .spawn()
            .map_err(|e| format!("node の起動に失敗しました: {}", e))?;

        // stdin は手動確認ケース用に取り出しておく
        let mut child_stdin = child.stdin.take();

        // stderr を別スレッドで読んでフロントエンドに転送
        if let Some(stderr) = child.stderr.take() {
            let app_err = app.clone();
            std::thread::spawn(move || {
                for line in BufReader::new(stderr).lines().flatten() {
                    let _ = app_err.emit("automation-status", format!("[エラー] {}", line));
                }
            });
        }

        // stdout を読みながら DONE マーカーを検知したら即座に stdin を AppState に格納する。
        // Node.js は stdin 待ちで stdout を開けたまま止まるため、ループ終了後に格納すると
        // release_browser 呼び出し時に pending_stdin が None のままになりデッドロックする。
        if let Some(stdout) = child.stdout.take() {
            for line in BufReader::new(stdout).lines().flatten() {
                if line.starts_with("[DONE:") && line.ends_with(']') {
                    let status = &line[6..line.len() - 1];
                    if MANUAL_STATUSES.iter().any(|&s| s == status) {
                        if let Some(stdin) = child_stdin.take() {
                            let state = app.state::<AppState>();
                            *state.pending_stdin.lock().unwrap() = Some(stdin);
                        }
                    }
                }
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
        .manage(AppState { pending_stdin: Mutex::new(None) })
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
        .invoke_handler(tauri::generate_handler![launch_browser, release_browser, fill_current_page])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
