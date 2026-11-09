#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod pdf;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![pdf::compile_pdf])
        .run(tauri::generate_context!())
        .expect("No se pudo iniciar ScribeTex");
}
