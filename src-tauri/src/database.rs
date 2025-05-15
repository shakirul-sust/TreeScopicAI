use rusqlite::{Connection, Result, params, OpenFlags};
use serde::{Serialize, Deserialize};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};
use std::fs;
use std::collections::HashMap;

#[derive(Clone)]
pub struct DbConnection {
    _path: String,
    conn: Arc<Mutex<Connection>>,
}

#[derive(Serialize, Deserialize)]
pub struct Species {
    id: i64,
    scientific_name: String,
    common_name: String,
    family: String,
    description: String,
    habitat: Option<String>,
    distribution: Option<String>,
    properties: Option<String>,
    uses: Option<String>,
    conservation_status: Option<String>,
    image_url: Option<String>,
}

impl DbConnection {
    pub fn new(db_path: String) -> Result<Self> {
        let conn = Connection::open_with_flags(
            &db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE | OpenFlags::SQLITE_OPEN_URI | OpenFlags::SQLITE_OPEN_NO_MUTEX
        )?;
        
        Ok(DbConnection {
            _path: db_path,
            conn: Arc::new(Mutex::new(conn)),
        })
    }
    
    pub fn validate_activation_key(&self, key: &str) -> Result<bool> {
        // Special keys that work in both desktop and web versions
        let special_keys = [
            "eb9613ca2d9ac438553debfb77426ee8",
            "3eb7c8193d9a65cf5440090763a64ecf",
            "9d5240bb66cba84e5e2a55544c1ba431",
            "3755c9402da1b3525dbb3088dfb08084",
            "1befff97c87c21329365adda93b840a8"
        ];
        
        // Check if the provided key is one of our special keys
        if special_keys.contains(&key) {
            return Ok(true);
        }
        
        // Continue with the normal database check
        let query = "SELECT COUNT(*) FROM activation_keys WHERE key_hash = ? AND is_used = 0";
        let conn = self.conn.lock().unwrap();
        let count: i64 = conn.query_row(query, params![key], |row| row.get(0))?;
        
        Ok(count > 0)
    }
    
    pub fn mark_key_as_used(&self, key: &str, device_id: &str) -> Result<bool> {
        // Special keys that work in both desktop and web versions 
        let special_keys = [
            "eb9613ca2d9ac438553debfb77426ee8",
            "3eb7c8193d9a65cf5440090763a64ecf",
            "9d5240bb66cba84e5e2a55544c1ba431",
            "3755c9402da1b3525dbb3088dfb08084",
            "1befff97c87c21329365adda93b840a8"
        ];
        
        // For special keys, we don't need to mark anything in the database
        // They remain valid for multiple activations
        if special_keys.contains(&key) {
            return Ok(true);
        }
        
        // For regular keys, mark them as used in the database
        let update_query = "
            UPDATE activation_keys 
            SET is_used = 1, used_by = ?, used_at = CURRENT_TIMESTAMP 
            WHERE key_hash = ? AND is_used = 0
        ";
        
        let conn = self.conn.lock().unwrap();
        let rows_affected = conn.execute(update_query, params![device_id, key])?;
        
        Ok(rows_affected > 0)
    }
    
    pub fn ensure_species_data_loaded(&self, resource_path: &str) -> Result<()> {
        let mut conn = self.conn.lock().unwrap();
        
        // Check if we already have species data
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM species", [], |row| row.get(0)).unwrap_or(0);
        if count > 0 {
            return Ok(()); // Data already exists
        }
        
        eprintln!("Loading species data from resource file: {}", resource_path);
        
        // Load the JSON resource file
        let json_content = match fs::read_to_string(resource_path) {
            Ok(content) => content,
            Err(e) => {
                eprintln!("Failed to read species data file: {}", e);
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        };
        
        // Parse the JSON
        let species_data: HashMap<String, Value> = match serde_json::from_str(&json_content) {
            Ok(data) => data,
            Err(e) => {
                eprintln!("Failed to parse species data JSON: {}", e);
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        };
        
        // Start a transaction
        let tx = conn.transaction()?;
        
        // Insert each species
        for (scientific_name, data) in species_data {
            let family = data["family"].as_str().unwrap_or("");
            let common_name = match data["local_name"].as_array() {
                Some(names) if !names.is_empty() => {
                    names[0].as_str().unwrap_or("").to_string()
                },
                _ => "".to_string()
            };
            
            // Create the description from notes or other fields
            let description = data["notes"].as_str().unwrap_or("").to_string();
            
            // Convert usages to string if present
            let uses = match data["usages"].as_array() {
                Some(usages) => {
                    let usage_strings: Vec<String> = usages.iter()
                        .filter_map(|u| u.as_str().map(|s| s.to_string()))
                        .collect();
                    Some(usage_strings.join(", "))
                },
                None => None
            };
            
            // Insert into species table
            let species_id = tx.execute(
                "INSERT INTO species (scientific_name, common_name, family, description, uses) VALUES (?, ?, ?, ?, ?)",
                params![scientific_name, common_name, family, description, uses],
            )?;
            
            // Create model labels with scientific name and scientific_name + local_name format
            tx.execute(
                "INSERT INTO model_labels (species_id, label) VALUES (?, ?)",
                params![species_id, scientific_name],
            )?;
            
            // Add scientific_name_common_name format
            if !common_name.is_empty() {
                let combined_label = format!("{}_{}", scientific_name, common_name);
                tx.execute(
                    "INSERT INTO model_labels (species_id, label) VALUES (?, ?)",
                    params![species_id, combined_label],
                )?;
            }
        }
        
        // Commit the transaction
        tx.commit()?;
        eprintln!("Successfully loaded species data into the database");
        
        Ok(())
    }
    
    pub fn get_species_by_label(&self, label: &str) -> Result<Value> {
        // Extract scientific name if label contains an underscore (model format: "Scientific_LocalName")
        let mut scientific_name = label.to_string();
        if let Some(underscore_pos) = label.find('_') {
            scientific_name = label[0..underscore_pos].to_string();
        }
        
        eprintln!("Searching for species with label: {}, scientific name: {}", label, scientific_name);
        
        // Print connection info for debugging
        eprintln!("Database path being used: {}", self._path);
        
        // Try with the exact label first
        let query = "
            SELECT s.* 
            FROM species s
            JOIN model_labels ml ON s.id = ml.species_id
            WHERE ml.label = ?
            LIMIT 1
        ";
        
        eprintln!("Executing exact label query: {} with param: {}", query, label);
        
        let conn = self.conn.lock().unwrap();
        
        // Test direct query first for debugging
        match conn.prepare("SELECT COUNT(*) FROM model_labels WHERE label = ?") {
            Ok(mut stmt) => {
                match stmt.query_row([label], |row| row.get::<_, i64>(0)) {
                    Ok(count) => {
                        eprintln!("Count of matching labels: {}", count);
                    },
                    Err(e) => {
                        eprintln!("Error in count query: {}", e);
                    }
                }
            },
            Err(e) => {
                eprintln!("Error preparing count query: {}", e);
            }
        }
        
        // First try exact match with label
        match conn.query_row(query, params![label], |row| {
            extract_species_from_row(row)
        }) {
            Ok(species) => {
                eprintln!("Found species in database with exact label match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("Exact label match failed: {}", e);
            }
        }
        
        // Instead of exact match, try a substring match on label
        let substring_query = "
            SELECT s.* 
            FROM species s
            JOIN model_labels ml ON s.id = ml.species_id
            WHERE ml.label LIKE ?
            LIMIT 1
        ";
        
        let pattern = format!("%{}%", label);
        eprintln!("Trying substring match with pattern: {}", pattern);
        
        match conn.query_row(substring_query, params![pattern], |row| {
            extract_species_from_row(row)
        }) {
            Ok(species) => {
                eprintln!("Found species in database with label substring match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("Label substring match failed: {}", e);
            }
        }
        
        // Also try substring match in the scientific name field directly
        let scientific_name_query = "
            SELECT s.* 
            FROM species s
            WHERE s.scientific_name LIKE ?
            LIMIT 1
        ";
        
        let scientific_pattern = format!("%{}%", scientific_name);
        eprintln!("Trying scientific name substring match with pattern: {}", scientific_pattern);
        
        match conn.query_row(scientific_name_query, params![scientific_pattern], |row| {
            extract_species_from_row(row)
        }) {
            Ok(species) => {
                eprintln!("Found species in database with scientific name substring match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("Scientific name substring match failed: {}", e);
            }
        }
        
        // Try with just the first word of scientific name
        let first_word = scientific_name.split_whitespace().next().unwrap_or(&scientific_name);
        let first_word_pattern = format!("%{}%", first_word);
        eprintln!("Trying first word match with pattern: {}", first_word_pattern);
        
        match conn.query_row(
            "SELECT s.* FROM species s WHERE s.scientific_name LIKE ? LIMIT 1", 
            params![first_word_pattern], 
            |row| extract_species_from_row(row)
        ) {
            Ok(species) => {
                eprintln!("Found species in database with first word match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("First word match failed: {}", e);
            }
        }
        
        // Add debugging - print all available labels
        eprintln!("Debugging - Available labels in database:");
        match conn.prepare("SELECT label FROM model_labels LIMIT 20") {
            Ok(mut stmt) => {
                let label_iter = stmt.query_map([], |row| {
                    let label: String = row.get(0)?;
                    Ok(label)
                });
                
                if let Ok(labels) = label_iter {
                    for label_result in labels {
                        if let Ok(label) = label_result {
                            eprintln!("  Label: {}", label);
                        }
                    }
                }
            },
            Err(e) => {
                eprintln!("Error querying available labels: {}", e);
            }
        }
        
        // Fall back to common name search
        let common_name_query = "
            SELECT s.* 
            FROM species s
            WHERE s.common_name LIKE ?
            LIMIT 1
        ";
        
        let common_name_pattern = format!("%{}%", label);
        eprintln!("Trying common name search with pattern: {}", common_name_pattern);
        
        match conn.query_row(common_name_query, params![common_name_pattern], |row| {
            extract_species_from_row(row)
        }) {
            Ok(species) => {
                eprintln!("Found species in database with common name match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("Common name match failed: {}", e);
            }
        }
        
        // Last resort - try any field with the pattern
        let any_field_query = "
            SELECT s.* 
            FROM species s
            WHERE s.scientific_name LIKE ? 
               OR s.common_name LIKE ?
               OR s.family LIKE ?
            LIMIT 1
        ";
        
        let any_pattern = format!("%{}%", scientific_name);
        match conn.query_row(any_field_query, params![any_pattern, any_pattern, any_pattern], |row| {
            extract_species_from_row(row)
        }) {
            Ok(species) => {
                eprintln!("Found species in database with any field match");
                return Ok(species);
            },
            Err(e) => {
                eprintln!("Any field match failed: {}", e);
            }
        }
        
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

// Helper function to extract species data from a database row
fn extract_species_from_row(row: &rusqlite::Row) -> Result<Value> {
    let species = Species {
        id: row.get(0)?,
        scientific_name: row.get(1)?,
        common_name: row.get(2)?,
        family: row.get(3)?,
        description: row.get(4)?,
        habitat: row.get(5)?,
        distribution: row.get(6)?,
        properties: row.get(7)?,
        uses: row.get(8)?,
        conservation_status: row.get(9)?,
        image_url: row.get(10)?,
    };
    
    // Try to parse additional properties from the properties field
    let mut properties_value = serde_json::Value::Null;
    if let Some(props_str) = &species.properties {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(props_str) {
            properties_value = parsed;
        }
    }
    
    // Try to parse uses array from the uses field
    let mut uses_value = serde_json::Value::Null;
    if let Some(uses_str) = &species.uses {
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(uses_str) {
            uses_value = parsed;
        }
    }
    
    Ok(json!({
        "id": species.id,
        "scientific_name": species.scientific_name,
        "common_name": species.common_name,
        "family": species.family,
        "description": species.description,
        "habitat": species.habitat,
        "distribution": species.distribution,
        "properties": properties_value,
        "uses": uses_value,
        "conservation_status": species.conservation_status,
        "image_url": species.image_url,
    }))
} 