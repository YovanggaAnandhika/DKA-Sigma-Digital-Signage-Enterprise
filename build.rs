use std::fs;
use std::path::{Path, PathBuf};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("cargo:rerun-if-changed=proto");

    let proto_dir = Path::new("proto");
    let mut proto_files = Vec::new();

    collect_proto_files(proto_dir, &mut proto_files)?;

    if proto_files.is_empty() {
        panic!("No .proto files found in {:?}", proto_dir);
    }

    println!("Discovered {} proto files for compilation:", proto_files.len());
    for file in &proto_files {
        println!("cargo:rerun-if-changed={}", file.display());
    }

    tonic_build::configure()
        .compile(&proto_files, &[proto_dir])?;

    Ok(())
}

fn collect_proto_files(dir: &Path, files: &mut Vec<PathBuf>) -> Result<(), std::io::Error> {
    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                collect_proto_files(&path, files)?;
            } else if path.extension().and_then(|s| s.to_str()) == Some("proto") {
                files.push(path);
            }
        }
    }
    Ok(())
}
