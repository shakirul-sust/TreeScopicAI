use std::process;

fn main() {
    if let Err(err) = TreeScopeAI::import_species::run_import() {
        eprintln!("Error: {}", err);
        process::exit(1);
    }
} 