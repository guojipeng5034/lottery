#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // 在 Windows 上设置 DPI 感知模式，防止系统缩放影响应用布局
  // 这会让应用正确处理不同显示器的 DPI，保持一致的显示效果
  #[cfg(target_os = "windows")]
  {
    use winapi::um::shellscalingapi::*;
    unsafe {
      // 设置为 Per-Monitor DPI Aware
      // PROCESS_PER_MONITOR_DPI_AWARE: 应用会为每个显示器使用正确的 DPI
      // 这样可以防止系统缩放影响应用布局，让应用在不同 DPI 下保持一致
      SetProcessDpiAwareness(PROCESS_PER_MONITOR_DPI_AWARE);
    }
  }

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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
