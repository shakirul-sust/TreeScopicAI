use rusqlite::{Connection, Result, params};
use serde_json::Value;
use std::fs;
use std::path::Path;
use std::error::Error;

pub fn import_species_data(json_path: &str, db_path: &str) -> Result<(), Box<dyn Error>> {
    println!("Starting import from {} to {}", json_path, db_path);
    
    // Read the JSON file
    let json_content = fs::read_to_string(json_path)?;
    let species_data: Value = serde_json::from_str(&json_content)?;
    
    // Connect to the database
    let mut conn = Connection::open(db_path)?;
    
    // Create tables if they don't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS species (
            id INTEGER PRIMARY KEY,
            scientific_name TEXT NOT NULL,
            common_name TEXT NOT NULL,
            family TEXT NOT NULL,
            description TEXT,
            habitat TEXT,
            distribution TEXT,
            properties TEXT,
            uses TEXT,
            conservation_status TEXT,
            image_url TEXT
        )",
        [],
    )?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS model_labels (
            id INTEGER PRIMARY KEY,
            species_id INTEGER NOT NULL,
            label TEXT NOT NULL,
            FOREIGN KEY (species_id) REFERENCES species (id)
        )",
        [],
    )?;
    
    // Begin transaction
    let tx = conn.transaction()?;
    
    let mut species_count = 0;
    let mut label_count = 0;
    
    // Process each species in the JSON
    if let Some(obj) = species_data.as_object() {
        for (scientific_name, data) in obj {
            // Extract data from JSON
            if let Some(data_obj) = data.as_object() {
                let family = data_obj.get("family").and_then(Value::as_str).unwrap_or("");
                
                // Get local_name array and create comma-separated string for common_name
                let common_name = if let Some(local_names) = data_obj.get("local_name").and_then(Value::as_array) {
                    local_names
                        .iter()
                        .filter_map(|v| v.as_str())
                        .collect::<Vec<&str>>()
                        .join(", ")
                } else {
                    scientific_name.clone()
                };
                
                // Create a JSON string for properties that includes wood_anatomy
                let mut properties_obj = serde_json::json!({});
                
                // Add wood anatomy if available
                if let Some(wood_anatomy) = data_obj.get("wood_anatomy") {
                    if let Some(wood_obj) = wood_anatomy.as_object() {
                        for (key, value) in wood_obj {
                            properties_obj[key] = value.clone();
                        }
                    }
                }
                
                // Add additional properties of interest
                for prop in &["tree_height_m", "tree_height_range", "bark_thickness_mm", 
                             "bark_thickness_range", "shade_tolerant", "shade_intolerant", 
                             "flowering_time", "fruiting_time", "deciduous"] {
                    if let Some(value) = data_obj.get(*prop) {
                        properties_obj[*prop] = value.clone();
                    }
                }
                
                let properties = serde_json::to_string(&properties_obj)?;
                
                // Create a JSON string for uses
                let uses = if let Some(usages) = data_obj.get("usages") {
                    serde_json::to_string(usages)?
                } else {
                    "[]".to_string()
                };
                
                // Get description/notes
                let description = data_obj.get("notes").and_then(Value::as_str).unwrap_or("");
                
                // Insert into species table
                tx.execute(
                    "INSERT OR REPLACE INTO species 
                     (scientific_name, common_name, family, description, properties, uses) 
                     VALUES (?, ?, ?, ?, ?, ?)",
                    params![scientific_name, common_name, family, description, properties, uses],
                )?;
                
                // Get the inserted ID
                let species_id = tx.last_insert_rowid();
                species_count += 1;
                
                // Create model label from scientific name
                let model_label = format!("{}_{}",
                    scientific_name,
                    if common_name.contains(", ") {
                        common_name.split(", ").next().unwrap_or("")
                    } else {
                        &common_name
                    }
                );
                
                // Insert into model_labels table
                tx.execute(
                    "INSERT OR REPLACE INTO model_labels (species_id, label) VALUES (?, ?)",
                    params![species_id, model_label],
                )?;
                label_count += 1;
                
                // Add additional labels for local names
                if let Some(local_names) = data_obj.get("local_name").and_then(Value::as_array) {
                    for local_name in local_names.iter().filter_map(Value::as_str) {
                        let label = format!("{}_{}", scientific_name, local_name);
                        tx.execute(
                            "INSERT OR IGNORE INTO model_labels (species_id, label) VALUES (?, ?)",
                            params![species_id, label],
                        )?;
                        label_count += 1;
                    }
                }
            }
        }
    }
    
    // Commit transaction
    tx.commit()?;
    
    println!("Import completed successfully!");
    println!("Imported {} species with {} labels", species_count, label_count);
    
    Ok(())
}

// Command line utility function to run the import
pub fn run_import() -> Result<(), Box<dyn Error>> {
    let args: Vec<String> = std::env::args().collect();
    
    if args.len() < 3 {
        println!("Usage: {} <path/to/species_data.json> <path/to/species.db>", args[0]);
        return Ok(());
    }
    
    let json_path = &args[1];
    let db_path = &args[2];
    
    // Verify files exist
    if !Path::new(json_path).exists() {
        return Err(format!("JSON file not found: {}", json_path).into());
    }
    
    import_species_data(json_path, db_path)?;
    
    Ok(())
} 