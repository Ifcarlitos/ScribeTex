use std::{
    fs,
    io::{self, Read, Seek, SeekFrom},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, Instant},
};
use tauri::Manager;

static COMPILING: AtomicBool = AtomicBool::new(false);
const MAX_INPUT: usize = 2 * 1024 * 1024;
const MAX_OUTPUT: u64 = 24 * 1024 * 1024;
const TIMEOUT: Duration = Duration::from_secs(300);

struct CompileGuard;
impl Drop for CompileGuard {
    fn drop(&mut self) {
        COMPILING.store(false, Ordering::Release);
    }
}

#[derive(serde::Deserialize)]
pub struct Asset {
    name: String,
    data: Vec<u8>,
}

/// The frontend supplies generated LaTeX, never a shell command or arbitrary paths.
#[tauri::command]
pub async fn compile_pdf(
    app: tauri::AppHandle,
    latex: String,
    assets: Vec<Asset>,
) -> Result<Vec<u8>, String> {
    if latex.len() > MAX_INPUT {
        return Err("El documento es demasiado grande para esta versión (máximo 2 MB).".into());
    }
    if assets.len() > 64
        || assets.iter().map(|asset| asset.data.len()).sum::<usize>() > 20 * 1024 * 1024
    {
        return Err("Las imágenes superan el límite: 64 imágenes y 20 MB en total.".into());
    }
    for asset in &assets {
        let valid_name = asset
            .name
            .strip_prefix("image-")
            .and_then(|rest| rest.rsplit_once('.'))
            .map(|(number, extension)| {
                !number.is_empty()
                    && number.bytes().all(|byte| byte.is_ascii_digit())
                    && matches!(extension, "png" | "jpg")
            })
            .unwrap_or(false);
        let valid_image = (asset.name.ends_with(".png")
            && asset.data.starts_with(b"\x89PNG\r\n\x1a\n"))
            || (asset.name.ends_with(".jpg") && asset.data.starts_with(&[0xff, 0xd8, 0xff]));
        if !valid_name || !valid_image || asset.data.len() > 5 * 1024 * 1024 {
            return Err("Una imagen no es válida. Se admiten PNG y JPEG de hasta 5 MB.".into());
        }
    }
    if COMPILING
        .compare_exchange(false, true, Ordering::Acquire, Ordering::Relaxed)
        .is_err()
    {
        return Err("Ya hay un documento convirtiéndose en PDF.".into());
    }
    let bundled_engine = app
        .path()
        .resource_dir()
        .ok()
        .map(|directory| {
            directory.join("engines").join(if cfg!(windows) {
                "tectonic.exe"
            } else {
                "tectonic"
            })
        })
        .filter(|path| path.is_file());
    tauri::async_runtime::spawn_blocking(move || {
        let _guard = CompileGuard;
        compile(&latex, &assets, bundled_engine)
    })
    .await
    .map_err(|_| "No se pudo completar la conversión a PDF.".to_string())?
}

fn compile(
    latex: &str,
    assets: &[Asset],
    bundled_engine: Option<PathBuf>,
) -> Result<Vec<u8>, String> {
    let directory = tempfile::Builder::new()
        .prefix("scribetex-")
        .tempdir()
        .map_err(|_| "No se pudo crear la carpeta temporal del documento.".to_string())?;
    let root = directory.path();
    fs::write(root.join("document.tex"), latex)
        .map_err(|_| "No se pudo preparar el documento para convertirlo.".to_string())?;
    for asset in assets {
        fs::write(root.join(&asset.name), &asset.data)
            .map_err(|_| "No se pudo preparar una imagen del documento.".to_string())?;
    }

    // Prefer the compact standalone engine; fall back only when it is absent.
    let mut tectonic = Command::new(bundled_engine.unwrap_or_else(|| PathBuf::from("tectonic")));
    tectonic
        .args(["--untrusted", "--keep-logs", "document.tex"])
        .env("TECTONIC_UNTRUSTED_MODE", "1");
    match run_engine(tectonic, root) {
        Ok(()) => {}
        Err(EngineError::Missing) => {
            let mut pdflatex = Command::new("pdflatex");
            pdflatex
                .args([
                    "-no-shell-escape",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    "-file-line-error",
                    "document.tex",
                ])
                .env("openin_any", "p")
                .env("openout_any", "p");
            match run_engine(pdflatex, root) {
                Ok(()) => {}
                Err(EngineError::Missing) => return Err("No se encontró el motor PDF. Instala Tectonic y añádelo al PATH, o utiliza una instalación existente de MiKTeX/TeX Live con pdflatex.".into()),
                Err(EngineError::Failed(message)) => return Err(message),
            }
        }
        Err(EngineError::Failed(message)) => return Err(message),
    }

    let path = root.join("document.pdf");
    let bytes = fs::metadata(&path)
        .map_err(|_| "El motor terminó sin generar un PDF.".to_string())?
        .len();
    if bytes > MAX_OUTPUT {
        return Err("El PDF supera el tamaño máximo de esta versión (24 MB).".into());
    }
    let pdf = fs::read(path).map_err(|_| "No se pudo leer el PDF generado.".to_string())?;
    if !pdf.starts_with(b"%PDF-") {
        return Err("El motor no produjo un archivo PDF válido.".into());
    }
    Ok(pdf)
}

enum EngineError {
    Missing,
    Failed(String),
}

fn run_engine(mut command: Command, directory: &Path) -> Result<(), EngineError> {
    let output = fs::File::create(directory.join("engine-output.log")).map_err(|_| {
        EngineError::Failed("No se pudo preparar el registro del motor PDF.".into())
    })?;
    let error_output = output.try_clone().map_err(|_| {
        EngineError::Failed("No se pudo preparar el registro del motor PDF.".into())
    })?;
    command
        .current_dir(directory)
        .stdin(Stdio::null())
        .stdout(Stdio::from(output))
        .stderr(Stdio::from(error_output));
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }
    let mut child = command.spawn().map_err(|error| {
        if error.kind() == io::ErrorKind::NotFound {
            EngineError::Missing
        } else {
            EngineError::Failed("No se pudo iniciar el motor PDF instalado.".into())
        }
    })?;
    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) if status.success() => return Ok(()),
            Ok(Some(_)) => {
                return Err(EngineError::Failed(format!(
                    "No se pudo convertir el documento. {}",
                    read_diagnostic(directory)
                )));
            }
            Ok(None) => {}
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(EngineError::Failed(
                    "Se perdió la conexión con el motor PDF.".into(),
                ));
            }
        }
        let too_large = ["document.log", "document.pdf", "engine-output.log"]
            .iter()
            .any(|name| {
                fs::metadata(directory.join(name))
                    .map(|metadata| metadata.len() > MAX_OUTPUT)
                    .unwrap_or(false)
            });
        if started.elapsed() > TIMEOUT || too_large {
            let _ = child.kill();
            let _ = child.wait();
            return Err(EngineError::Failed(if too_large {
                "El motor PDF superó el límite de tamaño permitido.".into()
            } else {
                format!("La conversión superó los cinco minutos. En el primer uso Tectonic puede necesitar conexión para descargar fuentes y paquetes; vuelve a intentarlo. {}", read_diagnostic(directory))
            }));
        }
        thread::sleep(Duration::from_millis(50));
    }
}

fn read_diagnostic(directory: &Path) -> String {
    let text = ["engine-output.log", "document.log"]
        .iter()
        .map(|name| read_tail(&directory.join(name)))
        .filter(|tail| !tail.trim().is_empty())
        .collect::<Vec<_>>()
        .join("\n");
    if text.is_empty() {
        return "Comprueba que el motor está actualizado y que dispone de los paquetes del documento.".into();
    }
    // Keep errors bounded and avoid exposing the user's temporary directory.
    text.replace(&directory.to_string_lossy().to_string(), "[documento]")
        .chars()
        .take(6000)
        .collect()
}

fn read_tail(path: &Path) -> String {
    let Ok(mut file) = fs::File::open(path) else {
        return String::new();
    };
    let length = file.metadata().map(|metadata| metadata.len()).unwrap_or(0);
    let _ = file.seek(SeekFrom::Start(length.saturating_sub(4096)));
    let mut bytes = Vec::new();
    let _ = file.take(4096).read_to_end(&mut bytes);
    String::from_utf8_lossy(&bytes).into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Run `npm run smoke:pdf` first to generate the actual serializer fixture and
    /// provision the platform's Tectonic engine. This deliberately uses the same
    /// compile path as the desktop command rather than mocking the subprocess.
    #[test]
    #[ignore = "requires the bundled engine and generated serializer smoke fixture"]
    fn compile_serializer_document_with_bundled_engine() {
        let manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
        let fixture = manifest.join("target/pdf-smoke");
        let source = fs::read_to_string(fixture.join("sample.tex"))
            .expect("Run npm run smoke:pdf before the ignored Rust integration test");
        let mut assets = Vec::new();
        for entry in fs::read_dir(&fixture).expect("serializer smoke directory exists") {
            let path = entry.expect("smoke entry is readable").path();
            let name = path.file_name().unwrap().to_string_lossy().into_owned();
            if name.starts_with("image-") && (name.ends_with(".png") || name.ends_with(".jpg")) {
                assets.push(Asset {
                    name,
                    data: fs::read(path).expect("smoke image is readable"),
                });
            }
        }
        assert!(!assets.is_empty(), "serializer smoke must include an image");
        let engine = manifest.join("engines").join(if cfg!(windows) {
            "tectonic.exe"
        } else {
            "tectonic"
        });
        assert!(engine.is_file(), "bundled engine must exist");
        let pdf = compile(&source, &assets, Some(engine))
            .expect("actual desktop backend should compile the serializer document");
        assert!(pdf.starts_with(b"%PDF-"));
        assert!(
            pdf.len() > 1024,
            "a real document PDF should contain content"
        );
        fs::write(fixture.join("backend.pdf"), pdf).expect("write native backend PDF proof");
    }
}
